/**
 * TASK-127: la clave `tope_rondas`. Solo parsearConfig (logica pura). Quien la
 * usa (siguiente y review) se prueba en test/commands/automatico-rondas.test.ts
 * y test/commands/review-alcance.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLAVES_CONFIG, CONFIG_DEFAULTS, ConfigError, parsearConfig, parsearConfigConAvisos } from '../../src/core/config.js';

const RUTA = '/repo/.taskcode/config.yml';

test('tope_rondas: clave conocida, 2 por defecto', () => {
  assert.ok((CLAVES_CONFIG as readonly string[]).includes('tope_rondas'));
  assert.equal(CONFIG_DEFAULTS.tope_rondas, 2);
  assert.equal(parsearConfig('', RUTA).tope_rondas, 2);
  assert.equal(parsearConfigConAvisos('tope_rondas: 3\n', RUTA).avisos.length, 0);
});

test('tope_rondas: de 1 a 10 se acepta tal cual', () => {
  for (const n of [1, 2, 3, 10]) assert.equal(parsearConfig(`tope_rondas: ${String(n)}\n`, RUTA).tope_rondas, n);
});

test('tope_rondas: fuera de 1..10 o no entero aborta (fallo cerrado, nunca el defecto en silencio)', () => {
  for (const valor of ['0', '-1', '11', '2.5', 'dos', '"3"', '[2]']) {
    assert.throws(
      () => parsearConfig(`tope_rondas: ${valor}\n`, RUTA),
      (e: unknown) => {
        assert.ok(e instanceof ConfigError, String(e));
        assert.ok(e.message.includes('"tope_rondas" debe ser un numero entero de 1 a 10'), e.message);
        assert.ok(e.message.includes('Por defecto es 2'), e.message);
        return true;
      },
      valor
    );
  }
});
