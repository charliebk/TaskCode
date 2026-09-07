/**
 * taskctl approve — TASK-011 de PLAN_SPRINTS.md. Checkpoint humano de
 * la fase de diseno (seccion 6 de la metodologia): marca
 * plan_aprobado: true una vez que plan-final.md existe, este en
 * `planificacion/` (ubicacion canonica desde TASK-027) o suelto en la
 * raiz de la carpeta (legado).
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
import type { Task } from '../core/task.js';
import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { resolverPlanFinal, type PlanFinalUbicacion } from './plan.js';
import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
import {
  autoCommit,
  extraerPushFlag,
  mensajeChore,
  type AutoCommitResult,
} from '../fs/git-commit.js';

export class ApproveCommandError extends Error {}

/**
 * Acepta el plan en CUALQUIERA de sus dos ubicaciones (TASK-027, item
 * C3): `planificacion/plan-final.md` (canonica) o suelto en la raiz de
 * la carpeta (legado del CLI anterior). Mirar solo la canonica dejaria
 * sin poder aprobarse a toda tarea planificada antes del cambio, que
 * es justo el caso que tiene el plan ya redactado.
 *
 * Con los DOS a la vez rechaza, en lugar de aprobar el primero que
 * encuentra (hallazgo MENOR de revision por pares, TASK-027): "plan" ya
 * trata ese estado como irresoluble y aborta, y dos merges --no-ff sin
 * conflicto bastan para producirlo. Aprobar a ciegas un estado con dos
 * planes divergentes es marcar como revisado un plan que quiza nadie
 * ha leido.
 */
/** true si hay un plan que aprobar en cualquiera de las dos ubicaciones. */
function planFinalExisteEn(u: PlanFinalUbicacion | null): boolean {
  return u !== null && (u.canonicaExiste || u.legadaExiste);
}

/**
 * Se llama DESPUES de assertTransitionAllowed, no antes (hallazgo MENOR
 * de revision por pares ronda 2, TASK-027): con la tarea en un estado
 * que no se puede aprobar, quejarse primero de la ambiguedad tapaba el
 * motivo real y mandaba a la persona a comparar dos planes que no
 * desbloquean nada. El estado manda; la ambiguedad es el siguiente
 * obstaculo, no el primero.
 */
function assertPlanNoAmbiguo(id: string, u: PlanFinalUbicacion): void {
  if (u.canonicaExiste && u.legadaExiste) {
    throw new ApproveCommandError(
      `[ERROR] ${id}: hay un plan-final.md en la raiz de la carpeta y otro en ` +
        `planificacion/. No se puede aprobar sin saber cual es el plan bueno. Compara ` +
        `"${u.legada}" con "${u.canonica}", deja solo el de planificacion/ ` +
        'y reintenta. No se ha tocado nada.'
    );
  }
}

export interface ApproveCommandResult {
  id: string;
  filePath: string;
  baseBranchGuard: BaseBranchGuardResult;
  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
  autoCommit: AutoCommitResult;
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
  // --push se saca ANTES de leer el ID: es booleano puro y va delante
  // o detras indistintamente ("taskctl approve --push TASK-030").
  const { push, resto } = extraerPushFlag(argv);
  const id = resto[0];
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
  const ubicacionInicial = initial ? await resolverPlanFinal(path.dirname(initial.filePath)) : null;
  assertTransitionAllowed('approve', initial ? initial.task : null, {
    planFinalExiste: planFinalExisteEn(ubicacionInicial),
  });
  assertPlanNoAmbiguo(id, ubicacionInicial!);

  // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
  // tiene cambios sin commitear, o si no puede cambiar de forma
  // automatica a la rama base esperada segun initial.task.tipo.
  const baseBranchGuard = ensureBaseBranchReady(initial!.task.tipo, deps.repoCwd);

  // Lectura FRESCA, ya en la rama base real — la unica que decide si
  // se marca plan_aprobado y con que contenido de partida (etiquetas,
  // asignado_a, etc. se preservan tal cual esten en la rama base, no
  // como estuvieran en la rama vieja de la lectura preliminar).
  const existing = await readTareaFile(tareasRoot, id);
  const ubicacion = existing ? await resolverPlanFinal(path.dirname(existing.filePath)) : null;
  assertTransitionAllowed('approve', existing ? existing.task : null, {
    planFinalExiste: planFinalExisteEn(ubicacion),
  });
  assertPlanNoAmbiguo(id, ubicacion!);
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);

  // Paso 5 de la 8.3 (TASK-030, item C2). "approve" no cambia el
  // estado de la tarea, asi que origen y destino son la MISMA carpeta;
  // se pasan las dos igualmente porque autoCommit deduplica y asi el
  // dia que approve mueva algo esto no se queda corto en silencio.
  const commitResult = autoCommit({
    cwd: deps.repoCwd,
    rutas: [path.dirname(filePath), path.dirname(newFilePath)],
    mensaje: mensajeChore(task.id, 'plan aprobado'),
    push,
  });

  return { id: task.id, filePath: newFilePath, baseBranchGuard, autoCommit: commitResult };
}
