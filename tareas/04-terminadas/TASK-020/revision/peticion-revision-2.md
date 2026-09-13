# Peticion de revision — TASK-020 (ronda 2)

- Tarea: TASK-020 — Comando taskctl codex-review (segunda opinión independiente)
- Rama revisada: feature/task-020-comando-taskctl-codex-review-segunda-opi
- Rama base: develop
- Commit revisado (HEAD): c478507c78e6656b8111d0e176df134dca116310
- Fecha: 2026-09-13
- Agente revisor sugerido: code-quality-reviewer

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento, del revisor de la
ronda 1 y de quien hizo la correccion. Tu trabajo es reproducir empiricamente,
no leer el diff y opinar: clona el repo (o usa un worktree) a un directorio
temporal, corre la suite tu mismo y construye el caso que rompe el codigo
antes de reportarlo. Clasifica cada hallazgo como CRITICO (perdida de datos,
corrupcion de estado, el comando hace lo contrario de lo que dice), IMPORTANTE
(comportamiento incorrecto en un caso real, no de borde) o MENOR (todo lo
demas). Un "sin hallazgos" explicito tambien vale; inventar hallazgos, no.
Vuelca tu salida en el informe de esta ronda (informe-revision-2.md), sin
borrar la peticion.

## Que paso en la ronda 1

`informe-revision-1.md` (ya en este directorio) dio **cambios-solicitados**
con 1 IMPORTANTE y 2 MENOR. Resumen, y que se hizo con cada uno — no des nada
por bueno solo porque esta peticion lo diga, confirmalo tu mismo:

- **IMPORTANTE-1**: `runCodexReview` (`src/fs/git.ts`) llamaba a
  `spawnSync('codex', args)` **sin `shell: true`**. En Windows, un paquete
  npm global instala `codex` como `codex.cmd`, y `spawnSync` sin `shell: true`
  NO resuelve `.cmd`/`.bat` por su nombre sin extension (restriccion
  documentada de Node) — la llamada devolvia `ENOENT` **siempre**, aunque
  `codex` estuviera perfectamente instalado, con un mensaje que mandaba al
  usuario a "reinstalar codex" cuando el problema era como se lanzaba el
  proceso. El revisor de la ronda 1 lo reprodujo contra el binario real de
  esta maquina, incluido un `taskctl codex-review` real sobre una tarea
  montada a proposito.
  **Corregido** en `src/fs/git.ts`: `shell: true` solo en `process.platform
  === 'win32'` (en POSIX `codex` se lanza directo, sin este problema), con
  un escapado manual de los argumentos para `cmd.exe` (`cmdQuoteWindows`),
  porque con `shell: true` Node NO cita el array de argumentos por su cuenta
  en Windows — sin ese escapado, un argumento con espacios (el titulo de la
  tarea) llegaria partido en varias palabras a `codex`.
  **Verificado** contra el `codex-cli` real de esta maquina tras la
  correccion: `lanzado: true`, `code: 1` (el fallo real de cuenta/modelo que
  el propio plan ya documentaba), **ya no `ENOENT`**.
  **Nuevo test** en `test/fs/git.test.ts` que ejercita `runCodexReview` SIN
  inyectar `deps.runCodex` (monta un `codex`/`codex.cmd` de mentira en el
  PATH) — el hueco exacto que dejaba pasar el bug original invisible a la
  suite, porque los 8 tests de `codex-review.test.ts` inyectan siempre la
  dependencia (correctamente, para no depender de un binario real ni de red).

- **Hallazgo NUEVO, encontrado al verificar la correccion del IMPORTANTE-1**
  (no estaba en el informe de la ronda 1): con el bug de `spawnSync`
  arreglado, la invocacion original (`codex review --base <rama> --title
  <texto> <prompt>`) fallaba de todas formas — pero con exit **2** (uso
  invalido), no con `ENOENT`. `codex review` (codex-cli 0.144.1) **rechaza
  combinar `--base <rama>` con un PROMPT posicional propio**: `error: the
  argument '--base <BRANCH>' cannot be used with '[PROMPT]'` — un conflicto
  real de su CLI (confirmado contra el binario real, probando ademas que
  `--base` + `--commit`, y PROMPT + `--uncommitted`/`--commit`, tienen la
  misma restriccion; PROMPT SOLO, o `--base` SOLO con `--title`, si son
  validos). **Corregido**: se quita el prompt personalizado de
  `codex-review.ts` — la invocacion queda en `codex review --base <rama>
  --title "<id>: <titulo>"`, sin PROMPT. El analisis lo hace el propio
  `codex review` con su comportamiento por defecto; se pierde la instruccion
  de clasificar CRITICO/IMPORTANTE/MENOR que el prompt le daba a Codex, pero
  el humano/agente que lee `informe-codex-N.md` sigue siendo quien certifica
  el veredicto (decision de Carlos ya vigente), asi que no cambia el
  contrato de aprobacion.

- **MENOR-1** (`revisionPrimariaAprobadaDe` reimplementa a mano la logica de
  `finish.ts`): documentado como decision de arquitectura consciente en el
  plan; no se corrigio, tal como recomendaba el propio informe de la ronda 1
  (no bloqueante).
