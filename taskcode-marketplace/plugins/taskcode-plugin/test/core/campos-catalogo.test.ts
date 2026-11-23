/**
 * TASK-148a (CORE1-03 a CORE1-05 de la auditoria 4D): la raiz del plugin en un
 * modulo y lo comun de los catalogos planos (clave de bloque, describirValor y
 * validadores de campo) en uno solo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { raizDelPlugin, rutaEnPlugin } from '../../src/core/raiz-plugin.js';
import { claveDeBloque, describirValor, validarListaDeTexto } from '../../src/core/campos-catalogo.js';
import { resolverRutaCatalogoSkills } from '../../src/core/catalogo-skills.js';
import { resolverRutaHeuristica } from '../../src/core/heuristica.js';
import { resolverRutaCatalogoDeploy } from '../../src/core/doctor-deploy-catalogo.js';
import { resolverRutaSkills } from '../../src/core/revisores.js';
import { resolveGitflowScriptsDir } from '../../src/fs/gitflow-runner.js';

test('raiz del plugin: CLAUDE_PLUGIN_ROOT manda y los cinco catalogos cuelgan de la misma raiz', () => {
  const antes = process.env['CLAUDE_PLUGIN_ROOT'];
  try {
    process.env['CLAUDE_PLUGIN_ROOT'] = path.join('x', 'plugin');
    assert.equal(raizDelPlugin(), path.join('x', 'plugin'));
    const raices = [resolverRutaCatalogoSkills(), resolverRutaHeuristica(), resolverRutaCatalogoDeploy(), resolverRutaSkills(), resolveGitflowScriptsDir()];
    for (const r of raices) assert.ok(r.startsWith(path.join('x', 'plugin') + path.sep), r);
    process.env['CLAUDE_PLUGIN_ROOT'] = '  ';
    assert.equal(rutaEnPlugin('scripts'), path.join(raizDelPlugin(), 'scripts'));
    assert.notEqual(raizDelPlugin().trim(), '', 'una variable en blanco no cuenta');
  } finally {
    if (antes === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
    else process.env['CLAUDE_PLUGIN_ROOT'] = antes;
  }
});

test('claveDeBloque y describirValor', () => {
  assert.deepEqual(claveDeBloque('skill_12_patrones_archivo'), { prefijo: 'skill', n: 12, campo: 'patrones_archivo' });
  assert.equal(claveDeBloque('total_skills'), null);
  assert.equal(describirValor(null), 'un valor vacio');
  assert.equal(describirValor('x'), 'el texto "x"');
});

test('validarListaDeTexto: vacia segun minimo, sin vacios ni repetidos, con el error de quien llama', () => {
  const err = (m: string): Error => new RangeError(m);
  assert.deepEqual(validarListaDeTexto('f:1', 'k', [' a ', 'b'], err), ['a', 'b']);
  assert.deepEqual(validarListaDeTexto('f:1', 'k', [], err), []);
  assert.throws(() => validarListaDeTexto('f:1', 'k', [], err, { minimo: 1 }), (e: unknown) => e instanceof RangeError && /no puede estar vacia/.test(e.message));
  assert.throws(() => validarListaDeTexto('f:1', 'k', ['a', 'a'], err), /repetida/);
  assert.throws(() => validarListaDeTexto('f:1', 'k', ['a', ' '], err), /entrada vacia/);
  assert.throws(() => validarListaDeTexto('f:1', 'k', 'a, b', err), /lista de textos entre corchetes/);
});
