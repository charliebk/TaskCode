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

test('TASK-153b: revision.md pide comprobar los candidatos 4D de la peticion y mutar sus tests', async () => {
  const revision = await leer('task-workflow/revision.md');
  assert.match(revision, /`## Candidatos 4D`/);
  assert.match(revision, /muta cada test que liste/);
});

/*
 * TASK-158a (Regla 4D preventiva): cada camino que crea o cambia codigo la
 * exige al escribir, con la busqueda de todos los usos antes de dar una
 * duplicacion por resuelta. Un test por camino: si ese camino pierde la
 * instruccion, falla el suyo y nombra el camino.
 */
const AGENTS_DIR = path.join(SKILLS_DIR, '..', 'agents');
const TODOS_LOS_USOS = /todos\s+los\s+usos/;

test('TASK-158a revision: todos los usos antes de dar una duplicacion por resuelta, y la misma autorrevision al corregir', async () => {
  const regla = seccion(await leer('task-workflow/revision.md'), '## Regla 4D');
  assert.match(regla, /Todos los usos: antes de dar una duplicacion por cerrada[\s\S]*no solo los citados/);
  for (const linea of ['- 4D ronda K — ', '- 4D menores — ']) {
    assert.ok(regla.includes(`\`${linea}`), `revision.md: falta la linea de autorrevision "${linea}"`);
  }
});

test('TASK-158a implementacion (start): busca todos los usos y lo anota en la linea 4D', async () => {
  const start = await leer('start/SKILL.md');
  assert.match(start, TODOS_LOS_USOS);
  assert.match(start, /- 4D — <commit>: helper buscado, usos buscados,/);
});

test('TASK-158a correcciones de ronda y MENORES (review): autorrevision 4D por ronda y antes de verificar-menores', async () => {
  const review = await leer('review/SKILL.md');
  assert.match(review, /Regla 4D al corregir y en los MENORES: todos los usos\./);
});

test('TASK-158a brainstorm: cada rol trae su apartado de la Regla 4D en "## Qué miras" con la busqueda de usos', async () => {
  const roles = ['arquitectura', 'dominio', 'rendimiento', 'riesgos', 'testing', 'unificador'];
  for (const rol of roles) {
    const texto = await readFile(path.join(AGENTS_DIR, `brainstorm-${rol}.md`), 'utf8');
    const queMiras = seccion(texto, '## Qué miras');
    assert.match(queMiras, /^- \*\*Regla 4D[^*]*\*\*: \S/m, `brainstorm-${rol}: sin apartado de la Regla 4D`);
    assert.match(queMiras, /todos\s+(los\s+)?(usos|sitios|tests)/, `brainstorm-${rol}: no pide buscar todos los usos`);
  }
});

test('TASK-158a hotfix y doctor-deploy: el codigo pasa por start con la Regla 4D, no se arregla por fuera', async () => {
  assert.match(await leer('finish/SKILL.md'), /hotfix pasa por `start` y su\s+autorrevision de la Regla 4D/);
  const deploy = await leer('doctor-deploy/SKILL.md');
  assert.match(deploy, /No arregles el código aquí: cada arreglo pasa por\s+plan y start, con la Regla 4D/);
  assert.match(deploy, TODOS_LOS_USOS);
});
