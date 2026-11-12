#!/usr/bin/env node
/**
 * Perfil de la suite de tests — TASK-122.
 *
 * Corre cada fichero de test compilado (`dist/test/**\/*.test.js`) en su propio
 * `node --test` y anota cuanto tarda, cuantos tests tiene y cuantos procesos
 * `git` lanza. Sirve para ver que ficheros pagan Git real y cuales podrian
 * probarse sin el (regla de la piramide de docs/contexto/CONVENCIONES.md).
 *
 * Como se cuentan los `git`: solo en esta ejecucion de medida (la suite no lo
 * ve), un directorio temporal va delante en el PATH con un envoltorio `git`
 * (script de shell) que anota cada llamada y ejecuta el git real. En Linux eso
 * lo ve todo. En Windows `spawnSync('git')` sin shell solo busca `git.exe`, asi
 * que ademas se precarga (NODE_OPTIONS --require) un modulo que anota las
 * llamadas a `git` desde node; el envoltorio de shell cubre las que hacen los
 * scripts de bash (Git-Flow). Ninguna llamada se cuenta dos veces.
 *
 * Uso (desde la raiz del repo):
 *   node scripts/perfil-tests.mjs [--dir <plugin>] [--filtro test/commands]
 *        [--concurrencia N] [--sin-build] [--json] [--salida informe.md]
 *
 * Con --concurrencia > 1 los ficheros corren a la vez: las duraciones se
 * inflan, pero el orden relativo y el recuento de git no cambian.
 * Cero dependencias: node >= 22.
 */
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = 'taskcode-marketplace/plugins/taskcode-plugin';
const WIN = process.platform === 'win32';

function opciones(argv) {
  const o = { dir: null, filtro: null, concurrencia: 1, sinBuild: false, json: false, salida: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') o.dir = argv[++i];
    else if (a === '--filtro') o.filtro = argv[++i];
    else if (a === '--concurrencia') o.concurrencia = Math.max(1, Number(argv[++i]) || 1);
    else if (a === '--sin-build') o.sinBuild = true;
    else if (a === '--json') o.json = true;
    else if (a === '--salida') o.salida = argv[++i];
    else throw new Error(`argumento desconocido: ${a}`);
  }
  return o;
}

function gitReal() {
  const r = WIN
    ? spawnSync('where', ['git'], { encoding: 'utf8' })
    : spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' });
  const ruta = (r.stdout ?? '').split(/\r?\n/).map((l) => l.trim()).find((l) => l !== '' && (!WIN || /\.exe$/i.test(l)));
  if (ruta === undefined) throw new Error('no encuentro el git real en el PATH');
  return ruta;
}

const HOOK_NODE = `
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const log = process.env.PERFIL_GIT_LOG;
const esGit = (c, shell) => {
  if (typeof c !== 'string') return false;
  if (shell) return /^\\s*"?git(\\.exe)?"?(\\s|$)/i.test(c);
  return /^git(\\.exe)?$/i.test(path.basename(c));
};
const anotar = () => { try { fs.appendFileSync(log, 'node\\n'); } catch {} };
for (const nombre of ['spawn', 'spawnSync', 'execFile', 'execFileSync']) {
  const orig = cp[nombre];
  cp[nombre] = function (c, a, o) {
    const opts = Array.isArray(a) ? o : a;
    if (esGit(c, opts && typeof opts === 'object' && opts.shell)) anotar();
    return orig.apply(this, arguments);
  };
}
for (const nombre of ['exec', 'execSync']) {
  const orig = cp[nombre];
  cp[nombre] = function (c) { if (esGit(c, true)) anotar(); return orig.apply(this, arguments); };
}
require('node:module').syncBuiltinESMExports();
`;

