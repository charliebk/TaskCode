# Peticion de revision — TASK-062 (ronda 1)

- Tarea: TASK-062 — taskctl doctor: comprobar que un proyecto esta listo antes de trabajar
- Rama revisada: feature/task-062-taskctl-doctor-comprobar-que-un-proyecto
- Rama base: develop
- Commit revisado (HEAD): f13346f52e95a9c83340c5022a8745731fd4e2fe
- Fecha: 2026-10-08
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-062 (criterios de aceptacion y plan)

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
f13346f chore(TASK-062): coste implementacion +11106140 tokens (1 agente)
756c3c6 feat(TASK-062): taskctl doctor comprueba que un proyecto esta listo antes de trabajar
e065780 chore(TASK-062): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 2dcd578..f71294f 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,39 @@
 # Changelog
 
 ## Sin publicar
+- TASK-062 (feature) — taskctl doctor: comprobar que un proyecto esta listo antes de trabajar (2026-10-08)
+
+Nuevo `taskctl doctor [--json]` (TASK-062). Solo lee: no escribe, no commitea, no
+cambia de rama; lo unico que sale a la red es la comprobacion de sesion de
+`gh`/`glab`, con un timeout propio de 10 s.
+
+- Una linea por comprobacion con su nivel (`ok`, `aviso`, `error` u `omitida`) y,
+  en cada aviso o error, el comando o paso que lo arregla. Sale con 1 si hay
+  algun error (los avisos no cuentan). `--json` da una sola linea de JSON
+  (`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`) y
+  nada mas en stdout, para que una skill la lea.
+- Entorno: Node 20 o superior, `git` y un `bash` que ejecuta de verdad un script
+  minimo con el mismo lanzamiento que los de Git-Flow (`mktemp`, `dirname`,
+  `grep`...): en Windows detecta el bash de WSL (System32) y el de Git sin su
+  `usr\bin` en el PATH, y dice como arreglarlo.
+- Repo: repo Git (tambien un worktree), repo sin commits (mensaje propio), las
+  cinco carpetas de `tareas/`, la rama base (`develop` o `rama_base`) y la principal
+  (`main` o `master`), `origin` (aviso; error solo con `cierre_por_defecto:
+  merge-request`) y workspace limpio (aviso; `git status` con
+  `GIT_OPTIONAL_LOCKS=0`, que no toma `index.lock`).
+- Config con el mismo validador de siempre (un valor invalido es error, una
+  clave desconocida es aviso). Tareas con recorrido propio: un ID en dos
+  carpetas, un `tarea.md` ilegible (con la ruta y la causa), una carpeta de tarea
+  sin `tarea.md` o un `estado` distinto de su carpeta son errores con el ID.
+- Plataforma: con `cierre_por_defecto: merge-request` o `plataforma_remota`
+  declarada, `gh`/`glab` instalado y con sesion. CLI no instalado o sesion
+  rechazada es error; no poder verificarlo (timeout, sin red) es aviso. Si no
+  aplica, `omitida`. Nunca imprime la URL de origin con credenciales.
+- La skill `task-workflow` manda ejecutarlo al empezar en un proyecto. Nuevo
+  script `scripts/gitflow/_sonda-bash.sh` (la sonda). Sin cambios de comportamiento
+  en `finish`: la comprobacion de sesion y la resolucion de la plataforma de
+  origin se separaron en funciones que devuelven resultado, para reutilizarlas.
+
 - TASK-061 (feature) — Merge request en cualquier GitLab, tambien autoalojado (2026-10-08)
 
 Merge request en cualquier GitLab, tambien autoalojado (TASK-061).
