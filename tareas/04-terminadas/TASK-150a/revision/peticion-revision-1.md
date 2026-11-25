# Peticion de revision — TASK-150a (ronda 1)

- Tarea: TASK-150a — textos que contradicen al codigo o a la Regla 4D (parte a de TASK-150)
- Rama revisada: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
- Rama base: develop
- Commit revisado (HEAD): 1cf8900c8f0d7634a6b659f5b195351bb337a24a
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-150a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-150a/tarea.md
- tareas/03-en-revision/TASK-150a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
- taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts

## Commits a revisar (git log develop..HEAD)

````
1cf8900 docs(TASK-150a): autorrevision con el test viejo
cdb198c test(TASK-150a): el test de TASK-129 exige la regla nueva del test duplicado
ad6159b docs(TASK-150a): autorrevision
a8cb5e7 fix(TASK-150a): las skills dicen lo mismo que el CLI y que la Regla 4D
2485f59 chore(TASK-150a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index 436ba42..984cbfd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -23,10 +23,9 @@ que casa con los patrones de mas abajo**: el backend, la infraestructura o
 la base de datos van a su propio revisor, en paralelo. Este revisor no
 opina sobre el endpoint, solo sobre como el frontend lo consume.
 
-Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
-(el componente padre, el store que se lee, el tipo de la respuesta) en vez
-de dar por hecho lo que no se ve. Lo que no vale es cargar el proyecto
-entero "por si acaso": pedir tres ficheros concretos es barato.
+Si para juzgar un cambio hace falta mas contexto (el componente padre, el store que se lee, el tipo de la respuesta), leelo y
+anotalo como dice "Lo que lees" de revision.md, en vez de dar por hecho lo que
+no se ve. Leer el proyecto entero "por si acaso" no es revisar mejor.
 
 Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
 sentido, el enrutado puede caer a un unico pase generico. Eso lo decide
@@ -315,8 +314,8 @@ contrario de lo que dice:
 
 - Lista editable sin identidad estable: al refrescar se pierde el foco y lo
   escrito en la fila.
-- Dialogo sin trampa de foco, sin cierre con Escape y sin devolver el foco
-  al abridor: con teclado la vista queda inutilizable.
+- Dialogo sin cierre con Escape o que no devuelve el foco al abridor: con
+  teclado se completa la accion, pero se pierde el sitio en la vista.
 - Entrada tipada como `any` u obligatoria por asercion, con la plantilla
   accediendo a un campo que puede no venir: pantalla en blanco.
 - Observador o intervalo que sigue disparando peticiones despues de salir de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index 2986f6b..aee28dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: csharp-autocad-ifc-reviewer
-description: Revisor por pares de C# sobre la API de AutoCAD o modelos IFC. Se usa si el diff toca .cs, .csproj, .sln, .ifc o .ifcxml, o la tarea menciona AutoCAD, ObjectARX, AcDbMgd, Civil 3D, BricsCAD, IFC, IfcOpenShell, xBIM o BIM. Es una skill de revision, no de implementacion.
+description: Revisor por pares de C# sobre la API de AutoCAD (ObjectARX, AcDbMgd, Civil 3D, BricsCAD) o modelos IFC (IfcOpenShell, xBIM). Se usa si el diff toca .cs, .csproj, .sln, .ifc o .ifcxml. Es una skill de revision, no de implementacion.
 ---
 
 # Revisor de C# sobre AutoCAD e IFC
@@ -71,8 +71,9 @@ se documenta igual. Misma frase, dos resultados, porque lo que cambia es si
 renunciar deja el dominio sin revisor.
 
 Si el diff toca ademas otros dominios, cada revisor recibe **solo la parte que
-casa con su patron**. No pidas el resto del diff por comodidad; pidelo si un
-hallazgo concreto lo necesita para sostenerse.
+casa con su patron**. No leas el resto del diff por comodidad; solo si un
+hallazgo concreto lo necesita para sostenerse, y anotalo como dice "Lo que
+lees" de revision.md.
 
 ## Antes de revisar: la puerta determinista
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
index f702af2..efde172 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
@@ -22,11 +22,9 @@ entero. Y si el diff toca varios dominios a la vez, recibe **solo la parte
 que casa con los patrones de mas abajo**: los ficheros de frontend, de
 infraestructura o de otro lenguaje van a su propio revisor, en paralelo.
 
-Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
-(el fichero completo, la entidad que la consulta toca, el `pom.xml`) en vez
-de dar por hecho lo que no se ve. Lo que no vale es leer el repositorio
-entero "por si acaso": pedir tres ficheros concretos es barato, cargar el
-proyecto no.
+Si para juzgar un cambio hace falta mas contexto (el fichero completo, la entidad que la consulta toca, el `pom.xml`), leelo y
+anotalo como dice "Lo que lees" de revision.md, en vez de dar por hecho lo que
+no se ve. Leer el proyecto entero "por si acaso" no es revisar mejor.
 
 Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
 sentido, el enrutado puede caer a un unico pase generico. Eso lo decide
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index d55fdd2..2b77d3d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -81,7 +81,6 @@ punto, no un formalismo.
    completo: `--informe informe-revision-N-<revisor>.md`. Con CRITICO o
    IMPORTANTE abiertos, `cambios-solicitados`: se corrigen, se commitea, y se
    vuelve a esta skill (abre la ronda siguiente).
-   Un test que duplica a otro ya existente es MENOR.
    **Antes de abrir la ronda siguiente se corrige TODO lo de la ronda**, en
    cualquier modo: los CRITICO e IMPORTANTE siempre; un MENOR que no compense
    corregir se marca `aceptado` con su motivo en su informe o se pasa a una
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
index 198651f..0961445 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
@@ -25,11 +25,10 @@ TypeScript o JavaScript que llama al modulo cae al generico. Este revisor
 opina sobre el lado Rust del limite: lo que se exporta, como se exporta y
 que cuesta cruzarlo. No opina sobre como la vista pinta el resultado.
 
-Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
-(el `lib.rs` que reexporta el modulo, el tipo que cruza el limite, el
-llamador de JavaScript que lo usa, el `Cargo.toml` del workspace) en vez de
-dar por hecho lo que no se ve. Lo que no vale es cargar el workspace entero
-"por si acaso": pedir tres ficheros concretos es barato.
+Si para juzgar un cambio hace falta mas contexto (el `lib.rs` que reexporta el modulo, el tipo que cruza el limite, el
+llamador de JavaScript que lo usa, el `Cargo.toml` del workspace), leelo y
+anotalo como dice "Lo que lees" de revision.md, en vez de dar por hecho lo que
+no se ve. Leer el proyecto entero "por si acaso" no es revisar mejor.
 
 **Regla obligatoria del limite JS-WASM.** Si el diff cambia una firma
 exportada con `#[wasm_bindgen]` (nombre, parametros, tipo devuelto, un
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
index c0f2233..d762696 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
@@ -59,7 +59,8 @@ Dentro de la seccion `## Criterios de aceptacion`, añade una subseccion
 **Reglas:**
 
 - Los criterios normales **deben estar todos marcados antes de `finish`**.
-  `finish` no lee las casillas: lo comprueba quien cierra y el revisor.
+  `finish` avisa, sin bloquear, de los que siguen sin marcar; lo comprueban
+  quien cierra y el revisor.
 - Los de "Tras el cierre" no cuentan para cerrar.
 - Despues de cerrar, quien lanzo `finish` verifica esos criterios en la rama
   base mientras se resuelven los detalles de publicacion o despliegue.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index f402e42..be9e39b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -276,7 +276,8 @@ y obliga a un commit de normalizacion que no arregla nada.
 - **No mueve la tarea de estado ni mergea.** Eso es trabajo de
   `taskctl finish`, y solo ocurre si el veredicto aprueba.
 - **No revisa el repositorio entero**: revisa el diff que le llega. Si de
-  verdad necesita mas contexto, lo pide para un hallazgo concreto.
+  verdad necesita mas contexto, lo lee para un hallazgo concreto y lo anota
+  (ver "Lo que lees").
 - **Un revisor de dominio no revisa ficheros fuera de sus patrones**: si al
   leer el diff aparece algo de otro dominio que preocupa, se anota en una
   linea y se deja para su revisor, no se juzga alli.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
index c44794d..364b21c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
@@ -6,7 +6,7 @@ tablero sintetizado) se pueden regenerar automaticamente despues de cada
 transicion de tarea. Para eso, el proyecto declara en `.taskcode/config.yml`
 un comando que reescribe esos ficheros y la lista de rutas que modifica.
 
-**Tres claves opcionales, en `.taskcode/config.yml`:**
+**Claves opcionales, en `.taskcode/config.yml`:**
 
 - **`comando_sincronizacion`**: el comando que el proyecto ejecuta para
   regenerar sus ficheros derivados. Ejemplo: `"node scripts/sincronizar-plan.mjs"`.
@@ -33,13 +33,14 @@ un comando que reescribe esos ficheros y la lista de rutas que modifica.
 
 - Las dos primeras claves van juntas o no van: si una existe, la otra debe
   existir tambien. La tercera es opcional.
-- Una clave mal escrita o un valor invalido aborta **todos** los comandos de
-  `taskctl` que lean config, con un error que enumera las claves validas.
+- Un valor invalido de una clave conocida aborta los comandos de `taskctl`
+  que lean config; una clave desconocida (por ejemplo, mal escrita) avisa y se
+  ignora.
 
 **Como funciona:**
 
-Los ocho comandos que hacen un commit automatico (`new`, `import`, `plan`,
-`approve`, `start`, `review`, `finish`, `codex-review`) siguen este flujo:
+Todo comando de `taskctl` que hace un commit automatico (las fases y los que
+escriben en `tareas/`) sigue este flujo:
 
 1. Escriben sus cambios en `tareas/`.
 2. **Ejecutan el comando de sincronizacion** (si esta declarado).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
index 41bd2b2..487d3a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/tests-pesados.md
@@ -9,7 +9,7 @@ En `## Plan de pruebas` del plan, por cada criterio, cuantos tests nuevos se
 preven: **de 1 a 3**. Si un criterio necesita mas, el plan dice por que. Antes
 de escribir un test, busca si ya hay uno que cubra lo mismo: ampliarlo es
 mejor que duplicarlo. En la revision, un test que duplica a otro ya existente
-es un hallazgo MENOR.
+es duplicacion de la Regla 4D (`revision.md`).
 
 ## Marcar un test como pesado
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-150a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150a/planificacion/brainstorm/peticion-unificador-1.md              | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150a/planificacion/brainstorm/salida-brainstorm-testing-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150a/planificacion/plan-final.md                                    | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-150a/tarea.md                                                       | 9 ++++++++-
 9 files changed, 8 insertions(+), 1 deletion(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts |  6 +++---
 taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts    | 66 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 69 insertions(+), 3 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 1713.6 s
- Commit verificado: 1cf8900c8f0d7634a6b659f5b195351bb337a24a
- Huella: d5b86034ee160d1e6c6e5a0f7e552123506e67d6
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 615132 bytes en total):

````
✔ topes: el total de skills/ + agents/ cabe en su tope (30.757ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (6.6317ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (1.2158ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.4023ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.4872ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.5815ms)
✔ el test apunta de verdad a la raiz del plugin (guard de no-vacuidad) (22.1357ms)
✔ 1. existe skills/task-workflow/SKILL.md con ese nombre exacto y esas mayusculas (2.9978ms)
✔ 2. empieza exactamente por los tres guiones: sin BOM, sin linea en blanco ni espacios delante (5.3118ms)
✔ 3. hay cierre de frontmatter y lo de dentro parsea a objeto (45.3407ms)
✔ 4. name presente, string y en kebab-case valido (8.119ms)
✔ 5. name coincide exactamente con el directorio que contiene el SKILL.md (27.1907ms)
✔ 6. description presente, no vacia, <= 1024 caracteres y sin los signos de menor/mayor (7.9559ms)
✔ 7. las claves del frontmatter son un subconjunto del spec portable (y "version" esta prohibida) (8.4211ms)
✔ 8. el cuerpo no esta vacio y tiene 500 lineas o menos (7.2654ms)
✔ 9. el cuerpo no contiene rutas absolutas de maquina (4.0085ms)
✔ 10. todo enlace markdown relativo del cuerpo apunta a un fichero que existe (39.8633ms)
✔ 11. plugin.json parsea, no tiene "bin", y "commands"/"skills" nunca son un objeto (16.8717ms)
✔ 12. no hay directorios de componentes dentro de .claude-plugin/ (1.5193ms)
✔ 15. la precondicion de "start" que documenta la skill es la que aplica el CLI (13.107ms)
✔ 16. los ficheros de brainstorm que documenta la skill son los que escribe "plan" (5.1209ms)
✔ 17. la skill enumera los roles de brainstorm en el orden de prioridad del CLI (13.5334ms)
✔ 18. task-workflow/SKILL.md pesa menos de 15 KB (13.3001ms)
✔ 19. toda skill del plugin tiene una description de 300 caracteres o menos (40.9473ms)
✔ 19b. las descriptions acortadas conservan sus disparadores (39.0115ms)
✔ 20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe (134.5245ms)
✔ 20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana (10.2985ms)
✔ 21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina (123.715ms)
✔ 13. `claude plugin validate` sobre el plugin real sale 0 (15817.7925ms)
✔ 14. contraprueba de descubrimiento: romper el SKILL.md de una copia hace fallar al validador nombrandolo (27219.1484ms)
✔ TASK-063: las skills de revision piden la columna Origen por hallazgo, con su vocabulario cerrado (2.4396ms)
ℹ tests 2064
ℹ suites 0
ℹ pass 2062
ℹ fail 0
ℹ cancelled 0
ℹ skipped 2
ℹ todo 0
ℹ duration_ms 1682996.3648
[verificar-impacto] node --test termino con 0 en 1683.2 s.
````
