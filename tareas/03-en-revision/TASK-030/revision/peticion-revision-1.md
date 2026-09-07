# Peticion de revision — TASK-030 (ronda 1)

- Tarea: TASK-030 — Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4)
- Rama revisada: feature/task-030-auto-commit-de-taskctl-y-taskcode-config
- Rama base: develop
- Commit revisado (HEAD): bc88c0470dbcbb7748a2b16372680e7e0ad0954a
- Fecha: 2026-09-07
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
bc88c04 feat(TASK-030): auto-commit de taskctl y .taskcode/config.yml (items C2 y C4)
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/contexto/HALLAZGOS.md b/docs/contexto/HALLAZGOS.md
index 9a5ccde..5bce774 100644
--- a/docs/contexto/HALLAZGOS.md
+++ b/docs/contexto/HALLAZGOS.md
@@ -5,6 +5,26 @@ por lo que más probablemente te muerda hoy.
 
 ## Patrones a reutilizar
 
+### El auto-commit solo toca lo que escribe (TASK-030)
+
+`taskctl` commitea **una a una** las rutas que acaba de escribir, y en
+ningún sitio hay un `git add -A` sin pathspec. La primera justificación que
+escribimos era medio falsa y conviene no repetirla: se dijo que `start`,
+`review` y `finish` no comprueban el workspace porque no aplican
+`ensureBaseBranchReady`. Sí lo comprueban — llaman a `isWorkspaceClean` por
+su cuenta y abortan con el árbol sucio.
+
+La razón verdadera es la **ventana entre esa comprobación y el commit**: ahí
+corren scripts de Git-Flow que pueden disparar hooks del repo, y sobre todo
+puede haber **otro proceso escribiendo**. En este proyecto eso no es un caso
+exótico sino el normal: varios agentes en paralelo sobre la misma copia de
+trabajo. Un `git add -A` dentro de esa ventana se lleva trabajo ajeno a un
+commit que la persona no ha escrito.
+
+La contraprueba que vale no es "los tests pasan": es sustituir el pathspec
+por un `add -A` global y comprobar que **caen exactamente los tests que
+aseveran la regla**. Eso prueba el diseño, no solo el cableado.
+
 ### Medir no basta si mides lo que no discrimina (TASK-029)
 
 Al corregir un hallazgo de la revisión —`abort-merge.sh` decía *"workspace
@@ -142,16 +162,20 @@ Descubiertas usándolo de verdad para crear TASK-013…TASK-023:
    tienen distinto sprint o complejidad, hacen falta varias pasadas.
 2. **No sabe expresar `dependencias` en absoluto.** Hay que editar el
    frontmatter a mano después.
-3. **No se puede ejecutar dos veces seguidas.** Las carpetas que crea dejan el
-   workspace sucio, y el guard de §8.3 aborta la siguiente invocación — la
-   herramienta genera justo la suciedad que bloquea su próximo uso. Hay que
-   commitear en medio.
+3. ~~**No se puede ejecutar dos veces seguidas.**~~ **Cerrado en TASK-030
+   (item C2, 2026-09-07.)** Las carpetas que creaba dejaban el workspace
+   sucio y el guard de §8.3 abortaba la siguiente invocación: la herramienta
+   generaba justo la suciedad que bloqueaba su próximo uso. Ahora `import`
+   commitea lo que crea, así que dos pasadas seguidas funcionan sin tocar
+   nada a mano. Fijado por test en `test/commands/auto-commit.test.ts`.
 
-La (3) es evidencia directa a favor de implementar el paso 5 de §8.3
-(auto-commit), que es el item **C2** del checklist.
+Las (1) y (2) siguen abiertas. La (3) fue la evidencia que empujó el paso 5
+de §8.3.
 
-Corolario operativo: **los ficheros que le pases a `import` van fuera del
-repo.** Dentro, ensucian el workspace y abortan el propio import.
+Corolario operativo que **sigue en pie**: los ficheros que le pases a
+`import` van fuera del repo. Dentro son un fichero sin trackear que el guard
+de §8.3 ve como workspace sucio, y eso el auto-commit no lo arregla — no es
+suciedad que genere `taskctl`, es un fichero tuyo.
 
 ## Git-Flow: deuda conocida
 
@@ -336,7 +360,8 @@ sigue valiendo, y porque dos de ellos cambiaron la solución al medirla.
   **Limitaciones que quedan, a propósito**: solo ve ramas **locales** (nada
   de `fetch`, para no meter la red en un comando que hoy funciona sin
   conexión), y una rama cuyo movimiento de tarea no esté commiteado no
-  cuenta — otra evidencia a favor del auto-commit del paso 5 (item C2). El
+  cuenta — cosa que **desde TASK-030 ya no pasa en el flujo normal**, porque
+  `start` commitea el movimiento antes de terminar (item C2). El
   coste crece con las ramas abiertas: 2 ramas dan un `start` de 1,6 s; 50
   abiertas con tarea en curso, 8 s. Las mergeadas se filtran antes de
   leerlas, así que la política de no borrar ramas no lo empeora.
diff --git a/tareas/01-en-diseno/TASK-030/tarea.md b/tareas/01-en-diseno/TASK-030/tarea.md
deleted file mode 100644
index a8ac35e..0000000
--- a/tareas/01-en-diseno/TASK-030/tarea.md
+++ /dev/null
@@ -1,25 +0,0 @@
----
-id: TASK-030
-titulo: "Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4)"
-tipo: feature
-sprint: 0
-etiquetas: []
-complejidad: media
-modelo_sugerido: sonnet
-estado: en-diseno
-plan_aprobado: true
-rama: feature/task-030-auto-commit-de-taskctl-y-taskcode-config
-asignado_a: charlie.bk@gmail.com
-agente_revisor: general-purpose
-skills_recomendados: []
-ultimo_commit_revisado: null
-revision_codex: false
-creado: 2026-09-07
-actualizado: 2026-09-07
-dependencias: []
----
-## Objetivo
-
-
-## Criterios de aceptacion
-- [ ] 
diff --git a/tareas/01-en-diseno/TASK-030/planificacion/plan-final.md b/tareas/02-en-curso/TASK-030/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-030/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-030/planificacion/plan-final.md
diff --git a/tareas/02-en-curso/TASK-030/tarea.md b/tareas/02-en-curso/TASK-030/tarea.md
new file mode 100644
index 0000000..1b081ec
--- /dev/null
+++ b/tareas/02-en-curso/TASK-030/tarea.md
@@ -0,0 +1,52 @@
+---
+id: TASK-030
+titulo: "Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4)"
+tipo: feature
+sprint: 0
+etiquetas: []
+complejidad: media
+modelo_sugerido: sonnet
+estado: en-curso
+plan_aprobado: true
+rama: feature/task-030-auto-commit-de-taskctl-y-taskcode-config
+asignado_a: charlie.bk@gmail.com
+agente_revisor: general-purpose
+skills_recomendados: []
+ultimo_commit_revisado: null
+revision_codex: false
+creado: 2026-09-07
+actualizado: 2026-09-07
+dependencias: []
+---
+## Objetivo
+
+
+## Criterios de aceptacion
+
+Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
+`taskctl new` deja esta seccion vacia — a diferencia de `import`, que los
+extrae del fichero de entrada.
+
+**C4 — `.taskcode/config.yml`**
+- [ ] Tres claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`. Ninguna otra se declara.
+- [ ] Sin fichero, el comportamiento es identico al de hoy y los 472 tests existentes pasan **sin tocar ninguno**.
+- [ ] Cada clave surte efecto de verdad (no solo se lee): `rama_base: integration` cambia la rama que devuelve `resolveBaseBranchForTipo`.
+- [ ] Valor invalido o clave desconocida **abortan** enumerando las claves validas. Nunca caida al default en silencio.
+- [ ] Un solo parser: el bucle `clave: valor` de `frontmatter.ts` se extrae y se comparte. No hay un segundo parser YAML.
+- [ ] Un solo punto de resolucion (`resolverConfig`); ningun comando lee el fichero por su cuenta.
+- [ ] Desaparece la duplicacion de `DEFAULT_AGENTE_REVISOR` entre `new.ts` e `import.ts`.
+
+**C2 — auto-commit**
+- [ ] `taskctl` commitea las rutas que escribe, **una a una**. En ningun sitio hay un `git add -A`.
+- [ ] Un fichero sucio de la persona **no** entra en el commit de `taskctl` y sigue sucio en el arbol despues.
+- [ ] Sin nada que commitear no se crea commit vacio.
+- [ ] Un commit que falla (hook, firma) se reporta; no se traga.
+- [ ] `--push` sube la rama actual; sin remoto avisa y sale 0.
+- [ ] `taskctl import` se puede ejecutar dos veces seguidas sin commitear en medio.
+- [ ] Mensajes deterministas, estilo del repo y **sin tildes**.
+
+**Transversal**
+- [ ] Divergencia con la §8.3 (que pide tambien subir) documentada, no callada.
+- [ ] Suite en verde: los 3 rojos conocidos de Windows y ninguno mas. Si al cablear el auto-commit **no se cae ningun test existente**, se investiga por que antes de darlo por bueno.
+- [ ] Revision por pares independiente, con hallazgos clasificados y documentados incluidos los no corregidos.
+- [ ] Checklist, contadores y estimaciones de C2 y C4 actualizados.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 2b2e131..78cedb6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -25,6 +25,13 @@ import {
   GitLaunchError,
   type BaseBranchGuardResult,
 } from './fs/git.js';
+import { AutoCommitError, type AutoCommitResult } from './fs/git-commit.js';
+// ConfigError se captura en los mismos catch que AutoCommitError
+// (integracion TASK-030): sin esto cae al catch-all de bin/taskctl y
+// sale como "[ERROR] taskctl no pudo arrancar: ...", que miente —
+// taskctl arranco bien, lo que esta mal es el .taskcode/config.yml
+// del repo.
+import { ConfigError } from './core/config.js';
 
 const VERSION = '0.1.0';
 
@@ -40,11 +47,11 @@ Uso:
                  [--sprint N] [--complejidad ...] [--modelo-sugerido ...] \\
                  [--agente-revisor ...]
   taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
-  taskctl start TASK-NNN [--asignado-a <persona>]
-  taskctl plan TASK-NNN [--asignado-a <persona>]
-  taskctl approve TASK-NNN
-  taskctl review TASK-NNN
-  taskctl finish TASK-NNN
+  taskctl start TASK-NNN [--asignado-a <persona>] [--push]
+  taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
+  taskctl approve TASK-NNN [--push]
+  taskctl review TASK-NNN [--push]
+  taskctl finish TASK-NNN [--push]
   taskctl diagnose
   taskctl pause [--push]
   taskctl resume [<rama>]
@@ -54,6 +61,9 @@ Uso:
 Comandos: new, import, board, start, plan, approve, review, finish.
 Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
 --asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
+taskctl commitea SOLO los ficheros que el mismo escribe (nunca "git add -A"):
+lo que tengas a medias en el arbol se queda como esta. --push sube ademas la
+rama actual a origin; sin origin alcanzable avisa y sigue.
 Los wrappers preguntan (guardar como commit o stash, confirmar un abort...):
 ejecutalos desde una terminal. Sin ella toman el valor por defecto de cada
 pregunta, avisando de cual; y cuando ese valor haria lo contrario de lo que
@@ -94,6 +104,29 @@ function printBaseBranchSwitchNotice(guard: BaseBranchGuardResult): void {
   );
 }
 
+/**
+ * Resultado del auto-commit (TASK-030, item C2). Se dice SIEMPRE, en
+ * los dos desenlaces: "no habia nada que commitear" no es silencio,
+ * porque la diferencia entre "taskctl lo registro" y "esto sigue sin
+ * registrar" es justo lo que la persona necesita saber para decidir si
+ * tiene que hacer algo. Los avisos (sin origin, HEAD desacoplado) van
+ * por stderr, como el resto de avisos del CLI.
+ */
+function printAutoCommit(r: AutoCommitResult): void {
+  printAvisos(...r.avisos);
+  if (r.commiteado) {
+    const n = r.ficheros.length;
+    process.stdout.write(
+      `Commiteado ${r.commit} en "${r.rama}" (${n} fichero${n === 1 ? '' : 's'}).\n`
+    );
+  } else {
+    process.stdout.write('Sin cambios que commitear (nada nuevo en disco).\n');
+  }
+  if (r.push === 'empujado') {
+    process.stdout.write(`Push completado: ${r.rama} -> origin/${r.rama}.\n`);
+  }
+}
+
 /**
  * Confirmacion de --asignado-a (item B6). Solo se imprime cuando el
  * flag CAMBIO algo: si la tarea ya venia asignada a esa misma persona,
@@ -138,9 +171,15 @@ export async function main(argv: readonly string[]): Promise<number> {
       const result = await runNewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
       printBaseBranchSwitchNotice(result.baseBranchGuard);
       process.stdout.write(`Tarea ${result.id} creada: ${result.filePath}\n`);
+      printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
-      if (e instanceof NewTaskArgError || e instanceof BaseBranchGuardError) {
+      if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof NewTaskArgError ||
+        e instanceof BaseBranchGuardError
+      ) {
         printCliError(e);
         return 1;
       }
@@ -176,9 +215,15 @@ export async function main(argv: readonly string[]): Promise<number> {
       // siempre devolvia 0, incluso si TODAS las entradas fallaban —
       // un "taskctl import x.md && siguiente_paso" en un script nunca
       // se enteraba de que el import no creo nada.
+      printAutoCommit(result.autoCommit);
       return result.errores.length > 0 ? 1 : 0;
     } catch (e) {
-      if (e instanceof ImportCommandError || e instanceof BaseBranchGuardError) {
+      if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof ImportCommandError ||
+        e instanceof BaseBranchGuardError
+      ) {
         printCliError(e);
         return 1;
       }
@@ -228,12 +273,15 @@ export async function main(argv: readonly string[]): Promise<number> {
         `Tarea ${result.id} en curso: rama ${result.rama} creada y confirmada, ` +
           `tarea movida a ${result.filePath}\n${asignacionNotice(result)}`
       );
+      printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
       // GitflowScriptLaunchError incluido (hallazgo menor de revision
       // por pares, TASK-014, preexistente desde TASK-009): sin esto un
       // bash ilanzable caia al catch-all con "taskctl no pudo arrancar".
       if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
         e instanceof StartCommandError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
@@ -270,9 +318,12 @@ export async function main(argv: readonly string[]): Promise<number> {
         `Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
           asignacionNotice(result)
       );
+      printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
       if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
         e instanceof PlanCommandError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
