# Peticion de revision — TASK-052 (ronda 1)

- Tarea: TASK-052 — F6-T5 Telemetria de fases y heuristica recalibrada
- Rama revisada: feature/task-052-f6-t5-telemetria-de-fases-y-heuristica-r
- Rama base: develop
- Commit revisado (HEAD): 70ce4346babc6efcf5deea02064c262f4c37cb69
- Fecha: 2026-10-05
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-052 (criterios de aceptacion y plan)

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
70ce434 feat(TASK-052): nivel_trivial_hasta de 1 a 0, calibrado con rondas reales
d2d8f50 feat(TASK-052): instante en Transiciones y taskctl metricas
da074b7 feat(TASK-052): fuera las claves de la heuristica que nada leia
e06e16e chore(TASK-052): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 25bdebe..6191426 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -43,8 +43,8 @@ npm test             # compila y corre la suite completa (~1090 tests, ~8 min) c
 npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar, no para cerrar
 ```
 
-El CLI: `taskctl new | import | board | plan | approve | start | review |
-finish`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
+El CLI: `taskctl new | import | board | metricas | plan | approve | start |
+review | finish`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
 recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
 cerradas.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 941f5a9..2d55372 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -520,3 +520,16 @@ pide el criterio de aceptación.
 Ver `taskctl --help` (arriba) para la lista completa y actualizada. Guía
 extendida de la metodología: `docs/PROPUESTA_METODOLOGIA.md` y
 `docs/PLAN_SPRINTS.md` en la raíz del repo `TaskCode`.
+
+`taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
+con la duración de calendario de cada fase (diseño = plan→start, curso =
+start→primer review, revisión = primer review→finish), las rondas de
+revisión, el día de cierre y el origen del dato: la tabla `## Transiciones`
+del `tarea.md` (cuya columna `fecha` lleva el instante UTC al segundo desde
+la 0.5.0; las filas antiguas, solo el día, dan la duración en días), o, si
+la tarea no la tiene, los commits automáticos `chore(TASK-NNN): ...` con un
+único `git log`; si tampoco, «—». Las pausas no se descuentan.
+`--heuristica` añade a las tareas terminadas con informes de revisión la
+puntuación y el nivel de la heurística de complejidad vigente, más un
+resumen de rondas medias por nivel declarado y heurístico: es la tabla con
+la que se calibra `scripts/heuristica-complejidad.yml`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
index 7fc3d76..ef499a9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
@@ -94,7 +94,7 @@
 # equipo a mano".
 #
 # NINGUN SKILL DE ESTE FICHERO ES OBLIGATORIO. A diferencia de
-# heuristica-complejidad.yml (22 claves obligatorias que cubren TODA tarea
+# heuristica-complejidad.yml (19 claves obligatorias que cubren TODA tarea
 # por construccion), este catalogo es explicitamente no exhaustivo: cero
 # candidatos tras cruzar `etiquetas` es un resultado VALIDO (selección
 # vacia + aviso), no un fallo de configuracion. Lo que SI es fail-closed es
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/heuristica-complejidad.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/heuristica-complejidad.yml
index 83f11ed..9fd3252 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/heuristica-complejidad.yml
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/heuristica-complejidad.yml
@@ -27,8 +27,9 @@
 # deja escrita en vez de reescribir la metodologia o forzar el enum.
 #
 # Los valores de aqui son los defaults del plugin y valen para
-# cualquier proyecto. Son un punto de partida razonado, no una medida:
-# se ajustaran cuando haya suficientes tareas cerradas de los cinco
+# cualquier proyecto. Salieron como un punto de partida razonado, no
+# como una medida; la seccion 2 lleva ya un ajuste medido (ver alli),
+# y el resto se ajustara cuando haya tareas cerradas de los cinco
 # niveles con que contrastarlos.
 
 # ---------------------------------------------------------------------
@@ -84,8 +85,40 @@ umbral_criterios_aceptacion: 5
 # 2. Mapeo puntuacion -> nivel heuristico. Cada clave es el ultimo
 #    valor que TODAVIA cae en ese nivel; a partir de nivel_critica_desde
 #    la escala se abre y ya no crece mas.
+#
+#    CALIBRACION MEDIDA (2026-10-05). Coste real = rondas de revision
+#    (numero de la ultima ronda; ninguna tarea de la muestra tenia rondas
+#    fragmentadas, asi que coincide con el numero de informes). Muestra:
+#    n=43 tareas terminadas con informes de revision, de 2026-09-07 a
+#    2026-10-05, de un solo proyecto (las tareas sin revision/ no entran:
+#    no son "0 rondas", son no medidas). Fuente: el registro de fases y
+#    las carpetas revision/ de cada tarea. Se reproduce con el comando
+#    "metricas --heuristica" del CLI del plugin, en la raiz del proyecto
+#    y con nivel_trivial_hasta en 1.
+#
+#    Lo que sostiene la muestra: las tareas con 0 puntos (n=16) cerraron
+#    con 1,19 rondas de media; las de 1 punto (n=14), con 2,29; las de 2
+#    o mas (n=13), con 1,92. El corte entre "0" y "1 o mas" es el unico
+#    que separa coste en estos datos (y se mantiene mirando solo las 26
+#    tareas mas recientes: 1,19 frente a 1,90). Con el corte en 1, el 70%
+#    de la muestra caia en trivial (30 de 43) y declarado y heuristico
+#    coincidian en 5 de 43; con el corte en 0, en 9 de 43.
+#    Por eso nivel_trivial_hasta pasa de 1 a 0: una sola senal ya saca a
+#    la tarea de trivial. El efecto practico se limita a las tareas que
+#    puntuan 1 y se declaran trivial: suben de 0 a 1 rol de brainstorm
+#    (el maximo entre declarado y heuristico manda).
+#
+#    Lo que la muestra NO sostiene, y por eso no se toca: los pesos. La
+#    palabra de alto riesgo (peso 2) solo salto en 2 tareas, ambas de 1
+#    ronda; las dependencias (8 tareas, 2,63 rondas) son todas de la
+#    misma epoca temprana, cuando todas las tareas costaban mas rondas.
+#    Ni alta ni critica salen nunca de la heuristica: sus cortes no se
+#    pueden contrastar.
+#
+#    DIVERGENCIA con la escala de la metodologia (1/3/5/7/8): el primer
+#    corte es 0. Se documenta aqui en vez de reescribir la metodologia.
 # ---------------------------------------------------------------------
-nivel_trivial_hasta: 1
+nivel_trivial_hasta: 0
 nivel_simple_hasta: 3
 nivel_media_hasta: 5
 nivel_alta_hasta: 7
@@ -164,31 +197,3 @@ agentes_brainstorm_critica: 4
 # de cuatro puntos de vista. La revision por pares posterior no se
 # toca: un hotfix se revisa igual que cualquier otra tarea.
 agentes_brainstorm_hotfix: 1
-
-# ---------------------------------------------------------------------
-# 5. Tolerancia frente a la complejidad declarada por la persona.
-#
-# El nivel heuristico NO manda: se compara con el declarado. Si
-# coinciden, o si distan como mucho tolerancia_niveles escalones, se
-# acepta el declarado sin consultar a ningun modelo. Solo si discrepan
-# mas que eso se consulta a uno barato, y se le pasan unicamente los
-# dos niveles y que senales dispararon la puntuacion: el calculo ya
-# esta hecho, reenviarle el objetivo entero seria pagarlo dos veces.
-# ---------------------------------------------------------------------
-tolerancia_niveles: 1
-
-# La discrepancia NO es simetrica. Que la heuristica sugiera MAS
-# complejidad que la declarada es el caso que importa capturar:
-# infraestimar deja la tarea con menos revision y un modelo mas flojo
-# de los que necesita. Que sugiera MENOS es barato de dejar pasar, asi
-# que en esa direccion se puede ser mas permisivo para reducir las
-# consultas. Esa holgura extra se suma a tolerancia_niveles solo cuando
-# la heuristica queda POR DEBAJO de lo declarado, y arranca en 0: hoy el
-# comportamiento es simetrico y subirla es una decision consciente. La
-# direccion no se declara en una clave aparte porque solo podria valer
-# una cosa: ya la fija el nombre de la clave que viene aqui debajo.
-tolerancia_extra_si_heuristica_menor: 0
-
-# Modelo al que se consulta la discrepancia. Barato a proposito: la
-# pregunta es un desempate entre dos etiquetas, no un analisis.
-modelo_consulta_discrepancia: haiku
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 15a55dc..d169c3e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -76,6 +76,7 @@ taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release>
 taskctl import <fichero.md> [--tipo ...] [--sprint N] [--complejidad ...]   # `> texto` bajo el ### = Objetivo
 taskctl board [--sprint N] [--asignado-a <persona>]
 taskctl board --escribir          # no se combina con los filtros de arriba
+taskctl metricas [--heuristica]   # duracion de cada fase y rondas por tarea; solo lee
 taskctl plan    TASK-NNN [--asignado-a <persona>]
 taskctl approve TASK-NNN [--decidido-por persona|automatico]
 taskctl start   TASK-NNN [--asignado-a <persona>]
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 0e804af..29ff689 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -6,6 +6,7 @@ import path from 'node:path';
 import { runNewCommand, NewTaskArgError } from './commands/new.js';
 import { runImportCommand, ImportCommandError } from './commands/import.js';
 import { runBoardCommand, BoardCommandError } from './commands/board.js';
+import { runMetricasCommand, MetricasCommandError } from './commands/metricas.js';
 import { runStartCommand, StartCommandError } from './commands/start.js';
 import { runPlanCommand, PlanCommandError, type PlanCommandResult } from './commands/plan.js';
 import { HeuristicaError } from './core/heuristica.js';
@@ -50,6 +51,7 @@ import {
 // taskctl arranco bien, lo que esta mal es el .taskcode/config.yml
 // del repo.
 import { ConfigError } from './core/config.js';
+import { formatearInstante } from './core/transiciones.js';
 
 const VERSION = '0.4.0';
 
@@ -66,6 +68,7 @@ Uso:
                  [--sprint N] [--complejidad ...] [--modelo-sugerido ...] \\
                  [--agente-revisor ...]
   taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
+  taskctl metricas [--heuristica]
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--decidido-por persona|automatico] [--push]
@@ -83,8 +86,11 @@ Uso:
   taskctl recover [<rama>]
   taskctl abort-merge
 
-Comandos: new, import, board, start, plan, approve, review, codex-review, veredicto, finish,
-siguiente, pausa, cadena.
+Comandos: new, import, board, metricas, start, plan, approve, review, codex-review, veredicto,
+finish, siguiente, pausa, cadena.
+metricas saca, por tarea, cuanto duro cada fase (diseno, curso, revision) y
+cuantas rondas de revision hubo; --heuristica compara la complejidad declarada
+con la que da la heuristica en las tareas terminadas. Solo lee.
 siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
 manual, semiautomatico o automatico); solo lee. pausa registra que la persona
 no quiere pasar todavia a la siguiente fase. cadena bloquea el arbol mientras
@@ -106,6 +112,16 @@ function today(): string {
   return new Date().toISOString().slice(0, 10);
 }
 
