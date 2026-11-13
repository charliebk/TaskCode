/**
 * Tests de la regla del limite de WIP (TASK-015, item B7). Modulo
 * puro: no toca disco ni Git. Los tests de punta a punta contra repos
 * Git reales viven en start.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTADOS_QUE_OCUPAN_WIP,
  tareasQueBloquean,
  mensajeWipExcedido,
  mensajeWipIndeterminado,
  personaDeTarea,
  resolverAsignado,
} from '../../src/core/wip.js';
import type { Task, TareaUbicada, TaskState } from '../../src/core/task.js';

function tarea(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-900',
    titulo: 'Tarea de prueba',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-curso',
    plan_aprobado: true,
    rama: 'feature/task-900-prueba',
    asignado_a: 'carlos',
    regla_seleccion_skill: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: '2026-09-05',
    actualizado: '2026-09-05',
    dependencias: [],
    ...overrides,
  };
}

/** Tarea mas la carpeta en la que se encontro. Por defecto, coherentes. */
function ubicada(overrides: Partial<Task> = {}, estadoCarpeta?: TaskState): TareaUbicada {
  const task = tarea(overrides);
  return { task, estadoCarpeta: estadoCarpeta ?? task.estado };
}

test('ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos', () => {
  // La decision #13 es explicita: en diseno NO hay tope, y el hueco no
  // se libera al pasar a revision porque la rama sigue viva.
  assert.deepEqual([...ESTADOS_QUE_OCUPAN_WIP], ['en-curso', 'en-revision']);
});

test('tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada', () => {
  // una tarea en curso de la misma persona bloquea
  const mismaPersona = tareasQueBloquean([ubicada({ id: 'TASK-901', asignado_a: 'carlos' })], 'carlos', 'TASK-900');
  assert.equal(mismaPersona.length, 1);
  assert.equal(mismaPersona[0]?.task.id, 'TASK-901');

  // las tareas de otra persona no bloquean
  assert.deepEqual(
    tareasQueBloquean(
      [
        ubicada({ id: 'TASK-901', asignado_a: 'ana' }),
        ubicada({ id: 'TASK-902', asignado_a: 'beto', estado: 'en-revision' }),
      ],
      'carlos',
      'TASK-900'
    ),
    [],
    'otra persona'
  );

  // una tarea sin asignar no bloquea a nadie
  assert.deepEqual(tareasQueBloquean([ubicada({ id: 'TASK-901', asignado_a: null })], 'carlos', 'TASK-900'), [], 'sin asignar');

  // la propia tarea que arranca nunca se bloquea a si misma.
  // Hoy no puede darse (la maquina de estados exige en-diseno para
  // start), pero depender de eso haria que el dia que se relaje la
  // maquina de estados esta comprobacion se bloqueara sola.
  assert.deepEqual(tareasQueBloquean([ubicada({ id: 'TASK-900', asignado_a: 'carlos' })], 'carlos', 'TASK-900'), [], 'la propia');

  // una tarea en revision SI bloquea (la rama sigue abierta)
  const enRevision = tareasQueBloquean(
    [ubicada({ id: 'TASK-901', estado: 'en-revision', asignado_a: 'carlos' })],
    'carlos',
    'TASK-900'
  );
  assert.equal(enRevision.length, 1);
  assert.equal(enRevision[0]?.estadoCarpeta, 'en-revision');

  // la comparacion de persona es exacta y sensible a mayusculas.
  // No se inventa una equivalencia que "taskctl board" no tiene.
  assert.deepEqual(tareasQueBloquean([ubicada({ id: 'TASK-901', asignado_a: 'Carlos' })], 'carlos', 'TASK-900'), [], 'mayusculas');

  // devuelve las bloqueantes ordenadas por ID.
  // El orden en que llegan depende del filesystem; el mensaje de error
  // que se construye con ellas no puede depender de eso.
  assert.deepEqual(
    tareasQueBloquean(
      [ubicada({ id: 'TASK-903' }), ubicada({ id: 'TASK-901' }), ubicada({ id: 'TASK-902' })],
      'carlos',
      'TASK-900'
    ).map((t) => t.task.id),
    ['TASK-901', 'TASK-902', 'TASK-903']
  );

  // Hallazgo MENOR de revision por pares: sin recortar los dos
  // lados, un asignado_a entrecomillado con un espacio final dejaba
  // abrir una segunda rama a la misma persona.
  assert.equal(tareasQueBloquean([ubicada({ id: 'TASK-901', asignado_a: 'carlos ' })], 'carlos', 'TASK-900').length, 1, 'con espacios');

  // Hallazgo MENOR de revision por pares: la cadena vacia pasaba
  // como si fuera una persona, asi que dos tareas sin asignar en
  // vacio se bloqueaban entre si mientras que dos con null no.
  const vacia = [ubicada({ id: 'TASK-901', asignado_a: '' })];
  assert.deepEqual(tareasQueBloquean(vacia, '', 'TASK-900'), [], 'vacio');
  assert.deepEqual(tareasQueBloquean(vacia, '   ', 'TASK-900'), [], 'en blanco');
});

