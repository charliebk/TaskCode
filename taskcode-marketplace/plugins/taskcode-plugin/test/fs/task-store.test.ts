import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  listExistingTaskIds,
  writeTareaFile,
  readTareaFile,
  TaskAlreadyExistsError,
} from '../../src/fs/task-store.js';
import { InvalidTaskIdError } from '../../src/core/task.js';
import type { Task } from '../../src/core/task.js';

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-001',
    titulo: 'Tarea de prueba',
    tipo: 'feature',
    sprint: 0,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-001-prueba',
    asignado_a: null,
    agente_revisor: 'typescript-reviewer',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-03',
    actualizado: '2026-09-03',
    dependencias: [],
    ...overrides,
  };
}

async function withTempRoot(fn: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-store-'));
  try {
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('listExistingTaskIds: [] si tareas/ ni siquiera existe todavia', async () => {
  await withTempRoot(async (root) => {
    const ids = await listExistingTaskIds(path.join(root, 'no-existe'));
    assert.deepEqual(ids, []);
  });
});

test('writeTareaFile + readTareaFile: escribe en la carpeta de su estado y se puede releer', async () => {
  await withTempRoot(async (root) => {
    const task = sampleTask({ id: 'TASK-007', estado: 'en-curso' });
    const filePath = await writeTareaFile(root, task, '## Objetivo\nHacer algo.\n');
    assert.match(filePath, /02-en-curso[/\\]TASK-007[/\\]tarea\.md$/);

    const read = await readTareaFile(root, 'TASK-007');
    assert.ok(read !== null);
    assert.deepEqual(read?.task, task);
    assert.match(read?.body ?? '', /Hacer algo\./);
  });
});

test('readTareaFile: null si el ID no existe en ninguna carpeta', async () => {
  await withTempRoot(async (root) => {
    const read = await readTareaFile(root, 'TASK-999');
    assert.equal(read, null);
  });
});

test('listExistingTaskIds: agrega ids repartidos en varias carpetas de estado', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask({ id: 'TASK-001', estado: 'planificada' }), '');
    await writeTareaFile(root, sampleTask({ id: 'TASK-002', estado: 'en-curso' }), '');
    await writeTareaFile(root, sampleTask({ id: 'TASK-003', estado: 'terminada' }), '');
    const ids = await listExistingTaskIds(root);
    assert.deepEqual([...ids].sort(), ['TASK-001', 'TASK-002', 'TASK-003']);
  });
});


// --- Regresion: hallazgos de revision por pares (Sprint 0) ---------------

test('readTareaFile: rechaza un id con path traversal antes de tocar el filesystem', async () => {
  await withTempRoot(async (root) => {
    await assert.rejects(
      () => readTareaFile(root, '../../../etc'),
      InvalidTaskIdError
    );
  });
});

test('writeTareaFile: rechaza un id con path traversal antes de tocar el filesystem', async () => {
  await withTempRoot(async (root) => {
    const task = sampleTask({ id: '../../../evil' as unknown as string });
    await assert.rejects(() => writeTareaFile(root, task, ''), InvalidTaskIdError);
  });
});

test('writeTareaFile con failIfExists: la segunda escritura al mismo id falla en vez de pisar la primera', async () => {
  await withTempRoot(async (root) => {
    const original = sampleTask({ id: 'TASK-042', titulo: 'Original' });
    await writeTareaFile(root, original, '', { failIfExists: true });

    const segunda = sampleTask({ id: 'TASK-042', titulo: 'Pisando la original' });
    await assert.rejects(
      () => writeTareaFile(root, segunda, '', { failIfExists: true }),
      TaskAlreadyExistsError
    );

    const read = await readTareaFile(root, 'TASK-042');
    assert.equal(read?.task.titulo, 'Original');
  });
});

test('writeTareaFile sin failIfExists (comportamiento por defecto) SI permite actualizar una tarea existente', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask({ id: 'TASK-050', titulo: 'v1' }), '');
    await writeTareaFile(root, sampleTask({ id: 'TASK-050', titulo: 'v2' }), '');
    const read = await readTareaFile(root, 'TASK-050');
    assert.equal(read?.task.titulo, 'v2');
  });
});
