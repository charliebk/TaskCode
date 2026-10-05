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

test('CRIT-1 (a): codigo commiteado tras pedir la revision y antes del veredicto → finish pregunta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    await codigo(repoRoot, 'codigo posterior a la peticion\n', `feat(${ID}): colado`);
    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    // El informe esta en commits propios y posteriores, pero el codigo no es el revisado.
    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
  });
});

test('CRIT-1 (b): informe commiteado junto a codigo y despues taskctl veredicto → finish pregunta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
    const texto = await readFile(informe, 'utf8');
    await writeFile(
      informe,
      texto
        .replace(/^- Revisor: \(rellenar.*$/m, '- Revisor: revisor de prueba')
        .replace(/^\| \(ej\. IMP-1\).*$/m, '| MEN-1 | MENOR | aceptado | app.txt |'),
      'utf8'
    );
    await writeFile(path.join(repoRoot, 'app.txt'), 'codigo nuevo no revisado\n', 'utf8');
    commitAll(repoRoot, `feat(${ID}): informe y codigo juntos`);
    // taskctl veredicto deja un commit que solo toca el informe, encima del mezclado.
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
  });
});

test('IMP-3: la guarda leida desde develop (tarea en su rama) tambien pregunta con codigo no revisado', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    const rama = git(['branch', '--show-current'], repoRoot).trim();
    git(['checkout', '-q', 'develop'], repoRoot);
    let s = siguiente(repoRoot);
    assert.deepEqual([s.leidaDe, ...resumen(s)], ['rama', 'finish', 'continuar']);
    git(['checkout', '-q', rama], repoRoot);
    await codigo(repoRoot, 'colado tras el veredicto\n', `feat(${ID}): colado`);
    git(['checkout', '-q', 'develop'], repoRoot);
    s = siguiente(repoRoot);
    assert.deepEqual([s.leidaDe, ...resumen(s)], ['rama', 'finish', 'preguntar']);
  });
});
