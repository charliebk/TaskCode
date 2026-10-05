# Peticion de revision — TASK-048 (ronda 1)

- Tarea: TASK-048 — F6-T3 Skill de flujo mas ligera
- Rama revisada: feature/task-048-f6-t3-skill-de-flujo-mas-ligera
- Rama base: develop
- Commit revisado (HEAD): 0b8f6b91af80f81a346b9ae5f26401b543c9d7a8
- Fecha: 2026-10-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-048 (criterios de aceptacion y plan)

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
0b8f6b9 feat(TASK-048): skill de flujo mas ligera y revision comun a las revisoras
3662591 chore(TASK-048): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index e0c7a7f..565897d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: angular-vue-reviewer
-description: Revisor por pares de diffs de frontend Angular y Vue. Se usa cuando el diff de una tarea toca ficheros .vue, ficheros .component.ts o .directive.ts de Angular hasta la version 19, plantillas, ficheros de rutas o configuracion de arranque bajo src/app en Angular 20 o posterior, o composables, y hay que revisar reactividad y gestion de estado, fugas de suscripciones, limites entre componentes, accesibilidad, rendimiento de renderizado, tipado de props y entradas, y tests de componente antes de cerrar la tarea.
+description: Revisor por pares de Angular y Vue. Se usa si el diff toca .vue, .component.ts, .directive.ts, composables, o plantillas, rutas o app.config bajo src/app (Angular 20+). Revisa reactividad y estado, fugas de suscripciones, limites entre componentes, accesibilidad, renderizado, tipado y tests.
 ---
 
 # Revision por pares de Angular y Vue
@@ -9,6 +9,12 @@ Revisa el diff de una tarea que toca la capa de interfaz en Angular o Vue.
 **Lo revisa un agente que no implemento la tarea**: la independencia es el
 punto, no un formalismo.
 
+Antes de empezar, lee [revision.md](../task-workflow/revision.md): lo comun a
+toda revision (la puerta determinista, una sola ejecucion de la suite por
+ronda, la plantilla de cada hallazgo, las rondas, la linea del veredicto que
+`taskctl finish` acepta y lo que un revisor no hace). Aqui queda lo propio de
+Angular y Vue.
+
 ## Que recibe este revisor y que no
 
 Recibe el **`git diff` de la rama contra su base**, no el repositorio
@@ -150,12 +156,7 @@ ejercita la vista.
    solo el servidor de desarrollo. Muchos errores de tipado solo salen ahi.
    Si no compila, ahi acaba la revision.
 4. **Correr la suite entera antes de tocar nada**, para tener la linea base.
-   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
-   pasada de la suite completa; no se repite. Los mutantes se comprueban con
-   el fichero o la clase de test concretos que cubren la linea mutada, no
-   con la suite entera. Con varios revisores en paralelo en la misma
-   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
-   compiten por la CPU y todas tardan mas.
+   Una sola vez por ronda (ver revision.md).
 5. **Levantar la aplicacion y ejercitar la vista de verdad**, con el
    navegador, entrando y saliendo de la ruta y con datos que se parezcan a
    los reales en volumen.
@@ -283,19 +284,12 @@ contrario de lo que dice:
 - Texto alternativo redundante que el lector de pantalla repite.
 - Import o dependencia que el diff deja sin usar.
 
-Todos los hallazgos se documentan, **tambien los que se decide no
-corregir**, con el motivo. Un "sin hallazgos" explicito es una respuesta
-valida; inventar hallazgos para tener algo que reportar, no.
-
 ## Estructura del informe
 
-`taskctl review` deja el esqueleto del informe en la carpeta de revision de
-la tarea, numerado por ronda. **Se rellena ese esqueleto, respetando su
-cabecera**: el titulo tal cual, la linea `- Commit revisado:` con el sha, la
-linea `- Revisor:` con el nombre de esta skill, y la linea `- Veredicto:`,
-que se **sustituye** en su sitio — nunca se borra de la cabecera ni se
-repite mas abajo. Las secciones propias de este revisor van **despues** de
-`## Hallazgos`, donde no chocan con lo que el esqueleto ya trae:
+Se rellena el esqueleto que deja `taskctl review`, respetando su cabecera
+(ver revision.md), con el nombre de esta skill en `- Revisor:`. Las secciones
+propias de este revisor van **despues** de `## Hallazgos`, donde no chocan con
+lo que el esqueleto ya trae:
 
 ```markdown
 # Informe de revision — <ID de la tarea> (ronda <N>)
@@ -306,18 +300,7 @@ repite mas abajo. Las secciones propias de este revisor van **despues** de
 
 ## Hallazgos
 
-### CRITICO-1 — <titulo corto>
-- Donde: <fichero:linea>
-- Que pasa: <comportamiento observado, en una o dos frases>
-- Reproduccion: <los pasos exactos que se ejecutaron, y su salida>
-- Impacto: <la consecuencia concreta para quien use esto>
-- Sugerencia: <la direccion de la correccion, no el parche>
-
-### IMPORTANTE-1 — <titulo corto>
-<mismos campos>
-
-### MENOR-1 — <titulo corto>
-<mismos campos, mas si se propone no corregirlo y por que>
+<un bloque por hallazgo, con la plantilla de revision.md>
 
 ## Alcance
 - Ficheros revisados: <los del diff que casaron con los patrones>
@@ -339,53 +322,11 @@ Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
 forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
 llegar a esa conclusion.
 
-Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la tarea: los MENOR que
-se corrijan no abren otra ronda. La ronda 2 solo se pide si se corrigio
-algun CRITICO o IMPORTANTE, y entonces revisa el delta de la correccion y
-comprueba **cada uno de esos hallazgos**: las correcciones son justo donde
-entran los fallos nuevos.
-
-## La linea del veredicto
-
-`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
-hace fail-closed: acepta una linea que, sin espacios y en minusculas,
-empiece por `- veredicto:` y cuyo **valor empiece** por `aprobada`. Si el
-valor contiene `pendiente` o `cambios-solicitados`, no aprueba. Y si el
-informe tiene varias lineas de veredicto, **todas** tienen que aprobar — por
-eso se **sustituye** la linea de la plantilla, no se anade otra debajo.
-
-| Linea escrita | Resultado |
-|---|---|
-| `- Veredicto: aprobada` | aprueba |
-| `- Veredicto: aprobada con correcciones menores` | aprueba (el valor empieza por `aprobada`) |
-| `- Veredicto: cambios-solicitados` | no aprueba, y es lo correcto si hay CRITICO o IMPORTANTE |
-| `- Veredicto: rechazada` | no aprueba |
-| `- Veredicto: no aprobada` | no aprueba: el valor no *empieza* por `aprobada` |
-| `- Veredicto: PENDIENTE (rellenar)` | no aprueba: es la plantilla sin sustituir |
-| `- Veredicto: **APROBADA**` | no aprueba: los asteriscos rompen el inicio |
-| `- Veredicto: aprobado` | no aprueba: `aprobado` no es `aprobada` |
-| `Veredicto: aprobada` | no cuenta como linea de veredicto, y sin ninguna no aprueba |
-
-El matiz va en el cuerpo del informe, nunca en esa linea. Un revisor que
-escriba el veredicto en su propio vocabulario bloquea el cierre y obliga a
-un commit de normalizacion que no arregla nada.
-
 ## Lo que esta skill no hace
 
-- **No implementa la correccion.** Propone el arreglo en el informe; lo
-  aplica quien implemento la tarea.
-- **No reescribe el codigo ajeno** ni commitea en la rama revisada. Los
-  unicos ficheros que toca son los suyos temporales y el informe.
-- **No aprueba por simpatia.** Si hay un CRITICO o un IMPORTANTE sin
-  corregir, el veredicto es `cambios-solicitados`, aunque el resto del diff
-  este impecable y aunque la tarea vaya con prisa.
+Ademas de lo que ningun revisor hace (ver revision.md):
+
 - **No es una revision de estetica.** Se revisa comportamiento,
   accesibilidad y contratos, no si el color gusta ni si el espaciado
   convence. Una preferencia visual sin consecuencia medible no es un
   hallazgo.
-- **No inventa hallazgos** para que el informe no salga vacio.
-- **No revisa ficheros fuera de sus patrones**: si al leer el diff aparece
-  algo de otro dominio que preocupa, se anota en una linea y se deja para su
-  revisor, no se juzga aqui.
-- **No sustituye a la puerta determinista** (build, linter, tests). Si eso
-  esta rojo, no hay nada que revisar todavia.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
index c96ea4e..eaaa9e4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: code-quality-reviewer
-description: Revisor por pares generico, independiente del lenguaje. Se usa cuando el diff de una tarea no cae en ningun dominio con revisor propio, y tambien cuando cae en demasiados a la vez (mas de tres), donde sustituye a la fragmentacion por dominio con un unico pase. Revisa correccion, casos borde, duplicacion real, calidad de los tests, limites de responsabilidad, legibilidad y seguridad de la entrada externa.
+description: Revisor por pares generico, independiente del lenguaje. Se usa si el diff no cae en ningun dominio con revisor propio, o cae en mas de tres (un unico pase). Revisa correccion, casos borde, duplicacion real, tests, limites de responsabilidad, legibilidad y seguridad de la entrada externa.
 ---
 
 # Revisor generico de calidad
@@ -13,6 +13,12 @@ minimo que **todo** cambio tiene que superar.
 El objetivo no es opinar sobre el diff: es **encontrar el caso que lo rompe y
 demostrarlo**.
 
+Antes de empezar, lee [revision.md](../task-workflow/revision.md): lo comun a
+toda revision (la puerta determinista, una sola ejecucion de la suite por
+ronda, la plantilla de cada hallazgo, las rondas, la linea del veredicto que
+`taskctl finish` acepta y lo que un revisor no hace). Aqui queda lo propio del
+pase generico.
+
 ## Cuando aplica
 
 Esta skill **no compite por patrones de fichero**. Se dispara por descarte y
@@ -53,19 +59,9 @@ porque se lo pidieron (caso 3).
 
 ## Antes de revisar: la puerta determinista
 
-La revision **no empieza** hasta que pasan, en este orden:
-
-1. **Build o compilacion**, con el comando que use el proyecto.
-2. **Linter / formateador**, en modo verificacion.
-3. **La suite de tests existente**, entera.
-
-Si algo de eso falla, la revision **se detiene ahi**: se reporta el fallo y se
-devuelve la tarea. Cero tokens gastados revisando codigo que no compila o que
-ya tiene la suite en rojo. Un fallo de la puerta no es un hallazgo de
-revision: es un requisito que no se cumplio.
-
-Si el proyecto no tiene alguno de los tres pasos, dilo en el informe. "No hay
-linter configurado" es informacion; suponer que se ejecuto, no.
+Build, linter y la suite entera, con los comandos que use el proyecto, en el
+orden y con las reglas de revision.md. Si la puerta esta en rojo, la revision
+no empieza.
 
 ## Como se revisa: reproducir, no leer
 
