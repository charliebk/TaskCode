import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImportMarkdown } from '../../src/core/import-parser.js';

test('parseImportMarkdown: entradas bien formadas (una, varias, marcadores, preambulo, cierre, blancos, indentacion)', () => {
  // Una tarea bien formada.
  const una = parseImportMarkdown(
    '### Anadir validacion de espesor\n' +
      '- El campo espesor rechaza valores negativos\n' +
      '- El campo espesor rechaza texto no numerico\n'
  );
  assert.equal(una.length, 1, 'una tarea: n');
  const e = una[0]!;
  assert.equal(e.ok, true, 'una tarea: ok');
  if (e.ok) {
    assert.equal(e.titulo, 'Anadir validacion de espesor');
    assert.deepEqual(e.criterios, [
      'El campo espesor rechaza valores negativos',
      'El campo espesor rechaza texto no numerico',
    ]);
    assert.equal(e.lineNumber, 1);
  }

  // Varias tareas bien formadas, en orden.
  const varias = parseImportMarkdown(
    '### Uno\n- criterio a\n\n### Dos\n- criterio b\n- criterio c\n### Tres\n- criterio d\n'
  );
  assert.equal(varias.length, 3, 'varias: n');
  assert.deepEqual(
    varias.map((x) => (x.ok ? x.titulo : null)),
    ['Uno', 'Dos', 'Tres']
  );
  assert.ok(varias.every((x) => x.ok), 'varias: todas ok');

  // Admite "*" como marcador de lista igual que "-".
  const asterisco = parseImportMarkdown('### Tarea\n* criterio con asterisco\n');
  assert.equal(asterisco[0]!.ok, true, 'asterisco: ok');
  if (asterisco[0]!.ok) assert.deepEqual(asterisco[0]!.criterios, ['criterio con asterisco']);

  // Preambulo antes del primer "###" se ignora.
  const preambulo = parseImportMarkdown(
    '# Sprint N — propuesta\n\nAlgo de contexto aqui.\n\n### Tarea real\n- criterio\n'
  );
  assert.equal(preambulo.length, 1, 'preambulo: n');
  assert.equal(preambulo[0]!.ok, true, 'preambulo: ok');

  // Encabezado de otro nivel (##) cierra la entrada sin consumirla como criterio.
  const otroNivel = parseImportMarkdown('### Tarea\n- criterio unico\n## Seccion siguiente\nTexto libre\n');
  assert.equal(otroNivel.length, 1, 'otro nivel: n');
  assert.equal(otroNivel[0]!.ok, true, 'otro nivel: ok');
  if (otroNivel[0]!.ok) assert.deepEqual(otroNivel[0]!.criterios, ['criterio unico']);

  // Fichero vacio no produce entradas.
  assert.deepEqual(parseImportMarkdown(''), []);
  assert.deepEqual(parseImportMarkdown('Solo texto, sin encabezados.\n'), []);

  // La ultima entrada del fichero (sin encabezado posterior) tambien se cierra.
  const ultima = parseImportMarkdown('### Unica tarea\n- criterio final\n');
  assert.equal(ultima.length, 1, 'ultima: n');
  assert.equal(ultima[0]!.ok, true, 'ultima: ok');

  // Lineas en blanco entre criterios no rompen la entrada.
  const blancos = parseImportMarkdown('### Tarea\n- uno\n\n- dos\n\n\n- tres\n');
  assert.equal(blancos[0]!.ok, true, 'blancos: ok');
  if (blancos[0]!.ok) assert.deepEqual(blancos[0]!.criterios, ['uno', 'dos', 'tres']);

  // Tolera criterios con indentacion (hallazgo IMPORTANTE de revision por pares, TASK-004).
  const indentados = parseImportMarkdown('### Tarea con bullets indentados\n  - criterio indentado uno\n  - criterio indentado dos\n');
  assert.equal(indentados.length, 1, 'indentados: n');
  assert.equal(indentados[0]!.ok, true, 'indentados: ok');
  if (indentados[0]!.ok) assert.deepEqual(indentados[0]!.criterios, ['criterio indentado uno', 'criterio indentado dos']);

  // Tolera mezclar criterios indentados y sin indentar en la misma entrada.
  const mezcla = parseImportMarkdown('### Tarea\n- sin indentar\n  - indentado\n    * mas indentado, con asterisco\n');
  assert.equal(mezcla[0]!.ok, true, 'mezcla: ok');
  if (mezcla[0]!.ok) {
    assert.deepEqual(mezcla[0]!.criterios, ['sin indentar', 'indentado', 'mas indentado, con asterisco']);
  }
});

