import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esIdReservado, nextReservedTaskId, nextTaskId, TaskIdError } from '../../src/core/task-id.js';

test('nextTaskId: max + 1, huecos, ids invalidos, relleno a 3 digitos, rango reservado (TASK-067)', () => {
  // TASK-001 si no hay tareas previas
  assert.equal(nextTaskId([]), 'TASK-001', 'sin tareas');
  assert.equal(nextTaskId(['TASK-003', 'TASK-001', 'TASK-002']), 'TASK-004', 'max + 1, sin importar el orden');
  assert.equal(nextTaskId(['TASK-001', 'TASK-014', 'TASK-002']), 'TASK-015', 'maximo real aunque haya huecos');
  assert.equal(nextTaskId(['TASK-001', 'no-es-un-id', 'TASK-007']), 'TASK-008', 'ignora ids invalidos');
  assert.equal(nextTaskId(['TASK-999']), 'TASK-1000', 'relleno a 3 digitos hasta 999, luego crece');
  // nunca colisiona con ids repartidos en varias "carpetas" simuladas
  const enVariasCarpetas = ['TASK-001', 'TASK-002'].concat(['TASK-005'], ['TASK-003']);
  const next = nextTaskId(enVariasCarpetas);
  assert.equal(next, 'TASK-006');
  assert.ok(!enVariasCarpetas.includes(next));
  // TASK-067: ignora el rango reservado
  assert.equal(nextTaskId(['TASK-065', 'TASK-9999']), 'TASK-066');
  assert.equal(nextTaskId(['TASK-9000', 'TASK-9500', 'TASK-10000']), 'TASK-001');
  // llegar al rango reservado aborta con un mensaje claro
  assert.equal(nextTaskId(['TASK-8998']), 'TASK-8999');
  assert.throws(() => nextTaskId(['TASK-8999']), (e: unknown) => e instanceof TaskIdError && /rango reservado/.test(e.message));
});

test('esIdReservado: desde TASK-9000', () => {
  assert.equal(esIdReservado('TASK-8999'), false);
  assert.equal(esIdReservado('TASK-9000'), true);
  assert.equal(esIdReservado('TASK-9999'), true);
  assert.equal(esIdReservado('no-es-id'), false);
});

test('nextReservedTaskId: empieza en 9999, baja del minimo ocupado, ramas vivas y rango agotado', () => {
  assert.equal(nextReservedTaskId([]), 'TASK-9999');
  assert.equal(nextReservedTaskId(['TASK-065']), 'TASK-9999');
  assert.equal(nextReservedTaskId(['TASK-9999']), 'TASK-9998');
  assert.equal(nextReservedTaskId(['TASK-9999', 'TASK-9998', 'TASK-9997']), 'TASK-9996');
  // baja desde el MINIMO ocupado, con huecos arriba
  assert.equal(nextReservedTaskId(['TASK-9999', 'TASK-9990']), 'TASK-9989');
  // una rama viva ocupa el ID aunque su carpeta se haya borrado
  assert.equal(nextReservedTaskId([], ['feature/task-9999-algo']), 'TASK-9998');
  assert.equal(nextReservedTaskId(['TASK-9998'], ['fix/task-9999-x', 'develop', 'main']), 'TASK-9997');
  assert.equal(nextReservedTaskId([], ['feature/task-9999']), 'TASK-9998');
  // El numero tiene que ser el de la tarea, no un trozo del slug.
  assert.equal(nextReservedTaskId([], ['feature/task-065-arregla-task-9999']), 'TASK-9999');
  // un ID mayor que 9999 no cuenta; el rango agotado aborta
  assert.equal(nextReservedTaskId(['TASK-10000']), 'TASK-9999');
  assert.equal(nextReservedTaskId(['TASK-9001']), 'TASK-9000');
  assert.throws(() => nextReservedTaskId(['TASK-9000']), (e: unknown) => e instanceof TaskIdError && /agotado/.test(e.message));
  assert.throws(() => nextReservedTaskId([], ['feature/task-9000-x']), TaskIdError);
});
