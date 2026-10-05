/**
 * Test de integracion real (no mocks) para taskctl start (TASK-009):
 * monta un repo Git temporal de verdad (main/develop), invoca los
 * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
 * con evidencia (git branch --show-current, ubicacion real del
 * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
 * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
 * relleno" (principio de PLAN_SPRINTS.md).
 */
// Parte de los tests de start (ver test/helpers/start-fixtures.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
import { TaskFolderConflictError } from '../../src/fs/task-store.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

import {
  HERE,
  SCRIPTS_DIR,
  sampleTask,
  git,
  commitAll,
  withTempRepo,
} from '../helpers/start-fixtures.js';

// --- item B6: --asignado-a ---

test('taskctl start --asignado-a: crea la rama Y deja asignado_a escrito en el frontmatter', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\
Probar start.\
');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'carlos'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'carlos');
    assert.equal(result.asignadoCambiado, true);
    // Evidencia real de Git: la rama existe de verdad, no solo el
    // campo escrito.
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');

    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'carlos');
    assert.equal(read?.task.estado, 'en-curso');
  });
});

test('taskctl start: sin --asignado-a hereda el asignado_a que dejo plan', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Es el caso que describe la seccion 8.2: plan asigna, y start
    // comprueba 'la persona asignada' sin volver a pedirla.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
    commitAll(repoRoot, 'tarea(TASK-500): asignada en plan');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'ana');
    assert.equal(result.asignadoCambiado, false);
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'ana');
  });
});

test('taskctl start --asignado-a: reasigna sobre lo que dejo plan', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
    commitAll(repoRoot, 'tarea(TASK-500): asignada a ana');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a=carlos'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'carlos');
    assert.equal(result.asignadoCambiado, true);
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'carlos');
  });
});

test('taskctl start --asignado-a invalido: falla ANTES de crear la rama', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500', '--asignado-a'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StartCommandError
    );

    // Lo que de verdad importa del orden: la rama NO llego a
    // crearse. Si el flag se validara despues del script de
    // Git-Flow, quedaria una rama huerfana por cada intento fallido.
    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-500-prueba-de-integracion'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(ramas.stdout.trim(), '');
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');

    // Y la tarea sigue en 01-en-diseno, sin tocar.
    await stat(path.join(tareasRoot, '01-en-diseno', 'TASK-500', 'tarea.md'));
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.asignado_a, null);
  });
});
