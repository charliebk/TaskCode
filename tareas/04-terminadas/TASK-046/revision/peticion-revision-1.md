# Peticion de revision — TASK-046 (ronda 1)

- Tarea: TASK-046 — F5-T2 Secciones con subtitulos y criterios multilinea
- Rama revisada: fix/task-046-f5-t2-secciones-con-subtitulos-y-criteri
- Rama base: develop
- Commit revisado (HEAD): 7521cd7f51204de5ee7abe4c31907d865303a922
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-046 (criterios de aceptacion y plan)

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
7521cd7 fix(TASK-046): los subtitulos no cortan objetivo ni criterios; import une criterios multilinea
c13faa8 chore(TASK-046): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts
index f16f60f..416d2c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts
@@ -129,6 +129,16 @@ export function parseImportMarkdown(content: string): ParsedImportEntry[] {
       continue;
     }
 
+    // TASK-046 (D7 de la auditoria): una linea SANGRADA justo despues de
+    // un criterio es su continuacion, como en tarea-body.ts. Antes
+    // invalidaba la entrada entera. La prosa sin sangrar sigue siendo un
+    // error: no es la continuacion de nada.
+    if (/^\s+\S/.test(line) && current.criterios.length > 0 && current.strayLine === null) {
+      const ultimo = current.criterios.length - 1;
+      current.criterios[ultimo] = `${current.criterios[ultimo] ?? ''} ${line.trim()}`.trim();
+      continue;
+    }
+
     if (current.strayLine === null) {
       current.strayLine = { text: line, lineNumber: i + 1 };
     }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
index 3912a4f..6ee4262 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
@@ -38,13 +38,27 @@
 export interface SeccionesTarea {
   /** Texto bajo "## Objetivo", sin la cabecera, trim(). '' si no hay. */
   objetivo: string;
-  /** Una entrada por linea de checklist bajo "## Criterios de aceptacion". */
+  /**
+   * Una entrada por linea de checklist bajo "## Criterios de aceptacion",
+   * incluidas las de sus subsecciones `###`, MENOS las de `### Tras el
+   * cierre`.
+   */
   criterios: string[];
+  /**
+   * TASK-046: las casillas de `### Tras el cierre` (criterios que solo se
+   * verifican despues de `finish`). No cuentan para cerrar la tarea.
+   */
+  criteriosTrasCierre: string[];
 }
 
 /** Cabecera ATX de nivel 2 a 6 (ver decision 2 de la cabecera). */
 const RE_CABECERA = /^ {0,3}#{2,6}(?:\s|$)/;
 
+/** Subtitulo de nivel 3 a 6: no cambia de seccion (TASK-046). */
+const RE_SUBTITULO = /^ {0,3}#{3,6}(?:\s|$)/;
+
+const TITULO_TRAS_CIERRE = 'tras el cierre';
+
 /** Linea de checklist: "- [ ] texto", "- [x] texto", "* [X] texto". */
 const RE_CRITERIO = /^\s*[-*]\s+\[[ xX]\]\s*(.*)$/;
 
