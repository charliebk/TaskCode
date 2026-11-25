/**
 * TASK-167b (Regla 4D preventiva): duplicados por CUERPO.
 *
 * Los candidatos de `candidatos-4d.ts` comparan nombres; la duplicacion que
 * mas repitieron las auditorias 4D es la misma logica con otro nombre. Aqui
 * se compara lo que hace cada definicion: su cuerpo normalizado (sin
 * comentarios, con cadenas, numeros e identificadores genericos) en tejas de
 * tokens, por Jaccard. Sin parser por lenguaje: sirve para los que extrae
 * candidatos-4d (llaves; Python por sangria).
 *
 * Puro: recibe lineas y definiciones y devuelve pares. Quien lee ficheros y
 * Git es `commands/review.ts`.
 */
import type { Definicion } from './candidatos-4d.js';
import { sinComentariosC } from './doctor-deploy-reglas.js';

/** Parecido minimo (Jaccard de tejas) para contar como duplicado. */
export const UMBRAL_PARECIDO = 0.85;
/** Tokens minimos del cuerpo: por debajo, un envoltorio de una linea, no una duplicacion que importe. */
export const MIN_TOKENS = 30;
/** Lineas maximas que se leen de un cuerpo. */
const MAX_LINEAS_CUERPO = 200;
/** Tokens por teja. */
const TEJA = 4;

/** Una definicion con su cuerpo ya leido. */
export interface DefinicionConCuerpo {
  def: Definicion;
  cuerpo: string;
}

export interface DuplicadoPorCuerpo {
  nueva: Definicion;
  otra: Definicion;
  /** Parecido de 0 a 1. */
  parecido: number;
}

/**
 * El cuerpo de la definicion que empieza en la linea `desde` (1-based): hasta
 * equilibrar las llaves si las hay (sin llave, hasta la primera linea que
 * termina en `;` o `,`); si la linea termina en `:` (Python), las
 * lineas siguientes con mas sangria. Como mucho MAX_LINEAS_CUERPO.
 */
export function cuerpoDesde(lineas: readonly string[], desde: number): string {
  const i0 = desde - 1;
  const primera = lineas[i0];
  if (primera === undefined) return '';
  if (/:\s*(#.*)?$/.test(primera) && !primera.includes('{')) {
    const sangria = /^\s*/.exec(primera)?.[0].length ?? 0;
    const salida = [primera];
    for (let i = i0 + 1; i < lineas.length && salida.length < MAX_LINEAS_CUERPO; i++) {
      const l = lineas[i] as string;
      if (l.trim() !== '' && (/^\s*/.exec(l)?.[0].length ?? 0) <= sangria) break;
      salida.push(l);
    }
    return salida.join('\n');
  }
  let nivel = 0;
  let abierto = false;
  let parentesis = 0;
  const salida: string[] = [];
  for (let i = i0; i < lineas.length && salida.length < MAX_LINEAS_CUERPO; i++) {
    const l = lineas[i] as string;
    salida.push(l);
    const limpia = sinCadenas(sinComentariosC(l));
    for (const c of limpia) {
      if (c === '{') {
        nivel++;
        abierto = true;
      } else if (c === '}') {
        nivel--;
      } else if (c === '(' || c === '[') {
        parentesis++;
      } else if (c === ')' || c === ']') {
        parentesis--;
      }
    }
    if (abierto && nivel <= 0) break;
    // Sin llave abierta y fuera de parentesis (no es una firma partida), una
    // linea que termina en ';' o ',' cierra la definicion (flecha o expresion
    // de una linea): no se sigue leyendo lo de debajo.
    if (!abierto && parentesis <= 0 && /[;,]\s*$/.test(limpia)) break;
  }
  return salida.join('\n');
}

/** Cadenas ('...', "...", `...`) sustituidas por una marca: sus llaves y su texto no cuentan. */
function sinCadenas(t: string): string {
  return t.replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, ' s ');
}

