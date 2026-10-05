# Peticion de revision — TASK-047 (ronda 1)

- Tarea: TASK-047 — F5-T3 Flags desconocidos y mensajes de review
- Rama revisada: fix/task-047-f5-t3-flags-desconocidos-y-mensajes-de-r
- Rama base: develop
- Commit revisado (HEAD): 21366cad732332237818dc01299053c582fe4780
- Fecha: 2026-10-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-047 (criterios de aceptacion y plan)

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
21366ca fix(TASK-047): flags desconocidos abortan, review separa agente y skill, puerta de rondas compartida
510d588 refactor(TASK-047): una sola sugerencia y guarda de flags desconocidos
a47010e chore(TASK-047): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/contexto/HALLAZGOS.md b/docs/contexto/HALLAZGOS.md
index 52ee9d1..68e5c06 100644
--- a/docs/contexto/HALLAZGOS.md
+++ b/docs/contexto/HALLAZGOS.md
@@ -557,7 +557,11 @@ sigue valiendo, y porque dos de ellos cambiaron la solución al medirla.
   transversal del CLI, no de un comando — anotado sin corregir. **B6 lo tapó
   solo para `--asignado-a`**, aceptando las dos grafías en los tres comandos
   que lo usan, después de que la revisión encontrara el fallo ya
-  materializado en `board`. El resto de flags sigue igual.
+  materializado en `board`. **Corregido para todo el CLI en TASK-047**: cada
+  comando declara sus flags (`FLAGS_<CMD>`) y `rechazarFlagsDesconocidos`
+  (`src/cli/args.ts`) aborta antes de cualquier efecto con la lista de los
+  válidos y el más parecido. Un valor que empiece por `--` sigue pasando con
+  `--flag=valor`.
 - **El plugin no tiene `skills/` ni `agents/`.** Hoy es un CLI y unos scripts:
   todo el discurso de agentes especializados de la metodología no tiene aún
   ningún artefacto.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 70bd0fe..94cbe0d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -571,7 +571,8 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         .map(
           (grupo) =>
             `Peticion de revision (ronda ${result.ronda}, ${grupo.revisor}): ${grupo.peticionPath}\n` +
-            `Lanza ese agente con esa peticion y vuelca su salida en ${grupo.informePath}.\n`
+            `Lanza el agente "${result.agente}" (modelo ${result.modelo}) cargando la skill ` +
+            `"${grupo.revisor}" con esa peticion y vuelca su salida en ${grupo.informePath}.\n`
         )
         .join('');
       printAvisos(...result.avisos);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index 33743f1..886c0b2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -10,6 +10,8 @@
  * --titulo="--urgente"), que con la forma "--flag valor" se
  * malinterpretaria como un flag nuevo.
  */
