import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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

test('runGitflowScript: "inherit" deja llegar la respuesta al script y el default "ignore" no', async () => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-runner-'));
  try {
    // 21 = el script consiguio leer una linea; 22 = recibio EOF.
    await writeFile(
      path.join(dir, 'lee-stdin.sh'),
      '#!/usr/bin/env bash\nif read -r linea; then exit 21; fi\nexit 22\n',
      'utf8'
    );

    // Hace falta un proceso hijo: solo controlando SU stdin se pueden
    // distinguir las dos opciones. El stdin del propio proceso de
    // test no esta bajo control — bajo "node --test" es una tuberia
    // abierta que nadie cierra, asi que un test hecho en este mismo
    // proceso no probaria nada (y con "inherit" se colgaria).
    const runnerUrl = pathToFileURL(
      path.join(import.meta.dirname, '..', '..', 'src', 'fs', 'gitflow-runner.js')
    ).href;
    const hijo = path.join(dir, 'hijo.mjs');
    await writeFile(
      hijo,
      [
        `import { runGitflowScript } from ${JSON.stringify(runnerUrl)};`,
        `const opts = { scriptsDir: ${JSON.stringify(dir)}, cwd: ${JSON.stringify(dir)} };`,
        "if (process.argv[2] === 'inherit') opts.stdin = 'inherit';",
        "const r = runGitflowScript('lee-stdin.sh', [], opts);",
        'process.exit(r.code);',
        '',
      ].join('\n'),
      'utf8'
    );

    const conInherit = spawnSync(process.execPath, [hijo, 'inherit'], {
      input: 'una respuesta\n',
      encoding: 'utf8',
    });
    assert.equal(conInherit.status, 21, '"inherit" tiene que dejar llegar la respuesta');

    const porDefecto = spawnSync(process.execPath, [hijo, 'default'], {
      input: 'una respuesta\n',
      encoding: 'utf8',
    });
    assert.equal(
      porDefecto.status,
      22,
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
