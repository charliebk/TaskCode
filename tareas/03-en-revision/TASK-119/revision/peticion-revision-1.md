# Peticion de revision — TASK-119 (ronda 1)

- Tarea: TASK-119 — P-11: menos commits de proceso por tarea
- Rama revisada: feature/task-119-p-11-menos-commits-de-proceso-por-tarea
- Rama base: develop
- Commit revisado (HEAD): e9d49dcdee5fe1e024825e90d0717035ed01d936
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-119 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-119/tarea.md
- tareas/03-en-revision/TASK-119/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts

## Commits a revisar (git log develop..HEAD)

````
e9d49dc test(TASK-119): verificacion-selectiva commitea el veredicto antes de cambiar de rama a mano
ab368a1 feat(TASK-119): registrar-coste y veredicto sin commit propio; lo absorbe el siguiente comando de fase
8fb39ec chore(TASK-119): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
index 4d6c111..94ceeaf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
@@ -296,13 +296,13 @@ herramienta Agent) `taskctl` lee la transcripción del subagente en
 `<config>/projects/*/*/subagents/agent-<id>.jsonl` (`<config>` = `CLAUDE_CONFIG_DIR`
 o `~/.claude`) y suma, por `message.id` único (la última aparición), entrada +
 escritura y lectura de caché + salida de cada llamada. Varios `--agente` van en
-un solo registro y un solo commit. Un `--agente` ya anotado en `## Coste` de esa
+un solo registro. Un `--agente` ya anotado en `## Coste` de esa
 fase es un agente reanudado (su transcripción acumula los dos trabajos): se suma
 solo lo que creció su transcripción desde lo ya anotado para ese id, y la fila lo
 marca en su fuente (`agente:dif:<id>`), que `metricas` no avisa como repetida; si
 no ha crecido, o el id está anotado junto a otros en una misma fila, aborta.
-En `--fase revision` cada `--agente` va en **su propia fila** (en el mismo
-commit), con las columnas `ronda` y `revisor` que se deducen de su
+En `--fase revision` cada `--agente` va en **su propia fila** (en la misma
+llamada), con las columnas `ronda` y `revisor` que se deducen de su
 transcripción. Se sacan del nombre `peticion-revision-N[-skill].md` que lleva
 el prompt del revisor. Lo que no se puede deducir queda como `-` («sin
 atribuir»). Con un único `--agente`, `--ronda N [--revisor <skill>]` los
@@ -314,8 +314,14 @@ lecturas, los tokens de entrada y caché, y los CRÍTICO e IMPORTANTE de su info
 orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
 en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
 (`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
-escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
-la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
+escribe solo ese `tarea.md` (aborta si la copia al día de la tarea está en su rama)
+y rechaza cifras de 0. **No commitea** (TASK-119): el cambio queda pendiente en la
+carpeta de la tarea y lo incluye el commit del siguiente comando de fase
+(`approve`, `review` o `finish`, que dejan pasar lo pendiente de la propia tarea y
+lo apartan en un stash mientras corren los scripts de Git-Flow y la
+verificación). Lo mismo hace `taskctl veredicto`. En una tarea ya `terminada`,
+sin fase siguiente, sí commitea, y entonces aborta si ese `tarea.md` tiene cambios
+sin commitear. `taskctl finish`
 avisa, sin bloquear, si falta el coste de diseño o de revisión. El de
 implementación ya no hace falta registrarlo a mano: lo suma `review` (ver
 «Coste de implementación automático»); `registrar-coste --fase implementacion`
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
index 2aa9f1b..e78c4fe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
@@ -31,7 +31,7 @@ Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
    - **Trocear**: ejecuta `taskctl trocear TASK-NNN` y sigue con la parte a
      (`/taskcode-plugin:approve TASK-NNNa`).
    - **Si** (entera): escribe en el plan el motivo para no trocear si pasa de
-     la hora, commitealo y ejecuta `taskctl approve TASK-NNN`.
+     la hora y ejecuta `taskctl approve TASK-NNN` (su commit lo incluye).
    - **No**: pregunta que habria que cambiar y escribelo, con sus palabras, al
      final de `plan-final.md` en una seccion con este encabezado exacto (asi
      sobrevive a la sesion y la re-planificacion lo lee):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index 124f052..5c61680 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -23,8 +23,8 @@ formas de cerrar, todas opcionales salvo la primera, que es la de siempre:
    escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
 2. Comprueba que el `tarea.md` tiene los criterios de aceptacion marcados y
    una seccion `## Resultado` con lo implementado, lo que encontro la
-   revision y lo que se decidio no corregir. Si falta, completalo y
-   commitealo antes.
+   revision y lo que se decidio no corregir. Si falta, completalo (no hace
+   falta commitearlo: `finish` lo incluye en su commit).
 3. Si en el `tarea.md` falta el coste de diseno o de revision
    (`tokens_diseno` o `tokens_revision` a `null`) y lo tienes (los ids de los
    subagentes de esa fase), registralo **antes** de `taskctl finish` con
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
index 5d6d971..90b5f6a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -80,8 +80,7 @@ no deberian necesitar volver a preguntar.
    unificador), `taskctl registrar-coste TASK-NNN --fase diseno --agente <id>
    [--agente <id2>...]`. La cifra que muestra Claude Code al terminar un agente
    NO es su coste (es su contexto final). Tu parte, si quieres, estimada y
