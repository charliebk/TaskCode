/**
 * TASK-110: plan, approve, start, review y finish escriben el progreso visible bajo .git, lo
 * marcan terminado al acabar (tambien al abortar) y NO anaden salida: cada
 * comando se ejecuta en dos repos gemelos, uno donde el progreso no se puede
 * escribir (progreso.json es un directorio), y su stdout, stderr y codigo de
 * salida tienen que ser los mismos. El CLI real por spawn, repos Git reales;
 * el progreso se lee con el lector de produccion, nunca se escribe a mano.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ID,
  CONFIG_AUTO,
  cli,
  cliOk,
  commitAll,
  git,
  withRepo,
  nueva,
  planificar,
  hastaCodigo,
  rellenarInforme,
  dirRevision,
} from '../helpers/automatico-fixtures.js';
import { leerProgreso, rutaProgreso } from '../../src/fs/progreso.js';
import type { EstadoProgreso } from '../../src/core/progreso.js';

/** Un repo donde escribir el progreso falla: progreso.json es un directorio. */
function bloquearProgreso(repoRoot: string): void {
  mkdirSync(rutaProgreso(repoRoot) as string, { recursive: true });
}

const normalizar = (texto: string, repoRoot: string): string =>
  texto
    .split(repoRoot)
    .join('<REPO>')
    .replace(/\b[0-9a-f]{7,40}\b/g, '<SHA>')
    // Los scripts de Git-Flow sellan cada linea con la hora y dicen cuanto tardaron.
    .replace(/\[\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\]/g, '[<HORA>]')
    .replace(/DURACION {2}: \d+s/g, 'DURACION  : <N>s');

/** El mismo comando en los dos gemelos: misma salida y mismo codigo. Devuelve la del repo con progreso. */
function enGemelos(con: string, sin: string, args: string[]) {
  const t0 = Date.now();
  const a = cli(con, args);
  const t1 = Date.now();
  const b = cli(sin, args);
  assert.equal(a.status, b.status, `${args.join(' ')}: mismo codigo con y sin progreso\n${a.stderr}\n${b.stderr}`);
  assert.equal(normalizar(a.stdout, con), normalizar(b.stdout, sin), `${args.join(' ')}: mismo stdout`);
  assert.equal(normalizar(a.stderr, con), normalizar(b.stderr, sin), `${args.join(' ')}: mismo stderr`);
  return { ...a, t0, t1 };
}

function gemelos(fn: (con: string, sin: string, tareasCon: string, tareasSin: string) => Promise<void>): Promise<void> {
  return withRepo(CONFIG_AUTO, (con, tareasCon) =>
    withRepo(CONFIG_AUTO, async (sin, tareasSin) => {
      bloquearProgreso(sin);
      await fn(con, sin, tareasCon, tareasSin);
    })
  );
}

function progresoTerminado(repoRoot: string, fase: string, pasos: string[], t0: number, t1: number, resultado = 'ok'): EstadoProgreso {
  const p = leerProgreso(repoRoot);
  assert.ok(p !== null, `${fase}: hay progreso`);
  assert.equal(p.tarea, ID);
  assert.equal(p.fase, fase);
  assert.deepEqual(p.pasos, pasos);
  assert.equal(p.terminado, true, `${fase}: marcado como terminado`);
  assert.equal(p.resultado, resultado);
  assert.ok(p.inicio >= t0 - 1000 && p.inicio <= t1, `${fase}: inicio ${String(p.inicio)} entre ${String(t0)} y ${String(t1)}`);
  assert.ok(p.fin !== null && p.fin >= p.inicio && p.fin <= t1);
  const estado = cliOk(repoRoot, ['estado']).stdout;
  assert.match(estado, new RegExp(`^Nada en marcha · ultima: ${ID} · ${fase} \\(\\d/5\\) · ${resultado === 'ok' ? 'terminada' : 'abortada'} hace \\d+ min\\n$`));
  return p;
}

test('progreso: plan escribe su fase y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
  await gemelos(async (con, sin) => {
    // Aborta por el enunciado (ya con la fase empezada): no queda "en curso".
    for (const r of [con, sin]) {
      cliOk(r, ['new', '--titulo', 'Sin objetivo', '--tipo', 'feature', '--complejidad', 'simple']);
      if (git(['status', '--porcelain'], r).trim() !== '') commitAll(r, 'docs: sin objetivo');
    }
    const fallo = enGemelos(con, sin, ['plan', ID]);
    assert.equal(fallo.status, 1);
    progresoTerminado(con, 'plan', ['guardas', 'brainstorm', 'commit'], fallo.t0, fallo.t1, 'abortada');
  });
  await gemelos(async (con, sin) => {
    for (const r of [con, sin]) nueva(r, 'feature', 'Progreso de plan');
    const r = enGemelos(con, sin, ['plan', ID]);
    assert.equal(r.status, 0, r.stderr);
    progresoTerminado(con, 'plan', ['guardas', 'brainstorm', 'commit'], r.t0, r.t1);
  });
});

