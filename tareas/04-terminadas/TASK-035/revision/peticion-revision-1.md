# Peticion de revision — TASK-035 (ronda 1)

- Tarea: TASK-035 — F1-T2 Politica de rondas y una sola suite por ronda en las skills
- Rama revisada: feature/task-035-f1-t2-politica-de-rondas-y-una-sola-suit
- Rama base: develop
- Commit revisado (HEAD): 07aba35bdeabed109d8b7bbcf1b233cc50a9df98
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-035 (criterios de aceptacion y plan)

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
07aba35 docs(TASK-035): politica de rondas A3 y una sola suite por ronda en las skills
4ca7a3e chore(TASK-035): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index 6d533a0..e0c7a7f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -150,6 +150,12 @@ ejercita la vista.
    solo el servidor de desarrollo. Muchos errores de tipado solo salen ahi.
    Si no compila, ahi acaba la revision.
 4. **Correr la suite entera antes de tocar nada**, para tener la linea base.
+   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
+   pasada de la suite completa; no se repite. Los mutantes se comprueban con
+   el fichero o la clase de test concretos que cubren la linea mutada, no
+   con la suite entera. Con varios revisores en paralelo en la misma
+   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
+   compiten por la CPU y todas tardan mas.
 5. **Levantar la aplicacion y ejercitar la vista de verdad**, con el
    navegador, entrando y saliendo de la ruta y con datos que se parezcan a
    los reales en volumen.
@@ -333,10 +339,11 @@ Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
 forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
 llegar a esa conclusion.
 
-Dos rondas es lo normal, no una excepcion: la ronda 2 revisa las
-correcciones de la ronda 1, que es justo donde entran los fallos nuevos. En
-la ronda 2 se comprueba **cada hallazgo de la ronda anterior** ademas del
-codigo nuevo.
+Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la tarea: los MENOR que
+se corrijan no abren otra ronda. La ronda 2 solo se pide si se corrigio
+algun CRITICO o IMPORTANTE, y entonces revisa el delta de la correccion y
+comprueba **cada uno de esos hallazgos**: las correcciones son justo donde
+entran los fallos nuevos.
 
 ## La linea del veredicto
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
index 4a8760b..c96ea4e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -80,6 +80,12 @@ ejecutando:
 2. **Correr la suite entera uno mismo** y anotar el resultado real: cuantos
    tests, cuantos fallan, cuales. "Los tests pasan" sin haberlos corrido no
    vale, y `exit 0` no prueba que ocurriera nada — hay que comprobar el hecho.
+   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
+   pasada de la suite completa; no se repite. Los mutantes se comprueban con
+   el fichero o la clase de test concretos que cubren la linea mutada, no
+   con la suite entera. Con varios revisores en paralelo en la misma
+   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
+   compiten por la CPU y todas tardan mas.
 3. **Mutar**: romper a proposito la linea que el diff dice proteger y
    comprobar que algun test se pone rojo. Si sigue verde, no hay red de
    regresion, y eso ya es un hallazgo por si solo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index a40ea13..276d6e6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -99,6 +99,12 @@ ejecutando:
    siempre, **y otra vez tras cada cambio de rama dentro del mismo clon**.
 2. **Correr la suite entera uno mismo**, y anotar el resultado real (numero de
    tests, fallos, tiempo). "Los tests pasan" sin haberlos corrido no vale.
+   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
+   pasada de la suite completa; no se repite. Los mutantes se comprueban con
+   el fichero o la clase de test concretos que cubren la linea mutada, no
+   con la suite entera. Con varios revisores en paralelo en la misma
+   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
+   compiten por la CPU y todas tardan mas.
 3. **Mutar las protecciones**: romper a proposito la linea que el diff dice
    proteger (el `Commit()`, la comprobacion de `IsErased`, el
    `CultureInfo.InvariantCulture`, el factor de unidades) y comprobar que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
index e2630a4..05e6686 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
@@ -56,6 +56,12 @@ caso que lo demuestra**, no cuando parece que podria pasar.
 3. **Correr la suite entera antes de tocar nada**, para tener la linea base.
    Un test que ya estaba rojo antes del diff no es un hallazgo de esta
    tarea, pero si es un dato que va en el informe.
+   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
+   pasada de la suite completa; no se repite. Los mutantes se comprueban con
+   el fichero o la clase de test concretos que cubren la linea mutada, no
+   con la suite entera. Con varios revisores en paralelo en la misma
+   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
+   compiten por la CPU y todas tardan mas.
 4. **Construir el caso que rompe.** Un test nuevo que falla contra la rama,
    o una llamada real contra la aplicacion levantada. Lo que no se ha
    ejecutado no se afirma.
@@ -232,10 +238,11 @@ Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
 forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
 llegar a esa conclusion.
 
-Dos rondas es lo normal, no una excepcion: la ronda 2 revisa las
-correcciones de la ronda 1, que es justo donde entran los fallos nuevos. En
-la ronda 2 se comprueba **cada hallazgo de la ronda anterior** ademas del
-codigo nuevo.
+Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la tarea: los MENOR que
+se corrijan no abren otra ronda. La ronda 2 solo se pide si se corrigio
+algun CRITICO o IMPORTANTE, y entonces revisa el delta de la correccion y
+comprueba **cada uno de esos hallazgos**: las correcciones son justo donde
+entran los fallos nuevos.
 
 ## La linea del veredicto
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 6b20939..f6b3358 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -220,10 +220,6 @@ Los ocho comandos que hacen un commit automatico (`new`, `import`, `plan`,
 3. Incluyen las rutas sincronizadas en el mismo commit (`git commit -m <msg> -- <rutas de tarea> <rutas sincronizadas>`).
 4. Terminan la transicion.
 
-Sin esperar a commits manuales posteriores: los ficheros derivados entran en el
-mismo commit que la tarea, asi que `git show HEAD` muestra siempre el derivado
-sincronizado con el estado de la tarea.
-
 **Ejecucion del comando:**
 
 - Se lanza con el shell del sistema (`cmd.exe` en Windows, `/bin/sh` en
@@ -403,8 +399,13 @@ Un "sin hallazgos" explicito es una respuesta valida. Inventar hallazgos para
 tener algo que reportar, no.
 
 **Rondas.** Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
-`revision/`. Dos rondas es normal, no una excepcion: la ronda 2 revisa las
-correcciones de la ronda 1, que es justo donde se cuelan los fallos nuevos.
+`revision/`. **Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la
+tarea.** Los MENOR que se corrijan no abren ronda 2: basta la suite en verde,
+el commit de correccion y su nota en el `## Resultado`. La ronda 2 solo se
+pide si se corrigio algun CRITICO o IMPORTANTE, y entonces revisa el delta de
+la correccion y esos hallazgos, no la tarea entera: las correcciones son
+justo donde se cuelan los fallos nuevos. El revisor corre la suite completa
+una vez por ronda; los mutantes, con el fichero de test concreto.
 
 ### La linea del veredicto
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-035/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-035/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-035/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-035/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-035/tarea.md                                                       | 25 ++++++++++++++++++++-----
 5 files changed, 20 insertions(+), 5 deletions(-)
````