@@ -80,12 +76,7 @@ ejecutando:
 2. **Correr la suite entera uno mismo** y anotar el resultado real: cuantos
    tests, cuantos fallan, cuales. "Los tests pasan" sin haberlos corrido no
    vale, y `exit 0` no prueba que ocurriera nada — hay que comprobar el hecho.
-   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
-   pasada de la suite completa; no se repite. Los mutantes se comprueban con
-   el fichero o la clase de test concretos que cubren la linea mutada, no
-   con la suite entera. Con varios revisores en paralelo en la misma
-   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
-   compiten por la CPU y todas tardan mas.
+   Una sola vez por ronda (ver revision.md).
 3. **Mutar**: romper a proposito la linea que el diff dice proteger y
    comprobar que algun test se pone rojo. Si sigue verde, no hay red de
    regresion, y eso ya es un hallazgo por si solo.
@@ -271,15 +262,11 @@ contrario de lo que dice:
 duplicacion sin consecuencia demostrable, numeros magicos, orden de las
 funciones.
 
-**Todos los hallazgos se documentan, tambien los que se decide no corregir**,
-con el motivo. Sin esa nota, el siguiente lector concluye que hay un bug donde
-hay una decision. Un "sin hallazgos" explicito es una respuesta valida;
-inventar hallazgos para tener algo que reportar, no.
-
 ## El informe
 
 Se escribe sobre el fichero de informe de la ronda que genera `taskctl
-review`, sin borrar la peticion. Estructura fija:
+review`, sin borrar la peticion, con las reglas de revision.md. La cabecera,
+con el nombre de esta skill:
 
 ```
 # Informe de revision — <ID de la tarea> (ronda <N>)
@@ -290,70 +277,10 @@ review`, sin borrar la peticion. Estructura fija:
 
 ## Hallazgos
 
-### CRITICO-1 — <titulo corto>
-- Donde: <fichero:linea>
-- Que pasa: <comportamiento observado, en una o dos frases>
-- Reproduccion: <los pasos exactos que se ejecutaron, y su salida>
-- Impacto: <la consecuencia concreta para quien use esto>
-- Sugerencia: <la direccion de la correccion, no el parche>
-
-### IMPORTANTE-1 — <titulo corto>
-<mismos campos>
-
-### MENOR-1 — <titulo corto>
-<mismos campos, mas si se propone no corregirlo y por que>
+<un bloque por hallazgo, con la plantilla de revision.md>
 ```
 
-Si no hay nada que reportar, la seccion de hallazgos dice **"sin hallazgos"**
-de forma explicita, y se anade que se ejecuto para llegar a esa conclusion:
-que comandos, que suite, que mutaciones. Un "sin hallazgos" sin esa lista no
-se distingue de no haber mirado.
-
-### La linea del veredicto
-
-`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
-hace fail-closed. **Sustituye** la linea de la plantilla; no anadas otra
-debajo, porque *todas* las lineas de veredicto del informe tienen que aprobar.
-
-| Linea escrita | Resultado |
-|---|---|
-| `- Veredicto: aprobada` | aprueba |
-| `- Veredicto: aprobada con menores documentados` | aprueba (el valor empieza por `aprobada`) |
-| `- Veredicto: cambios-solicitados` | **no aprueba** — es lo correcto si pides cambios |
-| `- Veredicto: rechazada` | **no aprueba** |
-| `- Veredicto: PENDIENTE (...)` | **no aprueba** — es la plantilla sin sustituir |
-| `- Veredicto: **aprobada**` | **no aprueba** — los asteriscos rompen el inicio |
-| `- Veredicto: aprobado` | **no aprueba** — `aprobado` no es `aprobada` |
-| `Veredicto: aprobada` (sin el guion) | **no aprueba** — no cuenta como linea de veredicto |
-| (sin ninguna linea de veredicto) | **no aprueba** |
-
-Reglas del valor, para no pelearse con el parser: tiene que **empezar** por
-`aprobada`, y no puede contener la palabra `pendiente` ni la cadena
-`cambios-solicitados`. El matiz va en el **cuerpo** del informe, no en esa
-linea.
-
-Criterio para elegirlo, y no es negociable: **CRITICO o IMPORTANTE sin
-corregir implica `cambios-solicitados`**. Con solo hallazgos MENOR se puede
-aprobar, siempre que queden documentados con su motivo.
-
 ## Lo que esta skill NO hace
 
-- **No implementa la correccion.** Escribe el caso que falla y donde; el
-  arreglo lo hace quien implemento la tarea.
-- **No reescribe el codigo del otro** ni "aprovecha para" refactorizar,
-  renombrar o reordenar. Un revisor que edita deja de ser independiente, y la
-  siguiente ronda ya no tiene a nadie que la revise.
-- **No redisena la tarea.** Si la implementacion contradice al diseno, se
-  documenta la divergencia; cambiarlo es una decision de la persona
-  responsable.
-- **No aprueba por simpatia**, ni porque "casi todo esta bien", ni porque la
-  tarea ya vaya por la tercera ronda, ni porque el hallazgo obligue a repetir
-  trabajo. Tampoco inventa hallazgos para justificar el pase.
-- **No convierte preferencias de estilo en bloqueos.** Si no puedes nombrar el
-  fallo que produce, es MENOR.
-- **No sustituye a la puerta determinista** de build, linter y tests. Si esa
-  puerta esta en rojo, aqui no se empieza.
-- **No mueve la tarea de estado, no mergea y no commitea.** Eso es trabajo de
-  `taskctl finish`, y solo ocurre si el veredicto aprueba.
-- **No revisa el repositorio entero**: revisa el diff que le llega. Si de
-  verdad necesita mas contexto, lo pide para un hallazgo concreto.
+Lo que ningun revisor hace esta en revision.md; el pase generico no anade nada
+propio.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index 276d6e6..1de09c0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: csharp-autocad-ifc-reviewer
-description: Revision por pares de codigo C# que interopera con la API de AutoCAD o que produce/consume modelos IFC. Se usa cuando el diff de una tarea toca ficheros .cs, .csproj, .sln, .ifc o .ifcxml, o cuando la tarea menciona AutoCAD, ObjectARX, AcDbMgd, Civil 3D, BricsCAD, IFC, IfcOpenShell, xBIM o BIM. Es una skill de revision, no de implementacion.
+description: Revisor por pares de C# sobre la API de AutoCAD o modelos IFC. Se usa si el diff toca .cs, .csproj, .sln, .ifc o .ifcxml, o la tarea menciona AutoCAD, ObjectARX, AcDbMgd, Civil 3D, BricsCAD, IFC, IfcOpenShell, xBIM o BIM. Es una skill de revision, no de implementacion.
 ---
 
 # Revisor de C# sobre AutoCAD e IFC
@@ -9,6 +9,12 @@ Revisa el trabajo de **otro** agente sobre codigo C# que habla con la API de
 AutoCAD, con un modelo IFC, o con los dos. El objetivo no es opinar sobre el
 diff: es **encontrar el caso que lo rompe y demostrarlo**.
 
+Antes de empezar, lee [revision.md](../task-workflow/revision.md): lo comun a
+toda revision (la puerta determinista, una sola ejecucion de la suite por
+ronda, la plantilla de cada hallazgo, las rondas, la linea del veredicto que
+`taskctl finish` acepta y lo que un revisor no hace). Aqui queda lo propio de
+C# sobre AutoCAD e IFC.
+
 ## Cuando aplica
 
 Cuando el diff de la tarea toca ficheros que casan con estos patrones. Se
@@ -70,7 +76,8 @@ hallazgo concreto lo necesita para sostenerse.
 
 ## Antes de revisar: la puerta determinista
 
-La revision **no empieza** hasta que pasan, en este orden:
+La revision **no empieza** hasta que pasan, en este orden (las reglas de la
+puerta estan en revision.md):
 
 1. **Build** (`dotnet build` / la solucion completa, en Release si el proyecto
    lo usa).
@@ -78,11 +85,6 @@ La revision **no empieza** hasta que pasan, en este orden:
    --verify-no-changes`, reglas del `.editorconfig`).
 3. **La suite de tests existente**, entera.
 
-Si algo de eso falla, la revision **se detiene ahi**: se reporta el fallo y se
-devuelve la tarea. No se gasta un solo token revisando codigo que no compila o
-que ya tiene la suite en rojo. Un fallo en la puerta no es un hallazgo de
-revision; es un requisito que no se cumplio.
-
 Advertencia especifica del dominio: en muchos entornos la puerta **no puede
 incluir a AutoCAD**, porque el producto no esta instalado en la maquina donde
 se revisa. Eso no es excusa para saltarse los pasos 1-3, que si se pueden
@@ -99,12 +101,7 @@ ejecutando:
    siempre, **y otra vez tras cada cambio de rama dentro del mismo clon**.
 2. **Correr la suite entera uno mismo**, y anotar el resultado real (numero de
    tests, fallos, tiempo). "Los tests pasan" sin haberlos corrido no vale.
-   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
-   pasada de la suite completa; no se repite. Los mutantes se comprueban con
-   el fichero o la clase de test concretos que cubren la linea mutada, no
-   con la suite entera. Con varios revisores en paralelo en la misma
-   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
-   compiten por la CPU y todas tardan mas.
+   Una sola vez por ronda (ver revision.md).
 3. **Mutar las protecciones**: romper a proposito la linea que el diff dice
    proteger (el `Commit()`, la comprobacion de `IsErased`, el
    `CultureInfo.InvariantCulture`, el factor de unidades) y comprobar que
@@ -261,11 +258,6 @@ contrario de lo que dice. En este dominio:
 **MENOR** — todo lo demas: nombres, comentarios que ya no son ciertos,
 duplicacion sin consecuencia demostrada, un `using` de mas, estilo.
 
-**Todos los hallazgos se documentan, tambien los que se decide no corregir**,
-con el motivo. Sin esa nota, el siguiente lector concluye que hay un bug donde
-hay una decision. Un "sin hallazgos" explicito es una respuesta valida;
-inventar hallazgos para tener algo que reportar, no.
-
 ## Lo que no se puede reproducir
 
 Si AutoCAD no esta disponible en la maquina de revision, hay hallazgos que no
@@ -286,7 +278,8 @@ decirlo.
 ## El informe
 
 Se escribe sobre el fichero de informe de la ronda que genera `taskctl
-review`, sin borrar la peticion. Estructura fija:
+review`, sin borrar la peticion, con las reglas de revision.md. La cabecera,
+con el nombre de esta skill:
 
 ```
 # Informe de revision — <ID de la tarea> (ronda <N>)
