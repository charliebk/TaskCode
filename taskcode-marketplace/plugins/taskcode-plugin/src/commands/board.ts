/**
 * taskctl board — listado de tareas por estado (TASK-005 de
 * PLAN_SPRINTS.md). A diferencia de "new"/"import"/"plan"/"approve",
 * board es de SOLO LECTURA: no crea ni modifica ningun fichero de
 * tareas/ ni toca Git, asi que no aplica la precondicion de rama base
 * de la seccion 8.3 (esa precondicion es para comandos que escriben
 * en la rama activa — TASK-012 ya lo dice explicitamente para "start",
 * y por el mismo motivo tampoco aplica aqui).
 *
 * Lee CADA tarea existente (no solo los nombres de carpeta) para poder
 * filtrar y mostrar titulo/asignado — a diferencia de "import", que
 * solo necesitaba el titulo de las tareas ya existentes para detectar
 * duplicados, board los necesita todos para el listado en si. Aplica
 * el mismo tratamiento que TASK-004 establecio para una tarea.md
 * invalida ajena (FrontmatterParseError/TaskValidationError): se
 * reporta como advertencia y esa tarea concreta no aparece en el
 * board, en vez de romper el comando entero.
 */
import { parseArgs } from '../cli/args.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { TaskValidationError, type Task } from '../core/task.js';
import { filterTasks, formatBoard, type BoardFilters } from '../core/board-format.js';
import { listExistingTaskIds, readTareaFile } from '../fs/task-store.js';

export class BoardCommandError extends Error {}

export function parseBoardArgs(argv: readonly string[]): BoardFilters {
  const { flags } = parseArgs(argv);
  const filters: BoardFilters = {};

  const sprintRaw = flags['sprint'];
  if (sprintRaw !== undefined) {
    if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
      throw new BoardCommandError('--sprint debe ser un numero entero no negativo.');
    }
    filters.sprint = parseInt(sprintRaw, 10);
  }

  // Nombre del flag con guion bajo, no guion medio (--asignado_a, no
  // --asignado-a): asi lo especifica el Objetivo de TASK-005, a
  // proposito igual al nombre del campo en el frontmatter de la tarea
  // aunque rompa la convencion de guiones del resto de flags del CLI.
  const asignadoRaw = flags['asignado_a'];
  if (asignadoRaw !== undefined) {
    if (typeof asignadoRaw !== 'string' || asignadoRaw.trim() === '') {
      throw new BoardCommandError('--asignado_a debe ser un valor no vacio.');
    }
    filters.asignadoA = asignadoRaw;
  }

  return filters;
}

export interface BoardCommandResult {
  output: string;
  totalTareas: number;
  advertencias: string[];
}

export async function runBoardCommand(
  tareasRoot: string,
  argv: readonly string[]
): Promise<BoardCommandResult> {
  const filters = parseBoardArgs(argv);

  const ids = await listExistingTaskIds(tareasRoot);
  const tasks: Task[] = [];
  const advertencias: string[] = [];

  await Promise.all(
    ids.map(async (id) => {
      try {
        const read = await readTareaFile(tareasRoot, id);
        if (read) tasks.push(read.task);
      } catch (e: unknown) {
        if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
          const msg = e instanceof Error ? e.message : String(e);
          advertencias.push(`${id} tiene un tarea.md invalido y no aparece en el board: ${msg}`);
          return;
        }
        throw e;
      }
    })
  );

  const filtered = filterTasks(tasks, filters);
  const output = formatBoard(filtered);

  return { output, totalTareas: filtered.length, advertencias };
}
