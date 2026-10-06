/**
 * TASK-023: los campos nuevos de `Task` (tokens_*) no pueden invalidar las
 * tareas que ya existen. Este test relee TODAS las `tarea.md` reales de
 * `tareas/04-terminadas/` con el parser actual, no fixtures sinteticas: es el
 * que habria cazado un campo nuevo declarado como obligatorio.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTareaFile, serializeTareaFile } from '../../src/core/tarea-file.js';

// dist/test/core -> tres niveles arriba esta la raiz del plugin, y tres mas
// la del repo (mismo truco que test/empaquetado/metadatos.test.ts).
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(moduleDir, '..', '..', '..', '..', '..', '..');
const TERMINADAS = path.join(REPO_ROOT, 'tareas', '04-terminadas');

test('todas las tarea.md reales de tareas/04-terminadas siguen validando con los campos de tokens', async (t) => {
  if (!existsSync(path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json')) || !existsSync(TERMINADAS)) {
    t.skip('sin tareas/04-terminadas: el plugin se esta probando fuera de su repo');
    return;
  }
  const ids = (await readdir(TERMINADAS, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  assert.ok(ids.length > 0, 'no hay ninguna tarea terminada que releer: el test seria vacuo');
  const fallos: string[] = [];
  for (const id of ids) {
    const fichero = path.join(TERMINADAS, id, 'tarea.md');
    if (!existsSync(fichero)) continue;
    try {
      const { task, body } = parseTareaFile(await readFile(fichero, 'utf8'));
      // Lo que no registra nadie es null, no un cero; y reescribirla no la rompe.
      for (const c of ['tokens_diseno', 'tokens_implementacion', 'tokens_revision'] as const) {
        assert.ok(task[c] === null || Number.isInteger(task[c]), `${id}: ${c}`);
      }
      parseTareaFile(serializeTareaFile(task, body));
    } catch (e: unknown) {
      fallos.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  assert.deepEqual(fallos, [], `tareas reales que ya no validan:\n${fallos.join('\n')}`);
});
