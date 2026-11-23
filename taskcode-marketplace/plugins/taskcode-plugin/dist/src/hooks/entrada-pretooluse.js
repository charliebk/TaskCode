/**
 * Lo comun de los hooks: la entrada y la decision de un `PreToolUse`
 * (guardianes de merges y held-out), el parser del JSON de cualquier hook
 * (tambien Stop y el registro de coste, TASK-149a FS-05) y el techo de tiempo
 * de un hook. Sin dependencias: los hooks corren en cada herramienta y no deben
 * cargar el grafo del freno (FS-17).
 */
import { esObjeto } from '../core/utilidades-texto.js';
export const PASAR = Object.freeze({ codigo: 0, stderr: '' });
/** El JSON de un hook (stdin entero). Un JSON roto, vacio o que no es un objeto es una entrada sin campos. */
export function parsearEntradaHook(texto) {
    try {
        const v = JSON.parse(texto);
        return esObjeto(v) ? v : {};
    }
    catch {
        return {};
    }
}
/** El JSON del hook `PreToolUse`. */
export function parsearEntradaPreToolUse(texto) {
    return parsearEntradaHook(texto);
}
