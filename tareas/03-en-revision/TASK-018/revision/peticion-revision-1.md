# Peticion de revision — TASK-018 (ronda 1)

- Tarea: TASK-018 — Enrutado de revisor por diff real, fragmentado por dominio
- Rama revisada: feature/task-018-enrutado-de-revisor-por-diff-real-fragme
- Rama base: develop
- Commit revisado (HEAD): b992da83d4fa6d4186e113e28fe84d72cd28d408
- Fecha: 2026-09-12
- Agente revisor sugerido: code-quality-reviewer

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
b992da8 feat(TASK-018): enrutado de revisor por diff real, fragmentado por dominio
9148bd0 chore(TASK-018): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-018/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-018/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-018/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-018/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-018/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md b/tareas/02-en-curso/TASK-018/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-018/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
rename to tareas/02-en-curso/TASK-018/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
diff --git a/tareas/01-en-diseno/TASK-018/planificacion/brainstorm/peticion-brainstorm-testing-1.md b/tareas/02-en-curso/TASK-018/planificacion/brainstorm/peticion-brainstorm-testing-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-018/planificacion/brainstorm/peticion-brainstorm-testing-1.md
rename to tareas/02-en-curso/TASK-018/planificacion/brainstorm/peticion-brainstorm-testing-1.md
diff --git a/tareas/01-en-diseno/TASK-018/planificacion/brainstorm/peticion-unificador-1.md b/tareas/02-en-curso/TASK-018/planificacion/brainstorm/peticion-unificador-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-018/planificacion/brainstorm/peticion-unificador-1.md
rename to tareas/02-en-curso/TASK-018/planificacion/brainstorm/peticion-unificador-1.md
diff --git a/tareas/01-en-diseno/TASK-018/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-018/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-018/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-018/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-018/planificacion/brainstorm/salida-brainstorm-riesgos-1.md b/tareas/02-en-curso/TASK-018/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-018/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
rename to tareas/02-en-curso/TASK-018/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
diff --git a/tareas/01-en-diseno/TASK-018/planificacion/brainstorm/salida-brainstorm-testing-1.md b/tareas/02-en-curso/TASK-018/planificacion/brainstorm/salida-brainstorm-testing-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-018/planificacion/brainstorm/salida-brainstorm-testing-1.md
rename to tareas/02-en-curso/TASK-018/planificacion/brainstorm/salida-brainstorm-testing-1.md
diff --git a/tareas/01-en-diseno/TASK-018/planificacion/plan-final.md b/tareas/02-en-curso/TASK-018/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-018/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-018/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-018/tarea.md b/tareas/02-en-curso/TASK-018/tarea.md
similarity index 81%
rename from tareas/01-en-diseno/TASK-018/tarea.md
rename to tareas/02-en-curso/TASK-018/tarea.md
index caebed9..2fe9b9a 100644
--- a/tareas/01-en-diseno/TASK-018/tarea.md
+++ b/tareas/02-en-curso/TASK-018/tarea.md
@@ -6,7 +6,7 @@ sprint: 3
 etiquetas: []
 complejidad: alta
 modelo_sugerido: opus
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-018-enrutado-de-revisor-por-diff-real-fragme
 asignado_a: charlie.bk@gmail.com
@@ -34,10 +34,10 @@ umbral, y caiga al revisor genérico por encima de él o cuando ningún patrón
 case.
 
 ## Criterios de aceptacion
-- [ ] Clasifica el diff real de la rama por dominio en vez de por el tipo declarado de la tarea.
-- [ ] Fragmenta la revisión en un agente por dominio hasta el umbral (`umbral_dominios: 3`, inclusive: con 3 dominios fragmenta en 3, con 4 o más cae al genérico), y por encima de ese umbral cae a un único revisor genérico.
-- [ ] Cada revisor recibe solo el subconjunto del diff de su dominio.
-- [ ] Ficheros que no casan ningún patrón de dominio, en un diff que sí tiene entre 1 y 3 dominios detectados, los cubre también el revisor genérico — no quedan sin revisar.
-- [ ] Extiende `src/commands/finish.ts` (`INFORME_REVISION_RE`/`ultimoInforme`) y `src/fs/rondas.ts` (`RONDA_FILE_RE`/`siguienteRonda`) para reconocer los N informes de dominio de una ronda fragmentada; `finish` exige que **todos** aprueben antes de cerrar. Sin esto, una tarea con revisión fragmentada queda atascada en `03-en-revision` para siempre.
-- [ ] `ReviewCommandResult` pasa a exponer una lista de pares petición/informe (uno por dominio) en vez de un único par singular; `review.test.ts` se actualiza a la nueva forma.
-- [ ] Tests con diffs sintéticos que cubren un dominio, varios por debajo del umbral, exactamente en el umbral y varios por encima.
+- [x] Clasifica el diff real de la rama por dominio en vez de por el tipo declarado de la tarea.
+- [x] Fragmenta la revisión en un agente por dominio hasta el umbral (`umbral_dominios: 3`, inclusive: con 3 dominios fragmenta en 3, con 4 o más cae al genérico), y por encima de ese umbral cae a un único revisor genérico.
+- [x] Cada revisor recibe solo el subconjunto del diff de su dominio.
+- [x] Ficheros que no casan ningún patrón de dominio, en un diff que sí tiene entre 1 y 3 dominios detectados, los cubre también el revisor genérico — no quedan sin revisar.
+- [x] Extiende `src/commands/finish.ts` (`INFORME_REVISION_RE`/`ultimoInforme`) y `src/fs/rondas.ts` (`RONDA_FILE_RE`/`siguienteRonda`) para reconocer los N informes de dominio de una ronda fragmentada; `finish` exige que **todos** aprueben antes de cerrar. Sin esto, una tarea con revisión fragmentada queda atascada en `03-en-revision` para siempre.
+- [x] `ReviewCommandResult` pasa a exponer una lista de pares petición/informe (uno por dominio) en vez de un único par singular; `review.test.ts` se actualiza a la nueva forma.
+- [x] Tests con diffs sintéticos que cubren un dominio, varios por debajo del umbral, exactamente en el umbral y varios por encima.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
index 0410005..d16f859 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
@@ -428,11 +428,17 @@ export async function main(argv) {
                 repoCwd,
                 scriptsDir: resolveGitflowScriptsDir(),
             });
+            // TASK-018: N pares peticion/informe si el diff se fragmento por
+            // dominio, uno solo (el generico) si no. Se listan todos: quien
+            // orquesta necesita saber cuantos agentes lanzar y con que
+            // peticion cada uno.
+            const lineasInformes = result.informes
+                .map((grupo) => `Peticion de revision (ronda ${result.ronda}, ${grupo.revisor}): ${grupo.peticionPath}\n` +
+                `Lanza ese agente con esa peticion y vuelca su salida en ${grupo.informePath}.\n`)
+                .join('');
             process.stdout.write(`Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
                 `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n` +
-                `Peticion de revision (ronda ${result.ronda}): ${result.peticionPath}\n` +
-                `Lanza el agente revisor con esa peticion y vuelca su salida en ` +
-                `${result.informePath}.\n`);
+                lineasInformes);
             printAutoCommit(result.autoCommit);
             return 0;
         }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js
index 3ef45d8..d183ed9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js
@@ -45,7 +45,16 @@ const MERGEA_A_MAIN = {
     release: true,
 };
 const DEVELOP_BRANCH = 'develop';
-const INFORME_REVISION_RE = /^informe-revision-(\d+)\.md$/;
+/**
+ * TASK-018: una ronda de revision fragmentada por dominio deja N
+ * informes, uno por revisor, con el nombre de la skill como sufijo
+ * (p. ej. `informe-revision-2-java-spring-reviewer.md`). El sufijo es
+ * OPCIONAL a proposito: una ronda sin fragmentar (0 dominios detectados,
+ * o mas del umbral) sigue dejando `informe-revision-<N>.md` sin sufijo,
+ * igual que antes de esta tarea — ninguna tarea ya cerrada, ni ninguna
+ * en curso con revisiones antiguas, deja de reconocerse.
+ */
+const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
 /**
  * true solo si TODAS las lineas "- Veredicto:" del informe aprueban.
@@ -74,43 +83,66 @@ export function veredictoAprobado(informe) {
         return /^aprobada\b/.test(valor);
     });
 }
-/** Contenido del informe con mayor N segun `re`, o null si no hay. */
-async function ultimoInforme(revisionDir, re) {
+/**
+ * Contenidos de TODOS los informes de la ronda con mayor N segun `re`,
+ * o [] si no hay ninguno. Antes de TASK-018 una ronda tenia como mucho
+ * UN informe por convencion (`re` solo casaba ese nombre exacto), asi
+ * que "el de mayor N" y "todos los de mayor N" coincidian; con la
+ * revision fragmentada por dominio una misma ronda puede dejar varios
+ * ficheros con el MISMO N (uno por revisor) y hay que devolverlos
+ * todos, no solo el primero que se encuentre.
+ */
+async function informesDeLaRonda(revisionDir, re) {
     let entries;
     try {
         entries = await readdir(revisionDir);
     }
     catch (e) {
         if (isEnoent(e))
-            return null;
+            return [];
         throw e;
     }
     let max = 0;
-    let elegido = null;
+    let nombres = [];
     for (const entry of entries) {
         const m = re.exec(entry);
-        if (m !== null && Number(m[1]) > max) {
-            max = Number(m[1]);
-            elegido = entry;
+        if (m === null)
+            continue;
+        const n = Number(m[1]);
+        if (n > max) {
+            max = n;
+            nombres = [entry];
+        }
+        else if (n === max) {
+            nombres.push(entry);
         }
     }
-    if (elegido === null)
-        return null;
-    return readFile(path.join(revisionDir, elegido), 'utf8');
+    if (nombres.length === 0)
+        return [];
+    return Promise.all(nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8')));
 }
 /**
  * Contexto de aprobacion para la maquina de estados, derivado de los
  * informes de revision/ de la carpeta de la tarea. La convencion del
  * informe de Codex (informe-codex-<n>.md) la producira TASK-020; leerla
  * ya aqui deja a finish preparado sin acoplarse a ese comando.
+ *
+ * TASK-018: si la ronda de revision primaria se fragmento por dominio,
+ * "aprobada" exige que TODOS los informes de esa ronda aprueben, no solo
+ * uno — fail-closed: que falte AUNQUE SEA UNO de los N (o que su
+ * veredicto siga en PENDIENTE) basta para que la tarea no pueda
+ * cerrarse. El informe de Codex sigue sin fragmentarse (TASK-020 es un
+ * unico agente independiente, no un enrutado por dominio), pero se
+ * reusa la misma funcion: con un solo fichero por ronda el resultado es
+ * identico al de antes de esta tarea.
  */
 async function buildTransitionContext(taskDir) {
     const revisionDir = path.join(taskDir, REVISION_DIRNAME);
-    const informe = await ultimoInforme(revisionDir, INFORME_REVISION_RE);
-    const informeCodex = await ultimoInforme(revisionDir, INFORME_CODEX_RE);
+    const informes = await informesDeLaRonda(revisionDir, INFORME_REVISION_RE);
+    const informesCodex = await informesDeLaRonda(revisionDir, INFORME_CODEX_RE);
     return {
-        revisionPrimariaAprobada: informe !== null && veredictoAprobado(informe),
-        revisionCodexAprobada: informeCodex !== null && veredictoAprobado(informeCodex),
+        revisionPrimariaAprobada: informes.length > 0 && informes.every((i) => veredictoAprobado(i)),
+        revisionCodexAprobada: informesCodex.length > 0 && informesCodex.every((i) => veredictoAprobado(i)),
     };
 }
 /**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js
index 3ca33b6..8f85d01 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js
@@ -23,9 +23,10 @@ import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
 import { siguienteRonda } from '../fs/rondas.js';
 import { fenceFor } from '../core/markdown.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
-import { isWorkspaceClean, currentBranch, resolveBaseBranchForTipo, isAncestor, headCommit, logOneline, diffRange, } from '../fs/git.js';
+import { isWorkspaceClean, currentBranch, resolveBaseBranchForTipo, isAncestor, headCommit, logOneline, diffRange, diffNameOnly, diffRangeForPaths, } from '../fs/git.js';
 import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
+import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
 export class ReviewCommandError extends Error {
 }
 const SCRIPT_BY_TYPE = {
@@ -35,7 +36,18 @@ const SCRIPT_BY_TYPE = {
     release: 'update-release.sh',
 };
 export const REVISION_DIRNAME = 'revision';
-const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)\.md$/;
+/**
+ * Nombre de fichero de una ronda de revision, CON o SIN sufijo de
+ * dominio (TASK-018). El sufijo es el nombre de la skill revisora
+ * (`java-spring-reviewer`, etc.) y solo aparece cuando la ronda se
+ * fragmento por dominio — mismo precedente que
+ * `peticion-brainstorm-<rol>-<ronda>.md` (TASK-016, plan.ts). Una ronda
+ * SIN fragmentar (0 dominios detectados, o mas del umbral) sigue dejando
+ * el nombre de siempre, sin sufijo: es lo que ya prueban 8 de los tests
+ * de review.test.ts y lo que finish.ts ya sabia leer antes de esta
+ * tarea.
+ */
+const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 /**
  * fenceFor se mudo a core/markdown.ts en TASK-016, cuando "plan"
  * empezo a embeber tambien texto de la persona en sus peticiones. Se
@@ -43,7 +55,15 @@ const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)\.md$/;
  * modulo, que es donde nacio.
  */
 export { fenceFor } from '../core/markdown.js';
-export function peticionTemplate(task, baseBranch, commitRevisado, ronda, fecha, commits, diff) {
+/**
+ * `agenteRevisor` y `nombreInforme` (TASK-018) los decide el
+ * clasificador por dominio en runReviewCommand, NO `task.agente_revisor`
+ * del frontmatter: ese era justo el defecto que esta tarea corrige (ver
+ * el Objetivo de tarea.md). `alcanceDiff` es el titulo de la seccion del
+ * diff embebido: "Diff completo" cuando la ronda no se fragmento,
+ * "Diff de tu dominio" (con el recuento de ficheros) cuando si.
+ */
+export function peticionTemplate(task, baseBranch, commitRevisado, ronda, fecha, commits, diff, agenteRevisor, nombreInforme, alcanceDiff) {
     const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
     const diffBlock = diff === '' ? '(sin diferencias respecto a la base)' : diff;
     const fence = fenceFor(commitsBlock, diffBlock);
@@ -53,7 +73,7 @@ export function peticionTemplate(task, baseBranch, commitRevisado, ronda, fecha,
         `- Rama base: ${baseBranch}\n` +
         `- Commit revisado (HEAD): ${commitRevisado}\n` +
         `- Fecha: ${fecha}\n` +
-        `- Agente revisor sugerido: ${task.agente_revisor}\n\n` +
+        `- Agente revisor sugerido: ${agenteRevisor}\n\n` +
         '## Instrucciones para el agente revisor\n\n' +
         'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
         'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
@@ -63,13 +83,13 @@ export function peticionTemplate(task, baseBranch, commitRevisado, ronda, fecha,
         'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
         'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
         'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
-        `informe de esta ronda (informe-revision-${ronda}.md), sin borrar la\n` +
+        `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
         'peticion.\n\n' +
         `## Commits a revisar (git log ${baseBranch}..HEAD)\n\n` +
         `${fence}\n` +
         `${commitsBlock}\n` +
         `${fence}\n\n` +
-        `## Diff completo (git diff ${baseBranch}..HEAD)\n\n` +
+        `## ${alcanceDiff}\n\n` +
         `${fence}diff\n` +
         `${diffBlock}\n` +
         `${fence}\n`);
