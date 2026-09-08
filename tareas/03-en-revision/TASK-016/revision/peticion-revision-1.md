# Peticion de revision — TASK-016 (ronda 1)

- Tarea: TASK-016 — Brainstorm paralelo por roles con agente unificador
- Rama revisada: feature/task-016-brainstorm-paralelo-por-roles-con-agente
- Rama base: develop
- Commit revisado (HEAD): 154368d4119e25223c75df15257f9caeac3dd03a
- Fecha: 2026-09-08
- Agente revisor sugerido: typescript-reviewer

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
154368d docs(TASK-016): efecto medido del max sobre las 32 tareas del repo
a4419c5 feat(TASK-016): brainstorm paralelo por roles con agente unificador
869fa8e chore(TASK-016): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-016/planificacion/plan-final.md b/tareas/02-en-curso/TASK-016/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-016/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-016/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-016/tarea.md b/tareas/02-en-curso/TASK-016/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-016/tarea.md
rename to tareas/02-en-curso/TASK-016/tarea.md
index 43f1581..183a008 100644
--- a/tareas/01-en-diseno/TASK-016/tarea.md
+++ b/tareas/02-en-curso/TASK-016/tarea.md
@@ -6,7 +6,7 @@ sprint: 3
 etiquetas: []
 complejidad: alta
 modelo_sugerido: opus
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-016-brainstorm-paralelo-por-roles-con-agente
 asignado_a: charlie.bk@gmail.com
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
index 2d15c01..0b5f041 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
@@ -8,6 +8,8 @@ import { runImportCommand, ImportCommandError } from './commands/import.js';
 import { runBoardCommand, BoardCommandError } from './commands/board.js';
 import { runStartCommand, StartCommandError } from './commands/start.js';
 import { runPlanCommand, PlanCommandError } from './commands/plan.js';
+import { HeuristicaError } from './core/heuristica.js';
+import { RolesBrainstormError } from './core/roles-brainstorm.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
@@ -121,6 +123,42 @@ function asignacionNotice(result) {
         return '';
     return `Asignada a "${result.asignadoA}".\n`;
 }
+/**
+ * Que ha dejado escrito el brainstorm (TASK-016). Se imprimen las
+ * rutas porque son lo unico accionable: quien orquesta la sesion tiene
+ * que abrir esas peticiones y lanzarlas. Un "brainstorm preparado" sin
+ * rutas obligaria a ir a buscarlas.
+ *
+ * La discrepancia de complejidad se dice SOLO cuando la hay, al
+ * contrario que dentro de la peticion del unificador (donde va
+ * siempre): aqui compite por la atencion con el resto de la salida del
+ * comando, y ahi es el unico contenido de su seccion.
+ */
+function brainstormNotice(result) {
+    const lineas = [];
+    if (result.resolucion.hayDiscrepancia) {
+        lineas.push(`Complejidad declarada "${result.resolucion.nivelDeclarado}", heuristica ` +
+            `"${result.resolucion.nivelHeuristico}" (${result.resolucion.puntos} puntos): se lanzan ` +
+            `${result.resolucion.agentes}, el mayor de los dos.`);
+    }
+    if (result.roles.length === 0) {
+        lineas.push(`Sin brainstorm (complejidad "${result.resolucion.nivelDeclarado}" resuelve 0 roles). ` +
+            `Redacta el plan y aprueba con "taskctl approve ${result.id}".`);
+    }
+    else if (result.brainstormReutilizado) {
+        lineas.push(`Re-planificacion (ronda ${result.ronda}): NO se relanza el brainstorm. Lanza solo el ` +
+            `unificador con ${result.peticionUnificador}, que reprocesa las salidas de la ronda ` +
+            `anterior mas tu feedback.`);
+    }
+    else {
+        lineas.push(`Brainstorm ronda ${result.ronda}, ${result.roles.length} rol(es) en paralelo. Lanza cada ` +
+            'peticion con el agente que nombra y luego el unificador:');
+        for (const p of result.peticionesRol)
+            lineas.push(`  - ${p}`);
+        lineas.push(`  - ${result.peticionUnificador} (el ultimo, cuando esten las salidas)`);
+    }
+    return `${lineas.join('\n')}\n`;
+}
 /**
  * Avisos de asignacion (TASK-024) por stderr: no son errores, el
  * comando ha hecho su trabajo, pero la persona necesita enterarse.
@@ -150,7 +188,13 @@ export async function main(argv) {
         try {
             const result = await runNewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
             printBaseBranchSwitchNotice(result.baseBranchGuard);
-            process.stdout.write(`Tarea ${result.id} creada: ${result.filePath}\n`);
+            process.stdout.write(`Tarea ${result.id} creada: ${result.filePath}\n` +
+                // Se dice AQUI y no solo cuando "plan" falle: desde TASK-016
+                // "plan" aborta si el objetivo esta vacio, y "new" lo deja
+                // vacio a proposito. Enterarse de la precondicion en el
+                // momento en que la incumples es peor que saberla al crear.
+                'Rellena "## Objetivo" y los criterios de aceptacion antes de "taskctl plan": el ' +
+                'brainstorm se lanza a partir de ese texto.\n');
             printAutoCommit(result.autoCommit);
             return 0;
         }
@@ -286,13 +330,16 @@ export async function main(argv) {
                 scaffoldMsg = `${result.planPath} ya existia (re-planificacion) — se dejo intacto.`;
             }
             process.stdout.write(`Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
-                asignacionNotice(result));
+                asignacionNotice(result) +
+                brainstormNotice(result));
             printAutoCommit(result.autoCommit);
             return 0;
         }
         catch (e) {
             if (e instanceof AutoCommitError ||
                 e instanceof ConfigError ||
+                e instanceof HeuristicaError ||
+                e instanceof RolesBrainstormError ||
                 e instanceof PlanCommandError ||
                 e instanceof StateMachineError ||
                 e instanceof TaskFolderConflictError ||
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js
index f2db3a6..9fb1a6d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js
@@ -1,23 +1,25 @@
 /**
- * taskctl plan — TASK-010 de PLAN_SPRINTS.md. Version MINIMA de la
- * fase de diseno (seccion 6 de la metodologia): sin contexto
- * determinista desde docs/INDEX.md, sin gatekeeper barato (Haiku), sin
- * seleccion de skill (6.6), sin brainstorm multi-agente en paralelo —
- * todo eso es Sprint 3 (TASK-016/017). Tampoco implementa la
- * precondicion completa de rama base (seccion 8.3) SI la aplica desde
- * TASK-012 (ensureBaseBranchReady, antes de mover nada) — lo que
- * quedo pendiente para "taskctl start" en TASK-009 (seccion 8.3 no
- * aplica a start, que ya cambia de rama como parte de su propio
- * trabajo).
+ * taskctl plan — la fase de diseno de la seccion 6 de la metodologia.
+ * Nacio en TASK-010 como version minima (un solo scaffold) y TASK-016
+ * (item D1) la convirtio en el orquestador determinista del brainstorm
+ * paralelo por roles.
  *
- * Lo que SI hace: validar la transicion, mover la tarea a
- * 01-en-diseno/, y dejar un scaffold de planificacion/plan-final.md
- * (la subcarpeta es de TASK-027, item C3) listo para que
- * un agente (o una persona, en uso interactivo real de Claude Code) lo
- * redacte — el mismo patron que "taskctl new" ya usa con el cuerpo de
- * tarea.md (Objetivo/Criterios en blanco para rellenar despues). El
- * contenido real del plan NO lo genera este CLI: no hay orquestacion
- * de agentes aqui todavia.
+ * QUE HACE, y donde esta la linea. El CLI resuelve SIN LLM todo lo que
+ * es lookup o escritura: cuantos roles entran (tabla de
+ * scripts/heuristica-complejidad.yml), cuales (orden fijo de
+ * core/roles-brainstorm.ts), con que contexto acotado va cada uno
+ * (seccion 16.2) y en que ficheros se deja todo. Luego escribe las
+ * peticiones y para. NO invoca ningun modelo: quien orquesta la sesion
+ * las dispara y vuelca las respuestas en los scaffolds. Es el mismo
+ * reparto que TASK-013 fijo para "taskctl review", y por el mismo
+ * motivo — un CLI que llama a un agente no se puede probar sin uno.
+ *
+ * LO QUE SIGUE SIN HACER: contexto determinista desde docs/INDEX.md,
+ * gatekeeper barato para la discrepancia de complejidad y seleccion de
+ * skill (6.6, TASK-017).
+ *
+ * Aplica la precondicion de rama base de la seccion 8.3 desde TASK-012
+ * (ensureBaseBranchReady, antes de mover nada).
  */
 import path from 'node:path';
 import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
@@ -28,9 +30,28 @@ import { assertTransitionAllowed } from '../core/state-machine.js';
 import { ensureBaseBranchReady, gitUserEmail } from '../fs/git.js';
 import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
 import { resolverAsignado } from '../core/wip.js';
+import { siguienteRonda } from '../fs/rondas.js';
+import { extraerSecciones } from '../core/tarea-body.js';
+import { cargarHeuristica, resolverNumeroAgentes, } from '../core/heuristica.js';
+import { seleccionarRoles } from '../core/roles-brainstorm.js';
+import { nombrePeticionRol, nombreSalidaRol, nombrePeticionUnificador, peticionRolTemplate, salidaRolTemplate, peticionUnificadorTemplate, } from '../core/plan-brainstorm.js';
 export class PlanCommandError extends Error {
 }
 export const PLAN_FINAL_FILENAME = 'plan-final.md';
+/**
+ * Subcarpeta del brainstorm, DENTRO de `planificacion/` y no colgando
+ * de la raiz de la carpeta de tarea. No es cosmetica: asi el `rename`
+ * de moveTareaFile se la lleva entera al cambiar de estado y el
+ * autoCommit del paso 5 de la 8.3 ya la cubre con el dirname de la
+ * tarea, sin tocar su lista de rutas ni anadir un caso especial.
+ */
+export const BRAINSTORM_DIRNAME = 'brainstorm';
+/**
+ * Los tres tipos de fichero que numera una ronda de brainstorm. Se
+ * deduce la ronda del disco, no de una clave del frontmatter: un
+ * contador guardado seria un segundo sitio donde vive la misma verdad.
+ */
+const RONDA_BRAINSTORM_RE = /^(?:peticion-brainstorm-[a-z]+|salida-brainstorm-[a-z]+|peticion-unificador)-(\d+)\.md$/;
 /**
  * Subcarpeta de artefactos de diseno dentro de la carpeta de la tarea
  * (TASK-027, item C3). La seccion 2 de la metodologia describe cada
@@ -93,15 +114,26 @@ export async function resolverPlanFinal(taskDir) {
         legadaExiste: await existeFichero(legada),
     };
 }
-export function planTemplate(task) {
+/**
+ * El scaffold del plan final. Lo rellena el agente unificador
+ * siguiendo `brainstorm/peticion-unificador-<ronda>.md`, que es donde
+ * viven las instrucciones largas; aqui solo van las secciones, para
+ * que el fichero no le repita al agente lo que ya tiene delante.
+ */
+export function planTemplate(task, roles) {
+    const origen = roles.length === 0
+        ? '(Esta tarea no lanza brainstorm: su complejidad resuelve 0 roles. El plan\n' +
+            'se redacta directamente a partir del enunciado.)\n'
+        : `(Lo consolida el agente unificador a partir de ${roles.length} rol(es) de\n` +
+            `brainstorm lanzados en paralelo: ${roles.map((r) => r.titulo).join(', ')}.\n` +
+            'Los desacuerdos entre roles se senalan, no se promedian.)\n';
     return (`# Plan — ${task.id}: ${task.titulo}\n\n` +
-        '## Enfoque propuesto\n\n\n' +
-        '## Alternativas consideradas\n\n' +
-        '(Version minima de "taskctl plan", TASK-010: sin brainstorm multi-agente\n' +
-        'todavia. Un solo agente redacta este plan. TASK-016 anadira brainstorm\n' +
-        'en paralelo con roles distintos y un agente unificador para tareas de\n' +
-        'complejidad media o mayor.)\n\n' +
-        '## Riesgos o preguntas abiertas\n\n');
+        origen +
+        '\n## Enfoque propuesto\n\n\n' +
+        '## Desacuerdos entre roles, y como se resuelven\n\n\n' +
+        '## Riesgos aceptados y que los contiene\n\n\n' +
+        '## Plan de pruebas\n\n\n' +
+        '## Lo que necesita decision de una persona\n\n');
 }
 export async function runPlanCommand(tareasRoot, argv, today, deps) {
     // El ID sale de los POSICIONALES, no de argv[0] a secas (item B6):
@@ -175,6 +207,40 @@ export async function runPlanCommand(tareasRoot, argv, today, deps) {
         asignado_a: asignadoFinal,
         actualizado: today,
     };
+    // --- Resolucion determinista del brainstorm (TASK-016) -------------
+    // Va ANTES de cualquier escritura y de mover nada: todo lo que puede
+    // abortar tiene que abortar con la tarea intacta.
+    //
+    // Un fallo aqui NO cae al comportamiento de antes: si el YML de la
+    // heuristica falta o esta corrupto, "plan" para. Es la doctrina de
+    // config.ts (fallo cerrado) y aqui pesa mas todavia, porque la
+    // alternativa seria planificar en silencio con cero roles y que nadie
+    // se entere de que el brainstorm no se hizo.
+    const heuristica = cargarHeuristica();
+    const resolucion = resolverNumeroAgentes(task, body, heuristica);
+    const roles = seleccionarRoles(resolucion.agentes);
+    const secciones = extraerSecciones(body);
+    // Puerta del objetivo vacio. "taskctl new" deja el Objetivo en blanco
+    // a proposito, y mientras "plan" solo escribia un scaffold eso era
+    // inofensivo. Con N agentes detras deja de serlo: cada rol recibiria
+    // una peticion sin sustancia, devolveria una invencion distinta, y el
+    // unificador las consolidaria en un plan-final.md CON AUTORIDAD que
+    // nadie podria distinguir de uno bien fundado.
+    //
+    // Se aplica SOLO cuando iba a escribirse al menos una peticion: con 0
+    // roles el comportamiento es identico al de antes de TASK-016, asi
+    // que ninguna tarea existente cambia de conducta por esto.
+    //
+    // No es un caso hipotetico: es exactamente lo que paso al planificar
+    // la propia TASK-016, cuyo Objetivo estaba vacio — y de paso hundio
+    // su puntuacion heuristica, porque las palabras de riesgo son la
+    // unica senal del YML que mira el contenido del trabajo.
+    if (roles.length > 0 && secciones.objetivo === '') {
+        throw new PlanCommandError(`[ERROR] ${task.id}: el "## Objetivo" de tarea.md esta vacio, y esta tarea lanza ` +
+            `${roles.length} agente(s) de brainstorm. Sin objetivo cada rol se inventaria el suyo y ` +
+            'el plan resultante pareceria fundado sin serlo. Escribe el objetivo en ' +
+            `"${filePath}" y reintenta. La tarea no se ha movido.`);
+    }
     // El plan se escribe/migra en la carpeta ACTUAL, ANTES de mover la
     // tarea de estado — mismo orden y mismo motivo que "review" con
     // revision/ (TASK-013): si una escritura falla, la tarea no se ha
@@ -229,7 +295,10 @@ export async function runPlanCommand(tareasRoot, argv, today, deps) {
         // dos cosas — decide y protege — y ademas cierra la ventana entre
         // el stat de resolverPlanFinal y esta escritura.
         try {
-            await writeFile(ubicacion.canonica, planTemplate(task), { encoding: 'utf8', flag: 'wx' });
+            await writeFile(ubicacion.canonica, planTemplate(task, roles), {
+                encoding: 'utf8',
+                flag: 'wx',
+            });
             planCreated = true;
         }
         catch (e) {
@@ -257,6 +326,48 @@ export async function runPlanCommand(tareasRoot, argv, today, deps) {
             }
         }
     }
+    // --- El paquete de brainstorm (TASK-016) ---------------------------
+    // Se escribe en la carpeta ACTUAL y ANTES de mover la tarea, por el
+    // mismo motivo que la peticion de revision en TASK-013: si una
+    // escritura falla a mitad, la tarea sigue donde estaba y reintentar
+    // es posible. El orden inverso dejaria el estado movido sin
+    // peticiones, que es un callejon de la maquina de estados.
+    const brainstormDir = path.join(planificacionDir, BRAINSTORM_DIRNAME);
+    const ronda = await siguienteRonda(brainstormDir, RONDA_BRAINSTORM_RE);
+    // Re-planificacion (bucle B9->B5 de la 16.3): si ya hubo una ronda,
+    // NO se relanza el brainstorm entero. El feedback de la persona sobre
+    // el plan es una correccion incremental, y tratarla como un reinicio
+    // es donde mas se gasta sin que nadie lo note, precisamente porque
+    // cada vuelta parece barata. Solo reprocesa el unificador.
+    const brainstormReutilizado = ronda > 1;
+    try {
+        await mkdir(brainstormDir, { recursive: true });
+        if (!brainstormReutilizado) {
+            for (const rol of roles) {
+                const otros = roles.filter((r) => r.id !== rol.id);
+                await writeFile(path.join(brainstormDir, nombrePeticionRol(rol, ronda)), peticionRolTemplate(updated, secciones.objetivo, secciones.criterios, rol, otros, ronda, today), { encoding: 'utf8', flag: 'wx' });
+                await writeFile(path.join(brainstormDir, nombreSalidaRol(rol, ronda)), salidaRolTemplate(updated, rol, ronda), { encoding: 'utf8', flag: 'wx' });
+            }
+        }
+        // La peticion del unificador se escribe SIEMPRE la ULTIMA. Es el
+        // testigo barato de "el brainstorm se escribio entero": si el
+        // proceso muere a mitad, su ausencia lo dice sin necesidad de
+        // inventar un fichero de estado ni una clave de frontmatter.
+        await writeFile(path.join(brainstormDir, nombrePeticionUnificador(ronda)), peticionUnificadorTemplate(updated, secciones.objetivo, secciones.criterios, roles, ronda, today, resolucion, path.posix.join('..', PLAN_FINAL_FILENAME)), { encoding: 'utf8', flag: 'wx' });
+    }
+    catch (e) {
+        if (!isEexist(e))
+            throw e;
+        // Mismo razonamiento que con plan-final.md (TASK-027): open() con
+        // O_CREAT|O_EXCL contesta EEXIST tambien cuando la ruta la ocupa un
+        // DIRECTORIO, y la numeracion de ronda ya garantiza que el hueco
+        // estaba libre. Tragarse este EEXIST dejaria "plan" diciendo que
+        // todo fue bien con un brainstorm a medias escrito.
+        throw new PlanCommandError(`[ERROR] ${task.id}: no se pudo escribir la ronda ${ronda} de brainstorm en ` +
+            `"${brainstormDir}" porque alguna de sus rutas ya esta ocupada (¿restos con otro case ` +
+            'en un filesystem case-insensitive, o una carpeta con el nombre de un fichero?). ' +
+            'Limpia o renombra esa ruta y reintenta. La tarea no se ha movido.');
+    }
     const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
     const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
     // Paso 5 de la 8.3 (TASK-030, item C2): la carpeta de ORIGEN entra
@@ -270,6 +381,12 @@ export async function runPlanCommand(tareasRoot, argv, today, deps) {
         mensaje: mensajeChore(task.id, 'tarea en diseno'),
         push,
     });
