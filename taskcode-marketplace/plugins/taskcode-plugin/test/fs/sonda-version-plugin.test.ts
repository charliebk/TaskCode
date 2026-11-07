/**
 * Sonda `sondearVersionPlugin` (TASK-087). Directorio de configuracion de
 * Claude Code temporal con installed_plugins.json, known_marketplaces.json y
 * una copia de marketplace con marketplace.json y plugin.json reales.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sondearVersionPlugin } from '../../src/fs/sonda-version-plugin.js';
import { compararVersiones, esVersionSemver } from '../../src/core/version.js';

const REPO = path.join(tmpdir(), 'repo-cualquiera');

async function conConfig(fn: (config: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-version-plugin-'));
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

interface Montaje {
  instalada?: unknown;
  /** version en la entrada de marketplace.json */
  catalogo?: unknown;
  /** version del plugin.json de la fuente relativa; undefined = sin plugin.json */
  manifiesto?: string;
  source?: unknown;
  /** false = sin known_marketplaces.json (se usa plugins/marketplaces/<m>) */
  conocidos?: boolean;
  entradas?: unknown[];
  marketplace?: string;
}

/** Monta la instalacion; devuelve el directorio de la copia del marketplace. */
async function montar(config: string, m: Montaje = {}): Promise<string> {
  const mkt = m.marketplace ?? 'mkt';
  const plugins = path.join(config, 'plugins');
  const entradas = m.entradas ?? [
    { scope: 'user', installPath: path.join(plugins, 'cache', mkt, 'taskcode-plugin', '0.8.0'), version: m.instalada ?? '0.8.0' },
  ];
  await escribirJson(path.join(plugins, 'installed_plugins.json'), { version: 2, plugins: { [`taskcode-plugin@${mkt}`]: entradas } });
  const copia = m.conocidos === false ? path.join(plugins, 'marketplaces', mkt) : path.join(config, 'clon-en-otro-sitio');
  if (m.conocidos !== false) {
    await escribirJson(path.join(plugins, 'known_marketplaces.json'), {
      [mkt]: { source: { source: 'github', repo: 'x/y' }, installLocation: copia, lastUpdated: '2026-11-01T10:00:00.000Z' },
    });
  }
  const source = m.source ?? './plugins/taskcode-plugin';
  await escribirJson(path.join(copia, '.claude-plugin', 'marketplace.json'), {
    name: mkt,
    plugins: [{ name: 'otro', version: '9.9.9', source: './x' }, { name: 'taskcode-plugin', version: m.catalogo ?? '0.10.0', source }],
  });
  if (m.manifiesto !== undefined && typeof source === 'string') {
    await escribirJson(path.join(copia, source, '.claude-plugin', 'plugin.json'), { name: 'taskcode-plugin', version: m.manifiesto });
  }
  return copia;
}

test('esVersionSemver y el orden semver: 0.10.0 > 0.8.0 (no por texto); un SHA no es version', () => {
  assert.ok(esVersionSemver('0.10.0') && esVersionSemver('0.12.0-dev'));
  assert.ok(!esVersionSemver('0412be76f50a') && !esVersionSemver('v1.0.0') && !esVersionSemver(''));
  assert.ok(compararVersiones('0.10.0', '0.8.0') > 0);
});

test('comparable: instalada del installed_plugins.json, disponible y fecha de la copia local', async () => {
  await conConfig(async (config) => {
    const copia = await montar(config);
    const s = sondearVersionPlugin(config, REPO);
    assert.deepEqual(s, {
      estado: 'comparable',
      instalada: '0.8.0',
      disponible: '0.10.0',
      marketplace: 'mkt',
      rutaDisponible: path.join(copia, '.claude-plugin', 'marketplace.json'),
      marketplaceActualizadoEn: '2026-11-01T10:00:00.000Z',
    });
  });
});

