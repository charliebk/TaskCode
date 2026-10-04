/**
 * Flujo D, modo semiautomatico (TASK-058): rechazo en la pregunta de approve,
 * contraprueba de aceptacion y cadena de fases con bloqueo. Repos Git
 * temporales reales y el CLI real por spawn.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { runNewCommand } from '../../src/commands/new.js';
import { runPlanCommand } from '../../src/commands/plan.js';
import { runStartCommand } from '../../src/commands/start.js';
import { leerTransiciones } from '../../src/core/transiciones.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'gitflow');
const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
const HOY = '2026-10-04';
const ID = 'TASK-001';

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function cliOk(cwd: string, args: string[]) {
  const r = cli(cwd, args);
  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
  return r;
}

function siguiente(cwd: string): Record<string, unknown> {
  return JSON.parse(cliOk(cwd, ['siguiente', ID, '--json']).stdout) as Record<string, unknown>;
}

async function withRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-semiauto-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'modo_flujo: semiautomatico\n', 'utf8');
    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/** Tarea creada, planificada con plan-final.md redactado y todo commiteado. */
async function tareaPlanificada(repoRoot: string, tareasRoot: string): Promise<void> {
  const creada = await runNewCommand(
    tareasRoot,
    [
      '--titulo', 'Flujo semiautomatico',
      '--tipo', 'feature',
      '--complejidad', 'simple',
      '--objetivo', 'Probar el modo semiautomatico.',
      '--criterio', 'La tarea queda en 02-en-curso',
    ],
    HOY,
    { repoCwd: repoRoot }
  );
  assert.equal(creada.id, ID);
  await runPlanCommand(tareasRoot, [ID], HOY, { repoCwd: repoRoot });
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
    '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
    'utf8'
  );
  commitAll(repoRoot, `docs(${ID}): plan final`);
}

function assertApprovePreguntar(s: Record<string, unknown>): void {
  assert.deepEqual(
    [s.estado, s.modo, s.fase, s.comando, s.accion],
    ['en-diseno', 'semiautomatico', 'approve', `taskctl approve ${ID}`, 'preguntar']
  );
}

test('respuesta «no» en approve: pausa deja la tarea en diseno, con fila pausa de persona y siguiente igual', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await tareaPlanificada(repoRoot, tareasRoot);
    assertApprovePreguntar(siguiente(repoRoot));

    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
    cliOk(repoRoot, ['pausa', ID]);

    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    assert.equal(t.task.estado, 'en-diseno');
    assert.equal(t.task.plan_aprobado, false);
    const carpeta = path.join(tareasRoot, '01-en-diseno', ID, 'tarea.md');
    assert.ok(git(['ls-files', carpeta], repoRoot).trim().length > 0, 'sigue en 01-en-diseno');
    const rows = leerTransiciones(t.body);
    const ultima = rows[rows.length - 1];
    assert.equal(ultima?.fase, 'pausa');
    assert.equal(ultima?.decidido_por, 'persona');
    assert.equal(git(['rev-list', '--count', `${antes}..HEAD`], repoRoot).trim(), '1', 'commit propio');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
    assertApprovePreguntar(siguiente(repoRoot));
  });
});

test('respuesta «si»: approve, start y review, cada paso guiado por siguiente', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await tareaPlanificada(repoRoot, tareasRoot);
    assertApprovePreguntar(siguiente(repoRoot));

    cliOk(repoRoot, ['approve', ID]);
    let s = siguiente(repoRoot);
    assert.deepEqual([s.fase, s.accion, s.comando], ['start', 'preguntar', `taskctl start ${ID}`]);

    await runStartCommand(tareasRoot, [ID], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.estado, 'en-curso');
    assert.ok(git(['ls-files', path.join(tareasRoot, '02-en-curso', ID, 'tarea.md')], repoRoot).trim().length > 0);

    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
    commitAll(repoRoot, `feat(${ID}): trabajo`);
    s = siguiente(repoRoot);
    assert.deepEqual([s.estado, s.fase, s.accion], ['en-curso', 'review', 'preguntar']);
  });
});

test('cadena en el flujo: abrir antes de approve, comprobar antes de cada comando, cerrar al final', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await tareaPlanificada(repoRoot, tareasRoot);
    const testigo = cliOk(repoRoot, ['cadena', 'abrir', ID]).stdout.trim();
    assert.match(testigo, /^[0-9a-f]{16}$/);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'el bloqueo no ensucia el arbol');

    // Un segundo abrir durante la cadena aborta, y el flujo sigue intacto.
    const segundo = cli(repoRoot, ['cadena', 'abrir', 'TASK-002']);
    assert.notEqual(segundo.status, 0);
    assert.ok(segundo.stderr.includes(ID));

    cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
    cliOk(repoRoot, ['approve', ID]);

    cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
    const s = siguiente(repoRoot);
    assert.equal(s.fase, 'start');
    await runStartCommand(tareasRoot, [ID], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });

    cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-curso');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');

    // Un testigo ajeno no cierra la cadena; el bueno si.
    assert.notEqual(cli(repoRoot, ['cadena', 'cerrar', '0000000000000000']).status, 0);
    cliOk(repoRoot, ['cadena', 'comprobar', testigo]);
    cliOk(repoRoot, ['cadena', 'cerrar', testigo]);

    const tras = cli(repoRoot, ['cadena', 'comprobar', testigo]);
    assert.notEqual(tras.status, 0);
    assert.match(tras.stderr, /ya no esta abierta/);
    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-002']);
  });
});
