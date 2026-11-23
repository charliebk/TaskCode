/**
 * TASK-148c (CORE1-09, CORE1-11 a CORE1-13, CORE2-09, CORE2-10, CORE2-15 a
 * CORE2-17 de la auditoria 4D): cada utilidad de core existe una vez. Cada
 * test fija el caso en que las copias divergian.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cierresDeMerge } from '../../src/core/comando-merge.js';
import { cargarCatalogoDeploy, parsearCapaProyecto } from '../../src/core/doctor-deploy-catalogo.js';
import { solapeDeEtiquetas } from '../../src/core/complejidad-similar.js';
import { esObjeto, quitarAnsi, recortar } from '../../src/core/utilidades-texto.js';
import { hostDeRemoto, partesDeOrigin } from '../../src/core/plataforma-remota.js';
import { ocultarSecretos } from '../../src/core/secretos.js';
import { esRutaDeTest } from '../../src/core/menores.js';
import { PATRONES_TEST } from '../../src/fs/git.js';
import { contarTests } from '../../src/core/crecimiento-suite.js';

test('opciones globales de git: el mismo salto en el cierre de merge (-C y -c con valor)', () => {
  assert.deepEqual(cierresDeMerge('git -C repo -c user.name=x commit -m y'), ['repo']);
  assert.deepEqual(cierresDeMerge('git --no-pager merge --continue'), [null]);
  assert.deepEqual(cierresDeMerge('git -c merge.x=1 status'), []);
});

test('fecha: el catalogo de deploy rechaza una fecha imposible (2026-02-30), como diaDe', () => {
  const base = cargarCatalogoDeploy();
  const capa = (fecha: string): string =>
    `silenciar_1_patron: npm-token\nsilenciar_1_fichero: .npmrc\nsilenciar_1_huella: "abcdef12"\nsilenciar_1_motivo: m\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: ${fecha}\n`;
  assert.throws(() => parsearCapaProyecto(capa('2026-02-30'), 'p.yml', base), /usa AAAA-MM-DD/);
  assert.doesNotThrow(() => parsearCapaProyecto(capa('2026-02-28'), 'p.yml', base));
});

test('solape de etiquetas sin mayusculas; esObjeto, recortar y quitarAnsi', () => {
  assert.equal(solapeDeEtiquetas(['Rust', 'wasm', 'rust'], ['rust', 'WASM']), 2);
  assert.equal(esObjeto({}), true);
  assert.equal(esObjeto([]), false);
  assert.equal(esObjeto(null), false);
  assert.equal(recortar('abcdef', 4), 'abc…');
  assert.equal(recortar('abc', 4), 'abc');
  assert.equal(quitarAnsi('\u001b[31mrojo\u001b[0m \u001b]8;;https://x\u001b\\enlace\u001b]8;;\u001b\\'), 'rojo enlace');
  // La copia de crecimiento-suite solo quitaba colores: un OSC delante del total lo tapaba.
  assert.equal(contarTests('\u001b]0;titulo\u0007# tests 12\n'), 12);
});

test('URL de origin: host y partes leen la autoridad igual (un puerto 99999 no es una URL valida en ninguno)', () => {
  assert.equal(hostDeRemoto('https://gitlab.example.com:8443/g/r.git'), 'gitlab.example.com');
  assert.equal(hostDeRemoto('https://github.com:99999/o/r.git'), null);
  assert.equal(partesDeOrigin('https://github.com:99999/o/r.git'), null);
  assert.equal(hostDeRemoto('git@github.com:o/r.git'), 'github.com');
});

test('credenciales: una URL con usuario y contrasena oculta tambien el usuario (puede ser un token)', () => {
  const t = ocultarSecretos('clonado de https://tokenDeUsuario123:contrasena-larga@git.example.com/o/r');
  assert.doesNotMatch(t, /tokenDeUsuario123/);
  assert.doesNotMatch(t, /contrasena-larga/);
  assert.match(t, /https:\/\/\*\*\*@git\.example\.com/);
});

test('fichero de test: una definicion para esRutaDeTest y los globs de git', () => {
  assert.deepEqual(PATRONES_TEST, ['**/test/**', '**/tests/**', '**/__tests__/**', '**/*.test.*', '**/*.spec.*']);
  assert.deepEqual(['a/test/x.ts', 'a/__tests__/y.js', 'b.spec.ts', 'src/a.ts', 'atest/x.ts'].map(esRutaDeTest), [true, true, true, false, false]);
});
