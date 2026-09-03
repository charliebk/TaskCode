import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  isWorkspaceClean,
  currentBranch,
  isValidBranchName,
  GitCommandError,
  GitLaunchError,
} from '../../src/fs/git.js';

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-git-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

test('isWorkspaceClean: true en un repo recien inicializado sin cambios', async () => {
  await withTempRepo(async (repoRoot) => {
    assert.equal(isWorkspaceClean(repoRoot), true);
  });
});

test('isWorkspaceClean: false si hay ficheros sin trackear', async () => {
  await withTempRepo(async (repoRoot) => {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(repoRoot, 'x.txt'), 'x', 'utf8');
    assert.equal(isWorkspaceClean(repoRoot), false);
  });
});

test('currentBranch: devuelve el nombre de la rama activa', async () => {
  await withTempRepo(async (repoRoot) => {
    assert.equal(currentBranch(repoRoot), 'main');
  });
});

test('isValidBranchName: true para un nombre valido, false para uno invalido', async () => {
  await withTempRepo(async (repoRoot) => {
    assert.equal(isValidBranchName('feature/algo-1001', repoRoot), true);
    assert.equal(isValidBranchName('rama con espacios', repoRoot), false);
    assert.equal(isValidBranchName('-empieza-con-guion', repoRoot), false);
  });
});

test('GitCommandError: mensaje incluye los argumentos y el stderr', () => {
  const err = new GitCommandError(['status', '--porcelain'], 'algo fallo\n');
  assert.match(err.message, /git status --porcelain fallo: algo fallo/);
  assert.equal(err.name, 'GitCommandError');
});

test('GitLaunchError: envuelve el error original con un mensaje claro', () => {
  const original = new Error('spawnSync git ENOENT');
  const err = new GitLaunchError(original);
  assert.match(err.message, /No se pudo ejecutar "git"/);
  assert.equal(err.originalError, original);
  assert.equal(err.name, 'GitLaunchError');
});
