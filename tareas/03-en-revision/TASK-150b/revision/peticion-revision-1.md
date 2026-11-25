# Peticion de revision — TASK-150b (ronda 1)

- Tarea: TASK-150b — la plantilla del informe en un solo sitio (parte b de TASK-150)
- Rama revisada: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
- Rama base: develop
- Commit revisado (HEAD): 2aab1621747686dbd34a08f0596801914eb5d885
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-150b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-150b/tarea.md
- tareas/03-en-revision/TASK-150b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts

## Commits a revisar (git log develop..HEAD)

````
2aab162 docs(TASK-150b): autorrevision
97f9ff3 fix(TASK-150b): la plantilla del informe en un solo sitio
11ba5b5 chore(TASK-150b): tarea en curso
66ba7c0 merge(TASK-150b): develop en fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index 984cbfd..38a6717 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -336,41 +336,17 @@ contrario de lo que dice:
 
 ## Estructura del informe
 
-Se rellena el esqueleto que deja `taskctl review`, respetando su cabecera
-(ver revision.md), con el nombre de esta skill en `- Revisor:`. Las secciones
-propias de este revisor van **despues** de `## Hallazgos`, donde no chocan con
-lo que el esqueleto ya trae:
-
-```markdown
-# Informe de revision — <ID de la tarea> (ronda <N>)
-
-- Commit revisado: <sha>
-- Revisor: angular-vue-reviewer
-- Veredicto: aprobada
-
-## Hallazgos
-
-<un bloque por hallazgo, con la plantilla de revision.md>
-
-## Alcance
-- Ficheros revisados: <los del diff que casaron con los patrones>
-- Contexto adicional pedido: <ninguno, o que y por que>
-
-## Reproduccion
-- Clon: <ruta temporal y rama>
-- Instalacion y build: <comandos y resultado>
-- Suite: <comando, resultado, y linea base antes del diff>
-- Vista ejercitada: <ruta, navegador, volumen de datos, recorrido de teclado>
-- Casos construidos: <que se ejecuto para demostrar cada hallazgo>
-
-## Revisado sin hallazgos
-<areas del diff que se miraron y salieron limpias, para que conste que se
-miraron>
-```
-
-Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
-forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
-llegar a esa conclusion.
+Se rellena el esqueleto que deja `taskctl review` (cabecera, tabla de
+hallazgos, Regla 4D y lecturas fuera del contexto), como dice "El informe" de
+revision.md, con `angular-vue-reviewer` en `- Revisor:`. Este revisor anade, despues
+de `## Hallazgos`:
+
+- `## Alcance`: los ficheros del diff que casaron con los patrones.
+- `## Reproduccion`: clon y rama, instalacion y build, suite con su linea base antes del diff,
+  vista ejercitada (ruta, navegador, volumen de datos, recorrido de teclado) y
+  los casos que demuestran cada hallazgo.
+- `## Revisado sin hallazgos`: las areas del diff que se miraron y salieron
+  limpias.
 
 ## Lo que esta skill no hace
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
index 958689b..117f1b2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -282,21 +282,9 @@ funciones.
 
 ## El informe
 
-Se escribe sobre el fichero de informe de la ronda que genera `taskctl
-review`, sin borrar la peticion, con las reglas de revision.md. La cabecera,
-con el nombre de esta skill:
-
-```
-# Informe de revision — <ID de la tarea> (ronda <N>)
-
-- Commit revisado: <sha>
-- Revisor: code-quality-reviewer
-- Veredicto: aprobada
-
-## Hallazgos
-
-<un bloque por hallazgo, con la plantilla de revision.md>
-```
+Se rellena el esqueleto que deja `taskctl review` (cabecera, tabla de
+hallazgos, Regla 4D y lecturas fuera del contexto), como dice "El informe" de
+revision.md, con `code-quality-reviewer` en `- Revisor:`.
 
 ## Lo que esta skill NO hace
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index bef9d2f..3295dd0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -291,21 +291,9 @@ decirlo.
 
 ## El informe
 
