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

test('GitflowScriptLaunchError: mensaje incluye el nombre del script y el error original', () => {
  const original = new Error('spawnSync bash ENOENT');
  const err = new GitflowScriptLaunchError('create-feature.sh', original);
  assert.match(err.message, /create-feature\.sh/);
  assert.match(err.message, /No se pudo ejecutar "bash"/);
  assert.equal(err.originalError, original);
  assert.equal(err.name, 'GitflowScriptLaunchError');
});
