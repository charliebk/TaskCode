/**
 * TASK-167c: el formato del informe de la auditoria 4D invocable
 * (`skills/auditoria-4d`). Es la fuente unica: la skill lo escribe con estas
 * secciones y cabeceras, su test lo exige, y `taskctl metricas` (TASK-167d)
 * lo lee para la tendencia entre auditorias.
 */
/** Carpeta del proyecto donde se dejan los informes. */
export const CARPETA_AUDITORIA_4D = 'docs';
/** Nombre del informe de una fecha (AAAA-MM-DD). */
export const nombreInformeAuditoria4D = (fecha) => `auditoria-4d-${fecha}.md`;
/**
 * Reconoce un informe por su nombre; el grupo 1 es la fecha y el 2, si lo
 * hay, el numero de la auditoria de ese dia (`-2`, `-3`... la primera no lleva).
 */
export const PATRON_INFORME_AUDITORIA_4D = /^auditoria-4d-(\d{4}-\d{2}-\d{2})(?:-(\d+))?\.md$/;
/** Las cuatro D, en el orden en que salen en el resumen. */
export const DES_4D = ['Duplicacion', 'Desviacion', 'Diluvio', 'Disfraz'];
export const SEVERIDADES_4D = ['CRITICO', 'IMPORTANTE', 'MENOR'];
export const SECCION_RESUMEN_4D = '## Resumen';
export const SECCION_HALLAZGOS_4D = '## Hallazgos';
export const SECCION_OLAS_4D = '## Plan por olas';
/**
 * Cabecera de la tabla de `## Resumen`: una fila por D y una de total, con
 * numeros. La tendencia entre auditorias se lee de aqui; la tabla de
 * hallazgos es el detalle (la skill cuenta el resumen a partir de ella).
 */
export const CABECERA_RESUMEN_4D = `| D | ${SEVERIDADES_4D.join(' | ')} |`;
/** Cabecera de la tabla de `## Hallazgos`. */
export const CABECERA_HALLAZGOS_4D = '| ID | D | Severidad | Fichero | Hallazgo | Ola |';
/** Encabezado de cada ola en `## Plan por olas`: `### Ola N: <titulo>`. */
export const PATRON_OLA_4D = /^### Ola (\d+): (.+)$/;
