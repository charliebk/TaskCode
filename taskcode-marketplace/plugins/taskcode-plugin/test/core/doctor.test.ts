/**
 * Nucleo puro de `taskctl doctor` (TASK-062): codigo de salida, version de
 * Node y los dos formatos. Sin disco ni procesos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aviso,
  codigoSalida,
  error,
  formatearJson,
  formatearTexto,
  nodeSoportado,
  ok,
  omitida,
} from '../../src/core/doctor.js';

test('codigoSalida: 0 sin errores (los avisos y las omitidas no cuentan), 1 con alguno', () => {
  assert.equal(codigoSalida([]), 0);
  assert.equal(codigoSalida([ok('a', 'x'), aviso('b', 'x', 'arreglalo'), omitida('c', 'x')]), 0);
  assert.equal(codigoSalida([ok('a', 'x'), error('b', 'x', 'arreglalo')]), 1);
  assert.equal(codigoSalida([aviso('a', 'x', 'y'), error('b', 'x', 'y'), ok('c', 'x')]), 1);
});

test('nodeSoportado: compara el mayor con el minimo, con o sin "v"', () => {
  assert.equal(nodeSoportado('22.23.3'), true);
  assert.equal(nodeSoportado('v22.0.0'), true);
  assert.equal(nodeSoportado('21.9.0'), false);
  assert.equal(nodeSoportado('20.19.0'), false);
  assert.equal(nodeSoportado('basura'), false);
  assert.equal(nodeSoportado('22.0.0', 23), false);
});

test('formatearTexto: una linea por comprobacion, el arreglo bajo cada aviso o error y un resumen', () => {
  const t = formatearTexto([
    ok('node', 'Node 22'),
    aviso('origin', 'sin origin', 'git remote add origin <url>'),
    error('config', 'valor invalido', 'corrige\nla linea 3'),
    omitida('plataforma', 'no aplica'),
  ]);
  const lineas = t.trimEnd().split('\n');
  assert.match(lineas[0] as string, /^\[ok\] +node: Node 22$/);
  assert.match(lineas[1] as string, /^\[AVISO\] +origin: sin origin$/);
  assert.match(lineas[2] as string, /Arreglo: git remote add origin <url>$/);
  assert.match(lineas[3] as string, /^\[ERROR\] +config: valor invalido$/);
  assert.match(lineas[4] as string, /Arreglo: corrige$/);
  assert.match(lineas[5] as string, /^ +la linea 3$/);
  assert.match(lineas[6] as string, /^\[omitida\] plataforma: no aplica$/);
  assert.match(lineas[7] as string, /^Resumen: 1 error, 1 aviso, 1 ok, 1 omitidas\. Corrige los errores/);
  // ok y omitida no llevan "Arreglo".
  assert.equal(lineas.filter((l) => l.includes('Arreglo:')).length, 2);
});

test('formatearJson: una linea con ok, errores, avisos y las comprobaciones con su arreglo', () => {
  const salida = formatearJson([ok('a', 'x'), aviso('b', 'y', 'z'), error('c', 'w', 'v')]);
  assert.equal(salida.endsWith('\n'), true);
  assert.equal(salida.trimEnd().includes('\n'), false, 'una sola linea');
  const j = JSON.parse(salida) as { ok: boolean; errores: number; avisos: number; comprobaciones: unknown[] };
  assert.equal(j.ok, false);
  assert.equal(j.errores, 1);
  assert.equal(j.avisos, 1);
  assert.deepEqual(j.comprobaciones, [
    { id: 'a', nivel: 'ok', mensaje: 'x', arreglo: null },
    { id: 'b', nivel: 'aviso', mensaje: 'y', arreglo: 'z' },
    { id: 'c', nivel: 'error', mensaje: 'w', arreglo: 'v' },
  ]);
  assert.equal((JSON.parse(formatearJson([ok('a', 'x')])) as { ok: boolean }).ok, true);
});

test('ninguna salida lleva credenciales de una URL, ni en texto ni en JSON', () => {
  const cs = [
    error('plataforma', 'fallo en https://usuario:secreto@gitlab.example.com/api', 'prueba https://tok3n@github.com/x'),
  ];
  for (const salida of [formatearTexto(cs), formatearJson(cs)]) {
    assert.doesNotMatch(salida, /secreto|tok3n|usuario/);
    assert.match(salida, /https:\/\/\*\*\*@/);
  }
});
