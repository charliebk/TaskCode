/**
 * TASK-070: las claves `comando_verificacion` y `timeout_verificacion`. Parte
 * pura (parsearConfig) y resolverConfig contra un directorio temporal real.
 * Quien ejecuta el comando (los frenos) llega con TASK-071/072.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  CLAVES_CONFIG,
  CONFIG_DEFAULTS,
  ConfigError,
  parsearConfig,
  parsearConfigConAvisos,
  resolverConfig,
} from '../../src/core/config.js';

const RUTA = '/repo/.taskcode/config.yml';

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

test('verificacion: sin la clave, comando null (sin freno) y timeout 600 s', () => {
  assert.equal(CONFIG_DEFAULTS.comando_verificacion, null);
  assert.equal(CONFIG_DEFAULTS.timeout_verificacion, 600);
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('comando_verificacion'));
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('timeout_verificacion'));
  const c = parsearConfig('limite_wip: 2\n', RUTA);
  assert.equal(c.comando_verificacion, null);
  assert.equal(c.timeout_verificacion, 600);
});

test('verificacion: el comando se conserva entero y recortado, tambien con espacios y "#" entrecomillado', () => {
  assert.equal(parsearConfig('comando_verificacion: npm test\n', RUTA).comando_verificacion, 'npm test');
  assert.equal(
    parsearConfig('comando_verificacion: "  npm run test -- --grep \'#rapido\'  "\n', RUTA).comando_verificacion,
    "npm run test -- --grep '#rapido'"
  );
  const c = parsearConfig('comando_verificacion: "cargo test"\ntimeout_verificacion: 1200\n', RUTA);
  assert.equal(c.comando_verificacion, 'cargo test');
  assert.equal(c.timeout_verificacion, 1200);
});

test('verificacion: un comando vacio o que no es texto aborta nombrando la clave y la linea', () => {
  rechaza(
    'limite_wip: 1\ncomando_verificacion:\n',
    /config\.yml:2: "comando_verificacion" debe ser un comando[\s\S]*comando_verificacion: "npm test"/
  );
  rechaza('comando_verificacion: ""\n', /"comando_verificacion" debe ser un comando/);
  rechaza('comando_verificacion: 42\n', /"comando_verificacion" debe ser un comando \(texto no vacio\), y es 42 \(number\)/);
  rechaza('comando_verificacion: [npm, test]\n', /"comando_verificacion" debe ser un comando[\s\S]*una lista/);
});

test('verificacion: un timeout que no es entero >= 1 aborta (fallo cerrado, nunca el defecto en silencio)', () => {
  for (const malo of ['0', '-5', '1.5', 'diez', '"600"']) {
    rechaza(
      `comando_verificacion: npm test\ntimeout_verificacion: ${malo}\n`,
      /config\.yml:2: "timeout_verificacion" debe ser un numero entero[\s\S]*Por defecto es 600\. Son segundos: un 0 o un negativo cortarian la verificacion/
    );
  }
});

test('verificacion: el timeout sin comando no hace nada y aborta; la clave repetida tambien', () => {
  rechaza('timeout_verificacion: 300\n', /"timeout_verificacion" sin "comando_verificacion" ni "comando_heldout" no hace nada/);
  rechaza('comando_verificacion: npm test\ncomando_verificacion: cargo test\n', /"comando_verificacion" esta repetida/);
});

test('verificacion: los mensajes de sincronizacion no cambian al generalizar los validadores', () => {
  rechaza(
    'comando_sincronizacion:\nrutas_sincronizacion: [docs/PLAN.md]\n',
    /"comando_sincronizacion" debe ser un comando[\s\S]*Ejemplo: comando_sincronizacion: "node scripts\/sincronizar-plan\.mjs"\. Si lleva "#"/
  );
  rechaza(
    'comando_sincronizacion: x\nrutas_sincronizacion: [a.md]\ntimeout_sincronizacion: 0\n',
    /Por defecto es 60\. Son segundos: un 0 o un negativo matarian el comando antes de empezar/
  );
});

test('verificacion: una errata en la clave avisa con la sugerencia y no aborta', () => {
  const { config, avisos } = parsearConfigConAvisos('comando_verificacon: npm test\n', RUTA);
  assert.equal(config.comando_verificacion, null);
  assert.equal(avisos.length, 1);
  assert.match(avisos[0] as string, /clave desconocida "comando_verificacon"[\s\S]*Quiza quisiste decir "comando_verificacion"/);
});

test('verificacion: resolverConfig lee las claves del fichero real (CRLF y comentario de linea)', async () => {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-verif-'));
  try {
    await mkdir(path.join(raiz, '.taskcode'));
    await writeFile(
      path.join(raiz, '.taskcode', 'config.yml'),
      '# frenos\r\ncomando_verificacion: "npm test" # el de siempre\r\ntimeout_verificacion: 900\r\n',
      'utf8'
    );
    const c = resolverConfig(raiz);
    assert.equal(c.comando_verificacion, 'npm test');
    assert.equal(c.timeout_verificacion, 900);
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
});
