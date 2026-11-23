/**
 * TASK-153b: la peticion de revision trae `## Candidatos 4D`, generada desde
 * el diff, contra un repo Git temporal de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { runReviewCommand } from '../../src/commands/review.js';
import { SECCION_CANDIDATOS_4D } from '../../src/core/candidatos-4d.js';
import { definicionesEnRef, GitCommandError } from '../../src/fs/git.js';
import {
  SCRIPTS_DIR,
  sampleTask,
  commitAll,
  withTempRepo,
  escribirFichero,
  setupTaskEnCursoSoloTarea,
} from '../helpers/review-fixtures.js';

test('definicionesEnRef (TASK-153b): sin coincidencias da vacio, pero un fallo real de git no se traga', async () => {
  await withTempRepo(async (repoRoot) => {
    // El repo de la plantilla solo tiene README y .gitignore: ninguna definicion.
    assert.equal(definicionesEnRef('develop', repoRoot), '');
    assert.throws(() => definicionesEnRef('rama-que-no-existe', repoRoot), GitCommandError);
  });
});

test('review (TASK-153b): la peticion lista el helper nuevo parecido a uno que ya existia y el test que promete algo', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // En la base ya hay un lector de secciones.
    await escribirFichero(repoRoot, 'src/core/secciones.ts', 'export function leerSeccionTarea(t: string) {\n  return t;\n}\n');
    commitAll(repoRoot, 'helper existente en develop');

    const task = sampleTask({ id: 'TASK-830', rama: 'feature/task-830-candidatos' });
    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
    // La tarea anade otro casi igual y un test cuyo nombre promete algo.
    await escribirFichero(repoRoot, 'src/commands/otro.ts', 'export function leerSeccionTareas(t: string) {\n  return t.trim();\n}\n');
    await escribirFichero(
      repoRoot,
      'test/otro.test.ts',
      "import { test } from 'node:test';\ntest('otro: no toca el disco si el id es invalido', () => {});\n"
    );
    commitAll(repoRoot, 'trabajo de la tarea');

    const result = await runReviewCommand(tareasRoot, ['TASK-830'], '2026-11-22', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    const peticion = await readFile(path.join(path.dirname(result.filePath), 'revision', 'peticion-revision-1.md'), 'utf8');
    const i = peticion.indexOf(SECCION_CANDIDATOS_4D);
    assert.ok(i !== -1, 'la peticion no trae la seccion de candidatos 4D');
    const seccion = peticion.slice(i, peticion.indexOf('\n## ', i + 1) === -1 ? undefined : peticion.indexOf('\n## ', i + 1));
    assert.match(seccion, /`leerSeccionTareas` \(src\/commands\/otro\.ts:1\) ~ `leerSeccionTarea` \(src\/core\/secciones\.ts:1\)/);
    assert.match(seccion, /«otro: no toca el disco si el id es invalido» \(test\/otro\.test\.ts:2\)/);
  });
});