-   aparte con `--tokens N`. Sin agentes, no registres nada. Commitea lo escrito en la carpeta de la tarea
-   (`git add <carpeta de la tarea> && git commit -m "docs(TASK-NNN): plan final"`).
-   Los comandos siguientes exigen el workspace limpio.
+   aparte con `--tokens N`. Sin agentes, no registres nada. No commitees: lo escrito en la carpeta
+   de la tarea (plan final, coste) lo incluye el commit de `taskctl approve`.
 7. Sigue la seccion de avance (`task-workflow/avance.md`):
    `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 71fddf9..4a47c23 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -63,15 +63,16 @@ punto, no un formalismo.
    rellenada, su linea `- Veredicto:`, y la fila de ejemplo de la tabla
    borrada (tambien sin hallazgos); un informe que conserve la plantilla sin
    rellenar no cuenta como revisado,
-   y commitealo **solo, en un commit que no toque nada mas**: en modo
+   y dejalo sin commitear: lo incluye el commit del siguiente `taskctl review`
+   o `taskctl finish`. Nunca lo mezcles en un commit con codigo: en modo
    automatico, `finish` no sigue solo si un informe va mezclado con codigo.
 4. Registra el coste de la revision (`task-workflow/coste.md`) con el id que
    devolvio la herramienta Agent de cada revisor:
    `taskctl registrar-coste TASK-NNN --fase revision --agente <id>
    [--agente <id2>...]` (una vez por ronda; suma). La cifra que muestra Claude
    Code al terminar un agente NO es su coste (es su contexto final). Tu parte,
-   si quieres, estimada y aparte con `--tokens N`. Es un commit propio: hazlo
-   despues de commitear los informes.
+   si quieres, estimada y aparte con `--tokens N`. No crea commit: queda
+   pendiente con los informes.
    Escribe cada veredicto con el comando, no a mano:
    `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`.
    Si la ronda esta fragmentada, uno por informe, con el nombre de fichero
@@ -83,8 +84,8 @@ punto, no un formalismo.
    corregir se marca `aceptado` con su motivo en su informe o se pasa a una
    tarea nueva. Nunca se deja nada para la ronda siguiente: corregir de uno en
    uno es lo que convierte trece hallazgos en trece rondas. Lo corregido se
-   marca `corregido` en la columna Estado de su informe (commit aparte del
-   codigo). `taskctl review` avisa si queda alguno sin marcar. En modo
+   marca `corregido` en la columna Estado de su informe (sin mezclarlo en un
+   commit de codigo). `taskctl review` avisa si queda alguno sin marcar. En modo
    automatico, si `siguiente` da `fase: review` con `accion: continuar`, haz tu
    todo eso, commitea, deja la suite en verde y vuelve al paso 2. Desde la
    ronda 2 la ronda es una verificacion acotada: cada revisor comprueba sus
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 7e88ebe..dcacfd2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -89,7 +89,7 @@ tarea nueva, o corregir y abrir otra ronda con `taskctl review TASK-NNN
 En `automatico`, `siguiente` solo pregunta en sus guardas: aprobar una tarea
 sin modo congelado, cerrar hotfix o release, cerrar cuando lo que se
 mergearia no coincide con lo revisado (codigo posterior al `Commit revisado`
-de la peticion, informe sin rellenar o sin commitear), otra ronda desde la
+de la peticion, informe sin rellenar), otra ronda desde la
 ronda 3, y el veredicto de la segunda opinion.
 
 ## Encadenar la skill siguiente (la cadena)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
index 71e8baa..9a02cb0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/coste.md
@@ -82,19 +82,22 @@ dilo como estimacion en el `## Resultado`.
 - **revision**: cuando terminan los revisores de la ronda; si hay varias
   rondas, se va sumando. Funciona tambien con la tarea ya `terminada`.
 
-Escribe y commitea solo el `tarea.md` de la tarea: con ese fichero a medias
-en el arbol aborta, y desde la rama base aborta si la tarea vive en su rama
+Escribe solo el `tarea.md` de la tarea y no commitea: el cambio queda
+pendiente en la carpeta de la tarea y lo incluye el commit del siguiente
+comando de fase (`approve`, `review` o `finish`). En una tarea ya terminada,
+sin fase siguiente, si commitea, y con ese fichero a medias en el arbol
+aborta. Desde la rama base aborta si la tarea vive en su rama
 (dice a cual cambiar). Con una cadena abierta exige `--cadena <testigo>`.
 
 Cada llamada deja ademas una fila en la tabla `## Coste` del cuerpo de
-`tarea.md` (en el mismo commit que el total): con `--agente`, el desglose
+`tarea.md` (junto al total): con `--agente`, el desglose
 sumado de sus agentes (entrada, escritura y lectura de cache, salida, y
 cuantas lecturas de ficheros hicieron); con `--tokens N`, una fila `manual`
 con solo el total. No la edites a mano: el total de la fase sigue siendo el
 campo `tokens_<fase>`, y la tabla es su desglose.
 
 En la fase **revision**, una llamada con varios `--agente` deja **una fila por
-agente** (en un solo commit), no una fila sumada: cada fila lleva la `ronda` y
+agente** (en una sola llamada), no una fila sumada: cada fila lleva la `ronda` y
 el `revisor` del agente, que se deducen de su transcripcion (el nombre
 `peticion-revision-N[-skill].md` que lleva el prompt con el que lo lanzaste;
 sin sufijo si la ronda no se fragmento). Lo que no se pueda deducir queda `-`,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index d423912..f0a7c89 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -138,7 +138,9 @@ las terminadas por la version de taskctl de su ultimo finish (las que no la llev
 anotada, aparte); --json da un unico objeto JSON (solo con --repo, --evolucion,
 --tramo, --grupos y --por-version).
 Un flag repetido que no admite repeticion aborta en cualquier comando.
-registrar-coste SUMA al coste de una fase de la tarea (en cualquier estado) y lo commitea:
+registrar-coste SUMA al coste de una fase de la tarea (en cualquier estado). No commitea: el cambio
+queda pendiente y lo incluye el commit del siguiente comando de fase (en una tarea ya terminada,
+si se commitea).
 --agente <id> lee lo gastado de la transcripcion de cada subagente (el id lo devuelve la
 herramienta Agent); --tokens N da una cifra a mano. Se excluyen, y 0 se rechaza. Cada
 llamada deja ademas una fila en la tabla "## Coste" de tarea.md: con --agente, el desglose
