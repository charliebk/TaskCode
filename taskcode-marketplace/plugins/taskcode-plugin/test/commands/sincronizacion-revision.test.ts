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

// ─── Revision ronda 1: rutas que Git no puede commitear ────────────────────

test('sincronizacion (revision IMP-1): una ruta declarada en .gitignore no aborta la transicion; queda fallida y el arbol limpio', async () => {
  await withRepoSincronizado(
    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/GEN.md]\n',
    async (repoRoot, tareasRoot) => {
      await writeFile(path.join(repoRoot, '.gitignore'), 'docs/GEN.md\n', 'utf8');
      await reescribirScript(
        repoRoot,
        "import { writeFileSync } from 'node:fs';\nwriteFileSync('docs/GEN.md', 'x\\n');\n"
      );
      const dir = await tocarTarea(tareasRoot);
      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
      assert.equal(r.sincronizacion.estado, 'fallida');
      assert.equal(r.commiteado, true, 'la tarea tiene que commitearse igual');
      assert.match(r.avisos.join('\n'), /esta en \.gitignore/);
      assert.equal(porcelain(repoRoot), '');
    }
  );
});

test('sincronizacion (revision IMP-1): una ruta declarada con otras mayusculas que el fichero real queda fallida y nombra el nombre real', async () => {
  await withRepoSincronizado(
    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/plan.md]\n',
    async (repoRoot, tareasRoot) => {
      const dir = await tocarTarea(tareasRoot);
      const tareaMd = path.join(dir, 'tarea.md');
      await writeFile(
        tareaMd,
        (await readFile(tareaMd, 'utf8')).replace('plan_aprobado: false', 'plan_aprobado: true')
      );
      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
      assert.equal(r.sincronizacion.estado, 'fallida');
      assert.equal(r.commiteado, true);
      assert.match(r.avisos.join('\n'), /se llama docs\/PLAN\.md/);
      assert.equal(porcelain(repoRoot), '', 'el derivado se tenia que restaurar');
    }
  );
});

test('sincronizacion (revision MEN-2): un script que sale con 124 por su cuenta no se describe como timeout', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    await reescribirScript(repoRoot, 'process.exit(124);\n');
    const dir = await tocarTarea(tareasRoot);
    const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
    assert.equal(r.sincronizacion.estado, 'fallida');
    const aviso = r.avisos.join('\n');
    assert.match(aviso, /salio con codigo 124/);
    assert.doesNotMatch(aviso, /no termino en/);
  });
});

test('sincronizacion (revision MEN-3): el timeout mata tambien al nieto; deja de escribir despues del corte', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    // El nieto escribe fuera del repo: asi no cuenta como ruta ajena y
    // lo unico que mide el test es si sigue vivo.
    const testigo = path.join(path.dirname(repoRoot), `${path.basename(repoRoot)}-nieto.txt`);
    await reescribirScript(
      repoRoot,
      "import { spawn } from 'node:child_process';\n" +
        `const testigo = ${JSON.stringify(testigo)};\n` +
        "spawn(process.execPath, ['-e', \"const fs = require('fs'); fs.appendFileSync(process.argv[1], 'x'); setInterval(() => fs.appendFileSync(process.argv[1], 'x'), 50)\", testigo], { stdio: 'ignore' });\n" +
        'setTimeout(() => {}, 60000);\n'
    );
    const dir = await tocarTarea(tareasRoot);
    try {
      const r = autoCommit({
        cwd: repoRoot,
        rutas: [dir],
        mensaje: mensajeChore('TASK-920', 'x'),
        sincronizacion: { timeoutMs: 8000 },
      });
      assert.equal(r.sincronizacion.estado, 'fallida');
      await new Promise((ok) => setTimeout(ok, 500));
      const tras = (await readFile(testigo, 'utf8')).length;
      await new Promise((ok) => setTimeout(ok, 1000));
      assert.equal((await readFile(testigo, 'utf8')).length, tras, 'el nieto sigue vivo');
    } finally {
      await rm(testigo, { force: true });
    }
  });
});

test('sincronizacion (revision 2, MENOR): el chequeo (a) ve trabajo sin commitear aunque la ruta declarada tenga otras mayusculas', async () => {
  await withRepoSincronizado(
    'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/plan.md]\n',
    async (repoRoot, tareasRoot) => {
      await writeFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'edicion a mano\n', 'utf8');
      const dir = await tocarTarea(tareasRoot);
      const r = autoCommit({ cwd: repoRoot, rutas: [dir], mensaje: mensajeChore('TASK-920', 'x') });
      assert.equal(r.sincronizacion.estado, 'omitida-rutas-con-cambios');
      assert.equal(await planEnDisco(repoRoot), 'edicion a mano', 'se piso el trabajo de la persona');
    }
  );
});

// ─── finish: el caso sin retorno ───────────────────────────────────────────

test('sincronizacion en finish: si el script falla tras el merge, la tarea queda cerrada y commiteada en develop y el arbol limpio', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot, tareasRoot) => {
    const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await mkdir(path.join(tareasRoot, '03-en-revision'), { recursive: true });
    git(['mv', 'tareas/01-en-diseno/TASK-920', 'tareas/03-en-revision/TASK-920'], repoRoot);
    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(
      path.join(revisionDir, 'informe-revision-1.md'),
      '# Informe\n\n- Veredicto: aprobada\n',
      'utf8'
    );
    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), 'process.exit(1);\n', 'utf8');
    commitAll(repoRoot, 'feat(TASK-920): trabajo revisado');
    const planAntes = await planEnDisco(repoRoot);

    const r = await runFinishCommand(tareasRoot, ['TASK-920'], '2026-10-03', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(r.autoCommit.sincronizacion.estado, 'fallida');
    assert.equal(r.autoCommit.commiteado, true);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    assert.ok(existsSync(path.join(tareasRoot, '04-terminadas', 'TASK-920', 'tarea.md')));
    assert.equal(await planEnDisco(repoRoot), planAntes);
    assert.equal(porcelain(repoRoot), '');
  });
});

// ─── El codigo de salida del CLI real ──────────────────────────────────────

test('taskctl (binario real): sale con 3 cuando la transicion se hizo pero la sincronizacion no, y con 0 cuando se aplico', async () => {
  await withRepoSincronizado(CONFIG_SYNC, async (repoRoot) => {
    const ok = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.equal(ok.status, 0, ok.stderr);

    await reescribirScript(repoRoot, 'process.exit(1);\n');
    const tareaMd = path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-920', 'tarea.md');
    const contenido = await readFile(tareaMd, 'utf8');
    await writeFile(tareaMd, contenido.replace('plan_aprobado: true', 'plan_aprobado: false'));
    commitAll(repoRoot, 'chore: desaprobar para reintentar');

    const mal = spawnSync('node', [BIN, 'approve', 'TASK-920'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.equal(mal.status, CODIGO_SINCRONIZACION_NO_APLICADA, mal.stderr);
    assert.match(mal.stderr, /\[AVISO\] La sincronizacion "node scripts\/sync\.mjs" salio con codigo 1/);
    assert.match(mal.stdout, /aprobada/);
    assert.equal(porcelain(repoRoot), '');
  });
});
