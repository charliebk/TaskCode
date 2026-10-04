import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTask, TaskValidationError } from '../../src/core/task.js';

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
