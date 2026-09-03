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

/**
 * Rangos aproximados de caracteres de ancho visual doble (East Asian
 * Wide/Fullwidth + emoji comunes). Hallazgo IMPORTANTE de revision
 * por pares: calcular el ancho de columna con `.length` (unidades
 * UTF-16) desalineaba la tabla con un titulo en CJK (1 unidad de
 * longitud, 2 columnas visuales en cualquier terminal real) —
 * reproducido y confirmado por el revisor con "cat -A" sobre la
 * salida real. No es una tabla Unicode completa (no existe una en la
 * biblioteca estandar de Node sin depender de un paquete externo,
 * fuera del alcance de "cero dependencias" del proyecto), pero cubre
 * los bloques CJK/Hangul/Fullwidth/emoji mas comunes, que es lo que
 * de verdad aparece en un titulo de tarea.
 */
function isWideCodePoint(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) || // Jamo de Hangul
    cp === 0x2329 ||
    cp === 0x232a ||
    (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) || // Radicales CJK .. Yi
    (cp >= 0xac00 && cp <= 0xd7a3) || // Silabas de Hangul
    (cp >= 0xf900 && cp <= 0xfaff) || // Ideogramas de compatibilidad CJK
    (cp >= 0xfe30 && cp <= 0xfe6f) || // Formas de compatibilidad CJK
    (cp >= 0xff00 && cp <= 0xff60) || // Formas de ancho completo
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1fadf) || // Emoji (rango comun)
    (cp >= 0x20000 && cp <= 0x3fffd) // Extensiones CJK (planos suplementarios)
  );
}

/** Ancho visual aproximado en columnas de terminal, no numero de unidades UTF-16. */
function visualWidth(s: string): number {
  let width = 0;
  for (const ch of s) {
    width += isWideCodePoint(ch.codePointAt(0) ?? 0) ? 2 : 1;
  }
  return width;
}

/**
 * Sustituye caracteres de control (tabuladores, saltos de linea
 * embebidos, etc.) por un espacio antes de calcular anchos o
 * renderizar (hallazgo IMPORTANTE de revision por pares: un titulo
 * con un tabulador colado se expande de forma impredecible en una
 * terminal real y rompe la alineacion, sin que `visualWidth` pueda
 * preverlo). Defensa en el propio formateador, independiente de si
 * `task.ts` llega a validar esto en el futuro.
 */
function sanitizeCell(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x1f\x7f]/g, ' ');
}

function padEndVisible(s: string, width: number): string {
  const vw = visualWidth(s);
  return vw >= width ? s : s + ' '.repeat(width - vw);
}

function formatTable(tasks: readonly Task[]): string[] {
  const header = ['ID', 'Titulo', 'Asignado'];
  const rows = tasks.map((t) =>
    [t.id, t.titulo, t.asignado_a ?? '(sin asignar)'].map(sanitizeCell)
  );
  const allRows = [header, ...rows];
  const widths = header.map((_, col) => Math.max(...allRows.map((r) => visualWidth(r[col] ?? ''))));
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
