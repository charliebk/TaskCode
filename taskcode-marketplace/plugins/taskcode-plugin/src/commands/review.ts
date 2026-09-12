/**
 * taskctl review — TASK-013 de PLAN_SPRINTS.md. Cierra la fase de
 * ejecucion y abre la de revision: trae los cambios de la rama base
 * con el script Git-Flow del tipo, verifica con evidencia Git que el
 * merge ocurrio (no lo supone), mueve la tarea a 03-en-revision/ y
 * deja en revision/ la peticion para el agente revisor generico (con
 * el diff real embebido) mas el scaffold de su informe.
 *
 * El CLI hace SOLO lo determinista: no invoca ningun LLM (decision
 * con Carlos, 2026-09-05 — mismo patron que el plan minimo de
 * TASK-010, donde el contenido lo redacta el agente que orquesta
 * Claude Code). La fragmentacion de revisores por dominio es TASK-018
 * y la puerta determinista build/lint/tests de la seccion 16
 * (correccion 5) queda para TASK-018/019.
 *
 * `ultimo_commit_revisado` NO se actualiza aqui a proposito: segun la
 * seccion 16.3 se actualiza cuando una revision TERMINA (informe
 * aprobado), no cuando se genera la peticion.
 */
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { Task } from '../core/task.js';
import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
import { siguienteRonda } from '../fs/rondas.js';
import { fenceFor } from '../core/markdown.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import {
  isWorkspaceClean,
  currentBranch,
  resolveBaseBranchForTipo,
  isAncestor,
  headCommit,
  logOneline,
  diffRange,
  diffNameOnly,
  diffRangeForPaths,
} from '../fs/git.js';
import {
  autoCommit,
  extraerPushFlag,
  mensajeChore,
  type AutoCommitResult,
} from '../fs/git-commit.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';
import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';

export class ReviewCommandError extends Error {}

const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
  feature: 'update-feature.sh',
  fix: 'update-fix.sh',
  hotfix: 'update-hotfix.sh',
  release: 'update-release.sh',
};

export const REVISION_DIRNAME = 'revision';

/**
 * Nombre de fichero de una ronda de revision, CON o SIN sufijo de
 * dominio (TASK-018). El sufijo es el nombre de la skill revisora
 * (`java-spring-reviewer`, etc.) y solo aparece cuando la ronda se
 * fragmento por dominio — mismo precedente que
 * `peticion-brainstorm-<rol>-<ronda>.md` (TASK-016, plan.ts). Una ronda
 * SIN fragmentar (0 dominios detectados, o mas del umbral) sigue dejando
 * el nombre de siempre, sin sufijo: es lo que ya prueban 8 de los tests
 * de review.test.ts y lo que finish.ts ya sabia leer antes de esta
 * tarea.
 */
const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;

export interface ReviewCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
  /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
  scriptsDir: string;
}

/**
 * Un par peticion/informe de una ronda de revision, con el revisor al
 * que se le asigno (TASK-018). Con la ronda SIN fragmentar hay un unico
 * elemento con `revisor` igual al nombre del revisor generico.
 */
export interface RevisionGrupo {
  /** Nombre de la skill revisora (de dominio, o el generico). */
  revisor: string;
  /** Ficheros del diff que le tocan a este grupo. */
  ficheros: readonly string[];
  peticionPath: string;
  informePath: string;
}

export interface ReviewCommandResult {
  id: string;
  rama: string;
  baseBranch: string;
  /** SHA de HEAD en el momento de generar la peticion. */
  commitRevisado: string;
  ronda: number;
  filePath: string;
  /**
   * Un elemento por revisor que interviene en esta ronda (TASK-018): uno
   * solo, con el generico, si el diff no se fragmento por dominio; uno
   * por dominio detectado (mas el generico, si sobran ficheros sin
   * dominio) si si se fragmento.
   */
  informes: readonly RevisionGrupo[];
  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
  autoCommit: AutoCommitResult;
}

/**
 * fenceFor se mudo a core/markdown.ts en TASK-016, cuando "plan"
 * empezo a embeber tambien texto de la persona en sus peticiones. Se
 * re-exporta desde aqui para no romper a quien la importe de este
 * modulo, que es donde nacio.
 */
export { fenceFor } from '../core/markdown.js';

/**
 * `agenteRevisor` y `nombreInforme` (TASK-018) los decide el
 * clasificador por dominio en runReviewCommand, NO `task.agente_revisor`
 * del frontmatter: ese era justo el defecto que esta tarea corrige (ver
 * el Objetivo de tarea.md). `alcanceDiff` es el titulo de la seccion del
 * diff embebido: "Diff completo" cuando la ronda no se fragmento,
 * "Diff de tu dominio" (con el recuento de ficheros) cuando si.
 */
