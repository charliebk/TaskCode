/**
 * Claves de sincronizacion de `.taskcode/config.yml` (TASK-033). Fallo
 * cerrado al CARGAR, no al commitear: para entonces la tarea ya se ha
 * movido y un error tardio deja el workspace a medias.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ConfigError, CONFIG_DEFAULTS, parsearConfig, resolverConfig } from '../../src/core/config.js';

const RUTA = '/repo/.taskcode/config.yml';
const BASE = 'comando_sincronizacion: "node scripts/sync.mjs"\n';

function rechaza(contenido: string, patron: RegExp): void {
  assert.throws(
    () => parsearConfig(contenido, RUTA),
    (e: unknown) => {
      assert.ok(e instanceof ConfigError, String(e));
      assert.match(e.message, patron);
      return true;
    },
    `deberia rechazar:\n${contenido}`
  );
}

test('config sincronizacion: sin claves, desactivada (defaults de 0.1.0 intactos)', () => {
  const c = parsearConfig('limite_wip: 2\n', RUTA);
  assert.equal(c.comando_sincronizacion, null);
  assert.deepEqual(c.rutas_sincronizacion, []);
  assert.equal(c.timeout_sincronizacion, 60);
  assert.equal(CONFIG_DEFAULTS.comando_sincronizacion, null);
});

test('config sincronizacion: comando + rutas + timeout validos se leen y normalizan', () => {
  const c = parsearConfig(
    BASE + 'rutas_sincronizacion: [docs/PLAN.md, "./PLANIFICACION.md", docs\\otro.md, docs/PLAN.md]\n' +
      'timeout_sincronizacion: 120\n',
    RUTA
  );
  assert.equal(c.comando_sincronizacion, 'node scripts/sync.mjs');
  assert.deepEqual(c.rutas_sincronizacion, ['docs/PLAN.md', 'PLANIFICACION.md', 'docs/otro.md']);
  assert.equal(c.timeout_sincronizacion, 120);
});

test('config sincronizacion: las dos claves van juntas', () => {
  rechaza(BASE, /"comando_sincronizacion" necesita tambien "rutas_sincronizacion"/);
  rechaza('rutas_sincronizacion: [docs/PLAN.md]\n', /"rutas_sincronizacion" necesita tambien "comando_sincronizacion"/);
  rechaza('timeout_sincronizacion: 30\n', /"timeout_sincronizacion" sin "comando_sincronizacion"/);
});

test('config sincronizacion: rutas invalidas abortan al cargar', () => {
  const casos: [string, RegExp][] = [
    ['[.]', /es la raiz del repo/],
    ['[./]', /es una carpeta/],
    ['[docs/]', /es una carpeta/],
    ['[../fuera.md]', /se sale del repo/],
    ['[docs/../../x.md]', /se sale del repo/],
    ['[/etc/passwd]', /es absoluta/],
    ['[C:/x.md]', /es absoluta/],
    ['[tareas/x.md]', /esta bajo tareas\//],
    ['[.taskcode/config.yml]', /esta bajo \.taskcode\//],
    ['[.git/HEAD]', /esta bajo \.git\//],
    ['[]', /lista no vacia/],
    ['docs/PLAN.md', /lista no vacia entre corchetes/],
  ];
  for (const [valor, patron] of casos) {
    rechaza(BASE + `rutas_sincronizacion: ${valor}\n`, patron);
  }
});

test('config sincronizacion: comando vacio y timeout no positivo abortan', () => {
  rechaza('comando_sincronizacion: ""\nrutas_sincronizacion: [a.md]\n', /debe ser un comando/);
  rechaza(BASE + 'rutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n', /Son segundos/);
  rechaza(BASE + 'rutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n', /Por defecto es 60/);
});

test('config sincronizacion: una errata en la clave aborta y sugiere la buena', () => {
  rechaza('comando_sincronizacon: x\n', /Quiza quisiste decir "comando_sincronizacion"/);
});

test('config sincronizacion: el limite_wip invalido conserva su mensaje (no hereda el del timeout)', () => {
  rechaza('limite_wip: 0\n', /impedirian arrancar cualquier tarea/);
});

test('config sincronizacion: el "#" sin comillas trunca el comando; entrecomillado se conserva', () => {
  const sin = parsearConfig('comando_sincronizacion: node a.mjs #x\nrutas_sincronizacion: [a.md]\n', RUTA);
  assert.equal(sin.comando_sincronizacion, 'node a.mjs');
  const con = parsearConfig(
    'comando_sincronizacion: "node a.mjs #x"\nrutas_sincronizacion: [a.md]\n',
    RUTA
  );
  assert.equal(con.comando_sincronizacion, 'node a.mjs #x');
});

test('resolverConfig: una ruta de sincronizacion que en disco es una carpeta aborta', async () => {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-cfgsync-'));
  try {
    await mkdir(path.join(repo, '.git'));
    await mkdir(path.join(repo, 'docs'));
    await mkdir(path.join(repo, '.taskcode'));
    await writeFile(
      path.join(repo, '.taskcode', 'config.yml'),
      BASE + 'rutas_sincronizacion: [docs]\n',
      'utf8'
    );
    assert.throws(() => resolverConfig(repo), /"docs" es una carpeta/);
    await writeFile(
      path.join(repo, '.taskcode', 'config.yml'),
      BASE + 'rutas_sincronizacion: [docs/PLAN.md]\n',
      'utf8'
    );
    assert.deepEqual(resolverConfig(repo).rutas_sincronizacion, ['docs/PLAN.md']);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
