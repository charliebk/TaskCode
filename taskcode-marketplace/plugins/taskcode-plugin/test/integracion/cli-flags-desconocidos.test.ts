/**
 * TASK-047 (auditoria D4): un flag que el comando no conoce aborta en vez de
 * ignorarse en silencio. Unitarios de rechazarFlagsDesconocidos y, contra
 * repos Git temporales reales, los 13 comandos por main().
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { main } from '../../src/cli.js';
import { rechazarFlagsDesconocidos } from '../../src/cli/args.js';

class ErrorDePrueba extends Error {}
const fail = (m: string): Error => new ErrorDePrueba(m);
const VALIDOS = ['--titulo', '--complejidad', '--push', '-p'];

function mensajeDe(argv: string[], validos: readonly string[] = VALIDOS): string | null {
  try {
    rechazarFlagsDesconocidos(argv, validos, 'new', fail);
    return null;
  } catch (e) {
    assert.ok(e instanceof ErrorDePrueba);
    return e.message;
  }
}

test('rechazarFlagsDesconocidos: un flag valido pasa', () => {
  assert.equal(mensajeDe(['--titulo', 'X', '--complejidad', 'trivial', '--push']), null);
});

test('rechazarFlagsDesconocidos: --complejida aborta con sugerencia y lista de validos', () => {
  const m = mensajeDe(['--titulo', 'X', '--complejida', 'trivial']);
  assert.ok(m !== null);
  assert.match(m, /taskctl new: flag desconocido "--complejida"/);
  assert.match(m, /Quiza quisiste decir "--complejidad"/);
  assert.match(m, /Flags validos:/);
});

test('rechazarFlagsDesconocidos: --x=1 mira solo el nombre', () => {
  assert.equal(mensajeDe(['--titulo=--x=1']), null);
  const m = mensajeDe(['--inventado=1']);
  assert.ok(m !== null);
  assert.match(m, /flag desconocido "--inventado"/);
});

// MENOR-1 de la revision: `--push=1` pasaba la guarda y no empujaba.
test('rechazarFlagsDesconocidos: un flag booleano con =valor aborta', () => {
  const m = mensajeDe(['--push=1']);
  assert.ok(m !== null);
  assert.match(m, /"--push" no lleva valor/);
  assert.equal(mensajeDe(['--push']), null);
  const j = mensajeDe(['--json=1'], ['--json']);
  assert.ok(j !== null);
  assert.match(j, /"--json" no lleva valor/);
});

test('rechazarFlagsDesconocidos: -1 no es un flag', () => {
  assert.equal(mensajeDe(['--titulo', 'X', '-1']), null);
});

test('rechazarFlagsDesconocidos: corto declarado pasa y no declarado aborta', () => {
  assert.equal(mensajeDe(['-p']), null);
  const m = mensajeDe(['-q']);
  assert.ok(m !== null);
  assert.match(m, /flag desconocido "-q"/);
});

test('rechazarFlagsDesconocidos: lista vacia dice que no admite flags', () => {
  const m = mensajeDe(['--algo'], []);
  assert.ok(m !== null);
  assert.match(m, /no admite flags/);
  assert.doesNotMatch(m, /Flags validos/);
});

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

async function withTempRepoCwd(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-flags-'));
  const cwdAntes = process.cwd();
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    process.chdir(repoRoot);
    await fn(repoRoot);
  } finally {
    process.chdir(cwdAntes);
    await rm(repoRoot, { recursive: true, force: true });
  }
}

async function captureOutput(fn: () => Promise<number>): Promise<{ code: number; stdout: string; stderr: string }> {
  const outChunks: string[] = [];
  const errChunks: string[] = [];
  const originalOut = process.stdout.write.bind(process.stdout);
  const originalErr = process.stderr.write.bind(process.stderr);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.stdout as any).write = (chunk: string) => {
    outChunks.push(String(chunk));
    return true;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.stderr as any).write = (chunk: string) => {
    errChunks.push(String(chunk));
    return true;
  };
  try {
    const code = await fn();
    return { code, stdout: outChunks.join(''), stderr: errChunks.join('') };
  } finally {
    process.stdout.write = originalOut;
    process.stderr.write = originalErr;
  }
}

test('main: "taskctl new --complejida" aborta con sugerencia y no crea tarea ni commit', async () => {
  await withTempRepoCwd(async (repoRoot) => {
    const commitsAntes = git(['rev-list', '--count', 'HEAD'], repoRoot);
    const { code, stderr } = await captureOutput(() =>
      main(['new', '--titulo', 'X', '--tipo', 'feature', '--complejida', 'trivial'])
    );
    assert.equal(code, 1);
    assert.match(stderr, /taskctl new: flag desconocido "--complejida"/);
    assert.match(stderr, /Quiza quisiste decir "--complejidad"/);
    assert.equal(git(['rev-list', '--count', 'HEAD'], repoRoot), commitsAntes);
    assert.equal(git(['status', '--porcelain'], repoRoot), '');
    const entradas = await readdir(repoRoot);
    assert.ok(!entradas.includes('tareas'), 'no debe crearse tareas/');
  });
});

const COMANDOS: ReadonlyArray<{ cmd: string; args: string[] }> = [
  { cmd: 'new', args: ['--titulo', 'X', '--tipo', 'feature'] },
  { cmd: 'import', args: ['no-existe.md'] },
  { cmd: 'board', args: [] },
  { cmd: 'start', args: ['TASK-001'] },
  { cmd: 'plan', args: ['TASK-001'] },
  { cmd: 'approve', args: ['TASK-001'] },
  { cmd: 'review', args: ['TASK-001'] },
  { cmd: 'finish', args: ['TASK-001'] },
  { cmd: 'codex-review', args: ['TASK-001'] },
  { cmd: 'veredicto', args: ['TASK-001', 'aprobada'] },
  { cmd: 'pausa', args: ['TASK-001'] },
  { cmd: 'siguiente', args: ['TASK-001'] },
  { cmd: 'cadena', args: ['abrir', 'TASK-001'] },
];

for (const { cmd, args } of COMANDOS) {
  test(`main: "taskctl ${cmd}" con un flag inventado aborta antes de cualquier efecto`, async () => {
    await withTempRepoCwd(async (repoRoot) => {
      const commitsAntes = git(['rev-list', '--count', 'HEAD'], repoRoot);
      const ramaAntes = git(['branch', '--show-current'], repoRoot);
      const { code, stderr } = await captureOutput(() => main([cmd, ...args, '--inventado']));
      assert.equal(code, 1);
      assert.match(stderr, new RegExp(`taskctl ${cmd}: flag desconocido "--inventado"`));
      assert.equal(git(['rev-list', '--count', 'HEAD'], repoRoot), commitsAntes);
      assert.equal(git(['branch', '--show-current'], repoRoot), ramaAntes);
      assert.equal(git(['status', '--porcelain'], repoRoot), '');
      const entradas = await readdir(repoRoot);
      assert.ok(!entradas.includes('tareas'), 'no debe crearse tareas/');
    });
  });
}