-Se escribe sobre el fichero de informe de la ronda que genera `taskctl
-review`, sin borrar la peticion, con las reglas de revision.md. La cabecera,
-con el nombre de esta skill:
-
-```
-# Informe de revision — <ID de la tarea> (ronda <N>)
-
-- Commit revisado: <sha>
-- Revisor: csharp-autocad-ifc-reviewer
-- Veredicto: aprobada
-
-## Hallazgos
-
-<un bloque por hallazgo, con la plantilla de revision.md>
-```
+Se rellena el esqueleto que deja `taskctl review` (cabecera, tabla de
+hallazgos, Regla 4D y lecturas fuera del contexto), como dice "El informe" de
+revision.md, con `csharp-autocad-ifc-reviewer` en `- Revisor:`.
 
 ## Lo que esta skill NO hace
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
index efde172..5a139d1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
@@ -198,40 +198,16 @@ contrario de lo que dice:
 
 ## Estructura del informe
 
-Se rellena el esqueleto que deja `taskctl review`, respetando su cabecera
-(ver revision.md), con el nombre de esta skill en `- Revisor:`. Las secciones
-propias de este revisor van **despues** de `## Hallazgos`, donde no chocan con
-lo que el esqueleto ya trae:
-
-```markdown
-# Informe de revision — <ID de la tarea> (ronda <N>)
-
-- Commit revisado: <sha>
-- Revisor: java-spring-reviewer
-- Veredicto: aprobada
-
-## Hallazgos
-
-<un bloque por hallazgo, con la plantilla de revision.md>
-
-## Alcance
-- Ficheros revisados: <los del diff que casaron con los patrones>
-- Contexto adicional pedido: <ninguno, o que y por que>
-
-## Reproduccion
-- Clon: <ruta temporal y rama>
-- Build: <comando y resultado>
-- Suite: <comando, resultado, y linea base antes del diff>
-- Casos construidos: <que se ejecuto para demostrar cada hallazgo>
-
-## Revisado sin hallazgos
-<areas del diff que se miraron y salieron limpias, para que conste que se
-miraron>
-```
-
-Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
-forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
-llegar a esa conclusion.
+Se rellena el esqueleto que deja `taskctl review` (cabecera, tabla de
+hallazgos, Regla 4D y lecturas fuera del contexto), como dice "El informe" de
+revision.md, con `java-spring-reviewer` en `- Revisor:`. Este revisor anade, despues
+de `## Hallazgos`:
+
+- `## Alcance`: los ficheros del diff que casaron con los patrones.
+- `## Reproduccion`: clon y rama, build, suite con su linea base antes del diff y los casos que
+  demuestran cada hallazgo.
+- `## Revisado sin hallazgos`: las areas del diff que se miraron y salieron
+  limpias.
 
 ## Lo que esta skill no hace
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
index 3518db5..c4c2c1e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
@@ -358,44 +358,20 @@ contrario de lo que dice:
 
 ## Estructura del informe
 
