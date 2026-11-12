# Peticion de revision — TASK-121 (ronda 1)

- Tarea: TASK-121 — Troceo de tareas de mas de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama
- Rama revisada: feature/task-121-troceo-de-tareas-de-mas-de-60-min-como-p
- Rama base: develop
- Commit revisado (HEAD): ccac45208cd1f43f2fd73ea1c2b0b0b4db75087d
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-121 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-121/tarea.md
- tareas/03-en-revision/TASK-121/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/troceo.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/troceo.test.ts

## Commits a revisar (git log develop..HEAD)

````
ccac452 feat(TASK-121): troceo en partes TASK-NNNa, b, c en la misma rama
639813b chore(TASK-121): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 1b52654..36e128a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -112,6 +112,11 @@ al cierre con merge) se parte en varias.
   `taskctl siguiente` pregunta en cualquier modo y `taskctl approve
   --decidido-por automatico` se rechaza: decide una persona (trocear o aprobar
   entera con el motivo). Sin la línea, `approve` solo avisa.
+- **Trocear:** `taskctl trocear TASK-NNN` parte la tarea según la sección
+  `## Troceo` del plan: pasa a TASK-NNNa y crea TASK-NNNb, TASK-NNNc... en
+  `00-planificadas`, todas con la misma rama, y regenera el ROADMAP en el
+  mismo commit. Cada parte se cierra con su `finish`; `start` de la parte
+  siguiente vuelve a la rama y le trae antes la base.
 - **Finish:** `tarea.md` gana `## Duracion` con la estimada y la real de punta
   a punta (sin pausas), y `taskctl metricas` las muestra en las columnas
   `estimada` y `punta_a_punta`, para calibrar. La fila `finish` de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
index 7ea1c7c..2aa9f1b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
@@ -23,8 +23,15 @@ Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
    `taskctl approve TASK-NNN --decidido-por automatico`: queda registrado como
    aprobacion automatica. El CLI lo rechaza si la tarea no se planifico en
    automatico; entonces, y en cualquier otro modo, sigue con la pregunta.
-   Pregunta a la persona si lo aprueba.
-   - **Si**: ejecuta `taskctl approve TASK-NNN`.
+   Pregunta a la persona si lo aprueba. Si `siguiente` trae `salidas` (regla
+   de una hora: el plan pasa de 60 min), la pregunta nombra las dos:
+   trocear (`taskctl trocear TASK-NNN`, segun la seccion `## Troceo` del
+   plan; ver `task-workflow/duracion.md`) o aprobar entera. Nunca troceas
+   sin su respuesta, en ningun modo.
+   - **Trocear**: ejecuta `taskctl trocear TASK-NNN` y sigue con la parte a
+     (`/taskcode-plugin:approve TASK-NNNa`).
+   - **Si** (entera): escribe en el plan el motivo para no trocear si pasa de
+     la hora, commitealo y ejecuta `taskctl approve TASK-NNN`.
    - **No**: pregunta que habria que cambiar y escribelo, con sus palabras, al
      final de `plan-final.md` en una seccion con este encabezado exacto (asi
      sobrevive a la sesion y la re-planificacion lo lee):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index c0ee58c..5d6d971 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -68,7 +68,10 @@ no deberian necesitar volver a preguntar.
    llevar la linea `Duracion estimada: N min`, de punta a punta (de la rama
    abierta al cierre con merge), con sus senales (ficheros de codigo
    previstos, capas, criterios). Si pasa de 60, propon en el plan como
-   trocear la tarea y preguntaselo a la persona: decide ella, en approve.
+   trocear la tarea (seccion `## Troceo`, una `### Parte a: ...` por parte,
+   ver `task-workflow/duracion.md`) y preguntaselo a la persona: decide ella.
+   Si acepta, `taskctl trocear TASK-NNN`; si no, escribe en el plan el
+   motivo para no trocear y sigue con approve. Nunca troceas sin su respuesta.
    Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
    anota las respuestas en el propio plan. Si la salida de `taskctl plan`
    nombro `skills_recomendados`, dejalos anotados para la implementacion.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
index 43967f6..14962dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duracion.md
@@ -12,8 +12,11 @@ pequenas cierran antes y se revisan mejor.
 - **En approve** decide una persona. Con mas de 60 min, o con una cifra que
   no se entiende (`1h30`, `~90`, `90-120`), `taskctl siguiente` devuelve
   `preguntar` en cualquier modo y `taskctl approve --decidido-por automatico`
-  se rechaza. La persona elige: trocear, o aprobar entera con el motivo
-  escrito en el plan. Sin la linea, `approve` solo avisa.
+  se rechaza. La pregunta trae dos salidas (`salidas` en el JSON):
+  `taskctl trocear TASK-NNN` o aprobar entera con el motivo escrito en el
+  plan (`taskctl approve TASK-NNN`). Ningun modo trocea solo: lo decide una
+  persona, y `trocear` no lo encadena ninguna fase. Sin la linea, `approve`
+  solo avisa.
 - **En finish** se mide. `tarea.md` gana `## Duracion` con la estimada y la
   real de punta a punta (de `start` a `finish`, sin pausas). `taskctl
   metricas` las muestra (`estimada`, `punta_a_punta`), para calibrar la
@@ -41,9 +44,42 @@ de saber como hacerlo, eso va primero en su propia tarea corta.
 - **Por capas solo si cada parte se verifica sola**: la migracion con su
   test, y despues el backend que la usa. Anadir un campo y mapearlo (dos o
   tres ficheros) no se parte.
-- Cada tarea nueva lleva sus propios criterios comprobables y sus
-  dependencias (`dependencias` en el frontmatter), para que el orden quede
-  claro.
+- Cada parte lleva sus propios criterios comprobables.
+
+## Partes en la misma rama: `taskctl trocear`
+
+Las partes no son tareas nuevas con su propia rama: se numeran con el mismo
+numero y una letra (TASK-NNNa, TASK-NNNb...) y comparten la rama de la tarea.
+El plan las declara en una seccion `## Troceo`:
+
+```
+## Troceo
+
+### Parte a: <titulo>
+Lo que entrega esta parte.
+Duracion estimada: 40 min
+- [ ] criterio comprobable
+
+### Parte b: <titulo>
+...
+```
+
+Al menos dos partes, letras seguidas desde la a, cada una con objetivo y
+criterios. Si la persona acepta trocear, `taskctl trocear TASK-NNN` (en la
+rama base, con el plan sin aprobar):
+
+- la tarea pasa a TASK-NNNa, sigue en diseno con su plan, y su duracion
+  estimada pasa a la de la parte a;
+- crea TASK-NNNb, TASK-NNNc... en `00-planificadas` con el objetivo y los
+  criterios de su parte, la misma `rama` y la parte anterior en
+  `dependencias`;
+- regenera `tareas/ROADMAP.md` en el mismo commit, antes de empezar la a.
+
+Cada parte sigue el ciclo entero y se cierra con su propio `finish` (merge
+`--no-ff` a la base). La siguiente parte se planifica y arranca con
+`start`, que vuelve a la misma rama y le trae antes la base (el cierre de la
+parte anterior y su propio plan); si ese merge tiene conflicto, `start` lo
+deshace y pide integrarlo a mano. Una parte no se vuelve a trocear.
 
 ## Limites de la medida
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index db08ffb..966c8cd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -20,6 +20,7 @@ import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex
 import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
+import { runTrocearCommand, TrocearCommandError } from './commands/trocear.js';
 import { runDoctorCommand, DoctorCommandError } from './commands/doctor.js';
 import { runDoctorDeployCompleto, DoctorDeployCommandError } from './commands/doctor-deploy.js';
 import { DoctorDeployTareasError } from './commands/doctor-deploy-tareas.js';
@@ -84,6 +85,7 @@ Uso:
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--decidido-por persona|automatico] [--push]
+  taskctl trocear TASK-NNN [--push]
   taskctl review TASK-NNN [--completa] [--ronda-extra] [--push]
   taskctl codex-review TASK-NNN [--push]
   taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
