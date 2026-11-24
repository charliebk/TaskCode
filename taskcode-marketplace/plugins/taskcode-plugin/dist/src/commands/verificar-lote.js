/**
 * `taskctl verificar-lote [--push]` — TASK-115 (P-7 de la auditoria del
 * 2026-11-12): la verificacion completa por lote.
 *
 * Con `verificacion_por_lote: true` en la rama base, `finish` de una feature o
 * fix con codigo integra sin la completa y deja en `tarea.md` una linea
 * «pendiente de lote» bajo `## Verificacion por lote`. Este comando, desde la
 * rama de integracion con el arbol limpio:
 * - busca las tareas terminadas cuya ultima linea de esa seccion esta
 *   pendiente (las que entraron desde la ultima completa en verde);
 * - sin pendientes, lo dice y no ejecuta nada;
 * - ejecuta `comando_verificacion` sobre HEAD una sola vez (guarda el memo de
 *   la completa, como finish, y anota la puerta `finish` con modo `lote`);
 * - en verde, anade a cada pendiente «lote en verde en <commit>» y lo commitea;
 * - en rojo, no anota nada y aborta listando esas tareas: son las sospechosas.
 *   La vuelta atras (revertir un merge, abrir un fix) la decide una persona.
 */
import { writeFile } from 'node:fs/promises';
import { rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
import { resolverConfig } from '../core/config.js';
import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
import { PUERTA_FINISH } from '../core/registro-puertas.js';
import { serializeTareaFile } from '../core/tarea-file.js';
import { compararIds } from '../core/task.js';
import { anotarLineaEnSeccion, MARCA_LOTE_VERDE, pendienteDeLote, SECCION_VERIFICACION_LOTE } from '../core/transiciones.js';
import { crearProgreso, entornoConContador } from '../fs/progreso.js';
import { currentBranch, headCommit, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
import { autoCommit } from '../fs/git-commit.js';
import { anotarPuerta } from '../fs/registro-puertas.js';
import { anotarSuite } from './finish-verificacion.js';
import { listTareasEnEstados, readTareaFile } from '../fs/task-store.js';
import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
export class VerificarLoteCommandError extends Error {
    constructor(message) {
        super(message);
        this.name = 'VerificarLoteCommandError';
    }
}
/**
 * Las tareas terminadas pendientes de lote, por ID. TASK-146a (CMD2-11): con
 * listTareasEnEstados, que propaga los errores de lectura (antes un EACCES se
 * tragaba como «sin pendientes»); y una tarea ilegible aborta, porque podria
 * estar pendiente.
 */
async function pendientesDeLote(tareasRoot) {
    const { tareas, ilegibles } = await listTareasEnEstados(tareasRoot, ['terminada']);
    if (ilegibles.length > 0) {
        throw new VerificarLoteCommandError(`[ERROR] taskctl verificar-lote: hay tareas terminadas que no se pueden leer (${ilegibles.join(', ')}), y podrian ` +
            'estar pendientes de lote. Arreglalas y reintenta.');
    }
    const pendientes = [];
    for (const id of tareas.map((t) => t.task.id).sort(compararIds)) {
        const t = await readTareaFile(tareasRoot, id);
        if (t !== null && pendienteDeLote(t.body))
            pendientes.push(t);
    }
    return pendientes;
}
export async function runVerificarLoteCommand(tareasRoot, argv, deps) {
    // TASK-144b (CMD2-14): el nombre del comando sin «taskctl» delante (lo pone
    // el mensaje) y --push / -p con el mismo lector que el resto de comandos.
    rechazarFlagsDesconocidos(argv, ['--push', '-p'], 'verificar-lote', (m) => new VerificarLoteCommandError(m));
    const { push } = extraerPushFlag(argv);
    const cwd = deps.repoCwd;
    const config = resolverConfig(cwd);
    const comando = config.comando_verificacion;
    if (comando === null) {
        throw new VerificarLoteCommandError('[ERROR] taskctl verificar-lote: el proyecto no declara comando_verificacion, asi que no hay completa que ' +
            'correr por lote.');
    }
    const integracion = resolveIntegrationBranch(cwd);
    const rama = currentBranch(cwd);
    if (rama !== integracion) {
        throw new VerificarLoteCommandError(`[ERROR] taskctl verificar-lote: el lote se verifica sobre la rama de integracion "${integracion}", y la ` +
            `rama activa es "${rama === '' ? 'HEAD desacoplado' : rama}". Cambiate (git checkout ${integracion}) y reintenta.`);
    }
    if (!isWorkspaceClean(cwd)) {
        throw new VerificarLoteCommandError('[ERROR] taskctl verificar-lote: el arbol de trabajo tiene cambios sin commitear: el lote se verifica sobre ' +
            'lo integrado, no sobre lo que hay a medias. Commitealos o apartalos y reintenta.');
    }
    const pendientes = await pendientesDeLote(tareasRoot);
    if (pendientes.length === 0) {
        return { pendientes: [], commitVerificado: null, duracionMs: null, autoCommit: null };
    }
    const ids = pendientes.map((t) => t.task.id);
    // TASK-146a (CMD2-10): headCommit lanza si git falla (antes «lote en verde en » sin commit).
    const commit = (deps.commitDeHead ?? headCommit)(cwd);
    const timeoutS = config.timeout_verificacion;
    const inicio = Date.now();
    // MEN-3 (revision TASK-115): como finish, el paso se ve y el comando recibe el contador (TASKCTL_PROGRESO).
    const progreso = deps.progreso ?? crearProgreso(cwd);
    progreso.fase(ids[0], 'finish', ['verificacion lote']);
    progreso.paso('verificacion lote');
    let r;
    try {
        r = ejecutarVerificacion(cwd, comando, timeoutS, {
            env: entornoConContador(process.env, progreso.contador()),
            ...(deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs }),
        });
    }
    catch (e) {
        // MEN-4 (ronda 2): si algo lanza, la fase no se queda en curso con el contador colgado.
        progreso.terminar('abortada');
        throw e;
    }
    progreso.terminar(r.estado === 'verde' ? 'ok' : 'en-rojo');
    anotarPuerta(cwd, {
        puerta: PUERTA_FINISH,
        tarea: '-',
        instante: new Date().toISOString(),
        modo: 'lote',
        duracionS: (Date.now() - inicio) / 1000,
        resultado: r.estado === 'verde' ? 'verde' : 'rojo',
    });
    // TASK-129: el tamano de la completa, anotado a la ultima tarea del lote.
    anotarSuite(cwd, ids[ids.length - 1], inicio, r);
    // Como finish: el memo de la completa solo con el arbol limpio (la huella del commit).
    const limpio = isWorkspaceClean(cwd);
    const huella = limpio ? huellaDelArbol(cwd, comando, timeoutS) : null;
    if (huella !== null)
        guardarMemo(cwd, huella, r);
    if (r.estado !== 'verde') {
        throw new VerificarLoteCommandError(`[ERROR] taskctl verificar-lote: la verificacion completa del lote no sale en verde en "${integracion}" ` +
            `(${commit.slice(0, 7)}). No se ha anotado nada: las tareas siguen pendientes de lote.\n` +
            `Entraron desde la ultima completa en verde (${String(ids.length)}): ${ids.join(', ')}.\n` +
            `${formatearVerificacionRoja(r)}\n` +
            'Busca la causa en esas tareas; revertir un merge o abrir una tarea de arreglo lo decide una persona.');
    }
    if (!limpio) {
        throw new VerificarLoteCommandError(`[ERROR] taskctl verificar-lote: la verificacion salio en verde, pero ha dejado cambios en el arbol ("${comando}" ` +
            'escribe ficheros versionados o no ignorados: mira git status). No se ha anotado nada.');
    }
    const instante = deps.ahora ?? new Date().toISOString();
    for (const t of pendientes) {
        const body = anotarLineaEnSeccion(t.body, SECCION_VERIFICACION_LOTE, `- ${instante}: ${MARCA_LOTE_VERDE} ${commit.slice(0, 7)} (taskctl verificar-lote)`);
        await writeFile(t.filePath, serializeTareaFile(t.task, body), 'utf8');
    }
    const commitResult = autoCommit({
        fase: 'verificar-lote',
        cwd,
        rutas: pendientes.map((t) => t.filePath),
        mensaje: `chore(lote): verificacion completa en verde para ${ids.join(', ')}`,
        push,
    });
    return { pendientes: ids, commitVerificado: commit, duracionMs: r.duracionMs, autoCommit: commitResult };
}
