/**
 * TASK-153b: candidatos 4D desde el diff (puro, sin Git).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  candidatos4D,
  definicionesDeGrep,
  definicionesNuevas,
  nombresParecidos,
  seccionCandidatos4D,
  testsQuePrometen,
  SECCION_CANDIDATOS_4D,
} from '../../src/core/candidatos-4d.js';

/** Diff unificado minimo con las lineas dadas anadidas a `fichero` desde la linea 10. */
function diffCon(fichero: string, lineas: string[]): string {
  return (
    `diff --git a/${fichero} b/${fichero}\n--- a/${fichero}\n+++ b/${fichero}\n` +
    `@@ -9,1 +10,${String(lineas.length)} @@\n` +
    lineas.map((l) => `+${l}`).join('\n') +
    '\n'
  );
}

test('definicionesNuevas: saca funciones, clases y constantes-funcion de varios lenguajes con su linea', () => {
  const diff =
    diffCon('src/a.ts', [
      'export function leerSeccionX(t: string) {',
      '  const local = 1;',
      'export const parsearFlag = (a: string) => a;',
      'export class LectorDeIds {}',
    ]) +
    diffCon('src/b.rs', ['pub fn leer_seccion(t: &str) {}']) +
    diffCon('src/c.py', ['def leer_seccion_py(t):']) +
    diffCon('scripts/d.sh', ['normalizar_rama() {']) +
    diffCon('docs/e.md', ['function noEsCodigo() {']);
  const defs = definicionesNuevas(diff);
  assert.deepEqual(
    defs.map((d) => `${d.fichero}:${String(d.linea)}:${d.nombre}`),
    [
      'src/a.ts:10:leerSeccionX',
      'src/a.ts:12:parsearFlag',
      'src/a.ts:13:LectorDeIds',
      'src/b.rs:10:leer_seccion',
      'src/c.py:10:leer_seccion_py',
      'scripts/d.sh:10:normalizar_rama',
    ]
  );
});

test('candidatos4D: cruza las nuevas con las existentes por nombre igual o parecido, sin contarse a si mismas', () => {
  const grep =
    'develop:src/core/x.ts:42:export function leerSeccionY(t: string) {\n' +
    'develop:src/core/y.ts:7:export function totalmenteDistinto() {\n' +
    'develop:src/a.ts:10:export function leerSeccionX(t: string) {\n' +
    'develop:src/core/z.ts:3:export const parsear_flag = (a) => a;\n';
  const existentes = definicionesDeGrep(grep, 'develop');
  assert.equal(existentes.length, 4);
  const diff = diffCon('src/a.ts', ['export function leerSeccionX(t: string) {', 'export const parsearFlag = (a: string) => a;']);
  const c = candidatos4D(diff, '', existentes);
  const resumen = c.duplicados.map((d) => `${d.nueva.nombre} ~ ${d.existentes.map((e) => `${e.fichero}:${e.nombre}`).join(',')}`);
  assert.deepEqual(resumen, ['leerSeccionX ~ src/core/x.ts:leerSeccionY', 'parsearFlag ~ src/core/z.ts:parsear_flag']);
  assert.equal(nombresParecidos('leerSeccionX', 'totalmenteDistinto'), false);
  assert.equal(nombresParecidos('abc', 'abd'), false, 'nombres cortos no se emparejan por distancia');
});

test('testsQuePrometen y seccion: lista los tests con promesa comprobable y dice cuando no hay candidatos', () => {
  const diffTests = diffCon('test/a.test.ts', [
    "test('approve: rechaza el id, sin efectos secundarios', async () => {",
    "test('suma dos numeros', () => {",
    "  it(\"ordena por numero, no alfabeticamente\", () => {",
    'fn test_nunca_borra_la_rama() {',
  ]);
  const tests = testsQuePrometen(diffTests);
  assert.deepEqual(
    tests.map((t) => `${String(t.linea)}:${t.nombre}`),
    ['10:approve: rechaza el id, sin efectos secundarios', '12:ordena por numero, no alfabeticamente', '13:test nunca borra la rama']
  );
  const conTodo = seccionCandidatos4D(candidatos4D('', diffTests, []));
  assert.ok(conTodo.startsWith(`${SECCION_CANDIDATOS_4D}\n`));
  assert.match(conTodo, /### Tests a mutar/);
  assert.match(conTodo, /disfraz-tests\.md/);
  assert.doesNotMatch(conTodo, /### Posible duplicacion/);
  const vacia = seccionCandidatos4D(candidatos4D('', '', []));
  assert.match(vacia, /Sin candidatos/);
});
