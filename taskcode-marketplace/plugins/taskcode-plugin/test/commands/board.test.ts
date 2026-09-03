import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseBoardArgs, runBoardCommand, BoardCommandError } from '../../src/commands/board.js';
import { buildNewTask } from '../../src/commands/new.js';
import { writeTareaFile, moveTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { DEFAULT_BODY } from '../../src/commands/new.js';

test('parseBoardArgs: sin flags, sin filtros', () => {
  assert.deepEqual(parseBoardArgs([]), {});
});

test('parseBoardArgs: --sprint valido', () => {
  assert.deepEqual(parseBoardArgs(['--sprint', '2']), { sprint: 2 });
});

test('parseBoardArgs: --sprint invalido falla', () => {
  assert.throws(() => parseBoardArgs(['--sprint', 'dos']), BoardCommandError);
});

test('parseBoardArgs: --asignado_a valido', () => {
  assert.deepEqual(parseBoardArgs(['--asignado_a', 'charlie.bk']), { asignadoA: 'charlie.bk' });
});

test('parseBoardArgs: --asignado_a vacio falla', () => {
  assert.throws(() => parseBoardArgs(['--asignado_a', '']), BoardCommandError);
});

test('parseBoardArgs: --sprint y --asignado_a combinados', () => {
  assert.deepEqual(parseBoardArgs(['--sprint', '1', '--asignado_a', 'charlie.bk']), {
    sprint: 1,
    asignadoA: 'charlie.bk',
  });
});

// --- integracion con disco (board es de solo lectura: no necesita Git) --

async function withTareasRoot(fn: (tareasRoot: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-board-'));
  try {
    await fn(path.join(root, 'tareas'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('runBoardCommand: tareasRoot vacio -> board vacio, sin advertencias', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const result = await runBoardCommand(tareasRoot, []);
    assert.equal(result.totalTareas, 0);
    assert.equal(result.output, '');
    assert.deepEqual(result.advertencias, []);
  });
});

test('runBoardCommand: lista tareas de varios estados, agrupadas', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const t1 = buildNewTask('TASK-001', {
      titulo: 'Primera', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    await writeTareaFile(tareasRoot, t1, DEFAULT_BODY);

    const t2raw = buildNewTask('TASK-002', {
      titulo: 'Segunda', tipo: 'fix', sprint: 1, etiquetas: [],
      complejidad: 'simple', modeloSugerido: 'haiku', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const t2path = await writeTareaFile(tareasRoot, t2raw, DEFAULT_BODY);
    const t2 = { ...t2raw, estado: 'en-curso' as const, asignado_a: 'charlie.bk' };
    await moveTareaFile(tareasRoot, t2path, t2, DEFAULT_BODY);

    const result = await runBoardCommand(tareasRoot, []);
    assert.equal(result.totalTareas, 2);
    assert.match(result.output, /Planificadas/);
    assert.match(result.output, /En curso/);
    assert.match(result.output, /TASK-001/);
    assert.match(result.output, /TASK-002/);
  });
});

test('runBoardCommand: --sprint y --asignado_a filtran de punta a punta', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const a = buildNewTask('TASK-001', {
      titulo: 'De charlie, sprint 1', tipo: 'feature', sprint: 1, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const aPath = await writeTareaFile(tareasRoot, a, DEFAULT_BODY);
    await moveTareaFile(tareasRoot, aPath, { ...a, asignado_a: 'charlie.bk' }, DEFAULT_BODY);

    const b = buildNewTask('TASK-002', {
      titulo: 'De otra persona, sprint 1', tipo: 'feature', sprint: 1, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const bPath = await writeTareaFile(tareasRoot, b, DEFAULT_BODY);
    await moveTareaFile(tareasRoot, bPath, { ...b, asignado_a: 'otra.persona' }, DEFAULT_BODY);

    const c = buildNewTask('TASK-003', {
      titulo: 'De charlie, sprint 2', tipo: 'feature', sprint: 2, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const cPath = await writeTareaFile(tareasRoot, c, DEFAULT_BODY);
    await moveTareaFile(tareasRoot, cPath, { ...c, asignado_a: 'charlie.bk' }, DEFAULT_BODY);

    const result = await runBoardCommand(tareasRoot, ['--sprint', '1', '--asignado_a', 'charlie.bk']);
    assert.equal(result.totalTareas, 1);
    assert.match(result.output, /TASK-001/);
    assert.doesNotMatch(result.output, /TASK-002/);
    assert.doesNotMatch(result.output, /TASK-003/);
  });
});

test('runBoardCommand: una tarea existente con tarea.md corrupto se reporta como advertencia y no bloquea el board (mismo tratamiento que TASK-004)', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const buena = buildNewTask('TASK-001', {
      titulo: 'Tarea intacta', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    await writeTareaFile(tareasRoot, buena, DEFAULT_BODY);

    const rota = buildNewTask('TASK-002', {
      titulo: 'Tarea a corromper', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const rotaPath = await writeTareaFile(tareasRoot, rota, DEFAULT_BODY);
    const original = await readFile(rotaPath, 'utf8');
    await writeFile(rotaPath, original.replace('complejidad: media', 'complejidad media'), 'utf8');

    const result = await runBoardCommand(tareasRoot, []);
    assert.equal(result.totalTareas, 1);
    assert.match(result.output, /TASK-001/);
    assert.doesNotMatch(result.output, /TASK-002/);
    assert.equal(result.advertencias.length, 1);
    assert.match(result.advertencias[0]!, /TASK-002/);
  });
});

test('runBoardCommand: --sprint invalido falla sin leer nada de disco', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const t = buildNewTask('TASK-001', {
      titulo: 'x', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    await writeTareaFile(tareasRoot, t, DEFAULT_BODY);
    await assert.rejects(() => runBoardCommand(tareasRoot, ['--sprint', 'x']), BoardCommandError);
  });
});

test('runBoardCommand: sanity check via readTareaFile — moveTareaFile realmente cambio el estado en disco', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const t = buildNewTask('TASK-001', {
      titulo: 'x', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const p = await writeTareaFile(tareasRoot, t, DEFAULT_BODY);
    await moveTareaFile(tareasRoot, p, { ...t, estado: 'en-curso' }, DEFAULT_BODY);
    const read = await readTareaFile(tareasRoot, 'TASK-001');
    assert.equal(read?.task.estado, 'en-curso');
  });
});
