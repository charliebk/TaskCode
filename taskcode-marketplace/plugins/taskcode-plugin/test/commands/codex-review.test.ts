/**
 * Test de integracion real (no mocks) para taskctl codex-review
 * (TASK-020): repos Git temporales de verdad (nunca mocks de Git), y el
 * spawn de "codex" inyectado como dependencia (deps.runCodex) para
 * simular ENOENT y un exit distinto de cero sin depender del binario
 * real ni de red — mismo espiritu que review.test.ts (TASK-013) y
 * finish.test.ts (TASK-014), que inyectan deps.scriptsDir en vez de
 * fiarse de los scripts reales del sistema.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import {
  runCodexReviewCommand,
  CodexReviewCommandError,
  codexInformeTemplate,
} from '../../src/commands/codex-review.js';
import type { CodexReviewInvocation, CodexReviewOutcome } from '../../src/fs/git.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-800',
    titulo: 'Tarea de prueba de codex-review',
    tipo: 'feature',
    sprint: 3,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'en-revision',
    plan_aprobado: true,
    rama: 'feature/task-800-prueba-codex-review',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: true,
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
 * Commit de SETUP del test. Igual que en review.test.ts/finish.test.ts:
 * desde TASK-030 taskctl commitea lo que el mismo escribe, asi que
 * llamar a esto justo despues de un comando puede no tener ya nada que
 * registrar.
 */
function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', message], repoRoot);
}

async function withTempRepo(
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-codex-review-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
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
 * Deja la tarea en-revision en su rama, con el informe de la ronda 1 de
 * la revision PRIMARIA ya commiteado (aprobado por defecto): el estado
 * en el que "taskctl review" mas un revisor humano/agente dejarian la
 * tarea antes de poder ejecutar "taskctl codex-review".
 */
async function setupTaskEnRevision(
  repoRoot: string,
  tareasRoot: string,
  task: Task,
  opts: { veredictoPrimaria?: string } = {}
): Promise<void> {
  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar codex-review.\n');
  await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
  await mkdir(revisionDir, { recursive: true });
  await writeFile(
    path.join(revisionDir, 'informe-revision-1.md'),
    `# Informe de revision — ${task.id} (ronda 1)\n\n${opts.veredictoPrimaria ?? VEREDICTO_APROBADO}`,
    'utf8'
  );
  commitAll(repoRoot, `feat(${task.id}): trabajo revisado, listo para codex-review`);
}

function fakeRunCodex(
  parcial: Partial<CodexReviewOutcome>
): (invocation: CodexReviewInvocation) => CodexReviewOutcome {
  return () => ({ lanzado: true, code: 0, stdout: '', errorLanzamiento: null, ...parcial });
}

test('codexInformeTemplate: scaffold con veredicto PENDIENTE y la salida cruda embebida', () => {
  const task = sampleTask();
  const informe = codexInformeTemplate(task, 'abc1234', 1, 'hallazgo sintetico de codex\n');
  assert.match(informe, /Informe de Codex \(segunda opinion\) — TASK-800 \(ronda 1\)/);
  assert.match(informe, /Veredicto: PENDIENTE/);
  assert.match(informe, /hallazgo sintetico de codex/);
  assert.match(informe, /codex-cli/);
});

test('taskctl codex-review: rechaza si revision_codex no esta activada, sin invocar codex', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-801', rama: 'feature/task-801-sin-codex', revision_codex: false });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    let invocado = false;
    await assert.rejects(
      () =>
        runCodexReviewCommand(tareasRoot, ['TASK-801'], '2026-09-13', {
          repoCwd: repoRoot,
          runCodex: () => {
            invocado = true;
            return { lanzado: true, code: 0, stdout: '', errorLanzamiento: null };
          },
        }),
      StateMachineError
    );
    assert.equal(invocado, false, 'codex no deberia invocarse si la precondicion ya rechaza');
    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-801', 'revision', 'informe-codex-1.md')));
  });
});

test('taskctl codex-review: rechaza si la revision primaria no esta aprobada (PENDIENTE o cambios-solicitados)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({
      id: 'TASK-802',
      rama: 'feature/task-802-primaria-pendiente',
    });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, {
      veredictoPrimaria: '- Veredicto: cambios-solicitados\n',
    });

    await assert.rejects(
      () =>
        runCodexReviewCommand(tareasRoot, ['TASK-802'], '2026-09-13', {
          repoCwd: repoRoot,
          runCodex: fakeRunCodex({}),
        }),
      (e: unknown) => {
        assert.ok(e instanceof StateMachineError);
        assert.match((e as Error).message, /revision primaria aprobada/);
        return true;
      }
    );
  });
});

