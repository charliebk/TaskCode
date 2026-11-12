/**
 * TASK-110: `taskctl estado --seguir` como subproceso, con un fichero de
 * progreso que cambia mientras corre. Siempre con un tope de espera y kill:
 * si no sale solo, el test se pone rojo en vez de quedarse colgado.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { TASKCTL } from '../helpers/automatico-fixtures.js';
import { crearProgreso } from '../../src/fs/progreso.js';

const TOPE_MS = 10_000;

async function conRepo(fn: (raiz: string) => Promise<void>): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'estado-seguir-'));
  await mkdir(path.join(raiz, '.git'), { recursive: true });
  await mkdir(path.join(raiz, 'tareas'), { recursive: true });
  try {
    await fn(raiz);
  } finally {
    await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
  }
}

/** Lanza `taskctl estado --seguir` y devuelve su salida cuando sale, o lo mata al tope. */
function seguir(raiz: string, env: NodeJS.ProcessEnv): { fin: Promise<{ codigo: number | null; salida: string; matado: boolean }> } {
  const hijo = spawn(process.execPath, [TASKCTL, 'estado', '--seguir'], { cwd: raiz, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let salida = '';
  hijo.stdout.setEncoding('utf8').on('data', (d: string) => (salida += d));
  let matado = false;
  const tope = setTimeout(() => {
    matado = true;
    hijo.kill();
  }, TOPE_MS);
  return {
    fin: new Promise((resolve) => {
      hijo.on('close', (codigo) => {
        clearTimeout(tope);
        resolve({ codigo, salida, matado });
      });
    }),
  };
}

const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

test('estado --seguir: refresca mientras la fase cambia de paso y sale solo cuando termina', async () => {
  await conRepo(async (raiz) => {
    const p = crearProgreso(raiz);
    p.fase('TASK-110', 'finish', ['verificacion', 'merge']);
    p.paso('verificacion');
    const { fin } = seguir(raiz, { ...process.env, TASKCTL_ESTADO_SEGUIR_SIN_TTY: '1' });
    await esperar(1500);
    p.paso('merge');
    await esperar(1500);
    p.terminar('ok');
    const r = await fin;
    assert.equal(r.matado, false, `no salio solo al terminar la fase:\n${r.salida}`);
    assert.equal(r.codigo, 0);
    const lineas = r.salida.trimEnd().split('\n');
    assert.match(lineas[0] ?? '', /^TASK-110 · finish \(5\/5\) · verificacion \(1\/2\) · 0 min$/);
    assert.ok(lineas.some((l) => /· merge \(2\/2\) ·/.test(l)), `vio el segundo paso:\n${r.salida}`);
    assert.match(lineas[lineas.length - 1] ?? '', /^Nada en marcha · ultima: TASK-110 · finish \(5\/5\) · terminada/);
    assert.equal(new Set(lineas).size, lineas.length, 'solo escribe cuando la linea cambia');
  });
});

test('estado --seguir: sin terminal imprime una sola linea y sale, aunque la fase siga en marcha', async () => {
  await conRepo(async (raiz) => {
    const p = crearProgreso(raiz);
    p.fase('TASK-110', 'review', ['guardas']);
    p.paso('guardas');
    const env = { ...process.env };
    delete env['TASKCTL_ESTADO_SEGUIR_SIN_TTY'];
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [TASKCTL, 'estado', '--seguir'], { cwd: raiz, env, encoding: 'utf8', timeout: TOPE_MS });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(Date.now() - t0 < TOPE_MS - 1000, 'no espero a que la fase terminara');
    assert.match(r.stdout, /^TASK-110 · review \(4\/5\) · guardas \(1\/1\) · 0 min\n$/);
  });
});