export function peticionTemplate(
  task: Task,
  baseBranch: string,
  commitRevisado: string,
  ronda: number,
  fecha: string,
  commits: string,
  diff: string,
  agenteRevisor: string,
  nombreInforme: string,
  alcanceDiff: string
): string {
  const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
  const diffBlock = diff === '' ? '(sin diferencias respecto a la base)' : diff;
  const fence = fenceFor(commitsBlock, diffBlock);
  return (
    `# Peticion de revision — ${task.id} (ronda ${ronda})\n\n` +
    `- Tarea: ${task.id} — ${task.titulo}\n` +
    `- Rama revisada: ${task.rama}\n` +
    `- Rama base: ${baseBranch}\n` +
    `- Commit revisado (HEAD): ${commitRevisado}\n` +
    `- Fecha: ${fecha}\n` +
    `- Agente revisor sugerido: ${agenteRevisor}\n\n` +
    '## Instrucciones para el agente revisor\n\n' +
    'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
    'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
    'directorio temporal, corre la suite tu mismo y construye el caso que\n' +
    'rompe el codigo antes de reportarlo. Clasifica cada hallazgo como\n' +
    'CRITICO (perdida de datos, corrupcion de estado, el comando hace lo\n' +
    'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
    'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
    'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
    `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
    'peticion.\n\n' +
    `## Commits a revisar (git log ${baseBranch}..HEAD)\n\n` +
    `${fence}\n` +
    `${commitsBlock}\n` +
    `${fence}\n\n` +
    `## ${alcanceDiff}\n\n` +
    `${fence}diff\n` +
    `${diffBlock}\n` +
    `${fence}\n`
  );
}

export function informeTemplate(task: Task, commitRevisado: string, ronda: number): string {
  return (
    `# Informe de revision — ${task.id} (ronda ${ronda})\n\n` +
    `- Commit revisado: ${commitRevisado}\n` +
    '- Revisor: (rellenar por el agente)\n' +
    // taskctl finish exige que TODAS las lineas "- Veredicto:" del
    // informe aprueben: hay que SUSTITUIR esta linea, no anadir otra.
    '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados")\n\n' +
    '## Hallazgos\n\n' +
    '(CRITICO / IMPORTANTE / MENOR con reproduccion, o "sin hallazgos" explicito.)\n'
  );
}

