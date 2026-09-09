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

test('tareasQueBloquean: una tarea en curso de la misma persona bloquea', () => {
  const otras = [ubicada({ id: 'TASK-901', asignado_a: 'carlos' })];
  const bloqueantes = tareasQueBloquean(otras, 'carlos', 'TASK-900');
  assert.equal(bloqueantes.length, 1);
  assert.equal(bloqueantes[0]?.task.id, 'TASK-901');
});

test('tareasQueBloquean: las tareas de otra persona no bloquean', () => {
  const otras = [
    ubicada({ id: 'TASK-901', asignado_a: 'ana' }),
    ubicada({ id: 'TASK-902', asignado_a: 'beto', estado: 'en-revision' }),
  ];
  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
});

test('tareasQueBloquean: una tarea sin asignar no bloquea a nadie', () => {
  const otras = [ubicada({ id: 'TASK-901', asignado_a: null })];
  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
});

test('tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma', () => {
  // Hoy no puede darse (la maquina de estados exige en-diseno para
  // start), pero depender de eso haria que el dia que se relaje la
  // maquina de estados esta comprobacion se bloqueara sola.
  const otras = [ubicada({ id: 'TASK-900', asignado_a: 'carlos' })];
  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
});

test('tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta)', () => {
  const otras = [ubicada({ id: 'TASK-901', estado: 'en-revision', asignado_a: 'carlos' })];
  const bloqueantes = tareasQueBloquean(otras, 'carlos', 'TASK-900');
  assert.equal(bloqueantes.length, 1);
  assert.equal(bloqueantes[0]?.estadoCarpeta, 'en-revision');
});

test('tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas', () => {
  // No se inventa una equivalencia que "taskctl board" no tiene.
  const otras = [ubicada({ id: 'TASK-901', asignado_a: 'Carlos' })];
  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
});

test('tareasQueBloquean: devuelve las bloqueantes ordenadas por ID', () => {
  // El orden en que llegan depende del filesystem; el mensaje de error
  // que se construye con ellas no puede depender de eso.
  const otras = [
    ubicada({ id: 'TASK-903' }),
    ubicada({ id: 'TASK-901' }),
    ubicada({ id: 'TASK-902' }),
  ];
  assert.deepEqual(
    tareasQueBloquean(otras, 'carlos', 'TASK-900').map((t) => t.task.id),
    ['TASK-901', 'TASK-902', 'TASK-903']
  );
});

test('mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama', () => {
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
});

test('mensajeWipExcedido: dice QUE HACER, no solo que ha fallado', () => {
  const msg = mensajeWipExcedido('TASK-900', 'carlos', [ubicada({ id: 'TASK-901' })]);
  assert.ok(msg.includes('taskctl finish TASK-901'), msg);
  assert.ok(msg.includes('--asignado-a'), msg);
});

