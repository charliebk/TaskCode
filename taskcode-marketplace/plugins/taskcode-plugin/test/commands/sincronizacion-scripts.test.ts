/**
 * Sincronizacion de ficheros derivados (TASK-033, version 0.1.1).
 * Repos Git temporales reales, los scripts de Git-Flow del repo tal
 * cual, y un script de sincronizacion de verdad (`node`) que regenera
 * `docs/PLAN.md` leyendo `tareas/` — la misma forma que el script del
 * proyecto que destapo el problema.
 *
 * El test que manda es el primero: encadenar approve -> start -> review
 * -> finish SIN un solo commit manual en medio, con el derivado dentro
 * del commit de cada transicion y `git status` vacio despues de cada
 * una. Antes de 0.1.1 hacia falta un commit a mano tras cada paso, y el
 * arreglo con un hook de pre-commit dejaba el indice en `MM`.
 */
// Parte de los tests de sincronizacion (ver test/helpers/sincronizacion-fixtures.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile } from '../../src/fs/task-store.js';
import { runApproveCommand } from '../../src/commands/approve.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
import type { Task } from '../../src/core/task.js';

import {
  HERE,
  PAQUETE,
  SCRIPTS_DIR,
  BIN,
  git,
  commitAll,
  porcelain,
  ficherosDeHead,
  sampleTask,
  SCRIPT_SYNC,
  CONFIG_SYNC,
  withRepoSincronizado,
  planEnDisco,
  tocarTarea,
  reescribirScript,
  reescribirScriptSinCommitear,
} from '../helpers/sincronizacion-fixtures.js';

test('sincronizacion (b): un script que no termina se corta por timeout y no cuelga el comando', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await reescribirScript(repoRoot, 'setTimeout(() => {}, 60000);\n');
    const dir = await tocarTarea(tareasRoot);
    const t0 = Date.now();
    const r = autoCommit({
      cwd: repoRoot,
      rutas: [dir],
      mensaje: mensajeChore('TASK-920', 'x'),
      sincronizacion: { timeoutMs: 1500 },
    });
    assert.ok(Date.now() - t0 < 30000, 'el timeout no corto el script');
    assert.equal(r.sincronizacion.estado, 'fallida');
    assert.equal(r.commiteado, true);
    assert.match(r.avisos.join('\n'), /no termino en 2 s/);
  });
});

test('sincronizacion (b): un script que lee stdin recibe EOF, no se queda esperando', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await reescribirScript(
      repoRoot,
      "process.stdin.on('data', () => {});\nprocess.stdin.on('end', () => process.exit(7));\n"
    );
    const dir = await tocarTarea(tareasRoot);
    const r = autoCommit({
      cwd: repoRoot,
      rutas: [dir],
      mensaje: mensajeChore('TASK-920', 'x'),
      sincronizacion: { timeoutMs: 20000 },
    });
    assert.equal(r.sincronizacion.estado, 'fallida');
    assert.match(r.avisos.join('\n'), /salio con codigo 7/);
  });
});

test('sincronizacion (c): un script que toca ficheros no declarados los nombra y no los commitea; el derivado si entra', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await reescribirScript(
      repoRoot,
      SCRIPT_SYNC + "writeFileSync('README.md', 'tocado por el script\\n');\n"
    );
    const dir = await tocarTarea(tareasRoot);
    // Un cambio de estado de verdad, para que el derivado cambie.
    const tareaMd = path.join(dir, 'tarea.md');
    await writeFile(
      tareaMd,
      (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
    );

    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
    const enCommit = ficherosDeHead(repoRoot);
    assert.ok(enCommit.includes('docs/PLAN.md'), 'el derivado declarado deberia entrar');
    assert.ok(!enCommit.includes('README.md'), 'se commiteo un fichero no declarado');
    // porcelain() recorta, asi que la primera linea pierde su espacio inicial.
    assert.match(porcelain(repoRoot), /^ ?M README\.md$/m, 'el fichero ajeno no se debe tocar');
    assert.equal(
      await readFile(path.join(repoRoot, 'README.md'), 'utf8'),
      'tocado por el script\n',
      'el fichero ajeno no se debe restaurar ni borrar'
    );
    assert.match(r.avisos.join('\n'), /no estan en rutas_sincronizacion: README\.md/);
  });
});

test('sincronizacion (c): detecta la reescritura de un fichero que YA estaba sucio (el porcelain no cambia, el contenido si)', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await writeFile(path.join(repoRoot, 'README.md'), 'trabajo de la persona\n', 'utf8');
    await reescribirScriptSinCommitear(
      repoRoot,
      SCRIPT_SYNC + "writeFileSync('README.md', 'pisado por el script\\n');\n"
    );
    const dir = await tocarTarea(tareasRoot);
    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
    assert.equal(r.sincronizacion.estado, 'rutas-ajenas');
    assert.match(r.avisos.join('\n'), /README\.md/);
  });
});
