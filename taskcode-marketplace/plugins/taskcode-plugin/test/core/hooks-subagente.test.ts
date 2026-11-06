/**
 * Nucleo puro de `hooks-subagente` (TASK-076): semantica del matcher, forma
 * del JSON y enabledPlugins.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hooksQueAlcanzanSubagente, matcherAlcanzaSubagente, pluginHabilitado } from '../../src/core/hooks-subagente.js';

test('matcher: nombres exactos y listas con |', () => {
  for (const m of ['Agent', 'Task', 'Bash|Agent', 'Read|Task|Write', ' Agent ']) {
    assert.equal(matcherAlcanzaSubagente(m), true, m);
  }
  for (const m of ['Read', 'Bash', 'mcp__', 'AgentX', 'Agents', 'agent', 'Bash|WebFetch|mcp__']) {
    assert.equal(matcherAlcanzaSubagente(m), false, m);
  }
});

test('matcher: espacios alrededor de | no esconden el nombre (revision ronda 1, MEN-1)', () => {
  assert.equal(matcherAlcanzaSubagente('Bash | Agent'), true);
  assert.equal(matcherAlcanzaSubagente(' Read |Task '), true);
  assert.equal(matcherAlcanzaSubagente('Bash | Read'), false);
  assert.equal(matcherAlcanzaSubagente('   '), true); // equivale a vacio
  assert.equal(matcherAlcanzaSubagente('(Agent | Task)'), true);
  assert.equal(matcherAlcanzaSubagente('Ag'), false); // regex anclada, decision del plan (aceptado en ronda 1)
});

test('matcher: vacio, * o ausente alcanzan a todo; un no-string no', () => {
  assert.equal(matcherAlcanzaSubagente(''), true);
  assert.equal(matcherAlcanzaSubagente('*'), true);
  assert.equal(matcherAlcanzaSubagente(undefined), true);
  assert.equal(matcherAlcanzaSubagente(null), true);
  assert.equal(matcherAlcanzaSubagente(42), false);
});

test('matcher: regex anclada; si no compila, lista literal', () => {
  assert.equal(matcherAlcanzaSubagente('.*'), true);
  assert.equal(matcherAlcanzaSubagente('A.*'), true);
  assert.equal(matcherAlcanzaSubagente('(Agent|Task)'), true);
  assert.equal(matcherAlcanzaSubagente('Ag.n'), false); // anclada: no casa con "Agent"
  assert.equal(matcherAlcanzaSubagente('mcp__.*'), false);
  assert.equal(matcherAlcanzaSubagente('Agent|(roto'), true); // regex invalida -> lista
  assert.equal(matcherAlcanzaSubagente('Read|(roto'), false);
});

test('hooksQueAlcanzanSubagente: solo PreToolUse, con origen, ruta y matcher literal', () => {
  const json = {
    hooks: {
      PreToolUse: [{ matcher: 'Bash' }, { matcher: 'Bash|Agent', hooks: [] }, { hooks: [] }],
      PostToolUse: [{ matcher: 'Agent' }],
    },
  };
  assert.deepEqual(hooksQueAlcanzanSubagente(json, 'plugin x@y', '/r/hooks.json'), [
    { origen: 'plugin x@y', ruta: '/r/hooks.json', matcher: 'Bash|Agent' },
    { origen: 'plugin x@y', ruta: '/r/hooks.json', matcher: '(sin matcher)' },
  ]);
});

test('hooksQueAlcanzanSubagente: formas inesperadas no lanzan ni dan hallazgos', () => {
  for (const j of [undefined, null, 3, 'x', [], {}, { hooks: [] }, { hooks: { PreToolUse: {} } }, { hooks: { PreToolUse: [null, 3] } }]) {
    assert.deepEqual(hooksQueAlcanzanSubagente(j, 'o', 'r'), [], JSON.stringify(j));
  }
});

test('pluginHabilitado: manda el settings mas especifico; sin entrada, habilitado', () => {
  const local = { enabledPlugins: { 'a@m': true } };
  const usuario = { enabledPlugins: { 'a@m': false, 'b@m': false } };
  assert.equal(pluginHabilitado('a@m', [local, undefined, usuario]), true);
  assert.equal(pluginHabilitado('b@m', [local, undefined, usuario]), false);
  assert.equal(pluginHabilitado('c@m', [local, undefined, usuario]), true);
  assert.equal(pluginHabilitado('c@m', []), true);
});
