/**
 * Progreso visible de la fase en curso (TASK-110). Contrato del fichero de
 * progreso que escriben plan, approve, start, review, finish y el freno Stop, y
 * la linea que lo muestra (`taskctl estado`, la status line de Claude Code).
 * Puro: no toca disco ni lanza procesos.
 *
 * La linea dice lo que falta en dos niveles: la fase dentro del ciclo de la
 * tarea y, dentro de la fase, el paso con su posicion; si el comando de
 * verificacion escribe un contador, tambien su x/N. Por ejemplo:
 *
 *   TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min
 *
 * Es una interfaz publica (la status line de la persona la muestra tal cual):
 * cambiar el separador o el formato de los minutos rompe en silencio, por eso
 * el fichero lleva `version` y el formato tiene un unico test que lo fija.
 *
 * Lectura tolerante: el fichero vive bajo `.git/`, pero lo que se muestra
 * acaba pintado en la barra de Claude Code, asi que todo texto pasa por
 * `limpiarTexto` (sin secuencias ANSI ni caracteres de control, recortado).
 */

export const VERSION_PROGRESO = 1;

/** Las fases del ciclo de una tarea, en orden: la linea dice en cual va (`review (4/5)`). */
export const FASES_CICLO = ['plan', 'approve', 'start', 'review', 'finish'] as const;
export type FaseCiclo = (typeof FASES_CICLO)[number];
/** `freno`: el freno de fin de turno, que no es una fase del ciclo (va sin posicion). */
export type FaseProgreso = FaseCiclo | 'freno';
/**
 * `en-rojo`: termino sin interrumpirse pero su verificacion salio en rojo (el freno
 * Stop). Un fichero anterior sin ese valor se sigue leyendo igual.
 */
export type ResultadoFase = 'ok' | 'abortada' | 'en-rojo';
const RESULTADOS: readonly string[] = ['ok', 'abortada', 'en-rojo'];

export interface EstadoProgreso {
  version: number;
  tarea: string;
  fase: string;
  /** Los pasos de la fase, declarados de antemano para que se sepa cuantos faltan. */
  pasos: string[];
  /** El paso en marcha (uno de `pasos`), o null antes del primero. */
  paso: string | null;
  ronda: number | null;
  /** Instante de inicio de la fase, en ms desde epoch. */
  inicio: number;
  /** true si el paso en marcha tiene un contador x/N (el del comando de verificacion). */
  contador: boolean;
  terminado: boolean;
  resultado: ResultadoFase | null;
  /** Instante en que termino, en ms desde epoch. */
  fin: number | null;
}

export interface Contador {
  x: number;
  n: number;
}

/** Lo que dice la linea cuando no hay nada en marcha en un proyecto con tareas. */
export const NADA_EN_MARCHA = 'Nada en marcha.';

const SEPARADOR = ' · ';
const MAX_CAMPO = 40;
const MAX_PASOS = 20;
export const MAX_LINEA = 160;

const ANSI_CSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;
const ANSI_OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/g;
// Control C0 y C1, separadores de linea y marcas de direccion (podrian reordenar la barra).
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g;

/** Recorta a `max` caracteres (por puntos de codigo), con `…` si sobra. */
export function recortar(texto: string, max: number): string {
  const cps = Array.from(texto);
  return cps.length <= max ? texto : `${cps.slice(0, Math.max(0, max - 1)).join('')}…`;
}

/** Texto apto para la barra: sin ANSI ni control, espacios colapsados, recortado. null si no es texto o queda vacio. */
export function limpiarTexto(valor: unknown, max: number = MAX_CAMPO): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.replace(ANSI_CSI, '').replace(ANSI_OSC, '').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
  return limpio === '' ? null : recortar(limpio, max);
}

const entero = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null;

/**
 * El estado del fichero, o null si no es un progreso de esta version (ilegible,
 * sin tarea, sin fase o sin inicio). Lo que sobra o viene mal se ignora.
 */