test('taskctl codex-review: rechaza una tarea que no esta en-revision', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({
      id: 'TASK-803',
      rama: 'feature/task-803-en-curso',
      estado: 'en-curso',
    });
    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
    await writeTareaFile(tareasRoot, task, '');
    commitAll(repoRoot, 'tarea en curso');

    await assert.rejects(
      () =>
        runCodexReviewCommand(tareasRoot, ['TASK-803'], '2026-09-13', {
          repoCwd: repoRoot,
          runCodex: fakeRunCodex({}),
        }),
      StateMachineError
    );
  });
});

test('taskctl codex-review: codex ausente (ENOENT simulado) degrada con aviso, sin escribir informe (criterio 3)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-804', rama: 'feature/task-804-codex-ausente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const enoent = Object.assign(new Error('spawnSync codex ENOENT'), { code: 'ENOENT' });
    const result = await runCodexReviewCommand(tareasRoot, ['TASK-804'], '2026-09-13', {
      repoCwd: repoRoot,
      runCodex: () => ({ lanzado: false, code: null, stdout: '', errorLanzamiento: enoent }),
    });

    assert.equal(result.degradado, true);
    assert.match(result.motivoDegradacion ?? '', /no se pudo ejecutar "codex"/);
    assert.equal(result.ronda, null);
    assert.equal(result.informePath, null);
    await assert.rejects(() =>
      stat(path.join(tareasRoot, '03-en-revision', 'TASK-804', 'revision', 'informe-codex-1.md'))
    );
    // "revision_codex" sigue bloqueando finish: solo hay el informe de
    // la revision primaria, ninguno de Codex.
    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-804', 'revision');
    const entradas = await import('node:fs/promises').then((m) => m.readdir(revisionDir));
    assert.ok(!entradas.some((e) => /^informe-codex-/.test(e)));
  });
});

test('taskctl codex-review: codex presente pero exit distinto de cero degrada igual que la ausencia (criterio 3, decision de Carlos)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-805', rama: 'feature/task-805-codex-falla' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const result = await runCodexReviewCommand(tareasRoot, ['TASK-805'], '2026-09-13', {
      repoCwd: repoRoot,
      runCodex: () => ({
        lanzado: true,
        code: 1,
        stdout: 'error: model not supported for this account\n',
        errorLanzamiento: null,
      }),
    });

    assert.equal(result.degradado, true);
    assert.match(result.motivoDegradacion ?? '', /codigo 1/);
    assert.equal(result.ronda, null);
    assert.equal(result.informePath, null);
    await assert.rejects(() =>
      stat(path.join(tareasRoot, '03-en-revision', 'TASK-805', 'revision', 'informe-codex-1.md'))
    );
  });
});

test('taskctl codex-review: codex corre bien (exit 0) escribe informe-codex-1.md con la salida embebida y veredicto PENDIENTE (criterio 4)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-806', rama: 'feature/task-806-codex-ok' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const salidaSintetica = '## Hallazgos de codex\n\nCRITICO: nada encontrado, ejemplo sintetico.\n';
    const args: { invocation: CodexReviewInvocation | null } = { invocation: null };
    const result = await runCodexReviewCommand(tareasRoot, ['TASK-806'], '2026-09-13', {
      repoCwd: repoRoot,
      runCodex: (invocation) => {
        args.invocation = invocation;
        return { lanzado: true, code: 0, stdout: salidaSintetica, errorLanzamiento: null };
      },
    });

    assert.equal(result.degradado, false);
    assert.equal(result.motivoDegradacion, null);
    assert.equal(result.ronda, 1);
    assert.match(result.informePath ?? '', /informe-codex-1\.md$/);

    // Se invoco con --base contra la rama base real (develop) y no se
    // le paso el diff a mano: codex lo calcula el mismo.
    assert.ok(args.invocation !== null);
    assert.deepEqual(args.invocation!.args.slice(0, 3), ['review', '--base', 'develop']);

    const informe = await readFile(result.informePath as string, 'utf8');
    assert.match(informe, /Veredicto: PENDIENTE/);
    assert.match(informe, /Hallazgos de codex/);
    // No se mezcla con el informe de la revision primaria.
    const informePrimaria = await readFile(
      path.join(tareasRoot, '03-en-revision', 'TASK-806', 'revision', 'informe-revision-1.md'),
      'utf8'
    );
    assert.doesNotMatch(informePrimaria, /Hallazgos de codex/);

    // Paso 5 de la 8.3: el informe quedo commiteado.
    const log = git(['log', '--format=%s', '-1'], repoRoot).trim();
    assert.equal(log, 'chore(TASK-806): informe de codex ronda 1');
  });
});

