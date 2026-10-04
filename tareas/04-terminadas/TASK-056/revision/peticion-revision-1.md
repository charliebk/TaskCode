# Peticion de revision — TASK-056 (ronda 1)

- Tarea: TASK-056 — Flujo B: nucleo determinista del siguiente paso y registro de transiciones
- Rama revisada: feature/task-056-flujo-b-nucleo-determinista-del-siguient
- Rama base: develop
- Commit revisado (HEAD): 66d4565af7cc266443c014a347b1885b6d5f0eab
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-056 (criterios de aceptacion y plan)

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
66d4565 feat(TASK-056): taskctl siguiente, modo_flujo y registro de transiciones
eef3247 chore(TASK-056): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index ae9ab6e..86c73c3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -16,6 +16,8 @@ import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex-review.js';
 import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
+import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
+import { runPausaCommand, PausaCommandError } from './commands/pausa.js';
 import {
   isWrapperCommand,
   runWrapperCommand,
@@ -59,19 +61,25 @@ Uso:
   taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
-  taskctl approve TASK-NNN [--push]
+  taskctl approve TASK-NNN [--decidido-por persona|automatico] [--push]
   taskctl review TASK-NNN [--push]
   taskctl codex-review TASK-NNN [--push]
   taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
                     [--informe <nombre>] [--push]
   taskctl finish TASK-NNN [--push]
+  taskctl siguiente TASK-NNN [--json]
+  taskctl pausa TASK-NNN [--push]
   taskctl diagnose
   taskctl pause [--push]
   taskctl resume [<rama>]
   taskctl recover [<rama>]
   taskctl abort-merge
 
-Comandos: new, import, board, start, plan, approve, review, codex-review, veredicto, finish.
+Comandos: new, import, board, start, plan, approve, review, codex-review, veredicto, finish,
+siguiente, pausa.
+siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
+manual, semiautomatico o automatico); solo lee. pausa registra que la persona
+no quiere pasar todavia a la siguiente fase.
 Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
 --asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
 taskctl commitea SOLO los ficheros que el mismo escribe (nunca "git add -A"):
@@ -574,6 +582,61 @@ async function mainComando(argv: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'siguiente') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const r = await runSiguienteCommand(tareasRoot, argv.slice(1), { repoCwd });
+      if (r.json) {
+        const { json: _json, ...salida } = r;
+        process.stdout.write(`${JSON.stringify(salida)}\n`);
+      } else {
+        process.stdout.write(
+          `Tarea ${r.id} (${r.estado}, modo ${r.modo}): siguiente fase "${r.fase}" — ${r.motivo}.\n` +
+            (r.comando === null ? '' : `Comando: ${r.comando}\n`) +
+            `Accion: ${r.accion}.\n`
+        );
+      }
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof ConfigError ||
+        e instanceof SiguienteCommandError ||
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
+  if (cmd === 'pausa') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const r = await runPausaCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+      process.stdout.write(
+        `Tarea ${r.id}: pausa registrada en ${r.filePath}. Para seguir: taskctl siguiente ${r.id}.\n`
+      );
+      printAutoCommit(r.autoCommit);
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof PausaCommandError ||
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
   if (cmd === 'veredicto') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 1c412d7..267ee3c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -20,6 +20,13 @@
 import path from 'node:path';
 import type { Task } from '../core/task.js';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
+import {
+  registrarTransicion,
+  modoCongelado,
+  DECIDIDO_POR,
+  type DecididoPor,
+} from '../core/transiciones.js';
+import { resolverConfig } from '../core/config.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { planTemplate, resolverPlanFinal, type PlanFinalUbicacion } from './plan.js';
 import { readFile } from 'node:fs/promises';
