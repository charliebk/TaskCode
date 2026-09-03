/**
 * taskctl plan — TASK-010 de PLAN_SPRINTS.md. Version MINIMA de la
 * fase de diseno (seccion 6 de la metodologia): sin contexto
 * determinista desde docs/INDEX.md, sin gatekeeper barato (Haiku), sin
 * seleccion de skill (6.6), sin brainstorm multi-agente en paralelo —
 * todo eso es Sprint 3 (TASK-016/017). Tampoco implementa la
 * precondicion completa de rama base (seccion 8.3): eso es TASK-012,
 * igual que quedo pendiente para "taskctl start" en TASK-009.
 *
 * Lo que SI hace: validar la transicion, mover la tarea a
 * 01-en-diseno/, y dejar un scaffold de plan-final.md listo para que
 * un agente (o una persona, en uso interactivo real de Claude Code) lo
 * redacte — el mismo patron que "taskctl new" ya usa con el cuerpo de
 * tarea.md (Objetivo/Criterios en blanco para rellenar despues). El
 * contenido real del plan NO lo genera este CLI: no hay orquestacion
 * de agentes aqui todavia.
 */
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import type { Task } from '../core/task.js';
import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
import { assertTransitionAllowed } from '../core/state-machine.js';

export class PlanCommandError extends Error {}

export const PLAN_FINAL_FILENAME = 'plan-final.md';

export function planTemplate(task: Task): string {
  return (
    `# Plan — ${task.id}: ${task.titulo}\n\n` +
    '## Enfoque propuesto\n\n\n' +
    '## Alternativas consideradas\n\n' +
    '(Version minima de "taskctl plan", TASK-010: sin brainstorm multi-agente\n' +
    'todavia. Un solo agente redacta este plan. TASK-016 anadira brainstorm\n' +
    'en paralelo con roles distintos y un agente unificador para tareas de\n' +
    'complejidad media o mayor.)\n\n' +
    '## Riesgos o preguntas abiertas\n\n'
  );
}

export interface PlanCommandResult {
  id: string;
  filePath: string;
  planPath: string;
  /** false si plan-final.md ya existia (re-planificacion) y se dejo intacto. */
  planCreated: boolean;
}

export async function runPlanCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string
): Promise<PlanCommandResult> {
  const id = argv[0];
  if (id === undefined || id.trim() === '') {
    throw new PlanCommandError('[ERROR] Falta el ID de la tarea: taskctl plan TASK-NNN.');
  }

  const existing = await readTareaFile(tareasRoot, id);
  // assertTransitionAllowed lanza StateMachineError si existing es null
  // o si el estado/plan_aprobado actuales no permiten "plan" todavia —
  // en ambos casos no se llega a mover ni escribir nada.
  assertTransitionAllowed('plan', existing ? existing.task : null);
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  const updated: Task = { ...task, estado: 'en-diseno', actualizado: today };
  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);

  // plan-final.md no tiene frontmatter y no encaja en el modelo Task,
  // asi que no pasa por writeTareaFile/moveTareaFile (que son
  // especificas de tarea.md) — pero SI reusa isEexist de task-store.ts
  // en vez de duplicar la comprobacion (hallazgo de revision por
  // pares, TASK-010).
  const planPath = path.join(path.dirname(newFilePath), PLAN_FINAL_FILENAME);
  let planCreated = false;
  try {
    // flag 'wx': falla si ya existe, en vez de arriesgarse a pisar un
    // plan-final.md de una vuelta anterior (re-planificacion).
    await writeFile(planPath, planTemplate(task), { encoding: 'utf8', flag: 'wx' });
    planCreated = true;
  } catch (e: unknown) {
    if (!isEexist(e)) throw e;
  }

  return { id: task.id, filePath: newFilePath, planPath, planCreated };
}