test('progreso: approve escribe su fase y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
  await gemelos(async (con, sin, tareasCon, tareasSin) => {
    for (const r of [con, sin]) {
      nueva(r, 'feature', 'Progreso de approve');
      cliOk(r, ['plan', ID]);
    }
    // Plan sin redactar: approve aborta tras empezar la fase.
    const fallo = enGemelos(con, sin, ['approve', ID]);
    assert.equal(fallo.status, 1);
    progresoTerminado(con, 'approve', ['guardas', 'plan', 'commit'], fallo.t0, fallo.t1, 'abortada');
    for (const [r, t] of [[con, tareasCon], [sin, tareasSin]] as const) {
      await writeFile(path.join(t, '01-en-diseno', ID, 'planificacion', 'plan-final.md'), '# Plan\n\n## Enfoque propuesto\n\nX.\n', 'utf8');
      commitAll(r, 'docs: plan');
    }
    const ok = enGemelos(con, sin, ['approve', ID]);
    assert.equal(ok.status, 0, ok.stderr);
    progresoTerminado(con, 'approve', ['guardas', 'plan', 'commit'], ok.t0, ok.t1);
  });
});

test('progreso: start escribe su fase y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
  await gemelos(async (con, sin, tareasCon, tareasSin) => {
    for (const [r, t] of [[con, tareasCon], [sin, tareasSin]] as const) {
      nueva(r, 'feature', 'Progreso de start');
      await planificar(r, t);
      cliOk(r, ['approve', ID]);
      await writeFile(path.join(r, 'sucio.txt'), 'x\n', 'utf8');
    }
    // Workspace sucio: start aborta tras empezar la fase.
    const fallo = enGemelos(con, sin, ['start', ID]);
    assert.equal(fallo.status, 1);
    progresoTerminado(con, 'start', ['guardas', 'rama', 'commit'], fallo.t0, fallo.t1, 'abortada');
    for (const r of [con, sin]) commitAll(r, 'chore: limpio');
    const ok = enGemelos(con, sin, ['start', ID]);
    assert.equal(ok.status, 0, ok.stderr);
    progresoTerminado(con, 'start', ['guardas', 'rama', 'commit'], ok.t0, ok.t1);
  });
});

test('progreso: review escribe su fase con la ronda y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
  await gemelos(async (con, sin, tareasCon, tareasSin) => {
    for (const [r, t] of [[con, tareasCon], [sin, tareasSin]] as const) {
      await hastaCodigo(r, t);
      await writeFile(path.join(r, 'sucio.txt'), 'x\n', 'utf8');
    }
    const fallo = enGemelos(con, sin, ['review', ID]);
    assert.equal(fallo.status, 1);
    progresoTerminado(con, 'review', ['guardas', 'integracion', 'verificacion', 'peticiones', 'commit'], fallo.t0, fallo.t1, 'abortada');
    for (const r of [con, sin]) commitAll(r, 'chore: limpio');
    const ok = enGemelos(con, sin, ['review', ID]);
    assert.equal(ok.status, 0, ok.stderr);
    const p = progresoTerminado(con, 'review', ['guardas', 'integracion', 'verificacion', 'peticiones', 'commit'], ok.t0, ok.t1);
    assert.equal(p.ronda, 1);
    assert.equal(p.paso, 'commit', 'llego al ultimo paso');
  });
});

test('progreso: finish escribe su fase y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
  await gemelos(async (con, sin, tareasCon, tareasSin) => {
    for (const [r, t] of [[con, tareasCon], [sin, tareasSin]] as const) {
      await hastaCodigo(r, t);
      cliOk(r, ['review', ID]);
      await rellenarInforme(r, path.join(dirRevision(t), 'informe-revision-1.md'));
      cliOk(r, ['veredicto', ID, 'aprobada']);
      await writeFile(path.join(r, 'sucio.txt'), 'x\n', 'utf8');
    }
    const pasos = ['puertas', 'verificacion', 'cobertura', 'held-out', 'merge', 'artefactos'];
    const fallo = enGemelos(con, sin, ['finish', ID]);
    assert.equal(fallo.status, 1);
    progresoTerminado(con, 'finish', pasos, fallo.t0, fallo.t1, 'abortada');
    for (const r of [con, sin]) commitAll(r, 'chore: limpio');
    const ok = enGemelos(con, sin, ['finish', ID]);
    assert.equal(ok.status, 0, ok.stderr);
    const p = progresoTerminado(con, 'finish', pasos, ok.t0, ok.t1);
    assert.equal(p.paso, 'artefactos', 'llego al ultimo paso');
  });
});
