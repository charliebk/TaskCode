/**
 * TASK-065: grupos de tareas terminadas, en puro. Grupos fijos (un grupo
 * vacio sale con n 0 y cifras null), «aprobada a la primera» sobre las
 * revisadas, sin revision y sin tabla aparte, y terciles de KB por valor con
 * todos los proyectos juntos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFila, type FilaMetricas } from '../../src/core/metricas.js';
import { calcularGrupos, formatearGrupos, tramoCriterios, aprobadaALaPrimera } from '../../src/core/grupos-metricas.js';
import { tarea } from '../helpers/tarea-ejemplo.js';

function fila(o: Partial<FilaMetricas> & { id: string }): FilaMetricas {
  const base = calcularFila({ task: tarea({ id: o.id }), body: '', ronda: 0, eventosGit: [] });
  return { ...base, proyecto: 'a', ...o };
}

const hall = (crit: number, imp: number) => ({
  informes: 1,
  informesSinTabla: [],
  porSeveridad: { CRITICO: crit, IMPORTANTE: imp, MENOR: 5, desconocida: 0 },
  porOrigen: { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': crit + imp + 5 },
  severidadesDesconocidas: [],
});
const sinTabla = {
  informes: 1,
  informesSinTabla: ['informe-revision-1.md'],
  porSeveridad: null,
  porOrigen: null,
  severidadesDesconocidas: [],
};
const kb = (...v: number[]) => v.map((x, i) => ({ ronda: i + 1, kb: x }));

test('aprobada a la primera: una sola ronda y veredicto aprobada (incluye con correcciones); con cambios o dos rondas no', () => {
  assert.equal(aprobadaALaPrimera(fila({ id: 'TASK-001', rondas: 1, veredictoRonda1: 'aprobada' })), true);
  assert.equal(aprobadaALaPrimera(fila({ id: 'TASK-001', rondas: 1, veredictoRonda1: 'cambios-solicitados' })), false);
  assert.equal(aprobadaALaPrimera(fila({ id: 'TASK-001', rondas: 2, veredictoRonda1: 'aprobada' })), false);
  assert.deepEqual([0, 4, 5, 6, 7, 30].map(tramoCriterios), ['0-4', '0-4', '5-6', '5-6', '7+', '7+']);
});

test('grupos: fijos y vacios con n 0 y null; % sobre revisadas; sin revision y sin tabla aparte; no terminadas fuera', () => {
  const filas = [
    fila({ id: 'TASK-001', tipo: 'fix', criterios: 3, rondas: 1, veredictoRonda1: 'aprobada', hallazgos: hall(1, 1) }),
    fila({ id: 'TASK-002', tipo: 'fix', criterios: 5, rondas: 2, veredictoRonda1: 'cambios-solicitados', hallazgos: hall(0, 2) }),
    fila({ id: 'TASK-003', tipo: 'fix', criterios: 9, rondas: 1, veredictoRonda1: 'aprobada', hallazgos: sinTabla }),
    fila({ id: 'TASK-004', tipo: 'fix', criterios: 9 }),
    fila({ id: 'TASK-005', tipo: 'feature', estado: 'en-curso', rondas: 1, veredictoRonda1: 'aprobada' }),
  ];
  const g = calcularGrupos(filas, ['a', 'b']);
  assert.equal(g.terminadas, 4);
  assert.equal(g.sinRevision, 1);
  assert.equal(g.sinTablaHallazgos, 1);
  assert.deepEqual(
    g.porTipo.find((x) => x.grupo === 'fix'),
    {
      grupo: 'fix',
      n: 4,
      conRevision: 3,
      aprobadasPrimera: 2,
      pctAprobadaPrimera: 66.7,
      rondasMedia: 1.33,
      conHallazgos: 2,
      critImpPorTarea: 2,
      sinRevision: 1,
      sinTablaHallazgos: 1,
    }
  );
  assert.deepEqual(
    g.porTipo.find((x) => x.grupo === 'feature'),
    {
      grupo: 'feature',
      n: 0,
      conRevision: 0,
      aprobadasPrimera: 0,
      pctAprobadaPrimera: null,
      rondasMedia: null,
      conHallazgos: 0,
      critImpPorTarea: null,
      sinRevision: 0,
      sinTablaHallazgos: 0,
    }
  );
  assert.deepEqual(g.porTipo.map((x) => x.grupo), ['feature', 'fix', 'hotfix', 'release']);
  assert.deepEqual(g.porComplejidad.map((x) => x.grupo), ['trivial', 'simple', 'media', 'alta', 'critica', '—']);
  assert.deepEqual(g.porCriterios.map((x) => [x.grupo, x.n]), [['0-4', 1], ['5-6', 1], ['7+', 2]]);
  assert.deepEqual(g.porProyecto.map((x) => [x.grupo, x.n]), [['a', 4], ['b', 0]], 'un proyecto sin tareas sale con n 0');
  assert.doesNotMatch(JSON.stringify(g), /NaN/);
  assert.match(formatearGrupos(g), /\| feature +\| 0 +\| 0 +\| — +\| — +\| — +\| 0 +\| 0 +\|/);
});

test('terciles de KB: cortes por valor con todos los proyectos juntos; iguales en el mismo tercil; sin peticion fuera', () => {
  const filas = [
    fila({ id: 'TASK-001', proyecto: 'a', kbPeticionPorRonda: kb(1) }),
    fila({ id: 'TASK-002', proyecto: 'a', kbPeticionPorRonda: kb(2, 4) }), // media 3
    fila({ id: 'TASK-003', proyecto: 'b', kbPeticionPorRonda: kb(3) }),
    fila({ id: 'TASK-004', proyecto: 'b', kbPeticionPorRonda: kb(9) }),
    fila({ id: 'TASK-005', proyecto: 'b', kbPeticionPorRonda: kb(20) }),
    fila({ id: 'TASK-006', proyecto: 'b', kbPeticionPorRonda: kb(30) }),
    fila({ id: 'TASK-007', proyecto: 'b' }),
  ];
  const g = calcularGrupos(filas, ['a', 'b']);
  // Ordenados: 1, 3, 3, 9, 20, 30 -> c1 = posicion 2 (3), c2 = posicion 4 (9).
  assert.deepEqual(g.porKb.cortes, { c1: 3, c2: 9 });
  assert.equal(g.porKb.sinKb, 1);
  assert.deepEqual(g.porKb.grupos.map((x) => [x.grupo, x.n]), [
    ['bajo (<= 3 KB)', 3],
    ['medio (3-9 KB)', 1],
    ['alto (> 9 KB)', 2],
  ]);
});

test('sin tareas: todos los grupos vacios, cortes null, y el texto sin NaN', () => {
  const g = calcularGrupos([], []);
  assert.equal(g.terminadas, 0);
  assert.equal(g.porKb.cortes, null);
  assert.deepEqual(g.porKb.grupos.map((x) => [x.grupo, x.n, x.pctAprobadaPrimera]), [
    ['bajo', 0, null],
    ['medio', 0, null],
    ['alto', 0, null],
  ]);
  assert.deepEqual(g.porProyecto, []);
  assert.doesNotMatch(formatearGrupos(g) + JSON.stringify(g), /NaN|undefined/);
});
