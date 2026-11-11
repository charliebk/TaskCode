/**
 * Decision de verificacion proporcional entre dos puntos de Git — TASK-101.
 *
 * La comparten `finish` (TASK-100: base de la tarea contra HEAD) y el guardian
 * de merges (destino contra el commit que entra), para que los dos decidan lo
 * mismo por construccion y no con dos copias que se desvien. Lee SIEMPRE la
 * configuracion de `base` (`configDeRef`), nunca la del arbol de trabajo: la
 * rama que se integra no puede ampliar sus propias rutas de documentacion, ni
 * con un commit ni con un cambio sin commitear.
 *
 * Devuelve tambien el `timeout_verificacion` de la base: la huella del memo de
 * documentacion se calcula con el (lo guarda `finish`, lo busca el guardian).
 *
 * TASK-102: el freno Stop la usa ademas con el arbol de trabajo (`conArbol`) y
 * elige que verificacion toca con `peticionDeTrabajo`, la misma para Stop y
 * para review: primero solo documentacion, despues la selectiva, y si no, la
 * de siempre.
 */
import { ConfigError, type TaskcodeConfig } from '../core/config.js';
import {
  decidirVerificacion,
  documentacionDeclarada,
  patronesDocumentacion,
  type DecisionVerificacion,
} from '../core/verificacion-proporcional.js';
import { configDeRef } from './config-de-ref.js';
import { rutasDelArbol, rutasDeTarea } from './git.js';

/**
 * Tests held-out de las tareas (`tareas/<estado>/TASK-NNN/aceptacion/`). `finish`
 * los corre con su propia puerta; el guardian no, asi que alli cuentan como
 * codigo (decision de Carlos en el plan de TASK-101).
 */
const RUTA_HELDOUT = /^tareas\/(?:[^/]+\/)+aceptacion\//;

export type ResultadoDecision =
  | { tipo: 'decision'; decision: DecisionVerificacion; timeoutS: number; comandoDocumentacion: string | null }
  /** La config de la base no se puede leer: quien llama decide (nunca vale como «sin config»). */
  | { tipo: 'config-invalida'; error: ConfigError };

export interface OpcionesDecision {
  /** El guardian: los held-out cuentan como codigo. */
  heldoutComoCodigo?: boolean;
  /**
   * TASK-102 (freno Stop): suma lo que el arbol de trabajo cambia frente a
   * HEAD (preparado, sin preparar y no trackeado). Se une ANTES de decidir:
   * una tarea de docs sin commits no sale «vacia», y un .ts sin commitear la
   * saca de «solo documentacion». Si cualquiera de los dos lados falla, el
   * diff es null (la de siempre).
   */
  conArbol?: boolean;
}

type Rutas = { todas: string[]; fueraDeDocs: string[] };

function unir(a: Rutas | null, b: Rutas | null): Rutas | null {
  if (a === null || b === null) return null;
  return {
    todas: [...new Set([...a.todas, ...b.todas])],
    fueraDeDocs: [...new Set([...a.fueraDeDocs, ...b.fueraDeDocs])],
  };
}

/**
 * Decision para lo que cambia `hasta` frente a `base` (desde su merge base).
 * null si la base no declara `rutas_documentacion`: entonces ni se calcula el
 * diff (cero coste para quien no lo usa).
 */
export function decidirVerificacionEntre(
  base: string,
  hasta: string,
  cwd: string,
  opciones: OpcionesDecision = {}
): ResultadoDecision | null {
  let config;
  try {
    config = configDeRef(base, cwd);
  } catch (e: unknown) {
    if (e instanceof ConfigError) return { tipo: 'config-invalida', error: e };
    throw e;
  }
  if (!documentacionDeclarada(config)) return null;
  const patrones = patronesDocumentacion(config);
  let diff = rutasDeTarea(base, hasta, patrones, cwd);
  if (opciones.conArbol === true) diff = unir(diff, rutasDelArbol(patrones, cwd));
  if (diff !== null && opciones.heldoutComoCodigo === true) {
    const heldout = diff.todas.filter((r) => RUTA_HELDOUT.test(r) && !diff?.fueraDeDocs.includes(r));
    if (heldout.length > 0) diff = { todas: diff.todas, fueraDeDocs: [...diff.fueraDeDocs, ...heldout] };
  }
  return {
    tipo: 'decision',
    decision: decidirVerificacion(config, diff, base),
    timeoutS: config.timeout_verificacion,
    comandoDocumentacion: config.comando_verificacion_documentacion,
  };
}

