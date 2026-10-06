/**
 * `taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision>
 *  (--agente <id>... | --tokens N) [--push]` — TASK-023.
 *
 * Suma al coste en tokens de una fase de la tarea (`tokens_diseno`,
 * `tokens_implementacion` o `tokens_revision` de su tarea.md) y lo commitea.
 * `taskctl` no ve el consumo del agente: lo registra quien lo ve.
 *
 * Dos formas de dar la cifra, excluyentes y una obligatoria:
 *  - `--agente <id>` (repetible): el agentId que devuelve la herramienta
 *    Agent. La cifra se lee de la transcripcion del subagente
 *    (`core/coste-transcripcion.ts`): lo que gasto de verdad, no el tamano
 *    de su contexto final, que es lo que muestra al terminar. Varios
 *    `--agente` se suman en un solo registro y un solo commit.
 *  - `--tokens N`: una cifra a mano (la parte del orquestador, estimada).
 *
 * Reglas:
 * 1. SUMA, no sobrescribe: una fase se registra en varias llamadas. `null`
 *    solo cuenta como 0 al sumar; las otras fases quedan como estaban (null
 *    sigue siendo «nadie lo registro», que no es lo mismo que 0).
 * 2. Funciona en cualquier estado, tambien `terminada`: el coste de la
 *    revision se conoce cuando la tarea ya esta casi o del todo cerrada.
 *    Por eso no pasa por la maquina de estados, y no cambia el estado ni
 *    `actualizado`.
 * 3. Escribe y commitea SOLO ese tarea.md. Mismas precondiciones que
 *    `pausa`: la rama de la tarea es donde esta al dia (si no, aborta y dice
 *    a cual cambiar), y el propio tarea.md no puede tener cambios sin
 *    commitear (el commit se los llevaria). Lo demas del arbol no importa:
 *    el commit es pathspec-limitado.
 * 4. Una cifra de 0 se rechaza: registrar nada no tiene sentido y dejaria un
 *    commit que parece un registro.
 */
import { writeFile } from 'node:fs/promises';
import { rechazarFlagsDesconocidos, parseArgs } from '../cli/args.js';
import { readTareaFile } from '../fs/task-store.js';
import { serializeTareaFile } from '../core/tarea-file.js';
import { esAgentIdValido, sumarUsoTranscripcion } from '../core/coste-transcripcion.js';
import { buscarTranscripciones, directorioConfigClaude, leerTranscripcion } from '../fs/transcripciones.js';
import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
export class RegistrarCosteCommandError extends Error {
}
/** Flags de `taskctl registrar-coste`: --fase, --tokens y --agente, mas extraerPushFlag. */
export const FLAGS_REGISTRAR_COSTE = ['--fase', '--tokens', '--agente', '--push', '-p'];
/** Fase → campo de la tarea donde se acumula su coste. */
export const CAMPO_COSTE_POR_FASE = {
    diseno: 'tokens_diseno',
    implementacion: 'tokens_implementacion',
    revision: 'tokens_revision',
};
export const FASES_COSTE = Object.keys(CAMPO_COSTE_POR_FASE);
const USO = 'Uso: taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> ' +
    '(--agente <id> [--agente <id2>...] | --tokens N) [--push]';
