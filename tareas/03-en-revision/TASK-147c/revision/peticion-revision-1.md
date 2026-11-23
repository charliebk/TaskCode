# Peticion de revision — TASK-147c (ronda 1)

- Tarea: TASK-147c — fases y Marca en metricas (parte c de TASK-147)
- Rama revisada: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
- Rama base: develop
- Commit revisado (HEAD): 81b43088d92a9a194f40bde124f7bae8fa565aee
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-147c (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-147c/tarea.md
- tareas/03-en-revision/TASK-147c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-registro.test.ts

## Commits a revisar (git log develop..HEAD)

````
81b4308 chore(TASK-147c): autorrevision
2976c51 fix(TASK-147c): una lista de fases y una conversion de fila a Marca
941d63f chore(TASK-147c): tarea en curso
60908d7 merge(TASK-147c): develop en fix/task-147-regla-4d-lectores-de-secciones-e-ids-en para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 889cb17..69223b0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -55,7 +55,14 @@
  */
 import { estimadaAnotada } from './duracion-estimada.js';
 import { leerCierre } from './cierre.js';
-import { leerTransiciones, instanteDe, precisionDeFecha, versionDeCierre, type PrecisionFecha } from './transiciones.js';
+import {
+  leerTransiciones,
+  instanteDe,
+  precisionDeFecha,
+  versionDeCierre,
+  type FaseRegistrada,
+  type PrecisionFecha,
+} from './transiciones.js';
 import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState, type TaskType } from './task.js';
 import {
   FASES_COSTE,
@@ -82,8 +89,6 @@ import { extraerSecciones } from './tarea-body.js';
 
 export type OrigenMetricas = 'registro' | 'git' | '—';
 
-/** Fases que se miden. `pausa` solo se cuenta. */
-export type FaseMedida = 'plan' | 'approve' | 'start' | 'review' | 'finish' | 'pausa';
 
 export interface Marca {
   ms: number;
@@ -93,7 +98,7 @@ export interface Marca {
 /** Un commit automatico reconocido: fase y fecha de autor (ms UTC). */
 export interface EventoGit {
   id: string;
-  fase: FaseMedida;
+  fase: FaseRegistrada;
   ms: number;
 }
 
@@ -270,13 +275,16 @@ export interface EntradaMetricas {
   suite?: { tests: number | null; completaS: number } | null;
 }
 
+/** TASK-147c (CORE2-12): segundos del registro de puertas como `Duracion` (ms, al segundo). */
+function duracionDeSegundos(s: number): Duracion {
+  return { valor: Math.round(s * 1000), precision: 'segundo' };
+}
+
 /** TASK-111/128: el resumen de una puerta en la forma de la fila (duracion en ms). */
 function puertaDeFila(
   r: { ejecuciones: number; duracionS: number } | null | undefined
 ): { ejecuciones: number; duracion: Duracion } | null {
-  return r === undefined || r === null
-    ? null
-    : { ejecuciones: r.ejecuciones, duracion: { valor: Math.round(r.duracionS * 1000), precision: 'segundo' } };
+  return r === undefined || r === null ? null : { ejecuciones: r.ejecuciones, duracion: duracionDeSegundos(r.duracionS) };
 }
 
 function kbPorRonda(peticiones: readonly { ronda: number; bytes: number }[]): PeticionRonda[] {
@@ -295,7 +303,7 @@ function kbPorRonda(peticiones: readonly { ronda: number; bytes: number }[]): Pe
 const ASUNTO_CHORE_RE =
   /^chore\((TASK-\d{3,}[a-z]?)\): (tarea en diseno|plan aprobado|tarea en curso|peticion de revision ronda \d+|tarea terminada y artefactos de cierre|pausa registrada)$/;
 
-function faseDeAsunto(resumen: string): FaseMedida {
+function faseDeAsunto(resumen: string): FaseRegistrada {
   if (resumen === 'tarea en diseno') return 'plan';
   if (resumen === 'plan aprobado') return 'approve';
   if (resumen === 'tarea en curso') return 'start';
@@ -334,7 +342,7 @@ interface Marcas {
 }
 
 /** TASK-086: cada racha de `pausa` seguidas, de su primera fila a la siguiente que no lo sea. */
-function intervalosDePausa(orden: readonly { fase: FaseMedida; marca: Marca }[]): IntervaloPausa[] {
+function intervalosDePausa(orden: readonly { fase: FaseRegistrada; marca: Marca }[]): IntervaloPausa[] {
   const intervalos: IntervaloPausa[] = [];
   let abierta: Marca | null = null;
   for (const e of orden) {
@@ -348,10 +356,10 @@ function intervalosDePausa(orden: readonly { fase: FaseMedida; marca: Marca }[])
   return intervalos;
 }
 
-function marcasDe(eventos: readonly { fase: FaseMedida; marca: Marca }[]): Marcas {
+function marcasDe(eventos: readonly { fase: FaseRegistrada; marca: Marca }[]): Marcas {
   // Orden cronologico: el registro ya lo esta, git log va al reves.
   const orden = [...eventos].sort((a, b) => a.marca.ms - b.marca.ms);
-  const primera = (fase: FaseMedida): Marca | null => orden.find((e) => e.fase === fase)?.marca ?? null;
+  const primera = (fase: FaseRegistrada): Marca | null => orden.find((e) => e.fase === fase)?.marca ?? null;
   const finishes = orden.filter((e) => e.fase === 'finish');
   return {
     plan: primera('plan'),
@@ -413,16 +421,25 @@ function ultimaMarca(m: Marcas): Marca | null {
   return m.finish ?? m.review ?? m.start ?? m.plan;
 }
 
+/**
+ * TASK-147c (CORE2-12): las filas del registro de transiciones como marcas,
+ * convertidas una sola vez para la duracion que anota finish
+ * (`minutosPuntaAPunta`) y para la fila de metricas (`calcularFila`).
+ */
+function registroDe(body: string): { fase: FaseRegistrada; marca: Marca }[] {
+  return leerTransiciones(body).map((f) => ({
+    fase: f.fase,
+    marca: { ms: instanteDe(f.fecha), precision: precisionDeFecha(f.fecha) as PrecisionFecha },
+  }));
+}
+
 /**
  * TASK-097: minutos de punta a punta (de la fila start a la ultima finish, sin
  * pausas) del registro de una tarea; null si falta una marca o alguna es de
  * dia (nunca se inventa una cifra).
  */
 export function minutosPuntaAPunta(body: string): number | null {
-  const registro = leerTransiciones(body).map((f) => ({
-    fase: f.fase as FaseMedida,
-    marca: { ms: instanteDe(f.fecha), precision: precisionDeFecha(f.fecha) as PrecisionFecha },
-  }));
+  const registro = registroDe(body);
   if (registro.length === 0) return null;
   const m = marcasDe(registro);
   const d = duracionSinPausas(m.start, m.finish, m.intervalosPausa);
@@ -431,10 +448,7 @@ export function minutosPuntaAPunta(body: string): number | null {
 
 /** Una fila por tarea, sin la parte de heuristica. */
 export function calcularFila(e: EntradaMetricas): FilaMetricas {
-  const registro = leerTransiciones(e.body).map((f) => ({
-    fase: f.fase as FaseMedida,
-    marca: { ms: instanteDe(f.fecha), precision: precisionDeFecha(f.fecha) as PrecisionFecha },
-  }));
+  const registro = registroDe(e.body);
   let origen: OrigenMetricas;
   let marcas: Marcas;
   if (registro.length > 0) {
@@ -486,9 +500,7 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     total: duracionSinPausas(marcas.plan, marcas.finish, marcas.intervalosPausa),
     finish: finishDe(e.body),
     sincronizacion:
-      e.sincronizacionS === undefined || e.sincronizacionS === null
-        ? null
-        : { valor: Math.round(e.sincronizacionS * 1000), precision: 'segundo' },
+      e.sincronizacionS === undefined || e.sincronizacionS === null ? null : duracionDeSegundos(e.sincronizacionS),
     freno: puertaDeFila(e.freno),
     review: puertaDeFila(e.review),
     finishVerificacion: puertaDeFila(e.finishVerificacion),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
index 6872b41..91cfab5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
@@ -19,10 +19,13 @@
  * `limpiarTexto` (sin secuencias ANSI ni caracteres de control, recortado).
  */
 
+import type { FaseRegistrada } from './transiciones.js';
+
 export const VERSION_PROGRESO = 1;
 
 /** Las fases del ciclo de una tarea, en orden: la linea dice en cual va (`review (4/5)`). */
-export const FASES_CICLO = ['plan', 'approve', 'start', 'review', 'finish'] as const;
+// TASK-147c (CORE2-13): `satisfies` ata el ciclo a las fases del registro.
+export const FASES_CICLO = ['plan', 'approve', 'start', 'review', 'finish'] as const satisfies readonly FaseRegistrada[];
 export type FaseCiclo = (typeof FASES_CICLO)[number];
 /** `freno`: el freno de fin de turno, que no es una fase del ciclo (va sin posicion). */
 export type FaseProgreso = FaseCiclo | 'freno';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 50842d1..70f17a5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -49,8 +49,13 @@ import { VERSION_TASKCTL } from './version.js';
 
 export const SECCION_TRANSICIONES = '## Transiciones';
 
-/** Fases que deja en el registro. `pausa` es el «no» del semiautomatico. */
-export type FaseRegistrada = 'plan' | 'approve' | 'start' | 'review' | 'finish' | 'pausa';
+/**
+ * Fases que deja en el registro. `pausa` es el «no» del semiautomatico.
+ * TASK-147b (CORE2-13): la unica lista de fases; el tipo se deriva de ella y
+ * metricas y progreso la usan, asi que una fase nueva no se ignora en silencio.
+ */
+export const FASES_REGISTRADAS = ['plan', 'approve', 'start', 'review', 'finish', 'pausa'] as const;
+export type FaseRegistrada = (typeof FASES_REGISTRADAS)[number];
 
 export type DecididoPor = 'persona' | 'automatico';
 export const DECIDIDO_POR: readonly DecididoPor[] = ['persona', 'automatico'];
@@ -103,7 +108,6 @@ export function formatearInstante(d: Date): string {
   return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
 }
 
-const FASES: readonly FaseRegistrada[] = ['plan', 'approve', 'start', 'review', 'finish', 'pausa'];
 const CABECERA = '| fecha | fase | modo | decidido_por | version |';
 const SEPARADOR = '|---|---|---|---|---|';
 /** Las celdas de la cabecera anterior a TASK-084, la unica que se reescribe. */
@@ -298,7 +302,7 @@ export function leerTransiciones(body: string): FilaTransicion[] {
     // secas haria invisibles las filas nuevas y apagaria en silencio el
     // modo congelado (riesgo del plan): hay un test que lo fija.
     if (precisionDeFecha(fecha) === null) continue;
-    if (!(FASES as readonly string[]).includes(fase)) continue;
+    if (!(FASES_REGISTRADAS as readonly string[]).includes(fase)) continue;
     if (!(MODOS_FLUJO as readonly string[]).includes(modo)) continue;
     if (!(DECIDIDO_POR as readonly string[]).includes(decidido)) continue;
     filas.push({
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-147c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147c/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147c/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147c/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                        | 35 ++++++++++++++++++++---------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/progreso.js                                        |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                    |  9 +++++++--
 12 files changed, 36 insertions(+), 19 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-registro.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-registro.test.ts | 43 +++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 43 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 129.4 s
- Commit verificado: 81b43088d92a9a194f40bde124f7bae8fa565aee
- Huella: 581f73500b9fb7708ed492d517e1b3d23bf12fa1
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 88233 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3637ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.7747ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (2.8788ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.1023ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.0869ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (3.1625ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (4.5278ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (2.9927ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (7.5606ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (4.3646ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.3682ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7595ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1760.2726ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1717.4991ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9807ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.288ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8622ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.7012ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7478ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.061ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.7892ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.3336ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6143ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.7472ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (3.4271ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.6652ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (4.1503ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.0577ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.5211ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5863ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3716ms)
ℹ tests 720
ℹ suites 0
ℹ pass 720
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 119361.3792
[verificar-impacto] node --test termino con 0 en 119.5 s.
````
