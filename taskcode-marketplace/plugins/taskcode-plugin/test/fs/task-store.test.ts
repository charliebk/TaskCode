import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  listExistingTaskIds,
  writeTareaFile,
  readTareaFile,
  moveTareaFile,
  TaskAlreadyExistsError,
  TaskFolderConflictError,
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


// --- moveTareaFile (TASK-009) ---------------------------------------------

test('moveTareaFile: cambia de carpeta cuando el estado cambia y borra la carpeta vieja', async () => {
  await withTempRoot(async (root) => {
    const original = sampleTask({ id: 'TASK-060', estado: 'en-diseno' });
    const filePath = await writeTareaFile(root, original, '## Objetivo\nAlgo.\n');

    const updated = { ...original, estado: 'en-curso' as const, actualizado: '2026-09-04' };
    const newFilePath = await moveTareaFile(root, filePath, updated, '## Objetivo\nAlgo.\n');

    assert.match(newFilePath, /02-en-curso[/\\]TASK-060[/\\]tarea\.md$/);

    const read = await readTareaFile(root, 'TASK-060');
    assert.ok(read !== null);
    assert.equal(read?.task.estado, 'en-curso');
    assert.equal(read?.task.actualizado, '2026-09-04');

    // La carpeta vieja (01-en-diseno/TASK-060) ya no debe contener nada.
    await assert.rejects(() => stat(path.dirname(filePath)));
  });
});

test('moveTareaFile: si el estado no cambia, solo reescribe el fichero en el mismo sitio', async () => {
  await withTempRoot(async (root) => {
    const original = sampleTask({ id: 'TASK-061', estado: 'en-curso', titulo: 'v1' });
    const filePath = await writeTareaFile(root, original, '');

    const updated = { ...original, titulo: 'v2' };
    const newFilePath = await moveTareaFile(root, filePath, updated, '');

    assert.equal(newFilePath, filePath);
    const read = await readTareaFile(root, 'TASK-061');
    assert.equal(read?.task.titulo, 'v2');
  });
});

test('moveTareaFile: falla con TaskFolderConflictError si la carpeta destino ya existe', async () => {
  await withTempRoot(async (root) => {
    const enDiseno = sampleTask({ id: 'TASK-062', estado: 'en-diseno' });
    const filePath = await writeTareaFile(root, enDiseno, '');
    // Carpeta destino ya ocupada por otra cosa (no deberia pasar en uso
    // normal, pero moveTareaFile debe negarse en vez de arriesgarse a
    // mezclar contenido).
    await writeTareaFile(root, sampleTask({ id: 'TASK-062', estado: 'en-curso', titulo: 'otra' }), '');

    const updated = { ...enDiseno, estado: 'en-curso' as const };
    await assert.rejects(
      () => moveTareaFile(root, filePath, updated, ''),
      TaskFolderConflictError
    );

    // La tarea original en 01-en-diseno sigue intacta (no se movio a medias).
    const stillThere = await stat(path.dirname(filePath));
    assert.ok(stillThere.isDirectory());
  });
});
