/**
 * Tests de gitUserEmail (TASK-024, item C7) contra repos Git reales.
 * Es la unica funcion de la capa fs que trata un exit distinto de cero
 * como un estado legitimo en vez de como un error, asi que merece
 * cubrir los dos caminos de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { gitUserEmail } from '../../src/fs/git.js';

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git fallo: ${result.stderr}`);
}

async function withRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-ident-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

test('gitUserEmail: devuelve el user.email configurado en el repo', async () => {
  await withRepo(async (repoRoot) => {
    git(['config', 'user.email', 'quien.ejecuta@example.com'], repoRoot);
    assert.equal(gitUserEmail(repoRoot), 'quien.ejecuta@example.com');
  });
});

test('gitUserEmail: un user.email vacio cuenta como sin identidad', async () => {
  await withRepo(async (repoRoot) => {
    // Un valor vacio sale con codigo 0 y stdout vacio: no es el mismo
    // caso que la clave inexistente, pero significa lo mismo. Es
    // ademas la unica forma determinista que tienen los tests de
    // simular 'sin identidad' sin depender de la config global de la
    // maquina donde corren.
    git(['config', 'user.email', ''], repoRoot);
    assert.equal(gitUserEmail(repoRoot), null);
  });
});

test('gitUserEmail: recorta el valor', async () => {
  await withRepo(async (repoRoot) => {
    git(['config', 'user.email', '  espacios@example.com  '], repoRoot);
    assert.equal(gitUserEmail(repoRoot), 'espacios@example.com');
  });
});
