/**
 * Los cinco "wrappers directos" de la tabla de la seccion 8 de la
 * metodologia (item C1, TASK-026): taskctl diagnose / pause / resume /
 * recover / abort-merge sobre los scripts que ya existen en
 * scripts/gitflow/. La seccion 8.3 ya remitia a `taskctl pause` en su
 * mensaje de workspace sucio, asi que el comando le hacia falta al
 * sistema desde antes de existir.
 *
 * Envolverlos NO es solo enrutar a bash. Cuatro de los cinco scripts
 * preguntan con `read -rp`, y con EOF inmediato contestan asi:
 *
 *   - pause-work.sh    -> respuesta vacia, "Opcion no reconocida", exit 1
 *   - abort-merge.sh   -> no confirma: NO aborta nada, y sale 0
 *   - resume-work.sh   -> aplica el stash de la rama sin preguntar (default si)
 *   - recover-branch.sh-> cancela sin sobreescribir (default no)
 *   - diagnose-repo.sh -> no pregunta nada
 *
 * De ahi las dos reglas de este modulo:
 *
 * 1. **Con terminal, stdin heredado; sin terminal, stdin ignorado.**
 *    Heredar siempre parecia lo natural, pero reintroduce justo el
 *    modo de fallo que motivo el `stdin: 'ignore'` de TASK-007: si
 *    quien lanza taskctl le deja una tuberia abierta que nadie cierra
 *    (lo hace cualquier arnes de agente, y tambien `node --test`), el
 *    script se queda esperando una respuesta que no va a llegar y el
 *    comando cuelga indefinidamente. Sin terminal el script recibe
 *    EOF, que es determinista, y taskctl avisa antes de que valor por
 *    defecto va a tomar (hallazgo IMPORTANTE de revision por pares).
 * 2. **Sin terminal se corta antes de invocar** en los casos en que
 *    ese valor por defecto haria lo contrario de lo que anuncia el
 *    comando.
 *
 * Lo que estos comandos NO hacen, a proposito: no leen ni escriben
 * `tareas/`, no pasan por la maquina de estados y no aplican la
 * precondicion de rama base de la 8.3 — seria contradictorio, porque
 * `pause` existe justamente para el workspace sucio que esa
 * precondicion rechaza, y `resume`/`recover` cambian de rama por
 * definicion.
 */
import { isInsideWorkTree, isValidBranchName, isWorkspaceClean, operacionEnCurso, } from '../fs/git.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';
export class WrapperCommandError extends Error {
}
const WRAPPERS = {
    diagnose: { script: 'diagnose-repo.sh', aceptaRama: false, opciones: [] },
    pause: { script: 'pause-work.sh', aceptaRama: false, opciones: ['--push', '-p'] },
    resume: { script: 'resume-work.sh', aceptaRama: true, opciones: [] },
    recover: { script: 'recover-branch.sh', aceptaRama: true, opciones: [] },
    'abort-merge': { script: 'abort-merge.sh', aceptaRama: false, opciones: [] },
};
export const WRAPPER_NAMES = Object.keys(WRAPPERS);
export function isWrapperCommand(cmd) {
    return Object.prototype.hasOwnProperty.call(WRAPPERS, cmd);
}
/**
 * Los scripts se tragan cualquier cosa: sus bucles `while` toman el
 * primer argumento no reconocido como nombre de rama, asi que
 * `taskctl resume --push mi-rama` intentaria retomar una rama llamada
 * "--push". Y parseArgs (cli/args.ts) ignora en silencio los flags
 * que no conoce, el mismo fallo que la revision de B6 encontro ya
 * materializado en `board`. Se validan aqui, antes de invocar nada.
 */
function parseWrapperArgs(nombre, spec, argv) {
    const opciones = [];
    let rama = null;
    for (const arg of argv) {
        if (arg.startsWith('-')) {
            if (!spec.opciones.includes(arg)) {
                const admite = spec.opciones.length === 0
                    ? 'no admite ninguna opcion'
                    : `solo admite ${spec.opciones.join(' y ')}`;
                throw new WrapperCommandError(`[ERROR] taskctl ${nombre} ${admite}, y recibio "${arg}".`);
            }
            if (!opciones.includes(arg))
                opciones.push(arg);
            continue;
        }
        if (!spec.aceptaRama) {
            throw new WrapperCommandError(`[ERROR] taskctl ${nombre} no acepta argumentos, y recibio "${arg}". ` +
                `Ejecuta: taskctl ${nombre}`);
        }
        if (arg.trim() === '') {
            throw new WrapperCommandError(`[ERROR] taskctl ${nombre} recibio un nombre de rama vacio. ` +
                `Ejecuta: taskctl ${nombre} <rama>`);
        }
        if (rama !== null) {
            throw new WrapperCommandError(`[ERROR] taskctl ${nombre} acepta un solo nombre de rama, y recibio "${rama}" y ` +
                `"${arg}".`);
        }
        rama = arg;
    }
    return { rama, opciones };
}
/**
 * Guarda de no-interactividad: solo corta cuando el script iba a
 * preguntar algo Y su respuesta por defecto es inaceptable. Si no hay
 * nada que preguntar (diagnose, o pause con el workspace limpio), el
 * comando sigue igual de bien sin terminal.
 */
