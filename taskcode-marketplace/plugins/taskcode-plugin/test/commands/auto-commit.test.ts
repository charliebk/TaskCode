/**
 * Auto-commit cableado en los comandos (TASK-030, item C2, paso 5 de
 * la seccion 8.3). Repos Git temporales reales, los scripts de
 * scripts/gitflow/ tal cual estan en el repo, y evidencia leida de Git
 * (`git show --stat`, `git status --porcelain`, `git branch
 * --show-current`) en vez de la palabra del comando.
 *
 * SOBRE "trabajo de la persona en el arbol": el plan de TASK-030 decia
 * que en start/review/finish puede haberlo porque esos tres no aplican
 * `ensureBaseBranchReady`. Resulto ser solo media verdad, y conviene
 * dejarlo escrito: los tres NO aplican el guard de la 8.3 pero SI
 * llaman a `isWorkspaceClean` por su cuenta y abortan con el arbol
 * sucio, asi que al empezar el comando el arbol esta limpio en los
 * ocho casos.
 *
 * El riesgo real es otro, y es el que se reproduce aqui: entre esa
 * comprobacion y el commit, taskctl ejecuta scripts de Git-Flow que
 * pueden dejar ficheros en el arbol (hooks del repo), y sobre todo
 * puede haber OTRO proceso escribiendo — que en este proyecto es el
 * caso normal, no el exotico: varios agentes trabajan en paralelo
 * sobre la misma copia de trabajo. Un `git add -A` en ese momento se
 * lleva por delante trabajo ajeno. Los hooks de estos tests son la
 * forma determinista de colocar ese fichero ajeno exactamente en la
 * ventana en la que el commit automatico ocurre.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile } from '../../src/fs/task-store.js';
import { runPlanCommand } from '../../src/commands/plan.js';
import { runApproveCommand } from '../../src/commands/approve.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { runImportCommand } from '../../src/commands/import.js';
import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
import { BaseBranchGuardError } from '../../src/fs/git.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/commands -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-910',
    titulo: 'Tarea de prueba del auto-commit',
    tipo: 'feature',
    sprint: 3,
    etiquetas: ['cli'],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-910-auto-commit',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-07',
    actualizado: '2026-09-07',
    dependencias: [],
    ...overrides,
  };
}

async function withTempRepo(
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-c2-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await mkdir(path.join(repoRoot, 'src'), { recursive: true });
    await writeFile(path.join(repoRoot, 'src', 'algo.ts'), 'export const x = 1;\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/**
 * Instala un hook que ensucia `src/algo.ts` — es decir, coloca trabajo
 * AJENO a taskctl en el arbol justo en la ventana entre la
 * comprobacion de workspace limpio y el commit automatico.
 */
async function hookQueEnsucia(repoRoot: string, nombre: string): Promise<void> {
  const hook = path.join(repoRoot, '.git', 'hooks', nombre);
  await writeFile(
    hook,
    '#!/bin/sh\nprintf "// trabajo a medias de la persona\\n" >> src/algo.ts\n',
    'utf8'
  );
  await chmod(hook, 0o755);
}

/** Assert central del item: el commit de taskctl no toca lo ajeno. */
function assertNoSeLlevaTrabajoAjeno(repoRoot: string): void {
  const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
  assert.doesNotMatch(stat, /algo\.ts/, `el commit automatico se llevo src/algo.ts:\n${stat}`);
  assert.match(
    git(['status', '--porcelain'], repoRoot),
    /^ M src\/algo\.ts$/m,
    'src/algo.ts deberia seguir sucio en el arbol'
  );
}

// ─── plan / approve ────────────────────────────────────────────────────────

