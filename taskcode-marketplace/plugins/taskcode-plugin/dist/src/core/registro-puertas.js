/**
 * TASK-120: formato comun del registro de puertas de verificacion. Puro, sin
 * disco. Una linea por ejecucion de una puerta (la sincronizacion, y despues el
 * freno Stop de TASK-111 y las verificaciones de review y finish de TASK-128),
 * con seis campos separados por un tabulador:
 *
 *   puerta  tarea  instante  modo  duracion_s  resultado
 *
 * - puerta: que se ejecuto (`sincronizacion`, ...). Quien lee ignora las que no
 *   conoce.
 * - tarea: el ID (`TASK-123`, `TASK-123a`) o `-` si no hay tarea.
 * - instante: ISO 8601 en UTC del final de la ejecucion.
 * - modo: el contexto de la puerta (para la sincronizacion, la fase de taskctl).
 * - duracion_s: segundos, con un decimal.
 * - resultado: el desenlace, en una palabra o con guiones.
 *
 * El formato y su sitio (`.git/taskcode/puertas.log`) estan en
 * docs/registro-puertas.md.
 */
/** Un campo no puede llevar tabuladores ni saltos de linea: se cambian por espacios. */
function campo(v) {
    const limpio = v.replace(/[\t\r\n]+/g, ' ').trim();
    return limpio === '' ? '-' : limpio;
}
export function formatearLineaPuerta(l) {
    const duracion = Number.isFinite(l.duracionS) && l.duracionS >= 0 ? l.duracionS.toFixed(1) : '0.0';
    return [campo(l.puerta), campo(l.tarea), campo(l.instante), campo(l.modo), duracion, campo(l.resultado)].join('\t');
}
/** Las lineas bien formadas del registro; el resto (vacias, rotas, de otro formato) se ignoran. */
export function parsearRegistroPuertas(texto) {
    const lineas = [];
    for (const cruda of texto.split(/\r?\n/)) {
        const c = cruda.split('\t');
        if (c.length !== 6)
            continue;
        const duracionS = Number(c[4]);
        if (!/^\d+(\.\d+)?$/.test(c[4]) || !Number.isFinite(duracionS))
            continue;
        lineas.push({
            puerta: c[0],
            tarea: c[1],
            instante: c[2],
            modo: c[3],
            duracionS,
            resultado: c[5],
        });
    }
    return lineas;
}
/** Segundos totales de `puerta` por tarea (las lineas de otras puertas no cuentan). */
export function sumarPorTarea(lineas, puerta) {
    const suma = new Map();
    for (const l of lineas) {
        if (l.puerta !== puerta)
            continue;
        suma.set(l.tarea, (suma.get(l.tarea) ?? 0) + l.duracionS);
    }
    return suma;
}
/** El ID de tarea de un mensaje de commit (`chore(TASK-123): ...`), o null. */
export function tareaDeMensaje(mensaje) {
    const m = /\bTASK-\d+[a-z]?\b/.exec(mensaje);
    return m === null ? null : m[0];
}
