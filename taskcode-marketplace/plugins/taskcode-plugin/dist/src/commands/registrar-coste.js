/**
 * `taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> --tokens N [--push]`
 * — TASK-023.
 *
 * Suma N al coste en tokens de una fase de la tarea (`tokens_diseno`,
 * `tokens_implementacion` o `tokens_revision` de su tarea.md) y lo commitea.
 * `taskctl` no ve el consumo del agente: lo registra quien lo ve (la sesion
 * de Claude Code), sumando lo que devuelve cada subagente de la fase mas una
 * estimacion de la parte propia.
 *
 * Reglas:
 * 1. SUMA, no sobrescribe: una fase se registra en varias llamadas (un
 *    subagente por llamada, o la parte propia aparte). `null` solo cuenta
 *    como 0 al sumar; las otras fases quedan como estaban (null sigue siendo
 *    «nadie lo registro», que no es lo mismo que 0).
 * 2. Funciona en cualquier estado, tambien `terminada`: el coste de la
 *    revision se conoce cuando la tarea ya esta casi o del todo cerrada.
 *    Por eso no pasa por la maquina de estados, y no cambia el estado ni
 *    `actualizado`.
 * 3. Escribe y commitea SOLO ese tarea.md. Mismas precondiciones que
 *    `pausa`: la rama de la tarea es donde esta al dia (si no, aborta y dice
 *    a cual cambiar), y el propio tarea.md no puede tener cambios sin
 *    commitear (el commit se los llevaria). Lo demas del arbol no importa:
 *    el commit es pathspec-limitado.
 * 4. `--tokens 0` se rechaza: registrar nada no tiene sentido y dejaria un
 *    commit que parece un registro.
 */
import { writeFile } from 'node:fs/promises';
import { rechazarFlagsDesconocidos, parseArgs } from '../cli/args.js';
import { readTareaFile } from '../fs/task-store.js';
import { serializeTareaFile } from '../core/tarea-file.js';
import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
export class RegistrarCosteCommandError extends Error {
}
/** Flags de `taskctl registrar-coste`: --fase y --tokens, mas extraerPushFlag. */
export const FLAGS_REGISTRAR_COSTE = ['--fase', '--tokens', '--push', '-p'];
/** Fase → campo de la tarea donde se acumula su coste. */
export const CAMPO_COSTE_POR_FASE = {
    diseno: 'tokens_diseno',
    implementacion: 'tokens_implementacion',
    revision: 'tokens_revision',
};
export const FASES_COSTE = Object.keys(CAMPO_COSTE_POR_FASE);
const USO = 'Uso: taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> --tokens N [--push]';
/** Devuelve la fase y los tokens (entero > 0) de argv, o lanza con lo que hay que hacer. */
function leerFaseYTokens(flags) {
    const fase = flags['fase'];
    if (typeof fase !== 'string' || !Object.hasOwn(CAMPO_COSTE_POR_FASE, fase)) {
        throw new RegistrarCosteCommandError(`[ERROR] --fase ${typeof fase === 'string' ? `"${fase}" no reconocida` : 'ausente'}. ` +
            `Fases: ${FASES_COSTE.join(', ')}. ${USO}`);
    }
    const crudo = flags['tokens'];
    if (typeof crudo !== 'string' || !/^\d+$/.test(crudo)) {
        throw new RegistrarCosteCommandError(`[ERROR] --tokens ${typeof crudo === 'string' ? `"${crudo}" no es` : 'falta:'} ` +
            `un entero positivo (tokens procesados, sin separadores: 48213). ${USO}`);
    }
    const tokens = Number(crudo);
    if (!Number.isSafeInteger(tokens)) {
        throw new RegistrarCosteCommandError(`[ERROR] --tokens "${crudo}" es demasiado grande. ${USO}`);
    }
    if (tokens === 0) {
        throw new RegistrarCosteCommandError('[ERROR] --tokens 0: registrar nada no tiene sentido. Si la fase no gasto tokens, no ' +
            `registres nada (queda sin dato); si los gasto, pasa la cifra real. ${USO}`);
    }
    return { fase: fase, tokens };
}
export async function runRegistrarCosteCommand(tareasRoot, argv, deps) {
    // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
    rechazarFlagsDesconocidos(argv, FLAGS_REGISTRAR_COSTE, 'registrar-coste', (m) => new RegistrarCosteCommandError(m));
    const { push, resto } = extraerPushFlag(argv);
    // El ID es el primer argumento, como en veredicto.
    const [id, ...sinId] = resto;
    if (id === undefined || id.trim() === '' || id.startsWith('--')) {
        throw new RegistrarCosteCommandError(`[ERROR] Falta el ID de la tarea. ${USO}`);
    }
    const { positional, flags } = parseArgs(sinId);
    if (positional.length > 0) {
        throw new RegistrarCosteCommandError(`[ERROR] Argumentos de mas: ${positional.join(' ')}. ${USO}`);
    }
    const { fase, tokens } = leerFaseYTokens(flags);
    const leida = await readTareaFile(tareasRoot, id);
    if (leida === null) {
        throw new RegistrarCosteCommandError(`[ERROR] ${id}: no se encuentra en el working tree de la rama actual. Cambiate a la rama ` +
            'donde esta la tarea y reintenta.');
    }
    const { task, body, filePath } = leida;
    if (currentBranch(deps.repoCwd) !== task.rama &&
        localBranchExists(task.rama, deps.repoCwd) &&
        !isAncestor(task.rama, 'HEAD', deps.repoCwd)) {
        throw new RegistrarCosteCommandError(`[ERROR] ${id}: la copia al dia de la tarea esta en su rama, "${task.rama}". ` +
            `Cambia a ella (git checkout ${task.rama}) y reintenta; no se ha tocado nada.`);
    }
    // El commit es de este fichero entero: con ediciones a medias en el, se
    // las llevaria.
    if (runGit(['status', '--porcelain', '--', filePath], deps.repoCwd) !== '') {
        throw new RegistrarCosteCommandError(`[ERROR] ${id}: tarea.md tiene cambios sin commitear. Commitealos o descartalos antes de ` +
            '"taskctl registrar-coste": su commit se los llevaria. No se ha tocado nada.');
    }
    const campo = CAMPO_COSTE_POR_FASE[fase];
    const total = (task[campo] ?? 0) + tokens;
    if (!Number.isSafeInteger(total)) {
        throw new RegistrarCosteCommandError(`[ERROR] ${id}: el total de ${campo} dejaria de ser un entero seguro. Revisa el valor del ` +
            'campo en tarea.md; no se ha tocado nada.');
    }
    const nueva = { ...task, [campo]: total };
    await writeFile(filePath, serializeTareaFile(nueva, body), 'utf8');
    const commit = autoCommit({
        cwd: deps.repoCwd,
        rutas: [filePath],
        mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens`),
        push,
    });
    return { id, fase, sumado: tokens, total, filePath, autoCommit: commit };
}
