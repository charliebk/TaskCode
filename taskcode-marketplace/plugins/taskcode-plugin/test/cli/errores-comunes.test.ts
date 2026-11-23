/**
 * TASK-149b (FS-03 de la auditoria 4D): los errores comunes (Git, config,
 * auto-commit...) se traducen igual en todos los comandos. `taskctl new` fuera
 * de un repo Git lanzaba un GitCommandError que su catch no conocia y salia
 * como «taskctl no pudo arrancar». Con el binario real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');

test('un GitCommandError en new (fuera de un repo) sale como [ERROR] con codigo 1, no como «no pudo arrancar»', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-errores-comunes-'));
  try {
    await mkdir(path.join(dir, 'tareas', '00-planificadas'), { recursive: true });
    const r = spawnSync(process.execPath, [TASKCTL, 'new', '--titulo', 'Prueba', '--tipo', 'feature'], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(dir) },
    });
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /^\[ERROR\] git .* fallo: /);
    assert.doesNotMatch(r.stderr, /no pudo arrancar/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
