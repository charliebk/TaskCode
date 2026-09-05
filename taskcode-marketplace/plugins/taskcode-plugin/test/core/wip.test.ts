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
} from '../../src/core/wip.js';
import type { Task } from '../../src/core/task.js';

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

test('ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos', () => {
  // La decision #13 es explicita: en diseno NO hay tope, y el hueco no
  // se libera al pasar a revision porque la rama sigue viva.
  assert.deepEqual([...ESTADOS_QUE_OCUPAN_WIP], ['en-curso', 'en-revision']);
});

test('tareasQueBloquean: una tarea en curso de la misma persona bloquea', () => {
  const otras = [tarea({ id: 'TASK-901', asignado_a: 'carlos' })];
  const bloqueantes = tareasQueBloquean(otras, 'carlos', 'TASK-900');
  assert.equal(bloqueantes.length, 1);
  assert.equal(bloqueantes[0]?.id, 'TASK-901');
});

test('tareasQueBloquean: las tareas de otra persona no bloquean', () => {
  const otras = [
    tarea({ id: 'TASK-901', asignado_a: 'ana' }),
    tarea({ id: 'TASK-902', asignado_a: 'beto', estado: 'en-revision' }),
  ];
  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
});

test('tareasQueBloquean: una tarea sin asignar no bloquea a nadie', () => {
  const otras = [tarea({ id: 'TASK-901', asignado_a: null })];
  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
});

test('tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma', () => {
  // Hoy no puede darse (la maquina de estados exige en-diseno para
  // start), pero depender de eso haria que el dia que se relaje la
  // maquina de estados esta comprobacion se bloqueara sola.
  const otras = [tarea({ id: 'TASK-900', asignado_a: 'carlos' })];
  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
});

test('tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta)', () => {
  const otras = [tarea({ id: 'TASK-901', estado: 'en-revision', asignado_a: 'carlos' })];
  const bloqueantes = tareasQueBloquean(otras, 'carlos', 'TASK-900');
  assert.equal(bloqueantes.length, 1);
  assert.equal(bloqueantes[0]?.estado, 'en-revision');
});

test('tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas', () => {
  // No se inventa una equivalencia que "taskctl board" no tiene.
  const otras = [tarea({ id: 'TASK-901', asignado_a: 'Carlos' })];
  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
});

test('tareasQueBloquean: devuelve las bloqueantes ordenadas por ID', () => {
  // El orden en que llegan depende del filesystem; el mensaje de error
  // que se construye con ellas no puede depender de eso.
  const otras = [
    tarea({ id: 'TASK-903' }),
    tarea({ id: 'TASK-901' }),
    tarea({ id: 'TASK-902' }),
  ];
  assert.deepEqual(
    tareasQueBloquean(otras, 'carlos', 'TASK-900').map((t) => t.id),
    ['TASK-901', 'TASK-902', 'TASK-903']
  );
});

test('mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama', () => {
  // Criterio de aceptacion de TASK-015: "el mensaje de error nombra
  // explicitamente la tarea que esta bloqueando".
  const msg = mensajeWipExcedido('TASK-900', 'carlos', [
    tarea({ id: 'TASK-901', titulo: 'La que bloquea', rama: 'feature/task-901-bloquea' }),
  ]);
  assert.ok(msg.startsWith('[ERROR] TASK-900:'), msg);
  assert.ok(msg.includes('carlos'), msg);
  assert.ok(msg.includes('TASK-901'), msg);
  assert.ok(msg.includes('02-en-curso'), msg);
  assert.ok(msg.includes('feature/task-901-bloquea'), msg);
});

test('mensajeWipExcedido: dice QUE HACER, no solo que ha fallado', () => {
  const msg = mensajeWipExcedido('TASK-900', 'carlos', [tarea({ id: 'TASK-901' })]);
  assert.ok(msg.includes('taskctl finish TASK-901'), msg);
  assert.ok(msg.includes('--asignado-a'), msg);
});

test('mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera', () => {
  // Solo puede pasar si el repo ya estaba inconsistente; nombrar una
  // sola haria creer que cerrando esa se desbloquea.
  const msg = mensajeWipExcedido('TASK-900', 'carlos', [
    tarea({ id: 'TASK-901' }),
    tarea({ id: 'TASK-902', estado: 'en-revision' }),
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
