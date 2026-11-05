/**
 * La entrada y la decision de un hook `PreToolUse`, compartidas por los
 * guardianes (merges, held-out). Sin dependencias: el guardian de held-out
 * corre antes de herramientas de fichero y no debe cargar el de merges.
 */

export interface EntradaPreToolUse {
  cwd?: unknown;
  tool_name?: unknown;
  tool_input?: unknown;
}

export interface DecisionPreToolUse {
  codigo: 0 | 2;
  stderr: string;
}

export const PASAR: DecisionPreToolUse = Object.freeze({ codigo: 0, stderr: '' });

/** El JSON del hook. Un JSON roto o vacio es una entrada sin campos. */
export function parsearEntradaPreToolUse(texto: string): EntradaPreToolUse {
  try {
    const v: unknown = JSON.parse(texto);
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaPreToolUse) : {};
  } catch {
    return {};
  }
}