test('fuente relativa con plugin.json: manda su version sobre la del catalogo', async () => {
  await conConfig(async (config) => {
    const copia = await montar(config, { catalogo: '0.9.0', manifiesto: '0.11.0' });
    const s = sondearVersionPlugin(config, REPO);
    assert.equal(s.estado, 'comparable');
    if (s.estado !== 'comparable') return;
    assert.equal(s.disponible, '0.11.0');
    assert.equal(s.rutaDisponible, path.join(copia, 'plugins', 'taskcode-plugin', '.claude-plugin', 'plugin.json'));
  });
});

test('fuente remota (objeto): vale la version del catalogo', async () => {
  await conConfig(async (config) => {
    await montar(config, { source: { source: 'github', repo: 'x/y' }, catalogo: '1.2.3' });
    const s = sondearVersionPlugin(config, REPO);
    assert.equal(s.estado === 'comparable' && s.disponible, '1.2.3');
  });
});

test('sin known_marketplaces.json: usa plugins/marketplaces/<m> y la fecha queda null', async () => {
  await conConfig(async (config) => {
    await montar(config, { conocidos: false });
    const s = sondearVersionPlugin(config, REPO);
    assert.equal(s.estado, 'comparable');
    assert.equal(s.estado === 'comparable' && s.marketplaceActualizadoEn, null);
  });
});

test('entrada de proyecto: solo cuenta si su projectPath es este repo', async () => {
  await conConfig(async (config) => {
    const entrada = (projectPath: string) => ({ scope: 'project', projectPath, installPath: path.join(config, 'x'), version: '0.8.0' });
    await montar(config, { entradas: [entrada(path.join(tmpdir(), 'otro-repo'))] });
    const ajena = sondearVersionPlugin(config, REPO);
    assert.equal(ajena.estado, 'no-comprobable');
    assert.match(ajena.estado === 'no-comprobable' ? ajena.motivo : '', /no esta instalado/);
    await montar(config, { entradas: [entrada(REPO)] });
    assert.equal(sondearVersionPlugin(config, REPO).estado, 'comparable');
  });
});

test('no-comprobable con su motivo: sin config, sin el plugin, sin copia, JSON roto, version no semver', async () => {
  const motivo = (config: string): string => {
    const s = sondearVersionPlugin(config, REPO);
    assert.equal(s.estado, 'no-comprobable', JSON.stringify(s));
    return s.estado === 'no-comprobable' ? s.motivo : '';
  };
  await conConfig(async (config) => {
    assert.match(motivo(config), /no existe la lista de plugins instalados/);
  });
  await conConfig(async (config) => {
    await escribirJson(path.join(config, 'plugins', 'installed_plugins.json'), { version: 2, plugins: { 'otro@mkt': [] } });
    assert.match(motivo(config), /taskcode-plugin no esta instalado/);
  });
  await conConfig(async (config) => {
    const copia = await montar(config);
    await rm(copia, { recursive: true, force: true });
    assert.match(motivo(config), /no existe la copia local del marketplace mkt/);
  });
  await conConfig(async (config) => {
    await mkdir(path.join(config, 'plugins'), { recursive: true });
    await writeFile(path.join(config, 'plugins', 'installed_plugins.json'), '{ roto', 'utf8');
    assert.match(motivo(config), /ilegible/);
  });
  await conConfig(async (config) => {
    const copia = await montar(config);
    await writeFile(path.join(copia, '.claude-plugin', 'marketplace.json'), '[1,2', 'utf8');
    assert.match(motivo(config), /ilegible/);
  });
  await conConfig(async (config) => {
    await montar(config, { instalada: '0412be76f50a' });
    assert.match(motivo(config), /instalada no es semver/);
  });
  await conConfig(async (config) => {
    await montar(config, { catalogo: 'latest' });
    assert.match(motivo(config), /disponible no es semver/);
  });
  await conConfig(async (config) => {
    await montar(config, { catalogo: 7 });
    assert.match(motivo(config), /no declara version/);
  });
});
