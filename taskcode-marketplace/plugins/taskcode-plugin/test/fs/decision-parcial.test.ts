/**
 * TASK-105: el nivel 2 de la verificacion proporcional en la decision entre
 * refs (`decidirVerificacionEntre`) y la huella de la selectiva. Repos Git
 * temporales de verdad: `develop` con su `.taskcode/config.yml` y la rama de
 * una tarea encima. El comando de la selectiva es un script de node que vive
 * FUERA del repo, para no ensuciar el arbol que se clasifica.
 *
 * Los procesos git se miden con GIT_TRACE2_EVENT (cada proceso deja su evento
 * `start`), como en test/hooks/freno-stop-documentacion.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decidirVerificacionEntre, type ResultadoDecision } from '../../src/fs/decision-documentacion.js';
import {
  contextoSelectiva,
  huellaDeCommit,
  huellaDelArbol,
  leerMemo,
  verificarConMemo,
} from '../../src/fs/verificacion.js';
import { git } from '../helpers/finish-fixtures.js';

const SCRIPT = `require('node:fs').appendFileSync(__dirname + '/cuenta', 'x'); console.log('verde');`;

interface Repo {
  raiz: string;
  fuera: string;
  selectiva: string;
}

function config(fuera: string, conClave: boolean): string {
  const script = path.join(fuera, 'sel.cjs').split(path.sep).join('/');
  return (
    'comando_verificacion: "node -e 0"\n' +
    `comando_verificacion_selectiva: "node ${script}"\n` +
    'timeout_verificacion_selectiva: 123\n' +
    'rutas_documentacion: [docs/**]\n' +
    (conClave ? 'rutas_verificacion_parcial: [src/ui/**]\n' : '')
  );
}

async function conRepo(fn: (r: Repo) => Promise<void>, conClave = true): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'decision-parcial-'));
  const fuera = await mkdtemp(path.join(tmpdir(), 'decision-parcial-fuera-'));
  try {
    await writeFile(path.join(fuera, 'sel.cjs'), SCRIPT, 'utf8');
    git(['init', '-q', '-b', 'develop'], raiz);
    git(['config', 'user.email', 'test@example.com'], raiz);
    git(['config', 'user.name', 'Test'], raiz);
    git(['config', 'core.autocrlf', 'false'], raiz);
    await mkdir(path.join(raiz, '.taskcode'));
    await writeFile(path.join(raiz, '.taskcode', 'config.yml'), config(fuera, conClave), 'utf8');
    await escribir(raiz, 'src/ui/boton.ts', 'export const b = 1;\n');
    await escribir(raiz, 'src/core/calculo.ts', 'export const c = 1;\n');
    await escribir(raiz, 'docs/guia.md', 'guia\n');
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'inicial'], raiz);
    git(['checkout', '-q', '-b', 'feature/task-105'], raiz);
    const script = path.join(fuera, 'sel.cjs').split(path.sep).join('/');
    await fn({ raiz, fuera, selectiva: `node ${script}` });
  } finally {
    await rm(raiz, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
    await rm(fuera, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

async function escribir(raiz: string, rel: string, texto: string): Promise<void> {
  await mkdir(path.dirname(path.join(raiz, rel)), { recursive: true });
  await writeFile(path.join(raiz, rel), texto, 'utf8');
}

async function commitear(r: Repo, ficheros: Record<string, string>): Promise<void> {
  for (const [rel, texto] of Object.entries(ficheros)) await escribir(r.raiz, rel, texto);
  git(['add', '-A'], r.raiz);
  git(['commit', '-q', '-m', 'cambio'], r.raiz);
}

function decision(r: ResultadoDecision | null) {
  assert.ok(r !== null && r.tipo === 'decision', `se esperaba una decision: ${JSON.stringify(r)}`);
  return r;
}

/** Argumentos de cada proceso git que lanzo `fn`, segun GIT_TRACE2_EVENT. */
function procesosGit(r: Repo, fn: () => unknown): string[][] {
  const traza = path.join(r.fuera, `traza-${String(Date.now())}-${String(Math.random()).slice(2)}.json`);
  const antes = process.env['GIT_TRACE2_EVENT'];
  process.env['GIT_TRACE2_EVENT'] = traza;
  try {
    fn();
  } finally {
    if (antes === undefined) delete process.env['GIT_TRACE2_EVENT'];
    else process.env['GIT_TRACE2_EVENT'] = antes;
  }
  if (!existsSync(traza)) return [];
  return readFileSync(traza, 'utf8')
    .split('\n')
    .filter((l) => l.includes('"event":"start"'))
    .map((l) => (JSON.parse(l) as { argv: string[] }).argv.slice(1));
}

