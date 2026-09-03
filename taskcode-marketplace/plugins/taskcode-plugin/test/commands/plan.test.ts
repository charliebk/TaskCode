/**
 * Tests de taskctl plan (TASK-010). Desde TASK-012, plan SI toca Git
 * (ensureBaseBranchReady, seccion 8.3) — igual que start.test.ts
 * (TASK-009), monta un repo Git temporal real en vez de un directorio
 * de temp sin mas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, stat, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runPlanCommand, PlanCommandError, PLAN_FINAL_FILENAME } from '../../src/commands/plan.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import { BaseBranchGuardError } from '../../src/fs/git.js';
import type { Task } from '../../src/core/task.js';

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-700',
    titulo: 'Tarea de prueba de plan',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-700-prueba',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-03',
    actualizado: '2026-09-03',
    dependencias: [],
    ...overrides,
  };
}

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

function branchNow(cwd: string): string {
  return spawnSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' }).stdout.trim();
}

/**
 * writeTareaFile deja tareas/.../tarea.md sin commitear (es solo I/O de
 * disco). En uso real esa tarea.md ya estaria commiteada (viene de un
 * "taskctl new"/"import" previo) antes de que alguien ejecute plan, asi
 * que los tests la commitean aqui para dejar el workspace limpio antes
 * de invocar runPlanCommand — mismo patron que start.test.ts.
 */
function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-plan-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);

    const tareasRoot = path.join(repoRoot, 'tareas');
    await fn(repoRoot, tareasRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

test('taskctl plan: primera vez mueve la tarea a 01-en-diseno y crea el scaffold de plan-final.md', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nAlgo.\n');
    commitAll(repoRoot, 'tarea TASK-700');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot });

    assert.equal(result.id, 'TASK-700');
    assert.match(result.filePath, /01-en-diseno[/\\]TASK-700[/\\]tarea\.md$/);
    assert.equal(result.planPath, path.join(path.dirname(result.filePath), PLAN_FINAL_FILENAME));
    assert.equal(result.planCreated, true);
    assert.equal(result.baseBranchGuard.switched, false);
    assert.equal(result.baseBranchGuard.baseBranch, 'develop');

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.actualizado, '2026-09-04');
    // plan_aprobado NO lo toca "plan" (eso es taskctl approve, TASK-011).
    assert.equal(read?.task.plan_aprobado, false);

    const planContent = await readFile(result.planPath, 'utf8');
    assert.match(planContent, /# Plan — TASK-700: Tarea de prueba de plan/);

    // La carpeta vieja (00-planificadas) ya no existe.
    await assert.rejects(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));
  });
});

test('taskctl plan: re-planificacion (en-diseno, plan_aprobado false) no pisa un plan-final.md existente', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Simula una primera vuelta ya hecha: tarea en en-diseno con un
    // plan-final.md que ya tiene contenido real (no el scaffold).
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
    const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
    await writeFile(path.join(taskDir, PLAN_FINAL_FILENAME), '# Plan real ya redactado\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-700 en diseno');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-05', { repoCwd: repoRoot });

    assert.equal(result.planCreated, false);
    assert.match(result.filePath, /01-en-diseno[/\\]TASK-700[/\\]tarea\.md$/);

    const planContent = await readFile(result.planPath, 'utf8');
    assert.equal(planContent, '# Plan real ya redactado\n');

    // actualizado SI se refresca aunque no cambie de carpeta.
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.actualizado, '2026-09-05');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl plan: rechaza si ya esta en en-diseno con plan_aprobado true, sin tocar nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno', plan_aprobado: true }), '');
    commitAll(repoRoot, 'tarea TASK-700 aprobada');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.plan_aprobado, true);
    // No se creo ningun plan-final.md.
    await assert.rejects(() =>
      stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700', PLAN_FINAL_FILENAME))
    );
  });
});

test('taskctl plan: rechaza un estado que no admite plan (p. ej. en-curso)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), '');
    commitAll(repoRoot, 'tarea TASK-700 en curso');
    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-curso');
  });
});

test('taskctl plan: rechaza si el ID no existe, sin efectos secundarios', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-999'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );
  });
});

test('taskctl plan: propaga cualquier error de escritura que NO sea EEXIST (no lo confunde con una re-planificacion)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
    commitAll(repoRoot, 'tarea TASK-700 en diseno');
    const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
    // Carpeta de la tarea sin permiso de escritura: writeFile de
    // plan-final.md falla con EACCES, no con EEXIST — debe
    // propagarse tal cual, no tratarse como "ya existe, re-planificacion
    // normal".
    await chmod(taskDir, 0o555);
    try {
      await assert.rejects(
        () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.equal((err as NodeJS.ErrnoException).code, 'EACCES');
          return true;
        }
      );
    } finally {
      // Restaura permisos para que withTempRepo pueda limpiar el directorio.
      await chmod(taskDir, 0o755);
    }
  });
});

