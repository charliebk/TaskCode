import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFrontmatter,
  serializeFrontmatter,
  FrontmatterParseError,
} from '../../src/core/frontmatter.js';

const FIXTURE = `---
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
Texto del cuerpo.
## Criterios de aceptacion
- [ ] uno
`;

test('parseFrontmatter: parsea la plantilla real de tarea.md', () => {
  const { data, body } = parseFrontmatter(FIXTURE);
  assert.equal(data.id, 'TASK-014');
  assert.equal(data.titulo, 'Anadir validacion de espesor de muro en importador IFC');
  assert.equal(data.tipo, 'feature'); // el comentario inline se descarta
  assert.equal(data.sprint, 3);
  assert.deepEqual(data.etiquetas, ['ifc', 'importador', 'validacion']);
  assert.equal(data.plan_aprobado, false);
  assert.equal(data.asignado_a, null);
  assert.deepEqual(data.skills_recomendados, []);
  assert.equal(data.revision_codex, false);
  assert.match(body, /^## Objetivo/);
});

test('parseFrontmatter: lista vacia [] se parsea como []', () => {
  const { data } = parseFrontmatter('---\netiquetas: []\n---\n');
  assert.deepEqual(data.etiquetas, []);
});

test('parseFrontmatter: null y ~ son equivalentes', () => {
  const { data } = parseFrontmatter('---\na: null\nb: ~\n---\n');
  assert.equal(data.a, null);
  assert.equal(data.b, null);
});

test('parseFrontmatter: booleanos y enteros se tipan, no quedan como texto', () => {
  const { data } = parseFrontmatter('---\nactivo: true\ninactivo: false\nn: 42\n---\n');
  assert.equal(data.activo, true);
  assert.equal(typeof data.activo, 'boolean');
  assert.equal(data.inactivo, false);
  assert.equal(data.n, 42);
  assert.equal(typeof data.n, 'number');
});

test('parseFrontmatter: cadena con comillas escapadas se desescapa', () => {
  const { data } = parseFrontmatter('---\ntitulo: "dice \\"hola\\""\n---\n');
  assert.equal(data.titulo, 'dice "hola"');
});

test('parseFrontmatter: cuerpo vacio no revienta', () => {
  const { data, body } = parseFrontmatter('---\nid: TASK-001\n---\n');
  assert.equal(data.id, 'TASK-001');
  assert.equal(body, '');
});

test('parseFrontmatter: error si no empieza con "---"', () => {
  assert.throws(() => parseFrontmatter('id: TASK-001\n---\n'), FrontmatterParseError);
});

test('parseFrontmatter: error si el bloque no se cierra', () => {
  assert.throws(() => parseFrontmatter('---\nid: TASK-001\n'), FrontmatterParseError);
});

test('parseFrontmatter: error si una linea no tiene ":"', () => {
  assert.throws(() => parseFrontmatter('---\nid TASK-001\n---\n'), FrontmatterParseError);
});

test('serializeFrontmatter + parseFrontmatter: roundtrip para varios tipos de valor', () => {
  const data = {
    id: 'TASK-099',
    titulo: 'Con espacios y : dos puntos',
    sprint: 7,
    activo: true,
    inactivo: false,
    vacio: null as string | null,
    lista: ['a', 'b', 'c'],
    listaVacia: [] as string[],
  };
  const order = Object.keys(data);
  const serialized = serializeFrontmatter(data, '## Cuerpo\n', order);
  const parsed = parseFrontmatter(serialized);
  assert.deepEqual(parsed.data, data);
  assert.equal(parsed.body, '## Cuerpo\n');
});

// --- Regresion: hallazgos de revision por pares (Sprint 0) ---------------

test('roundtrip: un string que "parece" numero/boolean/null se conserva como string', () => {
  const data = { titulo: '2024', activo: 'true', vacio: 'null', virgulilla: '~' };
  const order = Object.keys(data);
  const serialized = serializeFrontmatter(data, '', order);
  const parsed = parseFrontmatter(serialized);
  assert.deepEqual(parsed.data, data);
  for (const v of Object.values(parsed.data)) {
    assert.equal(typeof v, 'string');
  }
});

test('roundtrip: un elemento de lista con coma dentro no se parte en dos', () => {
  const data = { etiquetas: ['ui, ux', 'backend'] };
  const serialized = serializeFrontmatter(data, '', ['etiquetas']);
  const parsed = parseFrontmatter(serialized);
  assert.deepEqual(parsed.data.etiquetas, ['ui, ux', 'backend']);
});
