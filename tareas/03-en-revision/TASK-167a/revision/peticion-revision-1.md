# Peticion de revision — TASK-167a (ronda 1)

- Tarea: TASK-167a — guia instalable de duplicacion de grano fino (parte a de TASK-167)
- Rama revisada: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
- Rama base: develop
- Commit revisado (HEAD): af87a4195849627ba94283d27a910facdf4b34ad
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-167a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-167a/tarea.md
- tareas/03-en-revision/TASK-167a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duplicacion.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts

## Commits a revisar (git log develop..HEAD)

````
af87a41 update(feature): develop -> feature/task-167-regla-4d-preventiva-en-los-proyectos-que
3f50c16 fix(TASK-167a): task-workflow/SKILL.md vuelve a caber en 15 KB con CRLF
35cbb20 docs(TASK-167a): autorrevision
c94acce feat(TASK-167a): guia instalable de duplicacion de grano fino
dcddc35 chore(TASK-167a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index 38a6717..99cb52e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -281,7 +281,8 @@ se revierte el cambio.
 
 ### Regla 4D en Angular y Vue
 
-La definicion y la severidad, en "Regla 4D" de revision.md. Aqui:
+La definicion y la severidad, en "Regla 4D" de revision.md; los patrones de
+duplicacion, en duplicacion.md. Aqui:
 
 - Duplicacion: un composable `useFetchUsuarios` copiado de `useFetchPedidos`
   cambiando la URL, en vez de un `useFetch(url)`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
index 117f1b2..7c83a89 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -223,7 +223,8 @@ salida de otro proceso.
 
 ### 8. Regla 4D
 
-La definicion y la severidad, en "Regla 4D" de revision.md. En un pase
+La definicion y la severidad, en "Regla 4D" de revision.md; los patrones de
+duplicacion, en duplicacion.md. En un pase
 generico:
 
 - Duplicacion: una funcion de parseo de argumentos nueva junto a la que ya
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index 3295dd0..74e781d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -230,7 +230,8 @@ Reproducciones baratas que este dominio agradece:
 
 ### Regla 4D en C#, AutoCAD e IFC
 
-La definicion y la severidad, en "Regla 4D" de revision.md. Aqui:
+La definicion y la severidad, en "Regla 4D" de revision.md; los patrones de
+duplicacion, en duplicacion.md. Aqui:
 
 - Duplicacion: dos metodos que abren la `Transaction` y recorren el
   `BlockTableRecord` igual, cambiando solo el filtro de entidad.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
index 5a139d1..94356ed 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
@@ -152,7 +152,8 @@ revierte el cambio.
 
 ### Regla 4D en Java y Spring
 
-La definicion y la severidad, en "Regla 4D" de revision.md. Aqui:
+La definicion y la severidad, en "Regla 4D" de revision.md; los patrones de
+duplicacion, en duplicacion.md. Aqui:
 
 - Duplicacion: dos `@Service` con el mismo mapeo DTO a entidad escrito a
   mano, en vez de un mapper comun.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 2b77d3d..5c2a5f4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -39,7 +39,8 @@ punto, no un formalismo.
    `tarea.md` y no debe anclarse. Commitea antes de `taskctl review` (con el
    workspace sucio aborta). En cada ronda siguiente, anade otra linea por
    revisora y la `- 4D ronda K — ` de las correcciones (todos los usos;
-   formato en "Regla 4D" de `task-workflow/revision.md`). Si el
+   formato en "Regla 4D" de `task-workflow/revision.md`; patrones en
+   `task-workflow/duplicacion.md`). Si el
    JSON no trae `revisores`, usa las revisoras cuya `description` encaje
    con los ficheros del diff, y `code-quality-reviewer` para el resto.
    `taskctl review` avisa, sin bloquear, si falta la constancia.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
index c4c2c1e..982d79b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
@@ -307,7 +307,8 @@ mutacion.
 
 ### Regla 4D en Rust y WebAssembly
 
-La definicion y la severidad, en "Regla 4D" de revision.md. Aqui:
+La definicion y la severidad, en "Regla 4D" de revision.md; los patrones de
+duplicacion, en duplicacion.md. Aqui:
 
 - Duplicacion: `area_f32` y `area_f64` copiadas, en vez de una generica sobre
   un trait numerico.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index 6918bde..f6596ec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -29,7 +29,7 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
    Antes de pedir revision, la Regla 4D (`task-workflow/revision.md`):
    busca el helper existente antes de crear uno, cita el criterio que motiva
    cada cambio y comprueba por mutacion cada test nuevo (rompe el codigo, ve
-   el rojo; patrones tipicos en `task-workflow/disfraz-tests.md`). Al unificar
+   el rojo; patrones en `task-workflow/disfraz-tests.md` y `duplicacion.md`). Al unificar
    una duplicacion, busca todos los usos. Anotalo en `## Autorrevision` de `tarea.md`:
    `- 4D — <commit>: helper buscado, usos buscados, criterios citados, N tests mutados`.
 5. El coste de la implementacion se registra solo (`task-workflow/coste.md`):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 6af3e63..3ce0b57 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -197,7 +197,7 @@ en verde, devuelve el turno con un informe. Arregla la causa; no borres,
 saltes ni debilites tests para pasarlo. Si el rojo no es tuyo, dilo:
 solo bloquea una vez por turno.
 `comando_verificacion_selectiva` y `comando_verificacion_freno`: [verificacion-selectiva.md](verificacion-selectiva.md).
