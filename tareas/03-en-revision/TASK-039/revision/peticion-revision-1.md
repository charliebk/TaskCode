# Peticion de revision — TASK-039 (ronda 1)

- Tarea: TASK-039 — F2-T3 Menos llamadas git en los comandos
- Rama revisada: feature/task-039-f2-t3-menos-llamadas-git-en-los-comandos
- Rama base: develop
- Commit revisado (HEAD): d8a82893eff45be97ecae1178fea7a8e4482a128
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-039 (criterios de aceptacion y plan)

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
d8a8289 perf(TASK-039): autoCommit con un solo add, sin maintenance y un solo show
e6d7671 chore(TASK-039): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
index bde61b0..5fcf2c2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
@@ -237,19 +237,18 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
   let ficheros: string[] = [];
 
   if (presentes.length > 0) {
-    // Una a una, a proposito: un pathspec por invocacion deja claro en
-    // el log de Git (y en un strace, si hiciera falta) que no hay
-    // ningun `git add` sin acotar por ahi.
-    for (const rutaRel of presentes) {
-      try {
-        runGit(['add', '-A', '--', rutaRel], cwd);
-      } catch (e: unknown) {
-        throw new AutoCommitError(
-          `[ERROR] taskctl escribio los ficheros de la tarea pero no pudo preparar ` +
-            `"${rutaRel}" para el commit: ${detalleDeError(e)}. Los cambios estan en el ` +
-            'arbol de trabajo; revisa el motivo y commitealos a mano.'
-        );
-      }
+    // Un solo `git add`, ACOTADO por las rutas de taskctl (TASK-039: antes
+    // era uno por ruta, cinco procesos en `finish`). Lo que garantiza la
+    // regla 1 es el pathspec, no el numero de invocaciones: sigue sin
+    // haber ningun `git add` sin acotar.
+    try {
+      runGit(['add', '-A', '--', ...presentes], cwd);
+    } catch (e: unknown) {
+      throw new AutoCommitError(
+        `[ERROR] taskctl escribio los ficheros de la tarea pero no pudo preparar ` +
+          `${presentes.map((r) => `"${r}"`).join(', ')} para el commit: ${detalleDeError(e)}. ` +
+          'Los cambios estan en el arbol de trabajo; revisa el motivo y commitealos a mano.'
+      );
     }
 
     // Regla 2: si el indice no difiere de HEAD bajo estas rutas, no
@@ -262,7 +261,10 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
 
     if (ficheros.length > 0) {
       try {
-        runGit(['commit', '-m', opts.mensaje, '--', ...presentes], cwd);
+        // maintenance.auto=false (TASK-039): sin el, Git lanza un
+        // `maintenance run --auto` tras cada commit automatico. Lo hara
+        // la siguiente operacion de Git de la persona.
+        runGit(['-c', 'maintenance.auto=false', 'commit', '-m', opts.mensaje, '--', ...presentes], cwd);
       } catch (e: unknown) {
         throw new AutoCommitError(
           `[ERROR] taskctl escribio los ficheros de la tarea pero NO pudo commitearlos: ` +
@@ -272,7 +274,6 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
         );
       }
       commiteado = true;
-      commit = runGit(['rev-parse', '--short', 'HEAD'], cwd);
 
       // Hallazgo IMPORTANTE de la revision por pares (TASK-030): la
       // lista de arriba es lo que taskctl PIDIO commitear, no lo que
@@ -284,11 +285,12 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
       // habia registrado 2: en el unico escenario donde la regla se
       // rompe, la herramienta afirmaba lo contrario. Asi que la lista
       // se relee del commit y, si no coincide, se avisa.
+      // Una sola llamada para el SHA corto (primera linea) y los ficheros
+      // (TASK-039: antes eran `rev-parse --short` y `show` por separado).
       const pedidos = ficheros;
-      ficheros = runGit(['show', '--name-only', '--format=', 'HEAD'], cwd)
-        .split('\n')
-        .map((l) => l.trim())
-        .filter((l) => l !== '');
+      const [sha, ...lineas] = runGit(['show', '--name-only', '--format=%h', 'HEAD'], cwd).split('\n');
+      commit = (sha ?? '').trim();
+      ficheros = lineas.map((l) => l.trim()).filter((l) => l !== '');
 
       const intrusos = ficheros.filter((f) => !pedidos.includes(f));
       if (intrusos.length > 0) {
````

## Excluido del diff (7 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-039/tarea.md                                                                        | 35 -----------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-039/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-039/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-039/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-039/planificacion/plan-final.md                                    |  0
 tareas/02-en-curso/TASK-039/tarea.md                                                                         | 61 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js                                       | 38 ++++++++++++++++++++------------------
 7 files changed, 81 insertions(+), 53 deletions(-)
````
