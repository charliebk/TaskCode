# Peticion de revision — TASK-091 (ronda 2)

- Tarea: TASK-091 — Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar
- Rama revisada: feature/task-091-verificacion-selectiva-por-impacto-en-la
- Rama base: develop
- Commit revisado (HEAD): d221a9d11e52fc4008fffad80bcbb1883cdd8331
- Fecha: 2026-11-09
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-091 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 859499e9ca48bd79e9f23dde616ff18f910b2748 (el commit revisado en la ronda anterior)
- Alcance: completa (motivo: el diff toca ficheros que ningun hallazgo nombraba: taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md, taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-091/tarea.md
- tareas/03-en-revision/TASK-091/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/commands/review.ts:~646 (`verificacionSelectivaDeRonda`) y su mensaje de error; CHANGELOG.md y README.md ("antes de escribir nada") | informe-revision-1.md |
| MEN-2 | MENOR | abierto | test/commands/verificacion-selectiva.test.ts (test del guardian) | informe-revision-1.md |

## Commits a revisar (git log 859499e9ca48bd79e9f23dde616ff18f910b2748..HEAD)

````
d221a9d docs(TASK-091): autorrevision ronda 2
f0affb1 fix(TASK-091): correcciones de la ronda 1 (MEN-1 mensaje y docs de review, MEN-2 test del guardian)
9ab24f9 chore(TASK-091): veredicto ronda 1 (cambios-solicitados)
0aeee2f chore(TASK-091): coste revision +4728908 tokens (1 agente)
276c593 chore(TASK-091): informe de revision ronda 1
87ba4bd chore(TASK-091): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 859499e9ca48bd79e9f23dde616ff18f910b2748..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 3ef8582..67e6ecf 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -6,8 +6,8 @@ Verificacion selectiva por impacto (TASK-091). Clave nueva opcional
 `comando_verificacion_selectiva` (con `timeout_verificacion_selectiva`, 600 s
 por defecto): una verificacion rapida que corre solo lo afectado por los
 cambios y recibe la rama base de la tarea en la variable `RAMA_BASE`. La usan el
-hook `Stop` (en vez de la completa) y `taskctl review`, que la corre antes de
-escribir nada: en rojo, o si deja el arbol sucio, aborta sin abrir ronda y la
+hook `Stop` (en vez de la completa) y `taskctl review`, que la corre sobre la
+rama ya actualizada con la base y antes de escribir la ronda: en rojo, o si deja el arbol sucio, aborta sin abrir ronda y la
 tarea sigue en curso; en verde, la peticion lleva la seccion «Verificacion de
 esta ronda» con el tipo, el comando, el resultado y su salida, y omite la de
 cobertura (el informe podria ser parcial). `comando_verificacion` sigue siendo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 45edcf9..00eefd2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -735,8 +735,9 @@ timeout_verificacion_selectiva: 600                                 # opcional (
   propio memo (`.git/freno-verificacion-selectiva.json`, con la base y su commit
   en la huella). El guardián solo lee el memo de la completa: un verde de la
   selectiva nunca deja pasar un merge, aunque los dos comandos sean iguales.
-- **`taskctl review`**: la corre antes de escribir nada. En rojo, o si deja el
-  árbol sucio, aborta: no abre ronda y la tarea sigue en curso. En verde, la
+- **`taskctl review`**: la corre sobre la rama ya actualizada con la base y
+  antes de escribir la ronda. En rojo, o si deja el árbol sucio, aborta: no abre
+  ronda y la tarea sigue en curso (el merge de la base queda hecho). En verde, la
   petición lleva la sección «Verificación de esta ronda» (tipo, comando,
   resultado y final de la salida) y omite la de cobertura, porque el informe
   podría ser parcial.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index e839955..8950b5c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -77,8 +77,9 @@ El clasificador falla cerrado: ante la duda, corre todo. Como minimo:
 - **Fin de turno (`Stop`)**: con tarea en curso en la rama, corre la
   selectiva; en rojo devuelve el turno con su salida. Guarda el resultado
   aparte del de la completa: un verde de la selectiva nunca abre un merge.
-- **`taskctl review`**: corre la selectiva antes de escribir nada. En rojo
-  aborta: no abre ronda y la tarea sigue en curso. En verde, la peticion de
+- **`taskctl review`**: corre la selectiva sobre la rama ya actualizada con la
+  base, antes de escribir la ronda. En rojo aborta: no abre ronda y la tarea
+  sigue en curso (la base ya queda integrada en la rama). En verde, la peticion de
   revision lleva una seccion con el tipo (selectiva), el comando, el
   resultado y su salida.
 - **`taskctl finish`**: corre la completa; en rojo no integra y dice como
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index aeb29f7..87dcb0b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -641,8 +641,10 @@ export async function runReviewCommand(
   const commits = logOneline(desde, 'HEAD', deps.repoCwd);
   const diff = paraRevision.diff;
   // TASK-091: con `comando_verificacion_selectiva`, la ronda la corre (con la
-  // base en RAMA_BASE) ANTES de escribir nada: un rojo aborta con la tarea en
-  // curso y sin ronda a medias (decision de Carlos). Sin la clave, nada.
+  // base en RAMA_BASE) sobre la rama ya actualizada con la base y ANTES de
+  // escribir la ronda: un rojo aborta con la tarea en curso y sin ronda a
+  // medias (decision de Carlos); el merge de la base queda hecho, como cuando
+  // review aborta por otra causa. Sin la clave, nada.
   const selectiva = verificacionSelectivaDeRonda(id, configRama, baseBranch, deps);
   // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
   // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
@@ -905,7 +907,8 @@ function verificacionSelectivaDeRonda(
   if (v.resultado.estado !== 'verde') {
     throw new ReviewCommandError(
       `[ERROR] ${id}: la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE) no esta en ` +
-        'verde, asi que no se abre ronda de revision: la tarea sigue en curso y no se ha escrito nada.\n' +
+        'verde, asi que no se abre ronda de revision: la tarea sigue en curso y no se ha escrito peticion ni ' +
+        'informe (la base ya se ha integrado en la rama, como en cualquier review; reintentar no la repite).\n' +
         `${formatearVerificacionRoja(v.resultado)}\n` +
         (v.deMemo
           ? 'Es el resultado guardado: el arbol no ha cambiado desde la ultima ejecucion. Cambia algo o ejecuta el comando a mano.\n'
@@ -917,7 +920,7 @@ function verificacionSelectivaDeRonda(
     throw new ReviewCommandError(
       `[ERROR] ${id}: la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
         `("${comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en .gitignore, ` +
-        'o descartalos, y reintenta. No se ha abierto ronda.'
+        'o descartalos, y reintenta. No se ha abierto ronda (la base ya se ha integrado en la rama).'
     );
   }
   return v;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
index 833c903..f0eb71f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
@@ -232,6 +232,9 @@ test('guardian (TASK-091): un verde de la selectiva no abre la puerta aunque los
       async (raiz) => {
         assert.equal((await stop(raiz)).codigo, 0);
         assert.equal(v.ejecuciones('completa'), 1);
+        // Por si sola, sin contar con la huella: la selectiva no escribe el memo que lee el guardian.
+        assert.ok(!existsSync(path.join(raiz, '.git', 'freno-verificacion.json')), 'la selectiva no toca el memo de la completa');
+        assert.ok(existsSync(path.join(raiz, '.git', 'freno-verificacion-selectiva.json')));
         assert.equal(decidirPreToolUse({ cwd: raiz, tool_input: { command: merge } }).codigo, 2);
       }
     );
@@ -314,6 +317,7 @@ test('review (TASK-091): selectiva en rojo aborta sin ronda; la tarea sigue en c
           assert.ok(e instanceof ReviewCommandError);
           assert.match(e.message, /verificacion selectiva .* no esta en verde, asi que no se abre ronda/);
           assert.match(e.message, /la tarea sigue en curso/);
+          assert.match(e.message, /la base ya se ha integrado en la rama/);
           assert.match(e.message, /selectiva: ERROR, 2 tests fallan/);
           assert.match(e.message, /con la variable de entorno RAMA_BASE=develop/);
           return true;
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 859499e9ca48bd79e9f23dde616ff18f910b2748..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-091/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-091/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-091/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-091/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-091/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-091/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-091/revision/informe-revision-1.md                                                  |   59 ++++
 tareas/03-en-revision/TASK-091/revision/peticion-revision-1.md                                                 | 1517 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-091/tarea.md                                                       |   10 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                       |   11 +-
 10 files changed, 1590 insertions(+), 7 deletions(-)
````
