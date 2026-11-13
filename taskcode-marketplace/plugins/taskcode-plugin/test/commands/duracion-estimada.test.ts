/**
 * TASK-097: regla de una hora. El plan dice su duracion estimada de punta a
 * punta; con mas de una hora (o una cifra que no se entiende) decide una
 * persona en approve, y finish anota la duracion real para calibrar. Repos
 * Git temporales reales y el CLI real por spawn, como el resto de automatico.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readTareaFile } from '../../src/fs/task-store.js';
import {
  ID,
  CONFIG_AUTO,
  commitAll,
  cli,
  cliOk,
  siguiente,
  resumen,
  withRepo,
  nueva,
  codigo,
  dirRevision,
  rellenarInforme,
} from '../helpers/automatico-fixtures.js';

/** Planifica TASK-001 con un plan que dice (o no) su duracion estimada. */
async function planificarCon(repoRoot: string, tareasRoot: string, lineaDuracion: string | null): Promise<void> {
  nueva(repoRoot, 'feature', 'Regla de una hora');
  cliOk(repoRoot, ['plan', ID]);
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
    `# Plan\n\n## Enfoque propuesto\n\n${lineaDuracion === null ? '' : lineaDuracion + '\n\n'}Cambiar app.txt.\n`,
    'utf8'
  );
  commitAll(repoRoot, `docs(${ID}): plan final`);
}

test('regla de una hora: con mas de 60 min, siguiente pregunta y approve automatico se rechaza; una persona puede aprobar', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planificarCon(repoRoot, tareasRoot, 'Duracion estimada: 90 min (senales: 14 ficheros de codigo, 3 capas)');
    const s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['approve', 'preguntar']);
    assert.match(String(s.motivo), /estima 90 min.*regla de una hora.*trocear/s);

    const r = cli(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    assert.notEqual(r.status, 0, 'la aprobacion automatica no puede saltarse la regla');
    assert.match(r.stderr, /no se aprueba como automatico: el plan estima 90 min/);
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.plan_aprobado, false);

    // Decide una persona: aprobar entera (el motivo va en el plan).
    cliOk(repoRoot, ['approve', ID]);
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.plan_aprobado, true);
  });
});

test('regla de una hora: con 60 min o menos no cambia nada (siguiente continua y approve automatico pasa sin aviso)', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planificarCon(repoRoot, tareasRoot, 'Duracion estimada: 60 min');
    assert.deepEqual(resumen(siguiente(repoRoot)), ['approve', 'continuar']);
    const r = cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    assert.doesNotMatch(r.stderr, /duracion estimada/);
  });
});

test('regla de una hora: sin la linea, approve avisa sin bloquear (los planes anteriores no se atascan)', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planificarCon(repoRoot, tareasRoot, null);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['approve', 'continuar']);
    const r = cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    assert.match(r.stderr, /\[AVISO\] TASK-001: el plan no dice su duracion estimada/);
  });
});

test('regla de una hora: una cifra que no se entiende se pregunta, no se da por buena', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planificarCon(repoRoot, tareasRoot, 'Duracion estimada: 1h30');
    const s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['approve', 'preguntar']);
    assert.match(String(s.motivo), /no se entiende \("1h30"\)/);
    assert.notEqual(cli(repoRoot, ['approve', ID, '--decidido-por', 'automatico']).status, 0);
  });
});

test('regla de una hora: finish anota la estimada y la real de punta a punta, y metricas las muestra', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planificarCon(repoRoot, tareasRoot, 'Duracion estimada: 30 min');
    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    cliOk(repoRoot, ['start', ID]);
    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
    cliOk(repoRoot, ['review', ID]);
    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    cliOk(repoRoot, ['finish', ID]);

    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.estado, 'terminada');
    const body = await readFile(t!.filePath, 'utf8');
    assert.match(body, /^## Duracion$/m);
    assert.match(body, /^- Estimada: 30 min$/m);
    assert.match(body, /^- Real \(de la rama abierta al cierre con merge, sin pausas\): \d+ min$/m);
    assert.equal((body.match(/^## Duracion$/gm) ?? []).length, 1, 'una sola seccion');
    // P-1: la linea de cierre convive con las de anotarDuracion en esa misma seccion.
    const seccion = body.slice(body.indexOf('## Duracion')).split(/\r?\n(?=##? )/)[0] as string;
    assert.match(seccion, /^- Estimada: 30 min$/m);
    assert.match(seccion, /^- Cierre \(finish\): \d+ s, de \S+ a \S+$/m);

    const m = cliOk(repoRoot, ['metricas']);
    const cab = m.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
    assert.match(cab, /\| estimada \| finish \| punta_a_punta \| sinc \| freno_n \| freno \|$/);
    const fila = m.stdout.split('\n').find((l) => l.startsWith(`| ${ID} `)) as string;
    assert.match(fila, /\| 30m +\| (\d+s|\d+m) +\| (\d+s|\d+m) +\| — +\| — +\| — +\|$/);
  });
});
