/**
 * TASK-150 (Regla 4D, casos CONT de la auditoria 4D): cada regla de las
 * skills y agentes en un solo sitio y de acuerdo con el codigo. Un test por
 * regla: si una skill vuelve a contradecir al CLI o a copiar la regla, falla
 * y nombra el fichero.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarCatalogoRevisores } from '../../src/core/revisores.js';

const SKILLS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'skills');
const leer = (rel: string): Promise<string> => readFile(path.join(SKILLS_DIR, rel), 'utf8');

/** Todos los .md de skills/, con su ruta relativa. */
async function todasLasSkills(): Promise<{ rel: string; texto: string }[]> {
  const salida: { rel: string; texto: string }[] = [];
  for (const dir of await readdir(SKILLS_DIR)) {
    for (const f of await readdir(path.join(SKILLS_DIR, dir)).catch(() => [] as string[])) {
      if (f.endsWith('.md')) salida.push({ rel: `${dir}/${f}`, texto: await leer(`${dir}/${f}`) });
    }
  }
  return salida;
}

test('TASK-150a (CONT-01, CONT-16, CONT-02): la configuracion y el cierre dicen lo mismo que el CLI', async () => {
  const sinc = await leer('task-workflow/sincronizacion.md');
  // config.ts: una clave desconocida avisa y se ignora; solo un valor invalido de una clave conocida aborta.
  assert.doesNotMatch(sinc, /clave mal escrita o un valor invalido aborta/);
  assert.match(sinc, /una clave desconocida \(por ejemplo, mal escrita\) avisa y se\s+ignora/);
  // Las cuentas que divergen del codigo (eran cuatro claves y diecisiete comandos) no se escriben.
  assert.doesNotMatch(sinc, /\b(Tres|tres) claves\b|\bocho comandos\b/);
  // finish.ts lee las casillas (casillasSinMarcar) y avisa.
  const cierre = await leer('task-workflow/cierre.md');
  assert.doesNotMatch(cierre, /no lee las casillas/);
  assert.match(cierre, /`finish` avisa, sin bloquear, de los que siguen sin marcar/);
});

test('TASK-150a (CONT-03, CONT-04): ninguna skill rebaja el test duplicado a MENOR ni manda pedir contexto', async () => {
  for (const { rel, texto } of await todasLasSkills()) {
    assert.doesNotMatch(texto, /duplica a otro ya existente\s+es\s+(un hallazgo\s+)?MENOR/, `${rel}: el test duplicado sigue la Regla 4D`);
    // Un subagente revisor no tiene a quien pedir: lee y lo anota ("Lo que lees" de revision.md).
    assert.doesNotMatch(texto, /\*\*pedirlo explicitamente\*\*|pidelo si un|lo pide para un hallazgo/, `${rel}: pide contexto`);
  }
  assert.match(await leer('task-workflow/tests-pesados.md'), /duplica a otro ya existente\s+es duplicacion de la Regla 4D/);
  for (const r of ['angular-vue', 'java-spring', 'rust-wasm', 'csharp-autocad-ifc']) {
    assert.match(await leer(`${r}-reviewer/SKILL.md`), /"Lo que\s+lees" de revision\.md/, `${r}: no remite a "Lo que lees"`);
  }
});

test('TASK-150a (CONT-09, CONT-18): la descripcion de cada revisora coincide con el reparto y un caso no tiene dos severidades', async () => {
  const catalogo = cargarCatalogoRevisores();
  for (const r of catalogo.dominio) {
    const desc = /^description: (.*)$/m.exec(await leer(`${r.nombre}/SKILL.md`))?.[1] ?? '';
    // El reparto (revisores.ts) solo mira patrones de fichero: nada de "la tarea menciona".
    assert.doesNotMatch(desc, /menciona/, `${r.nombre}: promete un reparto por mencion que no existe`);
    assert.match(desc, /Se usa si el diff toca/, `${r.nombre}: la descripcion no dice cuando se usa`);
  }
  // angular-vue: el dialogo que deja la vista inutilizable con teclado es CRITICO y solo CRITICO.
  const av = await leer('angular-vue-reviewer/SKILL.md');
  const importante = av.slice(av.indexOf('**IMPORTANTE**'), av.indexOf('**MENOR**', av.indexOf('**IMPORTANTE**')));
  assert.ok(importante.length > 0, 'angular-vue: sin lista de IMPORTANTE');
  assert.doesNotMatch(importante, /vista queda inutilizable/, 'angular-vue: el caso CRITICO del dialogo repetido como IMPORTANTE');
});