@@ -299,9 +350,12 @@ export async function main(argv: readonly string[]): Promise<number> {
       process.stdout.write(
         `Tarea ${result.id} aprobada (plan_aprobado: true): ${result.filePath}.\n`
       );
+      printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
       if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
         e instanceof ApproveCommandError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
@@ -329,6 +383,7 @@ export async function main(argv: readonly string[]): Promise<number> {
           `Lanza el agente revisor con esa peticion y vuelca su salida en ` +
           `${result.informePath}.\n`
       );
+      printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
       // GitLaunchError/GitCommandError tambien se capturan aqui
@@ -336,6 +391,8 @@ export async function main(argv: readonly string[]): Promise<number> {
       // caian al catch-all de bin/taskctl con el prefijo enganoso
       // "taskctl no pudo arrancar".
       if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
         e instanceof ReviewCommandError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
@@ -362,13 +419,25 @@ export async function main(argv: readonly string[]): Promise<number> {
       process.stdout.write(
         `Tarea ${result.id} terminada: "${result.rama}" integrada en ` +
           `"${result.baseBranch}"${mainInfo}, tarea movida a ${result.filePath}.\n` +
-          `Actualizados: ${result.changelogPath}, ${result.indexPath} y ${result.boardPath}.\n` +
-          'Recuerda commitear y subir el resultado (el auto-commit es la decision #14, aun ' +
-          'abierta).\n'
+          `Actualizados: ${result.changelogPath}, ${result.indexPath} y ${result.boardPath}.\n`
       );
+      printAutoCommit(result.autoCommit);
+      // --push empuja LA RAMA ACTUAL, que tras "finish" es develop
+      // (misma doctrina que "taskctl pause --push"). En hotfix/release
+      // hay ademas un merge a main y un tag que NO se suben: callarlo
+      // dejaria creer que la publicacion esta completa.
+      if (result.mainBranch !== null && result.autoCommit.push === 'empujado') {
+        printAvisos(
+          `--push ha subido "${result.autoCommit.rama}", pero NO "${result.mainBranch}" ni el ` +
+            `tag de esta ${result.rama.split('/')[0]}: subelos tu ` +
+            `("git push origin ${result.mainBranch} --follow-tags").`
+        );
+      }
       return 0;
     } catch (e) {
       if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
         e instanceof FinishCommandError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 5a62fe2..636dbae 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -23,6 +23,12 @@ import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { resolverPlanFinal, type PlanFinalUbicacion } from './plan.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
 
 export class ApproveCommandError extends Error {}
 
@@ -68,6 +74,8 @@ export interface ApproveCommandResult {
   id: string;
   filePath: string;
   baseBranchGuard: BaseBranchGuardResult;
+  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
+  autoCommit: AutoCommitResult;
 }
 
 export interface ApproveCommandDeps {
@@ -81,7 +89,10 @@ export async function runApproveCommand(
   today: string,
   deps: ApproveCommandDeps
 ): Promise<ApproveCommandResult> {
-  const id = argv[0];
+  // --push se saca ANTES de leer el ID: es booleano puro y va delante
+  // o detras indistintamente ("taskctl approve --push TASK-030").
+  const { push, resto } = extraerPushFlag(argv);
+  const id = resto[0];
   if (id === undefined || id.trim() === '') {
     throw new ApproveCommandError('[ERROR] Falta el ID de la tarea: taskctl approve TASK-NNN.');
   }
@@ -122,5 +133,16 @@ export async function runApproveCommand(
   const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
 
-  return { id: task.id, filePath: newFilePath, baseBranchGuard };
+  // Paso 5 de la 8.3 (TASK-030, item C2). "approve" no cambia el
+  // estado de la tarea, asi que origen y destino son la MISMA carpeta;
+  // se pasan las dos igualmente porque autoCommit deduplica y asi el
+  // dia que approve mueva algo esto no se queda corto en silencio.
+  const commitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [path.dirname(filePath), path.dirname(newFilePath)],
+    mensaje: mensajeChore(task.id, 'plan aprobado'),
+    push,
+  });
+
+  return { id: task.id, filePath: newFilePath, baseBranchGuard, autoCommit: commitResult };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 823e6b7..618f7c9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -10,9 +10,11 @@
  * docs/BOARD.md desde el frontmatter — plantillas deterministas, cero
  * LLM (correccion de la seccion 16 de la metodologia).
  *
- * El commit del resultado queda en manos de la persona: el paso 5 de
- * la seccion 8.3 (que taskctl comitee y suba lo que genera) es la
- * decision #14, todavia abierta (item C2 del checklist).
+ * Desde TASK-030 (item C2) tambien cumple el paso 5 de la seccion 8.3:
+ * commitea lo que acaba de escribir — la carpeta de la tarea y los tres
+ * artefactos de cierre, y nada mas — sobre develop, que es donde
+ * termina el comando. Con --push sube ademas la rama.
+ *
  */
 import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
@@ -32,6 +34,12 @@ import {
   mergeBase,
   checkoutBranch,
 } from '../fs/git.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { runBoardCommand, boardFilePath } from './board.js';
 import { renderBoardMarkdown } from '../core/board-format.js';
@@ -256,6 +264,8 @@ export interface FinishCommandResult {
   changelogPath: string;
   indexPath: string;
   boardPath: string;
+  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
+  autoCommit: AutoCommitResult;
 }
 
 export async function runFinishCommand(
@@ -264,7 +274,8 @@ export async function runFinishCommand(
   today: string,
   deps: FinishCommandDeps
 ): Promise<FinishCommandResult> {
-  const id = argv[0];
+  const { push, resto } = extraerPushFlag(argv);
+  const id = resto[0];
   if (id === undefined || id.trim() === '') {
     throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
   }
@@ -421,6 +432,28 @@ export async function runFinishCommand(
     'utf8'
   );
 
+  // Paso 5 de la 8.3 (TASK-030, item C2). "finish" commitea sobre
+  // DEVELOP, no sobre la rama de la tarea: cuando llega aqui el merge
+  // ya esta consumado y el comando termina siempre en develop (se
+  // comprueba mas arriba). Es lo que se venia haciendo a mano; queda
+  // fijado con un test para que nadie lo "arregle" mas adelante.
+  // Ademas de las dos carpetas de la tarea entran los tres artefactos
+  // de cierre — y NADA mas: "finish" tampoco aplica
+  // ensureBaseBranchReady, asi que el resto del arbol puede tener
+  // trabajo de la persona.
+  const commitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [
+      path.dirname(filePath),
+      path.dirname(newFilePath),
+      changelogPath,
+      indexPath,
+      boardPath,
+    ],
+    mensaje: mensajeChore(task.id, 'tarea terminada y artefactos de cierre'),
+    push,
+  });
+
   return {
     id: task.id,
     rama,
@@ -430,5 +463,6 @@ export async function runFinishCommand(
     changelogPath,
     indexPath,
     boardPath,
+    autoCommit: commitResult,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
index b6e8710..3300d4d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
@@ -25,7 +25,14 @@
  * validar los argumentos de entrada.
  */
 import { readFile } from 'node:fs/promises';
+import path from 'node:path';
 import { parseArgs } from '../cli/args.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
 import { TASK_TYPES, TASK_COMPLEXITIES, TaskValidationError, type TaskType, type TaskComplexity } from '../core/task.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
@@ -38,6 +45,7 @@ import {
 } from '../fs/task-store.js';
 import { parseImportMarkdown } from '../core/import-parser.js';
 import { slugify, buildNewTask, SLUG_FALLBACK } from './new.js';
+import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
 
 export class ImportCommandError extends Error {}
 
@@ -53,15 +61,25 @@ export interface ImportOptions {
 const DEFAULT_SPRINT = 0;
 const DEFAULT_COMPLEJIDAD: TaskComplexity = 'media';
 const DEFAULT_MODELO = 'sonnet';
-const DEFAULT_AGENTE_REVISOR = 'general-purpose';
 
 /**
  * Un unico --tipo/--sprint/--complejidad para todo el fichero (no hay
  * sintaxis por entrada): mismo enfoque deliberadamente simple que el
  * resto de Sprint 0 — "taskctl import docs/sprint-N-propuesta.md"
  * importa un lote homogeneo (un sprint, un tipo de trabajo).
+ *
+ * `agenteRevisorPorDefecto` (TASK-030, item C4): hasta C4 este fichero
+ * tenia su propia constante DEFAULT_AGENTE_REVISOR = 'general-purpose',
+ * copia literal de la de new.ts. Dos copias del mismo default en dos
+ * comandos que crean la misma clase de tarea es precisamente lo que la
+ * decision #9 mandaba eliminar. La unica fuente es ahora
+ * CONFIG_DEFAULTS, y el valor efectivo lo decide
+ * `.taskcode/config.yml`.
  */
-export function parseImportArgs(argv: readonly string[]): ImportOptions {
+export function parseImportArgs(
+  argv: readonly string[],
+  agenteRevisorPorDefecto: string = CONFIG_DEFAULTS.agente_revisor_por_defecto
+): ImportOptions {
   const { positional, flags } = parseArgs(argv);
 
   const filePath = positional[0];
@@ -110,7 +128,7 @@ export function parseImportArgs(argv: readonly string[]): ImportOptions {
   const agenteRevisor =
     typeof flags['agente-revisor'] === 'string'
       ? (flags['agente-revisor'] as string)
-      : DEFAULT_AGENTE_REVISOR;
+      : agenteRevisorPorDefecto;
 
   return { filePath, tipo, sprint, complejidad, modeloSugerido, agenteRevisor };
 }
@@ -155,6 +173,7 @@ export interface ImportErrorEntry {
 
 export interface ImportCommandResult {
   baseBranchGuard: BaseBranchGuardResult;
+  autoCommit: AutoCommitResult;
   creadas: ImportCreatedEntry[];
   omitidas: ImportSkippedEntry[];
   errores: ImportErrorEntry[];
@@ -178,7 +197,14 @@ export async function runImportCommand(
   today: string,
   deps: ImportCommandDeps
 ): Promise<ImportCommandResult> {
-  const opts = parseImportArgs(argv);
+  // Igual que en new.ts (TASK-030, item C4): el config se resuelve lo
+  // primero, para que un `.taskcode/config.yml` roto aborte antes de
+  // leer el fichero a importar y antes de cualquier cambio de rama.
+  const config = resolverConfig(deps.repoCwd);
+  // --push fuera de parseArgs, mismo motivo que en new.ts: ese parser
+  // trata "--flag valor" como par y se comeria la ruta del fichero.
+  const { push, resto } = extraerPushFlag(argv);
+  const opts = parseImportArgs(resto, config.agente_revisor_por_defecto);
 
   let content: string;
   try {
@@ -292,5 +318,29 @@ export async function runImportCommand(
     usedSlugs.add(key);
   }
 
-  return { baseBranchGuard, creadas, omitidas, errores, advertencias };
+  // Auto-commit (TASK-030, item C2). Aqui esta la razon original del
+  // item: sin commitear, "import" no se podia ejecutar dos veces
+  // seguidas — las carpetas que creaba la primera vez dejaban el
+  // workspace sucio y el guard de la §8.3 abortaba la segunda
+  // (HALLAZGOS.md). Se commitean solo las carpetas creadas en ESTA
+  // pasada; si no se creo ninguna (todo omitido o con error), no hay
+  // nada que commitear y no se crea un commit vacio.
+  const autoCommitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: creadas.map((c) => path.dirname(c.filePath)),
+    mensaje: mensajeChore(
+      'taskctl',
+      `import de ${creadas.length} tarea(s): ${creadas.map((c) => c.id).join(', ')}`
+    ),
+    push,
+  });
+
+  return {
+    baseBranchGuard,
+    autoCommit: autoCommitResult,
+    creadas,
+    omitidas,
+    errores,
+    advertencias,
+  };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index 485d2ad..27e1f02 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -10,7 +10,14 @@
  * commitear, o cambia automaticamente a la rama base esperada segun
  * --tipo si el workspace esta limpio pero no esta ya ahi.
  */
+import path from 'node:path';
 import { parseArgs } from '../cli/args.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
 import {
   TASK_TYPES,
@@ -21,6 +28,7 @@ import {
 } from '../core/task.js';
 import { nextTaskId } from '../core/task-id.js';
 import { listExistingTaskIds, writeTareaFile } from '../fs/task-store.js';
+import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
 
 export class NewTaskArgError extends Error {}
 
@@ -37,10 +45,25 @@ export interface NewTaskOptions {
 const DEFAULT_SPRINT = 0;
 const DEFAULT_COMPLEJIDAD: TaskComplexity = 'media';
 const DEFAULT_MODELO = 'sonnet';
-const DEFAULT_AGENTE_REVISOR = 'general-purpose';
 export const DEFAULT_BODY = '## Objetivo\n\n\n## Criterios de aceptacion\n- [ ] \n';
 
-export function parseNewTaskArgs(argv: readonly string[]): NewTaskOptions {
+/**
+ * `agenteRevisorPorDefecto` (TASK-030, item C4) es lo que se usa
+ * cuando no se pasa --agente-revisor. Antes de C4 era una constante
+ * DUPLICADA aqui y en import.ts; ahora la unica fuente es
+ * CONFIG_DEFAULTS y el valor efectivo lo decide
+ * `.taskcode/config.yml` (clave `agente_revisor_por_defecto`).
+ *
+ * Es un parametro y no una lectura del fichero aqui dentro porque esta
+ * funcion es pura y testeable sin disco (esa separacion es el motivo
+ * de que exista). Quien resuelve el config es runNewCommand, que ya
+ * tiene el cwd del repo. El default del parametro conserva el
+ * comportamiento de las llamadas de un solo argumento.
+ */
+export function parseNewTaskArgs(
+  argv: readonly string[],
+  agenteRevisorPorDefecto: string = CONFIG_DEFAULTS.agente_revisor_por_defecto
+): NewTaskOptions {
   const { positional, flags } = parseArgs(argv);
 
   const tituloFlag = flags['titulo'];
@@ -100,7 +123,7 @@ export function parseNewTaskArgs(argv: readonly string[]): NewTaskOptions {
   const agenteRevisor =
     typeof flags['agente-revisor'] === 'string'
       ? (flags['agente-revisor'] as string)
-      : DEFAULT_AGENTE_REVISOR;
+      : agenteRevisorPorDefecto;
 
   return { titulo, tipo: tipoRaw as TaskType, sprint, etiquetas, complejidad, modeloSugerido, agenteRevisor };
 }
@@ -154,6 +177,7 @@ export interface NewCommandResult {
   id: string;
   filePath: string;
   baseBranchGuard: BaseBranchGuardResult;
+  autoCommit: AutoCommitResult;
 }
 
 export interface NewCommandDeps {
@@ -167,7 +191,18 @@ export async function runNewCommand(
   today: string,
   deps: NewCommandDeps
 ): Promise<NewCommandResult> {
-  const opts = parseNewTaskArgs(argv);
+  // El config se resuelve ANTES de parsear los argumentos (TASK-030,
+  // item C4): si esta roto, se aborta sin haber tocado nada y sin
+  // haber cambiado de rama. Un `.taskcode/config.yml` invalido es un
+  // fallo del repo, no del comando, y enterarse de el despues de que
+  // ensureBaseBranchReady te haya movido de rama seria peor.
+  const config = resolverConfig(deps.repoCwd);
+  // --push se saca ANTES de parseArgs a proposito (hallazgo del frente
+  // C2): ese parser trata "--flag valor" como par, asi que
+  // "taskctl new --push \"Titulo\"" habria leido push="Titulo" y el
+  // titulo habria desaparecido.
+  const { push, resto } = extraerPushFlag(argv);
+  const opts = parseNewTaskArgs(resto, config.agente_revisor_por_defecto);
   // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
   // tiene cambios sin commitear, o si no puede cambiar de forma
   // automatica a la rama base esperada segun opts.tipo — en ambos
@@ -177,5 +212,14 @@ export async function runNewCommand(
   const id = nextTaskId(existingIds);
   const task = buildNewTask(id, opts, today);
   const filePath = await writeTareaFile(tareasRoot, task, DEFAULT_BODY, { failIfExists: true });
-  return { id, filePath, baseBranchGuard };
+  // Auto-commit (TASK-030, item C2): se commitea la CARPETA de la tarea
+  // recien creada, no el arbol. La decision #14 fijo commitear si y
+  // subir solo con --push.
+  const autoCommitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [path.dirname(filePath)],
+    mensaje: mensajeChore(id, 'tarea creada'),
+    push,
+  });
+  return { id, filePath, baseBranchGuard, autoCommit: autoCommitResult };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 07dc734..f8ae107 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -31,6 +31,12 @@ import type { Task } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
 import { resolverAsignado } from '../core/wip.js';
 
 export class PlanCommandError extends Error {}
@@ -140,6 +146,8 @@ export interface PlanCommandResult {
   /** Aviso si la identidad Git existe pero no sirve como asignado_a; null si no aplica. */
   avisoIdentidad: string | null;
   baseBranchGuard: BaseBranchGuardResult;
+  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
+  autoCommit: AutoCommitResult;
 }
 
 export interface PlanCommandDeps {
@@ -158,7 +166,11 @@ export async function runPlanCommand(
   // TASK-001" tiene que funcionar igual que con el flag detras. De
   // paso, un "taskctl plan --loquesea" ya no se cuela como ID para
   // morir mas abajo con un InvalidTaskIdError que cli.ts no captura.
-  const { positional } = parseArgs(argv);
+  // --push se saca del argv ANTES de parsear nada mas: es booleano
+  // puro y parseArgs, que trata "--flag valor" como par, se habria
+  // comido el ID en "taskctl plan --push TASK-030".
+  const { push, resto } = extraerPushFlag(argv);
+  const { positional } = parseArgs(resto);
   const id = positional[0];
   if (id === undefined || id.trim() === '') {
     throw new PlanCommandError('[ERROR] Falta el ID de la tarea: taskctl plan TASK-NNN.');
@@ -167,7 +179,7 @@ export async function runPlanCommand(
   // Se parsea ANTES de tocar Git: un flag mal escrito no debe llegar a
   // cambiar de rama ni a mover carpetas antes de fallar.
   const asignadoA = parseAsignadoAFlag(
-    argv,
+    resto,
     (m) => new PlanCommandError(m),
     PISTA_VACIO_ESCRITURA
   );
@@ -323,7 +335,20 @@ export async function runPlanCommand(
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
   const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
 
+  // Paso 5 de la 8.3 (TASK-030, item C2): la carpeta de ORIGEN entra
+  // tambien, para que el commit registre el movimiento (y el borrado
+  // de 00-planificadas/) en vez de una copia con la carpeta vieja
+  // huerfana. planificacion/plan-final.md ya cae dentro de la carpeta
+  // de destino, no hace falta nombrarlo aparte.
+  const commitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [path.dirname(filePath), path.dirname(newFilePath)],
+    mensaje: mensajeChore(task.id, 'tarea en diseno'),
+    push,
+  });
+
   return {
+    autoCommit: commitResult,
     id: task.id,
     filePath: newFilePath,
     planPath,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index b9fc559..972e790 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -31,6 +31,12 @@ import {
   logOneline,
   diffRange,
 } from '../fs/git.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 
 export class ReviewCommandError extends Error {}
@@ -63,6 +69,8 @@ export interface ReviewCommandResult {
   filePath: string;
   peticionPath: string;
   informePath: string;
+  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
+  autoCommit: AutoCommitResult;
 }
 
 /**
@@ -164,7 +172,8 @@ export async function runReviewCommand(
   today: string,
   deps: ReviewCommandDeps
 ): Promise<ReviewCommandResult> {
-  const id = argv[0];
+  const { push, resto } = extraerPushFlag(argv);
+  const id = resto[0];
   if (id === undefined || id.trim() === '') {
     throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
   }
@@ -272,7 +281,21 @@ export async function runReviewCommand(
   const peticionPath = path.join(newRevisionDir, `peticion-revision-${ronda}.md`);
   const informePath = path.join(newRevisionDir, `informe-revision-${ronda}.md`);
 
+  // Paso 5 de la 8.3 (TASK-030, item C2). "review" NO aplica
+  // ensureBaseBranchReady, asi que en el arbol puede haber trabajo de
+  // la persona junto al de taskctl: solo entran las dos carpetas de la
+  // tarea (la de origen para que el movimiento se registre como tal, y
+  // la de destino, que ya contiene revision/ con la peticion y el
+  // scaffold del informe).
+  const commitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [path.dirname(filePath), path.dirname(newFilePath)],
+    mensaje: mensajeChore(task.id, `peticion de revision ronda ${ronda}`),
+    push,
+  });
+
   return {
+    autoCommit: commitResult,
     id: task.id,
     rama,
     baseBranch,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index cd4161a..dd3e4eb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -11,6 +11,7 @@
  * deterministica: comprobar que el workspace esta limpio ANTES de
  * llamar al script, en vez de delegar en su prompt interactivo.
  */
+import path from 'node:path';
 import { parseArgs } from '../cli/args.js';
 import {
   parseAsignadoAFlag,
@@ -28,6 +29,7 @@ import {
   mensajeWipIndeterminado,
   personaDeTarea,
 } from '../core/wip.js';
+import { resolverConfig } from '../core/config.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import {
   isWorkspaceClean,
@@ -36,6 +38,12 @@ import {
   gitUserEmail,
   resolveBaseBranchForTipo,
 } from '../fs/git.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 
 export class StartCommandError extends Error {}
@@ -68,6 +76,8 @@ export interface StartCommandResult {
   avisoAtribucion: string | null;
   /** tarea.md ilegibles hallados DENTRO de otras ramas: avisan, no bloquean. */
   avisosWip: string[];
+  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
+  autoCommit: AutoCommitResult;
 }
 
 export async function runStartCommand(
@@ -76,9 +86,12 @@ export async function runStartCommand(
   today: string,
   deps: StartCommandDeps
 ): Promise<StartCommandResult> {
+  // --push fuera antes de nada (TASK-030): parseArgs trata
+  // "--flag valor" como par y se habria comido el ID.
+  const { push, resto } = extraerPushFlag(argv);
   // El ID sale de los POSICIONALES, no de argv[0] a secas (item B6):
   // ver el comentario equivalente en plan.ts.
-  const { positional } = parseArgs(argv);
+  const { positional } = parseArgs(resto);
   const id = positional[0];
   if (id === undefined || id.trim() === '') {
     throw new StartCommandError('[ERROR] Falta el ID de la tarea: taskctl start TASK-NNN.');
@@ -88,7 +101,7 @@ export async function runStartCommand(
   // script de Git-Flow: un --asignado-a mal escrito no debe dejar una
   // rama creada a medias.
   const asignadoA = parseAsignadoAFlag(
-    argv,
+    resto,
     (m) => new StartCommandError(m),
     PISTA_VACIO_ESCRITURA
   );
@@ -203,9 +216,18 @@ export async function runStartCommand(
     if (ilegibles.length > 0) {
       throw new StartCommandError(mensajeWipIndeterminado(task.id, ilegibles));
     }
-    const bloqueantes = tareasQueBloquean(tareas, personaParaWip, task.id);
+    // El limite sale de .taskcode/config.yml (item C4). Se resuelve aqui
+    // y no dentro de wip.ts a proposito: ese modulo es puro — recibe el
+    // limite, no lee disco — y esa pureza es lo que deja probarlo sin
+    // montar un repo. Este es el UNICO punto donde el limite se aplica
+    // de verdad; sin esta linea el mecanismo funciona en sus tests y no
+    // hace nada en el CLI, que es justo como llego de los dos frentes.
+    const limiteWip = resolverConfig(deps.repoCwd).limite_wip;
+    const bloqueantes = tareasQueBloquean(tareas, personaParaWip, task.id, limiteWip);
     if (bloqueantes.length > 0) {
-      throw new StartCommandError(mensajeWipExcedido(task.id, personaParaWip, bloqueantes));
+      throw new StartCommandError(
+        mensajeWipExcedido(task.id, personaParaWip, bloqueantes, limiteWip)
+      );
     }
   }
 
@@ -264,6 +286,18 @@ export async function runStartCommand(
     tolerateMissingSource: true,
   });
 
+  // Paso 5 de la 8.3 (TASK-030, item C2). Se commitea sobre la rama de
+  // la tarea, que el script de Git-Flow acaba de crear y ya esta
+  // confirmada arriba. "start" NO aplica ensureBaseBranchReady: aqui
+  // puede haber trabajo de la persona en el arbol, y por eso el commit
+  // se limita a las dos carpetas de la tarea y a nada mas.
+  const commitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [path.dirname(filePath), path.dirname(newFilePath)],
+    mensaje: mensajeChore(task.id, 'tarea en curso'),
+    push,
+  });
+
   return {
     id: task.id,
     rama: task.rama,
@@ -273,5 +307,6 @@ export async function runStartCommand(
     avisoIdentidad,
     avisoAtribucion,
     avisosWip,
+    autoCommit: commitResult,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
new file mode 100644
index 0000000..b72d5e3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -0,0 +1,314 @@
+/**
+ * `.taskcode/config.yml` — TASK-030, item C4 del checklist de
+ * terminacion. Decision #9, resuelta el 2026-09-07: TRES claves, todas
+ * opcionales, y ninguna mas.
+ *
+ * | clave                        | defecto           | quien la lee            |
+ * |------------------------------|-------------------|-------------------------|
+ * | rama_base                    | develop           | git.ts (feature/fix/release) |
+ * | agente_revisor_por_defecto   | general-purpose   | new.ts, import.ts       |
+ * | limite_wip                   | 1                 | wip.ts                  |
+ *
+ * Lo que importa aqui no es el fichero, es la forma del mecanismo —
+ * es lo que decide si anadir la cuarta clave cuesta una linea o una
+ * arqueologia:
+ *
+ * 1. SIN FICHERO, COMPORTAMIENTO IDENTICO AL DE HOY. CONFIG_DEFAULTS
+ *    es literalmente lo que el codigo hacia antes de C4, asi que el
+ *    cambio es no-breaking y los tests que ya existian siguen valiendo
+ *    de red de regresion sin tocar ninguno.
+ * 2. FALLO CERRADO. Un valor invalido o una clave desconocida ABORTAN.
+ *    Nunca caida al default en silencio: con default silencioso el
+ *    repo dice 2, el plugin usa 1 y no se entera nadie. Misma doctrina
+ *    que el flag 'wx' de plan.ts y que el parser de veredictos de
+ *    finish.ts.
+ * 3. UN SOLO PARSER. El bucle `clave: valor` es el de frontmatter.ts,
+ *    extraido a parseBloqueClaveValor(). Aqui no hay ni una linea de
+ *    parseo de YAML.
+ * 4. UN SOLO PUNTO DE RESOLUCION. resolverConfig(cwd) devuelve el
+ *    objeto con los defaults ya aplicados. Ningun comando lee el
+ *    fichero por su cuenta.
+ * 5. NINGUNA CLAVE QUE NADIE LEA. `remoto`, `rama_principal`,
+ *    `politica_no_borrar_ramas` y las palabras clave de la heuristica
+ *    de complejidad estan DESCARTADAS en la decision #9 y no se
+ *    declaran. Una clave escribible que no hace nada es peor que no
+ *    tenerla: este proyecto ya se quemo con `codex-review`,
+ *    documentado en la maquina de estados e inexistente.
+ *
+ * La estrictez con las claves desconocidas es segura porque la §7.3 de
+ * la metodologia garantiza que todo el equipo corre la misma version
+ * del plugin: no hay un escenario de "clave nueva leida por un plugin
+ * viejo" que justifique tragarsela.
+ */
+import { existsSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+import { parseBloqueClaveValor } from './frontmatter.js';
+
+export class ConfigError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'ConfigError';
+  }
+}
+
+export interface TaskcodeConfig {
+  /**
+   * Rama base de las tareas feature/fix/release. NO afecta a hotfix:
+   * esas siguen colgando de la rama principal, que resolveMainBranch
+   * detecta sola (main/master) — la decision #9 descarta
+   * `rama_principal` justamente porque esa deteccion ya funciona y
+   * ponerla en config la duplicaria.
+   */
+  rama_base: string;
+  /** Valor por defecto de `agente_revisor` al crear tareas (new / import). */
+  agente_revisor_por_defecto: string;
+  /** Cuantas tareas puede tener una persona a la vez en 02-en-curso + 03-en-revision. */
+  limite_wip: number;
+}
+
+/**
+ * El comportamiento de hoy, escrito una sola vez. Antes de C4 estos
+ * tres valores vivian: 'develop' literal en git.ts, 'general-purpose'
+ * DUPLICADO en new.ts e import.ts, y el 1 implicito en el
+ * `bloqueantes.length > 0` de start.ts. Ahora esta es su unica fuente.
+ */
+export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
+  rama_base: 'develop',
+  agente_revisor_por_defecto: 'general-purpose',
+  limite_wip: 1,
+});
+
+/** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
+export const CLAVES_CONFIG = [
+  'rama_base',
+  'agente_revisor_por_defecto',
+  'limite_wip',
+] as const;
+
+export const CONFIG_DIR = '.taskcode';
+export const CONFIG_FILE = 'config.yml';
+
+/**
+ * Raiz del repo: se sube desde `cwd` hasta encontrar un `.git`
+ * (directorio en un clon normal, fichero en un worktree o submodulo).
+ * Si no hay ninguno, se usa `cwd` tal cual.
+ *
+ * Por que la raiz y no el cwd a secas: la configuracion es DEL REPO, y
+ * "taskctl board" ejecutado desde `docs/` tiene que ver la misma que
+ * ejecutado desde la raiz. Lo contrario haria que el limite de WIP o
+ * la rama base cambiaran segun desde donde escribes, que es justo la
+ * clase de comportamiento que nadie diagnostica.
+ *
+ * Por que se PARA en el `.git` y no se sigue subiendo: si se siguiera,
+ * un `.taskcode/config.yml` olvidado en el home configuraria en
+ * silencio todos los repos de la maquina. Una sola ubicacion canonica
+ * por repo, o ninguna.
+ *
+ * No se usa `git rev-parse --show-toplevel` a proposito: obligaria a
+ * config.ts a importar fs/git.ts, que a su vez importa este modulo
+ * (ciclo), y a pagar un spawn de git por resolucion.
+ */
+export function raizDelRepo(cwd: string): string {
+  let dir = path.resolve(cwd);
+  for (;;) {
+    if (existsSync(path.join(dir, '.git'))) return dir;
+    const padre = path.dirname(dir);
+    if (padre === dir) return path.resolve(cwd);
+    dir = padre;
+  }
+}
+
+/** Ruta canonica del fichero de configuracion para ese cwd. */
+export function rutaConfig(cwd: string): string {
+  return path.join(raizDelRepo(cwd), CONFIG_DIR, CONFIG_FILE);
+}
+
+/**
+ * EL punto de resolucion (regla 4). Devuelve la configuracion con los
+ * defaults ya aplicados, o lanza ConfigError.
+ *
+ * Casos de "no hay configuracion", que devuelven los defaults sin
+ * quejarse: no existe `.taskcode/`, existe `.taskcode/` pero sin
+ * `config.yml` (ENOENT en ambos), y `config.yml` vacio o con solo
+ * comentarios (ninguna clave = todas por defecto). Un fichero vacio es
+ * una forma legitima de decir "todo por defecto"; tratarlo como error
+ * castigaria a quien deja el fichero preparado para llenarlo luego.
+ *
+ * CUALQUIER otro fallo de lectura (permisos, `.taskcode` que resulta
+ * ser un fichero, `config.yml` que resulta ser un directorio) SI
+ * aborta: son configuraciones rotas, no configuraciones ausentes, y
+ * tragarselas seria exactamente la caida al default en silencio que la
+ * regla 2 prohibe.
+ *
+ * Es sincrona porque resolveBaseBranchForTipo lo es, y ese es su
+ * consumidor principal. No cachea: el coste es un readFileSync por
+ * comando y una cache introduciria estado global compartido entre
+ * tests.
+ */
+export function resolverConfig(cwd: string): TaskcodeConfig {
+  const ruta = rutaConfig(cwd);
+  let contenido: string;
+  try {
+    contenido = readFileSync(ruta, 'utf8');
+  } catch (e: unknown) {
+    if ((e as { code?: string }).code === 'ENOENT') return { ...CONFIG_DEFAULTS };
+    const msg = e instanceof Error ? e.message : String(e);
+    throw new ConfigError(
+      `[ERROR] No se pudo leer la configuracion "${ruta}": ${msg}\n` +
+        '        Borrala o arregla sus permisos: taskctl no sigue sin saber que dice.'
+    );
+  }
+  return parsearConfig(contenido, ruta);
+}
+
+/**
+ * Separada de resolverConfig para poder probar el parseo y la
+ * validacion sin disco, y para que el mensaje de error siempre pueda
+ * nombrar el fichero de donde salio el problema.
+ */
+export function parsearConfig(contenido: string, ruta: string): TaskcodeConfig {
+  const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
+    etiqueta: 'config',
+    crearError: (mensaje) => new ConfigError(`[ERROR] ${ruta}: ${mensaje}`),
+    permitirComentariosDeLinea: true,
+  });
+
+  const config: TaskcodeConfig = { ...CONFIG_DEFAULTS };
+  const vistas = new Set<string>();
+
+  for (const par of pares) {
+    const donde = `${ruta}:${par.numeroLinea}`;
+
+    if (!(CLAVES_CONFIG as readonly string[]).includes(par.clave)) {
+      throw new ConfigError(mensajeClaveDesconocida(donde, par.clave));
+    }
+    // Una clave repetida se pisaria en silencio (el ultimo gana) y el
+    // fichero diria una cosa mientras el plugin usa otra: mismo dano
+    // que un default silencioso, misma respuesta.
+    if (vistas.has(par.clave)) {
+      throw new ConfigError(
+        `[ERROR] ${donde}: la clave "${par.clave}" esta repetida.\n` +
+          '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.'
+      );
+    }
+    vistas.add(par.clave);
+
+    switch (par.clave) {
+      case 'rama_base':
+        config.rama_base = validarTextoNoVacio(donde, par.clave, par.valor);
+        break;
+      case 'agente_revisor_por_defecto':
+        config.agente_revisor_por_defecto = validarTextoNoVacio(donde, par.clave, par.valor);
+        break;
+      case 'limite_wip':
+        config.limite_wip = validarEnteroPositivo(donde, par.clave, par.valor);
+        break;
+    }
+  }
+
+  return config;
+}
+
+/**
+ * Enumera SIEMPRE las claves validas (criterio de la decision #9: el
+ * mensaje dice que esta mal y cuales son las validas) y, si la escrita
+ * se parece mucho a una de ellas, la propone. El caso motivador es
+ * literal: `limite_wp`.
+ */
+function mensajeClaveDesconocida(donde: string, clave: string): string {
+  const sugerida = claveMasParecida(clave);
+  const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
+  if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
+  lineas.push(`        Claves validas: ${CLAVES_CONFIG.join(', ')}.`);
+  return lineas.join('\n');
+}
+
+/** Distancia de edicion (Levenshtein) a mano — cero dependencias, como el resto. */
+function distanciaEdicion(a: string, b: string): number {
+  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
+  for (let i = 1; i <= a.length; i++) {
+    const actual = [i];
+    for (let j = 1; j <= b.length; j++) {
+      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
+      actual[j] = Math.min(
+        (actual[j - 1] as number) + 1,
+        (previa[j] as number) + 1,
+        (previa[j - 1] as number) + coste
+      );
+    }
+    previa = actual;
+  }
+  return previa[b.length] as number;
+}
+
+/** La clave valida mas cercana, si esta lo bastante cerca como para ser una errata. */
+function claveMasParecida(clave: string): string | null {
+  let mejor: string | null = null;
+  let mejorDistancia = Number.POSITIVE_INFINITY;
+  for (const valida of CLAVES_CONFIG) {
+    const d = distanciaEdicion(clave.toLowerCase(), valida);
+    if (d < mejorDistancia) {
+      mejorDistancia = d;
+      mejor = valida;
+    }
+  }
+  // Umbral: hasta un tercio de la clave. Sin el, "foo" propondria
+  // "rama_base" y el consejo dejaria de valer nada.
+  return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
+}
+
+/**
+ * Texto no vacio. Se guarda RECORTADO: `rama_base: " develop "` es
+ * develop, no " develop " — misma doctrina que personaDeTarea en
+ * wip.ts, donde un valor entrecomillado con espacios ya provoco un
+ * hallazgo de revision por pares.
+ *
+ * No se valida que `rama_base` sea un nombre de rama legal: esa regla
+ * la tiene Git (y isValidBranchName la consulta preguntandoselo a el).
+ * Reimplementarla aqui crearia una segunda fuente de verdad que
+ * podria rechazar ramas que Git acepta.
+ */
+function validarTextoNoVacio(donde: string, clave: string, valor: unknown): string {
+  if (valor === null) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
+        `        O le das un valor, o borras la linea (por defecto: ` +
+        `"${CONFIG_DEFAULTS[clave as 'rama_base' | 'agente_revisor_por_defecto']}").`
+    );
+  }
+  if (typeof valor !== 'string') {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "${clave}" debe ser texto, y es ${describirValor(valor)}.`
+    );
+  }
+  const recortado = valor.trim();
+  if (recortado === '') {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
+        `        O le das un valor, o borras la linea (por defecto: ` +
+        `"${CONFIG_DEFAULTS[clave as 'rama_base' | 'agente_revisor_por_defecto']}").`
+    );
+  }
+  return recortado;
+}
+
+/** Entero >= 1. Un limite de 0 no es "sin limite": es "no se puede trabajar". */
+function validarEnteroPositivo(donde: string, clave: string, valor: unknown): number {
+  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 1, ` +
+        `y es ${describirValor(valor)}.\n` +
+        `        Por defecto es ${CONFIG_DEFAULTS.limite_wip}. Un 0 o un negativo no ` +
+        'significan "sin limite": impedirian arrancar cualquier tarea.'
+    );
+  }
+  return valor;
+}
+
+/** Como se nombra un valor rechazado en un mensaje de error. */
+function describirValor(valor: unknown): string {
+  if (valor === null) return 'un valor vacio';
+  if (Array.isArray(valor)) return `una lista (${JSON.stringify(valor)})`;
+  if (typeof valor === 'string') return `el texto "${valor}"`;
+  return `${String(valor)} (${typeof valor})`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/frontmatter.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/frontmatter.ts
index 15db26c..a510ef2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/frontmatter.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/frontmatter.ts
@@ -10,6 +10,12 @@
  * de escribir, de revisar y de mantener que tirar de una libreria
  * completa para un formato que nosotros mismos controlamos.
  *
+ * Desde TASK-030 (item C4) el bucle `clave: valor` vive extraido en
+ * parseBloqueClaveValor() y lo comparten este modulo y
+ * src/core/config.ts (`.taskcode/config.yml`), que usa exactamente el
+ * mismo subconjunto. Es un unico parser a proposito: dos parsers YAML
+ * escritos a mano del mismo subconjunto acaban discrepando.
+ *
  * Nota de robustez (hallazgo de revision por pares, Sprint 0):
  * cualquier string que se serializa se cita SIEMPRE que, sin comillas,
  * se re-parsearia como otra cosa (numero, boolean, null, o un
@@ -32,45 +38,123 @@ export class FrontmatterParseError extends Error {
   }
 }
 
-export function parseFrontmatter(content: string): ParsedFrontmatter {
-  const lines = content.split(/\r?\n/);
-  if ((lines[0] ?? '').trim() !== FRONTMATTER_DELIM) {
-    throw new FrontmatterParseError(
-      'El documento no empieza con un bloque frontmatter "---".'
-    );
-  }
+/** Un par `clave: valor` ya parseado, con la linea (1-based) donde salio. */
+export interface ParClaveValor {
+  clave: string;
+  valor: unknown;
+  numeroLinea: number;
+}
+
+export interface OpcionesBloqueClaveValor {
+  /**
+   * Palabra que aparece en los mensajes de error ("frontmatter",
+   * "config"). Sin esto, un `.taskcode/config.yml` malformado se
+   * quejaria de "frontmatter", que no es lo que el usuario esta
+   * editando.
+   */
+  etiqueta: string;
+  /** Constructor del error de cada caller (FrontmatterParseError, ConfigError...). */
+  crearError: (mensaje: string) => Error;
+  /** Si devuelve true, el bloque termina ahi (esa linea no se parsea como par). */
+  esFin?: (linea: string) => boolean;
+  /**
+   * Saltarse las lineas que empiezan por "#". Apagado por defecto a
+   * proposito: el frontmatter de tarea.md nunca las ha admitido (una
+   * linea sin ":" es un error) y encenderlas ahi seria un cambio de
+   * comportamiento colado por la puerta de atras. En config.yml, en
+   * cambio, un fichero de configuracion sin comentarios de linea seria
+   * inservible.
+   */
+  permitirComentariosDeLinea?: boolean;
+}
 
+export interface BloqueClaveValor {
+  /** Ultimo valor de cada clave (una clave repetida se pisa: ver `pares`). */
+  data: Record<string, unknown>;
+  /**
+   * Los pares EN ORDEN y con repeticiones. `data` pierde los
+   * duplicados; quien necesite detectarlos (config.ts, donde un
+   * `limite_wip` escrito dos veces es un fallo que hay que gritar)
+   * mira aqui.
+   */
+  pares: ParClaveValor[];
+  /** Indice de la linea SIGUIENTE a la que cerro el bloque. */
+  siguiente: number;
+  /** true si se encontro la linea de fin (solo relevante con `esFin`). */
+  cerrado: boolean;
+}
+
+/**
+ * El bucle `clave: valor` compartido — extraido de parseFrontmatter en
+ * TASK-030 (item C4) para que `.taskcode/config.yml` NO tenga un
+ * segundo parser de YAML. Dos parsers a mano del mismo subconjunto
+ * divergen; este es el unico sitio donde se decide que es una linea
+ * valida, que es un comentario y como se tipa un escalar.
+ *
+ * No conoce ni frontmatter ni config: recibe por donde empezar, como
+ * saber que el bloque termino y como construir sus errores.
+ */
+export function parseBloqueClaveValor(
+  lineas: readonly string[],
+  desde: number,
+  opciones: OpcionesBloqueClaveValor
+): BloqueClaveValor {
   const data: Record<string, unknown> = {};
-  let i = 1;
-  let closed = false;
-  for (; i < lines.length; i++) {
-    const line = lines[i] ?? '';
-    if (line.trim() === FRONTMATTER_DELIM) {
-      closed = true;
+  const pares: ParClaveValor[] = [];
+  let i = desde;
+  let cerrado = false;
+
+  for (; i < lineas.length; i++) {
+    const line = lineas[i] ?? '';
+    if (opciones.esFin !== undefined && opciones.esFin(line)) {
+      cerrado = true;
       i++;
       break;
     }
-    if (line.trim() === '') continue;
+    const trimmed = line.trim();
+    if (trimmed === '') continue;
+    if (opciones.permitirComentariosDeLinea === true && trimmed.startsWith('#')) continue;
 
     const colonIdx = line.indexOf(':');
     if (colonIdx === -1) {
-      throw new FrontmatterParseError(
-        `Linea de frontmatter invalida (falta ":"): "${line}"`
+      throw opciones.crearError(
+        `Linea de ${opciones.etiqueta} invalida (falta ":"): "${line}"`
       );
     }
-    const key = line.slice(0, colonIdx).trim();
-    if (key === '') {
-      throw new FrontmatterParseError(`Linea de frontmatter con clave vacia: "${line}"`);
+    const clave = line.slice(0, colonIdx).trim();
+    if (clave === '') {
+      throw opciones.crearError(
+        `Linea de ${opciones.etiqueta} con clave vacia: "${line}"`
+      );
     }
     const rawValue = stripInlineComment(line.slice(colonIdx + 1).trim());
-    data[key] = parseScalarOrArray(rawValue);
+    const valor = parseScalarOrArray(rawValue);
+    data[clave] = valor;
+    pares.push({ clave, valor, numeroLinea: i + 1 });
   }
 
-  if (!closed) {
+  return { data, pares, siguiente: i, cerrado };
+}
+
+export function parseFrontmatter(content: string): ParsedFrontmatter {
+  const lines = content.split(/\r?\n/);
+  if ((lines[0] ?? '').trim() !== FRONTMATTER_DELIM) {
+    throw new FrontmatterParseError(
+      'El documento no empieza con un bloque frontmatter "---".'
+    );
+  }
+
+  const { data, siguiente, cerrado } = parseBloqueClaveValor(lines, 1, {
+    etiqueta: 'frontmatter',
+    crearError: (mensaje) => new FrontmatterParseError(mensaje),
+    esFin: (linea) => linea.trim() === FRONTMATTER_DELIM,
+  });
+
+  if (!cerrado) {
     throw new FrontmatterParseError('El bloque frontmatter no se cierra con "---".');
   }
 
-  const body = lines.slice(i).join('\n').replace(/^\n+/, '');
+  const body = lines.slice(siguiente).join('\n').replace(/^\n+/, '');
   return { data, body };
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
index 049e3d9..0002823 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
@@ -25,14 +25,25 @@
  * codigo de una tarea en la rama Git de otra tarea", Carlos, #13).
  */
 import { STATE_FOLDER, type TareaUbicada, type TaskState } from './task.js';
+import { CONFIG_DEFAULTS } from './config.js';
 
 /**
- * Estados cuya carpeta ocupa el hueco de ejecucion. Un unico sitio
- * donde esta escrita la regla: el dia que exista .taskcode/config.yml
- * (item C4) y se quiera un limite configurable, se toca aqui.
+ * Estados cuya carpeta ocupa el hueco de ejecucion.
  */
 export const ESTADOS_QUE_OCUPAN_WIP: readonly TaskState[] = ['en-curso', 'en-revision'];
 
+/**
+ * Cuantas tareas ocupadas admite una persona antes de que la siguiente
+ * quede bloqueada. Desde TASK-030 (item C4) es configurable con
+ * `limite_wip` en `.taskcode/config.yml`; el valor por defecto vive en
+ * CONFIG_DEFAULTS y es 1, que es lo que este modulo hacia siempre.
+ *
+ * Este modulo SIGUE siendo puro: recibe el limite ya resuelto, no lee
+ * el fichero. Solo importa la constante del default para no reescribir
+ * el 1 aqui y que puedan divergir.
+ */
+export const LIMITE_WIP_POR_DEFECTO = CONFIG_DEFAULTS.limite_wip;
+
 /**
  * Normaliza un "asignado_a" para COMPARAR (nunca para escribir): lo
  * recorta y trata la cadena vacia como "sin asignar".
@@ -110,17 +121,30 @@ export function resolverAsignado(
  * "Carlos" y "carlos" como la misma persona — inventar aqui una
  * equivalencia que "taskctl board" no tiene crearia una incoherencia
  * nueva.
+ *
+ * `limite` (TASK-030, item C4) es cuantas tareas ocupadas se toleran.
+ * Devolver [] cuando todavia caben es lo que permite que el limite sea
+ * configurable sin que el llamante cambie su forma de preguntar: sigue
+ * siendo "si esta lista no esta vacia, no puedes arrancar". Con el
+ * valor por defecto (1) el resultado es identico al de antes de C4:
+ * cualquier otra tarea ocupada bloquea.
  */
 export function tareasQueBloquean(
   tareas: readonly TareaUbicada[],
   persona: string,
-  idQueArranca: string
+  idQueArranca: string,
+  limite: number = LIMITE_WIP_POR_DEFECTO
 ): TareaUbicada[] {
   const buscada = personaDeTarea(persona);
   if (buscada === null) return [];
-  return tareas
+  const ocupadas = tareas
     .filter((t) => t.task.id !== idQueArranca && personaDeTarea(t.task.asignado_a) === buscada)
     .sort((a, b) => a.task.id.localeCompare(b.task.id));
+  // Se devuelven TODAS las ocupadas, no solo las que sobran: el
+  // mensaje de error tiene que poder nombrar cual hay que cerrar, y
+  // con un limite de 3 y 3 abiertas no hay ninguna "sobrante" — hay
+  // tres candidatas.
+  return ocupadas.length >= limite ? ocupadas : [];
 }
 
 /** Una linea por tarea bloqueante: ID, titulo, carpeta REAL y rama. */
@@ -140,7 +164,8 @@ function describirBloqueante(t: TareaUbicada): string {
 export function mensajeWipExcedido(
   idQueArranca: string,
   persona: string,
-  bloqueantes: readonly TareaUbicada[]
+  bloqueantes: readonly TareaUbicada[],
+  limite: number = LIMITE_WIP_POR_DEFECTO
 ): string {
   const primera = bloqueantes[0] as TareaUbicada;
   const lineas: string[] = [];
@@ -151,18 +176,30 @@ export function mensajeWipExcedido(
         `(${STATE_FOLDER[primera.estadoCarpeta]}, rama ${primera.task.rama}).`
     );
   } else {
-    // Mas de una solo puede pasar si el repo ya estaba en un estado
-    // inconsistente (el limite es de una): se listan todas en vez de
-    // enganar nombrando solo la primera.
+    // Con el limite por defecto (1), mas de una solo puede pasar si el
+    // repo ya estaba en un estado inconsistente. Con un limite mayor es
+    // el caso normal. En los dos se listan todas en vez de enganar
+    // nombrando solo la primera.
     lineas.push(
       `[ERROR] ${idQueArranca}: ${persona} ya tiene ${bloqueantes.length} tareas sin cerrar:`
     );
     for (const t of bloqueantes) lineas.push(describirBloqueante(t));
   }
 
-  lineas.push(
-    '        Una sola tarea en curso por persona: esa rama sigue abierta y sin mergear,'
-  );
+  // El texto para limite 1 se conserva literal: es el que prueban los
+  // tests de B7 y el que la gente reconoce. Con un limite configurado
+  // mayor, decir "una sola tarea por persona" seria sencillamente
+  // mentira, asi que se dice el numero real y de donde sale.
+  if (limite === 1) {
+    lineas.push(
+      '        Una sola tarea en curso por persona: esa rama sigue abierta y sin mergear,'
+    );
+  } else {
+    lineas.push(
+      `        El limite es de ${limite} tareas por persona (limite_wip en ` +
+        '.taskcode/config.yml): esa rama sigue abierta y sin mergear,'
+    );
+  }
   lineas.push('        y ahi es donde se commitean las correcciones de su revision.');
   // El consejo NO dice "ejecuta taskctl finish" a secas (hallazgo MENOR
   // de revision por pares, TASK-015): si la bloqueante esta en
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
new file mode 100644
index 0000000..15bd1ad
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
@@ -0,0 +1,304 @@
+/**
+ * Auto-commit de taskctl — paso 5 de la seccion 8.3 (TASK-030, item
+ * C2, decision #14: "commitea si, sube solo con --push").
+ *
+ * Existe porque hoy `taskctl` escribe ficheros que luego nadie
+ * commitea: de los 9 commits que costo TASK-029, 4 existian solo para
+ * registrar lo que el propio CLI acababa de escribir. Ademas, dejar el
+ * workspace sucio es lo que hace que `taskctl import` no se pueda
+ * ejecutar dos veces seguidas (el guard de la 8.3 aborta la segunda),
+ * un fallo documentado en HALLAZGOS.md.
+ *
+ * Las cuatro reglas de diseno, por orden de importancia:
+ *
+ * 1. **Se commitean SOLO las rutas que taskctl acaba de escribir.**
+ *    Nunca un `git add -A` a secas. El guard de la 8.3
+ *    (`ensureBaseBranchReady`) exige workspace limpio, pero solo lo
+ *    aplican 4 de los 8 comandos: en `start`, `review` y `finish`
+ *    puede haber trabajo de la persona en el arbol, y barrerlo dentro
+ *    de un commit automatico seria exactamente el dano que esta
+ *    herramienta existe para evitar. Dos mecanismos independientes lo
+ *    garantizan aqui:
+ *      - cada ruta se prepara con su propio `git add -A -- <ruta>`
+ *        (el `-A` va ACOTADO por el pathspec: prepara altas, bajas y
+ *        modificaciones bajo esa ruta y nada mas — hace falta para que
+ *        el borrado de la carpeta de origen de un `moveTareaFile`
+ *        entre en el mismo commit que el alta de la de destino, si no
+ *        el commit registraria una copia y no un movimiento);
+ *      - el commit se hace con `git commit -m <msg> -- <rutas>`, que
+ *        es pathspec-limitado (modo `--only`): aunque la persona
+ *        tuviera OTROS ficheros ya preparados con `git add`, no entran
+ *        en el commit y siguen preparados despues. Comprobado, no
+ *        supuesto: con `src/algo.ts` en estado `MM` antes del commit,
+ *        sigue en `MM` despues y el commit solo contiene las rutas de
+ *        taskctl.
+ * 2. **Nada que commitear, ningun commit.** Si tras preparar las rutas
+ *    el indice no difiere de HEAD, no se crea un commit vacio.
+ * 3. **Si el commit falla, se falla ruidosamente.** Un hook de
+ *    pre-commit, una firma GPG rechazada o una identidad de Git sin
+ *    configurar no se tragan: el mensaje dice que la tarea esta
+ *    ESCRITA pero NO registrada, y en que estado queda el arbol.
+ * 4. **`--push` empuja la rama actual**, y sin remoto avisa y sigue —
+ *    misma doctrina que `detect_origin_available` en
+ *    `_gitflow-common.sh` y que el `--push` que `taskctl pause` ya
+ *    tiene (que hace literalmente `git push origin <rama actual>`).
+ *    No se inventa vocabulario nuevo.
+ */
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { GitCommandError, currentBranch, isRemoteAvailable, runGit } from './git.js';
+
+export class AutoCommitError extends Error {}
+
+/** Que paso con la peticion de subir la rama. */
+export type ResultadoPush =
+  /** No se paso --push. */
+  | 'no-solicitado'
+  /** `git push origin <rama>` completado. */
+  | 'empujado'
+  /** Se pidio --push pero no hay origin alcanzable: se avisa y se sigue. */
+  | 'sin-remoto'
+  /** Se pidio --push pero HEAD esta desacoplado: no hay rama que subir. */
+  | 'sin-rama';
+
+export interface AutoCommitOptions {
+  /** Raiz del repo Git (el `repoCwd` de los comandos). */
+  cwd: string;
+  /**
+   * Rutas que el comando acaba de escribir, absolutas o relativas a
+   * `cwd`. Se admiten carpetas (lo normal: la carpeta de la tarea) y
+   * ficheros sueltos (CHANGELOG.md, docs/INDEX.md...). Las que no
+   * existan ni en disco ni en el indice se ignoran en silencio: es el
+   * caso legitimo de la carpeta de ORIGEN de un movimiento cuando la
+   * tarea todavia no estaba versionada.
+   */
+  rutas: readonly string[];
+  /** Mensaje de commit, en el estilo del repo y SIN TILDES. */
+  mensaje: string;
+  /** Si ademas hay que subir la rama actual a origin. */
+  push?: boolean;
+}
+
+export interface AutoCommitResult {
+  /** true si esta invocacion creo un commit. */
+  commiteado: boolean;
+  /** SHA corto del commit creado, o null si no hubo nada que commitear. */
+  commit: string | null;
+  /** Ficheros que entraron en el commit, relativos a la raiz del repo. */
+  ficheros: readonly string[];
+  /** Rama activa en el momento del commit ('' si HEAD esta desacoplado). */
+  rama: string;
+  push: ResultadoPush;
+  /** Avisos no fatales, para que el CLI los saque por stderr. */
+  avisos: readonly string[];
+}
+
+/**
+ * Los scripts de Git-Flow procesan los mensajes de commit, asi que
+ * este repo los escribe sin tildes (CLAUDE.md). Aqui se comprueba
+ * mecanicamente en vez de confiar en que cada generador se acuerde: es
+ * la clase de regla que se cumple durante tres meses y luego no.
+ *
+ * Ojo al cablear comandos nuevos: por eso ninguno de los mensajes
+ * incluye el TITULO de la tarea, que es texto libre de la persona y
+ * puede llevar tildes con todo el derecho.
+ */
+function assertMensajeAscii(mensaje: string): void {
+  if (mensaje.trim() === '') {
+    throw new AutoCommitError('[ERROR] El mensaje de commit automatico no puede estar vacio.');
+  }
+  const malo = /[^\x20-\x7E\n]/.exec(mensaje);
+  if (malo !== null) {
+    throw new AutoCommitError(
+      `[ERROR] El mensaje de commit automatico contiene un caracter no ASCII ` +
+        `(${JSON.stringify(malo[0])}): "${mensaje}". Los scripts de Git-Flow procesan estos ` +
+        'mensajes y este repo los escribe sin tildes.'
+    );
+  }
+}
+
+/**
+ * Mensaje de commit determinista en el estilo del repo:
+ * `chore(TASK-030): tarea en curso`. Un solo sitio donde vive el
+ * formato, y de paso donde se valida que no lleve tildes.
+ */
+export function mensajeChore(scope: string, resumen: string): string {
+  // Comprobados por separado: `chore(TASK-030): ` con el resumen vacio
+  // no es una cadena vacia, asi que la comprobacion del mensaje
+  // completo no lo veria pasar — y un commit sin asunto es
+  // exactamente lo que un `${}` mal cableado produce.
+  if (scope.trim() === '' || resumen.trim() === '') {
+    throw new AutoCommitError(
+      `[ERROR] Mensaje de commit automatico incompleto: scope="${scope}", resumen="${resumen}".`
+    );
+  }
+  const mensaje = `chore(${scope}): ${resumen}`;
+  assertMensajeAscii(mensaje);
+  return mensaje;
+}
+
+/**
+ * Pasa una ruta a pathspec relativo al cwd de Git, con separadores
+ * POSIX (Git los acepta en las dos plataformas; los `\` de Windows,
+ * no siempre).
+ *
+ * Rechaza cualquier cosa que se salga de `cwd`, incluida la propia
+ * raiz: un pathspec vacio o "." convertiria `git add -A -- <ruta>` en
+ * el `git add -A` global que la regla 1 prohibe, y seria un fallo
+ * silencioso — el commit saldria bien y se llevaria por delante el
+ * trabajo de la persona.
+ */
+function normalizarRuta(cwd: string, ruta: string): string {
+  const rel = path.relative(cwd, path.resolve(cwd, ruta));
+  if (rel === '' || rel === '.' || rel.startsWith('..') || path.isAbsolute(rel)) {
+    throw new AutoCommitError(
+      `[ERROR] Ruta invalida para el commit automatico: "${ruta}" no esta dentro de ` +
+        `"${cwd}". taskctl solo commitea lo que el mismo acaba de escribir.`
+    );
+  }
+  return rel.split(path.sep).join('/');
+}
+
+/**
+ * true si esa ruta tiene algo que Git pueda preparar: existe en disco
+ * (alta o modificacion) o tiene entradas en el indice (baja, p. ej. la
+ * carpeta de origen de un movimiento de tarea). Sin esta comprobacion,
+ * `git add` muere con `fatal: pathspec ... did not match any files`
+ * (exit 128) y tumbaria el comando por una ruta que sencillamente no
+ * tiene nada que aportar.
+ */
+function tieneAlgoQuePreparar(cwd: string, rutaRel: string): boolean {
+  if (existsSync(path.resolve(cwd, rutaRel))) return true;
+  return runGit(['ls-files', '--', rutaRel], cwd) !== '';
+}
+
+/**
+ * Commitea (y opcionalmente sube) EXCLUSIVAMENTE las rutas indicadas.
+ * Ver la cabecera del fichero para las cuatro reglas que cumple.
+ */
+export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
+  assertMensajeAscii(opts.mensaje);
+
+  const { cwd } = opts;
+  const avisos: string[] = [];
+  const rama = currentBranch(cwd);
+
+  // Deduplicadas y ordenadas para que el commando de Git sea
+  // determinista (y los tests puedan aseverar sobre el).
+  const rutasRel = [...new Set(opts.rutas.map((r) => normalizarRuta(cwd, r)))].sort();
+  const presentes = rutasRel.filter((r) => tieneAlgoQuePreparar(cwd, r));
+
+  let commiteado = false;
+  let commit: string | null = null;
+  let ficheros: string[] = [];
+
+  if (presentes.length > 0) {
+    // Una a una, a proposito: un pathspec por invocacion deja claro en
+    // el log de Git (y en un strace, si hiciera falta) que no hay
+    // ningun `git add` sin acotar por ahi.
+    for (const rutaRel of presentes) {
+      try {
+        runGit(['add', '-A', '--', rutaRel], cwd);
+      } catch (e: unknown) {
+        throw new AutoCommitError(
+          `[ERROR] taskctl escribio los ficheros de la tarea pero no pudo preparar ` +
+            `"${rutaRel}" para el commit: ${detalleDeError(e)}. Los cambios estan en el ` +
+            'arbol de trabajo; revisa el motivo y commitealos a mano.'
+        );
+      }
+    }
+
+    // Regla 2: si el indice no difiere de HEAD bajo estas rutas, no
+    // hay commit que hacer (p. ej. "taskctl approve" sobre una tarea
+    // que ya estaba aprobada y con la misma fecha).
+    ficheros = runGit(['diff', '--cached', '--name-only', '--', ...presentes], cwd)
+      .split('\n')
+      .map((l) => l.trim())
+      .filter((l) => l !== '');
+
+    if (ficheros.length > 0) {
+      try {
+        runGit(['commit', '-m', opts.mensaje, '--', ...presentes], cwd);
+      } catch (e: unknown) {
+        throw new AutoCommitError(
+          `[ERROR] taskctl escribio los ficheros de la tarea pero NO pudo commitearlos: ` +
+            `${detalleDeError(e)}. Estan preparados (git add) en la rama "${rama}": revisa el ` +
+            'motivo (un hook de pre-commit, una firma GPG, o "git config user.email" sin ' +
+            'configurar) y haz el commit a mano. La tarea esta escrita pero no registrada.'
+        );
+      }
+      commiteado = true;
+      commit = runGit(['rev-parse', '--short', 'HEAD'], cwd);
+    }
+  }
+
+  return { commiteado, commit, ficheros, rama, push: empujar(opts, rama, avisos), avisos };
+}
+
+/**
+ * `--push` empuja la RAMA ACTUAL, se haya commiteado algo en esta
+ * invocacion o no — exactamente lo que hace `pause-work.sh --push`,
+ * que tambien empuja cuando el workspace ya estaba limpio. Sin origin
+ * alcanzable avisa y sigue (exit 0); si el push se intenta y falla, se
+ * falla ruidosamente diciendo que el commit SI se creo.
+ */
+function empujar(opts: AutoCommitOptions, rama: string, avisos: string[]): ResultadoPush {
+  if (opts.push !== true) return 'no-solicitado';
+
+  if (rama === '') {
+    avisos.push(
+      'Se pidio --push pero HEAD esta desacoplado (no hay rama activa): no se ha subido nada.'
+    );
+    return 'sin-rama';
+  }
+  if (!isRemoteAvailable(opts.cwd)) {
+    avisos.push(
+      `Se pidio --push pero no hay conexion con origin (sin remoto configurado, o VPN/red ` +
+        `caida): "${rama}" no se ha subido. Se continua en modo local.`
+    );
+    return 'sin-remoto';
+  }
+  try {
+    runGit(['push', 'origin', rama], opts.cwd);
+  } catch (e: unknown) {
+    throw new AutoCommitError(
+      `[ERROR] El trabajo quedo commiteado en "${rama}", pero el push a origin fallo: ` +
+        `${detalleDeError(e)}. Sube la rama a mano ("git push origin ${rama}") cuando ` +
+        'resuelvas el motivo.'
+    );
+  }
+  return 'empujado';
+}
+
+function detalleDeError(e: unknown): string {
+  if (e instanceof GitCommandError) {
+    return e.stderr.trim() === '' ? e.message : e.stderr.trim();
+  }
+  return e instanceof Error ? e.message : String(e);
+}
+
+/**
+ * Saca `--push` / `-p` de argv y devuelve el resto.
+ *
+ * No se delega en `parseArgs` a proposito: ese parser trata
+ * `--flag valor` como par, asi que `taskctl plan --push TASK-030` se
+ * habria leido como `push="TASK-030"` y la tarea habria desaparecido
+ * de los posicionales. Como `--push` es booleano puro, quitarlo antes
+ * de parsear es mas simple que ensenarle al parser que hay flags sin
+ * valor.
+ *
+ * `-p` se acepta ademas de `--push` porque `pause-work.sh` ya acepta
+ * las dos formas: mismo flag, mismo significado, mismo vocabulario.
+ */
+export function extraerPushFlag(argv: readonly string[]): { push: boolean; resto: string[] } {
+  const resto: string[] = [];
+  let push = false;
+  for (const arg of argv) {
+    if (arg === '--push' || arg === '-p') {
+      push = true;
+      continue;
+    }
+    resto.push(arg);
+  }
+  return { push, resto };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index c80a8eb..a80a60b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -10,6 +10,7 @@ import { spawnSync } from 'node:child_process';
 import { existsSync, readFileSync } from 'node:fs';
 import path from 'node:path';
 import type { Task } from '../core/task.js';
+import { resolverConfig } from '../core/config.js';
 
 export class GitCommandError extends Error {
   constructor(
@@ -44,7 +45,13 @@ export class GitLaunchError extends Error {
 // update ya consumado). 64 MB cubre cualquier diff razonable.
 const GIT_MAX_BUFFER = 64 * 1024 * 1024;
 
-function runGit(args: readonly string[], cwd: string): string {
+/**
+ * Exportada en TASK-030 (integracion): git-commit.ts la necesitaba y,
+ * al no poder tocar este fichero durante el trabajo en paralelo, llevo
+ * un clon de estas mismas diez lineas. Dos copias de la traduccion de
+ * errores de Git a excepciones es justo lo que acaba divergiendo.
+ */
+export function runGit(args: readonly string[], cwd: string): string {
   const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER });
   if (result.error) {
     throw new GitLaunchError(result.error);
@@ -345,11 +352,31 @@ const RAMA_BASE_ES_DEVELOP: Record<Task['tipo'], boolean> = {
 };
 
 /**
- * Rama base esperada para un tipo de tarea (seccion 8.3): "develop"
- * para feature/fix/release, resolveMainBranch() para hotfix.
+ * Rama base esperada para un tipo de tarea (seccion 8.3): la rama base
+ * configurada para feature/fix/release, resolveMainBranch() para
+ * hotfix.
+ *
+ * Hasta TASK-030 (item C4) "develop" era un literal aqui — el unico
+ * hardcode de los tres de la decision #9 que no se podia detectar
+ * solo. Ahora sale de `.taskcode/config.yml` (clave `rama_base`), y
+ * sin fichero resolverConfig devuelve exactamente "develop": el
+ * comportamiento no cambia.
+ *
+ * El config se lee AQUI y no se pasa por parametro a proposito: este
+ * es el unico punto por el que pasan los 8 comandos para saber su rama
+ * base (via ensureBaseBranchReady, start y review), asi que cablearlo
+ * aqui garantiza que ninguno se quede fuera. Un parametro opcional
+ * dejaria que un comando futuro se olvidara de pasarlo y volviera al
+ * default en silencio, que es justo lo que la regla 2 de C4 prohibe.
+ *
+ * Los hotfix NO usan `rama_base`: cuelgan de la rama principal, que
+ * resolveMainBranch detecta sola. La decision #9 descarta
+ * `rama_principal` como clave precisamente porque esa deteccion ya
+ * funciona.
  */
 export function resolveBaseBranchForTipo(tipo: Task['tipo'], cwd: string): string {
-  return RAMA_BASE_ES_DEVELOP[tipo] ? 'develop' : resolveMainBranch(cwd);
+  if (!RAMA_BASE_ES_DEVELOP[tipo]) return resolveMainBranch(cwd);
+  return resolverConfig(cwd).rama_base;
 }
 
 export class BaseBranchGuardError extends Error {}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index 4cc7d0a..b8243d0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -19,6 +19,20 @@ function git(args: string[], cwd: string): void {
   assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
 }
 
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que buena parte de estos commits a mano
+ * ya no tienen nada que registrar (los de "new" si, hasta que se
+ * cablee): `git commit` saldria 1 con "nothing to commit" y el assert
+ * de `git()` lo daria por fallo del test. Se commitea solo si queda
+ * algo — y que no quede es la senal de que el auto-commit funciono.
+ */
+function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
 async function withTempRepoCwd(fn: (repoRoot: string) => Promise<void>): Promise<void> {
   const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-cli-'));
   const cwdAntes = process.cwd();
@@ -33,8 +47,7 @@ async function withTempRepoCwd(fn: (repoRoot: string) => Promise<void>): Promise
     // taskctl start (TASK-015); mismo patron que start.test.ts.
     await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
     await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    commitAll(repoRoot, 'inicial');
     git(['checkout', '-q', '-b', 'develop'], repoRoot);
     process.chdir(repoRoot);
     await fn(repoRoot);
@@ -117,8 +130,7 @@ test('main: taskctl plan --asignado-a confirma la asignacion y la deja en tarea.
     assert.equal(creada.code, 0);
     // plan exige workspace limpio, asi que se commitea lo que dejo
     // new (misma secuencia que en uso real).
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);
+    commitAll(repoRoot, 'tarea nueva');
 
     const { code, stdout } = await captureOutput(() =>
       main(['plan', 'TASK-001', '--asignado-a', 'carlos'])
@@ -139,8 +151,7 @@ test('main: sin --asignado-a y sin identidad Git no se imprime linea de asignaci
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Sin asignar', '--tipo', 'feature']));
     assert.equal(creada.code, 0);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);
+    commitAll(repoRoot, 'tarea nueva');
     // Se vacia la identidad DESPUES de commitear (TASK-024): sin
     // ella, plan deja la tarea sin asignar, como antes.
     git(['config', 'user.email', ''], repoRoot);
@@ -156,8 +167,7 @@ test('main: sin --asignado-a pero CON identidad Git, la tarea se autoasigna y se
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Con identidad', '--tipo', 'feature']));
     assert.equal(creada.code, 0);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);
+    commitAll(repoRoot, 'tarea nueva');
 
     const { code, stdout } = await captureOutput(() => main(['plan', 'TASK-001']));
 
@@ -176,8 +186,7 @@ test('main: un --asignado-a sin valor sale con codigo 1 y mensaje util, no con u
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Flag roto', '--tipo', 'feature']));
     assert.equal(creada.code, 0);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'tarea nueva'], repoRoot);
+    commitAll(repoRoot, 'tarea nueva');
 
     const { code, stderr } = await captureOutput(() => main(['plan', 'TASK-001', '--asignado-a']));
 
@@ -198,30 +207,25 @@ test('main: taskctl start sale con codigo 1 y mensaje util cuando el limite esta
     // documentada en HALLAZGOS.md para taskctl import).
     const uno = await captureOutput(() => main(['new', '--titulo', 'Primera de carlos', '--tipo', 'feature', '--complejidad', 'simple']));
     assert.equal(uno.code, 0, uno.stderr);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'primera tarea'], repoRoot);
+    commitAll(repoRoot, 'primera tarea');
 
     const dos = await captureOutput(() => main(['new', '--titulo', 'Segunda de carlos', '--tipo', 'feature', '--complejidad', 'simple']));
     assert.equal(dos.code, 0, dos.stderr);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'segunda tarea'], repoRoot);
+    commitAll(repoRoot, 'segunda tarea');
 
     const p1 = await captureOutput(() => main(['plan', 'TASK-001', '--asignado-a', 'carlos']));
     assert.equal(p1.code, 0, p1.stderr);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'primera en diseno'], repoRoot);
+    commitAll(repoRoot, 'primera en diseno');
 
     const p2 = await captureOutput(() => main(['plan', 'TASK-002', '--asignado-a', 'carlos']));
     // Esta es la otra mitad de la decision #13: dos tareas en diseno
     // de la misma persona a la vez son legales.
     assert.equal(p2.code, 0, p2.stderr);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'segunda en diseno'], repoRoot);
+    commitAll(repoRoot, 'segunda en diseno');
 
     const primera = await captureOutput(() => main(['start', 'TASK-001']));
     assert.equal(primera.code, 0, primera.stderr);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'primera en curso'], repoRoot);
+    commitAll(repoRoot, 'primera en curso');
 
     const segunda = await captureOutput(() => main(['start', 'TASK-002']));
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
index c287a09..36efabb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
@@ -53,8 +53,17 @@ function branchNow(cwd: string): string {
   return spawnSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' }).stdout.trim();
 }
 
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que llamar a esto justo despues de un
+ * comando puede no tener ya nada que registrar: `git commit` sale 1
+ * con "nothing to commit" y el assert de `git()` lo daria por fallo
+ * del test. Se commitea solo si queda algo — y que no quede es
+ * exactamente la senal de que el auto-commit hizo su trabajo.
+ */
 function commitAll(repoRoot: string, message: string): void {
   git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
new file mode 100644
index 0000000..dbfeb8d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
@@ -0,0 +1,381 @@
+/**
+ * Auto-commit cableado en los comandos (TASK-030, item C2, paso 5 de
+ * la seccion 8.3). Repos Git temporales reales, los scripts de
+ * scripts/gitflow/ tal cual estan en el repo, y evidencia leida de Git
+ * (`git show --stat`, `git status --porcelain`, `git branch
+ * --show-current`) en vez de la palabra del comando.
+ *
+ * SOBRE "trabajo de la persona en el arbol": el plan de TASK-030 decia
+ * que en start/review/finish puede haberlo porque esos tres no aplican
+ * `ensureBaseBranchReady`. Resulto ser solo media verdad, y conviene
+ * dejarlo escrito: los tres NO aplican el guard de la 8.3 pero SI
+ * llaman a `isWorkspaceClean` por su cuenta y abortan con el arbol
+ * sucio, asi que al empezar el comando el arbol esta limpio en los
+ * ocho casos.
+ *
+ * El riesgo real es otro, y es el que se reproduce aqui: entre esa
+ * comprobacion y el commit, taskctl ejecuta scripts de Git-Flow que
+ * pueden dejar ficheros en el arbol (hooks del repo), y sobre todo
+ * puede haber OTRO proceso escribiendo — que en este proyecto es el
+ * caso normal, no el exotico: varios agentes trabajan en paralelo
+ * sobre la misma copia de trabajo. Un `git add -A` en ese momento se
+ * lleva por delante trabajo ajeno. Los hooks de estos tests son la
+ * forma determinista de colocar ese fichero ajeno exactamente en la
+ * ventana en la que el commit automatico ocurre.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, chmod } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runPlanCommand } from '../../src/commands/plan.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { runImportCommand } from '../../src/commands/import.js';
+import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
+import { BaseBranchGuardError } from '../../src/fs/git.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/commands -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
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
+function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-910',
+    titulo: 'Tarea de prueba del auto-commit',
+    tipo: 'feature',
+    sprint: 3,
+    etiquetas: ['cli'],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-910-auto-commit',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-07',
+    actualizado: '2026-09-07',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+async function withTempRepo(
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-c2-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await mkdir(path.join(repoRoot, 'src'), { recursive: true });
+    await writeFile(path.join(repoRoot, 'src', 'algo.ts'), 'export const x = 1;\n', 'utf8');
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
+ * Instala un hook que ensucia `src/algo.ts` — es decir, coloca trabajo
+ * AJENO a taskctl en el arbol justo en la ventana entre la
+ * comprobacion de workspace limpio y el commit automatico.
+ */
+async function hookQueEnsucia(repoRoot: string, nombre: string): Promise<void> {
+  const hook = path.join(repoRoot, '.git', 'hooks', nombre);
+  await writeFile(
+    hook,
+    '#!/bin/sh\nprintf "// trabajo a medias de la persona\\n" >> src/algo.ts\n',
+    'utf8'
+  );
+  await chmod(hook, 0o755);
+}
+
+/** Assert central del item: el commit de taskctl no toca lo ajeno. */
+function assertNoSeLlevaTrabajoAjeno(repoRoot: string): void {
+  const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
+  assert.doesNotMatch(stat, /algo\.ts/, `el commit automatico se llevo src/algo.ts:\n${stat}`);
+  assert.match(
+    git(['status', '--porcelain'], repoRoot),
+    /^ M src\/algo\.ts$/m,
+    'src/algo.ts deberia seguir sucio en el arbol'
+  );
+}
+
+// ─── plan / approve ────────────────────────────────────────────────────────
+
+test('taskctl plan: commitea el movimiento a 01-en-diseno y el scaffold del plan, y deja tareas/ limpio', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar.\n');
+    commitAll(repoRoot, 'chore(TASK-910): tarea creada');
+
+    const r = await runPlanCommand(tareasRoot, ['TASK-910'], '2026-09-07', { repoCwd: repoRoot });
+
+    assert.equal(r.autoCommit.commiteado, true);
+    assert.equal(git(['log', '--format=%s', '-1'], repoRoot).trim(), 'chore(TASK-910): tarea en diseno');
+    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
+    assert.match(stat, /01-en-diseno/);
+    assert.match(stat, /plan-final\.md/);
+    // Ni rastro de la carpeta vieja: el movimiento entro entero.
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('taskctl approve: commitea el tarea.md aprobado con el mensaje del repo', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '## Objetivo\nX.\n');
+    await mkdir(path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion'), {
+      recursive: true,
+    });
+    await writeFile(
+      path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion', 'plan-final.md'),
+      '# Plan redactado\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'docs(TASK-910): plan final');
+
+    const r = await runApproveCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(r.autoCommit.commiteado, true);
+    assert.deepEqual(r.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-910/tarea.md']);
+    assert.equal(git(['log', '--format=%s', '-1'], repoRoot).trim(), 'chore(TASK-910): plan aprobado');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('taskctl approve dos veces seguidas: la segunda no crea un commit vacio', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
+    await mkdir(path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion'), {
+      recursive: true,
+    });
+    await writeFile(
+      path.join(tareasRoot, '01-en-diseno', 'TASK-910', 'planificacion', 'plan-final.md'),
+      '# Plan\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'docs(TASK-910): plan final');
+
+    await runApproveCommand(tareasRoot, ['TASK-910'], '2026-09-07', { repoCwd: repoRoot });
+    const tras1 = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    const r2 = await runApproveCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(r2.autoCommit.commiteado, false);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), tras1);
+  });
+});
+
+// ─── start: EL test del item ───────────────────────────────────────────────
+
+test('taskctl start: commitea SOLO la tarea; el trabajo ajeno del arbol no entra y sigue sucio', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ estado: 'en-diseno', plan_aprobado: true }),
+      '## Objetivo\nProbar start.\n'
+    );
+    commitAll(repoRoot, 'chore(TASK-910): plan aprobado');
+    // create-feature.sh hace "git checkout -b": el hook dispara justo
+    // despues, con la tarea ya escrita y el commit todavia por hacer.
+    await hookQueEnsucia(repoRoot, 'post-checkout');
+
+    const r = await runStartCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(r.autoCommit.commiteado, true);
+    assert.equal(r.autoCommit.rama, 'feature/task-910-auto-commit');
+    assert.equal(
+      git(['log', '--format=%s', '-1'], repoRoot).trim(),
+      'chore(TASK-910): tarea en curso'
+    );
+    assert.match(git(['show', '--stat', '--format=', 'HEAD'], repoRoot), /02-en-curso/);
+    assertNoSeLlevaTrabajoAjeno(repoRoot);
+  });
+});
+
+// ─── review ────────────────────────────────────────────────────────────────
+
+test('taskctl review: commitea revision/ sin arrastrar el trabajo ajeno que dejo el merge', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ estado: 'en-curso', plan_aprobado: true });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar review.\n');
+    commitAll(repoRoot, 'feat(TASK-910): trabajo');
+
+    // develop avanza, para que el update de Git-Flow haga un merge de
+    // verdad (y dispare post-merge).
+    git(['checkout', '-q', 'develop'], repoRoot);
+    await writeFile(path.join(repoRoot, 'otro.txt'), 'algo\n', 'utf8');
+    commitAll(repoRoot, 'chore: avance en develop');
+    git(['checkout', '-q', task.rama], repoRoot);
+    await hookQueEnsucia(repoRoot, 'post-merge');
+
+    const r = await runReviewCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(r.autoCommit.commiteado, true);
+    assert.equal(
+      git(['log', '--format=%s', '-1'], repoRoot).trim(),
+      'chore(TASK-910): peticion de revision ronda 1'
+    );
+    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
+    assert.match(stat, /peticion-revision-1\.md/);
+    assert.match(stat, /informe-revision-1\.md/);
+    assertNoSeLlevaTrabajoAjeno(repoRoot);
+  });
+});
+
+// ─── finish ────────────────────────────────────────────────────────────────
+
+test('taskctl finish: commitea sobre DEVELOP la tarea y los tres artefactos de cierre', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ estado: 'en-revision', plan_aprobado: true });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
+    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1.md'),
+      '# Informe\n\n- Veredicto: aprobada (sin hallazgos)\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'feat(TASK-910): trabajo revisado');
+
+    const r = await runFinishCommand(tareasRoot, ['TASK-910'], '2026-09-07', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(r.autoCommit.commiteado, true);
+    // Fijado a proposito: finish termina y commitea en develop, no en
+    // la rama de la tarea (cuando escribe, el merge ya esta consumado).
+    assert.equal(r.autoCommit.rama, 'develop');
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    assert.equal(
+      git(['log', '--format=%s', '-1', 'develop'], repoRoot).trim(),
+      'chore(TASK-910): tarea terminada y artefactos de cierre'
+    );
+    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
+    for (const esperado of [/CHANGELOG\.md/, /INDEX\.md/, /BOARD\.md/, /04-terminadas/]) {
+      assert.match(stat, esperado);
+    }
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+// ─── el fallo de HALLAZGOS.md que esto cierra ──────────────────────────────
+
+test('taskctl import dos veces seguidas SIN commitear en medio: funciona (antes abortaba por workspace sucio)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // El fichero a importar vive FUERA del repo (CLAUDE.md: si no,
+    // ensucia el workspace y el guard de la 8.3 aborta el propio import).
+    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-c2-import-'));
+    try {
+      const lista1 = path.join(fuera, 'sprint-a.md');
+      const lista2 = path.join(fuera, 'sprint-b.md');
+      await writeFile(lista1, '### Primera tarea importada\n- Que funcione\n', 'utf8');
+      await writeFile(lista2, '### Segunda tarea importada\n- Que tambien funcione\n', 'utf8');
+
+      const r1 = await runImportCommand(tareasRoot, [lista1], '2026-09-07', { repoCwd: repoRoot });
+      assert.equal(r1.creadas.length, 1);
+      // El propio import ya ha commiteado lo que creo: el workspace
+      // queda limpio, que es la condicion que el segundo import
+      // necesita para no chocar con el guard de la 8.3.
+      assert.equal(r1.autoCommit.commiteado, true);
+      assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+
+      // La trampa que cierra este item (HALLAZGOS.md): antes de C2, el
+      // segundo import abortaba con BaseBranchGuardError por un
+      // workspace que habia ensuciado el PRIMER import. Ahora pasa sin
+      // tocar nada a mano. Si alguien rompe el auto-commit de import,
+      // esta llamada vuelve a lanzar y el test se cae.
+      const r2 = await runImportCommand(tareasRoot, [lista2], '2026-09-07', { repoCwd: repoRoot });
+      assert.equal(r2.creadas.length, 1);
+      assert.notEqual(r2.creadas[0]?.id, r1.creadas[0]?.id);
+      assert.equal(r2.autoCommit.commiteado, true);
+      // Dos commits distintos, uno por import: no se acumulan ni se
+      // pisan.
+      assert.notEqual(r1.autoCommit.commit, r2.autoCommit.commit);
+    } finally {
+      await rm(fuera, { recursive: true, force: true });
+    }
+  });
+});
+
+// ─── --push extremo a extremo ──────────────────────────────────────────────
+
+test('taskctl plan --push: con un origin bare real la rama llega; el flag va delante o detras del ID', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const bare = await mkdtemp(path.join(tmpdir(), 'taskctl-c2-origin-'));
+    try {
+      git(['init', '-q', '--bare', '-b', 'main', '.'], bare);
+      git(['remote', 'add', 'origin', bare], repoRoot);
+      git(['push', '-q', 'origin', 'develop'], repoRoot);
+
+      await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nX.\n');
+      commitAll(repoRoot, 'chore(TASK-910): tarea creada');
+
+      // --push DELANTE del ID: parseArgs se lo habria comido como valor
+      // del flag y el comando habria dicho "falta el ID".
+      const r = await runPlanCommand(tareasRoot, ['--push', 'TASK-910'], '2026-09-07', {
+        repoCwd: repoRoot,
+      });
+
+      assert.equal(r.id, 'TASK-910');
+      assert.equal(r.autoCommit.push, 'empujado');
+      assert.equal(
+        git(['log', '--format=%s', '-1', 'develop'], bare).trim(),
+        'chore(TASK-910): tarea en diseno'
+      );
+    } finally {
+      await rm(bare, { recursive: true, force: true });
+    }
+  });
+});
+
+test('taskctl plan --push sin remoto: avisa, no lanza y sale con la tarea commiteada en local', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), '');
+    commitAll(repoRoot, 'chore(TASK-910): tarea creada');
+
+    const r = await runPlanCommand(tareasRoot, ['TASK-910', '--push'], '2026-09-07', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(r.autoCommit.commiteado, true);
+    assert.equal(r.autoCommit.push, 'sin-remoto');
+    assert.equal(r.autoCommit.avisos.length, 1);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
index 3bbad71..59a955d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
@@ -50,8 +50,17 @@ function git(args: string[], cwd: string): string {
   return result.stdout;
 }
 
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que llamar a esto justo despues de un
+ * comando puede no tener ya nada que registrar: `git commit` sale 1
+ * con "nothing to commit" y el assert de `git()` lo daria por fallo
+ * del test. Se commitea solo si queda algo — y que no quede es
+ * exactamente la senal de que el auto-commit hizo su trabajo.
+ */
 function commitAll(repoRoot: string, message: string): void {
   git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
index f58ce7a..b8ebfcc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
@@ -136,9 +136,9 @@ test('runImportCommand: idempotente por titulo normalizado — reimportar el mis
 
     const r1 = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
     assert.equal(r1.creadas.length, 1);
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'import inicial'], repoRoot);
-
+    // Sin commit manual en medio desde TASK-030 (item C2): lo comitea
+    // el propio import. Era la razon original del item — la trampa de
+    // "import no se puede ejecutar dos veces seguidas" de HALLAZGOS.md.
     const r2 = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
     assert.equal(r2.creadas.length, 0);
     assert.equal(r2.omitidas.length, 1);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new.test.ts
index 2eb595f..3f9ed38 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/new.test.ts
@@ -155,25 +155,29 @@ test('runNewCommand: crea tareas/00-planificadas/TASK-001/tarea.md desde cero',
 
 test('runNewCommand: IDs consecutivos sin colision al crear varias tareas seguidas (misma rama base: develop)', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    // "new" no comitea por la persona (fuera de alcance de TASK-012):
-    // cada tarea.md creada queda sin commitear, asi que hay que
-    // comitearla antes de la siguiente llamada o ensureBaseBranchReady
-    // la rechaza por workspace sucio — igual que en uso real.
+    // Desde TASK-030 (item C2) "new" comitea lo que escribe, asi que
+    // tres llamadas seguidas funcionan SIN commit manual en medio.
+    // Antes habia aqui un "git add -A && git commit" entre llamadas,
+    // porque si no ensureBaseBranchReady rechazaba la segunda por
+    // workspace sucio — sucio por culpa de la primera. Que ya no haga
+    // falta es el item C2 funcionando; si alguien rompe el auto-commit,
+    // este test se cae.
     const r1 = await runNewCommand(
       tareasRoot, ['--titulo', 'Uno', '--tipo', 'feature'], '2026-09-03', { repoCwd: repoRoot }
     );
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'TASK-001'], repoRoot);
     const r2 = await runNewCommand(
       tareasRoot, ['--titulo', 'Dos', '--tipo', 'fix'], '2026-09-03', { repoCwd: repoRoot }
     );
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'TASK-002'], repoRoot);
     // release tambien resuelve a develop (igual que feature/fix).
     const r3 = await runNewCommand(
       tareasRoot, ['--titulo', 'Tres', '--tipo', 'release'], '2026-09-03', { repoCwd: repoRoot }
     );
     assert.deepEqual([r1.id, r2.id, r3.id], ['TASK-001', 'TASK-002', 'TASK-003']);