const diffs = (procs: string[][]) => procs.filter((p) => p.includes('diff'));
const revParses = (procs: string[][]) => procs.filter((p) => p.includes('rev-parse'));

test('nivel 2 (TASK-105): todo el codigo dentro de rutas_verificacion_parcial da selectiva, con el timeout de la base', async () => {
  await conRepo(async (r) => {
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n', 'docs/guia.md': 'otra\n' });
    const d = decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz));
    assert.equal(d.decision.tipo, 'selectiva', d.decision.motivo);
    assert.equal(d.timeoutSelectivaS, 123);
  });
});

test('nivel 2 (TASK-105): codigo fuera de rutas_verificacion_parcial da la completa y lo nombra', async () => {
  await conRepo(async (r) => {
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n', 'src/core/calculo.ts': 'export const c = 2;\n' });
    const d = decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz));
    assert.equal(d.decision.tipo, 'completa');
    assert.match(d.decision.motivo, /fuera de rutas_verificacion_parcial: src\/core\/calculo\.ts/);
  });
});

test('nivel 2 (TASK-105): si la tarea cambia .taskcode/config.yml, la completa y sin segundo diff', async () => {
  await conRepo(async (r) => {
    const cfg = readFileSync(path.join(r.raiz, '.taskcode', 'config.yml'), 'utf8');
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n', '.taskcode/config.yml': `${cfg}# cambio\n` });
    let d: ResultadoDecision | null = null;
    const procs = procesosGit(r, () => (d = decidirVerificacionEntre('develop', 'HEAD', r.raiz)));
    const res = decision(d);
    assert.equal(res.decision.tipo, 'completa');
    assert.match(res.decision.motivo, /cambia \.taskcode\/config\.yml/);
    assert.equal(diffs(procs).length, 2, `solo el diff del nivel 1: ${JSON.stringify(procs)}`);
  });
});

test('nivel 2 (TASK-105): si el diff no se puede calcular, la completa', async () => {
  await conRepo(async (r) => {
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
    const d = decision(decidirVerificacionEntre('develop', 'no-existe-esta-ref', r.raiz));
    assert.equal(d.decision.tipo, 'completa');
    assert.match(d.decision.motivo, /no se pudo calcular/);
  });
});

test('nivel 2 (TASK-105): sin la clave no se lanza ningun git de mas y la decision es la de la 0.14.0', async () => {
  await conRepo(async (r) => {
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
    let d: ResultadoDecision | null = null;
    const procs = procesosGit(r, () => (d = decidirVerificacionEntre('develop', 'HEAD', r.raiz)));
    const res = decision(d);
    assert.equal(res.decision.tipo, 'completa');
    assert.equal(res.decision.motivo, 'la tarea cambia rutas que no son documentacion: src/ui/boton.ts');
    assert.equal(diffs(procs).length, 2, JSON.stringify(procs));
    assert.equal(revParses(procs).length, 0, JSON.stringify(procs));
  }, false);
  // Contraste: con la clave, la misma medida si ve el rev-parse y el tercer diff.
  await conRepo(async (r) => {
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
    const procs = procesosGit(r, () => decidirVerificacionEntre('develop', 'HEAD', r.raiz));
    assert.equal(diffs(procs).length, 3, JSON.stringify(procs));
    assert.equal(revParses(procs).length, 1, JSON.stringify(procs));
  });
});

