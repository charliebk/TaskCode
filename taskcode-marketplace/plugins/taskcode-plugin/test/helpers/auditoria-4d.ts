/** TASK-167d: un informe de auditoria 4D con el formato de la skill, para los tests del core y de metricas. */
/** Un informe con el formato de la skill; `filas` sustituye las del resumen. */
export function informe4D(filas: Record<string, string> = {}): string {
  const fila = (d: string, v: string): string => `| ${d} | ${filas[d] ?? v} |`;
  return [
    '# Auditoria 4D — 2026-11-25',
    '',
    '- Commit: abc',
    '',
    '## Resumen',
    '',
    '| D | CRITICO | IMPORTANTE | MENOR |',
    '|---|---|---|---|',
    fila('Duplicacion', '1 | 2 | 3'),
    fila('Desviacion', '0 | 1 | 0'),
    fila('Diluvio', '0 | 0 | 4'),
    fila('Disfraz', '0 | 2 | 1'),
    fila('Total', '1 | 5 | 8'),
    '',
    '## Hallazgos',
    '',
  ].join('\r\n');
}
