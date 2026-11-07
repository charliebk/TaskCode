# Peticion de revision — TASK-085 (ronda 1)

- Tarea: TASK-085 — Coste de implementacion registrado automaticamente
- Rama revisada: feature/task-085-coste-de-implementacion-registrado-autom
- Rama base: develop
- Commit revisado (HEAD): 126d18d096a7479082c1db060b4df6d66c7922a5
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-085 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-085/tarea.md
- tareas/03-en-revision/TASK-085/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
- taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-automatico.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-automatico.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/coste-turno.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/registro-coste.test.ts

## Commits a revisar (git log develop..HEAD)

````
126d18d feat(TASK-085): coste de implementacion registrado automaticamente
00bce11 chore(TASK-085): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index f1ba2f2..3a81b3d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -732,6 +732,35 @@ caso sale 0 sin lanzar ningún proceso (ni `git`). Cuando actúa:
 - Los subagentes no disparan `Stop` (disparan `SubagentStop`), así que el freno
   no los frena; y no actúa si la persona interrumpe el turno (Esc).
 
+#### Coste de implementación automático (hooks `Stop` y `SubagentStop`)
+
+Con una tarea en curso en la rama actual, el plugin anota al terminar cada
+turno y cada subagente qué transcripción ha trabajado en ella. Solo guarda
+rutas, en `.git/coste-pendiente.jsonl` (`git rev-parse --git-path`): no lee
+transcripciones, no toca `tarea.md`, no cambia la huella del freno de arriba
+y sale siempre con 0. Sin tarea en curso en la rama sale antes de lanzar
+ningún proceso (las mismas guardas baratas que el freno).
+
+`taskctl review` suma ese coste a `tokens_implementacion` en su propio commit,
+con una fila en `## Coste` por fuente: `sesion:<id>` (el hilo principal) y
+`agente:<id>` (cada subagente; también los de la sesión aunque el hook no los
+viera). Cuenta solo las llamadas cuyo `timestamp` cae entre el `start` y el
+`review` de `## Transiciones`, cuyo `gitBranch` es la rama de la tarea y cuyo
+`cwd` está dentro del repo: el diseño, otras tareas de la misma sesión y la
+revisión no entran. Lo ya anotado para un id se descuenta (de uno anotado en
+implementación solo se suma lo que creció, `dif:`; uno anotado en otra fase o
+junto a otros no se toca), así que un `registrar-coste --fase implementacion`
+hecho antes no se duplica. `taskctl finish` repite el volcado como red. Si
+todo el ciclo cabe en un turno, el hook aún no ha corrido al llegar a
+`review`: entonces se usa la sesión que nombra `CLAUDE_CODE_SESSION_ID`, si
+Claude Code la define. Un fallo del volcado nunca rompe `review` ni `finish`:
+deja la tarea como estaba y avisa.
+
+Lo que se acepta: el fichero de `.git/` no viaja con el clon (una tarea
+trabajada en otro clon se registra a mano) y las correcciones de la ronda 2,
+que se hacen con la tarea en revisión, no cuentan como implementación.
+`COSTE_AUTOMATICO=0` en el entorno lo apaga todo.
+
 #### Puerta de verificación en `finish`
 
 Con `comando_verificacion` declarado, `taskctl finish` lo ejecuta **siempre**
@@ -1266,7 +1295,10 @@ en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué
 (`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
 escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
 la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
-avisa, sin bloquear, si falta el coste de diseño o de revisión.
+avisa, sin bloquear, si falta el coste de diseño o de revisión. El de
+implementación ya no hace falta registrarlo a mano: lo suma `review` (ver
+«Coste de implementación automático»); `registrar-coste --fase implementacion`
+queda como respaldo.
 
 `taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]` cierra la
 tarea. Sin los flags nuevos hace lo de siempre: merge `--no-ff` con el script de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
index bf14a6c..b8de698 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
@@ -1,5 +1,5 @@
 {
-  "description": "Frenos de verificacion. Stop: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). PreToolUse: un merge o un script de cierre hacia la rama de integracion o la principal se bloquea si no consta una verificacion en verde del commit que entra; y en la rama de una tarea, leer, buscar o editar la carpeta aceptacion/ de esa tarea (sus tests held-out) se bloquea, con herramientas de fichero o con un comando que la nombre.",
+  "description": "Frenos de verificacion. Stop: con una tarea en curso en la rama y comando_verificacion declarado, el agente no da el turno por terminado con la verificacion en rojo (FRENO_VERIFICACION=0 lo apaga). PreToolUse: un merge o un script de cierre hacia la rama de integracion o la principal se bloquea si no consta una verificacion en verde del commit que entra; y en la rama de una tarea, leer, buscar o editar la carpeta aceptacion/ de esa tarea (sus tests held-out) se bloquea, con herramientas de fichero o con un comando que la nombre. Coste: al terminar cada turno (Stop) o subagente (SubagentStop) con una tarea en curso en la rama, anota que transcripcion trabajo en ella para sumar su coste de implementacion al pasar la tarea a revision; nunca bloquea (COSTE_AUTOMATICO=0 lo apaga).",
   "hooks": {
     "Stop": [
       {
@@ -13,6 +13,32 @@
             "timeout": 3600
           }
         ]
+      },
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "node",
+            "args": [
+              "${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/coste-turno.js"
+            ],
+            "timeout": 30
+          }
+        ]
+      }
+    ],
+    "SubagentStop": [
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "node",
+            "args": [
+              "${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/coste-turno.js"
+            ],
+            "timeout": 30
+          }
+        ]
       }
     ],
     "PreToolUse": [
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
index ecf9f0b..0aa6879 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -23,15 +23,19 @@ Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
    `fase: review` con `accion: continuar`):
    implementa el plan en esta rama, con sus tests y con los skills
    recomendados; commitea; ejecuta la suite del proyecto y no sigas hasta que
-   este en verde. Registra el coste (paso 5) y despues encadena `/taskcode-plugin:review` (seccion de
+   este en verde. Despues encadena `/taskcode-plugin:review` (seccion de
    avance). Si no consigues dejar la suite en verde, para y dilo: no se revisa
    codigo roto.
-5. Al terminar la implementacion (con o sin subagentes) y antes de la revision, registra su coste
-   (`task-workflow/coste.md`): con el id que devolvio la herramienta Agent de
-   cada subagente, `taskctl registrar-coste TASK-NNN --fase implementacion
-   --agente <id> [--agente <id2>...]`. La cifra que muestra Claude Code al
-   terminar un agente NO es su coste (es su contexto final). Tu parte, si
-   quieres, estimada y aparte con `--tokens N`. Sin subagentes, no registres nada.
+5. El coste de la implementacion se registra solo (`task-workflow/coste.md`):
+   un hook anota que sesion y que subagentes trabajan con la tarea en curso, y
+   `taskctl review` suma su uso a `tokens_implementacion` en su commit. **No
+   ejecutes `registrar-coste --fase implementacion`**: si `review` dice que lo
+   ha registrado, ya esta. Solo si no lo dice (tarea trabajada en otro clon,
+   sesion sin el hook, `COSTE_AUTOMATICO=0`), registralo a mano como respaldo:
+   `taskctl registrar-coste TASK-NNN --fase implementacion --agente <id>
+   [--agente <id2>...]`, con el id que devolvio la herramienta Agent de cada
+   subagente (la cifra que muestra Claude Code al terminar un agente NO es su
+   coste: es su contexto final).
 6. En el resto de casos, sigue la seccion de avance (`task-workflow/avance.md`):
    `taskctl siguiente TASK-NNN --json`. Tras `start` la fase es `review`,
    que significa: primero implementar el plan en esta rama, con tests,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
index 9ead166..71e8baa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
@@ -13,11 +13,39 @@ transcripcion del subagente. Por eso no se apunta la cifra de la notificacion:
 se apunta el **id del agente** (`agentId`, hexadecimal), que devuelve la
 herramienta Agent al lanzarlo.
 
-## Como se registra
+## Implementacion: se registra sola
+
+Mientras la tarea esta en curso, un hook del plugin anota al terminar cada
+turno (`Stop`) y cada subagente (`SubagentStop`) que transcripcion trabajo en
+la rama de la tarea. Solo anota rutas, en un fichero bajo `.git/`
+(`coste-pendiente.jsonl`): no lee nada pesado, no toca `tarea.md`, no ensucia
+el arbol y nunca bloquea. Sin una tarea en curso en la rama actual sale sin
+hacer nada.
+
+`taskctl review` suma ese coste en su propio commit: `tokens_implementacion`
+y una fila de `## Coste` por fuente (`sesion:<id>` para el hilo principal,
+`agente:<id>` para cada subagente). Cuenta solo lo que paso con la tarea en
+curso: las llamadas cuyo instante cae entre el `start` y el `review` de
+`## Transiciones`, en la rama de la tarea y dentro del repo. El diseno, otras
+tareas de la misma sesion y la revision no entran. Si `review` no pudo,
+`taskctl finish` lo intenta otra vez; lo ya sumado no se suma dos veces.
+
+Lo que ya estuviera anotado a mano para el mismo id se descuenta: de un agente
+registrado en implementacion solo se suma lo que haya crecido (`dif:`), y uno
+registrado en otra fase, o junto a otros agentes en una misma fila, no se
+toca. Por eso **en implementacion no hace falta `registrar-coste`**. Queda como
+respaldo: el fichero de `.git/` no viaja con el repo, asi que una tarea
+trabajada desde otro clon, o una sesion sin el hook, se registra a mano como
+antes. Cuando todo el ciclo cabe en un solo turno, `review` encuentra la sesion
+que lo ejecuta por `CLAUDE_CODE_SESSION_ID` si Claude Code la define.
+
+`COSTE_AUTOMATICO=0` en el entorno apaga el hook y el volcado.
+
+## Como se registra a mano
 
 Al terminar cada subagente de la fase (diseno = la ronda de roles y el
-unificador; implementacion = los agentes del curso de la tarea; revision =
-revisores y segunda opinion), con su id:
+unificador; revision = revisores y segunda opinion; implementacion, solo como
+respaldo del registro automatico), con su id:
 
 ```bash
 taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision --agente <id>
@@ -48,7 +76,9 @@ dilo como estimacion en el `## Resultado`.
 ## Cuando
 
 - **diseno**: al terminar la ronda de diseno, antes de `taskctl approve`.
