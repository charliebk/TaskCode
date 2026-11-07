# Peticion de revision — TASK-081 (ronda 1)

- Tarea: TASK-081 — Revision mas barata: medir y acotar las lecturas de los revisores
- Rama revisada: feature/task-081-revision-mas-barata-medir-y-acotar-las-l
- Rama base: develop
- Commit revisado (HEAD): 4f0243f23d350f54c72370f93f4d1d3ae5bcc3bc
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-081 (criterios de aceptacion y plan)

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
4f0243f chore(TASK-081): coste implementacion +13328064 tokens (2 agentes)
8434daa docs(TASK-081): README y ayuda de registrar-coste, contexto permitido y modelo de ronda 2
e6d691c feat(TASK-081): lecturas por revisor y ronda en coste y metricas
c2c143b feat(TASK-081): contexto permitido en la peticion y modelo barato en ronda 2
38def0f chore(TASK-081): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/METRICAS.md b/docs/METRICAS.md
index a98ea61..9c30664 100644
--- a/docs/METRICAS.md
+++ b/docs/METRICAS.md
@@ -547,6 +547,65 @@ baratas.
 Se revisará cuando haya unas 10 tareas por nivel con `tokens_*` registrados:
 `taskctl metricas --tokens` da ya el resumen por complejidad.
 
+## 12. Lecturas de los revisores por ronda y revisor (TASK-081)
+
+La revisión es la fase cara: la **mediana de tokens de revisión en ToolsaWeb
+es hoy de 6,8 M** por tarea. **Objetivo: volver a 3-4 M de tokens de revisión
+en tareas medias.** Es una cifra de hoy y un objetivo, no una medida de este
+repo: qué es una «tarea media» no está definido y 3-4 M no se ha contrastado
+con una muestra. Para poder saber si se llega hay que ver *dónde* se gasta, y
+eso es lo que mide esta sección.
+
+**Qué se guarda.** `taskctl registrar-coste --fase revision --agente <id>...`
+deja **una fila por agente** en la tabla `## Coste` de la tarea (un solo
+commit), y cada fila lleva dos columnas nuevas al final, `ronda` y `revisor`
+(11 columnas en total; `-` = sin dato):
+
+- `ronda` y `revisor` salen de la **transcripción del propio revisor**: se
+  busca el nombre `peticion-revision-<N>[-<skill>].md` en su primer mensaje de
+  usuario (el prompt con el que se lo lanzó, que debe llevar la ruta de su
+  petición). El revisor es el sufijo (`-<skill>`); en una ronda sin fragmentar
+  no hay sufijo y el revisor se muestra como «(sin fragmentar)».
+- Lo que no se puede deducir queda **sin atribuir**: `ronda` `-`, y en
+  `metricas` sale como «—», nunca como la ronda 1 ni como 0.
+- `--ronda N [--revisor <skill>]` lo declaran a mano, solo con un único
+  `--agente`, y se validan contra las peticiones que existen en `revision/`
+  (texto libre = error; si contradicen lo que dice la transcripción, error).
+- Las filas anteriores (9 columnas) se siguen leyendo con sus totales, sin
+  ronda ni revisor. **Nunca se reescriben.**
+
+**Cómo se lee.** `taskctl metricas --tokens` pinta, **bajo la tabla y aparte de
+ella**, un bloque «Lecturas de revisión por revisor y ronda» con una línea por
+tarea, ronda y revisor: `lecturas`, `entrada` y `cache_lect` de esas filas, y
+los `crit` e `imp` (CRÍTICO e IMPORTANTE) del informe de ese revisor y ronda,
+para no dar por buena una bajada de lecturas que sea solo revisar peor. Lo
+ausente se pinta «—», nunca `0`: `crit`/`imp` «—» es que no hay informe de ese
+revisor y ronda o su tabla de hallazgos no se puede leer, y `0` es que la tabla
+existe y no tiene ninguno. `--json` lleva lo mismo en `lecturasRevision`. El
+bloque **no entra en `--escribir`**: lo generado entre los marcadores de este
+fichero no cambia de forma. `metricas` solo lee el repo; **nunca lee
+`~/.claude`** (las lecturas se guardaron al registrar el coste, y siguen ahí
+aunque Claude Code purgue las transcripciones).
+
+**Qué no dice.**
+
+- `lecturas` cuenta **llamadas** de lectura (`Read`, `Grep`, `Glob`, `cat`...),
+  **no bytes**, y no ve `cd x && cat y` ni `Get-Content`. Una lectura enorme
+  cuenta 1. Por eso no es la causa de los tokens: se muestran al lado `entrada`
+  y `cache_lect`.
+- Es heurístico y depende del formato de transcripción de Claude Code, que es
+  externo. Si cambiara, la suite seguiría en verde y en producción saldrían 0
+  lecturas.
+- **Riesgo aceptado de doble conteo con un plugin viejo.** Un plugin anterior a
+  TASK-081 descarta las filas de 11 columnas, así que `yaAnotado` no ve que un
+  agente ya está registrado y, si vuelve a registrar *ese mismo agente* en la
+  misma fase, suma su transcripción entera otra vez (y no se puede deshacer
+  sola). Solo pasa si se mezcla un plugin viejo con tareas registradas con el
+  nuevo; con el mismo plugin, un agente reanudado suma solo lo que creció
+  (`agente:dif:<id>`).
+- Un agente lanzado sin la ruta de su petición en el prompt sale «sin
+  atribuir», y sus lecturas no se reparten entre revisores.
+
 <!-- taskctl metricas --tokens: inicio -->
 ## Coste en tokens por tarea (generado)
 
diff --git a/docs/PROPUESTA_METODOLOGIA.md b/docs/PROPUESTA_METODOLOGIA.md
index 976310b..1ffe216 100644
--- a/docs/PROPUESTA_METODOLOGIA.md
+++ b/docs/PROPUESTA_METODOLOGIA.md
@@ -496,6 +496,8 @@ Una pieza que se quedó implícita hasta ahora: la tabla de la sección 11 (comp
 
 Con eso explícito, para `trivial` (y probablemente `simple`) el pase del agente revisor puede ser deliberadamente ligero — no se salta, se abarata: modelo barato (Haiku) y una checklist corta y estructurada, apoyándose en que la puerta determinista de build/lint/tests (corrección 5, sección 16) ya se llevó la mayor parte del peso de detectar problemas reales. Para `media` en adelante, el revisor sigue con el nivel de profundidad y modelo que ya tenía.
 
+**Enmienda (TASK-081).** El revisor usa el mismo modelo que la tarea (`modelo_sugerido`), con una sola excepción: la ronda de verificación. En la ronda 2 o posterior, `taskctl review` sugiere el modelo del escalón inferior (opus → sonnet → haiku; haiku no baja más) en una línea propia de la petición, `- Modelo sugerido para esta ronda:`, **solo si** en la ronda anterior se cumple todo esto: 0 CRÍTICOS en cualquier estado (también los `corregido`), todas las tablas de hallazgos legibles (si la ronda está fragmentada, la de cada informe), ninguna severidad desconocida y ningún informe que siga siendo la plantilla sin filas reales. En cualquier otro caso se mantiene `modelo_sugerido`. La ronda 1 nunca abarata. La sugerencia queda escrita en la petición para poder auditar después qué tareas se revisaron con ella.
+
 Aviso importante para no meter la pata con esto: **urgencia no es lo mismo que complejidad baja.** Un `hotfix` no debería heredar automáticamente una revisión ligera solo por ir rápido — de hecho la heurística de 16.1 ya suma puntos extra cuando `tipo: hotfix` coincide con una palabra de riesgo, precisamente para evitar ese error. Un hotfix de complejidad media o alta sigue su revisión al nivel que le corresponde; lo único que se abrevia en un hotfix es el brainstorm previo (sección 7.5), nunca la revisión del código que va a producción.
 
 **Idea adicional, opcional**: registrar cuántos tokens consume cada fase de una tarea real (plan, brainstorm, review) en su propia carpeta — no para optimizar de entrada, sino para tener datos reales con los que ajustar después los umbrales de esta sección (cuántos agentes de brainstorm hacen falta de verdad, dónde el heurístico de complejidad falla más, si los pesos de 16.1 están bien puestos). Sin esto, cualquier ajuste futuro sería a ojo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index d37ef3e..cb55ef0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -45,6 +45,28 @@ más de tres dominios, va entero al genérico):
 | `rust-wasm-reviewer` | Rust y WebAssembly | `.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/config.toml`, toolchain/rustfmt/clippy |
 | `code-quality-reviewer` | Genérico | Lo que no casa con ningún dominio, o más de tres dominios a la vez |
 
+Cada petición de revisión trae una sección `## Contexto permitido` con lo que
+el revisor puede leer:
+- el `tarea.md` y `planificacion/` de la tarea;
+- los ficheros de su parte del diff, sin lo excluido ni los tests reservados;
+- las rutas que el proyecto añada con la clave `contexto_revision` de
+  `.taskcode/config.yml`, que es una lista de rutas, como `CLAUDE.md` o una
+  carpeta de documentación.
+
+La skill común de los revisores (sección «Lo que lees») manda no leer fuera de
+esa lista. Lo que se lea de más se justifica en `## Lecturas fuera del contexto
+permitido` del informe.
+
+En una ronda de verificación (la 2 o posterior), la petición añade la línea
+`- Modelo sugerido para esta ronda:` con un modelo un escalón más barato
+(opus→sonnet→haiku). Solo aparece si la ronda anterior cumple todo esto:
+- ningún CRÍTICO, en cualquier estado;
+- todas las tablas de hallazgos son legibles;
+- no hay ninguna severidad desconocida;
+- ningún informe sigue siendo la plantilla.
+
+En cualquier otro caso, el revisor usa el modelo de la tarea.
+
 ## Roles del brainstorm de diseño
 
 `taskctl plan` lanza roles de `agents/` según la complejidad, por este orden de
@@ -1212,6 +1234,15 @@ fase es un agente reanudado (su transcripción acumula los dos trabajos): se sum
 solo lo que creció su transcripción desde lo ya anotado para ese id, y la fila lo
 marca en su fuente (`agente:dif:<id>`), que `metricas` no avisa como repetida; si
 no ha crecido, o el id está anotado junto a otros en una misma fila, aborta.
