/**
 * TASK-082: que cuenta como constancia de la autorrevision en tarea.md.
 * Funcion pura: cadenas de entrada, sin disco ni Git.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avisoAutorrevision, tieneAutorrevision, tieneLinea4D, SECCION_AUTORREVISION } from '../../src/core/autorrevision.js';

const BASE = '## Objetivo\n\nAlgo.\n\n## Criterios de aceptacion\n- [ ] uno\n';

test('sin la seccion no hay constancia, y el aviso nombra la tarea y dice que hacer', () => {
  assert.equal(tieneAutorrevision(BASE), false);
  const aviso = avisoAutorrevision(BASE, 'TASK-900');
  assert.ok(aviso !== null);
  assert.match(aviso, /^TASK-900: /);
  assert.ok(aviso.includes(SECCION_AUTORREVISION));
  assert.match(aviso, /## Que se revisa/);
  assert.match(aviso, /revisores/);
});

test('con la linea de la revisora y la de la Regla 4D hay constancia y no hay aviso', () => {
  const body =
    `${BASE}\n${SECCION_AUTORREVISION}\n\n- 4D — abc1234: helper buscado, criterios citados, 2 tests mutados\n` +
    '- code-quality-reviewer — abc1234\n';
  assert.equal(tieneAutorrevision(body), true);
  assert.equal(tieneLinea4D(body), true);
  assert.equal(avisoAutorrevision(body, 'TASK-900'), null);
});

test('TASK-153: constancia sin la linea 4D avisa de la Regla 4D (antes cualquier linea valia)', () => {
  const body = `${BASE}\n${SECCION_AUTORREVISION}\n\n- code-quality-reviewer — abc1234\n`;
  assert.equal(tieneAutorrevision(body), true);
  assert.equal(tieneLinea4D(body), false);
  const aviso = avisoAutorrevision(body, 'TASK-900');
  assert.ok(aviso !== null);
  assert.match(aviso, /^TASK-900: /);
  assert.match(aviso, /Regla 4D/);
  assert.match(aviso, /- 4D — <commit>/);
  // Una linea que solo menciona 4D en medio del texto no cuenta; fuera de la seccion tampoco.
  assert.equal(tieneLinea4D(`${body}- nota: la 4D se hizo\n`), false);
  assert.equal(tieneLinea4D(`- 4D — abc: x\n\n${SECCION_AUTORREVISION}\n\n- code-quality-reviewer — abc\n`), false);
  // Variantes de separador validas.
  assert.equal(tieneLinea4D(`${SECCION_AUTORREVISION}\n\n- 4D - abc: x\n`), true);
  assert.equal(tieneLinea4D(`${SECCION_AUTORREVISION}\n\n- 4D: abc\n`), true);
});

test('CRLF tambien cuenta', () => {
  const body = `${BASE}\n${SECCION_AUTORREVISION}\n\n- code-quality-reviewer — abc1234\n`.replace(/\n/g, '\r\n');
  assert.equal(tieneAutorrevision(body), true);
});

test('el encabezado solo, en blanco o con un comentario, no es constancia', () => {
  assert.equal(tieneAutorrevision(`${BASE}\n${SECCION_AUTORREVISION}\n\n`), false);
  assert.equal(tieneAutorrevision(`${BASE}\n${SECCION_AUTORREVISION}\n\n<!-- una linea por revisora -->\n`), false);
  assert.equal(
    tieneAutorrevision(`${BASE}\n${SECCION_AUTORREVISION}\n\n<!--\nvarias\nlineas\n-->\n`),
    false
  );
});

test('una seccion vacia seguida de otra seccion con contenido no es constancia', () => {
  const body = `${BASE}\n${SECCION_AUTORREVISION}\n\n## Resultado\n\nHecho.\n`;
  assert.equal(tieneAutorrevision(body), false);
});

test('el encabezado dentro de un bloque de codigo no cuenta', () => {
  const body = `${BASE}\n\`\`\`\n${SECCION_AUTORREVISION}\n- x — y\n\`\`\`\n`;
  assert.equal(tieneAutorrevision(body), false);
});

test('el titulo es exacto: con tilde o con otro nivel no cuenta', () => {
  assert.equal(tieneAutorrevision(`${BASE}\n## Autorrevisión\n\n- x — y\n`), false);
  assert.equal(tieneAutorrevision(`${BASE}\n### Autorrevision\n\n- x — y\n`), false);
});

test('nunca lanza, ni con entradas raras', () => {
  for (const body of ['', '\n', '##', `${SECCION_AUTORREVISION}`, '```\n', '<!--', '\r\n\r\n']) {
    assert.doesNotThrow(() => avisoAutorrevision(body, 'TASK-900'));
  }
  assert.equal(tieneAutorrevision(`${SECCION_AUTORREVISION}\n- a — b`), true);
});
