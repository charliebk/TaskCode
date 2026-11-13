import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTask, requireNullableNumber, TaskValidationError } from '../../src/core/task.js';

const CAMPOS_TOKENS = ['tokens_diseno', 'tokens_implementacion', 'tokens_revision'] as const;

function baseTaskData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'TASK-001',
    titulo: 'Tarea de prueba',
    tipo: 'feature',
    sprint: 0,
    etiquetas: ['a', 'b'],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-001-prueba',
    asignado_a: null,
    agente_revisor: 'typescript-reviewer',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-03',
    actualizado: '2026-09-03',
    dependencias: [],
    ...overrides,
  };
}

test('validateTask: acepta una tarea bien formada (asignado_a null o cadena; tokens ausentes en null, enteros y null aceptados)', () => {
  const task = validateTask(baseTaskData());
  assert.equal(task.id, 'TASK-001');
  assert.equal(task.tipo, 'feature');
  assert.doesNotThrow(() => validateTask(baseTaskData({ asignado_a: null })));
  assert.doesNotThrow(() => validateTask(baseTaskData({ asignado_a: 'carlos' })));
  // TASK-023: una tarea SIN los campos de tokens valida y los deja en null
  for (const c of CAMPOS_TOKENS) assert.equal(task[c], null, c);
  const t = validateTask(baseTaskData({ tokens_diseno: 120000, tokens_implementacion: null, tokens_revision: 0 }));
  assert.deepEqual([t.tokens_diseno, t.tokens_implementacion, t.tokens_revision], [120000, null, 0]);
});

test('validateTask: rechaza cada valor invalido con el campo en el error', () => {
  const casos: Array<[string, Record<string, unknown>]> = [
    ['id', { id: 'TAREA-1' }],
    ['tipo', { tipo: 'chore' }],
    ['complejidad', { complejidad: 'imposible' }],
    ['estado', { estado: 'bloqueada' }],
    ['titulo', { titulo: '' }],
    ['sprint', { sprint: 1.5 }], // no entero
    ['sprint', { sprint: -1 }], // negativo
    ['plan_aprobado', { plan_aprobado: 'si' }],
    ['etiquetas', { etiquetas: 'ifc,importador' }],
  ];
  // TASK-023: cada campo de tokens rechaza lo que no sea entero >= 0 o null
  for (const c of CAMPOS_TOKENS) {
    for (const malo of ['12k', 1.5, -3]) casos.push([c, { [c]: malo }]);
  }
  for (const [campo, overrides] of casos) {
    assert.throws(
      () => validateTask(baseTaskData(overrides)),
      (e: unknown) => e instanceof TaskValidationError && e.field === campo,
      `${campo}=${JSON.stringify(overrides)}`
    );
  }
  // campo obligatorio ausente
  const data = baseTaskData();
  delete data.rama;
  assert.throws(
    () => validateTask(data),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'rama',
    'rama ausente'
  );
});

test('validateTask (TASK-042): complejidad null o ausente es "no declarada"; un valor invalido sigue fallando', () => {
  assert.equal(validateTask(baseTaskData({ complejidad: null })).complejidad, null);
  const sinClave = baseTaskData();
  delete (sinClave as Record<string, unknown>)['complejidad'];
  assert.equal(validateTask(sinClave).complejidad, null);
  assert.throws(
    () => validateTask(baseTaskData({ complejidad: 'enorme' })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'complejidad'
  );
});

// --- TASK-023: tokens_diseno / tokens_implementacion / tokens_revision -----

test('requireNullableNumber: null y ausente dan null, un entero >= 0 pasa (0 incluido); rechaza cadena, flotante, negativo, NaN, infinito y booleano', () => {
  assert.equal(requireNullableNumber({ x: null }, 'x'), null);
  assert.equal(requireNullableNumber({}, 'x'), null);
  assert.equal(requireNullableNumber({ x: 0 }, 'x'), 0);
  assert.equal(requireNullableNumber({ x: 48213 }, 'x'), 48213);
  for (const malo of ['12', '12k', '', 1.5, -1, -0.5, NaN, Infinity, true, [], {}]) {
    assert.throws(
      () => requireNullableNumber({ x: malo }, 'x'),
      (e: unknown) => e instanceof TaskValidationError && e.field === 'x',
      `deberia rechazar ${JSON.stringify(malo)}`
    );
  }
});
