# Peticion de revision — TASK-013 (ronda 1)

- Tarea: TASK-013 — Comando taskctl review (revisión por pares de un solo agente)
- Rama revisada: feature/task-013-comando-taskctl-review-revision-por-pare
- Rama base: develop
- Commit revisado (HEAD): 4e6422fecdb97b76266b384e3bb65bab13db8f82
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
4e6422f feat(TASK-013): taskctl review — update desde la base, evidencia de merge y peticion de revision
b751adf tarea(TASK-013): en curso via taskctl start (rama creada por Git-Flow)
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-013/plan-final.md b/tareas/02-en-curso/TASK-013/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-013/plan-final.md
rename to tareas/02-en-curso/TASK-013/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-013/tarea.md b/tareas/02-en-curso/TASK-013/tarea.md
similarity index 98%
rename from tareas/01-en-diseno/TASK-013/tarea.md
rename to tareas/02-en-curso/TASK-013/tarea.md
index 0efffc0..73b291b 100644
--- a/tareas/01-en-diseno/TASK-013/tarea.md
+++ b/tareas/02-en-curso/TASK-013/tarea.md
@@ -6,7 +6,7 @@ sprint: 2
 etiquetas: []
 complejidad: media
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-013-comando-taskctl-review-revision-por-pare
 asignado_a: null
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 663ab77..e6001ba 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -9,6 +9,7 @@ import { runBoardCommand, BoardCommandError } from './commands/board.js';
 import { runStartCommand, StartCommandError } from './commands/start.js';
 import { runPlanCommand, PlanCommandError } from './commands/plan.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
+import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { resolveGitflowScriptsDir } from './fs/gitflow-runner.js';
 import { StateMachineError } from './core/state-machine.js';
 import { TaskFolderConflictError } from './fs/task-store.js';
@@ -31,8 +32,9 @@ Uso:
   taskctl start TASK-NNN
   taskctl plan TASK-NNN
   taskctl approve TASK-NNN
+  taskctl review TASK-NNN
 
