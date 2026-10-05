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

// --- TASK-024 (item C7): identidad Git como asignado_a por defecto ---

test('taskctl start: una tarea sin asignar se autoasigna a la identidad Git', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    commitAll(repoRoot, 'tarea sin asignar');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // withTempRepo configura user.email como test@example.com.
    assert.equal(result.asignadoA, 'test@example.com');
    assert.equal(result.asignadoCambiado, true);
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'test@example.com');
  });
});

test('taskctl start: la identidad Git NO roba la tarea de otra persona', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // El asignado previo gana a la identidad de quien ejecuta. Sin
    // esto, arrancar la tarea de otra persona se la quedaria en
    // silencio y el limite de WIP se comprobaria contra la persona
    // equivocada.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
    commitAll(repoRoot, 'tarea de ana');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'ana@example.com');
    assert.equal(result.asignadoCambiado, false);
  });
});

test('taskctl start --asignado-a: el flag gana a la identidad Git', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    commitAll(repoRoot, 'tarea sin asignar');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'otra@example.com'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'otra@example.com');
  });
});

test('taskctl start: dos tareas sin asignar de la misma identidad chocan DENTRO de la misma rama', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Antes de TASK-024 ninguna de las dos tenia asignado_a, asi que
    // el limite no miraba nada. Ahora la primera se queda con la
    // identidad Git y la segunda choca contra ella.
    //
    // OJO con lo que este test NO demuestra (hallazgo de revision por
    // pares, TASK-024): aqui las dos invocaciones ocurren sin volver a
    // la rama base, y por eso la segunda ve a la primera en
    // 02-en-curso. En el flujo real, plan/new devuelven el repo a
    // develop — donde ese movimiento no esta commiteado — y el limite
    // NO se dispara. TASK-024 rellena asignado_a, que es condicion
    // necesaria pero no suficiente; lo otro se arregla aparte.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-501', asignado_a: null, rama: 'feature/task-501-segunda' }), '');
    commitAll(repoRoot, 'dos tareas sin asignar');

    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'la primera en curso');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof StartCommandError &&
        (err as Error).message.includes('TASK-500') &&
        (err as Error).message.includes('test@example.com')
    );
  });
});

// --- correcciones de la revision por pares de TASK-024 ---

test('taskctl start: una identidad Git invalida no corrompe el frontmatter (CRITICO)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    commitAll(repoRoot, 'tarea sin asignar');
    // El salto de linea inyectaba una clave que pisaba 'estado'.
    git(['config', 'user.email', 'ana@x.com\nestado: terminada # '], repoRoot);

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, null);
    assert.ok(result.avisoIdentidad?.includes('saltos de linea'), String(result.avisoIdentidad));
    // Evidencia real: la tarea se relee y su estado es el correcto.
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-curso');
    assert.equal(read?.task.asignado_a, null);
  });
});

test('taskctl start: avisa cuando arranca una tarea asignada a otra persona', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Quien abre la rama puede no ser quien planifico. No se cambia la
    // semantica (la tarea sigue siendo de ana), pero se dice en voz alta.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
    commitAll(repoRoot, 'tarea de ana');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'ana@example.com');
    assert.ok(result.avisoAtribucion?.includes('ana@example.com'), String(result.avisoAtribucion));
    assert.ok(result.avisoAtribucion?.includes('test@example.com'), String(result.avisoAtribucion));
  });
});

test('taskctl start: no avisa de atribucion cuando la tarea ya es tuya', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'test@example.com' }), '');
    commitAll(repoRoot, 'tarea propia');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.avisoAtribucion, null);
  });
});

test('taskctl start --asignado-a: pasar el flag silencia el aviso de atribucion', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
    commitAll(repoRoot, 'tarea de ana');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana@example.com'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // Ha sido una decision explicita, no un descuido: no hay nada que avisar.
    assert.equal(result.avisoAtribucion, null);
  });
});
