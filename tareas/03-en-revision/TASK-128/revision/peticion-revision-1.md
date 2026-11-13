# Peticion de revision — TASK-128 (ronda 1)

- Tarea: TASK-128 — Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores
- Rama revisada: feature/task-128-metricas-de-verificacion-por-puerta-tiem
- Rama base: develop
- Commit revisado (HEAD): b057c57d625465ec13e9dde707a32b27236e5c21
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-128 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-128/tarea.md
- tareas/03-en-revision/TASK-128/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-puertas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts

## Commits a revisar (git log develop..HEAD)

````
b057c57 feat(TASK-128): registro de las verificaciones de review y finish y metricas por puerta con rondas solo por menores
8830a76 chore(TASK-128): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index b1ff2b8..0362c81 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,7 @@
 # Changelog
 
 ## Sin publicar
+- Cambio de comportamiento (TASK-128): `review` y `finish` anotan cada verificacion en el registro de puertas (puertas `review` y `finish`). `taskctl metricas` anade las columnas `review_n`, `review_v`, `finish_n`, `finish_v` y `rondas_men` (rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE) y, debajo de la tabla, la fila de totales de las puertas de verificacion. Las columnas anteriores no cambian.
 - TASK-125 (feature) — Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea (2026-11-13)
 - TASK-111 (feature) — P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo (2026-11-13)
 - Cambio de comportamiento (TASK-111): el freno Stop anota cada ejecucion en el registro de puertas (puerta `freno`: verde, rojo, omitido o excedido) y `taskctl metricas` la resume en las columnas `freno_n` y `freno`. Si la huella del arbol es la de su ultimo verde, el freno ya no vuelve a verificar, tampoco con cambios sin commitear.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
index 94ceeaf..f170d41 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
@@ -183,7 +183,13 @@ tarea** con clave revisor + ID), `hall_origen` (implementación/plan/
 especificación/sin clasificar, de la columna `Origen`), `cierre` (día del último
 `finish`), `origen` (`registro`, `git` o «—»), `estimada`, `finish`,
 `punta_a_punta` y `sinc` (lo que suma `comando_sincronizacion` en la tarea,
-del registro de puertas; «—» sin líneas). Un informe sin tabla de hallazgos
+del registro de puertas; «—» sin líneas), `freno_n` y `freno` (veces que el
+freno de fin de turno ejecutó la verificación y su tiempo), `review_n` y
+`review_v` (verificaciones de ronda de `review`), `finish_n` y `finish_v`
+(verificaciones de `finish`) — las `omitido` (servidas de memo) no cuentan
+como ejecución — y `rondas_men` (rondas abiertas tras una ronda sin CRÍTICO ni
+IMPORTANTE; «—» sin informes o con un informe sin tabla). Debajo de la tabla,
+la fila «Puertas de verificacion (todas las tareas)» suma cada puerta. Un informe sin tabla de hallazgos
 deja `crit`/`imp`/`men`/`hall_origen` en «—»: sin dato, no cero. Con `--tokens`,
 además `tok_diseno`, `tok_curso`, `tok_revision`, `tok_total` y el desglose de
 `## Coste`: `tok_nuevos` (entrada + escritura de caché + salida),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
index e93efe7..5297cdf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
@@ -45,6 +45,17 @@ un campo vacío se escribe `-`.
   (veces que el freno ejecutó de verdad la verificación: las `omitido` no
   cuentan) y `freno` (el tiempo de todas sus líneas); sin líneas, `—`.
 
