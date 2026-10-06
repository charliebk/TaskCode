import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTask, requireNullableNumber, TaskValidationError } from '../../src/core/task.js';

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

test('validateTask: acepta una tarea bien formada', () => {
  const task = validateTask(baseTaskData());
  assert.equal(task.id, 'TASK-001');
  assert.equal(task.tipo, 'feature');
});

test('validateTask: rechaza id con formato invalido', () => {
  assert.throws(
    () => validateTask(baseTaskData({ id: 'TAREA-1' })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'id'
  );
});

test('validateTask: rechaza tipo fuera de enum', () => {
  assert.throws(
    () => validateTask(baseTaskData({ tipo: 'chore' })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'tipo'
  );
});

test('validateTask: rechaza complejidad fuera de enum', () => {
  assert.throws(
    () => validateTask(baseTaskData({ complejidad: 'imposible' })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'complejidad'
  );
});

test('validateTask: rechaza estado fuera de enum', () => {
  assert.throws(
    () => validateTask(baseTaskData({ estado: 'bloqueada' })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'estado'
  );
});

test('validateTask: rechaza titulo vacio', () => {
  assert.throws(
    () => validateTask(baseTaskData({ titulo: '' })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'titulo'
  );
});

test('validateTask: rechaza sprint no entero', () => {
  assert.throws(
    () => validateTask(baseTaskData({ sprint: 1.5 })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'sprint'
  );
});

test('validateTask: rechaza sprint negativo', () => {
  assert.throws(
    () => validateTask(baseTaskData({ sprint: -1 })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'sprint'
  );
});

test('validateTask: rechaza plan_aprobado no booleano', () => {
  assert.throws(
    () => validateTask(baseTaskData({ plan_aprobado: 'si' })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'plan_aprobado'
  );
});

test('validateTask: rechaza etiquetas que no son lista de strings', () => {
  assert.throws(
    () => validateTask(baseTaskData({ etiquetas: 'ifc,importador' })),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'etiquetas'
  );
});

test('validateTask: acepta asignado_a null y tambien una cadena', () => {
  assert.doesNotThrow(() => validateTask(baseTaskData({ asignado_a: null })));
  assert.doesNotThrow(() => validateTask(baseTaskData({ asignado_a: 'carlos' })));
});

test('validateTask: rechaza campo obligatorio ausente', () => {
  const data = baseTaskData();
  delete data.rama;
  assert.throws(
    () => validateTask(data),
    (e: unknown) => e instanceof TaskValidationError && e.field === 'rama'
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

const CAMPOS_TOKENS = ['tokens_diseno', 'tokens_implementacion', 'tokens_revision'] as const;

test('requireNullableNumber: null y ausente dan null; un entero >= 0 pasa (0 incluido)', () => {
  assert.equal(requireNullableNumber({ x: null }, 'x'), null);
  assert.equal(requireNullableNumber({}, 'x'), null);
  assert.equal(requireNullableNumber({ x: 0 }, 'x'), 0);
  assert.equal(requireNullableNumber({ x: 48213 }, 'x'), 48213);
});

test('requireNullableNumber: rechaza cadena, flotante, negativo, NaN, infinito y booleano', () => {
  for (const malo of ['12', '12k', '', 1.5, -1, -0.5, NaN, Infinity, true, [], {}]) {
    assert.throws(
      () => requireNullableNumber({ x: malo }, 'x'),
      (e: unknown) => e instanceof TaskValidationError && e.field === 'x',
      `deberia rechazar ${JSON.stringify(malo)}`
    );
  }
});

test('validateTask (TASK-023): una tarea SIN los campos de tokens valida y los deja en null', () => {
  const t = validateTask(baseTaskData());
  for (const c of CAMPOS_TOKENS) assert.equal(t[c], null, c);
});

test('validateTask (TASK-023): acepta enteros y null en cada campo, y rechaza lo demas con el campo en el error', () => {
  const t = validateTask(baseTaskData({ tokens_diseno: 120000, tokens_implementacion: null, tokens_revision: 0 }));
  assert.deepEqual([t.tokens_diseno, t.tokens_implementacion, t.tokens_revision], [120000, null, 0]);
  for (const c of CAMPOS_TOKENS) {
    for (const malo of ['12k', 1.5, -3]) {
      assert.throws(
        () => validateTask(baseTaskData({ [c]: malo })),
        (e: unknown) => e instanceof TaskValidationError && e.field === c,
        `${c}=${JSON.stringify(malo)}`
      );
    }
  }
});
