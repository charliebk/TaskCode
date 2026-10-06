import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTareaFile, serializeTareaFile } from '../../src/core/tarea-file.js';
import type { Task } from '../../src/core/task.js';

const FIXTURE_REAL = `---
id: TASK-014
titulo: "Anadir validacion de espesor de muro en importador IFC"
tipo: feature            # feature | fix | hotfix | release
sprint: 3
etiquetas: [ifc, importador, validacion]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-014-validacion-espesor-muro
asignado_a: null
agente_revisor: csharp-autocad-ifc-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: []
---
## Objetivo
Texto de ejemplo.
## Criterios de aceptacion
- [ ] uno
`;

test('parseTareaFile: lee la plantilla real de la metodologia (seccion 4)', () => {
  const { task, body } = parseTareaFile(FIXTURE_REAL);
  assert.equal(task.id, 'TASK-014');
  assert.equal(task.tipo, 'feature');
  assert.equal(task.complejidad, 'media');
  assert.deepEqual(task.etiquetas, ['ifc', 'importador', 'validacion']);
  assert.match(body, /^## Objetivo/);
});

function fixtureTask(overrides: Partial<Task>): Task {
  return {
    id: 'TASK-001',
    titulo: 'Tarea base',
    tipo: 'feature',
    sprint: 0,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-001-base',
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

const ROUNDTRIP_CASES: Array<{ nombre: string; task: Task; body: string }> = [
  {
    nombre: 'tarea recien creada, sin asignar',
    task: fixtureTask({}),
    body: '## Objetivo\n...\n## Criterios de aceptacion\n- [ ] ...\n',
  },
  {
    nombre: 'tarea hotfix asignada, revision_codex activa',
    task: fixtureTask({
      id: 'TASK-020',
      titulo: 'Hotfix critico en produccion',
      tipo: 'hotfix',
      complejidad: 'critica',
      modelo_sugerido: 'opus',
      asignado_a: 'carlos',
      revision_codex: true,
      tokens_diseno: null,
      tokens_implementacion: null,
      tokens_revision: null,
      etiquetas: ['produccion', 'urgente'],
      dependencias: ['TASK-014'],
    }),
    body: '## Objetivo\nArreglar el fallo X.\n',
  },
  {
    nombre: 'tarea en diseno con plan aprobado',
    task: fixtureTask({
      id: 'TASK-002',
      estado: 'en-diseno',
      plan_aprobado: true,
      skills_recomendados: ['ts-testing', 'node-cli'],
      ultimo_commit_revisado: 'abc1234',
    }),
    body: '',
  },
  {
    nombre: 'tarea terminada con muchas etiquetas y dependencias',
    task: fixtureTask({
      id: 'TASK-099',
      estado: 'terminada',
      plan_aprobado: true,
      etiquetas: ['a', 'b', 'c', 'd', 'e'],
      dependencias: ['TASK-001', 'TASK-002', 'TASK-003'],
    }),
    body: '## Objetivo\nCon "comillas" y : dos puntos en el titulo tambien.\n',
  },
  {
    nombre: 'tarea release sin etiquetas ni dependencias',
    task: fixtureTask({
      id: 'TASK-050',
      tipo: 'release',
      rama: 'release/1.2.0',
      complejidad: 'alta',
      modelo_sugerido: 'sonnet',
    }),
    body: '## Objetivo\n',
  },
];

for (const { nombre, task, body } of ROUNDTRIP_CASES) {
  test(`roundtrip parseTareaFile(serializeTareaFile(x)) === x: ${nombre}`, () => {
    const serialized = serializeTareaFile(task, body);
    const parsedBack = parseTareaFile(serialized);
    assert.deepEqual(parsedBack.task, task);
    assert.equal(parsedBack.body.trimEnd(), body.trimEnd());

    // Segunda vuelta: el resultado de serializar lo ya parseado debe
    // ser estable (idempotente), no solo el objeto.
    const serializedAgain = serializeTareaFile(parsedBack.task, parsedBack.body);
    assert.equal(serializedAgain, serialized);
  });
}
