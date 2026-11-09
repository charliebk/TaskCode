# Peticion de revision — TASK-091 (ronda 4)

- Tarea: TASK-091 — Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar
- Rama revisada: feature/task-091-verificacion-selectiva-por-impacto-en-la
- Rama base: develop
- Commit revisado (HEAD): afb798e1963817c1f8719a430cc1fccd6aec8080
- Fecha: 2026-11-09
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-091 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 4bac229cc013fe4b6fd65c3de57340c9384b65f0 (el commit revisado en la ronda anterior)
- Alcance: completa (motivo: la ronda anterior tiene un IMPORTANTE (IMP-1, corregido (codigo, tests y docs)))

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-4.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-091/tarea.md
- tareas/03-en-revision/TASK-091/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts

## Hallazgos de la ronda 3 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido (codigo, tests y docs) | src/commands/review.ts:909-912 y 643-647 | informe-revision-3.md |
| IMP-2 | IMPORTANTE | abierto | src/commands/review.ts:909-912 (rama de la primera ronda) y 927 (arbol sucio) | informe-revision-3.md |
| MEN-3 | MENOR | abierto | CHANGELOG.md (entrada de TASK-091, frase sobre la ronda incremental) | informe-revision-3.md |

## Commits a revisar (git log 4bac229cc013fe4b6fd65c3de57340c9384b65f0..HEAD)

````
afb798e docs(TASK-091): autorrevision ronda 4
792803c fix(TASK-091): IMP-2 y MEN-3 de la ronda 3, el mensaje no promete nada del reintento y el CHANGELOG cuenta la ronda incremental
13a67b7 chore(TASK-091): veredicto ronda 3 (cambios-solicitados)
45132c4 chore(TASK-091): coste revision +3018707 tokens (1 agente)
405c67e chore(TASK-091): informe de revision ronda 3
6379f7c chore(TASK-091): peticion de revision ronda 3
````

## Diff desde la ronda anterior (git diff 4bac229cc013fe4b6fd65c3de57340c9384b65f0..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 26c0bdd..00b7a52 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -7,8 +7,10 @@ Verificacion selectiva por impacto (TASK-091). Clave nueva opcional
 por defecto): una verificacion rapida que corre solo lo afectado por los
 cambios y recibe la rama base de la tarea en la variable `RAMA_BASE`. La usan el
 hook `Stop` (en vez de la completa) y `taskctl review`, que la corre antes de
-escribir la ronda (en la primera, despues de integrar la base): en rojo, o si deja el arbol sucio, aborta sin abrir ronda y la
-tarea sigue en curso; en verde, la peticion lleva la seccion «Verificacion de
+escribir la ronda (en la primera, despues de integrar la base; las rondas
+incrementales no la integran): en rojo, o si deja el arbol sucio, aborta sin
+abrir ronda, la tarea sigue en curso y el mensaje dice si la base quedo
+integrada; en verde, la peticion lleva la seccion «Verificacion de
 esta ronda» con el tipo, el comando, el resultado y su salida, y omite la de
 cobertura (el informe podria ser parcial). `comando_verificacion` sigue siendo
 la puerta de `finish` y del guardian de merges: la selectiva sin la completa
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 54a59d7..eb33df1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -908,7 +908,8 @@ function verificacionSelectivaDeRonda(
   // Lo que ya paso con la base antes de verificar: solo la primera ronda la integra.
   const estadoBase = incremental
     ? `en una ronda incremental la rama no se actualiza con "${base}"`
-    : `"${base}" ya se ha integrado en la rama, como en cualquier review; reintentar no repite el merge`;
+    : `"${base}" se ha integrado en la rama en este intento, como en cualquier review; si "${base}" avanza ` +
+      'antes de reintentar, el reintento integra tambien lo nuevo';
   if (v.resultado.estado !== 'verde') {
     throw new ReviewCommandError(
       `[ERROR] ${id}: la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE) no esta en ` +
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
index 7bd0f82..e782fcf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
@@ -318,7 +318,9 @@ test('review (TASK-091): selectiva en rojo aborta sin ronda; la tarea sigue en c
           assert.ok(e instanceof ReviewCommandError);
           assert.match(e.message, /verificacion selectiva .* no esta en verde, asi que no se abre ronda/);
           assert.match(e.message, /la tarea sigue en curso/);
-          assert.match(e.message, /"develop" ya se ha integrado en la rama/);
+          assert.match(e.message, /"develop" se ha integrado en la rama en este intento/);
+          assert.match(e.message, /el reintento integra tambien lo nuevo/);
+          assert.doesNotMatch(e.message, /no repite/);
           assert.match(e.message, /selectiva: ERROR, 2 tests fallan/);
           assert.match(e.message, /con la variable de entorno RAMA_BASE=develop/);
           return true;
@@ -333,6 +335,26 @@ test('review (TASK-091): selectiva en rojo aborta sin ronda; la tarea sigue en c
   });
 });
 
+test('review (TASK-091): primera ronda en rojo, develop avanza y el reintento integra lo nuevo, como dice el mensaje', async () => {
+  await conScripts(async (v) => {
+    await v.desenlace('selectiva', 'ko');
+    await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
+      await assert.rejects(() => review(repoRoot, tareasRoot), /el reintento integra tambien lo nuevo/);
+      const rama = git(['branch', '--show-current'], repoRoot).trim();
+      git(['checkout', '-q', 'develop'], repoRoot);
+      await writeFile(path.join(repoRoot, 'nuevo-en-develop.txt'), 'x\n', 'utf8');
+      commitReview(repoRoot, 'develop avanza entre intentos');
+      const nuevo = git(['rev-parse', 'HEAD'], repoRoot).trim();
+      git(['checkout', '-q', rama], repoRoot);
+      await v.desenlace('selectiva', 'ok');
+      const r = await review(repoRoot, tareasRoot);
+      assert.equal(r.ronda, 1);
+      assert.equal(git(['merge-base', '--is-ancestor', nuevo, 'HEAD'], repoRoot), '', 'el reintento integra el commit nuevo');
+      assert.ok(existsSync(path.join(repoRoot, 'nuevo-en-develop.txt')));
+    });
+  });
+});
+
 test('review (TASK-091): en una ronda incremental, el rojo no dice que la base se haya integrado (no se integra)', async () => {
   await conScripts(async (v) => {
     await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
@@ -362,7 +384,7 @@ test('review (TASK-091): en una ronda incremental, el rojo no dice que la base s
           assert.ok(e instanceof ReviewCommandError);
           assert.match(e.message, /no se abre ronda de revision/);
           assert.match(e.message, /en una ronda incremental la rama no se actualiza con "develop"/);
-          assert.doesNotMatch(e.message, /ya se ha integrado/);
+          assert.doesNotMatch(e.message, /se ha integrado/);
           return true;
         }
       );
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 4bac229cc013fe4b6fd65c3de57340c9384b65f0..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-091/revision/informe-revision-3.md            |  54 +++++++++++++++++++++++++
 tareas/03-en-revision/TASK-091/revision/peticion-revision-3.md           | 258 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-091/tarea.md                                  |   5 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js |   3 +-
 4 files changed, 318 insertions(+), 2 deletions(-)
````
