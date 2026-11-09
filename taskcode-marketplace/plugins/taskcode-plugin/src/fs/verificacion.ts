/**
 * Ejecutar la verificacion del proyecto (`comando_verificacion`) — TASK-071.
 * Pieza comun del hook Stop y de la puerta de `finish` (TASK-072): la
 * politica (bloquear un turno, abortar un cierre) es de cada consumidor; aqui
 * solo se ejecuta, se mide y se recuerda.
 *
 * MEMO POR HUELLA (decision de Carlos en el plan de TASK-071): con una tarea
 * en curso, cada fin de turno pediria la suite entera aunque el turno no haya
 * tocado nada (~10 min en el repo que construye esto). Se guarda el
 * resultado junto a una huella del arbol (HEAD, comando, timeout y contenido
 * de lo que no esta limpio); con la misma huella, verde y rojo se reutilizan
 * sin ejecutar. Se acepta que un rojo intermitente no se reintenta hasta que
 * algo cambie, y el informe lo dice.
 *
 * El memo vive bajo `.git/` (`git rev-parse --git-path`), nunca en el
 * workspace: alli ensuciaria el arbol y cambiaria su propia huella. Tampoco
 * bajo la carpeta del plugin, que cambia al actualizarlo.
 *
 * DOS TIPOS, DOS MEMOS (TASK-091): la verificacion completa
 * (`comando_verificacion`) y la selectiva por impacto
 * (`comando_verificacion_selectiva`) guardan su resultado en ficheros
 * distintos. El guardian de merges solo lee el de la completa, asi que un
 * verde de la selectiva nunca abre la puerta, ni aunque los dos comandos
 * tengan el mismo texto; y la selectiva del Stop tampoco pisa el verde de la
 * completa que dejo `finish`. La huella de la selectiva lleva ademas la rama
 * base y su commit: su resultado depende de lo cambiado respecto a ella.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ejecutarAcotado, fotoDelArbol, fueCortado, MARCA_TIMEOUT } from './ejecucion-acotada.js';
import type { ResultadoVerificacion } from '../core/informe-verificacion.js';

/** Bytes del final de la salida que se leen (el informe muestra menos: ver informe-verificacion). */
const BYTES_COLA_LEIDOS = 16 * 1024;
/** TASK-091: la completa es la puerta de integracion; la selectiva, la de las rondas. */
export type TipoVerificacion = 'completa' | 'selectiva';

const FICHEROS_MEMO: Readonly<Record<TipoVerificacion, string>> = Object.freeze({
  completa: 'freno-verificacion.json',
  selectiva: 'freno-verificacion-selectiva.json',
});
const VERSION_MEMO = 1;

/**
 * Variable de entorno con la que la verificacion selectiva recibe la rama
 * base (TASK-091). Por entorno y no como argumento: el comando es entero del
 * proyecto y no se le interpola nada (ver ejecucion-acotada). Nombre neutro:
 * la leen proyectos ajenos.
 */
export const VARIABLE_RAMA_BASE = 'RAMA_BASE';

export interface OpcionesVerificacion {
  /** Solo para tests: sustituye al timeout en segundos (en ms). */
  timeoutMs?: number;
  /** Entorno del comando (por defecto el del proceso). */
  env?: NodeJS.ProcessEnv;
}

