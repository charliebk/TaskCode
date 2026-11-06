/**
 * `taskctl doctor`, comprobacion `hooks-subagente` (TASK-076). Repo Git
 * temporal de verdad y un directorio de configuracion de Claude Code temporal
 * con installed_plugins.json, hooks.json y settings.json reales; el CLI por
 * spawn con CLAUDE_CONFIG_DIR para el JSON y el codigo de salida.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runDoctorCommand } from '../../src/commands/doctor.js';
import type { Comprobacion } from '../../src/core/doctor.js';
import { STATE_FOLDER } from '../../src/core/task.js';
import { git } from '../helpers/finish-fixtures.js';
import { plantillaRepo } from '../helpers/repo-plantilla.js';

const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');

const conRepo = plantillaRepo('taskctl-doctor-hooks-', async (repoRoot) => {
  git(['init', '-q', '-b', 'main'], repoRoot);
  git(['config', 'user.email', 'test@example.com'], repoRoot);
  git(['config', 'user.name', 'Test'], repoRoot);
  for (const c of Object.values(STATE_FOLDER)) {
    await mkdir(path.join(repoRoot, 'tareas', c), { recursive: true });
    await writeFile(path.join(repoRoot, 'tareas', c, '.gitkeep'), '', 'utf8');
  }
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'inicial'], repoRoot);
  git(['checkout', '-q', '-b', 'develop'], repoRoot);
});

async function conConfig(fn: (config: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-config-claude-'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function escribirJson(ruta: string, json: unknown): Promise<void> {
  await mkdir(path.dirname(ruta), { recursive: true });
  await writeFile(ruta, JSON.stringify(json, null, 2), 'utf8');
}

const HOOK_AGENT = { hooks: { PreToolUse: [{ matcher: 'Bash' }, { matcher: 'Agent', hooks: [{ type: 'command', command: 'x' }] }] } };
const HOOK_INOCUO = { hooks: { PreToolUse: [{ matcher: 'Bash|Read|mcp__' }] } };

/** Instala un plugin en el config temporal (installed_plugins.json v2) con ese hooks.json. */
async function instalarPlugin(config: string, clave: string, hooks: unknown, extra: Record<string, unknown> = {}): Promise<string> {
  const installPath = path.join(config, 'plugins', 'cache', ...clave.split('@').reverse(), '1.0.0');
  await escribirJson(path.join(installPath, 'hooks', 'hooks.json'), hooks);
  const ruta = path.join(config, 'plugins', 'installed_plugins.json');
  let actual: { version: number; plugins: Record<string, unknown[]> } = { version: 2, plugins: {} };
  try {
    actual = JSON.parse(await (await import('node:fs/promises')).readFile(ruta, 'utf8'));
  } catch {
    /* primero */
  }
  actual.plugins[clave] = [{ scope: 'user', installPath, version: '1.0.0', ...extra }];
  await escribirJson(ruta, actual);
  return path.join(installPath, 'hooks', 'hooks.json');
}

function hooks(repoRoot: string, config: string): Comprobacion[] {
  return runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config }).comprobaciones.filter(
    (c) => c.id === 'hooks-subagente'
  );
}

test('plugin habilitado con PreToolUse sobre Agent: AVISO con origen, ruta y matcher; codigo 0', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      const ruta = await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT);
      const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config });
      const cs = r.comprobaciones.filter((c) => c.id === 'hooks-subagente');
      assert.equal(cs.length, 1, JSON.stringify(cs));
      const c = cs[0] as Comprobacion;
      assert.equal(c.nivel, 'aviso');
      assert.ok(c.mensaje.includes('plugin ctx@mkt'), c.mensaje);
      assert.ok(c.mensaje.includes(ruta), c.mensaje);
      assert.ok(c.mensaje.includes('"Agent"'), c.mensaje);
      assert.match(c.arreglo ?? '', /Auto-Mode Bypass/);
      assert.match(c.arreglo ?? '', /SessionStart/);
      assert.match(c.arreglo ?? '', /enabledPlugins/);
      assert.equal(r.codigo, 0);
    });
  });
});

test('sin hooks sobre Agent/Task: ok, sin avisos de hooks', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      await instalarPlugin(config, 'ctx@mkt', HOOK_INOCUO);
      await escribirJson(path.join(config, 'settings.json'), HOOK_INOCUO);
      const cs = hooks(repoRoot, config);
      assert.equal(cs.length, 1);
      assert.equal(cs[0]?.nivel, 'ok');
      assert.match(cs[0]?.mensaje ?? '', /ningun hook PreToolUse alcanza a Agent\/Task \(3 ficheros leidos\)/);
    });
  });
});

test('config de Claude vacia o inexistente: ok', async () => {
  await conRepo(async (repoRoot) => {
    const cs = hooks(repoRoot, path.join(repoRoot, 'no-existe'));
    assert.deepEqual(cs.map((c) => c.nivel), ['ok']);
  });
});

test('plugin desactivado en enabledPlugins: no avisa; el local del proyecto puede reactivarlo', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT);
      await escribirJson(path.join(config, 'settings.json'), { enabledPlugins: { 'ctx@mkt': false } });
      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['ok']);
      await escribirJson(path.join(repoRoot, '.claude', 'settings.local.json'), { enabledPlugins: { 'ctx@mkt': true } });
      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['aviso']);
    });
  });
});

test('instalacion de otro proyecto (projectPath distinto): no avisa', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT, { scope: 'project', projectPath: path.join(config, 'otro') });
      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['ok']);
      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT, { scope: 'project', projectPath: repoRoot });
      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['aviso']);
    });
  });
});

