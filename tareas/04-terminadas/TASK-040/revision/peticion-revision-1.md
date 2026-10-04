# Peticion de revision — TASK-040 (ronda 1)

- Tarea: TASK-040 — F3-T1 taskctl review para la ronda 2 y siguientes
- Rama revisada: feature/task-040-f3-t1-taskctl-review-para-la-ronda-2-y-s
- Rama base: develop
- Commit revisado (HEAD): d3809db23f5cafc19824fcf18c42666c940ba1b4
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-040 (criterios de aceptacion y plan)

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
d3809db feat(TASK-040): taskctl review para la ronda 2 y siguientes (solo el delta y los hallazgos abiertos)
ca3045d chore(TASK-040): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index b9e32c2..49b43d6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -403,10 +403,12 @@ tener algo que reportar, no.
 `revision/`. **Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la
 tarea.** Los MENOR que se corrijan no abren ronda 2: basta la suite en verde,
 el commit de correccion y su nota en el `## Resultado`. La ronda 2 solo se
-pide si se corrigio algun CRITICO o IMPORTANTE, y entonces revisa el delta de
-la correccion y esos hallazgos, no la tarea entera: las correcciones son
-justo donde se cuelan los fallos nuevos. El revisor corre la suite completa
-una vez por ronda; los mutantes, con el fichero de test concreto.
+pide si se corrigio algun CRITICO o IMPORTANTE (veredicto `cambios-solicitados`):
+`taskctl review` sobre la tarea en revision la genera con solo el diff desde
+la ronda anterior y los hallazgos aun abiertos de su tabla, sin integrar la
+rama base (eso lo hace `finish`). Las correcciones son justo donde se cuelan
+los fallos nuevos. El revisor corre la suite completa una vez por ronda; los
+mutantes, con el fichero de test concreto.
 
 ### La linea del veredicto
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 0fd40bd..1799769 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -520,9 +520,13 @@ async function mainComando(argv: readonly string[]): Promise<number> {
             `Lanza ese agente con esa peticion y vuelca su salida en ${grupo.informePath}.\n`
         )
         .join('');
+      printAvisos(...result.avisos);
       process.stdout.write(
-        `Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
-          `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n` +
+        (result.incremental
+          ? `Tarea ${result.id}: ronda ${result.ronda} de revision, solo con los cambios desde ` +
+            `${result.desde} (sin update de "${result.baseBranch}": lo integra finish).\n`
+          : `Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
+            `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n`) +
           lineasInformes
       );
       printAutoCommit(result.autoCommit);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 09a911f..3597654 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -24,6 +24,7 @@ import { FrontmatterParseError } from '../core/frontmatter.js';
 import { TaskValidationError } from '../core/task.js';
 import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
+import { veredictoAprobado } from '../core/informe-revision.js';
 import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
   isWorkspaceClean,
@@ -75,42 +76,9 @@ const DEVELOP_BRANCH = 'develop';
  */
 const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
 
-/**
- * true solo si TODAS las lineas "- Veredicto:" del informe aprueban.
- * Fail-closed de verdad (hallazgo CRITICO de revision por pares,
- * TASK-014: la version anterior buscaba la palabra "aprobada" en
- * cualquier parte y aprobaba literalmente "no aprobada"):
- * - el VALOR del veredicto debe EMPEZAR por "aprobada" — una negacion
- *   delante ("no aprobada", "rechazada: aprobada seria...") no pasa;
- * - "pendiente" (con limites de palabra: "independiente" no cuenta) o
- *   "cambios-solicitados" en el valor lo tumban;
- * - si hay varias lineas Veredicto (p. ej. el placeholder de la
- *   plantilla sin borrar), TODAS deben aprobar;
- * - sin linea de veredicto (o sin informe), NO esta aprobada.
- */
-export function veredictoAprobado(informe: string): boolean {
-  const prefijo = '- veredicto:';
-  const lineas = informe
-    .split('\n')
-    .filter((l) => l.trim().toLowerCase().startsWith(prefijo));
-  if (lineas.length === 0) return false;
-  return lineas.every((linea) => {
-    // TASK-036: se recorta el enfasis de markdown (`**aprobada**`,
-    // `_aprobada_`, comillas invertidas) que los revisores ponen solos.
-    // No afloja la regla: el valor sigue anclado a `^aprobada\b`, asi que
-    // "no aprobada" y "**no aprobada**" siguen fallando.
-    const valor = linea
-      .trim()
-      .slice(prefijo.length)
-      .trim()
-      .replace(/^[*_`]+/, '')
-      .replace(/[*_`]+$/, '')
-      .trim()
-      .toLowerCase();
-    if (/\bpendiente\b/.test(valor) || valor.includes('cambios-solicitados')) return false;
-    return /^aprobada\b/.test(valor);
-  });
-}
+// El gate de veredicto vive en core/informe-revision.ts desde TASK-040;
+// se reexporta aqui para no romper a quien lo importa de finish.
+export { veredictoAprobado } from '../core/informe-revision.js';
 
 /**
  * Contenidos de TODOS los informes de la ronda con mayor N segun `re`,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 1cef0d5..83418dc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -16,15 +16,30 @@
  * `ultimo_commit_revisado` NO se actualiza aqui a proposito: segun la
  * seccion 16.3 se actualiza cuando una revision TERMINA (informe
  * aprobado), no cuando se genera la peticion.
+ *
+ * TASK-040: con la tarea ya en `en-revision` y la ultima ronda en
+ * `cambios-solicitados`, `review` genera la ronda N+1 en modo
+ * INCREMENTAL: el diff va desde el commit revisado en la ronda N (la
+ * linea `- Commit revisado (HEAD):` de su peticion, que solo escribe el
+ * CLI) y la peticion lista los hallazgos de la ronda N que siguen
+ * abiertos. No se ejecuta el update de Git-Flow: el merge de la base
+ * entraria en el delta como si fuera una correccion; la base la integra
+ * `finish` al cerrar.
  */
 import path from 'node:path';
