/** TASK-121: troceo en partes TASK-NNNa, b, c... Logica pura, sin Git. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esIdTroceable, idRaiz, leerPartes, planificarTroceo, planTrasTroceo, TroceoError } from '../../src/core/troceo.js';
import { nextTaskId } from '../../src/core/task-id.js';
import { isValidTaskId } from '../../src/core/task.js';
import { salidasReglaUnaHora, siguienteFase } from '../../src/core/flujo.js';
import { numerosHeldoutEnRuta } from '../../src/core/heldout.js';
import { sampleTask } from '../helpers/start-fixtures.js';

const PLAN = [
  '# Plan',
  '',
  '## Enfoque propuesto',
  '',
  'Duracion estimada: 150 min',
  '',
  '## Troceo',
  '',
  '### Parte a: Primera',
  'Entrega la primera.',
  'Duracion estimada: 45 min',
  '- [ ] uno',
  '',
  '### Parte b: Segunda',
  'Entrega la segunda.',
  '- [ ] dos',
  '- [x] tres',
  '',
  '```',
  '### Parte z: esto es un ejemplo dentro de codigo',
  '```',
  '',
  '## Plan de pruebas',
  '',
  '- [ ] esto no es de ninguna parte',
].join('\n');

test('leerPartes: lee las partes, su objetivo, criterios y duracion, y para en la siguiente seccion', () => {
  const partes = leerPartes(PLAN, 'TASK-121');
  assert.equal(partes.length, 2);
  assert.deepEqual(partes.map((p) => [p.letra, p.titulo]), [['a', 'Primera'], ['b', 'Segunda']]);
  assert.equal(partes[0]?.objetivo, 'Entrega la primera.');
  assert.deepEqual(partes[0]?.criterios, ['uno']);
  assert.deepEqual(partes[0]?.duracion, { tipo: 'ok', minutos: 45 });
  assert.deepEqual(partes[1]?.criterios, ['dos', 'tres']);
  assert.deepEqual(partes[1]?.duracion, { tipo: 'ausente' });
  assert.doesNotMatch(partes[1]?.objetivo ?? '', /esto no es de ninguna parte/);
});

test('leerPartes: rechaza plan sin seccion, una sola parte, letras saltadas, parte sin objetivo o sin criterios', () => {
  assert.throws(() => leerPartes('# Plan\n', 'TASK-1'), (e) => e instanceof TroceoError && /no tiene seccion/.test(e.message));
  assert.throws(() => leerPartes('## Troceo\n\n### Parte a: x\nobj\n- [ ] c\n', 'TASK-1'), /al menos dos/);
  assert.throws(
    () => leerPartes('## Troceo\n\n### Parte a: x\nobj\n- [ ] c\n### Parte c: y\nobj\n- [ ] c\n', 'TASK-1'),
    /deberia ser "b"/
  );
  assert.throws(() => leerPartes('## Troceo\n\n### Parte a: x\n- [ ] c\n### Parte b: y\nobj\n- [ ] c\n', 'TASK-1'), /no tiene objetivo/);
  assert.throws(() => leerPartes('## Troceo\n\n### Parte a: x\nobj\n### Parte b: y\nobj\n- [ ] c\n', 'TASK-1'), /no tiene criterios/);
});

test('planificarTroceo: la parte a conserva estado y registro; las demas nacen planificadas con la misma rama', () => {
  const task = sampleTask({ id: 'TASK-121', estado: 'en-diseno', plan_aprobado: false, asignado_a: 'carlos' });
  const body = '## Objetivo\n\nTodo.\n\n## Criterios de aceptacion\n- [ ] viejo\n\n## Transiciones\n\n| fila |\n';
  const t = planificarTroceo(task, body, leerPartes(PLAN, task.id), '2026-11-12');
  assert.deepEqual(t.ids, ['TASK-121a', 'TASK-121b']);
  assert.equal(t.parteA.task.id, 'TASK-121a');
  assert.equal(t.parteA.task.estado, 'en-diseno');
  assert.match(t.parteA.body, /^- \[ \] uno$/m);
  assert.doesNotMatch(t.parteA.body, /viejo/);
  assert.match(t.parteA.body, /^> Todo\.$/m);
  assert.match(t.parteA.body, /^## Transiciones$/m);
  const b = t.resto[0]!;
  assert.equal(b.task.estado, 'planificada');
  assert.equal(b.task.rama, task.rama);
  assert.equal(b.task.asignado_a, null);
  assert.equal(b.task.plan_aprobado, false);
  assert.deepEqual(b.task.dependencias, ['TASK-121a']);
  assert.match(b.body, /^- \[ \] dos$/m);
  assert.throws(() => planificarTroceo({ ...task, id: 'TASK-121a' }, body, leerPartes(PLAN, task.id), 'x'), /no se vuelve a trocear/);
});

test('planTrasTroceo: la duracion pasa a la de la parte a y se anota la aceptacion', () => {
  const partes = leerPartes(PLAN, 'TASK-121');
  const nuevo = planTrasTroceo(PLAN, partes, ['TASK-121a', 'TASK-121b'], '2026-11-12');
  assert.match(nuevo, /^Duracion estimada: 45 min \(parte a del troceo; la tarea entera estimaba 150 min\)$/m);
  assert.match(nuevo, /Troceo aceptado por una persona el 2026-11-12: TASK-121a, TASK-121b/);
  // Sin duracion en la parte a, la linea original no se toca.
  const sinDur = PLAN.replace('Duracion estimada: 45 min\n', '');
  assert.match(planTrasTroceo(sinDur, leerPartes(sinDur, 'TASK-121'), ['TASK-121a', 'TASK-121b'], 'x'), /^Duracion estimada: 150 min$/m);
});

test('IDs con letra: validos, cuentan para la numeracion y la carpeta held-out se protege', () => {
  assert.equal(isValidTaskId('TASK-121a'), true);
  assert.equal(isValidTaskId('TASK-121ab'), false);
  assert.equal(isValidTaskId('TASK-121A'), false);
  assert.equal(nextTaskId(['TASK-120', 'TASK-121a', 'TASK-121b']), 'TASK-122');
  assert.equal(esIdTroceable('TASK-121'), true);
  assert.equal(esIdTroceable('TASK-121a'), false);
  assert.equal(idRaiz('TASK-121b'), 'TASK-121');
  assert.deepEqual(numerosHeldoutEnRuta('tareas/02-en-curso/TASK-121a/aceptacion/x.test.ts', '/repo'), [121]);
});

test('siguiente: con mas de 60 min ofrece trocear y aprobar entera; una parte solo aprobar entera; sin exceso, sin salidas', () => {
  const base = {
    planRedactado: true,
    veredicto: null,
    veredictoCodex: null,
    modoCongelado: true,
    rondaRevision: 0,
    informeEnCommitPropio: false,
  };
  const task = sampleTask({ id: 'TASK-121', estado: 'en-diseno', plan_aprobado: false });
  for (const modo of ['manual', 'semiautomatico', 'automatico'] as const) {
    const p = siguienteFase(task, { ...base, duracionEstimada: { tipo: 'ok', minutos: 90 } }, modo);
    assert.equal(p.accion, 'preguntar', modo);
    assert.deepEqual(p.salidas?.map((s) => s.opcion), ['trocear', 'aprobar-entera']);
  }
  assert.deepEqual(salidasReglaUnaHora('TASK-121a').map((s) => s.opcion), ['aprobar-entera']);
  const corto = siguienteFase(task, { ...base, duracionEstimada: { tipo: 'ok', minutos: 60 } }, 'automatico');
  assert.equal(corto.salidas, undefined);
});
