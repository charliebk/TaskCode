/**
 * `rama_base` de punta a punta (TASK-045, D1 de la auditoria). Hasta
 * esta tarea la clave solo llegaba a `approve`: `start`, `review` y
 * `finish` llamaban a los scripts de Git-Flow sin `--develop`, y
 * `finish.ts` fijaba "develop", asi que con `rama_base: dev` el ciclo
 * moria en `start` con «develop no existe».
 *
 * Repos Git temporales reales y los scripts de scripts/gitflow/ tal
 * cual. En ninguno existe nunca una rama `develop`: si algun comando
 * volviera a caer en el literal, el script fallaria o la crearia, y las
 * dos cosas se ven aqui.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runNewCommand } from '../../src/commands/new.js';
import { runPlanCommand } from '../../src/commands/plan.js';
import { runApproveCommand } from '../../src/commands/approve.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { gitflowBaseArgs, resolveIntegrationBranch } from '../../src/fs/git.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/commands -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
const HOY = '2026-10-04';

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

function existeRama(rama: string, cwd: string): boolean {
  return (
    spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${rama}`], { cwd }).status ===
    0
  );
}

function esAncestro(a: string, b: string, cwd: string): boolean {
  return spawnSync('git', ['merge-base', '--is-ancestor', a, b], { cwd }).status === 0;
}

/**
 * Repo con `main` y `dev`, sin `develop`. El config se commitea en
 * main ANTES de crear dev, como en un repo real donde el config ya ha
 * llegado a la principal: asi lo ven tambien las ramas de hotfix, que
 * nacen de main.
 */
async function withRepoDev(
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-rama-base-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'rama_base: dev\n', 'utf8');
    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'dev'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

const PLAN_REDACTADO =
  '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt y comprobar que el ciclo cierra sobre dev.\n';

/** Lo que haria el revisor: informe con veredicto aprobado, commiteado. */
async function aprobarRevision(repoRoot: string, tareasRoot: string, id: string): Promise<void> {
  const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
  await writeFile(
    path.join(revisionDir, 'informe-revision-1.md'),
    `# Informe de revision — ${id} (ronda 1)\n\n- Veredicto: aprobada (sin hallazgos)\n`,
    'utf8'
  );
  commitAll(repoRoot, `chore(${id}): veredicto`);
}

test('gitflowBaseArgs: --develop con la rama base para feature/fix/release; nada para hotfix', async () => {
  await withRepoDev(async (repoRoot) => {
    assert.equal(resolveIntegrationBranch(repoRoot), 'dev');
    for (const tipo of ['feature', 'fix', 'release'] as const) {
      assert.deepEqual(gitflowBaseArgs(tipo, repoRoot), ['--develop', 'dev']);
    }
    // create-/update-hotfix.sh no conocen el flag: trabajan contra la principal.
    assert.deepEqual(gitflowBaseArgs('hotfix', repoRoot), []);
  });
});

test('rama_base: dev — new -> plan -> approve -> start -> review -> finish termina sobre dev y nunca crea develop', async () => {
  await withRepoDev(async (repoRoot, tareasRoot) => {
    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
    const creada = await runNewCommand(
      tareasRoot,
      [
        '--titulo',
        'Ciclo completo sobre dev',
        '--tipo',
        'feature',
        '--complejidad',
        'simple',
        '--objetivo',
        'Que el ciclo entero funcione con rama_base dev.',
        '--criterio',
        'El comando finish deja la tarea en 04-terminadas',
      ],
      HOY,
      { repoCwd: repoRoot }
    );
    const id = creada.id;

    await runPlanCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot });
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
      PLAN_REDACTADO,
      'utf8'
    );
    commitAll(repoRoot, `docs(${id}): plan final`);
    await runApproveCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot });

    const iniciada = await runStartCommand(tareasRoot, [id], HOY, deps);
    const leida = await readTareaFile(tareasRoot, id);
    const rama = (leida as NonNullable<typeof leida>).task.rama;
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
    // La rama de la tarea nace de dev.
    assert.ok(esAncestro('dev', rama, repoRoot), 'la rama de la tarea debe nacer de dev');
    assert.ok(iniciada.filePath.includes('02-en-curso'));

    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado por la tarea\n', 'utf8');
    commitAll(repoRoot, `feat(${id}): trabajo`);

    // Avanza dev mientras tanto: review tiene que traerla (update-feature.sh --develop dev).
    git(['checkout', '-q', 'dev'], repoRoot);
    await writeFile(path.join(repoRoot, 'otro.txt'), 'trabajo de otra persona\n', 'utf8');
    commitAll(repoRoot, 'feat: otro cambio en dev');
    git(['checkout', '-q', rama], repoRoot);

    const revisada = await runReviewCommand(tareasRoot, [id], HOY, deps);
    assert.equal(revisada.baseBranch, 'dev');
    assert.ok(esAncestro('dev', rama, repoRoot), 'review debe integrar dev en la rama de la tarea');
    await aprobarRevision(repoRoot, tareasRoot, id);

    const cerrada = await runFinishCommand(tareasRoot, [id], HOY, deps);

    assert.equal(cerrada.baseBranch, 'dev');
    assert.equal(cerrada.autoCommit.rama, 'dev');
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'dev');
    assert.ok(esAncestro(rama, 'dev', repoRoot), 'la rama de la tarea debe quedar integrada en dev');
    const final = await readTareaFile(tareasRoot, id);
    assert.equal(final?.task.estado, 'terminada');
    assert.ok(final?.filePath.includes('04-terminadas'));
    assert.equal(existeRama('develop', repoRoot), false, 'ningun paso debe crear develop');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

