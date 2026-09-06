# Peticion de revision — TASK-024 (ronda 1)

- Tarea: TASK-024 — asignado_a por defecto desde la identidad Git
- Rama revisada: feature/task-024-asignado-a-por-defecto-desde-la-identida
- Rama base: develop
- Commit revisado (HEAD): 6c57ccc4c5bac7f171bc9ba9f09d4ff378d5b6bc
- Fecha: 2026-09-05
- Agente revisor sugerido: general-purpose

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
6c57ccc feat(TASK-024): asignado_a por defecto desde la identidad Git
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/00-planificadas/TASK-004/tarea.md b/tareas/00-planificadas/TASK-004/tarea.md
index 7d57e32..1e9942d 100644
--- a/tareas/00-planificadas/TASK-004/tarea.md
+++ b/tareas/00-planificadas/TASK-004/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: planificada
 plan_aprobado: false
 rama: feature/task-004-taskctl-import
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/tareas/00-planificadas/TASK-005/tarea.md b/tareas/00-planificadas/TASK-005/tarea.md
index d7b971a..b8d70c6 100644
--- a/tareas/00-planificadas/TASK-005/tarea.md
+++ b/tareas/00-planificadas/TASK-005/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: haiku
 estado: planificada
 plan_aprobado: false
 rama: feature/task-005-taskctl-board
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/tareas/00-planificadas/TASK-006/tarea.md b/tareas/00-planificadas/TASK-006/tarea.md
index 2c5fb0d..345f533 100644
--- a/tareas/00-planificadas/TASK-006/tarea.md
+++ b/tareas/00-planificadas/TASK-006/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: planificada
 plan_aprobado: false
 rama: feature/task-006-empaquetado-plugin
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: 655879a
diff --git a/tareas/00-planificadas/TASK-007/tarea.md b/tareas/00-planificadas/TASK-007/tarea.md
index f060290..3cb8d23 100644
--- a/tareas/00-planificadas/TASK-007/tarea.md
+++ b/tareas/00-planificadas/TASK-007/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: planificada
 plan_aprobado: false
 rama: fix/task-007-spike-gitflow-windows
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/tareas/00-planificadas/TASK-008/tarea.md b/tareas/00-planificadas/TASK-008/tarea.md
index e2bff3c..6a79195 100644
--- a/tareas/00-planificadas/TASK-008/tarea.md
+++ b/tareas/00-planificadas/TASK-008/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: planificada
 plan_aprobado: false
 rama: feature/task-008-migrar-scripts-git-flow-a-scripts-gitflo
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/tareas/00-planificadas/TASK-009/tarea.md b/tareas/00-planificadas/TASK-009/tarea.md
index fa23e81..92379a8 100644
--- a/tareas/00-planificadas/TASK-009/tarea.md
+++ b/tareas/00-planificadas/TASK-009/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: planificada
 plan_aprobado: false
 rama: feature/task-009-taskctl-start-crea-rama-via-create-tipo
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/tareas/00-planificadas/TASK-010/tarea.md b/tareas/00-planificadas/TASK-010/tarea.md
index 5f117e2..8d69790 100644
--- a/tareas/00-planificadas/TASK-010/tarea.md
+++ b/tareas/00-planificadas/TASK-010/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: planificada
 plan_aprobado: false
 rama: feature/task-010-taskctl-plan-version-minima-un-solo-agen
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/tareas/00-planificadas/TASK-011/tarea.md b/tareas/00-planificadas/TASK-011/tarea.md
index 1f5740a..da350d1 100644
--- a/tareas/00-planificadas/TASK-011/tarea.md
+++ b/tareas/00-planificadas/TASK-011/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: planificada
 plan_aprobado: false
 rama: feature/task-011-taskctl-approve-checkpoint-humano-marca
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/tareas/00-planificadas/TASK-012/tarea.md b/tareas/00-planificadas/TASK-012/tarea.md
index 4e66d20..90bc2c2 100644
--- a/tareas/00-planificadas/TASK-012/tarea.md
+++ b/tareas/00-planificadas/TASK-012/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: planificada
 plan_aprobado: false
 rama: feature/task-012-precondicion-de-rama-base-workspace-limp
