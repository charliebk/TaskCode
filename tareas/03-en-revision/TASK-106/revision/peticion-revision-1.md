# Peticion de revision — TASK-106 (ronda 1)

- Tarea: TASK-106 — Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial
- Rama revisada: feature/task-106-verificacion-proporcional-b3-finish-veri
- Rama base: develop
- Commit revisado (HEAD): 3c2c50c00aeb0dfc9b48288b37045af942a70650
- Fecha: 2026-11-11
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-106 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-106/tarea.md
- tareas/03-en-revision/TASK-106/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts

## Commits a revisar (git log develop..HEAD)

````
3c2c50c docs(TASK-106): constancia de autorrevision
89f9e82 fix(TASK-106): el reintento que acaba en la completa lo anota bajo la parcial
c376be0 feat(TASK-106): finish verifica con la selectiva del nivel 2
729917c chore(TASK-106): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
index 083a927..5fc7764 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-cobertura.ts
@@ -88,6 +88,15 @@ export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
     );
     return { tipo: 'omitida' };
   }
+  // TASK-106 (decision de Carlos): la selectiva no regenera el informe de toda
+  // la suite; un lcov parcial no es medida fiable. Se mide en la completa del release.
+  if (o.verificacion.tipo === 'selectiva') {
+    o.onAviso?.(
+      `${o.id}: se verifico con la selectiva, que no regenera el informe de cobertura entero: el umbral de ` +
+        `cobertura (${umbral} %) no se mide aqui, sino en la verificacion completa del release.`
+    );
+    return { tipo: 'omitida' };
+  }
   if (o.verificacion.tipo === 'sin-comando') {
     throw new FinishCommandError(
       `[ERROR] ${o.id}: "${o.ramaBase}" declara umbral_cobertura (${umbral} %), pero la rama no declara ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 1b8bf91..e72b4c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -13,9 +13,20 @@
  * y el rastro sobrevive aunque el proceso muera despues del script. Escribirla
  * sin commitear ensuciaria el workspace y el script de Git-Flow abortaria.
  *
- * TASK-091: la verificacion selectiva no cuenta aqui. Aunque las rondas de
- * revision corrieran la selectiva, `finish` ejecuta la COMPLETA sobre el
- * commit que va a integrar, y el guardian solo lee el memo de la completa.
+ * TASK-091: sin `rutas_verificacion_parcial` en la base, la selectiva no
+ * cuenta aqui: aunque las rondas la corrieran, `finish` ejecuta la COMPLETA.
+ *
+ * TASK-106 (nivel 2): si la base declara `rutas_verificacion_parcial` y todo
+ * el codigo de la tarea cae en ellas, se ejecuta `comando_verificacion_selectiva`
+ * (con RAMA_BASE y su timeout) en vez de la completa. Excepcion acotada a la
+ * decision de TASK-072, de Carlos (2026-11-11): para la selectiva SI se
+ * reutiliza el memo del Stop o de review, solo si casa la huella (arbol
+ * limpio, mismo HEAD, misma base y su SHA) y estaba en verde; un rojo o un
+ * corte se vuelven a ejecutar. La completa sigue sin memo. El verde selectivo
+ * se guarda solo en el memo selectivo, nunca en el de la completa. Se anota en
+ * la tarea DESPUES del verde (anotar antes cambiaria HEAD y el memo no casaria
+ * nunca). Un hotfix nunca usa la selectiva (`permitirSelectiva`), pero
+ * conserva su camino de solo documentacion; un release no recibe `ramaBase`.
  *
  * Tras un verde se guarda el memo con la huella del arbol (limpio, igual que
  * `huellaDeCommit` del commit de la rama): es lo que consulta el guardian de
@@ -34,13 +45,18 @@ import { writeFile } from 'node:fs/promises';
 import { resolverConfig } from '../core/config.js';
 import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
-import { anotarVerificacionDocumentacion, anotarVerificacionOmitida } from '../core/transiciones.js';
-import type { DecisionVerificacion } from '../core/verificacion-proporcional.js';
-import { decidirVerificacionEntre, motivoDeLaCompleta } from '../fs/decision-documentacion.js';
+import {
+  anotarCompletaTrasParcial,
+  anotarVerificacionDocumentacion,
+  anotarVerificacionOmitida,
+  anotarVerificacionParcial,
+} from '../core/transiciones.js';
+import { comandoParcial, type DecisionVerificacion } from '../core/verificacion-proporcional.js';
+import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
 import { currentBranch, isWorkspaceClean } from '../fs/git.js';
 import { autoCommit, mensajeChore } from '../fs/git-commit.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
-import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
+import { ejecutarVerificacion, guardarMemo, huellaDelArbol, verificarConMemo } from '../fs/verificacion.js';
 import { FinishCommandError } from './finish-opciones.js';
 
 export const FLAG_SIN_VERIFICACION = '--sin-verificacion';
@@ -68,6 +84,11 @@ export interface PuertaVerificacionOpts {
    * Sin ella no se mira si la tarea es solo documentacion: la completa de siempre.
    */
   ramaBase?: string;
+  /**
+   * TASK-106: si una decision `selectiva` se ejecuta como tal. Falso (o sin
+   * poner) la ejecuta como completa: un hotfix integra en la principal.
+   */
+  permitirSelectiva?: boolean;
 }
 
 export type ResultadoPuerta =
@@ -76,7 +97,9 @@ export type ResultadoPuerta =
   | { tipo: 'verde'; duracionMs: number; inicioMs: number }
   | { tipo: 'omitida'; commit: string | null }
   /** TASK-100: solo documentacion; `comando` es la comprobacion de documentacion que corrio, si la hay. */
-  | { tipo: 'documentacion'; comando: string | null; motivo: string };
+  | { tipo: 'documentacion'; comando: string | null; motivo: string }
+  /** TASK-106: la selectiva del nivel 2 en verde (ejecutada o, `deMemo`, reutilizada), no la completa. */
+  | { tipo: 'selectiva'; comando: string; motivo: string; deMemo: boolean };
 
 /**
  * TASK-100: la decision para esta tarea, con la config de la base, o null si
@@ -87,7 +110,7 @@ export type ResultadoPuerta =
 function decisionDocumentacion(
   o: PuertaVerificacionOpts,
   ramaBase: string
-): { decision: DecisionVerificacion; timeoutS: number } | null {
+): { decision: DecisionVerificacion; timeoutS: number; timeoutSelectivaS: number } | null {
   const r = decidirVerificacionEntre(ramaBase, 'HEAD', o.cwd);
   if (r === null) return null;
   if (r.tipo === 'config-invalida') {
@@ -97,7 +120,7 @@ function decisionDocumentacion(
     );
     return null;
   }
-  return { decision: r.decision, timeoutS: r.timeoutS };
+  return { decision: r.decision, timeoutS: r.timeoutS, timeoutSelectivaS: r.timeoutSelectivaS };
 }
 
 /**
@@ -133,31 +156,33 @@ export async function puertaVerificacion(
 
   if (o.sinVerificacion) {
     const body = anotarVerificacionOmitida(o.initial.body, o.instante, comando);
-    await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
-    const c = autoCommit({
-      cwd: o.cwd,
-      rutas: [path.dirname(o.initial.filePath)],
-      mensaje: mensajeChore(o.id, 'cierre sin verificacion'),
-      push: false,
-    });
-    for (const a of c.avisos) o.onAviso?.(a);
+    const { commit, tarea } = await anotarYCommitear(o, body, 'cierre sin verificacion', 'anotar el salto');
     o.onAviso?.(
       `${o.id}: cierre con ${FLAG_SIN_VERIFICACION}: no se ha ejecutado "${comando}". Queda anotado en ` +
-        `tarea.md (seccion "Verificacion omitida")${c.commit === null ? '' : `, commit ${c.commit}`}.`
+        `tarea.md (seccion "Verificacion omitida")${commit === null ? '' : `, commit ${commit}`}.`
     );
-    const releida = await readTareaFile(o.tareasRoot, o.id);
-    if (releida === null) {
-      throw new FinishCommandError(`[ERROR] ${o.id}: tarea.md desaparecio tras anotar el salto; revisa el repo a mano.`);
-    }
-    return { resultado: { tipo: 'omitida', commit: c.commit }, tarea: releida };
+    return { resultado: { tipo: 'omitida', commit }, tarea };
   }
 
   const docs = o.ramaBase === undefined ? null : decisionDocumentacion(o, o.ramaBase);
   if (docs !== null && docs.decision.tipo === 'documentacion') {
     return puertaSoloDocumentacion(o, comando, docs.decision, docs.timeoutS);
   }
-  if (docs !== null) {
-    o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${motivoDeLaCompleta(docs.decision)}.`);
+  if (docs !== null && docs.decision.tipo === 'selectiva' && o.permitirSelectiva === true) {
+    return puertaSelectiva(o, comando, docs.decision, docs.timeoutSelectivaS, o.ramaBase as string);
+  }
+  const motivoCompleta = docs === null ? null : motivoDeLaCompleta(docs.decision);
+  if (motivoCompleta !== null) {
+    o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${motivoCompleta}.`);
+  }
+  // TASK-106: un intento anterior anoto la selectiva; se anota (y commitea) antes de correr, como la
+  // via de documentacion, para que el memo de la completa case con el commit que se integra.
+  let tarea = o.initial;
+  if (motivoCompleta !== null) {
+    const body = anotarCompletaTrasParcial(o.initial.body, o.instante, comando, motivoCompleta);
+    if (body !== o.initial.body) {
+      tarea = (await anotarYCommitear(o, body, 'reintento con verificacion completa', 'anotar la verificacion')).tarea;
+    }
   }
 
   const timeoutS = config.timeout_verificacion;
@@ -172,12 +197,7 @@ export async function puertaVerificacion(
     throw new FinishCommandError(
       `[ERROR] ${o.id}: no se mergea con la verificacion en rojo. No se ha tocado nada.\n` +
         `${formatearVerificacionRoja(r)}\n` +
-        // TASK-091: con selectiva, que quede claro por que se corre la completa aunque las rondas pasaran.
-        (config.comando_verificacion_selectiva === null
-          ? ''
-          : 'Es la verificacion completa (comando_verificacion): se exige en verde sobre el commit que se ' +
-            'integra aunque las rondas usaran la selectiva. Correla a mano con ese comando en la rama de la ' +
-            'tarea hasta que salga en verde, commitea los arreglos y reintenta.\n') +
+        textoDeLaCompleta(config, motivoCompleta) +
         `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
         'lo deja anotado en la tarea.'
     );
@@ -189,7 +209,7 @@ export async function puertaVerificacion(
         'workspace limpio: ignora esos ficheros en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
     );
   }
