# Peticion de revision — TASK-014 (ronda 1)

- Tarea: TASK-014 — Comando taskctl finish (merge, cierre y actualización del tablero)
- Rama revisada: feature/task-014-comando-taskctl-finish-merge-cierre-y-ac
- Rama base: develop
- Commit revisado (HEAD): aec113084298edf55a61acfdcd63e2ed5cddb7eb
- Fecha: 2026-09-05
- Agente revisor sugerido: typescript-reviewer

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
aec1130 feat(TASK-014): taskctl finish — merge por tipo, colision de IDs, cierre y render del tablero
e6e79eb tarea(TASK-014): en curso via taskctl start (rama creada por Git-Flow)
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-014/plan-final.md b/tareas/02-en-curso/TASK-014/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-014/plan-final.md
rename to tareas/02-en-curso/TASK-014/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-014/tarea.md b/tareas/02-en-curso/TASK-014/tarea.md
similarity index 98%
rename from tareas/01-en-diseno/TASK-014/tarea.md
rename to tareas/02-en-curso/TASK-014/tarea.md
index 024bf31..bf2d1c7 100644
--- a/tareas/01-en-diseno/TASK-014/tarea.md
+++ b/tareas/02-en-curso/TASK-014/tarea.md
@@ -6,7 +6,7 @@ sprint: 2
 etiquetas: []
 complejidad: media
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-014-comando-taskctl-finish-merge-cierre-y-ac
 asignado_a: null
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 0d945b0..3a4d973 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -10,6 +10,7 @@ import { runStartCommand, StartCommandError } from './commands/start.js';
 import { runPlanCommand, PlanCommandError } from './commands/plan.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
+import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { resolveGitflowScriptsDir } from './fs/gitflow-runner.js';
 import { StateMachineError } from './core/state-machine.js';
 import { TaskFolderConflictError } from './fs/task-store.js';
@@ -38,8 +39,9 @@ Uso:
   taskctl plan TASK-NNN
   taskctl approve TASK-NNN
   taskctl review TASK-NNN
+  taskctl finish TASK-NNN
 
