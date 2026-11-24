/**
 * TASK-138a (A2 de docs/auditoria-4d.md y CORE2-11 de la auditoria 4D
 * completa): la mediana, una sola vez. Estaba escrita en core/metricas.ts, en
 * crecimiento-suite.ts y en linea dentro de versiones-metricas.ts. Sin
 * dependencias: la usan metricas, evolucion y el aviso de crecimiento de doctor.
 */

/** Mediana de una lista (media de los dos centrales si es par); null si esta vacia. */
export function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? (v[m] as number) : ((v[m - 1] as number) + (v[m] as number)) / 2;
}