-asignado_a: charlie.bk
+asignado_a: charlie.bk@gmail.com
 agente_revisor: general-purpose
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/tareas/01-en-diseno/TASK-024/plan-final.md b/tareas/02-en-curso/TASK-024/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-024/plan-final.md
rename to tareas/02-en-curso/TASK-024/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-024/tarea.md b/tareas/02-en-curso/TASK-024/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-024/tarea.md
rename to tareas/02-en-curso/TASK-024/tarea.md
index 63ecefb..12f65fe 100644
--- a/tareas/01-en-diseno/TASK-024/tarea.md
+++ b/tareas/02-en-curso/TASK-024/tarea.md
@@ -6,7 +6,7 @@ sprint: 2
 etiquetas: [cli, identidad]
 complejidad: simple
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-024-asignado-a-por-defecto-desde-la-identida
 asignado_a: charlie.bk@gmail.com
diff --git a/tareas/04-terminadas/TASK-015/tarea.md b/tareas/04-terminadas/TASK-015/tarea.md
index 17f548b..fdf0d62 100644
--- a/tareas/04-terminadas/TASK-015/tarea.md
+++ b/tareas/04-terminadas/TASK-015/tarea.md
@@ -9,7 +9,7 @@ modelo_sugerido: sonnet
 estado: terminada
 plan_aprobado: true
 rama: feature/task-015-limite-de-trabajo-en-curso-por-persona
-asignado_a: carlos
+asignado_a: charlie.bk@gmail.com
 agente_revisor: typescript-reviewer
 skills_recomendados: []
 ultimo_commit_revisado: null
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index e0e00d5..871f4d3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -25,7 +25,8 @@ import { parseAsignadoAFlag, PISTA_VACIO_ESCRITURA } from '../cli/asignado.js';
 import type { Task } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
-import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
+import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
+import { resolverAsignado } from '../core/wip.js';
 
 export class PlanCommandError extends Error {}
 
