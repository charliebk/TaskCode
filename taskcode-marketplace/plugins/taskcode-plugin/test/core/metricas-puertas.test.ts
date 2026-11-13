/**
 * TASK-128: metricas por puerta de verificacion (freno, review, finish) y
 * rondas abiertas solo por MENORES. Logica pura, sin disco.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatearLineaPuerta,
  parsearRegistroPuertas,
  PUERTA_FINISH,
  PUERTA_REVIEW,
  PUERTAS_VERIFICACION,
  resumirPuerta,
  type LineaPuerta,
} from '../../src/core/registro-puertas.js';
import { rondasSoloMenores, type InformeLeido } from '../../src/core/informe-revision.js';
import { calcularFila, COLUMNAS_METRICAS, lineaTotalesPuertas } from '../../src/core/metricas.js';
import { buildNewTask } from '../../src/commands/new.js';

const L: LineaPuerta = {
  puerta: PUERTA_REVIEW,
  tarea: 'TASK-128',
  instante: '2026-11-13T01:02:03.000Z',
  modo: 'selectiva',
  duracionS: 30,
  resultado: 'verde',
};

test('registro (TASK-128): resumirPuerta cuenta review y finish por separado, sin omitidos, e ignora las demas puertas', () => {
  const lineas = parsearRegistroPuertas(
    [
      formatearLineaPuerta(L),
      formatearLineaPuerta({ ...L, resultado: 'rojo', duracionS: 40 }),
      formatearLineaPuerta({ ...L, resultado: 'omitido', duracionS: 0 }),
      formatearLineaPuerta({ ...L, puerta: PUERTA_FINISH, modo: 'completa', duracionS: 600 }),
      formatearLineaPuerta({ ...L, puerta: 'freno', duracionS: 999 }),
    ].join('\n')
  );
  assert.deepEqual(resumirPuerta(lineas, PUERTA_REVIEW).get('TASK-128'), { ejecuciones: 2, duracionS: 70 });
  assert.deepEqual(resumirPuerta(lineas, PUERTA_FINISH).get('TASK-128'), { ejecuciones: 1, duracionS: 600 });
  assert.equal(resumirPuerta(lineas, 'pesada').size, 0);
  assert.deepEqual([...PUERTAS_VERIFICACION], ['freno', 'review', 'finish']);
});

function informe(ronda: number, filas: string[], revisor = ''): InformeLeido {
  const tabla = filas.length === 0 ? '' : ['| ID | Severidad | Estado |', '|---|---|---|', ...filas].join('\n');
  return { fichero: `informe-revision-${String(ronda)}.md`, ronda, revisor, texto: `# Informe\n\n## Hallazgos\n\n${tabla}\n\n## Verificacion\n` };
}

test('rondasSoloMenores (TASK-128): cuenta las rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE', () => {
  const men = '| MEN-1 | MENOR | corregido |';
  const imp = '| IMP-1 | IMPORTANTE | corregido |';
  assert.equal(rondasSoloMenores([informe(1, [men]), informe(2, [])]), 1, 'ronda 2 abierta solo por un MENOR');
  assert.equal(rondasSoloMenores([informe(1, [imp, men]), informe(2, [])]), 0, 'la ronda 1 traia un IMPORTANTE');
  assert.equal(rondasSoloMenores([informe(1, [imp]), informe(2, [men]), informe(3, [])]), 1, 'solo la 3');
  assert.equal(rondasSoloMenores([informe(1, [men])]), 0, 'una sola ronda: 0, no sin dato');
  assert.equal(
    rondasSoloMenores([informe(1, [men]), informe(1, ['| CRI-1 | CRITICO | abierto |'], 'b'), informe(2, [])]),
    0,
    'un revisor de la ronda con un CRITICO basta'
  );
});

test('rondasSoloMenores (TASK-128): sin informes o con un informe sin tabla que haria falta mirar, sin dato (null)', () => {
  assert.equal(rondasSoloMenores([]), null);
  const sinTabla: InformeLeido = { fichero: 'informe-revision-1.md', ronda: 1, revisor: '', texto: 'en prosa, sin tabla' };
  assert.equal(rondasSoloMenores([sinTabla, informe(2, [])]), null);
});

test('metricas (TASK-128): columnas review_n, review_v, finish_n, finish_v y rondas_men, con «—» sin dato, y la fila de totales', () => {
  const task = buildNewTask(
    'TASK-128',
    { titulo: 't', tipo: 'feature', sprint: 0, etiquetas: [], complejidad: null, modeloSugerido: 'sonnet', agenteRevisor: 'g' },
    '2026-11-13'
  );
  const col = (c: string) => COLUMNAS_METRICAS.find((x) => x.cabecera === c) as (typeof COLUMNAS_METRICAS)[number];
  const base = { task, body: '', ronda: 0, eventosGit: [] };
  const con = calcularFila({
    ...base,
    freno: { ejecuciones: 4, duracionS: 60 },
    review: { ejecuciones: 2, duracionS: 125 },
    finishVerificacion: { ejecuciones: 1, duracionS: 1800 },
    informes: [informe(1, ['| MEN-1 | MENOR | corregido |']), informe(2, [])],
  });
  assert.deepEqual(
    ['review_n', 'review_v', 'finish_n', 'finish_v', 'rondas_men'].map((c) => col(c).valor(con)),
    ['2', '2m', '1', '30m', '1']
  );
  const sin = calcularFila(base);
  assert.deepEqual(
    ['review_n', 'review_v', 'finish_n', 'finish_v', 'rondas_men'].map((c) => col(c).valor(sin)),
    ['—', '—', '—', '—', '—']
  );
  assert.equal(
    lineaTotalesPuertas([con, sin, calcularFila({ ...base, review: { ejecuciones: 1, duracionS: 55 } })]),
    'Puertas de verificacion (todas las tareas): freno 4 (1m), review 3 (3m), finish 1 (30m)'
  );
  assert.equal(lineaTotalesPuertas([sin]), 'Puertas de verificacion (todas las tareas): freno —, review —, finish —');
});