/** Que verificacion toca en un turno (Stop) o en una ronda (review). */
export type PlanVerificacion =
  /** Solo documentacion. `comando` null: no se declaro comprobacion, no se corre nada. */
  | { tipo: 'documentacion'; comando: string | null; timeoutS: number; motivo: string }
  | { tipo: 'selectiva'; comando: string; timeoutS: number; base: string }
  | { tipo: 'completa'; comando: string; timeoutS: number }
  | { tipo: 'nada' };

export interface EntradaTrabajo {
  /** Config del ARBOL de trabajo: la puerta barata (sin `rutas_documentacion` no se lanza ni un git). */
  config: TaskcodeConfig;
  raiz: string;
  /** Rama base de la tarea; perezosa para no resolverla (ni lanzar git) si no hace falta. */
  base: () => string;
  /**
   * false si la base es solo un respaldo (tarea sin tipo): la selectiva la usa
   * como en la 0.14.0, pero no se exime nada por documentacion con ella.
   */
  baseFiable: boolean;
  /** Que se corre si no hay selectiva: el Stop, la completa; review, nada. */
  sinSelectiva: 'completa' | 'nada';
}

/**
 * TASK-102: la eleccion «documentacion -> selectiva -> la de siempre», en un
 * solo sitio para que Stop y review decidan igual para el mismo diff.
 *
 * La puerta mira la config del arbol: sin `rutas_documentacion` no se lee la de
 * la base ni se calcula ningun diff (cero procesos git nuevos por turno). Si la
 * declara, decide la de la base (`decidirVerificacionEntre`, la de finish y el
 * guardian), con el arbol de trabajo incluido. Una config de la base invalida
 * no bloquea: la de siempre con un aviso, como en finish.
 */
export function peticionDeTrabajo(e: EntradaTrabajo): { plan: PlanVerificacion; avisos: string[] } {
  const avisos: string[] = [];
  const { config } = e;
  let resuelta: string | undefined;
  const base = (): string => (resuelta ??= e.base());
  if (documentacionDeclarada(config)) {
    if (e.baseFiable) {
      const r = decidirVerificacionEntre(base(), 'HEAD', e.raiz, { conArbol: true });
      if (r !== null && r.tipo === 'config-invalida') {
        avisos.push(
          `La configuracion de "${base()}" no es valida, asi que no se puede saber si solo cambia ` +
            `documentacion: se aplica la verificacion de siempre. Detalle: ` +
            r.error.message.replace(/^\[ERROR\]\s*/, '')
        );
      } else if (r !== null && r.decision.tipo === 'documentacion') {
        return {
          plan: { tipo: 'documentacion', comando: r.comandoDocumentacion, timeoutS: r.timeoutS, motivo: r.decision.motivo },
          avisos,
        };
      }
    }
  }
  const selectiva = config.comando_verificacion_selectiva;
  if (selectiva !== null) {
    return {
      plan: { tipo: 'selectiva', comando: selectiva, timeoutS: config.timeout_verificacion_selectiva, base: base() },
      avisos,
    };
  }
  if (e.sinSelectiva === 'completa' && config.comando_verificacion !== null) {
    return { plan: { tipo: 'completa', comando: config.comando_verificacion, timeoutS: config.timeout_verificacion }, avisos };
  }
  return { plan: { tipo: 'nada' }, avisos };
}
