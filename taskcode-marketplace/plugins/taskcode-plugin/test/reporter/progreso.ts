/**
 * Reporter de progreso de `node --test` (TASK-110), sin dependencias: va
 * JUNTO al `spec` (que sigue dando la salida de siempre y la tabla de
 * cobertura), por su propio destino, y dice cuantos tests van:
 *
 *   [120/1290]
 *
 * - Cuenta solo tests hoja: ni las suites (`describe`) ni los tests que tienen
 *   subtests. Un padre llega despues que sus hijos, asi que se reconoce porque
 *   en su fichero acaban de terminar tests un nivel por debajo.
 * - N es el total de la ejecucion ANTERIOR con los mismos ficheros, guardado
 *   bajo `.git/` (`dist/test` lo borra `limpiar:test` en cada `npm test`).
 *   Sin total anterior, `[x/?]`. Si esta vez hay mas, `[x/?]` tambien: nunca
 *   `[x/N]` con x > N.
 * - No reescribe la linea con `\r`: la salida acaba en logs y en la cola que lee
 *   el informe de verificacion. Imprime una linea cada 5 % (y la primera y la
 *   ultima); sin total, cada 50.
 * - Con TASKCTL_PROGRESO (el contador que recibe el comando de verificacion),
 *   escribe ahi su x/N, y la linea de estado lo muestra.
 * - Nunca cambia el codigo de salida ni oculta un fallo: no lanza, y los
 *   fallos los cuenta el `spec`.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { dirProgreso, escribirAtomico, VARIABLE_PROGRESO } from '../../src/fs/progreso.js';

const FICHERO_TOTAL = 'suite-total.json';
const VERSION_TOTAL = 1;
const CADA_SIN_TOTAL = 50;
const TRAMOS = 20;
const MS_ENTRE_CONTADORES = 500;

interface EventoTest {
  type: string;
  data?: { nesting?: number; file?: string; details?: { type?: string } };
}

/** La clave de esta ejecucion: el directorio y los patrones de ficheros (test y test:rapido no comparten total). */
export function claveDeEjecucion(cwd: string, argv: readonly string[]): string {
  return createHash('sha1').update([cwd, ...argv].join('\0')).digest('hex').slice(0, 16);
}

function rutaTotal(cwd: string): string | null {
  const d = dirProgreso(cwd);
  return d === null ? null : path.join(d, FICHERO_TOTAL);
}

function leerTotales(ruta: string | null): Record<string, number> {
  if (ruta === null) return {};
  try {
    const j = JSON.parse(readFileSync(ruta, 'utf8')) as { version?: unknown; totales?: unknown };
    if (j.version !== VERSION_TOTAL || typeof j.totales !== 'object' || j.totales === null) return {};
    return j.totales as Record<string, number>;
  } catch {
    return {};
  }
}

/** Cuenta tests hoja a partir de los eventos de fin (test:pass / test:fail). */
export class ContadorHojas {
  private readonly terminadosPorNivel = new Map<string, number[]>();
  hojas = 0;

  /** Devuelve true si el evento era una hoja (y la ha contado). */
  terminado(e: EventoTest): boolean {
    const nivel = e.data?.nesting ?? 0;
    const fichero = e.data?.file ?? '';
    const niveles = this.terminadosPorNivel.get(fichero) ?? [];
    this.terminadosPorNivel.set(fichero, niveles);
    const conHijos = (niveles[nivel + 1] ?? 0) > 0;
    niveles[nivel + 1] = 0;
    niveles[nivel] = (niveles[nivel] ?? 0) + 1;
    if (conHijos || e.data?.details?.type === 'suite') return false;
    this.hojas++;
    return true;
  }
}

/** Si toca imprimir la linea del test numero `x` de `n` (null: total desconocido). */
export function tocaLinea(x: number, n: number | null): boolean {
  if (x === 1) return true;
  if (n === null || x > n) return x % CADA_SIN_TOTAL === 0;
  return x === n || Math.floor((x * TRAMOS) / n) !== Math.floor(((x - 1) * TRAMOS) / n);
}

export function linea(x: number, n: number | null): string {
  return n === null || x > n ? `[${String(x)}/?]` : `[${String(x)}/${String(n)}]`;
}

export default async function* progreso(fuente: AsyncIterable<EventoTest>): AsyncGenerator<string> {
  const cwd = process.cwd();
  const clave = claveDeEjecucion(cwd, process.argv.slice(1));
  const ruta = rutaTotal(cwd);
  const totales = leerTotales(ruta);
  const anterior = typeof totales[clave] === 'number' && totales[clave] > 0 ? totales[clave] : null;
  const contador = process.env[VARIABLE_PROGRESO];
  const conteo = new ContadorHojas();
  let ultimoContador = 0;
  const escribirContador = (final: boolean): void => {
    if (contador === undefined || contador === '' || anterior === null) return;
    const ahora = Date.now();
    if (!final && ahora - ultimoContador < MS_ENTRE_CONTADORES) return;
    ultimoContador = ahora;
    const n = Math.max(anterior, conteo.hojas);
    escribirAtomico(contador, `${String(conteo.hojas)}/${String(final ? conteo.hojas : n)}\n`);
  };
  for await (const e of fuente) {
    if (e.type !== 'test:pass' && e.type !== 'test:fail') continue;
    if (!conteo.terminado(e)) continue;
    if (tocaLinea(conteo.hojas, anterior)) yield `${linea(conteo.hojas, anterior)}\n`;
    escribirContador(false);
  }
  escribirContador(true);
  yield `[progreso] ${String(conteo.hojas)} tests` +
    (anterior === null ? ' (sin total de una ejecucion anterior)' : ` (la anterior: ${String(anterior)})`) +
    '\n';
  if (ruta !== null && conteo.hojas > 0) {
    escribirAtomico(ruta, `${JSON.stringify({ version: VERSION_TOTAL, totales: { ...totales, [clave]: conteo.hojas } })}\n`);
  }
}
