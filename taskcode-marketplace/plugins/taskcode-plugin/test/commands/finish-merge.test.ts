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

test('veredictoAprobado: fail-closed con PENDIENTE, cambios-solicitados o sin linea de veredicto', () => {
  assert.equal(veredictoAprobado('- Veredicto: aprobada\n'), true);
  assert.equal(veredictoAprobado('- Veredicto: APROBADA (sin hallazgos)\n'), true);
  assert.equal(veredictoAprobado('- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n'), false);
  assert.equal(veredictoAprobado('- Veredicto: cambios-solicitados\n'), false);
  assert.equal(veredictoAprobado('informe sin veredicto\n'), false);
  assert.equal(veredictoAprobado(''), false);
});

test('veredictoAprobado: NO es fail-open ante negaciones ni lineas multiples (hallazgo CRITICO de revision)', () => {
  // La negacion mas natural en espanol debe rechazar, no aprobar.
  assert.equal(veredictoAprobado('- Veredicto: no aprobada (faltan tests)\n'), false);
  assert.equal(veredictoAprobado('- Veredicto: NO aprobada\n'), false);
  assert.equal(veredictoAprobado('- Veredicto: rechazada (aprobada seria prematuro)\n'), false);
  // El veredicto del informe de TASK-013 (referencia real): la palabra
  // "independiente" no debe confundirse con "pendiente".
  assert.equal(
    veredictoAprobado('- Veredicto: aprobada (revisada por el agente independiente)\n'),
    true
  );
  // Varias lineas Veredicto: TODAS deben aprobar (placeholder de la
  // plantilla sin borrar => rechazo; aprobada + cambios => rechazo).
  assert.equal(
    veredictoAprobado('- Veredicto: PENDIENTE (...)\n\ntexto\n\n- Veredicto: aprobada\n'),
    false
  );
  assert.equal(
    veredictoAprobado('- Veredicto: aprobada\n\n- Veredicto: cambios-solicitados\n'),
    false
  );
});

test('taskctl finish (feature): merge a develop, tarea a 04-terminadas y CHANGELOG/INDEX/BOARD renderizados', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const result = await runFinishCommand(tareasRoot, ['TASK-700'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.baseBranch, 'develop');
    assert.equal(result.mainBranch, null);
    assert.match(result.filePath, /04-terminadas[/\\]TASK-700[/\\]tarea\.md$/);

    // Evidencia real de Git.
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    assert.match(git(['log', '--oneline'], repoRoot), /merge\(feature\): feature\/task-700-prueba-finish -> develop/);

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'terminada');
    assert.equal(read?.task.actualizado, '2026-09-07');
    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-700')));

    const changelog = await readFile(result.changelogPath, 'utf8');
    assert.match(changelog, /## Sin publicar/);
    assert.match(changelog, /- TASK-700 \(feature\) — Tarea de prueba de finish \(2026-09-07\)/);

    const index = await readFile(result.indexPath, 'utf8');
    assert.match(index, /- TASK-700 — Tarea de prueba de finish · etiquetas: cli, gitflow/);
    assert.match(index, /tareas\/04-terminadas\/TASK-700\//);

    const board = await readFile(result.boardPath, 'utf8');
    assert.match(board, /Generado automaticamente por taskctl finish el 2026-09-07/);
    assert.match(board, /TASK-700/);
  });
});

test('taskctl finish (fix): usa merge-fix-to-develop.sh', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-701', tipo: 'fix', rama: 'fix/task-701-prueba-fix' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    await runFinishCommand(tareasRoot, ['TASK-701'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.match(git(['log', '--oneline'], repoRoot), /merge\(fix\): fix\/task-701-prueba-fix -> develop/);
    const read = await readTareaFile(tareasRoot, 'TASK-701');
    assert.equal(read?.task.estado, 'terminada');
  });
});

test('taskctl finish (hotfix): merge a main con tag y backmerge real a develop', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-702', tipo: 'hotfix', rama: 'hotfix/task-702-urgente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });

    const result = await runFinishCommand(tareasRoot, ['TASK-702'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.mainBranch, 'main');
    // Merge a main + tag + backmerge, todo leido de Git.
    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\): hotfix\/task-702-urgente -> main/);
    assert.equal(git(['tag', '--list', 'task-702-urgente'], repoRoot).trim(), 'task-702-urgente');
    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');

    // La tarea quedo terminada en el working tree de develop.
    const read = await readTareaFile(tareasRoot, 'TASK-702');
    assert.equal(read?.task.estado, 'terminada');
  });
});

test('taskctl finish (release): merge a main con tag y backmerge real a develop', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-703', tipo: 'release', rama: 'release/task-703-cierre' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const result = await runFinishCommand(tareasRoot, ['TASK-703'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.mainBranch, 'main');
    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(release\): release\/task-703-cierre -> main/);
    assert.equal(git(['tag', '--list', 'task-703-cierre'], repoRoot).trim(), 'task-703-cierre');
    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
    const read = await readTareaFile(tareasRoot, 'TASK-703');
    assert.equal(read?.task.estado, 'terminada');
  });
});
