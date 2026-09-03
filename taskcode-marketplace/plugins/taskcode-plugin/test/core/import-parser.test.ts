import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImportMarkdown } from '../../src/core/import-parser.js';

test('parseImportMarkdown: una tarea bien formada', () => {
  const entries = parseImportMarkdown(
    '### Anadir validacion de espesor\n' +
      '- El campo espesor rechaza valores negativos\n' +
      '- El campo espesor rechaza texto no numerico\n'
  );
  assert.equal(entries.length, 1);
  const e = entries[0]!;
  assert.equal(e.ok, true);
  if (e.ok) {
    assert.equal(e.titulo, 'Anadir validacion de espesor');
    assert.deepEqual(e.criterios, [
      'El campo espesor rechaza valores negativos',
      'El campo espesor rechaza texto no numerico',
    ]);
    assert.equal(e.lineNumber, 1);
  }
});

test('parseImportMarkdown: varias tareas bien formadas, en orden', () => {
  const entries = parseImportMarkdown(
    '### Uno\n- criterio a\n\n### Dos\n- criterio b\n- criterio c\n### Tres\n- criterio d\n'
  );
  assert.equal(entries.length, 3);
  assert.deepEqual(
    entries.map((e) => (e.ok ? e.titulo : null)),
    ['Uno', 'Dos', 'Tres']
  );
  assert.ok(entries.every((e) => e.ok));
});

test('parseImportMarkdown: admite "*" como marcador de lista igual que "-"', () => {
  const entries = parseImportMarkdown('### Tarea\n* criterio con asterisco\n');
  assert.equal(entries[0]!.ok, true);
  if (entries[0]!.ok) assert.deepEqual(entries[0]!.criterios, ['criterio con asterisco']);
});

test('parseImportMarkdown: preambulo antes del primer "###" se ignora', () => {
  const entries = parseImportMarkdown(
    '# Sprint N — propuesta\n\nAlgo de contexto aqui.\n\n### Tarea real\n- criterio\n'
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0]!.ok, true);
});

test('parseImportMarkdown: encabezado de otro nivel (##) cierra la entrada sin consumirla como criterio', () => {
  const entries = parseImportMarkdown('### Tarea\n- criterio unico\n## Seccion siguiente\nTexto libre\n');
  assert.equal(entries.length, 1);
  const e = entries[0]!;
  assert.equal(e.ok, true);
  if (e.ok) assert.deepEqual(e.criterios, ['criterio unico']);
});

test('parseImportMarkdown: encabezado sin titulo es un error con motivo', () => {
  const entries = parseImportMarkdown('###   \n- criterio\n');
  assert.equal(entries.length, 1);
  const e = entries[0]!;
  assert.equal(e.ok, false);
  if (!e.ok) assert.match(e.motivo, /no tiene titulo/);
});

test('parseImportMarkdown: sin ningun criterio es un error con motivo, y no rompe las demas entradas', () => {
  const entries = parseImportMarkdown('### Sin criterios\n\n### Con criterios\n- uno\n');
  assert.equal(entries.length, 2);
  const [primera, segunda] = entries;
  assert.equal(primera!.ok, false);
  if (!primera!.ok) assert.match(primera!.motivo, /ningun criterio de aceptacion/);
  assert.equal(segunda!.ok, true);
  if (segunda!.ok) assert.equal(segunda!.titulo, 'Con criterios');
});

test('parseImportMarkdown: una linea suelta (ni criterio ni blanco) es un error con el texto exacto', () => {
  const entries = parseImportMarkdown('### Tarea rara\nEsto no es un criterio\n- pero esto si\n');
  assert.equal(entries.length, 1);
  const e = entries[0]!;
  assert.equal(e.ok, false);
  if (!e.ok) {
    assert.match(e.motivo, /Esto no es un criterio/);
    assert.match(e.motivo, /linea 2/);
  }
});

test('parseImportMarkdown: fichero vacio no produce entradas', () => {
  assert.deepEqual(parseImportMarkdown(''), []);
  assert.deepEqual(parseImportMarkdown('Solo texto, sin encabezados.\n'), []);
});

test('parseImportMarkdown: la ultima entrada del fichero (sin encabezado posterior) tambien se cierra', () => {
  const entries = parseImportMarkdown('### Unica tarea\n- criterio final\n');
  assert.equal(entries.length, 1);
  assert.equal(entries[0]!.ok, true);
});

test('parseImportMarkdown: lineas en blanco entre criterios no rompen la entrada', () => {
  const entries = parseImportMarkdown('### Tarea\n- uno\n\n- dos\n\n\n- tres\n');
  const e = entries[0]!;
  assert.equal(e.ok, true);
  if (e.ok) assert.deepEqual(e.criterios, ['uno', 'dos', 'tres']);
});

test('parseImportMarkdown: tolera criterios con indentacion (hallazgo IMPORTANTE de revision por pares, TASK-004)', () => {
  const entries = parseImportMarkdown('### Tarea con bullets indentados\n  - criterio indentado uno\n  - criterio indentado dos\n');
  assert.equal(entries.length, 1);
  const e = entries[0]!;
  assert.equal(e.ok, true);
  if (e.ok) assert.deepEqual(e.criterios, ['criterio indentado uno', 'criterio indentado dos']);
});

test('parseImportMarkdown: tolera mezclar criterios indentados y sin indentar en la misma entrada', () => {
  const entries = parseImportMarkdown('### Tarea\n- sin indentar\n  - indentado\n    * mas indentado, con asterisco\n');
  const e = entries[0]!;
  assert.equal(e.ok, true);
  if (e.ok) {
    assert.deepEqual(e.criterios, ['sin indentar', 'indentado', 'mas indentado, con asterisco']);
  }
});
