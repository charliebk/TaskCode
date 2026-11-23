/**
 * TASK-065: lo que los agregados necesitan de cada fila (duracion total de
 * plan a finish y veredicto de la ronda 1), en puro.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFila, COLUMNAS_METRICAS, type EntradaMetricas } from '../../src/core/metricas.js';
import { tarea } from '../helpers/tarea-ejemplo.js';

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

test('TASK-153c: hallazgos 4D por D en todos los informes (ID distintos por revisor); sin seccion, sin dato', () => {
  const con4D = (ronda: number, revisor: string, seccion: string) => ({
    fichero: `informe-revision-${String(ronda)}-${revisor}.md`,
    ronda,
    revisor,
    texto: `# Informe\n\n- Veredicto: aprobada\n\n## Regla 4D\n\n${seccion}\n`,
  });
  const f = calcularFila(
    entrada({
      informes: [
        con4D(1, 'a', '- Duplicacion: IMP-1, MEN-2\n- Desviacion: cumple\n- Diluvio: cumple\n- Disfraz: IMP-3'),
        // La ronda 2 del mismo revisor repite IMP-1: cuenta una vez.
        con4D(2, 'a', '- **Duplicación**: IMP-1\n- Desviacion: cumple\n- Diluvio: MEN-4\n- Disfraz: cumple'),
        // Otro revisor con el mismo ID es otro hallazgo.
        con4D(1, 'b', '- Duplicacion: IMP-1\n- Desviacion: cumple\n- Diluvio: cumple\n- Disfraz: cumple'),
      ],
    })
  );
  assert.deepEqual(f.hallazgos4D, { Duplicacion: 3, Desviacion: 0, Diluvio: 1, Disfraz: 1 });
  const columna = COLUMNAS_METRICAS.find((c) => c.cabecera === '4d');
  assert.ok(columna !== undefined);
  assert.equal(columna.valor(f), '3/0/1/1');

  const sinSeccion = calcularFila(entrada({ informes: [informe(1, 'aprobada')] }));
  assert.equal(sinSeccion.hallazgos4D, null);
  assert.equal(columna.valor(sinSeccion), '—');
  const todoCumple = calcularFila(
    entrada({ informes: [con4D(1, 'a', '- Duplicacion: cumple\n- Desviacion: cumple\n- Diluvio: cumple\n- Disfraz: cumple')] })
  );
  assert.equal(columna.valor(todoCumple), '0/0/0/0');
});
