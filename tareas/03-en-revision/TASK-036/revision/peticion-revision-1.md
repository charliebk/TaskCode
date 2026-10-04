# Peticion de revision — TASK-036 (ronda 1)

- Tarea: TASK-036 — F1-T3 Veredicto con un comando e informe estructurado
- Rama revisada: feature/task-036-f1-t3-veredicto-con-un-comando-e-informe
- Rama base: develop
- Commit revisado (HEAD): f0df7dda2776105c368c6cd3094e3bef28f53f46
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-036 (criterios de aceptacion y plan)

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
f0df7dd feat(TASK-036): taskctl veredicto, gate tolerante al enfasis e informe con tabla
5ceac12 chore(TASK-036): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index f6b3358..b9e32c2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -105,6 +105,7 @@ taskctl approve TASK-NNN
 taskctl start   TASK-NNN [--asignado-a <persona>]
 taskctl review  TASK-NNN
 taskctl codex-review TASK-NNN
+taskctl veredicto TASK-NNN <valor> [--informe <nombre>]
 taskctl finish  TASK-NNN
 
 taskctl diagnose | pause [--push] | resume [<rama>] | recover [<rama>] | abort-merge
@@ -413,28 +414,27 @@ una vez por ronda; los mutantes, con el fichero de test concreto.
 hace **fail-closed** a proposito: una version anterior buscaba la palabra
 "aprobada" en cualquier parte y aprobaba literalmente "no aprobada".
 
-Escribir exactamente esto, sustituyendo la linea de la plantilla — **no anadir
-otra debajo**, porque *todas* las lineas de veredicto tienen que aprobar:
+**Escribirla con el comando, no a mano:**
+`taskctl veredicto TASK-NNN aprobada | aprobada-con-correcciones | cambios-solicitados`
+deja una unica linea canonica en lugar de todas las que hubiera (porque *todas*
+tienen que aprobar) y la commitea. En una ronda fragmentada por dominio, cada
+revisor firma la suya con `--informe <nombre>`.
 
-```
-- Veredicto: aprobada
-```
-
-Lo que falla, y por que:
+Lo que acepta el gate, y por que:
 
 | Linea | Resultado |
 |---|---|
 | `- Veredicto: aprobada` | pasa |
 | `- Veredicto: aprobada con correcciones` | pasa (empieza por `aprobada`) |
-| `- Veredicto: **APROBADO**` | falla: los asteriscos rompen el inicio |
+| `- Veredicto: **aprobada**` | pasa: el enfasis de markdown se ignora |
+| `- Veredicto: **APROBADO**` | falla: `aprobado` no es `aprobada` |
 | `- Veredicto: APROBADO CON CAMBIOS` | falla: `aprobado` no es `aprobada` |
 | `- Veredicto: cambios-solicitados` | falla, y es lo correcto si pides cambios |
 | `- Veredicto: PENDIENTE (...)` | falla: la plantilla sin sustituir |
 | `Veredicto: aprobada` (sin el guion) | falla: no cuenta como linea de veredicto |
 
