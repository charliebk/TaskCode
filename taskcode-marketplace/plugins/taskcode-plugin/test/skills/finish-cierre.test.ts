/**
 * La skill `finish` y las opciones de cierre (TASK-060, criterio 10). Es
 * markdown que lee un modelo: lo comprobable es que nombre las tres formas de
 * cerrar y los flags exactos del CLI, que pregunte en manual y semiautomatico,
 * que en automatico no pregunte y use `cierre`, y que el CLI de verdad
 * exponga ese `cierre` y esos flags (la skill y el codigo no se separan).
 * Que no mencione el proyecto ni rutas internas lo vigila fases.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/core/frontmatter.js';
import { FLAGS_FINISH } from '../../src/commands/finish.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');

async function skill(): Promise<{ texto: string; permitidas: string }> {
  const texto = await readFile(path.join(PLUGIN_ROOT, 'skills', 'finish', 'SKILL.md'), 'utf8');
  const { data } = parseFrontmatter(texto);
  return { texto, permitidas: String(data['allowed-tools']) };
}

test('skill finish: nombra el merge normal por defecto, --merge-request y --tag, y los flags existen en el CLI', async () => {
  const { texto } = await skill();
  assert.match(texto, /Merge normal\*\* \(por defecto\)/);
  assert.match(texto, /taskctl finish TASK-NNN --merge-request/);
  assert.match(texto, /--tag <nombre>/);
  for (const flag of ['--merge-request', '--tag']) {
    assert.ok(FLAGS_FINISH.includes(flag), `${flag} debe ser un flag valido de finish`);
  }
});

test('skill finish: en manual y semiautomatico pregunta (AskUserQuestion permitida) merge o merge request y tag opcional', async () => {
  const { texto, permitidas } = await skill();
  assert.match(permitidas, /AskUserQuestion/);
  assert.match(texto, /Modo `manual` o `semiautomatico`\*\*: pregunta con AskUserQuestion/);
  assert.match(texto, /\*\*merge normal\*\* \(opcion por defecto y primera\) o \*\*merge\s+request\*\*/);
  assert.match(texto, /sin tag \(por defecto\)/);
});

test('skill finish: en automatico no pregunta, usa `cierre` de siguiente --json y nunca inventa un tag', async () => {
  const { texto } = await skill();
  assert.match(texto, /Modo `automatico`\*\*: no preguntes/);
  assert.match(texto, /`modo` y `cierre` de `taskctl siguiente TASK-NNN --json`/);
  assert.match(texto, /cierre_por_defecto/);
  assert.match(texto, /Nunca pases `--tag` por tu cuenta/);
});

test('skill finish: el segundo cierre (seccion "## Merge request" en tarea.md) no pregunta y hotfix/release no llevan merge request', async () => {
  const { texto } = await skill();
  assert.match(texto, /seccion `## Merge request`/);
  assert.match(texto, /no preguntes el modo de cierre/);
  assert.match(texto, /Hotfix y release\*\* no tienen merge request/);
  assert.match(texto, /Si acabas de\s+abrir un merge request, la tarea NO esta terminada/);
});
