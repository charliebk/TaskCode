/**
 * taskctl plan — TASK-010 de PLAN_SPRINTS.md. Version MINIMA de la
 * fase de diseno (seccion 6 de la metodologia): sin contexto
 * determinista desde docs/INDEX.md, sin gatekeeper barato (Haiku), sin
 * seleccion de skill (6.6), sin brainstorm multi-agente en paralelo —
 * todo eso es Sprint 3 (TASK-016/017). Tampoco implementa la
 * precondicion completa de rama base (seccion 8.3) SI la aplica desde
 * TASK-012 (ensureBaseBranchReady, antes de mover nada) — lo que
 * quedo pendiente para "taskctl start" en TASK-009 (seccion 8.3 no
 * aplica a start, que ya cambia de rama como parte de su propio
 * trabajo).
 *
 * Lo que SI hace: validar la transicion, mover la tarea a
 * 01-en-diseno/, y dejar un scaffold de planificacion/plan-final.md
 * (la subcarpeta es de TASK-027, item C3) listo para que
 * un agente (o una persona, en uso interactivo real de Claude Code) lo
 * redacte — el mismo patron que "taskctl new" ya usa con el cuerpo de
 * tarea.md (Objetivo/Criterios en blanco para rellenar despues). El
 * contenido real del plan NO lo genera este CLI: no hay orquestacion
 * de agentes aqui todavia.
 */
import path from 'node:path';
import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
import { parseArgs } from '../cli/args.js';
import {
  parseAsignadoAFlag,
  identidadUsable,
  PISTA_VACIO_ESCRITURA,
} from '../cli/asignado.js';
import type { Task } from '../core/task.js';
import { readTareaFile, moveTareaFile, isEexist, isEnoent } from '../fs/task-store.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
import { resolverAsignado } from '../core/wip.js';

export class PlanCommandError extends Error {}

export const PLAN_FINAL_FILENAME = 'plan-final.md';

/**
 * Subcarpeta de artefactos de diseno dentro de la carpeta de la tarea
 * (TASK-027, item C3). La seccion 2 de la metodologia describe cada
 * carpeta de tarea como `tarea.md` + `planificacion/` + `revision/`;
 * `revision/` ya la crea "taskctl review" (REVISION_DIRNAME en
 * review.ts) y esta es la otra mitad.
 *
 * Se crea BAJO DEMANDA, cuando hay algo que escribir dentro, no en
 * "new"/"import": Git no versiona directorios vacios, asi que crearla
 * al dar de alta la tarea no llegaria al repo sin un .gitkeep que
 * nadie ha pedido, y de paso ensuciaria el workspace de quien solo
 * queria dar de alta una tarea. Mismo criterio que ya sigue
 * `revision/`.
 */
export const PLANIFICACION_DIRNAME = 'planificacion';

async function existeFichero(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch (e: unknown) {
    if (isEnoent(e)) return false;
    throw e;
  }
}

export interface PlanFinalUbicacion {
  /** Ruta canonica desde TASK-027: <carpeta>/planificacion/plan-final.md */
  canonica: string;
  /** Ruta legada (CLI anterior a TASK-027): <carpeta>/plan-final.md */
  legada: string;
  canonicaExiste: boolean;
  legadaExiste: boolean;
}

/**
 * Dice donde esta el plan de una tarea, mirando las DOS ubicaciones
 * posibles. Existe porque toda tarea planificada antes de TASK-027
 * tiene su `plan-final.md` suelto en la raiz de la carpeta: si el
 * codigo nuevo mirase solo la ruta canonica, "taskctl approve" diria
 * "todavia no hay plan que aprobar" sobre una tarea que si lo tiene, y
 * la dejaria bloqueada en la maquina de estados.
 *
 * Lo comparten "plan" (que migra el legado) y "approve" (que acepta
 * cualquiera de las dos), para que no puedan divergir.
 */
