/**
 * Desglose del coste de una tarea (TASK-063): la seccion `## Coste` de
 * `tarea.md`, una fila por cada `taskctl registrar-coste`.
 *
 * | fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
 * |---|---|---|---|---|---|---|---|---|
 * | 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 |
 * | 2026-10-25T15:10:00Z | diseno | manual | - | - | - | - | - | 5000 |
 *
 * Calcado de `core/transiciones.ts` (misma busqueda de seccion, fuera de
 * bloques de codigo, la ultima gana), y por la misma razon que TASK-056: una
 * tabla en el cuerpo y no claves de frontmatter, que no anida y obligaria a
 * tocar el parser y `TASK_FIELD_ORDER` con quince claves planas nuevas.
 *
 * El TOTAL de cada fase sigue en `tokens_<fase>` del frontmatter: la tabla es
 * el desglose de ese total y la escribe el mismo comando en el mismo commit.
 * Una tarea anterior no tiene tabla y sigue siendo valida; lo que el
 * desglose no cubra lo calcula quien lo lea (`tokens_<fase>` menos la suma de
 * sus filas).
 *
 * Columnas:
 *  - `fuente`: `agente:<id>[,<id>...]` (lo leido de las transcripciones) o
 *    `manual` (`--tokens N`, una cifra sin desglose).
 *  - `entrada` .. `salida`: los cuatro campos del `usage`; `lecturas`, los
 *    `tool_use` de lectura (`core/coste-transcripcion.ts`). `-` = sin dato,
 *    que no es 0: una fila `manual` solo tiene `total`.
 *  - `total`: lo que la fila sumo a `tokens_<fase>`. Sin ella, una fila
 *    manual no tendria donde poner su cifra.
 *
 * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas ni
 * toca nada fuera de su seccion; leer nunca falla.
 */
import { dentroDeBloque, precisionDeFecha, rangoDeSeccion } from './transiciones.js';

export const SECCION_COSTE = '## Coste';

/** Fases con coste propio, cada una con su `tokens_<fase>` en el frontmatter. */
export const FASES_COSTE = ['diseno', 'implementacion', 'revision'] as const;
export type FaseCoste = (typeof FASES_COSTE)[number];

export interface FilaCoste {
  /** `YYYY-MM-DDTHH:MM:SSZ` (o `YYYY-MM-DD`, que tambien se lee). */
  fecha: string;
  fase: FaseCoste;
  /** `agente:<id>[,<id>...]` o `manual`. */
  fuente: string;
  entrada: number | null;
  cacheEscritura: number | null;
  cacheLectura: number | null;
  salida: number | null;
  lecturas: number | null;
  total: number;
}

export const CABECERA_COSTE =
  '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |';
const SEPARADOR = '|---|---|---|---|---|---|---|---|---|';
const COLUMNAS = 9;
const SIN_DATO = '-';

function celda(n: number | null): string {
  return n === null ? SIN_DATO : String(n);
}

function filaATexto(f: FilaCoste): string {
  return (
    `| ${f.fecha} | ${f.fase} | ${f.fuente} | ${celda(f.entrada)} | ${celda(f.cacheEscritura)} | ` +
    `${celda(f.cacheLectura)} | ${celda(f.salida)} | ${celda(f.lecturas)} | ${String(f.total)} |`
  );
}

/**
 * Anade una fila al desglose. Si la seccion no existe la crea al final del
 * cuerpo; si existe, la fila va detras de su ultima fila de tabla.
 */
export function anadirCoste(body: string, fila: FilaCoste): string {
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const lineas = body.split(/\r?\n/);
  const rango = rangoDeSeccion(lineas, SECCION_COSTE);

  if (rango === null) {
    const base = body.replace(/(\r?\n)*$/, '');
    const separacion = base === '' ? '' : eol + eol;
    return base + separacion + [SECCION_COSTE, '', CABECERA_COSTE, SEPARADOR, filaATexto(fila)].join(eol) + eol;
  }

  const [inicio, fin] = rango;
  const enBloque = dentroDeBloque(lineas);
  let ultimaTabla = -1;
  for (let i = inicio + 1; i < fin; i++) {
    if (!enBloque[i] && (lineas[i] as string).trimStart().startsWith('|')) ultimaTabla = i;
  }
  const nuevas =
    ultimaTabla === -1
      ? // Seccion sin tabla (editada a mano): la tabla va justo bajo el titulo.
        [...lineas.slice(0, inicio + 1), '', CABECERA_COSTE, SEPARADOR, filaATexto(fila), ...lineas.slice(inicio + 1)]
      : [...lineas.slice(0, ultimaTabla + 1), filaATexto(fila), ...lineas.slice(ultimaTabla + 1)];
  return nuevas.join(eol);
}

const ENTERO_RE = /^\d+$/;

/** Celda numerica: entero >= 0, `-` (sin dato) o undefined si no es valida. */
function leerNumero(c: string): number | null | undefined {
  if (c === SIN_DATO) return null;
  if (!ENTERO_RE.test(c)) return undefined;
  const n = Number(c);
  return Number.isSafeInteger(n) ? n : undefined;
}

/**
 * Filas validas del desglose, en orden. Las que no casan (cabecera,
 * separador, filas editadas a mano con valores raros) se ignoran.
 */
export function leerCostes(body: string): FilaCoste[] {
  const lineas = body.split(/\r?\n/);
  const rango = rangoDeSeccion(lineas, SECCION_COSTE);
  if (rango === null) return [];
  const enBloque = dentroDeBloque(lineas);
  const filas: FilaCoste[] = [];
  for (let i = rango[0] + 1; i < rango[1]; i++) {
    if (enBloque[i]) continue;
    const celdas = (lineas[i] as string)
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
    if (celdas.length !== COLUMNAS) continue;
    const [fecha, fase, fuente, ...numeros] = celdas as [string, string, string, ...string[]];
    if (precisionDeFecha(fecha) === null) continue;
    if (!(FASES_COSTE as readonly string[]).includes(fase)) continue;
    if (fuente === '') continue;
    const valores = numeros.map(leerNumero);
    if (valores.some((v) => v === undefined)) continue;
    const [entrada, cacheEscritura, cacheLectura, salida, lecturas, total] = valores as (number | null)[];
    if (total === null || total === undefined) continue;
    filas.push({
      fecha,
      fase: fase as FaseCoste,
      fuente,
      entrada: entrada ?? null,
      cacheEscritura: cacheEscritura ?? null,
      cacheLectura: cacheLectura ?? null,
      salida: salida ?? null,
      lecturas: lecturas ?? null,
      total,
    });
  }
  return filas;
}
