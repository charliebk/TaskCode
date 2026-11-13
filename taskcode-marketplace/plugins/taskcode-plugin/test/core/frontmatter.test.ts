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

test('parseFrontmatter: plantilla real de tarea.md y tipado de valores (lista vacia, null, booleanos, enteros, comillas, cuerpo vacio)', () => {
  // Parsea la plantilla real de tarea.md.
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

  // Lista vacia [] se parsea como [].
  assert.deepEqual(parseFrontmatter('---\netiquetas: []\n---\n').data.etiquetas, [], 'lista vacia');

  // null y ~ son equivalentes.
  const nulos = parseFrontmatter('---\na: null\nb: ~\n---\n').data;
  assert.equal(nulos.a, null, 'null');
  assert.equal(nulos.b, null, '~');

  // Booleanos y enteros se tipan, no quedan como texto.
  const tipados = parseFrontmatter('---\nactivo: true\ninactivo: false\nn: 42\n---\n').data;
  assert.equal(tipados.activo, true);
  assert.equal(typeof tipados.activo, 'boolean');
  assert.equal(tipados.inactivo, false);
  assert.equal(tipados.n, 42);
  assert.equal(typeof tipados.n, 'number');

  // Cadena con comillas escapadas se desescapa.
  assert.equal(parseFrontmatter('---\ntitulo: "dice \\"hola\\""\n---\n').data.titulo, 'dice "hola"', 'comillas');

  // Cuerpo vacio no revienta.
  const vacio = parseFrontmatter('---\nid: TASK-001\n---\n');
  assert.equal(vacio.data.id, 'TASK-001');
  assert.equal(vacio.body, '');
});

test('parseFrontmatter: error si no empieza con "---", si no se cierra o si una linea no tiene ":"', () => {
  assert.throws(() => parseFrontmatter('id: TASK-001\n---\n'), FrontmatterParseError, 'sin apertura');
  assert.throws(() => parseFrontmatter('---\nid: TASK-001\n'), FrontmatterParseError, 'sin cierre');
  assert.throws(() => parseFrontmatter('---\nid TASK-001\n---\n'), FrontmatterParseError, 'linea sin ":"');
});

test('serializeFrontmatter + parseFrontmatter: roundtrip de tipos, strings ambiguos y listas con coma', () => {
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

  // --- Regresion: hallazgos de revision por pares (Sprint 0) ---------------
  // Un string que "parece" numero/boolean/null se conserva como string.
  const ambiguo = { titulo: '2024', activo: 'true', vacio: 'null', virgulilla: '~' };
  const parsedAmbiguo = parseFrontmatter(serializeFrontmatter(ambiguo, '', Object.keys(ambiguo)));
  assert.deepEqual(parsedAmbiguo.data, ambiguo);
  for (const v of Object.values(parsedAmbiguo.data)) {
    assert.equal(typeof v, 'string');
  }

  // Un elemento de lista con coma dentro no se parte en dos.
  const conComa = { etiquetas: ['ui, ux', 'backend'] };
  const parsedComa = parseFrontmatter(serializeFrontmatter(conComa, '', ['etiquetas']));
  assert.deepEqual(parsedComa.data.etiquetas, ['ui, ux', 'backend']);
});
