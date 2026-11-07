/**
 * Coste de implementacion registrado sin que nadie lo pida (TASK-085). Pura:
 * recibe texto y numeros; leer las transcripciones y el libro de pendientes
 * es de `fs/coste-automatico.ts`.
 *
 * QUE CUENTA COMO IMPLEMENTACION (decision de Carlos en el plan): lo que
 * gasta el hilo principal de la sesion y sus subagentes MIENTRAS la tarea
 * esta en curso, y nada mas. Una sesion suele llevar el diseno de la misma
 * tarea, otras tareas del sprint y la orquestacion de la revision; sumar la
 * transcripcion entera cambiaria una infravaloracion por una sobrevaloracion
 * que nadie ve. Por eso:
 *  - Ventanas: de cada fila `start` de `## Transiciones` a la siguiente
 *    `review` (o a `hasta`, el instante del volcado). Una fila con solo el
 *    dia (anterior a TASK-052) no abre ventana: no se sabe a que hora.
 *  - Cada linea de asistente cuenta si su `timestamp` cae en una ventana, su
 *    `gitBranch` (si lo trae) es la rama de la tarea y su `cwd` (si lo trae)
 *    esta dentro del repo. Lo de la rama separa las tareas consecutivas de
 *    una misma sesion; lo del `cwd`, otro clon o un repo de pruebas.
 *
 * SIN DUPLICAR: antes de sumar una fuente se mira lo ya anotado para su id
 * en `## Coste`.
 *  - En otra fase: no se toca (un agente de revision no es implementacion).
 *  - En implementacion, en filas propias con desglose: se suma solo lo que ha
 *    crecido, con el prefijo `dif:` (la semantica de TASK-065).
 *  - En implementacion junto a otros ids o sin desglose (un registro a mano
 *    de varios agentes): no se sabe cuanto es suyo; se deja como esta.
 */
import path from 'node:path';
import type { UsoTranscripcion } from './coste-transcripcion.js';
import { idsDeFuente, leerCostes, PREFIJO_DIFERENCIA, type FilaCoste } from './coste-registro.js';
import { instanteDe, leerTransiciones, precisionDeFecha } from './transiciones.js';

/** Intervalo semiabierto [desde, hasta) en milisegundos UTC. */
export interface Ventana {
  desde: number;
  hasta: number;
}

/** Ventanas en las que la tarea estuvo en curso, segun su registro de transiciones. */
export function ventanasEnCurso(body: string, hastaMs: number): Ventana[] {
  const ventanas: Ventana[] = [];
  let abierta: number | null = null;
  for (const fila of leerTransiciones(body)) {
    if (precisionDeFecha(fila.fecha) !== 'segundo') continue;
    const t = instanteDe(fila.fecha);
    if (fila.fase === 'start') {
      if (abierta === null) abierta = t;
    } else if (fila.fase === 'review' && abierta !== null) {
      if (t > abierta) ventanas.push({ desde: abierta, hasta: t });
      abierta = null;
    }
  }
  if (abierta !== null && hastaMs > abierta) ventanas.push({ desde: abierta, hasta: hastaMs });
  return ventanas;
}

