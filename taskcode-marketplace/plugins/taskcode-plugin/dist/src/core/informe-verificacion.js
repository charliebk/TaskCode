/**
 * Como se cuenta una verificacion en rojo — TASK-071. Funcion pura,
 * compartida por el hook Stop y (TASK-072) por `finish`: los dos frenos
 * tienen que decir lo mismo con las mismas palabras.
 *
 * Lo que trae siempre (criterio 3 de TASK-071): el comando, el codigo de
 * salida (o el corte), la duracion y la cola de la salida, ACOTADA. La cola
 * acaba en el transcript del agente, asi que ademas se limpia: sin secuencias
 * ANSI (colores de los test runners), sin CRLF, sin credenciales en URLs, y
 * cortada sin partir caracteres UTF-8.
 */
import { ocultarCredenciales } from './plataforma-remota.js';
/** Bytes y lineas maximos de la cola que se muestran. */
export const MAX_BYTES_COLA = 4096;
export const MAX_LINEAS_COLA = 40;
// Secuencias CSI (colores, cursor) y OSC (titulos, hipervinculos) de terminal.
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g;
/**
 * La cola limpia y acotada a `maxLineas` lineas y `maxBytes` bytes (lo que
 * se cumpla antes), quedandose con el FINAL: en un test runner el resumen y
 * el ultimo fallo estan abajo.
 */
export function recortarCola(texto, maxBytes = MAX_BYTES_COLA, maxLineas = MAX_LINEAS_COLA) {
    const limpio = ocultarCredenciales(texto.replace(ANSI, '').replace(/\r\n?/g, '\n')).replace(/\s+$/, '');
    let lineas = limpio.split('\n');
    let recortada = false;
    if (lineas.length > maxLineas) {
        lineas = lineas.slice(-maxLineas);
        recortada = true;
    }
    let salida = lineas.join('\n');
    const buf = Buffer.from(salida, 'utf8');
    if (buf.length > maxBytes) {
        let desde = buf.length - maxBytes;
        while (desde < buf.length && (buf[desde] & 0xc0) === 0x80)
            desde++;
        salida = buf.subarray(desde).toString('utf8');
        recortada = true;
    }
    return { texto: salida, recortada };
}
/** El resultado en una frase: «salio con codigo 1», «se corto a los 600 s»... */
export function describirResultado(r) {
    switch (r.estado) {
        case 'verde':
            return 'salio con codigo 0';
        case 'roja':
            return r.codigo === null
                ? `termino de forma anormal${r.error === undefined ? '' : ` (${r.error})`}`
                : `salio con codigo ${String(r.codigo)}`;
        case 'cortada':
            return `no termino en ${String(r.timeoutS)} s y se ha cortado (con todos sus procesos)`;
        case 'no-lanzable':
            return `no se pudo ejecutar${r.error === undefined ? '' : ` (${r.error})`}`;
    }
}
function segundos(ms) {
    return `${(ms / 1000).toFixed(1)} s`;
}
/**
 * El informe de una verificacion que no esta en verde, listo para stderr.
 * No nombra el producto: lo leen proyectos ajenos.
 */
export function formatearVerificacionRoja(r, maxBytes = MAX_BYTES_COLA, maxLineas = MAX_LINEAS_COLA) {
    const { texto, recortada } = recortarCola(r.cola, maxBytes, maxLineas);
    const truncada = recortada || r.bytesTotales > Buffer.byteLength(r.cola, 'utf8');
    const lineas = [
        'La verificacion del proyecto no esta en verde: la tarea en curso no se puede dar por terminada.',
        `  Comando:   ${r.comando}`,
        `  Resultado: ${describirResultado(r)}`,
        `  Duracion:  ${segundos(r.duracionMs)}`,
    ];
    if (texto === '') {
        lineas.push('  Salida:    (vacia)');
    }
    else {
        const titulo = truncada
            ? `  Final de la salida (truncada: ${String(r.bytesTotales)} bytes en total):`
            : '  Salida:';
        lineas.push(titulo, ...texto.split('\n').map((l) => `    ${l}`));
    }
    lineas.push('Arregla la causa y vuelve a verificar con el mismo comando. No borres, saltes ni debilites ' +
        'tests para pasar este freno: si el rojo no es de tu cambio, dilo explicitamente.');
    return lineas.join('\n');
}
