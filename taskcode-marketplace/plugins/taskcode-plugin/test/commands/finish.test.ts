/**
 * Test de integracion real (no mocks) para taskctl finish (TASK-014):
 * repos Git temporales de verdad, los scripts merge-*.sh tal cual
 * estan en el repo, y evidencia leida de Git (merges, tags, ancestria)
 * en vez de fiarse de lo que devuelve el comando. Mismo espiritu que
 * review.test.ts (TASK-013).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-700',
    titulo: 'Tarea de prueba de finish',
    tipo: 'feature',
    sprint: 2,
    etiquetas: ['cli', 'gitflow'],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-revision',
    plan_aprobado: true,
    rama: 'feature/task-700-prueba-finish',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-05',
    actualizado: '2026-09-05',
    dependencias: [],
    ...overrides,
  };
}

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

/**
 * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
 * lo que el mismo escribe, asi que llamar a esto justo despues de un
 * comando puede no tener ya nada que registrar: `git commit` sale 1
 * con "nothing to commit" y el assert de `git()` lo daria por fallo
 * del test. Se commitea solo si queda algo — y que no quede es
 * exactamente la senal de que el auto-commit hizo su trabajo.
 */
function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', message], repoRoot);
}

async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-finish-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

const VEREDICTO_APROBADO = '- Veredicto: aprobada (revisada por el agente independiente)\n';

/**
 * Deja la tarea en-revision en su rama con el informe de la ronda 1
 * commiteado, como la habria dejado el ciclo start -> review + el
 * revisor volcando su veredicto. `base` es la rama de la que nace la
 * rama de trabajo (develop para feature/fix/release, main para hotfix).
 */
async function setupTaskEnRevision(
  repoRoot: string,
  tareasRoot: string,
  task: Task,
  opts: { base?: string; veredicto?: string; conCodex?: string } = {}
): Promise<void> {
  const base = opts.base ?? 'develop';
  git(['checkout', '-q', '-b', task.rama, base], repoRoot);
  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
  await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
  await mkdir(revisionDir, { recursive: true });
  await writeFile(
    path.join(revisionDir, 'informe-revision-1.md'),
    `# Informe de revision — ${task.id} (ronda 1)\n\n${opts.veredicto ?? VEREDICTO_APROBADO}`,
    'utf8'
  );
  if (opts.conCodex !== undefined) {
    await writeFile(
      path.join(revisionDir, 'informe-codex-1.md'),
      `# Informe Codex — ${task.id}\n\n${opts.conCodex}`,
      'utf8'
    );
  }
  commitAll(repoRoot, `feat(${task.id}): trabajo revisado`);
}

test('veredictoAprobado: fail-closed con PENDIENTE, cambios-solicitados o sin linea de veredicto', () => {
  assert.equal(veredictoAprobado('- Veredicto: aprobada\n'), true);
  assert.equal(veredictoAprobado('- Veredicto: APROBADA (sin hallazgos)\n'), true);
  assert.equal(veredictoAprobado('- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n'), false);
  assert.equal(veredictoAprobado('- Veredicto: cambios-solicitados\n'), false);
  assert.equal(veredictoAprobado('informe sin veredicto\n'), false);
  assert.equal(veredictoAprobado(''), false);
});

test('veredictoAprobado: NO es fail-open ante negaciones ni lineas multiples (hallazgo CRITICO de revision)', () => {
  // La negacion mas natural en espanol debe rechazar, no aprobar.
  assert.equal(veredictoAprobado('- Veredicto: no aprobada (faltan tests)\n'), false);
  assert.equal(veredictoAprobado('- Veredicto: NO aprobada\n'), false);
  assert.equal(veredictoAprobado('- Veredicto: rechazada (aprobada seria prematuro)\n'), false);
  // El veredicto del informe de TASK-013 (referencia real): la palabra
  // "independiente" no debe confundirse con "pendiente".
  assert.equal(
    veredictoAprobado('- Veredicto: aprobada (revisada por el agente independiente)\n'),
    true
  );
  // Varias lineas Veredicto: TODAS deben aprobar (placeholder de la
  // plantilla sin borrar => rechazo; aprobada + cambios => rechazo).
  assert.equal(
    veredictoAprobado('- Veredicto: PENDIENTE (...)\n\ntexto\n\n- Veredicto: aprobada\n'),
    false
  );
  assert.equal(
    veredictoAprobado('- Veredicto: aprobada\n\n- Veredicto: cambios-solicitados\n'),
    false
  );
});

