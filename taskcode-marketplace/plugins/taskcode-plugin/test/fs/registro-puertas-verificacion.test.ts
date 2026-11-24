/**
 * TASK-138b (A4): anotarVerificacion, la decision comun de las puertas de
 * verificacion (finish, review, la suite y verificar-lote): omitido si salio
 * del memo, si no verde o rojo, con su duracion. Contra un repo Git real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { anotarVerificacion, leerRegistroPuertas } from '../../src/fs/registro-puertas.js';

test('anotarVerificacion: omitido con memo, verde y rojo, con la duracion desde el inicio', async () => {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-puertas-'));
  try {
    assert.equal(spawnSync('git', ['init', '-q'], { cwd: raiz }).status, 0);
    const inicioMs = Date.now() - 2000;
    anotarVerificacion(raiz, { puerta: 'finish', tarea: 'TASK-1', modo: 'completa', inicioMs, estado: 'verde', deMemo: true });
    anotarVerificacion(raiz, { puerta: 'review', tarea: 'TASK-1', modo: 'selectiva', inicioMs, estado: 'verde' });
    anotarVerificacion(raiz, { puerta: 'finish', tarea: 'TASK-1', modo: 'lote', inicioMs, estado: 'roja' });
    const lineas = leerRegistroPuertas(raiz);
    assert.deepEqual(lineas.map((l) => [l.puerta, l.modo, l.resultado]), [
      ['finish', 'completa', 'omitido'],
      ['review', 'selectiva', 'verde'],
      ['finish', 'lote', 'rojo'],
    ]);
    for (const l of lineas) assert.ok(l.duracionS >= 2 && l.duracionS < 60, String(l.duracionS));
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
});
