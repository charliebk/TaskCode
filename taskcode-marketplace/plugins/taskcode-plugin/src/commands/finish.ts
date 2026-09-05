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
 * El commit del resultado queda en manos de la persona: el paso 5 de
 * la seccion 8.3 (que taskctl comitee y suba lo que genera) es la
 * decision #14, todavia abierta (item C2 del checklist).
 */
import path from 'node:path';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import type { Task } from '../core/task.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { TaskValidationError } from '../core/task.js';
import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
import {
  isWorkspaceClean,
  currentBranch,
  isAncestor,
  resolveMainBranch,
  lsTreeNames,
  showFileAtRef,
} from '../fs/git.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';
import { runBoardCommand } from './board.js';
import { REVISION_DIRNAME } from './review.js';

export class FinishCommandError extends Error {}

const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
  feature: 'merge-feature-to-develop.sh',
  fix: 'merge-fix-to-develop.sh',
  hotfix: 'merge-hotfix-to-main.sh',
  release: 'merge-release-to-main.sh',
};

/** hotfix/release mergean a main (con tag) y backmergean a develop. */
const MERGEA_A_MAIN: Record<Task['tipo'], boolean> = {
  feature: false,
  fix: false,
  hotfix: true,
  release: true,
};

const DEVELOP_BRANCH = 'develop';
const INFORME_REVISION_RE = /^informe-revision-(\d+)\.md$/;
const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;

/**
 * true solo si la linea "- Veredicto:" del informe dice aprobada y no
 * arrastra PENDIENTE ni cambios-solicitados. Fail-closed: sin linea de
 * veredicto (o sin informe), la revision NO esta aprobada.
 */
export function veredictoAprobado(informe: string): boolean {
  const linea = informe
    .split('\n')
    .find((l) => l.trim().toLowerCase().startsWith('- veredicto:'));
  if (linea === undefined) return false;
  const valor = linea.toLowerCase();
  // Limites de palabra obligatorios: la palabra independiente contiene
  // pendiente como subcadena (caso real que pillo el primer test).
  if (/\bpendiente\b/.test(valor) || valor.includes('cambios-solicitados')) return false;
  return /\baprobada\b/.test(valor);
}

/** Contenido del informe con mayor N segun `re`, o null si no hay. */
async function ultimoInforme(revisionDir: string, re: RegExp): Promise<string | null> {
  let entries: string[];
  try {
    entries = await readdir(revisionDir);
  } catch (e: unknown) {
    if (isEnoent(e)) return null;
    throw e;
  }
  let max = 0;
  let elegido: string | null = null;
  for (const entry of entries) {
    const m = re.exec(entry);
    if (m !== null && Number(m[1]) > max) {
      max = Number(m[1]);
      elegido = entry;
    }
  }
  if (elegido === null) return null;
  return readFile(path.join(revisionDir, elegido), 'utf8');
}

/**
 * Contexto de aprobacion para la maquina de estados, derivado de los
 * informes de revision/ de la carpeta de la tarea. La convencion del
 * informe de Codex (informe-codex-<n>.md) la producira TASK-020; leerla
 * ya aqui deja a finish preparado sin acoplarse a ese comando.
 */
async function buildTransitionContext(taskDir: string): Promise<TransitionContext> {
  const revisionDir = path.join(taskDir, REVISION_DIRNAME);
  const informe = await ultimoInforme(revisionDir, INFORME_REVISION_RE);
  const informeCodex = await ultimoInforme(revisionDir, INFORME_CODEX_RE);
  return {
    revisionPrimariaAprobada: informe !== null && veredictoAprobado(informe),
    revisionCodexAprobada: informeCodex !== null && veredictoAprobado(informeCodex),
  };
}

/**
 * Colision de IDs (riesgo documentado en TASK-012): el mismo TASK-NNN
 * puede existir en `ref` como OTRA tarea (titulo distinto) si nacio de
 * un linaje que no comparte tareas/ (p. ej. un hotfix numerado sobre
 * main mientras develop ya usaba ese ID). Mergear asi mezclaria dos
 * tareas bajo un mismo numero. Mismo titulo = la misma tarea en otro
 * punto de su ciclo, que es lo normal — no es colision.
 */
function detectarColisionId(id: string, titulo: string, ref: string, cwd: string): string | null {
  const names = lsTreeNames(ref, 'tareas', cwd);
  const match = names.find((n) => n.endsWith(`/${id}/tarea.md`));
  if (match === undefined) return null;
  let tituloEnRef: string;
  try {
    tituloEnRef = parseTareaFile(showFileAtRef(ref, match, cwd)).task.titulo;
  } catch (e: unknown) {
    if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
      // Fail-closed: si el tarea.md de la otra rama ni se puede parsear,
      // no se puede descartar la colision.
      return match;
    }
    throw e;
  }
  return tituloEnRef === titulo ? null : match;
}

