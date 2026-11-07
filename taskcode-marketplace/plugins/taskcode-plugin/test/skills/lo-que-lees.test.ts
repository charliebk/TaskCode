/**
 * TASK-081: las skills le dicen al revisor que lea solo el contexto permitido
 * de su peticion y que justifique lo demas, y a quien orquesta que pase la
 * ruta de la peticion y el modelo sugerido de la ronda.
 *
 * Se asevera sobre la SECCION (encabezado propio fuera de los bloques
 * cercados, con cuerpo), no sobre una mencion suelta: mismo patron que el
 * test 9b/10 bis de revisores.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { informeTemplate } from '../../src/commands/review.js';
import type { Task } from '../../src/core/task.js';

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SKILLS = path.join(PLUGIN_ROOT, 'skills');
const REVISION_MD = path.join(SKILLS, 'task-workflow', 'revision.md');

/** Cuerpo de la seccion `## <titulo>` fuera de bloques cercados, o null. */
function seccion(texto: string, titulo: string): string | null {
  const fuera: string[] = [];
  let dentro = false;
  for (const l of texto.split(/\r?\n/)) {
    if (/^\s*```/.test(l)) {
      dentro = !dentro;
      continue;
    }
    if (!dentro) fuera.push(l);
  }
  const ini = fuera.findIndex((l) => l.trim() === `## ${titulo}`);
  if (ini === -1) return null;
  const fin = fuera.findIndex((l, i) => i > ini && /^##\s/.test(l));
  return fuera.slice(ini + 1, fin === -1 ? fuera.length : fin).join('\n');
}

const SECCION_PETICION = '## Contexto permitido';
const SECCION_INFORME = '## Lecturas fuera del contexto permitido';

test('revision.md (TASK-081): "Lo que lees" es una seccion propia que remite a las dos secciones', async () => {
  const bruto = seccion(await readFile(REVISION_MD, 'utf8'), 'Lo que lees');
  assert.notEqual(bruto, null, 'revision.md no tiene la seccion "## Lo que lees"');
  // El texto se parte en lineas: se compara con los espacios colapsados.
  const cuerpo = (bruto as string).replace(/\s+/g, ' ');
  assert.ok(cuerpo.includes(SECCION_PETICION.slice(3)), 'no remite al contexto permitido de la peticion');
  assert.ok(cuerpo.includes(SECCION_INFORME.slice(3)), 'no manda justificar lo leido fuera en el informe');
});

test('revision.md (TASK-081): contraprueba, una mencion suelta o dentro de un bloque no cuenta como seccion', () => {
  const suelta = `# T\n\n## Otra\n\nAqui se habla de lo que lees, y de ${SECCION_PETICION}.\n`;
  assert.equal(seccion(suelta, 'Lo que lees'), null);
  const enBloque = '# T\n\n```\n## Lo que lees\n```\n';
  assert.equal(seccion(enBloque, 'Lo que lees'), null);
  const real = `# T\n\n## Lo que lees\n\nLee ${SECCION_PETICION}.\n\n## Siguiente\n`;
  assert.ok((seccion(real, 'Lo que lees') as string).includes(SECCION_PETICION));
});

test('el esqueleto del informe que genera review trae la seccion que revision.md nombra (TASK-081)', () => {
  const informe = informeTemplate({ id: 'TASK-999' } as unknown as Task, 'abc', 1);
  assert.ok(informe.includes(`${SECCION_INFORME}\n\nninguna`));
});

test('code-quality-reviewer (TASK-081): remite a "Lo que lees" de revision.md', async () => {
  const texto = await readFile(path.join(SKILLS, 'code-quality-reviewer', 'SKILL.md'), 'utf8');
  assert.match(texto, /Contexto permitido[^\n]*\n[^\n]*"Lo que lees"[^\n]*revision\.md/);
});

test('review (TASK-081): el prompt del revisor lleva la ruta de su peticion y el modelo sugerido de la ronda', async () => {
  const texto = (await readFile(path.join(SKILLS, 'review', 'SKILL.md'), 'utf8')).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
  assert.match(texto, /El prompt de cada revisor lleva la ruta de SU peticion/);
  assert.ok(texto.includes('peticion-revision-N[-skill].md'));
  assert.match(texto, /- Modelo sugerido para esta ronda: <modelo> \(\.\.\.\)`, lanza el revisor con ESE modelo/);
});
