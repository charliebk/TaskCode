/**
 * Punto de entrada del CLI. Sprint 0: --help/--version, "new" (TASK-003),
 * "import" (TASK-004) y "board" (TASK-005).
 */
import path from 'node:path';
import { runNewCommand, NewTaskArgError } from './commands/new.js';
import { runImportCommand, ImportCommandError } from './commands/import.js';
import { runBoardCommand, BoardCommandError } from './commands/board.js';
import { runStartCommand, StartCommandError } from './commands/start.js';
import { runPlanCommand, PlanCommandError } from './commands/plan.js';
import { HeuristicaError } from './core/heuristica.js';
import { RolesBrainstormError } from './core/roles-brainstorm.js';
import { CatalogoSkillsError } from './core/catalogo-skills.js';
import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
import { runReviewCommand, ReviewCommandError } from './commands/review.js';
import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex-review.js';
import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto.js';
import { runFinishCommand, FinishCommandError } from './commands/finish.js';
import { isWrapperCommand, runWrapperCommand, WrapperCommandError, } from './commands/wrappers.js';
import { resolveGitflowScriptsDir, GitflowScriptLaunchError } from './fs/gitflow-runner.js';
import { StateMachineError } from './core/state-machine.js';
import { TaskFolderConflictError } from './fs/task-store.js';
import { BaseBranchGuardError, GitCommandError, GitLaunchError, } from './fs/git.js';
import { AutoCommitError } from './fs/git-commit.js';
import { CODIGO_SINCRONIZACION_NO_APLICADA, sincronizacionNoAplicada, } from './fs/sincronizacion.js';
// ConfigError se captura en los mismos catch que AutoCommitError
// (integracion TASK-030): sin esto cae al catch-all de bin/taskctl y
// sale como "[ERROR] taskctl no pudo arrancar: ...", que miente —
// taskctl arranco bien, lo que esta mal es el .taskcode/config.yml
// del repo.
import { ConfigError } from './core/config.js';
const VERSION = '0.1.3';
const HELP = `taskctl ${VERSION} — TaskCode

Uso:
  taskctl --help
  taskctl --version
  taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release> \\
              [--sprint N] [--etiquetas a,b,c] [--complejidad ...] \\
              [--modelo-sugerido ...] [--agente-revisor ...]
  taskctl import <fichero.md> [--tipo <feature|fix|hotfix|release>] \\
                 [--sprint N] [--complejidad ...] [--modelo-sugerido ...] \\
                 [--agente-revisor ...]
  taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
  taskctl start TASK-NNN [--asignado-a <persona>] [--push]
  taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
  taskctl approve TASK-NNN [--push]
  taskctl review TASK-NNN [--push]
  taskctl codex-review TASK-NNN [--push]
  taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
                    [--informe <nombre>] [--push]
  taskctl finish TASK-NNN [--push]
  taskctl diagnose
  taskctl pause [--push]
  taskctl resume [<rama>]
  taskctl recover [<rama>]
  taskctl abort-merge

Comandos: new, import, board, start, plan, approve, review, codex-review, veredicto, finish.
Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
--asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
taskctl commitea SOLO los ficheros que el mismo escribe (nunca "git add -A"):
lo que tengas a medias en el arbol se queda como esta. --push sube ademas la
rama actual a origin; sin origin alcanzable avisa y sigue.
Los wrappers preguntan (guardar como commit o stash, confirmar un abort...):
ejecutalos desde una terminal. Sin ella toman el valor por defecto de cada
pregunta, avisando de cual; y cuando ese valor haria lo contrario de lo que
dice el comando, taskctl aborta antes con instrucciones.
Ver docs/PLAN_SPRINTS.md en el repo del proyecto.
`;
function today() {
    return new Date().toISOString().slice(0, 10);
}
/**
 * Algunos errores del CLI ya se construyen con el prefijo "[ERROR]"
 * (StartCommandError, PlanCommandError, StateMachineError...), otros
 * no (TaskFolderConflictError, NewTaskArgError...). Evita duplicar el
 * prefijo en vez de tener que acordarse caso por caso (hallazgo de
 * revision por pares, TASK-010: TaskFolderConflictError no se
 * capturaba en absoluto antes de este ajuste).
 */