@@ -297,61 +290,9 @@ review`, sin borrar la peticion. Estructura fija:
 
 ## Hallazgos
 
-### CRITICO-1 — <titulo corto>
-- Donde: <fichero:linea>
-- Que pasa: <comportamiento observado, en una o dos frases>
-- Reproduccion: <los pasos exactos que se ejecutaron, y su salida>
-- Impacto: <la consecuencia concreta para quien use esto>
-- Sugerencia: <la direccion de la correccion, no el parche>
-
-### IMPORTANTE-1 — <titulo corto>
-<mismos campos>
-
-### MENOR-1 — <titulo corto>
-<mismos campos, mas si se propone no corregirlo y por que>
+<un bloque por hallazgo, con la plantilla de revision.md>
 ```
 
-Si no hay nada que reportar, la seccion de hallazgos dice **"sin hallazgos"**
-de forma explicita, y se anade que se ejecuto para llegar a esa conclusion.
-
-### La linea del veredicto
-
-`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
-hace fail-closed. **Sustituye** la linea de la plantilla; no anadas otra
-debajo, porque *todas* las lineas de veredicto del informe tienen que aprobar.
-
-| Linea escrita | Resultado |
-|---|---|
-| `- Veredicto: aprobada` | aprueba |
-| `- Veredicto: aprobada con menores documentados` | aprueba (el valor empieza por `aprobada`) |
-| `- Veredicto: cambios-solicitados` | **no aprueba** — es lo correcto si pides cambios |
-| `- Veredicto: rechazada` | **no aprueba** |
-| `- Veredicto: PENDIENTE (...)` | **no aprueba** — es la plantilla sin sustituir |
-| `- Veredicto: **aprobada**` | **no aprueba** — los asteriscos rompen el inicio |
-| `- Veredicto: aprobado` | **no aprueba** — `aprobado` no es `aprobada` |
-| `Veredicto: aprobada` (sin el guion) | **no aprueba** — no cuenta como linea de veredicto |
-| (sin ninguna linea de veredicto) | **no aprueba** |
-
-Reglas del valor, para no pelearse con el parser: tiene que **empezar** por
-`aprobada`, y no puede contener la palabra `pendiente` ni la cadena
-`cambios-solicitados`. El matiz va en el **cuerpo** del informe, no en esa
-linea.
-
 ## Lo que esta skill NO hace
 
-- **No implementa la correccion.** Escribe el caso que falla y donde; el
-  arreglo lo hace quien implemento la tarea.
-- **No reescribe el codigo del otro** ni "aprovecha para" refactorizar,
-  renombrar o reordenar. Un revisor que edita deja de ser independiente.
-- **No redisena la tarea.** Si la implementacion contradice al diseno, se
-  documenta la divergencia; cambiarlo es una decision de la persona
-  responsable.
-- **No aprueba por simpatia**, ni porque "casi todo esta bien", ni porque la
-  tarea ya vaya por la tercera ronda. Tampoco inventa hallazgos para justificar
-  el pase.
-- **No sustituye a la puerta determinista** de build, linter y tests. Si esa
-  puerta esta en rojo, aqui no se empieza.
-- **No mueve la tarea de estado, no mergea y no commitea.** Eso es trabajo de
-  `taskctl finish`, y solo ocurre si el veredicto aprueba.
-- **No revisa el repositorio entero**: revisa el diff que le llega. Si de
-  verdad necesita mas contexto, lo pide para un hallazgo concreto.
+Lo que ningun revisor hace esta en revision.md; este no anade nada propio.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
index 05e6686..623e95f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: java-spring-reviewer
-description: Revisor por pares de diffs de Java y Spring Boot. Se usa cuando el diff de una tarea toca ficheros .java, pom.xml, build.gradle o application*.yml y hay que revisar capas de servicio y repositorio, limites transaccionales, gestion de excepciones, inyeccion, consultas N+1, validacion de entrada, configuracion por perfiles y tests con contexto real antes de cerrar la tarea.
+description: Revisor por pares de Java y Spring Boot. Se usa si el diff toca .java, pom.xml, build.gradle o application*.yml. Revisa capas de servicio y repositorio, transacciones, excepciones, inyeccion, consultas N+1, validacion de entrada, perfiles y tests con contexto real antes de cerrar la tarea.
 ---
 
 # Revision por pares de Java y Spring
@@ -9,6 +9,12 @@ Revisa el diff de una tarea que toca codigo Java o Spring Boot. **Lo revisa
 un agente que no implemento la tarea**: la independencia es el punto, no un
 formalismo.
 
+Antes de empezar, lee [revision.md](../task-workflow/revision.md): lo comun a
+toda revision (la puerta determinista, una sola ejecucion de la suite por
+ronda, la plantilla de cada hallazgo, las rondas, la linea del veredicto que
+`taskctl finish` acepta y lo que un revisor no hace). Aqui queda lo propio de
+Java y Spring.
+
 ## Que recibe este revisor y que no
 
 Recibe el **`git diff` de la rama contra su base**, no el repositorio
@@ -55,13 +61,8 @@ caso que lo demuestra**, no cuando parece que podria pasar.
    revision: se reporta eso y nada mas.
 3. **Correr la suite entera antes de tocar nada**, para tener la linea base.
    Un test que ya estaba rojo antes del diff no es un hallazgo de esta
-   tarea, pero si es un dato que va en el informe.
-   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
-   pasada de la suite completa; no se repite. Los mutantes se comprueban con
-   el fichero o la clase de test concretos que cubren la linea mutada, no
-   con la suite entera. Con varios revisores en paralelo en la misma
-   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
-   compiten por la CPU y todas tardan mas.
+   tarea, pero si es un dato que va en el informe. Una sola vez por ronda
+   (ver revision.md).
 4. **Construir el caso que rompe.** Un test nuevo que falla contra la rama,
    o una llamada real contra la aplicacion levantada. Lo que no se ha
    ejecutado no se afirma.
@@ -183,19 +184,12 @@ contrario de lo que dice:
 - Nombre de metodo de repositorio que no describe lo que consulta.
 - Import o dependencia que el diff deja sin usar.
 
-Todos los hallazgos se documentan, **tambien los que se decide no
-corregir**, con el motivo. Un "sin hallazgos" explicito es una respuesta
-valida; inventar hallazgos para tener algo que reportar, no.
-
 ## Estructura del informe
 
-`taskctl review` deja el esqueleto del informe en la carpeta de revision de
-la tarea, numerado por ronda. **Se rellena ese esqueleto, respetando su
-cabecera**: el titulo tal cual, la linea `- Commit revisado:` con el sha, la
-linea `- Revisor:` con el nombre de esta skill, y la linea `- Veredicto:`,
-que se **sustituye** en su sitio — nunca se borra de la cabecera ni se
-repite mas abajo. Las secciones propias de este revisor van **despues** de
-`## Hallazgos`, donde no chocan con lo que el esqueleto ya trae:
+Se rellena el esqueleto que deja `taskctl review`, respetando su cabecera
+(ver revision.md), con el nombre de esta skill en `- Revisor:`. Las secciones
+propias de este revisor van **despues** de `## Hallazgos`, donde no chocan con
+lo que el esqueleto ya trae:
 
 ```markdown
 # Informe de revision — <ID de la tarea> (ronda <N>)
@@ -206,18 +200,7 @@ repite mas abajo. Las secciones propias de este revisor van **despues** de
 
 ## Hallazgos
 
-### CRITICO-1 — <titulo corto>
-- Donde: <fichero:linea>
-- Que pasa: <comportamiento observado, en una o dos frases>
-- Reproduccion: <los pasos exactos que se ejecutaron, y su salida>
-- Impacto: <la consecuencia concreta para quien use esto>
-- Sugerencia: <la direccion de la correccion, no el parche>
-
-### IMPORTANTE-1 — <titulo corto>
-<mismos campos>
-
-### MENOR-1 — <titulo corto>
-<mismos campos, mas si se propone no corregirlo y por que>
+<un bloque por hallazgo, con la plantilla de revision.md>
 
 ## Alcance
 - Ficheros revisados: <los del diff que casaron con los patrones>
@@ -238,49 +221,6 @@ Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
 forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
 llegar a esa conclusion.
 
-Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la tarea: los MENOR que
-se corrijan no abren otra ronda. La ronda 2 solo se pide si se corrigio
-algun CRITICO o IMPORTANTE, y entonces revisa el delta de la correccion y
-comprueba **cada uno de esos hallazgos**: las correcciones son justo donde
-entran los fallos nuevos.
-
-## La linea del veredicto
-
-`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
-hace fail-closed: acepta una linea que, sin espacios y en minusculas,
-empiece por `- veredicto:` y cuyo **valor empiece** por `aprobada`. Si el
-valor contiene `pendiente` o `cambios-solicitados`, no aprueba. Y si el
-informe tiene varias lineas de veredicto, **todas** tienen que aprobar — por
-eso se **sustituye** la linea de la plantilla, no se anade otra debajo.
-
-| Linea escrita | Resultado |
-|---|---|
-| `- Veredicto: aprobada` | aprueba |
-| `- Veredicto: aprobada con correcciones menores` | aprueba (el valor empieza por `aprobada`) |
-| `- Veredicto: cambios-solicitados` | no aprueba, y es lo correcto si hay CRITICO o IMPORTANTE |
-| `- Veredicto: rechazada` | no aprueba |
-| `- Veredicto: no aprobada` | no aprueba: el valor no *empieza* por `aprobada` |
-| `- Veredicto: PENDIENTE (rellenar)` | no aprueba: es la plantilla sin sustituir |
-| `- Veredicto: **APROBADA**` | no aprueba: los asteriscos rompen el inicio |
-| `- Veredicto: aprobado` | no aprueba: `aprobado` no es `aprobada` |
-| `Veredicto: aprobada` | no cuenta como linea de veredicto, y sin ninguna no aprueba |
-
-El matiz va en el cuerpo del informe, nunca en esa linea. Un revisor que
-escriba el veredicto en su propio vocabulario bloquea el cierre y obliga a
-un commit de normalizacion que no arregla nada.
-
 ## Lo que esta skill no hace
 
-- **No implementa la correccion.** Propone el arreglo en el informe; lo
-  aplica quien implemento la tarea.
-- **No reescribe el codigo ajeno** ni commitea en la rama revisada. Los
-  unicos ficheros que toca son los suyos temporales y el informe.
-- **No aprueba por simpatia.** Si hay un CRITICO o un IMPORTANTE sin
-  corregir, el veredicto es `cambios-solicitados`, aunque el resto del diff
-  este impecable y aunque la tarea vaya con prisa.
-- **No inventa hallazgos** para que el informe no salga vacio.
-- **No revisa ficheros fuera de sus patrones**: si al leer el diff aparece
-  algo de otro dominio que preocupa, se anota en una linea y se deja para su
-  revisor, no se juzga aqui.
-- **No sustituye a la puerta determinista** (build, linter, tests). Si eso
-  esta rojo, no hay nada que revisar todavia.
+Lo que ningun revisor hace esta en revision.md; este no anade nada propio.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 5d77944..15a55dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: task-workflow
-description: Metodologia de tareas por sprints con revision por pares y Git-Flow determinista. Se usa cuando el proyecto tiene una carpeta "tareas/" con subcarpetas 00-planificadas .. 04-terminadas, o cuando se pide "crear una tarea", "planificar una tarea", "aprobar un plan", "empezar una tarea", "revisar por pares", "cerrar una tarea", o se menciona taskctl, una tarea TASK-NNN, el tablero de tareas o el flujo de Git-Flow del proyecto.
+description: Flujo de tareas por sprints con revision por pares y Git-Flow determinista (taskctl). Se usa si el proyecto tiene tareas/ con 00-planificadas .. 04-terminadas, o se pide crear, planificar, aprobar, empezar, revisar por pares o cerrar una tarea, o se menciona taskctl, una TASK-NNN o el tablero.
 ---
 
 # Flujo de trabajo de tareas (taskctl)
