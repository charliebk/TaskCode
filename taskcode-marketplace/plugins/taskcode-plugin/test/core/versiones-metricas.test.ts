/**
 * TASK-084: metricas por version del plugin, en puro. Orden semver (no
 * lexicografico), grupo «sin version» aparte, solo terminadas, hallazgos
 * sumados solo de las tareas con tabla y tokens con su n.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFila, type FilaMetricas } from '../../src/core/metricas.js';
import {
  calcularPorVersion,
  compararVersiones,
  formatearPorVersion,
  resumirVersion,
} from '../../src/core/versiones-metricas.js';
import { tarea } from '../helpers/tarea-ejemplo.js';

function fila(o: Partial<FilaMetricas> & { id: string }): FilaMetricas {
  const base = calcularFila({ task: tarea({ id: o.id }), body: '', ronda: 0, eventosGit: [] });
  return { ...base, proyecto: 'a', estado: 'terminada', ...o };
}

const hall = (crit: number, imp: number, men: number, origen: { impl: number; plan: number }) => ({
  informes: 1,
  informesSinTabla: [],
  porSeveridad: { CRITICO: crit, IMPORTANTE: imp, MENOR: men, desconocida: 0 },
  porOrigen: {
    implementacion: origen.impl,
    plan: origen.plan,
    especificacion: 0,
    'sin clasificar': crit + imp + men - origen.impl - origen.plan,
  },
  severidadesDesconocidas: [],
});
const sinTabla = {
  informes: 1,
  informesSinTabla: ['informe-revision-1.md'],
  porSeveridad: null,
  porOrigen: null,
  severidadesDesconocidas: [],
};
const tokens = (diseno: number | null, implementacion: number | null, revision: number | null) => ({
  diseno,
  implementacion,
  revision,
});

test('compararVersiones: por componentes numericos, y la pre-release antes de su release', () => {
  const desordenadas = ['0.10.0', '0.9.1', '1.0.0', '0.12.0', '0.12.0-dev', '0.9.0', '0.12.0-dev.2', '0.12.0-dev.10', '0.12.0-rc.1'];
  assert.deepEqual([...desordenadas].sort(compararVersiones), [
    '0.9.0',
    '0.9.1',
    '0.10.0',
    '0.12.0-dev',
    '0.12.0-dev.2',
    '0.12.0-dev.10',
    '0.12.0-rc.1',
    '0.12.0',
    '1.0.0',
  ]);
  assert.equal(compararVersiones('0.11.0', '0.11.0'), 0);
});

test('calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera', () => {
  const filas = [
    fila({ id: 'TASK-001', versionCierre: '0.10.0', rondas: 1, veredictoRonda1: 'aprobada', hallazgos: hall(0, 1, 2, { impl: 2, plan: 1 }), tokens: tokens(100, 1000, 500) }),
    fila({ id: 'TASK-002', versionCierre: '0.9.0', rondas: 2, veredictoRonda1: 'cambios-solicitados', hallazgos: hall(1, 2, 0, { impl: 3, plan: 0 }), tokens: tokens(null, 2000, null) }),
    fila({ id: 'TASK-003', versionCierre: '0.10.0', rondas: 3, veredictoRonda1: 'cambios-solicitados', hallazgos: hall(0, 3, 1, { impl: 4, plan: 0 }), tokens: tokens(300, null, 1500) }),
    // Revisada sin tabla: cuenta en rondas, no en hallazgos.
    fila({ id: 'TASK-004', versionCierre: '0.10.0', rondas: 1, veredictoRonda1: 'aprobada', hallazgos: sinTabla }),
    // Sin revision.
    fila({ id: 'TASK-005', versionCierre: '0.10.0' }),
    // Sin version anotada (cerrada antes de anotarla): nunca se reparte.
    fila({ id: 'TASK-006', versionCierre: null, rondas: 1, veredictoRonda1: 'aprobada', hallazgos: hall(0, 0, 1, { impl: 1, plan: 0 }) }),
    // No terminada: fuera aunque lleve version.
    fila({ id: 'TASK-007', versionCierre: '0.10.0', estado: 'en-revision', rondas: 1, veredictoRonda1: 'aprobada' }),
  ];
  const p = calcularPorVersion(filas);
  assert.equal(p.terminadas, 6);
  assert.deepEqual(p.versiones.map((g) => [g.version, g.n]), [
    ['0.9.0', 1],
    ['0.10.0', 4],
  ]);
  const v10 = p.versiones[1];
  assert.ok(v10 !== undefined);
  assert.equal(v10.conRevision, 3);
  assert.equal(v10.aprobadasPrimera, 2);
  assert.equal(v10.pctAprobadaPrimera, 66.7);
  assert.equal(v10.rondasMedia, 1.67);
  assert.equal(v10.sinRevision, 1);
  assert.equal(v10.conHallazgos, 2);
  assert.equal(v10.sinTablaHallazgos, 1);
  assert.deepEqual(v10.hallazgosPorSeveridad, { CRITICO: 0, IMPORTANTE: 4, MENOR: 3, desconocida: 0 });
  assert.deepEqual(v10.hallazgosPorOrigen, { implementacion: 6, plan: 1, especificacion: 0, 'sin clasificar': 0 });
  assert.deepEqual(v10.tokens, {
    diseno: { suma: 400, conDato: 2, media: 200 },
    implementacion: { suma: 1000, conDato: 1, media: 1000 },
    revision: { suma: 2000, conDato: 2, media: 1000 },
  });
  assert.equal(p.sinVersion.version, null);
  assert.equal(p.sinVersion.n, 1);
  assert.equal(p.sinVersion.hallazgosPorSeveridad.MENOR, 1);
});

test('resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN)', () => {
  const g = resumirVersion(null, []);
  assert.equal(g.n, 0);
  assert.equal(g.pctAprobadaPrimera, null);
  assert.equal(g.rondasMedia, null);
  assert.deepEqual(g.tokens.diseno, { suma: 0, conDato: 0, media: null });
  assert.doesNotMatch(JSON.stringify(g), /NaN/);
});

test('formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota', () => {
  const filas = [
    fila({ id: 'TASK-001', versionCierre: '0.10.0', rondas: 1, veredictoRonda1: 'aprobada', hallazgos: hall(1, 0, 0, { impl: 1, plan: 0 }) }),
    fila({ id: 'TASK-002', versionCierre: '0.9.0' }),
    fila({ id: 'TASK-003', versionCierre: null }),
  ];
  const texto = formatearPorVersion(calcularPorVersion(filas));
  assert.match(texto, /^Por version de 3 tareas terminadas \(sin version anotada: 1\)\./);
  const orden = texto.split('\n').filter((l) => /^\| (0\.|sin version)/.test(l)).map((l) => l.split('|')[1]?.trim());
  // Dos tablas (general y hallazgos), cada una en orden semver y con «sin version» al final.
  assert.deepEqual(orden, ['0.9.0', '0.10.0', 'sin version', '0.9.0', '0.10.0', 'sin version']);
  assert.match(texto, /Hallazgos por severidad y origen:/);
  assert.doesNotMatch(texto, /NaN|undefined|null/);
  const sinNinguna = formatearPorVersion(calcularPorVersion(filas.slice(0, 2)));
  assert.doesNotMatch(sinNinguna, /^\| sin version/m, 'sin tareas sin version, no sale su fila');
});
