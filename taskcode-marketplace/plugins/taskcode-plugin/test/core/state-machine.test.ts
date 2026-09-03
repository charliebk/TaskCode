import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTransitionAllowed,
  resultingState,
  StateMachineError,
} from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-014',
    titulo: 'Tarea de prueba',
    tipo: 'feature',
    sprint: 3,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-014-prueba',
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

function throwsStateMachineError(fn: () => void): StateMachineError {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof StateMachineError, `esperaba StateMachineError, llego: ${e}`);
    return e;
  }
  assert.fail('se esperaba que la transicion lanzara StateMachineError');
}

// --- import / new -----------------------------------------------------

test('import/new: permitido si la tarea no existe todavia', () => {
  assert.doesNotThrow(() => assertTransitionAllowed('import', null));
  assert.doesNotThrow(() => assertTransitionAllowed('new', null));
});

test('import/new: rechazado si el ID ya existe', () => {
  const t = makeTask();
  const e = throwsStateMachineError(() => assertTransitionAllowed('new', t));
  assert.equal(e.comandoRequerido, null);
});

// --- plan ---------------------------------------------------------------

test('plan: permitido la primera vez desde "planificada"', () => {
  assert.doesNotThrow(() => assertTransitionAllowed('plan', makeTask({ estado: 'planificada' })));
});

test('plan: permitido para re-planificar "en-diseno" con plan_aprobado false', () => {
  assert.doesNotThrow(() =>
    assertTransitionAllowed('plan', makeTask({ estado: 'en-diseno', plan_aprobado: false }))
  );
});

test('plan: rechazado si el plan ya fue aprobado (sugiere taskctl start)', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed('plan', makeTask({ estado: 'en-diseno', plan_aprobado: true }))
  );
  assert.equal(e.comandoRequerido, 'taskctl start');
});

test('plan: rechazado desde "en-curso"', () => {
  throwsStateMachineError(() => assertTransitionAllowed('plan', makeTask({ estado: 'en-curso' })));
});

test('plan: rechazado si la tarea no existe (usa import/new)', () => {
  const e = throwsStateMachineError(() => assertTransitionAllowed('plan', null));
  assert.match(e.message, /taskctl import o taskctl new/);
});

// --- approve --------------------------------------------------------------

test('approve: permitido desde "en-diseno" con plan-final.md existente', () => {
  assert.doesNotThrow(() =>
    assertTransitionAllowed('approve', makeTask({ estado: 'en-diseno' }), {
      planFinalExiste: true,
    })
  );
});

test('approve: rechazado si no hay plan-final.md todavia', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed('approve', makeTask({ estado: 'en-diseno' }), {
      planFinalExiste: false,
    })
  );
  assert.equal(e.comandoRequerido, 'taskctl plan');
});

test('approve: rechazado si no se pasa contexto (fail-closed, no se asume que el plan existe)', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed('approve', makeTask({ estado: 'en-diseno' }))
  );
  assert.equal(e.comandoRequerido, 'taskctl plan');
});

test('approve: rechazado fuera de "en-diseno"', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed('approve', makeTask({ estado: 'planificada' }))
  );
  assert.equal(e.comandoRequerido, 'taskctl plan');
});

// --- start ------------------------------------------------------------
// Este es "tu ejemplo exacto" de la seccion 8.1: start antes de plan.

test('start: rechazado si la tarea sigue en "planificada" (ejemplo exacto de la metodologia)', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed('start', makeTask({ id: 'TASK-014', estado: 'planificada' }))
  );
  assert.equal(e.comandoRequerido, 'taskctl plan');
  assert.match(e.message, /esta en estado "planificada", no en "en-diseno"/);
});

test('start: rechazado si complejidad media y plan no aprobado', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed(
      'start',
      makeTask({ estado: 'en-diseno', complejidad: 'media', plan_aprobado: false })
    )
  );
  assert.equal(e.comandoRequerido, 'taskctl approve');
});

