/**
 * TASK-120: formato comun del registro de puertas. Logica pura, sin disco.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatearLineaPuerta,
  parsearRegistroPuertas,
  sumarPorTarea,
  tareaDeMensaje,
  type LineaPuerta,
} from '../../src/core/registro-puertas.js';
import { calcularFila, COLUMNAS_METRICAS } from '../../src/core/metricas.js';
import { buildNewTask } from '../../src/commands/new.js';

const L: LineaPuerta = {
  puerta: 'sincronizacion',
  tarea: 'TASK-120',
  instante: '2026-11-13T01:02:03.000Z',
  modo: 'finish',
  duracionS: 1.234,
  resultado: 'aplicada',
};

test('registro de puertas (TASK-120): seis campos con tabulador, duracion con un decimal, ida y vuelta', () => {
  const linea = formatearLineaPuerta(L);
  assert.equal(linea, 'sincronizacion\tTASK-120\t2026-11-13T01:02:03.000Z\tfinish\t1.2\taplicada');
  assert.deepEqual(parsearRegistroPuertas(`${linea}\n`), [{ ...L, duracionS: 1.2 }]);
});

test('registro de puertas (TASK-120): un campo con tabuladores o saltos no rompe la linea, y vacio es "-"', () => {
  const linea = formatearLineaPuerta({ ...L, resultado: 'con\ttab\ny salto', tarea: '' });
  assert.equal(linea.split('\t').length, 6);
  assert.equal(parsearRegistroPuertas(linea)[0]?.tarea, '-');
});

test('registro de puertas (TASK-120): las lineas rotas se ignoran y la suma por tarea ignora otras puertas', () => {
  const texto = [
    formatearLineaPuerta(L),
    formatearLineaPuerta({ ...L, duracionS: 2 }),
    formatearLineaPuerta({ ...L, tarea: 'TASK-121', duracionS: 5 }),
    formatearLineaPuerta({ ...L, puerta: 'freno-stop', duracionS: 99 }),
    'linea rota',
    'sincronizacion\tTASK-120\tx\tplan\tno-numero\taplicada',
    '',
  ].join('\r\n');
  const lineas = parsearRegistroPuertas(texto);
  assert.equal(lineas.length, 4);
  const suma = sumarPorTarea(lineas, 'sincronizacion');
  assert.equal(suma.get('TASK-120')?.toFixed(1), '3.2');
  assert.equal(suma.get('TASK-121'), 5);
  assert.equal(suma.size, 2, 'freno-stop no cuenta para la sincronizacion');
});

test('registro de puertas (TASK-120): la tarea sale del mensaje del commit automatico', () => {
  assert.equal(tareaDeMensaje('chore(TASK-120): plan aprobado'), 'TASK-120');
  assert.equal(tareaDeMensaje('chore(TASK-121a): subtarea'), 'TASK-121a');
  assert.equal(tareaDeMensaje('docs: sin tarea'), null);
});

test('metricas (TASK-120): columna sinc con la suma de la tarea, y "—" sin registro', () => {
  const task = buildNewTask(
    'TASK-120',
    { titulo: 't', tipo: 'feature', sprint: 0, etiquetas: [], complejidad: null, modeloSugerido: 'sonnet', agenteRevisor: 'g' },
    '2026-11-13'
  );
  const sinc = COLUMNAS_METRICAS.find((c) => c.cabecera === 'sinc');
  assert.ok(sinc);
  const base = { task, body: '', ronda: 0, eventosGit: [] };
  assert.equal(sinc.valor(calcularFila({ ...base, sincronizacionS: 75.4 })), '1m');
  assert.equal(sinc.valor(calcularFila({ ...base, sincronizacionS: 3.2 })), '3s');
  assert.equal(sinc.valor(calcularFila({ ...base, sincronizacionS: null })), '—');
  assert.equal(sinc.valor(calcularFila(base)), '—');
});