-Comandos: new, import, board, start, plan, approve, review.
+Comandos: new, import, board, start, plan, approve, review, finish.
 Ver docs/PLAN_SPRINTS.md en el repo del proyecto.
 `;
 
@@ -283,6 +285,38 @@ export async function main(argv: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'finish') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const result = await runFinishCommand(tareasRoot, argv.slice(1), today(), {
+        repoCwd,
+        scriptsDir: resolveGitflowScriptsDir(),
+      });
+      const mainInfo = result.mainBranch === null ? '' : ` y en "${result.mainBranch}" (con tag)`;
+      process.stdout.write(
+        `Tarea ${result.id} terminada: "${result.rama}" integrada en ` +
+          `"${result.baseBranch}"${mainInfo}, tarea movida a ${result.filePath}.\n` +
+          `Actualizados: ${result.changelogPath}, ${result.indexPath} y ${result.boardPath}.\n` +
+          'Recuerda commitear y subir el resultado (el auto-commit es la decision #14, aun ' +
+          'abierta).\n'
+      );
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof FinishCommandError ||
+        e instanceof StateMachineError ||
+        e instanceof TaskFolderConflictError ||
+        e instanceof GitLaunchError ||
+        e instanceof GitCommandError
+      ) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   process.stderr.write(`[ERROR] Comando desconocido: "${cmd}"\n\n${HELP}`);
   return 1;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
new file mode 100644
index 0000000..697a69c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -0,0 +1,352 @@
+/**
+ * taskctl finish — TASK-014 de PLAN_SPRINTS.md. Cierra el ciclo de
+ * vida de una tarea: exige revision aprobada (fuente determinista: la
+ * linea "Veredicto:" del ultimo informe de revision), mergea la rama
+ * con el script Git-Flow del tipo (tag + backmerge para
+ * hotfix/release), verifica con evidencia Git que los merges
+ * ocurrieron, detecta la colision de IDs entre main y develop ANTES de
+ * mergear (riesgo documentado en TASK-012), mueve la carpeta a
+ * 04-terminadas/ y renderiza CHANGELOG.md, docs/INDEX.md y
+ * docs/BOARD.md desde el frontmatter — plantillas deterministas, cero
+ * LLM (correccion de la seccion 16 de la metodologia).
+ *
+ * El commit del resultado queda en manos de la persona: el paso 5 de
+ * la seccion 8.3 (que taskctl comitee y suba lo que genera) es la
+ * decision #14, todavia abierta (item C2 del checklist).
+ */
+import path from 'node:path';
+import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
+import type { Task } from '../core/task.js';
+import { parseTareaFile } from '../core/tarea-file.js';
+import { FrontmatterParseError } from '../core/frontmatter.js';
+import { TaskValidationError } from '../core/task.js';
+import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
+import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
+import {
+  isWorkspaceClean,
+  currentBranch,
+  isAncestor,
+  resolveMainBranch,
+  lsTreeNames,
+  showFileAtRef,
+} from '../fs/git.js';
+import { runGitflowScript } from '../fs/gitflow-runner.js';
+import { runBoardCommand } from './board.js';
+import { REVISION_DIRNAME } from './review.js';
+
+export class FinishCommandError extends Error {}
+
+const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
+  feature: 'merge-feature-to-develop.sh',
+  fix: 'merge-fix-to-develop.sh',
+  hotfix: 'merge-hotfix-to-main.sh',
+  release: 'merge-release-to-main.sh',
+};
+
+/** hotfix/release mergean a main (con tag) y backmergean a develop. */
+const MERGEA_A_MAIN: Record<Task['tipo'], boolean> = {
+  feature: false,
+  fix: false,
+  hotfix: true,
+  release: true,
+};
+
+const DEVELOP_BRANCH = 'develop';
+const INFORME_REVISION_RE = /^informe-revision-(\d+)\.md$/;
+const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
+
+/**
+ * true solo si la linea "- Veredicto:" del informe dice aprobada y no
+ * arrastra PENDIENTE ni cambios-solicitados. Fail-closed: sin linea de
+ * veredicto (o sin informe), la revision NO esta aprobada.
+ */
+export function veredictoAprobado(informe: string): boolean {
+  const linea = informe
+    .split('\n')
+    .find((l) => l.trim().toLowerCase().startsWith('- veredicto:'));
+  if (linea === undefined) return false;
+  const valor = linea.toLowerCase();
+  // Limites de palabra obligatorios: la palabra independiente contiene
+  // pendiente como subcadena (caso real que pillo el primer test).
+  if (/\bpendiente\b/.test(valor) || valor.includes('cambios-solicitados')) return false;
+  return /\baprobada\b/.test(valor);
+}
+
+/** Contenido del informe con mayor N segun `re`, o null si no hay. */
+async function ultimoInforme(revisionDir: string, re: RegExp): Promise<string | null> {
+  let entries: string[];
+  try {
+    entries = await readdir(revisionDir);
+  } catch (e: unknown) {
+    if (isEnoent(e)) return null;
+    throw e;
+  }
+  let max = 0;
+  let elegido: string | null = null;
+  for (const entry of entries) {
+    const m = re.exec(entry);
+    if (m !== null && Number(m[1]) > max) {
+      max = Number(m[1]);
+      elegido = entry;
+    }
+  }
+  if (elegido === null) return null;
+  return readFile(path.join(revisionDir, elegido), 'utf8');
+}
+
+/**
+ * Contexto de aprobacion para la maquina de estados, derivado de los
+ * informes de revision/ de la carpeta de la tarea. La convencion del
+ * informe de Codex (informe-codex-<n>.md) la producira TASK-020; leerla
+ * ya aqui deja a finish preparado sin acoplarse a ese comando.
+ */
+async function buildTransitionContext(taskDir: string): Promise<TransitionContext> {
+  const revisionDir = path.join(taskDir, REVISION_DIRNAME);
+  const informe = await ultimoInforme(revisionDir, INFORME_REVISION_RE);
+  const informeCodex = await ultimoInforme(revisionDir, INFORME_CODEX_RE);
+  return {
+    revisionPrimariaAprobada: informe !== null && veredictoAprobado(informe),
+    revisionCodexAprobada: informeCodex !== null && veredictoAprobado(informeCodex),
+  };
+}
+
+/**
+ * Colision de IDs (riesgo documentado en TASK-012): el mismo TASK-NNN
+ * puede existir en `ref` como OTRA tarea (titulo distinto) si nacio de
+ * un linaje que no comparte tareas/ (p. ej. un hotfix numerado sobre
+ * main mientras develop ya usaba ese ID). Mergear asi mezclaria dos
+ * tareas bajo un mismo numero. Mismo titulo = la misma tarea en otro
+ * punto de su ciclo, que es lo normal — no es colision.
+ */
+function detectarColisionId(id: string, titulo: string, ref: string, cwd: string): string | null {
+  const names = lsTreeNames(ref, 'tareas', cwd);
+  const match = names.find((n) => n.endsWith(`/${id}/tarea.md`));
+  if (match === undefined) return null;
+  let tituloEnRef: string;
+  try {
+    tituloEnRef = parseTareaFile(showFileAtRef(ref, match, cwd)).task.titulo;
+  } catch (e: unknown) {
+    if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
+      // Fail-closed: si el tarea.md de la otra rama ni se puede parsear,
+      // no se puede descartar la colision.
+      return match;
+    }
+    throw e;
+  }
+  return tituloEnRef === titulo ? null : match;
+}
+
+function insertAfterHeader(content: string, header: string, entry: string): string {
+  const idx = content.indexOf(header);
+  if (idx === -1) {
+    return `${content.trimEnd()}\n\n${header}\n\n${entry}\n`;
+  }
+  let pos = content.indexOf('\n', idx + header.length);
+  if (pos === -1) return `${content}\n\n${entry}\n`;
+  pos += 1;
+  if (content[pos] === '\n') pos += 1;
+  return `${content.slice(0, pos)}${entry}\n${content.slice(pos)}`;
+}
+
+export function changelogEntry(task: Task, fecha: string): string {
+  return `- ${task.id} (${task.tipo}) — ${task.titulo} (${fecha})`;
+}
+
+export function indexEntry(task: Task, fecha: string): string {
+  const etiquetas = task.etiquetas.length > 0 ? task.etiquetas.join(', ') : '(sin etiquetas)';
+  return (
+    `- ${task.id} — ${task.titulo} · etiquetas: ${etiquetas} · rama ${task.rama} · ` +
+    `terminada ${fecha} · tareas/04-terminadas/${task.id}/`
+  );
+}
+
+const CHANGELOG_HEADER = '## Sin publicar';
+const CHANGELOG_INICIAL =
+  '# Changelog\n\n' +
+  'Registro de tareas terminadas. Lo actualiza taskctl finish; una linea\n' +
+  'por tarea, renderizada desde su frontmatter.\n\n' +
+  `${CHANGELOG_HEADER}\n\n`;
+
+const INDEX_HEADER = '## Tareas terminadas';
+const INDEX_INICIAL =
+  '# Indice de tareas terminadas\n\n' +
+  'Indice determinista para la recuperacion de contexto por etiquetas\n' +
+  '(seccion 6.1 de la metodologia). Lo actualiza taskctl finish.\n\n' +
+  `${INDEX_HEADER}\n\n`;
+
+async function appendEntry(
+  filePath: string,
+  inicial: string,
+  header: string,
+  entry: string
+): Promise<void> {
+  let content: string;
+  try {
+    content = await readFile(filePath, 'utf8');
+  } catch (e: unknown) {
+    if (!isEnoent(e)) throw e;
+    content = inicial;
+  }
+  await writeFile(filePath, insertAfterHeader(content, header, entry), 'utf8');
+}
+
+export interface FinishCommandDeps {
+  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
+  repoCwd: string;
+  /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
+  scriptsDir: string;
+}
+
+export interface FinishCommandResult {
+  id: string;
+  rama: string;
+  /** Rama en la que termina el comando (develop). */
+  baseBranch: string;
+  /** Rama principal mergeada ademas, solo para hotfix/release. */
+  mainBranch: string | null;
+  filePath: string;
+  changelogPath: string;
+  indexPath: string;
+  boardPath: string;
+}
+
+export async function runFinishCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: FinishCommandDeps
+): Promise<FinishCommandResult> {
+  const id = argv[0];
+  if (id === undefined || id.trim() === '') {
+    throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
+  }
+
+  // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): rechazo
+  // rapido sin tocar Git + metadata estable (tipo/rama/titulo). La
+  // lectura que decide la escritura va DESPUES de los merges.
+  const initial = await readTareaFile(tareasRoot, id);
+  const ctxInicial =
+    initial === null
+      ? {}
+      : await buildTransitionContext(path.dirname(initial.filePath));
+  assertTransitionAllowed('finish', initial ? initial.task : null, ctxInicial);
+  const tipo = initial!.task.tipo;
+  const rama = initial!.task.rama;
+  const titulo = initial!.task.titulo;
+
+  if (!isWorkspaceClean(deps.repoCwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
+        'Haz commit o stash antes de "taskctl finish" — los merges de Git-Flow necesitan el ' +
+        'workspace limpio y su prompt interactivo cancela en silencio sin terminal.'
+    );
+  }
+
+  // Colision de IDs ANTES de mergear (criterio 4): se comprueba contra
+  // cada rama destino del merge. Para feature/fix solo develop; para
+  // hotfix/release tambien la principal.
+  const mainBranch = MERGEA_A_MAIN[tipo] ? resolveMainBranch(deps.repoCwd) : null;
+  const destinos = mainBranch === null ? [DEVELOP_BRANCH] : [mainBranch, DEVELOP_BRANCH];
+  for (const destino of destinos) {
+    const colision = detectarColisionId(id, titulo, destino, deps.repoCwd);
+    if (colision !== null) {
+      throw new FinishCommandError(
+        `[ERROR] ${id}: colision de IDs — "${destino}" ya contiene ${colision} con OTRO ` +
+          `titulo distinto de "${titulo}". Mergear mezclaria dos tareas bajo el mismo numero. ` +
+          'Renumera una de las dos (carpeta, frontmatter y rama) antes de reintentar; ' +
+          'no se ha tocado nada.'
+      );
+    }
+  }
+
+  const scriptName = SCRIPT_BY_TYPE[tipo];
+  const { code, signal } = runGitflowScript(scriptName, [rama], {
+    scriptsDir: deps.scriptsDir,
+    cwd: deps.repoCwd,
+  });
+  if (code !== 0) {
+    const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
+    throw new FinishCommandError(
+      `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
+        'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo antes de ' +
+        'reintentar); la tarea no se ha movido de carpeta.'
+    );
+  }
+
+  // Evidencia, no suposicion (TASK-007/009): los cuatro scripts
+  // terminan en develop, con la rama de la tarea integrada; para
+  // hotfix/release ademas integrada en la principal. Un backmerge
+  // cancelado sale del script con exit 0 ("PARCIAL") — lo detecta la
+  // ancestria, no el exit code.
+  const branchNow = currentBranch(deps.repoCwd);
+  if (branchNow !== DEVELOP_BRANCH) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
+        `"${branchNow}", no "${DEVELOP_BRANCH}". No se actualiza la tarea; revisa el repo a mano.`
+    );
+  }
+  if (!isAncestor(rama, 'HEAD', deps.repoCwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
+        `en "${DEVELOP_BRANCH}" (merge-base --is-ancestor lo niega). ¿Backmerge cancelado o ` +
+        'merge a medias? No se actualiza la tarea; revisa el repo a mano.'
+    );
+  }
+  if (mainBranch !== null && !isAncestor(rama, mainBranch, deps.repoCwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
+        `en "${mainBranch}" (merge-base --is-ancestor lo niega). No se actualiza la tarea; ` +
+        'revisa el repo a mano.'
+    );
+  }
+
+  // Lectura FRESCA, ya en develop con el merge consumado: la unica que
+  // decide la escritura. El contexto de aprobacion se recalcula sobre
+  // la carpeta que el merge dejo en develop.
+  const existing = await readTareaFile(tareasRoot, id);
+  const ctx =
+    existing === null ? {} : await buildTransitionContext(path.dirname(existing.filePath));
+  assertTransitionAllowed('finish', existing ? existing.task : null, ctx);
+  const { task, body, filePath } = existing as NonNullable<typeof existing>;
+
+  const updated: Task = { ...task, estado: 'terminada', actualizado: today };
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+
+  // Renderizado de cierre (criterio 3): plantillas desde el
+  // frontmatter. BOARD.md se regenera entero reutilizando el mismo
+  // render de "taskctl board" — la direccion que la tabla de la
+  // seccion 8 da por hecha; B5 decidira si el comando board tambien
+  // lo escribe.
+  const changelogPath = path.join(deps.repoCwd, 'CHANGELOG.md');
+  const docsDir = path.join(deps.repoCwd, 'docs');
+  await mkdir(docsDir, { recursive: true });
+  const indexPath = path.join(docsDir, 'INDEX.md');
+  const boardPath = path.join(docsDir, 'BOARD.md');
+
+  await appendEntry(changelogPath, CHANGELOG_INICIAL, CHANGELOG_HEADER, changelogEntry(updated, today));
+  await appendEntry(indexPath, INDEX_INICIAL, INDEX_HEADER, indexEntry(updated, today));
+
+  const board = await runBoardCommand(tareasRoot, []);
+  const avisos =
+    board.advertencias.length > 0
+      ? `\n> Avisos del render:\n${board.advertencias.map((a) => `> - ${a}`).join('\n')}\n`
+      : '';
+  await writeFile(
+    boardPath,
+    `# Tablero de tareas\n\n` +
+      `> Generado automaticamente por taskctl finish el ${today}. No editar a mano.\n${avisos}\n` +
+      `${board.output}\n`,
+    'utf8'
+  );
+
+  return {
+    id: task.id,
+    rama,
+    baseBranch: DEVELOP_BRANCH,
+    mainBranch,
+    filePath: newFilePath,
+    changelogPath,
+    indexPath,
+    boardPath,
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index d1e541b..88f8e84 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -132,6 +132,23 @@ export function diffRange(desde: string, hasta: string, cwd: string): string {
   return runGit(['diff', `${desde}..${hasta}`], cwd);
 }
 
+/**
+ * Rutas (con "/" de Git, no separador del SO) de los ficheros bajo
+ * `prefix` en el arbol de `ref`, sin tocar el working tree. Lo usa
+ * "taskctl finish" (TASK-014) para detectar colisiones de IDs contra
+ * develop/main antes de mergear.
+ */
+export function lsTreeNames(ref: string, prefix: string, cwd: string): string[] {
+  return runGit(['ls-tree', '-r', '--name-only', ref, '--', prefix], cwd)
+    .split('\n')
+    .filter((line) => line !== '');
+}
+
+/** Contenido de `filePath` (ruta con "/" de Git) en el arbol de `ref`. */
+export function showFileAtRef(ref: string, filePath: string, cwd: string): string {
+  return runGit(['show', `${ref}:${filePath}`], cwd);
+}
+
 /** true si existe una referencia LOCAL para esa rama. */
 export function localBranchExists(name: string, cwd: string): boolean {
   const result = spawnSync(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
new file mode 100644
index 0000000..f5cd585
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
@@ -0,0 +1,418 @@
+/**
+ * Test de integracion real (no mocks) para taskctl finish (TASK-014):
+ * repos Git temporales de verdad, los scripts merge-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (merges, tags, ancestria)
+ * en vez de fiarse de lo que devuelve el comando. Mismo espiritu que
+ * review.test.ts (TASK-013).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-700',
+    titulo: 'Tarea de prueba de finish',
+    tipo: 'feature',
+    sprint: 2,
+    etiquetas: ['cli', 'gitflow'],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-revision',
+    plan_aprobado: true,
+    rama: 'feature/task-700-prueba-finish',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-05',
+    actualizado: '2026-09-05',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-finish-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+const VEREDICTO_APROBADO = '- Veredicto: aprobada (revisada por el agente independiente)\n';
+
+/**
+ * Deja la tarea en-revision en su rama con el informe de la ronda 1
+ * commiteado, como la habria dejado el ciclo start -> review + el
+ * revisor volcando su veredicto. `base` es la rama de la que nace la
+ * rama de trabajo (develop para feature/fix/release, main para hotfix).
+ */
+async function setupTaskEnRevision(
+  repoRoot: string,
+  tareasRoot: string,
+  task: Task,
+  opts: { base?: string; veredicto?: string; conCodex?: string } = {}
+): Promise<void> {
+  const base = opts.base ?? 'develop';
+  git(['checkout', '-q', '-b', task.rama, base], repoRoot);
+  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
+  await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
+  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+  await mkdir(revisionDir, { recursive: true });
+  await writeFile(
+    path.join(revisionDir, 'informe-revision-1.md'),
+    `# Informe de revision — ${task.id} (ronda 1)\n\n${opts.veredicto ?? VEREDICTO_APROBADO}`,
+    'utf8'
+  );
+  if (opts.conCodex !== undefined) {
+    await writeFile(
+      path.join(revisionDir, 'informe-codex-1.md'),
+      `# Informe Codex — ${task.id}\n\n${opts.conCodex}`,
+      'utf8'
+    );
+  }
+  commitAll(repoRoot, `feat(${task.id}): trabajo revisado`);
+}
+
+test('veredictoAprobado: fail-closed con PENDIENTE, cambios-solicitados o sin linea de veredicto', () => {
+  assert.equal(veredictoAprobado('- Veredicto: aprobada\n'), true);
+  assert.equal(veredictoAprobado('- Veredicto: APROBADA (sin hallazgos)\n'), true);
+  assert.equal(veredictoAprobado('- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n'), false);
+  assert.equal(veredictoAprobado('- Veredicto: cambios-solicitados\n'), false);
+  assert.equal(veredictoAprobado('informe sin veredicto\n'), false);
+  assert.equal(veredictoAprobado(''), false);
+});
+
+test('taskctl finish (feature): merge a develop, tarea a 04-terminadas y CHANGELOG/INDEX/BOARD renderizados', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-700'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.baseBranch, 'develop');
+    assert.equal(result.mainBranch, null);
+    assert.match(result.filePath, /04-terminadas[/\\]TASK-700[/\\]tarea\.md$/);
+
+    // Evidencia real de Git.
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    assert.match(git(['log', '--oneline'], repoRoot), /merge\(feature\): feature\/task-700-prueba-finish -> develop/);
+
+    const read = await readTareaFile(tareasRoot, 'TASK-700');
+    assert.equal(read?.task.estado, 'terminada');
+    assert.equal(read?.task.actualizado, '2026-09-07');
+    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-700')));
+
+    const changelog = await readFile(result.changelogPath, 'utf8');
+    assert.match(changelog, /## Sin publicar/);
+    assert.match(changelog, /- TASK-700 \(feature\) — Tarea de prueba de finish \(2026-09-07\)/);
+
+    const index = await readFile(result.indexPath, 'utf8');
+    assert.match(index, /- TASK-700 — Tarea de prueba de finish · etiquetas: cli, gitflow/);
+    assert.match(index, /tareas\/04-terminadas\/TASK-700\//);
+
+    const board = await readFile(result.boardPath, 'utf8');
+    assert.match(board, /Generado automaticamente por taskctl finish el 2026-09-07/);
+    assert.match(board, /TASK-700/);
+  });
+});
+
+test('taskctl finish (fix): usa merge-fix-to-develop.sh', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-701', tipo: 'fix', rama: 'fix/task-701-prueba-fix' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    await runFinishCommand(tareasRoot, ['TASK-701'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.match(git(['log', '--oneline'], repoRoot), /merge\(fix\): fix\/task-701-prueba-fix -> develop/);
+    const read = await readTareaFile(tareasRoot, 'TASK-701');
+    assert.equal(read?.task.estado, 'terminada');
+  });
+});
+
+test('taskctl finish (hotfix): merge a main con tag y backmerge real a develop', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-702', tipo: 'hotfix', rama: 'hotfix/task-702-urgente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-702'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.mainBranch, 'main');
+    // Merge a main + tag + backmerge, todo leido de Git.
+    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\): hotfix\/task-702-urgente -> main/);
+    assert.equal(git(['tag', '--list', 'task-702-urgente'], repoRoot).trim(), 'task-702-urgente');
+    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+
+    // La tarea quedo terminada en el working tree de develop.
+    const read = await readTareaFile(tareasRoot, 'TASK-702');
+    assert.equal(read?.task.estado, 'terminada');
+  });
+});
+
+test('taskctl finish (release): merge a main con tag y backmerge real a develop', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-703', tipo: 'release', rama: 'release/task-703-cierre' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-703'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.mainBranch, 'main');
+    assert.match(git(['log', '--oneline', 'main'], repoRoot), /merge\(release\): release\/task-703-cierre -> main/);
+    assert.equal(git(['tag', '--list', 'task-703-cierre'], repoRoot).trim(), 'task-703-cierre');
+    assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
+    const read = await readTareaFile(tareasRoot, 'TASK-703');
+    assert.equal(read?.task.estado, 'terminada');
+  });
+});
+
+test('taskctl finish: colision de IDs entre main y develop se detecta ANTES de mergear', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // develop ya tiene OTRO TASK-704 (titulo distinto), nacido de su
+    // propio linaje.
+    const otraTarea = sampleTask({
+      id: 'TASK-704',
+      titulo: 'Otra tarea distinta con el mismo numero',
+      estado: 'planificada',
+      rama: 'feature/task-704-otra',
+    });
+    await writeTareaFile(tareasRoot, otraTarea, '');
+    commitAll(repoRoot, 'otra TASK-704 en develop');
+
+    // El hotfix, nacido de main (que no ve tareas/ de develop),
+    // recalculo el mismo ID para una tarea diferente.
+    const task = sampleTask({ id: 'TASK-704', tipo: 'hotfix', rama: 'hotfix/task-704-urgente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-704'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match((e as Error).message, /colision de IDs/);
+        assert.match((e as Error).message, /Renumera/);
+        return true;
+      }
+    );
+
+    // Nada se mergeo: main sigue sin el merge y no hay tag.
+    assert.doesNotMatch(git(['log', '--oneline', 'main'], repoRoot), /merge\(hotfix\)/);
+    assert.equal(git(['tag', '--list'], repoRoot).trim(), '');
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), task.rama);
+    const read = await readTareaFile(tareasRoot, 'TASK-704');
+    assert.equal(read?.task.estado, 'en-revision');
+  });
+});
+
+test('taskctl finish: rechaza sin revision aprobada (veredicto PENDIENTE), sin tocar Git', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-705', rama: 'feature/task-705-pendiente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, {
+      veredicto: '- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n',
+    });
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-705'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      StateMachineError
+    );
+
+    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
+    const read = await readTareaFile(tareasRoot, 'TASK-705');
+    assert.equal(read?.task.estado, 'en-revision');
+  });
+});
+
+test('taskctl finish: con revision_codex exige informe de Codex aprobado (rechaza sin el, pasa con el)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({
+      id: 'TASK-706',
+      rama: 'feature/task-706-codex',
+      revision_codex: true,
+    });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof StateMachineError);
+        assert.match((e as Error).message, /revision_codex/);
+        return true;
+      }
+    );
+
+    // Con el informe de Codex aprobado (convencion de TASK-020), pasa.
+    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-706', 'revision');
+    await writeFile(
+      path.join(revisionDir, 'informe-codex-1.md'),
+      `# Informe Codex\n\n${VEREDICTO_APROBADO}`,
+      'utf8'
+    );
+    commitAll(repoRoot, 'informe codex aprobado');
+
+    const result = await runFinishCommand(tareasRoot, ['TASK-706'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.match(result.filePath, /04-terminadas/);
+  });
+});
+
+test('taskctl finish: rechaza una tarea que no esta en-revision, con el comando requerido en el mensaje', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-707', estado: 'en-curso', rama: 'feature/task-707-curso' });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '');
+    commitAll(repoRoot, 'tarea en curso');
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-707'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof StateMachineError);
+        assert.match((e as Error).message, /taskctl review/);
+        return true;
+      }
+    );
+  });
+});
+
+test('taskctl finish: rechaza con el workspace sucio, sin invocar el script', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-708', rama: 'feature/task-708-sucio' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-708'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      FinishCommandError
+    );
+
+    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
+  });
+});
+
+test('taskctl finish: si el script falla, la tarea no se mueve ni se renderiza nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-709', rama: 'feature/task-709-roto' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-finish-'));
+    await writeFile(
+      path.join(brokenScriptsDir, 'merge-feature-to-develop.sh'),
+      '#!/usr/bin/env bash\nexit 7\n',
+      'utf8'
+    );
+
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, ['TASK-709'], '2026-09-07', {
+          repoCwd: repoRoot,
+          scriptsDir: brokenScriptsDir,
+        }),
+      FinishCommandError
+    );
+
+    const read = await readTareaFile(tareasRoot, 'TASK-709');
+    assert.equal(read?.task.estado, 'en-revision');
+    await assert.rejects(() => stat(path.join(repoRoot, 'CHANGELOG.md')));
+    await assert.rejects(() => stat(path.join(repoRoot, 'docs', 'BOARD.md')));
+    await rm(brokenScriptsDir, { recursive: true, force: true });
+  });
+});
+
+test('taskctl finish: dos tareas terminadas acumulan entradas en CHANGELOG e INDEX sin pisarse', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const t1 = sampleTask({ id: 'TASK-710', rama: 'feature/task-710-una' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, t1);
+    await runFinishCommand(tareasRoot, ['TASK-710'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'cierre de TASK-710');
+
+    const t2 = sampleTask({ id: 'TASK-711', titulo: 'Segunda tarea', rama: 'feature/task-711-dos' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, t2);
+    await runFinishCommand(tareasRoot, ['TASK-711'], '2026-09-08', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    const changelog = await readFile(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
+    assert.match(changelog, /TASK-710/);
+    assert.match(changelog, /TASK-711/);
+    // La mas reciente queda arriba (insercion bajo la cabecera).
+    assert.ok(changelog.indexOf('TASK-711') < changelog.indexOf('TASK-710'));
+
+    const index = await readFile(path.join(repoRoot, 'docs', 'INDEX.md'), 'utf8');
+    assert.match(index, /TASK-710/);
+    assert.match(index, /Segunda tarea/);
+
+    // El board refleja el estado final: ambas terminadas.
+    const board = await readFile(path.join(repoRoot, 'docs', 'BOARD.md'), 'utf8');
+    assert.match(board, /TASK-710/);
+    assert.match(board, /TASK-711/);
+  });
+});
````
