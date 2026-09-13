# Peticion de revision — TASK-020 (ronda 1)

- Tarea: TASK-020 — Comando taskctl codex-review (segunda opinión independiente)
- Rama revisada: feature/task-020-comando-taskctl-codex-review-segunda-opi
- Rama base: develop
- Commit revisado (HEAD): f938a8bb9890250247e239b2dfea3e23a1a53e04
- Fecha: 2026-09-13
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
f938a8b feat(TASK-020): taskctl codex-review, segunda opinion independiente con Codex CLI
2bf5952 chore(TASK-020): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-020/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-020/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-020/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-020/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-020/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md b/tareas/02-en-curso/TASK-020/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-020/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
rename to tareas/02-en-curso/TASK-020/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md
diff --git a/tareas/01-en-diseno/TASK-020/planificacion/brainstorm/peticion-unificador-1.md b/tareas/02-en-curso/TASK-020/planificacion/brainstorm/peticion-unificador-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-020/planificacion/brainstorm/peticion-unificador-1.md
rename to tareas/02-en-curso/TASK-020/planificacion/brainstorm/peticion-unificador-1.md
diff --git a/tareas/01-en-diseno/TASK-020/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-020/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-020/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-020/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-020/planificacion/brainstorm/salida-brainstorm-riesgos-1.md b/tareas/02-en-curso/TASK-020/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-020/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
rename to tareas/02-en-curso/TASK-020/planificacion/brainstorm/salida-brainstorm-riesgos-1.md
diff --git a/tareas/01-en-diseno/TASK-020/planificacion/plan-final.md b/tareas/02-en-curso/TASK-020/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-020/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-020/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-020/tarea.md b/tareas/02-en-curso/TASK-020/tarea.md
similarity index 87%
rename from tareas/01-en-diseno/TASK-020/tarea.md
rename to tareas/02-en-curso/TASK-020/tarea.md
index b0c85b1..6143742 100644
--- a/tareas/01-en-diseno/TASK-020/tarea.md
+++ b/tareas/02-en-curso/TASK-020/tarea.md
@@ -6,7 +6,7 @@ sprint: 3
 etiquetas: []
 complejidad: media
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-020-comando-taskctl-codex-review-segunda-opi
 asignado_a: charlie.bk@gmail.com
@@ -42,9 +42,9 @@ degradar con un aviso, sin romper el flujo (criterio de aceptación 3) —
 continúa en local" cuando no hay `origin`).
 
 ## Criterios de aceptacion
-- [ ] Solo se ejecuta si la revisión primaria ya está aprobada y la tarea tiene `revision_codex: true`.
-- [ ] Envuelve el CLI de Codex y guarda su salida en la carpeta de la tarea, sin mezclarla con la de la revisión primaria.
-- [ ] Si Codex falla por cualquier motivo (no instalado, `ENOENT`, o instalado pero con exit distinto de cero por auth/modelo/red/cuota — evidencia real: en esta máquina falla por incompatibilidad de cuenta/modelo), avisa y degrada con elegancia en vez de romper el flujo: `taskctl codex-review` sale con código 0, sin escribir `informe-codex-N.md`.
-- [ ] `informe-codex-N.md` vuelca la salida cruda de Codex como contexto (scaffold con veredicto `PENDIENTE`, mismo patrón que `informeTemplate` de la revisión primaria); un humano/agente la lee y escribe `- Veredicto: aprobada` o `- Veredicto: cambios-solicitados` — nunca se infiere del exit code de Codex, que no es una señal fiable (la propia evidencia de esta tarea lo confirma).
-- [ ] Si Codex se degrada y no llega a escribir informe, `revision_codex: true` sigue bloqueando `taskctl finish` fail-closed, sin excepción — la persona resuelve a mano (arregla/instala Codex y reintenta, o quita `revision_codex: true` si decide que esta tarea no necesita esa segunda opinión). El mensaje de `codex-review` deja claro por qué no se escribió informe.
-- [ ] Tests que cubren la precondición de estado, la ausencia del CLI (`ENOENT`) y un fallo con Codex presente pero con exit distinto de cero.
+- [x] Solo se ejecuta si la revisión primaria ya está aprobada y la tarea tiene `revision_codex: true`.
+- [x] Envuelve el CLI de Codex y guarda su salida en la carpeta de la tarea, sin mezclarla con la de la revisión primaria.
+- [x] Si Codex falla por cualquier motivo (no instalado, `ENOENT`, o instalado pero con exit distinto de cero por auth/modelo/red/cuota — evidencia real: en esta máquina falla por incompatibilidad de cuenta/modelo), avisa y degrada con elegancia en vez de romper el flujo: `taskctl codex-review` sale con código 0, sin escribir `informe-codex-N.md`.
+- [x] `informe-codex-N.md` vuelca la salida cruda de Codex como contexto (scaffold con veredicto `PENDIENTE`, mismo patrón que `informeTemplate` de la revisión primaria); un humano/agente la lee y escribe `- Veredicto: aprobada` o `- Veredicto: cambios-solicitados` — nunca se infiere del exit code de Codex, que no es una señal fiable (la propia evidencia de esta tarea lo confirma).
+- [x] Si Codex se degrada y no llega a escribir informe, `revision_codex: true` sigue bloqueando `taskctl finish` fail-closed, sin excepción — la persona resuelve a mano (arregla/instala Codex y reintenta, o quita `revision_codex: true` si decide que esta tarea no necesita esa segunda opinión). El mensaje de `codex-review` deja claro por qué no se escribió informe.
+- [x] Tests que cubren la precondición de estado, la ausencia del CLI (`ENOENT`) y un fallo con Codex presente pero con exit distinto de cero.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
index d16f859..ca43ec2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
@@ -13,6 +13,7 @@ import { RolesBrainstormError } from './core/roles-brainstorm.js';
 import { CatalogoSkillsError } from './core/catalogo-skills.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
+import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex-review.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { isWrapperCommand, runWrapperCommand, WrapperCommandError, } from './commands/wrappers.js';
 import { resolveGitflowScriptsDir, GitflowScriptLaunchError } from './fs/gitflow-runner.js';
@@ -43,6 +44,7 @@ Uso:
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--push]
   taskctl review TASK-NNN [--push]
+  taskctl codex-review TASK-NNN [--push]
   taskctl finish TASK-NNN [--push]
   taskctl diagnose
   taskctl pause [--push]
@@ -50,7 +52,7 @@ Uso:
   taskctl recover [<rama>]
   taskctl abort-merge
 
-Comandos: new, import, board, start, plan, approve, review, finish.
+Comandos: new, import, board, start, plan, approve, review, codex-review, finish.
 Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
 --asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
 taskctl commitea SOLO los ficheros que el mismo escribe (nunca "git add -A"):