+En `--fase revision` cada `--agente` va en **su propia fila** (en el mismo
+commit), con las columnas `ronda` y `revisor` que se deducen de su
+transcripción. Se sacan del nombre `peticion-revision-N[-skill].md` que lleva
+el prompt del revisor. Lo que no se puede deducir queda como `-` («sin
+atribuir»). Con un único `--agente`, `--ronda N [--revisor <skill>]` los
+declara a mano; el revisor se valida contra las peticiones de `revision/`.
+Las filas antiguas de 9 columnas se siguen leyendo. `metricas --tokens` las
+resume, por ronda y revisor, en un bloque aparte, también en `--json`: las
+lecturas, los tokens de entrada y caché, y los CRÍTICO e IMPORTANTE de su informe.
 `--tokens N` da una cifra a mano (la parte del
 orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
 en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
index 9cbf378..bb6a719 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -13,6 +13,9 @@ minimo que **todo** cambio tiene que superar.
 El objetivo no es opinar sobre el diff: es **encontrar el caso que lo rompe y
 demostrarlo**.
 
+Lee solo lo que la seccion `## Contexto permitido` de tu peticion lista (ver
+"Lo que lees" en [revision.md](../task-workflow/revision.md)).
+
 Antes de empezar, lee [revision.md](../task-workflow/revision.md): lo comun a
 toda revision (la puerta determinista, una sola ejecucion de la suite por
 ronda, la plantilla de cada hallazgo, las rondas, la linea del veredicto que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index afe45e4..492af6c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -26,7 +26,13 @@ punto, no un formalismo.
 3. Por cada `revision/peticion-revision-N*.md` de la ronda que no tenga ya su
    informe con veredicto (una por dominio si esta fragmentada), lanza un
    agente revisor independiente, en paralelo y en un solo mensaje, con la
-   skill revisora que nombra la peticion. Que reproduzca empiricamente (clon
+   skill revisora que nombra la peticion. **El prompt de cada revisor lleva
+   la ruta de SU peticion** (`revision/peticion-revision-N[-skill].md`): de
+   ahi deducen las metricas la ronda y el revisor de cada agente, y ahi esta
+   su `## Contexto permitido`. Si la peticion trae la linea
+   `- Modelo sugerido para esta ronda: <modelo> (...)`, lanza el revisor con
+   ESE modelo; si no, con el `modelo sugerido` de la linea `Agente a lanzar`.
+   Que reproduzca empiricamente (clon
    temporal, suite una vez, mutantes) y devuelva su informe con la tabla de
    hallazgos, con la columna `Origen` rellena en cada fila
    (`implementacion`, `plan` o `especificacion`: si el fallo es del codigo,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
index d00a41e..9ead166 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
@@ -63,6 +63,17 @@ cuantas lecturas de ficheros hicieron); con `--tokens N`, una fila `manual`
 con solo el total. No la edites a mano: el total de la fase sigue siendo el
 campo `tokens_<fase>`, y la tabla es su desglose.
 
+En la fase **revision**, una llamada con varios `--agente` deja **una fila por
+agente** (en un solo commit), no una fila sumada: cada fila lleva la `ronda` y
+el `revisor` del agente, que se deducen de su transcripcion (el nombre
+`peticion-revision-N[-skill].md` que lleva el prompt con el que lo lanzaste;
+sin sufijo si la ronda no se fragmento). Lo que no se pueda deducir queda `-`,
+«sin atribuir». Asi se ve cuantas lecturas hizo cada revisor en cada ronda.
+Si una transcripcion no nombra su peticion, puedes declararlo con
+`--ronda N [--revisor <skill>]`, solo con un unico `--agente`: el revisor tiene
+que ser uno de los sufijos de los `peticion-revision-N-*.md` de la carpeta
+`revision/` de la tarea (texto libre da error).
+
 Un agente que se **reanuda** (el mismo id, otra vez con la herramienta Agent)
 acumula en su transcripcion los dos trabajos. Por eso, si el `--agente` ya esta
 anotado en `## Coste` de esa fase, `registrar-coste` suma solo lo que crecio la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
index 2feb9dc..502cfcb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md
@@ -46,6 +46,19 @@ revision: es un requisito que no se cumplio.
 Si el proyecto no tiene alguno de los tres pasos, dilo en el informe. "No hay
 linter configurado" es informacion; suponer que se ejecuto, no.
 
+## Lo que lees
+
+La peticion de revision trae una seccion `## Contexto permitido`: el enunciado
+y el plan de la tarea, y los ficheros de tu parte del diff. Lee **solo eso**
+mas lo que el propio diff embebido te muestre. Recorrer el repo entero no es
+revisar mejor: es gastar contexto en lo que nadie te pidio mirar.
+
+La lista orienta, no prohibe. Si para reproducir o entender un hallazgo
+necesitas leer algo que no esta en ella (otro modulo, un test vecino, una
+configuracion), lo lees, y lo anotas con su motivo bajo `## Lecturas fuera del
+contexto permitido` de tu informe: una linea por fichero. Si no leiste nada
+fuera, esa seccion dice `ninguna`.
+
 ## Clasificacion
 
 CRITICO: perdida de datos, corrupcion de estado, o el comando hace lo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 2eb6b3c..d0353b9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -90,7 +90,7 @@ Uso:
   taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]
   taskctl pausa TASK-NNN [--push]
   taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> \\
-                          (--agente <id>... | --tokens N) [--push]
+                          (--agente <id>... | --tokens N) [--ronda N [--revisor <skill>]] [--push]
   taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar
   taskctl diagnose
   taskctl pause [--push]
@@ -122,6 +122,10 @@ herramienta Agent); --tokens N da una cifra a mano. Se excluyen, y 0 se rechaza.
 llamada deja ademas una fila en la tabla "## Coste" de tarea.md: con --agente, el desglose
 (entrada, cache_escritura, cache_lectura, salida, lecturas); con --tokens, solo el total.
 Un --agente ya anotado en esa fase (agente reanudado) suma solo lo que crecio su transcripcion.
+En --fase revision cada --agente va en su propia fila, con la ronda y el revisor que se
+deducen de su transcripcion (la peticion-revision-N[-skill].md de su prompt); con un unico
+--agente, --ronda N [--revisor <skill>] los declara a mano. metricas --tokens muestra las
+lecturas y los CRITICO/IMPORTANTE de cada ronda y revisor.
 finish cierra con merge normal (lo de siempre). --tag <nombre> pone un tag anotado (titulo de
 la tarea) sobre el commit de merge; solo se sube con --push. --merge-request sube la rama
 y abre un PR (github.com, gh) o un MR (host con "gitlab", glab) contra la rama base en lugar
@@ -689,7 +693,8 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         .map(
           (grupo) =>
             `Peticion de revision (ronda ${result.ronda}, ${grupo.revisor}): ${grupo.peticionPath}\n` +
-            `Lanza el agente "${result.agente}" (modelo ${result.modelo}) cargando la skill ` +
+            `Lanza el agente "${result.agente}" (modelo ${result.modeloRonda ?? result.modelo}` +
+            `${result.modeloRonda === undefined ? '' : `: verificacion de correcciones, la tarea usa ${result.modelo}`}) cargando la skill ` +
             `"${grupo.revisor}" con esa peticion y vuelca su salida en ${grupo.informePath}.\n`
         )
         .join('');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index 9794a73..ef599b3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -35,6 +35,11 @@
  * TASK-084: `--por-version` agrupa las terminadas por la version de taskctl
  * de su ultimo `finish` (`core/versiones-metricas.ts`). Es otro agregado,
  * como `--evolucion` y `--grupos`: se combina con ellos y con `--json`.
+ *
+ * TASK-081: con `--tokens`, bajo la tabla y APARTE de ella, un bloque con las
+ * lecturas, la entrada y la cache_lectura de cada (ronda, revisor) de `## Coste`
+ * y los CRITICO/IMPORTANTE de su informe; `--json` lo lleva en `lecturasRevision`.
+ * No entra en `--escribir`, y todo sale del repo: nunca se lee `~/.claude`.
  */
 import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
@@ -56,6 +61,9 @@ import {
   claveTarea,
   etiquetaTarea,
   notasFilaEnriquecida,
+  formatearLecturasRevision,
+  lecturasRevisionJson,
+  type LecturaRevisionJson,
   BloqueTokensError,
   NOTA_TOKENS,
   renderBloqueTokens,
@@ -138,6 +146,8 @@ export interface MetricasCommandResult {
 export interface SalidaJsonMetricas {
   proyectos: { proyecto: string; ruta: string; tareas: number }[];
   sinCoste: ResumenSinCoste;
+  /** TASK-081: lecturas por (tarea, ronda, revisor), con sus CRITICO/IMPORTANTE; siempre presente. */
+  lecturasRevision: LecturaRevisionJson[];
   evolucion?: Evolucion;
   grupos?: Grupos;
   /** TASK-084: con `--por-version`. */
@@ -571,6 +581,7 @@ export async function runMetricasCommand(
         tareas: filas.filter((f) => f.proyecto === r.proyecto).length,
       })),
       sinCoste: resumenSinCoste(filas),
+      lecturasRevision: lecturasRevisionJson(filas),
       ...(tramoEvolucion === null ? {} : { evolucion: calcularEvolucion(filas, tramoEvolucion) }),
       ...(conGrupos ? { grupos: calcularGrupos(filas, proyectos) } : {}),
       ...(conPorVersion ? { porVersion: calcularPorVersion(filas) } : {}),
@@ -627,6 +638,7 @@ export async function runMetricasCommand(
       NOTA_TOKENS,
       NOTA_DESGLOSE_TOKENS,
       '',
+      ...formatearLecturasRevision(f, varios),
     ];
   };
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index 9b25c8a..2702b7d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -34,13 +34,27 @@
  *    commit que el total. Con `--agente`, el desglose sumado de sus agentes
  *    (entrada, escritura y lectura de cache, salida, lecturas); con
  *    `--tokens N`, una fila `manual` con solo el total.
+ * 6. TASK-081: con `--fase revision` y `--agente`, UNA FILA POR AGENTE (en el
+ *    mismo fichero y commit), cada una con la ronda y el revisor que deduce
+ *    de su transcripcion (el nombre `peticion-revision-N[-skill].md` del
+ *    primer mensaje de usuario). Lo que no se deduce queda `-`: sin atribuir.
+ *    `--ronda N [--revisor <skill>]` lo declaran a mano, solo con un unico
+ *    `--agente`, y se validan contra las peticiones que hay en `revision/`.
+ *    Las otras fases siguen con una sola fila por llamada.
  */
-import { writeFile } from 'node:fs/promises';
+import { readdir, writeFile } from 'node:fs/promises';
+import path from 'node:path';
 import { rechazarFlagsDesconocidos, parseArgs, extraerRepetible } from '../cli/args.js';
 import { readTareaFile } from '../fs/task-store.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
 import type { Task } from '../core/task.js';
-import { esAgentIdValido, sumarUsoTranscripcion } from '../core/coste-transcripcion.js';
+import {
+  esAgentIdValido,
+  rondaYRevisorDeTranscripcion,
+  sumarUsoTranscripcion,
+} from '../core/coste-transcripcion.js';
+import { rondaYRevisorDePeticion } from '../fs/rondas.js';
+import { isEnoent, isEnotdir } from '../fs/task-store.js';
 import {
   anadirCoste,
   FASES_COSTE,
@@ -63,7 +77,15 @@ import {
 export class RegistrarCosteCommandError extends Error {}
 
 /** Flags de `taskctl registrar-coste`: --fase, --tokens y --agente, mas extraerPushFlag. */
-export const FLAGS_REGISTRAR_COSTE: readonly string[] = ['--fase', '--tokens', '--agente', '--push', '-p'];
+export const FLAGS_REGISTRAR_COSTE: readonly string[] = [
+  '--fase',
+  '--tokens',
+  '--agente',
+  '--ronda',
+  '--revisor',
+  '--push',
+  '-p',
+];
 
 /** Fase → campo de la tarea donde se acumula su coste. */
 export const CAMPO_COSTE_POR_FASE = {
@@ -93,15 +115,17 @@ export interface RegistrarCosteCommandResult {
   agentes: number;
   /** TASK-065: agentes ya anotados en la fase: de ellos solo se sumo lo que crecio su transcripcion. */
   reanudados: string[];
-  /** TASK-063: la fila anadida a la tabla `## Coste`. */
+  /** TASK-063: la fila anadida a la tabla `## Coste` (la primera si son varias). */
   fila: FilaCoste;
+  /** TASK-081: todas las filas anadidas; mas de una solo con `--fase revision` y varios agentes. */
+  filas: FilaCoste[];
   filePath: string;
   autoCommit: AutoCommitResult;
 }
 
 const USO =
   'Uso: taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> ' +
-  '(--agente <id> [--agente <id2>...] | --tokens N) [--push]';
+  '(--agente <id> [--agente <id2>...] | --tokens N) [--ronda N [--revisor <skill>]] [--push]';
 
 /** Saca todos los `--agente <id>` / `--agente=<id>` de argv (lector comun de flags repetibles). */
 function extraerAgentes(argv: readonly string[]): { agentes: string[]; resto: string[] } {
@@ -172,6 +196,12 @@ interface CosteDeAgentes {
   lecturas: number;
 }
 
+/** TASK-081: lo de UN agente, con la ronda y el revisor que nombra su transcripcion (null = no los nombra). */
+interface CosteDeAgente extends CosteDeAgentes {
+  id: string;
+  atribucion: { ronda: number; revisor: string } | null;
+}
+
 const CAMPOS_COSTE = ['tokens', 'entrada', 'cacheEscritura', 'cacheLectura', 'salida', 'lecturas'] as const;
 
 /**
@@ -223,7 +253,7 @@ async function costeDeAgentes(
   agentes: readonly string[],
   configDir: string,
   anotado: ReadonlyMap<string, CosteDeAgentes> = new Map()
-): Promise<CosteDeAgentes> {
+): Promise<CosteDeAgente[]> {
   const unicos = [...new Set(agentes)];
   for (const id of unicos) {
     if (!esAgentIdValido(id)) {
@@ -233,7 +263,7 @@ async function costeDeAgentes(
       );
     }
   }
-  const suma: CosteDeAgentes = { tokens: 0, entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0, lecturas: 0 };
+  const porAgente: CosteDeAgente[] = [];
   for (const id of unicos) {
     const rutas = await buscarTranscripciones(configDir, id);
     const donde = `${configDir}/projects/*/*/subagents/agent-${id}.jsonl`;
@@ -251,7 +281,8 @@ async function costeDeAgentes(
           '--tokens N. No se ha tocado nada.'
       );
     }
-    const uso = sumarUsoTranscripcion(await leerTranscripcion(rutas[0] as string));
+    const texto = await leerTranscripcion(rutas[0] as string);
+    const uso = sumarUsoTranscripcion(texto);
     if (uso === null) {
       throw new RegistrarCosteCommandError(
         `[ERROR] La transcripcion ${rutas[0] as string} no tiene ninguna llamada con "usage": formato ` +
@@ -274,16 +305,122 @@ async function costeDeAgentes(
         );
       }
     }
-    for (const k of CAMPOS_COSTE) suma[k] += uso[k] - (previo?.[k] ?? 0);
+    const delAgente: CosteDeAgente = {
+      id,
+      tokens: 0,
+      entrada: 0,
+      cacheEscritura: 0,
+      cacheLectura: 0,
+      salida: 0,
+      lecturas: 0,
+      atribucion: rondaYRevisorDeTranscripcion(texto),
+    };
+    for (const k of CAMPOS_COSTE) delAgente[k] = uso[k] - (previo?.[k] ?? 0);
+    porAgente.push(delAgente);
   }
-  if (suma.tokens === 0) {
+  if (sumarAgentes(porAgente).tokens === 0) {
     throw new RegistrarCosteCommandError(
       '[ERROR] Las transcripciones suman 0 tokens: registrar nada no tiene sentido. No se ha tocado nada.'
     );
   }
+  return porAgente;
+}
+
+function sumarAgentes(lista: readonly CosteDeAgentes[]): CosteDeAgentes {
+  const suma: CosteDeAgentes = { tokens: 0, entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0, lecturas: 0 };
+  for (const a of lista) for (const k of CAMPOS_COSTE) suma[k] += a[k];
   return suma;
 }
 
+/** Ronda y revisor dados a mano con `--ronda` / `--revisor` (null = no se dieron). */
+interface AtribucionManual {
+  ronda: number;
+  /** null = `--revisor` no dado: ronda sin fragmentar ('') o lo que deduzca la transcripcion. */
+  revisor: string | null;
+}
+
+/** Sintaxis de `--ronda` / `--revisor`, sin mirar el disco; aborta si no cuadran con el resto de flags. */
+function leerAtribucionManual(
+  flags: Record<string, string | boolean>,
+  fase: FaseCoste,
+  nAgentes: number
+): AtribucionManual | null {
+  const ronda = flags['ronda'];
+  const revisor = flags['revisor'];
+  if (ronda === undefined && revisor === undefined) return null;
+  if (fase !== 'revision' || nAgentes !== 1) {
+    throw new RegistrarCosteCommandError(
+      '[ERROR] --ronda y --revisor solo valen con --fase revision y UN unico --agente: son un sustituto ' +
+        'de lo que se deduce de su transcripcion. Con varios agentes, deja que cada uno se deduzca de ' +
+        `la suya. ${USO}`
+    );
+  }
+  if (typeof ronda !== 'string' || !/^[1-9]d*$/.test(ronda) || !Number.isSafeInteger(Number(ronda))) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] --ronda ${typeof ronda === 'string' ? `"${ronda}" no es` : 'necesita'} un entero de 1 o mas ` +
+        `(el N de peticion-revision-N.md). ${USO}`
+    );
+  }
+  if (revisor !== undefined && (typeof revisor !== 'string' || revisor === '')) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] --revisor necesita el nombre de la skill revisora (el sufijo de peticion-revision-N-<skill>.md). ${USO}`
+    );
+  }
+  return { ronda: Number(ronda), revisor: typeof revisor === 'string' ? revisor : null };
+}
+
+/** Peticiones de revision de la carpeta de la tarea, con su ronda y su revisor; vacio sin `revision/`. */
+async function peticionesDeRevision(dirTarea: string): Promise<{ ronda: number; revisor: string }[]> {
+  let nombres: string[];
+  try {
+    nombres = await readdir(path.join(dirTarea, 'revision'));
+  } catch (e: unknown) {
+    if (isEnoent(e) || isEnotdir(e)) return [];
+    throw e;
+  }
+  return nombres.flatMap((n) => {
+    const p = rondaYRevisorDePeticion(n);
+    return p === null ? [] : [p];
+  });
+}
+
+/**
+ * Valida lo dado a mano contra las peticiones que existen (texto libre aborta:
+ * una atribucion inventada falsearia las lecturas por revisor) y lo cruza con
+ * lo deducido de la transcripcion: si discrepan, aborta en vez de elegir.
+ */
+function resolverAtribucion(
+  id: string,
+  manual: AtribucionManual,
+  deducida: { ronda: number; revisor: string } | null,
+  peticiones: readonly { ronda: number; revisor: string }[]
+): { ronda: number; revisor: string } {
+  const n = String(manual.ronda);
+  const deLaRonda = peticiones.filter((p) => p.ronda === manual.ronda);
+  if (deLaRonda.length === 0) {
+    throw new RegistrarCosteCommandError(
+      `[ERROR] ${id}: --ronda ${n} no existe: no hay ningun peticion-revision-${n}[-<skill>].md en la carpeta ` +
+        'revision/ de la tarea. No se ha tocado nada.'
+    );
+  }
+  const revisor = manual.revisor ?? deducida?.revisor ?? '';
+  if (!deLaRonda.some((p) => p.revisor === revisor)) {
+    const validos = deLaRonda.map((p) => (p.revisor === '' ? '(sin sufijo)' : p.revisor)).join(', ');
+    throw new RegistrarCosteCommandError(
+      `[ERROR] ${id}: --revisor "${revisor}" no es ninguno de los revisores de la ronda ${n}: ${validos}. ` +
+        `Son los sufijos de peticion-revision-${n}-<skill>.md que hay en revision/; no se ha tocado nada.`
+    );
+  }
+  if (deducida !== null && (deducida.ronda !== manual.ronda || deducida.revisor !== revisor)) {
+    const quien = deducida.revisor === '' ? '' : ` y el revisor ${deducida.revisor}`;
+    throw new RegistrarCosteCommandError(
+      `[ERROR] ${id}: la transcripcion del agente nombra la ronda ${String(deducida.ronda)}${quien}, y ` +
+        '--ronda/--revisor dicen otra cosa. Quita los flags o corrigelos; no se ha tocado nada.'
+    );
+  }
+  return { ronda: manual.ronda, revisor };
+}
+
 export async function runRegistrarCosteCommand(
   tareasRoot: string,
   argv: readonly string[],
@@ -303,6 +440,8 @@ export async function runRegistrarCosteCommand(
     throw new RegistrarCosteCommandError(`[ERROR] Argumentos de mas: ${positional.join(' ')}. ${USO}`);
   }
   const { fase, tokens: tokensManuales } = leerFaseYTokens(flags, agentes.length > 0);
+  // TASK-081: la sintaxis de --ronda/--revisor, antes de leer nada.
+  const manual = leerAtribucionManual(flags, fase, new Set(agentes).size);
 
   const leida = await readTareaFile(tareasRoot, id);
   if (leida === null) {
@@ -336,10 +475,11 @@ export async function runRegistrarCosteCommand(
   // TASK-065: un agente ya anotado en esta fase es un agente reanudado: su
   // transcripcion acumula lo ya registrado, asi que solo se suma lo que crecio.
   const anotado = tokensManuales === null ? yaAnotado(leerCostes(body), fase, unicos, id) : new Map();
-  const desglose =
+  const porAgente =
     tokensManuales === null
       ? await costeDeAgentes(unicos, deps.configDir ?? directorioConfigClaude(), anotado)
       : null;
+  const desglose = porAgente === null ? null : sumarAgentes(porAgente);
   const reanudados = unicos.filter((a) => anotado.has(a));
   const tokens = desglose?.tokens ?? (tokensManuales as number);
   const campo = CAMPO_COSTE_POR_FASE[fase];
@@ -351,22 +491,49 @@ export async function runRegistrarCosteCommand(
     );
   }
   const nueva: Task = { ...task, [campo]: total };
-  // TASK-063: la fila del desglose viaja en el mismo fichero y commit que el total.
-  const fila: FilaCoste = {
-    fecha: deps.ahora ?? formatearInstante(new Date()),
-    fase,
-    fuente:
-      desglose === null
-        ? 'manual'
-        : `agente:${unicos.map((a) => (anotado.has(a) ? `${PREFIJO_DIFERENCIA}${a}` : a)).join(',')}`,
-    entrada: desglose?.entrada ?? null,
-    cacheEscritura: desglose?.cacheEscritura ?? null,
-    cacheLectura: desglose?.cacheLectura ?? null,
-    salida: desglose?.salida ?? null,
-    lecturas: desglose?.lecturas ?? null,
-    total: tokens,
-  };
-  await writeFile(filePath, serializeTareaFile(nueva, anadirCoste(body, fila)), 'utf8');
+  // TASK-063: las filas del desglose viajan en el mismo fichero y commit que el total.
+  const fecha = deps.ahora ?? formatearInstante(new Date());
+  const fuenteDe = (ids: readonly string[]): string =>
+    `agente:${ids.map((a) => (anotado.has(a) ? `${PREFIJO_DIFERENCIA}${a}` : a)).join(',')}`;
+  const filas: FilaCoste[] = [];
+  if (porAgente !== null && fase === 'revision') {
+    // TASK-081: una fila por agente, cada una con su ronda y su revisor. Lo que
+    // no se deduce ni se declara queda sin atribuir (ronda null), nunca inventado.
+    const peticiones = manual === null ? [] : await peticionesDeRevision(path.dirname(filePath));
+    for (const ag of porAgente) {
+      const atribucion =
+        manual === null ? ag.atribucion : resolverAtribucion(id, manual, ag.atribucion, peticiones);
+      filas.push({
+        fecha,
+        fase,
+        fuente: fuenteDe([ag.id]),
+        entrada: ag.entrada,
+        cacheEscritura: ag.cacheEscritura,
+        cacheLectura: ag.cacheLectura,
+        salida: ag.salida,
+        lecturas: ag.lecturas,
+        total: ag.tokens,
+        ronda: atribucion?.ronda ?? null,
+        revisor: atribucion?.revisor ?? null,
+      });
+    }
+  } else {
+    filas.push({
+      fecha,
+      fase,
+      fuente: desglose === null ? 'manual' : fuenteDe(unicos),
+      entrada: desglose?.entrada ?? null,
+      cacheEscritura: desglose?.cacheEscritura ?? null,
+      cacheLectura: desglose?.cacheLectura ?? null,
+      salida: desglose?.salida ?? null,
+      lecturas: desglose?.lecturas ?? null,
+      total: tokens,
+      ronda: null,
+      revisor: null,
+    });
+  }
+  const cuerpo = filas.reduce((acum, f) => anadirCoste(acum, f), body);
+  await writeFile(filePath, serializeTareaFile(nueva, cuerpo), 'utf8');
 
   const detalle = nAgentes > 0 ? ` (${String(nAgentes)} agente${nAgentes === 1 ? '' : 's'})` : '';
   const commit = autoCommit({
@@ -375,5 +542,16 @@ export async function runRegistrarCosteCommand(
     mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens${detalle}`),
     push,
   });
