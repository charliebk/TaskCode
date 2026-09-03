import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  parseNewTaskArgs,
  buildNewTask,
  slugify,
  runNewCommand,
  NewTaskArgError,
} from '../../src/commands/new.js';

test('parseNewTaskArgs: titulo por --titulo o posicional, defaults razonables', () => {
  const a = parseNewTaskArgs(['--titulo', 'Mi tarea', '--tipo', 'feature']);
  assert.equal(a.titulo, 'Mi tarea');
  assert.equal(a.tipo, 'feature');
  assert.equal(a.sprint, 0);
  assert.equal(a.complejidad, 'media');
  assert.deepEqual(a.etiquetas, []);

  const b = parseNewTaskArgs(['Otra tarea', '--tipo', 'fix']);
  assert.equal(b.titulo, 'Otra tarea');
});

test('parseNewTaskArgs: falla sin titulo', () => {
  assert.throws(() => parseNewTaskArgs(['--tipo', 'feature']), NewTaskArgError);
});

test('parseNewTaskArgs: falla sin --tipo', () => {
  assert.throws(() => parseNewTaskArgs(['--titulo', 'x']), NewTaskArgError);
});

test('parseNewTaskArgs: falla con --tipo invalido', () => {
  assert.throws(
    () => parseNewTaskArgs(['--titulo', 'x', '--tipo', 'chore']),
    NewTaskArgError
  );
});

test('parseNewTaskArgs: falla con --complejidad invalida', () => {
  assert.throws(
    () => parseNewTaskArgs(['--titulo', 'x', '--tipo', 'fix', '--complejidad', 'imposible']),
    NewTaskArgError
  );
});

test('parseNewTaskArgs: falla con --sprint no numerico', () => {
  assert.throws(
    () => parseNewTaskArgs(['--titulo', 'x', '--tipo', 'fix', '--sprint', 'dos']),
    NewTaskArgError
  );
});

test('parseNewTaskArgs: --etiquetas separadas por coma, con espacios', () => {
  const a = parseNewTaskArgs([
    '--titulo', 'x', '--tipo', 'feature', '--etiquetas', 'ifc, importador ,validacion',
  ]);
  assert.deepEqual(a.etiquetas, ['ifc', 'importador', 'validacion']);
});

test('slugify: normaliza tildes, minusculas y separadores', () => {
  assert.equal(slugify('Añadir validación de espesor'), 'anadir-validacion-de-espesor');
  assert.equal(slugify('  Con   espacios   raros  '), 'con-espacios-raros');
});

test('slugify: nunca devuelve vacio (fallback si el titulo no tiene ASCII alfanumerico)', () => {
  assert.equal(slugify('日本語のタスク'), 'tarea');
  assert.equal(slugify('!!!???'), 'tarea');
});

test('slugify: un titulo largo no deja un guion colgante tras cortar a 40 caracteres', () => {
  // Construido para que el caracter 40 caiga justo despues de un separador.
  const titulo = 'a'.repeat(39) + ' b';
  const slug = slugify(titulo);
  assert.ok(!slug.endsWith('-'), `no deberia terminar en "-": "${slug}"`);
});

test('buildNewTask: construye una tarea planificada valida con rama derivada del slug', () => {
  const task = buildNewTask(
    'TASK-005',
    {
      titulo: 'Revisar formato de fechas',
      tipo: 'fix',
      sprint: 2,
      etiquetas: ['fechas'],
      complejidad: 'simple',
      modeloSugerido: 'haiku',
      agenteRevisor: 'typescript-reviewer',
    },
    '2026-09-03'
  );
  assert.equal(task.id, 'TASK-005');
  assert.equal(task.estado, 'planificada');
  assert.equal(task.plan_aprobado, false);
  assert.equal(task.rama, 'fix/task-005-revisar-formato-de-fechas');
  assert.equal(task.creado, '2026-09-03');
  assert.equal(task.actualizado, '2026-09-03');
});

// --- integracion con disco (directorio temporal) --------------------------

async function withTempTareasRoot(fn: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-new-'));
  try {
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('runNewCommand: crea tareas/00-planificadas/TASK-001/tarea.md desde cero', async () => {
  await withTempTareasRoot(async (root) => {
    const result = await runNewCommand(
      root,
      ['--titulo', 'Primera tarea', '--tipo', 'feature'],
      '2026-09-03'
    );
    assert.equal(result.id, 'TASK-001');
    const content = await readFile(result.filePath, 'utf8');
    assert.match(content, /id: TASK-001/);
    assert.match(content, /estado: planificada/);
  });
});

test('runNewCommand: IDs consecutivos sin colision al crear varias tareas seguidas', async () => {
  await withTempTareasRoot(async (root) => {
    const r1 = await runNewCommand(root, ['--titulo', 'Uno', '--tipo', 'feature'], '2026-09-03');
    const r2 = await runNewCommand(root, ['--titulo', 'Dos', '--tipo', 'fix'], '2026-09-03');
    const r3 = await runNewCommand(root, ['--titulo', 'Tres', '--tipo', 'hotfix'], '2026-09-03');
    assert.deepEqual([r1.id, r2.id, r3.id], ['TASK-001', 'TASK-002', 'TASK-003']);
  });
});

test('runNewCommand: sin --tipo no crea ningun fichero', async () => {
  await withTempTareasRoot(async (root) => {
    await assert.rejects(
      () => runNewCommand(root, ['--titulo', 'Sin tipo'], '2026-09-03'),
      NewTaskArgError
    );
    const ids = await import('../../src/fs/task-store.js').then((m) =>
      m.listExistingTaskIds(root)
    );
    assert.deepEqual(ids, []);
  });
});