-Tests por criterio y pesados: [tests-pesados.md](tests-pesados.md); poda: [poda-tests.md](poda-tests.md); disfraz: [disfraz-tests.md](disfraz-tests.md).
+Tests y Regla 4D: [tests-pesados.md](tests-pesados.md), [poda-tests.md](poda-tests.md), [disfraz-tests.md](disfraz-tests.md), [duplicacion.md](duplicacion.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
 `taskctl finish` verifica antes de mergear y aborta en rojo. Un merge (o el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duplicacion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duplicacion.md
new file mode 100644
index 0000000..b27acbd
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duplicacion.md
@@ -0,0 +1,34 @@
+# Duplicacion de grano fino: los patrones tipicos
+
+La duplicacion que mas cuesta no es la de dos ficheros iguales: es la de
+dos trozos pequenos que hacen lo mismo con otro nombre y divergen con el
+tiempo. Es la D de duplicacion de la Regla 4D (`revision.md`) y cuenta como
+IMPORTANTE. Repasa el diff con esta lista antes de pedir revision, y el
+revisor con ella.
+
+- **El helper copiado con otro nombre.** Una funcion de formato, de
+  normalizar rutas o de partir texto que ya existe en otro modulo, reescrita
+  con un nombre nuevo. Busca por lo que hace, no solo por el nombre.
+- **El lector repetido.** Cada modulo con su propio parser de la misma
+  estructura (secciones de un markdown, bloques cercados, celdas de una
+  tabla, un fichero de config): un caso borde se arregla en uno y en los
+  demas no. Una funcion, y que los demas la llamen.
+- **El envoltorio repetido de una herramienta externa.** Cada comando con su
+  propia forma de lanzar git, leer ficheros o llamar a la red, con matices
+  distintos al tratar errores. Un envoltorio, con su politica de errores.
+- **La lista escrita dos veces.** Flags, claves de config, nombres de fases
+  o extensiones escritos a mano en el codigo, en los tests y en la
+  documentacion. Deriva las copias de la fuente, o un test que compare.
+- **La regla copiada entre documentos.** La misma instruccion en varios
+  ficheros que lee un agente o una persona: cuando una cambia, las otras
+  mienten. Una fuente y remisiones.
+- **Los helpers de test por fichero.** Cada fichero de test con su repo
+  temporal, su fixture o su comparador: lo que se corrige en uno no llega al
+  resto. Un helper compartido.
+- **La correccion a medias.** Unificar los sitios que cita el hallazgo y
+  dejar los demas: la siguiente auditoria los encuentra. Antes de dar una
+  duplicacion por resuelta, busca todos los usos por nombre y por patron.
+
+Al unificar, generaliza lo justo (un parametro, una funcion comun) y
+conserva el comportamiento de todos los llamadores; un test que cubra los
+casos de cada uno es la prueba de que la unificacion no rompio a nadie.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index 9aa2431..4f6d0ea 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -82,6 +82,7 @@ cada uno en su dominio):
 - **Duplicacion**: dos funciones o clases que hacen lo mismo con pequenas
   diferencias. Ej.: `formatearFecha` nueva junto a la `fechaCorta` que ya
   habia. Se reutiliza y se generaliza (parametro, composicion, herencia).
+  Patrones: [duplicacion.md](duplicacion.md).
 - **Desviacion**: el diff se sale del objetivo de la tarea. Ej.: un
   refactor del parser en una tarea de mensajes. Lo ajeno va a otra tarea.
 - **Diluvio**: muchas lineas o clases donde bastan pocas. Ej.: interfaz,
@@ -98,7 +99,7 @@ posible duplicado y muta cada test que liste.
 resuelta, busca por nombre y por patron cada sitio que la tiene. Quien corrige
 hace la misma autorrevision que quien implementa y la anota en
 `## Autorrevision`: `- 4D ronda K — <commit>: usos buscados, N tests mutados`
-(K, la ronda cuyos hallazgos corrige) o, para los MENORES tras aprobar,
+(K, la ronda corregida) o, para los MENORES tras aprobar,
 `- 4D menores — <commit>: usos buscados, N tests mutados`.
 
 Duplicacion y disfraz reales son **IMPORTANTE** como minimo; desviacion y
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-167a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167a/planificacion/brainstorm/peticion-unificador-1.md              | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167a/planificacion/brainstorm/salida-brainstorm-testing-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167a/planificacion/plan-final.md                                    | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-167a/tarea.md                                                       | 8 +++++++-
 9 files changed, 7 insertions(+), 1 deletion(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts | 14 ++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/tamanos.test.ts  |  1 +
 2 files changed, 15 insertions(+)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 1819.7 s
- Commit verificado: af87a4195849627ba94283d27a910facdf4b34ad
- Huella: 155a9ca4cc96695c667ece749117e810bf53500d
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 615192 bytes en total):

````
✔ topes: el total de skills/ + agents/ cabe en su tope (25.8463ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (105.185ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (24.9611ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.3756ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.3907ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.6374ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (21.9628ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.043ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (2.2696ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (4.8187ms)
✔ 4. name presente, string y en kebab-case valido (3.7346ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (15.6332ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (6.6995ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (4.6075ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (9.4229ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (3.881ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (287.705ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (50.5648ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (1.5512ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (23.0562ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (17.656ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (21.636ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (4.4351ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (228.0215ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (77.0038ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (289.7348ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (3.095ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (18.4723ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (15134.78ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (26644.4826ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (3.6531ms)
ℹ tests 2064
ℹ suites 0
ℹ pass 2062
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 1805202.4029
[verificar-impacto] node --test termino con 0 en 1805.3 s.
````