-  return { id, fase, sumado: tokens, total, agentes: nAgentes, reanudados, fila, filePath, autoCommit: commit };
+  return {
+    id,
+    fase,
+    sumado: tokens,
+    total,
+    agentes: nAgentes,
+    reanudados,
+    fila: filas[0] as FilaCoste,
+    filas,
+    filePath,
+    autoCommit: commit,
+  };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 97f82c6..beae348 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -38,6 +38,8 @@ import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda, sigui
 import {
   commitRevisadoDe,
   hallazgosNoCerrados,
+  leerHallazgos,
+  veredictoDe,
   veredictoDeRonda,
   type VeredictoInforme,
 } from '../core/informe-revision.js';
@@ -63,6 +65,8 @@ import {
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
 import { EXCLUIR_HELDOUT } from '../core/heldout.js';
+import { contextoPermitido } from '../core/contexto-revision.js';
+import { modeloDeVerificacion } from '../core/modelo-revision.js';
 
 export class ReviewCommandError extends Error {}
 
@@ -131,11 +135,18 @@ export interface ReviewCommandResult {
   /**
    * Agente que se lanza para revisar (`agente_revisor` de la tarea) y el
    * modelo con que se lanza (`modelo_sugerido`: por la seccion 16.6 de la
-   * metodologia, el revisor usa el mismo modelo que la tarea). TASK-047: la
+   * metodologia, enmendada en TASK-081, el revisor usa el mismo modelo que la
+   * tarea, salvo en la ronda de verificacion: ver `modeloRonda`). TASK-047: la
    * skill revisora de cada grupo es otra cosa y va en `informes[].revisor`.
    */
   agente: string;
   modelo: string;
+  /**
+   * TASK-081: modelo mas barato que la peticion sugiere para ESTA ronda, solo
+   * si es una ronda de verificacion y la anterior cumple la regla estricta
+   * (ver `modeloBaratoPermitido`). Ausente: se mantiene `modelo`.
+   */
+  modeloRonda?: string;
   /**
    * Un elemento por revisor que interviene en esta ronda (TASK-018): uno
    * solo, con el generico, si el diff no se fragmento por dominio; uno
@@ -198,6 +209,9 @@ export function peticionTemplate(
     `- Commit revisado (HEAD): ${commitRevisado}\n` +
     `- Fecha: ${fecha}\n` +
     `- Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})\n` +
+    (extras.modeloRonda === undefined
+      ? ''
+      : `- Modelo sugerido para esta ronda: ${extras.modeloRonda} (verificacion de correcciones; la tarea usa ${task.modelo_sugerido})\n`) +
     `- Skill revisora a cargar: ${skillRevisora}\n` +
     (extras.carpetaTarea === undefined
       ? ''
@@ -217,6 +231,7 @@ export function peticionTemplate(
     'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
     `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
     'peticion.\n\n' +
+    seccionContextoPermitido(extras.contextoPermitido) +
     (extras.seccionPrevia ?? '') +
     `## Commits a revisar (git log ${desde}..HEAD)\n\n` +
     `${fence}\n` +
@@ -247,6 +262,23 @@ export interface ExtrasPeticion {
   seccionPrevia?: string;
   /** TASK-074: lineas cambiadas sin cubrir (solo si el proyecto declara `informe_cobertura`). */
   seccionCobertura?: string;
+  /** TASK-081: lo que el revisor puede leer sin justificarlo (ver core/contexto-revision.ts). */
+  contextoPermitido?: readonly string[];
+  /** TASK-081: modelo mas barato sugerido para esta ronda de verificacion. */
+  modeloRonda?: string;
+}
+
+/** TASK-081: la lista orienta, no prohibe; lo de fuera se justifica en el informe. */
+function seccionContextoPermitido(rutas: readonly string[] | undefined): string {
+  if (rutas === undefined) return '';
+  return (
+    '## Contexto permitido\n\n' +
+    'Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.\n' +
+    'Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del\n' +
+    'contexto permitido` de tu informe.\n\n' +
+    rutas.map((r) => `- ${r}`).join('\n') +
+    '\n\n'
+  );
 }
 
 /** Lo que hace falta saber de la ronda N para generar la N+1 (TASK-040). */
@@ -257,6 +289,31 @@ interface RondaPrevia {
   commit: string | null;
   /** Seccion de la peticion con los hallazgos que siguen abiertos. */
   seccion: string;
+  /** TASK-081: la ronda cumple la regla estricta para verificar con un modelo mas barato. */
+  modeloBaratoPermitido: boolean;
+}
+
+/**
+ * Regla ESTRICTA (decision de la persona, TASK-081) para que la ronda de
+ * verificacion use un modelo mas barato. Se cumple solo si, en TODOS los
+ * informes de la ronda anterior: la tabla de hallazgos se lee, no hay ningun
+ * CRITICO en ningun estado (tampoco uno `corregido`), no hay severidades
+ * fuera del vocabulario, y el informe no sigue siendo la plantilla (sin filas
+ * reales de hallazgo y con la fila de ejemplo, o con el veredicto PENDIENTE).
+ */
+export function modeloBaratoPermitido(informes: readonly string[]): boolean {
+  if (informes.length === 0) return false;
+  for (const texto of informes) {
+    const lectura = leerHallazgos(texto);
+    if (!lectura.tabla) return false;
+    if (lectura.hallazgos.some((h) => h.severidadReconocida === null || h.severidadReconocida === 'CRITICO')) {
+      return false;
+    }
+    const plantilla =
+      lectura.hallazgos.length === 0 && (/^\|\s*\(ej\./im.test(texto) || veredictoDe(texto) === 'pendiente');
+    if (plantilla) return false;
+  }
+  return true;
 }
 
 async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
@@ -299,7 +356,13 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
       `\nTabla de hallazgos ausente o ilegible en: ${sinTabla.join(', ')}. ` +
       'Lee esos informes enteros.\n';
   }
-  return { ronda: informes.ronda, veredicto: veredictoDeRonda(textos.map((t) => t.texto)), commit, seccion: seccion + '\n' };
+  return {
+    ronda: informes.ronda,
+    veredicto: veredictoDeRonda(textos.map((t) => t.texto)),
+    commit,
+    seccion: seccion + '\n',
+    modeloBaratoPermitido: modeloBaratoPermitido(textos.map((t) => t.texto)),
+  };
 }
 
 /**
@@ -354,7 +417,10 @@ export function informeTemplate(task: Task, commitRevisado: string, ronda: numbe
     'Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el\n' +
     'plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el\n' +
     'enunciado o en los criterios de aceptacion de la tarea.\n\n' +
-    'Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.\n'
+    'Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.\n\n' +
+    // TASK-081: lo leido fuera de la lista de la peticion, con su motivo.
+    '## Lecturas fuera del contexto permitido\n\n' +
+    'ninguna\n'
   );
 }
 
@@ -551,6 +617,13 @@ export async function runReviewCommand(
   // Un par de nombres (con o sin sufijo de dominio) por grupo del plan.
   // Sin fragmentar hay un unico grupo y se usa el nombre de siempre, sin
   // sufijo: ninguna tarea que solo cae al generico cambia de convencion.
+  // TASK-081: todo lo que va a la peticion se calcula ANTES del primer
+  // writeFile: si algo falla aqui no queda nada a medias en revision/.
+  const carpetaTarea = `tareas/${STATE_FOLDER[updated.estado]}/${updated.id}`;
+  const modeloRonda =
+    incremental && previa !== null && previa.modeloBaratoPermitido
+      ? modeloDeVerificacion(updated.modelo_sugerido)
+      : null;
   const escrituras = plan.grupos.map((grupo) => {
     const sufijo = plan.fragmentado ? `-${grupo.revisor}` : '';
     return {
@@ -558,6 +631,12 @@ export async function runReviewCommand(
       ficheros: grupo.ficheros,
       nombrePeticion: `peticion-revision-${ronda}${sufijo}.md`,
       nombreInforme: `informe-revision-${ronda}${sufijo}.md`,
+      contexto: contextoPermitido({
+        carpetaTarea,
+        ficherosDelGrupo: grupo.ficheros,
+        extra: configRama.contexto_revision,
+        excluir,
+      }),
     };
   });
 
@@ -604,7 +683,9 @@ export async function runReviewCommand(
           {
             // La peticion se escribe ANTES de mover la tarea: la carpeta
             // sale del estado destino, no de filePath.
-            carpetaTarea: `tareas/${STATE_FOLDER[updated.estado]}/${updated.id}`,
+            carpetaTarea,
+            contextoPermitido: escritura.contexto,
+            ...(modeloRonda === null ? {} : { modeloRonda }),
             excluidos: paraRevision.excluidos,
             stat: paraRevision.stat,
             patrones: excluir,
@@ -672,6 +753,7 @@ export async function runReviewCommand(
     filePath: newFilePath,
     agente: updated.agente_revisor,
     modelo: updated.modelo_sugerido,
+    ...(modeloRonda === null ? {} : { modeloRonda }),
     informes,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index e0026e4..c269164 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -12,6 +12,7 @@
  * | rutas_sincronizacion         | []                | fs/sincronizacion.ts    |
  * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
  * | excluir_de_revision          | dist, locks, tareas | commands/review.ts    |
+ * | contexto_revision            | []                | commands/review.ts    |
  * | modo_flujo                   | manual            | core/flujo.ts, plan.ts, approve.ts |
  * | cierre_por_defecto           | merge             | siguiente.ts -> skill finish (modo automatico) |
  * | plataforma_remota            | null (por host)   | commands/finish-opciones.ts (--merge-request) |
@@ -129,6 +130,11 @@ export interface TaskcodeConfig {
    * revision: aparecen solo en un `--stat`. `[]` = no excluir nada.
    */
   excluir_de_revision: readonly string[];
+  /**
+   * TASK-081: ficheros o carpetas (relativos a la raiz) que el revisor puede
+   * leer ademas del enunciado, el plan y el diff de su dominio. `[]` = nada mas.
+   */
+  contexto_revision: readonly string[];
   /**
    * TASK-056: como avanza el ciclo entre fases. `manual`, la persona lanza
    * cada comando (lo de siempre); `semiautomatico`, se pregunta al cerrar
@@ -211,6 +217,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
     '**/*-lock.*',
     'tareas/**',
   ]) as readonly string[],
+  contexto_revision: Object.freeze([]) as readonly string[],
   modo_flujo: 'manual',
   cierre_por_defecto: 'merge',
   plataforma_remota: null,