@@ -94,7 +101,8 @@ export async function runApproveCommand(
 ): Promise<ApproveCommandResult> {
   // --push se saca ANTES de leer el ID: es booleano puro y va delante
   // o detras indistintamente ("taskctl approve --push TASK-030").
-  const { push, resto } = extraerPushFlag(argv);
+  const { push, resto: sinPush } = extraerPushFlag(argv);
+  const { decididoPor, resto } = extraerDecididoPor(sinPush);
   const id = resto[0];
   if (id === undefined || id.trim() === '') {
     throw new ApproveCommandError('[ERROR] Falta el ID de la tarea: taskctl approve TASK-NNN.');
@@ -138,18 +146,35 @@ export async function runApproveCommand(
   // roles se eligen en un orden fijo, asi que solo hay 0..N prefijos), no
   // con textos copiados, para que siga valiendo si la plantilla cambia.
   const rutaPlan = ubicacion!.canonicaExiste ? ubicacion!.canonica : ubicacion!.legada;
-  const plantillas = Array.from({ length: ROLES_BRAINSTORM.length + 1 }, (_, k) =>
-    planTemplate(task, seleccionarRoles(k))
-  );
-  if (planEsEsqueleto(await readFile(rutaPlan, 'utf8'), plantillas)) {
+  if (await planEsPlantilla(task, rutaPlan)) {
     throw new ApproveCommandError(
       `[ERROR] ${task.id}: "${rutaPlan}" es la plantilla sin rellenar: no hay plan que aprobar. ` +
         'Redactalo (enfoque, riesgos, pruebas) y reintenta "taskctl approve".'
     );
   }
 
+  // TASK-056: la aprobacion automatica solo vale si la tarea se planifico
+  // en modo automatico (modo congelado en su registro). Cambiar el config
+  // despues de plan no la habilita: firmaria un plan cuyas preguntas nadie
+  // contesto pensando en un flujo sin persona.
+  if (decididoPor === 'automatico') {
+    const congelado = modoCongelado(body);
+    if (congelado !== 'automatico') {
+      throw new ApproveCommandError(
+        `[ERROR] ${task.id}: no se puede aprobar como automatico: la tarea se planifico en modo ` +
+          `"${congelado ?? 'sin registrar'}", no "automatico". La aprobacion la tiene que dar una ` +
+          `persona: taskctl approve ${task.id} (sin --decidido-por automatico).`
+      );
+    }
+  }
+
   const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
-  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+  // Reaprobar un plan ya aprobado no es una transicion: sin fila nueva, y
+  // asi la segunda vez sigue sin crear commit (es idempotente).
+  const conRegistro = task.plan_aprobado
+    ? body
+    : registrarTransicion(body, 'approve', today, resolverConfig(deps.repoCwd).modo_flujo, decididoPor);
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
   // Paso 5 de la 8.3 (TASK-030, item C2). "approve" no cambia el
   // estado de la tarea, asi que origen y destino son la MISMA carpeta;
@@ -164,3 +189,51 @@ export async function runApproveCommand(
 
   return { id: task.id, filePath: newFilePath, baseBranchGuard, autoCommit: commitResult };
 }
+
+/**
+ * `--decidido-por persona|automatico` (TASK-056), en cualquier posicion
+ * detras del ID; `--decidido-por=valor` tambien. Por defecto, persona. Un
+ * valor desconocido aborta: no se adivina quien aprobo.
+ */
+function extraerDecididoPor(argv: readonly string[]): { decididoPor: DecididoPor; resto: string[] } {
+  const resto: string[] = [];
+  let valor: string | undefined;
+  for (let i = 0; i < argv.length; i++) {
+    const a = argv[i] as string;
+    if (a === '--decidido-por') {
+      // Sin valor detras no se cae a "persona" en silencio.
+      valor = argv[i + 1] ?? '';
+      i++;
+    } else if (a.startsWith('--decidido-por=')) {
+      valor = a.slice('--decidido-por='.length);
+    } else {
+      resto.push(a);
+    }
+  }
+  if (valor === undefined) return { decididoPor: 'persona', resto };
+  if (!(DECIDIDO_POR as readonly string[]).includes(valor)) {
+    throw new ApproveCommandError(
+      `[ERROR] --decidido-por "${valor}" no es valido. Valores: ${DECIDIDO_POR.join(', ')}.`
+    );
+  }
+  return { decididoPor: valor as DecididoPor, resto };
+}
+
+/**
+ * ¿El plan-final.md es la plantilla sin rellenar? Se compara con las
+ * plantillas posibles (los roles se eligen en un orden fijo, asi que solo
+ * hay 0..N prefijos). Lo comparten approve y `taskctl siguiente` (TASK-056).
+ */
+export async function planEsPlantilla(task: Task, rutaPlan: string): Promise<boolean> {
+  const plantillas = Array.from({ length: ROLES_BRAINSTORM.length + 1 }, (_, k) =>
+    planTemplate(task, seleccionarRoles(k))
+  );
+  return planEsEsqueleto(await readFile(rutaPlan, 'utf8'), plantillas);
+}
+
+/** ¿La tarea tiene un plan-final.md redactado (existe y no es la plantilla)? */
+export async function planRedactado(task: Task, taskDir: string): Promise<boolean> {
+  const u = await resolverPlanFinal(taskDir);
+  if (!planFinalExisteEn(u)) return false;
+  return !(await planEsPlantilla(task, u.canonicaExiste ? u.canonica : u.legada));
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 09771bc..afe488c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -23,6 +23,8 @@ import { parseTareaFile } from '../core/tarea-file.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
+import { registrarTransicion } from '../core/transiciones.js';
+import { resolverConfig } from '../core/config.js';
 import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
 import { veredictoAprobado } from '../core/informe-revision.js';
 import { casillasSinMarcar } from '../core/validacion-tarea.js';
@@ -435,7 +437,8 @@ export async function runFinishCommand(
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
 
   const updated: Task = { ...task, estado: 'terminada', actualizado: today };
-  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+  const conRegistro = registrarTransicion(body, 'finish', today, resolverConfig(deps.repoCwd).modo_flujo);
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
   // Renderizado de cierre (criterio 3): plantillas desde el
   // frontmatter. BOARD.md se regenera entero reutilizando el mismo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
new file mode 100644
index 0000000..d76505b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
@@ -0,0 +1,81 @@
+/**
+ * `taskctl pausa TASK-NNN [--push]` — TASK-056.
+ *
+ * El «no» del modo semiautomatico: la persona decide no pasar todavia a la
+ * siguiente fase. No cambia el estado de la tarea; deja una fila `pausa` en
+ * su registro de transiciones y la commitea, para que el historico muestre
+ * tambien las decisiones de no seguir (decision de Carlos, 2026-10-04).
+ *
+ * Se escribe donde la tarea esta al dia: si su copia actual vive en su rama
+ * y no se esta en ella, aborta y dice a que rama cambiar (escribir la fila
+ * en la copia vieja de la rama base la perderia en el merge).
+ */
+import path from 'node:path';
+import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
+import { resolverConfig } from '../core/config.js';
+import { registrarTransicion } from '../core/transiciones.js';
+import { currentBranch, isAncestor, localBranchExists } from '../fs/git.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
+
+export class PausaCommandError extends Error {}
+
+export interface PausaCommandDeps {
+  repoCwd: string;
+}
+
+export interface PausaCommandResult {
+  id: string;
+  filePath: string;
+  autoCommit: AutoCommitResult;
+}
+
+export async function runPausaCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: PausaCommandDeps
+): Promise<PausaCommandResult> {
+  const { push, resto } = extraerPushFlag(argv);
+  const id = resto[0];
+  if (id === undefined || id.trim() === '' || id.startsWith('--')) {
+    throw new PausaCommandError('[ERROR] Falta el ID de la tarea: taskctl pausa TASK-NNN.');
+  }
+  const modoConfig = resolverConfig(deps.repoCwd).modo_flujo;
+
+  const leida = await readTareaFile(tareasRoot, id);
+  if (leida === null) {
+    throw new PausaCommandError(
+      `[ERROR] ${id}: no se encuentra en el working tree de la rama actual. Cambiate a la rama ` +
+        'donde esta la tarea y reintenta.'
+    );
+  }
+  const { task, body, filePath } = leida;
+  if (task.estado === 'terminada') {
+    throw new PausaCommandError(`[ERROR] ${id}: ya esta terminada; no hay fase que pausar.`);
+  }
+  if (
+    currentBranch(deps.repoCwd) !== task.rama &&
+    localBranchExists(task.rama, deps.repoCwd) &&
+    !isAncestor(task.rama, 'HEAD', deps.repoCwd)
+  ) {
+    throw new PausaCommandError(
+      `[ERROR] ${id}: la copia al dia de la tarea esta en su rama, "${task.rama}". ` +
+        `Cambia a ella (git checkout ${task.rama}) y reintenta; no se ha tocado nada.`
+    );
+  }
+
+  const conRegistro = registrarTransicion(body, 'pausa', today, modoConfig, 'persona');
+  const nuevo = await moveTareaFile(tareasRoot, filePath, task, conRegistro);
+  const commit = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [path.dirname(nuevo)],
+    mensaje: mensajeChore(id, 'pausa registrada'),
+    push,
+  });
+  return { id, filePath: nuevo, autoCommit: commit };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 20f5b29..4a084a6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -32,6 +32,8 @@ import {
 } from '../cli/asignado.js';
 import type { Task, ReglaSeleccionSkill } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
+import { registrarTransicion } from '../core/transiciones.js';
+import { resolverConfig } from '../core/config.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
 import {
@@ -996,7 +998,9 @@ export async function runPlanCommand(
       )
     );
   }
-  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+  // TASK-056: la fila de plan congela el modo de flujo del config en la tarea.
+  const conRegistro = registrarTransicion(body, 'plan', today, resolverConfig(deps.repoCwd).modo_flujo);
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
   const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
 
   // Paso 5 de la 8.3 (TASK-030, item C2): la carpeta de ORIGEN entra
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 52f2cee..5a67219 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -30,6 +30,7 @@ import path from 'node:path';
 import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
 import { STATE_FOLDER, type Task } from '../core/task.js';
 import { resolverConfig } from '../core/config.js';
+import { registrarTransicion } from '../core/transiciones.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
 import {
@@ -564,7 +565,8 @@ export async function runReviewCommand(
     );
   }
 
-  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+  const conRegistro = registrarTransicion(body, 'review', today, resolverConfig(deps.repoCwd).modo_flujo);
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
   const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
   const informes: RevisionGrupo[] = escrituras.map((escritura) => ({
     revisor: escritura.revisor,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
new file mode 100644
index 0000000..a93595d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -0,0 +1,158 @@
+/**
+ * `taskctl siguiente TASK-NNN [--json]` — TASK-056.
+ *
+ * Dice que fase toca y que hacer con ella (detener, preguntar o continuar)
+ * segun el estado de la tarea y su modo de flujo. Es lo que leen las fases
+ * guiadas: ellas no deciden, ejecutan lo que esto devuelve. Solo lee: no
+ * escribe ni commitea nada.
+ *
+ * DE DONDE LEE. Del working tree, salvo un caso: si la tarea tiene su rama
+ * en local, no se esta en ella y esa rama no esta integrada en la actual,
+ * la tarea vive alli (desde `start`, la rama base solo tiene la copia
+ * anterior). Entonces se lee de la rama con `git show`, tarea y revision/.
+ * Asi `siguiente` da lo mismo desde la rama base que desde la de la tarea.
+ */
+import path from 'node:path';
+import { readFile } from 'node:fs/promises';
+import { readTareaFile } from '../fs/task-store.js';
+import { parseTareaFile } from '../core/tarea-file.js';
+import { resolverConfig, type ModoFlujo } from '../core/config.js';
+import { modoDeTarea } from '../core/transiciones.js';
+import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
+import { veredictoAprobado, veredictoDeRonda } from '../core/informe-revision.js';
+import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
+import {
+  currentBranch,
+  isAncestor,
+  localBranchExists,
+  lsTreeNames,
+  showFileAtRef,
+} from '../fs/git.js';
+import type { Task } from '../core/task.js';
+import { REVISION_DIRNAME } from './review.js';
+import { INFORME_CODEX_RE } from './codex-review.js';
+import { planRedactado } from './approve.js';
+
+export class SiguienteCommandError extends Error {}
+
+export interface SiguienteCommandDeps {
+  repoCwd: string;
+}
+
+export interface SiguienteCommandResult extends SiguientePaso {
+  id: string;
+  estado: Task['estado'];
+  modo: ModoFlujo;
+  /** De donde se leyo la tarea: el working tree o la rama de la tarea. */
+  leidaDe: 'working-tree' | 'rama';
+  /** true si se pidio --json. */
+  json: boolean;
+}
+
+/** Textos de los informes de la ultima ronda que casan con `re`, dados sus nombres y un lector. */
+async function ultimaRonda(
+  nombres: readonly string[],
+  re: RegExp,
+  leer: (nombre: string) => Promise<string>
+): Promise<string[]> {
+  let ronda = 0;
+  let deLaRonda: string[] = [];
+  for (const n of [...nombres].sort()) {
+    const m = re.exec(n);
+    if (m === null || m[1] === undefined) continue;
+    const r = Number(m[1]);
+    if (r > ronda) {
+      ronda = r;
+      deLaRonda = [n];
+    } else if (r === ronda) {
+      deLaRonda.push(n);
+    }
+  }
+  return Promise.all(deLaRonda.map(leer));
+}
+
+function contextoDeRevision(informes: string[], informesCodex: string[]): Omit<ContextoFlujo, 'planRedactado'> {
+  return {
+    veredicto: informes.length === 0 ? null : veredictoDeRonda(informes),
+    codexAprobada: informesCodex.length > 0 && informesCodex.every((i) => veredictoAprobado(i)),
+  };
+}
+
+export async function runSiguienteCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  deps: SiguienteCommandDeps
+): Promise<SiguienteCommandResult> {
+  const json = argv.includes('--json');
+  const id = argv.find((a) => !a.startsWith('--'));
+  if (id === undefined || id.trim() === '') {
+    throw new SiguienteCommandError('[ERROR] Falta el ID de la tarea: taskctl siguiente TASK-NNN [--json].');
+  }
+  // Config roto: ConfigError, que el CLI convierte en salida != 0.
+  const modoConfig = resolverConfig(deps.repoCwd).modo_flujo;
+
+  const local = await readTareaFile(tareasRoot, id);
+  if (local === null) {
+    throw new SiguienteCommandError(
+      `[ERROR] ${id}: no se encuentra en el working tree de la rama actual. ` +
+        'Si existe en otra rama, cambiate a esa rama o a la rama base y reintenta.'
+    );
+  }
+
+  const rama = local.task.rama;
+  const enOtraRama =
+    currentBranch(deps.repoCwd) !== rama &&
+    localBranchExists(rama, deps.repoCwd) &&
+    !isAncestor(rama, 'HEAD', deps.repoCwd);
+
+  let task: Task;
+  let body: string;
+  let ctx: ContextoFlujo;
+  if (enOtraRama) {
+    const enRama = lsTreeNames(rama, 'tareas', deps.repoCwd);
+    const rutaTarea = enRama.find((n) => n.endsWith(`/${id}/tarea.md`));
+    if (rutaTarea === undefined) {
+      throw new SiguienteCommandError(
+        `[ERROR] ${id}: la rama "${rama}" existe pero no contiene la tarea. Revisa la rama a mano.`
+      );
+    }
+    ({ task, body } = parseTareaFile(showFileAtRef(rama, rutaTarea, deps.repoCwd)));
+    const dirRevision = `${path.posix.dirname(rutaTarea)}/${REVISION_DIRNAME}/`;
+    const nombres = enRama
+      .filter((n) => n.startsWith(dirRevision))
+      .map((n) => n.slice(dirRevision.length));
+    const leer = async (n: string) => showFileAtRef(rama, dirRevision + n, deps.repoCwd);
+    ctx = {
+      // En la rama la tarea ya paso por start: el plan dejo de importar.
+      planRedactado: true,
+      ...contextoDeRevision(
+        await ultimaRonda(nombres, INFORME_REVISION_RE, leer),
+        await ultimaRonda(nombres, INFORME_CODEX_RE, leer)
+      ),
+    };
+  } else {
+    ({ task, body } = local);
+    const taskDir = path.dirname(local.filePath);
+    const revisionDir = path.join(taskDir, REVISION_DIRNAME);
+    const leer = (dir: string) => async (n: string) => readFile(path.join(dir, n), 'utf8');
+    const primarios = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
+    const codex = await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE);
+    ctx = {
+      planRedactado: task.estado === 'en-diseno' ? await planRedactado(task, taskDir) : true,
+      ...contextoDeRevision(
+        await Promise.all(primarios.nombres.map(leer(revisionDir))),
+        await Promise.all(codex.nombres.map(leer(revisionDir)))
+      ),
+    };
+  }
+
+  const modo = modoDeTarea(body, modoConfig);
+  return {
+    id: task.id,
+    estado: task.estado,
+    modo,
+    leidaDe: enOtraRama ? 'rama' : 'working-tree',
+    json,
+    ...siguienteFase(task, ctx, modo),
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index 527d29f..3722f2f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -30,6 +30,7 @@ import {
   personaDeTarea,
 } from '../core/wip.js';
 import { resolverConfig } from '../core/config.js';
+import { registrarTransicion } from '../core/transiciones.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import {
   isWorkspaceClean,
@@ -285,7 +286,8 @@ export async function runStartCommand(
   // ver comentario de MoveTareaFileOptions en task-store.ts. task/body
   // ya se leyeron en memoria antes de invocar el script, asi que no se
   // pierde nada.
-  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body, {
+  const conRegistro = registrarTransicion(body, 'start', today, resolverConfig(deps.repoCwd).modo_flujo);
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro, {
     tolerateMissingSource: true,
   });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 594a0a3..34d3d4d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -12,6 +12,7 @@
  * | rutas_sincronizacion         | []                | fs/sincronizacion.ts    |
  * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
  * | excluir_de_revision          | dist, locks, tareas | commands/review.ts    |
+ * | modo_flujo                   | manual            | core/flujo.ts, plan.ts, approve.ts |
  *
  * `excluir_de_revision` la anadio TASK-034: la peticion de revision
  * embebia el diff entero, y el JS compilado, los lockfiles y la propia
@@ -99,8 +100,18 @@ export interface TaskcodeConfig {
    * revision: aparecen solo en un `--stat`. `[]` = no excluir nada.
    */
   excluir_de_revision: readonly string[];
+  /**
+   * TASK-056: como avanza el ciclo entre fases. `manual`, la persona lanza
+   * cada comando (lo de siempre); `semiautomatico`, se pregunta al cerrar
+   * cada fase; `automatico`, las preguntas se hacen en plan y el resto se
+   * encadena. Se congela en la tarea al cerrar `plan` (core/transiciones.ts).
+   */
+  modo_flujo: ModoFlujo;
 }
 
+export type ModoFlujo = 'manual' | 'semiautomatico' | 'automatico';
+export const MODOS_FLUJO: readonly ModoFlujo[] = ['manual', 'semiautomatico', 'automatico'];
+
 /**
  * El comportamiento de hoy, escrito una sola vez. Antes de C4 estos
  * tres valores vivian: 'develop' literal en git.ts, 'general-purpose'
@@ -120,6 +131,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
     '**/*-lock.*',
     'tareas/**',
   ]) as readonly string[],
+  modo_flujo: 'manual',
 });
 
 /** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
@@ -131,6 +143,7 @@ export const CLAVES_CONFIG = [
   'rutas_sincronizacion',
   'timeout_sincronizacion',
   'excluir_de_revision',
+  'modo_flujo',
 ] as const;
 
 /**
@@ -319,6 +332,9 @@ export function parsearConfig(contenido: string, ruta: string): TaskcodeConfig {
       case 'excluir_de_revision':
         config.excluir_de_revision = validarPatronesExclusion(donde, par.valor);
         break;
+      case 'modo_flujo':
+        config.modo_flujo = validarModoFlujo(donde, par.valor);
+        break;
     }
   }
 
@@ -572,3 +588,21 @@ function describirValor(valor: unknown): string {
   if (typeof valor === 'string') return `el texto "${valor}"`;
   return `${String(valor)} (${typeof valor})`;
 }
+
+/**
+ * TASK-056: `modo_flujo` es un enumerado. Un valor fuera de la lista aborta
+ * nombrando los validos (y el mas parecido): caer a `manual` en silencio
+ * haria creer a la persona que el flujo va a encadenarse cuando no.
+ */
+function validarModoFlujo(donde: string, valor: unknown): ModoFlujo {
+  const modo = validarTextoNoVacio(donde, 'modo_flujo', valor);
+  if ((MODOS_FLUJO as readonly string[]).includes(modo)) return modo as ModoFlujo;
+  const parecido = MODOS_FLUJO.map((m) => ({ m, d: distanciaEdicion(modo.toLowerCase(), m) }))
+    .sort((a, b) => a.d - b.d)[0];
+  const sugerencia =
+    parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.m}"?` : '';
+  throw new ConfigError(
+    `[ERROR] ${donde}: modo_flujo "${modo}" no es valido.${sugerencia}\n` +
+      `        Valores validos: ${MODOS_FLUJO.join(', ')} (sin la clave, manual).`
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
new file mode 100644
index 0000000..7b60b35
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -0,0 +1,120 @@
+/**
+ * El siguiente paso de una tarea (TASK-056). Puro: recibe la tarea, lo que
+ * hay en su carpeta (plan redactado, veredicto de la ultima ronda) y el modo
+ * de flujo, y dice que fase toca y que hacer con ella:
+ *
+ * - `detener`: no se encadena nada; se nombra el comando siguiente.
+ * - `preguntar`: se pregunta a la persona si seguir.
+ * - `continuar`: se sigue sin preguntar.
+ *
+ * Es lo que leen las fases guiadas para decidir: ellas solo ejecutan lo que
+ * esto devuelve. Las condiciones de LEGALIDAD no se copian aqui, viven en
+ * state-machine.ts; el test cruza cada fase propuesta con
+ * assertTransitionAllowed para que nunca se proponga una ilegal.
+ */
+import type { Task } from './task.js';
+import type { ModoFlujo } from './config.js';
+import type { VeredictoInforme } from './informe-revision.js';
+
+export type FaseSiguiente =
+  | 'plan'
+  | 'approve'
+  | 'start'
+  | 'review'
+  | 'veredicto'
+  | 'codex-review'
+  | 'finish'
+  | 'terminada';
+
+export type AccionFlujo = 'detener' | 'preguntar' | 'continuar';
+
+export interface ContextoFlujo {
+  /** en-diseno: ¿hay un plan-final.md redactado (no la plantilla)? */
+  planRedactado: boolean;
+  /** en-revision: veredicto de la ultima ronda. */
+  veredicto: VeredictoInforme | null;
+  /** en-revision con revision_codex: ¿la segunda opinion esta aprobada? */
+  codexAprobada: boolean;
+}
+
+export interface SiguientePaso {
+  fase: FaseSiguiente;
+  /**
+   * Comando de taskctl de esa fase, o null si lo que toca es trabajo de un
+   * agente sin comando propio (redactar el plan) o la tarea esta terminada.
+   */
+  comando: string | null;
+  accion: AccionFlujo;
+  motivo: string;
+}
+
+/**
+ * Fases que abren una fase NUEVA del ciclo: en semiautomatico se pregunta
+ * antes de entrar. Las demas (veredicto, codex-review, otra ronda de
+ * review) son pasos internos de la revision y siguen solas.
+ */
+function accionPara(
+  fase: FaseSiguiente,
+  modo: ModoFlujo,
+  task: Task,
+  abreFase: boolean
+): AccionFlujo {
+  if (fase === 'terminada' || modo === 'manual') return 'detener';
+  // Decision de Carlos (2026-10-04): hotfix y release mergean a main con
+  // tag; en ningun modo se cierran sin preguntar.
+  if (fase === 'finish' && (task.tipo === 'hotfix' || task.tipo === 'release')) return 'preguntar';
+  if (modo === 'automatico') return 'continuar';
+  return abreFase ? 'preguntar' : 'continuar';
+}
+
+export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo): SiguientePaso {
+  const paso = (
+    fase: FaseSiguiente,
+    abreFase: boolean,
+    motivo: string,
+    comando: string | null = `taskctl ${fase} ${task.id}`
+  ): SiguientePaso => ({
+    fase,
+    comando,
+    accion: accionPara(fase, modo, task, abreFase),
+    motivo,
+  });
+
+  switch (task.estado) {
+    case 'planificada':
+      return paso('plan', true, 'la tarea esta planificada: toca disenarla');
+    case 'en-diseno':
+      if (task.plan_aprobado) return paso('start', true, 'el plan esta aprobado: toca abrir la rama');
+      if (!ctx.planRedactado) {
+        // No `taskctl plan`: abriria otra ronda de diseno. Lo que falta es
+        // trabajo de agente (roles, unificador) sobre la ronda ya abierta.
+        return paso('plan', false, 'falta redactar planificacion/plan-final.md', null);
+      }
+      return paso('approve', true, 'el plan esta redactado y sin aprobar');
+    case 'en-curso':
+      return paso(
+        'review',
+        true,
+        'cuando la implementacion este commiteada y la suite en verde, toca la revision'
+      );
+    case 'en-revision':
+      switch (ctx.veredicto) {
+        case 'cambios-solicitados':
+          return paso('review', false, 'la ultima ronda pidio cambios: corregir y pedir otra ronda');
+        case 'aprobada':
+          if (task.revision_codex && !ctx.codexAprobada) {
+            return paso('codex-review', false, 'falta la segunda opinion (revision_codex: true)');
+          }
+          return paso('finish', true, 'la revision esta aprobada');
+        default:
+          return paso(
+            'veredicto',
+            false,
+            'la ultima ronda no tiene veredicto: falta el revisor',
+            `taskctl veredicto ${task.id} <aprobada|aprobada-con-correcciones|cambios-solicitados>`
+          );
+      }
+    case 'terminada':
+      return paso('terminada', false, 'la tarea ya esta terminada', null);
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
new file mode 100644
index 0000000..318b0c8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -0,0 +1,148 @@
+/**
+ * Registro de transiciones de una tarea (TASK-056): la seccion
+ * `## Transiciones` de `tarea.md`, una fila por cambio de fase.
+ *
+ * | fecha | fase | modo | decidido_por |
+ * |---|---|---|---|
+ * | 2026-10-04 | plan | automatico | persona |
+ *
+ * Es el historico de quien decidio cada paso y en que modo, y viaja en el
+ * mismo commit que la transicion (lo escribe el comando antes de su
+ * autoCommit), asi que no puede quedar una transicion sin su fila.
+ *
+ * El MODO SE CONGELA AQUI: el de la ultima fila `plan`. No hay campo en el
+ * frontmatter a proposito: el registro y el modo serian dos datos que
+ * podrian discrepar, y un campo nuevo obligaria a tocar el parser y el
+ * orden de campos. Cambiar el config despues de `plan` no cambia el modo de
+ * esa tarea, que es lo que impide aprobar en automatico un plan que se
+ * cerro en manual (riesgo del plan de TASK-055).
+ *
+ * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas ni
+ * toca nada fuera de su seccion.
+ */
+import { MODOS_FLUJO, type ModoFlujo } from './config.js';
+
+export const SECCION_TRANSICIONES = '## Transiciones';
+
+/** Fases que deja en el registro. `pausa` es el «no» del semiautomatico. */
+export type FaseRegistrada = 'plan' | 'approve' | 'start' | 'review' | 'finish' | 'pausa';
+
+export type DecididoPor = 'persona' | 'automatico';
+export const DECIDIDO_POR: readonly DecididoPor[] = ['persona', 'automatico'];
+
+export interface FilaTransicion {
+  fecha: string;
+  fase: FaseRegistrada;
+  modo: ModoFlujo;
+  decidido_por: DecididoPor;
+}
+
+const FASES: readonly FaseRegistrada[] = ['plan', 'approve', 'start', 'review', 'finish', 'pausa'];
+const CABECERA = '| fecha | fase | modo | decidido_por |';
+const SEPARADOR = '|---|---|---|---|';
+
+function filaATexto(f: FilaTransicion): string {
+  return `| ${f.fecha} | ${f.fase} | ${f.modo} | ${f.decidido_por} |`;
+}
+
+/** [inicio, fin) de las lineas de la seccion, o null si no existe. */
+function rangoSeccion(lineas: readonly string[]): [number, number] | null {
+  const inicio = lineas.findIndex((l) => l.trimEnd() === SECCION_TRANSICIONES);
+  if (inicio === -1) return null;
+  let fin = inicio + 1;
+  while (fin < lineas.length && !/^##?\s/.test(lineas[fin] as string)) fin++;
+  return [inicio, fin];
+}
+
+/**
+ * Anade una fila al registro. Si la seccion no existe la crea al final del
+ * cuerpo; si existe, la fila va detras de su ultima fila de tabla.
+ */
+export function anadirTransicion(body: string, fila: FilaTransicion): string {
+  const eol = body.includes('\r\n') ? '\r\n' : '\n';
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoSeccion(lineas);
+
+  if (rango === null) {
+    const base = body.replace(/(\r?\n)*$/, '');
+    const separacion = base === '' ? '' : eol + eol;
+    return base + separacion + [SECCION_TRANSICIONES, '', CABECERA, SEPARADOR, filaATexto(fila)].join(eol) + eol;
+  }
+
+  const [inicio, fin] = rango;
+  let ultimaTabla = -1;
+  for (let i = inicio + 1; i < fin; i++) {
+    if ((lineas[i] as string).trimStart().startsWith('|')) ultimaTabla = i;
+  }
+  const nuevas =
+    ultimaTabla === -1
+      ? (() => {
+          // Seccion sin tabla (editada a mano): la tabla va justo bajo el titulo.
+          return [...lineas.slice(0, inicio + 1), '', CABECERA, SEPARADOR, filaATexto(fila), ...lineas.slice(inicio + 1)];
+        })()
+      : [...lineas.slice(0, ultimaTabla + 1), filaATexto(fila), ...lineas.slice(ultimaTabla + 1)];
+  return nuevas.join(eol);
+}
+
+/**
+ * Filas validas del registro, en orden. Las que no casan (cabecera,
+ * separador, filas editadas a mano con valores desconocidos) se ignoran:
+ * leer nunca falla ni reescribe nada.
+ */
+export function leerTransiciones(body: string): FilaTransicion[] {
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoSeccion(lineas);
+  if (rango === null) return [];
+  const filas: FilaTransicion[] = [];
+  for (let i = rango[0] + 1; i < rango[1]; i++) {
+    const celdas = (lineas[i] as string)
+      .trim()
+      .replace(/^\|/, '')
+      .replace(/\|$/, '')
+      .split('|')
+      .map((c) => c.trim());
+    if (celdas.length !== 4) continue;
+    const [fecha, fase, modo, decidido] = celdas as [string, string, string, string];
+    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) continue;
+    if (!(FASES as readonly string[]).includes(fase)) continue;
+    if (!(MODOS_FLUJO as readonly string[]).includes(modo)) continue;
+    if (!(DECIDIDO_POR as readonly string[]).includes(decidido)) continue;
+    filas.push({
+      fecha,
+      fase: fase as FaseRegistrada,
+      modo: modo as ModoFlujo,
+      decidido_por: decidido as DecididoPor,
+    });
+  }
+  return filas;
+}
+
+/** Modo congelado al cerrar `plan`: el de la ultima fila `plan`, o null si no hay. */
+export function modoCongelado(body: string): ModoFlujo | null {
+  const planes = leerTransiciones(body).filter((f) => f.fase === 'plan');
+  const ultima = planes[planes.length - 1];
+  return ultima === undefined ? null : ultima.modo;
+}
+
+/**
+ * Modo con el que corre una tarea: el congelado si lo hay; si no (tarea
+ * anterior a este registro, o aun sin plan), el del config.
+ */
+export function modoDeTarea(body: string, modoConfig: ModoFlujo): ModoFlujo {
+  return modoCongelado(body) ?? modoConfig;
+}
+
+/**
+ * La fila que deja cada comando al cambiar de fase. En `plan` el modo es el
+ * del config, y con eso queda congelado; en el resto, el congelado.
+ */
+export function registrarTransicion(
+  body: string,
+  fase: FaseRegistrada,
+  fecha: string,
+  modoConfig: ModoFlujo,
+  decididoPor: DecididoPor = 'persona'
+): string {
+  const modo = fase === 'plan' ? modoConfig : modoDeTarea(body, modoConfig);
+  return anadirTransicion(body, { fecha, fase, modo, decidido_por: decididoPor });
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
new file mode 100644
index 0000000..3333421
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
@@ -0,0 +1,369 @@
+/**
+ * `taskctl siguiente`, `taskctl pausa` y `approve --decidido-por` (TASK-056).
+ * Repos Git temporales reales, el CLI real por spawn para siguiente, pausa,
+ * approve y veredicto, y las funciones run*Command para el resto.
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
+import { runStartCommand } from '../../src/commands/start.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
+const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'gitflow');
+const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
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
+function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
+  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+function cliOk(cwd: string, args: string[]) {
+  const r = cli(cwd, args);
+  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
+  return r;
+}
+
+function siguiente(cwd: string, id: string): Record<string, unknown> {
+  return JSON.parse(cliOk(cwd, ['siguiente', id, '--json']).stdout) as Record<string, unknown>;
+}
+
+/** Repo con main y develop; el config (si lo hay) se commitea antes de crear develop. */
+async function withRepo(
+  config: string | null,
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-siguiente-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    if (config !== null) {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+    }
+    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+const PLAN_REDACTADO =
+  '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt y comprobar el flujo guiado.\n';
+
+async function nuevaTarea(repoRoot: string, tareasRoot: string): Promise<string> {
+  const creada = await runNewCommand(
+    tareasRoot,
+    [
+      '--titulo',
+      'Flujo guiado',
+      '--tipo',
+      'feature',
+      '--complejidad',
+      'simple',
+      '--objetivo',
+      'Probar siguiente de punta a punta.',
+      '--criterio',
+      'La tarea queda en 04-terminadas',
+    ],
+    HOY,
+    { repoCwd: repoRoot }
+  );
+  return creada.id;
+}
+
+async function planificar(repoRoot: string, tareasRoot: string, id: string): Promise<void> {
+  await runPlanCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot });
+  await writeFile(
+    path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
+    PLAN_REDACTADO,
+    'utf8'
+  );
+  commitAll(repoRoot, `docs(${id}): plan final`);
+}
+
+async function filas(tareasRoot: string, id: string) {
+  const t = await readTareaFile(tareasRoot, id);
+  assert.ok(t, `tarea ${id} no encontrada`);
+  return leerTransiciones(t.body);
+}
+
+test('ciclo feature completo en semiautomatico: siguiente guia cada fase', async () => {
+  await withRepo('modo_flujo: semiautomatico\n', async (repoRoot, tareasRoot) => {
+    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+
+    let s = siguiente(repoRoot, id);
+    assert.equal(s.id, id);
+    assert.equal(s.estado, 'planificada');
+    assert.equal(s.fase, 'plan');
+    assert.equal(s.comando, `taskctl plan ${id}`);
+    assert.equal(s.leidaDe, 'working-tree');
+    assert.equal(s.accion, 'preguntar');
+
+    await planificar(repoRoot, tareasRoot, id);
+    s = siguiente(repoRoot, id);
+    assert.deepEqual(
+      [s.estado, s.modo, s.fase, s.comando, s.accion, s.leidaDe],
+      ['en-diseno', 'semiautomatico', 'approve', `taskctl approve ${id}`, 'preguntar', 'working-tree']
+    );
+
+    cliOk(repoRoot, ['approve', id]);
+    s = siguiente(repoRoot, id);
+    assert.deepEqual(
+      [s.estado, s.modo, s.fase, s.comando, s.accion],
+      ['en-diseno', 'semiautomatico', 'start', `taskctl start ${id}`, 'preguntar']
+    );
+
+    await runStartCommand(tareasRoot, [id], HOY, deps);
+    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
+    commitAll(repoRoot, `feat(${id}): trabajo`);
+    s = siguiente(repoRoot, id);
+    assert.deepEqual(
+      [s.estado, s.modo, s.fase, s.comando, s.accion, s.leidaDe],
+      ['en-curso', 'semiautomatico', 'review', `taskctl review ${id}`, 'preguntar', 'working-tree']
+    );
+
+    await runReviewCommand(tareasRoot, [id], HOY, deps);
+    s = siguiente(repoRoot, id);
+    assert.equal(s.estado, 'en-revision');
+    assert.equal(s.fase, 'veredicto');
+    assert.equal(s.modo, 'semiautomatico');
+    assert.equal(s.accion, 'continuar');
+    assert.match(s.comando as string, new RegExp(`^taskctl veredicto ${id} `));
+
+    cliOk(repoRoot, ['veredicto', id, 'aprobada']);
+    s = siguiente(repoRoot, id);
+    assert.deepEqual(
+      [s.estado, s.modo, s.fase, s.comando, s.accion],
+      ['en-revision', 'semiautomatico', 'finish', `taskctl finish ${id}`, 'preguntar']
+    );
+
+    await runFinishCommand(tareasRoot, [id], HOY, deps);
+    s = siguiente(repoRoot, id);
+    assert.deepEqual([s.estado, s.fase, s.comando, s.accion], ['terminada', 'terminada', null, 'detener']);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'siguiente no ensucia nada');
+
+    // 2. Una fila por transicion, en orden y con el modo congelado.
+    const rows = await filas(tareasRoot, id);
+    assert.deepEqual(
+      rows.map((r) => r.fase),
+      ['plan', 'approve', 'start', 'review', 'finish']
+    );
+    assert.ok(rows.every((r) => r.modo === 'semiautomatico' && r.decidido_por === 'persona'));
+
+    // Cada fila entro en el mismo commit que su transicion: el commit que
+    // anade la fila tambien mueve/toca la tarea en la carpeta de su estado.
+    const carpeta: Record<string, string> = {
+      plan: '01-en-diseno',
+      approve: '01-en-diseno',
+      start: '02-en-curso',
+      review: '03-en-revision',
+    };
+    for (const fase of ['plan', 'approve', 'start', 'review']) {
+      const shas = git(
+        ['log', '--all', '--format=%H', '-S', `| ${fase} | semiautomatico | persona |`],
+        repoRoot
+      )
+        .split('\n')
+        .filter(Boolean);
+      assert.ok(shas.length >= 1, `ningun commit anade la fila ${fase}`);
+      // El primero en el tiempo es el ultimo de la lista (log va de nuevo a viejo).
+      const sha = shas[shas.length - 1] as string;
+      const stat = git(['show', '--format=%s', '--name-only', sha], repoRoot);
+      assert.ok(stat.includes(`${carpeta[fase]}/${id}/tarea.md`), `fila ${fase}: commit sin tarea.md en ${carpeta[fase]}:\n${stat}`);
+    }
+  });
+});
+
+test('siguiente desde develop con la tarea en su rama lee de la rama y da la misma fase', async () => {
+  await withRepo('modo_flujo: semiautomatico\n', async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    await planificar(repoRoot, tareasRoot, id);
+    cliOk(repoRoot, ['approve', id]);
+    await runStartCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
+    commitAll(repoRoot, `feat(${id}): trabajo`);
+
+    const desdeRama = siguiente(repoRoot, id);
+    assert.equal(desdeRama.leidaDe, 'working-tree');
+    git(['checkout', '-q', 'develop'], repoRoot);
+    const desdeDevelop = siguiente(repoRoot, id);
+    assert.equal(desdeDevelop.leidaDe, 'rama');
+    assert.equal(desdeDevelop.fase, desdeRama.fase);
+    assert.equal(desdeDevelop.estado, desdeRama.estado);
+    assert.equal(desdeDevelop.accion, desdeRama.accion);
+    assert.equal(desdeDevelop.modo, desdeRama.modo);
+    assert.equal(desdeDevelop.fase, 'review');
+  });
+});
+
+test('errores: tarea inexistente, sin ID y config roto', async () => {
+  await withRepo(null, async (repoRoot) => {
+    const noExiste = cli(repoRoot, ['siguiente', 'TASK-999']);
+    assert.notEqual(noExiste.status, 0);
+    const sinId = cli(repoRoot, ['siguiente']);
+    assert.notEqual(sinId.status, 0);
+  });
+  await withRepo('modo_flujo: auto\n', async (repoRoot) => {
+    const r = cli(repoRoot, ['siguiente', 'TASK-001']);
+    assert.notEqual(r.status, 0);
+    for (const v of ['manual', 'semiautomatico', 'automatico']) {
+      assert.ok(r.stderr.includes(v), `stderr debe listar ${v}: ${r.stderr}`);
+    }
+  });
+});
+
+test('approve --decidido-por automatico con la tarea planificada en manual: rechazado y sin tocar nada', async () => {
+  await withRepo(null, async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    await planificar(repoRoot, tareasRoot, id);
+    const antes = git(['rev-parse', 'HEAD'], repoRoot);
+    const r = cli(repoRoot, ['approve', id, '--decidido-por', 'automatico']);
+    assert.notEqual(r.status, 0);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), antes);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+    assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, false);
+
+    // Sin valor: tambien falla y no aprueba.
+    const sinValor = cli(repoRoot, ['approve', id, '--decidido-por']);
+    assert.notEqual(sinValor.status, 0);
+    assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, false);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('approve automatico usa el modo congelado en plan, no el del config actual', async () => {
+  await withRepo('modo_flujo: automatico\n', async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    await planificar(repoRoot, tareasRoot, id);
+    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'modo_flujo: manual\n', 'utf8');
+    commitAll(repoRoot, 'config a manual');
+
+    cliOk(repoRoot, ['approve', id, '--decidido-por', 'automatico']);
+    const rows = await filas(tareasRoot, id);
+    const approve = rows.find((f) => f.fase === 'approve');
+    assert.equal(approve?.modo, 'automatico');
+    assert.equal(approve?.decidido_por, 'automatico');
+    assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, true);
+    // siguiente sigue con el modo congelado aunque el config diga manual.
+    assert.equal(siguiente(repoRoot, id).modo, 'automatico');
+  });
+});
+
+test('pausa en en-diseno: fila pausa de persona, commit propio y estado intacto', async () => {
+  await withRepo('modo_flujo: semiautomatico\n', async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    await planificar(repoRoot, tareasRoot, id);
+    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    cliOk(repoRoot, ['pausa', id]);
+    assert.equal(git(['rev-list', '--count', `${antes}..HEAD`], repoRoot).trim(), '1');
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+    const t = await readTareaFile(tareasRoot, id);
+    assert.equal(t?.task.estado, 'en-diseno');
+    assert.equal(t?.task.plan_aprobado, false);
+    const rows = leerTransiciones((t as NonNullable<typeof t>).body);
+    assert.deepEqual(
+      rows.map((r) => [r.fase, r.decidido_por]),
+      [
+        ['plan', 'persona'],
+        ['pausa', 'persona'],
+      ]
+    );
+    assert.equal(siguiente(repoRoot, id).fase, 'approve');
+  });
+});
+
+test('pausa desde develop con la tarea en su rama: aborta diciendo a que rama cambiar', async () => {
+  await withRepo(null, async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    await planificar(repoRoot, tareasRoot, id);
+    cliOk(repoRoot, ['approve', id]);
+    await runStartCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
+    commitAll(repoRoot, `feat(${id}): trabajo`);
+    const rama = git(['branch', '--show-current'], repoRoot).trim();
+    git(['checkout', '-q', 'develop'], repoRoot);
+    const antes = git(['rev-parse', 'HEAD'], repoRoot);
+
+    const r = cli(repoRoot, ['pausa', id]);
+    assert.notEqual(r.status, 0);
+    assert.ok(r.stderr.includes(rama), `debe nombrar la rama ${rama}: ${r.stderr}`);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), antes);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test('hotfix en automatico con revision aprobada: finish sigue siendo preguntar', async () => {
+  await withRepo('modo_flujo: automatico\n', async (repoRoot, tareasRoot) => {
+    // Los hotfix nacen de main (que ya tiene el config).
+    const id = 'TASK-957';
+    const rama = 'hotfix/task-957-urgente';
+    git(['checkout', '-q', '-b', rama, 'main'], repoRoot);
+    const task: Task = {
+      id,
+      titulo: 'Hotfix urgente',
+      tipo: 'hotfix',
+      sprint: 0,
+      etiquetas: [],
+      complejidad: 'simple',
+      modelo_sugerido: 'sonnet',
+      estado: 'en-revision',
+      plan_aprobado: true,
+      rama,
+      asignado_a: null,
+      agente_revisor: 'general-purpose',
+      skills_recomendados: [],
+      regla_seleccion_skill: null,
+      ultimo_commit_revisado: null,
+      revision_codex: false,
+      creado: HOY,
+      actualizado: HOY,
+      dependencias: [],
+    };
+    const cuerpo =
+      '## Objetivo\nArreglar.\n\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
+      `| ${HOY} | plan | automatico | persona |\n`;
+    await writeTareaFile(tareasRoot, task, cuerpo);
+    const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1.md'),
+      '# Informe\n\n- Veredicto: aprobada\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'hotfix revisado');
+
+    const s = siguiente(repoRoot, id);
+    assert.deepEqual(
+      [s.estado, s.modo, s.fase, s.comando, s.accion],
+      ['en-revision', 'automatico', 'finish', `taskctl finish ${id}`, 'preguntar']
+    );
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
index 372a28f..d77352b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/config.test.ts
@@ -75,12 +75,15 @@ const RUTA_FICTICIA = '/repo/.taskcode/config.yml';
 // 1. Sin fichero: comportamiento identico al de hoy
 // ---------------------------------------------------------------------
 
-test('resolverConfig: repo sin .taskcode/ devuelve los tres defaults', async () => {
+test('resolverConfig: repo sin .taskcode/ devuelve los defaults', async () => {
   await withTempRepo(async (repoRoot) => {
     const c = resolverConfig(repoRoot);
     assert.equal(c.rama_base, 'develop');
     assert.equal(c.agente_revisor_por_defecto, 'general-purpose');
     assert.equal(c.limite_wip, 1);
+    // Literal, no contra CONFIG_DEFAULTS: comparar con la propia constante
+    // no veria un default cambiado (TASK-056, plan de pruebas).
+    assert.equal(c.modo_flujo, 'manual');
     assert.deepEqual(c, { ...CONFIG_DEFAULTS });
   });
 });
@@ -563,3 +566,32 @@ test('resolverConfig: un .taskcode que es un FICHERO aborta (no cae al default e
     assert.throws(() => resolverConfig(repoRoot), /existe pero no es una carpeta/);
   });
 });
+
+// ---------------------------------------------------------------------
+// modo_flujo (TASK-056)
+// ---------------------------------------------------------------------
+
+test('parsearConfig: modo_flujo acepta los tres valores', () => {
+  for (const modo of ['manual', 'semiautomatico', 'automatico'] as const) {
+    assert.equal(parsearConfig(`modo_flujo: ${modo}\n`, RUTA_FICTICIA).modo_flujo, modo);
+  }
+});
+
+test('parsearConfig: modo_flujo invalido aborta listando los tres validos y sugiriendo el parecido', () => {
+  assert.throws(
+    () => parsearConfig('modo_flujo: automatic\n', RUTA_FICTICIA),
+    (e: Error) =>
+      e instanceof ConfigError &&
+      /manual, semiautomatico, automatico/.test(e.message) &&
+      /Querias decir "automatico"/.test(e.message)
+  );
+  assert.throws(() => parsearConfig('modo_flujo: auto\n', RUTA_FICTICIA), ConfigError);
+  assert.throws(() => parsearConfig('modo_flujo:\n', RUTA_FICTICIA), ConfigError);
+});
+
+test('parsearConfig: modo_flujo repetido aborta', () => {
+  assert.throws(
+    () => parsearConfig('modo_flujo: manual\nmodo_flujo: automatico\n', RUTA_FICTICIA),
+    ConfigError
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
new file mode 100644
index 0000000..8255bb4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -0,0 +1,121 @@
+/**
+ * siguienteFase (TASK-056): la tabla entera, escrita a mano y comparada con
+ * deepEqual. Duplica a proposito la logica de produccion: cada estado o modo
+ * nuevo obliga a tocar las dos, y ese es el valor del test.
+ *
+ * Ademas, cada fase propuesta se cruza con assertTransitionAllowed: el
+ * siguiente paso nunca puede ser una transicion ilegal.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../../src/core/flujo.js';
+import { assertTransitionAllowed, type TaskCommand } from '../../src/core/state-machine.js';
+import type { ModoFlujo } from '../../src/core/config.js';
+import type { Task } from '../../src/core/task.js';
+import type { VeredictoInforme } from '../../src/core/informe-revision.js';
+
+function tarea(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-100',
+    titulo: 'Tarea de prueba',
+    tipo: 'feature',
+    sprint: 0,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-100-prueba',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-10-04',
+    actualizado: '2026-10-04',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+const CTX: ContextoFlujo = { planRedactado: false, veredicto: null, codexAprobada: false };
+
+interface Caso {
+  nombre: string;
+  task: Partial<Task>;
+  ctx?: Partial<ContextoFlujo>;
+  /** fase y comando no dependen del modo; la accion si: [manual, semi, auto]. */
+  fase: SiguientePaso['fase'];
+  comando: string | null;
+  acciones: [SiguientePaso['accion'], SiguientePaso['accion'], SiguientePaso['accion']];
+}
+
+const VEREDICTO_PENDIENTE = 'taskctl veredicto TASK-100 <aprobada|aprobada-con-correcciones|cambios-solicitados>';
+
+const TABLA: Caso[] = [
+  { nombre: 'planificada', task: { estado: 'planificada' }, fase: 'plan', comando: 'taskctl plan TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en diseno sin plan redactado', task: { estado: 'en-diseno' }, fase: 'plan', comando: null, acciones: ['detener', 'continuar', 'continuar'] },
+  { nombre: 'en diseno con plan redactado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en diseno aprobada', task: { estado: 'en-diseno', plan_aprobado: true }, ctx: { planRedactado: true }, fase: 'start', comando: 'taskctl start TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en curso', task: { estado: 'en-curso', plan_aprobado: true }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en revision sin informe', task: { estado: 'en-revision', plan_aprobado: true }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
+  { nombre: 'en revision pendiente', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'pendiente' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
+  { nombre: 'en revision veredicto desconocido', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'desconocido' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
+  { nombre: 'en revision cambios solicitados', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados' }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'continuar', 'continuar'] },
+  { nombre: 'en revision aprobada (feature)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'en revision aprobada (fix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'fix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  // Decision de Carlos: hotfix y release preguntan antes de finish en cualquier modo que encadene.
+  { nombre: 'en revision aprobada (hotfix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'hotfix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'en revision aprobada (release)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'release' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'aprobada con codex pendiente', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'continuar', 'continuar'] },
+  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', codexAprobada: true }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
+];
+
+const MODOS: ModoFlujo[] = ['manual', 'semiautomatico', 'automatico'];
+
+test('siguienteFase: la tabla entera, por estado, contexto, tipo y modo', () => {
+  for (const caso of TABLA) {
+    MODOS.forEach((modo, i) => {
+      const r = siguienteFase(tarea(caso.task), { ...CTX, ...caso.ctx }, modo);
+      assert.deepEqual(
+        { fase: r.fase, comando: r.comando, accion: r.accion },
+        { fase: caso.fase, comando: caso.comando, accion: caso.acciones[i] },
+        `${caso.nombre}, modo ${modo}`
+      );
+      assert.ok(r.motivo.length > 0, `${caso.nombre}: sin motivo`);
+    });
+  }
+});
+
+test('siguienteFase: ninguna fase propuesta es una transicion ilegal para la maquina de estados', () => {
+  const veredictoACtx = (v: VeredictoInforme | null) => ({
+    veredictoRondaAnterior: v ?? 'sin-linea',
+    revisionPrimariaAprobada: v === 'aprobada',
+  });
+  for (const caso of TABLA) {
+    const t = tarea(caso.task);
+    const ctx = { ...CTX, ...caso.ctx };
+    const r = siguienteFase(t, ctx, 'automatico');
+    // terminada no propone nada; "plan" sin comando es redactar, no una transicion.
+    if (r.comando === null) continue;
+    const comando = r.fase as TaskCommand;
+    assert.doesNotThrow(
+      () =>
+        assertTransitionAllowed(comando, t, {
+          planFinalExiste: ctx.planRedactado,
+          revisionCodexAprobada: ctx.codexAprobada,
+          ...veredictoACtx(ctx.veredicto),
+        }),
+      `${caso.nombre}: propone "${r.fase}", que la maquina de estados rechaza`
+    );
+  }
+});
+
+test('siguienteFase: en manual nunca encadena nada, en ningun estado', () => {
+  for (const caso of TABLA) {
+    const r = siguienteFase(tarea(caso.task), { ...CTX, ...caso.ctx }, 'manual');
+    assert.equal(r.accion, 'detener', caso.nombre);
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
new file mode 100644
index 0000000..27dba04
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
@@ -0,0 +1,93 @@
+/**
+ * Registro de transiciones (TASK-056): anadir sin tocar el resto del cuerpo,
+ * leer ignorando lo que no casa, y el modo congelado en la fila de plan.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  anadirTransicion,
+  leerTransiciones,
+  modoCongelado,
+  modoDeTarea,
+  registrarTransicion,
+  type FilaTransicion,
+} from '../../src/core/transiciones.js';
+
+const CUERPO = '## Objetivo\n\nHacer algo.\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
+
+const fila = (o: Partial<FilaTransicion> = {}): FilaTransicion => ({
+  fecha: '2026-10-04',
+  fase: 'plan',
+  modo: 'manual',
+  decidido_por: 'persona',
+  ...o,
+});
+
+test('anadirTransicion: sin seccion, la crea al final y deja el cuerpo intacto por encima', () => {
+  const r = anadirTransicion(CUERPO, fila());
+  assert.ok(r.startsWith(CUERPO.trimEnd() + '\n\n## Transiciones\n'), r);
+  assert.ok(
+    r.endsWith(
+      '## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
+        '| 2026-10-04 | plan | manual | persona |\n'
+    ),
+    r
+  );
+  assert.deepEqual(leerTransiciones(r), [fila()]);
+});
+
+test('anadirTransicion: con seccion, la fila va detras de la ultima de la tabla, aunque despues haya otra seccion', () => {
+  let r = anadirTransicion(CUERPO, fila());
+  r += '\n## Resultado\n\nTexto del resultado.\n';
+  r = anadirTransicion(r, fila({ fase: 'approve', decidido_por: 'automatico' }));
+  assert.deepEqual(
+    leerTransiciones(r).map((f) => f.fase),
+    ['plan', 'approve']
+  );
+  // El Resultado sigue intacto y detras.
+  assert.ok(r.endsWith('## Resultado\n\nTexto del resultado.\n'), r);
+  const antesDeResultado = r.slice(0, r.indexOf('## Resultado'));
+  assert.match(antesDeResultado, /\| 2026-10-04 \| approve \| manual \| automatico \|\n/);
+});
+
+test('anadirTransicion: respeta CRLF si el cuerpo lo usa', () => {
+  const crlf = CUERPO.replace(/\n/g, '\r\n');
+  const r = anadirTransicion(anadirTransicion(crlf, fila()), fila({ fase: 'start' }));
+  assert.equal(r.replace(/\r\n/g, '').includes('\n'), false, 'no mezcla LF suelto');
+  assert.equal(leerTransiciones(r).length, 2);
+});
+
+test('leerTransiciones: ignora filas mal formadas o con valores desconocidos, sin fallar', () => {
+  const cuerpo =
+    CUERPO +
+    '\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
+    '| 2026-10-04 | plan | automatico | persona |\n' +
+    '| ayer | approve | automatico | persona |\n' +
+    '| 2026-10-04 | despegar | automatico | persona |\n' +
+    '| 2026-10-04 | start | turbo | persona |\n' +
+    '| 2026-10-04 | start | automatico | robot |\n' +
+    '| 2026-10-04 | start | automatico |\n';
+  assert.deepEqual(leerTransiciones(cuerpo), [fila({ modo: 'automatico' })]);
+});
+
+test('modoCongelado: el de la ULTIMA fila plan (una re-planificacion lo vuelve a fijar); null sin fila plan', () => {
+  assert.equal(modoCongelado(CUERPO), null);
+  let r = anadirTransicion(CUERPO, fila({ modo: 'automatico' }));
+  r = anadirTransicion(r, fila({ fase: 'pausa', modo: 'automatico' }));
+  assert.equal(modoCongelado(r), 'automatico');
+  r = anadirTransicion(r, fila({ modo: 'semiautomatico' }));
+  assert.equal(modoCongelado(r), 'semiautomatico');
+});
+
+test('registrarTransicion: plan toma el modo del config; el resto, el congelado aunque el config cambie', () => {
+  const tras = registrarTransicion(CUERPO, 'plan', '2026-10-04', 'automatico');
+  const aprobada = registrarTransicion(tras, 'approve', '2026-10-05', 'manual', 'automatico');
+  assert.deepEqual(leerTransiciones(aprobada), [
+    fila({ modo: 'automatico' }),
+    fila({ fecha: '2026-10-05', fase: 'approve', modo: 'automatico', decidido_por: 'automatico' }),
+  ]);
+  // Tarea anterior al registro (sin fila plan): el modo es el del config.
+  assert.equal(modoDeTarea(CUERPO, 'semiautomatico'), 'semiautomatico');
+  const sinPlan = registrarTransicion(CUERPO, 'start', '2026-10-04', 'semiautomatico');
+  assert.equal(leerTransiciones(sinPlan)[0]?.modo, 'semiautomatico');
+});
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-056/tarea.md                                                           |  34 --------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-056/planificacion/brainstorm/peticion-unificador-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-056/planificacion/plan-final.md                       |   0
 tareas/02-en-curso/TASK-056/tarea.md                                                            |  81 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                    |  60 +++++++++++++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                       |  72 +++++++++++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                        |   5 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/pausa.js                         |  52 +++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                          |   6 ++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                        |   4 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                     | 114 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                         |   4 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                            |  22 +++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                             |  53 ++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                      | 127 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 15 files changed, 590 insertions(+), 44 deletions(-)
````
