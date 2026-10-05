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

test('ciclo feature completo en automatico: tras plan nunca se pregunta y cada transicion va en su commit', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Ciclo completo');
    const vistos: Array<Record<string, unknown>> = [];
    const ver = (): Record<string, unknown> => {
      const s = siguiente(repoRoot);
      vistos.push(s);
      return s;
    };

    let s = ver();
    assert.deepEqual([s.fase, s.modo, s.accion], ['plan', 'automatico', 'continuar']);
    await planificar(repoRoot, tareasRoot);

    s = ver();
    assert.deepEqual([s.estado, s.fase, s.accion], ['en-diseno', 'approve', 'continuar']);
    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);

    s = ver();
    assert.deepEqual(resumen(s), ['start', 'continuar']);
    cliOk(repoRoot, ['start', ID]);
    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);

    s = ver();
    assert.deepEqual([s.estado, ...resumen(s)], ['en-curso', 'review', 'continuar']);
    cliOk(repoRoot, ['review', ID]);

    s = ver();
    assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'veredicto', 'continuar']);
    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);

    s = ver();
    assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'finish', 'continuar']);
    cliOk(repoRoot, ['finish', ID]);

    s = ver();
    assert.deepEqual([s.estado, ...resumen(s)], ['terminada', 'terminada', 'detener']);
    assert.ok(
      vistos.every((v) => v.accion !== 'preguntar'),
      `ningun siguiente debia preguntar: ${JSON.stringify(vistos.map(resumen))}`
    );

    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    assert.equal(t.task.estado, 'terminada');
    assert.ok(
      git(['ls-files', path.join(tareasRoot, '04-terminadas', ID, 'tarea.md')], repoRoot).trim().length > 0,
      'la tarea esta en 04-terminadas'
    );
    const rows = leerTransiciones(t.body);
    assert.deepEqual(
      rows.map((r) => r.fase),
      ['plan', 'approve', 'start', 'review', 'finish']
    );
    assert.ok(rows.every((r) => r.modo === 'automatico'));
    const approve = rows.find((r) => r.fase === 'approve');
    assert.equal(approve?.decidido_por, 'automatico');

    // Un commit distinto por transicion: ninguna fila entra en el mismo commit que otra.
    const shas = new Set<string>();
    for (const r of rows) {
      const encontrados = git(
        ['log', '--all', '--format=%H', '-S', `| ${r.fase} | automatico | ${r.decidido_por} |`],
        repoRoot
      )
        .split('\n')
        .filter(Boolean);
      assert.ok(encontrados.length >= 1, `ningun commit anade la fila ${r.fase}`);
      shas.add(encontrados[encontrados.length - 1] as string);
    }
    assert.equal(shas.size, rows.length, 'cada transicion en un commit distinto');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('finish solo sigue solo si lo aprobado es exactamente lo revisado (CRIT-1 e IMP-1 de la revision)', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');

    // IMP-1: sin revisor (plantilla sin rellenar) + taskctl veredicto aprobada → pregunta.
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);

    // Con el informe rellenado por el revisor y commiteado solo: sigue solo.
    await rellenarInforme(repoRoot, informe);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'continuar']);

    // Edicion del informe sin commitear: lo leido no esta en ningun commit → pregunta.
    const commiteado = await readFile(informe, 'utf8');
    await writeFile(informe, commiteado + '\nnota sin commitear\n', 'utf8');
    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
    await writeFile(informe, commiteado, 'utf8');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');

    // MEN-6: un informe reescrito sin linea de revisor tampoco cuenta como revisado.
    await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n\nsin hallazgos\n', 'utf8');
    commitAll(repoRoot, `docs(${ID}): informe sin revisor`);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
  });
});
