/**
 * TASK-149c (FS-10 a FS-14, FS-16 de la auditoria 4D): cada utilidad de fs
 * existe una vez, con el comportamiento mas completo de sus antiguas copias.
 * Cada test fija el caso en que las copias divergian.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { esArchivoDeBloqueo } from '../../src/fs/sondas-deploy.js';
import { comprobadorEnCommit } from '../../src/fs/evidencia-veredicto.js';
import { candidatosEnPath, localizarHerramienta } from '../../src/fs/herramientas-deploy.js';
import { leerJson, quitarBom } from '../../src/fs/json-claude.js';
import { nombreBase, textoDirsExcluidos } from '../../src/fs/deteccion-app.js';

test('lockfiles: una lista; los que faltaban en la copia de secretos cuentan, requirements.txt no', () => {
  for (const f of ['bun.lock', 'bun.lockb', 'pdm.lock', 'pylock.toml', 'a/b/yarn.lock', 'go.sum']) assert.equal(esArchivoDeBloqueo(f), true, f);
  assert.equal(esArchivoDeBloqueo('requirements.txt'), false, 'puede llevar una URL con token: se escanea');
});

test('binarios: un UTF-16 con BOM (lleva NUL) es texto y se cuentan sus lineas; un binario de verdad no', async () => {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-utilidades-'));
  const git = (args: string[]): string => {
    const r = spawnSync('git', args, { cwd: raiz, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  try {
    git(['init', '-q']);
    await writeFile(path.join(raiz, 'utf16.txt'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('uno\ndos\ntres\n', 'utf16le')]));
    await writeFile(path.join(raiz, 'bin.dat'), Buffer.from([1, 0, 2, 3]));
    git(['add', '-A']);
    git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'x']);
    const comprobar = comprobadorEnCommit(raiz, git(['rev-parse', 'HEAD']));
    assert.equal(comprobar('utf16.txt', 3), null);
    // TASK-148b (IMP-1 de su revision): la ruta se normaliza antes de pedirsela a git
    // (`HEAD:sub/../utf16.txt` no existe para git; `HEAD:utf16.txt` si).
    assert.equal(comprobar('sub/../utf16.txt', 3), null);
    assert.equal(comprobar('./utf16.txt', 3), null);
    assert.match(comprobar('utf16.txt', 4) ?? '', /tiene 3 linea/);
    assert.match(comprobar('bin.dat', 1) ?? '', /binario/);
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
});

test('PATH: en Windows, PATHEXT antes que el nombre pelado (npm.cmd, no el script sh); sin extension solo si se pide', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-path-'));
  try {
    await writeFile(path.join(dir, 'npm'), '#!/bin/sh\n');
    await writeFile(path.join(dir, 'npm.cmd'), '@echo off\n');
    await writeFile(path.join(dir, 'herr.ps1'), '');
    assert.equal(localizarHerramienta('npm', dir, 'win32'), path.join(dir, 'npm.cmd'));
    assert.deepEqual(candidatosEnPath('npm', dir, { plataforma: 'win32', pathext: '.CMD', sinExtensionEnWindows: true }), [
      path.join(dir, 'npm'),
      path.join(dir, 'npm.cmd'),
    ]);
    assert.deepEqual(candidatosEnPath('herr', dir, { plataforma: 'win32', pathext: '.PS1' }), [path.join(dir, 'herr.ps1')], 'el PATHEXT que se pasa');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('JSON con BOM, nombreBase y el texto de las carpetas excluidas', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-bom-'));
  try {
    await writeFile(path.join(dir, 'a.json'), '﻿{"x":1}', 'utf8');
    assert.deepEqual(leerJson(path.join(dir, 'a.json')), { estado: 'ok', json: { x: 1 } });
    assert.equal(quitarBom('﻿hola'), 'hola');
    assert.equal(quitarBom('ho﻿la'), 'ho﻿la', 'solo al principio');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  assert.equal(nombreBase('a/b/c.lock'), 'c.lock');
  assert.equal(textoDirsExcluidos('o'), 'node_modules, vendor, target, dist o build');
  assert.equal(textoDirsExcluidos('ni'), 'node_modules, vendor, target, dist ni build');
});
