import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTransitionAllowed,
  resultingState,
  StateMachineError,
} from '../../src/core/state-machine.js';
import { TASK_COMPLEXITIES, type Task } from '../../src/core/task.js';

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
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
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

test('import/new: permitido si la tarea no existe todavia; rechazado si el ID ya existe', () => {
  assert.doesNotThrow(() => assertTransitionAllowed('import', null));
  assert.doesNotThrow(() => assertTransitionAllowed('new', null));
  const t = makeTask();
  const e = throwsStateMachineError(() => assertTransitionAllowed('new', t));
  assert.equal(e.comandoRequerido, null);
});

// --- plan ---------------------------------------------------------------

test('plan: permitido desde "planificada" y al re-planificar "en-diseno" sin aprobar; rechazos con su comando sugerido', () => {
  assert.doesNotThrow(() => assertTransitionAllowed('plan', makeTask({ estado: 'planificada' })), 'primera vez');
  assert.doesNotThrow(
    () => assertTransitionAllowed('plan', makeTask({ estado: 'en-diseno', plan_aprobado: false })),
    're-planificar'
  );

  // rechazado si el plan ya fue aprobado (sugiere taskctl start)
  const aprobado = throwsStateMachineError(() =>
    assertTransitionAllowed('plan', makeTask({ estado: 'en-diseno', plan_aprobado: true }))
  );
  assert.equal(aprobado.comandoRequerido, 'taskctl start');

  // rechazado desde "en-curso"
  throwsStateMachineError(() => assertTransitionAllowed('plan', makeTask({ estado: 'en-curso' })));

  // rechazado si la tarea no existe (usa import/new)
  const e = throwsStateMachineError(() => assertTransitionAllowed('plan', null));
  assert.match(e.message, /taskctl import o taskctl new/);
});

// --- approve --------------------------------------------------------------

test('approve: permitido desde "en-diseno" con plan-final.md; rechazado sin el (fail-closed) o fuera de "en-diseno"', () => {
  assert.doesNotThrow(() =>
    assertTransitionAllowed('approve', makeTask({ estado: 'en-diseno' }), {
      planFinalExiste: true,
    })
  );

  // rechazado si no hay plan-final.md todavia
  const sinPlan = throwsStateMachineError(() =>
    assertTransitionAllowed('approve', makeTask({ estado: 'en-diseno' }), {
      planFinalExiste: false,
    })
  );
  assert.equal(sinPlan.comandoRequerido, 'taskctl plan');

  // rechazado si no se pasa contexto (fail-closed, no se asume que el plan existe)
  const sinContexto = throwsStateMachineError(() =>
    assertTransitionAllowed('approve', makeTask({ estado: 'en-diseno' }))
  );
  assert.equal(sinContexto.comandoRequerido, 'taskctl plan');

  // rechazado fuera de "en-diseno"
  const fuera = throwsStateMachineError(() =>
    assertTransitionAllowed('approve', makeTask({ estado: 'planificada' }))
  );
  assert.equal(fuera.comandoRequerido, 'taskctl plan');
});

// --- start ------------------------------------------------------------

