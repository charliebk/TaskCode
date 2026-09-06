# Peticion de revision — TASK-026 (ronda 1)

- Tarea: TASK-026 — Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge
- Rama revisada: feature/task-026-wrappers-de-git-flow-en-taskctl-diagnose
- Rama base: develop
- Commit revisado (HEAD): 1ff68e190a655c03b7e3eff6f6e068a003c25e26
- Fecha: 2026-09-06
- Agente revisor sugerido: general-purpose

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
1ff68e1 feat(TASK-026): los cinco wrappers de Git-Flow en taskctl
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-026/plan-final.md b/tareas/02-en-curso/TASK-026/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-026/plan-final.md
rename to tareas/02-en-curso/TASK-026/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-026/tarea.md b/tareas/02-en-curso/TASK-026/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-026/tarea.md
rename to tareas/02-en-curso/TASK-026/tarea.md
index 9d031a8..9395832 100644
--- a/tareas/01-en-diseno/TASK-026/tarea.md
+++ b/tareas/02-en-curso/TASK-026/tarea.md
@@ -6,7 +6,7 @@ sprint: 2
 etiquetas: [cli, gitflow, wrappers]
 complejidad: media
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-026-wrappers-de-git-flow-en-taskctl-diagnose
 asignado_a: charlie.bk@gmail.com
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 4a8148b..9d5a9e0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -11,6 +11,11 @@ import { runPlanCommand, PlanCommandError } from './commands/plan.js';
 import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
+import {
+  isWrapperCommand,
+  runWrapperCommand,
+  WrapperCommandError,
+} from './commands/wrappers.js';
 import { resolveGitflowScriptsDir, GitflowScriptLaunchError } from './fs/gitflow-runner.js';
 import { StateMachineError } from './core/state-machine.js';
 import { TaskFolderConflictError } from './fs/task-store.js';
@@ -40,9 +45,18 @@ Uso:
   taskctl approve TASK-NNN
   taskctl review TASK-NNN
   taskctl finish TASK-NNN
+  taskctl diagnose
+  taskctl pause [--push]
+  taskctl resume [<rama>]
+  taskctl recover [<rama>]
+  taskctl abort-merge
 
 Comandos: new, import, board, start, plan, approve, review, finish.
+Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
 --asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
