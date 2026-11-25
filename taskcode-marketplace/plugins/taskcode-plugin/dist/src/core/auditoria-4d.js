/**
 * TASK-167c: el formato del informe de la auditoria 4D invocable
 * (`skills/auditoria-4d`). Es la fuente unica: la skill lo escribe con estas
 * secciones y cabeceras, su test lo exige, y `taskctl metricas` (TASK-167d)
 * lo lee aqui para la tendencia entre auditorias.
 *
 * Las D y las severidades son las de los informes de revision
 * (`informe-revision.ts`): el mismo hecho, una sola lista.
 */
import { DIMENSIONES_4D, SEVERIDADES_HALLAZGO } from './informe-revision.js';
import { celdasDe } from './transiciones.js';
/** Carpeta del proyecto donde se dejan los informes. */
export const CARPETA_AUDITORIA_4D = 'docs';
/** Nombre del informe de una fecha (AAAA-MM-DD). */
export const nombreInformeAuditoria4D = (fecha) => `auditoria-4d-${fecha}.md`;
/**
 * Reconoce un informe por su nombre; el grupo 1 es la fecha y el 2, si lo
 * hay, el numero de la auditoria de ese dia (`-2`, `-3`...; la primera no
 * lleva, y `-0`, `-1` o `-02` no son informes).
 */
export const PATRON_INFORME_AUDITORIA_4D = /^auditoria-4d-(\d{4}-\d{2}-\d{2})(?:-([2-9]|[1-9]\d+))?\.md$/;
export const SECCION_RESUMEN_4D = '## Resumen';
export const SECCION_HALLAZGOS_4D = '## Hallazgos';
export const SECCION_OLAS_4D = '## Plan por olas';
/**
 * Cabecera de la tabla de `## Resumen`: una fila por D y una de total, con
 * numeros. La tendencia entre auditorias se lee de aqui; la tabla de
 * hallazgos es el detalle (la skill cuenta el resumen a partir de ella).
 */
export const CABECERA_RESUMEN_4D = `| D | ${SEVERIDADES_HALLAZGO.join(' | ')} |`;
/** Cabecera de la tabla de `## Hallazgos`. */
export const CABECERA_HALLAZGOS_4D = '| ID | D | Severidad | Fichero | Hallazgo | Ola |';
/** Encabezado de cada ola en `## Plan por olas`: `### Ola N: <titulo>`. */
export const PATRON_OLA_4D = /^### Ola (\d+): (.+)$/;
/**
 * Las cifras de la tabla de `## Resumen` de un informe. Si no se puede leer
 * sin adivinar (sin la seccion o su cabecera, una D que falta o repetida, una
 * cifra que no es un entero, un Total que no es la suma), dice por que.
 */
