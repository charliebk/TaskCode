# Peticion de revision — TASK-027 (ronda 1)

- Tarea: TASK-027 — Subcarpetas planificacion y revision en cada carpeta de tarea
- Rama revisada: feature/task-027-subcarpetas-planificacion-y-revision-en
- Rama base: develop
- Commit revisado (HEAD): e987b25d6b21c2b57f22e7e5cd6fc704d1cef932
- Fecha: 2026-09-06
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
e987b25 feat(TASK-027): subcarpeta planificacion/ en la carpeta de tarea (item C3)
e8e9275 chore(TASK-027): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-027/plan-final.md b/tareas/02-en-curso/TASK-027/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-027/plan-final.md
rename to tareas/02-en-curso/TASK-027/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-027/tarea.md b/tareas/02-en-curso/TASK-027/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-027/tarea.md
rename to tareas/02-en-curso/TASK-027/tarea.md
index ae9dfa8..34e0219 100644
--- a/tareas/01-en-diseno/TASK-027/tarea.md
+++ b/tareas/02-en-curso/TASK-027/tarea.md
@@ -6,7 +6,7 @@ sprint: 2
 etiquetas: []
 complejidad: simple
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-027-subcarpetas-planificacion-y-revision-en
 asignado_a: charlie.bk@gmail.com
