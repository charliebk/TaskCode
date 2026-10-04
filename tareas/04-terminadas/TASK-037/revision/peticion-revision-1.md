# Peticion de revision — TASK-037 (ronda 1)

- Tarea: TASK-037 — F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos
- Rama revisada: feature/task-037-f2-t1-logging-de-los-scripts-de-git-flow
- Rama base: develop
- Commit revisado (HEAD): 2d75306134099bfa020cd32c2ff374d743483b53
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-037 (criterios de aceptacion y plan)

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
2d75306 perf(TASK-037): logging de Git-Flow sin un date ni un subshell por linea
50eb6f5 chore(TASK-037): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index 6a7c134..b20f38c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -10,10 +10,25 @@ GF_OPERATION=""
 C_GREEN="\033[32m"; C_YELLOW="\033[33m"; C_RED="\033[31m"
 C_CYAN="\033[36m";  C_WHITE="\033[97m";  C_DGRAY="\033[90m"; C_RESET="\033[0m"
 
+# ── Hora sin lanzar procesos (TASK-037) ──────────────────────────────────────
+# Cada `$(date ...)` es un proceso: en Windows ~0,1-0,15 s, y el log lanzaba
+# uno por linea (mas un subshell). Con bash >= 4.2, `printf -v` con el
+# formato `%(...)T` da la hora sin salir del shell. Con bash anterior (el
+# /bin/bash 3.2 de macOS) se cae a `date`, que es lo de siempre.
+# GF_FORZAR_DATE=1 fuerza la caida (solo para probarla).
+if [ -z "${GF_FORZAR_DATE:-}" ] && { [ "${BASH_VERSINFO[0]:-0}" -gt 4 ] || \
+     { [ "${BASH_VERSINFO[0]:-0}" -eq 4 ] && [ "${BASH_VERSINFO[1]:-0}" -ge 2 ]; }; }; then
+    _gf_hora()  { printf -v "$1" "%($2)T" -1; }
+    _gf_epoch() { if [ -n "${EPOCHSECONDS:-}" ]; then printf -v "$1" '%s' "$EPOCHSECONDS"; else printf -v "$1" '%(%s)T' -1; fi; }
+else
+    _gf_hora()  { printf -v "$1" '%s' "$(date +"$2")"; }
+    _gf_epoch() { printf -v "$1" '%s' "$(date +%s)"; }
+fi
+
 # ── Logging ───────────────────────────────────────────────────────────────────
 initialize_gitflow_log() {
     GF_OPERATION="$1"
-    GF_START=$(date +%s)
+    _gf_epoch GF_START
     # Ajuste TASK-008 (hallazgo 1 de TASK-007): antes la ruta se calculaba
     # contando niveles de carpeta desde el script (valido solo en la
     # ubicacion original .idea/runConfigurations/local_git-flow-actions/).
@@ -60,33 +75,39 @@ initialize_gitflow_log() {
         log_dir=""
     fi
     if [ -n "$log_dir" ]; then
-        GF_LOG_FILE="$log_dir/gitflow-$(date +%Y-%m-%d).log"
+        local hoy
+        _gf_hora hoy '%Y-%m-%d'
+        GF_LOG_FILE="$log_dir/gitflow-$hoy.log"
         local sep
         sep=$(printf '=%.0s' {1..60})
         { printf "\n"; printf "%s\n" "$sep"; } >> "$GF_LOG_FILE"
     fi
-    _do_log "INFO " "INICIO: $GF_OPERATION" > /dev/null
+    _do_log "INFO " "INICIO: $GF_OPERATION"
 }
 
-# _do_log: escribe en fichero Y devuelve la linea formateada a stdout
+# _do_log: escribe la linea en el fichero de log y la deja en GF_LINE.
+# TASK-037: antes la devolvia por stdout y cada log_* la recogia con un
+# `$(_do_log ...)`, es decir, un subshell por linea. Ningun otro script la
+# llama: la interfaz publica son los log_* de abajo, que no cambian.
+GF_LINE=""
 _do_log() {
-    local level="$1" message="$2" ts line
-    ts=$(date +"%Y-%m-%d %H:%M:%S")
-    line="[$ts] [$level] $message"
-    [ -n "$GF_LOG_FILE" ] && printf "%s\n" "$line" >> "$GF_LOG_FILE"
-    printf "%s" "$line"
+    local level="$1" message="$2" ts
+    _gf_hora ts '%Y-%m-%d %H:%M:%S'
+    GF_LINE="[$ts] [$level] $message"
+    [ -n "$GF_LOG_FILE" ] && printf "%s\n" "$GF_LINE" >> "$GF_LOG_FILE"
+    return 0
 }
 
-log_info()  { printf "%s\n"                         "$(_do_log "INFO " "$1")"; }
-log_ok()    { printf "${C_GREEN}%s${C_RESET}\n"     "$(_do_log "OK   " "$1")"; }
-log_warn()  { printf "${C_YELLOW}%s${C_RESET}\n"    "$(_do_log "WARN " "$1")"; }
-log_error() { printf "${C_RED}%s${C_RESET}\n"       "$(_do_log "ERROR" "$1")"; }
+log_info()  { _do_log "INFO " "$1"; printf "%s\n"                     "$GF_LINE"; }
+log_ok()    { _do_log "OK   " "$1"; printf "${C_GREEN}%s${C_RESET}\n"  "$GF_LINE"; }
+log_warn()  { _do_log "WARN " "$1"; printf "${C_YELLOW}%s${C_RESET}\n" "$GF_LINE"; }
+log_error() { _do_log "ERROR" "$1"; printf "${C_RED}%s${C_RESET}\n"    "$GF_LINE"; }
 
 log_summary() {
     local result="${1:-COMPLETADO}" extra="${2:-}" elapsed="?" icon="[OK]"
     if [ -n "$GF_START" ]; then
         local end
-        end=$(date +%s)
+        _gf_epoch end
         elapsed="$((end - GF_START))s"
     fi
     local op="${GF_OPERATION:-operacion}"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/logging.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/logging.test.ts
new file mode 100644
index 0000000..4eb0f29
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/logging.test.ts
@@ -0,0 +1,98 @@
+/**
+ * TASK-037: el logging de los scripts de Git-Flow no lanza procesos.
+ *
+ * Cronometrar no prueba nada (depende de la carga de la maquina). Lo que
+ * se prueba es el hecho: `date` se redefine como funcion de bash que
+ * cuenta sus llamadas (las sustituciones `$(date ...)` tambien la ven),
+ * y se comprueba que el camino rapido no la llama ni una vez, que la
+ * caida para bash antiguo si la usa, y que las dos dan lineas con la
+ * misma forma en pantalla y en el fichero de log.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const COMMON = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow', '_gitflow-common.sh');
+const LINEA = /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[INFO \] hola mundo$/;
+
+/** Ejecuta un trozo de bash con `date` instrumentado; devuelve stdout y llamadas a date. */
+async function conDateContado(
+  cuerpo: string,
+  env: Record<string, string> = {}
+): Promise<{ stdout: string; llamadasDate: number; log: string }> {
+  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-gflog-'));
+  try {
+    assert.equal(spawnSync('git', ['init', '-q'], { cwd: repo }).status, 0);
+    const comun = COMMON.split(path.sep).join('/');
+    const script =
+      'DATE_LLAMADAS=0\n' +
+      'date() { DATE_LLAMADAS=$((DATE_LLAMADAS+1)); echo x >> .date-llamadas; command date "$@"; }\n' +
+      `source "${comun}"\n` +
+      cuerpo +
+      '\n';
+    const r = spawnSync('bash', ['-c', script], {
+      cwd: repo,
+      encoding: 'utf8',
+      env: { ...process.env, ...env },
+    });
+    assert.equal(r.status, 0, r.stderr);
+    let llamadas = 0;
+    try {
+      llamadas = (await readFile(path.join(repo, '.date-llamadas'), 'utf8')).split('\n').filter(Boolean).length;
+    } catch {
+      llamadas = 0;
+    }
+    const dirLog = path.join(repo, '.git', 'taskcode', 'gitflow');
+    const ficheros = await readdir(dirLog);
+    const log = await readFile(path.join(dirLog, ficheros[0] as string), 'utf8');
+    return { stdout: r.stdout, llamadasDate: llamadas, log };
+  } finally {
+    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+  }
+}
+
+const CUERPO = 'initialize_gitflow_log "prueba"\nlog_info "hola mundo"\nlog_summary >/dev/null';
+
+test('logging de Git-Flow (TASK-037): con bash moderno no lanza ningun date y la linea tiene la forma de siempre', async () => {
+  const r = await conDateContado(CUERPO);
+  assert.equal(r.llamadasDate, 0, 'el camino rapido no deberia lanzar date');
+  assert.match(r.stdout.trim().split('\n')[0] as string, LINEA);
+  assert.ok(
+    r.log.split(/\r?\n/).some((l) => LINEA.test(l)),
+    `la linea tiene que estar tambien en el fichero de log:\n${r.log}`
+  );
+  assert.match(r.log, /INICIO: prueba/);
+});
+
+test('logging de Git-Flow (TASK-037): la caida para bash antiguo usa date y da la misma forma', async () => {
+  const r = await conDateContado(CUERPO, { GF_FORZAR_DATE: '1' });
+  assert.ok(r.llamadasDate > 0, 'la caida tiene que usar date');
+  assert.match(r.stdout.trim().split('\n')[0] as string, LINEA);
+  assert.ok(r.log.split(/\r?\n/).some((l) => LINEA.test(l)));
+});
+
+test('logging de Git-Flow (TASK-037): el fichero de log se llama por la fecha de hoy en los dos caminos', async () => {
+  const hoy = /gitflow-\d{4}-\d{2}-\d{2}\.log/;
+  for (const env of [{}, { GF_FORZAR_DATE: '1' }]) {
+    const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-gflog-'));
+    try {
+      spawnSync('git', ['init', '-q'], { cwd: repo });
+      const comun = COMMON.split(path.sep).join('/');
+      const r = spawnSync('bash', ['-c', `source "${comun}"\ninitialize_gitflow_log x`], {
+        cwd: repo,
+        encoding: 'utf8',
+        env: { ...process.env, ...env },
+      });
+      assert.equal(r.status, 0, r.stderr);
+      const ficheros = await readdir(path.join(repo, '.git', 'taskcode', 'gitflow'));
+      assert.ok(ficheros.some((f) => hoy.test(f)), ficheros.join(', '));
+    } finally {
+      await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+    }
+  }
+});
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-037/tarea.md                                                                        | 39 ---------------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-037/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-037/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-037/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-037/planificacion/plan-final.md                                    |  0
 tareas/02-en-curso/TASK-037/tarea.md                                                                         | 62 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 6 files changed, 62 insertions(+), 39 deletions(-)
````
