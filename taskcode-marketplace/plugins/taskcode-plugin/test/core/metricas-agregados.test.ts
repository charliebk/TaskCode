/**
 * TASK-065: lo que los agregados necesitan de cada fila (duracion total de
 * plan a finish y veredicto de la ronda 1), en puro.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFila, type EntradaMetricas } from '../../src/core/metricas.js';
import type { Task } from '../../src/core/task.js';

export function tarea(o: Partial<Task> = {}): Task {
  return {
    id: 'TASK-007',
    titulo: 'Medir',
    tipo: 'fix',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'terminada',
    plan_aprobado: true,
    rama: 'fix/x',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: '2026-10-01',
    actualizado: '2026-10-05',
    dependencias: [],
    ...o,
  } as Task;
}

function transiciones(...filas: [string, string][]): string {
  return [
    '## Transiciones',
    '',
    '| fecha | fase | modo | decidido_por |',
    '|---|---|---|---|',
    ...filas.map(([fecha, fase]) => `| ${fecha} | ${fase} | manual | persona |`),
    '',
  ].join('\n');
}

function entrada(o: Partial<EntradaMetricas> = {}): EntradaMetricas {
  return { task: tarea(), body: '## Objetivo\n\nAlgo.\n', ronda: 0, eventosGit: [], ...o };
}

const informe = (ronda: number, veredicto: string, revisor = '') => ({
  fichero: `informe-revision-${String(ronda)}${revisor === '' ? '' : `-${revisor}`}.md`,
  ronda,
  revisor,
  texto: `# Informe\n\n- Veredicto: ${veredicto}\n`,
});

test('total: de plan a finish en ms con hora, en dias si alguna marca es de dia, null sin finish', () => {
  const conHora = calcularFila(
    entrada({ body: transiciones(['2026-10-01T10:00:00Z', 'plan'], ['2026-10-01T11:30:00Z', 'finish']) })
  );
  assert.deepEqual(conHora.total, { valor: 90 * 60_000, precision: 'segundo' });
  const dia = calcularFila(entrada({ body: transiciones(['2026-10-01', 'plan'], ['2026-10-03T11:30:00Z', 'finish']) }));
  assert.deepEqual(dia.total, { valor: 2, precision: 'dia' });
  const sinFin = calcularFila(entrada({ body: transiciones(['2026-10-01T10:00:00Z', 'plan']) }));
  assert.equal(sinFin.total, null);
});

test('veredictoRonda1: aprobada-con-correcciones cuenta como aprobada; un fragmento que pide cambios manda; null sin informes de la ronda 1', () => {
  assert.equal(calcularFila(entrada({ informes: [informe(1, 'aprobada-con-correcciones')] })).veredictoRonda1, 'aprobada');
  assert.equal(
    calcularFila(entrada({ informes: [informe(1, 'aprobada', 'a'), informe(1, 'cambios-solicitados', 'b')] })).veredictoRonda1,
    'cambios-solicitados'
  );
  // La ronda 2 no cambia el veredicto de la primera.
  assert.equal(
    calcularFila(entrada({ informes: [informe(1, 'cambios-solicitados'), informe(2, 'aprobada')] })).veredictoRonda1,
    'cambios-solicitados'
  );
  assert.equal(calcularFila(entrada()).veredictoRonda1, null);
  assert.equal(calcularFila(entrada({ informes: [informe(2, 'aprobada')] })).veredictoRonda1, null);
});
