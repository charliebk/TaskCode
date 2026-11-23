# Peticion de revision — TASK-147b (ronda 1)

- Tarea: TASK-147b — criterios, normalizacion, citar e IDs (parte b de TASK-147)
- Rama revisada: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
- Rama base: develop
- Commit revisado (HEAD): bc04b10ebf2db9a8fc0aefa394eab12ee2c2b9c6
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-147b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-147b/tarea.md
- tareas/03-en-revision/TASK-147b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/ids-y-criterios.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts

## Commits a revisar (git log develop..HEAD)

````
bc04b10 chore(TASK-147b): autorrevision
21e802d fix(TASK-147b): criterios, normalizacion, citar e ID de tarea con un solo lector
81d1961 chore(TASK-147b): tarea en curso
d4d2a8e merge(TASK-147b): develop en fix/task-147-regla-4d-lectores-de-secciones-e-ids-en para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index bdc2e55..7bc4dcf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -53,7 +53,7 @@ import { comandoPropuesto, type ComandoTests } from '../core/comando-tests.js';
 import { comandoParcial, documentacionDeclarada } from '../core/verificacion-proporcional.js';
 import { detectarComandosTests } from '../fs/deteccion-tests.js';
 import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
-import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
+import { STATE_FOLDER, TASK_ID_RE, TASK_STATES, isValidTaskId } from '../core/task.js';
 import { diaLocal, evaluarDocumentoEstado, type TareaTerminadaFecha } from '../core/documento-estado.js';
 import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
 import { urlsDeOrigin } from '../fs/git.js';
@@ -648,7 +648,7 @@ export function comprobarPodaTests(
     return [];
   }
   if (ids.length === 0) return [];
