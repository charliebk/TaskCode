/**
 * TASK-167c: la skill `auditoria-4d`. Es texto que lee un modelo; lo que se
 * prueba es que el formato del informe que pide es el de
 * `core/auditoria-4d.ts` (el que leera `taskctl metricas`) y que la creacion
 * de tareas por ola usa `taskctl new` con flags que existen y solo si la
 * persona lo pide. Las marcas del repo se comprueban en doctor-deploy.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../src/core/frontmatter.js';
import { FLAGS_NEW } from '../../src/commands/new.js';
import {
  CABECERA_HALLAZGOS_4D,
  CABECERA_RESUMEN_4D,
  DES_4D,
  nombreInformeAuditoria4D,
  PATRON_INFORME_AUDITORIA_4D,
  PATRON_OLA_4D,
  SECCION_HALLAZGOS_4D,
  SECCION_OLAS_4D,
  SECCION_RESUMEN_4D,
  SEVERIDADES_4D,
} from '../../src/core/auditoria-4d.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, '..', '..', '..', 'skills', 'auditoria-4d', 'SKILL.md');
const leer = async (): Promise<string> => (await readFile(SKILL, 'utf8')).replace(/\r\n/g, '\n');

/** El bloque ```markdown de ejemplo del informe. */
function ejemploInforme(t: string): string {
  const m = /```markdown\n([\s\S]*?)\n\s*```/.exec(t);
  assert.ok(m, 'la skill no trae el ejemplo del informe en un bloque ```markdown');
  return (m[1] as string).split('\n').map((l) => l.trim()).join('\n');
}

test('TASK-167c: la skill pide el informe con el formato de core/auditoria-4d (ruta, secciones, cabeceras, las cuatro D y las olas)', async () => {
  const t = await leer();
  const { data, body } = parseFrontmatter(t);
  assert.equal(data.name, 'auditoria-4d');
  assert.match(String(data.description), /\/taskcode-plugin:auditoria-4d/);
  assert.ok(String(data.description).length <= 300);
  assert.ok(body.split('\n').length <= 200);
  // La ruta del informe es la que reconoce el patron.
  assert.match(t, /docs\/auditoria-4d-<AAAA-MM-DD>\.md/);
  assert.match(nombreInformeAuditoria4D('2026-11-25'), PATRON_INFORME_AUDITORIA_4D);
  // La segunda auditoria del dia (`-2`) tambien es un informe; otra cosa, no.
  assert.match(t, /añade `-2`, `-3`/);
  assert.equal(PATRON_INFORME_AUDITORIA_4D.exec('auditoria-4d-2026-11-25-2.md')?.[2], '2');
  assert.doesNotMatch('auditoria-4d-2026-11-25-x.md', PATRON_INFORME_AUDITORIA_4D);
  const informe = ejemploInforme(t);
  const lineas = informe.split('\n');
  // Las tres secciones, en orden, cada una seguida de su tabla.
  const pos = [SECCION_RESUMEN_4D, SECCION_HALLAZGOS_4D, SECCION_OLAS_4D].map((s) => lineas.indexOf(s));
  assert.ok(pos.every((p) => p >= 0) && pos[0]! < pos[1]! && pos[1]! < pos[2]!, `secciones: ${JSON.stringify(pos)}`);
  assert.ok(lineas.includes(CABECERA_RESUMEN_4D), 'cabecera del resumen');
  assert.ok(lineas.includes(CABECERA_HALLAZGOS_4D), 'cabecera de hallazgos');
  // Una fila por D (y el total) en el resumen, con tantas columnas como severidades.
  for (const d of [...DES_4D, 'Total']) {
    const fila = lineas.find((l) => l.startsWith(`| ${d} |`));
    assert.ok(fila, `falta la fila de ${d} en el resumen`);
    assert.equal(fila.split('|').length - 2, SEVERIDADES_4D.length + 1, `columnas de ${d}`);
  }
  // Una fila de ejemplo de hallazgo con las columnas de la cabecera.
  const hallazgo = lineas.find((l) => /^\| 4D-\d+ \|/.test(l));
  assert.ok(hallazgo, 'falta la fila de ejemplo de hallazgo (| 4D-01 | ...)');
  assert.equal(hallazgo.split('|').length, CABECERA_HALLAZGOS_4D.split('|').length, 'columnas de la fila de hallazgo');
  // Cada ola, con sus hallazgos y su duracion.
  const ola = lineas.findIndex((l) => PATRON_OLA_4D.test(l));
  assert.ok(ola >= 0, 'el plan por olas no usa "### Ola N: titulo"');
  const bloqueOla = lineas.slice(ola + 1).join('\n');
  assert.match(bloqueOla, /^- Hallazgos: 4D-\d+/m);
  assert.match(bloqueOla, /^- Duración estimada: N min/m);
  // Lo que hace el informe legible por una herramienta.
  assert.match(t, /una D sin hallazgos va con ceros/);
  assert.match(t, /\*\*sin tildes\*\*/);
  assert.match(t, /ninguna celda lleva `\|`/);
  // Hallazgos con cita, agentes de solo lectura y la Regla 4D sin copiarla.
  assert.match(t, /solo lectura/);
  assert.match(t, /`ruta:línea`/);
  assert.match(t, /task-workflow\/revision\.md/);
  assert.match(t, /task-workflow\/duplicacion\.md/);
  assert.match(t, /\*\*todos los usos\*\*/);
});

test('TASK-167c: las tareas por ola se crean con taskctl new, flags reales y etiqueta regla-4d, solo si la persona lo pide y con el informe commiteado', async () => {
  const t = await leer();
  const bloque = /```bash\n([\s\S]*?)\n\s*```/.exec(t)?.[1] ?? '';
  assert.match(bloque, /taskctl new /, 'el bloque de creacion no llama a taskctl new');
  const flags = [...bloque.matchAll(/(?<=\s)--[a-z-]+/g)].map((m) => m[0]);
  assert.ok(flags.length >= 4, `pocos flags: ${flags.join(' ')}`);
  assert.deepEqual(flags.filter((f) => !FLAGS_NEW.includes(f)), [], 'flags que taskctl new no acepta');
  assert.match(bloque, /--etiquetas regla-4d/);
  // Una tarea sin criterios no se puede cerrar: cada ola lleva los suyos.
  for (const f of ['--titulo', '--objetivo', '--criterio']) assert.ok(flags.includes(f), `el bloque no pasa ${f}`);
  // Solo con el si de la persona, y nunca desde otra rama que no sea la base.
  assert.match(t, /Solo si dice que sí/);
  assert.match(t, /otra rama que no es la base, no\s+las crees/);
  // Pregunta antes; commitea el informe antes del primer new (new aborta con el arbol sucio).
  const cuerpo = parseFrontmatter(t).body;
  const pregunta = cuerpo.indexOf('AskUserQuestion');
  const commit = cuerpo.indexOf('git commit');
  assert.ok(pregunta >= 0 && commit > pregunta && cuerpo.indexOf('taskctl new --titulo') > commit, 'orden: preguntar, commitear el informe, crear');
  const permitido = String(parseFrontmatter(t).data['allowed-tools']);
  for (const h of ['Bash(taskctl:*)', 'Agent', 'AskUserQuestion', 'Bash(git commit:*)']) assert.ok(permitido.includes(h), `falta ${h}`);
  assert.ok(!permitido.includes('Edit') && !permitido.includes('Bash(rm'), 'no edita ni borra');
});
