/**
 * TASK-023: suma del usage de una transcripcion de subagente. Lo gastado es
 * la suma de las llamadas (por message.id, con la ultima aparicion), no la
 * cifra de contexto final que muestra Claude Code al terminar el agente.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMANDOS_BASH_LECTURA,
  HERRAMIENTAS_LECTURA,
  esAgentIdValido,
  esComandoBashDeLectura,
  sumarUsoTranscripcion,
} from '../../src/core/coste-transcripcion.js';
import { TRANSCRIPCION_EJEMPLO, herramienta, mensaje, uso } from '../helpers/transcripcion-ejemplo.js';

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
  assert.deepEqual(sumarUsoTranscripcion(t), {
    tokens: 1115,
    llamadas: 1,
    entrada: 10,
    cacheEscritura: 100,
    cacheLectura: 1000,
    salida: 5,
    lecturas: 0,
  });
});

test('un message.id repetido (streaming) cuenta UNA vez, con su ultima aparicion', () => {
  const t = [
    asistente('m1', { input_tokens: 1, output_tokens: 1 }),
    asistente('m1', { input_tokens: 1, output_tokens: 50 }),
    asistente('m2', { input_tokens: 7, output_tokens: 3 }),
    asistente('m1', { input_tokens: 1, output_tokens: 99 }),
  ].join('\n');
  assert.deepEqual(sumarUsoTranscripcion(t), {
    tokens: 100 + 10,
    llamadas: 2,
    entrada: 1 + 7,
    cacheEscritura: 0,
    cacheLectura: 0,
    salida: 99 + 3,
    lecturas: 0,
  });
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
  assert.deepEqual(sumarUsoTranscripcion(t), {
    tokens: 4,
    llamadas: 1,
    entrada: 0,
    cacheEscritura: 0,
    cacheLectura: 0,
    salida: 4,
    lecturas: 0,
  });
});

test('una llamada con usage pero sin message.id se cuenta tal cual', () => {
  const t = [asistente(null, { output_tokens: 2 }), asistente(null, { output_tokens: 3 })].join('\n');
  assert.deepEqual(sumarUsoTranscripcion(t), {
    tokens: 5,
    llamadas: 2,
    entrada: 0,
    cacheEscritura: 0,
    cacheLectura: 0,
    salida: 5,
    lecturas: 0,
  });
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

// ---------------------------------------------------------------------
// TASK-063: desglose y lecturas
// ---------------------------------------------------------------------

test('TASK-063: el .jsonl de ejemplo da el desglose y EXACTAMENTE 9 lecturas', () => {
  const r = sumarUsoTranscripcion(TRANSCRIPCION_EJEMPLO);
  // Lecturas: t1 (una vez), t2, t3, t4, t5, t9, t11, t13 y la sin id.
  // Llamadas: m1 (ultima: 5/3), m2 (7/4), m3 (9/5), m4 (11/6) y la sin id (1/1).
  assert.deepEqual(r, {
    tokens: 33 + 50 + 500 + 19,
    llamadas: 5,
    entrada: 5 + 7 + 9 + 11 + 1,
    cacheEscritura: 50,
    cacheLectura: 500,
    salida: 3 + 4 + 5 + 6 + 1,
    lecturas: 9,
  });
  assert.ok(r);
  assert.equal(r.tokens, r.entrada + r.cacheEscritura + r.cacheLectura + r.salida, 'tokens se conserva como suma');
});

test('TASK-063: tool_use fuera de mensajes de asistente, o sin usage en toda la transcripcion', () => {
  // Un tool_use en una linea de usuario no es del agente.
  const deUsuario = JSON.stringify({ type: 'user', message: { content: [herramienta('u1', 'Read')] } });
  const r = sumarUsoTranscripcion([deUsuario, mensaje('m1', [], uso(1, 1))].join('\n'));
  assert.equal(r?.lecturas, 0);
  // Lecturas sin ninguna llamada con usage: sigue siendo formato desconocido.
  assert.equal(sumarUsoTranscripcion(mensaje('m1', [herramienta('t1', 'Read')], null)), null);
  // Una linea sin usage aporta su tool_use si otra si lo tiene.
  const mixto = [mensaje('m1', [herramienta('t1', 'Read')], null), mensaje('m1', [], uso(1, 1))].join('\n');
  assert.equal(sumarUsoTranscripcion(mixto)?.lecturas, 1);
});

test('TASK-063: esComandoBashDeLectura y la lista cerrada de herramientas', () => {
  for (const si of ['cat x', ' head -5 x', '\ttail -f log', 'grep -rn a .', 'rg a', 'find . -name x', 'ls -la', 'ls', 'sed -n 1p x', 'sed  -n 1p x']) {
    assert.ok(esComandoBashDeLectura(si), si);
  }
  for (const no of ['', 'catx', 'category', 'echo cat', 'sed -i 1d x', 'sed', 'lsof', 'finder', 'git ls-files', 'npm run lint']) {
    assert.ok(!esComandoBashDeLectura(no), no);
  }
  for (const h of ['Read', 'Grep', 'Glob']) assert.ok(HERRAMIENTAS_LECTURA.includes(h), h);
  for (const h of ['Bash', 'Edit', 'Write', 'Agent', 'WebFetch']) assert.ok(!HERRAMIENTAS_LECTURA.includes(h), h);
  assert.deepEqual([...COMANDOS_BASH_LECTURA], ['cat', 'head', 'tail', 'grep', 'rg', 'find', 'ls']);
});