test('nivel 2 (TASK-105): los held-out cuentan fuera de las rutas parciales en el guardian', async () => {
  await conRepo(async (r) => {
    await commitear(r, {
      'src/ui/boton.ts': 'export const b = 2;\n',
      'tareas/02-en-curso/TASK-105/aceptacion/caso.test.js': 'x\n',
    });
    const d = decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz, { heldoutComoCodigo: true }));
    assert.equal(d.decision.tipo, 'completa');
    assert.match(d.decision.motivo, /fuera de rutas_verificacion_parcial: .*aceptacion\/caso\.test\.js/);
    // Sin held-out como codigo (finish, Stop), la misma rama es selectiva.
    assert.equal(decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz)).decision.tipo, 'selectiva');
  });
});

test('nivel 2 (TASK-105): con el arbol de trabajo, lo sin commitear tambien cuenta', async () => {
  await conRepo(async (r) => {
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
    await escribir(r.raiz, 'src/ui/nuevo.ts', 'export const n = 1;\n');
    assert.equal(decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz, { conArbol: true })).decision.tipo, 'selectiva');
    await escribir(r.raiz, 'src/core/nuevo.ts', 'export const n = 1;\n');
    const d = decision(decidirVerificacionEntre('develop', 'HEAD', r.raiz, { conArbol: true }));
    assert.equal(d.decision.tipo, 'completa');
    assert.match(d.decision.motivo, /src\/core\/nuevo\.ts/);
  });
});

test('huella (TASK-105): huellaDeCommit con el contexto de la selectiva casa con el memo que guarda verificarConMemo', async () => {
  await conRepo(async (r) => {
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
    const v = verificarConMemo(r.raiz, { tipo: 'selectiva', comando: r.selectiva, timeoutS: 123, base: 'develop' });
    assert.equal(v.resultado.estado, 'verde');
    assert.equal(v.deMemo, false);
    const ctx = contextoSelectiva(r.raiz, 'develop');
    const conCtx = huellaDeCommit(r.raiz, 'HEAD', r.selectiva, 123, ctx);
    assert.ok(conCtx !== null);
    assert.equal(leerMemo(r.raiz, conCtx, 'selectiva')?.estado, 'verde');
    // Sin contexto es la formula de siempre (la de la completa), que no casa con la selectiva.
    const sinCtx = huellaDeCommit(r.raiz, 'HEAD', r.selectiva, 123) as string;
    assert.equal(sinCtx, huellaDelArbol(r.raiz, r.selectiva, 123));
    assert.notEqual(sinCtx, conCtx);
    assert.equal(leerMemo(r.raiz, sinCtx, 'selectiva'), null);
  });
});

test('memo (TASK-105): con el arbol sucio la selectiva se ejecuta pero no se guarda; con el arbol limpio, si', async () => {
  await conRepo(async (r) => {
    await commitear(r, { 'src/ui/boton.ts': 'export const b = 2;\n' });
    const memo = path.join(r.raiz, '.git', 'freno-verificacion-selectiva.json');
    await escribir(r.raiz, 'src/ui/sucio.ts', 'export const s = 1;\n');
    const p = { tipo: 'selectiva' as const, comando: r.selectiva, timeoutS: 123, base: 'develop' };
    assert.equal(verificarConMemo(r.raiz, p).resultado.estado, 'verde');
    assert.equal(existsSync(memo), false, 'con el arbol sucio no se guarda');
    // Y el turno siguiente, identico, la vuelve a ejecutar (decision de Carlos, D-A).
    assert.equal(verificarConMemo(r.raiz, p).deMemo, false);
    assert.equal(readFileSync(path.join(r.fuera, 'cuenta'), 'utf8').length, 2);
    rmSync(path.join(r.raiz, 'src', 'ui', 'sucio.ts'));
    verificarConMemo(r.raiz, p);
    assert.equal(existsSync(memo), true, 'con el arbol limpio se guarda');
    assert.equal(verificarConMemo(r.raiz, p).deMemo, true);
  });
});
