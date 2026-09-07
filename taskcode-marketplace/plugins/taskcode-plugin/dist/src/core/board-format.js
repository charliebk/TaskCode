/**
 * Filtrado y formateo en texto plano de "taskctl board" (TASK-005 de
 * PLAN_SPRINTS.md). Modulo puro: no toca disco. Recibe la lista de
 * tareas ya leida (src/commands/board.ts se encarga de leerlas) y
 * decide que se filtra y como se ve la tabla.
 */
import { TASK_STATES, STATE_FOLDER } from './task.js';
export function filterTasks(tasks, filters) {
    return tasks.filter((t) => {
        if (filters.sprint !== undefined && t.sprint !== filters.sprint)
            return false;
        if (filters.asignadoA !== undefined && t.asignado_a !== filters.asignadoA)
            return false;
        return true;
    });
}
const STATE_LABEL = {
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
function taskIdSortKey(id) {
    const m = TASK_ID_NUM_RE.exec(id);
    return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
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
function isWideCodePoint(cp) {
    return ((cp >= 0x1100 && cp <= 0x115f) || // Jamo de Hangul
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
function visualWidth(s) {
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
function sanitizeCell(s) {
    // eslint-disable-next-line no-control-regex
    return s.replace(/[\x00-\x1f\x7f]/g, ' ');
}
function padEndVisible(s, width) {
    const vw = visualWidth(s);
    return vw >= width ? s : s + ' '.repeat(width - vw);
}
function formatTable(tasks) {
    const header = ['ID', 'Titulo', 'Asignado'];
    const rows = tasks.map((t) => [t.id, t.titulo, t.asignado_a ?? '(sin asignar)'].map(sanitizeCell));
    const allRows = [header, ...rows];
    const widths = header.map((_, col) => Math.max(...allRows.map((r) => visualWidth(r[col] ?? ''))));
    const formatRow = (r) => r.map((cell, i) => padEndVisible(cell, widths[i] ?? 0)).join('  ').trimEnd();
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
export function formatBoard(tasks) {
    const blocks = [];
    for (const estado of TASK_STATES) {
        const grupo = tasks
            .filter((t) => t.estado === estado)
            .sort((a, b) => taskIdSortKey(a.id) - taskIdSortKey(b.id));
        if (grupo.length === 0)
            continue;
        const header = `## ${STATE_LABEL[estado]} (${STATE_FOLDER[estado]}) — ${grupo.length}`;
        blocks.push([header, ...formatTable(grupo)].join('\n'));
    }
    return blocks.join('\n\n');
}
/**
 * Documento completo de `docs/BOARD.md`. Unica fuente del formato del
 * fichero: la comparten "taskctl finish" (que lo regenera al cerrar una
 * tarea) y "taskctl board --escribir" (item B5 del plan de terminacion,
 * que resuelve la divergencia con la tabla de la seccion 8 de la
 * metodologia: alli el comando "regenera docs/BOARD.md").
 *
 * Las tablas van dentro de vallas de codigo a proposito: son texto
 * alineado con espacios, y sin valla cualquier visor de Markdown junta
 * sus lineas en un parrafo y destruye la alineacion. Las cabeceras de
 * estado ("## Planificadas...") se dejan fuera para que sigan siendo
 * navegables como secciones.
 *
 * La valla es FIJA (tres backticks), a diferencia de la dinamica de
 * review.ts, y es seguro porque ninguna linea embebida puede cerrarla:
 * dentro de la valla solo van filas de tabla, que empiezan siempre por
 * la columna ID ("TASK-NNN", "ID" o los guiones del separador), y
 * CommonMark exige que el cierre sean solo backticks en toda la linea.
 * Un titulo con backticks queda a partir de la segunda columna, nunca
 * al principio. Si alguna vez se reordenan las columnas y el titulo
 * pasa a ir primero, esto deja de ser cierto y habria que calcular la
 * valla como en review.ts (comprobado por revision por pares, B5).
 */
export function renderBoardMarkdown(boardOutput, advertencias, fecha, generadoPor) {
    const partes = [
        '# Tablero de tareas',
        '',
        `> Generado automaticamente por ${generadoPor} el ${fecha}. No editar a mano.`,
    ];
    if (advertencias.length > 0) {
        partes.push('>', '> Avisos del render:', ...advertencias.map((a) => `> - ${a}`));
    }
    partes.push('');
    let enTabla = false;
    for (const linea of boardOutput.split('\n')) {
        if (linea.startsWith('## ')) {
            if (enTabla) {
                partes.push('```', '');
                enTabla = false;
            }
            partes.push(linea, '');
            continue;
        }
        if (linea.trim() === '') {
            if (enTabla) {
                partes.push('```', '');
                enTabla = false;
            }
            continue;
        }
        if (!enTabla) {
            partes.push('```text');
            enTabla = true;
        }
        partes.push(linea);
    }
    if (enTabla)
        partes.push('```');
    return `${partes.join('\n').trimEnd()}\n`;
}
