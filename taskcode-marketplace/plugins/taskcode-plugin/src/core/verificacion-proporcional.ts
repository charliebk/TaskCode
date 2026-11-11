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
 * TASK-096 (nivel 2, opt-in): si la base declara `rutas_verificacion_parcial`
 * y todo lo que no es documentacion cae dentro de esas rutas, basta la
 * verificacion selectiva (`comando_verificacion_selectiva`). Es una lista de
 * rutas PERMITIDAS: cualquier ruta fuera (sin clasificar, transversal, el
 * propio clasificador) va a la de siempre sin que el proyecto se acuerde. Los
 * mismos «ante la duda» de arriba valen tambien aqui. Release y hotfix los
 * excluye quien llama (finish no pasa base en un release).
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
  /**
   * TASK-096: las que no casan ni con documentacion ni con
   * `rutas_verificacion_parcial`. Sin calcular (undefined) = la de siempre.
   */
  fueraDeParcial?: readonly string[];
}

export interface ConfigDocumentacion {
  rutas_documentacion: readonly string[];
  comando_verificacion_documentacion: string | null;
  /** TASK-096: rutas donde basta la selectiva. Ausente o `[]` = sin nivel 2 (lo de la 0.14.0). */
  rutas_verificacion_parcial?: readonly string[];
  /** TASK-096: la selectiva que corre el nivel 2 (la config exige que exista si hay rutas parciales). */
  comando_verificacion_selectiva?: string | null;
}

export type DecisionVerificacion =
  | { tipo: 'completa'; motivo: string }
  | { tipo: 'documentacion'; comando: string | null; motivo: string }
  | { tipo: 'selectiva'; comando: string; motivo: string };

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

/** TASK-096: true si el proyecto activo el nivel 2 (rutas parciales y su selectiva). */
export function parcialDeclarada(config: ConfigDocumentacion): boolean {
  return (config.rutas_verificacion_parcial ?? []).length > 0 && (config.comando_verificacion_selectiva ?? null) !== null;
}

/** TASK-096: patrones con los que Git separa lo que queda fuera de documentacion y de las rutas parciales. */
export function patronesParcial(config: ConfigDocumentacion): string[] {
  return [...new Set([...patronesDocumentacion(config), ...(config.rutas_verificacion_parcial ?? [])])];
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
  const docs = documentacionDeclarada(config);
  const selectiva = config.comando_verificacion_selectiva ?? null;
  const parcial = (config.rutas_verificacion_parcial ?? []).length > 0 && selectiva !== null;
  if (!docs && !parcial) {
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
  if (docs && diff.fueraDeDocs.length === 0) {
    return {
      tipo: 'documentacion',
      comando: config.comando_verificacion_documentacion,
      motivo:
        `la tarea solo cambia documentacion (${String(diff.todas.length)} fichero(s) dentro de ` +
        `rutas_documentacion de "${base}")`,
    };
  }
  if (!parcial) {
    return {
      tipo: 'completa',
      motivo: `la tarea cambia rutas que no son documentacion: ${listar(diff.fueraDeDocs)}`,
    };
  }
  if (diff.fueraDeParcial === undefined) {
    return { tipo: 'completa', motivo: `no se calculo que cambia la tarea fuera de rutas_verificacion_parcial de "${base}"` };
  }
  if (diff.fueraDeParcial.length > 0) {
    return {
      tipo: 'completa',
      motivo: `la tarea cambia rutas fuera de rutas_verificacion_parcial: ${listar(diff.fueraDeParcial)}`,
    };
  }
  return {
    tipo: 'selectiva',
    comando: selectiva,
    motivo:
      `todo el codigo que cambia la tarea (${String(diff.fueraDeDocs.length)} fichero(s)) cae en ` +
      `rutas_verificacion_parcial de "${base}": basta la verificacion de lo afectado`,
  };
}
