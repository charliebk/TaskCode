# Peticion de revision — TASK-158a (ronda 2)

- Tarea: TASK-158a — los textos de cada camino exigen 4D y buscar todos los usos (parte a de TASK-158)
- Rama revisada: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
- Rama base: develop
- Commit revisado (HEAD): 00aef24b25b81d40623b3fbab134026a538e7c79
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-158a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde d70549dc1f64f9fb322c7ca24eff686226044546 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (6 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu
tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion
   ya trae la verificacion de la ronda en verde para ese mismo commit, no la
   repitas: cita ese resultado y corre solo los tests de lo que verificas.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-158a/tarea.md
- tareas/03-en-revision/TASK-158a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 4 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido |  | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido |  | informe-revision-1.md |

## Commits a revisar (git log d70549dc1f64f9fb322c7ca24eff686226044546..HEAD)

````
00aef24 docs(TASK-158a): autorrevision de la ronda 1
cb84d8b fix(TASK-158a): ronda 1, formato completo de las lineas 4D y review que las nombra
bb2afb8 chore(TASK-158a): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff d70549dc1f64f9fb322c7ca24eff686226044546..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 8ab3660..64de69a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -37,7 +37,9 @@ punto, no un formalismo.
    linea por revisora: `- <revisora> — <commit>`, con el commit corto que
    repasaste, y nada mas. Sin juicios ni «sin hallazgos»: el revisor lee
    `tarea.md` y no debe anclarse. Commitea antes de `taskctl review` (con el
-   workspace sucio aborta). En cada ronda siguiente, anade otra linea. Si el
+   workspace sucio aborta). En cada ronda siguiente, anade otra linea por
+   revisora y la `- 4D ronda K — ` de las correcciones (todos los usos;
+   formato en "Regla 4D" de `task-workflow/revision.md`). Si el
    JSON no trae `revisores`, usa las revisoras cuya `description` encaje
    con los ficheros del diff, y `code-quality-reviewer` para el resto.
    `taskctl review` avisa, sin bloquear, si falta la constancia.
@@ -86,8 +88,7 @@ punto, no un formalismo.
    tarea nueva. Nunca se deja nada para la ronda siguiente: corregir de uno en
    uno es lo que convierte trece hallazgos en trece rondas. Lo corregido se
    marca `corregido` en la columna Estado de su informe (sin mezclarlo en un
-   commit de codigo). `taskctl review` avisa si queda alguno sin marcar.
-   Regla 4D al corregir y en los MENORES: todos los usos. En modo
+   commit de codigo). `taskctl review` avisa si queda alguno sin marcar. En modo
    automatico, si `siguiente` da `fase: review` con `accion: continuar`, haz tu
    todo eso, commitea, deja la suite en verde y vuelve al paso 2. Desde la
    ronda 2 la ronda es una verificacion acotada: cada revisor comprueba sus
@@ -109,16 +110,15 @@ punto, no un formalismo.
    **MENORES tras aprobar** (`aprobada-con-correcciones` sin CRITICO ni
    IMPORTANTE abiertos): **nunca** se piden como `cambios-solicitados` ni
    abren otra ronda, en ningun modo. Corrige los baratos tocando solo los
-   ficheros que cita cada MENOR (y sus tests), commitea y ejecuta
+   ficheros que cita cada MENOR (y sus tests), anota su linea
+   `- 4D menores — ` (misma regla), commitea y ejecuta
    `taskctl verificar-menores TASK-NNN [--motivo "<por que no se corrigen
-   los demas>"]`: comprueba que lo cambiado desde el `Commit revisado` se
-   limita a eso, lo registra en `tarea.md` y deja los MENORES no corregidos
-   en `revision/menores-pendientes.md` (backlog: no bloquean `finish`).
+   los demas>"]`: comprueba que solo cambia eso y deja los no corregidos en
+   `revision/menores-pendientes.md` (backlog: no bloquean `finish`).
    Si aborta porque hay un fichero ajeno, no lo fuerces: o se deshace ese
    cambio, o hace falta otra ronda, o una persona decide
    `taskctl finish TASK-NNN --aceptar-sin-revisar`. `finish` no integra
-   codigo posterior al revisado sin una de las dos cosas. Un CRITICO o
-   IMPORTANTE abierto sigue siendo `cambios-solicitados` y otra ronda.
+   codigo posterior al revisado sin una de las dos cosas.
 5. **Segunda opinion** (`revision_codex: true` y primaria aprobada):
    ejecuta `taskctl codex-review TASK-NNN` una vez.
    - Si avisa de que Codex no respondio y no escribio informe, muestra el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index 8011117..f402e42 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -94,9 +94,12 @@ cada uno en su dominio):
 La peticion trae `## Candidatos 4D` (pistas desde el diff): comprueba cada
 posible duplicado y muta cada test que liste.
 
