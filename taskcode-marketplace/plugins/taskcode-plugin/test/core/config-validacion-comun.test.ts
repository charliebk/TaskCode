/**
 * TASK-148b (CORE1-06 a CORE1-08, CORE1-10 de la auditoria 4D): la validacion
 * de config con una regla por cosa: sugerencias con masParecida, un entero en
 * rango, una lista de enumerado, la lista de claves atada al switch y una sola
 * regla de ruta relativa.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CLAVES_CONFIG, parsearConfig } from '../../src/core/config.js';
import { problemaDeRutaRelativa } from '../../src/core/ruta-relativa.js';
import { motivoRutaInvalida } from '../../src/core/doctor-deploy-veredictos.js';

const errorDe = (texto: string): string => {
  try {
    parsearConfig(texto, 'config.yml');
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  return '(no lanzo)';
};

test('paridad: cada clave de CLAVES_CONFIG tiene su case en el switch de config, y no hay case sin clave', () => {
  const fuente = readFileSync(path.join(import.meta.dirname, '..', '..', 'src', 'core', 'config.js'), 'utf8');
  const inicio = fuente.indexOf('switch (par.clave) {');
  assert.ok(inicio !== -1, 'el switch de claves');
  // Hasta el siguiente switch del fichero (el de las claves es el primero).
  const fin = fuente.indexOf('switch (', inicio + 1);
  const cases = [...fuente.slice(inicio, fin === -1 ? undefined : fin).matchAll(/^\s*case '([a-z_]+)':/gm)].map((m) => m[1]);
  assert.deepEqual([...cases].sort(), [...CLAVES_CONFIG].sort());
});

test('sugerencias con masParecida: una errata cercana se sugiere; "mr" no sugiere "merge"', () => {
  assert.match(errorDe('modo_flujo: automatco\n'), /¿Querias decir "automatico"\?/);
  assert.doesNotMatch(errorDe('cierre_por_defecto: mr\n'), /Querias decir/);
});

test('entero en rango y lista de enumerado: el mismo mensaje y el mismo rango para todas las claves', () => {
  assert.match(errorDe('tope_rondas: 11\n'), /"tope_rondas" debe ser un numero entero de 1 a 10/);
  assert.match(errorDe('umbral_crecimiento_suite: 0\n'), /"umbral_crecimiento_suite" debe ser un numero entero de 1 a 1000/);
  assert.match(errorDe('tareas_entre_podas: 0\n'), /"tareas_entre_podas" debe ser un numero entero mayor o igual que 1/);
  assert.match(errorDe('fases_sincronizacion: [plan, inventada]\n'), /"fases_sincronizacion" contiene "inventada", que no es una fase/);
  // MEN-1 de la revision: un repetido se queda una vez.
  assert.deepEqual(
    parsearConfig('comando_sincronizacion: "x"\nrutas_sincronizacion: [docs/a.md]\nfases_sincronizacion: [plan, plan]\n', 'c.yml')
      .fases_sincronizacion,
    ['plan']
  );
  assert.deepEqual(
    parsearConfig(
      'comando_verificacion: "x"\ncomando_verificacion_pesada: "y"\nverificacion_pesada_en: [release, release]\n',
      'c.yml'
    ).verificacion_pesada_en,
    ['release']
  );
  // MEN-5: en un patron glob `..` se rechaza siempre (a/../** excluiria todo el repo).
  assert.match(errorDe('excluir_de_revision: [a/../**]\n'), /no vale: sale del repo con "\.\."/);
});

test('ruta relativa: una regla en config y en los veredictos; a/../b vale (se normaliza), a/../../b no', () => {
  assert.equal(problemaDeRutaRelativa('a/../b'), null);
  assert.equal(problemaDeRutaRelativa('a/../../b'), 'sale');
  assert.equal(problemaDeRutaRelativa('C:\\x'), 'absoluta');
  assert.equal(motivoRutaInvalida('a/../b'), null);
  assert.match(motivoRutaInvalida('a/../../b') ?? '', /sale de la raiz/);
  assert.match(errorDe('documento_estado: docs/../../ESTADO.md\n'), /se sale del repo/);
});
