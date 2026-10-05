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

test('taskctl start: crea la rama de verdad y mueve la tarea a 02-en-curso (tipo feature)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar start.\n');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-500');
    assert.equal(result.rama, 'feature/task-500-prueba-de-integracion');
    assert.match(result.filePath, /02-en-curso[/\\]TASK-500[/\\]tarea\.md$/);

    // Evidencia real de Git, no solo el valor devuelto por el comando.
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');

    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-curso');
    assert.equal(read?.task.actualizado, '2026-09-04');

    // La carpeta vieja (01-en-diseno) no debe seguir existiendo.
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-500')));
  });
});

for (const tipo of ['fix', 'hotfix', 'release'] as const) {
  test(`taskctl start: tambien funciona para tipo "${tipo}" (repo sin origin)`, async () => {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      const task = sampleTask({
        id: 'TASK-501',
        tipo,
        rama: `${tipo}/task-501-prueba-${tipo}`,
      });
      await writeTareaFile(tareasRoot, task, '');
      commitAll(repoRoot, 'tarea(TASK-501): plan aprobado');

      const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-04', {
        repoCwd: repoRoot,
        scriptsDir: SCRIPTS_DIR,
      });

      assert.equal(result.rama, `${tipo}/task-501-prueba-${tipo}`);
      const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
      assert.equal(branch.stdout.trim(), `${tipo}/task-501-prueba-${tipo}`);

      // No basta con que el comando no lance: hay que confirmar que la
      // tarea de verdad quedo movida y con el contenido correcto (hallazgo
      // de revision por pares, TASK-009 — este es justo el caso, hotfix,
      // donde moveTareaFile necesito el fallback ENOENT porque Git ya
      // habia borrado la carpeta vieja del working tree al cambiar de
      // rama).
      const read = await readTareaFile(tareasRoot, 'TASK-501');
      assert.ok(read !== null, 'la tarea deberia poder releerse tras start');
      assert.equal(read?.task.estado, 'en-curso');
      assert.equal(read?.task.actualizado, '2026-09-04');
      assert.match(read?.filePath ?? '', /02-en-curso[/\\]TASK-501[/\\]tarea\.md$/);
    });
  });
}

test('taskctl start: rechaza un task.rama invalido para Git antes de invocar el script', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ rama: 'rama con espacios' }), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StartCommandError
    );

    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl start: si el script de Git-Flow falla (codigo != 0), no mueve la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    // Para forzar un fallo genuino del script (no simulado con mocks),
    // apuntamos runStartCommand a un scriptsDir con un create-feature.sh
    // que siempre termina en un codigo de error real.
    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-scripts-'));
    await writeFile(
      path.join(brokenScriptsDir, 'create-feature.sh'),
      '#!/usr/bin/env bash\nexit 7\n',
      'utf8'
    );

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
          repoCwd: repoRoot,
          scriptsDir: brokenScriptsDir,
        }),
      StartCommandError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
    await rm(brokenScriptsDir, { recursive: true, force: true });
  });
});

test('taskctl start: si el script termina con codigo 0 pero la rama activa no coincide, no mueve la tarea (evidencia, no suposicion)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    // Script "malicioso/con bug": termina en codigo 0 sin haber creado
    // ni cambiado a la rama pedida. runStartCommand debe detectarlo con
    // git branch --show-current en vez de fiarse solo del exit code.
    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-scripts-'));
    await writeFile(
      path.join(fakeScriptsDir, 'create-feature.sh'),
      '#!/usr/bin/env bash\nexit 0\n',
      'utf8'
    );

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
          repoCwd: repoRoot,
          scriptsDir: fakeScriptsDir,
        }),
      StartCommandError
    );

    // La rama activa sigue siendo develop (el script fake no la cambio).
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
    await rm(fakeScriptsDir, { recursive: true, force: true });
  });
});

test('taskctl start: rechaza una tarea en "planificada" (no ha pasado por plan) sin tocar Git ni mover nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'planificada' }), '');

    await assert.rejects(
      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      StateMachineError
    );

    // No debe haberse creado ninguna rama nueva.
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    // La tarea sigue en 00-planificadas, no se movio.
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'planificada');
  });
});

test('taskctl start: rechaza una tarea de complejidad media sin plan_aprobado', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ complejidad: 'media', plan_aprobado: false }),
      ''
    );

    await assert.rejects(
      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      StateMachineError
    );
  });
});

// --- checkpoint humano obligatorio para TODAS las complejidades ------
// Decision #1 de la seccion 14, implementada en TASK-016. Antes
// `trivial` y `simple` estaban eximidas y arrancaban sin pasar por
// "approve"; estos dos tests fijan la inversion de esa expectativa. El
// par importa: sin el segundo, romper "start" entero (que rechazara
// SIEMPRE) daria el mismo verde que implementar la regla bien.

for (const complejidad of ['trivial', 'simple'] as const) {
  test(`taskctl start: ${complejidad} SIN plan_aprobado se rechaza (el checkpoint ya no exime a nadie)`, async () => {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await writeTareaFile(tareasRoot, sampleTask({ complejidad, plan_aprobado: false }), '');
      commitAll(repoRoot, 'tarea(TASK-500): sin aprobar');

      await assert.rejects(
        () =>
          runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
            repoCwd: repoRoot,
            scriptsDir: SCRIPTS_DIR,
          }),
        (e: unknown) => {
          assert.ok(e instanceof StateMachineError);
          assert.match(e.message, /taskctl approve/);
          return true;
        }
      );

      // No se movio ni se creo la rama: el rechazo es antes de tocar Git.
      const read = await readTareaFile(tareasRoot, 'TASK-500');
      assert.equal(read?.task.estado, 'en-diseno');
      assert.equal(
        spawnSync('git', ['branch', '--show-current'], {
          cwd: repoRoot,
          encoding: 'utf8',
        }).stdout.trim(),
        'develop'
      );
    });
  });

  test(`taskctl start: ${complejidad} CON plan_aprobado arranca con normalidad`, async () => {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await writeTareaFile(tareasRoot, sampleTask({ complejidad, plan_aprobado: true }), '');
      commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

      const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
        repoCwd: repoRoot,
        scriptsDir: SCRIPTS_DIR,
      });

      assert.equal(result.rama, 'feature/task-500-prueba-de-integracion');
      const read = await readTareaFile(tareasRoot, 'TASK-500');
      assert.equal(read?.task.estado, 'en-curso');
    });
  });
}

test('taskctl start: rechaza si el workspace tiene cambios sin commitear, sin invocar el script', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
    // Ensucia el workspace DESPUES de dejar la tarea commiteada, para
    // aislar especificamente el caso "hay cambios sin commitear" del
    // caso (ya cubierto arriba) de que la propia tarea.md este sin
    // commitear.
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'cambios sin commitear\n', 'utf8');

    await assert.rejects(
      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      StartCommandError
    );

    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl start: error claro si el ID no existe, sin efectos secundarios', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runStartCommand(tareasRoot, ['TASK-999'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      StateMachineError
    );
  });
});