-- **implementacion**: al terminar de implementar, antes de pedir la revision.
+- **implementacion**: lo suma `taskctl review` (ver arriba). A mano, solo si
+  el registro automatico no pudo: al terminar de implementar, antes de pedir
+  la revision.
 - **revision**: cuando terminan los revisores de la ronda; si hay varias
   rondas, se va sumando. Funciona tambien con la tarea ya `terminada`.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 91a6089..6c70156 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -712,6 +712,11 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
                 `Una revision completa se pide de antemano con: taskctl review ${result.id} --completa.\n`
               : `Alcance: revision completa (${result.motivoAlcance}).\n`
             : '') +
+          // TASK-085: lo que el registro automatico sumo al coste de implementacion.
+          (result.costeImplementacion.filas > 0
+            ? `Coste de implementacion registrado automaticamente: +${String(result.costeImplementacion.sumado)} ` +
+              `tokens (${String(result.costeImplementacion.filas)} fila(s) en "## Coste").\n`
+            : '') +
           lineasInformes
       );
       printAutoCommit(result.autoCommit);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index fb4ea37..4e74b76 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -52,6 +52,7 @@ import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
 import { registrarTransicion } from '../core/transiciones.js';
+import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { resolverConfig } from '../core/config.js';
 import { INFORME_CODEX_RE, INFORME_REVISION_RE, ultimaRondaAprobada } from '../fs/rondas.js';
 import { casillasSinMarcar } from '../core/validacion-tarea.js';
