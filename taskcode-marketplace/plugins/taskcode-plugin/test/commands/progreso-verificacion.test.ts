/**
 * TASK-110: el progreso se ve A MITAD de la verificacion, que es cuando la
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
import { TASKCTL } from '../helpers/automatico-fixtures.js';

/** Ejecuta `taskctl estado`, guarda su salida y sale en verde. */
const SCRIPT = `
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const r = spawnSync(process.execPath, [process.env.FOTO_TASKCTL, 'estado'], { encoding: 'utf8' });
fs.appendFileSync(process.env.FOTO_SALIDA, r.stdout);
process.exit(0);
`;

interface Foto {
  comando: string;
  salida: string;
  leer(): string;
}

/** El script y su fichero de salida, fuera del repo; las variables van por el entorno del proceso (el comando lo hereda). */
async function conFoto(fn: (f: Foto) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'progreso-foto-'));
  await writeFile(path.join(dir, 'foto.cjs'), SCRIPT, 'utf8');
  const salida = path.join(dir, 'salida.txt');
  const antes = { t: process.env['FOTO_TASKCTL'], s: process.env['FOTO_SALIDA'] };
  process.env['FOTO_TASKCTL'] = TASKCTL;
  process.env['FOTO_SALIDA'] = salida;
  try {
    await fn({
      comando: `node ${path.join(dir, 'foto.cjs').replace(/\\/g, '/')}`,
      salida,
      leer: () => (existsSync(salida) ? readFileSync(salida, 'utf8') : ''),
    });
  } finally {
    if (antes.t === undefined) delete process.env['FOTO_TASKCTL'];
    else process.env['FOTO_TASKCTL'] = antes.t;
    if (antes.s === undefined) delete process.env['FOTO_SALIDA'];
    else process.env['FOTO_SALIDA'] = antes.s;
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
      assert.equal(f.leer(), 'TASK-730 · finish (5/5) · verificacion (2/6) · 0 min\n');
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
      assert.equal(f.leer(), 'TASK-071 · freno · verificacion (1/1) · 0 min\n');
    } finally {
      await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
    }
  });
});
