/**
 * Tests de taskctl plan (TASK-010). A diferencia de start.test.ts, no
 * hace falta un repo Git real: plan no toca Git en absoluto (es
 * deliberadamente la version minima, sin la precondicion de rama base
 * de la seccion 8.3 — ver comentario en src/commands/plan.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runPlanCommand, PlanCommandError, PLAN_FINAL_FILENAME } from '../../src/commands/plan.js';
import { StateMachineError } from '../../src/core/state-machine.js';
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

async function withTempRoot(fn: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-plan-'));
  try {
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('taskctl plan: primera vez mueve la tarea a 01-en-diseno y crea el scaffold de plan-final.md', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask(), '## Objetivo\nAlgo.\n');

    const result = await runPlanCommand(root, ['TASK-700'], '2026-09-04');

    assert.equal(result.id, 'TASK-700');
    assert.match(result.filePath, /01-en-diseno[/\\]TASK-700[/\\]tarea\.md$/);
    assert.equal(result.planPath, path.join(path.dirname(result.filePath), PLAN_FINAL_FILENAME));
    assert.equal(result.planCreated, true);

    const read = await readTareaFile(root, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.actualizado, '2026-09-04');
    // plan_aprobado NO lo toca "plan" (eso es taskctl approve, TASK-011).
    assert.equal(read?.task.plan_aprobado, false);

    const planContent = await readFile(result.planPath, 'utf8');
    assert.match(planContent, /# Plan — TASK-700: Tarea de prueba de plan/);

    // La carpeta vieja (00-planificadas) ya no existe.
    await assert.rejects(() => stat(path.join(root, '00-planificadas', 'TASK-700')));
  });
});

test('taskctl plan: re-planificacion (en-diseno, plan_aprobado false) no pisa un plan-final.md existente', async () => {
  await withTempRoot(async (root) => {
    // Simula una primera vuelta ya hecha: tarea en en-diseno con un
    // plan-final.md que ya tiene contenido real (no el scaffold).
    await writeTareaFile(root, sampleTask({ estado: 'en-diseno' }), '');
    const taskDir = path.join(root, '01-en-diseno', 'TASK-700');
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(taskDir, PLAN_FINAL_FILENAME), '# Plan real ya redactado\n', 'utf8');

    const result = await runPlanCommand(root, ['TASK-700'], '2026-09-05');

    assert.equal(result.planCreated, false);
    assert.match(result.filePath, /01-en-diseno[/\\]TASK-700[/\\]tarea\.md$/);

    const planContent = await readFile(result.planPath, 'utf8');
    assert.equal(planContent, '# Plan real ya redactado\n');

    // actualizado SI se refresca aunque no cambie de carpeta.
    const read = await readTareaFile(root, 'TASK-700');
    assert.equal(read?.task.actualizado, '2026-09-05');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl plan: rechaza si ya esta en en-diseno con plan_aprobado true, sin tocar nada', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask({ estado: 'en-diseno', plan_aprobado: true }), '');

    await assert.rejects(
      () => runPlanCommand(root, ['TASK-700'], '2026-09-04'),
      StateMachineError
    );

    const read = await readTareaFile(root, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.plan_aprobado, true);
    // No se creo ningun plan-final.md.
    await assert.rejects(() =>
      stat(path.join(root, '01-en-diseno', 'TASK-700', PLAN_FINAL_FILENAME))
    );
  });
});

test('taskctl plan: rechaza un estado que no admite plan (p. ej. en-curso)', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask({ estado: 'en-curso' }), '');
    await assert.rejects(
      () => runPlanCommand(root, ['TASK-700'], '2026-09-04'),
      StateMachineError
    );
    const read = await readTareaFile(root, 'TASK-700');
    assert.equal(read?.task.estado, 'en-curso');
  });
});

test('taskctl plan: rechaza si el ID no existe, sin efectos secundarios', async () => {
  await withTempRoot(async (root) => {
    await assert.rejects(
      () => runPlanCommand(root, ['TASK-999'], '2026-09-04'),
      StateMachineError
    );
  });
});

test('taskctl plan: error claro si falta el ID', async () => {
  await withTempRoot(async (root) => {
    await assert.rejects(
      () => runPlanCommand(root, [], '2026-09-04'),
      PlanCommandError
    );
  });
});
