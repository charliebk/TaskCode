/**
 * taskctl approve — TASK-011 de PLAN_SPRINTS.md. Checkpoint humano de
 * la fase de diseno (seccion 6 de la metodologia): marca
 * plan_aprobado: true una vez que plan-final.md existe.
 *
 * NO evalua la CALIDAD del plan (sigue siendo scaffold vacio vs.
 * redactado de verdad) — ese juicio lo hace la persona antes de
 * ejecutar el comando. La unica comprobacion automatica es la misma
 * que la maquina de estados de TASK-002 ya modela como
 * ctx.planFinalExiste: que el fichero exista.
 *
 * A diferencia de "plan"/"start", este comando no mueve la tarea de
 * carpeta (resultingState('approve', task) sigue siendo 'en-diseno').
 */
import path from 'node:path';
import { stat } from 'node:fs/promises';
import type { Task } from '../core/task.js';
import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { PLAN_FINAL_FILENAME } from './plan.js';

export class ApproveCommandError extends Error {}

async function planFinalFileExists(planPath: string): Promise<boolean> {
  try {
    await stat(planPath);
    return true;
  } catch (e: unknown) {
    if (isEnoent(e)) return false;
    throw e;
  }
}

export interface ApproveCommandResult {
  id: string;
  filePath: string;
}

export async function runApproveCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string
): Promise<ApproveCommandResult> {
  const id = argv[0];
  if (id === undefined || id.trim() === '') {
    throw new ApproveCommandError('[ERROR] Falta el ID de la tarea: taskctl approve TASK-NNN.');
  }

  const existing = await readTareaFile(tareasRoot, id);
  const planFinalExiste = existing
    ? await planFinalFileExists(path.join(path.dirname(existing.filePath), PLAN_FINAL_FILENAME))
    : false;
  // assertTransitionAllowed lanza StateMachineError si existing es
  // null, si el estado actual no es "en-diseno", o si planFinalExiste
  // es false — en todos los casos no se llega a escribir nada.
  assertTransitionAllowed('approve', existing ? existing.task : null, { planFinalExiste });
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);

  return { id: task.id, filePath: newFilePath };
}