test('taskctl finish (feature): merge a develop, tarea a 04-terminadas y CHANGELOG/INDEX/BOARD renderizados', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const result = await runFinishCommand(tareasRoot, ['TASK-700'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.baseBranch, 'develop');
    assert.equal(result.mainBranch, null);
    assert.match(result.filePath, /04-terminadas[/\\]TASK-700[/\\]tarea\.md$/);

    // Evidencia real de Git.
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    assert.match(git(['log', '--oneline'], repoRoot), /merge\(feature\): feature\/task-700-prueba-finish -> develop/);

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'terminada');
    assert.equal(read?.task.actualizado, '2026-09-07');
    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-700')));

    const changelog = await readFile(result.changelogPath, 'utf8');
    assert.match(changelog, /## Sin publicar/);
    assert.match(changelog, /- TASK-700 \(feature\) — Tarea de prueba de finish \(2026-09-07\)/);

    const index = await readFile(result.indexPath, 'utf8');
    assert.match(index, /- TASK-700 — Tarea de prueba de finish · etiquetas: cli, gitflow/);
    assert.match(index, /tareas\/04-terminadas\/TASK-700\//);

    const board = await readFile(result.boardPath, 'utf8');
    assert.match(board, /Generado automaticamente por taskctl finish el 2026-09-07/);
    assert.match(board, /TASK-700/);
  });
});

test('taskctl finish (fix): usa merge-fix-to-develop.sh', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-701', tipo: 'fix', rama: 'fix/task-701-prueba-fix' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    await runFinishCommand(tareasRoot, ['TASK-701'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.match(git(['log', '--oneline'], repoRoot), /merge\(fix\): fix\/task-701-prueba-fix -> develop/);
    const read = await readTareaFile(tareasRoot, 'TASK-701');
    assert.equal(read?.task.estado, 'terminada');
  });
});

test('taskctl finish (hotfix): merge a main con tag y backmerge real a develop', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-702', tipo: 'hotfix', rama: 'hotfix/task-702-urgente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });

    const result = await runFinishCommand(tareasRoot, ['TASK-702'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.mainBranch, 'main');
    // Merge a main + tag + backmerge, todo leido de Git.
    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\): hotfix\/task-702-urgente -> main/);
    assert.equal(git(['tag', '--list', 'task-702-urgente'], repoRoot).trim(), 'task-702-urgente');
    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');

    // La tarea quedo terminada en el working tree de develop.
    const read = await readTareaFile(tareasRoot, 'TASK-702');
    assert.equal(read?.task.estado, 'terminada');
  });
});

test('taskctl finish (release): merge a main con tag y backmerge real a develop', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-703', tipo: 'release', rama: 'release/task-703-cierre' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const result = await runFinishCommand(tareasRoot, ['TASK-703'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.mainBranch, 'main');
    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(release\): release\/task-703-cierre -> main/);
    assert.equal(git(['tag', '--list', 'task-703-cierre'], repoRoot).trim(), 'task-703-cierre');
    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
    const read = await readTareaFile(tareasRoot, 'TASK-703');
    assert.equal(read?.task.estado, 'terminada');
  });
});

test('taskctl finish: colision de IDs entre main y develop se detecta ANTES de mergear', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // develop ya tiene OTRO TASK-704 (titulo distinto), nacido de su
    // propio linaje.
    const otraTarea = sampleTask({
      id: 'TASK-704',
      titulo: 'Otra tarea distinta con el mismo numero',
      estado: 'planificada',
      rama: 'feature/task-704-otra',
    });
    await writeTareaFile(tareasRoot, otraTarea, '');
    commitAll(repoRoot, 'otra TASK-704 en develop');

    // El hotfix, nacido de main (que no ve tareas/ de develop),
    // recalculo el mismo ID para una tarea diferente.
    const task = sampleTask({ id: 'TASK-704', tipo: 'hotfix', rama: 'hotfix/task-704-urgente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-704'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match((e as Error).message, /colision de IDs/);
        assert.match((e as Error).message, /Renumera/);
        return true;
      }
    );

    // Nada se mergeo: main sigue sin el merge y no hay tag.
    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), task.rama);
    const read = await readTareaFile(tareasRoot, 'TASK-704');
    assert.equal(read?.task.estado, 'en-revision');
  });
});

