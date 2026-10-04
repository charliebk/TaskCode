/**
 * `taskctl siguiente TASK-NNN [--json]` — TASK-056.
 *
 * Dice que fase toca y que hacer con ella (detener, preguntar o continuar)
 * segun el estado de la tarea y su modo de flujo. Es lo que leen las fases
 * guiadas: ellas no deciden, ejecutan lo que esto devuelve. Solo lee: no
 * escribe ni commitea nada.
 *
 * DE DONDE LEE. Del working tree, salvo un caso: si la tarea tiene su rama
 * en local, no se esta en ella y esa rama no esta integrada en la actual,
 * la tarea vive alli (desde `start`, la rama base solo tiene la copia
 * anterior). Entonces se lee de la rama con `git show`, tarea y revision/.
 * Asi `siguiente` da lo mismo desde la rama base que desde la de la tarea.
 */
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { readTareaFile } from '../fs/task-store.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { resolverConfig } from '../core/config.js';
import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
import { siguienteFase } from '../core/flujo.js';
import { veredictoDeRonda } from '../core/informe-revision.js';
import { INFORME_REVISION_RE, informesDeUltimaRonda, nombresDeUltimaRonda, } from '../fs/rondas.js';
import { currentBranch, isAncestor, localBranchExists, lsTreeNames, showFileAtRef, } from '../fs/git.js';
import { REVISION_DIRNAME } from './review.js';
import { INFORME_CODEX_RE } from './codex-review.js';
import { planRedactado } from './approve.js';
export class SiguienteCommandError extends Error {
}
/** Veredicto de una ronda a partir de sus informes; null si no hay ninguno. */
function veredictoDe(informes) {
    return informes.length === 0 ? null : veredictoDeRonda(informes);
}
export async function runSiguienteCommand(tareasRoot, argv, deps) {
    const json = argv.includes('--json');
    const id = argv.find((a) => !a.startsWith('--'));
    if (id === undefined || id.trim() === '') {
        throw new SiguienteCommandError('[ERROR] Falta el ID de la tarea: taskctl siguiente TASK-NNN [--json].');
    }
    // Config roto: ConfigError, que el CLI convierte en salida != 0.
    const modoConfig = resolverConfig(deps.repoCwd).modo_flujo;
    const local = await readTareaFile(tareasRoot, id);
    if (local === null) {
        throw new SiguienteCommandError(`[ERROR] ${id}: no se encuentra en el working tree de la rama actual. ` +
            'Si existe en otra rama, cambiate a esa rama o a la rama base y reintenta.');
    }
    const rama = local.task.rama;
    const enOtraRama = currentBranch(deps.repoCwd) !== rama &&
        localBranchExists(rama, deps.repoCwd) &&
        !isAncestor(rama, 'HEAD', deps.repoCwd);
    let task;
    let body;
    let planEstaRedactado = true;
    // Informes de la ultima ronda (primaria y de Codex), con el MISMO criterio
    // de ronda en los dos caminos (nombresDeUltimaRonda), leidos de la rama o
    // del disco.
    let primarios;
    let codex;
    if (enOtraRama) {
        const enRama = lsTreeNames(rama, 'tareas', deps.repoCwd);
        const rutaTarea = enRama.find((n) => n.endsWith(`/${id}/tarea.md`));
        if (rutaTarea === undefined) {
            throw new SiguienteCommandError(`[ERROR] ${id}: la rama "${rama}" existe pero no contiene la tarea. Revisa la rama a mano.`);
        }
        ({ task, body } = parseTareaFile(showFileAtRef(rama, rutaTarea, deps.repoCwd)));
        const dirRevision = `${path.posix.dirname(rutaTarea)}/${REVISION_DIRNAME}/`;
        const nombres = enRama
            .filter((n) => n.startsWith(dirRevision))
            .map((n) => n.slice(dirRevision.length));
        const leer = (n) => showFileAtRef(rama, dirRevision + n, deps.repoCwd);
        // En la rama la tarea ya paso por start: el plan dejo de importar.
        primarios = nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).nombres.map(leer);
        codex = nombresDeUltimaRonda(nombres, INFORME_CODEX_RE).nombres.map(leer);
    }
    else {
        ({ task, body } = local);
        const taskDir = path.dirname(local.filePath);
        const revisionDir = path.join(taskDir, REVISION_DIRNAME);
        const leer = (n) => readFile(path.join(revisionDir, n), 'utf8');
        primarios = await Promise.all((await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE)).nombres.map(leer));
        codex = await Promise.all((await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE)).nombres.map(leer));
        if (task.estado === 'en-diseno')
            planEstaRedactado = await planRedactado(task, taskDir);
    }
    const ctx = {
        planRedactado: planEstaRedactado,
        veredicto: veredictoDe(primarios),
        veredictoCodex: veredictoDe(codex),
        modoCongelado: modoCongelado(body) !== null,
    };
    const modo = modoDeTarea(body, modoConfig);
    return {
        id: task.id,
        estado: task.estado,
        modo,
        leidaDe: enOtraRama ? 'rama' : 'working-tree',
        json,
        ...siguienteFase(task, ctx, modo),
    };
}
