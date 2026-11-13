/**
 * `taskctl trocear TASK-NNN [--push]` — TASK-121. La salida «trocear» de la
 * regla de una hora: convierte la tarea en TASK-NNNa y crea TASK-NNNb,
 * TASK-NNNc... en 00-planificadas con el objetivo y los criterios de cada
 * parte del plan (seccion `## Troceo`), todas con la MISMA rama. Regenera el
 * ROADMAP en el mismo commit, antes de que nadie empiece TASK-NNNa.
 *
 * Solo lo ejecuta una persona: no hay modo automatico ni lo encadena
 * `siguiente` (su accion con mas de una hora es siempre preguntar).
 *
 * Primero valida y calcula todo; solo despues escribe. Un plan sin partes
 * validas no toca ningun fichero.
 */
import path from 'node:path';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { readTareaFile, moveTareaFile, writeTareaFile, listExistingTaskIds } from '../fs/task-store.js';
import { resolverPlanFinal } from './plan.js';
import { planRedactado } from './approve.js';
import { ensureBaseBranchReady, runGit } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore } from '../fs/git-commit.js';
import { esIdTroceable, leerPartes, planificarTroceo, planTrasTroceo, TroceoError } from '../core/troceo.js';
export class TrocearCommandError extends Error {
}
export const FLAGS_TROCEAR = ['--push', '-p'];
export async function runTrocearCommand(tareasRoot, argv, today, deps) {
    rechazarFlagsDesconocidos(argv, FLAGS_TROCEAR, 'trocear', (m) => new TrocearCommandError(m));
    const { push, resto } = extraerPushFlag(argv);
    const id = resto[0];
    if (id === undefined || id.trim() === '') {
        throw new TrocearCommandError('[ERROR] Falta el ID de la tarea: taskctl trocear TASK-NNN.');
    }
    if (!/^TASK-\d{3,}[a-z]?$/.test(id)) {
        throw new TrocearCommandError(`[ERROR] "${id}" no es un ID de tarea valido (se espera TASK-NNN).`);
    }
    if (!esIdTroceable(id)) {
        throw new TrocearCommandError(`[ERROR] ${id}: ya es una parte de un troceo; una parte no se vuelve a trocear.`);
    }
    const inicial = await readTareaFile(tareasRoot, id);
    if (inicial === null) {
        throw new TrocearCommandError(`[ERROR] ${id}: no se encuentra en tareas/ de la rama actual.`);
    }
    const baseBranchGuard = ensureBaseBranchReady(inicial.task.tipo, deps.repoCwd);
    const leida = await readTareaFile(tareasRoot, id);
    if (leida === null) {
        throw new TrocearCommandError(`[ERROR] ${id}: no se encuentra en tareas/ de la rama base.`);
    }
    const { task, body, filePath } = leida;
    if (task.estado !== 'en-diseno' || task.plan_aprobado) {
        throw new TrocearCommandError(`[ERROR] ${id}: solo se trocea una tarea en diseno con el plan sin aprobar ` +
            `(esta en "${task.estado}"${task.plan_aprobado ? ', con el plan aprobado' : ''}).`);
    }
    const taskDir = path.dirname(filePath);
    if (!(await planRedactado(task, taskDir))) {
        throw new TrocearCommandError(`[ERROR] ${id}: no hay plan redactado. Las partes se declaran en su seccion "## Troceo".`);
    }
    const u = await resolverPlanFinal(taskDir);
    const rutaPlan = u.canonicaExiste ? u.canonica : u.legada;
    const plan = await readFile(rutaPlan, 'utf8');
    let troceo;
    let partes;
    try {
        partes = leerPartes(plan, id);
        troceo = planificarTroceo(task, body, partes, today);
    }
    catch (e) {
        if (e instanceof TroceoError)
            throw new TrocearCommandError(`[ERROR] ${e.message} No se ha tocado nada.`);
        throw e;
    }
    const existentes = new Set(await listExistingTaskIds(tareasRoot));
    const ocupados = troceo.ids.filter((x) => existentes.has(x));
    if (ocupados.length > 0) {
        throw new TrocearCommandError(`[ERROR] ${id}: ya existen ${ocupados.join(', ')}. Revisa tareas/ a mano; no se ha tocado nada.`);
    }
    // Escritura: el plan primero (en la carpeta vieja), luego el movimiento de
    // la carpeta entera a TASK-NNNa y por ultimo las partes nuevas.
    // MEN-5 de la revision: si algo falla a medias, se deshace. El arbol estaba
    // limpio (ensureBaseBranchReady), asi que basta con borrar lo creado y
    // devolver la carpeta original a como esta en HEAD.
    const escribirParte = deps.escribirParte ?? writeTareaFile;
    const ficheros = [];
    const creadas = [];
    try {
        await writeFile(rutaPlan, planTrasTroceo(plan, partes, troceo.ids, today), 'utf8');
        const ficheroA = await moveTareaFile(tareasRoot, filePath, troceo.parteA.task, troceo.parteA.body);
        creadas.push(path.dirname(ficheroA));
        ficheros.push(ficheroA);
        for (const p of troceo.resto) {
            creadas.push(path.join(tareasRoot, '00-planificadas', p.task.id));
            ficheros.push(await escribirParte(tareasRoot, p.task, p.body, { failIfExists: true }));
        }
    }
    catch (e) {
        for (const dir of creadas)
            await rm(dir, { recursive: true, force: true });
        runGit(['checkout', 'HEAD', '--', path.relative(deps.repoCwd, taskDir).split(path.sep).join('/')], deps.repoCwd);
        throw new TrocearCommandError(`[ERROR] ${id}: el troceo fallo a medias (${e instanceof Error ? e.message : String(e)}) y se ha deshecho: ` +
            'la tarea sigue entera, como estaba.');
    }
    const commitResult = autoCommit({
        fase: 'trocear',
        cwd: deps.repoCwd,
        rutas: [taskDir, ...ficheros.map((f) => path.dirname(f))],
        mensaje: mensajeChore(id, `troceo en ${troceo.ids.join(', ')}`),
        push,
        roadmap: true,
    });
    return { id, ids: troceo.ids, ficheros, baseBranchGuard, autoCommit: commitResult };
}
