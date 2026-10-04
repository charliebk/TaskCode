/**
 * taskctl finish — TASK-014 de PLAN_SPRINTS.md. Cierra el ciclo de
 * vida de una tarea: exige revision aprobada (fuente determinista: la
 * linea "Veredicto:" del ultimo informe de revision), mergea la rama
 * con el script Git-Flow del tipo (tag + backmerge para
 * hotfix/release), verifica con evidencia Git que los merges
 * ocurrieron, detecta la colision de IDs entre main y develop ANTES de
 * mergear (riesgo documentado en TASK-012), mueve la carpeta a
 * 04-terminadas/ y renderiza CHANGELOG.md, docs/INDEX.md y
 * docs/BOARD.md desde el frontmatter — plantillas deterministas, cero
 * LLM (correccion de la seccion 16 de la metodologia).
 *
 * Desde TASK-030 (item C2) tambien cumple el paso 5 de la seccion 8.3:
 * commitea lo que acaba de escribir — la carpeta de la tarea y los tres
 * artefactos de cierre, y nada mas — sobre develop, que es donde
 * termina el comando. Con --push sube ademas la rama.
 *
 */
import path from 'node:path';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import type { Task } from '../core/task.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { TaskValidationError } from '../core/task.js';
import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
import { veredictoAprobado } from '../core/informe-revision.js';
import { casillasSinMarcar } from '../core/validacion-tarea.js';
import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
import {
  isWorkspaceClean,
  currentBranch,
  isAncestor,
  resolveMainBranch,
  lsTreeNames,
  showFileAtRef,
  mergeBase,
  checkoutBranch,
  resolveIntegrationBranch,
  localBranchExists,
} from '../fs/git.js';
import {
  autoCommit,
  extraerPushFlag,
  mensajeChore,
  type AutoCommitResult,
} from '../fs/git-commit.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';
import { runBoardCommand, boardFilePath } from './board.js';
import { renderBoardMarkdown } from '../core/board-format.js';
import { REVISION_DIRNAME } from './review.js';

export class FinishCommandError extends Error {}

const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
  feature: 'merge-feature-to-develop.sh',
  fix: 'merge-fix-to-develop.sh',
  hotfix: 'merge-hotfix-to-main.sh',
  release: 'merge-release-to-main.sh',
};

/** hotfix/release mergean a main (con tag) y backmergean a la rama de integracion. */
const MERGEA_A_MAIN: Record<Task['tipo'], boolean> = {
  feature: false,
  fix: false,
  hotfix: true,
  release: true,
};

/**
 * TASK-018: una ronda de revision fragmentada por dominio deja N
 * informes, uno por revisor, con el nombre de la skill como sufijo
 * (p. ej. `informe-revision-2-java-spring-reviewer.md`). El sufijo es
 * OPCIONAL a proposito: una ronda sin fragmentar (0 dominios detectados,
 * o mas del umbral) sigue dejando `informe-revision-<N>.md` sin sufijo,
 * igual que antes de esta tarea — ninguna tarea ya cerrada, ni ninguna
 * en curso con revisiones antiguas, deja de reconocerse.
 */
const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;

// El gate de veredicto vive en core/informe-revision.ts desde TASK-040;
// se reexporta aqui para no romper a quien lo importa de finish.
export { veredictoAprobado } from '../core/informe-revision.js';

/**
 * Contenidos de TODOS los informes de la ronda con mayor N segun `re`,
 * o [] si no hay ninguno. Antes de TASK-018 una ronda tenia como mucho
 * UN informe por convencion (`re` solo casaba ese nombre exacto), asi
 * que "el de mayor N" y "todos los de mayor N" coincidian; con la
 * revision fragmentada por dominio una misma ronda puede dejar varios
 * ficheros con el MISMO N (uno por revisor) y hay que devolverlos
 * todos, no solo el primero que se encuentre.
 */