@@ -18,35 +18,10 @@ aplica.
 
 Comprobar el estado real antes de nada: `taskctl board`.
 
-**Prerrequisito 1 — `taskctl` disponible**: lo aporta este mismo plugin. Su
-ejecutable vive en `bin/`, que Claude Code anade al PATH del Bash tool
-mientras el plugin este habilitado, y no hay que compilar ni instalar nada
-aparte. Comprobarlo con `taskctl --version`, que debe imprimir un numero de
-version. Si no responde, en este orden:
-
-1. Reinicia la sesion de Claude Code. El PATH se compone al arrancar, asi que
-   un plugin instalado a mitad de sesion no aparece hasta la siguiente.
-2. Si sigue sin responder, mira **primero** si la variable tiene valor:
-   `echo "$CLAUDE_PLUGIN_ROOT"`.
-   - Si imprime una ruta, invocalo por ahi:
-     `node "$CLAUDE_PLUGIN_ROOT/bin/taskctl" --version`. Todos los comandos de
-     esta skill funcionan igual por esa via.
-   - **Si sale vacia, este paso no aplica y no dice nada** sobre si el plugin
-     esta activo: esa variable no esta exportada en todos los entornos, y
-     usarla vacia construye una ruta que no existe (`/bin/taskctl`) y falla
-     por un motivo que no tiene nada que ver.
-3. Solo si el paso 2 llego a ejecutarse con una ruta que **contiene de verdad
-   `bin/taskctl`** y aun asi no respondio, el plugin no esta activo y ningun
-   paso de esta skill va a funcionar. Si la ruta apuntaba a otro sitio, el
-   fallo no dice nada: vuelve al paso 1.
-
-No des por hecho el paso 3 al primer `command not found`: el caso normal es
-el 1.
-
-**Prerrequisito 2**: el repo necesita una rama `develop`. Los comandos la
-esperan por nombre para las tareas de tipo `feature`, `fix` y `release`; las
-de tipo `hotfix` van contra la principal (`main` o `master`, lo que exista).
-Sin `develop`, el primer comando que escriba en `tareas/` ya falla.
+**Prerrequisitos**: `taskctl` en el PATH (lo aporta este plugin;
+`taskctl --version` imprime su version) y una rama `develop` en el repo. Si
+`taskctl` no responde o no hay `develop`, lee [prerrequisitos.md](prerrequisitos.md)
+antes de seguir: dice en que orden comprobarlo y que no dar por hecho.
 
 ## El ciclo de vida
 
@@ -83,8 +58,8 @@ Precondiciones de cada transicion:
   informe. **No invoca a ningun agente**: lanzar al revisor es trabajo de
   quien orquesta.
 - **`finish`** — desde `en-revision`, y solo si el ultimo informe de revision
-  aprueba (ver "La linea del veredicto"). Mergea, mueve la tarea y regenera
-  los artefactos del repo.
+  aprueba (ver la linea del veredicto en [revision.md](revision.md)).
+  Mergea, mueve la tarea y regenera los artefactos del repo.
 
 La carpeta de cada tarea es `tarea.md` + `planificacion/` + `revision/`. Las
 dos subcarpetas se crean bajo demanda, cuando hay algo que escribir dentro.
@@ -124,7 +99,7 @@ Detalles que muerden:
 
 - **En `approve`, `review` y `finish` el ID tiene que ser el primer
   argumento.** Esos comandos leen el primer argumento tal cual, asi que
-  `taskctl approve --loquesea TASK-001` intentaria usar `--loquesea` como ID.
+  `taskctl approve --loquesea TASK-NNN` intentaria usar `--loquesea` como ID.
 - **Los flags desconocidos se ignoran en silencio** en el resto de comandos:
   comprobar la salida, no suponer.
 - `board` solo escribe `docs/BOARD.md` si se le pasa `--escribir`, y ese
@@ -205,53 +180,12 @@ derivados tras cada transicion. Sin fichero, todo por defecto; una clave mal
 escrita aborta todos los comandos. La sincronizacion (y sus trampas: no usar un
 hook de pre-commit, codigo de salida 3) esta en [sincronizacion.md](sincronizacion.md).
 
-## Criterios verificables tras el cierre (post-finish)
+## Cerrar una tarea
 
-Algunos criterios de aceptacion solo se pueden demostrar despues de que
-`taskctl finish` fusione la rama en la rama base: un CI que pase en verde tras
-el merge, una publicacion en produccion desde esa rama, o una ejecucion en vivo
-que dependa del merge realizado. Esos criterios **no se pueden marcar antes de
-cerrar la tarea**.
-
-**Como declararlos en `tarea.md`:**
-
-Dentro de la seccion `## Criterios de aceptacion`, añade una subseccion
-`### Tras el cierre` para los que solo se verifican despues de `finish`:
-
-```markdown
-## Criterios de aceptacion
-
-(Criterios normales que se verifican antes de finish)
-- [ ] El parser acepta ficheros UTF-8 con BOM.
-- [ ] La sintaxis de error da consejos especificos.
-
-### Tras el cierre
-
-(Se verifican despues de finish, en la rama base)
-- [ ] La rama base pasa el CI a verde.
-- [ ] La documentacion se publica automaticamente en main.
-```
-
-**Reglas:**
-
-- Los criterios normales **deben estar todos marcados antes de `finish`**.
-  `finish` no lee las casillas: lo comprueba quien cierra y el revisor.
-- Los de "Tras el cierre" no cuentan para cerrar.
-- Despues de cerrar, quien lanzo `finish` verifica esos criterios en la rama
-  base mientras se resuelven los detalles de publicacion o despliegue.
-- La evidencia de que pasaron se registra en **un commit posterior**, en la
-  seccion `## Resultado` de la tarea en su carpeta de terminadas (o en el
-  registro de progreso del proyecto si la estructura es distinta).
-
-**Si un criterio post-cierre falla:**
-
-No se reabre la tarea ya cerrada. En su lugar:
-
-1. Documenta el fallo en el `## Resultado` de la tarea cerrada: qué
-   criterio fallo, por que, y que evidencia se recopilo.
-2. Abre una tarea **nueva de tipo `fix`** (en `00-planificadas/`) que corrija
-   el problema. Referencia la tarea original en su descripcion.
-3. Sigue el flujo normal: `plan`, `approve`, `start`, revision, `finish`.
+Antes de lanzar `finish`, y otra vez justo despues, lee [cierre.md](cierre.md):
+lo que tiene que estar hecho al cerrar (suite, smoke test, criterios marcados,
+`## Resultado`, registro de progreso) y como declarar y verificar los criterios
+que solo se comprueban despues del merge (`### Tras el cierre`).
 
 ## El brainstorm de la fase de diseno
 
@@ -302,129 +236,14 @@ incremental: tratarla como un reinicio gasta de nuevo todos los agentes.
 
 ## La revision por pares
 
-**Quien.** Un agente que no implemento la tarea. La independencia es el punto,
-no un formalismo.
-
-**Como.** No es leer el diff y opinar. Es clonar el repo a un directorio
-temporal, compilar, correr la suite uno mismo, y **construir el caso que rompe
-el codigo antes de reportarlo**. Lo que mas hallazgos ha dado:
-
-- **Mutacion**: romper a proposito cada proteccion y ver si algun test se
-  entera. Asi se descubre que un flag defensivo se habia quedado sin cobertura.
-- **Ejercitar el CLI real**, no solo la API interna.
-- **Comprobar los tests que cambiaron de expectativa**: que sigan aseverando
-  lo mismo y no escondan una regresion.
-- **Reconstruir el build**: un clon no hereda binarios compilados, y cada rama
-  compila algo distinto.
-
-**Clasificacion.** CRITICO: perdida de datos, corrupcion de estado, o el
-comando hace lo contrario de lo que dice. IMPORTANTE: comportamiento
-incorrecto en un caso real, no de borde. MENOR: todo lo demas.
-
-Un "sin hallazgos" explicito es una respuesta valida. Inventar hallazgos para
-tener algo que reportar, no.
-
-**Rondas.** Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
-`revision/`. **Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la
-tarea.** Los MENOR que se corrijan no abren ronda 2: basta la suite en verde,
-el commit de correccion y su nota en el `## Resultado`. La ronda 2 solo se
-pide si se corrigio algun CRITICO o IMPORTANTE (veredicto `cambios-solicitados`):
-`taskctl review` sobre la tarea en revision la genera con solo el diff desde
-la ronda anterior y los hallazgos aun abiertos de su tabla, sin integrar la
-rama base (eso lo hace `finish`). Las correcciones son justo donde se cuelan
-los fallos nuevos. El revisor corre la suite completa una vez por ronda; los
-mutantes, con el fichero de test concreto.
-
-### La linea del veredicto
-
-`finish` decide si la tarea puede cerrarse leyendo el informe de mayor N, y lo
-hace **fail-closed** a proposito: una version anterior buscaba la palabra
-"aprobada" en cualquier parte y aprobaba literalmente "no aprobada".
-
-**Escribirla con el comando, no a mano:**
-`taskctl veredicto TASK-NNN aprobada | aprobada-con-correcciones | cambios-solicitados`
-deja una unica linea canonica en lugar de todas las que hubiera (porque *todas*
-tienen que aprobar) y la commitea. En una ronda fragmentada por dominio, cada
-revisor firma la suya con `--informe <nombre>`.
-
-Lo que acepta el gate, y por que:
-
-| Linea | Resultado |
-|---|---|
-| `- Veredicto: aprobada` | pasa |
-| `- Veredicto: aprobada con correcciones` | pasa (empieza por `aprobada`) |
-| `- Veredicto: **aprobada**` | pasa: el enfasis de markdown se ignora |
-| `- Veredicto: **APROBADO**` | falla: `aprobado` no es `aprobada` |
-| `- Veredicto: APROBADO CON CAMBIOS` | falla: `aprobado` no es `aprobada` |
-| `- Veredicto: cambios-solicitados` | falla, y es lo correcto si pides cambios |
-| `- Veredicto: PENDIENTE (...)` | falla: la plantilla sin sustituir |
-| `Veredicto: aprobada` (sin el guion) | falla: no cuenta como linea de veredicto |
-
-El matiz va en el **cuerpo** del informe, con la tabla de hallazgos de la
-plantilla (`ID | Severidad | Estado | Fichero`), no en esa linea.
+Antes de lanzar o de hacer una revision, y antes de escribir el veredicto, lee
+[revision.md](revision.md): quien revisa y como (reproducir, no leer el diff),
+la puerta determinista, la clasificacion CRITICO / IMPORTANTE / MENOR, las
+rondas, la plantilla del informe y la linea del veredicto que `finish` acepta,
+con su tabla. Es el mismo fichero que siguen las skills revisoras.
 
 ## Trampas que cuestan tiempo
 