function printCliError(e) {
    const msg = e.message.startsWith('[ERROR]') ? e.message : `[ERROR] ${e.message}`;
    process.stderr.write(`${msg}\n`);
}
/**
 * Aviso informativo del paso 3 de la seccion 8.3 (TASK-012): cuando
 * ensureBaseBranchReady tuvo que cambiar de rama por la persona, se lo
 * dice antes de mostrar el resultado del comando — mismo formato que
 * el ejemplo de la metodologia ("Workspace limpio -> cambiando
 * automaticamente a develop..."), en pasado porque para cuando se
 * imprime ya ha terminado.
 */
function printBaseBranchSwitchNotice(guard) {
    if (!guard.switched)
        return;
    process.stdout.write(`Workspace limpio -> cambiado automaticamente de "${guard.branchAntes}" a ` +
        `"${guard.baseBranch}".\n`);
}
/**
 * Resultado del auto-commit (TASK-030, item C2). Se dice SIEMPRE, en
 * los dos desenlaces: "no habia nada que commitear" no es silencio,
 * porque la diferencia entre "taskctl lo registro" y "esto sigue sin
 * registrar" es justo lo que la persona necesita saber para decidir si
 * tiene que hacer algo. Los avisos (sin origin, HEAD desacoplado) van
 * por stderr, como el resto de avisos del CLI.
 */
function printAutoCommit(r) {
    printAvisos(...r.avisos);
    if (sincronizacionNoAplicada(r.sincronizacion))
        sincronizacionPendiente = true;
    if (r.commiteado) {
        const n = r.ficheros.length;
        process.stdout.write(`Commiteado ${r.commit} en "${r.rama}" (${n} fichero${n === 1 ? '' : 's'}).\n`);
    }
    else {
        process.stdout.write('Sin cambios que commitear (nada nuevo en disco).\n');
    }
    if (r.push === 'empujado') {
        process.stdout.write(`Push completado: ${r.rama} -> origin/${r.rama}.\n`);
    }
}
/**
 * Confirmacion de --asignado-a (item B6). Solo se imprime cuando el
 * flag CAMBIO algo: si la tarea ya venia asignada a esa misma persona,
 * repetirlo seria ruido. Y se imprime siempre que cambie, tambien
 * cuando "plan" ya la habia asignado y "start" la reasigna — ahi es
 * justo donde interesa que se vea.
 */
function asignacionNotice(result) {
    if (!result.asignadoCambiado || result.asignadoA === null)
        return '';
    return `Asignada a "${result.asignadoA}".\n`;
}
/**
 * Resultado de la seleccion determinista de skill (seccion 6.6/16.4.1,
 * TASK-017). Cuatro desenlaces posibles, no excluyentes entre "sin
 * candidato"/"desempate pendiente" y "no instalada" (un ganador de una
 * ronda anterior de desempate puede resultar externo y no instalado
 * ahora mismo). Solo se anuncia el ganador cuando cambio respecto al
 * valor previo: igual que brainstormNotice con la discrepancia, evita
 * repetir en cada "plan" un resultado que ya se anuncio una vez.
 */
function seleccionSkillNotice(result) {
    const lineas = [];
    if (result.skillsRecomendadosCambiado && result.skillsRecomendados.length > 0) {
        lineas.push(`Skill recomendado: "${result.skillsRecomendados[0]}" (regla: ${result.reglaSeleccionSkill}).`);
    }
    if (result.avisoSkillSinCandidato !== null) {
        lineas.push(result.avisoSkillSinCandidato);
    }
    if (result.avisoSkillDesempatePendiente !== null) {
        lineas.push(result.avisoSkillDesempatePendiente);
    }
    if (result.avisoSkillNoInstalada !== null) {
        lineas.push(result.avisoSkillNoInstalada);
    }
    if (lineas.length === 0)
        return '';
    return lineas.join('\n') + '\n';
}
/**
 * Que ha dejado escrito el brainstorm (TASK-016). Se imprimen las
 * rutas porque son lo unico accionable: quien orquesta la sesion tiene
 * que abrir esas peticiones y lanzarlas. Un "brainstorm preparado" sin
 * rutas obligaria a ir a buscarlas.
 *
 * La discrepancia de complejidad se dice SOLO cuando la hay, al
 * contrario que dentro de la peticion del unificador (donde va
 * siempre): aqui compite por la atencion con el resto de la salida del
 * comando, y ahi es el unico contenido de su seccion.
 */