-Todos los usos: antes de dar una duplicacion por cerrada, busca cada sitio
-que la tiene, no solo los citados. Al corregir `- 4D ronda K — ` o
-`- 4D menores — ` en la autorrevision.
+**Todos los usos, no solo los citados**: antes de dar una duplicacion por
+resuelta, busca por nombre y por patron cada sitio que la tiene. Quien corrige
+hace la misma autorrevision que quien implementa y la anota en
+`## Autorrevision`: `- 4D ronda K — <commit>: usos buscados, N tests mutados`
+(K, la ronda cuyos hallazgos corrige) o, para los MENORES tras aprobar,
+`- 4D menores — <commit>: usos buscados, N tests mutados`.
 
 Duplicacion y disfraz reales son **IMPORTANTE** como minimo; desviacion y
 diluvio, MENOR salvo que cambien comportamiento o escondan un fallo.
@@ -105,13 +108,8 @@ diluvio, MENOR salvo que cambien comportamiento o escondan un fallo.
 
 Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
 `revision/`. **Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la
-tarea.** Los MENOR que se corrijan no abren ronda 2: se corrigen los
-baratos, se commitea y `taskctl verificar-menores TASK-NNN` comprueba que lo
-cambiado desde el `Commit revisado` son solo los ficheros de esos MENORES (o
-tests), lo registra en `tarea.md` y deja los no corregidos en
-`revision/menores-pendientes.md` (backlog que no bloquea `finish`). Sin esa
-verificacion, `finish` no integra codigo posterior al revisado salvo que una
-persona pase `--aceptar-sin-revisar`. La ronda 2 solo se
+tarea.** Los MENOR que se corrijan no abren ronda 2: los comprueba
+`taskctl verificar-menores` (detalle en la skill de review). La ronda 2 solo se
 pide si se corrigio algun CRITICO o IMPORTANTE (veredicto `cambios-solicitados`):
 `taskctl review` sobre la tarea en revision la genera con solo el diff desde
 la ronda anterior y los hallazgos aun abiertos de su tabla, sin integrar la
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff d70549dc1f64f9fb322c7ca24eff686226044546..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-158a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-158a/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-158a/revision/informe-revision-1.md                                                  |  28 +++++++
 tareas/03-en-revision/TASK-158a/revision/peticion-revision-1.md                                                 | 330 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-158a/tarea.md                                                       |  18 ++++-
 11 files changed, 372 insertions(+), 4 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff d70549dc1f64f9fb322c7ca24eff686226044546..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts | 26 +++++++++++++++++++-------
 1 file changed, 19 insertions(+), 7 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Tests a mutar

Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).

- «TASK-158a revision: todos los usos antes de dar una duplicacion por resuelta, y quien corrige anota su autorrevision» (taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts:80)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 1713.9 s
- Commit verificado: 00aef24b25b81d40623b3fbab134026a538e7c79
- Huella: 3a9e6a6b11ced0961f96ff508201f9bdc1e55bad
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 611836 bytes en total):

````
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.2539ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (2.9779ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (10.5233ms)
✔ 4. name presente, string y en kebab-case valido (22.2749ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (14.2662ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (4.3998ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (25.2734ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (31.7705ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (17.2423ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (210.5872ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (14.349ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (1.5113ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (21.1399ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (23.4527ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (34.2308ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (16.0689ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (387.0172ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (143.7321ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (485.4949ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (14.0633ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (279.8714ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (14696.4935ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (31488.6087ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (4.5382ms)
✔ validador (TASK-075): la cruz del bloque del directorio no cuenta como error (21.3249ms)
✔ validador (TASK-075): la mutacion de los tests (YAML roto) no valida limpio (0.5571ms)
✔ validador (TASK-075): sin bloque del directorio (antes de 2.1.316) y sin cruz, valida limpio (0.4155ms)
✔ validador (TASK-075): un texto sin linea de resultado da rojo, no falso verde (0.3634ms)
✔ validador (TASK-075): exit 0 con una cruz ANTES del bloque del directorio no valida limpio (0.4705ms)
✔ validador (MEN-1): la frase del bloque dentro de una ruta no corta: el error de despues cuenta (0.2956ms)
✔ validador (TASK-075): «Validation passed with warnings» tambien cuenta como paso (0.4682ms)
ℹ tests 2065
ℹ suites 0
ℹ pass 2063
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 1689404.4833
[verificar-impacto] node --test termino con 0 en 1689.6 s.
````
