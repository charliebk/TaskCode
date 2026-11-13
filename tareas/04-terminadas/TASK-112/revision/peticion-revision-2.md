# Peticion de revision — TASK-112 (ronda 2)

- Tarea: TASK-112 — P-4: el revisor reutiliza la verificacion de ronda y las rondas 2+ solo relanzan al revisor con pendientes
- Rama revisada: feature/task-112-p-4-el-revisor-reutiliza-la-verificacion
- Rama base: develop
- Commit revisado (HEAD): 89aaec7f34145aa583ec3ba94a0cdfa9d5011581
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-112 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 96b3085e279665d8b519d63955b455d8d5f63bc8 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

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

- tareas/03-en-revision/TASK-112/tarea.md
- tareas/03-en-revision/TASK-112/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/informe-verificacion-commit.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md:26 | informe-revision-1.md |

## Commits a revisar (git log 96b3085e279665d8b519d63955b455d8d5f63bc8..HEAD)

````
89aaec7 fix(TASK-112): skills revisoras coherentes, texto de la peticion y tests (IMP-1, MEN-1..3)
f8cc9cf chore(TASK-112): veredicto ronda 1 (cambios-solicitados)
b48e59f chore(TASK-112): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 96b3085e279665d8b519d63955b455d8d5f63bc8..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
index 5669305..e7f6f76 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md
@@ -156,7 +156,9 @@ ejercita la vista.
    solo el servidor de desarrollo. Muchos errores de tipado solo salen ahi.
    Si no compila, ahi acaba la revision.
 4. **Correr la suite entera antes de tocar nada**, para tener la linea base.
-   Una sola vez por ronda (ver revision.md).
+   Una sola vez por ronda (ver revision.md). Si la peticion ya trae la verificacion de la ronda en verde con un
+   `Commit verificado` igual al `Commit revisado`, esa es la linea base: citala
+   y no la repitas.
 5. **Levantar la aplicacion y ejercitar la vista de verdad**, con el
    navegador, entrando y saliendo de la ruta y con datos que se parezcan a
    los reales en volumen.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
index 623e95f..d347090 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/java-spring-reviewer/SKILL.md
@@ -62,7 +62,9 @@ caso que lo demuestra**, no cuando parece que podria pasar.
 3. **Correr la suite entera antes de tocar nada**, para tener la linea base.
    Un test que ya estaba rojo antes del diff no es un hallazgo de esta
    tarea, pero si es un dato que va en el informe. Una sola vez por ronda
-   (ver revision.md).
+   (ver revision.md). Si la peticion ya trae la verificacion de la ronda en verde con un
+   `Commit verificado` igual al `Commit revisado`, esa es la linea base: citala
+   y no la repitas.
 4. **Construir el caso que rompe.** Un test nuevo que falla contra la rama,
    o una llamada real contra la aplicacion levantada. Lo que no se ha
    ejecutado no se afirma.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
index 712e959..585e082 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
@@ -165,7 +165,9 @@ cada llamada) casi nunca se ve leyendo: se ve ejecutando.
 4. **Correr la suite entera antes de tocar nada**, para tener la linea base:
    `cargo test --locked --workspace` (y los tests de WebAssembly con
    `wasm-pack test` o `wasm-bindgen-test-runner` si el proyecto los tiene).