-  const numero = (id: string): number => Number(/^TASK-(\d+)/.exec(id)?.[1] ?? 0);
+  const numero = (id: string): number => Number(TASK_ID_RE.exec(id)?.[1] ?? 0);
   let ultimaPoda = -1;
   for (const id of ids) {
     try {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
index b3a7157..05f9ddb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
@@ -19,6 +19,7 @@ import { resolverPlanFinal } from './plan.js';
 import { planQueCuenta, planRedactado } from './approve.js';
 import { ensureBaseBranchReady, runGit, type BaseBranchGuardResult } from '../fs/git.js';
 import { autoCommit, extraerPushFlag, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
+import { isValidTaskId } from '../core/task.js';
 import { esIdTroceable, leerPartes, planificarTroceo, planTrasTroceo, TroceoError } from '../core/troceo.js';
 
 export class TrocearCommandError extends Error {}
@@ -52,7 +53,7 @@ export async function runTrocearCommand(
   if (id === undefined || id.trim() === '') {
     throw new TrocearCommandError('[ERROR] Falta el ID de la tarea: taskctl trocear TASK-NNN.');
   }
-  if (!/^TASK-\d{3,}[a-z]?$/.test(id)) {
+  if (!isValidTaskId(id)) {
     throw new TrocearCommandError(`[ERROR] "${id}" no es un ID de tarea valido (se espera TASK-NNN).`);
   }
   if (!esIdTroceable(id)) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts
index 00f20c3..8969daa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts
@@ -4,7 +4,7 @@
  * tareas ya leida (src/commands/board.ts se encarga de leerlas) y
  * decide que se filtra y como se ve la tabla.
  */
-import { TASK_STATES, STATE_FOLDER, type Task, type TaskState } from './task.js';
+import { TASK_STATES, STATE_FOLDER, compararIds, type Task, type TaskState } from './task.js';
 
 export interface BoardFilters {
   sprint?: number;
@@ -27,23 +27,6 @@ const STATE_LABEL: Record<TaskState, string> = {
   terminada: 'Terminadas',
 };
 
-const TASK_ID_NUM_RE = /^TASK-(\d+)([a-z]?)$/;
-
-/**
- * Orden numerico por ID, no alfabetico (un ID de 4+ digitos, p. ej.
- * "TASK-1000", ordenaria mal por delante de "TASK-999" con un
- * `localeCompare`/`<` puramente lexicografico: '1' < '9' como primer
- * caracter que difiere). Con los IDs de 3 digitos de hoy no se nota,
- * pero es gratis evitarlo ahora.
- */
-function taskIdSortKey(id: string): number {
-  const m = TASK_ID_NUM_RE.exec(id);
-  // TASK-121: la letra de una parte ordena dentro de su numero (TASK-121a,
-  // TASK-121b, luego TASK-122); sin letra va delante de sus partes.
-  if (!m) return Number.POSITIVE_INFINITY;
-  const letra = m[2] as string;
-  return parseInt(m[1] as string, 10) * 100 + (letra === '' ? 0 : letra.charCodeAt(0) - 96);
-}
 
 /**
  * Rangos aproximados de caracteres de ancho visual doble (East Asian
@@ -127,7 +110,7 @@ export function formatBoard(tasks: readonly Task[]): string {
   for (const estado of TASK_STATES) {
     const grupo = tasks
       .filter((t) => t.estado === estado)
-      .sort((a, b) => taskIdSortKey(a.id) - taskIdSortKey(b.id));
+      .sort((a, b) => compararIds(a.id, b.id));
     if (grupo.length === 0) continue;
     const header = `## ${STATE_LABEL[estado]} (${STATE_FOLDER[estado]}) — ${grupo.length}`;
     blocks.push([header, ...formatTable(grupo)].join('\n'));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
index b6ebb68..dbfacaa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
@@ -35,6 +35,7 @@
  * `UMBRAL_TENDENCIA`; si no, se mantiene.
  */
 import { media, mediana, tablaDeTexto, type Duracion, type FilaMetricas } from './metricas.js';
+import { compararIds } from './task.js';
 
 export const TRAMO_POR_DEFECTO = 20;
 
@@ -77,12 +78,6 @@ export interface Evolucion {
   tramos: TramoEvolucion[];
 }
 
-/** Numero del ID (`TASK-0099` -> 99) para ordenar por numero y no por cadena. */
-export function numeroDeId(id: string): number {
-  const m = /(\d+)$/.exec(id);
-  return m === null ? Number.MAX_SAFE_INTEGER : Number(m[1]);
-}
-
 /** Comparador de cadenas determinista (sin locale). */
 function cmp(a: string, b: string): number {
   return a < b ? -1 : a > b ? 1 : 0;
@@ -94,8 +89,7 @@ export function ordenarPorCierre(filas: readonly FilaMetricas[]): FilaMetricas[]
     (a, b) =>
       cmp(a.cierre ?? '￿', b.cierre ?? '￿') ||
       cmp(a.proyecto, b.proyecto) ||
-      numeroDeId(a.id) - numeroDeId(b.id) ||
-      cmp(a.id, b.id)
+      compararIds(a.id, b.id)
   );
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index c9b7337..0214a0b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -12,7 +12,7 @@
  * state-machine.ts; el test cruza cada fase propuesta con
  * assertTransitionAllowed para que nunca se proponga una ilegal.
  */
-import type { Task } from './task.js';
+import { esIdTroceable, type Task } from './task.js';
 import type { ModoFlujo } from './config.js';
 import type { VeredictoInforme } from './informe-revision.js';
 import { describirExceso, superaUmbral, type LecturaDuracion } from './duracion-estimada.js';
@@ -133,7 +133,7 @@ export function salidasReglaUnaHora(id: string): SalidaPregunta[] {
     comando: `taskctl approve ${id}`,
     descripcion: 'la tarea sigue entera; antes, escribe en el plan el motivo para no trocearla',
   };
-  if (!/^TASK-\d{3,}$/.test(id)) return [aprobar];
+  if (!esIdTroceable(id)) return [aprobar];
   return [
     {
       opcion: 'trocear',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 94c8bcf..5fa1cd1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -7,6 +7,7 @@
  * la ronda incremental de `taskctl review`: que dijo la ronda anterior,
  * desde que commit se reviso y que hallazgos siguen abiertos.
  */
+import { quitarDiacriticos } from './tarea-body.js';
 import { rangoDeSeccion } from './transiciones.js';
 
 const PREFIJO_VEREDICTO = '- veredicto:';
@@ -171,13 +172,14 @@ export interface LecturaTodosHallazgos {
 }
 
 function normalizarCelda(c: string): string {
-  return c
-    .trim()
-    .replace(/^[*_`]+/, '')
-    .replace(/[*_`]+$/, '')
-    .trim()
-    .normalize('NFD')
-    .replace(/[̀-ͯ]/g, '');
+  // TASK-147b (CORE2-05): sin diacriticos con el helper comun; conserva mayusculas.
+  return quitarDiacriticos(
+    c
+      .trim()
+      .replace(/^[*_`]+/, '')
+      .replace(/[*_`]+$/, '')
+      .trim()
+  );
 }
 
 /** Origen normalizado: minusculas, sin tildes ni enfasis; fuera del vocabulario, `sin clasificar`. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts
index 9f19e46..b948719 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts
@@ -18,7 +18,7 @@
  *   TASK-044): sin el, nacerian bloqueadas por la puerta de plan.
  */
 import type { Task } from './task.js';
-import type { SeccionesTarea } from './tarea-body.js';
+import { citar, type SeccionesTarea } from './tarea-body.js';
 import { frentesDe, gruposComunes, MAX_CRITERIOS } from './validacion-tarea.js';
 
 export interface PropuestaParticion {
@@ -30,13 +30,6 @@ export interface PropuestaParticion {
   markdown: string;
 }
 
-function citar(texto: string): string {
-  return texto
-    .split(/\r?\n/)
-    .map((l) => (l.trim() === '' ? '>' : `> ${l.trimEnd()}`))
-    .join('\n');
-}
-
 export function proponerParticion(task: Task, s: SeccionesTarea): PropuestaParticion | null {
   const frentes = frentesDe(s.grupos);
   if (frentes.length < 2) return null;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
index d0644eb..84f8351 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
@@ -16,6 +16,7 @@
  * con `--escribir`).
  */
 import { CABECERA_TABLA_HITO, extraerZonaManual, normalizarFinales } from './roadmap.js';
+import { compararIds } from './task.js';
 
 export interface FilaRoadmap {
   hito: number;
@@ -131,13 +132,6 @@ export function extraerEstructura(texto: string): EstructuraRoadmap {
   return { tareas, hitos, zonaManual, noComparables, duplicadas, textoPropio };
 }
 
-function numero(id: string): number {
-  // TASK-121: la letra de una parte ordena dentro de su numero (TASK-121a < TASK-121b < TASK-122).
-  const m = /(\d+)([a-z]?)$/.exec(id);
-  if (m === null) return Number.MAX_SAFE_INTEGER;
-  return Number(m[1]) * 100 + (m[2] === '' ? 0 : (m[2] as string).charCodeAt(0) - 96);
-}
-
 function mismaLista(a: readonly string[], b: readonly string[]): boolean {
   const x = [...new Set(a)].sort();
   const y = [...new Set(b)].sort();
@@ -171,7 +165,7 @@ export function compararRoadmaps(actual: string, generado: string): string[] {
     else if (ta !== tg) difs.push(`hito H${h}: titulo "${ta}" en el actual y "${tg}" en el generado.`);
   }
 
-  const ids = [...new Set([...a.tareas.keys(), ...g.tareas.keys()])].sort((x, y) => numero(x) - numero(y));
+  const ids = [...new Set([...a.tareas.keys(), ...g.tareas.keys()])].sort(compararIds);
   for (const id of ids) {
     const fa = a.tareas.get(id);
     const fg = g.tareas.get(id);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts
index a5b5c01..93fe2ca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts
@@ -21,7 +21,7 @@
  *    ambas incluidas. De ahi salen tambien los titulos y el orden de los
  *    hitos (`### Hn — titulo`).
  */
-import type { TaskComplexity, TaskState } from './task.js';
+import { compararIds, type TaskComplexity, type TaskState } from './task.js';
 
 /** Ruta del ROADMAP relativa a la raiz del repo, con separadores POSIX. */
 export const ROADMAP_RUTA = 'tareas/ROADMAP.md';
@@ -128,11 +128,6 @@ export function titulosDeHitos(zonaManual: string | null): Map<number, string> {
   return titulos;
 }
 
-function numeroDe(id: string): number {
-  const m = /(\d+)$/.exec(id);
-  return m === null ? Number.MAX_SAFE_INTEGER : Number(m[1]);
-}
-
 function comparar(a: readonly number[], b: readonly number[]): number {
   for (let i = 0; i < a.length; i++) {
     const d = (a[i] ?? 0) - (b[i] ?? 0);
@@ -144,7 +139,7 @@ function comparar(a: readonly number[], b: readonly number[]): number {
 /**
  * Orden topologico estable (Kahn con prioridad): de las tareas sin
  * predecesoras pendientes sale primero la de clave menor (rango del hito,
- * hito, numero). Las que quedan dentro de un ciclo no salen nunca por
+ * hito y despues el ID con compararIds). Las que quedan dentro de un ciclo no salen nunca por
  * Kahn: se devuelven aparte, en orden de clave.
  */
 function ordenar(
@@ -153,7 +148,7 @@ function ordenar(
 ): { orden: string[]; atascadas: string[] } {
   const clave = (id: string): number[] => {
     const t = tareas.get(id)!;
-    return [rango.get(t.sprint) ?? Number.MAX_SAFE_INTEGER, t.sprint, numeroDe(id)];
+    return [rango.get(t.sprint) ?? Number.MAX_SAFE_INTEGER, t.sprint];
   };
   const pendientes = new Map<string, Set<string>>();
   const dependientes = new Map<string, string[]>();
@@ -168,7 +163,7 @@ function ordenar(
   const listas = [...tareas.keys()].filter((id) => pendientes.get(id)!.size === 0);
   const orden: string[] = [];
   while (listas.length > 0) {
-    listas.sort((a, b) => comparar(clave(a), clave(b)));
+    listas.sort((a, b) => comparar(clave(a), clave(b)) || compararIds(a, b));
     const id = listas.shift()!;
     orden.push(id);
     for (const s of dependientes.get(id)!) {
@@ -180,7 +175,7 @@ function ordenar(
   const vistos = new Set(orden);
   const atascadas = [...tareas.keys()]
     .filter((id) => !vistos.has(id))
-    .sort((a, b) => comparar(clave(a), clave(b)));
+    .sort((a, b) => comparar(clave(a), clave(b)) || compararIds(a, b));
   return { orden, atascadas };
 }
 
@@ -234,7 +229,7 @@ export function generarRoadmap(
   const rango = new Map<number, number>([...titulos.keys()].map((h, i) => [h, i]));
 
   const tareas = new Map<string, TareaRoadmap>();
-  for (const t of [...lista].sort((a, b) => numeroDe(a.id) - numeroDe(b.id) || a.id.localeCompare(b.id))) {
+  for (const t of [...lista].sort((a, b) => compararIds(a.id, b.id))) {
     if (!tareas.has(t.id)) tareas.set(t.id, t);
   }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
index dc15d6b..fc43a64 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
@@ -50,6 +50,12 @@ export interface SeccionesTarea {
    * verifican despues de `finish`). No cuentan para cerrar la tarea.
    */
   criteriosTrasCierre: string[];
+  /**
+   * TASK-147b (CORE2-04): los `criterios` cuya casilla sigue sin marcar
+   * (`- [ ]`). Es lo que finish exige marcado; las de `Tras el cierre` no
+   * cuentan, tampoco en negrita (`**Tras el cierre**`).
+   */
+  criteriosSinMarcar: string[];
   /**
    * TASK-044: los mismos `criterios`, agrupados como los escribio la
    * persona. Abre grupo un subtitulo `###` (salvo `Tras el cierre`) o una
@@ -77,7 +83,7 @@ const RE_SUBTITULO = /^ {0,3}#{3,6}(?:\s|$)/;
 const TITULO_TRAS_CIERRE = 'tras el cierre';
 
 /** Linea de checklist: "- [ ] texto", "- [x] texto", "* [X] texto". */
-const RE_CRITERIO = /^\s*[-*]\s+\[[ xX]\]\s*(.*)$/;
+const RE_CRITERIO = /^\s*[-*]\s+\[([ xX])\]\s*(.*)$/;
 
 /** Continuacion indentada de la linea de checklist anterior. */
 const RE_CONTINUACION = /^\s+\S/;
@@ -96,10 +102,24 @@ const TITULO_CRITERIOS = 'criterios de aceptacion';
  * su manera, "migracion" casaria en un sitio y no en el otro.
  */
 export function normalizarTexto(texto: string): string {
+  return quitarDiacriticos(texto).toLowerCase();
+}
+
+/**
+ * TASK-147b (CORE2-05): el texto sin diacriticos, conservando mayusculas
+ * (las celdas de un informe llevan IDs y rutas). `normalizarTexto` es esto
+ * mas minusculas.
+ */
+export function quitarDiacriticos(texto: string): string {
+  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
+}
+
+/** TASK-147b (CORE2-07): `texto` como cita de Markdown (`> `; `>` en las lineas en blanco). */
+export function citar(texto: string): string {
   return texto
-    .normalize('NFD')
-    .replace(/[\u0300-\u036f]/g, '')
-    .toLowerCase();
+    .split(/\r?\n/)
+    .map((l) => (l.trim() === '' ? '>' : `> ${l.trimEnd()}`))
+    .join('\n');
 }
 
 /** El titulo de una cabecera tal como se escribio (para mostrarlo). */
@@ -133,6 +153,8 @@ export function extraerSecciones(body: string): SeccionesTarea {
   const lineas = body.split(/\r?\n/);
   const objetivo: string[] = [];
   const normales: string[] = [];
+  // Indice paralelo a `normales`: true si su casilla esta sin marcar.
+  const sinMarcar: boolean[] = [];
   const trasCierre: string[] = [];
   // A que lista van ahora los criterios: los de `### Tras el cierre` van
   // aparte (TASK-046).
@@ -196,8 +218,11 @@ export function extraerSecciones(body: string): SeccionesTarea {
     if (seccion === 'criterios') {
       const criterio = RE_CRITERIO.exec(linea);
       if (criterio !== null) {
-        destino.push((criterio[1] ?? '').trim());
-        if (destino === normales) grupoDe.push(titulosGrupo.length - 1);
+        destino.push((criterio[2] ?? '').trim());
+        if (destino === normales) {
+          grupoDe.push(titulosGrupo.length - 1);
+          sinMarcar.push(criterio[1] === ' ');
+        }
         continuable = true;
         continue;
       }
@@ -230,6 +255,7 @@ export function extraerSecciones(body: string): SeccionesTarea {
     objetivo: objetivo.join('\n').trim(),
     criterios: normales,
     criteriosTrasCierre: trasCierre,
+    criteriosSinMarcar: normales.filter((_, k) => sinMarcar[k] === true),
     grupos,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
index 88e4aec..2054d63 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
@@ -9,7 +9,8 @@
  * las tareas que crea `taskctl doctor-deploy --crear-tareas` sin chocar con
  * las que se crean a mano.
  */
-const TASK_ID_RE = /^TASK-(\d{3,})[a-z]?$/;
+import { TASK_ID_RE } from './task.js';
+
 /** `feature/task-9999-slug`, `fix/task-9998`: el numero de tarea dentro del nombre de una rama. */
 const RAMA_TASK_RE = /(?:^|\/)task-(\d{3,})(?:-|$)/i;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
index 5a71097..e112dc6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
@@ -129,7 +129,12 @@ export const TASK_FIELD_ORDER: readonly (keyof Task)[] = [
   'dependencias',
 ];
 
-const TASK_ID_RE = /^TASK-\d{3,}[a-z]?$/;
+/**
+ * TASK-147b (CORE2-01, FS-04, CMD2-08): la unica regex del ID de tarea.
+ * Grupo 1, el numero (3 cifras o mas); grupo 2, la letra de una parte de un
+ * troceo (`TASK-121a`) o ''.
+ */
+export const TASK_ID_RE = /^TASK-(\d{3,})([a-z]?)$/;
 
 /** Valida el formato de un ID de tarea sin construir un Task completo.
  *  Se usa como guarda de seguridad ANTES de construir rutas de archivo
@@ -139,6 +144,35 @@ export function isValidTaskId(id: string): boolean {
   return TASK_ID_RE.test(id);
 }
 
+/** `TASK-121` -> true; `TASK-121a` -> false (una parte no se vuelve a trocear). CORE2-14. */
+export function esIdTroceable(id: string): boolean {
+  const m = TASK_ID_RE.exec(id);
+  return m !== null && m[2] === '';
+}
+
+// Para ordenar se acepta cualquier numero de cifras (`TASK-0099`, `TASK-12`).
+const ID_PARA_ORDENAR_RE = /^TASK-(\d+)([a-z]?)$/;
+
+/**
+ * TASK-147b (CORE2-01): el orden de los IDs de tarea, el mismo en board,
+ * wip, roadmap y evolucion. Por numero (TASK-999 antes que TASK-1000), y
+ * dentro del numero la tarea entera antes que sus partes (TASK-121,
+ * TASK-121a, TASK-121b, TASK-122). Lo que no es un ID va al final, por cadena.
+ */
+export function compararIds(a: string, b: string): number {
+  const ma = ID_PARA_ORDENAR_RE.exec(a);
+  const mb = ID_PARA_ORDENAR_RE.exec(b);
+  if (ma === null || mb === null) {
+    if (ma !== mb) return ma === null ? 1 : -1;
+    return a < b ? -1 : a > b ? 1 : 0;
+  }
+  const d = Number(ma[1]) - Number(mb[1]);
+  if (d !== 0) return d;
+  const la = ma[2] as string;
+  const lb = mb[2] as string;
+  return la < lb ? -1 : la > lb ? 1 : 0;
+}
+
 export class InvalidTaskIdError extends Error {
   constructor(public readonly id: string) {
     super(`"${id}" no es un ID de tarea valido (se espera el formato TASK-NNN, o TASK-NNNa si es una parte de un troceo).`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
index 677c7ae..26d17f0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
@@ -15,8 +15,9 @@
  * Trocear lo decide una persona (regla de una hora): este modulo no decide
  * nada, solo valida que las partes esten completas.
  */
-import type { Task } from './task.js';
+import { esIdTroceable, type Task } from './task.js';
 import { leerDuracionEstimada, type LecturaDuracion } from './duracion-estimada.js';
+import { citar } from './tarea-body.js';
 import { anadirSeccionAlFinal, dentroDeBloque } from './transiciones.js';
 
 export class TroceoError extends Error {}
@@ -30,10 +31,8 @@ export interface ParteTroceo {
   duracion: LecturaDuracion;
 }
 
-/** `TASK-121` -> true; `TASK-121a` -> false (una parte no se vuelve a trocear). */
-export function esIdTroceable(id: string): boolean {
-  return /^TASK-\d{3,}$/.test(id);
-}
+// TASK-147b (CORE2-14): la regla vive en core/task.ts; se reexporta para trocear y start.
+export { esIdTroceable } from './task.js';
 
 const CABECERA_TROCEO_RE = /^##\s+troceo\s*$/i;
 const CABECERA_PARTE_RE = /^###\s+parte\s+([a-z])\s*[:.\-–—]\s*(.+?)\s*$/i;
@@ -139,13 +138,6 @@ export function leerPartes(plan: string, id: string): ParteTroceo[] {
   });
 }
 
-function citar(texto: string): string {
-  return texto
-    .split(/\r?\n/)
-    .map((l) => (l.trim() === '' ? '>' : `> ${l.trimEnd()}`))
-    .join('\n');
-}
-
 function objetivoDeParte(task: Task, parte: ParteTroceo, ids: readonly string[]): string {
   return (
     `Parte ${parte.letra} del troceo de ${task.id} (${task.titulo}), partes ${ids.join(', ')} ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
index 0db3495..79d9283 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts
@@ -14,7 +14,7 @@
  *   criterio hecho solo de palabras vagas sin nada comprobable.
  * - AVISA de lo que conviene mirar: 9 a 12 criterios y criterios sin ancla.
  */
-import type { GrupoCriterios, SeccionesTarea } from './tarea-body.js';
+import { extraerSecciones, normalizarTexto, type GrupoCriterios, type SeccionesTarea } from './tarea-body.js';
 import { contenidoDeSeccion } from './transiciones.js';
 
 /**
@@ -62,7 +62,7 @@ function esTransversal(g: GrupoCriterios): boolean {
   if (g.titulo === null) return true;
   // Basta la primera palabra: «Comunes a ambos» o «Transversal (suite)»
   // tambien son transversales (MEN-3 de la revision de TASK-044).
-  const primera = normalizar(g.titulo).split(/[^a-z]+/).find((p) => p !== '') ?? '';
+  const primera = normalizarTexto(g.titulo).split(/[^a-z]+/).find((p) => p !== '') ?? '';
   return GRUPOS_TRANSVERSALES.includes(primera);
 }
 
@@ -100,10 +100,6 @@ const PALABRAS_VACIAS = new Set([
 /** Comandos que cuentan como ancla aunque vayan sin comillas invertidas. */
 const COMANDOS = ['taskctl', 'git', 'npm', 'pnpm', 'node', 'bash', 'npx'];
 
-function normalizar(s: string): string {
-  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
-}
-
 /**
  * true si el criterio cita algo comprobable: codigo entre comillas
  * invertidas, una ruta (`/` o una extension), un flag `--x`, un comando,
@@ -117,7 +113,7 @@ export function tieneAncla(criterio: string): boolean {
   if (/[\w.-]+\/[\w.-]+\/[\w./-]+/.test(criterio) || /\b[\w-]+\.(ts|js|mjs|md|sh|json|yml|yaml|java|cs|vue|py)\b/i.test(criterio)) {
     return true;
   }
-  const n = normalizar(criterio);
+  const n = normalizarTexto(criterio);
   if (/\b(test|tests|prueba|pruebas|suite|mutante|mutantes)\b/.test(n)) return true;
   if (COMANDOS.some((c) => new RegExp(`\\b${c}\\b`).test(n))) return true;
   // Numeros, pero no los de un ID, una seccion o una sigla con digito
@@ -133,7 +129,7 @@ export function tieneAncla(criterio: string): boolean {
 
 /** true si, quitando palabras vacias, todo lo que queda son palabras vagas. */
 export function esSoloVago(criterio: string): boolean {
-  const palabras = normalizar(criterio)
+  const palabras = normalizarTexto(criterio)
     .split(/[^a-z0-9]+/)
     .filter((p) => p !== '' && !PALABRAS_VACIAS.has(p));
   if (palabras.length === 0) return false;
@@ -207,28 +203,11 @@ export function planEsEsqueleto(contenido: string, plantillas: readonly string[]
   return propias.length === 0;
 }
 
-/** Criterios normales sin marcar (las casillas de `### Tras el cierre` no cuentan). */
+/**
+ * Criterios normales sin marcar (las casillas de `Tras el cierre` no cuentan).
+ * TASK-147b (CORE2-04): con `extraerSecciones`, el mismo lector de criterios
+ * que el resto del flujo (`### Criterios`, `**Tras el cierre**` en negrita).
+ */
 export function casillasSinMarcar(body: string): string[] {
-  const lineas = body.replace(/\r/g, '').split('\n');
-  const pendientes: string[] = [];
-  let enCriterios = false;
-  let enTrasCierre = false;
-  for (const l of lineas) {
-    const cab = /^ {0,3}(#{2,6})\s+(.*?)\s*#*\s*$/.exec(l);
-    if (cab !== null) {
-      const nivel = (cab[1] as string).length;
-      const titulo = normalizar(cab[2] as string);
-      if (nivel === 2) {
-        enCriterios = titulo === 'criterios de aceptacion';
-        enTrasCierre = false;
-      } else if (enCriterios) {
-        enTrasCierre = titulo === 'tras el cierre';
-      }
-      continue;
-    }
-    if (!enCriterios || enTrasCierre) continue;
-    const m = /^\s*[-*]\s+\[ \]\s*(.*)$/.exec(l);
-    if (m !== null) pendientes.push((m[1] ?? '').trim());
-  }
-  return pendientes;
+  return extraerSecciones(body).criteriosSinMarcar;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
index 0002823..03284cc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
@@ -24,7 +24,7 @@
  * fallo que este limite existe para evitar ("evitar que se programe
  * codigo de una tarea en la rama Git de otra tarea", Carlos, #13).
  */
-import { STATE_FOLDER, type TareaUbicada, type TaskState } from './task.js';
+import { STATE_FOLDER, compararIds, type TareaUbicada, type TaskState } from './task.js';
 import { CONFIG_DEFAULTS } from './config.js';
 
 /**
@@ -139,7 +139,7 @@ export function tareasQueBloquean(
   if (buscada === null) return [];
   const ocupadas = tareas
     .filter((t) => t.task.id !== idQueArranca && personaDeTarea(t.task.asignado_a) === buscada)
-    .sort((a, b) => a.task.id.localeCompare(b.task.id));
+    .sort((a, b) => compararIds(a.task.id, b.task.id));
   // Se devuelven TODAS las ocupadas, no solo las que sobran: el
   // mensaje de error tiene que poder nombrar cual hay que cerrar, y
   // con un limite de 3 y 3 abiertas no hay ninguna "sobrante" — hay
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
index d48c71c..0707986 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
@@ -31,12 +31,11 @@ import {
   ROADMAP_RUTA,
   type TareaRoadmap,
 } from '../core/roadmap.js';
-import { STATE_FOLDER, TASK_STATES } from '../core/task.js';
+import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
 import { parseTareaFile } from '../core/tarea-file.js';
 import { runGit } from './git.js';
 
 const NOMBRE = 'ROADMAP.md';
-const TASK_DIR_RE = /^TASK-\d{3,}[a-z]?$/;
 
 /** Para que se prepara: una transicion (reglas estrictas) o `taskctl roadmap --escribir` (explicito). */
 export type ModoRoadmap = 'transicion' | 'escribir';
@@ -79,7 +78,7 @@ export function leerTareasRoadmap(raiz: string): TareasLeidas {
       continue;
     }
     for (const entrada of entradas) {
-      if (!TASK_DIR_RE.test(entrada) || vistos.has(entrada)) continue;
+      if (!isValidTaskId(entrada) || vistos.has(entrada)) continue;
       const fichero = path.join(dir, entrada, 'tarea.md');
       if (!existsSync(fichero)) continue;
       try {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
index 6c60dfd..a7e25a8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
@@ -17,6 +17,7 @@ import path from 'node:path';
 import {
   STATE_FOLDER,
   assertValidTaskId,
+  isValidTaskId,
   type Task,
   type TareaUbicada,
   type TaskState,
@@ -24,7 +25,6 @@ import {
 import { parseTareaFile, serializeTareaFile } from '../core/tarea-file.js';
 
 const ALL_STATE_FOLDERS: readonly string[] = Object.values(STATE_FOLDER);
-const TASK_ID_RE = /^TASK-\d{3,}[a-z]?$/;
 
 export async function listExistingTaskIds(tareasRoot: string): Promise<string[]> {
   const ids: string[] = [];
@@ -38,7 +38,7 @@ export async function listExistingTaskIds(tareasRoot: string): Promise<string[]>
       throw e;
     }
     for (const entry of entries) {
-      if (TASK_ID_RE.test(entry)) ids.push(entry);
+      if (isValidTaskId(entry)) ids.push(entry);
     }
   }
   return ids;
@@ -69,7 +69,7 @@ export interface TareasEnEstadosResult {
  * de `estados`.
  *
  * Las rutas se construyen solo con nombres de directorio que ya
- * pasaron TASK_ID_RE, asi que no hay ID de fuera que llegue a
+ * pasaron isValidTaskId, asi que no hay ID de fuera que llegue a
  * componer una ruta (misma precaucion que assertValidTaskId en el
  * resto del modulo).
  */
@@ -90,7 +90,7 @@ export async function listTareasEnEstados(
       throw e;
     }
     for (const entry of entries) {
-      if (!TASK_ID_RE.test(entry)) continue;
+      if (!isValidTaskId(entry)) continue;
       if (porId.has(entry)) continue;
       const filePath = path.join(dir, entry, 'tarea.md');
       let content: string;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
index a672344..bb932f7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
@@ -23,7 +23,7 @@
  * sitio.
  */
 import path from 'node:path';
-import { STATE_FOLDER, type TareaUbicada, type TaskState } from '../core/task.js';
+import { STATE_FOLDER, isValidTaskId, type TareaUbicada, type TaskState } from '../core/task.js';
 import { parseTareaFile } from '../core/tarea-file.js';
 import { listTareasEnEstados, type TareasEnEstadosResult } from './task-store.js';
 import {
@@ -34,7 +34,6 @@ import {
   showFileAtRef,
 } from './git.js';
 
-const TASK_ID_RE = /^TASK-\d{3,}[a-z]?$/;
 
 /**
  * Ramas locales que cuentan como trabajo abierto: ni la base ni la
@@ -97,7 +96,7 @@ export function ramasDeTrabajoAbiertas(repoCwd: string, baseBranch: string): str
 function idDesdeRuta(ruta: string): string | null {
   const partes = ruta.split('/');
   const id = partes[partes.length - 2];
-  return id !== undefined && TASK_ID_RE.test(id) ? id : null;
+  return id !== undefined && isValidTaskId(id) ? id : null;
 }
 
 /**
````

## Excluido del diff (27 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-147b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147b/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147b/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147b/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                      |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/trocear.js                                     |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/board-format.js                                    | 21 ++-------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/evolucion.js                                       |  9 ++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                           | 17 ++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                                |  8 ++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/particion-tarea.js                                 |  7 +------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roadmap-comparar.js                                | 10 ++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roadmap.js                                         | 38 +++++++++++++++++++++++++++++---------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-body.js                                      | 29 +++++++++++++++++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task-id.js                                         |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js                                            | 35 ++++++++++++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/troceo.js                                          | 31 +++++++++++++++++++++----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/validacion-tarea.js                                | 58 ++++++++++++++++++++++++++--------------------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/wip.js                                             |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/roadmap.js                                           |  5 ++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/task-store.js                                        |  9 ++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/wip-scan.js                                          |  5 ++---
 27 files changed, 183 insertions(+), 122 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/ids-y-criterios.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts        |  3 +--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/ids-y-criterios.test.ts  | 69 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts |  2 +-
 3 files changed, 71 insertions(+), 3 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 98.9 s
- Commit verificado: bc04b10ebf2db9a8fc0aefa394eab12ee2c2b9c6
- Huella: 7947821f5baacdcc1acdeca6724e6244d774fe2d
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 90893 bytes en total):

````
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1679.2188ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1654.5638ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.0785ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.3235ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.95ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.7446ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7706ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1087ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.5647ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.3166ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.9141ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (7.219ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.9776ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.3852ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (3.0552ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.1036ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4761ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4463ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3292ms)
✔ moveTareaFile (TASK-053): un EPERM que dura dos intentos no impide mover la tarea (62.9337ms)
✔ moveTareaFile (TASK-053): un EBUSY que no cede se propaga tras los reintentos y la tarea sigue en su sitio (67.7095ms)
✔ moveTareaFile (TASK-053, MEN-1 de su revision): un rename que movio la carpeta pero devolvio EPERM se da por bueno (47.9928ms)
✔ moveTareaFile (TASK-053): un error que no es transitorio no se reintenta (21.2062ms)
✔ listTareasEnEstados: tareasRoot inexistente devuelve vacio, no lanza (29.8135ms)
✔ listTareasEnEstados: lee solo las carpetas pedidas, ignorando el resto (87.0709ms)
✔ listTareasEnEstados: un tarea.md ilegible va a "ilegibles", no rompe la lectura (51.1399ms)
✔ listTareasEnEstados: una carpeta de tarea SIN tarea.md dentro se ignora (42.9514ms)
✔ listTareasEnEstados: ignora entradas que no son un ID de tarea (83.143ms)
✔ listTareasEnEstados: el mismo ID en dos carpetas ocupa un hueco, no dos (52.4758ms)
✔ listTareasEnEstados: las rutas ilegibles vienen ordenadas (mensaje reproducible) (62.0356ms)
✔ listTareasEnEstados: acepta cualquier subconjunto de estados, no solo el del WIP (64.6378ms)
ℹ tests 763
ℹ suites 0
ℹ pass 763
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 86836.9752
[verificar-impacto] node --test termino con 0 en 87.0 s.
````
