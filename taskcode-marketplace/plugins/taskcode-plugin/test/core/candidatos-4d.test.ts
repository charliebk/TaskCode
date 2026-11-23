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

test('IMP-1: 5000 existentes x 100 nuevas sin parecido se resuelve en menos de 1,5 s (indice por longitud)', () => {
  const existentes = Array.from({ length: 5000 }, (_, i) => ({
    nombre: `existente${String(i)}Calcula${'x'.repeat(i % 17)}`,
    fichero: `src/e${String(i % 50)}.ts`,
    linea: i,
  }));
  const diff = diffCon(
    'src/nuevo.ts',
    Array.from({ length: 100 }, (_, i) => `export function nuevaPieza${String(i)}${'q'.repeat(i % 11)}() {`)
  );
  const t0 = performance.now();
  const c = candidatos4D(diff, '', existentes);
  const ms = performance.now() - t0;
  assert.ok(ms < 1500, `tardo ${ms.toFixed(0)} ms`);
  assert.equal(c.totalDuplicados, 0);
});

test('MENOR-3 y topes: mas de 15 candidatos o de 3 parecidos se cuentan con «y N mas»', () => {
  const existentes = Array.from({ length: 5 }, (_, i) => ({ nombre: 'leerSeccionTarea', fichero: `src/x${String(i)}.ts`, linea: 1 }));
  const diff = diffCon(
    'src/n.ts',
    Array.from({ length: 20 }, (_, i) => `export function leerSeccionTarea${String.fromCharCode(97 + i)}() {`)
  );
  const c = candidatos4D(diff, '', existentes);
  assert.equal(c.duplicados.length, 15);
  assert.equal(c.totalDuplicados, 20);
  const s = seccionCandidatos4D(c);
  assert.match(s, /- \.\.\. y 5 mas \(tope 15\)/);
  assert.match(s, / y 2 mas\n/, 'cada candidato muestra 3 parecidos y cuenta el resto');

  const muchosTests = diffCon(
    'test/a.test.ts',
    Array.from({ length: 18 }, (_, i) => `test('caso ${String(i)}: nunca borra nada', () => {});`)
  );
  const t = candidatos4D('', muchosTests, []);
  assert.equal(t.testsAMutar.length, 15);
  assert.equal(t.totalTests, 18);
  assert.match(seccionCandidatos4D(t), /- \.\.\. y 3 mas \(tope 15\)/);
});

test('MENOR-2: las nuevas parecidas entre si salen en su propio grupo', () => {
  const diff = diffCon('src/a.ts', ['export function leerSeccionTareas() {', 'export function leerSeccionTareaB() {', 'export function otraCosaDistinta() {']);
  const c = candidatos4D(diff, '', []);
  assert.deepEqual(c.entreNuevas.map(([a, b]) => `${a.nombre}~${b.nombre}`), ['leerSeccionTareaB~leerSeccionTareas']);
  assert.match(seccionCandidatos4D(c), /### Posible duplicacion dentro de la tarea/);
});

test('MENOR-5: lineas de contexto, normalizacion, umbral, longitud minima, extension y promesas en ingles', () => {
  const conContexto =
    'diff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -1,3 +1,5 @@\n' +
    ' const a = 1;\n const b = 2;\n+export function nuevaFuncion() {\n const c = 3;\n+function ab() {\n';
  assert.deepEqual(definicionesNuevas(conContexto).map((d) => `${String(d.linea)}:${d.nombre}`), ['3:nuevaFuncion']);
  assert.equal(nombresParecidos('$dollarValue', 'dollarValue'), true);
  assert.equal(nombresParecidos('normalizar-rama', 'normalizar_rama'), true);
  assert.equal(nombresParecidos('leerSeccionTarea', 'leerSeccionTareasXY'), true, 'distancia 3 con 16 letras entra');
  assert.equal(nombresParecidos('leerSeccionTarea', 'leerOtraCosaTarea'), false);
  assert.deepEqual(definicionesDeGrep('docs/a.md:3:function noEsCodigo() {\nsrc/b.ts:4:function siEsCodigo() {\n').map((d) => d.nombre), ['siEsCodigo']);
  const ingles = testsQuePrometen(diffCon('test/a.test.ts', ["it('never writes outside the repo', () => {", "it('adds numbers', () => {"]));
  assert.deepEqual(ingles.map((t) => t.nombre), ['never writes outside the repo']);
});
