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

test('taskctl finish: con revision_codex exige informe de Codex aprobado (rechaza sin el, pasa con el)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({
      id: 'TASK-706',
      rama: 'feature/task-706-codex',
      revision_codex: true,
    });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /revision_codex/);
        return true;
      }
    );

    // Con el informe de Codex aprobado (convencion de TASK-020), pasa.
    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-706', 'revision');
    await writeFile(
      path.join(revisionDir, 'informe-codex-1.md'),
      `# Informe Codex\n\n${VEREDICTO_APROBADO}`,
      'utf8'
    );
    commitAll(repoRoot, 'informe codex aprobado');

    const result = await runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.match(result.filePath, /04-terminadas/);
  });
});

test('taskctl finish: rechaza una tarea que no esta en-revision, con el comando requerido en el mensaje', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-707', estado: 'en-curso', rama: 'feature/task-707-curso' });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    commitAll(repoRoot, 'tarea en curso');

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-707'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /taskctl review/);
        return true;
      }
    );
  });
});

test('taskctl finish: rechaza con el workspace sucio, sin invocar el script', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-708', rama: 'feature/task-708-sucio' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-708'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      FinishCommandError
    );

    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
  });
});

test('taskctl finish: si el script falla, la tarea no se mueve ni se renderiza nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-709', rama: 'feature/task-709-roto' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-finish-'));
    await writeFile(
      path.join(brokenScriptsDir, 'merge-feature-to-develop.sh'),
      '#!/usr/bin/env bash\nexit 7\n',
      'utf8'
    );

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-709'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: brokenScriptsDir,
        }),
      FinishCommandError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-709');
    assert.equal(read?.task.estado, 'en-revision');
    await assert.rejects(() => stat(path.join(repoRoot, 'CHANGELOG.md')));
    await assert.rejects(() => stat(path.join(repoRoot, 'docs', 'BOARD.md')));
    await rm(brokenScriptsDir, { recursive: true, force: true });
  });
});

test('taskctl finish: una ronda fragmentada por dominio (N informes) exige que TODOS aprueben antes de cerrar (TASK-018)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-720', rama: 'feature/task-720-fragmentada' });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish con revision fragmentada.\n');
    await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
    await mkdir(revisionDir, { recursive: true });
    // Misma ronda (1), dos revisores de dominio: uno aprueba, el otro
    // sigue con el veredicto de la plantilla sin sustituir.
    await writeFile(
      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
      `# Informe de revision — ${task.id} (ronda 1)\n\n${VEREDICTO_APROBADO}`,
      'utf8'
    );
    await writeFile(
      path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'),
      `# Informe de revision — ${task.id} (ronda 1)\n\n` +
        '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados")\n',
      'utf8'
    );
    commitAll(repoRoot, `feat(${task.id}): revision fragmentada, un dominio pendiente`);

    // Con un informe de dominio todavia PENDIENTE, "finish" rechaza —
    // aunque el otro informe de la MISMA ronda ya apruebe.
    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, [task.id], '2026-09-12', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StateMachineError
    );
    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
    const tras1 = await readTareaFile(tareasRoot, task.id);
    assert.equal(tras1?.task.estado, 'en-revision');

    // Se aprueba el que faltaba (misma ronda, mismo N): ahora SI cierra.
    await writeFile(
      path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'),
      `# Informe de revision — ${task.id} (ronda 1)\n\n${VEREDICTO_APROBADO}`,
      'utf8'
    );
    commitAll(repoRoot, 'segundo informe de dominio tambien aprobado');

    const result = await runFinishCommand(tareasRoot, [task.id], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.match(result.filePath, /04-terminadas[/\\]TASK-720/);
    const tras2 = await readTareaFile(tareasRoot, task.id);
    assert.equal(tras2?.task.estado, 'terminada');
  });
});

test('taskctl finish: dos tareas terminadas acumulan entradas en CHANGELOG e INDEX sin pisarse', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const t1 = sampleTask({ id: 'TASK-710', rama: 'feature/task-710-una' });
    await setupTaskEnRevision(repoRoot, tareasRoot, t1);
    await runFinishCommand(tareasRoot, ['TASK-710'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'cierre de TASK-710');

    const t2 = sampleTask({ id: 'TASK-711', titulo: 'Segunda tarea', rama: 'feature/task-711-dos' });
    await setupTaskEnRevision(repoRoot, tareasRoot, t2);
    await runFinishCommand(tareasRoot, ['TASK-711'], '2026-09-08', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
    assert.match(changelog, /TASK-710/);
    assert.match(changelog, /TASK-711/);
    // La mas reciente queda arriba (insercion bajo la cabecera).
    assert.ok(changelog.indexOf('TASK-711') < changelog.indexOf('TASK-710'));

    const index = await readFile(path.join(repoRoot, 'docs', 'INDEX.md'), 'utf8');
    assert.match(index, /TASK-710/);
    assert.match(index, /Segunda tarea/);

    // El board refleja el estado final: ambas terminadas.
    const board = await readFile(path.join(repoRoot, 'docs', 'BOARD.md'), 'utf8');
    assert.match(board, /TASK-710/);
    assert.match(board, /TASK-711/);
  });
});
