import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTaskId } from '../../src/core/task-id.js';

test('nextTaskId: TASK-001 si no hay tareas previas', () => {
  assert.equal(nextTaskId([]), 'TASK-001');
});

test('nextTaskId: max + 1, sin importar el orden de entrada', () => {
  assert.equal(nextTaskId(['TASK-003', 'TASK-001', 'TASK-002']), 'TASK-004');
});

test('nextTaskId: usa el maximo real aunque haya huecos', () => {
  assert.equal(nextTaskId(['TASK-001', 'TASK-014', 'TASK-002']), 'TASK-015');
});

test('nextTaskId: ignora ids invalidos y no revienta', () => {
  assert.equal(nextTaskId(['TASK-001', 'no-es-un-id', 'TASK-007']), 'TASK-008');
});

test('nextTaskId: mantiene relleno a 3 digitos hasta 999, luego crece', () => {
  assert.equal(nextTaskId(['TASK-999']), 'TASK-1000');
});

test('nextTaskId: nunca colisiona con ids repartidos en varias "carpetas" simuladas', () => {
  const enVariasCarpetas = ['TASK-001', 'TASK-002'].concat(['TASK-005'], ['TASK-003']);
  const next = nextTaskId(enVariasCarpetas);
  assert.equal(next, 'TASK-006');
  assert.ok(!enVariasCarpetas.includes(next));
});
