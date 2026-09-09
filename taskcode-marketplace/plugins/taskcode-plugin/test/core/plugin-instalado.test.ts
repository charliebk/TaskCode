/**
 * Tests de `src/core/plugin-instalado.ts` (TASK-017).
 *
 * `interpretarResultadoPluginList` se prueba exhaustivamente con datos
 * literales -- nunca lanzando un subproceso real -- para cubrir todos
 * los desenlaces fail-closed que exige plan-final.md: cualquier fallo
 * del subproceso, o cualquier forma de "claude plugin list --json" que
 * no encaje con lo esperado, tiene que colapsar a 'no-verificable', y
 * NUNCA a 'no-instalado' (que arriesgaria sugerir instalar algo que ya
 * esta) ni a 'instalado' (que esconderia un candidato real que falta).
 *
 * El formato de las entradas (`id` de la forma "plugin@marketplace")
 * es el verificado contra el binario real en la revision por pares de
 * TASK-017, ronda 1 (hallazgo IMPORTANTE IMP-1): el formato asumido en
 * la primera version -- un campo `marketplace` suelto -- no existe.
 *
 * `comprobarSkillInstalado` solo se prueba con un test de integracion
 * minimo: en esta maquina de test no sabemos si "claude" esta instalado
 * ni que devuelve, asi que lo unico que se puede afirmar sin suponer
 * nada del entorno es que la funcion nunca lanza y siempre devuelve uno
 * de los tres estados validos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  comprobarSkillInstalado,
  interpretarResultadoPluginList,
  type EstadoInstalacionSkill,
} from '../../src/core/plugin-instalado.js';

const MARKETPLACE = 'mi-marketplace';

test('binario ausente (result.error presente) es no-verificable', () => {
  const estado = interpretarResultadoPluginList(
    { error: new Error('spawnSync claude ENOENT'), status: null, stdout: null },
    MARKETPLACE
  );
  assert.equal(estado, 'no-verificable');
});

test('status distinto de 0 es no-verificable', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 1, stdout: '[]' },
    MARKETPLACE
  );
  assert.equal(estado, 'no-verificable');
});

test('status null (p. ej. timeout) es no-verificable', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: null, stdout: '[]' },
    MARKETPLACE
  );
  assert.equal(estado, 'no-verificable');
});

test('stdout ausente (no es string) es no-verificable', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: null },
    MARKETPLACE
  );
  assert.equal(estado, 'no-verificable');
});

test('stdout con JSON mal formado es no-verificable', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: '{ esto no es json valido' },
    MARKETPLACE
  );
  assert.equal(estado, 'no-verificable');
});

test('stdout con una forma que no es un array es no-verificable', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: JSON.stringify({ plugins: [] }) },
    MARKETPLACE
  );
  assert.equal(estado, 'no-verificable');
});

test('array vacio es no-instalado', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: '[]' },
    MARKETPLACE
  );
  assert.equal(estado, 'no-instalado');
});

test('array no vacio donde NINGUN elemento tiene la forma esperada (objeto con "id" string) es no-verificable', () => {
  for (const stdout of [
    JSON.stringify([1, 2, 3]),
    JSON.stringify(['texto-suelto']),
    JSON.stringify([null, null]),
    JSON.stringify([{ marketplace: MARKETPLACE }]),
    JSON.stringify([[{ id: `figma@${MARKETPLACE}` }]]),
  ]) {
    const estado = interpretarResultadoPluginList({ error: undefined, status: 0, stdout }, MARKETPLACE);
    assert.equal(estado, 'no-verificable', `stdout=${stdout}`);
  }
});

test('array con "id" de otros marketplaces es no-instalado', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: JSON.stringify([{ id: 'figma@otro-marketplace' }]) },
    MARKETPLACE
  );
  assert.equal(estado, 'no-instalado');
});

test('array con "id" cuyo tramo tras el @ es el marketplace buscado es instalado', () => {
  const estado = interpretarResultadoPluginList(
    {
      error: undefined,
      status: 0,
      stdout: JSON.stringify([{ id: 'otro@otro-marketplace' }, { id: `figma@${MARKETPLACE}` }]),
    },
    MARKETPLACE
  );
  assert.equal(estado, 'instalado');
});

test('formato real de "claude plugin list --json" (id, version, scope, enabled, installPath) se interpreta bien', () => {
  const estado = interpretarResultadoPluginList(
    {
      error: undefined,
      status: 0,
      stdout: JSON.stringify([
        {
          id: `figma@${MARKETPLACE}`,
          version: '2.2.90',
          scope: 'user',
          enabled: true,
          installPath: 'C:\\cache\\figma\\2.2.90',
          installedAt: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
      ]),
    },
    MARKETPLACE
  );
  assert.equal(estado, 'instalado');
});

test('entradas sin "id" (o con "id" no string) se ignoran sin lanzar cuando OTRAS si son reconocibles', () => {
  const estado = interpretarResultadoPluginList(
    {
      error: undefined,
      status: 0,
      stdout: JSON.stringify([{ nombre: 'algun-plugin' }, { id: 42 }, { id: `figma@${MARKETPLACE}` }]),
    },
    MARKETPLACE
  );
  assert.equal(estado, 'instalado');
});

test('comprobarSkillInstalado nunca lanza y siempre devuelve un estado valido', () => {
  const ESTADOS_VALIDOS: readonly EstadoInstalacionSkill[] = ['instalado', 'no-instalado', 'no-verificable'];
  const estado = comprobarSkillInstalado('marketplace-inventado-para-el-test');
  assert.ok(ESTADOS_VALIDOS.includes(estado), `estado inesperado: ${String(estado)}`);
});