diff --git a/tareas/04-terminadas/TASK-013/plan-final.md b/tareas/04-terminadas/TASK-013/planificacion/plan-final.md
similarity index 100%
rename from tareas/04-terminadas/TASK-013/plan-final.md
rename to tareas/04-terminadas/TASK-013/planificacion/plan-final.md
diff --git a/tareas/04-terminadas/TASK-014/plan-final.md b/tareas/04-terminadas/TASK-014/planificacion/plan-final.md
similarity index 100%
rename from tareas/04-terminadas/TASK-014/plan-final.md
rename to tareas/04-terminadas/TASK-014/planificacion/plan-final.md
diff --git a/tareas/04-terminadas/TASK-015/plan-final.md b/tareas/04-terminadas/TASK-015/planificacion/plan-final.md
similarity index 100%
rename from tareas/04-terminadas/TASK-015/plan-final.md
rename to tareas/04-terminadas/TASK-015/planificacion/plan-final.md
diff --git a/tareas/04-terminadas/TASK-024/plan-final.md b/tareas/04-terminadas/TASK-024/planificacion/plan-final.md
similarity index 100%
rename from tareas/04-terminadas/TASK-024/plan-final.md
rename to tareas/04-terminadas/TASK-024/planificacion/plan-final.md
diff --git a/tareas/04-terminadas/TASK-025/plan-final.md b/tareas/04-terminadas/TASK-025/planificacion/plan-final.md
similarity index 100%
rename from tareas/04-terminadas/TASK-025/plan-final.md
rename to tareas/04-terminadas/TASK-025/planificacion/plan-final.md
diff --git a/tareas/04-terminadas/TASK-026/plan-final.md b/tareas/04-terminadas/TASK-026/planificacion/plan-final.md
similarity index 100%
rename from tareas/04-terminadas/TASK-026/plan-final.md
rename to tareas/04-terminadas/TASK-026/planificacion/plan-final.md
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 01452e4..2b2e131 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -253,9 +253,19 @@ export async function main(argv: readonly string[]): Promise<number> {
       const result = await runPlanCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
       printBaseBranchSwitchNotice(result.baseBranchGuard);
       printAvisos(result.avisoIdentidad);
-      const scaffoldMsg = result.planCreated
-        ? `Scaffold creado en ${result.planPath} — redactalo antes de "taskctl approve".`
-        : `${result.planPath} ya existia (re-planificacion) — se dejo intacto.`;
+      // Tres desenlaces posibles desde TASK-027 (item C3): scaffold
+      // nuevo, plan que ya estaba en planificacion/, o plan legado
+      // suelto en la raiz que esta invocacion acaba de mover ahi.
+      let scaffoldMsg: string;
+      if (result.planMigrado) {
+        scaffoldMsg =
+          `El plan estaba suelto en la raiz de la carpeta (formato anterior) y se ha movido ` +
+          `intacto a ${result.planPath}.`;
+      } else if (result.planCreated) {
+        scaffoldMsg = `Scaffold creado en ${result.planPath} — redactalo antes de "taskctl approve".`;
+      } else {
+        scaffoldMsg = `${result.planPath} ya existia (re-planificacion) — se dejo intacto.`;
+      }
       process.stdout.write(
         `Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
           asignacionNotice(result)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 536ba7f..bf35e19 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -1,7 +1,9 @@
 /**
  * taskctl approve — TASK-011 de PLAN_SPRINTS.md. Checkpoint humano de
  * la fase de diseno (seccion 6 de la metodologia): marca
- * plan_aprobado: true una vez que plan-final.md existe.
+ * plan_aprobado: true una vez que plan-final.md existe, este en
+ * `planificacion/` (ubicacion canonica desde TASK-027) o suelto en la
+ * raiz de la carpeta (legado).
  *
  * NO evalua la CALIDAD del plan (sigue siendo scaffold vacio vs.
  * redactado de verdad) — ese juicio lo hace la persona antes de
@@ -16,23 +18,24 @@
  * seccion 8.3 (ensureBaseBranchReady) antes de escribir nada.
  */
 import path from 'node:path';
-import { stat } from 'node:fs/promises';
 import type { Task } from '../core/task.js';
-import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
+import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
-import { PLAN_FINAL_FILENAME } from './plan.js';
+import { resolverPlanFinal } from './plan.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
 
 export class ApproveCommandError extends Error {}
 
-async function planFinalFileExists(planPath: string): Promise<boolean> {
-  try {
-    await stat(planPath);
-    return true;
-  } catch (e: unknown) {
-    if (isEnoent(e)) return false;
-    throw e;
-  }
+/**
+ * Acepta el plan en CUALQUIERA de sus dos ubicaciones (TASK-027, item
+ * C3): `planificacion/plan-final.md` (canonica) o suelto en la raiz de
+ * la carpeta (legado del CLI anterior). Mirar solo la canonica dejaria
+ * sin poder aprobarse a toda tarea planificada antes del cambio, que
+ * es justo el caso que tiene el plan ya redactado.
+ */
+async function planFinalFileExists(taskDir: string): Promise<boolean> {
+  const ubicacion = await resolverPlanFinal(taskDir);
+  return ubicacion.canonicaExiste || ubicacion.legadaExiste;
 }
 
 export interface ApproveCommandResult {
@@ -68,7 +71,7 @@ export async function runApproveCommand(
   // lectura hecha en una rama vieja, tras el cambio automatico).
   const initial = await readTareaFile(tareasRoot, id);
   const planFinalExisteInicial = initial
-    ? await planFinalFileExists(path.join(path.dirname(initial.filePath), PLAN_FINAL_FILENAME))
+    ? await planFinalFileExists(path.dirname(initial.filePath))
     : false;
   assertTransitionAllowed('approve', initial ? initial.task : null, {
     planFinalExiste: planFinalExisteInicial,
@@ -85,7 +88,7 @@ export async function runApproveCommand(
   // como estuvieran en la rama vieja de la lectura preliminar).
   const existing = await readTareaFile(tareasRoot, id);
   const planFinalExiste = existing
-    ? await planFinalFileExists(path.join(path.dirname(existing.filePath), PLAN_FINAL_FILENAME))
+    ? await planFinalFileExists(path.dirname(existing.filePath))
     : false;
   assertTransitionAllowed('approve', existing ? existing.task : null, { planFinalExiste });
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index c7ecc93..3fcf648 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -11,7 +11,8 @@
  * trabajo).
  *
  * Lo que SI hace: validar la transicion, mover la tarea a
- * 01-en-diseno/, y dejar un scaffold de plan-final.md listo para que
+ * 01-en-diseno/, y dejar un scaffold de planificacion/plan-final.md
+ * (la subcarpeta es de TASK-027, item C3) listo para que
  * un agente (o una persona, en uso interactivo real de Claude Code) lo
  * redacte — el mismo patron que "taskctl new" ya usa con el cuerpo de
  * tarea.md (Objetivo/Criterios en blanco para rellenar despues). El
@@ -19,7 +20,7 @@
  * de agentes aqui todavia.
  */
 import path from 'node:path';
-import { writeFile } from 'node:fs/promises';
+import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
 import { parseArgs } from '../cli/args.js';
 import {
   parseAsignadoAFlag,
@@ -27,7 +28,7 @@ import {
   PISTA_VACIO_ESCRITURA,
 } from '../cli/asignado.js';
 import type { Task } from '../core/task.js';
-import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
+import { readTareaFile, moveTareaFile, isEexist, isEnoent } from '../fs/task-store.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
 import { resolverAsignado } from '../core/wip.js';
@@ -36,6 +37,63 @@ export class PlanCommandError extends Error {}
 
 export const PLAN_FINAL_FILENAME = 'plan-final.md';
 
+/**
+ * Subcarpeta de artefactos de diseno dentro de la carpeta de la tarea
+ * (TASK-027, item C3). La seccion 2 de la metodologia describe cada
+ * carpeta de tarea como `tarea.md` + `planificacion/` + `revision/`;
+ * `revision/` ya la crea "taskctl review" (REVISION_DIRNAME en
+ * review.ts) y esta es la otra mitad.
+ *
+ * Se crea BAJO DEMANDA, cuando hay algo que escribir dentro, no en
+ * "new"/"import": Git no versiona directorios vacios, asi que crearla
+ * al dar de alta la tarea no llegaria al repo sin un .gitkeep que
+ * nadie ha pedido, y de paso ensuciaria el workspace de quien solo
+ * queria dar de alta una tarea. Mismo criterio que ya sigue
+ * `revision/`.
+ */
+export const PLANIFICACION_DIRNAME = 'planificacion';
+
+async function existeFichero(p: string): Promise<boolean> {
+  try {
+    await stat(p);
+    return true;
+  } catch (e: unknown) {
+    if (isEnoent(e)) return false;
+    throw e;
+  }
+}
+
+export interface PlanFinalUbicacion {
+  /** Ruta canonica desde TASK-027: <carpeta>/planificacion/plan-final.md */
+  canonica: string;
+  /** Ruta legada (CLI anterior a TASK-027): <carpeta>/plan-final.md */
+  legada: string;
+  canonicaExiste: boolean;
+  legadaExiste: boolean;
+}
+
+/**
+ * Dice donde esta el plan de una tarea, mirando las DOS ubicaciones
+ * posibles. Existe porque toda tarea planificada antes de TASK-027
+ * tiene su `plan-final.md` suelto en la raiz de la carpeta: si el
+ * codigo nuevo mirase solo la ruta canonica, "taskctl approve" diria
+ * "todavia no hay plan que aprobar" sobre una tarea que si lo tiene, y
+ * la dejaria bloqueada en la maquina de estados.
+ *
+ * Lo comparten "plan" (que migra el legado) y "approve" (que acepta
+ * cualquiera de las dos), para que no puedan divergir.
+ */
+export async function resolverPlanFinal(taskDir: string): Promise<PlanFinalUbicacion> {
+  const canonica = path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
+  const legada = path.join(taskDir, PLAN_FINAL_FILENAME);
+  return {
+    canonica,
+    legada,
+    canonicaExiste: await existeFichero(canonica),
+    legadaExiste: await existeFichero(legada),
+  };
+}
+
 export function planTemplate(task: Task): string {
   return (
     `# Plan — ${task.id}: ${task.titulo}\n\n` +
@@ -55,6 +113,11 @@ export interface PlanCommandResult {
   planPath: string;
   /** false si plan-final.md ya existia (re-planificacion) y se dejo intacto. */
   planCreated: boolean;
+  /**
+   * true si esta invocacion movio un plan-final.md legado (suelto en la
+   * raiz de la carpeta, CLI anterior a TASK-027) a `planificacion/`.
+   */
+  planMigrado: boolean;
   /** asignado_a resultante en el frontmatter (null si sigue sin asignar). */
   asignadoA: string | null;
   /** true si esta invocacion cambio asignado_a (se paso --asignado-a con otro valor). */
@@ -152,29 +215,66 @@ export async function runPlanCommand(
     asignado_a: asignadoFinal,
     actualizado: today,
   };
-  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+
+  // El plan se escribe/migra en la carpeta ACTUAL, ANTES de mover la
+  // tarea de estado — mismo orden y mismo motivo que "review" con
+  // revision/ (TASK-013): si una escritura falla, la tarea no se ha
+  // movido todavia y reintentar es posible, en vez de dejarla en
+  // en-diseno sin plan. El rename de moveTareaFile se lleva despues
+  // la subcarpeta entera.
+  const taskDir = path.dirname(filePath);
+  const ubicacion = await resolverPlanFinal(taskDir);
+
+  // Fail-closed (TASK-027): con los dos ficheros a la vez no hay forma
+  // de saber cual es el plan bueno, y elegir por nuestra cuenta puede
+  // tirar el que la persona redacto. Se aborta ANTES de tocar nada.
+  if (ubicacion.canonicaExiste && ubicacion.legadaExiste) {
+    throw new PlanCommandError(
+      `[ERROR] ${task.id}: hay un ${PLAN_FINAL_FILENAME} en la raiz de la carpeta y otro ` +
+        `en ${PLANIFICACION_DIRNAME}/. No se puede saber cual es el plan bueno. Compara ` +
+        `"${ubicacion.legada}" con "${ubicacion.canonica}", deja solo el de ` +
+        `${PLANIFICACION_DIRNAME}/ y reintenta. La tarea no se ha movido.`
+    );
+  }
 
   // plan-final.md no tiene frontmatter y no encaja en el modelo Task,
   // asi que no pasa por writeTareaFile/moveTareaFile (que son
   // especificas de tarea.md) — pero SI reusa isEexist de task-store.ts
   // en vez de duplicar la comprobacion (hallazgo de revision por
   // pares, TASK-010).
-  const planPath = path.join(path.dirname(newFilePath), PLAN_FINAL_FILENAME);
+  await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME), { recursive: true });
   let planCreated = false;
-  try {
-    // flag 'wx': falla si ya existe, en vez de arriesgarse a pisar un
-    // plan-final.md de una vuelta anterior (re-planificacion).
-    await writeFile(planPath, planTemplate(task), { encoding: 'utf8', flag: 'wx' });
-    planCreated = true;
-  } catch (e: unknown) {
-    if (!isEexist(e)) throw e;
+  let planMigrado = false;
+  if (ubicacion.legadaExiste) {
+    // Tarea planificada con el CLI anterior a TASK-027: el plan real
+    // (redactado o no) esta suelto en la raiz. Se MUEVE, no se copia
+    // ni se pisa con el scaffold — perder un plan redactado seria
+    // exactamente el fallo que este item viene a evitar.
+    await rename(ubicacion.legada, ubicacion.canonica);
+    planMigrado = true;
+  } else if (!ubicacion.canonicaExiste) {
+    try {
+      // flag 'wx': falla si ya existe, en vez de arriesgarse a pisar un
+      // plan-final.md de una vuelta anterior (re-planificacion). La
+      // comprobacion previa no lo hace redundante: entre stat y write
+      // puede aparecer el fichero, y aqui perder contenido es el peor
+      // resultado posible.
+      await writeFile(ubicacion.canonica, planTemplate(task), { encoding: 'utf8', flag: 'wx' });
+      planCreated = true;
+    } catch (e: unknown) {
+      if (!isEexist(e)) throw e;
+    }
   }
 
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+  const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
+
   return {
     id: task.id,
     filePath: newFilePath,
     planPath,
     planCreated,
+    planMigrado,
     asignadoA: asignadoFinal,
     asignadoCambiado,
     avisoIdentidad,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
index e09f6ec..e1f9b49 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
@@ -5,13 +5,13 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, stat, symlink } from 'node:fs/promises';
+import { mkdtemp, mkdir, rm, writeFile, stat, symlink } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
 import { runApproveCommand, ApproveCommandError } from '../../src/commands/approve.js';
-import { PLAN_FINAL_FILENAME } from '../../src/commands/plan.js';
+import { PLAN_FINAL_FILENAME, PLANIFICACION_DIRNAME } from '../../src/commands/plan.js';
 import { StateMachineError } from '../../src/core/state-machine.js';
 import { BaseBranchGuardError } from '../../src/fs/git.js';
 import type { Task } from '../../src/core/task.js';
@@ -72,11 +72,27 @@ async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promis
   }
 }
 
