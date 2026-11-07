/**
 * `taskctl doctor`, comprobacion `version-plugin` (TASK-087). Repo Git
 * temporal de verdad y un directorio de configuracion de Claude Code temporal
 * con los ficheros de plugins reales; el CLI por spawn con CLAUDE_CONFIG_DIR
 * para el JSON y el codigo de salida.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { comprobarVersionPlugin, runDoctorCommand } from '../../src/commands/doctor.js';
import type { Comprobacion } from '../../src/core/doctor.js';
import { STATE_FOLDER } from '../../src/core/task.js';
import { git } from '../helpers/finish-fixtures.js';
import { plantillaRepo } from '../helpers/repo-plantilla.js';

const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
const SIN_REPO = path.join(tmpdir(), 'repo-cualquiera');

const conRepo = plantillaRepo('taskctl-doctor-version-', async (repoRoot) => {
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

/** Plugin instalado en `instalada` y copia local del marketplace `mkt` en `disponible`. */
async function montar(config: string, instalada: string, disponible: string): Promise<void> {
  const plugins = path.join(config, 'plugins');
  await escribirJson(path.join(plugins, 'installed_plugins.json'), {
    version: 2,
    plugins: { 'taskcode-plugin@mkt': [{ scope: 'user', installPath: path.join(plugins, 'cache', 'x'), version: instalada }] },
  });
  const copia = path.join(plugins, 'marketplaces', 'mkt');
  await escribirJson(path.join(plugins, 'known_marketplaces.json'), {
    mkt: { installLocation: copia, lastUpdated: '2026-11-01T10:00:00.000Z' },
  });
  await escribirJson(path.join(copia, '.claude-plugin', 'marketplace.json'), {
    plugins: [{ name: 'taskcode-plugin', version: disponible, source: { source: 'github', repo: 'x/y' } }],
  });
}

test('disponible mayor (0.8.0 -> 0.10.0): aviso con las dos versiones, la fecha de la copia y los comandos', async () => {
  await conConfig(async (config) => {
    await montar(config, '0.8.0', '0.10.0');
    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
    assert.equal(c.nivel, 'aviso');
    assert.equal(c.id, 'version-plugin');
    assert.match(c.mensaje, /plugin instalado 0\.8\.0, disponible 0\.10\.0 en la copia local del marketplace mkt/);
    assert.match(c.mensaje, /2026-11-01T10:00:00\.000Z/);
    assert.match(c.arreglo ?? '', /^claude plugin marketplace update mkt\nclaude plugin update taskcode-plugin@mkt\n.*reinicia Claude Code/);
  });
});

test('iguales: ok; instalada mas nueva que la copia local: ok con nota de copia desfasada', async () => {
  await conConfig(async (config) => {
    await montar(config, '0.10.0', '0.10.0');
    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
    assert.equal(c.nivel, 'ok');
    assert.match(c.mensaje, /al dia/);
  });
  await conConfig(async (config) => {
    await montar(config, '0.11.0', '0.10.0');
    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
    assert.equal(c.nivel, 'ok');
    assert.match(c.mensaje, /mas nuevo que 0\.10\.0.*desfasada/);
  });
});

test('sin el plugin instalado o sin copia del marketplace: omitida, "no se pudo comprobar"', async () => {
  await conConfig(async (config) => {
    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
    assert.equal(c.nivel, 'omitida');
    assert.match(c.mensaje, /^no se pudo comprobar: no existe la lista de plugins instalados/);
    assert.equal(c.arreglo, null);
  });
  await conConfig(async (config) => {
    await montar(config, '0.8.0', '0.10.0');
    await rm(path.join(config, 'plugins', 'marketplaces'), { recursive: true, force: true });
    const c = comprobarVersionPlugin({ repoCwd: SIN_REPO, configClaudeDir: config });
    assert.equal(c.nivel, 'omitida');
    assert.match(c.mensaje, /^no se pudo comprobar: no existe la copia local del marketplace mkt/);
  });
});

test('el codigo de salida de doctor no cambia: 0 con el aviso, con JSON roto y sin config', async () => {
  await conRepo(async (repoRoot) => {
    const codigo = (config: string): { codigo: number; c: Comprobacion | undefined } => {
      const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: config });
      return { codigo: r.codigo, c: r.comprobaciones.find((x) => x.id === 'version-plugin') };
    };
    await conConfig(async (config) => {
      const sin = codigo(config);
      assert.equal(sin.codigo, 0);
      assert.equal(sin.c?.nivel, 'omitida');
      await montar(config, '0.8.0', '0.10.0');
      const conAviso = codigo(config);
      assert.equal(conAviso.c?.nivel, 'aviso');
      assert.equal(conAviso.codigo, 0);
      await writeFile(path.join(config, 'plugins', 'installed_plugins.json'), '{ roto', 'utf8');
      const roto = codigo(config);
      assert.equal(roto.c?.nivel, 'omitida');
      assert.equal(roto.codigo, 0);
    });
  });
});

test('CLI --json: version-plugin en aviso con arreglo, y el proceso sale con 0', async () => {
  await conRepo(async (repoRoot) => {
    await conConfig(async (config) => {
      await montar(config, '0.8.0', '0.10.0');
      const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--json'], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_CONFIG_DIR: config },
      });
      assert.equal(r.status, 0, r.stdout + r.stderr);
      const j = JSON.parse(r.stdout) as { comprobaciones: Comprobacion[] };
      const c = j.comprobaciones.find((x) => x.id === 'version-plugin');
      assert.ok(c, r.stdout);
      assert.equal(c.nivel, 'aviso');
      assert.match(c.arreglo ?? '', /claude plugin update taskcode-plugin@mkt/);
    });
  });
});