test('parseImportMarkdown: Objetivo (varias lineas, ausente)', () => {
  // Objetivo de varias lineas y un salto de parrafo.
  const entries = parseImportMarkdown(
    '### Con objetivo\n' +
      '> Primera linea del objetivo\n' +
      '> segunda linea\n' +
      '>\n' +
      '> Otro parrafo\n' +
      '\n' +
      '- criterio a\n' +
      '- criterio b\n'
  );
  assert.equal(entries.length, 1);
  const e = entries[0]!;
  assert.equal(e.ok, true);
  if (e.ok) {
    assert.equal(e.objetivo, 'Primera linea del objetivo\nsegunda linea\n\nOtro parrafo');
    assert.deepEqual(e.criterios, ['criterio a', 'criterio b']);
  }

  // Sin Objetivo el campo es cadena vacia y lo demas no cambia.
  assert.deepEqual(parseImportMarkdown('### Sin objetivo\n- criterio a\n'), [
    { ok: true, titulo: 'Sin objetivo', lineNumber: 1, criterios: ['criterio a'], objetivo: '' },
  ]);
});

test('parseImportMarkdown: entradas invalidas con motivo (sin titulo, sin criterios, prosa suelta, ">" tardio)', () => {
  // Encabezado sin titulo es un error con motivo.
  const sinTitulo = parseImportMarkdown('###   \n- criterio\n');
  assert.equal(sinTitulo.length, 1, 'sin titulo: n');
  const st = sinTitulo[0]!;
  assert.equal(st.ok, false, 'sin titulo: ok');
  if (!st.ok) assert.match(st.motivo, /no tiene titulo/);

  // Sin ningun criterio es un error con motivo, y no rompe las demas entradas.
  const sinCriterios = parseImportMarkdown('### Sin criterios\n\n### Con criterios\n- uno\n');
  assert.equal(sinCriterios.length, 2, 'sin criterios: n');
  const [primera, segunda] = sinCriterios;
  assert.equal(primera!.ok, false, 'sin criterios: primera');
  if (!primera!.ok) assert.match(primera!.motivo, /ningun criterio de aceptacion/);
  assert.equal(segunda!.ok, true, 'sin criterios: segunda');
  if (segunda!.ok) assert.equal(segunda!.titulo, 'Con criterios');

  // Una linea suelta (ni criterio ni blanco) es un error con el texto exacto.
  const suelta = parseImportMarkdown('### Tarea rara\nEsto no es un criterio\n- pero esto si\n');
  assert.equal(suelta.length, 1, 'suelta: n');
  const s = suelta[0]!;
  assert.equal(s.ok, false, 'suelta: ok');
  if (!s.ok) {
    assert.match(s.motivo, /Esto no es un criterio/);
    assert.match(s.motivo, /linea 2/);
  }

  // Un ">" DESPUES de un criterio sigue siendo prosa suelta invalida.
  const tardio = parseImportMarkdown('### Mala\n> objetivo valido\n- criterio a\n> esto ya no\n');
  assert.equal(tardio.length, 1, 'tardio: n');
  const t = tardio[0]!;
  assert.equal(t.ok, false, 'tardio: ok');
  if (!t.ok) assert.match(t.motivo, /La linea 4 no es un criterio/);

  // Solo Objetivo y ningun criterio sigue siendo invalido.
  assert.equal(parseImportMarkdown('### Sin criterios\n> objetivo\n')[0]!.ok, false, 'solo objetivo');
});