/** Saca todos los `--agente <id>` / `--agente=<id>` de argv. */
function extraerAgentes(argv) {
    const agentes = [];
    const resto = [];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--agente') {
            const valor = argv[i + 1];
            if (valor === undefined || valor.startsWith('--')) {
                throw new RegistrarCosteCommandError(`[ERROR] --agente necesita el id del subagente (el que devuelve la herramienta Agent). ${USO}`);
            }
            agentes.push(valor);
            i++;
        }
        else if (arg.startsWith('--agente=')) {
            agentes.push(arg.slice('--agente='.length));
        }
        else {
            resto.push(arg);
        }
    }
    return { agentes, resto };
}
/** Devuelve la fase y, si se dio, los tokens (entero > 0), o lanza con lo que hay que hacer. */
function leerFaseYTokens(flags, hayAgentes) {
    const fase = flags['fase'];
    if (typeof fase !== 'string' || !Object.hasOwn(CAMPO_COSTE_POR_FASE, fase)) {
        throw new RegistrarCosteCommandError(`[ERROR] --fase ${typeof fase === 'string' ? `"${fase}" no reconocida` : 'ausente'}. ` +
            `Fases: ${FASES_COSTE.join(', ')}. ${USO}`);
    }
    const crudo = flags['tokens'];
    if (crudo === undefined) {
        if (!hayAgentes) {
            throw new RegistrarCosteCommandError(`[ERROR] Falta el coste: pasa --agente <id> (lee la transcripcion del subagente) o --tokens N. ${USO}`);
        }
        return { fase: fase, tokens: null };
    }
    if (hayAgentes) {
        throw new RegistrarCosteCommandError(`[ERROR] --tokens y --agente se excluyen entre si: usa uno solo (para sumar las dos cosas, ` +
            `dos llamadas a registrar-coste). ${USO}`);
    }
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
/** Suma lo que gasto cada subagente segun su transcripcion; falla diciendo que hacer. */
async function tokensDeAgentes(agentes, configDir) {
    const unicos = [...new Set(agentes)];
    for (const id of unicos) {
        if (!esAgentIdValido(id)) {
            throw new RegistrarCosteCommandError(`[ERROR] --agente "${id}" no es un id de subagente valido (hexadecimal, el que devuelve la ` +
                `herramienta Agent). ${USO}`);
        }
    }
    let total = 0;
    for (const id of unicos) {
        const rutas = await buscarTranscripciones(configDir, id);
        const donde = `${configDir}/projects/*/*/subagents/agent-${id}.jsonl`;
        if (rutas.length === 0) {
            throw new RegistrarCosteCommandError(`[ERROR] No se encuentra la transcripcion del subagente ${id}: se ha buscado ${donde}. ` +
                'Si Claude Code guarda su configuracion en otro sitio, define CLAUDE_CONFIG_DIR; y si la ' +
                'transcripcion ya no existe, registra la cifra a mano con --tokens N. No se ha tocado nada.');
        }
        if (rutas.length > 1) {
            throw new RegistrarCosteCommandError(`[ERROR] El subagente ${id} aparece en mas de una sesion, asi que no se sabe cual es:\n  ` +
                `${rutas.join('\n  ')}\nBorra las copias que sobren o registra la cifra a mano con ` +
                '--tokens N. No se ha tocado nada.');
        }
        const uso = sumarUsoTranscripcion(await leerTranscripcion(rutas[0]));
        if (uso === null) {
            throw new RegistrarCosteCommandError(`[ERROR] La transcripcion ${rutas[0]} no tiene ninguna llamada con "usage": formato ` +
                'desconocido, probablemente Claude Code lo cambio. Registra la cifra a mano con --tokens N. ' +
                'No se ha tocado nada.');
        }
        total += uso.tokens;
    }
    if (total === 0) {
        throw new RegistrarCosteCommandError('[ERROR] Las transcripciones suman 0 tokens: registrar nada no tiene sentido. No se ha tocado nada.');
    }
    return total;
}
export async function runRegistrarCosteCommand(tareasRoot, argv, deps) {
    // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
    rechazarFlagsDesconocidos(argv, FLAGS_REGISTRAR_COSTE, 'registrar-coste', (m) => new RegistrarCosteCommandError(m));
    const { push, resto } = extraerPushFlag(argv);
    const { agentes, resto: sinAgentes } = extraerAgentes(resto);
    // El ID es el primer argumento, como en veredicto.
    const [id, ...sinId] = sinAgentes;
    if (id === undefined || id.trim() === '' || id.startsWith('--')) {
        throw new RegistrarCosteCommandError(`[ERROR] Falta el ID de la tarea. ${USO}`);
    }
    const { positional, flags } = parseArgs(sinId);
    if (positional.length > 0) {
        throw new RegistrarCosteCommandError(`[ERROR] Argumentos de mas: ${positional.join(' ')}. ${USO}`);
    }
    const { fase, tokens: tokensManuales } = leerFaseYTokens(flags, agentes.length > 0);
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
    const nAgentes = new Set(agentes).size;
    const tokens = tokensManuales ?? (await tokensDeAgentes(agentes, deps.configDir ?? directorioConfigClaude()));
    const campo = CAMPO_COSTE_POR_FASE[fase];
    const total = (task[campo] ?? 0) + tokens;
    if (!Number.isSafeInteger(total)) {
        throw new RegistrarCosteCommandError(`[ERROR] ${id}: el total de ${campo} dejaria de ser un entero seguro. Revisa el valor del ` +
            'campo en tarea.md; no se ha tocado nada.');
    }
    const nueva = { ...task, [campo]: total };
    await writeFile(filePath, serializeTareaFile(nueva, body), 'utf8');
    const detalle = nAgentes > 0 ? ` (${String(nAgentes)} agente${nAgentes === 1 ? '' : 's'})` : '';
    const commit = autoCommit({
        cwd: deps.repoCwd,
        rutas: [filePath],
        mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens${detalle}`),
        push,
    });
    return { id, fase, sumado: tokens, total, agentes: nAgentes, filePath, autoCommit: commit };
}