-import { mkdir, writeFile } from 'node:fs/promises';
+import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
 import { STATE_FOLDER, type Task } from '../core/task.js';
 import { resolverConfig } from '../core/config.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
-import { siguienteRonda } from '../fs/rondas.js';
+import { INFORME_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
+import {
+  commitRevisadoDe,
+  hallazgosNoCerrados,
+  veredictoDeRonda,
+  type VeredictoInforme,
+} from '../core/informe-revision.js';
 import { fenceFor } from '../core/markdown.js';
-import { assertTransitionAllowed } from '../core/state-machine.js';
+import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
 import {
   isWorkspaceClean,
   currentBranch,
@@ -90,6 +105,12 @@ export interface RevisionGrupo {
 }
 
 export interface ReviewCommandResult {
+  /** TASK-040: true si es una ronda N+1 generada desde en-revision. */
+  incremental: boolean;
+  /** Inicio del rango del diff: la rama base, o el commit de la ronda anterior. */
+  desde: string;
+  /** Avisos no fatales (p. ej. el commit de la ronda anterior ya no es antepasado). */
+  avisos: string[];
   id: string;
   rama: string;
   baseBranch: string;
@@ -137,6 +158,9 @@ export function peticionTemplate(
   alcanceDiff: string,
   extras: ExtrasPeticion = {}
 ): string {
+  // TASK-040: en una ronda incremental el rango empieza en el commit
+  // revisado en la ronda anterior, no en la rama base.
+  const desde = extras.desde ?? baseBranch;
   const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
   // MENOR-1 de la revision de TASK-034: si TODO quedo excluido, decir
   // "sin diferencias" seria falso.
@@ -158,6 +182,9 @@ export function peticionTemplate(
     (extras.carpetaTarea === undefined
       ? ''
       : `- Carpeta de la tarea: ${extras.carpetaTarea} (criterios de aceptacion y plan)\n`) +
+    (extras.desde === undefined
+      ? ''
+      : `- Revision incremental: solo los cambios desde ${extras.desde} (el commit revisado en la ronda anterior)\n`) +
     '\n' +
     '## Instrucciones para el agente revisor\n\n' +
     'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
@@ -170,7 +197,8 @@ export function peticionTemplate(
     'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
     `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
     'peticion.\n\n' +
-    `## Commits a revisar (git log ${baseBranch}..HEAD)\n\n` +
+    (extras.seccionPrevia ?? '') +
+    `## Commits a revisar (git log ${desde}..HEAD)\n\n` +
     `${fence}\n` +
     `${commitsBlock}\n` +
     `${fence}\n\n` +
@@ -178,7 +206,7 @@ export function peticionTemplate(
     `${fence}diff\n` +
     `${diffBlock}\n` +
     `${fence}\n` +
-    seccionExcluidos(baseBranch, extras)
+    seccionExcluidos(desde, extras)
   );
 }
 
@@ -192,6 +220,66 @@ export interface ExtrasPeticion {
   stat?: string;
   /** Patrones de exclusion aplicados, para la orden que recupera su diff. */
   patrones?: readonly string[];
+  /** TASK-040: inicio del rango en una ronda incremental. */
+  desde?: string;
+  /** TASK-040: seccion con los hallazgos abiertos de la ronda anterior. */
+  seccionPrevia?: string;
+}
+
+/** Peticiones de revision, con o sin sufijo de dominio (TASK-018). */
+const PETICION_REVISION_RE = /^peticion-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
+
+/** Lo que hace falta saber de la ronda N para generar la N+1 (TASK-040). */
+interface RondaPrevia {
+  ronda: number;
+  veredicto: VeredictoInforme;
+  /** Commit revisado en la ronda N, o null si ninguna peticion lo dice. */
+  commit: string | null;
+  /** Seccion de la peticion con los hallazgos que siguen abiertos. */
+  seccion: string;
+}
+
+async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
+  const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
+  const textos = await Promise.all(
+    informes.nombres.map(async (n) => ({ nombre: n, texto: await readFile(path.join(revisionDir, n), 'utf8') }))
+  );
+  const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
+  let commit: string | null = null;
+  for (const n of peticiones.nombres) {
+    commit = commitRevisadoDe(await readFile(path.join(revisionDir, n), 'utf8'));
+    if (commit !== null) break;
+  }
+
+  const filas: string[] = [];
+  const sinTabla: string[] = [];
+  for (const { nombre, texto } of textos) {
+    const lectura = hallazgosNoCerrados(texto);
+    if (!lectura.tabla) {
+      sinTabla.push(nombre);
+      continue;
+    }
+    for (const h of lectura.abiertos) {
+      filas.push(`| ${h.id} | ${h.severidad} | ${h.estado} | ${h.fichero} | ${nombre} |`);
+    }
+  }
+  let seccion =
+    `## Hallazgos de la ronda ${informes.ronda} que siguen abiertos\n\n` +
+    'Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la\n' +
+    'correccion no abre otro fallo: es justo donde se cuelan.\n\n';
+  if (filas.length > 0) {
+    seccion += '| ID | Severidad | Estado | Fichero | Informe |\n|---|---|---|---|---|\n' + filas.join('\n') + '\n';
+  } else if (sinTabla.length === 0) {
+    seccion += '0 hallazgos abiertos en la tabla de la ronda anterior.\n';
+  }
+  if (sinTabla.length > 0) {
+    // Una tabla ausente NO es "0 abiertos": los informes anteriores a la
+    // tabla, o escritos a mano, hay que leerlos enteros.
+    seccion +=
+      `\nTabla de hallazgos ausente o ilegible en: ${sinTabla.join(', ')}. ` +
+      'Lee esos informes enteros.\n';
+  }
+  return { ronda: informes.ronda, veredicto: veredictoDeRonda(textos.map((t) => t.texto)), commit, seccion: seccion + '\n' };
 }
 
 /**
@@ -244,6 +332,15 @@ export function informeTemplate(task: Task, commitRevisado: string, ronda: numbe
   );
 }
 
+/** isAncestor sin lanzar: un SHA que ya no existe (gc) no es antepasado. */
+function esAntepasado(sha: string, cwd: string): boolean {
+  try {
+    return isAncestor(sha, 'HEAD', cwd);
+  } catch {
+    return false;
+  }
+}
+
 export async function runReviewCommand(
   tareasRoot: string,
   argv: readonly string[],
@@ -261,7 +358,16 @@ export async function runReviewCommand(
   // metadata estable que ningun comando reescribe. La lectura que
   // decide la escritura va DESPUES del script, que cambia de rama.
   const initial = await readTareaFile(tareasRoot, id);
-  assertTransitionAllowed('review', initial ? initial.task : null);
+  // TASK-040: con la tarea en en-revision, la guarda decide con el
+  // veredicto de la ultima ronda, leido de revision/.
+  const incremental = initial !== null && initial.task.estado === 'en-revision';
+  let previa: RondaPrevia | null = null;
+  const ctx: TransitionContext = {};
+  if (incremental) {
+    previa = await leerRondaPrevia(path.join(path.dirname(initial.filePath), REVISION_DIRNAME));
+    ctx.veredictoRondaAnterior = previa.veredicto;
+  }
+  assertTransitionAllowed('review', initial ? initial.task : null, ctx);
   const tipo = initial!.task.tipo;
   const rama = initial!.task.rama;
 
@@ -276,10 +382,14 @@ export async function runReviewCommand(
   }
 
   const scriptName = SCRIPT_BY_TYPE[tipo];
-  const { code, signal } = runGitflowScript(scriptName, [rama], {
-    scriptsDir: deps.scriptsDir,
-    cwd: deps.repoCwd,
-  });
+  // TASK-040: la ronda incremental no ejecuta el update (el merge de la
+  // base entraria en el delta); exige estar ya en la rama de la tarea.
+  const { code, signal } = incremental
+    ? { code: 0, signal: null }
+    : runGitflowScript(scriptName, [rama], {
+        scriptsDir: deps.scriptsDir,
+        cwd: deps.repoCwd,
+      });
   if (code !== 0) {
     const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
     throw new ReviewCommandError(
@@ -293,6 +403,12 @@ export async function runReviewCommand(
   // merge de la base ocurrido de verdad (la base es antepasada de
   // HEAD), no solo un exit 0 del script.
   const branchNow = currentBranch(deps.repoCwd);
+  if (incremental && branchNow !== rama) {
+    throw new ReviewCommandError(
+      `[ERROR] ${id}: la ronda incremental se genera desde la rama de la tarea, "${rama}", ` +
+        `y la activa es "${branchNow}". Cambia a "${rama}" (git checkout ${rama}) y reintenta.`
+    );
+  }
   if (branchNow !== rama) {
     throw new ReviewCommandError(
       `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
@@ -300,7 +416,7 @@ export async function runReviewCommand(
     );
   }
   const baseBranch = resolveBaseBranchForTipo(tipo, deps.repoCwd);
-  if (!isAncestor(baseBranch, 'HEAD', deps.repoCwd)) {
+  if (!incremental && !isAncestor(baseBranch, 'HEAD', deps.repoCwd)) {
     throw new ReviewCommandError(
       `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${baseBranch}" NO esta ` +
         `integrada en "${rama}" (merge-base --is-ancestor lo niega). No se actualiza la ` +
@@ -312,15 +428,31 @@ export async function runReviewCommand(
   // decide si se muta algo y con que contenido (regla de la doble
   // lectura — el update pudo traer de la base un tarea.md mas nuevo).
   const existing = await readTareaFile(tareasRoot, id);
-  assertTransitionAllowed('review', existing ? existing.task : null);
+  assertTransitionAllowed('review', existing ? existing.task : null, ctx);
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
 
   const commitRevisado = headCommit(deps.repoCwd);
-  const commits = logOneline(baseBranch, 'HEAD', deps.repoCwd);
+  // TASK-040: inicio del rango. En la ronda incremental, el commit
+  // revisado en la ronda N si sigue siendo antepasado de HEAD; si no (un
+  // rebase, un amend, un gc) o no consta, el diff completo con un aviso.
+  const avisos: string[] = [];
+  let desde = baseBranch;
+  if (incremental && previa !== null) {
+    const valido = previa.commit !== null && esAntepasado(previa.commit, deps.repoCwd);
+    if (valido) {
+      desde = previa.commit as string;
+    } else {
+      avisos.push(
+        `${id}: ${previa.commit === null ? 'ninguna peticion de la ronda ' + String(previa.ronda) + ' dice que commit se reviso' : `el commit revisado en la ronda ${previa.ronda} (${previa.commit}) ya no es antepasado de HEAD (¿rebase o amend?)`}. ` +
+          `La ronda ${String(previa.ronda + 1)} lleva el diff completo desde "${baseBranch}".`
+      );
+    }
+  }
+  const commits = logOneline(desde, 'HEAD', deps.repoCwd);
   // TASK-034: lo generado (dist/, lockfiles) y la propia carpeta de
   // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
   const excluir = resolverConfig(deps.repoCwd).excluir_de_revision;
-  const paraRevision = diffParaRevision(baseBranch, 'HEAD', excluir, deps.repoCwd);
+  const paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
   const diff = paraRevision.diff;
 
   // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
@@ -364,6 +496,16 @@ export async function runReviewCommand(
     };
   });
 
+  // TASK-040 (riesgo 1 del brainstorm): si una escritura falla a mitad,
+  // se borran las de esta invocacion. Sin esto, una ronda N+1 a medias
+  // dejaba la tarea sin salida: finish bloquea por el PENDIENTE y review
+  // rechaza otra ronda por lo mismo. Son ficheros nuevos ('wx'): no se
+  // borra nada que no se acabe de crear.
+  const escritos: string[] = [];
+  const escribir = async (ruta: string, contenido: string): Promise<void> => {
+    await writeFile(ruta, contenido, { encoding: 'utf8', flag: 'wx' });
+    escritos.push(ruta);
+  };
   try {
     for (const escritura of escrituras) {
       // Cada revisor recibe SOLO el subconjunto de su dominio (criterio
@@ -372,14 +514,16 @@ export async function runReviewCommand(
       // ficheros" y se reusa el diff completo ya calculado arriba, para
       // no repetir la misma llamada a Git dos veces.
       const diffDelGrupo = plan.fragmentado
-        ? diffRangeForPaths(baseBranch, 'HEAD', escritura.ficheros, deps.repoCwd)
+        ? diffRangeForPaths(desde, 'HEAD', escritura.ficheros, deps.repoCwd)
         : diff;
       const alcanceDiff = plan.fragmentado
         ? `Diff de tu dominio (${escritura.ficheros.length} fichero(s) de ` +
-          `${ficherosTocados.length}; git diff ${baseBranch}..HEAD -- <tus ficheros>)`
-        : `Diff completo (git diff ${baseBranch}..HEAD)`;
+          `${ficherosTocados.length}; git diff ${desde}..HEAD -- <tus ficheros>)`
+        : desde === baseBranch
+          ? `Diff completo (git diff ${baseBranch}..HEAD)`
+          : `Diff desde la ronda anterior (git diff ${desde}..HEAD)`;
 
-      await writeFile(
+      await escribir(
         path.join(revisionDir, escritura.nombrePeticion),
         peticionTemplate(
           updated,
@@ -399,17 +543,18 @@ export async function runReviewCommand(
             excluidos: paraRevision.excluidos,
             stat: paraRevision.stat,
             patrones: excluir,
+            ...(incremental && desde !== baseBranch ? { desde } : {}),
+            ...(previa !== null ? { seccionPrevia: previa.seccion } : {}),
           }
-        ),
-        { encoding: 'utf8', flag: 'wx' }
+        )
       );
-      await writeFile(
+      await escribir(
         path.join(revisionDir, escritura.nombreInforme),
-        informeTemplate(updated, commitRevisado, ronda),
-        { encoding: 'utf8', flag: 'wx' }
+        informeTemplate(updated, commitRevisado, ronda)
       );
     }
   } catch (e: unknown) {
+    await Promise.all(escritos.map((r) => unlink(r).catch(() => undefined)));
     if (!isEexist(e)) throw e;
     throw new ReviewCommandError(
       `[ERROR] ${id}: ya existe un fichero de la ronda ${ronda} en ${revisionDir} ` +
@@ -442,6 +587,9 @@ export async function runReviewCommand(
 
   return {
     autoCommit: commitResult,
+    incremental,
+    desde,
+    avisos,
     id: task.id,
     rama,
     baseBranch,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
new file mode 100644
index 0000000..0bec1aa
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -0,0 +1,170 @@
+/**
+ * Lectura determinista de los ficheros de una ronda de revision —
+ * TASK-040. Modulo puro: recibe texto, no toca disco.
+ *
+ * Reune lo que antes estaba disperso (el gate de veredicto vivia en
+ * finish.ts y codex-review lo importaba de alli) y anade lo que necesita
+ * la ronda incremental de `taskctl review`: que dijo la ronda anterior,
+ * desde que commit se reviso y que hallazgos siguen abiertos.
+ */
+
+const PREFIJO_VEREDICTO = '- veredicto:';
+
+/** Valor de una linea `- Veredicto:` sin enfasis de markdown, en minusculas. */
+function valorDeLinea(linea: string): string {
+  // TASK-036: se recorta el enfasis de markdown (`**aprobada**`,
+  // `_aprobada_`, comillas invertidas) que los revisores ponen solos.
+  return linea
+    .trim()
+    .slice(PREFIJO_VEREDICTO.length)
+    .trim()
+    .replace(/^[*_`]+/, '')
+    .replace(/[*_`]+$/, '')
+    .trim()
+    .toLowerCase();
+}
+
+function lineasDeVeredicto(informe: string): string[] {
+  return informe
+    .split('\n')
+    .filter((l) => l.trim().toLowerCase().startsWith(PREFIJO_VEREDICTO));
+}
+
+/**
+ * true solo si TODAS las lineas "- Veredicto:" del informe aprueban.
+ * Fail-closed de verdad (hallazgo CRITICO de revision por pares,
+ * TASK-014): una version anterior buscaba "aprobada" en cualquier parte
+ * y aprobaba literalmente "no aprobada".
+ * - sin linea de veredicto (o sin informe), NO esta aprobada;
+ * - si hay varias (p. ej. una nueva y la de la plantilla sin borrar),
+ *   TODAS deben aprobar.
+ * Vive aqui desde TASK-040; finish.ts lo reexporta.
+ */
+export function veredictoAprobado(informe: string): boolean {
+  const lineas = lineasDeVeredicto(informe);
+  if (lineas.length === 0) return false;
+  return lineas.every((linea) => {
+    const valor = valorDeLinea(linea);
+    if (/\bpendiente\b/.test(valor) || valor.includes('cambios-solicitados')) return false;
+    return /^aprobada\b/.test(valor);
+  });
+}
+
+/**
+ * Que dice un informe, para decidir si se abre otra ronda (TASK-040).
+ * - `sin-linea`: no hay ninguna linea `- Veredicto:`.
+ * - `pendiente`: alguna sigue en PENDIENTE (la plantilla sin tocar).
+ * - `cambios-solicitados`: alguna los pide (con o sin guion: el
+ *   vocabulario historico tiene «cambios solicitados»).
+ * - `aprobada`: todas aprueban, segun `veredictoAprobado`.
+ * - `desconocido`: cualquier otra cosa.
+ */
+export type VeredictoInforme = 'sin-linea' | 'pendiente' | 'cambios-solicitados' | 'aprobada' | 'desconocido';
+
+export function veredictoDe(informe: string): VeredictoInforme {
+  const lineas = lineasDeVeredicto(informe);
+  if (lineas.length === 0) return 'sin-linea';
+  const valores = lineas.map(valorDeLinea);
+  if (valores.some((v) => /\bpendiente\b/.test(v))) return 'pendiente';
+  if (valores.some((v) => /^cambios[ -]solicitados\b/.test(v))) return 'cambios-solicitados';
+  if (veredictoAprobado(informe)) return 'aprobada';
+  return 'desconocido';
+}
+
+/**
+ * Veredicto de una RONDA, que puede tener varios informes (revision
+ * fragmentada por dominio). Prioridad: si alguno no tiene veredicto o
+ * esta pendiente, la ronda esta pendiente (no se abre otra con un
+ * fragmento sin revisar); si alguno es desconocido, desconocido; si
+ * alguno pide cambios, cambios; si todos aprueban, aprobada.
+ */
+export function veredictoDeRonda(informes: readonly string[]): VeredictoInforme {
+  if (informes.length === 0) return 'sin-linea';
+  const v = informes.map(veredictoDe);
+  if (v.some((x) => x === 'sin-linea' || x === 'pendiente')) return 'pendiente';
+  if (v.includes('desconocido')) return 'desconocido';
+  if (v.includes('cambios-solicitados')) return 'cambios-solicitados';
+  return 'aprobada';
+}
+
+/**
+ * SHA del commit revisado en una peticion de revision: la linea
+ * `- Commit revisado (HEAD): <sha>` que escribe solo el CLI. Se toma el
+ * SHA del principio y se ignora lo que venga detras. null si no esta.
+ */
+export function commitRevisadoDe(peticion: string): string | null {
+  const m = /^- Commit revisado(?: \(HEAD\))?:\s*([0-9a-f]{7,40})\b/im.exec(peticion);
+  return m === null ? null : (m[1] as string);
+}
+
+export interface Hallazgo {
+  id: string;
+  severidad: string;
+  estado: string;
+  fichero: string;
+}
+
+export interface LecturaHallazgos {
+  /** false si no hay tabla de hallazgos reconocible (informes anteriores a TASK-036). */
+  tabla: boolean;
+  /** Hallazgos cuyo Estado no es `corregido` ni `aceptado`. */
+  abiertos: Hallazgo[];
+}
+
+function normalizarCelda(c: string): string {
+  return c
+    .trim()
+    .replace(/^[*_`]+/, '')
+    .replace(/[*_`]+$/, '')
+    .trim()
+    .normalize('NFD')
+    .replace(/[̀-ͯ]/g, '');
+}
+
+/**
+ * Hallazgos no cerrados de la primera tabla bajo `## Hallazgos` cuya
+ * cabecera tenga las columnas ID y Estado (por nombre, no por
+ * posicion). Cerrado = Estado `corregido` o `aceptado`; cualquier otro
+ * valor, tambien el vacio, cuenta como abierto: listar de mas es barato
+ * y omitir es caro. Se ignora la fila de ejemplo de la plantilla.
+ */
+export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
+  const lineas = informe.replace(/\r/g, '').split('\n');
+  const inicio = lineas.findIndex((l) => /^##\s+hallazgos\b/i.test(l.trim()));
+  if (inicio === -1) return { tabla: false, abiertos: [] };
+  let i = inicio + 1;
+  while (i < lineas.length && !(lineas[i] as string).trim().startsWith('|')) {
+    if (/^##\s/.test((lineas[i] as string).trim())) return { tabla: false, abiertos: [] };
+    i++;
+  }
+  if (i >= lineas.length) return { tabla: false, abiertos: [] };
+
+  const celdas = (l: string): string[] =>
+    l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(normalizarCelda);
+  const cabecera = celdas(lineas[i] as string).map((c) => c.toLowerCase());
+  const col = (nombre: string): number => cabecera.findIndex((c) => c === nombre);
+  const iId = col('id');
+  const iEstado = col('estado');
+  if (iId === -1 || iEstado === -1) return { tabla: false, abiertos: [] };
+  const iSev = col('severidad');
+  const iFich = col('fichero');
+
+  const abiertos: Hallazgo[] = [];
+  for (i++; i < lineas.length; i++) {
+    const l = (lineas[i] as string).trim();
+    if (!l.startsWith('|')) break;
+    if (/^\|[\s:|-]+\|?$/.test(l)) continue;
+    const c = celdas(l);
+    const id = c[iId] ?? '';
+    if (id === '' || id.toLowerCase().startsWith('(ej.')) continue;
+    const estado = (c[iEstado] ?? '').toLowerCase();
+    if (estado === 'corregido' || estado === 'aceptado') continue;
+    abiertos.push({
+      id,
+      severidad: iSev === -1 ? '' : (c[iSev] ?? ''),
+      estado: c[iEstado] ?? '',
+      fichero: iFich === -1 ? '' : (c[iFich] ?? ''),
+    });
+  }
+  return { tabla: true, abiertos };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
index 86ab117..a70d344 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/state-machine.ts
@@ -27,6 +27,11 @@ export interface TransitionContext {
   revisionPrimariaAprobada?: boolean;
   /** Solo para "finish": si revision_codex es true, ¿esa revision esta aprobada? */
   revisionCodexAprobada?: boolean;
+  /**
+   * Solo para "review" con la tarea en en-revision (TASK-040): que dijo la
+   * ultima ronda. Lo calcula quien llama leyendo revision/.
+   */
+  veredictoRondaAnterior?: 'sin-linea' | 'pendiente' | 'cambios-solicitados' | 'aprobada' | 'desconocido';
 }
 
 export class StateMachineError extends Error {
@@ -174,6 +179,18 @@ export function assertTransitionAllowed(
     }
 
     case 'start': {
+      // TASK-040: con la tarea ya en revision, el siguiente paso es otra
+      // ronda de review, no volver a planificar (antes los errores daban
+      // vueltas en circulo: review -> start -> plan).
+      if (task.estado === 'en-revision') {
+        throw err(
+          task.id,
+          command,
+          task.estado,
+          'taskctl review',
+          'ya esta en revision. Para otra ronda tras corregir: taskctl review (con el ultimo veredicto en cambios-solicitados).'
+        );
+      }
       if (task.estado !== 'en-diseno') {
         throw err(
           task.id,
@@ -197,6 +214,26 @@ export function assertTransitionAllowed(
     }
 
     case 'review': {
+      // TASK-040: ronda N+1 desde en-revision, solo si la ronda N pidio
+      // cambios. `aprobada con correcciones` NO abre otra ronda: por la
+      // politica de rondas, una ronda sin CRITICO ni IMPORTANTE cierra, y
+      // abrir otra bloquearia una tarea que ya se puede cerrar.
+      if (task.estado === 'en-revision') {
+        switch (ctx.veredictoRondaAnterior) {
+          case 'cambios-solicitados':
+            return;
+          case 'aprobada':
+            throw err(task.id, command, task.estado, 'taskctl finish',
+              'tiene la ultima ronda de revision aprobada: no hace falta otra. Cierrala con taskctl finish.');
+          case 'pendiente':
+          case 'sin-linea':
+            throw err(task.id, command, task.estado, 'taskctl veredicto',
+              'tiene la ultima ronda de revision sin veredicto (PENDIENTE). Escribelo con taskctl veredicto antes de pedir otra ronda.');
+          default:
+            throw err(task.id, command, task.estado, 'taskctl veredicto',
+              'tiene un veredicto que taskctl no reconoce en la ultima ronda. Reescribelo con taskctl veredicto (aprobada | aprobada-con-correcciones | cambios-solicitados).');
+        }
+      }
       if (task.estado !== 'en-curso') {
         throw err(
           task.id,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
new file mode 100644
index 0000000..bec9a14
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts
@@ -0,0 +1,219 @@
+/**
+ * TASK-040: `taskctl review` para la ronda 2 y siguientes. Repos Git
+ * temporales reales y los scripts de Git-Flow del repo; la evidencia se
+ * lee de la peticion que escribe el comando y de `git log`.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir, readFile, readdir } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runVeredictoCommand } from '../../src/commands/veredicto.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import {
+  commitRevisadoDe,
+  hallazgosNoCerrados,
+  veredictoDe,
+  veredictoDeRonda,
+} from '../../src/core/informe-revision.js';
+import type { Task } from '../../src/core/task.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+function git(args: string[], cwd: string): string {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
+  return r.stdout;
+}
+
+function commitAll(repo: string, msg: string): void {
+  git(['add', '-A'], repo);
+  git(['commit', '-q', '-m', msg], repo);
+}
+
+const TASK: Task = {
+  id: 'TASK-950',
+  titulo: 'Prueba de revision incremental',
+  tipo: 'feature',
+  sprint: 4,
+  etiquetas: ['cli'],
+  complejidad: 'media',
+  modelo_sugerido: 'sonnet',
+  estado: 'en-curso',
+  plan_aprobado: true,
+  rama: 'feature/task-950-incremental',
+  asignado_a: null,
+  agente_revisor: 'general-purpose',
+  skills_recomendados: [],
+  regla_seleccion_skill: null,
+  ultimo_commit_revisado: null,
+  revision_codex: false,
+  creado: '2026-10-04',
+  actualizado: '2026-10-04',
+  dependencias: [],
+};
+
+const INFORME_R1 = (veredicto: string): string =>
+  '# Informe de revision — TASK-950 (ronda 1)\n\n- Commit revisado: x\n' +
+  `- Veredicto: ${veredicto}\n\n## Hallazgos\n\n` +
+  '| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n' +
+  '| IMP-1 | IMPORTANTE | abierto | src/a.ts:3 |\n' +
+  '| MEN-1 | MENOR | corregido | src/a.ts:9 |\n\nReproduccion...\n';
+
+/**
+ * Repo con la tarea revisada en ronda 1 (con el informe dado) y despues
+ * un commit de correccion en src/b.ts. develop avanza con otro fichero
+ * para comprobar que la ronda 2 NO lo integra.
+ */
+async function withRonda1(
+  informe: string,
+  fn: (repo: string, tareas: string, revisionDir: string, commitR1: string) => Promise<void>
+): Promise<void> {
+  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-incr-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repo);
+    git(['config', 'user.email', 't@t'], repo);
+    git(['config', 'user.name', 't'], repo);
+    git(['config', 'core.autocrlf', 'false'], repo);
+    await writeFile(path.join(repo, 'README.md'), 'r\n', 'utf8');
+    commitAll(repo, 'inicial');
+    git(['checkout', '-q', '-b', 'develop'], repo);
+    git(['checkout', '-q', '-b', TASK.rama], repo);
+    const tareas = path.join(repo, 'tareas');
+    await writeTareaFile(tareas, TASK, '## Objetivo\nProbar.\n');
+    await mkdir(path.join(repo, 'src'), { recursive: true });
+    await writeFile(path.join(repo, 'src', 'a.ts'), 'export const a = 1;\n', 'utf8');
+    commitAll(repo, 'feat(TASK-950): trabajo de la ronda 1');
+    const deps = { repoCwd: repo, scriptsDir: SCRIPTS_DIR };
+    const r1 = await runReviewCommand(tareas, ['TASK-950'], '2026-10-04', deps);
+    const revisionDir = path.join(tareas, '03-en-revision', 'TASK-950', 'revision');
+    await writeFile(path.join(revisionDir, 'informe-revision-1.md'), informe, 'utf8');
+    commitAll(repo, 'docs(TASK-950): informe ronda 1');
+    // develop avanza por su cuenta.
+    git(['checkout', '-q', 'develop'], repo);
+    await writeFile(path.join(repo, 'otra-tarea.txt'), 'ajeno\n', 'utf8');
+    commitAll(repo, 'feat: otra tarea en develop');
+    git(['checkout', '-q', TASK.rama], repo);
+    await writeFile(path.join(repo, 'src', 'b.ts'), 'export const b = 2;\n', 'utf8');
+    commitAll(repo, 'fix(TASK-950): correccion de IMP-1');
+    await fn(repo, tareas, revisionDir, r1.commitRevisado);
+  } finally {
+    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+const DEPS = (repo: string) => ({ repoCwd: repo, scriptsDir: SCRIPTS_DIR });
+
+test('review incremental (TASK-040): ronda 1 -> cambios-solicitados -> correccion -> ronda 2 con solo el delta y los hallazgos abiertos', async () => {
+  await withRonda1(INFORME_R1('PENDIENTE'), async (repo, tareas, revisionDir, commitR1) => {
+    await runVeredictoCommand(tareas, ['TASK-950', 'cambios-solicitados'], { repoCwd: repo });
+    const r2 = await runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo));
+    assert.equal(r2.incremental, true);
+    assert.equal(r2.ronda, 2);
+    assert.equal(r2.desde, commitR1);
+    const peticion = await readFile(path.join(revisionDir, 'peticion-revision-2.md'), 'utf8');
+    assert.match(peticion, new RegExp(`Revision incremental: solo los cambios desde ${commitR1}`));
+    assert.match(peticion, /diff --git a\/src\/b\.ts/, 'la correccion tiene que estar en el delta');
+    assert.doesNotMatch(peticion, /diff --git a\/src\/a\.ts/, 'lo ya revisado en la ronda 1 no entra');
+    assert.doesNotMatch(peticion, /otra-tarea\.txt/, 'develop no se integra en la ronda 2');
+    assert.match(peticion, /\| IMP-1 \| IMPORTANTE \| abierto \| src\/a\.ts:3 \| informe-revision-1\.md \|/);
+    assert.doesNotMatch(peticion, /\| MEN-1 \|/, 'un hallazgo corregido no se lista');
+    assert.equal(commitRevisadoDe(peticion), r2.commitRevisado);
+    assert.ok(existsSync(path.join(revisionDir, 'informe-revision-2.md')));
+    // Ni merge de develop ni nada pendiente en el arbol.
+    assert.doesNotMatch(git(['log', '--format=%s', '-5'], repo), /update\(feature\)/);
+    assert.equal(git(['status', '--porcelain'], repo).trim(), '');
+  });
+});
+
+test('review incremental (TASK-040): con la ronda aprobada (tambien "aprobada con correcciones") aborta y manda a finish', async () => {
+  for (const v of ['aprobada', 'aprobada con correcciones']) {
+    await withRonda1(INFORME_R1(v), async (repo, tareas) => {
+      await assert.rejects(
+        runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo)),
+        (e: unknown) => e instanceof StateMachineError && /taskctl finish/.test(e.message)
+      );
+    });
+  }
+});
+
+test('review incremental (TASK-040): con la ronda PENDIENTE o con un veredicto desconocido aborta y manda a taskctl veredicto', async () => {
+  for (const v of ['PENDIENTE', 'lo pienso']) {
+    await withRonda1(INFORME_R1(v), async (repo, tareas) => {
+      await assert.rejects(
+        runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo)),
+        (e: unknown) => e instanceof StateMachineError && /taskctl veredicto/.test(e.message)
+      );
+    });
+  }
+});
+
+test('review incremental (TASK-040): si el commit de la ronda anterior ya no es antepasado, diff completo con aviso', async () => {
+  await withRonda1(INFORME_R1('cambios-solicitados'), async (repo, tareas, revisionDir, commitR1) => {
+    // Reescribe la historia: el commit revisado en la ronda 1 deja de ser
+    // antepasado de HEAD (como un rebase o un amend).
+    git(['reset', '-q', '--soft', `${commitR1}~1`], repo);
+    git(['commit', '-q', '-m', 'trabajo reescrito'], repo);
+    const r2 = await runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo));
+    assert.equal(r2.desde, 'develop');
+    assert.match(r2.avisos.join('\n'), /ya no es antepasado de HEAD/);
+    const peticion = await readFile(path.join(revisionDir, 'peticion-revision-2.md'), 'utf8');
+    assert.match(peticion, /diff --git a\/src\/a\.ts/, 'el diff completo incluye lo de la ronda 1');
+  });
+});
+
+test('review incremental (TASK-040): start sobre una tarea en revision manda a review, no a plan', async () => {
+  await withRonda1(INFORME_R1('cambios-solicitados'), async (repo, tareas) => {
+    await assert.rejects(
+      runStartCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo)),
+      (e: unknown) =>
+        e instanceof StateMachineError && /taskctl review/.test(e.message) && !/taskctl plan/.test(e.message)
+    );
+  });
+});
+
+test('review incremental (TASK-040): si una escritura de la ronda falla, no deja ficheros de esa ronda', async (t) => {
+  await withRonda1(INFORME_R1('cambios-solicitados'), async (repo, tareas, revisionDir) => {
+    // Un fichero con otro case colisiona con el informe de la ronda 2 en
+    // un disco que no distingue mayusculas (NTFS, APFS por defecto); en
+    // uno que si las distingue no hay colision que provocar asi.
+    await writeFile(path.join(revisionDir, 'INFORME-REVISION-2.md'), 'x\n', 'utf8');
+    if (!existsSync(path.join(revisionDir, 'informe-revision-2.md'))) {
+      t.skip('disco que distingue mayusculas: no se puede provocar la colision');
+      return;
+    }
+    commitAll(repo, 'chore: colision');
+    await assert.rejects(runReviewCommand(tareas, ['TASK-950'], '2026-10-04', DEPS(repo)));
+    const nombres = await readdir(revisionDir);
+    assert.ok(!nombres.includes('peticion-revision-2.md'), `quedo la peticion a medias: ${nombres.join(', ')}`);
+  });
+});
+
+test('informe-revision (TASK-040): veredictos historicos, tabla ausente, fila de ejemplo y CRLF', () => {
+  assert.equal(veredictoDe('- Veredicto: cambios solicitados\n'), 'cambios-solicitados');
+  assert.equal(veredictoDe('- Veredicto: **cambios-solicitados**\n'), 'cambios-solicitados');
+  assert.equal(veredictoDe('- Veredicto: aprobada con menores documentados\n'), 'aprobada');
+  assert.equal(veredictoDe('- Veredicto: PENDIENTE (escribelo)\n'), 'pendiente');
+  assert.equal(veredictoDe('sin linea\n'), 'sin-linea');
+  assert.equal(veredictoDe('- Veredicto: quizas\n'), 'desconocido');
+  assert.equal(veredictoDeRonda(['- Veredicto: aprobada\n', '- Veredicto: cambios-solicitados\n']), 'cambios-solicitados');
+  assert.equal(veredictoDeRonda(['- Veredicto: PENDIENTE\n', '- Veredicto: cambios-solicitados\n']), 'pendiente');
+  assert.equal(commitRevisadoDe('- Commit revisado (HEAD): 9266966 ("fix...")\n'), '9266966');
+  assert.equal(commitRevisadoDe('sin commit\n'), null);
+  assert.deepEqual(hallazgosNoCerrados('## Hallazgos\n\nTodo en prosa.\n'), { tabla: false, abiertos: [] });
+  const crlf =
+    '## Hallazgos\r\n\r\n| ID | Severidad | Estado | Fichero |\r\n|---|---|---|---|\r\n' +
+    '| (ej. IMP-1) | x | abierto | y |\r\n| **IMP-2** | IMPORTANTE | Abierto | a.ts |\r\n' +
+    '| MEN-3 | MENOR | Aceptado | b.ts |\r\n';
+  assert.deepEqual(hallazgosNoCerrados(crlf), {
+    tabla: true,
+    abiertos: [{ id: 'IMP-2', severidad: 'IMPORTANTE', estado: 'Abierto', fichero: 'a.ts' }],
+  });
+});
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-040/tarea.md                                                                        |  43 -----------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-040/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-040/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-040/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-040/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-040/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-040/planificacion/plan-final.md                                    |   0
 tareas/02-en-curso/TASK-040/tarea.md                                                                         |  90 ++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |   8 +++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  42 +++--------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 156 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                               | 151 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js                                  |  23 +++++++++++++
 13 files changed, 411 insertions(+), 102 deletions(-)
````
