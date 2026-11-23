# Peticion de revision — TASK-149b (ronda 1)

- Tarea: TASK-149b — errores y flags del CLI (parte b de TASK-149)
- Rama revisada: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
- Rama base: develop
- Commit revisado (HEAD): d85d2ab46005ae66a9cccee7d13c5b803734921b
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-149b (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-149b/tarea.md
- tareas/03-en-revision/TASK-149b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-tareas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-commit.test.ts

## Commits a revisar (git log develop..HEAD)

````
d85d2ab chore(TASK-149b): autorrevision
424a988 fix(TASK-149b): errores comunes del CLI en main, printAutoCommit unico y extraerPushFlag en cli
832c6a7 chore(TASK-149b): tarea en curso
814918f merge(TASK-149b): develop en fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 866b6e7..2cbe3c3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -253,19 +253,17 @@ function printBaseBranchSwitchNotice(guard: BaseBranchGuardResult): void {
  * tiene que hacer algo. Los avisos (sin origin, HEAD desacoplado) van
  * por stderr, como el resto de avisos del CLI.
  */
-function printAutoCommit(r: AutoCommitResult): void {
+function printAutoCommit(r: AutoCommitResult, escribir: (t: string) => void = (t) => void process.stdout.write(t)): void {
   printAvisos(...r.avisos);
   if (sincronizacionNoAplicada(r.sincronizacion)) sincronizacionPendiente = true;
   if (r.commiteado) {
     const n = r.ficheros.length;
-    process.stdout.write(
-      `Commiteado ${r.commit} en "${r.rama}" (${n} fichero${n === 1 ? '' : 's'}).\n`
-    );
+    escribir(`Commiteado ${r.commit} en "${r.rama}" (${n} fichero${n === 1 ? '' : 's'}).\n`);
   } else {
-    process.stdout.write('Sin cambios que commitear (nada nuevo en disco).\n');
+    escribir('Sin cambios que commitear (nada nuevo en disco).\n');
   }
   if (r.push === 'empujado') {
-    process.stdout.write(`Push completado: ${r.rama} -> origin/${r.rama}.\n`);
+    escribir(`Push completado: ${r.rama} -> origin/${r.rama}.\n`);
   }
 }
 
@@ -439,10 +437,35 @@ export async function main(argv: readonly string[]): Promise<number> {
   // el suyo al comando de verificacion y a nadie mas (scripts de Git-Flow,
   // held-out, tests que lanzan otros taskctl...).
   delete process.env[VARIABLE_PROGRESO];
-  const codigo = await mainComando(argv);
+  let codigo: number;
+  try {
+    codigo = await mainComando(argv);
+  } catch (e) {
+    // TASK-149b (FS-03): los errores comunes se traducen igual en todos los
+    // comandos; cada catch de comando conserva solo los suyos. Sin esto, un
+    // GitCommandError en new, plan, approve... salia como «taskctl no pudo arrancar».
+    if (ERRORES_COMUNES_CLI.some((C) => e instanceof C)) {
+      printCliError(e as Error);
+      return 1;
+    }
+    throw e;
+  }
   return codigo === 0 && sincronizacionPendiente ? CODIGO_SINCRONIZACION_NO_APLICADA : codigo;
 }
 
+/** TASK-149b (FS-03): errores que cualquier comando puede lanzar y que el CLI traduce a «[ERROR] ...» con codigo 1. */
+const ERRORES_COMUNES_CLI: readonly (abstract new (...args: never[]) => Error)[] = [
+  AutoCommitError,
+  ConfigError,
+  GitLaunchError,
+  GitCommandError,
+  GitflowScriptLaunchError,
+  BaseBranchGuardError,
+  TaskIdError,
+  StateMachineError,
+  TaskFolderConflictError,
+];
+
 async function mainComando(argvEntrada: readonly string[]): Promise<number> {
   let argv = argvEntrada;
   const cmd = argv[0];
@@ -466,7 +489,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       resto = extraida.resto;
       await verificarCadena(process.cwd(), extraida.testigo);
     } catch (e) {
-      if (e instanceof CadenaCommandError || e instanceof GitLaunchError || e instanceof GitCommandError) {
+      if (e instanceof CadenaCommandError) {
         printCliError(e);
         return 1;
       }
@@ -504,13 +527,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof NewTaskArgError ||
-        e instanceof TaskIdError ||
-        e instanceof BaseBranchGuardError
-      ) {
+      if (e instanceof NewTaskArgError) {
         printCliError(e);
         return 1;
       }
@@ -549,13 +566,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommit(result.autoCommit);
       return result.errores.length > 0 ? 1 : 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof ImportCommandError ||
-        e instanceof TaskIdError ||
-        e instanceof BaseBranchGuardError
-      ) {
+      if (e instanceof ImportCommandError) {
         printCliError(e);
         return 1;
       }
@@ -570,7 +581,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       process.stdout.write(result.salida);
       return result.codigo;
     } catch (e) {
-      if (e instanceof RoadmapCommandError || e instanceof ConfigError) {
+      if (e instanceof RoadmapCommandError) {
         printCliError(e);
         return 1;
       }
@@ -658,17 +669,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
-      // GitflowScriptLaunchError incluido (hallazgo menor de revision
-      // por pares, TASK-014, preexistente desde TASK-009): sin esto un
-      // bash ilanzable caia al catch-all con "taskctl no pudo arrancar".
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof StartCommandError ||
-        e instanceof StateMachineError ||
-        e instanceof TaskFolderConflictError ||
-        e instanceof GitflowScriptLaunchError
-      ) {
+      if (e instanceof StartCommandError) {
         printCliError(e);
         return 1;
       }
@@ -706,15 +707,10 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       return 0;
     } catch (e) {
       if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
         e instanceof HeuristicaError ||
         e instanceof RolesBrainstormError ||
         e instanceof CatalogoSkillsError ||
-        e instanceof PlanCommandError ||
-        e instanceof StateMachineError ||
-        e instanceof TaskFolderConflictError ||
-        e instanceof BaseBranchGuardError
+        e instanceof PlanCommandError
       ) {
         printCliError(e);
         return 1;
@@ -741,14 +737,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       for (const aviso of result.avisos) process.stderr.write(`[AVISO] ${aviso}\n`);
       return 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof ApproveCommandError ||
-        e instanceof StateMachineError ||
-        e instanceof TaskFolderConflictError ||
-        e instanceof BaseBranchGuardError
-      ) {
+      if (e instanceof ApproveCommandError) {
         printCliError(e);
         return 1;
       }
@@ -770,13 +759,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommit(r.autoCommit);
       return 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof TrocearCommandError ||
-        e instanceof TaskFolderConflictError ||
-        e instanceof BaseBranchGuardError
-      ) {
+      if (e instanceof TrocearCommandError) {
         printCliError(e);
         return 1;
       }
@@ -830,20 +813,9 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
-      // GitLaunchError/GitCommandError tambien se capturan aqui
-      // (hallazgo MENOR de revision por pares, TASK-013): sin esto
-      // caian al catch-all de bin/taskctl con el prefijo enganoso
-      // "taskctl no pudo arrancar".
       if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
         e instanceof ReviewCommandError ||
-        e instanceof PendientesError ||
-        e instanceof StateMachineError ||
-        e instanceof TaskFolderConflictError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError ||
-        e instanceof GitflowScriptLaunchError
+        e instanceof PendientesError
       ) {
         printCliError(e);
         return 1;
@@ -876,16 +848,8 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         if (r.tareas.baseBranchGuard?.switched === true) {
           aviso(`Workspace limpio -> cambiado automaticamente de "${r.tareas.baseBranchGuard.branchAntes}" a "${r.tareas.baseBranchGuard.baseBranch}" para crear las tareas.\n`);
         }
-        const ac = r.tareas.autoCommit;
-        if (ac !== null) {
-          printAvisos(...ac.avisos);
-          if (sincronizacionNoAplicada(ac.sincronizacion)) sincronizacionPendiente = true;
-          aviso(
-            ac.commiteado
-              ? `Commiteado ${ac.commit} en "${ac.rama}" (${ac.ficheros.length} fichero(s)).\n`
-              : 'Sin cambios que commitear (nada nuevo en disco).\n'
-          );
-        }
+        // TASK-149b (FS-02): el mismo printAutoCommit; con --json, por stderr.
+        if (r.tareas.autoCommit !== null) printAutoCommit(r.tareas.autoCommit, aviso);
       }
       if (r.mensajeEscritura !== '') aviso(r.mensajeEscritura);
       return r.codigo;
@@ -893,11 +857,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       if (
         e instanceof DoctorDeployCommandError ||
         e instanceof DoctorDeployCatalogoError ||
-        e instanceof DoctorDeployTareasError ||
-        e instanceof TaskIdError ||
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof BaseBranchGuardError
+        e instanceof DoctorDeployTareasError
       ) {
         printCliError(e);
         return 1;
@@ -924,12 +884,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       }
       return 0;
     } catch (e) {
-      if (
-        e instanceof ConfigError ||
-        e instanceof SiguienteCommandError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError
-      ) {
+      if (e instanceof SiguienteCommandError) {
         printCliError(e);
         return 1;
       }
@@ -947,7 +902,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       else process.stdout.write(r.existia ? 'Cadena cerrada.\n' : 'No habia ninguna cadena abierta.\n');
       return 0;
     } catch (e) {
-      if (e instanceof CadenaCommandError || e instanceof GitLaunchError || e instanceof GitCommandError) {
+      if (e instanceof CadenaCommandError) {
         printCliError(e);
         return 1;
       }
@@ -966,13 +921,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommit(r.autoCommit);
       return 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof PausaCommandError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError
-      ) {
+      if (e instanceof PausaCommandError) {
         printCliError(e);
         return 1;
       }
@@ -999,13 +948,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommitOPendiente(r.autoCommit);
       return 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof RegistrarCosteCommandError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError
-      ) {
+      if (e instanceof RegistrarCosteCommandError) {
         printCliError(e);
         return 1;
       }
@@ -1034,14 +977,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommit(r.autoCommit);
       return 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof VerificarMenoresCommandError ||
-        e instanceof StateMachineError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError
-      ) {
+      if (e instanceof VerificarMenoresCommandError) {
         printCliError(e);
         return 1;
       }
@@ -1065,13 +1001,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       if (r.autoCommit !== null) printAutoCommit(r.autoCommit);
       return 0;
     } catch (e) {
-      if (
-        e instanceof VerificarLoteCommandError ||
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError
-      ) {
+      if (e instanceof VerificarLoteCommandError) {
         printCliError(e);
         return 1;
       }
@@ -1092,14 +1022,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommitOPendiente(result.autoCommit);
       return 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof VeredictoCommandError ||
-        e instanceof StateMachineError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError
-      ) {
+      if (e instanceof VeredictoCommandError) {
         printCliError(e);
         return 1;
       }
@@ -1135,14 +1058,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
-      if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
-        e instanceof CodexReviewCommandError ||
-        e instanceof StateMachineError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError
-      ) {
+      if (e instanceof CodexReviewCommandError) {
         printCliError(e);
         return 1;
       }
@@ -1228,15 +1144,8 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       return 0;
     } catch (e) {
       if (
-        e instanceof AutoCommitError ||
-        e instanceof ConfigError ||
         e instanceof FinishCommandError ||
-        e instanceof PendientesError ||
-        e instanceof StateMachineError ||
-        e instanceof TaskFolderConflictError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError ||
-        e instanceof GitflowScriptLaunchError
+        e instanceof PendientesError
       ) {
         printCliError(e);
         return 1;
@@ -1280,12 +1189,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
       // cancelado sale 0 y uno con opcion no reconocida sale 1.
       return result.code;
     } catch (e) {
-      if (
-        e instanceof WrapperCommandError ||
-        e instanceof GitflowScriptLaunchError ||
-        e instanceof GitLaunchError ||
-        e instanceof GitCommandError
-      ) {
+      if (e instanceof WrapperCommandError) {
         printCliError(e);
         return 1;
       }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index fa94d2f..2a6504e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -206,3 +206,32 @@ export function rechazarFlagsDesconocidos(
     throw fail(lineas.join('\n'));
   }
 }
+
+/**
+ * TASK-149b (FS-18): vive en la capa cli, junto a los demas parsers de argv.
+ *
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
+
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index cb3aa05..4a08965 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -18,7 +18,7 @@
  * seccion 8.3 (ensureBaseBranchReady) antes de escribir nada.
  */
 import path from 'node:path';
-import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerUnico, rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import type { Task } from '../core/task.js';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import {
@@ -52,7 +52,6 @@ import { hayCambiosFueraDeTarea } from '../fs/pendientes.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
index 7b9a436..c7140cc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
@@ -27,7 +27,7 @@
  * finish.ts YA lo hacen, y no se tocan en esta tarea).
  */
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import { writeFile, mkdir } from 'node:fs/promises';
 import type { Task } from '../core/task.js';
 import { readTareaFile, isEexist } from '../fs/task-store.js';
@@ -48,7 +48,6 @@ import {
 } from '../fs/git.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index d79cc80..6d426bc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -23,7 +23,7 @@
  */
 import path from 'node:path';
 import { avisosDeployDeRelease } from '../fs/informes-deploy.js';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import {
   FinishCommandError,
   FLAGS_FINISH,
@@ -83,7 +83,6 @@ import {
 import {
   autoCommit,
   AutoCommitError,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
index 9287283..e4ce4a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
@@ -26,10 +26,9 @@
  */
 import { readFile } from 'node:fs/promises';
 import path from 'node:path';
-import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index 1d7611e..39a9960 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -12,10 +12,9 @@
  */
 import { readFile } from 'node:fs/promises';
 import path from 'node:path';
-import { extraerRepetible, extraerUnico, parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerRepetible, extraerUnico, parseArgs, rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
index 1a020c3..ed1fd52 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
@@ -11,14 +11,13 @@
  * en la copia vieja de la rama base la perderia en el merge).
  */
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import { resolverConfig } from '../core/config.js';
 import { registrarTransicion } from '../core/transiciones.js';
 import { mensajeTareaEnOtraRama, runGit, tareaEnOtraRama } from '../fs/git.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index c9a87f7..32c3e55 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -24,7 +24,7 @@
  */
 import path from 'node:path';
 import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
-import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import {
   parseAsignadoAFlag,
   identidadUsable,
@@ -40,7 +40,6 @@ import { hayCambiosFueraDeTarea } from '../fs/pendientes.js';
 import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index 46c52c5..18868ba 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -44,7 +44,7 @@
  */
 import { readdir, writeFile } from 'node:fs/promises';
 import path from 'node:path';
-import { rechazarFlagsDesconocidos, parseArgs, extraerRepetible } from '../cli/args.js';
+import { rechazarFlagsDesconocidos, parseArgs, extraerRepetible, extraerPushFlag } from '../cli/args.js';
 import { readTareaFile } from '../fs/task-store.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
 import type { Task } from '../core/task.js';
@@ -69,7 +69,6 @@ import { buscarTranscripciones, directorioConfigClaude, leerTranscripcion } from
 import { mensajeTareaEnOtraRama, runGit, tareaEnOtraRama } from '../fs/git.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 2a53fdb..7af2ac5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -27,7 +27,7 @@
  * `finish` al cerrar.
  */
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
 import { STATE_FOLDER, type Task } from '../core/task.js';
 import { raizDelRepo, resolverConfig } from '../core/config.js';
@@ -85,7 +85,6 @@ import {
 } from '../fs/git.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index 6ff7b07..773845b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -12,7 +12,7 @@
  * llamar al script, en vez de delegar en su prompt interactivo.
  */
 import path from 'node:path';
-import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import {
   parseAsignadoAFlag,
   identidadUsable,
@@ -46,7 +46,6 @@ import { spawnSync } from 'node:child_process';
 import { esIdTroceable } from '../core/troceo.js';
 import {
   autoCommit,
-  extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
index 05f9ddb..e363c5d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
@@ -13,12 +13,12 @@
  */
 import path from 'node:path';
 import { readFile, rm, writeFile } from 'node:fs/promises';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import { readTareaFile, moveTareaFile, writeTareaFile, listExistingTaskIds } from '../fs/task-store.js';
 import { resolverPlanFinal } from './plan.js';
 import { planQueCuenta, planRedactado } from './approve.js';
 import { ensureBaseBranchReady, runGit, type BaseBranchGuardResult } from '../fs/git.js';
-import { autoCommit, extraerPushFlag, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
+import { autoCommit, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
 import { isValidTaskId } from '../core/task.js';
 import { esIdTroceable, leerPartes, planificarTroceo, planTrasTroceo, TroceoError } from '../core/troceo.js';
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index a0b7c23..239a184 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -21,11 +21,11 @@
  */
 import { readFile, writeFile } from 'node:fs/promises';
 import path from 'node:path';
-import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerUnico, rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { readTareaFile } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
-import { extraerPushFlag, type AutoCommitResult } from '../fs/git-commit.js';
+import { type AutoCommitResult } from '../fs/git-commit.js';
 import { REVISION_DIRNAME } from './review.js';
 
 export class VeredictoCommandError extends Error {}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
index 863241d..c9beccd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
@@ -17,7 +17,7 @@
  */
 import { readdir, writeFile } from 'node:fs/promises';
 import path from 'node:path';
-import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import { resolverConfig } from '../core/config.js';
 import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
 import { PUERTA_FINISH } from '../core/registro-puertas.js';
@@ -26,7 +26,7 @@ import { isValidTaskId, STATE_FOLDER } from '../core/task.js';
 import { anotarLineaEnSeccion, MARCA_LOTE_VERDE, pendienteDeLote, SECCION_VERIFICACION_LOTE } from '../core/transiciones.js';
 import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { currentBranch, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
-import { autoCommit, extraerPushFlag, type AutoCommitResult } from '../fs/git-commit.js';
+import { autoCommit, type AutoCommitResult } from '../fs/git-commit.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
 import { anotarSuite } from './finish-verificacion.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
index 4ff3d6c..095f80c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
@@ -22,7 +22,7 @@
 import { existsSync } from 'node:fs';
 import { readFile, writeFile } from 'node:fs/promises';
 import path from 'node:path';
-import { extraerUnico, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { extraerUnico, rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { commitRevisadoDeRonda, informeRellenado, veredictoDeRonda } from '../core/informe-revision.js';
 import {
@@ -43,7 +43,7 @@ import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda } from
 import { isAncestor, runGit } from '../fs/git.js';
 import { resolverConfig } from '../core/config.js';
 import { excluirDeRevision } from '../fs/revisores-rango.js';
-import { autoCommit, extraerPushFlag, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
+import { autoCommit, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
 import { REVISION_DIRNAME } from './review.js';
 
 export class VerificarMenoresCommandError extends Error {}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
index 918137f..64b8cb2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
@@ -457,28 +457,3 @@ function detalleDeError(e: unknown): string {
   return e instanceof Error ? e.message : String(e);
 }
 
-/**
- * Saca `--push` / `-p` de argv y devuelve el resto.
- *
- * No se delega en `parseArgs` a proposito: ese parser trata
- * `--flag valor` como par, asi que `taskctl plan --push TASK-030` se
- * habria leido como `push="TASK-030"` y la tarea habria desaparecido
- * de los posicionales. Como `--push` es booleano puro, quitarlo antes
- * de parsear es mas simple que ensenarle al parser que hay flags sin
- * valor.
- *
- * `-p` se acepta ademas de `--push` porque `pause-work.sh` ya acepta
- * las dos formas: mismo flag, mismo significado, mismo vocabulario.
- */
-export function extraerPushFlag(argv: readonly string[]): { push: boolean; resto: string[] } {
-  const resto: string[] = [];
-  let push = false;
-  for (const arg of argv) {
-    if (arg === '--push' || arg === '-p') {
-      push = true;
-      continue;
-    }
-    resto.push(arg);
-  }
-  return { push, resto };
-}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
index f2d40a2..919a902 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sincronizacion.ts
@@ -95,9 +95,7 @@ export function ejecutarSincronizacion(
   const raiz = raizDelRepo(cwd);
   const declaradas = config.rutas_sincronizacion;
   const absolutas = declaradas.map((r) => path.join(raiz, r));
-  const aMano =
-    `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
-    'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.';
+  const aMano = textoAMano(comando, declaradas);
 
   // (a) Antes de nada: si una ruta declarada ya trae cambios, el
   // commit automatico se los llevaria. `start`, `review` y `finish` no
@@ -217,8 +215,15 @@ export function sincronizacionFallidaAlPreparar(
     comando,
     declaradas,
     `escribio sus ficheros, pero Git no pudo prepararlos (${detalle})`,
+    textoAMano(comando, declaradas)
+  );
+}
+
+/** TASK-149b (FS-15): lo que tiene que hacer la persona cuando la sincronizacion no se aplico. */
+function textoAMano(comando: string, declaradas: readonly string[]): string {
+  return (
     `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
-      'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.'
+    'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.'
   );
 }
````

## Excluido del diff (27 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-149b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149b/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-149b/tarea.md                                                       |  10 ++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                  | 178 ++++++++++++++++++++++++++--------------------------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js                                             |  27 +++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                     |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js                                |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                      |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js                                      |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                                         |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/pausa.js                                       |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                        |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js                             |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                                       |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/trocear.js                                     |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js                                   |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-lote.js                              |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-menores.js                           |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js                                        |  25 ------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sincronizacion.js                                    |   9 +++--
 27 files changed, 124 insertions(+), 180 deletions(-)
````

## Tests del diff (4 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-tareas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-commit.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/cli/args.test.ts                      | 14 +++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts           | 31 +++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-tareas.test.ts |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-commit.test.ts                 | 12 ------------
 4 files changed, 46 insertions(+), 14 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 109.8 s
- Commit verificado: d85d2ab46005ae66a9cccee7d13c5b803734921b
- Huella: b719132d6504c29c6fccf026e00096cdbb1ea686
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 146471 bytes en total):

````
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (2335.6174ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (2459.8229ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9859ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2404ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (1.2286ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6836ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6869ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0375ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.3146ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (11.643ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7876ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.3918ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.8244ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.3769ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.6757ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8935ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4247ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5002ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4468ms)
✔ autoCommit NO se lleva el trabajo de la persona: su fichero sucio no entra en el commit y sigue sucio (2684.971ms)
✔ autoCommit respeta lo que la persona ya tenia PREPARADO con git add (modo --only) (2402.317ms)
✔ autoCommit registra el MOVIMIENTO de carpeta (origen borrado + destino) en un solo commit (2134.1373ms)
✔ autoCommit no crea commits vacios cuando el fichero ya estaba identico (1708.96ms)
✔ autoCommit ignora rutas que no existen ni en disco ni en el indice (carpeta de origen no versionada) (2007.7197ms)
✔ autoCommit falla RUIDOSAMENTE si un hook de pre-commit rechaza, diciendo que esta escrito pero no registrado (1883.5327ms)
✔ autoCommit rechaza la raiz del repo y cualquier ruta de fuera (no hay git add -A por la puerta de atras) (1173.926ms)
✔ autoCommit --push: con un origin bare real, la rama llega al remoto (3355.5372ms)
✔ autoCommit --push sin remoto: avisa y sigue (no lanza), y el commit local se hace igual (1722.4766ms)
✔ autoCommit --push con HEAD desacoplado: avisa y no intenta subir nada (1785.7457ms)
✔ autoCommit --push que falla de verdad: lanza diciendo que el commit SI se creo (3848.7479ms)
✔ mensajeChore: formato del repo y rechazo de tildes (los scripts de Git-Flow los procesan) (0.6212ms)
ℹ tests 787
ℹ suites 0
ℹ pass 786
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 99364.9164
[verificar-impacto] node --test termino con 0 en 99.5 s.
````