@@ -231,6 +238,7 @@ export const CLAVES_CONFIG = [
   'rutas_sincronizacion',
   'timeout_sincronizacion',
   'excluir_de_revision',
+  'contexto_revision',
   'modo_flujo',
   'cierre_por_defecto',
   'plataforma_remota',
@@ -481,6 +489,9 @@ export function parsearConfigConAvisos(
       case 'excluir_de_revision':
         config.excluir_de_revision = validarPatronesExclusion(donde, par.valor);
         break;
+      case 'contexto_revision':
+        config.contexto_revision = validarPatronesExclusion(donde, par.valor, 'contexto_revision', false);
+        break;
       case 'modo_flujo':
         config.modo_flujo = validarModoFlujo(donde, par.valor);
         break;
@@ -677,33 +688,38 @@ function validarUmbralCobertura(donde: string, valor: unknown): number {
  * `** /*.lock`), que es lo que una persona espera y no lo que hace
  * `:(glob)` a secas, donde `*` no cruza carpetas.
  */
-function validarPatronesExclusion(donde: string, valor: unknown): readonly string[] {
+function validarPatronesExclusion(
+  donde: string,
+  valor: unknown,
+  clave: 'excluir_de_revision' | 'contexto_revision' = 'excluir_de_revision',
+  anclar = true
+): readonly string[] {
   if (!Array.isArray(valor)) {
     throw new ConfigError(
-      `[ERROR] ${donde}: "excluir_de_revision" debe ser una lista entre corchetes, ` +
+      `[ERROR] ${donde}: "${clave}" debe ser una lista entre corchetes, ` +
         `y es ${describirValor(valor)}.\n` +
-        '        Ejemplo: excluir_de_revision: [**/dist/**, **/*.lock]. Para no excluir ' +
-        'nada: excluir_de_revision: [].'
+        `        Ejemplo: ${clave}: [**/dist/**, **/*.lock]. Para no excluir ` +
+        `nada: ${clave}: [].`
     );
   }
   const patrones: string[] = [];
   for (const elemento of valor) {
     if (typeof elemento !== 'string' || elemento.trim() === '') {
       throw new ConfigError(
-        `[ERROR] ${donde}: "excluir_de_revision" contiene un elemento vacio o que no es texto.`
+        `[ERROR] ${donde}: "${clave}" contiene un elemento vacio o que no es texto.`
       );
     }
     const conBarras = elemento.trim().replace(/\\/g, '/');
     const absoluto = conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras);
     if (absoluto || conBarras.split('/').includes('..')) {
       throw new ConfigError(
-        `[ERROR] ${donde}: el patron "${elemento.trim()}" de "excluir_de_revision" no vale: ` +
+        `[ERROR] ${donde}: el patron "${elemento.trim()}" de "${clave}" no vale: ` +
           `${absoluto ? 'es absoluto' : 'sale del repo con ".."'}.\n` +
           '        Los patrones son relativos a la raiz del repo y siguen la semantica de ' +
           'git :(glob) (por ejemplo **/dist/**).'
       );
     }
-    const anclado = conBarras.includes('/') ? conBarras : `**/${conBarras}`;
+    const anclado = !anclar || conBarras.includes('/') ? conBarras : `**/${conBarras}`;
     if (!patrones.includes(anclado)) patrones.push(anclado);
   }
   return patrones;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/contexto-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/contexto-revision.ts
new file mode 100644
index 0000000..bfd7979
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/contexto-revision.ts
@@ -0,0 +1,81 @@
+/**
+ * Contexto permitido de una peticion de revision — TASK-081. Puro.
+ *
+ * El revisor no necesita recorrer el repo para revisar un diff: le basta el
+ * enunciado y el plan de la tarea, y los ficheros que cambian en su dominio.
+ * La lista orienta (no prohibe): lo que lea fuera de ella lo justifica en su
+ * informe.
+ */
+import { EXCLUIR_HELDOUT } from './heldout.js';
+
+export interface EntradaContexto {
+  /** Carpeta de la tarea, relativa a la raiz del repo, con separadores POSIX. */
+  carpetaTarea: string;
+  /** Ficheros del diff que le tocan a este revisor (su dominio). */
+  ficherosDelGrupo: readonly string[];
+  /** Ficheros o carpetas que el proyecto declara en `contexto_revision`. */
+  extra: readonly string[];
+  /** Patrones `git :(glob)` excluidos de la revision (incluye los tests reservados). */
+  excluir: readonly string[];
+}
+
+/** Traduce un patron `git :(glob)` a expresion regular: `*` no cruza `/`, `**` si. */
+function globARegExp(patron: string): RegExp {
+  let re = '';
+  for (let i = 0; i < patron.length; i++) {
+    const c = patron[i] as string;
+    if (c === '*') {
+      if (patron[i + 1] === '*') {
+        const alFinal = i + 2 >= patron.length;
+        const trasBarra = i === 0 || patron[i - 1] === '/';
+        if (trasBarra && patron[i + 2] === '/') {
+          re += '(?:.*/)?'; // `**/`: cero o mas carpetas
+          i += 2;
+        } else if (trasBarra && alFinal) {
+          re += '.*'; // `/**`: todo lo de dentro
+          i += 1;
+        } else {
+          re += '[^/]*';
+          i += 1;
+        }
+      } else {
+        re += '[^/]*';
+      }
+    } else if (c === '?') {
+      re += '[^/]';
+    } else {
+      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
+    }
+  }
+  return new RegExp(`^${re}$`);
+}
+
+/** true si la ruta casa con alguno de los patrones. */
+export function casaConAlguno(ruta: string, patrones: readonly string[]): boolean {
+  return patrones.some((p) => globARegExp(p).test(ruta));
+}
+
+function normalizar(ruta: string): string {
+  return ruta.trim().replace(/\\/g, '/').replace(/^\.\//, '');
+}
+
+/**
+ * Rutas que el revisor puede leer sin justificarlo: `tarea.md` y
+ * `planificacion/` de la carpeta de la tarea, mas los ficheros de su grupo y
+ * los extra del proyecto, sin repetir y en ese orden.
+ *
+ * `excluir` se aplica a los ficheros del grupo y a los extra. A la carpeta de
+ * la tarea solo le afectan los tests reservados: la lista por defecto excluye
+ * `tareas/**` del DIFF, y eso no debe dejar al revisor sin el enunciado.
+ */
+export function contextoPermitido(entrada: EntradaContexto): string[] {
+  const carpeta = normalizar(entrada.carpetaTarea).replace(/\/+$/, '');
+  const deLaTarea = [`${carpeta}/tarea.md`, `${carpeta}/planificacion/`].filter(
+    (r) => !casaConAlguno(r, [EXCLUIR_HELDOUT])
+  );
+  const resto = [...entrada.ficherosDelGrupo, ...entrada.extra]
+    .map(normalizar)
+    .filter((r) => r !== '')
+    .filter((r) => !casaConAlguno(r, [...entrada.excluir, EXCLUIR_HELDOUT]));
+  return [...new Set([...deLaTarea, ...resto])];
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
index 0294102..cb34a86 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
@@ -2,10 +2,11 @@
  * Desglose del coste de una tarea (TASK-063): la seccion `## Coste` de
  * `tarea.md`, una fila por cada `taskctl registrar-coste`.
  *
- * | fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
- * |---|---|---|---|---|---|---|---|---|
- * | 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 |
- * | 2026-10-25T15:10:00Z | diseno | manual | - | - | - | - | - | 5000 |
+ * | fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
+ * |---|---|---|---|---|---|---|---|---|---|---|
+ * | 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 | - | - |
+ * | 2026-10-25T15:10:00Z | diseno | manual | - | - | - | - | - | 5000 | - | - |
+ * | 2026-10-25T16:00:00Z | revision | agente:b1... | 90 | 800 | 40000 | 600 | 9 | 41490 | 1 | java-spring-reviewer |
  *
  * Calcado de `core/transiciones.ts` (misma busqueda de seccion, fuera de
  * bloques de codigo, la ultima gana), y por la misma razon que TASK-056: una
@@ -26,6 +27,20 @@
  *    que no es 0: una fila `manual` solo tiene `total`.
  *  - `total`: lo que la fila sumo a `tokens_<fase>`. Sin ella, una fila
  *    manual no tendria donde poner su cifra.
+ *  - `ronda` y `revisor` (TASK-081, solo con `--fase revision`): a que ronda
+ *    de revision y a que revisor (el sufijo de `peticion-revision-N-<skill>.md`)
+ *    pertenece la fila, para medir las lecturas por revisor y ronda. `-` en
+ *    `ronda` = SIN ATRIBUIR (no se pudo deducir; no es la ronda 0 ni la 1).
+ *    Con ronda conocida, `-` en `revisor` = ronda sin fragmentar (revisor
+ *    '' en memoria, como `InformeLeido.revisor`).
+ *  - Las filas anteriores a TASK-081 tienen 9 columnas y se leen igual, con
+ *    ronda y revisor sin atribuir. Nunca se reescriben: la tabla de un
+ *    tarea.md antiguo mezcla filas de 9 y de 11 columnas, y la cabecera es la
+ *    de 11 solo en las tablas nuevas.
+ *
+ * Un plugin ANTERIOR a TASK-081 ignora las filas de 11 columnas: si vuelve a
+ * registrar el mismo agente, `yaAnotado` no lo ve y lo suma otra vez (riesgo
+ * aceptado y documentado en docs/METRICAS.md).
  *
  * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas ni
  * toca nada fuera de su seccion; leer nunca falla.
@@ -50,12 +65,17 @@ export interface FilaCoste {
   salida: number | null;
   lecturas: number | null;
   total: number;
+  /** TASK-081: ronda de revision de la fila; null = sin atribuir (y toda fila de 9 columnas). */
+  ronda: number | null;
+  /** TASK-081: revisor (sufijo de la peticion); '' = ronda sin fragmentar; null solo si `ronda` es null. */
+  revisor: string | null;
 }
 
 export const CABECERA_COSTE =
-  '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |';
-const SEPARADOR = '|---|---|---|---|---|---|---|---|---|';
-const COLUMNAS = 9;
+  '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |';
+const SEPARADOR = '|---|---|---|---|---|---|---|---|---|---|---|';
+const COLUMNAS_ANTIGUA = 9;
+const COLUMNAS = 11;
 const SIN_DATO = '-';
 
 function celda(n: number | null): string {
@@ -63,9 +83,11 @@ function celda(n: number | null): string {
 }
 
 function filaATexto(f: FilaCoste): string {
+  const revisor = f.ronda === null || f.revisor === null || f.revisor === '' ? SIN_DATO : f.revisor;
   return (
     `| ${f.fecha} | ${f.fase} | ${f.fuente} | ${celda(f.entrada)} | ${celda(f.cacheEscritura)} | ` +
-    `${celda(f.cacheLectura)} | ${celda(f.salida)} | ${celda(f.lecturas)} | ${String(f.total)} |`
+    `${celda(f.cacheLectura)} | ${celda(f.salida)} | ${celda(f.lecturas)} | ${String(f.total)} | ` +
+    `${celda(f.ronda)} | ${revisor} |`
   );
 }
 
@@ -126,15 +148,27 @@ export function leerCostes(body: string): FilaCoste[] {
       .replace(/\|$/, '')
       .split('|')
       .map((c) => c.trim());
-    if (celdas.length !== COLUMNAS) continue;
-    const [fecha, fase, fuente, ...numeros] = celdas as [string, string, string, ...string[]];
+    if (celdas.length !== COLUMNAS_ANTIGUA && celdas.length !== COLUMNAS) continue;
+    const [fecha, fase, fuente, ...resto] = celdas as [string, string, string, ...string[]];
     if (precisionDeFecha(fecha) === null) continue;
     if (!(FASES_COSTE as readonly string[]).includes(fase)) continue;
     if (fuente === '') continue;
-    const valores = numeros.map(leerNumero);
+    const valores = resto.slice(0, 6).map(leerNumero);
     if (valores.some((v) => v === undefined)) continue;
     const [entrada, cacheEscritura, cacheLectura, salida, lecturas, total] = valores as (number | null)[];
     if (total === null || total === undefined) continue;
+    // TASK-081: ronda y revisor (solo en las filas de 11). Una ronda ilegible
+    // deja la fila sin atribuir, no la descarta: su coste cuenta igual.
+    let ronda: number | null = null;
+    let revisor: string | null = null;
+    if (celdas.length === COLUMNAS) {
+      const r = leerNumero(resto[6] as string);
+      if (typeof r === 'number' && r >= 1) {
+        ronda = r;
+        const v = resto[7] as string;
+        revisor = v === SIN_DATO || v === '' ? '' : v;
+      }
+    }
     filas.push({
       fecha,
       fase: fase as FaseCoste,
@@ -145,11 +179,70 @@ export function leerCostes(body: string): FilaCoste[] {
       salida: salida ?? null,
       lecturas: lecturas ?? null,
       total,
+      ronda,
+      revisor,
     });
   }
   return filas;
 }
 
+// --- Lecturas por revisor y ronda (TASK-081) ----------------------------------
+
+/**
+ * Lo que costo y leyo UN revisor en UNA ronda, sumando las filas de
+ * `--fase revision` que le atribuyen. `ronda` null = el grupo «sin atribuir»
+ * (filas anteriores a TASK-081 o cuya transcripcion no nombra su peticion).
+ * Cada cifra es null si ninguna fila del grupo la mide: ausente, no 0.
+ */
+export interface LecturasDeRevisor {
+  ronda: number | null;
+  /** '' = ronda sin fragmentar; null solo en el grupo sin atribuir. */
+  revisor: string | null;
+  /** Filas de `## Coste` del grupo (un agente por fila). */
+  filas: number;
+  /** Suma de `lecturas`: LLAMADAS de lectura, no bytes. */
+  lecturas: number | null;
+  entrada: number | null;
+  cacheLectura: number | null;
+}
+
+function sumaODato(valores: readonly (number | null)[]): number | null {
+  const datos = valores.filter((v): v is number => v !== null);
+  return datos.length === 0 ? null : datos.reduce((a, b) => a + b, 0);
+}
+
+/**
+ * Agrupa por (ronda, revisor) las filas de fase `revision`. Orden: rondas
+ * ascendentes, revisores por nombre, y el grupo sin atribuir al final. Pura:
+ * no lee nada, y no inventa un grupo si no hay filas de revision.
+ */
+export function lecturasDeRevision(filas: readonly FilaCoste[]): LecturasDeRevisor[] {
+  const grupos = new Map<string, FilaCoste[]>();
+  for (const f of filas) {
+    if (f.fase !== 'revision') continue;
+    const clave = f.ronda === null ? '\u0000sin' : `${String(f.ronda)}\u0000${f.revisor ?? ''}`;
+    const lista = grupos.get(clave) ?? [];
+    lista.push(f);
+    grupos.set(clave, lista);
+  }
+  const salida: LecturasDeRevisor[] = [];
+  for (const lista of grupos.values()) {
+    const primera = lista[0] as FilaCoste;
+    salida.push({
+      ronda: primera.ronda,
+      revisor: primera.ronda === null ? null : (primera.revisor ?? ''),
+      filas: lista.length,
+      lecturas: sumaODato(lista.map((f) => f.lecturas)),
+      entrada: sumaODato(lista.map((f) => f.entrada)),
+      cacheLectura: sumaODato(lista.map((f) => f.cacheLectura)),
+    });
+  }
+  return salida.sort((a, b) => {
+    if (a.ronda === null || b.ronda === null) return a.ronda === b.ronda ? 0 : a.ronda === null ? 1 : -1;
+    return a.ronda - b.ronda || (a.revisor as string).localeCompare(b.revisor as string);
+  });
+}
+
 // --- Lectura para las metricas (TASK-064) ------------------------------------
 
 /** Lo que dice el desglose de UNA fase, frente a su `tokens_<fase>`. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
index 161dc6a..7a0e09b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
@@ -31,6 +31,8 @@
  * `tool_use`, `lecturas` es 0.
  */
 
+import { PETICION_REVISION_EN_TEXTO_RE } from '../fs/rondas.js';
+
 /** agentId que devuelve la herramienta Agent: hexadecimal. Se valida antes de componer rutas. */
 const AGENT_ID_RE = /^[0-9a-f]{6,64}$/i;
 
@@ -175,3 +177,47 @@ export function sumarUsoTranscripcion(texto: string): UsoTranscripcion | null {
   const tokens = suma.entrada + suma.cacheEscritura + suma.cacheLectura + suma.salida;
   return { tokens, llamadas, ...suma, lecturas: lecturasPorId.size + lecturasSinId };
 }
+
+// --- Ronda y revisor de un subagente de revision (TASK-081) ------------------
+
+/** Texto de un `message.content`: un string, o los bloques `{type:"text",text}` de un array. */
+function textoDeContenido(contenido: unknown): string {
+  if (typeof contenido === 'string') return contenido;
+  if (!Array.isArray(contenido)) return '';
+  return contenido
+    .map((b) => (esObjeto(b) && b['type'] === 'text' && typeof b['text'] === 'string' ? b['text'] : ''))
+    .join('\n');
+}
+
+/**
+ * A que ronda y a que revisor pertenece un subagente de revision, deducido de
+ * su transcripcion: el PRIMER mensaje `type: "user"` es el prompt con el que se
+ * lo lanzo, y `skills/review` exige que lleve la ruta de su peticion
+ * (`.../revision/peticion-revision-<N>[-<skill>].md`). El revisor es el sufijo
+ * ('' si la ronda no se fragmento: la misma clave que `InformeLeido.revisor`).
+ * Solo se mira ese primer mensaje: los siguientes citan peticiones de otras
+ * rondas. null si no hay mensaje de usuario o no nombra una peticion; quien
+ * llama lo trata como «sin atribuir», nunca como la ronda 1.
+ *
+ * El formato de la transcripcion es de Claude Code, no nuestro: se acepta el
+ * contenido como string (lo que hay hoy) o como bloques de texto.
+ */
+export function rondaYRevisorDeTranscripcion(texto: string): { ronda: number; revisor: string } | null {
+  for (const linea of texto.split(/\r?\n/)) {
+    if (linea.trim() === '') continue;
+    let obj: unknown;
+    try {
+      obj = JSON.parse(linea);
+    } catch {
+      continue;
+    }
+    if (!esObjeto(obj) || obj['type'] !== 'user') continue;
+    const mensaje = obj['message'];
+    const prompt = textoDeContenido(esObjeto(mensaje) ? mensaje['content'] : undefined);
+    const m = PETICION_REVISION_EN_TEXTO_RE.exec(prompt);
+    if (m === null) return null;
+    const ronda = Number(m[1]);
+    return Number.isSafeInteger(ronda) ? { ronda, revisor: m[2] ?? '' } : null;
+  }
+  return null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 7360b80..8f48590 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -48,8 +48,17 @@
  */
 import { leerTransiciones, instanteDe, precisionDeFecha, versionDeCierre, type PrecisionFecha } from './transiciones.js';
 import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState, type TaskType } from './task.js';
-import { FASES_COSTE, leerCostes, resumirCostes, type FaseCoste, type ResumenCostes } from './coste-registro.js';
 import {
+  FASES_COSTE,
+  leerCostes,
+  lecturasDeRevision,
+  resumirCostes,
+  type FaseCoste,
+  type LecturasDeRevisor,
+  type ResumenCostes,
+} from './coste-registro.js';
+import {
+  leerHallazgos,
   resumirHallazgos,
   veredictoDeRonda,
   type InformeLeido,
@@ -118,6 +127,18 @@ export function etiquetaTarea(f: { proyecto: string; id: string }, varios: boole
   return varios ? `${f.proyecto}/${f.id}` : f.id;
 }
 
+/**
+ * Un (ronda, revisor) de una tarea (TASK-081): lo que costo y leyo, junto a lo
+ * que encontro. `critico` e `importante` son null si no hay informe de ese
+ * revisor y ronda, o su informe no tiene tabla de hallazgos legible; 0 solo
+ * cuando la tabla existe y no tiene ninguno. El grupo «sin atribuir»
+ * (`ronda` null) nunca tiene hallazgos: no se sabe de que informe es.
+ */
+export interface LecturaRevisorFila extends LecturasDeRevisor {
+  critico: number | null;
+  importante: number | null;
+}
+
 export interface FilaMetricas {
   /** Nombre del proyecto (la carpeta del repo); '' si quien llama no lo da. */
   proyecto: string;
@@ -142,6 +163,12 @@ export interface FilaMetricas {
   coste: ResumenCostes;
   /** Hallazgos de todas las rondas, una vez por revisor + ID; ver los null en `ResumenHallazgos`. */
   hallazgos: ResumenHallazgos;
+  /**
+   * TASK-081: lecturas, entrada y cache_lectura de cada (ronda, revisor) de
+   * `## Coste`, con los CRITICO/IMPORTANTE de su informe. Vacio = ninguna fila
+   * de revision. Los null son «sin dato», nunca 0 (ver `LecturaRevisorFila`).
+   */
+  lecturasRevision: LecturaRevisorFila[];
   /** Una entrada por ronda con peticion; vacio = sin peticiones de revision (no medido). */
   kbPeticionPorRonda: PeticionRonda[];
   /**
@@ -304,6 +331,7 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
       revision: e.task.tokens_revision,
     }),
     hallazgos: resumirHallazgos(e.informes ?? []),
+    lecturasRevision: lecturasRevisionDe(e.body, e.informes ?? []),
     kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
     total: duracionEntre(marcas.plan, marcas.finish),
     veredictoRonda1: veredictoRonda1(e.informes ?? []),
@@ -311,6 +339,17 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
   };
 }
 
+function lecturasRevisionDe(body: string, informes: readonly InformeLeido[]): LecturaRevisorFila[] {
+  return lecturasDeRevision(leerCostes(body)).map((g) => {
+    const deEse = g.ronda === null ? [] : informes.filter((i) => i.ronda === g.ronda && i.revisor === g.revisor);
+    const lecturas = deEse.map((i) => leerHallazgos(i.texto));
+    if (lecturas.length === 0 || lecturas.some((l) => !l.tabla)) return { ...g, critico: null, importante: null };
+    const cuenta = (sev: 'CRITICO' | 'IMPORTANTE'): number =>
+      lecturas.reduce((a, l) => a + l.hallazgos.filter((h) => h.severidadReconocida === sev).length, 0);
+    return { ...g, critico: cuenta('CRITICO'), importante: cuenta('IMPORTANTE') };
+  });
+}
+
 function veredictoRonda1(informes: readonly InformeLeido[]): VeredictoInforme | null {
   const primera = informes.filter((i) => i.ronda === 1);
   return primera.length === 0 ? null : veredictoDeRonda(primera.map((i) => i.texto));
@@ -851,3 +890,51 @@ export function lineaSinCoste(r: ResumenSinCoste, varios = false): string {
     (resto > 0 ? ` y ${String(resto)} mas (lista completa con --json).` : '.')
   );
 }
+
+// --- Lecturas por revisor y ronda (TASK-081) ---------------------------------
+
+function celdaOAusente(n: number | null): string {
+  return n === null ? '—' : String(n);
+}
+
+export const NOTA_LECTURAS_REVISION =
+  'Lecturas de revision por tarea, ronda y revisor (de "## Coste", fase revision, una fila por agente): ' +
+  'lecturas = LLAMADAS de lectura del revisor, no bytes ni causa de los tokens (no ve "cd x && cat y"); ' +
+  'entrada y cache_lect, sus tokens de esas filas; crit e imp, los CRITICO e IMPORTANTE de su informe. ' +
+  '«—» = sin dato (no es 0): ronda y revisor «—» = fila sin atribuir (anterior a TASK-081 o su ' +
+  'transcripcion no nombra la peticion); crit e imp «—» = sin informe de ese revisor o sin tabla legible. ' +
+  'Revisor "(sin fragmentar)" = ronda sin sufijo.';
+
+/** Bloque aparte bajo la tabla de `--tokens`: una linea por (tarea, ronda, revisor). Vacio si ninguna tarea tiene filas de revision. */
+export function formatearLecturasRevision(filas: readonly FilaMetricas[], varios = false): string[] {
+  const celdas = filas.flatMap((f) =>
+    f.lecturasRevision.map((g) => [
+      etiquetaTarea(f, varios),
+      g.ronda === null ? '—' : String(g.ronda),
+      g.revisor === null ? '—' : g.revisor === '' ? '(sin fragmentar)' : g.revisor,
+      celdaOAusente(g.lecturas),
+      celdaOAusente(g.entrada),
+      celdaOAusente(g.cacheLectura),
+      celdaOAusente(g.critico),
+      celdaOAusente(g.importante),
+    ])
+  );
+  if (celdas.length === 0) return [];
+  return [
+    'Lecturas de revision por revisor y ronda:',
+    tablaDeTexto(['tarea', 'ronda', 'revisor', 'lecturas', 'entrada', 'cache_lect', 'crit', 'imp'], celdas),
+    '',
+    NOTA_LECTURAS_REVISION,
+    '',
+  ];
+}
+
+/** Forma de `--json` (TASK-081): una entrada por (tarea, ronda, revisor); los null son «sin dato». */
+export interface LecturaRevisionJson extends LecturaRevisorFila {
+  proyecto: string;
+  id: string;
+}
+
+export function lecturasRevisionJson(filas: readonly FilaMetricas[]): LecturaRevisionJson[] {
+  return filas.flatMap((f) => f.lecturasRevision.map((g) => ({ proyecto: f.proyecto, id: f.id, ...g })));
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/modelo-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/modelo-revision.ts
new file mode 100644
index 0000000..dcd3750
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/modelo-revision.ts
@@ -0,0 +1,23 @@
+/**
+ * Modelo de la ronda de verificacion — TASK-081. Puro.
+ *
+ * La ronda 2 de una revision comprueba que las correcciones de la ronda 1
+ * resuelven los hallazgos: es un trabajo mas acotado que la primera lectura,
+ * y puede hacerlo un modelo un escalon por debajo del de la tarea. Cuando se
+ * sugiere lo decide `review.ts` con una regla estricta; aqui solo vive la
+ * escalera y el paso de un modelo al siguiente.
+ */
+
+/** Escalera de modelos, de mas caro a mas barato. */
+export const ESCALERA_MODELOS: readonly string[] = ['opus', 'sonnet', 'haiku'];
+
+/**
+ * El modelo con que verificar las correcciones cuando la tarea usa `modelo`:
+ * el escalon siguiente de la escalera. `null` si no hay escalon por debajo
+ * (ya es haiku) o si el modelo no esta en la escalera: no se sugiere nada.
+ */
+export function modeloDeVerificacion(modelo: string): string | null {
+  const i = ESCALERA_MODELOS.indexOf(modelo.trim().toLowerCase());
+  if (i === -1) return null;
+  return ESCALERA_MODELOS[i + 1] ?? null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
index 0da4afb..0cd4b60 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -84,7 +84,28 @@ export const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-([a-z0-9-]+))?\.m
  * Peticiones de revision, con el mismo sufijo opcional por revisor. Vive
  * aqui desde TASK-064 (antes en commands/review.ts, que la reexporta).
  */
-export const PETICION_REVISION_RE = /^peticion-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
+const PETICION_REVISION_PATRON = String.raw`peticion-revision-(\d+)(?:-([a-z0-9-]+))?\.md`;
+export const PETICION_REVISION_RE = new RegExp(`^${PETICION_REVISION_PATRON}$`);
+
+/**
+ * TASK-081: la misma regex, sin anclar, para buscar el nombre de una peticion
+ * dentro de un texto (el prompt de un revisor: `.../revision/peticion-revision-1-x.md`).
+ * Sale del MISMO patron que `PETICION_REVISION_RE`, asi que no pueden divergir.
+ * Grupo 1 = ronda, grupo 2 = revisor (el sufijo; ausente sin fragmentar). No
+ * casa si el nombre va pegado a otro (`xpeticion-revision-1.md`).
+ */
+export const PETICION_REVISION_EN_TEXTO_RE = new RegExp(`(?<![A-Za-z0-9_-])${PETICION_REVISION_PATRON}`);
+
+/**
+ * Ronda y revisor de un nombre de peticion de revision (TASK-081), con la
+ * misma convencion que `rondaYRevisorDeInforme`: revisor '' sin sufijo. null
+ * si el nombre no es una peticion de revision.
+ */
+export function rondaYRevisorDePeticion(nombre: string): { ronda: number; revisor: string } | null {
+  const m = PETICION_REVISION_RE.exec(nombre);
+  if (m === null) return null;
+  return { ronda: Number(m[1]), revisor: m[2] ?? '' };
+}
 
 /**
  * Ronda y revisor de un nombre de informe de revision (TASK-064): el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
index 216e9f8..a5acd15 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
@@ -144,7 +144,7 @@ test('--json con --evolucion y --grupos: un unico objeto que pasa JSON.parse, si
     assert.equal(r.status, 0, r.stderr);
     assert.equal(r.stdout.trim().split('\n').length, 1, 'una sola linea');
     const o = JSON.parse(r.stdout) as Record<string, any>;
-    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'evolucion', 'grupos']);
+    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'lecturasRevision', 'evolucion', 'grupos']);
     assert.deepEqual(
       o.proyectos.map((p: Record<string, unknown>) => [p.proyecto, p.tareas]),
       [['alfa', 5], ['beta', 2]]
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts
index 116a625..bf9487c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-fila.test.ts
@@ -55,6 +55,8 @@ function agente(fase: FilaCoste['fase'], id: string, lecturas: number): FilaCost
     salida: 40,
     lecturas,
     total: 370,
+    ronda: null,
+    revisor: null,
   };
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts
index 112c8b2..e92ad0a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-version.test.ts
@@ -65,7 +65,7 @@ test('--por-version --json: clave porVersion con versiones y sinVersion; sin el
     assert.equal(r.status, 0, r.stderr);
     assert.equal(r.stdout.trim().split('\n').length, 1, 'una sola linea');
     const o = JSON.parse(r.stdout) as SalidaJsonMetricas;
-    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'porVersion']);
+    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'lecturasRevision', 'porVersion']);
     assert.ok(o.porVersion);
     assert.equal(o.porVersion.terminadas, 4);
     assert.deepEqual(o.porVersion.versiones.map((g) => [g.version, g.n]), [['0.9.0', 1], ['0.10.0', 2]]);
@@ -75,7 +75,7 @@ test('--por-version --json: clave porVersion con versiones y sinVersion; sin el
     assert.doesNotMatch(r.stdout, /NaN|Infinity/);
     // El contrato de siempre: sin --por-version no aparece la clave nueva.
     const sinFlag = JSON.parse(metricas(alfa, ['--json']).stdout) as Record<string, unknown>;
-    assert.deepEqual(Object.keys(sinFlag), ['proyectos', 'sinCoste']);
+    assert.deepEqual(Object.keys(sinFlag), ['proyectos', 'sinCoste', 'lecturasRevision']);
   });
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
index 2e0e936..c74c01a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
@@ -183,6 +183,8 @@ test('TASK-063 --agente: deja la fila con el desglose y las lecturas del .jsonl,
           salida: USO_EJEMPLO.salida,
           lecturas: 9,
           total: USO_EJEMPLO.tokens,
+          ronda: null,
+          revisor: null,
         }
       );
       // Un solo commit, con solo tarea.md, que lleva a la vez la fila y el total.
@@ -191,7 +193,7 @@ test('TASK-063 --agente: deja la fila con el desglose y las lecturas del .jsonl,
       assert.deepEqual(git(['show', '--name-only', '--format=', 'HEAD'], repo).trim().split('\n'), [rel]);
       const diff = git(['show', '--format=', 'HEAD'], repo);
       assert.match(diff, /^\+tokens_implementacion: 602$/m);
-      assert.match(diff, /^\+\| \S+ \| implementacion \| agente:a1b2c3d4e5f60718 \| 33 \| 50 \| 500 \| 19 \| 9 \| 602 \|$/m);
+      assert.match(diff, /^\+\| \S+ \| implementacion \| agente:a1b2c3d4e5f60718 \| 33 \| 50 \| 500 \| 19 \| 9 \| 602 \| - \| - \|$/m);
       assert.equal(git(['status', '--porcelain'], repo).trim(), '');
     });
   });
@@ -203,15 +205,15 @@ test('TASK-063: varios --agente suman el desglose en UNA fila; --tokens deja otr
       await hastaCodigo(repo, tareasRoot);
       await transcripcion(config, 'proy-1', 'sesion-1', A, TRANSCRIPCION_EJEMPLO.split('\n'));
       await transcripcion(config, 'proy-2', 'sesion-2', B, [linea('m1', 40, 10)]);
-      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--agente', A, '--agente', B]).status, 0);
-      assert.equal(coste(repo, config, [ID, '--fase', 'revision', '--tokens', '1000']).status, 0);
+      assert.equal(coste(repo, config, [ID, '--fase', 'diseno', '--agente', A, '--agente', B]).status, 0);
+      assert.equal(coste(repo, config, [ID, '--fase', 'diseno', '--tokens', '1000']).status, 0);
 
-      assert.deepEqual(await valor(tareasRoot), [null, null, USO_EJEMPLO.tokens + 50 + 1000]);
+      assert.deepEqual(await valor(tareasRoot), [USO_EJEMPLO.tokens + 50 + 1000, null, null]);
       const filas = leerCostes((await cuerpo(tareasRoot)).body).map((f) => ({ ...f, fecha: '' }));
       assert.deepEqual(filas, [
         {
           fecha: '',
-          fase: 'revision',
+          fase: 'diseno',
           fuente: `agente:${A},${B}`,
           entrada: USO_EJEMPLO.entrada + 40,
           cacheEscritura: USO_EJEMPLO.cacheEscritura,
@@ -219,10 +221,12 @@ test('TASK-063: varios --agente suman el desglose en UNA fila; --tokens deja otr
           salida: USO_EJEMPLO.salida + 10,
           lecturas: USO_EJEMPLO.lecturas,
           total: USO_EJEMPLO.tokens + 50,
+          ronda: null,
+          revisor: null,
         },
         {
           fecha: '',
-          fase: 'revision',
+          fase: 'diseno',
           fuente: 'manual',
           entrada: null,
           cacheEscritura: null,
@@ -230,12 +234,14 @@ test('TASK-063: varios --agente suman el desglose en UNA fila; --tokens deja otr
           salida: null,
           lecturas: null,
           total: 1000,
+          ronda: null,
+          revisor: null,
         },
       ]);
       // La suma de las filas cuadra con el total del frontmatter.
       assert.equal(
         filas.reduce((s, f) => s + f.total, 0),
-        (await valor(tareasRoot))[2]
+        (await valor(tareasRoot))[0]
       );
     });
   });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-contexto.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-contexto.test.ts
new file mode 100644
index 0000000..0ea10eb
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-contexto.test.ts
@@ -0,0 +1,160 @@
+/**
+ * TASK-081: la peticion de revision trae `## Contexto permitido` y el
+ * informe `## Lecturas fuera del contexto permitido`. Repos Git temporales
+ * reales, a traves del comando `review`; la evidencia se lee de lo que escribe.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, mkdir, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { contextoPermitido } from '../../src/core/contexto-revision.js';
+import { EXCLUIR_HELDOUT } from '../../src/core/heldout.js';
+import { parsearConfig } from '../../src/core/config.js';
+import {
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  commitAll,
+  withTempRepo,
+  setupTaskEnCursoSoloTarea,
+  advanceDevelop,
+  escribirFichero,
+} from '../helpers/review-fixtures.js';
+
+const JAVA = 'src/main/java/com/acme/UserService.java';
+const ANGULAR = 'src/app/user-profile/user-profile.component.ts';
+
+/** Las rutas listadas bajo `## Contexto permitido` (lineas `- ruta`). */
+function contexto(peticion: string): string[] {
+  const lineas = peticion.split('\n');
+  const ini = lineas.findIndex((l) => l === '## Contexto permitido');
+  assert.notEqual(ini, -1, 'la peticion no trae "## Contexto permitido"');
+  const fin = lineas.findIndex((l, i) => i > ini && l.startsWith('## '));
+  return lineas
+    .slice(ini + 1, fin === -1 ? lineas.length : fin)
+    .filter((l) => l.startsWith('- '))
+    .map((l) => l.slice(2));
+}
+
+async function revisar(
+  id: string,
+  ficheros: string[],
+  preparar?: (repoRoot: string) => Promise<void>
+): Promise<{ peticiones: Map<string, string>; informe: string }> {
+  let salida: { peticiones: Map<string, string>; informe: string } | null = null;
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Un fichero versionado que NO entra en el diff de la tarea.
+    await escribirFichero(repoRoot, 'src/otro/Viejo.ts', 'export const viejo = 1;\n');
+    if (preparar !== undefined) await preparar(repoRoot);
+    commitAll(repoRoot, 'base con fichero ajeno');
+    const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-contexto` });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    for (const f of ficheros) await escribirFichero(repoRoot, f, `// ${f}\n`);
+    await mkdir(path.join(tareasRoot, '02-en-curso', id, 'planificacion'), { recursive: true });
+    await writeFile(path.join(tareasRoot, '02-en-curso', id, 'planificacion', 'plan-final.md'), '# plan\n', 'utf8');
+    commitAll(repoRoot, 'trabajo');
+    await advanceDevelop(repoRoot, task.rama);
+    const r = await runReviewCommand(tareasRoot, [id], '2026-11-07', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    const peticiones = new Map<string, string>();
+    for (const g of r.informes) peticiones.set(g.revisor, await readFile(g.peticionPath, 'utf8'));
+    const informe = await readFile((r.informes[0] as { informePath: string }).informePath, 'utf8');
+    salida = { peticiones, informe };
+  });
+  return salida as unknown as { peticiones: Map<string, string>; informe: string };
+}
+
+test('contexto permitido (TASK-081): positiva, trae la carpeta de la tarea y los ficheros del diff', async () => {
+  const { peticiones } = await revisar('TASK-960', [JAVA]);
+  const lista = contexto(peticiones.get('java-spring-reviewer') as string);
+  assert.deepEqual(lista, [
+    'tareas/03-en-revision/TASK-960/tarea.md',
+    'tareas/03-en-revision/TASK-960/planificacion/',
+    JAVA,
+  ]);
+});
+
+test('contexto permitido (TASK-081): negativa, ni un fichero versionado fuera del diff ni un test reservado', async () => {
+  const heldout = 'tareas/02-en-curso/TASK-961/aceptacion/secreto.test.cjs';
+  const { peticiones } = await revisar('TASK-961', [JAVA, heldout], async (repoRoot) => {
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    // El proyecto los pide como contexto extra: el reservado sigue sin entrar.
+    await writeFile(
+      path.join(repoRoot, '.taskcode', 'config.yml'),
+      `contexto_revision: [docs/guia.md, ${heldout}]\n`,
+      'utf8'
+    );
+    await escribirFichero(repoRoot, 'docs/guia.md', 'guia\n');
+  });
+  const lista = contexto(peticiones.get('java-spring-reviewer') as string);
+  assert.ok(lista.includes(JAVA));
+  assert.ok(lista.includes('docs/guia.md'), 'el extra de config.yml se anade');
+  assert.ok(!lista.includes('src/otro/Viejo.ts'), 'un fichero fuera del diff no es contexto');
+  assert.ok(!lista.some((r) => r.includes('aceptacion')), `un test reservado no es contexto: ${lista.join(', ')}`);
+});
+
+test('contexto permitido (TASK-081): fragmentada, cada peticion lista solo los ficheros de su dominio', async () => {
+  const { peticiones } = await revisar('TASK-962', [JAVA, ANGULAR]);
+  const java = contexto(peticiones.get('java-spring-reviewer') as string);
+  const angular = contexto(peticiones.get('angular-vue-reviewer') as string);
+  assert.ok(java.includes(JAVA) && !java.includes(ANGULAR));
+  assert.ok(angular.includes(ANGULAR) && !angular.includes(JAVA));
+  // Lo de la tarea lo tienen los dos.
+  assert.ok(java.includes('tareas/03-en-revision/TASK-962/tarea.md'));
+  assert.ok(angular.includes('tareas/03-en-revision/TASK-962/tarea.md'));
+});
+
+test('contexto permitido (TASK-081): la peticion sigue diciendo lo de siempre y el informe trae su seccion', async () => {
+  const { peticiones, informe } = await revisar('TASK-963', [JAVA]);
+  const peticion = peticiones.get('java-spring-reviewer') as string;
+  assert.match(peticion, /- Agente a lanzar: general-purpose \(modelo sugerido: \w+\)\n/);
+  assert.ok(!peticion.includes('Modelo sugerido para esta ronda'), 'la ronda 1 nunca sugiere otro modelo');
+  assert.ok(
+    peticion.indexOf('## Contexto permitido') > peticion.indexOf('## Instrucciones para el agente revisor'),
+    'va tras las instrucciones'
+  );
+  assert.ok(peticion.indexOf('## Contexto permitido') < peticion.indexOf('## Commits a revisar'));
+  const lineas = informe.split('\n');
+  const i = lineas.indexOf('## Lecturas fuera del contexto permitido');
+  assert.notEqual(i, -1);
+  assert.equal(lineas.slice(i + 1).find((l) => l.trim() !== ''), 'ninguna');
+});
+
+test('contexto permitido (TASK-081): la funcion pura filtra grupo y extra con excluir, y no deja al revisor sin enunciado', () => {
+  const lista = contextoPermitido({
+    carpetaTarea: 'tareas/03-en-revision/TASK-1',
+    ficherosDelGrupo: ['src/a.ts', 'dist/a.js', 'src/b.lock'],
+    extra: ['docs/x.md', 'build/y.js', 'src/a.ts'],
+    excluir: ['**/dist/**', '**/*.lock', 'build/**', 'tareas/**', EXCLUIR_HELDOUT],
+  });
+  // `tareas/**` esta excluido del diff y aun asi tarea.md y planificacion/ entran.
+  assert.deepEqual(lista, [
+    'tareas/03-en-revision/TASK-1/tarea.md',
+    'tareas/03-en-revision/TASK-1/planificacion/',
+    'src/a.ts',
+    'docs/x.md',
+  ]);
+});
+
+test('contexto permitido (TASK-081): contexto_revision en config.yml es una lista y no ancla los patrones', () => {
+  const RUTA = '/repo/.taskcode/config.yml';
+  assert.deepEqual(parsearConfig('limite_wip: 1\n', RUTA).contexto_revision, []);
+  assert.deepEqual(parsearConfig('contexto_revision: [README.md, docs/guia.md]\n', RUTA).contexto_revision, [
+    'README.md',
+    'docs/guia.md',
+  ]);
+  assert.throws(() => parsearConfig('contexto_revision: docs/guia.md\n', RUTA), /contexto_revision/);
+  assert.throws(() => parsearConfig('contexto_revision: [../fuera]\n', RUTA), /contexto_revision/);
+});
+
+test('contexto permitido (TASK-081): git sigue limpio tras review (nada escrito fuera de la tarea)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-964', rama: 'feature/task-964-limpio' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(repoRoot, JAVA, 'class A {}\n');
+    commitAll(repoRoot, 'trabajo');
+    await advanceDevelop(repoRoot, task.rama);
+    await runReviewCommand(tareasRoot, ['TASK-964'], '2026-11-07', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-modelo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-modelo.test.ts
new file mode 100644
index 0000000..4c43986
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-modelo.test.ts
@@ -0,0 +1,166 @@
+/**
+ * TASK-081: modelo barato en la ronda de verificacion. La ronda 2 sugiere un
+ * escalon menos SOLO si la ronda 1 cumple la regla estricta. Repos Git
+ * temporales reales: `review` (r1) -> informes -> `veredicto` -> correccion ->
+ * `review` (r2); lo que se asevera es el valor concreto de la peticion.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, readdir, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runVeredictoCommand } from '../../src/commands/veredicto.js';
+import { ESCALERA_MODELOS, modeloDeVerificacion } from '../../src/core/modelo-revision.js';
+import {
+  SCRIPTS_DIR,
+  sampleTask,
+  commitAll,
+  withTempRepo,
+  setupTaskEnCursoSoloTarea,
+  advanceDevelop,
+  escribirFichero,
+} from '../helpers/review-fixtures.js';
+
+const JAVA = 'src/main/java/com/acme/UserService.java';
+const ANGULAR = 'src/app/user-profile/user-profile.component.ts';
+const [OPUS, SONNET, HAIKU] = ESCALERA_MODELOS as [string, string, string];
+
+/** Un informe con la tabla de hallazgos que se le pase (filas ya formadas). */
+function informe(filas: string[]): string {
+  return (
+    '# Informe de revision — TASK-970 (ronda 1)\n\n- Commit revisado: x\n- Revisor: r\n' +
+    '- Veredicto: PENDIENTE\n\n## Hallazgos\n\n' +
+    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
+    filas.join('\n') +
+    '\n\nReproduccion...\n'
+  );
+}
+const IMP = '| IMP-1 | IMPORTANTE | abierto | src/a.ts:1 | implementacion |';
+const MEN = '| MEN-1 | MENOR | abierto | src/a.ts:2 | implementacion |';
+const CRIT_CORREGIDO = '| CRIT-1 | CRITICO | corregido | src/a.ts:3 | implementacion |';
+const CRIT_ABIERTO = '| CRIT-2 | CRITICO | abierto | src/a.ts:3 | implementacion |';
+
+/**
+ * Ronda 1 con `modelo` en la tarea; `informes` por revisor (null = se deja el
+ * esqueleto que genera review, sin tocar). Devuelve la peticion de la ronda 2
+ * del primer revisor y el resultado.
+ */
+async function ronda2(
+  modelo: string,
+  informes: Array<string | null>
+): Promise<{ peticiones: string[]; modeloRonda: string | undefined; r1Peticion: string }> {
+  let salida: { peticiones: string[]; modeloRonda: string | undefined; r1Peticion: string } | null = null;
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const id = 'TASK-970';
+    const task = sampleTask({ id, rama: 'feature/task-970-modelo', modelo_sugerido: modelo });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    const ficheros = informes.length === 2 ? [JAVA, ANGULAR] : [JAVA];
+    for (const f of ficheros) await escribirFichero(repoRoot, f, `// ${f}\n`);
+    commitAll(repoRoot, 'trabajo r1');
+    await advanceDevelop(repoRoot, task.rama);
+    const deps = { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR };
+    const r1 = await runReviewCommand(tareasRoot, [id], '2026-11-07', deps);
+    assert.equal(r1.informes.length, informes.length);
+    assert.equal(r1.modeloRonda, undefined, 'la ronda 1 nunca sugiere otro modelo');
+    const r1Peticion = await readFile((r1.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
+    for (let i = 0; i < informes.length; i++) {
+      const g = r1.informes[i] as { informePath: string };
+      const texto = informes[i];
+      if (texto !== null) await writeFile(g.informePath, texto as string, 'utf8');
+    }
+    commitAll(repoRoot, 'informes r1');
+    for (const g of r1.informes) {
+      await runVeredictoCommand(
+        tareasRoot,
+        [id, 'cambios-solicitados', ...(informes.length > 1 ? ['--informe', path.basename(g.informePath)] : [])],
+        { repoCwd: repoRoot }
+      );
+    }
+    for (const f of ficheros) await escribirFichero(repoRoot, f.replace(/\.(java|ts)$/, 'Arreglo.$1'), '// arreglo\n');
+    commitAll(repoRoot, 'correccion');
+    const r2 = await runReviewCommand(tareasRoot, [id], '2026-11-07', deps);
+    assert.equal(r2.ronda, 2);
+    const dir = path.dirname(r2.informes[0]!.peticionPath);
+    const nombres = (await readdir(dir)).filter((n) => n.startsWith('peticion-revision-2')).sort();
+    const peticiones = await Promise.all(nombres.map((n) => readFile(path.join(dir, n), 'utf8')));
+    salida = { peticiones, modeloRonda: r2.modeloRonda, r1Peticion };
+  });
+  return salida as unknown as { peticiones: string[]; modeloRonda: string | undefined; r1Peticion: string };
+}
+
+function lineaDeRonda(peticion: string): string | undefined {
+  return peticion.split('\n').find((l) => l.startsWith('- Modelo sugerido para esta ronda:'));
+}
+
+test('modelo r2 (TASK-081): (a) solo IMPORTANTES y MENORES en la ronda 1 -> sugiere el escalon de abajo', async () => {
+  const r = await ronda2(OPUS, [informe([IMP, MEN])]);
+  assert.equal(r.modeloRonda, SONNET);
+  assert.equal(
+    lineaDeRonda(r.peticiones[0] as string),
+    `- Modelo sugerido para esta ronda: ${SONNET} (verificacion de correcciones; la tarea usa ${OPUS})`
+  );
+  // La linea de siempre no cambia.
+  assert.ok((r.peticiones[0] as string).includes(`(modelo sugerido: ${OPUS})\n`));
+  assert.equal(lineaDeRonda(r.r1Peticion), undefined);
+});
+
+test('modelo r2 (TASK-081): la tarea en sonnet baja a haiku; en haiku no se sugiere nada', async () => {
+  assert.equal((await ronda2(SONNET, [informe([IMP])])).modeloRonda, HAIKU);
+  const r = await ronda2(HAIKU, [informe([IMP])]);
+  assert.equal(r.modeloRonda, undefined);
+  assert.equal(lineaDeRonda(r.peticiones[0] as string), undefined);
+});
+
+test('modelo r2 (TASK-081): (b) un CRITICO en la ronda 1, abierto o ya corregido -> se mantiene el de la tarea', async () => {
+  for (const fila of [CRIT_ABIERTO, CRIT_CORREGIDO]) {
+    const r = await ronda2(OPUS, [informe([IMP, fila])]);
+    assert.equal(r.modeloRonda, undefined, fila);
+    assert.equal(lineaDeRonda(r.peticiones[0] as string), undefined, fila);
+  }
+});
+
+test('modelo r2 (TASK-081): (c) un CRITICO solo en el SEGUNDO informe de la ronda fragmentada -> no abarata ninguna peticion', async () => {
+  const r = await ronda2(OPUS, [informe([IMP]), informe([CRIT_ABIERTO])]);
+  assert.equal(r.peticiones.length, 2);
+  assert.equal(r.modeloRonda, undefined);
+  for (const p of r.peticiones) assert.equal(lineaDeRonda(p), undefined);
+  // Contraprueba: los dos informes limpios si abaratan.
+  const limpio = await ronda2(OPUS, [informe([IMP]), informe([MEN])]);
+  assert.equal(limpio.modeloRonda, SONNET);
+  for (const p of limpio.peticiones) assert.ok(lineaDeRonda(p)?.includes(` ${SONNET} `), p);
+});
+
+test('modelo r2 (TASK-081): (d) un informe sin tabla de hallazgos -> no abarata', async () => {
+  const sinTabla =
+    '# Informe\n\n- Veredicto: PENDIENTE\n\n## Hallazgos\n\nIMP-1 en prosa, sin tabla.\n';
+  const r = await ronda2(OPUS, [sinTabla]);
+  assert.equal(r.modeloRonda, undefined);
+  assert.equal(lineaDeRonda(r.peticiones[0] as string), undefined);
+});
+
+test('modelo r2 (TASK-081): (e) un informe que sigue siendo la plantilla -> no abarata (ni uno de dos)', async () => {
+  const sola = await ronda2(OPUS, [null]);
+  assert.equal(sola.modeloRonda, undefined);
+  assert.equal(lineaDeRonda(sola.peticiones[0] as string), undefined);
+  const mezcla = await ronda2(OPUS, [informe([IMP]), null]);
+  assert.equal(mezcla.modeloRonda, undefined);
+  for (const p of mezcla.peticiones) assert.equal(lineaDeRonda(p), undefined);
+});
+
+test('modelo r2 (TASK-081): una severidad desconocida o un informe "sin hallazgos" real', async () => {
+  const rara = await ronda2(OPUS, [informe(['| X-1 | Alta | abierto | src/a.ts:1 | plan |'])]);
+  assert.equal(rara.modeloRonda, undefined);
+  // Revisado de verdad y sin hallazgos (fila marcador, sin la fila de ejemplo): cuenta como limpio.
+  const limpio = await ronda2(OPUS, [informe(['| (ninguno) | — | sin hallazgos | — | — |'])]);
+  assert.equal(limpio.modeloRonda, SONNET);
+});
+
+test('modeloDeVerificacion (TASK-081): un escalon por debajo; haiku y desconocidos no se sugieren', () => {
+  assert.equal(modeloDeVerificacion(OPUS), SONNET);
+  assert.equal(modeloDeVerificacion(SONNET), HAIKU);
+  assert.equal(modeloDeVerificacion(HAIKU), null);
+  assert.equal(modeloDeVerificacion('gpt-4'), null);
+  assert.equal(modeloDeVerificacion(''), null);
+  assert.equal(modeloDeVerificacion(' Opus '), SONNET);
+  assert.deepEqual([...ESCALERA_MODELOS], ['opus', 'sonnet', 'haiku']);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts
new file mode 100644
index 0000000..d2ad411
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/revision-lecturas.test.ts
@@ -0,0 +1,307 @@
+/**
+ * TASK-081: lecturas de los revisores por (ronda, revisor), de punta a punta y
+ * contra recursos reales: repos Git temporales, un CLAUDE_CONFIG_DIR temporal
+ * con `.jsonl` escritos a mano y el CLI de verdad (sin mocks).
+ *
+ *  - `registrar-coste --fase revision --agente ...` deja UNA FILA POR AGENTE con
+ *    la ronda y el revisor que deduce de su transcripcion.
+ *  - `metricas --tokens` los pinta en un bloque aparte, sin tocar la tabla, sin
+ *    leer `~/.claude` y sin escribir nada.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { leerCostes } from '../../src/core/coste-registro.js';
+import { ID, CONFIG_AUTO, TASKCTL, git, commitAll, withRepo, hastaCodigo } from '../helpers/automatico-fixtures.js';
+import { COSTE_POR_LECTURA, promptDeRevision, transcripcionRevisor } from '../helpers/transcripcion-revision.js';
+
+const X = 'a1b2c3d4e5f60711';
+const Y = 'a1b2c3d4e5f60722';
+const R2 = 'a1b2c3d4e5f60733';
+const Z = 'a1b2c3d4e5f60744';
+const W = 'a1b2c3d4e5f60755';
+
+async function transcripcion(config: string, agente: string, lineas: string[]): Promise<void> {
+  const dir = path.join(config, 'projects', 'proy', 'sesion', 'subagents');
+  await mkdir(dir, { recursive: true });
+  await writeFile(path.join(dir, `agent-${agente}.jsonl`), lineas.join('\n') + '\n', 'utf8');
+}
+
+async function conConfig(fn: (config: string) => Promise<void>): Promise<void> {
+  const config = await mkdtemp(path.join(tmpdir(), 'taskctl-claude-config-'));
+  try {
+    await fn(config);
+  } finally {
+    await rm(config, { recursive: true, force: true });
+  }
+}
+
+type Salida = { status: number | null; stdout: string; stderr: string };
+
+function taskctl(repo: string, config: string, args: string[]): Salida {
+  const r = spawnSync(process.execPath, [TASKCTL, ...args], {
+    cwd: repo,
+    encoding: 'utf8',
+    env: { ...process.env, CLAUDE_CONFIG_DIR: config },
+  });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+function ok(repo: string, config: string, args: string[]): Salida {
+  const r = taskctl(repo, config, args);
+  assert.equal(r.status, 0, `${args.join(' ')}: ${r.stderr}`);
+  return r;
+}
+
+const dirRev = (tareasRoot: string): string => path.join(tareasRoot, '02-en-curso', ID, 'revision');
+
+function informe(filas: string[]): string {
+  return [
+    '# Informe de revision',
+    '',
+    '- Veredicto: aprobada',
+    '',
+    '## Hallazgos',
+    '',
+    '| ID | Severidad | Estado | Fichero | Origen |',
+    '|---|---|---|---|---|',
+    ...filas,
+    '',
+  ].join('\n');
+}
+
+async function escribir(tareasRoot: string, nombre: string, texto: string): Promise<void> {
+  await mkdir(dirRev(tareasRoot), { recursive: true });
+  await writeFile(path.join(dirRev(tareasRoot), nombre), texto, 'utf8');
+}
+
+/** Filas de datos del bloque «Lecturas de revision por revisor y ronda» de la salida de `metricas --tokens`. */
+function bloque(stdout: string): string[][] {
+  const lineas = stdout.split('\n');
+  const i = lineas.findIndex((l) => l === 'Lecturas de revision por revisor y ronda:');
+  assert.ok(i >= 0, `no hay bloque de lecturas en:\n${stdout}`);
+  const filas: string[][] = [];
+  for (let j = i + 3; j < lineas.length && (lineas[j] as string).startsWith('|'); j++) {
+    filas.push((lineas[j] as string).slice(1, -1).split('|').map((c) => c.trim()));
+  }
+  assert.match(lineas[i + 1] as string, /^\| tarea +\| ronda +\| revisor +\| lecturas +\| entrada +\| cache_lect +\| crit +\| imp +\|$/);
+  return filas;
+}
+
+const FILAS_X1 = [
+  '| CRI-1 | CRITICO | corregido | app.txt | implementacion |',
+  '| IMP-1 | IMPORTANTE | abierto | app.txt | plan |',
+  '| IMP-2 | **Importante** (ronda 1) | aceptado | app.txt | plan |',
+  '| MEN-1 | MENOR | aceptado | app.txt | plan |',
+];
+
+test('metricas --tokens: dos revisores en r1 y uno en r2 salen como (ronda, revisor, lecturas) exactos, con sus CRITICO/IMPORTANTE, sin escribir nada ni leer ~/.claude', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 3));
+      await transcripcion(config, Y, transcripcionRevisor(promptDeRevision('peticion-revision-1-y-reviewer.md'), 5));
+      await transcripcion(config, R2, transcripcionRevisor(promptDeRevision('peticion-revision-2-x-reviewer.md'), 2));
+
+      const antes = Number(git(['rev-list', '--count', 'HEAD'], repo).trim());
+      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', X, '--agente', Y]);
+      assert.equal(Number(git(['rev-list', '--count', 'HEAD'], repo).trim()), antes + 1, 'dos agentes, UN commit');
+      const tras1 = await readTareaFile(tareasRoot, ID);
+      assert.deepEqual(
+        leerCostes(tras1?.body ?? '').map((f) => [f.fuente, f.ronda, f.revisor, f.lecturas]),
+        [
+          [`agente:${X}`, 1, 'x-reviewer', 3],
+          [`agente:${Y}`, 1, 'y-reviewer', 5],
+        ],
+        'una fila por agente, cada una con lo suyo'
+      );
+      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', R2]);
+      assert.equal((await readTareaFile(tareasRoot, ID))?.task.tokens_revision, 10 * COSTE_POR_LECTURA.total);
+
+      await escribir(tareasRoot, 'informe-revision-1-x-reviewer.md', informe(FILAS_X1));
+      await escribir(tareasRoot, 'informe-revision-1-y-reviewer.md', informe(['| IMP-1 | IMPORTANTE | corregido | app.txt | plan |']));
+      await escribir(tareasRoot, 'informe-revision-2-x-reviewer.md', informe(['| (ninguno) | — | sin hallazgos | — | — |']));
+      commitAll(repo, 'docs: informes de revision');
+
+      const r = ok(repo, config, ['metricas', '--tokens']);
+      assert.deepEqual(bloque(r.stdout), [
+        [ID, '1', 'x-reviewer', '3', '30', '300', '1', '2'],
+        [ID, '1', 'y-reviewer', '5', '50', '500', '0', '1'],
+        [ID, '2', 'x-reviewer', '2', '20', '200', '0', '0'],
+      ]);
+      assert.match(r.stdout, /lecturas = LLAMADAS de lectura del revisor, no bytes/);
+      assert.equal(git(['status', '--porcelain'], repo).trim(), '', 'sin --escribir, metricas no deja nada sucio');
+
+      // --json lleva lo mismo, con los null a la vista.
+      const j = JSON.parse(ok(repo, config, ['metricas', '--json']).stdout) as {
+        lecturasRevision: { id: string; ronda: number | null; revisor: string | null; lecturas: number | null; critico: number | null; importante: number | null }[];
+      };
+      assert.deepEqual(
+        j.lecturasRevision.map((g) => [g.id, g.ronda, g.revisor, g.lecturas, g.critico, g.importante]),
+        [
+          [ID, 1, 'x-reviewer', 3, 1, 2],
+          [ID, 1, 'y-reviewer', 5, 0, 1],
+          [ID, 2, 'x-reviewer', 2, 0, 0],
+        ]
+      );
+
+      // El bloque generado de docs/METRICAS.md no cambia de forma: lo nuevo NO va en --escribir.
+      ok(repo, config, ['metricas', '--tokens', '--escribir']);
+      const md = await readFile(path.join(repo, 'docs', 'METRICAS.md'), 'utf8');
+      assert.doesNotMatch(md, /x-reviewer|Lecturas de revision|cache_lect/);
+    });
+  });
+});
+
+test('metricas no lee ~/.claude: con el CLAUDE_CONFIG_DIR borrado entre registrar-coste y metricas, las lecturas siguen saliendo y lo ausente es "—", no 0', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    const config = await mkdtemp(path.join(tmpdir(), 'taskctl-claude-config-'));
+    await hastaCodigo(repo, tareasRoot);
+    await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 4));
+    await transcripcion(config, Z, transcripcionRevisor(null, 6)); // no nombra su peticion: sin atribuir
+    ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', X, '--agente', Z]);
+    await rm(config, { recursive: true, force: true });
+
+    // Ni existe el directorio ni hay otro: si metricas lo buscara, fallaria.
+    const r = ok(repo, config, ['metricas', '--tokens']);
+    assert.deepEqual(bloque(r.stdout), [
+      [ID, '1', 'x-reviewer', '4', '40', '400', '—', '—'],
+      [ID, '—', '—', '6', '60', '600', '—', '—'],
+    ]);
+    assert.doesNotMatch(bloque(r.stdout).flat().join(' '), /\b0\b/, 'lo ausente nunca se pinta como 0');
+  });
+});
+
+test('filas antiguas de 9 columnas: se leen con sus totales y revisor "—", doctor las da por validas y registrar-coste no las cuenta dos veces', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      const t = await readTareaFile(tareasRoot, ID);
+      assert.ok(t);
+      // Tarea con la tabla ANTIGUA: cabecera y fila de 9 columnas, y su total en el frontmatter.
+      const antiguo =
+        t.body.replace(/\n*$/, '\n') +
+        '\n## Coste\n\n' +
+        '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |\n' +
+        '|---|---|---|---|---|---|---|---|---|\n' +
+        `| 2026-10-25T10:00:00Z | revision | agente:${X} | 20 | 20 | 200 | 10 | 2 | 250 |\n`;
+      const crudo = await readFile(t.filePath, 'utf8');
+      const sinCuerpo = crudo.slice(0, crudo.indexOf(t.body.slice(0, 20)));
+      assert.match(sinCuerpo, /^tokens_revision:.*$/m);
+      await writeFile(t.filePath, sinCuerpo.replace(/^tokens_revision:.*$/m, 'tokens_revision: 250') + antiguo, 'utf8');
+      commitAll(repo, 'docs: tabla de coste antigua');
+
+      await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 2));
+      const m = ok(repo, config, ['metricas', '--tokens']);
+      assert.deepEqual(bloque(m.stdout), [[ID, '—', '—', '2', '20', '200', '—', '—']]);
+      assert.doesNotMatch(m.stderr, /supera tokens_|esta vacio pero/, 'los totales de la fila antigua cuadran');
+
+      const doctor = JSON.parse(taskctl(repo, config, ['doctor', '--json']).stdout) as {
+        comprobaciones: { id: string; nivel: string; mensaje: string }[];
+      };
+      const tareas = doctor.comprobaciones.find((c) => c.id === 'tareas');
+      assert.equal(tareas?.nivel, 'ok', tareas?.mensaje);
+
+      // Se reanuda el mismo agente: su transcripcion acumula lo ya anotado, y solo suma lo que crecio.
+      await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 3));
+      const r = ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', X]);
+      assert.match(r.stdout, /\+125 tokens/, 'solo la diferencia, no 375 (no doble conteo)');
+      assert.equal((await readTareaFile(tareasRoot, ID))?.task.tokens_revision, 375);
+      const filas = leerCostes((await readTareaFile(tareasRoot, ID))?.body ?? '');
+      assert.deepEqual(
+        filas.map((f) => [f.fuente, f.total, f.ronda, f.revisor, f.lecturas]),
+        [
+          [`agente:${X}`, 250, null, null, 2],
+          [`agente:dif:${X}`, 125, 1, 'x-reviewer', 1],
+        ]
+      );
+      const m2 = ok(repo, config, ['metricas', '--tokens']);
+      assert.deepEqual(bloque(m2.stdout), [
+        [ID, '1', 'x-reviewer', '1', '10', '100', '—', '—'],
+        [ID, '—', '—', '2', '20', '200', '—', '—'],
+      ]);
+      assert.doesNotMatch(m2.stderr, /aparece en \d+ filas/);
+    });
+  });
+});
+
+test('--ronda/--revisor: solo con un unico --agente, validados contra las peticiones que hay en revision/; texto libre aborta sin tocar nada', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      await escribir(tareasRoot, 'peticion-revision-1-x-reviewer.md', '# peticion\n');
+      await escribir(tareasRoot, 'peticion-revision-1-y-reviewer.md', '# peticion\n');
+      await escribir(tareasRoot, 'peticion-revision-2.md', '# peticion\n');
+      await transcripcion(config, Z, transcripcionRevisor(null, 2));
+      await transcripcion(config, X, transcripcionRevisor(null, 1));
+      await transcripcion(config, W, transcripcionRevisor(promptDeRevision('peticion-revision-1-x-reviewer.md'), 1));
+      const head = (): string => git(['rev-parse', 'HEAD'], repo).trim();
+      const antes = head();
+
+      const casos: [string[], RegExp][] = [
+        [['--agente', Z, '--ronda', '1', '--revisor', 'texto-libre'], /--revisor "texto-libre" no es ninguno de los revisores de la ronda 1: x-reviewer, y-reviewer/],
+        [['--agente', Z, '--ronda', '1'], /--revisor "" no es ninguno de los revisores de la ronda 1/],
+        [['--agente', Z, '--ronda', '7', '--revisor', 'x-reviewer'], /--ronda 7 no existe/],
+        [['--agente', Z, '--revisor', 'x-reviewer'], /--ronda necesita un entero/],
+        [['--agente', Z, '--ronda', 'abc'], /--ronda "abc" no es un entero/],
+        [['--agente', Z, '--ronda', '0'], /--ronda "0" no es un entero/],
+        [['--agente', Z, '--agente', X, '--ronda', '1', '--revisor', 'x-reviewer'], /UN unico --agente/],
+        [['--tokens', '10', '--ronda', '1'], /UN unico --agente/],
+        [['--agente', W, '--ronda', '1', '--revisor', 'y-reviewer'], /nombra la ronda 1 y el revisor x-reviewer, y --ronda\/--revisor dicen otra cosa/],
+      ];
+      for (const [extra, esperado] of casos) {
+        const r = taskctl(repo, config, ['registrar-coste', ID, '--fase', 'revision', ...extra]);
+        assert.equal(r.status, 1, extra.join(' '));
+        assert.match(r.stderr, esperado, extra.join(' '));
+      }
+      const fuera = taskctl(repo, config, ['registrar-coste', ID, '--fase', 'diseno', '--agente', Z, '--ronda', '1', '--revisor', 'x-reviewer']);
+      assert.equal(fuera.status, 1);
+      assert.match(fuera.stderr, /solo valen con --fase revision/);
+      assert.equal(head(), antes, 'ningun error commitea');
+      assert.equal((await readTareaFile(tareasRoot, ID))?.task.tokens_revision, null);
+
+      // Validos: el sustituto vale cuando la transcripcion no nombra la peticion...
+      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', Z, '--ronda', '1', '--revisor', 'y-reviewer']);
+      // ...una ronda sin fragmentar solo necesita --ronda...
+      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', X, '--ronda', '2']);
+      // ...y si coincide con lo deducido, tambien se acepta.
+      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', W, '--ronda', '1', '--revisor', 'x-reviewer']);
+      assert.deepEqual(
+        leerCostes((await readTareaFile(tareasRoot, ID))?.body ?? '').map((f) => [f.fuente, f.ronda, f.revisor]),
+        [
+          [`agente:${Z}`, 1, 'y-reviewer'],
+          [`agente:${X}`, 2, ''],
+          [`agente:${W}`, 1, 'x-reviewer'],
+        ]
+      );
+    });
+  });
+});
+
+test('lo que no se deduce ni se declara queda sin atribuir (ronda "-"), y las fases que no son revision siguen con UNA fila por llamada', async () => {
+  await withRepo(CONFIG_AUTO, async (repo, tareasRoot) => {
+    await conConfig(async (config) => {
+      await hastaCodigo(repo, tareasRoot);
+      await transcripcion(config, Z, transcripcionRevisor(null, 2));
+      await transcripcion(config, X, transcripcionRevisor(promptDeRevision('peticion-revision-1.md'), 1));
+      ok(repo, config, ['registrar-coste', ID, '--fase', 'revision', '--agente', Z, '--agente', X]);
+      ok(repo, config, ['registrar-coste', ID, '--fase', 'implementacion', '--agente', Z, '--agente', X]);
+      const filas = leerCostes((await readTareaFile(tareasRoot, ID))?.body ?? '');
+      assert.deepEqual(
+        filas.map((f) => [f.fase, f.fuente, f.ronda, f.revisor]),
+        [
+          ['revision', `agente:${Z}`, null, null],
+          ['revision', `agente:${X}`, 1, ''],
+          ['implementacion', `agente:${Z},${X}`, null, null],
+        ]
+      );
+      const crudo = await readFile((await readTareaFile(tareasRoot, ID))?.filePath ?? '', 'utf8');
+      assert.match(crudo, new RegExp(`agente:${Z} \\| 20 \\| 20 \\| 200 \\| 10 \\| 2 \\| 250 \\| - \\| - \\|`));
+      assert.match(crudo, new RegExp(`agente:${X} \\| 10 \\| 10 \\| 100 \\| 5 \\| 1 \\| 125 \\| 1 \\| - \\|`));
+    });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts
index d75bdf2..e45b7f8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-registro.test.ts
@@ -25,6 +25,8 @@ const AGENTE: FilaCoste = {
   salida: 800,
   lecturas: 14,
   total: 93920,
+  ronda: null,
+  revisor: null,
 };
 
 const MANUAL: FilaCoste = {
@@ -37,6 +39,8 @@ const MANUAL: FilaCoste = {
   salida: null,
   lecturas: null,
   total: 5000,
+  ronda: null,
+  revisor: null,
 };
 
 const ANTIGUO = '## Objetivo\nAlgo.\n\n## Criterios de aceptacion\n- [ ] uno\n';
@@ -48,8 +52,8 @@ test('cuerpo sin seccion: la crea al final, deja el resto byte a byte y la fila
     body.slice(ANTIGUO.length),
     '\n## Coste\n\n' +
       `${CABECERA_COSTE}\n` +
-      '|---|---|---|---|---|---|---|---|---|\n' +
-      '| 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 |\n'
+      '|---|---|---|---|---|---|---|---|---|---|---|\n' +
+      '| 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 | - | - |\n'
   );
   assert.deepEqual(leerCostes(body), [AGENTE]);
 });
@@ -63,7 +67,7 @@ test('una tarea antigua sin tabla no tiene filas, y leer no falla con basura', (
 test('la segunda fila va detras de la ultima de la tabla, sin reescribir la primera; la manual lleva "-"', () => {
   const una = anadirCoste(ANTIGUO, AGENTE);
   const dos = anadirCoste(una + '\nTexto despues de la tabla.\n', MANUAL);
-  assert.match(dos, /\| 93920 \|\n\| 2026-10-25T15:10:00Z \| implementacion \| manual \| - \| - \| - \| - \| - \| 5000 \|\n\nTexto despues/);
+  assert.match(dos, /\| 93920 \| - \| - \|\n\| 2026-10-25T15:10:00Z \| implementacion \| manual \| - \| - \| - \| - \| - \| 5000 \| - \| - \|\n\nTexto despues/);
   assert.deepEqual(leerCostes(dos), [AGENTE, MANUAL]);
 });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts
new file mode 100644
index 0000000..0271b48
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-revision.test.ts
@@ -0,0 +1,151 @@
+/**
+ * TASK-081: ronda y revisor de un subagente de revision (puro), lectura de
+ * `## Coste` con filas de 9 y de 11 columnas, y agrupacion por (ronda, revisor).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { rondaYRevisorDeTranscripcion } from '../../src/core/coste-transcripcion.js';
+import {
+  CABECERA_COSTE,
+  anadirCoste,
+  leerCostes,
+  lecturasDeRevision,
+  type FilaCoste,
+} from '../../src/core/coste-registro.js';
+import { rondaYRevisorDePeticion } from '../../src/fs/rondas.js';
+import {
+  promptDeRevision,
+  transcripcionRevisor,
+  usuarioBloques,
+  usuarioTexto,
+} from '../helpers/transcripcion-revision.js';
+
+const unir = (lineas: string[]): string => lineas.join('\n') + '\n';
+
+test('rondaYRevisorDeTranscripcion: contenido string, ronda fragmentada (revisor = sufijo) y sin fragmentar (revisor vacio)', () => {
+  assert.deepEqual(
+    rondaYRevisorDeTranscripcion(unir(transcripcionRevisor(promptDeRevision('peticion-revision-2-java-spring-reviewer.md'), 1))),
+    { ronda: 2, revisor: 'java-spring-reviewer' }
+  );
+  assert.deepEqual(
+    rondaYRevisorDeTranscripcion(unir(transcripcionRevisor(promptDeRevision('peticion-revision-1.md'), 1))),
+    { ronda: 1, revisor: '' }
+  );
+  assert.deepEqual(rondaYRevisorDeTranscripcion(usuarioTexto('ver peticion-revision-12-x.md.')), { ronda: 12, revisor: 'x' });
+});
+
+test('rondaYRevisorDeTranscripcion: contenido como bloques de texto (los que no son texto se ignoran)', () => {
+  const bloques = JSON.stringify({
+    type: 'user',
+    message: { content: [{ type: 'image', source: 'x' }, { type: 'text', text: 'ruta: revision/peticion-revision-3-a-b.md' }] },
+  });
+  assert.deepEqual(rondaYRevisorDeTranscripcion(bloques), { ronda: 3, revisor: 'a-b' });
+  assert.deepEqual(rondaYRevisorDeTranscripcion(usuarioBloques('hola', 'peticion-revision-4.md')), { ronda: 4, revisor: '' });
+});
+
+test('rondaYRevisorDeTranscripcion: sin peticion, sin mensaje de usuario o con basura da null (nunca la ronda 1)', () => {
+  assert.equal(rondaYRevisorDeTranscripcion(''), null);
+  assert.equal(rondaYRevisorDeTranscripcion('no es json\n{}\n'), null);
+  assert.equal(rondaYRevisorDeTranscripcion(unir(transcripcionRevisor(null, 2))), null, 'sin mensaje user');
+  assert.equal(rondaYRevisorDeTranscripcion(usuarioTexto('revisa la tarea sin ruta')), null);
+  assert.equal(rondaYRevisorDeTranscripcion(usuarioTexto('el informe-revision-1.md y peticion-revision-x.md')), null);
+  assert.equal(rondaYRevisorDeTranscripcion(usuarioTexto('xpeticion-revision-1.md')), null, 'pegado a otro nombre no cuenta');
+  assert.equal(rondaYRevisorDeTranscripcion(usuarioTexto('mi-peticion-revision-1.md')), null);
+});
+
+test('rondaYRevisorDeTranscripcion: solo mira el PRIMER mensaje de usuario', () => {
+  const texto = unir([usuarioTexto('Revisa sin ruta'), usuarioTexto(promptDeRevision('peticion-revision-9-otro.md'))]);
+  assert.equal(rondaYRevisorDeTranscripcion(texto), null);
+  const primero = unir([usuarioTexto(promptDeRevision('peticion-revision-1-x.md')), usuarioTexto('peticion-revision-9-otro.md')]);
+  assert.deepEqual(rondaYRevisorDeTranscripcion(primero), { ronda: 1, revisor: 'x' });
+});
+
+test('la regex de rondas es una sola: rondaYRevisorDePeticion da la misma clave que los informes', () => {
+  assert.deepEqual(rondaYRevisorDePeticion('peticion-revision-2-x.md'), { ronda: 2, revisor: 'x' });
+  assert.deepEqual(rondaYRevisorDePeticion('peticion-revision-2.md'), { ronda: 2, revisor: '' });
+  assert.equal(rondaYRevisorDePeticion('informe-revision-2.md'), null);
+});
+
+function fila(o: Partial<FilaCoste>): FilaCoste {
+  return {
+    fecha: '2026-10-25T10:00:00Z',
+    fase: 'revision',
+    fuente: 'agente:a1b2c3',
+    entrada: 10,
+    cacheEscritura: 20,
+    cacheLectura: 300,
+    salida: 40,
+    lecturas: 4,
+    total: 370,
+    ronda: null,
+    revisor: null,
+    ...o,
+  };
+}
+
+test('leerCostes lee filas de 9 columnas (sin ronda ni revisor) y de 11, mezcladas, y la cabecera nueva es de 11', () => {
+  assert.equal(CABECERA_COSTE.split('|').length - 2, 11);
+  const cuerpo =
+    '## Coste\n\n' +
+    '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |\n' +
+    '|---|---|---|---|---|---|---|---|---|\n' +
+    '| 2026-10-25T10:00:00Z | revision | agente:a1b2c3 | 10 | 20 | 300 | 40 | 4 | 370 |\n' +
+    '| 2026-10-25T11:00:00Z | revision | agente:b1b2c3 | 1 | 2 | 3 | 4 | 5 | 10 | 2 | x-reviewer |\n' +
+    '| 2026-10-25T12:00:00Z | revision | agente:c1b2c3 | 1 | 2 | 3 | 4 | 5 | 10 | 1 | - |\n' +
+    '| 2026-10-25T13:00:00Z | revision | agente:d1b2c3 | 1 | 2 | 3 | 4 | 5 | 10 | - | - |\n' +
+    '| fila | de | 10 | columnas |\n';
+  assert.deepEqual(
+    leerCostes(cuerpo).map((x) => [x.fuente, x.total, x.ronda, x.revisor]),
+    [
+      ['agente:a1b2c3', 370, null, null],
+      ['agente:b1b2c3', 10, 2, 'x-reviewer'],
+      ['agente:c1b2c3', 10, 1, ''],
+      ['agente:d1b2c3', 10, null, null],
+    ]
+  );
+});
+
+test('anadirCoste escribe 11 columnas y NO reescribe las filas de 9 que ya hay', () => {
+  const antiguo =
+    '## Coste\n\n' +
+    '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |\n' +
+    '|---|---|---|---|---|---|---|---|---|\n' +
+    '| 2026-10-25T10:00:00Z | revision | agente:a1b2c3 | 10 | 20 | 300 | 40 | 4 | 370 |\n';
+  const nuevo = anadirCoste(antiguo, fila({ fuente: 'agente:b1b2c3', ronda: 1, revisor: 'x-reviewer' }));
+  assert.ok(nuevo.startsWith(antiguo), 'lo anterior queda byte a byte');
+  assert.match(nuevo, /\| agente:b1b2c3 \| 10 \| 20 \| 300 \| 40 \| 4 \| 370 \| 1 \| x-reviewer \|\n$/);
+  const sinFragmentar = anadirCoste(antiguo, fila({ ronda: 3, revisor: '' }));
+  assert.match(sinFragmentar, /\| 370 \| 3 \| - \|\n$/);
+  assert.deepEqual(
+    leerCostes(sinFragmentar).map((x) => [x.ronda, x.revisor]),
+    [
+      [null, null],
+      [3, ''],
+    ]
+  );
+});
+
+test('lecturasDeRevision agrupa por (ronda, revisor), suma sus filas y deja la ausencia en null', () => {
+  const grupos = lecturasDeRevision([
+    fila({ ronda: 1, revisor: 'x', lecturas: 3, entrada: 30, cacheLectura: 300 }),
+    fila({ ronda: 1, revisor: 'y', lecturas: 5, entrada: 50, cacheLectura: 500 }),
+    fila({ ronda: 2, revisor: 'x', lecturas: 2, entrada: 20, cacheLectura: 200 }),
+    fila({ ronda: 1, revisor: 'x', lecturas: 4, entrada: 40, cacheLectura: 400 }),
+    fila({ ronda: null, revisor: null, lecturas: 7 }),
+    fila({ ronda: null, revisor: null, lecturas: null, entrada: null, cacheLectura: null }),
+    fila({ fase: 'diseno', ronda: 1, revisor: 'x', lecturas: 99 }),
+    fila({ fuente: 'manual', ronda: 4, revisor: '', lecturas: null, entrada: null, cacheLectura: null }),
+  ]);
+  assert.deepEqual(
+    grupos.map((g) => [g.ronda, g.revisor, g.filas, g.lecturas, g.entrada, g.cacheLectura]),
+    [
+      [1, 'x', 2, 7, 70, 700],
+      [1, 'y', 1, 5, 50, 500],
+      [2, 'x', 1, 2, 20, 200],
+      [4, '', 1, null, null, null],
+      [null, null, 2, 7, 10, 300],
+    ]
+  );
+  assert.deepEqual(lecturasDeRevision([fila({ fase: 'diseno' })]), [], 'sin filas de revision no hay grupos');
+  assert.deepEqual(lecturasDeRevision([]), []);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
index 4d6ce18..96577fd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-fila.test.ts
@@ -68,6 +68,8 @@ function agente(fase: FilaCoste['fase'], fuente: string, e: number, w: number, r
     salida: s,
     lecturas: l,
     total: e + w + r + s,
+    ronda: null,
+    revisor: null,
   };
 }
 
@@ -82,12 +84,14 @@ function manual(fase: FilaCoste['fase'], total: number): FilaCoste {
     salida: null,
     lecturas: null,
     total,
+    ronda: null,
+    revisor: null,
   };
 }
 
 function filaTexto(f: FilaCoste): string {
   const c = (n: number | null): string => (n === null ? '-' : String(n));
-  return `| ${f.fecha} | ${f.fase} | ${f.fuente} | ${c(f.entrada)} | ${c(f.cacheEscritura)} | ${c(f.cacheLectura)} | ${c(f.salida)} | ${c(f.lecturas)} | ${String(f.total)} |`;
+  return `| ${f.fecha} | ${f.fase} | ${f.fuente} | ${c(f.entrada)} | ${c(f.cacheEscritura)} | ${c(f.cacheLectura)} | ${c(f.salida)} | ${c(f.lecturas)} | ${String(f.total)} |${f.ronda === null ? ' - | - |' : ''}`;
 }
 
 function cuerpoConCoste(filas: readonly FilaCoste[], extra = ''): string {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/transcripcion-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/transcripcion-revision.ts
new file mode 100644
index 0000000..2e874cc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/transcripcion-revision.ts
@@ -0,0 +1,38 @@
+/**
+ * TASK-081: transcripciones de subagentes REVISORES (`agent-<id>.jsonl`) con la
+ * forma de Claude Code: el primer mensaje `user` es el prompt con la ruta de la
+ * peticion, y despues vienen `N` lecturas con su `usage`. Fixture NUEVO: no
+ * toca `TRANSCRIPCION_EJEMPLO`.
+ */
+import { herramienta, mensaje, uso } from './transcripcion-ejemplo.js';
+
+/** Linea `user` con el contenido como string (lo que escribe Claude Code hoy). */
+export function usuarioTexto(prompt: string): string {
+  return JSON.stringify({ type: 'user', message: { role: 'user', content: prompt } });
+}
+
+/** Linea `user` con el contenido como bloques de texto. */
+export function usuarioBloques(...textos: string[]): string {
+  return JSON.stringify({
+    type: 'user',
+    message: { role: 'user', content: textos.map((text) => ({ type: 'text', text })) },
+  });
+}
+
+/** Prompt de un revisor que lleva la ruta de su peticion, como exige skills/review. */
+export function promptDeRevision(peticion: string): string {
+  return `Revisa la tarea TASK-001 con tu skill. Tu peticion esta en tareas/02-en-curso/TASK-001/revision/${peticion}. Escribe tu informe.`;
+}
+
+/** Cada lectura cuesta 10 de entrada, 10 de escritura de cache, 100 de lectura de cache y 5 de salida. */
+export const COSTE_POR_LECTURA = { entrada: 10, cacheEscritura: 10, cacheLectura: 100, salida: 5, total: 125 } as const;
+
+/** Transcripcion de un revisor: su prompt (o ninguno, con null) y `lecturas` llamadas a `Read`. */
+export function transcripcionRevisor(prompt: string | null, lecturas: number): string[] {
+  const lineas: string[] = prompt === null ? [] : [usuarioTexto(prompt)];
+  for (let i = 1; i <= lecturas; i++) {
+    const n = String(i);
+    lineas.push(mensaje(`m${n}`, [herramienta(`t${n}`, 'Read', { file_path: `f${n}.ts` })], uso(10, 5)));
+  }
+  return lineas;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/lo-que-lees.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/lo-que-lees.test.ts
new file mode 100644
index 0000000..54c79a5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/lo-que-lees.test.ts
@@ -0,0 +1,75 @@
+/**
+ * TASK-081: las skills le dicen al revisor que lea solo el contexto permitido
+ * de su peticion y que justifique lo demas, y a quien orquesta que pase la
+ * ruta de la peticion y el modelo sugerido de la ronda.
+ *
+ * Se asevera sobre la SECCION (encabezado propio fuera de los bloques
+ * cercados, con cuerpo), no sobre una mencion suelta: mismo patron que el
+ * test 9b/10 bis de revisores.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { informeTemplate } from '../../src/commands/review.js';
+import type { Task } from '../../src/core/task.js';
+
+const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+const SKILLS = path.join(PLUGIN_ROOT, 'skills');
+const REVISION_MD = path.join(SKILLS, 'task-workflow', 'revision.md');
+
+/** Cuerpo de la seccion `## <titulo>` fuera de bloques cercados, o null. */
+function seccion(texto: string, titulo: string): string | null {
+  const fuera: string[] = [];
+  let dentro = false;
+  for (const l of texto.split(/\r?\n/)) {
+    if (/^\s*```/.test(l)) {
+      dentro = !dentro;
+      continue;
+    }
+    if (!dentro) fuera.push(l);
+  }
+  const ini = fuera.findIndex((l) => l.trim() === `## ${titulo}`);
+  if (ini === -1) return null;
+  const fin = fuera.findIndex((l, i) => i > ini && /^##\s/.test(l));
+  return fuera.slice(ini + 1, fin === -1 ? fuera.length : fin).join('\n');
+}
+
+const SECCION_PETICION = '## Contexto permitido';
+const SECCION_INFORME = '## Lecturas fuera del contexto permitido';
+
+test('revision.md (TASK-081): "Lo que lees" es una seccion propia que remite a las dos secciones', async () => {
+  const bruto = seccion(await readFile(REVISION_MD, 'utf8'), 'Lo que lees');
+  assert.notEqual(bruto, null, 'revision.md no tiene la seccion "## Lo que lees"');
+  // El texto se parte en lineas: se compara con los espacios colapsados.
+  const cuerpo = (bruto as string).replace(/\s+/g, ' ');
+  assert.ok(cuerpo.includes(SECCION_PETICION.slice(3)), 'no remite al contexto permitido de la peticion');
+  assert.ok(cuerpo.includes(SECCION_INFORME.slice(3)), 'no manda justificar lo leido fuera en el informe');
+});
+
+test('revision.md (TASK-081): contraprueba, una mencion suelta o dentro de un bloque no cuenta como seccion', () => {
+  const suelta = `# T\n\n## Otra\n\nAqui se habla de lo que lees, y de ${SECCION_PETICION}.\n`;
+  assert.equal(seccion(suelta, 'Lo que lees'), null);
+  const enBloque = '# T\n\n```\n## Lo que lees\n```\n';
+  assert.equal(seccion(enBloque, 'Lo que lees'), null);
+  const real = `# T\n\n## Lo que lees\n\nLee ${SECCION_PETICION}.\n\n## Siguiente\n`;
+  assert.ok((seccion(real, 'Lo que lees') as string).includes(SECCION_PETICION));
+});
+
+test('el esqueleto del informe que genera review trae la seccion que revision.md nombra (TASK-081)', () => {
+  const informe = informeTemplate({ id: 'TASK-999' } as unknown as Task, 'abc', 1);
+  assert.ok(informe.includes(`${SECCION_INFORME}\n\nninguna`));
+});
+
+test('code-quality-reviewer (TASK-081): remite a "Lo que lees" de revision.md', async () => {
+  const texto = await readFile(path.join(SKILLS, 'code-quality-reviewer', 'SKILL.md'), 'utf8');
+  assert.match(texto, /Contexto permitido[^\n]*\n[^\n]*"Lo que lees"[^\n]*revision\.md/);
+});
+
+test('review (TASK-081): el prompt del revisor lleva la ruta de su peticion y el modelo sugerido de la ronda', async () => {
+  const texto = (await readFile(path.join(SKILLS, 'review', 'SKILL.md'), 'utf8')).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
+  assert.match(texto, /El prompt de cada revisor lleva la ruta de SU peticion/);
+  assert.ok(texto.includes('peticion-revision-N[-skill].md'));
+  assert.match(texto, /- Modelo sugerido para esta ronda: <modelo> \(\.\.\.\)`, lanza el revisor con ESE modelo/);
+});
````

## Excluido del diff (20 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-081/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-081/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-081/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-081/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-081/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-081/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-081/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-081/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-081/tarea.md                                                       |   6 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |   9 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   |   9 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js                            | 189 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |  73 ++++++++++++++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         |  20 +++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/contexto-revision.js                              |  69 ++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-registro.js                                 |  91 +++++++++++++++++++++++++++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-transcripcion.js                            |  48 +++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       |  50 +++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/modelo-revision.js                                |  22 ++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js                                           |  22 +++++++++-
 20 files changed, 553 insertions(+), 55 deletions(-)
````