@@ -139,6 +159,14 @@ export async function runReviewCommand(tareasRoot, argv, today, deps) {
     const commitRevisado = headCommit(deps.repoCwd);
     const commits = logOneline(baseBranch, 'HEAD', deps.repoCwd);
     const diff = diffRange(baseBranch, 'HEAD', deps.repoCwd);
+    // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
+    // el diff real de la rama, no `task.agente_revisor` del frontmatter,
+    // decide quien revisa. El catalogo se relee de skills/*/SKILL.md en
+    // CADA ejecucion (sin cache: HALLAZGOS.md documenta que una copia
+    // congelada de patrones_archivo ya diverguio dos veces).
+    const ficherosTocados = diffNameOnly(baseBranch, 'HEAD', deps.repoCwd);
+    const catalogoRevisores = cargarCatalogoRevisores();
+    const plan = clasificarPorDominio(ficherosTocados, catalogoRevisores);
     const updated = { ...task, estado: 'en-revision', actualizado: today };
     // Peticion + scaffold de informe ANTES de mover la tarea (hallazgo
     // IMPORTANTE de revision por pares, TASK-013): si una escritura
@@ -153,9 +181,35 @@ export async function runReviewCommand(tareasRoot, argv, today, deps) {
     const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
     await mkdir(revisionDir, { recursive: true });
     const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);
+    // Un par de nombres (con o sin sufijo de dominio) por grupo del plan.
+    // Sin fragmentar hay un unico grupo y se usa el nombre de siempre, sin
+    // sufijo: ninguna tarea que solo cae al generico cambia de convencion.
+    const escrituras = plan.grupos.map((grupo) => {
+        const sufijo = plan.fragmentado ? `-${grupo.revisor}` : '';
+        return {
+            revisor: grupo.revisor,
+            ficheros: grupo.ficheros,
+            nombrePeticion: `peticion-revision-${ronda}${sufijo}.md`,
+            nombreInforme: `informe-revision-${ronda}${sufijo}.md`,
+        };
+    });
     try {
-        await writeFile(path.join(revisionDir, `peticion-revision-${ronda}.md`), peticionTemplate(updated, baseBranch, commitRevisado, ronda, today, commits, diff), { encoding: 'utf8', flag: 'wx' });
-        await writeFile(path.join(revisionDir, `informe-revision-${ronda}.md`), informeTemplate(updated, commitRevisado, ronda), { encoding: 'utf8', flag: 'wx' });
+        for (const escritura of escrituras) {
+            // Cada revisor recibe SOLO el subconjunto de su dominio (criterio
+            // de aceptacion 3): un `git diff` filtrado por pathspec, no el
+            // diff entero. Sin fragmentar, el unico grupo ya es "todos los
+            // ficheros" y se reusa el diff completo ya calculado arriba, para
+            // no repetir la misma llamada a Git dos veces.
+            const diffDelGrupo = plan.fragmentado
+                ? diffRangeForPaths(baseBranch, 'HEAD', escritura.ficheros, deps.repoCwd)
+                : diff;
+            const alcanceDiff = plan.fragmentado
+                ? `Diff de tu dominio (${escritura.ficheros.length} fichero(s) de ` +
+                    `${ficherosTocados.length}; git diff ${baseBranch}..HEAD -- <tus ficheros>)`
+                : `Diff completo (git diff ${baseBranch}..HEAD)`;
+            await writeFile(path.join(revisionDir, escritura.nombrePeticion), peticionTemplate(updated, baseBranch, commitRevisado, ronda, today, commits, diffDelGrupo, escritura.revisor, escritura.nombreInforme, alcanceDiff), { encoding: 'utf8', flag: 'wx' });
+            await writeFile(path.join(revisionDir, escritura.nombreInforme), informeTemplate(updated, commitRevisado, ronda), { encoding: 'utf8', flag: 'wx' });
+        }
     }
     catch (e) {
         if (!isEexist(e))
@@ -166,8 +220,12 @@ export async function runReviewCommand(tareasRoot, argv, today, deps) {
     }
     const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
     const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
-    const peticionPath = path.join(newRevisionDir, `peticion-revision-${ronda}.md`);
-    const informePath = path.join(newRevisionDir, `informe-revision-${ronda}.md`);
+    const informes = escrituras.map((escritura) => ({
+        revisor: escritura.revisor,
+        ficheros: escritura.ficheros,
+        peticionPath: path.join(newRevisionDir, escritura.nombrePeticion),
+        informePath: path.join(newRevisionDir, escritura.nombreInforme),
+    }));
     // Paso 5 de la 8.3 (TASK-030, item C2). "review" NO aplica
     // ensureBaseBranchReady, asi que en el arbol puede haber trabajo de
     // la persona junto al de taskctl: solo entran las dos carpetas de la
@@ -188,7 +246,6 @@ export async function runReviewCommand(tareasRoot, argv, today, deps) {
         commitRevisado,
         ronda,
         filePath: newFilePath,
-        peticionPath,
-        informePath,
+        informes,
     };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/revisores.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/revisores.js
new file mode 100644
index 0000000..6dfa160
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/revisores.js
@@ -0,0 +1,227 @@
+/**
+ * Catalogo de revisores por dominio y clasificador de ficheros (TASK-018).
+ *
+ * `taskctl review` invocaba siempre el mismo agente declarado en
+ * `tarea.md` (`agente_revisor`), sin mirar que toca de verdad el diff.
+ * TASK-032 (D6/D7) dejo cuatro skills revisoras con `patrones_archivo`,
+ * `fallback` y `umbral_dominios` declarados en un bloque ```yaml de su
+ * SKILL.md, pero SOLO como texto: el unico lector que existia era el
+ * helper `bloqueYaml()` de test/skills/revisores.test.ts, sin ningun
+ * lector de produccion. Este modulo es ese lector, promovido desde el
+ * test (que ahora importa `extraerBloqueYaml`/`parseBloqueRevisor` de
+ * aqui en vez de llevar su propia copia).
+ *
+ * DOS PIEZAS, a proposito en el mismo fichero pero con responsabilidad
+ * distinta:
+ *
+ * 1. `cargarCatalogoRevisores` — I/O: lee `skills/*` cada vez que se
+ *    llama, SIN CACHE. Ya paso dos veces (angular-vue,
+ *    docs/contexto/HALLAZGOS.md) que una copia congelada de estos
+ *    patrones divergiera de la skill real; releer en cada ejecucion es
+ *    la unica forma de que eso no vuelva a pasar en silencio.
+ * 2. `clasificarPorDominio` — PURA: ficheros -> grupos de revision,
+ *    aplicando el umbral. No toca disco ni Git; se prueba aislada en
+ *    test/core/revisores.test.ts, sin repos temporales.
+ *
+ * Mismo criterio fail-closed que catalogo-skills.ts: un bloque yaml mal
+ * formado en una skill que SI declara `rol: revisor` aborta taskctl
+ * entero, no degrada en silencio al generico.
+ */
+import { readFileSync, readdirSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import { parseBloqueClaveValor } from './frontmatter.js';
+export class CatalogoRevisoresError extends Error {
+    constructor(message) {
+        super(message);
+        this.name = 'CatalogoRevisoresError';
+    }
+}
+function packageRoot() {
+    // dist/src/core/revisores.js -> dist/src/core -> dist/src -> dist -> raiz
+    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+    return path.join(moduleDir, '..', '..', '..');
+}
+/**
+ * Ruta de `skills/`. Mismo patron que resolverRutaCatalogoSkills():
+ * respeta CLAUDE_PLUGIN_ROOT si esta definida; si no, la calcula
+ * relativa al propio modulo compilado.
+ */
+export function resolverRutaSkills() {
+    const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+    if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
+        return path.join(pluginRoot, 'skills');
+    }
+    return path.join(packageRoot(), 'skills');
+}
+/**
+ * Lineas del PRIMER bloque ```yaml del cuerpo de una skill, o null si no
+ * hay ninguno (abierto sin cerrar cuenta como "ninguno": sin un cierre
+ * no hay un bloque que parsear). Promovido tal cual desde el helper
+ * `bloqueYaml()` de test/skills/revisores.test.ts (TASK-018, paso 2 del
+ * orden de construccion): esa era la unica logica de lectura que existia,
+ * y vivia solo en el test.
+ */
+export function extraerBloqueYaml(texto) {
+    const lineas = texto.split(/\r?\n/);
+    const ini = lineas.findIndex((l) => l.trim() === '```yaml');
+    if (ini === -1)
+        return null;
+    const fin = lineas.findIndex((l, i) => i > ini && l.trim() === '```');
+    if (fin === -1)
+        return null;
+    return lineas.slice(ini + 1, fin);
+}
+/**
+ * Parsea las lineas de un bloque yaml de skill con el UNICO parser que
+ * hay en el repo (mismo que frontmatter.ts y catalogo-skills.ts). No
+ * conoce el resto del contrato de una skill revisora (rol, patrones...);
+ * eso lo valida quien llama, con su propio mensaje de error.
+ */
+export function parseBloqueRevisor(lineas, opciones) {
+    const { data } = parseBloqueClaveValor(lineas, 0, {
+        etiqueta: opciones.etiqueta,
+        permitirComentariosDeLinea: true,
+        crearError: opciones.crearError,
+    });
+    return data;
+}
+/**
+ * EL punto de resolucion del catalogo de revisores. Recorre `skillsDir`
+ * (por defecto `resolverRutaSkills()`), y para cada subdirectorio con un
+ * `SKILL.md` que declare un bloque ```yaml con `rol: revisor` decide si
+ * es un revisor DE DOMINIO (tiene `patrones_archivo` no vacio) o EL
+ * generico (`fallback: true`, con `umbral_dominios`).
+ *
+ * Un directorio de skills/ sin SKILL.md, o cuyo SKILL.md no trae ningun
+ * bloque ```yaml con `rol: revisor` (p. ej. `task-workflow/`, que no es
+ * un revisor), simplemente no participa — no es un error, es el caso
+ * normal de una skill que no enruta nada.
+ *
+ * Fail-closed en lo que SI declara ser un revisor: un `patrones_archivo`
+ * que no parsea como lista de texto, mas de un `fallback: true`, o un
+ * `umbral_dominios` que no es un entero >= 1, abortan con
+ * CatalogoRevisoresError. Que NINGUNA skill declare `fallback: true`
+ * tambien aborta: sin un generico no hay adonde caer cuando el diff no
+ * casa ningun dominio, y taskctl review quedaria sin forma de generar
+ * ninguna peticion.
+ */
+export function cargarCatalogoRevisores(skillsDir) {
+    const dir = skillsDir ?? resolverRutaSkills();
+    let entradas;
+    try {
+        entradas = readdirSync(dir).sort();
+    }
+    catch (e) {
+        const msg = e instanceof Error ? e.message : String(e);
+        throw new CatalogoRevisoresError(`[ERROR] No se pudo leer el directorio de skills "${dir}": ${msg}\n` +
+            '        Las skills revisoras las trae el plugin. Reinstalalo, o define\n' +
+            '        CLAUDE_PLUGIN_ROOT apuntando a la raiz del plugin si lo ejecutas desde otro sitio.');
+    }
+    const dominio = [];
+    let generico = null;
+    for (const nombre of entradas) {
+        const rutaSkill = path.join(dir, nombre, 'SKILL.md');
+        let texto;
+        try {
+            texto = readFileSync(rutaSkill, 'utf8');
+        }
+        catch {
+            continue; // no toda carpeta de skills/ trae un SKILL.md legible.
+        }
+        const bloque = extraerBloqueYaml(texto);
+        if (bloque === null)
+            continue; // sin bloque yaml, no es un revisor.
+        const data = parseBloqueRevisor(bloque, {
+            etiqueta: `SKILL.md de ${nombre}`,
+            crearError: (msg) => new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: ${msg}`),
+        });
+        if (data['rol'] !== 'revisor')
+            continue;
+        const patrones = data['patrones_archivo'];
+        if (!Array.isArray(patrones) || !patrones.every((p) => typeof p === 'string')) {
+            throw new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: "patrones_archivo" debe ser una lista de textos entre corchetes ` +
+                `(p. ej. [a, b]), y es ${JSON.stringify(patrones)}.`);
+        }
+        if (data['fallback'] === true) {
+            if (generico !== null) {
+                throw new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: hay mas de un revisor declarado "fallback: true" (el otro es ` +
+                    `"${generico.nombre}"). Solo puede haber uno: si hay dos, no se sabe cual usar cuando ` +
+                    'ningun dominio casa.');
+            }
+            const umbral = data['umbral_dominios'];
+            if (typeof umbral !== 'number' || !Number.isInteger(umbral) || umbral < 1) {
+                throw new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: "umbral_dominios" debe ser un numero entero mayor o igual que 1, ` +
+                    `y es ${JSON.stringify(umbral)}.`);
+            }
+            generico = { nombre, umbralDominios: umbral };
+            continue;
+        }
+        if (patrones.length === 0) {
+            throw new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: declara "rol: revisor" sin "fallback: true" y con ` +
+                '"patrones_archivo" vacio: no se le podria enrutar nada nunca. Si es el revisor ' +
+                'generico, anade "fallback: true" y "umbral_dominios"; si no, dale al menos un patron.');
+        }
+        dominio.push({ nombre, patronesArchivo: patrones });
+    }
+    if (generico === null) {
+        throw new CatalogoRevisoresError(`[ERROR] Ningun revisor bajo "${dir}" se declara "fallback: true". Hace falta exactamente ` +
+            'uno: es el que cubre un diff que no casa ningun dominio, o que casa mas del umbral.');
+    }
+    return { dominio, generico };
+}
+/**
+ * Clasifica `ficheros` (rutas con "/" de Git, tal como las emite
+ * `git diff --name-only`) contra `catalogo`, y decide como se reparte la
+ * revision (TASK-018, criterios de aceptacion 1, 2 y 4). PURA: nada de
+ * I/O aqui, para poder probarla sin repos Git temporales (ver
+ * test/core/revisores.test.ts).
+ *
+ * Regla del umbral, INCLUSIVE (decision de Carlos, 2026-09-12): con
+ * exactamente `umbral_dominios` dominios detectados se fragmenta en esa
+ * cantidad de revisores; con uno mas, cae al generico con el diff/lista
+ * de ficheros completa. Con CERO dominios detectados (nada caso, o el
+ * diff esta vacio) tambien cae al generico — es la misma rama de
+ * "no fragmentar", no un caso aparte.
+ *
+ * Un fichero que no casa NINGUN patron de dominio, y uno que casa MAS DE
+ * UNO (no deberia darse hoy: revisores.test.ts, test 6, exige patrones
+ * sin solape entre las skills de dominio; se deja documentado por si esa
+ * garantia se rompe algun dia) van a la MISMA bolsa: "sin dominio claro".
+ * Si tras clasificar TODOS los ficheros la ronda queda fragmentada (1 a
+ * `umbral_dominios` dominios), esa bolsa la cubre el revisor generico
+ * COMO UN GRUPO MAS — nunca se queda sin revisor (criterio de aceptacion
+ * 4). Si la ronda no se fragmenta, esa distincion no importa: el
+ * generico ya se lleva el diff completo.
+ */
+export function clasificarPorDominio(ficheros, catalogo) {
+    const porDominio = new Map();
+    const sinDominioClaro = [];
+    for (const fichero of ficheros) {
+        const reclamantes = catalogo.dominio.filter((r) => r.patronesArchivo.some((patron) => path.matchesGlob(fichero, patron)));
+        if (reclamantes.length === 1) {
+            const nombre = reclamantes[0].nombre;
+            const lista = porDominio.get(nombre) ?? [];
+            lista.push(fichero);
+            porDominio.set(nombre, lista);
+        }
+        else {
+            sinDominioClaro.push(fichero);
+        }
+    }
+    const numDominios = porDominio.size;
+    if (numDominios === 0 || numDominios > catalogo.generico.umbralDominios) {
+        return {
+            fragmentado: false,
+            grupos: [{ revisor: catalogo.generico.nombre, ficheros }],
+        };
+    }
+    const grupos = [...porDominio.entries()].map(([revisor, fs]) => ({
+        revisor,
+        ficheros: fs,
+    }));
+    if (sinDominioClaro.length > 0) {
+        grupos.push({ revisor: catalogo.generico.nombre, ficheros: sinDominioClaro });
+    }
+    return { fragmentado: true, grupos };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js
index 713c8db..684f45c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js
@@ -266,6 +266,31 @@ export function logOneline(desde, hasta, cwd) {
 export function diffRange(desde, hasta, cwd) {
     return runGit(['diff', `${desde}..${hasta}`], cwd);
 }
+/**
+ * Rutas (con "/" de Git) que cambian entre `desde` y `hasta`, sin el
+ * contenido del diff (TASK-018: es la entrada del clasificador por
+ * dominio de "taskctl review" — clasificar necesita solo los nombres,
+ * no el diff completo). Mismo estilo que lsTreeNames.
+ */
+export function diffNameOnly(desde, hasta, cwd) {
+    return runGit(['diff', '--name-only', `${desde}..${hasta}`], cwd)
+        .split('\n')
+        .filter((line) => line !== '');
+}
+/**
+ * `git diff <desde>..<hasta> -- <paths>`, acotado a un subconjunto de
+ * ficheros (TASK-018): el sub-diff que recibe cada revisor de dominio,
+ * para que "cada revisor recibe solo el subconjunto del diff de su
+ * dominio" (criterio de aceptacion 3) sea un `git diff` filtrado y no el
+ * diff entero con una instruccion de "ignora lo que no sea tuyo". Vacio
+ * si `paths` esta vacio, sin llamar a Git (una peticion sin ficheros no
+ * tiene nada que pedirle).
+ */
+export function diffRangeForPaths(desde, hasta, paths, cwd) {
+    if (paths.length === 0)
+        return '';
+    return runGit(['diff', `${desde}..${hasta}`, '--', ...paths], cwd);
+}
 /**
  * Rutas (con "/" de Git, no separador del SO) de los ficheros bajo
  * `prefix` en el arbol de `ref`, sin tocar el working tree. Lo usa
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js
index c4074d3..33678df 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js
@@ -17,6 +17,15 @@
  * vuelta dentro de review.ts, porque el modulo esta probado y moverlo
  * otra vez no compra nada; pero conviene saber que no es una
  * abstraccion compartida, es la numeracion de rondas de revision.
+ *
+ * TASK-018: una ronda de revision fragmentada por dominio deja VARIOS
+ * ficheros con el MISMO numero de ronda (uno por revisor, con el nombre
+ * de la skill como sufijo — ver RONDA_FILE_RE en commands/review.ts).
+ * Ni `ultimaRonda` ni `siguienteRonda` necesitaron cambiar para eso: ya
+ * recorren TODAS las entradas del directorio y se quedan con el numero
+ * mas alto, sin asumir que cada numero aparece una sola vez — el
+ * patron ya generalizaba. Lo unico que se amplio es el regex que le pasa
+ * el llamador.
  */
 import { readdir } from 'node:fs/promises';
 import { isEnoent, isEnotdir } from './task-store.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 75548a6..8371664 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -477,12 +477,21 @@ export async function main(argv: readonly string[]): Promise<number> {
         repoCwd,
         scriptsDir: resolveGitflowScriptsDir(),
       });
+      // TASK-018: N pares peticion/informe si el diff se fragmento por
+      // dominio, uno solo (el generico) si no. Se listan todos: quien
+      // orquesta necesita saber cuantos agentes lanzar y con que
+      // peticion cada uno.
+      const lineasInformes = result.informes
+        .map(
+          (grupo) =>
+            `Peticion de revision (ronda ${result.ronda}, ${grupo.revisor}): ${grupo.peticionPath}\n` +
+            `Lanza ese agente con esa peticion y vuelca su salida en ${grupo.informePath}.\n`
+        )
+        .join('');
       process.stdout.write(
         `Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
           `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n` +
-          `Peticion de revision (ronda ${result.ronda}): ${result.peticionPath}\n` +
-          `Lanza el agente revisor con esa peticion y vuelca su salida en ` +
-          `${result.informePath}.\n`
+          lineasInformes
       );
       printAutoCommit(result.autoCommit);
       return 0;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 618f7c9..02e21f4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -63,7 +63,16 @@ const MERGEA_A_MAIN: Record<Task['tipo'], boolean> = {
 };
 
 const DEVELOP_BRANCH = 'develop';
-const INFORME_REVISION_RE = /^informe-revision-(\d+)\.md$/;
+/**
+ * TASK-018: una ronda de revision fragmentada por dominio deja N
+ * informes, uno por revisor, con el nombre de la skill como sufijo
+ * (p. ej. `informe-revision-2-java-spring-reviewer.md`). El sufijo es
+ * OPCIONAL a proposito: una ronda sin fragmentar (0 dominios detectados,
+ * o mas del umbral) sigue dejando `informe-revision-<N>.md` sin sufijo,
+ * igual que antes de esta tarea — ninguna tarea ya cerrada, ni ninguna
+ * en curso con revisiones antiguas, deja de reconocerse.
+ */
+const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
 
 /**
@@ -92,26 +101,38 @@ export function veredictoAprobado(informe: string): boolean {
   });
 }
 
-/** Contenido del informe con mayor N segun `re`, o null si no hay. */
-async function ultimoInforme(revisionDir: string, re: RegExp): Promise<string | null> {
+/**
+ * Contenidos de TODOS los informes de la ronda con mayor N segun `re`,
+ * o [] si no hay ninguno. Antes de TASK-018 una ronda tenia como mucho
+ * UN informe por convencion (`re` solo casaba ese nombre exacto), asi
+ * que "el de mayor N" y "todos los de mayor N" coincidian; con la
+ * revision fragmentada por dominio una misma ronda puede dejar varios
+ * ficheros con el MISMO N (uno por revisor) y hay que devolverlos
+ * todos, no solo el primero que se encuentre.
+ */
+async function informesDeLaRonda(revisionDir: string, re: RegExp): Promise<string[]> {
   let entries: string[];
   try {
     entries = await readdir(revisionDir);
   } catch (e: unknown) {
-    if (isEnoent(e)) return null;
+    if (isEnoent(e)) return [];
     throw e;
   }
   let max = 0;
-  let elegido: string | null = null;
+  let nombres: string[] = [];
   for (const entry of entries) {
     const m = re.exec(entry);
-    if (m !== null && Number(m[1]) > max) {
-      max = Number(m[1]);
-      elegido = entry;
+    if (m === null) continue;
+    const n = Number(m[1]);
+    if (n > max) {
+      max = n;
+      nombres = [entry];
+    } else if (n === max) {
+      nombres.push(entry);
     }
   }
-  if (elegido === null) return null;
-  return readFile(path.join(revisionDir, elegido), 'utf8');
+  if (nombres.length === 0) return [];
+  return Promise.all(nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8')));
 }
 
 /**
@@ -119,14 +140,23 @@ async function ultimoInforme(revisionDir: string, re: RegExp): Promise<string |
  * informes de revision/ de la carpeta de la tarea. La convencion del
  * informe de Codex (informe-codex-<n>.md) la producira TASK-020; leerla
  * ya aqui deja a finish preparado sin acoplarse a ese comando.
+ *
+ * TASK-018: si la ronda de revision primaria se fragmento por dominio,
+ * "aprobada" exige que TODOS los informes de esa ronda aprueben, no solo
+ * uno — fail-closed: que falte AUNQUE SEA UNO de los N (o que su
+ * veredicto siga en PENDIENTE) basta para que la tarea no pueda
+ * cerrarse. El informe de Codex sigue sin fragmentarse (TASK-020 es un
+ * unico agente independiente, no un enrutado por dominio), pero se
+ * reusa la misma funcion: con un solo fichero por ronda el resultado es
+ * identico al de antes de esta tarea.
  */
 async function buildTransitionContext(taskDir: string): Promise<TransitionContext> {
   const revisionDir = path.join(taskDir, REVISION_DIRNAME);
-  const informe = await ultimoInforme(revisionDir, INFORME_REVISION_RE);
-  const informeCodex = await ultimoInforme(revisionDir, INFORME_CODEX_RE);
+  const informes = await informesDeLaRonda(revisionDir, INFORME_REVISION_RE);
+  const informesCodex = await informesDeLaRonda(revisionDir, INFORME_CODEX_RE);
   return {
-    revisionPrimariaAprobada: informe !== null && veredictoAprobado(informe),
-    revisionCodexAprobada: informeCodex !== null && veredictoAprobado(informeCodex),
+    revisionPrimariaAprobada: informes.length > 0 && informes.every((i) => veredictoAprobado(i)),
+    revisionCodexAprobada: informesCodex.length > 0 && informesCodex.every((i) => veredictoAprobado(i)),
   };
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 4cd53b5..b554bab 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -32,6 +32,8 @@ import {
   headCommit,
   logOneline,
   diffRange,
+  diffNameOnly,
+  diffRangeForPaths,
 } from '../fs/git.js';
 import {
   autoCommit,
@@ -40,6 +42,7 @@ import {
   type AutoCommitResult,
 } from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
+import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
 
 export class ReviewCommandError extends Error {}
 
@@ -52,7 +55,18 @@ const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
 
 export const REVISION_DIRNAME = 'revision';
 
-const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)\.md$/;
+/**
+ * Nombre de fichero de una ronda de revision, CON o SIN sufijo de
+ * dominio (TASK-018). El sufijo es el nombre de la skill revisora
+ * (`java-spring-reviewer`, etc.) y solo aparece cuando la ronda se
+ * fragmento por dominio — mismo precedente que
+ * `peticion-brainstorm-<rol>-<ronda>.md` (TASK-016, plan.ts). Una ronda
+ * SIN fragmentar (0 dominios detectados, o mas del umbral) sigue dejando
+ * el nombre de siempre, sin sufijo: es lo que ya prueban 8 de los tests
+ * de review.test.ts y lo que finish.ts ya sabia leer antes de esta
+ * tarea.
+ */
+const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
 
 export interface ReviewCommandDeps {
   /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
@@ -61,6 +75,20 @@ export interface ReviewCommandDeps {
   scriptsDir: string;
 }
 
+/**
+ * Un par peticion/informe de una ronda de revision, con el revisor al
+ * que se le asigno (TASK-018). Con la ronda SIN fragmentar hay un unico
+ * elemento con `revisor` igual al nombre del revisor generico.
+ */
+export interface RevisionGrupo {
+  /** Nombre de la skill revisora (de dominio, o el generico). */
+  revisor: string;
+  /** Ficheros del diff que le tocan a este grupo. */
+  ficheros: readonly string[];
+  peticionPath: string;
+  informePath: string;
+}
+
 export interface ReviewCommandResult {
   id: string;
   rama: string;
@@ -69,8 +97,13 @@ export interface ReviewCommandResult {
   commitRevisado: string;
   ronda: number;
   filePath: string;
-  peticionPath: string;
-  informePath: string;
+  /**
+   * Un elemento por revisor que interviene en esta ronda (TASK-018): uno
+   * solo, con el generico, si el diff no se fragmento por dominio; uno
+   * por dominio detectado (mas el generico, si sobran ficheros sin
+   * dominio) si si se fragmento.
+   */
+  informes: readonly RevisionGrupo[];
   /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
   autoCommit: AutoCommitResult;
 }
@@ -83,6 +116,14 @@ export interface ReviewCommandResult {
  */
 export { fenceFor } from '../core/markdown.js';
 
+/**
+ * `agenteRevisor` y `nombreInforme` (TASK-018) los decide el
+ * clasificador por dominio en runReviewCommand, NO `task.agente_revisor`
+ * del frontmatter: ese era justo el defecto que esta tarea corrige (ver
+ * el Objetivo de tarea.md). `alcanceDiff` es el titulo de la seccion del
+ * diff embebido: "Diff completo" cuando la ronda no se fragmento,
+ * "Diff de tu dominio" (con el recuento de ficheros) cuando si.
+ */
 export function peticionTemplate(
   task: Task,
   baseBranch: string,
@@ -90,7 +131,10 @@ export function peticionTemplate(
   ronda: number,
   fecha: string,
   commits: string,
-  diff: string
+  diff: string,
+  agenteRevisor: string,
+  nombreInforme: string,
+  alcanceDiff: string
 ): string {
   const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
   const diffBlock = diff === '' ? '(sin diferencias respecto a la base)' : diff;
@@ -102,7 +146,7 @@ export function peticionTemplate(
     `- Rama base: ${baseBranch}\n` +
     `- Commit revisado (HEAD): ${commitRevisado}\n` +
     `- Fecha: ${fecha}\n` +
-    `- Agente revisor sugerido: ${task.agente_revisor}\n\n` +
+    `- Agente revisor sugerido: ${agenteRevisor}\n\n` +
     '## Instrucciones para el agente revisor\n\n' +
     'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
     'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
@@ -112,13 +156,13 @@ export function peticionTemplate(
     'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
     'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
     'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
-    `informe de esta ronda (informe-revision-${ronda}.md), sin borrar la\n` +
+    `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
     'peticion.\n\n' +
     `## Commits a revisar (git log ${baseBranch}..HEAD)\n\n` +
     `${fence}\n` +
     `${commitsBlock}\n` +
     `${fence}\n\n` +
-    `## Diff completo (git diff ${baseBranch}..HEAD)\n\n` +
+    `## ${alcanceDiff}\n\n` +
     `${fence}diff\n` +
     `${diffBlock}\n` +
     `${fence}\n`
@@ -213,6 +257,15 @@ export async function runReviewCommand(
   const commits = logOneline(baseBranch, 'HEAD', deps.repoCwd);
   const diff = diffRange(baseBranch, 'HEAD', deps.repoCwd);
 
+  // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
+  // el diff real de la rama, no `task.agente_revisor` del frontmatter,
+  // decide quien revisa. El catalogo se relee de skills/*/SKILL.md en
+  // CADA ejecucion (sin cache: HALLAZGOS.md documenta que una copia
+  // congelada de patrones_archivo ya diverguio dos veces).
+  const ficherosTocados = diffNameOnly(baseBranch, 'HEAD', deps.repoCwd);
+  const catalogoRevisores = cargarCatalogoRevisores();
+  const plan = clasificarPorDominio(ficherosTocados, catalogoRevisores);
+
   const updated: Task = { ...task, estado: 'en-revision', actualizado: today };
 
   // Peticion + scaffold de informe ANTES de mover la tarea (hallazgo
@@ -228,17 +281,57 @@ export async function runReviewCommand(
   const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
   await mkdir(revisionDir, { recursive: true });
   const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);
+
+  // Un par de nombres (con o sin sufijo de dominio) por grupo del plan.
+  // Sin fragmentar hay un unico grupo y se usa el nombre de siempre, sin
+  // sufijo: ninguna tarea que solo cae al generico cambia de convencion.
+  const escrituras = plan.grupos.map((grupo) => {
+    const sufijo = plan.fragmentado ? `-${grupo.revisor}` : '';
+    return {
+      revisor: grupo.revisor,
+      ficheros: grupo.ficheros,
+      nombrePeticion: `peticion-revision-${ronda}${sufijo}.md`,
+      nombreInforme: `informe-revision-${ronda}${sufijo}.md`,
+    };
+  });
+
   try {
-    await writeFile(
-      path.join(revisionDir, `peticion-revision-${ronda}.md`),
-      peticionTemplate(updated, baseBranch, commitRevisado, ronda, today, commits, diff),
-      { encoding: 'utf8', flag: 'wx' }
-    );
-    await writeFile(
-      path.join(revisionDir, `informe-revision-${ronda}.md`),
-      informeTemplate(updated, commitRevisado, ronda),
-      { encoding: 'utf8', flag: 'wx' }
-    );
+    for (const escritura of escrituras) {
+      // Cada revisor recibe SOLO el subconjunto de su dominio (criterio
+      // de aceptacion 3): un `git diff` filtrado por pathspec, no el
+      // diff entero. Sin fragmentar, el unico grupo ya es "todos los
+      // ficheros" y se reusa el diff completo ya calculado arriba, para
+      // no repetir la misma llamada a Git dos veces.
+      const diffDelGrupo = plan.fragmentado
+        ? diffRangeForPaths(baseBranch, 'HEAD', escritura.ficheros, deps.repoCwd)
+        : diff;
+      const alcanceDiff = plan.fragmentado
+        ? `Diff de tu dominio (${escritura.ficheros.length} fichero(s) de ` +
+          `${ficherosTocados.length}; git diff ${baseBranch}..HEAD -- <tus ficheros>)`
+        : `Diff completo (git diff ${baseBranch}..HEAD)`;
+
+      await writeFile(
+        path.join(revisionDir, escritura.nombrePeticion),
+        peticionTemplate(
+          updated,
+          baseBranch,
+          commitRevisado,
+          ronda,
+          today,
+          commits,
+          diffDelGrupo,
+          escritura.revisor,
+          escritura.nombreInforme,
+          alcanceDiff
+        ),
+        { encoding: 'utf8', flag: 'wx' }
+      );
+      await writeFile(
+        path.join(revisionDir, escritura.nombreInforme),
+        informeTemplate(updated, commitRevisado, ronda),
+        { encoding: 'utf8', flag: 'wx' }
+      );
+    }
   } catch (e: unknown) {
     if (!isEexist(e)) throw e;
     throw new ReviewCommandError(
@@ -250,8 +343,12 @@ export async function runReviewCommand(
 
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
   const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
-  const peticionPath = path.join(newRevisionDir, `peticion-revision-${ronda}.md`);
-  const informePath = path.join(newRevisionDir, `informe-revision-${ronda}.md`);
+  const informes: RevisionGrupo[] = escrituras.map((escritura) => ({
+    revisor: escritura.revisor,
+    ficheros: escritura.ficheros,
+    peticionPath: path.join(newRevisionDir, escritura.nombrePeticion),
+    informePath: path.join(newRevisionDir, escritura.nombreInforme),
+  }));
 
   // Paso 5 de la 8.3 (TASK-030, item C2). "review" NO aplica
   // ensureBaseBranchReady, asi que en el arbol puede haber trabajo de
@@ -274,7 +371,6 @@ export async function runReviewCommand(
     commitRevisado,
     ronda,
     filePath: newFilePath,
-    peticionPath,
-    informePath,
+    informes,
   };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
new file mode 100644
index 0000000..7e70912
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
@@ -0,0 +1,293 @@
+/**
+ * Catalogo de revisores por dominio y clasificador de ficheros (TASK-018).
+ *
+ * `taskctl review` invocaba siempre el mismo agente declarado en
+ * `tarea.md` (`agente_revisor`), sin mirar que toca de verdad el diff.
+ * TASK-032 (D6/D7) dejo cuatro skills revisoras con `patrones_archivo`,
+ * `fallback` y `umbral_dominios` declarados en un bloque ```yaml de su
+ * SKILL.md, pero SOLO como texto: el unico lector que existia era el
+ * helper `bloqueYaml()` de test/skills/revisores.test.ts, sin ningun
+ * lector de produccion. Este modulo es ese lector, promovido desde el
+ * test (que ahora importa `extraerBloqueYaml`/`parseBloqueRevisor` de
+ * aqui en vez de llevar su propia copia).
+ *
+ * DOS PIEZAS, a proposito en el mismo fichero pero con responsabilidad
+ * distinta:
+ *
+ * 1. `cargarCatalogoRevisores` — I/O: lee `skills/*` cada vez que se
+ *    llama, SIN CACHE. Ya paso dos veces (angular-vue,
+ *    docs/contexto/HALLAZGOS.md) que una copia congelada de estos
+ *    patrones divergiera de la skill real; releer en cada ejecucion es
+ *    la unica forma de que eso no vuelva a pasar en silencio.
+ * 2. `clasificarPorDominio` — PURA: ficheros -> grupos de revision,
+ *    aplicando el umbral. No toca disco ni Git; se prueba aislada en
+ *    test/core/revisores.test.ts, sin repos temporales.
+ *
+ * Mismo criterio fail-closed que catalogo-skills.ts: un bloque yaml mal
+ * formado en una skill que SI declara `rol: revisor` aborta taskctl
+ * entero, no degrada en silencio al generico.
+ */
+import { readFileSync, readdirSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import { parseBloqueClaveValor } from './frontmatter.js';
+
+export class CatalogoRevisoresError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'CatalogoRevisoresError';
+  }
+}
+
+export interface RevisorDeDominio {
+  /** Nombre de la skill, igual al de su directorio bajo skills/. */
+  nombre: string;
+  patronesArchivo: readonly string[];
+}
+
+export interface RevisorGenerico {
+  nombre: string;
+  umbralDominios: number;
+}
+
+export interface CatalogoRevisores {
+  dominio: readonly RevisorDeDominio[];
+  generico: RevisorGenerico;
+}
+
+function packageRoot(): string {
+  // dist/src/core/revisores.js -> dist/src/core -> dist/src -> dist -> raiz
+  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+  return path.join(moduleDir, '..', '..', '..');
+}
+
+/**
+ * Ruta de `skills/`. Mismo patron que resolverRutaCatalogoSkills():
+ * respeta CLAUDE_PLUGIN_ROOT si esta definida; si no, la calcula
+ * relativa al propio modulo compilado.
+ */
+export function resolverRutaSkills(): string {
+  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
+    return path.join(pluginRoot, 'skills');
+  }
+  return path.join(packageRoot(), 'skills');
+}
+
+/**
+ * Lineas del PRIMER bloque ```yaml del cuerpo de una skill, o null si no
+ * hay ninguno (abierto sin cerrar cuenta como "ninguno": sin un cierre
+ * no hay un bloque que parsear). Promovido tal cual desde el helper
+ * `bloqueYaml()` de test/skills/revisores.test.ts (TASK-018, paso 2 del
+ * orden de construccion): esa era la unica logica de lectura que existia,
+ * y vivia solo en el test.
+ */
+export function extraerBloqueYaml(texto: string): string[] | null {
+  const lineas = texto.split(/\r?\n/);
+  const ini = lineas.findIndex((l) => l.trim() === '```yaml');
+  if (ini === -1) return null;
+  const fin = lineas.findIndex((l, i) => i > ini && l.trim() === '```');
+  if (fin === -1) return null;
+  return lineas.slice(ini + 1, fin);
+}
+
+/**
+ * Parsea las lineas de un bloque yaml de skill con el UNICO parser que
+ * hay en el repo (mismo que frontmatter.ts y catalogo-skills.ts). No
+ * conoce el resto del contrato de una skill revisora (rol, patrones...);
+ * eso lo valida quien llama, con su propio mensaje de error.
+ */
+export function parseBloqueRevisor(
+  lineas: readonly string[],
+  opciones: { etiqueta: string; crearError: (mensaje: string) => Error }
+): Record<string, unknown> {
+  const { data } = parseBloqueClaveValor(lineas, 0, {
+    etiqueta: opciones.etiqueta,
+    permitirComentariosDeLinea: true,
+    crearError: opciones.crearError,
+  });
+  return data;
+}
+
+/**
+ * EL punto de resolucion del catalogo de revisores. Recorre `skillsDir`
+ * (por defecto `resolverRutaSkills()`), y para cada subdirectorio con un
+ * `SKILL.md` que declare un bloque ```yaml con `rol: revisor` decide si
+ * es un revisor DE DOMINIO (tiene `patrones_archivo` no vacio) o EL
+ * generico (`fallback: true`, con `umbral_dominios`).
+ *
+ * Un directorio de skills/ sin SKILL.md, o cuyo SKILL.md no trae ningun
+ * bloque ```yaml con `rol: revisor` (p. ej. `task-workflow/`, que no es
+ * un revisor), simplemente no participa — no es un error, es el caso
+ * normal de una skill que no enruta nada.
+ *
+ * Fail-closed en lo que SI declara ser un revisor: un `patrones_archivo`
+ * que no parsea como lista de texto, mas de un `fallback: true`, o un
+ * `umbral_dominios` que no es un entero >= 1, abortan con
+ * CatalogoRevisoresError. Que NINGUNA skill declare `fallback: true`
+ * tambien aborta: sin un generico no hay adonde caer cuando el diff no
+ * casa ningun dominio, y taskctl review quedaria sin forma de generar
+ * ninguna peticion.
+ */
+export function cargarCatalogoRevisores(skillsDir?: string): CatalogoRevisores {
+  const dir = skillsDir ?? resolverRutaSkills();
+  let entradas: string[];
+  try {
+    entradas = readdirSync(dir).sort();
+  } catch (e: unknown) {
+    const msg = e instanceof Error ? e.message : String(e);
+    throw new CatalogoRevisoresError(
+      `[ERROR] No se pudo leer el directorio de skills "${dir}": ${msg}\n` +
+        '        Las skills revisoras las trae el plugin. Reinstalalo, o define\n' +
+        '        CLAUDE_PLUGIN_ROOT apuntando a la raiz del plugin si lo ejecutas desde otro sitio.'
+    );
+  }
+
+  const dominio: RevisorDeDominio[] = [];
+  let generico: RevisorGenerico | null = null;
+
+  for (const nombre of entradas) {
+    const rutaSkill = path.join(dir, nombre, 'SKILL.md');
+    let texto: string;
+    try {
+      texto = readFileSync(rutaSkill, 'utf8');
+    } catch {
+      continue; // no toda carpeta de skills/ trae un SKILL.md legible.
+    }
+
+    const bloque = extraerBloqueYaml(texto);
+    if (bloque === null) continue; // sin bloque yaml, no es un revisor.
+
+    const data = parseBloqueRevisor(bloque, {
+      etiqueta: `SKILL.md de ${nombre}`,
+      crearError: (msg: string) => new CatalogoRevisoresError(`[ERROR] ${rutaSkill}: ${msg}`),
+    });
+
+    if (data['rol'] !== 'revisor') continue;
+
+    const patrones = data['patrones_archivo'];
+    if (!Array.isArray(patrones) || !patrones.every((p) => typeof p === 'string')) {
+      throw new CatalogoRevisoresError(
+        `[ERROR] ${rutaSkill}: "patrones_archivo" debe ser una lista de textos entre corchetes ` +
+          `(p. ej. [a, b]), y es ${JSON.stringify(patrones)}.`
+      );
+    }
+
+    if (data['fallback'] === true) {
+      if (generico !== null) {
+        throw new CatalogoRevisoresError(
+          `[ERROR] ${rutaSkill}: hay mas de un revisor declarado "fallback: true" (el otro es ` +
+            `"${generico.nombre}"). Solo puede haber uno: si hay dos, no se sabe cual usar cuando ` +
+            'ningun dominio casa.'
+        );
+      }
+      const umbral = data['umbral_dominios'];
+      if (typeof umbral !== 'number' || !Number.isInteger(umbral) || umbral < 1) {
+        throw new CatalogoRevisoresError(
+          `[ERROR] ${rutaSkill}: "umbral_dominios" debe ser un numero entero mayor o igual que 1, ` +
+            `y es ${JSON.stringify(umbral)}.`
+        );
+      }
+      generico = { nombre, umbralDominios: umbral };
+      continue;
+    }
+
+    if (patrones.length === 0) {
+      throw new CatalogoRevisoresError(
+        `[ERROR] ${rutaSkill}: declara "rol: revisor" sin "fallback: true" y con ` +
+          '"patrones_archivo" vacio: no se le podria enrutar nada nunca. Si es el revisor ' +
+          'generico, anade "fallback: true" y "umbral_dominios"; si no, dale al menos un patron.'
+      );
+    }
+    dominio.push({ nombre, patronesArchivo: patrones });
+  }
+
+  if (generico === null) {
+    throw new CatalogoRevisoresError(
+      `[ERROR] Ningun revisor bajo "${dir}" se declara "fallback: true". Hace falta exactamente ` +
+        'uno: es el que cubre un diff que no casa ningun dominio, o que casa mas del umbral.'
+    );
+  }
+
+  return { dominio, generico };
+}
+
+export interface GrupoDeRevision {
+  /** Nombre de la skill que revisa este grupo (de dominio, o el generico). */
+  revisor: string;
+  ficheros: readonly string[];
+}
+
+export interface PlanDeRevision {
+  /**
+   * true si el diff se fragmenta en un grupo por dominio (mas, si sobran
+   * ficheros sin dominio, el generico ademas). false si cae a un unico
+   * grupo generico con TODOS los ficheros — porque ningun dominio caso,
+   * o porque casaron mas de `umbral_dominios`.
+   */
+  fragmentado: boolean;
+  grupos: readonly GrupoDeRevision[];
+}
+
+/**
+ * Clasifica `ficheros` (rutas con "/" de Git, tal como las emite
+ * `git diff --name-only`) contra `catalogo`, y decide como se reparte la
+ * revision (TASK-018, criterios de aceptacion 1, 2 y 4). PURA: nada de
+ * I/O aqui, para poder probarla sin repos Git temporales (ver
+ * test/core/revisores.test.ts).
+ *
+ * Regla del umbral, INCLUSIVE (decision de Carlos, 2026-09-12): con
+ * exactamente `umbral_dominios` dominios detectados se fragmenta en esa
+ * cantidad de revisores; con uno mas, cae al generico con el diff/lista
+ * de ficheros completa. Con CERO dominios detectados (nada caso, o el
+ * diff esta vacio) tambien cae al generico — es la misma rama de
+ * "no fragmentar", no un caso aparte.
+ *
+ * Un fichero que no casa NINGUN patron de dominio, y uno que casa MAS DE
+ * UNO (no deberia darse hoy: revisores.test.ts, test 6, exige patrones
+ * sin solape entre las skills de dominio; se deja documentado por si esa
+ * garantia se rompe algun dia) van a la MISMA bolsa: "sin dominio claro".
+ * Si tras clasificar TODOS los ficheros la ronda queda fragmentada (1 a
+ * `umbral_dominios` dominios), esa bolsa la cubre el revisor generico
+ * COMO UN GRUPO MAS — nunca se queda sin revisor (criterio de aceptacion
+ * 4). Si la ronda no se fragmenta, esa distincion no importa: el
+ * generico ya se lleva el diff completo.
+ */
+export function clasificarPorDominio(
+  ficheros: readonly string[],
+  catalogo: CatalogoRevisores
+): PlanDeRevision {
+  const porDominio = new Map<string, string[]>();
+  const sinDominioClaro: string[] = [];
+
+  for (const fichero of ficheros) {
+    const reclamantes = catalogo.dominio.filter((r) =>
+      r.patronesArchivo.some((patron) => path.matchesGlob(fichero, patron))
+    );
+    if (reclamantes.length === 1) {
+      const nombre = (reclamantes[0] as RevisorDeDominio).nombre;
+      const lista = porDominio.get(nombre) ?? [];
+      lista.push(fichero);
+      porDominio.set(nombre, lista);
+    } else {
+      sinDominioClaro.push(fichero);
+    }
+  }
+
+  const numDominios = porDominio.size;
+  if (numDominios === 0 || numDominios > catalogo.generico.umbralDominios) {
+    return {
+      fragmentado: false,
+      grupos: [{ revisor: catalogo.generico.nombre, ficheros }],
+    };
+  }
+
+  const grupos: GrupoDeRevision[] = [...porDominio.entries()].map(([revisor, fs]) => ({
+    revisor,
+    ficheros: fs,
+  }));
+  if (sinDominioClaro.length > 0) {
+    grupos.push({ revisor: catalogo.generico.nombre, ficheros: sinDominioClaro });
+  }
+  return { fragmentado: true, grupos };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index a80a60b..1412afe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -276,6 +276,37 @@ export function diffRange(desde: string, hasta: string, cwd: string): string {
   return runGit(['diff', `${desde}..${hasta}`], cwd);
 }
 
+/**
+ * Rutas (con "/" de Git) que cambian entre `desde` y `hasta`, sin el
+ * contenido del diff (TASK-018: es la entrada del clasificador por
+ * dominio de "taskctl review" — clasificar necesita solo los nombres,
+ * no el diff completo). Mismo estilo que lsTreeNames.
+ */
+export function diffNameOnly(desde: string, hasta: string, cwd: string): string[] {
+  return runGit(['diff', '--name-only', `${desde}..${hasta}`], cwd)
+    .split('\n')
+    .filter((line) => line !== '');
+}
+
+/**
+ * `git diff <desde>..<hasta> -- <paths>`, acotado a un subconjunto de
+ * ficheros (TASK-018): el sub-diff que recibe cada revisor de dominio,
+ * para que "cada revisor recibe solo el subconjunto del diff de su
+ * dominio" (criterio de aceptacion 3) sea un `git diff` filtrado y no el
+ * diff entero con una instruccion de "ignora lo que no sea tuyo". Vacio
+ * si `paths` esta vacio, sin llamar a Git (una peticion sin ficheros no
+ * tiene nada que pedirle).
+ */
+export function diffRangeForPaths(
+  desde: string,
+  hasta: string,
+  paths: readonly string[],
+  cwd: string
+): string {
+  if (paths.length === 0) return '';
+  return runGit(['diff', `${desde}..${hasta}`, '--', ...paths], cwd);
+}
+
 /**
  * Rutas (con "/" de Git, no separador del SO) de los ficheros bajo
  * `prefix` en el arbol de `ref`, sin tocar el working tree. Lo usa
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
index da6186b..c2eedd3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -17,6 +17,15 @@
  * vuelta dentro de review.ts, porque el modulo esta probado y moverlo
  * otra vez no compra nada; pero conviene saber que no es una
  * abstraccion compartida, es la numeracion de rondas de revision.
+ *
+ * TASK-018: una ronda de revision fragmentada por dominio deja VARIOS
+ * ficheros con el MISMO numero de ronda (uno por revisor, con el nombre
+ * de la skill como sufijo — ver RONDA_FILE_RE en commands/review.ts).
+ * Ni `ultimaRonda` ni `siguienteRonda` necesitaron cambiar para eso: ya
+ * recorren TODAS las entradas del directorio y se quedan con el numero
+ * mas alto, sin asumir que cada numero aparece una sola vez — el
+ * patron ya generalizaba. Lo unico que se amplio es el regex que le pasa
+ * el llamador.
  */
 import { readdir } from 'node:fs/promises';
 import { isEnoent, isEnotdir } from './task-store.js';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
index 40ad491..3bc270c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish.test.ts
@@ -605,6 +605,61 @@ test('taskctl finish: si el script falla, la tarea no se mueve ni se renderiza n
   });
 });
 
+test('taskctl finish: una ronda fragmentada por dominio (N informes) exige que TODOS aprueben antes de cerrar (TASK-018)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-720', rama: 'feature/task-720-fragmentada' });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish con revision fragmentada.\n');
+    await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
+    const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+    await mkdir(revisionDir, { recursive: true });
+    // Misma ronda (1), dos revisores de dominio: uno aprueba, el otro
+    // sigue con el veredicto de la plantilla sin sustituir.
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-java-spring-reviewer.md'),
+      `# Informe de revision — ${task.id} (ronda 1)\n\n${VEREDICTO_APROBADO}`,
+      'utf8'
+    );
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'),
+      `# Informe de revision — ${task.id} (ronda 1)\n\n` +
+        '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados")\n',
+      'utf8'
+    );
+    commitAll(repoRoot, `feat(${task.id}): revision fragmentada, un dominio pendiente`);
+
+    // Con un informe de dominio todavia PENDIENTE, "finish" rechaza —
+    // aunque el otro informe de la MISMA ronda ya apruebe.
+    await assert.rejects(
+      () =>
+        runFinishCommand(tareasRoot, [task.id], '2026-09-12', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      StateMachineError
+    );
+    assert.doesNotMatch(git(['log', '--oneline', 'develop'], repoRoot), /merge\(feature\)/);
+    const tras1 = await readTareaFile(tareasRoot, task.id);
+    assert.equal(tras1?.task.estado, 'en-revision');
+
+    // Se aprueba el que faltaba (misma ronda, mismo N): ahora SI cierra.
+    await writeFile(
+      path.join(revisionDir, 'informe-revision-1-angular-vue-reviewer.md'),
+      `# Informe de revision — ${task.id} (ronda 1)\n\n${VEREDICTO_APROBADO}`,
+      'utf8'
+    );
+    commitAll(repoRoot, 'segundo informe de dominio tambien aprobado');
+
+    const result = await runFinishCommand(tareasRoot, [task.id], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.match(result.filePath, /04-terminadas[/\\]TASK-720/);
+    const tras2 = await readTareaFile(tareasRoot, task.id);
+    assert.equal(tras2?.task.estado, 'terminada');
+  });
+});
+
 test('taskctl finish: dos tareas terminadas acumulan entradas en CHANGELOG e INDEX sin pisarse', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     const t1 = sampleTask({ id: 'TASK-710', rama: 'feature/task-710-una' });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
index ece8858..f3d7ba0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review.test.ts
@@ -102,6 +102,45 @@ async function advanceDevelop(repoRoot: string, volverA: string): Promise<void>
   git(['checkout', '-q', volverA], repoRoot);
 }
 
+/**
+ * Escribe un fichero bajo `repoRoot/ruta` (con "/" de Git), creando los
+ * directorios que hagan falta. Para las pruebas de clasificacion por
+ * dominio (TASK-018): las rutas se eligen IGUAL que las de
+ * test/skills/revisores.test.ts (RUTAS_LEGITIMAS/RUTAS_AJENAS), para no
+ * inventar una segunda tabla de "que ruta cae en que dominio" que pueda
+ * divergir de la que ese fichero ya prueba contra las skills reales.
+ */
+async function escribirFichero(repoRoot: string, ruta: string, contenido: string): Promise<void> {
+  const destino = path.join(repoRoot, ...ruta.split('/'));
+  await mkdir(path.dirname(destino), { recursive: true });
+  await writeFile(destino, contenido, 'utf8');
+}
+
+/**
+ * Ruta (con "/" de Git) de tarea.md tal como queda en la rama de una
+ * tarea en-curso. A diferencia de setupTaskEnCurso, esta variante NO
+ * anade "trabajo.txt": las pruebas de clasificacion por dominio
+ * (TASK-018) necesitan controlar EXACTAMENTE que ficheros trae el diff,
+ * y tarea.md es el UNICO que no se puede evitar (toda tarea necesita su
+ * frontmatter commiteado en la rama para que el resto del ciclo
+ * funcione) — se deja como el unico "ruido" de fondo, documentado en
+ * cada test que lo necesita.
+ */
+function rutaTareaMd(id: string): string {
+  return `tareas/02-en-curso/${id}/tarea.md`;
+}
+
+/** Como setupTaskEnCurso, pero sin escribir "trabajo.txt". */
+async function setupTaskEnCursoSoloTarea(
+  repoRoot: string,
+  tareasRoot: string,
+  task: Task
+): Promise<void> {
+  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el enrutado por dominio.\n');
+  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
+}
+
 test('taskctl review: camino feliz sin origin — update real, evidencia de merge, mueve a 03-en-revision y genera peticion + informe', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     const task = sampleTask();
@@ -139,7 +178,7 @@ test('taskctl review: camino feliz sin origin — update real, evidencia de merg
 
     // La peticion contiene el diff real (el cambio que vino de develop
     // y el trabajo de la rama) y el SHA revisado.
-    const peticion = await readFile(result.peticionPath, 'utf8');
+    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
     assert.doesNotMatch(peticion, /cambio-develop\.txt/);
     assert.match(peticion, /trabajo\.txt/);
     assert.ok(peticion.includes(result.commitRevisado));
@@ -155,7 +194,7 @@ test('taskctl review: camino feliz sin origin — update real, evidencia de merg
       'chore(TASK-600): peticion de revision ronda 1'
     );
 
-    const informe = await readFile(result.informePath, 'utf8');
+    const informe = await readFile(result.informes[0]!.informePath, 'utf8');
     assert.match(informe, /Informe de revision — TASK-600 \(ronda 1\)/);
     assert.match(informe, /PENDIENTE/);
   });
@@ -192,7 +231,7 @@ test('taskctl review: con origin (bare real) integra un cambio que solo existia
       await stat(path.join(repoRoot, 'remoto.txt'));
       const log = git(['log', '--oneline'], repoRoot);
       assert.match(log, /update\(feature\): develop -> feature\/task-601-con-origin/);
-      const peticion = await readFile(result.peticionPath, 'utf8');
+      const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
       assert.doesNotMatch(peticion, /remoto\.txt/);
       const read = await readTareaFile(tareasRoot, 'TASK-601');
       assert.equal(read?.task.estado, 'en-revision');
@@ -340,7 +379,7 @@ test('taskctl review: una segunda ronda numera peticion e informe como -2 sin pi
     });
 
     assert.equal(result.ronda, 2);
-    assert.match(result.peticionPath, /peticion-revision-2\.md$/);
+    assert.match(result.informes[0]!.peticionPath, /peticion-revision-2\.md$/);
     // La ronda anterior sigue intacta (se movio con la carpeta).
     const anterior = await readFile(
       path.join(tareasRoot, '03-en-revision', 'TASK-600', 'revision', 'peticion-revision-1.md'),
@@ -369,7 +408,7 @@ test('taskctl review: un diff mayor que 1 MB no revienta el comando (hallazgo IM
       scriptsDir: SCRIPTS_DIR,
     });
 
-    const peticion = await readFile(result.peticionPath, 'utf8');
+    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
     assert.match(peticion, /generado-grande\.txt/);
     assert.ok(peticion.length > 1024 * 1024, 'la peticion deberia contener el diff completo');
   });
@@ -431,11 +470,212 @@ test('taskctl review: un diff cuyo contexto contiene vallas de backticks no romp
 
     // La valla elegida supera a la mas larga del contenido embebido:
     // el bloque del diff no puede cerrarse antes de tiempo.
-    const peticion = await readFile(result.peticionPath, 'utf8');
+    const peticion = await readFile(result.informes[0]!.peticionPath, 'utf8');
     assert.match(peticion, /`````diff/);
   });
 });
 
+// --- TASK-018: enrutado de revisor por diff real, fragmentado por dominio ---
+//
+// Las rutas de fichero de estos tests se copian EXACTAMENTE de las tablas
+// RUTAS_LEGITIMAS/RUTAS_AJENAS de test/skills/revisores.test.ts: esas ya
+// prueban a que revisor (o a ninguno) llega cada ruta contra las skills
+// reales instaladas con el plugin. Repetir aqui esa clasificacion con
+// rutas propias abriria una segunda fuente de verdad que podria divergir
+// de la primera; reusar las mismas rutas cierra esa grieta.
+
+test('taskctl review: un diff que toca 1 dominio (java) genera 1 peticion con el agente de ese dominio, no task.agente_revisor', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-620', rama: 'feature/task-620-un-dominio' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {}\n'
+    );
+    commitAll(repoRoot, 'anade servicio Java');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-620'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // tarea.md tambien esta en el diff (toda tarea lo commitea en su
+    // rama) y no casa ningun dominio: le toca al generico, ademas del
+    // grupo de dominio — el mismo criterio de aceptacion 4, no un caso
+    // aparte.
+    assert.equal(result.informes.length, 2);
+    const grupo = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
+    assert.ok(grupo !== undefined, 'deberia haber un grupo para java-spring-reviewer');
+    assert.notEqual(grupo.revisor, task.agente_revisor);
+    assert.match(grupo.peticionPath, /peticion-revision-1-java-spring-reviewer\.md$/);
+    assert.match(grupo.informePath, /informe-revision-1-java-spring-reviewer\.md$/);
+    assert.deepEqual(grupo.ficheros, ['src/main/java/com/acme/UserService.java']);
+
+    const peticion = await readFile(grupo.peticionPath, 'utf8');
+    assert.match(peticion, /Agente revisor sugerido: java-spring-reviewer/);
+    assert.match(peticion, /UserService\.java/);
+    assert.doesNotMatch(peticion, /tarea\.md/);
+
+    const generico = result.informes.find((g) => g.revisor === 'code-quality-reviewer')!;
+    assert.deepEqual(generico.ficheros, [rutaTareaMd('TASK-620')]);
+  });
+});
+
+test('taskctl review: un diff que toca 2 dominios bajo el umbral genera 2 peticiones, cada una solo con los ficheros de su dominio', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-621', rama: 'feature/task-621-dos-dominios' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {}\n'
+    );
+    await escribirFichero(
+      repoRoot,
+      'src/app/user-profile/user-profile.component.ts',
+      'export class UserProfileComponent {}\n'
+    );
+    commitAll(repoRoot, 'anade servicio Java y componente Angular');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-621'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // 2 grupos de dominio + el generico para tarea.md (que no casa
+    // ningun dominio, ver el test anterior).
+    assert.equal(result.informes.length, 3);
+    const revisores = result.informes.map((g) => g.revisor).sort();
+    assert.deepEqual(revisores, [
+      'angular-vue-reviewer',
+      'code-quality-reviewer',
+      'java-spring-reviewer',
+    ]);
+
+    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer')!;
+    const grupoAngular = result.informes.find((g) => g.revisor === 'angular-vue-reviewer')!;
+    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer')!;
+
+    assert.deepEqual(grupoJava.ficheros, ['src/main/java/com/acme/UserService.java']);
+    assert.deepEqual(grupoAngular.ficheros, ['src/app/user-profile/user-profile.component.ts']);
+    assert.deepEqual(grupoGenerico.ficheros, [rutaTareaMd('TASK-621')]);
+
+    const peticionJava = await readFile(grupoJava.peticionPath, 'utf8');
+    assert.match(peticionJava, /UserService\.java/);
+    assert.doesNotMatch(peticionJava, /user-profile\.component\.ts/);
+
+    const peticionAngular = await readFile(grupoAngular.peticionPath, 'utf8');
+    assert.match(peticionAngular, /user-profile\.component\.ts/);
+    assert.doesNotMatch(peticionAngular, /UserService\.java/);
+  });
+});
+
+test('taskctl review: un diff que toca EXACTAMENTE 3 dominios sigue fragmentando en 3 (umbral inclusive)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-622', rama: 'feature/task-622-tres-dominios' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {}\n'
+    );
+    await escribirFichero(
+      repoRoot,
+      'src/app/user-profile/user-profile.component.ts',
+      'export class UserProfileComponent {}\n'
+    );
+    await escribirFichero(repoRoot, 'src/Exporter/IfcExporter.cs', 'class IfcExporter {}\n');
+    commitAll(repoRoot, 'toca los tres dominios de una vez');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-622'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    // Con el catalogo real (3 revisores de dominio, umbral_dominios: 3),
+    // exactamente 3 dominios SIGUE fragmentando: no cae al generico. Los
+    // 3 dominios detectados (lo que fija el criterio del umbral) mas el
+    // generico para tarea.md, que sigue sin casar ningun dominio.
+    assert.equal(result.informes.length, 4);
+    const revisores = result.informes.map((g) => g.revisor).sort();
+    assert.deepEqual(revisores, [
+      'angular-vue-reviewer',
+      'code-quality-reviewer',
+      'csharp-autocad-ifc-reviewer',
+      'java-spring-reviewer',
+    ]);
+    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer')!;
+    assert.deepEqual(grupoGenerico.ficheros, [rutaTareaMd('TASK-622')]);
+  });
+});
+
+test('taskctl review: ficheros que no casan ningun dominio, con 1-3 dominios ya detectados, los cubre TAMBIEN el generico', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-623', rama: 'feature/task-623-mas-generico' });
+    await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+    await escribirFichero(
+      repoRoot,
+      'src/main/java/com/acme/UserService.java',
+      'class UserService {}\n'
+    );
+    // Ruta ajena congelada en RUTAS_AJENAS (revisores.test.ts): no casa
+    // con ningun revisor de dominio, igual que tarea.md.
+    await escribirFichero(repoRoot, 'src/index.ts', 'export const arranque = 1;\n');
+    commitAll(repoRoot, 'servicio Java mas un fichero sin dominio');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-623'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.informes.length, 2);
+    const grupoJava = result.informes.find((g) => g.revisor === 'java-spring-reviewer');
+    const grupoGenerico = result.informes.find((g) => g.revisor === 'code-quality-reviewer');
+    assert.ok(grupoJava !== undefined, 'el fichero Java deberia tener su propio grupo');
+    assert.ok(
+      grupoGenerico !== undefined,
+      'los ficheros sin dominio (src/index.ts, tarea.md) deberian cubrirlos el generico, sin quedar sin revisor'
+    );
+    assert.deepEqual(grupoJava!.ficheros, ['src/main/java/com/acme/UserService.java']);
+    assert.deepEqual(
+      [...grupoGenerico!.ficheros].sort(),
+      [rutaTareaMd('TASK-623'), 'src/index.ts'].sort()
+    );
+
+    const peticionGenerico = await readFile(grupoGenerico!.peticionPath, 'utf8');
+    assert.match(peticionGenerico, /src\/index\.ts/);
+    assert.doesNotMatch(peticionGenerico, /UserService\.java/);
+  });
+});
+
+test('taskctl review: un diff sin match de dominio (rutas ajenas y .md) sigue cayendo a un unico generico, igual que antes de TASK-018', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-624', rama: 'feature/task-624-sin-dominio' });
+    await setupTaskEnCurso(repoRoot, tareasRoot, task);
+    // NestJS: ruta congelada como ajena en RUTAS_AJENAS.
+    await escribirFichero(repoRoot, 'src/users/users.module.ts', 'export class UsersModule {}\n');
+    await escribirFichero(repoRoot, 'docs/nota.md', '# nota\n');
+    commitAll(repoRoot, 'ficheros sin ningun dominio');
+    await advanceDevelop(repoRoot, task.rama);
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-624'], '2026-09-12', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.informes.length, 1);
+    assert.equal(result.informes[0]!.revisor, 'code-quality-reviewer');
+    // Sin sufijo de dominio: la convencion de siempre, sin fragmentar.
+    assert.match(result.informes[0]!.peticionPath, /peticion-revision-1\.md$/);
+    assert.match(result.informes[0]!.informePath, /informe-revision-1\.md$/);
+  });
+});
+
 test('taskctl review: error claro si falta el ID o la tarea no existe', async () => {
   await withTempRepo(async (repoRoot, tareasRoot) => {
     await assert.rejects(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/revisores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/revisores.test.ts
new file mode 100644
index 0000000..ed3fef9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/revisores.test.ts
@@ -0,0 +1,312 @@
+/**
+ * Tests de src/core/revisores.ts (TASK-018): el loader de
+ * `patrones_archivo`/`fallback`/`umbral_dominios` y la funcion pura
+ * ficheros -> dominios que aplica el umbral.
+ *
+ * Dos capas, deliberadamente separadas (arquitectura lo pidio asi en su
+ * salida de brainstorm, ver planificacion/):
+ *
+ * - `cargarCatalogoRevisores` SI toca disco, pero nunca Git: se prueba
+ *   contra las skills REALES del plugin (recursos reales, no mocks) y
+ *   contra fixtures sinteticas en un directorio temporal para los casos
+ *   fail-closed que las skills reales no pueden ejercitar (dos
+ *   "fallback: true", un "umbral_dominios" invalido...).
+ * - `clasificarPorDominio` es PURA: cero I/O, se prueba con catalogos
+ *   sinteticos construidos a mano. Aqui viven en concreto los limites
+ *   del umbral que el catalogo real no puede ejercitar hoy (el propio
+ *   skills/code-quality-reviewer/SKILL.md lo dice: con solo tres
+ *   revisores de dominio instalados, "mas de tres dominios" es teorico)
+ *   — 4 dominios sinteticos lo hacen posible sin inventar una skill que
+ *   no existe.
+ *
+ * El caso de 1, 2 y exactamente 3 dominios REALES (con las skills que de
+ * verdad trae el plugin) se prueba end-to-end, con diffs de un repo Git
+ * temporal, en test/commands/review.test.ts — aqui no se repite.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import {
+  cargarCatalogoRevisores,
+  clasificarPorDominio,
+  CatalogoRevisoresError,
+  type CatalogoRevisores,
+} from '../../src/core/revisores.js';
+
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
+const SKILLS_DIR_REAL = path.join(PLUGIN_ROOT, 'skills');
+
+// --- cargarCatalogoRevisores, contra las skills reales -------------------
+
+test('cargarCatalogoRevisores: lee las skills reales del plugin (3 de dominio + 1 generico con umbral 3)', () => {
+  const catalogo = cargarCatalogoRevisores(SKILLS_DIR_REAL);
+  const nombres = catalogo.dominio.map((r) => r.nombre).sort();
+  assert.deepEqual(nombres, [
+    'angular-vue-reviewer',
+    'csharp-autocad-ifc-reviewer',
+    'java-spring-reviewer',
+  ]);
+  for (const revisor of catalogo.dominio) {
+    assert.ok(revisor.patronesArchivo.length > 0, `${revisor.nombre}: sin patrones`);
+  }
+  assert.equal(catalogo.generico.nombre, 'code-quality-reviewer');
+  assert.equal(catalogo.generico.umbralDominios, 3);
+});
+
+test('cargarCatalogoRevisores: relee el disco en cada llamada, sin cache (no diverge si una skill cambia)', async () => {
+  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
+  try {
+    await escribirSkillDominio(tmp, 'demo-reviewer', ['**/*.demo']);
+    await escribirSkillGenerica(tmp, 'generico', 3);
+
+    const primero = cargarCatalogoRevisores(tmp);
+    assert.deepEqual(primero.dominio[0]!.patronesArchivo, ['**/*.demo']);
+
+    // Se reescribe la skill con un patron distinto SIN reiniciar nada:
+    // si cargarCatalogoRevisores cacheara u operara sobre una copia,
+    // esta segunda llamada seguiria viendo el patron viejo.
+    await escribirSkillDominio(tmp, 'demo-reviewer', ['**/*.otro']);
+    const segundo = cargarCatalogoRevisores(tmp);
+    assert.deepEqual(segundo.dominio[0]!.patronesArchivo, ['**/*.otro']);
+  } finally {
+    await rm(tmp, { recursive: true, force: true });
+  }
+});
+
+// --- cargarCatalogoRevisores, fail-closed con fixtures sinteticas --------
+
+async function escribirSkillDominio(
+  skillsDir: string,
+  nombre: string,
+  patrones: string[],
+  extra = ''
+): Promise<void> {
+  const dir = path.join(skillsDir, nombre);
+  await mkdir(dir, { recursive: true });
+  await writeFile(
+    path.join(dir, 'SKILL.md'),
+    `---\nname: ${nombre}\ndescription: skill de prueba\n---\n\n` +
+      '```yaml\n' +
+      `rol: revisor\n` +
+      `patrones_archivo: [${patrones.map((p) => `"${p}"`).join(', ')}]\n` +
+      `${extra}` +
+      '```\n',
+    'utf8'
+  );
+}
+
+async function escribirSkillGenerica(
+  skillsDir: string,
+  nombre: string,
+  umbral: number | string
+): Promise<void> {
+  const dir = path.join(skillsDir, nombre);
+  await mkdir(dir, { recursive: true });
+  await writeFile(
+    path.join(dir, 'SKILL.md'),
+    `---\nname: ${nombre}\ndescription: skill generica de prueba\n---\n\n` +
+      '```yaml\n' +
+      'rol: revisor\n' +
+      'patrones_archivo: []\n' +
+      'fallback: true\n' +
+      `umbral_dominios: ${umbral}\n` +
+      '```\n',
+    'utf8'
+  );
+}
+
+test('cargarCatalogoRevisores: sin ninguna skill "fallback: true" aborta (sin generico no hay adonde caer)', async () => {
+  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
+  try {
+    await escribirSkillDominio(tmp, 'demo-reviewer', ['**/*.demo']);
+    assert.throws(() => cargarCatalogoRevisores(tmp), CatalogoRevisoresError);
+  } finally {
+    await rm(tmp, { recursive: true, force: true });
+  }
+});
+
+test('cargarCatalogoRevisores: DOS skills "fallback: true" abortan (no se sabe cual usar)', async () => {
+  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
+  try {
+    await escribirSkillGenerica(tmp, 'generico-a', 3);
+    await escribirSkillGenerica(tmp, 'generico-b', 3);
+    assert.throws(
+      () => cargarCatalogoRevisores(tmp),
+      (e: unknown) => {
+        assert.ok(e instanceof CatalogoRevisoresError);
+        assert.match((e as Error).message, /mas de un revisor declarado "fallback: true"/);
+        return true;
+      }
+    );
+  } finally {
+    await rm(tmp, { recursive: true, force: true });
+  }
+});
+
+test('cargarCatalogoRevisores: "umbral_dominios" invalido (cero, negativo, o no numerico) aborta', async () => {
+  for (const umbral of [0, -1, '"tres"']) {
+    const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
+    try {
+      await escribirSkillGenerica(tmp, 'generico', umbral);
+      assert.throws(
+        () => cargarCatalogoRevisores(tmp),
+        (e: unknown) => {
+          assert.ok(e instanceof CatalogoRevisoresError);
+          assert.match((e as Error).message, /umbral_dominios/);
+          return true;
+        },
+        `umbral_dominios: ${umbral} deberia abortar`
+      );
+    } finally {
+      await rm(tmp, { recursive: true, force: true });
+    }
+  }
+});
+
+test('cargarCatalogoRevisores: "patrones_archivo" que no es una lista de texto aborta', async () => {
+  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
+  try {
+    const dir = path.join(tmp, 'demo-reviewer');
+    await mkdir(dir, { recursive: true });
+    await writeFile(
+      path.join(dir, 'SKILL.md'),
+      '---\nname: demo-reviewer\ndescription: skill de prueba\n---\n\n' +
+        '```yaml\n' +
+        'rol: revisor\n' +
+        'patrones_archivo: 42\n' +
+        '```\n',
+      'utf8'
+    );
+    await escribirSkillGenerica(tmp, 'generico', 3);
+    assert.throws(
+      () => cargarCatalogoRevisores(tmp),
+      (e: unknown) => {
+        assert.ok(e instanceof CatalogoRevisoresError);
+        assert.match((e as Error).message, /patrones_archivo/);
+        return true;
+      }
+    );
+  } finally {
+    await rm(tmp, { recursive: true, force: true });
+  }
+});
+
+test('cargarCatalogoRevisores: un directorio de skills/ SIN bloque yaml (p. ej. task-workflow) no participa, sin error', async () => {
+  const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
+  try {
+    const dir = path.join(tmp, 'no-es-un-revisor');
+    await mkdir(dir, { recursive: true });
+    await writeFile(
+      path.join(dir, 'SKILL.md'),
+      '---\nname: no-es-un-revisor\ndescription: sin bloque yaml de enrutado\n---\n\nsolo prosa.\n',
+      'utf8'
+    );
+    await escribirSkillDominio(tmp, 'demo-reviewer', ['**/*.demo']);
+    await escribirSkillGenerica(tmp, 'generico', 3);
+    const catalogo = cargarCatalogoRevisores(tmp);
+    assert.deepEqual(
+      catalogo.dominio.map((r) => r.nombre),
+      ['demo-reviewer']
+    );
+    assert.equal(catalogo.generico.nombre, 'generico');
+  } finally {
+    await rm(tmp, { recursive: true, force: true });
+  }
+});
+
+// --- clasificarPorDominio: funcion pura, catalogos sinteticos ------------
+
+function catalogoSintetico(numDominios: number, umbralDominios: number): CatalogoRevisores {
+  return {
+    dominio: Array.from({ length: numDominios }, (_, i) => ({
+      nombre: `dominio-${i + 1}-reviewer`,
+      patronesArchivo: [`dominio-${i + 1}/**`],
+    })),
+    generico: { nombre: 'code-quality-reviewer', umbralDominios },
+  };
+}
+
+test('clasificarPorDominio: 1 dominio detectado fragmenta en 1 grupo con ese revisor', () => {
+  const catalogo = catalogoSintetico(2, 3);
+  const plan = clasificarPorDominio(['dominio-1/A.txt'], catalogo);
+  assert.equal(plan.fragmentado, true);
+  assert.equal(plan.grupos.length, 1);
+  assert.equal(plan.grupos[0]!.revisor, 'dominio-1-reviewer');
+  assert.deepEqual(plan.grupos[0]!.ficheros, ['dominio-1/A.txt']);
+});
+
+test('clasificarPorDominio: varios ficheros del MISMO dominio quedan en el MISMO grupo', () => {
+  const catalogo = catalogoSintetico(2, 3);
+  const plan = clasificarPorDominio(['dominio-1/A.txt', 'dominio-1/B.txt'], catalogo);
+  assert.equal(plan.grupos.length, 1);
+  assert.deepEqual(plan.grupos[0]!.ficheros, ['dominio-1/A.txt', 'dominio-1/B.txt']);
+});
+
+test('clasificarPorDominio: EXACTAMENTE en el umbral fragmenta (umbral inclusive, no cae al generico)', () => {
+  const catalogo = catalogoSintetico(3, 3);
+  const ficheros = ['dominio-1/A.txt', 'dominio-2/B.txt', 'dominio-3/C.txt'];
+  const plan = clasificarPorDominio(ficheros, catalogo);
+  assert.equal(plan.fragmentado, true, 'con 3 dominios y umbral 3, tiene que fragmentar');
+  assert.equal(plan.grupos.length, 3);
+  assert.deepEqual(
+    plan.grupos.map((g) => g.revisor).sort(),
+    ['dominio-1-reviewer', 'dominio-2-reviewer', 'dominio-3-reviewer']
+  );
+});
+
+test('clasificarPorDominio: UNO MAS que el umbral cae a un unico generico con TODOS los ficheros', () => {
+  const catalogo = catalogoSintetico(4, 3);
+  const ficheros = ['dominio-1/A.txt', 'dominio-2/B.txt', 'dominio-3/C.txt', 'dominio-4/D.txt'];
+  const plan = clasificarPorDominio(ficheros, catalogo);
+  assert.equal(plan.fragmentado, false, 'con 4 dominios y umbral 3, NO tiene que fragmentar');
+  assert.equal(plan.grupos.length, 1);
+  assert.equal(plan.grupos[0]!.revisor, 'code-quality-reviewer');
+  assert.deepEqual(plan.grupos[0]!.ficheros, ficheros);
+});
+
+test('clasificarPorDominio: cero ficheros que casen ningun dominio cae al generico con TODOS los ficheros', () => {
+  const catalogo = catalogoSintetico(2, 3);
+  const ficheros = ['docs/README.md', 'scripts/deploy.sh'];
+  const plan = clasificarPorDominio(ficheros, catalogo);
+  assert.equal(plan.fragmentado, false);
+  assert.equal(plan.grupos.length, 1);
+  assert.equal(plan.grupos[0]!.revisor, 'code-quality-reviewer');
+  assert.deepEqual(plan.grupos[0]!.ficheros, ficheros);
+});
+
+test('clasificarPorDominio: con 1-3 dominios detectados, un fichero que no casa ninguno lo cubre TAMBIEN el generico', () => {
+  const catalogo = catalogoSintetico(2, 3);
+  const plan = clasificarPorDominio(['dominio-1/A.txt', 'sin-dominio.txt'], catalogo);
+  assert.equal(plan.fragmentado, true);
+  assert.equal(plan.grupos.length, 2);
+  const dominio1 = plan.grupos.find((g) => g.revisor === 'dominio-1-reviewer');
+  const generico = plan.grupos.find((g) => g.revisor === 'code-quality-reviewer');
+  assert.ok(dominio1 !== undefined);
+  assert.ok(generico !== undefined, 'el fichero sin dominio no puede quedar sin revisor');
+  assert.deepEqual(dominio1!.ficheros, ['dominio-1/A.txt']);
+  assert.deepEqual(generico!.ficheros, ['sin-dominio.txt']);
+});
+
+test('clasificarPorDominio: diff vacio (sin ficheros) cae al generico con una lista vacia', () => {
+  const catalogo = catalogoSintetico(2, 3);
+  const plan = clasificarPorDominio([], catalogo);
+  assert.equal(plan.fragmentado, false);
+  assert.equal(plan.grupos.length, 1);
+  assert.deepEqual(plan.grupos[0]!.ficheros, []);
+});
+
+test('clasificarPorDominio: contraprueba de mutacion — cortar con ">=" en vez de ">" fragmentaria de mas', () => {
+  // Fija el sentido exacto del corte: con umbral 3, el numero de
+  // dominios que SI cae al generico es el PRIMERO por encima (4), nunca
+  // el propio umbral (3). Si alguien cambiara la condicion de
+  // `numDominios > umbral` a `numDominios >= umbral`, este test lo
+  // detecta porque 3 dominios dejaria de fragmentar.
+  const catalogo = catalogoSintetico(3, 3);
+  const ficheros = ['dominio-1/A.txt', 'dominio-2/B.txt', 'dominio-3/C.txt'];
+  const plan = clasificarPorDominio(ficheros, catalogo);
+  assert.equal(plan.fragmentado, true);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
index 82dbc01..1fcba59 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
@@ -54,9 +54,10 @@ import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
-import { parseBloqueClaveValor, parseFrontmatter } from '../../src/core/frontmatter.js';
+import { parseFrontmatter } from '../../src/core/frontmatter.js';
 import { veredictoAprobado } from '../../src/commands/finish.js';
 import { informeTemplate } from '../../src/commands/review.js';
+import { extraerBloqueYaml, parseBloqueRevisor } from '../../src/core/revisores.js';
 import type { Task } from '../../src/core/task.js';
 
 const moduleDir = path.dirname(fileURLToPath(import.meta.url));
@@ -128,20 +129,21 @@ async function leer(nombre: string): Promise<string> {
  * repo. Devuelve tambien las lineas crudas: el parser aplana lo que puede,
  * asi que aseverar solo sobre su salida dejaria pasar formas que Claude
  * Code interpretaria de otra manera.
+ *
+ * Promovido a src/core/revisores.ts (TASK-018, paso 2 del orden de
+ * construccion del plan): esto era la unica logica de lectura de
+ * `patrones_archivo`/`fallback`/`umbral_dominios` que existia, y vivia
+ * solo aqui, sin ningun lector de produccion. Este helper ahora es un
+ * envoltorio fino sobre esas dos funciones, para no duplicar el parseo.
  */
 function bloqueYaml(texto: string): { data: Record<string, unknown>; lineas: string[] } {
-  const lineas = texto.split('\n');
-  const ini = lineas.findIndex((l) => l.trim() === '```yaml');
-  assert.notEqual(ini, -1, 'no hay ningun bloque ```yaml en la skill');
-  const fin = lineas.findIndex((l, i) => i > ini && l.trim() === '```');
-  assert.notEqual(fin, -1, 'el bloque ```yaml no se cierra');
-  const cuerpo = lineas.slice(ini + 1, fin);
-  const { data } = parseBloqueClaveValor(cuerpo, 0, {
+  const lineas = extraerBloqueYaml(texto);
+  assert.notEqual(lineas, null, 'no hay ningun bloque ```yaml en la skill (o no se cierra)');
+  const data = parseBloqueRevisor(lineas as string[], {
     etiqueta: 'skill',
-    permitirComentariosDeLinea: true,
     crearError: (msg: string) => new Error(msg),
   });
-  return { data, lineas: cuerpo };
+  return { data, lineas: lineas as string[] };
 }
 
 // Guard de no-vacuidad: si PLUGIN_ROOT apuntase a otro sitio, media docena
````
