# Peticion de revision — TASK-146a (ronda 1)

- Tarea: TASK-146a — import, roadmap y verificar-lote (parte a de TASK-146)
- Rama revisada: fix/task-146-regla-4d-duplicacion-en-new-import-roadm
- Rama base: develop
- Commit revisado (HEAD): 4c04dffb5346185a07a4aea031b358227dbe2246
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-146a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-146a/tarea.md
- tareas/03-en-revision/TASK-146a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts

## Commits a revisar (git log develop..HEAD)

````
4c04dff chore(TASK-146a): autorrevision
6e51ed4 fix(TASK-146a): import como new, roadmap --comparar con prepararRoadmap y verificar-lote sin tragarse fallos
4a40e98 chore(TASK-146a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts
index 8ae30af..5bb7ba3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts
@@ -28,7 +28,7 @@ import type { Task } from '../core/task.js';
 import { autoCommit, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
 import { ensureBaseBranchReady, localBranches, type BaseBranchGuardResult } from '../fs/git.js';
 import { listExistingTaskIds, listTareasEnEstados, TaskAlreadyExistsError } from '../fs/task-store.js';
-import { componerCuerpo, crearTareaEn } from './new.js';
+import { componerCuerpo, crearTareaEn, MODELO_POR_DEFECTO } from './new.js';
 
 export class DoctorDeployTareasError extends Error {
   constructor(message: string) {
@@ -100,7 +100,7 @@ export async function crearTareasDeFallas(informe: InformeDeploy, raiz: string,
             sprint: 0,
             etiquetas: t.etiquetas,
             complejidad: null,
-            modeloSugerido: 'sonnet',
+            modeloSugerido: MODELO_POR_DEFECTO,
             agenteRevisor: config.agente_revisor_por_defecto,
           },
           componerCuerpo(t.objetivo, t.criterios),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
index e4ce4a0..bc464d5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
@@ -33,7 +33,7 @@ import {
   type AutoCommitResult,
 } from '../fs/git-commit.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
-import { TASK_TYPES, TASK_COMPLEXITIES, TaskValidationError, type TaskType, type TaskComplexity } from '../core/task.js';
+import { TASK_TYPES, TaskValidationError, type TaskType, type TaskComplexity } from '../core/task.js';
 import { FrontmatterParseError } from '../core/frontmatter.js';
 import { nextTaskId } from '../core/task-id.js';
 import {
@@ -43,7 +43,7 @@ import {
   TaskAlreadyExistsError,
 } from '../fs/task-store.js';
 import { parseImportMarkdown } from '../core/import-parser.js';
-import { slugify, buildNewTask, SLUG_FALLBACK } from './new.js';
+import { slugify, buildNewTask, componerCuerpo, parsearCamposDeTarea, SLUG_FALLBACK } from './new.js';
 import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
 
 export class ImportCommandError extends Error {}
@@ -60,13 +60,6 @@ export interface ImportOptions {
   agenteRevisor: string;
 }
 
-const DEFAULT_SPRINT = 0;
-/**
- * Sin --complejidad la tarea nace sin declararla (null): la decide la
- * heuristica al planificar (TASK-042, decision C4). Antes era `media`.
- */
-const DEFAULT_COMPLEJIDAD: TaskComplexity | null = null;
-const DEFAULT_MODELO = 'sonnet';
 
 /**
  * Un unico --tipo/--sprint/--complejidad para todo el fichero (no hay
@@ -106,37 +99,9 @@ export function parseImportArgs(
     tipo = tipoRaw as TaskType;
   }
 
-  let complejidad: TaskComplexity | null = DEFAULT_COMPLEJIDAD;
-  const complejidadRaw = flags['complejidad'];
-  if (complejidadRaw !== undefined) {
-    if (
-      typeof complejidadRaw !== 'string' ||
-      !(TASK_COMPLEXITIES as readonly string[]).includes(complejidadRaw)
-    ) {
-      throw new ImportCommandError(
-        `--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`
-      );
-    }
-    complejidad = complejidadRaw as TaskComplexity;
-  }
-
-  let sprint = DEFAULT_SPRINT;
-  const sprintRaw = flags['sprint'];
-  if (sprintRaw !== undefined) {
-    if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
-      throw new ImportCommandError('--sprint debe ser un numero entero no negativo.');
-    }
-    sprint = parseInt(sprintRaw, 10);
-  }
-
-  const modeloSugerido =
-    typeof flags['modelo-sugerido'] === 'string' ? (flags['modelo-sugerido'] as string) : DEFAULT_MODELO;
-  const agenteRevisor =
-    typeof flags['agente-revisor'] === 'string'
-      ? (flags['agente-revisor'] as string)
-      : agenteRevisorPorDefecto;
-
-  return { filePath, tipo, sprint, complejidad, modeloSugerido, agenteRevisor };
+  // TASK-146a (CMD2-06): los mismos campos y valores por defecto que new.
+  const comunes = parsearCamposDeTarea(flags, agenteRevisorPorDefecto, (msg) => new ImportCommandError(msg));
+  return { filePath, tipo, ...comunes };
 }
 
 /**
@@ -276,9 +241,8 @@ export async function runImportCommand(
     }
 
     const id = nextTaskId(existingIds);
-    const body = `## Objetivo\n${entry.objetivo === '' ? '\n' : `\n${entry.objetivo}\n`}\n## Criterios de aceptacion\n${entry.criterios
-      .map((c) => `- [ ] ${c}`)
-      .join('\n')}\n`;
+    // TASK-146a (CMD2-06): el cuerpo con el mismo componerCuerpo que new.
+    const body = componerCuerpo(entry.objetivo === '' ? null : entry.objetivo, entry.criterios);
     const task = buildNewTask(
       id,
       {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index 39a9960..bc4db6e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -58,7 +58,8 @@ const DEFAULT_SPRINT = 0;
  * subir el numero de roles.
  */
 const DEFAULT_COMPLEJIDAD: TaskComplexity | null = null;
-const DEFAULT_MODELO = 'sonnet';
+/** TASK-146a (CMD2-06): el modelo por defecto de una tarea nueva, el mismo en new, import y doctor-deploy. */
+export const MODELO_POR_DEFECTO = 'sonnet';
 export const DEFAULT_BODY = '## Objetivo\n\n\n## Criterios de aceptacion\n- [ ] \n';
 
 /**
@@ -174,48 +175,50 @@ export function parseNewTaskArgs(
     );
   }
 
+  const comunes = parsearCamposDeTarea(flags, agenteRevisorPorDefecto, (m) => new NewTaskArgError(m));
+
+  const etiquetasRaw = flags['etiquetas'];
+  const etiquetas =
+    typeof etiquetasRaw === 'string' && etiquetasRaw.trim() !== ''
+      ? etiquetasRaw
+          .split(',')
+          .map((s) => s.trim())
+          .filter((s) => s.length > 0)
+      : [];
+
+  return { titulo, tipo: tipoRaw as TaskType, etiquetas, ...comunes };
+}
+
+/**
+ * TASK-146a (CMD2-06): --complejidad, --sprint, --modelo-sugerido y
+ * --agente-revisor, con sus valores por defecto. Los comparten new e import
+ * (antes import los copiaba, con su propio 'sonnet'). `fail` construye el
+ * error de cada comando.
+ */
+export function parsearCamposDeTarea(
+  flags: Readonly<Record<string, string | boolean | string[]>>,
+  agenteRevisorPorDefecto: string,
+  fail: (mensaje: string) => Error
+): { complejidad: TaskComplexity | null; sprint: number; modeloSugerido: string; agenteRevisor: string } {
   let complejidad: TaskComplexity | null = DEFAULT_COMPLEJIDAD;
   const complejidadRaw = flags['complejidad'];
   if (complejidadRaw !== undefined) {
-    if (
-      typeof complejidadRaw !== 'string' ||
-      !(TASK_COMPLEXITIES as readonly string[]).includes(complejidadRaw)
-    ) {
-      throw new NewTaskArgError(
-        `--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`
-      );
+    if (typeof complejidadRaw !== 'string' || !(TASK_COMPLEXITIES as readonly string[]).includes(complejidadRaw)) {
+      throw fail(`--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`);
     }
     complejidad = complejidadRaw as TaskComplexity;
   }
-
   let sprint = DEFAULT_SPRINT;
   const sprintRaw = flags['sprint'];
   if (sprintRaw !== undefined) {
     if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
-      throw new NewTaskArgError('--sprint debe ser un numero entero no negativo.');
+      throw fail('--sprint debe ser un numero entero no negativo.');
     }
     sprint = parseInt(sprintRaw, 10);
   }
-
-  const etiquetasRaw = flags['etiquetas'];
-  const etiquetas =
-    typeof etiquetasRaw === 'string' && etiquetasRaw.trim() !== ''
-      ? etiquetasRaw
-          .split(',')
-          .map((s) => s.trim())
-          .filter((s) => s.length > 0)
-      : [];
-
-  const modeloSugerido =
-    typeof flags['modelo-sugerido'] === 'string'
-      ? (flags['modelo-sugerido'] as string)
-      : DEFAULT_MODELO;
-  const agenteRevisor =
-    typeof flags['agente-revisor'] === 'string'
-      ? (flags['agente-revisor'] as string)
-      : agenteRevisorPorDefecto;
-
-  return { titulo, tipo: tipoRaw as TaskType, sprint, etiquetas, complejidad, modeloSugerido, agenteRevisor };
+  const modeloSugerido = typeof flags['modelo-sugerido'] === 'string' ? flags['modelo-sugerido'] : MODELO_POR_DEFECTO;
+  const agenteRevisor = typeof flags['agente-revisor'] === 'string' ? flags['agente-revisor'] : agenteRevisorPorDefecto;
+  return { complejidad, sprint, modeloSugerido, agenteRevisor };
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
index 3c2864f..7b00a4f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
@@ -15,10 +15,9 @@
 import { existsSync, readFileSync } from 'node:fs';
 import path from 'node:path';
 import { rechazarFlagsDesconocidos } from '../cli/args.js';
-import { resolverConfigConAvisos } from '../core/config.js';
 import { compararRoadmaps } from '../core/roadmap-comparar.js';
-import { llevaMarcaTaskctl, ROADMAP_RUTA } from '../core/roadmap.js';
-import { generarDesdeDisco, prepararRoadmap, roadmapEnSincronizacion, type ResultadoRoadmap } from '../fs/roadmap.js';
+import { ROADMAP_RUTA } from '../core/roadmap.js';
+import { generarDesdeDisco, prepararRoadmap, type ResultadoRoadmap } from '../fs/roadmap.js';
 
 export class RoadmapCommandError extends Error {}
 
@@ -96,13 +95,14 @@ export function runRoadmapCommand(repoCwd: string, argv: readonly string[]): Roa
     return { modo: 'comparar', salida: `${lineas.join('\n')}\n`, avisos: generado.avisos, codigo: 0, resultado: null };
   }
 
-  const { config } = resolverConfigConAvisos(repoCwd);
-  if (roadmapEnSincronizacion(config)) {
-    lineas.push(`${ROADMAP_RUTA} esta declarado en rutas_sincronizacion: las transiciones no lo tocan.`);
-  } else if (llevaMarcaTaskctl(actual)) {
-    lineas.push(`${ROADMAP_RUTA} lleva la marca de taskctl: las transiciones lo regeneran.`);
+  // TASK-146a (CMD2-07): lo que haria una transicion lo decide prepararRoadmap
+  // (sincronizacion, mayusculas, cambios sin commitear, marca), no unas reglas
+  // propias de --comparar que se quedaban cortas.
+  const decision = prepararRoadmap(repoCwd, 'transicion', { escribir: false });
+  if (decision.estado === 'omitido' || decision.estado === 'fallido') {
+    lineas.push(`Las transiciones no lo tocan: ${decision.motivo ?? 'motivo desconocido'}`);
   } else {
-    lineas.push(`${ROADMAP_RUTA} no lleva la marca de taskctl: las transiciones no lo tocan.`);
+    lineas.push(`${ROADMAP_RUTA} lleva la marca de taskctl: las transiciones lo regeneran.`);
   }
   const diferencias = compararRoadmaps(actual, generado.texto);
   if (diferencias.length === 0) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
index c9beccd..431555e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
@@ -15,23 +15,21 @@
  * - en rojo, no anota nada y aborta listando esas tareas: son las sospechosas.
  *   La vuelta atras (revertir un merge, abrir un fix) la decide una persona.
  */
-import { readdir, writeFile } from 'node:fs/promises';
-import path from 'node:path';
+import { writeFile } from 'node:fs/promises';
 import { rechazarFlagsDesconocidos, extraerPushFlag } from '../cli/args.js';
 import { resolverConfig } from '../core/config.js';
 import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
 import { PUERTA_FINISH } from '../core/registro-puertas.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
-import { isValidTaskId, STATE_FOLDER } from '../core/task.js';
+import { compararIds } from '../core/task.js';
 import { anotarLineaEnSeccion, MARCA_LOTE_VERDE, pendienteDeLote, SECCION_VERIFICACION_LOTE } from '../core/transiciones.js';
 import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
-import { currentBranch, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
+import { currentBranch, headCommit, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
 import { autoCommit, type AutoCommitResult } from '../fs/git-commit.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
 import { anotarSuite } from './finish-verificacion.js';
-import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
+import { listTareasEnEstados, readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
 import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
-import { spawnSync } from 'node:child_process';
 
 export class VerificarLoteCommandError extends Error {
   constructor(message: string) {
@@ -59,21 +57,22 @@ export interface VerificarLoteResult {
   autoCommit: AutoCommitResult | null;
 }
 
-function headDe(cwd: string): string {
-  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', windowsHide: true });
-  return (r.stdout ?? '').trim();
-}
-
-/** Las tareas terminadas pendientes de lote, en orden de su ultima anotacion. */
+/**
+ * Las tareas terminadas pendientes de lote, por ID. TASK-146a (CMD2-11): con
+ * listTareasEnEstados, que propaga los errores de lectura (antes un EACCES se
+ * tragaba como «sin pendientes»); y una tarea ilegible aborta, porque podria
+ * estar pendiente.
+ */
 async function pendientesDeLote(tareasRoot: string): Promise<ReadTareaResult[]> {
-  let entradas: string[];
-  try {
-    entradas = await readdir(path.join(tareasRoot, STATE_FOLDER.terminada));
-  } catch {
-    return [];
+  const { tareas, ilegibles } = await listTareasEnEstados(tareasRoot, ['terminada']);
+  if (ilegibles.length > 0) {
+    throw new VerificarLoteCommandError(
+      `[ERROR] taskctl verificar-lote: hay tareas terminadas que no se pueden leer (${ilegibles.join(', ')}), y podrian ` +
+        'estar pendientes de lote. Arreglalas y reintenta.'
+    );
   }
   const pendientes: ReadTareaResult[] = [];
-  for (const id of entradas.filter((e) => isValidTaskId(e)).sort()) {
+  for (const id of tareas.map((t) => t.task.id).sort(compararIds)) {
     const t = await readTareaFile(tareasRoot, id);
     if (t !== null && pendienteDeLote(t.body)) pendientes.push(t);
   }
@@ -118,7 +117,8 @@ export async function runVerificarLoteCommand(
     return { pendientes: [], commitVerificado: null, duracionMs: null, autoCommit: null };
   }
   const ids = pendientes.map((t) => t.task.id);
-  const commit = headDe(cwd);
+  // TASK-146a (CMD2-10): headCommit lanza si git falla (antes «lote en verde en » sin commit).
+  const commit = headCommit(cwd);
   const timeoutS = config.timeout_verificacion;
   const inicio = Date.now();
   // MEN-3 (revision TASK-115): como finish, el paso se ve y el comando recibe el contador (TASKCTL_PROGRESO).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
index 0707986..60f18c5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
@@ -45,9 +45,11 @@ export interface ResultadoRoadmap {
    * - escrito: el fichero cambio en disco (ruta y anterior rellenos);
    * - sin-cambios: se genero y coincide byte a byte con el actual;
    * - omitido: las reglas dicen que no se toca (motivo en `motivo`);
-   * - fallido: algo fallo al generar; el fichero queda como estaba.
+   * - fallido: algo fallo al generar; el fichero queda como estaba;
+   * - se-escribiria: con `escribir: false` (TASK-146a, `roadmap --comparar`),
+   *   el fichero cambiaria pero no se ha tocado.
    */
-  estado: 'escrito' | 'sin-cambios' | 'omitido' | 'fallido';
+  estado: 'escrito' | 'sin-cambios' | 'omitido' | 'fallido' | 'se-escribiria';
   /** Ruta absoluta del ROADMAP (aunque no se haya escrito). */
   ruta: string;
   /** Contenido previo, o null si no existia. Para restaurarlo si su `git add` falla. */
@@ -147,8 +149,11 @@ export function generarDesdeDisco(raiz: string, actual: string | null): { texto:
 /**
  * Decide, genera y (si toca) escribe `tareas/ROADMAP.md`. Nunca lanza:
  * todo lo que va mal se devuelve como 'fallido' u 'omitido' con su aviso.
+ * Con `escribir: false` solo decide (TASK-146a, CMD2-07: `roadmap --comparar`
+ * usa estas mismas reglas en vez de las suyas): 'se-escribiria' en lugar de
+ * escribir.
  */
-export function prepararRoadmap(raiz: string, modo: ModoRoadmap): ResultadoRoadmap {
+export function prepararRoadmap(raiz: string, modo: ModoRoadmap, { escribir = true }: { escribir?: boolean } = {}): ResultadoRoadmap {
   const ruta = path.join(raiz, 'tareas', NOMBRE);
   const r = (estado: ResultadoRoadmap['estado'], motivo: string | null, extra: Partial<ResultadoRoadmap> = {}): ResultadoRoadmap => ({
     estado,
@@ -225,6 +230,7 @@ export function prepararRoadmap(raiz: string, modo: ModoRoadmap): ResultadoRoadm
     const avisos = generado.avisos.map((a) => `${ROADMAP_RUTA}: ${a}`);
     if (actual === generado.texto) return r('sin-cambios', null, { anterior: actual, avisos });
 
+    if (!escribir) return r('se-escribiria', null, { anterior: actual, avisos, diferencias });
     writeFileSync(ruta, generado.texto, 'utf8');
     return r('escrito', null, { anterior: actual, avisos, diferencias });
   } catch (e: unknown) {
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-146a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146a/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146a/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-146a/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy-tareas.js                        |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js                                      | 41 +++++++----------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                                         | 44 +++++++++++++++++++++++++-------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/roadmap.js                                     | 19 +++++++++----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-lote.js                              | 36 +++++++++++++++++-------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/roadmap.js                                           |  7 ++++++-
 13 files changed, 74 insertions(+), 87 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/import.test.ts         | 27 +++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts | 18 ++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts | 16 ++++++++++++++++
 3 files changed, 59 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 106.6 s
- Commit verificado: 4c04dffb5346185a07a4aea031b358227dbe2246
- Huella: 1f91a7d9efb8fcebca556fe45c12e570bd711f50
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 117395 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3986ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.8837ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (5.3968ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.6676ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.1231ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (3.0876ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (3.6923ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.785ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.4164ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.9753ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (0.9515ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.8201ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1947.8952ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1635.6035ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.3082ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.4995ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8673ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.625ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.5897ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9913ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.8487ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.8467ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.8085ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.7061ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (10.97ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.2295ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.4985ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8287ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.357ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4671ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3563ms)
ℹ tests 786
ℹ suites 0
ℹ pass 786
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 85817.8095
[verificar-impacto] node --test termino con 0 en 86.0 s.
````