test('mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera', () => {
  // Solo puede pasar si el repo ya estaba inconsistente; nombrar una
  // sola haria creer que cerrando esa se desbloquea.
  const msg = mensajeWipExcedido('TASK-900', 'carlos', [
    ubicada({ id: 'TASK-901' }),
    ubicada({ id: 'TASK-902', estado: 'en-revision' }),
  ]);
  assert.ok(msg.includes('TASK-901'), msg);
  assert.ok(msg.includes('TASK-902'), msg);
  assert.ok(msg.includes('2 tareas'), msg);
  assert.ok(msg.includes('03-en-revision'), msg);
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

test('personaDeTarea: null, cadena vacia y solo-espacios son sin asignar', () => {
  assert.equal(personaDeTarea(null), null);
  assert.equal(personaDeTarea(''), null);
  assert.equal(personaDeTarea('   '), null);
});

test('personaDeTarea: recorta los espacios de alrededor', () => {
  // Un asignado_a entrecomillado en el frontmatter NO llega
  // recortado: parseScalarOrArray solo recorta lo no entrecomillado.
  assert.equal(personaDeTarea('carlos '), 'carlos');
  assert.equal(personaDeTarea('  carlos  '), 'carlos');
});

test('tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado)', () => {
  // Hallazgo MENOR de revision por pares: sin recortar los dos
  // lados, un asignado_a entrecomillado con un espacio final dejaba
  // abrir una segunda rama a la misma persona.
  const otras = [ubicada({ id: 'TASK-901', asignado_a: 'carlos ' })];
  assert.equal(tareasQueBloquean(otras, 'carlos', 'TASK-900').length, 1);
});

test('tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio', () => {
  // Hallazgo MENOR de revision por pares: la cadena vacia pasaba
  // como si fuera una persona, asi que dos tareas sin asignar en
  // vacio se bloqueaban entre si mientras que dos con null no.
  const otras = [ubicada({ id: 'TASK-901', asignado_a: '' })];
  assert.deepEqual(tareasQueBloquean(otras, '', 'TASK-900'), []);
  assert.deepEqual(tareasQueBloquean(otras, '   ', 'TASK-900'), []);
});

test('mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter', () => {
  // Hallazgo MENOR de revision por pares: una tarea fisicamente en
  // 02-en-curso con estado terminada en su frontmatter hacia que el
  // mensaje mandara al usuario a 04-terminadas, donde no hay nada.
  const msg = mensajeWipExcedido('TASK-900', 'carlos', [
    ubicada({ id: 'TASK-901', estado: 'terminada' }, 'en-curso'),
  ]);
  assert.ok(msg.includes('02-en-curso'), msg);
  assert.ok(!msg.includes('04-terminadas'), msg);
});

test('mensajeWipExcedido: no promete un taskctl finish que todavia fallaria', () => {
  // Hallazgo MENOR de revision por pares: si la bloqueante esta en
  // 02-en-curso, finish falla porque le falta pasar por review; y en
  // 03-en-revision falla mientras el informe no este aprobado.
  const msg = mensajeWipExcedido('TASK-900', 'carlos', [ubicada({ id: 'TASK-901' })]);
  assert.ok(msg.includes('su revision'), msg);
  assert.ok(msg.includes('taskctl finish TASK-901'), msg);
  assert.ok(msg.includes('--asignado-a'), msg);
});

// --- TASK-024 (item C7): precedencia del asignado ---

test('resolverAsignado: el flag manda sobre todo lo demas', () => {
  assert.equal(resolverAsignado('flag@x.com', 'previo@x.com', 'git@x.com'), 'flag@x.com');
  assert.equal(resolverAsignado('flag@x.com', null, null), 'flag@x.com');
});

test('resolverAsignado: sin flag gana el asignado previo, NO la identidad Git', () => {
  // Esto es lo que evita el robo silencioso: ejecutar un comando
  // sobre la tarea de otra persona no se la queda.
  assert.equal(resolverAsignado(undefined, 'previo@x.com', 'git@x.com'), 'previo@x.com');
});

test('resolverAsignado: sin flag ni previo, entra la identidad Git', () => {
  assert.equal(resolverAsignado(undefined, null, 'git@x.com'), 'git@x.com');
});

test('resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024)', () => {
  assert.equal(resolverAsignado(undefined, null, null), null);
});

test('resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad', () => {
  // Coherente con personaDeTarea: '' y '   ' son 'sin asignar'.
  assert.equal(resolverAsignado(undefined, '', 'git@x.com'), 'git@x.com');
  assert.equal(resolverAsignado(undefined, '   ', 'git@x.com'), 'git@x.com');
});

test('resolverAsignado: recorta los tres escalones', () => {
  assert.equal(resolverAsignado('  flag@x.com  ', null, null), 'flag@x.com');
  assert.equal(resolverAsignado(undefined, '  previo@x.com  ', null), 'previo@x.com');
  assert.equal(resolverAsignado(undefined, null, '  git@x.com  '), 'git@x.com');
});