test('versiones viejas en la cache que no estan en installed_plugins.json: no avisan', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      await instalarPlugin(config, 'ctx@mkt', HOOK_INOCUO);
      await escribirJson(path.join(config, 'plugins', 'cache', 'mkt', 'ctx', '0.9.0', 'hooks', 'hooks.json'), HOOK_AGENT);
      assert.deepEqual(hooks(repoRoot, config).map((c) => c.nivel), ['ok']);
    });
  });
});

test('hooks en linea en plugin.json y como ruta: avisan', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      const enLinea = path.dirname(path.dirname(await instalarPlugin(config, 'a@mkt', {})));
      await escribirJson(path.join(enLinea, '.claude-plugin', 'plugin.json'), { name: 'a', ...HOOK_AGENT });
      const comoRuta = path.dirname(path.dirname(await instalarPlugin(config, 'b@mkt', {})));
      await escribirJson(path.join(comoRuta, 'otros', 'h.json'), { hooks: { PreToolUse: [{ matcher: 'Task' }] } });
      await escribirJson(path.join(comoRuta, '.claude-plugin', 'plugin.json'), { name: 'b', hooks: './otros/h.json' });
      const cs = hooks(repoRoot, config);
      assert.equal(cs.length, 2, JSON.stringify(cs));
      assert.ok(cs.every((c) => c.nivel === 'aviso'));
      assert.ok(cs.some((c) => c.mensaje.includes('plugin a@mkt') && c.mensaje.includes('plugin.json')));
      assert.ok(cs.some((c) => c.mensaje.includes('plugin b@mkt') && c.mensaje.includes('h.json') && c.mensaje.includes('"Task"')));
    });
  });
});

test('settings de usuario, de proyecto y local: cada uno nombra su origen y su ruta', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      const usuario = path.join(config, 'settings.json');
      const proyecto = path.join(repoRoot, '.claude', 'settings.json');
      const local = path.join(repoRoot, '.claude', 'settings.local.json');
      await escribirJson(usuario, { hooks: { PreToolUse: [{ matcher: '*' }] } });
      await escribirJson(proyecto, { hooks: { PreToolUse: [{ matcher: 'Edit|Task' }] } });
      await escribirJson(local, { hooks: { PreToolUse: [{ matcher: '' }] } });
      const cs = hooks(repoRoot, config);
      assert.equal(cs.length, 3, JSON.stringify(cs));
      const m = cs.map((c) => c.mensaje);
      assert.ok(m.some((x) => x.startsWith('settings de usuario') && x.includes(usuario) && x.includes('"*"')), m.join('\n'));
      assert.ok(m.some((x) => x.startsWith('settings del proyecto') && x.includes(proyecto)), m.join('\n'));
      assert.ok(m.some((x) => x.startsWith('settings locales del proyecto') && x.includes(local)), m.join('\n'));
    });
  });
});

test('JSON roto o installed_plugins.json con formato desconocido: no es error, se nombra en el ok', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      await mkdir(config, { recursive: true });
      await writeFile(path.join(config, 'settings.json'), '{ roto', 'utf8');
      await escribirJson(path.join(config, 'plugins', 'installed_plugins.json'), { version: 99, cosas: [] });
      const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config });
      const cs = r.comprobaciones.filter((c) => c.id === 'hooks-subagente');
      assert.deepEqual(cs.map((c) => c.nivel), ['ok']);
      assert.match(cs[0]?.mensaje ?? '', /sin leer: .*settings\.json: .*installed_plugins\.json: formato no reconocido/);
      assert.equal(r.codigo, 0);
    });
  });
});

test('CLI --json: el aviso lleva el id estable hooks-subagente, nivel aviso y arreglo; codigo 0', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      await instalarPlugin(config, 'ctx@mkt', HOOK_AGENT);
      const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--json'], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_CONFIG_DIR: config },
      });
      assert.equal(r.status, 0, r.stdout + r.stderr);
      const j = JSON.parse(r.stdout) as { comprobaciones: Comprobacion[] };
      const c = j.comprobaciones.find((x) => x.id === 'hooks-subagente');
      assert.ok(c, r.stdout);
      assert.equal(c.nivel, 'aviso');
      assert.match(c.mensaje, /plugin ctx@mkt/);
      assert.match(c.arreglo ?? '', /Problemas conocidos/);
    });
  });
});

// ---------------------------------------------------------------------
// Documentacion (criterios 3 y 4)
// ---------------------------------------------------------------------

const PLUGIN_ROOT = path.join(import.meta.dirname, '..', '..', '..');

test('README: Problemas conocidos con sintoma, causa, diagnostico y las tres salidas', async () => {
  const { readFile } = await import('node:fs/promises');
  const readme = await readFile(path.join(PLUGIN_ROOT, 'README.md'), 'utf8');
  const i = readme.indexOf('## Problemas conocidos');
  assert.ok(i >= 0, 'falta la seccion "## Problemas conocidos"');
  const seccion = readme.slice(i, readme.indexOf('\n## ', i + 1));
  for (const frase of ['Auto-Mode Bypass', 'PreToolUse', 'Agent', 'taskctl doctor', 'hooks-subagente', 'SessionStart', 'enabledPlugins', 'Aprobar a mano']) {
    assert.ok(seccion.includes(frase), `la seccion no menciona "${frase}"`);
  }
});

test('skill task-workflow (avance): ante un subagente denegado, taskctl doctor y no rodear', async () => {
  const { readFile } = await import('node:fs/promises');
  const avance = await readFile(path.join(PLUGIN_ROOT, 'skills', 'task-workflow', 'avance.md'), 'utf8');
  assert.match(avance, /deniega el lanzamiento de un subagente[\s\S]{0,200}`taskctl doctor`/);
  assert.match(avance, /No rodear la\s+denegacion/);
});
