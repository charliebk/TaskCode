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
import { readFile } from 'node:fs/promises';
import { readTareaFile } from '../fs/task-store.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { resolverConfig, type ModoFlujo } from '../core/config.js';
import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
import { commitRevisadoDe, veredictoDeRonda, type VeredictoInforme } from '../core/informe-revision.js';
import {
  INFORME_REVISION_RE,
  informesDeUltimaRonda,
  nombresDeUltimaRonda,
} from '../fs/rondas.js';
import {
  currentBranch,
  isAncestor,
  localBranchExists,
  lsTreeNames,
  runGit,
  showFileAtRef,
} from '../fs/git.js';
import type { Task } from '../core/task.js';
import { REVISION_DIRNAME, PETICION_REVISION_RE } from './review.js';
import { INFORME_CODEX_RE } from './codex-review.js';
import { planRedactado } from './approve.js';

export class SiguienteCommandError extends Error {}

export interface SiguienteCommandDeps {
  repoCwd: string;
}

export interface SiguienteCommandResult extends SiguientePaso {
  id: string;
  estado: Task['estado'];
  modo: ModoFlujo;
  /** De donde se leyo la tarea: el working tree o la rama de la tarea. */
  leidaDe: 'working-tree' | 'rama';
  /** true si se pidio --json. */
  json: boolean;
}

/** Marcas de la plantilla del informe sin rellenar (IMP-1 de la revision de TASK-059). */
const MARCAS_PLANTILLA = ['Revisor: (rellenar', '(ej. IMP-1)'];

/**
 * ¿Lo aprobado es exactamente lo que se reviso? (TASK-059; CRIT-1 de su
 * revision). La referencia es el `Commit revisado` que el CLI escribe en la
 * peticion de la ronda, no el «ultimo commit de codigo»:
 * - no hay cambios fuera de `tareas/` entre ese commit y `ref`: el codigo que
 *   se va a mergear es el que vio el revisor. Esto cubre tambien el informe
 *   commiteado junto a codigo (ese codigo aparece en el diff), que antes se
 *   tapaba con el commit limpio de `taskctl veredicto`;
 * - cada informe se escribio despues de pedir la revision (algun commit lo
 *   toca desde el commit revisado);
 * - y no hay cambios sin commitear en esa carpeta.
 * `dirRevision` es la ruta POSIX relativa a la raiz del repo, acabada en /.
 */
function informeEnCommitPropio(
  ref: string,
  dirRevision: string,
  nombres: readonly string[],
  revisados: readonly (string | null)[],
  cwd: string
): boolean {
  if (nombres.length === 0 || revisados.length === 0) return false;
  if (ref === 'HEAD' && runGit(['status', '--porcelain', '--', dirRevision], cwd) !== '') return false;
  for (const revisado of revisados) {
    if (revisado === null || !isAncestor(revisado, ref, cwd)) return false;
    if (runGit(['diff', '--name-only', revisado, ref, '--', '.', ':(exclude)tareas/'], cwd) !== '') return false;
    for (const nombre of nombres) {
      const commits = runGit(['log', '--format=%H', `${revisado}..${ref}`, '--', dirRevision + nombre], cwd)
        .split('\n')
        .filter((c) => c !== '');
      if (commits.length === 0) return false;
    }
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
  const json = argv.includes('--json');
  const id = argv.find((a) => !a.startsWith('--'));
  if (id === undefined || id.trim() === '') {
    throw new SiguienteCommandError('[ERROR] Falta el ID de la tarea: taskctl siguiente TASK-NNN [--json].');
  }
  // Config roto: ConfigError, que el CLI convierte en salida != 0.
  const modoConfig = resolverConfig(deps.repoCwd).modo_flujo;

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
  // Informes de la ultima ronda (primaria y de Codex), con el MISMO criterio
  // de ronda en los dos caminos (nombresDeUltimaRonda), leidos de la rama o
  // del disco.
  let primarios: string[];
  let codex: string[];
  // Para la guarda del commit propio y el tope de rondas (TASK-059).
  let rondaRevision: number;
  let nombresPrimarios: string[];
  let dirRevisionRepo: string;
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
    dirRevisionRepo = dirRevision;
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
    dirRevisionRepo = `${path.relative(deps.repoCwd, revisionDir).split(path.sep).join('/')}/`;
    refInformes = 'HEAD';
    primarios = await Promise.all(ultima.nombres.map(leer));
    revisados = (
      await Promise.all((await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE)).nombres.map(leer))
    ).map((t) => commitRevisadoDe(t));
    codex = await Promise.all(
      (await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE)).nombres.map(leer)
    );
    if (task.estado === 'en-diseno') planEstaRedactado = await planRedactado(task, taskDir);
  }

  const ctx: ContextoFlujo = {
    planRedactado: planEstaRedactado,
    veredicto: veredictoDe(primarios),
    veredictoCodex: veredictoDe(codex),
    modoCongelado: modoCongelado(body) !== null,
    rondaRevision,
    informeEnCommitPropio:
      task.estado === 'en-revision' &&
      // IMP-1: un informe que conserva la plantilla no lo escribio ningun revisor.
      !primarios.some((t) => MARCAS_PLANTILLA.some((m) => t.includes(m))) &&
      informeEnCommitPropio(refInformes, dirRevisionRepo, nombresPrimarios, revisados, deps.repoCwd),
  };

  const modo = modoDeTarea(body, modoConfig);
  return {
    id: task.id,
    estado: task.estado,
    modo,
    leidaDe: enOtraRama ? 'rama' : 'working-tree',
    json,
    ...siguienteFase(task, ctx, modo),
  };
}