function brainstormNotice(result) {
    const lineas = [];
    if (result.resolucion.hayDiscrepancia) {
        lineas.push(`Complejidad declarada "${result.resolucion.nivelDeclarado}", heuristica ` +
            `"${result.resolucion.nivelHeuristico}" (${result.resolucion.puntos} puntos): se lanzan ` +
            `${result.resolucion.agentes === 1 ? '1 rol' : `${result.resolucion.agentes} roles`}, ` +
            'el mayor de los dos.');
    }
    // El orden de estas ramas importa, y costo un IMPORTANTE en la cuarta
    // ronda de revision: "0 roles" tenia precedencia sobre "hay una
    // peticion de unificador que lanzar", asi que al bajar la complejidad
    // en una re-planificacion el CLI decia "sin brainstorm, redacta el
    // plan a mano" mientras acababa de escribir una peticion correcta que
    // nombraba las salidas reales. El artefacto bueno quedaba invisible.
    if (result.brainstormReutilizado) {
        lineas.push(`Re-planificacion (ronda ${result.ronda}): NO se relanza el brainstorm, que es el de la ` +
            `ronda ${result.rondaRoles}. Lanza solo el unificador con ${result.peticionUnificador}, ` +
            'que reprocesa esas salidas mas tu feedback.');
    }
    else if (result.roles.length === 0) {
        lineas.push(`Sin brainstorm (complejidad "${result.resolucion.nivelDeclarado}" resuelve 0 roles). ` +
            `Redacta el plan y aprueba con "taskctl approve ${result.id}".`);
    }
    else {
        // Mismo texto para "recien escritas" y "ya estaban de un intento
        // anterior de esta misma vuelta": en los dos casos lo que la
        // persona tiene que hacer es identico, y llamar re-planificacion al
        // segundo caso hacia que el CLI hablara de "salidas anteriores" y
        // "tu feedback" en una primera planificacion que nadie habia
        // ejecutado (CRITICO de la ronda 5).
        lineas.push(`Brainstorm ronda ${result.rondaRoles}, ${result.roles.length === 1 ? '1 rol' : `${result.roles.length} roles en paralelo`}. Lanza cada peticion con el agente que nombra y luego el unificador:`);
        for (const p of result.peticionesRol)
            lineas.push(`  - ${p}`);
        lineas.push(`  - ${result.peticionUnificador} (el ultimo, cuando esten las salidas)`);
    }
    return `${lineas.join('\n')}\n`;
}
/**
 * Avisos de asignacion (TASK-024) por stderr: no son errores, el
 * comando ha hecho su trabajo, pero la persona necesita enterarse.
 * Uno se emite cuando su "git config user.email" no sirve como
 * asignado_a; el otro, cuando arranca una tarea que esta a nombre de
 * otra persona.
 */
function printAvisos(...avisos) {
    for (const aviso of avisos) {
        if (aviso)
            process.stderr.write(`[AVISO] ${aviso}\n`);
    }
}
/**
 * true si algun auto-commit de esta invocacion hizo la transicion pero
 * no pudo aplicar la sincronizacion configurada (TASK-033). Lo levanta
 * printAutoCommit, que es por donde pasan los 8 comandos que
 * commitean, y lo consume main(): un solo sitio, en vez de tocar cada
 * `return 0`.
 */
let sincronizacionPendiente = false;
/**
 * Punto de entrada. Un 0 de un comando se convierte en
 * CODIGO_SINCRONIZACION_NO_APLICADA (3) si la sincronizacion no se
 * aplico: la transicion se hizo, pero quien lo lance (un agente, un
 * script, un CI) tiene que enterarse sin leer stderr. Un error del
 * comando (1) gana: es lo mas grave que ha pasado.
 */
