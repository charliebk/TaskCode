/**
 * Verificacion proporcional al cambio — TASK-100 (parte A1 de TASK-096).
 *
 * Un unico punto que decide si una tarea es «solo documentacion» y, por tanto,
 * si la puerta de verificacion puede ahorrarse `comando_verificacion`. Puro:
 * recibe las rutas ya calculadas por Git (fs/git.ts, `rutasDeTarea`) y la
 * configuracion de la rama base. Hoy lo usa `finish`; el guardian de merges
 * (TASK-101) y el freno Stop y `review` (TASK-102) lo usaran igual.
 *
 * Regla de oro: ante la duda, la verificacion de siempre. Solo es
 * documentacion si se puede afirmar con seguridad:
 * - sin `rutas_documentacion` declaradas, nunca;
 * - si el diff no se pudo calcular, o sale vacio (reintento tras un merge a
 *   medias, rama ya integrada: «nada cambia» no es «solo documentacion»);
 * - si cambia la propia configuracion (`.taskcode/config.yml`): una rama que
 *   amplia sus rutas de documentacion no puede eximirse en el mismo diff;
 * - si alguna ruta cae fuera de las de documentacion.
 *
 * La carpeta `tareas/` cuenta siempre como documentacion: es el estado de las
 * tareas que escribe taskctl y la cambia toda tarea. Sus tests held-out
 * (`aceptacion/`) los sigue ejecutando su propia puerta.
 */

/** Patron (`git :(glob)`) que cuenta siempre como documentacion: el estado de las tareas. */
export const RUTA_TAREAS_SIEMPRE_DOCUMENTACION = 'tareas/**';

/** Fichero que, si cambia, obliga siempre a la verificacion de siempre. */
export const RUTA_CONFIG = '.taskcode/config.yml';

/** Rutas cambiadas por la tarea frente a la base (merge-base), segun Git. */
export interface DiffTarea {
  /** Todas las rutas cambiadas (borrados y los dos lados de un renombre incluidos). */
  todas: readonly string[];
  /** Las que no casan con ninguna ruta de documentacion. */
  fueraDeDocs: readonly string[];
}

export interface ConfigDocumentacion {
  rutas_documentacion: readonly string[];
  comando_verificacion_documentacion: string | null;
}

export type DecisionVerificacion =
  | { tipo: 'completa'; motivo: string }
  | { tipo: 'documentacion'; comando: string | null; motivo: string };

const MAX_RUTAS_EN_MOTIVO = 3;

function listar(rutas: readonly string[]): string {
  const vistas = rutas.slice(0, MAX_RUTAS_EN_MOTIVO).join(', ');
  const resto = rutas.length - MAX_RUTAS_EN_MOTIVO;
  return resto > 0 ? `${vistas} y ${String(resto)} mas` : vistas;
}

/** true si el proyecto activo la verificacion proporcional (hay rutas de documentacion). */
export function documentacionDeclarada(config: ConfigDocumentacion): boolean {
  return config.rutas_documentacion.length > 0;
}

/** Patrones con los que Git separa lo que no es documentacion (incluye siempre `tareas/**`). */
export function patronesDocumentacion(config: ConfigDocumentacion): string[] {
  return [...new Set([...config.rutas_documentacion, RUTA_TAREAS_SIEMPRE_DOCUMENTACION])];
}

/**
 * Decide la verificacion para el diff de la tarea. `diff === null` = no se pudo
 * calcular. `base` solo aparece en el motivo.
 */
export function decidirVerificacion(
  config: ConfigDocumentacion,
  diff: DiffTarea | null,
  base: string
): DecisionVerificacion {
  if (!documentacionDeclarada(config)) {
    return { tipo: 'completa', motivo: `"${base}" no declara rutas_documentacion` };
  }
  if (diff === null) {
    return { tipo: 'completa', motivo: `no se pudo calcular que cambia la tarea frente a "${base}"` };
  }
  if (diff.todas.length === 0) {
    return { tipo: 'completa', motivo: `la tarea no cambia nada frente a "${base}" (no se puede afirmar que sea solo documentacion)` };
  }
  if (diff.todas.includes(RUTA_CONFIG)) {
    return { tipo: 'completa', motivo: `la tarea cambia ${RUTA_CONFIG}` };
  }
  if (diff.fueraDeDocs.length > 0) {
    return {
      tipo: 'completa',
      motivo: `la tarea cambia rutas que no son documentacion: ${listar(diff.fueraDeDocs)}`,
    };
  }
  return {
    tipo: 'documentacion',
    comando: config.comando_verificacion_documentacion,
    motivo:
      `la tarea solo cambia documentacion (${String(diff.todas.length)} fichero(s) dentro de ` +
      `rutas_documentacion de "${base}")`,
  };
}