-   Una sola vez por ronda (ver revision.md).
+   Una sola vez por ronda (ver revision.md). Si la peticion ya trae la verificacion de la ronda en verde con un
+   `Commit verificado` igual al `Commit revisado`, esa es la linea base: citala
+   y no la repitas.
 5. **Construir el caso que rompe**, con datos que se parezcan a los reales:
    el fichero de entrada real del proyecto si lo hay, valores extremos
    (vacio, un elemento, NaN, infinito, coordenadas grandes, longitudes casi
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index 80f607d..10175b5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -24,7 +24,10 @@ el codigo antes de reportarlo**. Lo que mas hallazgos ha dado:
   compila algo distinto.
 
 **Una sola ejecucion de la suite por ronda:** la puerta y la linea base son la
-misma pasada de la suite completa; no se repite. Los mutantes se comprueban
+misma pasada de la suite completa; no se repite. Si la peticion ya trae la
+verificacion de la ronda en verde con un `Commit verificado` igual al
+`Commit revisado`, esa es la pasada de la ronda: el revisor la cita y no la
+vuelve a correr. Los mutantes se comprueban
 con el fichero o la clase de test concretos que cubren la linea mutada, no con
 la suite entera. Con varios revisores en paralelo en la misma maquina, la
 suite se corre con concurrencia reducida o por turnos: si no, compiten por la
@@ -95,10 +98,14 @@ crecer con el tamano de la correccion, no con el del proyecto. Desde la ronda
 2, `taskctl review` genera la ronda como verificacion acotada, con la linea
 `- Alcance: verificacion acotada al diff de las correcciones`, tambien si la
 ronda anterior dejo CRITICOS o IMPORTANTES. Revisan los revisores que tienen
-hallazgos pendientes (todo lo que no esta `aceptado`, tambien lo `corregido`:
-la correccion es justo lo que se verifica), cada uno los suyos, y los de
-dominio cuyos ficheros toca la correccion; todos con el diff entero de la
-correccion. Se verifica cada hallazgo, se ejecuta la suite y se busca el
+hallazgos CRITICO o IMPORTANTE pendientes (todo lo que no esta `aceptado`,
+tambien lo `corregido`: la correccion es justo lo que se verifica), cada uno
+los suyos, y aquellos cuyos ficheros toca la correccion; todos con el diff
+entero de la correccion. Los MENORES no se reverifican (los comprueba quien
+coordina), y un revisor que solo tenia MENORES y cuyos ficheros no toca la
+correccion no recibe peticion: consta en `## Revisores no relanzados` de
+`tarea.md`. Se verifica cada hallazgo, se ejecuta la suite (salvo que la
+peticion ya la traiga en verde para el commit revisado) y se busca el
 fallo que abre la correccion, y solo se abre un hallazgo nuevo si es CRITICO
 o lo introduce la propia correccion; no se vuelve a revisar la rama entera.
 Un merge de la base entre rondas no la cambia: se nombra en el motivo y lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 9545de5..64bbe63 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -301,7 +301,7 @@ function instruccionesCompletas(nombreInforme: string): string {
     '## Instrucciones para el agente revisor\n\n' +
     'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
     'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
-    'directorio temporal, corre la suite tu mismo (TASK-112: salvo que esta\n' +
+    'directorio temporal, corre la suite tu mismo (salvo que esta\n' +
     'peticion ya traiga la verificacion de la ronda en verde para el commit revisado;\n' +
     'entonces vale ese resultado) y construye el caso que\n' +
     `rompe el codigo antes de reportarlo. ${CLASIFICACION} Vuelca tu salida en el\n` +
@@ -330,8 +330,8 @@ function instruccionesAcotadas(nombreInforme: string): string {
     '## Instrucciones para el agente revisor (verificacion acotada)\n\n' +
     'Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una\n' +
     'revision completa: esta ronda verifica las correcciones de la ronda anterior,\n' +
-    'no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (TASK-112:\n' +
-    'tu tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:\n\n' +
+    'no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu\n' +
+    'tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:\n\n' +
     '1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo\n' +
     '   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:\n' +
     '   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el\n' +
@@ -412,6 +412,8 @@ interface RondaPrevia {
    * no estan en `seccionesPorRevisor` y solo vuelven si la correccion toca su dominio.
    */
   soloMenores: string[];
+  /** TASK-112: cuantos MENORES pendientes tiene cada revisor ('' = el generico). */
+  menoresPorRevisor: Map<string, number>;
   /** TASK-095: hallazgos de la ronda N que no estan `corregido` ni `aceptado`. */
   sinMarcar: string[];
   /** TASK-081 y TASK-083: lo que los informes de la ronda N permiten para la N+1. */
@@ -511,6 +513,7 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
     seccion: seccionPendientes(informes.ronda, filas, sinTabla),
     seccionesPorRevisor,
     soloMenores,
+    menoresPorRevisor,
     sinMarcar,
     alcance: alcanceRondaSiguiente(textos.map((t) => t.texto)),
     fueAcotada,
@@ -645,10 +648,17 @@ function planDeVerificacion(
 export const SECCION_NO_RELANZADOS = '## Revisores no relanzados';
 
 /** TASK-095: seccion de un revisor sin pendientes propios en la ronda acotada. */
-function seccionSinPendientes(ronda: number): string {
+function seccionSinPendientes(ronda: number, menores = 0): string {
+  // TASK-112 (MEN-3 de su revision): quien vuelve con solo MENORES si los tiene;
+  // no van en la tabla a proposito.
+  const inicio =
+    menores > 0
+      ? `Tus ${String(menores)} hallazgo(s) MENOR de la ronda ${String(ronda)} no se reverifican (los comprueba\n` +
+        'quien coordina): recibes esta ronda porque la correccion'
+      : 'No tienes hallazgos pendientes propios: recibes esta ronda porque la correccion';
   return (
     `## Hallazgos de la ronda ${String(ronda)} pendientes de verificar\n\n` +
-    'No tienes hallazgos pendientes propios: recibes esta ronda porque la correccion\n' +
+    `${inicio}\n` +
     'toca ficheros de tu dominio. Revisa en el diff de esta ronda lo que la correccion\n' +
     'cambia en tu terreno y si abre un fallo.\n\n'
   );
@@ -1054,7 +1064,10 @@ async function runReview(
                   seccionPrevia: acotada
                     ? (previa.seccionesPorRevisor.get(escritura.revisor === generico ? '' : escritura.revisor) ??
                       previa.seccionesPorRevisor.get(escritura.revisor) ??
-                      seccionSinPendientes(previa.ronda))
+                      seccionSinPendientes(
+                        previa.ronda,
+                        previa.menoresPorRevisor.get(escritura.revisor === generico ? '' : escritura.revisor) ?? 0
+                      ))
                     : previa.seccion,
                 }
               : {}),
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 96b3085e279665d8b519d63955b455d8d5f63bc8..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-112/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-112/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-112/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-112/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-112/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-112/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-112/revision/informe-revision-1.md                                                  |  47 ++++++++
 tareas/03-en-revision/TASK-112/revision/peticion-revision-1.md                                                 | 489 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-112/tarea.md                                                       |  42 +++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                       |  19 +++-
 10 files changed, 584 insertions(+), 13 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 96b3085e279665d8b519d63955b455d8d5f63bc8..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/informe-verificacion-commit.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-alcance.test.ts          |  4 +++-
 taskcode-marketplace/plugins/taskcode-plugin/test/core/informe-verificacion-commit.test.ts | 48 ++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 51 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 136.2 s
- Commit verificado: 89aaec7f34145aa583ec3ba94a0cdfa9d5011581
- Huella: e9c7c4486cd5ce158ec39ff4eeacc18b2ab17df2
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 142783 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6056ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.4382ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.89ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.9108ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.4689ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7856ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.8042ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (25.445ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (1.1311ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3517ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3407ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.4787ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (12.5619ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.5349ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (59.7708ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.3753ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.8971ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.4763ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3595ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.1863ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.182ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2095ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2235ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.224ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2354ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2365ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1615ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2172ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1551ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1541ms)
✔ resolverAsignado: recorta los tres escalones (0.16ms)
ℹ tests 881
ℹ suites 0
ℹ pass 881
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 125518.0945
[verificar-impacto] node --test termino con 0 en 125.6 s.
````