+/** Plan en la ubicacion canonica desde TASK-027: planificacion/plan-final.md. */
 async function writePlanFinal(tareasRoot: string, id: string, content = '# Plan real\n'): Promise<void> {
+  const dir = path.join(tareasRoot, '01-en-diseno', id, PLANIFICACION_DIRNAME);
+  await mkdir(dir, { recursive: true });
+  await writeFile(path.join(dir, PLAN_FINAL_FILENAME), content, 'utf8');
+}
+
+/**
+ * Plan como lo dejaba el CLI ANTERIOR a TASK-027: suelto en la raiz de
+ * la carpeta de la tarea. Es el estado en el que quedo cualquier tarea
+ * planificada antes del cambio, y approve tiene que seguir aceptandolo.
+ */
+async function writePlanFinalLegado(
+  tareasRoot: string,
+  id: string,
+  content = '# Plan real legado\n'
+): Promise<void> {
   await writeFile(path.join(tareasRoot, '01-en-diseno', id, PLAN_FINAL_FILENAME), content, 'utf8');
 }
 
-test('taskctl approve: marca plan_aprobado true cuando la tarea esta en en-diseno y plan-final.md existe', async () => {
+test('taskctl approve: marca plan_aprobado true cuando la tarea esta en en-diseno y planificacion/plan-final.md existe', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nAlgo.\n');
     await writePlanFinal(tareasRoot, 'TASK-800');
@@ -95,6 +111,34 @@ test('taskctl approve: marca plan_aprobado true cuando la tarea esta en en-disen
     assert.equal(read?.task.actualizado, '2026-09-05');
 
     // plan-final.md no se toco.
+    const plan = await stat(
+      path.join(tareasRoot, '01-en-diseno', 'TASK-800', PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME)
+    );
+    assert.ok(plan.isFile());
+  });
+});
+
+// --- item C3 (TASK-027): compatibilidad con el plan legado ---
+
+test('taskctl approve: acepta el plan-final.md legado suelto en la raiz (tareas planificadas antes de TASK-027)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Sin esta compatibilidad, cualquier tarea que se planifico con el
+    // CLI anterior se quedaria sin poder aprobarse: approve diria "no
+    // hay plan" sobre una tarea que tiene el plan redactado.
+    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nAlgo.\n');
+    await writePlanFinalLegado(tareasRoot, 'TASK-800');
+    commitAll(repoRoot, 'tarea TASK-800 con plan legado');
+
+    const result = await runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-06', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.id, 'TASK-800');
+    const read = await readTareaFile(tareasRoot, 'TASK-800');
+    assert.equal(read?.task.plan_aprobado, true);
+
+    // approve no reorganiza la carpeta (eso lo hace "plan"): el fichero
+    // legado sigue donde estaba.
     const plan = await stat(path.join(tareasRoot, '01-en-diseno', 'TASK-800', PLAN_FINAL_FILENAME));
     assert.ok(plan.isFile());
   });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 91658e2..ed4dd77 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -6,12 +6,17 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, rm, readFile, writeFile, stat, chmod } from 'node:fs/promises';
