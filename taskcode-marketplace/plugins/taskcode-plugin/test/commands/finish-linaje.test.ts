/**
 * Test de integracion real (no mocks) para taskctl finish (TASK-014):
 * repos Git temporales de verdad, los scripts merge-*.sh tal cual
 * estan en el repo, y evidencia leida de Git (merges, tags, ancestria)
 * en vez de fiarse de lo que devuelve el comando. Mismo espiritu que
 * review.test.ts (TASK-013).
 */
// Parte de los tests de finish (ver test/helpers/finish-fixtures.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

import {
  HERE,
  SCRIPTS_DIR,
  sampleTask,
  git,
  commitAll,
  withTempRepo,
  VEREDICTO_APROBADO,
  setupTaskEnRevision,
} from '../helpers/finish-fixtures.js';

test('taskctl finish: colision de IDs entre main y develop se detecta ANTES de mergear', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // develop ya tiene OTRO TASK-704 (titulo distinto), nacido de su
    // propio linaje.
    const otraTarea = sampleTask({
      id: 'TASK-704',
      titulo: 'Otra tarea distinta con el mismo numero',
      estado: 'planificada',
      rama: 'feature/task-704-otra',
    });
    await writeTareaFile(tareasRoot, otraTarea, '');
    commitAll(repoRoot, 'otra TASK-704 en develop');

    // El hotfix, nacido de main (que no ve tareas/ de develop),
    // recalculo el mismo ID para una tarea diferente.
    const task = sampleTask({ id: 'TASK-704', tipo: 'hotfix', rama: 'hotfix/task-704-urgente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-704'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match((e as Error).message, /colision de IDs/);
        assert.match((e as Error).message, /Renumera/);
        return true;
      }
    );

    // Nada se mergeo: main sigue sin el merge y no hay tag.
    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), task.rama);
    const read = await readTareaFile(tareasRoot, 'TASK-704');
    assert.equal(read?.task.estado, 'en-revision');
  });
});

test('taskctl finish (hotfix): tras un conflicto de backmerge resuelto a mano, el reintento cierra por el camino idempotente sin chocar con el tag (hallazgo IMPORTANTE de revision)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Conflicto real: el hotfix y develop tocan la misma linea.
    git(['checkout', '-q', 'main'], repoRoot);
    await writeFile(path.join(repoRoot, 'app.txt'), 'linea original\n', 'utf8');
    commitAll(repoRoot, 'app en main');
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--ff-only', 'main'], repoRoot);
    await writeFile(path.join(repoRoot, 'app.txt'), 'version de develop\n', 'utf8');
    commitAll(repoRoot, 'app cambiada en develop');

    const task = sampleTask({ id: 'TASK-712', tipo: 'hotfix', rama: 'hotfix/task-712-conflicto' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
    await writeFile(path.join(repoRoot, 'app.txt'), 'version del hotfix\n', 'utf8');
    commitAll(repoRoot, 'app cambiada en el hotfix');

    // Primer intento: merge a main + tag OK, backmerge en conflicto.
    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-712'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      FinishCommandError
    );
    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
    assert.equal(git(['tag', '--list', 'task-712-conflicto'], repoRoot).trim(), 'task-712-conflicto');

    // La persona resuelve el conflicto del backmerge a mano y comitea.
    await writeFile(path.join(repoRoot, 'app.txt'), 'version reconciliada\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '--no-edit'], repoRoot);

    // Reintento: NO se reejecuta el script (moriria en el tag
    // duplicado) — el camino idempotente cierra la tarea.
    const result = await runFinishCommand(tareasRoot, ['TASK-712'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.match(result.filePath, /04-terminadas[/\\]TASK-712/);
    const read = await readTareaFile(tareasRoot, 'TASK-712');
    assert.equal(read?.task.estado, 'terminada');
    // El tag sigue siendo uno (no hubo segundo intento de crearlo).
    assert.equal(git(['tag', '--list'], repoRoot).trim(), 'task-712-conflicto');
  });
});

test('taskctl finish (hotfix): mismo ID y MISMO titulo en linaje divergente tambien aborta antes de mergear (hallazgo IMPORTANTE de revision: add+add duplicaria la carpeta)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // develop tiene la "misma" tarea (mismo id y titulo) pero anadida
    // por su propio linaje, sin ancestro comun con la rama del hotfix.
    const copiaDevelop = sampleTask({
      id: 'TASK-713',
      estado: 'planificada',
      rama: 'hotfix/task-713-urgente',
    });
    await writeTareaFile(tareasRoot, copiaDevelop, '');
    commitAll(repoRoot, 'TASK-713 en develop');

    const task = sampleTask({ id: 'TASK-713', tipo: 'hotfix', rama: 'hotfix/task-713-urgente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-713'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match((e as Error).message, /linaje|ancestro comun|add\+add/);
        return true;
      }
    );
    // Nada mergeado: sin tag y main sin merge.
    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
  });
});
