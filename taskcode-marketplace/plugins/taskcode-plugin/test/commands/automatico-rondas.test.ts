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

test('tope de rondas: las rondas 1 y 2 con cambios siguen solas, la 3 pregunta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    for (const ronda of [1, 2, 3]) {
      cliOk(repoRoot, ['review', ID]);
      assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar'], `ronda ${String(ronda)} sin veredicto`);
      cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
      const s = siguiente(repoRoot);
      assert.equal(s.estado, 'en-revision');
      assert.equal(s.fase, 'review');
      assert.equal(s.accion, ronda < 3 ? 'continuar' : 'preguntar', `ronda ${String(ronda)}`);
      if (ronda < 3) await codigo(repoRoot, `correccion ${String(ronda)}\n`, `fix(${ID}): correccion ${String(ronda)}`);
    }
  });
});

test('hotfix en automatico con revision aprobada en commit propio: finish pregunta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot, 'hotfix');
    assert.match(git(['branch', '--show-current'], repoRoot).trim(), /^hotfix\//);
    cliOk(repoRoot, ['review', ID]);
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    const s = siguiente(repoRoot);
    assert.equal(s.modo, 'automatico');
    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
    assert.equal(s.comando, `taskctl finish ${ID}`);
  });
});