@@ -125,9 +126,11 @@ export async function runPlanCommand(
   // rama base mientras tanto, y decidir "cambio o no" con la lectura
   // vieja daria un asignadoCambiado mentiroso — la misma regla de doble
   // lectura que obliga TASK-012.
-  // Sin flag se CONSERVA lo que hubiera: "no lo has mencionado" no es
-  // "quitalo".
-  const asignadoFinal = asignadoA !== undefined ? asignadoA : task.asignado_a;
+  // Precedencia (TASK-024): flag > asignado_a previo > identidad Git >
+  // null. Sin flag se CONSERVA lo que hubiera ("no lo has mencionado"
+  // no es "quitalo"), y solo si no habia nada entra la identidad de
+  // quien ejecuta.
+  const asignadoFinal = resolverAsignado(asignadoA, task.asignado_a, gitUserEmail(deps.repoCwd));
   const asignadoCambiado = asignadoFinal !== task.asignado_a;
 
   const updated: Task = {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index 3071b9b..0256abc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -18,12 +18,13 @@ import { readTareaFile, moveTareaFile, listTareasEnEstados } from '../fs/task-st
 import {
   ESTADOS_QUE_OCUPAN_WIP,
   tareasQueBloquean,
+  resolverAsignado,
   mensajeWipExcedido,
   mensajeWipIndeterminado,
   personaDeTarea,
 } from '../core/wip.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
-import { isWorkspaceClean, currentBranch, isValidBranchName } from '../fs/git.js';
+import { isWorkspaceClean, currentBranch, isValidBranchName, gitUserEmail } from '../fs/git.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 
 export class StartCommandError extends Error {}
@@ -106,7 +107,11 @@ export async function runStartCommand(
   // esto, un start --asignado-a otra-persona comprobaria el limite
   // contra quien la tenia asignada antes y luego escribiria a otra: se
   // comprobaria a la persona equivocada.
-  const asignadoFinal = asignadoA !== undefined ? asignadoA : task.asignado_a;
+  // Precedencia (TASK-024): flag > asignado_a previo > identidad Git >
+  // null. Que el previo gane a la identidad es lo que evita que
+  // ejecutar start sobre la tarea de otra persona se la quede: el
+  // limite de WIP se sigue comprobando contra quien tiene la rama.
+  const asignadoFinal = resolverAsignado(asignadoA, task.asignado_a, gitUserEmail(deps.repoCwd));
 
   // Una tarea sin asignar no tiene a quien aplicarle un limite. Es el
   // caso de todo lo anterior a B6 (asignado_a nace a null), asi que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
index c533fd8..049e3d9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
@@ -58,6 +58,42 @@ export function personaDeTarea(asignado: string | null): string | null {
   return v === '' ? null : v;
 }
 
+/**
+ * Decide quien queda asignado a una tarea (TASK-024, item C7). Un
+ * unico sitio con la regla de precedencia, compartido por "plan" y
+ * "start" para que no puedan divergir:
+ *
+ * 1. `flag` — lo que se paso en --asignado-a. Manda siempre: es la via
+ *    para asignar a otra persona, y la salida que ofrece el error de
+ *    WIP de B7 ("reasigna con --asignado-a").
+ * 2. `previo` — el asignado_a que ya tuviera la tarea. Ejecutar un
+ *    comando sobre la tarea de otra persona NO se la queda.
+ * 3. `identidad` — git config user.email, la novedad de TASK-024.
+ * 4. null.
+ *
+ * Que el paso 2 vaya antes que el 3 es lo que evita el robo
+ * silencioso: si Ana planifico TASK-030 y Carlos ejecuta "start"
+ * sin flag, la tarea sigue siendo de Ana — y el limite de WIP se
+ * comprueba contra Ana, que es quien tiene la rama abierta. Para
+ * quedarsela, Carlos tiene que decirlo.
+ *
+ * Los tres valores pasan por personaDeTarea, asi que un "  " o un ""
+ * cuentan como ausentes en cualquiera de los escalones.
+ */
+export function resolverAsignado(
+  flag: string | undefined,
+  previo: string | null,
+  identidad: string | null
+): string | null {
+  if (flag !== undefined) {
+    const delFlag = personaDeTarea(flag);
+    if (delFlag !== null) return delFlag;
+  }
+  const delPrevio = personaDeTarea(previo);
+  if (delPrevio !== null) return delPrevio;
+  return personaDeTarea(identidad);
+}
+
 /**
  * Tareas de `persona` que ocupan el hueco, excluida la que se intenta
  * arrancar. Devuelve la lista ordenada por ID para que el mensaje de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index bed94e2..eee11fd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -97,6 +97,32 @@ export function isRemoteAvailable(cwd: string): boolean {
   return result.status === 0;
 }
 
+/**
+ * Identidad Git de quien ejecuta el comando: el valor de
+ * `git config user.email`, o null si no hay ninguno configurado
+ * (TASK-024, item C7). Es lo que "plan" y "start" usan como
+ * asignado_a por defecto.
+ *
+ * Unica funcion de este modulo que NO pasa por runGit, a proposito:
+ * runGit convierte cualquier exit != 0 en GitCommandError, y
+ * `git config <clave>` sale con codigo 1 exactamente cuando la clave
+ * no existe. "Esta maquina no tiene identidad configurada" es un
+ * estado legitimo — la tarea se queda sin asignar, como antes de
+ * TASK-024 — y no un error que deba abortar el comando.
+ *
+ * Un fallo real de lanzamiento (no hay binario de git) SI se propaga:
+ * eso no es "no hay identidad", es que no hay Git.
+ */
+export function gitUserEmail(cwd: string): string | null {
+  const result = spawnSync('git', ['config', 'user.email'], { cwd, encoding: 'utf8' });
+  if (result.error) {
+    throw new GitLaunchError(result.error);
+  }
+  if (result.status !== 0) return null;
+  const email = (result.stdout ?? '').trim();
+  return email === '' ? null : email;
+}
+
 /** SHA completo del commit en HEAD. */
 export function headCommit(cwd: string): string {
   return runGit(['rev-parse', 'HEAD'], cwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index 6062858..4cc7d0a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -135,12 +135,15 @@ test('main: taskctl plan --asignado-a confirma la asignacion y la deja en tarea.
   });
 });
 
-test('main: sin --asignado-a no se imprime ninguna linea de asignacion', async () => {
+test('main: sin --asignado-a y sin identidad Git no se imprime linea de asignacion', async () => {
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Sin asignar', '--tipo', 'feature']));
     assert.equal(creada.code, 0);
     git(['add', '-A'], repoRoot);
     git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);
+    // Se vacia la identidad DESPUES de commitear (TASK-024): sin
+    // ella, plan deja la tarea sin asignar, como antes.
+    git(['config', 'user.email', ''], repoRoot);
 
     const { code, stdout } = await captureOutput(() => main(['plan', 'TASK-001']));
 
@@ -149,6 +152,26 @@ test('main: sin --asignado-a no se imprime ninguna linea de asignacion', async (
   });
 });
 
+test('main: sin --asignado-a pero CON identidad Git, la tarea se autoasigna y se dice', async () => {
+  await withTempRepoCwd(async (repoRoot) => {
+    const creada = await captureOutput(() => main(['new', '--titulo', 'Con identidad', '--tipo', 'feature']));
+    assert.equal(creada.code, 0);
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);
+
+    const { code, stdout } = await captureOutput(() => main(['plan', 'TASK-001']));
+
+    assert.equal(code, 0);
+    assert.ok(stdout.includes('Asignada a "test@example.com".'), stdout);
+
+    const md = await readFile(
+      path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-001', 'tarea.md'),
+      'utf8'
+    );
+    assert.ok(md.includes('asignado_a: test@example.com'), md);
+  });
+});
+
 test('main: un --asignado-a sin valor sale con codigo 1 y mensaje util, no con un stack trace', async () => {
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Flag roto', '--tipo', 'feature']));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
index c50ab5a..cc03f39 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
@@ -477,10 +477,12 @@ test('taskctl start: la tarea en curso de OTRA persona no bloquea', async () =>
   });
 });
 
-test('taskctl start: una tarea sin asignar no comprueba limite y arranca', async () => {
+test('taskctl start: sin identidad Git configurada, la tarea sigue sin asignar y no comprueba limite', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Comportamiento de todo lo anterior a B6: asignado_a nace a
-    // null. Aunque haya otra tarea en curso, tambien sin asignar.
+    // Comportamiento anterior a TASK-024, que se conserva cuando no
+    // hay identidad. Se vacia user.email DESPUES de los commits (que
+    // la necesitan): asi el repo no hereda tampoco la identidad
+    // global de la maquina, que haria el test no determinista.
     await writeTareaFile(
       tareasRoot,
       sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: null, rama: 'feature/task-501-sin-duenno' }),
@@ -488,6 +490,7 @@ test('taskctl start: una tarea sin asignar no comprueba limite y arranca', async
     );
     await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
     commitAll(repoRoot, 'tareas sin asignar');
+    git(['config', 'user.email', ''], repoRoot);
 
     const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
       repoCwd: repoRoot,
@@ -642,3 +645,86 @@ test('taskctl start: el mensaje nombra la carpeta donde ESTA la bloqueante', asy
     );
   });
 });
