/**
 * Registro de transiciones de una tarea (TASK-056): la seccion
 * `## Transiciones` de `tarea.md`, una fila por cambio de fase.
 *
 * | fecha | fase | modo | decidido_por |
 * |---|---|---|---|
 * | 2026-10-04T14:03:22Z | plan | automatico | persona |
 *
 * TASK-052: la celda `fecha` lleva el instante UTC con segundos
 * (`toISOString` sin milisegundos), que es lo que mide `taskctl metricas`.
 * Las filas anteriores, solo con el dia (`2026-10-04`), se siguen leyendo:
 * cada fila expone su precision y nadie las reescribe. Una quinta columna
 * `hora` se descarto porque rompia la lectura de todas las filas viejas
 * (`celdas.length !== 4`); cambiar el contenido de la celda solo afecta a
 * las nuevas. Lo que se pierde: un plugin ANTERIOR no reconoce las filas
 * con hora (su regex es el del dia) y dejaria de ver el modo congelado;
 * se acepta con una version del plugin por repo.
 *
 * Es el historico de quien decidio cada paso y en que modo, y viaja en el
 * mismo commit que la transicion (lo escribe el comando antes de su
 * autoCommit), asi que no puede quedar una transicion sin su fila.
 *
 * El MODO SE CONGELA AQUI: el de la ultima fila `plan`. No hay campo en el
 * frontmatter a proposito: el registro y el modo serian dos datos que
 * podrian discrepar, y un campo nuevo obligaria a tocar el parser y el
 * orden de campos. Cambiar el config despues de `plan` no cambia el modo de
 * esa tarea, que es lo que impide aprobar en automatico un plan que se
 * cerro en manual (riesgo del plan de TASK-055).
 *
 * TASK-084: quinta columna `version`, la de taskctl que escribio la fila
 * (`VERSION_TASKCTL`). Es lo que agrupa `taskctl metricas --por-version`
 * (la version del ultimo `finish`), y sustituye a deducirla por la fecha de
 * cierre, que casi lleva a error. La lectura acepta filas de 4 celdas (las
 * anteriores, sin version) y de 5. A diferencia de la columna `hora` que
 * descarto TASK-052, aqui el lector nuevo no pierde las filas viejas. Lo que
 * se pierde es lo mismo que entonces: un plugin ANTERIOR descarta las filas
 * de 5 celdas y deja de ver el modo congelado; se acepta con una version del
 * plugin por repo.
 *
 * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas de
 * datos ni toca nada fuera de su seccion. UNICA excepcion (TASK-084,
 * decidida por Carlos): la primera fila con version que se anade bajo una
 * cabecera de 4 columnas cambia la cabecera y su separador a 5, porque en
 * GFM la celda que sobra respecto a la cabecera no se muestra. Las filas
 * viejas no se tocan: GFM les pone la quinta celda vacia.
 */
import { MODOS_FLUJO } from './config.js';
import { VERSION_TASKCTL } from './version.js';
export const SECCION_TRANSICIONES = '## Transiciones';
export const DECIDIDO_POR = ['persona', 'automatico'];
/** `MAYOR.MENOR.PARCHE` con pre-release opcional (`0.12.0-dev`). */
export const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const FECHA_DIA_RE = /^\d{4}-\d{2}-\d{2}$/;
const FECHA_INSTANTE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
/**
 * Precision de una celda `fecha`, o null si no es ninguna de las dos formas
 * (fila editada a mano: se ignora, como cualquier otra celda invalida).
 * Valida ademas que la fecha exista: `2026-02-30` no es un dia.
 */
