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

test('taskctl review: una segunda ronda numera -2 CON sufijo de dominio tras una ronda 1 fragmentada (hallazgo IMPORTANTE-1 de revision, TASK-018)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-625', rama: 'feature/task-625-segunda-ronda-fragmentada' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    // Restos commiteados de una ronda 1 YA fragmentada por dominio (dos
    // revisores, cada uno con su sufijo) — el mismo escenario que dejaria
    // un ciclo review -> cambios-solicitados -> correccion -> review otra
    // vez. Antes de esta tarea, RONDA_FILE_RE no reconocia estos nombres
    // con sufijo y una regresion aqui no la detecta ningun otro test de
    // la suite (informe de revision, IMPORTANTE-1).
    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-625', 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(
      path.join(revisionDir, 'peticion-revision-1-java-spring-reviewer.md'),
      'ronda 1, java\n',
      'utf8'
    );
    await writeFile(
      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
      '- Veredicto: cambios-solicitados\n',
      'utf8'
    );
    await writeFile(
      path.join(revisionDir, 'peticion-revision-1-code-quality-reviewer.md'),
      'ronda 1, generico\n',
      'utf8'
    );
    await writeFile(
      path.join(revisionDir, 'informe-revision-1-code-quality-reviewer.md'),
      '- Veredicto: aprobada\n',
      'utf8'
    );
    commitAll(repoRoot, 'restos de la ronda 1 fragmentada');
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {} // correccion de la ronda 1\n'
    );
    commitAll(repoRoot, 'correccion pedida en la ronda 1');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-625'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // La ronda siguiente es la 2, no la 1: siguienteRonda tuvo que
    // reconocer los nombres CON sufijo de la ronda 1 para no pisarlos.
    assert.equal(result.ronda, 2);
    assert.ok(result.informes.length >= 1);
    for (const grupo of result.informes) {
      assert.match(grupo.peticionPath, /-revision-2(-[a-z0-9-]+)?\.md$/);
      assert.match(grupo.informePath, /-revision-2(-[a-z0-9-]+)?\.md$/);
    }
    // La ronda 1 fragmentada sigue intacta, sin que la ronda 2 la pise.
    await stat(
      path.join(
        tareasRoot,
        '03-en-revision',
        'TASK-625',
        'revision',
        'informe-revision-1-java-spring-reviewer.md'
      )
    );
  });
});

test('taskctl review: error claro si falta el ID o la tarea no existe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runReviewCommand(tareasRoot, [], '2026-09-06', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      ReviewCommandError
    );
    await assert.rejects(
      () =>
        runReviewCommand(tareasRoot, ['TASK-999'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StateMachineError
    );
  });
});

// --- TASK-054: rutas no ASCII y con caracteres de glob ----------------------
//
// Sin core.quotePath=false y -z, Git entrecomillaba y escapaba en octal la
// ruta con tilde: la clasificacion la veia escapada, el pathspec no casaba y
// el diff del fichero no llegaba a la peticion de su dominio. Mutacion que
// lo pone rojo: quitar SIN_COMILLAS o el -z de diffParaRevision.

test('taskctl review: un fichero con tilde llega con su diff a la peticion de su dominio (TASK-054)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-654', rama: 'feature/task-654-no-ascii' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(repoRoot, 'src/main/java/com/acme/Acción.java', 'class Accion { int ñandú; }\n');
    await escribirFichero(
      repoRoot,
      'src/app/user-profile/user-profile.component.ts',
      'export class UserProfileComponent {}\n'
    );
    commitAll(repoRoot, 'java con tilde y angular');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-654'], '2026-10-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    const java = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
    assert.ok(java !== undefined, JSON.stringify(result.informes));
    assert.deepEqual(java.ficheros, ['src/main/java/com/acme/Acción.java']);
    const peticion = await readFile(java.peticionPath, 'utf8');
    assert.ok(peticion.includes('diff --git a/src/main/java/com/acme/Acción.java'), peticion);
    assert.ok(peticion.includes('int ñandú;'), peticion);
    // Ni comillas ni escape octal (`"src/.../Acci\303\263n.java"`).
    assert.ok(!peticion.includes('Acci\\303'), peticion);
    // El otro dominio no se lleva el fichero con tilde.
    const angular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer');
    assert.ok(angular !== undefined);
    assert.doesNotMatch(await readFile(angular.peticionPath, 'utf8'), /Acción\.java/);
  });
});

test('diffParaRevision y diffRangeForPaths: rutas no ASCII sin comillas y rutas de glob como literales (TASK-054)', async () => {
  await withTempRepo(async (repoRoot) => {
    const base = git(['rev-parse', 'HEAD'], repoRoot).trim();
    await escribirFichero(repoRoot, 'src/acción.ts', 'export const a = 1;\n');
    await escribirFichero(repoRoot, 'pages/[id].vue', '<template>id</template>\n');
    await escribirFichero(repoRoot, 'pages/i.vue', '<template>i</template>\n');
    await escribirFichero(repoRoot, 'docs/guía.md', 'texto\n');
    commitAll(repoRoot, 'rutas raras');

    const r = diffParaRevision(base, 'HEAD', ['docs/**'], repoRoot);
    assert.ok(r.incluidos.includes('src/acción.ts'), JSON.stringify(r.incluidos));
    assert.ok(r.incluidos.includes('pages/[id].vue'));
    assert.deepEqual(r.excluidos, ['docs/guía.md']);
    assert.ok(r.diff.includes('diff --git a/src/acción.ts b/src/acción.ts'), r.diff);
    assert.ok(r.stat.includes('docs/guía.md'), r.stat);

    const soloId = diffRangeForPaths(base, 'HEAD', ['pages/[id].vue'], repoRoot);
    assert.ok(soloId.includes('pages/[id].vue'), soloId);
    assert.ok(!soloId.includes('pages/i.vue'), soloId);
    assert.ok(diffRangeForPaths(base, 'HEAD', ['src/acción.ts'], repoRoot).includes('export const a = 1;'));
  });
});