/** Ejecuta `comando` en `raiz` con un tope de `timeoutS` segundos. Nunca lanza. */
export function ejecutarVerificacion(
  raiz: string,
  comando: string,
  timeoutS: number,
  opciones: OpcionesVerificacion = {}
): ResultadoVerificacion {
  const timeoutMs = opciones.timeoutMs ?? timeoutS * 1000;
  const r = ejecutarAcotado(raiz, comando, timeoutMs, {
    unirSalida: true,
    bytesCola: BYTES_COLA_LEIDOS,
    ...(opciones.env === undefined ? {} : { env: opciones.env }),
  });
  const base = {
    comando,
    duracionMs: r.duracionMs,
    timeoutS: Math.round(timeoutMs / 1000),
    bytesTotales: r.bytesTotales,
  };
  if (fueCortado(r)) {
    // La marca es del envoltorio, no del comando: fuera de la cola y de la cuenta de bytes.
    const conMarca = r.salida.endsWith(MARCA_TIMEOUT);
    const cola = conMarca ? r.salida.slice(0, -MARCA_TIMEOUT.length) : r.salida;
    const bytesTotales = conMarca ? Math.max(0, r.bytesTotales - Buffer.byteLength(MARCA_TIMEOUT)) : r.bytesTotales;
    return { ...base, bytesTotales, estado: 'cortada', codigo: null, cola };
  }
  if (r.error !== undefined) {
    return { ...base, estado: 'no-lanzable', codigo: null, cola: r.salida, error: r.error.message };
  }
  if (r.status === null) {
    return { ...base, estado: 'roja', codigo: null, cola: r.salida, error: `senal ${String(r.signal)}` };
  }
  return { ...base, estado: r.status === 0 ? 'verde' : 'roja', codigo: r.status, cola: r.salida };
}

// ---------------------------------------------------------------------
// Huella y memo
// ---------------------------------------------------------------------

function git(args: readonly string[], cwd: string): string | null {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  if (r.error !== undefined || r.status !== 0) return null;
  return (r.stdout ?? '').trim();
}

/**
 * Huella del estado que la verificacion ve: HEAD, el comando, su timeout y
 * el contenido de cada fichero que no esta limpio (incluidos los no
 * trackeados). null si no se puede calcular (sin commits, git roto): sin
 * huella no hay memo, y se ejecuta siempre.
 */
export function huellaDelArbol(
  raiz: string,
  comando: string,
  timeoutS: number,
  contexto?: string
): string | null {
  const head = git(['rev-parse', 'HEAD'], raiz);
  if (head === null) return null;
  let foto: Map<string, string>;
  try {
    foto = fotoDelArbol(raiz);
  } catch {
    return null;
  }
  const h = createHash('sha1');
  h.update(`v${String(VERSION_MEMO)}\0${head}\0${comando}\0${String(timeoutS)}\0`);
  // TASK-091: solo la selectiva trae contexto; la formula de la completa no cambia.
  if (contexto !== undefined) h.update(`ctx\0${contexto}\0`);
  for (const ruta of [...foto.keys()].sort()) h.update(`${ruta}\0${foto.get(ruta) as string}\0`);
  return h.digest('hex');
}

/**
 * Huella que tendria el arbol LIMPIO en el commit `ref` (TASK-072): la misma
 * formula que `huellaDelArbol` sin ficheros sucios, asi que coincide con la
 * que guardo una verificacion hecha con ese commit en HEAD y el arbol limpio
 * (la de `finish`, o la del freno Stop si no habia nada sin commitear). La usa
 * el guardian de merges, que pregunta por la rama que entra sin cambiarse a
 * ella. null si `ref` no resuelve a un commit.
 */