export function precisionDeFecha(fecha) {
    const precision = FECHA_DIA_RE.test(fecha) ? 'dia' : FECHA_INSTANTE_RE.test(fecha) ? 'segundo' : null;
    if (precision === null)
        return null;
    const ms = Date.parse(precision === 'dia' ? `${fecha}T00:00:00Z` : fecha);
    if (Number.isNaN(ms))
        return null;
    // Date.parse normaliza el 30 de febrero al 2 de marzo: se exige la vuelta.
    if (new Date(ms).toISOString().slice(0, 10) !== fecha.slice(0, 10))
        return null;
    return precision;
}
/** El instante de una fila en milisegundos UTC (a medianoche si es de dia). */
export function instanteDe(fecha) {
    return Date.parse(FECHA_DIA_RE.test(fecha) ? `${fecha}T00:00:00Z` : fecha);
}
/** El instante actual con el formato de la celda: UTC, al segundo. */
export function formatearInstante(d) {
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
const FASES = ['plan', 'approve', 'start', 'review', 'finish', 'pausa'];
const CABECERA = '| fecha | fase | modo | decidido_por | version |';
const SEPARADOR = '|---|---|---|---|---|';
/** Las celdas de la cabecera anterior a TASK-084, la unica que se reescribe. */
const CABECERA_4 = ['fecha', 'fase', 'modo', 'decidido_por'];
const SEPARADOR_4_RE = /^\|(\s*:?-+:?\s*\|){4}$/;
function filaATexto(f) {
    return `| ${f.fecha} | ${f.fase} | ${f.modo} | ${f.decidido_por} | ${f.version ?? ''} |`;
}
/** Las celdas de una linea de tabla, sin las barras de los extremos. */
function celdasDe(linea) {
    return linea
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
}
/**
 * TASK-084: si la seccion tiene la cabecera de 4 columnas seguida de su
 * separador, los cambia a los de 5 (ver la excepcion en la cabecera del
 * modulo). Cualquier otra forma (ya de 5, editada a mano) se deja tal cual.
 */
function ampliarCabecera(lineas, inicio, fin, enBloque) {
    for (let i = inicio + 1; i + 1 < fin; i++) {
        if (enBloque[i] || !lineas[i].trimStart().startsWith('|'))
            continue;
        const celdas = celdasDe(lineas[i]);
        if (celdas.length === CABECERA_4.length && celdas.every((c, k) => c === CABECERA_4[k])) {
            if (!enBloque[i + 1] && SEPARADOR_4_RE.test(lineas[i + 1].trim())) {
                lineas[i] = CABECERA;
                lineas[i + 1] = SEPARADOR;
            }
        }
        return; // solo la primera linea de tabla puede ser la cabecera
    }
}
/** Valla de apertura de CommonMark: 0-3 espacios, 3+ ` o ~ (con ` el texto de info no lleva `). */
const VALLA_APERTURA = /^ {0,3}(`{3,}(?=[^`]*$)|~{3,})/;
/**
 * Para cada linea, si esta dentro de un bloque de codigo cercado (incluidas
 * sus vallas). Sigue las reglas de CommonMark (IMP-4 de la revision): cierra
 * una valla del MISMO caracter, de longitud IGUAL O MAYOR, sin texto detras
 * y con 0-3 espacios de sangria — asi un ```` que envuelve un ejemplo con
 * ``` no se cierra en el interior.
 *
 * Una valla que no se cierra NO abre bloque. CommonMark la extenderia hasta
 * el final del documento, pero aqui eso se tragaria la seccion real, que el
 * CLI anade al final: un ``` olvidado en el enunciado dejaria la tarea sin
 * registro ni modo congelado y duplicaria la seccion en cada transicion.
 *
 * Lo que se sacrifica (MEN-12 de la revision, aceptado): si la valla sin
 * cerrar es justo la que envuelve un EJEMPLO de `## Transiciones`, el ejemplo
 * cuenta como registro (antes de `plan` se lee su modo, y las filas caen en
 * el). Ninguna regla salva a la vez ese caso y el del ``` olvidado; se elige
 * proteger el registro real. Hace falta un documento roto, ademas de un
 * ejemplo del registro, para llegar ahi.
 */
export function dentroDeBloque(lineas) {
    const enBloque = lineas.map(() => false);
    let i = 0;
    while (i < lineas.length) {
        const apertura = VALLA_APERTURA.exec(lineas[i]);
        if (apertura === null) {
            i++;
            continue;
        }
        const valla = apertura[1];
        const caracter = valla[0] === '`' ? '`' : '~';
        const cierre = new RegExp(`^ {0,3}\\${caracter}{${String(valla.length)},}\\s*$`);
        let j = i + 1;
        while (j < lineas.length && !cierre.test(lineas[j]))
            j++;
        if (j === lineas.length) {
            // Sin cerrar: no es bloque (ver arriba). Se sigue por la linea siguiente.
            i++;
            continue;
        }
        for (let k = i; k <= j; k++)
            enBloque[k] = true;
        i = j + 1;
    }
    return enBloque;
}
/**
 * [inicio, fin) de las lineas de la seccion, o null si no existe. Se buscan
 * los encabezados FUERA de bloques de codigo y se toma el ULTIMO (IMP-2 de
 * la revision): un enunciado que traiga la tabla de ejemplo dentro de un
 * bloque no es el registro, y la seccion real siempre se crea al final.
 */
