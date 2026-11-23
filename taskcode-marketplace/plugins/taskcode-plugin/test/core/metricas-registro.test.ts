/**
 * TASK-147c (CORE2-12, CORE2-13 de la auditoria 4D): la fila del registro se
 * convierte en marcas una sola vez, asi que la duracion que anota finish y la
 * de metricas cuadran; y la fase es un solo tipo con una sola lista.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFila, celdaNumero, minutosPuntaAPunta } from '../../src/core/metricas.js';
import { FASES_REGISTRADAS } from '../../src/core/transiciones.js';
import { FASES_CICLO } from '../../src/core/progreso.js';
import { tarea } from '../helpers/tarea-ejemplo.js';

const BODY = [
  '## Objetivo',
  '',
  'Algo.',
  '',
  '## Transiciones',
  '',
  '| fecha | fase | modo | decidido_por | version |',
  '|---|---|---|---|---|',
  '| 2026-11-23T10:00:00Z | plan | automatico | persona | 0.17.1 |',
  '| 2026-11-23T10:05:00Z | start | automatico | persona | 0.17.1 |',
  '| 2026-11-23T10:20:00Z | pausa | semiautomatico | persona | 0.17.1 |',
  '| 2026-11-23T10:30:00Z | review | automatico | persona | 0.17.1 |',
  '| 2026-11-23T10:40:00Z | despliegue | automatico | persona | 0.17.1 |',
  '| 2026-11-23T11:05:00Z | finish | automatico | persona | 0.17.1 |',
  '',
].join('\n');

test('punta a punta: la duracion que anota finish y la de la fila de metricas son la misma (pausa descontada, fase desconocida fuera)', () => {
  const min = minutosPuntaAPunta(BODY);
  const fila = calcularFila({ task: tarea({ id: 'TASK-007' }), body: BODY, ronda: 1, eventosGit: [] });
  // start 10:05 -> finish 11:05 = 60 min, menos la pausa de 10:20 a 10:30.
  assert.equal(min, 50);
  assert.equal(fila.puntaAPunta?.valor, 50 * 60_000);
  assert.equal(fila.pausas, 1);
  assert.equal(fila.origen, 'registro');
});

test('fases: el ciclo de progreso es el registro sin la pausa', () => {
  assert.deepEqual([...FASES_CICLO], FASES_REGISTRADAS.filter((f) => f !== 'pausa'));
});

test('puertas (MEN-1 de la revision): los segundos fraccionarios se redondean al milisegundo, no se truncan', () => {
  const fila = calcularFila({
    task: tarea({ id: 'TASK-007' }),
    body: BODY,
    ronda: 1,
    eventosGit: [],
    sincronizacionS: 1.2346,
    freno: { ejecuciones: 2, duracionS: 0.0005 },
  });
  assert.deepEqual(fila.sincronizacion, { valor: 1235, precision: 'segundo' });
  assert.deepEqual(fila.freno, { ejecuciones: 2, duracion: { valor: 1, precision: 'segundo' } });
});

test('celdaNumero (TASK-148d, CORE2-20): la cifra con su sufijo, o «—» sin dato (nunca 0)', () => {
  assert.equal(celdaNumero(null), '—');
  assert.equal(celdaNumero(0), '0');
  assert.equal(celdaNumero(12, 'm'), '12m');
});
