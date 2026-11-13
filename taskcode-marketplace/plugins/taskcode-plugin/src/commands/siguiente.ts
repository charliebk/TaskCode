/**
 * `taskctl siguiente TASK-NNN [--json]` — TASK-056.
 *
 * Dice que fase toca y que hacer con ella (detener, preguntar o continuar)
 * segun el estado de la tarea y su modo de flujo. Es lo que leen las fases
 * guiadas: ellas no deciden, ejecutan lo que esto devuelve. Solo lee: no
 * escribe ni commitea nada.
 *
 * DE DONDE LEE. Del working tree, salvo un caso: si la tarea tiene su rama
 * en local, no se esta en ella y esa rama no esta integrada en la actual,
 * la tarea vive alli (desde `start`, la rama base solo tiene la copia
 * anterior). Entonces se lee de la rama con `git show`, tarea y revision/.
 * Asi `siguiente` da lo mismo desde la rama base que desde la de la tarea.
 */
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { readFile } from 'node:fs/promises';
import { readTareaFile } from '../fs/task-store.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { resolverConfig, type CierrePorDefecto, type ModoFlujo } from '../core/config.js';
import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
import {
  commitRevisadoDe,
  informeRellenado,
  veredictoDeRonda,
  type VeredictoInforme,
} from '../core/informe-revision.js';
import {
  INFORME_CODEX_RE,
  INFORME_REVISION_RE,
  PETICION_REVISION_RE,
  informesDeUltimaRonda,
  nombresDeUltimaRonda,
} from '../fs/rondas.js';
import {
  currentBranch,
  isAncestor,
  localBranchExists,
  lsTreeNames,
  mergeBase,
  resolveBaseBranchForTipo,
  runGit,
  showFileAtRef,
} from '../fs/git.js';
import { excluirDeRevision, revisoresDelRango } from '../fs/revisores-rango.js';
import type { Task } from '../core/task.js';
import { REVISION_DIRNAME } from './review.js';
import { estadoCorreccionPosterior, type EstadoCorreccion } from './verificar-menores.js';
import { bloqueantesAbiertos, fueraDeAlcance, menoresAbiertos } from '../core/menores.js';
import { duracionDelPlan, planRedactado } from './approve.js';
import type { LecturaDuracion } from '../core/duracion-estimada.js';

export class SiguienteCommandError extends Error {}

/** Flags de `taskctl siguiente`: solo --json. */
export const FLAGS_SIGUIENTE: readonly string[] = ['--json'];

export interface SiguienteCommandDeps {
  repoCwd: string;
}

export interface SiguienteCommandResult extends SiguientePaso {
  id: string;
  estado: Task['estado'];
  modo: ModoFlujo;
  /**
   * TASK-060: `cierre_por_defecto` del config. Lo lee la skill `finish` en el
   * modo automatico para decidir, sin preguntar, entre merge y merge request.
   */
  cierre: CierrePorDefecto;
  /** De donde se leyo la tarea: el working tree o la rama de la tarea. */
  leidaDe: 'working-tree' | 'rama';
  /** true si se pidio --json. */
  json: boolean;
  /**
   * TASK-082: solo con `fase: review`. Las skills revisoras que repartiria
   * `review` para TODA la tarea (desde la merge base con su rama base), con
   * el mismo clasificador: las listas `## Que se revisa` que pasa el
   * implementador en su autorrevision. Ausente si no se puede calcular (la
   * rama de la tarea no esta en local, o Git falla): no rompe `siguiente`.
   */
  revisores?: string[];
}

/**
 * ¿Lo aprobado es exactamente lo que se reviso? (TASK-059; CRIT-1 de su
 * revision). La referencia es el `Commit revisado` que el CLI escribe en la
 * peticion de la ronda, no el «ultimo commit de codigo»:
 * - no hay cambios fuera de `tareas/` entre ese commit y `ref`, en TODO el
 *   repo (`:(top)`, no solo bajo el cwd: MEN-7): el codigo que se va a
 *   mergear es el que vio el revisor. Esto cubre tambien el informe
 *   commiteado junto a codigo (ese codigo aparece en el diff), que antes se
 *   tapaba con el commit limpio de `taskctl veredicto`.
 * TASK-119: un informe sin commitear en `revision/` ya no lo impide: desde
 * que `veredicto` no commitea es lo normal, y lo absorbe el commit de
 * `finish`. Lo que se integra sigue siendo el codigo que vio el revisor.
 * Que el informe no sea la plantilla lo comprueba `informeRellenado`.
 */
