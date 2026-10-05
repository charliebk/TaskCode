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

// --- TASK-018: enrutado de revisor por diff real, fragmentado por dominio ---
//
// Las rutas de fichero de estos tests se copian EXACTAMENTE de las tablas
// RUTAS_LEGITIMAS/RUTAS_AJENAS de test/skills/revisores.test.ts: esas ya
// prueban a que revisor (o a ninguno) llega cada ruta contra las skills
// reales instaladas con el plugin. Repetir aqui esa clasificacion con
// rutas propias abriria una segunda fuente de verdad que podria divergir
// de la primera; reusar las mismas rutas cierra esa grieta.

test('taskctl review: un diff que toca 1 dominio (java) genera 1 peticion con el agente de ese dominio, no task.agente_revisor', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-620', rama: 'feature/task-620-un-dominio' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {}\n'
    );
    commitAll(repoRoot, 'anade servicio Java');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-620'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // Expectativa cambiada en TASK-034: tarea.md esta en el diff (toda
    // tarea lo commitea en su rama), pero tareas/** ya no se embebe ni se
    // clasifica (excluir_de_revision por defecto). Antes le tocaba al
    // generico una peticion entera solo para tarea.md; ahora no se lanza:
    // un agente revisor menos por tarea de un solo dominio.
    assert.equal(result.informes.length, 1);
    const grupo = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
    assert.ok(grupo !== undefined, 'deberia haber un grupo para java-spring-reviewer');
    assert.notEqual(grupo.revisor, task.agente_revisor);
    assert.match(grupo.peticionPath, /peticion-revision-1-java-spring-reviewer\.md$/);
    assert.match(grupo.informePath, /informe-revision-1-java-spring-reviewer\.md$/);
    assert.deepEqual(grupo.ficheros, ['src/main/java/com/acme/UserService.java']);

    const peticion = await readFile(grupo.peticionPath, 'utf8');
    // TASK-047: agente y skill por separado, y el modelo de la tarea.
    assert.match(peticion, /Skill revisora a cargar: java-spring-reviewer/);
    assert.ok(
      peticion.includes(`Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})`),
      peticion
    );
    assert.equal(result.agente, task.agente_revisor);
    assert.equal(result.modelo, task.modelo_sugerido);
    assert.match(peticion, /UserService\.java/);
    // Desde TASK-034 tarea.md aparece en el --stat de excluidos, pero su
    // diff no se embebe.
    assert.doesNotMatch(peticion, /diff --git a\/tareas\//);

    assert.equal(
      result.informes.find((g) => g.revisor === 'code-quality-reviewer'),
      undefined,
      'tarea.md solo ya no genera una peticion al generico (TASK-034)'
    );
  });
});

test('taskctl review: un diff que toca 2 dominios bajo el umbral genera 2 peticiones, cada una solo con los ficheros de su dominio', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-621', rama: 'feature/task-621-dos-dominios' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {}\n'
    );
    await escribirFichero(
      repoRoot,
      'src/app/user-profile/user-profile.component.ts',
      'export class UserProfileComponent {}\n'
    );
    commitAll(repoRoot, 'anade servicio Java y componente Angular');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-621'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // 2 grupos de dominio. Desde TASK-034 ya no hay un tercero para
    // tarea.md: tareas/** se excluye del diff y de la clasificacion.
    assert.equal(result.informes.length, 2);
    const revisores = result.informes.map((g) => g.revisor).sort();
    assert.deepEqual(revisores, ['angular-vue-reviewer', 'java-spring-reviewer']);

    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
    const grupoAngular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer')!;

    assert.deepEqual(grupoJava.ficheros, ['src/main/java/com/acme/UserService.java']);
    assert.deepEqual(grupoAngular.ficheros, ['src/app/user-profile/user-profile.component.ts']);

    const peticionJava = await readFile(grupoJava.peticionPath, 'utf8');
    assert.match(peticionJava, /UserService\.java/);
    assert.doesNotMatch(peticionJava, /user-profile\.component\.ts/);

    const peticionAngular = await readFile(grupoAngular.peticionPath, 'utf8');
    assert.match(peticionAngular, /user-profile\.component\.ts/);
    assert.doesNotMatch(peticionAngular, /UserService\.java/);
  });
});