+Los wrappers preguntan (guardar como commit o stash, confirmar un abort...):
+ejecutalos desde una terminal. Sin ella, taskctl aborta con instrucciones en
+vez de dejar que el script conteste solo.
 Ver docs/PLAN_SPRINTS.md en el repo del proyecto.
 `;
 
@@ -358,6 +372,41 @@ export async function main(argv: readonly string[]): Promise<number> {
     }
   }
 
+  // Los cinco wrappers de Git-Flow (TASK-026). Van al final a
+  // proposito: son los unicos comandos que no tocan "tareas/", asi
+  // que ninguna de las precondiciones de arriba (maquina de estados,
+  // rama base de la 8.3) les aplica.
+  if (isWrapperCommand(cmd)) {
+    const repoCwd = process.cwd();
+    try {
+      const result = runWrapperCommand(cmd, argv.slice(1), {
+        repoCwd,
+        scriptsDir: resolveGitflowScriptsDir(),
+        // Sin TTY no hay a quien preguntar. Es mas estricto que la
+        // realidad (una tuberia con las respuestas escritas tambien
+        // valdria), y es deliberado: distinguir "tuberia con
+        // respuestas" de "tuberia vacia" solo se puede hacer leyendo,
+        // y leer stdin aqui le robaria al script su respuesta.
+        interactivo: process.stdin.isTTY === true,
+        onAviso: (aviso) => printAvisos(aviso),
+      });
+      // El codigo del script se propaga tal cual: un "pause"
+      // cancelado sale 0 y uno con opcion no reconocida sale 1.
+      return result.code;
+    } catch (e) {
+      if (
+        e instanceof WrapperCommandError ||
+        e instanceof GitflowScriptLaunchError ||
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
   process.stderr.write(`[ERROR] Comando desconocido: "${cmd}"\n\n${HELP}`);
   return 1;
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts
new file mode 100644
index 0000000..ee8ee97
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts
@@ -0,0 +1,250 @@
+/**
+ * Los cinco "wrappers directos" de la tabla de la seccion 8 de la
+ * metodologia (item C1, TASK-026): taskctl diagnose / pause / resume /
+ * recover / abort-merge sobre los scripts que ya existen en
+ * scripts/gitflow/. La seccion 8.3 ya remite a `taskctl pause` en su
+ * mensaje de workspace sucio, asi que el comando le hacia falta al
+ * sistema desde antes de existir.
+ *
+ * Envolverlos NO es solo enrutar a bash. Cuatro de los cinco scripts
+ * preguntan con `read -rp`, y runGitflowScript invoca por defecto con
+ * stdin ignorado (a proposito, ver su cabecera). Con EOF inmediato:
+ *
+ *   - pause-work.sh    -> respuesta vacia, "Opcion no reconocida", exit 1
+ *   - abort-merge.sh   -> no confirma: NO aborta nada, y sale 0
+ *   - resume-work.sh   -> aplica el stash de la rama sin preguntar (default si)
+ *   - recover-branch.sh-> cancela sin sobreescribir (default no)
+ *   - diagnose-repo.sh -> no pregunta nada
+ *
+ * De ahi los dos trabajos de este modulo: los scripts se invocan con
+ * stdin heredado (para que en una terminal se puedan contestar), y
+ * cuando NO hay terminal se corta antes de invocar en los casos en
+ * que el valor por defecto del script haria lo contrario de lo que
+ * anuncia el comando.
+ *
+ * Lo que estos comandos NO hacen, a proposito: no leen ni escriben
+ * `tareas/`, no pasan por la maquina de estados y no aplican la
+ * precondicion de rama base de la 8.3 — seria contradictorio, porque
+ * `pause` existe justamente para el workspace sucio que esa
+ * precondicion rechaza, y `resume`/`recover` cambian de rama por
+ * definicion.
+ */
+import {
+  isGitRepo,
+  isValidBranchName,
+  isWorkspaceClean,
+  operacionEnCurso,
+} from '../fs/git.js';
+import { runGitflowScript } from '../fs/gitflow-runner.js';
+
+export class WrapperCommandError extends Error {}
+
+export type WrapperName = 'diagnose' | 'pause' | 'resume' | 'recover' | 'abort-merge';
+
+interface WrapperSpec {
+  script: string;
+  /** true si acepta un nombre de rama posicional (siempre opcional). */
+  aceptaRama: boolean;
+  /** Opciones aceptadas, en todas sus grafias. */
+  opciones: readonly string[];
+}
+
+const WRAPPERS: Record<WrapperName, WrapperSpec> = {
+  diagnose: { script: 'diagnose-repo.sh', aceptaRama: false, opciones: [] },
+  pause: { script: 'pause-work.sh', aceptaRama: false, opciones: ['--push', '-p'] },
+  resume: { script: 'resume-work.sh', aceptaRama: true, opciones: [] },
+  recover: { script: 'recover-branch.sh', aceptaRama: true, opciones: [] },
+  'abort-merge': { script: 'abort-merge.sh', aceptaRama: false, opciones: [] },
+};
+
+export const WRAPPER_NAMES = Object.keys(WRAPPERS) as readonly WrapperName[];
+
+export function isWrapperCommand(cmd: string): cmd is WrapperName {
+  return Object.prototype.hasOwnProperty.call(WRAPPERS, cmd);
+}
+
+export interface RunWrapperOptions {
+  /** Repo Git sobre el que opera el wrapper (normalmente process.cwd()). */
+  repoCwd: string;
+  scriptsDir: string;
+  /**
+   * true si stdin es una terminal, es decir: si hay alguien a quien el
+   * script pueda preguntar. Lo decide cli.ts y se pasa como opcion en
+   * vez de leer process.stdin.isTTY aqui, para que los tests puedan
+   * recorrer las dos ramas sin falsear una TTY.
+   */
+  interactivo: boolean;
+  /**
+   * Se invoca con cada aviso ANTES de lanzar el script. Que sea un
+   * callback y no solo el valor de retorno es deliberado: un aviso
+   * sobre lo que el script va a hacer no sirve de nada impreso
+   * despues de que el script ya haya escrito su propia salida.
+   */
+  onAviso?: (aviso: string) => void;
+}
+
+export interface WrapperCommandResult {
+  nombre: WrapperName;
+  script: string;
+  /** Codigo de salida del script, tal cual, sin colapsarlo a 0 o 1. */
+  code: number;
+  avisos: string[];
+}
+
+interface WrapperArgs {
+  rama: string | null;
+  opciones: string[];
+}
+
+/**
+ * Los scripts se tragan cualquier cosa: sus bucles `while` toman el
+ * primer argumento no reconocido como nombre de rama, asi que
+ * `taskctl resume --push mi-rama` intentaria retomar una rama llamada
+ * "--push". Y parseArgs (cli/args.ts) ignora en silencio los flags
+ * que no conoce, el mismo fallo que la revision de B6 encontro ya
+ * materializado en `board`. Se validan aqui, antes de invocar nada.
+ */
+function parseWrapperArgs(
+  nombre: WrapperName,
+  spec: WrapperSpec,
+  argv: readonly string[]
+): WrapperArgs {
+  const opciones: string[] = [];
+  let rama: string | null = null;
+
+  for (const arg of argv) {
+    if (arg.startsWith('-')) {
+      if (!spec.opciones.includes(arg)) {
+        const admite =
+          spec.opciones.length === 0
+            ? 'no admite ninguna opcion'
+            : `solo admite ${spec.opciones.join(' y ')}`;
+        throw new WrapperCommandError(
+          `[ERROR] taskctl ${nombre} ${admite}, y recibio "${arg}".`
+        );
+      }
+      if (!opciones.includes(arg)) opciones.push(arg);
+      continue;
+    }
+    if (!spec.aceptaRama) {
+      throw new WrapperCommandError(
+        `[ERROR] taskctl ${nombre} no acepta argumentos, y recibio "${arg}". ` +
+          `Ejecuta: taskctl ${nombre}`
+      );
+    }
+    if (arg.trim() === '') {
+      throw new WrapperCommandError(
+        `[ERROR] taskctl ${nombre} recibio un nombre de rama vacio. ` +
+          `Ejecuta: taskctl ${nombre} <rama>`
+      );
+    }
+    if (rama !== null) {
+      throw new WrapperCommandError(
+        `[ERROR] taskctl ${nombre} acepta un solo nombre de rama, y recibio "${rama}" y ` +
+          `"${arg}".`
+      );
+    }
+    rama = arg;
+  }
+
+  return { rama, opciones };
+}
+
+/**
+ * Guarda de no-interactividad: solo corta cuando el script iba a
+ * preguntar algo Y su respuesta por defecto es inaceptable. Si no hay
+ * nada que preguntar (diagnose, pause con el workspace limpio), el
+ * comando sigue igual de bien sin terminal.
+ */
+function assertPuedeSeguirSinTerminal(
+  nombre: WrapperName,
+  rama: string | null,
+  repoCwd: string
+): void {
+  if (nombre === 'pause' && !isWorkspaceClean(repoCwd)) {
+    throw new WrapperCommandError(
+      '[ERROR] taskctl pause tiene que preguntarte si guardar los cambios como commit o como ' +
+        'stash, y no hay terminal interactiva. Ejecutalo desde una terminal, o guardalos tu: ' +
+        '"git stash push -u" para apartarlos, "git add -A && git commit" para dejarlos en la ' +
+        'rama.'
+    );
+  }
+
+  if (nombre === 'abort-merge') {
+    const operacion = operacionEnCurso(repoCwd);
+    if (operacion !== null) {
+      throw new WrapperCommandError(
+        `[ERROR] taskctl abort-merge tiene que confirmar contigo antes de abortar el ` +
+          `${operacion} en curso, y no hay terminal interactiva. Ejecutalo desde una terminal, ` +
+          `o abortalo tu: "git ${operacion} --abort".`
+      );
+    }
+  }
+
+  if ((nombre === 'resume' || nombre === 'recover') && rama === null) {
+    throw new WrapperCommandError(
+      `[ERROR] taskctl ${nombre} pregunta por la rama cuando no se le pasa, y no hay terminal ` +
+        `interactiva. Ejecuta: taskctl ${nombre} <rama>`
+    );
+  }
+}
+
+/** Avisos de "sin terminal, el script tomara este valor por defecto". */
+function avisosSinTerminal(nombre: WrapperName, rama: string | null): string[] {
+  if (nombre === 'resume' && rama !== null) {
+    return [
+      `Sin terminal interactiva: si "${rama}" tiene un stash de "taskctl pause", resume-work.sh ` +
+        'lo aplicara sin preguntar (es su valor por defecto).',
+    ];
+  }
+  if (nombre === 'recover' && rama !== null) {
+    return [
+      `Sin terminal interactiva: si "${rama}" ya existe en local, recover-branch.sh cancelara ` +
+        'sin sobreescribirla (es su valor por defecto).',
+    ];
+  }
+  return [];
+}
+
+export function runWrapperCommand(
+  nombre: WrapperName,
+  argv: readonly string[],
+  opts: RunWrapperOptions
+): WrapperCommandResult {
+  const spec = WRAPPERS[nombre];
+  const { rama, opciones } = parseWrapperArgs(nombre, spec, argv);
+
+  if (!isGitRepo(opts.repoCwd)) {
+    throw new WrapperCommandError(
+      `[ERROR] taskctl ${nombre} solo funciona dentro de un repositorio Git, y ` +
+        `"${opts.repoCwd}" no lo es. Ejecutalo desde la carpeta del repo.`
+    );
+  }
+
+  // Defensa en profundidad, mismo motivo que en start (TASK-009): sin
+  // esto, un nombre invalido solo se detecta dos procesos mas abajo,
+  // dentro del script, con un mensaje de Git que no menciona taskctl.
+  if (rama !== null && !isValidBranchName(rama, opts.repoCwd)) {
+    throw new WrapperCommandError(
+      `[ERROR] "${rama}" no es un nombre de rama valido para Git. Revisa el nombre y reintenta.`
+    );
+  }
+
+  const avisos: string[] = [];
+  if (!opts.interactivo) {
+    assertPuedeSeguirSinTerminal(nombre, rama, opts.repoCwd);
+    avisos.push(...avisosSinTerminal(nombre, rama));
+  }
+  for (const aviso of avisos) {
+    opts.onAviso?.(aviso);
+  }
+
+  const args = rama === null ? opciones : [...opciones, rama];
+  const { code } = runGitflowScript(spec.script, args, {
+    scriptsDir: opts.scriptsDir,
+    cwd: opts.repoCwd,
+    stdin: 'inherit',
+  });
+
+  return { nombre, script: spec.script, code, avisos };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index f533c08..fe1821c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -7,6 +7,8 @@
  * scripts .sh siguen siendo la unica fuente de verdad para eso).
  */
 import { spawnSync } from 'node:child_process';
+import { existsSync } from 'node:fs';
+import path from 'node:path';
 import type { Task } from '../core/task.js';
 
 export class GitCommandError extends Error {
@@ -58,6 +60,47 @@ export function isWorkspaceClean(cwd: string): boolean {
   return runGit(['status', '--porcelain'], cwd) === '';
 }
 
+/**
+ * true si `cwd` esta dentro de un repositorio Git (TASK-026). No pasa
+ * por runGit a proposito, igual que gitUserEmail: "esto no es un
+ * repo" es una respuesta valida, no un error que deba propagarse
+ * como GitCommandError.
+ *
+ * Lo usan los cinco wrappers de Git-Flow, que son los unicos comandos
+ * de taskctl que se pueden invocar en un repo cualquiera sin tareas.
+ * Sin esta comprobacion, cada script reacciona a su manera a no estar
+ * en un repo: diagnose-repo.sh imprime un informe con los campos
+ * vacios, pause-work.sh dice "No estas en ninguna rama".
+ */
+export function isGitRepo(cwd: string): boolean {
+  const result = spawnSync('git', ['rev-parse', '--git-dir'], { cwd, encoding: 'utf8' });
+  if (result.error) {
+    throw new GitLaunchError(result.error);
+  }
+  return result.status === 0;
+}
+
+export type OperacionGitEnCurso = 'merge' | 'rebase';
+
+/**
+ * Que operacion multi-paso hay a medias en el repo, si es que hay
+ * alguna (TASK-026). Mira exactamente los mismos tres testigos que
+ * `abort-merge.sh` (MERGE_HEAD, rebase-merge, rebase-apply), pero
+ * resolviendo cada ruta con `git rev-parse --git-path` en vez de
+ * concatenar sobre --git-dir: asi sigue valiendo dentro de un
+ * worktree enlazado, donde MERGE_HEAD no vive en el .git principal.
+ *
+ * `--git-path` devuelve una ruta relativa al cwd de Git, no al
+ * proceso: se resuelve contra `cwd` antes de mirar el disco.
+ */
+export function operacionEnCurso(cwd: string): OperacionGitEnCurso | null {
+  const gitPath = (nombre: string): string =>
+    path.resolve(cwd, runGit(['rev-parse', '--git-path', nombre], cwd));
+  if (existsSync(gitPath('MERGE_HEAD'))) return 'merge';
+  if (existsSync(gitPath('rebase-merge')) || existsSync(gitPath('rebase-apply'))) return 'rebase';
+  return null;
+}
+
 /** Nombre de la rama activa (equivalente a `git branch --show-current`). */
 export function currentBranch(cwd: string): string {
   return runGit(['branch', '--show-current'], cwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
index ba75a29..4226a63 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
@@ -8,13 +8,21 @@
  *    fichero: el bit +x no sobrevive en este repo (`core.fileMode`
  *    en false — ver scripts/gitflow/README.md), y es mas robusto en
  *    general (NTFS tampoco preserva permisos Unix).
- * 2. `stdin: 'ignore'`, nunca `'inherit'`: si por lo que sea el script
- *    SI llega a un `read -rp` (no deberia, taskctl comprueba workspace
- *    limpio antes de invocar), TASK-007 establecio que `read` con
- *    stdin no interactivo recibe EOF de inmediato (no bloquea el
- *    proceso) — ignorar stdin explicitamente hace ese comportamiento
+ * 2. `stdin: 'ignore'` POR DEFECTO, nunca `'inherit'` por descuido: si
+ *    por lo que sea un script del ciclo de vida SI llega a un
+ *    `read -rp` (no deberia, taskctl comprueba workspace limpio antes
+ *    de invocar), TASK-007 establecio que `read` con stdin no
+ *    interactivo recibe EOF de inmediato (no bloquea el proceso) —
+ *    ignorar stdin explicitamente hace ese comportamiento
  *    determinista en vez de heredar lo que sea que tenga el proceso
- *    padre.
+ *    padre, y evita que un `taskctl finish` se quede colgado
+ *    esperando en una tuberia que nadie va a cerrar.
+ *
+ * Los cinco wrappers de TASK-026 (`diagnose`, `pause`, `resume`,
+ * `recover`, `abort-merge`) son la excepcion, y por eso la opcion
+ * existe: sus scripts SI preguntan, y preguntar es justamente lo que
+ * se espera de ellos. Pasan `stdin: 'inherit'` de forma explicita;
+ * `start`, `review` y `finish` no la pasan y se quedan con 'ignore'.
  */
 import { spawnSync } from 'node:child_process';
 import { fileURLToPath } from 'node:url';
@@ -45,6 +53,12 @@ export function resolveGitflowScriptsDir(): string {
 export interface RunGitflowScriptOptions {
   scriptsDir: string;
   cwd: string;
+  /**
+   * Que hacer con la entrada estandar del script. Omitirlo significa
+   * 'ignore', que es lo que quiere todo el ciclo de vida; 'inherit'
+   * es para los wrappers interactivos de TASK-026 (ver cabecera).
+   */
+  stdin?: 'ignore' | 'inherit';
 }
 
 export interface GitflowScriptResult {
@@ -80,7 +94,7 @@ export function runGitflowScript(
   const scriptPath = path.join(opts.scriptsDir, scriptName);
   const result = spawnSync('bash', [scriptPath, ...args], {
     cwd: opts.cwd,
-    stdio: ['ignore', 'inherit', 'inherit'],
+    stdio: [opts.stdin ?? 'ignore', 'inherit', 'inherit'],
   });
   if (result.error) {
     throw new GitflowScriptLaunchError(scriptName, result.error);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
new file mode 100644
index 0000000..303946c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
@@ -0,0 +1,473 @@
+/**
+ * Test de integracion real (no mocks) de los cinco wrappers de
+ * Git-Flow (TASK-026, item C1): repos Git temporales de verdad, los
+ * scripts de scripts/gitflow/ tal cual estan en el repo, y un merge
+ * en conflicto y un stash de verdad donde hacen falta.
+ *
+ * El test que da sentido a la tarea entera es el ultimo: lanza
+ * bin/taskctl como proceso hijo con la respuesta escrita en su stdin
+ * y comprueba que llega hasta el `read -rp` del script. Con la opcion
+ * `stdin: 'ignore'` de antes de esta tarea, las dos variantes (`n` y
+ * `s`) darian el mismo resultado.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import {
+  runWrapperCommand,
+  isWrapperCommand,
+  WrapperCommandError,
+  WRAPPER_NAMES,
+  type WrapperName,
+} from '../../src/commands/wrappers.js';
+import { operacionEnCurso } from '../../src/fs/git.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.join(HERE, '..', '..', '..');
+const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'gitflow');
+const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
+
+/** Directorio que no existe: si el wrapper llegase a lanzar el script,
+ *  devolveria un codigo de salida en vez de lanzar WrapperCommandError.
+ *  Es la forma de aseverar "aborto ANTES de invocar bash". */
+const SCRIPTS_DIR_INEXISTENTE = path.join(tmpdir(), 'taskctl-scripts-que-no-existen');
+
+const DOBLE_MUDO_21 = `#!/usr/bin/env bash
+exit 21
+`;
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+interface RunOpts {
+  interactivo?: boolean;
+  scriptsDir?: string;
+}
+
+function run(
+  nombre: WrapperName,
+  argv: readonly string[],
+  repoCwd: string,
+  opts: RunOpts = {}
+): { code: number; avisos: string[]; emitidos: string[] } {
+  const emitidos: string[] = [];
+  const result = runWrapperCommand(nombre, argv, {
+    repoCwd,
+    scriptsDir: opts.scriptsDir ?? SCRIPTS_DIR,
+    interactivo: opts.interactivo ?? false,
+    onAviso: (aviso) => emitidos.push(aviso),
+  });
+  return { code: result.code, avisos: result.avisos, emitidos };
+}
+
+function capturaError(fn: () => unknown): unknown {
+  try {
+    fn();
+    return null;
+  } catch (e) {
+    return e;
+  }
+}
+
+/**
+ * El `.gitignore` con `logs/` NO es decorado: todos los scripts de
+ * Git-Flow llaman a `initialize_gitflow_log`, que crea `logs/gitflow/`
+ * dentro del repo. Sin ignorarlo, el propio script deja el workspace
+ * sucio y `pause-work.sh` acaba preguntando que hacer con un
+ * directorio que acaba de crear el. El repo TaskCode ya lo ignora
+ * (.gitignore, linea 14) y el resto de tests de comandos hacen lo
+ * mismo.
+ */
+async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    await fn(repoRoot);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+async function withTempDirSinRepo(fn: (dir: string) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-sin-repo-'));
+  try {
+    await fn(dir);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+// ── Tabla de comandos ───────────────────────────────────────────────
+
+test('isWrapperCommand: reconoce los cinco y nada mas', () => {
+  assert.deepEqual([...WRAPPER_NAMES], [
+    'diagnose',
+    'pause',
+    'resume',
+    'recover',
+    'abort-merge',
+  ]);
+  for (const nombre of WRAPPER_NAMES) {
+    assert.equal(isWrapperCommand(nombre), true, nombre);
+  }
+  for (const otro of ['start', 'finish', 'board', 'diagnose-repo', '', 'constructor']) {
+    assert.equal(isWrapperCommand(otro), false, otro);
+  }
+});
+
+// ── Precondicion: estar en un repositorio Git ───────────────────────
+
+test('los cinco abortan fuera de un repositorio Git, sin llegar a lanzar bash', async () => {
+  await withTempDirSinRepo(async (dir) => {
+    for (const nombre of WRAPPER_NAMES) {
+      const argv = nombre === 'resume' || nombre === 'recover' ? ['alguna-rama'] : [];
+      const error = capturaError(() =>
+        run(nombre, argv, dir, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+      );
+      assert.ok(error instanceof WrapperCommandError, `${nombre}: ${String(error)}`);
+      assert.match((error as Error).message, /solo funciona dentro de un repositorio Git/);
+      assert.match((error as Error).message, new RegExp(`taskctl ${nombre}`));
+    }
+  });
+});
+
+// ── Validacion de argumentos ────────────────────────────────────────
+
+test('diagnose y abort-merge no aceptan argumentos', async () => {
+  await withTempRepo(async (repoRoot) => {
+    for (const nombre of ['diagnose', 'abort-merge'] as const) {
+      const error = capturaError(() =>
+        run(nombre, ['algo'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+      );
+      assert.ok(error instanceof WrapperCommandError, nombre);
+      assert.match((error as Error).message, /no acepta argumentos/);
+    }
+  });
+});
+
+test('pause solo admite --push y -p, y se los pasa al script', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const error = capturaError(() =>
+      run('pause', ['--forzar'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+    );
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /solo admite --push y -p/);
+
+    // Las dos grafias validas llegan al script, tal cual y sin
+    // duplicar: se comprueba con un doble del script que escribe sus
+    // argumentos, no con el pause-work.sh real (que haria un push).
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(
+        path.join(scriptsDir, 'pause-work.sh'),
+        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > args.txt\n',
+        'utf8'
+      );
+      for (const opcion of ['--push', '-p']) {
+        assert.equal(run('pause', [opcion, opcion], repoRoot, { scriptsDir }).code, 0);
+        const argsPath = path.join(repoRoot, 'args.txt');
+        assert.equal(
+          await readFile(argsPath, 'utf8'),
+          `${opcion}\n`,
+          `${opcion} deberia llegar una sola vez`
+        );
+        await rm(argsPath);
+      }
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
+
+test('resume pasa el nombre de rama al script como argumento posicional', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(
+        path.join(scriptsDir, 'resume-work.sh'),
+        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > args.txt\n',
+        'utf8'
+      );
+      assert.equal(run('resume', ['feature/algo'], repoRoot, { scriptsDir }).code, 0);
+      assert.equal(await readFile(path.join(repoRoot, 'args.txt'), 'utf8'), 'feature/algo\n');
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
+
+test('resume --push mi-rama no se lleva "--push" como nombre de rama', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const error = capturaError(() =>
+      run('resume', ['--push', 'mi-rama'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+    );
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /no admite ninguna opcion/);
+    assert.match((error as Error).message, /--push/);
+  });
+});
+
+test('resume y recover aceptan un solo nombre de rama', async () => {
+  await withTempRepo(async (repoRoot) => {
+    for (const nombre of ['resume', 'recover'] as const) {
+      const error = capturaError(() =>
+        run(nombre, ['una', 'otra'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+      );
+      assert.ok(error instanceof WrapperCommandError, nombre);
+      assert.match((error as Error).message, /un solo nombre de rama/);
+    }
+  });
+});
+
+test('un nombre de rama con formato invalido se rechaza antes de invocar el script', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const error = capturaError(() =>
+      run('resume', ['rama con espacios'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+    );
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /no es un nombre de rama valido/);
+  });
+});
+
+// ── Sin terminal: cuando corta y cuando no ──────────────────────────
+
+test('diagnose funciona sin terminal y sin avisos: no pregunta nada', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const result = run('diagnose', [], repoRoot);
+    assert.equal(result.code, 0);
+    assert.deepEqual(result.avisos, []);
+  });
+});
+
+test('pause sin terminal y con el workspace limpio sigue adelante', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const result = run('pause', [], repoRoot);
+    assert.equal(result.code, 0);
+    assert.deepEqual(result.avisos, []);
+  });
+});
+
+test('pause sin terminal y con el workspace sucio aborta y no toca nada', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await writeFile(path.join(repoRoot, 'sin-guardar.txt'), 'trabajo a medias\n', 'utf8');
+    const estadoAntes = git(['status', '--porcelain'], repoRoot);
+    const headAntes = git(['rev-parse', 'HEAD'], repoRoot);
+
+    const error = capturaError(() => run('pause', [], repoRoot));
+
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /commit o como stash/);
+    assert.match((error as Error).message, /no hay terminal interactiva/);
+    // Y sobre todo: el trabajo sin guardar sigue exactamente donde
+    // estaba, sin stash nuevo ni commit nuevo.
+    assert.equal(git(['status', '--porcelain'], repoRoot), estadoAntes);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), headAntes);
+    assert.equal(git(['stash', 'list'], repoRoot), '');
+  });
+});
+
+test('abort-merge sin terminal y sin nada en curso informa y sale 0', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const result = run('abort-merge', [], repoRoot);
+    assert.equal(result.code, 0);
+  });
+});
+
+test('abort-merge sin terminal y con un merge en conflicto aborta el comando, no el merge', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const fichero = path.join(repoRoot, 'a.txt');
+    await writeFile(fichero, 'base\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'base'], repoRoot);
+
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(fichero, 'version de otra\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'cambio en otra'], repoRoot);
+
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(fichero, 'version de main\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'cambio en main'], repoRoot);
+
+    const merge = spawnSync('git', ['merge', 'otra'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.notEqual(merge.status, 0, 'el merge deberia haber conflictado');
+    assert.equal(operacionEnCurso(repoRoot), 'merge');
+
+    const error = capturaError(() => run('abort-merge', [], repoRoot));
+
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /confirmar contigo/);
+    assert.match((error as Error).message, /git merge --abort/);
+    // Lo importante: el merge SIGUE en curso. Sin este guard, el
+    // script habria contestado que no y habria salido con codigo 0,
+    // como si hubiera terminado su trabajo.
+    assert.equal(operacionEnCurso(repoRoot), 'merge');
+  });
+});
+
+test('resume y recover sin rama y sin terminal dicen como invocarlos', async () => {
+  await withTempRepo(async (repoRoot) => {
+    for (const nombre of ['resume', 'recover'] as const) {
+      const error = capturaError(() =>
+        run(nombre, [], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+      );
+      assert.ok(error instanceof WrapperCommandError, nombre);
+      assert.match((error as Error).message, /no hay terminal interactiva/);
+      assert.match((error as Error).message, new RegExp(`taskctl ${nombre} <rama>`));
+    }
+  });
+});
+
+test('resume y recover con rama y sin terminal avisan del valor por defecto ANTES de lanzar', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const resume = run('resume', ['main'], repoRoot);
+    assert.equal(resume.avisos.length, 1);
+    assert.deepEqual(resume.emitidos, resume.avisos);
+    assert.match(resume.avisos[0] as string, /aplicara sin preguntar/);
+    // Sin "origin" configurado, resume-work.sh muere en su "fetch
+    // origin" sin guard: es el bug conocido del item C6, que esta
+    // tarea NO tapa a proposito.
+    assert.notEqual(resume.code, 0);
+
+    const recover = run('recover', ['main'], repoRoot);
+    assert.equal(recover.avisos.length, 1);
+    assert.match(recover.avisos[0] as string, /cancelara/);
+  });
+});
+
+// ── Propagacion del codigo de salida ────────────────────────────────
+
+test('el codigo de salida del script se propaga tal cual, sin colapsarlo a 0 o 1', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(
+        path.join(scriptsDir, 'diagnose-repo.sh'),
+        '#!/usr/bin/env bash\nexit 42\n',
+        'utf8'
+      );
+      assert.equal(run('diagnose', [], repoRoot, { scriptsDir }).code, 42);
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
+
+// ── Herencia de stdin de punta a punta ──────────────────────────────
+
+/**
+ * Repo con un "origin" real (segundo repo temporal, bare) y una rama
+ * con un stash de los que crea "taskctl pause". Es el escenario
+ * minimo en el que resume-work.sh llega de verdad a su `read -rp`.
+ */
+async function withRepoConStash(
+  fn: (repoRoot: string, rama: string) => Promise<void>
+): Promise<void> {
+  const originRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-origin-'));
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-stash-'));
+  const rama = 'feature/con-stash';
+  try {
+    git(['init', '-q', '--bare', '-b', 'main'], originRoot);
+
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    git(['remote', 'add', 'origin', originRoot], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo con stash\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['push', '-q', '-u', 'origin', 'main'], repoRoot);
+
+    git(['checkout', '-q', '-b', rama], repoRoot);
+    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'primera version\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'trabajo de la rama'], repoRoot);
+    git(['push', '-q', '-u', 'origin', rama], repoRoot);
+
+    // El stash tal y como lo deja pause-work.sh: "pause: <rama> <fecha>".
+    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'cambios a medias\n', 'utf8');
+    git(['stash', 'push', '-u', '-m', `pause: ${rama} 2026-09-06`], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+
+    await fn(repoRoot, rama);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+    await rm(originRoot, { recursive: true, force: true });
+  }
+}
+
+function taskctl(argv: string[], cwd: string, input: string): { status: number; salida: string } {
+  const result = spawnSync(process.execPath, [TASKCTL, ...argv], {
+    cwd,
+    input,
+    encoding: 'utf8',
+  });
+  assert.equal(result.error, undefined, `no se pudo lanzar taskctl: ${String(result.error)}`);
+  return { status: result.status ?? -1, salida: `${result.stdout ?? ''}${result.stderr ?? ''}` };
+}
+
+test('taskctl resume: la respuesta escrita en stdin llega al read del script (contesta "n")', async () => {
+  await withRepoConStash(async (repoRoot, rama) => {
+    const { status } = taskctl(['resume', rama], repoRoot, 'n\n');
+    assert.equal(status, 0);
+    // Contesto que NO: el stash sigue guardado y el workspace limpio.
+    assert.match(git(['stash', 'list'], repoRoot), /pause: feature\/con-stash/);
+    assert.equal(git(['status', '--porcelain'], repoRoot), '');
+  });
+});
+
+test('taskctl resume: contestando "s" el stash SI se aplica (misma prueba, respuesta contraria)', async () => {
+  await withRepoConStash(async (repoRoot, rama) => {
+    const { status } = taskctl(['resume', rama], repoRoot, 's\n');
+    assert.equal(status, 0);
+    // Contesto que SI: el stash desaparece de la lista y sus cambios
+    // vuelven al working tree. Con stdin ignorado, este test y el
+    // anterior darian el mismo resultado.
+    assert.equal(git(['stash', 'list'], repoRoot), '');
+    assert.notEqual(git(['status', '--porcelain'], repoRoot), '');
+  });
+});
+
+test('con terminal los guards no se aplican: pause con el workspace sucio llega al script', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await writeFile(path.join(repoRoot, 'sin-guardar.txt'), 'a medias', 'utf8');
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(path.join(scriptsDir, 'pause-work.sh'), DOBLE_MUDO_21, 'utf8');
+      const result = run('pause', [], repoRoot, { scriptsDir, interactivo: true });
+      assert.equal(result.code, 21);
+      assert.deepEqual(result.avisos, [], 'con terminal no hay nada de que avisar');
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
+
+test('con terminal resume sin rama tampoco corta: es el script quien pregunta', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(path.join(scriptsDir, 'resume-work.sh'), DOBLE_MUDO_21, 'utf8');
+      const result = run('resume', [], repoRoot, { scriptsDir, interactivo: true });
+      assert.equal(result.code, 21);
+      assert.deepEqual(result.avisos, []);
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
index 73c17f2..da01b45 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
@@ -9,6 +9,8 @@ import {
   currentBranch,
   isValidBranchName,
   isRemoteAvailable,
+  isGitRepo,
+  operacionEnCurso,
   localBranchExists,
   resolveMainBranch,
   resolveBaseBranchForTipo,
@@ -357,3 +359,64 @@ test('ensureBaseBranchReady: si el checkout tiene exito pero el pull --ff-only f
     });
   });
 });
+
+// ── isGitRepo / operacionEnCurso (TASK-026) ─────────────────────────
+
+test('isGitRepo: true dentro de un repo y en un subdirectorio suyo', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { mkdir } = await import('node:fs/promises');
+    const sub = path.join(repoRoot, 'a', 'b');
+    await mkdir(sub, { recursive: true });
+    assert.equal(isGitRepo(repoRoot), true);
+    assert.equal(isGitRepo(sub), true);
+  });
+});
+
+test('isGitRepo: false en un directorio que no es un repo (sin lanzar)', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-norepo-'));
+  try {
+    assert.equal(isGitRepo(dir), false);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
+
+test('operacionEnCurso: null cuando no hay nada a medias', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { writeFile } = await import('node:fs/promises');
+    await writeFile(path.join(repoRoot, 'a.txt'), 'uno\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    assert.equal(operacionEnCurso(repoRoot), null);
+  });
+});
+
+test('operacionEnCurso: "merge" con un merge en conflicto de verdad, y null tras abortarlo', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { writeFile } = await import('node:fs/promises');
+    const fichero = path.join(repoRoot, 'a.txt');
+    await writeFile(fichero, 'base\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'base'], repoRoot);
+
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(fichero, 'version de otra\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'cambio en otra'], repoRoot);
+
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(fichero, 'version de main\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'cambio en main'], repoRoot);
+
+    // Merge que conflicta a proposito: git sale != 0, por eso no se
+    // usa el helper git() de este fichero, que asevera status 0.
+    const merge = spawnSync('git', ['merge', 'otra'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.notEqual(merge.status, 0, 'el merge deberia haber conflictado');
+
+    assert.equal(operacionEnCurso(repoRoot), 'merge');
+
+    git(['merge', '--abort'], repoRoot);
+    assert.equal(operacionEnCurso(repoRoot), null);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts
index ddb76ba..883a777 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts
@@ -46,6 +46,30 @@ test('runGitflowScript: devuelve code y signal para un script real', () => {
   assert.equal(result.signal, null);
 });
 
+test('runGitflowScript: sin opcion stdin, un script que lee de la entrada recibe EOF (default "ignore")', async () => {
+  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
+  const { tmpdir } = await import('node:os');
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-runner-'));
+  try {
+    // Devuelve 0 si "read" fallo (EOF) y 1 si consiguio leer algo: al
+    // reves de lo intuitivo, para que el test distinga los dos casos
+    // sin depender del texto de salida.
+    await writeFile(
+      path.join(dir, 'lee-stdin.sh'),
+      '#!/usr/bin/env bash\nif read -r linea; then exit 1; fi\nexit 0\n',
+      'utf8'
+    );
+    const result = runGitflowScript('lee-stdin.sh', [], { scriptsDir: dir, cwd: dir });
+    assert.equal(
+      result.code,
+      0,
+      'el default sigue siendo "ignore": el ciclo de vida no debe heredar stdin'
+    );
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
+
 test('GitflowScriptLaunchError: mensaje incluye el nombre del script y el error original', () => {
   const original = new Error('spawnSync bash ENOENT');
   const err = new GitflowScriptLaunchError('create-feature.sh', original);
````
