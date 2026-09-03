/**
 * Generacion determinista del siguiente ID de tarea (TASK-003 de
 * PLAN_SPRINTS.md): maximo ID existente + 1, sin colisiones, sin
 * tocar el sistema de archivos (eso lo hace src/fs/task-store.ts).
 */
const TASK_ID_RE = /^TASK-(\d{3,})$/;

export function nextTaskId(existingIds: readonly string[]): string {
  let max = 0;
  for (const id of existingIds) {
    const m = TASK_ID_RE.exec(id);
    if (!m) continue;
    const n = parseInt(m[1] as string, 10);
    if (n > max) max = n;
  }
  const next = max + 1;
  return `TASK-${String(next).padStart(3, '0')}`;
}