+## Puertas `review` y `finish`
+
+`taskctl review` anota una línea `review` por cada verificación de ronda (modo
+`selectiva` o `documentacion`) y `taskctl finish` una línea `finish` por cada
+verificación de cierre (modo `completa`, `selectiva`, `documentacion`, y
+`pesada` cuando se separen los tests pesados), también cuando sale en rojo y
+el comando aborta. `resultado`: `verde`, `rojo` u `omitido` (el memo ya tenía
+el verde y no se ejecutó). `--sin-verificacion` no anota nada: no hubo puerta.
+`taskctl metricas` las resume en `review_n`/`review_v` y `finish_n`/`finish_v`
+y en la fila de totales de debajo de la tabla.
+
 ## Puerta `freno`
 
 El freno de fin de turno (hook `Stop`) anota una línea cada vez que llega a
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index fa30fa8..6a70dda 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -59,6 +59,8 @@ import { currentBranch, isWorkspaceClean } from '../fs/git.js';
 import { autoCommit, mensajeChore } from '../fs/git-commit.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
 import { ejecutarVerificacion, guardarMemo, huellaDelArbol, verificarConMemo } from '../fs/verificacion.js';
+import { PUERTA_FINISH } from '../core/registro-puertas.js';
+import { anotarPuerta } from '../fs/registro-puertas.js';
 import { FinishCommandError } from './finish-opciones.js';
 
 export const FLAG_SIN_VERIFICACION = '--sin-verificacion';
@@ -105,6 +107,29 @@ export interface PuertaVerificacionOpts {
 }
 
 /** Las opciones de ejecucion del comando: el timeout de los tests y el entorno con el contador. */
