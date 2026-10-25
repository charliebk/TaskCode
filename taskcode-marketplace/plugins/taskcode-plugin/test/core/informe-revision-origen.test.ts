/**
 * TASK-063: `leerHallazgos` devuelve todas las filas de la tabla de
 * hallazgos con severidad y origen; `hallazgosNoCerrados` filtra sobre ella.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hallazgosNoCerrados, leerHallazgos } from '../../src/core/informe-revision.js';
import { informeTemplate } from '../../src/commands/review.js';
import { sampleTask } from '../helpers/finish-fixtures.js';

const CON_ORIGEN =
  '# Informe\n\n- Veredicto: aprobada\n\n## Hallazgos\n\n' +
  '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
  '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) | (implementacion / plan / especificacion) |\n' +
  '| CRIT-1 | CRITICO | corregido | a.ts:3 | implementacion |\n' +
  '| IMP-1 | IMPORTANTE | abierto | b.ts | **Plan** |\n' +
  '| IMP-2 | IMPORTANTE | aceptado | c.ts | Especificación |\n' +
  '| MEN-1 | MENOR | abierto | d.ts | el plan, creo |\n' +
  '| MEN-2 | MENOR | abierto | e.ts |  |\n';

test('leerHallazgos: todas las filas (abiertas y cerradas) con severidad y origen normalizado', () => {
  const r = leerHallazgos(CON_ORIGEN);
  assert.equal(r.tabla, true);
  assert.deepEqual(
    r.hallazgos.map((h) => [h.id, h.severidad, h.estado, h.origen]),
    [
      ['CRIT-1', 'CRITICO', 'corregido', 'implementacion'],
      ['IMP-1', 'IMPORTANTE', 'abierto', 'plan'],
      ['IMP-2', 'IMPORTANTE', 'aceptado', 'especificacion'],
      ['MEN-1', 'MENOR', 'abierto', 'sin clasificar'],
      ['MEN-2', 'MENOR', 'abierto', 'sin clasificar'],
    ]
  );
  // El filtro de abiertos sale de la misma lectura, con la forma de siempre.
  assert.deepEqual(hallazgosNoCerrados(CON_ORIGEN), {
    tabla: true,
    abiertos: [
      { id: 'IMP-1', severidad: 'IMPORTANTE', estado: 'abierto', fichero: 'b.ts' },
      { id: 'MEN-1', severidad: 'MENOR', estado: 'abierto', fichero: 'd.ts' },
      { id: 'MEN-2', severidad: 'MENOR', estado: 'abierto', fichero: 'e.ts' },
    ],
  });
});

test('leerHallazgos: informe antiguo sin columna Origen, todo "sin clasificar"; sin tabla, tabla=false', () => {
  const antiguo =
    '## Hallazgos\n\n| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n' +
    '| IMP-1 | IMPORTANTE | corregido | a.ts |\n| MEN-1 | MENOR | aceptado | b.ts |\n';
  const r = leerHallazgos(antiguo);
  assert.equal(r.tabla, true);
  assert.deepEqual(
    r.hallazgos.map((h) => [h.id, h.severidad, h.origen]),
    [
      ['IMP-1', 'IMPORTANTE', 'sin clasificar'],
      ['MEN-1', 'MENOR', 'sin clasificar'],
    ]
  );
  assert.deepEqual(leerHallazgos('## Hallazgos\n\nsin hallazgos\n'), { tabla: false, hallazgos: [] });
  assert.deepEqual(leerHallazgos('# Informe sin seccion\n'), { tabla: false, hallazgos: [] });
});

test('leerHallazgos: la columna se busca por nombre (en cualquier posicion, con aclaracion) y no dentro de codigo', () => {
  const movida =
    '## Hallazgos\n\n```\n| ID | Estado | Origen |\n| X-1 | abierto | plan |\n```\n\n' +
    '| Origen (implementacion / plan / especificacion) | ID | Estado | Severidad |\n|---|---|---|---|\n' +
    '| especificacion | IMP-9 | abierto | IMPORTANTE |\n';
  assert.deepEqual(
    leerHallazgos(movida).hallazgos.map((h) => [h.id, h.severidad, h.origen]),
    [['IMP-9', 'IMPORTANTE', 'especificacion']]
  );
});

test('la plantilla de informe de taskctl review lleva la columna Origen y la instruccion; su fila de ejemplo no cuenta', () => {
  const plantilla = informeTemplate(sampleTask({ id: 'TASK-777' }), 'abc1234', 1);
  assert.match(plantilla, /^\| ID \| Severidad \| Estado \| Fichero \| Origen \|$/m);
  assert.match(plantilla, /\(implementacion \/ plan \/ especificacion\)/);
  assert.match(plantilla, /`implementacion` si el codigo no hace lo que el plan pedia; `plan` si/);
  assert.match(plantilla, /`especificacion` si el fallo esta en el\nenunciado/);
  assert.deepEqual(leerHallazgos(plantilla), { tabla: true, hallazgos: [] });
  // Rellenada por un revisor, la lectura da el origen.
  const rellena = plantilla.replace(
    /^\| \(ej\. IMP-1\).*$/m,
    '| IMP-1 | IMPORTANTE | abierto | src/x.ts:4 | plan |'
  );
  assert.deepEqual(
    leerHallazgos(rellena).hallazgos.map((h) => [h.id, h.origen]),
    [['IMP-1', 'plan']]
  );
});