test('mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes', () => {
  // Criterio de aceptacion de TASK-015: "el mensaje de error nombra
  // explicitamente la tarea que esta bloqueando".
  const msg = mensajeWipExcedido('TASK-900', 'carlos', [
    ubicada({ id: 'TASK-901', titulo: 'La que bloquea', rama: 'feature/task-901-bloquea' }),
  ]);
  assert.ok(msg.startsWith('[ERROR] TASK-900:'), msg);
  assert.ok(msg.includes('carlos'), msg);
  assert.ok(msg.includes('TASK-901'), msg);
  assert.ok(msg.includes('02-en-curso'), msg);
  assert.ok(msg.includes('feature/task-901-bloquea'), msg);

  // dice QUE HACER, no solo que ha fallado
  assert.ok(msg.includes('taskctl finish TASK-901'), msg);
  assert.ok(msg.includes('--asignado-a'), msg);

  // con varias bloqueantes las lista todas, no solo la primera.
  // Solo puede pasar si el repo ya estaba inconsistente; nombrar una
  // sola haria creer que cerrando esa se desbloquea.
  const varias = mensajeWipExcedido('TASK-900', 'carlos', [
    ubicada({ id: 'TASK-901' }),
    ubicada({ id: 'TASK-902', estado: 'en-revision' }),
  ]);
  assert.ok(varias.includes('TASK-901'), varias);
  assert.ok(varias.includes('TASK-902'), varias);
  assert.ok(varias.includes('2 tareas'), varias);
  assert.ok(varias.includes('03-en-revision'), varias);

  // Hallazgo MENOR de revision por pares: una tarea fisicamente en
  // 02-en-curso con estado terminada en su frontmatter hacia que el
  // mensaje mandara al usuario a 04-terminadas, donde no hay nada.
  const real = mensajeWipExcedido('TASK-900', 'carlos', [
    ubicada({ id: 'TASK-901', estado: 'terminada' }, 'en-curso'),
  ]);
  assert.ok(real.includes('02-en-curso'), real);
  assert.ok(!real.includes('04-terminadas'), real);

  // Hallazgo MENOR de revision por pares: si la bloqueante esta en
  // 02-en-curso, finish falla porque le falta pasar por review; y en
  // 03-en-revision falla mientras el informe no este aprobado.
  const promesa = mensajeWipExcedido('TASK-900', 'carlos', [ubicada({ id: 'TASK-901' })]);
  assert.ok(promesa.includes('su revision'), promesa);
  assert.ok(promesa.includes('taskctl finish TASK-901'), promesa);
  assert.ok(promesa.includes('--asignado-a'), promesa);
});

test('mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos', () => {
  const msg = mensajeWipIndeterminado('TASK-900', [
    'tareas/02-en-curso/TASK-901/tarea.md',
    'tareas/03-en-revision/TASK-902/tarea.md',
  ]);
  assert.ok(msg.startsWith('[ERROR] TASK-900:'), msg);
  assert.ok(msg.includes('TASK-901'), msg);
  assert.ok(msg.includes('TASK-902'), msg);
  assert.ok(msg.includes('frontmatter'), msg);
});

// --- correcciones de la revision por pares (ronda 1) ---

test('personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor', () => {
  assert.equal(personaDeTarea(null), null);
  assert.equal(personaDeTarea(''), null);
  assert.equal(personaDeTarea('   '), null);
  // Un asignado_a entrecomillado en el frontmatter NO llega
  // recortado: parseScalarOrArray solo recorta lo no entrecomillado.
  assert.equal(personaDeTarea('carlos '), 'carlos');
  assert.equal(personaDeTarea('  carlos  '), 'carlos');
});

// --- TASK-024 (item C7): precedencia del asignado ---

test('resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte', () => {
  // el flag manda sobre todo lo demas
  assert.equal(resolverAsignado('flag@x.com', 'previo@x.com', 'git@x.com'), 'flag@x.com');
  assert.equal(resolverAsignado('flag@x.com', null, null), 'flag@x.com');
  // sin flag gana el asignado previo, NO la identidad Git. Esto es lo
  // que evita el robo silencioso: ejecutar un comando sobre la tarea
  // de otra persona no se la queda.
  assert.equal(resolverAsignado(undefined, 'previo@x.com', 'git@x.com'), 'previo@x.com');
  // sin flag ni previo, entra la identidad Git
  assert.equal(resolverAsignado(undefined, null, 'git@x.com'), 'git@x.com');
  // sin nada de lo tres, null (comportamiento anterior a TASK-024)
  assert.equal(resolverAsignado(undefined, null, null), null);
  // un previo vacio o en blanco no cuenta y deja pasar la identidad.
  // Coherente con personaDeTarea: '' y '   ' son 'sin asignar'.
  assert.equal(resolverAsignado(undefined, '', 'git@x.com'), 'git@x.com');
  assert.equal(resolverAsignado(undefined, '   ', 'git@x.com'), 'git@x.com');
  // recorta los tres escalones
  assert.equal(resolverAsignado('  flag@x.com  ', null, null), 'flag@x.com');
  assert.equal(resolverAsignado(undefined, '  previo@x.com  ', null), 'previo@x.com');
  assert.equal(resolverAsignado(undefined, null, '  git@x.com  '), 'git@x.com');
});