async function informesDeLaRonda(revisionDir: string, re: RegExp): Promise<string[]> {
  const { nombres } = await informesDeUltimaRonda(revisionDir, re);
  return Promise.all(nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8')));
}

/**
 * Contexto de aprobacion para la maquina de estados, derivado de los
 * informes de revision/ de la carpeta de la tarea. La convencion del
 * informe de Codex (informe-codex-<n>.md) la producira TASK-020; leerla
 * ya aqui deja a finish preparado sin acoplarse a ese comando.
 *
 * TASK-018: si la ronda de revision primaria se fragmento por dominio,
 * "aprobada" exige que TODOS los informes de esa ronda aprueben, no solo
 * uno — fail-closed: que falte AUNQUE SEA UNO de los N (o que su
 * veredicto siga en PENDIENTE) basta para que la tarea no pueda
 * cerrarse. El informe de Codex sigue sin fragmentarse (TASK-020 es un
 * unico agente independiente, no un enrutado por dominio), pero se
 * reusa la misma funcion: con un solo fichero por ronda el resultado es
 * identico al de antes de esta tarea.
 */
async function buildTransitionContext(taskDir: string): Promise<TransitionContext> {
  const revisionDir = path.join(taskDir, REVISION_DIRNAME);
  const informes = await informesDeLaRonda(revisionDir, INFORME_REVISION_RE);
  const informesCodex = await informesDeLaRonda(revisionDir, INFORME_CODEX_RE);
  return {
    revisionPrimariaAprobada: informes.length > 0 && informes.every((i) => veredictoAprobado(i)),
    revisionCodexAprobada: informesCodex.length > 0 && informesCodex.every((i) => veredictoAprobado(i)),
  };
}

interface ColisionId {
  path: string;
  motivo: 'titulo-distinto' | 'linaje-divergente' | 'ilegible';
}

/**
 * Colision de IDs (riesgo documentado en TASK-012): el mismo TASK-NNN
 * puede existir en `ref` con dos formas de romper el merge:
 *
 * - OTRA tarea (titulo distinto) numerada igual en un linaje que no
 *   comparte tareas/ (un hotfix numerado sobre main mientras develop ya
 *   usaba ese ID): mergear mezclaria dos tareas bajo un numero.
 * - La MISMA tarea (mismo titulo) pero anadida en `ref` por un commit
 *   que NO es ancestro comun con la rama (hallazgo IMPORTANTE de
 *   revision por pares, TASK-014): sin historia compartida el merge es
 *   add+add, no un rename — las dos carpetas sobreviven y develop queda
 *   con el ID duplicado en dos carpetas de estado a la vez.
 *
 * El caso normal (feature/fix cuya carpeta vive en `ref` en una carpeta
 * de estado anterior) no dispara nada: ahi la copia de `ref` SI esta en
 * el ancestro comun y Git resuelve el movimiento como rename.
 */
function detectarColisionId(
  id: string,
  titulo: string,
  rama: string,
  ref: string,
  cwd: string
): ColisionId | null {
  const names = lsTreeNames(ref, 'tareas', cwd);
  const match = names.find((n) => n.endsWith(`/${id}/tarea.md`));
  if (match === undefined) return null;
  let tituloEnRef: string;
  try {
    tituloEnRef = parseTareaFile(showFileAtRef(ref, match, cwd)).task.titulo;
  } catch (e: unknown) {
    if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
      // Fail-closed: si el tarea.md de la otra rama ni se puede
      // parsear, no se puede descartar la colision.
      return { path: match, motivo: 'ilegible' };
    }
    throw e;
  }
  if (tituloEnRef !== titulo) {
    return { path: match, motivo: 'titulo-distinto' };
  }
  const base = mergeBase(rama, ref, cwd);
  const enBase = lsTreeNames(base, 'tareas', cwd).some((n) => n.endsWith(`/${id}/tarea.md`));
  if (!enBase) {
    return { path: match, motivo: 'linaje-divergente' };
  }
  return null;
}

function insertAfterHeader(content: string, header: string, entry: string): string {
  const idx = content.indexOf(header);
  if (idx === -1) {
    // Fichero preexistente sin la seccion: se inserta ARRIBA (tras la
    // primera linea, normalmente el titulo), no al final — lo mas nuevo
    // encabeza el documento (hallazgo MENOR de revision por pares,
    // TASK-014: antes quedaba "Sin publicar" debajo de versiones viejas).
    const nl = content.indexOf('\n');
    if (nl === -1) {
      return `${content}\n\n${header}\n\n${entry}\n`;
    }
    return `${content.slice(0, nl + 1)}\n${header}\n\n${entry}\n${content.slice(nl + 1)}`;
  }
  let pos = content.indexOf('\n', idx + header.length);
  if (pos === -1) return `${content}\n\n${entry}\n`;
  pos += 1;
  if (content[pos] === '\n') pos += 1;
  return `${content.slice(0, pos)}${entry}\n${content.slice(pos)}`;
}

export function changelogEntry(task: Task, fecha: string): string {
  return `- ${task.id} (${task.tipo}) — ${task.titulo} (${fecha})`;
}

