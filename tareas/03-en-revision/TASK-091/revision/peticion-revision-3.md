# Peticion de revision — TASK-091 (ronda 3)

- Tarea: TASK-091 — Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar
- Rama revisada: feature/task-091-verificacion-selectiva-por-impacto-en-la
- Rama base: develop
- Commit revisado (HEAD): 4bac229cc013fe4b6fd65c3de57340c9384b65f0
- Fecha: 2026-11-09
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-091 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde d221a9d11e52fc4008fffad80bcbb1883cdd8331 (el commit revisado en la ronda anterior)
- Alcance: completa (motivo: la ronda anterior tiene un IMPORTANTE (IMP-1, abierto))

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-3.md), sin borrar la
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

## Hallazgos de la ronda 2 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido (solo para la ronda 1; ver IMP-1) | src/commands/review.ts:909-911 y 922-923; CHANGELOG.md; README.md | informe-revision-2.md |
| IMP-1 | IMPORTANTE | abierto | src/commands/review.ts:909-911 (mensaje), 643-647 (comentario); verificacion-selectiva.md, CHANGELOG.md y README.md («sobre la rama ya actualizada con la base») | informe-revision-2.md |

## Commits a revisar (git log d221a9d11e52fc4008fffad80bcbb1883cdd8331..HEAD)

````
4bac229 docs(TASK-091): autorrevision ronda 3
0546cb9 fix(TASK-091): IMP-1 de la ronda 2, el mensaje de review dice si la base quedo integrada segun la ronda
6485da7 chore(TASK-091): veredicto ronda 2 (cambios-solicitados)
f904fbd chore(TASK-091): coste revision +2207954 tokens (1 agente)
c319451 chore(TASK-091): informe de revision ronda 2
d9d8abd chore(TASK-091): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff d221a9d11e52fc4008fffad80bcbb1883cdd8331..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 67e6ecf..26c0bdd 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -6,8 +6,8 @@ Verificacion selectiva por impacto (TASK-091). Clave nueva opcional
 `comando_verificacion_selectiva` (con `timeout_verificacion_selectiva`, 600 s
 por defecto): una verificacion rapida que corre solo lo afectado por los
 cambios y recibe la rama base de la tarea en la variable `RAMA_BASE`. La usan el
-hook `Stop` (en vez de la completa) y `taskctl review`, que la corre sobre la
-rama ya actualizada con la base y antes de escribir la ronda: en rojo, o si deja el arbol sucio, aborta sin abrir ronda y la
+hook `Stop` (en vez de la completa) y `taskctl review`, que la corre antes de
+escribir la ronda (en la primera, despues de integrar la base): en rojo, o si deja el arbol sucio, aborta sin abrir ronda y la
 tarea sigue en curso; en verde, la peticion lleva la seccion «Verificacion de
 esta ronda» con el tipo, el comando, el resultado y su salida, y omite la de
 cobertura (el informe podria ser parcial). `comando_verificacion` sigue siendo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 00eefd2..1349a8c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -735,9 +735,10 @@ timeout_verificacion_selectiva: 600                                 # opcional (
   propio memo (`.git/freno-verificacion-selectiva.json`, con la base y su commit
   en la huella). El guardián solo lee el memo de la completa: un verde de la
   selectiva nunca deja pasar un merge, aunque los dos comandos sean iguales.
-- **`taskctl review`**: la corre sobre la rama ya actualizada con la base y
-  antes de escribir la ronda. En rojo, o si deja el árbol sucio, aborta: no abre
-  ronda y la tarea sigue en curso (el merge de la base queda hecho). En verde, la
+- **`taskctl review`**: la corre antes de escribir la ronda (en la primera,
+  después de integrar la base en la rama; las incrementales no la integran). En
+  rojo, o si deja el árbol sucio, aborta: no abre ronda y la tarea sigue en
+  curso; el mensaje dice si la base quedó integrada. En verde, la
   petición lleva la sección «Verificación de esta ronda» (tipo, comando,
   resultado y final de la salida) y omite la de cobertura, porque el informe
   podría ser parcial.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 8950b5c..8fa8fae 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -77,9 +77,10 @@ El clasificador falla cerrado: ante la duda, corre todo. Como minimo:
 - **Fin de turno (`Stop`)**: con tarea en curso en la rama, corre la
   selectiva; en rojo devuelve el turno con su salida. Guarda el resultado
   aparte del de la completa: un verde de la selectiva nunca abre un merge.
