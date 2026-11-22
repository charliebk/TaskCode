/**
 * TASK-137: la Regla 4D se define una vez (revision.md) y cada revisora da
 * un ejemplo por D en su dominio dentro de `## Que se revisa` (lo que tambien
 * pasa la autorrevision); `start` exige la autorrevision 4D antes de revisar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarCatalogoRevisores } from '../../src/core/revisores.js';
import { DIMENSIONES_4D } from '../../src/core/informe-revision.js';
import { SECCION_AUTORREVISION } from '../../src/core/autorrevision.js';
import { rangoDeSeccion } from '../../src/core/transiciones.js';

const SKILLS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'skills');
const leer = (rel: string): Promise<string> => readFile(path.join(SKILLS_DIR, rel), 'utf8');

/** Texto de la seccion `titulo` (hasta el siguiente encabezado de nivel 1 o 2). */
function seccion(texto: string, titulo: string): string {
  const lineas = texto.split(/\r?\n/);
  const r = rangoDeSeccion(lineas, titulo);
  return r === null ? '' : lineas.slice(r[0], r[1]).join('\n');
}

/** Cada D con un ejemplo: una linea de lista que empieza por ella. */
function faltanD(texto: string): string[] {
  return DIMENSIONES_4D.filter((d) => !new RegExp(`^- (\\*\\*)?${d}(\\*\\*)?: \\S`, 'm').test(texto));
}

test('revision.md define las 4D con ejemplo y hace IMPORTANTE la duplicacion y el disfraz reales', async () => {
  const regla = seccion(await leer('task-workflow/revision.md'), '## Regla 4D');
  assert.deepEqual(faltanD(regla), []);
  assert.equal((regla.match(/Ej\.:/g) ?? []).length, 4, 'un ejemplo por D');
  assert.match(regla, /Duplicacion y disfraz reales son \*\*IMPORTANTE\*\*/);
});

test('cada revisora da un ejemplo por D en su seccion "## Que se revisa" y remite a revision.md', async () => {
  const catalogo = cargarCatalogoRevisores();
  for (const nombre of [...catalogo.dominio.map((r) => r.nombre), catalogo.generico.nombre]) {
    const queSeRevisa = seccion(await leer(`${nombre}/SKILL.md`), '## Que se revisa');
    assert.match(queSeRevisa, /Regla 4D/, `${nombre}: sin apartado de la Regla 4D`);
    assert.deepEqual(faltanD(queSeRevisa), [], `${nombre}: le falta el ejemplo de alguna D`);
    assert.match(queSeRevisa, /"Regla 4D" de revision\.md/, `${nombre}: no remite a la definicion`);
  }
});

test('start exige helper buscado, criterio citado y mutacion, anotados en la autorrevision', async () => {
  const start = await leer('start/SKILL.md');
  assert.match(start, /busca el helper existente antes de crear uno/);
  assert.match(start, /cita el criterio que motiva\s+cada cambio/);
  assert.match(start, /comprueba por mutacion cada test nuevo/);
  assert.ok(start.includes(`\`${SECCION_AUTORREVISION}\``));
});

test('TASK-153a: start y revision.md remiten a la guia de patrones de disfraz, que los define', async () => {
  assert.match(await leer('start/SKILL.md'), /task-workflow\/disfraz-tests\.md/);
  assert.match(await leer('task-workflow/revision.md'), /\[disfraz-tests\.md\]\(disfraz-tests\.md\)/);
  const guia = await leer('task-workflow/disfraz-tests.md');
  for (const patron of [/nombre promete/i, /Datos que no distinguen/, /sin matcher/, /`skip` que esconde/]) {
    assert.match(guia, patron);
  }
});
