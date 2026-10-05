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

test('taskctl finish (feature): el caso normal — la tarea vive en develop en una carpeta anterior del ciclo — NO dispara la colision de linaje', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Flujo real del metodo: la tarea nace en develop (01-en-diseno)...
    const enDiseno = sampleTask({
      id: 'TASK-714',
      estado: 'en-diseno',
      rama: 'feature/task-714-normal',
    });
    await writeTareaFile(tareasRoot, enDiseno, '');
    commitAll(repoRoot, 'TASK-714 en diseno en develop');

    // ...y su rama (que SI comparte ese commit como ancestro) la mueve
    // por el ciclo hasta en-revision.
    const task = sampleTask({ id: 'TASK-714', estado: 'en-revision', rama: 'feature/task-714-normal' });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    git(['rm', '-r', '-q', 'tareas/01-en-diseno/TASK-714'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-714', 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), VEREDICTO_APROBADO, 'utf8');
    commitAll(repoRoot, 'TASK-714 revisada en su rama');

    const result = await runFinishCommand(tareasRoot, ['TASK-714'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.match(result.filePath, /04-terminadas[/\\]TASK-714/);
    // Y sin duplicados en develop: solo la copia terminada.
    const read = await readTareaFile(tareasRoot, 'TASK-714');
    assert.equal(read?.task.estado, 'terminada');
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-714')));
    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-714')));
  });
});

test('taskctl finish: desde una rama que no ve la tarea, el mensaje dice cambiarse a la rama (no usar import) — hallazgo MENOR de revision', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // La tarea existe solo en su rama; nosotros estamos en develop.
    const task = sampleTask({ id: 'TASK-715', rama: 'feature/task-715-otra' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    git(['checkout', '-q', 'develop'], repoRoot);

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-715'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match((e as Error).message, /cambiate a esa rama/);
        assert.doesNotMatch((e as Error).message, /import/);
        return true;
      }
    );
  });
});

test('taskctl finish: un CHANGELOG artesanal sin "Sin publicar" recibe la seccion ARRIBA, no al final (hallazgo MENOR de revision)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeFile(
      path.join(repoRoot, 'CHANGELOG.md'),
      '# Historial\n\n## v1.2.0\n\n- cosa nueva\n\n## v1.1.0\n\n- cosa vieja\n',
      'utf8'
    );
    const task = sampleTask({ id: 'TASK-716', rama: 'feature/task-716-changelog' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    await runFinishCommand(tareasRoot, ['TASK-716'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
    assert.match(changelog, /TASK-716/);
    assert.ok(
      changelog.indexOf('## Sin publicar') < changelog.indexOf('## v1.2.0'),
      'la seccion nueva debe quedar por encima de las versiones viejas'
    );
    assert.match(changelog, /- cosa vieja/);
  });
});

test('taskctl finish: repetirlo sobre una tarea terminada dice que ya esta terminada, sin aconsejar taskctl review', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-717', rama: 'feature/task-717-doble' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await runFinishCommand(tareasRoot, ['TASK-717'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'cierre de TASK-717');

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-717'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /ya esta terminada/);
        assert.doesNotMatch((e as Error).message, /taskctl review/);
        return true;
      }
    );
  });
});

test('taskctl finish: rechaza sin revision aprobada (veredicto PENDIENTE), sin tocar Git', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-705', rama: 'feature/task-705-pendiente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, {
      veredicto: '- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n',
    });

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-705'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StateMachineError
    );

    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
    const read = await readTareaFile(tareasRoot, 'TASK-705');
    assert.equal(read?.task.estado, 'en-revision');
  });
});
