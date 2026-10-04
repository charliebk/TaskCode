/**
 * `taskctl cadena` (TASK-058). Repos Git temporales reales y el CLI real por spawn.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runCadenaCommand, CadenaCommandError } from '../../src/commands/cadena.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');

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

async function existe(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function rutaLock(cwd: string): string {
  return path.resolve(cwd, git(['rev-parse', '--git-path', 'taskcode/cadena.lock'], cwd).trim());
}

async function withRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-cadena-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

test('abrir imprime solo un testigo hex de 16 caracteres y crea el bloqueo fuera del arbol', async () => {
  await withRepo(async (repoRoot) => {
    const r = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']);
    assert.match(r.stdout.trim(), /^[0-9a-f]{16}$/);
    assert.equal(r.stdout.trim().split(/\s+/).length, 1, 'solo el testigo');
    const lock = rutaLock(repoRoot);
    assert.ok(await existe(lock), `falta el bloqueo en ${lock}`);
    assert.ok(path.relative(repoRoot, lock).startsWith('.git'), 'vive en el directorio de Git');
    const json = JSON.parse(await readFile(lock, 'utf8')) as Record<string, string>;
    assert.equal(json.tarea, 'TASK-001');
    assert.equal(json.testigo, r.stdout.trim());
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('segundo abrir falla y nombra la tarea, la antiguedad y --forzar', async () => {
  await withRepo(async (repoRoot) => {
    const t = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
    const r = cli(repoRoot, ['cadena', 'abrir', 'TASK-002']);
    assert.notEqual(r.status, 0);
    assert.ok(r.stderr.includes('TASK-001'), r.stderr);
    assert.match(r.stderr, /hace \d+ min/);
    assert.ok(r.stderr.includes('taskctl cadena cerrar --forzar'), r.stderr);
    // El bloqueo original sigue intacto.
    cliOk(repoRoot, ['cadena', 'comprobar', t]);
  });
});

test('runCadenaCommand con ahora inyectado: la antiguedad sale en minutos y en horas', async () => {
  await withRepo(async (repoRoot) => {
    const t0 = new Date('2026-10-04T10:00:00.000Z');
    await runCadenaCommand(['abrir', 'TASK-007'], { repoCwd: repoRoot, ahora: () => t0 });
    await assert.rejects(
      runCadenaCommand(['abrir', 'TASK-008'], { repoCwd: repoRoot, ahora: () => new Date(t0.getTime() + 12 * 60000) }),
      (e: unknown) => e instanceof CadenaCommandError && e.message.includes('TASK-007') && e.message.includes('hace 12 min')
    );
    await assert.rejects(
      runCadenaCommand(['abrir', 'TASK-008'], { repoCwd: repoRoot, ahora: () => new Date(t0.getTime() + 3 * 3600000) }),
      (e: unknown) => e instanceof CadenaCommandError && e.message.includes('hace 3 h')
    );
  });
});

test('comprobar: testigo bueno 0, malo != 0, sin bloqueo != 0 con mensaje', async () => {
  await withRepo(async (repoRoot) => {
    const sin = cli(repoRoot, ['cadena', 'comprobar', 'abcdef0123456789']);
    assert.notEqual(sin.status, 0);
    assert.match(sin.stderr, /ya no esta abierta/);

    const t = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
    assert.equal(cli(repoRoot, ['cadena', 'comprobar', t]).status, 0);
    const malo = cli(repoRoot, ['cadena', 'comprobar', '0000000000000000']);
    assert.notEqual(malo.status, 0);
    assert.ok(malo.stderr.includes('TASK-001'));
  });
});

test('cerrar con testigo ajeno falla y no borra; con el bueno borra', async () => {
  await withRepo(async (repoRoot) => {
    const t = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
    const lock = rutaLock(repoRoot);
    const ajeno = cli(repoRoot, ['cadena', 'cerrar', '0000000000000000']);
    assert.notEqual(ajeno.status, 0);
    assert.ok(await existe(lock), 'el bloqueo debe seguir');
    cliOk(repoRoot, ['cadena', 'cerrar', t]);
    assert.equal(await existe(lock), false);
    // Tras cerrar se puede abrir otra.
    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-002']);
  });
});

test('cerrar --forzar borra el bloqueo sin testigo, y sin bloqueo no falla', async () => {
  await withRepo(async (repoRoot) => {
    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']);
    const lock = rutaLock(repoRoot);
    cliOk(repoRoot, ['cadena', 'cerrar', '--forzar']);
    assert.equal(await existe(lock), false);
    cliOk(repoRoot, ['cadena', 'cerrar', '--forzar']);
  });
});

test('un bloqueo con JSON roto se trata como ocupado y --forzar lo limpia', async () => {
  await withRepo(async (repoRoot) => {
    const lock = rutaLock(repoRoot);
    await mkdir(path.dirname(lock), { recursive: true });
    await writeFile(lock, '{esto no es json', 'utf8');
    const r = cli(repoRoot, ['cadena', 'abrir', 'TASK-001']);
    assert.notEqual(r.status, 0);
    assert.ok(await existe(lock), 'no se pisa el bloqueo roto');
    assert.ok(r.stderr.includes('taskctl cadena cerrar --forzar'));
    cliOk(repoRoot, ['cadena', 'cerrar', '--forzar']);
    assert.equal(await existe(lock), false);
    cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']);
  });
});

test('en un worktree enlazado el bloqueo es independiente del arbol principal', async () => {
  await withRepo(async (repoRoot) => {
    const wt = path.join(await mkdtemp(path.join(tmpdir(), 'taskctl-cadena-wt-')), 'wt');
    try {
      git(['worktree', 'add', '-q', '-b', 'otra', wt], repoRoot);
      const t1 = cliOk(repoRoot, ['cadena', 'abrir', 'TASK-001']).stdout.trim();
      const t2 = cliOk(wt, ['cadena', 'abrir', 'TASK-002']).stdout.trim();
      assert.notEqual(rutaLock(repoRoot), rutaLock(wt));
      assert.notEqual(t1, t2);
      // Cada testigo vale solo en su arbol.
      assert.equal(cli(repoRoot, ['cadena', 'comprobar', t1]).status, 0);
      assert.equal(cli(wt, ['cadena', 'comprobar', t2]).status, 0);
      assert.notEqual(cli(wt, ['cadena', 'comprobar', t1]).status, 0);
      cliOk(wt, ['cadena', 'cerrar', t2]);
      assert.equal(cli(repoRoot, ['cadena', 'comprobar', t1]).status, 0, 'cerrar en el worktree no toca el principal');
    } finally {
      git(['worktree', 'remove', '--force', wt], repoRoot);
      await rm(path.dirname(wt), { recursive: true, force: true });
    }
  });
});

test('abrir sin ID valido, y subcomando desconocido, salen != 0 sin crear bloqueo', async () => {
  await withRepo(async (repoRoot) => {
    const lock = rutaLock(repoRoot);
    assert.notEqual(cli(repoRoot, ['cadena', 'abrir']).status, 0);
    assert.notEqual(cli(repoRoot, ['cadena', 'abrir', 'foo']).status, 0);
    assert.notEqual(cli(repoRoot, ['cadena', 'abrir', 'TASK-1']).status, 0);
    assert.notEqual(cli(repoRoot, ['cadena', 'inventado']).status, 0);
    assert.notEqual(cli(repoRoot, ['cadena', 'comprobar']).status, 0);
    assert.notEqual(cli(repoRoot, ['cadena', 'cerrar']).status, 0);
    assert.equal(await existe(lock), false);
  });
});
