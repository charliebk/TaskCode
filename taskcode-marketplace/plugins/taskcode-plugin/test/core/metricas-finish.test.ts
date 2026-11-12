/**
 * P-1: la columna `finish` de `taskctl metricas` (duracion del propio cierre,
 * leida de `## Duracion`), en puro. Con linea -> valor; sin linea o con una
 * fecha invalida -> `—`; va justo antes de `punta_a_punta`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNAS_METRICAS, calcularFila, formatearTabla, type EntradaMetricas } from '../../src/core/metricas.js';
import type { Task } from '../../src/core/task.js';

function tarea(): Task {
  return {
    id: 'TASK-007',
    titulo: 'Medir',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'terminada',
    plan_aprobado: true,
    rama: null,
    asignado_a: null,
    agente_revisor: null,
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
  } as unknown as Task;
}

const TRANSICIONES =
  '## Objetivo\n\nAlgo.\n\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
  '| 2026-10-01T10:00:00Z | start | manual | persona |\n' +
  '| 2026-10-01T11:00:00Z | review | manual | persona |\n' +
  '| 2026-10-01T12:00:00Z | finish | manual | persona |\n';

function entrada(extra: string): EntradaMetricas {
  return { task: tarea(), body: TRANSICIONES + extra, ronda: 0, eventosGit: [] };
}

const CIERRE = '\n## Duracion\n\n- Estimada: 30 min\n- Cierre (finish): 1680 s, de 2026-10-01T11:32:00Z a 2026-10-01T12:00:00Z\n';

function celda(f: ReturnType<typeof calcularFila>, cabecera: string): string {
  return (COLUMNAS_METRICAS.find((c) => c.cabecera === cabecera) as (typeof COLUMNAS_METRICAS)[number]).valor(f);
}

test('con linea de cierre: finish es esa duracion, con precision de segundo', () => {
  const f = calcularFila(entrada(CIERRE));
  assert.deepEqual(f.finish, { valor: 1_680_000, precision: 'segundo' });
  assert.equal(celda(f, 'finish'), '28m');
});

test('sin linea de cierre: finish es null y la celda «—» (nunca 0)', () => {
  const f = calcularFila(entrada(''));
  assert.equal(f.finish, null);
  assert.equal(celda(f, 'finish'), '—');
  const f2 = calcularFila(entrada('\n## Duracion\n\n- Estimada: 30 min\n'));
  assert.equal(f2.finish, null);
});

test('con una fecha invalida en la linea: finish es null y la celda «—»', () => {
  const mala = '\n## Duracion\n\n- Cierre (finish): 1680 s, de 2026-13-45T11:32:00Z a 2026-10-01T12:00:00Z\n';
  const f = calcularFila(entrada(mala));
  assert.equal(f.finish, null);
  assert.equal(celda(f, 'finish'), '—');
});

test('finish no altera punta_a_punta ni las demas duraciones', () => {
  const con = calcularFila(entrada(CIERRE));
  const sin = calcularFila(entrada(''));
  assert.deepEqual(con.puntaAPunta, sin.puntaAPunta);
  assert.deepEqual(con.revision, sin.revision);
  assert.deepEqual(con.total, sin.total);
  assert.equal(celda(con, 'punta_a_punta'), '2h 00m');
});

test('la columna finish va justo antes de punta_a_punta, tambien en la tabla', () => {
  const cabeceras = COLUMNAS_METRICAS.map((c) => c.cabecera);
  assert.equal(cabeceras.indexOf('finish'), cabeceras.indexOf('punta_a_punta') - 1);
  assert.equal(cabeceras.indexOf('estimada') + 1, cabeceras.indexOf('finish'));
  const tabla = formatearTabla([calcularFila(entrada(CIERRE))], COLUMNAS_METRICAS);
  const [cab, , fila] = tabla.split('\n') as [string, string, string];
  assert.match(cab, /\| estimada \| finish \| punta_a_punta \|$/);
  assert.match(fila, /\| 30m +\| 28m +\| 2h 00m +\|$/);
});
