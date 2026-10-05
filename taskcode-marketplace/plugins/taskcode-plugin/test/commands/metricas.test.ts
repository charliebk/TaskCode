/**
 * taskctl metricas (TASK-052) por CLI, contra repos Git temporales reales:
 * el ciclo plan -> approve -> start -> review -> finish deja cada transicion
 * con su instante, metricas la mide desde el registro y, sin registro, desde
 * los commits automaticos (un cambio de asunto en un comando lo pone rojo).
 * Solo lectura: el arbol queda limpio.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, mkdir, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readTareaFile } from '../../src/fs/task-store.js';
import { leerTransiciones, precisionDeFecha } from '../../src/core/transiciones.js';
import {
  ID,
  CONFIG_AUTO,
  git,
  cli,
  cliOk,
  withRepo,
  dirRevision,
  hastaCodigo,
  rellenarInforme,
} from '../helpers/automatico-fixtures.js';

/** La fila de TASK-001 de la tabla, celda a celda. */
function filaDe(salida: string, id = ID): string[] {
  const linea = salida.split('\n').find((l) => l.startsWith(`| ${id} `));
  assert.ok(linea, `no hay fila de ${id} en:\n${salida}`);
  return linea
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

function cabecera(salida: string): string[] {
  const linea = salida.split('\n').find((l) => l.startsWith('| id '));
  assert.ok(linea, salida);
  return linea
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

const DURACION_SEGUNDOS = /^(\d+s|\d+m|\d+h \d{2}m|\d+d \d{2}h)$/;

async function cicloCompleto(repoRoot: string, tareasRoot: string): Promise<void> {
  await hastaCodigo(repoRoot, tareasRoot);
  cliOk(repoRoot, ['review', ID]);
  await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
  cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
  cliOk(repoRoot, ['finish', ID]);
}

test('ciclo completo por CLI: cada transicion con instante y metricas lo mide desde el registro', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await cicloCompleto(repoRoot, tareasRoot);

    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    const filas = leerTransiciones(t.body);
    assert.deepEqual(filas.map((f) => f.fase), ['plan', 'approve', 'start', 'review', 'finish']);
    for (const f of filas) {
      assert.equal(precisionDeFecha(f.fecha), 'segundo', `la fila ${f.fase} no lleva instante: ${f.fecha}`);
    }
    // `actualizado` sigue siendo un dia, y es el de la ultima fila.
    assert.equal(t.task.actualizado, (filas[4] as { fecha: string }).fecha.slice(0, 10));

    const r = cliOk(repoRoot, ['metricas']);
    assert.deepEqual(cabecera(r.stdout), ['id', 'complejidad', 'diseno', 'curso', 'revision', 'rondas', 'cierre', 'origen']);
    const [id, complejidad, diseno, curso, revision, rondas, cierre, origen] = filaDe(r.stdout);
    assert.equal(id, ID);
    assert.equal(complejidad, 'simple');
    for (const d of [diseno, curso, revision]) assert.match(d as string, DURACION_SEGUNDOS);
    assert.equal(rondas, '1');
    assert.equal(cierre, (filas[4] as { fecha: string }).fecha.slice(0, 10));
    assert.equal(origen, 'registro');
    assert.match(r.stdout, /Las pausas no se descuentan/);
    assert.doesNotMatch(r.stdout, /NaN|undefined/);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'metricas no escribe nada');

    // --heuristica: la tarea terminada con informe entra en la muestra.
    const h = cliOk(repoRoot, ['metricas', '--heuristica']);
    assert.deepEqual(cabecera(h.stdout).slice(-2), ['puntos', 'nivel_heuristico']);
    const fila = filaDe(h.stdout);
    assert.match(fila[8] as string, /^\d+$/);
    assert.match(fila[9] as string, /^(trivial|simple|media|alta|critica)$/);
    assert.match(h.stdout, /Muestra: 1 tareas terminadas/);
    assert.match(h.stdout, /Por complejidad declarada:\n {2}simple +n= {2}1 +rondas medias=1\.00/);

    // Sin la seccion de Transiciones (tarea anterior al registro): se mide
    // con los commits chore() reales que dejo cada comando. Si un comando
    // cambia el asunto de su commit, esto deja de reconocerlo.
    const sinRegistro = (await readFile(t.filePath, 'utf8')).replace(/\n## Transiciones[\s\S]*$/, '\n');
    await writeFile(t.filePath, sinRegistro, 'utf8');
    const g = cliOk(repoRoot, ['metricas']);
    const filaGit = filaDe(g.stdout);
    assert.equal(filaGit[7], 'git');
    for (const d of filaGit.slice(2, 5)) assert.match(d, DURACION_SEGUNDOS);
    assert.equal(filaGit[6], cierre);
  });
});

test('metricas: un flag desconocido aborta sin sacar tabla, y --heuristica no lleva valor', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot) => {
    const r = cli(repoRoot, ['metricas', '--heuristic']);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /taskctl metricas: flag desconocido "--heuristic"/);
    assert.match(r.stderr, /Quiza quisiste decir "--heuristica"/);
    assert.equal(r.stdout, '');

    const v = cli(repoRoot, ['metricas', '--heuristica=si']);
    assert.equal(v.status, 1);
    assert.match(v.stderr, /"--heuristica" no lleva valor/);

    const p = cli(repoRoot, ['metricas', 'TASK-001']);
    assert.equal(p.status, 1);
    assert.match(p.stderr, /no admite argumentos sueltos/);

    const vacio = cliOk(repoRoot, ['metricas']);
    assert.match(vacio.stdout, /No hay tareas que medir/);
  });
});

test('metricas fuera de un repo Git: las tareas sin registro salen con "—" y un aviso, sin fallar', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await cicloCompleto(repoRoot, tareasRoot);
    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    // Copia solo tareas/ a un directorio sin .git.
    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-metricas-nogit-'));
    try {
      await mkdir(path.join(fuera, 'tareas'), { recursive: true });
      await cp(tareasRoot, path.join(fuera, 'tareas'), { recursive: true });
      const copia = path.join(fuera, path.relative(repoRoot, t.filePath));
      const sinRegistro = (await readFile(copia, 'utf8')).replace(/\n## Transiciones[\s\S]*$/, '\n');
      await writeFile(copia, sinRegistro, 'utf8');
      const r = cliOk(fuera, ['metricas']);
      assert.match(r.stderr, /\[AVISO\] No se pudo consultar git log/);
      assert.deepEqual(filaDe(r.stdout).slice(2), ['—', '—', '—', '1', '—', '—']);
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });
});
