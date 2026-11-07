/**
 * TASK-082: las listas de comprobacion de las revisoras viven en un solo
 * sitio — la seccion `## Que se revisa` de cada skill revisora — y la leen
 * tanto el revisor como la autorrevision de la skill `review`, que remite a
 * ella sin copiarla.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarCatalogoRevisores } from '../../src/core/revisores.js';
import { SECCION_AUTORREVISION } from '../../src/core/autorrevision.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(HERE, '..', '..', '..', 'skills');
const REVIEW_MD = path.join(SKILLS_DIR, 'review', 'SKILL.md');
const SECCION = '## Que se revisa';

/** Lineas de la seccion `## Que se revisa` (sin el encabezado), hasta el siguiente `## `. */
function seccionQueSeRevisa(texto: string): string[] {
  const lineas = texto.split(/\r?\n/);
  const inicio = lineas.findIndex((l) => l.trimEnd() === SECCION);
  if (inicio === -1) return [];
  let fin = inicio + 1;
  while (fin < lineas.length && !/^## /.test(lineas[fin] as string)) fin++;
  return lineas.slice(inicio + 1, fin);
}

function nombresRevisoras(): string[] {
  const catalogo = cargarCatalogoRevisores();
  return [...catalogo.dominio.map((r) => r.nombre), catalogo.generico.nombre];
}

test('el catalogo sigue teniendo 4 revisoras de dominio y la generica (ninguna se cae al tocar sus SKILL.md)', () => {
  const catalogo = cargarCatalogoRevisores();
  assert.deepEqual(
    catalogo.dominio.map((r) => r.nombre).sort(),
    ['angular-vue-reviewer', 'csharp-autocad-ifc-reviewer', 'java-spring-reviewer', 'rust-wasm-reviewer']
  );
  assert.equal(catalogo.generico.nombre, 'code-quality-reviewer');
});

test('cada revisora tiene exactamente una seccion "## Que se revisa", con contenido', async () => {
  for (const nombre of nombresRevisoras()) {
    const texto = await readFile(path.join(SKILLS_DIR, nombre, 'SKILL.md'), 'utf8');
    const encabezados = texto.split(/\r?\n/).filter((l) => l.trimEnd() === SECCION);
    assert.equal(encabezados.length, 1, `${nombre}: ${encabezados.length} encabezados "${SECCION}" exactos`);
    assert.ok(seccionQueSeRevisa(texto).join('').trim().length > 200, `${nombre}: la seccion esta casi vacia`);
  }
});

test('la skill review manda la autorrevision: remite a "## Que se revisa", al campo revisores y a la constancia', async () => {
  const texto = await readFile(REVIEW_MD, 'utf8');
  assert.ok(texto.includes(`\`${SECCION}\``), 'no remite a la seccion de las revisoras');
  assert.ok(texto.includes(`\`${SECCION_AUTORREVISION}\``), 'no dice donde dejar la constancia');
  assert.match(texto, /`revisores`/, 'no dice de donde sale la lista de revisoras');
  assert.match(texto, /`- <revisora> — <commit>`/, 'no fija el formato de la linea');
  assert.match(texto, /\.\.\/<revisora>\/SKILL\.md/, 'no dice donde esta la skill de cada revisora');
  // La autorrevision va en el paso 2, antes de lanzar a los revisores.
  const autorrevision = texto.indexOf('**Autorrevision**');
  assert.ok(autorrevision !== -1, 'no hay bloque de autorrevision');
  assert.ok(autorrevision < texto.indexOf('3. Por cada'), 'la autorrevision no esta en el paso 2');
});

test('la ruta relativa que da la skill review llega a la SKILL.md de cada revisora', async () => {
  for (const nombre of nombresRevisoras()) {
    const ruta = path.join(path.dirname(REVIEW_MD), '..', nombre, 'SKILL.md');
    assert.ok((await stat(ruta)).isFile(), `${ruta} no existe`);
  }
});

test('la skill review no copia ninguna linea de las listas: viven solo en cada revisora', async () => {
  const review = await readFile(REVIEW_MD, 'utf8');
  let comprobadas = 0;
  for (const nombre of nombresRevisoras()) {
    const texto = await readFile(path.join(SKILLS_DIR, nombre, 'SKILL.md'), 'utf8');
    for (const linea of seccionQueSeRevisa(texto)) {
      const l = linea.trim();
      if (l.length < 40) continue;
      comprobadas++;
      assert.ok(!review.includes(l), `review/SKILL.md copia de ${nombre}: "${l}"`);
    }
  }
  assert.ok(comprobadas > 50, `solo ${comprobadas} lineas comprobadas: el test no mide nada`);
});