- **MENOR-2** (sin test contra el camino feliz del binario real de Codex):
  sigue sin cubrirse — no hay cuenta/modelo compatible en esta maquina para
  probarlo; ya documentado como riesgo aceptado en el plan. El nuevo test de
  `runCodexReview` SI cubre que el binario se invoca correctamente (con un
  `codex` de mentira), pero no sustituye a un camino feliz con la API real.

No des estos puntos por buenos solo porque esta peticion lo diga: confirma tu
mismo que la correccion funciona (en particular, prueba con el binario real
de `codex` de esta maquina que `runCodexReview` ya no da `ENOENT`), y si algo
no cuadra, dilo como hallazgo nuevo. Revisa tambien con ojos frescos el resto
de la tarea si quieres verificarla de cero — no es obligatorio repetir todo
lo que la ronda 1 ya certifico con mutaciones y CLI real (las 3 decisiones de
Carlos, la concurrencia, el auto-commit en el caso degradado, `--help`, que
no cambia de carpeta ni de estado).

## Commits a revisar desde la ronda 1 (git log f938a8b..HEAD)

```
c478507 docs+fix(TASK-020): informe de revision ronda 1 y correccion del IMPORTANTE
```

## Diff de codigo fuente y tests (git diff f938a8b..HEAD -- src test)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
index 8c572fa..4b8bedc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
@@ -135,21 +135,6 @@ async function revisionPrimariaAprobadaDe(revisionDir: string): Promise<boolean>
   return contenidos.every((c) => veredictoAprobado(c));
 }
 