export function indexEntry(task: Task, fecha: string): string {
  const etiquetas = task.etiquetas.length > 0 ? task.etiquetas.join(', ') : '(sin etiquetas)';
  return (
    `- ${task.id} — ${task.titulo} · etiquetas: ${etiquetas} · rama ${task.rama} · ` +
    `terminada ${fecha} · tareas/04-terminadas/${task.id}/`
  );
}

const CHANGELOG_HEADER = '## Sin publicar';
const CHANGELOG_INICIAL =
  '# Changelog\n\n' +
  'Registro de tareas terminadas. Lo actualiza taskctl finish; una linea\n' +
  'por tarea, renderizada desde su frontmatter.\n\n' +
  `${CHANGELOG_HEADER}\n\n`;

const INDEX_HEADER = '## Tareas terminadas';
const INDEX_INICIAL =
  '# Indice de tareas terminadas\n\n' +
  'Indice determinista para la recuperacion de contexto por etiquetas\n' +
  '(seccion 6.1 de la metodologia). Lo actualiza taskctl finish.\n\n' +
  `${INDEX_HEADER}\n\n`;

async function appendEntry(
  filePath: string,
  inicial: string,
  header: string,
  entry: string
): Promise<void> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf8');
  } catch (e: unknown) {
    if (!isEnoent(e)) throw e;
    content = inicial;
  }
  await writeFile(filePath, insertAfterHeader(content, header, entry), 'utf8');
}

export interface FinishCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
  /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
  scriptsDir: string;
  /**
   * TASK-043: recibe los avisos que deben verse ANTES del merge (criterios
   * sin marcar). Es un callback y no un campo del resultado porque el
   * resultado llega despues del merge, cuando ya no hay vuelta atras.
   */
  onAviso?: (aviso: string) => void;
}

export interface FinishCommandResult {
  id: string;
  rama: string;
  /** Rama en la que termina el comando: la de integracion (`rama_base`, develop por defecto). */
  baseBranch: string;
  /** Rama principal mergeada ademas, solo para hotfix/release. */
  mainBranch: string | null;
  filePath: string;
  changelogPath: string;
  indexPath: string;
  boardPath: string;
  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
  autoCommit: AutoCommitResult;
}