test('taskctl finish (hotfix): tras un conflicto de backmerge resuelto a mano, el reintento cierra por el camino idempotente sin chocar con el tag (hallazgo IMPORTANTE de revision)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Conflicto real: el hotfix y develop tocan la misma linea.
    git(['checkout', '-q', 'main'], repoRoot);
    await writeFile(path.join(repoRoot, 'app.txt'), 'linea original\n', 'utf8');
    commitAll(repoRoot, 'app en main');
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--ff-only', 'main'], repoRoot);
    await writeFile(path.join(repoRoot, 'app.txt'), 'version de develop\n', 'utf8');
    commitAll(repoRoot, 'app cambiada en develop');

    const task = sampleTask({ id: 'TASK-712', tipo: 'hotfix', rama: 'hotfix/task-712-conflicto' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
    await writeFile(path.join(repoRoot, 'app.txt'), 'version del hotfix\n', 'utf8');
    commitAll(repoRoot, 'app cambiada en el hotfix');

    // Primer intento: merge a main + tag OK, backmerge en conflicto.
    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-712'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      FinishCommandError
    );
    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
    assert.equal(git(['tag', '--list', 'task-712-conflicto'], repoRoot).trim(), 'task-712-conflicto');

    // La persona resuelve el conflicto del backmerge a mano y comitea.
    await writeFile(path.join(repoRoot, 'app.txt'), 'version reconciliada\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '--no-edit'], repoRoot);

    // Reintento: NO se reejecuta el script (moriria en el tag
    // duplicado) — el camino idempotente cierra la tarea.
    const result = await runFinishCommand(tareasRoot, ['TASK-712'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.match(result.filePath, /04-terminadas[/\\]TASK-712/);
    const read = await readTareaFile(tareasRoot, 'TASK-712');
    assert.equal(read?.task.estado, 'terminada');
    // El tag sigue siendo uno (no hubo segundo intento de crearlo).
    assert.equal(git(['tag', '--list'], repoRoot).trim(), 'task-712-conflicto');
  });
});

test('taskctl finish (hotfix): mismo ID y MISMO titulo en linaje divergente tambien aborta antes de mergear (hallazgo IMPORTANTE de revision: add+add duplicaria la carpeta)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // develop tiene la "misma" tarea (mismo id y titulo) pero anadida
    // por su propio linaje, sin ancestro comun con la rama del hotfix.
    const copiaDevelop = sampleTask({
      id: 'TASK-713',
      estado: 'planificada',
      rama: 'hotfix/task-713-urgente',
    });
    await writeTareaFile(tareasRoot, copiaDevelop, '');
    commitAll(repoRoot, 'TASK-713 en develop');

    const task = sampleTask({ id: 'TASK-713', tipo: 'hotfix', rama: 'hotfix/task-713-urgente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-713'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match((e as Error).message, /linaje|ancestro comun|add\+add/);
        return true;
      }
    );
    // Nada mergeado: sin tag y main sin merge.
    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
  });
});

test('taskctl finish (feature): el caso normal — la tarea vive en develop en una carpeta anterior del ciclo — NO dispara la colision de linaje', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Flujo real del metodo: la tarea nace en develop (01-en-diseno)...
    const enDiseno = sampleTask({
      id: 'TASK-714',
      estado: 'en-diseno',
      rama: 'feature/task-714-normal',
    });
    await writeTareaFile(tareasRoot, enDiseno, '');
    commitAll(repoRoot, 'TASK-714 en diseno en develop');

    // ...y su rama (que SI comparte ese commit como ancestro) la mueve
    // por el ciclo hasta en-revision.
    const task = sampleTask({ id: 'TASK-714', estado: 'en-revision', rama: 'feature/task-714-normal' });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    git(['rm', '-r', '-q', 'tareas/01-en-diseno/TASK-714'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-714', 'revision');
    await mkdir(revisionDir, { recursive: true });
    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), VEREDICTO_APROBADO, 'utf8');
    commitAll(repoRoot, 'TASK-714 revisada en su rama');

    const result = await runFinishCommand(tareasRoot, ['TASK-714'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.match(result.filePath, /04-terminadas[/\\]TASK-714/);
    // Y sin duplicados en develop: solo la copia terminada.
    const read = await readTareaFile(tareasRoot, 'TASK-714');
    assert.equal(read?.task.estado, 'terminada');
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-714')));
    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-714')));
  });
});

test('taskctl finish: desde una rama que no ve la tarea, el mensaje dice cambiarse a la rama (no usar import) — hallazgo MENOR de revision', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // La tarea existe solo en su rama; nosotros estamos en develop.
    const task = sampleTask({ id: 'TASK-715', rama: 'feature/task-715-otra' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    git(['checkout', '-q', 'develop'], repoRoot);

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-715'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match((e as Error).message, /cambiate a esa rama/);
        assert.doesNotMatch((e as Error).message, /import/);
        return true;
      }
    );
  });
});

