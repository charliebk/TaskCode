/**
 * TASK-167b: duplicados por cuerpo. Funcion pura: lineas y definiciones de
 * entrada, pares de salida.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cuerpoDesde, duplicadosPorCuerpo, MIN_TOKENS, seccionDuplicadosPorCuerpo, tokensNormalizados } from '../../src/core/duplicados-cuerpo.js';
import type { Definicion } from '../../src/core/candidatos-4d.js';

const ORIGINAL = [
  'export function leerSeccion(texto: string, titulo: string): string[] {',
  '  const lineas = texto.split(/\\r?\\n/); // partir',
  '  const inicio = lineas.findIndex((l) => l.trim() === titulo);',
  '  if (inicio === -1) return [];',
  '  const fin = lineas.findIndex((l, i) => i > inicio && l.startsWith("## "));',
  '  return lineas.slice(inicio + 1, fin === -1 ? lineas.length : fin).filter((l) => l.trim() !== "");',
  '}',
];
// La misma logica con otros nombres, otro literal y un comentario de mas.
const COPIA = [
  'function seccionDe(md: string, cabecera: string): string[] {',
  '  /* copia */ const ls = md.split(/\\r?\\n/);',
  '  const desde = ls.findIndex((x) => x.trim() === cabecera);',
  '  if (desde === -1) return [];',
  '  const hasta = ls.findIndex((x, j) => j > desde && x.startsWith("### "));',
  '  return ls.slice(desde + 1, hasta === -1 ? ls.length : hasta).filter((x) => x.trim() !== "");',
  '}',
];
// Otra cosa: mismo tamano aproximado, logica distinta.
const DISTINTA = [
  'function sumarPares(valores: number[], limite: number): number {',
  '  let total = 0;',
  '  for (const v of valores) {',
  '    if (v % 2 === 0 && v < limite) total += v * 2;',
  '    else if (v > limite) break;',
  '  }',
  '  return Math.round(total / Math.max(valores.length, 1));',
  '}',
];

const def = (nombre: string, fichero: string, linea = 1): Definicion => ({ nombre, fichero, linea });
const con = (d: Definicion, lineas: string[]) => ({ def: d, cuerpo: cuerpoDesde(lineas, 1) });

test('TASK-167b: una copia renombrada se detecta; una funcion distinta, no; ni una consigo misma', () => {
  const nueva = con(def('seccionDe', 'src/nuevo.ts'), COPIA);
  const pares = duplicadosPorCuerpo([nueva], [con(def('leerSeccion', 'src/viejo.ts'), ORIGINAL), con(def('sumarPares', 'src/otro.ts'), DISTINTA)]);
  assert.equal(pares.length, 1, JSON.stringify(pares));
  assert.equal(pares[0]?.otra.nombre, 'leerSeccion');
  assert.ok((pares[0]?.parecido ?? 0) >= 0.85);
  // Misma funcion cambiada (mismo fichero y nombre): no es duplicado de si misma.
  assert.deepEqual(duplicadosPorCuerpo([con(def('leerSeccion', 'src/viejo.ts'), COPIA)], [con(def('leerSeccion', 'src/viejo.ts'), ORIGINAL)]), []);
  // Entre nuevas tambien.
  assert.equal(duplicadosPorCuerpo([nueva, con(def('leerSeccion', 'src/otro-nuevo.ts'), ORIGINAL)], []).length, 1);
  const seccion = seccionDuplicadosPorCuerpo(pares);
  assert.match(seccion, /### Posible duplicacion por cuerpo/);
  assert.match(seccion, /`seccionDe` \(src\/nuevo\.ts:1\) ~ `leerSeccion` \(src\/viejo\.ts:1\): \d+ %/);
  assert.equal(seccionDuplicadosPorCuerpo([]), '');
});

test('TASK-167b: el cuerpo se corta en su llave de cierre o por sangria, y por debajo del minimo de tokens no cuenta', () => {
  const fichero = [...ORIGINAL, 'const despues = 1;'];
  assert.equal(cuerpoDesde(fichero, 1).split('\n').length, ORIGINAL.length, 'se pasa de la llave de cierre');
  const python = ['def sumar(a, b):', '    total = a + b', '    return total', 'x = sumar(1, 2)'];
  assert.equal(cuerpoDesde(python, 1).split('\n').length, 3, 'Python: corta al volver a la sangria');
  // Una llave dentro de una cadena no cierra el cuerpo.
  assert.equal(cuerpoDesde(['function f() {', '  const s = "}";', '  return s;', '}', 'otra();'], 1).split('\n').length, 4);
  const corto = ['function id(x) { return x; }'];
  assert.ok(tokensNormalizados(corto[0] as string).length < MIN_TOKENS);
  assert.deepEqual(duplicadosPorCuerpo([con(def('id', 'a.ts'), corto)], [con(def('ident', 'b.ts'), corto)]), []);
});
