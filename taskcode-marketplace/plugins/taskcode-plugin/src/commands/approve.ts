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
 *
 * Desde TASK-012 tambien aplica la precondicion de rama base de la
 * seccion 8.3 (ensureBaseBranchReady) antes de escribir nada.
 */
import path from 'node:path';
import { stat } from 'node:fs/promises';
import type { Task } from '../core/task.js';
import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { PLAN_FINAL_FILENAME } from './plan.js';
import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';

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
  baseBranchGuard: BaseBranchGuardResult;
}

export interface ApproveCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
}

export async function runApproveCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: ApproveCommandDeps
): Promise<ApproveCommandResult> {
  const id = argv[0];
  if (id === undefined || id.trim() === '') {
    throw new ApproveCommandError('[ERROR] Falta el ID de la tarea: taskctl approve TASK-NNN.');
  }

  // Lectura PRELIMINAR, contra la rama activa en este momento (puede
  // no ser la rama base real). Solo para rechazar rapido, sin tocar
  // Git, un caso ya claramente invalido aqui, y para conocer
  // initial.task.tipo (metadata estable) y resolver la rama base. NO
  // se usa para escribir nada — ver el comentario equivalente y mas
  // detallado en plan.ts (hallazgo CRITICO de revision por pares,
  // TASK-012: antes de este fix, approve podia sobrescribir en
  // silencio el contenido real de la rama base con los datos de una
  // lectura hecha en una rama vieja, tras el cambio automatico).
  const initial = await readTareaFile(tareasRoot, id);
  const planFinalExisteInicial = initial
    ? await planFinalFileExists(path.join(path.dirname(initial.filePath), PLAN_FINAL_FILENAME))
    : false;
  assertTransitionAllowed('approve', initial ? initial.task : null, {
    planFinalExiste: planFinalExisteInicial,
  });

  // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
  // tiene cambios sin commitear, o si no puede cambiar de forma
  // automatica a la rama base esperada segun initial.task.tipo.
  const baseBranchGuard = ensureBaseBranchReady(initial!.task.tipo, deps.repoCwd);

  // Lectura FRESCA, ya en la rama base real — la unica que decide si
  // se marca plan_aprobado y con que contenido de partida (etiquetas,
  // asignado_a, etc. se preservan tal cual esten en la rama base, no
  // como estuvieran en la rama vieja de la lectura preliminar).
  const existing = await readTareaFile(tareasRoot, id);
  const planFinalExiste = existing
    ? await planFinalFileExists(path.join(path.dirname(existing.filePath), PLAN_FINAL_FILENAME))
    : false;
  assertTransitionAllowed('approve', existing ? existing.task : null, { planFinalExiste });
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);

  return { id: task.id, filePath: newFilePath, baseBranchGuard };
}