+
+// --- TASK-024 (item C7): identidad Git como asignado_a por defecto ---
+
+test('taskctl start: una tarea sin asignar se autoasigna a la identidad Git', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    commitAll(repoRoot, 'tarea sin asignar');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // withTempRepo configura user.email como test@example.com.
+    assert.equal(result.asignadoA, 'test@example.com');
+    assert.equal(result.asignadoCambiado, true);
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.asignado_a, 'test@example.com');
+  });
+});
+
+test('taskctl start: la identidad Git NO roba la tarea de otra persona', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // El asignado previo gana a la identidad de quien ejecuta. Sin
+    // esto, arrancar la tarea de otra persona se la quedaria en
+    // silencio y el limite de WIP se comprobaria contra la persona
+    // equivocada.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
+    commitAll(repoRoot, 'tarea de ana');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'ana@example.com');
+    assert.equal(result.asignadoCambiado, false);
+  });
+});
+
+test('taskctl start --asignado-a: el flag gana a la identidad Git', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    commitAll(repoRoot, 'tarea sin asignar');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'otra@example.com'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'otra@example.com');
+  });
+});
+
+test('taskctl start: el limite de WIP ya NO es opt-in: dos tareas sin asignar chocan', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Antes de TASK-024 este caso pasaba limpio y dejaba dos ramas
+    // abiertas, porque ninguna tarea tenia asignado_a. Ahora la que
+    // arranca primero se queda con la identidad Git, y la segunda
+    // choca contra ella. Es el objetivo entero de la tarea.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-501', asignado_a: null, rama: 'feature/task-501-segunda' }), '');
+    commitAll(repoRoot, 'dos tareas sin asignar');
+
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'la primera en curso');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof StartCommandError &&
+        (err as Error).message.includes('TASK-500') &&
+        (err as Error).message.includes('test@example.com')
+    );
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
index 9aa87e4..652a843 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
@@ -11,6 +11,7 @@ import {
   mensajeWipExcedido,
   mensajeWipIndeterminado,
   personaDeTarea,
+  resolverAsignado,
 } from '../../src/core/wip.js';
 import type { Task, TareaUbicada, TaskState } from '../../src/core/task.js';
 