@@ -461,6 +463,44 @@ export async function main(argv) {
             throw e;
         }
     }
+    if (cmd === 'codex-review') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runCodexReviewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+            if (result.degradado) {
+                // Codigo 0 a proposito (criterio de aceptacion 3): un Codex
+                // ausente o fallando no rompe el flujo. El aviso deja claro por
+                // que no hay informe (criterio de aceptacion 5) y que
+                // revision_codex sigue bloqueando "taskctl finish" tal cual.
+                printAvisos(`Codex ${result.motivoDegradacion} No se ha escrito informe-codex-N.md: si esta tarea ` +
+                    'tiene "revision_codex: true", "taskctl finish" sigue bloqueado hasta que haya un ' +
+                    'informe de Codex aprobado (arregla/instala codex y reintenta, o quita ' +
+                    '"revision_codex: true" si decides que esta tarea no necesita esa segunda opinion).');
+                process.stdout.write(`Tarea ${result.id}: codex-review degradado, sin informe escrito.\n`);
+            }
+            else {
+                process.stdout.write(`Tarea ${result.id}: informe de Codex (ronda ${result.ronda}) escrito en ` +
+                    `${result.informePath}.\n` +
+                    'Veredicto PENDIENTE: lee la salida de Codex embebida y sustituyelo por "aprobada" o ' +
+                    '"cambios-solicitados" antes de "taskctl finish".\n');
+            }
+            printAutoCommit(result.autoCommit);
+            return 0;
+        }
+        catch (e) {
+            if (e instanceof AutoCommitError ||
+                e instanceof ConfigError ||
+                e instanceof CodexReviewCommandError ||
+                e instanceof StateMachineError ||
+                e instanceof GitLaunchError ||
+                e instanceof GitCommandError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
     if (cmd === 'finish') {
         const repoCwd = process.cwd();
         const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js
new file mode 100644
index 0000000..d6d4cd8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js
@@ -0,0 +1,214 @@
+/**
+ * taskctl codex-review — TASK-020. Segunda opinion INDEPENDIENTE del
+ * agente revisor generico: envuelve el CLI de Codex (`codex-cli`)
+ * contra el diff completo de la rama (nunca fragmentado por
+ * dominio: Codex es un unico agente, no un enrutado — nota ya escrita
+ * en finish.ts sobre esto) y vuelca su salida cruda en
+ * `informe-codex-<ronda>.md`, con el mismo scaffold de veredicto
+ * PENDIENTE que usa `informeTemplate` de la revision primaria
+ * (`review.ts`).
+ *
+ * Solo se ejecuta si la tarea esta en-revision, `revision_codex: true`
+ * y la revision primaria de mayor ronda ya aprobo — se recalcula aqui
+ * con el MISMO criterio que `buildTransitionContext` de finish.ts (que
+ * no se toca ni se exporta, asi que este comando reimplementa esa
+ * unica pieza que necesita, en vez de acoplarse a un modulo interno de
+ * otro comando).
+ *
+ * Decision de Carlos (2026-09-12, plan-final.md): TODO fallo de
+ * "codex" — ausente del PATH (ENOENT) o presente pero con exit
+ * distinto de cero (auth/modelo/red/cuota, evidencia real en esta
+ * maquina) — degrada IGUAL: avisa, `taskctl codex-review` sale con
+ * codigo 0, sin escribir `informe-codex-N.md`. Este comando NUNCA
+ * infiere el veredicto del exit code de Codex, que no es una senal
+ * fiable (confirmado empiricamente): el veredicto lo escribe despues un
+ * humano/agente, sustituyendo la unica linea "- Veredicto: PENDIENTE".
+ *
+ * Sin informe aprobado, `revision_codex: true` sigue bloqueando
+ * "taskctl finish" fail-closed, sin excepcion (state-machine.ts y
+ * finish.ts YA lo hacen, y no se tocan en esta tarea).
+ */
+import path from 'node:path';
+import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
+import { readTareaFile, isEexist, isEnoent } from '../fs/task-store.js';
+import { siguienteRonda } from '../fs/rondas.js';
+import { fenceFor } from '../core/markdown.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import { headCommit, resolveBaseBranchForTipo, runCodexReview, } from '../fs/git.js';
+import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
+import { veredictoAprobado } from './finish.js';
+import { REVISION_DIRNAME } from './review.js';
+export class CodexReviewCommandError extends Error {
+}
+/**
+ * Mismo patron que INFORME_REVISION_RE de finish.ts (no exportada de
+ * alli, asi que se redefine aqui: una unica linea de regex duplicada es
+ * mas barato que acoplar codex-review.ts a un simbolo interno de otro
+ * comando). Acepta el sufijo opcional de dominio de TASK-018.
+ */
+const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
+/**
+ * Regex de la ronda de Codex. Codex lleva SU PROPIO contador de ronda,
+ * independiente del de la revision primaria (no hay garantia de que
+ * coincidan: una tarea puede reintentar codex-review sin que la
+ * revision primaria haya tenido una ronda nueva).
+ */
+export const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
+/**
+ * true si TODOS los informes de la ronda de MAYOR numero de la revision
+ * primaria aprueban — mismo criterio fail-closed que
+ * `buildTransitionContext` de finish.ts (informesDeLaRonda +
+ * veredictoAprobado), reimplementado aqui porque esa funcion no esta
+ * exportada. Un directorio de revision/ inexistente (tarea que nunca
+ * paso por "taskctl review") da false, no un error.
+ */
+async function revisionPrimariaAprobadaDe(revisionDir) {
+    let entries;
+    try {
+        entries = await readdir(revisionDir);
+    }
+    catch (e) {
+        if (isEnoent(e))
+            return false;
+        throw e;
+    }
+    let max = 0;
+    let nombres = [];
+    for (const entry of entries) {
+        const m = INFORME_REVISION_RE.exec(entry);
+        if (m === null)
+            continue;
+        const n = Number(m[1]);
+        if (n > max) {
+            max = n;
+            nombres = [entry];
+        }
+        else if (n === max) {
+            nombres.push(entry);
+        }
+    }
+    if (nombres.length === 0)
+        return false;
+    const contenidos = await Promise.all(nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8')));
+    return contenidos.every((c) => veredictoAprobado(c));
+}
+/**
+ * Instrucciones que se le pasan a Codex como PROMPT posicional (el CLI
+ * ya calcula el diff el mismo con --base, no hace falta embeberlo).
+ * Mismo espiritu que las instrucciones de peticionTemplate en
+ * review.ts: revisor independiente, hallazgos clasificados.
+ */
+function codexPrompt(task) {
+    return (`Eres una segunda opinion INDEPENDIENTE sobre ${task.id} (${task.titulo}), ya revisada por ` +
+        'otro agente. Clasifica cada hallazgo como CRITICO (perdida de datos, corrupcion de estado, ' +
+        'el codigo hace lo contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un ' +
+        'caso real) o MENOR (todo lo demas). Un "sin hallazgos" explicito tambien vale.');
+}
+/**
+ * Scaffold del informe de Codex: mismo contrato que `informeTemplate`
+ * de review.ts — taskctl finish exige que TODAS las lineas
+ * "- Veredicto:" aprueben, asi que hay que SUSTITUIR esta unica linea,
+ * no anadir otra. La salida cruda de Codex se vuelca tal cual, sin
+ * parsear ni recortar: no trae flag --json (riesgo aceptado del plan),
+ * asi que mezclarla con nuestro propio Markdown iria contra la propia
+ * regla de "no inferir nada de esa salida".
+ */
+export function codexInformeTemplate(task, commitRevisado, ronda, salidaCodex) {
+    const bloque = salidaCodex.trim() === '' ? '(codex no escribio nada por stdout)' : salidaCodex;
+    const fence = fenceFor(bloque);
+    return (`# Informe de Codex (segunda opinion) — ${task.id} (ronda ${ronda})\n\n` +
+        `- Commit revisado: ${commitRevisado}\n` +
+        '- Revisor: codex-cli (segunda opinion independiente, TASK-020)\n' +
+        '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados" ' +
+        'tras leer la salida de abajo; taskctl NUNCA infiere el veredicto del exit code de codex)\n\n' +
+        '## Salida cruda de "codex review"\n\n' +
+        `${fence}\n` +
+        `${bloque}\n` +
+        `${fence}\n`);
+}
+/**
+ * `today` se recibe por simetria con el resto de comandos del ciclo de
+ * vida (mismo cableado desde cli.ts), pero NO se usa: a diferencia de
+ * review/finish, "codex-review" no reescribe tarea.md ni le cambia el
+ * estado (sigue en-revision) — solo anade un informe dentro de
+ * revision/, asi que no hay ningun campo "actualizado" que tocar.
+ */
+export async function runCodexReviewCommand(tareasRoot, argv, _today, deps) {
+    const { push, resto } = extraerPushFlag(argv);
+    const id = resto[0];
+    if (id === undefined || id.trim() === '') {
+        throw new CodexReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl codex-review TASK-NNN.');
+    }
+    const existing = await readTareaFile(tareasRoot, id);
+    const revisionDir = existing === null ? null : path.join(path.dirname(existing.filePath), REVISION_DIRNAME);
+    const revisionPrimariaAprobada = revisionDir === null ? false : await revisionPrimariaAprobadaDe(revisionDir);
+    assertTransitionAllowed('codex-review', existing ? existing.task : null, {
+        revisionPrimariaAprobada,
+    });
+    const { task, filePath } = existing;
+    const baseBranch = resolveBaseBranchForTipo(task.tipo, deps.repoCwd);
+    const commitRevisado = headCommit(deps.repoCwd);
+    const runCodex = deps.runCodex ?? runCodexReview;
+    const outcome = runCodex({
+        args: ['review', '--base', baseBranch, '--title', `${task.id}: ${task.titulo}`, codexPrompt(task)],
+        cwd: deps.repoCwd,
+    });
+    let degradado;
+    let motivoDegradacion;
+    let ronda = null;
+    let informePath = null;
+    if (!outcome.lanzado) {
+        degradado = true;
+        motivoDegradacion =
+            `no se pudo ejecutar "codex" (${outcome.errorLanzamiento?.message ?? 'motivo desconocido'}). ` +
+                'Probablemente no esta instalado o no esta en el PATH.';
+    }
+    else if (outcome.code !== 0) {
+        degradado = true;
+        motivoDegradacion =
+            `"codex review" termino con codigo ${outcome.code}. Puede deberse a auth/modelo/red/cuota, ` +
+                'no necesariamente a un problema del diff (evidencia real en esta misma maquina). Arregla ' +
+                'o reinstala codex y reintenta.';
+    }
+    else {
+        degradado = false;
+        motivoDegradacion = null;
+    }
+    if (!degradado) {
+        const revisionDirEscritura = path.join(path.dirname(filePath), REVISION_DIRNAME);
+        await mkdir(revisionDirEscritura, { recursive: true });
+        ronda = await siguienteRonda(revisionDirEscritura, INFORME_CODEX_RE);
+        const nombreInforme = `informe-codex-${ronda}.md`;
+        try {
+            await writeFile(path.join(revisionDirEscritura, nombreInforme), codexInformeTemplate(task, commitRevisado, ronda, outcome.stdout), { encoding: 'utf8', flag: 'wx' });
+        }
+        catch (e) {
+            if (!isEexist(e))
+                throw e;
+            throw new CodexReviewCommandError(`[ERROR] ${id}: ya existe ${nombreInforme} en ${revisionDirEscritura} (¿otra invocacion ` +
+                'concurrente de "taskctl codex-review" calculo la misma ronda?). No se ha escrito nada ' +
+                'nuevo; reintenta.');
+        }
+        informePath = path.join(revisionDirEscritura, nombreInforme);
+    }
+    // Paso 5 de la 8.3 (TASK-030, item C2), mismo patron que review.ts.
+    // Se llama SIEMPRE, tambien degradado: si no hubo nada nuevo que
+    // escribir, autoCommit se limita a decir "nada que commitear".
+    const commitResult = autoCommit({
+        cwd: deps.repoCwd,
+        rutas: [path.dirname(filePath)],
+        mensaje: mensajeChore(task.id, degradado ? 'codex-review degradado (sin informe)' : `informe de codex ronda ${String(ronda)}`),
+        push,
+    });
+    return {
+        id: task.id,
+        rama: task.rama,
+        baseBranch,
+        commitRevisado,
+        degradado,
+        motivoDegradacion,
+        ronda,
+        informePath,
+        autoCommit: commitResult,
+    };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js
index 684f45c..2035d04 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js
@@ -277,6 +277,24 @@ export function diffNameOnly(desde, hasta, cwd) {
         .split('\n')
         .filter((line) => line !== '');
 }
+/**
+ * Lanza "codex review <args>" en `cwd`. Inyectable como dependencia en
+ * `codex-review.ts` (`deps.runCodex`) precisamente para que los tests
+ * puedan simular ENOENT o un exit distinto de cero sin depender del
+ * binario real ni de red — el mismo motivo por el que `review.ts`
+ * inyecta `deps.scriptsDir` en vez de invocar sus scripts a ciegas.
+ */
+export function runCodexReview(invocation) {
+    const result = spawnSync('codex', invocation.args, {
+        cwd: invocation.cwd,
+        encoding: 'utf8',
+        maxBuffer: GIT_MAX_BUFFER,
+    });
+    if (result.error) {
+        return { lanzado: false, code: null, stdout: '', errorLanzamiento: result.error };
+    }
+    return { lanzado: true, code: result.status, stdout: result.stdout ?? '', errorLanzamiento: null };
+}
 /**
  * `git diff <desde>..<hasta> -- <paths>`, acotado a un subconjunto de
  * ficheros (TASK-018): el sub-diff que recibe cada revisor de dominio,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 8371664..6c88087 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -13,6 +13,7 @@ import { RolesBrainstormError } from './core/roles-brainstorm.js';
 import { CatalogoSkillsError } from './core/catalogo-skills.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
+import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex-review.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import {
   isWrapperCommand,
@@ -54,6 +55,7 @@ Uso:
   taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
   taskctl approve TASK-NNN [--push]
   taskctl review TASK-NNN [--push]
+  taskctl codex-review TASK-NNN [--push]
   taskctl finish TASK-NNN [--push]
   taskctl diagnose
   taskctl pause [--push]
@@ -61,7 +63,7 @@ Uso:
   taskctl recover [<rama>]
   taskctl abort-merge
 
-Comandos: new, import, board, start, plan, approve, review, finish.
+Comandos: new, import, board, start, plan, approve, review, codex-review, finish.
 Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
 --asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
 taskctl commitea SOLO los ficheros que el mismo escribe (nunca "git add -A"):
@@ -517,6 +519,49 @@ export async function main(argv: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'codex-review') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const result = await runCodexReviewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+      if (result.degradado) {
+        // Codigo 0 a proposito (criterio de aceptacion 3): un Codex
+        // ausente o fallando no rompe el flujo. El aviso deja claro por
+        // que no hay informe (criterio de aceptacion 5) y que
+        // revision_codex sigue bloqueando "taskctl finish" tal cual.
+        printAvisos(
+          `Codex ${result.motivoDegradacion} No se ha escrito informe-codex-N.md: si esta tarea ` +
+            'tiene "revision_codex: true", "taskctl finish" sigue bloqueado hasta que haya un ' +
+            'informe de Codex aprobado (arregla/instala codex y reintenta, o quita ' +
+            '"revision_codex: true" si decides que esta tarea no necesita esa segunda opinion).'
+        );
+        process.stdout.write(`Tarea ${result.id}: codex-review degradado, sin informe escrito.\n`);
+      } else {
+        process.stdout.write(
+          `Tarea ${result.id}: informe de Codex (ronda ${result.ronda}) escrito en ` +
+            `${result.informePath}.\n` +
+            'Veredicto PENDIENTE: lee la salida de Codex embebida y sustituyelo por "aprobada" o ' +
+            '"cambios-solicitados" antes de "taskctl finish".\n'
+        );
+      }
+      printAutoCommit(result.autoCommit);
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof CodexReviewCommandError ||
+        e instanceof StateMachineError ||
+        e instanceof GitLaunchError ||
+        e instanceof GitCommandError
+      ) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'finish') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
new file mode 100644
index 0000000..8c572fa
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
@@ -0,0 +1,288 @@
+/**
+ * taskctl codex-review — TASK-020. Segunda opinion INDEPENDIENTE del
+ * agente revisor generico: envuelve el CLI de Codex (`codex-cli`)
+ * contra el diff completo de la rama (nunca fragmentado por
+ * dominio: Codex es un unico agente, no un enrutado — nota ya escrita
+ * en finish.ts sobre esto) y vuelca su salida cruda en
+ * `informe-codex-<ronda>.md`, con el mismo scaffold de veredicto
+ * PENDIENTE que usa `informeTemplate` de la revision primaria
+ * (`review.ts`).
+ *
+ * Solo se ejecuta si la tarea esta en-revision, `revision_codex: true`
+ * y la revision primaria de mayor ronda ya aprobo — se recalcula aqui
+ * con el MISMO criterio que `buildTransitionContext` de finish.ts (que
+ * no se toca ni se exporta, asi que este comando reimplementa esa
+ * unica pieza que necesita, en vez de acoplarse a un modulo interno de
+ * otro comando).
+ *
+ * Decision de Carlos (2026-09-12, plan-final.md): TODO fallo de
+ * "codex" — ausente del PATH (ENOENT) o presente pero con exit
+ * distinto de cero (auth/modelo/red/cuota, evidencia real en esta
+ * maquina) — degrada IGUAL: avisa, `taskctl codex-review` sale con
+ * codigo 0, sin escribir `informe-codex-N.md`. Este comando NUNCA
+ * infiere el veredicto del exit code de Codex, que no es una senal
+ * fiable (confirmado empiricamente): el veredicto lo escribe despues un
+ * humano/agente, sustituyendo la unica linea "- Veredicto: PENDIENTE".
+ *
+ * Sin informe aprobado, `revision_codex: true` sigue bloqueando
+ * "taskctl finish" fail-closed, sin excepcion (state-machine.ts y
+ * finish.ts YA lo hacen, y no se tocan en esta tarea).
+ */
+import path from 'node:path';
+import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
+import type { Task } from '../core/task.js';
+import { readTareaFile, isEexist, isEnoent } from '../fs/task-store.js';
+import { siguienteRonda } from '../fs/rondas.js';
+import { fenceFor } from '../core/markdown.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import {
+  headCommit,
+  resolveBaseBranchForTipo,
+  runCodexReview,
+  type CodexReviewInvocation,
+  type CodexReviewOutcome,
+} from '../fs/git.js';
+import {
+  autoCommit,
+  extraerPushFlag,
+  mensajeChore,
+  type AutoCommitResult,
+} from '../fs/git-commit.js';
+import { veredictoAprobado } from './finish.js';
+import { REVISION_DIRNAME } from './review.js';
+
+export class CodexReviewCommandError extends Error {}
+
+/**
+ * Mismo patron que INFORME_REVISION_RE de finish.ts (no exportada de
+ * alli, asi que se redefine aqui: una unica linea de regex duplicada es
+ * mas barato que acoplar codex-review.ts a un simbolo interno de otro
+ * comando). Acepta el sufijo opcional de dominio de TASK-018.
+ */
+const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
+
+/**
+ * Regex de la ronda de Codex. Codex lleva SU PROPIO contador de ronda,
+ * independiente del de la revision primaria (no hay garantia de que
+ * coincidan: una tarea puede reintentar codex-review sin que la
+ * revision primaria haya tenido una ronda nueva).
+ */
+export const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
+
+export interface CodexReviewCommandDeps {
+  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
+  repoCwd: string;
+  /**
+   * Funcion que lanza "codex review ...". Por defecto, runCodexReview
+   * de fs/git.ts (spawnSync real contra el binario "codex"). Inyectable
+   * en tests para simular ENOENT o un exit distinto de cero sin
+   * depender del binario real ni de red.
+   */
+  runCodex?: (invocation: CodexReviewInvocation) => CodexReviewOutcome;
+}
+
+export interface CodexReviewCommandResult {
+  id: string;
+  rama: string;
+  baseBranch: string;
+  /** SHA de HEAD en el momento de invocar a Codex. */
+  commitRevisado: string;
+  /** true si Codex no llego a producir un informe (ausente o exit != 0). */
+  degradado: boolean;
+  /** Motivo legible de la degradacion, null si no degrado. */
+  motivoDegradacion: string | null;
+  /** Ronda del informe de Codex escrito, null si degradado. */
+  ronda: number | null;
+  /** Ruta del informe escrito, null si degradado. */
+  informePath: string | null;
+  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
+  autoCommit: AutoCommitResult;
+}
+
+/**
+ * true si TODOS los informes de la ronda de MAYOR numero de la revision
+ * primaria aprueban — mismo criterio fail-closed que
+ * `buildTransitionContext` de finish.ts (informesDeLaRonda +
+ * veredictoAprobado), reimplementado aqui porque esa funcion no esta
+ * exportada. Un directorio de revision/ inexistente (tarea que nunca
+ * paso por "taskctl review") da false, no un error.
+ */
+async function revisionPrimariaAprobadaDe(revisionDir: string): Promise<boolean> {
+  let entries: string[];
+  try {
+    entries = await readdir(revisionDir);
+  } catch (e: unknown) {
+    if (isEnoent(e)) return false;
+    throw e;
+  }
+  let max = 0;
+  let nombres: string[] = [];
+  for (const entry of entries) {
+    const m = INFORME_REVISION_RE.exec(entry);
+    if (m === null) continue;
+    const n = Number(m[1]);
+    if (n > max) {
+      max = n;
+      nombres = [entry];
+    } else if (n === max) {
+      nombres.push(entry);
+    }
+  }
+  if (nombres.length === 0) return false;
+  const contenidos = await Promise.all(
+    nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8'))
+  );
+  return contenidos.every((c) => veredictoAprobado(c));
+}
+
+/**
+ * Instrucciones que se le pasan a Codex como PROMPT posicional (el CLI
+ * ya calcula el diff el mismo con --base, no hace falta embeberlo).
+ * Mismo espiritu que las instrucciones de peticionTemplate en
+ * review.ts: revisor independiente, hallazgos clasificados.
+ */
+function codexPrompt(task: Task): string {
+  return (
+    `Eres una segunda opinion INDEPENDIENTE sobre ${task.id} (${task.titulo}), ya revisada por ` +
+    'otro agente. Clasifica cada hallazgo como CRITICO (perdida de datos, corrupcion de estado, ' +
+    'el codigo hace lo contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un ' +
+    'caso real) o MENOR (todo lo demas). Un "sin hallazgos" explicito tambien vale.'
+  );
+}
+
+/**
+ * Scaffold del informe de Codex: mismo contrato que `informeTemplate`
+ * de review.ts — taskctl finish exige que TODAS las lineas
+ * "- Veredicto:" aprueben, asi que hay que SUSTITUIR esta unica linea,
+ * no anadir otra. La salida cruda de Codex se vuelca tal cual, sin
+ * parsear ni recortar: no trae flag --json (riesgo aceptado del plan),
+ * asi que mezclarla con nuestro propio Markdown iria contra la propia
+ * regla de "no inferir nada de esa salida".
+ */
+export function codexInformeTemplate(
+  task: Task,
+  commitRevisado: string,
+  ronda: number,
+  salidaCodex: string
+): string {
+  const bloque = salidaCodex.trim() === '' ? '(codex no escribio nada por stdout)' : salidaCodex;
+  const fence = fenceFor(bloque);
+  return (
+    `# Informe de Codex (segunda opinion) — ${task.id} (ronda ${ronda})\n\n` +
+    `- Commit revisado: ${commitRevisado}\n` +
+    '- Revisor: codex-cli (segunda opinion independiente, TASK-020)\n' +
+    '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados" ' +
+    'tras leer la salida de abajo; taskctl NUNCA infiere el veredicto del exit code de codex)\n\n' +
+    '## Salida cruda de "codex review"\n\n' +
+    `${fence}\n` +
+    `${bloque}\n` +
+    `${fence}\n`
+  );
+}
+
+/**
+ * `today` se recibe por simetria con el resto de comandos del ciclo de
+ * vida (mismo cableado desde cli.ts), pero NO se usa: a diferencia de
+ * review/finish, "codex-review" no reescribe tarea.md ni le cambia el
+ * estado (sigue en-revision) — solo anade un informe dentro de
+ * revision/, asi que no hay ningun campo "actualizado" que tocar.
+ */
+export async function runCodexReviewCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  _today: string,
+  deps: CodexReviewCommandDeps
+): Promise<CodexReviewCommandResult> {
+  const { push, resto } = extraerPushFlag(argv);
+  const id = resto[0];
+  if (id === undefined || id.trim() === '') {
+    throw new CodexReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl codex-review TASK-NNN.');
+  }
+
+  const existing = await readTareaFile(tareasRoot, id);
+  const revisionDir =
+    existing === null ? null : path.join(path.dirname(existing.filePath), REVISION_DIRNAME);
+  const revisionPrimariaAprobada =
+    revisionDir === null ? false : await revisionPrimariaAprobadaDe(revisionDir);
+  assertTransitionAllowed('codex-review', existing ? existing.task : null, {
+    revisionPrimariaAprobada,
+  });
+  const { task, filePath } = existing!;
+
+  const baseBranch = resolveBaseBranchForTipo(task.tipo, deps.repoCwd);
+  const commitRevisado = headCommit(deps.repoCwd);
+
+  const runCodex = deps.runCodex ?? runCodexReview;
+  const outcome = runCodex({
+    args: ['review', '--base', baseBranch, '--title', `${task.id}: ${task.titulo}`, codexPrompt(task)],
+    cwd: deps.repoCwd,
+  });
+
+  let degradado: boolean;
+  let motivoDegradacion: string | null;
+  let ronda: number | null = null;
+  let informePath: string | null = null;
+
+  if (!outcome.lanzado) {
+    degradado = true;
+    motivoDegradacion =
+      `no se pudo ejecutar "codex" (${outcome.errorLanzamiento?.message ?? 'motivo desconocido'}). ` +
+      'Probablemente no esta instalado o no esta en el PATH.';
+  } else if (outcome.code !== 0) {
+    degradado = true;
+    motivoDegradacion =
+      `"codex review" termino con codigo ${outcome.code}. Puede deberse a auth/modelo/red/cuota, ` +
+      'no necesariamente a un problema del diff (evidencia real en esta misma maquina). Arregla ' +
+      'o reinstala codex y reintenta.';
+  } else {
+    degradado = false;
+    motivoDegradacion = null;
+  }
+
+  if (!degradado) {
+    const revisionDirEscritura = path.join(path.dirname(filePath), REVISION_DIRNAME);
+    await mkdir(revisionDirEscritura, { recursive: true });
+    ronda = await siguienteRonda(revisionDirEscritura, INFORME_CODEX_RE);
+    const nombreInforme = `informe-codex-${ronda}.md`;
+    try {
+      await writeFile(
+        path.join(revisionDirEscritura, nombreInforme),
+        codexInformeTemplate(task, commitRevisado, ronda, outcome.stdout),
+        { encoding: 'utf8', flag: 'wx' }
+      );
+    } catch (e: unknown) {
+      if (!isEexist(e)) throw e;
+      throw new CodexReviewCommandError(
+        `[ERROR] ${id}: ya existe ${nombreInforme} en ${revisionDirEscritura} (¿otra invocacion ` +
+          'concurrente de "taskctl codex-review" calculo la misma ronda?). No se ha escrito nada ' +
+          'nuevo; reintenta.'
+      );
+    }
+    informePath = path.join(revisionDirEscritura, nombreInforme);
+  }
+
+  // Paso 5 de la 8.3 (TASK-030, item C2), mismo patron que review.ts.
+  // Se llama SIEMPRE, tambien degradado: si no hubo nada nuevo que
+  // escribir, autoCommit se limita a decir "nada que commitear".
+  const commitResult = autoCommit({
+    cwd: deps.repoCwd,
+    rutas: [path.dirname(filePath)],
+    mensaje: mensajeChore(
+      task.id,
+      degradado ? 'codex-review degradado (sin informe)' : `informe de codex ronda ${String(ronda)}`
+    ),
+    push,
+  });
+
+  return {
+    id: task.id,
+    rama: task.rama,
+    baseBranch,
+    commitRevisado,
+    degradado,
+    motivoDegradacion,
+    ronda,
+    informePath,
+    autoCommit: commitResult,
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 1412afe..cd7b5ca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -288,6 +288,57 @@ export function diffNameOnly(desde: string, hasta: string, cwd: string): string[
     .filter((line) => line !== '');
 }
 
+/**
+ * Resultado de intentar lanzar "codex review ..." (TASK-020). NUNCA
+ * lanza una excepcion, a diferencia de runGit: ni por ENOENT (codex no
+ * instalado) ni por un exit distinto de cero (fallo de auth, modelo,
+ * red o cuota — evidencia real en esta maquina). Decision de Carlos:
+ * los dos casos degradan EXACTAMENTE IGUAL en "taskctl codex-review"
+ * (avisa, sale con codigo 0, no escribe informe), asi que el wrapper se
+ * limita a informar que paso — no decide el mismo si eso cuenta como
+ * fallo, para no duplicar esa politica aqui y en el comando.
+ */
+export interface CodexReviewInvocation {
+  /** Argumentos para "codex" (sin el nombre del binario). */
+  args: readonly string[];
+  cwd: string;
+}
+
+export interface CodexReviewOutcome {
+  /**
+   * true si el proceso "codex" se pudo LANZAR, con independencia de si
+   * termino en exit 0 o no. false solo cuando ni siquiera arranco
+   * (ENOENT u otro fallo de spawn) — mismo campo "result.error" que
+   * runGit inspecciona, pero devuelto en vez de lanzado como excepcion.
+   */
+  lanzado: boolean;
+  /** Codigo de salida de "codex", o null si ni siquiera se pudo lanzar. */
+  code: number | null;
+  /** Salida estandar cruda ('' si no se lanzo). */
+  stdout: string;
+  /** Motivo por el que no se pudo lanzar, null si lanzado es true. */
+  errorLanzamiento: Error | null;
+}
+
+/**
+ * Lanza "codex review <args>" en `cwd`. Inyectable como dependencia en
+ * `codex-review.ts` (`deps.runCodex`) precisamente para que los tests
+ * puedan simular ENOENT o un exit distinto de cero sin depender del
+ * binario real ni de red — el mismo motivo por el que `review.ts`
+ * inyecta `deps.scriptsDir` en vez de invocar sus scripts a ciegas.
+ */
+export function runCodexReview(invocation: CodexReviewInvocation): CodexReviewOutcome {
+  const result = spawnSync('codex', invocation.args, {
+    cwd: invocation.cwd,
+    encoding: 'utf8',
+    maxBuffer: GIT_MAX_BUFFER,
+  });
+  if (result.error) {
+    return { lanzado: false, code: null, stdout: '', errorLanzamiento: result.error };
+  }
+  return { lanzado: true, code: result.status, stdout: result.stdout ?? '', errorLanzamiento: null };
+}
+
 /**
  * `git diff <desde>..<hasta> -- <paths>`, acotado a un subconjunto de
  * ficheros (TASK-018): el sub-diff que recibe cada revisor de dominio,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts
new file mode 100644
index 0000000..3b1c39d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/codex-review.test.ts
@@ -0,0 +1,384 @@
+/**
+ * Test de integracion real (no mocks) para taskctl codex-review
+ * (TASK-020): repos Git temporales de verdad (nunca mocks de Git), y el
+ * spawn de "codex" inyectado como dependencia (deps.runCodex) para
+ * simular ENOENT y un exit distinto de cero sin depender del binario
+ * real ni de red — mismo espiritu que review.test.ts (TASK-013) y
+ * finish.test.ts (TASK-014), que inyectan deps.scriptsDir en vez de
+ * fiarse de los scripts reales del sistema.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import {
+  runCodexReviewCommand,
+  CodexReviewCommandError,
+  codexInformeTemplate,
+} from '../../src/commands/codex-review.js';
+import type { CodexReviewInvocation, CodexReviewOutcome } from '../../src/fs/git.js';
+import { StateMachineError } from '../../src/core/state-machine.js';
+import type { Task } from '../../src/core/task.js';
+
+function sampleTask(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-800',
+    titulo: 'Tarea de prueba de codex-review',
+    tipo: 'feature',
+    sprint: 3,
+    etiquetas: [],
+    complejidad: 'media',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-revision',
+    plan_aprobado: true,
+    rama: 'feature/task-800-prueba-codex-review',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: true,
+    creado: '2026-09-05',
+    actualizado: '2026-09-05',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+/**
+ * Commit de SETUP del test. Igual que en review.test.ts/finish.test.ts:
+ * desde TASK-030 taskctl commitea lo que el mismo escribe, asi que
+ * llamar a esto justo despues de un comando puede no tener ya nada que
+ * registrar.
+ */
+function commitAll(repoRoot: string, message: string): void {
+  git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
+  git(['commit', '-q', '-m', message], repoRoot);
+}
+
+async function withTempRepo(
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-codex-review-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+const VEREDICTO_APROBADO = '- Veredicto: aprobada (revisada por el agente independiente)\n';
+
+/**
+ * Deja la tarea en-revision en su rama, con el informe de la ronda 1 de
+ * la revision PRIMARIA ya commiteado (aprobado por defecto): el estado
+ * en el que "taskctl review" mas un revisor humano/agente dejarian la
+ * tarea antes de poder ejecutar "taskctl codex-review".
+ */
+async function setupTaskEnRevision(
+  repoRoot: string,
+  tareasRoot: string,
+  task: Task,
+  opts: { veredictoPrimaria?: string } = {}
+): Promise<void> {
+  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar codex-review.\n');
+  await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
+  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
+  await mkdir(revisionDir, { recursive: true });
+  await writeFile(
+    path.join(revisionDir, 'informe-revision-1.md'),
+    `# Informe de revision — ${task.id} (ronda 1)\n\n${opts.veredictoPrimaria ?? VEREDICTO_APROBADO}`,
+    'utf8'
+  );
+  commitAll(repoRoot, `feat(${task.id}): trabajo revisado, listo para codex-review`);
+}
+
+function fakeRunCodex(
+  parcial: Partial<CodexReviewOutcome>
+): (invocation: CodexReviewInvocation) => CodexReviewOutcome {
+  return () => ({ lanzado: true, code: 0, stdout: '', errorLanzamiento: null, ...parcial });
+}
+
+test('codexInformeTemplate: scaffold con veredicto PENDIENTE y la salida cruda embebida', () => {
+  const task = sampleTask();
+  const informe = codexInformeTemplate(task, 'abc1234', 1, 'hallazgo sintetico de codex\n');
+  assert.match(informe, /Informe de Codex \(segunda opinion\) — TASK-800 \(ronda 1\)/);
+  assert.match(informe, /Veredicto: PENDIENTE/);
+  assert.match(informe, /hallazgo sintetico de codex/);
+  assert.match(informe, /codex-cli/);
+});
+
+test('taskctl codex-review: rechaza si revision_codex no esta activada, sin invocar codex', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-801', rama: 'feature/task-801-sin-codex', revision_codex: false });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    let invocado = false;
+    await assert.rejects(
+      () =>
+        runCodexReviewCommand(tareasRoot, ['TASK-801'], '2026-09-13', {
+          repoCwd: repoRoot,
+          runCodex: () => {
+            invocado = true;
+            return { lanzado: true, code: 0, stdout: '', errorLanzamiento: null };
+          },
+        }),
+      StateMachineError
+    );
+    assert.equal(invocado, false, 'codex no deberia invocarse si la precondicion ya rechaza');
+    await assert.rejects(() => stat(path.join(tareasRoot, '03-en-revision', 'TASK-801', 'revision', 'informe-codex-1.md')));
+  });
+});
+
+test('taskctl codex-review: rechaza si la revision primaria no esta aprobada (PENDIENTE o cambios-solicitados)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({
+      id: 'TASK-802',
+      rama: 'feature/task-802-primaria-pendiente',
+    });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, {
+      veredictoPrimaria: '- Veredicto: cambios-solicitados\n',
+    });
+
+    await assert.rejects(
+      () =>
+        runCodexReviewCommand(tareasRoot, ['TASK-802'], '2026-09-13', {
+          repoCwd: repoRoot,
+          runCodex: fakeRunCodex({}),
+        }),
+      (e: unknown) => {
+        assert.ok(e instanceof StateMachineError);
+        assert.match((e as Error).message, /revision primaria aprobada/);
+        return true;
+      }
+    );
+  });
+});
+
+test('taskctl codex-review: rechaza una tarea que no esta en-revision', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({
+      id: 'TASK-803',
+      rama: 'feature/task-803-en-curso',
+      estado: 'en-curso',
+    });
+    git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
+    await writeTareaFile(tareasRoot, task, '');
+    commitAll(repoRoot, 'tarea en curso');
+
+    await assert.rejects(
+      () =>
+        runCodexReviewCommand(tareasRoot, ['TASK-803'], '2026-09-13', {
+          repoCwd: repoRoot,
+          runCodex: fakeRunCodex({}),
+        }),
+      StateMachineError
+    );
+  });
+});
+
+test('taskctl codex-review: codex ausente (ENOENT simulado) degrada con aviso, sin escribir informe (criterio 3)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-804', rama: 'feature/task-804-codex-ausente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const enoent = Object.assign(new Error('spawnSync codex ENOENT'), { code: 'ENOENT' });
+    const result = await runCodexReviewCommand(tareasRoot, ['TASK-804'], '2026-09-13', {
+      repoCwd: repoRoot,
+      runCodex: () => ({ lanzado: false, code: null, stdout: '', errorLanzamiento: enoent }),
+    });
+
+    assert.equal(result.degradado, true);
+    assert.match(result.motivoDegradacion ?? '', /no se pudo ejecutar "codex"/);
+    assert.equal(result.ronda, null);
+    assert.equal(result.informePath, null);
+    await assert.rejects(() =>
+      stat(path.join(tareasRoot, '03-en-revision', 'TASK-804', 'revision', 'informe-codex-1.md'))
+    );
+    // "revision_codex" sigue bloqueando finish: solo hay el informe de
+    // la revision primaria, ninguno de Codex.
+    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-804', 'revision');
+    const entradas = await import('node:fs/promises').then((m) => m.readdir(revisionDir));
+    assert.ok(!entradas.some((e) => /^informe-codex-/.test(e)));
+  });
+});
+
+test('taskctl codex-review: codex presente pero exit distinto de cero degrada igual que la ausencia (criterio 3, decision de Carlos)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-805', rama: 'feature/task-805-codex-falla' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const result = await runCodexReviewCommand(tareasRoot, ['TASK-805'], '2026-09-13', {
+      repoCwd: repoRoot,
+      runCodex: () => ({
+        lanzado: true,
+        code: 1,
+        stdout: 'error: model not supported for this account\n',
+        errorLanzamiento: null,
+      }),
+    });
+
+    assert.equal(result.degradado, true);
+    assert.match(result.motivoDegradacion ?? '', /codigo 1/);
+    assert.equal(result.ronda, null);
+    assert.equal(result.informePath, null);
+    await assert.rejects(() =>
+      stat(path.join(tareasRoot, '03-en-revision', 'TASK-805', 'revision', 'informe-codex-1.md'))
+    );
+  });
+});
+
+test('taskctl codex-review: codex corre bien (exit 0) escribe informe-codex-1.md con la salida embebida y veredicto PENDIENTE (criterio 4)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-806', rama: 'feature/task-806-codex-ok' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const salidaSintetica = '## Hallazgos de codex\n\nCRITICO: nada encontrado, ejemplo sintetico.\n';
+    const args: { invocation: CodexReviewInvocation | null } = { invocation: null };
+    const result = await runCodexReviewCommand(tareasRoot, ['TASK-806'], '2026-09-13', {
+      repoCwd: repoRoot,
+      runCodex: (invocation) => {
+        args.invocation = invocation;
+        return { lanzado: true, code: 0, stdout: salidaSintetica, errorLanzamiento: null };
+      },
+    });
+
+    assert.equal(result.degradado, false);
+    assert.equal(result.motivoDegradacion, null);
+    assert.equal(result.ronda, 1);
+    assert.match(result.informePath ?? '', /informe-codex-1\.md$/);
+
+    // Se invoco con --base contra la rama base real (develop) y no se
+    // le paso el diff a mano: codex lo calcula el mismo.
+    assert.ok(args.invocation !== null);
+    assert.deepEqual(args.invocation!.args.slice(0, 3), ['review', '--base', 'develop']);
+
+    const informe = await readFile(result.informePath as string, 'utf8');
+    assert.match(informe, /Veredicto: PENDIENTE/);
+    assert.match(informe, /Hallazgos de codex/);
+    // No se mezcla con el informe de la revision primaria.
+    const informePrimaria = await readFile(
+      path.join(tareasRoot, '03-en-revision', 'TASK-806', 'revision', 'informe-revision-1.md'),
+      'utf8'
+    );
+    assert.doesNotMatch(informePrimaria, /Hallazgos de codex/);
+
+    // Paso 5 de la 8.3: el informe quedo commiteado.
+    const log = git(['log', '--format=%s', '-1'], repoRoot).trim();
+    assert.equal(log, 'chore(TASK-806): informe de codex ronda 1');
+  });
+});
+
+test('taskctl codex-review: una segunda invocacion numera el informe como -2, sin pisar la ronda anterior', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-807', rama: 'feature/task-807-segunda-ronda' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const primera = await runCodexReviewCommand(tareasRoot, ['TASK-807'], '2026-09-13', {
+      repoCwd: repoRoot,
+      runCodex: fakeRunCodex({ stdout: 'primera pasada\n' }),
+    });
+    assert.equal(primera.ronda, 1);
+
+    const segunda = await runCodexReviewCommand(tareasRoot, ['TASK-807'], '2026-09-13', {
+      repoCwd: repoRoot,
+      runCodex: fakeRunCodex({ stdout: 'segunda pasada\n' }),
+    });
+    assert.equal(segunda.ronda, 2);
+    assert.match(segunda.informePath ?? '', /informe-codex-2\.md$/);
+
+    const anterior = await readFile(primera.informePath as string, 'utf8');
+    assert.match(anterior, /primera pasada/);
+  });
+});
+
+test('taskctl codex-review: dos invocaciones concurrentes sobre la misma ronda producen EEXIST en una de las dos (hallazgo de riesgos, TASK-020)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-808', rama: 'feature/task-808-concurrencia' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const deps = {
+      repoCwd: repoRoot,
+      runCodex: fakeRunCodex({ stdout: 'salida concurrente\n' }),
+    };
+    const resultados = await Promise.allSettled([
+      runCodexReviewCommand(tareasRoot, ['TASK-808'], '2026-09-13', deps),
+      runCodexReviewCommand(tareasRoot, ['TASK-808'], '2026-09-13', deps),
+    ]);
+
+    const cumplidas = resultados.filter((r) => r.status === 'fulfilled');
+    const rechazadas = resultados.filter((r) => r.status === 'rejected');
+    // O bien las dos calcularon la misma ronda y una de las dos choco
+    // con EEXIST, o el sistema de archivos las serializo lo bastante
+    // rapido como para que cada una calculara su propia ronda: en
+    // cualquier caso, NINGUNA pisa el informe de la otra ni deja el
+    // directorio en un estado corrupto — eso es lo que este test
+    // aprueba, sin exigir que la carrera se gane siempre igual.
+    assert.ok(cumplidas.length >= 1, 'al menos una invocacion debe completar con exito');
+    for (const r of rechazadas) {
+      assert.ok((r as PromiseRejectedResult).reason instanceof CodexReviewCommandError);
+    }
+    const revisionDir = path.join(tareasRoot, '03-en-revision', 'TASK-808', 'revision');
+    const { readdir } = await import('node:fs/promises');
+    const entradas = (await readdir(revisionDir)).filter((e) => /^informe-codex-/.test(e));
+    // Tantos informes de Codex como invocaciones tuvieron exito, cada
+    // uno con su propio numero de ronda (sin duplicados).
+    assert.equal(entradas.length, cumplidas.length);
+    assert.equal(new Set(entradas).size, entradas.length);
+  });
+});
+
+test('taskctl codex-review: error claro si falta el ID o la tarea no existe', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await assert.rejects(
+      () =>
+        runCodexReviewCommand(tareasRoot, [], '2026-09-13', {
+          repoCwd: repoRoot,
+          runCodex: fakeRunCodex({}),
+        }),
+      CodexReviewCommandError
+    );
+    await assert.rejects(
+      () =>
+        runCodexReviewCommand(tareasRoot, ['TASK-999'], '2026-09-13', {
+          repoCwd: repoRoot,
+          runCodex: fakeRunCodex({}),
+        }),
+      StateMachineError
+    );
+  });
+});
+
+test('readTareaFile sigue viendo la tarea en 03-en-revision tras codex-review (no cambia de carpeta ni de estado)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-809', rama: 'feature/task-809-no-cambia-estado' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    await runCodexReviewCommand(tareasRoot, ['TASK-809'], '2026-09-13', {
+      repoCwd: repoRoot,
+      runCodex: fakeRunCodex({ stdout: 'ok\n' }),
+    });
+
+    const read = await readTareaFile(tareasRoot, 'TASK-809');
+    assert.equal(read?.task.estado, 'en-revision');
+    assert.equal(read?.filePath.includes(path.join('03-en-revision', 'TASK-809')), true);
+  });
+});
````
