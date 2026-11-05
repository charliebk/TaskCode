/**
 * TASK-075: la condicion «valida limpio» del validador de plugins. Funcion pura
 * sobre la salida de texto, asi que corre tambien en el CI de Linux (donde no
 * hay `claude`). Los textos son fragmentos de salidas reales de Claude Code
 * 2.1.318, sin las rutas de la maquina.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validacionLimpia } from '../helpers/validador-claude.js';

const DIRECTORIO = `Plugin directory checks for /tmp/copia. The plugin directory is the catalog that plugins are submitted to; this is a subset of what it runs.

✘ Found 1 problem the plugin directory refuses a submission for:

  ❯ README.md: README missing (README_MISSING). This plugin has no README.md.

⚠ Found 1 plugin directory warning:

  ❯ .claude-plugin/plugin.json icon: No icon (ICON_MISSING).

These plugin directory checks do not change the result below. To fail on problems the directory refuses a submission for, run this command with --profile directory.

The directory also runs a safety scan and a policy review that this command does not.
`;

const COPIA_INTACTA = `Validating plugin manifest: /tmp/copia/.claude-plugin/plugin.json

${DIRECTORIO}
✔ Validation passed
`;

const YAML_ROTO = `Validating plugin manifest: /tmp/copia/.claude-plugin/plugin.json

Validating agent: /tmp/copia/agents/brainstorm-arquitectura.md

✘ Found 1 error:

  ❯ frontmatter: YAML frontmatter failed to parse: YAML Parse error: Unexpected character.

${DIRECTORIO}
✘ Validation failed
`;

test('validador (TASK-075): la cruz del bloque del directorio no cuenta como error', () => {
  assert.deepEqual(validacionLimpia({ status: 0, salida: COPIA_INTACTA }), { ok: true, motivo: '' });
});

test('validador (TASK-075): la mutacion de los tests (YAML roto) no valida limpio', () => {
  const r = validacionLimpia({ status: 1, salida: YAML_ROTO });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /exit 1/);
});

test('validador (TASK-075): sin bloque del directorio (antes de 2.1.316) y sin cruz, valida limpio', () => {
  const salida = 'Validating plugin manifest: /tmp/x/.claude-plugin/plugin.json\n\n✔ Validation passed\n';
  assert.equal(validacionLimpia({ status: 0, salida }).ok, true);
});

test('validador (TASK-075): un texto sin linea de resultado da rojo, no falso verde', () => {
  const r = validacionLimpia({ status: 0, salida: 'algo inesperado\n' });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /Validation passed/);
  assert.equal(validacionLimpia({ status: 0, salida: '' }).ok, false);
});

test('validador (TASK-075): exit 0 con una cruz ANTES del bloque del directorio no valida limpio', () => {
  const salida = YAML_ROTO.replace('✘ Validation failed', '✔ Validation passed');
  const r = validacionLimpia({ status: 0, salida });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /antes de las comprobaciones del directorio/);
});

test('validador (TASK-075): «Validation passed with warnings» tambien cuenta como paso', () => {
  const salida = COPIA_INTACTA.replace('Validation passed', 'Validation passed with warnings');
  assert.equal(validacionLimpia({ status: 0, salida }).ok, true);
});