/** Tarea ya aprobada en dev, commiteada, lista para start. */
async function tareaAprobada(tareasRoot: string, repoRoot: string, task: Task): Promise<void> {
  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el backmerge.\n');
  commitAll(repoRoot, `chore(${task.id}): plan aprobado`);
}

function tareaDeTipo(id: string, tipo: Task['tipo'], rama: string): Task {
  return {
    id,
    titulo: `Backmerge ${tipo}`,
    tipo,
    sprint: 0,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-diseno',
    plan_aprobado: true,
    rama,
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: HOY,
    actualizado: HOY,
    dependencias: [],
  };
}

for (const caso of [
  { id: 'TASK-951', tipo: 'release' as const, rama: 'release/task-951-cierre' },
  { id: 'TASK-952', tipo: 'hotfix' as const, rama: 'hotfix/task-952-urgente' },
]) {
  test(`rama_base: dev — ${caso.tipo}: start -> review -> finish mergea a main y hace el backmerge a dev`, async () => {
    await withRepoDev(async (repoRoot, tareasRoot) => {
      const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
      const task = tareaDeTipo(caso.id, caso.tipo, caso.rama);
      // El hotfix tiene que ver su tarea desde main, que es de donde nace.
      if (caso.tipo === 'hotfix') git(['checkout', '-q', 'main'], repoRoot);
      await tareaAprobada(tareasRoot, repoRoot, task);

      await runStartCommand(tareasRoot, [caso.id], HOY, deps);
      assert.equal(git(['branch', '--show-current'], repoRoot).trim(), caso.rama);
      await writeFile(path.join(repoRoot, `trabajo-${caso.id}.txt`), 'trabajo\n', 'utf8');
      commitAll(repoRoot, `fix(${caso.id}): trabajo`);
      await runReviewCommand(tareasRoot, [caso.id], HOY, deps);
      await aprobarRevision(repoRoot, tareasRoot, caso.id);

      const cerrada = await runFinishCommand(tareasRoot, [caso.id], HOY, deps);

      assert.equal(cerrada.mainBranch, 'main');
      assert.equal(cerrada.baseBranch, 'dev');
      assert.ok(esAncestro(caso.rama, 'main', repoRoot), 'integrada en main');
      assert.ok(esAncestro(caso.rama, 'dev', repoRoot), 'backmerge a dev');
      assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'dev');
      assert.equal(existeRama('develop', repoRoot), false, 'ningun paso debe crear develop');
      const final = await readTareaFile(tareasRoot, caso.id);
      assert.equal(final?.task.estado, 'terminada');
    });
  });
}

test('rama_base solo en dev: el finish de un hotfix (nacido de main, sin ese config) aborta diciendo que hacer, sin tocar nada (MEN-1 de la revision)', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-rama-base-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    // El config solo existe en dev: la rama del hotfix, nacida de main, no lo ve.
    git(['checkout', '-q', '-b', 'dev'], repoRoot);
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'rama_base: dev\n', 'utf8');
    commitAll(repoRoot, 'config');
    const tareasRoot = path.join(repoRoot, 'tareas');
    const task = {
      ...tareaDeTipo('TASK-953', 'hotfix', 'hotfix/task-953-urgente'),
      estado: 'en-revision' as const,
    };
    git(['checkout', '-q', '-b', task.rama, 'main'], repoRoot);
    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el aviso.\n');
    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), '- Veredicto: aprobada\n', 'utf8');
    commitAll(repoRoot, 'hotfix revisado');
    const antes = git(['rev-parse', 'HEAD', 'main', 'dev'], repoRoot);

    await assert.rejects(
      runFinishCommand(tareasRoot, [task.id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      /rama de integracion "develop" no existe.*rama_base/s
    );
    assert.equal(git(['rev-parse', 'HEAD', 'main', 'dev'], repoRoot), antes, 'no se ha tocado nada');
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), task.rama);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