@@ -103,7 +105,7 @@ Uso:
   taskctl recover [<rama>]
   taskctl abort-merge
 
-Comandos: new, import, board, roadmap, metricas, start, plan, approve, review, codex-review, veredicto,
+Comandos: new, import, board, roadmap, metricas, start, plan, approve, trocear, review, codex-review, veredicto,
 finish, siguiente, estado, doctor, doctor-deploy, pausa, registrar-coste, cadena.
 estado dice en que va la tarea en curso (fase dentro del ciclo, paso dentro de la fase, x/N si el
 comando de verificacion lo escribe, minutos), leyendo solo el progreso que dejan plan, approve, start,
@@ -173,6 +175,9 @@ en docs/doctor-deploy/<fecha>.md y .json (sin commitear). --resultado <fichero.j
 agente revisor para los puntos de juicio (cada uno cita fichero y linea del commit actual, o se rechaza con su motivo).
 --crear-tareas crea una tarea por cada FALLA con ID desde TASK-9999 hacia abajo (no duplica: reutiliza la tarea abierta
 del punto). Un proyecto ajusta el catalogo en .taskcode/doctor-deploy.yml.
+trocear parte una tarea en diseno en TASK-NNNa, TASK-NNNb... segun la seccion "## Troceo" de su plan: la
+tarea pasa a ser la parte a y las demas nacen en 00-planificadas con la misma rama; regenera el ROADMAP.
+Es la salida de la regla de una hora que decide una persona (siguiente la ofrece, nunca la encadena).
 siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
 manual, semiautomatico o automatico); solo lee. pausa registra que la persona
 no quiere pasar todavia a la siguiente fase. cadena bloquea el arbol mientras
@@ -723,6 +728,34 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'trocear') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const r = await runTrocearCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+      printBaseBranchSwitchNotice(r.baseBranchGuard);
+      process.stdout.write(
+        `Tarea ${r.id} troceada en ${r.ids.join(', ')}, todas en la misma rama. ` +
+          `${r.ids[0] ?? ''} sigue en diseno con el plan; las demas, en 00-planificadas.
+`
+      );
+      printAutoCommit(r.autoCommit);
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof TrocearCommandError ||
+        e instanceof TaskFolderConflictError ||
+        e instanceof BaseBranchGuardError
+      ) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'review') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
@@ -856,7 +889,8 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         process.stdout.write(
           `Tarea ${r.id} (${r.estado}, modo ${r.modo}): siguiente fase "${r.fase}" — ${r.motivo}.\n` +
             (r.comando === null ? '' : `Comando: ${r.comando}\n`) +
-            `Accion: ${r.accion}.\n`
+            `Accion: ${r.accion}.\n` +
+            (r.salidas ?? []).map((s) => `Salida ${s.opcion}: ${s.comando} — ${s.descripcion}\n`).join('')
         );
       }
       return 0;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index d67e924..bac1eb9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -39,7 +39,11 @@ import {
   gitUserEmail,
   resolveBaseBranchForTipo,
   gitflowBaseArgs,
+  localBranchExists,
+  isAncestor,
 } from '../fs/git.js';
+import { spawnSync } from 'node:child_process';
+import { esIdTroceable } from '../core/troceo.js';
 import {
   autoCommit,
   extraerPushFlag,
@@ -271,6 +275,13 @@ async function runStart(
   }
 
   progreso.paso('rama');
+  // TASK-121: una parte de un troceo (TASK-NNNb...) sigue en la rama que
+  // abrio la parte anterior. El script cambia a ella si ya existe, pero esa
+  // rama no trae lo que la base recibio despues (el cierre de la parte
+  // anterior, el plan y la aprobacion de esta): sin traerlo, la tarea
+  // quedaria en dos carpetas. Se mira ANTES del script, que la crearia.
+  const parteEnRamaExistente = !esIdTroceable(task.id) && localBranchExists(task.rama, deps.repoCwd);
+  const ramaBaseParte = parteEnRamaExistente ? resolveBaseBranchForTipo(task.tipo, deps.repoCwd) : null;
   const scriptName = SCRIPT_BY_TYPE[task.tipo];
   // La rama va primero: los scripts toman como nombre el primer no-flag.
   const scriptArgs = [task.rama, ...gitflowBaseArgs(task.tipo, deps.repoCwd)];
@@ -295,6 +306,9 @@ async function runStart(
         `"${branchNow}", no "${task.rama}". No se actualiza la tarea; revisa el repo a mano.`
     );
   }
+  if (ramaBaseParte !== null && !isAncestor(ramaBaseParte, 'HEAD', deps.repoCwd)) {
+    traerBaseALaRama(task, ramaBaseParte, deps.repoCwd);
+  }
 
   // asignadoFinal ya se resolvio arriba, junto a la comprobacion del
   // limite de WIP, para no calcularlo dos veces ni arriesgarse a que
@@ -346,3 +360,20 @@ async function runStart(
     autoCommit: commitResult,
   };
 }