+import { mkdtemp, mkdir, rm, readFile, writeFile, stat, chmod } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
-import { runPlanCommand, PlanCommandError, PLAN_FINAL_FILENAME } from '../../src/commands/plan.js';
+import {
+  runPlanCommand,
+  PlanCommandError,
+  PLAN_FINAL_FILENAME,
+  PLANIFICACION_DIRNAME,
+} from '../../src/commands/plan.js';
 import { StateMachineError } from '../../src/core/state-machine.js';
 import { BaseBranchGuardError } from '../../src/fs/git.js';
 import type { Task } from '../../src/core/task.js';
@@ -79,7 +84,7 @@ async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promis
   }
 }
 
-test('taskctl plan: primera vez mueve la tarea a 01-en-diseno y crea el scaffold de plan-final.md', async () => {
+test('taskctl plan: primera vez mueve la tarea a 01-en-diseno y crea el scaffold en planificacion/', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nAlgo.\n');
     commitAll(repoRoot, 'tarea TASK-700');
@@ -88,8 +93,13 @@ test('taskctl plan: primera vez mueve la tarea a 01-en-diseno y crea el scaffold
 
     assert.equal(result.id, 'TASK-700');
     assert.match(result.filePath, /01-en-diseno[/\\]TASK-700[/\\]tarea\.md$/);
-    assert.equal(result.planPath, path.join(path.dirname(result.filePath), PLAN_FINAL_FILENAME));
+    // El plan vive en planificacion/, no suelto en la raiz (TASK-027).
+    assert.equal(
+      result.planPath,
+      path.join(path.dirname(result.filePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME)
+    );
     assert.equal(result.planCreated, true);
+    assert.equal(result.planMigrado, false);
     assert.equal(result.baseBranchGuard.switched, false);
     assert.equal(result.baseBranchGuard.baseBranch, 'develop');
 
@@ -104,21 +114,32 @@ test('taskctl plan: primera vez mueve la tarea a 01-en-diseno y crea el scaffold
 
     // La carpeta vieja (00-planificadas) ya no existe.
     await assert.rejects(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));
+
+    // Y no queda nada suelto en la raiz de la carpeta de la tarea.
+    await assert.rejects(() =>
+      stat(path.join(path.dirname(result.filePath), PLAN_FINAL_FILENAME))
+    );
   });
 });
 
-test('taskctl plan: re-planificacion (en-diseno, plan_aprobado false) no pisa un plan-final.md existente', async () => {
+test('taskctl plan: re-planificacion (en-diseno, plan_aprobado false) no pisa el plan-final.md existente', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    // Simula una primera vuelta ya hecha: tarea en en-diseno con un
-    // plan-final.md que ya tiene contenido real (no el scaffold).
+    // Simula una primera vuelta ya hecha con el CLI actual: el plan
+    // real (no el scaffold) ya vive en planificacion/.
     await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
     const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
-    await writeFile(path.join(taskDir, PLAN_FINAL_FILENAME), '# Plan real ya redactado\n', 'utf8');
+    await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME), { recursive: true });
+    await writeFile(
+      path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME),
+      '# Plan real ya redactado\n',
+      'utf8'
+    );
     commitAll(repoRoot, 'tarea TASK-700 en diseno');
 
     const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-05', { repoCwd: repoRoot });
 
     assert.equal(result.planCreated, false);
+    assert.equal(result.planMigrado, false);
     assert.match(result.filePath, /01-en-diseno[/\\]TASK-700[/\\]tarea\.md$/);
 
     const planContent = await readFile(result.planPath, 'utf8');
@@ -131,6 +152,87 @@ test('taskctl plan: re-planificacion (en-diseno, plan_aprobado false) no pisa un
   });
 });
 
