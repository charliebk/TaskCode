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

// ─── El test del item: el ciclo entero sin un commit manual ────────────────

test('sincronizacion: approve -> start -> review -> finish sin commits manuales; el derivado va en cada commit y el arbol queda limpio', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };

    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
    assert.equal(a.autoCommit.sincronizacion.estado, 'aplicada');
    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'approve: falta el derivado');
    assert.equal(await planEnDisco(repoRoot), 'TASK-920 01-en-diseno aprobado');
    assert.equal(porcelain(repoRoot), '', 'approve dejo el arbol sucio');

    const s = await runStartCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
    assert.equal(s.autoCommit.sincronizacion.estado, 'aplicada');
    assert.equal(s.autoCommit.rama, 'feature/task-920-sincronizacion');
    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'start: falta el derivado');
    assert.equal(await planEnDisco(repoRoot), 'TASK-920 02-en-curso aprobado');
    assert.equal(porcelain(repoRoot), '', 'start dejo el arbol sucio');

    await writeFile(path.join(repoRoot, 'README.md'), 'repo con trabajo\n', 'utf8');
    commitAll(repoRoot, 'feat(TASK-920): trabajo');

    const v = await runReviewCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
    assert.equal(v.autoCommit.sincronizacion.estado, 'aplicada');
    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'review: falta el derivado');
    assert.equal(await planEnDisco(repoRoot), 'TASK-920 03-en-revision aprobado');
    assert.equal(porcelain(repoRoot), '', 'review dejo el arbol sucio');

    const informe = path.join(
      tareasRoot,
      '03-en-revision',
      'TASK-920',
      'revision',
      'informe-revision-1.md'
    );
    await writeFile(informe, '# Informe\n\n- Veredicto: aprobada\n', 'utf8');
    commitAll(repoRoot, 'docs(TASK-920): informe de revision');

    const f = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', deps);
    assert.equal(f.autoCommit.sincronizacion.estado, 'aplicada');
    assert.equal(f.autoCommit.rama, 'develop');
    assert.ok(ficherosDeHead(repoRoot).includes('docs/PLAN.md'), 'finish: falta el derivado');
    assert.equal(await planEnDisco(repoRoot), 'TASK-920 04-terminadas aprobado');
    assert.equal(porcelain(repoRoot), '', 'finish dejo el arbol sucio');
    // Y lo que se commiteo en develop es lo que hay en disco.
    assert.equal(git(['show', 'HEAD:docs/PLAN.md'], repoRoot).trim(), await planEnDisco(repoRoot));
  });
});

test('sincronizacion: sin las claves, ni se ejecuta el script ni cambia el commit (comportamiento 0.1.0)', async () => {
  await withRepoSincronizado(null, async (repoRoot, tareasRoot) => {
    const antes = await planEnDisco(repoRoot);
    const a = await runApproveCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
      repoCwd: repoRoot,
    });
    assert.equal(a.autoCommit.sincronizacion.estado, 'no-configurada');
    assert.deepEqual(a.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-920/tarea.md']);
    assert.equal(await planEnDisco(repoRoot), antes, 'el script no deberia haberse ejecutado');
  });
});

test('sincronizacion (a): si la ruta declarada ya tenia cambios, no se ejecuta, no entra en el commit y el cambio de la persona sigue en el arbol', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await writeFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'edicion a mano\n', 'utf8');
    const dir = await tocarTarea(tareasRoot);

    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

    assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
    assert.equal(r.commiteado, true, 'la tarea se commitea igual');
    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
    assert.equal(await planEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
    assert.match(r.avisos.join('\n'), /No se ha ejecutado la sincronizacion: docs\/PLAN\.md/);
  });
});

test('sincronizacion (b): si el script falla tras escribir, el derivado vuelve a HEAD, la tarea se commitea y el arbol queda limpio', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    const enHead = await planEnDisco(repoRoot);
    await reescribirScript(
      repoRoot,
      "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/PLAN.md', 'a medias\\n');\n" +
        "console.error('se rompio a mitad');\nprocess.exit(4);\n"
    );
    const dir = await tocarTarea(tareasRoot);

    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });

    assert.equal(r.sincronizacion.estado, 'fallida');
    assert.equal(r.commiteado, true);
    assert.ok(!ficherosDeHead(repoRoot).includes('docs/PLAN.md'));
    assert.equal(await planEnDisco(repoRoot), enHead, 'el derivado a medias no se restauro');
    assert.equal(porcelain(repoRoot), '');
    const aviso = r.avisos.join('\n');
    assert.match(aviso, /salio con codigo 4: se rompio a mitad/);
    assert.match(aviso, /no repitas el comando de taskctl/);
  });
});

test('sincronizacion (b): un derivado que no existia en HEAD y el script deja a medias se borra', async () => {
  await withRepoSincronizado(
    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/NUEVO.md]\n',
    async (repoRoot, tareasRoot) => {
      await reescribirScript(
        repoRoot,
        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/NUEVO.md', 'x\\n');\nprocess.exit(1);\n"
      );
      const dir = await tocarTarea(tareasRoot);
      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
      assert.equal(r.sincronizacion.estado, 'fallida');
      assert.equal(existsSync(path.join(repoRoot, 'docs', 'NUEVO.md')), false);
      assert.equal(porcelain(repoRoot), '');
    }
  );
});