+/**
+ * TASK-128: cada verificacion de `finish` anota una linea de la puerta `finish`
+ * en el registro de puertas (docs/registro-puertas.md), tambien en rojo.
+ * `modo` = tipo de verificacion; `omitido` si salio del memo sin ejecutar.
+ */
+function anotarFinish(
+  cwd: string,
+  id: string,
+  modo: string,
+  inicioMs: number,
+  estado: string,
+  deMemo = false
+): void {
+  anotarPuerta(cwd, {
+    puerta: PUERTA_FINISH,
+    tarea: id,
+    instante: new Date().toISOString(),
+    modo,
+    duracionS: (Date.now() - inicioMs) / 1000,
+    resultado: deMemo ? 'omitido' : estado === 'verde' ? 'verde' : 'rojo',
+  });
+}
+
 function opcionesEjecucion(o: PuertaVerificacionOpts): { timeoutMs?: number; env?: NodeJS.ProcessEnv } {
   return {
     ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
@@ -212,6 +237,7 @@ export async function puertaVerificacion(
   const timeoutS = config.timeout_verificacion;
   const inicioMs = Date.now();
   const r = ejecutarVerificacion(o.cwd, comando, timeoutS, opcionesEjecucion(o));
+  anotarFinish(o.cwd, o.id, 'completa', inicioMs, r.estado);
   // El memo solo con el arbol limpio: es la huella del commit que consulta el
   // guardian de merges; con el arbol sucio no la casaria nunca (MEN-3).
   const limpio = isWorkspaceClean(o.cwd);
@@ -258,7 +284,9 @@ async function puertaSoloDocumentacion(
   const c = { commit };
 
   if (decision.comando !== null) {
+    const inicioDoc = Date.now();
     const r = ejecutarVerificacion(o.cwd, decision.comando, timeoutS, opcionesEjecucion(o));
+    anotarFinish(o.cwd, o.id, 'documentacion', inicioDoc, r.estado);
     const limpio = isWorkspaceClean(o.cwd);
     const huella = limpio ? huellaDelArbol(o.cwd, decision.comando, timeoutS) : null;
     if (huella !== null) guardarMemo(o.cwd, huella, r, 'documentacion');
@@ -368,11 +396,13 @@ async function puertaSelectiva(
   timeoutS: number,
   ramaBase: string
 ): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
+  const inicioSel = Date.now();
   const v = verificarConMemo(
     o.cwd,
     { tipo: 'selectiva', comando: decision.comando, timeoutS, base: ramaBase, memoSoloVerde: true },
     opcionesEjecucion(o)
   );
+  anotarFinish(o.cwd, o.id, 'selectiva', inicioSel, v.resultado.estado, v.deMemo);
   if (v.resultado.estado !== 'verde') {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: no se mergea con la verificacion selectiva en rojo (comando_verificacion_selectiva: ` +
@@ -495,7 +525,9 @@ export function puertaReintento(o: PuertaReintentoOpts): ResultadoReintento {
       'alli): se verifica el arbol de la rama de integracion antes de cerrar.'
   );
   if (peticion === null) return { tipo: 'verde', que: 'documentacion', deMemo: false };
+  const inicioReintento = Date.now();
   const v = verificarConMemo(o.cwd, { ...peticion, memoSoloVerde: true }, opciones);
+  anotarFinish(o.cwd, o.id, peticion.tipo, inicioReintento, v.resultado.estado, v.deMemo);
   if (v.resultado.estado !== 'verde') {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: la rama ya esta integrada en "${o.ramaIntegracion}", pero la verificacion de su arbol no sale ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index f665c12..c367fa8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -41,7 +41,7 @@
  * y los CRITICO/IMPORTANTE de su informe; `--json` lo lleva en `lecturasRevision`.
  * No entra en `--escribir`, y todo sale del repo: nunca se lee `~/.claude`.
  */
-import { resumirFreno, sumarPorTarea } from '../core/registro-puertas.js';
+import { PUERTA_FINISH, PUERTA_REVIEW, resumirFreno, resumirPuerta, sumarPorTarea } from '../core/registro-puertas.js';
 import { leerRegistroPuertas } from '../fs/registro-puertas.js';
 import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
@@ -54,6 +54,7 @@ import { leerTransiciones } from '../core/transiciones.js';
 import {
   COLUMNAS_HEURISTICA,
   COLUMNAS_METRICAS,
+  lineaTotalesPuertas,
   COLUMNAS_TOKENS,
   COLUMNAS_DESGLOSE_TOKENS,
   COLUMNA_PROYECTO,
@@ -505,10 +506,15 @@ export async function leerRepoMetricas(repo: RepoMetricas, varios: boolean): Pro
   const registroPuertas = leerRegistroPuertas(repo.ruta);
   const sincPorTarea = sumarPorTarea(registroPuertas, 'sincronizacion');
   const frenoPorTarea = resumirFreno(registroPuertas);
+  // TASK-128: las verificaciones de review y de finish, de la misma lectura.
+  const reviewPorTarea = resumirPuerta(registroPuertas, PUERTA_REVIEW);
+  const finishPorTarea = resumirPuerta(registroPuertas, PUERTA_FINISH);
   const filas: FilaMetricas[] = leidas.map((l) =>
     calcularFila({
       sincronizacionS: sincPorTarea.get(l.task.task.id) ?? null,
       freno: frenoPorTarea.get(l.task.task.id) ?? null,
+      review: reviewPorTarea.get(l.task.task.id) ?? null,
+      finishVerificacion: finishPorTarea.get(l.task.task.id) ?? null,
       task: l.task.task,
       body: l.task.body,
       ronda: l.ronda,
@@ -700,6 +706,9 @@ export async function runMetricasCommand(
       output: [
         formatearTabla(filas, columnas),
         '',
+        // TASK-128: la fila de totales de las puertas de verificacion.
+        lineaTotalesPuertas(filas),
+        '',
         ...notasFilaEnriquecida(filas, varios),
         '',
         ...seccionTokens(filas),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 97b8dd7..88b81cb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -34,6 +34,8 @@ import { raizDelRepo, resolverConfig } from '../core/config.js';
 import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertura.js';
 import { formatearVerificacionRoja, seccionVerificacionRevision } from '../core/informe-verificacion.js';
 import { verificarConMemo, type VerificacionConMemo } from '../fs/verificacion.js';
+import { PUERTA_REVIEW } from '../core/registro-puertas.js';
+import { anotarPuerta } from '../fs/registro-puertas.js';
 import { peticionDeTrabajo, type PlanVerificacion } from '../fs/decision-documentacion.js';
 import { anotarLineaEnSeccion, registrarTransicion } from '../core/transiciones.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
@@ -1292,6 +1294,7 @@ function verificacionDeRonda(
   if (plan.tipo !== 'selectiva' && plan.tipo !== 'documentacion') return null;
   const comando = plan.comando as string;
   const motivo = plan.tipo === 'documentacion' ? plan.motivo : null;
+  const inicioVerificacion = Date.now();
   const v = verificarConMemo(
     raiz,
     motivo !== null
@@ -1299,6 +1302,15 @@ function verificacionDeRonda(
       : { tipo: 'selectiva', comando, timeoutS: plan.timeoutS, base },
     { env: entornoVerificacion() }
   );
+  // TASK-128: la verificacion de la ronda queda en el registro de puertas, tambien en rojo.
+  anotarPuerta(raiz, {
+    puerta: PUERTA_REVIEW,
+    tarea: id,
+    instante: new Date().toISOString(),
+    modo: motivo !== null ? 'documentacion' : 'selectiva',
+    duracionS: (Date.now() - inicioVerificacion) / 1000,
+    resultado: v.deMemo ? 'omitido' : v.resultado.estado === 'verde' ? 'verde' : 'rojo',
+  });
   const nombre =
     motivo !== null
       ? 'la comprobacion de documentacion (comando_verificacion_documentacion: solo cambia documentacion)'
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index e65c551..4db2edf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -422,6 +422,35 @@ export interface ResumenHallazgos {
   severidadesDesconocidas: SeveridadDesconocida[];
 }
 
+/**
+ * TASK-128: rondas abiertas solo por MENORES: cuantas rondas k >= 2 se
+ * abrieron tras una ronda k-1 cuyos informes no traen ningun CRITICO ni
+ * IMPORTANTE (en cualquier estado). null = sin dato: sin informes, o con un
+ * informe sin tabla de hallazgos en una ronda k-1 que haria falta mirar
+ * (contar solo los demas daria una cifra menor con aspecto de buena).
+ */
+export function rondasSoloMenores(informes: readonly InformeLeido[]): number | null {
+  if (informes.length === 0) return null;
+  const porRonda = new Map<number, InformeLeido[]>();
+  for (const inf of informes) porRonda.set(inf.ronda, [...(porRonda.get(inf.ronda) ?? []), inf]);
+  let cuenta = 0;
+  for (const ronda of porRonda.keys()) {
+    if (ronda < 2) continue;
+    const previos = porRonda.get(ronda - 1);
+    if (previos === undefined) continue;
+    let bloqueante = false;
+    for (const inf of previos) {
+      const { tabla, hallazgos } = leerHallazgos(inf.texto);
+      if (!tabla) return null;
+      if (hallazgos.some((h) => h.severidadReconocida === 'CRITICO' || h.severidadReconocida === 'IMPORTANTE')) {
+        bloqueante = true;
+      }
+    }
+    if (!bloqueante) cuenta++;
+  }
+  return cuenta;
+}
+
 export function resumirHallazgos(informes: readonly InformeLeido[]): ResumenHallazgos {
   const informesSinTabla: string[] = [];
   const severidadesDesconocidas: SeveridadDesconocida[] = [];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index a9b63dc..c110e3e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -69,6 +69,7 @@ import {
 import {
   leerHallazgos,
   resumirHallazgos,
+  rondasSoloMenores,
   veredictoDeRonda,
   type InformeLeido,
   type ResumenHallazgos,
@@ -225,6 +226,12 @@ export interface FilaMetricas {
   sincronizacion: Duracion | null;
   /** TASK-111: veces que corrio el freno Stop y su tiempo total; null sin lineas de la tarea. */
   freno: { ejecuciones: number; duracion: Duracion } | null;
+  /** TASK-128: verificaciones de ronda de review (veces y tiempo); null sin lineas de la tarea. */
+  review: { ejecuciones: number; duracion: Duracion } | null;
+  /** TASK-128: verificaciones de finish (veces y tiempo); null sin lineas de la tarea. */
+  finishVerificacion: { ejecuciones: number; duracion: Duracion } | null;
+  /** TASK-128: rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE; null sin dato. */
+  rondasSoloMenores: number | null;
 }
 
 export interface EntradaMetricas {
@@ -244,6 +251,19 @@ export interface EntradaMetricas {
   sincronizacionS?: number | null;
   /** TASK-111: el freno Stop de la tarea en el registro de puertas; sin dato, null. */
   freno?: { ejecuciones: number; duracionS: number } | null;
+  /** TASK-128: las verificaciones de review de la tarea en el registro de puertas; sin dato, null. */
+  review?: { ejecuciones: number; duracionS: number } | null;
+  /** TASK-128: las verificaciones de finish de la tarea en el registro de puertas; sin dato, null. */
+  finishVerificacion?: { ejecuciones: number; duracionS: number } | null;
+}
+
+/** TASK-111/128: el resumen de una puerta en la forma de la fila (duracion en ms). */
+function puertaDeFila(
+  r: { ejecuciones: number; duracionS: number } | null | undefined
+): { ejecuciones: number; duracion: Duracion } | null {
+  return r === undefined || r === null
+    ? null
+    : { ejecuciones: r.ejecuciones, duracion: { valor: Math.round(r.duracionS * 1000), precision: 'segundo' } };
 }
 
 function kbPorRonda(peticiones: readonly { ronda: number; bytes: number }[]): PeticionRonda[] {
@@ -455,10 +475,10 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
       e.sincronizacionS === undefined || e.sincronizacionS === null
         ? null
         : { valor: Math.round(e.sincronizacionS * 1000), precision: 'segundo' },
-    freno:
-      e.freno === undefined || e.freno === null
-        ? null
-        : { ejecuciones: e.freno.ejecuciones, duracion: { valor: Math.round(e.freno.duracionS * 1000), precision: 'segundo' } },
+    freno: puertaDeFila(e.freno),
+    review: puertaDeFila(e.review),
+    finishVerificacion: puertaDeFila(e.finishVerificacion),
+    rondasSoloMenores: rondasSoloMenores(e.informes ?? []),
     puntaAPunta: duracionSinPausas(marcas.start, marcas.finish, marcas.intervalosPausa),
     estimadaMin: estimadaAnotada(e.body),
     enPausa: enPausaDe(marcas),
@@ -552,8 +572,33 @@ export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
   // TASK-111: el freno Stop de la tarea: cuantas veces corrio de verdad y cuanto sumo.
   { cabecera: 'freno_n', valor: (f) => (f.freno === null ? '—' : String(f.freno.ejecuciones)) },
   { cabecera: 'freno', valor: (f) => (f.freno === null ? '—' : formatearDuracion(f.freno.duracion)) },
+  // TASK-128: las verificaciones de review y de finish, y las rondas abiertas solo por MENORES.
+  { cabecera: 'review_n', valor: (f) => (f.review === null ? '—' : String(f.review.ejecuciones)) },
+  { cabecera: 'review_v', valor: (f) => (f.review === null ? '—' : formatearDuracion(f.review.duracion)) },
+  { cabecera: 'finish_n', valor: (f) => (f.finishVerificacion === null ? '—' : String(f.finishVerificacion.ejecuciones)) },
+  { cabecera: 'finish_v', valor: (f) => (f.finishVerificacion === null ? '—' : formatearDuracion(f.finishVerificacion.duracion)) },
+  { cabecera: 'rondas_men', valor: (f) => (f.rondasSoloMenores === null ? '—' : String(f.rondasSoloMenores)) },
 ];
 
+/**
+ * TASK-128: la fila de totales de las puertas de verificacion, debajo de la
+ * tabla: ejecuciones y tiempo de cada puerta sumando todas las tareas. Una
+ * puerta sin lineas en ninguna tarea sale con `—`.
+ */
+export function lineaTotalesPuertas(filas: readonly FilaMetricas[]): string {
+  const total = (sel: (f: FilaMetricas) => { ejecuciones: number; duracion: Duracion } | null): string => {
+    const con = filas.map(sel).filter((x): x is { ejecuciones: number; duracion: Duracion } => x !== null);
+    if (con.length === 0) return '—';
+    const n = con.reduce((a, x) => a + x.ejecuciones, 0);
+    const ms = con.reduce((a, x) => a + x.duracion.valor, 0);
+    return `${String(n)} (${formatearDuracion({ valor: ms, precision: 'segundo' })})`;
+  };
+  return (
+    `Puertas de verificacion (todas las tareas): freno ${total((f) => f.freno)}, ` +
+    `review ${total((f) => f.review)}, finish ${total((f) => f.finishVerificacion)}`
+  );
+}
+
 /** Primera columna con varios proyectos (`--repo` repetido): el ID solo no identifica la tarea. */
 export const COLUMNA_PROYECTO: ColumnaMetricas = { cabecera: 'proyecto', valor: (f) => f.proyecto };
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
index 8df9604..7b98b76 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
@@ -93,11 +93,31 @@ export interface ResumenFreno {
   duracionS: number;
 }
 
+/**
+ * TASK-128: las verificaciones de ronda de `review` y las de `finish`, con el
+ * mismo formato. `modo` es el tipo de verificacion (`selectiva`,
+ * `documentacion`, `completa`; `pesada` la anadira la verificacion por tipo de
+ * rama) y `resultado` `verde`, `rojo` u `omitido` (servido de memo, sin
+ * ejecutar).
+ */
+export const PUERTA_REVIEW = 'review';
+export const PUERTA_FINISH = 'finish';
+/** Las puertas de verificacion que resume `metricas`, en su orden. */
+export const PUERTAS_VERIFICACION = Object.freeze([PUERTA_FRENO, PUERTA_REVIEW, PUERTA_FINISH] as const);
+
 /** Por tarea: cuantas veces corrio el freno y cuanto sumo. Ignora las demas puertas. */
 export function resumirFreno(lineas: readonly LineaPuerta[]): Map<string, ResumenFreno> {
+  return resumirPuerta(lineas, PUERTA_FRENO);
+}
+
+/**
+ * TASK-128: por tarea, cuantas veces ejecuto de verdad `puerta` (las `omitido`
+ * no cuentan) y cuanto sumaron todas sus lineas. Ignora las demas puertas.
+ */
+export function resumirPuerta(lineas: readonly LineaPuerta[], puerta: string): Map<string, ResumenFreno> {
   const resumen = new Map<string, ResumenFreno>();
   for (const l of lineas) {
-    if (l.puerta !== PUERTA_FRENO) continue;
+    if (l.puerta !== puerta) continue;
     const r = resumen.get(l.tarea) ?? { ejecuciones: 0, duracionS: 0 };
     if (l.resultado !== 'omitido') r.ejecuciones += 1;
     r.duracionS += l.duracionS;
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-128/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-128/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-128/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-128/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-128/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-128/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-128/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-128/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-128/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        | 24 ++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   | 12 ++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 12 ++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                               | 34 ++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       | 38 ++++++++++++++++++++++++++++++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/registro-puertas.js                               | 20 +++++++++++++++++++-
 15 files changed, 135 insertions(+), 8 deletions(-)
````

## Tests del diff (9 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-puertas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts      |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts    | 18 ++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts        |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts               |  8 +++++---
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts   | 40 ++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts | 15 +++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts            |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-puertas.test.ts           | 99 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts                   |  6 +++---
 9 files changed, 186 insertions(+), 12 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 161.0 s
- Commit verificado: b057c57d625465ec13e9dde707a32b27236e5c21
- Huella: 515a3df778971664ca4e2ec1b2530f225dcfc116
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 115987 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.7634ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.5497ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9705ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.5967ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (7.7829ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.5837ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.6774ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.053ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (1.5222ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.7264ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.2965ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (1.0306ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.9512ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.6194ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (39.3219ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (2.0815ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (1.8471ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.562ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3342ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.159ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.2843ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2038ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2236ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.1962ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2021ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.23ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.2135ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.136ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1441ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1367ms)
✔ resolverAsignado: recorta los tres escalones (0.1425ms)
ℹ tests 896
ℹ suites 0
ℹ pass 896
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 149933.0428
[verificar-impacto] node --test termino con 0 en 150.0 s.
````