test('taskctl finish: un CHANGELOG artesanal sin "Sin publicar" recibe la seccion ARRIBA, no al final (hallazgo MENOR de revision)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeFile(
      path.join(repoRoot, 'CHANGELOG.md'),
      '# Historial\n\n## v1.2.0\n\n- cosa nueva\n\n## v1.1.0\n\n- cosa vieja\n',
      'utf8'
    );
    const task = sampleTask({ id: 'TASK-716', rama: 'feature/task-716-changelog' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    await runFinishCommand(tareasRoot, ['TASK-716'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
    assert.match(changelog, /TASK-716/);
    assert.ok(
      changelog.indexOf('## Sin publicar') < changelog.indexOf('## v1.2.0'),
      'la seccion nueva debe quedar por encima de las versiones viejas'
    );
    assert.match(changelog, /- cosa vieja/);
  });
});

test('taskctl finish: repetirlo sobre una tarea terminada dice que ya esta terminada, sin aconsejar taskctl review', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-717', rama: 'feature/task-717-doble' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await runFinishCommand(tareasRoot, ['TASK-717'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'cierre de TASK-717');

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-717'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /ya esta terminada/);
        assert.doesNotMatch((e as Error).message, /taskctl review/);
        return true;
      }
    );
  });
});

test('taskctl finish: rechaza sin revision aprobada (veredicto PENDIENTE), sin tocar Git', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-705', rama: 'feature/task-705-pendiente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, {
      veredicto: '- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n',
    });

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-705'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StateMachineError
    );

    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
    const read = await readTareaFile(tareasRoot, 'TASK-705');
    assert.equal(read?.task.estado, 'en-revision');
  });
});

test('taskctl finish: con revision_codex exige informe de Codex aprobado (rechaza sin el, pasa con el)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({
      id: 'TASK-706',
      rama: 'feature/task-706-codex',
      revision_codex: true,
    });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /revision_codex/);
        return true;
      }
    );

    // Con el informe de Codex aprobado (convencion de TASK-020), pasa.
    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-706', 'revision');
    await writeFile(
      path.join(revisionDir, 'informe-codex-1.md'),
      `# Informe Codex\n\n${VEREDICTO_APROBADO}`,
      'utf8'
    );
    commitAll(repoRoot, 'informe codex aprobado');

    const result = await runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.match(result.filePath, /04-terminadas/);
  });
});

test('taskctl finish: rechaza una tarea que no esta en-revision, con el comando requerido en el mensaje', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-707', estado: 'en-curso', rama: 'feature/task-707-curso' });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    commitAll(repoRoot, 'tarea en curso');

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-707'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /taskctl review/);
        return true;
      }
    );
  });
});

test('taskctl finish: rechaza con el workspace sucio, sin invocar el script', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-708', rama: 'feature/task-708-sucio' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-708'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      FinishCommandError
    );

    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
  });
});

test('taskctl finish: si el script falla, la tarea no se mueve ni se renderiza nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-709', rama: 'feature/task-709-roto' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-finish-'));
    await writeFile(
      path.join(brokenScriptsDir, 'merge-feature-to-develop.sh'),
      '#!/usr/bin/env bash\nexit 7\n',
      'utf8'
    );

    await assert.rejects(
      () =>
        runFinishCommand(tareasRoot, ['TASK-709'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: brokenScriptsDir,
        }),
      FinishCommandError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-709');
    assert.equal(read?.task.estado, 'en-revision');
    await assert.rejects(() => stat(path.join(repoRoot, 'CHANGELOG.md')));
    await assert.rejects(() => stat(path.join(repoRoot, 'docs', 'BOARD.md')));
    await rm(brokenScriptsDir, { recursive: true, force: true });
  });
});

test('taskctl finish: dos tareas terminadas acumulan entradas en CHANGELOG e INDEX sin pisarse', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const t1 = sampleTask({ id: 'TASK-710', rama: 'feature/task-710-una' });
    await setupTaskEnRevision(repoRoot, tareasRoot, t1);
    await runFinishCommand(tareasRoot, ['TASK-710'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'cierre de TASK-710');

    const t2 = sampleTask({ id: 'TASK-711', titulo: 'Segunda tarea', rama: 'feature/task-711-dos' });
    await setupTaskEnRevision(repoRoot, tareasRoot, t2);
    await runFinishCommand(tareasRoot, ['TASK-711'], '2026-09-08', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
    assert.match(changelog, /TASK-710/);
    assert.match(changelog, /TASK-711/);
    // La mas reciente queda arriba (insercion bajo la cabecera).
    assert.ok(changelog.indexOf('TASK-711') < changelog.indexOf('TASK-710'));

    const index = await readFile(path.join(repoRoot, 'docs', 'INDEX.md'), 'utf8');
    assert.match(index, /TASK-710/);
    assert.match(index, /Segunda tarea/);

    // El board refleja el estado final: ambas terminadas.
    const board = await readFile(path.join(repoRoot, 'docs', 'BOARD.md'), 'utf8');
    assert.match(board, /TASK-710/);
    assert.match(board, /TASK-711/);
  });
});
