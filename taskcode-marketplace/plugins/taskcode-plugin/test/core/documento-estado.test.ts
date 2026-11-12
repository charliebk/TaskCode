/**
 * TASK-124: nucleo puro de la comprobacion `documento-estado` de doctor. Sin
 * Git ni disco: la fecha del commit, "hoy" y las tareas terminadas llegan ya
 * leidas. La lectura real se prueba en test/commands/doctor-documento-estado.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIAS_MAXIMOS_DOCUMENTO_ESTADO,
  diaDe,
  diaLocal,
  diasEntre,
  evaluarDocumentoEstado,
  terminadasPosteriores,
  type EntradaDocumentoEstado,
} from '../../src/core/documento-estado.js';

const HOY = '2026-11-12';

function entrada(extra: Partial<EntradaDocumentoEstado> = {}): EntradaDocumentoEstado {
  return {
    ruta: 'docs/ESTADO.md',
    existe: true,
    fechaUltimoCommit: '2026-11-10T09:30:00+01:00',
    hoy: HOY,
    terminadas: [],
    ...extra,
  };
}

/** Fecha %cI de hace `n` dias respecto a HOY (a ultima hora: se mide por dia, no por horas). */
function haceDias(n: number): string {
  const d = new Date(Date.UTC(2026, 10, 12) - n * 86_400_000);
  return `${d.toISOString().slice(0, 10)}T23:59:00+01:00`;
}

test('diaDe: el dia con que empieza el texto; null si no es una fecha valida', () => {
  assert.equal(diaDe('2026-11-10T09:30:00+01:00'), '2026-11-10');
  assert.equal(diaDe('2026-09-05'), '2026-09-05');
  assert.equal(diaDe(' 2026-09-05 '), '2026-09-05');
  assert.equal(diaDe('2026-02-30'), null);
  assert.equal(diaDe('ayer'), null);
  assert.equal(diaDe(''), null);
});

test('diaLocal: el dia del calendario local del instante', () => {
  assert.equal(diaLocal(new Date(2026, 0, 5, 12, 0, 0)), '2026-01-05');
  assert.equal(diaLocal(new Date(2026, 11, 31, 23, 59, 0)), '2026-12-31');
});

test('diasEntre: dias de calendario, atravesando meses, anos y el cambio de hora', () => {
  assert.equal(diasEntre('2026-11-12', '2026-11-12'), 0);
  assert.equal(diasEntre('2026-10-29', '2026-11-12'), 14);
  assert.equal(diasEntre('2025-12-31', '2026-01-01'), 1);
  assert.equal(diasEntre('2026-03-28', '2026-03-30'), 2);
  assert.equal(diasEntre('2026-11-13', '2026-11-12'), -1);
});

test('sin la clave: omitida, sin arreglo', () => {
  const c = evaluarDocumentoEstado(entrada({ ruta: null }));
  assert.equal(c.id, 'documento-estado');
  assert.equal(c.nivel, 'omitida');
  assert.equal(c.arreglo, null);
  assert.match(c.mensaje, /no se declara documento_estado/);
});

test('ruta inexistente: aviso con el arreglo concreto', () => {
  const c = evaluarDocumentoEstado(entrada({ existe: false }));
  assert.equal(c.nivel, 'aviso');
  assert.match(c.mensaje, /docs\/ESTADO\.md, declarado en documento_estado, no existe/);
  assert.match(c.arreglo ?? '', /Crea docs\/ESTADO\.md y commitealo/);
});

test('sin commits (o fecha ilegible): aviso que pide commitearlo', () => {
  for (const fecha of [null, 'basura']) {
    const c = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: fecha }));
    assert.equal(c.nivel, 'aviso', String(fecha));
    assert.match(c.mensaje, /no tiene ningun commit/);
    assert.match(c.arreglo ?? '', /git add docs\/ESTADO\.md/);
  }
});

test('borde de antiguedad: 13 y 14 dias son ok; 15 es aviso', () => {
  assert.equal(DIAS_MAXIMOS_DOCUMENTO_ESTADO, 14);
  const c13 = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: haceDias(13) }));
  const c14 = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: haceDias(14) }));
  const c15 = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: haceDias(15) }));
  assert.equal(c13.nivel, 'ok', c13.mensaje);
  assert.equal(c14.nivel, 'ok', c14.mensaje);
  assert.match(c14.mensaje, /hace 14 dias/);
  assert.equal(c15.nivel, 'aviso', c15.mensaje);
  assert.match(c15.mensaje, /lleva 15 dias sin actualizarse \(ultimo commit: 2026-10-28; se toleran 14\)/);
  assert.match(c15.arreglo ?? '', /Repasa docs\/ESTADO\.md con lo cerrado desde 2026-10-28 y commitealo/);
});

test('al dia: ok con la fecha; hoy y hace 1 dia se dicen asi', () => {
  const hoy = evaluarDocumentoEstado(entrada({ fechaUltimoCommit: `${HOY}T08:00:00+01:00` }));
  assert.equal(hoy.nivel, 'ok');
  assert.equal(hoy.arreglo, null);
  assert.equal(hoy.mensaje, `docs/ESTADO.md al dia: ultimo commit ${HOY} (hoy) y ninguna tarea terminada despues`);
  assert.match(evaluarDocumentoEstado(entrada({ fechaUltimoCommit: haceDias(1) })).mensaje, /\(hace 1 dia\)/);
});

test('tareas terminadas despues del documento: aviso con cuantas y la mas reciente', () => {
  const c = evaluarDocumentoEstado(
    entrada({
      terminadas: [
        { id: 'TASK-001', actualizado: '2026-11-01' },
        { id: 'TASK-002', actualizado: '2026-11-10' }, // el mismo dia: no cuenta
        { id: 'TASK-003', actualizado: '2026-11-11' },
        { id: 'TASK-004', actualizado: '2026-11-12' },
        { id: 'TASK-005', actualizado: 'roto' },
      ],
    })
  );
  assert.equal(c.nivel, 'aviso');
  assert.equal(
    c.mensaje,
    'docs/ESTADO.md va por detras de 2 tareas terminadas despues de su ultimo commit (2026-11-10); ' +
      'la mas reciente, TASK-004 (2026-11-12)'
  );
});

test('una sola tarea posterior, en singular; antiguo y por detras, los dos motivos', () => {
  const una = evaluarDocumentoEstado(entrada({ terminadas: [{ id: 'TASK-009', actualizado: '2026-11-11' }] }));
  assert.match(una.mensaje, /va por detras de 1 tarea terminada despues/);
  const ambos = evaluarDocumentoEstado(
    entrada({ fechaUltimoCommit: haceDias(20), terminadas: [{ id: 'TASK-009', actualizado: '2026-11-11' }] })
  );
  assert.equal(ambos.nivel, 'aviso');
  assert.match(ambos.mensaje, /lleva 20 dias sin actualizarse .*; y va por detras de 1 tarea terminada/);
});

test('terminadasPosteriores: ordena de la mas reciente a la mas antigua y mira solo el dia', () => {
  const r = terminadasPosteriores(
    [
      { id: 'TASK-001', actualizado: '2026-11-11' },
      { id: 'TASK-003', actualizado: '2026-11-12T10:00:00' },
      { id: 'TASK-002', actualizado: '2026-11-12' },
    ],
    '2026-11-10'
  );
  assert.deepEqual(r.map((t) => t.id), ['TASK-003', 'TASK-002', 'TASK-001']);
});