function rangoSeccion(lineas) {
    return rangoDeSeccion(lineas, SECCION_TRANSICIONES);
}
/**
 * La regla de `rangoSeccion` para cualquier seccion del cuerpo (TASK-063:
 * la reutiliza `## Coste` de `core/coste-registro.ts`, que es una tabla
 * hermana de esta).
 */
export function rangoDeSeccion(lineas, titulo) {
    const enBloque = dentroDeBloque(lineas);
    let inicio = -1;
    lineas.forEach((l, i) => {
        if (!enBloque[i] && l.trimEnd() === titulo)
            inicio = i;
    });
    if (inicio === -1)
        return null;
    let fin = inicio + 1;
    while (fin < lineas.length && (enBloque[fin] || !/^##?\s/.test(lineas[fin])))
        fin++;
    return [inicio, fin];
}
/**
 * Anade una fila al registro. Si la seccion no existe la crea al final del
 * cuerpo; si existe, la fila va detras de su ultima fila de tabla.
 */
export function anadirTransicion(body, fila) {
    const eol = body.includes('\r\n') ? '\r\n' : '\n';
    const lineas = body.split(/\r?\n/);
    const rango = rangoSeccion(lineas);
    if (rango === null) {
        const base = body.replace(/(\r?\n)*$/, '');
        const separacion = base === '' ? '' : eol + eol;
        return base + separacion + [SECCION_TRANSICIONES, '', CABECERA, SEPARADOR, filaATexto(fila)].join(eol) + eol;
    }
    const [inicio, fin] = rango;
    const enBloque = dentroDeBloque(lineas);
    ampliarCabecera(lineas, inicio, fin, enBloque);
    let ultimaTabla = -1;
    for (let i = inicio + 1; i < fin; i++) {
        if (!enBloque[i] && lineas[i].trimStart().startsWith('|'))
            ultimaTabla = i;
    }
    const nuevas = ultimaTabla === -1
        ? (() => {
            // Seccion sin tabla (editada a mano): la tabla va justo bajo el titulo.
            return [...lineas.slice(0, inicio + 1), '', CABECERA, SEPARADOR, filaATexto(fila), ...lineas.slice(inicio + 1)];
        })()
        : [...lineas.slice(0, ultimaTabla + 1), filaATexto(fila), ...lineas.slice(ultimaTabla + 1)];
    return nuevas.join(eol);
}
/**
 * Filas validas del registro, en orden. Las que no casan (cabecera,
 * separador, filas editadas a mano con valores desconocidos) se ignoran:
 * leer nunca falla ni reescribe nada.
 */
export function leerTransiciones(body) {
    const lineas = body.split(/\r?\n/);
    const rango = rangoSeccion(lineas);
    if (rango === null)
        return [];
    const enBloque = dentroDeBloque(lineas);
    const filas = [];
    for (let i = rango[0] + 1; i < rango[1]; i++) {
        if (enBloque[i])
            continue;
        const celdas = celdasDe(lineas[i]);
        // TASK-084: 4 celdas (filas anteriores, sin version) o 5.
        if (celdas.length !== 4 && celdas.length !== 5)
            continue;
        const [fecha, fase, modo, decidido, celdaVersion] = celdas;
        // TASK-052: dia (filas viejas) o instante (nuevas). El regex del dia a
        // secas haria invisibles las filas nuevas y apagaria en silencio el
        // modo congelado (riesgo del plan): hay un test que lo fija.
        if (precisionDeFecha(fecha) === null)
            continue;
        if (!FASES.includes(fase))
            continue;
        if (!MODOS_FLUJO.includes(modo))
            continue;
        if (!DECIDIDO_POR.includes(decidido))
            continue;
        filas.push({
            fecha,
            fase: fase,
            modo: modo,
            decidido_por: decidido,
            // Una celda que no es version (vacia, editada a mano) no invalida la
            // fila: perderla apagaria el modo congelado. Solo queda sin version.
            version: celdaVersion !== undefined && VERSION_RE.test(celdaVersion) ? celdaVersion : null,
        });
    }
    return filas;
}
/** Modo congelado al cerrar `plan`: el de la ultima fila `plan`, o null si no hay. */
export function modoCongelado(body) {
    const planes = leerTransiciones(body).filter((f) => f.fase === 'plan');
    const ultima = planes[planes.length - 1];
    return ultima === undefined ? null : ultima.modo;
}
/**
 * Modo con el que corre una tarea: el congelado si lo hay; si no (tarea
 * anterior a este registro, o aun sin plan), el del config.
 */
export function modoDeTarea(body, modoConfig) {
    return modoCongelado(body) ?? modoConfig;
}
/**
 * La fila que deja cada comando al cambiar de fase. En `plan` el modo es el
 * del config, y con eso queda congelado; en el resto, el congelado.
 * `fecha` es el instante (`formatearInstante`) desde TASK-052; un dia a
 * secas se sigue aceptando para quien no tenga reloj que pasar.
 * `version` es la de este taskctl (TASK-084); el parametro existe para los
 * tests, ningun comando lo pasa.
 */
export function registrarTransicion(body, fase, fecha, modoConfig, decididoPor = 'persona', version = VERSION_TASKCTL) {
    const modo = fase === 'plan' ? modoConfig : modoDeTarea(body, modoConfig);
    return anadirTransicion(body, { fecha, fase, modo, decidido_por: decididoPor, version });
}
/**
 * TASK-084: version con la que se cerro la tarea, la del ULTIMO `finish` del
 * registro (un `finish` abortado y reintentado con otro plugin deja dos), o
 * null si no hay `finish` o no lleva version. Nunca se deduce por la fecha.
 */
export function versionDeCierre(body) {
    const finishes = leerTransiciones(body).filter((f) => f.fase === 'finish');
    const ultimo = finishes[finishes.length - 1];
    return ultimo?.version ?? null;
}
// ---------------------------------------------------------------------
// Verificacion omitida (TASK-072)
// ---------------------------------------------------------------------
/** Seccion que deja `taskctl finish --sin-verificacion`: una linea por cierre sin verificar. */
export const SECCION_VERIFICACION_OMITIDA = '## Verificacion omitida';
/**
 * Anota que un cierre se hizo sin ejecutar `comando_verificacion`. Va en el
 * cuerpo y no en el frontmatter (mismo criterio que `## Merge request`): es
 * un dato de auditoria y un campo nuevo obligaria a tocar parser y board.
 * Si la seccion ya existe (un reintento) la linea va al final de ella.
 */
export function anotarVerificacionOmitida(body, instante, comando) {
    const linea = `- ${instante}: taskctl finish --sin-verificacion; no se ejecuto \`${comando.replace(/`/g, "'")}\``;
    return anotarLineaEnSeccion(body, SECCION_VERIFICACION_OMITIDA, linea);
}
/** TASK-100: seccion que deja `finish` cuando la tarea es solo documentacion y no corre la completa. */
export const SECCION_VERIFICACION_DOCUMENTACION = '## Verificacion de documentacion';
/**
 * Anota que `finish` no ejecuto `comando_verificacion` porque la tarea solo
 * cambia documentacion, con el motivo y la comprobacion que corresponde.
 * Auditable igual que el salto con --sin-verificacion. Un reintento con lo
 * mismo (tras un rojo de la comprobacion) no duplica la linea (MEN-1 de la
 * revision): devuelve el cuerpo tal cual.
 */
