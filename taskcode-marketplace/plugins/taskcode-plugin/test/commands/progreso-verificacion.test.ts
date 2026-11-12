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
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runFinishCommand } from '../../src/commands/finish.js';
import { decidirStop } from '../../src/hooks/freno-stop.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
import { TASKCTL, ID, CONFIG_AUTO, cliOk, codigo, withRepo, hastaCodigo } from '../helpers/automatico-fixtures.js';
import { entornoConContador, leerProgreso, rutaContador, VARIABLE_PROGRESO } from '../../src/fs/progreso.js';

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

test('progreso: entornoConContador no deja pasar un TASKCTL_PROGRESO heredado, haya contador o no', () => {
  const base = { PATH: '/bin', [VARIABLE_PROGRESO]: '/fuera/contador-falso' };
  const sin = entornoConContador(base, null);
  assert.equal(Object.prototype.hasOwnProperty.call(sin, VARIABLE_PROGRESO), false, 'sin contador, la variable falsa no pasa');
  assert.equal(sin['PATH'], '/bin', 'el resto del entorno se conserva');
  assert.equal(entornoConContador(base, '/repo/.git/taskcode/progreso-contador')[VARIABLE_PROGRESO], '/repo/.git/taskcode/progreso-contador');
  assert.equal(base[VARIABLE_PROGRESO], '/fuera/contador-falso', 'no toca el entorno de partida');
});

test('progreso: un TASKCTL_PROGRESO de fuera no llega a los hijos del CLI que no son la verificacion (hook de git)', async () => {
  const fuera = await mkdtemp(path.join(tmpdir(), 'progreso-herencia-'));
  try {
    const volcado = path.join(fuera, 'volcado.txt');
    const falso = path.join(fuera, 'contador-falso');
    await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
      await hastaCodigo(repoRoot, tareasRoot);
      // Un hook de git (vive en .git, fuera del arbol) vuelca la variable que ve cada commit del CLI.
      const hook = path.join(repoRoot, '.git', 'hooks', 'post-commit');
      await writeFile(hook, '#!/bin/sh\nprintf "[%s]\\n" "${TASKCTL_PROGRESO-}" >> "$VOLCADO_HERENCIA"\n', 'utf8');
      await chmod(hook, 0o755);
      const r = spawnSync(process.execPath, [TASKCTL, 'review', ID], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, [VARIABLE_PROGRESO]: falso, VOLCADO_HERENCIA: volcado.replace(/\\/g, '/') },
      });
      assert.equal(r.status, 0, r.stderr);
      const lineas = existsSync(volcado) ? readFileSync(volcado, 'utf8').trim().split(/\r?\n/) : [];
      assert.ok(lineas.length > 0, 'el hook se ejecuto en algun commit del CLI');
      assert.deepEqual(lineas.filter((l) => l !== '[]'), [], 'ningun hijo hereda el TASKCTL_PROGRESO de fuera');
      assert.equal(existsSync(falso), false);
    });
  } finally {
    await rm(fuera, { recursive: true, force: true, maxRetries: 5 });
  }
});

/** Un fichero nuevo en la rama de la tarea (activa), commiteado. */
async function enLaRama(repoRoot: string, ruta: string, contenido = 'x\n'): Promise<void> {
  await mkdir(path.dirname(path.join(repoRoot, ruta)), { recursive: true });
  await writeFile(path.join(repoRoot, ruta), contenido, 'utf8');
  commitAll(repoRoot, `cambio en ${ruta}`);
}

/** `trabajo-*.txt` es lo que deja `setupTaskEnRevision` en la raiz: aqui cuenta como documentacion. */
const RUTAS_DOCS = 'rutas_documentacion: [docs/**, trabajo-*.txt]\n';

test('progreso: la comprobacion de documentacion de finish tambien recibe su contador', async () => {
  await conFoto((f) =>
    withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(
        path.join(repoRoot, '.taskcode', 'config.yml'),
        `comando_verificacion: "node -e 0"\n${RUTAS_DOCS}comando_verificacion_documentacion: "${f.comando}"\n`,
        'utf8'
      );
      commitAll(repoRoot, 'config');
      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-732' }));
      await enLaRama(repoRoot, 'docs/guia.md');
      const r = await runFinishCommand(tareasRoot, ['TASK-732'], '2026-11-12', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
      assert.equal(r.cierre, 'terminada');
      assert.equal(f.leer(), 'TASK-732 · finish (5/5) · verificacion (2/6) 3/10 · 0 min\n');
      assert.equal(f.ruta(), rutaContador(repoRoot));
      assert.equal(existsSync(f.falso), false);
    })
  );
});

test('progreso: la verificacion selectiva de finish tambien recibe su contador', async () => {
  await conFoto((f) =>
    withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(
        path.join(repoRoot, '.taskcode', 'config.yml'),
        `comando_verificacion: "node -e 0"\n${RUTAS_DOCS}comando_verificacion_selectiva: "${f.comando}"\nrutas_verificacion_parcial: [src/**]\n`,
        'utf8'
      );
      commitAll(repoRoot, 'config');
      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-733' }));
      await enLaRama(repoRoot, 'src/calculo.ts', 'export const x = 1;\n');
      const r = await runFinishCommand(tareasRoot, ['TASK-733'], '2026-11-12', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
      assert.equal(r.cierre, 'terminada');
      assert.equal(f.leer(), 'TASK-733 · finish (5/5) · verificacion (2/6) 3/10 · 0 min\n');
      assert.equal(f.ruta(), rutaContador(repoRoot));
      assert.equal(existsSync(f.falso), false);
    })
  );
});

test('progreso: en la segunda ronda, review dice "ronda 2" ya durante la verificacion', async () => {
  await conFoto(async (f) => {
    const config = `modo_flujo: automatico\ncomando_verificacion: "node -e 0"\ncomando_verificacion_selectiva: "${f.comando}"\n`;
    await withRepo(config, async (repoRoot, tareasRoot) => {
      await hastaCodigo(repoRoot, tareasRoot);
      cliOk(repoRoot, ['review', ID]);
      cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
      await codigo(repoRoot, 'correccion 1\n', `fix(${ID}): correccion 1`);
      cliOk(repoRoot, ['review', ID]);
      assert.deepEqual(f.leer().split('\n'), [
        `${ID} · review (4/5) · verificacion (3/5) 3/10 · 0 min`,
        `${ID} · review (4/5) · ronda 2 · verificacion (3/5) 3/10 · 0 min`,
        '',
      ]);
    });
  });
});
