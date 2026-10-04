/**
 * Registro de transiciones (TASK-056): anadir sin tocar el resto del cuerpo,
 * leer ignorando lo que no casa, y el modo congelado en la fila de plan.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anadirTransicion,
  leerTransiciones,
  modoCongelado,
  modoDeTarea,
  registrarTransicion,
  type FilaTransicion,
} from '../../src/core/transiciones.js';

const CUERPO = '## Objetivo\n\nHacer algo.\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';

const fila = (o: Partial<FilaTransicion> = {}): FilaTransicion => ({
  fecha: '2026-10-04',
  fase: 'plan',
  modo: 'manual',
  decidido_por: 'persona',
  ...o,
});

test('anadirTransicion: sin seccion, la crea al final y deja el cuerpo intacto por encima', () => {
  const r = anadirTransicion(CUERPO, fila());
  assert.ok(r.startsWith(CUERPO.trimEnd() + '\n\n## Transiciones\n'), r);
  assert.ok(
    r.endsWith(
      '## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
        '| 2026-10-04 | plan | manual | persona |\n'
    ),
    r
  );
  assert.deepEqual(leerTransiciones(r), [fila()]);
});

test('anadirTransicion: con seccion, la fila va detras de la ultima de la tabla, aunque despues haya otra seccion', () => {
  let r = anadirTransicion(CUERPO, fila());
  // Con una tabla propia en la seccion siguiente (MEN-1): la fila no puede ir detras de ella.
  r += '\n## Resultado\n\nTexto del resultado.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n';
  r = anadirTransicion(r, fila({ fase: 'approve', decidido_por: 'automatico' }));
  assert.deepEqual(
    leerTransiciones(r).map((f) => f.fase),
    ['plan', 'approve']
  );
  // El Resultado sigue intacto y detras.
  assert.ok(r.endsWith('## Resultado\n\nTexto del resultado.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n'), r);
  const antesDeResultado = r.slice(0, r.indexOf('## Resultado'));
  assert.match(antesDeResultado, /\| 2026-10-04 \| approve \| manual \| automatico \|\n/);
});

test('anadirTransicion: respeta CRLF si el cuerpo lo usa', () => {
  const crlf = CUERPO.replace(/\n/g, '\r\n');
  const r = anadirTransicion(anadirTransicion(crlf, fila()), fila({ fase: 'start' }));
  assert.equal(r.replace(/\r\n/g, '').includes('\n'), false, 'no mezcla LF suelto');
  assert.equal(leerTransiciones(r).length, 2);
});

test('leerTransiciones: ignora filas mal formadas o con valores desconocidos, sin fallar', () => {
  const cuerpo =
    CUERPO +
    '\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
    '| 2026-10-04 | plan | automatico | persona |\n' +
    '| ayer | approve | automatico | persona |\n' +
    '| 2026-10-04 | despegar | automatico | persona |\n' +
    '| 2026-10-04 | start | turbo | persona |\n' +
    '| 2026-10-04 | start | automatico | robot |\n' +
    '| 2026-10-04 | start | automatico |\n';
  assert.deepEqual(leerTransiciones(cuerpo), [fila({ modo: 'automatico' })]);
});

test('modoCongelado: el de la ULTIMA fila plan (una re-planificacion lo vuelve a fijar); null sin fila plan', () => {
  assert.equal(modoCongelado(CUERPO), null);
  let r = anadirTransicion(CUERPO, fila({ modo: 'automatico' }));
  r = anadirTransicion(r, fila({ fase: 'pausa', modo: 'automatico' }));
  assert.equal(modoCongelado(r), 'automatico');
  r = anadirTransicion(r, fila({ modo: 'semiautomatico' }));
  assert.equal(modoCongelado(r), 'semiautomatico');
});

test('un "## Transiciones" de ejemplo dentro de un bloque de codigo del enunciado no es el registro (IMP-2)', () => {
  const ejemplo =
    '## Objetivo\n\nDocumentar el registro, con este ejemplo:\n\n```md\n## Transiciones\n\n' +
    '| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n| 2026-01-01 | plan | automatico | persona |\n' +
    '```\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
  // Antes de plan: no hay registro ni modo congelado, digan lo que digan los ejemplos.
  assert.deepEqual(leerTransiciones(ejemplo), []);
  assert.equal(modoCongelado(ejemplo), null);
  // plan crea la seccion REAL al final y deja el ejemplo intacto.
  const r = anadirTransicion(ejemplo, fila());
  assert.ok(r.startsWith(ejemplo.trimEnd()), 'el enunciado, incluido el ejemplo, no cambia');
  assert.deepEqual(leerTransiciones(r), [fila()]);
  assert.equal(modoCongelado(r), 'manual');
  // Y la siguiente fila va a la seccion real, no al ejemplo.
  const r2 = anadirTransicion(r, fila({ fase: 'approve' }));
  assert.ok(r2.startsWith(ejemplo.trimEnd()));
  assert.deepEqual(
    leerTransiciones(r2).map((f) => f.fase),
    ['plan', 'approve']
  );
});

test('filas de tabla dentro de un bloque de codigo en la propia seccion se ignoran', () => {
  const cuerpo = anadirTransicion(CUERPO, fila()) + '\n```\n| 2026-01-01 | approve | manual | persona |\n```\n';
  assert.deepEqual(leerTransiciones(cuerpo), [fila()]);
});

test('registrarTransicion: plan toma el modo del config; el resto, el congelado aunque el config cambie', () => {
  const tras = registrarTransicion(CUERPO, 'plan', '2026-10-04', 'automatico');
  const aprobada = registrarTransicion(tras, 'approve', '2026-10-05', 'manual', 'automatico');
  assert.deepEqual(leerTransiciones(aprobada), [
    fila({ modo: 'automatico' }),
    fila({ fecha: '2026-10-05', fase: 'approve', modo: 'automatico', decidido_por: 'automatico' }),
  ]);
  // Tarea anterior al registro (sin fila plan): el modo es el del config.
  assert.equal(modoDeTarea(CUERPO, 'semiautomatico'), 'semiautomatico');
  const sinPlan = registrarTransicion(CUERPO, 'start', '2026-10-04', 'semiautomatico');
  assert.equal(leerTransiciones(sinPlan)[0]?.modo, 'semiautomatico');
});