-Se rellena el esqueleto que deja `taskctl review`, respetando su cabecera
-(ver revision.md), con el nombre de esta skill en `- Revisor:`. Las secciones
-propias de este revisor van **despues** de `## Hallazgos`, donde no chocan con
-lo que el esqueleto ya trae:
-
-```markdown
-# Informe de revision — <ID de la tarea> (ronda <N>)
-
-- Commit revisado: <sha>
-- Revisor: rust-wasm-reviewer
-- Veredicto: aprobada
-
-## Hallazgos
-
-<un bloque por hallazgo, con la plantilla de revision.md>
-
-## Alcance
-- Ficheros revisados: <los del diff que casaron con los patrones>
-- Contexto adicional pedido: <ninguno, o que y por que>
-- Limite JS-WASM: <sin cambios de firma exportada, o llamador y .d.ts pedidos y lo encontrado>
-
-## Reproduccion
-- Clon: <ruta temporal y rama>
-- Build: <comandos, objetivos (nativo, wasm32) y resultado>
-- Formato y lints: <cargo fmt --check, cargo clippy y resultado>
-- Suite: <comando, resultado, y linea base antes del diff>
-- Casos construidos: <entradas reales o extremas usadas para cada hallazgo>
-- Mutacion: <que proteccion se quito y que test se puso rojo, o que no>
-- Medidas: <tiempos, tamano del .wasm o copias por llamada, si aplican>
-
-## Revisado sin hallazgos
-<areas del diff que se miraron y salieron limpias, para que conste que se
-miraron>
-```
-
-Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
-forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
-llegar a esa conclusion.
+Se rellena el esqueleto que deja `taskctl review` (cabecera, tabla de
+hallazgos, Regla 4D y lecturas fuera del contexto), como dice "El informe" de
+revision.md, con `rust-wasm-reviewer` en `- Revisor:`. Este revisor anade, despues
+de `## Hallazgos`:
+
+- `## Alcance`: los ficheros del diff que casaron con los patrones, y el limite JS-WASM
+  (sin cambios de firma exportada, o el llamador y el `.d.ts` leidos y lo
+  encontrado).
+- `## Reproduccion`: clon y rama, build por objetivo (nativo, wasm32), `cargo fmt --check` y
+  `cargo clippy`, suite con su linea base, entradas reales o extremas de cada
+  hallazgo, la mutacion hecha y las medidas (tiempos, tamano del `.wasm`,
+  copias por llamada) si aplican.
+- `## Revisado sin hallazgos`: las areas del diff que se miraron y salieron
+  limpias.
 
 ## Lo que esta skill no hace
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index be9e39b..9aa2431 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -162,8 +162,8 @@ la tarea, numerado por ronda. Se escribe sobre ese fichero, sin borrar la
 peticion, y **respetando su cabecera**: el titulo tal cual, la linea
 `- Commit revisado:` con el sha, la linea `- Revisor:` con el nombre de la
 skill revisora, y la linea `- Veredicto:`, que se **sustituye** en su sitio —
-nunca se borra de la cabecera ni se repite mas abajo. La cabecera de cada
-revisor, con su nombre, esta en su skill.
+nunca se borra de la cabecera ni se repite mas abajo. Las skills revisoras no
+la copian: solo anaden sus secciones propias despues de `## Hallazgos`.
 
 Cada hallazgo, bajo `## Hallazgos`, con esta plantilla:
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-150b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150b/planificacion/brainstorm/peticion-unificador-1.md              | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150b/planificacion/brainstorm/salida-brainstorm-testing-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150b/planificacion/plan-final.md                                    | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150b/tarea.md                                                       | 8 +++++++-
 9 files changed, 7 insertions(+), 1 deletion(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts    | 109 +++++++++++++++++++------------------------------------------------------------------------------------------
 2 files changed, 20 insertions(+), 91 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 2322.4 s
- Commit verificado: 2aab1621747686dbd34a08f0596801914eb5d885
- Huella: 460634ac74d9feda35d861f8f7085fca82bbacda
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 615340 bytes en total):

````
✔ topes: el total de skills/ + agents/ cabe en su tope (688.504ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (146.7787ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (1.1985ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.4115ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.4129ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.9321ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (34.7824ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (18.4981ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (7.648ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (19.6581ms)
✔ 4. name presente, string y en kebab-case valido (8.2639ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (23.7467ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (3.8177ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (11.2825ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (17.2841ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (42.2559ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (164.6531ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (14.5046ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (2.1317ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (19.1355ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (20.519ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (4.6367ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (2.4829ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (508.2491ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (110.5313ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (480.7474ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (13.3821ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (189.9252ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (15039.5758ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (33464.2706ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (3.1437ms)
ℹ tests 2064
ℹ suites 0
ℹ pass 2062
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 2282951.3907
[verificar-impacto] node --test termino con 0 en 2283.1 s.
````
