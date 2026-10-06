/**
 * TASK-043: las tres puertas de la validacion del enunciado, contra repos
 * Git temporales reales y los scripts de Git-Flow tal cual:
 * - plan rechaza una tarea mal definida SIN moverla, y devuelve los avisos;
 * - approve rechaza el plan-final.md que es la plantilla sin rellenar;
 * - finish avisa de criterios sin marcar ANTES de mergear, sin bloquear.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import {
  runPlanCommand,
  PlanCommandError,
  PLAN_FINAL_FILENAME,
  PLANIFICACION_DIRNAME,
} from '../../src/commands/plan.js';
import { runApproveCommand, ApproveCommandError } from '../../src/commands/approve.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-430',
    titulo: 'Tarea de prueba de las puertas',
    tipo: 'feature',
    sprint: 4,
    etiquetas: ['cli'],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-430-prueba-puertas',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: '2026-10-04',
    actualizado: '2026-10-04',
    dependencias: [],
    ...overrides,
  };
}

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', message], repoRoot);
}

async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-puertas-'));
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

const criterios = (k: number): string =>
  Array.from({ length: k }, (_, i) => `- [ ] \`taskctl\` caso ${String(i + 1)}\n`).join('');

// ─── plan ──────────────────────────────────────────────────────────────

/** Mutacion que lo pone rojo: subir MAX_CRITERIOS o quitar la puerta de plan. */
test('plan (TASK-043): 13 criterios bloquea, lista el motivo y la tarea NO se mueve ni se ensucia nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask(),
      `## Objetivo\n\nAlgo concreto.\n\n## Criterios de aceptacion\n${criterios(13)}`
    );
    commitAll(repoRoot, 'tarea TASK-430');
    const head = git(['rev-parse', 'HEAD'], repoRoot);

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot }),
      (e: unknown) => {
        assert.ok(e instanceof PlanCommandError);
        assert.match(e.message, /no esta lista para planificar/);
        assert.match(e.message, /- tiene 13 criterios/);
        assert.match(e.message, /La tarea no se ha movido/);
        return true;
      }
    );
    assert.equal((await readTareaFile(tareasRoot, 'TASK-430'))?.task.estado, 'planificada');
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head, 'sin commits nuevos');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

/** Mutacion que lo pone rojo: no devolver avisosEnunciado (o convertirlos en bloqueo). */
test('plan (TASK-043): 9 criterios planifica y devuelve el aviso, sin bloquear', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask(),
      `## Objetivo\n\nAlgo concreto.\n\n## Criterios de aceptacion\n${criterios(9)}`
    );
    commitAll(repoRoot, 'tarea TASK-430');

    const r = await runPlanCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot });

    assert.equal((await readTareaFile(tareasRoot, 'TASK-430'))?.task.estado, 'en-diseno');
    assert.equal(r.avisosEnunciado.length, 1);
    assert.match(r.avisosEnunciado[0] as string, /tiene 9 criterios/);
  });
});

// ─── approve ───────────────────────────────────────────────────────────

/**
 * Se usa el plan-final.md que escribe el PROPIO plan, no una copia: si la
 * plantilla cambia, el test sigue midiendo lo que la persona veria.
 * Mutacion que lo pone rojo: quitar la puerta de approve, o comparar con
 * plantillas de un numero de roles distinto del real.
 */
test('approve (TASK-043): rechaza el esqueleto que deja plan; con contenido propio aprueba', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask(),
      `## Objetivo\n\nAlgo concreto.\n\n## Criterios de aceptacion\n${criterios(2)}`
    );
    commitAll(repoRoot, 'tarea TASK-430');
    const plan = await runPlanCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot });
    assert.ok(plan.roles.length > 0, 'la prueba necesita una plantilla con roles');

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot }),
      (e: unknown) => e instanceof ApproveCommandError && /plantilla sin rellenar/.test(e.message)
    );
    assert.equal((await readTareaFile(tareasRoot, 'TASK-430'))?.task.plan_aprobado, false);

    const rutaPlan = path.join(tareasRoot, '01-en-diseno', 'TASK-430', PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
    await mkdir(path.dirname(rutaPlan), { recursive: true });
    await writeFile(rutaPlan, '# Plan\n\n## Enfoque\n\nUn modulo puro y dos puertas.\n', 'utf8');
    commitAll(repoRoot, 'docs(TASK-430): plan final');

    await runApproveCommand(tareasRoot, ['TASK-430'], '2026-10-04', { repoCwd: repoRoot });
    assert.equal((await readTareaFile(tareasRoot, 'TASK-430'))?.task.plan_aprobado, true);
  });
});

// ─── finish ────────────────────────────────────────────────────────────