@@ -260,6 +261,10 @@ export interface FinishCommandDeps {
   ahora?: string;
   /** Solo para tests: timeout de la puerta de verificacion (TASK-072), en ms. */
   verificacionTimeoutMs?: number;
+  /** TASK-085: entorno del volcado de coste automatico (tests); por defecto el del proceso. */
+  env?: NodeJS.ProcessEnv;
+  /** TASK-085: directorio de configuracion de Claude Code (tests); por defecto CLAUDE_CONFIG_DIR o ~/.claude. */
+  configDir?: string;
 }
 
 export interface FinishCommandResult {
@@ -633,8 +638,21 @@ export async function runFinishCommand(
   assertTransitionAllowed('finish', existing ? existing.task : null, ctx);
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
 
-  const updated: Task = { ...task, estado: 'terminada', actualizado: today };
-  const conRegistro = registrarTransicion(body, 'finish', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
+  // TASK-085: red del volcado de review. Si alli no se pudo, lo que quede
+  // anotado para la tarea se suma aqui; si ya se sumo, no hay nada nuevo.
+  const volcado = await volcarCosteAutomatico(
+    { ...task, estado: 'terminada', actualizado: today },
+    body,
+    instanteDelVolcado(deps.ahora),
+    {
+      raiz: deps.repoCwd,
+      ...(deps.env === undefined ? {} : { env: deps.env }),
+      ...(deps.configDir === undefined ? {} : { configDir: deps.configDir }),
+    }
+  );
+  for (const aviso of volcado.avisos) deps.onAviso?.(`${id}: ${aviso}`);
+  const updated: Task = volcado.task;
+  const conRegistro = registrarTransicion(volcado.body, 'finish', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
   // Renderizado de cierre (criterio 3): plantillas desde el
@@ -680,6 +698,7 @@ export async function runFinishCommand(
     mensaje: mensajeChore(task.id, 'tarea terminada y artefactos de cierre'),
     push,
   });
+  if (commitResult.commiteado) volcado.olvidar();
 
   // El tag se sube DESPUES del commit y del push de la rama: asi la rama
   // destino ya esta en origin cuando se comprueba (subirTag lo verifica).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 9ea55b6..9278cd6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -33,6 +33,7 @@ import { STATE_FOLDER, type Task } from '../core/task.js';
 import { raizDelRepo, resolverConfig } from '../core/config.js';
 import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertura.js';
 import { registrarTransicion } from '../core/transiciones.js';
+import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
 import {
@@ -109,6 +110,10 @@ export interface ReviewCommandDeps {
   scriptsDir: string;
   /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
   ahora?: string;
+  /** TASK-085: entorno del volcado de coste automatico (tests); por defecto el del proceso. */
+  env?: NodeJS.ProcessEnv;
+  /** TASK-085: directorio de configuracion de Claude Code (tests); por defecto CLAUDE_CONFIG_DIR o ~/.claude. */
+  configDir?: string;
 }
 
 /**
@@ -132,6 +137,8 @@ export interface ReviewCommandResult {
   desde: string;
   /** Avisos no fatales (p. ej. el commit de la ronda anterior ya no es antepasado). */
   avisos: string[];
+  /** TASK-085: lo que el volcado automatico sumo a `tokens_implementacion` (0 filas = nada). */
+  costeImplementacion: { sumado: number; filas: number };
   id: string;
   rama: string;
   baseBranch: string;
@@ -800,8 +807,16 @@ export async function runReviewCommand(
     );
   }
 
-  const conRegistro = registrarTransicion(body, 'review', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
-  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
+  // TASK-085: el coste de implementacion que el hook fue anotando se suma
+  // aqui, en el mismo fichero y commit que la transicion. Nunca aborta.
+  const volcado = await volcarCosteAutomatico(updated, body, instanteDelVolcado(deps.ahora), {
+    raiz: deps.repoCwd,
+    ...(deps.env === undefined ? {} : { env: deps.env }),
+    ...(deps.configDir === undefined ? {} : { configDir: deps.configDir }),
+  });
+  avisos.push(...volcado.avisos);
+  const conRegistro = registrarTransicion(volcado.body, 'review', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
+  const newFilePath = await moveTareaFile(tareasRoot, filePath, volcado.task, conRegistro);
   const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
   const informes: RevisionGrupo[] = escrituras.map((escritura) => ({
     revisor: escritura.revisor,
@@ -822,12 +837,14 @@ export async function runReviewCommand(
     mensaje: mensajeChore(task.id, `peticion de revision ronda ${ronda}`),
     push,
   });
+  if (commitResult.commiteado) volcado.olvidar();
 
   return {
     autoCommit: commitResult,
     incremental,
     desde,
     avisos,
+    costeImplementacion: { sumado: volcado.sumado, filas: volcado.filas },
     id: task.id,
     rama,
     baseBranch,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-automatico.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-automatico.ts
new file mode 100644
index 0000000..7e6f9d7
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-automatico.ts
@@ -0,0 +1,162 @@
+/**
+ * Coste de implementacion registrado sin que nadie lo pida (TASK-085). Pura:
+ * recibe texto y numeros; leer las transcripciones y el libro de pendientes
+ * es de `fs/coste-automatico.ts`.
+ *
+ * QUE CUENTA COMO IMPLEMENTACION (decision de Carlos en el plan): lo que
+ * gasta el hilo principal de la sesion y sus subagentes MIENTRAS la tarea
+ * esta en curso, y nada mas. Una sesion suele llevar el diseno de la misma
+ * tarea, otras tareas del sprint y la orquestacion de la revision; sumar la
+ * transcripcion entera cambiaria una infravaloracion por una sobrevaloracion
+ * que nadie ve. Por eso:
+ *  - Ventanas: de cada fila `start` de `## Transiciones` a la siguiente
+ *    `review` (o a `hasta`, el instante del volcado). Una fila con solo el
+ *    dia (anterior a TASK-052) no abre ventana: no se sabe a que hora.
+ *  - Cada linea de asistente cuenta si su `timestamp` cae en una ventana, su
+ *    `gitBranch` (si lo trae) es la rama de la tarea y su `cwd` (si lo trae)
+ *    esta dentro del repo. Lo de la rama separa las tareas consecutivas de
+ *    una misma sesion; lo del `cwd`, otro clon o un repo de pruebas.
+ *
+ * SIN DUPLICAR: antes de sumar una fuente se mira lo ya anotado para su id
+ * en `## Coste`.
+ *  - En otra fase: no se toca (un agente de revision no es implementacion).
+ *  - En implementacion, en filas propias con desglose: se suma solo lo que ha
+ *    crecido, con el prefijo `dif:` (la semantica de TASK-065).
+ *  - En implementacion junto a otros ids o sin desglose (un registro a mano
+ *    de varios agentes): no se sabe cuanto es suyo; se deja como esta.
+ */
+import path from 'node:path';
+import type { UsoTranscripcion } from './coste-transcripcion.js';
+import { idsDeFuente, leerCostes, PREFIJO_DIFERENCIA, type FilaCoste } from './coste-registro.js';
+import { instanteDe, leerTransiciones, precisionDeFecha } from './transiciones.js';
+
+/** Intervalo semiabierto [desde, hasta) en milisegundos UTC. */
+export interface Ventana {
+  desde: number;
+  hasta: number;
+}
+
+/** Ventanas en las que la tarea estuvo en curso, segun su registro de transiciones. */
+export function ventanasEnCurso(body: string, hastaMs: number): Ventana[] {
+  const ventanas: Ventana[] = [];
+  let abierta: number | null = null;
+  for (const fila of leerTransiciones(body)) {
+    if (precisionDeFecha(fila.fecha) !== 'segundo') continue;
+    const t = instanteDe(fila.fecha);
+    if (fila.fase === 'start') {
+      if (abierta === null) abierta = t;
+    } else if (fila.fase === 'review' && abierta !== null) {
+      if (t > abierta) ventanas.push({ desde: abierta, hasta: t });
+      abierta = null;
+    }
+  }
+  if (abierta !== null && hastaMs > abierta) ventanas.push({ desde: abierta, hasta: hastaMs });
+  return ventanas;
+}
+
+/** true si `hijo` es `padre` o esta dentro (sin distinguir mayusculas en Windows, como path.relative). */
+function dentroDe(padre: string, hijo: string): boolean {
+  const rel = path.relative(path.resolve(padre), path.resolve(hijo));
+  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
+}
+
+/** El filtro de lineas de `sumarUsoTranscripcion` para una tarea (ver la cabecera). */
+export function filtroDeTarea(
+  ventanas: readonly Ventana[],
+  rama: string,
+  raiz: string,
+  /** Canoniza una ruta antes de comparar (en Windows, `NULLCA~1` frente al nombre largo). */
+  normalizar: (ruta: string) => string = (ruta) => ruta
+): (linea: Readonly<Record<string, unknown>>) => boolean {
+  const raizNormal = normalizar(raiz);
+  return (linea) => {
+    const ts = linea['timestamp'];
+    if (typeof ts !== 'string') return false;
+    const t = Date.parse(ts);
+    if (Number.isNaN(t) || !ventanas.some((v) => t >= v.desde && t < v.hasta)) return false;
+    const rama_ = linea['gitBranch'];
+    if (typeof rama_ === 'string' && rama_ !== '' && rama_ !== rama) return false;
+    const cwd = linea['cwd'];
+    if (typeof cwd === 'string' && cwd !== '' && !dentroDe(raizNormal, normalizar(cwd))) return false;
+    return true;
+  };
+}
+
+export type TipoFuente = 'agente' | 'sesion';
+
+/** Lo medido de una transcripcion dentro de las ventanas. */
+export interface FuenteMedida {
+  tipo: TipoFuente;
+  id: string;
+  uso: UsoTranscripcion;
+}
+
+export interface Volcado {
+  /** Filas nuevas de `## Coste`, todas de fase implementacion. */
+  filas: FilaCoste[];
+  /** Suma de sus `total`: lo que se anade a `tokens_implementacion`. */
+  total: number;
+  /** Fuentes que no se suman por lo ya anotado (`tipo:id` y por que). */
+  omitidas: string[];
+}
+
+const CAMPOS = ['tokens', 'entrada', 'cacheEscritura', 'cacheLectura', 'salida', 'lecturas'] as const;
+type Campos = Record<(typeof CAMPOS)[number], number>;
+
+/** Filas a anadir para las fuentes medidas, descontando lo ya anotado (ver la cabecera). */
+export function filasDeVolcado(body: string, medidas: readonly FuenteMedida[], fecha: string): Volcado {
+  const previas = leerCostes(body);
+  const filas: FilaCoste[] = [];
+  const omitidas: string[] = [];
+  let total = 0;
+  for (const m of medidas) {
+    const prefijo = `${m.tipo}:`;
+    const suyas = previas.filter((f) => f.fuente.startsWith(prefijo) && idsDeFuente(f.fuente).some((x) => x.id === m.id));
+    const otraFase = suyas.find((f) => f.fase !== 'implementacion');
+    if (otraFase !== undefined) {
+      omitidas.push(`${prefijo}${m.id} (ya anotado en ${otraFase.fase})`);
+      continue;
+    }
+    const sinReparto = suyas.some(
+      (f) =>
+        idsDeFuente(f.fuente).length > 1 ||
+        f.entrada === null ||
+        f.cacheEscritura === null ||
+        f.cacheLectura === null ||
+        f.salida === null
+    );
+    if (sinReparto) {
+      omitidas.push(`${prefijo}${m.id} (ya anotado junto a otros o sin desglose)`);
+      continue;
+    }
+    const anotado: Campos = { tokens: 0, entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0, lecturas: 0 };
+    for (const f of suyas) {
+      anotado.tokens += f.total;
+      anotado.entrada += f.entrada as number;
+      anotado.cacheEscritura += f.cacheEscritura as number;
+      anotado.cacheLectura += f.cacheLectura as number;
+      anotado.salida += f.salida as number;
+      anotado.lecturas += f.lecturas ?? 0;
+    }
+    const delta = {} as Campos;
+    for (const k of CAMPOS) delta[k] = m.uso[k] - anotado[k];
+    // Nada nuevo, o una transcripcion que encoge (otra o recortada): no se toca.
+    if (delta.tokens <= 0 || CAMPOS.some((k) => delta[k] < 0)) continue;
+    const fila: FilaCoste = {
+      fecha,
+      fase: 'implementacion',
+      fuente: `${prefijo}${suyas.length > 0 ? PREFIJO_DIFERENCIA : ''}${m.id}`,
+      entrada: delta.entrada,
+      cacheEscritura: delta.cacheEscritura,
+      cacheLectura: delta.cacheLectura,
+      salida: delta.salida,
+      lecturas: delta.lecturas,
+      total: delta.tokens,
+      ronda: null,
+      revisor: null,
+    };
+    filas.push(fila);
+    total += fila.total;
+  }
+  return { filas, total, omitidas };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
index cb34a86..6cc3587 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-registro.ts
@@ -20,8 +20,10 @@
  * sus filas).
  *
  * Columnas:
- *  - `fuente`: `agente:<id>[,<id>...]` (lo leido de las transcripciones) o
- *    `manual` (`--tokens N`, una cifra sin desglose).
+ *  - `fuente`: `agente:<id>[,<id>...]` (lo leido de las transcripciones),
+ *    `manual` (`--tokens N`, una cifra sin desglose) o, desde TASK-085,
+ *    `sesion:<id>` (el hilo principal de una sesion, del registro automatico
+ *    de `core/coste-automatico.ts`). `dif:` delante de un id = diferencia.
  *  - `entrada` .. `salida`: los cuatro campos del `usage`; `lecturas`, los
  *    `tool_use` de lectura (`core/coste-transcripcion.ts`). `-` = sin dato,
  *    que no es 0: una fila `manual` solo tiene `total`.
@@ -57,7 +59,7 @@ export interface FilaCoste {
   /** `YYYY-MM-DDTHH:MM:SSZ` (o `YYYY-MM-DD`, que tambien se lee). */
   fecha: string;
   fase: FaseCoste;
-  /** `agente:<id>[,<id>...]` o `manual`. */
+  /** `agente:<id>[,<id>...]`, `sesion:<id>` (TASK-085) o `manual`. */
   fuente: string;
   entrada: number | null;
   cacheEscritura: number | null;
@@ -301,11 +303,19 @@ export interface IdDeFuente {
   diferencia: boolean;
 }
 
-/** Ids de una fuente `agente:a,dif:b`; cualquier otra fuente cuenta entera. */
+/**
+ * Fuentes con ids: `agente:` (subagentes) y, desde TASK-085, `sesion:` (el
+ * hilo principal de una sesion, que vuelca el registro automatico). Las dos
+ * admiten varios ids y el prefijo de diferencia.
+ */
+export const PREFIJOS_CON_ID = ['agente:', 'sesion:'] as const;
+
+/** Ids de una fuente `agente:a,dif:b` o `sesion:<id>`; cualquier otra fuente cuenta entera. */
 export function idsDeFuente(fuente: string): IdDeFuente[] {
-  if (!fuente.startsWith('agente:')) return [{ id: fuente, diferencia: false }];
+  const prefijo = PREFIJOS_CON_ID.find((p) => fuente.startsWith(p));
+  if (prefijo === undefined) return [{ id: fuente, diferencia: false }];
   return fuente
-    .slice('agente:'.length)
+    .slice(prefijo.length)
     .split(',')
     .map((s) => s.trim())
     .filter((s) => s !== '')
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
index 7a0e09b..09a523c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/coste-transcripcion.ts
@@ -130,8 +130,17 @@ function esLectura(bloque: Record<string, unknown>): boolean {
   return esObjeto(input) && typeof input['command'] === 'string' && esComandoBashDeLectura(input['command']);
 }
 
-/** null si la transcripcion no tiene ninguna linea de asistente con usage (formato desconocido). */
-export function sumarUsoTranscripcion(texto: string): UsoTranscripcion | null {
+/**
+ * null si la transcripcion no tiene ninguna linea de asistente con usage (formato desconocido).
+ *
+ * TASK-085: `incluir`, si se da, decide con la linea entera (su `timestamp`,
+ * `gitBranch`, `cwd`) si una linea de asistente cuenta; las que no, se
+ * ignoran como si no estuvieran. Sin lineas que cuenten, tambien null.
+ */
+export function sumarUsoTranscripcion(
+  texto: string,
+  incluir?: (linea: Readonly<Record<string, unknown>>) => boolean
+): UsoTranscripcion | null {
   const porId = new Map<string, Desglose>();
   const sinId: Desglose[] = [];
   const lecturasPorId = new Set<string>();
@@ -145,6 +154,7 @@ export function sumarUsoTranscripcion(texto: string): UsoTranscripcion | null {
       continue;
     }
     if (!esObjeto(obj) || obj['type'] !== 'assistant') continue;
+    if (incluir !== undefined && !incluir(obj)) continue;
     const mensaje = obj['message'];
     if (!esObjeto(mensaje)) continue;
     const contenido = mensaje['content'];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-automatico.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-automatico.ts
new file mode 100644
index 0000000..9f171c2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-automatico.ts
@@ -0,0 +1,189 @@
+/**
+ * Volcado del coste de implementacion registrado automaticamente (TASK-085).
+ * Lo llaman `review` (al pasar a en-revision) y `finish` (red, por si el de
+ * review no pudo): devuelve la tarea y el cuerpo con `tokens_implementacion`
+ * y las filas de `## Coste` ya sumadas, para que viajen en SU commit. Que
+ * cuenta y como no se duplica, en `core/coste-automatico.ts`.
+ *
+ * De donde salen las transcripciones:
+ *  - El libro de pendientes (`fs/coste-pendiente.ts`), que llena el hook de
+ *    fin de turno y de fin de subagente.
+ *  - La sesion que esta ejecutando el comando, si el entorno la nombra
+ *    (`CLAUDE_CODE_SESSION_ID`): cuando todo el ciclo cabe en un turno, el
+ *    hook de fin de turno aun no ha corrido al llegar a `review`.
+ *  - Los subagentes de cada sesion (`<sesion>/subagents/agent-*.jsonl`): las
+ *    ventanas descartan los que no trabajaron con la tarea en curso.
+ *
+ * NUNCA rompe el comando que lo llama: cualquier fallo deja la tarea como
+ * estaba y un aviso. El coste es una metrica; la transicion, no.
+ */
+import { realpathSync } from 'node:fs';
+import { readdir, readFile } from 'node:fs/promises';
+import path from 'node:path';
+import type { Task } from '../core/task.js';
+import { anadirCoste } from '../core/coste-registro.js';
+import { esAgentIdValido, sumarUsoTranscripcion } from '../core/coste-transcripcion.js';
+import {
+  filasDeVolcado,
+  filtroDeTarea,
+  ventanasEnCurso,
+  type FuenteMedida,
+  type TipoFuente,
+} from '../core/coste-automatico.js';
+import { formatearInstante, instanteDe, precisionDeFecha } from '../core/transiciones.js';
+import { directorioConfigClaude } from './config-claude.js';
+import { leerPendientes, olvidarPendientes, rutaLibro } from './coste-pendiente.js';
+
+/** `COSTE_AUTOMATICO=0` apaga el hook y el volcado. */
+export const INTERRUPTOR_COSTE = 'COSTE_AUTOMATICO';
+/** Variable con la que Claude Code nombra la sesion a sus procesos hijos (no siempre esta). */
+export const VARIABLE_SESION = 'CLAUDE_CODE_SESSION_ID';
+
+const SESION_ID_RE = /^[0-9A-Za-z_-]{1,128}$/;
+
+export function esSesionIdValido(id: string): boolean {
+  return SESION_ID_RE.test(id);
+}
+
+/** Hasta cuando cuenta el volcado: el instante de la transicion (`deps.ahora`) o, sin el, ahora. */
+export function instanteDelVolcado(ahora: string | undefined): number {
+  return ahora !== undefined && precisionDeFecha(ahora) === 'segundo' ? instanteDe(ahora) : Date.now();
+}
+
+export interface DepsVolcado {
+  raiz: string;
+  env?: NodeJS.ProcessEnv;
+  /** Directorio de configuracion de Claude Code; por defecto CLAUDE_CONFIG_DIR o ~/.claude. */
+  configDir?: string;
+}
+
+export interface ResultadoVolcado {
+  task: Task;
+  body: string;
+  /** Lo sumado a `tokens_implementacion` (0 si nada). */
+  sumado: number;
+  filas: number;
+  avisos: string[];
+  /** Llamar DESPUES de commitear con exito: vacia el libro de esa tarea. */
+  olvidar: () => void;
+}
+
+async function nombres(dir: string): Promise<string[]> {
+  try {
+    return await readdir(dir);
+  } catch {
+    return [];
+  }
+}
+
+/** La transcripcion de una sesion por su id: `<config>/projects/*\/<id>.jsonl`. */
+async function transcripcionDeSesion(configDir: string, id: string): Promise<string | null> {
+  const proyectos = path.join(configDir, 'projects');
+  for (const p of (await nombres(proyectos)).sort()) {
+    if ((await nombres(path.join(proyectos, p))).includes(`${id}.jsonl`)) return path.join(proyectos, p, `${id}.jsonl`);
+  }
+  return null;
+}
+
+/** Subagentes de una sesion, junto a su transcripcion: `<dir>/<id>/subagents/agent-<agente>.jsonl`. */
+async function subagentesDeSesion(rutaSesion: string): Promise<{ id: string; ruta: string }[]> {
+  const dir = path.join(path.dirname(rutaSesion), path.basename(rutaSesion, '.jsonl'), 'subagents');
+  return (await nombres(dir)).flatMap((n) => {
+    const m = /^agent-(.+)\.jsonl$/.exec(n);
+    return m !== null && esAgentIdValido(m[1] as string) ? [{ id: m[1] as string, ruta: path.join(dir, n) }] : [];
+  });
+}
+
+/** realpath con cache (una transcripcion repite el mismo cwd en cada linea); si no existe, la ruta tal cual. */
+function normalizadorDeRutas(): (ruta: string) => string {
+  const cache = new Map<string, string>();
+  return (ruta) => {
+    let r = cache.get(ruta);
+    if (r === undefined) {
+      try {
+        r = realpathSync.native(ruta);
+      } catch {
+        r = path.resolve(ruta);
+      }
+      cache.set(ruta, r);
+    }
+    return r;
+  };
+}
+
+export async function volcarCosteAutomatico(
+  task: Task,
+  body: string,
+  hastaMs: number,
+  deps: DepsVolcado
+): Promise<ResultadoVolcado> {
+  const sinCambios = (avisos: string[] = []): ResultadoVolcado => ({
+    task,
+    body,
+    sumado: 0,
+    filas: 0,
+    avisos,
+    olvidar: () => undefined,
+  });
+  const env = deps.env ?? process.env;
+  if (env[INTERRUPTOR_COSTE] === '0') return sinCambios();
+  try {
+    const ventanas = ventanasEnCurso(body, hastaMs);
+    const libro = rutaLibro(deps.raiz);
+    const olvidar = (): void => {
+      if (libro !== null) olvidarPendientes(libro, task.id);
+    };
+    if (ventanas.length === 0 || typeof task.rama !== 'string' || task.rama === '') {
+      return { ...sinCambios(), olvidar };
+    }
+
+    const fuentes = new Map<string, { tipo: TipoFuente; id: string; ruta: string }>();
+    const anadir = (tipo: TipoFuente, id: string, ruta: string): void => {
+      if (!fuentes.has(`${tipo}:${id}`)) fuentes.set(`${tipo}:${id}`, { tipo, id, ruta });
+    };
+    for (const e of libro === null ? [] : leerPendientes(libro, task.id)) {
+      if (e.tipo === 'agente' ? esAgentIdValido(e.id) : esSesionIdValido(e.id)) anadir(e.tipo, e.id, e.ruta);
+    }
+    const actual = env[VARIABLE_SESION];
+    if (typeof actual === 'string' && esSesionIdValido(actual) && !fuentes.has(`sesion:${actual}`)) {
+      const ruta = await transcripcionDeSesion(deps.configDir ?? directorioConfigClaude(env), actual);
+      if (ruta !== null) anadir('sesion', actual, ruta);
+    }
+    for (const f of [...fuentes.values()]) {
+      if (f.tipo !== 'sesion') continue;
+      for (const s of await subagentesDeSesion(f.ruta)) anadir('agente', s.id, s.ruta);
+    }
+
+    const filtro = filtroDeTarea(ventanas, task.rama, deps.raiz, normalizadorDeRutas());
+    const medidas: FuenteMedida[] = [];
+    for (const f of fuentes.values()) {
+      let texto: string;
+      try {
+        texto = await readFile(f.ruta, 'utf8');
+      } catch {
+        continue; // borrada o movida: no hay nada que medir
+      }
+      const uso = sumarUsoTranscripcion(texto, filtro);
+      if (uso !== null && uso.tokens > 0) medidas.push({ tipo: f.tipo, id: f.id, uso });
+    }
+    medidas.sort((a, b) => (a.tipo === b.tipo ? a.id.localeCompare(b.id) : a.tipo === 'sesion' ? -1 : 1));
+
+    const v = filasDeVolcado(body, medidas, formatearInstante(new Date(hastaMs)));
+    if (v.filas.length === 0) return { ...sinCambios(), olvidar };
+    const total = (task.tokens_implementacion ?? 0) + v.total;
+    if (!Number.isSafeInteger(total)) {
+      return sinCambios(['No se ha registrado el coste de implementacion: el total dejaria de ser un entero seguro.']);
+    }
+    return {
+      task: { ...task, tokens_implementacion: total },
+      body: v.filas.reduce((acc, f) => anadirCoste(acc, f), body),
+      sumado: v.total,
+      filas: v.filas.length,
+      avisos: [],
+      olvidar,
+    };
+  } catch (e: unknown) {
+    const msg = e instanceof Error ? e.message : String(e);
+    return sinCambios([`No se ha podido registrar el coste de implementacion automaticamente: ${msg}`]);
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts
new file mode 100644
index 0000000..db344a6
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/coste-pendiente.ts
@@ -0,0 +1,116 @@
+/**
+ * Libro de coste pendiente (TASK-085): que transcripciones han trabajado en
+ * la rama de una tarea en curso, para que `review` (y, como red, `finish`)
+ * sumen su coste de implementacion en el commit que ya hacen.
+ *
+ * Vive bajo `.git/` (`git rev-parse --git-path`), como el memo del freno de
+ * verificacion (`fs/verificacion.ts`): en el workspace ensuciaria el arbol,
+ * cambiaria la huella del freno y bloquearia el siguiente comando por
+ * workspace sucio. Se pierde con el clon: aceptado en el plan.
+ *
+ * Solo guarda RUTAS, no cifras: lo que cuenta lo decide el volcado con las
+ * ventanas de la tarea (`core/coste-automatico.ts`). Asi el hook que escribe
+ * aqui no lee ninguna transcripcion y un disparo repetido no suma nada.
+ *
+ * Formato: una linea JSON por anotacion, solo se AÑADE. Varios hooks a la
+ * vez (dos `SubagentStop`, el `Stop` del hilo principal) escriben cada uno
+ * su linea con `appendFile`, sin leer ni reescribir: no hay actualizacion
+ * perdida que evitar. Las repetidas se funden al leer. `olvidarPendientes`
+ * es lo unico que reescribe (temporal + rename) y corre dentro de un
+ * comando, no de un hook.
+ */
+import { appendFileSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import type { TipoFuente } from '../core/coste-automatico.js';
+
+export const FICHERO_LIBRO = 'coste-pendiente.jsonl';
+const VERSION_LIBRO = 1;
+
+export interface EntradaPendiente {
+  tarea: string;
+  tipo: TipoFuente;
+  /** session_id (sesion) o agent_id (agente). */
+  id: string;
+  /** Transcripcion: la de la sesion o la del subagente. */
+  ruta: string;
+}
+
+/** Ruta absoluta del libro, o null fuera de un repo Git. */
+export function rutaLibro(raiz: string): string | null {
+  const r = spawnSync('git', ['rev-parse', '--git-path', FICHERO_LIBRO], { cwd: raiz, encoding: 'utf8', windowsHide: true });
+  if (r.error !== undefined || r.status !== 0) return null;
+  const p = (r.stdout ?? '').trim();
+  return p === '' ? null : path.resolve(raiz, p);
+}
+
+/** Añade las entradas al libro. Lanza si no puede escribir: quien llama decide si eso importa. */
+export function anotarPendientes(ruta: string, entradas: readonly EntradaPendiente[]): void {
+  if (entradas.length === 0) return;
+  mkdirSync(path.dirname(ruta), { recursive: true });
+  const texto = entradas.map((e) => JSON.stringify({ v: VERSION_LIBRO, ...e })).join('\n') + '\n';
+  appendFileSync(ruta, texto, 'utf8');
+}
+
+function esEntrada(v: unknown): v is EntradaPendiente & { v: number } {
+  if (typeof v !== 'object' || v === null) return false;
+  const o = v as Record<string, unknown>;
+  return (
+    o['v'] === VERSION_LIBRO &&
+    typeof o['tarea'] === 'string' &&
+    (o['tipo'] === 'agente' || o['tipo'] === 'sesion') &&
+    typeof o['id'] === 'string' &&
+    o['id'] !== '' &&
+    typeof o['ruta'] === 'string' &&
+    o['ruta'] !== ''
+  );
+}
+
+function lineas(ruta: string): string[] {
+  try {
+    return readFileSync(ruta, 'utf8').split(/\r?\n/);
+  } catch {
+    return [];
+  }
+}
+
+function parsear(linea: string): unknown {
+  try {
+    return JSON.parse(linea);
+  } catch {
+    return null;
+  }
+}
+
+/** Las entradas de una tarea, una por (tipo, id): la ultima ruta gana. Un libro ilegible es un libro vacio. */
+export function leerPendientes(ruta: string, tarea: string): EntradaPendiente[] {
+  const porClave = new Map<string, EntradaPendiente>();
+  for (const l of lineas(ruta)) {
+    if (l.trim() === '') continue;
+    const v = parsear(l);
+    if (!esEntrada(v) || v.tarea !== tarea) continue;
+    porClave.set(`${v.tipo}:${v.id}`, { tarea: v.tarea, tipo: v.tipo, id: v.id, ruta: v.ruta });
+  }
+  return [...porClave.values()];
+}
+
+/** Quita del libro las entradas de una tarea (las demas se quedan). Nunca lanza. */
+export function olvidarPendientes(ruta: string, tarea: string): void {
+  try {
+    // Se quedan solo las entradas validas de OTRAS tareas: las lineas rotas
+    // (un corte a mitad de escritura) se van con la limpieza.
+    const restantes = lineas(ruta).filter((l) => {
+      const v = parsear(l);
+      return esEntrada(v) && v.tarea !== tarea;
+    });
+    if (restantes.length === 0) {
+      unlinkSync(ruta);
+      return;
+    }
+    const temporal = `${ruta}.${String(process.pid)}.tmp`;
+    writeFileSync(temporal, restantes.join('\n') + '\n', 'utf8');
+    renameSync(temporal, ruta);
+  } catch {
+    /* un libro que no se pudo limpiar solo vuelve a medir: lo ya anotado no se suma dos veces */
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/coste-turno.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/coste-turno.ts
new file mode 100644
index 0000000..277d694
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/coste-turno.ts
@@ -0,0 +1,23 @@
+/**
+ * Punto de entrada de los hooks `Stop` y `SubagentStop` del registro de
+ * coste (hooks/hooks.json). Lee stdin, anota (registro-coste.ts) y sale
+ * siempre con 0, sin escribir nada: nunca bloquea al agente.
+ */
+import { readFileSync } from 'node:fs';
+import { parsearEntradaCoste, registrarTurno } from './registro-coste.js';
+
+let texto = '';
+try {
+  texto = readFileSync(0, 'utf8');
+} catch {
+  texto = '';
+}
+
+registrarTurno(parsearEntradaCoste(texto)).then(
+  () => {
+    process.exitCode = 0;
+  },
+  () => {
+    process.exitCode = 0;
+  }
+);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index 751e016..a5d2816 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -76,7 +76,7 @@ export function timeoutEfectivoS(timeoutVerificacion: number): { timeoutS: numbe
 }
 
 /** El directorio de tareas en curso, si existe. Sin procesos. */
-function carpetaEnCurso(raiz: string): string | null {
+export function carpetaEnCurso(raiz: string): string | null {
   const dir = path.join(raiz, 'tareas', '02-en-curso');
   try {
     return statSync(dir).isDirectory() ? dir : null;
@@ -85,7 +85,7 @@ function carpetaEnCurso(raiz: string): string | null {
   }
 }
 
-function ramaActual(raiz: string): string | null {
+export function ramaActual(raiz: string): string | null {
   const r = spawnSync('git', ['branch', '--show-current'], { cwd: raiz, encoding: 'utf8', windowsHide: true });
   if (r.error !== undefined || r.status !== 0) return null;
   const rama = (r.stdout ?? '').trim();
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts
new file mode 100644
index 0000000..b6ea916
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/registro-coste.ts
@@ -0,0 +1,110 @@
+/**
+ * Registro automatico del coste de implementacion (TASK-085). Lo ejecutan los
+ * hooks `Stop` (fin de turno del hilo principal) y `SubagentStop` (fin de un
+ * subagente) en TODAS las sesiones de TODOS los proyectos con el plugin, asi
+ * que las guardas van de la mas barata a la mas cara, como en el freno de
+ * verificacion, y ningun proceso hasta saber que hay una tarea en curso:
+ *
+ *   1. `COSTE_AUTOMATICO=0`: interruptor.
+ *   2. Sin `cwd` valido en la entrada.
+ *   3. `tareas/02-en-curso/` no existe (solo `stat`).
+ *   4. Ninguna tarea en curso con rama (lectura de esa carpeta).
+ *   5. La rama actual (el primer `git`) no es la de ninguna de ellas.
+ *
+ * Solo entonces anota en el libro de pendientes (`fs/coste-pendiente.ts`)
+ * QUE transcripcion trabajo en la tarea: la de la sesion y, en
+ * `SubagentStop`, la del subagente. No lee transcripciones ni escribe
+ * `tarea.md`: la cifra la calcula `review` al volcar, en su commit. Asi el
+ * hook no cambia la huella del freno de verificacion ni ensucia el arbol.
+ *
+ * Nunca bloquea: sale siempre con 0 y sin decir nada (un 2 en `Stop`
+ * detendria al agente). Nada de lo que escribe nombra el producto.
+ */
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { raizDelRepo } from '../core/config.js';
+import { esAgentIdValido } from '../core/coste-transcripcion.js';
+import { listTareasEnEstados } from '../fs/task-store.js';
+import { anotarPendientes, rutaLibro, type EntradaPendiente } from '../fs/coste-pendiente.js';
+import { esSesionIdValido, INTERRUPTOR_COSTE } from '../fs/coste-automatico.js';
+import { carpetaEnCurso, ramaActual } from './freno-stop.js';
+
+export interface EntradaCoste {
+  cwd?: unknown;
+  hook_event_name?: unknown;
+  session_id?: unknown;
+  transcript_path?: unknown;
+  agent_id?: unknown;
+  agent_transcript_path?: unknown;
+}
+
+export interface DepsRegistroCoste {
+  env?: NodeJS.ProcessEnv;
+  /** Solo para tests: sustituye a la consulta de la rama (el primer proceso del hook). */
+  ramaActual?: (raiz: string) => string | null;
+}
+
+function texto(v: unknown): string | null {
+  return typeof v === 'string' && v !== '' ? v : null;
+}
+
+/**
+ * Lo que hay que anotar para una entrada, sin mirar el disco. La ruta del
+ * subagente, si la entrada no la trae, es la que Claude Code usa junto a la
+ * de la sesion: `<dir>/<session_id>/subagents/agent-<agent_id>.jsonl`.
+ */
+export function entradasDeHook(entrada: EntradaCoste, tarea: string): EntradaPendiente[] {
+  const sesion = texto(entrada.session_id);
+  const rutaSesion = texto(entrada.transcript_path);
+  const salida: EntradaPendiente[] = [];
+  if (sesion !== null && rutaSesion !== null && esSesionIdValido(sesion) && path.isAbsolute(rutaSesion)) {
+    salida.push({ tarea, tipo: 'sesion', id: sesion, ruta: rutaSesion });
+  }
+  const agente = texto(entrada.agent_id);
+  if (agente !== null && esAgentIdValido(agente)) {
+    const declarada = texto(entrada.agent_transcript_path);
+    const ruta =
+      declarada !== null && path.isAbsolute(declarada)
+        ? declarada
+        : sesion !== null && rutaSesion !== null && esSesionIdValido(sesion)
+          ? path.join(path.dirname(rutaSesion), sesion, 'subagents', `agent-${agente}.jsonl`)
+          : null;
+    if (ruta !== null) salida.push({ tarea, tipo: 'agente', id: agente, ruta });
+  }
+  return salida;
+}
+
+/** Anota lo que toque y devuelve cuantas entradas escribio. Nunca lanza. */
+export async function registrarTurno(entrada: EntradaCoste, deps: DepsRegistroCoste = {}): Promise<number> {
+  try {
+    const env = deps.env ?? process.env;
+    if (env[INTERRUPTOR_COSTE] === '0') return 0;
+    const cwd = texto(entrada.cwd);
+    if (cwd === null || !existsSync(cwd)) return 0;
+    const raiz = raizDelRepo(cwd);
+    if (carpetaEnCurso(raiz) === null) return 0;
+    const { tareas } = await listTareasEnEstados(path.join(raiz, 'tareas'), ['en-curso']);
+    const conRama = tareas.filter((t) => typeof t.task.rama === 'string' && t.task.rama !== '');
+    if (conRama.length === 0) return 0;
+    const rama = (deps.ramaActual ?? ramaActual)(raiz);
+    if (rama === null) return 0;
+    const entradas = conRama.filter((t) => t.task.rama === rama).flatMap((t) => entradasDeHook(entrada, t.task.id));
+    if (entradas.length === 0) return 0;
+    const libro = rutaLibro(raiz);
+    if (libro === null) return 0;
+    anotarPendientes(libro, entradas);
+    return entradas.length;
+  } catch {
+    return 0;
+  }
+}
+
+/** El JSON del hook. Uno roto o vacio es una entrada sin campos. */
+export function parsearEntradaCoste(textoEntrada: string): EntradaCoste {
+  try {
+    const v: unknown = JSON.parse(textoEntrada);
+    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as EntradaCoste) : {};
+  } catch {
+    return {};
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts
new file mode 100644
index 0000000..0c8177f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/coste-automatico.test.ts
@@ -0,0 +1,299 @@
+/**
+ * TASK-085: el coste de implementacion que anota el hook llega a tarea.md en
+ * el commit de `review`, sin duplicar y sin ensuciar el arbol, y `taskctl
+ * metricas` deja de listar la tarea como sin coste de implementacion.
+ * Repos Git temporales reales y transcripciones con la forma de las de
+ * Claude Code (timestamp, gitBranch y cwd por linea) en un directorio de
+ * configuracion temporal. Nada de mocks.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync } from 'node:fs';
+import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
+import { leerCostes } from '../../src/core/coste-registro.js';
+import { leerTransiciones } from '../../src/core/transiciones.js';
+import { registrarTurno } from '../../src/hooks/registro-coste.js';
+import { rutaLibro } from '../../src/fs/coste-pendiente.js';
+import { volcarCosteAutomatico } from '../../src/fs/coste-automatico.js';
+import { SCRIPTS_DIR, commitAll, git, sampleTask, withTempRepo } from '../helpers/review-fixtures.js';
+import {
+  CONFIG_AUTO,
+  ID,
+  TASKCTL,
+  dirRevision,
+  hastaCodigo,
+  rellenarInforme,
+  withRepo,
+} from '../helpers/automatico-fixtures.js';
+
+const SESION = '7d1e2f30-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
+const AGENTE = 'abc1234';
+const AGENTE_FUERA = 'def4567';
+const START = '2026-09-05T10:00:00Z';
+const AHORA = '2026-09-05T12:00:00Z';
+
+function linea(id: string, ts: string, rama: string, cwd: string, u: Record<string, number>): string {
+  return JSON.stringify({
+    type: 'assistant',
+    timestamp: ts,
+    gitBranch: rama,
+    cwd,
+    sessionId: SESION,
+    message: { id, role: 'assistant', content: [{ type: 'text', text: 'x' }], usage: u },
+  });
+}
+
+/** Sesion y subagentes en `<config>/projects/<proyecto>/`. Devuelve la ruta de la sesion. */
+async function transcripciones(config: string, rama: string, cwd: string): Promise<string> {
+  const proyecto = path.join(config, 'projects', 'proyecto-de-prueba');
+  const sesion = path.join(proyecto, `${SESION}.jsonl`);
+  const subagentes = path.join(proyecto, SESION, 'subagents');
+  await mkdir(subagentes, { recursive: true });
+  await writeFile(
+    sesion,
+    [
+      JSON.stringify({ type: 'user', timestamp: '2026-09-05T08:59:00Z', message: { content: 'disena' } }),
+      linea('m0', '2026-09-05T09:00:00.000Z', rama, cwd, { input_tokens: 9000, output_tokens: 1000 }), // diseno: fuera
+      linea('m1', '2026-09-05T10:30:00.000Z', rama, cwd, {
+        input_tokens: 100,
+        cache_creation_input_tokens: 10,
+        cache_read_input_tokens: 1000,
+        output_tokens: 50,
+      }), // 1160
+      linea('m2', '2026-09-05T10:40:00.000Z', 'feature/otra-tarea', cwd, { input_tokens: 7000 }), // otra tarea
+      linea('m3', '2026-09-05T13:00:00.000Z', rama, cwd, { input_tokens: 5000 }), // despues de review
+    ].join('\n') + '\n',
+    'utf8'
+  );
+  await writeFile(
+    path.join(subagentes, `agent-${AGENTE}.jsonl`),
+    linea('a1', '2026-09-05T11:00:00.000Z', rama, cwd, { input_tokens: 20, output_tokens: 5 }) + '\n', // 25
+    'utf8'
+  );
+  await writeFile(
+    path.join(subagentes, `agent-${AGENTE_FUERA}.jsonl`),
+    linea('b1', '2026-09-05T08:00:00.000Z', rama, cwd, { input_tokens: 300 }) + '\n', // brainstorm: fuera
+    'utf8'
+  );
+  return sesion;
+}
+
+const CUERPO = [
+  '## Objetivo',
+  'Probar el coste automatico.',
+  '',
+  '## Transiciones',
+  '',
+  '| fecha | fase | modo | decidido_por |',
+  '|---|---|---|---|',
+  '| 2026-09-05T08:30:00Z | plan | automatico | persona |',
+  '| 2026-09-05T09:30:00Z | approve | automatico | persona |',
+  `| ${START} | start | automatico | persona |`,
+  '',
+].join('\n');
+
+async function tareaEnCurso(repoRoot: string, tareasRoot: string): Promise<ReturnType<typeof sampleTask>> {
+  const task = sampleTask({ id: 'TASK-600' });
+  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+  await writeTareaFile(tareasRoot, task, CUERPO);
+  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo\n', 'utf8');
+  commitAll(repoRoot, `feat(${task.id}): trabajo`);
+  return task;
+}
+
+test('review: suma la sesion y sus subagentes de la ventana en curso, en su commit, y vacia el libro', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
+    try {
+      const task = await tareaEnCurso(repoRoot, tareasRoot);
+      const sesion = await transcripciones(config, task.rama, repoRoot);
+      // Lo que haria el hook al terminar un turno con la tarea en curso.
+      assert.equal(await registrarTurno({ cwd: repoRoot, session_id: SESION, transcript_path: sesion }, { env: {} }), 1);
+      const libro = rutaLibro(repoRoot) as string;
+      assert.equal(existsSync(libro), true);
+
+      const r = await runReviewCommand(tareasRoot, [task.id], '2026-09-05', {
+        repoCwd: repoRoot,
+        scriptsDir: SCRIPTS_DIR,
+        ahora: AHORA,
+        env: {},
+        configDir: config,
+      });
+      assert.deepEqual(r.costeImplementacion, { sumado: 1185, filas: 2 });
+
+      const leida = await readTareaFile(tareasRoot, task.id);
+      assert.ok(leida !== null);
+      assert.equal(leida.task.estado, 'en-revision');
+      assert.equal(leida.task.tokens_implementacion, 1185);
+      assert.deepEqual(
+        leerCostes(leida.body).map((f) => [f.fase, f.fuente, f.total, f.entrada, f.cacheLectura]),
+        [
+          ['implementacion', `sesion:${SESION}`, 1160, 100, 1000],
+          ['implementacion', `agente:${AGENTE}`, 25, 20, 0],
+        ]
+      );
+      // La transicion y el coste viajan en el mismo commit; el arbol queda limpio.
+      assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+      assert.match(git(['show', '--stat', '--format=%s', 'HEAD'], repoRoot), /peticion de revision ronda 1/);
+      assert.match(git(['show', 'HEAD', '--', leida.filePath], repoRoot), /\+\| .* \| implementacion \| sesion:/);
+      assert.equal(existsSync(libro), false, 'tras el commit, el libro de la tarea se vacia');
+
+      // La red de finish (o un segundo volcado) no vuelve a sumar lo mismo.
+      const otra = await volcarCosteAutomatico(leida.task, leida.body, Date.parse('2026-09-06T00:00:00Z'), {
+        raiz: repoRoot,
+        env: { CLAUDE_CODE_SESSION_ID: SESION },
+        configDir: config,
+      });
+      assert.equal(otra.filas, 0);
+      assert.equal(otra.task.tokens_implementacion, 1185);
+    } finally {
+      await rm(config, { recursive: true, force: true });
+    }
+  });
+});
+
+test('review: sin libro, la sesion que lo ejecuta (CLAUDE_CODE_SESSION_ID) basta; COSTE_AUTOMATICO=0 lo apaga', async () => {
+  for (const [env, esperado] of [
+    [{ CLAUDE_CODE_SESSION_ID: SESION }, 1185],
+    [{ CLAUDE_CODE_SESSION_ID: SESION, COSTE_AUTOMATICO: '0' }, null],
+    [{}, null],
+  ] as const) {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
+      try {
+        const task = await tareaEnCurso(repoRoot, tareasRoot);
+        await transcripciones(config, task.rama, repoRoot);
+        await runReviewCommand(tareasRoot, [task.id], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+          ahora: AHORA,
+          env: { ...env },
+          configDir: config,
+        });
+        const leida = await readTareaFile(tareasRoot, task.id);
+        assert.equal(leida?.task.tokens_implementacion, esperado, JSON.stringify(env));
+        assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+      } finally {
+        await rm(config, { recursive: true, force: true });
+      }
+    });
+  }
+});
+
+test('review: lo ya registrado a mano para un agente no se suma dos veces', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
+    try {
+      const task = sampleTask({ id: 'TASK-600', tokens_implementacion: 25 });
+      git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+      const conManual =
+        CUERPO +
+        '\n## Coste\n\n' +
+        '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |\n' +
+        '|---|---|---|---|---|---|---|---|---|---|---|\n' +
+        `| 2026-09-05T11:30:00Z | implementacion | agente:${AGENTE} | 20 | 0 | 0 | 5 | 0 | 25 | - | - |\n`;
+      await writeTareaFile(tareasRoot, task, conManual);
+      commitAll(repoRoot, `feat(${task.id}): trabajo`);
+      await transcripciones(config, task.rama, repoRoot);
+      await runReviewCommand(tareasRoot, [task.id], '2026-09-05', {
+        repoCwd: repoRoot,
+        scriptsDir: SCRIPTS_DIR,
+        ahora: AHORA,
+        env: { CLAUDE_CODE_SESSION_ID: SESION },
+        configDir: config,
+      });
+      const leida = await readTareaFile(tareasRoot, task.id);
+      assert.equal(leida?.task.tokens_implementacion, 25 + 1160);
+      assert.deepEqual(
+        leerCostes(leida?.body ?? '').map((f) => f.fuente),
+        [`agente:${AGENTE}`, `sesion:${SESION}`]
+      );
+    } finally {
+      await rm(config, { recursive: true, force: true });
+    }
+  });
+});
+
+function taskctl(cwd: string, args: string[], env: NodeJS.ProcessEnv): { status: number | null; stdout: string; stderr: string } {
+  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8', env });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+test('ciclo por CLI: hook como proceso, review lo suma y metricas deja de listar la tarea sin coste de implementacion', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    const config = await mkdtemp(path.join(tmpdir(), 'coste-config-'));
+    try {
+      const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_CONFIG_DIR: config };
+      delete env['CLAUDE_CODE_SESSION_ID'];
+      delete env['COSTE_AUTOMATICO'];
+      const ok = (args: string[]): string => {
+        const r = taskctl(repoRoot, args, env);
+        assert.equal(r.status, 0, `taskctl ${args.join(' ')}: ${r.stderr}${r.stdout}`);
+        return r.stdout;
+      };
+
+      await hastaCodigo(repoRoot, tareasRoot);
+      const enCurso = await readTareaFile(tareasRoot, ID);
+      assert.ok(enCurso !== null);
+      const start = leerTransiciones(enCurso.body).find((f) => f.fase === 'start');
+      assert.ok(start !== undefined);
+      // Un turno de implementacion justo en el instante del start, en la rama de la tarea.
+      const ts = new Date(Date.parse(start.fecha)).toISOString();
+      const proyecto = path.join(config, 'projects', 'proyecto');
+      await mkdir(proyecto, { recursive: true });
+      const sesion = path.join(proyecto, `${SESION}.jsonl`);
+      await writeFile(sesion, linea('m1', ts, enCurso.task.rama, repoRoot, { input_tokens: 400, output_tokens: 100 }) + '\n', 'utf8');
+
+      const hook = spawnSync(process.execPath, [path.join(path.dirname(TASKCTL), '..', 'dist', 'src', 'hooks', 'coste-turno.js')], {
+        input: JSON.stringify({ hook_event_name: 'Stop', cwd: repoRoot, session_id: SESION, transcript_path: sesion }),
+        encoding: 'utf8',
+        env,
+      });
+      assert.deepEqual([hook.status, hook.stdout, hook.stderr], [0, '', '']);
+      assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'el hook no ensucia el arbol');
+
+      // La review tiene que caer al menos un segundo despues del start (filas al segundo).
+      const espera = Date.parse(start.fecha) + 1100 - Date.now();
+      if (espera > 0) await new Promise((res) => setTimeout(res, espera));
+      assert.match(ok(['review', ID]), /Coste de implementacion registrado automaticamente: \+500 tokens/);
+
+      await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+      ok(['veredicto', ID, 'aprobada']);
+      ok(['finish', ID]);
+
+      const terminada = await readTareaFile(tareasRoot, ID);
+      assert.equal(terminada?.task.estado, 'terminada');
+      assert.equal(terminada?.task.tokens_implementacion, 500, 'finish no lo vuelve a sumar');
+
+      const json = JSON.parse(ok(['metricas', '--json'])) as {
+        sinCoste: { tareas: { id: string; fases: string[] }[] };
+      };
+      const fila = json.sinCoste.tareas.find((t) => t.id === ID);
+      assert.ok(fila === undefined || !fila.fases.includes('implementacion'), JSON.stringify(json.sinCoste));
+      assert.ok(fila?.fases.includes('revision'), 'la revision sigue sin coste: el control de que la tarea se mira');
+    } finally {
+      await rm(config, { recursive: true, force: true });
+    }
+  });
+});
+
+test('review: un libro corrupto no rompe la transicion', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = await tareaEnCurso(repoRoot, tareasRoot);
+    await writeFile(rutaLibro(repoRoot) as string, 'esto no es json\n{"v":1}\n', 'utf8');
+    const r = await runReviewCommand(tareasRoot, [task.id], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+      ahora: AHORA,
+      env: {},
+    });
+    assert.equal(r.costeImplementacion.filas, 0);
+    assert.equal((await readTareaFile(tareasRoot, task.id))?.task.estado, 'en-revision');
+    assert.equal(await readFile(rutaLibro(repoRoot) as string, 'utf8').then(() => 'existe', () => 'no'), 'no');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts
new file mode 100644
index 0000000..40eeb16
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/coste-automatico.test.ts
@@ -0,0 +1,163 @@
+/**
+ * TASK-085: lo puro del coste de implementacion automatico. Ventanas en curso
+ * sacadas de `## Transiciones`, el filtro de lineas por hora, rama y cwd, y
+ * las filas del volcado sin duplicar lo ya anotado.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import path from 'node:path';
+import { tmpdir } from 'node:os';
+import { filasDeVolcado, filtroDeTarea, ventanasEnCurso, type FuenteMedida } from '../../src/core/coste-automatico.js';
+import { anadirCoste, idsDeFuente, resumirCostes, leerCostes, type FilaCoste } from '../../src/core/coste-registro.js';
+import { sumarUsoTranscripcion, type UsoTranscripcion } from '../../src/core/coste-transcripcion.js';
+
+const ms = (iso: string): number => Date.parse(iso);
+
+function transiciones(...filas: [string, string][]): string {
+  return [
+    '## Objetivo',
+    'x',
+    '',
+    '## Transiciones',
+    '',
+    '| fecha | fase | modo | decidido_por |',
+    '|---|---|---|---|',
+    ...filas.map(([f, fase]) => `| ${f} | ${fase} | automatico | persona |`),
+    '',
+  ].join('\n');
+}
+
+test('ventanas: de cada start a la siguiente review, y la ultima abierta hasta el volcado', () => {
+  const body = transiciones(
+    ['2026-11-01T09:00:00Z', 'plan'],
+    ['2026-11-01T09:30:00Z', 'approve'],
+    ['2026-11-01T10:00:00Z', 'start'],
+    ['2026-11-01T12:00:00Z', 'review']
+  );
+  assert.deepEqual(ventanasEnCurso(body, ms('2026-11-02T00:00:00Z')), [
+    { desde: ms('2026-11-01T10:00:00Z'), hasta: ms('2026-11-01T12:00:00Z') },
+  ]);
+  const abierta = transiciones(['2026-11-01T10:00:00Z', 'start']);
+  assert.deepEqual(ventanasEnCurso(abierta, ms('2026-11-01T11:00:00Z')), [
+    { desde: ms('2026-11-01T10:00:00Z'), hasta: ms('2026-11-01T11:00:00Z') },
+  ]);
+});
+
+test('ventanas: una fila con solo el dia no abre ventana, y sin start no hay ninguna', () => {
+  assert.deepEqual(ventanasEnCurso(transiciones(['2026-11-01', 'start']), ms('2026-11-02T00:00:00Z')), []);
+  assert.deepEqual(ventanasEnCurso(transiciones(['2026-11-01T09:00:00Z', 'plan']), ms('2026-11-02T00:00:00Z')), []);
+  assert.deepEqual(ventanasEnCurso('## Objetivo\nsin registro\n', Date.now()), []);
+});
+
+test('filtro: cuenta solo lo de la ventana, de la rama de la tarea y dentro del repo', () => {
+  const raiz = path.join(tmpdir(), 'repo-coste');
+  const f = filtroDeTarea([{ desde: ms('2026-11-01T10:00:00Z'), hasta: ms('2026-11-01T12:00:00Z') }], 'feature/x', raiz);
+  const base = { timestamp: '2026-11-01T10:30:00.000Z', gitBranch: 'feature/x', cwd: path.join(raiz, 'src') };
+  assert.equal(f(base), true);
+  assert.equal(f({ ...base, timestamp: '2026-11-01T09:59:59.999Z' }), false, 'antes del start (el diseno)');
+  assert.equal(f({ ...base, timestamp: '2026-11-01T12:00:00.000Z' }), false, 'desde la review, ya no');
+  assert.equal(f({ ...base, gitBranch: 'feature/otra' }), false, 'otra tarea de la misma sesion');
+  assert.equal(f({ ...base, cwd: path.join(tmpdir(), 'otro-repo') }), false, 'otro repo');
+  assert.equal(f({ timestamp: base.timestamp }), true, 'sin rama ni cwd: decide la hora');
+  assert.equal(f({ gitBranch: 'feature/x' }), false, 'sin hora no se puede atribuir');
+});
+
+test('sumarUsoTranscripcion con filtro: ignora las lineas que no cuentan; sin ninguna, null', () => {
+  const linea = (id: string, ts: string, salida: number): string =>
+    JSON.stringify({ type: 'assistant', timestamp: ts, message: { id, usage: { input_tokens: 1, output_tokens: salida } } });
+  const texto = [linea('a', '2026-11-01T09:00:00Z', 100), linea('b', '2026-11-01T10:30:00Z', 5)].join('\n');
+  const enVentana = (l: Readonly<Record<string, unknown>>): boolean => l['timestamp'] === '2026-11-01T10:30:00Z';
+  assert.equal(sumarUsoTranscripcion(texto, enVentana)?.tokens, 6);
+  assert.equal(sumarUsoTranscripcion(texto)?.tokens, 107, 'sin filtro, como siempre');
+  assert.equal(sumarUsoTranscripcion(texto, () => false), null);
+});
+
+test('idsDeFuente: las fuentes sesion: se leen como las de agente, con diferencia', () => {
+  assert.deepEqual(idsDeFuente('sesion:abc-123'), [{ id: 'abc-123', diferencia: false }]);
+  assert.deepEqual(idsDeFuente('sesion:dif:abc-123'), [{ id: 'abc-123', diferencia: true }]);
+  assert.deepEqual(idsDeFuente('manual'), [{ id: 'manual', diferencia: false }]);
+});
+
+function uso(tokens: number): UsoTranscripcion {
+  // tokens = entrada + cacheEscritura + cacheLectura + salida
+  return { tokens, llamadas: 1, entrada: tokens - 3, cacheEscritura: 1, cacheLectura: 1, salida: 1, lecturas: 2 };
+}
+
+function fila(fase: FilaCoste['fase'], fuente: string, u: UsoTranscripcion | null, total: number): FilaCoste {
+  return {
+    fecha: '2026-11-01T11:00:00Z',
+    fase,
+    fuente,
+    entrada: u?.entrada ?? null,
+    cacheEscritura: u?.cacheEscritura ?? null,
+    cacheLectura: u?.cacheLectura ?? null,
+    salida: u?.salida ?? null,
+    lecturas: u?.lecturas ?? null,
+    total,
+    ronda: null,
+    revisor: null,
+  };
+}
+
+test('volcado: una fila por fuente nueva, de implementacion, con su desglose', () => {
+  const medidas: FuenteMedida[] = [
+    { tipo: 'sesion', id: 's-1', uso: uso(1000) },
+    { tipo: 'agente', id: 'abc123', uso: uso(500) },
+  ];
+  const v = filasDeVolcado('## Objetivo\nx\n', medidas, '2026-11-01T12:00:00Z');
+  assert.equal(v.total, 1500);
+  assert.deepEqual(
+    v.filas.map((f) => [f.fase, f.fuente, f.total, f.entrada, f.lecturas]),
+    [
+      ['implementacion', 'sesion:s-1', 1000, 997, 2],
+      ['implementacion', 'agente:abc123', 500, 497, 2],
+    ]
+  );
+});
+
+test('volcado: no duplica. Lo ya anotado igual no suma; lo que crecio, solo la diferencia', () => {
+  let body = '## Objetivo\nx\n';
+  body = anadirCoste(body, fila('implementacion', 'sesion:s-1', uso(1000), 1000));
+  body = anadirCoste(body, fila('implementacion', 'agente:abc123', uso(500), 500));
+  const v = filasDeVolcado(
+    body,
+    [
+      { tipo: 'sesion', id: 's-1', uso: uso(1000) },
+      { tipo: 'agente', id: 'abc123', uso: uso(800) },
+    ],
+    '2026-11-01T12:00:00Z'
+  );
+  assert.deepEqual(
+    v.filas.map((f) => [f.fuente, f.total, f.entrada]),
+    [['agente:dif:abc123', 300, 300]]
+  );
+  // Y la tabla resultante no avisa de repetidas: la diferencia no es una repeticion.
+  const final = v.filas.reduce((acc, f) => anadirCoste(acc, f), body);
+  const resumen = resumirCostes(leerCostes(final), { diseno: null, implementacion: 1800, revision: null });
+  assert.deepEqual(resumen.repetidas, []);
+  assert.equal(resumen.fases.implementacion.sinDesglose, 0);
+});
+
+test('volcado: un agente anotado en otra fase, o junto a otros, no se toca', () => {
+  let body = '## Objetivo\nx\n';
+  body = anadirCoste(body, fila('revision', 'agente:abc123', uso(500), 500));
+  body = anadirCoste(body, fila('implementacion', 'agente:def456,fed654', uso(900), 900));
+  body = anadirCoste(body, fila('implementacion', 'manual', null, 50));
+  const v = filasDeVolcado(
+    body,
+    [
+      { tipo: 'agente', id: 'abc123', uso: uso(700) },
+      { tipo: 'agente', id: 'def456', uso: uso(700) },
+    ],
+    '2026-11-01T12:00:00Z'
+  );
+  assert.deepEqual(v.filas, []);
+  assert.equal(v.total, 0);
+  assert.equal(v.omitidas.length, 2);
+});
+
+test('volcado: una transcripcion que encoge (otra o recortada) no resta ni suma', () => {
+  const body = anadirCoste('## Objetivo\nx\n', fila('implementacion', 'sesion:s-1', uso(1000), 1000));
+  const v = filasDeVolcado(body, [{ tipo: 'sesion', id: 's-1', uso: uso(400) }], '2026-11-01T12:00:00Z');
+  assert.deepEqual(v.filas, []);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/registro-coste.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/registro-coste.test.ts
new file mode 100644
index 0000000..126c22e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/registro-coste.test.ts
@@ -0,0 +1,169 @@
+/**
+ * TASK-085: hook de registro del coste (Stop y SubagentStop). Repos Git
+ * temporales de verdad; el punto de entrada se prueba ademas como proceso,
+ * con el JSON por stdin, igual que lo lanza Claude Code.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { entradasDeHook, registrarTurno } from '../../src/hooks/registro-coste.js';
+import { leerPendientes, olvidarPendientes, rutaLibro } from '../../src/fs/coste-pendiente.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { git, sampleTask } from '../helpers/finish-fixtures.js';
+
+const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
+const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'coste-turno.js');
+const RAMA = 'feature/task-085-coste';
+const SESION = '0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0';
+
+async function montar(opts: { tarea?: boolean; carpeta?: boolean; rama?: string } = {}): Promise<{ raiz: string; limpiar: () => Promise<void> }> {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'registro-coste-'));
+  git(['init', '-q', '-b', 'main'], raiz);
+  git(['config', 'user.email', 'test@example.com'], raiz);
+  git(['config', 'user.name', 'Test'], raiz);
+  if (opts.carpeta !== false) {
+    await mkdir(path.join(raiz, 'tareas', '02-en-curso'), { recursive: true });
+    await writeFile(path.join(raiz, 'tareas', '02-en-curso', '.gitkeep'), '', 'utf8');
+  }
+  if (opts.tarea !== false && opts.carpeta !== false) {
+    const t = sampleTask({ id: 'TASK-085', estado: 'en-curso', rama: RAMA });
+    await mkdir(path.join(raiz, 'tareas', '02-en-curso', 'TASK-085'), { recursive: true });
+    await writeFile(path.join(raiz, 'tareas', '02-en-curso', 'TASK-085', 'tarea.md'), serializeTareaFile(t, '## Objetivo\nx\n'), 'utf8');
+  }
+  await writeFile(path.join(raiz, 'README.md'), 'x\n', 'utf8');
+  git(['add', '-A'], raiz);
+  git(['commit', '-q', '-m', 'inicial'], raiz);
+  git(['checkout', '-q', '-b', opts.rama ?? RAMA], raiz);
+  return { raiz, limpiar: () => rm(raiz, { recursive: true, force: true }) };
+}
+
+function entradaStop(raiz: string): Record<string, unknown> {
+  return {
+    hook_event_name: 'Stop',
+    cwd: raiz,
+    session_id: SESION,
+    transcript_path: path.join(tmpdir(), 'proyectos', `${SESION}.jsonl`),
+    stop_hook_active: false,
+  };
+}
+
+test('hook: con la tarea en curso en la rama anota la sesion, y en SubagentStop tambien el subagente', async () => {
+  const { raiz, limpiar } = await montar();
+  try {
+    assert.equal(await registrarTurno(entradaStop(raiz), { env: {} }), 1);
+    const sub = { ...entradaStop(raiz), hook_event_name: 'SubagentStop', agent_id: 'abc1234', agent_type: 'general-purpose' };
+    assert.equal(await registrarTurno(sub, { env: {} }), 2);
+    // Repetir no duplica: el libro solo guarda rutas y se funde al leer.
+    assert.equal(await registrarTurno(entradaStop(raiz), { env: {} }), 1);
+    const libro = rutaLibro(raiz);
+    assert.ok(libro !== null && libro.includes(`${path.sep}.git${path.sep}`), `el libro vive bajo .git: ${String(libro)}`);
+    const pendientes = leerPendientes(libro, 'TASK-085');
+    assert.deepEqual(
+      pendientes.map((p) => [p.tipo, p.id, path.basename(p.ruta)]),
+      [
+        ['sesion', SESION, `${SESION}.jsonl`],
+        ['agente', 'abc1234', 'agent-abc1234.jsonl'],
+      ]
+    );
+    // La ruta del subagente, sin agent_transcript_path, es la que usa Claude Code junto a la sesion.
+    assert.equal(
+      pendientes[1]?.ruta,
+      path.join(tmpdir(), 'proyectos', SESION, 'subagents', 'agent-abc1234.jsonl')
+    );
+    // Ni ensucia el arbol ni toca tarea.md.
+    assert.equal(git(['status', '--porcelain'], raiz).trim(), '');
+    olvidarPendientes(libro, 'TASK-085');
+    assert.equal(existsSync(libro), false, 'sin entradas, el libro desaparece');
+  } finally {
+    await limpiar();
+  }
+});
+
+test('hook: sin tarea en curso sale sin hacer nada y sin consultar la rama (ningun proceso)', async () => {
+  for (const opts of [{ carpeta: false }, { tarea: false }]) {
+    const { raiz, limpiar } = await montar(opts);
+    try {
+      let consultas = 0;
+      const ramaActual = (): string => {
+        consultas++;
+        return RAMA;
+      };
+      assert.equal(await registrarTurno(entradaStop(raiz), { env: {}, ramaActual }), 0);
+      assert.equal(consultas, 0, `con ${JSON.stringify(opts)} no se lanza git`);
+      assert.equal(existsSync(path.join(raiz, '.git', 'coste-pendiente.jsonl')), false);
+    } finally {
+      await limpiar();
+    }
+  }
+});
+
+test('hook: en otra rama, con COSTE_AUTOMATICO=0 o con una entrada rara, no anota nada', async () => {
+  const { raiz, limpiar } = await montar({ rama: 'feature/otra' });
+  try {
+    assert.equal(await registrarTurno(entradaStop(raiz), { env: {} }), 0);
+    git(['checkout', '-q', '-b', RAMA], raiz);
+    assert.equal(await registrarTurno(entradaStop(raiz), { env: { COSTE_AUTOMATICO: '0' } }), 0);
+    assert.equal(await registrarTurno({}, { env: {} }), 0);
+    assert.equal(await registrarTurno({ ...entradaStop(raiz), cwd: path.join(raiz, 'no-existe') }, { env: {} }), 0);
+    assert.equal(await registrarTurno({ ...entradaStop(raiz), session_id: '../../x' }, { env: {} }), 0);
+    assert.equal(existsSync(path.join(raiz, '.git', 'coste-pendiente.jsonl')), false);
+  } finally {
+    await limpiar();
+  }
+});
+
+test('hook: entradasDeHook valida ids y rutas antes de anotar', () => {
+  const base = { session_id: SESION, transcript_path: path.join(tmpdir(), 's.jsonl') };
+  assert.equal(entradasDeHook({ ...base, transcript_path: 'relativa.jsonl' }, 'TASK-1').length, 0);
+  assert.deepEqual(
+    entradasDeHook({ ...base, agent_id: 'no-es-hex!' }, 'TASK-1').map((e) => e.tipo),
+    ['sesion']
+  );
+  const declarada = path.join(tmpdir(), 'a', 'agent-abc1234.jsonl');
+  assert.equal(
+    entradasDeHook({ ...base, agent_id: 'abc1234', agent_transcript_path: declarada }, 'TASK-1')[1]?.ruta,
+    declarada
+  );
+});
+
+test('hook: como proceso sale con 0, sin escribir nada, y anota en el libro', async () => {
+  const { raiz, limpiar } = await montar();
+  try {
+    const env = { ...process.env };
+    delete env['COSTE_AUTOMATICO'];
+    const r = spawnSync(process.execPath, [ENTRADA_HOOK], {
+      input: JSON.stringify(entradaStop(raiz)),
+      encoding: 'utf8',
+      env,
+    });
+    assert.equal(r.status, 0);
+    assert.equal(r.stdout, '');
+    assert.equal(r.stderr, '');
+    const libro = rutaLibro(raiz) as string;
+    assert.equal(readFileSync(libro, 'utf8').trim().split('\n').length, 1);
+    // JSON roto: tambien 0 y en silencio.
+    const roto = spawnSync(process.execPath, [ENTRADA_HOOK], { input: '{no', encoding: 'utf8', env });
+    assert.deepEqual([roto.status, roto.stdout, roto.stderr], [0, '', '']);
+  } finally {
+    await limpiar();
+  }
+});
+
+test('hook: hooks.json lo declara en Stop y SubagentStop, en forma exec, con timeout corto y sin nombrar el producto', () => {
+  const texto = readFileSync(path.join(RAIZ_PLUGIN, 'hooks', 'hooks.json'), 'utf8');
+  const j = JSON.parse(texto) as {
+    hooks: Record<string, { hooks: { type: string; command: string; args: string[]; timeout: number }[] }[]>;
+  };
+  for (const evento of ['Stop', 'SubagentStop']) {
+    const delCoste = (j.hooks[evento] ?? []).flatMap((g) => g.hooks).filter((h) => h.args.some((a) => a.endsWith('coste-turno.js')));
+    assert.equal(delCoste.length, 1, `${evento} declara el hook de coste una vez`);
+    assert.equal(delCoste[0]?.command, 'node');
+    assert.deepEqual(delCoste[0]?.args, ['${CLAUDE_PLUGIN_ROOT}/dist/src/hooks/coste-turno.js']);
+    assert.ok((delCoste[0]?.timeout ?? 0) <= 30);
+  }
+  assert.doesNotMatch(texto, /taskcode/i);
+});
````

## Excluido del diff (18 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-085/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-085/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-085/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-085/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-085/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-085/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-085/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |   5 +++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  16 +++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |  16 +++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-automatico.js                               | 135 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-registro.js                                 |  19 +++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/coste-transcripcion.js                            |  12 +++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/coste-automatico.js                                 | 161 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/coste-pendiente.js                                  | 104 +++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/coste-turno.js                                   |  19 ++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                    |   4 +--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/registro-coste.js                                | 100 +++++++++++++++++++++++++++++++++++++++++++++++++++
 18 files changed, 580 insertions(+), 14 deletions(-)
````