+import { masParecida } from '../core/sugerencia.js';
+
 export interface ParsedArgs {
   positional: string[];
   flags: Record<string, string | boolean>;
@@ -45,3 +47,46 @@ export function parseArgs(argv: readonly string[]): ParsedArgs {
 
   return { positional, flags };
 }
+
+/**
+ * Aborta si argv trae un flag que el comando no conoce (TASK-047, auditoria
+ * D4). Antes `--complejida trivial` se ignoraba en silencio y la tarea salia
+ * con otra complejidad. Mira argv en bruto y no la salida de `parseArgs`,
+ * porque varios comandos leen sus flags a mano.
+ *
+ * Solo cuenta como flag un token `--nombre` (o `--nombre=valor`) y los cortos
+ * que el comando declare (`-p`): un valor como `-1` no es un flag. Un token
+ * `--x` justo despues de un flag con valor tambien se comprueba — es lo que
+ * `parseArgs` haria con el; para pasar un valor que empieza por `--` esta
+ * `--flag=valor`. `validos` va con su prefijo (`--titulo`, `-p`).
+ */
+export function rechazarFlagsDesconocidos(
+  argv: readonly string[],
+  validos: readonly string[],
+  comando: string,
+  fail: (mensaje: string) => Error
+): void {
+  for (const arg of argv) {
+    let flag: string;
+    if (arg.startsWith('--')) {
+      const eq = arg.indexOf('=');
+      flag = eq === -1 ? arg : arg.slice(0, eq);
+    } else if (/^-[A-Za-z]$/.test(arg)) {
+      flag = arg;
+    } else {
+      continue;
+    }
+    if (validos.includes(flag)) continue;
+    const sugerida = flag.startsWith('--') && flag.length > 2
+      ? masParecida(flag.slice(2), validos.filter((v) => v.startsWith('--')).map((v) => v.slice(2)))
+      : null;
+    const lineas = [`[ERROR] taskctl ${comando}: flag desconocido "${flag}".`];
+    if (sugerida !== null) lineas.push(`        Quiza quisiste decir "--${sugerida}".`);
+    lineas.push(
+      validos.length === 0
+        ? `        "${comando}" no admite flags.`
+        : `        Flags validos: ${validos.join(', ')}.`
+    );
+    throw fail(lineas.join('\n'));
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/asignado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/asignado.ts
index 95f3a58..245cca9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/asignado.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/asignado.ts
@@ -17,10 +17,11 @@
  * lo especifico el Objetivo de TASK-005 (igual al nombre del campo del
  * frontmatter). Esa inconsistencia es previa a B6 y no se puede
  * resolver sin romper una de las dos: se acepta el alias con guion
- * bajo tambien aqui, porque parseArgs IGNORA EN SILENCIO los flags
- * desconocidos (divergencia ya documentada en HALLAZGOS.md), asi que
- * un "taskctl plan TASK-001 --asignado_a carlos" sin el alias saldria
- * con codigo 0 sin haber asignado a nadie.
+ * bajo tambien aqui, porque parseArgs IGNORABA EN SILENCIO los flags
+ * desconocidos, asi que un "taskctl plan TASK-001 --asignado_a carlos"
+ * sin el alias salia con codigo 0 sin haber asignado a nadie. Desde
+ * TASK-047 un flag desconocido aborta (rechazarFlagsDesconocidos), pero
+ * el alias se conserva: quitarlo romperia a quien ya lo usa.
  */
 import { parseArgs } from './args.js';
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 267ee3c..2587ff2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -18,6 +18,7 @@
  * seccion 8.3 (ensureBaseBranchReady) antes de escribir nada.
  */
 import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import type { Task } from '../core/task.js';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import {
@@ -42,6 +43,9 @@ import {
 
 export class ApproveCommandError extends Error {}
 
+/** Flags de `taskctl approve`: extraerDecididoPor y extraerPushFlag. */
+export const FLAGS_APPROVE: readonly string[] = ['--decidido-por', '--push', '-p'];
+
 /**
  * Acepta el plan en CUALQUIERA de sus dos ubicaciones (TASK-027, item
  * C3): `planificacion/plan-final.md` (canonica) o suelto en la raiz de
@@ -99,6 +103,8 @@ export async function runApproveCommand(
   today: string,
   deps: ApproveCommandDeps
 ): Promise<ApproveCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_APPROVE, 'approve', (m) => new ApproveCommandError(m));
   // --push se saca ANTES de leer el ID: es booleano puro y va delante
   // o detras indistintamente ("taskctl approve --push TASK-030").
   const { push, resto: sinPush } = extraerPushFlag(argv);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/board.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/board.ts
index 45966ca..a7a915c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/board.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/board.ts
@@ -18,7 +18,7 @@
  */
 import path from 'node:path';
 import { mkdir, writeFile, stat } from 'node:fs/promises';
-import { parseArgs } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
 import { parseAsignadoAFlag } from '../cli/asignado.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError, type Task } from '../core/task.js';
@@ -32,6 +32,9 @@ import { listExistingTaskIds, readTareaFile, isEnoent } from '../fs/task-store.j
 
 export class BoardCommandError extends Error {}
 
+/** Flags de `taskctl board`: parseBoardArgs, parseEscribirFlag y parseAsignadoAFlag (con su alias). */
+export const FLAGS_BOARD: readonly string[] = ['--sprint', '--asignado-a', '--asignado_a', '--escribir'];
+
 /** Ruta de docs/BOARD.md dentro del repo del usuario. */
 export function boardFilePath(repoCwd: string): string {
   return path.join(repoCwd, 'docs', 'BOARD.md');
@@ -109,6 +112,8 @@ export async function runBoardCommand(
   argv: readonly string[],
   deps: BoardCommandDeps = {}
 ): Promise<BoardCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_BOARD, 'board', (m) => new BoardCommandError(m));
   const filters = parseBoardArgs(argv);
   const escribir = parseEscribirFlag(argv);
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index d6d3c14..50a4037 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -20,12 +20,16 @@
 import { randomBytes } from 'node:crypto';
 import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
 import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { runGit } from '../fs/git.js';
 import { isEexist, isEnoent } from '../fs/task-store.js';
 import { isValidTaskId } from '../core/task.js';
 
 export class CadenaCommandError extends Error {}
 
+/** Flags de `taskctl cadena`: solo --forzar (de `cerrar`). --cadena no va aqui: cli.ts lo quita antes de despachar. */
+export const FLAGS_CADENA: readonly string[] = ['--forzar'];
+
 export interface CadenaCommandDeps {
   repoCwd: string;
   /** Solo para tests: el instante actual. */
@@ -98,6 +102,8 @@ export async function runCadenaCommand(
   argv: readonly string[],
   deps: CadenaCommandDeps
 ): Promise<CadenaCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_CADENA, 'cadena', (m) => new CadenaCommandError(m));
   const ahora = (deps.ahora ?? (() => new Date()))();
   const [accion, arg] = argv;
   const ruta = rutaBloqueo(deps.repoCwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
index 2ef09e7..867329e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
@@ -9,11 +9,9 @@
  * (`review.ts`).
  *
  * Solo se ejecuta si la tarea esta en-revision, `revision_codex: true`
- * y la revision primaria de mayor ronda ya aprobo — se recalcula aqui
- * con el MISMO criterio que `buildTransitionContext` de finish.ts (que
- * no se toca ni se exporta, asi que este comando reimplementa esa
- * unica pieza que necesita, en vez de acoplarse a un modulo interno de
- * otro comando).
+ * y la revision primaria de mayor ronda ya aprobo — con la misma
+ * funcion que la puerta de finish (`ultimaRondaAprobada` de
+ * fs/rondas.ts, TASK-047; antes este comando la reimplementaba).
  *
  * Decision de Carlos (2026-09-12, plan-final.md): TODO fallo de
  * "codex" — ausente del PATH (ENOENT) o presente pero con exit
@@ -29,10 +27,16 @@
  * finish.ts YA lo hacen, y no se tocan en esta tarea).
  */
 import path from 'node:path';
-import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { writeFile, mkdir } from 'node:fs/promises';
 import type { Task } from '../core/task.js';
-import { readTareaFile, isEexist, isEnoent } from '../fs/task-store.js';
-import { INFORME_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
+import { readTareaFile, isEexist } from '../fs/task-store.js';
+import {
+  INFORME_CODEX_RE,
+  INFORME_REVISION_RE,
+  siguienteRonda,
+  ultimaRondaAprobada,
+} from '../fs/rondas.js';
 import { fenceFor } from '../core/markdown.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import {
@@ -48,25 +52,18 @@ import {
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
-import { veredictoAprobado } from './finish.js';
 import { REVISION_DIRNAME } from './review.js';
 
 export class CodexReviewCommandError extends Error {}
 
-/**
- * Mismo patron que INFORME_REVISION_RE de finish.ts (no exportada de
- * alli, asi que se redefine aqui: una unica linea de regex duplicada es
- * mas barato que acoplar codex-review.ts a un simbolo interno de otro
- * comando). Acepta el sufijo opcional de dominio de TASK-018.
- */
+/** Flags de `taskctl codex-review`: solo extraerPushFlag. */
+export const FLAGS_CODEX_REVIEW: readonly string[] = ['--push', '-p'];
 
 /**
- * Regex de la ronda de Codex. Codex lleva SU PROPIO contador de ronda,
- * independiente del de la revision primaria (no hay garantia de que
- * coincidan: una tarea puede reintentar codex-review sin que la
- * revision primaria haya tenido una ronda nueva).
+ * Regex de la ronda de Codex: vive en fs/rondas.ts desde TASK-047 y se
+ * reexporta aqui para no romper a quien la importa de este modulo.
  */
-export const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
+export { INFORME_CODEX_RE } from '../fs/rondas.js';
 
 export interface CodexReviewCommandDeps {
   /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
@@ -98,23 +95,6 @@ export interface CodexReviewCommandResult {
   autoCommit: AutoCommitResult;
 }
 
-/**
- * true si TODOS los informes de la ronda de MAYOR numero de la revision
- * primaria aprueban — mismo criterio fail-closed que
- * `buildTransitionContext` de finish.ts (informesDeLaRonda +
- * veredictoAprobado), reimplementado aqui porque esa funcion no esta
- * exportada. Un directorio de revision/ inexistente (tarea que nunca
- * paso por "taskctl review") da false, no un error.
- */
-async function revisionPrimariaAprobadaDe(revisionDir: string): Promise<boolean> {
-  const { nombres } = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
-  if (nombres.length === 0) return false;
-  const contenidos = await Promise.all(
-    nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8'))
-  );
-  return contenidos.every((c) => veredictoAprobado(c));
-}
-
 /**
  * Scaffold del informe de Codex: mismo contrato que `informeTemplate`
  * de review.ts — taskctl finish exige que TODAS las lineas
@@ -158,6 +138,8 @@ export async function runCodexReviewCommand(
   _today: string,
   deps: CodexReviewCommandDeps
 ): Promise<CodexReviewCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_CODEX_REVIEW, 'codex-review', (m) => new CodexReviewCommandError(m));
   const { push, resto } = extraerPushFlag(argv);
   const id = resto[0];
   if (id === undefined || id.trim() === '') {
@@ -168,7 +150,7 @@ export async function runCodexReviewCommand(
   const revisionDir =
     existing === null ? null : path.join(path.dirname(existing.filePath), REVISION_DIRNAME);
   const revisionPrimariaAprobada =
-    revisionDir === null ? false : await revisionPrimariaAprobadaDe(revisionDir);
+    revisionDir === null ? false : await ultimaRondaAprobada(revisionDir, INFORME_REVISION_RE);
   assertTransitionAllowed('codex-review', existing ? existing.task : null, {
     revisionPrimariaAprobada,
   });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index afe488c..4db9fdc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -17,7 +17,8 @@
  *
  */
 import path from 'node:path';
-import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { readFile, writeFile, mkdir } from 'node:fs/promises';
 import type { Task } from '../core/task.js';
 import { parseTareaFile } from '../core/tarea-file.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
@@ -25,8 +26,7 @@ import { TaskValidationError } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
 import { registrarTransicion } from '../core/transiciones.js';
 import { resolverConfig } from '../core/config.js';
-import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
-import { veredictoAprobado } from '../core/informe-revision.js';
+import { INFORME_CODEX_RE, INFORME_REVISION_RE, ultimaRondaAprobada } from '../fs/rondas.js';
 import { casillasSinMarcar } from '../core/validacion-tarea.js';
 import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
@@ -54,6 +54,9 @@ import { REVISION_DIRNAME } from './review.js';
 
 export class FinishCommandError extends Error {}
 
+/** Flags de `taskctl finish`: solo extraerPushFlag. */
+export const FLAGS_FINISH: readonly string[] = ['--push', '-p'];
+
 const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
   feature: 'merge-feature-to-develop.sh',
   fix: 'merge-fix-to-develop.sh',
@@ -69,57 +72,22 @@ const MERGEA_A_MAIN: Record<Task['tipo'], boolean> = {
   release: true,
 };
 
-/**
- * TASK-018: una ronda de revision fragmentada por dominio deja N
- * informes, uno por revisor, con el nombre de la skill como sufijo
- * (p. ej. `informe-revision-2-java-spring-reviewer.md`). El sufijo es
- * OPCIONAL a proposito: una ronda sin fragmentar (0 dominios detectados,
- * o mas del umbral) sigue dejando `informe-revision-<N>.md` sin sufijo,
- * igual que antes de esta tarea — ninguna tarea ya cerrada, ni ninguna
- * en curso con revisiones antiguas, deja de reconocerse.
- */
-const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
-
 // El gate de veredicto vive en core/informe-revision.ts desde TASK-040;
 // se reexporta aqui para no romper a quien lo importa de finish.
 export { veredictoAprobado } from '../core/informe-revision.js';
 
-/**
- * Contenidos de TODOS los informes de la ronda con mayor N segun `re`,
- * o [] si no hay ninguno. Antes de TASK-018 una ronda tenia como mucho
- * UN informe por convencion (`re` solo casaba ese nombre exacto), asi
- * que "el de mayor N" y "todos los de mayor N" coincidian; con la
- * revision fragmentada por dominio una misma ronda puede dejar varios
- * ficheros con el MISMO N (uno por revisor) y hay que devolverlos
- * todos, no solo el primero que se encuentre.
- */
-async function informesDeLaRonda(revisionDir: string, re: RegExp): Promise<string[]> {
-  const { nombres } = await informesDeUltimaRonda(revisionDir, re);
-  return Promise.all(nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8')));
-}
-
 /**
  * Contexto de aprobacion para la maquina de estados, derivado de los
- * informes de revision/ de la carpeta de la tarea. La convencion del
- * informe de Codex (informe-codex-<n>.md) la producira TASK-020; leerla
- * ya aqui deja a finish preparado sin acoplarse a ese comando.
- *
- * TASK-018: si la ronda de revision primaria se fragmento por dominio,
- * "aprobada" exige que TODOS los informes de esa ronda aprueben, no solo
- * uno — fail-closed: que falte AUNQUE SEA UNO de los N (o que su
- * veredicto siga en PENDIENTE) basta para que la tarea no pueda
- * cerrarse. El informe de Codex sigue sin fragmentarse (TASK-020 es un
- * unico agente independiente, no un enrutado por dominio), pero se
- * reusa la misma funcion: con un solo fichero por ronda el resultado es
- * identico al de antes de esta tarea.
+ * informes de revision/ de la carpeta de la tarea: la ultima ronda de la
+ * revision primaria y la de Codex, cada una aprobada solo si TODOS sus
+ * informes aprueban (`ultimaRondaAprobada`, fail-closed, TASK-018).
+ * Codex-review usa la misma funcion para su propia puerta (TASK-047).
  */
 async function buildTransitionContext(taskDir: string): Promise<TransitionContext> {
   const revisionDir = path.join(taskDir, REVISION_DIRNAME);
-  const informes = await informesDeLaRonda(revisionDir, INFORME_REVISION_RE);
-  const informesCodex = await informesDeLaRonda(revisionDir, INFORME_CODEX_RE);
   return {
-    revisionPrimariaAprobada: informes.length > 0 && informes.every((i) => veredictoAprobado(i)),
-    revisionCodexAprobada: informesCodex.length > 0 && informesCodex.every((i) => veredictoAprobado(i)),
+    revisionPrimariaAprobada: await ultimaRondaAprobada(revisionDir, INFORME_REVISION_RE),
+    revisionCodexAprobada: await ultimaRondaAprobada(revisionDir, INFORME_CODEX_RE),
   };
 }
 
@@ -273,6 +241,8 @@ export async function runFinishCommand(
   today: string,
   deps: FinishCommandDeps
 ): Promise<FinishCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_FINISH, 'finish', (m) => new FinishCommandError(m));
   const { push, resto } = extraerPushFlag(argv);
   const id = resto[0];
   if (id === undefined || id.trim() === '') {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
index 9dd012f..8547e7e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
@@ -26,7 +26,7 @@
  */
 import { readFile } from 'node:fs/promises';
 import path from 'node:path';
-import { parseArgs } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
 import {
   autoCommit,
   extraerPushFlag,
@@ -49,6 +49,9 @@ import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
 
 export class ImportCommandError extends Error {}
 
+/** Flags de `taskctl import`: parseImportArgs y extraerPushFlag. */
+export const FLAGS_IMPORT: readonly string[] = ['--tipo', '--sprint', '--complejidad', '--modelo-sugerido', '--agente-revisor', '--push', '-p'];
+
 export interface ImportOptions {
   filePath: string;
   tipo: TaskType;
@@ -201,6 +204,8 @@ export async function runImportCommand(
   today: string,
   deps: ImportCommandDeps
 ): Promise<ImportCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_IMPORT, 'import', (m) => new ImportCommandError(m));
   // Igual que en new.ts (TASK-030, item C4): el config se resuelve lo
   // primero, para que un `.taskcode/config.yml` roto aborte antes de
   // leer el fichero a importar y antes de cualquier cambio de rama.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index ede194b..b9f7716 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -12,7 +12,7 @@
  */
 import { readFile } from 'node:fs/promises';
 import path from 'node:path';
-import { parseArgs } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
 import {
   autoCommit,
   extraerPushFlag,
@@ -34,6 +34,9 @@ import { extraerSecciones } from '../core/tarea-body.js';
 
 export class NewTaskArgError extends Error {}
 
+/** Flags de `taskctl new`: parseNewTaskArgs (titulo..agente-revisor), extraerContenidoInicial (objetivo, criterio, desde) y extraerPushFlag. */
+export const FLAGS_NEW: readonly string[] = ['--titulo', '--tipo', '--sprint', '--etiquetas', '--complejidad', '--modelo-sugerido', '--agente-revisor', '--objetivo', '--criterio', '--desde', '--push', '-p'];
+
 export interface NewTaskOptions {
   titulo: string;
   tipo: TaskType;
@@ -292,6 +295,8 @@ export async function runNewCommand(
   today: string,
   deps: NewCommandDeps
 ): Promise<NewCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_NEW, 'new', (m) => new NewTaskArgError(m));
   // El config se resuelve ANTES de parsear los argumentos (TASK-030,
   // item C4): si esta roto, se aborta sin haber tocado nada y sin
   // haber cambiado de rama. Un `.taskcode/config.yml` invalido es un
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
index 3a281c6..90b405c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
@@ -11,6 +11,7 @@
  * en la copia vieja de la rama base la perderia en el merge).
  */
 import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import { resolverConfig } from '../core/config.js';
 import { registrarTransicion } from '../core/transiciones.js';
@@ -24,6 +25,9 @@ import {
 
 export class PausaCommandError extends Error {}
 
+/** Flags de `taskctl pausa`: solo extraerPushFlag. */
+export const FLAGS_PAUSA: readonly string[] = ['--push', '-p'];
+
 export interface PausaCommandDeps {
   repoCwd: string;
 }
@@ -40,6 +44,8 @@ export async function runPausaCommand(
   today: string,
   deps: PausaCommandDeps
 ): Promise<PausaCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_PAUSA, 'pausa', (m) => new PausaCommandError(m));
   const { push, resto } = extraerPushFlag(argv);
   const id = resto[0];
   if (id === undefined || id.trim() === '' || id.startsWith('--')) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 4a084a6..96a7f2d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -24,7 +24,7 @@
  */
 import path from 'node:path';
 import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
-import { parseArgs } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
 import {
   parseAsignadoAFlag,
   identidadUsable,
@@ -83,6 +83,9 @@ import { comprobarSkillInstalado } from '../core/plugin-instalado.js';
 
 export class PlanCommandError extends Error {}
 
+/** Flags de `taskctl plan`: parseAsignadoAFlag (con su alias) y extraerPushFlag. */
+export const FLAGS_PLAN: readonly string[] = ['--asignado-a', '--asignado_a', '--push', '-p'];
+
 export const PLAN_FINAL_FILENAME = 'plan-final.md';
 
 /**
@@ -381,6 +384,8 @@ export async function runPlanCommand(
   today: string,
   deps: PlanCommandDeps
 ): Promise<PlanCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_PLAN, 'plan', (m) => new PlanCommandError(m));
   // El ID sale de los POSICIONALES, no de argv[0] a secas (item B6):
   // con "--asignado-a" en juego, "taskctl plan --asignado-a carlos
   // TASK-001" tiene que funcionar igual que con el flag detras. De
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index a408c9d..17252b6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -27,6 +27,7 @@
  * `finish` al cerrar.
  */
 import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
 import { STATE_FOLDER, type Task } from '../core/task.js';
 import { resolverConfig } from '../core/config.js';
@@ -63,6 +64,9 @@ import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores
 
 export class ReviewCommandError extends Error {}
 
+/** Flags de `taskctl review`: solo extraerPushFlag. */
+export const FLAGS_REVIEW: readonly string[] = ['--push', '-p'];
+
 const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
   feature: 'update-feature.sh',
   fix: 'update-fix.sh',
@@ -120,6 +124,14 @@ export interface ReviewCommandResult {
   commitRevisado: string;
   ronda: number;
   filePath: string;
+  /**
+   * Agente que se lanza para revisar (`agente_revisor` de la tarea) y el
+   * modelo con que se lanza (`modelo_sugerido`: por la seccion 16.6 de la
+   * metodologia, el revisor usa el mismo modelo que la tarea). TASK-047: la
+   * skill revisora de cada grupo es otra cosa y va en `informes[].revisor`.
+   */
+  agente: string;
+  modelo: string;
   /**
    * Un elemento por revisor que interviene en esta ronda (TASK-018): uno
    * solo, con el generico, si el diff no se fragmento por dominio; uno
@@ -140,10 +152,11 @@ export interface ReviewCommandResult {
 export { fenceFor } from '../core/markdown.js';
 
 /**
- * `agenteRevisor` y `nombreInforme` (TASK-018) los decide el
+ * `skillRevisora` y `nombreInforme` (TASK-018) los decide el
  * clasificador por dominio en runReviewCommand, NO `task.agente_revisor`
- * del frontmatter: ese era justo el defecto que esta tarea corrige (ver
- * el Objetivo de tarea.md). `alcanceDiff` es el titulo de la seccion del
+ * del frontmatter. Desde TASK-047 la peticion separa la skill que el
+ * revisor carga (la del dominio) del agente que se lanza y su modelo
+ * (`task.agente_revisor` y `task.modelo_sugerido`). `alcanceDiff` es el titulo de la seccion del
  * diff embebido: "Diff completo" cuando la ronda no se fragmento,
  * "Diff de tu dominio" (con el recuento de ficheros) cuando si.
  */
@@ -155,7 +168,7 @@ export function peticionTemplate(
   fecha: string,
   commits: string,
   diff: string,
-  agenteRevisor: string,
+  skillRevisora: string,
   nombreInforme: string,
   alcanceDiff: string,
   extras: ExtrasPeticion = {}
@@ -180,7 +193,8 @@ export function peticionTemplate(
     `- Rama base: ${baseBranch}\n` +
     `- Commit revisado (HEAD): ${commitRevisado}\n` +
     `- Fecha: ${fecha}\n` +
-    `- Agente revisor sugerido: ${agenteRevisor}\n` +
+    `- Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})\n` +
+    `- Skill revisora a cargar: ${skillRevisora}\n` +
     (extras.carpetaTarea === undefined
       ? ''
       : `- Carpeta de la tarea: ${extras.carpetaTarea} (criterios de aceptacion y plan)\n`) +
@@ -349,6 +363,8 @@ export async function runReviewCommand(
   today: string,
   deps: ReviewCommandDeps
 ): Promise<ReviewCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_REVIEW, 'review', (m) => new ReviewCommandError(m));
   const { push, resto } = extraerPushFlag(argv);
   const id = resto[0];
   if (id === undefined || id.trim() === '') {
@@ -599,6 +615,8 @@ export async function runReviewCommand(
     commitRevisado,
     ronda,
     filePath: newFilePath,
+    agente: updated.agente_revisor,
+    modelo: updated.modelo_sugerido,
     informes,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index 8738f7a..2b1ae66 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -13,6 +13,7 @@
  * Asi `siguiente` da lo mismo desde la rama base que desde la de la tarea.
  */
 import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { readFile } from 'node:fs/promises';
 import { readTareaFile } from '../fs/task-store.js';
 import { parseTareaFile } from '../core/tarea-file.js';
@@ -21,6 +22,7 @@ import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
 import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
 import { commitRevisadoDe, veredictoDeRonda, type VeredictoInforme } from '../core/informe-revision.js';
 import {
+  INFORME_CODEX_RE,
   INFORME_REVISION_RE,
   informesDeUltimaRonda,
   nombresDeUltimaRonda,
@@ -35,11 +37,13 @@ import {
 } from '../fs/git.js';
 import type { Task } from '../core/task.js';
 import { REVISION_DIRNAME, PETICION_REVISION_RE } from './review.js';
-import { INFORME_CODEX_RE } from './codex-review.js';
 import { planRedactado } from './approve.js';
 
 export class SiguienteCommandError extends Error {}
 
+/** Flags de `taskctl siguiente`: solo --json. */
+export const FLAGS_SIGUIENTE: readonly string[] = ['--json'];
+
 export interface SiguienteCommandDeps {
   repoCwd: string;
 }
@@ -108,6 +112,8 @@ export async function runSiguienteCommand(
   argv: readonly string[],
   deps: SiguienteCommandDeps
 ): Promise<SiguienteCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_SIGUIENTE, 'siguiente', (m) => new SiguienteCommandError(m));
   const json = argv.includes('--json');
   const id = argv.find((a) => !a.startsWith('--'));
   if (id === undefined || id.trim() === '') {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index 3722f2f..22bd6fd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -12,7 +12,7 @@
  * llamar al script, en vez de delegar en su prompt interactivo.
  */
 import path from 'node:path';
-import { parseArgs } from '../cli/args.js';
+import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
 import {
   parseAsignadoAFlag,
   identidadUsable,
@@ -50,6 +50,9 @@ import { runGitflowScript } from '../fs/gitflow-runner.js';
 
 export class StartCommandError extends Error {}
 
+/** Flags de `taskctl start`: parseAsignadoAFlag (con su alias) y extraerPushFlag. */
+export const FLAGS_START: readonly string[] = ['--asignado-a', '--asignado_a', '--push', '-p'];
+
 const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
   feature: 'create-feature.sh',
   fix: 'create-fix.sh',
@@ -88,6 +91,8 @@ export async function runStartCommand(
   today: string,
   deps: StartCommandDeps
 ): Promise<StartCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_START, 'start', (m) => new StartCommandError(m));
   // --push fuera antes de nada (TASK-030): parseArgs trata
   // "--flag valor" como par y se habria comido el ID.
   const { push, resto } = extraerPushFlag(argv);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index 4dc340a..97d27c8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -21,6 +21,7 @@
  */
 import { readFile, writeFile } from 'node:fs/promises';
 import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { readTareaFile } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
@@ -34,6 +35,9 @@ import { REVISION_DIRNAME } from './review.js';
 
 export class VeredictoCommandError extends Error {}
 
+/** Flags de `taskctl veredicto`: extraerInforme y extraerPushFlag. */
+export const FLAGS_VEREDICTO: readonly string[] = ['--informe', '--push', '-p'];
+
 /** Valor del argumento → texto canonico de la linea. */
 export const VEREDICTOS = {
   aprobada: 'aprobada',
@@ -105,6 +109,8 @@ export async function runVeredictoCommand(
   argv: readonly string[],
   deps: VeredictoCommandDeps
 ): Promise<VeredictoCommandResult> {
+  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
+  rechazarFlagsDesconocidos(argv, FLAGS_VEREDICTO, 'veredicto', (m) => new VeredictoCommandError(m));
   const { push, resto: sinPush } = extraerPushFlag(argv);
   const { informe: informePedido, resto } = extraerInforme(sinPush);
   const [id, valor, ...sobra] = resto;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
index 30681cd..621156a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
@@ -31,6 +31,7 @@ import { readFileSync } from 'node:fs';
 import { fileURLToPath } from 'node:url';
 import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
+import { masParecida } from './sugerencia.js';
 import type { ReglaSeleccionSkill, Task } from './task.js';
 
 const MAX_TOTAL_SKILLS = 1000;
@@ -439,7 +440,7 @@ function mensajeClaveRepetida(donde: string, clave: string): string {
  * `total_skills`), a diferencia de CLAVES_HEURISTICA.
  */
 function mensajeClaveDesconocida(donde: string, clave: string, validas: ReadonlySet<string>): string {
-  const sugerida = claveMasParecida(clave, validas);
+  const sugerida = masParecida(clave, validas);
   const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
   if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
   lineas.push('        Borrala o corrigela: taskctl no usa un catalogo que no entiende.');
@@ -449,37 +450,6 @@ function mensajeClaveDesconocida(donde: string, clave: string, validas: Readonly
   return lineas.join('\n');
 }
 
-function claveMasParecida(clave: string, validas: ReadonlySet<string>): string | null {
-  let mejor: string | null = null;
-  let mejorDistancia = Number.POSITIVE_INFINITY;
-  for (const valida of validas) {
-    const d = distanciaEdicion(clave.toLowerCase(), valida);
-    if (d < mejorDistancia) {
-      mejorDistancia = d;
-      mejor = valida;
-    }
-  }
-  return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
-}
-
-/** Distancia de edicion (Levenshtein) a mano — cero dependencias. */
-function distanciaEdicion(a: string, b: string): number {
-  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
-  for (let i = 1; i <= a.length; i++) {
-    const actual = [i];
-    for (let j = 1; j <= b.length; j++) {
-      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
-      actual[j] = Math.min(
-        (actual[j - 1] as number) + 1,
-        (previa[j] as number) + 1,
-        (previa[j - 1] as number) + coste
-      );
-    }
-    previa = actual;
-  }
-  return previa[b.length] as number;
-}
-
 // --- Paso 1 de la seccion 6.6: solape de etiquetas + desempate --------
 
 export interface SeleccionSkill {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 34d3d4d..b80ee47 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -61,6 +61,7 @@
 import { existsSync, readFileSync, statSync } from 'node:fs';
 import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
+import { distanciaEdicion, masParecida } from './sugerencia.js';
 
 export class ConfigError extends Error {
   constructor(message: string) {
@@ -485,47 +486,13 @@ function motivoRutaInvalida(original: string): string | null {
  * literal: `limite_wp`.
  */
 function mensajeClaveDesconocida(donde: string, clave: string): string {
-  const sugerida = claveMasParecida(clave);
+  const sugerida = masParecida(clave, CLAVES_CONFIG);
   const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
   if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
   lineas.push(`        Claves validas: ${CLAVES_CONFIG.join(', ')}.`);
   return lineas.join('\n');
 }
 
-/** Distancia de edicion (Levenshtein) a mano — cero dependencias, como el resto. */
-function distanciaEdicion(a: string, b: string): number {
-  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
-  for (let i = 1; i <= a.length; i++) {
-    const actual = [i];
-    for (let j = 1; j <= b.length; j++) {
-      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
-      actual[j] = Math.min(
-        (actual[j - 1] as number) + 1,
-        (previa[j] as number) + 1,
-        (previa[j - 1] as number) + coste
-      );
-    }
-    previa = actual;
-  }
-  return previa[b.length] as number;
-}
-
-/** La clave valida mas cercana, si esta lo bastante cerca como para ser una errata. */
-function claveMasParecida(clave: string): string | null {
-  let mejor: string | null = null;
-  let mejorDistancia = Number.POSITIVE_INFINITY;
-  for (const valida of CLAVES_CONFIG) {
-    const d = distanciaEdicion(clave.toLowerCase(), valida);
-    if (d < mejorDistancia) {
-      mejorDistancia = d;
-      mejor = valida;
-    }
-  }
-  // Umbral: hasta un tercio de la clave. Sin el, "foo" propondria
-  // "rama_base" y el consejo dejaria de valer nada.
-  return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
-}
-
 /**
  * Texto no vacio. Se guarda RECORTADO: `rama_base: " develop "` es
  * develop, no " develop " — misma doctrina que personaDeTarea en
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
index 7f21c97..95e86c4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
@@ -93,6 +93,7 @@ import { readFileSync } from 'node:fs';
 import { fileURLToPath } from 'node:url';
 import path from 'node:path';
 import { parseBloqueClaveValor } from './frontmatter.js';
+import { masParecida } from './sugerencia.js';
 import { extraerSecciones, normalizarTexto } from './tarea-body.js';
 import type { Task, TaskComplexity, TaskType } from './task.js';
 
@@ -377,7 +378,7 @@ function validarEscalaDeNiveles(h: Heuristica, ruta: string): void {
  * que esta mal Y cuales son las validas.
  */
 function mensajeClaveDesconocida(donde: string, clave: string): string {
-  const sugerida = claveMasParecida(clave);
+  const sugerida = masParecida(clave, CLAVES_HEURISTICA);
   const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
   if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
   lineas.push('        Borrala o corrigela: taskctl no usa una heuristica que no entiende.');
@@ -385,39 +386,6 @@ function mensajeClaveDesconocida(donde: string, clave: string): string {
   return lineas.join('\n');
 }
 
-/** Distancia de edicion (Levenshtein) a mano — cero dependencias. */
-function distanciaEdicion(a: string, b: string): number {
-  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
-  for (let i = 1; i <= a.length; i++) {
-    const actual = [i];
-    for (let j = 1; j <= b.length; j++) {
-      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
-      actual[j] = Math.min(
-        (actual[j - 1] as number) + 1,
-        (previa[j] as number) + 1,
-        (previa[j - 1] as number) + coste
-      );
-    }
-    previa = actual;
-  }
-  return previa[b.length] as number;
-}
-
-function claveMasParecida(clave: string): string | null {
-  let mejor: string | null = null;
-  let mejorDistancia = Number.POSITIVE_INFINITY;
-  for (const valida of CLAVES_HEURISTICA) {
-    const d = distanciaEdicion(clave.toLowerCase(), valida);
-    if (d < mejorDistancia) {
-      mejorDistancia = d;
-      mejor = valida;
-    }
-  }
-  // Umbral: hasta un tercio de la clave, como en config.ts. Sin el,
-  // "foo" propondria una clave cualquiera y el consejo no valdria nada.
-  return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
-}
-
 /**
  * Entero >= 0. El cero SI es legitimo aqui, a diferencia de
  * `limite_wip` en config.ts: `agentes_brainstorm_trivial: 0` es la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/sugerencia.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/sugerencia.ts
new file mode 100644
index 0000000..0bdae1e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/sugerencia.ts
@@ -0,0 +1,41 @@
+/**
+ * «Quiza quisiste decir...»: la sugerencia ante una clave o un flag mal
+ * escritos. Una sola implementacion para config, heuristica, catalogo y los
+ * flags del CLI (TASK-047; antes habia tres copias privadas identicas).
+ */
+
+/** Distancia de edicion (Levenshtein) a mano — cero dependencias, como el resto. */
+export function distanciaEdicion(a: string, b: string): number {
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
+/**
+ * La clave valida mas cercana, si esta lo bastante cerca como para ser una
+ * errata. Umbral: hasta un tercio de la clave. Sin el, "foo" propondria
+ * cualquier cosa y el consejo dejaria de valer nada.
+ */
+export function masParecida(clave: string, validas: Iterable<string>): string | null {
+  let mejor: string | null = null;
+  let mejorDistancia = Number.POSITIVE_INFINITY;
+  for (const valida of validas) {
+    const d = distanciaEdicion(clave.toLowerCase(), valida);
+    if (d < mejorDistancia) {
+      mejorDistancia = d;
+      mejor = valida;
+    }
+  }
+  return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
index a0f518f..cb9c852 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -27,7 +27,9 @@
  * patron ya generalizaba. Lo unico que se amplio es el regex que le pasa
  * el llamador.
  */
-import { readdir } from 'node:fs/promises';
+import path from 'node:path';
+import { readdir, readFile } from 'node:fs/promises';
+import { veredictoAprobado } from '../core/informe-revision.js';
 import { isEnoent, isEnotdir } from './task-store.js';
 
 /**
@@ -125,6 +127,31 @@ export function nombresDeUltimaRonda(
   return { ronda, nombres };
 }
 
+/**
+ * Informes de la segunda opinion de Codex (TASK-020). Codex lleva su propio
+ * contador de ronda, independiente del de la revision primaria, y no se
+ * fragmenta por dominio. Vive aqui desde TASK-047: antes estaba copiada en
+ * finish.ts y en codex-review.ts.
+ */
+export const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
+
+/**
+ * true si la ronda de mayor N segun `patron` tiene al menos un informe y
+ * TODOS aprueban. Fail-closed (TASK-018): con la ronda fragmentada por
+ * dominio, basta con que uno de los N falte o siga en PENDIENTE para que no
+ * cuente como aprobada. Sin revision/ (la tarea nunca paso por `review`) da
+ * false, no un error. La puerta de `finish` y la de `codex-review` son esta
+ * misma funcion (TASK-047; antes codex-review la reimplementaba).
+ */
+export async function ultimaRondaAprobada(dir: string, patron: RegExp): Promise<boolean> {
+  const { nombres } = await informesDeUltimaRonda(dir, patron);
+  if (nombres.length === 0) return false;
+  const contenidos = await Promise.all(
+    nombres.map((nombre) => readFile(path.join(dir, nombre), 'utf8'))
+  );
+  return contenidos.every((c) => veredictoAprobado(c));
+}
+
 /** Primera ronda libre: la ultima que haya + 1. */
 export async function siguienteRonda(dir: string, patron: RegExp): Promise<number> {
   return (await ultimaRonda(dir, patron)) + 1;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-desconocidos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-desconocidos.test.ts
new file mode 100644
index 0000000..dbae6b2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/flags-desconocidos.test.ts
@@ -0,0 +1,163 @@
+/**
+ * TASK-047 (auditoria D4): un flag que el comando no conoce aborta en vez de
+ * ignorarse en silencio. Unitarios de rechazarFlagsDesconocidos y, contra
+ * repos Git temporales reales, los 13 comandos por main().
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { main } from '../../src/cli.js';
+import { rechazarFlagsDesconocidos } from '../../src/cli/args.js';
+
+class ErrorDePrueba extends Error {}
+const fail = (m: string): Error => new ErrorDePrueba(m);
+const VALIDOS = ['--titulo', '--complejidad', '--push', '-p'];
+
+function mensajeDe(argv: string[], validos: readonly string[] = VALIDOS): string | null {
+  try {
+    rechazarFlagsDesconocidos(argv, validos, 'new', fail);
+    return null;
+  } catch (e) {
+    assert.ok(e instanceof ErrorDePrueba);
+    return e.message;
+  }
+}
+
+test('rechazarFlagsDesconocidos: un flag valido pasa', () => {
+  assert.equal(mensajeDe(['--titulo', 'X', '--complejidad', 'trivial', '--push']), null);
+});
+
+test('rechazarFlagsDesconocidos: --complejida aborta con sugerencia y lista de validos', () => {
+  const m = mensajeDe(['--titulo', 'X', '--complejida', 'trivial']);
+  assert.ok(m !== null);
+  assert.match(m, /taskctl new: flag desconocido "--complejida"/);
+  assert.match(m, /Quiza quisiste decir "--complejidad"/);
+  assert.match(m, /Flags validos:/);
+});
+
+test('rechazarFlagsDesconocidos: --x=1 mira solo el nombre', () => {
+  assert.equal(mensajeDe(['--titulo=--x=1']), null);
+  const m = mensajeDe(['--inventado=1']);
+  assert.ok(m !== null);
+  assert.match(m, /flag desconocido "--inventado"/);
+});
+
+test('rechazarFlagsDesconocidos: -1 no es un flag', () => {
+  assert.equal(mensajeDe(['--titulo', 'X', '-1']), null);
+});
+
+test('rechazarFlagsDesconocidos: corto declarado pasa y no declarado aborta', () => {
+  assert.equal(mensajeDe(['-p']), null);
+  const m = mensajeDe(['-q']);
+  assert.ok(m !== null);
+  assert.match(m, /flag desconocido "-q"/);
+});
+
+test('rechazarFlagsDesconocidos: lista vacia dice que no admite flags', () => {
+  const m = mensajeDe(['--algo'], []);
+  assert.ok(m !== null);
+  assert.match(m, /no admite flags/);
+  assert.doesNotMatch(m, /Flags validos/);
+});
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+async function withTempRepoCwd(fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-flags-'));
+  const cwdAntes = process.cwd();
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    process.chdir(repoRoot);
+    await fn(repoRoot);
+  } finally {
+    process.chdir(cwdAntes);
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+async function captureOutput(fn: () => Promise<number>): Promise<{ code: number; stdout: string; stderr: string }> {
+  const outChunks: string[] = [];
+  const errChunks: string[] = [];
+  const originalOut = process.stdout.write.bind(process.stdout);
+  const originalErr = process.stderr.write.bind(process.stderr);
+  // eslint-disable-next-line @typescript-eslint/no-explicit-any
+  (process.stdout as any).write = (chunk: string) => {
+    outChunks.push(String(chunk));
+    return true;
+  };
+  // eslint-disable-next-line @typescript-eslint/no-explicit-any
+  (process.stderr as any).write = (chunk: string) => {
+    errChunks.push(String(chunk));
+    return true;
+  };
+  try {
+    const code = await fn();
+    return { code, stdout: outChunks.join(''), stderr: errChunks.join('') };
+  } finally {
+    process.stdout.write = originalOut;
+    process.stderr.write = originalErr;
+  }
+}
+
+test('main: "taskctl new --complejida" aborta con sugerencia y no crea tarea ni commit', async () => {
+  await withTempRepoCwd(async (repoRoot) => {
+    const commitsAntes = git(['rev-list', '--count', 'HEAD'], repoRoot);
+    const { code, stderr } = await captureOutput(() =>
+      main(['new', '--titulo', 'X', '--tipo', 'feature', '--complejida', 'trivial'])
+    );
+    assert.equal(code, 1);
+    assert.match(stderr, /taskctl new: flag desconocido "--complejida"/);
+    assert.match(stderr, /Quiza quisiste decir "--complejidad"/);
+    assert.equal(git(['rev-list', '--count', 'HEAD'], repoRoot), commitsAntes);
+    assert.equal(git(['status', '--porcelain'], repoRoot), '');
+    const entradas = await readdir(repoRoot);
+    assert.ok(!entradas.includes('tareas'), 'no debe crearse tareas/');
+  });
+});
+
+const COMANDOS: ReadonlyArray<{ cmd: string; args: string[] }> = [
+  { cmd: 'new', args: ['--titulo', 'X', '--tipo', 'feature'] },
+  { cmd: 'import', args: ['no-existe.md'] },
+  { cmd: 'board', args: [] },
+  { cmd: 'start', args: ['TASK-001'] },
+  { cmd: 'plan', args: ['TASK-001'] },
+  { cmd: 'approve', args: ['TASK-001'] },
+  { cmd: 'review', args: ['TASK-001'] },
+  { cmd: 'finish', args: ['TASK-001'] },
+  { cmd: 'codex-review', args: ['TASK-001'] },
+  { cmd: 'veredicto', args: ['TASK-001', 'aprobada'] },
+  { cmd: 'pausa', args: ['TASK-001'] },
+  { cmd: 'siguiente', args: ['TASK-001'] },
+  { cmd: 'cadena', args: ['abrir', 'TASK-001'] },
+];
+
+for (const { cmd, args } of COMANDOS) {
+  test(`main: "taskctl ${cmd}" con un flag inventado aborta antes de cualquier efecto`, async () => {
+    await withTempRepoCwd(async (repoRoot) => {
+      const commitsAntes = git(['rev-list', '--count', 'HEAD'], repoRoot);
+      const ramaAntes = git(['branch', '--show-current'], repoRoot);
+      const { code, stderr } = await captureOutput(() => main([cmd, ...args, '--inventado']));
+      assert.equal(code, 1);
+      assert.match(stderr, new RegExp(`taskctl ${cmd}: flag desconocido "--inventado"`));
+      assert.equal(git(['rev-list', '--count', 'HEAD'], repoRoot), commitsAntes);
+      assert.equal(git(['branch', '--show-current'], repoRoot), ramaAntes);
+      assert.equal(git(['status', '--porcelain'], repoRoot), '');
+      const entradas = await readdir(repoRoot);
+      assert.ok(!entradas.includes('tareas'), 'no debe crearse tareas/');
+    });
+  });
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index 2386119..f244607 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -354,9 +354,14 @@ test('main: "taskctl review" con un diff de 2 dominios imprime una linea de peti
       !lineasPeticion.some((l) => l.includes('code-quality-reviewer')),
       `tarea.md sola ya no genera peticion al generico: ${stdout}`
     );
-    // Una linea de "Lanza ese agente..." por cada peticion tambien.
-    const lineasLanza = stdout.split('\n').filter((linea) => linea.includes('Lanza ese agente'));
+    // Una linea de "Lanza el agente..." por cada peticion tambien, con el
+    // agente, el modelo y la skill de su grupo por separado (TASK-047).
+    const lineasLanza = stdout.split('\n').filter((linea) => linea.includes('Lanza el agente'));
     assert.equal(lineasLanza.length, 2, stdout);
+    assert.ok(
+      lineasLanza.some((l) => /\(modelo [^)]+\) cargando la skill "java-spring-reviewer"/.test(l)),
+      stdout
+    );
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
index b248648..9748c9b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -515,7 +515,14 @@ test('taskctl review: un diff que toca 1 dominio (java) genera 1 peticion con el
     assert.deepEqual(grupo.ficheros, ['src/main/java/com/acme/UserService.java']);
 
     const peticion = await readFile(grupo.peticionPath, 'utf8');
-    assert.match(peticion, /Agente revisor sugerido: java-spring-reviewer/);
+    // TASK-047: agente y skill por separado, y el modelo de la tarea.
+    assert.match(peticion, /Skill revisora a cargar: java-spring-reviewer/);
+    assert.ok(
+      peticion.includes(`Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})`),
+      peticion
+    );
+    assert.equal(result.agente, task.agente_revisor);
+    assert.equal(result.modelo, task.modelo_sugerido);
     assert.match(peticion, /UserService\.java/);
     // Desde TASK-034 tarea.md aparece en el --stat de excluidos, pero su
     // diff no se embebe.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/rondas-aprobada.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/rondas-aprobada.test.ts
new file mode 100644
index 0000000..2184fe4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/rondas-aprobada.test.ts
@@ -0,0 +1,69 @@
+/**
+ * TASK-047: `ultimaRondaAprobada` es la puerta compartida de finish y
+ * codex-review (antes codex-review la reimplementaba). Ficheros reales en
+ * un directorio temporal.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import {
+  INFORME_CODEX_RE,
+  INFORME_REVISION_RE,
+  ultimaRondaAprobada,
+} from '../../src/fs/rondas.js';
+
+async function conDir(fn: (dir: string) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskcode-rondas-'));
+  try {
+    await fn(dir);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+const informe = (veredicto: string): string => `# Informe\n\n- Veredicto: ${veredicto}\n`;
+
+test('sin directorio de revision: false, no un error', async () => {
+  await conDir(async (dir) => {
+    assert.equal(await ultimaRondaAprobada(path.join(dir, 'no-existe'), INFORME_REVISION_RE), false);
+  });
+});
+
+test('sin informes de la ronda: false', async () => {
+  await conDir(async (dir) => {
+    await writeFile(path.join(dir, 'peticion-revision-1.md'), 'x');
+    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), false);
+  });
+});
+
+test('solo cuenta la ultima ronda: la 1 aprobada no salva una 2 con cambios', async () => {
+  await conDir(async (dir) => {
+    await writeFile(path.join(dir, 'informe-revision-1.md'), informe('aprobada'));
+    await writeFile(path.join(dir, 'informe-revision-2.md'), informe('cambios-solicitados'));
+    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), false);
+    await writeFile(path.join(dir, 'informe-revision-3.md'), informe('aprobada-con-correcciones'));
+    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), true);
+  });
+});
+
+test('ronda fragmentada: basta un informe en PENDIENTE para que no apruebe', async () => {
+  await conDir(async (dir) => {
+    await writeFile(path.join(dir, 'informe-revision-1-java-spring-reviewer.md'), informe('aprobada'));
+    await writeFile(path.join(dir, 'informe-revision-1-angular-vue-reviewer.md'), informe('PENDIENTE'));
+    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), false);
+    await writeFile(path.join(dir, 'informe-revision-1-angular-vue-reviewer.md'), informe('aprobada'));
+    assert.equal(await ultimaRondaAprobada(dir, INFORME_REVISION_RE), true);
+  });
+});
+
+test('Codex lleva su propio contador y no se mezcla con la revision primaria', async () => {
+  await conDir(async (dir) => {
+    await mkdir(dir, { recursive: true });
+    await writeFile(path.join(dir, 'informe-revision-1.md'), informe('aprobada'));
+    assert.equal(await ultimaRondaAprobada(dir, INFORME_CODEX_RE), false);
+    await writeFile(path.join(dir, 'informe-codex-1.md'), informe('aprobada'));
+    assert.equal(await ultimaRondaAprobada(dir, INFORME_CODEX_RE), true);
+  });
+});
````

## Excluido del diff (24 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-047/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-047/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-047/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                              |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js                         | 52 ++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/asignado.js                     |  9 +++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                 |  5 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/board.js                   |  6 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                  |  5 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js            | 49 ++++++++++++++-----------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                  | 53 ++++++++++++-----------------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js                  |  6 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                     |  6 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/pausa.js                   |  5 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                    |  6 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                  | 19 ++++++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js               |  8 ++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                   |  6 +++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js               |  5 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/catalogo-skills.js             | 28 ++--------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                      | 31 ++-----------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heuristica.js                  | 30 ++----------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/sugerencia.js                  | 35 +++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js                        | 26 +++++++++++++++++++++++++-
 24 files changed, 218 insertions(+), 178 deletions(-)
````
