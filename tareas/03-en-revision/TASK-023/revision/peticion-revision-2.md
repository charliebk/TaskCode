# Peticion de revision — TASK-023 (ronda 2)

- Tarea: TASK-023 — Métricas de coste en tokens por fase
- Rama revisada: feature/task-023-metricas-de-coste-en-tokens-por-fase
- Rama base: develop
- Commit revisado (HEAD): 49ea7adc319e22cc74c3fcd1fccaa9762d7384ae
- Fecha: 2026-10-06
- Agente a lanzar: typescript-reviewer (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-023 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 4d3c626901128091c6ae0f9989fbbaa7ca3c5174 (el commit revisado en la ronda anterior)

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

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/commands/finish.ts:290-296 | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/core/task.ts:77 | informe-revision-1.md |
| MEN-2 | MENOR | abierto | skills/review/SKILL.md (paso 4) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | docs/METRICAS.md §11 (cabecera de la tabla) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | docs/METRICAS.md §11.1 | informe-revision-1.md |

## Commits a revisar (git log 4d3c626901128091c6ae0f9989fbbaa7ca3c5174..HEAD)

````
49ea7ad chore(TASK-023): coste revision +5375382 tokens (1 agente)
3e0022d fix(TASK-023): correcciones de la revision ronda 1 (IMP-1, MEN-1 a MEN-4)
d94a6ab chore(TASK-023): veredicto ronda 1 (cambios-solicitados)
f2e6cc9 docs(TASK-023): informe de revision ronda 1
b8f2381 chore(TASK-023): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 4d3c626901128091c6ae0f9989fbbaa7ca3c5174..HEAD)

````diff
diff --git a/docs/METRICAS.md b/docs/METRICAS.md
index bc4a3d8..e66558d 100644
--- a/docs/METRICAS.md
+++ b/docs/METRICAS.md
@@ -424,8 +424,9 @@ terminado estas 12. Ese es el hito real de usabilidad diaria, y
 `usage` de cada llamada a la API. Para cada uno de los 190 subagentes
 guardados se suman, por mensaje único, entrada + escritura de caché + lectura
 de caché + salida: **tokens procesados**, no coste en euros. La lectura de