export function anotarVerificacionDocumentacion(body, instante, comando, motivo, comandoDocumentacion) {
    const sinComillas = (t) => t.replace(/`/g, "'");
    const corrio = comandoDocumentacion === null
        ? 'sin comprobacion de documentacion declarada'
        : `comprobacion de documentacion \`${sinComillas(comandoDocumentacion)}\``;
    const texto = `${motivo}; no se ejecuta \`${sinComillas(comando)}\`, ${corrio}`;
    const lineas = body.split(/\r?\n/);
    const rango = rangoDeSeccion(lineas, SECCION_VERIFICACION_DOCUMENTACION);
    if (rango !== null && lineas.slice(rango[0], rango[1]).some((l) => l.startsWith('- ') && l.endsWith(`: ${texto}`))) {
        return body;
    }
    return anotarLineaEnSeccion(body, SECCION_VERIFICACION_DOCUMENTACION, `- ${instante}: ${texto}`);
}
function anotarLineaEnSeccion(body, titulo, linea) {
    const eol = body.includes('\r\n') ? '\r\n' : '\n';
    const lineas = body.split(/\r?\n/);
    const rango = rangoDeSeccion(lineas, titulo);
    if (rango === null) {
        const base = body.replace(/(\r?\n)*$/, '');
        return `${base}${base === '' ? '' : eol + eol}${titulo}${eol}${eol}${linea}${eol}`;
    }
    const [inicio, fin] = rango;
    let ultima = inicio;
    for (let i = inicio + 1; i < fin; i++)
        if (lineas[i].trim() !== '')
            ultima = i;
    const desde = ultima === inicio ? inicio + 1 : ultima + 1;
    const insertar = ultima === inicio ? ['', linea] : [linea];
    return [...lineas.slice(0, desde), ...insertar, ...lineas.slice(desde)].join(eol);
}