+
+/**
+ * TASK-121: trae la rama base a la rama compartida de un troceo con un merge
+ * `--no-ff`. Si hay conflicto lo deshace y aborta: la tarea no se mueve y la
+ * persona integra a mano (la rama ya esta activa).
+ */
+function traerBaseALaRama(task: Task, base: string, cwd: string): void {
+  const mensaje = `merge(${task.id}): ${base} en ${task.rama} para seguir con la parte`;
+  const r = spawnSync('git', ['merge', '--no-ff', '--no-edit', '-m', mensaje, base], { cwd, encoding: 'utf8' });
+  if (r.status === 0) return;
+  spawnSync('git', ['merge', '--abort'], { cwd, encoding: 'utf8' });
+  throw new StartCommandError(
+    `[ERROR] ${task.id}: la rama "${task.rama}" es la de la parte anterior y no se pudo traer "${base}" ` +
+      `(${(r.stderr || r.stdout || '').trim().split('\n')[0] ?? ''}). El merge se ha deshecho y la tarea no se ha ` +
+      `movido. Estas en "${task.rama}": integra "${base}" a mano, commitea y reintenta "taskctl start ${task.id}".`
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
new file mode 100644
index 0000000..cea0c2e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
@@ -0,0 +1,121 @@
+/**
+ * `taskctl trocear TASK-NNN [--push]` — TASK-121. La salida «trocear» de la
+ * regla de una hora: convierte la tarea en TASK-NNNa y crea TASK-NNNb,
+ * TASK-NNNc... en 00-planificadas con el objetivo y los criterios de cada
+ * parte del plan (seccion `## Troceo`), todas con la MISMA rama. Regenera el
+ * ROADMAP en el mismo commit, antes de que nadie empiece TASK-NNNa.
+ *
+ * Solo lo ejecuta una persona: no hay modo automatico ni lo encadena
+ * `siguiente` (su accion con mas de una hora es siempre preguntar).
+ *
+ * Primero valida y calcula todo; solo despues escribe. Un plan sin partes
+ * validas no toca ningun fichero.
+ */
+import path from 'node:path';
+import { readFile, writeFile } from 'node:fs/promises';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { readTareaFile, moveTareaFile, writeTareaFile, listExistingTaskIds } from '../fs/task-store.js';
+import { resolverPlanFinal } from './plan.js';
+import { planRedactado } from './approve.js';
+import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
+import { autoCommit, extraerPushFlag, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
+import { esIdTroceable, leerPartes, planificarTroceo, planTrasTroceo, TroceoError } from '../core/troceo.js';
+
+export class TrocearCommandError extends Error {}
+
+export const FLAGS_TROCEAR: readonly string[] = ['--push', '-p'];
+
+export interface TrocearCommandResult {
+  id: string;
+  ids: string[];
+  /** tarea.md de cada parte, en orden (a, b, c...). */
+  ficheros: string[];
+  baseBranchGuard: BaseBranchGuardResult;
+  autoCommit: AutoCommitResult;
+}
+
+export interface TrocearCommandDeps {
+  repoCwd: string;
+}
+
+export async function runTrocearCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: TrocearCommandDeps
+): Promise<TrocearCommandResult> {
+  rechazarFlagsDesconocidos(argv, FLAGS_TROCEAR, 'trocear', (m) => new TrocearCommandError(m));
+  const { push, resto } = extraerPushFlag(argv);
+  const id = resto[0];
+  if (id === undefined || id.trim() === '') {
+    throw new TrocearCommandError('[ERROR] Falta el ID de la tarea: taskctl trocear TASK-NNN.');
+  }
+  if (!/^TASK-\d{3,}[a-z]?$/.test(id)) {
+    throw new TrocearCommandError(`[ERROR] "${id}" no es un ID de tarea valido (se espera TASK-NNN).`);
+  }
+  if (!esIdTroceable(id)) {
+    throw new TrocearCommandError(`[ERROR] ${id}: ya es una parte de un troceo; una parte no se vuelve a trocear.`);
+  }
+
+  const inicial = await readTareaFile(tareasRoot, id);
+  if (inicial === null) {
+    throw new TrocearCommandError(`[ERROR] ${id}: no se encuentra en tareas/ de la rama actual.`);
+  }
+  const baseBranchGuard = ensureBaseBranchReady(inicial.task.tipo, deps.repoCwd);
+
+  const leida = await readTareaFile(tareasRoot, id);
+  if (leida === null) {
+    throw new TrocearCommandError(`[ERROR] ${id}: no se encuentra en tareas/ de la rama base.`);
+  }
+  const { task, body, filePath } = leida;
+  if (task.estado !== 'en-diseno' || task.plan_aprobado) {
+    throw new TrocearCommandError(
+      `[ERROR] ${id}: solo se trocea una tarea en diseno con el plan sin aprobar ` +
+        `(esta en "${task.estado}"${task.plan_aprobado ? ', con el plan aprobado' : ''}).`
+    );
+  }
+  const taskDir = path.dirname(filePath);
+  if (!(await planRedactado(task, taskDir))) {
+    throw new TrocearCommandError(
+      `[ERROR] ${id}: no hay plan redactado. Las partes se declaran en su seccion "## Troceo".`
+    );
+  }
+  const u = await resolverPlanFinal(taskDir);
+  const rutaPlan = u.canonicaExiste ? u.canonica : u.legada;
+  const plan = await readFile(rutaPlan, 'utf8');
+
+  let troceo: ReturnType<typeof planificarTroceo>;
+  let partes: ReturnType<typeof leerPartes>;
+  try {
+    partes = leerPartes(plan, id);
+    troceo = planificarTroceo(task, body, partes, today);
+  } catch (e) {
+    if (e instanceof TroceoError) throw new TrocearCommandError(`[ERROR] ${e.message} No se ha tocado nada.`);
+    throw e;
+  }
+  const existentes = new Set(await listExistingTaskIds(tareasRoot));
+  const ocupados = troceo.ids.filter((x) => existentes.has(x));
+  if (ocupados.length > 0) {
+    throw new TrocearCommandError(
+      `[ERROR] ${id}: ya existen ${ocupados.join(', ')}. Revisa tareas/ a mano; no se ha tocado nada.`
+    );
+  }
+
+  // Escritura: el plan primero (en la carpeta vieja), luego el movimiento de
+  // la carpeta entera a TASK-NNNa y por ultimo las partes nuevas.
+  await writeFile(rutaPlan, planTrasTroceo(plan, partes, troceo.ids, today), 'utf8');
+  const ficheroA = await moveTareaFile(tareasRoot, filePath, troceo.parteA.task, troceo.parteA.body);
+  const ficheros = [ficheroA];
+  for (const p of troceo.resto) {
+    ficheros.push(await writeTareaFile(tareasRoot, p.task, p.body, { failIfExists: true }));
+  }
+
+  const commitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [taskDir, ...ficheros.map((f) => path.dirname(f))],
+    mensaje: mensajeChore(id, `troceo en ${troceo.ids.join(', ')}`),
+    push,
+    roadmap: true,
+  });
+  return { id, ids: troceo.ids, ficheros, baseBranchGuard, autoCommit: commitResult };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts
index f378438..00f20c3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/board-format.ts
@@ -27,7 +27,7 @@ const STATE_LABEL: Record<TaskState, string> = {
   terminada: 'Terminadas',
 };
 
-const TASK_ID_NUM_RE = /^TASK-(\d+)$/;
+const TASK_ID_NUM_RE = /^TASK-(\d+)([a-z]?)$/;
 
 /**
  * Orden numerico por ID, no alfabetico (un ID de 4+ digitos, p. ej.
@@ -38,7 +38,11 @@ const TASK_ID_NUM_RE = /^TASK-(\d+)$/;
  */
 function taskIdSortKey(id: string): number {
   const m = TASK_ID_NUM_RE.exec(id);
-  return m ? parseInt(m[1] as string, 10) : Number.POSITIVE_INFINITY;
+  // TASK-121: la letra de una parte ordena dentro de su numero (TASK-121a,
+  // TASK-121b, luego TASK-122); sin letra va delante de sus partes.
+  if (!m) return Number.POSITIVE_INFINITY;
+  const letra = m[2] as string;
+  return parseInt(m[1] as string, 10) * 100 + (letra === '' ? 0 : letra.charCodeAt(0) - 96);
 }
 
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index d33dec0..6de5a78 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -83,6 +83,36 @@ export interface SiguientePaso {
   comando: string | null;
   accion: AccionFlujo;
   motivo: string;
+  /**
+   * TASK-121: cuando la accion es preguntar por la regla de una hora, las
+   * salidas entre las que elige la persona (trocear o aprobar entera).
+   */
+  salidas?: SalidaPregunta[];
+}
+
+export interface SalidaPregunta {
+  opcion: 'trocear' | 'aprobar-entera';
+  comando: string;
+  descripcion: string;
+}
+
+/** TASK-121: las dos salidas de la regla de una hora (una parte ya no se trocea). */
+export function salidasReglaUnaHora(id: string): SalidaPregunta[] {
+  const aprobar: SalidaPregunta = {
+    opcion: 'aprobar-entera',
+    comando: `taskctl approve ${id}`,
+    descripcion: 'la tarea sigue entera; antes, escribe en el plan el motivo para no trocearla',
+  };
+  if (!/^TASK-\d{3,}$/.test(id)) return [aprobar];
+  return [
+    {
+      opcion: 'trocear',
+      comando: `taskctl trocear ${id}`,
+      descripcion:
+        `pasa a ${id}a y crea ${id}b, ${id}c... en 00-planificadas con la misma rama, segun la seccion "## Troceo" del plan`,
+    },
+    aprobar,
+  ];
 }
 
 /**
@@ -155,6 +185,7 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
           comando: `taskctl approve ${task.id}`,
           accion: 'preguntar',
           motivo: describirExceso(ctx.duracionEstimada),
+          salidas: salidasReglaUnaHora(task.id),
         };
       }
       if (!ctx.modoCongelado) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
index b52dca1..46d6896 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heldout.ts
@@ -65,7 +65,7 @@ export function variantesHeldout(rutas: readonly string[], id: string): string[]
  * punto de la ruta, seguida de `/` o del final. `aceptacionX/` y `tarea.md`
  * no casan.
  */
-const RUTA_HELDOUT_RE = new RegExp(`(?:^|/)tareas/[^/]+/task-(\\d{3,})/${CARPETA_HELDOUT}(?:/|$)`);
+const RUTA_HELDOUT_RE = new RegExp(`(?:^|/)tareas/[^/]+/task-(\\d{3,})[a-z]?/${CARPETA_HELDOUT}(?:/|$)`);
 
 function casar(normalizada: string, nums: Set<number>): void {
   const m = RUTA_HELDOUT_RE.exec(normalizada);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index 8b59f01..d2ae464 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -252,7 +252,7 @@ function kbPorRonda(peticiones: readonly { ronda: number; bytes: number }[]): Pe
  * deja de reconocer sus commits: hay un test que recorre el ciclo real.
  */
 const ASUNTO_CHORE_RE =
-  /^chore\((TASK-\d{3,})\): (tarea en diseno|plan aprobado|tarea en curso|peticion de revision ronda \d+|tarea terminada y artefactos de cierre|pausa registrada)$/;
+  /^chore\((TASK-\d{3,}[a-z]?)\): (tarea en diseno|plan aprobado|tarea en curso|peticion de revision ronda \d+|tarea terminada y artefactos de cierre|pausa registrada)$/;
 
 function faseDeAsunto(resumen: string): FaseMedida {
   if (resumen === 'tarea en diseno') return 'plan';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
index 6ee8005..88e4aec 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task-id.ts
@@ -9,7 +9,7 @@
  * las tareas que crea `taskctl doctor-deploy --crear-tareas` sin chocar con
  * las que se crean a mano.
  */
-const TASK_ID_RE = /^TASK-(\d{3,})$/;
+const TASK_ID_RE = /^TASK-(\d{3,})[a-z]?$/;
 /** `feature/task-9999-slug`, `fix/task-9998`: el numero de tarea dentro del nombre de una rama. */
 const RAMA_TASK_RE = /(?:^|\/)task-(\d{3,})(?:-|$)/i;
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
index e1c395c..5a71097 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts
@@ -129,7 +129,7 @@ export const TASK_FIELD_ORDER: readonly (keyof Task)[] = [
   'dependencias',
 ];
 
-const TASK_ID_RE = /^TASK-\d{3,}$/;
+const TASK_ID_RE = /^TASK-\d{3,}[a-z]?$/;
 
 /** Valida el formato de un ID de tarea sin construir un Task completo.
  *  Se usa como guarda de seguridad ANTES de construir rutas de archivo
@@ -141,7 +141,7 @@ export function isValidTaskId(id: string): boolean {
 
 export class InvalidTaskIdError extends Error {
   constructor(public readonly id: string) {
-    super(`"${id}" no es un ID de tarea valido (se espera el formato TASK-NNN).`);
+    super(`"${id}" no es un ID de tarea valido (se espera el formato TASK-NNN, o TASK-NNNa si es una parte de un troceo).`);
     this.name = 'InvalidTaskIdError';
   }
 }
@@ -261,7 +261,7 @@ function requireNullableEnum<T extends string>(
 export function validateTask(data: Record<string, unknown>): Task {
   const id = requireString(data, 'id');
   if (!TASK_ID_RE.test(id)) {
-    fail('id', `El campo "id" ("${id}") debe tener el formato TASK-NNN (al menos 3 digitos).`);
+    fail('id', `El campo "id" ("${id}") debe tener el formato TASK-NNN (al menos 3 digitos) o TASK-NNNa (una parte de un troceo).`);
   }
 
   const task: Task = {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
new file mode 100644
index 0000000..ab35c6f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/troceo.ts
@@ -0,0 +1,262 @@
+/**
+ * TASK-121: troceo de una tarea en partes TASK-NNNa, TASK-NNNb... que
+ * comparten la rama de la tarea. Puro: lee el plan y el cuerpo de la tarea
+ * y devuelve lo que hay que escribir; `commands/trocear.ts` lo escribe.
+ *
+ * El plan declara las partes en una seccion `## Troceo`:
+ *
+ *     ## Troceo
+ *
+ *     ### Parte a: IDs con letra en todo el CLI
+ *     Objetivo de la parte (una o varias lineas).
+ *     Duracion estimada: 40 min
+ *     - [ ] criterio comprobable
+ *
+ * Trocear lo decide una persona (regla de una hora): este modulo no decide
+ * nada, solo valida que las partes esten completas.
+ */
+import type { Task } from './task.js';
+import { leerDuracionEstimada, type LecturaDuracion } from './duracion-estimada.js';
+
+export class TroceoError extends Error {}
+
+export interface ParteTroceo {
+  /** Letra de la parte: a, b, c... */
+  letra: string;
+  titulo: string;
+  objetivo: string;
+  criterios: string[];
+  duracion: LecturaDuracion;
+}
+
+/** `TASK-121` -> true; `TASK-121a` -> false (una parte no se vuelve a trocear). */
+export function esIdTroceable(id: string): boolean {
+  return /^TASK-\d{3,}$/.test(id);
+}
+
+/** `TASK-121b` -> `TASK-121`; un ID sin letra se devuelve tal cual. */
+export function idRaiz(id: string): string {
+  return id.replace(/^(TASK-\d{3,})[a-z]$/, '$1');
+}
+
+const CABECERA_TROCEO_RE = /^##\s+troceo\s*$/i;
+const CABECERA_PARTE_RE = /^###\s+parte\s+([a-z])\s*[:.\-–—]\s*(.+?)\s*$/i;
+const CRITERIO_RE = /^\s*[-*]\s+\[[ xX]\]\s+(.*\S)\s*$/;
+const DURACION_RE = /duraci[oó]n estimada\s*[*_`]*\s*:/i;
+
+/** Las lineas de la seccion `## Troceo`, fuera de bloques de codigo; null si no hay seccion. */
+function lineasDeTroceo(plan: string): string[] | null {
+  const lineas = plan.replace(/\r/g, '').split('\n');
+  let enBloque = false;
+  let dentro = false;
+  let encontrada = false;
+  const out: string[] = [];
+  for (const l of lineas) {
+    if (/^\s*(```|~~~)/.test(l)) {
+      enBloque = !enBloque;
+      if (dentro) out.push(l);
+      continue;
+    }
+    if (!enBloque && /^##\s/.test(l)) {
+      if (dentro) break;
+      if (CABECERA_TROCEO_RE.test(l)) {
+        dentro = true;
+        encontrada = true;
+      }
+      continue;
+    }
+    if (dentro) out.push(l);
+  }
+  return encontrada ? out : null;
+}
+
+/**
+ * Las partes que declara el plan. Lanza TroceoError si no hay seccion
+ * `## Troceo`, si hay menos de dos partes, si las letras no van seguidas desde
+ * la `a` o si una parte no trae objetivo o criterios.
+ */
+export function leerPartes(plan: string, id: string): ParteTroceo[] {
+  const lineas = lineasDeTroceo(plan);
+  if (lineas === null) {
+    throw new TroceoError(
+      `${id}: el plan no tiene seccion "## Troceo". Anadela con un bloque "### Parte a: <titulo>", ` +
+        '"### Parte b: <titulo>"... y en cada uno su objetivo y sus criterios ("- [ ] ...").'
+    );
+  }
+  const partes: { letra: string; titulo: string; cuerpo: string[] }[] = [];
+  let enBloque = false;
+  for (const l of lineas) {
+    if (/^\s*(```|~~~)/.test(l)) enBloque = !enBloque;
+    const m = enBloque ? null : CABECERA_PARTE_RE.exec(l);
+    if (m !== null) {
+      partes.push({ letra: (m[1] as string).toLowerCase(), titulo: m[2] as string, cuerpo: [] });
+      continue;
+    }
+    const ultima = partes[partes.length - 1];
+    if (ultima !== undefined) ultima.cuerpo.push(l);
+  }
+  if (partes.length < 2) {
+    throw new TroceoError(
+      `${id}: la seccion "## Troceo" declara ${String(partes.length)} parte(s); trocear pide al menos dos ` +
+        '("### Parte a: ...", "### Parte b: ...").'
+    );
+  }
+  return partes.map((p, i) => {
+    const esperada = String.fromCharCode(97 + i);
+    if (p.letra !== esperada) {
+      throw new TroceoError(
+        `${id}: la parte ${String(i + 1)} se llama "${p.letra}" y deberia ser "${esperada}": ` +
+          'las partes van seguidas desde la a (a, b, c...).'
+      );
+    }
+    const criterios: string[] = [];
+    const objetivo: string[] = [];
+    for (const l of p.cuerpo) {
+      const c = CRITERIO_RE.exec(l);
+      if (c !== null) criterios.push(c[1] as string);
+      else if (!DURACION_RE.test(l)) objetivo.push(l);
+    }
+    const textoObjetivo = objetivo.join('\n').trim();
+    if (textoObjetivo === '') {
+      throw new TroceoError(`${id}: la parte ${p.letra} ("${p.titulo}") no tiene objetivo: escribe que entrega.`);
+    }
+    if (criterios.length === 0) {
+      throw new TroceoError(
+        `${id}: la parte ${p.letra} ("${p.titulo}") no tiene criterios de aceptacion ("- [ ] ...").`
+      );
+    }
+    return {
+      letra: p.letra,
+      titulo: p.titulo,
+      objetivo: textoObjetivo,
+      criterios,
+      duracion: leerDuracionEstimada(p.cuerpo.join('\n')),
+    };
+  });
+}
+
+function citar(texto: string): string {
+  return texto
+    .split(/\r?\n/)
+    .map((l) => (l.trim() === '' ? '>' : `> ${l.trimEnd()}`))
+    .join('\n');
+}
+
+function objetivoDeParte(task: Task, parte: ParteTroceo, ids: readonly string[]): string {
+  return (
+    `Parte ${parte.letra} del troceo de ${task.id} (${task.titulo}), partes ${ids.join(', ')} ` +
+    `en la rama ${task.rama}.\n\n${parte.objetivo}`
+  );
+}
+
+function criteriosMd(criterios: readonly string[]): string {
+  return criterios.map((c) => `- [ ] ${c}`).join('\n');
+}
+
+const OBJETIVO_RE = /^##\s+objetivo\s*$/i;
+const CRITERIOS_RE = /^##\s+criterios de aceptaci[oó]n\s*$/i;
+
+/**
+ * Reemplaza el contenido de la seccion cuya cabecera casa con `cabecera`
+ * (hasta la siguiente `## `). Si no existe, la anade al principio en el orden
+ * de la plantilla. Conserva las demas secciones (`## Transiciones`, etc.).
+ */
+function reemplazarSeccion(body: string, cabecera: RegExp, titulo: string, contenido: string): string {
+  const eol = body.includes('\r\n') ? '\r\n' : '\n';
+  const lineas = body.split(/\r?\n/);
+  const ini = lineas.findIndex((l) => cabecera.test(l.trim()));
+  const bloque = [titulo, '', ...contenido.split('\n'), ''];
+  if (ini === -1) return [...bloque, ...lineas].join(eol);
+  let fin = ini + 1;
+  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
+  return [...lineas.slice(0, ini), ...bloque, ...lineas.slice(fin)].join(eol);
+}
+
+export interface PlanTroceo {
+  /** La tarea original convertida en la parte a (mismo estado, otro ID). */
+  parteA: { task: Task; body: string };
+  /** Las partes b, c... nuevas, en 00-planificadas. */
+  resto: { task: Task; body: string }[];
+  ids: string[];
+}
+
+/**
+ * Lo que hay que escribir para trocear `task` en `partes`. La parte a es la
+ * propia tarea (conserva su registro de transiciones y su plan); las demas
+ * nacen planificadas, con la misma rama y dependiendo de la anterior.
+ */
+export function planificarTroceo(task: Task, body: string, partes: readonly ParteTroceo[], hoy: string): PlanTroceo {
+  if (!esIdTroceable(task.id)) {
+    throw new TroceoError(`${task.id}: ya es una parte de un troceo; una parte no se vuelve a trocear.`);
+  }
+  const ids = partes.map((p) => `${task.id}${p.letra}`);
+  const [primera, ...siguientes] = partes as [ParteTroceo, ...ParteTroceo[]];
+  const original = body.match(/^##\s+objetivo\s*$/im) === null ? '' : extraerObjetivo(body);
+  const objetivoA =
+    objetivoDeParte(task, primera, ids) + (original === '' ? '' : `\n\nObjetivo de la tarea entera:\n\n${citar(original)}`);
+  let bodyA = reemplazarSeccion(body, OBJETIVO_RE, '## Objetivo', objetivoA);
+  bodyA = reemplazarSeccion(bodyA, CRITERIOS_RE, '## Criterios de aceptacion', criteriosMd(primera.criterios));
+  const parteA = {
+    task: { ...task, id: ids[0] as string, titulo: `${primera.titulo} (parte a de ${task.id})`, actualizado: hoy },
+    body: bodyA,
+  };
+  const resto = siguientes.map((p, i) => ({
+    task: {
+      ...task,
+      id: ids[i + 1] as string,
+      titulo: `${p.titulo} (parte ${p.letra} de ${task.id})`,
+      estado: 'planificada' as const,
+      plan_aprobado: false,
+      asignado_a: null,
+      ultimo_commit_revisado: null,
+      tokens_diseno: null,
+      tokens_implementacion: null,
+      tokens_revision: null,
+      creado: hoy,
+      actualizado: hoy,
+      dependencias: [ids[i] as string],
+    },
+    body: `## Objetivo\n\n${objetivoDeParte(task, p, ids)}\n\n## Criterios de aceptacion\n${criteriosMd(p.criterios)}\n`,
+  }));
+  return { parteA, resto, ids };
+}
+
+function extraerObjetivo(body: string): string {
+  const lineas = body.replace(/\r/g, '').split('\n');
+  const ini = lineas.findIndex((l) => OBJETIVO_RE.test(l.trim()));
+  if (ini === -1) return '';
+  let fin = ini + 1;
+  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
+  return lineas.slice(ini + 1, fin).join('\n').trim();
+}
+
+/**
+ * El plan de la parte a tras trocear: su duracion estimada pasa a la de la
+ * parte a (si la trae) y se anota quien acepto el troceo y cuando.
+ */
+export function planTrasTroceo(plan: string, partes: readonly ParteTroceo[], ids: readonly string[], hoy: string): string {
+  const eol = plan.includes('\r\n') ? '\r\n' : '\n';
+  const primera = partes[0] as ParteTroceo;
+  let texto = plan;
+  if (primera.duracion.tipo === 'ok') {
+    const entera = leerDuracionEstimada(plan);
+    const antes = entera.tipo === 'ok' ? `${String(entera.minutos)} min` : 'sin cifra legible';
+    let hecho = false;
+    let enBloque = false;
+    texto = plan
+      .split(/\r?\n/)
+      .map((l) => {
+        if (/^\s*(```|~~~)/.test(l)) enBloque = !enBloque;
+        if (hecho || enBloque || !DURACION_RE.test(l) || !/^\s*(?:[-*+>#]\s*)*[*_`]*\s*duraci[oó]n estimada/i.test(l)) return l;
+        hecho = true;
+        return `Duracion estimada: ${String((primera.duracion as { minutos: number }).minutos)} min (parte a del troceo; la tarea entera estimaba ${antes})`;
+      })
+      .join(eol);
+  }
+  const base = texto.replace(/(\r?\n)*$/, '');
+  return (
+    `${base}${eol}${eol}## Troceo aceptado${eol}${eol}` +
+    `Troceo aceptado por una persona el ${hoy}: ${ids.join(', ')}, todas en la misma rama. ` +
+    `Este plan es el de ${ids[0] as string}; las demas partes se planifican al empezarlas.${eol}`
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
index b70576b..d48c71c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
@@ -36,7 +36,7 @@ import { parseTareaFile } from '../core/tarea-file.js';
 import { runGit } from './git.js';
 
 const NOMBRE = 'ROADMAP.md';
-const TASK_DIR_RE = /^TASK-\d{3,}$/;
+const TASK_DIR_RE = /^TASK-\d{3,}[a-z]?$/;
 
 /** Para que se prepara: una transicion (reglas estrictas) o `taskctl roadmap --escribir` (explicito). */
 export type ModoRoadmap = 'transicion' | 'escribir';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
index 6b6fc56..6c60dfd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
@@ -24,7 +24,7 @@ import {
 import { parseTareaFile, serializeTareaFile } from '../core/tarea-file.js';
 
 const ALL_STATE_FOLDERS: readonly string[] = Object.values(STATE_FOLDER);
-const TASK_ID_RE = /^TASK-\d{3,}$/;
+const TASK_ID_RE = /^TASK-\d{3,}[a-z]?$/;
 
 export async function listExistingTaskIds(tareasRoot: string): Promise<string[]> {
   const ids: string[] = [];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
index d006eea..a672344 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
@@ -34,7 +34,7 @@ import {
   showFileAtRef,
 } from './git.js';
 
-const TASK_ID_RE = /^TASK-\d{3,}$/;
+const TASK_ID_RE = /^TASK-\d{3,}[a-z]?$/;
 
 /**
  * Ramas locales que cuentan como trabajo abierto: ni la base ni la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/troceo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/troceo.test.ts
new file mode 100644
index 0000000..1b68ea9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/troceo.test.ts
@@ -0,0 +1,198 @@
+/**
+ * TASK-121: troceo de una tarea de mas de una hora en TASK-NNNa, b, c... en la
+ * misma rama. Repos Git temporales reales y el CLI real por spawn.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, writeFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import {
+  ID,
+  CONFIG_AUTO,
+  commitAll,
+  cli,
+  cliOk,
+  git,
+  siguiente,
+  resumen,
+  withRepo,
+  nueva,
+  codigo,
+  dirRevision,
+  rellenarInforme,
+} from '../helpers/automatico-fixtures.js';
+
+const TROCEO = [
+  '## Troceo',
+  '',
+  '### Parte a: IDs con letra',
+  'Que el CLI acepte TASK-001a.',
+  'Duracion estimada: 40 min',
+  '- [ ] new, board y roadmap aceptan el ID',
+  '',
+  '### Parte b: Comando trocear',
+  'El comando que parte la tarea.',
+  '- [ ] trocear crea las partes',
+  '- [ ] el ROADMAP se regenera',
+  '',
+  '### Parte c: Skills',
+  'Las skills explican las dos salidas.',
+  '- [ ] la skill de approve nombra trocear',
+  '',
+].join('\n');
+
+/** TASK-001 en diseno con un plan de 150 min y, si se pide, su seccion de troceo. */
+async function planGrande(repoRoot: string, tareasRoot: string, conTroceo: boolean): Promise<void> {
+  nueva(repoRoot, 'feature', 'Tarea grande');
+  cliOk(repoRoot, ['plan', ID]);
+  await writeFile(
+    path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
+    `# Plan\n\n## Enfoque propuesto\n\nDuracion estimada: 150 min\n\nCambiar app.txt.\n\n${conTroceo ? TROCEO : ''}`,
+    'utf8'
+  );
+  commitAll(repoRoot, `docs(${ID}): plan final`);
+}
+
+test('troceo: con mas de 60 min siguiente pregunta con dos salidas, tambien en automatico, y no trocea solo', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planGrande(repoRoot, tareasRoot, true);
+    const s = siguiente(repoRoot);
+    assert.deepEqual(resumen(s), ['approve', 'preguntar']);
+    const salidas = s.salidas as { opcion: string; comando: string }[];
+    assert.deepEqual(
+      salidas.map((x) => [x.opcion, x.comando]),
+      [
+        ['trocear', `taskctl trocear ${ID}`],
+        ['aprobar-entera', `taskctl approve ${ID}`],
+      ]
+    );
+    // Nada se ha troceado: siguiente solo lee.
+    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-diseno');
+    assert.equal(existsSync(path.join(tareasRoot, '00-planificadas', `${ID}b`)), false);
+    // En texto tambien salen las dos salidas.
+    const texto = cliOk(repoRoot, ['siguiente', ID]).stdout;
+    assert.match(texto, /Salida trocear: taskctl trocear TASK-001/);
+    assert.match(texto, /Salida aprobar-entera: taskctl approve TASK-001/);
+  });
+});
+
+test('troceo: trocear pasa la tarea a TASK-NNNa, crea b y c planificadas con la misma rama y regenera el ROADMAP', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planGrande(repoRoot, tareasRoot, true);
+    const original = (await readTareaFile(tareasRoot, ID))!.task;
+    const r = cliOk(repoRoot, ['trocear', ID]);
+    assert.match(r.stdout, /troceada en TASK-001a, TASK-001b, TASK-001c/);
+
+    assert.equal(await readTareaFile(tareasRoot, ID), null, 'el ID sin letra ya no existe');
+    const a = (await readTareaFile(tareasRoot, `${ID}a`))!;
+    assert.equal(a.task.estado, 'en-diseno');
+    assert.equal(a.task.rama, original.rama);
+    assert.match(a.body, /^- \[ \] new, board y roadmap aceptan el ID$/m);
+    assert.match(a.body, /Objetivo de la tarea entera:/);
+    assert.match(a.body, /^## Transiciones$/m, 'conserva su registro (modo congelado)');
+    assert.ok(existsSync(path.join(tareasRoot, '01-en-diseno', `${ID}a`, 'planificacion', 'plan-final.md')));
+    const plan = await readFile(path.join(tareasRoot, '01-en-diseno', `${ID}a`, 'planificacion', 'plan-final.md'), 'utf8');
+    assert.match(plan, /^Duracion estimada: 40 min/m, 'la parte a hereda su propia estimacion');
+    assert.match(plan, /Troceo aceptado por una persona el \d{4}-\d{2}-\d{2}/);
+
+    for (const [letra, previa] of [['b', 'a'], ['c', 'b']] as const) {
+      const p = (await readTareaFile(tareasRoot, `${ID}${letra}`))!;
+      assert.equal(p.task.estado, 'planificada');
+      assert.equal(p.task.rama, original.rama, `la parte ${letra} comparte la rama`);
+      assert.deepEqual(p.task.dependencias, [`${ID}${previa}`]);
+      assert.ok(p.filePath.includes(`00-planificadas${path.sep}${ID}${letra}`));
+    }
+    const b = (await readTareaFile(tareasRoot, `${ID}b`))!;
+    assert.match(b.body, /^- \[ \] trocear crea las partes$/m);
+    assert.match(b.body, /^- \[ \] el ROADMAP se regenera$/m);
+
+    // Un solo commit en develop, con el ROADMAP ya regenerado y el arbol limpio.
+    assert.equal(git(['status', '--porcelain'], repoRoot), '');
+    assert.match(git(['log', '-1', '--format=%s'], repoRoot).trim(), /^chore\(TASK-001\): troceo en TASK-001a, TASK-001b, TASK-001c$/);
+    const roadmap = await readFile(path.join(tareasRoot, 'ROADMAP.md'), 'utf8');
+    for (const x of ['a', 'b', 'c']) assert.match(roadmap, new RegExp(`TASK-001${x}`));
+    assert.match(git(['show', '--name-only', '--format=', 'HEAD'], repoRoot), /tareas\/ROADMAP\.md/);
+
+    // new da el numero siguiente, sin chocar con las partes.
+    nueva(repoRoot, 'feature', 'Otra');
+    assert.ok(await readTareaFile(tareasRoot, 'TASK-002'));
+    // board y metricas aceptan los IDs con letra.
+    const board = cliOk(repoRoot, ['board']).stdout;
+    // Dentro de 00-planificadas: TASK-001b, TASK-001c y luego TASK-002.
+    assert.ok(board.includes('TASK-001a'));
+    assert.ok(board.indexOf('TASK-001b') < board.indexOf('TASK-001c'));
+    assert.ok(board.indexOf('TASK-001c') < board.indexOf('TASK-002'));
+    cliOk(repoRoot, ['metricas']);
+    cliOk(repoRoot, ['roadmap']);
+  });
+});
+
+test('troceo: las partes comparten la rama; a la abre, se cierra, y b sigue en la misma', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planGrande(repoRoot, tareasRoot, true);
+    cliOk(repoRoot, ['trocear', ID]);
+    const A = `${ID}a`;
+    const B = `${ID}b`;
+    const rama = (await readTareaFile(tareasRoot, A))!.task.rama;
+    assert.deepEqual(resumen(siguiente(repoRoot, A)), ['approve', 'continuar'], 'la parte a ya no pasa de la hora');
+    cliOk(repoRoot, ['approve', A]);
+    cliOk(repoRoot, ['start', A]);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
+    await codigo(repoRoot, 'parte a\n', `feat(${A}): parte a`);
+    cliOk(repoRoot, ['review', A]);
+    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot, A), 'informe-revision-1.md'));
+    cliOk(repoRoot, ['veredicto', A, 'aprobada']);
+    cliOk(repoRoot, ['finish', A]);
+    assert.equal((await readTareaFile(tareasRoot, A))?.task.estado, 'terminada');
+
+    // La parte b se planifica y arranca en la MISMA rama, sin crear otra.
+    const ramasAntes = git(['branch', '--format=%(refname:short)'], repoRoot).trim().split('\n').sort();
+    cliOk(repoRoot, ['plan', B]);
+    await writeFile(
+      path.join(tareasRoot, '01-en-diseno', B, 'planificacion', 'plan-final.md'),
+      '# Plan\n\n## Enfoque propuesto\n\nDuracion estimada: 30 min\n\nSeguir.\n',
+      'utf8'
+    );
+    commitAll(repoRoot, `docs(${B}): plan final`);
+    cliOk(repoRoot, ['approve', B]);
+    cliOk(repoRoot, ['start', B]);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
+    const ramasDespues = git(['branch', '--format=%(refname:short)'], repoRoot).trim().split('\n').sort();
+    assert.deepEqual(ramasDespues, ramasAntes, 'no se crea ninguna rama nueva');
+    assert.equal((await readTareaFile(tareasRoot, B))?.task.estado, 'en-curso');
+  });
+});
+
+test('troceo: sin seccion "## Troceo" trocear falla sin tocar nada', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planGrande(repoRoot, tareasRoot, false);
+    const cabeza = git(['rev-parse', 'HEAD'], repoRoot);
+    const r = cli(repoRoot, ['trocear', ID]);
+    assert.notEqual(r.status, 0);
+    assert.match(r.stderr, /no tiene seccion "## Troceo".*No se ha tocado nada/s);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), cabeza);
+    assert.equal(git(['status', '--porcelain'], repoRoot), '');
+    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-diseno');
+  });
+});
+
+test('troceo: si la persona rechaza el troceo, approve deja la tarea entera, como antes (regresion)', async () => {
+  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
+    await planGrande(repoRoot, tareasRoot, true);
+    const rutaPlan = path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md');
+    await writeFile(rutaPlan, `${await readFile(rutaPlan, 'utf8')}\nMotivo para no trocear: se prueba de punta a punta.\n`, 'utf8');
+    commitAll(repoRoot, `docs(${ID}): motivo`);
+    cliOk(repoRoot, ['approve', ID]);
+    const t = await readTareaFile(tareasRoot, ID);
+    assert.equal(t?.task.plan_aprobado, true);
+    assert.equal(await readTareaFile(tareasRoot, `${ID}a`), null);
+    assert.equal(await readTareaFile(tareasRoot, `${ID}b`), null);
+    assert.match(await readFile(rutaPlan, 'utf8'), /Motivo para no trocear/);
+    // Con el plan aprobado ya no se puede trocear.
+    const r = cli(repoRoot, ['trocear', ID]);
+    assert.notEqual(r.status, 0);
+    assert.match(r.stderr, /plan sin aprobar/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/troceo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/troceo.test.ts
new file mode 100644
index 0000000..db5e189
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/troceo.test.ts
@@ -0,0 +1,122 @@
+/** TASK-121: troceo en partes TASK-NNNa, b, c... Logica pura, sin Git. */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { esIdTroceable, idRaiz, leerPartes, planificarTroceo, planTrasTroceo, TroceoError } from '../../src/core/troceo.js';
+import { nextTaskId } from '../../src/core/task-id.js';
+import { isValidTaskId } from '../../src/core/task.js';
+import { salidasReglaUnaHora, siguienteFase } from '../../src/core/flujo.js';
+import { numerosHeldoutEnRuta } from '../../src/core/heldout.js';
+import { sampleTask } from '../helpers/start-fixtures.js';
+
+const PLAN = [
+  '# Plan',
+  '',
+  '## Enfoque propuesto',
+  '',
+  'Duracion estimada: 150 min',
+  '',
+  '## Troceo',
+  '',
+  '### Parte a: Primera',
+  'Entrega la primera.',
+  'Duracion estimada: 45 min',
+  '- [ ] uno',
+  '',
+  '### Parte b: Segunda',
+  'Entrega la segunda.',
+  '- [ ] dos',
+  '- [x] tres',
+  '',
+  '```',
+  '### Parte z: esto es un ejemplo dentro de codigo',
+  '```',
+  '',
+  '## Plan de pruebas',
+  '',
+  '- [ ] esto no es de ninguna parte',
+].join('\n');
+
+test('leerPartes: lee las partes, su objetivo, criterios y duracion, y para en la siguiente seccion', () => {
+  const partes = leerPartes(PLAN, 'TASK-121');
+  assert.equal(partes.length, 2);
+  assert.deepEqual(partes.map((p) => [p.letra, p.titulo]), [['a', 'Primera'], ['b', 'Segunda']]);
+  assert.equal(partes[0]?.objetivo, 'Entrega la primera.');
+  assert.deepEqual(partes[0]?.criterios, ['uno']);
+  assert.deepEqual(partes[0]?.duracion, { tipo: 'ok', minutos: 45 });
+  assert.deepEqual(partes[1]?.criterios, ['dos', 'tres']);
+  assert.deepEqual(partes[1]?.duracion, { tipo: 'ausente' });
+  assert.doesNotMatch(partes[1]?.objetivo ?? '', /esto no es de ninguna parte/);
+});
+
+test('leerPartes: rechaza plan sin seccion, una sola parte, letras saltadas, parte sin objetivo o sin criterios', () => {
+  assert.throws(() => leerPartes('# Plan\n', 'TASK-1'), (e) => e instanceof TroceoError && /no tiene seccion/.test(e.message));
+  assert.throws(() => leerPartes('## Troceo\n\n### Parte a: x\nobj\n- [ ] c\n', 'TASK-1'), /al menos dos/);
+  assert.throws(
+    () => leerPartes('## Troceo\n\n### Parte a: x\nobj\n- [ ] c\n### Parte c: y\nobj\n- [ ] c\n', 'TASK-1'),
+    /deberia ser "b"/
+  );
+  assert.throws(() => leerPartes('## Troceo\n\n### Parte a: x\n- [ ] c\n### Parte b: y\nobj\n- [ ] c\n', 'TASK-1'), /no tiene objetivo/);
+  assert.throws(() => leerPartes('## Troceo\n\n### Parte a: x\nobj\n### Parte b: y\nobj\n- [ ] c\n', 'TASK-1'), /no tiene criterios/);
+});
+
+test('planificarTroceo: la parte a conserva estado y registro; las demas nacen planificadas con la misma rama', () => {
+  const task = sampleTask({ id: 'TASK-121', estado: 'en-diseno', plan_aprobado: false, asignado_a: 'carlos' });
+  const body = '## Objetivo\n\nTodo.\n\n## Criterios de aceptacion\n- [ ] viejo\n\n## Transiciones\n\n| fila |\n';
+  const t = planificarTroceo(task, body, leerPartes(PLAN, task.id), '2026-11-12');
+  assert.deepEqual(t.ids, ['TASK-121a', 'TASK-121b']);
+  assert.equal(t.parteA.task.id, 'TASK-121a');
+  assert.equal(t.parteA.task.estado, 'en-diseno');
+  assert.match(t.parteA.body, /^- \[ \] uno$/m);
+  assert.doesNotMatch(t.parteA.body, /viejo/);
+  assert.match(t.parteA.body, /^> Todo\.$/m);
+  assert.match(t.parteA.body, /^## Transiciones$/m);
+  const b = t.resto[0]!;
+  assert.equal(b.task.estado, 'planificada');
+  assert.equal(b.task.rama, task.rama);
+  assert.equal(b.task.asignado_a, null);
+  assert.equal(b.task.plan_aprobado, false);
+  assert.deepEqual(b.task.dependencias, ['TASK-121a']);
+  assert.match(b.body, /^- \[ \] dos$/m);
+  assert.throws(() => planificarTroceo({ ...task, id: 'TASK-121a' }, body, leerPartes(PLAN, task.id), 'x'), /no se vuelve a trocear/);
+});
+
+test('planTrasTroceo: la duracion pasa a la de la parte a y se anota la aceptacion', () => {
+  const partes = leerPartes(PLAN, 'TASK-121');
+  const nuevo = planTrasTroceo(PLAN, partes, ['TASK-121a', 'TASK-121b'], '2026-11-12');
+  assert.match(nuevo, /^Duracion estimada: 45 min \(parte a del troceo; la tarea entera estimaba 150 min\)$/m);
+  assert.match(nuevo, /Troceo aceptado por una persona el 2026-11-12: TASK-121a, TASK-121b/);
+  // Sin duracion en la parte a, la linea original no se toca.
+  const sinDur = PLAN.replace('Duracion estimada: 45 min\n', '');
+  assert.match(planTrasTroceo(sinDur, leerPartes(sinDur, 'TASK-121'), ['TASK-121a', 'TASK-121b'], 'x'), /^Duracion estimada: 150 min$/m);
+});
+
+test('IDs con letra: validos, cuentan para la numeracion y la carpeta held-out se protege', () => {
+  assert.equal(isValidTaskId('TASK-121a'), true);
+  assert.equal(isValidTaskId('TASK-121ab'), false);
+  assert.equal(isValidTaskId('TASK-121A'), false);
+  assert.equal(nextTaskId(['TASK-120', 'TASK-121a', 'TASK-121b']), 'TASK-122');
+  assert.equal(esIdTroceable('TASK-121'), true);
+  assert.equal(esIdTroceable('TASK-121a'), false);
+  assert.equal(idRaiz('TASK-121b'), 'TASK-121');
+  assert.deepEqual(numerosHeldoutEnRuta('tareas/02-en-curso/TASK-121a/aceptacion/x.test.ts', '/repo'), [121]);
+});
+
+test('siguiente: con mas de 60 min ofrece trocear y aprobar entera; una parte solo aprobar entera; sin exceso, sin salidas', () => {
+  const base = {
+    planRedactado: true,
+    veredicto: null,
+    veredictoCodex: null,
+    modoCongelado: true,
+    rondaRevision: 0,
+    informeEnCommitPropio: false,
+  };
+  const task = sampleTask({ id: 'TASK-121', estado: 'en-diseno', plan_aprobado: false });
+  for (const modo of ['manual', 'semiautomatico', 'automatico'] as const) {
+    const p = siguienteFase(task, { ...base, duracionEstimada: { tipo: 'ok', minutos: 90 } }, modo);
+    assert.equal(p.accion, 'preguntar', modo);
+    assert.deepEqual(p.salidas?.map((s) => s.opcion), ['trocear', 'aprobar-entera']);
+  }
+  assert.deepEqual(salidasReglaUnaHora('TASK-121a').map((s) => s.opcion), ['aprobar-entera']);
+  const corto = siguienteFase(task, { ...base, duracionEstimada: { tipo: 'ok', minutos: 60 } }, 'automatico');
+  assert.equal(corto.salidas, undefined);
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
tareas/{01-en-diseno => 02-en-curso}/TASK-121/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-121/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-121/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-121/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-121/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-121/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-121/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  34 +++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                                      |  29 +++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/trocear.js                                    |  92 ++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/board-format.js                                   |   9 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                          |  19 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heldout.js                                        |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                                       |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task-id.js                                        |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js                                           |   6 +--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/troceo.js                                         | 214 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/roadmap.js                                          |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/task-store.js                                       |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/wip-scan.js                                         |   2 +-
 20 files changed, 403 insertions(+), 15 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 78.0 s

Final de la salida (truncada: 107318 bytes en total):

````
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.1884ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2133ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1527ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2186ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1746ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1528ms)
✔ resolverAsignado: recorta los tres escalones (0.1581ms)
✔ moveTareaFile (TASK-053): un EPERM que dura dos intentos no impide mover la tarea (94.8479ms)
✔ moveTareaFile (TASK-053): un EBUSY que no cede se propaga tras los reintentos y la tarea sigue en su sitio (198.9738ms)
✔ moveTareaFile (TASK-053, MEN-1 de su revision): un rename que movio la carpeta pero devolvio EPERM se da por bueno (48.5028ms)
✔ moveTareaFile (TASK-053): un error que no es transitorio no se reintenta (21.6999ms)
✔ listTareasEnEstados: tareasRoot inexistente devuelve vacio, no lanza (120.3599ms)
✔ listTareasEnEstados: lee solo las carpetas pedidas, ignorando el resto (354.9373ms)
✔ listTareasEnEstados: un tarea.md ilegible va a "ilegibles", no rompe la lectura (309.6744ms)
✔ listTareasEnEstados: una carpeta de tarea SIN tarea.md dentro se ignora (214.1625ms)
✔ listTareasEnEstados: ignora entradas que no son un ID de tarea (210.8039ms)
✔ listTareasEnEstados: el mismo ID en dos carpetas ocupa un hueco, no dos (346.062ms)
✔ listTareasEnEstados: las rutas ilegibles vienen ordenadas (mensaje reproducible) (433.5323ms)
✔ listTareasEnEstados: acepta cualquier subconjunto de estados, no solo el del WIP (176.7493ms)
✔ listExistingTaskIds: [] si tareas/ ni siquiera existe todavia (98.6083ms)
✔ writeTareaFile + readTareaFile: escribe en la carpeta de su estado y se puede releer (271.947ms)
✔ readTareaFile: null si el ID no existe en ninguna carpeta (65.8496ms)
✔ listExistingTaskIds: agrega ids repartidos en varias carpetas de estado (371.2572ms)
✔ readTareaFile: rechaza un id con path traversal antes de tocar el filesystem (31.4419ms)
✔ writeTareaFile: rechaza un id con path traversal antes de tocar el filesystem (16.3027ms)
✔ writeTareaFile con failIfExists: la segunda escritura al mismo id falla en vez de pisar la primera (152.7388ms)
✔ writeTareaFile sin failIfExists (comportamiento por defecto) SI permite actualizar una tarea existente (287.6093ms)
✔ moveTareaFile: cambia de carpeta cuando el estado cambia y borra la carpeta vieja (310.5869ms)
✔ moveTareaFile: se lleva planificacion/ y revision/ enteras al cambiar de carpeta (item C3) (494.4591ms)
✔ moveTareaFile: si el estado no cambia, solo reescribe el fichero en el mismo sitio (418.1575ms)
✔ moveTareaFile: falla con TaskFolderConflictError si la carpeta destino ya existe (231.1956ms)
ℹ tests 835
ℹ suites 0
ℹ pass 835
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 65467.2965
[verificar-impacto] node --test termino con 0 en 65.6 s.
````