export function huellaDeCommit(raiz: string, ref: string, comando: string, timeoutS: number): string | null {
  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`], raiz);
  if (sha === null || sha === '') return null;
  const h = createHash('sha1');
  h.update(`v${String(VERSION_MEMO)}\0${sha}\0${comando}\0${String(timeoutS)}\0`);
  return h.digest('hex');
}

export interface MemoVerificacion {
  version: number;
  huella: string;
  resultado: ResultadoVerificacion;
  fecha: string;
}

function rutaMemo(raiz: string, tipo: TipoVerificacion): string | null {
  const p = git(['rev-parse', '--git-path', FICHEROS_MEMO[tipo]], raiz);
  if (p === null || p === '') return null;
  return path.resolve(raiz, p);
}

/** El resultado guardado para esa huella, o null. Un memo ilegible es como no tenerlo. */
export function leerMemo(
  raiz: string,
  huella: string,
  tipo: TipoVerificacion = 'completa'
): ResultadoVerificacion | null {
  const ruta = rutaMemo(raiz, tipo);
  if (ruta === null) return null;
  try {
    const m = JSON.parse(readFileSync(ruta, 'utf8')) as Partial<MemoVerificacion>;
    if (m.version !== VERSION_MEMO || m.huella !== huella || typeof m.resultado !== 'object' || m.resultado === null) {
      return null;
    }
    return m.resultado;
  } catch {
    return null;
  }
}

/** Guarda el resultado de la ultima verificacion. Un fallo al guardar no es un fallo de la verificacion. */
export function guardarMemo(
  raiz: string,
  huella: string,
  resultado: ResultadoVerificacion,
  tipo: TipoVerificacion = 'completa'
): void {
  const ruta = rutaMemo(raiz, tipo);
  if (ruta === null) return;
  const memo: MemoVerificacion = { version: VERSION_MEMO, huella, resultado, fecha: new Date().toISOString() };
  try {
    mkdirSync(path.dirname(ruta), { recursive: true });
    writeFileSync(ruta, `${JSON.stringify(memo)}\n`, 'utf8');
  } catch {
    /* sin memo: la proxima vez se ejecuta */
  }
}

// ---------------------------------------------------------------------
// Ejecucion con memo (TASK-091): la usan el hook Stop y `review`
// ---------------------------------------------------------------------

export interface PeticionVerificacion {
  tipo: TipoVerificacion;
  comando: string;
  timeoutS: number;
  /** Rama base. Obligatoria en la selectiva (va en RAMA_BASE y en su huella); ignorada en la completa. */
  base?: string;
}

export interface VerificacionConMemo {
  resultado: ResultadoVerificacion;
  /** true si no se ha ejecutado: es el resultado guardado para la misma huella. */
  deMemo: boolean;
  /** true si la propia verificacion cambio ficheros del arbol de trabajo. */
  cambioElArbol: boolean;
}

/**
 * El contexto de la huella de la selectiva: la base por su nombre y por su
 * commit (si la base avanza, lo cambiado respecto a ella tambien). Una base
 * que no resuelve entra vacia: el script del proyecto decidira que hacer.
 */
function contextoSelectiva(raiz: string, base: string): string {
  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${base}^{commit}`], raiz) ?? '';
  return `selectiva\0${base}\0${sha}`;
}

/**
 * Ejecuta la verificacion pedida, salvo que la ultima con la misma huella
 * este guardada: entonces devuelve esa. Guarda el resultado en el memo de su
 * tipo. No lanza por el comando (ejecutarVerificacion no lanza).
 */
export function verificarConMemo(
  raiz: string,
  p: PeticionVerificacion,
  opciones: OpcionesVerificacion = {}
): VerificacionConMemo {
  if (p.tipo === 'selectiva' && (p.base === undefined || p.base === '')) {
    throw new Error('la verificacion selectiva necesita la rama base');
  }
  const contexto = p.tipo === 'selectiva' ? contextoSelectiva(raiz, p.base as string) : undefined;
  const huella = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
  const guardado = huella === null ? null : leerMemo(raiz, huella, p.tipo);
  if (guardado !== null) return { resultado: guardado, deMemo: true, cambioElArbol: false };

  const env =
    p.tipo === 'selectiva'
      ? { ...(opciones.env ?? process.env), [VARIABLE_RAMA_BASE]: p.base as string }
      : opciones.env;
  const resultado = ejecutarVerificacion(raiz, p.comando, p.timeoutS, {
    ...(opciones.timeoutMs === undefined ? {} : { timeoutMs: opciones.timeoutMs }),
    ...(env === undefined ? {} : { env }),
  });
  const despues = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
  if (despues !== null) guardarMemo(raiz, despues, resultado, p.tipo);
  return { resultado, deMemo: false, cambioElArbol: huella !== null && despues !== null && huella !== despues };
}
