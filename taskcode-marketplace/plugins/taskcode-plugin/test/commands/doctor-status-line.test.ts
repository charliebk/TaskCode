/**
 * TASK-110: doctor ofrece la status line de Claude Code y solo la instala con
 * un flag explicito, en un settings.json de usuario TEMPORAL (`configClaudeDir`
 * en proceso, CLAUDE_CONFIG_DIR por CLI). Nunca el de la maquina.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runDoctorCommand, DoctorCommandError } from '../../src/commands/doctor.js';
import type { Comprobacion } from '../../src/core/doctor.js';
import { FICHERO_PREVIA } from '../../src/fs/status-line.js';

const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
const AJENA = { type: 'command', command: 'echo mi barra' };
const NUESTRA = { type: 'command', command: 'taskctl estado --stdin' };

interface Entorno {
  dir: string;
  config: string;
  settings: string;
  /** Carpeta con un `taskctl` ejecutable, para el PATH. */
  binSistema: string;
}

async function crearTaskctl(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  if (process.platform === 'win32') {
    await writeFile(path.join(dir, 'taskctl.cmd'), '@echo off\r\n', 'utf8');
  } else {
    await writeFile(path.join(dir, 'taskctl'), '#!/bin/sh\n', 'utf8');
    await chmod(path.join(dir, 'taskctl'), 0o755);
  }
}