test('taskctl review: un diff que toca EXACTAMENTE 3 dominios sigue fragmentando en 3 (umbral inclusive)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-622', rama: 'feature/task-622-tres-dominios' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {}\n'
    );
    await escribirFichero(
      repoRoot,
      'src/app/user-profile/user-profile.component.ts',
      'export class UserProfileComponent {}\n'
    );
    await escribirFichero(repoRoot, 'src/Exporter/IfcExporter.cs', 'class IfcExporter {}\n');
    commitAll(repoRoot, 'toca los tres dominios de una vez');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-622'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // Con el catalogo real (3 revisores de dominio, umbral_dominios: 3),
    // exactamente 3 dominios SIGUE fragmentando: no cae al generico. Los
    // 3 dominios detectados (lo que fija el criterio del umbral). Desde
    // TASK-034 sin generico para tarea.md: tareas/** ya no se clasifica.
    assert.equal(result.informes.length, 3);
    const revisores = result.informes.map((g) => g.revisor).sort();
    assert.deepEqual(revisores, [
      'angular-vue-reviewer',
      'csharp-autocad-ifc-reviewer',
      'java-spring-reviewer',
    ]);
  });
});

test('taskctl review: ficheros que no casan ningun dominio, con 1-3 dominios ya detectados, los cubre TAMBIEN el generico', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-623', rama: 'feature/task-623-mas-generico' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    await escribirFichero(
      repoRoot,
      'src/main/java/com/acme/UserService.java',
      'class UserService {}\n'
    );
    // Ruta ajena congelada en RUTAS_AJENAS (revisores.test.ts): no casa
    // con ningun revisor de dominio. Desde TASK-034 es el UNICO fichero
    // del generico: tarea.md ya no se clasifica.
    await escribirFichero(repoRoot, 'src/index.ts', 'export const arranque = 1;\n');
    commitAll(repoRoot, 'servicio Java mas un fichero sin dominio');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-623'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.informes.length, 2);
    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer');
    assert.ok(grupoJava !== undefined, 'el fichero Java deberia tener su propio grupo');
    assert.ok(
      grupoGenerico !== undefined,
      'los ficheros sin dominio (src/index.ts) deberia cubrirlos el generico, sin quedar sin revisor'
    );
    assert.deepEqual(grupoJava!.ficheros, ['src/main/java/com/acme/UserService.java']);
    assert.deepEqual([...grupoGenerico!.ficheros], ['src/index.ts']);

    const peticionGenerico = await readFile(grupoGenerico!.peticionPath, 'utf8');
    assert.match(peticionGenerico, /src\/index\.ts/);
    assert.doesNotMatch(peticionGenerico, /UserService\.java/);
  });
});

test('taskctl review: un diff sin match de dominio (rutas ajenas y .md) sigue cayendo a un unico generico, igual que antes de TASK-018', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-624', rama: 'feature/task-624-sin-dominio' });
    await setupTaskEnCurso(repoRoot, tareasRoot, task);
    // NestJS: ruta congelada como ajena en RUTAS_AJENAS.
    await escribirFichero(repoRoot, 'src/users/users.module.ts', 'export class UsersModule {}\n');
    await escribirFichero(repoRoot, 'docs/nota.md', '# nota\n');
    commitAll(repoRoot, 'ficheros sin ningun dominio');
    await advanceDevelop(repoRoot, task.rama);

    const result = await runReviewCommand(tareasRoot, ['TASK-624'], '2026-09-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.informes.length, 1);
    assert.equal(result.informes[0]!.revisor, 'code-quality-reviewer');
    // Sin sufijo de dominio: la convencion de siempre, sin fragmentar.
    assert.match(result.informes[0]!.peticionPath, /peticion-revision-1\.md$/);
    assert.match(result.informes[0]!.informePath, /informe-revision-1\.md$/);
  });
});
