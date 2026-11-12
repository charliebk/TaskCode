/**
 * P-1: la fila `finish` de `## Transiciones` lleva el instante de FIN del
 * comando (tras verificacion y merge), no el de inicio, y `## Duracion` anota
 * la linea de cierre. Repos Git temporales de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { leerTransiciones, registrarTransicion } from '../../src/core/transiciones.js';
import { leerCierre } from '../../src/core/cierre.js';
import { SCRIPTS_DIR, sampleTask, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

const INICIO = '2026-11-12T10:00:00Z';
const FIN = '2026-11-12T10:28:30Z';

test('P-1: la fila finish lleva el instante del reloj y ## Duracion la linea de cierre', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-730', rama: 'feature/task-730-cierre' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    // Una fila `start` con hora, para que la duracion real de punta a punta se pueda medir.
    const t0 = await readTareaFile(tareasRoot, 'TASK-730');
    const body = registrarTransicion(t0?.body ?? '', 'start', '2026-11-12T09:00:00Z', 'manual');
    await writeTareaFile(tareasRoot, task, body);
    commitAll(repoRoot, 'chore(TASK-730): fila start');

    await runFinishCommand(tareasRoot, ['TASK-730'], '2026-11-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      ahora: INICIO,
      reloj: () => FIN,
    });

    const fin = await readTareaFile(tareasRoot, 'TASK-730');
    assert.equal(fin?.task.estado, 'terminada');
    const filas = leerTransiciones(fin?.body ?? '');
    const finish = filas.filter((f) => f.fase === 'finish');
    assert.equal(finish.length, 1);
    assert.equal(finish[0]?.fecha, FIN);
    assert.ok(!(fin?.body ?? '').includes(`| ${INICIO} | finish |`));

    assert.match(fin?.body ?? '', /## Duracion\n/);
    assert.match(fin?.body ?? '', /- Cierre \(finish\): 1710 s, de 2026-11-12T10:00:00Z a 2026-11-12T10:28:30Z/);
    assert.deepEqual(leerCierre(fin?.body ?? ''), { inicio: INICIO, fin: FIN, segundos: 1710 });
    // La duracion real llega hasta el fin: 09:00 -> 10:28:30 son 89 o 88 min segun el redondeo, nunca los 60 del inicio.
    const real = /- Real \([^)]*\): (\d+) min/.exec(fin?.body ?? '');
    assert.ok(real !== null && Number(real[1]) >= 88, fin?.body);
  });
});

test('P-1: sin reloj la fila finish lleva ahora, como antes, y la linea de cierre dura 0 s', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-731', rama: 'feature/task-731-sin-reloj' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await runFinishCommand(tareasRoot, ['TASK-731'], '2026-11-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      ahora: INICIO,
    });
    const fin = await readTareaFile(tareasRoot, 'TASK-731');
    const finish = leerTransiciones(fin?.body ?? '').filter((f) => f.fase === 'finish');
    assert.equal(finish[0]?.fecha, INICIO);
    assert.deepEqual(leerCierre(fin?.body ?? ''), { inicio: INICIO, fin: INICIO, segundos: 0 });
  });
});

test('P-1: sin hora (solo today) no se anota cierre y la fila lleva el dia', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-732', rama: 'feature/task-732-solo-dia' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await runFinishCommand(tareasRoot, ['TASK-732'], '2026-11-12', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    const fin = await readTareaFile(tareasRoot, 'TASK-732');
    const finish = leerTransiciones(fin?.body ?? '').filter((f) => f.fase === 'finish');
    assert.equal(finish[0]?.fecha, '2026-11-12');
    assert.equal(leerCierre(fin?.body ?? ''), null);
  });
});
