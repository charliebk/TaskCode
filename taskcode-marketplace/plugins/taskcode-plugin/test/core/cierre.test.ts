import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lineaCierre, anotarCierre, leerCierre } from '../../src/core/cierre.js';
import { anotarDuracion } from '../../src/core/duracion-estimada.js';

const A = '2026-11-12T10:00:00Z';
const B = '2026-11-12T10:28:30Z';
const LINEA = '- Cierre (finish): 1710 s, de 2026-11-12T10:00:00Z a 2026-11-12T10:28:30Z';

test('lineaCierre: formato exacto, redondeo y fin anterior al inicio a 0', () => {
  assert.equal(lineaCierre(A, B), LINEA);
  assert.equal(lineaCierre(B, A), '- Cierre (finish): 0 s, de 2026-11-12T10:28:30Z a 2026-11-12T10:00:00Z');
  assert.equal(lineaCierre(A, A), '- Cierre (finish): 0 s, de 2026-11-12T10:00:00Z a 2026-11-12T10:00:00Z');
});

test('anotarCierre: sin seccion la crea al final (LF)', () => {
  const r = anotarCierre('## Objetivo\nx\n', A, B);
  assert.equal(r, `## Objetivo\nx\n\n## Duracion\n\n${LINEA}\n`);
});

test('anotarCierre: sin seccion la crea al final (CRLF) sin mezclar fines de linea', () => {
  const r = anotarCierre('## Objetivo\r\nx\r\n', A, B);
  assert.equal(r, `## Objetivo\r\nx\r\n\r\n## Duracion\r\n\r\n${LINEA}\r\n`);
  assert.ok(!/(?<!\r)\n/.test(r));
});

test('anotarCierre: cuerpo vacio', () => {
  assert.equal(anotarCierre('', A, B), `## Duracion\n\n${LINEA}\n`);
});

test('anotarCierre: con seccion existente anade al final de ella y no toca lo de fuera', () => {
  const base = anotarDuracion('## Objetivo\nx\n\n## Transiciones\n\n| a |\n', { tipo: 'ok', minutos: 30 }, 45);
  const body = `${base}\n## Notas\n\ncosas\n`;
  const r = anotarCierre(body, A, B);
  const lineas = r.split('\n');
  const i = lineas.indexOf(LINEA);
  assert.ok(i > lineas.indexOf('## Duracion'));
  assert.ok(i < lineas.indexOf('## Notas'));
  assert.equal(lineas[i - 1], '- Real (de la rama abierta al cierre con merge, sin pausas): 45 min');
  assert.equal(r.replace(`${LINEA}\n`, ''), body);
});

test('anotarCierre: seccion existente en CRLF', () => {
  const body = '## Duracion\r\n\r\n- Estimada: 10 min\r\n\r\n## Notas\r\nz\r\n';
  const r = anotarCierre(body, A, B);
  assert.equal(r, `## Duracion\r\n\r\n- Estimada: 10 min\r\n${LINEA}\r\n\r\n## Notas\r\nz\r\n`);
});

test('anotarCierre: idempotente y reemplaza una linea previa', () => {
  const una = anotarCierre('## Objetivo\nx\n', A, B);
  assert.equal(anotarCierre(una, A, B), una);
  const otra = anotarCierre(una, A, '2026-11-12T10:00:10Z');
  assert.equal(leerCierre(otra)?.segundos, 10);
  assert.equal(otra.match(/Cierre \(finish\)/g)?.length, 1);
});

test('anotarCierre: solo dia o fecha invalida deja el cuerpo igual', () => {
  const body = '## Objetivo\nx\n';
  assert.equal(anotarCierre(body, '2026-11-12', B), body);
  assert.equal(anotarCierre(body, A, '2026-11-12'), body);
  assert.equal(anotarCierre(body, A, 'ayer'), body);
  assert.equal(anotarCierre(body, A, '2026-02-30T10:00:00Z'), body);
});

test('anotarCierre: una cabecera ## Duracion dentro de un bloque de codigo no cuenta', () => {
  const body = '## Objetivo\n```\n## Duracion\n```\n';
  const r = anotarCierre(body, A, B);
  assert.ok(r.startsWith(body));
  assert.ok(r.endsWith(`## Duracion\n\n${LINEA}\n`));
});

test('leerCierre: lee la linea, y null si no hay, no hay seccion o la fecha no vale', () => {
  assert.deepEqual(leerCierre(anotarCierre('## Objetivo\nx\n', A, B)), { inicio: A, fin: B, segundos: 1710 });
  assert.deepEqual(leerCierre(anotarCierre('## Duracion\r\n\r\n- Estimada: 1 min\r\n', A, B)), { inicio: A, fin: B, segundos: 1710 });
  assert.equal(leerCierre('## Objetivo\nx\n'), null);
  assert.equal(leerCierre('## Duracion\n\n- Estimada: 1 min\n'), null);
  assert.equal(leerCierre('## Duracion\n\n- Cierre (finish): 5 s, de 2026-11-12 a 2026-11-12T10:00:00Z\n'), null);
  assert.equal(leerCierre('## Duracion\n\n- Cierre (finish): 5 s, de ayer a hoy\n'), null);
  // Fuera de la seccion no cuenta.
  assert.equal(leerCierre(`## Notas\n\n${LINEA}\n`), null);
});

test('reintento de finish: anotarDuracion + anotarCierre otra vez deja una sola seccion y una sola linea de cierre', () => {
  // La misma secuencia que finish, aplicada dos veces sobre el cuerpo (como en un reintento).
  const cerrar = (body: string, inicio: string, fin: string): string =>
    anotarCierre(anotarDuracion(body, { tipo: 'ok', minutos: 30 }, 45), inicio, fin);
  const primero = cerrar('## Objetivo\nx\n\n## Notas\n\ncosas\n', A, B);
  const segundo = cerrar(primero, '2026-11-12T11:00:00Z', '2026-11-12T11:00:20Z');
  assert.equal(segundo.match(/^## Duracion$/gm)?.length, 1);
  assert.equal(segundo.match(/^- Cierre \(finish\)/gm)?.length, 1);
  assert.equal(segundo.match(/^- Estimada: 30 min$/gm)?.length, 1);
  assert.deepEqual(leerCierre(segundo), { inicio: '2026-11-12T11:00:00Z', fin: '2026-11-12T11:00:20Z', segundos: 20 });
  assert.ok(segundo.includes('## Notas\n\ncosas\n'));
});
