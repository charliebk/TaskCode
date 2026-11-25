# Peticion de revision — TASK-158a (ronda 1)

- Tarea: TASK-158a — los textos de cada camino exigen 4D y buscar todos los usos (parte a de TASK-158)
- Rama revisada: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
- Rama base: develop
- Commit revisado (HEAD): d70549dc1f64f9fb322c7ca24eff686226044546
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-158a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-158a/tarea.md
- tareas/03-en-revision/TASK-158a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
- taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
- taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-rendimiento.md
- taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
- taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
- taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts

## Commits a revisar (git log develop..HEAD)

````
d70549d docs(TASK-158a): inventario 4D y autorrevision
b3b9b4d feat(TASK-158a): la Regla 4D se exige al escribir en cada camino que crea codigo
166a5a4 chore(TASK-158a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
index 4aca585..66de595 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-arquitectura.md
@@ -27,6 +27,11 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
 - **Extender frente a crear**: si ya hay un punto de extensión que sirve, se
   usa; si hay que crear uno, decir por qué el existente no vale. Un helper
   duplicado es como acaban existiendo dos comportamientos para el mismo hecho.
+- **Regla 4D desde tu rol**: antes de proponer una pieza nueva, busca todos
+  los usos de lo que ya hace algo parecido (por nombre y por patrón), no solo
+  el primero que aparezca; si el plan unifica una duplicación, nombra cada
+  sitio que la tiene. Y señala la forma que trae más piezas de las que pide
+  el problema (diluvio) o que se sale del objetivo (desviación).
 - **La forma de la interfaz** entre lo nuevo y lo que ya está: qué firma, qué
   contrato, qué queda público y qué se queda dentro.
 - **Límites entre módulos**: qué responsabilidad queda a cada lado de cada
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
index 5d324de..e27083c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-dominio.md
@@ -40,6 +40,10 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
   hallazgo, y probablemente el más caro de todos si no sale ahora.
 - **Qué pasa con lo que ya existe**: datos, expedientes o registros creados
   bajo las reglas anteriores.
+- **Regla 4D desde tu rol**: una regla de negocio que ya está escrita en otro
+  sitio del código no se escribe otra vez (duplicación: busca todos los
+  sitios que la aplican); y un criterio que no cambia nada que el negocio
+  pueda observar es un disfraz.
 
 ## Qué NO miras
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-rendimiento.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-rendimiento.md
index 1985498..9043bcd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-rendimiento.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-rendimiento.md
@@ -38,6 +38,10 @@ ponen adjetivos.
 - **Medir con datos reales antes de optimizar**: qué métrica, con qué datos
   de producción o de tamaño de producción, y qué umbral decide si hace falta
   optimizar. Sin medida no hay hallazgo, hay una corazonada.
+- **Regla 4D desde tu rol**: una caché o un recorrido que ya existe se
+  reutiliza (busca todos los usos antes de crear otro); una optimización sin
+  medida es diluvio, y una medida que no distingue el antes del después,
+  disfraz.
 
 ## Qué NO miras
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
index a145bfc..7d2326c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-riesgos.md
@@ -37,6 +37,10 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
   qué le pasa. Datos ya escritos con el formato viejo incluidos.
 - **Vuelta atrás**: si esto sale mal en producción, cómo se deshace. "No se
   puede deshacer" es una respuesta legítima y hay que escribirla.
+- **Regla 4D desde tu rol**: si el enfoque unifica una duplicación, el riesgo
+  es dejar sitios sin migrar: exige buscar todos los usos (por nombre y por
+  patrón), no solo los citados. Y una guarda que aparenta proteger y no
+  protege (un `catch` que traga, un aviso que nadie lee) es un disfraz.
 
 Ordena por **daño**, no por probabilidad. Lo improbable y catastrófico va
 arriba; lo frecuente y molesto, después.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
index 14dcc67..58eef0d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-testing.md
@@ -40,6 +40,10 @@ es el plan final, y en él tienes que decir también lo que tu rol no cubre.
   cambie otra vez, qué queda duplicado, qué hará dudar al próximo lector.
 - **Coste de arranque**: si probar esto exige montar algo caro o frágil, es un
   dato de diseño, no un detalle de implementación.
+- **Regla 4D desde tu rol**: un test que repite a otro ya existente es
+  duplicación (busca todos los tests de la zona antes de proponer uno); uno
+  que sigue en verde con el código roto es disfraz: cada test nuevo se
+  comprueba por mutación.
 
 ## Qué NO miras
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
index 53a0a75..a37234b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/brainstorm-unificador.md
@@ -44,6 +44,10 @@ conflicto reaparece cuando ya hay código escrito.
   lo que pida medir antes de optimizar va al plan de pruebas o a la decisión
   humana. Si la petición no lista una salida de rendimiento, no falta nada: no
   la nombres en las salidas que faltaron.
+- **Regla 4D**: lo que el plan reutiliza sale de buscar todos los usos en el
+  repo, no solo el primero; si un rol propone una pieza nueva que ya existe
+  o unifica una duplicación sin nombrar cada sitio que la tiene, es un hueco
+  que se escribe en el plan.
 
 ## Qué NO miras
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md
index 9b3e4f8..fd76876 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md
@@ -64,7 +64,9 @@ fichero y línea**; sin cita, el punto se queda NO VERIFICADO.
      punto. Repetirlo no duplica: un punto con tarea abierta reutiliza la
      existente y lo dice. Necesita el árbol limpio y puede cambiar a la rama
      base; commitea las tareas él solo. Avisa, sin cerrar nada, de las tareas
-     cuyo punto ya da OK.
+     cuyo punto ya da OK. No arregles el código aquí: cada arreglo pasa por
+     plan y start, con la Regla 4D (buscar todos los usos del patrón
+     inseguro, no solo el citado).
    - **Escribir el informe** (`--escribir`): `docs/doctor-deploy/<fecha>.md` y
      su `.json`. No los commitea: que los revise y los commitee la persona.
      Una release avisa al cerrarse si no hay un informe al día.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index ed6fdee..4149a8f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -80,7 +80,9 @@ la tarea y `cierre` la clave `cierre_por_defecto` de la configuracion
 - **Hotfix y release** no tienen merge request (se mergean a la rama principal
   con tag y backmerge) y se cierran siempre con pregunta, en cualquier modo.
   Solo pregunta el tag: el nombre sustituye al que el script habria puesto,
-  siempre queda un unico tag.
+  siempre queda un unico tag. El codigo de un hotfix pasa por `start` y su
+  autorrevision de la Regla 4D como cualquier otro; una release solo sube
+  version y notas: si trae codigo, es una tarea aparte con su propio ciclo.
 
 Un nombre de tag que ya existe o no vale para Git aborta antes de mergear sin
 tocar nada: muestra el error y pregunta otro nombre.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 1713230..8ab3660 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -86,7 +86,8 @@ punto, no un formalismo.
    tarea nueva. Nunca se deja nada para la ronda siguiente: corregir de uno en
    uno es lo que convierte trece hallazgos en trece rondas. Lo corregido se
    marca `corregido` en la columna Estado de su informe (sin mezclarlo en un
-   commit de codigo). `taskctl review` avisa si queda alguno sin marcar. En modo
+   commit de codigo). `taskctl review` avisa si queda alguno sin marcar.
+   Regla 4D al corregir y en los MENORES: todos los usos. En modo
    automatico, si `siguiente` da `fase: review` con `accion: continuar`, haz tu
    todo eso, commitea, deja la suite en verde y vuelve al paso 2. Desde la
    ronda 2 la ronda es una verificacion acotada: cada revisor comprueba sus
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index 4db6993..6918bde 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -29,9 +29,9 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
    Antes de pedir revision, la Regla 4D (`task-workflow/revision.md`):
    busca el helper existente antes de crear uno, cita el criterio que motiva
    cada cambio y comprueba por mutacion cada test nuevo (rompe el codigo, ve
-   el rojo; patrones tipicos en `task-workflow/disfraz-tests.md`). Anotalo en
-   `## Autorrevision` de `tarea.md`:
-   `- 4D — <commit>: helper buscado, criterios citados, N tests mutados`.
+   el rojo; patrones tipicos en `task-workflow/disfraz-tests.md`). Al unificar
+   una duplicacion, busca todos los usos. Anotalo en `## Autorrevision` de `tarea.md`:
+   `- 4D — <commit>: helper buscado, usos buscados, criterios citados, N tests mutados`.
 5. El coste de la implementacion se registra solo (`task-workflow/coste.md`):
    un hook anota que sesion y que subagentes trabajan con la tarea en curso, y
    `taskctl review` suma su uso a `tokens_implementacion` en su commit. **No
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index ec9d020..8011117 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -94,6 +94,10 @@ cada uno en su dominio):
 La peticion trae `## Candidatos 4D` (pistas desde el diff): comprueba cada
 posible duplicado y muta cada test que liste.
 
