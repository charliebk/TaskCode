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
import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
import { runReviewCommand, ReviewCommandError } from './commands/review.js';
import { runFinishCommand, FinishCommandError } from './commands/finish.js';
import {
  isWrapperCommand,
  runWrapperCommand,
  WrapperCommandError,
} from './commands/wrappers.js';
import { resolveGitflowScriptsDir, GitflowScriptLaunchError } from './fs/gitflow-runner.js';
import { StateMachineError } from './core/state-machine.js';
import { TaskFolderConflictError } from './fs/task-store.js';
import {
  BaseBranchGuardError,
  GitCommandError,
  GitLaunchError,
  type BaseBranchGuardResult,
} from './fs/git.js';

const VERSION = '0.1.0';

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
  taskctl start TASK-NNN [--asignado-a <persona>]
  taskctl plan TASK-NNN [--asignado-a <persona>]
  taskctl approve TASK-NNN
  taskctl review TASK-NNN
  taskctl finish TASK-NNN
  taskctl diagnose
  taskctl pause [--push]
  taskctl resume [<rama>]
  taskctl recover [<rama>]
  taskctl abort-merge

Comandos: new, import, board, start, plan, approve, review, finish.
Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
--asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
Los wrappers preguntan (guardar como commit o stash, confirmar un abort...):
ejecutalos desde una terminal. Sin ella toman el valor por defecto de cada
pregunta, avisando de cual; y cuando ese valor haria lo contrario de lo que
dice el comando, taskctl aborta antes con instrucciones.
Ver docs/PLAN_SPRINTS.md en el repo del proyecto.
`;

function today(): string {
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
function printCliError(e: Error): void {
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
function printBaseBranchSwitchNotice(guard: BaseBranchGuardResult): void {
  if (!guard.switched) return;
  process.stdout.write(
    `Workspace limpio -> cambiado automaticamente de "${guard.branchAntes}" a ` +
      `"${guard.baseBranch}".\n`
  );
}

/**
 * Confirmacion de --asignado-a (item B6). Solo se imprime cuando el
 * flag CAMBIO algo: si la tarea ya venia asignada a esa misma persona,
 * repetirlo seria ruido. Y se imprime siempre que cambie, tambien
 * cuando "plan" ya la habia asignado y "start" la reasigna — ahi es
 * justo donde interesa que se vea.
 */
function asignacionNotice(result: { asignadoA: string | null; asignadoCambiado: boolean }): string {
  if (!result.asignadoCambiado || result.asignadoA === null) return '';
  return `Asignada a "${result.asignadoA}".\n`;
}

/**
 * Avisos de asignacion (TASK-024) por stderr: no son errores, el
 * comando ha hecho su trabajo, pero la persona necesita enterarse.
 * Uno se emite cuando su "git config user.email" no sirve como
 * asignado_a; el otro, cuando arranca una tarea que esta a nombre de
 * otra persona.
 */
function printAvisos(...avisos: readonly (string | null | undefined)[]): void {
  for (const aviso of avisos) {
    if (aviso) process.stderr.write(`[AVISO] ${aviso}\n`);
  }
}

export async function main(argv: readonly string[]): Promise<number> {
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
      process.stdout.write(`Tarea ${result.id} creada: ${result.filePath}\n`);
      return 0;
    } catch (e) {
      if (e instanceof NewTaskArgError || e instanceof BaseBranchGuardError) {
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
        process.stderr.write(
          `[ERROR] Linea ${error.lineNumber} ("${error.tituloRaw}"): ${error.motivo}\n`
        );
      }
      for (const omitida of result.omitidas) {
        process.stdout.write(`Omitida "${omitida.titulo}": ${omitida.motivo}\n`);
      }
      for (const creada of result.creadas) {
        process.stdout.write(`Tarea ${creada.id} creada: ${creada.filePath}\n`);
      }
      process.stdout.write(
        `Import completado: ${result.creadas.length} creada(s), ` +
          `${result.omitidas.length} omitida(s), ${result.errores.length} con error.\n`
      );
      // Hallazgo IMPORTANTE de revision por pares (TASK-004): antes
      // siempre devolvia 0, incluso si TODAS las entradas fallaban —
      // un "taskctl import x.md && siguiente_paso" en un script nunca
      // se enteraba de que el import no creo nada.
      return result.errores.length > 0 ? 1 : 0;
    } catch (e) {
      if (e instanceof ImportCommandError || e instanceof BaseBranchGuardError) {
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
      } else {
        process.stdout.write(`${result.output}\n`);
      }
      if (result.boardPath !== null) {
        process.stdout.write(`\nRegenerado ${result.boardPath} (recuerda commitearlo).\n`);
      }
      return 0;
    } catch (e) {
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
      process.stdout.write(
        `Tarea ${result.id} en curso: rama ${result.rama} creada y confirmada, ` +
          `tarea movida a ${result.filePath}\n${asignacionNotice(result)}`
      );
      return 0;
    } catch (e) {
      // GitflowScriptLaunchError incluido (hallazgo menor de revision
      // por pares, TASK-014, preexistente desde TASK-009): sin esto un
      // bash ilanzable caia al catch-all con "taskctl no pudo arrancar".
      if (
        e instanceof StartCommandError ||
        e instanceof StateMachineError ||
        e instanceof TaskFolderConflictError ||
        e instanceof GitflowScriptLaunchError
      ) {
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
      const scaffoldMsg = result.planCreated
        ? `Scaffold creado en ${result.planPath} — redactalo antes de "taskctl approve".`
        : `${result.planPath} ya existia (re-planificacion) — se dejo intacto.`;
      process.stdout.write(
        `Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
          asignacionNotice(result)
      );
      return 0;
    } catch (e) {
      if (
        e instanceof PlanCommandError ||
        e instanceof StateMachineError ||
        e instanceof TaskFolderConflictError ||
        e instanceof BaseBranchGuardError
      ) {
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
      process.stdout.write(
        `Tarea ${result.id} aprobada (plan_aprobado: true): ${result.filePath}.\n`
      );
      return 0;
    } catch (e) {
      if (
        e instanceof ApproveCommandError ||
        e instanceof StateMachineError ||
        e instanceof TaskFolderConflictError ||
        e instanceof BaseBranchGuardError
      ) {
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
      process.stdout.write(
        `Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
          `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n` +
          `Peticion de revision (ronda ${result.ronda}): ${result.peticionPath}\n` +
          `Lanza el agente revisor con esa peticion y vuelca su salida en ` +
          `${result.informePath}.\n`
      );
      return 0;
    } catch (e) {
      // GitLaunchError/GitCommandError tambien se capturan aqui
      // (hallazgo MENOR de revision por pares, TASK-013): sin esto
      // caian al catch-all de bin/taskctl con el prefijo enganoso
      // "taskctl no pudo arrancar".
      if (
        e instanceof ReviewCommandError ||
        e instanceof StateMachineError ||
        e instanceof TaskFolderConflictError ||
        e instanceof GitLaunchError ||
        e instanceof GitCommandError ||
        e instanceof GitflowScriptLaunchError
      ) {
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
      process.stdout.write(
        `Tarea ${result.id} terminada: "${result.rama}" integrada en ` +
          `"${result.baseBranch}"${mainInfo}, tarea movida a ${result.filePath}.\n` +
          `Actualizados: ${result.changelogPath}, ${result.indexPath} y ${result.boardPath}.\n` +
          'Recuerda commitear y subir el resultado (el auto-commit es la decision #14, aun ' +
          'abierta).\n'
      );
      return 0;
    } catch (e) {
      if (
        e instanceof FinishCommandError ||
        e instanceof StateMachineError ||
        e instanceof TaskFolderConflictError ||
        e instanceof GitLaunchError ||
        e instanceof GitCommandError ||
        e instanceof GitflowScriptLaunchError
      ) {
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
        process.stderr.write(
          `[ERROR] ${result.script} termino por senal ${result.signal}. Revisa el estado del ` +
            'repo con "taskctl diagnose" antes de reintentar.\n'
        );
        return 1;
      }
      // El codigo del script se propaga tal cual: un "pause"
      // cancelado sale 0 y uno con opcion no reconocida sale 1.
      return result.code;
    } catch (e) {
      if (
        e instanceof WrapperCommandError ||
        e instanceof GitflowScriptLaunchError ||
        e instanceof GitLaunchError ||
        e instanceof GitCommandError
      ) {
        printCliError(e);
        return 1;
      }
      throw e;
    }
  }

  process.stderr.write(`[ERROR] Comando desconocido: "${cmd}"\n\n${HELP}`);
  return 1;
}
