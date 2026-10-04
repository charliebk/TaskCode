/**
 * Registro de transiciones de una tarea (TASK-056): la seccion
 * `## Transiciones` de `tarea.md`, una fila por cambio de fase.
 *
 * | fecha | fase | modo | decidido_por |
 * |---|---|---|---|
 * | 2026-10-04 | plan | automatico | persona |
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
 * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas ni
 * toca nada fuera de su seccion.
 */
import { MODOS_FLUJO } from './config.js';
export const SECCION_TRANSICIONES = '## Transiciones';
export const DECIDIDO_POR = ['persona', 'automatico'];
const FASES = ['plan', 'approve', 'start', 'review', 'finish', 'pausa'];
const CABECERA = '| fecha | fase | modo | decidido_por |';
const SEPARADOR = '|---|---|---|---|';
function filaATexto(f) {
    return `| ${f.fecha} | ${f.fase} | ${f.modo} | ${f.decidido_por} |`;
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
 */
function dentroDeBloque(lineas) {
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
    const enBloque = dentroDeBloque(lineas);
    let inicio = -1;
    lineas.forEach((l, i) => {
        if (!enBloque[i] && l.trimEnd() === SECCION_TRANSICIONES)
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
        const celdas = lineas[i]
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());
        if (celdas.length !== 4)
            continue;
        const [fecha, fase, modo, decidido] = celdas;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
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
 */
export function registrarTransicion(body, fase, fecha, modoConfig, decididoPor = 'persona') {
    const modo = fase === 'plan' ? modoConfig : modoDeTarea(body, modoConfig);
    return anadirTransicion(body, { fecha, fase, modo, decidido_por: decididoPor });
}