async function setupEnRevision(
  repoRoot: string,
  tareasRoot: string,
  body: string,
  costes: Partial<Task> = { tokens_diseno: 1, tokens_revision: 1 }
): Promise<Task> {
  const task = sampleTask({ estado: 'en-revision', plan_aprobado: true, ...costes });
  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
  await writeTareaFile(tareasRoot, task, body);
  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo\n', 'utf8');
  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
  await mkdir(revisionDir, { recursive: true });
  await writeFile(
    path.join(revisionDir, 'informe-revision-1.md'),
    `# Informe de revision — ${task.id} (ronda 1)\n\n- Veredicto: aprobada\n`,
    'utf8'
  );
  commitAll(repoRoot, 'feat(TASK-430): trabajo revisado');
  return task;
}

/**
 * Mutacion que lo pone rojo: mover el aviso despues de runGitflowScript
 * (el callback veria la rama ya integrada), contar las casillas de
 * "### Tras el cierre", o convertir el aviso en bloqueo.
 */
test('finish (TASK-043): avisa de los criterios sin marcar ANTES del merge, y cierra igualmente', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = await setupEnRevision(
      repoRoot,
      tareasRoot,
      '## Objetivo\nX.\n\n## Criterios de aceptacion\n- [x] hecho\n- [ ] olvidado\n\n' +
        '### Tras el cierre\n- [ ] CI en verde\n'
    );
    const avisos: { texto: string; integrada: boolean }[] = [];

    const r = await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      onAviso: (texto) => {
        const integrada =
          spawnSync('git', ['merge-base', '--is-ancestor', task.rama, 'develop'], { cwd: repoRoot }).status === 0;
        avisos.push({ texto, integrada });
      },
    });

    assert.equal(avisos.length, 1);
    assert.equal(avisos[0]?.integrada, false, 'el aviso llega antes de mergear');
    assert.match(avisos[0]?.texto ?? '', /1 criterio\(s\) de aceptacion sin marcar/);
    assert.match(avisos[0]?.texto ?? '', /«olvidado»/);
    assert.doesNotMatch(avisos[0]?.texto ?? '', /CI en verde/);
    assert.match(r.filePath, /04-terminadas/);
  });
});

test('finish (TASK-043): con todos los criterios marcados no hay aviso', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n\n## Criterios de aceptacion\n- [x] hecho\n');
    const avisos: string[] = [];
    await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      onAviso: (a) => avisos.push(a),
    });
    assert.deepEqual(avisos, []);
  });
});

/**
 * TASK-023. Mutaciones que lo ponen rojo: bloquear en vez de avisar, avisar
 * tambien de tokens_implementacion, o no mirar tokens_revision.
 */
test('finish (TASK-023): avisa del coste de diseno y revision sin registrar, ANTES del merge, y cierra igualmente', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = await setupEnRevision(
      repoRoot,
      tareasRoot,
      '## Objetivo\nX.\n\n## Criterios de aceptacion\n- [x] hecho\n',
      { tokens_diseno: null, tokens_implementacion: null, tokens_revision: null }
    );
    const avisos: { texto: string; integrada: boolean }[] = [];
    const r = await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      onAviso: (texto) => {
        const integrada =
          spawnSync('git', ['merge-base', '--is-ancestor', task.rama, 'develop'], { cwd: repoRoot }).status === 0;
        avisos.push({ texto, integrada });
      },
    });
    assert.equal(avisos.length, 2, 'uno por diseno y otro por revision; implementacion no avisa');
    assert.ok(avisos.every((a) => !a.integrada), 'los avisos llegan antes de mergear');
    assert.match(avisos[0]?.texto ?? '', /sin coste de diseno registrado.*taskctl registrar-coste TASK-430 --fase diseno --agente <id>/);
    // IMP-1 de la revision: el aviso no puede proponer la cifra de la notificacion.
    assert.doesNotMatch(avisos[0]?.texto ?? '', /--tokens N/);
    assert.match(avisos[1]?.texto ?? '', /sin coste de revision registrado.*--fase revision/);
    assert.ok(avisos.every((a) => !/implementacion/.test(a.texto)));
    assert.match(r.filePath, /04-terminadas/, 'no bloquea');
  });
});

test('finish (TASK-023): solo avisa de la fase que falta, y con diseno y revision registrados no avisa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n', {
      tokens_diseno: 5000,
      tokens_implementacion: null,
      tokens_revision: null,
    });
    const avisos: string[] = [];
    await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      onAviso: (a) => avisos.push(a),
    });
    assert.equal(avisos.length, 1);
    assert.match(avisos[0] ?? '', /sin coste de revision/);
  });
});

test('finish (TASK-023): con diseno y revision registrados (implementacion sin registrar) no hay aviso de coste', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupEnRevision(repoRoot, tareasRoot, '## Objetivo\nX.\n', {
      tokens_diseno: 5000,
      tokens_implementacion: null,
      tokens_revision: 7000,
    });
    const avisos: string[] = [];
    await runFinishCommand(tareasRoot, ['TASK-430'], '2026-10-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      onAviso: (a) => avisos.push(a),
    });
    assert.deepEqual(avisos, []);
  });
});