+// --- item C3 (TASK-027): planificacion/ y migracion del plan legado ---
+
+test('taskctl plan: migra a planificacion/ el plan-final.md legado suelto en la raiz, con su contenido intacto', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Tarea planificada con el CLI ANTERIOR a TASK-027: el plan real,
+    // ya redactado, esta suelto en la raiz de la carpeta.
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
+    const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
+    await writeFile(path.join(taskDir, PLAN_FINAL_FILENAME), '# Plan legado redactado\n', 'utf8');
+    commitAll(repoRoot, 'tarea TASK-700 con plan legado');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot });
+
+    assert.equal(result.planMigrado, true);
+    // No se crea scaffold: el plan que ya habia es el que vale.
+    assert.equal(result.planCreated, false);
+    assert.equal(result.planPath, path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME));
+    assert.equal(await readFile(result.planPath, 'utf8'), '# Plan legado redactado\n');
+
+    // Se MOVIO: no queda una copia suelta que pueda divergir.
+    await assert.rejects(() => stat(path.join(taskDir, PLAN_FINAL_FILENAME)));
+  });
+});
+
+test('taskctl plan: con plan-final.md en la raiz Y en planificacion/ aborta sin tocar nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Estado ambiguo: dos planes distintos, ninguno obviamente el bueno.
+    await writeTareaFile(tareasRoot, sampleTask(), '');
+    const taskDirOrigen = path.join(tareasRoot, '00-planificadas', 'TASK-700');
+    await writeFile(path.join(taskDirOrigen, PLAN_FINAL_FILENAME), '# Plan A (raiz)\n', 'utf8');
+    await mkdir(path.join(taskDirOrigen, PLANIFICACION_DIRNAME), { recursive: true });
+    await writeFile(
+      path.join(taskDirOrigen, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME),
+      '# Plan B (planificacion)\n',
+      'utf8'
+    );
+    commitAll(repoRoot, 'tarea TASK-700 con dos planes');
+
+    await assert.rejects(
+      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot }),
+      PlanCommandError
+    );
+
+    // Fail-closed de verdad: la tarea NO se movio de carpeta y los dos
+    // ficheros siguen donde estaban, con su contenido original.
+    const read = await readTareaFile(tareasRoot, 'TASK-700');
+    assert.equal(read?.task.estado, 'planificada');
+    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700')));
+    assert.equal(
+      await readFile(path.join(taskDirOrigen, PLAN_FINAL_FILENAME), 'utf8'),
+      '# Plan A (raiz)\n'
+    );
+    assert.equal(
+      await readFile(path.join(taskDirOrigen, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME), 'utf8'),
+      '# Plan B (planificacion)\n'
+    );
+  });
+});
+
+test('taskctl plan: planificacion/ viaja con la tarea al cambiar de carpeta de estado', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Una tarea "planificada" con artefactos previos en planificacion/
+    // (p. ej. notas de una vuelta anterior): el cambio de estado tiene
+    // que llevarse la subcarpeta entera, no solo tarea.md.
+    await writeTareaFile(tareasRoot, sampleTask(), '');
+    const origen = path.join(tareasRoot, '00-planificadas', 'TASK-700', PLANIFICACION_DIRNAME);
+    await mkdir(origen, { recursive: true });
+    await writeFile(path.join(origen, 'notas.md'), '# Notas previas\n', 'utf8');
+    commitAll(repoRoot, 'tarea TASK-700 con notas');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot });
+
+    const destino = path.join(path.dirname(result.filePath), PLANIFICACION_DIRNAME);
+    assert.equal(await readFile(path.join(destino, 'notas.md'), 'utf8'), '# Notas previas\n');
+    // Y el scaffold nuevo convive con lo que ya habia.
+    assert.equal(result.planCreated, true);
+    await stat(result.planPath);
+    await assert.rejects(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));
+  });
+});
+
 test('taskctl plan: rechaza si ya esta en en-diseno con plan_aprobado true, sin tocar nada', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno', plan_aprobado: true }), '');
@@ -178,11 +280,14 @@ test('taskctl plan: propaga cualquier error de escritura que NO sea EEXIST (no l
     await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
     commitAll(repoRoot, 'tarea TASK-700 en diseno');
     const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
-    // Carpeta de la tarea sin permiso de escritura: writeFile de
+    // planificacion/ existe pero sin permiso de escritura: writeFile de
     // plan-final.md falla con EACCES, no con EEXIST — debe
     // propagarse tal cual, no tratarse como "ya existe, re-planificacion
-    // normal".
-    await chmod(taskDir, 0o555);
+    // normal". Desde TASK-027 el chmod va sobre la subcarpeta, no sobre
+    // la raiz de la tarea: con la raiz en 0555 el mkdir de
+    // planificacion/ todavia funciona y el fichero se acaba escribiendo.
+    await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME), { recursive: true });
+    await chmod(path.join(taskDir, PLANIFICACION_DIRNAME), 0o555);
     try {
       await assert.rejects(
         () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
@@ -194,7 +299,7 @@ test('taskctl plan: propaga cualquier error de escritura que NO sea EEXIST (no l
       );
     } finally {
       // Restaura permisos para que withTempRepo pueda limpiar el directorio.
-      await chmod(taskDir, 0o755);
+      await chmod(path.join(taskDir, PLANIFICACION_DIRNAME), 0o755);
     }
   });
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
index a695a47..8ebade6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store.test.ts
@@ -1,6 +1,6 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, rm, stat } from 'node:fs/promises';
+import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import {
@@ -151,6 +151,37 @@ test('moveTareaFile: cambia de carpeta cuando el estado cambia y borra la carpet
   });
 });
 
