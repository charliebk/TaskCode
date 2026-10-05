/**
 * Flujo E, modo automatico (TASK-059): ciclo completo sin preguntas, guardas
 * que siguen preguntando (informe fuera de commit propio, tope de rondas,
 * hotfix) y guardas del CLI que abortan tambien en automatico. Repos Git
 * temporales reales y el CLI real por spawn; los fixtures hacen de agentes.
 */
// Parte de los tests de automatico (ver test/helpers/automatico-fixtures.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
import { readTareaFile } from '../../src/fs/task-store.js';
import { leerTransiciones } from '../../src/core/transiciones.js';

import {
  HERE,
  PLUGIN_ROOT,
  TASKCTL,
  ID,
  CONFIG_AUTO,
  git,
  commitAll,
  cli,
  cliOk,
  siguiente,
  resumen,
  plantillasPorConfig,
  withRepo,
  nueva,
  planificar,
  codigo,
  dirRevision,
  hastaCodigo,
  rellenarInforme,
  escribirVeredicto,
} from '../helpers/automatico-fixtures.js';

test('guarda WIP: con otra tarea en curso, start aborta tambien en automatico', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Primera');
    nueva(repoRoot, 'feature', 'Segunda');
    await planificar(repoRoot, tareasRoot, 'TASK-001');
    await planificar(repoRoot, tareasRoot, 'TASK-002');
    cliOk(repoRoot, ['approve', 'TASK-001', '--decidido-por', 'automatico']);
    cliOk(repoRoot, ['approve', 'TASK-002', '--decidido-por', 'automatico']);
    assert.deepEqual(resumen(siguiente(repoRoot, 'TASK-002')), ['start', 'continuar']);
    cliOk(repoRoot, ['start', 'TASK-001']);
    await codigo(repoRoot, 'trabajo 1\n', 'feat(TASK-001): trabajo');

    git(['checkout', '-q', 'develop'], repoRoot);
    const r = cli(repoRoot, ['start', 'TASK-002']);
    assert.notEqual(r.status, 0, `start debia abortar: ${r.stdout}`);
    assert.match(r.stderr, /TASK-001|WIP|limite/i);
    const t = await readTareaFile(tareasRoot, 'TASK-002');
    assert.equal(t?.task.estado, 'en-diseno', 'TASK-002 no se movio');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('finish con el informe sin veredicto (PENDIENTE) aborta aunque siguiente diga veredicto/continuar', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar']);
    const r = cli(repoRoot, ['finish', ID]);
    assert.notEqual(r.status, 0);
    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.estado, 'en-revision');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('revision_codex: true sin segunda opinion: siguiente da codex-review y finish aborta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Con codex');
    // revision_codex se declara en el frontmatter de la tarea antes de planificar.
    const tareaMd = path.join(tareasRoot, '00-planificadas', ID, 'tarea.md');
    const texto = await readFile(tareaMd, 'utf8');
    assert.match(texto, /^revision_codex:\s*false/m);
    await writeFile(tareaMd, texto.replace(/^revision_codex:\s*false/m, 'revision_codex: true'), 'utf8');
    commitAll(repoRoot, `docs(${ID}): revision_codex`);
    await planificar(repoRoot, tareasRoot);
    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    cliOk(repoRoot, ['start', ID]);
    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
    cliOk(repoRoot, ['review', ID]);
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);

    const s = siguiente(repoRoot);
    assert.equal(s.fase, 'codex-review');
    assert.equal(s.comando, `taskctl codex-review ${ID}`);
    const r = cli(repoRoot, ['finish', ID]);
    assert.notEqual(r.status, 0, `finish debia abortar: ${r.stdout}`);
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-revision');
  });
});

test('approve --decidido-por automatico en una tarea planificada en manual aborta', async () => {
  await withRepo('modo_flujo: manual\n', async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Planificada en manual');
    await planificar(repoRoot, tareasRoot);
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), CONFIG_AUTO, 'utf8');
    commitAll(repoRoot, 'chore: config pasa a automatico');

    // La tarea congelo manual en plan: manda su modo, no el config.
    const s = siguiente(repoRoot);
    assert.equal(s.modo, 'manual');
    assert.equal(s.accion, 'detener');

    const r = cli(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    assert.notEqual(r.status, 0, `approve debia abortar: ${r.stdout}`);
    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.plan_aprobado, false);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});
