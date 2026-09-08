/**
 * Utilidades de composicion de Markdown compartidas por los comandos
 * que embeben contenido ajeno en un fichero (`review` con el diff,
 * `plan` con el objetivo y los criterios de la tarea).
 *
 * `fenceFor` vivia en commands/review.ts desde TASK-013 y era el unico
 * que la usaba. TASK-016 la necesita tambien desde commands/plan.ts, y
 * que un comando importe de otro es acoplamiento lateral: los dos
 * dependen ahora de este modulo y `review.ts` la re-exporta para no
 * romper a quien ya la importaba de alli.
 */

/**
 * Valla de backticks mas larga que cualquier apertura/cierre de valla
 * presente en el contenido embebido (CommonMark tolera hasta 3
 * espacios de sangria, que es justo lo que produce una linea de
 * contexto de diff con backticks a columna 0 — hallazgo MENOR de
 * revision por pares, TASK-013: con valla fija de 4, un diff cuyo
 * contexto contenga ```` cerraba el bloque antes de tiempo).
 */
export function fenceFor(...contents: readonly string[]): string {
  let max = 3;
  for (const content of contents) {
    for (const m of content.matchAll(/^ {0,3}(`{3,})/gm)) {
      max = Math.max(max, (m[1] as string).length);
    }
  }
  return '`'.repeat(max + 1);
}