test('taskctl plan: commitea el movimiento a 01-en-diseno y el scaffold del plan, y deja tareas/ limpio', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar.\n');
    commitAll(repoRoot, 'chore(TASK-910): tarea creada');

    const r = await runPlanCommand(tareasRoot, ['TASK-910'], '2026-09-07', { repoCwd: repoRoot });

    assert.equal(r.autoCommit.commiteado, true);
    assert.equal(git(['log', '--format=%s', '-1'], repoRoot).trim(), 'chore(TASK-910): tarea en diseno');
    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
    assert.match(stat, /01-en-diseno/);
    assert.match(stat, /plan-final\.md/);
    // Ni rastro de la carpeta vieja: el movimiento entro entero.
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('taskctl approve: commitea el tarea.md aprobado con el mensaje del repo', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '## Objetivo\nX.\n');
    await mkdir(path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion'), {
      recursive: true,
    });
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion', 'plan-final.md'),
      '# Plan redactado\n',
      'utf8'
    );
    commitAll(repoRoot, 'docs(TASK-910): plan final');

    const r = await runApproveCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
      repoCwd: repoRoot,
    });

    assert.equal(r.autoCommit.commiteado, true);
    assert.deepEqual(r.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-910/tarea.md']);
    assert.equal(git(['log', '--format=%s', '-1'], repoRoot).trim(), 'chore(TASK-910): plan aprobado');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('taskctl approve dos veces seguidas: la segunda no crea un commit vacio', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
    await mkdir(path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion'), {
      recursive: true,
    });
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion', 'plan-final.md'),
      '# Plan\n',
      'utf8'
    );
    commitAll(repoRoot, 'docs(TASK-910): plan final');

    await runApproveCommand(tareasRoot, ['TASK-910'], '2026-09-07', { repoCwd: repoRoot });
    const tras1 = git(['rev-parse', 'HEAD'], repoRoot).trim();
    const r2 = await runApproveCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
      repoCwd: repoRoot,
    });

    assert.equal(r2.autoCommit.commiteado, false);
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), tras1);
  });
});

// ─── start: EL test del item ───────────────────────────────────────────────

test('taskctl start: commitea SOLO la tarea; el trabajo ajeno del arbol no entra y sigue sucio', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ estado: 'en-diseno', plan_aprobado: true }),
      '## Objetivo\nProbar start.\n'
    );
    commitAll(repoRoot, 'chore(TASK-910): plan aprobado');
    // create-feature.sh hace "git checkout -b": el hook dispara justo
    // despues, con la tarea ya escrita y el commit todavia por hacer.
    await hookQueEnsucia(repoRoot, 'post-checkout');

    const r = await runStartCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(r.autoCommit.commiteado, true);
    assert.equal(r.autoCommit.rama, 'feature/task-910-auto-commit');
    assert.equal(
      git(['log', '--format=%s', '-1'], repoRoot).trim(),
      'chore(TASK-910): tarea en curso'
    );
    assert.match(git(['show', '--stat', '--format=', 'HEAD'], repoRoot), /02-en-curso/);
    assertNoSeLlevaTrabajoAjeno(repoRoot);
  });
});

// ─── review ────────────────────────────────────────────────────────────────

test('taskctl review: commitea revision/ sin arrastrar el trabajo ajeno que dejo el merge', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ estado: 'en-curso', plan_aprobado: true });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar review.\n');
    commitAll(repoRoot, 'feat(TASK-910): trabajo');

    // develop avanza, para que el update de Git-Flow haga un merge de
    // verdad (y dispare post-merge).
    git(['checkout', '-q', 'develop'], repoRoot);
    await writeFile(path.join(repoRoot, 'otro.txt'), 'algo\n', 'utf8');
    commitAll(repoRoot, 'chore: avance en develop');
    git(['checkout', '-q', task.rama], repoRoot);
    await hookQueEnsucia(repoRoot, 'post-merge');

    const r = await runReviewCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(r.autoCommit.commiteado, true);
    assert.equal(
      git(['log', '--format=%s', '-1'], repoRoot).trim(),
      'chore(TASK-910): peticion de revision ronda 1'
    );
    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
    assert.match(stat, /peticion-revision-1\.md/);
    assert.match(stat, /informe-revision-1\.md/);
    assertNoSeLlevaTrabajoAjeno(repoRoot);
  });
});

// ─── finish ────────────────────────────────────────────────────────────────

