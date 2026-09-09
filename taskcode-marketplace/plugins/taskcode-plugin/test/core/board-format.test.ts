import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTasks, formatBoard, type BoardFilters } from '../../src/core/board-format.js';
import type { Task } from '../../src/core/task.js';

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-001',
    titulo: 'Tarea de prueba',
    tipo: 'feature',
    sprint: 0,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-001-tarea-de-prueba',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-03',
    actualizado: '2026-09-03',
    dependencias: [],
    ...overrides,
  };
}

test('filterTasks: sin filtros devuelve todo', () => {
  const tasks = [sampleTask({ id: 'TASK-001' }), sampleTask({ id: 'TASK-002' })];
  assert.equal(filterTasks(tasks, {}).length, 2);
});

test('filterTasks: --sprint filtra por sprint exacto', () => {
  const tasks = [
    sampleTask({ id: 'TASK-001', sprint: 0 }),
    sampleTask({ id: 'TASK-002', sprint: 1 }),
    sampleTask({ id: 'TASK-003', sprint: 1 }),
  ];
  const filtradas = filterTasks(tasks, { sprint: 1 });
  assert.deepEqual(filtradas.map((t) => t.id), ['TASK-002', 'TASK-003']);
});

test('filterTasks: --asignado_a filtra por asignado exacto (una tarea sin asignar nunca coincide con un filtro no vacio)', () => {
  const tasks = [
    sampleTask({ id: 'TASK-001', asignado_a: 'charlie.bk' }),
    sampleTask({ id: 'TASK-002', asignado_a: null }),
    sampleTask({ id: 'TASK-003', asignado_a: 'otra.persona' }),
  ];
  const filtradas = filterTasks(tasks, { asignadoA: 'charlie.bk' });
  assert.deepEqual(filtradas.map((t) => t.id), ['TASK-001']);
});

test('filterTasks: --sprint y --asignado_a combinados actuan con AND', () => {
  const tasks = [
    sampleTask({ id: 'TASK-001', sprint: 1, asignado_a: 'charlie.bk' }),
    sampleTask({ id: 'TASK-002', sprint: 1, asignado_a: 'otra.persona' }),
    sampleTask({ id: 'TASK-003', sprint: 2, asignado_a: 'charlie.bk' }),
  ];
  const filtradas = filterTasks(tasks, { sprint: 1, asignadoA: 'charlie.bk' });
  assert.deepEqual(filtradas.map((t) => t.id), ['TASK-001']);
});

test('formatBoard: agrupa por estado en el orden del ciclo de vida', () => {
  const tasks = [
    sampleTask({ id: 'TASK-003', estado: 'en-curso' }),
    sampleTask({ id: 'TASK-001', estado: 'planificada' }),
    sampleTask({ id: 'TASK-002', estado: 'en-diseno' }),
  ];
  const out = formatBoard(tasks);
  const posPlanificada = out.indexOf('Planificadas');
  const posDiseno = out.indexOf('En diseno');
  const posCurso = out.indexOf('En curso');
  assert.ok(posPlanificada >= 0 && posDiseno > posPlanificada && posCurso > posDiseno);
});

test('formatBoard: un estado sin tareas (tras el filtro) no imprime cabecera vacia', () => {
  const tasks = [sampleTask({ id: 'TASK-001', estado: 'planificada' })];
  const out = formatBoard(tasks);
  assert.match(out, /Planificadas/);
  assert.doesNotMatch(out, /En diseno/);
  assert.doesNotMatch(out, /En curso/);
  assert.doesNotMatch(out, /En revision/);
  assert.doesNotMatch(out, /Terminadas/);
});

test('formatBoard: sin tareas devuelve cadena vacia (ningun estado tiene nada que mostrar)', () => {
  assert.equal(formatBoard([]), '');
});

test('formatBoard: dentro de un mismo estado, ordena por ID numericamente (no alfabeticamente)', () => {
  const tasks = [
    sampleTask({ id: 'TASK-010', estado: 'planificada', titulo: 'Diez' }),
    sampleTask({ id: 'TASK-002', estado: 'planificada', titulo: 'Dos' }),
    sampleTask({ id: 'TASK-001', estado: 'planificada', titulo: 'Uno' }),
  ];
  const out = formatBoard(tasks);
  const posUno = out.indexOf('TASK-001');
  const posDos = out.indexOf('TASK-002');
  const posDiez = out.indexOf('TASK-010');
  assert.ok(posUno < posDos && posDos < posDiez, `orden incorrecto:\n${out}`);
});

test('formatBoard: una tarea sin asignar se muestra como "(sin asignar)", no vacio ni "null"', () => {
  const out = formatBoard([sampleTask({ id: 'TASK-001', asignado_a: null })]);
  assert.match(out, /\(sin asignar\)/);
  assert.doesNotMatch(out, /\bnull\b/);
});

test('formatBoard: incluye ID, titulo y asignado como columnas de la tabla', () => {
  const out = formatBoard([sampleTask({ id: 'TASK-001', titulo: 'Un titulo distintivo', asignado_a: 'charlie.bk' })]);
  assert.match(out, /TASK-001/);
  assert.match(out, /Un titulo distintivo/);
  assert.match(out, /charlie\.bk/);
});


// --- hallazgos de revision por pares (TASK-005), corregidos ------------

test('formatBoard: un titulo con caracteres CJK (ancho visual doble) no desalinea la tabla (hallazgo IMPORTANTE de revision por pares)', () => {
  const out = formatBoard([
    sampleTask({ id: 'TASK-001', titulo: '日本語のタスク', asignado_a: 'a' }), // 7 caracteres, 14 columnas visuales
    sampleTask({ id: 'TASK-002', titulo: 'x', asignado_a: 'b' }), // 1 caracter, 1 columna visual
  ]);
  const lines = out.split('\n').filter((l) => l.startsWith('TASK-'));
  assert.equal(lines.length, 2);
  // Con el ancho de columna calculado por VISUAL (no por .length), la
  // fila con el titulo CJK no necesita relleno extra (ya ocupa las 14
  // columnas visuales exactas), mientras que la fila con "x" necesita
  // 13 espacios de relleno para alcanzar esas mismas 14 columnas
  // visuales -- exactamente lo que produce un terminal monoespaciado
  // real al alinear ambas filas.
  assert.equal(lines[0], 'TASK-001  日本語のタスク  a');
  assert.equal(lines[1], `TASK-002  x${' '.repeat(13)}  b`);
});

test('formatBoard: un titulo con un tabulador embebido no rompe la tabla (hallazgo IMPORTANTE de revision por pares)', () => {
  const out = formatBoard([sampleTask({ id: 'TASK-001', titulo: 'Con\tun\ttab', asignado_a: 'x' })]);
  assert.doesNotMatch(out, /\t/);
  assert.match(out, /Con un tab/);
});
