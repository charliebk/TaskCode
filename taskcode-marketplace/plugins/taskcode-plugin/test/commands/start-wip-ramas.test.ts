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

// --- TASK-025 (item C8): el limite ve las ramas de trabajo ---

test('taskctl start: bloquea aunque la tarea en curso solo exista en SU rama (el fallo de B7)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Este es el caso que B7 no cubria y que su smoke test no vio.
    // Se reproduce el flujo REAL: se arranca la primera tarea, se
    // commitea su movimiento EN SU RAMA, y se vuelve a develop — que
    // es lo que hacen plan/new/import — antes de arrancar la segunda.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
      ''
    );
    commitAll(repoRoot, 'dos tareas de carlos en diseno');

    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'TASK-500 en curso, EN SU RAMA');
    // De vuelta a la rama base: aqui TASK-500 sigue en 01-en-diseno.
    git(['checkout', '-q', 'develop'], repoRoot);

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof StartCommandError &&
        (err as Error).message.includes('TASK-500') &&
        (err as Error).message.includes('feature/task-500-prueba-de-integracion')
    );

    // Y no se ha creado la rama de la segunda.
    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-501-segunda'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(ramas.stdout.trim(), '');
  });
});

test('taskctl start: una rama YA MERGEADA no bloquea, aunque siga viva', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Politica IECA: las ramas no se borran tras el merge. Sin el
    // filtro de mergeadas, cada tarea cerrada bloquearia para siempre.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
      ''
    );
    commitAll(repoRoot, 'dos tareas de carlos');

    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'TASK-500 en curso');
    // Se mergea la rama a develop, pero NO se borra.
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '--no-ff', '-q', '-m', 'merge de TASK-500', 'feature/task-500-prueba-de-integracion'], repoRoot);

    // Ahora TASK-500 SI esta en 02-en-curso en develop, asi que se
    // mueve a terminadas para aislar lo que este test comprueba: que
    // la RAMA mergeada no cuenta.
    const enCurso = (await readTareaFile(tareasRoot, 'TASK-500'))!;
    await moveTareaFile(tareasRoot, enCurso.filePath, { ...enCurso.task, estado: 'terminada' }, enCurso.body);
    commitAll(repoRoot, 'TASK-500 terminada');

    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-501');
  });
});

test('taskctl start: la rama de OTRA persona no bloquea, aunque este abierta', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-de-carlos' }),
      ''
    );
    commitAll(repoRoot, 'una de ana y una de carlos');

    // Ana abre su rama y la deja abierta.
    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'la de ana en curso');
    git(['checkout', '-q', 'develop'], repoRoot);

    // Carlos arranca la suya: la rama abierta de Ana no le afecta.
    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-501');
    assert.equal(result.asignadoA, 'carlos@example.com');
  });
});

test('taskctl start: reintentar una tarea cuya rama ya existe no la bloquea contra si misma', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // La rama existe y no esta mergeada, y su arbol tiene la tarea en
    // 02-en-curso: sin excluirla por ID, el reintento se bloquearia a
    // si mismo y no habria forma de salir.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
    commitAll(repoRoot, 'tarea de carlos');
    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'en curso en su rama');

    // Se simula el reintento: se vuelve a develop y se deja la tarea
    // otra vez en 01-en-diseno, con la rama ya creada.
    git(['checkout', '-q', 'develop'], repoRoot);
    const enDiseno = (await readTareaFile(tareasRoot, 'TASK-500'))!;
    assert.equal(enDiseno.task.estado, 'en-diseno');

    // El limite NO se dispara: la tarea no se bloquea a si misma
    // aunque su propia rama este abierta y tenga la tarea en curso.
    // El reintento si muere, pero por otra cosa y preexistente: el
    // checkout a la rama ya creada trae consigo la carpeta
    // 02-en-curso/TASK-500, y moveTareaFile se niega a pisarla. Lo
    // que este test fija es que el error NO es del limite de WIP.
    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof TaskFolderConflictError &&
        !(err as Error).message.includes('sin cerrar')
    );
  });
});

test('taskctl start: un tarea.md roto en OTRA rama avisa, pero no bloquea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo IMPORTANTE de revision por pares: al pasar a escanear
    // ramas, un fichero corrupto en cualquier rama ajena o abandonada
    // dejaba a TODO el mundo sin poder arrancar nada, y el remedio
    // ('arregla su frontmatter') era inaplicable sin hacer checkout de
    // esa rama. El coste de la duda lo pagaba quien no la creo.
    git(['checkout', '-q', '-b', 'feature/experimento-de-otro'], repoRoot);
    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-777');
    await mkdir(rota, { recursive: true });
    await writeFile(path.join(rota, 'tarea.md'), 'basura', 'utf8');
    commitAll(repoRoot, 'una tarea rota en una rama ajena');
    git(['checkout', '-q', 'develop'], repoRoot);

    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
    commitAll(repoRoot, 'tarea de carlos');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // Arranca...
    assert.equal(result.id, 'TASK-500');
    // ...pero lo dice, con la rama delante para poder llegar al fichero.
    assert.equal(result.avisosWip.length, 1);
    assert.ok(result.avisosWip[0]?.includes('TASK-777'), result.avisosWip[0]);
    assert.ok(result.avisosWip[0]?.includes('experimento-de-otro'), result.avisosWip[0]);
  });
});
