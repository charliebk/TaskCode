/**
 * `taskctl pausa TASK-NNN [--push]` — TASK-056.
 *
 * El «no» del modo semiautomatico: la persona decide no pasar todavia a la
 * siguiente fase. No cambia el estado de la tarea; deja una fila `pausa` en
 * su registro de transiciones y la commitea, para que el historico muestre
 * tambien las decisiones de no seguir (decision de Carlos, 2026-10-04).
 *
 * Se escribe donde la tarea esta al dia: si su copia actual vive en su rama
 * y no se esta en ella, aborta y dice a que rama cambiar (escribir la fila
 * en la copia vieja de la rama base la perderia en el merge).
 */
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
import { resolverConfig } from '../core/config.js';
import { registrarTransicion } from '../core/transiciones.js';
import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
export class PausaCommandError extends Error {
}
/** Flags de `taskctl pausa`: solo extraerPushFlag. */
export const FLAGS_PAUSA = ['--push', '-p'];
export async function runPausaCommand(tareasRoot, argv, today, deps) {
    // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
    rechazarFlagsDesconocidos(argv, FLAGS_PAUSA, 'pausa', (m) => new PausaCommandError(m));
    const { push, resto } = extraerPushFlag(argv);
    const id = resto[0];
    if (id === undefined || id.trim() === '' || id.startsWith('--')) {
        throw new PausaCommandError('[ERROR] Falta el ID de la tarea: taskctl pausa TASK-NNN.');
    }
    const modoConfig = resolverConfig(deps.repoCwd).modo_flujo;
    const leida = await readTareaFile(tareasRoot, id);
    if (leida === null) {
        throw new PausaCommandError(`[ERROR] ${id}: no se encuentra en el working tree de la rama actual. Cambiate a la rama ` +
            'donde esta la tarea y reintenta.');
    }
    const { task, body, filePath } = leida;
    if (task.estado === 'terminada') {
        throw new PausaCommandError(`[ERROR] ${id}: ya esta terminada; no hay fase que pausar.`);
    }
    if (currentBranch(deps.repoCwd) !== task.rama &&
        localBranchExists(task.rama, deps.repoCwd) &&
        !isAncestor(task.rama, 'HEAD', deps.repoCwd)) {
        throw new PausaCommandError(`[ERROR] ${id}: la copia al dia de la tarea esta en su rama, "${task.rama}". ` +
            `Cambia a ella (git checkout ${task.rama}) y reintenta; no se ha tocado nada.`);
    }
    // MEN-5 de la revision: el commit de la pausa es de la carpeta de la
    // tarea entera; con ediciones a medias en ella, se las llevaria.
    const pendientes = runGit(['status', '--porcelain', '--', path.dirname(filePath)], deps.repoCwd);
    if (pendientes !== '') {
        throw new PausaCommandError(`[ERROR] ${id}: la carpeta de la tarea tiene cambios sin commitear. Commitealos o ` +
            'descartalos antes de "taskctl pausa": su commit se los llevaria. No se ha tocado nada.');
    }
    const conRegistro = registrarTransicion(body, 'pausa', today, modoConfig, 'persona');
    const nuevo = await moveTareaFile(tareasRoot, filePath, task, conRegistro);
    const commit = autoCommit({
        cwd: deps.repoCwd,
        rutas: [path.dirname(nuevo)],
        mensaje: mensajeChore(id, 'pausa registrada'),
        push,
    });
    return { id, filePath: nuevo, autoCommit: commit };
}
