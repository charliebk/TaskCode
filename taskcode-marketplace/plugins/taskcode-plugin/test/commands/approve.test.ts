/**
 * Tests de taskctl approve (TASK-011). Como plan.test.ts, no hace
 * falta un repo Git real: approve tampoco toca Git.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, stat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runApproveCommand, ApproveCommandError } from '../../src/commands/approve.js';
import { PLAN_FINAL_FILENAME } from '../../src/commands/plan.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-800',
    titulo: 'Tarea de prueba de approve',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'en-diseno',
    plan_aprobado: false,
    rama: 'feature/task-800-prueba',
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
  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-approve-'));
  try {
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function writePlanFinal(root: string, id: string, content = '# Plan real\n'): Promise<void> {
  await writeFile(path.join(root, '01-en-diseno', id, PLAN_FINAL_FILENAME), content, 'utf8');
}

test('taskctl approve: marca plan_aprobado true cuando la tarea esta en en-diseno y plan-final.md existe', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask(), '## Objetivo\nAlgo.\n');
    await writePlanFinal(root, 'TASK-800');

    const result = await runApproveCommand(root, ['TASK-800'], '2026-09-05');

    assert.equal(result.id, 'TASK-800');
    // No se mueve de carpeta: sigue en 01-en-diseno.
    assert.match(result.filePath, /01-en-diseno[/\\]TASK-800[/\\]tarea\.md$/);

    const read = await readTareaFile(root, 'TASK-800');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.plan_aprobado, true);
    assert.equal(read?.task.actualizado, '2026-09-05');

    // plan-final.md no se toco.
    const plan = await stat(path.join(root, '01-en-diseno', 'TASK-800', PLAN_FINAL_FILENAME));
    assert.ok(plan.isFile());
  });
});

test('taskctl approve: rechaza si plan-final.md todavia no existe, sin tocar nada', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask(), '');
    // Sin escribir plan-final.md.

    await assert.rejects(
      () => runApproveCommand(root, ['TASK-800'], '2026-09-05'),
      StateMachineError
    );

    const read = await readTareaFile(root, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, false);
    assert.equal(read?.task.actualizado, '2026-09-03');
  });
});

test('taskctl approve: rechaza si la tarea no esta en en-diseno (p. ej. planificada)', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask({ estado: 'planificada' }), '');
    await assert.rejects(
      () => runApproveCommand(root, ['TASK-800'], '2026-09-05'),
      StateMachineError
    );
    const read = await readTareaFile(root, 'TASK-800');
    assert.equal(read?.task.estado, 'planificada');
    assert.equal(read?.task.plan_aprobado, false);
  });
});

test('taskctl approve: rechaza si la tarea no esta en en-diseno (p. ej. en-curso), aunque exista un plan-final.md suelto', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask({ estado: 'en-curso' }), '');
    await writeFile(path.join(root, '02-en-curso', 'TASK-800', PLAN_FINAL_FILENAME), '# x\n', 'utf8');

    await assert.rejects(
      () => runApproveCommand(root, ['TASK-800'], '2026-09-05'),
      StateMachineError
    );
    const read = await readTareaFile(root, 'TASK-800');
    assert.equal(read?.task.estado, 'en-curso');
  });
});

test('taskctl approve: rechaza si el ID no existe, sin efectos secundarios', async () => {
  await withTempRoot(async (root) => {
    await assert.rejects(
      () => runApproveCommand(root, ['TASK-999'], '2026-09-05'),
      StateMachineError
    );
  });
});

test('taskctl approve: error claro si falta el ID', async () => {
  await withTempRoot(async (root) => {
    await assert.rejects(
      () => runApproveCommand(root, [], '2026-09-05'),
      ApproveCommandError
    );
  });
});

test('taskctl approve: es idempotente si se invoca dos veces seguidas (ya aprobada sigue aprobada)', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask(), '');
    await writePlanFinal(root, 'TASK-800');

    await runApproveCommand(root, ['TASK-800'], '2026-09-05');
    const result2 = await runApproveCommand(root, ['TASK-800'], '2026-09-06');

    assert.equal(result2.id, 'TASK-800');
    const read = await readTareaFile(root, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, true);
    assert.equal(read?.task.actualizado, '2026-09-06');
  });
});

test('taskctl approve: propaga cualquier error de stat que NO sea ENOENT (no lo confunde con "no existe")', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask(), '');
    const taskDir = path.join(root, '01-en-diseno', 'TASK-800');
    // Symlink autorreferencial en vez de un fichero normal: stat()
    // falla con ELOOP, no con ENOENT — debe propagarse, no
    // interpretarse como "el plan no existe todavia". (Restringir
    // permisos del directorio, probado primero, no sirve aqui: taskDir
    // tambien contiene tarea.md, asi que quitarle el bit de ejecucion
    // hace fallar la propia lectura de tarea.md en readTareaFile con
    // el mismo EACCES, antes de llegar siquiera al codigo bajo prueba
    // — hallazgo propio al escribir este test.)
    await symlink(PLAN_FINAL_FILENAME, path.join(taskDir, PLAN_FINAL_FILENAME));

    await assert.rejects(
      () => runApproveCommand(root, ['TASK-800'], '2026-09-05'),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.equal((err as NodeJS.ErrnoException).code, 'ELOOP');
        return true;
      }
    );
  });
});

test('taskctl approve: complejidad trivial/simple tambien pasa por el mismo checkpoint si se invoca (approve no distingue complejidad)', async () => {
  await withTempRoot(async (root) => {
    await writeTareaFile(root, sampleTask({ complejidad: 'trivial' }), '');
    await writePlanFinal(root, 'TASK-800');

    const result = await runApproveCommand(root, ['TASK-800'], '2026-09-05');
    assert.equal(result.id, 'TASK-800');
    const read = await readTareaFile(root, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, true);
  });
});