/** true si `hijo` es `padre` o esta dentro (sin distinguir mayusculas en Windows, como path.relative). */
function dentroDe(padre: string, hijo: string): boolean {
  const rel = path.relative(path.resolve(padre), path.resolve(hijo));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** El filtro de lineas de `sumarUsoTranscripcion` para una tarea (ver la cabecera). */
export function filtroDeTarea(
  ventanas: readonly Ventana[],
  rama: string,
  raiz: string,
  /** Canoniza una ruta antes de comparar (en Windows, `NULLCA~1` frente al nombre largo). */
  normalizar: (ruta: string) => string = (ruta) => ruta
): (linea: Readonly<Record<string, unknown>>) => boolean {
  const raizNormal = normalizar(raiz);
  return (linea) => {
    const ts = linea['timestamp'];
    if (typeof ts !== 'string') return false;
    const t = Date.parse(ts);
    if (Number.isNaN(t) || !ventanas.some((v) => t >= v.desde && t < v.hasta)) return false;
    const rama_ = linea['gitBranch'];
    if (typeof rama_ === 'string' && rama_ !== '' && rama_ !== rama) return false;
    const cwd = linea['cwd'];
    if (typeof cwd === 'string' && cwd !== '' && !dentroDe(raizNormal, normalizar(cwd))) return false;
    return true;
  };
}

export type TipoFuente = 'agente' | 'sesion';

/** Lo medido de una transcripcion dentro de las ventanas. */
export interface FuenteMedida {
  tipo: TipoFuente;
  id: string;
  uso: UsoTranscripcion;
}

export interface Volcado {
  /** Filas nuevas de `## Coste`, todas de fase implementacion. */
  filas: FilaCoste[];
  /** Suma de sus `total`: lo que se anade a `tokens_implementacion`. */
  total: number;
  /** Fuentes que no se suman por lo ya anotado (`tipo:id` y por que). */
  omitidas: string[];
}

const CAMPOS = ['tokens', 'entrada', 'cacheEscritura', 'cacheLectura', 'salida', 'lecturas'] as const;
type Campos = Record<(typeof CAMPOS)[number], number>;

/** Filas a anadir para las fuentes medidas, descontando lo ya anotado (ver la cabecera). */
export function filasDeVolcado(body: string, medidas: readonly FuenteMedida[], fecha: string): Volcado {
  const previas = leerCostes(body);
  const filas: FilaCoste[] = [];
  const omitidas: string[] = [];
  let total = 0;
  for (const m of medidas) {
    const prefijo = `${m.tipo}:`;
    const suyas = previas.filter((f) => f.fuente.startsWith(prefijo) && idsDeFuente(f.fuente).some((x) => x.id === m.id));
    const otraFase = suyas.find((f) => f.fase !== 'implementacion');
    if (otraFase !== undefined) {
      omitidas.push(`${prefijo}${m.id} (ya anotado en ${otraFase.fase})`);
      continue;
    }
    const sinReparto = suyas.some(
      (f) =>
        idsDeFuente(f.fuente).length > 1 ||
        f.entrada === null ||
        f.cacheEscritura === null ||
        f.cacheLectura === null ||
        f.salida === null
    );
    if (sinReparto) {
      omitidas.push(`${prefijo}${m.id} (ya anotado junto a otros o sin desglose)`);
      continue;
    }
    const anotado: Campos = { tokens: 0, entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0, lecturas: 0 };
    for (const f of suyas) {
      anotado.tokens += f.total;
      anotado.entrada += f.entrada as number;
      anotado.cacheEscritura += f.cacheEscritura as number;
      anotado.cacheLectura += f.cacheLectura as number;
      anotado.salida += f.salida as number;
      anotado.lecturas += f.lecturas ?? 0;
    }
    const delta = {} as Campos;
    for (const k of CAMPOS) delta[k] = m.uso[k] - anotado[k];
    // Nada nuevo, o una transcripcion que encoge (otra o recortada): no se toca.
    if (delta.tokens <= 0 || CAMPOS.some((k) => delta[k] < 0)) continue;
    const fila: FilaCoste = {
      fecha,
      fase: 'implementacion',
      fuente: `${prefijo}${suyas.length > 0 ? PREFIJO_DIFERENCIA : ''}${m.id}`,
      entrada: delta.entrada,
      cacheEscritura: delta.cacheEscritura,
      cacheLectura: delta.cacheLectura,
      salida: delta.salida,
      lecturas: delta.lecturas,
      total: delta.tokens,
      ronda: null,
      revisor: null,
    };
    filas.push(fila);
    total += fila.total;
  }
  return { filas, total, omitidas };
}
