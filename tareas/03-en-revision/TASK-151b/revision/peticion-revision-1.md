# Peticion de revision — TASK-151b (ronda 1)

- Tarea: TASK-151b — commands, hooks y cli (parte b de TASK-151)
- Rama revisada: fix/task-151-regla-4d-disfraz-en-tests
- Rama base: develop
- Commit revisado (HEAD): e6a09c1411fe4da225c614227893187ec3bb2ef4
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-151b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-151b/tarea.md
- tareas/03-en-revision/TASK-151b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/estado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-correcciones.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-basico.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts

## Commits a revisar (git log develop..HEAD)

````
e6a09c1 chore(TASK-151b): autorrevision
d5d4029 fix(TASK-151b): tests de commands, hooks y cli que cazan su mutante
65dfe58 chore(TASK-151b): tarea en curso
9650012 merge(TASK-151b): develop en fix/task-151-regla-4d-disfraz-en-tests para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 4a08965..dc89a03 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -176,6 +176,7 @@ async function runApprove(
   const ubicacionInicial = initial ? await resolverPlanFinal(path.dirname(initial.filePath)) : null;
   assertTransitionAllowed('approve', initial ? initial.task : null, {
     planFinalExiste: planFinalExisteEn(ubicacionInicial),
+    idPedido: id,
   });
   assertPlanNoAmbiguo(id, ubicacionInicial!);
   progreso.fase(initial!.task.id, 'approve', PASOS_APPROVE);
@@ -197,6 +198,7 @@ async function runApprove(
   const ubicacion = existing ? await resolverPlanFinal(path.dirname(existing.filePath)) : null;
   assertTransitionAllowed('approve', existing ? existing.task : null, {
     planFinalExiste: planFinalExisteEn(ubicacion),
+    idPedido: id,
   });
   assertPlanNoAmbiguo(id, ubicacion!);
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
index c7140cc..1fdc06d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
@@ -152,6 +152,7 @@ export async function runCodexReviewCommand(
     revisionDir === null ? false : await ultimaRondaAprobada(revisionDir, INFORME_REVISION_RE);
   assertTransitionAllowed('codex-review', existing ? existing.task : null, {
     revisionPrimariaAprobada,
+    idPedido: id,
   });
   const { task, filePath } = existing!;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 6d426bc..54035bb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -814,7 +814,7 @@ async function runFinish(
   const existing = await readTareaFile(tareasRoot, id);
   const ctx =
     existing === null ? {} : await buildTransitionContext(path.dirname(existing.filePath));
-  assertTransitionAllowed('finish', existing ? existing.task : null, ctx);
+  assertTransitionAllowed('finish', existing ? existing.task : null, { ...ctx, idPedido: id });
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
 
   // TASK-085: red del volcado de review. Si alli no se pudo, lo que quede
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 32c3e55..b6d45ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -466,7 +466,7 @@ async function runPlan(
   // disparar un TaskFolderConflictError falso comparando la carpeta
   // vieja con la carpeta real de la rama base).
   const initial = await readTareaFile(tareasRoot, id);
-  assertTransitionAllowed('plan', initial ? initial.task : null);
+  assertTransitionAllowed('plan', initial ? initial.task : null, { idPedido: id });
   progreso.fase(initial!.task.id, 'plan', PASOS_PLAN);
   progreso.paso('guardas');
 
@@ -488,7 +488,7 @@ async function runPlan(
   // mientras tanto) o aceptar como re-planificacion legitima un caso
   // que en la rama vieja parecia otra cosa.
   const existing = await readTareaFile(tareasRoot, id);
-  assertTransitionAllowed('plan', existing ? existing.task : null);
+  assertTransitionAllowed('plan', existing ? existing.task : null, { idPedido: id });
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
 
   // asignado_a se resuelve contra la lectura FRESCA (la de justo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 7af2ac5..509c872 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -732,7 +732,7 @@ async function runReview(
     previa = await leerRondaPrevia(path.join(path.dirname(initial.filePath), REVISION_DIRNAME));
     ctx.veredictoRondaAnterior = previa.veredicto;
   }
-  assertTransitionAllowed('review', initial ? initial.task : null, ctx);
+  assertTransitionAllowed('review', initial ? initial.task : null, { ...ctx, idPedido: id });
   // TASK-095: el tope de rondas lo aplica tambien review, no solo siguiente:
   // llamar a review sin pasar por siguiente abria rondas sin limite (una tarea
   // llego a 14). Pasado el tope, otra ronda solo con --ronda-extra, que la
@@ -833,7 +833,7 @@ async function runReview(
   // decide si se muta algo y con que contenido (regla de la doble
   // lectura — el update pudo traer de la base un tarea.md mas nuevo).
   const existing = await readTareaFile(tareasRoot, id);
-  assertTransitionAllowed('review', existing ? existing.task : null, ctx);
+  assertTransitionAllowed('review', existing ? existing.task : null, { ...ctx, idPedido: id });
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
 
   const commitRevisado = headCommit(deps.repoCwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index 773845b..1b0bd74 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -141,7 +141,7 @@ async function runStart(
   // (tarea no encontrada) o si el estado/campos actuales no permiten
   // "start" todavia — en ambos casos no se llega a tocar Git ni mover
   // nada.
-  assertTransitionAllowed('start', existing ? existing.task : null);
+  assertTransitionAllowed('start', existing ? existing.task : null, { idPedido: id });
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
   progreso.fase(task.id, 'start', PASOS_START);
   progreso.paso('guardas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index 239a184..f6264ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -125,7 +125,7 @@ export async function runVeredictoCommand(
   }
 
   const existing = await readTareaFile(tareasRoot, id);
-  assertTransitionAllowed('veredicto', existing === null ? null : existing.task);
+  assertTransitionAllowed('veredicto', existing === null ? null : existing.task, { idPedido: id });
   const { task, filePath } = existing as NonNullable<typeof existing>;
 
   const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
index 095f80c..8c33a37 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
@@ -167,7 +167,7 @@ export async function runVerificarMenoresCommand(
   }
 
   const existing = await readTareaFile(tareasRoot, id);
-  assertTransitionAllowed('verificar-menores', existing === null ? null : existing.task);
+  assertTransitionAllowed('verificar-menores', existing === null ? null : existing.task, { idPedido: id });
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
   const cwd = deps.repoCwd;
   const error = (texto: string): VerificarMenoresCommandError =>
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
index 8dd2aaf..9f5739b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
@@ -33,6 +33,11 @@ export interface TransitionContext {
    * ultima ronda. Lo calcula quien llama leyendo revision/.
    */
   veredictoRondaAnterior?: 'sin-linea' | 'pendiente' | 'cambios-solicitados' | 'aprobada' | 'desconocido';
+  /**
+   * TASK-151b: el ID que se pidio, para nombrarlo cuando la tarea no existe
+   * (antes el mensaje decia «(desconocida) no existe todavia»).
+   */
+  idPedido?: string;
 }
 
 export class StateMachineError extends Error {
@@ -89,7 +94,7 @@ export function assertTransitionAllowed(
 
   if (task === null) {
     throw err(
-      '(desconocida)',
+      ctx.idPedido ?? '(desconocida)',
       command,
       'no-existe',
       null,
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-151b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151b/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151b/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-151b/tarea.md                                                       | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                     |  2 ++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js                                |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                      |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                        |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      |  4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                                       |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js                                   |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-menores.js                           |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js                                   |  2 +-
 16 files changed, 20 insertions(+), 11 deletions(-)
````

## Tests del diff (9 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/cli/estado.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-correcciones.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-basico.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/cli/estado.test.ts                   | 18 +++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts             | 12 ++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-correcciones.test.ts | 11 ++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts       | 25 +++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts                | 10 +++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts  | 40 +++++++++++++++++++++++++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/start-basico.test.ts        | 11 ++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/guardia-documentacion.test.ts  |  6 ++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/salida-temprana.test.ts        | 22 ++++++++++++++++++++--
 9 files changed, 134 insertions(+), 21 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 275.6 s
- Commit verificado: e6a09c1411fe4da225c614227893187ec3bb2ef4
- Huella: f79413e4f6438d262b0ef488532af68f93068de7
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 128539 bytes en total):

````
  feature/task-700-prueba-finish  -->  develop
  --------------------------------------------------

  Commits que se van a integrar:
    50e4997 chore(TASK-951): cierre solo documentacion
    65136d7 cambio en docs/guia.md
    cac25d9 feat(TASK-951): trabajo revisado

  Ficheros afectados:
     docs/guia.md                                       |  1 +
     .../TASK-951/revision/informe-revision-1.md        |  3 +++
     tareas/03-en-revision/TASK-951/tarea.md            | 30 ++++++++++++++++++++++
     trabajo-TASK-951.txt                               |  1 +
     4 files changed, 35 insertions(+)

[2026-11-23 21:18:29] [OK   ] Merge completado: feature/task-700-prueba-finish -> develop

====================================================
  [OK]  OPERACION : merge-feature -> develop (feature/task-700-prueba-finish)
       RESULTADO : COMPLETADO
       DURACION  : 2s
       DETALLE   : 3 commit(s) integrados en develop
====================================================

✔ guardian TASK-101: exencion de documentacion, release, config del destino y bloqueos de punta a punta (80126.9093ms)
✔ comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consultar (3.1056ms)
✔ guardian TASK-105 y TASK-108: seleccion parcial, nivel 2 y mensajes de bloqueo (23545.5613ms)
✔ salida temprana (TASK-114, criterio 1): sin comando_heldout el guardian de held-out deja pasar en la rama de la tarea (14309.3447ms)
✔ salida temprana (TASK-114): con comando_heldout sigue bloqueando, y una config ilegible tambien protege (9307.7883ms)
✔ salida temprana (TASK-114, criterio 2): un comando sin git ni script de cierre no es candidato a merge (3960.5435ms)
✔ salida temprana (TASK-114, MEN-1): el prefiltro del punto de entrada no carga el guardian sin git ni script (1.0836ms)
ℹ tests 831
ℹ suites 0
ℹ pass 829
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 261010.0019
[verificar-impacto] node --test termino con 0 en 261.3 s.
````
