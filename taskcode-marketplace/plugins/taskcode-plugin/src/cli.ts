/**
 * Punto de entrada del CLI. Sprint 0: --help/--version y el comando
 * "new" (TASK-003). "import"/"board" llegan en TASK-004/005.
 */
import path from 'node:path';
import { runNewCommand, NewTaskArgError } from './commands/new.js';
import { runStartCommand, StartCommandError } from './commands/start.js';
import { runPlanCommand, PlanCommandError } from './commands/plan.js';
import { resolveGitflowScriptsDir } from './fs/gitflow-runner.js';
import { StateMachineError } from './core/state-machine.js';

const VERSION = '0.1.0';

const HELP = `taskctl ${VERSION} — TaskCode

Uso:
  taskctl --help
  taskctl --version
  taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release> \\
              [--sprint N] [--etiquetas a,b,c] [--complejidad ...] \\
              [--modelo-sugerido ...] [--agente-revisor ...]
  taskctl start TASK-NNN
  taskctl plan TASK-NNN

Comandos: new, start, plan. import, board, approve llegan a
continuacion. Ver docs/PLAN_SPRINTS.md en el repo del proyecto.
`;

function today(): string {
  return new Date().toISOString().slice(0, 10);
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
    const tareasRoot = path.join(process.cwd(), 'tareas');
    try {
      const result = await runNewCommand(tareasRoot, argv.slice(1), today());
      process.stdout.write(`Tarea ${result.id} creada: ${result.filePath}\n`);
      return 0;
    } catch (e) {
      if (e instanceof NewTaskArgError) {
        process.stderr.write(`[ERROR] ${e.message}\n`);
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
      process.stdout.write(
        `Tarea ${result.id} en curso: rama ${result.rama} creada y confirmada, ` +
          `tarea movida a ${result.filePath}\n`
      );
      return 0;
    } catch (e) {
      if (e instanceof StartCommandError || e instanceof StateMachineError) {
        process.stderr.write(`${e.message}\n`);
        return 1;
      }
      throw e;
    }
  }

  if (cmd === 'plan') {
    const tareasRoot = path.join(process.cwd(), 'tareas');
    try {
      const result = await runPlanCommand(tareasRoot, argv.slice(1), today());
      const scaffoldMsg = result.planCreated
        ? `Scaffold creado en ${result.planPath} — redactalo antes de "taskctl approve".`
        : `${result.planPath} ya existia (re-planificacion) — se dejo intacto.`;
      process.stdout.write(
        `Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n`
      );
      return 0;
    } catch (e) {
      if (e instanceof PlanCommandError || e instanceof StateMachineError) {
        process.stderr.write(`${e.message}\n`);
        return 1;
      }
      throw e;
    }
  }

  process.stderr.write(`[ERROR] Comando desconocido: "${cmd}"\n\n${HELP}`);
  return 1;
}