export function validarProgreso(json: unknown): EstadoProgreso | null {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  if (o['version'] !== VERSION_PROGRESO) return null;
  const tarea = limpiarTexto(o['tarea'], 20);
  const fase = limpiarTexto(o['fase'], 20);
  const inicio = entero(o['inicio']);
  if (tarea === null || fase === null || inicio === null) return null;
  const pasos = Array.isArray(o['pasos'])
    ? o['pasos']
        .slice(0, MAX_PASOS)
        .map((p) => limpiarTexto(p))
        .filter((p): p is string => p !== null)
    : [];
  const resultado = typeof o['resultado'] === 'string' && RESULTADOS.includes(o['resultado']) ? (o['resultado'] as ResultadoFase) : null;
  return {
    version: VERSION_PROGRESO,
    tarea,
    fase,
    pasos,
    paso: limpiarTexto(o['paso']),
    ronda: entero(o['ronda']),
    inicio,
    contador: o['contador'] === true,
    terminado: o['terminado'] === true,
    resultado,
    fin: entero(o['fin']),
  };
}

/**
 * El x/N que el comando de verificacion dejo en su fichero: el ultimo `x/N` de
 * la ultima linea con texto. Cualquier otra cosa (JSON, ANSI, texto) se ignora;
 * solo se muestran los numeros, asi que nada ajeno llega a la barra.
 */
export function parsearContador(texto: string): Contador | null {
  const lineas = texto.split(/\r?\n|\r/).filter((l) => l.trim() !== '');
  const ultima = lineas[lineas.length - 1];
  if (ultima === undefined) return null;
  const todos = [...ultima.matchAll(/(\d{1,9})\s*\/\s*(\d{1,9})/g)];
  const m = todos[todos.length - 1];
  if (m === undefined) return null;
  const x = Number(m[1]);
  const n = Number(m[2]);
  return n > 0 ? { x, n } : null;
}

/** Minutos enteros transcurridos (nunca negativos: un reloj que retrocede da 0). */
export function minutosDesde(inicioMs: number, ahoraMs: number): number {
  return Math.max(0, Math.floor((ahoraMs - inicioMs) / 60_000));
}

/** `review (4/5)` para una fase del ciclo; el nombre a secas para las demas. */
export function etiquetaFase(fase: string): string {
  const i = (FASES_CICLO as readonly string[]).indexOf(fase);
  return i === -1 ? fase : `${fase} (${String(i + 1)}/${String(FASES_CICLO.length)})`;
}

/** true si la fase sigue en marcha (no ha marcado su final). */
export function enMarcha(e: EstadoProgreso): boolean {
  return !e.terminado;
}

/**
 * La linea de estado. En marcha: `TASK-NNN · <fase> (i/5) [· ronda R] · <paso> (j/M) [x/N] · <mm> min`.
 * Terminada: `Nada en marcha · ultima: TASK-NNN · <fase> (i/5) · terminada hace <mm> min`.
 */
export function formatearEstado(e: EstadoProgreso, ahoraMs: number, contador: Contador | null): string {
  if (e.terminado) {
    const como = e.resultado === 'abortada' ? 'abortada' : e.resultado === 'en-rojo' ? 'en rojo' : 'terminada';
    const hace = minutosDesde(e.fin ?? e.inicio, ahoraMs);
    return recortar(
      ['Nada en marcha', `ultima: ${e.tarea}`, etiquetaFase(e.fase), `${como} hace ${String(hace)} min`].join(SEPARADOR),
      MAX_LINEA
    );
  }
  const partes = [e.tarea, etiquetaFase(e.fase)];
  if (e.ronda !== null) partes.push(`ronda ${String(e.ronda)}`);
  if (e.paso !== null) {
    const i = e.pasos.indexOf(e.paso);
    let paso = i === -1 ? e.paso : `${e.paso} (${String(i + 1)}/${String(e.pasos.length)})`;
    if (e.contador && contador !== null) paso += ` ${String(contador.x)}/${String(contador.n)}`;
    partes.push(paso);
  }
  partes.push(`${String(minutosDesde(e.inicio, ahoraMs))} min`);
  return recortar(partes.join(SEPARADOR), MAX_LINEA);
}
