/** TASK-127: la decision de una ronda extra en tarea.md (logica pura). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rondaExtraDecidida } from '../../src/core/rondas-extra.js';
import { lineaRondaExtra } from '../../src/core/flujo.js';

const CUERPO = [
  '## Objetivo',
  'x',
  '',
  '## Rondas extra',
  '- Ronda 3: Carlos, el IMP-2 necesita otra mirada',
  '',
  '## Resultado',
  '- Ronda 4: fuera de la seccion',
  '',
].join('\n');

test('rondaExtraDecidida: la linea de esa ronda, con texto, dentro de la seccion', () => {
  assert.equal(rondaExtraDecidida(CUERPO, 3), true);
  assert.equal(rondaExtraDecidida(CUERPO.split('\n').join('\r\n'), 3), true, 'CRLF');
});

test('rondaExtraDecidida: cada ronda necesita su linea; fuera de la seccion no cuenta', () => {
  assert.equal(rondaExtraDecidida(CUERPO, 4), false, 'la de la ronda 4 esta en otra seccion');
  assert.equal(rondaExtraDecidida(CUERPO, 2), false);
  assert.equal(rondaExtraDecidida('## Objetivo\n- Ronda 3: si\n', 3), false, 'sin seccion');
});

test('rondaExtraDecidida: sin texto o con el ejemplo copiado tal cual no es una decision', () => {
  assert.equal(rondaExtraDecidida('## Rondas extra\n- Ronda 3:\n', 3), false);
  assert.equal(rondaExtraDecidida('## Rondas extra\n- Ronda 3:    \n', 3), false);
  assert.equal(rondaExtraDecidida(`## Rondas extra\n${lineaRondaExtra(3)}\n`, 3), false);
});

test('rondaExtraDecidida: la seccion acaba en el siguiente encabezado de nivel 2; un ### dentro no la corta', () => {
  assert.equal(rondaExtraDecidida('## Rondas extra\n### detalle\n- Ronda 3: si\n', 3), true);
  assert.equal(rondaExtraDecidida('## Rondas extra\n## Otra\n- Ronda 3: si\n', 3), false);
});
