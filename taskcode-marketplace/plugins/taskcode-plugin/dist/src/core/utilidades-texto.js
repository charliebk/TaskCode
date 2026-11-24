/**
 * TASK-148c (CORE1-13, CORE2-10, CORE2-17 de la auditoria 4D): utilidades de
 * texto y valores que estaban copiadas en core, fs y hooks. Sin dependencias a
 * proposito: core/progreso.ts las usa y lo carga la via rapida de `taskctl
 * estado` (la status line).
 */
/** true si `x` es un objeto plano (no null, no array): lo que da un JSON `{...}`. */
export const esObjeto = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Recorta a `max` caracteres (por puntos de codigo), con `…` si sobra. */
export function recortar(texto, max) {
    const cps = Array.from(texto);
    return cps.length <= max ? texto : `${cps.slice(0, Math.max(0, max - 1)).join('')}…`;
}
// Secuencias de terminal: CSI (colores, cursor), OSC (titulos, hipervinculos;
// con o sin terminador) y escapes de dos caracteres. La de mayor cobertura de
// las tres copias que habia (una solo quitaba los colores `ESC[...m`).
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?|\u001b[@-Z\\-_]/g;
/** El texto sin secuencias ANSI de terminal. */
export function quitarAnsi(texto) {
    return texto.replace(ANSI, '');
}
/**
 * TASK-145a (FS-09): el texto de un error sin su prefijo `[ERROR]` (los de
 * ConfigError lo traen), para incrustarlo en otro mensaje. Antes, la misma
 * expresion copiada en seis sitios.
 */
export function sinPrefijoError(texto) {
    return texto.replace(/^\[ERROR\]\s*/, '');
}
