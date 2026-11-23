# Peticion de revision — TASK-147a (ronda 1)

- Tarea: TASK-147a — secciones con un solo lector y un solo «crear al final» (parte a de TASK-147)
- Rama revisada: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
- Rama base: develop
- Commit revisado (HEAD): 13fa8459264cb6a006d7c74e8eef0ed040c01c08
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-147a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-147a/tarea.md
- tareas/03-en-revision/TASK-147a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/cierre.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts

## Commits a revisar (git log develop..HEAD)

````
13fa845 chore(TASK-147a): autorrevision
3aeb6c2 fix(TASK-147a): secciones con un solo lector y un solo crear al final
839035a chore(TASK-147a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cierre.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cierre.ts
index e2fd11d..8addb42 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/cierre.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/cierre.ts
@@ -7,7 +7,7 @@
  * Puro: lee y escribe texto, no toca disco.
  */
 
-import { instanteDe, precisionDeFecha, rangoDeSeccion } from './transiciones.js';
+import { anadirSeccionAlFinal, instanteDe, precisionDeFecha, rangoDeSeccion } from './transiciones.js';
 import { SECCION_DURACION } from './duracion-estimada.js';
 
 export interface Cierre {
@@ -41,10 +41,7 @@ export function anotarCierre(body: string, inicio: string, fin: string): string
   const lineas = body.split(/\r?\n/);
   const rango = rangoDeSeccion(lineas, SECCION_DURACION);
 
-  if (rango === null) {
-    const base = body.replace(/(\r?\n)*$/, '');
-    return `${base}${base === '' ? '' : eol + eol}${[SECCION_DURACION, '', linea].join(eol)}${eol}`;
-  }
+  if (rango === null) return anadirSeccionAlFinal(body, [SECCION_DURACION, '', linea]);
 
   const [ini, limite] = rango;
   for (let i = ini + 1; i < limite; i++) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
index 6cc3587..bdb0dba 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
@@ -47,7 +47,7 @@
  * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas ni
  * toca nada fuera de su seccion; leer nunca falla.
  */
-import { dentroDeBloque, precisionDeFecha, rangoDeSeccion } from './transiciones.js';
+import { anadirSeccionAlFinal, dentroDeBloque, precisionDeFecha, rangoDeSeccion } from './transiciones.js';
 
 export const SECCION_COSTE = '## Coste';
 
@@ -103,9 +103,7 @@ export function anadirCoste(body: string, fila: FilaCoste): string {
   const rango = rangoDeSeccion(lineas, SECCION_COSTE);
 
   if (rango === null) {
-    const base = body.replace(/(\r?\n)*$/, '');
-    const separacion = base === '' ? '' : eol + eol;
-    return base + separacion + [SECCION_COSTE, '', CABECERA_COSTE, SEPARADOR, filaATexto(fila)].join(eol) + eol;
+    return anadirSeccionAlFinal(body, [SECCION_COSTE, '', CABECERA_COSTE, SEPARADOR, filaATexto(fila)]);
   }
 
   const [inicio, fin] = rango;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
index 8c7659c..4732e93 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/duracion-estimada.ts
@@ -6,6 +6,7 @@
  *
  * Puro: lee texto, no toca disco.
  */
+import { anadirSeccionAlFinal, contenidoDeSeccion, rangoDeSeccion } from './transiciones.js';
 
 /** Por encima de esto, la tarea deberia partirse (decision de la persona). */
 export const UMBRAL_MINUTOS = 60;
@@ -76,8 +77,12 @@ export const SECCION_DURACION = '## Duracion';
 
 /** Minutos estimados que finish dejo anotados en `## Duracion`, o null. */
 export function estimadaAnotada(body: string): number | null {
-  const m = /^- Estimada: (\d+) min$/m.exec(body.replace(/\r/g, ''));
-  return m === null ? null : Number(m[1]);
+  // TASK-147a (CORE1-01): solo dentro de la seccion, con el lector comun.
+  for (const l of contenidoDeSeccion(body, SECCION_DURACION) ?? []) {
+    const m = /^- Estimada: (\d+) min\s*$/.exec(l);
+    if (m !== null) return Number(m[1]);
+  }
+  return null;
 }
 
 /**
@@ -99,14 +104,12 @@ export function anotarDuracion(body: string, estimada: LecturaDuracion, realMin:
       ? [`- Paso de la hora: ${String(realMin)} min reales frente a ${String(estimada.minutos)} estimados`]
       : []),
   ];
+  // TASK-147a (CORE1-01): la misma regla que anotarCierre, que finish llama
+  // justo despues sobre el mismo cuerpo (ultima seccion fuera de bloques).
   const lineas = body.split(/\r?\n/);
-  const ini = lineas.findIndex((l) => l.trim() === SECCION_DURACION);
-  if (ini === -1) {
-    const base = body.replace(/(\r?\n)*$/, '');
-    return `${base}${base === '' ? '' : eol + eol}${lineasSeccion.join(eol)}${eol}`;
-  }
-  let fin = ini + 1;
-  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
+  const rango = rangoDeSeccion(lineas, SECCION_DURACION);
+  if (rango === null) return anadirSeccionAlFinal(body, lineasSeccion);
+  const [ini, fin] = rango;
   const despues = lineas.slice(fin);
   return [...lineas.slice(0, ini), ...lineasSeccion, ...(despues.length > 0 ? ['', ...despues] : [''])].join(eol);
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
index e32ec54..b50fde4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts
@@ -14,6 +14,7 @@
  * solo por MENORES encontraron 2 CRITICO/IMPORTANTE nuevos en 70,2 M tokens.
  */
 import { hallazgosNoCerrados, severidadDe, type Hallazgo } from './informe-revision.js';
+import { contenidoDeSeccion } from './transiciones.js';
 
 /** Seccion de `tarea.md` donde `verificar-menores` deja cada verificacion. */
 export const SECCION_VERIFICACION_LIGERA = '## Verificacion ligera';
@@ -126,13 +127,11 @@ export interface VerificacionLigeraLeida {
 
 /** Las entradas de la seccion `## Verificacion ligera` de un `tarea.md`, en orden. */
 export function leerVerificacionesLigeras(body: string): VerificacionLigeraLeida[] {
-  const lineas = body.replace(/\r/g, '').split('\n');
-  const inicio = lineas.findIndex((l) => l.trim() === SECCION_VERIFICACION_LIGERA);
-  if (inicio === -1) return [];
+  // TASK-147a (CORE2-02): el mismo lector con el que verificar-menores escribe
+  // (anotarLineaEnSeccion): ultima seccion fuera de bloques de codigo. Antes un
+  // ejemplo `## Verificacion ligera` en el enunciado tapaba la seccion real.
   const leidas: VerificacionLigeraLeida[] = [];
-  for (let i = inicio + 1; i < lineas.length; i++) {
-    const l = lineas[i] as string;
-    if (/^##\s/.test(l)) break;
+  for (const l of contenidoDeSeccion(body, SECCION_VERIFICACION_LIGERA) ?? []) {
     const m = /ronda (\d+); commit revisado ([0-9a-f]{7,40}); commit verificado ([0-9a-f]{7,40})\b/.exec(l);
     if (m !== null) {
       leidas.push({ ronda: Number(m[1]), commitRevisado: m[2] as string, commitVerificado: m[3] as string });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
index 7bf1586..346c55e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
@@ -13,6 +13,8 @@
  *   Nada de este modulo la devuelve entera: solo el host, ya sin usuario, y
  *   `ocultarCredenciales` limpia cualquier texto ajeno antes de mostrarlo.
  */
+// TASK-147a: el lector y el «crear al final» de secciones son los comunes.
+import { anadirSeccionAlFinal, contenidoDeSeccion } from './transiciones.js';
 
 export type Plataforma = 'github' | 'gitlab';
 
@@ -447,30 +449,23 @@ export function interpretarListado(plataforma: Plataforma, stdout: string, rama:
 export const SECCION_MERGE_REQUEST = '## Merge request';
 
 export function anotarMergeRequest(body: string, url: string, plataforma: Plataforma): string {
-  const eol = body.includes('\r\n') ? '\r\n' : '\n';
-  const base = body.replace(/(\r?\n)*$/, '');
-  const bloque = [
+  return anadirSeccionAlFinal(body, [
     SECCION_MERGE_REQUEST,
     '',
     `- URL del merge request: ${url}`,
     `- Plataforma: ${plataforma}`,
-  ].join(eol);
-  return `${base}${base === '' ? '' : eol + eol}${bloque}${eol}`;
+  ]);
 }
 
-/** La URL anotada por `anotarMergeRequest`, o null si la tarea no tiene la seccion. */
+/**
+ * La URL anotada por `anotarMergeRequest`, o null si la tarea no tiene la
+ * seccion. TASK-147a (CORE2-02): con el lector comun de secciones, no con un
+ * recorrido propio de vallas.
+ */
 export function urlMergeRequestAnotada(body: string): string | null {
-  const lineas = body.split(/\r?\n/);
-  let dentro = false;
-  let enBloque = false;
-  for (const l of lineas) {
-    if (/^\s*(```|~~~)/.test(l)) enBloque = !enBloque;
-    if (enBloque) continue;
-    if (/^##?\s/.test(l)) dentro = l.trimEnd() === SECCION_MERGE_REQUEST;
-    else if (dentro) {
-      const m = /^- URL del merge request: (\S+)\s*$/.exec(l);
-      if (m !== null && esUrlPublicable(m[1])) return m[1];
-    }
+  for (const l of contenidoDeSeccion(body, SECCION_MERGE_REQUEST) ?? []) {
+    const m = /^- URL del merge request: (\S+)\s*$/.exec(l);
+    if (m !== null && esUrlPublicable(m[1])) return m[1];
   }
   return null;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts
index 19bf9a1..da61a76 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/rondas-extra.ts
@@ -11,6 +11,7 @@
  * la pregunta del tope se repite en cada ronda extra.
  */
 import { SECCION_RONDAS_EXTRA } from './flujo.js';
+import { contenidoDeSeccion } from './transiciones.js';
 
 /** Lo que `lineaRondaExtra` deja de ejemplo: copiado tal cual no es una decision. */
 const MARCADOR = /^<[^>]*>$/;
@@ -25,12 +26,7 @@ export function rondaExtraDecidida(body: string, ronda: number): boolean {
   });
 }
 
-/** Lineas de la seccion `## Rondas extra` (hasta el siguiente encabezado de nivel 2 o menor). */
+/** Lineas de la seccion `## Rondas extra` (TASK-147a: con el lector comun de secciones). */
 function seccionRondasExtra(body: string): string[] {
-  const lineas = body.split(/\r?\n/);
-  const inicio = lineas.findIndex((l) => l.trim() === SECCION_RONDAS_EXTRA);
-  if (inicio === -1) return [];
-  const resto = lineas.slice(inicio + 1);
-  const fin = resto.findIndex((l) => /^#{1,2}\s/.test(l));
-  return fin === -1 ? resto : resto.slice(0, fin);
+  return contenidoDeSeccion(body, SECCION_RONDAS_EXTRA) ?? [];
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index d37fb89..50842d1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -217,6 +217,18 @@ export function rangoDeSeccion(lineas: readonly string[], titulo: string): [numb
   return [inicio, fin];
 }
 
+/**
+ * TASK-147a (CORE1-02 de la auditoria 4D): crea una seccion al final del
+ * cuerpo, separada por una linea en blanco, con el fin de linea del cuerpo.
+ * Antes la misma receta estaba copiada en siete sitios (cierre, coste,
+ * duracion, transiciones, lineas de seccion, merge request, troceo).
+ */
+export function anadirSeccionAlFinal(body: string, lineasSeccion: readonly string[]): string {
+  const eol = body.includes('\r\n') ? '\r\n' : '\n';
+  const base = body.replace(/(\r?\n)*$/, '');
+  return `${base}${base === '' ? '' : eol + eol}${lineasSeccion.join(eol)}${eol}`;
+}
+
 /**
  * TASK-153a: las lineas con contenido real de una seccion (sin la cabecera,
  * sin comentarios HTML, tambien los de varias lineas, y sin lineas en
@@ -245,9 +257,7 @@ export function anadirTransicion(body: string, fila: FilaTransicion): string {
   const rango = rangoSeccion(lineas);
 
   if (rango === null) {
-    const base = body.replace(/(\r?\n)*$/, '');
-    const separacion = base === '' ? '' : eol + eol;
-    return base + separacion + [SECCION_TRANSICIONES, '', CABECERA, SEPARADOR, filaATexto(fila)].join(eol) + eol;
+    return anadirSeccionAlFinal(body, [SECCION_TRANSICIONES, '', CABECERA, SEPARADOR, filaATexto(fila)]);
   }
 
   const [inicio, fin] = rango;
@@ -492,10 +502,7 @@ export function anotarLineaEnSeccion(body: string, titulo: string, linea: string
   const eol = body.includes('\r\n') ? '\r\n' : '\n';
   const lineas = body.split(/\r?\n/);
   const rango = rangoDeSeccion(lineas, titulo);
-  if (rango === null) {
-    const base = body.replace(/(\r?\n)*$/, '');
-    return `${base}${base === '' ? '' : eol + eol}${titulo}${eol}${eol}${linea}${eol}`;
-  }
+  if (rango === null) return anadirSeccionAlFinal(body, [titulo, '', linea]);
   const [inicio, fin] = rango;
   let ultima = inicio;
   for (let i = inicio + 1; i < fin; i++) if ((lineas[i] as string).trim() !== '') ultima = i;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
index 901cce0..dd9b543 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
@@ -17,6 +17,7 @@
  */
 import type { Task } from './task.js';
 import { leerDuracionEstimada, type LecturaDuracion } from './duracion-estimada.js';
+import { anadirSeccionAlFinal, dentroDeBloque } from './transiciones.js';
 
 export class TroceoError extends Error {}
 
@@ -41,28 +42,10 @@ const DURACION_RE = /duraci[oó]n estimada\s*[*_`]*\s*:/i;
 
 /** Las lineas de la seccion `## Troceo`, fuera de bloques de codigo; null si no hay seccion. */
 function lineasDeTroceo(plan: string): string[] | null {
+  // TASK-147a: con rangoPorCabecera (dentroDeBloque), no con un interruptor propio de vallas.
   const lineas = plan.replace(/\r/g, '').split('\n');
-  let enBloque = false;
-  let dentro = false;
-  let encontrada = false;
-  const out: string[] = [];
-  for (const l of lineas) {
-    if (/^\s*(```|~~~)/.test(l)) {
-      enBloque = !enBloque;
-      if (dentro) out.push(l);
-      continue;
-    }
-    if (!enBloque && /^##\s/.test(l)) {
-      if (dentro) break;
-      if (CABECERA_TROCEO_RE.test(l)) {
-        dentro = true;
-        encontrada = true;
-      }
-      continue;
-    }
-    if (dentro) out.push(l);
-  }
-  return encontrada ? out : null;
+  const rango = rangoPorCabecera(lineas, CABECERA_TROCEO_RE);
+  return rango === null ? null : lineas.slice(rango[0] + 1, rango[1]);
 }
 
 /**
@@ -155,23 +138,46 @@ function criteriosMd(criterios: readonly string[]): string {
   return criterios.map((c) => `- [ ] ${c}`).join('\n');
 }
 
-const OBJETIVO_RE = /^##\s+objetivo\s*$/i;
-const CRITERIOS_RE = /^##\s+criterios de aceptaci[oó]n\s*$/i;
+// TASK-147a (CORE2-06): `### Criterios de aceptacion` tambien abre la seccion,
+// como en extraerSecciones; antes troceo no la encontraba y anteponia otra.
+const OBJETIVO_RE = /^#{2,3}\s+objetivo\s*$/i;
+const CRITERIOS_RE = /^#{2,3}\s+criterios de aceptaci[oó]n\s*$/i;
 
 /**
- * Reemplaza el contenido de la seccion cuya cabecera casa con `cabecera`
- * (hasta la siguiente `## `). Si no existe, la anade al principio en el orden
- * de la plantilla. Conserva las demas secciones (`## Transiciones`, etc.).
+ * Rango [cabecera, fin) de la primera seccion cuya cabecera casa con `cabecera`,
+ * fuera de bloques de codigo (`dentroDeBloque`, el detector comun); acaba en
+ * la siguiente cabecera de su nivel o superior. null si no esta.
+ */
+function rangoPorCabecera(lineas: readonly string[], cabecera: RegExp): [number, number] | null {
+  const enBloque = dentroDeBloque(lineas);
+  const ini = lineas.findIndex((l, i) => !enBloque[i] && cabecera.test(l.trim()));
+  if (ini === -1) return null;
+  const nivel = /^(#+)/.exec((lineas[ini] as string).trim())?.[1]?.length ?? 2;
+  let fin = ini + 1;
+  while (fin < lineas.length) {
+    const l = lineas[fin] as string;
+    const m = /^(#{1,6})\s/.exec(l);
+    // Como en extraerSecciones: una cabecera de Objetivo o de Criterios abre
+    // su propia seccion aunque sea de nivel 3 (`### Criterios de aceptacion`).
+    const otraSeccion = OBJETIVO_RE.test(l.trim()) || CRITERIOS_RE.test(l.trim());
+    if (!enBloque[fin] && m !== null && ((m[1] as string).length <= nivel || otraSeccion)) break;
+    fin++;
+  }
+  return [ini, fin];
+}
+
+/**
+ * Reemplaza el contenido de la seccion cuya cabecera casa con `cabecera`. Si
+ * no existe, la anade al principio en el orden de la plantilla. Conserva las
+ * demas secciones (`## Transiciones`, etc.).
  */
 function reemplazarSeccion(body: string, cabecera: RegExp, titulo: string, contenido: string): string {
   const eol = body.includes('\r\n') ? '\r\n' : '\n';
   const lineas = body.split(/\r?\n/);
-  const ini = lineas.findIndex((l) => cabecera.test(l.trim()));
+  const rango = rangoPorCabecera(lineas, cabecera);
   const bloque = [titulo, '', ...contenido.split('\n'), ''];
-  if (ini === -1) return [...bloque, ...lineas].join(eol);
-  let fin = ini + 1;
-  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
-  return [...lineas.slice(0, ini), ...bloque, ...lineas.slice(fin)].join(eol);
+  if (rango === null) return [...bloque, ...lineas].join(eol);
+  return [...lineas.slice(0, rango[0]), ...bloque, ...lineas.slice(rango[1])].join(eol);
 }
 
 export interface PlanTroceo {
@@ -225,11 +231,8 @@ export function planificarTroceo(task: Task, body: string, partes: readonly Part
 
 function extraerObjetivo(body: string): string {
   const lineas = body.replace(/\r/g, '').split('\n');
-  const ini = lineas.findIndex((l) => OBJETIVO_RE.test(l.trim()));
-  if (ini === -1) return '';
-  let fin = ini + 1;
-  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
-  return lineas.slice(ini + 1, fin).join('\n').trim();
+  const rango = rangoPorCabecera(lineas, OBJETIVO_RE);
+  return rango === null ? '' : lineas.slice(rango[0] + 1, rango[1]).join('\n').trim();
 }
 
 /**
@@ -244,21 +247,20 @@ export function planTrasTroceo(plan: string, partes: readonly ParteTroceo[], ids
     const entera = leerDuracionEstimada(plan);
     const antes = entera.tipo === 'ok' ? `${String(entera.minutos)} min` : 'sin cifra legible';
     let hecho = false;
-    let enBloque = false;
-    texto = plan
-      .split(/\r?\n/)
-      .map((l) => {
-        if (/^\s*(```|~~~)/.test(l)) enBloque = !enBloque;
-        if (hecho || enBloque || !DURACION_RE.test(l) || !/^\s*(?:[-*+>#]\s*)*[*_`]*\s*duraci[oó]n estimada/i.test(l)) return l;
+    const lineasPlan = plan.split(/\r?\n/);
+    const enBloque = dentroDeBloque(lineasPlan);
+    texto = lineasPlan
+      .map((l, i) => {
+        if (hecho || enBloque[i] || !DURACION_RE.test(l) || !/^\s*(?:[-*+>#]\s*)*[*_`]*\s*duraci[oó]n estimada/i.test(l)) return l;
         hecho = true;
         return `Duracion estimada: ${String((primera.duracion as { minutos: number }).minutos)} min (parte a del troceo; la tarea entera estimaba ${antes})`;
       })
       .join(eol);
   }
-  const base = texto.replace(/(\r?\n)*$/, '');
-  return (
-    `${base}${eol}${eol}## Troceo aceptado${eol}${eol}` +
+  return anadirSeccionAlFinal(texto, [
+    '## Troceo aceptado',
+    '',
     `Troceo aceptado por una persona el ${hoy}: ${ids.join(', ')}, todas en la misma rama. ` +
-    `Este plan es el de ${ids[0] as string}; las demas partes se planifican al empezarlas.${eol}`
-  );
+      `Este plan es el de ${ids[0] as string}; las demas partes se planifican al empezarlas.`,
+  ]);
 }
````

## Excluido del diff (17 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-147a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147a/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-147a/tarea.md                                                       |   8 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/cierre.js                                          |   8 +++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-registro.js                                  |   6 ++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/duracion-estimada.js                               |  24 ++++++++++++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/menores.js                                         |  13 ++++-------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plataforma-remota.js                               |  34 +++++++++++-----------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/rondas-extra.js                                    |  11 +++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                    |  21 +++++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/troceo.js                                          | 102 ++++++++++++++++++++++++++++++++++++++++------------------------------------------
 17 files changed, 111 insertions(+), 116 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/secciones-comunes.test.ts | 62 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 62 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 111.9 s
- Commit verificado: 13fa8459264cb6a006d7c74e8eef0ed040c01c08
- Huella: 35cd95f09c024f72e13359835981e4531432aa30
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 86687 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.4117ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.8007ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.1603ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (0.9615ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.0463ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.0149ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (3.6411ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (2.067ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.4732ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.3702ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.3848ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (1.0038ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1778.4375ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1803.5679ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9745ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.185ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9659ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.7592ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (2.836ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1937ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.487ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.3146ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7017ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.8601ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.8534ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.6703ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (34.4392ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.7543ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4623ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4683ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3437ms)
ℹ tests 702
ℹ suites 0
ℹ pass 702
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 101233.4322
[verificar-impacto] node --test termino con 0 en 101.3 s.
````