+/**
+ * TASK-052: el instante que se escribe en `## Transiciones`. Misma fuente
+ * que today() (UTC, toISOString), al segundo: con hora local, una fila de
+ * las 23:30 en Madrid no casaria con su fecha. `today` sigue siendo lo que
+ * usan `actualizado` y el board.
+ */
+function ahora(): string {
+  return formatearInstante(new Date());
+}
+
 /**
  * Algunos errores del CLI ya se construyen con el prefijo "[ERROR]"
  * (StartCommandError, PlanCommandError, StateMachineError...), otros
@@ -442,12 +458,36 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'metricas') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const result = await runMetricasCommand(tareasRoot, argv.slice(1), { repoCwd });
+      for (const aviso of result.advertencias) {
+        process.stderr.write(`[AVISO] ${aviso}\n`);
+      }
+      if (result.totalTareas === 0) {
+        process.stdout.write('No hay tareas que medir (o no hay ninguna tarea todavia).\n');
+      } else {
+        process.stdout.write(`${result.output}\n`);
+      }
+      return 0;
+    } catch (e) {
+      if (e instanceof MetricasCommandError || e instanceof HeuristicaError) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'start') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
     try {
       const result = await runStartCommand(tareasRoot, argv.slice(1), today(), {
         repoCwd,
+        ahora: ahora(),
         scriptsDir: resolveGitflowScriptsDir(),
       });
       printAvisos(result.avisoIdentidad, result.avisoAtribucion, ...result.avisosWip);
@@ -480,7 +520,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
     try {
-      const result = await runPlanCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+      const result = await runPlanCommand(tareasRoot, argv.slice(1), today(), { repoCwd, ahora: ahora() });
       printBaseBranchSwitchNotice(result.baseBranchGuard);
       printAvisos(result.avisoIdentidad, ...result.avisosEnunciado);
       // Tres desenlaces posibles desde TASK-027 (item C3): scaffold
@@ -527,7 +567,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
     try {
-      const result = await runApproveCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+      const result = await runApproveCommand(tareasRoot, argv.slice(1), today(), { repoCwd, ahora: ahora() });
       printBaseBranchSwitchNotice(result.baseBranchGuard);
       // Nota (hallazgo menor de revision por pares): para complejidad
       // trivial/simple, "taskctl start" nunca exigio plan_aprobado
@@ -561,6 +601,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     try {
       const result = await runReviewCommand(tareasRoot, argv.slice(1), today(), {
         repoCwd,
+        ahora: ahora(),
         scriptsDir: resolveGitflowScriptsDir(),
       });
       // TASK-018: N pares peticion/informe si el diff se fragmento por
@@ -660,7 +701,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
     try {
-      const r = await runPausaCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+      const r = await runPausaCommand(tareasRoot, argv.slice(1), today(), { repoCwd, ahora: ahora() });
       process.stdout.write(
         `Tarea ${r.id}: pausa registrada en ${r.filePath}. Para seguir: taskctl siguiente ${r.id}.\n`
       );
@@ -757,6 +798,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     try {
       const result = await runFinishCommand(tareasRoot, argv.slice(1), today(), {
         repoCwd,
+        ahora: ahora(),
         scriptsDir: resolveGitflowScriptsDir(),
         onAviso: (aviso) => printAvisos(aviso),
       });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index edde4f9..e45519d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -61,7 +61,7 @@ export function parseArgs(argv: readonly string[]): ParsedArgs {
  * `--flag=valor`. `validos` va con su prefijo (`--titulo`, `-p`).
  */
 /** Flags booleanos del CLI: los comandos solo reconocen el token suelto. */
