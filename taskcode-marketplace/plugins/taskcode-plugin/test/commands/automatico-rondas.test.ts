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

// TASK-127: regresion. Con tope_rondas: 3 el flujo es el de hasta la 0.15.
test('tope de rondas (tope_rondas: 3): las rondas 1 y 2 con cambios siguen solas, la 3 pregunta', async () => {
  await withRepo(`${CONFIG_AUTO}tope_rondas: 3\n`, async (repoRoot, tareasRoot) => {
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

test('tope de rondas (TASK-127, por defecto 2): la ronda 2 pregunta con tres salidas y cada ronda extra exige su decision en tarea.md', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['review', 'continuar'], 'la ronda 1 sigue sola');
    await codigo(repoRoot, 'correccion 1\n', `fix(${ID}): correccion 1`);
    cliOk(repoRoot, ['review', ID]);
    cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
    const s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['review', 'preguntar'], 'en automatico tambien pregunta');
    assert.deepEqual(
      (s.salidas as { opcion: string }[]).map((x) => x.opcion),
      ['cerrar', 'ronda-extra', 'volver-a-diseno']
    );
    await codigo(repoRoot, 'correccion 2\n', `fix(${ID}): correccion 2`);
    // Sin --ronda-extra, review no abre la ronda 3.
    const sinFlag = cli(repoRoot, ['review', ID]);
    assert.notEqual(sinFlag.status, 0);
    assert.match(sinFlag.stderr + sinFlag.stdout, /tope de rondas \(2\)/);
    // Con el flag pero sin la decision en tarea.md, tampoco: el flag solo no basta.
    const sinDecision = cli(repoRoot, ['review', ID, '--ronda-extra']);
    assert.notEqual(sinDecision.status, 0);
    assert.match(sinDecision.stderr + sinDecision.stdout, /## Rondas extra.*- Ronda 3: /s);
    const tareaMd = path.join(tareasRoot, '03-en-revision', ID, 'tarea.md');
    await writeFile(tareaMd, `${await readFile(tareaMd, 'utf8')}\n## Rondas extra\n- Ronda 3: Carlos, falta cerrar el IMP-1\n`, 'utf8');
    cliOk(repoRoot, ['review', ID, '--ronda-extra']);
    cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['review', 'preguntar'], 'la ronda extra vuelve a preguntar');
    await codigo(repoRoot, 'correccion 3\n', `fix(${ID}): correccion 3`);
    // La linea de la ronda 3 no vale para la 4.
    const cuarta = cli(repoRoot, ['review', ID, '--ronda-extra']);
    assert.notEqual(cuarta.status, 0);
    assert.match(cuarta.stderr + cuarta.stdout, /- Ronda 4: /);
  });
});

// IMP-1 de la revision de TASK-127: el tope sale de la config de la rama base.
// Subirlo en la rama de la tarea (sin tocar develop) no cambia nada.
test('tope de rondas (TASK-127): la rama de la tarea no puede subirse el tope; manda el de develop', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), `${CONFIG_AUTO}tope_rondas: 5\n`, 'utf8');
    commitAll(repoRoot, `chore(${ID}): la rama se sube el tope`);
    for (const ronda of [1, 2]) {
      cliOk(repoRoot, ['review', ID]);
      cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
      if (ronda === 1) await codigo(repoRoot, 'correccion 1\n', `fix(${ID}): correccion 1`);
    }
    assert.deepEqual(resumen(siguiente(repoRoot)), ['review', 'preguntar'], 'siguiente usa el tope de develop (2)');
    await codigo(repoRoot, 'correccion 2\n', `fix(${ID}): correccion 2`);
    const r = cli(repoRoot, ['review', ID]);
    assert.notEqual(r.status, 0, 'review usa el tope de develop (2), no el 5 de la rama');
    assert.match(r.stderr + r.stdout, /tope de rondas \(2\)/);
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
