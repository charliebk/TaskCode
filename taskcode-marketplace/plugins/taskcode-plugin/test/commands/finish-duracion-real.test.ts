/**
 * P-1: la fila `finish` de `## Transiciones` marca el FIN del cierre (despues de
 * la verificacion y del merge), y `## Duracion` anota `Cierre (finish)`. Repos
 * Git temporales de verdad; la verificacion es un script de node FUERA del repo
 * que tarda ~2 s y sale en verde, para que el tiempo medido sea real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { formatearInstante, leerTransiciones, registrarTransicion } from '../../src/core/transiciones.js';
import { leerCierre } from '../../src/core/cierre.js';
import { calcularFila } from '../../src/core/metricas.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

const SCRIPT = `setTimeout(() => { console.log('todo en verde'); process.exit(0); }, 2000);\n`;

async function conVerificacionLenta(fn: (repoRoot: string, tareasRoot: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(tmpdir(), 'finish-duracion-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      const comando = `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')}`;
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), `comando_verificacion: "${comando}"\n`, 'utf8');
      commitAll(repoRoot, 'config');
      await fn(repoRoot, tareasRoot);
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Anade una fila `start` anterior a la tarea en revision, para que haya punta a punta que medir. */
async function conFilaStart(repoRoot: string, tareasRoot: string, id: string, instante: string): Promise<void> {
  const t = await readTareaFile(tareasRoot, id);
  assert.ok(t);
  await writeTareaFile(tareasRoot, t.task, registrarTransicion(t.body, 'start', instante, 'manual'));
  commitAll(repoRoot, `chore(${id}): fila start`);
}

const ms = (instante: string) => Date.parse(instante);
const filaFinish = (body: string) => {
  const filas = leerTransiciones(body).filter((f) => f.fase === 'finish');
  return filas[filas.length - 1];
};

test('finish (duracion real): la fila finish lleva el FIN, tras la verificacion; Duracion y metricas lo incluyen', async () => {
  await conVerificacionLenta(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-730' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    const inicio = formatearInstante(new Date(Date.now() - 60_000));
    await conFilaStart(repoRoot, tareasRoot, 'TASK-730', inicio);
    const ahora = formatearInstante(new Date());
    await runFinishCommand(tareasRoot, ['TASK-730'], '2026-11-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      ahora,
      reloj: () => formatearInstante(new Date()),
    });
    const fin = await readTareaFile(tareasRoot, 'TASK-730');
    assert.equal(fin?.task.estado, 'terminada');
    const body = fin?.body ?? '';
    const fila = filaFinish(body);
    assert.ok(fila, 'hay fila finish');
    assert.ok(ms(fila.fecha) >= ms(ahora) + 2000, `fila finish ${fila.fecha} >= ${ahora} + 2 s`);
    assert.match(body, /^## Duracion$/m);
    assert.match(body, /^- Cierre \(finish\): \d+ s, de \S+ a \S+$/m);
    const cierre = leerCierre(body);
    assert.ok(cierre);
    assert.ok(cierre.segundos >= 2, `segundos=${cierre.segundos}`);
    assert.equal(cierre.inicio, ahora);
    assert.equal(cierre.fin, fila.fecha);
    const f = calcularFila({ task: fin!.task, body, ronda: 0, eventosGit: [] });
    assert.ok(f.finish, 'columna finish con dato');
    assert.ok(f.finish.valor >= 2000);
    assert.ok(f.puntaAPunta, 'punta a punta medida');
    // start -> fin del cierre: incluye el minuto previo y los 2 s de verificacion.
    assert.equal(f.puntaAPunta.valor, ms(fila.fecha) - ms(inicio));
    assert.ok(f.puntaAPunta.valor >= 62_000);
  });
});

test('finish (duracion real): sin reloj (compatibilidad) la fila usa ahora y el cierre sale con 0 s', async () => {
  await conVerificacionLenta(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-731' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await runFinishCommand(tareasRoot, ['TASK-731'], '2026-11-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      ahora: '2026-11-04T10:00:00Z',
    });
    const body = (await readTareaFile(tareasRoot, 'TASK-731'))?.body ?? '';
    assert.equal(filaFinish(body)?.fecha, '2026-11-04T10:00:00Z');
    assert.match(body, /^- Cierre \(finish\): 0 s, de 2026-11-04T10:00:00Z a 2026-11-04T10:00:00Z$/m);
    assert.deepEqual(leerCierre(body), { inicio: '2026-11-04T10:00:00Z', fin: '2026-11-04T10:00:00Z', segundos: 0 });
  });
});

test('finish (duracion real): en el camino de reintento (rama ya integrada) la fila final tambien lleva el instante del reloj', async () => {
  await conVerificacionLenta(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-732' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--no-ff', '-m', 'merge a mano', task.rama], repoRoot);
    await runFinishCommand(tareasRoot, ['TASK-732'], '2026-11-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      ahora: '2026-11-04T10:00:00Z',
      reloj: () => '2026-11-04T10:05:00Z',
    });
    const body = (await readTareaFile(tareasRoot, 'TASK-732'))?.body ?? '';
    assert.equal(filaFinish(body)?.fecha, '2026-11-04T10:05:00Z');
    assert.deepEqual(leerCierre(body), { inicio: '2026-11-04T10:00:00Z', fin: '2026-11-04T10:05:00Z', segundos: 300 });
  });
});