export function leerResumenAuditoria4D(texto) {
    // trim() quita tambien el \r de CRLF. Un `## Resumen` dentro de un bloque de codigo (un ejemplo) no cuenta.
    const lineas = texto.split('\n').map((l) => l.trim());
    let enBloque = false;
    const inicio = lineas.findIndex((l) => {
        if (l.startsWith('```') || l.startsWith('~~~'))
            enBloque = !enBloque;
        return !enBloque && l === SECCION_RESUMEN_4D;
    });
    if (inicio === -1)
        return { ok: false, motivo: `no tiene la seccion "${SECCION_RESUMEN_4D}"` };
    let i = inicio + 1;
    while (i < lineas.length && lineas[i] !== CABECERA_RESUMEN_4D && !lineas[i].startsWith('## '))
        i++;
    if (lineas[i] !== CABECERA_RESUMEN_4D)
        return { ok: false, motivo: `su resumen no tiene la cabecera "${CABECERA_RESUMEN_4D}"` };
    if (!/^\|(\s*:?-+:?\s*\|)+$/.test(lineas[i + 1] ?? '')) {
        return { ok: false, motivo: 'la tabla del resumen no tiene la fila separadora (|---|...) bajo la cabecera' };
    }
    const filas = new Map();
    // La tabla acaba en la primera linea que no empieza por `|` (tambien una en blanco).
    for (i += 2; i < lineas.length && lineas[i].startsWith('|'); i++) {
        const [nombre = '', ...valores] = celdasDe(lineas[i]);
        if (valores.length !== SEVERIDADES_HALLAZGO.length || valores.some((v) => !/^\d+$/.test(v))) {
            return { ok: false, motivo: `la fila "${nombre}" del resumen no tiene ${String(SEVERIDADES_HALLAZGO.length)} cifras enteras` };
        }
        if (filas.has(nombre))
            return { ok: false, motivo: `la fila "${nombre}" esta repetida en el resumen` };
        filas.set(nombre, valores.map(Number));
    }
    const cifras = {};
    for (const d of DIMENSIONES_4D) {
        const fila = filas.get(d);
        if (fila === undefined) {
            return { ok: false, motivo: `al resumen le falta la fila "${d}" (la tabla acaba en la primera linea que no empieza por |)` };
        }
        cifras[d] = Object.fromEntries(SEVERIDADES_HALLAZGO.map((s, k) => [s, fila[k]]));
    }
    const total = filas.get('Total');
    if (total === undefined)
        return { ok: false, motivo: 'al resumen le falta la fila "Total"' };
    const suma = SEVERIDADES_HALLAZGO.map((s) => DIMENSIONES_4D.reduce((acc, d) => acc + cifras[d][s], 0));
    if (suma.some((v, k) => v !== total[k])) {
        return { ok: false, motivo: `el Total del resumen (${total.join('/')}) no es la suma de las filas (${suma.join('/')})` };
    }
    return { ok: true, cifras };
}
/** Fecha y numero de un nombre de informe, o null si no es un informe. */
export function fechaDeInforme4D(fichero) {
    const m = PATRON_INFORME_AUDITORIA_4D.exec(fichero);
    return m === null ? null : { fecha: m[1], numero: m[2] === undefined ? 1 : Number(m[2]) };
}
/** Total de hallazgos de una auditoria. */
export const totalAuditoria4D = (c) => DIMENSIONES_4D.reduce((acc, d) => acc + SEVERIDADES_HALLAZGO.reduce((a, s) => a + c[d][s], 0), 0);
/** Las auditorias en orden (fecha y numero del dia), cada una con su cambio respecto a la anterior. */
export function serieAuditorias4D(auditorias) {
    const orden = [...auditorias].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.numero - b.numero);
    return orden.map((a, k) => {
        const total = totalAuditoria4D(a.cifras);
        const previa = orden[k - 1];
        return { ...a, total, cambio: previa === undefined ? null : total - totalAuditoria4D(previa.cifras) };
    });
}
/** La seccion de texto de `taskctl metricas`; '' sin auditorias. `proyecto` solo con varios repos. */
export function formatearSerieAuditorias4D(auditorias, proyecto = null) {
    if (auditorias.length === 0)
        return '';
    const cabecera = ['auditoria', ...DIMENSIONES_4D, 'total', 'cambio'];
    const filas = serieAuditorias4D(auditorias).map((a) => [
        a.numero === 1 ? a.fecha : `${a.fecha}-${String(a.numero)}`,
        ...DIMENSIONES_4D.map((d) => SEVERIDADES_HALLAZGO.map((s) => String(a.cifras[d][s])).join('/')),
        String(a.total),
        a.cambio === null ? '—' : a.cambio > 0 ? `+${String(a.cambio)}` : String(a.cambio),
    ]);
    const titulo = `Auditorias 4D${proyecto === null ? '' : ` de ${proyecto}`} (${CARPETA_AUDITORIA_4D}/auditoria-4d-*.md), ` +
        `hallazgos por D (${SEVERIDADES_HALLAZGO.join('/')}):`;
    const fila = (c) => `| ${c.join(' | ')} |`;
    return [titulo, fila(cabecera), fila(cabecera.map(() => '---')), ...filas.map(fila)].join('\n');
}
