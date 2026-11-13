/**
 * TASK-129: freno al crecimiento de la suite. Puro, sin disco.
 *
 * - `contarTests`: el numero de tests que dice la salida de la verificacion
 *   completa, para los runners comunes; null si no se reconoce (sin dato,
 *   nunca un numero inventado).
 * - `suitePorVersion`: por version de cierre, el mayor numero de tests visto y
 *   la mediana de la duracion de la completa en verde, de las lineas `suite`
 *   del registro de puertas.
 * - `avisoCrecimiento`: entre las dos ultimas versiones con dato, si los tests
 *   o la duracion crecieron mas que el umbral.
 */
import type { LineaPuerta } from './registro-puertas.js';
import { compararVersiones } from './version.js';

/** TASK-129: la puerta con el tamano de la completa: modo = numero de tests (o `-`). */
export const PUERTA_SUITE = 'suite';

function sumar(texto: string, re: RegExp): number | null {
  let total: number | null = null;
  for (const m of texto.matchAll(re)) total = (total ?? 0) + Number(m[1]) + (m[2] === undefined ? 0 : Number(m[2]));
  return total;
}

function ultimo(texto: string, re: RegExp): number | null {
  let n: number | null = null;
  for (const m of texto.matchAll(re)) n = Number(m[1]);
  return n;
}

/**
 * Numero de tests de la salida de un runner. Reconoce, por este orden:
 * node --test (`ℹ tests N` / `# tests N`), Jest/Vitest (`Tests: … N total`),
 * dotnet (`Total tests: N`), Maven/Surefire (ultimo `Tests run: N`), cargo
 * (suma de `test result: … N passed; M failed`) y pytest (`N passed, M failed`).
 *
 * IMP-2 (revision TASK-129): con `recortada` (solo se tiene el final de la
 * salida), los runners que suman resumenes repartidos por la salida (cargo con
 * varios crates, Maven multimodulo) darian una cifra a la baja: null (sin
 * dato). Los que dejan el total al final (node, Jest, dotnet, pytest, y Maven
 * de un solo modulo, cuyo ultimo `Tests run:` es el total) valen. IMP-3: el
 * multimodulo se reconoce por su `Reactor Summary`, que va al final.
 */
export function contarTests(salida: string, opciones: { recortada?: boolean } = {}): number | null {
  const t = salida.replace(/\x1b\[[0-9;]*m/g, '');
  const node = ultimo(t, /^\s*(?:ℹ|#)\s+tests\s+(\d+)\s*$/gm);
  if (node !== null) return node;
  const jest = ultimo(t, /^\s*Tests:\s+.*?(\d+)\s+total\s*$/gm);
  if (jest !== null) return jest;
  const dotnet = ultimo(t, /Total tests:\s*(\d+)/g);
  if (dotnet !== null) return dotnet;
  const pytestFinal = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
  const maven = ultimo(t, /Tests run:\s*(\d+)/g);
  if (maven !== null) return opciones.recortada === true && /Reactor Summary/.test(t) ? null : maven;
  if (opciones.recortada === true && pytestFinal === null) return null;
  const cargo = sumar(t, /test result: \w+\.\s+(\d+) passed;\s+(\d+) failed/g);
  if (cargo !== null) return cargo;
  const pytest = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
  if (pytest !== null) return Number(pytest[2]) + (pytest[1] === undefined ? 0 : Number(pytest[1]));
  return null;
}

export interface SuiteVersion {
  version: string;
  /** Mayor numero de tests visto en las tareas de esa version; null sin dato. */
  tests: number | null;
  /** Mediana de la duracion (s) de la completa en verde; null sin dato. */
  completaS: number | null;
}

function mediana(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 === 1 ? (o[m] as number) : ((o[m - 1] as number) + (o[m] as number)) / 2;
}

/** Por version (orden semver), de las lineas `suite` en verde de las tareas de cada version. */
export function suitePorVersion(
  tareas: readonly { id: string; version: string | null }[],
  lineas: readonly LineaPuerta[]
): SuiteVersion[] {
  const versionDe = new Map(tareas.filter((t) => t.version !== null).map((t) => [t.id, t.version as string]));
  const tests = new Map<string, number[]>();
  const duraciones = new Map<string, number[]>();
  for (const l of lineas) {
    if (l.puerta !== PUERTA_SUITE || l.resultado !== 'verde') continue;
    const v = versionDe.get(l.tarea);
    if (v === undefined) continue;
    duraciones.set(v, [...(duraciones.get(v) ?? []), l.duracionS]);
    if (/^\d+$/.test(l.modo)) tests.set(v, [...(tests.get(v) ?? []), Number(l.modo)]);
  }
  return [...new Set([...tests.keys(), ...duraciones.keys()])].sort(compararVersiones).map((version) => ({
    version,
    tests: tests.has(version) ? Math.max(...(tests.get(version) as number[])) : null,
    completaS: mediana(duraciones.get(version) ?? []),
  }));
}

/**
 * El aviso si, entre las dos ultimas versiones con dato de cada magnitud, los
 * tests o la duracion de la completa crecieron mas de `umbralPct`. null sin
 * datos suficientes o sin crecimiento: ni avisa ni falla.
 */
export function avisoCrecimiento(versiones: readonly SuiteVersion[], umbralPct: number): string | null {
  const partes: string[] = [];
  const comparar = (nombre: string, sel: (v: SuiteVersion) => number | null, fmt: (n: number) => string): void => {
    const con = versiones.filter((v) => sel(v) !== null);
    if (con.length < 2) return;
    const a = con[con.length - 2] as SuiteVersion;
    const b = con[con.length - 1] as SuiteVersion;
    const va = sel(a) as number;
    const vb = sel(b) as number;
    if (va <= 0) return;
    const pct = ((vb - va) / va) * 100;
    if (pct > umbralPct) {
      partes.push(`${nombre} ${fmt(va)} en ${a.version} -> ${fmt(vb)} en ${b.version} (+${String(Math.round(pct))} %)`);
    }
  };
  comparar('tests', (v) => v.tests, (n) => String(n));
  comparar('duracion de la completa', (v) => v.completaS, (n) => `${String(Math.round(n))} s`);
  return partes.length === 0 ? null : `la suite crecio mas del ${String(umbralPct)} %: ${partes.join('; ')}`;
}
