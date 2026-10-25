/**
 * TASK-065: evolucion por tramos, en puro. Orden por dia de cierre con
 * desempate por proyecto y numero de ID, tramos de N, cifras con su n (null
 * solo con n 0) y las terminadas sin cierre contadas aparte por proyecto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFila, type FilaMetricas } from '../../src/core/metricas.js';
import { calcularEvolucion, formatearEvolucion, ordenarPorCierre, numeroDeId } from '../../src/core/evolucion.js';
import { tarea } from '../helpers/tarea-ejemplo.js';

function fila(o: Partial<FilaMetricas> & { id: string }): FilaMetricas {
  const base = calcularFila({ task: tarea({ id: o.id }), body: '', ronda: 0, eventosGit: [] });
  return { ...base, cierre: '2026-10-01', ...o };
}

test('orden de cierre: solo el dia, luego proyecto, luego NUMERO de ID (TASK-99 antes que TASK-100)', () => {
  const filas = [
    fila({ id: 'TASK-100', proyecto: 'a' }),
    fila({ id: 'TASK-099', proyecto: 'a' }),
    fila({ id: 'TASK-001', proyecto: 'b' }),
    fila({ id: 'TASK-500', proyecto: 'a', cierre: '2026-09-30' }),
  ];
  assert.deepEqual(
    ordenarPorCierre(filas).map((f) => `${f.proyecto}/${f.id}`),
    ['a/TASK-500', 'a/TASK-099', 'a/TASK-100', 'b/TASK-001']
  );
  assert.equal(numeroDeId('TASK-0099'), 99);
});

test('tramos de N: el ultimo parcial dice su n; sin cierre fuera y contadas por proyecto; no terminadas no entran', () => {
  const filas = [
    ...Array.from({ length: 5 }, (_, i) => fila({ id: `TASK-00${String(i + 1)}`, proyecto: 'a', cierre: `2026-10-0${String(i + 1)}` })),
    fila({ id: 'TASK-010', proyecto: 'a', cierre: null }),
    fila({ id: 'TASK-011', proyecto: 'b', cierre: null }),
    fila({ id: 'TASK-012', proyecto: 'b', cierre: null }),
    fila({ id: 'TASK-013', proyecto: 'b', estado: 'en-curso', cierre: null }),
  ];
  const e = calcularEvolucion(filas, 2);
  assert.equal(e.terminadas, 8);
  assert.equal(e.enTramos, 5);
  assert.deepEqual(e.sinCierre, { total: 3, porProyecto: { a: 1, b: 2 } });
  assert.deepEqual(e.tramos.map((t) => t.n), [2, 2, 1]);
  assert.deepEqual([e.tramos[2]?.desde, e.tramos[2]?.hasta], ['2026-10-05', '2026-10-05']);
  const texto = formatearEvolucion(e, true);
  assert.match(texto, /fuera por no tener fecha de cierre: 3 \(a 1, b 2\)\./);
});

test('cifras con su n: un tramo con tareas pero sin ningun total da mediana null con n 0, nunca NaN', () => {
  const sinTotal = [fila({ id: 'TASK-001' }), fila({ id: 'TASK-002', total: { valor: 3, precision: 'dia' } })];
  const t = calcularEvolucion(sinTotal, 20).tramos[0];
  assert.ok(t);
  assert.deepEqual(t.minutosPlanAFinish, { valor: null, n: 0, soloDia: 1 });
  assert.deepEqual(t.rondas, { valor: null, n: 0 });
  assert.deepEqual(t.importantesPorTarea, { valor: null, n: 0 });
  assert.deepEqual(t.tokensRevision, { valor: null, n: 0 });
  assert.deepEqual(t.kbPeticionPorRonda, { valor: null, n: 0 });
  assert.doesNotMatch(JSON.stringify(t), /NaN/);
  assert.match(formatearEvolucion(calcularEvolucion(sinTotal, 20), false), /\| — \(n=0\) /);
});

test('cifras: mediana de minutos con hora, rondas, IMPORTANTE por tarea, tokens y KB por ronda', () => {
  const hall = (imp: number) => ({
    informes: 1,
    informesSinTabla: [],
    porSeveridad: { CRITICO: 0, IMPORTANTE: imp, MENOR: 0, desconocida: 0 },
    porOrigen: { implementacion: imp, plan: 0, especificacion: 0, 'sin clasificar': 0 },
    severidadesDesconocidas: [],
  });
  const filas = [
    fila({ id: 'TASK-001', total: { valor: 10 * 60_000, precision: 'segundo' }, rondas: 1, hallazgos: hall(0), tokens: { diseno: null, implementacion: null, revision: 100 }, kbPeticionPorRonda: [{ ronda: 1, kb: 10 }] }),
    fila({ id: 'TASK-002', total: { valor: 30 * 60_000, precision: 'segundo' }, rondas: 3, hallazgos: hall(3), kbPeticionPorRonda: [{ ronda: 1, kb: 20 }, { ronda: 2, kb: 40 }] }),
    fila({ id: 'TASK-003', total: { valor: 2, precision: 'dia' } }),
  ];
  const t = calcularEvolucion(filas).tramos[0];
  assert.ok(t);
  assert.deepEqual(t.minutosPlanAFinish, { valor: 20, n: 2, soloDia: 1 });
  assert.deepEqual(t.rondas, { valor: 2, n: 2 });
  assert.deepEqual(t.importantesPorTarea, { valor: 1.5, n: 2 });
  assert.deepEqual(t.tokensRevision, { valor: 100, n: 1 });
  assert.deepEqual(t.kbPeticionPorRonda, { valor: 20, n: 2 });
});

test('sin tareas: cero tramos, y el texto lo dice', () => {
  const e = calcularEvolucion([], 20);
  assert.deepEqual(e, { tamanoTramo: 20, terminadas: 0, enTramos: 0, sinCierre: { total: 0, porProyecto: {} }, tramos: [] });
  assert.match(formatearEvolucion(e, false), /0 tareas terminadas, 0 en tramos; fuera por no tener fecha de cierre: ninguna\./);
});
