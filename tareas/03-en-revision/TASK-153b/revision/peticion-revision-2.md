# Peticion de revision — TASK-153b (ronda 2)

- Tarea: TASK-153b — candidatos 4D en la peticion de revision (parte b de TASK-153)
- Rama revisada: feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
- Rama base: develop
- Commit revisado (HEAD): 090c91b02e47f7c1fe7caa1f0b4158e37da20e50
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-153b (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 42562c3fb668a8251a18fa580caced8053574736 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (9 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu
tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion
   ya trae la verificacion de la ronda en verde para ese mismo commit, no la
   repitas: cita ese resultado y corre solo los tests de lo que verificas.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-153b/tarea.md
- tareas/03-en-revision/TASK-153b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/candidatos-4d.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 7 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/candidatos-4d.ts (candidatos4D, nombresParecidos) | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | src/commands/review.ts (seccionCandidatosDeRonda), src/core/candidatos-4d.ts (topes) | informe-revision-1.md |

## Commits a revisar (git log 42562c3fb668a8251a18fa580caced8053574736..HEAD)

````
090c91b docs(TASK-153b): autorrevision ronda 2
320c084 fix(TASK-153b): IMP-1..2 y MENOR-1..7 de la revision
7cdd20f chore(TASK-153b): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 42562c3fb668a8251a18fa580caced8053574736..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 4700c4b..f89f2e9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -74,6 +74,8 @@ import {
   diffParaRevision,
   diffRangeForPaths,
   definicionesEnRef,
+  GitLaunchError,
+  GitCommandError,
   statDeFicheros,
   PATRONES_TEST,
   hayMergesEntre,
@@ -948,7 +950,7 @@ async function runReview(
 
   // TASK-153b: candidatos 4D (pistas de duplicacion y tests a mutar), una vez
   // por ronda y antes de escribir nada. Nunca lanza.
-  const candidatos = seccionCandidatosDeRonda(baseBranch, desde, paraRevision.diff, paraRevision.tests, deps.repoCwd);
+  const candidatos = seccionCandidatosDeRonda(baseBranch, desde, paraRevision.diff, paraRevision.tests, deps.repoCwd, excluir);
 
   // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
   // el diff real de la rama, no `task.agente_revisor` del frontmatter,
@@ -1362,21 +1364,32 @@ function verificacionDeRonda(
  * TASK-153b: la seccion de candidatos 4D de la ronda. Las definiciones nuevas
  * salen del diff de codigo de la ronda; las existentes, de la rama base (lo
  * que habia antes de la tarea); los tests, del diff de los ficheros de test.
- * Nunca lanza: si Git falla, la seccion lo dice y la ronda sigue.
+ * Nunca lanza: si Git falla, la seccion lo dice y la ronda sigue. En una
+ * ronda incremental `desde` es el commit de la anterior: solo salen los tests
+ * del delta; las existentes siguen siendo las de la base.
  */
-function seccionCandidatosDeRonda(
+export function seccionCandidatosDeRonda(
   baseBranch: string,
   desde: string,
   diffCodigo: string,
   tests: readonly string[],
-  cwd: string
+  cwd: string,
+  excluir: readonly string[] = []
 ): string {
   try {
-    const existentes = definicionesDeGrep(definicionesEnRef(baseBranch, cwd), baseBranch);
+    const existentes = definicionesDeGrep(definicionesEnRef(baseBranch, cwd, excluir), baseBranch);
     const diffTests = diffRangeForPaths(desde, 'HEAD', tests, cwd);
     return seccionCandidatos4D(candidatos4D(diffCodigo, diffTests, existentes));
   } catch (e) {
-    const motivo = e instanceof Error ? (e.message.split('\n')[0] ?? '') : String(e);
+    // MENOR-7: un `git grep` que desborda el buffer no es «no se pudo ejecutar git».
+    const desborda = e instanceof GitLaunchError && /ENOBUFS/.test(e.message);
+    const motivo = desborda
+      ? 'la salida de git grep supera el limite de memoria: repositorio demasiado grande'
+      : e instanceof GitCommandError
+        ? (e.stderr.trim().split('\n')[0] ?? 'git fallo')
+        : e instanceof Error
+        ? (e.message.split('\n')[0] ?? '')
+        : String(e);
     return (
       `${SECCION_CANDIDATOS_4D}\n\nNo se pudieron calcular (${motivo}): ` +
       'busca a mano duplicados de las definiciones nuevas y muta los tests que prometen algo.\n\n'
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
index 811692d..860339f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/candidatos-4d.ts
@@ -2,12 +2,15 @@
  * TASK-153b (Regla 4D al crear): candidatos 4D de una ronda de revision.
  *
  * Pistas para el revisor, no hallazgos: las definiciones que la tarea anade y
- * las que ya existian en la rama base con nombre igual o parecido (posible
- * duplicacion), y los tests nuevos cuyo nombre promete algo comprobable (a
- * mutar: posible disfraz). La auditoria de TASK-141 encontro 102
- * duplicaciones y 21 disfraces; casi todos se habrian visto con estas pistas.
+ * las que ya existian en la rama base con nombre igual o parecido, las nuevas
+ * que se parecen entre si (posible duplicacion), y los tests nuevos cuyo
+ * nombre promete algo comprobable (a mutar: posible disfraz). La auditoria de
+ * TASK-141 encontro 102 duplicaciones y 21 disfraces.
  *
- * Puro: recibe texto de diffs y de `git grep` y devuelve datos y markdown.
+ * Puro: recibe texto de diffs y de `git grep` y devuelve datos y markdown. La
+ * decision de «que es una definicion» vive SOLO aqui: el patron grueso que
+ * usa `git grep` (`PATRON_GREP_DEFINICION`) y las extensiones de codigo
+ * (`EXTENSIONES_CODIGO`) salen de este modulo (MENOR-6 de su revision).
  */
 import { distanciaEdicion } from './sugerencia.js';
 
@@ -27,33 +30,52 @@ export interface CandidatoDuplicado {
 }
 
 export interface Candidatos4D {
+  /** Nuevas parecidas a una que ya existia en la rama base (como mucho MAX_DEFINICIONES). */
   duplicados: CandidatoDuplicado[];
-  /** Tests nuevos cuyo nombre promete algo comprobable. */
+  /** Cuantas nuevas tenian algun parecido en la base (sin tope): para el «y N mas». */
+  totalDuplicados: number;
+  /** Pares de nuevas parecidas entre si (MENOR-2): la misma tarea escribiendo dos veces lo mismo. */
+  entreNuevas: [Definicion, Definicion][];
+  totalEntreNuevas: number;
+  /** Tests nuevos cuyo nombre promete algo comprobable (como mucho MAX_TESTS). */
   testsAMutar: Definicion[];
+  totalTests: number;
 }
 
+/** Extensiones de codigo donde se buscan definiciones (TS/JS, Rust, Python, Java/Kotlin/C#, bash). */
+export const EXTENSIONES_CODIGO: readonly string[] = [
+  'ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs', 'rs', 'py', 'java', 'kt', 'cs', 'sh', 'bash',
+];
+
+const EXT_CODIGO = new RegExp(`\\.(?:${EXTENSIONES_CODIGO.join('|')})$`, 'i');
+
 /**
- * Patrones de definicion por familia de lenguaje. El grupo 1 es el nombre.
- * Se cubren TS/JS, Rust, Python, Java/C#/Kotlin (clases) y bash; lo demas
- * no da candidatos (nunca falla).
+ * Patron ERE grueso para `git grep -E`: preselecciona lineas con pinta de
+ * definicion. El filtro fino es `PATRONES_DEFINICION`; todo lo que este
+ * reconoce tiene que pasar antes por este (lo comprueba un test por familia).
  */
+export const PATRON_GREP_DEFINICION =
+  '(function|class|fn|def|const|let|var|struct|interface|record|enum)[[:space:]]+[A-Za-z_$]' +
+  '|^[[:space:]]*[A-Za-z_][A-Za-z0-9_-]*[[:space:]]*\\(\\)[[:space:]]*\\{';
+
+/** Patrones de definicion por familia de lenguaje. El grupo 1 es el nombre. */
 const PATRONES_DEFINICION: readonly RegExp[] = [
   /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/,
   /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>/,
   /^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
   /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_][\w]*)/,
   /^\s*(?:async\s+)?def\s+([A-Za-z_][\w]*)/,
-  /^\s*(?:public|private|protected|internal)?\s*(?:static\s+)?(?:final\s+|sealed\s+|abstract\s+)?(?:class|interface|record|struct|enum)\s+([A-Za-z_][\w]*)/,
+  /^\s*(?:pub(?:\([^)]*\))?|public|private|protected|internal)?\s*(?:static\s+)?(?:final\s+|sealed\s+|abstract\s+)?(?:class|interface|record|struct|enum)\s+([A-Za-z_][\w]*)/,
   /^\s*(?:function\s+)?([A-Za-z_][\w-]*)\s*\(\)\s*\{/,
 ];
 
-/** Extensiones de codigo donde se buscan definiciones. */
-const EXT_CODIGO = /\.(?:[cm]?[jt]sx?|rs|py|java|kt|cs|sh|bash)$/i;
+/** Nombres de menos letras no se consideran (ruido: `i`, `fn`, `ok`). */
+const LONGITUD_MINIMA = 3;
 
 function nombreDeDefinicion(linea: string): string | null {
   for (const re of PATRONES_DEFINICION) {
     const m = re.exec(linea);
-    if (m?.[1] !== undefined) return m[1];
+    if (m?.[1] !== undefined) return m[1].length >= LONGITUD_MINIMA ? m[1] : null;
   }
   return null;
 }
@@ -92,7 +114,7 @@ export function definicionesNuevas(diff: string): Definicion[] {
   for (const { fichero, linea, texto } of lineasAnadidas(diff)) {
     if (!EXT_CODIGO.test(fichero)) continue;
     const nombre = nombreDeDefinicion(texto);
-    if (nombre === null || nombre.length < 3) continue;
+    if (nombre === null) continue;
     const clave = `${fichero}\0${nombre}`;
     if (vistas.has(clave)) continue;
     vistas.add(clave);
@@ -117,7 +139,7 @@ export function definicionesDeGrep(salida: string, ref?: string): Definicion[] {
     const [, fichero, num, texto] = m as unknown as [string, string, string, string];
     if (!EXT_CODIGO.test(fichero)) continue;
     const nombre = nombreDeDefinicion(texto);
-    if (nombre !== null && nombre.length >= 3) defs.push({ nombre, fichero, linea: Number(num) });
+    if (nombre !== null) defs.push({ nombre, fichero, linea: Number(num) });
   }
   return defs;
 }
@@ -127,14 +149,55 @@ function normal(nombre: string): string {
   return nombre.toLowerCase().replace(/[_$-]/g, '');
 }
 
+/** Distancia de edicion tolerada para dos nombres normalizados: `corto` es la longitud del menor. */
+function tolerancia(corto: number): number {
+  return Math.max(1, Math.floor(corto / 5));
+}
+
+/** Por debajo de esta longitud solo cuenta la igualdad exacta (normalizada). */
+const CORTO_PARA_DISTANCIA = 5;
+
 /** ¿Se parecen lo bastante dos nombres como para sospechar duplicacion? */
 export function nombresParecidos(a: string, b: string): boolean {
   const na = normal(a);
   const nb = normal(b);
   if (na === nb) return true;
   const corto = Math.min(na.length, nb.length);
-  if (corto < 5) return false;
-  return distanciaEdicion(na, nb) <= Math.max(1, Math.floor(corto / 5));
+  if (corto < CORTO_PARA_DISTANCIA) return false;
+  // IMP-1: la distancia nunca baja de la diferencia de longitudes: se
+  // descarta sin calcular.
+  if (Math.abs(na.length - nb.length) > tolerancia(corto)) return false;
+  return distanciaEdicion(na, nb) <= tolerancia(corto);
+}
+
+/**
+ * IMP-1 de la revision: indice de las existentes por longitud del nombre
+ * normalizado. Para una nueva solo se comparan las de longitud compatible
+ * (la distancia nunca baja de la diferencia de longitudes), asi que el coste
+ * deja de ser nuevas x existentes.
+ */
+function indicePorLongitud(defs: readonly Definicion[]): Map<number, Definicion[]> {
+  const indice = new Map<number, Definicion[]>();
+  for (const d of defs) {
+    const n = normal(d.nombre).length;
+    const cubo = indice.get(n);
+    if (cubo === undefined) indice.set(n, [d]);
+    else cubo.push(d);
+  }
+  return indice;
+}
+
+function parecidasEn(nueva: Definicion, indice: Map<number, Definicion[]>): Definicion[] {
+  const n = normal(nueva.nombre).length;
+  const margen = tolerancia(n);
+  const salida: Definicion[] = [];
+  for (let len = n - margen; len <= n + margen; len++) {
+    for (const e of indice.get(len) ?? []) {
+      if (e.fichero === nueva.fichero && e.nombre === nueva.nombre) continue;
+      if (nombresParecidos(nueva.nombre, e.nombre)) salida.push(e);
+    }
+  }
+  return salida;
 }
 
 /** Palabras que hacen de un nombre de test una promesa comprobable (ver disfraz-tests.md). */
@@ -168,49 +231,83 @@ export function testsQuePrometen(diffTests: string): Definicion[] {
   return salida;
 }
 
-/** Topes para no inflar la peticion. */
+/** Topes para no inflar la peticion; lo que pasa se cuenta («y N mas»). */
 export const MAX_DEFINICIONES = 15;
 export const MAX_PARECIDOS = 3;
 export const MAX_TESTS = 15;
 
 export function candidatos4D(diffCodigo: string, diffTests: string, existentes: readonly Definicion[]): Candidatos4D {
-  const duplicados: CandidatoDuplicado[] = [];
-  for (const nueva of definicionesNuevas(diffCodigo)) {
-    const parecidas = existentes
-      .filter((e) => !(e.fichero === nueva.fichero && e.nombre === nueva.nombre))
-      .filter((e) => nombresParecidos(nueva.nombre, e.nombre))
-      .slice(0, MAX_PARECIDOS);
-    if (parecidas.length > 0) duplicados.push({ nueva, existentes: parecidas });
-    if (duplicados.length >= MAX_DEFINICIONES) break;
+  const nuevas = definicionesNuevas(diffCodigo);
+  const indice = indicePorLongitud(existentes);
+  const todos: CandidatoDuplicado[] = [];
+  for (const nueva of nuevas) {
+    const parecidas = parecidasEn(nueva, indice);
+    if (parecidas.length > 0) todos.push({ nueva, existentes: parecidas });
   }
-  return { duplicados, testsAMutar: testsQuePrometen(diffTests).slice(0, MAX_TESTS) };
+  // MENOR-2: nuevas parecidas entre si (distinto nombre o distinto fichero).
+  const pares: [Definicion, Definicion][] = [];
+  const indiceNuevas = indicePorLongitud(nuevas);
+  for (const a of nuevas) {
+    for (const b of parecidasEn(a, indiceNuevas)) {
+      const orden = `${a.fichero}\0${a.nombre}` < `${b.fichero}\0${b.nombre}`;
+      if (orden) pares.push([a, b]);
+    }
+  }
+  const tests = testsQuePrometen(diffTests);
+  return {
+    duplicados: todos.slice(0, MAX_DEFINICIONES),
+    totalDuplicados: todos.length,
+    entreNuevas: pares.slice(0, MAX_DEFINICIONES),
+    totalEntreNuevas: pares.length,
+    testsAMutar: tests.slice(0, MAX_TESTS),
+    totalTests: tests.length,
+  };
 }
 
 const loc = (d: Definicion): string => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;
 
+function masAlla(mostrados: number, total: number, tope: number): string {
+  return total > mostrados ? `- ... y ${String(total - mostrados)} mas (tope ${String(tope)})\n` : '';
+}
+
 /** La seccion `## Candidatos 4D` de la peticion. */
 export function seccionCandidatos4D(c: Candidatos4D): string {
   const cabecera =
     `${SECCION_CANDIDATOS_4D}\n\n` +
     'Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).\n\n';
-  if (c.duplicados.length === 0 && c.testsAMutar.length === 0) {
-    return `${cabecera}Sin candidatos: ninguna definicion nueva se parece a una existente y ningun test nuevo promete algo que haya que mutar.\n\n`;
+  if (c.totalDuplicados === 0 && c.totalEntreNuevas === 0 && c.totalTests === 0) {
+    return `${cabecera}Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.\n\n`;
   }
   let texto = cabecera;
-  if (c.duplicados.length > 0) {
+  if (c.totalDuplicados > 0) {
     texto +=
-      '### Posible duplicacion\n\n' +
-      'Definiciones nuevas con nombre igual o parecido a otra que ya existia en la rama base. ' +
+      '### Posible duplicacion con lo que ya existia\n\n' +
+      'Definiciones nuevas con nombre igual o parecido a otra de la rama base. ' +
       'Mira si hacen lo mismo con pequenas diferencias (duplicacion real = IMPORTANTE).\n\n' +
-      c.duplicados.map((d) => `- ${loc(d.nueva)} ~ ${d.existentes.map(loc).join(', ')}\n`).join('') +
+      c.duplicados
+        .map((d) => {
+          const resto = d.existentes.length > MAX_PARECIDOS ? ` y ${String(d.existentes.length - MAX_PARECIDOS)} mas` : '';
+          return `- ${loc(d.nueva)} ~ ${d.existentes.slice(0, MAX_PARECIDOS).map(loc).join(', ')}${resto}\n`;
+        })
+        .join('') +
+      masAlla(c.duplicados.length, c.totalDuplicados, MAX_DEFINICIONES) +
+      '\n';
+  }
+  if (c.totalEntreNuevas > 0) {
+    texto +=
+      '### Posible duplicacion dentro de la tarea\n\n' +
+      'Definiciones nuevas parecidas entre si: la misma tarea puede estar escribiendo dos veces lo mismo.\n\n' +
+      c.entreNuevas.map(([a, b]) => `- ${loc(a)} ~ ${loc(b)}\n`).join('') +
+      masAlla(c.entreNuevas.length, c.totalEntreNuevas, MAX_DEFINICIONES) +
       '\n';
   }
-  if (c.testsAMutar.length > 0) {
+  if (c.totalTests > 0) {
     texto +=
       '### Tests a mutar\n\n' +
       'Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ' +
       'ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).\n\n' +
       c.testsAMutar.map((t) => `- «${t.nombre}» (${t.fichero}:${String(t.linea)})\n`).join('') +
+      masAlla(c.testsAMutar.length, c.totalTests, MAX_TESTS) +
       '\n';
   }
   return texto;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 50cc7a0..a285872 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -12,6 +12,7 @@ import path from 'node:path';
 import type { Task } from '../core/task.js';
 import { resolverConfig } from '../core/config.js';
 import { ocultarCredenciales } from '../core/plataforma-remota.js';
+import { EXTENSIONES_CODIGO, PATRON_GREP_DEFINICION } from '../core/candidatos-4d.js';
 
 export class GitCommandError extends Error {
   constructor(
@@ -624,35 +625,37 @@ export function runCodexReview(invocation: CodexReviewInvocation): CodexReviewOu
   return { lanzado: true, code: result.status, stdout: result.stdout ?? '', errorLanzamiento: null };
 }
 
-/**
- * `git diff <desde>..<hasta> -- <paths>`, acotado a un subconjunto de
- * ficheros (TASK-018): el sub-diff que recibe cada revisor de dominio,
- * para que "cada revisor recibe solo el subconjunto del diff de su
- * dominio" (criterio de aceptacion 3) sea un `git diff` filtrado y no el
- * diff entero con una instruccion de "ignora lo que no sea tuyo". Vacio
- * si `paths` esta vacio, sin llamar a Git (una peticion sin ficheros no
- * tiene nada que pedirle).
- */
 /**
  * TASK-153b: lineas con pinta de definicion (funcion, clase, constante,
  * `nombre() {` de bash) en `ref`, como `ref:fichero:linea:texto`. Es la
  * materia prima de los candidatos 4D: lo que YA existia antes de la tarea.
- * El filtro fino (que linea es de verdad una definicion y de que lenguaje)
- * lo hace `definicionesDeGrep`, en core. Sin coincidencias, git grep sale con
- * 1 y sin stderr: eso es '' (no hay definiciones), no un error.
+ * El patron y las extensiones son los de `core/candidatos-4d.ts`, que hace el
+ * filtro fino. Solo ficheros de codigo (MENOR-7) y sin lo que `excluir` saca
+ * de la revision, p. ej. `dist/` (MENOR-1). Sin coincidencias, git grep sale
+ * con 1 y sin stderr: eso es '' (no hay definiciones), no un error.
  */
-export function definicionesEnRef(ref: string, cwd: string): string {
-  const patron =
-    '(function|class|fn|def|const|let|var|struct|interface|record|enum)[[:space:]]+[A-Za-z_$]' +
-    '|^[[:space:]]*[A-Za-z_][A-Za-z0-9_-]*[[:space:]]*\\(\\)[[:space:]]*\\{';
+export function definicionesEnRef(ref: string, cwd: string, excluir: readonly string[] = []): string {
+  const pathspecs = [
+    ...EXTENSIONES_CODIGO.map((e) => `:(glob)**/*.${e}`),
+    ...excluir.map((p) => `:(exclude,glob)${p}`),
+  ];
   try {
-    return runGit([...SIN_COMILLAS, 'grep', '-n', '-I', '-E', patron, ref, '--'], cwd);
+    return runGit([...SIN_COMILLAS, 'grep', '-n', '-I', '-E', PATRON_GREP_DEFINICION, ref, '--', ...pathspecs], cwd);
   } catch (e) {
     if (e instanceof GitCommandError && e.stderr.trim() === '') return '';
     throw e;
   }
 }
 
+/**
+ * `git diff <desde>..<hasta> -- <paths>`, acotado a un subconjunto de
+ * ficheros (TASK-018): el sub-diff que recibe cada revisor de dominio,
+ * para que "cada revisor recibe solo el subconjunto del diff de su
+ * dominio" (criterio de aceptacion 3) sea un `git diff` filtrado y no el
+ * diff entero con una instruccion de "ignora lo que no sea tuyo". Vacio
+ * si `paths` esta vacio, sin llamar a Git (una peticion sin ficheros no
+ * tiene nada que pedirle).
+ */
 export function diffRangeForPaths(
   desde: string,
   hasta: string,
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 42562c3fb668a8251a18fa580caced8053574736..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-153b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-153b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-153b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-153b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-153b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-153b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-153b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-153b/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-153b/revision/informe-revision-1.md                                                  |  21 ++++
 tareas/03-en-revision/TASK-153b/revision/peticion-revision-1.md                                                 | 507 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-153b/tarea.md                                                       |  16 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                        |  22 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/candidatos-4d.js                                     | 154 ++++++++++++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                                 |  36 +++---
 14 files changed, 697 insertions(+), 59 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 42562c3fb668a8251a18fa580caced8053574736..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/candidatos-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-candidatos-4d.test.ts | 52 ++++++++++++++++++++++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/candidatos-4d.test.ts            | 61 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 111 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 116.9 s
- Commit verificado: 090c91b02e47f7c1fe7caa1f0b4158e37da20e50
- Huella: fe9059f7da97961c094968660cc272ebfe02c8f0
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 116116 bytes en total):

````
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.1147ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (3.2598ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (2.5471ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.4749ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.927ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.2032ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7249ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1776.2471ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1602.2129ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.7738ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.149ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.8357ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.63ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.5636ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9599ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.0918ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.0188ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.9578ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.8549ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.7302ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (5.1131ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (37.0228ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (2.1126ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4253ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4904ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4455ms)
✔ revision.md define las 4D con ejemplo y hace IMPORTANTE la duplicacion y el disfraz reales (13.6989ms)
✔ cada revisora da un ejemplo por D en su seccion "## Que se revisa" y remite a revision.md (19.9011ms)
✔ start exige helper buscado, criterio citado y mutacion, anotados en la autorrevision (3.0405ms)
✔ TASK-153a: start y revision.md remiten a la guia de patrones de disfraz, que los define (5.0963ms)
✔ TASK-153b: revision.md pide comprobar los candidatos 4D de la peticion y mutar sus tests (4.8899ms)
ℹ tests 718
ℹ suites 0
ℹ pass 718
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 107197.2183
[verificar-impacto] node --test termino con 0 en 107.3 s.
````
