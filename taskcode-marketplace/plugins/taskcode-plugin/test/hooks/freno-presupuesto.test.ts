/**
 * TASK-125: comando propio del freno Stop (`comando_verificacion_freno`) y su
 * presupuesto (`presupuesto_freno_s`). Repos Git temporales de verdad con una
 * rama base `develop`, la rama de una tarea en curso y un script de node FUERA
 * del repo: cada comando (completa, selectiva, freno) cuenta sus ejecuciones y
 * lee su desenlace (ok, ko, lento) de un fichero.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decidirStop } from '../../src/hooks/freno-stop.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { leerRegistroPuertas } from '../../src/fs/registro-puertas.js';
import { git, sampleTask } from '../helpers/finish-fixtures.js';

const RAMA = 'feature/task-125-freno';
type Comando = 'completa' | 'selectiva' | 'freno';

const SCRIPT = `
const fs = require('node:fs');
const path = require('node:path');
const quien = process.argv[2];
fs.appendFileSync(path.join(__dirname, 'cuenta-' + quien), 'x');
fs.writeFileSync(path.join(__dirname, 'base-' + quien), process.env.RAMA_BASE || '');
const d = fs.readFileSync(path.join(__dirname, 'desenlace'), 'utf8').trim();
if (d === 'ok') { console.log('verde'); process.exit(0); }
if (d === 'lento') { setTimeout(() => process.exit(0), 20000); }
else { console.error('ERROR: 1 test falla'); process.exit(1); }
`;

interface Repo {
  raiz: string;
  ejecuciones(c: Comando): number;
  baseRecibida(c: Comando): string | null;
  desenlace(d: 'ok' | 'ko' | 'lento'): Promise<void>;
}

async function conRepo(extra: string, fn: (r: Repo) => Promise<void>): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'freno-presupuesto-'));
  const fuera = await mkdtemp(path.join(tmpdir(), 'freno-presupuesto-fuera-'));
  try {
    await writeFile(path.join(fuera, 'verif.cjs'), SCRIPT, 'utf8');
    await writeFile(path.join(fuera, 'desenlace'), 'ok', 'utf8');
    const cmd = (c: Comando): string => `node ${path.join(fuera, 'verif.cjs').split(path.sep).join('/')} ${c}`;
    git(['init', '-q', '-b', 'develop'], raiz);
    git(['config', 'user.email', 'test@example.com'], raiz);
    git(['config', 'user.name', 'Test'], raiz);
    git(['config', 'core.autocrlf', 'false'], raiz);
    for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
      await mkdir(path.join(raiz, 'tareas', c), { recursive: true });
      await writeFile(path.join(raiz, 'tareas', c, '.gitkeep'), '', 'utf8');
    }
    const t = sampleTask({ id: 'TASK-125', estado: 'en-curso', rama: RAMA, tipo: 'feature' });
    await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-125'), { recursive: true });
    await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-125', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
    await mkdir(path.join(raiz, '.taskcode'));
    const config =
      `rama_base: develop\ncomando_verificacion: "${cmd('completa')}"\n` +
      `comando_verificacion_selectiva: "${cmd('selectiva')}"\n` +
      extra.replace(/<freno>/g, cmd('freno'));
    await writeFile(path.join(raiz, '.taskcode', 'config.yml'), config, 'utf8');
    await mkdir(path.join(raiz, 'src'));
    await writeFile(path.join(raiz, 'src', 'app.ts'), 'export const a = 1;\n', 'utf8');
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'inicial'], raiz);
    git(['checkout', '-q', '-b', RAMA], raiz);
    // Un cambio de codigo en la rama: el freno tiene algo que verificar.
    await writeFile(path.join(raiz, 'src', 'app.ts'), 'export const a = 2;\n', 'utf8');
    git(['commit', '-q', '-am', 'cambio'], raiz);
    await fn({
      raiz,
      ejecuciones: (c) => {
        const f = path.join(fuera, `cuenta-${c}`);
        return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
      },
      baseRecibida: (c) => {
        const f = path.join(fuera, `base-${c}`);
        return existsSync(f) ? readFileSync(f, 'utf8') : null;
      },
      desenlace: (d) => writeFile(path.join(fuera, 'desenlace'), d, 'utf8'),
    });
  } finally {
    await rm(raiz, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
    await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

function decidir(r: Repo) {
  return decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: r.raiz }, { env: process.env });
}

function freno(r: Repo) {
  return leerRegistroPuertas(r.raiz).filter((l) => l.puerta === 'freno');
}

test('freno (TASK-125): con comando_verificacion_freno corre ese comando, con RAMA_BASE, y no la selectiva ni la completa', async () => {
  await conRepo('comando_verificacion_freno: "<freno>"\n', async (r) => {
    assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
    assert.deepEqual([r.ejecuciones('freno'), r.ejecuciones('selectiva'), r.ejecuciones('completa')], [1, 0, 0]);
    assert.equal(r.baseRecibida('freno'), 'develop');
    assert.deepEqual(
      freno(r).map((l) => [l.modo, l.resultado]),
      [['freno', 'verde']]
    );
    // Su verde no deja memo de la completa ni de la selectiva (no abre el guardian ni finish).
    assert.equal(existsSync(path.join(r.raiz, '.git', 'freno-verificacion.json')), false);
    assert.equal(existsSync(path.join(r.raiz, '.git', 'freno-verificacion-selectiva.json')), false);
    assert.ok(existsSync(path.join(r.raiz, '.git', 'freno-verificacion-rapida.json')));
  });
});

test('freno (TASK-125, regresion): sin la clave nueva corre la selectiva como siempre y sin tope propio', async () => {
  await conRepo('', async (r) => {
    await r.desenlace('ko');
    const d = await decidir(r);
    assert.equal(d.codigo, 2);
    assert.match(d.stderr, /Es la verificacion selectiva/);
    assert.deepEqual([r.ejecuciones('freno'), r.ejecuciones('selectiva'), r.ejecuciones('completa')], [0, 1, 0]);
    assert.deepEqual(
      freno(r).map((l) => [l.modo, l.resultado]),
      [['selectiva', 'rojo']]
    );
  });
});

test('freno (TASK-125): un comando mas lento que el presupuesto se corta, deja parar con una linea y anota excedido', async () => {
  await conRepo('comando_verificacion_freno: "<freno>"\npresupuesto_freno_s: 1\n', async (r) => {
    await r.desenlace('lento');
    const t0 = Date.now();
    const d = await decidir(r);
    assert.ok(Date.now() - t0 < 15000, 'se corta al presupuesto, no espera al comando');
    assert.equal(d.codigo, 0, 'no bloquea');
    assert.equal(d.stderr.split('\n').length, 1, d.stderr);
    assert.match(d.stderr, /supero su presupuesto \(1 s, presupuesto_freno_s\)/);
    assert.deepEqual(
      freno(r).map((l) => [l.modo, l.resultado]),
      [['freno', 'excedido']]
    );
  });
});

test('freno (TASK-125): el presupuesto solo, sin comando propio, corta tambien la verificacion de siempre', async () => {
  await conRepo('presupuesto_freno_s: 1\n', async (r) => {
    await r.desenlace('lento');
    const d = await decidir(r);
    assert.equal(d.codigo, 0);
    assert.equal(r.ejecuciones('selectiva'), 1);
    assert.deepEqual(
      freno(r).map((l) => [l.modo, l.resultado]),
      [['selectiva', 'excedido']]
    );
  });
});

test('freno (TASK-125): un rojo dentro del presupuesto sigue bloqueando el turno', async () => {
  await conRepo('comando_verificacion_freno: "<freno>"\npresupuesto_freno_s: 60\n', async (r) => {
    await r.desenlace('ko');
    const d = await decidir(r);
    assert.equal(d.codigo, 2);
    assert.match(d.stderr, /ERROR: 1 test falla/);
    assert.match(d.stderr, /comando_verificacion_freno/);
    assert.deepEqual(
      freno(r).map((l) => [l.modo, l.resultado]),
      [['freno', 'rojo']]
    );
  });
});

test('freno (TASK-125): un timeout de la selectiva menor que el presupuesto sigue siendo rojo (no excedido)', async () => {
  await conRepo('timeout_verificacion_selectiva: 1\npresupuesto_freno_s: 60\n', async (r) => {
    await r.desenlace('lento');
    const d = await decidir(r);
    assert.equal(d.codigo, 2);
    assert.deepEqual(
      freno(r).map((l) => l.resultado),
      ['rojo']
    );
  });
});
