/**
 * Tests de listTareasEnEstados (TASK-015, item B7), la lectura acotada
 * que usa el limite de WIP. Contra directorios temporales reales, como
 * el resto de task-store.test.ts; aqui no hace falta Git porque esta
 * funcion solo lee ficheros.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeTareaFile, listTareasEnEstados } from '../../src/fs/task-store.js';
import { ESTADOS_QUE_OCUPAN_WIP } from '../../src/core/wip.js';
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

async function withTareasRoot(fn: (tareasRoot: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-wip-'));
  try {
    await fn(path.join(root, 'tareas'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('listTareasEnEstados: tareasRoot inexistente devuelve vacio, no lanza', async () => {
  await withTareasRoot(async (tareasRoot) => {
    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
    assert.deepEqual(r.tareas, []);
    assert.deepEqual(r.ilegibles, []);
  });
});

test('listTareasEnEstados: lee solo las carpetas pedidas, ignorando el resto', async () => {
  await withTareasRoot(async (tareasRoot) => {
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-901', estado: 'planificada' }), '');
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-902', estado: 'en-diseno' }), '');
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-904', estado: 'en-revision' }), '');
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-905', estado: 'terminada' }), '');

    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);

    // Ni planificada ni en-diseno ni terminada ocupan hueco.
    assert.deepEqual(
      r.tareas.map((t) => t.task.id).sort(),
      ['TASK-903', 'TASK-904']
    );
  });
});

test('listTareasEnEstados: un tarea.md ilegible va a "ilegibles", no rompe la lectura', async () => {
  await withTareasRoot(async (tareasRoot) => {
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');
    // Frontmatter roto en una carpeta que SI cuenta.
    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-904');
    await mkdir(rota, { recursive: true });
    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');

    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);

    // La legible se sigue leyendo...
    assert.deepEqual(r.tareas.map((t) => t.task.id), ['TASK-903']);
    // ...y la rota se reporta con su ruta, para poder nombrarla.
    assert.equal(r.ilegibles.length, 1);
    assert.ok(r.ilegibles[0]?.includes('TASK-904'), r.ilegibles[0]);
  });
});

test('listTareasEnEstados: una carpeta de tarea SIN tarea.md dentro se ignora', async () => {
  await withTareasRoot(async (tareasRoot) => {
    // No es una tarea: no ocupa hueco ni impide comprobarlo.
    await mkdir(path.join(tareasRoot, '02-en-curso', 'TASK-904'), { recursive: true });
    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
    assert.deepEqual(r.tareas, []);
    assert.deepEqual(r.ilegibles, []);
  });
});

test('listTareasEnEstados: ignora entradas que no son un ID de tarea', async () => {
  await withTareasRoot(async (tareasRoot) => {
    await mkdir(path.join(tareasRoot, '02-en-curso', 'notas-sueltas'), { recursive: true });
    await writeFile(path.join(tareasRoot, '02-en-curso', 'LEEME.md'), 'hola\n', 'utf8');
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');

    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);

    assert.deepEqual(r.tareas.map((t) => t.task.id), ['TASK-903']);
    assert.deepEqual(r.ilegibles, []);
  });
});

test('listTareasEnEstados: el mismo ID en dos carpetas ocupa un hueco, no dos', async () => {
  await withTareasRoot(async (tareasRoot) => {
    // Inconsistencia de datos que "taskctl board" ya reporta como
    // advertencia: aqui no debe contar doble.
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-revision' }), '');

    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);

    assert.equal(r.tareas.length, 1);
    // Gana la primera segun el orden de `estados`, que es el del ciclo.
    assert.equal(r.tareas[0]?.estadoCarpeta, 'en-curso');
  });
});

test('listTareasEnEstados: las rutas ilegibles vienen ordenadas (mensaje reproducible)', async () => {
  await withTareasRoot(async (tareasRoot) => {
    for (const [carpeta, id] of [
      ['03-en-revision', 'TASK-908'],
      ['02-en-curso', 'TASK-907'],
      ['02-en-curso', 'TASK-906'],
    ] as const) {
      const dir = path.join(tareasRoot, carpeta, id);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, 'tarea.md'), 'roto\n', 'utf8');
    }

    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);

    assert.equal(r.ilegibles.length, 3);
    assert.deepEqual(r.ilegibles, [...r.ilegibles].sort());
  });
});

test('listTareasEnEstados: acepta cualquier subconjunto de estados, no solo el del WIP', async () => {
  await withTareasRoot(async (tareasRoot) => {
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-901', estado: 'planificada' }), '');
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');

    const r = await listTareasEnEstados(tareasRoot, ['planificada']);

    assert.deepEqual(r.tareas.map((t) => t.task.id), ['TASK-901']);
  });
});
