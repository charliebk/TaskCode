# Peticion de revision — TASK-054 (ronda 1)

- Tarea: TASK-054 — Rutas no ASCII en el diff de revision fragmentado por dominio
- Rama revisada: fix/task-054-rutas-no-ascii-en-el-diff-de-revision-fr
- Rama base: develop
- Commit revisado (HEAD): 7629ba0ba09a5d5dfb2d840ed04e233ab01943ec
- Fecha: 2026-10-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-054 (criterios de aceptacion y plan)

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
7629ba0 fix(TASK-054): rutas no ASCII y de glob iguales en clasificacion y diff de revision
986e8e4 chore(TASK-054): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index a1fef19..bd947df 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -308,10 +308,7 @@ export function diffParaRevision(
   const rango = `${desde}..${hasta}`;
   const sinExcluidos = ['--', '.', ...excluir.map((p) => `:(exclude,glob)${p}`)];
   const nombres = (args: readonly string[]): string[] =>
-    runGit(['diff', '--name-only', rango, ...args], cwd)
-      .split('\n')
-      .map((l) => l.trim())
-      .filter((l) => l !== '');
+    partirNul(runGit([...SIN_COMILLAS, 'diff', '--name-only', '-z', rango, ...args], cwd));
 
   const todos = nombres([]);
   const incluidos = excluir.length === 0 ? todos : nombres(sinExcluidos);
@@ -320,26 +317,49 @@ export function diffParaRevision(
   return {
     incluidos,
     excluidos,
-    diff: excluir.length === 0 ? runGit(['diff', rango], cwd) : runGit(['diff', rango, ...sinExcluidos], cwd),
+    diff:
+      excluir.length === 0
+        ? runGit([...SIN_COMILLAS, 'diff', rango], cwd)
+        : runGit([...SIN_COMILLAS, 'diff', rango, ...sinExcluidos], cwd),
     stat:
       excluidos.length === 0
         ? ''
         : // --stat=200: a 80 columnas Git abrevia las rutas con ".../" y
           // el revisor no sabria que pedir (MENOR-3 de la revision).
-          runGit(['diff', '--stat=200', rango, '--', ...excluir.map((p) => `:(glob)${p}`)], cwd),
+          runGit(
+            [...SIN_COMILLAS, 'diff', '--stat=200', rango, '--', ...excluir.map((p) => `:(glob)${p}`)],
+            cwd
+          ),
   };
 }
 
+/**
+ * TASK-054: sin esto Git entrecomilla las rutas no ASCII y las escapa en
+ * octal; la clasificacion por dominio trabajaba con esa ruta escapada y el
+ * diff del fichero no llegaba a la peticion de su dominio. Va en los
+ * nombres, en el diff y en el --stat, para que todos digan la misma ruta.
+ */
+const SIN_COMILLAS: readonly string[] = ['-c', 'core.quotePath=false'];
+
+/**
+ * Salida de `--name-only -z`: rutas separadas por NUL, sin comillas ni
+ * escapes, asi que una ruta con espacios, comillas o un salto de linea
+ * sale tal cual. No se recorta: un espacio al final es parte del nombre.
+ */
+function partirNul(salida: string): string[] {
+  return salida.split('\0').filter((r) => r !== '');
+}
+
 /**
  * Rutas (con "/" de Git) que cambian entre `desde` y `hasta`, sin el
  * contenido del diff (TASK-018: es la entrada del clasificador por
  * dominio de "taskctl review" — clasificar necesita solo los nombres,
- * no el diff completo). Mismo estilo que lsTreeNames.
+ * no el diff completo). Mismo estilo que lsTreeNames. Hoy `review` saca
+ * los nombres de `diffParaRevision`; esta se mantiene con el mismo
+ * tratamiento de rutas (TASK-054).
  */
 export function diffNameOnly(desde: string, hasta: string, cwd: string): string[] {
-  return runGit(['diff', '--name-only', `${desde}..${hasta}`], cwd)
-    .split('\n')
-    .filter((line) => line !== '');
+  return partirNul(runGit([...SIN_COMILLAS, 'diff', '--name-only', '-z', `${desde}..${hasta}`], cwd));
 }
 
 /**
@@ -467,7 +487,13 @@ export function diffRangeForPaths(
   cwd: string
 ): string {
   if (paths.length === 0) return '';
-  return runGit(['diff', `${desde}..${hasta}`, '--', ...paths], cwd);
+  // `:(literal)` (TASK-054): son rutas reales, no patrones. Sin el,
+  // `pages/[id].vue` se leeria como glob y el diff del grupo saldria vacio
+  // o con otros ficheros.
+  return runGit(
+    [...SIN_COMILLAS, 'diff', `${desde}..${hasta}`, '--', ...paths.map((p) => `:(literal)${p}`)],
+    cwd
+  );
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
index 9748c9b..416bf24 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -14,6 +14,7 @@ import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
 import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
 import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
 import { StateMachineError } from '../../src/core/state-machine.js';
 import type { Task } from '../../src/core/task.js';
 
@@ -761,3 +762,66 @@ test('taskctl review: error claro si falta el ID o la tarea no existe', async ()
     );
   });
 });
+
+// --- TASK-054: rutas no ASCII y con caracteres de glob ----------------------
+//
+// Sin core.quotePath=false y -z, Git entrecomillaba y escapaba en octal la
+// ruta con tilde: la clasificacion la veia escapada, el pathspec no casaba y
+// el diff del fichero no llegaba a la peticion de su dominio. Mutacion que
+// lo pone rojo: quitar SIN_COMILLAS o el -z de diffParaRevision.
+
+test('taskctl review: un fichero con tilde llega con su diff a la peticion de su dominio (TASK-054)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-654', rama: 'feature/task-654-no-ascii' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(repoRoot, 'src/main/java/com/acme/Acción.java', 'class Accion { int ñandú; }\n');
+    await escribirFichero(
+      repoRoot,
+      'src/app/user-profile/user-profile.component.ts',
+      'export class UserProfileComponent {}\n'
+    );
+    commitAll(repoRoot, 'java con tilde y angular');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-654'], '2026-10-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    const java = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
+    assert.ok(java !== undefined, JSON.stringify(result.informes));
+    assert.deepEqual(java.ficheros, ['src/main/java/com/acme/Acción.java']);
+    const peticion = await readFile(java.peticionPath, 'utf8');
+    assert.ok(peticion.includes('diff --git a/src/main/java/com/acme/Acción.java'), peticion);
+    assert.ok(peticion.includes('int ñandú;'), peticion);
+    // Ni comillas ni escape octal (`"src/.../Acci\303\263n.java"`).
+    assert.ok(!peticion.includes('Acci\\303'), peticion);
+    // El otro dominio no se lleva el fichero con tilde.
+    const angular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer');
+    assert.ok(angular !== undefined);
+    assert.doesNotMatch(await readFile(angular.peticionPath, 'utf8'), /Acción\.java/);
+  });
+});
+
+test('diffParaRevision y diffRangeForPaths: rutas no ASCII sin comillas y rutas de glob como literales (TASK-054)', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const base = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    await escribirFichero(repoRoot, 'src/acción.ts', 'export const a = 1;\n');
+    await escribirFichero(repoRoot, 'pages/[id].vue', '<template>id</template>\n');
+    await escribirFichero(repoRoot, 'pages/i.vue', '<template>i</template>\n');
+    await escribirFichero(repoRoot, 'docs/guía.md', 'texto\n');
+    commitAll(repoRoot, 'rutas raras');
+
+    const r = diffParaRevision(base, 'HEAD', ['docs/**'], repoRoot);
+    assert.ok(r.incluidos.includes('src/acción.ts'), JSON.stringify(r.incluidos));
+    assert.ok(r.incluidos.includes('pages/[id].vue'));
+    assert.deepEqual(r.excluidos, ['docs/guía.md']);
+    assert.ok(r.diff.includes('diff --git a/src/acción.ts b/src/acción.ts'), r.diff);
+    assert.ok(r.stat.includes('docs/guía.md'), r.stat);
+
+    const soloId = diffRangeForPaths(base, 'HEAD', ['pages/[id].vue'], repoRoot);
+    assert.ok(soloId.includes('pages/[id].vue'), soloId);
+    assert.ok(!soloId.includes('pages/i.vue'), soloId);
+    assert.ok(diffRangeForPaths(base, 'HEAD', ['src/acción.ts'], repoRoot).includes('export const a = 1;'));
+  });
+});
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-054/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-054/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-054/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                           | 39 ++++++++++++++++++++++++++++-----------
 4 files changed, 30 insertions(+), 12 deletions(-)
````
