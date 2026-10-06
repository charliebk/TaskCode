/**
 * TASK-023: suma del usage de una transcripcion de subagente. Lo gastado es
 * la suma de las llamadas (por message.id, con la ultima aparicion), no la
 * cifra de contexto final que muestra Claude Code al terminar el agente.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esAgentIdValido, sumarUsoTranscripcion } from '../../src/core/coste-transcripcion.js';

function asistente(id: string | null, usage: Record<string, unknown>): string {
  return JSON.stringify({ type: 'assistant', message: { ...(id === null ? {} : { id }), usage } });
}

test('suma input + cache_creation + cache_read + output por llamada', () => {
  const t = asistente('m1', {
    input_tokens: 10,
    cache_creation_input_tokens: 100,
    cache_read_input_tokens: 1000,
    output_tokens: 5,
  });
  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 1115, llamadas: 1 });
});

test('un message.id repetido (streaming) cuenta UNA vez, con su ultima aparicion', () => {
  const t = [
    asistente('m1', { input_tokens: 1, output_tokens: 1 }),
    asistente('m1', { input_tokens: 1, output_tokens: 50 }),
    asistente('m2', { input_tokens: 7, output_tokens: 3 }),
    asistente('m1', { input_tokens: 1, output_tokens: 99 }),
  ].join('\n');
  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 100 + 10, llamadas: 2 });
});

test('ignora lineas no JSON, de otros tipos o sin usage; campos ausentes o raros cuentan 0', () => {
  const t = [
    'esto no es json',
    '',
    '{"type":"user","message":{"usage":{"input_tokens":999}}}',
    '{"type":"assistant","message":{"id":"x"}}',
    '[1,2,3]',
    asistente('m1', { output_tokens: 4, input_tokens: 'mucho', cache_read_input_tokens: -5 }),
  ].join('\r\n');
  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 4, llamadas: 1 });
});

test('una llamada con usage pero sin message.id se cuenta tal cual', () => {
  const t = [asistente(null, { output_tokens: 2 }), asistente(null, { output_tokens: 3 })].join('\n');
  assert.deepEqual(sumarUsoTranscripcion(t), { tokens: 5, llamadas: 2 });
});

test('sin ninguna llamada con usage es null (formato desconocido), no 0', () => {
  assert.equal(sumarUsoTranscripcion(''), null);
  assert.equal(sumarUsoTranscripcion('{"type":"user"}\nbasura'), null);
});

test('esAgentIdValido: hexadecimal, sin separadores ni ..', () => {
  assert.ok(esAgentIdValido('a1b2c3d4e5f60718'));
  for (const malo of ['', 'abc', '../x', 'a1b2c3/../d4', 'a1b2c3\\d4', 'zzzzzzzz', 'a1b2c3d4 ', 'a'.repeat(65)]) {
    assert.ok(!esAgentIdValido(malo), malo);
  }
});