test('taskctl finish: commitea sobre DEVELOP la tarea y los tres artefactos de cierre', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(
      path.join(revisionDir, 'informe-revision-1.md'),
      '# Informe\n\n- Veredicto: aprobada (sin hallazgos)\n',
      'utf8'
    );
    commitAll(repoRoot, 'feat(TASK-910): trabajo revisado');

    const r = await runFinishCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(r.autoCommit.commiteado, true);
    // Fijado a proposito: finish termina y commitea en develop, no en
    // la rama de la tarea (cuando escribe, el merge ya esta consumado).
    assert.equal(r.autoCommit.rama, 'develop');
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    assert.equal(
      git(['log', '--format=%s', '-1', 'develop'], repoRoot).trim(),
      'chore(TASK-910): tarea terminada y artefactos de cierre'
    );
    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
    for (const esperado of [/CHANGELOG\.md/, /INDEX\.md/, /BOARD\.md/, /04-terminadas/]) {
      assert.match(stat, esperado);
    }
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

// ─── el fallo de HALLAZGOS.md que esto cierra ──────────────────────────────

test('taskctl import dos veces seguidas SIN commitear en medio: funciona (antes abortaba por workspace sucio)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // El fichero a importar vive FUERA del repo (CLAUDE.md: si no,
    // ensucia el workspace y el guard de la 8.3 aborta el propio import).
    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-c2-import-'));
    try {
      const lista1 = path.join(fuera, 'sprint-a.md');
      const lista2 = path.join(fuera, 'sprint-b.md');
      await writeFile(lista1, '### Primera tarea importada\n- Que funcione\n', 'utf8');
      await writeFile(lista2, '### Segunda tarea importada\n- Que tambien funcione\n', 'utf8');

      const r1 = await runImportCommand(tareasRoot, [lista1], '2026-09-07', { repoCwd: repoRoot });
      assert.equal(r1.creadas.length, 1);
      // El propio import ya ha commiteado lo que creo: el workspace
      // queda limpio, que es la condicion que el segundo import
      // necesita para no chocar con el guard de la 8.3.
      assert.equal(r1.autoCommit.commiteado, true);
      assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');

      // La trampa que cierra este item (HALLAZGOS.md): antes de C2, el
      // segundo import abortaba con BaseBranchGuardError por un
      // workspace que habia ensuciado el PRIMER import. Ahora pasa sin
      // tocar nada a mano. Si alguien rompe el auto-commit de import,
      // esta llamada vuelve a lanzar y el test se cae.
      const r2 = await runImportCommand(tareasRoot, [lista2], '2026-09-07', { repoCwd: repoRoot });
      assert.equal(r2.creadas.length, 1);
      assert.notEqual(r2.creadas[0]?.id, r1.creadas[0]?.id);
      assert.equal(r2.autoCommit.commiteado, true);
      // Dos commits distintos, uno por import: no se acumulan ni se
      // pisan.
      assert.notEqual(r1.autoCommit.commit, r2.autoCommit.commit);
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });
});

// ─── --push extremo a extremo ──────────────────────────────────────────────

test('taskctl plan --push: con un origin bare real la rama llega; el flag va delante o detras del ID', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const bare = await mkdtemp(path.join(tmpdir(), 'taskctl-c2-origin-'));
    try {
      git(['init', '-q', '--bare', '-b', 'main', '.'], bare);
      git(['remote', 'add', 'origin', bare], repoRoot);
      git(['push', '-q', 'origin', 'develop'], repoRoot);

      await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nX.\n');
      commitAll(repoRoot, 'chore(TASK-910): tarea creada');

      // --push DELANTE del ID: parseArgs se lo habria comido como valor
      // del flag y el comando habria dicho "falta el ID".
      const r = await runPlanCommand(tareasRoot, ['--push', 'TASK-910'], '2026-09-07', {
        repoCwd: repoRoot,
      });

      assert.equal(r.id, 'TASK-910');
      assert.equal(r.autoCommit.push, 'empujado');
      assert.equal(
        git(['log', '--format=%s', '-1', 'develop'], bare).trim(),
        'chore(TASK-910): tarea en diseno'
      );
    } finally {
      await rm(bare, { recursive: true, force: true });
    }
  });
});

test('taskctl plan --push sin remoto: avisa, no lanza y sale con la tarea commiteada en local', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'chore(TASK-910): tarea creada');

    const r = await runPlanCommand(tareasRoot, ['TASK-910', '--push'], '2026-09-07', {
      repoCwd: repoRoot,
    });

    assert.equal(r.autoCommit.commiteado, true);
    assert.equal(r.autoCommit.push, 'sin-remoto');
    assert.equal(r.autoCommit.avisos.length, 1);
  });
});