test('taskctl plan: error claro si falta el ID', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runPlanCommand(tareasRoot, [], '2026-09-04', { repoCwd: repoRoot }),
      PlanCommandError
    );
  });
});

// --- precondicion de rama base (seccion 8.3, TASK-012) ---------------------

test('taskctl plan: workspace sucio en develop aborta sin mover ni escribir nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea TASK-700');
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear', 'utf8');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      BaseBranchGuardError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'planificada');
    await assert.rejects(() =>
      stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700'))
    );
  });
});

test('taskctl plan: en una rama de feature, limpia, cambia sola a develop antes de mover la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea TASK-700');
    git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot });

    assert.equal(result.baseBranchGuard.switched, true);
    assert.equal(result.baseBranchGuard.branchAntes, 'feature/otra-cosa');
    assert.equal(branchNow(repoRoot), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl plan: el estado invalido se sigue rechazando ANTES de tocar la rama activa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), '');
    commitAll(repoRoot, 'tarea TASK-700 en curso');
    git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );
    // No cambio de rama: el rechazo de la maquina de estados es previo
    // a ensureBaseBranchReady (mismo orden que documenta plan.ts).
    assert.equal(branchNow(repoRoot), 'feature/otra-cosa');
  });
});

test('taskctl plan: la tarea existe en la rama vieja pero NO en la rama base real tras el cambio — rechaza sin crear nada (hallazgo CRITICO de revision por pares, TASK-012)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // A proposito NO se commitea en develop: la tarea solo existe en
    // esta rama de feature (violando 8.3, pero es exactamente el
    // escenario que expone el hallazgo — una lectura preliminar en la
    // rama equivocada no debe decidir nada).
    git(['checkout', '-q', '-b', 'feature/donde-no-deberia-estar'], repoRoot);
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea TASK-700 solo en esta rama de feature');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );

    // Termino en develop (el cambio de rama SI se hizo, porque la
    // lectura preliminar en la rama de feature parecia valida) pero
    // sin crear ni mover nada ahi: develop nunca tuvo esta tarea.
    assert.equal(branchNow(repoRoot), 'develop');
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700')));
    await assert.rejects(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));
  });
});

test('taskctl plan: la rama base real tiene la tarea en un estado distinto al de la lectura preliminar — decide con el estado real, no con el viejo (hallazgo CRITICO de revision por pares, TASK-012)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Primero, la tarea nace "planificada" (como dejaria taskctl new).
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea TASK-700 planificada');

    // Una rama de feature se bifurca AQUI — ve la tarea "planificada",
    // sin plan-final.md.
    git(['checkout', '-q', '-b', 'feature/vieja'], repoRoot);
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'planificada');

    // develop sigue avanzando de verdad: se re-planifica de verdad
    // (en-diseno, con un plan-final.md real) — borra la carpeta vieja
    // a mano para que el commit refleje el movimiento real (aqui no se
    // usa runPlanCommand a proposito: es solo el estado de partida del
    // test, no lo que se esta probando).
    git(['checkout', '-q', 'develop'], repoRoot);
    await rm(path.join(tareasRoot, '00-planificadas', 'TASK-700'), { recursive: true, force: true });
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', 'TASK-700', PLAN_FINAL_FILENAME),
      '# Plan real en develop\n',
      'utf8'
    );
    commitAll(repoRoot, 'tarea TASK-700 en diseno de verdad en develop');

    // Vuelve a la rama vieja (limpia) para invocar "plan" desde ahi.
    git(['checkout', '-q', 'feature/vieja'], repoRoot);

    // "plan" desde la rama vieja: la lectura preliminar ve
    // "planificada" (primera vez, valido) y NO deberia usarse para
    // escribir. Tras el cambio automatico a develop, la lectura fresca
    // ve "en-diseno" con plan_aprobado false: sigue siendo una
    // re-planificacion legitima, PERO sobre el contenido real de
    // develop, no sobre el de la rama vieja — y sin pisar el
    // plan-final.md real que ya existe ahi (writeFile con 'wx').
    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-05', { repoCwd: repoRoot });

    assert.equal(result.planCreated, false);
    const planContent = await readFile(result.planPath, 'utf8');
    assert.equal(planContent, '# Plan real en develop\n');
    assert.equal(branchNow(repoRoot), 'develop');
  });
});
