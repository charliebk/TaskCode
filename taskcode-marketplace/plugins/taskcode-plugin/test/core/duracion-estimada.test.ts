/** TASK-097: lectura de la duracion estimada del plan y anotacion de finish (puro). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LINEA_PLANTILLA_DURACION,
  UMBRAL_MINUTOS,
  anotarDuracion,
  estimadaAnotada,
  leerDuracionEstimada,
  superaUmbral,
} from '../../src/core/duracion-estimada.js';

test('leerDuracionEstimada: cifras validas, ausencia, plantilla y formatos que no se adivinan', () => {
  assert.deepEqual(leerDuracionEstimada('# Plan\n\nDuracion estimada: 45 min (senales)\n'), { tipo: 'ok', minutos: 45 });
  assert.deepEqual(leerDuracionEstimada('**Duración estimada:** 90 minutos\n'), { tipo: 'ok', minutos: 90 });
  assert.deepEqual(leerDuracionEstimada('duracion estimada: 30\r\n'), { tipo: 'ok', minutos: 30 });
  assert.deepEqual(leerDuracionEstimada('# Plan\n\nSin estimacion.\n'), { tipo: 'ausente' });
  assert.deepEqual(leerDuracionEstimada(LINEA_PLANTILLA_DURACION), { tipo: 'ausente' }, 'la plantilla sin cifra');
  for (const raro of ['1h30', '~90 min', '90-120 min', '1,5 h', '1.5 h']) {
    assert.equal(leerDuracionEstimada(`Duracion estimada: ${raro}\n`).tipo, 'ilegible', raro);
  }
  // Un ejemplo dentro de un bloque de codigo no es la estimacion.
  assert.deepEqual(
    leerDuracionEstimada('```\nDuracion estimada: 500 min\n```\n\nDuracion estimada: 20 min\n'),
    { tipo: 'ok', minutos: 20 }
  );
});

test('superaUmbral: mas de una hora o ilegible; la ausencia no', () => {
  assert.equal(UMBRAL_MINUTOS, 60);
  assert.equal(superaUmbral({ tipo: 'ok', minutos: 60 }), false);
  assert.equal(superaUmbral({ tipo: 'ok', minutos: 61 }), true);
  assert.equal(superaUmbral({ tipo: 'ilegible', valor: '1h' }), true);
  assert.equal(superaUmbral({ tipo: 'ausente' }), false);
});

test('anotarDuracion: escribe la seccion, la reemplaza en un reintento y nunca pone 0 por un dato que falta', () => {
  const body = '## Objetivo\n\nX.\n\n## Transiciones\n\n| a |\n';
  const una = anotarDuracion(body, { tipo: 'ok', minutos: 30 }, 42);
  assert.match(una, /## Duracion\n\n- Estimada: 30 min\n- Real \(de la rama abierta al cierre con merge, sin pausas\): 42 min\n/);
  assert.equal(estimadaAnotada(una), 30);
  const dos = anotarDuracion(una, { tipo: 'ok', minutos: 30 }, 75);
  assert.equal((dos.match(/^## Duracion$/gm) ?? []).length, 1, 'reemplaza, no duplica');
  assert.match(dos, /Real .*: 75 min/);
  assert.match(dos, /- Paso de la hora: 75 min reales frente a 30 estimados/);
  const sinDatos = anotarDuracion(body, { tipo: 'ausente' }, null);
  assert.match(sinDatos, /- Estimada: — \(el plan no la dice\)/);
  assert.match(sinDatos, /- Real .*: — \(sin hora en start o finish\)/);
  assert.equal(estimadaAnotada(sinDatos), null);
  // Con la seccion en medio, lo que va detras se conserva.
  const enMedio = anotarDuracion('## Duracion\n\n- Estimada: 1 min\n\n## Otra\n\nZ\n', { tipo: 'ok', minutos: 5 }, 6);
  assert.match(enMedio, /- Estimada: 5 min[\s\S]*\n## Otra\n\nZ\n$/);
  // CRLF se respeta.
  assert.match(anotarDuracion('## Objetivo\r\n\r\nX.\r\n', { tipo: 'ok', minutos: 5 }, 6), /\r\n- Estimada: 5 min\r\n/);
});