-const FLAGS_SIN_VALOR: readonly string[] = ['--push', '--json', '--forzar', '--escribir'];
+const FLAGS_SIN_VALOR: readonly string[] = ['--push', '--json', '--forzar', '--escribir', '--heuristica'];
 
 export function rechazarFlagsDesconocidos(
   argv: readonly string[],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index 2587ff2..f86e078 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -95,6 +95,8 @@ export interface ApproveCommandResult {
 export interface ApproveCommandDeps {
   /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
   repoCwd: string;
+  /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
+  ahora?: string;
 }
 
 export async function runApproveCommand(
@@ -179,7 +181,7 @@ export async function runApproveCommand(
   // asi la segunda vez sigue sin crear commit (es idempotente).
   const conRegistro = task.plan_aprobado
     ? body
-    : registrarTransicion(body, 'approve', today, resolverConfig(deps.repoCwd).modo_flujo, decididoPor);
+    : registrarTransicion(body, 'approve', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo, decididoPor);
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
   // Paso 5 de la 8.3 (TASK-030, item C2). "approve" no cambia el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 4db9fdc..64a2acc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -218,6 +218,8 @@ export interface FinishCommandDeps {
    * resultado llega despues del merge, cuando ya no hay vuelta atras.
    */
   onAviso?: (aviso: string) => void;
+  /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
+  ahora?: string;
 }
 
 export interface FinishCommandResult {
@@ -407,7 +409,7 @@ export async function runFinishCommand(
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
 
   const updated: Task = { ...task, estado: 'terminada', actualizado: today };
-  const conRegistro = registrarTransicion(body, 'finish', today, resolverConfig(deps.repoCwd).modo_flujo);
+  const conRegistro = registrarTransicion(body, 'finish', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
 
   // Renderizado de cierre (criterio 3): plantillas desde el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
new file mode 100644
index 0000000..2a55fb9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -0,0 +1,191 @@
+/**
+ * taskctl metricas — tabla de fases por tarea (TASK-052). Solo lectura,
+ * con el patron de `board`: no escribe nada ni cambia de rama, asi que no
+ * aplica la precondicion de rama base.
+ *
+ * Lee cada tarea, los nombres de su `revision/` y, solo si alguna tarea no
+ * tiene registro de Transiciones, UN `git log` para todas (nunca uno por
+ * tarea). Si git no esta o el directorio no es un repo, esas tareas salen
+ * con «—» y un aviso; el comando no falla por eso.
+ *
+ * `--heuristica` anade la puntuacion y el nivel que da la heuristica
+ * vigente a las tareas terminadas con informes de revision (las demas no
+ * entran en la muestra), y un resumen por nivel declarado y heuristico con
+ * las rondas medias: es la tabla con la que se recalibra el YML.
+ */
+import path from 'node:path';
+import { readdir } from 'node:fs/promises';
+import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
+import { FrontmatterParseError } from '../core/frontmatter.js';
+import { TaskValidationError, TASK_COMPLEXITIES } from '../core/task.js';
+import { cargarHeuristica, nivelHeuristico, puntuarTarea } from '../core/heuristica.js';
+import { leerTransiciones } from '../core/transiciones.js';
+import {
+  COLUMNAS_HEURISTICA,
+  COLUMNAS_METRICAS,
+  calcularFila,
+  enMuestraHeuristica,
+  formatearResumen,
+  formatearTabla,
+  parsearLogGit,
+  resumirPorNivel,
+  type EventoGit,
+  type FilaMetricas,
+} from '../core/metricas.js';
+import { INFORME_REVISION_RE, nombresDeUltimaRonda } from '../fs/rondas.js';
+import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
+import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';
+
+export class MetricasCommandError extends Error {}
+
+export const FLAGS_METRICAS: readonly string[] = ['--heuristica'];
+
+export interface MetricasCommandResult {
+  output: string;
+  totalTareas: number;
+  advertencias: string[];
+}
+
+export interface MetricasCommandDeps {
+  /** Raiz del repo donde se consulta git log. */
+  repoCwd: string;
+  /** Ruta del YML de la heuristica (tests); por defecto la del plugin. */
+  rutaHeuristica?: string;
+}
+
+const NOTA_CALENDARIO =
+  'Duraciones de calendario: diseno = plan->start, curso = start->primer review, ' +
+  'revision = primer review->finish. Las pausas no se descuentan. Con origen "registro" ' +
+  'de filas antiguas (solo el dia) o mezcladas, la duracion va en dias ("N d").';
+
+function parseHeuristicaFlag(argv: readonly string[]): boolean {
+  const { flags, positional } = parseArgs(argv);
+  if (positional.length > 0) {
+    throw new MetricasCommandError(
+      `[ERROR] taskctl metricas no admite argumentos sueltos ("${positional.join(' ')}"). ` +
+        'Saca la tabla de todas las tareas; para una sola, filtra la salida.'
+    );
+  }
+  const raw = flags['heuristica'];
+  if (raw === undefined) return false;
+  if (raw !== true) {
+    throw new MetricasCommandError(
+      '[ERROR] --heuristica no lleva valor: usalo suelto (taskctl metricas --heuristica).'
+    );
+  }
+  return true;
+}
+
+async function nombresDeRevision(dirTarea: string): Promise<string[]> {
+  try {
+    return await readdir(path.join(dirTarea, 'revision'));
+  } catch (e: unknown) {
+    if (isEnoent(e) || isEnotdir(e)) return [];
+    throw e;
+  }
+}
+
+/** Un solo git log para todo el repo; null si git no se pudo consultar. */
+function eventosGit(repoCwd: string): EventoGit[] | null {
+  try {
+    return parsearLogGit(runGit(['log', '--all', '--format=%at%x09%s'], repoCwd));
+  } catch (e: unknown) {
+    if (e instanceof GitCommandError || e instanceof GitLaunchError) return null;
+    throw e;
+  }
+}
+
+export async function runMetricasCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  deps: MetricasCommandDeps
+): Promise<MetricasCommandResult> {
+  rechazarFlagsDesconocidos(argv, FLAGS_METRICAS, 'metricas', (m) => new MetricasCommandError(m));
+  const conHeuristica = parseHeuristicaFlag(argv);
+  // La heuristica se carga ANTES de leer nada: un YML roto aborta sin
+  // haber sacado media tabla.
+  const h = conHeuristica ? cargarHeuristica(deps.rutaHeuristica) : null;
+
+  const advertencias: string[] = [];
+  const ids = [...new Set(await listExistingTaskIds(tareasRoot))].sort(
+    (a, b) => Number(a.slice(5)) - Number(b.slice(5))
+  );
+
+  const leidas: { task: NonNullable<Awaited<ReturnType<typeof readTareaFile>>>; ronda: number }[] = [];
+  for (const id of ids) {
+    try {
+      const read = await readTareaFile(tareasRoot, id);
+      if (read === null) continue;
+      const nombres = await nombresDeRevision(path.dirname(read.filePath));
+      leidas.push({ task: read, ronda: nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).ronda });
+    } catch (e: unknown) {
+      if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
+        advertencias.push(`${id} tiene un tarea.md invalido y no aparece en las metricas: ${e.message}`);
+        continue;
+      }
+      throw e;
+    }
+  }
+
+  // git solo si hace falta, y una sola vez.
+  const sinRegistro = leidas.some((l) => leerTransiciones(l.task.body).length === 0);
+  let porId = new Map<string, EventoGit[]>();
+  if (sinRegistro) {
+    const eventos = eventosGit(deps.repoCwd);
+    if (eventos === null) {
+      advertencias.push(
+        'No se pudo consultar git log: las tareas sin registro de Transiciones salen con "—". ' +
+          'Ejecuta taskctl metricas desde la raiz del repo.'
+      );
+    } else {
+      porId = new Map();
+      for (const ev of eventos) {
+        const lista = porId.get(ev.id) ?? [];
+        lista.push(ev);
+        porId.set(ev.id, lista);
+      }
+    }
+  }
+
+  let filas: FilaMetricas[] = leidas.map((l) =>
+    calcularFila({
+      task: l.task.task,
+      body: l.task.body,
+      ronda: l.ronda,
+      eventosGit: porId.get(l.task.task.id) ?? [],
+    })
+  );
+
+  if (h === null) {
+    return {
+      output: `${formatearTabla(filas, COLUMNAS_METRICAS)}\n\n${NOTA_CALENDARIO}`,
+      totalTareas: filas.length,
+      advertencias,
+    };
+  }
+
+  const cuerpoPorId = new Map(leidas.map((l) => [l.task.task.id, l.task]));
+  filas = filas.filter(enMuestraHeuristica).map((f) => {
+    const leida = cuerpoPorId.get(f.id) as NonNullable<Awaited<ReturnType<typeof readTareaFile>>>;
+    const { puntos } = puntuarTarea(leida.task, leida.body, h);
+    return { ...f, heuristica: { puntos, nivel: nivelHeuristico(puntos, h) } };
+  });
+  const coinciden = filas.filter((f) => f.heuristica?.nivel === f.complejidad).length;
+  const salida = [
+    formatearTabla(filas, [...COLUMNAS_METRICAS, ...COLUMNAS_HEURISTICA]),
+    '',
+    `Muestra: ${String(filas.length)} tareas terminadas con informes de revision ` +
+      '(rondas = numero de la ultima ronda; las tareas sin revision/ no entran). ' +
+      `Declarado y heuristico coinciden en ${String(coinciden)} de ${String(filas.length)}.`,
+    '',
+    formatearResumen('Por complejidad declarada:', resumirPorNivel(filas, (f) => f.complejidad, TASK_COMPLEXITIES)),
+    '',
+    formatearResumen(
+      'Por nivel heuristico:',
+      resumirPorNivel(filas, (f) => f.heuristica?.nivel ?? null, TASK_COMPLEXITIES)
+    ),
+    '',
+    NOTA_CALENDARIO,
+  ].join('\n');
+  return { output: salida, totalTareas: filas.length, advertencias };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
index 90b405c..cf714d0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
@@ -30,6 +30,8 @@ export const FLAGS_PAUSA: readonly string[] = ['--push', '-p'];
 
 export interface PausaCommandDeps {
   repoCwd: string;
+  /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
+  ahora?: string;
 }
 
 export interface PausaCommandResult {
@@ -85,7 +87,7 @@ export async function runPausaCommand(
     );
   }
 
-  const conRegistro = registrarTransicion(body, 'pausa', today, modoConfig, 'persona');
+  const conRegistro = registrarTransicion(body, 'pausa', deps.ahora ?? today, modoConfig, 'persona');
   const nuevo = await moveTareaFile(tareasRoot, filePath, task, conRegistro);
   const commit = autoCommit({
     cwd: deps.repoCwd,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 96a7f2d..85a4cae 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -340,6 +340,8 @@ export interface PlanCommandDeps {
   repoCwd: string;
   /** TASK-044: donde escribir la particion propuesta (por defecto os.tmpdir()). Para tests. */
   dirParticion?: string;
+  /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
+  ahora?: string;
 }
 
 /**
@@ -1004,7 +1006,7 @@ export async function runPlanCommand(
     );
   }
   // TASK-056: la fila de plan congela el modo de flujo del config en la tarea.
-  const conRegistro = registrarTransicion(body, 'plan', today, resolverConfig(deps.repoCwd).modo_flujo);
+  const conRegistro = registrarTransicion(body, 'plan', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
   const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 17252b6..0c150d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -94,6 +94,8 @@ export interface ReviewCommandDeps {
   repoCwd: string;
   /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
   scriptsDir: string;
+  /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
+  ahora?: string;
 }
 
 /**
@@ -581,7 +583,7 @@ export async function runReviewCommand(
     );
   }
 
-  const conRegistro = registrarTransicion(body, 'review', today, resolverConfig(deps.repoCwd).modo_flujo);
+  const conRegistro = registrarTransicion(body, 'review', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
   const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
   const informes: RevisionGrupo[] = escrituras.map((escritura) => ({
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index 22bd6fd..ad306a3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -65,6 +65,8 @@ export interface StartCommandDeps {
   repoCwd: string;
   /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
   scriptsDir: string;
+  /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
+  ahora?: string;
 }
 
 export interface StartCommandResult {
@@ -291,7 +293,7 @@ export async function runStartCommand(
   // ver comentario de MoveTareaFileOptions en task-store.ts. task/body
   // ya se leyeron en memoria antes de invocar el script, asi que no se
   // pierde nada.
-  const conRegistro = registrarTransicion(body, 'start', today, resolverConfig(deps.repoCwd).modo_flujo);
+  const conRegistro = registrarTransicion(body, 'start', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro, {
     tolerateMissingSource: true,
   });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
index 621156a..59db6bd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/catalogo-skills.ts
@@ -10,7 +10,7 @@
  * de frontmatter.ts) y un solo punto de resolucion
  * (`cargarCatalogoSkills`).
  *
- * LA UNICA DIFERENCIA DE FONDO CON heuristica.ts: alli las 22 claves
+ * LA UNICA DIFERENCIA DE FONDO CON heuristica.ts: alli las 19 claves
  * cubren TODA tarea por construccion, asi que cualquier ausencia es un
  * fallo. Aqui el catalogo es EXPLICITAMENTE NO EXHAUSTIVO — cero
  * candidatos tras cruzar `etiquetas` con la tarea es un resultado
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
index 95e86c4..8e20f36 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
@@ -15,7 +15,7 @@
  *    ABORTAN. Nunca hay caida al default en silencio. Aqui la regla
  *    aprieta MAS que en config.yml: alli las tres claves son
  *    opcionales porque un repo sin configuracion es normal; aqui NO
- *    hay defaults en codigo y las 22 claves son obligatorias, porque
+ *    hay defaults en codigo y las 19 claves son obligatorias, porque
  *    este fichero lo distribuye el propio plugin y una clave que falta
  *    no significa "usa lo de siempre", significa que el fichero esta
  *    roto o que alguien lo edito a medias.
@@ -29,18 +29,20 @@
  *    cuenta.
  *
  * ------------------------------------------------------------------
- * DIVERGENCIA DELIBERADA CON LA SECCION 5 DEL YML (aprobada por
+ * LA DISCREPANCIA SE RESUELVE SIN CONSULTAR A NADIE (aprobado por
  * Carlos, 2026-09-08).
  *
- * La seccion 5 del fichero dice que, cuando el nivel heuristico y el
- * declarado por la persona disten mas de `tolerancia_niveles`
- * escalones, se consulte a un modelo barato para desempatar. Este
- * modulo NO hace eso, porque el CLI no invoca modelos: `taskctl` hace
- * lo determinista y deja escrito lo que otro tiene que disparar (mismo
- * reparto que `taskctl review` establecio en TASK-013). Meter aqui una
- * llamada a un modelo cambiaria esa frontera entera.
+ * El YML llego a decir que, cuando el nivel heuristico y el declarado
+ * por la persona distaran mas de una tolerancia, se consultara a un
+ * modelo barato para desempatar. Este modulo nunca lo hizo, porque el
+ * CLI no invoca modelos: `taskctl` hace lo determinista y deja escrito
+ * lo que otro tiene que disparar (mismo reparto que `taskctl review`
+ * establecio en TASK-013). Las tres claves de esa consulta
+ * (`tolerancia_niveles`, `tolerancia_extra_si_heuristica_menor` y
+ * `modelo_consulta_discrepancia`) se validaban sin que nada las leyera,
+ * y TASK-052 las quito del fichero y de aqui.
  *
- * En su lugar, resolverNumeroAgentes() resuelve la discrepancia SIN
+ * resolverNumeroAgentes() resuelve la discrepancia SIN
  * consultar a nadie: se queda con el MAYOR de los dos numeros de
  * agentes. Es la eleccion conservadora en la direccion que el propio
  * YML senala como la cara ("infraestimar deja la tarea con menos
@@ -71,22 +73,14 @@
  * heuristica la suba a `simple` y el max le ponga un rol. La unica
  * tarea declarada `trivial` del repo (TASK-005) sale con 1.
  *
+ * TASK-052 lo acentua a sabiendas: con `nivel_trivial_hasta: 0`
+ * (calibrado con las rondas de revision de 43 tareas cerradas, ver el
+ * YML) basta UNA senal para salir de `trivial`.
+ *
  * No se corrige por cuenta propia porque el max lo aprobo Carlos con
  * el caso delante, y respetar el suelo del declarado seria reabrir esa
  * decision. Queda escrito aqui y fijado en un test para que sea una
  * eleccion consciente y no un descubrimiento dentro de seis meses.
- *
- * CONSECUENCIA QUE HAY QUE DECIR EN VOZ ALTA: `tolerancia_niveles`,
- * `tolerancia_extra_si_heuristica_menor` y
- * `modelo_consulta_discrepancia` SE PARSEAN Y SE VALIDAN, PERO HOY NO
- * TIENEN NINGUN CONSUMIDOR. No las lee nadie para decidir nada. Se
- * siguen validando para que el fichero no pueda degradarse sin que
- * salte nada, y estan en la interfaz `Heuristica` para que quien
- * implemente la consulta a un modelo (fuera del CLI) las tenga. Pero
- * no se finge que se aplican: hoy el comportamiento seria identico si
- * el fichero dijera `tolerancia_niveles: 99`. Este proyecto ya se
- * quemo con `codex-review`, una clave documentada e inexistente; la
- * respuesta a eso es decirlo, no disimularlo.
  * ------------------------------------------------------------------
  */
 import { readFileSync } from 'node:fs';
@@ -124,9 +118,6 @@ export interface Heuristica {
   agentes_brainstorm_alta: number;
   agentes_brainstorm_critica: number;
   agentes_brainstorm_hotfix: number;
-  tolerancia_niveles: number;
-  tolerancia_extra_si_heuristica_menor: number;
-  modelo_consulta_discrepancia: string;
 }
 
 /** Una senal encontrada al puntuar, para poder explicar el resultado. */
@@ -174,19 +165,21 @@ const CLAVES_NUMERICAS = [
   'agentes_brainstorm_alta',
   'agentes_brainstorm_critica',
   'agentes_brainstorm_hotfix',
-  'tolerancia_niveles',
-  'tolerancia_extra_si_heuristica_menor',
 ] as const;
 
 const CLAVE_PALABRAS = 'palabras_alto_riesgo';
-const CLAVE_MODELO = 'modelo_consulta_discrepancia';
 
 /** Las unicas claves admitidas. Cualquier otra aborta (regla 1). */
-export const CLAVES_HEURISTICA: readonly string[] = [
-  ...CLAVES_NUMERICAS,
-  CLAVE_PALABRAS,
-  CLAVE_MODELO,
-];
+export const CLAVES_HEURISTICA: readonly string[] = [...CLAVES_NUMERICAS, CLAVE_PALABRAS];
+
+/**
+ * Lo que se dice cuando el fichero no tiene las claves que este codigo
+ * espera: casi siempre es que el YML y el codigo son de versiones
+ * distintas del plugin (TASK-052 quito tres claves), no una errata.
+ */
+const AVISO_REINSTALAR =
+  '        Si no lo has editado a mano, el fichero y taskctl son de versiones distintas\n' +
+  '        del plugin: reinstala el plugin para que vuelvan a coincidir.';
 
 /** Nombre del fichero dentro de `scripts/`. */
 export const FICHERO_HEURISTICA = 'heuristica-complejidad.yml';
@@ -262,7 +255,6 @@ export function parsearHeuristica(contenido: string, ruta: string): Heuristica {
 
   const numeros = new Map<string, number>();
   let palabras: string[] | undefined;
-  let modelo: string | undefined;
   const vistas = new Set<string>();
 
   for (const par of pares) {
@@ -284,8 +276,6 @@ export function parsearHeuristica(contenido: string, ruta: string): Heuristica {
 
     if (par.clave === CLAVE_PALABRAS) {
       palabras = validarListaDeTexto(donde, par.clave, par.valor);
-    } else if (par.clave === CLAVE_MODELO) {
-      modelo = validarTextoNoVacio(donde, par.clave, par.valor);
     } else {
       numeros.set(par.clave, validarEnteroNoNegativo(donde, par.clave, par.valor));
     }
@@ -315,13 +305,6 @@ export function parsearHeuristica(contenido: string, ruta: string): Heuristica {
     agentes_brainstorm_alta: exigirNumero(numeros, 'agentes_brainstorm_alta', ruta),
     agentes_brainstorm_critica: exigirNumero(numeros, 'agentes_brainstorm_critica', ruta),
     agentes_brainstorm_hotfix: exigirNumero(numeros, 'agentes_brainstorm_hotfix', ruta),
-    tolerancia_niveles: exigirNumero(numeros, 'tolerancia_niveles', ruta),
-    tolerancia_extra_si_heuristica_menor: exigirNumero(
-      numeros,
-      'tolerancia_extra_si_heuristica_menor',
-      ruta
-    ),
-    modelo_consulta_discrepancia: exigirTexto(modelo, CLAVE_MODELO, ruta),
   };
 
   validarEscalaDeNiveles(h, ruta);
@@ -383,6 +366,7 @@ function mensajeClaveDesconocida(donde: string, clave: string): string {
   if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
   lineas.push('        Borrala o corrigela: taskctl no usa una heuristica que no entiende.');
   lineas.push(`        Claves validas: ${CLAVES_HEURISTICA.join(', ')}.`);
+  lineas.push(AVISO_REINSTALAR);
   return lineas.join('\n');
 }
 
@@ -390,8 +374,7 @@ function mensajeClaveDesconocida(donde: string, clave: string): string {
  * Entero >= 0. El cero SI es legitimo aqui, a diferencia de
  * `limite_wip` en config.ts: `agentes_brainstorm_trivial: 0` es la
  * decision central del fichero (no se paga un brainstorm para algo
- * trivial) y `tolerancia_extra_si_heuristica_menor: 0` es su valor por
- * defecto declarado. Lo que no puede ser es negativo: un peso negativo
+ * trivial). Lo que no puede ser es negativo: un peso negativo
  * restaria complejidad por tener una senal mas, que es lo contrario de
  * lo que el fichero dice hacer.
  */
@@ -449,16 +432,6 @@ function validarListaDeTexto(donde: string, clave: string, valor: unknown): stri
   return entradas;
 }
 
-function validarTextoNoVacio(donde: string, clave: string, valor: unknown): string {
-  if (typeof valor !== 'string' || valor.trim() === '') {
-    throw new HeuristicaError(
-      `[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.\n` +
-        '        Ponle el nombre de un modelo (p. ej. haiku) o corrige la linea.'
-    );
-  }
-  return valor.trim();
-}
-
 /** Como se nombra un valor rechazado en un mensaje de error. */
 function describirValor(valor: unknown): string {
   if (valor === null) return 'un valor vacio';
@@ -473,7 +446,8 @@ function mensajeClaveAusente(ruta: string, clave: string): string {
     '        Todas las claves de este fichero son obligatorias: no hay valores por\n' +
     '        defecto en el codigo a proposito, para que la heuristica sea siempre la\n' +
     `        que pone el fichero. Anade la linea "${clave}: <valor>" o restaura el\n` +
-    '        fichero que trae el plugin.'
+    '        fichero que trae el plugin.\n' +
+    AVISO_REINSTALAR
   );
 }
 
@@ -488,10 +462,6 @@ function exigirLista(valor: string[] | undefined, clave: string, ruta: string):
   return valor;
 }
 
-function exigirTexto(valor: string | undefined, clave: string, ruta: string): string {
-  if (valor === undefined) throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
-  return valor;
-}
 
 /**
  * Puntua una tarea sumando las senales de la seccion 1 del YML. No hay
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
new file mode 100644
index 0000000..cd33831
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -0,0 +1,287 @@
+/**
+ * Telemetria de fases (TASK-052): cuanto duro cada fase de una tarea,
+ * cuantas rondas de revision necesito y, con `--heuristica`, que nivel le
+ * habria dado la heuristica de complejidad vigente.
+ *
+ * Puro: recibe lo ya leido (la tarea, su cuerpo, los nombres de
+ * `revision/`, los eventos de git) y devuelve filas y texto. La E/S vive en
+ * `commands/metricas.ts`.
+ *
+ * DE DONDE SALE CADA MARCA, por orden:
+ *  1. `registro`: la tabla `## Transiciones` del propio tarea.md. Desde
+ *     TASK-052 cada fila lleva el instante (precision de segundo); las
+ *     anteriores solo el dia (precision de dia).
+ *  2. `git`: si la tarea no tiene ni una fila, las fechas de autor de los
+ *     commits automaticos `chore(TASK-NNN): ...` que deja cada comando.
+ *  3. `—`: ni lo uno ni lo otro. Nunca se inventa un 0.
+ * El origen es por tarea, no por marca: mezclar dos fuentes en una misma
+ * fila daria duraciones entre relojes distintos sin que nadie lo vea.
+ *
+ * QUE MIDE CADA COLUMNA (calendario, no trabajo):
+ *  - diseno: del PRIMER `plan` al primer `start`. El primero y no el
+ *    ultimo: un plan repetido es parte del diseno, no lo reinicia.
+ *  - curso: del primer `start` al primer `review`.
+ *  - revision: del primer `review` al ultimo `finish`.
+ * `pausa` no se descuenta: no existe una transicion de «reanudar», asi que
+ * no hay con que cerrar el hueco. La salida lo dice.
+ *
+ * Si alguna de las dos marcas es de dia, la duracion va en dias enteros: con
+ * medianoche implicita, restar horas daria numeros que parecen precisos y
+ * no lo son (o negativos).
+ */
+import { leerTransiciones, instanteDe, precisionDeFecha, type PrecisionFecha } from './transiciones.js';
+import type { Task, TaskComplexity, TaskState } from './task.js';
+
+export type OrigenMetricas = 'registro' | 'git' | '—';
+
+/** Fases que se miden. `pausa` solo se cuenta. */
+export type FaseMedida = 'plan' | 'approve' | 'start' | 'review' | 'finish' | 'pausa';
+
+export interface Marca {
+  ms: number;
+  precision: PrecisionFecha;
+}
+
+/** Un commit automatico reconocido: fase y fecha de autor (ms UTC). */
+export interface EventoGit {
+  id: string;
+  fase: FaseMedida;
+  ms: number;
+}
+
+export interface Duracion {
+  /** Milisegundos (precision de segundo) o dias enteros (precision de dia). */
+  valor: number;
+  precision: PrecisionFecha;
+}
+
+export interface HeuristicaFila {
+  puntos: number;
+  nivel: TaskComplexity;
+}
+
+export interface FilaMetricas {
+  id: string;
+  estado: TaskState;
+  complejidad: TaskComplexity | null;
+  diseno: Duracion | null;
+  curso: Duracion | null;
+  revision: Duracion | null;
+  /** Numero de la ultima ronda de revision; null sin carpeta `revision/` o sin informes. */
+  rondas: number | null;
+  /** Dia del cierre (`YYYY-MM-DD`), o null. */
+  cierre: string | null;
+  pausas: number;
+  origen: OrigenMetricas;
+  /** Solo con `--heuristica`. */
+  heuristica?: HeuristicaFila;
+}
+
+export interface EntradaMetricas {
+  task: Task;
+  body: string;
+  /** Ronda de revision ya calculada (`nombresDeUltimaRonda`); 0 = sin informes. */
+  ronda: number;
+  /** Eventos de git de ESTA tarea (vacio si no se consulto o no hay). */
+  eventosGit: readonly EventoGit[];
+}
+
+/**
+ * Asuntos de los commits automaticos que marcan cada fase (ver
+ * `mensajeChore` en cada comando). Si un comando cambia su asunto, esto
+ * deja de reconocer sus commits: hay un test que recorre el ciclo real.
+ */
+const ASUNTO_CHORE_RE =
+  /^chore\((TASK-\d{3,})\): (tarea en diseno|plan aprobado|tarea en curso|peticion de revision ronda \d+|tarea terminada y artefactos de cierre|pausa registrada)$/;
+
+function faseDeAsunto(resumen: string): FaseMedida {
+  if (resumen === 'tarea en diseno') return 'plan';
+  if (resumen === 'plan aprobado') return 'approve';
+  if (resumen === 'tarea en curso') return 'start';
+  if (resumen === 'pausa registrada') return 'pausa';
+  if (resumen.startsWith('peticion de revision')) return 'review';
+  return 'finish';
+}
+
+/**
+ * Parsea la salida de `git log --format=%at%x09%s`: una linea por commit,
+ * segundos de la fecha de autor, tabulador, asunto. Lo que no casa se
+ * ignora (cualquier otro commit del repo).
+ */
+export function parsearLogGit(salida: string): EventoGit[] {
+  const eventos: EventoGit[] = [];
+  for (const linea of salida.split(/\r?\n/)) {
+    const tab = linea.indexOf('\t');
+    if (tab === -1) continue;
+    const segundos = Number(linea.slice(0, tab));
+    if (!Number.isInteger(segundos)) continue;
+    const m = ASUNTO_CHORE_RE.exec(linea.slice(tab + 1).trim());
+    if (m === null) continue;
+    eventos.push({ id: m[1] as string, fase: faseDeAsunto(m[2] as string), ms: segundos * 1000 });
+  }
+  return eventos;
+}
+
+interface Marcas {
+  plan: Marca | null;
+  start: Marca | null;
+  review: Marca | null;
+  finish: Marca | null;
+  pausas: number;
+}
+
+function marcasDe(eventos: readonly { fase: FaseMedida; marca: Marca }[]): Marcas {
+  // Orden cronologico: el registro ya lo esta, git log va al reves.
+  const orden = [...eventos].sort((a, b) => a.marca.ms - b.marca.ms);
+  const primera = (fase: FaseMedida): Marca | null => orden.find((e) => e.fase === fase)?.marca ?? null;
+  const finishes = orden.filter((e) => e.fase === 'finish');
+  return {
+    plan: primera('plan'),
+    start: primera('start'),
+    review: primera('review'),
+    finish: finishes.length === 0 ? null : (finishes[finishes.length - 1] as { marca: Marca }).marca,
+    pausas: orden.filter((e) => e.fase === 'pausa').length,
+  };
+}
+
+/** Duracion entre dos marcas; null si falta una o la de fin es anterior. */
+export function duracionEntre(desde: Marca | null, hasta: Marca | null): Duracion | null {
+  if (desde === null || hasta === null) return null;
+  if (desde.precision === 'dia' || hasta.precision === 'dia') {
+    const dia = (ms: number): number => Math.floor(ms / 86_400_000);
+    const dias = dia(hasta.ms) - dia(desde.ms);
+    return dias < 0 ? null : { valor: dias, precision: 'dia' };
+  }
+  const ms = hasta.ms - desde.ms;
+  return ms < 0 ? null : { valor: ms, precision: 'segundo' };
+}
+
+/** Una fila por tarea, sin la parte de heuristica. */
+export function calcularFila(e: EntradaMetricas): FilaMetricas {
+  const registro = leerTransiciones(e.body).map((f) => ({
+    fase: f.fase as FaseMedida,
+    marca: { ms: instanteDe(f.fecha), precision: precisionDeFecha(f.fecha) as PrecisionFecha },
+  }));
+  let origen: OrigenMetricas;
+  let marcas: Marcas;
+  if (registro.length > 0) {
+    origen = 'registro';
+    marcas = marcasDe(registro);
+  } else if (e.eventosGit.length > 0) {
+    origen = 'git';
+    marcas = marcasDe(
+      e.eventosGit.map((g) => ({ fase: g.fase, marca: { ms: g.ms, precision: 'segundo' as const } }))
+    );
+  } else {
+    origen = '—';
+    marcas = { plan: null, start: null, review: null, finish: null, pausas: 0 };
+  }
+  return {
+    id: e.task.id,
+    estado: e.task.estado,
+    complejidad: e.task.complejidad,
+    diseno: duracionEntre(marcas.plan, marcas.start),
+    curso: duracionEntre(marcas.start, marcas.review),
+    revision: duracionEntre(marcas.review, marcas.finish),
+    rondas: e.ronda > 0 ? e.ronda : null,
+    cierre: marcas.finish === null ? null : new Date(marcas.finish.ms).toISOString().slice(0, 10),
+    pausas: marcas.pausas,
+    origen,
+  };
+}
+
+/** `—` para lo que no hay; dias como `N d`; segundos como `1d 03h`, `2h 05m`, `7m`, `40s`. */
+export function formatearDuracion(d: Duracion | null): string {
+  if (d === null) return '—';
+  if (d.precision === 'dia') return `${String(d.valor)} d`;
+  const s = Math.floor(d.valor / 1000);
+  const dd = Math.floor(s / 86_400);
+  const hh = Math.floor((s % 86_400) / 3600);
+  const mm = Math.floor((s % 3600) / 60);
+  const dos = (n: number): string => String(n).padStart(2, '0');
+  if (dd > 0) return `${String(dd)}d ${dos(hh)}h`;
+  if (hh > 0) return `${String(hh)}h ${dos(mm)}m`;
+  if (mm > 0) return `${String(mm)}m`;
+  return `${String(s % 60)}s`;
+}
+
+/**
+ * Columnas de la tabla, en orden. Una lista y no un formato cableado: las
+ * columnas de coste (tokens) se anaden aqui sin tocar el resto.
+ */
+export interface ColumnaMetricas {
+  cabecera: string;
+  valor: (f: FilaMetricas) => string;
+}
+
+export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
+  { cabecera: 'id', valor: (f) => f.id },
+  { cabecera: 'complejidad', valor: (f) => f.complejidad ?? '—' },
+  { cabecera: 'diseno', valor: (f) => formatearDuracion(f.diseno) },
+  { cabecera: 'curso', valor: (f) => formatearDuracion(f.curso) },
+  { cabecera: 'revision', valor: (f) => formatearDuracion(f.revision) },
+  { cabecera: 'rondas', valor: (f) => (f.rondas === null ? '—' : String(f.rondas)) },
+  { cabecera: 'cierre', valor: (f) => f.cierre ?? '—' },
+  { cabecera: 'origen', valor: (f) => f.origen },
+];
+
+/** Las que anade `--heuristica`. */
+export const COLUMNAS_HEURISTICA: readonly ColumnaMetricas[] = [
+  { cabecera: 'puntos', valor: (f) => (f.heuristica === undefined ? '—' : String(f.heuristica.puntos)) },
+  { cabecera: 'nivel_heuristico', valor: (f) => f.heuristica?.nivel ?? '—' },
+];
+
+/** Tabla de texto alineada (Markdown valido). */
+export function formatearTabla(filas: readonly FilaMetricas[], columnas: readonly ColumnaMetricas[]): string {
+  const celdas = filas.map((f) => columnas.map((c) => c.valor(f)));
+  const anchos = columnas.map((c, i) => Math.max(c.cabecera.length, ...celdas.map((fila) => (fila[i] as string).length)));
+  const linea = (valores: readonly string[]): string =>
+    `| ${valores.map((v, i) => v.padEnd(anchos[i] as number)).join(' | ')} |`;
+  return [
+    linea(columnas.map((c) => c.cabecera)),
+    `|${anchos.map((a) => '-'.repeat(a + 2)).join('|')}|`,
+    ...celdas.map(linea),
+  ].join('\n');
+}
+
+/**
+ * Regla de coste de la recalibracion: una tarea entra en la muestra si esta
+ * terminada y tiene al menos un informe de revision. Sin `revision/` no es
+ * «0 rondas»: es que no se midio (las tareas anteriores a `review`).
+ */
+export function enMuestraHeuristica(f: FilaMetricas): boolean {
+  return f.estado === 'terminada' && f.rondas !== null;
+}
+
+export interface GrupoResumen {
+  nivel: TaskComplexity | '—';
+  n: number;
+  rondasMedia: number;
+}
+
+/** n y rondas medias agrupando por un nivel (declarado o heuristico), en el orden del enum. */
+export function resumirPorNivel(
+  filas: readonly FilaMetricas[],
+  nivelDe: (f: FilaMetricas) => TaskComplexity | null,
+  orden: readonly TaskComplexity[]
+): GrupoResumen[] {
+  const grupos = new Map<TaskComplexity | '—', number[]>();
+  for (const f of filas) {
+    const nivel = nivelDe(f) ?? '—';
+    const lista = grupos.get(nivel) ?? [];
+    lista.push(f.rondas ?? 0);
+    grupos.set(nivel, lista);
+  }
+  const claves: (TaskComplexity | '—')[] = [...orden, '—'];
+  return claves
+    .filter((k) => grupos.has(k))
+    .map((k) => {
+      const r = grupos.get(k) as number[];
+      return { nivel: k, n: r.length, rondasMedia: r.reduce((a, b) => a + b, 0) / r.length };
+    });
+}
+
+export function formatearResumen(titulo: string, grupos: readonly GrupoResumen[]): string {
+  const filas = grupos.map((g) => `  ${g.nivel.padEnd(8)} n=${String(g.n).padStart(3)}  rondas medias=${g.rondasMedia.toFixed(2)}`);
+  return [titulo, ...filas].join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index d75ecf1..063dff2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -4,7 +4,17 @@
  *
  * | fecha | fase | modo | decidido_por |
  * |---|---|---|---|
- * | 2026-10-04 | plan | automatico | persona |
+ * | 2026-10-04T14:03:22Z | plan | automatico | persona |
+ *
+ * TASK-052: la celda `fecha` lleva el instante UTC con segundos
+ * (`toISOString` sin milisegundos), que es lo que mide `taskctl metricas`.
+ * Las filas anteriores, solo con el dia (`2026-10-04`), se siguen leyendo:
+ * cada fila expone su precision y nadie las reescribe. Una quinta columna
+ * `hora` se descarto porque rompia la lectura de todas las filas viejas
+ * (`celdas.length !== 4`); cambiar el contenido de la celda solo afecta a
+ * las nuevas. Lo que se pierde: un plugin ANTERIOR no reconoce las filas
+ * con hora (su regex es el del dia) y dejaria de ver el modo congelado;
+ * se acepta con una version del plugin por repo.
  *
  * Es el historico de quien decidio cada paso y en que modo, y viaja en el
  * mismo commit que la transicion (lo escribe el comando antes de su
@@ -31,12 +41,44 @@ export type DecididoPor = 'persona' | 'automatico';
 export const DECIDIDO_POR: readonly DecididoPor[] = ['persona', 'automatico'];
 
 export interface FilaTransicion {
+  /** `YYYY-MM-DD` (filas anteriores a TASK-052) o `YYYY-MM-DDTHH:MM:SSZ`. */
   fecha: string;
   fase: FaseRegistrada;
   modo: ModoFlujo;
   decidido_por: DecididoPor;
 }
 
+/** Precision de la celda `fecha`: solo el dia, o el instante al segundo. */
+export type PrecisionFecha = 'dia' | 'segundo';
+
+const FECHA_DIA_RE = /^\d{4}-\d{2}-\d{2}$/;
+const FECHA_INSTANTE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
+
+/**
+ * Precision de una celda `fecha`, o null si no es ninguna de las dos formas
+ * (fila editada a mano: se ignora, como cualquier otra celda invalida).
+ * Valida ademas que la fecha exista: `2026-02-30` no es un dia.
+ */
+export function precisionDeFecha(fecha: string): PrecisionFecha | null {
+  const precision = FECHA_DIA_RE.test(fecha) ? 'dia' : FECHA_INSTANTE_RE.test(fecha) ? 'segundo' : null;
+  if (precision === null) return null;
+  const ms = Date.parse(precision === 'dia' ? `${fecha}T00:00:00Z` : fecha);
+  if (Number.isNaN(ms)) return null;
+  // Date.parse normaliza el 30 de febrero al 2 de marzo: se exige la vuelta.
+  if (new Date(ms).toISOString().slice(0, 10) !== fecha.slice(0, 10)) return null;
+  return precision;
+}
+
+/** El instante de una fila en milisegundos UTC (a medianoche si es de dia). */
+export function instanteDe(fecha: string): number {
+  return Date.parse(FECHA_DIA_RE.test(fecha) ? `${fecha}T00:00:00Z` : fecha);
+}
+
+/** El instante actual con el formato de la celda: UTC, al segundo. */
+export function formatearInstante(d: Date): string {
+  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
+}
+
 const FASES: readonly FaseRegistrada[] = ['plan', 'approve', 'start', 'review', 'finish', 'pausa'];
 const CABECERA = '| fecha | fase | modo | decidido_por |';
 const SEPARADOR = '|---|---|---|---|';
@@ -162,7 +204,10 @@ export function leerTransiciones(body: string): FilaTransicion[] {
       .map((c) => c.trim());
     if (celdas.length !== 4) continue;
     const [fecha, fase, modo, decidido] = celdas as [string, string, string, string];
-    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) continue;
+    // TASK-052: dia (filas viejas) o instante (nuevas). El regex del dia a
+    // secas haria invisibles las filas nuevas y apagaria en silencio el
+    // modo congelado (riesgo del plan): hay un test que lo fija.
+    if (precisionDeFecha(fecha) === null) continue;
     if (!(FASES as readonly string[]).includes(fase)) continue;
     if (!(MODOS_FLUJO as readonly string[]).includes(modo)) continue;
     if (!(DECIDIDO_POR as readonly string[]).includes(decidido)) continue;
@@ -194,6 +239,8 @@ export function modoDeTarea(body: string, modoConfig: ModoFlujo): ModoFlujo {
 /**
  * La fila que deja cada comando al cambiar de fase. En `plan` el modo es el
  * del config, y con eso queda congelado; en el resto, el congelado.
+ * `fecha` es el instante (`formatearInstante`) desde TASK-052; un dia a
+ * secas se sigue aceptando para quien no tenga reloj que pasar.
  */
 export function registrarTransicion(
   body: string,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
new file mode 100644
index 0000000..4f7204f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
@@ -0,0 +1,146 @@
+/**
+ * taskctl metricas (TASK-052) por CLI, contra repos Git temporales reales:
+ * el ciclo plan -> approve -> start -> review -> finish deja cada transicion
+ * con su instante, metricas la mide desde el registro y, sin registro, desde
+ * los commits automaticos (un cambio de asunto en un comando lo pone rojo).
+ * Solo lectura: el arbol queda limpio.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, writeFile, mkdtemp, mkdir, rm, cp } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { leerTransiciones, precisionDeFecha } from '../../src/core/transiciones.js';
+import {
+  ID,
+  CONFIG_AUTO,
+  git,
+  cli,
+  cliOk,
+  withRepo,
+  dirRevision,
+  hastaCodigo,
+  rellenarInforme,
+} from '../helpers/automatico-fixtures.js';
+
+/** La fila de TASK-001 de la tabla, celda a celda. */
+function filaDe(salida: string, id = ID): string[] {
+  const linea = salida.split('\n').find((l) => l.startsWith(`| ${id} `));
+  assert.ok(linea, `no hay fila de ${id} en:\n${salida}`);
+  return linea
+    .slice(1, -1)
+    .split('|')
+    .map((c) => c.trim());
+}
+
+function cabecera(salida: string): string[] {
+  const linea = salida.split('\n').find((l) => l.startsWith('| id '));
+  assert.ok(linea, salida);
+  return linea
+    .slice(1, -1)
+    .split('|')
+    .map((c) => c.trim());
+}
+
+const DURACION_SEGUNDOS = /^(\d+s|\d+m|\d+h \d{2}m|\d+d \d{2}h)$/;
+
+async function cicloCompleto(repoRoot: string, tareasRoot: string): Promise<void> {
+  await hastaCodigo(repoRoot, tareasRoot);
+  cliOk(repoRoot, ['review', ID]);
+  await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot), 'informe-revision-1.md'));
+  cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
+  cliOk(repoRoot, ['finish', ID]);
+}
+
+test('ciclo completo por CLI: cada transicion con instante y metricas lo mide desde el registro', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await cicloCompleto(repoRoot, tareasRoot);
+
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.ok(t);
+    const filas = leerTransiciones(t.body);
+    assert.deepEqual(filas.map((f) => f.fase), ['plan', 'approve', 'start', 'review', 'finish']);
+    for (const f of filas) {
+      assert.equal(precisionDeFecha(f.fecha), 'segundo', `la fila ${f.fase} no lleva instante: ${f.fecha}`);
+    }
+    // `actualizado` sigue siendo un dia, y es el de la ultima fila.
+    assert.equal(t.task.actualizado, (filas[4] as { fecha: string }).fecha.slice(0, 10));
+
+    const r = cliOk(repoRoot, ['metricas']);
+    assert.deepEqual(cabecera(r.stdout), ['id', 'complejidad', 'diseno', 'curso', 'revision', 'rondas', 'cierre', 'origen']);
+    const [id, complejidad, diseno, curso, revision, rondas, cierre, origen] = filaDe(r.stdout);
+    assert.equal(id, ID);
+    assert.equal(complejidad, 'simple');
+    for (const d of [diseno, curso, revision]) assert.match(d as string, DURACION_SEGUNDOS);
+    assert.equal(rondas, '1');
+    assert.equal(cierre, (filas[4] as { fecha: string }).fecha.slice(0, 10));
+    assert.equal(origen, 'registro');
+    assert.match(r.stdout, /Las pausas no se descuentan/);
+    assert.doesNotMatch(r.stdout, /NaN|undefined/);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'metricas no escribe nada');
+
+    // --heuristica: la tarea terminada con informe entra en la muestra.
+    const h = cliOk(repoRoot, ['metricas', '--heuristica']);
+    assert.deepEqual(cabecera(h.stdout).slice(-2), ['puntos', 'nivel_heuristico']);
+    const fila = filaDe(h.stdout);
+    assert.match(fila[8] as string, /^\d+$/);
+    assert.match(fila[9] as string, /^(trivial|simple|media|alta|critica)$/);
+    assert.match(h.stdout, /Muestra: 1 tareas terminadas/);
+    assert.match(h.stdout, /Por complejidad declarada:\n {2}simple +n= {2}1 +rondas medias=1\.00/);
+
+    // Sin la seccion de Transiciones (tarea anterior al registro): se mide
+    // con los commits chore() reales que dejo cada comando. Si un comando
+    // cambia el asunto de su commit, esto deja de reconocerlo.
+    const sinRegistro = (await readFile(t.filePath, 'utf8')).replace(/\n## Transiciones[\s\S]*$/, '\n');
+    await writeFile(t.filePath, sinRegistro, 'utf8');
+    const g = cliOk(repoRoot, ['metricas']);
+    const filaGit = filaDe(g.stdout);
+    assert.equal(filaGit[7], 'git');
+    for (const d of filaGit.slice(2, 5)) assert.match(d, DURACION_SEGUNDOS);
+    assert.equal(filaGit[6], cierre);
+  });
+});
+
+test('metricas: un flag desconocido aborta sin sacar tabla, y --heuristica no lleva valor', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot) => {
+    const r = cli(repoRoot, ['metricas', '--heuristic']);
+    assert.equal(r.status, 1);
+    assert.match(r.stderr, /taskctl metricas: flag desconocido "--heuristic"/);
+    assert.match(r.stderr, /Quiza quisiste decir "--heuristica"/);
+    assert.equal(r.stdout, '');
+
+    const v = cli(repoRoot, ['metricas', '--heuristica=si']);
+    assert.equal(v.status, 1);
+    assert.match(v.stderr, /"--heuristica" no lleva valor/);
+
+    const p = cli(repoRoot, ['metricas', 'TASK-001']);
+    assert.equal(p.status, 1);
+    assert.match(p.stderr, /no admite argumentos sueltos/);
+
+    const vacio = cliOk(repoRoot, ['metricas']);
+    assert.match(vacio.stdout, /No hay tareas que medir/);
+  });
+});
+
+test('metricas fuera de un repo Git: las tareas sin registro salen con "—" y un aviso, sin fallar', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await cicloCompleto(repoRoot, tareasRoot);
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.ok(t);
+    // Copia solo tareas/ a un directorio sin .git.
+    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-metricas-nogit-'));
+    try {
+      await mkdir(path.join(fuera, 'tareas'), { recursive: true });
+      await cp(tareasRoot, path.join(fuera, 'tareas'), { recursive: true });
+      const copia = path.join(fuera, path.relative(repoRoot, t.filePath));
+      const sinRegistro = (await readFile(copia, 'utf8')).replace(/\n## Transiciones[\s\S]*$/, '\n');
+      await writeFile(copia, sinRegistro, 'utf8');
+      const r = cliOk(fuera, ['metricas']);
+      assert.match(r.stderr, /\[AVISO\] No se pudo consultar git log/);
+      assert.deepEqual(filaDe(r.stdout).slice(2), ['—', '—', '—', '1', '—', '—']);
+    } finally {
+      await rm(fuera, { recursive: true, force: true });
+    }
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
index 954de2f..13e5083 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -289,9 +289,9 @@ test('plan: una tarea "trivial" con dependencias sube a 1 rol por el max (efecto
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await writeTareaFile(
       tareasRoot,
-      // Dos dependencias = 2 puntos, que es justo lo que saca a la
-      // tarea de `trivial` (nivel_trivial_hasta: 1). Es la puntuacion
-      // real de TASK-005, la unica tarea declarada trivial del repo.
+      // Dos dependencias = 2 puntos, que la sacan de `trivial` (desde
+      // TASK-052 basta 1: nivel_trivial_hasta: 0). Es la puntuacion
+      // real de TASK-005, la primera tarea declarada trivial del repo.
       sampleTask({ complejidad: 'trivial', dependencias: ['TASK-798', 'TASK-799'] }),
       BODY
     );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica-complejidad.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica-complejidad.test.ts
index 47f821f..7ad5127 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica-complejidad.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica-complejidad.test.ts
@@ -133,7 +133,8 @@ const ESPERADO: Record<string, unknown> = {
   // 6-7 alta, 8+ critica. El cuarto nivel se llama `alta` y no
   // `compleja` porque `alta` es lo que acepta el enum del plugin;
   // divergencia con la 16.1 documentada en el propio fichero.
-  nivel_trivial_hasta: 1,
+  // TASK-052: 1 -> 0, calibrado con rondas reales (ver el comentario del YML).
+  nivel_trivial_hasta: 0,
   nivel_simple_hasta: 3,
   nivel_media_hasta: 5,
   nivel_alta_hasta: 7,
@@ -164,10 +165,8 @@ const ESPERADO: Record<string, unknown> = {
   // Excepcion por tipo, no por nivel: un hotfix se planifica con un
   // solo agente y sin brainstorm multi-agente.
   agentes_brainstorm_hotfix: 1,
-  // Tolerancia y asimetria.
-  tolerancia_niveles: 1,
-  tolerancia_extra_si_heuristica_menor: 0,
-  modelo_consulta_discrepancia: 'haiku',
+  // TASK-052: tolerancia_niveles, tolerancia_extra_si_heuristica_menor y
+  // modelo_consulta_discrepancia salieron (nada las leia).
 };
 
 test('el fichero se parsea entero con el parser del plugin y dice exactamente lo esperado', () => {
@@ -285,10 +284,6 @@ test('todos los pesos y umbrales son enteros, no textos entrecomillados', () =>
   const { data } = parsear();
   for (const clave of Object.keys(ESPERADO)) {
     if (clave === 'palabras_alto_riesgo') continue;
-    if (clave === 'modelo_consulta_discrepancia') {
-      assert.equal(typeof data[clave], 'string', `"${clave}" deberia ser texto`);
-      continue;
-    }
     const valor = data[clave];
     assert.equal(typeof valor, 'number', `"${clave}" deberia ser un numero, y es ${typeof valor}`);
     assert.equal(Number.isInteger(valor), true, `"${clave}" deberia ser entero`);
@@ -312,8 +307,9 @@ test('el mapeo a niveles es una escala coherente y sin huecos', () => {
   // Sin hueco entre el ultimo nivel cerrado y el abierto: una
   // puntuacion de alta+1 tiene que caer en critica y en nada mas.
   assert.equal(critica, alta + 1, 'entre alta y critica no puede quedar ninguna puntuacion huerfana');
-  // La escala de la 16.1, literal.
-  assert.deepEqual([trivial, simple, media, alta, critica], [1, 3, 5, 7, 8]);
+  // La escala de la 16.1 salvo el primer corte, que TASK-052 bajo de 1 a 0
+  // con la muestra de rondas reales (divergencia documentada en el YML).
+  assert.deepEqual([trivial, simple, media, alta, critica], [0, 3, 5, 7, 8]);
 });
 
 test('la tabla de agentes de brainstorm es monotona y respeta los extremos de la decision #2', () => {
@@ -448,28 +444,15 @@ test('la regla de conteo de palabras de riesgo esta escrita y cuadra con la list
   assert.equal(Number(total), lista.length * peso, 'la cota escrita no es entradas x peso');
 });
 
-test('la tolerancia acepta la coincidencia y un nivel de distancia, y la asimetria queda declarada', () => {
+// TASK-052: revierte la decision de TASK-032 (seccion 5 del fichero): la
+// tolerancia y el modelo de consulta se validaban sin que nada los leyera. El
+// deepEqual del primer test ya prohibe que vuelvan; este lo dice por su nombre.
+test('el fichero ya no declara la consulta a un modelo: ni tolerancia_* ni modelo_consulta_discrepancia', () => {
   const { data } = parsear();
-  assert.equal(data['tolerancia_niveles'], 1, 'se acepta hasta un nivel de distancia sin gastar modelo');
-  // La direccion que importa (heuristica por encima de lo declarado)
-  // ya la fija el nombre de esta clave: no hay una clave aparte para
-  // declararla porque solo podria valer una cosa.
-  assert.equal(data['tolerancia_extra_si_heuristica_menor'], 0);
-  // Se asevera el PREFIJO, no un nombre concreto. `direccion_de_riesgo`
-  // no ha existido nunca y el deepEqual del primer test ya prohibe
-  // cualquier clave no listada: aquel `undefined` no podia fallar sin
-  // que fallasen antes otros dos tests (ronda 3, menor 8). Lo que se
-  // quiere decir es que una direccion con un solo valor posible no se
-  // declara en ninguna clave, se escribe en el comentario de la de
-  // arriba; y eso si es aseverable.
-  const clavesDeDireccion = Object.keys(data).filter((c) => c.startsWith('direccion_'));
-  assert.deepEqual(
-    clavesDeDireccion,
-    [],
-    `"${clavesDeDireccion.join(', ')}": una direccion con un solo valor posible va en comentario, no en una clave`
+  const retiradas = Object.keys(data).filter(
+    (c) => c.startsWith('tolerancia_') || c.startsWith('modelo_') || c.startsWith('direccion_')
   );
-  assert.equal(typeof data['modelo_consulta_discrepancia'], 'string');
-  assert.notEqual((data['modelo_consulta_discrepancia'] as string).trim(), '');
+  assert.deepEqual(retiradas, [], `claves sin consumidor: ${retiradas.join(', ')}`);
 });
 
 test('las palabras de alto riesgo son genericas, sin vocabulario de ningun proyecto', () => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
index f4966c3..37b7675 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
@@ -249,7 +249,6 @@ test('el fichero real da valores concretos y ya tipados', () => {
   // como texto es lo que este test anade sobre los del propio YML.
   assert.equal(H.agentes_brainstorm_trivial, 0);
   assert.equal(H.agentes_brainstorm_critica, 4);
-  assert.equal(H.modelo_consulta_discrepancia, 'haiku');
   assert.ok(Array.isArray(H.palabras_alto_riesgo));
   assert.ok(H.palabras_alto_riesgo.includes('migracion'));
   assert.equal(
@@ -673,10 +672,34 @@ test('una clave obligatoria ausente aborta nombrandola', () => {
     () => parsearHeuristica(sinLineaDe('palabras_alto_riesgo'), RUTA_YML),
     errorAccionable(/falta la clave obligatoria "palabras_alto_riesgo"/)
   );
+  // TASK-052: la clave ausente suele ser un YML de otra version del plugin.
   assert.throws(
-    () => parsearHeuristica(sinLineaDe('modelo_consulta_discrepancia'), RUTA_YML),
-    errorAccionable(/falta la clave obligatoria "modelo_consulta_discrepancia"/)
-  );
+    () => parsearHeuristica(sinLineaDe('peso_dependencia'), RUTA_YML),
+    errorAccionable(/reinstala el plugin/)
+  );
+});
+
+// TASK-052: las tres claves de la consulta a un modelo no las leia nadie y
+// salieron del fichero y del codigo en el mismo commit. Un YML de una version
+// anterior que aun las traiga aborta diciendo que se reinstale el plugin.
+// Revierte la decision de TASK-032 de validarlas sin consumidor.
+test('las claves retiradas (tolerancia_*, modelo_consulta_discrepancia) abortan pidiendo reinstalar', () => {
+  for (const linea of [
+    'tolerancia_niveles: 1',
+    'tolerancia_extra_si_heuristica_menor: 0',
+    'modelo_consulta_discrepancia: haiku',
+  ]) {
+    const clave = linea.slice(0, linea.indexOf(':'));
+    assert.throws(
+      () => parsearHeuristica(conLineaExtra(linea), RUTA_YML),
+      errorAccionable(new RegExp(`clave desconocida "${clave}"[\\s\\S]*reinstala el plugin`))
+    );
+  }
+  for (const clave of ['tolerancia_niveles', 'tolerancia_extra_si_heuristica_menor', 'modelo_consulta_discrepancia']) {
+    assert.equal(CLAVES_HEURISTICA.includes(clave), false, `"${clave}" sigue entre las claves validas`);
+    assert.equal(clave in H, false, `"${clave}" sigue en el objeto Heuristica`);
+  }
+  assert.equal(CLAVES_HEURISTICA.length, 19);
 });
 
 test('un valor no numerico donde se espera un numero aborta', () => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
new file mode 100644
index 0000000..84adf1b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
@@ -0,0 +1,249 @@
+/**
+ * Telemetria de fases (TASK-052): el calculo puro de `taskctl metricas`.
+ * Duraciones con origen registro, git y ausente; precision de dia; plan
+ * repetido; varias rondas; pausa; y que nunca salga ni 0 inventado ni NaN.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  COLUMNAS_HEURISTICA,
+  COLUMNAS_METRICAS,
+  calcularFila,
+  duracionEntre,
+  enMuestraHeuristica,
+  formatearDuracion,
+  formatearTabla,
+  parsearLogGit,
+  resumirPorNivel,
+  type EntradaMetricas,
+  type EventoGit,
+  type FilaMetricas,
+} from '../../src/core/metricas.js';
+import { TASK_COMPLEXITIES, type Task } from '../../src/core/task.js';
+
+function tarea(o: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-007',
+    titulo: 'Medir',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'terminada',
+    plan_aprobado: true,
+    rama: null,
+    asignado_a: null,
+    agente_revisor: null,
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-10-01',
+    actualizado: '2026-10-05',
+    dependencias: [],
+    ...o,
+  } as Task;
+}
+
+function cuerpoCon(filas: readonly [string, string][]): string {
+  return (
+    '## Objetivo\n\nAlgo.\n\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
+    filas.map(([fecha, fase]) => `| ${fecha} | ${fase} | manual | persona |`).join('\n') +
+    '\n'
+  );
+}
+
+function entrada(o: Partial<EntradaMetricas> = {}): EntradaMetricas {
+  return { task: tarea(), body: '## Objetivo\n\nAlgo.\n', ronda: 0, eventosGit: [], ...o };
+}
+
+const CICLO_CON_HORA: [string, string][] = [
+  ['2026-10-05T10:00:00Z', 'plan'],
+  ['2026-10-05T10:30:00Z', 'approve'],
+  ['2026-10-05T10:45:00Z', 'start'],
+  ['2026-10-05T12:50:00Z', 'review'],
+  ['2026-10-06T13:00:00Z', 'finish'],
+];
+
+test('registro con hora: diseno plan->start, curso start->review, revision review->finish', () => {
+  const f = calcularFila(entrada({ body: cuerpoCon(CICLO_CON_HORA), ronda: 2 }));
+  assert.equal(f.origen, 'registro');
+  assert.deepEqual(f.diseno, { valor: 45 * 60_000, precision: 'segundo' });
+  assert.deepEqual(f.curso, { valor: 125 * 60_000, precision: 'segundo' });
+  assert.deepEqual(f.revision, { valor: (24 * 60 + 10) * 60_000, precision: 'segundo' });
+  assert.equal(f.rondas, 2);
+  assert.equal(f.cierre, '2026-10-06');
+  const fila = COLUMNAS_METRICAS.map((c) => c.valor(f));
+  assert.deepEqual(fila, ['TASK-007', 'simple', '45m', '2h 05m', '1d 00h', '2', '2026-10-06', 'registro']);
+});
+
+test('precision de dia: filas viejas dan dias enteros, y una sola marca de dia basta para pasar a dias', () => {
+  const viejas = calcularFila(
+    entrada({
+      body: cuerpoCon([
+        ['2026-10-01', 'plan'],
+        ['2026-10-03', 'start'],
+        ['2026-10-03', 'review'],
+        ['2026-10-04', 'finish'],
+      ]),
+    })
+  );
+  assert.equal(formatearDuracion(viejas.diseno), '2 d');
+  assert.equal(formatearDuracion(viejas.curso), '0 d');
+  assert.equal(formatearDuracion(viejas.revision), '1 d');
+  // Mezcla: plan de dia (medianoche implicita) y start a las 23:10 del mismo
+  // dia. En horas daria 23h 10m, que parece preciso y no lo es: van dias.
+  const mezcla = calcularFila(entrada({ body: cuerpoCon([['2026-10-04', 'plan'], ['2026-10-04T23:10:00Z', 'start']]) }));
+  assert.deepEqual(mezcla.diseno, { valor: 0, precision: 'dia' });
+});
+
+test('plan repetido: diseno mide desde el PRIMER plan; varias reviews: curso hasta la primera', () => {
+  const f = calcularFila(
+    entrada({
+      body: cuerpoCon([
+        ['2026-10-05T10:00:00Z', 'plan'],
+        ['2026-10-05T11:00:00Z', 'plan'],
+        ['2026-10-05T12:00:00Z', 'start'],
+        ['2026-10-05T13:00:00Z', 'review'],
+        ['2026-10-05T15:00:00Z', 'review'],
+        ['2026-10-05T16:00:00Z', 'finish'],
+      ]),
+      ronda: 2,
+    })
+  );
+  assert.equal(formatearDuracion(f.diseno), '2h 00m');
+  assert.equal(formatearDuracion(f.curso), '1h 00m');
+  assert.equal(formatearDuracion(f.revision), '3h 00m');
+});
+
+test('pausa se cuenta pero no se descuenta: la duracion es de calendario', () => {
+  const f = calcularFila(
+    entrada({
+      body: cuerpoCon([
+        ['2026-10-05T10:00:00Z', 'plan'],
+        ['2026-10-05T10:05:00Z', 'pausa'],
+        ['2026-10-05T18:00:00Z', 'start'],
+      ]),
+    })
+  );
+  assert.equal(f.pausas, 1);
+  assert.equal(formatearDuracion(f.diseno), '8h 00m');
+});
+
+test('sin finish ni review: las columnas que faltan salen "—", nunca 0 ni NaN', () => {
+  const f = calcularFila(entrada({ body: cuerpoCon([['2026-10-05T10:00:00Z', 'plan']]) }));
+  assert.equal(f.origen, 'registro');
+  assert.equal(f.diseno, null);
+  assert.equal(f.cierre, null);
+  assert.equal(f.rondas, null, 'sin informes no es "0 rondas"');
+  const texto = formatearTabla([f], [...COLUMNAS_METRICAS, ...COLUMNAS_HEURISTICA]);
+  assert.doesNotMatch(texto, /NaN|undefined|null/);
+  assert.match(texto, /\| — +\| — +\| — +\| — +\| — +\| registro/);
+});
+
+test('un fin anterior al inicio (registro editado a mano) da "—", no un negativo', () => {
+  assert.equal(
+    duracionEntre({ ms: Date.UTC(2026, 9, 5, 12), precision: 'segundo' }, { ms: Date.UTC(2026, 9, 5, 11), precision: 'segundo' }),
+    null
+  );
+  assert.equal(duracionEntre({ ms: Date.UTC(2026, 9, 5), precision: 'dia' }, { ms: Date.UTC(2026, 9, 4), precision: 'dia' }), null);
+  assert.equal(duracionEntre(null, { ms: 0, precision: 'dia' }), null);
+});
+
+test('parsearLogGit reconoce SOLO los asuntos automaticos de cada fase', () => {
+  const s = (iso: string): number => Date.parse(iso) / 1000;
+  const salida = [
+    `${s('2026-10-05T10:00:05Z')}\tchore(TASK-007): tarea terminada y artefactos de cierre`,
+    `${s('2026-10-05T09:00:00Z')}\tchore(TASK-007): peticion de revision ronda 2`,
+    `${s('2026-10-05T08:00:00Z')}\tchore(TASK-007): peticion de revision ronda 1`,
+    `${s('2026-10-05T07:00:00Z')}\tchore(TASK-007): pausa registrada`,
+    `${s('2026-10-05T06:00:00Z')}\tchore(TASK-007): tarea en curso`,
+    `${s('2026-10-05T05:00:00Z')}\tchore(TASK-007): plan aprobado`,
+    `${s('2026-10-05T04:00:00Z')}\tchore(TASK-007): tarea en diseno`,
+    `${s('2026-10-05T03:00:00Z')}\tchore(TASK-007): tarea creada`,
+    `${s('2026-10-05T03:00:00Z')}\tchore(TASK-007): veredicto ronda 1 (aprobada)`,
+    `${s('2026-10-05T03:00:00Z')}\tfeat(TASK-007): tarea en curso`,
+    `${s('2026-10-05T03:00:00Z')}\tmerge(feature): x -> develop`,
+    'basura sin tabulador',
+    `no-numero\tchore(TASK-007): tarea en curso`,
+    '',
+  ].join('\n');
+  const eventos = parsearLogGit(salida);
+  assert.deepEqual(
+    eventos.map((e) => e.fase),
+    ['finish', 'review', 'review', 'pausa', 'start', 'approve', 'plan']
+  );
+  assert.ok(eventos.every((e) => e.id === 'TASK-007'));
+  assert.equal(eventos[0]?.ms, Date.parse('2026-10-05T10:00:05Z'));
+});
+
+test('origen git: sin registro se usan los commits; con registro, el registro gana', () => {
+  const ev = (fase: EventoGit['fase'], iso: string): EventoGit => ({ id: 'TASK-007', fase, ms: Date.parse(iso) });
+  const git = [
+    ev('finish', '2026-10-05T12:00:00Z'),
+    ev('review', '2026-10-05T11:00:00Z'),
+    ev('start', '2026-10-05T10:20:00Z'),
+    ev('plan', '2026-10-05T10:00:00Z'),
+  ];
+  const f = calcularFila(entrada({ eventosGit: git, ronda: 1 }));
+  assert.equal(f.origen, 'git');
+  assert.equal(formatearDuracion(f.diseno), '20m');
+  assert.equal(formatearDuracion(f.curso), '40m');
+  assert.equal(formatearDuracion(f.revision), '1h 00m');
+  assert.equal(f.cierre, '2026-10-05');
+
+  const conRegistro = calcularFila(entrada({ eventosGit: git, body: cuerpoCon([['2026-10-01', 'plan']]) }));
+  assert.equal(conRegistro.origen, 'registro');
+  assert.equal(conRegistro.diseno, null, 'no se mezclan las dos fuentes en una fila');
+});
+
+test('sin registro ni git: origen "—" y todo "—"', () => {
+  const f = calcularFila(entrada({ ronda: 3 }));
+  assert.equal(f.origen, '—');
+  assert.deepEqual(
+    COLUMNAS_METRICAS.map((c) => c.valor(f)),
+    ['TASK-007', 'simple', '—', '—', '—', '3', '—', '—']
+  );
+  assert.equal(COLUMNAS_METRICAS.find((c) => c.cabecera === 'complejidad')?.valor(calcularFila(entrada({ task: tarea({ complejidad: null }) }))), '—');
+});
+
+test('formatearDuracion: segundos, minutos, horas y dias', () => {
+  const seg = (s: number) => ({ valor: s * 1000, precision: 'segundo' as const });
+  assert.equal(formatearDuracion(seg(0)), '0s');
+  assert.equal(formatearDuracion(seg(40)), '40s');
+  assert.equal(formatearDuracion(seg(7 * 60 + 59)), '7m');
+  assert.equal(formatearDuracion(seg(3600 + 5 * 60)), '1h 05m');
+  assert.equal(formatearDuracion(seg(86_400 * 3 + 3600 * 4)), '3d 04h');
+  assert.equal(formatearDuracion({ valor: 12, precision: 'dia' }), '12 d');
+  assert.equal(formatearDuracion(null), '—');
+});
+
+test('la muestra de la heuristica: terminadas con informes; sin revision/ no es 0 rondas', () => {
+  const base = calcularFila(entrada({ ronda: 2 }));
+  const sinInformes = calcularFila(entrada({ ronda: 0 }));
+  const enCurso = calcularFila(entrada({ ronda: 1, task: tarea({ estado: 'en-curso' }) }));
+  assert.equal(enMuestraHeuristica(base), true);
+  assert.equal(enMuestraHeuristica(sinInformes), false);
+  assert.equal(enMuestraHeuristica(enCurso), false);
+});
+
+test('resumirPorNivel: n y rondas medias por nivel, en el orden del enum, con "—" al final', () => {
+  const f = (complejidad: Task['complejidad'], ronda: number): FilaMetricas =>
+    calcularFila(entrada({ task: tarea({ complejidad }), ronda }));
+  const grupos = resumirPorNivel([f('media', 3), f('simple', 1), f('media', 1), f(null, 2)], (x) => x.complejidad, TASK_COMPLEXITIES);
+  assert.deepEqual(grupos, [
+    { nivel: 'simple', n: 1, rondasMedia: 1 },
+    { nivel: 'media', n: 2, rondasMedia: 2 },
+    { nivel: '—', n: 1, rondasMedia: 2 },
+  ]);
+});
+
+test('formatearTabla: cabecera, separador y columnas alineadas', () => {
+  const f = calcularFila(entrada({ body: cuerpoCon(CICLO_CON_HORA), ronda: 1 }));
+  const lineas = formatearTabla([f], COLUMNAS_METRICAS).split('\n');
+  assert.equal(lineas.length, 3);
+  assert.match(lineas[0] as string, /^\| id +\| complejidad \| diseno \| curso +\| revision \| rondas \| cierre +\| origen +\|$/);
+  assert.match(lineas[1] as string, /^\|-+\|-+\|/);
+  assert.equal(new Set(lineas.map((l) => l.length)).size, 1, 'todas las lineas miden lo mismo');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
index 4e5a089..7c51462 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
@@ -10,6 +10,9 @@ import {
   modoCongelado,
   modoDeTarea,
   registrarTransicion,
+  precisionDeFecha,
+  instanteDe,
+  formatearInstante,
   type FilaTransicion,
 } from '../../src/core/transiciones.js';
 
@@ -212,3 +215,75 @@ test('registrarTransicion: plan toma el modo del config; el resto, el congelado
   const sinPlan = registrarTransicion(CUERPO, 'start', '2026-10-04', 'semiautomatico');
   assert.equal(leerTransiciones(sinPlan)[0]?.modo, 'semiautomatico');
 });
+
+// --------------------------------------------------------------------
+// TASK-052: la celda `fecha` lleva el instante UTC al segundo. Requisito del
+// rol de riesgos: el modo congelado se sigue leyendo con filas con hora y con
+// tablas mezcladas. Mutacion comprobada: volver al regex del dia a secas en
+// leerTransiciones (`/^\d{4}-\d{2}-\d{2}$/`) pone rojos estos tres tests.
+// --------------------------------------------------------------------
+
+const PLAN_AUTO_CON_HORA = fila({ fecha: '2026-10-05T14:03:22Z', modo: 'automatico' });
+
+test('TASK-052: registrarTransicion con instante lo escribe tal cual y leerTransiciones lo devuelve', () => {
+  const r = registrarTransicion(CUERPO, 'plan', '2026-10-05T14:03:22Z', 'automatico');
+  assert.ok(r.includes('| 2026-10-05T14:03:22Z | plan | automatico | persona |'), r);
+  assert.deepEqual(leerTransiciones(r), [PLAN_AUTO_CON_HORA]);
+});
+
+test('TASK-052: modoCongelado sigue funcionando con filas con hora', () => {
+  const r = anadirTransicion(CUERPO, PLAN_AUTO_CON_HORA);
+  assert.equal(modoCongelado(r), 'automatico');
+  // Y gana al config: es lo que impide aprobar en otro modo que el del plan.
+  assert.equal(modoDeTarea(r, 'manual'), 'automatico');
+  const aprobada = registrarTransicion(r, 'approve', '2026-10-05T14:10:00Z', 'manual');
+  assert.equal(leerTransiciones(aprobada)[1]?.modo, 'automatico');
+});
+
+test('TASK-052: tabla mezclada (filas viejas de dia y nuevas con hora) se lee entera y en orden', () => {
+  let r = anadirTransicion(CUERPO, fila({ fecha: '2026-10-04', modo: 'manual' }));
+  r = anadirTransicion(r, fila({ fecha: '2026-10-04', fase: 'approve' }));
+  // Un plan repetido despues de actualizar el plugin: el congelado es el ultimo.
+  r = anadirTransicion(r, PLAN_AUTO_CON_HORA);
+  r = anadirTransicion(r, fila({ fecha: '2026-10-05T15:00:00Z', fase: 'start', modo: 'automatico' }));
+  assert.deepEqual(
+    leerTransiciones(r).map((f) => [f.fecha, f.fase]),
+    [
+      ['2026-10-04', 'plan'],
+      ['2026-10-04', 'approve'],
+      ['2026-10-05T14:03:22Z', 'plan'],
+      ['2026-10-05T15:00:00Z', 'start'],
+    ]
+  );
+  assert.equal(modoCongelado(r), 'automatico');
+  // Al reves: plan nuevo con hora y despues una fila vieja sigue congelando el de la hora.
+  const solo = anadirTransicion(anadirTransicion(CUERPO, PLAN_AUTO_CON_HORA), fila({ fecha: '2026-10-06', fase: 'start' }));
+  assert.equal(modoCongelado(solo), 'automatico');
+});
+
+test('TASK-052: precisionDeFecha distingue dia e instante y rechaza lo demas', () => {
+  assert.equal(precisionDeFecha('2026-10-05'), 'dia');
+  assert.equal(precisionDeFecha('2026-10-05T14:03:22Z'), 'segundo');
+  for (const mala of [
+    '2026-10-05T14:03Z', // sin segundos
+    '2026-10-05T14:03:22.123Z', // con milisegundos
+    '2026-10-05T14:03:22+02:00', // con offset: la fuente es UTC
+    '2026-10-05 14:03:22',
+    '2026-02-30', // no existe
+    '2026-13-01',
+    '2026-10-05T25:00:00Z',
+    'ayer',
+  ]) {
+    assert.equal(precisionDeFecha(mala), null, mala);
+    const r = anadirTransicion(CUERPO, fila({ fecha: mala }));
+    assert.deepEqual(leerTransiciones(r), [], `una fila con fecha "${mala}" no cuenta`);
+  }
+});
+
+test('TASK-052: formatearInstante es UTC al segundo e instanteDe lo invierte', () => {
+  const d = new Date(Date.UTC(2026, 9, 5, 23, 59, 59, 987));
+  assert.equal(formatearInstante(d), '2026-10-05T23:59:59Z');
+  assert.equal(precisionDeFecha(formatearInstante(d)), 'segundo');
+  assert.equal(instanteDe('2026-10-05T23:59:59Z'), Date.UTC(2026, 9, 5, 23, 59, 59));
+  assert.equal(instanteDe('2026-10-05'), Date.UTC(2026, 9, 5));
+});
````

## Excluido del diff (20 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-052/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-052/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-052/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-052/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-052/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-052/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-052/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  52 ++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js                                            |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                    |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                                   | 145 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/pausa.js                                      |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                                      |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/catalogo-skills.js                                |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heuristica.js                                     |  80 ++++++++++++---------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       | 204 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                   |  46 ++++++++++++++++++-
 20 files changed, 478 insertions(+), 68 deletions(-)
````