test('taskctl codex-review: una segunda invocacion numera el informe como -2, sin pisar la ronda anterior', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-807', rama: 'feature/task-807-segunda-ronda' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const primera = await runCodexReviewCommand(tareasRoot, ['TASK-807'], '2026-09-13', {
      repoCwd: repoRoot,
      runCodex: fakeRunCodex({ stdout: 'primera pasada\n' }),
    });
    assert.equal(primera.ronda, 1);

    const segunda = await runCodexReviewCommand(tareasRoot, ['TASK-807'], '2026-09-13', {
      repoCwd: repoRoot,
      runCodex: fakeRunCodex({ stdout: 'segunda pasada\n' }),
    });
    assert.equal(segunda.ronda, 2);
    assert.match(segunda.informePath ?? '', /informe-codex-2\.md$/);

    const anterior = await readFile(primera.informePath as string, 'utf8');
    assert.match(anterior, /primera pasada/);
  });
});

test('taskctl codex-review: dos invocaciones concurrentes sobre la misma ronda producen EEXIST en una de las dos (hallazgo de riesgos, TASK-020)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-808', rama: 'feature/task-808-concurrencia' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const deps = {
      repoCwd: repoRoot,
      runCodex: fakeRunCodex({ stdout: 'salida concurrente\n' }),
    };
    const resultados = await Promise.allSettled([
      runCodexReviewCommand(tareasRoot, ['TASK-808'], '2026-09-13', deps),
      runCodexReviewCommand(tareasRoot, ['TASK-808'], '2026-09-13', deps),
    ]);

    const cumplidas = resultados.filter((r) => r.status === 'fulfilled');
    const rechazadas = resultados.filter((r) => r.status === 'rejected');
    // O bien las dos calcularon la misma ronda y una de las dos choco
    // con EEXIST, o el sistema de archivos las serializo lo bastante
    // rapido como para que cada una calculara su propia ronda: en
    // cualquier caso, NINGUNA pisa el informe de la otra ni deja el
    // directorio en un estado corrupto — eso es lo que este test
    // aprueba, sin exigir que la carrera se gane siempre igual.
    assert.ok(cumplidas.length >= 1, 'al menos una invocacion debe completar con exito');
    for (const r of rechazadas) {
      assert.ok((r as PromiseRejectedResult).reason instanceof CodexReviewCommandError);
    }
    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-808', 'revision');
    const { readdir } = await import('node:fs/promises');
    const entradas = (await readdir(revisionDir)).filter((e) => /^informe-codex-/.test(e));
    // Tantos informes de Codex como invocaciones tuvieron exito, cada
    // uno con su propio numero de ronda (sin duplicados).
    assert.equal(entradas.length, cumplidas.length);
    assert.equal(new Set(entradas).size, entradas.length);
  });
});

test('taskctl codex-review: error claro si falta el ID o la tarea no existe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () =>
        runCodexReviewCommand(tareasRoot, [], '2026-09-13', {
          repoCwd: repoRoot,
          runCodex: fakeRunCodex({}),
        }),
      CodexReviewCommandError
    );
    await assert.rejects(
      () =>
        runCodexReviewCommand(tareasRoot, ['TASK-999'], '2026-09-13', {
          repoCwd: repoRoot,
          runCodex: fakeRunCodex({}),
        }),
      StateMachineError
    );
  });
});

test('readTareaFile sigue viendo la tarea en 03-en-revision tras codex-review (no cambia de carpeta ni de estado)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-809', rama: 'feature/task-809-no-cambia-estado' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    await runCodexReviewCommand(tareasRoot, ['TASK-809'], '2026-09-13', {
      repoCwd: repoRoot,
      runCodex: fakeRunCodex({ stdout: 'ok\n' }),
    });

    const read = await readTareaFile(tareasRoot, 'TASK-809');
    assert.equal(read?.task.estado, 'en-revision');
    assert.equal(read?.filePath.includes(path.join('03-en-revision', 'TASK-809')), true);
  });
});