function insertAfterHeader(content: string, header: string, entry: string): string {
  const idx = content.indexOf(header);
  if (idx === -1) {
    return `${content.trimEnd()}\n\n${header}\n\n${entry}\n`;
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
}

export interface FinishCommandResult {
  id: string;
  rama: string;
  /** Rama en la que termina el comando (develop). */
  baseBranch: string;
  /** Rama principal mergeada ademas, solo para hotfix/release. */
  mainBranch: string | null;
  filePath: string;
  changelogPath: string;
  indexPath: string;
  boardPath: string;
}

export async function runFinishCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: FinishCommandDeps
): Promise<FinishCommandResult> {
  const id = argv[0];
  if (id === undefined || id.trim() === '') {
    throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
  }

  // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): rechazo
  // rapido sin tocar Git + metadata estable (tipo/rama/titulo). La
  // lectura que decide la escritura va DESPUES de los merges.
  const initial = await readTareaFile(tareasRoot, id);
  const ctxInicial =
    initial === null
      ? {}
      : await buildTransitionContext(path.dirname(initial.filePath));
  assertTransitionAllowed('finish', initial ? initial.task : null, ctxInicial);
  const tipo = initial!.task.tipo;
  const rama = initial!.task.rama;
  const titulo = initial!.task.titulo;

  if (!isWorkspaceClean(deps.repoCwd)) {
    throw new FinishCommandError(
      `[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
        'Haz commit o stash antes de "taskctl finish" — los merges de Git-Flow necesitan el ' +
        'workspace limpio y su prompt interactivo cancela en silencio sin terminal.'
    );
  }

  // Colision de IDs ANTES de mergear (criterio 4): se comprueba contra
  // cada rama destino del merge. Para feature/fix solo develop; para
  // hotfix/release tambien la principal.
  const mainBranch = MERGEA_A_MAIN[tipo] ? resolveMainBranch(deps.repoCwd) : null;
  const destinos = mainBranch === null ? [DEVELOP_BRANCH] : [mainBranch, DEVELOP_BRANCH];
  for (const destino of destinos) {
    const colision = detectarColisionId(id, titulo, destino, deps.repoCwd);
    if (colision !== null) {
      throw new FinishCommandError(
        `[ERROR] ${id}: colision de IDs — "${destino}" ya contiene ${colision} con OTRO ` +
          `titulo distinto de "${titulo}". Mergear mezclaria dos tareas bajo el mismo numero. ` +
          'Renumera una de las dos (carpeta, frontmatter y rama) antes de reintentar; ' +
          'no se ha tocado nada.'
      );
    }
  }

  const scriptName = SCRIPT_BY_TYPE[tipo];
  const { code, signal } = runGitflowScript(scriptName, [rama], {
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
  // terminan en develop, con la rama de la tarea integrada; para
  // hotfix/release ademas integrada en la principal. Un backmerge
  // cancelado sale del script con exit 0 ("PARCIAL") — lo detecta la
  // ancestria, no el exit code.
  const branchNow = currentBranch(deps.repoCwd);
  if (branchNow !== DEVELOP_BRANCH) {
    throw new FinishCommandError(
      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
        `"${branchNow}", no "${DEVELOP_BRANCH}". No se actualiza la tarea; revisa el repo a mano.`
    );
  }
  if (!isAncestor(rama, 'HEAD', deps.repoCwd)) {
    throw new FinishCommandError(
      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
        `en "${DEVELOP_BRANCH}" (merge-base --is-ancestor lo niega). ¿Backmerge cancelado o ` +
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

  // Lectura FRESCA, ya en develop con el merge consumado: la unica que
  // decide la escritura. El contexto de aprobacion se recalcula sobre
  // la carpeta que el merge dejo en develop.
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
  const boardPath = path.join(docsDir, 'BOARD.md');

  await appendEntry(changelogPath, CHANGELOG_INICIAL, CHANGELOG_HEADER, changelogEntry(updated, today));
  await appendEntry(indexPath, INDEX_INICIAL, INDEX_HEADER, indexEntry(updated, today));

  const board = await runBoardCommand(tareasRoot, []);
  const avisos =
    board.advertencias.length > 0
      ? `\n> Avisos del render:\n${board.advertencias.map((a) => `> - ${a}`).join('\n')}\n`
      : '';
  await writeFile(
    boardPath,
    `# Tablero de tareas\n\n` +
      `> Generado automaticamente por taskctl finish el ${today}. No editar a mano.\n${avisos}\n` +
      `${board.output}\n`,
    'utf8'
  );

  return {
    id: task.id,
    rama,
    baseBranch: DEVELOP_BRANCH,
    mainBranch,
    filePath: newFilePath,
    changelogPath,
    indexPath,
    boardPath,
  };
}