export async function runReviewCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: ReviewCommandDeps
): Promise<ReviewCommandResult> {
  const { push, resto } = extraerPushFlag(argv);
  const id = resto[0];
  if (id === undefined || id.trim() === '') {
    throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
  }

  // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): sirve
  // para rechazo rapido sin tocar Git y para extraer tipo/rama —
  // metadata estable que ningun comando reescribe. La lectura que
  // decide la escritura va DESPUES del script, que cambia de rama.
  const initial = await readTareaFile(tareasRoot, id);
  assertTransitionAllowed('review', initial ? initial.task : null);
  const tipo = initial!.task.tipo;
  const rama = initial!.task.rama;

  // Mismo motivo que en start: el prompt interactivo de Git-Flow con
  // stdin no interactivo cancela en silencio (EOF => "No" => exit 0).
  if (!isWorkspaceClean(deps.repoCwd)) {
    throw new ReviewCommandError(
      `[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
        'Haz commit o stash antes de "taskctl review" — el update de Git-Flow necesita el ' +
        'workspace limpio y su prompt interactivo cancela en silencio sin terminal.'
    );
  }

  const scriptName = SCRIPT_BY_TYPE[tipo];
  const { code, signal } = runGitflowScript(scriptName, [rama], {
    scriptsDir: deps.scriptsDir,
    cwd: deps.repoCwd,
  });
  if (code !== 0) {
    const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
    throw new ReviewCommandError(
      `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
        'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo y haz commit ' +
        'antes de reintentar); la tarea no se ha movido de carpeta.'
    );
  }

  // Evidencia, no suposicion (TASK-007/009): rama activa correcta y
  // merge de la base ocurrido de verdad (la base es antepasada de
  // HEAD), no solo un exit 0 del script.
  const branchNow = currentBranch(deps.repoCwd);
  if (branchNow !== rama) {
    throw new ReviewCommandError(
      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
        `"${branchNow}", no "${rama}". No se actualiza la tarea; revisa el repo a mano.`
    );
  }
  const baseBranch = resolveBaseBranchForTipo(tipo, deps.repoCwd);
  if (!isAncestor(baseBranch, 'HEAD', deps.repoCwd)) {
    throw new ReviewCommandError(
      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${baseBranch}" NO esta ` +
        `integrada en "${rama}" (merge-base --is-ancestor lo niega). No se actualiza la ` +
        'tarea; revisa el repo a mano.'
    );
  }

  // Lectura FRESCA, ya con la rama de la tarea activa: la unica que
  // decide si se muta algo y con que contenido (regla de la doble
  // lectura — el update pudo traer de la base un tarea.md mas nuevo).
  const existing = await readTareaFile(tareasRoot, id);
  assertTransitionAllowed('review', existing ? existing.task : null);
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  const commitRevisado = headCommit(deps.repoCwd);
  const commits = logOneline(baseBranch, 'HEAD', deps.repoCwd);
  const diff = diffRange(baseBranch, 'HEAD', deps.repoCwd);

  // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
  // el diff real de la rama, no `task.agente_revisor` del frontmatter,
  // decide quien revisa. El catalogo se relee de skills/*/SKILL.md en
  // CADA ejecucion (sin cache: HALLAZGOS.md documenta que una copia
  // congelada de patrones_archivo ya diverguio dos veces).
  const ficherosTocados = diffNameOnly(baseBranch, 'HEAD', deps.repoCwd);
  const catalogoRevisores = cargarCatalogoRevisores();
  const plan = clasificarPorDominio(ficherosTocados, catalogoRevisores);

  const updated: Task = { ...task, estado: 'en-revision', actualizado: today };

  // Peticion + scaffold de informe ANTES de mover la tarea (hallazgo
  // IMPORTANTE de revision por pares, TASK-013): si una escritura
  // falla (EEXIST por colision case-insensitive en NTFS, permisos,
  // disco), la tarea sigue en-curso y reintentar es posible — el orden
  // inverso dejaba estado en-revision sin peticion ni salida, un
  // callejon de la maquina de estados. Se escriben en la carpeta
  // ACTUAL: el rename de moveTareaFile se lleva revision/ entera.
  // Flag 'wx' en ambos: la numeracion garantiza un hueco libre, y si
  // aun asi el fichero existiera, fallar ruidosamente es mejor que
  // pisar una revision anterior — mismo principio que plan-final.md.
  const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
  await mkdir(revisionDir, { recursive: true });
  const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);

  // Un par de nombres (con o sin sufijo de dominio) por grupo del plan.
  // Sin fragmentar hay un unico grupo y se usa el nombre de siempre, sin
  // sufijo: ninguna tarea que solo cae al generico cambia de convencion.
  const escrituras = plan.grupos.map((grupo) => {
    const sufijo = plan.fragmentado ? `-${grupo.revisor}` : '';
    return {
      revisor: grupo.revisor,
      ficheros: grupo.ficheros,
      nombrePeticion: `peticion-revision-${ronda}${sufijo}.md`,
      nombreInforme: `informe-revision-${ronda}${sufijo}.md`,
    };
  });

  try {
    for (const escritura of escrituras) {
      // Cada revisor recibe SOLO el subconjunto de su dominio (criterio
      // de aceptacion 3): un `git diff` filtrado por pathspec, no el
      // diff entero. Sin fragmentar, el unico grupo ya es "todos los
      // ficheros" y se reusa el diff completo ya calculado arriba, para
      // no repetir la misma llamada a Git dos veces.
      const diffDelGrupo = plan.fragmentado
        ? diffRangeForPaths(baseBranch, 'HEAD', escritura.ficheros, deps.repoCwd)
        : diff;
      const alcanceDiff = plan.fragmentado
        ? `Diff de tu dominio (${escritura.ficheros.length} fichero(s) de ` +
          `${ficherosTocados.length}; git diff ${baseBranch}..HEAD -- <tus ficheros>)`
        : `Diff completo (git diff ${baseBranch}..HEAD)`;

      await writeFile(
        path.join(revisionDir, escritura.nombrePeticion),
        peticionTemplate(
          updated,
          baseBranch,
          commitRevisado,
          ronda,
          today,
          commits,
          diffDelGrupo,
          escritura.revisor,
          escritura.nombreInforme,
          alcanceDiff
        ),
        { encoding: 'utf8', flag: 'wx' }
      );
      await writeFile(
        path.join(revisionDir, escritura.nombreInforme),
        informeTemplate(updated, commitRevisado, ronda),
        { encoding: 'utf8', flag: 'wx' }
      );
    }
  } catch (e: unknown) {
    if (!isEexist(e)) throw e;
    throw new ReviewCommandError(
      `[ERROR] ${id}: ya existe un fichero de la ronda ${ronda} en ${revisionDir} ` +
        '(¿restos con otro case en un filesystem case-insensitive?). La tarea NO se ha ' +
        'movido; limpia o renombra esos ficheros y reintenta.'
    );
  }

  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
  const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
  const informes: RevisionGrupo[] = escrituras.map((escritura) => ({
    revisor: escritura.revisor,
    ficheros: escritura.ficheros,
    peticionPath: path.join(newRevisionDir, escritura.nombrePeticion),
    informePath: path.join(newRevisionDir, escritura.nombreInforme),
  }));

  // Paso 5 de la 8.3 (TASK-030, item C2). "review" NO aplica
  // ensureBaseBranchReady, asi que en el arbol puede haber trabajo de
  // la persona junto al de taskctl: solo entran las dos carpetas de la
  // tarea (la de origen para que el movimiento se registre como tal, y
  // la de destino, que ya contiene revision/ con la peticion y el
  // scaffold del informe).
  const commitResult = autoCommit({
    cwd: deps.repoCwd,
    rutas: [path.dirname(filePath), path.dirname(newFilePath)],
    mensaje: mensajeChore(task.id, `peticion de revision ronda ${ronda}`),
    push,
  });

  return {
    autoCommit: commitResult,
    id: task.id,
    rama,
    baseBranch,
    commitRevisado,
    ronda,
    filePath: newFilePath,
    informes,
  };
}