async function conEntorno(fn: (e: Entorno) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'doctor-status-line-'));
  const e: Entorno = {
    dir,
    config: path.join(dir, 'claude'),
    settings: path.join(dir, 'claude', 'settings.json'),
    binSistema: path.join(dir, 'bin-sistema'),
  };
  await mkdir(e.config, { recursive: true });
  await crearTaskctl(e.binSistema);
  try {
    await fn(e);
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

function doctor(e: Entorno, args: string[], opts: { path?: string } = {}): Comprobacion {
  const r = runDoctorCommand(args, {
    repoCwd: e.dir,
    configClaudeDir: e.config,
    env: { PATH: opts.path ?? e.binSistema, PATHEXT: '.CMD;.EXE' },
    ahora: new Date(Date.UTC(2026, 10, 12, 10, 0, 0)),
  });
  const c = r.comprobaciones.find((x) => x.id === 'status-line');
  assert.ok(c, 'hay comprobacion status-line');
  return c;
}

const hash = (ruta: string): string => createHash('sha1').update(readFileSync(ruta)).digest('hex');
const leer = (ruta: string): Record<string, unknown> => JSON.parse(readFileSync(ruta, 'utf8')) as Record<string, unknown>;
const copias = (e: Entorno): string[] => readdirSync(e.config).filter((f) => f.endsWith('.bak'));

async function settingsConCentinela(e: Entorno, extra: Record<string, unknown> = {}): Promise<void> {
  await writeFile(e.settings, JSON.stringify({ centinela: { a: [1, 2] }, permissions: { allow: ['Bash(ls)'] }, ...extra }, null, 4), 'utf8');
}

test('status line: sin flag la ofrece y no toca settings.json (ni lo crea); nunca es aviso', async () => {
  await conEntorno(async (e) => {
    const sinFichero = doctor(e, []);
    assert.equal(sinFichero.nivel, 'omitida');
    assert.match(sinFichero.mensaje, /no instalada[\s\S]*taskctl doctor --instalar-status-line/);
    assert.equal(existsSync(e.settings), false, 'sin flag no crea el fichero');

    await settingsConCentinela(e);
    const antes = hash(e.settings);
    assert.equal(doctor(e, []).nivel, 'omitida');
    assert.equal(hash(e.settings), antes, 'sin flag no cambia ni un byte');

    await settingsConCentinela(e, { statusLine: AJENA });
    const ajena = doctor(e, ['--json']);
    assert.equal(ajena.nivel, 'omitida');
    assert.match(ajena.mensaje, /ya tiene otra status line \("echo mi barra"\): no se toca/);

    await settingsConCentinela(e, { statusLine: NUESTRA });
    assert.equal(doctor(e, []).nivel, 'ok');
    assert.deepEqual(copias(e), []);
  });
});

test('status line: con --instalar-status-line la anade, conserva las demas claves, deja copia y es idempotente', async () => {
  await conEntorno(async (e) => {
    await settingsConCentinela(e);
    const c = doctor(e, ['--instalar-status-line']);
    assert.equal(c.nivel, 'ok', c.mensaje);
    assert.match(c.mensaje, /instalada en .*settings\.json \(taskctl estado --stdin; taskctl en .*bin-sistema/);
    const s = leer(e.settings);
    assert.deepEqual(s['statusLine'], NUESTRA);
    assert.deepEqual(s['centinela'], { a: [1, 2] }, 'la clave centinela sigue');
    assert.deepEqual(s['permissions'], { allow: ['Bash(ls)'] });
    assert.deepEqual(copias(e), ['settings.json.20261112T100000Z.bak']);
    assert.deepEqual(JSON.parse(readFileSync(path.join(e.config, 'settings.json.20261112T100000Z.bak'), 'utf8')), {
      centinela: { a: [1, 2] },
      permissions: { allow: ['Bash(ls)'] },
    });
    const despues = hash(e.settings);
    const otra = doctor(e, ['--instalar-status-line']);
    assert.equal(otra.nivel, 'ok');
    assert.match(otra.mensaje, /ya estaba instalada/);
    assert.equal(hash(e.settings), despues, 'la segunda vez no reescribe');
    assert.equal(copias(e).length, 1, 'ni hace otra copia');
  });
});

test('status line: sin settings.json lo crea solo con la status line', async () => {
  await conEntorno(async (e) => {
    assert.equal(doctor(e, ['--instalar-status-line']).nivel, 'ok');
    assert.deepEqual(leer(e.settings), { statusLine: NUESTRA });
    assert.deepEqual(copias(e), []);
  });
});

test('status line: una ajena no se pisa sin --reemplazar-status-line; con el se guarda y desinstalar la devuelve', async () => {
  await conEntorno(async (e) => {
    await settingsConCentinela(e, { statusLine: AJENA });
    const antes = hash(e.settings);
    const rechazo = doctor(e, ['--instalar-status-line']);
    assert.equal(rechazo.nivel, 'error');
    assert.match(rechazo.arreglo ?? '', /--instalar-status-line --reemplazar-status-line/);
    assert.equal(hash(e.settings), antes, 'rechazada: el fichero intacto');

    const c = doctor(e, ['--instalar-status-line', '--reemplazar-status-line']);
    assert.equal(c.nivel, 'ok', c.mensaje);
    assert.match(c.mensaje, /la anterior \("echo mi barra"\) vuelve al desinstalar/);
    assert.deepEqual(leer(e.settings)['statusLine'], NUESTRA);
    assert.deepEqual(leer(path.join(e.config, FICHERO_PREVIA)), { statusLine: AJENA });
    assert.equal(copias(e).length, 1);

    const d = doctor(e, ['--desinstalar-status-line']);
    assert.equal(d.nivel, 'ok', d.mensaje);
    assert.match(d.mensaje, /vuelve la anterior \("echo mi barra"\)/);
    const s = leer(e.settings);
    assert.deepEqual(s['statusLine'], AJENA);
    assert.deepEqual(s['centinela'], { a: [1, 2] });
    assert.equal(existsSync(path.join(e.config, FICHERO_PREVIA)), false);
  });
});

test('status line: desinstalar quita solo la suya; una ajena o ninguna no se tocan', async () => {
  await conEntorno(async (e) => {
    await settingsConCentinela(e, { statusLine: NUESTRA });
    assert.equal(doctor(e, ['--desinstalar-status-line']).nivel, 'ok');
    assert.deepEqual(leer(e.settings), { centinela: { a: [1, 2] }, permissions: { allow: ['Bash(ls)'] } });
    const sinNada = hash(e.settings);
    assert.match(doctor(e, ['--desinstalar-status-line']).mensaje, /no habia ninguna/);
    assert.equal(hash(e.settings), sinNada);
    await settingsConCentinela(e, { statusLine: AJENA });
    const ajena = hash(e.settings);
    const c = doctor(e, ['--desinstalar-status-line']);
    assert.equal(c.nivel, 'ok');
    assert.match(c.mensaje, /no es la de taskctl/);
    assert.equal(hash(e.settings), ajena);
  });
});

test('status line: sin taskctl en el PATH del sistema no se instala, tampoco si solo esta en la carpeta del plugin', async () => {
  await conEntorno(async (e) => {
    await settingsConCentinela(e);
    const antes = hash(e.settings);
    const vacio = path.join(e.dir, 'vacio');
    await mkdir(vacio);
    const c = doctor(e, ['--instalar-status-line'], { path: vacio });
    assert.equal(c.nivel, 'error');
    assert.match(c.mensaje, /taskctl no esta en el PATH/);
    assert.match(c.arreglo ?? '', /PATH de tu sistema/);
    const binPlugin = path.join(e.config, 'plugins', 'cache', 'mk', 'taskcode-plugin', '0.14.0', 'bin');
    await crearTaskctl(binPlugin);
    const soloPlugin = doctor(e, ['--instalar-status-line'], { path: [vacio, binPlugin].join(path.delimiter) });
    assert.equal(soloPlugin.nivel, 'error');
    assert.match(soloPlugin.mensaje, /solo esta en el PATH que Claude Code da a su herramienta Bash/);
    assert.equal(hash(e.settings), antes, 'nada escrito');
    assert.deepEqual(copias(e), []);
    // Con el del sistema detras del del plugin, se instala con el del sistema.
    const ambos = doctor(e, ['--instalar-status-line'], { path: [binPlugin, e.binSistema].join(path.delimiter) });
    assert.equal(ambos.nivel, 'ok', ambos.mensaje);
    assert.match(ambos.mensaje, /bin-sistema/);
  });
});

test('status line: un settings.json ilegible no se toca', async () => {
  await conEntorno(async (e) => {
    await writeFile(e.settings, '{ "roto": ', 'utf8');
    assert.equal(doctor(e, []).nivel, 'omitida');
    const c = doctor(e, ['--instalar-status-line']);
    assert.equal(c.nivel, 'error');
    assert.equal(readFileSync(e.settings, 'utf8'), '{ "roto": ');
    assert.equal(doctor(e, ['--desinstalar-status-line']).nivel, 'error');
    assert.equal(readFileSync(e.settings, 'utf8'), '{ "roto": ');
  });
});

test('status line: --reemplazar sin --instalar, o instalar y desinstalar a la vez, abortan sin tocar nada', async () => {
  await conEntorno(async (e) => {
    const base = { repoCwd: e.dir, configClaudeDir: e.config, env: { PATH: e.binSistema } };
    assert.throws(() => runDoctorCommand(['--reemplazar-status-line'], base), DoctorCommandError);
    assert.throws(() => runDoctorCommand(['--instalar-status-line', '--desinstalar-status-line'], base), DoctorCommandError);
    assert.equal(existsSync(e.settings), false);
  });
});

test('status line: por CLI con CLAUDE_CONFIG_DIR temporal, instala y la linea lo dice', async () => {
  await conEntorno(async (e) => {
    await settingsConCentinela(e);
    const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_CONFIG_DIR: e.config, PATH: [e.binSistema, process.env['PATH'] ?? ''].join(path.delimiter) };
    for (const k of Object.keys(env)) if (k !== 'PATH' && k.toUpperCase() === 'PATH') delete env[k];
    const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--instalar-status-line'], { cwd: e.dir, encoding: 'utf8', env });
    assert.match(r.stdout, /^\[ok\] +status-line: instalada en /m, r.stdout + r.stderr);
    assert.deepEqual(leer(e.settings)['statusLine'], NUESTRA);
    assert.deepEqual(leer(e.settings)['centinela'], { a: [1, 2] });
  });
});
