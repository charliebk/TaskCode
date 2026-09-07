/**
 * Combina el parser generico de frontmatter con la validacion de
 * Task para leer/escribir ficheros `tarea.md` completos.
 */
import { parseFrontmatter, serializeFrontmatter } from './frontmatter.js';
import { validateTask, TASK_FIELD_ORDER } from './task.js';
export function parseTareaFile(content) {
    const { data, body } = parseFrontmatter(content);
    const task = validateTask(data);
    return { task, body };
}
export function serializeTareaFile(task, body) {
    // Revalida antes de escribir: nunca se serializa un Task que no
    // pasaria su propio parser (evita escribir ficheros corruptos).
    const validated = validateTask(task);
    return serializeFrontmatter(validated, body, TASK_FIELD_ORDER);
}