@@ -264,6 +266,20 @@ function printAutoCommit(r: AutoCommitResult): void {
   }
 }
 
+/**
+ * TASK-119: `registrar-coste` y `veredicto` no commitean: lo dicen, igual que
+ * printAutoCommit dice siempre que paso con el commit.
+ */
+function printAutoCommitOPendiente(r: AutoCommitResult | null): void {
+  if (r !== null) {
+    printAutoCommit(r);
+    return;
+  }
+  process.stdout.write(
+    'Sin commit: queda pendiente en la carpeta de la tarea y lo incluye el commit del siguiente comando de fase.\n'
+  );
+}
+
 /**
  * Confirmacion de --asignado-a (item B6). Solo se imprime cuando el
  * flag CAMBIO algo: si la tarea ya venia asignada a esa misma persona,
@@ -975,7 +991,8 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
             'que crecio su transcripcion desde lo anotado (fila "agente:dif:<id>").\n'
         );
       }
-      printAutoCommit(r.autoCommit);
+      printAvisos(...r.avisos);
+      printAutoCommitOPendiente(r.autoCommit);
       return 0;
     } catch (e) {
       if (
@@ -1038,7 +1055,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         `Tarea ${result.id}: "${result.linea}" escrito en ${result.informePath} (ronda ${result.ronda}).
 `
       );
-      printAutoCommit(result.autoCommit);
+      printAutoCommitOPendiente(result.autoCommit);
       return 0;
     } catch (e) {
       if (
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index e429321..8a7ac9a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -48,6 +48,7 @@ import {
 import { nombrePeticionRol } from '../core/plan-brainstorm.js';
 import { planEsEsqueleto } from '../core/validacion-tarea.js';
 import { conProgreso, crearProgreso, type Progreso } from '../fs/progreso.js';
+import { hayCambiosFueraDeTarea } from '../fs/pendientes.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
 import {
   autoCommit,
@@ -171,7 +172,10 @@ async function runApprove(
   // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
   // tiene cambios sin commitear, o si no puede cambiar de forma
   // automatica a la rama base esperada segun initial.task.tipo.
-  const baseBranchGuard = ensureBaseBranchReady(initial!.task.tipo, deps.repoCwd);
+  // TASK-119: lo pendiente de la propia tarea (plan final, coste) no bloquea: entra en este commit.
+  const baseBranchGuard = ensureBaseBranchReady(initial!.task.tipo, deps.repoCwd, (c) =>
+    !hayCambiosFueraDeTarea(c, tareasRoot, initial!.task.id)
+  );
 
   // Lectura FRESCA, ya en la rama base real — la unica que decide si
   // se marca plan_aprobado y con que contenido de partida (etiquetas,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index c0a1f77..fa30fa8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -73,6 +73,12 @@ export interface PuertaVerificacionOpts {
   id: string;
   rama: string;
   tareasRoot: string;
+  /**
+   * TASK-119: se llama justo antes de escribir y commitear una anotacion en
+   * tarea.md (devuelve lo pendiente de la tarea apartado, para que entre en
+   * ese commit). `initial` ya lo incluye: se leyo antes de apartarlo.
+   */
+  antesDeAnotar?: () => void;
   initial: ReadTareaResult;
   sinVerificacion: boolean;
   cwd: string;