diff --git a/CLAUDE.md b/CLAUDE.md
index 61ad780..9828128 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -43,7 +43,7 @@ npm test             # compila y corre la suite completa (~1290 tests, ~10 min)
 npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar, no para cerrar
 ```
 
-El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | plan |
+El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | doctor [--json] | plan |
 approve | start | review | finish [--tag <nombre>] [--merge-request] [--push] | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
 recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
 cerradas.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 7ceb5b3..9e7c927 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -521,6 +521,40 @@ Ver `taskctl --help` (arriba) para la lista completa y actualizada. Guía
 extendida de la metodología: `docs/PROPUESTA_METODOLOGIA.md` y
 `docs/PLAN_SPRINTS.md` en la raíz del repo `TaskCode`.
 
+`taskctl doctor [--json]` (solo lectura) comprueba de una vez que el proyecto
+está listo para trabajar y es lo primero que conviene ejecutar al instalar el
+plugin en un proyecto. Una línea por comprobación (`ok`, `aviso`, `error` u
+`omitida`) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
+algún error (los avisos no cuentan). Comprueba:
+
+- **Entorno**: Node 20 o superior, `git` y un `bash` capaz de ejecutar los
+  scripts de Git-Flow. Lo último se prueba ejecutando de verdad un script mínimo
+  (`scripts/gitflow/_sonda-bash.sh`: `mktemp`, `dirname`, `grep`, `sed`, `tr`, `wc`,
+  `git`) con el mismo lanzamiento que usan los scripts, no mirando una ruta ni
+  `bash --version`: en Windows detecta el bash de WSL (System32) y el de Git sin
+  `usr\bin` en el PATH, y el arreglo dice qué poner al principio del PATH.
+- **Repositorio**: que es un repo Git (un worktree también), que tiene commits,
+  las cinco carpetas de `tareas/`, la rama base (`develop`, o `rama_base`) y la
+  principal (`main` o `master`), `origin` y el workspace. Sin `origin` es un aviso
+  (un proyecto solo local es legítimo) y pasa a error con `cierre_por_defecto:
+  merge-request`; un workspace sucio es un aviso. El workspace se mira con
+  `GIT_OPTIONAL_LOCKS=0`, así que no toma `index.lock`; un fallo por bloqueo es aviso.
+- **Config**: `.taskcode/config.yml` con el mismo validador que el resto de comandos
+  (un valor inválido es error con su mensaje; una clave desconocida, aviso).
+- **Tareas**: cada `tarea.md` se lee y valida, y su `estado` tiene que ser el de
+  su carpeta. Son errores, con el ID: un ID en dos carpetas, un `tarea.md` ilegible
+  (con la ruta y la causa), una carpeta de tarea sin `tarea.md`, un estado distinto
+  de la carpeta.
+- **Plataforma**: solo si la config pide merge request por defecto o declara
+  `plataforma_remota`: `gh`/`glab` instalado y con sesión (sin subir nada; espera
+  como máximo 10 s). CLI no instalado o sesión rechazada es error; no poder
+  verificarlo (timeout, sin red) es aviso; si no aplica, `omitida`. Nunca imprime
+  la URL de `origin` con credenciales.
+
+`--json` escribe en stdout **solo** una línea de JSON
+(`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
+una skill la lea. `taskctl doctor` no escribe, no commitea ni cambia de rama.
+
 `taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
 con la duración de calendario de cada fase (diseño = plan→start, curso =
 start→primer review, revisión = primer review→finish), las rondas de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
index 8c27294..9a94b4f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
@@ -11,6 +11,10 @@ repo tras confirmar que la migración estaba completa y que nada
 dependía de él en tiempo de ejecución; sigue recuperable del
 historial con `git show 4435d68d:runConfigurations.zip`.
 
+`_sonda-bash.sh` no es un script de Git-Flow: lo ejecuta `taskctl doctor` para
+comprobar que el `bash` del entorno puede correr estos scripts de verdad
+(TASK-062). No toca el repo.
+
 ## Qué cambió respecto al original
 
 Los 22 scripts de acción y `_gitflow-common.sh` son una copia literal del
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_sonda-bash.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_sonda-bash.sh
new file mode 100644
index 0000000..09d4414
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_sonda-bash.sh
@@ -0,0 +1,17 @@
+#!/usr/bin/env bash
+# Sonda de `taskctl doctor`: comprueba que ESTE bash puede ejecutar un script
+# de Git-Flow de verdad, es decir, que encuentra las herramientas que esos
+# scripts usan (mktemp, dirname, grep, sed, tr, wc, git). No toca el repo ni
+# escribe fuera de un directorio temporal propio, que borra al salir.
+# Imprime "taskctl-sonda-ok <version de bash>" solo si todo funciono.
+set -e
+tmp=$(mktemp -d)
+trap 'rm -rf "$tmp"' EXIT
+fichero="$tmp/sonda.txt"
+printf 'alfa\nbeta\n' > "$fichero"
+[ "$(dirname "$fichero")" = "$tmp" ]
+grep -q '^beta$' "$fichero"
+[ "$(sed -n '1p' "$fichero" | tr 'a-z' 'A-Z')" = "ALFA" ]
+[ "$(wc -l < "$fichero" | tr -d ' ')" = "2" ]
+git --version > /dev/null
+echo "taskctl-sonda-ok ${BASH_VERSION}"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index afec6bf..3745870 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -16,7 +16,15 @@ Cuando el repo tiene una carpeta `tareas/` con `00-planificadas/`,
 comando `taskctl` esta disponible. Si no existe esa estructura, esta skill no
 aplica.
 
-Comprobar el estado real antes de nada: `taskctl board`.
+Comprobar el estado real antes de nada: `taskctl board`. Al empezar en un
+proyecto, ejecuta tambien `taskctl doctor` (`--json` si lo vas a leer): dice
+si el entorno, el repo, la config y las tareas estan en orden y, en cada fallo,
+el comando que lo arregla. Sale con 1 si hay algun error; los avisos no
+impiden trabajar. Al empezar en un
+proyecto, ejecuta tambien `taskctl doctor` (`--json` si lo vas a leer): dice
+si el entorno, el repo, la config y las tareas estan en orden y, en cada fallo,
+el comando que lo arregla. Sale con 1 si hay algun error; los avisos no
+impiden trabajar.
 
 **Prerrequisitos**: `taskctl` en el PATH (lo aporta este plugin;
 `taskctl --version` imprime su version) y una rama `develop` en el repo. Si
@@ -114,7 +122,8 @@ Detalles que muerden:
 
 ### Lo que NO existe
 
-No inventar estos comandos: `status`, `list`, `show`, `reject`, `reopen`,
+No inventar estos comandos (`status` no existe: para saber si el proyecto esta
+listo, `taskctl doctor`; para el estado de las tareas, `board`): `status`, `list`, `show`, `reject`, `reopen`,
 `assign`, `delete`, `edit`, `init`, `commit`, `push`.
 
 `taskctl codex-review TASK-NNN` **si existe**: pide una segunda opinion al CLI
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/prerrequisitos.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/prerrequisitos.md
index 6bd56e9..139cb43 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/prerrequisitos.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/prerrequisitos.md
@@ -1,7 +1,10 @@
 # Prerrequisitos del flujo de tareas
 
 Se lee cuando `taskctl` no responde o el repo no tiene rama `develop`. Si los
-dos estan en su sitio, no hace falta nada de lo que sigue.
+dos estan en su sitio, no hace falta nada de lo que sigue. Con `taskctl`
+respondiendo, `taskctl doctor` comprueba de una vez estos y el resto de
+prerrequisitos (Node, git, bash para los scripts de Git-Flow, `tareas/`, ramas,
+config, tareas, y `gh`/`glab` si hay merge request) y da el arreglo de cada uno.
 
 **Prerrequisito 1 — `taskctl` disponible**: lo aporta este mismo plugin. Su
 ejecutable vive en `bin/`, que Claude Code anade al PATH del Bash tool
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index f8a65e2..c6d97c7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -18,6 +18,7 @@ import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex
 import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
+import { runDoctorCommand, DoctorCommandError } from './commands/doctor.js';
 import { runPausaCommand, PausaCommandError } from './commands/pausa.js';
 import { runRegistrarCosteCommand, RegistrarCosteCommandError } from './commands/registrar-coste.js';
 import {
@@ -79,6 +80,7 @@ Uso:
                     [--informe <nombre>] [--push]
   taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--push]
   taskctl siguiente TASK-NNN [--json]
+  taskctl doctor [--json]
   taskctl pausa TASK-NNN [--push]
   taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> \\
                           (--agente <id>... | --tokens N) [--push]
@@ -90,7 +92,7 @@ Uso:
   taskctl abort-merge
 
 Comandos: new, import, board, metricas, start, plan, approve, review, codex-review, veredicto,
-finish, siguiente, pausa, registrar-coste, cadena.
+finish, siguiente, doctor, pausa, registrar-coste, cadena.
 metricas saca, por tarea, cuanto duro cada fase (diseno, curso, revision) y
 cuantas rondas de revision hubo; --heuristica compara la complejidad declarada
 con la que da la heuristica en las tareas terminadas. --tokens anade el coste en
@@ -107,6 +109,11 @@ de mergear: la tarea sigue en en-revision y, cuando la plataforma lo da por merg
 taskctl finish TASK-NNN [--tag <nombre>] la cierra (el estado lo da la plataforma). Con
 --merge-request el tag va en ese segundo finish. En hotfix/release --tag da el nombre al
 tag que ya ponia el script.
+doctor comprueba que el proyecto esta listo (Node, git, bash para los scripts de Git-Flow, tareas/,
+ramas develop y main/master, origin, workspace, .taskcode/config.yml, coherencia de las tareas y, si la
+config pide merge request o declara plataforma, gh/glab y su sesion). Una linea por comprobacion
+(ok, aviso, error u omitida) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
+algun error. Solo lee. --json da lo mismo en una linea de JSON.
 siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
 manual, semiautomatico o automatico); solo lee. pausa registra que la persona
 no quiere pasar todavia a la siguiente fase. cadena bloquea el arbol mientras
@@ -672,6 +679,20 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'doctor') {
+    try {
+      const r = runDoctorCommand(argv.slice(1), { repoCwd: process.cwd() });
+      process.stdout.write(r.salida);
+      return r.codigo;
+    } catch (e) {
+      if (e instanceof DoctorCommandError) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'siguiente') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
new file mode 100644
index 0000000..db89281
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -0,0 +1,567 @@
+/**
+ * `taskctl doctor [--json]` — TASK-062.
+ *
+ * Comprueba, de una vez, que el proyecto esta listo para trabajar con el flujo
+ * de tareas: entorno (Node, git, bash para los scripts de Git-Flow),
+ * repositorio (estructura de tareas/, ramas base, origin, workspace),
+ * configuracion, coherencia de las tareas y, si la config lo pide, el CLI de la
+ * plataforma (gh/glab) y su sesion. SOLO LEE: no escribe, no commitea, no
+ * cambia de rama; lo unico que sale a la red es la comprobacion de sesion de
+ * la plataforma, con timeout propio corto.
+ *
+ * Decisiones (plan de TASK-062, Carlos 2026-10-08):
+ *
+ * - Cada comprobacion va envuelta (`envolver`): una excepcion es un resultado
+ *   `error` de ESA comprobacion, nunca un throw hacia el catch-all del CLI, y
+ *   el resto sigue. No imprime: devuelve la salida ya formateada.
+ * - bash: se ejecuta de verdad un script minimo con el MISMO lanzamiento que
+ *   los de Git-Flow (`sondearBash`); no vale mirar la ruta ni `--version`.
+ * - tareas/: recorrido PROPIO. `listTareasEnEstados` salta los IDs repetidos y
+ *   esconde los tarea.md rotos en `ilegibles` sin causa, justo lo que doctor
+ *   tiene que decir.
+ * - workspace: `git status` con GIT_OPTIONAL_LOCKS=0 (no toma index.lock); un
+ *   fallo por lock es aviso.
+ * - origin: aviso, y error solo con `cierre_por_defecto: merge-request`.
+ * - Sesion de plataforma no verificable (timeout, red): aviso. Error solo lo
+ *   confirmado: CLI no instalado o sesion rechazada.
+ * - Config: el validador de siempre (`resolverConfigConAvisos`), sin copia.
+ *   Un valor invalido es error; una clave desconocida, aviso.
+ */
+import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import {
+  aviso,
+  codigoSalida,
+  error as fallo,
+  formatearJson,
+  formatearTexto,
+  nodeSoportado,
+  NODE_MINIMO,
+  ok,
+  omitida,
+  type Comprobacion,
+} from '../core/doctor.js';
+import { resolverConfigConAvisos, CONFIG_DEFAULTS, type TaskcodeConfig } from '../core/config.js';
+import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
+import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
+import { parseTareaFile } from '../core/tarea-file.js';
+import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
+import { urlsDeOrigin } from '../fs/git.js';
+import { sondearCli } from '../fs/merge-request.js';
+import { resolverRemotoDeOrigin } from './finish-opciones.js';
+
+export class DoctorCommandError extends Error {}
+
+/** Flags de `taskctl doctor`: solo --json. */
+export const FLAGS_DOCTOR: readonly string[] = ['--json'];
+
+/** Espera maxima de la comprobacion de sesion de la plataforma (el unico acceso a la red). */
+export const TIMEOUT_PLATAFORMA_MS = 10_000;
+/** Espera maxima de cada `git` lanzado por doctor. */
+const TIMEOUT_GIT_MS = 15_000;
+
+export interface DoctorCommandDeps {
+  repoCwd: string;
+  /** Carpeta de los scripts de Git-Flow (por defecto la del plugin). Para los tests. */
+  scriptsDir?: string;
+  /** Timeout de la sesion de plataforma (por defecto 10 s). Para los tests. */
+  timeoutPlataformaMs?: number;
+}
+
+export interface DoctorCommandResult {
+  comprobaciones: Comprobacion[];
+  /** 0 sin errores, 1 con alguno. */
+  codigo: 0 | 1;
+  /** Lo que hay que escribir en stdout: el texto, o SOLO el JSON con --json. */
+  salida: string;
+  json: boolean;
+}
+
+// ---------------------------------------------------------------------
+// Utilidades
+// ---------------------------------------------------------------------
+
+/** Una comprobacion (o varias) que nunca lanza: una excepcion se vuelve su resultado `error`. */
+export function envolver(id: string, f: () => Comprobacion | Comprobacion[]): Comprobacion[] {
+  try {
+    const r = f();
+    return Array.isArray(r) ? r : [r];
+  } catch (e: unknown) {
+    const msg = ocultarCredenciales(e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim();
+    return [
+      fallo(
+        id,
+        `la comprobacion fallo por una excepcion: ${msg}`,
+        'Es un fallo de la propia comprobacion, no necesariamente del proyecto: repite taskctl doctor y, ' +
+          'si persiste, revisa que el directorio existe y se puede leer.'
+      ),
+    ];
+  }
+}
+
+interface GitSalida {
+  status: number | null;
+  stdout: string;
+  stderr: string;
+  /** Error de lanzamiento (git no esta, directorio inexistente, timeout). */
+  error: Error | undefined;
+}
+
+/** `git` sin lanzar nunca: el resultado lleva el error de lanzamiento. */
+function git(args: readonly string[], cwd: string, env: NodeJS.ProcessEnv = {}): GitSalida {
+  const r: SpawnSyncReturns<string> = spawnSync('git', args, {
+    cwd,
+    encoding: 'utf8',
+    stdio: ['ignore', 'pipe', 'pipe'],
+    timeout: TIMEOUT_GIT_MS,
+    env: { ...process.env, ...env },
+  });
+  return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim(), error: r.error };
+}
+
+const una = (t: string): string => ocultarCredenciales(t).replace(/\s+/g, ' ').trim();
+
+function ramaLocal(nombre: string, cwd: string): boolean {
+  return git(['show-ref', '--verify', '--quiet', `refs/heads/${nombre}`], cwd).status === 0;
+}
+
+function ramaEnOrigin(nombre: string, cwd: string): boolean {
+  return git(['show-ref', '--verify', '--quiet', `refs/remotes/origin/${nombre}`], cwd).status === 0;
+}
+
+// ---------------------------------------------------------------------
+// Entorno
+// ---------------------------------------------------------------------
+
+function comprobarNode(): Comprobacion {
+  const v = process.versions.node;
+  return nodeSoportado(v)
+    ? ok('node', `Node ${v} (minimo ${NODE_MINIMO})`)
+    : fallo(
+        'node',
+        `Node ${v} es anterior al minimo soportado (${NODE_MINIMO})`,
+        `Instala Node ${NODE_MINIMO} o superior (https://nodejs.org) y abre una terminal nueva.`
+      );
+}
+
+function comprobarGit(cwd: string): Comprobacion {
+  const r = git(['--version'], cwd);
+  if (r.error !== undefined || r.status !== 0) {
+    return fallo(
+      'git',
+      `no se pudo ejecutar "git" (${una(r.error?.message ?? r.stderr)})`,
+      'Instala Git (https://git-scm.com) y comprueba que "git" esta en el PATH: git --version.'
+    );
+  }
+  return ok('git', r.stdout);
+}
+
+function arregloBash(): string {
+  return process.platform === 'win32'
+    ? 'Instala Git for Windows (https://git-scm.com/download/win) y pon su carpeta usr\\bin al PRINCIPIO del PATH, ' +
+        'antes de C:\\Windows\\System32 (ahi vive el bash de WSL, que no vale). En PowerShell, para esta terminal: ' +
+        '$env:Path = "C:\\Program Files\\Git\\usr\\bin;" + $env:Path ; para siempre, editalo en las variables de ' +
+        'entorno del sistema y abre una terminal nueva. Despues repite taskctl doctor.'
+    : 'Instala bash y las herramientas basicas (coreutils, grep, sed) y comprueba que "bash" esta en el PATH: ' +
+        'bash -c "mktemp -d". Despues repite taskctl doctor.';
+}
+
+function comprobarBash(deps: DoctorCommandDeps): Comprobacion {
+  const r = sondearBash({ scriptsDir: deps.scriptsDir ?? resolveGitflowScriptsDir(), cwd: deps.repoCwd });
+  if (r.ok) return ok('bash', `bash ejecuta los scripts de Git-Flow${r.version === '' ? '' : ` (bash ${r.version})`}`);
+  const que =
+    r.causa === 'no-lanzable'
+      ? `no se pudo lanzar "bash" (${una(r.detalle)})`
+      : r.causa === 'timeout'
+        ? 'bash no termino el script de prueba a tiempo'
+        : `bash no pudo ejecutar el script de prueba de Git-Flow (${una(r.detalle)})`;
+  return fallo('bash', que, arregloBash());
+}
+
+// ---------------------------------------------------------------------
+// Repositorio
+// ---------------------------------------------------------------------
+
+const SUBCARPETAS_TAREAS: readonly string[] = TASK_STATES.map((e) => STATE_FOLDER[e]);
+
+function comprobarCarpetas(tareasRoot: string): Comprobacion {
+  const faltan = SUBCARPETAS_TAREAS.filter((c) => {
+    try {
+      return !statSync(path.join(tareasRoot, c)).isDirectory();
+    } catch {
+      return true;
+    }
+  });
+  if (faltan.length === 0) return ok('tareas-carpetas', `tareas/ tiene las cinco carpetas (${SUBCARPETAS_TAREAS[0]} .. ${SUBCARPETAS_TAREAS[4]})`);
+  const hayRaiz = existsSync(tareasRoot);
+  return fallo(
+    'tareas-carpetas',
+    hayRaiz ? `a tareas/ le faltan: ${faltan.join(', ')}` : 'no existe la carpeta tareas/ (o no es un directorio)',
+    `mkdir -p ${faltan.map((c) => `tareas/${c}`).join(' ')}`
+  );
+}
+
+interface EstadoRepo {
+  esRepo: boolean;
+  conCommits: boolean;
+}
+
+function comprobarRepo(cwd: string, gitOk: boolean): { cs: Comprobacion[]; repo: EstadoRepo } {
+  if (!gitOk) {
+    return {
+      cs: [omitida('repo-git', 'sin git no se puede comprobar el repositorio (ver git)')],
+      repo: { esRepo: false, conCommits: false },
+    };
+  }
+  const dentro = git(['rev-parse', '--is-inside-work-tree'], cwd);
+  if (dentro.status !== 0 || dentro.stdout !== 'true') {
+    return {
+      cs: [
+        fallo(
+          'repo-git',
+          'este directorio no esta dentro de un repositorio Git',
+          'Ejecuta taskctl desde la raiz del proyecto, o crea el repo: git init -b main && ' +
+            'git commit --allow-empty -m "chore: commit inicial" && git branch develop'
+        ),
+      ],
+      repo: { esRepo: false, conCommits: false },
+    };
+  }
+  let enlazado = false;
+  try {
+    enlazado = statSync(path.join(cwd, '.git')).isFile();
+  } catch {
+    enlazado = false;
+  }
+  const cs: Comprobacion[] = [ok('repo-git', enlazado ? 'repositorio Git (worktree o submodulo: .git es un fichero)' : 'repositorio Git')];
+  const head = git(['rev-parse', '--verify', '--quiet', 'HEAD'], cwd);
+  if (head.status !== 0) {
+    cs.push(
+      fallo(
+        'repo-commits',
+        'el repositorio no tiene ningun commit todavia, asi que aun no existe ninguna rama (ni develop ni la principal)',
+        'Haz el primer commit: git add -A && git commit -m "chore: commit inicial" ; despues crea la rama de integracion: git branch develop'
+      )
+    );
+    return { cs, repo: { esRepo: true, conCommits: false } };
+  }
+  cs.push(ok('repo-commits', 'el repositorio tiene commits'));
+  return { cs, repo: { esRepo: true, conCommits: true } };
+}
+
+/** `main` o `master`: la local, o (aviso) solo la de origin. */
+function ramaPrincipal(cwd: string): { nombre: string; soloOrigin: boolean } | null {
+  for (const n of ['main', 'master']) if (ramaLocal(n, cwd)) return { nombre: n, soloOrigin: false };
+  for (const n of ['main', 'master']) if (ramaEnOrigin(n, cwd)) return { nombre: n, soloOrigin: true };
+  return null;
+}
+
+function comprobarRamas(cwd: string, base: string, repo: EstadoRepo): Comprobacion[] {
+  if (!repo.esRepo || !repo.conCommits) {
+    const motivo = repo.esRepo ? 'el repo no tiene commits (ver repo-commits)' : 'no hay repositorio (ver repo-git)';
+    return [omitida('rama-base', `no se puede comprobar la rama "${base}": ${motivo}`), omitida('rama-principal', `no se puede comprobar: ${motivo}`)];
+  }
+  const principal = ramaPrincipal(cwd);
+  const cs: Comprobacion[] = [];
+  if (ramaLocal(base, cwd)) {
+    cs.push(ok('rama-base', `existe la rama "${base}"`));
+  } else if (ramaEnOrigin(base, cwd)) {
+    cs.push(aviso('rama-base', `"${base}" solo existe en origin, no en local`, `git branch ${base} origin/${base}`));
+  } else {
+    cs.push(
+      fallo(
+        'rama-base',
+        `no existe la rama "${base}" (de ella cuelgan las tareas feature, fix y release)`,
+        `git branch ${base}${principal === null ? '' : ` ${principal.soloOrigin ? `origin/${principal.nombre}` : principal.nombre}`}`
+      )
+    );
+  }
+  if (principal === null) {
+    cs.push(
+      fallo(
+        'rama-principal',
+        'no existe ni "main" ni "master" (de ella cuelgan los hotfix y reciben las releases)',
+        'Crea la rama principal desde el commit que quieras publicar: git branch main <commit>'
+      )
+    );
+  } else if (principal.soloOrigin) {
+    cs.push(
+      aviso('rama-principal', `"${principal.nombre}" solo existe en origin, no en local`, `git branch ${principal.nombre} origin/${principal.nombre}`)
+    );
+  } else {
+    cs.push(ok('rama-principal', `existe la rama principal "${principal.nombre}"`));
+  }
+  return cs;
+}
+
+function comprobarOrigin(cwd: string, repo: EstadoRepo, cfg: TaskcodeConfig): { c: Comprobacion; hay: boolean } {
+  if (!repo.esRepo) return { c: omitida('origin', 'no hay repositorio (ver repo-git)'), hay: false };
+  const r = git(['remote', 'get-url', 'origin'], cwd);
+  if (r.status === 0 && r.stdout !== '') {
+    const host = urlsDeOrigin(cwd)
+      .map((u) => hostDeRemoto(u))
+      .find((h) => h !== null);
+    return { c: ok('origin', host === undefined ? 'hay un remoto "origin"' : `hay un remoto "origin" (host ${host})`), hay: true };
+  }
+  const arreglo = 'git remote add origin <url-del-repositorio>';
+  if (cfg.cierre_por_defecto === 'merge-request') {
+    return {
+      c: fallo('origin', 'no hay remoto "origin" y la config pide merge request por defecto (cierre_por_defecto: merge-request)', arreglo),
+      hay: false,
+    };
+  }
+  return {
+    c: aviso('origin', 'no hay remoto "origin" (trabajo solo local: no se podra subir ni abrir un merge request)', arreglo),
+    hay: false,
+  };
+}
+
+function comprobarWorkspace(cwd: string, repo: EstadoRepo): Comprobacion {
+  if (!repo.esRepo) return omitida('workspace', 'no hay repositorio (ver repo-git)');
+  const r = git(['status', '--porcelain'], cwd, { GIT_OPTIONAL_LOCKS: '0' });
+  if (r.error !== undefined || r.status !== 0) {
+    const causa = una(r.error?.message ?? r.stderr);
+    if (/lock/i.test(causa)) {
+      return aviso(
+        'workspace',
+        `no se pudo comprobar el workspace porque Git esta bloqueado (${causa})`,
+        'Espera a que termine la otra operacion de Git y repite taskctl doctor; si no hay ninguna, borra el .git/index.lock huerfano.'
+      );
+    }
+    return fallo('workspace', `git status fallo (${causa})`, 'Ejecuta git status en el proyecto y resuelve lo que diga.');
+  }
+  if (r.stdout === '') return ok('workspace', 'el workspace esta limpio');
+  const n = r.stdout.split(/\r?\n/).length;
+  return aviso(
+    'workspace',
+    `el workspace tiene ${n} ${n === 1 ? 'cambio' : 'cambios'} sin commitear (los comandos que escriben exigen un arbol limpio)`,
+    'git status ; commitea o aparca lo pendiente (git stash -u) antes de taskctl start o finish.'
+  );
+}
+
+// ---------------------------------------------------------------------
+// Configuracion
+// ---------------------------------------------------------------------
+
+function comprobarConfig(cwd: string): { cs: Comprobacion[]; cfg: TaskcodeConfig } {
+  try {
+    const { config, avisos } = resolverConfigConAvisos(cwd);
+    const cs: Comprobacion[] = [ok('config', '.taskcode/config.yml es valida (o no existe: valores por defecto)')];
+    if (avisos.length === 0) cs.push(ok('config-claves', 'sin claves desconocidas'));
+    else
+      for (const a of avisos) {
+        cs.push(aviso('config-claves', una(a), 'Corrige o borra esa clave en .taskcode/config.yml: se ignora y puede ser una errata.'));
+      }
+    return { cs, cfg: config };
+  } catch (e: unknown) {
+    const msg = e instanceof Error ? e.message : String(e);
+    return {
+      cs: [
+        fallo('config', una(msg), 'Corrige .taskcode/config.yml segun el mensaje (o borralo para usar los valores por defecto).'),
+        omitida('config-claves', 'la config no se pudo leer (ver config)'),
+      ],
+      cfg: { ...CONFIG_DEFAULTS },
+    };
+  }
+}
+
+// ---------------------------------------------------------------------
+// Tareas
+// ---------------------------------------------------------------------
+
+function codigoDe(e: unknown): string | undefined {
+  return typeof e === 'object' && e !== null ? (e as { code?: string }).code : undefined;
+}
+
+/** Recorrido propio de tareas/ (ver cabecera): lo que `listTareasEnEstados` esconde, aqui se dice. */
+function comprobarTareas(tareasRoot: string): Comprobacion[] {
+  if (!existsSync(tareasRoot)) return [omitida('tareas', 'no hay carpeta tareas/ (ver tareas-carpetas)')];
+  const problemas: Comprobacion[] = [];
+  const carpetasDe = new Map<string, string[]>();
+  let total = 0;
+  for (const estado of TASK_STATES) {
+    const carpeta = STATE_FOLDER[estado];
+    const dir = path.join(tareasRoot, carpeta);
+    let entradas: string[];
+    try {
+      entradas = readdirSync(dir).sort();
+    } catch (e: unknown) {
+      if (codigoDe(e) === 'ENOENT') continue;
+      problemas.push(
+        fallo(`tareas:${carpeta}`, `no se pudo leer tareas/${carpeta}/ (${una(e instanceof Error ? e.message : String(e))})`, `Revisa los permisos de tareas/${carpeta}.`)
+      );
+      continue;
+    }
+    for (const id of entradas) {
+      if (!isValidTaskId(id)) continue;
+      total++;
+      carpetasDe.set(id, [...(carpetasDe.get(id) ?? []), carpeta]);
+      const rel = `tareas/${carpeta}/${id}/tarea.md`;
+      let contenido: string;
+      try {
+        contenido = readFileSync(path.join(dir, id, 'tarea.md'), 'utf8');
+      } catch (e: unknown) {
+        if (codigoDe(e) === 'ENOENT') {
+          problemas.push(
+            fallo(
+              `tarea:${id}:sin-tarea-md`,
+              `${id}: la carpeta ${rel.replace('/tarea.md', '')} no tiene tarea.md`,
+              `Restaura el fichero (git checkout -- ${rel}) o, si la carpeta sobra, borrala: rmdir tareas/${carpeta}/${id}`
+            )
+          );
+        } else {
+          problemas.push(
+            fallo(`tarea:${id}:ilegible`, `${id}: no se pudo leer ${rel} (${una(e instanceof Error ? e.message : String(e))})`, `Revisa los permisos y que ${rel} es un fichero.`)
+          );
+        }
+        continue;
+      }
+      let task;
+      try {
+        task = parseTareaFile(contenido).task;
+      } catch (e: unknown) {
+        problemas.push(
+          fallo(
+            `tarea:${id}:ilegible`,
+            `${id}: ${rel} no se puede leer ni validar (${una(e instanceof Error ? e.message : String(e))})`,
+            `Corrige el frontmatter de ${rel} segun esa causa (o restaura la version buena: git checkout -- ${rel}).`
+          )
+        );
+        continue;
+      }
+      if (task.id !== id) {
+        problemas.push(
+          fallo(
+            `tarea:${id}:id`,
+            `${id}: ${rel} dice id "${task.id}", distinto del nombre de su carpeta`,
+            `Pon "id: ${id}" en el frontmatter de ${rel}, o renombra la carpeta.`
+          )
+        );
+        continue;
+      }
+      if (task.estado !== estado) {
+        problemas.push(
+          fallo(
+            `tarea:${id}:estado`,
+            `${id}: esta en ${carpeta}/ pero su estado es "${task.estado}"`,
+            `Si la carpeta es la correcta, pon "estado: ${estado}" en ${rel}; si lo es el estado, muevela: ` +
+              `git mv tareas/${carpeta}/${id} tareas/${STATE_FOLDER[task.estado]}/${id}`
+          )
+        );
+      }
+    }
+  }
+  for (const [id, carpetas] of carpetasDe) {
+    if (carpetas.length < 2) continue;
+    problemas.push(
+      fallo(
+        `tarea:${id}:duplicado`,
+        `${id} esta en ${carpetas.length} carpetas a la vez: ${carpetas.join(', ')}`,
+        `Deja una sola copia: mira cual es la vigente (git log --oneline -- tareas/*/${id}) y borra la otra: git rm -r tareas/${carpetas[0]}/${id}`
+      )
+    );
+  }
+  if (problemas.length > 0) return problemas;
+  return [ok('tareas', total === 0 ? 'no hay tareas todavia' : `${total} ${total === 1 ? 'tarea' : 'tareas'}: todas legibles y en la carpeta de su estado`)];
+}
+
+// ---------------------------------------------------------------------
+// Plataforma (gh / glab)
+// ---------------------------------------------------------------------
+
+function comprobarPlataforma(cwd: string, cfg: TaskcodeConfig, hayOrigin: boolean, timeoutMs: number): Comprobacion {
+  const aplica = cfg.cierre_por_defecto === 'merge-request' || cfg.plataforma_remota !== null;
+  if (!aplica) {
+    return omitida('plataforma', 'no hay merge request por defecto ni plataforma declarada en la config: no hace falta gh ni glab');
+  }
+  if (!hayOrigin) return omitida('plataforma', 'sin remoto "origin" no hay plataforma que comprobar (ver origin)');
+  const d = resolverRemotoDeOrigin(cwd, cfg);
+  if (!d.ok) {
+    return fallo(
+      'plataforma',
+      una(d.mensaje),
+      'Apunta origin a github.com o a un host de GitLab, o declara la plataforma en .taskcode/config.yml ' +
+        '("plataforma_remota: gitlab" y, si cuelga de una ruta, "url_base_remoto").'
+    );
+  }
+  const cli = CLI_PLATAFORMA[d.remoto.plataforma];
+  const s = sondearCli(d.remoto, cwd, timeoutMs);
+  if (s.ok) return ok('plataforma', `"${cli}" instalado y con sesion en ${d.remoto.host}`);
+  if (s.noVerificable) {
+    return aviso(
+      'plataforma',
+      `no se pudo verificar la sesion de "${cli}" (sin respuesta a tiempo o sin red): ${una(s.problema)}`,
+      `Comprueba la conexion (VPN, proxy) y repite taskctl doctor; o a mano: ${cli} auth status`
+    );
+  }
+  return fallo('plataforma', una(s.problema), `${s.ayuda}.`);
+}
+
+// ---------------------------------------------------------------------
+// Orquestacion
+// ---------------------------------------------------------------------
+
+export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDeps): DoctorCommandResult {
+  rechazarFlagsDesconocidos(argv, FLAGS_DOCTOR, 'doctor', (m) => new DoctorCommandError(m));
+  const sobra = argv.find((a) => !a.startsWith('-'));
+  if (sobra !== undefined) {
+    throw new DoctorCommandError(`[ERROR] taskctl doctor: no admite argumentos ("${sobra}"). Uso: taskctl doctor [--json].`);
+  }
+  const json = argv.includes('--json');
+  const cwd = deps.repoCwd;
+  const tareasRoot = path.join(cwd, 'tareas');
+  const cs: Comprobacion[] = [];
+
+  // Entorno
+  cs.push(...envolver('node', comprobarNode));
+  const gitC = envolver('git', () => comprobarGit(cwd));
+  cs.push(...gitC);
+  cs.push(...envolver('bash', () => comprobarBash(deps)));
+
+  // La config se lee primero (las ramas y origin dependen de ella) y se muestra despues.
+  let cfg: TaskcodeConfig = { ...CONFIG_DEFAULTS };
+  let csConfig: Comprobacion[] = [];
+  csConfig = envolver('config', () => {
+    const r = comprobarConfig(cwd);
+    cfg = r.cfg;
+    return r.cs;
+  });
+
+  // Repositorio
+  let repo: EstadoRepo = { esRepo: false, conCommits: false };
+  cs.push(
+    ...envolver('repo-git', () => {
+      const r = comprobarRepo(cwd, gitC[0]?.nivel === 'ok');
+      repo = r.repo;
+      return r.cs;
+    })
+  );
+  cs.push(...envolver('tareas-carpetas', () => comprobarCarpetas(tareasRoot)));
+  cs.push(...envolver('rama-base', () => comprobarRamas(cwd, cfg.rama_base, repo)));
+  let hayOrigin = false;
+  cs.push(
+    ...envolver('origin', () => {
+      const r = comprobarOrigin(cwd, repo, cfg);
+      hayOrigin = r.hay;
+      return r.c;
+    })
+  );
+  cs.push(...envolver('workspace', () => comprobarWorkspace(cwd, repo)));
+
+  cs.push(...csConfig);
+  cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
+  cs.push(
+    ...envolver('plataforma', () =>
+      comprobarPlataforma(cwd, cfg, hayOrigin, deps.timeoutPlataformaMs ?? TIMEOUT_PLATAFORMA_MS)
+    )
+  );
+
+  return {
+    comprobaciones: cs,
+    codigo: codigoSalida(cs),
+    salida: json ? formatearJson(cs) : formatearTexto(cs),
+    json,
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
index 08be5d3..8728ecd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
@@ -33,7 +33,7 @@ import {
   type ResolucionDeclarada,
   type RemotoPlataforma,
 } from '../core/plataforma-remota.js';
-import { resolverConfig } from '../core/config.js';
+import { resolverConfig, type TaskcodeConfig } from '../core/config.js';
 
 export class FinishCommandError extends Error {}
 
@@ -271,43 +271,58 @@ export function preflightMergeRequest(id: string, cwd: string): RemotoPlataforma
         'Configuralo (git remote add origin <url>) o cierra con merge normal; no se ha subido nada.'
     );
   }