function assertPuedeSeguirSinTerminal(nombre, rama, repoCwd) {
    if (nombre === 'pause') {
        if (!isWorkspaceClean(repoCwd)) {
            throw new WrapperCommandError('[ERROR] taskctl pause tiene que preguntarte si guardar los cambios como commit o ' +
                'como stash, y no hay terminal interactiva. Ejecutalo desde una terminal, o ' +
                'guardalos tu: "git stash push -u" para apartarlos, "git add -A && git commit" ' +
                'para dejarlos en la rama.');
        }
        // Aqui habia un segundo guard (TASK-026): con el workspace limpio,
        // `pause` abortaba igualmente si el repo no ignoraba el registro
        // que los scripts de Git-Flow escribian en "logs/gitflow/", porque
        // `initialize_gitflow_log` lo creaba nada mas arrancar y
        // pause-work.sh acababa viendo sucio un workspace que habia
        // ensuciado el mismo. Ese guard tapaba una suciedad autoinfligida,
        // no un problema del repo del usuario. TASK-029 movio el registro
        // a `.git/taskcode/gitflow/` (git rev-parse --git-path), que
        // `git status` no ve nunca, asi que el guard se ha quedado sin
        // motivo y se elimina con su constante. Comprobado empiricamente:
        // repo sin ".gitignore", workspace limpio y stdin cerrado ->
        // pause-work.sh informa "Workspace limpio", sale 0 y no pregunta.
    }
    if (nombre === 'abort-merge') {
        const operacion = operacionEnCurso(repoCwd);
        if (operacion !== null) {
            throw new WrapperCommandError(`[ERROR] taskctl abort-merge tiene que confirmar contigo antes de abortar el ` +
                `${operacion} en curso, y no hay terminal interactiva. Ejecutalo desde una terminal, ` +
                `o abortalo tu: "git ${operacion} --abort".`);
        }
    }
    if ((nombre === 'resume' || nombre === 'recover') && rama === null) {
        throw new WrapperCommandError(`[ERROR] taskctl ${nombre} pregunta por la rama cuando no se le pasa, y no hay terminal ` +
            `interactiva. Ejecuta: taskctl ${nombre} <rama>`);
    }
}
/** Avisos de "sin terminal, el script tomara este valor por defecto". */
function avisosSinTerminal(nombre, rama) {
    if (nombre === 'resume' && rama !== null) {
        return [
            `Sin terminal interactiva: si "${rama}" tiene un stash de "taskctl pause", resume-work.sh ` +
                'lo aplicara sin preguntar (es su valor por defecto).',
        ];
    }
    if (nombre === 'recover' && rama !== null) {
        return [
            `Sin terminal interactiva: si "${rama}" ya existe en local, recover-branch.sh cancelara ` +
                'sin sobreescribirla (es su valor por defecto).',
        ];
    }
    return [];
}
export function runWrapperCommand(nombre, argv, opts) {
    const spec = WRAPPERS[nombre];
    const { rama, opciones } = parseWrapperArgs(nombre, spec, argv);
    // --is-inside-work-tree y no --git-dir: los cinco scripts trabajan
    // sobre ficheros del arbol de trabajo, asi que un repo bare o un
    // cwd dentro de .git/ no valen aunque Git los reconozca como repo
    // (hallazgo MENOR de revision por pares: alli "pause" moria con el
    // fatal crudo de git y "diagnose" declaraba el workspace limpio).
    if (!isInsideWorkTree(opts.repoCwd)) {
        throw new WrapperCommandError(`[ERROR] taskctl ${nombre} solo funciona dentro del arbol de trabajo de un repositorio ` +
            `Git, y "${opts.repoCwd}" no lo es. Ejecutalo desde la carpeta del repo.`);
    }
    // Defensa en profundidad, mismo motivo que en start (TASK-009): sin
    // esto, un nombre invalido solo se detecta dos procesos mas abajo,
    // dentro del script, con un mensaje de Git que no menciona taskctl.
    if (rama !== null && !isValidBranchName(rama, opts.repoCwd)) {
        throw new WrapperCommandError(`[ERROR] "${rama}" no es un nombre de rama valido para Git. Revisa el nombre y reintenta.`);
    }
    const avisos = [];
    if (!opts.interactivo) {
        assertPuedeSeguirSinTerminal(nombre, rama, opts.repoCwd);
        avisos.push(...avisosSinTerminal(nombre, rama));
    }
    for (const aviso of avisos) {
        opts.onAviso?.(aviso);
    }
    const args = rama === null ? opciones : [...opciones, rama];
    const { code, signal } = runGitflowScript(spec.script, args, {
        scriptsDir: opts.scriptsDir,
        cwd: opts.repoCwd,
        stdin: opts.interactivo ? 'inherit' : 'ignore',
    });
    return { nombre, script: spec.script, code, signal, avisos };
}
