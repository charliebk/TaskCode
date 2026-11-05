/**
 * La entrada y la decision de un hook `PreToolUse`, compartidas por los
 * guardianes (merges, held-out). Sin dependencias: el guardian de held-out
 * corre antes de herramientas de fichero y no debe cargar el de merges.
 */
export const PASAR = Object.freeze({ codigo: 0, stderr: '' });
/** El JSON del hook. Un JSON roto o vacio es una entrada sin campos. */
export function parsearEntradaPreToolUse(texto) {
    try {
        const v = JSON.parse(texto);
        return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {};
    }
    catch {
        return {};
    }
}
