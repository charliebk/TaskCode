/**
 * TASK-130: doctor propone abrir una tarea de poda de tests (con el comando ya
 * escrito) por crecimiento de la suite o tras N tareas terminadas desde la
 * ultima poda; y la skill describe el procedimiento. Directorio temporal real
 * con tareas terminadas; sin Git (doctor solo lee tareas/ aqui).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { comprobarPodaTests, COMANDO_NUEVA_PODA } from '../../src/commands/doctor.js';
import { ConfigError, parsearConfig } from '../../src/core/config.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { aviso } from '../../src/core/doctor.js';
import { sampleTask } from '../helpers/finish-fixtures.js';

async function conTerminadas(
  tareas: readonly { id: string; etiquetas?: string[] }[],
  fn: (tareasRoot: string) => void
): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'poda-tests-'));
  try {
    const tareasRoot = path.join(raiz, 'tareas');
    for (const t of tareas) {
      const task = sampleTask({ id: t.id, estado: 'terminada', etiquetas: t.etiquetas ?? [] });
      await mkdir(path.join(tareasRoot, '04-terminadas', t.id), { recursive: true });
      await writeFile(path.join(tareasRoot, '04-terminadas', t.id, 'tarea.md'), serializeTareaFile(task, '## Objetivo\nx\n'), 'utf8');
    }
    fn(tareasRoot);
  } finally {
    await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
  }
}

const ids = (desde: number, n: number) => Array.from({ length: n }, (_, i) => ({ id: `TASK-${String(desde + i).padStart(3, '0')}` }));

test('doctor (TASK-130): propone la poda tras mas de N tareas desde la ultima, con el taskctl new escrito; si no, ok', async () => {
  const cfg = parsearConfig('tareas_entre_podas: 3\n', 'c');
  // Sin ninguna poda, cuentan todas: 4 > 3.
  await conTerminadas(ids(1, 4), (tareasRoot) => {
    const [c] = comprobarPodaTests('.', tareasRoot, cfg, []);
    assert.equal(c?.nivel, 'aviso');
    assert.match(c?.mensaje ?? '', /4 tareas terminadas sin ninguna poda \(tareas_entre_podas: 3\)/);
    assert.equal(c?.arreglo, `Abre la tarea con: ${COMANDO_NUEVA_PODA}`);
    assert.match(COMANDO_NUEVA_PODA, /^taskctl new --titulo "Poda de tests redundantes" --tipo feature --etiquetas poda,tests/);
  });
  // Con una poda en TASK-003, solo cuentan las posteriores: 2 de 3, ok.
  await conTerminadas([...ids(1, 2), { id: 'TASK-003', etiquetas: ['poda', 'tests'] }, ...ids(4, 2)], (tareasRoot) => {
    const [c] = comprobarPodaTests('.', tareasRoot, cfg, []);
    assert.equal(c?.nivel, 'ok');
    assert.match(c?.mensaje ?? '', /^2 de 3 tareas terminadas desde la ultima poda/);
  });
  // MEN-1 (revision): exactamente N tareas no avisa («mas de N»).
  await conTerminadas(ids(1, 3), (tareasRoot) => {
    const [c] = comprobarPodaTests('.', tareasRoot, cfg, []);
    assert.equal(c?.nivel, 'ok');
    assert.match(c?.mensaje ?? '', /^3 de 3 tareas terminadas desde la ultima poda/);
  });
  // Sin tareas terminadas, nada.
  await conTerminadas([], (tareasRoot) => assert.deepEqual(comprobarPodaTests('.', tareasRoot, cfg, []), []));
});

test('doctor (TASK-130): el aviso de crecimiento de la suite tambien propone la poda, y la clave se valida', async () => {
  const cfg = parsearConfig('', 'c');
  assert.equal(cfg.tareas_entre_podas, 30);
  await conTerminadas(ids(1, 2), (tareasRoot) => {
    const [c] = comprobarPodaTests('.', tareasRoot, cfg, [aviso('crecimiento-suite', 'crecio', 'poda')]);
    assert.equal(c?.nivel, 'aviso');
    assert.match(c?.mensaje ?? '', /la suite crecio mas del umbral/);
  });
  for (const v of ['0', '-1', '2.5', 'muchas']) {
    assert.throws(() => parsearConfig(`tareas_entre_podas: ${v}\n`, 'c'), ConfigError, v);
  }
});

test('guia (TASK-130): la skill task-workflow describe localizar, fusionar, borrar y que la cobertura no baje', async () => {
  const raiz = path.join(import.meta.dirname, '..', '..', '..');
  const guia = await readFile(path.join(raiz, 'skills', 'task-workflow', 'poda-tests.md'), 'utf8');
  assert.match(guia, /## 1\. Localizar candidatos[\s\S]*## 2\. Fusionar o borrar[\s\S]*## 3\. La cobertura no baja/);
  assert.match(guia, /tareas_entre_podas/);
  assert.match(guia, /experimental-test-coverage/);
  assert.match(await readFile(path.join(raiz, 'skills', 'task-workflow', 'tests-pesados.md'), 'utf8'), /poda-tests\.md/);
});