@@ -326,6 +332,8 @@ async function anotarYCommitear(
 ): Promise<{ commit: string | null; tarea: ReadTareaResult }> {
   let c: { commit: string | null; avisos: readonly string[] } = { commit: null, avisos: [] };
   if (body !== o.initial.body) {
+    // TASK-119: lo pendiente de la tarea vuelve al arbol y entra en este commit.
+    o.antesDeAnotar?.();
     await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
     c = autoCommit({
       fase: 'finish',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 5f13df2..ed047b7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -88,6 +88,7 @@ import {
 } from '../fs/git-commit.js';
 import { conProgreso, crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
+import { apartarPendientes, hayCambiosFueraDeTarea, recuperarApartado, type Apartado } from '../fs/pendientes.js';
 import { extraerSinVerificacion, puertaReintento, puertaVerificacion, type ResultadoReintento } from './finish-verificacion.js';
 import { puertaHeldout } from './finish-heldout.js';
 import { puertaCobertura } from './finish-cobertura.js';
@@ -331,7 +332,18 @@ export async function runFinishCommand(
 ): Promise<FinishCommandResult> {
   // TASK-110: el progreso se marca terminado tambien si aborta.
   const progreso = deps.progreso ?? crearProgreso(deps.repoCwd);
-  return conProgreso(progreso, () => runFinish(tareasRoot, argv, today, deps, progreso));
+  // TASK-119: si aborta con lo pendiente de la tarea apartado, se devuelve si se
+  // puede sin riesgo; si no (merge a medias), el error dice como recuperarlo.
+  const pendientes: { apartado: Apartado | null } = { apartado: null };
+  return conProgreso(progreso, async () => {
+    try {
+      return await runFinish(tareasRoot, argv, today, deps, progreso, pendientes);
+    } catch (e: unknown) {
+      const nota = pendientes.apartado === null ? null : pendientes.apartado.devolverSiSePuede();
+      if (nota !== null && e instanceof Error) e.message = `${e.message}\n${nota}`;
+      throw e;
+    }
+  });
 }
 
 async function runFinish(
@@ -339,7 +351,8 @@ async function runFinish(
   argv: readonly string[],
   today: string,
   deps: FinishCommandDeps,
-  progreso: Progreso
+  progreso: Progreso,
+  pendientes: { apartado: Apartado | null }
 ): Promise<FinishCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_FINISH, 'finish', (m) => new FinishCommandError(m));
@@ -354,6 +367,10 @@ async function runFinish(
     throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
   }
 
+  // TASK-119: un intento anterior que murio con lo pendiente de la tarea
+  // apartado lo recupera ahora, antes de leer nada (el veredicto vive ahi).
+  recuperarApartado(deps.repoCwd, tareasRoot, id);
+
   // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): rechazo
   // rapido sin tocar Git + metadata estable (tipo/rama/titulo). La
   // lectura que decide la escritura va DESPUES de los merges.
@@ -413,7 +430,10 @@ async function runFinish(
   const rama = initial.task.rama;
   const titulo = initial.task.titulo;
 
-  if (!isWorkspaceClean(deps.repoCwd)) {
+  // TASK-119: lo pendiente de la propia tarea (veredicto, informe, coste) no
+  // cuenta: se aparta durante la verificacion y los merges y entra en el commit
+  // de cierre (o en el de la anotacion de la verificacion, si lo hay).
+  if (hayCambiosFueraDeTarea(deps.repoCwd, tareasRoot, initial.task.id)) {
     throw new FinishCommandError(
       `[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
         'Haz commit o stash antes de "taskctl finish" — los merges de Git-Flow necesitan el ' +
@@ -511,6 +531,11 @@ async function runFinish(
   // TASK-072: la puerta de verificacion, justo antes del primer efecto y solo
   // en los caminos que van a integrar algo (abrir el MR o ejecutar el script).
   // TASK-073: y detras, la de los tests held-out (que --sin-verificacion no salta).
+  // TASK-119: desde aqui empiezan los efectos. Lo pendiente de la tarea se
+  // aparta (la verificacion guarda su memo solo con el arbol limpio y los
+  // scripts lo exigen) y se devuelve antes de la escritura de cierre.
+  const apartado = apartarPendientes(deps.repoCwd, tareasRoot, initial.task.id);
+  pendientes.apartado = apartado;
   const puerta = async () => {
     progreso.paso('verificacion');
     const r = await puertaVerificacion({
@@ -518,6 +543,9 @@ async function runFinish(
       rama,
       tareasRoot,
       initial: initial as NonNullable<typeof initial>,
+      // La lectura preliminar incluye lo pendiente: si la puerta anota y
+      // commitea, lo devuelve antes y entra en ese commit.
+      antesDeAnotar: () => apartado.devolver(),
       sinVerificacion,
       cwd: deps.repoCwd,
       instante: deps.ahora ?? today,
@@ -562,6 +590,7 @@ async function runFinish(
 
   if (mrCtx !== null && mrCtx.estado.tipo === 'ninguno') {
     initial = (await puerta()).tarea;
+    apartado.devolver();
     return abrirMergeRequestYAnotar({
       tareasRoot,
       id,
@@ -736,6 +765,9 @@ async function runFinish(
     }
   }
 
+  // TASK-119: lo pendiente vuelve antes de la lectura fresca, ya con el merge
+  // hecho: entra en el commit de cierre.
+  apartado.devolver();
   progreso.paso('artefactos');
   // Lectura FRESCA, ya en la rama de integracion con el merge consumado: la unica que
   // decide la escritura. El contexto de aprobacion se recalcula sobre
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 867362e..dd03db2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -36,6 +36,7 @@ import { registrarTransicion } from '../core/transiciones.js';
 import { resolverConfig } from '../core/config.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { conProgreso, crearProgreso, type Progreso } from '../fs/progreso.js';
+import { hayCambiosFueraDeTarea } from '../fs/pendientes.js';
 import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
 import {
   autoCommit,
@@ -464,7 +465,10 @@ async function runPlan(
   // metadata estable que ningun comando de taskctl reescribe, asi que
   // usar la lectura preliminar para esto es seguro aunque sea de antes
   // del cambio de rama.
-  const baseBranchGuard = ensureBaseBranchReady(initial!.task.tipo, deps.repoCwd);
+  // TASK-119: lo pendiente de la propia tarea (plan final, coste) no bloquea: entra en este commit.
+  const baseBranchGuard = ensureBaseBranchReady(initial!.task.tipo, deps.repoCwd, (c) =>
+    !hayCambiosFueraDeTarea(c, tareasRoot, initial!.task.id)
+  );
 
   // Lectura FRESCA, ya en la rama base real (si hubo cambio, aqui es
   // donde se nota) — esta es la unica que decide si se muta algo y con
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index 4fa2f93..d9d250f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -120,7 +120,14 @@ export interface RegistrarCosteCommandResult {
   /** TASK-081: todas las filas anadidas; mas de una solo con `--fase revision` y varios agentes. */
   filas: FilaCoste[];
   filePath: string;
-  autoCommit: AutoCommitResult;
+  /**
+   * TASK-119: null si no se commitea (lo normal: el cambio queda pendiente en la
+   * carpeta de la tarea y lo absorbe el siguiente comando de fase). Solo una
+   * tarea ya terminada, sin fase siguiente, se commitea aqui.
+   */
+  autoCommit: AutoCommitResult | null;
+  /** Avisos no fatales (p. ej. --push sin commit que subir). */
+  avisos: string[];
 }
 
 const USO =
@@ -461,9 +468,11 @@ export async function runRegistrarCosteCommand(
         `Cambia a ella (git checkout ${task.rama}) y reintenta; no se ha tocado nada.`
     );
   }
-  // El commit es de este fichero entero: con ediciones a medias en el, se
-  // las llevaria.
-  if (runGit(['status', '--porcelain', '--', filePath], deps.repoCwd) !== '') {
+  // TASK-119: solo una tarea terminada se commitea aqui (no tiene fase
+  // siguiente que lo absorba). Ese commit es de este fichero entero: con
+  // ediciones a medias en el, se las llevaria.
+  const commitea = task.estado === 'terminada';
+  if (commitea && runGit(['status', '--porcelain', '--', filePath], deps.repoCwd) !== '') {
     throw new RegistrarCosteCommandError(
       `[ERROR] ${id}: tarea.md tiene cambios sin commitear. Commitealos o descartalos antes de ` +
         '"taskctl registrar-coste": su commit se los llevaria. No se ha tocado nada.'
@@ -536,13 +545,19 @@ export async function runRegistrarCosteCommand(
   await writeFile(filePath, serializeTareaFile(nueva, cuerpo), 'utf8');
 
   const detalle = nAgentes > 0 ? ` (${String(nAgentes)} agente${nAgentes === 1 ? '' : 's'})` : '';
-  const commit = autoCommit({
-    fase: 'registrar-coste',
-    cwd: deps.repoCwd,
-    rutas: [filePath],
-    mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens${detalle}`),
-    push,
-  });
+  const avisos: string[] = [];
+  const commit = commitea
+    ? autoCommit({
+        fase: 'registrar-coste',
+        cwd: deps.repoCwd,
+        rutas: [filePath],
+        mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens${detalle}`),
+        push,
+      })
+    : null;
+  if (!commitea && push) {
+    avisos.push(`${id}: --push no tiene efecto: el coste queda sin commitear hasta el siguiente comando de fase.`);
+  }
   return {
     id,
     fase,
@@ -554,5 +569,6 @@ export async function runRegistrarCosteCommand(
     filas,
     filePath,
     autoCommit: commit,
+    avisos,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 64bbe63..b931362 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -59,7 +59,6 @@ import {
 import { fenceFor } from '../core/markdown.js';
 import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
-  isWorkspaceClean,
   currentBranch,
   resolveBaseBranchForTipo,
   gitflowBaseArgs,
@@ -81,6 +80,7 @@ import {
 } from '../fs/git-commit.js';
 import { conProgreso, crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
+import { conPendientesApartados, hayCambiosFueraDeTarea, recuperarApartado } from '../fs/pendientes.js';
 import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
 import { excluirDeRevision } from '../fs/revisores-rango.js';
 import { avisoAutorrevision } from '../core/autorrevision.js';
@@ -702,6 +702,10 @@ async function runReview(
     throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
   }
 
+  // TASK-119: un intento anterior que murio con lo pendiente de la tarea
+  // apartado lo recupera ahora, antes de leer nada (el veredicto vive ahi).
+  recuperarApartado(deps.repoCwd, tareasRoot, id);
+
   // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): sirve
   // para rechazo rapido sin tocar Git y para extraer tipo/rama —
   // metadata estable que ningun comando reescribe. La lectura que
@@ -736,7 +740,10 @@ async function runReview(
 
   // Mismo motivo que en start: el prompt interactivo de Git-Flow con
   // stdin no interactivo cancela en silencio (EOF => "No" => exit 0).
-  if (!isWorkspaceClean(deps.repoCwd)) {
+  // TASK-119: lo pendiente de la propia tarea (coste, veredicto, informe) no
+  // cuenta: se aparta mientras corren el script y la verificacion, y entra en
+  // el commit de la ronda.
+  if (hayCambiosFueraDeTarea(deps.repoCwd, tareasRoot, initial!.task.id)) {
     throw new ReviewCommandError(
       `[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
         'Haz commit o stash antes de "taskctl review" — el update de Git-Flow necesita el ' +
@@ -750,10 +757,12 @@ async function runReview(
   // base entraria en el delta); exige estar ya en la rama de la tarea.
   const { code, signal } = incremental
     ? { code: 0, signal: null }
-    : runGitflowScript(scriptName, [rama, ...gitflowBaseArgs(tipo, deps.repoCwd)], {
-        scriptsDir: deps.scriptsDir,
-        cwd: deps.repoCwd,
-      });
+    : conPendientesApartados(deps.repoCwd, tareasRoot, initial!.task.id, () =>
+        runGitflowScript(scriptName, [rama, ...gitflowBaseArgs(tipo, deps.repoCwd)], {
+          scriptsDir: deps.scriptsDir,
+          cwd: deps.repoCwd,
+        })
+      );
   if (code !== 0) {
     const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
     throw new ReviewCommandError(
@@ -879,9 +888,13 @@ async function runReview(
   // update de Git-Flow ya integro la base (y ese merge queda hecho); en una
   // incremental la rama no se actualiza (TASK-040). Sin la clave, nada.
   progreso.paso('verificacion');
-  const verificacion = verificacionDeRonda(id, configRama, baseBranch, tipo, incremental, deps, avisos, () =>
-    // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
-    entornoConContador(deps.env ?? process.env, progreso.contador())
+  // TASK-119: con lo pendiente apartado, el arbol queda limpio y la huella de
+  // la verificacion casa con la del hook Stop (y se guarda su memo).
+  const verificacion = conPendientesApartados(deps.repoCwd, tareasRoot, task.id, () =>
+    verificacionDeRonda(id, configRama, baseBranch, tipo, incremental, deps, avisos, () =>
+      // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
+      entornoConContador(deps.env ?? process.env, progreso.contador())
+    )
   );
   // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
   // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index f591dd5..b586502 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -91,20 +91,19 @@ export interface SiguienteCommandResult extends SiguientePaso {
  *   repo (`:(top)`, no solo bajo el cwd: MEN-7): el codigo que se va a
  *   mergear es el que vio el revisor. Esto cubre tambien el informe
  *   commiteado junto a codigo (ese codigo aparece en el diff), que antes se
- *   tapaba con el commit limpio de `taskctl veredicto`;
- * - y no hay cambios sin commitear en la carpeta `revision/`.
+ *   tapaba con el commit limpio de `taskctl veredicto`.
+ * TASK-119: un informe sin commitear en `revision/` ya no lo impide: desde
+ * que `veredicto` no commitea es lo normal, y lo absorbe el commit de
+ * `finish`. Lo que se integra sigue siendo el codigo que vio el revisor.
  * Que el informe no sea la plantilla lo comprueba `informeRellenado`.
- * `dirRevision` es la ruta POSIX relativa a la raiz del repo, acabada en /.
  */
 function informeEnCommitPropio(
   ref: string,
-  dirRevision: string,
   nombres: readonly string[],
   revisados: readonly (string | null)[],
   cwd: string
 ): boolean {
   if (nombres.length === 0 || revisados.length === 0) return false;
-  if (ref === 'HEAD' && runGit(['status', '--porcelain', '--', dirRevision], cwd) !== '') return false;
   const tareasDesdeLaRaiz = `${runGit(['rev-parse', '--show-prefix'], cwd)}tareas/`;
   for (const revisado of revisados) {
     if (revisado === null || !isAncestor(revisado, ref, cwd)) return false;
@@ -165,7 +164,6 @@ export async function runSiguienteCommand(
   // Para la guarda del commit propio y el tope de rondas (TASK-059).
   let rondaRevision: number;
   let nombresPrimarios: string[];
-  let dirRevisionRepo: string;
   let refInformes: string;
   let revisados: (string | null)[];
   if (enOtraRama) {
@@ -186,7 +184,6 @@ export async function runSiguienteCommand(
     const ultima = nombresDeUltimaRonda(nombres, INFORME_REVISION_RE);
     rondaRevision = ultima.ronda;
     nombresPrimarios = ultima.nombres;
-    dirRevisionRepo = dirRevision;
     refInformes = rama;
     primarios = ultima.nombres.map(leer);
     revisados = nombresDeUltimaRonda(nombres, PETICION_REVISION_RE).nombres.map((n) => commitRevisadoDe(leer(n)));
@@ -199,7 +196,6 @@ export async function runSiguienteCommand(
     const ultima = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
     rondaRevision = ultima.ronda;
     nombresPrimarios = ultima.nombres;
-    dirRevisionRepo = `${path.relative(deps.repoCwd, revisionDir).split(path.sep).join('/')}/`;
     refInformes = 'HEAD';
     primarios = await Promise.all(ultima.nombres.map(leer));
     revisados = (
@@ -235,9 +231,7 @@ export async function runSiguienteCommand(
   const enCommitPropio =
     task.estado === 'en-revision' &&
     rellenados &&
-    informeEnCommitPropio(refInformes, dirRevisionRepo, nombresPrimarios, referencias, deps.repoCwd);
-  const revisionLimpia =
-    refInformes !== 'HEAD' || runGit(['status', '--porcelain', '--', dirRevisionRepo], deps.repoCwd) === '';
+    informeEnCommitPropio(refInformes, nombresPrimarios, referencias, deps.repoCwd);
 
   const menores = menoresAbiertos(primarios);
   const ctx: ContextoFlujo = {
@@ -257,7 +251,6 @@ export async function runSiguienteCommand(
             !enCommitPropio &&
             !alDia &&
             rellenados &&
-            revisionLimpia &&
             correccion !== null &&
             correccion.cambiados.length > 0 &&
             // IMP-1 de la revision: solo si son correcciones de MENORES que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index c789b94..483b216 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -25,12 +25,7 @@ import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { readTareaFile } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
-import {
-  autoCommit,
-  extraerPushFlag,
-  mensajeChore,
-  type AutoCommitResult,
-} from '../fs/git-commit.js';
+import { extraerPushFlag, type AutoCommitResult } from '../fs/git-commit.js';
 import { REVISION_DIRNAME } from './review.js';
 
 export class VeredictoCommandError extends Error {}
@@ -63,7 +58,12 @@ export interface VeredictoCommandResult {
    * el campo por contrato con quien lo lee.
    */
   avisos: string[];
-  autoCommit: AutoCommitResult;
+  /**
+   * TASK-119: siempre null. El veredicto ya no se commitea: queda pendiente en
+   * la carpeta de la tarea y lo absorbe el siguiente comando de fase (otra
+   * `review` o `finish`). Se conserva el campo por contrato con quien lo lee.
+   */
+  autoCommit: AutoCommitResult | null;
 }
 
 const PREFIJO = '- veredicto:';
@@ -186,12 +186,8 @@ export async function runVeredictoCommand(
   // algo que ya no distingue nada. `avisos` se conserva en el resultado.
   const avisos: string[] = [];
 
-  const commitResult = autoCommit({
-    fase: 'veredicto',
-    cwd: deps.repoCwd,
-    rutas: [informePath],
-    mensaje: mensajeChore(task.id, `veredicto ronda ${ronda} (${valor})`),
-    push,
-  });
-  return { id: task.id, ronda, informePath, linea, avisos, autoCommit: commitResult };
+  if (push) {
+    avisos.push(`${task.id}: --push no tiene efecto: el veredicto queda sin commitear hasta el siguiente comando de fase.`);
+  }
+  return { id: task.id, ronda, informePath, linea, avisos, autoCommit: null };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index af40840..b067982 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -325,7 +325,7 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
             return paso(
               'finish',
               true,
-              'la revision esta aprobada, pero lo que se cerraria no coincide con lo revisado (codigo posterior al Commit revisado, informe sin rellenar o sin commitear, o peticion sin Commit revisado): el cierre lo decide una persona',
+              'la revision esta aprobada, pero lo que se cerraria no coincide con lo revisado (codigo posterior al Commit revisado, informe sin rellenar, o peticion sin Commit revisado): el cierre lo decide una persona',
               `taskctl finish ${task.id}`,
               true
             );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 77b6236..dffb8aa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -829,7 +829,16 @@ export interface BaseBranchGuardResult {
  * (comitear y subir lo que el comando genere) queda fuera de alcance a
  * proposito — ver el Objetivo de TASK-012 en su tarea.md.
  */
-export function ensureBaseBranchReady(tipo: Task['tipo'], cwd: string): BaseBranchGuardResult {
+export function ensureBaseBranchReady(
+  tipo: Task['tipo'],
+  cwd: string,
+  /**
+   * TASK-119: si se da, decide que el arbol esta limpio a efectos de la guarda
+   * (p. ej. todo menos lo pendiente de la propia tarea). Cambiar de rama exige
+   * igualmente el arbol entero limpio.
+   */
+  limpioSalvoTarea?: (cwd: string) => boolean
+): BaseBranchGuardResult {
   const branchAntes = currentBranch(cwd);
 
   // Comprobacion sin red ANTES de resolver la rama base (que para
@@ -841,17 +850,18 @@ export function ensureBaseBranchReady(tipo: Task['tipo'], cwd: string): BaseBran
   // menciona. Desde TASK-026 tambien nombra "taskctl pause", como el
   // ejemplo de la 8.3 — hasta entonces se omitia porque ese comando
   // no existia (hallazgo MENOR de revision por pares, TASK-026).
-  if (!isWorkspaceClean(cwd)) {
-    throw new BaseBranchGuardError(
+  const sucio = (): BaseBranchGuardError =>
+    new BaseBranchGuardError(
       `[ERROR] Hay cambios sin guardar en "${branchAntes}". Guardalos ("taskctl pause") o ` +
         'comitealos antes de continuar.'
     );
-  }
+  if (!(limpioSalvoTarea ?? isWorkspaceClean)(cwd)) throw sucio();
 
   const baseBranch = resolveBaseBranchForTipo(tipo, cwd);
   if (branchAntes === baseBranch) {
     return { baseBranch, switched: false, branchAntes };
   }
+  if (limpioSalvoTarea !== undefined && !isWorkspaceClean(cwd)) throw sucio();
 
   const remoteAvailable = isRemoteAvailable(cwd);
   const existeLocal = localBranchExists(baseBranch, cwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
new file mode 100644
index 0000000..c42f0bc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
@@ -0,0 +1,182 @@
+/**
+ * Lo pendiente de la carpeta de una tarea (TASK-119, P-11).
+ *
+ * `registrar-coste` y `veredicto` ya no commitean: lo que escriben se queda
+ * sin commitear en la carpeta de la tarea y lo absorbe el commit del
+ * siguiente comando de fase. Para eso, las guardas de esos comandos dejan
+ * pasar los cambios bajo `tareas/<estado>/<ID>/` (cualquier estado: un
+ * movimiento deja alta y baja) y siguen abortando con cualquier otro.
+ *
+ * Los scripts de Git-Flow y la verificacion necesitan el arbol limpio (el
+ * script lo comprueba; la verificacion guarda su memo solo con el arbol
+ * limpio). Mientras corren, lo pendiente se aparta en un stash con nombre
+ * propio y se devuelve antes de escribir y commitear. Si el comando muere
+ * con el stash puesto, el siguiente intento lo recupera al empezar
+ * (`recuperarApartado`), antes de leer la tarea: el veredicto vive en lo
+ * apartado.
+ */
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { GitCommandError, runGit } from './git.js';
+
+export class PendientesError extends Error {}
+
+/** Pathspec (relativo a la raiz del repo) de todas las carpetas de estado de la tarea. */
+function pathspecTarea(cwd: string, tareasRoot: string, id: string): string {
+  const prefijo = runGit(['rev-parse', '--show-prefix'], cwd);
+  const tareas = path.relative(cwd, tareasRoot).split(path.sep).join('/');
+  return `${prefijo}${tareas}/*/${id}/**`;
+}
+
+/** Mensaje del stash: lo que permite reconocerlo en un intento posterior. */
+export function mensajeApartado(id: string): string {
+  return `taskctl ${id}: pendientes de la tarea`;
+}
+
+/** true si la carpeta de la tarea tiene cambios sin commitear. */
+export function hayPendientesDeTarea(cwd: string, tareasRoot: string, id: string): boolean {
+  const spec = pathspecTarea(cwd, tareasRoot, id);
+  return runGit(['status', '--porcelain', '-uall', '--', `:(top,glob)${spec}`], cwd) !== '';
+}
+
+/** true si hay cambios sin commitear FUERA de la carpeta de la tarea. */
+export function hayCambiosFueraDeTarea(cwd: string, tareasRoot: string, id: string): boolean {
+  const spec = pathspecTarea(cwd, tareasRoot, id);
+  return runGit(['status', '--porcelain', '--', ':(top)', `:(top,glob,exclude)${spec}`], cwd) !== '';
+}
+
+/** Referencia (`stash@{n}`) del stash de la tarea, o null si no hay. */
+function refApartado(cwd: string, id: string): string | null {
+  const sufijo = `: ${mensajeApartado(id)}`;
+  const lineas = runGit(['stash', 'list', '--format=%gd%x09%gs'], cwd).split('\n');
+  for (const linea of lineas) {
+    const [ref, asunto] = linea.split('\t');
+    if (ref !== undefined && asunto !== undefined && asunto.endsWith(sufijo)) return ref;
+  }
+  return null;
+}
+
+/** Como recuperar a mano un stash que no se pudo devolver. */
+function comoRecuperar(id: string): string {
+  return (
+    `Lo pendiente de la tarea (coste, veredicto, informe) esta en el stash "${mensajeApartado(id)}": ` +
+    'recuperalo con git stash list y git stash pop <ref> cuando el arbol este limpio.'
+  );
+}
+
+function pop(cwd: string, id: string, ref: string): void {
+  try {
+    runGit(['stash', 'pop', '-q', ref], cwd);
+  } catch (e: unknown) {
+    const detalle = e instanceof GitCommandError ? e.stderr.trim() : String(e);
+    throw new PendientesError(`[ERROR] ${id}: no se pudo devolver lo pendiente de la tarea (${detalle}). ${comoRecuperar(id)}`);
+  }
+}
+
+/**
+ * Recupera el stash de un intento anterior que murio con lo pendiente
+ * apartado. Si ademas hay cambios nuevos en la carpeta, no mezcla: aborta.
+ * Devuelve true si habia algo que recuperar.
+ */
+export function recuperarApartado(cwd: string, tareasRoot: string, id: string): boolean {
+  const ref = refApartado(cwd, id);
+  if (ref === null) return false;
+  if (hayPendientesDeTarea(cwd, tareasRoot, id)) {
+    throw new PendientesError(
+      `[ERROR] ${id}: hay un stash de un intento anterior ("${mensajeApartado(id)}", ${ref}) y la carpeta de la ` +
+        'tarea tiene cambios nuevos: no se mezclan solos. Commitea o descarta los nuevos, o aplica el stash a mano, ' +
+        'y reintenta. No se ha tocado nada.'
+    );
+  }
+  pop(cwd, id, ref);
+  return true;
+}
+
+export interface Apartado {
+  /** true mientras lo pendiente esta en el stash. */
+  readonly activo: boolean;
+  /** Lo devuelve al arbol. Sin efecto si no habia nada apartado o ya se devolvio. */
+  devolver(): void;
+  /**
+   * Para los caminos de error: lo devuelve si se puede sin riesgo (sin merge a
+   * medias); si no, devuelve el texto que dice como recuperarlo a mano.
+   */
+  devolverSiSePuede(): string | null;
+}
+
+/** Anade a un error el texto de como recuperar lo apartado, si lo hay. */
+function conNota(e: unknown, nota: string | null): unknown {
+  if (nota !== null && e instanceof Error) e.message = `${e.message}\n${nota}`;
+  return e;
+}
+
+/**
+ * Ejecuta `fn` (algo que necesita el arbol limpio: un script de Git-Flow, la
+ * verificacion) con lo pendiente de la tarea apartado, y lo devuelve al
+ * terminar. Si `fn` lanza, lo devuelve si se puede sin riesgo; si no, el error
+ * dice como recuperarlo.
+ */
+export function conPendientesApartados<T>(cwd: string, tareasRoot: string, id: string, fn: () => T): T {
+  const apartado = apartarPendientes(cwd, tareasRoot, id);
+  let r: T;
+  try {
+    r = fn();
+  } catch (e: unknown) {
+    throw conNota(e, apartado.devolverSiSePuede());
+  }
+  apartado.devolver();
+  return r;
+}
+
+/** Igual que conPendientesApartados, para una `fn` asincrona. */
+export async function conPendientesApartadosAsync<T>(
+  cwd: string,
+  tareasRoot: string,
+  id: string,
+  fn: () => Promise<T>
+): Promise<T> {
+  const apartado = apartarPendientes(cwd, tareasRoot, id);
+  let r: T;
+  try {
+    r = await fn();
+  } catch (e: unknown) {
+    throw conNota(e, apartado.devolverSiSePuede());
+  }
+  apartado.devolver();
+  return r;
+}
+
+/** Aparta lo pendiente de la tarea en un stash con nombre propio (nada si no hay). */
+export function apartarPendientes(cwd: string, tareasRoot: string, id: string): Apartado {
+  let activo = false;
+  if (hayPendientesDeTarea(cwd, tareasRoot, id)) {
+    const spec = pathspecTarea(cwd, tareasRoot, id);
+    runGit(['stash', 'push', '-q', '-u', '-m', mensajeApartado(id), '--', `:(top,glob)${spec}`], cwd);
+    activo = true;
+  }
+  const devolver = (): void => {
+    if (!activo) return;
+    const ref = refApartado(cwd, id);
+    activo = false;
+    if (ref === null) throw new PendientesError(`[ERROR] ${id}: el stash de lo pendiente ha desaparecido. ${comoRecuperar(id)}`);
+    pop(cwd, id, ref);
+  };
+  return {
+    get activo() {
+      return activo;
+    },
+    devolver,
+    devolverSiSePuede(): string | null {
+      if (!activo) return null;
+      if (existsSync(path.resolve(cwd, runGit(['rev-parse', '--git-path', 'MERGE_HEAD'], cwd)))) {
+        return comoRecuperar(id);
+      }
+      try {
+        devolver();
+        return null;
+      } catch (e: unknown) {
+        return e instanceof Error ? e.message : String(e);
+      }
+    },
+  };
+}
````

## Excluido del diff (19 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-119/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-119/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-119/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-119/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-119/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-119/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-119/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  20 +++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                    |   4 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        |   2 ++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  38 ++++++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       |   4 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js                            |  29 +++++++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |  21 +++++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                                  |  18 ++++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js                                  |  14 +++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                                          |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                              |  18 +++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/pendientes.js                                       | 159 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 19 files changed, 280 insertions(+), 52 deletions(-)
````

## Tests del diff (5 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts        | 182 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste-agente.test.ts |  22 ++++++-------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/registrar-coste.test.ts        |  51 ++++++++++++++++++-----------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts              |  11 +++----
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts |   2 ++
 5 files changed, 232 insertions(+), 36 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 137.5 s
- Commit verificado: e9d49dcdee5fe1e024825e90d0717035ed01d936
- Huella: 5928096cba3c3e08bf8257fd965e751bc2e2404c
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 145905 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.7017ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6231ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0785ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (5.3039ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (8.9347ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (1.0182ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.9102ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (7.1817ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.9028ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3997ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3424ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.5517ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3504ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.5028ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (51.2103ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.1591ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.9028ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.5315ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.346ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2254ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1868ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2006ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2035ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2734ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2169ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2211ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1586ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1759ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1667ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1741ms)
✔ resolverAsignado: recorta los tres escalones (0.1877ms)
ℹ tests 886
ℹ suites 0
ℹ pass 885
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 125357.2749
[verificar-impacto] node --test termino con 0 en 125.5 s.
````