const PALABRAS_CLAVE = new Set(
  (
    'if else for while do return function const let var class new try catch finally throw switch case break ' +
    'continue await async yield import export from of in typeof instanceof null undefined true false this super ' +
    'def elif lambda pass raise with as not and or is None True False self fn pub mut impl match struct enum ' +
    'public private protected static void int string bool boolean final override interface extends implements'
  ).split(' ')
);

/** Tokens normalizados del cuerpo: identificadores a `id`, numeros a `n`, cadenas a `s`. */
export function tokensNormalizados(cuerpo: string): string[] {
  const limpio = sinCadenas(sinComentariosC(cuerpo));
  const tokens = limpio.match(/[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|[^\s\w]/g) ?? [];
  return tokens.map((t) => (/^\d/.test(t) ? 'n' : /^[A-Za-z_$]/.test(t) ? (PALABRAS_CLAVE.has(t) || t === 's' ? t : 'id') : t));
}

function tejas(tokens: readonly string[]): Set<string> {
  const salida = new Set<string>();
  for (let i = 0; i + TEJA <= tokens.length; i++) salida.add(tokens.slice(i, i + TEJA).join(' '));
  return salida;
}

/** Jaccard de dos conjuntos de tejas. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let comunes = 0;
  for (const x of a) if (b.has(x)) comunes++;
  return comunes / (a.size + b.size - comunes);
}

interface Huella {
  d: DefinicionConCuerpo;
  n: number;
  tejas: Set<string>;
}

function huella(d: DefinicionConCuerpo): Huella | null {
  const tokens = tokensNormalizados(d.cuerpo);
  return tokens.length < MIN_TOKENS ? null : { d, n: tokens.length, tejas: tejas(tokens) };
}

const misma = (a: Definicion, b: Definicion): boolean => a.fichero === b.fichero && a.nombre === b.nombre;
/** Tamanos comparables: si uno dobla al otro no pueden pasar el umbral, y se ahorra la comparacion. */
const comparables = (a: number, b: number): boolean => Math.min(a, b) / Math.max(a, b) >= UMBRAL_PARECIDO;

/**
 * Pares de definiciones nuevas con otra (existente o nueva) de cuerpo casi
 * identico, del mas parecido al menos. Una definicion no se compara consigo
 * misma (mismo fichero y nombre: es la misma funcion, cambiada).
 */
export function duplicadosPorCuerpo(
  nuevas: readonly DefinicionConCuerpo[],
  existentes: readonly DefinicionConCuerpo[]
): DuplicadoPorCuerpo[] {
  const hn = nuevas.map(huella).filter((h): h is Huella => h !== null);
  const he = existentes.map(huella).filter((h): h is Huella => h !== null);
  const pares: DuplicadoPorCuerpo[] = [];
  hn.forEach((a, i) => {
    for (const b of [...he, ...hn.slice(i + 1)]) {
      if (misma(a.d.def, b.d.def) || !comparables(a.n, b.n)) continue;
      const parecido = jaccard(a.tejas, b.tejas);
      if (parecido >= UMBRAL_PARECIDO) pares.push({ nueva: a.d.def, otra: b.d.def, parecido });
    }
  });
  return pares.sort((x, y) => y.parecido - x.parecido);
}

/** La lista para `## Candidatos 4D` y el aviso de `review`; '' sin pares. */
export function seccionDuplicadosPorCuerpo(pares: readonly DuplicadoPorCuerpo[], max = 10): string {
  if (pares.length === 0) return '';
  const loc = (d: Definicion): string => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;
  const resto = pares.length > max ? `- ... y ${String(pares.length - max)} mas\n` : '';
  return (
    '### Posible duplicacion por cuerpo\n\n' +
    'Definiciones nuevas casi identicas a otra, aunque se llamen distinto (Regla 4D: busca todos los usos y ' +
    'unifica; duplicacion real = IMPORTANTE).\n\n' +
    pares
      .slice(0, max)
      .map((p) => `- ${loc(p.nueva)} ~ ${loc(p.otra)}: ${String(Math.round(p.parecido * 100))} %\n`)
      .join('') +
    resto +
    '\n'
  );
}