-  return { resultado: { tipo: 'verde', duracionMs: r.duracionMs, inicioMs }, tarea: o.initial };
+  return { resultado: { tipo: 'verde', duracionMs: r.duracionMs, inicioMs }, tarea };
 }
 
 /**
@@ -206,21 +226,8 @@ async function puertaSoloDocumentacion(
 ): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
   const body = anotarVerificacionDocumentacion(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
   // Un reintento tras un rojo de la comprobacion ya la tiene anotada: ni se reescribe ni se commitea otra vez.
-  let c: { commit: string | null; avisos: readonly string[] } = { commit: null, avisos: [] };
-  if (body !== o.initial.body) {
-    await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
-    c = autoCommit({
-      cwd: o.cwd,
-      rutas: [path.dirname(o.initial.filePath)],
-      mensaje: mensajeChore(o.id, 'cierre solo documentacion'),
-      push: false,
-    });
-  }
-  for (const a of c.avisos) o.onAviso?.(a);
-  const releida = await readTareaFile(o.tareasRoot, o.id);
-  if (releida === null) {
-    throw new FinishCommandError(`[ERROR] ${o.id}: tarea.md desaparecio tras anotar la verificacion; revisa el repo a mano.`);
-  }
+  const { commit, tarea: releida } = await anotarYCommitear(o, body, 'cierre solo documentacion', 'anotar la verificacion');
+  const c = { commit };
 
   if (decision.comando !== null) {
     const r = ejecutarVerificacion(
@@ -259,3 +266,110 @@ async function puertaSoloDocumentacion(
   );
   return { resultado: { tipo: 'documentacion', comando: decision.comando, motivo: decision.motivo }, tarea: releida };
 }
+
+/**
+ * TASK-106: por que se ejecuta la completa en un proyecto que la decide (la
+ * base declara `rutas_documentacion`). Una decision `selectiva` solo llega aqui
+ * si la puerta no la permite: un hotfix.
+ */
+function motivoDeLaCompleta(d: DecisionVerificacion): string {
+  return d.tipo === 'selectiva' ? 'un hotfix integra en la principal y siempre se verifica con la completa' : d.motivo;
+}
+
+/**
+ * TASK-091 y TASK-106: la explicacion que acompana al rojo de la completa.
+ * Sin el nivel 2, la de la 0.14.0 (las rondas pudieron usar la selectiva). Con
+ * el nivel 2 y una decision tomada, su motivo real, en vez de afirmar que la
+ * selectiva no cuenta nunca.
+ */
+function textoDeLaCompleta(config: ReturnType<typeof resolverConfig>, motivo: string | null): string {
+  if (config.comando_verificacion_selectiva === null) return '';
+  const pasos =
+    'Correla a mano con ese comando en la rama de la tarea hasta que salga en verde, commitea los arreglos y reintenta.\n';
+  if (comandoParcial(config) !== null && motivo !== null) {
+    return `Es la verificacion completa (comando_verificacion), no la selectiva, porque ${motivo}. ${pasos}`;
+  }
+  return (
+    'Es la verificacion completa (comando_verificacion): se exige en verde sobre el commit que se ' +
+    `integra aunque las rondas usaran la selectiva. ${pasos}`
+  );
+}
+
+/**
+ * Escribe el cuerpo nuevo de tarea.md, lo commitea en la rama y relee la
+ * tarea. Si el cuerpo no cambia (un reintento ya lo tiene anotado), ni se
+ * reescribe ni se commitea otra vez.
+ */
+async function anotarYCommitear(
+  o: PuertaVerificacionOpts,
+  body: string,
+  mensaje: string,
+  que: string
+): Promise<{ commit: string | null; tarea: ReadTareaResult }> {
+  let c: { commit: string | null; avisos: readonly string[] } = { commit: null, avisos: [] };
+  if (body !== o.initial.body) {
+    await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
+    c = autoCommit({
+      cwd: o.cwd,
+      rutas: [path.dirname(o.initial.filePath)],
+      mensaje: mensajeChore(o.id, mensaje),
+      push: false,
+    });
+  }
+  for (const a of c.avisos) o.onAviso?.(a);
+  const releida = await readTareaFile(o.tareasRoot, o.id);
+  if (releida === null) {
+    throw new FinishCommandError(`[ERROR] ${o.id}: tarea.md desaparecio tras ${que}; revisa el repo a mano.`);
+  }
+  return { commit: c.commit, tarea: releida };
+}
+
+/**
+ * TASK-106: todo el codigo de la tarea cae en `rutas_verificacion_parcial` de
+ * la base. Corre la selectiva sobre el HEAD de la tarea SIN anotar todavia,
+ * para que case el memo del Stop o de review: solo uno verde se reutiliza, y
+ * solo casa con el arbol limpio (la huella lleva los ficheros sucios, y el memo
+ * selectivo solo se guarda con el arbol limpio). Su rojo bloquea como el de la
+ * completa y no deja nada escrito. Con el verde, anota y commitea en la rama
+ * antes del merge (`tareas/**` es documentacion: no cambia la decision de un
+ * reintento).
+ */
+async function puertaSelectiva(
+  o: PuertaVerificacionOpts,
+  comando: string,
+  decision: Extract<DecisionVerificacion, { tipo: 'selectiva' }>,
+  timeoutS: number,
+  ramaBase: string
+): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
+  const v = verificarConMemo(
+    o.cwd,
+    { tipo: 'selectiva', comando: decision.comando, timeoutS, base: ramaBase, memoSoloVerde: true },
+    o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }
+  );
+  if (v.resultado.estado !== 'verde') {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: no se mergea con la verificacion selectiva en rojo (comando_verificacion_selectiva: ` +
+        `${decision.motivo}). No se ha tocado nada.\n` +
+        `${formatearVerificacionRoja(v.resultado)}\n` +
+        `Correla a mano en la rama de la tarea (con RAMA_BASE=${ramaBase}) hasta que salga en verde, commitea ` +
+        `los arreglos y reintenta. Si la persona decide cerrar igualmente, taskctl finish ${o.id} ` +
+        `${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`
+    );
+  }
+  if (!isWorkspaceClean(o.cwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${o.id}: la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
+        `("${decision.comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita ` +
+        'el workspace limpio: ignoralos en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
+    );
+  }
+  const body = anotarVerificacionParcial(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
+  const { commit, tarea } = await anotarYCommitear(o, body, 'cierre con verificacion parcial', 'anotar la verificacion');
+  o.onAviso?.(
+    `${o.id}: ${decision.motivo}: se ejecuta la verificacion selectiva ("${decision.comando}") en vez de la ` +
+      `completa ("${comando}"), y sale en verde` +
+      (v.deMemo ? ' (resultado en verde guardado para este mismo commit: no se vuelve a ejecutar)' : '') +
+      `. Queda anotado en tarea.md (seccion "Verificacion parcial")${commit === null ? '' : `, commit ${commit}`}.`
+  );
+  return { resultado: { tipo: 'selectiva', comando: decision.comando, motivo: decision.motivo, deMemo: v.deMemo }, tarea };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index e213e5a..1868dbf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -466,6 +466,8 @@ export async function runFinishCommand(
       // su diff propio puede ser solo el CHANGELOG, pero lleva a la principal
       // todo lo acumulado en la rama de integracion. Siempre la completa.
       ...(tipo === 'release' ? {} : { ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion }),
+      // TASK-106: un hotfix integra en la principal: nunca la selectiva (si su camino de solo documentacion).
+      permitirSelectiva: tipo !== 'hotfix',
     });
     // TASK-074: con el informe que la verificacion acaba de regenerar, y antes
     // de que el comando de held-out pueda reescribirlo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 765a6c3..5b154bb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -373,12 +373,56 @@ export function anotarVerificacionDocumentacion(
       ? 'sin comprobacion de documentacion declarada'
       : `comprobacion de documentacion \`${sinComillas(comandoDocumentacion)}\``;
   const texto = `${motivo}; no se ejecuta \`${sinComillas(comando)}\`, ${corrio}`;
+  return anotarLineaUnica(body, SECCION_VERIFICACION_DOCUMENTACION, instante, texto);
+}
+
+/** TASK-106: seccion que deja `finish` cuando corre la selectiva del nivel 2 en vez de la completa. */
+export const SECCION_VERIFICACION_PARCIAL = '## Verificacion parcial';
+
+/**
+ * TASK-106: anota que `finish` integro con `comando_verificacion_selectiva` en
+ * verde y sin ejecutar `comando_verificacion`, con el motivo. Se anota solo
+ * tras el verde (un rojo no deja rastro que luego mienta). Un reintento con lo
+ * mismo no duplica la linea.
+ */
+export function anotarVerificacionParcial(
+  body: string,
+  instante: string,
+  comando: string,
+  motivo: string,
+  comandoSelectiva: string
+): string {
+  const sinComillas = (t: string): string => t.replace(/`/g, "'");
+  const texto =
+    `${motivo}; se ejecuta la selectiva \`${sinComillas(comandoSelectiva)}\` en verde, ` +
+    `no la completa \`${sinComillas(comando)}\``;
+  return anotarLineaUnica(body, SECCION_VERIFICACION_PARCIAL, instante, texto);
+}
+
+/**
+ * TASK-106 (modo 6 de riesgos): si un intento anterior dejo la seccion de
+ * verificacion parcial y este exige la completa (el arreglo saco codigo de las
+ * rutas parciales), lo anota para que la seccion no afirme solo la selectiva.
+ * Sin la seccion devuelve el cuerpo tal cual: nada nuevo en una tarea normal.
+ */
+export function anotarCompletaTrasParcial(body: string, instante: string, comando: string, motivo: string): string {
+  if (!tieneSeccion(body, SECCION_VERIFICACION_PARCIAL)) return body;
+  const texto = `${motivo}; este intento exige la completa \`${comando.replace(/`/g, "'")}\``;
+  return anotarLineaUnica(body, SECCION_VERIFICACION_PARCIAL, instante, texto);
+}
+
+function tieneSeccion(body: string, titulo: string): boolean {
+  return rangoDeSeccion(body.split(/\r?\n/), titulo) !== null;
+}
+
+/** `- <instante>: <texto>` en la seccion, salvo que ya haya una linea con ese mismo texto (MEN-1 de TASK-100). */
+function anotarLineaUnica(body: string, titulo: string, instante: string, texto: string): string {
   const lineas = body.split(/\r?\n/);
-  const rango = rangoDeSeccion(lineas, SECCION_VERIFICACION_DOCUMENTACION);
+  const rango = rangoDeSeccion(lineas, titulo);
   if (rango !== null && lineas.slice(rango[0], rango[1]).some((l) => l.startsWith('- ') && l.endsWith(`: ${texto}`))) {
     return body;
   }
-  return anotarLineaEnSeccion(body, SECCION_VERIFICACION_DOCUMENTACION, `- ${instante}: ${texto}`);
+  return anotarLineaEnSeccion(body, titulo, `- ${instante}: ${texto}`);
 }
 
 function anotarLineaEnSeccion(body: string, titulo: string, linea: string): string {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
index 96e584e..aa07602 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/decision-documentacion.ts
@@ -145,10 +145,10 @@ function necesitaNivel2(diff: Rutas): boolean {
 }
 
 /**
- * TASK-105: el motivo que finish y el guardian muestran al exigir la completa.
- * Hasta que acepten la selectiva (B3/B5), una decision `selectiva` se ensena
- * como en la 0.14.0: su motivo («basta la verificacion de lo afectado»)
- * contradiria que se ejecuta la completa.
+ * TASK-105: el motivo que el guardian muestra al exigir la completa (finish
+ * acepta la selectiva desde TASK-106 y tiene el suyo). Hasta que el guardian la
+ * acepte (B5), una decision `selectiva` se ensena como en la 0.14.0: su motivo
+ * («basta la verificacion de lo afectado») contradiria que se exige la completa.
  */
 export function motivoDeLaCompleta(d: DecisionVerificacion): string {
   return d.tipo === 'selectiva' ? 'la tarea cambia rutas que no son documentacion' : d.motivo;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index d7e29f6..a13868e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -226,6 +226,11 @@ export interface PeticionVerificacion {
   timeoutS: number;
   /** Rama base. Obligatoria en la selectiva (va en RAMA_BASE y en su huella); ignorada en la completa. */
   base?: string;
+  /**
+   * TASK-106 (finish): solo se reutiliza un resultado guardado en verde; uno
+   * rojo o cortado se vuelve a ejecutar. Sin ella (Stop, review), cualquiera.
+   */
+  memoSoloVerde?: boolean;
 }
 
 export interface VerificacionConMemo {
@@ -281,7 +286,9 @@ export function verificarConMemo(
   const contexto = p.tipo === 'selectiva' ? contextoSelectiva(raiz, p.base as string) : undefined;
   const huella = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
   const guardado = huella === null ? null : leerMemo(raiz, huella, p.tipo);
-  if (guardado !== null) return { resultado: guardado, deMemo: true, cambioElArbol: false };
+  if (guardado !== null && (p.memoSoloVerde !== true || guardado.estado === 'verde')) {
+    return { resultado: guardado, deMemo: true, cambioElArbol: false };
+  }
 
   const env =
     p.tipo === 'selectiva'
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
index 33bbbdb..4080c3a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts
@@ -255,7 +255,7 @@ test('finish (TASK-100): con umbral de cobertura, una tarea de solo documentacio
   );
 });
 
-test('finish (TASK-105): con el nivel 2 activo y todo el codigo en rutas parciales, corre la completa sin un motivo contradictorio', async () => {
+test('finish (TASK-105, TASK-106): con el nivel 2 activo y todo el codigo en rutas parciales, corre la selectiva y no la completa', async () => {
   await conEntorno(
     ({ docs }) => `${RUTAS_DOCS}comando_verificacion_selectiva: "${docs}"\nrutas_verificacion_parcial: [src/**]\n`,
     async (e) => {
@@ -263,14 +263,11 @@ test('finish (TASK-105): con el nivel 2 activo y todo el codigo en rutas parcial
       await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
       await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
       const { avisos } = await finish(e, 'TASK-906');
-      assert.equal(e.ejecuciones('completa'), 1, 'finish sigue exigiendo la completa');
-      assert.equal(e.ejecuciones('docs'), 0, 'y no corre la selectiva');
+      // TASK-106 (B3): finish ya acepta la selectiva del nivel 2.
+      assert.equal(e.ejecuciones('completa'), 0, 'no corre la completa');
+      assert.equal(e.ejecuciones('docs'), 1, 'corre la selectiva');
       assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
-      assert.ok(
-        avisos.some((a) => /: se ejecuta la verificacion completa: la tarea cambia rutas que no son documentacion\.$/.test(a)),
-        avisos.join('\n')
-      );
-      assert.ok(!avisos.some((a) => /basta la verificacion de lo afectado/.test(a)), avisos.join('\n'));
+      assert.ok(avisos.some((a) => /basta la verificacion de lo afectado: se ejecuta la verificacion selectiva/.test(a)), avisos.join('\n'));
     }
   );
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts
new file mode 100644
index 0000000..24766cc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts
@@ -0,0 +1,371 @@
+/**
+ * TASK-106: verificacion proporcional en `taskctl finish`, nivel 2 (parte B3
+ * de TASK-096). Repos Git temporales de verdad y los scripts de Git-Flow tal
+ * cual. Dos comandos (la completa y la selectiva) que viven FUERA del repo,
+ * cuentan sus ejecuciones, leen su desenlace de un fichero junto a ellos y la
+ * selectiva apunta el RAMA_BASE que recibe.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
+import { existsSync, readFileSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import { resolverConfig } from '../../src/core/config.js';
+import { guardarMemo, huellaDelArbol, huellaDeCommit, leerMemo, contextoSelectiva, verificarConMemo } from '../../src/fs/verificacion.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+
+// argv[2] = 'completa' | 'sel': cada uno con su contador y su desenlace.
+const SCRIPT = `
+const fs = require('node:fs');
+const tipo = process.argv[2];
+const dir = __dirname;
+fs.appendFileSync(dir + '/cuenta-' + tipo, 'x');
+if (tipo === 'sel') fs.writeFileSync(dir + '/rama-base', process.env.RAMA_BASE === undefined ? '(sin)' : process.env.RAMA_BASE);
+const d = fs.readFileSync(dir + '/desenlace-' + tipo, 'utf8').trim();
+if (d === 'ok') { console.log(tipo + ' en verde'); process.exit(0); }
+console.error('ERROR: ' + tipo + ' en rojo'); process.exit(3);
+`;
+
+type Tipo = 'completa' | 'sel';
+
+interface Entorno {
+  repoRoot: string;
+  tareasRoot: string;
+  comandoCompleta: string;
+  comandoSel: string;
+  desenlace(tipo: Tipo, d: 'ok' | 'ko'): Promise<void>;
+  ejecuciones(tipo: Tipo): number;
+  ramaBaseRecibida(): string | null;
+}
+
+/** `trabajo-*.txt` (lo que deja `setupTaskEnRevision`) es documentacion; el codigo parcial vive en src/**. */
+const NIVEL2 = (sel: string): string =>
+  `rutas_documentacion: [docs/**, trabajo-*.txt]\ncomando_verificacion_selectiva: "${sel}"\nrutas_verificacion_parcial: [src/**]\n`;
+
+async function conEntorno(
+  extra: (comandos: { completa: string; sel: string }) => string,
+  fn: (e: Entorno) => Promise<void>
+): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'finish-parcial-'));
+  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
+  await writeFile(path.join(dir, 'desenlace-completa'), 'ok', 'utf8');
+  await writeFile(path.join(dir, 'desenlace-sel'), 'ok', 'utf8');
+  const script = path.join(dir, 'verif.cjs').replace(/\\/g, '/');
+  const comandos = { completa: `node ${script} completa`, sel: `node ${script} sel` };
+  try {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(
+        path.join(repoRoot, '.taskcode', 'config.yml'),
+        `comando_verificacion: "${comandos.completa}"\n${extra(comandos)}`,
+        'utf8'
+      );
+      commitAll(repoRoot, 'config');
+      await fn({
+        repoRoot,
+        tareasRoot,
+        comandoCompleta: comandos.completa,
+        comandoSel: comandos.sel,
+        desenlace: (tipo, d) => writeFile(path.join(dir, `desenlace-${tipo}`), d, 'utf8'),
+        ejecuciones: (tipo) => {
+          const f = path.join(dir, `cuenta-${tipo}`);
+          return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
+        },
+        ramaBaseRecibida: () => {
+          const f = path.join(dir, 'rama-base');
+          return existsSync(f) ? readFileSync(f, 'utf8') : null;
+        },
+      });
+    });
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+const integrada = (rama: string, destino: string, cwd: string) =>
+  spawnSync('git', ['merge-base', '--is-ancestor', rama, destino], { cwd }).status === 0;
+
+async function finish(e: Entorno, id: string): Promise<{ avisos: string[] }> {
+  const avisos: string[] = [];
+  await runFinishCommand(e.tareasRoot, [id], '2026-11-11', {
+    repoCwd: e.repoRoot,
+    scriptsDir: SCRIPTS_DIR,
+    onAviso: (a) => avisos.push(a),
+  });
+  return { avisos };
+}
+
+async function enLaRama(e: Entorno, ruta: string, contenido = 'export const x = 1;\n'): Promise<void> {
+  await mkdir(path.dirname(path.join(e.repoRoot, ruta)), { recursive: true });
+  await writeFile(path.join(e.repoRoot, ruta), contenido, 'utf8');
+  commitAll(e.repoRoot, `cambio en ${ruta}`);
+}
+
+/** El memo de la completa (`freno-verificacion.json`) no existe. */
+function sinMemoDeLaCompleta(repoRoot: string): boolean {
+  const p = git(['rev-parse', '--git-path', 'freno-verificacion.json'], repoRoot).trim();
+  return !existsSync(path.resolve(repoRoot, p));
+}
+
+test('finish (TASK-106): codigo solo en rutas parciales: corre la selectiva, no la completa, integra, lo dice y lo anota', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-951' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts');
+    const { avisos } = await finish(e, 'TASK-951');
+    assert.equal(e.ejecuciones('sel'), 1);
+    assert.equal(e.ejecuciones('completa'), 0);
+    assert.equal(e.ramaBaseRecibida(), 'develop', 'la selectiva recibe RAMA_BASE');
+    assert.ok(integrada(task.rama, 'develop', e.repoRoot));
+    assert.ok(
+      avisos.some((a) => /cae en rutas_verificacion_parcial de "develop".*se ejecuta la verificacion selectiva \(".*sel"\) en vez de la completa/.test(a)),
+      avisos.join('\n')
+    );
+    const t = await readTareaFile(e.tareasRoot, 'TASK-951');
+    assert.equal(t?.task.estado, 'terminada');
+    assert.match(t?.body ?? '', /## Verificacion parcial\n\n- 2026-11-11: todo el codigo que cambia la tarea \(1 fichero\(s\)\) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node .*sel` en verde, no la completa `node .*completa`/);
+    assert.match(git(['log', '--format=%s', 'develop'], e.repoRoot), /cierre con verificacion parcial/);
+  });
+});
+
+test('finish (TASK-106): codigo fuera de las rutas parciales: corre la completa y dice que queda fuera', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-952' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts');
+    await enLaRama(e, 'lib/util.ts');
+    const { avisos } = await finish(e, 'TASK-952');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.equal(e.ejecuciones('sel'), 0);
+    assert.ok(integrada(task.rama, 'develop', e.repoRoot));
+    assert.ok(
+      avisos.some((a) => /se ejecuta la verificacion completa: la tarea cambia rutas fuera de rutas_verificacion_parcial: lib\/util\.ts\.$/.test(a)),
+      avisos.join('\n')
+    );
+    const t = await readTareaFile(e.tareasRoot, 'TASK-952');
+    assert.doesNotMatch(t?.body ?? '', /## Verificacion parcial/);
+  });
+});
+
+test('finish (TASK-106): con la selectiva en rojo no integra, develop no se mueve y no anota nada', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-953' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts');
+    await e.desenlace('sel', 'ko');
+    const develop = git(['rev-parse', 'develop'], e.repoRoot);
+    const head = git(['rev-parse', 'HEAD'], e.repoRoot);
+    await assert.rejects(
+      () => finish(e, 'TASK-953'),
+      (err: unknown) =>
+        err instanceof FinishCommandError &&
+        /no se mergea con la verificacion selectiva en rojo/.test(err.message) &&
+        /RAMA_BASE=develop/.test(err.message) &&
+        /--sin-verificacion/.test(err.message)
+    );
+    assert.equal(e.ejecuciones('completa'), 0);
+    assert.equal(git(['rev-parse', 'develop'], e.repoRoot), develop, 'develop no se mueve');
+    assert.equal(git(['rev-parse', 'HEAD'], e.repoRoot), head, 'ni un commit de anotacion en la rama');
+    const t = await readTareaFile(e.tareasRoot, 'TASK-953');
+    assert.equal(t?.task.estado, 'en-revision');
+    assert.doesNotMatch(t?.body ?? '', /## Verificacion parcial/);
+  });
+});
+
+test('finish (TASK-106): el verde de la selectiva no escribe el memo de la completa', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-954' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts');
+    await finish(e, 'TASK-954');
+    assert.equal(e.ejecuciones('sel'), 1);
+    assert.ok(sinMemoDeLaCompleta(e.repoRoot), 'freno-verificacion.json no existe');
+    const memoSel = git(['rev-parse', '--git-path', 'freno-verificacion-selectiva.json'], e.repoRoot).trim();
+    assert.ok(existsSync(path.resolve(e.repoRoot, memoSel)), 'el verde va al memo de la selectiva');
+  });
+});
+
+test('finish (TASK-106): con umbral de cobertura, la puerta de cobertura queda omitida en el nivel 2', async () => {
+  await conEntorno(
+    ({ sel }) => `${NIVEL2(sel)}informe_cobertura: coverage/lcov.info\numbral_cobertura: 80\n`,
+    async (e) => {
+      const task = sampleTask({ id: 'TASK-955' });
+      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+      await enLaRama(e, 'src/calculo.ts');
+      const { avisos } = await finish(e, 'TASK-955');
+      assert.equal(e.ejecuciones('sel'), 1);
+      assert.ok(integrada(task.rama, 'develop', e.repoRoot), 'sin informe lcov no aborta');
+      assert.ok(
+        avisos.some((a) => /umbral de cobertura \(80 %\) no se mide aqui, sino en la verificacion completa del release/.test(a)),
+        avisos.join('\n')
+      );
+    }
+  );
+});
+
+test('finish (TASK-106): un hotfix con codigo en rutas parciales corre la completa', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    // La config manda la de la principal: se lleva tal cual a main.
+    const config = await readFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), 'utf8');
+    git(['checkout', '-q', 'main'], e.repoRoot);
+    await mkdir(path.join(e.repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+    commitAll(e.repoRoot, 'config en main');
+    git(['checkout', '-q', 'develop'], e.repoRoot);
+    const task = sampleTask({ id: 'TASK-956', tipo: 'hotfix', rama: 'hotfix/task-956-arreglo' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task, { base: 'main' });
+    await enLaRama(e, 'src/calculo.ts');
+    const { avisos } = await finish(e, 'TASK-956');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.equal(e.ejecuciones('sel'), 0);
+    assert.ok(integrada(task.rama, 'main', e.repoRoot));
+    assert.ok(
+      avisos.some((a) => /se ejecuta la verificacion completa: un hotfix integra en la principal/.test(a)),
+      avisos.join('\n')
+    );
+  });
+});
+
+test('finish (TASK-106): un hotfix de solo documentacion conserva su camino de la 0.14.0', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const config = await readFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), 'utf8');
+    git(['checkout', '-q', 'main'], e.repoRoot);
+    await mkdir(path.join(e.repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
+    commitAll(e.repoRoot, 'config en main');
+    git(['checkout', '-q', 'develop'], e.repoRoot);
+    const task = sampleTask({ id: 'TASK-957', tipo: 'hotfix', rama: 'hotfix/task-957-docs' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task, { base: 'main' });
+    await enLaRama(e, 'docs/guia.md', '# guia\n');
+    await finish(e, 'TASK-957');
+    assert.equal(e.ejecuciones('completa'), 0);
+    assert.equal(e.ejecuciones('sel'), 0);
+    assert.ok(integrada(task.rama, 'main', e.repoRoot));
+  });
+});
+
+test('finish (TASK-106): un release con codigo en rutas parciales corre la completa', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-958', tipo: 'release', rama: 'release/task-958-q4' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts');
+    await finish(e, 'TASK-958');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.equal(e.ejecuciones('sel'), 0);
+    assert.ok(integrada(task.rama, 'main', e.repoRoot));
+  });
+});
+
+test('finish (TASK-106): una rama que cambia codigo y su propio clasificador (fuera de las rutas) va a la completa', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-959' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts');
+    await enLaRama(e, 'scripts/verificacion-selectiva.cjs', 'process.exit(0);\n');
+    const { avisos } = await finish(e, 'TASK-959');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.equal(e.ejecuciones('sel'), 0);
+    assert.ok(
+      avisos.some((a) => /fuera de rutas_verificacion_parcial: scripts\/verificacion-selectiva\.cjs/.test(a)),
+      avisos.join('\n')
+    );
+  });
+});
+
+test('finish (TASK-106): selectiva declarada sin rutas_verificacion_parcial: la completa, como en la 0.14.0', async () => {
+  await conEntorno(
+    ({ sel }) => `rutas_documentacion: [docs/**, trabajo-*.txt]\ncomando_verificacion_selectiva: "${sel}"\n`,
+    async (e) => {
+      const task = sampleTask({ id: 'TASK-960' });
+      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+      await enLaRama(e, 'src/calculo.ts');
+      await e.desenlace('completa', 'ko');
+      await assert.rejects(
+        () => finish(e, 'TASK-960'),
+        (err: unknown) =>
+          err instanceof FinishCommandError &&
+          /aunque las rondas usaran la selectiva/.test(err.message) &&
+          !/no la selectiva, porque/.test(err.message)
+      );
+      assert.equal(e.ejecuciones('completa'), 1);
+      assert.equal(e.ejecuciones('sel'), 0);
+    }
+  );
+});
+
+test('finish (TASK-106): con el nivel 2, el rojo de la completa dice por que no basto la selectiva', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-961' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'lib/util.ts');
+    await e.desenlace('completa', 'ko');
+    await assert.rejects(
+      () => finish(e, 'TASK-961'),
+      (err: unknown) =>
+        err instanceof FinishCommandError &&
+        /Es la verificacion completa \(comando_verificacion\), no la selectiva, porque la tarea cambia rutas fuera de rutas_verificacion_parcial: lib\/util\.ts\./.test(err.message) &&
+        !/aunque las rondas usaran la selectiva/.test(err.message)
+    );
+  });
+});
+
+test('finish (TASK-106): reutiliza el verde de la selectiva que dejo el Stop para el mismo commit', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-962' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    await enLaRama(e, 'src/calculo.ts');
+    // Lo que haria el freno Stop con el arbol limpio al final del turno.
+    const timeoutS = resolverConfig(e.repoRoot).timeout_verificacion_selectiva;
+    const stop = verificarConMemo(e.repoRoot, { tipo: 'selectiva', comando: e.comandoSel, timeoutS, base: 'develop' });
+    assert.equal(stop.resultado.estado, 'verde');
+    assert.equal(e.ejecuciones('sel'), 1);
+    const { avisos } = await finish(e, 'TASK-962');
+    assert.equal(e.ejecuciones('sel'), 1, 'finish no la vuelve a ejecutar');
+    assert.equal(e.ejecuciones('completa'), 0);
+    assert.ok(integrada(task.rama, 'develop', e.repoRoot));
+    assert.ok(avisos.some((a) => /no se vuelve a ejecutar/.test(a)), avisos.join('\n'));
+  });
+});
+
+test('finish (TASK-106): un rojo o un corte guardados de la selectiva no se reutilizan: se vuelve a ejecutar', async () => {
+  for (const estado of ['roja', 'cortada'] as const) {
+    await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+      const task = sampleTask({ id: 'TASK-963' });
+      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+      await enLaRama(e, 'src/calculo.ts');
+      const timeoutS = resolverConfig(e.repoRoot).timeout_verificacion_selectiva;
+      const huella = huellaDelArbol(e.repoRoot, e.comandoSel, timeoutS, contextoSelectiva(e.repoRoot, 'develop')) as string;
+      // Un memo del Stop con ese desenlace para este mismo commit (p. ej. un timeout bajo carga).
+      const guardado = verificarConMemo(e.repoRoot, { tipo: 'selectiva', comando: e.comandoSel, timeoutS, base: 'develop' }).resultado;
+      guardarMemo(e.repoRoot, huella, { ...guardado, estado } as typeof guardado, 'selectiva');
+      const antes = e.ejecuciones('sel');
+      await finish(e, 'TASK-963');
+      assert.equal(e.ejecuciones('sel'), antes + 1, `con un memo ${estado}, finish la ejecuta`);
+      assert.ok(integrada(task.rama, 'develop', e.repoRoot));
+    });
+  }
+});
+
+test('finish (TASK-106): un reintento que acaba en la completa lo anota bajo la selectiva anotada antes, y el memo de la completa casa', async () => {
+  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
+    const task = sampleTask({ id: 'TASK-964' });
+    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
+    // Lo que dejo un intento anterior: la selectiva en verde, anotada y commiteada (el merge no llego).
+    const t0 = await readTareaFile(e.tareasRoot, 'TASK-964');
+    await writeTareaFile(e.tareasRoot, t0!.task, `${t0!.body.replace(/\s*$/, '')}\n\n## Verificacion parcial\n\n- 2026-11-10: todo en src; se ejecuta la selectiva en verde\n`);
+    commitAll(e.repoRoot, 'intento anterior');
+    await enLaRama(e, 'lib/util.ts');
+    await finish(e, 'TASK-964');
+    assert.equal(e.ejecuciones('completa'), 1);
+    assert.equal(e.ejecuciones('sel'), 0);
+    const t = await readTareaFile(e.tareasRoot, 'TASK-964');
+    assert.match(t?.body ?? '', /- 2026-11-11: la tarea cambia rutas fuera de rutas_verificacion_parcial: lib\/util\.ts; este intento exige la completa `node .*completa`/);
+    assert.match(git(['log', '--format=%s', 'develop'], e.repoRoot), /reintento con verificacion completa/);
+    const huella = huellaDeCommit(e.repoRoot, task.rama, e.comandoCompleta, 600) as string;
+    assert.equal(leerMemo(e.repoRoot, huella, 'completa')?.estado, 'verde', 'el verde de la completa es del commit integrado');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
index 6eb0a59..01674cb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/verificacion-proporcional.test.ts
@@ -14,7 +14,7 @@ import {
   RUTA_TAREAS_SIEMPRE_DOCUMENTACION,
 } from '../../src/core/verificacion-proporcional.js';
 import { ConfigError, parsearConfig } from '../../src/core/config.js';
-import { anotarVerificacionDocumentacion } from '../../src/core/transiciones.js';
+import { anotarVerificacionDocumentacion, anotarVerificacionParcial } from '../../src/core/transiciones.js';
 import { rutasDeTarea } from '../../src/fs/git.js';
 
 const CFG = { rutas_documentacion: ['docs/**'], comando_verificacion_documentacion: null };
@@ -90,6 +90,17 @@ test('anotarVerificacionDocumentacion: crea la seccion y en un reintento anade l
   assert.match(dos, /- 2026-11-11: solo docs; no se ejecuta `npm 'x'`, comprobacion de documentacion `node d\.js`/);
 });
 
+test('anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion', () => {
+  const docs = anotarVerificacionDocumentacion('## Objetivo\n\nX.\n', '2026-11-10', 'npm test', 'solo docs', null);
+  const una = anotarVerificacionParcial(docs, '2026-11-11', 'npm test', 'todo en src', 'node `sel`.js');
+  assert.match(una, /## Verificacion parcial\n\n- 2026-11-11: todo en src; se ejecuta la selectiva `node 'sel'\.js` en verde, no la completa `npm test`\n$/);
+  assert.equal((una.match(/^## Verificacion de documentacion$/gm) ?? []).length, 1, 'secciones separadas');
+  assert.equal(anotarVerificacionParcial(una, '2026-11-12', 'npm test', 'todo en src', 'node `sel`.js'), una, 'idempotente');
+  const otra = anotarVerificacionParcial(una, '2026-11-12', 'npm test', 'otro motivo', 'node sel.js');
+  assert.equal((otra.match(/^## Verificacion parcial$/gm) ?? []).length, 1);
+  assert.match(otra, /- 2026-11-12: otro motivo;/);
+});
+
 test('rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual', async () => {
   const dir = await mkdtemp(path.join(tmpdir(), 'rutas-tarea-'));
   const g = (...a: string[]) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-106/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-106/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-106/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-106/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-106/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-106/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-106/tarea.md                                                       |   7 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-cobertura.js                           |   7 ++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        | 169 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-----------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |   2 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                   |  37 +++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/decision-documentacion.js                           |   8 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     |   3 +-
 13 files changed, 178 insertions(+), 55 deletions(-)
````
