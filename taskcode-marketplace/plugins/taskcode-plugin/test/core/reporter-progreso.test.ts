/**
 * TASK-110: la parte pura del reporter de progreso de `npm test`. La prueba de
 * verdad, con un `node --test` real, esta en test/commands/reporter-progreso.test.ts:
 * estos eventos son como los entiende quien escribio el test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ContadorHojas, claveDeEjecucion, linea, tocaLinea } from '../reporter/progreso.js';

const fin = (nesting: number, file = 'a.js', tipo?: string) => ({
  type: 'test:pass',
  data: { nesting, file, details: tipo === undefined ? {} : { type: tipo } },
});

test('reporter: cuenta solo hojas (ni suites ni tests con subtests), por fichero', () => {
  const c = new ContadorHojas();
  const hojas = [
    c.terminado(fin(1)), // hijo de un describe
    c.terminado(fin(1)),
    c.terminado(fin(0, 'a.js', 'suite')), // el describe
    c.terminado(fin(2, 'b.js')), // nieto
    c.terminado(fin(1, 'b.js')), // padre del nieto: no es hoja
    c.terminado(fin(0, 'b.js')), // abuelo: tampoco
    c.terminado(fin(0, 'a.js')), // test suelto de a.js tras el describe: hoja
  ];
  assert.deepEqual(hojas, [true, true, false, true, false, false, true]);
  assert.equal(c.hojas, 4);
});

test('reporter: una linea cada 5 %, la primera y la ultima; sin total, cada 50; nunca x > N', () => {
  const con100 = Array.from({ length: 100 }, (_, i) => i + 1).filter((x) => tocaLinea(x, 100));
  assert.deepEqual(con100, [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]);
  assert.deepEqual([1, 2, 3, 4].filter((x) => tocaLinea(x, 4)), [1, 2, 3, 4]);
  assert.deepEqual(Array.from({ length: 120 }, (_, i) => i + 1).filter((x) => tocaLinea(x, null)), [1, 50, 100]);
  assert.equal(linea(3, 10), '[3/10]');
  assert.equal(linea(11, 10), '[11/?]', 'esta vez hay mas tests que la anterior');
  assert.equal(linea(1, null), '[1/?]');
  assert.notEqual(claveDeEjecucion('/r', ['dist/test/**/*.test.js']), claveDeEjecucion('/r', ['dist/test/core/**/*.test.js']));
});
