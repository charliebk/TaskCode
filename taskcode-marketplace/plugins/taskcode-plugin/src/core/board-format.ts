/**
 * Filtrado y formateo en texto plano de "taskctl board" (TASK-005 de
 * PLAN_SPRINTS.md). Modulo puro: no toca disco. Recibe la lista de
 * tareas ya leida (src/commands/board.ts se encarga de leerlas) y
 * decide que se filtra y como se ve la tabla.
 */
import { TASK_STATES, STATE_FOLDER, type Task, type TaskState } from './task.js';

export interface BoardFilters {
  sprint?: number;
  asignadoA?: string;
}

export function filterTasks(tasks: readonly Task[], filters: BoardFilters): Task[] {
  return tasks.filter((t) => {
    if (filters.sprint !== undefined && t.sprint !== filters.sprint) return false;
    if (filters.asignadoA !== undefined && t.asignado_a !== filters.asignadoA) return false;
    return true;
  });
}

const STATE_LABEL: Record<TaskState, string> = {
  planificada: 'Planificadas',
  'en-diseno': 'En diseno',
  'en-curso': 'En curso',
  'en-revision': 'En revision',
  terminada: 'Terminadas',
};

const TASK_ID_NUM_RE = /^TASK-(\d+)$/;

/**
 * Orden numerico por ID, no alfabetico (un ID de 4+ digitos, p. ej.
 * "TASK-1000", ordenaria mal por delante de "TASK-999" con un
 * `localeCompare`/`<` puramente lexicografico: '1' < '9' como primer
 * caracter que difiere). Con los IDs de 3 digitos de hoy no se nota,
 * pero es gratis evitarlo ahora.
 */
function taskIdSortKey(id: string): number {
  const m = TASK_ID_NUM_RE.exec(id);
  return m ? parseInt(m[1] as string, 10) : Number.POSITIVE_INFINITY;
}

function padEndVisible(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

function formatTable(tasks: readonly Task[]): string[] {
  const header = ['ID', 'Titulo', 'Asignado'];
  const rows = tasks.map((t) => [t.id, t.titulo, t.asignado_a ?? '(sin asignar)']);
  const allRows = [header, ...rows];
  const widths = header.map((_, col) => Math.max(...allRows.map((r) => (r[col] ?? '').length)));
  const formatRow = (r: readonly string[]): string =>
    r.map((cell, i) => padEndVisible(cell, widths[i] ?? 0)).join('  ').trimEnd();
  const separator = widths.map((w) => '-'.repeat(w)).join('  ');
  return [formatRow(header), separator, ...rows.map(formatRow)];
}

/**
 * Agrupa por estado, en el orden del ciclo de vida (seccion 5 de la
 * metodologia: 00-planificadas -> ... -> 04-terminadas). Un estado sin
 * tareas (tras aplicar los filtros) NO imprime cabecera (criterio de
 * aceptacion de TASK-005). Dentro de cada grupo, orden numerico por ID
 * (deterministico, no depende del orden de lectura del filesystem).
 */
export function formatBoard(tasks: readonly Task[]): string {
  const blocks: string[] = [];
  for (const estado of TASK_STATES) {
    const grupo = tasks
      .filter((t) => t.estado === estado)
      .sort((a, b) => taskIdSortKey(a.id) - taskIdSortKey(b.id));
    if (grupo.length === 0) continue;
    const header = `## ${STATE_LABEL[estado]} (${STATE_FOLDER[estado]}) — ${grupo.length}`;
    blocks.push([header, ...formatTable(grupo)].join('\n'));
  }
  return blocks.join('\n\n');
}