-  const { plataforma_remota: plataforma, url_base_remoto: urlBase } = resolverConfig(cwd);
+  const d = resolverRemotoDeOrigin(cwd);
+  if (!d.ok) {
+    throw new FinishCommandError(`[ERROR] ${id}: --merge-request: ${d.mensaje}${d.cierre}`);
+  }
+  const cli = comprobarCli(d.remoto, cwd);
+  if (!cli.ok) {
+    throw new FinishCommandError(`[ERROR] ${id}: --merge-request: ${cli.mensaje} No se ha subido nada.`);
+  }
+  return d.remoto;
+}
+
+export type ResolucionRemotoDeOrigin =
+  | { ok: true; remoto: RemotoPlataforma }
+  /** `mensaje` es el motivo; `cierre` lo que preflight le anade detras ("No se ha subido nada."). */
+  | { ok: false; mensaje: string; cierre: string };
+
+/**
+ * La plataforma de origin (declarada en config, o deducida por el host), SIN
+ * comprobar el CLI y sin lanzar: lo que `preflightMergeRequest` decidia en
+ * linea, sacado para que `taskctl doctor` lo reuse (TASK-062). Supone que
+ * hay origin (quien llama lo comprueba antes); `config` evita releerla. Los textos son los de siempre.
+ */
+export function resolverRemotoDeOrigin(
+  cwd: string,
+  config: Pick<TaskcodeConfig, 'plataforma_remota' | 'url_base_remoto'> = resolverConfig(cwd)
+): ResolucionRemotoDeOrigin {
+  const { plataforma_remota: plataforma, url_base_remoto: urlBase } = config;
   if (plataforma !== null) {
     const d = resolverRemotoDeclarado(urlsDeOrigin(cwd), { plataforma, urlBase });
-    if (!d.ok) {
-      throw new FinishCommandError(
-        `[ERROR] ${id}: --merge-request: ${motivoDeclarado(d, plataforma, urlBase)} No se ha subido nada.`
-      );
-    }
-    const cli = comprobarCli(d.remoto, cwd);
-    if (!cli.ok) {
-      throw new FinishCommandError(`[ERROR] ${id}: --merge-request: ${cli.mensaje} No se ha subido nada.`);
-    }
-    return d.remoto;
+    if (!d.ok) return { ok: false, mensaje: motivoDeclarado(d, plataforma, urlBase), cierre: ' No se ha subido nada.' };
+    return { ok: true, remoto: d.remoto };
   }
   let hostDesconocido: string | null = null;
   for (const url of urlsDeOrigin(cwd)) {
     const d = detectarPlataforma(url);
-    if (d.ok) {
-      const cli = comprobarCli(d.remoto, cwd);
-      if (!cli.ok) {
-        throw new FinishCommandError(`[ERROR] ${id}: --merge-request: ${cli.mensaje} No se ha subido nada.`);
-      }
-      return d.remoto;
-    }
+    if (d.ok) return { ok: true, remoto: d.remoto };
     if (d.host !== null && hostDesconocido === null) hostDesconocido = d.host;
   }
-  throw new FinishCommandError(
-    hostDesconocido === null
-      ? `[ERROR] ${id}: --merge-request: "origin" no apunta a una URL de red (https o ssh) de GitHub ` +
+  return {
+    ok: false,
+    cierre: '; no se ha subido nada.',
+    mensaje:
+      hostDesconocido === null
+        ? '"origin" no apunta a una URL de red (https o ssh) de GitHub ' +
           'ni de GitLab, asi que no se sabe que CLI usar. Apunta origin a github.com (gh) o a un host de ' +
-          'GitLab (glab), o cierra con merge normal; no se ha subido nada.'
-      : `[ERROR] ${id}: --merge-request: el host de origin ("${hostDesconocido}") no es github.com ni un host ` +
+          'GitLab (glab), o cierra con merge normal'
+        : `el host de origin ("${hostDesconocido}") no es github.com ni un host ` +
           'de GitLab (su nombre debe contener "gitlab"), asi que no se sabe que CLI usar. No se supone ' +
           'GitLab. Si lo es, declaralo en .taskcode/config.yml con "plataforma_remota: gitlab" (y ' +
           '"url_base_remoto" si cuelga de una ruta). Usa un origin de github.com (gh) o de un host de GitLab ' +
-          '(glab), o cierra con merge normal; no se ha subido nada.'
-  );
+          '(glab), o cierra con merge normal',
+  };
 }
 
 /** Por que no se pudo resolver el remoto declarado, en palabras de persona y sin credenciales. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 3366399..abe4720 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -262,6 +262,21 @@ export function rutaConfig(cwd: string): string {
  * tests.
  */
 export function resolverConfig(cwd: string): TaskcodeConfig {
+  return resolverConfigInterno(cwd, emitirAvisos);
+}
+
+/**
+ * Lo mismo que resolverConfig pero sin tocar stderr: los avisos (claves
+ * desconocidas) se devuelven. Lo usa `taskctl doctor`, que los muestra en su
+ * propia salida. Un solo validador: es el mismo codigo, no una copia.
+ */
+export function resolverConfigConAvisos(cwd: string): { config: TaskcodeConfig; avisos: string[] } {
+  const avisos: string[] = [];
+  const config = resolverConfigInterno(cwd, (a) => avisos.push(...a));
+  return { config, avisos };
+}
+
+function resolverConfigInterno(cwd: string, avisar: (avisos: readonly string[]) => void): TaskcodeConfig {
   const ruta = rutaConfig(cwd);
   let contenido: string;
   try {
@@ -303,7 +318,7 @@ export function resolverConfig(cwd: string): TaskcodeConfig {
     );
   }
   const { config, avisos } = parsearConfigConAvisos(contenido, ruta);
-  emitirAvisos(avisos);
+  avisar(avisos);
   // Lo unico de las rutas de sincronizacion que necesita disco: que
   // ninguna sea una carpeta existente. Con una carpeta, el
   // `git add -A -- <ruta>` acotado se convierte en un barrido de todo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor.ts
new file mode 100644
index 0000000..1d4d8b1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor.ts
@@ -0,0 +1,101 @@
+/**
+ * Nucleo puro de `taskctl doctor` (TASK-062): el modelo de una comprobacion,
+ * el codigo de salida y los dos formatos de salida. No toca disco ni lanza
+ * procesos; la orquestacion esta en commands/doctor.ts.
+ *
+ * Niveles: `ok`, `aviso` (no cambia el codigo de salida), `error` (lo pone a
+ * 1) y `omitida` (no aplica o depende de algo que ya fallo). Toda comprobacion
+ * que no es `ok` ni `omitida` dice como arreglarla (`arreglo`).
+ *
+ * Todo texto que sale de aqui pasa por `ocultarCredenciales`, en texto y en
+ * JSON: lo que dicen git, gh y glab a veces repite la URL del remoto.
+ */
+import { ocultarCredenciales } from './plataforma-remota.js';
+
+export type NivelComprobacion = 'ok' | 'aviso' | 'error' | 'omitida';
+
+export interface Comprobacion {
+  /** Identificador estable (`node`, `bash`, `tarea:TASK-005:estado`...). */
+  id: string;
+  nivel: NivelComprobacion;
+  mensaje: string;
+  /** Comando o paso concreto que lo arregla; null si no hace falta. */
+  arreglo: string | null;
+}
+
+/** Version minima de Node que soporta el plugin (el CI corre en 22; los tests usan `import.meta.dirname`, de 20.11). */
+export const NODE_MINIMO = 20;
+
+export const ok = (id: string, mensaje: string): Comprobacion => ({ id, nivel: 'ok', mensaje, arreglo: null });
+export const aviso = (id: string, mensaje: string, arreglo: string): Comprobacion => ({
+  id,
+  nivel: 'aviso',
+  mensaje,
+  arreglo,
+});
+export const error = (id: string, mensaje: string, arreglo: string): Comprobacion => ({
+  id,
+  nivel: 'error',
+  mensaje,
+  arreglo,
+});
+export const omitida = (id: string, mensaje: string): Comprobacion => ({ id, nivel: 'omitida', mensaje, arreglo: null });
+
+/** 1 si alguna comprobacion es un error; los avisos y las omitidas no cuentan. */
+export function codigoSalida(comprobaciones: readonly Comprobacion[]): 0 | 1 {
+  return comprobaciones.some((c) => c.nivel === 'error') ? 1 : 0;
+}
+
+/** true si la version de Node (`22.23.3`, con o sin `v`) es la minima o mayor. */
+export function nodeSoportado(version: string, minimo: number = NODE_MINIMO): boolean {
+  const mayor = Number(/^v?(\d+)/.exec(version)?.[1] ?? Number.NaN);
+  return Number.isFinite(mayor) && mayor >= minimo;
+}
+
+function contar(cs: readonly Comprobacion[], nivel: NivelComprobacion): number {
+  return cs.filter((c) => c.nivel === nivel).length;
+}
+
+const ETIQUETA: Record<NivelComprobacion, string> = {
+  ok: '[ok]     ',
+  aviso: '[AVISO]  ',
+  error: '[ERROR]  ',
+  omitida: '[omitida]',
+};
+
+/** Una linea por comprobacion y, bajo cada aviso o error, su arreglo. Termina con el resumen. */
+export function formatearTexto(cs: readonly Comprobacion[]): string {
+  const lineas: string[] = [];
+  for (const c of cs) {
+    lineas.push(`${ETIQUETA[c.nivel]} ${c.id}: ${c.mensaje}`);
+    if (c.arreglo !== null) {
+      const [primera, ...resto] = c.arreglo.split('\n');
+      lineas.push(`          Arreglo: ${primera ?? ''}`);
+      for (const l of resto) lineas.push(`                   ${l}`);
+    }
+  }
+  const e = contar(cs, 'error');
+  const a = contar(cs, 'aviso');
+  lineas.push(
+    `Resumen: ${e} ${e === 1 ? 'error' : 'errores'}, ${a} ${a === 1 ? 'aviso' : 'avisos'}, ` +
+      `${contar(cs, 'ok')} ok, ${contar(cs, 'omitida')} omitidas.` +
+      (e === 0 ? ' Listo para trabajar.' : ' Corrige los errores antes de trabajar.')
+  );
+  return ocultarCredenciales(`${lineas.join('\n')}\n`);
+}
+
+/** Una sola linea de JSON: `{ok, errores, avisos, comprobaciones}`. `ok` es `codigoSalida === 0`. */
+export function formatearJson(cs: readonly Comprobacion[]): string {
+  const limpias = cs.map((c) => ({
+    id: c.id,
+    nivel: c.nivel,
+    mensaje: ocultarCredenciales(c.mensaje),
+    arreglo: c.arreglo === null ? null : ocultarCredenciales(c.arreglo),
+  }));
+  return `${JSON.stringify({
+    ok: codigoSalida(cs) === 0,
+    errores: contar(cs, 'error'),
+    avisos: contar(cs, 'aviso'),
+    comprobaciones: limpias,
+  })}\n`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
index 4226a63..e6104a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/gitflow-runner.ts
@@ -24,7 +24,7 @@
  * se espera de ellos. Pasan `stdin: 'inherit'` de forma explicita;
  * `start`, `review` y `finish` no la pasan y se quedan con 'ignore'.
  */
-import { spawnSync } from 'node:child_process';
+import { spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from 'node:child_process';
 import { fileURLToPath } from 'node:url';
 import path from 'node:path';
 
@@ -86,13 +86,27 @@ export class GitflowScriptLaunchError extends Error {
   }
 }
 
+/**
+ * EL unico sitio que lanza bash: `bash "<ruta>" args`, sin shell y con el
+ * PATH heredado. `runGitflowScript` y la sonda de `taskctl doctor` pasan por
+ * aqui: si la sonda lanzara de otra forma, podria dar OK y que los scripts
+ * fallaran (o al reves).
+ */
+function lanzarBash(
+  scriptPath: string,
+  args: readonly string[],
+  extra: SpawnSyncOptions
+): SpawnSyncReturns<string | Buffer> {
+  return spawnSync('bash', [scriptPath, ...args], extra);
+}
+
 export function runGitflowScript(
   scriptName: string,
   args: readonly string[],
   opts: RunGitflowScriptOptions
 ): GitflowScriptResult {
   const scriptPath = path.join(opts.scriptsDir, scriptName);
-  const result = spawnSync('bash', [scriptPath, ...args], {
+  const result = lanzarBash(scriptPath, args, {
     cwd: opts.cwd,
     stdio: [opts.stdin ?? 'ignore', 'inherit', 'inherit'],
   });
@@ -101,3 +115,43 @@ export function runGitflowScript(
   }
   return { code: result.status ?? 1, signal: result.signal ?? null };
 }
+
+/** Script de la sonda, junto a los de Git-Flow. */
+export const SONDA_BASH = '_sonda-bash.sh';
+const MARCA_SONDA = 'taskctl-sonda-ok';
+
+export type ResultadoSondaBash =
+  | { ok: true; version: string }
+  | { ok: false; causa: 'no-lanzable' | 'timeout' | 'fallo'; detalle: string };
+
+/**
+ * TASK-062 (`taskctl doctor`): ejecuta de verdad el script minimo de la
+ * sonda con el mismo lanzamiento que los scripts de Git-Flow y exige codigo 0
+ * Y la marca en stdout. Ni `--version` ni buscar `bash` por el PATH: en
+ * Windows el bash de WSL (System32) responde a `--version` y a `where` y
+ * luego no puede abrir el script, y el de Git sin usr/bin en el PATH arranca
+ * pero sin mktemp ni grep. Nunca lanza; la salida se captura (no se hereda,
+ * para que `doctor --json` siga limpio).
+ */
+export function sondearBash(opts: { scriptsDir: string; cwd: string; timeoutMs?: number }): ResultadoSondaBash {
+  const r = lanzarBash(path.join(opts.scriptsDir, SONDA_BASH), [], {
+    cwd: opts.cwd,
+    encoding: 'utf8',
+    stdio: ['ignore', 'pipe', 'pipe'],
+    timeout: opts.timeoutMs ?? 20_000,
+  });
+  // wsl.exe escribe en UTF-16: sin los NUL el texto es legible.
+  const limpio = (t: unknown): string => String(t ?? '').replace(/\u0000/g, '').trim();
+  if (r.error) {
+    const agotado = (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT';
+    return { ok: false, causa: agotado ? 'timeout' : 'no-lanzable', detalle: limpio(r.error.message) };
+  }
+  const lineas = limpio(r.stdout).split(/\r?\n/);
+  const marca = lineas.find((l) => l.startsWith(MARCA_SONDA));
+  if (r.status === 0 && marca !== undefined) {
+    return { ok: true, version: marca.slice(MARCA_SONDA.length).trim() };
+  }
+  const err = limpio(r.stderr).split(/\r?\n/).filter((x) => x !== '').slice(0, 3).join(' | ');
+  const codigo = r.status === null ? `senal ${r.signal ?? 'desconocida'}` : `codigo ${r.status}`;
+  return { ok: false, causa: 'fallo', detalle: `el script de prueba termino con ${codigo}${err === '' ? '' : `: ${err}`}` };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
index 6471fc5..6ea84b7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
@@ -85,12 +85,18 @@ function entornoDe(gitlabHost: string | undefined): NodeJS.ProcessEnv {
   return env;
 }
 
-function lanzar(cli: string, args: readonly string[], cwd: string, gitlabHost?: string): SpawnSyncReturns<string> {
+function lanzar(
+  cli: string,
+  args: readonly string[],
+  cwd: string,
+  gitlabHost?: string,
+  timeoutMs: number = TIMEOUT_MS
+): SpawnSyncReturns<string> {
   return spawnSync(cli, args, {
     cwd,
     encoding: 'utf8',
     stdio: ['ignore', 'pipe', 'pipe'],
-    timeout: TIMEOUT_MS,
+    timeout: timeoutMs,
     maxBuffer: MAX_BUFFER,
     env: entornoDe(gitlabHost),
   });
@@ -117,12 +123,37 @@ export type ResultadoPreflightCli =
   | { ok: true }
   | { ok: false; motivo: 'no-instalado' | 'sin-autenticar'; mensaje: string };
 
+/**
+ * Lo que sabe la comprobacion de sesion, sin componer el mensaje (TASK-062:
+ * `taskctl doctor` necesita el problema y la ayuda por separado, y saber si
+ * el fallo es de red y no de sesion). `noVerificable`: el CLI no contesto a
+ * tiempo o el fallo habla de red (DNS, conexion, TLS), asi que no se sabe si
+ * la sesion es buena. `comprobarCli` no lo usa: para `finish` sigue siendo
+ * un fallo, como en la 0.6.0.
+ */
+export type ResultadoSondaCli =
+  | { ok: true }
+  | {
+      ok: false;
+      motivo: 'no-instalado' | 'sin-autenticar';
+      /** Que paso, sin la ayuda ni el punto final. */
+      problema: string;
+      /** Que instalar o ejecutar. */
+      ayuda: string;
+      noVerificable: boolean;
+    };
+
+/** Un texto de error de gh/glab que habla de red y no de credenciales. */
+const FALLO_DE_RED_RE =
+  /dial tcp|no such host|timed? ?out|timeout|connection (refused|reset)|network is unreachable|unreachable|ECONN|ENOTFOUND|EAI_AGAIN|could not resolve|temporary failure in name resolution|tls handshake|x509|proxyconnect/i;
+
 /**
  * El CLI de la plataforma, instalado y autenticado en el host de origin. No
  * hay `--version`: lanzar el CLI para `auth status` ya distingue "no existe"
  * (error de lanzamiento) de "no hay sesion" (sale con codigo != 0).
+ * `timeoutMs` acorta la espera (doctor usa unos 10 s; finish, los 120 s).
  */
-export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPreflightCli {
+export function sondearCli(remoto: RemotoPlataforma, cwd: string, timeoutMs: number = TIMEOUT_MS): ResultadoSondaCli {
   const cli = CLI_PLATAFORMA[remoto.plataforma];
   // Con la instancia declarada la sesion se comprueba con una llamada real,
   // `glab api user`: `auth status` ignora GITLAB_TOKEN y daria por rota una
@@ -130,29 +161,41 @@ export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPr
   // salida (el usuario) no se lee ni se muestra.
   const r =
     remoto.declarado === undefined
-      ? lanzar(cli, ['auth', 'status', '--hostname', remoto.host], cwd)
-      : lanzar(cli, ['api', 'user'], cwd, contextoGlab(remoto).gitlabHost);
+      ? lanzar(cli, ['auth', 'status', '--hostname', remoto.host], cwd, undefined, timeoutMs)
+      : lanzar(cli, ['api', 'user'], cwd, contextoGlab(remoto).gitlabHost, timeoutMs);
+  const ayuda = ayudaInstalacion(remoto);
   if (r.error) {
+    const agotado = (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT';
     return {
       ok: false,
       motivo: 'no-instalado',
-      mensaje: `no se pudo ejecutar "${cli}" (${r.error.message}). ${ayudaInstalacion(remoto)}.`,
+      problema: `no se pudo ejecutar "${cli}" (${r.error.message})`,
+      ayuda,
+      noVerificable: agotado,
     };
   }
   if (r.status !== 0) {
+    const texto = detalle(r);
     return {
       ok: false,
       motivo: 'sin-autenticar',
-      mensaje:
+      problema:
         remoto.declarado === undefined
-          ? `"${cli}" no esta autenticado en ${remoto.host} (${detalle(r)}). ${ayudaInstalacion(remoto)}.`
-          : `"${cli}" no tiene sesion valida en ${hostnameGlab(remoto)} o la instancia no responde ` +
-            `(${detalle(r)}). ${ayudaInstalacion(remoto)}.`,
+          ? `"${cli}" no esta autenticado en ${remoto.host} (${texto})`
+          : `"${cli}" no tiene sesion valida en ${hostnameGlab(remoto)} o la instancia no responde (${texto})`,
+      ayuda,
+      noVerificable: FALLO_DE_RED_RE.test(texto),
     };
   }
   return { ok: true };
 }
 
+export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPreflightCli {
+  const r = sondearCli(remoto, cwd);
+  if (r.ok) return { ok: true };
+  return { ok: false, motivo: r.motivo, mensaje: `${r.problema}. ${r.ayuda}.` };
+}
+
 /**
  * Estado del PR/MR de una rama, preguntado a la plataforma por NOMBRE de rama
  * (no por la URL anotada en tarea.md, que es solo informativa). Nunca lanza:
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
new file mode 100644
index 0000000..c8772c9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts
@@ -0,0 +1,659 @@
+/**
+ * `taskctl doctor` (TASK-062). Repos Git temporales de verdad (plantilla con
+ * main, develop y las cinco carpetas de tareas/), el CLI real por spawn para
+ * el codigo de salida y el JSON, y el doble de gh/glab de la suite para la
+ * sesion de plataforma. Nada de mocks de Git ni del filesystem.
+ *
+ * Lo que NO se puede probar aqui y se comprobo a mano en Windows (ver la
+ * tarea): el bash de WSL en System32 delante en el PATH. En CI Linux el bash
+ * es valido, asi que lo que si se prueba es el contrato de la sonda: un script
+ * que falla, que no imprime la marca, o un PATH sin bash, dan error.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { runDoctorCommand, envolver, DoctorCommandError } from '../../src/commands/doctor.js';
+import type { Comprobacion } from '../../src/core/doctor.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { STATE_FOLDER, type Task } from '../../src/core/task.js';
+import { git, commitAll, sampleTask } from '../helpers/finish-fixtures.js';
+import { montarOrigin, URL_GITHUB, URL_GITLAB } from '../helpers/finish-origin.js';
+import { plantillaRepo } from '../helpers/repo-plantilla.js';
+import { conDoblePlataforma, sinPlataformasEnElPath } from '../helpers/plataforma-doble.js';
+
+const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
+const CARPETAS = Object.values(STATE_FOLDER);
+
+/** Proyecto completo: main + develop, las cinco carpetas commiteadas, sin remotos, workspace limpio. */
+const conRepo = plantillaRepo('taskctl-doctor-', async (repoRoot) => {
+  git(['init', '-q', '-b', 'main'], repoRoot);
+  git(['config', 'user.email', 'test@example.com'], repoRoot);
+  git(['config', 'user.name', 'Test'], repoRoot);
+  for (const c of CARPETAS) {
+    await mkdir(path.join(repoRoot, 'tareas', c), { recursive: true });
+    await writeFile(path.join(repoRoot, 'tareas', c, '.gitkeep'), '', 'utf8');
+  }
+  await writeFile(path.join(repoRoot, 'README.md'), '# proyecto\n', 'utf8');
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', 'inicial'], repoRoot);
+  git(['checkout', '-q', '-b', 'develop'], repoRoot);
+});
+
+function doctor(repoRoot: string, opts: { timeoutPlataformaMs?: number; scriptsDir?: string } = {}) {
+  return runDoctorCommand([], { repoCwd: repoRoot, ...opts });
+}
+
+function por(cs: readonly Comprobacion[], id: string): Comprobacion {
+  const c = cs.find((x) => x.id === id);
+  assert.ok(c, `no hay comprobacion "${id}"; hay: ${cs.map((x) => x.id).join(', ')}`);
+  return c;
+}
+
+function niveles(cs: readonly Comprobacion[]): string {
+  return cs.map((c) => `${c.id}=${c.nivel}`).join(' ');
+}
+
+async function tareaEn(
+  repoRoot: string,
+  carpeta: string,
+  id: string,
+  estado: Task['estado'],
+  extra: Partial<Task> = {}
+): Promise<void> {
+  const task = sampleTask({ id, estado, rama: `feature/${id.toLowerCase()}-x`, ...extra });
+  const dir = path.join(repoRoot, 'tareas', carpeta, id);
+  await mkdir(dir, { recursive: true });
+  await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(task, '## Objetivo\nx\n'), 'utf8');
+}
+
+async function config(repoRoot: string, texto: string): Promise<void> {
+  await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+  await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), texto, 'utf8');
+}
+
+function cli(cwd: string, args: string[]) {
+  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+// ---------------------------------------------------------------------
+// Proyecto completo
+// ---------------------------------------------------------------------
+
+test('proyecto completo con origin: todo ok (la plataforma, omitida) y codigo 0', async () => {
+  await conRepo(async (repoRoot) => {
+    const origin = await montarOrigin(repoRoot, URL_GITHUB);
+    try {
+      await tareaEn(repoRoot, '02-en-curso', 'TASK-010', 'en-curso');
+      await tareaEn(repoRoot, '00-planificadas', 'TASK-011', 'planificada');
+      commitAll(repoRoot, 'tareas');
+      const r = doctor(repoRoot);
+      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+      for (const c of r.comprobaciones) {
+        assert.ok(c.nivel === 'ok' || c.nivel === 'omitida', `${c.id} es ${c.nivel}: ${c.mensaje}`);
+        assert.equal(c.arreglo, null, `${c.id} no deberia llevar arreglo`);
+      }
+      assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
+      assert.match(por(r.comprobaciones, 'tareas').mensaje, /^2 tareas/);
+      for (const id of [
+        'node',
+        'git',
+        'bash',
+        'repo-git',
+        'repo-commits',
+        'tareas-carpetas',
+        'rama-base',
+        'rama-principal',
+        'origin',
+        'workspace',
+        'config',
+        'config-claves',
+      ]) {
+        assert.equal(por(r.comprobaciones, id).nivel, 'ok', id);
+      }
+      // Una linea por comprobacion (mas el resumen; sin arreglos porque todo esta bien).
+      assert.equal(r.salida.trimEnd().split('\n').length, r.comprobaciones.length + 1);
+    } finally {
+      await origin.limpiar();
+    }
+  });
+});
+
+test('rama principal "master" tambien vale', async () => {
+  await conRepo(async (repoRoot) => {
+    git(['branch', '-m', 'main', 'master'], repoRoot);
+    const r = doctor(repoRoot);
+    assert.equal(por(r.comprobaciones, 'rama-principal').nivel, 'ok');
+    assert.match(por(r.comprobaciones, 'rama-principal').mensaje, /"master"/);
+  });
+});
+
+// ---------------------------------------------------------------------
+// Repositorio
+// ---------------------------------------------------------------------
+
+test('sin tareas/: error con el mkdir exacto y la coherencia de tareas omitida', async () => {
+  await conRepo(async (repoRoot) => {
+    await rm(path.join(repoRoot, 'tareas'), { recursive: true, force: true });
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'sin tareas'], repoRoot);
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'tareas-carpetas');
+    assert.equal(c.nivel, 'error');
+    assert.equal(c.arreglo, `mkdir -p ${CARPETAS.map((x) => `tareas/${x}`).join(' ')}`);
+    assert.equal(por(r.comprobaciones, 'tareas').nivel, 'omitida');
+    assert.equal(r.codigo, 1);
+  });
+});
+
+test('a tareas/ le falta una carpeta: error que nombra solo la que falta', async () => {
+  await conRepo(async (repoRoot) => {
+    await rm(path.join(repoRoot, 'tareas', '03-en-revision'), { recursive: true, force: true });
+    const c = por(doctor(repoRoot).comprobaciones, 'tareas-carpetas');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /03-en-revision/);
+    assert.equal(c.arreglo, 'mkdir -p tareas/03-en-revision');
+  });
+});
+
+test('sin develop: error con el comando que la crea desde la principal', async () => {
+  await conRepo(async (repoRoot) => {
+    git(['checkout', '-q', 'main'], repoRoot);
+    git(['branch', '-D', 'develop'], repoRoot);
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'rama-base');
+    assert.equal(c.nivel, 'error');
+    assert.equal(c.arreglo, 'git branch develop main');
+    assert.equal(r.codigo, 1);
+  });
+});
+
+test('la rama base sigue a rama_base de la config', async () => {
+  await conRepo(async (repoRoot) => {
+    await config(repoRoot, 'rama_base: integracion\n');
+    const c = por(doctor(repoRoot).comprobaciones, 'rama-base');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /"integracion"/);
+  });
+});
+
+test('sin main ni master: error en rama-principal', async () => {
+  await conRepo(async (repoRoot) => {
+    git(['branch', '-m', 'main', 'tronco'], repoRoot);
+    const c = por(doctor(repoRoot).comprobaciones, 'rama-principal');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.arreglo ?? '', /git branch main/);
+  });
+});
+
+test('sin origin: aviso con el comando, y codigo 0', async () => {
+  await conRepo(async (repoRoot) => {
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'origin');
+    assert.equal(c.nivel, 'aviso');
+    assert.match(c.arreglo ?? '', /^git remote add origin /);
+    assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+  });
+});
+
+test('sin origin y con cierre_por_defecto: merge-request es error y el codigo, 1', async () => {
+  await conRepo(async (repoRoot) => {
+    await config(repoRoot, 'cierre_por_defecto: merge-request\n');
+    const r = doctor(repoRoot);
+    assert.equal(por(r.comprobaciones, 'origin').nivel, 'error');
+    assert.match(por(r.comprobaciones, 'origin').mensaje, /merge-request/);
+    assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
+    assert.equal(r.codigo, 1);
+  });
+});
+
+test('workspace sucio: aviso (no cambia el codigo) con el paso concreto', async () => {
+  await conRepo(async (repoRoot) => {
+    await writeFile(path.join(repoRoot, 'README.md'), '# cambiado\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'nuevo.txt'), 'x\n', 'utf8');
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'workspace');
+    assert.equal(c.nivel, 'aviso');
+    assert.match(c.mensaje, /2 cambios/);
+    assert.match(c.arreglo ?? '', /git status/);
+    assert.equal(r.codigo, 0);
+  });
+});
+
+test('repo sin commits: mensaje propio, ramas omitidas y codigo 1', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-vacio-'));
+  try {
+    git(['init', '-q', '-b', 'main'], dir);
+    const r = doctor(dir);
+    const c = por(r.comprobaciones, 'repo-commits');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /ningun commit/);
+    assert.match(c.arreglo ?? '', /git commit/);
+    assert.equal(por(r.comprobaciones, 'rama-base').nivel, 'omitida');
+    assert.equal(por(r.comprobaciones, 'rama-principal').nivel, 'omitida');
+    assert.equal(r.codigo, 1);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
+
+test('un directorio que no es repo Git: error con el arreglo y el resto omitido', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-norepo-'));
+  try {
+    const r = doctor(dir);
+    assert.equal(por(r.comprobaciones, 'repo-git').nivel, 'error');
+    assert.match(por(r.comprobaciones, 'repo-git').arreglo ?? '', /git init/);
+    for (const id of ['rama-base', 'origin', 'workspace']) assert.equal(por(r.comprobaciones, id).nivel, 'omitida', id);
+    assert.equal(r.codigo, 1);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
+
+test('worktree enlazado (.git es un fichero): sigue siendo repo y todo ok', async () => {
+  await conRepo(async (repoRoot) => {
+    const wt = path.join(await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-wt-')), 'arbol');
+    try {
+      git(['worktree', 'add', '-q', '-b', 'wt-doctor', wt, 'develop'], repoRoot);
+      const r = doctor(wt);
+      assert.match(por(r.comprobaciones, 'repo-git').mensaje, /worktree/);
+      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+    } finally {
+      await rm(path.dirname(wt), { recursive: true, force: true });
+    }
+  });
+});
+
+// ---------------------------------------------------------------------
+// Config
+// ---------------------------------------------------------------------
+
+test('config con un valor invalido: error con el mensaje del validador y codigo 1', async () => {
+  await conRepo(async (repoRoot) => {
+    await config(repoRoot, 'limite_wip: muchos\n');
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'config');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /limite_wip/);
+    assert.match(c.mensaje, /config\.yml:1/);
+    assert.equal(por(r.comprobaciones, 'config-claves').nivel, 'omitida');
+    assert.equal(r.codigo, 1);
+  });
+});
+
+test('config con una clave desconocida: aviso (no error) que la nombra, codigo 0', async () => {
+  await conRepo(async (repoRoot) => {
+    await config(repoRoot, 'limite_wipp: 2\n');
+    const r = doctor(repoRoot);
+    assert.equal(por(r.comprobaciones, 'config').nivel, 'ok');
+    const c = por(r.comprobaciones, 'config-claves');
+    assert.equal(c.nivel, 'aviso');
+    assert.match(c.mensaje, /limite_wipp/);
+    assert.ok(c.arreglo !== null);
+    assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+  });
+});
+
+test('doctor no escribe los avisos de la config en stderr (los da en su salida)', async () => {
+  await conRepo(async (repoRoot) => {
+    await config(repoRoot, 'clave_rara: 1\n');
+    const r = cli(repoRoot, ['doctor']);
+    assert.equal(r.stderr, '');
+    assert.match(r.stdout, /config-claves: .*clave_rara/);
+  });
+});
+
+// ---------------------------------------------------------------------
+// Tareas
+// ---------------------------------------------------------------------
+
+test('tarea en la carpeta equivocada: error con el ID y el comando que la mueve', async () => {
+  await conRepo(async (repoRoot) => {
+    await tareaEn(repoRoot, '00-planificadas', 'TASK-020', 'en-curso');
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'tarea:TASK-020:estado');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /^TASK-020: .*00-planificadas.*en-curso/);
+    assert.match(c.arreglo ?? '', /git mv tareas\/00-planificadas\/TASK-020 tareas\/02-en-curso\/TASK-020/);
+    assert.equal(r.codigo, 1);
+  });
+});
+
+test('mismo ID en dos carpetas: error de duplicado (lo que listTareasEnEstados salta)', async () => {
+  await conRepo(async (repoRoot) => {
+    await tareaEn(repoRoot, '00-planificadas', 'TASK-021', 'planificada');
+    await tareaEn(repoRoot, '02-en-curso', 'TASK-021', 'en-curso');
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'tarea:TASK-021:duplicado');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /TASK-021.*00-planificadas.*02-en-curso/);
+    assert.equal(r.codigo, 1);
+  });
+});
+
+test('tarea.md ilegible: error con la ruta y la causa', async () => {
+  await conRepo(async (repoRoot) => {
+    const dir = path.join(repoRoot, 'tareas', '02-en-curso', 'TASK-022');
+    await mkdir(dir, { recursive: true });
+    await writeFile(path.join(dir, 'tarea.md'), 'esto no tiene frontmatter\n', 'utf8');
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'tarea:TASK-022:ilegible');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /tareas\/02-en-curso\/TASK-022\/tarea\.md/);
+    assert.match(c.mensaje, /no se puede leer ni validar \(.+\)/);
+    assert.equal(r.codigo, 1);
+  });
+});
+
+test('un tarea.md con campos invalidos tambien es error (con la causa del validador)', async () => {
+  await conRepo(async (repoRoot) => {
+    await tareaEn(repoRoot, '02-en-curso', 'TASK-023', 'en-curso');
+    const f = path.join(repoRoot, 'tareas', '02-en-curso', 'TASK-023', 'tarea.md');
+    await writeFile(f, (await readFile(f, 'utf8')).replace('tipo: feature', 'tipo: inventado'), 'utf8');
+    const c = por(doctor(repoRoot).comprobaciones, 'tarea:TASK-023:ilegible');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /tipo/);
+  });
+});
+
+test('carpeta de tarea sin tarea.md: error con el ID', async () => {
+  await conRepo(async (repoRoot) => {
+    await mkdir(path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-024'), { recursive: true });
+    const r = doctor(repoRoot);
+    const c = por(r.comprobaciones, 'tarea:TASK-024:sin-tarea-md');
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /^TASK-024: .*no tiene tarea\.md/);
+    assert.equal(r.codigo, 1);
+  });
+});
+
+test('carpeta ajena a un ID (no TASK-NNN) se ignora', async () => {
+  await conRepo(async (repoRoot) => {
+    await mkdir(path.join(repoRoot, 'tareas', '00-planificadas', 'notas'), { recursive: true });
+    const r = doctor(repoRoot);
+    assert.equal(por(r.comprobaciones, 'tareas').nivel, 'ok');
+  });
+});
+
+// ---------------------------------------------------------------------
+// Solo lee
+// ---------------------------------------------------------------------
+
+test('solo lee: ni el indice, ni la rama, ni los commits cambian (git status no toma el lock)', async () => {
+  await conRepo(async (repoRoot) => {
+    // Un fichero con la fecha cambiada y el mismo contenido: un `git status`
+    // normal refrescaria el indice y lo reescribiria; con GIT_OPTIONAL_LOCKS=0 no.
+    const futuro = new Date(Date.now() + 3_600_000);
+    await utimes(path.join(repoRoot, 'README.md'), futuro, futuro);
+    await writeFile(path.join(repoRoot, 'sucio.txt'), 'x\n', 'utf8');
+    const indice = async () => (await readFile(path.join(repoRoot, '.git', 'index'))).toString('base64');
+    const antes = await indice();
+    doctor(repoRoot);
+    assert.equal(await indice(), antes, 'doctor reescribio el indice de Git');
+    const rama = git(['branch', '--show-current'], repoRoot);
+    const head = git(['rev-parse', 'HEAD'], repoRoot);
+    const ramas = git(['branch', '--list'], repoRoot);
+    doctor(repoRoot);
+    assert.equal(git(['branch', '--show-current'], repoRoot), rama);
+    assert.equal(rama.trim(), 'develop');
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head);
+    assert.equal(git(['branch', '--list'], repoRoot), ramas);
+  });
+});
+
+// ---------------------------------------------------------------------
+// Excepciones y flags
+// ---------------------------------------------------------------------
+
+test('envolver: una excepcion es un resultado error de esa comprobacion, sin credenciales', () => {
+  const r = envolver('x', () => {
+    throw new Error('boom en https://usuario:secreto@host.example/x');
+  });
+  assert.equal(r.length, 1);
+  const c = r[0] as Comprobacion;
+  assert.equal(c.id, 'x');
+  assert.equal(c.nivel, 'error');
+  assert.match(c.mensaje, /excepcion: boom/);
+  assert.doesNotMatch(c.mensaje, /secreto/);
+  assert.ok(c.arreglo !== null);
+});
+
+test('un directorio que no existe no lanza: devuelve errores y codigo 1', () => {
+  const r = doctor(path.join(tmpdir(), 'taskctl-doctor-no-existe-jamas'));
+  assert.equal(r.codigo, 1);
+  assert.ok(r.comprobaciones.length >= 10);
+});
+
+test('flags desconocidos y argumentos sobrantes abortan', () => {
+  assert.throws(
+    () => runDoctorCommand(['--jsno'], { repoCwd: '.' }),
+    (e: unknown) => e instanceof DoctorCommandError && /"--jsno"/.test(e.message) && /--json/.test(e.message)
+  );
+  assert.throws(() => runDoctorCommand(['--json=1'], { repoCwd: '.' }), DoctorCommandError);
+  assert.throws(() => runDoctorCommand(['TASK-001'], { repoCwd: '.' }), /no admite argumentos/);
+});
+
+// ---------------------------------------------------------------------
+// CLI: codigo de salida y JSON
+// ---------------------------------------------------------------------
+
+test('CLI --json: en stdout SOLO el JSON (una linea), stderr vacio, codigo 0 y estructura', async () => {
+  await conRepo(async (repoRoot) => {
+    const r = cli(repoRoot, ['doctor', '--json']);
+    assert.equal(r.status, 0, r.stdout + r.stderr);
+    assert.equal(r.stderr, '');
+    assert.equal(r.stdout.trimEnd().split('\n').length, 1);
+    const j = JSON.parse(r.stdout) as { ok: boolean; errores: number; avisos: number; comprobaciones: Comprobacion[] };
+    assert.equal(j.ok, true);
+    assert.equal(j.errores, 0);
+    assert.equal(j.avisos, 1); // sin origin
+    assert.equal(por(j.comprobaciones, 'origin').nivel, 'aviso');
+    for (const c of j.comprobaciones) {
+      assert.deepEqual(Object.keys(c).sort(), ['arreglo', 'id', 'mensaje', 'nivel']);
+    }
+  });
+});
+
+test('CLI: con un error el codigo es 1 en texto y en --json, y el JSON sigue siendo valido', async () => {
+  await conRepo(async (repoRoot) => {
+    await config(repoRoot, 'limite_wip: 0\n');
+    const t = cli(repoRoot, ['doctor']);
+    assert.equal(t.status, 1);
+    assert.match(t.stdout, /^\[ERROR\] +config: /m);
+    assert.match(t.stdout, /Arreglo: /);
+    const j = cli(repoRoot, ['doctor', '--json']);
+    assert.equal(j.status, 1);
+    assert.equal(j.stderr, '');
+    const o = JSON.parse(j.stdout) as { ok: boolean; errores: number };
+    assert.equal(o.ok, false);
+    assert.equal(o.errores, 1);
+  });
+});
+
+test('CLI: un flag desconocido sale con 1 y el mensaje en stderr', async () => {
+  await conRepo(async (repoRoot) => {
+    const r = cli(repoRoot, ['doctor', '--jsno']);
+    assert.equal(r.status, 1);
+    assert.equal(r.stdout, '');
+    assert.match(r.stderr, /flag desconocido "--jsno"/);
+  });
+});
+
+test('CLI: --help lista doctor', async () => {
+  await conRepo(async (repoRoot) => {
+    assert.match(cli(repoRoot, ['--help']).stdout, /taskctl doctor \[--json\]/);
+  });
+});
+
+// ---------------------------------------------------------------------
+// bash: el contrato de la sonda
+// ---------------------------------------------------------------------
+
+async function conSonda(contenido: string, fn: (scriptsDir: string) => void): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-sonda-'));
+  try {
+    await writeFile(path.join(dir, '_sonda-bash.sh'), contenido, 'utf8');
+    fn(dir);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+test('bash: un script de prueba que falla (comando no encontrado) es error con el arreglo', async () => {
+  await conRepo(async (repoRoot) => {
+    await conSonda('#!/usr/bin/env bash\nherramienta_que_no_existe_taskctl\n', (scriptsDir) => {
+      const r = doctor(repoRoot, { scriptsDir });
+      const c = por(r.comprobaciones, 'bash');
+      assert.equal(c.nivel, 'error');
+      assert.match(c.mensaje, /no pudo ejecutar el script de prueba/);
+      assert.match(c.mensaje, /codigo 127/);
+      assert.ok((c.arreglo ?? '').length > 20);
+      assert.equal(r.codigo, 1);
+    });
+  });
+});
+
+test('bash: salir con 0 no basta, hace falta la marca de la sonda en stdout', async () => {
+  await conRepo(async (repoRoot) => {
+    await conSonda('#!/usr/bin/env bash\nexit 0\n', (scriptsDir) => {
+      assert.equal(por(doctor(repoRoot, { scriptsDir }).comprobaciones, 'bash').nivel, 'error');
+    });
+  });
+});
+
+test('bash: la marca sin codigo de salida 0 tampoco vale', async () => {
+  await conRepo(async (repoRoot) => {
+    await conSonda('#!/usr/bin/env bash\necho "taskctl-sonda-ok"\nexit 3\n', (scriptsDir) => {
+      assert.equal(por(doctor(repoRoot, { scriptsDir }).comprobaciones, 'bash').nivel, 'error');
+    });
+  });
+});
+
+test('bash: sin bash en el PATH es error ("no se pudo lanzar")', async () => {
+  await conRepo(async (repoRoot) => {
+    const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-doctor-pathvacio-'));
+    const guardado = process.env['PATH'];
+    try {
+      process.env['PATH'] = vacio;
+      const r = doctor(repoRoot);
+      const c = por(r.comprobaciones, 'bash');
+      assert.equal(c.nivel, 'error');
+      assert.match(c.mensaje, /no se pudo lanzar "bash"/);
+      assert.equal(r.codigo, 1);
+    } finally {
+      process.env['PATH'] = guardado;
+      await rm(vacio, { recursive: true, force: true });
+    }
+  });
+});
+
+// ---------------------------------------------------------------------
+// Plataforma (con el doble de gh/glab)
+// ---------------------------------------------------------------------
+
+async function conRepoYOrigin(url: string, cfg: string, fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  await conRepo(async (repoRoot) => {
+    const origin = await montarOrigin(repoRoot, url);
+    try {
+      await config(repoRoot, cfg);
+      commitAll(repoRoot, 'config');
+      await fn(repoRoot);
+    } finally {
+      await origin.limpiar();
+    }
+  });
+}
+
+test('plataforma: merge-request por defecto con sesion: ok, y solo se llamo a "auth status"', async () => {
+  await conRepoYOrigin(URL_GITHUB, 'cierre_por_defecto: merge-request\n', async (repoRoot) => {
+    await conDoblePlataforma({ prs: [] }, async (dbl) => {
+      const r = doctor(repoRoot);
+      const c = por(r.comprobaciones, 'plataforma');
+      assert.equal(c.nivel, 'ok', c.mensaje);
+      assert.match(c.mensaje, /"gh".*github\.com/);
+      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+      assert.deepEqual(dbl.leer().llamadas, [['gh', 'auth', 'status', '--hostname', 'github.com']]);
+    });
+  });
+});
+
+test('plataforma: declarada con GitLab, la sesion se comprueba con glab api user bajo su GITLAB_HOST', async () => {
+  await conRepoYOrigin(URL_GITLAB, 'plataforma_remota: gitlab\n', async (repoRoot) => {
+    await conDoblePlataforma({ prs: [] }, async (dbl) => {
+      const r = doctor(repoRoot);
+      assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'ok', por(r.comprobaciones, 'plataforma').mensaje);
+      const reg = dbl.registro();
+      assert.equal(reg.length, 1);
+      assert.deepEqual(reg[0]?.llamada, ['glab', 'api', 'user']);
+      assert.equal(reg[0]?.entorno['GITLAB_HOST'], 'https://gitlab.example.com');
+    });
+  });
+});
+
+test('plataforma: sesion rechazada (confirmada) es error con el comando que la abre', async () => {
+  await conRepoYOrigin(URL_GITHUB, 'cierre_por_defecto: merge-request\n', async (repoRoot) => {
+    await conDoblePlataforma({ auth: false, prs: [] }, async () => {
+      const r = doctor(repoRoot);
+      const c = por(r.comprobaciones, 'plataforma');
+      assert.equal(c.nivel, 'error');
+      assert.match(c.mensaje, /no esta autenticado/);
+      assert.match(c.arreglo ?? '', /gh auth login/);
+      assert.equal(r.codigo, 1);
+    });
+  });
+});
+
+test('plataforma: gh/glab no instalado es error con la instalacion', async () => {
+  await conRepoYOrigin(URL_GITHUB, 'cierre_por_defecto: merge-request\n', async (repoRoot) => {
+    await sinPlataformasEnElPath(async () => {
+      const r = doctor(repoRoot);
+      const c = por(r.comprobaciones, 'plataforma');
+      assert.equal(c.nivel, 'error');
+      assert.match(c.mensaje, /no se pudo ejecutar "gh"/);
+      assert.match(c.arreglo ?? '', /cli\.github\.com/);
+      assert.equal(r.codigo, 1);
+    });
+  });
+});
+
+test('plataforma: sin respuesta a tiempo (timeout propio) es aviso, no error, y no cuelga doctor', async () => {
+  await conRepoYOrigin(URL_GITHUB, 'cierre_por_defecto: merge-request\n', async (repoRoot) => {
+    await conDoblePlataforma({ colgar: true, prs: [] }, async () => {
+      const t0 = Date.now();
+      const r = doctor(repoRoot, { timeoutPlataformaMs: 1500 });
+      assert.ok(Date.now() - t0 < 20_000, 'doctor tardo mas de lo que permite su timeout');
+      const c = por(r.comprobaciones, 'plataforma');
+      assert.equal(c.nivel, 'aviso', c.mensaje);
+      assert.match(c.mensaje, /no se pudo verificar/);
+      assert.equal(r.codigo, 0, niveles(r.comprobaciones));
+    });
+  });
+});
+
+test('plataforma: instancia inalcanzable (fallo de red, no de sesion) es aviso y no filtra la URL con credenciales', async () => {
+  await conRepoYOrigin(URL_GITLAB, 'plataforma_remota: gitlab\n', async (repoRoot) => {
+    // Origin con credenciales incrustadas, como la deja a veces un clon con token.
+    git(['config', 'remote.origin.url', 'https://usuario:secreto@gitlab.example.com/acme/repo.git'], repoRoot);
+    await conDoblePlataforma({ inalcanzable: true, prs: [] }, async () => {
+      const r = doctor(repoRoot);
+      const c = por(r.comprobaciones, 'plataforma');
+      assert.equal(c.nivel, 'aviso', c.mensaje);
+      assert.equal(r.codigo, 0);
+      const json = runDoctorCommand(['--json'], { repoCwd: repoRoot }).salida;
+      for (const salida of [r.salida, json]) assert.doesNotMatch(salida, /secreto|usuario:/);
+    });
+  });
+});
+
+test('plataforma: sin merge request ni plataforma declarada es omitida y no llama a gh ni glab', async () => {
+  await conRepo(async (repoRoot) => {
+    await conDoblePlataforma({ prs: [] }, async (dbl) => {
+      const r = doctor(repoRoot);
+      assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
+      assert.deepEqual(dbl.leer().llamadas, []);
+    });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor.test.ts
new file mode 100644
index 0000000..3c5664a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor.test.ts
@@ -0,0 +1,78 @@
+/**
+ * Nucleo puro de `taskctl doctor` (TASK-062): codigo de salida, version de
+ * Node y los dos formatos. Sin disco ni procesos.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  aviso,
+  codigoSalida,
+  error,
+  formatearJson,
+  formatearTexto,
+  nodeSoportado,
+  ok,
+  omitida,
+} from '../../src/core/doctor.js';
+
+test('codigoSalida: 0 sin errores (los avisos y las omitidas no cuentan), 1 con alguno', () => {
+  assert.equal(codigoSalida([]), 0);
+  assert.equal(codigoSalida([ok('a', 'x'), aviso('b', 'x', 'arreglalo'), omitida('c', 'x')]), 0);
+  assert.equal(codigoSalida([ok('a', 'x'), error('b', 'x', 'arreglalo')]), 1);
+  assert.equal(codigoSalida([aviso('a', 'x', 'y'), error('b', 'x', 'y'), ok('c', 'x')]), 1);
+});
+
+test('nodeSoportado: compara el mayor con el minimo, con o sin "v"', () => {
+  assert.equal(nodeSoportado('22.23.3'), true);
+  assert.equal(nodeSoportado('v20.0.0'), true);
+  assert.equal(nodeSoportado('19.9.0'), false);
+  assert.equal(nodeSoportado('18.20.4'), false);
+  assert.equal(nodeSoportado('basura'), false);
+  assert.equal(nodeSoportado('21.0.0', 22), false);
+});
+
+test('formatearTexto: una linea por comprobacion, el arreglo bajo cada aviso o error y un resumen', () => {
+  const t = formatearTexto([
+    ok('node', 'Node 22'),
+    aviso('origin', 'sin origin', 'git remote add origin <url>'),
+    error('config', 'valor invalido', 'corrige\nla linea 3'),
+    omitida('plataforma', 'no aplica'),
+  ]);
+  const lineas = t.trimEnd().split('\n');
+  assert.match(lineas[0] as string, /^\[ok\] +node: Node 22$/);
+  assert.match(lineas[1] as string, /^\[AVISO\] +origin: sin origin$/);
+  assert.match(lineas[2] as string, /Arreglo: git remote add origin <url>$/);
+  assert.match(lineas[3] as string, /^\[ERROR\] +config: valor invalido$/);
+  assert.match(lineas[4] as string, /Arreglo: corrige$/);
+  assert.match(lineas[5] as string, /^ +la linea 3$/);
+  assert.match(lineas[6] as string, /^\[omitida\] plataforma: no aplica$/);
+  assert.match(lineas[7] as string, /^Resumen: 1 error, 1 aviso, 1 ok, 1 omitidas\. Corrige los errores/);
+  // ok y omitida no llevan "Arreglo".
+  assert.equal(lineas.filter((l) => l.includes('Arreglo:')).length, 2);
+});
+
+test('formatearJson: una linea con ok, errores, avisos y las comprobaciones con su arreglo', () => {
+  const salida = formatearJson([ok('a', 'x'), aviso('b', 'y', 'z'), error('c', 'w', 'v')]);
+  assert.equal(salida.endsWith('\n'), true);
+  assert.equal(salida.trimEnd().includes('\n'), false, 'una sola linea');
+  const j = JSON.parse(salida) as { ok: boolean; errores: number; avisos: number; comprobaciones: unknown[] };
+  assert.equal(j.ok, false);
+  assert.equal(j.errores, 1);
+  assert.equal(j.avisos, 1);
+  assert.deepEqual(j.comprobaciones, [
+    { id: 'a', nivel: 'ok', mensaje: 'x', arreglo: null },
+    { id: 'b', nivel: 'aviso', mensaje: 'y', arreglo: 'z' },
+    { id: 'c', nivel: 'error', mensaje: 'w', arreglo: 'v' },
+  ]);
+  assert.equal((JSON.parse(formatearJson([ok('a', 'x')])) as { ok: boolean }).ok, true);
+});
+
+test('ninguna salida lleva credenciales de una URL, ni en texto ni en JSON', () => {
+  const cs = [
+    error('plataforma', 'fallo en https://usuario:secreto@gitlab.example.com/api', 'prueba https://tok3n@github.com/x'),
+  ];
+  for (const salida of [formatearTexto(cs), formatearJson(cs)]) {
+    assert.doesNotMatch(salida, /secreto|tok3n|usuario/);
+    assert.match(salida, /https:\/\/\*\*\*@/);
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts
index 421cd30..26b5ba6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts
@@ -6,6 +6,7 @@ import {
   resolveGitflowScriptsDir,
   runGitflowScript,
   GitflowScriptLaunchError,
+  sondearBash,
 } from '../../src/fs/gitflow-runner.js';
 
 test('resolveGitflowScriptsDir: respeta CLAUDE_PLUGIN_ROOT cuando esta definida', () => {
@@ -110,3 +111,16 @@ test('GitflowScriptLaunchError: mensaje incluye el nombre del script y el error
   assert.equal(err.originalError, original);
   assert.equal(err.name, 'GitflowScriptLaunchError');
 });
+
+test('sondearBash: el script de la sonda corre de verdad con este bash (TASK-062)', () => {
+  const scriptsDir = path.join(import.meta.dirname, '..', '..', '..', 'scripts', 'gitflow');
+  const r = sondearBash({ scriptsDir, cwd: process.cwd() });
+  assert.equal(r.ok, true, JSON.stringify(r));
+  if (r.ok) assert.match(r.version, /^\d+\./);
+});
+
+test('sondearBash: un script que no existe no lanza y no es OK', () => {
+  const r = sondearBash({ scriptsDir: path.join(import.meta.dirname, 'no-existe'), cwd: process.cwd() });
+  assert.equal(r.ok, false);
+  if (!r.ok) assert.equal(r.causa, 'fallo');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
index cdb3120..1471f3c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
@@ -65,6 +65,8 @@ export interface EstadoDoble {
   crearFalla?: boolean;
   /** true: toda llamada que no sea `auth` sale con 1 (instancia caida), con una URL con credenciales en stderr. */
   inalcanzable?: boolean;
+  /** true: toda llamada se queda esperando 30 s sin responder (para probar el timeout de `taskctl doctor`, TASK-062). */
+  colgar?: boolean;
   prs: PrDoble[];
   /** Lo apunta el doble: una entrada por llamada, `[cli, ...args]`. */
   llamadas?: string[][];
@@ -102,6 +104,7 @@ const CODIGO_DOBLE = [
   '  st.entornos.push(e);',
   '  const guardar = () => fs.writeFileSync(f, JSON.stringify(st));',
   '  guardar();',
+  "  if (st.colgar) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000);",
   "  if (st.inalcanzable && args[0] !== 'auth') salir(1, '', 'Get \"https://usuario:secreto@' + (e.GITLAB_HOST || 'servidor') + '/api/v4/user\": dial tcp: no such host\\n');",
   "  if (args[0] === 'api' && args[1] === 'user') {",
   "    if (st.auth === false) salir(1, '', 'Unauthenticated\\n');",
@@ -229,6 +232,7 @@ export async function conDoblePlataforma(
         listarFalla: e.listarFalla ?? false,
         crearFalla: e.crearFalla ?? false,
         inalcanzable: e.inalcanzable ?? false,
+        colgar: e.colgar ?? false,
         prs: e.prs,
         llamadas: e.llamadas ?? [],
         entornos: e.entornos ?? [],
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-062/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-062/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-062/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-062/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-062/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-062/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-062/tarea.md                                                       |   5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  23 ++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                     | 421 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-opciones.js                            |  61 +++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         |  15 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor.js                                         |  81 ++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/gitflow-runner.js                                   |  45 ++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/merge-request.js                                    |  35 +++++--
 14 files changed, 646 insertions(+), 40 deletions(-)
````
