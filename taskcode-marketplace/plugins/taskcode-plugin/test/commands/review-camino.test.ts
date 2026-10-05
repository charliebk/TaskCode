/**
 * Test de integracion real (no mocks) para taskctl review (TASK-013):
 * repos Git temporales de verdad, los scripts update-*.sh tal cual
 * estan en el repo, y evidencia leida de Git (rama activa, merge
 * commits, ancestria) en vez de fiarse de lo que devuelve el comando.
 * Mismo espiritu que start.test.ts (TASK-009).
 */
// Parte de los tests de review (ver test/helpers/review-fixtures.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

import {
  HERE,
  SCRIPTS_DIR,
  sampleTask,
  git,
  commitAll,
  withTempRepo,
  setupTaskEnCurso,
  advanceDevelop,
  escribirFichero,
  rutaTareaMd,
  setupTaskEnCursoSoloTarea,
} from '../helpers/review-fixtures.js';

test('taskctl review: camino feliz sin origin — update real, evidencia de merge, mueve a 03-en-revision y genera peticion + informe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-600');
    assert.equal(result.baseBranch, 'develop');
    assert.equal(result.ronda, 1);
    assert.match(result.filePath, /03-en-revision[/\\]TASK-600[/\\]tarea\.md$/);

    // Evidencia real de Git, no solo el valor devuelto.
    const branch = git(['branch', '--show-current'], repoRoot).trim();
    assert.equal(branch, task.rama);
    const log = git(['log', '--oneline'], repoRoot);
    assert.match(log, /update\(feature\): develop -> feature\/task-600-prueba-review/);
    const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', 'develop', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(ancestor.status, 0, 'develop deberia ser antepasado de HEAD tras el update');

    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-revision');
    assert.equal(read?.task.actualizado, '2026-09-06');
    // ultimo_commit_revisado NO se toca al generar la peticion (16.3:
    // se actualiza cuando la revision TERMINA, no cuando empieza).
    assert.equal(read?.task.ultimo_commit_revisado, null);
    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600')));

    // La peticion contiene el diff real (el cambio que vino de develop
    // y el trabajo de la rama) y el SHA revisado.
    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
    assert.doesNotMatch(peticion, /cambio-develop\.txt/);
    assert.match(peticion, /trabajo\.txt/);
    assert.ok(peticion.includes(result.commitRevisado));
    // Desde TASK-030 (item C2), "review" commitea la peticion y el
    // scaffold del informe, asi que HEAD avanza DESPUES de calcular
    // commitRevisado: el commit revisado es el padre de HEAD, no HEAD.
    // Y es lo correcto, no un efecto colateral: lo que el revisor tiene
    // que revisar es el codigo de la tarea, no el commit que contiene
    // la peticion de revision de si mismo.
    assert.equal(result.commitRevisado, git(['rev-parse', 'HEAD~1'], repoRoot).trim());
    assert.equal(
      git(['log', '--format=%s', '-1'], repoRoot).trim(),
      'chore(TASK-600): peticion de revision ronda 1'
    );

    const informe = await readFile(result.informes[0]!.informePath, 'utf8');
    assert.match(informe, /Informe de revision — TASK-600 \(ronda 1\)/);
    assert.match(informe, /PENDIENTE/);
  });
});

test('taskctl review: con origin (bare real) integra un cambio que solo existia en el remoto', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await mkdtemp(path.join(tmpdir(), 'taskctl-review-origin-'));
    const otherClone = await mkdtemp(path.join(tmpdir(), 'taskctl-review-clone-'));
    try {
      git(['init', '-q', '--bare', origin], origin);
      git(['remote', 'add', 'origin', origin], repoRoot);
      git(['push', '-q', 'origin', 'main', 'develop'], repoRoot);

      const task = sampleTask({ id: 'TASK-601', rama: 'feature/task-601-con-origin' });
      await setupTaskEnCurso(repoRoot, tareasRoot, task);

      // Otro colaborador avanza develop directamente en el remoto.
      git(['clone', '-q', '--branch', 'develop', origin, 'clon'], otherClone);
      const clonDir = path.join(otherClone, 'clon');
      git(['config', 'user.email', 'otro@example.com'], clonDir);
      git(['config', 'user.name', 'Otro'], clonDir);
      await writeFile(path.join(clonDir, 'remoto.txt'), 'cambio remoto\n', 'utf8');
      git(['add', '-A'], clonDir);
      git(['commit', '-q', '-m', 'cambio remoto en develop'], clonDir);
      git(['push', '-q', 'origin', 'develop'], clonDir);

      const result = await runReviewCommand(tareasRoot, ['TASK-601'], '2026-09-06', {
        repoCwd: repoRoot,
        scriptsDir: SCRIPTS_DIR,
      });

      // El cambio que SOLO existia en origin/develop llego a la rama.
      await stat(path.join(repoRoot, 'remoto.txt'));
      const log = git(['log', '--oneline'], repoRoot);
      assert.match(log, /update\(feature\): develop -> feature\/task-601-con-origin/);
      const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
      assert.doesNotMatch(peticion, /remoto\.txt/);
      const read = await readTareaFile(tareasRoot, 'TASK-601');
      assert.equal(read?.task.estado, 'en-revision');
    } finally {
      await rm(origin, { recursive: true, force: true });
      await rm(otherClone, { recursive: true, force: true });
    }
  });
});
