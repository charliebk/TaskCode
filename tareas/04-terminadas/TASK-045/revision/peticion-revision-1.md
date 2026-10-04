# Peticion de revision — TASK-045 (ronda 1)

- Tarea: TASK-045 — F5-T1 rama_base de punta a punta
- Rama revisada: fix/task-045-f5-t1-rama-base-de-punta-a-punta
- Rama base: develop
- Commit revisado (HEAD): e48ed50f5f6ddab23d9c9233db873618933e38ba
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-045 (criterios de aceptacion y plan)

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
e48ed50 fix(TASK-045): rama_base llega a start, review y finish
510a2bf chore(TASK-045): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index a3c87cb..655c703 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -36,6 +36,7 @@ import {
   showFileAtRef,
   mergeBase,
   checkoutBranch,
+  resolveIntegrationBranch,
 } from '../fs/git.js';
 import {
   autoCommit,
@@ -57,7 +58,7 @@ const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
   release: 'merge-release-to-main.sh',
 };
 
-/** hotfix/release mergean a main (con tag) y backmergean a develop. */
+/** hotfix/release mergean a main (con tag) y backmergean a la rama de integracion. */
 const MERGEA_A_MAIN: Record<Task['tipo'], boolean> = {
   feature: false,
   fix: false,
@@ -65,7 +66,6 @@ const MERGEA_A_MAIN: Record<Task['tipo'], boolean> = {
   release: true,
 };
 
-const DEVELOP_BRANCH = 'develop';
 /**
  * TASK-018: una ronda de revision fragmentada por dominio deja N
  * informes, uno por revisor, con el nombre de la skill como sufijo
@@ -252,7 +252,7 @@ export interface FinishCommandDeps {
 export interface FinishCommandResult {
   id: string;
   rama: string;
-  /** Rama en la que termina el comando (develop). */
+  /** Rama en la que termina el comando: la de integracion (`rama_base`, develop por defecto). */
   baseBranch: string;
   /** Rama principal mergeada ademas, solo para hotfix/release. */
   mainBranch: string | null;
@@ -316,11 +316,17 @@ export async function runFinishCommand(
     );
   }
 
+  // TASK-045 (D1): la rama de integracion sale de `rama_base`, no de un
+  // literal "develop". Se resuelve una vez, antes de cualquier merge, y
+  // se pasa a los cuatro scripts con --develop (hotfix/release la
+  // necesitan para el backmerge).
+  const ramaIntegracion = resolveIntegrationBranch(deps.repoCwd);
+
   // Colision de IDs ANTES de mergear (criterio 4): se comprueba contra
-  // cada rama destino del merge. Para feature/fix solo develop; para
+  // cada rama destino del merge. Para feature/fix solo la de integracion; para
   // hotfix/release tambien la principal.
   const mainBranch = MERGEA_A_MAIN[tipo] ? resolveMainBranch(deps.repoCwd) : null;