/** Prepara el directorio del envoltorio y devuelve el entorno de medida. */
function entornoDeMedida(dirTmp) {
  const real = gitReal().replace(/\\/g, '/');
  const envoltorio = path.join(dirTmp, 'git');
  writeFileSync(envoltorio, `#!/bin/sh\necho sh >> "$PERFIL_GIT_LOG"\nexec "${real}" "$@"\n`);
  chmodSync(envoltorio, 0o755);
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const clavePath = Object.keys(env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
  env[clavePath] = `${dirTmp}${path.delimiter}${env[clavePath] ?? ''}`;
  if (WIN) {
    const hook = path.join(dirTmp, 'contar-git.cjs');
    writeFileSync(hook, HOOK_NODE);
    env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ''} --require "${hook.replace(/\\/g, '/')}"`.trim();
  }
  return env;
}

function ficherosDeTest(dirPlugin, filtro) {
  const base = path.join(dirPlugin, 'dist', 'test');
  const sub = filtro === null ? base : path.join(dirPlugin, 'dist', filtro);
  const salida = [];
  const recorrer = (d) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d)) {
      const abs = path.join(d, n);
      if (statSync(abs).isDirectory()) recorrer(abs);
      else if (n.endsWith('.test.js')) salida.push(abs);
    }
  };
  recorrer(sub);
  return salida.sort();
}

function correrFichero(dirPlugin, fichero, env, dirTmp, indice) {
  const log = path.join(dirTmp, `git-${String(indice)}.log`);
  writeFileSync(log, '');
  const inicio = Date.now();
  return new Promise((resolve) => {
    const hijo = spawn(process.execPath, ['--test', '--test-reporter=tap', fichero], {
      cwd: dirPlugin,
      env: { ...env, PERFIL_GIT_LOG: log },
      windowsHide: true,
    });
    let salida = '';
    hijo.stdout.on('data', (d) => (salida += d));
    hijo.stderr.on('data', () => {});
    hijo.on('close', (codigo) => {
      const num = (clave) => Number(new RegExp(`^# ${clave} (\\d+)`, 'm').exec(salida)?.[1] ?? 0);
      const lineas = readFileSync(log, 'utf8').split('\n').filter(Boolean);
      resolve({
        fichero: path.relative(dirPlugin, fichero).replace(/\\/g, '/').replace(/^dist\//, '').replace(/\.js$/, '.ts'),
        segundos: Math.round((Date.now() - inicio) / 100) / 10,
        tests: num('tests'),
        fallos: num('fail'),
        git: lineas.length,
        codigo,
      });
    });
  });
}

export function formatearInforme(filas, contexto) {
  const total = filas.reduce((s, f) => s + f.segundos, 0);
  const git = filas.reduce((s, f) => s + f.git, 0);
  const cab = [
    `Ficheros: ${String(filas.length)}. Tests: ${String(filas.reduce((s, f) => s + f.tests, 0))}. ` +
      `Suma de duraciones: ${(total / 60).toFixed(1)} min. Procesos git: ${String(git)}.`,
    contexto,
    '',
    '| # | fichero | s | tests | git | git/test | fallos |',
    '|---|---|---|---|---|---|---|',
  ];
  const cuerpo = [...filas]
    .sort((a, b) => b.segundos - a.segundos)
    .map(
      (f, i) =>
        `| ${String(i + 1)} | ${f.fichero} | ${String(f.segundos)} | ${String(f.tests)} | ${String(f.git)} | ` +
        `${f.tests === 0 ? '—' : (f.git / f.tests).toFixed(1)} | ${String(f.fallos)} |`
    );
  return [...cab, ...cuerpo, ''].join('\n');
}

async function main(argv) {
  const o = opciones(argv);
  const raiz = (spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout ?? '').trim();
  const dirPlugin = path.resolve(o.dir ?? path.join(raiz, ...PLUGIN.split('/')));
  if (!o.sinBuild) {
    const b = spawnSync('npm run limpiar:test && npm run build', { cwd: dirPlugin, shell: true, stdio: 'inherit' });
    if (b.status !== 0) return 1;
  }
  const ficheros = ficherosDeTest(dirPlugin, o.filtro);
  const dirTmp = mkdtempSync(path.join(tmpdir(), 'perfil-tests-'));
  try {
    const env = entornoDeMedida(dirTmp);
    const filas = [];
    let siguiente = 0;
    const trabajador = async () => {
      while (siguiente < ficheros.length) {
        const i = siguiente++;
        const fila = await correrFichero(dirPlugin, ficheros[i], env, dirTmp, i);
        filas.push(fila);
        if (!o.json) process.stderr.write(`[perfil] ${String(filas.length)}/${String(ficheros.length)} ${fila.fichero}: ${String(fila.segundos)} s, git ${String(fila.git)}\n`);
      }
    };
    await Promise.all(Array.from({ length: o.concurrencia }, trabajador));
    filas.sort((a, b) => a.fichero.localeCompare(b.fichero));
    const contexto =
      `Medido con node ${process.version} en ${process.platform}, concurrencia ${String(o.concurrencia)}` +
      (o.filtro === null ? '' : `, solo ${o.filtro}`) + '.';
    if (o.json) console.log(JSON.stringify({ contexto, filas }, null, 2));
    else {
      const informe = formatearInforme(filas, contexto);
      if (o.salida !== null) writeFileSync(o.salida, informe);
      console.log(informe);
    }
    return filas.some((f) => f.codigo !== 0) ? 1 : 0;
  } finally {
    rmSync(dirTmp, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (c) => (process.exitCode = c),
    (e) => {
      console.error(`[ERROR] perfil-tests: ${e.message}`);
      process.exitCode = 2;
    }
  );
}
