/**
 * Punto de entrada del CLI. Sprint 0: --help/--version y el comando
 * "new" (TASK-003). "import"/"board" llegan en TASK-004/005.
 */
import path from 'node:path';
import { runNewCommand, NewTaskArgError } from './commands/new.js';

const VERSION = '0.1.0';

const HELP = `taskctl ${VERSION} — TaskCode

Uso:
  taskctl --help
  taskctl --version
  taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release> \\
              [--sprint N] [--etiquetas a,b,c] [--complejidad ...] \\
              [--modelo-sugerido ...] [--agente-revisor ...]

Comandos (Sprint 0, en construccion): new. import y board llegan a
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

  process.stderr.write(`[ERROR] Comando desconocido: "${cmd}"\n\n${HELP}`);
  return 1;
}
