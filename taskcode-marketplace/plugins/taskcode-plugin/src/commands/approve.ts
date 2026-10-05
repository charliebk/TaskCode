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
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import type { Task } from '../core/task.js';
import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
import {
  registrarTransicion,
  modoCongelado,
  DECIDIDO_POR,
  type DecididoPor,
} from '../core/transiciones.js';
import { resolverConfig } from '../core/config.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { planTemplate, resolverPlanFinal, type PlanFinalUbicacion } from './plan.js';
import { readFile } from 'node:fs/promises';
import { ROLES_BRAINSTORM, seleccionarRoles } from '../core/roles-brainstorm.js';
import { planEsEsqueleto } from '../core/validacion-tarea.js';
import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
import {
  autoCommit,
  extraerPushFlag,
  mensajeChore,
  type AutoCommitResult,
} from '../fs/git-commit.js';

export class ApproveCommandError extends Error {}

/** Flags de `taskctl approve`: extraerDecididoPor y extraerPushFlag. */
export const FLAGS_APPROVE: readonly string[] = ['--decidido-por', '--push', '-p'];

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
  /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
  ahora?: string;
}

export async function runApproveCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: ApproveCommandDeps
): Promise<ApproveCommandResult> {
  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
  rechazarFlagsDesconocidos(argv, FLAGS_APPROVE, 'approve', (m) => new ApproveCommandError(m));
  // --push se saca ANTES de leer el ID: es booleano puro y va delante
  // o detras indistintamente ("taskctl approve --push TASK-030").
  const { push, resto: sinPush } = extraerPushFlag(argv);
  const { decididoPor, resto } = extraerDecididoPor(sinPush);
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

  // TASK-043 (C6 de la auditoria): no se aprueba un plan-final.md que es
  // la plantilla sin rellenar. Se compara con las plantillas posibles (los
  // roles se eligen en un orden fijo, asi que solo hay 0..N prefijos), no
  // con textos copiados, para que siga valiendo si la plantilla cambia.
  const rutaPlan = ubicacion!.canonicaExiste ? ubicacion!.canonica : ubicacion!.legada;
  if (await planEsPlantilla(task, rutaPlan)) {
    throw new ApproveCommandError(
      `[ERROR] ${task.id}: "${rutaPlan}" es la plantilla sin rellenar: no hay plan que aprobar. ` +
        'Redactalo (enfoque, riesgos, pruebas) y reintenta "taskctl approve".'
    );
  }

  // TASK-056: la aprobacion automatica solo vale si la tarea se planifico
  // en modo automatico (modo congelado en su registro). Cambiar el config
  // despues de plan no la habilita: firmaria un plan cuyas preguntas nadie
  // contesto pensando en un flujo sin persona.
  if (decididoPor === 'automatico') {
    const congelado = modoCongelado(body);
    if (congelado !== 'automatico') {
      throw new ApproveCommandError(
        `[ERROR] ${task.id}: no se puede aprobar como automatico: la tarea se planifico en modo ` +
          `"${congelado ?? 'sin registrar'}", no "automatico". La aprobacion la tiene que dar una ` +
          `persona: taskctl approve ${task.id} (sin --decidido-por automatico).`
      );
    }
  }

  const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
  // Reaprobar un plan ya aprobado no es una transicion: sin fila nueva, y
  // asi la segunda vez sigue sin crear commit (es idempotente).
  const conRegistro = task.plan_aprobado
    ? body
    : registrarTransicion(body, 'approve', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo, decididoPor);
  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);

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

/**
 * `--decidido-por persona|automatico` (TASK-056), en cualquier posicion
 * detras del ID; `--decidido-por=valor` tambien. Por defecto, persona. Un
 * valor desconocido aborta: no se adivina quien aprobo.
 */
function extraerDecididoPor(argv: readonly string[]): { decididoPor: DecididoPor; resto: string[] } {
  const resto: string[] = [];
  let valor: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a === '--decidido-por') {
      // Sin valor detras no se cae a "persona" en silencio.
      valor = argv[i + 1] ?? '';
      i++;
    } else if (a.startsWith('--decidido-por=')) {
      valor = a.slice('--decidido-por='.length);
    } else {
      resto.push(a);
    }
  }
  if (valor === undefined) return { decididoPor: 'persona', resto };
  if (!(DECIDIDO_POR as readonly string[]).includes(valor)) {
    throw new ApproveCommandError(
      `[ERROR] --decidido-por "${valor}" no es valido. Valores: ${DECIDIDO_POR.join(', ')}.`
    );
  }
  return { decididoPor: valor as DecididoPor, resto };
}

/**
 * ¿El plan-final.md es la plantilla sin rellenar? Se compara con las
 * plantillas posibles (los roles se eligen en un orden fijo, asi que solo
 * hay 0..N prefijos). Lo comparten approve y `taskctl siguiente` (TASK-056).
 */
export async function planEsPlantilla(task: Task, rutaPlan: string): Promise<boolean> {
  const plantillas = Array.from({ length: ROLES_BRAINSTORM.length + 1 }, (_, k) =>
    planTemplate(task, seleccionarRoles(k))
  );
  return planEsEsqueleto(await readFile(rutaPlan, 'utf8'), plantillas);
}

/** ¿La tarea tiene un plan-final.md redactado (existe y no es la plantilla)? */
export async function planRedactado(task: Task, taskDir: string): Promise<boolean> {
  const u = await resolverPlanFinal(taskDir);
  if (!planFinalExisteEn(u)) return false;
  return !(await planEsPlantilla(task, u.canonicaExiste ? u.canonica : u.legada));
}
