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

test('taskctl review: rechaza una tarea que no esta en-curso, sin tocar Git ni carpetas', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ estado: 'en-diseno', plan_aprobado: true });
    await writeTareaFile(tareasRoot, task, '');
    commitAll(repoRoot, 'tarea en diseno');

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /taskctl start/);
        return true;
      }
    );

    // Nada se movio ni se creo: sin 03-en-revision, sin revision/.
    const branch = git(['branch', '--show-current'], repoRoot).trim();
    assert.equal(branch, 'develop');
    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision')));
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-600', 'revision')));
    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl review: rechaza con el workspace sucio, sin invocar el script', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      ReviewCommandError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-curso');
    // El update no llego a ejecutarse: develop no esta mergeada.
    const log = git(['log', '--oneline'], repoRoot);
    assert.doesNotMatch(log, /update\(feature\)/);
  });
});

test('taskctl review: si el script falla (conflicto de merge real), no mueve la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    // Conflicto real: la rama y develop cambian la MISMA linea del README.
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    await writeFile(path.join(repoRoot, 'README.md'), '# version de la rama\n', 'utf8');
    commitAll(repoRoot, 'cambio en la rama');
    git(['checkout', '-q', 'develop'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# version de develop\n', 'utf8');
    commitAll(repoRoot, 'cambio en develop');
    git(['checkout', '-q', task.rama], repoRoot);

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof ReviewCommandError);
        assert.match((e as Error).message, /conflicto/);
        return true;
      }
    );

    // La tarea sigue en-curso y sin revision/ — el conflicto queda en
    // el workspace para resolver a mano (comportamiento del script).
    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-curso');
    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision')));
  });
});

test('taskctl review: script con exit 0 que NO mergea la base -> evidencia lo detecta y no mueve nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    await advanceDevelop(repoRoot, task.rama);

    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-update-'));
    await writeFile(
      path.join(fakeScriptsDir, 'update-feature.sh'),
      '#!/usr/bin/env bash\nexit 0\n',
      'utf8'
    );

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: fakeScriptsDir,
        }),
      (e: unknown) => {
        assert.ok(e instanceof ReviewCommandError);
        assert.match((e as Error).message, /is-ancestor/);
        return true;
      }
    );

    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-curso');
    await rm(fakeScriptsDir, { recursive: true, force: true });
  });
});

test('taskctl review: una segunda ronda numera peticion e informe como -2 sin pisar la ronda anterior', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    // Restos commiteados de una ronda anterior (como los dejaria un
    // ciclo review -> cambios-solicitados -> vuelta a en-curso).
    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(path.join(revisionDir, 'peticion-revision-1.md'), 'ronda anterior\n', 'utf8');
    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), 'informe anterior\n', 'utf8');
    commitAll(repoRoot, 'restos de la ronda 1');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.ronda, 2);
    assert.match(result.informes[0]!.peticionPath, /peticion-revision-2\.md$/);
    // La ronda anterior sigue intacta (se movio con la carpeta).
    const anterior = await readFile(
      path.join(tareasRoot, '03-en-revision', 'TASK-600', 'revision', 'peticion-revision-1.md'),
      'utf8'
    );
    // Normalizado: el fichero pasa por un checkout de Git durante el
    // update y con core.autocrlf=true puede volver con CRLF.
    assert.equal(anterior.split('\r\n').join('\n'), 'ronda anterior\n');
  });
});

test('taskctl review: un diff mayor que 1 MB no revienta el comando (hallazgo IMPORTANTE de revision: ENOBUFS)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    // ~1.8 MB de contenido nuevo: por encima del maxBuffer default de
    // spawnSync (1 MB), que era lo que mataba a git con ENOBUFS.
    const lineas = Array.from({ length: 60_000 }, (_, i) => `linea generada numero ${i}`);
    await writeFile(path.join(repoRoot, 'generado-grande.txt'), lineas.join('\n') + '\n', 'utf8');
    commitAll(repoRoot, 'fichero grande en la rama');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
    assert.match(peticion, /generado-grande\.txt/);
    assert.ok(peticion.length > 1024 * 1024, 'la peticion deberia contener el diff completo');
  });
});

test('taskctl review: si el movimiento de carpeta falla, la tarea sigue en-curso y la peticion ya escrita permite reintentar (hallazgo IMPORTANTE de revision: orden escritura-antes-de-mover)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    await advanceDevelop(repoRoot, task.rama);
    // Fuerza el fallo del rename: la carpeta de destino ya existe
    // (TaskFolderConflictError, fail-closed de moveTareaFile).
    await mkdir(path.join(tareasRoot, '03-en-revision', 'TASK-600'), { recursive: true });

    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => (e as Error).name === 'TaskFolderConflictError'
    );

    // La tarea NO cambio de estado (sin callejon sin salida), y la
    // peticion quedo escrita en la carpeta actual: un reintento tras
    // limpiar el conflicto usa la ronda siguiente sin pisar nada.
    const read = await readTareaFile(tareasRoot, 'TASK-600');
    assert.equal(read?.task.estado, 'en-curso');
    await stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision', 'peticion-revision-1.md'));
  });
});

test('taskctl review: un diff cuyo contexto contiene vallas de backticks no rompe la peticion (hallazgo MENOR de revision)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    // El caso peligroso son las lineas de CONTEXTO del diff (prefijo
    // espacio, tolerado por CommonMark como sangria de cierre): el doc
    // con vallas de 4 backticks vive en develop y la rama modifica una
    // linea adyacente para que las vallas salgan como contexto del hunk.
    // Las lineas anadidas (+) no pueden cerrar una valla: un fichero
    // nuevo no reproduce el bug.
    const conVallas = 'texto\n' + '````\n' + 'bloque con valla de cuatro\n' + '````\n';
    await writeFile(path.join(repoRoot, 'doc-con-vallas.md'), conVallas, 'utf8');
    commitAll(repoRoot, 'doc con vallas en develop');
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    await writeFile(
      path.join(repoRoot, 'doc-con-vallas.md'),
      'texto modificado\n' + conVallas.slice('texto\n'.length),
      'utf8'
    );
    commitAll(repoRoot, 'la rama modifica la linea adyacente a las vallas');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // La valla elegida supera a la mas larga del contenido embebido:
    // el bloque del diff no puede cerrarse antes de tiempo.
    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
    assert.match(peticion, /`````diff/);
  });
});