-/**
- * Instrucciones que se le pasan a Codex como PROMPT posicional (el CLI
- * ya calcula el diff el mismo con --base, no hace falta embeberlo).
- * Mismo espiritu que las instrucciones de peticionTemplate en
- * review.ts: revisor independiente, hallazgos clasificados.
- */
-function codexPrompt(task: Task): string {
-  return (
-    `Eres una segunda opinion INDEPENDIENTE sobre ${task.id} (${task.titulo}), ya revisada por ` +
-    'otro agente. Clasifica cada hallazgo como CRITICO (perdida de datos, corrupcion de estado, ' +
-    'el codigo hace lo contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un ' +
-    'caso real) o MENOR (todo lo demas). Un "sin hallazgos" explicito tambien vale.'
-  );
-}
-
 /**
  * Scaffold del informe de Codex: mismo contrato que `informeTemplate`
  * de review.ts — taskctl finish exige que TODAS las lineas
@@ -212,9 +197,20 @@ export async function runCodexReviewCommand(
   const baseBranch = resolveBaseBranchForTipo(task.tipo, deps.repoCwd);
   const commitRevisado = headCommit(deps.repoCwd);
 
+  // Sin PROMPT posicional a proposito: "codex review" (codex-cli
+  // 0.144.1) rechaza combinar "--base <rama>" con un PROMPT propio
+  // ("error: the argument '--base <BRANCH>' cannot be used with
+  // '[PROMPT]'" — clap, no un fallo de escapado), confirmado
+  // empiricamente contra el binario real en esta maquina (hallazgo de
+  // revision por pares, ronda 1, ampliado tras corregir el bug de
+  // spawnSync: con el spawn ya arreglado, la combinacion original
+  // fallaba de todas formas, con exit 2 en vez de ENOENT). "--title"
+  // SI es compatible con "--base" y viaja con el id y el titulo de la
+  // tarea; el analisis en si lo hace el propio "codex review" con su
+  // comportamiento por defecto.
   const runCodex = deps.runCodex ?? runCodexReview;
   const outcome = runCodex({
-    args: ['review', '--base', baseBranch, '--title', `${task.id}: ${task.titulo}`, codexPrompt(task)],
+    args: ['review', '--base', baseBranch, '--title', `${task.id}: ${task.titulo}`],
     cwd: deps.repoCwd,
   });
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index cd7b5ca..0de3961 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -321,17 +321,48 @@ export interface CodexReviewOutcome {
 }
 
 /**
- * Lanza "codex review <args>" en `cwd`. Inyectable como dependencia en
- * `codex-review.ts` (`deps.runCodex`) precisamente para que los tests
- * puedan simular ENOENT o un exit distinto de cero sin depender del
- * binario real ni de red — el mismo motivo por el que `review.ts`
- * inyecta `deps.scriptsDir` en vez de invocar sus scripts a ciegas.
+ * Escapado para `cmd.exe` (hallazgo IMPORTANTE de revision por pares,
+ * ronda 1): con `shell: true` en Windows, `spawnSync` NO cita los
+ * elementos del array de argumentos por su cuenta (a diferencia de la
+ * shell POSIX, que si recibe cada elemento como una palabra propia).
+ * Sin este escapado, un argumento con espacios (p. ej. el titulo de la
+ * tarea) llega a `codex` partido en varias palabras. Envuelve en
+ * comillas dobles si el argumento tiene espacio o algun caracter que
+ * `cmd.exe` interpreta (comilla, `&`, `|`, `<`, `>`, `^`, `%`), doblando
+ * las comillas internas — mismo criterio que usa Node internamente para
+ * `.bat`/`.cmd` en versiones que sí lo resuelven solas.
+ */
+function cmdQuoteWindows(arg: string): string {
+  if (arg === '' || /["\s&|<>^%]/.test(arg)) {
+    return `"${arg.replace(/"/g, '""')}"`;
+  }
+  return arg;
+}
+
+/**
+ * Lanza "codex <args>" (TASK-020). En Windows, un paquete npm global
+ * instala `codex` como `codex.cmd`: `spawnSync` sin `shell: true` no
+ * resuelve `.cmd`/`.bat` por su nombre sin extension (restriccion de
+ * Node documentada, no un accidente de esta maquina) y devuelve
+ * `ENOENT` SIEMPRE, aunque el binario funcione perfectamente desde una
+ * shell — confirmado empiricamente en esta misma maquina (hallazgo
+ * IMPORTANTE de revision por pares, ronda 1: `runCodexReview`
+ * diagnosticaba "no instalado" cuando si lo estaba). `shell: true` solo
+ * en Windows (en POSIX `codex` se lanza directo, sin ese problema, y
+ * evitar la shell ahi evita el riesgo de inyeccion que no hace falta
+ * correr); los argumentos se citan a mano para `cmd.exe` antes de
+ * pasarlos, porque con `shell: true` Node NO cita el array de
+ * argumentos en Windows (verificado: sin citar, un argumento con
+ * espacios llega partido en varias palabras a `codex`).
  */
 export function runCodexReview(invocation: CodexReviewInvocation): CodexReviewOutcome {
-  const result = spawnSync('codex', invocation.args, {
+  const useShell = process.platform === 'win32';
+  const args = useShell ? invocation.args.map(cmdQuoteWindows) : invocation.args;
+  const result = spawnSync('codex', args, {
     cwd: invocation.cwd,
     encoding: 'utf8',
     maxBuffer: GIT_MAX_BUFFER,
+    shell: useShell,
   });
   if (result.error) {
     return { lanzado: false, code: null, stdout: '', errorLanzamiento: result.error };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
index 1f3ea76..bde5be8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
@@ -19,6 +19,7 @@ import {
   BaseBranchGuardError,
   GitCommandError,
   GitLaunchError,
+  runCodexReview,
 } from '../../src/fs/git.js';
 
 function git(args: string[], cwd: string): void {
@@ -623,3 +624,48 @@ test('operacionEnCurso: null tras un "cherry-pick -n" en conflicto (Git tampoco
     assert.equal(operacionEnCurso(repoRoot), null);
   });
 });
+
+// --- TASK-020: runCodexReview contra un binario real (no inyectado) ---
+//
+// codex-review.test.ts inyecta siempre "deps.runCodex" (correctamente,
+// para no depender de un binario real ni de red) — pero eso deja la
+// funcion real de aqui, "runCodexReview", sin ningun test que la
+// ejercite contra un proceso de verdad. Ese hueco es justo el que dejo
+// pasar el bug de la ronda 1 de revision: en Windows, "spawnSync" sin
+// "shell: true" no resuelve un "codex.cmd" instalado por npm y devuelve
+// ENOENT SIEMPRE, con independencia de si el binario esta instalado.
+// Este test monta un "codex" (o "codex.cmd" en Windows) de mentira en un
+// directorio temporal, lo antepone al PATH real, y llama a la funcion
+// real (no mockeada) para confirmar que SI lo encuentra y lo lanza, y
+// que un argumento con espacios llega intacto (contraprueba del
+// escapado para cmd.exe: sin el, "titulo con espacios" llegaria partido
+// en varias palabras).
+test('runCodexReview: encuentra y lanza un "codex" real del PATH (no inyectado), y un argumento con espacios llega intacto', async () => {
+  const { writeFile, chmod, mkdtemp, rm } = await import('node:fs/promises');
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-codex-fake-'));
+  const pathAnterior = process.env['PATH'];
+  try {
+    const esWindows = process.platform === 'win32';
+    const scriptPath = path.join(dir, esWindows ? 'codex.cmd' : 'codex');
+    const contenido = esWindows
+      ? '@echo off\r\necho ARGS:%*\r\nexit /b 0\r\n'
+      : '#!/bin/sh\necho "ARGS:$@"\n';
+    await writeFile(scriptPath, contenido, 'utf8');
+    if (!esWindows) await chmod(scriptPath, 0o755);
+
+    process.env['PATH'] = `${dir}${path.delimiter}${pathAnterior ?? ''}`;
+
+    const outcome = runCodexReview({
+      args: ['review', '--base', 'develop', '--title', 'titulo con espacios'],
+      cwd: dir,
+    });
+
+    assert.equal(outcome.lanzado, true, JSON.stringify(outcome));
+    assert.equal(outcome.code, 0, outcome.stdout);
+    assert.match(outcome.stdout, /ARGS:/);
+    assert.match(outcome.stdout, /titulo con espacios/);
+  } finally {
+    process.env['PATH'] = pathAnterior;
+    await rm(dir, { recursive: true, force: true });
+  }
+});
````