+Todos los usos: antes de dar una duplicacion por cerrada, busca cada sitio
+que la tiene, no solo los citados. Al corregir `- 4D ronda K — ` o
+`- 4D menores — ` en la autorrevision.
+
 Duplicacion y disfraz reales son **IMPORTANTE** como minimo; desviacion y
 diluvio, MENOR salvo que cambien comportamiento o escondan un fallo.
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/01-en-diseno/TASK-158a/tarea.md                                                                        | 49 -------------------------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-158a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158a/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158a/planificacion/plan-final.md                                    |  0
 tareas/02-en-curso/TASK-158a/tarea.md                                                                         | 70 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 10 files changed, 70 insertions(+), 49 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts | 45 +++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 45 insertions(+)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Tests a mutar

Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).

- «TASK-158a revision: todos los usos antes de dar una duplicacion por resuelta, y la misma autorrevision al corregir» (taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts:80)
- «TASK-158a correcciones de ronda y MENORES (review): autorrevision 4D por ronda y antes de verificar-menores» (taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts:94)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 2094.2 s
- Commit verificado: d70549dc1f64f9fb322c7ca24eff686226044546
- Huella: a9ff468289e5fad8ac106fd866ee7e1e5a49305b
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 611829 bytes en total):

````
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.0425ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (1.947ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (2.6537ms)
✔ 4. name presente, string y en kebab-case valido (1.8674ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (17.0614ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (2.9093ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (3.5042ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (4.5648ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (4.2393ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (8.9053ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (1.9531ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (1.4984ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (3.7714ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (2.8164ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (1.662ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (2.0906ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (68.1153ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (8.2169ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (97.0146ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (2.6037ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (15.7791ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (15579.4279ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (31624.6592ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (4.1959ms)
✔ validador (TASK-075): la cruz del bloque del directorio no cuenta como error (11.6552ms)
✔ validador (TASK-075): la mutacion de los tests (YAML roto) no valida limpio (0.6272ms)
✔ validador (TASK-075): sin bloque del directorio (antes de 2.1.316) y sin cruz, valida limpio (0.4026ms)
✔ validador (TASK-075): un texto sin linea de resultado da rojo, no falso verde (0.3966ms)
✔ validador (TASK-075): exit 0 con una cruz ANTES del bloque del directorio no valida limpio (0.693ms)
✔ validador (MEN-1): la frase del bloque dentro de una ruta no corta: el error de despues cuenta (0.3473ms)
✔ validador (TASK-075): «Validation passed with warnings» tambien cuenta como paso (0.8524ms)
ℹ tests 2065
ℹ suites 0
ℹ pass 2063
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 2076288.9694
[verificar-impacto] node --test termino con 0 en 2076.4 s.
````
