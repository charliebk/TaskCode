/**
 * Combina el parser generico de frontmatter con la validacion de
 * Task para leer/escribir ficheros `tarea.md` completos.
 */
import { parseFrontmatter, serializeFrontmatter } from './frontmatter.js';
import { validateTask, TASK_FIELD_ORDER, type Task } from './task.js';

export interface TareaFile {
  task: Task;
  body: string;
}

export function parseTareaFile(content: string): TareaFile {
  const { data, body } = parseFrontmatter(content);
  const task = validateTask(data);
  return { task, body };
}

export function serializeTareaFile(task: Task, body: string): string {
  // Revalida antes de escribir: nunca se serializa un Task que no
  // pasaria su propio parser (evita escribir ficheros corruptos).
  const validated = validateTask(task as unknown as Record<string, unknown>);
  return serializeFrontmatter(
    validated as unknown as Record<string, unknown>,
    body,
    TASK_FIELD_ORDER
  );
}