-**Los scripts de Git-Flow se invocan como `bash script.sh`, nunca por ruta
-directa.** El bit de ejecucion no viaja por Git en todas las configuraciones.
-En Windows hay una segunda capa: `bash` desde PowerShell puede resolver al de
-WSL y reventar; hace falta el `bash` de Git con su directorio de utilidades en
-el PATH, o se queda sin las herramientas que los scripts usan.
-
-**Los scripts escriben un registro de cada ejecucion** dentro del directorio
-de Git, en `taskcode/gitflow/gitflow-FECHA.log`. La ruta exacta la da
-`git rev-parse --git-path taskcode/gitflow`, y preguntarla es mejor que
-componerla: en un repo normal sale bajo `.git/`, pero en un **worktree
-enlazado** el directorio de Git es otro y el registro vive ahi. Va fuera del
-arbol de trabajo a proposito: durante
-mucho tiempo lo escribian dentro del repo, nada mas arrancar y antes de mirar
-si el workspace estaba limpio, asi que **se ensuciaban el workspace ellos
-mismos** y el comando de reanudar quedaba inservible en cualquier repo que no
-ignorara esa ruta. No hace falta anadir nada al `.gitignore`.
-
-**La herramienta commitea solo lo que escribe** (mas las rutas de
-sincronizacion, si las hay): nunca un `git add` global. Los ficheros que se le
-pasen a `import` tienen que vivir **fuera** del repo: dentro, ensucian el
-workspace y abortan el propio import.
-
-**Los comandos que escriben en `tareas/` exigen estar en la rama base.** Son
-`new`, `import`, `plan` y `approve`. Si el workspace esta limpio **cambian de
-rama solos y lo dicen despues**; si esta sucio, abortan. `start`, `review` y
-`finish` solo exigen workspace limpio. Los ficheros sin trackear cuentan como
-sucio.
-
-**Sin terminal, stdin se ignora.** Los comandos que envuelven scripts
-interactivos heredan stdin solo si hay TTY. Sin el, el script recibe EOF y
-toma su valor por defecto — que a veces es "no hacer nada" y salir 0. Heredar
-siempre no es la alternativa segura: una tuberia abierta que nadie cierra
-cuelga el comando **para siempre**, y eso lo produce cualquier arnes de agente
-y tambien el runner de tests.
-
-**Un clon nuevo no hereda nada.** Ni dependencias, ni binarios compilados, ni
-identidad de Git. Instalar y compilar siempre, **y otra vez tras cada cambio
-de rama dentro del mismo clon**. Sin `user.email` y `user.name` configurados,
-cualquier commit falla.
-
-**Un fix de errno validado en una sola plataforma no esta validado.** Codigos
-distintos describen el mismo hecho segun el sistema operativo. Lo caro no es
-el bug: es que el test escrito para cerrarlo hereda el mismo punto ciego, pasa
-en local y cae en el CI de la otra plataforma.
-
-## Al cerrar una tarea
-
-1. Suite en verde **antes** de commitear.
-2. Smoke test manual de punta a punta si la tarea toca el CLI o Git. Ha
-   encontrado fallos **antes** que la revision mas de una vez, porque ejercita
-   el flujo real en vez del orden mas comodo.
-3. Criterios de aceptacion marcados en `tarea.md`, y seccion `## Resultado`
-   con que se implemento, que encontro la revision, que se corrigio y que se
-   dejo sin corregir. Es el unico sitio donde queda la experiencia: el diff no
-   la cuenta. (Nota: si existen criterios bajo "Tras el cierre", se verifican
-   despues de `finish` — ver "Criterios verificables tras el cierre
-   (post-finish)".)
-4. Actualizar el registro de progreso que use el proyecto.
-5. `taskctl finish`.
-
-Commits: mensajes en el idioma del proyecto, una rama por tarea, merge sin
-fast-forward. Si el repo tiene activada la politica de conservar ramas, no se
-borran tras el merge.
+Cuando un comando de `taskctl` o un script de Git-Flow falle de forma rara (se
+cuelga, sale 0 sin hacer nada, se queja del workspace o de la rama), y antes de
+trabajar en un clon nuevo o en Windows, lee [trampas.md](trampas.md).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
new file mode 100644
index 0000000..cb6e706
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/cierre.md
@@ -0,0 +1,71 @@
+# Cerrar una tarea
+
+Se lee antes de lanzar `taskctl finish`, y otra vez justo despues si la tarea
+tiene criterios que solo se verifican tras el merge.
+
+## Al cerrar una tarea
+
+1. Suite en verde **antes** de commitear.
+2. Smoke test manual de punta a punta si la tarea toca el CLI o Git. Ha
+   encontrado fallos **antes** que la revision mas de una vez, porque ejercita
+   el flujo real en vez del orden mas comodo.
+3. Criterios de aceptacion marcados en `tarea.md`, y seccion `## Resultado`
+   con que se implemento, que encontro la revision, que se corrigio y que se
+   dejo sin corregir. Es el unico sitio donde queda la experiencia: el diff no
+   la cuenta. (Nota: si existen criterios bajo "Tras el cierre", se verifican
+   despues de `finish` — ver "Criterios verificables tras el cierre
+   (post-finish)", mas abajo.)
+4. Actualizar el registro de progreso que use el proyecto.
+5. `taskctl finish`.
+
+Commits: mensajes en el idioma del proyecto, una rama por tarea, merge sin
+fast-forward. Si el repo tiene activada la politica de conservar ramas, no se
+borran tras el merge.
+
+## Criterios verificables tras el cierre (post-finish)
+
+Algunos criterios de aceptacion solo se pueden demostrar despues de que
+`taskctl finish` fusione la rama en la rama base: un CI que pase en verde tras
+el merge, una publicacion en produccion desde esa rama, o una ejecucion en vivo
+que dependa del merge realizado. Esos criterios **no se pueden marcar antes de
+cerrar la tarea**.
+
+**Como declararlos en `tarea.md`:**
+
+Dentro de la seccion `## Criterios de aceptacion`, añade una subseccion
+`### Tras el cierre` para los que solo se verifican despues de `finish`:
+
+```markdown
+## Criterios de aceptacion
+
+(Criterios normales que se verifican antes de finish)
+- [ ] El parser acepta ficheros UTF-8 con BOM.
+- [ ] La sintaxis de error da consejos especificos.
+
+### Tras el cierre
+
+(Se verifican despues de finish, en la rama base)
+- [ ] La rama base pasa el CI a verde.
+- [ ] La documentacion se publica automaticamente en main.
+```
+
+**Reglas:**
+
+- Los criterios normales **deben estar todos marcados antes de `finish`**.
+  `finish` no lee las casillas: lo comprueba quien cierra y el revisor.
+- Los de "Tras el cierre" no cuentan para cerrar.
+- Despues de cerrar, quien lanzo `finish` verifica esos criterios en la rama
+  base mientras se resuelven los detalles de publicacion o despliegue.
+- La evidencia de que pasaron se registra en **un commit posterior**, en la
+  seccion `## Resultado` de la tarea en su carpeta de terminadas (o en el
+  registro de progreso del proyecto si la estructura es distinta).
+
+**Si un criterio post-cierre falla:**
+
+No se reabre la tarea ya cerrada. En su lugar:
+
+1. Documenta el fallo en el `## Resultado` de la tarea cerrada: qué
+   criterio fallo, por que, y que evidencia se recopilo.
+2. Abre una tarea **nueva de tipo `fix`** (en `00-planificadas/`) que corrija
+   el problema. Referencia la tarea original en su descripcion.
+3. Sigue el flujo normal: `plan`, `approve`, `start`, revision, `finish`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/prerrequisitos.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/prerrequisitos.md
new file mode 100644
index 0000000..6bd56e9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/prerrequisitos.md
@@ -0,0 +1,34 @@
+# Prerrequisitos del flujo de tareas
+
+Se lee cuando `taskctl` no responde o el repo no tiene rama `develop`. Si los
+dos estan en su sitio, no hace falta nada de lo que sigue.
+
+**Prerrequisito 1 — `taskctl` disponible**: lo aporta este mismo plugin. Su
+ejecutable vive en `bin/`, que Claude Code anade al PATH del Bash tool
+mientras el plugin este habilitado, y no hay que compilar ni instalar nada
+aparte. Comprobarlo con `taskctl --version`, que debe imprimir un numero de
+version. Si no responde, en este orden:
+
+1. Reinicia la sesion de Claude Code. El PATH se compone al arrancar, asi que
+   un plugin instalado a mitad de sesion no aparece hasta la siguiente.
+2. Si sigue sin responder, mira **primero** si la variable tiene valor:
+   `echo "$CLAUDE_PLUGIN_ROOT"`.
+   - Si imprime una ruta, invocalo por ahi:
+     `node "$CLAUDE_PLUGIN_ROOT/bin/taskctl" --version`. Todos los comandos de
+     la skill de flujo funcionan igual por esa via.
+   - **Si sale vacia, este paso no aplica y no dice nada** sobre si el plugin
+     esta activo: esa variable no esta exportada en todos los entornos, y
+     usarla vacia construye una ruta que no existe (`/bin/taskctl`) y falla
+     por un motivo que no tiene nada que ver.
+3. Solo si el paso 2 llego a ejecutarse con una ruta que **contiene de verdad
+   `bin/taskctl`** y aun asi no respondio, el plugin no esta activo y ningun
+   paso de la skill de flujo va a funcionar. Si la ruta apuntaba a otro sitio,
+   el fallo no dice nada: vuelve al paso 1.
+
+No des por hecho el paso 3 al primer `command not found`: el caso normal es
+el 1.
+
+**Prerrequisito 2**: el repo necesita una rama `develop`. Los comandos la
+esperan por nombre para las tareas de tipo `feature`, `fix` y `release`; las
+de tipo `hotfix` van contra la principal (`main` o `master`, lo que exista).
+Sin `develop`, el primer comando que escriba en `tareas/` ya falla.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
new file mode 100644
index 0000000..6f81468
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -0,0 +1,184 @@
+# La revision por pares
+
+Lo comun a toda revision por pares: lo lee quien orquesta antes de lanzar al
+revisor, y cada skill revisora antes de empezar. Lo propio de cada dominio
+(que ficheros le llegan, que se revisa, como se reproduce alli y ejemplos de
+cada severidad) esta en la skill revisora; esto es lo que no cambia de una a
+otra.
+
+## Quien y como
+
+**Quien.** Un agente que no implemento la tarea. La independencia es el punto,
+no un formalismo.
+
+**Como.** No es leer el diff y opinar. Es clonar el repo a un directorio
+temporal, compilar, correr la suite uno mismo, y **construir el caso que rompe
+el codigo antes de reportarlo**. Lo que mas hallazgos ha dado:
+
+- **Mutacion**: romper a proposito cada proteccion y ver si algun test se
+  entera. Asi se descubre que un flag defensivo se habia quedado sin cobertura.
+- **Ejercitar el CLI real**, no solo la API interna.
+- **Comprobar los tests que cambiaron de expectativa**: que sigan aseverando
+  lo mismo y no escondan una regresion.
+- **Reconstruir el build**: un clon no hereda binarios compilados, y cada rama
+  compila algo distinto.
+
+**Una sola ejecucion de la suite por ronda:** la puerta y la linea base son la
+misma pasada de la suite completa; no se repite. Los mutantes se comprueban
+con el fichero o la clase de test concretos que cubren la linea mutada, no con
+la suite entera. Con varios revisores en paralelo en la misma maquina, la
+suite se corre con concurrencia reducida o por turnos: si no, compiten por la
+CPU y todas tardan mas.
+
+## Antes de revisar: la puerta determinista
+
+La revision **no empieza** hasta que pasan, en este orden:
+
+1. **Build o compilacion**, con el comando que use el proyecto.
+2. **Linter / formateador**, en modo verificacion.
+3. **La suite de tests existente**, entera.
+
+Si algo de eso falla, la revision **se detiene ahi**: se reporta el fallo y se
+devuelve la tarea. Cero tokens gastados revisando codigo que no compila o que
+ya tiene la suite en rojo. Un fallo de la puerta no es un hallazgo de
+revision: es un requisito que no se cumplio.
+
+Si el proyecto no tiene alguno de los tres pasos, dilo en el informe. "No hay
+linter configurado" es informacion; suponer que se ejecuto, no.
+
+## Clasificacion
+
+CRITICO: perdida de datos, corrupcion de estado, o el comando hace lo
+contrario de lo que dice. IMPORTANTE: comportamiento incorrecto en un caso
+real, no de borde. MENOR: todo lo demas. Cada skill revisora da ejemplos de
+cada una en su dominio.
+
+**Todos los hallazgos se documentan, tambien los que se decide no corregir**,
+con el motivo. Sin esa nota, el siguiente lector concluye que hay un bug donde
+hay una decision. Un "sin hallazgos" explicito es una respuesta valida;
+inventar hallazgos para tener algo que reportar, no.
+
+## Rondas
+
+Se numeran: `peticion-revision-N.md` e `informe-revision-N.md` en
+`revision/`. **Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la
+tarea.** Los MENOR que se corrijan no abren ronda 2: basta la suite en verde,
+el commit de correccion y su nota en el `## Resultado`. La ronda 2 solo se
+pide si se corrigio algun CRITICO o IMPORTANTE (veredicto `cambios-solicitados`):
+`taskctl review` sobre la tarea en revision la genera con solo el diff desde
+la ronda anterior y los hallazgos aun abiertos de su tabla, sin integrar la
+rama base (eso lo hace `finish`). Esa ronda revisa el delta de la correccion
+y comprueba **cada uno de esos hallazgos**: las correcciones son justo donde
+se cuelan los fallos nuevos. El revisor corre la suite completa una vez por
+ronda; los mutantes, con el fichero de test concreto.
+
+## El informe
+
+`taskctl review` deja el esqueleto del informe en la carpeta de revision de
+la tarea, numerado por ronda. Se escribe sobre ese fichero, sin borrar la
+peticion, y **respetando su cabecera**: el titulo tal cual, la linea
+`- Commit revisado:` con el sha, la linea `- Revisor:` con el nombre de la
+skill revisora, y la linea `- Veredicto:`, que se **sustituye** en su sitio —
+nunca se borra de la cabecera ni se repite mas abajo. La cabecera de cada
+revisor, con su nombre, esta en su skill.
+
+Cada hallazgo, bajo `## Hallazgos`, con esta plantilla:
+
+```markdown
+### CRITICO-1 — <titulo corto>
+- Donde: <fichero:linea>
+- Que pasa: <comportamiento observado, en una o dos frases>
+- Reproduccion: <los pasos exactos que se ejecutaron, y su salida>
+- Impacto: <la consecuencia concreta para quien use esto>
+- Sugerencia: <la direccion de la correccion, no el parche>
+
+### IMPORTANTE-1 — <titulo corto>
+<mismos campos>
+
+### MENOR-1 — <titulo corto>
+<mismos campos, mas si se propone no corregirlo y por que>
+```
+
+Si no hay nada que reportar, la seccion de hallazgos dice **"sin hallazgos"**
+de forma explicita, y se anade que se ejecuto para llegar a esa conclusion:
+que comandos, que suite, que mutaciones. Un "sin hallazgos" sin esa lista no
+se distingue de no haber mirado.
+
+El matiz va en el **cuerpo** del informe, con la tabla de hallazgos de la
+plantilla (`ID | Severidad | Estado | Fichero`), no en la linea del
+veredicto.
+
+## La linea del veredicto
+
+`finish` decide si la tarea puede cerrarse leyendo el informe de mayor N, y lo
+hace **fail-closed** a proposito: una version anterior buscaba la palabra
+"aprobada" en cualquier parte y aprobaba literalmente "no aprobada".
+
+**Escribirla con el comando, no a mano:**
+`taskctl veredicto TASK-NNN aprobada | aprobada-con-correcciones | cambios-solicitados`
+deja una unica linea canonica en lugar de todas las que hubiera (porque *todas*
+tienen que aprobar) y la commitea. En una ronda fragmentada por dominio, cada
+revisor firma la suya con `--informe <nombre>`.
+
+Las reglas, si se escribe a mano: cuenta la linea que, sin espacios delante y
+en minusculas, empieza por `- veredicto:`. Su valor, sin el enfasis de
+markdown (asteriscos, guiones bajos, comillas invertidas) y en minusculas,
+tiene que **empezar** por la palabra `aprobada`, y no puede contener la
+palabra `pendiente` ni la cadena `cambios-solicitados`. Si el informe tiene
+varias lineas de veredicto, **todas** tienen que aprobar — por eso se
+**sustituye** la linea de la plantilla, no se anade otra debajo.
+
+Criterio para elegirlo, y no es negociable: **CRITICO o IMPORTANTE sin
+corregir implica `cambios-solicitados`**. Con solo hallazgos MENOR se puede
+aprobar, siempre que queden documentados con su motivo.
+
+Lo que acepta el gate, y por que:
+
+| Linea escrita | Resultado |
+|---|---|
+| `- Veredicto: aprobada` | aprueba |
+| `- Veredicto: aprobada-con-correcciones` | aprueba: es la que escribe `taskctl veredicto` |
+| `- Veredicto: aprobada con correcciones menores` | aprueba: el valor empieza por `aprobada` |
+| `- Veredicto: **aprobada**` | aprueba: el enfasis de markdown se ignora |
+| `- Veredicto: **APROBADA**` | aprueba: el enfasis y las mayusculas se ignoran |
+| `- Veredicto: aprobado` | no aprueba: `aprobado` no es `aprobada` |
+| `- Veredicto: **APROBADO**` | no aprueba: `aprobado` no es `aprobada` |
+| `- Veredicto: APROBADO CON CAMBIOS` | no aprueba: `aprobado` no es `aprobada` |
+| `- Veredicto: cambios-solicitados` | no aprueba, y es lo correcto si hay CRITICO o IMPORTANTE |
+| `- Veredicto: rechazada` | no aprueba |
+| `- Veredicto: no aprobada` | no aprueba: el valor no *empieza* por `aprobada` |
+| `- Veredicto: PENDIENTE (rellenar)` | no aprueba: es la plantilla sin sustituir |
+| `Veredicto: aprobada` (sin el guion) | no aprueba: no cuenta como linea de veredicto |
+| (sin ninguna linea de veredicto) | no aprueba |
+
+Un revisor que escriba el veredicto en su propio vocabulario bloquea el cierre
+y obliga a un commit de normalizacion que no arregla nada.
+
+## Lo que un revisor no hace
+
+- **No implementa la correccion.** Escribe el caso que falla y donde, y
+  propone el arreglo en el informe; lo aplica quien implemento la tarea.
+- **No reescribe el codigo ajeno** ni "aprovecha para" refactorizar,
+  renombrar o reordenar, ni commitea en la rama revisada. Los unicos ficheros
+  que toca son los suyos temporales y el informe. Un revisor que edita deja de
+  ser independiente, y la siguiente ronda ya no tiene a nadie que la revise.
+- **No redisena la tarea.** Si la implementacion contradice al diseno, se
+  documenta la divergencia; cambiarlo es una decision de la persona
+  responsable.
+- **No aprueba por simpatia.** Si hay un CRITICO o un IMPORTANTE sin
+  corregir, el veredicto es `cambios-solicitados`, aunque el resto del diff
+  este impecable, aunque "casi todo este bien", aunque la tarea vaya con prisa
+  o por la tercera ronda, y aunque el hallazgo obligue a repetir trabajo.
+- **No inventa hallazgos** para que el informe no salga vacio ni para
+  justificar el pase.
+- **No convierte preferencias de estilo en bloqueos.** Si no puedes nombrar el
+  fallo que produce, es MENOR.
+- **No sustituye a la puerta determinista** (build, linter, tests). Si esa
+  puerta esta en rojo, no hay nada que revisar todavia.
+- **No mueve la tarea de estado, no mergea y no commitea.** Eso es trabajo de
+  `taskctl finish`, y solo ocurre si el veredicto aprueba.
+- **No revisa el repositorio entero**: revisa el diff que le llega. Si de
+  verdad necesita mas contexto, lo pide para un hallazgo concreto.
+- **Un revisor de dominio no revisa ficheros fuera de sus patrones**: si al
+  leer el diff aparece algo de otro dominio que preocupa, se anota en una
+  linea y se deja para su revisor, no se juzga alli.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/trampas.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/trampas.md
new file mode 100644
index 0000000..f460614
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/trampas.md
@@ -0,0 +1,50 @@
+# Trampas que cuestan tiempo
+
+Se lee cuando un comando de `taskctl` o un script de Git-Flow falla de forma
+rara (se cuelga, sale 0 sin hacer nada, se queja del workspace o de la rama),
+y antes de trabajar en un clon nuevo o en Windows.
+
+**Los scripts de Git-Flow se invocan como `bash script.sh`, nunca por ruta
+directa.** El bit de ejecucion no viaja por Git en todas las configuraciones.
+En Windows hay una segunda capa: `bash` desde PowerShell puede resolver al de
+WSL y reventar; hace falta el `bash` de Git con su directorio de utilidades en
+el PATH, o se queda sin las herramientas que los scripts usan.
+
+**Los scripts escriben un registro de cada ejecucion** dentro del directorio
+de Git, en `taskcode/gitflow/gitflow-FECHA.log`. La ruta exacta la da
+`git rev-parse --git-path taskcode/gitflow`, y preguntarla es mejor que
+componerla: en un repo normal sale bajo `.git/`, pero en un **worktree
+enlazado** el directorio de Git es otro y el registro vive ahi. Va fuera del
+arbol de trabajo a proposito: durante
+mucho tiempo lo escribian dentro del repo, nada mas arrancar y antes de mirar
+si el workspace estaba limpio, asi que **se ensuciaban el workspace ellos
+mismos** y el comando de reanudar quedaba inservible en cualquier repo que no
+ignorara esa ruta. No hace falta anadir nada al `.gitignore`.
+
+**La herramienta commitea solo lo que escribe** (mas las rutas de
+sincronizacion, si las hay): nunca un `git add` global. Los ficheros que se le
+pasen a `import` tienen que vivir **fuera** del repo: dentro, ensucian el
+workspace y abortan el propio import.
+
+**Los comandos que escriben en `tareas/` exigen estar en la rama base.** Son
+`new`, `import`, `plan` y `approve`. Si el workspace esta limpio **cambian de
+rama solos y lo dicen despues**; si esta sucio, abortan. `start`, `review` y
+`finish` solo exigen workspace limpio. Los ficheros sin trackear cuentan como
+sucio.
+
+**Sin terminal, stdin se ignora.** Los comandos que envuelven scripts
+interactivos heredan stdin solo si hay TTY. Sin el, el script recibe EOF y
+toma su valor por defecto — que a veces es "no hacer nada" y salir 0. Heredar
+siempre no es la alternativa segura: una tuberia abierta que nadie cierra
+cuelga el comando **para siempre**, y eso lo produce cualquier arnes de agente
+y tambien el runner de tests.
+
+**Un clon nuevo no hereda nada.** Ni dependencias, ni binarios compilados, ni
+identidad de Git. Instalar y compilar siempre, **y otra vez tras cada cambio
+de rama dentro del mismo clon**. Sin `user.email` y `user.name` configurados,
+cualquier commit falla.
+
+**Un fix de errno validado en una sola plataforma no esta validado.** Codigos
+distintos describen el mismo hecho segun el sistema operativo. Lo caro no es
+el bug: es que el test escrito para cerrarlo hereda el mismo punto ciego, pasa
+en local y cae en el CI de la otra plataforma.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
index 1fcba59..7615c97 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
@@ -124,6 +124,21 @@ async function leer(nombre: string): Promise<string> {
   return readFile(rutaSkill(nombre), 'utf8');
 }
 
+/**
+ * Lo comun a las cuatro revisoras (plantilla de hallazgos, rondas, linea del
+ * veredicto con su tabla, lo que un revisor no hace) vive una sola vez en la
+ * skill de flujo, desde TASK-048: cuatro copias ya habian divergido (las
+ * cuatro decian que `**aprobada**` no aprueba despues de que el gate empezara
+ * a recortar el enfasis). Cada revisora lo enlaza con esta ruta relativa.
+ */
+const REVISION_MD = path.join(SKILLS_DIR, 'task-workflow', 'revision.md');
+const ENLACE_A_REVISION = '](../task-workflow/revision.md)';
+
+/** Lo que lee de verdad un revisor: su skill mas la referencia comun. */
+async function textoEfectivo(nombre: string): Promise<string> {
+  return `${await leer(nombre)}\n${await readFile(REVISION_MD, 'utf8')}`;
+}
+
 /**
  * Extrae el primer bloque ```yaml del cuerpo y lo parsea con el parser del
  * repo. Devuelve tambien las lineas crudas: el parser aplana lo que puede,
@@ -566,7 +581,7 @@ test('7. la linea de veredicto que cada skill prescribe la ACEPTA finish.ts', as
 
 test('8. cada skill prescribe tambien la forma de NO aprobar, y finish.ts la rechaza', async () => {
   for (const nombre of REVISORES) {
-    const texto = await leer(nombre);
+    const texto = await textoEfectivo(nombre);
     assert.ok(
       texto.includes('cambios-solicitados'),
       `${nombre}: no dice como pedir cambios; sin eso solo sabe aprobar`
@@ -905,11 +920,144 @@ test('10c. las cuatro prescriben el esqueleto que taskctl review genera de verda
   }
 });
 
+// --- 3ter. Lo comun, en un solo sitio (TASK-048) -------------------------
+
+test('10d. cada revisora enlaza la referencia comun, y la referencia existe', async () => {
+  await readFile(REVISION_MD, 'utf8'); // lanza si no existe
+  for (const nombre of REVISORES) {
+    assert.ok(
+      (await leer(nombre)).includes(ENLACE_A_REVISION),
+      `${nombre}: no enlaza ${ENLACE_A_REVISION.slice(2, -1)}, donde vive lo comun a toda revision`
+    );
+  }
+});
+
+/**
+ * Frases que solo pueden estar en revision.md. Si una revisora vuelve a
+ * copiarlas, hay dos sitios que mantener y el dia que se toque uno solo
+ * divergen, que es lo que ya paso con la tabla del veredicto.
+ */
+const SOLO_EN_REVISION = [
+  'Una sola ejecucion de la suite por ronda',
+  '- Sugerencia: <la direccion de la correccion, no el parche>',
+  '### IMPORTANTE-1 — <titulo corto>',
+  'No aprueba por simpatia',
+  'Un revisor que escriba el veredicto en su propio vocabulario',
+];
+
+/** Fila de una tabla de veredictos, con o sin el guion de la linea. */
+const FILA_DE_VEREDICTO = /^\|\s*`-?\s*Veredicto:/im;
+
+async function todosLosMd(): Promise<string[]> {
+  const ficheros: string[] = [];
+  for (const dir of await readdir(SKILLS_DIR, { withFileTypes: true })) {
+    if (!dir.isDirectory()) continue;
+    for (const f of await readdir(path.join(SKILLS_DIR, dir.name))) {
+      if (f.endsWith('.md')) ficheros.push(path.join(SKILLS_DIR, dir.name, f));
+    }
+  }
+  return ficheros;
+}
+
+test('10e. lo comun a las revisoras y la tabla del veredicto viven solo en revision.md', async () => {
+  const comun = await readFile(REVISION_MD, 'utf8');
+  for (const frase of SOLO_EN_REVISION) {
+    assert.ok(comun.includes(frase), `revision.md ya no contiene "${frase}": el test no mide nada`);
+  }
+  assert.ok(FILA_DE_VEREDICTO.test(comun), 'revision.md no tiene la tabla del veredicto');
+
+  const ficheros = (await todosLosMd()).filter((f) => path.resolve(f) !== path.resolve(REVISION_MD));
+  assert.ok(ficheros.length >= 15, `solo se encontraron ${ficheros.length} .md en skills/`);
+  for (const fichero of ficheros) {
+    const texto = await readFile(fichero, 'utf8');
+    const rel = path.relative(SKILLS_DIR, fichero);
+    for (const frase of SOLO_EN_REVISION) {
+      assert.ok(!texto.includes(frase), `${rel}: copia "${frase}", que vive en revision.md`);
+    }
+    assert.ok(!FILA_DE_VEREDICTO.test(texto), `${rel}: tiene su propia tabla del veredicto`);
+  }
+});
+
+/** Las filas de la tabla del veredicto de revision.md, tal cual. */
+function filasDeVeredicto(texto: string): Array<{ celda: string; resultado: string }> {
+  const filas: Array<{ celda: string; resultado: string }> = [];
+  let enTabla = false;
+  for (const linea of texto.split(/\r?\n/)) {
+    if (/^\|\s*Linea escrita\s*\|\s*Resultado\s*\|/.test(linea)) {
+      enTabla = true;
+      continue;
+    }
+    if (!enTabla) continue;
+    if (!linea.startsWith('|')) break;
+    if (/^\|[\s|:-]+$/.test(linea)) continue; // separador |---|---|
+    const celdas = linea.split('|').slice(1, -1).map((c) => c.trim());
+    filas.push({ celda: celdas[0] ?? '', resultado: celdas[1] ?? '' });
+  }
+  return filas;
+}
+
+/** Que informe representa la primera celda: su codigo, o nada si no hay linea. */
+function informeDeCelda(celda: string): string {
+  const codigo = /^`([^`]+)`/.exec(celda);
+  if (codigo) return codigo[1] as string;
+  assert.equal(celda, '(sin ninguna linea de veredicto)', `celda que el test no sabe leer: "${celda}"`);
+  return '';
+}
+
+/** Lo que la tabla dice del resultado: aprueba (true) o no (false). */
+function resultadoDeCelda(resultado: string): boolean {
+  if (/^no aprueba\b/i.test(resultado)) return false;
+  if (/^aprueba\b/i.test(resultado)) return true;
+  return assert.fail(`resultado que el test no sabe leer: "${resultado}"`);
+}
+
+test('10f. cada fila de la tabla del veredicto de revision.md dice lo que hace finish.ts', async () => {
+  const filas = filasDeVeredicto(await readFile(REVISION_MD, 'utf8'));
+  // Guard de no-vacuidad: si la cabecera cambia, filasDeVeredicto no lee
+  // nada y el bucle de abajo saldria verde sin comprobar ninguna fila.
+  assert.ok(filas.length >= 10, `la tabla tiene ${filas.length} filas: no se esta leyendo`);
+  const dice = filas.map((f) => resultadoDeCelda(f.resultado));
+  assert.ok(dice.includes(true) && dice.includes(false), 'la tabla tiene que tener filas que aprueban y que no');
+
+  const mal: string[] = [];
+  for (const [i, fila] of filas.entries()) {
+    const real = veredictoAprobado(informeDeCelda(fila.celda));
+    if (real !== dice[i]) {
+      mal.push(`  ${fila.celda}: la tabla dice "${fila.resultado}" y finish.ts ${real ? 'aprueba' : 'no aprueba'}`);
+    }
+  }
+  assert.deepEqual(mal, [], `filas de la tabla que no coinciden con veredictoAprobado:\n${mal.join('\n')}`);
+});
+
+test('10g. la lectura de la tabla discrimina (contraprueba del 10f)', () => {
+  const tabla = [
+    'texto antes',
+    '| Linea escrita | Resultado |',
+    '|---|---|',
+    '| `- Veredicto: aprobada` | aprueba |',
+    '| (sin ninguna linea de veredicto) | no aprueba |',
+    '',
+    '| `- Veredicto: fuera de la tabla` | aprueba |',
+  ].join('\n');
+  const filas = filasDeVeredicto(tabla);
+  assert.equal(filas.length, 2, 'la tabla no acaba en la primera linea que no es fila');
+  assert.equal(informeDeCelda(filas[0]?.celda ?? ''), '- Veredicto: aprobada');
+  assert.equal(informeDeCelda(filas[1]?.celda ?? ''), '');
+  assert.equal(resultadoDeCelda('no aprueba: motivo'), false, '"no aprueba" se lee como aprueba');
+  assert.equal(resultadoDeCelda('aprueba: motivo'), true);
+  assert.throws(() => resultadoDeCelda('pasa'), 'un resultado ilegible no puede contar como ninguno');
+  assert.throws(() => informeDeCelda('linea sin codigo'), 'una celda ilegible no puede contar como informe vacio');
+});
+
 // --- 4. Portabilidad ----------------------------------------------------
 
 test('11. ninguna skill arrastra marcas de este repo ni rutas de maquina', async () => {
-  for (const nombre of REVISORES) {
-    const texto = await leer(nombre);
+  // revision.md entra con la lista estricta de las revisoras: es parte de lo
+  // que cada una lee, aunque viva en la carpeta de la skill de flujo.
+  const ficheros: Array<[string, string]> = REVISORES.map((n) => [n, rutaSkill(n)]);
+  ficheros.push(['task-workflow/revision.md', REVISION_MD]);
+  for (const [nombre, ruta] of ficheros) {
+    const texto = await readFile(ruta, 'utf8');
     const enMinusculas = texto.toLowerCase();
 
     for (const marca of MARCAS_DEL_REPO) {
@@ -991,7 +1139,8 @@ test(
       await cp(path.join(PLUGIN_ROOT, '.claude-plugin'), path.join(copia, '.claude-plugin'), {
         recursive: true,
       });
-      for (const nombre of REVISORES) {
+      // task-workflow viaja con ellas: las cuatro enlazan su revision.md.
+      for (const nombre of [...REVISORES, 'task-workflow']) {
         await cp(path.join(SKILLS_DIR, nombre), path.join(copia, 'skills', nombre), {
           recursive: true,
         });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
index af15fca..6fd2ed9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
@@ -494,6 +494,162 @@ test('17. la skill enumera los roles de brainstorm en el orden de prioridad del
   );
 });
 
+// --- 1ter. Una skill ligera y sus referencias bajo demanda (TASK-048) -----
+//
+// El cuerpo de SKILL.md se carga entero cada vez que la skill se invoca, y
+// la description de cada skill en TODAS las sesiones. Lo que solo hace falta
+// en un momento concreto (prerrequisitos, cierre, revision, trampas) vive en
+// ficheros hermanos que SKILL.md enlaza diciendo cuando leerlos. Estos tests
+// impiden que el cuerpo vuelva a engordar, que un enlace a una referencia se
+// rompa y que una referencia nueva arrastre marcas de este repo.
+
+/** 15 KB: por encima, la skill vuelve a pesar lo que pesaba antes de partirla. */
+const MAX_BYTES_SKILL = 15360;
+
+/** La description se carga en todas las sesiones, se use la skill o no. */
+const MAX_DESCRIPTION_CORTA = 300;
+
+/** Directorios de skill del plugin, del listado real. */
+async function dirsDeSkill(): Promise<string[]> {
+  const entradas = await readdir(SKILLS_DIR, { withFileTypes: true });
+  const dirs: string[] = [];
+  for (const e of entradas) {
+    if (e.isDirectory() && (await existe(path.join(SKILLS_DIR, e.name, SKILL_FILE_NAME)))) {
+      dirs.push(e.name);
+    }
+  }
+  return dirs;
+}
+
+/** Los .md de task-workflow: SKILL.md y sus referencias hermanas. */
+async function mdsDeTaskWorkflow(): Promise<string[]> {
+  return (await readdir(SKILL_DIR)).filter((f) => f.endsWith('.md')).map((f) => path.join(SKILL_DIR, f));
+}
+
+/** Destinos relativos a un .md de los enlaces markdown de un texto. */
+function enlacesRelativosAMd(texto: string): string[] {
+  const destinos: string[] = [];
+  const re = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
+  let m: RegExpExecArray | null;
+  while ((m = re.exec(texto)) !== null) {
+    const destino = (m[1] ?? '').split('#')[0] ?? '';
+    if (destino === '' || /^(?:https?:|mailto:)/i.test(destino)) continue;
+    if (destino.endsWith('.md')) destinos.push(destino);
+  }
+  return destinos;
+}
+
+test('18. task-workflow/SKILL.md pesa menos de 15 KB', async () => {
+  const bytes = (await leerSkillBytes()).length;
+  assert.ok(
+    bytes < MAX_BYTES_SKILL,
+    `SKILL.md pesa ${bytes} bytes (limite ${MAX_BYTES_SKILL}): lo que solo se lee en un momento ` +
+      'concreto va a un fichero hermano enlazado desde el cuerpo, no al cuerpo'
+  );
+});
+
+test('19. toda skill del plugin tiene una description de 300 caracteres o menos', async () => {
+  const dirs = await dirsDeSkill();
+  // Guard de no-vacuidad: task-workflow, las cuatro revisoras y las fases.
+  assert.ok(dirs.length >= 12, `solo se encontraron ${dirs.length} skills: ${dirs.join(', ')}`);
+  const largas: string[] = [];
+  for (const dir of dirs) {
+    const { data } = parseFrontmatter(await readFile(path.join(SKILLS_DIR, dir, SKILL_FILE_NAME), 'utf8'));
+    const d = data.description;
+    assert.equal(typeof d, 'string', `${dir}: sin description`);
+    if ((d as string).length > MAX_DESCRIPTION_CORTA) largas.push(`${dir} (${(d as string).length})`);
+  }
+  assert.deepEqual(largas, [], `descriptions de mas de ${MAX_DESCRIPTION_CORTA} caracteres: ${largas.join(', ')}`);
+});
+
+test('20. todo enlace relativo a un .md desde un SKILL.md o desde las referencias de task-workflow existe', async () => {
+  const origenes = [
+    ...(await dirsDeSkill()).map((d) => path.join(SKILLS_DIR, d, SKILL_FILE_NAME)),
+    ...(await mdsDeTaskWorkflow()).filter((f) => path.basename(f) !== SKILL_FILE_NAME),
+  ];
+  let comprobados = 0;
+  const rotos: string[] = [];
+  for (const origen of origenes) {
+    for (const rel of enlacesRelativosAMd(await readFile(origen, 'utf8'))) {
+      comprobados++;
+      const absoluta = path.resolve(path.dirname(origen), rel);
+      if (!(await existe(absoluta))) rotos.push(`${path.relative(SKILLS_DIR, origen)} -> ${rel}`);
+    }
+  }
+  // Guard de no-vacuidad: SKILL.md enlaza al menos sus seis referencias y
+  // cada revisora la suya. Si el patron dejara de casar, esto saldria verde.
+  assert.ok(comprobados >= 10, `solo se comprobaron ${comprobados} enlaces: el patron no casa`);
+  assert.deepEqual(rotos, [], `enlaces a .md rotos: ${rotos.join(' | ')}`);
+});
+
+test('20b. SKILL.md enlaza cada referencia hermana: ninguna queda huerfana', async () => {
+  const body = parseFrontmatter(await leerSkillTexto()).body;
+  const enlazadas = new Set(enlacesRelativosAMd(body));
+  const hermanas = (await mdsDeTaskWorkflow()).map((f) => path.basename(f)).filter((f) => f !== SKILL_FILE_NAME);
+  for (const esperada of ['prerrequisitos.md', 'cierre.md', 'trampas.md', 'revision.md']) {
+    assert.ok(hermanas.includes(esperada), `falta la referencia ${esperada}`);
+  }
+  const huerfanas = hermanas.filter((h) => !enlazadas.has(h));
+  assert.deepEqual(huerfanas, [], `referencias que SKILL.md no enlaza (nadie las leeria): ${huerfanas.join(', ')}`);
+});
+
+/**
+ * Marcas de ESTE repo para los .md de task-workflow. Es la lista de las
+ * skills de fase y no la estricta de las revisoras, a proposito: esta skill
+ * SI nombra `tareas/`, `plan-final.md`, `taskctl` y los ficheros que el
+ * plugin escribe en el proyecto del usuario. Lo que puede contener
+ * "taskcode" esta acotado en `PERMITIDO_CON_TASKCODE`.
+ */
+const MARCAS_DEL_REPO = [
+  'taskcode',
+  'docs/contexto',
+  'propuesta_metodologia',
+  'checklist_terminacion',
+  'plan_sprints',
+  'hallazgos.md',
+  'task-0',
+  'ieca',
+  'movetareafile',
+  'printclierror',
+  'veredictoaprobado',
+  'informetemplate',
+  'src/commands/',
+  'src/core/',
+];
+
+/**
+ * Lo unico que puede llevar "taskcode": el prefijo con que se invocan las
+ * skills, la carpeta de configuracion y la del registro de Git-Flow (los
+ * dos se crean en el proyecto del usuario).
+ */
+const PERMITIDO_CON_TASKCODE = ['taskcode-plugin', '.taskcode/', 'taskcode/gitflow'];
+
+/** Documentos que el plugin si escribe o pone de ejemplo en el proyecto del usuario. */
+const DOCUMENTOS_DEL_USUARIO = ['docs/BOARD.md', 'docs/PLAN.md'];
+const DOCUMENTO_INTERNO = /docs\/[A-Z_]+\.md/;
+
+test('21. ningun .md de task-workflow arrastra marcas de este repo ni rutas de maquina', async () => {
+  const ficheros = await mdsDeTaskWorkflow();
+  assert.ok(ficheros.length >= 7, `solo hay ${ficheros.length} .md en task-workflow`);
+  for (const fichero of ficheros) {
+    const nombre = path.basename(fichero);
+    const texto = await readFile(fichero, 'utf8');
+    let minusculas = texto.toLowerCase();
+    for (const p of PERMITIDO_CON_TASKCODE) minusculas = minusculas.split(p).join('');
+    const marcas = MARCAS_DEL_REPO.filter((m) => minusculas.includes(m));
+    assert.deepEqual(marcas, [], `${nombre}: marcas de este repo, que no significan nada donde se instala`);
+
+    let sinDocsDelUsuario = texto;
+    for (const d of DOCUMENTOS_DEL_USUARIO) sinDocsDelUsuario = sinDocsDelUsuario.split(d).join('');
+    const doc = DOCUMENTO_INTERNO.exec(sinDocsDelUsuario);
+    assert.equal(doc, null, `${nombre}: nombra el documento interno "${doc?.[0]}"`);
+
+    for (const ruta of RUTAS_DE_MAQUINA) {
+      assert.ok(!texto.includes(ruta), `${nombre}: contiene la ruta de maquina "${ruta}"`);
+    }
+  }
+});
+
 // --- 2. De integracion: el validador oficial ----------------------------
 
 interface ResultadoValidate {
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-048/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-048/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-048/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````
