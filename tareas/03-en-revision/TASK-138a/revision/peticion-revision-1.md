# Peticion de revision — TASK-138a (ronda 1)

- Tarea: TASK-138a — agregador de la suite, mediana y pytest (parte a de TASK-138)
- Rama revisada: fix/task-138-regla-4d-duplicacion-en-metricas-suite-y
- Rama base: develop
- Commit revisado (HEAD): 2a0a6e53d9cb82919feff40a73f8580066810adf
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-138a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-138a/tarea.md
- tareas/03-en-revision/TASK-138a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/estadistica.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts

## Commits a revisar (git log develop..HEAD)

````
2a0a6e5 chore(TASK-138a): autorrevision
c62c44e fix(TASK-138a): un agregador de la suite por version, una mediana y pytest una vez
737035a chore(TASK-138a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index cdba08e..798c066 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -43,7 +43,7 @@
  */
 import { PUERTA_FINISH, PUERTA_REVIEW, resumirFreno, resumirPuerta, sumarPorTarea } from '../core/registro-puertas.js';
 import { claveRuta } from '../fs/cobertura.js';
-import { PUERTA_SUITE } from '../core/crecimiento-suite.js';
+import { ultimaSuitePorTarea } from '../core/crecimiento-suite.js';
 import { leerRegistroPuertas } from '../fs/registro-puertas.js';
 import path from 'node:path';
 import { readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
@@ -502,11 +502,7 @@ export async function leerRepoMetricas(repo: RepoMetricas, varios: boolean): Pro
   const reviewPorTarea = resumirPuerta(registroPuertas, PUERTA_REVIEW);
   const finishPorTarea = resumirPuerta(registroPuertas, PUERTA_FINISH);
   // TASK-129: la ultima completa en verde de cada tarea (numero de tests y duracion).
-  const suitePorTarea = new Map<string, { tests: number | null; completaS: number }>();
-  for (const l of registroPuertas) {
-    if (l.puerta !== PUERTA_SUITE || l.resultado !== 'verde') continue;
-    suitePorTarea.set(l.tarea, { tests: /^\d+$/.test(l.modo) ? Number(l.modo) : null, completaS: l.duracionS });
-  }
+  const suitePorTarea = ultimaSuitePorTarea(registroPuertas);
   const filas: FilaMetricas[] = leidas.map((l) =>
     calcularFila({
       sincronizacionS: sincPorTarea.get(l.task.task.id) ?? null,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
index 007216e..f0c9c71 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
@@ -13,6 +13,7 @@
 import type { LineaPuerta } from './registro-puertas.js';
 import { compararVersiones } from './version.js';
 import { quitarAnsi } from './utilidades-texto.js';
+import { mediana } from './estadistica.js';
 
 /** TASK-129: la puerta con el tamano de la completa: modo = numero de tests (o `-`). */
 export const PUERTA_SUITE = 'suite';
@@ -50,13 +51,13 @@ export function contarTests(salida: string, opciones: { recortada?: boolean } =
   if (jest !== null) return jest;
   const dotnet = ultimo(t, /Total tests:\s*(\d+)/g);
   if (dotnet !== null) return dotnet;
-  const pytestFinal = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
+  // TASK-138a (A3): la linea final de pytest se busca una vez y vale para las dos preguntas.
+  const pytest = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
   const maven = ultimo(t, /Tests run:\s*(\d+)/g);
   if (maven !== null) return opciones.recortada === true && /Reactor Summary/.test(t) ? null : maven;
-  if (opciones.recortada === true && pytestFinal === null) return null;
+  if (opciones.recortada === true && pytest === null) return null;
   const cargo = sumar(t, /test result: \w+\.\s+(\d+) passed;\s+(\d+) failed/g);
   if (cargo !== null) return cargo;
-  const pytest = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
   if (pytest !== null) return Number(pytest[2]) + (pytest[1] === undefined ? 0 : Number(pytest[1]));
   return null;
 }
@@ -69,32 +70,49 @@ export interface SuiteVersion {
   completaS: number | null;
 }
 
-function mediana(xs: readonly number[]): number | null {
-  if (xs.length === 0) return null;
-  const o = [...xs].sort((a, b) => a - b);
-  const m = Math.floor(o.length / 2);
-  return o.length % 2 === 1 ? (o[m] as number) : ((o[m - 1] as number) + (o[m] as number)) / 2;
+/** La ultima completa en verde de una tarea: su numero de tests (si se conto) y su duracion. */
+export interface SuiteDeTarea {
+  tests: number | null;
+  completaS: number;
+}
+
+/**
+ * TASK-138a (A1): la ultima linea `suite` en verde de cada tarea. Es la regla
+ * de las dos vistas (metricas --por-version y el aviso de crecimiento de
+ * doctor): una tarea que corre la completa dos veces cuenta una vez, con la
+ * ultima. Antes doctor sumaba todas las lineas a la mediana.
+ */
+export function ultimaSuitePorTarea(lineas: readonly LineaPuerta[]): Map<string, SuiteDeTarea> {
+  const porTarea = new Map<string, SuiteDeTarea>();
+  for (const l of lineas) {
+    if (l.puerta !== PUERTA_SUITE || l.resultado !== 'verde') continue;
+    porTarea.set(l.tarea, { tests: /^\d+$/.test(l.modo) ? Number(l.modo) : null, completaS: l.duracionS });
+  }
+  return porTarea;
+}
+
+/** TASK-138a (A1, A2): de un grupo de tareas, el mayor numero de tests y la mediana de la duracion. */
+export function resumirSuites(suites: readonly (SuiteDeTarea | null)[]): { tests: number | null; completaS: number | null } {
+  const tests = suites.map((x) => x?.tests ?? null).filter((x): x is number => x !== null);
+  const duraciones = suites.map((x) => x?.completaS ?? null).filter((x): x is number => x !== null);
+  return { tests: tests.length === 0 ? null : Math.max(...tests), completaS: mediana(duraciones) };
 }
 
-/** Por version (orden semver), de las lineas `suite` en verde de las tareas de cada version. */
+/** Por version (orden semver), de la ultima completa en verde de cada tarea de cada version. */
 export function suitePorVersion(
   tareas: readonly { id: string; version: string | null }[],
   lineas: readonly LineaPuerta[]
 ): SuiteVersion[] {
-  const versionDe = new Map(tareas.filter((t) => t.version !== null).map((t) => [t.id, t.version as string]));
-  const tests = new Map<string, number[]>();
-  const duraciones = new Map<string, number[]>();
-  for (const l of lineas) {
-    if (l.puerta !== PUERTA_SUITE || l.resultado !== 'verde') continue;
-    const v = versionDe.get(l.tarea);
-    if (v === undefined) continue;
-    duraciones.set(v, [...(duraciones.get(v) ?? []), l.duracionS]);
-    if (/^\d+$/.test(l.modo)) tests.set(v, [...(tests.get(v) ?? []), Number(l.modo)]);
+  const porTarea = ultimaSuitePorTarea(lineas);
+  const porVersion = new Map<string, SuiteDeTarea[]>();
+  for (const t of tareas) {
+    const suite = porTarea.get(t.id);
+    if (t.version === null || suite === undefined) continue;
+    porVersion.set(t.version, [...(porVersion.get(t.version) ?? []), suite]);
   }
-  return [...new Set([...tests.keys(), ...duraciones.keys()])].sort(compararVersiones).map((version) => ({
+  return [...porVersion.keys()].sort(compararVersiones).map((version) => ({
     version,
-    tests: tests.has(version) ? Math.max(...(tests.get(version) as number[])) : null,
-    completaS: mediana(duraciones.get(version) ?? []),
+    ...resumirSuites(porVersion.get(version) as SuiteDeTarea[]),
   }));
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/estadistica.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/estadistica.ts
new file mode 100644
index 0000000..a0cf2d1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/estadistica.ts
@@ -0,0 +1,14 @@
+/**
+ * TASK-138a (A2 de docs/auditoria-4d.md y CORE2-11 de la auditoria 4D
+ * completa): la mediana, una sola vez. Estaba escrita en core/metricas.ts, en
+ * crecimiento-suite.ts y en linea dentro de versiones-metricas.ts. Sin
+ * dependencias: la usan metricas, evolucion y el aviso de crecimiento de doctor.
+ */
+
+/** Mediana de una lista (media de los dos centrales si es par); null si esta vacia. */
+export function mediana(valores: readonly number[]): number | null {
+  if (valores.length === 0) return null;
+  const v = [...valores].sort((a, b) => a - b);
+  const m = Math.floor(v.length / 2);
+  return v.length % 2 === 1 ? (v[m] as number) : ((v[m - 1] as number) + (v[m] as number)) / 2;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
index 1a64ac1..f1ffbab 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
@@ -34,7 +34,8 @@
  * primer tramo con el ultimo: crece o baja si la mediana cambia mas de un
  * `UMBRAL_TENDENCIA`; si no, se mantiene.
  */
-import { celdaNumero, media, mediana, tablaDeTexto, type Duracion, type FilaMetricas } from './metricas.js';
+import { celdaNumero, media, tablaDeTexto, type Duracion, type FilaMetricas } from './metricas.js';
+import { mediana } from './estadistica.js';
 import { compararIds } from './task.js';
 
 export const TRAMO_POR_DEFECTO = 20;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index d5afbe8..183fe20 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -54,6 +54,7 @@
  * adivinar si un 0 es un cero o una ausencia.
  */
 import { estimadaAnotada } from './duracion-estimada.js';
+import { mediana } from './estadistica.js';
 import { leerCierre } from './cierre.js';
 import {
   leerTransiciones,
@@ -1041,13 +1042,9 @@ export function tareasSinCoste(
     .filter((t) => t.fases.length > 0);
 }
 
-/** Mediana de una lista (media de los dos centrales si es par); null si esta vacia. */
-export function mediana(valores: readonly number[]): number | null {
-  if (valores.length === 0) return null;
-  const v = [...valores].sort((a, b) => a - b);
-  const m = Math.floor(v.length / 2);
-  return v.length % 2 === 1 ? (v[m] as number) : ((v[m - 1] as number) + (v[m] as number)) / 2;
-}
+// TASK-138a (CORE2-11): la mediana vive en core/estadistica.ts; se reexporta aqui
+// para quien ya la tomaba de las metricas.
+export { mediana };
 
 /** Media redondeada a `decimales`; null si la lista esta vacia (nunca NaN). */
 export function media(valores: readonly number[], decimales = 2): number | null {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
index c437dc5..cec3baa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/versiones-metricas.ts
@@ -26,6 +26,7 @@ import { celdaNumero, media, tablaDeTexto, type FilaMetricas } from './metricas.
 import { resumirGrupo } from './grupos-metricas.js';
 import type { ConteoOrigen, ConteoSeveridad } from './informe-revision.js';
 import { compararVersiones } from './version.js';
+import { resumirSuites } from './crecimiento-suite.js';
 
 /** Tokens de una fase en un grupo; `media` null si ninguna tarea tiene dato. */
 export interface CifraTokens {
@@ -101,16 +102,8 @@ export function resumirVersion(version: string | null, filas: readonly FilaMetri
     sinTablaHallazgos: g.sinTablaHallazgos,
     hallazgosPorSeveridad: porSeveridad,
     hallazgosPorOrigen: porOrigen,
-    tests: (() => {
-      const xs = filas.map((f) => f.suite?.tests ?? null).filter((x): x is number => x !== null);
-      return xs.length === 0 ? null : Math.max(...xs);
-    })(),
-    completaS: (() => {
-      const xs = filas.map((f) => f.suite?.completaS ?? null).filter((x): x is number => x !== null).sort((a, b) => a - b);
-      if (xs.length === 0) return null;
-      const m = Math.floor(xs.length / 2);
-      return xs.length % 2 === 1 ? (xs[m] as number) : ((xs[m - 1] as number) + (xs[m] as number)) / 2;
-    })(),
+    // TASK-138a (A1, A2): el mismo resumen que el aviso de crecimiento de doctor.
+    ...resumirSuites(filas.map((f) => f.suite)),
     tokens: {
       diseno: cifraTokens(filas.map((f) => f.tokens.diseno)),
       implementacion: cifraTokens(filas.map((f) => f.tokens.implementacion)),
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-138a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138a/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138a/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-138a/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                    |  9 ++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/crecimiento-suite.js                               | 55 ++++++++++++++++++++++++++++++++-----------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/estadistica.js                                     | 14 ++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/evolucion.js                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                        | 12 ++++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/versiones-metricas.js                              | 14 +++-----------
 13 files changed, 65 insertions(+), 52 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts | 35 ++++++++++++++++++++++++++++++++++-
 1 file changed, 34 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 122.0 s
- Commit verificado: 2a0a6e53d9cb82919feff40a73f8580066810adf
- Huella: 6ed21a467b266894cb97392c1415c4a9ec1e35fa
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 74324 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3677ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (1.278ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (2.1437ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (0.9993ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (0.9962ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.1293ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (5.0163ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (2.0979ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.6456ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.8227ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (0.9619ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (1.5728ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1753.9369ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (2019.6775ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.2213ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.225ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.847ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6593ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7445ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0625ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.2039ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (13.5151ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.8864ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.003ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.7254ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.3178ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.4358ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.3502ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.6351ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5087ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3843ms)
ℹ tests 723
ℹ suites 0
ℹ pass 723
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 104307.575
[verificar-impacto] node --test termino con 0 en 104.6 s.
````
