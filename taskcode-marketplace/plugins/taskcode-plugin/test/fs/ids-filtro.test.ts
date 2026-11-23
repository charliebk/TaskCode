/**
 * TASK-147b (MEN-4 de su revision): el filtro de ID de task-store, ahora con
 * isValidTaskId, deja fuera las carpetas que no son un ID (no llegan a rutas).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { listExistingTaskIds } from '../../src/fs/task-store.js';
import { STATE_FOLDER, compararIds } from '../../src/core/task.js';

test('listExistingTaskIds: solo las carpetas con un ID valido (con letra de parte), nunca el resto', async () => {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-ids-filtro-'));
  try {
    const nombres = ['TASK-001', 'TASK-002a', 'TASK-12', 'task-003', 'TASK-004A', 'notas', 'TASK-005-copia'];
    for (const n of nombres) await mkdir(path.join(raiz, STATE_FOLDER.planificada, n), { recursive: true });
    await mkdir(path.join(raiz, STATE_FOLDER.terminada, 'TASK-1000'), { recursive: true });
    const ids = await listExistingTaskIds(raiz);
    assert.deepEqual([...ids].sort(compararIds), ['TASK-001', 'TASK-002a', 'TASK-1000']);
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
});
