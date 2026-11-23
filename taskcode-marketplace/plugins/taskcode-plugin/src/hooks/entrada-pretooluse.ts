/**
 * Lo comun de los hooks: la entrada y la decision de un `PreToolUse`
 * (guardianes de merges y held-out), el parser del JSON de cualquier hook
 * (tambien Stop y el registro de coste, TASK-149a FS-05) y el techo de tiempo
 * de un hook. Sin dependencias: los hooks corren en cada herramienta y no deben
 * cargar el grafo del freno (FS-17).
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

/** El JSON de un hook (stdin entero). Un JSON roto, vacio o que no es un objeto es una entrada sin campos. */
export function parsearEntradaHook<T extends object>(texto: string): T {
  try {
    const v: unknown = JSON.parse(texto);
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

/** El JSON del hook `PreToolUse`. */
export function parsearEntradaPreToolUse(texto: string): EntradaPreToolUse {
  return parsearEntradaHook<EntradaPreToolUse>(texto);
}