-caché domina las cifras y es la parte barata. La tarea se toma del TASK-NNN de
-la descripción o el prompt del agente, y la fase de la descripción (los
+caché domina las cifras y es la parte barata. La tarea es el único TASK-NNN que aparece en la descripción del agente o en
+los primeros 3000 caracteres de su prompt (si aparecen varios, el agente no
+se atribuye), y la fase de la descripción (los
 `brainstorm-*`, unificador y plan son diseño; las implementaciones y las
 correcciones son implementación; las revisiones, rondas y smokes son
 revisión).
@@ -444,7 +445,16 @@ TASK-023 es la primera tarea con esos campos rellenos con
 `taskctl registrar-coste`.
 
 Cifras en millones de tokens procesados por los subagentes atribuibles a una
-sola tarea. Las tareas sin complejidad conocida quedan fuera.
+sola tarea. Quedan fuera las tareas sin informes de revisión (no salen en
+`taskctl metricas --heuristica`). Las de complejidad declarada «—» sí están en
+la tabla, pero no cuentan en las medias por complejidad declarada.
+
+**Las filas anteriores a TASK-033 son menos fiables.** Sus prompts
+mencionaban a menudo otras tareas como ejemplo, y la atribución cambia
+bastante según cuánto prompt se mire: con el prompt entero, 9 de esas filas
+cambian (TASK-016 pasa de 43,6 a 35,6). Las filas de TASK-033 en adelante
+salen iguales con cualquiera de las dos reglas, y son las únicas en las que
+se apoyan las conclusiones de 11.1 y 11.2.
 
 | tarea | declarada | heuristica | rondas | diseno | implementacion | revision | total |
 |---|---|---|---|---:|---:|---:|---:|
@@ -500,9 +510,11 @@ sola tarea. Las tareas sin complejidad conocida quedan fuera.
   complejidad. El brainstorm, que es la parte que la §16.3 acota por
   complejidad, queda entre el 0 % y el 12 %. Acotar los roles de brainstorm
   ahorra poco; lo caro es cada ronda de revisión.
-- **Lo que mejor predice el coste son las rondas.** La correlación de
-  Spearman con el total es de 0,69 para las rondas, 0,54 para la complejidad
-  declarada y 0,52 para los puntos de la heurística (n = 37 a 41). En el
+- **Lo que más pesa en el coste son las rondas.** No sorprende, porque cada
+  ronda es otra pasada completa de revisores, pero sí da la escala: una ronda
+  más cuesta más que todo el brainstorm. La correlación de Spearman con el
+  total es de 0,69 para las rondas, 0,54 para la complejidad declarada, 0,52
+  para los puntos de la heurística y 0,57 para su nivel (n = 37 a 41). En el
   periodo homogéneo (TASK-033 en adelante, mismas herramientas y mismos
   revisores), la media es de 2,6 M con 1 ronda (n = 18), 6,5 M con 2 (n = 6)
   y 8,5 M con 3 (n = 3).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 4bb17fb..e6888d2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -35,8 +35,8 @@ punto, no un formalismo.
    rellenar no cuenta como revisado,
    y commitealo **solo, en un commit que no toque nada mas**: en modo
    automatico, `finish` no sigue solo si un informe va mezclado con codigo.
-4. Registra el coste de la revision (`task-workflow/coste.md`): suma el total de
-   tokens: con el id que devolvio la herramienta Agent de cada revisor,
+4. Registra el coste de la revision (`task-workflow/coste.md`) con el id que
+   devolvio la herramienta Agent de cada revisor:
    `taskctl registrar-coste TASK-NNN --fase revision --agente <id>
    [--agente <id2>...]` (una vez por ronda; suma). La cifra que muestra Claude
    Code al terminar un agente NO es su coste (es su contexto final). Tu parte,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index f68c305..8bbee32 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -291,8 +291,9 @@ export async function runFinishCommand(
   for (const [fase] of sinCoste) {
     deps.onAviso?.(
       `${id}: sin coste de ${fase} registrado (tokens_${fase}). Registralo con ` +
-        `taskctl registrar-coste ${id} --fase ${fase} --tokens N (suma el uso de cada subagente ` +
-        'de la fase mas una estimacion de la parte propia); la tarea se cierra igualmente.'
+        `taskctl registrar-coste ${id} --fase ${fase} --agente <id> [--agente <id2>...], con el id ` +
+        'de cada subagente de la fase (suma el uso de su transcripcion; la cifra que se ve al terminar ' +
+        'un agente es su contexto final, no su coste). La tarea se cierra igualmente.'
     );
   }
   const tipo = initial.task.tipo;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
index 44927d3..8905217 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
@@ -74,9 +74,9 @@ export interface Task {
   ultimo_commit_revisado: string | null;
   revision_codex: boolean;
   /**
-   * TASK-023: coste en tokens de cada fase (suma del uso que Claude Code
-   * devuelve al terminar cada subagente, mas la estimacion de la parte del
-   * orquestador). null = no registrado; en el fichero, ausente tambien es
+   * TASK-023: coste en tokens de cada fase: tokens procesados por sus
+   * subagentes, sumados de sus transcripciones (`registrar-coste --agente`),
+   * mas lo que se registre a mano con `--tokens` (la parte del orquestador). null = no registrado; en el fichero, ausente tambien es
    * null, asi las tareas anteriores siguen validando. Los suma
    * `taskctl registrar-coste`.
    */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
index f049a44..2626366 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/validacion-puertas.test.ts
@@ -262,7 +262,9 @@ test('finish (TASK-023): avisa del coste de diseno y revision sin registrar, ANT
     });
     assert.equal(avisos.length, 2, 'uno por diseno y otro por revision; implementacion no avisa');
     assert.ok(avisos.every((a) => !a.integrada), 'los avisos llegan antes de mergear');
-    assert.match(avisos[0]?.texto ?? '', /sin coste de diseno registrado.*taskctl registrar-coste TASK-430 --fase diseno --tokens N/);
+    assert.match(avisos[0]?.texto ?? '', /sin coste de diseno registrado.*taskctl registrar-coste TASK-430 --fase diseno --agente <id>/);
+    // IMP-1 de la revision: el aviso no puede proponer la cifra de la notificacion.
+    assert.doesNotMatch(avisos[0]?.texto ?? '', /--tokens N/);
     assert.match(avisos[1]?.texto ?? '', /sin coste de revision registrado.*--fase revision/);
     assert.ok(avisos.every((a) => !/implementacion/.test(a.texto)));
     assert.match(r.filePath, /04-terminadas/, 'no bloquea');
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 4d3c626901128091c6ae0f9989fbbaa7ca3c5174..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-023/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-023/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-023/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-023/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-023/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-023/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-023/revision/informe-revision-1.md                                                  |  113 +++
 tareas/03-en-revision/TASK-023/revision/peticion-revision-1.md                                                 | 3268 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-023/tarea.md                                                       |    5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                       |    5 +-
 10 files changed, 3387 insertions(+), 4 deletions(-)
````