test('start: permitido si complejidad media y plan aprobado', () => {
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'start',
      makeTask({ estado: 'en-diseno', complejidad: 'media', plan_aprobado: true })
    )
  );
});

test('start: permitido para trivial/simple aunque plan_aprobado sea false', () => {
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'start',
      makeTask({ estado: 'en-diseno', complejidad: 'trivial', plan_aprobado: false })
    )
  );
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'start',
      makeTask({ estado: 'en-diseno', complejidad: 'simple', plan_aprobado: false })
    )
  );
});

// --- review / codex-review / finish --------------------------------------

test('review: rechazado si no esta "en-curso"', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed('review', makeTask({ estado: 'en-diseno' }))
  );
  assert.equal(e.comandoRequerido, 'taskctl start');
});

test('review: permitido desde "en-curso"', () => {
  assert.doesNotThrow(() => assertTransitionAllowed('review', makeTask({ estado: 'en-curso' })));
});

test('codex-review: rechazado si revision_codex no esta activa', () => {
  throwsStateMachineError(() =>
    assertTransitionAllowed(
      'codex-review',
      makeTask({ estado: 'en-revision', revision_codex: false }),
      { revisionPrimariaAprobada: true }
    )
  );
});

test('codex-review: rechazado si la revision primaria no esta aprobada', () => {
  throwsStateMachineError(() =>
    assertTransitionAllowed(
      'codex-review',
      makeTask({ estado: 'en-revision', revision_codex: true }),
      { revisionPrimariaAprobada: false }
    )
  );
});

test('codex-review: permitido con revision_codex activa y revision primaria aprobada', () => {
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'codex-review',
      makeTask({ estado: 'en-revision', revision_codex: true }),
      { revisionPrimariaAprobada: true }
    )
  );
});

test('finish: rechazado si no ha pasado revision', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed('finish', makeTask({ estado: 'en-curso' }))
  );
  assert.equal(e.comandoRequerido, 'taskctl review');
});

test('finish: rechazado si revision primaria no aprobada', () => {
  throwsStateMachineError(() =>
    assertTransitionAllowed('finish', makeTask({ estado: 'en-revision' }), {
      revisionPrimariaAprobada: false,
    })
  );
});

test('finish: rechazado si revision_codex activa pero no aprobada', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed(
      'finish',
      makeTask({ estado: 'en-revision', revision_codex: true }),
      { revisionPrimariaAprobada: true, revisionCodexAprobada: false }
    )
  );
  assert.equal(e.comandoRequerido, 'taskctl codex-review');
});

test('finish: permitido con todo aprobado', () => {
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'finish',
      makeTask({ estado: 'en-revision', revision_codex: true }),
      { revisionPrimariaAprobada: true, revisionCodexAprobada: true }
    )
  );
});

test('finish: permitido sin Codex si revision_codex es false', () => {
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'finish',
      makeTask({ estado: 'en-revision', revision_codex: false }),
      { revisionPrimariaAprobada: true }
    )
  );
});

// --- cualquier comando sobre una tarea "terminada" -----------------------

test('cualquier comando (salvo import/new) rechazado sobre una tarea ya "terminada"', () => {
  const terminada = makeTask({ estado: 'terminada' });
  for (const cmd of ['plan', 'approve', 'start', 'review', 'finish'] as const) {
    throwsStateMachineError(() => assertTransitionAllowed(cmd, terminada));
  }
});

// --- resultingState -------------------------------------------------------

test('resultingState: mapea cada comando al estado esperado', () => {
  const t = makeTask();
  assert.equal(resultingState('import', t), 'planificada');
  assert.equal(resultingState('new', t), 'planificada');
  assert.equal(resultingState('plan', t), 'en-diseno');
  assert.equal(resultingState('approve', t), 'en-diseno');
  assert.equal(resultingState('start', t), 'en-curso');
  assert.equal(resultingState('review', t), 'en-revision');
  assert.equal(resultingState('codex-review', t), 'en-revision');
  assert.equal(resultingState('finish', t), 'terminada');
});
