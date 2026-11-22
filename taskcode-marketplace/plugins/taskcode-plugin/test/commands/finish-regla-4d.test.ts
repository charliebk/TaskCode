/**
 * TASK-137: `taskctl finish` avisa, sin bloquear, si el informe de la ultima
 * ronda no trae la seccion `## Regla 4D` completa. Repo Git temporal real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runFinishCommand } from '../../src/commands/finish.js';
import { readTareaFile } from '../../src/fs/task-store.js';
import { SCRIPTS_DIR, VEREDICTO_APROBADO, sampleTask, setupTaskEnRevision, withTempRepo } from '../helpers/finish-fixtures.js';

const ID = 'TASK-737';
const REGLA_4D = '\n## Regla 4D\n\n- Duplicacion: cumple\n- Desviacion: cumple\n- Diluvio: cumple\n- Disfraz: cumple\n';

async function avisos4D(informe: string): Promise<string[]> {
  const avisos: string[] = [];
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: ID }), { veredicto: informe });
    await runFinishCommand(tareasRoot, [ID], '2026-11-22', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR, onAviso: (a) => avisos.push(a) });
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'terminada', 'el aviso nunca bloquea');
  });
  return avisos.filter((a) => a.includes('Regla 4D'));
}

test('informe aprobado sin la seccion Regla 4D: avisa y cierra igualmente', async () => {
  const avisos = await avisos4D(VEREDICTO_APROBADO);
  assert.equal(avisos.length, 1, avisos.join('\n'));
  assert.match(avisos[0] as string, /informe-revision-1\.md no la tiene/);
});

test('informe aprobado con la Regla 4D completa: sin aviso', async () => {
  assert.deepEqual(await avisos4D(VEREDICTO_APROBADO + REGLA_4D), []);
});