test('start: rechazos (planificada, plan sin aprobar en cualquier complejidad) y permisos con plan aprobado', () => {
  // Este es "tu ejemplo exacto" de la seccion 8.1: start antes de plan.
  const planificada = throwsStateMachineError(() =>
    assertTransitionAllowed('start', makeTask({ id: 'TASK-014', estado: 'planificada' }))
  );
  assert.equal(planificada.comandoRequerido, 'taskctl plan');
  assert.match(planificada.message, /esta en estado "planificada", no en "en-diseno"/);

  // rechazado si complejidad media y plan no aprobado
  const media = throwsStateMachineError(() =>
    assertTransitionAllowed(
      'start',
      makeTask({ estado: 'en-diseno', complejidad: 'media', plan_aprobado: false })
    )
  );
  assert.equal(media.comandoRequerido, 'taskctl approve');

  // permitido si complejidad media y plan aprobado
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'start',
      makeTask({ estado: 'en-diseno', complejidad: 'media', plan_aprobado: true })
    )
  );

  // El test que habia aqui certificaba lo contrario — que `trivial` y
  // `simple` arrancaban sin pasar por "approve" — y se INVIERTE en
  // TASK-016, no se borra: la decision #1 de la seccion 14 ("checkpoint
  // humano siempre obligatorio") estaba tomada y sin aplicar, y un test
  // borrado no deja rastro de cual era la regla vieja ni de por que
  // cambio.
  // NINGUNA complejidad se salta el checkpoint humano (decision #1, TASK-016)
  for (const complejidad of TASK_COMPLEXITIES) {
    const e = throwsStateMachineError(() =>
      assertTransitionAllowed(
        'start',
        makeTask({ estado: 'en-diseno', complejidad, plan_aprobado: false })
      )
    );
    assert.equal(e.comandoRequerido, 'taskctl approve', `complejidad ${complejidad}`);
  }

  // El simetrico, y no es redundante: sin el, romper "start" para que
  // rechazara SIEMPRE dejaria el bucle de arriba en verde.
  // Cualquier complejidad arranca CON plan_aprobado.
  for (const complejidad of TASK_COMPLEXITIES) {
    assert.doesNotThrow(
      () =>
        assertTransitionAllowed(
          'start',
          makeTask({ estado: 'en-diseno', complejidad, plan_aprobado: true })
        ),
      `complejidad ${complejidad}`
    );
  }
});

// --- review / codex-review / finish --------------------------------------

test('review: rechazado si no esta "en-curso"; permitido desde "en-curso"', () => {
  const e = throwsStateMachineError(() =>
    assertTransitionAllowed('review', makeTask({ estado: 'en-diseno' }))
  );
  assert.equal(e.comandoRequerido, 'taskctl start');
  assert.doesNotThrow(() => assertTransitionAllowed('review', makeTask({ estado: 'en-curso' })));
});

test('codex-review: rechazado sin revision_codex o sin revision primaria aprobada; permitido con ambas', () => {
  // rechazado si revision_codex no esta activa
  throwsStateMachineError(() =>
    assertTransitionAllowed(
      'codex-review',
      makeTask({ estado: 'en-revision', revision_codex: false }),
      { revisionPrimariaAprobada: true }
    )
  );
  // rechazado si la revision primaria no esta aprobada
  throwsStateMachineError(() =>
    assertTransitionAllowed(
      'codex-review',
      makeTask({ estado: 'en-revision', revision_codex: true }),
      { revisionPrimariaAprobada: false }
    )
  );
  // permitido con revision_codex activa y revision primaria aprobada
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'codex-review',
      makeTask({ estado: 'en-revision', revision_codex: true }),
      { revisionPrimariaAprobada: true }
    )
  );
});

test('finish: rechazos (sin revision, primaria o codex sin aprobar) y permisos (todo aprobado, sin Codex)', () => {
  // rechazado si no ha pasado revision
  const sinRevision = throwsStateMachineError(() =>
    assertTransitionAllowed('finish', makeTask({ estado: 'en-curso' }))
  );
  assert.equal(sinRevision.comandoRequerido, 'taskctl review');

  // rechazado si revision primaria no aprobada
  throwsStateMachineError(() =>
    assertTransitionAllowed('finish', makeTask({ estado: 'en-revision' }), {
      revisionPrimariaAprobada: false,
    })
  );

  // rechazado si revision_codex activa pero no aprobada
  const sinCodex = throwsStateMachineError(() =>
    assertTransitionAllowed(
      'finish',
      makeTask({ estado: 'en-revision', revision_codex: true }),
      { revisionPrimariaAprobada: true, revisionCodexAprobada: false }
    )
  );
  assert.equal(sinCodex.comandoRequerido, 'taskctl codex-review');

  // permitido con todo aprobado
  assert.doesNotThrow(() =>
    assertTransitionAllowed(
      'finish',
      makeTask({ estado: 'en-revision', revision_codex: true }),
      { revisionPrimariaAprobada: true, revisionCodexAprobada: true }
    )
  );

  // permitido sin Codex si revision_codex es false
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