+    // Y el workspace queda limpio, no con tres tarea.md sueltos.
+    assert.equal(
+      spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim(),
+      ''
+    );
   });
 });
 
@@ -182,8 +186,7 @@ test('runNewCommand: hallazgo real (no corregido, fuera de alcance de TASK-012)
     const r1 = await runNewCommand(
       tareasRoot, ['--titulo', 'Uno', '--tipo', 'feature'], '2026-09-03', { repoCwd: repoRoot }
     );
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'TASK-001'], repoRoot);
+    // Sin commit manual desde TASK-030: lo comitea "new" (item C2).
     assert.equal(r1.id, 'TASK-001');
 
     // Un hotfix resuelve la rama base a "main" (seccion 8.3). En este
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 2dee378..0a39445 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -61,8 +61,17 @@ function branchNow(cwd: string): string {
  * que los tests la commitean aqui para dejar el workspace limpio antes
  * de invocar runPlanCommand — mismo patron que start.test.ts.
  */
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que llamar a esto justo despues de un
+ * comando puede no tener ya nada que registrar: `git commit` sale 1
+ * con "nothing to commit" y el assert de `git()` lo daria por fallo
+ * del test. Se commitea solo si queda algo — y que no quede es
+ * exactamente la senal de que el auto-commit hizo su trabajo.
+ */
 function commitAll(repoRoot: string, message: string): void {
   git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
index c81b263..0257838 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -50,8 +50,17 @@ function git(args: string[], cwd: string): string {
   return result.stdout;
 }
 
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que llamar a esto justo despues de un
+ * comando puede no tener ya nada que registrar: `git commit` sale 1
+ * con "nothing to commit" y el assert de `git()` lo daria por fallo
+ * del test. Se commitea solo si queda algo — y que no quede es
+ * exactamente la senal de que el auto-commit hizo su trabajo.
+ */
 function commitAll(repoRoot: string, message: string): void {
   git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
@@ -133,8 +142,17 @@ test('taskctl review: camino feliz sin origin — update real, evidencia de merg
     assert.doesNotMatch(peticion, /cambio-develop\.txt/);
     assert.match(peticion, /trabajo\.txt/);
     assert.ok(peticion.includes(result.commitRevisado));
-    const headSha = git(['rev-parse', 'HEAD'], repoRoot).trim();
-    assert.equal(result.commitRevisado, headSha);
+    // Desde TASK-030 (item C2), "review" commitea la peticion y el
+    // scaffold del informe, asi que HEAD avanza DESPUES de calcular
+    // commitRevisado: el commit revisado es el padre de HEAD, no HEAD.
+    // Y es lo correcto, no un efecto colateral: lo que el revisor tiene
+    // que revisar es el codigo de la tarea, no el commit que contiene
+    // la peticion de revision de si mismo.
+    assert.equal(result.commitRevisado, git(['rev-parse', 'HEAD~1'], repoRoot).trim());
+    assert.equal(
+      git(['log', '--format=%s', '-1'], repoRoot).trim(),
+      'chore(TASK-600): peticion de revision ronda 1'
+    );
 
     const informe = await readFile(result.informePath, 'utf8');
     assert.match(informe, /Informe de revision — TASK-600 \(ronda 1\)/);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
index bed7154..efb9dd6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
@@ -62,8 +62,17 @@ function git(args: string[], cwd: string): void {
  * commitean aqui para dejar el workspace limpio antes de invocar
  * runStartCommand, igual que estaria en un uso real.
  */
+/**
+ * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
+ * lo que el mismo escribe, asi que llamar a esto justo despues de un
+ * comando puede no tener ya nada que registrar: `git commit` sale 1
+ * con "nothing to commit" y el assert de `git()` lo daria por fallo
+ * del test. Se commitea solo si queda algo — y que no quede es
+ * exactamente la senal de que el auto-commit hizo su trabajo.
+ */
 function commitAll(repoRoot: string, message: string): void {
   git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
   git(['commit', '-q', '-m', message], repoRoot);
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
new file mode 100644
index 0000000..7990d3e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
@@ -0,0 +1,548 @@
+/**
+ * Tests de `.taskcode/config.yml` (TASK-030, item C4).
+ *
+ * Contra repos Git REALES creados en tmp, nunca mocks: la pregunta que
+ * importa no es "resolverConfig sabe leer un fichero" sino "poner
+ * rama_base cambia de verdad a que rama va taskctl", y eso solo se
+ * puede responder con un repo de verdad. Mismo patron que
+ * test/fs/git.test.ts y test/commands/new.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import {
+  CONFIG_DEFAULTS,
+  CLAVES_CONFIG,
+  ConfigError,
+  parsearConfig,
+  resolverConfig,
+  rutaConfig,
+} from '../../src/core/config.js';
+import { parseFrontmatter, FrontmatterParseError } from '../../src/core/frontmatter.js';
+import { resolveBaseBranchForTipo } from '../../src/fs/git.js';
+import { tareasQueBloquean, mensajeWipExcedido } from '../../src/core/wip.js';
+import { runNewCommand, parseNewTaskArgs } from '../../src/commands/new.js';
+import { runImportCommand, parseImportArgs } from '../../src/commands/import.js';
+import type { Task, TareaUbicada } from '../../src/core/task.js';
+
+function git(args: string[], cwd: string): void {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+}
+
+/**
+ * Repo Git real con un commit inicial y la rama "develop" activa: el
+ * estado en el que los comandos esperan encontrarse.
+ */
+async function withTempRepo(
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-config-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
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
+ * Escribe `.taskcode/config.yml` Y LO COMITEA. Lo segundo no es
+ * decoracion: sin commitear, el workspace queda sucio y
+ * ensureBaseBranchReady aborta antes de mirar nada — igual que le
+ * pasaria a una persona.
+ */
+async function escribirConfig(repoRoot: string, contenido: string): Promise<void> {
+  await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+  await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), contenido, 'utf8');
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', 'config'], repoRoot);
+}
+
+const RUTA_FICTICIA = '/repo/.taskcode/config.yml';
+
+// ---------------------------------------------------------------------
+// 1. Sin fichero: comportamiento identico al de hoy
+// ---------------------------------------------------------------------
+
+test('resolverConfig: repo sin .taskcode/ devuelve los tres defaults', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const c = resolverConfig(repoRoot);
+    assert.equal(c.rama_base, 'develop');
+    assert.equal(c.agente_revisor_por_defecto, 'general-purpose');
+    assert.equal(c.limite_wip, 1);
+    assert.deepEqual(c, { ...CONFIG_DEFAULTS });
+  });
+});
+
+test('resolverConfig: .taskcode/ existe pero sin config.yml -> defaults, sin quejarse', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    assert.deepEqual(resolverConfig(repoRoot), { ...CONFIG_DEFAULTS });
+  });
+});
+
+test('resolverConfig: config.yml vacio -> defaults (es una forma legitima de decir "todo por defecto")', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await escribirConfig(repoRoot, '');
+    assert.deepEqual(resolverConfig(repoRoot), { ...CONFIG_DEFAULTS });
+  });
+});
+
+test('resolverConfig: config.yml con solo comentarios y lineas en blanco -> defaults', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await escribirConfig(repoRoot, '# configuracion de taskcode\n\n#   rama_base: otra\n\n');
+    assert.deepEqual(resolverConfig(repoRoot), { ...CONFIG_DEFAULTS });
+  });
+});
+
+test('resolveBaseBranchForTipo: sin fichero sigue devolviendo "develop" (no-breaking)', async () => {
+  await withTempRepo(async (repoRoot) => {
+    assert.equal(resolveBaseBranchForTipo('feature', repoRoot), 'develop');
+    assert.equal(resolveBaseBranchForTipo('fix', repoRoot), 'develop');
+    assert.equal(resolveBaseBranchForTipo('release', repoRoot), 'develop');
+  });
+});
+
+test('parseNewTaskArgs / parseImportArgs: sin config, el revisor por defecto sigue siendo general-purpose', () => {
+  const n = parseNewTaskArgs(['--titulo', 'x', '--tipo', 'feature']);
+  assert.equal(n.agenteRevisor, 'general-purpose');
+  const i = parseImportArgs(['fichero.md']);
+  assert.equal(i.agenteRevisor, 'general-purpose');
+});
+
+// ---------------------------------------------------------------------
+// 2. Con las tres claves: surten efecto de verdad
+// ---------------------------------------------------------------------
+
+test('resolverConfig: las tres claves puestas se leen las tres', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await escribirConfig(
+      repoRoot,
+      'rama_base: integration\nagente_revisor_por_defecto: revisor-de-la-casa\nlimite_wip: 3\n'
+    );
+    const c = resolverConfig(repoRoot);
+    assert.equal(c.rama_base, 'integration');
+    assert.equal(c.agente_revisor_por_defecto, 'revisor-de-la-casa');
+    assert.equal(c.limite_wip, 3);
+  });
+});
+
+test('rama_base: cambia la rama que resolveBaseBranchForTipo devuelve para feature/fix/release', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await escribirConfig(repoRoot, 'rama_base: integration\n');
+    assert.equal(resolveBaseBranchForTipo('feature', repoRoot), 'integration');
+    assert.equal(resolveBaseBranchForTipo('fix', repoRoot), 'integration');
+    assert.equal(resolveBaseBranchForTipo('release', repoRoot), 'integration');
+  });
+});
+
+test('rama_base: NO afecta a hotfix, que sigue colgando de la rama principal detectada', async () => {
+  // La decision #9 descarta `rama_principal` como clave porque
+  // resolveMainBranch ya detecta main/master sola. Si rama_base se
+  // colara en hotfix, esa deteccion quedaria anulada.
+  await withTempRepo(async (repoRoot) => {
+    await escribirConfig(repoRoot, 'rama_base: integration\n');
+    assert.equal(resolveBaseBranchForTipo('hotfix', repoRoot), 'main');
+  });
+});
+
+test('rama_base: taskctl new CAMBIA de verdad a la rama configurada, no solo la calcula', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    git(['branch', 'integration'], repoRoot);
+    await escribirConfig(repoRoot, 'rama_base: integration\n');
+    // Se arranca desde develop: con el default, "new" se habria
+    // quedado en develop sin cambiar de rama.
+    assert.equal(
+      spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
+        cwd: repoRoot,
+        encoding: 'utf8',
+      }).stdout.trim(),
+      'develop'
+    );
+    const result = await runNewCommand(
+      tareasRoot,
+      ['--titulo', 'Tarea sobre integration', '--tipo', 'feature'],
+      '2026-09-07',
+      { repoCwd: repoRoot }
+    );
+    assert.equal(result.baseBranchGuard.baseBranch, 'integration');
+    assert.equal(result.baseBranchGuard.switched, true);
+    assert.equal(result.baseBranchGuard.branchAntes, 'develop');
+    // Y la rama activa REAL del repo, no solo lo que dice el resultado.
+    assert.equal(
+      spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
+        cwd: repoRoot,
+        encoding: 'utf8',
+      }).stdout.trim(),
+      'integration'
+    );
+  });
+});
+
+test('agente_revisor_por_defecto: taskctl new lo escribe en el tarea.md', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await escribirConfig(repoRoot, 'agente_revisor_por_defecto: revisor-de-la-casa\n');
+    const result = await runNewCommand(
+      tareasRoot,
+      ['--titulo', 'Con revisor configurado', '--tipo', 'feature'],
+      '2026-09-07',
+      { repoCwd: repoRoot }
+    );
+    const contenido = await readFile(result.filePath, 'utf8');
+    assert.match(contenido, /agente_revisor: revisor-de-la-casa/);
+    assert.doesNotMatch(contenido, /general-purpose/);
+  });
+});
+
+test('agente_revisor_por_defecto: --agente-revisor sigue mandando sobre el config', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await escribirConfig(repoRoot, 'agente_revisor_por_defecto: revisor-de-la-casa\n');
+    const result = await runNewCommand(
+      tareasRoot,
+      ['--titulo', 'Con flag', '--tipo', 'feature', '--agente-revisor', 'otro-revisor'],
+      '2026-09-07',
+      { repoCwd: repoRoot }
+    );
+    const contenido = await readFile(result.filePath, 'utf8');
+    assert.match(contenido, /agente_revisor: otro-revisor/);
+  });
+});
+
+test('agente_revisor_por_defecto: taskctl import usa el MISMO valor que new (la duplicacion desaparecio)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await escribirConfig(repoRoot, 'agente_revisor_por_defecto: revisor-de-la-casa\n');
+    // El fichero a importar vive FUERA del repo: si no, ensucia el
+    // workspace y el guard de la 8.3 aborta el propio import.
+    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-import-src-'));
+    try {
+      const md = path.join(fuera, 'lote.md');
+      await writeFile(md, '### Una tarea importada\n- un criterio\n', 'utf8');
+      const result = await runImportCommand(tareasRoot, [md], '2026-09-07', {
+        repoCwd: repoRoot,
+      });
+      assert.equal(result.creadas.length, 1, JSON.stringify(result.errores));
+      const contenido = await readFile((result.creadas[0] as { filePath: string }).filePath, 'utf8');
+      assert.match(contenido, /agente_revisor: revisor-de-la-casa/);
+    } finally {
+      await rm(fuera, { recursive: true, force: true });
+    }
+  });
+});
+
+test('limite_wip: con limite 3, dos tareas abiertas ya no bloquean; con 1, si', () => {
+  const base: Task = {
+    id: 'TASK-900',
+    titulo: 'x',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-curso',
+    plan_aprobado: true,
+    rama: 'feature/task-900-x',
+    asignado_a: 'carlos',
+    skills_recomendados: [],
+    agente_revisor: 'general-purpose',
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-07',
+    actualizado: '2026-09-07',
+    dependencias: [],
+  };
+  const ubicada = (id: string): TareaUbicada => ({
+    task: { ...base, id },
+    estadoCarpeta: 'en-curso',
+  });
+  const abiertas = [ubicada('TASK-901'), ubicada('TASK-902')];
+
+  // Comportamiento de hoy (limite implicito 1): bloquean.
+  assert.equal(tareasQueBloquean(abiertas, 'carlos', 'TASK-900').length, 2);
+  assert.equal(tareasQueBloquean(abiertas, 'carlos', 'TASK-900', 1).length, 2);
+  // Con limite 3 todavia cabe una mas: no bloquean.
+  assert.deepEqual(tareasQueBloquean(abiertas, 'carlos', 'TASK-900', 3), []);
+  // Con limite 2 ya esta el cupo lleno.
+  assert.equal(tareasQueBloquean(abiertas, 'carlos', 'TASK-900', 2).length, 2);
+});
+
+test('limite_wip: el mensaje de error dice el limite real, no "una sola tarea"', () => {
+  const t: TareaUbicada = {
+    task: {
+      id: 'TASK-901',
+      titulo: 'x',
+      tipo: 'feature',
+      sprint: 1,
+      etiquetas: [],
+      complejidad: 'simple',
+      modelo_sugerido: 'sonnet',
+      estado: 'en-curso',
+      plan_aprobado: true,
+      rama: 'feature/task-901-x',
+      asignado_a: 'carlos',
+      skills_recomendados: [],
+      agente_revisor: 'general-purpose',
+      ultimo_commit_revisado: null,
+      revision_codex: false,
+      creado: '2026-09-07',
+      actualizado: '2026-09-07',
+      dependencias: [],
+    },
+    estadoCarpeta: 'en-curso',
+  };
+  const conDefecto = mensajeWipExcedido('TASK-900', 'carlos', [t]);
+  assert.ok(conDefecto.includes('Una sola tarea en curso por persona'), conDefecto);
+
+  const conTres = mensajeWipExcedido('TASK-900', 'carlos', [t], 3);
+  assert.ok(conTres.includes('El limite es de 3 tareas'), conTres);
+  assert.ok(conTres.includes('limite_wip'), conTres);
+  assert.ok(!conTres.includes('Una sola tarea en curso por persona'), conTres);
+});
+
+// ---------------------------------------------------------------------
+// 3. Fallo cerrado: cada forma de invalidez aborta
+// ---------------------------------------------------------------------
+
+test('invalido: limite_wip: dos (texto) aborta y dice que espera un entero', () => {
+  assert.throws(
+    () => parsearConfig('limite_wip: dos\n', RUTA_FICTICIA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.match(e.message, /limite_wip/);
+      assert.match(e.message, /entero/);
+      assert.match(e.message, /el texto "dos"/);
+      return true;
+    }
+  );
+});
+
+test('invalido: limite_wip: 0 y limite_wip: -1 abortan (0 no significa "sin limite")', () => {
+  for (const valor of ['0', '-1']) {
+    assert.throws(
+      () => parsearConfig(`limite_wip: ${valor}\n`, RUTA_FICTICIA),
+      (e: unknown) => {
+        assert.ok(e instanceof ConfigError, String(e));
+        assert.match(e.message, /mayor o igual que 1/);
+        return true;
+      },
+      `limite_wip: ${valor} deberia abortar`
+    );
+  }
+});
+
+test('invalido: limite_wip decimal o booleano tambien abortan', () => {
+  assert.throws(() => parsearConfig('limite_wip: 1.5\n', RUTA_FICTICIA), ConfigError);
+  assert.throws(() => parsearConfig('limite_wip: true\n', RUTA_FICTICIA), ConfigError);
+});
+
+test('invalido: rama_base vacia, en comillas o sin valor, aborta', () => {
+  for (const linea of ['rama_base: ""', 'rama_base:', 'rama_base: "   "']) {
+    assert.throws(
+      () => parsearConfig(`${linea}\n`, RUTA_FICTICIA),
+      (e: unknown) => {
+        assert.ok(e instanceof ConfigError, String(e));
+        assert.match(e.message, /no puede estar vacia/);
+        assert.match(e.message, /develop/); // dice cual es el default
+        return true;
+      },
+      `"${linea}" deberia abortar`
+    );
+  }
+});
+
+test('invalido: agente_revisor_por_defecto vacio aborta igual que rama_base', () => {
+  assert.throws(
+    () => parsearConfig('agente_revisor_por_defecto: ""\n', RUTA_FICTICIA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.match(e.message, /general-purpose/);
+      return true;
+    }
+  );
+});
+
+test('invalido: clave desconocida aborta, sugiere la parecida y enumera las validas', () => {
+  assert.throws(
+    () => parsearConfig('limite_wp: 2\n', RUTA_FICTICIA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.match(e.message, /clave desconocida "limite_wp"/);
+      assert.match(e.message, /Quiza quisiste decir "limite_wip"/);
+      for (const clave of CLAVES_CONFIG) {
+        assert.ok(e.message.includes(clave), `falta "${clave}" en: ${e.message}`);
+      }
+      return true;
+    }
+  );
+});
+
+test('invalido: una clave descartada por la decision #9 tambien es desconocida', () => {
+  // `remoto`, `rama_principal` y `politica_no_borrar_ramas` NO se
+  // declaran. Escribirlas tiene que fallar, no ignorarse: una clave
+  // que el usuario escribe y el plugin no lee es peor que no tenerla.
+  for (const clave of ['remoto', 'rama_principal', 'politica_no_borrar_ramas']) {
+    assert.throws(
+      () => parsearConfig(`${clave}: x\n`, RUTA_FICTICIA),
+      ConfigError,
+      `"${clave}" deberia ser rechazada`
+    );
+  }
+});
+
+test('invalido: la misma clave dos veces aborta en vez de que gane la ultima en silencio', () => {
+  assert.throws(
+    () => parsearConfig('limite_wip: 1\nlimite_wip: 5\n', RUTA_FICTICIA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.match(e.message, /repetida/);
+      return true;
+    }
+  );
+});
+
+test('invalido: linea sin ":" aborta hablando de CONFIG, no de frontmatter', () => {
+  assert.throws(
+    () => parsearConfig('rama_base develop\n', RUTA_FICTICIA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.match(e.message, /Linea de config invalida/);
+      assert.ok(!e.message.includes('frontmatter'), e.message);
+      return true;
+    }
+  );
+});
+
+test('el mensaje de error nombra el fichero y la linea', () => {
+  assert.throws(
+    () => parsearConfig('# cabecera\n\nlimite_wip: 0\n', RUTA_FICTICIA),
+    (e: unknown) => {
+      assert.ok(e instanceof ConfigError, String(e));
+      assert.ok(e.message.includes(`${RUTA_FICTICIA}:3`), e.message);
+      return true;
+    }
+  );
+});
+
+// ---------------------------------------------------------------------
+// 4. La invalidez llega hasta arriba: no hay caida al default
+// ---------------------------------------------------------------------
+
+test('fallo cerrado real: resolveBaseBranchForTipo NO cae a "develop" con un config roto', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await escribirConfig(repoRoot, 'limite_wip: dos\n');
+    assert.throws(() => resolveBaseBranchForTipo('feature', repoRoot), ConfigError);
+  });
+});
+
+test('fallo cerrado real: taskctl new aborta con un config roto y NO crea la tarea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await escribirConfig(repoRoot, 'limite_wp: 2\n');
+    await assert.rejects(
+      runNewCommand(tareasRoot, ['--titulo', 'x', '--tipo', 'feature'], '2026-09-07', {
+        repoCwd: repoRoot,
+      }),
+      ConfigError
+    );
+    assert.equal(existsSync(tareasRoot), false, 'no deberia haber creado tareas/');
+  });
+});
+
+test('fallo cerrado real: taskctl import aborta con un config roto', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await escribirConfig(repoRoot, 'rama_base: ""\n');
+    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-import-src-'));
+    try {
+      const md = path.join(fuera, 'lote.md');
+      await writeFile(md, '### Una tarea\n- un criterio\n', 'utf8');
+      await assert.rejects(
+        runImportCommand(tareasRoot, [md], '2026-09-07', { repoCwd: repoRoot }),
+        ConfigError
+      );
+      assert.equal(existsSync(tareasRoot), false, 'no deberia haber creado tareas/');
+    } finally {
+      await rm(fuera, { recursive: true, force: true });
+    }
+  });
+});
+
+// ---------------------------------------------------------------------
+// 5. Sintaxis compartida con frontmatter
+// ---------------------------------------------------------------------
+
+test('sintaxis: comentario inline tras el valor se descarta', () => {
+  const c = parsearConfig('rama_base: integration  # la de este equipo\nlimite_wip: 2 # dos\n', RUTA_FICTICIA);
+  assert.equal(c.rama_base, 'integration');
+  assert.equal(c.limite_wip, 2);
+});
+
+test('sintaxis: valores entrecomillados y con espacios de sobra se recortan', () => {
+  const c = parsearConfig('rama_base: "  integration  "\n', RUTA_FICTICIA);
+  assert.equal(c.rama_base, 'integration');
+});
+
+test('sintaxis: CRLF no rompe el parseo', () => {
+  const c = parsearConfig('rama_base: integration\r\nlimite_wip: 2\r\n', RUTA_FICTICIA);
+  assert.equal(c.rama_base, 'integration');
+  assert.equal(c.limite_wip, 2);
+});
+
+test('el parser compartido NO cambio el comportamiento del frontmatter', () => {
+  // parseBloqueClaveValor admite comentarios de linea solo si se le
+  // pide. parseFrontmatter no se lo pide, asi que un tarea.md con una
+  // linea "#" sigue siendo un error, como antes de C4.
+  assert.throws(
+    () => parseFrontmatter('---\n# comentario\nid: TASK-001\n---\n'),
+    FrontmatterParseError
+  );
+  // Y lo que si funcionaba sigue funcionando.
+  const { data, body } = parseFrontmatter('---\nid: TASK-001\ntipo: feature  # inline\n---\ncuerpo\n');
+  assert.equal(data.id, 'TASK-001');
+  assert.equal(data.tipo, 'feature');
+  assert.equal(body, 'cuerpo\n');
+});
+
+// ---------------------------------------------------------------------
+// 6. Donde se busca el fichero
+// ---------------------------------------------------------------------
+
+test('ubicacion: se busca en la RAIZ del repo, tambien ejecutando desde un subdirectorio', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await escribirConfig(repoRoot, 'limite_wip: 4\n');
+    const sub = path.join(repoRoot, 'docs', 'contexto');
+    await mkdir(sub, { recursive: true });
+    assert.equal(rutaConfig(sub), path.join(repoRoot, '.taskcode', 'config.yml'));
+    assert.equal(resolverConfig(sub).limite_wip, 4);
+    // Y la rama base tambien, que es lo que de verdad se usa.
+    assert.equal(resolveBaseBranchForTipo('feature', sub), 'develop');
+  });
+});
+
+test('ubicacion: la busqueda PARA en la raiz del repo (un config de mas arriba no manda)', async () => {
+  // Sin este corte, un .taskcode/config.yml olvidado en el home
+  // configuraria en silencio todos los repos de la maquina.
+  const contenedor = await mkdtemp(path.join(tmpdir(), 'taskctl-contenedor-'));
+  try {
+    await mkdir(path.join(contenedor, '.taskcode'), { recursive: true });
+    await writeFile(
+      path.join(contenedor, '.taskcode', 'config.yml'),
+      'limite_wip: 99\n',
+      'utf8'
+    );
+    const repoRoot = path.join(contenedor, 'repo');
+    await mkdir(repoRoot, { recursive: true });
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    assert.equal(resolverConfig(repoRoot).limite_wip, 1);
+  } finally {
+    await rm(contenedor, { recursive: true, force: true });
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-commit.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-commit.test.ts
new file mode 100644
index 0000000..d69c7f4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-commit.test.ts
@@ -0,0 +1,347 @@
+/**
+ * Test de integracion real (no mocks) del auto-commit de taskctl
+ * (TASK-030, item C2): repos Git temporales de verdad, incluido un
+ * `origin` bare real para el `--push`, y la evidencia leida de Git
+ * (`git show --stat`, `git status --porcelain`, `git log` del remoto)
+ * en vez de fiarse de lo que devuelve la funcion.
+ *
+ * El test que manda es "no se lleva por delante el trabajo de la
+ * persona": es la regla 1 del item y la razon de que exista este
+ * modulo en vez de un `git add -A`.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, rename, chmod } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import {
+  autoCommit,
+  AutoCommitError,
+  extraerPushFlag,
+  mensajeChore,
+} from '../../src/fs/git-commit.js';
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+/** Sin assert de exito: para comprobar estados que Git reporta con exit != 0. */
+function gitRaw(args: string[], cwd: string): { status: number | null; stdout: string } {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  return { status: r.status, stdout: r.stdout ?? '' };
+}
+
+async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-autocommit-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await mkdir(path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900'), { recursive: true });
+    await writeFile(
+      path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900', 'tarea.md'),
+      'tarea inicial\n',
+      'utf8'
+    );
+    await mkdir(path.join(repoRoot, 'src'), { recursive: true });
+    await writeFile(path.join(repoRoot, 'src', 'algo.ts'), 'export const x = 1;\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+// ─── Regla 1: solo lo que taskctl acaba de escribir ────────────────────────
+
+test('autoCommit NO se lleva el trabajo de la persona: su fichero sucio no entra en el commit y sigue sucio', async () => {
+  await withTempRepo(async (repoRoot) => {
+    // "La persona" tiene trabajo a medias en el arbol, ajeno a taskctl.
+    const suyo = path.join(repoRoot, 'src', 'algo.ts');
+    await writeFile(suyo, 'export const x = 1;\n// trabajo a medias de la persona\n', 'utf8');
+    // Y ademas un fichero nuevo, sin seguimiento.
+    await writeFile(path.join(repoRoot, 'src', 'borrador.ts'), 'borrador\n', 'utf8');
+
+    // taskctl escribe lo suyo.
+    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+    await writeFile(path.join(tareaDir, 'tarea.md'), 'tarea modificada por taskctl\n', 'utf8');
+
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [tareaDir],
+      mensaje: mensajeChore('TASK-900', 'tarea en diseno'),
+    });
+
+    assert.equal(r.commiteado, true);
+    assert.deepEqual(r.ficheros, ['tareas/00-planificadas/TASK-900/tarea.md']);
+
+    // Evidencia 1: el commit contiene EXACTAMENTE el fichero de taskctl.
+    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
+    assert.match(stat, /tareas[/\\]00-planificadas[/\\]TASK-900[/\\]tarea\.md/);
+    assert.doesNotMatch(stat, /algo\.ts/);
+    assert.doesNotMatch(stat, /borrador\.ts/);
+
+    // Evidencia 2: el trabajo de la persona sigue exactamente donde estaba.
+    const status = git(['status', '--porcelain'], repoRoot);
+    assert.match(status, /^ M src\/algo\.ts$/m);
+    assert.match(status, /^\?\? src\/borrador\.ts$/m);
+    assert.doesNotMatch(status, /tareas\//);
+  });
+});
+
+test('autoCommit respeta lo que la persona ya tenia PREPARADO con git add (modo --only)', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const suyo = path.join(repoRoot, 'src', 'algo.ts');
+    await writeFile(suyo, 'export const x = 2;\n', 'utf8');
+    git(['add', 'src/algo.ts'], repoRoot); // la persona ya lo tenia en el indice
+    await writeFile(suyo, 'export const x = 3;\n', 'utf8'); // y siguio editando
+
+    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+    await writeFile(path.join(tareaDir, 'tarea.md'), 'tocado por taskctl\n', 'utf8');
+
+    autoCommit({ cwd: repoRoot, rutas: [tareaDir], mensaje: 'chore(TASK-900): prueba' });
+
+    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
+    assert.doesNotMatch(stat, /algo\.ts/);
+    // Sigue preparado Y modificado despues: "MM", igual que antes del commit.
+    assert.match(git(['status', '--porcelain'], repoRoot), /^MM src\/algo\.ts$/m);
+  });
+});
+
+test('autoCommit registra el MOVIMIENTO de carpeta (origen borrado + destino) en un solo commit', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const origen = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+    const destino = path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-900');
+    await mkdir(path.dirname(destino), { recursive: true });
+    await rename(origen, destino);
+
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [origen, destino],
+      mensaje: mensajeChore('TASK-900', 'tarea en diseno'),
+    });
+
+    assert.equal(r.commiteado, true);
+    // Nada queda pendiente bajo tareas/: el borrado del origen entro tambien.
+    assert.doesNotMatch(git(['status', '--porcelain'], repoRoot), /tareas\//);
+    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
+    assert.match(stat, /01-en-diseno/);
+  });
+});
+
+// ─── Regla 2: nada que commitear, ningun commit ────────────────────────────
+
+test('autoCommit no crea commits vacios cuando el fichero ya estaba identico', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+
+    const r = autoCommit({ cwd: repoRoot, rutas: [tareaDir], mensaje: 'chore(TASK-900): nada' });
+
+    assert.equal(r.commiteado, false);
+    assert.equal(r.commit, null);
+    assert.deepEqual(r.ficheros, []);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), antes);
+  });
+});
+
+test('autoCommit ignora rutas que no existen ni en disco ni en el indice (carpeta de origen no versionada)', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const inexistente = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-999');
+    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+    await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio\n', 'utf8');
+
+    // Sin el filtro, "git add -- tareas/00-planificadas/TASK-999" muere
+    // con "fatal: pathspec ... did not match any files" (exit 128).
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [inexistente, tareaDir],
+      mensaje: 'chore(TASK-900): prueba',
+    });
+    assert.equal(r.commiteado, true);
+  });
+});
+
+// ─── Regla 3: si el commit falla, se falla ruidosamente ────────────────────
+
+test('autoCommit falla RUIDOSAMENTE si un hook de pre-commit rechaza, diciendo que esta escrito pero no registrado', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const hook = path.join(repoRoot, '.git', 'hooks', 'pre-commit');
+    await writeFile(hook, '#!/bin/sh\necho "el hook dice que no" >&2\nexit 1\n', 'utf8');
+    await chmod(hook, 0o755);
+
+    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+    await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio\n', 'utf8');
+    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
+
+    await assert.rejects(
+      async () =>
+        autoCommit({ cwd: repoRoot, rutas: [tareaDir], mensaje: 'chore(TASK-900): con hook' }),
+      (e: unknown) => {
+        assert.ok(e instanceof AutoCommitError, `no es AutoCommitError: ${String(e)}`);
+        assert.match(e.message, /escrita pero no registrada/);
+        assert.match(e.message, /el hook dice que no/);
+        return true;
+      }
+    );
+    // Nada se ha commiteado, y los cambios siguen ahi (preparados).
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), antes);
+    assert.match(git(['status', '--porcelain'], repoRoot), /^M {2}tareas\//m);
+  });
+});
+
+// ─── Guard contra el "git add -A" encubierto ───────────────────────────────
+
+test('autoCommit rechaza la raiz del repo y cualquier ruta de fuera (no hay git add -A por la puerta de atras)', async () => {
+  await withTempRepo(async (repoRoot) => {
+    for (const ruta of [repoRoot, path.join(repoRoot, '.'), path.join(repoRoot, '..')]) {
+      assert.throws(
+        () => autoCommit({ cwd: repoRoot, rutas: [ruta], mensaje: 'chore(x): y' }),
+        AutoCommitError,
+        `deberia rechazar "${ruta}"`
+      );
+    }
+  });
+});
+
+// ─── Regla 4: --push ───────────────────────────────────────────────────────
+
+test('autoCommit --push: con un origin bare real, la rama llega al remoto', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const bare = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-'));
+    try {
+      git(['init', '-q', '--bare', '-b', 'main', '.'], bare);
+      git(['remote', 'add', 'origin', bare], repoRoot);
+
+      const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+      await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio para subir\n', 'utf8');
+
+      const r = autoCommit({
+        cwd: repoRoot,
+        rutas: [tareaDir],
+        mensaje: mensajeChore('TASK-900', 'tarea en diseno'),
+        push: true,
+      });
+
+      assert.equal(r.commiteado, true);
+      assert.equal(r.push, 'empujado');
+      assert.deepEqual(r.avisos, []);
+      // Evidencia en el REMOTO, no en el resultado del comando.
+      const enRemoto = git(['log', '--format=%s', '-1', 'develop'], bare).trim();
+      assert.equal(enRemoto, 'chore(TASK-900): tarea en diseno');
+    } finally {
+      await rm(bare, { recursive: true, force: true });
+    }
+  });
+});
+
+test('autoCommit --push sin remoto: avisa y sigue (no lanza), y el commit local se hace igual', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+    await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio local\n', 'utf8');
+
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [tareaDir],
+      mensaje: 'chore(TASK-900): sin remoto',
+      push: true,
+    });
+
+    assert.equal(r.commiteado, true);
+    assert.equal(r.push, 'sin-remoto');
+    assert.equal(r.avisos.length, 1);
+    assert.match(r.avisos[0] as string, /no hay conexion con origin/i);
+    assert.equal(git(['log', '--format=%s', '-1'], repoRoot).trim(), 'chore(TASK-900): sin remoto');
+  });
+});
+
+test('autoCommit --push con HEAD desacoplado: avisa y no intenta subir nada', async () => {
+  await withTempRepo(async (repoRoot) => {
+    git(['checkout', '-q', '--detach', 'HEAD'], repoRoot);
+    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+    await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio en detached\n', 'utf8');
+
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [tareaDir],
+      mensaje: 'chore(TASK-900): detached',
+      push: true,
+    });
+
+    assert.equal(r.push, 'sin-rama');
+    assert.match(r.avisos[0] as string, /HEAD esta desacoplado/);
+  });
+});
+
+test('autoCommit --push que falla de verdad: lanza diciendo que el commit SI se creo', async () => {
+  await withTempRepo(async (repoRoot) => {
+    // origin existe y responde a ls-remote, pero rechaza el push por
+    // no ser fast-forward: el bare tiene un develop distinto.
+    const bare = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-'));
+    const otro = await mkdtemp(path.join(tmpdir(), 'taskctl-otro-'));
+    try {
+      git(['init', '-q', '--bare', '-b', 'main', '.'], bare);
+      git(['clone', '-q', bare, '.'], otro);
+      git(['config', 'user.email', 'o@e.com'], otro);
+      git(['config', 'user.name', 'Otro'], otro);
+      await writeFile(path.join(otro, 'a.txt'), 'a\n', 'utf8');
+      git(['add', '-A'], otro);
+      git(['commit', '-q', '-m', 'ajeno'], otro);
+      git(['push', '-q', 'origin', 'HEAD:develop'], otro);
+
+      git(['remote', 'add', 'origin', bare], repoRoot);
+      const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
+      await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio\n', 'utf8');
+
+      await assert.rejects(
+        async () =>
+          autoCommit({
+            cwd: repoRoot,
+            rutas: [tareaDir],
+            mensaje: 'chore(TASK-900): push rechazado',
+            push: true,
+          }),
+        (e: unknown) => {
+          assert.ok(e instanceof AutoCommitError);
+          assert.match(e.message, /quedo commiteado/);
+          assert.match(e.message, /git push origin develop/);
+          return true;
+        }
+      );
+      // El commit local existe: el mensaje no miente.
+      assert.equal(
+        git(['log', '--format=%s', '-1'], repoRoot).trim(),
+        'chore(TASK-900): push rechazado'
+      );
+      assert.equal(gitRaw(['diff', '--cached', '--quiet'], repoRoot).status, 0);
+    } finally {
+      await rm(otro, { recursive: true, force: true });
+      await rm(bare, { recursive: true, force: true });
+    }
+  });
+});
+
+// ─── Mensajes y flags ──────────────────────────────────────────────────────
+
+test('mensajeChore: formato del repo y rechazo de tildes (los scripts de Git-Flow los procesan)', () => {
+  assert.equal(mensajeChore('TASK-030', 'tarea en curso'), 'chore(TASK-030): tarea en curso');
+  assert.throws(() => mensajeChore('TASK-030', 'peticón de revisión'), AutoCommitError);
+  assert.throws(() => mensajeChore('TASK-030', ''), AutoCommitError);
+});
+
+test('extraerPushFlag: saca --push y -p sin comerse el ID (parseArgs lo tomaria por valor del flag)', () => {
+  assert.deepEqual(extraerPushFlag(['--push', 'TASK-030']), {
+    push: true,
+    resto: ['TASK-030'],
+  });
+  assert.deepEqual(extraerPushFlag(['TASK-030', '-p']), { push: true, resto: ['TASK-030'] });
+  assert.deepEqual(extraerPushFlag(['TASK-030', '--asignado-a', 'ana']), {
+    push: false,
+    resto: ['TASK-030', '--asignado-a', 'ana'],
+  });
+});
````
