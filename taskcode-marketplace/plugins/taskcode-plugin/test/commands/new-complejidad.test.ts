/**
 * TASK-117: `taskctl new` sin --complejidad propone la de las tareas
 * terminadas con mas etiquetas en comun, la escribe y dice de cuales sale.
 * Repo Git temporal real (main + develop, en develop y limpio).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildNewTask, runNewCommand } from '../../src/commands/new.js';
import { writeTareaFile } from '../../src/fs/task-store.js';
import type { TaskComplexity } from '../../src/core/task.js';

function git(args: string[], cwd: string): void {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
}

/** Repo en develop con las tareas terminadas dadas ya commiteadas. */
async function conRepo(
  terminadas: [string, string[], TaskComplexity | null][],
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-newcpx-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# repo\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    const tareasRoot = path.join(repoRoot, 'tareas');
    for (const [id, etiquetas, complejidad] of terminadas) {
      const base = buildNewTask(
        id,
        { titulo: id, tipo: 'feature', sprint: 0, etiquetas, complejidad, modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose' },
        '2026-11-01'
      );
      await writeTareaFile(tareasRoot, { ...base, estado: 'terminada', plan_aprobado: true }, '## Objetivo\nx\n');
    }
    if (terminadas.length > 0) {
      git(['add', '-A'], repoRoot);
      git(['commit', '-q', '-m', 'terminadas'], repoRoot);
    }
    await fn(repoRoot, tareasRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

const TERMINADAS: [string, string[], TaskComplexity | null][] = [
  ['TASK-001', ['cli', 'git'], 'alta'],
  ['TASK-002', ['cli', 'git'], 'simple'],
  ['TASK-003', ['cli', 'git'], 'media'],
  ['TASK-004', ['cli'], 'trivial'],
  ['TASK-005', ['web'], 'critica'],
];

test('new (TASK-117, criterio 1): sin --complejidad propone la mediana de las mas parecidas, la escribe y dice de cuales sale', async () => {
  await conRepo(TERMINADAS, async (repoRoot, tareasRoot) => {
    const r = await runNewCommand(
      tareasRoot,
      ['--titulo', 'Nueva', '--tipo', 'feature', '--etiquetas', 'cli,git,otra'],
      '2026-11-13',
      { repoCwd: repoRoot }
    );
    assert.deepEqual(r.complejidadPropuesta, { valor: 'media', desde: ['TASK-001', 'TASK-002', 'TASK-003'], enComun: 2 });
    assert.match(await readFile(r.filePath, 'utf8'), /^complejidad: media$/m);
  });
});

test('new (TASK-117, criterio 2): con --complejidad gana la declarada, y sin parecidas se queda como hoy', async () => {
  await conRepo(TERMINADAS, async (repoRoot, tareasRoot) => {
    const declarada = await runNewCommand(
      tareasRoot,
      ['--titulo', 'Declarada', '--tipo', 'feature', '--etiquetas', 'cli,git', '--complejidad', 'trivial'],
      '2026-11-13',
      { repoCwd: repoRoot }
    );
    assert.equal(declarada.complejidadPropuesta, null);
    assert.match(await readFile(declarada.filePath, 'utf8'), /^complejidad: trivial$/m);
    const sinParecidas = await runNewCommand(
      tareasRoot,
      ['--titulo', 'Sin parecidas', '--tipo', 'feature', '--etiquetas', 'ifc'],
      '2026-11-13',
      { repoCwd: repoRoot }
    );
    assert.equal(sinParecidas.complejidadPropuesta, null);
    assert.match(await readFile(sinParecidas.filePath, 'utf8'), /^complejidad: null$/m);
  });
  await conRepo([], async (repoRoot, tareasRoot) => {
    const r = await runNewCommand(tareasRoot, ['--titulo', 'Primera', '--tipo', 'feature', '--etiquetas', 'cli'], '2026-11-13', {
      repoCwd: repoRoot,
    });
    assert.equal(r.complejidadPropuesta, null);
  });
});

test('new (TASK-117): el CLI dice la complejidad propuesta y de que tareas sale', async () => {
  await conRepo(TERMINADAS, async (repoRoot) => {
    const cli = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
    const r = spawnSync(process.execPath, [cli, 'new', '--titulo', 'Por CLI', '--tipo', 'feature', '--etiquetas', 'cli'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    assert.match(
      r.stdout,
      /Complejidad propuesta: simple \(mediana de TASK-001, TASK-002, TASK-003, TASK-004, con 1 etiqueta\(s\) en comun\)/
    );
  });
});