@@ -200,3 +201,36 @@ test('mensajeWipExcedido: no promete un taskctl finish que todavia fallaria', ()
   assert.ok(msg.includes('taskctl finish TASK-901'), msg);
   assert.ok(msg.includes('--asignado-a'), msg);
 });
+
+// --- TASK-024 (item C7): precedencia del asignado ---
+
+test('resolverAsignado: el flag manda sobre todo lo demas', () => {
+  assert.equal(resolverAsignado('flag@x.com', 'previo@x.com', 'git@x.com'), 'flag@x.com');
+  assert.equal(resolverAsignado('flag@x.com', null, null), 'flag@x.com');
+});
+
+test('resolverAsignado: sin flag gana el asignado previo, NO la identidad Git', () => {
+  // Esto es lo que evita el robo silencioso: ejecutar un comando
+  // sobre la tarea de otra persona no se la queda.
+  assert.equal(resolverAsignado(undefined, 'previo@x.com', 'git@x.com'), 'previo@x.com');
+});
+
+test('resolverAsignado: sin flag ni previo, entra la identidad Git', () => {
+  assert.equal(resolverAsignado(undefined, null, 'git@x.com'), 'git@x.com');
+});
+
+test('resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024)', () => {
+  assert.equal(resolverAsignado(undefined, null, null), null);
+});
+
+test('resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad', () => {
+  // Coherente con personaDeTarea: '' y '   ' son 'sin asignar'.
+  assert.equal(resolverAsignado(undefined, '', 'git@x.com'), 'git@x.com');
+  assert.equal(resolverAsignado(undefined, '   ', 'git@x.com'), 'git@x.com');
+});
+
+test('resolverAsignado: recorta los tres escalones', () => {
+  assert.equal(resolverAsignado('  flag@x.com  ', null, null), 'flag@x.com');
+  assert.equal(resolverAsignado(undefined, '  previo@x.com  ', null), 'previo@x.com');
+  assert.equal(resolverAsignado(undefined, null, '  git@x.com  '), 'git@x.com');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-identidad.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-identidad.test.ts
new file mode 100644
index 0000000..934a1d9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-identidad.test.ts
@@ -0,0 +1,54 @@
+/**
+ * Tests de gitUserEmail (TASK-024, item C7) contra repos Git reales.
+ * Es la unica funcion de la capa fs que trata un exit distinto de cero
+ * como un estado legitimo en vez de como un error, asi que merece
+ * cubrir los dos caminos de verdad.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { gitUserEmail } from '../../src/fs/git.js';
+
+function git(args: string[], cwd: string): void {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git fallo: ${result.stderr}`);
+}
+
+async function withRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-ident-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    await fn(repoRoot);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+test('gitUserEmail: devuelve el user.email configurado en el repo', async () => {
+  await withRepo(async (repoRoot) => {
+    git(['config', 'user.email', 'quien.ejecuta@example.com'], repoRoot);
+    assert.equal(gitUserEmail(repoRoot), 'quien.ejecuta@example.com');
+  });
+});
+
+test('gitUserEmail: un user.email vacio cuenta como sin identidad', async () => {
+  await withRepo(async (repoRoot) => {
+    // Un valor vacio sale con codigo 0 y stdout vacio: no es el mismo
+    // caso que la clave inexistente, pero significa lo mismo. Es
+    // ademas la unica forma determinista que tienen los tests de
+    // simular 'sin identidad' sin depender de la config global de la
+    // maquina donde corren.
+    git(['config', 'user.email', ''], repoRoot);
+    assert.equal(gitUserEmail(repoRoot), null);
+  });
+});
+
+test('gitUserEmail: recorta el valor', async () => {
+  await withRepo(async (repoRoot) => {
+    git(['config', 'user.email', '  espacios@example.com  '], repoRoot);
+    assert.equal(gitUserEmail(repoRoot), 'espacios@example.com');
+  });
+});
````
