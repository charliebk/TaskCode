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

test('array con entradas de otros marketplaces es no-instalado', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: JSON.stringify([{ marketplace: 'otro-marketplace' }]) },
    MARKETPLACE
  );
  assert.equal(estado, 'no-instalado');
});

test('array con el marketplace buscado es instalado', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: JSON.stringify([{ marketplace: 'otro' }, { marketplace: MARKETPLACE }]) },
    MARKETPLACE
  );
  assert.equal(estado, 'instalado');
});

test('entradas del array con forma inesperada (no objeto) se ignoran sin lanzar, y no cuentan como instalado', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: JSON.stringify(['texto-suelto', null, 42]) },
    MARKETPLACE
  );
  assert.equal(estado, 'no-instalado');
});

test('una entrada sin campo marketplace se ignora sin lanzar', () => {
  const estado = interpretarResultadoPluginList(
    { error: undefined, status: 0, stdout: JSON.stringify([{ nombre: 'algun-plugin' }]) },
    MARKETPLACE
  );
  assert.equal(estado, 'no-instalado');
});

test('comprobarSkillInstalado nunca lanza y siempre devuelve un estado valido', () => {
  const ESTADOS_VALIDOS: readonly EstadoInstalacionSkill[] = ['instalado', 'no-instalado', 'no-verificable'];
  const estado = comprobarSkillInstalado('marketplace-inventado-para-el-test');
  assert.ok(ESTADOS_VALIDOS.includes(estado), `estado inesperado: ${String(estado)}`);
});
