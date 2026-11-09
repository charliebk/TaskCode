# Peticion de revision — TASK-091 (ronda 5)

- Tarea: TASK-091 — Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar
- Rama revisada: feature/task-091-verificacion-selectiva-por-impacto-en-la
- Rama base: develop
- Commit revisado (HEAD): d4796b363eb5d04c48341a71553683a48f83cc40
- Fecha: 2026-11-09
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-091 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde afb798e1963817c1f8719a430cc1fccd6aec8080 (el commit revisado en la ronda anterior)
- Alcance: completa (motivo: la ronda anterior tiene un IMPORTANTE (IMP-2, corregido))

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-5.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-091/tarea.md
- tareas/03-en-revision/TASK-091/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts

## Hallazgos de la ronda 4 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-3 | IMPORTANTE | abierto | src/commands/review.ts:909-912 (`estadoBase`; tambien en el mensaje de arbol sucio, linea 927) | informe-revision-4.md |

## Commits a revisar (git log afb798e1963817c1f8719a430cc1fccd6aec8080..HEAD)

````
d4796b3 docs(TASK-091): autorrevision ronda 5
e184e34 fix(TASK-091): IMP-3 de la ronda 4, el mensaje describe el estado de la rama y no el momento de la integracion
9a57fe7 chore(TASK-091): veredicto ronda 4 (cambios-solicitados)
184e7f9 chore(TASK-091): coste revision +1810998 tokens (1 agente)
90d16d8 chore(TASK-091): informe de revision ronda 4
51dbfcb chore(TASK-091): peticion de revision ronda 4
````

## Diff desde la ronda anterior (git diff afb798e1963817c1f8719a430cc1fccd6aec8080..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index eb33df1..615c617 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -908,8 +908,8 @@ function verificacionSelectivaDeRonda(
   // Lo que ya paso con la base antes de verificar: solo la primera ronda la integra.
   const estadoBase = incremental
     ? `en una ronda incremental la rama no se actualiza con "${base}"`
-    : `"${base}" se ha integrado en la rama en este intento, como en cualquier review; si "${base}" avanza ` +
-      'antes de reintentar, el reintento integra tambien lo nuevo';
+    : `la rama ya incluye "${base}" tal como estaba al empezar este review; si "${base}" avanza, el ` +
+      'siguiente review lo integra';
   if (v.resultado.estado !== 'verde') {
     throw new ReviewCommandError(
       `[ERROR] ${id}: la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE) no esta en ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
index e782fcf..ebb91ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
@@ -318,9 +318,9 @@ test('review (TASK-091): selectiva en rojo aborta sin ronda; la tarea sigue en c
           assert.ok(e instanceof ReviewCommandError);
           assert.match(e.message, /verificacion selectiva .* no esta en verde, asi que no se abre ronda/);
           assert.match(e.message, /la tarea sigue en curso/);
-          assert.match(e.message, /"develop" se ha integrado en la rama en este intento/);
-          assert.match(e.message, /el reintento integra tambien lo nuevo/);
-          assert.doesNotMatch(e.message, /no repite/);
+          assert.match(e.message, /la rama ya incluye "develop" tal como estaba al empezar este review/);
+          assert.match(e.message, /si "develop" avanza, el siguiente review lo integra/);
+          assert.doesNotMatch(e.message, /no repite|en este intento/);
           assert.match(e.message, /selectiva: ERROR, 2 tests fallan/);
           assert.match(e.message, /con la variable de entorno RAMA_BASE=develop/);
           return true;
@@ -339,7 +339,19 @@ test('review (TASK-091): primera ronda en rojo, develop avanza y el reintento in
   await conScripts(async (v) => {
     await v.desenlace('selectiva', 'ko');
     await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
-      await assert.rejects(() => review(repoRoot, tareasRoot), /el reintento integra tambien lo nuevo/);
+      await assert.rejects(() => review(repoRoot, tareasRoot), /si "develop" avanza, el siguiente review lo integra/);
+      // Reintento SIN avance de develop: no integra nada y el mensaje sigue siendo cierto (habla del estado).
+      const headTrasPrimero = git(['rev-parse', 'HEAD'], repoRoot).trim();
+      await assert.rejects(
+        () => review(repoRoot, tareasRoot),
+        (e: unknown) => {
+          assert.ok(e instanceof ReviewCommandError);
+          assert.match(e.message, /la rama ya incluye "develop" tal como estaba al empezar este review/);
+          assert.doesNotMatch(e.message, /en este intento|se ha integrado/);
+          return true;
+        }
+      );
+      assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), headTrasPrimero, 'sin avance, el reintento no integra nada');
       const rama = git(['branch', '--show-current'], repoRoot).trim();
       git(['checkout', '-q', 'develop'], repoRoot);
       await writeFile(path.join(repoRoot, 'nuevo-en-develop.txt'), 'x\n', 'utf8');
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff afb798e1963817c1f8719a430cc1fccd6aec8080..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-091/revision/informe-revision-4.md            |  51 +++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-091/revision/peticion-revision-4.md           | 165 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-091/tarea.md                                  |   5 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js |   4 +--
 4 files changed, 222 insertions(+), 3 deletions(-)
````