export async function main(argv) {
    sincronizacionPendiente = false;
    const codigo = await mainComando(argv);
    return codigo === 0 && sincronizacionPendiente ? CODIGO_SINCRONIZACION_NO_APLICADA : codigo;
}
async function mainComando(argv) {
    const cmd = argv[0];
    if (cmd === undefined || cmd === '--help' || cmd === '-h') {
        process.stdout.write(HELP);
        return 0;
    }
    if (cmd === '--version' || cmd === '-v') {
        process.stdout.write(`${VERSION}\n`);
        return 0;
    }
    if (cmd === 'new') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runNewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
            printBaseBranchSwitchNotice(result.baseBranchGuard);
            process.stdout.write(`Tarea ${result.id} creada: ${result.filePath}\n` +
                // Se dice AQUI y no solo cuando "plan" falle: desde TASK-016
                // "plan" aborta si el objetivo esta vacio, y "new" lo deja
                // vacio a proposito. Enterarse de la precondicion en el
                // momento en que la incumples es peor que saberla al crear.
                'Rellena "## Objetivo" y los criterios de aceptacion antes de "taskctl plan": el ' +
                'brainstorm se lanza a partir de ese texto.\n');
            printAutoCommit(result.autoCommit);
            return 0;
        }
        catch (e) {
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof NewTaskArgError ||
                e instanceof BaseBranchGuardError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'import') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runImportCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
            printBaseBranchSwitchNotice(result.baseBranchGuard);
            for (const aviso of result.advertencias) {
                process.stderr.write(`[AVISO] ${aviso}\n`);
            }
            for (const error of result.errores) {
                process.stderr.write(`[ERROR] Linea ${error.lineNumber} ("${error.tituloRaw}"): ${error.motivo}\n`);
            }
            for (const omitida of result.omitidas) {
                process.stdout.write(`Omitida "${omitida.titulo}": ${omitida.motivo}\n`);
            }
            for (const creada of result.creadas) {
                process.stdout.write(`Tarea ${creada.id} creada: ${creada.filePath}\n`);
            }
            process.stdout.write(`Import completado: ${result.creadas.length} creada(s), ` +
                `${result.omitidas.length} omitida(s), ${result.errores.length} con error.\n`);
            // Hallazgo IMPORTANTE de revision por pares (TASK-004): antes
            // siempre devolvia 0, incluso si TODAS las entradas fallaban —
            // un "taskctl import x.md && siguiente_paso" en un script nunca
            // se enteraba de que el import no creo nada.
            printAutoCommit(result.autoCommit);
            return result.errores.length > 0 ? 1 : 0;
        }
        catch (e) {
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof ImportCommandError ||
                e instanceof BaseBranchGuardError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'board') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runBoardCommand(tareasRoot, argv.slice(1), {
                repoCwd,
                today: today(),
            });
            for (const aviso of result.advertencias) {
                process.stderr.write(`[AVISO] ${aviso}\n`);
            }
            if (result.totalTareas === 0) {
                process.stdout.write('No hay tareas que coincidan (o no hay ninguna tarea todavia).\n');
            }
            else {
                process.stdout.write(`${result.output}\n`);
            }
            if (result.boardPath !== null) {
                process.stdout.write(`\nRegenerado ${result.boardPath} (recuerda commitearlo).\n`);
            }
            return 0;
        }
        catch (e) {
            if (e instanceof BoardCommandError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'start') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runStartCommand(tareasRoot, argv.slice(1), today(), {
                repoCwd,
                scriptsDir: resolveGitflowScriptsDir(),
            });
            printAvisos(result.avisoIdentidad, result.avisoAtribucion, ...result.avisosWip);
            process.stdout.write(`Tarea ${result.id} en curso: rama ${result.rama} creada y confirmada, ` +
                `tarea movida a ${result.filePath}\n${asignacionNotice(result)}`);
            printAutoCommit(result.autoCommit);
            return 0;
        }
        catch (e) {
            // GitflowScriptLaunchError incluido (hallazgo menor de revision
            // por pares, TASK-014, preexistente desde TASK-009): sin esto un
            // bash ilanzable caia al catch-all con "taskctl no pudo arrancar".
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof StartCommandError ||
                e instanceof StateMachineError ||
                e instanceof TaskFolderConflictError ||
                e instanceof GitflowScriptLaunchError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'plan') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runPlanCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
            printBaseBranchSwitchNotice(result.baseBranchGuard);
            printAvisos(result.avisoIdentidad);
            // Tres desenlaces posibles desde TASK-027 (item C3): scaffold
            // nuevo, plan que ya estaba en planificacion/, o plan legado
            // suelto en la raiz que esta invocacion acaba de mover ahi.
            let scaffoldMsg;
            if (result.planMigrado) {
                scaffoldMsg =
                    `El plan estaba suelto en la raiz de la carpeta (formato anterior) y se ha movido ` +
                        `intacto a ${result.planPath}.`;
            }
            else if (result.planCreated) {
                scaffoldMsg = `Scaffold creado en ${result.planPath} — redactalo antes de "taskctl approve".`;
            }
            else {
                scaffoldMsg = `${result.planPath} ya existia (re-planificacion) — se dejo intacto.`;
            }
            process.stdout.write(`Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
                asignacionNotice(result) +
                brainstormNotice(result) +
                seleccionSkillNotice(result));
            printAutoCommit(result.autoCommit);
            return 0;
        }
        catch (e) {
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof HeuristicaError ||
                e instanceof RolesBrainstormError ||
                e instanceof CatalogoSkillsError ||
                e instanceof PlanCommandError ||
                e instanceof StateMachineError ||
                e instanceof TaskFolderConflictError ||
                e instanceof BaseBranchGuardError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'approve') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runApproveCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
            printBaseBranchSwitchNotice(result.baseBranchGuard);
            // Nota (hallazgo menor de revision por pares): para complejidad
            // trivial/simple, "taskctl start" nunca exigio plan_aprobado
            // (ver TRIVIAL_SIN_APROBACION en state-machine.ts) — el mensaje
            // no sobrevende que approve fuera un requisito, solo confirma el
            // resultado del propio comando.
            process.stdout.write(`Tarea ${result.id} aprobada (plan_aprobado: true): ${result.filePath}.\n`);
            printAutoCommit(result.autoCommit);
            return 0;
        }
        catch (e) {
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof ApproveCommandError ||
                e instanceof StateMachineError ||
                e instanceof TaskFolderConflictError ||
                e instanceof BaseBranchGuardError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'review') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runReviewCommand(tareasRoot, argv.slice(1), today(), {
                repoCwd,
                scriptsDir: resolveGitflowScriptsDir(),
            });
            // TASK-018: N pares peticion/informe si el diff se fragmento por
            // dominio, uno solo (el generico) si no. Se listan todos: quien
            // orquesta necesita saber cuantos agentes lanzar y con que
            // peticion cada uno.
            const lineasInformes = result.informes
                .map((grupo) => `Peticion de revision (ronda ${result.ronda}, ${grupo.revisor}): ${grupo.peticionPath}\n` +
                `Lanza ese agente con esa peticion y vuelca su salida en ${grupo.informePath}.\n`)
                .join('');
            process.stdout.write(`Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
                `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n` +
                lineasInformes);
            printAutoCommit(result.autoCommit);
            return 0;
        }
        catch (e) {
            // GitLaunchError/GitCommandError tambien se capturan aqui
            // (hallazgo MENOR de revision por pares, TASK-013): sin esto
            // caian al catch-all de bin/taskctl con el prefijo enganoso
            // "taskctl no pudo arrancar".
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof ReviewCommandError ||
                e instanceof StateMachineError ||
                e instanceof TaskFolderConflictError ||
                e instanceof GitLaunchError ||
                e instanceof GitCommandError ||
                e instanceof GitflowScriptLaunchError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'veredicto') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runVeredictoCommand(tareasRoot, argv.slice(1), { repoCwd });
            process.stdout.write(`Tarea ${result.id}: "${result.linea}" escrito en ${result.informePath} (ronda ${result.ronda}).
`);
            printAutoCommit(result.autoCommit);
            return 0;
        }
        catch (e) {
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof VeredictoCommandError ||
                e instanceof StateMachineError ||
                e instanceof GitLaunchError ||
                e instanceof GitCommandError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'codex-review') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runCodexReviewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
            if (result.degradado) {
                // Codigo 0 a proposito (criterio de aceptacion 3): un Codex
                // ausente o fallando no rompe el flujo. El aviso deja claro por
                // que no hay informe (criterio de aceptacion 5) y que
                // revision_codex sigue bloqueando "taskctl finish" tal cual.
                printAvisos(`Codex ${result.motivoDegradacion} No se ha escrito informe-codex-N.md: si esta tarea ` +
                    'tiene "revision_codex: true", "taskctl finish" sigue bloqueado hasta que haya un ' +
                    'informe de Codex aprobado (arregla/instala codex y reintenta, o quita ' +
                    '"revision_codex: true" si decides que esta tarea no necesita esa segunda opinion).');
                process.stdout.write(`Tarea ${result.id}: codex-review degradado, sin informe escrito.\n`);
            }
            else {
                process.stdout.write(`Tarea ${result.id}: informe de Codex (ronda ${result.ronda}) escrito en ` +
                    `${result.informePath}.\n` +
                    'Veredicto PENDIENTE: lee la salida de Codex embebida y sustituyelo por "aprobada" o ' +
                    '"cambios-solicitados" antes de "taskctl finish".\n');
            }
            printAutoCommit(result.autoCommit);
            return 0;
        }
        catch (e) {
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof CodexReviewCommandError ||
                e instanceof StateMachineError ||
                e instanceof GitLaunchError ||
                e instanceof GitCommandError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    if (cmd === 'finish') {
        const repoCwd = process.cwd();
        const tareasRoot = path.join(repoCwd, 'tareas');
        try {
            const result = await runFinishCommand(tareasRoot, argv.slice(1), today(), {
                repoCwd,
                scriptsDir: resolveGitflowScriptsDir(),
            });
            const mainInfo = result.mainBranch === null ? '' : ` y en "${result.mainBranch}" (con tag)`;
            process.stdout.write(`Tarea ${result.id} terminada: "${result.rama}" integrada en ` +
                `"${result.baseBranch}"${mainInfo}, tarea movida a ${result.filePath}.\n` +
                `Actualizados: ${result.changelogPath}, ${result.indexPath} y ${result.boardPath}.\n`);
            printAutoCommit(result.autoCommit);
            // --push empuja LA RAMA ACTUAL, que tras "finish" es develop
            // (misma doctrina que "taskctl pause --push"). En hotfix/release
            // hay ademas un merge a main y un tag que NO se suben: callarlo
            // dejaria creer que la publicacion esta completa.
            if (result.mainBranch !== null && result.autoCommit.push === 'empujado') {
                printAvisos(`--push ha subido "${result.autoCommit.rama}", pero NO "${result.mainBranch}" ni el ` +
                    `tag de esta ${result.rama.split('/')[0]}: subelos tu ` +
                    `("git push origin ${result.mainBranch} --follow-tags").`);
            }
            return 0;
        }
        catch (e) {
            if (e instanceof AutoCommitError ||
                e instanceof ConfigError ||
                e instanceof FinishCommandError ||
                e instanceof StateMachineError ||
                e instanceof TaskFolderConflictError ||
                e instanceof GitLaunchError ||
                e instanceof GitCommandError ||
                e instanceof GitflowScriptLaunchError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    // Los cinco wrappers de Git-Flow (TASK-026). Van al final a
    // proposito: son los unicos comandos que no tocan "tareas/", asi
    // que ninguna de las precondiciones de arriba (maquina de estados,
    // rama base de la 8.3) les aplica.
    if (isWrapperCommand(cmd)) {
        const repoCwd = process.cwd();
        try {
            const result = runWrapperCommand(cmd, argv.slice(1), {
                repoCwd,
                scriptsDir: resolveGitflowScriptsDir(),
                // Sin TTY no hay a quien preguntar. Es mas estricto que la
                // realidad (una tuberia con las respuestas escritas tambien
                // valdria), y es deliberado: distinguir "tuberia con
                // respuestas" de "tuberia vacia" solo se puede hacer leyendo,
                // y leer stdin aqui le robaria al script su respuesta. Con
                // una tuberia abierta y vacia, ademas, heredarla colgaria el
                // comando para siempre.
                interactivo: process.stdin.isTTY === true,
                onAviso: (aviso) => printAvisos(aviso),
            });
            // Una senal (un Ctrl-C sobre el script, por ejemplo) no deja
            // codigo de salida util: se dice y se sale con 1, igual que
            // hacen start/review/finish (hallazgo MENOR de revision por
            // pares).
            if (result.signal !== null) {
                process.stderr.write(`[ERROR] ${result.script} termino por senal ${result.signal}. Revisa el estado del ` +
                    'repo con "taskctl diagnose" antes de reintentar.\n');
                return 1;
            }
            // El codigo del script se propaga tal cual: un "pause"
            // cancelado sale 0 y uno con opcion no reconocida sale 1.
            return result.code;
        }
        catch (e) {
            if (e instanceof WrapperCommandError ||
                e instanceof GitflowScriptLaunchError ||
                e instanceof GitLaunchError ||
                e instanceof GitCommandError) {
                printCliError(e);
                return 1;
            }
            throw e;
        }
    }
    process.stderr.write(`[ERROR] Comando desconocido: "${cmd}"\n\n${HELP}`);
    return 1;
}