-El matiz del veredicto va en el **cuerpo** del informe, no en esa linea. Un
-revisor que escriba su veredicto en su propio vocabulario bloquea el cierre y
-obliga a un commit de normalizacion.
+El matiz va en el **cuerpo** del informe, con la tabla de hallazgos de la
+plantilla (`ID | Severidad | Estado | Fichero`), no en esa linea.
 
 ## Trampas que cuestan tiempo
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index c5b519e..089a22d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -14,6 +14,7 @@ import { CatalogoSkillsError } from './core/catalogo-skills.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex-review.js';
+import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import {
   isWrapperCommand,
@@ -60,6 +61,8 @@ Uso:
   taskctl approve TASK-NNN [--push]
   taskctl review TASK-NNN [--push]
   taskctl codex-review TASK-NNN [--push]
+  taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
+                    [--informe <nombre>] [--push]
   taskctl finish TASK-NNN [--push]
   taskctl diagnose
   taskctl pause [--push]
@@ -67,7 +70,7 @@ Uso:
   taskctl recover [<rama>]
   taskctl abort-merge
 
-Comandos: new, import, board, start, plan, approve, review, codex-review, finish.
+Comandos: new, import, board, start, plan, approve, review, codex-review, veredicto, finish.
 Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
 --asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
 taskctl commitea SOLO los ficheros que el mismo escribe (nunca "git add -A"):
@@ -546,6 +549,33 @@ async function mainComando(argv: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'veredicto') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const result = await runVeredictoCommand(tareasRoot, argv.slice(1), { repoCwd });
+      process.stdout.write(
+        `Tarea ${result.id}: "${result.linea}" escrito en ${result.informePath} (ronda ${result.ronda}).
+`
+      );
+      printAutoCommit(result.autoCommit);
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof VeredictoCommandError ||
+        e instanceof StateMachineError ||
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
   if (cmd === 'codex-review') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
index 4b8bedc..2ef09e7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
@@ -32,7 +32,7 @@ import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
 import type { Task } from '../core/task.js';
 import { readTareaFile, isEexist, isEnoent } from '../fs/task-store.js';
-import { siguienteRonda } from '../fs/rondas.js';
+import { INFORME_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
 import { fenceFor } from '../core/markdown.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import {
@@ -59,7 +59,6 @@ export class CodexReviewCommandError extends Error {}
  * mas barato que acoplar codex-review.ts a un simbolo interno de otro
  * comando). Acepta el sufijo opcional de dominio de TASK-018.
  */
-const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 
 /**
  * Regex de la ronda de Codex. Codex lleva SU PROPIO contador de ronda,
@@ -108,26 +107,7 @@ export interface CodexReviewCommandResult {
  * paso por "taskctl review") da false, no un error.
  */
 async function revisionPrimariaAprobadaDe(revisionDir: string): Promise<boolean> {
-  let entries: string[];
-  try {
-    entries = await readdir(revisionDir);
-  } catch (e: unknown) {
-    if (isEnoent(e)) return false;
-    throw e;
-  }
-  let max = 0;
-  let nombres: string[] = [];
-  for (const entry of entries) {
-    const m = INFORME_REVISION_RE.exec(entry);
-    if (m === null) continue;
-    const n = Number(m[1]);
-    if (n > max) {
-      max = n;
-      nombres = [entry];
-    } else if (n === max) {
-      nombres.push(entry);
-    }
-  }
+  const { nombres } = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
   if (nombres.length === 0) return false;
   const contenidos = await Promise.all(
     nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8'))
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 02e21f4..09a911f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -23,6 +23,7 @@ import { parseTareaFile } from '../core/tarea-file.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
+import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
 import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
   isWorkspaceClean,
@@ -72,7 +73,6 @@ const DEVELOP_BRANCH = 'develop';
  * igual que antes de esta tarea — ninguna tarea ya cerrada, ni ninguna
  * en curso con revisiones antiguas, deja de reconocerse.
  */
-const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
 
 /**
@@ -95,7 +95,18 @@ export function veredictoAprobado(informe: string): boolean {
     .filter((l) => l.trim().toLowerCase().startsWith(prefijo));
   if (lineas.length === 0) return false;
   return lineas.every((linea) => {
-    const valor = linea.trim().slice(prefijo.length).trim().toLowerCase();
+    // TASK-036: se recorta el enfasis de markdown (`**aprobada**`,
+    // `_aprobada_`, comillas invertidas) que los revisores ponen solos.
+    // No afloja la regla: el valor sigue anclado a `^aprobada\b`, asi que
+    // "no aprobada" y "**no aprobada**" siguen fallando.
+    const valor = linea
+      .trim()
+      .slice(prefijo.length)
+      .trim()
+      .replace(/^[*_`]+/, '')
+      .replace(/[*_`]+$/, '')
+      .trim()
+      .toLowerCase();
     if (/\bpendiente\b/.test(valor) || valor.includes('cambios-solicitados')) return false;
     return /^aprobada\b/.test(valor);
   });
@@ -111,27 +122,7 @@ export function veredictoAprobado(informe: string): boolean {
  * todos, no solo el primero que se encuentre.
  */
 async function informesDeLaRonda(revisionDir: string, re: RegExp): Promise<string[]> {
-  let entries: string[];
-  try {
-    entries = await readdir(revisionDir);
-  } catch (e: unknown) {
-    if (isEnoent(e)) return [];
-    throw e;
-  }
-  let max = 0;
-  let nombres: string[] = [];
-  for (const entry of entries) {
-    const m = re.exec(entry);
-    if (m === null) continue;
-    const n = Number(m[1]);
-    if (n > max) {
-      max = n;
-      nombres = [entry];
-    } else if (n === max) {
-      nombres.push(entry);
-    }
-  }
-  if (nombres.length === 0) return [];
+  const { nombres } = await informesDeUltimaRonda(revisionDir, re);
   return Promise.all(nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8')));
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index e522a73..1cef0d5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -229,9 +229,18 @@ export function informeTemplate(task: Task, commitRevisado: string, ronda: numbe
     '- Revisor: (rellenar por el agente)\n' +
     // taskctl finish exige que TODAS las lineas "- Veredicto:" del
     // informe aprueben: hay que SUSTITUIR esta linea, no anadir otra.
-    '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados")\n\n' +
+    // TASK-036: el veredicto lo escribe `taskctl veredicto`, que deja la
+    // linea canonica y la commitea; escribirla a mano en otro vocabulario
+    // obligaba a commits de normalizacion.
+    '- Veredicto: PENDIENTE (escribelo con: taskctl veredicto ' +
+    `${task.id} aprobada | aprobada-con-correcciones | cambios-solicitados)\n\n` +
     '## Hallazgos\n\n' +
-    '(CRITICO / IMPORTANTE / MENOR con reproduccion, o "sin hallazgos" explicito.)\n'
+    // La tabla es para que una maquina la lea (la ronda incremental,
+    // TASK-040); la reproduccion de cada hallazgo va debajo, en prosa.
+    '| ID | Severidad | Estado | Fichero |\n' +
+    '|---|---|---|---|\n' +
+    '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) |\n\n' +
+    'Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.\n'
   );
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
new file mode 100644
index 0000000..9a0ff99
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -0,0 +1,177 @@
+/**
+ * `taskctl veredicto TASK-NNN <valor>` — TASK-036 (auditoria del
+ * 2026-10-03, A5).
+ *
+ * Escribe la linea `- Veredicto:` del informe de revision de la ultima
+ * ronda en su forma canonica y la commitea. Existe porque los revisores
+ * la escribian a mano en su propio vocabulario (`**APROBADO CON
+ * CAMBIOS**`, `**cambios-solicitados**`), el gate fail-closed de
+ * `finish` las rechazaba con razon, y cada vez hacia falta un commit de
+ * normalizacion; TASK-017 llego a cerrarse con un veredicto que el
+ * propio gate no acepta.
+ *
+ * Tres reglas:
+ * 1. Se sustituyen TODAS las lineas `- Veredicto:` por UNA, en la
+ *    posicion de la primera: `finish` exige que todas aprueben, y dejar
+ *    la de la plantilla debajo de la nueva bloquearia el cierre.
+ * 2. En una ronda fragmentada por dominio cada revisor firma su informe:
+ *    con varios informes en la ronda, `--informe` es obligatorio.
+ * 3. No cambia el estado de la tarea (accion `veredicto` de la maquina
+ *    de estados, solo en `en-revision`), igual que `codex-review`.
+ */
+import { readFile, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import { readTareaFile } from '../fs/task-store.js';
+import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
+import { REVISION_DIRNAME } from './review.js';
+
+export class VeredictoCommandError extends Error {}
+
+/** Valor del argumento → texto canonico de la linea. */
+export const VEREDICTOS = {
+  aprobada: 'aprobada',
+  'aprobada-con-correcciones': 'aprobada con correcciones',
+  'cambios-solicitados': 'cambios-solicitados',
+} as const;
+
+export type ValorVeredicto = keyof typeof VEREDICTOS;
+
+export interface VeredictoCommandDeps {
+  /** Directorio de trabajo del repo Git del usuario. */
+  repoCwd: string;
+}
+
+export interface VeredictoCommandResult {
+  id: string;
+  ronda: number;
+  informePath: string;
+  linea: string;
+  autoCommit: AutoCommitResult;
+}
+
+const PREFIJO = '- veredicto:';
+
+/**
+ * El informe con todas sus lineas `- Veredicto:` sustituidas por UNA
+ * linea canonica, en la posicion de la primera; null si no tenia
+ * ninguna. Mismo criterio de reconocimiento que `veredictoAprobado` de
+ * finish.ts (sin distinguir mayusculas, ignorando la sangria).
+ */
+export function sustituirVeredicto(informe: string, linea: string): string | null {
+  const lineas = informe.split('\n');
+  const esVeredicto = (l: string): boolean => l.trim().toLowerCase().startsWith(PREFIJO);
+  const primera = lineas.findIndex(esVeredicto);
+  if (primera === -1) return null;
+  const fin = lineas[primera]?.endsWith('\r') === true ? '\r' : '';
+  const resultado: string[] = [];
+  lineas.forEach((l, i) => {
+    if (i === primera) resultado.push(linea + fin);
+    else if (!esVeredicto(l)) resultado.push(l);
+  });
+  return resultado.join('\n');
+}
+
+/** Saca `--informe <nombre>` de argv. */
+function extraerInforme(argv: readonly string[]): { informe: string | null; resto: string[] } {
+  const resto: string[] = [];
+  let informe: string | null = null;
+  for (let i = 0; i < argv.length; i++) {
+    const arg = argv[i] as string;
+    if (arg === '--informe') {
+      const valor = argv[i + 1];
+      if (valor === undefined || valor.startsWith('--')) {
+        throw new VeredictoCommandError(
+          '[ERROR] --informe necesita el nombre del fichero: --informe informe-revision-N-<revisor>.md'
+        );
+      }
+      informe = valor;
+      i++;
+      continue;
+    }
+    resto.push(arg);
+  }
+  return { informe, resto };
+}
+
+export async function runVeredictoCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  deps: VeredictoCommandDeps
+): Promise<VeredictoCommandResult> {
+  const { push, resto: sinPush } = extraerPushFlag(argv);
+  const { informe: informePedido, resto } = extraerInforme(sinPush);
+  const [id, valor, ...sobra] = resto;
+  const uso =
+    'Uso: taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados> ' +
+    '[--informe <nombre>] [--push]';
+  if (id === undefined || id.trim() === '') {
+    throw new VeredictoCommandError(`[ERROR] Falta el ID de la tarea. ${uso}`);
+  }
+  if (valor === undefined || !(valor in VEREDICTOS)) {
+    throw new VeredictoCommandError(
+      `[ERROR] Veredicto ${valor === undefined ? 'ausente' : `"${valor}" no reconocido`}. ` +
+        `Valores: ${Object.keys(VEREDICTOS).join(', ')}. ${uso}`
+    );
+  }
+  if (sobra.length > 0) {
+    throw new VeredictoCommandError(`[ERROR] Argumentos de mas: ${sobra.join(' ')}. ${uso}`);
+  }
+
+  const existing = await readTareaFile(tareasRoot, id);
+  assertTransitionAllowed('veredicto', existing === null ? null : existing.task);
+  const { task, filePath } = existing as NonNullable<typeof existing>;
+
+  const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
+  const { ronda, nombres } = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
+  if (nombres.length === 0) {
+    throw new VeredictoCommandError(
+      `[ERROR] ${task.id} no tiene ningun informe-revision-N.md en ${revisionDir}. ` +
+        'Lo crea "taskctl review".'
+    );
+  }
+
+  let nombre: string;
+  if (informePedido !== null) {
+    if (!nombres.includes(informePedido)) {
+      throw new VeredictoCommandError(
+        `[ERROR] "${informePedido}" no es un informe de la ronda ${ronda}. ` +
+          `Los de esa ronda son: ${nombres.join(', ')}.`
+      );
+    }
+    nombre = informePedido;
+  } else if (nombres.length > 1) {
+    throw new VeredictoCommandError(
+      `[ERROR] La ronda ${ronda} de ${task.id} esta fragmentada en ${nombres.length} informes: ` +
+        `${nombres.join(', ')}. Cada revisor firma el suyo: anade --informe <nombre>.`
+    );
+  } else {
+    nombre = nombres[0] as string;
+  }
+
+  const informePath = path.join(revisionDir, nombre);
+  const contenido = await readFile(informePath, 'utf8');
+  const linea = `- Veredicto: ${VEREDICTOS[valor as ValorVeredicto]}`;
+  const nuevo = sustituirVeredicto(contenido, linea);
+  if (nuevo === null) {
+    throw new VeredictoCommandError(
+      `[ERROR] ${informePath} no tiene ninguna linea "- Veredicto:". Anade la de la plantilla ` +
+        '("- Veredicto: PENDIENTE") y vuelve a lanzar el comando.'
+    );
+  }
+  if (nuevo !== contenido) await writeFile(informePath, nuevo, 'utf8');
+
+  const commitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [informePath],
+    mensaje: mensajeChore(task.id, `veredicto ronda ${ronda} (${valor})`),
+    push,
+  });
+  return { id: task.id, ronda, informePath, linea, autoCommit: commitResult };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
index e259a2f..86ab117 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
@@ -17,6 +17,7 @@ export type TaskCommand =
   | 'start'
   | 'review'
   | 'codex-review'
+  | 'veredicto'
   | 'finish';
 
 export interface TransitionContext {
@@ -208,6 +209,21 @@ export function assertTransitionAllowed(
       return;
     }
 
+    case 'veredicto': {
+      // TASK-036: escribe la linea de veredicto del informe; no cambia el
+      // estado, igual que codex-review.
+      if (task.estado !== 'en-revision') {
+        throw err(
+          task.id,
+          command,
+          task.estado,
+          'taskctl review',
+          `esta en estado "${task.estado}", no en "en-revision". taskctl veredicto solo se usa con una revision abierta.`
+        );
+      }
+      return;
+    }
+
     case 'codex-review': {
       if (task.estado !== 'en-revision') {
         throw err(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
index c2eedd3..3e5ca36 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -68,6 +68,50 @@ export async function ultimaRonda(dir: string, patron: RegExp): Promise<number>
   return max;
 }
 
+/**
+ * Informes de la revision primaria. TASK-018: una ronda fragmentada por
+ * dominio deja uno por revisor, con el nombre de la skill como sufijo
+ * (`informe-revision-2-java-spring-reviewer.md`); el sufijo es opcional
+ * y una ronda sin fragmentar sigue dejando `informe-revision-<N>.md`.
+ * Vive aqui desde TASK-036: antes estaba copiada en finish.ts y en
+ * codex-review.ts.
+ */
+export const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
+
+/**
+ * Nombres de TODOS los ficheros de la ronda de mayor N segun `patron`
+ * (una ronda fragmentada deja varios con el mismo N), y ese N. Sin
+ * directorio, o si la ruta es un fichero, `{ ronda: 0, nombres: [] }`,
+ * igual que `ultimaRonda`. Unico sitio que decide "cual es la ultima
+ * ronda" (TASK-036): finish, codex-review y veredicto lo comparten.
+ */
+export async function informesDeUltimaRonda(
+  dir: string,
+  patron: RegExp
+): Promise<{ ronda: number; nombres: string[] }> {
+  let entries: string[];
+  try {
+    entries = await readdir(dir);
+  } catch (e: unknown) {
+    if (isEnoent(e) || isEnotdir(e)) return { ronda: 0, nombres: [] };
+    throw e;
+  }
+  let ronda = 0;
+  let nombres: string[] = [];
+  for (const entry of [...entries].sort()) {
+    const m = patron.exec(entry);
+    if (m === null || m[1] === undefined) continue;
+    const n = Number(m[1]);
+    if (n > ronda) {
+      ronda = n;
+      nombres = [entry];
+    } else if (n === ronda) {
+      nombres.push(entry);
+    }
+  }
+  return { ronda, nombres };
+}
+
 /** Primera ronda libre: la ultima que haya + 1. */
 export async function siguienteRonda(dir: string, patron: RegExp): Promise<number> {
   return (await ultimaRonda(dir, patron)) + 1;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts
new file mode 100644
index 0000000..502045e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts
@@ -0,0 +1,222 @@
+/**
+ * TASK-036: `taskctl veredicto`, el parser tolerante al enfasis y el
+ * helper unico de rondas. Repos Git temporales reales; la evidencia se
+ * lee del fichero y de `git log`, no de lo que devuelve la funcion.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import {
+  runVeredictoCommand,
+  sustituirVeredicto,
+  VeredictoCommandError,
+} from '../../src/commands/veredicto.js';
+import { veredictoAprobado } from '../../src/commands/finish.js';
+import { informeTemplate } from '../../src/commands/review.js';
+import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../../src/fs/rondas.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+function git(args: string[], cwd: string): string {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
+  return r.stdout;
+}
+
+const TASK: Task = {
+  id: 'TASK-940',
+  titulo: 'Prueba de veredicto',
+  tipo: 'feature',
+  sprint: 2,
+  etiquetas: ['cli'],
+  complejidad: 'simple',
+  modelo_sugerido: 'sonnet',
+  estado: 'en-revision',
+  plan_aprobado: true,
+  rama: 'feature/task-940-veredicto',
+  asignado_a: null,
+  agente_revisor: 'general-purpose',
+  skills_recomendados: [],
+  regla_seleccion_skill: null,
+  ultimo_commit_revisado: null,
+  revision_codex: false,
+  creado: '2026-10-03',
+  actualizado: '2026-10-03',
+  dependencias: [],
+};
+
+const INFORME_A_MANO =
+  '# Informe\n\n- Revisor: x\n- Veredicto: **APROBADO CON CAMBIOS**\n\n## Hallazgos\n\nM1.\n\n' +
+  '- Veredicto: PENDIENTE (de la plantilla)\n';
+
+/** Repo con la tarea en `estado` y los informes dados en revision/, todo commiteado. */
+async function withRepo(
+  informes: Record<string, string>,
+  fn: (repo: string, tareas: string, revisionDir: string) => Promise<void>,
+  estado: Task['estado'] = 'en-revision'
+): Promise<void> {
+  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-veredicto-'));
+  try {
+    git(['init', '-q', '-b', 'develop'], repo);
+    git(['config', 'user.email', 'test@example.com'], repo);
+    git(['config', 'user.name', 'Test'], repo);
+    git(['config', 'core.autocrlf', 'false'], repo);
+    const tareas = path.join(repo, 'tareas');
+    await writeTareaFile(tareas, { ...TASK, estado }, '## Objetivo\nProbar.\n');
+    const carpeta = estado === 'en-revision' ? '03-en-revision' : '02-en-curso';
+    const revisionDir = path.join(tareas, carpeta, TASK.id, 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    for (const [nombre, contenido] of Object.entries(informes)) {
+      await writeFile(path.join(revisionDir, nombre), contenido, 'utf8');
+    }
+    git(['add', '-A'], repo);
+    git(['commit', '-q', '-m', 'inicial'], repo);
+    await fn(repo, tareas, revisionDir);
+  } finally {
+    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+test('veredicto: deja UNA linea canonica en la posicion de la primera, la commitea y finish la acepta', async () => {
+  await withRepo(
+    { 'informe-revision-1.md': '# viejo\n- Veredicto: cambios-solicitados\n', 'informe-revision-2.md': INFORME_A_MANO },
+    async (repo, tareas, revisionDir) => {
+      const r = await runVeredictoCommand(tareas, ['TASK-940', 'aprobada-con-correcciones'], {
+        repoCwd: repo,
+      });
+      assert.equal(r.ronda, 2);
+      const informe = await readFile(path.join(revisionDir, 'informe-revision-2.md'), 'utf8');
+      const lineas = informe.split('\n').filter((l) => l.toLowerCase().startsWith('- veredicto:'));
+      assert.deepEqual(lineas, ['- Veredicto: aprobada con correcciones']);
+      assert.ok(
+        informe.indexOf('- Veredicto:') < informe.indexOf('## Hallazgos'),
+        'la linea tiene que quedar donde estaba la primera'
+      );
+      assert.ok(veredictoAprobado(informe), 'finish tiene que aceptar la linea que escribe el comando');
+      assert.equal(
+        git(['log', '-1', '--format=%s'], repo).trim(),
+        'chore(TASK-940): veredicto ronda 2 (aprobada-con-correcciones)'
+      );
+      assert.equal(git(['status', '--porcelain'], repo).trim(), '');
+      // La ronda 1 no se toca.
+      assert.match(
+        await readFile(path.join(revisionDir, 'informe-revision-1.md'), 'utf8'),
+        /cambios-solicitados/
+      );
+    }
+  );
+});
+
+test('veredicto: en una ronda fragmentada exige --informe y, con el, toca solo ese fichero', async () => {
+  const informes = {
+    'informe-revision-1-java-spring-reviewer.md': '- Veredicto: PENDIENTE\n',
+    'informe-revision-1-angular-vue-reviewer.md': '- Veredicto: PENDIENTE\n',
+  };
+  await withRepo(informes, async (repo, tareas, revisionDir) => {
+    const head = git(['rev-parse', 'HEAD'], repo).trim();
+    await assert.rejects(
+      runVeredictoCommand(tareas, ['TASK-940', 'aprobada'], { repoCwd: repo }),
+      (e: unknown) => e instanceof VeredictoCommandError && /--informe/.test(e.message)
+    );
+    assert.equal(git(['rev-parse', 'HEAD'], repo).trim(), head, 'sin --informe no se commitea nada');
+
+    await runVeredictoCommand(
+      tareas,
+      ['TASK-940', 'aprobada', '--informe', 'informe-revision-1-java-spring-reviewer.md'],
+      { repoCwd: repo }
+    );
+    assert.match(
+      await readFile(path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'), 'utf8'),
+      /^- Veredicto: aprobada$/m
+    );
+    assert.match(
+      await readFile(path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'), 'utf8'),
+      /PENDIENTE/
+    );
+  });
+});
+
+test('veredicto: fuera de en-revision aborta por la maquina de estados', async () => {
+  await withRepo(
+    { 'informe-revision-1.md': '- Veredicto: PENDIENTE\n' },
+    async (repo, tareas) => {
+      await assert.rejects(
+        runVeredictoCommand(tareas, ['TASK-940', 'aprobada'], { repoCwd: repo }),
+        StateMachineError
+      );
+    },
+    'en-curso'
+  );
+});
+
+test('veredicto: un informe sin linea de veredicto o un valor desconocido dan error sin commit', async () => {
+  await withRepo({ 'informe-revision-1.md': '# sin veredicto\n' }, async (repo, tareas) => {
+    const head = git(['rev-parse', 'HEAD'], repo).trim();
+    await assert.rejects(
+      runVeredictoCommand(tareas, ['TASK-940', 'aprobada'], { repoCwd: repo }),
+      (e: unknown) => e instanceof VeredictoCommandError && /ninguna linea/.test(e.message)
+    );
+    await assert.rejects(
+      runVeredictoCommand(tareas, ['TASK-940', 'APROBADO'], { repoCwd: repo }),
+      (e: unknown) => e instanceof VeredictoCommandError && /no reconocido/.test(e.message)
+    );
+    assert.equal(git(['rev-parse', 'HEAD'], repo).trim(), head);
+  });
+});
+
+test('veredictoAprobado (TASK-036): tolera el enfasis de markdown sin aflojar la regla', () => {
+  const pasa = ['**aprobada**', '_aprobada_', '`aprobada`', '**aprobada con correcciones**', 'aprobada'];
+  const falla = [
+    'no aprobada',
+    '**no aprobada**',
+    '**APROBADO**',
+    '**cambios-solicitados**',
+    'PENDIENTE (escribelo con: taskctl veredicto TASK-1 aprobada | cambios-solicitados)',
+  ];
+  for (const v of pasa) assert.ok(veredictoAprobado(`- Veredicto: ${v}\n`), `deberia pasar: ${v}`);
+  for (const v of falla) assert.ok(!veredictoAprobado(`- Veredicto: ${v}\n`), `deberia fallar: ${v}`);
+  // El scaffold nuevo tampoco aprueba sin tocarlo.
+  assert.ok(!veredictoAprobado(informeTemplate(TASK, 'abc123', 1)));
+  assert.match(informeTemplate(TASK, 'abc123', 1), /\| ID \| Severidad \| Estado \| Fichero \|/);
+});
+
+test('sustituirVeredicto: conserva el CRLF y devuelve null sin linea', () => {
+  assert.equal(
+    sustituirVeredicto('a\r\n- Veredicto: x\r\nb\r\n', '- Veredicto: aprobada'),
+    'a\r\n- Veredicto: aprobada\r\nb\r\n'
+  );
+  assert.equal(sustituirVeredicto('nada\n', '- Veredicto: aprobada'), null);
+});
+
+test('informesDeUltimaRonda: sin directorio, ruta que es fichero, y varios del mismo N junto a otros de N menor', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-rondas-'));
+  try {
+    assert.deepEqual(await informesDeUltimaRonda(path.join(dir, 'no-existe'), INFORME_REVISION_RE), {
+      ronda: 0,
+      nombres: [],
+    });
+    await writeFile(path.join(dir, 'fichero'), 'x', 'utf8');
+    assert.deepEqual(await informesDeUltimaRonda(path.join(dir, 'fichero'), INFORME_REVISION_RE), {
+      ronda: 0,
+      nombres: [],
+    });
+    for (const n of [
+      'informe-revision-1.md',
+      'informe-revision-2-b-reviewer.md',
+      'informe-revision-2-a-reviewer.md',
+      'peticion-revision-3.md',
+    ]) {
+      await writeFile(path.join(dir, n), 'x', 'utf8');
+    }
+    assert.deepEqual(await informesDeUltimaRonda(dir, INFORME_REVISION_RE), {
+      ronda: 2,
+      nombres: ['informe-revision-2-a-reviewer.md', 'informe-revision-2-b-reviewer.md'],
+    });
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-036/tarea.md                                                                        |  40 -------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-036/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-036/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-036/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-036/planificacion/plan-final.md                                    |   0
 tareas/02-en-curso/TASK-036/tarea.md                                                                         |  63 ++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  28 ++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js                               |  32 +++-----------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  44 ++++++++++-----------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |  13 ++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js                                  | 136 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js                                  |   8 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js                                           |  43 ++++++++++++++++++++++++++
 13 files changed, 307 insertions(+), 100 deletions(-)
````