-Comandos: new, import, board, start, plan, approve.
+Comandos: new, import, board, start, plan, approve, review.
 Ver docs/PLAN_SPRINTS.md en el repo del proyecto.
 `;
 
@@ -241,6 +243,35 @@ export async function main(argv: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'review') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const result = await runReviewCommand(tareasRoot, argv.slice(1), today(), {
+        repoCwd,
+        scriptsDir: resolveGitflowScriptsDir(),
+      });
+      process.stdout.write(
+        `Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
+          `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n` +
+          `Peticion de revision (ronda ${result.ronda}): ${result.peticionPath}\n` +
+          `Lanza el agente revisor con esa peticion y vuelca su salida en ` +
+          `${result.informePath}.\n`
+      );
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof ReviewCommandError ||
+        e instanceof StateMachineError ||
+        e instanceof TaskFolderConflictError
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
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
new file mode 100644
index 0000000..4d40f01
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -0,0 +1,247 @@
+/**
+ * taskctl review — TASK-013 de PLAN_SPRINTS.md. Cierra la fase de
+ * ejecucion y abre la de revision: trae los cambios de la rama base
+ * con el script Git-Flow del tipo, verifica con evidencia Git que el
+ * merge ocurrio (no lo supone), mueve la tarea a 03-en-revision/ y
+ * deja en revision/ la peticion para el agente revisor generico (con
+ * el diff real embebido) mas el scaffold de su informe.
+ *
+ * El CLI hace SOLO lo determinista: no invoca ningun LLM (decision
+ * con Carlos, 2026-09-05 — mismo patron que el plan minimo de
+ * TASK-010, donde el contenido lo redacta el agente que orquesta
+ * Claude Code). La fragmentacion de revisores por dominio es TASK-018
+ * y la puerta determinista build/lint/tests de la seccion 16
+ * (correccion 5) queda para TASK-018/019.
+ *
+ * `ultimo_commit_revisado` NO se actualiza aqui a proposito: segun la
+ * seccion 16.3 se actualiza cuando una revision TERMINA (informe
+ * aprobado), no cuando se genera la peticion.
+ */
+import path from 'node:path';
+import { mkdir, readdir, writeFile } from 'node:fs/promises';
+import type { Task } from '../core/task.js';
+import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import {
+  isWorkspaceClean,
+  currentBranch,
+  resolveBaseBranchForTipo,
+  isAncestor,
+  headCommit,
+  logOneline,
+  diffRange,
+} from '../fs/git.js';
+import { runGitflowScript } from '../fs/gitflow-runner.js';
+
+export class ReviewCommandError extends Error {}
+
+const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
+  feature: 'update-feature.sh',
+  fix: 'update-fix.sh',
+  hotfix: 'update-hotfix.sh',
+  release: 'update-release.sh',
+};
+
+export const REVISION_DIRNAME = 'revision';
+
+const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)\.md$/;
+
+export interface ReviewCommandDeps {
+  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
+  repoCwd: string;
+  /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
+  scriptsDir: string;
+}
+
+export interface ReviewCommandResult {
+  id: string;
+  rama: string;
+  baseBranch: string;
+  /** SHA de HEAD en el momento de generar la peticion. */
+  commitRevisado: string;
+  ronda: number;
+  filePath: string;
+  peticionPath: string;
+  informePath: string;
+}
+
+export function peticionTemplate(
+  task: Task,
+  baseBranch: string,
+  commitRevisado: string,
+  ronda: number,
+  fecha: string,
+  commits: string,
+  diff: string
+): string {
+  const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
+  const diffBlock = diff === '' ? '(sin diferencias respecto a la base)' : diff;
+  return (
+    `# Peticion de revision — ${task.id} (ronda ${ronda})\n\n` +
+    `- Tarea: ${task.id} — ${task.titulo}\n` +
+    `- Rama revisada: ${task.rama}\n` +
+    `- Rama base: ${baseBranch}\n` +
+    `- Commit revisado (HEAD): ${commitRevisado}\n` +
+    `- Fecha: ${fecha}\n` +
+    `- Agente revisor sugerido: ${task.agente_revisor}\n\n` +
+    '## Instrucciones para el agente revisor\n\n' +
+    'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
+    'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
+    'directorio temporal, corre la suite tu mismo y construye el caso que\n' +
+    'rompe el codigo antes de reportarlo. Clasifica cada hallazgo como\n' +
+    'CRITICO (perdida de datos, corrupcion de estado, el comando hace lo\n' +
+    'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
+    'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
+    'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
+    `informe de esta ronda (informe-revision-${ronda}.md), sin borrar la\n` +
+    'peticion.\n\n' +
+    `## Commits a revisar (git log ${baseBranch}..HEAD)\n\n` +
+    '````\n' +
+    `${commitsBlock}\n` +
+    '````\n\n' +
+    `## Diff completo (git diff ${baseBranch}..HEAD)\n\n` +
+    '````diff\n' +
+    `${diffBlock}\n` +
+    '````\n'
+  );
+}
+
+export function informeTemplate(task: Task, commitRevisado: string, ronda: number): string {
+  return (
+    `# Informe de revision — ${task.id} (ronda ${ronda})\n\n` +
+    `- Commit revisado: ${commitRevisado}\n` +
+    '- Revisor: (rellenar por el agente)\n' +
+    '- Veredicto: PENDIENTE (aprobada | cambios-solicitados)\n\n' +
+    '## Hallazgos\n\n' +
+    '(CRITICO / IMPORTANTE / MENOR con reproduccion, o "sin hallazgos" explicito.)\n'
+  );
+}
+
+/**
+ * Primera ronda libre: 1 + el mayor N entre los
+ * peticion-revision-N.md / informe-revision-N.md ya presentes.
+ */
+async function siguienteRonda(revisionDir: string): Promise<number> {
+  let entries: string[];
+  try {
+    entries = await readdir(revisionDir);
+  } catch (e: unknown) {
+    if (isEnoent(e)) return 1;
+    throw e;
+  }
+  let max = 0;
+  for (const entry of entries) {
+    const m = RONDA_FILE_RE.exec(entry);
+    if (m !== null) max = Math.max(max, Number(m[1]));
+  }
+  return max + 1;
+}
+
+export async function runReviewCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: ReviewCommandDeps
+): Promise<ReviewCommandResult> {
+  const id = argv[0];
+  if (id === undefined || id.trim() === '') {
+    throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
+  }
+
+  // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): sirve
+  // para rechazo rapido sin tocar Git y para extraer tipo/rama —
+  // metadata estable que ningun comando reescribe. La lectura que
+  // decide la escritura va DESPUES del script, que cambia de rama.
+  const initial = await readTareaFile(tareasRoot, id);
+  assertTransitionAllowed('review', initial ? initial.task : null);
+  const tipo = initial!.task.tipo;
+  const rama = initial!.task.rama;
+
+  // Mismo motivo que en start: el prompt interactivo de Git-Flow con
+  // stdin no interactivo cancela en silencio (EOF => "No" => exit 0).
+  if (!isWorkspaceClean(deps.repoCwd)) {
+    throw new ReviewCommandError(
+      `[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
+        'Haz commit o stash antes de "taskctl review" — el update de Git-Flow necesita el ' +
+        'workspace limpio y su prompt interactivo cancela en silencio sin terminal.'
+    );
+  }
+
+  const scriptName = SCRIPT_BY_TYPE[tipo];
+  const { code, signal } = runGitflowScript(scriptName, [rama], {
+    scriptsDir: deps.scriptsDir,
+    cwd: deps.repoCwd,
+  });
+  if (code !== 0) {
+    const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
+    throw new ReviewCommandError(
+      `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
+        'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo y haz commit ' +
+        'antes de reintentar); la tarea no se ha movido de carpeta.'
+    );
+  }
+
+  // Evidencia, no suposicion (TASK-007/009): rama activa correcta y
+  // merge de la base ocurrido de verdad (la base es antepasada de
+  // HEAD), no solo un exit 0 del script.
+  const branchNow = currentBranch(deps.repoCwd);
+  if (branchNow !== rama) {
+    throw new ReviewCommandError(
+      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
+        `"${branchNow}", no "${rama}". No se actualiza la tarea; revisa el repo a mano.`
+    );
+  }
+  const baseBranch = resolveBaseBranchForTipo(tipo, deps.repoCwd);
+  if (!isAncestor(baseBranch, 'HEAD', deps.repoCwd)) {
+    throw new ReviewCommandError(
+      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${baseBranch}" NO esta ` +
+        `integrada en "${rama}" (merge-base --is-ancestor lo niega). No se actualiza la ` +
+        'tarea; revisa el repo a mano.'
+    );
+  }
+
+  // Lectura FRESCA, ya con la rama de la tarea activa: la unica que
+  // decide si se muta algo y con que contenido (regla de la doble
+  // lectura — el update pudo traer de la base un tarea.md mas nuevo).
+  const existing = await readTareaFile(tareasRoot, id);
+  assertTransitionAllowed('review', existing ? existing.task : null);
+  const { task, body, filePath } = existing as NonNullable<typeof existing>;
+
+  const commitRevisado = headCommit(deps.repoCwd);
+  const commits = logOneline(baseBranch, 'HEAD', deps.repoCwd);
+  const diff = diffRange(baseBranch, 'HEAD', deps.repoCwd);
+
+  const updated: Task = { ...task, estado: 'en-revision', actualizado: today };
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+
+  // Peticion + scaffold de informe, numerados por ronda. Flag 'wx' en
+  // ambos: la numeracion garantiza un hueco libre, y si aun asi el
+  // fichero existiera (carrera, restos a medias), fallar ruidosamente
+  // es mejor que pisar una revision anterior — mismo principio que
+  // plan-final.md en TASK-010.
+  const revisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
+  await mkdir(revisionDir, { recursive: true });
+  const ronda = await siguienteRonda(revisionDir);
+  const peticionPath = path.join(revisionDir, `peticion-revision-${ronda}.md`);
+  const informePath = path.join(revisionDir, `informe-revision-${ronda}.md`);
+  await writeFile(
+    peticionPath,
+    peticionTemplate(updated, baseBranch, commitRevisado, ronda, today, commits, diff),
+    { encoding: 'utf8', flag: 'wx' }
+  );
+  await writeFile(informePath, informeTemplate(updated, commitRevisado, ronda), {
+    encoding: 'utf8',
+    flag: 'wx',
+  });
+
+  return {
+    id: task.id,
+    rama,
+    baseBranch,
+    commitRevisado,
+    ronda,
+    filePath: newFilePath,
+    peticionPath,
+    informePath,
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 8005dcd..c590799 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -90,6 +90,41 @@ export function isRemoteAvailable(cwd: string): boolean {
   return result.status === 0;
 }
 
+/** SHA completo del commit en HEAD. */
+export function headCommit(cwd: string): string {
+  return runGit(['rev-parse', 'HEAD'], cwd);
+}
+
+/**
+ * true si `ancestor` es antepasado de `descendant` (via
+ * `git merge-base --is-ancestor`). Es la evidencia que usa
+ * "taskctl review" (TASK-013) para confirmar que el update desde la
+ * rama base ocurrio de verdad, en vez de fiarse del exit 0 del script
+ * — mismo principio "evidencia, no suposicion" de TASK-007/009.
+ */
+export function isAncestor(ancestor: string, descendant: string, cwd: string): boolean {
+  const args = ['merge-base', '--is-ancestor', ancestor, descendant] as const;
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  if (result.error) {
+    throw new GitLaunchError(result.error);
+  }
+  if (result.status === 0) return true;
+  // Codigo 1 = "no es antepasado" (respuesta valida). Cualquier otro
+  // codigo es un error real (ref inexistente, repo corrupto...).
+  if (result.status === 1) return false;
+  throw new GitCommandError(args, result.stderr ?? '');
+}
+
+/** `git log --oneline <desde>..<hasta>` (vacio si no hay commits). */
+export function logOneline(desde: string, hasta: string, cwd: string): string {
+  return runGit(['log', '--oneline', `${desde}..${hasta}`], cwd);
+}
+
+/** `git diff <desde>..<hasta>` (vacio si no hay diferencias). */
+export function diffRange(desde: string, hasta: string, cwd: string): string {
+  return runGit(['diff', `${desde}..${hasta}`], cwd);
+}
+
 /** true si existe una referencia LOCAL para esa rama. */
 export function localBranchExists(name: string, cwd: string): boolean {
   const result = spawnSync(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
new file mode 100644
index 0000000..aae63d8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -0,0 +1,351 @@
+/**
+ * Test de integracion real (no mocks) para taskctl review (TASK-013):
+ * repos Git temporales de verdad, los scripts update-*.sh tal cual
+ * estan en el repo, y evidencia leida de Git (rama activa, merge
+ * commits, ancestria) en vez de fiarse de lo que devuelve el comando.
+ * Mismo espiritu que start.test.ts (TASK-009).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-600',
+    titulo: 'Tarea de prueba de review',
+    tipo: 'feature',
+    sprint: 2,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-curso',
+    plan_aprobado: true,
+    rama: 'feature/task-600-prueba-review',
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
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-review-'));
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
+/**
+ * Deja la tarea en-curso en su rama, como la habria dejado "taskctl
+ * start": rama creada desde develop, tarea.md commiteado en
+ * 02-en-curso/, y un commit de trabajo propio de la rama.
+ */
+async function setupTaskEnCurso(repoRoot: string, tareasRoot: string, task: Task): Promise<void> {
+  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar review.\n');
+  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo de la tarea\n', 'utf8');
+  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
+}
+
+/** Avanza develop con un cambio y vuelve a la rama indicada. */
+async function advanceDevelop(repoRoot: string, volverA: string): Promise<void> {
+  git(['checkout', '-q', 'develop'], repoRoot);
+  await writeFile(path.join(repoRoot, 'cambio-develop.txt'), 'cambio en develop\n', 'utf8');
+  commitAll(repoRoot, 'cambio en develop');
+  git(['checkout', '-q', volverA], repoRoot);
+}
+
+test('taskctl review: camino feliz sin origin — update real, evidencia de merge, mueve a 03-en-revision y genera peticion + informe', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-600');
+    assert.equal(result.baseBranch, 'develop');
+    assert.equal(result.ronda, 1);
+    assert.match(result.filePath, /03-en-revision[/\\]TASK-600[/\\]tarea\.md$/);
+
+    // Evidencia real de Git, no solo el valor devuelto.
+    const branch = git(['branch', '--show-current'], repoRoot).trim();
+    assert.equal(branch, task.rama);
+    const log = git(['log', '--oneline'], repoRoot);
+    assert.match(log, /update\(feature\): develop -> feature\/task-600-prueba-review/);
+    const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', 'develop', 'HEAD'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.equal(ancestor.status, 0, 'develop deberia ser antepasado de HEAD tras el update');
+
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-revision');
+    assert.equal(read?.task.actualizado, '2026-09-06');
+    // ultimo_commit_revisado NO se toca al generar la peticion (16.3:
+    // se actualiza cuando la revision TERMINA, no cuando empieza).
+    assert.equal(read?.task.ultimo_commit_revisado, null);
+    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600')));
+
+    // La peticion contiene el diff real (el cambio que vino de develop
+    // y el trabajo de la rama) y el SHA revisado.
+    const peticion = await readFile(result.peticionPath, 'utf8');
+    assert.doesNotMatch(peticion, /cambio-develop\.txt/);
+    assert.match(peticion, /trabajo\.txt/);
+    assert.ok(peticion.includes(result.commitRevisado));
+    const headSha = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    assert.equal(result.commitRevisado, headSha);
+
+    const informe = await readFile(result.informePath, 'utf8');
+    assert.match(informe, /Informe de revision — TASK-600 \(ronda 1\)/);
+    assert.match(informe, /PENDIENTE/);
+  });
+});
+
+test('taskctl review: con origin (bare real) integra un cambio que solo existia en el remoto', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await mkdtemp(path.join(tmpdir(), 'taskctl-review-origin-'));
+    const otherClone = await mkdtemp(path.join(tmpdir(), 'taskctl-review-clone-'));
+    try {
+      git(['init', '-q', '--bare', origin], origin);
+      git(['remote', 'add', 'origin', origin], repoRoot);
+      git(['push', '-q', 'origin', 'main', 'develop'], repoRoot);
+
+      const task = sampleTask({ id: 'TASK-601', rama: 'feature/task-601-con-origin' });
+      await setupTaskEnCurso(repoRoot, tareasRoot, task);
+
+      // Otro colaborador avanza develop directamente en el remoto.
+      git(['clone', '-q', '--branch', 'develop', origin, 'clon'], otherClone);
+      const clonDir = path.join(otherClone, 'clon');
+      git(['config', 'user.email', 'otro@example.com'], clonDir);
+      git(['config', 'user.name', 'Otro'], clonDir);
+      await writeFile(path.join(clonDir, 'remoto.txt'), 'cambio remoto\n', 'utf8');
+      git(['add', '-A'], clonDir);
+      git(['commit', '-q', '-m', 'cambio remoto en develop'], clonDir);
+      git(['push', '-q', 'origin', 'develop'], clonDir);
+
+      const result = await runReviewCommand(tareasRoot, ['TASK-601'], '2026-09-06', {
+        repoCwd: repoRoot,
+        scriptsDir: SCRIPTS_DIR,
+      });
+
+      // El cambio que SOLO existia en origin/develop llego a la rama.
+      await stat(path.join(repoRoot, 'remoto.txt'));
+      const log = git(['log', '--oneline'], repoRoot);
+      assert.match(log, /update\(feature\): develop -> feature\/task-601-con-origin/);
+      const peticion = await readFile(result.peticionPath, 'utf8');
+      assert.doesNotMatch(peticion, /remoto\.txt/);
+      const read = await readTareaFile(tareasRoot, 'TASK-601');
+      assert.equal(read?.task.estado, 'en-revision');
+    } finally {
+      await rm(origin, { recursive: true, force: true });
+      await rm(otherClone, { recursive: true, force: true });
+    }
+  });
+});
+
+test('taskctl review: rechaza una tarea que no esta en-curso, sin tocar Git ni carpetas', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ estado: 'en-diseno', plan_aprobado: true });
+    await writeTareaFile(tareasRoot, task, '');
+    commitAll(repoRoot, 'tarea en diseno');
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof StateMachineError);
+        assert.match((e as Error).message, /taskctl start/);
+        return true;
+      }
+    );
+
+    // Nada se movio ni se creo: sin 03-en-revision, sin revision/.
+    const branch = git(['branch', '--show-current'], repoRoot).trim();
+    assert.equal(branch, 'develop');
+    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision')));
+    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-600', 'revision')));
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-diseno');
+  });
+});
+
+test('taskctl review: rechaza con el workspace sucio, sin invocar el script', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear\n', 'utf8');
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      ReviewCommandError
+    );
+
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-curso');
+    // El update no llego a ejecutarse: develop no esta mergeada.
+    const log = git(['log', '--oneline'], repoRoot);
+    assert.doesNotMatch(log, /update\(feature\)/);
+  });
+});
+
+test('taskctl review: si el script falla (conflicto de merge real), no mueve la tarea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    // Conflicto real: la rama y develop cambian la MISMA linea del README.
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '');
+    await writeFile(path.join(repoRoot, 'README.md'), '# version de la rama\n', 'utf8');
+    commitAll(repoRoot, 'cambio en la rama');
+    git(['checkout', '-q', 'develop'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), '# version de develop\n', 'utf8');
+    commitAll(repoRoot, 'cambio en develop');
+    git(['checkout', '-q', task.rama], repoRoot);
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof ReviewCommandError);
+        assert.match((e as Error).message, /conflicto/);
+        return true;
+      }
+    );
+
+    // La tarea sigue en-curso y sin revision/ — el conflicto queda en
+    // el workspace para resolver a mano (comportamiento del script).
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-curso');
+    await assert.rejects(() => stat(path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision')));
+  });
+});
+
+test('taskctl review: script con exit 0 que NO mergea la base -> evidencia lo detecta y no mueve nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    await advanceDevelop(repoRoot, task.rama);
+
+    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-update-'));
+    await writeFile(
+      path.join(fakeScriptsDir, 'update-feature.sh'),
+      '#!/usr/bin/env bash\nexit 0\n',
+      'utf8'
+    );
+
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: fakeScriptsDir,
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof ReviewCommandError);
+        assert.match((e as Error).message, /is-ancestor/);
+        return true;
+      }
+    );
+
+    const read = await readTareaFile(tareasRoot, 'TASK-600');
+    assert.equal(read?.task.estado, 'en-curso');
+    await rm(fakeScriptsDir, { recursive: true, force: true });
+  });
+});
+
+test('taskctl review: una segunda ronda numera peticion e informe como -2 sin pisar la ronda anterior', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    // Restos commiteados de una ronda anterior (como los dejaria un
+    // ciclo review -> cambios-solicitados -> vuelta a en-curso).
+    const revisionDir = path.join(tareasRoot, '02-en-curso', 'TASK-600', 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(path.join(revisionDir, 'peticion-revision-1.md'), 'ronda anterior\n', 'utf8');
+    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), 'informe anterior\n', 'utf8');
+    commitAll(repoRoot, 'restos de la ronda 1');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-600'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.ronda, 2);
+    assert.match(result.peticionPath, /peticion-revision-2\.md$/);
+    // La ronda anterior sigue intacta (se movio con la carpeta).
+    const anterior = await readFile(
+      path.join(tareasRoot, '03-en-revision', 'TASK-600', 'revision', 'peticion-revision-1.md'),
+      'utf8'
+    );
+    // Normalizado: el fichero pasa por un checkout de Git durante el
+    // update y con core.autocrlf=true puede volver con CRLF.
+    assert.equal(anterior.split('\r\n').join('\n'), 'ronda anterior\n');
+  });
+});
+
+test('taskctl review: error claro si falta el ID o la tarea no existe', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await assert.rejects(
+      () => runReviewCommand(tareasRoot, [], '2026-09-06', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+      ReviewCommandError
+    );
+    await assert.rejects(
+      () =>
+        runReviewCommand(tareasRoot, ['TASK-999'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      StateMachineError
+    );
+  });
+});
````
