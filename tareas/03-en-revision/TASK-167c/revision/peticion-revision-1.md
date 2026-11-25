# Peticion de revision — TASK-167c (ronda 1)

- Tarea: TASK-167c — auditoria 4D invocable (parte c de TASK-167)
- Rama revisada: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
- Rama base: develop
- Commit revisado (HEAD): a52b9ed42508ca1ff066a64d20dde5d4627efb81
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-167c (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-167c/tarea.md
- tareas/03-en-revision/TASK-167c/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts

## Commits a revisar (git log develop..HEAD)

````
a52b9ed docs(TASK-167c): autorrevision
d1adc94 feat(TASK-167c): skill auditoria-4d invocable con informe por D y severidad, plan por olas y tareas por ola
365b71a chore(TASK-167c): tarea en curso
788f1f4 merge(TASK-167c): develop en feature/task-167-regla-4d-preventiva-en-los-proyectos-que para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md
new file mode 100644
index 0000000..1cf827d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md
@@ -0,0 +1,100 @@
+---
+name: auditoria-4d
+description: Auditoría 4D (duplicación, desviación, diluvio, disfraz) de todo el proyecto con agentes de solo lectura por zona. Deja los hallazgos por D y severidad y un plan por olas en docs/auditoria-4d-FECHA.md y, si se pide, una tarea por ola. Se invoca como /taskcode-plugin:auditoria-4d.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git ls-files:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Grep Glob Write Agent AskUserQuestion
+---
+
+# Auditoría 4D del proyecto
+
+La Regla 4D se aplica en cada tarea al código que esa tarea toca. Esta
+auditoría mira **todo el proyecto** y busca lo que se acumuló entre tareas:
+helpers copiados, el mismo hecho decidido en varios sitios, tests que no
+prueban lo que dicen. Deja un informe y un plan de corrección por olas; no
+corrige nada.
+
+## Pasos
+
+1. Sitúate en la raíz del repo: `cd "$(git rev-parse --show-toplevel)"`, y
+   anota el commit (`git rev-parse HEAD`) y la fecha de hoy (AAAA-MM-DD). Lo
+   normal es auditar la rama base (la de desarrollo) con el árbol limpio
+   (`git status --porcelain` vacío): si no, dilo antes de empezar, porque el
+   informe describe ese commit y las tareas por ola se crean en la rama base.
+2. **Zonas.** Con `git ls-files`, reparte el código en zonas por carpeta
+   (de 3 a 8; una zona grande se parte, varias pequeñas se juntan). Fuera:
+   dependencias, código generado, compilados y la carpeta de tareas. Los tests
+   van con la zona del código que prueban.
+3. **Un agente de solo lectura por zona**, en paralelo y en un solo mensaje
+   (herramienta Agent; `Explore` si existe, si no `general-purpose` con la
+   orden de no escribir ni ejecutar nada que cambie el repo). A cada uno le
+   das: su zona, el commit, la Regla 4D de `task-workflow/revision.md` y los
+   patrones de `task-workflow/duplicacion.md` (léelos y pásale la ruta: no los
+   copies en la petición), y este formato de respuesta, una fila por hallazgo:
+
+   `| D | Severidad | Fichero | Hallazgo |`
+
+   con D en Duplicacion, Desviacion, Diluvio o Disfraz; Severidad en CRITICO,
+   IMPORTANTE o MENOR (la escala de `task-workflow/revision.md`), y Fichero
+   como `ruta:línea`. Para la duplicación, **todos los usos**: el agente
+   busca también fuera de su zona la otra copia y cita las dos. Sin cita de
+   fichero y línea, el hallazgo no entra.
+4. **Consolida.** Junta las respuestas, quita los hallazgos repetidos entre
+   zonas (la misma duplicación vista desde las dos copias es uno) y numéralos
+   (`4D-01`, `4D-02`...). Agrupa en **olas**: cada ola, cambios que se hacen
+   juntos y caben en menos de una hora de punta a punta
+   (`task-workflow/duracion.md`); primero los CRITICO, luego lo que más
+   repite.
+5. **Escribe el informe** en `docs/auditoria-4d-<AAAA-MM-DD>.md` (si ya
+   existe uno de hoy, añade `-2`, `-3`...) con este formato exacto, que
+   `taskctl metricas` lee para la tendencia entre auditorías:
+
+   ```markdown
+   # Auditoría 4D — <AAAA-MM-DD>
+
+   - Commit: <sha completo>
+   - Zonas: <zona>, <zona>, ...
+
+   ## Resumen
+
+   | D | CRITICO | IMPORTANTE | MENOR |
+   |---|---|---|---|
+   | Duplicacion | n | n | n |
+   | Desviacion | n | n | n |
+   | Diluvio | n | n | n |
+   | Disfraz | n | n | n |
+   | Total | n | n | n |
+
+   ## Hallazgos
+
+   | ID | D | Severidad | Fichero | Hallazgo | Ola |
+   |---|---|---|---|---|---|
+   | 4D-01 | Duplicacion | IMPORTANTE | ruta:línea | qué y dónde está la otra copia | 1 |
+
+   ## Plan por olas
+
+   ### Ola 1: <título corto>
+
+   - Hallazgos: 4D-01, 4D-03
+   - Qué se cambia: <una o dos frases>
+   - Duración estimada: N min
+   ```
+
+   Las cifras del resumen salen de la tabla de hallazgos: cuéntalas, no las
+   estimes. Una D sin hallazgos va con ceros, no se quita.
+6. Muestra el resumen y las olas, y **pregunta a la persona** (AskUserQuestion)
+   si quiere una tarea por ola. Solo si dice que sí: primero commitea el
+   informe (`git add docs/auditoria-4d-<fecha>.md` y `git commit -m "docs:
+   auditoria 4D <fecha>"`), porque `taskctl new` aborta con cambios sin
+   commitear; después, por cada ola:
+
+   ```bash
+   taskctl new --titulo "Regla 4D: <título de la ola>" --tipo fix --etiquetas regla-4d \
+     --objetivo "<qué se cambia> (docs/auditoria-4d-<fecha>.md, ola N)" \
+     --criterio "<cada hallazgo de la ola, corregido y comprobable>" --criterio "..."
+   ```
+
+   Un `--criterio` por hallazgo o grupo de hallazgos, comprobable (como en
+   `/taskcode-plugin:new`). Si `taskctl new` aborta, muestra el error tal cual
+   y sigue con la siguiente ola.
+7. Sin tareas, el informe queda sin commitear para que la persona lo revise.
+   Dile dónde está el informe y qué tareas se crearon (cada `taskctl new`
+   hace su propio commit).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 3ce0b57..95a885d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -173,11 +173,10 @@ decision de la persona responsable, explicita.
 
 **8. Diffs minimos y reutilizar lo que ya existe.** Acotados a lo que motiva
 la tarea. Antes de escribir un helper, buscar el que ya esta: duplicar la
-comprobacion es como acaban existiendo dos comportamientos para el mismo
-hecho.
+comprobacion da dos comportamientos para el mismo hecho.
 
 **9. Los mensajes de error se dirigen a la persona y dicen que hacer.** Un
-error que no propone el siguiente paso deja al lector adivinando. Y un mensaje
+error sin siguiente paso deja al lector adivinando. Y un mensaje
 que ha dejado de ser cierto es peor que no tenerlo.
 
 ## Configuracion (`.taskcode/config.yml`)
@@ -198,6 +197,7 @@ saltes ni debilites tests para pasarlo. Si el rojo no es tuyo, dilo:
 solo bloquea una vez por turno.
 `comando_verificacion_selectiva` y `comando_verificacion_freno`: [verificacion-selectiva.md](verificacion-selectiva.md).
 Tests y Regla 4D: [tests-pesados.md](tests-pesados.md), [poda-tests.md](poda-tests.md), [disfraz-tests.md](disfraz-tests.md), [duplicacion.md](duplicacion.md).
+Auditoria 4D de todo el codigo: `/taskcode-plugin:auditoria-4d`.
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
 `taskctl finish` verifica antes de mergear y aborta en rojo. Un merge (o el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
new file mode 100644
index 0000000..aac2bc1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/auditoria-4d.ts
@@ -0,0 +1,28 @@
+/**
+ * TASK-167c: el formato del informe de la auditoria 4D invocable
+ * (`skills/auditoria-4d`). Es la fuente unica: la skill lo escribe con estas
+ * secciones y cabeceras, su test lo exige, y `taskctl metricas` (TASK-167d)
+ * lo lee para la tendencia entre auditorias.
+ */
+
+/** Carpeta del proyecto donde se dejan los informes. */
+export const CARPETA_AUDITORIA_4D = 'docs';
+/** Nombre del informe de una fecha (AAAA-MM-DD). */
+export const nombreInformeAuditoria4D = (fecha: string): string => `auditoria-4d-${fecha}.md`;
+/** Reconoce un informe por su nombre; el grupo 1 es la fecha. */
+export const PATRON_INFORME_AUDITORIA_4D = /^auditoria-4d-(\d{4}-\d{2}-\d{2})\.md$/;
+
+/** Las cuatro D, en el orden en que salen en el resumen. */
+export const DES_4D = ['Duplicacion', 'Desviacion', 'Diluvio', 'Disfraz'] as const;
+export const SEVERIDADES_4D = ['CRITICO', 'IMPORTANTE', 'MENOR'] as const;
+
+export const SECCION_RESUMEN_4D = '## Resumen';
+export const SECCION_HALLAZGOS_4D = '## Hallazgos';
+export const SECCION_OLAS_4D = '## Plan por olas';
+
+/** Cabecera de la tabla de `## Resumen`: una fila por D y una de total. */
+export const CABECERA_RESUMEN_4D = `| D | ${SEVERIDADES_4D.join(' | ')} |`;
+/** Cabecera de la tabla de `## Hallazgos`. */
+export const CABECERA_HALLAZGOS_4D = '| ID | D | Severidad | Fichero | Hallazgo | Ola |';
+/** Encabezado de cada ola en `## Plan por olas`: `### Ola N: <titulo>`. */
+export const PATRON_OLA_4D = /^### Ola (\d+): (.+)$/;
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-167c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167c/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167c/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167c/tarea.md                                                       |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/auditoria-4d.js                                    | 24 ++++++++++++++++++++++++
 10 files changed, 31 insertions(+), 1 deletion(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts  | 87 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts | 13 ++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts       |  1 +
 3 files changed, 96 insertions(+), 5 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Tests a mutar

Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).

- «TASK-167c: las tareas por ola se crean con taskctl new, flags reales y etiqueta regla-4d, solo si la persona lo pide y con el informe commiteado» (taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts:71)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 234.7 s
- Commit verificado: a52b9ed42508ca1ff066a64d20dde5d4627efb81
- Huella: 53631d1f4eb143c5598086918a538b638e27a3cc
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 125846 bytes en total):

````
✔ topes: el total de skills/ + agents/ cabe en su tope (25.2635ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (4.7126ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (1.9484ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.3692ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.4477ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.5948ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (18.7972ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.3695ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (2.6729ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (7.0674ms)
✔ 4. name presente, string y en kebab-case valido (5.4861ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (34.702ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (7.0796ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (4.7627ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (4.6026ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (2.9863ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (15.9995ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (2.1449ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (3.0753ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (30.0442ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (9.7267ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (11.7332ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (5.824ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (33.0944ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (47.7461ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (167.2784ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (6.8033ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (48.7908ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (13627.0416ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (25017.1546ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (2.8464ms)
ℹ tests 914
ℹ suites 0
ℹ pass 914
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 207367.6727
[verificar-impacto] node --test termino con 0 en 207.5 s.
````