export async function runFinishCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: FinishCommandDeps
): Promise<FinishCommandResult> {
  const { push, resto } = extraerPushFlag(argv);
  const id = resto[0];
  if (id === undefined || id.trim() === '') {
    throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
  }

  // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): rechazo
  // rapido sin tocar Git + metadata estable (tipo/rama/titulo). La
  // lectura que decide la escritura va DESPUES de los merges.
  const initial = await readTareaFile(tareasRoot, id);
  // Mensaje propio para "no esta en este working tree" (hallazgo MENOR
  // de revision por pares, TASK-014): el generico de la maquina de
  // estados aconseja crear la tarea con import/new, que aqui es lo
  // contrario de lo util — lo normal es estar en develop y que la
  // tarea viva en su rama.
  if (initial === null) {
    throw new FinishCommandError(
      `[ERROR] ${id}: no se encuentra en el working tree de la rama actual. ` +
        'Si la tarea existe en su propia rama, cambiate a esa rama antes de "taskctl finish".'
    );
  }
  const ctxInicial = await buildTransitionContext(path.dirname(initial.filePath));
  assertTransitionAllowed('finish', initial.task, ctxInicial);
  // TASK-043 (D5 de la auditoria): avisar, sin bloquear, de criterios sin
  // marcar antes de mergear. No bloquea: hay criterios que se cumplen y no
  // se marcan, y el veredicto del revisor ya es la puerta dura.
  const sinMarcar = casillasSinMarcar(initial.body);
  if (sinMarcar.length > 0) {
    deps.onAviso?.(
      `${id}: ${String(sinMarcar.length)} criterio(s) de aceptacion sin marcar en tarea.md: ` +
        `${sinMarcar.map((c) => `«${c}»`).join('; ')}. Si estan cumplidos, marcalos; si no, ` +
        'la tarea se cierra igualmente (el veredicto del revisor es la puerta).'
    );
  }
  const tipo = initial.task.tipo;
  const rama = initial.task.rama;
  const titulo = initial.task.titulo;

  if (!isWorkspaceClean(deps.repoCwd)) {
    throw new FinishCommandError(
      `[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
        'Haz commit o stash antes de "taskctl finish" — los merges de Git-Flow necesitan el ' +
        'workspace limpio y su prompt interactivo cancela en silencio sin terminal.'
    );
  }

  // TASK-045 (D1): la rama de integracion sale de `rama_base`, no de un
  // literal "develop". Se resuelve una vez, antes de cualquier merge, y
  // se pasa a los cuatro scripts con --develop (hotfix/release la
  // necesitan para el backmerge).
  const ramaIntegracion = resolveIntegrationBranch(deps.repoCwd);
  // MEN-1 de la revision: el config se lee del arbol de la rama de la
  // tarea. Un hotfix nace de la principal, y si `rama_base` aun no ha
  // llegado ahi se resuelve "develop", que quiza no existe: sin esto el
  // error era un "Not a valid object name" de git en crudo.
  if (!localBranchExists(ramaIntegracion, deps.repoCwd)) {
    throw new FinishCommandError(
      `[ERROR] ${id}: la rama de integracion "${ramaIntegracion}" no existe en local. ` +
        'Si el proyecto usa otra (clave rama_base de .taskcode/config.yml), ese config tiene que ' +
        `estar commiteado tambien en "${rama}" — en un hotfix, en la rama principal de la que ` +
        'nace. Si la rama existe solo en origin, traela con git checkout ' +
        `${ramaIntegracion} y reintenta. No se ha tocado nada.`
    );
  }

  // Colision de IDs ANTES de mergear (criterio 4): se comprueba contra
  // cada rama destino del merge. Para feature/fix solo la de integracion; para
  // hotfix/release tambien la principal.
  const mainBranch = MERGEA_A_MAIN[tipo] ? resolveMainBranch(deps.repoCwd) : null;
  const destinos = mainBranch === null ? [ramaIntegracion] : [mainBranch, ramaIntegracion];
  for (const destino of destinos) {
    const colision = detectarColisionId(id, titulo, rama, destino, deps.repoCwd);
    if (colision !== null) {
      const detalle =
        colision.motivo === 'titulo-distinto'
          ? `con OTRO titulo distinto de "${titulo}": mergear mezclaria dos tareas bajo el mismo numero. ` +
            'Renumera una de las dos (carpeta, frontmatter y rama)'
          : colision.motivo === 'linaje-divergente'
            ? 'anadido por un linaje SIN ancestro comun con la rama de la tarea: el merge seria ' +
              'add+add (no un rename) y dejaria el ID duplicado en dos carpetas de estado a la vez. ' +
              'Elimina o sincroniza a mano una de las dos copias'
            : 'con un tarea.md que no se puede parsear, asi que la colision no se puede descartar. ' +
              'Arregla ese fichero';
      throw new FinishCommandError(
        `[ERROR] ${id}: colision de IDs — "${destino}" ya contiene ${colision.path} ${detalle} ` +
          'antes de reintentar; no se ha tocado nada.'
      );
    }
  }

  const scriptName = SCRIPT_BY_TYPE[tipo];
  const integradaEnDevelop = isAncestor(rama, ramaIntegracion, deps.repoCwd);
  const integradaEnMain = mainBranch === null || isAncestor(rama, mainBranch, deps.repoCwd);

  if (integradaEnDevelop && integradaEnMain) {
    // Camino idempotente (hallazgo IMPORTANTE de revision por pares,
    // TASK-014): los merges ya estan consumados — p. ej. un reintento
    // tras resolver a mano un conflicto de backmerge. Reejecutar el
    // script moriria en el tag ya creado (hotfix/release); aqui solo
    // queda cerrar: ponerse en la rama de integracion y mover/renderizar.
    if (currentBranch(deps.repoCwd) !== ramaIntegracion) {
      checkoutBranch(ramaIntegracion, deps.repoCwd);
    }
  } else if (mainBranch !== null && integradaEnMain && !integradaEnDevelop) {
    // Estado a medias: merge a main (y su tag) consumados, backmerge
    // pendiente. Reejecutar el script chocaria con el tag duplicado.
    throw new FinishCommandError(
      `[ERROR] ${id}: el merge a "${mainBranch}" (con su tag) ya esta consumado pero falta ` +
        `el backmerge a "${ramaIntegracion}". No se reejecuta ${scriptName} (moriria en el tag ` +
        `duplicado): completa el backmerge a mano — git checkout ${ramaIntegracion} && ` +
        `git merge --no-ff ${rama} — y reintenta taskctl finish.`
    );
  } else {
    const { code, signal } = runGitflowScript(scriptName, [rama, '--develop', ramaIntegracion], {
      scriptsDir: deps.scriptsDir,
      cwd: deps.repoCwd,
    });
    if (code !== 0) {
      const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
      throw new FinishCommandError(
        `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
          'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo antes de ' +
          'reintentar); la tarea no se ha movido de carpeta.'
      );
    }

    // Evidencia, no suposicion (TASK-007/009): los cuatro scripts
    // terminan en la rama de integracion, con la rama de la tarea integrada; para
    // hotfix/release ademas integrada en la principal. Un backmerge
    // cancelado sale del script con exit 0 ("PARCIAL") — lo detecta la
    // ancestria, no el exit code.
    const branchNow = currentBranch(deps.repoCwd);
    if (branchNow !== ramaIntegracion) {
      throw new FinishCommandError(
        `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
          `"${branchNow}", no "${ramaIntegracion}". No se actualiza la tarea; revisa el repo a mano.`
      );
    }
    if (!isAncestor(rama, 'HEAD', deps.repoCwd)) {
      throw new FinishCommandError(
        `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
          `en "${ramaIntegracion}" (merge-base --is-ancestor lo niega). ¿Backmerge cancelado o ` +
          'merge a medias? No se actualiza la tarea; revisa el repo a mano.'
      );
    }
    if (mainBranch !== null && !isAncestor(rama, mainBranch, deps.repoCwd)) {
      throw new FinishCommandError(
        `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
          `en "${mainBranch}" (merge-base --is-ancestor lo niega). No se actualiza la tarea; ` +
          'revisa el repo a mano.'
      );
    }
  }

  // Lectura FRESCA, ya en la rama de integracion con el merge consumado: la unica que
  // decide la escritura. El contexto de aprobacion se recalcula sobre
  // la carpeta que el merge dejo en ella.
  const existing = await readTareaFile(tareasRoot, id);
  const ctx =
    existing === null ? {} : await buildTransitionContext(path.dirname(existing.filePath));
  assertTransitionAllowed('finish', existing ? existing.task : null, ctx);
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  const updated: Task = { ...task, estado: 'terminada', actualizado: today };
  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);

  // Renderizado de cierre (criterio 3): plantillas desde el
  // frontmatter. BOARD.md se regenera entero reutilizando el mismo
  // render de "taskctl board" — la direccion que la tabla de la
  // seccion 8 da por hecha; B5 decidira si el comando board tambien
  // lo escribe.
  const changelogPath = path.join(deps.repoCwd, 'CHANGELOG.md');
  const docsDir = path.join(deps.repoCwd, 'docs');
  await mkdir(docsDir, { recursive: true });
  const indexPath = path.join(docsDir, 'INDEX.md');
  // Misma ruta que usa "taskctl board --escribir" (item B5).
  const boardPath = boardFilePath(deps.repoCwd);

  await appendEntry(changelogPath, CHANGELOG_INICIAL, CHANGELOG_HEADER, changelogEntry(updated, today));
  await appendEntry(indexPath, INDEX_INICIAL, INDEX_HEADER, indexEntry(updated, today));

  const board = await runBoardCommand(tareasRoot, []);
  await writeFile(
    boardPath,
    renderBoardMarkdown(board.output, board.advertencias, today, 'taskctl finish'),
    'utf8'
  );

  // Paso 5 de la 8.3 (TASK-030, item C2). "finish" commitea sobre la
  // rama de integracion (`rama_base`), no sobre la rama de la tarea: cuando llega aqui el merge
  // ya esta consumado y el comando termina siempre en la rama de integracion (se
  // comprueba mas arriba). Es lo que se venia haciendo a mano; queda
  // fijado con un test para que nadie lo "arregle" mas adelante.
  // Ademas de las dos carpetas de la tarea entran los tres artefactos
  // de cierre — y NADA mas: "finish" tampoco aplica
  // ensureBaseBranchReady, asi que el resto del arbol puede tener
  // trabajo de la persona.
  const commitResult = autoCommit({
    cwd: deps.repoCwd,
    rutas: [
      path.dirname(filePath),
      path.dirname(newFilePath),
      changelogPath,
      indexPath,
      boardPath,
    ],
    mensaje: mensajeChore(task.id, 'tarea terminada y artefactos de cierre'),
    push,
  });

  return {
    id: task.id,
    rama,
    baseBranch: ramaIntegracion,
    mainBranch,
    filePath: newFilePath,
    changelogPath,
    indexPath,
    boardPath,
    autoCommit: commitResult,
  };
}