-- **`taskctl review`**: corre la selectiva sobre la rama ya actualizada con la
-  base, antes de escribir la ronda. En rojo aborta: no abre ronda y la tarea
-  sigue en curso (la base ya queda integrada en la rama). En verde, la peticion de
+- **`taskctl review`**: corre la selectiva antes de escribir la ronda (en la
+  primera ronda, despues de integrar la base en la rama; las rondas
+  incrementales no la integran). En rojo aborta: no abre ronda y la tarea sigue
+  en curso; el mensaje dice si la base quedo integrada. En verde, la peticion de
   revision lleva una seccion con el tipo (selectiva), el comando, el
   resultado y su salida.
 - **`taskctl finish`**: corre la completa; en rojo no integra y dice como
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 87dcb0b..54a59d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -641,11 +641,11 @@ export async function runReviewCommand(
   const commits = logOneline(desde, 'HEAD', deps.repoCwd);
   const diff = paraRevision.diff;
   // TASK-091: con `comando_verificacion_selectiva`, la ronda la corre (con la
-  // base en RAMA_BASE) sobre la rama ya actualizada con la base y ANTES de
-  // escribir la ronda: un rojo aborta con la tarea en curso y sin ronda a
-  // medias (decision de Carlos); el merge de la base queda hecho, como cuando
-  // review aborta por otra causa. Sin la clave, nada.
-  const selectiva = verificacionSelectivaDeRonda(id, configRama, baseBranch, deps);
+  // base en RAMA_BASE) ANTES de escribir la ronda: un rojo aborta con la tarea
+  // en curso y sin ronda a medias (decision de Carlos). En la primera ronda el
+  // update de Git-Flow ya integro la base (y ese merge queda hecho); en una
+  // incremental la rama no se actualiza (TASK-040). Sin la clave, nada.
+  const selectiva = verificacionSelectivaDeRonda(id, configRama, baseBranch, incremental, deps);
   // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
   // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
   // nadie arreglo sigue ahi). Una vez por ronda y antes de escribir nada;
@@ -894,6 +894,7 @@ function verificacionSelectivaDeRonda(
   id: string,
   config: ReturnType<typeof resolverConfig>,
   base: string,
+  incremental: boolean,
   deps: ReviewCommandDeps
 ): VerificacionConMemo | null {
   const comando = config.comando_verificacion_selectiva;
@@ -904,11 +905,15 @@ function verificacionSelectivaDeRonda(
     { tipo: 'selectiva', comando, timeoutS: config.timeout_verificacion_selectiva, base },
     deps.env === undefined ? {} : { env: deps.env }
   );
+  // Lo que ya paso con la base antes de verificar: solo la primera ronda la integra.
+  const estadoBase = incremental
+    ? `en una ronda incremental la rama no se actualiza con "${base}"`
+    : `"${base}" ya se ha integrado en la rama, como en cualquier review; reintentar no repite el merge`;
   if (v.resultado.estado !== 'verde') {
     throw new ReviewCommandError(
       `[ERROR] ${id}: la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE) no esta en ` +
         'verde, asi que no se abre ronda de revision: la tarea sigue en curso y no se ha escrito peticion ni ' +
-        'informe (la base ya se ha integrado en la rama, como en cualquier review; reintentar no la repite).\n' +
+        `informe (${estadoBase}).\n` +
         `${formatearVerificacionRoja(v.resultado)}\n` +
         (v.deMemo
           ? 'Es el resultado guardado: el arbol no ha cambiado desde la ultima ejecucion. Cambia algo o ejecuta el comando a mano.\n'
@@ -920,7 +925,7 @@ function verificacionSelectivaDeRonda(
     throw new ReviewCommandError(
       `[ERROR] ${id}: la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
         `("${comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en .gitignore, ` +
-        'o descartalos, y reintenta. No se ha abierto ronda (la base ya se ha integrado en la rama).'
+        `o descartalos, y reintenta. No se ha abierto ronda (${estadoBase}).`
     );
   }
   return v;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
index f0eb71f..7bd0f82 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
@@ -15,6 +15,7 @@ import { CONFIG_DEFAULTS, CLAVES_CONFIG, parsearConfig } from '../../src/core/co
 import { comprobarVerificacionSelectiva } from '../../src/commands/doctor.js';
 import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
 import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { runVeredictoCommand } from '../../src/commands/veredicto.js';
 import { decidirStop } from '../../src/hooks/freno-stop.js';
 import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
 import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
@@ -317,7 +318,7 @@ test('review (TASK-091): selectiva en rojo aborta sin ronda; la tarea sigue en c
           assert.ok(e instanceof ReviewCommandError);
           assert.match(e.message, /verificacion selectiva .* no esta en verde, asi que no se abre ronda/);
           assert.match(e.message, /la tarea sigue en curso/);
-          assert.match(e.message, /la base ya se ha integrado en la rama/);
+          assert.match(e.message, /"develop" ya se ha integrado en la rama/);
           assert.match(e.message, /selectiva: ERROR, 2 tests fallan/);
           assert.match(e.message, /con la variable de entorno RAMA_BASE=develop/);
           return true;
@@ -332,6 +333,46 @@ test('review (TASK-091): selectiva en rojo aborta sin ronda; la tarea sigue en c
   });
 });
 
+test('review (TASK-091): en una ronda incremental, el rojo no dice que la base se haya integrado (no se integra)', async () => {
+  await conScripts(async (v) => {
+    await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
+      const r1 = await review(repoRoot, tareasRoot);
+      const informe = (r1.informes[0] as { informePath: string }).informePath;
+      await writeFile(
+        informe,
+        '# Informe de revision — TASK-600 (ronda 1)\n\n- Commit revisado: x\n- Veredicto: PENDIENTE\n\n' +
+          '## Hallazgos\n\n| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n| IMP-1 | IMPORTANTE | abierto | trabajo.txt:1 |\n',
+        'utf8'
+      );
+      commitReview(repoRoot, 'informe ronda 1');
+      await runVeredictoCommand(tareasRoot, ['TASK-600', 'cambios-solicitados'], { repoCwd: repoRoot });
+      // develop avanza; la correccion llega a la rama; la selectiva falla en la ronda 2.
+      const rama = git(['branch', '--show-current'], repoRoot).trim();
+      git(['checkout', '-q', 'develop'], repoRoot);
+      await writeFile(path.join(repoRoot, 'otra-tarea.txt'), 'ajeno\n', 'utf8');
+      commitReview(repoRoot, 'otra tarea en develop');
+      git(['checkout', '-q', rama], repoRoot);
+      await writeFile(path.join(repoRoot, 'trabajo.txt'), 'corregido\n', 'utf8');
+      commitReview(repoRoot, 'correccion');
+      await v.desenlace('selectiva', 'ko');
+      const headAntes = git(['rev-parse', 'HEAD'], repoRoot).trim();
+      await assert.rejects(
+        () => review(repoRoot, tareasRoot),
+        (e: unknown) => {
+          assert.ok(e instanceof ReviewCommandError);
+          assert.match(e.message, /no se abre ronda de revision/);
+          assert.match(e.message, /en una ronda incremental la rama no se actualiza con "develop"/);
+          assert.doesNotMatch(e.message, /ya se ha integrado/);
+          return true;
+        }
+      );
+      assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), headAntes, 'la ronda incremental no integra develop');
+      assert.ok(!existsSync(path.join(repoRoot, 'otra-tarea.txt')));
+      assert.ok(!existsSync(path.join(path.dirname(informe), 'peticion-revision-2.md')));
+    });
+  });
+});
+
 test('review (TASK-091): una selectiva que ensucia el arbol aborta sin ronda', async () => {
   await conScripts(async (v) => {
     await v.desenlace('selectiva', 'ensucia');
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff d221a9d11e52fc4008fffad80bcbb1883cdd8331..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-091/revision/informe-revision-2.md            |  41 +++++++++++++++++++++++++
 tareas/03-en-revision/TASK-091/revision/peticion-revision-2.md           | 195 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-091/tarea.md                                  |   5 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js |  20 ++++++++-----
 4 files changed, 252 insertions(+), 9 deletions(-)
````
