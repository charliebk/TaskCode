/**
 * TASK-082: la autorrevision del implementador antes de `taskctl review`.
 *
 * Contra repos Git temporales de verdad (review-fixtures):
 * - `review` avisa, sin bloquear, si tarea.md no tiene `## Autorrevision`
 *   con contenido, y no avisa si la tiene;
 * - `siguiente --json` da en la fase review las MISMAS revisoras que despues
 *   reparte `review`, calculadas desde la merge base (lo que la base trajo
 *   despues no cuenta).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runSiguienteCommand } from '../../src/commands/siguiente.js';
import {
  HERE,
  SCRIPTS_DIR,
  sampleTask,
  commitAll,
  withTempRepo,
  advanceDevelop,
  escribirFichero,
  setupTaskEnCursoSoloTarea,
} from '../helpers/review-fixtures.js';

const TASKCTL = path.join(HERE, '..', '..', '..', 'bin', 'taskctl');
const AVISO = /no tiene la constancia de la autorrevision/;

/** Rama de la tarea con un fichero Java y otro Angular, y develop avanzado. */
async function tareaConDosDominios(
  repoRoot: string,
  tareasRoot: string,
  id: string,
  cuerpoExtra: string | null
): Promise<void> {
  const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-autorrevision` });
  await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
  await escribirFichero(repoRoot, 'src/main/java/com/acme/UserService.java', 'class UserService {}\n');
  await escribirFichero(
    repoRoot,
    'src/app/user-profile/user-profile.component.ts',
    'export class UserProfileComponent {}\n'
  );
  if (cuerpoExtra !== null) {
    const leida = await readTareaFile(tareasRoot, id);
    await writeTareaFile(tareasRoot, leida!.task, `${leida!.body.trimEnd()}\n\n${cuerpoExtra}`);
  }
  commitAll(repoRoot, 'trabajo de la tarea');
  // develop avanza con un fichero sin dominio: si `siguiente` midiera desde
  // la punta de develop y no desde la merge base, entraria la generica.
  await advanceDevelop(repoRoot, task.rama);
}

const deps = (repoRoot: string) => ({ repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });

test('review sin "## Autorrevision" avisa y no bloquea: la ronda se crea y la tarea pasa a en-revision', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-820', null);
    const result = await runReviewCommand(tareasRoot, ['TASK-820'], '2026-11-07', deps(repoRoot));
    assert.equal(result.avisos.filter((a) => AVISO.test(a)).length, 1, result.avisos.join('\n'));
    assert.equal(result.informes.length, 2);
    const leida = await readTareaFile(tareasRoot, 'TASK-820');
    assert.equal(leida!.task.estado, 'en-revision');
  });
});

test('review con "## Autorrevision" con contenido no avisa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await tareaConDosDominios(
      repoRoot,
      tareasRoot,
      'TASK-821',
      '## Autorrevision\n\n- java-spring-reviewer — abc1234\n- angular-vue-reviewer — abc1234\n'
    );
    const result = await runReviewCommand(tareasRoot, ['TASK-821'], '2026-11-07', deps(repoRoot));
    assert.deepEqual(result.avisos.filter((a) => AVISO.test(a)), []);
  });
});

test('review con el encabezado "## Autorrevision" vacio avisa: el encabezado solo no es constancia', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-822', '## Autorrevision\n\n<!-- una linea por revisora -->\n');
    const result = await runReviewCommand(tareasRoot, ['TASK-822'], '2026-11-07', deps(repoRoot));
    assert.equal(result.avisos.filter((a) => AVISO.test(a)).length, 1);
  });
});

test('CLI: el aviso sale por stderr como [AVISO] y review termina con 0', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-823', null);
    const r = spawnSync(process.execPath, [TASKCTL, 'review', 'TASK-823'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.match(r.stderr, /\[AVISO\] TASK-823: tarea\.md no tiene la constancia de la autorrevision/);
    assert.doesNotMatch(r.stdout, AVISO);
  });
});

test('siguiente --json en fase review da las mismas revisoras que reparte review, desde la merge base', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-824', null);
    const paso = await runSiguienteCommand(tareasRoot, ['TASK-824', '--json'], { repoCwd: repoRoot });
    assert.equal(paso.fase, 'review');
    assert.ok(paso.revisores !== undefined, 'siguiente no da revisores en la fase review');

    const result = await runReviewCommand(tareasRoot, ['TASK-824'], '2026-11-07', deps(repoRoot));
    assert.deepEqual(
      [...paso.revisores].sort(),
      result.informes.map((g) => g.revisor).sort(),
      'siguiente y review no reparten las mismas revisoras'
    );
    assert.deepEqual([...paso.revisores].sort(), ['angular-vue-reviewer', 'java-spring-reviewer']);

    // Fuera de la fase review no hay campo.
    const despues = await runSiguienteCommand(tareasRoot, ['TASK-824', '--json'], { repoCwd: repoRoot });
    assert.notEqual(despues.fase, 'review');
    assert.equal(despues.revisores, undefined);
  });
});

test('siguiente --json desde develop lee las revisoras de la rama de la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-825', null);
    spawnSync('git', ['checkout', '-q', 'develop'], { cwd: repoRoot });
    // En develop la tarea no existe: se crea la copia de la rama base que
    // dejaria start (planificada en develop, en-curso en su rama).
    const task = sampleTask({ id: 'TASK-825', rama: 'feature/task-825-autorrevision' });
    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el enrutado por dominio.\n');
    commitAll(repoRoot, 'copia en develop');
    const paso = await runSiguienteCommand(tareasRoot, ['TASK-825', '--json'], { repoCwd: repoRoot });
    assert.equal(paso.leidaDe, 'rama');
    assert.equal(paso.fase, 'review');
    assert.deepEqual([...(paso.revisores ?? [])].sort(), ['angular-vue-reviewer', 'java-spring-reviewer']);
  });
});
