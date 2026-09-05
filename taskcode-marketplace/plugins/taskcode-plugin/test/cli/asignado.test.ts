/**
 * Tests de parseAsignadoAFlag (item B6). Modulo puro: no toca disco ni
 * Git, asi que aqui no hacen falta repos temporales: los tests reales
 * de punta a punta (que el frontmatter acaba con el valor escrito)
 * viven en plan.test.ts y start.test.ts, contra repos Git de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAsignadoAFlag,
  ASIGNADO_FLAG,
  ASIGNADO_FLAG_ALIAS,
} from '../../src/cli/asignado.js';

class FlagError extends Error {}
const fail = (m: string): Error => new FlagError(m);

// Comprueba que el error es el nuestro Y que dice lo que debe decir:
// un assert.throws a secas pasaria con cualquier excepcion, incluido
// un TypeError por haber roto la firma de la funcion.
function esFlagError(fragmento: string) {
  return (e: unknown): boolean =>
    e instanceof FlagError && (e as Error).message.includes(fragmento);
}

test('parseAsignadoAFlag: sin el flag devuelve undefined (que NO es null)', () => {
  assert.equal(parseAsignadoAFlag(['TASK-001'], fail), undefined);
  assert.equal(parseAsignadoAFlag([], fail), undefined);
});

test('parseAsignadoAFlag: --asignado-a con valor, en las dos formas y en cualquier posicion', () => {
  assert.equal(parseAsignadoAFlag(['TASK-001', '--asignado-a', 'carlos'], fail), 'carlos');
  assert.equal(parseAsignadoAFlag(['TASK-001', '--asignado-a=carlos'], fail), 'carlos');
  // El flag DELANTE del ID: el motivo por el que plan y start pasaron a
  // leer el ID de los posicionales en vez de argv[0].
  assert.equal(parseAsignadoAFlag(['--asignado-a', 'carlos', 'TASK-001'], fail), 'carlos');
});

test('parseAsignadoAFlag: acepta el alias --asignado_a de taskctl board', () => {
  // Sin este alias, un "taskctl plan TASK-001 --asignado_a carlos" saldria
  // con codigo 0 SIN asignar a nadie: parseArgs ignora en silencio los
  // flags que no conoce (divergencia documentada en HALLAZGOS.md).
  assert.equal(parseAsignadoAFlag(['TASK-001', '--asignado_a', 'carlos'], fail), 'carlos');
  assert.equal(parseAsignadoAFlag(['TASK-001', '--asignado_a=carlos'], fail), 'carlos');
});

test('parseAsignadoAFlag: los dos nombres a la vez es un error, no un ganador silencioso', () => {
  assert.throws(
    () => parseAsignadoAFlag(['TASK-001', '--asignado-a', 'ana', '--asignado_a', 'carlos'], fail),
    esFlagError('son el mismo flag')
  );
});

test('parseAsignadoAFlag: el flag suelto (sin valor) se rechaza en vez de asignar true', () => {
  assert.throws(() => parseAsignadoAFlag(['TASK-001', '--asignado-a'], fail), esFlagError('necesita un valor'));
  // Seguido de otro flag, parseArgs tampoco puede darle valor.
  assert.throws(
    () => parseAsignadoAFlag(['TASK-001', '--asignado-a', '--otro'], fail),
    esFlagError('necesita un valor')
  );
});

test('parseAsignadoAFlag: valor vacio o solo espacios se rechaza', () => {
  for (const argv of [['--asignado-a='], ['--asignado-a=   ']]) {
    assert.throws(() => parseAsignadoAFlag(argv, fail), esFlagError('no puede estar vacio'));
  }
});

test('parseAsignadoAFlag: recorta espacios alrededor del nombre', () => {
  assert.equal(parseAsignadoAFlag(['--asignado-a=  carlos  '], fail), 'carlos');
});

test('parseAsignadoAFlag: un salto de linea se rechaza (romperia el frontmatter)', () => {
  assert.throws(
    () => parseAsignadoAFlag(['--asignado-a=car\nlos'], fail),
    esFlagError('saltos de linea')
  );
});

test('parseAsignadoAFlag: un nombre que empieza por -- solo entra con la forma =', () => {
  // Documenta la via de escape que ya existia en parseArgs desde
  // Sprint 0, aplicada a este flag.
  assert.equal(parseAsignadoAFlag(['--asignado-a=--raro'], fail), '--raro');
});

test('los nombres de flag exportados son los que documenta la ayuda', () => {
  assert.equal(ASIGNADO_FLAG, 'asignado-a');
  assert.equal(ASIGNADO_FLAG_ALIAS, 'asignado_a');
});