@@ -96,14 +110,32 @@ function tituloDeCabecera(linea: string): string {
 export function extraerSecciones(body: string): SeccionesTarea {
   const lineas = body.split(/\r?\n/);
   const objetivo: string[] = [];
-  const criterios: string[] = [];
+  const normales: string[] = [];
+  const trasCierre: string[] = [];
+  // A que lista van ahora los criterios: los de `### Tras el cierre` van
+  // aparte (TASK-046).
+  let destino = normales;
 
   let seccion: 'objetivo' | 'criterios' | 'otra' = 'otra';
   let objetivoVisto = false;
   let criteriosVisto = false;
 
   for (const linea of lineas) {
+    // TASK-046 (D2 de la auditoria): un subtitulo de nivel 3 o mas dentro
+    // del Objetivo o de los Criterios NO cambia de seccion. Antes cualquier
+    // `###` la cortaba: criterios agrupados en `### Parser` / `### CLI`
+    // daban `criterios: []`, y `### Tras el cierre` quedaba fuera solo por
+    // casualidad.
+    if (RE_SUBTITULO.test(linea) && seccion !== 'otra') {
+      if (seccion === 'objetivo') {
+        objetivo.push(linea);
+      } else {
+        destino = tituloDeCabecera(linea) === TITULO_TRAS_CIERRE ? trasCierre : normales;
+      }
+      continue;
+    }
     if (RE_CABECERA.test(linea)) {
+      destino = normales;
       const titulo = tituloDeCabecera(linea);
       if (titulo === TITULO_OBJETIVO && !objetivoVisto) {
         seccion = 'objetivo';
@@ -125,15 +157,15 @@ export function extraerSecciones(body: string): SeccionesTarea {
     if (seccion === 'criterios') {
       const criterio = RE_CRITERIO.exec(linea);
       if (criterio !== null) {
-        criterios.push((criterio[1] ?? '').trim());
+        destino.push((criterio[1] ?? '').trim());
         continue;
       }
-      if (criterios.length > 0 && RE_CONTINUACION.test(linea)) {
-        const ultimo = criterios[criterios.length - 1] ?? '';
-        criterios[criterios.length - 1] = `${ultimo} ${linea.trim()}`.trim();
+      if (destino.length > 0 && RE_CONTINUACION.test(linea)) {
+        const ultimo = destino[destino.length - 1] ?? '';
+        destino[destino.length - 1] = `${ultimo} ${linea.trim()}`.trim();
       }
     }
   }
 
-  return { objetivo: objetivo.join('\n').trim(), criterios };
+  return { objetivo: objetivo.join('\n').trim(), criterios: normales, criteriosTrasCierre: trasCierre };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-body-subtitulos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-body-subtitulos.test.ts
new file mode 100644
index 0000000..f222ef0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/tarea-body-subtitulos.test.ts
@@ -0,0 +1,48 @@
+/**
+ * TASK-046: subtitulos `###` dentro del Objetivo y de los Criterios, y
+ * criterios en varias lineas en `import`.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { extraerSecciones } from '../../src/core/tarea-body.js';
+import { parseImportMarkdown } from '../../src/core/import-parser.js';
+
+test('extraerSecciones (TASK-046): criterios agrupados en subtitulos aparecen todos', () => {
+  const s = extraerSecciones(
+    '## Objetivo\n\nX.\n\n## Criterios de aceptacion\n### Parser\n- [ ] a\n- [ ] b\n### CLI\n- [ ] c\n'
+  );
+  assert.deepEqual(s.criterios, ['a', 'b', 'c']);
+  assert.deepEqual(s.criteriosTrasCierre, []);
+});
+
+test('extraerSecciones (TASK-046): las casillas de "### Tras el cierre" van aparte y no cuentan', () => {
+  const s = extraerSecciones(
+    '## Criterios de aceptacion\n- [x] uno\n\n### Tras el cierre\n\n(despues de finish)\n- [ ] CI en verde\n\n## Resultado\n- [ ] no es criterio\n'
+  );
+  assert.deepEqual(s.criterios, ['uno']);
+  assert.deepEqual(s.criteriosTrasCierre, ['CI en verde']);
+});
+
+test('extraerSecciones (TASK-046): un subtitulo dentro del Objetivo se conserva y no corta el texto', () => {
+  const s = extraerSecciones('## Objetivo\n\nPrimero.\n\n### Contexto\n\nSegundo.\n\n## Criterios de aceptacion\n- [ ] a\n');
+  assert.match(s.objetivo, /Primero\./);
+  assert.match(s.objetivo, /### Contexto/);
+  assert.match(s.objetivo, /Segundo\./);
+  assert.deepEqual(s.criterios, ['a']);
+});
+
+test('extraerSecciones (TASK-046): un ## posterior sigue cerrando la seccion', () => {
+  const s = extraerSecciones('## Criterios de aceptacion\n- [ ] a\n## Notas\n- [ ] fuera\n');
+  assert.deepEqual(s.criterios, ['a']);
+});
+
+test('import (TASK-046): un criterio partido en lineas sangradas es una entrada valida con el criterio completo', () => {
+  const [e] = parseImportMarkdown('### Tarea\n- Primera parte\n  y segunda parte\n- Otro\n');
+  assert.ok(e !== undefined && e.ok, JSON.stringify(e));
+  assert.deepEqual((e as { criterios: string[] }).criterios, ['Primera parte y segunda parte', 'Otro']);
+});
+
+test('import (TASK-046): la prosa sin sangrar sigue invalidando la entrada', () => {
+  const [e] = parseImportMarkdown('### Tarea\n- Uno\nprosa suelta\n');
+  assert.ok(e !== undefined && !e.ok);
+});
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-046/planificacion/brainstorm/peticion-unificador-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-046/planificacion/plan-final.md                       |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-046/tarea.md                                          | 25 +++++++++++++++++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/import-parser.js                     |  9 +++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-body.js                        | 34 ++++++++++++++++++++++++++++------
 5 files changed, 58 insertions(+), 10 deletions(-)
````
