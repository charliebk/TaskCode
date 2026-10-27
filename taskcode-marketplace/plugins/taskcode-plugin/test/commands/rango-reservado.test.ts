/**
 * TASK-067: el rango reservado (TASK-9000..TASK-9999) contra repos Git
 * temporales reales. `new` e `import` no lo usan; `board` y `metricas` ordenan
 * y cuentan bien los IDs de 4 cifras.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildNewTask, DEFAULT_BODY, runNewCommand } from '../../src/commands/new.js';
import { runImportCommand } from '../../src/commands/import.js';
import { runBoardCommand } from '../../src/commands/board.js';
import { leerRepoMetricas } from '../../src/commands/metricas.js';
import { writeTareaFile } from '../../src/fs/task-store.js';

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
  return r.stdout.trim();
}

async function conRepo(fn: (raiz: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-reservado-'));
  try {
    git(['init', '-q', '-b', 'main'], raiz);
    git(['config', 'user.email', 'test@example.com'], raiz);
    git(['config', 'user.name', 'Test'], raiz);
    await writeFile(path.join(raiz, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'inicial'], raiz);
    git(['checkout', '-q', '-b', 'develop'], raiz);
    await fn(raiz, path.join(raiz, 'tareas'));
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
}

/** Crea y commitea una tarea con ese ID (sin pasar por `new`, que numera solo). */
async function sembrar(raiz: string, tareasRoot: string, id: string): Promise<void> {
  const t = buildNewTask(
    id,
    { titulo: `Tarea ${id}`, tipo: 'feature', sprint: 0, etiquetas: [], complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose' },
    '2026-10-27'
  );
  await writeTareaFile(tareasRoot, t, DEFAULT_BODY, { failIfExists: true });
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', `chore(${id}): sembrada`], raiz);
}

test('new: con TASK-065 y TASK-9999 existentes crea TASK-066', async () => {
  await conRepo(async (raiz, tareasRoot) => {
    await sembrar(raiz, tareasRoot, 'TASK-065');
    await sembrar(raiz, tareasRoot, 'TASK-9999');
    const r = await runNewCommand(tareasRoot, ['--titulo', 'Normal', '--tipo', 'feature'], '2026-10-27', { repoCwd: raiz });
    assert.equal(r.id, 'TASK-066');
    const r2 = await runNewCommand(tareasRoot, ['--titulo', 'Otra', '--tipo', 'feature'], '2026-10-27', { repoCwd: raiz });
    assert.equal(r2.id, 'TASK-067');
  });
});

test('import: con TASK-065 y TASK-9999 existentes numera desde TASK-066 y ninguna entrada toma un ID reservado', async () => {
  await conRepo(async (raiz, tareasRoot) => {
    await sembrar(raiz, tareasRoot, 'TASK-065');
    await sembrar(raiz, tareasRoot, 'TASK-9999');
    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-reservado-md-'));
    try {
      const md = path.join(fuera, 'sprint.md');
      await writeFile(md, ['### Alfa', '> Objetivo alfa', '- criterio a', '', '### Beta', '> Objetivo beta', '- criterio b', ''].join('\n'), 'utf8');
      const r = await runImportCommand(tareasRoot, [md], '2026-10-27', { repoCwd: raiz });
      assert.deepEqual(r.creadas.map((c) => c.id), ['TASK-066', 'TASK-067'], JSON.stringify(r.errores));
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });
});

test('board y metricas ordenan IDs de 4 cifras por numero (TASK-9998 y TASK-9999 despues de TASK-100)', async () => {
  await conRepo(async (raiz, tareasRoot) => {
    for (const id of ['TASK-9999', 'TASK-100', 'TASK-9998', 'TASK-099']) await sembrar(raiz, tareasRoot, id);
    const b = await runBoardCommand(tareasRoot, []);
    assert.equal(b.totalTareas, 4);
    const orden = [...b.output.matchAll(/TASK-\d+/g)].map((m) => m[0]);
    assert.deepEqual([...new Set(orden)], ['TASK-099', 'TASK-100', 'TASK-9998', 'TASK-9999']);
    const m = await leerRepoMetricas({ proyecto: 'p', ruta: raiz, tareasRoot }, false);
    assert.deepEqual(m.filas.map((f) => f.id), ['TASK-099', 'TASK-100', 'TASK-9998', 'TASK-9999']);
  });
});