+test('moveTareaFile: se lleva planificacion/ y revision/ enteras al cambiar de carpeta (item C3)', async () => {
+  await withTempRoot(async (root) => {
+    // Las dos subcarpetas de la seccion 2 de la metodologia son
+    // artefactos de la tarea, no del estado: tienen que viajar con
+    // ella. moveTareaFile renombra el directorio completo justo por
+    // esto, pero hasta TASK-027 solo lo cubria revision/ de rebote.
+    const original = sampleTask({ id: 'TASK-062', estado: 'en-diseno' });
+    const filePath = await writeTareaFile(root, original, '');
+    const taskDir = path.dirname(filePath);
+    await mkdir(path.join(taskDir, 'planificacion'), { recursive: true });
+    await mkdir(path.join(taskDir, 'revision'), { recursive: true });
+    await writeFile(path.join(taskDir, 'planificacion', 'plan-final.md'), '# Plan\n', 'utf8');
+    await writeFile(path.join(taskDir, 'revision', 'informe-revision-1.md'), '# Informe\n', 'utf8');
+
+    const updated = { ...original, estado: 'en-curso' as const };
+    const newFilePath = await moveTareaFile(root, filePath, updated, '');
+
+    const nuevoDir = path.dirname(newFilePath);
+    assert.equal(
+      await readFile(path.join(nuevoDir, 'planificacion', 'plan-final.md'), 'utf8'),
+      '# Plan\n'
+    );
+    assert.equal(
+      await readFile(path.join(nuevoDir, 'revision', 'informe-revision-1.md'), 'utf8'),
+      '# Informe\n'
+    );
+    // Y no queda nada en la carpeta vieja.
+    await assert.rejects(() => stat(taskDir));
+  });
+});
+
 test('moveTareaFile: si el estado no cambia, solo reescribe el fichero en el mismo sitio', async () => {
   await withTempRoot(async (root) => {
     const original = sampleTask({ id: 'TASK-061', estado: 'en-curso', titulo: 'v1' });
````
