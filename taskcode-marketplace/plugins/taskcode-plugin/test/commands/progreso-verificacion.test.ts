/**
 * TASK-110: el progreso se ve A MITAD de la verificacion, con el x/N que el
 * propio comando escriba en TASKCTL_PROGRESO, que es cuando la
 * persona pregunta. El comando de verificacion es un script propio (fuera del
 * repo) que ejecuta `taskctl estado` y guarda lo que ve en un fichero tambien
 * fuera del repo: dentro del arbol, la guarda de "la verificacion ensucia"
 * haria fallar el test por otra razon. Repos Git reales, scripts de Git-Flow
 * tal cual.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runFinishCommand } from '../../src/commands/finish.js';
import { decidirStop } from '../../src/hooks/freno-stop.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
import { TASKCTL, ID, cliOk, withRepo, hastaCodigo } from '../helpers/automatico-fixtures.js';
import { leerProgreso, rutaContador } from '../../src/fs/progreso.js';

/**
 * Apunta el TASKCTL_PROGRESO que recibe, escribe en el x/N, ejecuta
 * `taskctl estado`, guarda su salida y sale en verde.
 */
const SCRIPT = `
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const ruta = process.env.TASKCTL_PROGRESO;
fs.appendFileSync(process.env.FOTO_SALIDA + '.ruta', String(ruta));
if (ruta) fs.writeFileSync(ruta, '1/10' + String.fromCharCode(10) + '3/10' + String.fromCharCode(10));
const r = spawnSync(process.execPath, [process.env.FOTO_TASKCTL, 'estado'], { encoding: 'utf8' });
fs.appendFileSync(process.env.FOTO_SALIDA, r.stdout);
process.exit(0);
`;

interface Foto {
  comando: string;
  salida: string;
  leer(): string;
  /** El TASKCTL_PROGRESO que vio el comando. */
  ruta(): string;
  /** Un TASKCTL_PROGRESO falso en el entorno de fuera: no puede heredarse ni escribirse. */
  falso: string;
}

/** El script y su fichero de salida, fuera del repo; las variables van por el entorno del proceso (el comando lo hereda). */
async function conFoto(fn: (f: Foto) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'progreso-foto-'));
  await writeFile(path.join(dir, 'foto.cjs'), SCRIPT, 'utf8');
  const salida = path.join(dir, 'salida.txt');
  const falso = path.join(dir, 'contador-falso');
  const antes = { t: process.env['FOTO_TASKCTL'], s: process.env['FOTO_SALIDA'], p: process.env['TASKCTL_PROGRESO'] };
  process.env['FOTO_TASKCTL'] = TASKCTL;
  process.env['FOTO_SALIDA'] = salida;
  process.env['TASKCTL_PROGRESO'] = falso;
  try {
    await fn({
      comando: `node ${path.join(dir, 'foto.cjs').replace(/\\/g, '/')}`,
      salida,
      leer: () => (existsSync(salida) ? readFileSync(salida, 'utf8') : ''),
      ruta: () => (existsSync(`${salida}.ruta`) ? readFileSync(`${salida}.ruta`, 'utf8') : ''),
      falso,
    });
  } finally {
    if (antes.t === undefined) delete process.env['FOTO_TASKCTL'];
    else process.env['FOTO_TASKCTL'] = antes.t;
    if (antes.s === undefined) delete process.env['FOTO_SALIDA'];
    else process.env['FOTO_SALIDA'] = antes.s;
    if (antes.p === undefined) delete process.env['TASKCTL_PROGRESO'];
    else process.env['TASKCTL_PROGRESO'] = antes.p;
    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

test('progreso: durante la verificacion de finish, taskctl estado dice tarea, fase y paso', async () => {
  await conFoto((f) =>
    withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), `comando_verificacion: "${f.comando}"\n`, 'utf8');
      commitAll(repoRoot, 'config');
      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-730' }));
      const r = await runFinishCommand(tareasRoot, ['TASK-730'], '2026-11-12', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
      assert.equal(r.cierre, 'terminada');
      assert.equal(f.leer(), 'TASK-730 · finish (5/5) · verificacion (2/6) 3/10 · 0 min\n');
      assert.equal(f.ruta(), rutaContador(repoRoot), 'el contador vive bajo .git, no el de fuera');
      assert.equal(existsSync(f.falso), false, 'el TASKCTL_PROGRESO de fuera ni se hereda ni se escribe');
    })
  );
});

test('progreso: durante la verificacion del freno Stop, taskctl estado dice tarea y paso', async () => {
  await conFoto(async (f) => {
    const raiz = await mkdtemp(path.join(tmpdir(), 'progreso-freno-'));
    try {
      git(['init', '-q', '-b', 'main'], raiz);
      git(['config', 'user.email', 'test@example.com'], raiz);
      git(['config', 'user.name', 'Test'], raiz);
      const rama = 'feature/task-071-freno';
      const dir = path.join(raiz, 'tareas', '02-en-curso', 'TASK-071');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(sampleTask({ id: 'TASK-071', estado: 'en-curso', rama }), '## Objetivo\nx\n'), 'utf8');
      await mkdir(path.join(raiz, '.taskcode'));
      await writeFile(path.join(raiz, '.taskcode', 'config.yml'), `comando_verificacion: "${f.comando}"\n`, 'utf8');
      git(['add', '-A'], raiz);
      git(['commit', '-q', '-m', 'inicial'], raiz);
      git(['checkout', '-q', '-b', rama], raiz);
      const d = await decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: raiz });
      assert.deepEqual(d, { codigo: 0, stderr: '' });
      assert.equal(f.leer(), 'TASK-071 · freno · verificacion (1/1) 3/10 · 0 min\n');
      assert.equal(f.ruta(), rutaContador(raiz));
      assert.equal(existsSync(f.falso), false);
    } finally {
      await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
    }
  });
});

test('progreso: la verificacion selectiva de review tambien recibe su contador', async () => {
  await conFoto(async (f) => {
    const config = `modo_flujo: automatico\ncomando_verificacion: "node -e 0"\ncomando_verificacion_selectiva: "${f.comando}"\n`;
    await withRepo(config, async (repoRoot, tareasRoot) => {
      await hastaCodigo(repoRoot, tareasRoot);
      cliOk(repoRoot, ['review', ID]);
      assert.equal(f.leer(), `${ID} · review (4/5) · verificacion (3/5) 3/10 · 0 min\n`);
      assert.equal(f.ruta(), rutaContador(repoRoot));
      assert.equal(existsSync(f.falso), false, 'el CLI no deja heredar el TASKCTL_PROGRESO de fuera');
      assert.equal(leerProgreso(repoRoot)?.contador, false, 'al terminar, el contador ya no cuenta');
    });
  });
});
