/**
 * Modelo de la ronda de verificacion — TASK-081. Puro.
 *
 * La ronda 2 de una revision comprueba que las correcciones de la ronda 1
 * resuelven los hallazgos: es un trabajo mas acotado que la primera lectura,
 * y puede hacerlo un modelo un escalon por debajo del de la tarea. Cuando se
 * sugiere lo decide `review.ts` con una regla estricta; aqui solo vive la
 * escalera y el paso de un modelo al siguiente.
 */

/** Escalera de modelos, de mas caro a mas barato. */
export const ESCALERA_MODELOS: readonly string[] = ['opus', 'sonnet', 'haiku'];

/**
 * El modelo con que verificar las correcciones cuando la tarea usa `modelo`:
 * el escalon siguiente de la escalera. `null` si no hay escalon por debajo
 * (ya es haiku) o si el modelo no esta en la escalera: no se sugiere nada.
 */
export function modeloDeVerificacion(modelo: string): string | null {
  const i = ESCALERA_MODELOS.indexOf(modelo.trim().toLowerCase());
  if (i === -1) return null;
  return ESCALERA_MODELOS[i + 1] ?? null;
}
