import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  resolveGitflowScriptsDir,
  runGitflowScript,
  GitflowScriptLaunchError,
} from '../../src/fs/gitflow-runner.js';

test('resolveGitflowScriptsDir: respeta CLAUDE_PLUGIN_ROOT cuando esta definida', () => {
  const previous = process.env['CLAUDE_PLUGIN_ROOT'];
  try {
    process.env['CLAUDE_PLUGIN_ROOT'] = '/algun/plugin/root';
    const dir = resolveGitflowScriptsDir();
    assert.equal(dir, path.join('/algun/plugin/root', 'scripts', 'gitflow'));
  } finally {
    if (previous === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
    else process.env['CLAUDE_PLUGIN_ROOT'] = previous;
  }
});

test('resolveGitflowScriptsDir: cae a la ruta relativa al paquete si CLAUDE_PLUGIN_ROOT no esta (o esta vacia)', () => {
  const previous = process.env['CLAUDE_PLUGIN_ROOT'];
  try {
    process.env['CLAUDE_PLUGIN_ROOT'] = '';
    const dir = resolveGitflowScriptsDir();
    // Debe terminar en scripts/gitflow, dentro del propio paquete
    // (dist/src/fs/../../.. -> raiz del paquete), no en /algun/plugin/root.
    assert.match(dir, /[/\\]scripts[/\\]gitflow$/);
    assert.doesNotMatch(dir, /algun/);
  } finally {
    if (previous === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
    else process.env['CLAUDE_PLUGIN_ROOT'] = previous;
  }
});

test('runGitflowScript: devuelve code y signal para un script real', () => {
  const result = runGitflowScript('README.md', [], {
    scriptsDir: path.join(import.meta.dirname, '..', '..', '..', 'scripts', 'gitflow'),
    cwd: process.cwd(),
  });
  // README.md no es un script Bash ejecutable como tal, pero bash lo
  // "ejecuta" igualmente como texto y falla con codigo != 0 — suficiente
  // para probar que code/signal se propagan sin lanzar.
  assert.equal(typeof result.code, 'number');
  assert.equal(result.signal, null);
});

test('runGitflowScript: sin opcion stdin, un script que lee de la entrada recibe EOF (default "ignore")', async () => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-runner-'));
  try {
    // Devuelve 0 si "read" fallo (EOF) y 1 si consiguio leer algo: al
    // reves de lo intuitivo, para que el test distinga los dos casos
    // sin depender del texto de salida.
    await writeFile(
      path.join(dir, 'lee-stdin.sh'),
      '#!/usr/bin/env bash\nif read -r linea; then exit 1; fi\nexit 0\n',
      'utf8'
    );
    const result = runGitflowScript('lee-stdin.sh', [], { scriptsDir: dir, cwd: dir });
    assert.equal(
      result.code,
      0,
      'el default sigue siendo "ignore": el ciclo de vida no debe heredar stdin'
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('GitflowScriptLaunchError: mensaje incluye el nombre del script y el error original', () => {
  const original = new Error('spawnSync bash ENOENT');
  const err = new GitflowScriptLaunchError('create-feature.sh', original);
  assert.match(err.message, /create-feature\.sh/);
  assert.match(err.message, /No se pudo ejecutar "bash"/);
  assert.equal(err.originalError, original);
  assert.equal(err.name, 'GitflowScriptLaunchError');
});