+    // Las rutas del brainstorm se recalculan contra la carpeta de
+    // DESTINO: se escribieron en la de origen y el rename se las llevo,
+    // asi que las de arriba ya no apuntan a nada. Devolver rutas muertas
+    // seria peor que no devolverlas — el CLI las imprime para que la
+    // persona las abra.
+    const brainstormDirFinal = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, BRAINSTORM_DIRNAME);
     return {
         autoCommit: commitResult,
         id: task.id,
@@ -277,6 +394,17 @@ export async function runPlanCommand(tareasRoot, argv, today, deps) {
         planPath,
         planCreated,
         planMigrado,
+        ronda,
+        resolucion,
+        roles,
+        // Vacio en una re-planificacion: las peticiones de rol son las de
+        // la ronda anterior y llevan SU numero, no este. Componer aqui la
+        // ruta con la ronda actual devolveria ficheros que no existen.
+        peticionesRol: brainstormReutilizado
+            ? []
+            : roles.map((rol) => path.join(brainstormDirFinal, nombrePeticionRol(rol, ronda))),
+        peticionUnificador: path.join(brainstormDirFinal, nombrePeticionUnificador(ronda)),
+        brainstormReutilizado,
         asignadoA: asignadoFinal,
         asignadoCambiado,
         avisoIdentidad,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js
index 9dc39d2..3ca33b6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js
@@ -18,8 +18,10 @@
  * aprobado), no cuando se genera la peticion.
  */
 import path from 'node:path';
-import { mkdir, readdir, writeFile } from 'node:fs/promises';
-import { readTareaFile, moveTareaFile, isEnoent, isEexist } from '../fs/task-store.js';
+import { mkdir, writeFile } from 'node:fs/promises';
+import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
+import { siguienteRonda } from '../fs/rondas.js';
+import { fenceFor } from '../core/markdown.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { isWorkspaceClean, currentBranch, resolveBaseBranchForTipo, isAncestor, headCommit, logOneline, diffRange, } from '../fs/git.js';
 import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
@@ -35,22 +37,12 @@ const SCRIPT_BY_TYPE = {
 export const REVISION_DIRNAME = 'revision';
 const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)\.md$/;
 /**
- * Valla de backticks mas larga que cualquier apertura/cierre de valla
- * presente en el contenido embebido (CommonMark tolera hasta 3
- * espacios de sangria, que es justo lo que produce una linea de
- * contexto de diff con backticks a columna 0 — hallazgo MENOR de
- * revision por pares, TASK-013: con valla fija de 4, un diff cuyo
- * contexto contenga ```` cerraba el bloque antes de tiempo).
+ * fenceFor se mudo a core/markdown.ts en TASK-016, cuando "plan"
+ * empezo a embeber tambien texto de la persona en sus peticiones. Se
+ * re-exporta desde aqui para no romper a quien la importe de este
+ * modulo, que es donde nacio.
  */
-export function fenceFor(...contents) {
-    let max = 3;
-    for (const content of contents) {
-        for (const m of content.matchAll(/^ {0,3}(`{3,})/gm)) {
-            max = Math.max(max, m[1].length);
-        }
-    }
-    return '`'.repeat(max + 1);
-}
+export { fenceFor } from '../core/markdown.js';
 export function peticionTemplate(task, baseBranch, commitRevisado, ronda, fecha, commits, diff) {
     const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
     const diffBlock = diff === '' ? '(sin diferencias respecto a la base)' : diff;
@@ -92,28 +84,6 @@ export function informeTemplate(task, commitRevisado, ronda) {
         '## Hallazgos\n\n' +
         '(CRITICO / IMPORTANTE / MENOR con reproduccion, o "sin hallazgos" explicito.)\n');
 }
-/**
- * Primera ronda libre: 1 + el mayor N entre los
- * peticion-revision-N.md / informe-revision-N.md ya presentes.
- */
-async function siguienteRonda(revisionDir) {
-    let entries;
-    try {
-        entries = await readdir(revisionDir);
-    }
-    catch (e) {
-        if (isEnoent(e))
-            return 1;
-        throw e;
-    }
-    let max = 0;
-    for (const entry of entries) {
-        const m = RONDA_FILE_RE.exec(entry);
-        if (m !== null)
-            max = Math.max(max, Number(m[1]));
-    }
-    return max + 1;
-}
 export async function runReviewCommand(tareasRoot, argv, today, deps) {
     const { push, resto } = extraerPushFlag(argv);
     const id = resto[0];
@@ -182,7 +152,7 @@ export async function runReviewCommand(tareasRoot, argv, today, deps) {
     // pisar una revision anterior — mismo principio que plan-final.md.
     const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
     await mkdir(revisionDir, { recursive: true });
-    const ronda = await siguienteRonda(revisionDir);
+    const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);
     try {
         await writeFile(path.join(revisionDir, `peticion-revision-${ronda}.md`), peticionTemplate(updated, baseBranch, commitRevisado, ronda, today, commits, diff), { encoding: 'utf8', flag: 'wx' });
         await writeFile(path.join(revisionDir, `informe-revision-${ronda}.md`), informeTemplate(updated, commitRevisado, ronda), { encoding: 'utf8', flag: 'wx' });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heuristica.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heuristica.js
new file mode 100644
index 0000000..396e068
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/heuristica.js
@@ -0,0 +1,609 @@
+/**
+ * `scripts/heuristica-complejidad.yml` — lectura, validacion y las
+ * cuatro operaciones que ese fichero habilita: puntuar una tarea,
+ * traducir la puntuacion a un nivel, mirar en la tabla cuantos agentes
+ * de brainstorm pide ese nivel, y resolver el numero final para una
+ * tarea concreta.
+ *
+ * Hasta hoy el YML no lo leia nadie desde `src/`: existia con sus
+ * tests pero sin consumidor. Este modulo es ese consumidor.
+ *
+ * MISMA DOCTRINA QUE src/core/config.ts, y por los mismos motivos:
+ *
+ * 1. FALLO CERRADO. Una clave desconocida, una clave obligatoria
+ *    ausente, un valor del tipo equivocado o un numero negativo
+ *    ABORTAN. Nunca hay caida al default en silencio. Aqui la regla
+ *    aprieta MAS que en config.yml: alli las tres claves son
+ *    opcionales porque un repo sin configuracion es normal; aqui NO
+ *    hay defaults en codigo y las 22 claves son obligatorias, porque
+ *    este fichero lo distribuye el propio plugin y una clave que falta
+ *    no significa "usa lo de siempre", significa que el fichero esta
+ *    roto o que alguien lo edito a medias.
+ * 2. UN SOLO PARSER. El bucle `clave: valor` es el de frontmatter.ts,
+ *    via parseBloqueClaveValor(). Aqui no hay ni una linea de parseo
+ *    de YAML. Se le pasa `permitirComentariosDeLinea: true` porque el
+ *    fichero empieza por un comentario: sin eso la lectura falla en su
+ *    primera linea, y el propio YML lo avisa.
+ * 3. UN SOLO PUNTO DE RESOLUCION. cargarHeuristica() devuelve la
+ *    heuristica ya validada; ningun comando lee el fichero por su
+ *    cuenta.
+ *
+ * ------------------------------------------------------------------
+ * DIVERGENCIA DELIBERADA CON LA SECCION 5 DEL YML (aprobada por
+ * Carlos, 2026-09-08).
+ *
+ * La seccion 5 del fichero dice que, cuando el nivel heuristico y el
+ * declarado por la persona disten mas de `tolerancia_niveles`
+ * escalones, se consulte a un modelo barato para desempatar. Este
+ * modulo NO hace eso, porque el CLI no invoca modelos: `taskctl` hace
+ * lo determinista y deja escrito lo que otro tiene que disparar (mismo
+ * reparto que `taskctl review` establecio en TASK-013). Meter aqui una
+ * llamada a un modelo cambiaria esa frontera entera.
+ *
+ * En su lugar, resolverNumeroAgentes() resuelve la discrepancia SIN
+ * consultar a nadie: se queda con el MAYOR de los dos numeros de
+ * agentes. Es la eleccion conservadora en la direccion que el propio
+ * YML senala como la cara ("infraestimar deja la tarea con menos
+ * revision de la que necesita"), y ademas nunca ignora lo que la
+ * persona declaro: si declara mas de lo que la heuristica ve, manda lo
+ * declarado. La discrepancia no se traga: sale en
+ * `ResolucionAgentes.hayDiscrepancia` junto con los dos niveles y las
+ * senales, para que quien orqueste pueda mostrarla o consultarla el.
+ *
+ * EFECTO MEDIDO DEL MAX, sobre las 32 tareas reales del repo el
+ * 2026-09-08 (no es una estimacion: se ejecuto sobre ellas):
+ *
+ *   - Declarado y heuristico coinciden en 7 de 32.
+ *   - CERO tareas disparan una sola palabra de alto riesgo. La senal
+ *     mas cara del YML — la unica que mira el CONTENIDO del trabajo y
+ *     no su forma — no se activa nunca, porque los objetivos estan
+ *     escritos en vocabulario de metodologia y no de dominio tecnico.
+ *     La puntuacion acaba gobernada por etiquetas, dependencias y
+ *     numero de criterios, y por eso infraestima de forma sistematica.
+ *   - NINGUNA tarea acaba con 0 roles. El reparto real es 14 tareas
+ *     con 1 rol, 14 con 2 y 4 con 3.
+ *
+ * Ese ultimo punto merece leerse dos veces, porque es una consecuencia
+ * que la decision no perseguia: el YML dice "0 en trivial (no se paga
+ * un brainstorm para algo trivial)", y con el max ese 0 es
+ * practicamente inalcanzable — basta que la tarea declare dos
+ * dependencias, o cinco criterios de aceptacion, para que la
+ * heuristica la suba a `simple` y el max le ponga un rol. La unica
+ * tarea declarada `trivial` del repo (TASK-005) sale con 1.
+ *
+ * No se corrige por cuenta propia porque el max lo aprobo Carlos con
+ * el caso delante, y respetar el suelo del declarado seria reabrir esa
+ * decision. Queda escrito aqui y fijado en un test para que sea una
+ * eleccion consciente y no un descubrimiento dentro de seis meses.
+ *
+ * CONSECUENCIA QUE HAY QUE DECIR EN VOZ ALTA: `tolerancia_niveles`,
+ * `tolerancia_extra_si_heuristica_menor` y
+ * `modelo_consulta_discrepancia` SE PARSEAN Y SE VALIDAN, PERO HOY NO
+ * TIENEN NINGUN CONSUMIDOR. No las lee nadie para decidir nada. Se
+ * siguen validando para que el fichero no pueda degradarse sin que
+ * salte nada, y estan en la interfaz `Heuristica` para que quien
+ * implemente la consulta a un modelo (fuera del CLI) las tenga. Pero
+ * no se finge que se aplican: hoy el comportamiento seria identico si
+ * el fichero dijera `tolerancia_niveles: 99`. Este proyecto ya se
+ * quemo con `codex-review`, una clave documentada e inexistente; la
+ * respuesta a eso es decirlo, no disimularlo.
+ * ------------------------------------------------------------------
+ */
+import { readFileSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import { parseBloqueClaveValor } from './frontmatter.js';
+import { extraerSecciones, normalizarTexto } from './tarea-body.js';
+export class HeuristicaError extends Error {
+    constructor(message) {
+        super(message);
+        this.name = 'HeuristicaError';
+    }
+}
+/**
+ * Las claves cuyo valor es un entero >= 0. El orden es el del fichero,
+ * para que el mensaje de "clave desconocida" las enumere en el mismo
+ * orden en que estan escritas y sea facil compararlos a ojo.
+ */
+const CLAVES_NUMERICAS = [
+    'peso_etiqueta_adicional',
+    'peso_palabra_alto_riesgo',
+    'peso_dependencia',
+    'peso_tipo_release',
+    'peso_tipo_hotfix_con_palabra_riesgo',
+    'peso_criterios_aceptacion',
+    'umbral_criterios_aceptacion',
+    'nivel_trivial_hasta',
+    'nivel_simple_hasta',
+    'nivel_media_hasta',
+    'nivel_alta_hasta',
+    'nivel_critica_desde',
+    'agentes_brainstorm_trivial',
+    'agentes_brainstorm_simple',
+    'agentes_brainstorm_media',
+    'agentes_brainstorm_alta',
+    'agentes_brainstorm_critica',
+    'agentes_brainstorm_hotfix',
+    'tolerancia_niveles',
+    'tolerancia_extra_si_heuristica_menor',
+];
+const CLAVE_PALABRAS = 'palabras_alto_riesgo';
+const CLAVE_MODELO = 'modelo_consulta_discrepancia';
+/** Las unicas claves admitidas. Cualquier otra aborta (regla 1). */
+export const CLAVES_HEURISTICA = [
+    ...CLAVES_NUMERICAS,
+    CLAVE_PALABRAS,
+    CLAVE_MODELO,
+];
+/** Nombre del fichero dentro de `scripts/`. */
+export const FICHERO_HEURISTICA = 'heuristica-complejidad.yml';
+/** Claves de `Senal.clave`. Son la unica forma de agrupar las senales. */
+export const SENAL_ETIQUETAS = 'etiquetas_adicionales';
+export const SENAL_PALABRA = 'palabra_alto_riesgo';
+export const SENAL_DEPENDENCIA = 'dependencias';
+export const SENAL_RELEASE = 'tipo_release';
+export const SENAL_HOTFIX_RIESGO = 'tipo_hotfix_con_palabra_riesgo';
+export const SENAL_CRITERIOS = 'criterios_aceptacion';
+function packageRoot() {
+    // dist/src/core/heuristica.js -> dist/src/core -> dist/src -> dist -> raiz
+    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+    return path.join(moduleDir, '..', '..', '..');
+}
+/**
+ * Ruta del YML. Mismo patron que resolveGitflowScriptsDir(): respeta
+ * CLAUDE_PLUGIN_ROOT (convencion documentada para cuando Claude Code
+ * lanza taskctl como comando de plugin) si esta definida; si no,
+ * calcula la ruta relativa al propio modulo compilado, necesario para
+ * el dogfooding directo, donde esa variable no esta puesta.
+ */
+export function resolverRutaHeuristica() {
+    const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+    if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
+        return path.join(pluginRoot, 'scripts', FICHERO_HEURISTICA);
+    }
+    return path.join(packageRoot(), 'scripts', FICHERO_HEURISTICA);
+}
+/**
+ * EL punto de resolucion. Lee el fichero y lo valida, o lanza
+ * HeuristicaError.
+ *
+ * No hay caso de "no hay fichero, usa los defaults": el YML lo
+ * distribuye el plugin, asi que si falta es que la instalacion esta
+ * rota, y seguir con unos pesos inventados en codigo daria numeros que
+ * no se corresponden con ningun fichero que nadie pueda leer.
+ *
+ * No cachea, por el mismo motivo que resolverConfig: una cache seria
+ * estado global compartido entre tests.
+ */
+export function cargarHeuristica(ruta) {
+    const rutaFinal = ruta ?? resolverRutaHeuristica();
+    let contenido;
+    try {
+        contenido = readFileSync(rutaFinal, 'utf8');
+    }
+    catch (e) {
+        const msg = e instanceof Error ? e.message : String(e);
+        throw new HeuristicaError(`[ERROR] No se pudo leer la heuristica de complejidad "${rutaFinal}": ${msg}\n` +
+            '        Ese fichero lo trae el plugin. Reinstalalo, o define CLAUDE_PLUGIN_ROOT\n' +
+            '        apuntando a la raiz del plugin si lo ejecutas desde otro sitio.');
+    }
+    return parsearHeuristica(contenido, rutaFinal);
+}
+/**
+ * Separada de cargarHeuristica para poder probar el parseo y la
+ * validacion sin disco, y para que el mensaje de error siempre pueda
+ * nombrar el fichero de donde salio el problema.
+ */
+export function parsearHeuristica(contenido, ruta) {
+    const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
+        etiqueta: 'heuristica de complejidad',
+        crearError: (mensaje) => new HeuristicaError(`[ERROR] ${ruta}: ${mensaje}`),
+        permitirComentariosDeLinea: true,
+    });
+    const numeros = new Map();
+    let palabras;
+    let modelo;
+    const vistas = new Set();
+    for (const par of pares) {
+        const donde = `${ruta}:${par.numeroLinea}`;
+        if (!CLAVES_HEURISTICA.includes(par.clave)) {
+            throw new HeuristicaError(mensajeClaveDesconocida(donde, par.clave));
+        }
+        // Una clave repetida se pisaria en silencio (el ultimo gana) y el
+        // fichero diria una cosa mientras el plugin usa otra: mismo dano
+        // que un default silencioso, misma respuesta.
+        if (vistas.has(par.clave)) {
+            throw new HeuristicaError(`[ERROR] ${donde}: la clave "${par.clave}" esta repetida.\n` +
+                '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.');
+        }
+        vistas.add(par.clave);
+        if (par.clave === CLAVE_PALABRAS) {
+            palabras = validarListaDeTexto(donde, par.clave, par.valor);
+        }
+        else if (par.clave === CLAVE_MODELO) {
+            modelo = validarTextoNoVacio(donde, par.clave, par.valor);
+        }
+        else {
+            numeros.set(par.clave, validarEnteroNoNegativo(donde, par.clave, par.valor));
+        }
+    }
+    const h = {
+        peso_etiqueta_adicional: exigirNumero(numeros, 'peso_etiqueta_adicional', ruta),
+        peso_palabra_alto_riesgo: exigirNumero(numeros, 'peso_palabra_alto_riesgo', ruta),
+        peso_dependencia: exigirNumero(numeros, 'peso_dependencia', ruta),
+        peso_tipo_release: exigirNumero(numeros, 'peso_tipo_release', ruta),
+        peso_tipo_hotfix_con_palabra_riesgo: exigirNumero(numeros, 'peso_tipo_hotfix_con_palabra_riesgo', ruta),
+        peso_criterios_aceptacion: exigirNumero(numeros, 'peso_criterios_aceptacion', ruta),
+        umbral_criterios_aceptacion: exigirNumero(numeros, 'umbral_criterios_aceptacion', ruta),
+        nivel_trivial_hasta: exigirNumero(numeros, 'nivel_trivial_hasta', ruta),
+        nivel_simple_hasta: exigirNumero(numeros, 'nivel_simple_hasta', ruta),
+        nivel_media_hasta: exigirNumero(numeros, 'nivel_media_hasta', ruta),
+        nivel_alta_hasta: exigirNumero(numeros, 'nivel_alta_hasta', ruta),
+        nivel_critica_desde: exigirNumero(numeros, 'nivel_critica_desde', ruta),
+        palabras_alto_riesgo: exigirLista(palabras, CLAVE_PALABRAS, ruta),
+        agentes_brainstorm_trivial: exigirNumero(numeros, 'agentes_brainstorm_trivial', ruta),
+        agentes_brainstorm_simple: exigirNumero(numeros, 'agentes_brainstorm_simple', ruta),
+        agentes_brainstorm_media: exigirNumero(numeros, 'agentes_brainstorm_media', ruta),
+        agentes_brainstorm_alta: exigirNumero(numeros, 'agentes_brainstorm_alta', ruta),
+        agentes_brainstorm_critica: exigirNumero(numeros, 'agentes_brainstorm_critica', ruta),
+        agentes_brainstorm_hotfix: exigirNumero(numeros, 'agentes_brainstorm_hotfix', ruta),
+        tolerancia_niveles: exigirNumero(numeros, 'tolerancia_niveles', ruta),
+        tolerancia_extra_si_heuristica_menor: exigirNumero(numeros, 'tolerancia_extra_si_heuristica_menor', ruta),
+        modelo_consulta_discrepancia: exigirTexto(modelo, CLAVE_MODELO, ruta),
+    };
+    validarEscalaDeNiveles(h, ruta);
+    return h;
+}
+/**
+ * La escala tiene que ser estrictamente creciente y no dejar huecos.
+ *
+ * No es celo: nivelHeuristico() es una cascada de "<=" y su ultimo
+ * caso devuelve `critica` sin volver a mirar `nivel_critica_desde`.
+ * Eso solo es correcto si `nivel_critica_desde` es exactamente
+ * `nivel_alta_hasta + 1`. Con `alta_hasta: 7` y `critica_desde: 10`,
+ * un 8 o un 9 no serian ni alta (el fichero dice que alta acaba en 7)
+ * ni critica (dice que critica empieza en 10) — el fichero describiria
+ * una escala con un agujero y el codigo devolveria `critica`
+ * calladamente, contradiciendolo. Comprobarlo aqui es lo que permite
+ * que la cascada no vuelva a leer esa clave: la redundancia es cierta
+ * porque se exige, no porque se suponga.
+ */
+function validarEscalaDeNiveles(h, ruta) {
+    const escalones = [
+        ['nivel_trivial_hasta', h.nivel_trivial_hasta],
+        ['nivel_simple_hasta', h.nivel_simple_hasta],
+        ['nivel_media_hasta', h.nivel_media_hasta],
+        ['nivel_alta_hasta', h.nivel_alta_hasta],
+    ];
+    for (let i = 1; i < escalones.length; i++) {
+        const previo = escalones[i - 1];
+        const actual = escalones[i];
+        if (actual[1] <= previo[1]) {
+            throw new HeuristicaError(`[ERROR] ${ruta}: "${actual[0]}" (${actual[1]}) tiene que ser mayor que ` +
+                `"${previo[0]}" (${previo[1]}).\n` +
+                '        Cada clave nivel_*_hasta es el ultimo valor que TODAVIA cae en ese\n' +
+                '        nivel, asi que la escala tiene que ir siempre a mas. Sube la segunda\n' +
+                '        o baja la primera.');
+        }
+    }
+    if (h.nivel_critica_desde !== h.nivel_alta_hasta + 1) {
+        throw new HeuristicaError(`[ERROR] ${ruta}: "nivel_critica_desde" (${h.nivel_critica_desde}) tiene que ser ` +
+            `exactamente "nivel_alta_hasta" + 1 (${h.nivel_alta_hasta + 1}).\n` +
+            '        Con cualquier otro valor la escala deja un hueco (o un solape) y hay\n' +
+            '        puntuaciones que no caen en ningun nivel. Ajusta una de las dos.');
+    }
+}
+/**
+ * Enumera SIEMPRE las claves validas y, si la escrita se parece a una
+ * de ellas, la propone. Mismo criterio que config.ts: el mensaje dice
+ * que esta mal Y cuales son las validas.
+ */
+function mensajeClaveDesconocida(donde, clave) {
+    const sugerida = claveMasParecida(clave);
+    const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
+    if (sugerida !== null)
+        lineas.push(`        Quiza quisiste decir "${sugerida}".`);
+    lineas.push('        Borrala o corrigela: taskctl no usa una heuristica que no entiende.');
+    lineas.push(`        Claves validas: ${CLAVES_HEURISTICA.join(', ')}.`);
+    return lineas.join('\n');
+}
+/** Distancia de edicion (Levenshtein) a mano — cero dependencias. */
+function distanciaEdicion(a, b) {
+    let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
+    for (let i = 1; i <= a.length; i++) {
+        const actual = [i];
+        for (let j = 1; j <= b.length; j++) {
+            const coste = a[i - 1] === b[j - 1] ? 0 : 1;
+            actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
+        }
+        previa = actual;
+    }
+    return previa[b.length];
+}
+function claveMasParecida(clave) {
+    let mejor = null;
+    let mejorDistancia = Number.POSITIVE_INFINITY;
+    for (const valida of CLAVES_HEURISTICA) {
+        const d = distanciaEdicion(clave.toLowerCase(), valida);
+        if (d < mejorDistancia) {
+            mejorDistancia = d;
+            mejor = valida;
+        }
+    }
+    // Umbral: hasta un tercio de la clave, como en config.ts. Sin el,
+    // "foo" propondria una clave cualquiera y el consejo no valdria nada.
+    return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
+}
+/**
+ * Entero >= 0. El cero SI es legitimo aqui, a diferencia de
+ * `limite_wip` en config.ts: `agentes_brainstorm_trivial: 0` es la
+ * decision central del fichero (no se paga un brainstorm para algo
+ * trivial) y `tolerancia_extra_si_heuristica_menor: 0` es su valor por
+ * defecto declarado. Lo que no puede ser es negativo: un peso negativo
+ * restaria complejidad por tener una senal mas, que es lo contrario de
+ * lo que el fichero dice hacer.
+ */
+function validarEnteroNoNegativo(donde, clave, valor) {
+    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
+        throw new HeuristicaError(`[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, ` +
+            `y es ${describirValor(valor)}.\n` +
+            '        Escribe el numero sin comillas y sin decimales. Un negativo restaria\n' +
+            '        complejidad por tener una senal de mas, que es justo lo contrario de lo\n' +
+            '        que hace esta heuristica.');
+    }
+    return valor;
+}
+/**
+ * Lista de textos no vacios. Una lista VACIA se acepta: un proyecto
+ * que edite su copia del fichero para no tener vocabulario de riesgo
+ * esta tomando una decision legitima, y el resto de senales sigue
+ * funcionando. Lo que no se acepta es que no sea una lista: escrito
+ * sin corchetes, el parser devuelve un texto y la comparacion por
+ * subcadena buscaria la frase entera como si fuera una sola entrada.
+ */
+function validarListaDeTexto(donde, clave, valor) {
+    if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
+        throw new HeuristicaError(`[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes ` +
+            `(p. ej. ["migracion", "seguridad"]), y es ${describirValor(valor)}.\n` +
+            '        Sin corchetes se leeria como UNA sola entrada con todo el texto dentro.');
+    }
+    const entradas = valor.map((x) => x.trim());
+    if (entradas.some((x) => x === '')) {
+        throw new HeuristicaError(`[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.\n` +
+            '        Quitala: una entrada vacia casaria como subcadena con CUALQUIER tarea\n' +
+            '        y dispararia la senal siempre.');
+    }
+    // La regla "una vez por entrada DISTINTA" se cumple porque se
+    // recorre la lista, no el texto. Eso deja de ser cierto si la lista
+    // trae la misma entrada dos veces: casaria en las dos vueltas y la
+    // palabra puntuaria doble. Es exactamente el fallo silencioso que la
+    // regla existe para evitar, asi que se rechaza aqui en vez de
+    // deduplicar por detras (deduplicar callaria el error del fichero).
+    const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
+    if (repetida !== undefined) {
+        throw new HeuristicaError(`[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.\n` +
+            '        Deja solo una: la lista se recorre entera, asi que una entrada dos\n' +
+            '        veces haria que esa palabra puntuara el doble que las demas.');
+    }
+    return entradas;
+}
+function validarTextoNoVacio(donde, clave, valor) {
+    if (typeof valor !== 'string' || valor.trim() === '') {
+        throw new HeuristicaError(`[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.\n` +
+            '        Ponle el nombre de un modelo (p. ej. haiku) o corrige la linea.');
+    }
+    return valor.trim();
+}
+/** Como se nombra un valor rechazado en un mensaje de error. */
+function describirValor(valor) {
+    if (valor === null)
+        return 'un valor vacio';
+    if (Array.isArray(valor))
+        return `una lista (${JSON.stringify(valor)})`;
+    if (typeof valor === 'string')
+        return `el texto "${valor}"`;
+    return `${String(valor)} (${typeof valor})`;
+}
+function mensajeClaveAusente(ruta, clave) {
+    return (`[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
+        '        Todas las claves de este fichero son obligatorias: no hay valores por\n' +
+        '        defecto en el codigo a proposito, para que la heuristica sea siempre la\n' +
+        `        que pone el fichero. Anade la linea "${clave}: <valor>" o restaura el\n` +
+        '        fichero que trae el plugin.');
+}
+function exigirNumero(numeros, clave, ruta) {
+    const valor = numeros.get(clave);
+    if (valor === undefined)
+        throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
+    return valor;
+}
+function exigirLista(valor, clave, ruta) {
+    if (valor === undefined)
+        throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
+    return valor;
+}
+function exigirTexto(valor, clave, ruta) {
+    if (valor === undefined)
+        throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
+    return valor;
+}
+/**
+ * Puntua una tarea sumando las senales de la seccion 1 del YML. No hay
+ * tope: una tarea con muchas senales debe poder salirse por arriba de
+ * la escala.
+ *
+ * Se devuelve la lista de senales ademas de la suma porque el numero
+ * solo no se puede discutir: quien vea "6 puntos" tiene que poder ver
+ * de donde salieron sin releer la tarea.
+ */
+export function puntuarTarea(task, body, h) {
+    const senales = [];
+    const { objetivo, criterios } = extraerSecciones(body);
+    // 1. Etiquetas MAS ALLA DE LA PRIMERA. La primera no puntua: toda
+    //    tarea toca al menos un area y eso no la complica.
+    const adicionales = Math.max(0, task.etiquetas.length - 1);
+    if (adicionales > 0) {
+        senales.push({
+            clave: SENAL_ETIQUETAS,
+            detalle: `${task.etiquetas.length} etiquetas (${adicionales} mas alla de la primera)`,
+            puntos: adicionales * h.peso_etiqueta_adicional,
+        });
+    }
+    // 2. Palabras de alto riesgo. UNA VEZ POR ENTRADA DISTINTA que
+    //    aparezca en objetivo+criterios, sin importar cuantas veces
+    //    aparece ni en que seccion (regla escrita en el YML). Por eso se
+    //    normaliza el texto una vez y se recorre la LISTA, no el texto:
+    //    recorrer el texto obligaria a deduplicar despues y es donde se
+    //    cuela el conteo doble.
+    const encontradas = palabrasDeRiesgoEncontradas(objetivo, criterios, h);
+    for (const palabra of encontradas) {
+        senales.push({
+            clave: SENAL_PALABRA,
+            detalle: palabra,
+            puntos: h.peso_palabra_alto_riesgo,
+        });
+    }
+    // 3. Cada dependencia declarada de otra tarea.
+    if (task.dependencias.length > 0) {
+        senales.push({
+            clave: SENAL_DEPENDENCIA,
+            detalle: `${task.dependencias.length} dependencias (${task.dependencias.join(', ')})`,
+            puntos: task.dependencias.length * h.peso_dependencia,
+        });
+    }
+    // 4. La tarea es de tipo release.
+    if (task.tipo === 'release') {
+        senales.push({ clave: SENAL_RELEASE, detalle: 'tipo release', puntos: h.peso_tipo_release });
+    }
+    // 5. Hotfix Y ADEMAS alguna palabra de riesgo. Un hotfix no puntua
+    //    por serlo: urgencia no es complejidad. Lo que puntua es un
+    //    hotfix que toca ademas terreno delicado.
+    if (task.tipo === 'hotfix' && encontradas.length > 0) {
+        senales.push({
+            clave: SENAL_HOTFIX_RIESGO,
+            detalle: `hotfix que toca ${encontradas.join(', ')}`,
+            puntos: h.peso_tipo_hotfix_con_palabra_riesgo,
+        });
+    }
+    // 6. Umbral de criterios. Se paga UNA sola vez, no por criterio.
+    if (criterios.length >= h.umbral_criterios_aceptacion) {
+        senales.push({
+            clave: SENAL_CRITERIOS,
+            detalle: `${criterios.length} criterios (umbral: ${h.umbral_criterios_aceptacion})`,
+            puntos: h.peso_criterios_aceptacion,
+        });
+    }
+    const puntos = senales.reduce((suma, s) => suma + s.puntos, 0);
+    return { puntos, senales };
+}
+/**
+ * Las entradas DISTINTAS de palabras_alto_riesgo que aparecen en el
+ * texto, en el orden de la lista. Comparacion por subcadena (una
+ * entrada corta cubre sus variantes: "migracion" cubre "migraciones"),
+ * insensible a mayusculas y a acentos por ambos lados.
+ *
+ * AQUI ESTA LA REGLA DE CONTEO, y esta en la forma del bucle: se
+ * recorre LA LISTA y se pregunta si cada entrada sale en el texto.
+ * Recorrer el texto buscando coincidencias daria una por aparicion y
+ * habria que deduplicar despues, que es donde se cuela el conteo
+ * doble. Por eso el texto se junta antes en uno solo: que una entrada
+ * salga en el objetivo Y en los criterios tampoco puede sumar dos
+ * veces. La otra mitad de la garantia la pone validarListaDeTexto(),
+ * que prohibe entradas repetidas en la propia lista.
+ */
+function palabrasDeRiesgoEncontradas(objetivo, criterios, h) {
+    const texto = normalizarTexto([objetivo, ...criterios].join('\n'));
+    const encontradas = [];
+    for (const palabra of h.palabras_alto_riesgo) {
+        if (texto.includes(normalizarTexto(palabra)))
+            encontradas.push(palabra);
+    }
+    return encontradas;
+}
+/**
+ * Traduce una puntuacion a un nivel de complejidad segun la seccion 2
+ * del YML: cada `nivel_*_hasta` es el ultimo valor que TODAVIA cae en
+ * ese nivel.
+ *
+ * `nivel_critica_desde` no aparece en la cascada porque
+ * validarEscalaDeNiveles() exige que sea `nivel_alta_hasta + 1`, con
+ * lo cual todo lo que pasa de alta es critica por construccion. Se
+ * valida precisamente para que esa redundancia sea cierta: si algun
+ * dia se quiere abrir un hueco entre alta y critica, esto habra que
+ * reescribirlo, no tragarselo.
+ */
+export function nivelHeuristico(puntos, h) {
+    if (puntos <= h.nivel_trivial_hasta)
+        return 'trivial';
+    if (puntos <= h.nivel_simple_hasta)
+        return 'simple';
+    if (puntos <= h.nivel_media_hasta)
+        return 'media';
+    if (puntos <= h.nivel_alta_hasta)
+        return 'alta';
+    return 'critica';
+}
+/** El valor crudo de la tabla por nivel, sin la excepcion por tipo. */
+function agentesPorNivel(nivel, h) {
+    switch (nivel) {
+        case 'trivial':
+            return h.agentes_brainstorm_trivial;
+        case 'simple':
+            return h.agentes_brainstorm_simple;
+        case 'media':
+            return h.agentes_brainstorm_media;
+        case 'alta':
+            return h.agentes_brainstorm_alta;
+        case 'critica':
+            return h.agentes_brainstorm_critica;
+    }
+}
+/**
+ * Cuantos agentes de brainstorm pide un (nivel, tipo).
+ *
+ * La excepcion de hotfix es un TOPE, NO UNA SUSTITUCION: el numero es
+ * el MENOR entre lo que dice la tabla y `agentes_brainstorm_hotfix`.
+ * La diferencia solo se ve en el extremo barato, y es justo donde
+ * importa: un hotfix que puntua trivial se queda en 0 agentes, no sube
+ * a 1. Seria absurdo que la clave que existe para ABREVIAR el
+ * brainstorm acabase anadiendo un agente donde la tabla no pedia
+ * ninguno.
+ */
+export function agentesBrainstorm(nivel, tipo, h) {
+    const porNivel = agentesPorNivel(nivel, h);
+    if (tipo === 'hotfix')
+        return Math.min(porNivel, h.agentes_brainstorm_hotfix);
+    return porNivel;
+}
+/**
+ * El numero final de agentes para una tarea concreta, mas todo lo que
+ * hace falta para explicarlo.
+ *
+ * Se toma el MAYOR entre lo que piden el nivel declarado y el
+ * heuristico (ver la divergencia documentada en la cabecera del
+ * modulo). El tope de hotfix va aplicado DENTRO de cada llamada a
+ * agentesBrainstorm(), es decir ANTES del max — y el resultado sigue
+ * topado, porque max(min(a,c), min(b,c)) === min(max(a,b), c): el
+ * orden entre min y max no cambia el resultado. Se escribe asi, y no
+ * al reves, porque cada uno de los dos numeros que se comparan tiene
+ * que ser un numero de agentes valido POR SI MISMO; comparar dos
+ * valores sin topar y topar al final funcionaria hoy por esa igualdad,
+ * pero dejaria en el codigo dos numeros intermedios que no significan
+ * nada.
+ */
+export function resolverNumeroAgentes(task, body, h) {
+    const { puntos, senales } = puntuarTarea(task, body, h);
+    const nivelDeclarado = task.complejidad;
+    const nivelH = nivelHeuristico(puntos, h);
+    const agentes = Math.max(agentesBrainstorm(nivelDeclarado, task.tipo, h), agentesBrainstorm(nivelH, task.tipo, h));
+    const sinTope = Math.max(agentesPorNivel(nivelDeclarado, h), agentesPorNivel(nivelH, h));
+    return {
+        agentes,
+        nivelDeclarado,
+        nivelHeuristico: nivelH,
+        puntos,
+        senales,
+        hayDiscrepancia: nivelDeclarado !== nivelH,
+        topeHotfixAplicado: agentes < sinTope,
+    };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/markdown.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/markdown.js
new file mode 100644
index 0000000..b6b6fbd
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/markdown.js
@@ -0,0 +1,28 @@
+/**
+ * Utilidades de composicion de Markdown compartidas por los comandos
+ * que embeben contenido ajeno en un fichero (`review` con el diff,
+ * `plan` con el objetivo y los criterios de la tarea).
+ *
+ * `fenceFor` vivia en commands/review.ts desde TASK-013 y era el unico
+ * que la usaba. TASK-016 la necesita tambien desde commands/plan.ts, y
+ * que un comando importe de otro es acoplamiento lateral: los dos
+ * dependen ahora de este modulo y `review.ts` la re-exporta para no
+ * romper a quien ya la importaba de alli.
+ */
+/**
+ * Valla de backticks mas larga que cualquier apertura/cierre de valla
+ * presente en el contenido embebido (CommonMark tolera hasta 3
+ * espacios de sangria, que es justo lo que produce una linea de
+ * contexto de diff con backticks a columna 0 — hallazgo MENOR de
+ * revision por pares, TASK-013: con valla fija de 4, un diff cuyo
+ * contexto contenga ```` cerraba el bloque antes de tiempo).
+ */
+export function fenceFor(...contents) {
+    let max = 3;
+    for (const content of contents) {
+        for (const m of content.matchAll(/^ {0,3}(`{3,})/gm)) {
+            max = Math.max(max, m[1].length);
+        }
+    }
+    return '`'.repeat(max + 1);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-brainstorm.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-brainstorm.js
new file mode 100644
index 0000000..96e0e8e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plan-brainstorm.js
@@ -0,0 +1,136 @@
+import { fenceFor } from './markdown.js';
+/** `peticion-<rol>-<ronda>.md` — el rol ya viene prefijado por "brainstorm-". */
+export function nombrePeticionRol(rol, ronda) {
+    return `peticion-${rol.id}-${ronda}.md`;
+}
+/** `salida-<rol>-<ronda>.md` — donde el agente de ese rol vuelca su respuesta. */
+export function nombreSalidaRol(rol, ronda) {
+    return `salida-${rol.id}-${ronda}.md`;
+}
+export function nombrePeticionUnificador(ronda) {
+    return `peticion-unificador-${ronda}.md`;
+}
+/** Cabecera comun a las tres plantillas: quien es la tarea y en que ronda va. */
+function cabecera(task, ronda, fecha) {
+    return (`- Tarea: ${task.id} — ${task.titulo}\n` +
+        `- Tipo: ${task.tipo} · Complejidad declarada: ${task.complejidad}\n` +
+        `- Ronda: ${ronda}\n` +
+        `- Fecha: ${fecha}\n`);
+}
+/**
+ * El enunciado de la tarea, embebido con valla dinamica: el objetivo y
+ * los criterios son texto de la persona y pueden contener backticks.
+ */
+function enunciado(objetivo, criterios) {
+    const criteriosBlock = criterios.length === 0 ? '(la tarea no declara criterios de aceptacion)' : criterios.join('\n');
+    const fence = fenceFor(objetivo, criteriosBlock);
+    return ('## Enunciado de la tarea\n\n' +
+        '### Objetivo\n\n' +
+        `${fence}\n${objetivo}\n${fence}\n\n` +
+        '### Criterios de aceptacion\n\n' +
+        `${fence}\n${criteriosBlock}\n${fence}\n`);
+}
+/**
+ * Como se describe la discrepancia entre el nivel declarado y el
+ * heuristico. Se escribe SIEMPRE (tambien cuando coinciden): un bloque
+ * que solo aparece en el caso raro entrena a quien lo lee a no
+ * buscarlo, y ademas hace que su ausencia sea ambigua — no se sabria
+ * si es que no hay discrepancia o si es que el calculo no llego a
+ * correr.
+ */
+function bloqueComplejidad(resolucion) {
+    const senales = resolucion.senales.length === 0
+        ? '  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)\n'
+        : resolucion.senales.map((s) => `  - ${s.clave}: ${s.detalle} (+${s.puntos})\n`).join('');
+    const veredicto = resolucion.hayDiscrepancia
+        ? `Los dos niveles NO coinciden. Se lanzan ${resolucion.agentes} roles, que es el mayor de ` +
+            'los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te ' +
+            'senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que ' +
+            'de verdad cuesta.'
+        : `Los dos niveles coinciden. Se lanzan ${resolucion.agentes} roles.`;
+    return ('## Complejidad: declarada frente a heuristica\n\n' +
+        `- Declarada en la tarea: **${resolucion.nivelDeclarado}**\n` +
+        `- Heuristica (${resolucion.puntos} puntos): **${resolucion.nivelHeuristico}**\n` +
+        '- Senales encontradas:\n' +
+        senales +
+        (resolucion.topeHotfixAplicado
+            ? '- Se aplico el tope de `hotfix`: un hotfix abrevia el brainstorm previo (nunca la ' +
+                'revision posterior).\n'
+            : '') +
+        `\n${veredicto}\n`);
+}
+export function peticionRolTemplate(task, objetivo, criterios, rol, otrosRoles, ronda, fecha) {
+    const companeros = otrosRoles.length === 0
+        ? 'Eres el unico rol que se lanza en esta tarea.\n'
+        : `Trabajan en paralelo contigo, sin verte: ${otrosRoles
+            .map((r) => `**${r.titulo}**`)
+            .join(', ')}. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto ` +
+            'de vista repetido y lo leera como confirmacion.\n';
+    return (`# Peticion de brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
+        cabecera(task, ronda, fecha) +
+        `- Rol: \`${rol.id}\` — lanzalo con el agente de ese mismo nombre\n` +
+        `- Vuelca tu respuesta en: \`${nombreSalidaRol(rol, ronda)}\`\n\n` +
+        '## Tu pregunta\n\n' +
+        `> ${rol.pregunta}\n\n` +
+        '## Que miras\n\n' +
+        rol.mira.map((m) => `- ${m}\n`).join('') +
+        '\n## Que NO miras\n\n' +
+        'No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de ' +
+        'contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:\n\n' +
+        rol.noMira.map((m) => `- ${m}\n`).join('') +
+        '\n' +
+        enunciado(objetivo, criterios) +
+        '\n## Como entregas\n\n' +
+        `Escribe en \`${nombreSalidaRol(rol, ronda)}\`, con estas secciones y en este orden:\n\n` +
+        rol.entregables.map((e) => `- ${e}\n`).join('') +
+        '\n## Reglas\n\n' +
+        '- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ' +
+        'ficheros del repo: tu salida es un documento.\n' +
+        '- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo ' +
+        'has mirado. Di de donde lo sacas.\n' +
+        '- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones ' +
+        'genericas.\n' +
+        `- ${companeros}`);
+}
+export function salidaRolTemplate(task, rol, ronda) {
+    return (`# Brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
+        `- Rol: \`${rol.id}\`\n` +
+        '- Agente: (rellenar)\n\n' +
+        rol.entregables.map((e) => `## ${e}\n\n\n`).join(''));
+}
+export function peticionUnificadorTemplate(task, objetivo, criterios, roles, ronda, fecha, resolucion, planFinalRelativo) {
+    const listaSalidas = roles.length === 0
+        ? '(ninguna: esta tarea no lanza brainstorm, ver el bloque de complejidad)\n'
+        : roles.map((r) => `- \`${nombreSalidaRol(r, ronda)}\` — rol ${r.titulo}\n`).join('');
+    const instruccionesConRoles = roles.length === 0
+        ? 'No hay salidas de brainstorm que consolidar: redacta el plan directamente a partir del ' +
+            'enunciado. Deja dicho en el plan que se redacto sin brainstorm y por que (el numero de ' +
+            'roles sale del lookup de complejidad, no de un descuido).\n'
+        : '1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con ' +
+            'las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, ' +
+            'dicho, vale mas que un plan que finge estar completo.\n' +
+            '2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual ' +
+            'gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie ' +
+            'es la peor salida posible de este paso.\n' +
+            '3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que ' +
+            'los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.\n' +
+            '4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.\n';
+    return (`# Peticion al unificador — ${task.id} (ronda ${ronda})\n\n` +
+        cabecera(task, ronda, fecha) +
+        `- Rol: \`brainstorm-unificador\`\n` +
+        `- Vuelca el resultado en: \`${planFinalRelativo}\`\n\n` +
+        '## Salidas que tienes que consolidar\n\n' +
+        listaSalidas +
+        '\n' +
+        bloqueComplejidad(resolucion) +
+        '\n## Como consolidas\n\n' +
+        instruccionesConRoles +
+        '\n## Que tiene que traer el plan final\n\n' +
+        '- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.\n' +
+        '- Los desacuerdos entre roles y como se resuelve cada uno.\n' +
+        '- Riesgos aceptados y que los contiene.\n' +
+        '- Plan de pruebas.\n' +
+        '- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es ' +
+        'obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.\n\n' +
+        enunciado(objetivo, criterios));
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roles-brainstorm.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roles-brainstorm.js
new file mode 100644
index 0000000..41d1adc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roles-brainstorm.js
@@ -0,0 +1,143 @@
+/**
+ * Los roles del brainstorm paralelo de la fase de diseno (seccion 6 de
+ * la metodologia) — TASK-016, item D1.
+ *
+ * `scripts/heuristica-complejidad.yml` fija CUANTOS agentes entran; no
+ * fija CUALES, y lo dice el mismo: "esa eleccion queda abierta a
+ * proposito: depende de la tarea, y este fichero no la tiene delante".
+ * Este modulo es quien la cierra, y la cierra de forma DETERMINISTA:
+ * un orden de prioridad fijo y los N primeros. El CLI no puede juzgar
+ * que roles pide una tarea concreta sin llamar a un modelo, y llamarlo
+ * aqui seria pagar un LLM para elegir entre cuatro opciones fijas —
+ * exactamente lo que la seccion 16 viene a evitar.
+ *
+ * EL ORDEN NO ES ARBITRARIO y es la unica decision de diseño de este
+ * fichero, asi que conviene que quede escrita: es el orden en que los
+ * enumera el criterio de aceptacion 1 de la tarea (arquitectura,
+ * riesgos, testing, dominio), y sobrevive a la prueba de los extremos.
+ * Con N=1 entra arquitectura, que es el unico rol que propone una
+ * FORMA para el cambio; los otros tres reaccionan a una forma que
+ * alguien tuvo que proponer antes. Con N=3 el que se cae es dominio,
+ * que es el rol cuyo contexto (las reglas de negocio) es el que menos
+ * se puede deducir del repositorio y mas depende de que haya una
+ * persona con ese conocimiento delante.
+ *
+ * ACOPLAMIENTO CON agents/. Cada `id` de aqui tiene que ser
+ * literalmente el `name:` del frontmatter de su `agents/<id>.md`: el
+ * CLI escribe peticiones dirigidas a ese nombre, y si divergen se
+ * estarian invocando agentes que no existen. Eso NO se comprueba en
+ * caliente (leer cuatro ficheros en cada `plan` para verificar una
+ * constante es gasto sin retorno): lo comprueba la suite, en las dos
+ * direcciones, contra el contenido real de agents/.
+ */
+export const ROLES_BRAINSTORM = Object.freeze([
+    Object.freeze({
+        id: 'brainstorm-arquitectura',
+        titulo: 'arquitectura',
+        pregunta: 'Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?',
+        mira: Object.freeze([
+            'Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.',
+            'Que se crea nuevo, que se extiende y en que orden se construye.',
+            'Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.',
+            'El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.',
+        ]),
+        noMira: Object.freeze([
+            'Como se prueba (es del rol de testing).',
+            'Por donde se rompe (es del rol de riesgos).',
+            'Las reglas de negocio (son del rol de dominio).',
+        ]),
+        entregables: Object.freeze([
+            'Enfoque propuesto, con rutas y nombres concretos',
+            'Que se extiende y que se crea',
+            'Limites que cruza',
+            'La decision de diseño que mas te preocupa (UNA sola)',
+        ]),
+    }),
+    Object.freeze({
+        id: 'brainstorm-riesgos',
+        titulo: 'riesgos',
+        pregunta: '¿Por donde se rompe esto?',
+        mira: Object.freeze([
+            'Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.',
+            'Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.',
+            'Compatibilidad hacia atras con los datos y ficheros que YA existen.',
+            'La vuelta atras: si esto sale mal, como se deshace y que queda inservible.',
+        ]),
+        noMira: Object.freeze([
+            'Donde encaja el cambio (es del rol de arquitectura).',
+            'Que aserciones escribir (es del rol de testing).',
+            'Las reglas de negocio (son del rol de dominio).',
+        ]),
+        entregables: Object.freeze([
+            'Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno',
+            'Estados intermedios y fallos parciales',
+            'Compatibilidad hacia atras',
+            'Vuelta atras',
+            'El riesgo que mas te preocupa (UNO solo)',
+        ]),
+    }),
+    Object.freeze({
+        id: 'brainstorm-testing',
+        titulo: 'testing',
+        pregunta: '¿Como se demuestra que esto funciona, y como envejece?',
+        mira: Object.freeze([
+            'Que es observable desde fuera, y contra que recurso real se comprueba.',
+            'Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.',
+            'Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.',
+            'Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.',
+        ]),
+        noMira: Object.freeze([
+            'Donde encaja el cambio (es del rol de arquitectura).',
+            'Por donde se rompe en produccion (es del rol de riesgos).',
+            'Las reglas de negocio (son del rol de dominio).',
+        ]),
+        entregables: Object.freeze([
+            'Que es observable sin llamar a ningun agente',
+            'Plan de pruebas, cada una con su mutacion',
+            'Aserciones trampa que hay que evitar en esta tarea concreta',
+            'Que pruebas existentes cambian de expectativa',
+            'Como envejece',
+        ]),
+    }),
+    Object.freeze({
+        id: 'brainstorm-dominio',
+        titulo: 'dominio',
+        pregunta: '¿Que sabe quien va a usar esto que no se deduce leyendo el codigo?',
+        mira: Object.freeze([
+            'El vocabulario real: que nombra cada cosa quien trabaja en este dominio.',
+            'Los invariantes del negocio que ningun tipo del lenguaje impone y que aun asi no se pueden violar.',
+            'Los casos que en el codigo son simetricos y en el negocio no lo son.',
+            'Cuando una solucion correcta en codigo es incorrecta para quien la va a usar.',
+        ]),
+        noMira: Object.freeze([
+            'Donde encaja el cambio (es del rol de arquitectura).',
+            'Por donde se rompe (es del rol de riesgos).',
+            'Como se prueba (es del rol de testing).',
+        ]),
+        entregables: Object.freeze([
+            'Vocabulario e invariantes que el enfoque tiene que respetar',
+            'Donde una solucion tecnicamente correcta seria incorrecta aqui',
+            'Lo que hace falta preguntarle a una persona antes de implementar',
+        ]),
+    }),
+]);
+/** El id del agente unificador. No es un rol de brainstorm: consolida los que hay. */
+export const UNIFICADOR_ID = 'brainstorm-unificador';
+export class RolesBrainstormError extends Error {
+}
+/**
+ * Los `n` primeros roles por prioridad. `n` viene del lookup de la
+ * heuristica, que ya lo acota; que aqui se valide igualmente es a
+ * proposito: un `n` fuera de rango significa que la tabla del YML y
+ * esta lista han dejado de cuadrar, y eso tiene que gritar en vez de
+ * recortarse en silencio con un slice tolerante.
+ */
+export function seleccionarRoles(n) {
+    if (!Number.isInteger(n) || n < 0 || n > ROLES_BRAINSTORM.length) {
+        throw new RolesBrainstormError(`[ERROR] Se han pedido ${n} roles de brainstorm y solo hay ${ROLES_BRAINSTORM.length} ` +
+            'definidos (o el numero no es un entero >= 0). Revisa las claves ' +
+            '"agentes_brainstorm_*" de scripts/heuristica-complejidad.yml: su valor no puede ' +
+            `pasar de ${ROLES_BRAINSTORM.length}.`);
+    }
+    return ROLES_BRAINSTORM.slice(0, n);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js
index 4410a44..27c34ac 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js
@@ -14,7 +14,28 @@ export class StateMachineError extends Error {
         this.name = 'StateMachineError';
     }
 }
-const TRIVIAL_SIN_APROBACION = ['trivial', 'simple'];
+/**
+ * Complejidades EXIMIDAS del checkpoint humano antes de "start".
+ *
+ * Esta vacia desde TASK-016 (item D1), y esa es la decision, no un
+ * descuido: el punto 1 de la seccion 14 se cerro como "checkpoint
+ * humano SIEMPRE obligatorio", y hasta entonces el codigo eximia a
+ * `trivial` y `simple` — o sea que la decision estaba tomada y no
+ * aplicada. Confirmado con Carlos el 2026-09-08.
+ *
+ * Lo que sostiene la decision, con datos: la exencion no se ejercio
+ * nunca. En las 32 tareas del repo no hay ni una sola `trivial`, y de
+ * las 4 `simple` cerradas UNA ESCONDIA UN CRITICO — el mismo dato con
+ * el que se descarto el item D4 (revision ligera). Abaratar el
+ * checkpoint justo donde nunca se uso no ahorraba nada y si dejaba
+ * pasar el peor bug del proyecto.
+ *
+ * Se vacia en vez de borrarse a proposito: sigue siendo el punto unico
+ * donde se declara quien se exime, asi que reabrir la decision cuesta
+ * una linea en vez de una arqueologia. Mismo criterio que
+ * CONFIG_DEFAULTS.
+ */
+const TRIVIAL_SIN_APROBACION = [];
 function err(taskId, command, estadoActual, comandoRequerido, reason) {
     const lines = [`[ERROR] ${taskId} ${reason}`];
     if (comandoRequerido) {
@@ -70,7 +91,7 @@ export function assertTransitionAllowed(command, task, ctx = {}) {
             }
             const exigeAprobacion = !TRIVIAL_SIN_APROBACION.includes(task.complejidad);
             if (exigeAprobacion && !task.plan_aprobado) {
-                throw err(task.id, command, task.estado, 'taskctl approve', 'no ha pasado por taskctl approve (complejidad no trivial/simple exige aprobacion humana).');
+                throw err(task.id, command, task.estado, 'taskctl approve', 'no ha pasado por taskctl approve. El checkpoint humano es obligatorio para todas las complejidades (seccion 14, punto 1).');
             }
             return;
         }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-body.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-body.js
new file mode 100644
index 0000000..d71395d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-body.js
@@ -0,0 +1,120 @@
+/**
+ * Lectura de las dos secciones del cuerpo de `tarea.md` que alguien
+ * mas que un humano necesita leer: el Objetivo y los criterios de
+ * aceptacion.
+ *
+ * Vive aparte de frontmatter.ts a proposito: aquel parsea el bloque
+ * `---` de metadatos y no mira el cuerpo; este solo mira el cuerpo y no
+ * sabe nada de metadatos. Su primer consumidor es la heuristica de
+ * complejidad (src/core/heuristica.ts), que necesita el texto de esas
+ * dos secciones para buscar palabras de alto riesgo y contar cuantos
+ * criterios declara la tarea.
+ *
+ * Tres decisiones que el formato real del repo obliga a tomar:
+ *
+ * 1. LA CABECERA DE CRITERIOS APARECE CON Y SIN TILDE. En las tareas
+ *    ya escritas conviven "## Criterios de aceptación" (las que
+ *    escribio una persona) y "## Criterios de aceptacion" (las que
+ *    genera `taskctl new`/`import`, que no ponen tildes). Las dos son
+ *    validas: el titulo se compara ya normalizado (sin diacriticos y
+ *    en minusculas), asi que tambien casa "## CRITERIOS DE ACEPTACIÓN".
+ *    Elegir solo una forma dejaria fuera la mitad del repo.
+ * 2. UNA SECCION TERMINA DONDE EMPIEZA LA SIGUIENTE CABECERA `##`.
+ *    Se reconocen cabeceras ATX de nivel 2 a 6; un `#` de nivel 1 NO
+ *    corta, porque una linea que empieza por "# " dentro de un bloque
+ *    de codigo (un comentario de shell, que este repo escribe a
+ *    menudo) truncaria el Objetivo por accidente.
+ * 3. SI LA MISMA CABECERA SALE DOS VECES, MANDA LA PRIMERA. Es lo
+ *    unico que se puede decidir sin inventar: concatenar dos secciones
+ *    "Objetivo" mezclaria textos que su autor escribio separados.
+ *
+ * Nunca lanza. Un cuerpo sin ninguna de las dos secciones devuelve
+ * objetivo vacio y cero criterios, que es exactamente lo que dice el
+ * fichero. Que eso sea un error o no lo decide quien llama: aqui no
+ * hay contexto para saberlo (una tarea recien creada con `taskctl new`
+ * tiene el Objetivo en blanco a proposito).
+ */
+/** Cabecera ATX de nivel 2 a 6 (ver decision 2 de la cabecera). */
+const RE_CABECERA = /^ {0,3}#{2,6}(?:\s|$)/;
+/** Linea de checklist: "- [ ] texto", "- [x] texto", "* [X] texto". */
+const RE_CRITERIO = /^\s*[-*]\s+\[[ xX]\]\s*(.*)$/;
+/** Continuacion indentada de la linea de checklist anterior. */
+const RE_CONTINUACION = /^\s+\S/;
+const TITULO_OBJETIVO = 'objetivo';
+const TITULO_CRITERIOS = 'criterios de aceptacion';
+/**
+ * Quita diacriticos y pasa a minusculas. Se descompone en NFD y se
+ * borran las marcas combinantes (U+0300..U+036F) en vez de mantener
+ * una tabla de reemplazos a mano: la tabla se queda corta el dia que
+ * aparece una letra que nadie previo.
+ *
+ * Se exporta porque la heuristica de complejidad compara sus palabras
+ * de alto riesgo contra este mismo texto: si cada modulo normalizara a
+ * su manera, "migracion" casaria en un sitio y no en el otro.
+ */
+export function normalizarTexto(texto) {
+    return texto
+        .normalize('NFD')
+        .replace(/[\u0300-\u036f]/g, '')
+        .toLowerCase();
+}
+/** El titulo de una cabecera ATX, sin almohadillas ni diacriticos. */
+function tituloDeCabecera(linea) {
+    return normalizarTexto(linea
+        .trim()
+        .replace(/^#+\s*/, '')
+        .replace(/\s*#+$/, '')).trim();
+}
+/**
+ * Parte el cuerpo de una tarea en sus dos secciones interesantes.
+ *
+ * Sobre los criterios: se devuelve UNA entrada por linea de checklist,
+ * incluidas las vacias ("- [ ] " a secas, que es lo que deja
+ * `taskctl new` en una tarea recien creada). Una linea INDENTADA que
+ * no sea a su vez un checklist se pega al criterio anterior: en las
+ * tareas reales del repo los criterios largos se parten en varias
+ * lineas alineadas bajo el texto, y perderlas dejaria fuera parte del
+ * enunciado. Lo que no se pega es un parrafo sin indentar: eso ya es
+ * prosa suelta detras de la lista, no la continuacion de nada.
+ */
+export function extraerSecciones(body) {
+    const lineas = body.split(/\r?\n/);
+    const objetivo = [];
+    const criterios = [];
+    let seccion = 'otra';
+    let objetivoVisto = false;
+    let criteriosVisto = false;
+    for (const linea of lineas) {
+        if (RE_CABECERA.test(linea)) {
+            const titulo = tituloDeCabecera(linea);
+            if (titulo === TITULO_OBJETIVO && !objetivoVisto) {
+                seccion = 'objetivo';
+                objetivoVisto = true;
+            }
+            else if (titulo === TITULO_CRITERIOS && !criteriosVisto) {
+                seccion = 'criterios';
+                criteriosVisto = true;
+            }
+            else {
+                seccion = 'otra';
+            }
+            continue;
+        }
+        if (seccion === 'objetivo') {
+            objetivo.push(linea);
+            continue;
+        }
+        if (seccion === 'criterios') {
+            const criterio = RE_CRITERIO.exec(linea);
+            if (criterio !== null) {
+                criterios.push((criterio[1] ?? '').trim());
+                continue;
+            }
+            if (criterios.length > 0 && RE_CONTINUACION.test(linea)) {
+                const ultimo = criterios[criterios.length - 1] ?? '';
+                criterios[criterios.length - 1] = `${ultimo} ${linea.trim()}`.trim();
+            }
+        }
+    }
+    return { objetivo: objetivo.join('\n').trim(), criterios };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js
new file mode 100644
index 0000000..6e4d1d1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js
@@ -0,0 +1,51 @@
+/**
+ * Numeracion de rondas de los artefactos de una tarea.
+ *
+ * Un bucle de "pide cambios" es normal, no una excepcion: una tarea
+ * puede necesitar dos o tres rondas de revision, y desde TASK-016
+ * tambien varias de planificacion. En los dos casos el numero de ronda
+ * no se guarda en ninguna parte: se DEDUCE de los ficheros que ya hay
+ * en la carpeta. Es a proposito — un contador en el frontmatter seria
+ * un segundo sitio donde vive la misma verdad, y el dia que discrepara
+ * del disco ganaria el fichero equivocado.
+ *
+ * La logica vivia privada en commands/review.ts desde TASK-013.
+ * TASK-016 la necesita igual para `planificacion/brainstorm/`, y
+ * copiarla habria dejado dos numeradores que divergen en cuanto
+ * alguien toque uno.
+ */
+import { readdir } from 'node:fs/promises';
+import { isEnoent } from './task-store.js';
+/**
+ * Primera ronda libre: 1 + el mayor N que aparezca en el primer grupo
+ * de captura de `patron` entre los ficheros del directorio.
+ *
+ * Un directorio que no existe es ronda 1, no un error: la carpeta se
+ * crea al escribir la primera ronda, y preguntar antes de crearla es
+ * el caso normal, no el raro.
+ */
+export async function siguienteRonda(dir, patron) {
+    let entries;
+    try {
+        entries = await readdir(dir);
+    }
+    catch (e) {
+        if (isEnoent(e))
+            return 1;
+        throw e;
+    }
+    let max = 0;
+    for (const entry of entries) {
+        const m = patron.exec(entry);
+        // Se recorren TODAS las entradas y se busca el maximo, en vez de
+        // contar cuantas hay: un fichero borrado a mano no debe hacer que
+        // la siguiente ronda reutilice un numero ya usado y pise el
+        // historial de la anterior.
+        if (m !== null) {
+            const capturado = m[1];
+            if (capturado !== undefined)
+                max = Math.max(max, Number(capturado));
+        }
+    }
+    return max + 1;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 78cedb6..09e79e0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -7,7 +7,9 @@ import { runNewCommand, NewTaskArgError } from './commands/new.js';
 import { runImportCommand, ImportCommandError } from './commands/import.js';
 import { runBoardCommand, BoardCommandError } from './commands/board.js';
 import { runStartCommand, StartCommandError } from './commands/start.js';
-import { runPlanCommand, PlanCommandError } from './commands/plan.js';
+import { runPlanCommand, PlanCommandError, type PlanCommandResult } from './commands/plan.js';
+import { HeuristicaError } from './core/heuristica.js';
+import { RolesBrainstormError } from './core/roles-brainstorm.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
@@ -139,6 +141,48 @@ function asignacionNotice(result: { asignadoA: string | null; asignadoCambiado:
   return `Asignada a "${result.asignadoA}".\n`;
 }
 
+/**
+ * Que ha dejado escrito el brainstorm (TASK-016). Se imprimen las
+ * rutas porque son lo unico accionable: quien orquesta la sesion tiene
+ * que abrir esas peticiones y lanzarlas. Un "brainstorm preparado" sin
+ * rutas obligaria a ir a buscarlas.
+ *
+ * La discrepancia de complejidad se dice SOLO cuando la hay, al
+ * contrario que dentro de la peticion del unificador (donde va
+ * siempre): aqui compite por la atencion con el resto de la salida del
+ * comando, y ahi es el unico contenido de su seccion.
+ */
+function brainstormNotice(result: PlanCommandResult): string {
+  const lineas: string[] = [];
+  if (result.resolucion.hayDiscrepancia) {
+    lineas.push(
+      `Complejidad declarada "${result.resolucion.nivelDeclarado}", heuristica ` +
+        `"${result.resolucion.nivelHeuristico}" (${result.resolucion.puntos} puntos): se lanzan ` +
+        `${result.resolucion.agentes}, el mayor de los dos.`
+    );
+  }
+  if (result.roles.length === 0) {
+    lineas.push(
+      `Sin brainstorm (complejidad "${result.resolucion.nivelDeclarado}" resuelve 0 roles). ` +
+        `Redacta el plan y aprueba con "taskctl approve ${result.id}".`
+    );
+  } else if (result.brainstormReutilizado) {
+    lineas.push(
+      `Re-planificacion (ronda ${result.ronda}): NO se relanza el brainstorm. Lanza solo el ` +
+        `unificador con ${result.peticionUnificador}, que reprocesa las salidas de la ronda ` +
+        `anterior mas tu feedback.`
+    );
+  } else {
+    lineas.push(
+      `Brainstorm ronda ${result.ronda}, ${result.roles.length} rol(es) en paralelo. Lanza cada ` +
+        'peticion con el agente que nombra y luego el unificador:'
+    );
+    for (const p of result.peticionesRol) lineas.push(`  - ${p}`);
+    lineas.push(`  - ${result.peticionUnificador} (el ultimo, cuando esten las salidas)`);
+  }
+  return `${lineas.join('\n')}\n`;
+}
+
 /**
  * Avisos de asignacion (TASK-024) por stderr: no son errores, el
  * comando ha hecho su trabajo, pero la persona necesita enterarse.
@@ -170,7 +214,15 @@ export async function main(argv: readonly string[]): Promise<number> {
     try {
       const result = await runNewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
       printBaseBranchSwitchNotice(result.baseBranchGuard);
-      process.stdout.write(`Tarea ${result.id} creada: ${result.filePath}\n`);
+      process.stdout.write(
+        `Tarea ${result.id} creada: ${result.filePath}\n` +
+          // Se dice AQUI y no solo cuando "plan" falle: desde TASK-016
+          // "plan" aborta si el objetivo esta vacio, y "new" lo deja
+          // vacio a proposito. Enterarse de la precondicion en el
+          // momento en que la incumples es peor que saberla al crear.
+          'Rellena "## Objetivo" y los criterios de aceptacion antes de "taskctl plan": el ' +
+          'brainstorm se lanza a partir de ese texto.\n'
+      );
       printAutoCommit(result.autoCommit);
       return 0;
     } catch (e) {
@@ -316,7 +368,8 @@ export async function main(argv: readonly string[]): Promise<number> {
       }
       process.stdout.write(
         `Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
-          asignacionNotice(result)
+          asignacionNotice(result) +
+          brainstormNotice(result)
       );
       printAutoCommit(result.autoCommit);
       return 0;
@@ -324,6 +377,8 @@ export async function main(argv: readonly string[]): Promise<number> {
       if (
         e instanceof AutoCommitError ||
         e instanceof ConfigError ||
+        e instanceof HeuristicaError ||
+        e instanceof RolesBrainstormError ||
         e instanceof PlanCommandError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index f8ae107..ed184f9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -1,23 +1,25 @@
 /**
- * taskctl plan — TASK-010 de PLAN_SPRINTS.md. Version MINIMA de la
- * fase de diseno (seccion 6 de la metodologia): sin contexto
- * determinista desde docs/INDEX.md, sin gatekeeper barato (Haiku), sin
- * seleccion de skill (6.6), sin brainstorm multi-agente en paralelo —
- * todo eso es Sprint 3 (TASK-016/017). Tampoco implementa la
- * precondicion completa de rama base (seccion 8.3) SI la aplica desde
- * TASK-012 (ensureBaseBranchReady, antes de mover nada) — lo que
- * quedo pendiente para "taskctl start" en TASK-009 (seccion 8.3 no
- * aplica a start, que ya cambia de rama como parte de su propio
- * trabajo).
+ * taskctl plan — la fase de diseno de la seccion 6 de la metodologia.
+ * Nacio en TASK-010 como version minima (un solo scaffold) y TASK-016
+ * (item D1) la convirtio en el orquestador determinista del brainstorm
+ * paralelo por roles.
  *
- * Lo que SI hace: validar la transicion, mover la tarea a
- * 01-en-diseno/, y dejar un scaffold de planificacion/plan-final.md
- * (la subcarpeta es de TASK-027, item C3) listo para que
- * un agente (o una persona, en uso interactivo real de Claude Code) lo
- * redacte — el mismo patron que "taskctl new" ya usa con el cuerpo de
- * tarea.md (Objetivo/Criterios en blanco para rellenar despues). El
- * contenido real del plan NO lo genera este CLI: no hay orquestacion
- * de agentes aqui todavia.
+ * QUE HACE, y donde esta la linea. El CLI resuelve SIN LLM todo lo que
+ * es lookup o escritura: cuantos roles entran (tabla de
+ * scripts/heuristica-complejidad.yml), cuales (orden fijo de
+ * core/roles-brainstorm.ts), con que contexto acotado va cada uno
+ * (seccion 16.2) y en que ficheros se deja todo. Luego escribe las
+ * peticiones y para. NO invoca ningun modelo: quien orquesta la sesion
+ * las dispara y vuelca las respuestas en los scaffolds. Es el mismo
+ * reparto que TASK-013 fijo para "taskctl review", y por el mismo
+ * motivo — un CLI que llama a un agente no se puede probar sin uno.
+ *
+ * LO QUE SIGUE SIN HACER: contexto determinista desde docs/INDEX.md,
+ * gatekeeper barato para la discrepancia de complejidad y seleccion de
+ * skill (6.6, TASK-017).
+ *
+ * Aplica la precondicion de rama base de la seccion 8.3 desde TASK-012
+ * (ensureBaseBranchReady, antes de mover nada).
  */
 import path from 'node:path';
 import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
@@ -38,11 +40,44 @@ import {
   type AutoCommitResult,
 } from '../fs/git-commit.js';
 import { resolverAsignado } from '../core/wip.js';
+import { siguienteRonda } from '../fs/rondas.js';
+import { extraerSecciones } from '../core/tarea-body.js';
+import {
+  cargarHeuristica,
+  resolverNumeroAgentes,
+  type ResolucionAgentes,
+} from '../core/heuristica.js';
+import { seleccionarRoles, type RolBrainstorm } from '../core/roles-brainstorm.js';
+import {
+  nombrePeticionRol,
+  nombreSalidaRol,
+  nombrePeticionUnificador,
+  peticionRolTemplate,
+  salidaRolTemplate,
+  peticionUnificadorTemplate,
+} from '../core/plan-brainstorm.js';
 
 export class PlanCommandError extends Error {}
 
 export const PLAN_FINAL_FILENAME = 'plan-final.md';
 
+/**
+ * Subcarpeta del brainstorm, DENTRO de `planificacion/` y no colgando
+ * de la raiz de la carpeta de tarea. No es cosmetica: asi el `rename`
+ * de moveTareaFile se la lleva entera al cambiar de estado y el
+ * autoCommit del paso 5 de la 8.3 ya la cubre con el dirname de la
+ * tarea, sin tocar su lista de rutas ni anadir un caso especial.
+ */
+export const BRAINSTORM_DIRNAME = 'brainstorm';
+
+/**
+ * Los tres tipos de fichero que numera una ronda de brainstorm. Se
+ * deduce la ronda del disco, no de una clave del frontmatter: un
+ * contador guardado seria un segundo sitio donde vive la misma verdad.
+ */
+const RONDA_BRAINSTORM_RE =
+  /^(?:peticion-brainstorm-[a-z]+|salida-brainstorm-[a-z]+|peticion-unificador)-(\d+)\.md$/;
+
 /**
  * Subcarpeta de artefactos de diseno dentro de la carpeta de la tarea
  * (TASK-027, item C3). La seccion 2 de la metodologia describe cada
@@ -115,16 +150,28 @@ export async function resolverPlanFinal(taskDir: string): Promise<PlanFinalUbica
   };
 }
 
-export function planTemplate(task: Task): string {
+/**
+ * El scaffold del plan final. Lo rellena el agente unificador
+ * siguiendo `brainstorm/peticion-unificador-<ronda>.md`, que es donde
+ * viven las instrucciones largas; aqui solo van las secciones, para
+ * que el fichero no le repita al agente lo que ya tiene delante.
+ */
+export function planTemplate(task: Task, roles: readonly RolBrainstorm[]): string {
+  const origen =
+    roles.length === 0
+      ? '(Esta tarea no lanza brainstorm: su complejidad resuelve 0 roles. El plan\n' +
+        'se redacta directamente a partir del enunciado.)\n'
+      : `(Lo consolida el agente unificador a partir de ${roles.length} rol(es) de\n` +
+        `brainstorm lanzados en paralelo: ${roles.map((r) => r.titulo).join(', ')}.\n` +
+        'Los desacuerdos entre roles se senalan, no se promedian.)\n';
   return (
     `# Plan — ${task.id}: ${task.titulo}\n\n` +
-    '## Enfoque propuesto\n\n\n' +
-    '## Alternativas consideradas\n\n' +
-    '(Version minima de "taskctl plan", TASK-010: sin brainstorm multi-agente\n' +
-    'todavia. Un solo agente redacta este plan. TASK-016 anadira brainstorm\n' +
-    'en paralelo con roles distintos y un agente unificador para tareas de\n' +
-    'complejidad media o mayor.)\n\n' +
-    '## Riesgos o preguntas abiertas\n\n'
+    origen +
+    '\n## Enfoque propuesto\n\n\n' +
+    '## Desacuerdos entre roles, y como se resuelven\n\n\n' +
+    '## Riesgos aceptados y que los contiene\n\n\n' +
+    '## Plan de pruebas\n\n\n' +
+    '## Lo que necesita decision de una persona\n\n'
   );
 }
 
@@ -139,6 +186,25 @@ export interface PlanCommandResult {
    * raiz de la carpeta, CLI anterior a TASK-027) a `planificacion/`.
    */
   planMigrado: boolean;
+  /**
+   * Ronda de brainstorm que ha escrito esta invocacion. 1 la primera
+   * vez; 2 o mas en una re-planificacion (bucle B9->B5 de la 16.3).
+   */
+  ronda: number;
+  /** Complejidad declarada vs. heuristica, y el numero de roles resultante. */
+  resolucion: ResolucionAgentes;
+  /** Los roles cuyas peticiones existen para esta ronda. */
+  roles: readonly RolBrainstorm[];
+  /** Rutas de las peticiones de rol escritas por ESTA invocacion (vacio en ronda >= 2). */
+  peticionesRol: string[];
+  /** Ruta de la peticion del unificador de esta ronda. */
+  peticionUnificador: string;
+  /**
+   * true si esta invocacion NO regenero las peticiones de rol porque
+   * ya habia una ronda previa (16.3: un bucle de "pide cambios" es una
+   * correccion incremental, no un reinicio).
+   */
+  brainstormReutilizado: boolean;
   /** asignado_a resultante en el frontmatter (null si sigue sin asignar). */
   asignadoA: string | null;
   /** true si esta invocacion cambio asignado_a (se paso --asignado-a con otro valor). */
@@ -243,6 +309,45 @@ export async function runPlanCommand(
     actualizado: today,
   };
 
+  // --- Resolucion determinista del brainstorm (TASK-016) -------------
+  // Va ANTES de cualquier escritura y de mover nada: todo lo que puede
+  // abortar tiene que abortar con la tarea intacta.
+  //
+  // Un fallo aqui NO cae al comportamiento de antes: si el YML de la
+  // heuristica falta o esta corrupto, "plan" para. Es la doctrina de
+  // config.ts (fallo cerrado) y aqui pesa mas todavia, porque la
+  // alternativa seria planificar en silencio con cero roles y que nadie
+  // se entere de que el brainstorm no se hizo.
+  const heuristica = cargarHeuristica();
+  const resolucion = resolverNumeroAgentes(task, body, heuristica);
+  const roles = seleccionarRoles(resolucion.agentes);
+
+  const secciones = extraerSecciones(body);
+
+  // Puerta del objetivo vacio. "taskctl new" deja el Objetivo en blanco
+  // a proposito, y mientras "plan" solo escribia un scaffold eso era
+  // inofensivo. Con N agentes detras deja de serlo: cada rol recibiria
+  // una peticion sin sustancia, devolveria una invencion distinta, y el
+  // unificador las consolidaria en un plan-final.md CON AUTORIDAD que
+  // nadie podria distinguir de uno bien fundado.
+  //
+  // Se aplica SOLO cuando iba a escribirse al menos una peticion: con 0
+  // roles el comportamiento es identico al de antes de TASK-016, asi
+  // que ninguna tarea existente cambia de conducta por esto.
+  //
+  // No es un caso hipotetico: es exactamente lo que paso al planificar
+  // la propia TASK-016, cuyo Objetivo estaba vacio — y de paso hundio
+  // su puntuacion heuristica, porque las palabras de riesgo son la
+  // unica senal del YML que mira el contenido del trabajo.
+  if (roles.length > 0 && secciones.objetivo === '') {
+    throw new PlanCommandError(
+      `[ERROR] ${task.id}: el "## Objetivo" de tarea.md esta vacio, y esta tarea lanza ` +
+        `${roles.length} agente(s) de brainstorm. Sin objetivo cada rol se inventaria el suyo y ` +
+        'el plan resultante pareceria fundado sin serlo. Escribe el objetivo en ' +
+        `"${filePath}" y reintenta. La tarea no se ha movido.`
+    );
+  }
+
   // El plan se escribe/migra en la carpeta ACTUAL, ANTES de mover la
   // tarea de estado — mismo orden y mismo motivo que "review" con
   // revision/ (TASK-013): si una escritura falla, la tarea no se ha
@@ -303,7 +408,10 @@ export async function runPlanCommand(
     // dos cosas — decide y protege — y ademas cierra la ventana entre
     // el stat de resolverPlanFinal y esta escritura.
     try {
-      await writeFile(ubicacion.canonica, planTemplate(task), { encoding: 'utf8', flag: 'wx' });
+      await writeFile(ubicacion.canonica, planTemplate(task, roles), {
+        encoding: 'utf8',
+        flag: 'wx',
+      });
       planCreated = true;
     } catch (e: unknown) {
       if (!isEexist(e)) throw e;
@@ -332,6 +440,80 @@ export async function runPlanCommand(
     }
   }
 
+  // --- El paquete de brainstorm (TASK-016) ---------------------------
+  // Se escribe en la carpeta ACTUAL y ANTES de mover la tarea, por el
+  // mismo motivo que la peticion de revision en TASK-013: si una
+  // escritura falla a mitad, la tarea sigue donde estaba y reintentar
+  // es posible. El orden inverso dejaria el estado movido sin
+  // peticiones, que es un callejon de la maquina de estados.
+  const brainstormDir = path.join(planificacionDir, BRAINSTORM_DIRNAME);
+  const ronda = await siguienteRonda(brainstormDir, RONDA_BRAINSTORM_RE);
+
+  // Re-planificacion (bucle B9->B5 de la 16.3): si ya hubo una ronda,
+  // NO se relanza el brainstorm entero. El feedback de la persona sobre
+  // el plan es una correccion incremental, y tratarla como un reinicio
+  // es donde mas se gasta sin que nadie lo note, precisamente porque
+  // cada vuelta parece barata. Solo reprocesa el unificador.
+  const brainstormReutilizado = ronda > 1;
+
+  try {
+    await mkdir(brainstormDir, { recursive: true });
+    if (!brainstormReutilizado) {
+      for (const rol of roles) {
+        const otros = roles.filter((r) => r.id !== rol.id);
+        await writeFile(
+          path.join(brainstormDir, nombrePeticionRol(rol, ronda)),
+          peticionRolTemplate(
+            updated,
+            secciones.objetivo,
+            secciones.criterios,
+            rol,
+            otros,
+            ronda,
+            today
+          ),
+          { encoding: 'utf8', flag: 'wx' }
+        );
+        await writeFile(
+          path.join(brainstormDir, nombreSalidaRol(rol, ronda)),
+          salidaRolTemplate(updated, rol, ronda),
+          { encoding: 'utf8', flag: 'wx' }
+        );
+      }
+    }
+    // La peticion del unificador se escribe SIEMPRE la ULTIMA. Es el
+    // testigo barato de "el brainstorm se escribio entero": si el
+    // proceso muere a mitad, su ausencia lo dice sin necesidad de
+    // inventar un fichero de estado ni una clave de frontmatter.
+    await writeFile(
+      path.join(brainstormDir, nombrePeticionUnificador(ronda)),
+      peticionUnificadorTemplate(
+        updated,
+        secciones.objetivo,
+        secciones.criterios,
+        roles,
+        ronda,
+        today,
+        resolucion,
+        path.posix.join('..', PLAN_FINAL_FILENAME)
+      ),
+      { encoding: 'utf8', flag: 'wx' }
+    );
+  } catch (e: unknown) {
+    if (!isEexist(e)) throw e;
+    // Mismo razonamiento que con plan-final.md (TASK-027): open() con
+    // O_CREAT|O_EXCL contesta EEXIST tambien cuando la ruta la ocupa un
+    // DIRECTORIO, y la numeracion de ronda ya garantiza que el hueco
+    // estaba libre. Tragarse este EEXIST dejaria "plan" diciendo que
+    // todo fue bien con un brainstorm a medias escrito.
+    throw new PlanCommandError(
+      `[ERROR] ${task.id}: no se pudo escribir la ronda ${ronda} de brainstorm en ` +
+        `"${brainstormDir}" porque alguna de sus rutas ya esta ocupada (¿restos con otro case ` +
+        'en un filesystem case-insensitive, o una carpeta con el nombre de un fichero?). ' +
+        'Limpia o renombra esa ruta y reintenta. La tarea no se ha movido.'
+    );
+  }
+
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
   const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
 
@@ -347,6 +529,17 @@ export async function runPlanCommand(
     push,
   });
 
+  // Las rutas del brainstorm se recalculan contra la carpeta de
+  // DESTINO: se escribieron en la de origen y el rename se las llevo,
+  // asi que las de arriba ya no apuntan a nada. Devolver rutas muertas
+  // seria peor que no devolverlas — el CLI las imprime para que la
+  // persona las abra.
+  const brainstormDirFinal = path.join(
+    path.dirname(newFilePath),
+    PLANIFICACION_DIRNAME,
+    BRAINSTORM_DIRNAME
+  );
+
   return {
     autoCommit: commitResult,
     id: task.id,
@@ -354,6 +547,17 @@ export async function runPlanCommand(
     planPath,
     planCreated,
     planMigrado,
+    ronda,
+    resolucion,
+    roles,
+    // Vacio en una re-planificacion: las peticiones de rol son las de
+    // la ronda anterior y llevan SU numero, no este. Componer aqui la
+    // ruta con la ronda actual devolveria ficheros que no existen.
+    peticionesRol: brainstormReutilizado
+      ? []
+      : roles.map((rol) => path.join(brainstormDirFinal, nombrePeticionRol(rol, ronda))),
+    peticionUnificador: path.join(brainstormDirFinal, nombrePeticionUnificador(ronda)),
+    brainstormReutilizado,
     asignadoA: asignadoFinal,
     asignadoCambiado,
     avisoIdentidad,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 972e790..4cd53b5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -18,9 +18,11 @@
  * aprobado), no cuando se genera la peticion.
  */
 import path from 'node:path';
-import { mkdir, readdir, writeFile } from 'node:fs/promises';
+import { mkdir, writeFile } from 'node:fs/promises';
 import type { Task } from '../core/task.js';
-import { readTareaFile, moveTareaFile, isEnoent, isEexist } from '../fs/task-store.js';
+import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
+import { siguienteRonda } from '../fs/rondas.js';
+import { fenceFor } from '../core/markdown.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import {
   isWorkspaceClean,
@@ -74,22 +76,12 @@ export interface ReviewCommandResult {
 }
 
 /**
- * Valla de backticks mas larga que cualquier apertura/cierre de valla
- * presente en el contenido embebido (CommonMark tolera hasta 3
- * espacios de sangria, que es justo lo que produce una linea de
- * contexto de diff con backticks a columna 0 — hallazgo MENOR de
- * revision por pares, TASK-013: con valla fija de 4, un diff cuyo
- * contexto contenga ```` cerraba el bloque antes de tiempo).
+ * fenceFor se mudo a core/markdown.ts en TASK-016, cuando "plan"
+ * empezo a embeber tambien texto de la persona en sus peticiones. Se
+ * re-exporta desde aqui para no romper a quien la importe de este
+ * modulo, que es donde nacio.
  */
-export function fenceFor(...contents: readonly string[]): string {
-  let max = 3;
-  for (const content of contents) {
-    for (const m of content.matchAll(/^ {0,3}(`{3,})/gm)) {
-      max = Math.max(max, (m[1] as string).length);
-    }
-  }
-  return '`'.repeat(max + 1);
-}
+export { fenceFor } from '../core/markdown.js';
 
 export function peticionTemplate(
   task: Task,
@@ -146,26 +138,6 @@ export function informeTemplate(task: Task, commitRevisado: string, ronda: numbe
   );
 }
 
-/**
- * Primera ronda libre: 1 + el mayor N entre los
- * peticion-revision-N.md / informe-revision-N.md ya presentes.
- */
-async function siguienteRonda(revisionDir: string): Promise<number> {
-  let entries: string[];
-  try {
-    entries = await readdir(revisionDir);
-  } catch (e: unknown) {
-    if (isEnoent(e)) return 1;
-    throw e;
-  }
-  let max = 0;
-  for (const entry of entries) {
-    const m = RONDA_FILE_RE.exec(entry);
-    if (m !== null) max = Math.max(max, Number(m[1]));
-  }
-  return max + 1;
-}
-
 export async function runReviewCommand(
   tareasRoot: string,
   argv: readonly string[],
@@ -255,7 +227,7 @@ export async function runReviewCommand(
   // pisar una revision anterior — mismo principio que plan-final.md.
   const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
   await mkdir(revisionDir, { recursive: true });
-  const ronda = await siguienteRonda(revisionDir);
+  const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);
   try {
     await writeFile(
       path.join(revisionDir, `peticion-revision-${ronda}.md`),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
new file mode 100644
index 0000000..ef066d8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/heuristica.ts
@@ -0,0 +1,725 @@
+/**
+ * `scripts/heuristica-complejidad.yml` — lectura, validacion y las
+ * cuatro operaciones que ese fichero habilita: puntuar una tarea,
+ * traducir la puntuacion a un nivel, mirar en la tabla cuantos agentes
+ * de brainstorm pide ese nivel, y resolver el numero final para una
+ * tarea concreta.
+ *
+ * Hasta hoy el YML no lo leia nadie desde `src/`: existia con sus
+ * tests pero sin consumidor. Este modulo es ese consumidor.
+ *
+ * MISMA DOCTRINA QUE src/core/config.ts, y por los mismos motivos:
+ *
+ * 1. FALLO CERRADO. Una clave desconocida, una clave obligatoria
+ *    ausente, un valor del tipo equivocado o un numero negativo
+ *    ABORTAN. Nunca hay caida al default en silencio. Aqui la regla
+ *    aprieta MAS que en config.yml: alli las tres claves son
+ *    opcionales porque un repo sin configuracion es normal; aqui NO
+ *    hay defaults en codigo y las 22 claves son obligatorias, porque
+ *    este fichero lo distribuye el propio plugin y una clave que falta
+ *    no significa "usa lo de siempre", significa que el fichero esta
+ *    roto o que alguien lo edito a medias.
+ * 2. UN SOLO PARSER. El bucle `clave: valor` es el de frontmatter.ts,
+ *    via parseBloqueClaveValor(). Aqui no hay ni una linea de parseo
+ *    de YAML. Se le pasa `permitirComentariosDeLinea: true` porque el
+ *    fichero empieza por un comentario: sin eso la lectura falla en su
+ *    primera linea, y el propio YML lo avisa.
+ * 3. UN SOLO PUNTO DE RESOLUCION. cargarHeuristica() devuelve la
+ *    heuristica ya validada; ningun comando lee el fichero por su
+ *    cuenta.
+ *
+ * ------------------------------------------------------------------
+ * DIVERGENCIA DELIBERADA CON LA SECCION 5 DEL YML (aprobada por
+ * Carlos, 2026-09-08).
+ *
+ * La seccion 5 del fichero dice que, cuando el nivel heuristico y el
+ * declarado por la persona disten mas de `tolerancia_niveles`
+ * escalones, se consulte a un modelo barato para desempatar. Este
+ * modulo NO hace eso, porque el CLI no invoca modelos: `taskctl` hace
+ * lo determinista y deja escrito lo que otro tiene que disparar (mismo
+ * reparto que `taskctl review` establecio en TASK-013). Meter aqui una
+ * llamada a un modelo cambiaria esa frontera entera.
+ *
+ * En su lugar, resolverNumeroAgentes() resuelve la discrepancia SIN
+ * consultar a nadie: se queda con el MAYOR de los dos numeros de
+ * agentes. Es la eleccion conservadora en la direccion que el propio
+ * YML senala como la cara ("infraestimar deja la tarea con menos
+ * revision de la que necesita"), y ademas nunca ignora lo que la
+ * persona declaro: si declara mas de lo que la heuristica ve, manda lo
+ * declarado. La discrepancia no se traga: sale en
+ * `ResolucionAgentes.hayDiscrepancia` junto con los dos niveles y las
+ * senales, para que quien orqueste pueda mostrarla o consultarla el.
+ *
+ * EFECTO MEDIDO DEL MAX, sobre las 32 tareas reales del repo el
+ * 2026-09-08 (no es una estimacion: se ejecuto sobre ellas):
+ *
+ *   - Declarado y heuristico coinciden en 7 de 32.
+ *   - CERO tareas disparan una sola palabra de alto riesgo. La senal
+ *     mas cara del YML — la unica que mira el CONTENIDO del trabajo y
+ *     no su forma — no se activa nunca, porque los objetivos estan
+ *     escritos en vocabulario de metodologia y no de dominio tecnico.
+ *     La puntuacion acaba gobernada por etiquetas, dependencias y
+ *     numero de criterios, y por eso infraestima de forma sistematica.
+ *   - NINGUNA tarea acaba con 0 roles. El reparto real es 14 tareas
+ *     con 1 rol, 14 con 2 y 4 con 3.
+ *
+ * Ese ultimo punto merece leerse dos veces, porque es una consecuencia
+ * que la decision no perseguia: el YML dice "0 en trivial (no se paga
+ * un brainstorm para algo trivial)", y con el max ese 0 es
+ * practicamente inalcanzable — basta que la tarea declare dos
+ * dependencias, o cinco criterios de aceptacion, para que la
+ * heuristica la suba a `simple` y el max le ponga un rol. La unica
+ * tarea declarada `trivial` del repo (TASK-005) sale con 1.
+ *
+ * No se corrige por cuenta propia porque el max lo aprobo Carlos con
+ * el caso delante, y respetar el suelo del declarado seria reabrir esa
+ * decision. Queda escrito aqui y fijado en un test para que sea una
+ * eleccion consciente y no un descubrimiento dentro de seis meses.
+ *
+ * CONSECUENCIA QUE HAY QUE DECIR EN VOZ ALTA: `tolerancia_niveles`,
+ * `tolerancia_extra_si_heuristica_menor` y
+ * `modelo_consulta_discrepancia` SE PARSEAN Y SE VALIDAN, PERO HOY NO
+ * TIENEN NINGUN CONSUMIDOR. No las lee nadie para decidir nada. Se
+ * siguen validando para que el fichero no pueda degradarse sin que
+ * salte nada, y estan en la interfaz `Heuristica` para que quien
+ * implemente la consulta a un modelo (fuera del CLI) las tenga. Pero
+ * no se finge que se aplican: hoy el comportamiento seria identico si
+ * el fichero dijera `tolerancia_niveles: 99`. Este proyecto ya se
+ * quemo con `codex-review`, una clave documentada e inexistente; la
+ * respuesta a eso es decirlo, no disimularlo.
+ * ------------------------------------------------------------------
+ */
+import { readFileSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import { parseBloqueClaveValor } from './frontmatter.js';
+import { extraerSecciones, normalizarTexto } from './tarea-body.js';
+import type { Task, TaskComplexity, TaskType } from './task.js';
+
+export class HeuristicaError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'HeuristicaError';
+  }
+}
+
+export interface Heuristica {
+  peso_etiqueta_adicional: number;
+  peso_palabra_alto_riesgo: number;
+  peso_dependencia: number;
+  peso_tipo_release: number;
+  peso_tipo_hotfix_con_palabra_riesgo: number;
+  peso_criterios_aceptacion: number;
+  umbral_criterios_aceptacion: number;
+  nivel_trivial_hasta: number;
+  nivel_simple_hasta: number;
+  nivel_media_hasta: number;
+  nivel_alta_hasta: number;
+  nivel_critica_desde: number;
+  palabras_alto_riesgo: string[];
+  agentes_brainstorm_trivial: number;
+  agentes_brainstorm_simple: number;
+  agentes_brainstorm_media: number;
+  agentes_brainstorm_alta: number;
+  agentes_brainstorm_critica: number;
+  agentes_brainstorm_hotfix: number;
+  tolerancia_niveles: number;
+  tolerancia_extra_si_heuristica_menor: number;
+  modelo_consulta_discrepancia: string;
+}
+
+/** Una senal encontrada al puntuar, para poder explicar el resultado. */
+export interface Senal {
+  clave: string;
+  detalle: string;
+  puntos: number;
+}
+
+export interface ResolucionAgentes {
+  /** El numero FINAL de roles a lanzar. */
+  agentes: number;
+  nivelDeclarado: TaskComplexity;
+  nivelHeuristico: TaskComplexity;
+  puntos: number;
+  senales: Senal[];
+  /** Los dos niveles difieren. */
+  hayDiscrepancia: boolean;
+  /** El min() de hotfix recorto el numero. */
+  topeHotfixAplicado: boolean;
+}
+
+/**
+ * Las claves cuyo valor es un entero >= 0. El orden es el del fichero,
+ * para que el mensaje de "clave desconocida" las enumere en el mismo
+ * orden en que estan escritas y sea facil compararlos a ojo.
+ */
+const CLAVES_NUMERICAS = [
+  'peso_etiqueta_adicional',
+  'peso_palabra_alto_riesgo',
+  'peso_dependencia',
+  'peso_tipo_release',
+  'peso_tipo_hotfix_con_palabra_riesgo',
+  'peso_criterios_aceptacion',
+  'umbral_criterios_aceptacion',
+  'nivel_trivial_hasta',
+  'nivel_simple_hasta',
+  'nivel_media_hasta',
+  'nivel_alta_hasta',
+  'nivel_critica_desde',
+  'agentes_brainstorm_trivial',
+  'agentes_brainstorm_simple',
+  'agentes_brainstorm_media',
+  'agentes_brainstorm_alta',
+  'agentes_brainstorm_critica',
+  'agentes_brainstorm_hotfix',
+  'tolerancia_niveles',
+  'tolerancia_extra_si_heuristica_menor',
+] as const;
+
+const CLAVE_PALABRAS = 'palabras_alto_riesgo';
+const CLAVE_MODELO = 'modelo_consulta_discrepancia';
+
+/** Las unicas claves admitidas. Cualquier otra aborta (regla 1). */
+export const CLAVES_HEURISTICA: readonly string[] = [
+  ...CLAVES_NUMERICAS,
+  CLAVE_PALABRAS,
+  CLAVE_MODELO,
+];
+
+/** Nombre del fichero dentro de `scripts/`. */
+export const FICHERO_HEURISTICA = 'heuristica-complejidad.yml';
+
+/** Claves de `Senal.clave`. Son la unica forma de agrupar las senales. */
+export const SENAL_ETIQUETAS = 'etiquetas_adicionales';
+export const SENAL_PALABRA = 'palabra_alto_riesgo';
+export const SENAL_DEPENDENCIA = 'dependencias';
+export const SENAL_RELEASE = 'tipo_release';
+export const SENAL_HOTFIX_RIESGO = 'tipo_hotfix_con_palabra_riesgo';
+export const SENAL_CRITERIOS = 'criterios_aceptacion';
+
+function packageRoot(): string {
+  // dist/src/core/heuristica.js -> dist/src/core -> dist/src -> dist -> raiz
+  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+  return path.join(moduleDir, '..', '..', '..');
+}
+
+/**
+ * Ruta del YML. Mismo patron que resolveGitflowScriptsDir(): respeta
+ * CLAUDE_PLUGIN_ROOT (convencion documentada para cuando Claude Code
+ * lanza taskctl como comando de plugin) si esta definida; si no,
+ * calcula la ruta relativa al propio modulo compilado, necesario para
+ * el dogfooding directo, donde esa variable no esta puesta.
+ */
+export function resolverRutaHeuristica(): string {
+  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
+    return path.join(pluginRoot, 'scripts', FICHERO_HEURISTICA);
+  }
+  return path.join(packageRoot(), 'scripts', FICHERO_HEURISTICA);
+}
+
+/**
+ * EL punto de resolucion. Lee el fichero y lo valida, o lanza
+ * HeuristicaError.
+ *
+ * No hay caso de "no hay fichero, usa los defaults": el YML lo
+ * distribuye el plugin, asi que si falta es que la instalacion esta
+ * rota, y seguir con unos pesos inventados en codigo daria numeros que
+ * no se corresponden con ningun fichero que nadie pueda leer.
+ *
+ * No cachea, por el mismo motivo que resolverConfig: una cache seria
+ * estado global compartido entre tests.
+ */
+export function cargarHeuristica(ruta?: string): Heuristica {
+  const rutaFinal = ruta ?? resolverRutaHeuristica();
+  let contenido: string;
+  try {
+    contenido = readFileSync(rutaFinal, 'utf8');
+  } catch (e: unknown) {
+    const msg = e instanceof Error ? e.message : String(e);
+    throw new HeuristicaError(
+      `[ERROR] No se pudo leer la heuristica de complejidad "${rutaFinal}": ${msg}\n` +
+        '        Ese fichero lo trae el plugin. Reinstalalo, o define CLAUDE_PLUGIN_ROOT\n' +
+        '        apuntando a la raiz del plugin si lo ejecutas desde otro sitio.'
+    );
+  }
+  return parsearHeuristica(contenido, rutaFinal);
+}
+
+/**
+ * Separada de cargarHeuristica para poder probar el parseo y la
+ * validacion sin disco, y para que el mensaje de error siempre pueda
+ * nombrar el fichero de donde salio el problema.
+ */
+export function parsearHeuristica(contenido: string, ruta: string): Heuristica {
+  const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
+    etiqueta: 'heuristica de complejidad',
+    crearError: (mensaje) => new HeuristicaError(`[ERROR] ${ruta}: ${mensaje}`),
+    permitirComentariosDeLinea: true,
+  });
+
+  const numeros = new Map<string, number>();
+  let palabras: string[] | undefined;
+  let modelo: string | undefined;
+  const vistas = new Set<string>();
+
+  for (const par of pares) {
+    const donde = `${ruta}:${par.numeroLinea}`;
+
+    if (!CLAVES_HEURISTICA.includes(par.clave)) {
+      throw new HeuristicaError(mensajeClaveDesconocida(donde, par.clave));
+    }
+    // Una clave repetida se pisaria en silencio (el ultimo gana) y el
+    // fichero diria una cosa mientras el plugin usa otra: mismo dano
+    // que un default silencioso, misma respuesta.
+    if (vistas.has(par.clave)) {
+      throw new HeuristicaError(
+        `[ERROR] ${donde}: la clave "${par.clave}" esta repetida.\n` +
+          '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.'
+      );
+    }
+    vistas.add(par.clave);
+
+    if (par.clave === CLAVE_PALABRAS) {
+      palabras = validarListaDeTexto(donde, par.clave, par.valor);
+    } else if (par.clave === CLAVE_MODELO) {
+      modelo = validarTextoNoVacio(donde, par.clave, par.valor);
+    } else {
+      numeros.set(par.clave, validarEnteroNoNegativo(donde, par.clave, par.valor));
+    }
+  }
+
+  const h: Heuristica = {
+    peso_etiqueta_adicional: exigirNumero(numeros, 'peso_etiqueta_adicional', ruta),
+    peso_palabra_alto_riesgo: exigirNumero(numeros, 'peso_palabra_alto_riesgo', ruta),
+    peso_dependencia: exigirNumero(numeros, 'peso_dependencia', ruta),
+    peso_tipo_release: exigirNumero(numeros, 'peso_tipo_release', ruta),
+    peso_tipo_hotfix_con_palabra_riesgo: exigirNumero(
+      numeros,
+      'peso_tipo_hotfix_con_palabra_riesgo',
+      ruta
+    ),
+    peso_criterios_aceptacion: exigirNumero(numeros, 'peso_criterios_aceptacion', ruta),
+    umbral_criterios_aceptacion: exigirNumero(numeros, 'umbral_criterios_aceptacion', ruta),
+    nivel_trivial_hasta: exigirNumero(numeros, 'nivel_trivial_hasta', ruta),
+    nivel_simple_hasta: exigirNumero(numeros, 'nivel_simple_hasta', ruta),
+    nivel_media_hasta: exigirNumero(numeros, 'nivel_media_hasta', ruta),
+    nivel_alta_hasta: exigirNumero(numeros, 'nivel_alta_hasta', ruta),
+    nivel_critica_desde: exigirNumero(numeros, 'nivel_critica_desde', ruta),
+    palabras_alto_riesgo: exigirLista(palabras, CLAVE_PALABRAS, ruta),
+    agentes_brainstorm_trivial: exigirNumero(numeros, 'agentes_brainstorm_trivial', ruta),
+    agentes_brainstorm_simple: exigirNumero(numeros, 'agentes_brainstorm_simple', ruta),
+    agentes_brainstorm_media: exigirNumero(numeros, 'agentes_brainstorm_media', ruta),
+    agentes_brainstorm_alta: exigirNumero(numeros, 'agentes_brainstorm_alta', ruta),
+    agentes_brainstorm_critica: exigirNumero(numeros, 'agentes_brainstorm_critica', ruta),
+    agentes_brainstorm_hotfix: exigirNumero(numeros, 'agentes_brainstorm_hotfix', ruta),
+    tolerancia_niveles: exigirNumero(numeros, 'tolerancia_niveles', ruta),
+    tolerancia_extra_si_heuristica_menor: exigirNumero(
+      numeros,
+      'tolerancia_extra_si_heuristica_menor',
+      ruta
+    ),
+    modelo_consulta_discrepancia: exigirTexto(modelo, CLAVE_MODELO, ruta),
+  };
+
+  validarEscalaDeNiveles(h, ruta);
+  return h;
+}
+
+/**
+ * La escala tiene que ser estrictamente creciente y no dejar huecos.
+ *
+ * No es celo: nivelHeuristico() es una cascada de "<=" y su ultimo
+ * caso devuelve `critica` sin volver a mirar `nivel_critica_desde`.
+ * Eso solo es correcto si `nivel_critica_desde` es exactamente
+ * `nivel_alta_hasta + 1`. Con `alta_hasta: 7` y `critica_desde: 10`,
+ * un 8 o un 9 no serian ni alta (el fichero dice que alta acaba en 7)
+ * ni critica (dice que critica empieza en 10) — el fichero describiria
+ * una escala con un agujero y el codigo devolveria `critica`
+ * calladamente, contradiciendolo. Comprobarlo aqui es lo que permite
+ * que la cascada no vuelva a leer esa clave: la redundancia es cierta
+ * porque se exige, no porque se suponga.
+ */
+function validarEscalaDeNiveles(h: Heuristica, ruta: string): void {
+  const escalones: readonly (readonly [string, number])[] = [
+    ['nivel_trivial_hasta', h.nivel_trivial_hasta],
+    ['nivel_simple_hasta', h.nivel_simple_hasta],
+    ['nivel_media_hasta', h.nivel_media_hasta],
+    ['nivel_alta_hasta', h.nivel_alta_hasta],
+  ];
+  for (let i = 1; i < escalones.length; i++) {
+    const previo = escalones[i - 1] as readonly [string, number];
+    const actual = escalones[i] as readonly [string, number];
+    if (actual[1] <= previo[1]) {
+      throw new HeuristicaError(
+        `[ERROR] ${ruta}: "${actual[0]}" (${actual[1]}) tiene que ser mayor que ` +
+          `"${previo[0]}" (${previo[1]}).\n` +
+          '        Cada clave nivel_*_hasta es el ultimo valor que TODAVIA cae en ese\n' +
+          '        nivel, asi que la escala tiene que ir siempre a mas. Sube la segunda\n' +
+          '        o baja la primera.'
+      );
+    }
+  }
+  if (h.nivel_critica_desde !== h.nivel_alta_hasta + 1) {
+    throw new HeuristicaError(
+      `[ERROR] ${ruta}: "nivel_critica_desde" (${h.nivel_critica_desde}) tiene que ser ` +
+        `exactamente "nivel_alta_hasta" + 1 (${h.nivel_alta_hasta + 1}).\n` +
+        '        Con cualquier otro valor la escala deja un hueco (o un solape) y hay\n' +
+        '        puntuaciones que no caen en ningun nivel. Ajusta una de las dos.'
+    );
+  }
+}
+
+/**
+ * Enumera SIEMPRE las claves validas y, si la escrita se parece a una
+ * de ellas, la propone. Mismo criterio que config.ts: el mensaje dice
+ * que esta mal Y cuales son las validas.
+ */
+function mensajeClaveDesconocida(donde: string, clave: string): string {
+  const sugerida = claveMasParecida(clave);
+  const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
+  if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
+  lineas.push('        Borrala o corrigela: taskctl no usa una heuristica que no entiende.');
+  lineas.push(`        Claves validas: ${CLAVES_HEURISTICA.join(', ')}.`);
+  return lineas.join('\n');
+}
+
+/** Distancia de edicion (Levenshtein) a mano — cero dependencias. */
+function distanciaEdicion(a: string, b: string): number {
+  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
+  for (let i = 1; i <= a.length; i++) {
+    const actual = [i];
+    for (let j = 1; j <= b.length; j++) {
+      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
+      actual[j] = Math.min(
+        (actual[j - 1] as number) + 1,
+        (previa[j] as number) + 1,
+        (previa[j - 1] as number) + coste
+      );
+    }
+    previa = actual;
+  }
+  return previa[b.length] as number;
+}
+
+function claveMasParecida(clave: string): string | null {
+  let mejor: string | null = null;
+  let mejorDistancia = Number.POSITIVE_INFINITY;
+  for (const valida of CLAVES_HEURISTICA) {
+    const d = distanciaEdicion(clave.toLowerCase(), valida);
+    if (d < mejorDistancia) {
+      mejorDistancia = d;
+      mejor = valida;
+    }
+  }
+  // Umbral: hasta un tercio de la clave, como en config.ts. Sin el,
+  // "foo" propondria una clave cualquiera y el consejo no valdria nada.
+  return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
+}
+
+/**
+ * Entero >= 0. El cero SI es legitimo aqui, a diferencia de
+ * `limite_wip` en config.ts: `agentes_brainstorm_trivial: 0` es la
+ * decision central del fichero (no se paga un brainstorm para algo
+ * trivial) y `tolerancia_extra_si_heuristica_menor: 0` es su valor por
+ * defecto declarado. Lo que no puede ser es negativo: un peso negativo
+ * restaria complejidad por tener una senal mas, que es lo contrario de
+ * lo que el fichero dice hacer.
+ */
+function validarEnteroNoNegativo(donde: string, clave: string, valor: unknown): number {
+  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
+    throw new HeuristicaError(
+      `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, ` +
+        `y es ${describirValor(valor)}.\n` +
+        '        Escribe el numero sin comillas y sin decimales. Un negativo restaria\n' +
+        '        complejidad por tener una senal de mas, que es justo lo contrario de lo\n' +
+        '        que hace esta heuristica.'
+    );
+  }
+  return valor;
+}
+
+/**
+ * Lista de textos no vacios. Una lista VACIA se acepta: un proyecto
+ * que edite su copia del fichero para no tener vocabulario de riesgo
+ * esta tomando una decision legitima, y el resto de senales sigue
+ * funcionando. Lo que no se acepta es que no sea una lista: escrito
+ * sin corchetes, el parser devuelve un texto y la comparacion por
+ * subcadena buscaria la frase entera como si fuera una sola entrada.
+ */
+function validarListaDeTexto(donde: string, clave: string, valor: unknown): string[] {
+  if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
+    throw new HeuristicaError(
+      `[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes ` +
+        `(p. ej. ["migracion", "seguridad"]), y es ${describirValor(valor)}.\n` +
+        '        Sin corchetes se leeria como UNA sola entrada con todo el texto dentro.'
+    );
+  }
+  const entradas = (valor as string[]).map((x) => x.trim());
+  if (entradas.some((x) => x === '')) {
+    throw new HeuristicaError(
+      `[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.\n` +
+        '        Quitala: una entrada vacia casaria como subcadena con CUALQUIER tarea\n' +
+        '        y dispararia la senal siempre.'
+    );
+  }
+  // La regla "una vez por entrada DISTINTA" se cumple porque se
+  // recorre la lista, no el texto. Eso deja de ser cierto si la lista
+  // trae la misma entrada dos veces: casaria en las dos vueltas y la
+  // palabra puntuaria doble. Es exactamente el fallo silencioso que la
+  // regla existe para evitar, asi que se rechaza aqui en vez de
+  // deduplicar por detras (deduplicar callaria el error del fichero).
+  const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
+  if (repetida !== undefined) {
+    throw new HeuristicaError(
+      `[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.\n` +
+        '        Deja solo una: la lista se recorre entera, asi que una entrada dos\n' +
+        '        veces haria que esa palabra puntuara el doble que las demas.'
+    );
+  }
+  return entradas;
+}
+
+function validarTextoNoVacio(donde: string, clave: string, valor: unknown): string {
+  if (typeof valor !== 'string' || valor.trim() === '') {
+    throw new HeuristicaError(
+      `[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.\n` +
+        '        Ponle el nombre de un modelo (p. ej. haiku) o corrige la linea.'
+    );
+  }
+  return valor.trim();
+}
+
+/** Como se nombra un valor rechazado en un mensaje de error. */
+function describirValor(valor: unknown): string {
+  if (valor === null) return 'un valor vacio';
+  if (Array.isArray(valor)) return `una lista (${JSON.stringify(valor)})`;
+  if (typeof valor === 'string') return `el texto "${valor}"`;
+  return `${String(valor)} (${typeof valor})`;
+}
+
+function mensajeClaveAusente(ruta: string, clave: string): string {
+  return (
+    `[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
+    '        Todas las claves de este fichero son obligatorias: no hay valores por\n' +
+    '        defecto en el codigo a proposito, para que la heuristica sea siempre la\n' +
+    `        que pone el fichero. Anade la linea "${clave}: <valor>" o restaura el\n` +
+    '        fichero que trae el plugin.'
+  );
+}
+
+function exigirNumero(numeros: Map<string, number>, clave: string, ruta: string): number {
+  const valor = numeros.get(clave);
+  if (valor === undefined) throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
+  return valor;
+}
+
+function exigirLista(valor: string[] | undefined, clave: string, ruta: string): string[] {
+  if (valor === undefined) throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
+  return valor;
+}
+
+function exigirTexto(valor: string | undefined, clave: string, ruta: string): string {
+  if (valor === undefined) throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
+  return valor;
+}
+
+/**
+ * Puntua una tarea sumando las senales de la seccion 1 del YML. No hay
+ * tope: una tarea con muchas senales debe poder salirse por arriba de
+ * la escala.
+ *
+ * Se devuelve la lista de senales ademas de la suma porque el numero
+ * solo no se puede discutir: quien vea "6 puntos" tiene que poder ver
+ * de donde salieron sin releer la tarea.
+ */
+export function puntuarTarea(
+  task: Task,
+  body: string,
+  h: Heuristica
+): { puntos: number; senales: Senal[] } {
+  const senales: Senal[] = [];
+  const { objetivo, criterios } = extraerSecciones(body);
+
+  // 1. Etiquetas MAS ALLA DE LA PRIMERA. La primera no puntua: toda
+  //    tarea toca al menos un area y eso no la complica.
+  const adicionales = Math.max(0, task.etiquetas.length - 1);
+  if (adicionales > 0) {
+    senales.push({
+      clave: SENAL_ETIQUETAS,
+      detalle: `${task.etiquetas.length} etiquetas (${adicionales} mas alla de la primera)`,
+      puntos: adicionales * h.peso_etiqueta_adicional,
+    });
+  }
+
+  // 2. Palabras de alto riesgo. UNA VEZ POR ENTRADA DISTINTA que
+  //    aparezca en objetivo+criterios, sin importar cuantas veces
+  //    aparece ni en que seccion (regla escrita en el YML). Por eso se
+  //    normaliza el texto una vez y se recorre la LISTA, no el texto:
+  //    recorrer el texto obligaria a deduplicar despues y es donde se
+  //    cuela el conteo doble.
+  const encontradas = palabrasDeRiesgoEncontradas(objetivo, criterios, h);
+  for (const palabra of encontradas) {
+    senales.push({
+      clave: SENAL_PALABRA,
+      detalle: palabra,
+      puntos: h.peso_palabra_alto_riesgo,
+    });
+  }
+
+  // 3. Cada dependencia declarada de otra tarea.
+  if (task.dependencias.length > 0) {
+    senales.push({
+      clave: SENAL_DEPENDENCIA,
+      detalle: `${task.dependencias.length} dependencias (${task.dependencias.join(', ')})`,
+      puntos: task.dependencias.length * h.peso_dependencia,
+    });
+  }
+
+  // 4. La tarea es de tipo release.
+  if (task.tipo === 'release') {
+    senales.push({ clave: SENAL_RELEASE, detalle: 'tipo release', puntos: h.peso_tipo_release });
+  }
+
+  // 5. Hotfix Y ADEMAS alguna palabra de riesgo. Un hotfix no puntua
+  //    por serlo: urgencia no es complejidad. Lo que puntua es un
+  //    hotfix que toca ademas terreno delicado.
+  if (task.tipo === 'hotfix' && encontradas.length > 0) {
+    senales.push({
+      clave: SENAL_HOTFIX_RIESGO,
+      detalle: `hotfix que toca ${encontradas.join(', ')}`,
+      puntos: h.peso_tipo_hotfix_con_palabra_riesgo,
+    });
+  }
+
+  // 6. Umbral de criterios. Se paga UNA sola vez, no por criterio.
+  if (criterios.length >= h.umbral_criterios_aceptacion) {
+    senales.push({
+      clave: SENAL_CRITERIOS,
+      detalle: `${criterios.length} criterios (umbral: ${h.umbral_criterios_aceptacion})`,
+      puntos: h.peso_criterios_aceptacion,
+    });
+  }
+
+  const puntos = senales.reduce((suma, s) => suma + s.puntos, 0);
+  return { puntos, senales };
+}
+
+/**
+ * Las entradas DISTINTAS de palabras_alto_riesgo que aparecen en el
+ * texto, en el orden de la lista. Comparacion por subcadena (una
+ * entrada corta cubre sus variantes: "migracion" cubre "migraciones"),
+ * insensible a mayusculas y a acentos por ambos lados.
+ *
+ * AQUI ESTA LA REGLA DE CONTEO, y esta en la forma del bucle: se
+ * recorre LA LISTA y se pregunta si cada entrada sale en el texto.
+ * Recorrer el texto buscando coincidencias daria una por aparicion y
+ * habria que deduplicar despues, que es donde se cuela el conteo
+ * doble. Por eso el texto se junta antes en uno solo: que una entrada
+ * salga en el objetivo Y en los criterios tampoco puede sumar dos
+ * veces. La otra mitad de la garantia la pone validarListaDeTexto(),
+ * que prohibe entradas repetidas en la propia lista.
+ */
+function palabrasDeRiesgoEncontradas(
+  objetivo: string,
+  criterios: readonly string[],
+  h: Heuristica
+): string[] {
+  const texto = normalizarTexto([objetivo, ...criterios].join('\n'));
+  const encontradas: string[] = [];
+  for (const palabra of h.palabras_alto_riesgo) {
+    if (texto.includes(normalizarTexto(palabra))) encontradas.push(palabra);
+  }
+  return encontradas;
+}
+
+/**
+ * Traduce una puntuacion a un nivel de complejidad segun la seccion 2
+ * del YML: cada `nivel_*_hasta` es el ultimo valor que TODAVIA cae en
+ * ese nivel.
+ *
+ * `nivel_critica_desde` no aparece en la cascada porque
+ * validarEscalaDeNiveles() exige que sea `nivel_alta_hasta + 1`, con
+ * lo cual todo lo que pasa de alta es critica por construccion. Se
+ * valida precisamente para que esa redundancia sea cierta: si algun
+ * dia se quiere abrir un hueco entre alta y critica, esto habra que
+ * reescribirlo, no tragarselo.
+ */
+export function nivelHeuristico(puntos: number, h: Heuristica): TaskComplexity {
+  if (puntos <= h.nivel_trivial_hasta) return 'trivial';
+  if (puntos <= h.nivel_simple_hasta) return 'simple';
+  if (puntos <= h.nivel_media_hasta) return 'media';
+  if (puntos <= h.nivel_alta_hasta) return 'alta';
+  return 'critica';
+}
+
+/** El valor crudo de la tabla por nivel, sin la excepcion por tipo. */
+function agentesPorNivel(nivel: TaskComplexity, h: Heuristica): number {
+  switch (nivel) {
+    case 'trivial':
+      return h.agentes_brainstorm_trivial;
+    case 'simple':
+      return h.agentes_brainstorm_simple;
+    case 'media':
+      return h.agentes_brainstorm_media;
+    case 'alta':
+      return h.agentes_brainstorm_alta;
+    case 'critica':
+      return h.agentes_brainstorm_critica;
+  }
+}
+
+/**
+ * Cuantos agentes de brainstorm pide un (nivel, tipo).
+ *
+ * La excepcion de hotfix es un TOPE, NO UNA SUSTITUCION: el numero es
+ * el MENOR entre lo que dice la tabla y `agentes_brainstorm_hotfix`.
+ * La diferencia solo se ve en el extremo barato, y es justo donde
+ * importa: un hotfix que puntua trivial se queda en 0 agentes, no sube
+ * a 1. Seria absurdo que la clave que existe para ABREVIAR el
+ * brainstorm acabase anadiendo un agente donde la tabla no pedia
+ * ninguno.
+ */
+export function agentesBrainstorm(nivel: TaskComplexity, tipo: TaskType, h: Heuristica): number {
+  const porNivel = agentesPorNivel(nivel, h);
+  if (tipo === 'hotfix') return Math.min(porNivel, h.agentes_brainstorm_hotfix);
+  return porNivel;
+}
+
+/**
+ * El numero final de agentes para una tarea concreta, mas todo lo que
+ * hace falta para explicarlo.
+ *
+ * Se toma el MAYOR entre lo que piden el nivel declarado y el
+ * heuristico (ver la divergencia documentada en la cabecera del
+ * modulo). El tope de hotfix va aplicado DENTRO de cada llamada a
+ * agentesBrainstorm(), es decir ANTES del max — y el resultado sigue
+ * topado, porque max(min(a,c), min(b,c)) === min(max(a,b), c): el
+ * orden entre min y max no cambia el resultado. Se escribe asi, y no
+ * al reves, porque cada uno de los dos numeros que se comparan tiene
+ * que ser un numero de agentes valido POR SI MISMO; comparar dos
+ * valores sin topar y topar al final funcionaria hoy por esa igualdad,
+ * pero dejaria en el codigo dos numeros intermedios que no significan
+ * nada.
+ */
+export function resolverNumeroAgentes(task: Task, body: string, h: Heuristica): ResolucionAgentes {
+  const { puntos, senales } = puntuarTarea(task, body, h);
+  const nivelDeclarado = task.complejidad;
+  const nivelH = nivelHeuristico(puntos, h);
+
+  const agentes = Math.max(
+    agentesBrainstorm(nivelDeclarado, task.tipo, h),
+    agentesBrainstorm(nivelH, task.tipo, h)
+  );
+  const sinTope = Math.max(agentesPorNivel(nivelDeclarado, h), agentesPorNivel(nivelH, h));
+
+  return {
+    agentes,
+    nivelDeclarado,
+    nivelHeuristico: nivelH,
+    puntos,
+    senales,
+    hayDiscrepancia: nivelDeclarado !== nivelH,
+    topeHotfixAplicado: agentes < sinTope,
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/markdown.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/markdown.ts
new file mode 100644
index 0000000..35e0fd5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/markdown.ts
@@ -0,0 +1,29 @@
+/**
+ * Utilidades de composicion de Markdown compartidas por los comandos
+ * que embeben contenido ajeno en un fichero (`review` con el diff,
+ * `plan` con el objetivo y los criterios de la tarea).
+ *
+ * `fenceFor` vivia en commands/review.ts desde TASK-013 y era el unico
+ * que la usaba. TASK-016 la necesita tambien desde commands/plan.ts, y
+ * que un comando importe de otro es acoplamiento lateral: los dos
+ * dependen ahora de este modulo y `review.ts` la re-exporta para no
+ * romper a quien ya la importaba de alli.
+ */
+
+/**
+ * Valla de backticks mas larga que cualquier apertura/cierre de valla
+ * presente en el contenido embebido (CommonMark tolera hasta 3
+ * espacios de sangria, que es justo lo que produce una linea de
+ * contexto de diff con backticks a columna 0 — hallazgo MENOR de
+ * revision por pares, TASK-013: con valla fija de 4, un diff cuyo
+ * contexto contenga ```` cerraba el bloque antes de tiempo).
+ */
+export function fenceFor(...contents: readonly string[]): string {
+  let max = 3;
+  for (const content of contents) {
+    for (const m of content.matchAll(/^ {0,3}(`{3,})/gm)) {
+      max = Math.max(max, (m[1] as string).length);
+    }
+  }
+  return '`'.repeat(max + 1);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
new file mode 100644
index 0000000..c81be08
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plan-brainstorm.ts
@@ -0,0 +1,204 @@
+/**
+ * Las plantillas del brainstorm paralelo de la fase de diseno —
+ * TASK-016, item D1. Funciones puras: reciben datos y devuelven texto,
+ * sin tocar disco ni Git. Quien escribe los ficheros es commands/plan.ts.
+ *
+ * El reparto que implementan es el mismo que TASK-013 fijo para
+ * `taskctl review` y no se reabre aqui: el CLI hace lo determinista
+ * (cuantos roles, cuales, con que contexto, en que ficheros) y deja
+ * las peticiones escritas; NO invoca ningun modelo. Quien orquesta la
+ * sesion las dispara y vuelca las respuestas en los scaffolds.
+ *
+ * LO QUE ESTAS PLANTILLAS TIENEN QUE CONSEGUIR, y por que estan
+ * escritas asi: si el recorte de contexto por rol es pobre, N roles no
+ * producen N puntos de vista sino UNO CON N FIRMAS, y el unificador
+ * lee esa coincidencia como confirmacion. El sintoma es invisible al
+ * reves — el plan sale mas largo y mas seguro de si mismo. De ahi las
+ * dos medidas que no son adorno: cada peticion lleva el bloque "Que NO
+ * miras" de su rol (sin el, todo agente tiende a cubrirlo todo por si
+ * acaso, que es la forma barata de deshacer el acotado sin que se
+ * note), y la peticion del unificador le PROHIBE promediar y le exige
+ * escribir en que discrepan los roles.
+ */
+import type { Task } from './task.js';
+import type { ResolucionAgentes } from './heuristica.js';
+import type { RolBrainstorm } from './roles-brainstorm.js';
+import { fenceFor } from './markdown.js';
+
+/** `peticion-<rol>-<ronda>.md` — el rol ya viene prefijado por "brainstorm-". */
+export function nombrePeticionRol(rol: RolBrainstorm, ronda: number): string {
+  return `peticion-${rol.id}-${ronda}.md`;
+}
+
+/** `salida-<rol>-<ronda>.md` — donde el agente de ese rol vuelca su respuesta. */
+export function nombreSalidaRol(rol: RolBrainstorm, ronda: number): string {
+  return `salida-${rol.id}-${ronda}.md`;
+}
+
+export function nombrePeticionUnificador(ronda: number): string {
+  return `peticion-unificador-${ronda}.md`;
+}
+
+/** Cabecera comun a las tres plantillas: quien es la tarea y en que ronda va. */
+function cabecera(task: Task, ronda: number, fecha: string): string {
+  return (
+    `- Tarea: ${task.id} — ${task.titulo}\n` +
+    `- Tipo: ${task.tipo} · Complejidad declarada: ${task.complejidad}\n` +
+    `- Ronda: ${ronda}\n` +
+    `- Fecha: ${fecha}\n`
+  );
+}
+
+/**
+ * El enunciado de la tarea, embebido con valla dinamica: el objetivo y
+ * los criterios son texto de la persona y pueden contener backticks.
+ */
+function enunciado(objetivo: string, criterios: readonly string[]): string {
+  const criteriosBlock =
+    criterios.length === 0 ? '(la tarea no declara criterios de aceptacion)' : criterios.join('\n');
+  const fence = fenceFor(objetivo, criteriosBlock);
+  return (
+    '## Enunciado de la tarea\n\n' +
+    '### Objetivo\n\n' +
+    `${fence}\n${objetivo}\n${fence}\n\n` +
+    '### Criterios de aceptacion\n\n' +
+    `${fence}\n${criteriosBlock}\n${fence}\n`
+  );
+}
+
+/**
+ * Como se describe la discrepancia entre el nivel declarado y el
+ * heuristico. Se escribe SIEMPRE (tambien cuando coinciden): un bloque
+ * que solo aparece en el caso raro entrena a quien lo lee a no
+ * buscarlo, y ademas hace que su ausencia sea ambigua — no se sabria
+ * si es que no hay discrepancia o si es que el calculo no llego a
+ * correr.
+ */
+function bloqueComplejidad(resolucion: ResolucionAgentes): string {
+  const senales =
+    resolucion.senales.length === 0
+      ? '  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)\n'
+      : resolucion.senales.map((s) => `  - ${s.clave}: ${s.detalle} (+${s.puntos})\n`).join('');
+  const veredicto = resolucion.hayDiscrepancia
+    ? `Los dos niveles NO coinciden. Se lanzan ${resolucion.agentes} roles, que es el mayor de ` +
+      'los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te ' +
+      'senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que ' +
+      'de verdad cuesta.'
+    : `Los dos niveles coinciden. Se lanzan ${resolucion.agentes} roles.`;
+  return (
+    '## Complejidad: declarada frente a heuristica\n\n' +
+    `- Declarada en la tarea: **${resolucion.nivelDeclarado}**\n` +
+    `- Heuristica (${resolucion.puntos} puntos): **${resolucion.nivelHeuristico}**\n` +
+    '- Senales encontradas:\n' +
+    senales +
+    (resolucion.topeHotfixAplicado
+      ? '- Se aplico el tope de `hotfix`: un hotfix abrevia el brainstorm previo (nunca la ' +
+        'revision posterior).\n'
+      : '') +
+    `\n${veredicto}\n`
+  );
+}
+
+export function peticionRolTemplate(
+  task: Task,
+  objetivo: string,
+  criterios: readonly string[],
+  rol: RolBrainstorm,
+  otrosRoles: readonly RolBrainstorm[],
+  ronda: number,
+  fecha: string
+): string {
+  const companeros =
+    otrosRoles.length === 0
+      ? 'Eres el unico rol que se lanza en esta tarea.\n'
+      : `Trabajan en paralelo contigo, sin verte: ${otrosRoles
+          .map((r) => `**${r.titulo}**`)
+          .join(', ')}. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto ` +
+        'de vista repetido y lo leera como confirmacion.\n';
+  return (
+    `# Peticion de brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
+    cabecera(task, ronda, fecha) +
+    `- Rol: \`${rol.id}\` — lanzalo con el agente de ese mismo nombre\n` +
+    `- Vuelca tu respuesta en: \`${nombreSalidaRol(rol, ronda)}\`\n\n` +
+    '## Tu pregunta\n\n' +
+    `> ${rol.pregunta}\n\n` +
+    '## Que miras\n\n' +
+    rol.mira.map((m) => `- ${m}\n`).join('') +
+    '\n## Que NO miras\n\n' +
+    'No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de ' +
+    'contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:\n\n' +
+    rol.noMira.map((m) => `- ${m}\n`).join('') +
+    '\n' +
+    enunciado(objetivo, criterios) +
+    '\n## Como entregas\n\n' +
+    `Escribe en \`${nombreSalidaRol(rol, ronda)}\`, con estas secciones y en este orden:\n\n` +
+    rol.entregables.map((e) => `- ${e}\n`).join('') +
+    '\n## Reglas\n\n' +
+    '- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ' +
+    'ficheros del repo: tu salida es un documento.\n' +
+    '- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo ' +
+    'has mirado. Di de donde lo sacas.\n' +
+    '- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones ' +
+    'genericas.\n' +
+    `- ${companeros}`
+  );
+}
+
+export function salidaRolTemplate(task: Task, rol: RolBrainstorm, ronda: number): string {
+  return (
+    `# Brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
+    `- Rol: \`${rol.id}\`\n` +
+    '- Agente: (rellenar)\n\n' +
+    rol.entregables.map((e) => `## ${e}\n\n\n`).join('')
+  );
+}
+
+export function peticionUnificadorTemplate(
+  task: Task,
+  objetivo: string,
+  criterios: readonly string[],
+  roles: readonly RolBrainstorm[],
+  ronda: number,
+  fecha: string,
+  resolucion: ResolucionAgentes,
+  planFinalRelativo: string
+): string {
+  const listaSalidas =
+    roles.length === 0
+      ? '(ninguna: esta tarea no lanza brainstorm, ver el bloque de complejidad)\n'
+      : roles.map((r) => `- \`${nombreSalidaRol(r, ronda)}\` — rol ${r.titulo}\n`).join('');
+  const instruccionesConRoles =
+    roles.length === 0
+      ? 'No hay salidas de brainstorm que consolidar: redacta el plan directamente a partir del ' +
+        'enunciado. Deja dicho en el plan que se redacto sin brainstorm y por que (el numero de ' +
+        'roles sale del lookup de complejidad, no de un descuido).\n'
+      : '1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con ' +
+        'las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, ' +
+        'dicho, vale mas que un plan que finge estar completo.\n' +
+        '2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual ' +
+        'gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie ' +
+        'es la peor salida posible de este paso.\n' +
+        '3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que ' +
+        'los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.\n' +
+        '4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.\n';
+  return (
+    `# Peticion al unificador — ${task.id} (ronda ${ronda})\n\n` +
+    cabecera(task, ronda, fecha) +
+    `- Rol: \`brainstorm-unificador\`\n` +
+    `- Vuelca el resultado en: \`${planFinalRelativo}\`\n\n` +
+    '## Salidas que tienes que consolidar\n\n' +
+    listaSalidas +
+    '\n' +
+    bloqueComplejidad(resolucion) +
+    '\n## Como consolidas\n\n' +
+    instruccionesConRoles +
+    '\n## Que tiene que traer el plan final\n\n' +
+    '- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.\n' +
+    '- Los desacuerdos entre roles y como se resuelve cada uno.\n' +
+    '- Riesgos aceptados y que los contiene.\n' +
+    '- Plan de pruebas.\n' +
+    '- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es ' +
+    'obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.\n\n' +
+    enunciado(objetivo, criterios)
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roles-brainstorm.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roles-brainstorm.ts
new file mode 100644
index 0000000..e5e86d5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roles-brainstorm.ts
@@ -0,0 +1,182 @@
+/**
+ * Los roles del brainstorm paralelo de la fase de diseno (seccion 6 de
+ * la metodologia) — TASK-016, item D1.
+ *
+ * `scripts/heuristica-complejidad.yml` fija CUANTOS agentes entran; no
+ * fija CUALES, y lo dice el mismo: "esa eleccion queda abierta a
+ * proposito: depende de la tarea, y este fichero no la tiene delante".
+ * Este modulo es quien la cierra, y la cierra de forma DETERMINISTA:
+ * un orden de prioridad fijo y los N primeros. El CLI no puede juzgar
+ * que roles pide una tarea concreta sin llamar a un modelo, y llamarlo
+ * aqui seria pagar un LLM para elegir entre cuatro opciones fijas —
+ * exactamente lo que la seccion 16 viene a evitar.
+ *
+ * EL ORDEN NO ES ARBITRARIO y es la unica decision de diseño de este
+ * fichero, asi que conviene que quede escrita: es el orden en que los
+ * enumera el criterio de aceptacion 1 de la tarea (arquitectura,
+ * riesgos, testing, dominio), y sobrevive a la prueba de los extremos.
+ * Con N=1 entra arquitectura, que es el unico rol que propone una
+ * FORMA para el cambio; los otros tres reaccionan a una forma que
+ * alguien tuvo que proponer antes. Con N=3 el que se cae es dominio,
+ * que es el rol cuyo contexto (las reglas de negocio) es el que menos
+ * se puede deducir del repositorio y mas depende de que haya una
+ * persona con ese conocimiento delante.
+ *
+ * ACOPLAMIENTO CON agents/. Cada `id` de aqui tiene que ser
+ * literalmente el `name:` del frontmatter de su `agents/<id>.md`: el
+ * CLI escribe peticiones dirigidas a ese nombre, y si divergen se
+ * estarian invocando agentes que no existen. Eso NO se comprueba en
+ * caliente (leer cuatro ficheros en cada `plan` para verificar una
+ * constante es gasto sin retorno): lo comprueba la suite, en las dos
+ * direcciones, contra el contenido real de agents/.
+ */
+
+/** Los cuatro roles, en orden de prioridad. Es tambien el tipo de `id`. */
+export type RolBrainstormId =
+  | 'brainstorm-arquitectura'
+  | 'brainstorm-riesgos'
+  | 'brainstorm-testing'
+  | 'brainstorm-dominio';
+
+export interface RolBrainstorm {
+  /** Igual al `name:` del frontmatter de agents/<id>.md. */
+  id: RolBrainstormId;
+  /** Nombre corto para cabeceras y para el nombre de fichero. */
+  titulo: string;
+  /** La unica pregunta del rol. Va literal en su peticion. */
+  pregunta: string;
+  /**
+   * El recorte de contexto de la seccion 16.2: que mira ESTE rol. Cada
+   * rol tiene el suyo y ninguno se solapa con otro — si los cuatro
+   * recibieran lo mismo no habria cuatro puntos de vista, habria uno
+   * con cuatro firmas, y el unificador leeria esa coincidencia como
+   * confirmacion.
+   */
+  mira: readonly string[];
+  /**
+   * Lo que este rol NO mira, dicho explicitamente. No es decoracion:
+   * sin esta lista cada agente tiende a cubrirlo todo "por si acaso",
+   * que es la forma barata de deshacer el acotado sin que se note.
+   */
+  noMira: readonly string[];
+  /** Secciones que su salida tiene que traer. Acota el formato (16.4 punto 4). */
+  entregables: readonly string[];
+}
+
+export const ROLES_BRAINSTORM: readonly RolBrainstorm[] = Object.freeze([
+  Object.freeze({
+    id: 'brainstorm-arquitectura',
+    titulo: 'arquitectura',
+    pregunta:
+      'Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?',
+    mira: Object.freeze([
+      'Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.',
+      'Que se crea nuevo, que se extiende y en que orden se construye.',
+      'Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.',
+      'El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.',
+    ]),
+    noMira: Object.freeze([
+      'Como se prueba (es del rol de testing).',
+      'Por donde se rompe (es del rol de riesgos).',
+      'Las reglas de negocio (son del rol de dominio).',
+    ]),
+    entregables: Object.freeze([
+      'Enfoque propuesto, con rutas y nombres concretos',
+      'Que se extiende y que se crea',
+      'Limites que cruza',
+      'La decision de diseño que mas te preocupa (UNA sola)',
+    ]),
+  }),
+  Object.freeze({
+    id: 'brainstorm-riesgos',
+    titulo: 'riesgos',
+    pregunta: '¿Por donde se rompe esto?',
+    mira: Object.freeze([
+      'Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.',
+      'Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.',
+      'Compatibilidad hacia atras con los datos y ficheros que YA existen.',
+      'La vuelta atras: si esto sale mal, como se deshace y que queda inservible.',
+    ]),
+    noMira: Object.freeze([
+      'Donde encaja el cambio (es del rol de arquitectura).',
+      'Que aserciones escribir (es del rol de testing).',
+      'Las reglas de negocio (son del rol de dominio).',
+    ]),
+    entregables: Object.freeze([
+      'Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno',
+      'Estados intermedios y fallos parciales',
+      'Compatibilidad hacia atras',
+      'Vuelta atras',
+      'El riesgo que mas te preocupa (UNO solo)',
+    ]),
+  }),
+  Object.freeze({
+    id: 'brainstorm-testing',
+    titulo: 'testing',
+    pregunta: '¿Como se demuestra que esto funciona, y como envejece?',
+    mira: Object.freeze([
+      'Que es observable desde fuera, y contra que recurso real se comprueba.',
+      'Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.',
+      'Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.',
+      'Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.',
+    ]),
+    noMira: Object.freeze([
+      'Donde encaja el cambio (es del rol de arquitectura).',
+      'Por donde se rompe en produccion (es del rol de riesgos).',
+      'Las reglas de negocio (son del rol de dominio).',
+    ]),
+    entregables: Object.freeze([
+      'Que es observable sin llamar a ningun agente',
+      'Plan de pruebas, cada una con su mutacion',
+      'Aserciones trampa que hay que evitar en esta tarea concreta',
+      'Que pruebas existentes cambian de expectativa',
+      'Como envejece',
+    ]),
+  }),
+  Object.freeze({
+    id: 'brainstorm-dominio',
+    titulo: 'dominio',
+    pregunta:
+      '¿Que sabe quien va a usar esto que no se deduce leyendo el codigo?',
+    mira: Object.freeze([
+      'El vocabulario real: que nombra cada cosa quien trabaja en este dominio.',
+      'Los invariantes del negocio que ningun tipo del lenguaje impone y que aun asi no se pueden violar.',
+      'Los casos que en el codigo son simetricos y en el negocio no lo son.',
+      'Cuando una solucion correcta en codigo es incorrecta para quien la va a usar.',
+    ]),
+    noMira: Object.freeze([
+      'Donde encaja el cambio (es del rol de arquitectura).',
+      'Por donde se rompe (es del rol de riesgos).',
+      'Como se prueba (es del rol de testing).',
+    ]),
+    entregables: Object.freeze([
+      'Vocabulario e invariantes que el enfoque tiene que respetar',
+      'Donde una solucion tecnicamente correcta seria incorrecta aqui',
+      'Lo que hace falta preguntarle a una persona antes de implementar',
+    ]),
+  }),
+]);
+
+/** El id del agente unificador. No es un rol de brainstorm: consolida los que hay. */
+export const UNIFICADOR_ID = 'brainstorm-unificador';
+
+export class RolesBrainstormError extends Error {}
+
+/**
+ * Los `n` primeros roles por prioridad. `n` viene del lookup de la
+ * heuristica, que ya lo acota; que aqui se valide igualmente es a
+ * proposito: un `n` fuera de rango significa que la tabla del YML y
+ * esta lista han dejado de cuadrar, y eso tiene que gritar en vez de
+ * recortarse en silencio con un slice tolerante.
+ */
+export function seleccionarRoles(n: number): readonly RolBrainstorm[] {
+  if (!Number.isInteger(n) || n < 0 || n > ROLES_BRAINSTORM.length) {
+    throw new RolesBrainstormError(
+      `[ERROR] Se han pedido ${n} roles de brainstorm y solo hay ${ROLES_BRAINSTORM.length} ` +
+        'definidos (o el numero no es un entero >= 0). Revisa las claves ' +
+        '"agentes_brainstorm_*" de scripts/heuristica-complejidad.yml: su valor no puede ' +
+        `pasar de ${ROLES_BRAINSTORM.length}.`
+    );
+  }
+  return ROLES_BRAINSTORM.slice(0, n);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
index dd9c46e..7c316a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
@@ -42,7 +42,28 @@ export class StateMachineError extends Error {
   }
 }
 
-const TRIVIAL_SIN_APROBACION: readonly TaskComplexity[] = ['trivial', 'simple'];
+/**
+ * Complejidades EXIMIDAS del checkpoint humano antes de "start".
+ *
+ * Esta vacia desde TASK-016 (item D1), y esa es la decision, no un
+ * descuido: el punto 1 de la seccion 14 se cerro como "checkpoint
+ * humano SIEMPRE obligatorio", y hasta entonces el codigo eximia a
+ * `trivial` y `simple` — o sea que la decision estaba tomada y no
+ * aplicada. Confirmado con Carlos el 2026-09-08.
+ *
+ * Lo que sostiene la decision, con datos: la exencion no se ejercio
+ * nunca. En las 32 tareas del repo no hay ni una sola `trivial`, y de
+ * las 4 `simple` cerradas UNA ESCONDIA UN CRITICO — el mismo dato con
+ * el que se descarto el item D4 (revision ligera). Abaratar el
+ * checkpoint justo donde nunca se uso no ahorraba nada y si dejaba
+ * pasar el peor bug del proyecto.
+ *
+ * Se vacia en vez de borrarse a proposito: sigue siendo el punto unico
+ * donde se declara quien se exime, asi que reabrir la decision cuesta
+ * una linea en vez de una arqueologia. Mismo criterio que
+ * CONFIG_DEFAULTS.
+ */
+const TRIVIAL_SIN_APROBACION: readonly TaskComplexity[] = [];
 
 function err(
   taskId: string,
@@ -161,7 +182,7 @@ export function assertTransitionAllowed(
           command,
           task.estado,
           'taskctl approve',
-          'no ha pasado por taskctl approve (complejidad no trivial/simple exige aprobacion humana).'
+          'no ha pasado por taskctl approve. El checkpoint humano es obligatorio para todas las complejidades (seccion 14, punto 1).'
         );
       }
       return;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
new file mode 100644
index 0000000..3912a4f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts
@@ -0,0 +1,139 @@
+/**
+ * Lectura de las dos secciones del cuerpo de `tarea.md` que alguien
+ * mas que un humano necesita leer: el Objetivo y los criterios de
+ * aceptacion.
+ *
+ * Vive aparte de frontmatter.ts a proposito: aquel parsea el bloque
+ * `---` de metadatos y no mira el cuerpo; este solo mira el cuerpo y no
+ * sabe nada de metadatos. Su primer consumidor es la heuristica de
+ * complejidad (src/core/heuristica.ts), que necesita el texto de esas
+ * dos secciones para buscar palabras de alto riesgo y contar cuantos
+ * criterios declara la tarea.
+ *
+ * Tres decisiones que el formato real del repo obliga a tomar:
+ *
+ * 1. LA CABECERA DE CRITERIOS APARECE CON Y SIN TILDE. En las tareas
+ *    ya escritas conviven "## Criterios de aceptación" (las que
+ *    escribio una persona) y "## Criterios de aceptacion" (las que
+ *    genera `taskctl new`/`import`, que no ponen tildes). Las dos son
+ *    validas: el titulo se compara ya normalizado (sin diacriticos y
+ *    en minusculas), asi que tambien casa "## CRITERIOS DE ACEPTACIÓN".
+ *    Elegir solo una forma dejaria fuera la mitad del repo.
+ * 2. UNA SECCION TERMINA DONDE EMPIEZA LA SIGUIENTE CABECERA `##`.
+ *    Se reconocen cabeceras ATX de nivel 2 a 6; un `#` de nivel 1 NO
+ *    corta, porque una linea que empieza por "# " dentro de un bloque
+ *    de codigo (un comentario de shell, que este repo escribe a
+ *    menudo) truncaria el Objetivo por accidente.
+ * 3. SI LA MISMA CABECERA SALE DOS VECES, MANDA LA PRIMERA. Es lo
+ *    unico que se puede decidir sin inventar: concatenar dos secciones
+ *    "Objetivo" mezclaria textos que su autor escribio separados.
+ *
+ * Nunca lanza. Un cuerpo sin ninguna de las dos secciones devuelve
+ * objetivo vacio y cero criterios, que es exactamente lo que dice el
+ * fichero. Que eso sea un error o no lo decide quien llama: aqui no
+ * hay contexto para saberlo (una tarea recien creada con `taskctl new`
+ * tiene el Objetivo en blanco a proposito).
+ */
+
+export interface SeccionesTarea {
+  /** Texto bajo "## Objetivo", sin la cabecera, trim(). '' si no hay. */
+  objetivo: string;
+  /** Una entrada por linea de checklist bajo "## Criterios de aceptacion". */
+  criterios: string[];
+}
+
+/** Cabecera ATX de nivel 2 a 6 (ver decision 2 de la cabecera). */
+const RE_CABECERA = /^ {0,3}#{2,6}(?:\s|$)/;
+
+/** Linea de checklist: "- [ ] texto", "- [x] texto", "* [X] texto". */
+const RE_CRITERIO = /^\s*[-*]\s+\[[ xX]\]\s*(.*)$/;
+
+/** Continuacion indentada de la linea de checklist anterior. */
+const RE_CONTINUACION = /^\s+\S/;
+
+const TITULO_OBJETIVO = 'objetivo';
+const TITULO_CRITERIOS = 'criterios de aceptacion';
+
+/**
+ * Quita diacriticos y pasa a minusculas. Se descompone en NFD y se
+ * borran las marcas combinantes (U+0300..U+036F) en vez de mantener
+ * una tabla de reemplazos a mano: la tabla se queda corta el dia que
+ * aparece una letra que nadie previo.
+ *
+ * Se exporta porque la heuristica de complejidad compara sus palabras
+ * de alto riesgo contra este mismo texto: si cada modulo normalizara a
+ * su manera, "migracion" casaria en un sitio y no en el otro.
+ */
+export function normalizarTexto(texto: string): string {
+  return texto
+    .normalize('NFD')
+    .replace(/[\u0300-\u036f]/g, '')
+    .toLowerCase();
+}
+
+/** El titulo de una cabecera ATX, sin almohadillas ni diacriticos. */
+function tituloDeCabecera(linea: string): string {
+  return normalizarTexto(
+    linea
+      .trim()
+      .replace(/^#+\s*/, '')
+      .replace(/\s*#+$/, '')
+  ).trim();
+}
+
+/**
+ * Parte el cuerpo de una tarea en sus dos secciones interesantes.
+ *
+ * Sobre los criterios: se devuelve UNA entrada por linea de checklist,
+ * incluidas las vacias ("- [ ] " a secas, que es lo que deja
+ * `taskctl new` en una tarea recien creada). Una linea INDENTADA que
+ * no sea a su vez un checklist se pega al criterio anterior: en las
+ * tareas reales del repo los criterios largos se parten en varias
+ * lineas alineadas bajo el texto, y perderlas dejaria fuera parte del
+ * enunciado. Lo que no se pega es un parrafo sin indentar: eso ya es
+ * prosa suelta detras de la lista, no la continuacion de nada.
+ */
+export function extraerSecciones(body: string): SeccionesTarea {
+  const lineas = body.split(/\r?\n/);
+  const objetivo: string[] = [];
+  const criterios: string[] = [];
+
+  let seccion: 'objetivo' | 'criterios' | 'otra' = 'otra';
+  let objetivoVisto = false;
+  let criteriosVisto = false;
+
+  for (const linea of lineas) {
+    if (RE_CABECERA.test(linea)) {
+      const titulo = tituloDeCabecera(linea);
+      if (titulo === TITULO_OBJETIVO && !objetivoVisto) {
+        seccion = 'objetivo';
+        objetivoVisto = true;
+      } else if (titulo === TITULO_CRITERIOS && !criteriosVisto) {
+        seccion = 'criterios';
+        criteriosVisto = true;
+      } else {
+        seccion = 'otra';
+      }
+      continue;
+    }
+
+    if (seccion === 'objetivo') {
+      objetivo.push(linea);
+      continue;
+    }
+
+    if (seccion === 'criterios') {
+      const criterio = RE_CRITERIO.exec(linea);
+      if (criterio !== null) {
+        criterios.push((criterio[1] ?? '').trim());
+        continue;
+      }
+      if (criterios.length > 0 && RE_CONTINUACION.test(linea)) {
+        const ultimo = criterios[criterios.length - 1] ?? '';
+        criterios[criterios.length - 1] = `${ultimo} ${linea.trim()}`.trim();
+      }
+    }
+  }
+
+  return { objetivo: objetivo.join('\n').trim(), criterios };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
new file mode 100644
index 0000000..8d2edb1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -0,0 +1,49 @@
+/**
+ * Numeracion de rondas de los artefactos de una tarea.
+ *
+ * Un bucle de "pide cambios" es normal, no una excepcion: una tarea
+ * puede necesitar dos o tres rondas de revision, y desde TASK-016
+ * tambien varias de planificacion. En los dos casos el numero de ronda
+ * no se guarda en ninguna parte: se DEDUCE de los ficheros que ya hay
+ * en la carpeta. Es a proposito — un contador en el frontmatter seria
+ * un segundo sitio donde vive la misma verdad, y el dia que discrepara
+ * del disco ganaria el fichero equivocado.
+ *
+ * La logica vivia privada en commands/review.ts desde TASK-013.
+ * TASK-016 la necesita igual para `planificacion/brainstorm/`, y
+ * copiarla habria dejado dos numeradores que divergen en cuanto
+ * alguien toque uno.
+ */
+import { readdir } from 'node:fs/promises';
+import { isEnoent } from './task-store.js';
+
+/**
+ * Primera ronda libre: 1 + el mayor N que aparezca en el primer grupo
+ * de captura de `patron` entre los ficheros del directorio.
+ *
+ * Un directorio que no existe es ronda 1, no un error: la carpeta se
+ * crea al escribir la primera ronda, y preguntar antes de crearla es
+ * el caso normal, no el raro.
+ */
+export async function siguienteRonda(dir: string, patron: RegExp): Promise<number> {
+  let entries: string[];
+  try {
+    entries = await readdir(dir);
+  } catch (e: unknown) {
+    if (isEnoent(e)) return 1;
+    throw e;
+  }
+  let max = 0;
+  for (const entry of entries) {
+    const m = patron.exec(entry);
+    // Se recorren TODAS las entradas y se busca el maximo, en vez de
+    // contar cuantas hay: un fichero borrado a mano no debe hacer que
+    // la siguiente ronda reutilice un numero ya usado y pise el
+    // historial de la anterior.
+    if (m !== null) {
+      const capturado = m[1];
+      if (capturado !== undefined) max = Math.max(max, Number(capturado));
+    }
+  }
+  return max + 1;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index b8243d0..36cc5c0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -124,12 +124,32 @@ test('main: la ayuda documenta --asignado-a en plan y en start', async () => {
   assert.ok(stdout.includes('taskctl start TASK-NNN [--asignado-a <persona>]'));
 });
 
+/**
+ * Rellena el "## Objetivo" que "taskctl new" deja en blanco. Desde
+ * TASK-016 "plan" aborta sin el cuando la tarea lanza brainstorm, asi
+ * que esto es exactamente lo que hace una persona entre "new" y
+ * "plan": es parte del flujo real, no un apano del test.
+ */
+async function rellenarObjetivo(repoRoot: string, id: string): Promise<void> {
+  const md = path.join(repoRoot, 'tareas', '00-planificadas', id, 'tarea.md');
+  const contenido = await readFile(md, 'utf8');
+  await writeFile(
+    md,
+    contenido.replace(
+      '## Objetivo\n\n\n',
+      '## Objetivo\n\nProbar el ciclo con una tarea que dice a que viene.\n\n'
+    ),
+    'utf8'
+  );
+}
+
 test('main: taskctl plan --asignado-a confirma la asignacion y la deja en tarea.md', async () => {
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Probar asignacion', '--tipo', 'feature']));
     assert.equal(creada.code, 0);
     // plan exige workspace limpio, asi que se commitea lo que dejo
     // new (misma secuencia que en uso real).
+    await rellenarObjetivo(repoRoot, 'TASK-001');
     commitAll(repoRoot, 'tarea nueva');
 
     const { code, stdout } = await captureOutput(() =>
@@ -151,6 +171,7 @@ test('main: sin --asignado-a y sin identidad Git no se imprime linea de asignaci
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Sin asignar', '--tipo', 'feature']));
     assert.equal(creada.code, 0);
+    await rellenarObjetivo(repoRoot, 'TASK-001');
     commitAll(repoRoot, 'tarea nueva');
     // Se vacia la identidad DESPUES de commitear (TASK-024): sin
     // ella, plan deja la tarea sin asignar, como antes.
@@ -167,6 +188,7 @@ test('main: sin --asignado-a pero CON identidad Git, la tarea se autoasigna y se
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Con identidad', '--tipo', 'feature']));
     assert.equal(creada.code, 0);
+    await rellenarObjetivo(repoRoot, 'TASK-001');
     commitAll(repoRoot, 'tarea nueva');
 
     const { code, stdout } = await captureOutput(() => main(['plan', 'TASK-001']));
@@ -186,6 +208,7 @@ test('main: un --asignado-a sin valor sale con codigo 1 y mensaje util, no con u
   await withTempRepoCwd(async (repoRoot) => {
     const creada = await captureOutput(() => main(['new', '--titulo', 'Flag roto', '--tipo', 'feature']));
     assert.equal(creada.code, 0);
+    await rellenarObjetivo(repoRoot, 'TASK-001');
     commitAll(repoRoot, 'tarea nueva');
 
     const { code, stderr } = await captureOutput(() => main(['plan', 'TASK-001', '--asignado-a']));
@@ -207,10 +230,12 @@ test('main: taskctl start sale con codigo 1 y mensaje util cuando el limite esta
     // documentada en HALLAZGOS.md para taskctl import).
     const uno = await captureOutput(() => main(['new', '--titulo', 'Primera de carlos', '--tipo', 'feature', '--complejidad', 'simple']));
     assert.equal(uno.code, 0, uno.stderr);
+    await rellenarObjetivo(repoRoot, 'TASK-001');
     commitAll(repoRoot, 'primera tarea');
 
     const dos = await captureOutput(() => main(['new', '--titulo', 'Segunda de carlos', '--tipo', 'feature', '--complejidad', 'simple']));
     assert.equal(dos.code, 0, dos.stderr);
+    await rellenarObjetivo(repoRoot, 'TASK-002');
     commitAll(repoRoot, 'segunda tarea');
 
     const p1 = await captureOutput(() => main(['plan', 'TASK-001', '--asignado-a', 'carlos']));
@@ -223,6 +248,17 @@ test('main: taskctl start sale con codigo 1 y mensaje util cuando el limite esta
     assert.equal(p2.code, 0, p2.stderr);
     commitAll(repoRoot, 'segunda en diseno');
 
+    // Las dos pasan por el checkpoint humano: desde TASK-016 es
+    // obligatorio tambien para `simple`, y sin el las dos fallarian
+    // aqui — con lo que el test verde no probaria el limite de WIP,
+    // que es lo unico que viene a medir.
+    const a1 = await captureOutput(() => main(['approve', 'TASK-001']));
+    assert.equal(a1.code, 0, a1.stderr);
+    commitAll(repoRoot, 'primera aprobada');
+    const a2 = await captureOutput(() => main(['approve', 'TASK-002']));
+    assert.equal(a2.code, 0, a2.stderr);
+    commitAll(repoRoot, 'segunda aprobada');
+
     const primera = await captureOutput(() => main(['start', 'TASK-001']));
     assert.equal(primera.code, 0, primera.stderr);
     commitAll(repoRoot, 'primera en curso');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
index 199cc8e..093377a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
@@ -138,9 +138,20 @@ test('taskctl plan: commitea el movimiento a 01-en-diseno y el scaffold del plan
 
     assert.equal(r.autoCommit.commiteado, true);
     assert.equal(git(['log', '--format=%s', '-1'], repoRoot).trim(), 'chore(TASK-910): tarea en diseno');
-    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
-    assert.match(stat, /01-en-diseno/);
-    assert.match(stat, /plan-final\.md/);
+    // --name-only y no --stat: desde TASK-016 el commit incluye las
+    // peticiones de brainstorm, cuyas rutas son largas, y --stat las
+    // ABREVIA con puntos suspensivos (".../peticion-...md"). Aseverar
+    // sobre una salida truncada da un rojo que no habla del
+    // comportamiento sino del ancho de la columna.
+    const registrados = git(['show', '--name-only', '--format=', 'HEAD'], repoRoot);
+    assert.match(registrados, /01-en-diseno/);
+    assert.match(registrados, /plan-final\.md/);
+    // El brainstorm entra en el MISMO commit que el movimiento: si se
+    // quedara fuera, la tarea viajaria de carpeta sin sus peticiones y
+    // el arbol quedaria sucio (que es lo que comprueba la linea de
+    // abajo, pero esta lo dice explicitamente).
+    assert.match(registrados, /peticion-brainstorm-arquitectura-1\.md/);
+    assert.match(registrados, /peticion-unificador-1\.md/);
     // Ni rastro de la carpeta vieja: el movimiento entro entero.
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
   });
@@ -368,7 +379,9 @@ test('taskctl plan --push: con un origin bare real la rama llega; el flag va del
 
 test('taskctl plan --push sin remoto: avisa, no lanza y sale con la tarea commiteada en local', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    // Con el cuerpo vacio "plan" aborta desde TASK-016 (puerta del
+    // objetivo), y este test mide el --push, no esa puerta.
+    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar el push.\n');
     commitAll(repoRoot, 'chore(TASK-910): tarea creada');
 
     const r = await runPlanCommand(tareasRoot, ['TASK-910', '--push'], '2026-09-07', {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
new file mode 100644
index 0000000..8d84f92
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan-brainstorm.test.ts
@@ -0,0 +1,603 @@
+/**
+ * Tests del brainstorm paralelo que escribe `taskctl plan` (TASK-016,
+ * item D1). Cubren el camino DETERMINISTA entero — cuantos roles,
+ * cuales, con que contexto y en que ficheros — sin llamar a ningun
+ * agente, que es lo que pide el criterio de aceptacion 5.
+ *
+ * Contra repo Git temporal real, como el resto de tests de comandos:
+ * `plan` aplica el guard de la seccion 8.3 y necesita un repo de
+ * verdad.
+ *
+ * CADA test lleva encima la mutacion del codigo fuente que lo pone
+ * rojo. Es la contramedida a lo que le paso a TASK-032, donde se
+ * colaron siete aserciones que no podian fallar: si de un test no se
+ * sabe decir que mutacion lo tumba, ese test no vale y no entra.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, mkdir, rm, readFile, readdir, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import {
+  runPlanCommand,
+  PlanCommandError,
+  PLANIFICACION_DIRNAME,
+  BRAINSTORM_DIRNAME,
+} from '../../src/commands/plan.js';
+import { ROLES_BRAINSTORM } from '../../src/core/roles-brainstorm.js';
+import type { Task, TaskComplexity } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/commands -> dist/test -> dist -> raiz del paquete
+const PACKAGE_ROOT = path.join(HERE, '..', '..', '..');
+
+function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-800',
+    titulo: 'Tarea de prueba del brainstorm',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'alta',
+    modelo_sugerido: 'opus',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-800-prueba',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-08',
+    actualizado: '2026-09-08',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+/**
+ * Objetivo con sustancia y SIN ninguna palabra de alto riesgo: asi la
+ * puntuacion heuristica no sube por el texto y el numero de roles lo
+ * decide la complejidad declarada, que es lo que cada test fija. Un
+ * objetivo con "migracion" dentro haria que estos tests midieran otra
+ * cosa sin avisar.
+ */
+const BODY = '## Objetivo\n\nProbar que el brainstorm se escribe entero.\n';
+
+function git(args: string[], cwd: string): void {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+}
+
+function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+async function withTempRepo(
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-brainstorm-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    commitAll(repoRoot, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+/**
+ * Lleva a `main` lo que hay en `develop`. Hace falta solo para las
+ * tareas de tipo `hotfix`: su rama base es `main`, asi que el guard de
+ * la seccion 8.3 cambia ahi antes de leer la tarea, y en un repo
+ * temporal recien montado `main` no la tiene todavia. Sin esto el
+ * comando falla con "no existe todavia" y el test mediria eso en vez
+ * del tope de hotfix.
+ */
+function propagarAMain(repoRoot: string): void {
+  git(['checkout', '-q', 'main'], repoRoot);
+  git(['merge', '-q', '--ff-only', 'develop'], repoRoot);
+  git(['checkout', '-q', 'develop'], repoRoot);
+}
+
+function brainstormDir(filePath: string): string {
+  return path.join(path.dirname(filePath), PLANIFICACION_DIRNAME, BRAINSTORM_DIRNAME);
+}
+
+// ─── que ficheros se escriben, y cuantos ───────────────────────────────
+
+/**
+ * Mutacion que lo pone rojo: cambiar el `roles.length` del bucle de
+ * escritura, escribir la peticion del unificador solo cuando hay roles,
+ * o dejar de escribir el scaffold de salida de cada rol.
+ *
+ * El assert es `deepEqual` de la lista ORDENADA del directorio, no un
+ * `length >= N`: con un `>=` un octavo fichero se colaria sin que nadie
+ * se enterase.
+ */
+const REPARTO: ReadonlyArray<{ complejidad: TaskComplexity; roles: number }> = [
+  { complejidad: 'trivial', roles: 0 },
+  { complejidad: 'simple', roles: 1 },
+  { complejidad: 'media', roles: 2 },
+  { complejidad: 'alta', roles: 3 },
+  { complejidad: 'critica', roles: 4 },
+];
+
+for (const { complejidad, roles } of REPARTO) {
+  test(`plan: complejidad "${complejidad}" escribe exactamente ${roles} peticion(es) de rol y una del unificador`, async () => {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(tareasRoot, sampleTask({ complejidad }), BODY);
+      commitAll(repoRoot, 'tarea TASK-800');
+
+      const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+        repoCwd: repoRoot,
+      });
+
+      assert.equal(result.roles.length, roles);
+      assert.equal(result.ronda, 1);
+      assert.equal(result.brainstormReutilizado, false);
+
+      const esperados = ROLES_BRAINSTORM.slice(0, roles)
+        .flatMap((r) => [`peticion-${r.id}-1.md`, `salida-${r.id}-1.md`])
+        .concat(['peticion-unificador-1.md'])
+        .sort();
+      const enDisco = (await readdir(brainstormDir(result.filePath))).sort();
+      assert.deepEqual(enDisco, esperados);
+    });
+  });
+}
+
+/**
+ * EL EFECTO REAL DEL `max`, medido en el smoke test y fijado aqui para
+ * que no se olvide: una tarea declarada `trivial` NO se queda en 0
+ * roles en cuanto su enunciado tiene una dependencia o cinco criterios,
+ * porque la heuristica la sube a `simple` y el max manda.
+ *
+ * El test de arriba ("trivial escribe 0 peticiones") pasa porque su
+ * fixture no declara ni dependencias ni criterios — o sea, por una
+ * condicion que casi ninguna tarea real cumple. Sin este segundo test
+ * el reparto parecia respetar el "0 en trivial" del YML, y medido
+ * sobre las 32 tareas del repo NINGUNA acaba con 0 roles.
+ *
+ * Mutacion que lo pone rojo: sustituir el max por el nivel declarado a
+ * secas (volveria a dar 0), que es justo la alternativa que se
+ * descarto.
+ */
+test('plan: una tarea "trivial" con dependencias sube a 1 rol por el max (efecto medido del maximo)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      // Dos dependencias = 2 puntos, que es justo lo que saca a la
+      // tarea de `trivial` (nivel_trivial_hasta: 1). Es la puntuacion
+      // real de TASK-005, la unica tarea declarada trivial del repo.
+      sampleTask({ complejidad: 'trivial', dependencias: ['TASK-798', 'TASK-799'] }),
+      BODY
+    );
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.resolucion.nivelDeclarado, 'trivial');
+    assert.equal(result.resolucion.nivelHeuristico, 'simple');
+    assert.equal(result.roles.length, 1);
+  });
+});
+
+/**
+ * Mutacion que lo pone rojo: aplicar el tope de hotfix como
+ * sustitucion en vez de como Math.min — un hotfix trivial pasaria de 0
+ * a 1 rol, que es justo lo que el YML prohibe.
+ */
+test('plan: un hotfix trivial se queda en 0 roles (el tope es un MIN, no una sustitucion)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ tipo: 'hotfix', complejidad: 'trivial', rama: 'hotfix/task-800-prueba' }),
+      BODY
+    );
+    commitAll(repoRoot, 'tarea TASK-800');
+    propagarAMain(repoRoot);
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.roles.length, 0);
+    assert.deepEqual(await readdir(brainstormDir(result.filePath)), ['peticion-unificador-1.md']);
+  });
+});
+
+/**
+ * Mutacion que lo pone rojo: quitar el tope de hotfix. Una critica de
+ * tipo hotfix pasaria de 1 rol a 4.
+ */
+test('plan: un hotfix critico se topa en 1 rol, no en 4', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ tipo: 'hotfix', complejidad: 'critica', rama: 'hotfix/task-800-prueba' }),
+      BODY
+    );
+    commitAll(repoRoot, 'tarea TASK-800');
+    propagarAMain(repoRoot);
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.roles.length, 1);
+    assert.equal(result.resolucion.topeHotfixAplicado, true);
+  });
+});
+
+// ─── el acotado de contexto por rol (seccion 16.2) ─────────────────────
+
+/**
+ * ESTE es el test que sostiene el criterio de aceptacion 1, y el que
+ * mas facil se vuelve vacio. La aserción que muerde es la NEGATIVA: que
+ * la peticion de un rol no contenga el contexto de los otros. La
+ * positiva sola no valdria — el nombre del rol lo pone la cabecera de
+ * la plantilla, asi que borrar el cuerpo entero la dejaria en verde.
+ *
+ * Y no se compara contra un literal copiado aqui, sino contra el
+ * contenido real de ROLES_BRAINSTORM: si alguien reescribe un recorte,
+ * el test lo sigue.
+ *
+ * Mutacion que lo pone rojo: pasar `ROLES_BRAINSTORM` entero a cada
+ * peticion en vez del rol que toca, o concatenar los `mira` de todos.
+ */
+test('plan: la peticion de cada rol lleva SU recorte de contexto y no el de los demas', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'critica' }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+    assert.equal(result.roles.length, 4, 'precondicion: los cuatro roles entran en critica');
+
+    const dir = brainstormDir(result.filePath);
+    for (const rol of ROLES_BRAINSTORM) {
+      const contenido = await readFile(path.join(dir, `peticion-${rol.id}-1.md`), 'utf8');
+
+      // Lo suyo esta.
+      assert.ok(contenido.includes(rol.pregunta), `${rol.id} no trae su pregunta`);
+      for (const m of rol.mira) {
+        assert.ok(contenido.includes(m), `${rol.id} no trae su "mira": ${m}`);
+      }
+
+      // Y lo ajeno NO esta.
+      for (const otro of ROLES_BRAINSTORM) {
+        if (otro.id === rol.id) continue;
+        assert.ok(
+          !contenido.includes(otro.pregunta),
+          `la peticion de ${rol.id} trae la pregunta de ${otro.id}`
+        );
+        for (const m of otro.mira) {
+          assert.ok(!contenido.includes(m), `la peticion de ${rol.id} trae el "mira" de ${otro.id}`);
+        }
+      }
+    }
+  });
+});
+
+/**
+ * Mutacion que lo pone rojo: quitar del enunciado el objetivo o los
+ * criterios. Sin el enunciado, un rol no tiene nada que diseñar.
+ */
+test('plan: cada peticion embebe el objetivo y los criterios de la tarea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ complejidad: 'simple' }),
+      '## Objetivo\n\nUn objetivo bien reconocible.\n\n' +
+        '## Criterios de aceptacion\n- [ ] Un criterio bien reconocible.\n'
+    );
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    const dir = brainstormDir(result.filePath);
+    for (const fichero of await readdir(dir)) {
+      if (!fichero.startsWith('peticion-')) continue;
+      const contenido = await readFile(path.join(dir, fichero), 'utf8');
+      assert.ok(contenido.includes('Un objetivo bien reconocible.'), fichero);
+      assert.ok(contenido.includes('Un criterio bien reconocible.'), fichero);
+    }
+  });
+});
+
+// ─── la peticion del unificador ────────────────────────────────────────
+
+/**
+ * Mutacion que lo pone rojo: que la peticion del unificador liste los
+ * cuatro roles siempre en vez de los que de verdad se lanzaron. Se
+ * comprueba contra el disco, no contra el valor devuelto.
+ */
+test('plan: el unificador recibe la lista de las salidas que EXISTEN, ni una mas', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    const dir = brainstormDir(result.filePath);
+    const salidasEnDisco = (await readdir(dir)).filter((f) => f.startsWith('salida-'));
+    assert.equal(salidasEnDisco.length, 2, 'precondicion: media lanza 2 roles');
+
+    const peticion = await readFile(path.join(dir, 'peticion-unificador-1.md'), 'utf8');
+    for (const salida of salidasEnDisco) {
+      assert.ok(peticion.includes(salida), `el unificador no nombra ${salida}`);
+    }
+    for (const rol of ROLES_BRAINSTORM.slice(2)) {
+      assert.ok(
+        !peticion.includes(`salida-${rol.id}-1.md`),
+        `el unificador nombra ${rol.id}, que no se lanzo`
+      );
+    }
+  });
+});
+
+/**
+ * Mutacion que lo pone rojo: borrar de la plantilla la prohibicion de
+ * promediar. Es la instruccion que separa un unificador de una
+ * calculadora de medias, y sin ella el criterio de aceptacion 2 no se
+ * cumple aunque los ficheros esten todos.
+ */
+test('plan: el unificador tiene prohibido promediar y obligado a senalar desacuerdos', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask(), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    const peticion = await readFile(result.peticionUnificador, 'utf8');
+    assert.match(peticion, /No promedies/);
+    assert.match(peticion, /discrepen/);
+    // Y el caso invertido, que es el que de verdad se olvida: la
+    // coincidencia total tiene que leerse como alarma, no como calidad.
+    assert.match(peticion, /Si no discrepan en nada, eso es la alarma/);
+  });
+});
+
+/**
+ * Mutacion que lo pone rojo: dejar de escribir el bloque de
+ * complejidad, o escribirlo solo cuando hay discrepancia (que era la
+ * alternativa descartada: un bloque que solo sale en el caso raro
+ * entrena a no buscarlo, y su ausencia se vuelve ambigua).
+ */
+test('plan: la peticion del unificador trae la complejidad declarada Y la heuristica, coincidan o no', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // "alta" declarada contra un objetivo sin senales: la heuristica
+    // saldra mas baja y habra discrepancia de verdad.
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'alta' }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.resolucion.nivelDeclarado, 'alta');
+    assert.equal(result.resolucion.hayDiscrepancia, true);
+    // El max manda: 3 roles por lo declarado, no 0-1 por la heuristica.
+    assert.equal(result.roles.length, 3);
+
+    const peticion = await readFile(result.peticionUnificador, 'utf8');
+    assert.match(peticion, /Declarada en la tarea: \*\*alta\*\*/);
+    assert.match(peticion, new RegExp(`Heuristica \\(${result.resolucion.puntos} puntos\\)`));
+    assert.match(peticion, /Los dos niveles NO coinciden/);
+  });
+});
+
+// ─── la puerta del objetivo vacio ──────────────────────────────────────
+
+/**
+ * Mutacion que lo pone rojo: quitar la puerta. Sin ella N agentes
+ * reciben una peticion sin sustancia y devuelven N invenciones que el
+ * unificador consolida en un plan con autoridad.
+ */
+test('plan: objetivo vacio con roles que lanzar aborta y NO mueve la tarea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'alta' }), '## Objetivo\n\n');
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    await assert.rejects(
+      () => runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', { repoCwd: repoRoot }),
+      (e: unknown) => {
+        assert.ok(e instanceof PlanCommandError);
+        assert.match(e.message, /Objetivo/);
+        // Convencion del proyecto: el error dice QUE HACER.
+        assert.match(e.message, /Escribe el objetivo en/);
+        return true;
+      }
+    );
+
+    // Ni movida, ni carpeta nueva, ni workspace ensuciado.
+    const read = await readTareaFile(tareasRoot, 'TASK-800');
+    assert.equal(read?.task.estado, 'planificada');
+    assert.equal(spawnSync('git', ['status', '--porcelain'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    }).stdout.trim(), '');
+  });
+});
+
+/**
+ * El simetrico, y no sobra: sin el, una puerta que abortara SIEMPRE
+ * dejaria el test de arriba en verde. Ademas fija que el
+ * comportamiento con 0 roles es identico al de antes de TASK-016, que
+ * es lo que hace el cambio no-breaking.
+ *
+ * Mutacion que lo pone rojo: aplicar la puerta tambien cuando no hay
+ * roles.
+ */
+test('plan: objetivo vacio SIN roles que lanzar no aborta (comportamiento de antes de TASK-016)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'trivial' }), '## Objetivo\n\n');
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.roles.length, 0);
+    const read = await readTareaFile(tareasRoot, 'TASK-800');
+    assert.equal(read?.task.estado, 'en-diseno');
+  });
+});
+
+// ─── re-planificacion incremental (seccion 16.3) ───────────────────────
+
+/**
+ * Mutacion que lo pone rojo: regenerar las peticiones de rol en la
+ * segunda vuelta. Un bucle de "pide cambios" es una correccion
+ * incremental, no un reinicio, y tratarlo como reinicio es donde mas se
+ * gasta sin que nadie lo note.
+ */
+test('plan: una segunda vuelta NO relanza el brainstorm, solo pide otro pase al unificador', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'media' }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const primera = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+    const dir = brainstormDir(primera.filePath);
+    const trasPrimera = (await readdir(dir)).sort();
+
+    // La persona pide cambios: el plan sigue sin aprobar y se
+    // re-planifica.
+    const segunda = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-09', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(segunda.ronda, 2);
+    assert.equal(segunda.brainstormReutilizado, true);
+    assert.deepEqual(segunda.peticionesRol, []);
+
+    const trasSegunda = (await readdir(dir)).sort();
+    const nuevos = trasSegunda.filter((f) => !trasPrimera.includes(f));
+    assert.deepEqual(nuevos, ['peticion-unificador-2.md']);
+
+    // Y lo de la ronda 1 sigue intacto, byte a byte: la ronda 2 no
+    // puede pisar el trabajo de los roles de la 1.
+    for (const fichero of trasPrimera) {
+      assert.ok(trasSegunda.includes(fichero), `desaparecio ${fichero}`);
+    }
+  });
+});
+
+/**
+ * Mutacion que lo pone rojo: numerar la ronda contando ficheros en vez
+ * de buscando el maximo. Con un fichero borrado a mano, contar
+ * reutilizaria un numero ya usado y pisaria la ronda anterior.
+ */
+test('plan: la ronda sale del mayor numero presente, no de cuantos ficheros hay', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'simple' }), BODY);
+    const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-800');
+    const dir = path.join(taskDir, PLANIFICACION_DIRNAME, BRAINSTORM_DIRNAME);
+    await mkdir(dir, { recursive: true });
+    // Solo queda el rastro de una ronda 4; las 1-3 se borraron.
+    await writeFile(path.join(dir, 'peticion-unificador-4.md'), '# ronda 4\n', 'utf8');
+    commitAll(repoRoot, 'tarea TASK-800 con historial parcial');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.ronda, 5);
+    const enDisco = await readdir(brainstormDir(result.filePath));
+    assert.ok(enDisco.includes('peticion-unificador-5.md'));
+    assert.ok(enDisco.includes('peticion-unificador-4.md'), 'se piso la ronda 4');
+  });
+});
+
+// ─── el brainstorm viaja con la tarea ──────────────────────────────────
+
+/**
+ * Mutacion que lo pone rojo: escribir el brainstorm en la carpeta de
+ * DESTINO (despues del move) o colgarlo de la raiz de la carpeta de
+ * tarea en vez de de planificacion/. En los dos casos dejaria de
+ * viajar con el rename o de entrar en el auto-commit.
+ */
+test('plan: brainstorm/ viaja con la tarea al cambiar de carpeta de estado', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'alta' }), BODY);
+    commitAll(repoRoot, 'tarea TASK-800');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-800'], '2026-09-08', {
+      repoCwd: repoRoot,
+    });
+
+    assert.match(result.filePath, /01-en-diseno/);
+    assert.equal((await readdir(brainstormDir(result.filePath))).length, 7);
+    // Nada quedo atras en 00-planificadas.
+    await assert.rejects(() => readdir(path.join(tareasRoot, '00-planificadas', 'TASK-800')));
+    // Las rutas devueltas apuntan a ficheros que existen de verdad.
+    for (const p of [...result.peticionesRol, result.peticionUnificador]) {
+      await readFile(p, 'utf8');
+    }
+  });
+});
+
+// ─── el CLI no llama a ningun modelo ───────────────────────────────────
+
+/**
+ * El criterio de aceptacion 5 exige que el camino determinista se
+ * pruebe sin llamadas reales a agentes. La forma fuerte de fijarlo no
+ * es "estos tests pasan sin red" (pasarian igual si la llamada
+ * estuviera en una rama no ejercitada), sino comprobar que en `src/` no
+ * existe ninguna.
+ *
+ * Mutacion que lo pone rojo: meter en cualquier modulo de src/ un
+ * `spawnSync('claude', ...)`, un `fetch(` o un `https.request`.
+ */
+test('src/ no contiene ninguna invocacion a un modelo ni ninguna llamada de red', async () => {
+  const prohibidos: ReadonlyArray<{ patron: RegExp; que: string }> = [
+    { patron: /\bfetch\s*\(/, que: 'una llamada fetch()' },
+    { patron: /https?\.request\s*\(/, que: 'una peticion HTTP' },
+    { patron: /['"`]claude['"`]/, que: 'una invocacion del binario claude' },
+    { patron: /anthropic|openai/i, que: 'una referencia a una API de modelos' },
+  ];
+
+  async function ficherosTs(dir: string): Promise<string[]> {
+    const salida: string[] = [];
+    for (const entrada of await readdir(dir, { withFileTypes: true })) {
+      const completo = path.join(dir, entrada.name);
+      if (entrada.isDirectory()) salida.push(...(await ficherosTs(completo)));
+      else if (entrada.name.endsWith('.ts')) salida.push(completo);
+    }
+    return salida;
+  }
+
+  const ficheros = await ficherosTs(path.join(PACKAGE_ROOT, 'src'));
+  assert.ok(ficheros.length > 10, `precondicion: se esperaban muchos .ts, hay ${ficheros.length}`);
+
+  for (const fichero of ficheros) {
+    const contenido = await readFile(fichero, 'utf8');
+    for (const { patron, que } of prohibidos) {
+      assert.ok(
+        !patron.test(contenido),
+        `${path.relative(PACKAGE_ROOT, fichero)} contiene ${que}: el CLI no puede llamar a ningun modelo`
+      );
+    }
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 0a39445..9371f81 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -45,6 +45,17 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
   };
 }
 
+/**
+ * Cuerpo minimo pero VALIDO de una tarea. Desde TASK-016 "plan" aborta
+ * si el "## Objetivo" esta vacio y la tarea lanza al menos un rol de
+ * brainstorm, asi que un fixture con el cuerpo en blanco ya no
+ * representa una tarea planificable: los tests que no prueban ESA
+ * puerta usan este cuerpo para que lo que falle sea lo que cada uno
+ * mide, y no la precondicion.
+ */
+const BODY_CON_OBJETIVO =
+  '## Objetivo\n\nProbar el comando con una tarea que si dice a que viene.\n';
+
 function git(args: string[], cwd: string): void {
   const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
   assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
@@ -95,7 +106,7 @@ async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promis
 
 test('taskctl plan: primera vez mueve la tarea a 01-en-diseno y crea el scaffold en planificacion/', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nAlgo.\n');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700');
 
     const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot });
@@ -135,7 +146,7 @@ test('taskctl plan: re-planificacion (en-diseno, plan_aprobado false) no pisa el
   await withTempRepo(async (repoRoot, tareasRoot) => {
     // Simula una primera vuelta ya hecha con el CLI actual: el plan
     // real (no el scaffold) ya vive en planificacion/.
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), BODY_CON_OBJETIVO);
     const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
     await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME), { recursive: true });
     await writeFile(
@@ -167,7 +178,7 @@ test('taskctl plan: migra a planificacion/ el plan-final.md legado suelto en la
   await withTempRepo(async (repoRoot, tareasRoot) => {
     // Tarea planificada con el CLI ANTERIOR a TASK-027: el plan real,
     // ya redactado, esta suelto en la raiz de la carpeta.
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), BODY_CON_OBJETIVO);
     const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
     await writeFile(path.join(taskDir, PLAN_FINAL_FILENAME), '# Plan legado redactado\n', 'utf8');
     commitAll(repoRoot, 'tarea TASK-700 con plan legado');
@@ -188,7 +199,7 @@ test('taskctl plan: migra a planificacion/ el plan-final.md legado suelto en la
 test('taskctl plan: con plan-final.md en la raiz Y en planificacion/ aborta sin tocar nada', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     // Estado ambiguo: dos planes distintos, ninguno obviamente el bueno.
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     const taskDirOrigen = path.join(tareasRoot, '00-planificadas', 'TASK-700');
     await writeFile(path.join(taskDirOrigen, PLAN_FINAL_FILENAME), '# Plan A (raiz)\n', 'utf8');
     await mkdir(path.join(taskDirOrigen, PLANIFICACION_DIRNAME), { recursive: true });
@@ -225,7 +236,7 @@ test('taskctl plan: si "planificacion" existe como FICHERO, el error dice que ha
     // Hallazgo MENOR de revision por pares (ronda 1): el EEXIST crudo
     // del mkdir salia como "taskctl no pudo arrancar", que ni es cierto
     // ni dice que hacer.
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-700');
     await writeFile(path.join(taskDir, PLANIFICACION_DIRNAME), 'no soy una carpeta\n', 'utf8');
     commitAll(repoRoot, 'tarea TASK-700 con planificacion ocupada');
@@ -253,7 +264,7 @@ test('taskctl plan: un DIRECTORIO llamado plan-final.md no cuenta como plan (no
     // Hallazgo MENOR de revision por pares (ronda 1): con un stat
     // pelado, "plan" renombraba el directorio y anunciaba "el plan se ha
     // movido intacto".
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-700');
     await mkdir(path.join(taskDir, PLAN_FINAL_FILENAME), { recursive: true });
     commitAll(repoRoot, 'tarea TASK-700 con plan-final.md como directorio');
@@ -279,7 +290,7 @@ test('taskctl plan: un DIRECTORIO en la ubicacion canonica falla diciendo que ha
     // diciendo "ya existia -- se dejo intacto" SIN plan ninguno,
     // mientras "approve" contestaba "todavia no tiene un plan-final.md
     // que aprobar. Ejecuta taskctl plan primero". Bucle sin salida.
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-700');
     await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME), { recursive: true });
     commitAll(repoRoot, 'tarea TASK-700 con planificacion/plan-final.md como directorio');
@@ -309,7 +320,7 @@ test('taskctl plan: planificacion/ viaja con la tarea al cambiar de carpeta de e
     // Una tarea "planificada" con artefactos previos en planificacion/
     // (p. ej. notas de una vuelta anterior): el cambio de estado tiene
     // que llevarse la subcarpeta entera, no solo tarea.md.
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     const origen = path.join(tareasRoot, '00-planificadas', 'TASK-700', PLANIFICACION_DIRNAME);
     await mkdir(origen, { recursive: true });
     await writeFile(path.join(origen, 'notas.md'), '# Notas previas\n', 'utf8');
@@ -328,7 +339,7 @@ test('taskctl plan: planificacion/ viaja con la tarea al cambiar de carpeta de e
 
 test('taskctl plan: rechaza si ya esta en en-diseno con plan_aprobado true, sin tocar nada', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno', plan_aprobado: true }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno', plan_aprobado: true }), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 aprobada');
 
     await assert.rejects(
@@ -348,7 +359,7 @@ test('taskctl plan: rechaza si ya esta en en-diseno con plan_aprobado true, sin
 
 test('taskctl plan: rechaza un estado que no admite plan (p. ej. en-curso)', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 en curso');
     await assert.rejects(
       () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
@@ -370,7 +381,7 @@ test('taskctl plan: rechaza si el ID no existe, sin efectos secundarios', async
 
 test('taskctl plan: propaga cualquier error de escritura que NO sea EEXIST (no lo confunde con una re-planificacion)', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 en diseno');
     const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
     // planificacion/ existe pero sin permiso de escritura: writeFile de
@@ -410,7 +421,7 @@ test('taskctl plan: error claro si falta el ID', async () => {
 
 test('taskctl plan: workspace sucio en develop aborta sin mover ni escribir nada', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700');
     await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear', 'utf8');
 
@@ -429,7 +440,7 @@ test('taskctl plan: workspace sucio en develop aborta sin mover ni escribir nada
 
 test('taskctl plan: en una rama de feature, limpia, cambia sola a develop antes de mover la tarea', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700');
     git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);
 
@@ -445,7 +456,7 @@ test('taskctl plan: en una rama de feature, limpia, cambia sola a develop antes
 
 test('taskctl plan: el estado invalido se sigue rechazando ANTES de tocar la rama activa', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 en curso');
     git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);
 
@@ -466,7 +477,7 @@ test('taskctl plan: la tarea existe en la rama vieja pero NO en la rama base rea
     // escenario que expone el hallazgo — una lectura preliminar en la
     // rama equivocada no debe decidir nada).
     git(['checkout', '-q', '-b', 'feature/donde-no-deberia-estar'], repoRoot);
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 solo en esta rama de feature');
 
     await assert.rejects(
@@ -486,7 +497,7 @@ test('taskctl plan: la tarea existe en la rama vieja pero NO en la rama base rea
 test('taskctl plan: la rama base real tiene la tarea en un estado distinto al de la lectura preliminar — decide con el estado real, no con el viejo (hallazgo CRITICO de revision por pares, TASK-012)', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     // Primero, la tarea nace "planificada" (como dejaria taskctl new).
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 planificada');
 
     // Una rama de feature se bifurca AQUI — ve la tarea "planificada",
@@ -502,7 +513,7 @@ test('taskctl plan: la rama base real tiene la tarea en un estado distinto al de
     // test, no lo que se esta probando).
     git(['checkout', '-q', 'develop'], repoRoot);
     await rm(path.join(tareasRoot, '00-planificadas', 'TASK-700'), { recursive: true, force: true });
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), BODY_CON_OBJETIVO);
     await writeFile(
       path.join(tareasRoot, '01-en-diseno', 'TASK-700', PLAN_FINAL_FILENAME),
       '# Plan real en develop\n',
@@ -535,9 +546,7 @@ test('taskctl plan: la rama base real tiene la tarea en un estado distinto al de
 
 test('taskctl plan --asignado-a: escribe asignado_a en el frontmatter de verdad', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\
-Algo.\
-');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700');
 
     const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a', 'carlos'], '2026-09-05', {
@@ -557,7 +566,7 @@ Algo.\
 
 test('taskctl plan: sin --asignado-a NO borra el asignado_a que ya tuviera la tarea', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 ya asignada');
 
     const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-05', { repoCwd: repoRoot });
@@ -571,7 +580,7 @@ test('taskctl plan: sin --asignado-a NO borra el asignado_a que ya tuviera la ta
 
 test('taskctl plan --asignado-a: reasignar a la MISMA persona no cuenta como cambio', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 asignada a carlos');
 
     const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a=carlos'], '2026-09-05', {
@@ -587,7 +596,7 @@ test('taskctl plan --asignado-a: reasignar a la MISMA persona no cuenta como cam
 
 test('taskctl plan --asignado-a: en una re-planificacion reasigna a otra persona', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno', asignado_a: 'ana' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno', asignado_a: 'ana' }), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700 en diseno, de ana');
 
     const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a', 'carlos'], '2026-09-05', {
@@ -603,7 +612,7 @@ test('taskctl plan --asignado-a: en una re-planificacion reasigna a otra persona
 
 test('taskctl plan: el ID se lee de los posicionales, asi que --asignado-a puede ir delante', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700');
 
     const result = await runPlanCommand(tareasRoot, ['--asignado-a', 'carlos', 'TASK-700'], '2026-09-05', {
@@ -617,7 +626,7 @@ test('taskctl plan: el ID se lee de los posicionales, asi que --asignado-a puede
 
 test('taskctl plan --asignado-a invalido: falla ANTES de mover la tarea ni cambiar de rama', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
-    await writeTareaFile(tareasRoot, sampleTask(), '');
+    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'tarea TASK-700');
     // Se arranca desde una rama que NO es la base, para que
     // ensureBaseBranchReady tenga algo que hacer si se llegara a
@@ -651,7 +660,7 @@ test('taskctl plan: NO comprueba el limite de WIP, aunque la persona tenga una t
       sampleTask({ id: 'TASK-701', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-701-ya-abierta' }),
       ''
     );
-    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-700' }), '');
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-700' }), BODY_CON_OBJETIVO);
     commitAll(repoRoot, 'carlos con una tarea ya en curso');
 
     const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a', 'carlos'], '2026-09-05', {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
index 31b06a5..e375fff 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
@@ -35,7 +35,13 @@ function sampleTask(overrides: Partial<Task> = {}): Task {
     complejidad: 'simple',
     modelo_sugerido: 'sonnet',
     estado: 'en-diseno',
-    plan_aprobado: false,
+    // true desde TASK-016. Hasta entonces era false y la tarea
+    // arrancaba igual, porque `simple` estaba eximida del checkpoint
+    // humano; ahora el checkpoint es obligatorio para las cinco
+    // complejidades (seccion 14, punto 1) y una tarea sin aprobar ya no
+    // representa el caso normal de "start", sino el que se rechaza.
+    // Ese rechazo lo cubren dos tests propios mas abajo.
+    plan_aprobado: true,
     rama: 'feature/task-500-prueba-de-integracion',
     asignado_a: null,
     agente_revisor: 'general-purpose',
@@ -262,7 +268,7 @@ test('taskctl start: rechaza una tarea en "planificada" (no ha pasado por plan)
   });
 });
 
-test('taskctl start: rechaza una tarea de complejidad no trivial/simple sin plan_aprobado', async () => {
+test('taskctl start: rechaza una tarea de complejidad media sin plan_aprobado', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await writeTareaFile(
       tareasRoot,
@@ -277,6 +283,62 @@ test('taskctl start: rechaza una tarea de complejidad no trivial/simple sin plan
   });
 });
 
+// --- checkpoint humano obligatorio para TODAS las complejidades ------
+// Decision #1 de la seccion 14, implementada en TASK-016. Antes
+// `trivial` y `simple` estaban eximidas y arrancaban sin pasar por
+// "approve"; estos dos tests fijan la inversion de esa expectativa. El
+// par importa: sin el segundo, romper "start" entero (que rechazara
+// SIEMPRE) daria el mismo verde que implementar la regla bien.
+
+for (const complejidad of ['trivial', 'simple'] as const) {
+  test(`taskctl start: ${complejidad} SIN plan_aprobado se rechaza (el checkpoint ya no exime a nadie)`, async () => {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(tareasRoot, sampleTask({ complejidad, plan_aprobado: false }), '');
+      commitAll(repoRoot, 'tarea(TASK-500): sin aprobar');
+
+      await assert.rejects(
+        () =>
+          runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
+            repoCwd: repoRoot,
+            scriptsDir: SCRIPTS_DIR,
+          }),
+        (e: unknown) => {
+          assert.ok(e instanceof StateMachineError);
+          assert.match(e.message, /taskctl approve/);
+          return true;
+        }
+      );
+
+      // No se movio ni se creo la rama: el rechazo es antes de tocar Git.
+      const read = await readTareaFile(tareasRoot, 'TASK-500');
+      assert.equal(read?.task.estado, 'en-diseno');
+      assert.equal(
+        spawnSync('git', ['branch', '--show-current'], {
+          cwd: repoRoot,
+          encoding: 'utf8',
+        }).stdout.trim(),
+        'develop'
+      );
+    });
+  });
+
+  test(`taskctl start: ${complejidad} CON plan_aprobado arranca con normalidad`, async () => {
+    await withTempRepo(async (repoRoot, tareasRoot) => {
+      await writeTareaFile(tareasRoot, sampleTask({ complejidad, plan_aprobado: true }), '');
+      commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
+
+      const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
+        repoCwd: repoRoot,
+        scriptsDir: SCRIPTS_DIR,
+      });
+
+      assert.equal(result.rama, 'feature/task-500-prueba-de-integracion');
+      const read = await readTareaFile(tareasRoot, 'TASK-500');
+      assert.equal(read?.task.estado, 'en-curso');
+    });
+  });
+}
+
 test('taskctl start: rechaza si el workspace tiene cambios sin commitear, sin invocar el script', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await writeTareaFile(tareasRoot, sampleTask(), '');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
new file mode 100644
index 0000000..09040cf
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/heuristica.test.ts
@@ -0,0 +1,741 @@
+/**
+ * Tests de `src/core/heuristica.ts` y `src/core/tarea-body.ts`
+ * (TASK-016).
+ *
+ * Contra el YML REAL del repo, nunca contra una copia inventada: la
+ * pregunta que importa no es "el codigo sabe leer un fichero de pesos"
+ * sino "el fichero que se distribuye produce estos numeros". Los casos
+ * de error si construyen contenido, pero SIEMPRE mutando el fichero
+ * real (quitar una linea, cambiar un valor, anadir una), nunca
+ * escribiendo un YAML paralelo: asi la base de cada caso negativo es,
+ * por construccion, un fichero que parsea.
+ *
+ * DOS TRAMPAS QUE ESTOS TESTS EVITAN A PROPOSITO (leccion de TASK-032,
+ * donde se colaron siete aserciones que no podian fallar):
+ *
+ * 1. NO SE REIMPLEMENTA LA TABLA DEL YML CON VALORES A MANO. Los
+ *    numeros salen de la `Heuristica` ya cargada, y lo que se asevera
+ *    es la RELACION entre ellos (la serie 0-1-2-3-4 sube de uno en
+ *    uno, el hotfix es un MIN, los extremos). Copiar la tabla aqui
+ *    probaria el test contra si mismo.
+ * 2. NINGUN TEST SE CONFORMA CON "NO LANZA". Cada uno asevera un valor
+ *    concreto, y donde una asercion solo tendria sentido si el fichero
+ *    cumple una precondicion (que el tope de hotfix sea > 0, que la
+ *    tabla de critica lo supere), esa precondicion se asevera ANTES,
+ *    para que el caso no se vuelva vacio en silencio el dia que
+ *    alguien toque el YML.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import {
+  CLAVES_HEURISTICA,
+  FICHERO_HEURISTICA,
+  HeuristicaError,
+  SENAL_CRITERIOS,
+  SENAL_DEPENDENCIA,
+  SENAL_ETIQUETAS,
+  SENAL_HOTFIX_RIESGO,
+  SENAL_PALABRA,
+  SENAL_RELEASE,
+  agentesBrainstorm,
+  cargarHeuristica,
+  nivelHeuristico,
+  parsearHeuristica,
+  puntuarTarea,
+  resolverNumeroAgentes,
+  resolverRutaHeuristica,
+} from '../../src/core/heuristica.js';
+import type { Heuristica } from '../../src/core/heuristica.js';
+import { extraerSecciones } from '../../src/core/tarea-body.js';
+import { TASK_COMPLEXITIES, TASK_TYPES } from '../../src/core/task.js';
+import type { Task, TaskComplexity } from '../../src/core/task.js';
+
+/**
+ * dist/test/core/ -> raiz del paquete. Se resuelve desde el modulo, no
+ * desde process.cwd(), para que los tests pasen igual lanzados desde
+ * la raiz del repo que desde dentro del plugin.
+ */
+const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+const RUTA_YML = path.join(RAIZ_PAQUETE, 'scripts', FICHERO_HEURISTICA);
+const BASE = readFileSync(RUTA_YML, 'utf8');
+
+/** La heuristica real del repo. Todo lo demas se mide contra esta. */
+const H: Heuristica = parsearHeuristica(BASE, RUTA_YML);
+
+// --------------------------------------------------------------------
+// Utilidades de construccion
+// --------------------------------------------------------------------
+
+function tarea(campos: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-999',
+    titulo: 'tarea de prueba',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'media',
+    modelo_sugerido: 'sonnet',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-999-prueba',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-08',
+    actualizado: '2026-09-08',
+    dependencias: [],
+    ...campos,
+  };
+}
+
+/** Cuerpo de tarea con las dos secciones, en el formato del repo. */
+function cuerpo(objetivo: string, criterios: readonly string[] = []): string {
+  const lista = criterios.map((c) => `- [ ] ${c}`).join('\n');
+  return `## Objetivo\n\n${objetivo}\n\n## Criterios de aceptacion\n${lista}\n`;
+}
+
+/** Cuerpo sin ninguna senal: es el cero contra el que se aisla cada peso. */
+const CUERPO_NEUTRO = cuerpo('Renombrar una variable local.');
+
+/** N criterios que no disparan ninguna otra senal. */
+function criteriosNeutros(n: number): string[] {
+  return Array.from({ length: n }, (_, i) => `Punto numero ${i + 1}.`);
+}
+
+function sinLineaDe(clave: string): string {
+  return BASE.split(/\r?\n/)
+    .filter((l) => !l.startsWith(`${clave}:`))
+    .join('\n');
+}
+
+function conValor(clave: string, valor: string): string {
+  return BASE.split(/\r?\n/)
+    .map((l) => (l.startsWith(`${clave}:`) ? `${clave}: ${valor}` : l))
+    .join('\n');
+}
+
+function conLineaExtra(linea: string): string {
+  return `${BASE}\n${linea}\n`;
+}
+
+/**
+ * Predicado para assert.throws: exige HeuristicaError, que el mensaje
+ * diga QUE esta mal, y que ademas diga QUE HACER — la convencion del
+ * proyecto es que los errores se dirigen a la persona, y eso se
+ * materializa en una segunda linea indentada con la instruccion. Sin
+ * esa ultima asercion, un mensaje que solo describa el sintoma pasaria.
+ */
+function errorAccionable(re: RegExp): (e: unknown) => boolean {
+  return (e: unknown) => {
+    assert.ok(e instanceof HeuristicaError, `esperaba HeuristicaError y llego: ${String(e)}`);
+    assert.match(e.message, re);
+    assert.match(
+      e.message,
+      /\n {8}\S/,
+      `el mensaje describe el problema pero no dice que hacer:\n${e.message}`
+    );
+    return true;
+  };
+}
+
+// --------------------------------------------------------------------
+// 1. extraerSecciones — el formato real de las tareas del repo
+//
+// Mutacion que pone rojo este grupo: tocar RE_CABECERA, RE_CRITERIO,
+// la normalizacion del titulo o el corte de seccion en tarea-body.ts.
+// --------------------------------------------------------------------
+
+test('extraerSecciones lee el objetivo y los criterios con la cabecera SIN tilde', () => {
+  const body = [
+    '## Objetivo',
+    '',
+    'Primera linea.',
+    'Segunda linea.',
+    '',
+    '## Criterios de aceptacion',
+    '- [ ] Sin marcar.',
+    '- [x] Marcado.',
+    '',
+  ].join('\n');
+
+  const { objetivo, criterios } = extraerSecciones(body);
+  assert.equal(objetivo, 'Primera linea.\nSegunda linea.');
+  assert.deepEqual(criterios, ['Sin marcar.', 'Marcado.']);
+});
+
+test('extraerSecciones acepta tambien la cabecera CON tilde', () => {
+  // Las dos formas conviven en el repo: las tareas escritas a mano
+  // llevan tilde, las que genera `taskctl new` no. Si solo se aceptara
+  // una, la mitad de las tareas puntuaria con cero criterios.
+  const conTilde = extraerSecciones(
+    '## Objetivo\n\nTexto.\n\n## Criterios de aceptación\n- [ ] Uno.\n- [ ] Dos.\n'
+  );
+  const sinTilde = extraerSecciones(
+    '## Objetivo\n\nTexto.\n\n## Criterios de aceptacion\n- [ ] Uno.\n- [ ] Dos.\n'
+  );
+  assert.deepEqual(conTilde, sinTilde);
+  assert.deepEqual(conTilde.criterios, ['Uno.', 'Dos.']);
+});
+
+test('el objetivo termina donde empieza la siguiente cabecera "##"', () => {
+  const { objetivo } = extraerSecciones(
+    '## Objetivo\n\nEsto si.\n\n## Resultado\n\nEsto no.\n'
+  );
+  assert.equal(objetivo, 'Esto si.');
+});
+
+test('una linea indentada continua el criterio anterior en vez de perderse', () => {
+  // Los criterios largos de las tareas reales se parten en varias
+  // lineas alineadas bajo el texto. Descartarlas dejaria fuera parte
+  // del enunciado justo cuando se buscan palabras de riesgo en el.
+  const { criterios } = extraerSecciones(
+    '## Criterios de aceptacion\n- [x] Existe una funcion que\n      resuelve la rama base.\n'
+  );
+  assert.deepEqual(criterios, ['Existe una funcion que resuelve la rama base.']);
+});
+
+test('un cuerpo sin ninguna de las dos secciones da objetivo vacio y cero criterios', () => {
+  const { objetivo, criterios } = extraerSecciones('Texto suelto.\n- [ ] Esto no cuenta.\n');
+  assert.equal(objetivo, '');
+  assert.deepEqual(criterios, []);
+});
+
+// --------------------------------------------------------------------
+// 2. Resolucion de la ruta y carga del fichero real
+//
+// Mutacion que pone rojo este grupo: cambiar la profundidad de
+// packageRoot() (dist/src/core -> raiz son tres saltos) o dejar de
+// respetar CLAUDE_PLUGIN_ROOT.
+// --------------------------------------------------------------------
+
+test('resolverRutaHeuristica apunta al YML que trae el plugin y cargarHeuristica lo lee', () => {
+  const previo = process.env['CLAUDE_PLUGIN_ROOT'];
+  delete process.env['CLAUDE_PLUGIN_ROOT'];
+  try {
+    assert.equal(resolverRutaHeuristica(), RUTA_YML);
+    // Sin argumento tiene que dar exactamente lo mismo que parsear el
+    // fichero real a mano: si la ruta se calculara mal, esto ni
+    // siquiera llegaria a comparar (lanzaria al leer).
+    assert.deepEqual(cargarHeuristica(), H);
+  } finally {
+    if (previo !== undefined) process.env['CLAUDE_PLUGIN_ROOT'] = previo;
+  }
+});
+
+test('CLAUDE_PLUGIN_ROOT manda sobre la ruta calculada desde el modulo', () => {
+  const previo = process.env['CLAUDE_PLUGIN_ROOT'];
+  process.env['CLAUDE_PLUGIN_ROOT'] = path.join(path.sep, 'raiz', 'inventada');
+  try {
+    assert.equal(
+      resolverRutaHeuristica(),
+      path.join(path.sep, 'raiz', 'inventada', 'scripts', FICHERO_HEURISTICA)
+    );
+  } finally {
+    if (previo === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
+    else process.env['CLAUDE_PLUGIN_ROOT'] = previo;
+  }
+});
+
+test('el fichero real da valores concretos y ya tipados', () => {
+  // Los extremos de la tabla no son una eleccion del fichero: 0 en
+  // trivial (no se paga un brainstorm para algo trivial) y 4 en
+  // critica (los cuatro roles definidos). Que salgan como NUMEROS y no
+  // como texto es lo que este test anade sobre los del propio YML.
+  assert.equal(H.agentes_brainstorm_trivial, 0);
+  assert.equal(H.agentes_brainstorm_critica, 4);
+  assert.equal(H.modelo_consulta_discrepancia, 'haiku');
+  assert.ok(Array.isArray(H.palabras_alto_riesgo));
+  assert.ok(H.palabras_alto_riesgo.includes('migracion'));
+  assert.equal(
+    H.palabras_alto_riesgo.filter((p) => p.trim() === '').length,
+    0,
+    'una entrada vacia casaria como subcadena con cualquier tarea'
+  );
+  for (const clave of CLAVES_HEURISTICA) {
+    assert.ok(clave in H, `la clave "${clave}" no llego al objeto Heuristica`);
+  }
+});
+
+// --------------------------------------------------------------------
+// 3. La tabla (complejidad, tipo) -> numero de agentes: 5 x 4 = 20
+//
+// Mutacion que pone rojo este grupo: sustituir el MIN del hotfix por
+// una asignacion, aplicar el tope a un tipo que no sea hotfix, o
+// barajar la correspondencia nivel -> clave del fichero.
+// --------------------------------------------------------------------
+
+test('las 20 filas (complejidad x tipo) salen del fichero, con el tope solo en hotfix', () => {
+  const porNivel: Record<TaskComplexity, number> = {
+    trivial: H.agentes_brainstorm_trivial,
+    simple: H.agentes_brainstorm_simple,
+    media: H.agentes_brainstorm_media,
+    alta: H.agentes_brainstorm_alta,
+    critica: H.agentes_brainstorm_critica,
+  };
+
+  let filas = 0;
+  for (const nivel of TASK_COMPLEXITIES) {
+    for (const tipo of TASK_TYPES) {
+      const esperado =
+        tipo === 'hotfix'
+          ? Math.min(porNivel[nivel], H.agentes_brainstorm_hotfix)
+          : porNivel[nivel];
+      assert.equal(agentesBrainstorm(nivel, tipo, H), esperado, `fila (${nivel}, ${tipo})`);
+      filas++;
+    }
+  }
+  assert.equal(filas, 20, 'la tabla tiene que cubrir las 5 complejidades por los 4 tipos');
+});
+
+test('la serie por nivel es monotona y sube de uno en uno: 0-1-2-3-4', () => {
+  // El criterio del fichero es que subir un nivel de complejidad anada
+  // exactamente un punto de vista. Se asevera la relacion, no los
+  // numeros: copiar la tabla aqui probaria el test contra si mismo.
+  const serie = TASK_COMPLEXITIES.map((n) => agentesBrainstorm(n, 'feature', H));
+  assert.equal(serie[0], 0, 'en trivial no se lanza a nadie');
+  for (let i = 1; i < serie.length; i++) {
+    assert.equal(
+      (serie[i] as number) - (serie[i - 1] as number),
+      1,
+      `el salto ${String(TASK_COMPLEXITIES[i - 1])} -> ${String(TASK_COMPLEXITIES[i])} no vale 1`
+    );
+  }
+  assert.equal(serie[serie.length - 1], 4, 'en critica entran los cuatro roles definidos');
+});
+
+test('hotfix + trivial da 0 y NO 1: el tope es un MIN, no una sustitucion', () => {
+  // El caso que discrimina las dos lecturas posibles de la clave. Con
+  // una sustitucion, la clave que existe para ABREVIAR el brainstorm
+  // acabaria anadiendo un agente donde la tabla no pedia ninguno.
+  assert.ok(
+    H.agentes_brainstorm_hotfix > H.agentes_brainstorm_trivial,
+    'sin esta precondicion el caso no discriminaria nada'
+  );
+  assert.equal(agentesBrainstorm('trivial', 'hotfix', H), 0);
+  assert.notEqual(agentesBrainstorm('trivial', 'hotfix', H), H.agentes_brainstorm_hotfix);
+});
+
+test('hotfix + critica si queda topado en el valor de la clave', () => {
+  assert.ok(
+    H.agentes_brainstorm_critica > H.agentes_brainstorm_hotfix,
+    'sin esta precondicion el tope no recortaria nada'
+  );
+  assert.equal(agentesBrainstorm('critica', 'hotfix', H), H.agentes_brainstorm_hotfix);
+});
+
+test('los tipos que no son hotfix leen la tabla sin tocarla', () => {
+  for (const tipo of TASK_TYPES) {
+    if (tipo === 'hotfix') continue;
+    assert.equal(agentesBrainstorm('critica', tipo, H), H.agentes_brainstorm_critica);
+    assert.equal(agentesBrainstorm('simple', tipo, H), H.agentes_brainstorm_simple);
+  }
+});
+
+// --------------------------------------------------------------------
+// 4. nivelHeuristico: los bordes de cada tramo
+//
+// Mutacion que pone rojo: cambiar un "<=" por un "<" en la cascada, o
+// desordenar los tramos.
+// --------------------------------------------------------------------
+
+test('cada nivel_*_hasta es el ultimo valor que TODAVIA cae en ese nivel', () => {
+  assert.equal(nivelHeuristico(H.nivel_trivial_hasta, H), 'trivial');
+  assert.equal(nivelHeuristico(H.nivel_trivial_hasta + 1, H), 'simple');
+  assert.equal(nivelHeuristico(H.nivel_simple_hasta, H), 'simple');
+  assert.equal(nivelHeuristico(H.nivel_simple_hasta + 1, H), 'media');
+  assert.equal(nivelHeuristico(H.nivel_media_hasta, H), 'media');
+  assert.equal(nivelHeuristico(H.nivel_media_hasta + 1, H), 'alta');
+  assert.equal(nivelHeuristico(H.nivel_alta_hasta, H), 'alta');
+  assert.equal(nivelHeuristico(H.nivel_critica_desde, H), 'critica');
+  assert.equal(nivelHeuristico(0, H), 'trivial');
+  // No hay tope por arriba: la escala se abre en critica.
+  assert.equal(nivelHeuristico(H.nivel_critica_desde * 10, H), 'critica');
+});
+
+// --------------------------------------------------------------------
+// 5. Los seis pesos, uno a uno y aislados
+//
+// Mutacion que pone rojo cada caso: quitar el "-1" de las etiquetas,
+// contar dependencias una vez en vez de por dependencia, disparar la
+// senal de hotfix sin exigir palabra de riesgo, cambiar el ">=" del
+// umbral de criterios por un ">", o cobrar el umbral por criterio.
+// --------------------------------------------------------------------
+
+test('el cuerpo neutro no dispara ninguna senal: es el cero de los demas casos', () => {
+  const { puntos, senales } = puntuarTarea(tarea(), CUERPO_NEUTRO, H);
+  assert.equal(puntos, 0);
+  assert.deepEqual(senales, []);
+});
+
+test('peso_etiqueta_adicional: la primera etiqueta no puntua, las demas si', () => {
+  const una = puntuarTarea(tarea({ etiquetas: ['cli'] }), CUERPO_NEUTRO, H);
+  assert.equal(una.puntos, 0);
+  assert.deepEqual(una.senales, []);
+
+  const dos = puntuarTarea(tarea({ etiquetas: ['cli', 'docs'] }), CUERPO_NEUTRO, H);
+  assert.equal(dos.puntos, H.peso_etiqueta_adicional);
+  assert.equal(dos.senales.filter((s) => s.clave === SENAL_ETIQUETAS).length, 1);
+
+  const cuatro = puntuarTarea(
+    tarea({ etiquetas: ['cli', 'docs', 'git', 'tests'] }),
+    CUERPO_NEUTRO,
+    H
+  );
+  assert.equal(cuatro.puntos, 3 * H.peso_etiqueta_adicional);
+});
+
+test('peso_dependencia: se paga por cada dependencia declarada', () => {
+  const una = puntuarTarea(tarea({ dependencias: ['TASK-010'] }), CUERPO_NEUTRO, H);
+  assert.equal(una.puntos, H.peso_dependencia);
+  assert.equal(una.senales.filter((s) => s.clave === SENAL_DEPENDENCIA).length, 1);
+
+  const tres = puntuarTarea(
+    tarea({ dependencias: ['TASK-010', 'TASK-011', 'TASK-012'] }),
+    CUERPO_NEUTRO,
+    H
+  );
+  assert.equal(tres.puntos, 3 * H.peso_dependencia);
+});
+
+test('peso_tipo_release: solo lo paga una release', () => {
+  const release = puntuarTarea(tarea({ tipo: 'release' }), CUERPO_NEUTRO, H);
+  assert.equal(release.puntos, H.peso_tipo_release);
+  assert.equal(release.senales.filter((s) => s.clave === SENAL_RELEASE).length, 1);
+
+  for (const tipo of TASK_TYPES) {
+    if (tipo === 'release') continue;
+    const otra = puntuarTarea(tarea({ tipo }), CUERPO_NEUTRO, H);
+    assert.equal(otra.senales.filter((s) => s.clave === SENAL_RELEASE).length, 0);
+  }
+});
+
+test('peso_tipo_hotfix_con_palabra_riesgo: un hotfix NO puntua por serlo', () => {
+  // Urgencia no es complejidad, y tratarla como tal es el error que
+  // esta senal existe para evitar. Lo que puntua es un hotfix que
+  // ADEMAS toca terreno delicado.
+  const sinRiesgo = puntuarTarea(tarea({ tipo: 'hotfix' }), CUERPO_NEUTRO, H);
+  assert.equal(sinRiesgo.puntos, 0);
+
+  assert.ok(H.palabras_alto_riesgo.includes('cifrado'));
+  const conRiesgo = puntuarTarea(
+    tarea({ tipo: 'hotfix' }),
+    cuerpo('Arreglar el cifrado de la sesion.'),
+    H
+  );
+  assert.equal(
+    conRiesgo.puntos,
+    H.peso_tipo_hotfix_con_palabra_riesgo + H.peso_palabra_alto_riesgo
+  );
+  assert.equal(conRiesgo.senales.filter((s) => s.clave === SENAL_HOTFIX_RIESGO).length, 1);
+
+  // Y no la paga ningun otro tipo, por mucha palabra de riesgo que haya.
+  const feature = puntuarTarea(tarea(), cuerpo('Arreglar el cifrado de la sesion.'), H);
+  assert.equal(feature.senales.filter((s) => s.clave === SENAL_HOTFIX_RIESGO).length, 0);
+  assert.equal(feature.puntos, H.peso_palabra_alto_riesgo);
+});
+
+test('peso_criterios_aceptacion: se paga UNA vez al llegar al umbral, no por criterio', () => {
+  const umbral = H.umbral_criterios_aceptacion;
+  assert.ok(umbral >= 2, 'con un umbral de 0 o 1 el caso "justo por debajo" no existiria');
+
+  const debajo = puntuarTarea(tarea(), cuerpo('Nada.', criteriosNeutros(umbral - 1)), H);
+  assert.equal(debajo.puntos, 0);
+
+  const justo = puntuarTarea(tarea(), cuerpo('Nada.', criteriosNeutros(umbral)), H);
+  assert.equal(justo.puntos, H.peso_criterios_aceptacion);
+  assert.equal(justo.senales.filter((s) => s.clave === SENAL_CRITERIOS).length, 1);
+
+  // Partir el mismo trabajo en mas casillas no lo hace mas complejo.
+  const muchos = puntuarTarea(tarea(), cuerpo('Nada.', criteriosNeutros(umbral + 7)), H);
+  assert.equal(muchos.puntos, H.peso_criterios_aceptacion);
+});
+
+// --------------------------------------------------------------------
+// 6. El conteo de palabras de alto riesgo
+//
+// Mutacion que pone rojo este grupo: contar apariciones en vez de
+// entradas distintas, recorrer objetivo y criterios por separado
+// sumando dos veces, o quitar la normalizacion de acentos/mayusculas.
+// --------------------------------------------------------------------
+
+test('la misma palabra repetida N veces suma una sola vez', () => {
+  assert.ok(H.palabras_alto_riesgo.includes('rendimiento'));
+  const { puntos, senales } = puntuarTarea(
+    tarea(),
+    cuerpo('El rendimiento, otra vez el rendimiento y de nuevo el rendimiento.'),
+    H
+  );
+  assert.equal(puntos, H.peso_palabra_alto_riesgo);
+  assert.deepEqual(
+    senales.filter((s) => s.clave === SENAL_PALABRA).map((s) => s.detalle),
+    ['rendimiento']
+  );
+});
+
+test('dos entradas distintas suman dos', () => {
+  assert.ok(H.palabras_alto_riesgo.includes('rendimiento'));
+  assert.ok(H.palabras_alto_riesgo.includes('rollback'));
+  const { puntos, senales } = puntuarTarea(
+    tarea(),
+    cuerpo('Medir el rendimiento y preparar el rollback.'),
+    H
+  );
+  assert.equal(puntos, 2 * H.peso_palabra_alto_riesgo);
+  assert.equal(senales.filter((s) => s.clave === SENAL_PALABRA).length, 2);
+});
+
+test('una entrada que sale en el objetivo Y en los criterios sigue sumando una vez', () => {
+  const { puntos } = puntuarTarea(
+    tarea(),
+    cuerpo('Revisar el rollback.', ['Documentar el rollback.', 'Probar el rollback.']),
+    H
+  );
+  assert.equal(puntos, H.peso_palabra_alto_riesgo);
+});
+
+test('la comparacion es insensible a acentos: "migracion" casa con "migración"', () => {
+  assert.ok(H.palabras_alto_riesgo.includes('migracion'));
+  const { puntos, senales } = puntuarTarea(tarea(), cuerpo('Planificar la migración.'), H);
+  assert.equal(puntos, H.peso_palabra_alto_riesgo);
+  assert.deepEqual(
+    senales.filter((s) => s.clave === SENAL_PALABRA).map((s) => s.detalle),
+    ['migracion']
+  );
+});
+
+test('la comparacion es insensible a mayusculas', () => {
+  assert.ok(H.palabras_alto_riesgo.includes('seguridad'));
+  const { puntos } = puntuarTarea(tarea(), cuerpo('Auditoria de SEGURIDAD.'), H);
+  assert.equal(puntos, H.peso_palabra_alto_riesgo);
+});
+
+test('la comparacion es por subcadena: una entrada corta cubre sus variantes', () => {
+  // El fichero no lista los plurales a proposito: "migracion" cubre
+  // "migraciones". Si la comparacion fuera por palabra completa, media
+  // lista dejaria de casar con la redaccion natural de las tareas.
+  const { puntos, senales } = puntuarTarea(tarea(), cuerpo('Aplicar las migraciones.'), H);
+  assert.equal(puntos, H.peso_palabra_alto_riesgo);
+  assert.equal(senales.filter((s) => s.clave === SENAL_PALABRA).length, 1);
+});
+
+// --------------------------------------------------------------------
+// 7. resolverNumeroAgentes: discrepancia en las dos direcciones
+//
+// Mutacion que pone rojo este grupo: quedarse solo con el nivel
+// declarado, solo con el heuristico, o usar min en vez de max.
+// --------------------------------------------------------------------
+
+/** Objetivo con tres entradas distintas de la lista: 3 x peso puntos. */
+const OBJETIVO_TRES_RIESGOS = 'Ajustar el rendimiento del cifrado y preparar el rollback.';
+
+test('declarado POR DEBAJO de la heuristica: manda el numero mas alto', () => {
+  const r = resolverNumeroAgentes(
+    tarea({ complejidad: 'trivial' }),
+    cuerpo(OBJETIVO_TRES_RIESGOS),
+    H
+  );
+  assert.equal(r.puntos, 3 * H.peso_palabra_alto_riesgo);
+  assert.equal(r.senales.filter((s) => s.clave === SENAL_PALABRA).length, 3);
+  assert.equal(r.nivelDeclarado, 'trivial');
+  assert.equal(r.nivelHeuristico, 'alta');
+  assert.equal(r.hayDiscrepancia, true);
+  assert.ok(H.agentes_brainstorm_alta > H.agentes_brainstorm_trivial);
+  assert.equal(r.agentes, H.agentes_brainstorm_alta);
+  assert.equal(r.topeHotfixAplicado, false);
+});
+
+test('declarado POR ENCIMA de la heuristica: lo declarado no se ignora', () => {
+  const r = resolverNumeroAgentes(tarea({ complejidad: 'critica' }), CUERPO_NEUTRO, H);
+  assert.equal(r.puntos, 0);
+  assert.equal(r.nivelDeclarado, 'critica');
+  assert.equal(r.nivelHeuristico, 'trivial');
+  assert.equal(r.hayDiscrepancia, true);
+  assert.ok(H.agentes_brainstorm_critica > H.agentes_brainstorm_trivial);
+  assert.equal(r.agentes, H.agentes_brainstorm_critica);
+});
+
+test('sin discrepancia, hayDiscrepancia es false y el numero es el del nivel', () => {
+  const r = resolverNumeroAgentes(tarea({ complejidad: 'trivial' }), CUERPO_NEUTRO, H);
+  assert.equal(r.nivelDeclarado, r.nivelHeuristico);
+  assert.equal(r.hayDiscrepancia, false);
+  assert.equal(r.agentes, H.agentes_brainstorm_trivial);
+});
+
+// --------------------------------------------------------------------
+// 8. El tope de hotfix dentro de la composicion
+//
+// El tope va aplicado DENTRO de cada llamada, es decir antes del max.
+// Lo que estos tests fijan es el RESULTADO: un hotfix nunca sale del
+// tope, discrepen o no los dos niveles.
+//
+// Mutacion que pone rojo: quitar el min de agentesBrainstorm (el
+// primer caso pasa de 1 a 4), o convertirlo en sustitucion (el segundo
+// pasa de 0 a 1).
+// --------------------------------------------------------------------
+
+test('un hotfix con niveles discrepantes sigue topado tras el max', () => {
+  const r = resolverNumeroAgentes(
+    tarea({ tipo: 'hotfix', complejidad: 'critica' }),
+    CUERPO_NEUTRO,
+    H
+  );
+  assert.equal(r.nivelDeclarado, 'critica');
+  assert.equal(r.nivelHeuristico, 'trivial');
+  assert.equal(r.agentes, H.agentes_brainstorm_hotfix);
+  assert.ok(r.agentes < H.agentes_brainstorm_critica);
+  assert.equal(r.topeHotfixAplicado, true);
+});
+
+test('un hotfix trivial por los dos lados se queda en 0 agentes', () => {
+  const r = resolverNumeroAgentes(
+    tarea({ tipo: 'hotfix', complejidad: 'trivial' }),
+    CUERPO_NEUTRO,
+    H
+  );
+  assert.equal(r.agentes, 0);
+  assert.notEqual(r.agentes, H.agentes_brainstorm_hotfix);
+  // El tope no recorto nada: la tabla ya pedia 0.
+  assert.equal(r.topeHotfixAplicado, false);
+});
+
+test('en una tarea que no es hotfix, topeHotfixAplicado es false', () => {
+  const r = resolverNumeroAgentes(tarea({ complejidad: 'critica' }), CUERPO_NEUTRO, H);
+  assert.equal(r.agentes, H.agentes_brainstorm_critica);
+  assert.equal(r.topeHotfixAplicado, false);
+});
+
+// --------------------------------------------------------------------
+// 9. parsearHeuristica: fallo cerrado
+//
+// Cada caso parte del fichero REAL mutado en una sola linea, asi que
+// la base siempre es un fichero que parsea. Mutacion que pone rojo
+// este grupo: tragarse cualquiera de estos casos y caer al default.
+// --------------------------------------------------------------------
+
+test('una clave desconocida aborta y enumera las validas', () => {
+  assert.throws(
+    () => parsearHeuristica(conLineaExtra('peso_inventado: 3'), RUTA_YML),
+    errorAccionable(/clave desconocida "peso_inventado"/)
+  );
+  assert.throws(
+    () => parsearHeuristica(conLineaExtra('peso_inventado: 3'), RUTA_YML),
+    errorAccionable(/Claves validas: peso_etiqueta_adicional, /)
+  );
+});
+
+test('una clave desconocida que es una errata propone la clave correcta', () => {
+  assert.throws(
+    () => parsearHeuristica(conLineaExtra('peso_dependencias: 3'), RUTA_YML),
+    errorAccionable(/Quiza quisiste decir "peso_dependencia"/)
+  );
+});
+
+test('una clave obligatoria ausente aborta nombrandola', () => {
+  const sinPeso = sinLineaDe('peso_dependencia');
+  assert.ok(!sinPeso.includes('\npeso_dependencia:'), 'la mutacion no quito la linea');
+  assert.throws(
+    () => parsearHeuristica(sinPeso, RUTA_YML),
+    errorAccionable(/falta la clave obligatoria "peso_dependencia"/)
+  );
+  assert.throws(
+    () => parsearHeuristica(sinLineaDe('palabras_alto_riesgo'), RUTA_YML),
+    errorAccionable(/falta la clave obligatoria "palabras_alto_riesgo"/)
+  );
+  assert.throws(
+    () => parsearHeuristica(sinLineaDe('modelo_consulta_discrepancia'), RUTA_YML),
+    errorAccionable(/falta la clave obligatoria "modelo_consulta_discrepancia"/)
+  );
+});
+
+test('un valor no numerico donde se espera un numero aborta', () => {
+  assert.throws(
+    () => parsearHeuristica(conValor('peso_dependencia', 'haiku'), RUTA_YML),
+    errorAccionable(/"peso_dependencia" debe ser un numero entero.*el texto "haiku"/s)
+  );
+  // Un decimal tambien: el parser lo devuelve como texto, y si se
+  // colara, `puntos` dejaria de ser entero sin que nadie se entere.
+  assert.throws(
+    () => parsearHeuristica(conValor('peso_dependencia', '1.5'), RUTA_YML),
+    errorAccionable(/"peso_dependencia" debe ser un numero entero/)
+  );
+});
+
+test('un numero negativo aborta: restaria complejidad por tener una senal mas', () => {
+  assert.throws(
+    () => parsearHeuristica(conValor('peso_dependencia', '-1'), RUTA_YML),
+    errorAccionable(/"peso_dependencia" debe ser un numero entero mayor o igual que 0/)
+  );
+});
+
+test('una clave repetida aborta en vez de dejar que gane la ultima', () => {
+  assert.throws(
+    () => parsearHeuristica(conLineaExtra('peso_dependencia: 5'), RUTA_YML),
+    errorAccionable(/la clave "peso_dependencia" esta repetida/)
+  );
+});
+
+test('la lista de palabras escrita sin corchetes aborta', () => {
+  // Sin corchetes el parser devuelve UN texto, y la comparacion por
+  // subcadena buscaria la frase entera como si fuera una sola entrada:
+  // no casaria nunca y la senal mas cara del fichero moriria en
+  // silencio.
+  assert.throws(
+    () => parsearHeuristica(conValor('palabras_alto_riesgo', 'migracion, seguridad'), RUTA_YML),
+    errorAccionable(/"palabras_alto_riesgo" debe ser una lista de textos/)
+  );
+});
+
+test('una entrada repetida en la lista de palabras aborta', () => {
+  // La regla "una vez por entrada DISTINTA" se cumple porque se
+  // recorre la lista, no el texto. Con la misma entrada dos veces esa
+  // garantia se cae: casaria en las dos vueltas y esa palabra
+  // puntuaria el doble que las demas.
+  assert.throws(
+    () =>
+      parsearHeuristica(
+        conValor('palabras_alto_riesgo', '["migracion", "seguridad", "migracion"]'),
+        RUTA_YML
+      ),
+    errorAccionable(/"palabras_alto_riesgo" tiene la entrada "migracion" repetida/)
+  );
+});
+
+test('una entrada vacia en la lista de palabras aborta', () => {
+  // Casaria como subcadena con CUALQUIER tarea y dispararia la senal
+  // mas cara del fichero siempre.
+  assert.throws(
+    () => parsearHeuristica(conValor('palabras_alto_riesgo', '["migracion", ""]'), RUTA_YML),
+    errorAccionable(/"palabras_alto_riesgo" tiene alguna entrada vacia/)
+  );
+});
+
+test('una escala de niveles que no crece aborta', () => {
+  assert.throws(
+    () => parsearHeuristica(conValor('nivel_media_hasta', '1'), RUTA_YML),
+    errorAccionable(/"nivel_media_hasta" \(1\) tiene que ser mayor que "nivel_simple_hasta"/)
+  );
+});
+
+test('una escala con un hueco entre alta y critica aborta', () => {
+  // Con alta_hasta: 7 y critica_desde: 10, un 8 no seria ni alta ni
+  // critica segun el fichero, pero nivelHeuristico devolveria critica
+  // calladamente. Es lo que permite que la cascada no vuelva a leer
+  // nivel_critica_desde: la redundancia se exige, no se supone.
+  assert.throws(
+    () => parsearHeuristica(conValor('nivel_critica_desde', '10'), RUTA_YML),
+    errorAccionable(/"nivel_critica_desde" \(10\) tiene que ser exactamente/)
+  );
+});
+
+test('cargarHeuristica con una ruta que no existe aborta diciendo que hacer', () => {
+  const inexistente = path.join(RAIZ_PAQUETE, 'scripts', 'no-existe-heuristica.yml');
+  assert.throws(
+    () => cargarHeuristica(inexistente),
+    errorAccionable(/No se pudo leer la heuristica de complejidad/)
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/roles-brainstorm.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/roles-brainstorm.test.ts
new file mode 100644
index 0000000..127d3ed
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/roles-brainstorm.test.ts
@@ -0,0 +1,505 @@
+/**
+ * Tests de `src/core/roles-brainstorm.ts` (TASK-016, item D1).
+ *
+ * Lo que se prueba aqui es EL ACOPLAMIENTO, que es lo que hoy no cubre
+ * nadie. `test/agents/brainstorm-roles.test.ts` mira los cuatro ficheros
+ * `agents/brainstorm-*.md` por dentro (frontmatter, secciones, tope de
+ * salida) y comprueba que cada `name:` coincide con SU nombre de
+ * fichero; nunca abre la constante del codigo. Este fichero cierra el
+ * otro lado del contrato: que la lista de roles que el CLI usa para
+ * dirigir peticiones y el directorio de agentes que las atiende sean el
+ * mismo conjunto, en las dos direcciones. Con las dos mitades, un id
+ * inventado en el codigo y un rol nuevo en disco dejan de poder
+ * esconderse.
+ *
+ * La otra mitad del fichero es el contrato de `seleccionarRoles`, la
+ * inmutabilidad de la constante y las dos invariantes que sostienen el
+ * criterio de aceptacion 1 de la tarea ("contexto acotado por rol"):
+ * que los recortes de contexto sean DISTINTOS entre roles y que cada
+ * uno ceda explicitamente a los otros tres lo que no mira.
+ *
+ * REGLA DE LA SUITE: cada test lleva encima, en una linea, la mutacion
+ * del codigo fuente que lo pone rojo. Un test cuya mutacion no se sabe
+ * nombrar no esta midiendo nada.
+ *
+ * Cero dependencias y cero mocks: se lee el directorio `agents/` real
+ * con `readdir` y se parsea el frontmatter con el parser del plugin.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, readdir } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseFrontmatter } from '../../src/core/frontmatter.js';
+import {
+  ROLES_BRAINSTORM,
+  RolesBrainstormError,
+  UNIFICADOR_ID,
+  seleccionarRoles,
+} from '../../src/core/roles-brainstorm.js';
+import type { RolBrainstorm, RolBrainstormId } from '../../src/core/roles-brainstorm.js';
+
+// --- Localizacion del plugin -------------------------------------------
+//
+// Compilado, este fichero vive en dist/test/core/. Tres niveles arriba
+// esta la raiz del plugin. Mismo truco que test/agents/brainstorm-roles.test.ts,
+// en vez de depender del cwd de npm.
+
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
+const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');
+
+/**
+ * Que ficheros de `agents/` cuentan como "un rol de brainstorm". El
+ * patron es deliberadamente amplio: la gracia del test 2 es que un
+ * `brainstorm-seguridad.md` que nadie ha metido en la constante CAIGA
+ * dentro y de un rojo, no que se escape por no estar enumerado.
+ */
+const FICHERO_DE_ROL = /^brainstorm-[a-z0-9-]+\.md$/;
+
+const ids = (roles: readonly RolBrainstorm[]): RolBrainstormId[] =>
+  roles.map((r) => r.id);
+
+/** Los ids como texto llano, para poder compararlos con `UNIFICADOR_ID`. */
+const idsComoTexto = (): string[] => ROLES_BRAINSTORM.map((r) => r.id);
+
+/** Los nombres (sin `.md`) de los ficheros de rol que hay en `agents/`. */
+async function rolesEnDisco(): Promise<string[]> {
+  const entradas = await readdir(AGENTS_DIR);
+  return (
+    entradas
+      .filter((f) => FICHERO_DE_ROL.test(f))
+      .map((f) => f.replace(/\.md$/, ''))
+      // El unificador queda fuera A PROPOSITO. `UNIFICADOR_ID` empieza
+      // por "brainstorm-" y por tanto casaria con el patron de arriba,
+      // pero no es un rol de brainstorm: no aporta un punto de vista,
+      // consolida los cuatro que si lo hacen. Hoy no tiene fichero en
+      // `agents/`, asi que este filtro no quita nada; esta escrito para
+      // que el dia que se le escriba uno, ese fichero no obligue a
+      // meterlo en `ROLES_BRAINSTORM` (donde romperia el reparto de
+      // `seleccionarRoles`). Que no este en la constante lo asevera el
+      // test 4, que es donde vive esa decision.
+      .filter((id) => id !== UNIFICADOR_ID)
+      .sort()
+  );
+}
+
+/**
+ * La respuesta esperada de `seleccionarRoles` para cada n valido. Se
+ * escriben los ids A MANO y no derivados de la constante: derivarlos
+ * haria que reordenar `ROLES_BRAINSTORM` cambiase a la vez lo medido y
+ * la medida, y el test seguiria verde con el orden de prioridad al
+ * reves. El orden de prioridad es la unica decision de diseño del
+ * modulo; tiene que estar escrita en un sitio que no se mueva con el.
+ */
+const ESPERADO_POR_N: ReadonlyArray<readonly string[]> = [
+  [],
+  ['brainstorm-arquitectura'],
+  ['brainstorm-arquitectura', 'brainstorm-riesgos'],
+  ['brainstorm-arquitectura', 'brainstorm-riesgos', 'brainstorm-testing'],
+  [
+    'brainstorm-arquitectura',
+    'brainstorm-riesgos',
+    'brainstorm-testing',
+    'brainstorm-dominio',
+  ],
+];
+
+// --- 0. Guard de no-vacuidad -------------------------------------------
+
+// Mutacion: cambiar PLUGIN_ROOT a path.resolve(moduleDir, '..', '..') -> rojo.
+test('0. el test apunta de verdad a la raiz del plugin (guard de no-vacuidad)', async () => {
+  const pkg = JSON.parse(
+    await readFile(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')
+  ) as { name?: unknown };
+  assert.equal(
+    pkg.name,
+    'taskcode-plugin',
+    `PLUGIN_ROOT resuelto a "${PLUGIN_ROOT}", que no es el plugin: los tests que ` +
+      'leen agents/ estarian mirando otro directorio o fallando por ruta'
+  );
+});
+
+// --- 1. El acoplamiento con agents/, en las dos direcciones -------------
+
+// Mutacion: borrar el rol 'brainstorm-dominio' de ROLES_BRAINSTORM (o crear
+// agents/brainstorm-seguridad.md sin tocar la constante) -> rojo.
+test('1. los ids de ROLES_BRAINSTORM y los ficheros de agents/ son el MISMO conjunto', async () => {
+  const esperados = [...idsComoTexto()].sort();
+  // Guard de no-vacuidad: con la constante vacia, la comparacion de
+  // abajo seria [] contra [] y este test daria verde sin medir nada.
+  assert.ok(
+    esperados.length > 0,
+    'ROLES_BRAINSTORM esta vacia: la comparacion contra agents/ no probaria nada'
+  );
+
+  const enDisco = await rolesEnDisco();
+
+  // deepEqual de listas ORDENADAS, no un includes de uno en uno: el
+  // includes solo mira que no falte ninguno, y deja pasar que SOBRE.
+  // Un quinto `agents/brainstorm-seguridad.md` que nadie haya metido en
+  // la constante no se le enviaria nunca una peticion, y el silencio no
+  // se distingue de que el rol no exista. La igualdad de conjuntos hace
+  // que anadir un rol obligue a tocar las dos partes, que es
+  // exactamente la decision que se quiere que alguien tome a mano.
+  assert.deepEqual(
+    enDisco,
+    esperados,
+    `el codigo y agents/ han dejado de cuadrar.\n  en ROLES_BRAINSTORM: ${esperados.join(', ')}` +
+      `\n  en agents/:          ${enDisco.join(', ')}\n` +
+      '  Sobran en disco (roles sin id, no se les invocara nunca): ' +
+      `${enDisco.filter((f) => !esperados.includes(f)).join(', ') || 'ninguno'}\n` +
+      '  Faltan en disco (ids sin agente, se invocaria a un agente inexistente): ' +
+      `${esperados.filter((i) => !enDisco.includes(i)).join(', ') || 'ninguno'}`
+  );
+});
+
+for (const rol of ROLES_BRAINSTORM) {
+  // Mutacion: cambiar el id 'brainstorm-riesgos' por 'brainstorm-riesgo' en el modulo -> rojo.
+  test(`2. ${rol.id}: el id es literalmente el "name:" del frontmatter de agents/${rol.id}.md`, async () => {
+    // El listado del directorio, y no un stat() de la ruta: en Windows
+    // el filesystem es case-insensitive y un stat NO demuestra el case.
+    const enAgents = await readdir(AGENTS_DIR);
+    assert.ok(
+      enAgents.includes(`${rol.id}.md`),
+      `ROLES_BRAINSTORM declara el id "${rol.id}" pero agents/ no tiene un ` +
+        `"${rol.id}.md" con ese case exacto. Hay: ${enAgents.join(', ')}`
+    );
+
+    const { data } = parseFrontmatter(
+      await readFile(path.join(AGENTS_DIR, `${rol.id}.md`), 'utf8')
+    );
+
+    // Esta es la igualdad que hace invocable al rol: Claude Code llama
+    // al agente por su `name`, no por su ruta, y el CLI escribe la
+    // peticion contra el `id`. Si divergen, el plugin estaria pidiendo
+    // trabajo a un agente que no existe, en silencio.
+    assert.equal(
+      data.name,
+      rol.id,
+      `agents/${rol.id}.md declara name="${String(data.name)}", que no es el id ` +
+        `"${rol.id}" de ROLES_BRAINSTORM: las peticiones dirigidas a ese id no ` +
+        'llegarian a ningun agente'
+    );
+  });
+}
+
+// Mutacion: anadir { id: UNIFICADOR_ID, ... } como quinto elemento de ROLES_BRAINSTORM -> rojo.
+test('3. UNIFICADOR_ID no es uno de los roles de brainstorm', () => {
+  // No es un detalle de nomenclatura. `seleccionarRoles` reparte por
+  // prioridad sobre ROLES_BRAINSTORM: colar ahi al unificador lo pondria
+  // a competir por un puesto del presupuesto de agentes con los roles a
+  // los que tiene que consolidar, y con n<5 podria quedarse fuera el
+  // rol cuyo trabajo viene a unificar.
+  assert.ok(
+    !idsComoTexto().includes(UNIFICADOR_ID),
+    `"${UNIFICADOR_ID}" figura en ROLES_BRAINSTORM: el unificador consolida a los ` +
+      'roles de brainstorm, no es uno de ellos'
+  );
+});
+
+// --- 2. seleccionarRoles ------------------------------------------------
+
+// Mutacion: intercambiar los roles de arquitectura y riesgos en ROLES_BRAINSTORM -> rojo.
+test('4. seleccionarRoles(n) devuelve los n primeros por prioridad, con los ids concretos', () => {
+  // Guard: si manana entra un quinto rol, esta tabla se queda corta y
+  // el test tiene que obligar a extenderla en vez de dejar el caso sin
+  // comprobar.
+  assert.equal(
+    ESPERADO_POR_N.length,
+    ROLES_BRAINSTORM.length + 1,
+    `hay ${ROLES_BRAINSTORM.length} roles y la tabla de esperados cubre ` +
+      `${ESPERADO_POR_N.length - 1}: extiende ESPERADO_POR_N`
+  );
+
+  for (const [n, esperado] of ESPERADO_POR_N.entries()) {
+    assert.deepEqual(
+      ids(seleccionarRoles(n)),
+      esperado,
+      `seleccionarRoles(${n}) no devuelve los ${n} primeros por prioridad`
+    );
+  }
+
+  // Y la longitud, dicha aparte: si el orden esperado y el real se
+  // rompieran a la vez de la misma forma, la comparacion de arriba
+  // seguiria siendo la que manda, pero esto deja el conteo explicito.
+  assert.equal(seleccionarRoles(0).length, 0);
+  assert.equal(
+    seleccionarRoles(ROLES_BRAINSTORM.length).length,
+    ROLES_BRAINSTORM.length
+  );
+});
+
+// Mutacion: cambiar `ROLES_BRAINSTORM.slice(0, n)` por `.slice(-n)` -> rojo.
+test('5. seleccionarRoles es estable entre invocaciones y cada n es prefijo del siguiente', () => {
+  for (let n = 0; n <= ROLES_BRAINSTORM.length; n++) {
+    // Estable: dos llamadas seguidas con el mismo n dan lo mismo. Que
+    // parezca obvio es el motivo de escribirlo: el dia que alguien
+    // ordene o baraje aqui dentro, el brainstorm dejaria de ser
+    // reproducible entre dos ejecuciones de la misma tarea.
+    assert.deepEqual(
+      ids(seleccionarRoles(n)),
+      ids(seleccionarRoles(n)),
+      `seleccionarRoles(${n}) devuelve cosas distintas en dos llamadas seguidas`
+    );
+  }
+
+  // Prefijo: quitar presupuesto solo puede quitar roles por la cola,
+  // nunca cambiar cuales entran. Es lo que hace que la prioridad
+  // signifique algo.
+  for (let n = 0; n < ROLES_BRAINSTORM.length; n++) {
+    assert.deepEqual(
+      ids(seleccionarRoles(n)),
+      ids(seleccionarRoles(n + 1)).slice(0, n),
+      `seleccionarRoles(${n}) no es el prefijo de seleccionarRoles(${n + 1}): ` +
+        'bajar el presupuesto en uno cambia QUE roles entran, no solo cuantos'
+    );
+  }
+});
+
+// Mutacion: quitar `!Number.isInteger(n) ||` de la guarda de seleccionarRoles -> rojo (1.5 y NaN).
+// Mutacion: quitar `n > ROLES_BRAINSTORM.length` de esa misma guarda -> rojo (n=5).
+test('6. seleccionarRoles rechaza n fuera de rango y no entero, con un mensaje que dice que hacer', () => {
+  const invalidos: ReadonlyArray<readonly [number, string]> = [
+    [ROLES_BRAINSTORM.length + 1, 'mas roles de los que hay'],
+    [-1, 'negativo'],
+    [1.5, 'no entero'],
+    [Number.NaN, 'NaN'],
+    [Number.POSITIVE_INFINITY, 'infinito'],
+  ];
+
+  for (const [n, motivo] of invalidos) {
+    assert.throws(
+      () => seleccionarRoles(n),
+      (error: unknown) => {
+        // El tipo importa: la unica forma que tiene quien llama de
+        // distinguir "la tabla del YML y esta lista no cuadran" de un
+        // fallo cualquiera es el tipo del error.
+        assert.ok(
+          error instanceof RolesBrainstormError,
+          `seleccionarRoles(${n}) (${motivo}) lanzo ${String(error)}, que no es ` +
+            'RolesBrainstormError'
+        );
+
+        // Y el mensaje tiene que decir QUE HACER, no solo que algo va
+        // mal: donde esta la tabla que hay que revisar y cual es el
+        // tope. Sin esto, el error correcto es igual de inutil que un
+        // "invalid argument".
+        assert.match(
+          error.message,
+          /heuristica-complejidad\.yml/,
+          `el mensaje de seleccionarRoles(${n}) no dice donde esta la tabla que ` +
+            `hay que corregir: "${error.message}"`
+        );
+        assert.match(
+          error.message,
+          /agentes_brainstorm_/,
+          `el mensaje de seleccionarRoles(${n}) no nombra las claves que hay que ` +
+            `revisar: "${error.message}"`
+        );
+        assert.ok(
+          error.message.includes(String(ROLES_BRAINSTORM.length)),
+          `el mensaje de seleccionarRoles(${n}) no dice cuantos roles hay como ` +
+            `maximo (${ROLES_BRAINSTORM.length}): "${error.message}"`
+        );
+        return true;
+      },
+      `seleccionarRoles(${n}) (${motivo}) no lanzo: un n fuera de rango recortado ` +
+        'en silencio significa que la tabla del YML y esta lista han dejado de cuadrar'
+    );
+  }
+});
+
+// --- 3. Inmutabilidad ---------------------------------------------------
+
+// Mutacion: quitar el Object.freeze exterior de ROLES_BRAINSTORM, o el de un `mira` -> rojo.
+test('7. ROLES_BRAINSTORM esta congelada en los dos niveles y no se puede mutar', () => {
+  const antes = JSON.stringify(ROLES_BRAINSTORM);
+
+  const primero = ROLES_BRAINSTORM[0];
+  assert.ok(primero !== undefined, 'ROLES_BRAINSTORM esta vacia: no hay nada que congelar');
+
+  assert.ok(Object.isFrozen(ROLES_BRAINSTORM), 'el array ROLES_BRAINSTORM no esta congelado');
+  assert.ok(Object.isFrozen(primero), `el rol "${primero.id}" no esta congelado`);
+  assert.ok(Object.isFrozen(primero.mira), `el "mira" de "${primero.id}" no esta congelado`);
+
+  // El codigo de un modulo ES corre siempre en modo estricto, asi que
+  // una asignacion a una propiedad no escribible LANZA en vez de
+  // fallar en silencio. Se asevera el TypeError, que es lo que de
+  // verdad ocurre; dar por bueno un "no cambio nada" dejaria pasar el
+  // caso de que la constante no estuviera congelada y la mutacion se
+  // hubiera aplicado.
+  const arrayMutable = ROLES_BRAINSTORM as RolBrainstorm[];
+  assert.throws(
+    () => arrayMutable.push(primero),
+    TypeError,
+    'se ha podido anadir un rol a ROLES_BRAINSTORM en caliente'
+  );
+  assert.throws(
+    () => {
+      arrayMutable[0] = primero;
+    },
+    TypeError,
+    'se ha podido reemplazar un elemento de ROLES_BRAINSTORM'
+  );
+
+  // Segundo nivel: el rol y sus listas. Sin esto, `Object.freeze` sobre
+  // el array de fuera dejaria el `mira` de cada rol abierto de par en
+  // par, que es justo el recorte de contexto que el diseño acota.
+  assert.throws(
+    () => {
+      primero.titulo = 'otro';
+    },
+    TypeError,
+    `se ha podido cambiar el titulo del rol "${primero.id}"`
+  );
+  const miraMutable = primero.mira as string[];
+  assert.throws(
+    () => miraMutable.push('una viñeta que nadie ha revisado'),
+    TypeError,
+    `se ha podido anadir una linea al "mira" de "${primero.id}"`
+  );
+  assert.throws(
+    () => {
+      miraMutable[0] = 'una viñeta que nadie ha revisado';
+    },
+    TypeError,
+    `se ha podido reescribir una linea del "mira" de "${primero.id}"`
+  );
+
+  assert.equal(
+    JSON.stringify(ROLES_BRAINSTORM),
+    antes,
+    'ROLES_BRAINSTORM ha cambiado tras los intentos de mutacion'
+  );
+});
+
+// --- 4. Los recortes de contexto son distintos entre roles --------------
+
+// Mutacion: copiar el array `mira` (o la `pregunta`) de arquitectura en riesgos -> rojo.
+test('8. cada rol mira y pregunta algo distinto de los demas', () => {
+  let pares = 0;
+
+  for (const r of ROLES_BRAINSTORM) {
+    for (const s of ROLES_BRAINSTORM) {
+      if (r.id === s.id) continue;
+      pares++;
+
+      assert.notEqual(
+        r.pregunta,
+        s.pregunta,
+        `"${r.id}" y "${s.id}" hacen la misma pregunta: "${r.pregunta}"`
+      );
+
+      // Ni una sola linea de contexto compartida. Si los cuatro roles
+      // recibieran lo mismo no habria cuatro puntos de vista, habria
+      // uno con cuatro firmas — y el unificador leeria esa coincidencia
+      // como confirmacion en vez de como duplicado.
+      const compartidas = r.mira.filter((linea) => s.mira.includes(linea));
+      assert.deepEqual(
+        compartidas,
+        [],
+        `"${r.id}" y "${s.id}" comparten literalmente ${compartidas.length} linea(s) de ` +
+          `"mira": ${compartidas.join(' | ')}`
+      );
+    }
+  }
+
+  // Guard de no-vacuidad: con 0 o 1 roles los dos bucles no comparan
+  // nada y este test daria verde sin ejecutar ninguna asercion.
+  assert.equal(
+    pares,
+    ROLES_BRAINSTORM.length * (ROLES_BRAINSTORM.length - 1),
+    'no se han comparado todos los pares de roles distintos'
+  );
+});
+
+// --- 5. Coherencia interna ---------------------------------------------
+
+// Mutacion: borrar de brainstorm-riesgos.noMira la vineta que cede el testing -> rojo.
+// Mutacion: anadir "Donde encaja el cambio (arquitectura)" al noMira de arquitectura -> rojo.
+test('9. el "noMira" de cada rol nombra a los otros tres y nunca a si mismo', () => {
+  assert.ok(
+    ROLES_BRAINSTORM.length > 1,
+    'con menos de dos roles no hay a quien ceder nada: el test no mediria nada'
+  );
+
+  for (const rol of ROLES_BRAINSTORM) {
+    const texto = rol.noMira.join('\n');
+    const nombra = (titulo: string): boolean =>
+      new RegExp(`\\b${titulo}\\b`, 'i').test(texto);
+
+    // Ceder es nombrar a QUIEN se cede. Un "no miras las pruebas" sin
+    // decir de quien son las deja sin dueno: un tema cedido en un solo
+    // sentido se acaba mirando dos veces o ninguna.
+    const sinCeder = ROLES_BRAINSTORM.filter(
+      (otro) => otro.id !== rol.id && !nombra(otro.titulo)
+    ).map((otro) => otro.titulo);
+    assert.deepEqual(
+      sinCeder,
+      [],
+      `"${rol.id}" no cede nada a ${sinCeder.join(', ')} en su "noMira": ` +
+        'sin dueno declarado, ese tema lo cubren todos "por si acaso", que es la ' +
+        'forma barata de deshacer el acotado sin que se note'
+    );
+
+    // Y al reves: cederse trabajo a uno mismo es una contradiccion
+    // dentro del propio rol, y la peticion la lee un agente que no
+    // tiene forma de resolverla.
+    assert.equal(
+      nombra(rol.titulo),
+      false,
+      `"${rol.id}" se nombra a si mismo ("${rol.titulo}") en su "noMira": ` +
+        `${texto}`
+    );
+  }
+});
+
+// Mutacion: dejar `entregables: Object.freeze([])` en un rol, o repetir un titulo -> rojo.
+test('10. ningun campo de texto esta vacio y los titulos son todos distintos', () => {
+  assert.ok(ROLES_BRAINSTORM.length > 0, 'ROLES_BRAINSTORM esta vacia');
+
+  for (const rol of ROLES_BRAINSTORM) {
+    const escalares = [
+      ['id', rol.id],
+      ['titulo', rol.titulo],
+      ['pregunta', rol.pregunta],
+    ] as const;
+    for (const [campo, valor] of escalares) {
+      assert.ok(
+        valor.trim().length > 0,
+        `el rol "${rol.id}" tiene el campo "${campo}" vacio`
+      );
+    }
+
+    const listas = [
+      ['mira', rol.mira],
+      ['noMira', rol.noMira],
+      ['entregables', rol.entregables],
+    ] as const;
+    for (const [campo, lista] of listas) {
+      // Una lista vacia es la forma silenciosa de dejar el rol sin
+      // acotar: el contrato sigue compilando y la peticion sale sin
+      // recorte de contexto, sin cesion o sin formato de salida.
+      assert.ok(
+        lista.length > 0,
+        `el rol "${rol.id}" tiene la lista "${campo}" vacia`
+      );
+      const vacias = lista.filter((linea) => linea.trim().length === 0);
+      assert.deepEqual(
+        vacias,
+        [],
+        `el rol "${rol.id}" tiene ${vacias.length} linea(s) en blanco en "${campo}"`
+      );
+    }
+  }
+
+  // Los titulos van a cabeceras y a nombres de fichero: dos iguales
+  // hacen que la salida de un rol pise la del otro.
+  const titulos = ROLES_BRAINSTORM.map((r) => r.titulo);
+  assert.equal(
+    new Set(titulos).size,
+    titulos.length,
+    `hay titulos repetidos entre los roles: ${titulos.join(', ')}`
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
index 47370c3..fbdcd6b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/state-machine.test.ts
@@ -5,7 +5,7 @@ import {
   resultingState,
   StateMachineError,
 } from '../../src/core/state-machine.js';
-import type { Task } from '../../src/core/task.js';
+import { TASK_COMPLEXITIES, type Task } from '../../src/core/task.js';
 
 function makeTask(overrides: Partial<Task> = {}): Task {
   return {
@@ -145,19 +145,37 @@ test('start: permitido si complejidad media y plan aprobado', () => {
   );
 });
 
-test('start: permitido para trivial/simple aunque plan_aprobado sea false', () => {
-  assert.doesNotThrow(() =>
-    assertTransitionAllowed(
-      'start',
-      makeTask({ estado: 'en-diseno', complejidad: 'trivial', plan_aprobado: false })
-    )
-  );
-  assert.doesNotThrow(() =>
-    assertTransitionAllowed(
-      'start',
-      makeTask({ estado: 'en-diseno', complejidad: 'simple', plan_aprobado: false })
-    )
-  );
+// El test que habia aqui certificaba lo contrario — que `trivial` y
+// `simple` arrancaban sin pasar por "approve" — y se INVIERTE en
+// TASK-016, no se borra: la decision #1 de la seccion 14 ("checkpoint
+// humano siempre obligatorio") estaba tomada y sin aplicar, y un test
+// borrado no deja rastro de cual era la regla vieja ni de por que
+// cambio.
+test('start: NINGUNA complejidad se salta el checkpoint humano (decision #1, TASK-016)', () => {
+  for (const complejidad of TASK_COMPLEXITIES) {
+    const e = throwsStateMachineError(() =>
+      assertTransitionAllowed(
+        'start',
+        makeTask({ estado: 'en-diseno', complejidad, plan_aprobado: false })
+      )
+    );
+    assert.equal(e.comandoRequerido, 'taskctl approve', `complejidad ${complejidad}`);
+  }
+});
+
+// El simetrico, y no es redundante: sin el, romper "start" para que
+// rechazara SIEMPRE dejaria el test de arriba en verde.
+test('start: cualquier complejidad arranca CON plan_aprobado', () => {
+  for (const complejidad of TASK_COMPLEXITIES) {
+    assert.doesNotThrow(
+      () =>
+        assertTransitionAllowed(
+          'start',
+          makeTask({ estado: 'en-diseno', complejidad, plan_aprobado: true })
+        ),
+      `complejidad ${complejidad}`
+    );
+  }
 });
 
 // --- review / codex-review / finish --------------------------------------
````
