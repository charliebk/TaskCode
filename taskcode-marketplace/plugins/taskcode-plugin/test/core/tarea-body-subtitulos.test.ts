/**
 * TASK-046: subtitulos `###` dentro del Objetivo y de los Criterios, y
 * criterios en varias lineas en `import`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extraerSecciones } from '../../src/core/tarea-body.js';
import { parseImportMarkdown } from '../../src/core/import-parser.js';

test('extraerSecciones (TASK-046): criterios agrupados en subtitulos aparecen todos', () => {
  const s = extraerSecciones(
    '## Objetivo\n\nX.\n\n## Criterios de aceptacion\n### Parser\n- [ ] a\n- [ ] b\n### CLI\n- [ ] c\n'
  );
  assert.deepEqual(s.criterios, ['a', 'b', 'c']);
  assert.deepEqual(s.criteriosTrasCierre, []);
});

test('extraerSecciones (TASK-046): las casillas de "### Tras el cierre" van aparte y no cuentan', () => {
  const s = extraerSecciones(
    '## Criterios de aceptacion\n- [x] uno\n\n### Tras el cierre\n\n(despues de finish)\n- [ ] CI en verde\n\n## Resultado\n- [ ] no es criterio\n'
  );
  assert.deepEqual(s.criterios, ['uno']);
  assert.deepEqual(s.criteriosTrasCierre, ['CI en verde']);
});

test('extraerSecciones (TASK-046): un subtitulo dentro del Objetivo se conserva y no corta el texto', () => {
  const s = extraerSecciones('## Objetivo\n\nPrimero.\n\n### Contexto\n\nSegundo.\n\n## Criterios de aceptacion\n- [ ] a\n');
  assert.match(s.objetivo, /Primero\./);
  assert.match(s.objetivo, /### Contexto/);
  assert.match(s.objetivo, /Segundo\./);
  assert.deepEqual(s.criterios, ['a']);
});

test('extraerSecciones (TASK-046): un ## posterior sigue cerrando la seccion', () => {
  const s = extraerSecciones('## Criterios de aceptacion\n- [ ] a\n## Notas\n- [ ] fuera\n');
  assert.deepEqual(s.criterios, ['a']);
});

test('import (TASK-046): un criterio partido en lineas sangradas es una entrada valida con el criterio completo', () => {
  const [e] = parseImportMarkdown('### Tarea\n- Primera parte\n  y segunda parte\n- Otro\n');
  assert.ok(e !== undefined && e.ok, JSON.stringify(e));
  assert.deepEqual((e as { criterios: string[] }).criterios, ['Primera parte y segunda parte', 'Otro']);
});

test('extraerSecciones (TASK-046, MEN-1 y MEN-3 de su revision): "### Criterios de aceptacion" sigue abriendo los criterios; lo sangrado tras un subtitulo no se pega', () => {
  const s1 = extraerSecciones('## Objetivo\n\nX.\n\n### Criterios de aceptacion\n- [ ] a\n- [ ] b\n');
  assert.deepEqual(s1.criterios, ['a', 'b']);
  const s2 = extraerSecciones('## Criterios de aceptacion\n- [ ] a\n### CLI\n   nota sangrada\n- [ ] b\n');
  assert.deepEqual(s2.criterios, ['a', 'b']);
});

test('import (TASK-046, MEN-2 de su revision): un bloque sangrado tras una linea en blanco no se pega al criterio', () => {
  const [e] = parseImportMarkdown('### Tarea\n- Ejecuta esto:\n\n    rm -rf x\n');
  assert.ok(e !== undefined && !e.ok, JSON.stringify(e));
});

test('import (TASK-046): la prosa sin sangrar sigue invalidando la entrada', () => {
  const [e] = parseImportMarkdown('### Tarea\n- Uno\nprosa suelta\n');
  assert.ok(e !== undefined && !e.ok);
});