function informeEnCommitPropio(
  ref: string,
  nombres: readonly string[],
  revisados: readonly (string | null)[],
  cwd: string
): boolean {
  if (nombres.length === 0 || revisados.length === 0) return false;
  const tareasDesdeLaRaiz = `${runGit(['rev-parse', '--show-prefix'], cwd)}tareas/`;
  for (const revisado of revisados) {
    if (revisado === null || !isAncestor(revisado, ref, cwd)) return false;
    const cambios = runGit(
      ['diff', '--name-only', revisado, ref, '--', ':(top)', `:(top,exclude)${tareasDesdeLaRaiz}`],
      cwd
    );
    if (cambios !== '') return false;
  }
  return true;
}

/** Veredicto de una ronda a partir de sus informes; null si no hay ninguno. */
function veredictoDe(informes: readonly string[]): VeredictoInforme | null {
  return informes.length === 0 ? null : veredictoDeRonda(informes);
}

export async function runSiguienteCommand(
  tareasRoot: string,
  argv: readonly string[],
  deps: SiguienteCommandDeps
): Promise<SiguienteCommandResult> {
  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
  rechazarFlagsDesconocidos(argv, FLAGS_SIGUIENTE, 'siguiente', (m) => new SiguienteCommandError(m));
  const json = argv.includes('--json');
  const id = argv.find((a) => !a.startsWith('--'));
  if (id === undefined || id.trim() === '') {
    throw new SiguienteCommandError('[ERROR] Falta el ID de la tarea: taskctl siguiente TASK-NNN [--json].');
  }
  // Config roto: ConfigError, que el CLI convierte en salida != 0.
  const config = resolverConfig(deps.repoCwd);
  const modoConfig = config.modo_flujo;

  const local = await readTareaFile(tareasRoot, id);
  if (local === null) {
    throw new SiguienteCommandError(
      `[ERROR] ${id}: no se encuentra en el working tree de la rama actual. ` +
        'Si existe en otra rama, cambiate a esa rama o a la rama base y reintenta.'
    );
  }

  const rama = local.task.rama;
  const enOtraRama =
    currentBranch(deps.repoCwd) !== rama &&
    localBranchExists(rama, deps.repoCwd) &&
    !isAncestor(rama, 'HEAD', deps.repoCwd);

  let task: Task;
  let body: string;
  let planEstaRedactado = true;
  // TASK-097: la duracion estimada del plan (solo en-diseno con plan redactado).
  let duracionEstimada: LecturaDuracion | undefined;
  // Informes de la ultima ronda (primaria y de Codex), con el MISMO criterio
  // de ronda en los dos caminos (nombresDeUltimaRonda), leidos de la rama o
  // del disco.
  let primarios: string[];
  let codex: string[];
  // Para la guarda del commit propio y el tope de rondas (TASK-059).
  let rondaRevision: number;
  let nombresPrimarios: string[];
  let refInformes: string;
  let revisados: (string | null)[];
  if (enOtraRama) {
    const enRama = lsTreeNames(rama, 'tareas', deps.repoCwd);
    const rutaTarea = enRama.find((n) => n.endsWith(`/${id}/tarea.md`));
    if (rutaTarea === undefined) {
      throw new SiguienteCommandError(
        `[ERROR] ${id}: la rama "${rama}" existe pero no contiene la tarea. Revisa la rama a mano.`
      );
    }
    ({ task, body } = parseTareaFile(showFileAtRef(rama, rutaTarea, deps.repoCwd)));
    const dirRevision = `${path.posix.dirname(rutaTarea)}/${REVISION_DIRNAME}/`;
    const nombres = enRama
      .filter((n) => n.startsWith(dirRevision))
      .map((n) => n.slice(dirRevision.length));
    const leer = (n: string) => showFileAtRef(rama, dirRevision + n, deps.repoCwd);
    // En la rama la tarea ya paso por start: el plan dejo de importar.
    const ultima = nombresDeUltimaRonda(nombres, INFORME_REVISION_RE);
    rondaRevision = ultima.ronda;
    nombresPrimarios = ultima.nombres;
    refInformes = rama;
    primarios = ultima.nombres.map(leer);
    revisados = nombresDeUltimaRonda(nombres, PETICION_REVISION_RE).nombres.map((n) => commitRevisadoDe(leer(n)));
    codex = nombresDeUltimaRonda(nombres, INFORME_CODEX_RE).nombres.map(leer);
  } else {
    ({ task, body } = local);
    const taskDir = path.dirname(local.filePath);
    const revisionDir = path.join(taskDir, REVISION_DIRNAME);
    const leer = (n: string) => readFile(path.join(revisionDir, n), 'utf8');
    const ultima = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
    rondaRevision = ultima.ronda;
    nombresPrimarios = ultima.nombres;
    refInformes = 'HEAD';
    primarios = await Promise.all(ultima.nombres.map(leer));
    revisados = (
      await Promise.all((await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE)).nombres.map(leer))
    ).map((t) => commitRevisadoDe(t));
    codex = await Promise.all(
      (await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE)).nombres.map(leer)
    );
    if (task.estado === 'en-diseno') {
      planEstaRedactado = await planRedactado(task, taskDir);
      if (planEstaRedactado) duracionEstimada = await duracionDelPlan(taskDir);
    }
  }

  const veredicto = veredictoDe(primarios);
  // IMP-1: un informe que conserva la plantilla no lo escribio ningun revisor.
  const rellenados = primarios.every(informeRellenado);
  // TASK-099: con la ronda aprobada, que paso despues del Commit revisado.
  let correccion: EstadoCorreccion | null = null;
  if (task.estado === 'en-revision' && veredicto === 'aprobada') {
    const revisado = revisados.find((c) => c !== null) ?? null;
    try {
      correccion = estadoCorreccionPosterior(body, rondaRevision, revisado, refInformes, deps.repoCwd);
    } catch {
      correccion = null; // un SHA que Git no conoce: sin referencia, como antes
    }
  }
  const alDia = correccion?.alDia === true;
  // Con una verificacion ligera al dia, lo que se cierra se compara con lo
  // verificado (que ya cubre lo revisado), no con el Commit revisado.
  const referencias =
    alDia && correccion?.verificacion != null ? [correccion.verificacion.commitVerificado] : revisados;
  const enCommitPropio =
    task.estado === 'en-revision' &&
    rellenados &&
    informeEnCommitPropio(refInformes, nombresPrimarios, referencias, deps.repoCwd);

  const menores = menoresAbiertos(primarios);
  const ctx: ContextoFlujo = {
    planRedactado: planEstaRedactado,
    ...(duracionEstimada === undefined ? {} : { duracionEstimada }),
    veredicto,
    veredictoCodex: veredictoDe(codex),
    modoCongelado: modoCongelado(body) !== null,
    rondaRevision,
    informeEnCommitPropio: enCommitPropio,
    ...(task.estado === 'en-revision' && veredicto === 'aprobada'
      ? {
          bloqueantesAbiertos: bloqueantesAbiertos(primarios).length,
          menoresAbiertos: menores.length,
          verificacionLigeraAlDia: alDia,
          correccionSinVerificar:
            !enCommitPropio &&
            !alDia &&
            rellenados &&
            correccion !== null &&
            correccion.cambiados.length > 0 &&
            // IMP-1 de la revision: solo si son correcciones de MENORES que
            // verificar-menores aceptara; codigo ajeno lo decide una persona.
            menores.length > 0 &&
            fueraDeAlcance(correccion.cambiados, menores).length === 0,
        }
      : {}),
  };

  const modo = modoDeTarea(body, modoConfig);
  const paso = siguienteFase(task, ctx, modo);
  const resultado: SiguienteCommandResult = {
    id: task.id,
    estado: task.estado,
    modo,
    cierre: config.cierre_por_defecto,
    leidaDe: enOtraRama ? 'rama' : 'working-tree',
    json,
    ...paso,
  };
  if (paso.fase === 'review') {
    const ref = enOtraRama ? rama : currentBranch(deps.repoCwd) === rama ? 'HEAD' : null;
    const revisores = ref === null ? null : revisoresDeLaTarea(task, ref, config.excluir_de_revision, deps.repoCwd);
    if (revisores !== null) resultado.revisores = revisores;
  }
  return resultado;
}

/**
 * TASK-082: revisoras de toda la tarea, desde la merge base con su rama base
 * hasta `ref`. La merge base y no la punta de la base: antes de `review` la
 * base aun no esta integrada y `base..ref` meteria lo que la base trajo
 * despues. null si Git no puede calcularlo: `siguiente` decide el paso y no
 * debe caerse por un dato auxiliar.
 */
function revisoresDeLaTarea(
  task: Task,
  ref: string,
  excluirConfig: readonly string[],
  cwd: string
): string[] | null {
  try {
    const desde = mergeBase(resolveBaseBranchForTipo(task.tipo, cwd), ref, cwd);
    return revisoresDelRango(desde, ref, excluirDeRevision(excluirConfig), cwd);
  } catch {
    return null;
  }
}