-  const destinos = mainBranch === null ? [DEVELOP_BRANCH] : [mainBranch, DEVELOP_BRANCH];
+  const destinos = mainBranch === null ? [ramaIntegracion] : [mainBranch, ramaIntegracion];
   for (const destino of destinos) {
     const colision = detectarColisionId(id, titulo, rama, destino, deps.repoCwd);
     if (colision !== null) {
@@ -342,7 +348,7 @@ export async function runFinishCommand(
   }
 
   const scriptName = SCRIPT_BY_TYPE[tipo];
-  const integradaEnDevelop = isAncestor(rama, DEVELOP_BRANCH, deps.repoCwd);
+  const integradaEnDevelop = isAncestor(rama, ramaIntegracion, deps.repoCwd);
   const integradaEnMain = mainBranch === null || isAncestor(rama, mainBranch, deps.repoCwd);
 
   if (integradaEnDevelop && integradaEnMain) {
@@ -350,21 +356,21 @@ export async function runFinishCommand(
     // TASK-014): los merges ya estan consumados — p. ej. un reintento
     // tras resolver a mano un conflicto de backmerge. Reejecutar el
     // script moriria en el tag ya creado (hotfix/release); aqui solo
-    // queda cerrar: ponerse en develop y mover/renderizar.
-    if (currentBranch(deps.repoCwd) !== DEVELOP_BRANCH) {
-      checkoutBranch(DEVELOP_BRANCH, deps.repoCwd);
+    // queda cerrar: ponerse en la rama de integracion y mover/renderizar.
+    if (currentBranch(deps.repoCwd) !== ramaIntegracion) {
+      checkoutBranch(ramaIntegracion, deps.repoCwd);
     }
   } else if (mainBranch !== null && integradaEnMain && !integradaEnDevelop) {
     // Estado a medias: merge a main (y su tag) consumados, backmerge
     // pendiente. Reejecutar el script chocaria con el tag duplicado.
     throw new FinishCommandError(
       `[ERROR] ${id}: el merge a "${mainBranch}" (con su tag) ya esta consumado pero falta ` +
-        `el backmerge a "${DEVELOP_BRANCH}". No se reejecuta ${scriptName} (moriria en el tag ` +
-        `duplicado): completa el backmerge a mano — git checkout ${DEVELOP_BRANCH} && ` +
+        `el backmerge a "${ramaIntegracion}". No se reejecuta ${scriptName} (moriria en el tag ` +
+        `duplicado): completa el backmerge a mano — git checkout ${ramaIntegracion} && ` +
         `git merge --no-ff ${rama} — y reintenta taskctl finish.`
     );
   } else {
-    const { code, signal } = runGitflowScript(scriptName, [rama], {
+    const { code, signal } = runGitflowScript(scriptName, [rama, '--develop', ramaIntegracion], {
       scriptsDir: deps.scriptsDir,
       cwd: deps.repoCwd,
     });
@@ -378,21 +384,21 @@ export async function runFinishCommand(
     }
 
     // Evidencia, no suposicion (TASK-007/009): los cuatro scripts
-    // terminan en develop, con la rama de la tarea integrada; para
+    // terminan en la rama de integracion, con la rama de la tarea integrada; para
     // hotfix/release ademas integrada en la principal. Un backmerge
     // cancelado sale del script con exit 0 ("PARCIAL") — lo detecta la
     // ancestria, no el exit code.
     const branchNow = currentBranch(deps.repoCwd);
-    if (branchNow !== DEVELOP_BRANCH) {
+    if (branchNow !== ramaIntegracion) {
       throw new FinishCommandError(
         `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
-          `"${branchNow}", no "${DEVELOP_BRANCH}". No se actualiza la tarea; revisa el repo a mano.`
+          `"${branchNow}", no "${ramaIntegracion}". No se actualiza la tarea; revisa el repo a mano.`
       );
     }
     if (!isAncestor(rama, 'HEAD', deps.repoCwd)) {
       throw new FinishCommandError(
         `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
-          `en "${DEVELOP_BRANCH}" (merge-base --is-ancestor lo niega). ¿Backmerge cancelado o ` +
+          `en "${ramaIntegracion}" (merge-base --is-ancestor lo niega). ¿Backmerge cancelado o ` +
           'merge a medias? No se actualiza la tarea; revisa el repo a mano.'
       );
     }
@@ -405,9 +411,9 @@ export async function runFinishCommand(
     }
   }
 
-  // Lectura FRESCA, ya en develop con el merge consumado: la unica que
+  // Lectura FRESCA, ya en la rama de integracion con el merge consumado: la unica que
   // decide la escritura. El contexto de aprobacion se recalcula sobre
-  // la carpeta que el merge dejo en develop.
+  // la carpeta que el merge dejo en ella.
   const existing = await readTareaFile(tareasRoot, id);
   const ctx =
     existing === null ? {} : await buildTransitionContext(path.dirname(existing.filePath));
@@ -441,7 +447,7 @@ export async function runFinishCommand(
 
   // Paso 5 de la 8.3 (TASK-030, item C2). "finish" commitea sobre
   // DEVELOP, no sobre la rama de la tarea: cuando llega aqui el merge
-  // ya esta consumado y el comando termina siempre en develop (se
+  // ya esta consumado y el comando termina siempre en la rama de integracion (se
   // comprueba mas arriba). Es lo que se venia haciendo a mano; queda
   // fijado con un test para que nadie lo "arregle" mas adelante.
   // Ademas de las dos carpetas de la tarea entran los tres artefactos
@@ -464,7 +470,7 @@ export async function runFinishCommand(
   return {
     id: task.id,
     rama,
-    baseBranch: DEVELOP_BRANCH,
+    baseBranch: ramaIntegracion,
     mainBranch,
     filePath: newFilePath,
     changelogPath,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 83418dc..52f2cee 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -44,6 +44,7 @@ import {
   isWorkspaceClean,
   currentBranch,
   resolveBaseBranchForTipo,
+  gitflowBaseArgs,
   isAncestor,
   headCommit,
   logOneline,
@@ -386,7 +387,7 @@ export async function runReviewCommand(
   // base entraria en el delta); exige estar ya en la rama de la tarea.
   const { code, signal } = incremental
     ? { code: 0, signal: null }
-    : runGitflowScript(scriptName, [rama], {
+    : runGitflowScript(scriptName, [rama, ...gitflowBaseArgs(tipo, deps.repoCwd)], {
         scriptsDir: deps.scriptsDir,
         cwd: deps.repoCwd,
       });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index dd3e4eb..527d29f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -37,6 +37,7 @@ import {
   isValidBranchName,
   gitUserEmail,
   resolveBaseBranchForTipo,
+  gitflowBaseArgs,
 } from '../fs/git.js';
 import {
   autoCommit,
@@ -242,7 +243,9 @@ export async function runStartCommand(
   }
 
   const scriptName = SCRIPT_BY_TYPE[task.tipo];
-  const { code, signal } = runGitflowScript(scriptName, [task.rama], {
+  // La rama va primero: los scripts toman como nombre el primer no-flag.
+  const scriptArgs = [task.rama, ...gitflowBaseArgs(task.tipo, deps.repoCwd)];
+  const { code, signal } = runGitflowScript(scriptName, scriptArgs, {
     scriptsDir: deps.scriptsDir,
     cwd: deps.repoCwd,
   });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 96889f0..a1fef19 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -570,9 +570,31 @@ const RAMA_BASE_ES_DEVELOP: Record<Task['tipo'], boolean> = {
  */
 export function resolveBaseBranchForTipo(tipo: Task['tipo'], cwd: string): string {
   if (!RAMA_BASE_ES_DEVELOP[tipo]) return resolveMainBranch(cwd);
+  return resolveIntegrationBranch(cwd);
+}
+
+/**
+ * Rama de integracion: la `rama_base` del config ("develop" sin fichero).
+ * Es la base de feature/fix/release y el destino del backmerge de
+ * hotfix/release en finish — que por eso no puede usar
+ * resolveBaseBranchForTipo, que para hotfix devuelve la principal.
+ */
+export function resolveIntegrationBranch(cwd: string): string {
   return resolverConfig(cwd).rama_base;
 }
 
+/**
+ * Argumentos con los que los scripts create-/update-* reciben la rama
+ * base (TASK-045). Los de feature/fix/release la toman de `--develop` y,
+ * sin el, usan "develop" literal; los de hotfix trabajan contra la
+ * principal y no conocen el flag, asi que no se les pasa (y no se
+ * resuelve nada: resolveMainBranch puede costar ls-remote).
+ */
+export function gitflowBaseArgs(tipo: Task['tipo'], cwd: string): string[] {
+  if (!RAMA_BASE_ES_DEVELOP[tipo]) return [];
+  return ['--develop', resolveIntegrationBranch(cwd)];
+}
+
 export class BaseBranchGuardError extends Error {}
 
 export interface BaseBranchGuardResult {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/rama-base.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/rama-base.test.ts
new file mode 100644
index 0000000..fd0af36
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/rama-base.test.ts
@@ -0,0 +1,235 @@
+/**
+ * `rama_base` de punta a punta (TASK-045, D1 de la auditoria). Hasta
+ * esta tarea la clave solo llegaba a `approve`: `start`, `review` y
+ * `finish` llamaban a los scripts de Git-Flow sin `--develop`, y
+ * `finish.ts` fijaba "develop", asi que con `rama_base: dev` el ciclo
+ * moria en `start` con «develop no existe».
+ *
+ * Repos Git temporales reales y los scripts de scripts/gitflow/ tal
+ * cual. En ninguno existe nunca una rama `develop`: si algun comando
+ * volviera a caer en el literal, el script fallaria o la crearia, y las
+ * dos cosas se ven aqui.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runNewCommand } from '../../src/commands/new.js';
+import { runPlanCommand } from '../../src/commands/plan.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { gitflowBaseArgs, resolveIntegrationBranch } from '../../src/fs/git.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/commands -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+const HOY = '2026-10-04';
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
+function existeRama(rama: string, cwd: string): boolean {
+  return (
+    spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${rama}`], { cwd }).status ===
+    0
+  );
+}
+
+function esAncestro(a: string, b: string, cwd: string): boolean {
+  return spawnSync('git', ['merge-base', '--is-ancestor', a, b], { cwd }).status === 0;
+}
+
+/**
+ * Repo con `main` y `dev`, sin `develop`. El config se commitea en
+ * main ANTES de crear dev, como en un repo real donde el config ya ha
+ * llegado a la principal: asi lo ven tambien las ramas de hotfix, que
+ * nacen de main.
+ */
+async function withRepoDev(
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-rama-base-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'rama_base: dev\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'dev'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+const PLAN_REDACTADO =
+  '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt y comprobar que el ciclo cierra sobre dev.\n';
+
+/** Lo que haria el revisor: informe con veredicto aprobado, commiteado. */
+async function aprobarRevision(repoRoot: string, tareasRoot: string, id: string): Promise<void> {
+  const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
+  await writeFile(
+    path.join(revisionDir, 'informe-revision-1.md'),
+    `# Informe de revision — ${id} (ronda 1)\n\n- Veredicto: aprobada (sin hallazgos)\n`,
+    'utf8'
+  );
+  commitAll(repoRoot, `chore(${id}): veredicto`);
+}
+
+test('gitflowBaseArgs: --develop con la rama base para feature/fix/release; nada para hotfix', async () => {
+  await withRepoDev(async (repoRoot) => {
+    assert.equal(resolveIntegrationBranch(repoRoot), 'dev');
+    for (const tipo of ['feature', 'fix', 'release'] as const) {
+      assert.deepEqual(gitflowBaseArgs(tipo, repoRoot), ['--develop', 'dev']);
+    }
+    // create-/update-hotfix.sh no conocen el flag: trabajan contra la principal.
+    assert.deepEqual(gitflowBaseArgs('hotfix', repoRoot), []);
+  });
+});
+
+test('rama_base: dev — new -> plan -> approve -> start -> review -> finish termina sobre dev y nunca crea develop', async () => {
+  await withRepoDev(async (repoRoot, tareasRoot) => {
+    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
+    const creada = await runNewCommand(
+      tareasRoot,
+      [
+        '--titulo',
+        'Ciclo completo sobre dev',
+        '--tipo',
+        'feature',
+        '--complejidad',
+        'simple',
+        '--objetivo',
+        'Que el ciclo entero funcione con rama_base dev.',
+        '--criterio',
+        'El comando finish deja la tarea en 04-terminadas',
+      ],
+      HOY,
+      { repoCwd: repoRoot }
+    );
+    const id = creada.id;
+
+    await runPlanCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot });
+    await writeFile(
+      path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
+      PLAN_REDACTADO,
+      'utf8'
+    );
+    commitAll(repoRoot, `docs(${id}): plan final`);
+    await runApproveCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot });
+
+    const iniciada = await runStartCommand(tareasRoot, [id], HOY, deps);
+    const leida = await readTareaFile(tareasRoot, id);
+    const rama = (leida as NonNullable<typeof leida>).task.rama;
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
+    // La rama de la tarea nace de dev.
+    assert.ok(esAncestro('dev', rama, repoRoot), 'la rama de la tarea debe nacer de dev');
+    assert.ok(iniciada.filePath.includes('02-en-curso'));
+
+    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado por la tarea\n', 'utf8');
+    commitAll(repoRoot, `feat(${id}): trabajo`);
+
+    // Avanza dev mientras tanto: review tiene que traerla (update-feature.sh --develop dev).
+    git(['checkout', '-q', 'dev'], repoRoot);
+    await writeFile(path.join(repoRoot, 'otro.txt'), 'trabajo de otra persona\n', 'utf8');
+    commitAll(repoRoot, 'feat: otro cambio en dev');
+    git(['checkout', '-q', rama], repoRoot);
+
+    const revisada = await runReviewCommand(tareasRoot, [id], HOY, deps);
+    assert.equal(revisada.baseBranch, 'dev');
+    assert.ok(esAncestro('dev', rama, repoRoot), 'review debe integrar dev en la rama de la tarea');
+    await aprobarRevision(repoRoot, tareasRoot, id);
+
+    const cerrada = await runFinishCommand(tareasRoot, [id], HOY, deps);
+
+    assert.equal(cerrada.baseBranch, 'dev');
+    assert.equal(cerrada.autoCommit.rama, 'dev');
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'dev');
+    assert.ok(esAncestro(rama, 'dev', repoRoot), 'la rama de la tarea debe quedar integrada en dev');
+    const final = await readTareaFile(tareasRoot, id);
+    assert.equal(final?.task.estado, 'terminada');
+    assert.ok(final?.filePath.includes('04-terminadas'));
+    assert.equal(existeRama('develop', repoRoot), false, 'ningun paso debe crear develop');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+/** Tarea ya aprobada en dev, commiteada, lista para start. */
+async function tareaAprobada(tareasRoot: string, repoRoot: string, task: Task): Promise<void> {
+  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el backmerge.\n');
+  commitAll(repoRoot, `chore(${task.id}): plan aprobado`);
+}
+
+function tareaDeTipo(id: string, tipo: Task['tipo'], rama: string): Task {
+  return {
+    id,
+    titulo: `Backmerge ${tipo}`,
+    tipo,
+    sprint: 0,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-diseno',
+    plan_aprobado: true,
+    rama,
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: HOY,
+    actualizado: HOY,
+    dependencias: [],
+  };
+}
+
+for (const caso of [
+  { id: 'TASK-951', tipo: 'release' as const, rama: 'release/task-951-cierre' },
+  { id: 'TASK-952', tipo: 'hotfix' as const, rama: 'hotfix/task-952-urgente' },
+]) {
+  test(`rama_base: dev — ${caso.tipo}: start -> review -> finish mergea a main y hace el backmerge a dev`, async () => {
+    await withRepoDev(async (repoRoot, tareasRoot) => {
+      const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
+      const task = tareaDeTipo(caso.id, caso.tipo, caso.rama);
+      // El hotfix tiene que ver su tarea desde main, que es de donde nace.
+      if (caso.tipo === 'hotfix') git(['checkout', '-q', 'main'], repoRoot);
+      await tareaAprobada(tareasRoot, repoRoot, task);
+
+      await runStartCommand(tareasRoot, [caso.id], HOY, deps);
+      assert.equal(git(['branch', '--show-current'], repoRoot).trim(), caso.rama);
+      await writeFile(path.join(repoRoot, `trabajo-${caso.id}.txt`), 'trabajo\n', 'utf8');
+      commitAll(repoRoot, `fix(${caso.id}): trabajo`);
+      await runReviewCommand(tareasRoot, [caso.id], HOY, deps);
+      await aprobarRevision(repoRoot, tareasRoot, caso.id);
+
+      const cerrada = await runFinishCommand(tareasRoot, [caso.id], HOY, deps);
+
+      assert.equal(cerrada.mainBranch, 'main');
+      assert.equal(cerrada.baseBranch, 'dev');
+      assert.ok(esAncestro(caso.rama, 'main', repoRoot), 'integrada en main');
+      assert.ok(esAncestro(caso.rama, 'dev', repoRoot), 'backmerge a dev');
+      assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'dev');
+      assert.equal(existeRama('develop', repoRoot), false, 'ningun paso debe crear develop');
+      const final = await readTareaFile(tareasRoot, caso.id);
+      assert.equal(final?.task.estado, 'terminada');
+    });
+  });
+}
````

## Excluido del diff (8 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-045/tarea.md                                                     | 35 -----------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-045/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-045/planificacion/plan-final.md                 |  0
 tareas/02-en-curso/TASK-045/tarea.md                                                      | 68 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                  | 44 ++++++++++++++++++++++++--------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                  |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                   |  6 ++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                           | 21 +++++++++++++++++++++
 8 files changed, 119 insertions(+), 59 deletions(-)
````