export async function resolverPlanFinal(taskDir: string): Promise<PlanFinalUbicacion> {
  const canonica = path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
  const legada = path.join(taskDir, PLAN_FINAL_FILENAME);
  return {
    canonica,
    legada,
    canonicaExiste: await existeFichero(canonica),
    legadaExiste: await existeFichero(legada),
  };
}

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
  /**
   * true si esta invocacion movio un plan-final.md legado (suelto en la
   * raiz de la carpeta, CLI anterior a TASK-027) a `planificacion/`.
   */
  planMigrado: boolean;
  /** asignado_a resultante en el frontmatter (null si sigue sin asignar). */
  asignadoA: string | null;
  /** true si esta invocacion cambio asignado_a (se paso --asignado-a con otro valor). */
  asignadoCambiado: boolean;
  /** Aviso si la identidad Git existe pero no sirve como asignado_a; null si no aplica. */
  avisoIdentidad: string | null;
  baseBranchGuard: BaseBranchGuardResult;
}

export interface PlanCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
}

export async function runPlanCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: PlanCommandDeps
): Promise<PlanCommandResult> {
  // El ID sale de los POSICIONALES, no de argv[0] a secas (item B6):
  // con "--asignado-a" en juego, "taskctl plan --asignado-a carlos
  // TASK-001" tiene que funcionar igual que con el flag detras. De
  // paso, un "taskctl plan --loquesea" ya no se cuela como ID para
  // morir mas abajo con un InvalidTaskIdError que cli.ts no captura.
  const { positional } = parseArgs(argv);
  const id = positional[0];
  if (id === undefined || id.trim() === '') {
    throw new PlanCommandError('[ERROR] Falta el ID de la tarea: taskctl plan TASK-NNN.');
  }

  // Se parsea ANTES de tocar Git: un flag mal escrito no debe llegar a
  // cambiar de rama ni a mover carpetas antes de fallar.
  const asignadoA = parseAsignadoAFlag(
    argv,
    (m) => new PlanCommandError(m),
    PISTA_VACIO_ESCRITURA
  );

  // Lectura PRELIMINAR, contra la rama activa en este momento — que
  // puede no ser la rama base real si alguien invoca "plan" desde una
  // rama de feature vieja. Sirve solo para (a) rechazar rapido, sin
  // tocar Git, un caso ya claramente invalido en esta rama, y (b)
  // conocer task.tipo para poder resolver la rama base. NO se usa para
  // nada mas: ni su "body"/"filePath" ni un "aprobado en esta lectura"
  // se llevan a la escritura de mas abajo (hallazgo CRITICO de
  // revision por pares, TASK-012 — antes de este fix, una lectura
  // hecha en una rama vieja podia acabar escribiendose encima del
  // contenido real de la rama base tras el cambio automatico, o
  // disparar un TaskFolderConflictError falso comparando la carpeta
  // vieja con la carpeta real de la rama base).
  const initial = await readTareaFile(tareasRoot, id);
  assertTransitionAllowed('plan', initial ? initial.task : null);

  // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
  // tiene cambios sin commitear, o si no puede cambiar de forma
  // automatica a la rama base esperada segun task.tipo. task.tipo es
  // metadata estable que ningun comando de taskctl reescribe, asi que
  // usar la lectura preliminar para esto es seguro aunque sea de antes
  // del cambio de rama.
  const baseBranchGuard = ensureBaseBranchReady(initial!.task.tipo, deps.repoCwd);

  // Lectura FRESCA, ya en la rama base real (si hubo cambio, aqui es
  // donde se nota) — esta es la unica que decide si se muta algo y con
  // que contenido. Puede rechazar aunque la preliminar de arriba haya
  // pasado (p. ej. otra persona ya avanzo la tarea en la rama base
  // mientras tanto) o aceptar como re-planificacion legitima un caso
  // que en la rama vieja parecia otra cosa.
  const existing = await readTareaFile(tareasRoot, id);
  assertTransitionAllowed('plan', existing ? existing.task : null);
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  // asignado_a se resuelve contra la lectura FRESCA (la de justo
  // arriba), no contra la preliminar: otra persona pudo cambiarlo en la
  // rama base mientras tanto, y decidir "cambio o no" con la lectura
  // vieja daria un asignadoCambiado mentiroso — la misma regla de doble
  // lectura que obliga TASK-012.
  // Precedencia (TASK-024): flag > asignado_a previo > identidad Git >
  // null. Sin flag se CONSERVA lo que hubiera ("no lo has mencionado"
  // no es "quitalo"), y solo si no habia nada entra la identidad de
  // quien ejecuta.
  // identidadUsable filtra la identidad Git con las MISMAS reglas que
  // el flag (hallazgo CRITICO de revision por pares, TASK-024): un
  // user.email con un salto de linea dentro inyectaba claves en el
  // frontmatter y llegaba a pisar 'estado'. Una identidad invalida no
  // aborta el comando — quien ejecuta no ha pedido nada raro — pero se
  // ignora y se avisa.
  const { identidad, aviso: avisoIdentidad } = identidadUsable(gitUserEmail(deps.repoCwd));
  const asignadoFinal = resolverAsignado(asignadoA, task.asignado_a, identidad);
  const asignadoCambiado = asignadoFinal !== task.asignado_a;

  const updated: Task = {
    ...task,
    estado: 'en-diseno',
    asignado_a: asignadoFinal,
    actualizado: today,
  };

  // El plan se escribe/migra en la carpeta ACTUAL, ANTES de mover la
  // tarea de estado — mismo orden y mismo motivo que "review" con
  // revision/ (TASK-013): si una escritura falla, la tarea no se ha
  // movido todavia y reintentar es posible, en vez de dejarla en
  // en-diseno sin plan. El rename de moveTareaFile se lleva despues
  // la subcarpeta entera.
  const taskDir = path.dirname(filePath);
  const ubicacion = await resolverPlanFinal(taskDir);

  // Fail-closed (TASK-027): con los dos ficheros a la vez no hay forma
  // de saber cual es el plan bueno, y elegir por nuestra cuenta puede
  // tirar el que la persona redacto. Se aborta ANTES de tocar nada.
  if (ubicacion.canonicaExiste && ubicacion.legadaExiste) {
    throw new PlanCommandError(
      `[ERROR] ${task.id}: hay un ${PLAN_FINAL_FILENAME} en la raiz de la carpeta y otro ` +
        `en ${PLANIFICACION_DIRNAME}/. No se puede saber cual es el plan bueno. Compara ` +
        `"${ubicacion.legada}" con "${ubicacion.canonica}", deja solo el de ` +
        `${PLANIFICACION_DIRNAME}/ y reintenta. La tarea no se ha movido.`
    );
  }

  // plan-final.md no tiene frontmatter y no encaja en el modelo Task,
  // asi que no pasa por writeTareaFile/moveTareaFile (que son
  // especificas de tarea.md) — pero SI reusa isEexist de task-store.ts
  // en vez de duplicar la comprobacion (hallazgo de revision por
  // pares, TASK-010).
  await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME), { recursive: true });
  let planCreated = false;
  let planMigrado = false;
  if (ubicacion.legadaExiste) {
    // Tarea planificada con el CLI anterior a TASK-027: el plan real
    // (redactado o no) esta suelto en la raiz. Se MUEVE, no se copia
    // ni se pisa con el scaffold — perder un plan redactado seria
    // exactamente el fallo que este item viene a evitar.
    await rename(ubicacion.legada, ubicacion.canonica);
    planMigrado = true;
  } else if (!ubicacion.canonicaExiste) {
    try {
      // flag 'wx': falla si ya existe, en vez de arriesgarse a pisar un
      // plan-final.md de una vuelta anterior (re-planificacion). La
      // comprobacion previa no lo hace redundante: entre stat y write
      // puede aparecer el fichero, y aqui perder contenido es el peor
      // resultado posible.
      await writeFile(ubicacion.canonica, planTemplate(task), { encoding: 'utf8', flag: 'wx' });
      planCreated = true;
    } catch (e: unknown) {
      if (!isEexist(e)) throw e;
    }
  }

  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
  const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);

  return {
    id: task.id,
    filePath: newFilePath,
    planPath,
    planCreated,
    planMigrado,
    asignadoA: asignadoFinal,
    asignadoCambiado,
    avisoIdentidad,
    baseBranchGuard,
  };
}
