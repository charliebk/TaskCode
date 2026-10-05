/**
 * Metadatos del plugin (TASK-049): `plugin.json` lleva `displayName`,
 * `repository`, `license` y `keywords`, la licencia existe como fichero
 * dentro del plugin (que es lo que se instala), y los campos que tambien
 * declara la entrada del marketplace no se desalinean entre los dos sitios.
 *
 * Y la decision sobre `model:` en los agentes: no lo declaran, para que
 * mande el parametro `model` de cada invocacion y despues
 * `CLAUDE_CODE_SUBAGENT_MODEL` (ver el README del plugin).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/core/frontmatter.js';

// dist/test/empaquetado -> tres niveles arriba esta la raiz del plugin, y
// tres mas la del repo (mismo truco que distribucion.test.ts).
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..', '..');

async function leerJson(ruta: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(ruta, 'utf8')) as Record<string, unknown>;
}

test('plugin.json declara displayName, repository, license (SPDX MIT) y keywords', async () => {
  const manifiesto = await leerJson(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'));
  assert.equal(manifiesto.name, 'taskcode-plugin', 'el test no esta leyendo el manifiesto del plugin');
  assert.equal(typeof manifiesto.displayName, 'string');
  assert.match(String(manifiesto.repository), /^https:\/\/github\.com\//);
  assert.equal(manifiesto.license, 'MIT');
  assert.ok(Array.isArray(manifiesto.keywords) && manifiesto.keywords.length > 0, 'keywords vacio');
  assert.ok((manifiesto.keywords as unknown[]).every((k) => typeof k === 'string'));
});

test('la licencia viaja dentro del plugin y coincide con la del repo', async () => {
  const delPlugin = path.join(PLUGIN_ROOT, 'LICENSE');
  assert.ok(existsSync(delPlugin), 'falta LICENSE en la carpeta del plugin');
  const texto = await readFile(delPlugin, 'utf8');
  assert.match(texto, /^MIT License/);
  const delRepo = path.join(REPO_ROOT, 'LICENSE');
  if (existsSync(delRepo)) {
    assert.equal(texto.replace(/\r\n/g, '\n'), (await readFile(delRepo, 'utf8')).replace(/\r\n/g, '\n'));
  }
});

test('plugin.json y la entrada del marketplace no se desalinean', async (t) => {
  const marketplace = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
  if (!existsSync(marketplace)) {
    t.skip('sin marketplace.json: el plugin se esta probando fuera de su repo');
    return;
  }
  const manifiesto = await leerJson(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'));
  const plugins = (await leerJson(marketplace)).plugins as Array<Record<string, unknown>>;
  const entrada = plugins.find((p) => p.name === manifiesto.name);
  assert.ok(entrada, 'el marketplace no tiene entrada para el plugin');
  for (const campo of ['displayName', 'repository', 'keywords', 'version']) {
    assert.deepEqual(entrada[campo], manifiesto[campo], `"${campo}" distinto en plugin.json y marketplace.json`);
  }
});

test('los agentes no declaran model: (manda el parametro de cada invocacion)', async () => {
  const dir = path.join(PLUGIN_ROOT, 'agents');
  const agentes = (await readdir(dir)).filter((f) => f.endsWith('.md'));
  assert.ok(agentes.length >= 5, `solo ${agentes.length} agentes: el test no mide nada`);
  const conModelo: string[] = [];
  for (const f of agentes) {
    const { data } = parseFrontmatter(await readFile(path.join(dir, f), 'utf8'));
    if ('model' in data) conModelo.push(f);
  }
  assert.deepEqual(conModelo, [], `agentes con model: ${conModelo.join(', ')}`);
});
