# Peticion de revision — TASK-069 (ronda 1)

- Tarea: TASK-069 — Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ
- Rama revisada: feature/task-069-spike-hooks-stop-y-pretooluse-de-claude
- Rama base: develop
- Commit revisado (HEAD): 89199592963425c367025184138bda648f32e9ae
- Fecha: 2026-11-03
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-069 (criterios de aceptacion y plan)

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
8919959 update(feature): develop -> feature/task-069-spike-hooks-stop-y-pretooluse-de-claude
6b76e8d feat(TASK-069): sonda de hooks Stop/PreToolUse, pruebas, steps de CI e informe del spike
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
index 93c66c9..b74d2e0 100644
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -76,6 +76,11 @@ jobs:
           git reset -q -- dist/src
           exit $rc
 
+      - name: "H2 (TASK-069): la sonda de hooks corre por forma exec en Linux"
+        shell: bash
+        continue-on-error: true
+        run: bash hooks/test/sonda-hooks.test.sh
+
   test-windows:
     name: Tests + validacion nativa (Windows)
     runs-on: windows-latest
@@ -164,6 +169,20 @@ jobs:
         continue-on-error: true
         run: node bin\taskctl --version
 
+      - name: "H2 (TASK-069): la sonda de hooks corre por forma exec en Windows"
+        shell: bash
+        continue-on-error: true
+        run: bash hooks/test/sonda-hooks.test.sh
+
+      - name: "H2b (TASK-069): la sonda corre desde cmd.exe con node, sin Git Bash"
+        shell: cmd
+        continue-on-error: true
+        run: |
+          set TASKCODE_SONDA_MODO=stop2
+          node hooks\sonda-hooks.mjs < hooks\test\stop.json
+          if %ERRORLEVEL% NEQ 2 exit /b 1
+          exit /b 0
+
   validate-plugin:
     name: claude plugin validate
     runs-on: ubuntu-latest
@@ -179,6 +198,12 @@ jobs:
       - name: Validar el manifiesto del plugin
         working-directory: .
         run: claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin
+      - name: "H1 (TASK-069): el plugin declara hooks/hooks.json y la validacion lo acepta"
+        working-directory: .
+        run: |
+          test -f taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
+          claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin 2>&1 | tee validate.log
+          ! grep -qiE "hook.*(error|invalid)" validate.log
       - name: Validar el marketplace
         working-directory: .
         run: claude plugin validate .
diff --git a/docs/spikes/TASK-069-resultado.md b/docs/spikes/TASK-069-resultado.md
new file mode 100644
index 0000000..943b75c
--- /dev/null
+++ b/docs/spikes/TASK-069-resultado.md
@@ -0,0 +1,102 @@
+# TASK-069 — Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ
+
+Fecha: 2026-11-03 · Rama: `feature/task-069-spike-hooks-stop-y-pretooluse-de-claude`
+Inspirado en gemba-app/brakes (Apache-2.0): se toman ideas, no codigo.
+
+## Que se ha construido
+
+- `hooks/hooks.json` del plugin: un Stop y un PreToolUse (`Bash|PowerShell`, filtrado con
+  `if: "Bash(git *)"` y `if: "PowerShell(git *)"`), ambos en **forma exec**
+  (`"command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"]`).
+- `hooks/sonda-hooks.mjs`: Node sin dependencias. **Inerte** sin `TASKCODE_SONDA_MODO`
+  (sale 0 sin leer stdin ni escribir). Modos `registrar`, `stop2`, `pre2`. Registra cada
+  invocacion en `TASKCODE_SONDA_LOG` (o `<tmp>/taskcode-sonda.jsonl`), incluidas las claves
+  JSON que llegan, para comprobar la entrada real.
+- `hooks/test/sonda-hooks.test.sh`: 12 asertos deterministas (codigo de salida, stderr,
+  registro). CI: steps H1, H2 (Linux y Windows) y H2b (cmd.exe sin Git Bash).
+- `.gitattributes` del plugin: `*.sh text eol=lf` (hallazgo colateral, ver abajo).
+
+## Documentacion oficial (code.claude.com/docs/en/hooks, leida el 2026-11-03)
+
+| Punto | Lo que dice |
+|---|---|
+| Declaracion en plugin | `hooks/hooks.json` en la raiz del plugin, `description` opcional; se mezcla con los hooks de usuario y proyecto. `${CLAUDE_PLUGIN_ROOT}` = carpeta instalada |
+| Forma exec | con `args` no hay shell; `node` + ruta funciona en toda plataforma porque `node.exe` es un binario real |
+| Entrada | JSON por stdin: `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `permission_mode`; PreToolUse anade `tool_name`, `tool_input.command`, `tool_use_id` |
+| Exit 2 en Stop | impide que Claude pare y continua la conversacion |
+| Exit 2 en PreToolUse | bloquea la llamada; Claude recibe el stderr como error de la herramienta (`PreToolUse:Bash hook error: [...]`) |
+| Otros codigos | error no bloqueante; exit 1 NO bloquea |
+| Timeout en PreToolUse | no bloquea salvo `onFailure: "block"` (Claude Code >= 2.1.295); `onFailure` no tiene efecto en Stop |
+| Filtro `if` | best-effort: el script debe volver a comprobar el comando |
+| Windows | Claude puede usar la herramienta PowerShell: matcher `Bash|PowerShell` |
+| Subagentes | los hooks de plugin tambien corren dentro de subagentes (PreToolUse lleva `agent_id`/`agent_type`) |
+
+## Hipotesis
+
+| # | Hipotesis | Estado | Evidencia |
+|---|---|---|---|
+| H1 | `hooks/hooks.json` del plugin es aceptado | PENDIENTE CI | step "H1 (TASK-069)" del job `claude plugin validate` |
+| H2 | La sonda corre por forma exec en Linux | **CONFIRMADA** | `sonda-hooks.test.sh` 12/12 en la VM Linux del bridge (node v22.23.4), 2026-11-03; step "H2" Linux en CI |
+| H2 | La sonda corre por forma exec en Windows nativo | PENDIENTE CI | steps "H2" y "H2b" (cmd.exe, sin Git Bash) del job Windows |
+| H3 | Exit 2 en Stop hace que el agente siga trabajando | PENDIENTE manual | guion, paso 2 |
+| H4 | PreToolUse bloquea `git merge` y Claude recibe el motivo (Bash y PowerShell) | PENDIENTE manual | guion, paso 3 |
+| H5 | `stop_hook_active` llega `true` en el reintento y corta el bucle | PENDIENTE manual | guion, paso 2 (registro) |
+| H6 | El PreToolUse se dispara dentro de un subagente | PENDIENTE manual | guion, paso 4 |
+
+## Guion de prueba manual (IntelliJ, ~5 min)
+
+Requisitos: Claude Code >= 2.1.295 (`claude --version`, anotalo abajo), terminal de IntelliJ en
+una carpeta de pruebas (NO en TaskCode: el paso 3 hace un merge).
+
+```powershell
+# 0. Preparar
+mkdir $env:TEMP\sonda-repo; cd $env:TEMP\sonda-repo
+git init -q; git commit -q --allow-empty -m base; git branch otra
+$env:TASKCODE_SONDA_LOG = "$env:TEMP\sonda.jsonl"
+```
+
+1. **Carga** — `claude --plugin-dir C:\Users\nullcad2025\Documents\sources\Personal\TaskCode\taskcode-marketplace\plugins\taskcode-plugin`,
+   escribe `/hooks` y comprueba que aparecen Stop y PreToolUse con origen "plugin". Sal con `/exit`.
+2. **H3 + H5** — `$env:TASKCODE_SONDA_MODO = "stop2"`, arranca igual y escribe `di hola`.
+   Esperado: Claude responde, el hook lo devuelve al trabajo con el motivo "Stop bloqueado a
+   proposito", Claude contesta "sonda recibida" y entonces SI termina (sin bucle).
+   En `sonda.jsonl` debe haber dos lineas Stop: la primera con `"stop_hook_active":false`
+   y `"salida":2`, la segunda con `true` y `0`.
+3. **H4** — `$env:TASKCODE_SONDA_MODO = "pre2"`, arranca y escribe
+   `ejecuta git merge otra`. Esperado: la llamada se bloquea y Claude te cuenta el motivo
+   "git merge bloqueado". Repite pidiendo `ejecuta git status`: debe ejecutarse. Anota si
+   Claude uso la herramienta Bash o PowerShell (`tool_name` en el registro).
+4. **H6** — con `pre2`, escribe `lanza un subagente general-purpose que ejecute git merge otra`.
+   Esperado: bloqueado tambien; la linea del registro lleva la clave `agent_id`.
+5. Pega aqui las lineas de `sonda.jsonl` y una frase por paso; borra las variables
+   (`Remove-Item Env:TASKCODE_SONDA_*`).
+
+### Resultado manual
+
+- Version de Claude Code: _(pendiente)_
+- Paso 1: _(pendiente)_
+- Paso 2: _(pendiente)_
+- Paso 3: _(pendiente)_
+- Paso 4: _(pendiente)_
+
+## Hallazgos colaterales
+
+1. **Los `.sh` no tenian regla de fin de linea.** `.gitattributes` del plugin fijaba LF para
+   `*.ts`, `dist/**` y `bin/*`, pero no para `*.sh`. Con `core.autocrlf=true` el checkout de
+   Windows los deja en CRLF y `bash` (VM del bridge) falla con `$'\r': command not found`.
+   Corregido en esta rama con `*.sh text eol=lf`.
+2. **`create-feature.sh` sale 0 aunque `source` de `_gitflow-common.sh` falle**; solo la
+   verificacion por evidencia de `taskctl start` (rama activa != esperada) lo detecto. Los
+   scripts deberian abortar si el `source` falla. Sin corregir: candidata a tarea propia.
+3. **`taskctl start` tarda minutos sobre el bridge**: el limite de WIP lanza un
+   `git merge-base --is-ancestor` por rama (72 ramas, ~3 s cada una sobre el montaje).
+   `git commit-graph write --reachable` lo bajo a ~0,1 s por comprobacion. No es un fallo de
+   TaskCode en Windows nativo, pero conviene documentarlo (o que `doctor` lo sugiera).
+
+## Implicaciones para TASK-071 y TASK-072
+
+- Forma exec siempre; matcher `Bash|PowerShell` con dos handlers `if`.
+- El Stop real debe salir 0 sin trabajo si no hay tarea en `02-en-curso/`, y respetar
+  `stop_hook_active` (si H5 se confirma).
+- El merge guard debe declarar `onFailure: "block"` y comprobar la version minima de Claude Code.
+- La sonda se sustituye; `hooks/test/` se reutiliza como patron de prueba.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes b/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
index f96944a..fb8c372 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
@@ -18,3 +18,9 @@ bin/* text eol=lf
 # los .cmd por bloques y con LF puede saltarse lineas o romper etiquetas;
 # esta regla va DESPUES de bin/* porque en .gitattributes gana la ultima.
 bin/*.cmd text eol=crlf
+
+# Los scripts de Bash (Git-Flow y pruebas de hooks) tambien con LF. Sin esta
+# regla, un checkout de Windows con core.autocrlf=true los deja en CRLF y bash
+# falla con "$'\r': command not found" (visto en TASK-069 al lanzar
+# create-feature.sh desde la VM del bridge sobre el checkout de Windows).
+*.sh text eol=lf
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
new file mode 100644
index 0000000..9aec613
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/hooks.json
@@ -0,0 +1,38 @@
+{
+  "description": "TaskCode (TASK-069): sonda de hooks Stop y PreToolUse. Inerte salvo que TASKCODE_SONDA_MODO este definida; TASK-071/072 la sustituyen por los frenos reales.",
+  "hooks": {
+    "Stop": [
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "node",
+            "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"],
+            "timeout": 30
+          }
+        ]
+      }
+    ],
+    "PreToolUse": [
+      {
+        "matcher": "Bash|PowerShell",
+        "hooks": [
+          {
+            "type": "command",
+            "if": "Bash(git *)",
+            "command": "node",
+            "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"],
+            "timeout": 30
+          },
+          {
+            "type": "command",
+            "if": "PowerShell(git *)",
+            "command": "node",
+            "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/sonda-hooks.mjs"],
+            "timeout": 30
+          }
+        ]
+      }
+    ]
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs b/taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs
new file mode 100644
index 0000000..bc5ece8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs
@@ -0,0 +1,93 @@
+#!/usr/bin/env node
+/**
+ * Sonda de hooks (TASK-069). Sin dependencias, forma exec: Claude Code la
+ * lanza como `node <ruta>` sin pasar por ningun shell, asi que corre igual
+ * en Windows (con o sin Git Bash) que en Linux.
+ *
+ * INERTE POR DEFECTO: sin TASKCODE_SONDA_MODO sale 0 sin leer nada mas ni
+ * escribir nada. Asi puede ir dentro del plugin publicado sin efecto.
+ *
+ * Modos (TASKCODE_SONDA_MODO):
+ *   registrar  anota la entrada JSON y sale 0 (observa, no decide).
+ *   stop2      en Stop: anota y sale 2 con motivo por stderr, SALVO que
+ *              stop_hook_active sea true (H5: corta el bucle). En otros
+ *              eventos se comporta como `registrar`.
+ *   pre2       en PreToolUse: anota y sale 2 si el comando contiene
+ *              `git merge` (H4). Vuelve a comprobar el comando porque el
+ *              filtro `if` de hooks.json es best-effort segun la
+ *              documentacion oficial. En otros eventos, como `registrar`.
+ *
+ * Registro: una linea JSON por invocacion en TASKCODE_SONDA_LOG, o en
+ * <tmpdir>/taskcode-sonda.jsonl si no esta definida.
+ *
+ * Cualquier fallo propio (stdin no JSON, log no escribible) sale 0: una
+ * sonda nunca debe bloquear por un error suyo. Los frenos reales de
+ * TASK-071/072 decidiran su propia politica de fallo.
+ */
+import { appendFileSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+
+const MODOS = new Set(['registrar', 'stop2', 'pre2']);
+const modo = process.env.TASKCODE_SONDA_MODO;
+if (!modo) process.exit(0);
+if (!MODOS.has(modo)) {
+  process.stderr.write(`sonda-hooks: modo desconocido "${modo}"; se ignora.\n`);
+  process.exit(0);
+}
+
+function leerStdin() {
+  return new Promise((resolve) => {
+    let datos = '';
+    process.stdin.setEncoding('utf8');
+    process.stdin.on('data', (t) => { datos += t; });
+    process.stdin.on('end', () => resolve(datos));
+    process.stdin.on('error', () => resolve(datos));
+  });
+}
+
+function decidir(modoActual, entrada) {
+  const evento = entrada.hook_event_name;
+  if (modoActual === 'stop2' && evento === 'Stop') {
+    if (entrada.stop_hook_active === true) return { codigo: 0, motivo: null };
+    return { codigo: 2, motivo: 'sonda TASK-069: Stop bloqueado a proposito (stop2). Responde solo "sonda recibida" y termina.' };
+  }
+  if (modoActual === 'pre2' && evento === 'PreToolUse') {
+    const comando = String(entrada.tool_input?.command ?? '');
+    if (/\bgit\s+merge\b/.test(comando)) {
+      return { codigo: 2, motivo: `sonda TASK-069: git merge bloqueado a proposito (pre2). Comando: ${comando}` };
+    }
+  }
+  return { codigo: 0, motivo: null };
+}
+
+const crudo = await leerStdin();
+let entrada;
+try {
+  entrada = JSON.parse(crudo);
+} catch {
+  process.stderr.write('sonda-hooks: la entrada no es JSON; se ignora.\n');
+  process.exit(0);
+}
+
+const decision = decidir(modo, entrada);
+const destino = process.env.TASKCODE_SONDA_LOG || path.join(tmpdir(), 'taskcode-sonda.jsonl');
+try {
+  appendFileSync(destino, JSON.stringify({
+    ts: new Date().toISOString(),
+    modo,
+    plataforma: process.platform,
+    node: process.version,
+    evento: entrada.hook_event_name ?? null,
+    stop_hook_active: entrada.stop_hook_active ?? null,
+    tool_name: entrada.tool_name ?? null,
+    comando: entrada.tool_input?.command ?? null,
+    claves: Object.keys(entrada).sort(),
+    salida: decision.codigo,
+  }) + '\n');
+} catch {
+  // registro best-effort
+}
+
+if (decision.motivo) process.stderr.write(decision.motivo + '\n');
+process.exit(decision.codigo);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh b/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh
new file mode 100644
index 0000000..face8b5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh
@@ -0,0 +1,45 @@
+#!/usr/bin/env bash
+# Pruebas deterministas de la sonda (TASK-069). Ejecutan el script por forma
+# exec (node + ruta, sin shell intermedio en la llamada) y aseveran codigo de
+# salida, stderr y registro. Las usa el CI en Linux y en Windows (Git Bash
+# solo como orquestador de la prueba; la sonda en si corre con node).
+set -u
+DIR="$(cd "$(dirname "$0")/.." && pwd)"
+SONDA="$DIR/sonda-hooks.mjs"
+TMP="$(mktemp -d)"
+LOG="$TMP/sonda.jsonl"
+fallos=0
+caso() { # nombre esperado_codigo modo json [grep_stderr]
+  local nombre="$1" esperado="$2" modo="$3" json="$4" patron="${5:-}"
+  local err rc
+  if [ -n "$modo" ]; then
+    err=$(printf '%s' "$json" | TASKCODE_SONDA_MODO="$modo" TASKCODE_SONDA_LOG="$LOG" node "$SONDA" 2>&1 >/dev/null); rc=$?
+  else
+    err=$(printf '%s' "$json" | env -u TASKCODE_SONDA_MODO TASKCODE_SONDA_LOG="$LOG" node "$SONDA" 2>&1 >/dev/null); rc=$?
+  fi
+  if [ "$rc" != "$esperado" ]; then echo "FALLO $nombre: salida $rc, esperada $esperado"; fallos=$((fallos+1)); return; fi
+  if [ -n "$patron" ] && ! printf '%s' "$err" | grep -q "$patron"; then echo "FALLO $nombre: stderr sin '$patron': $err"; fallos=$((fallos+1)); return; fi
+  echo "ok   $nombre"
+}
+STOP='{"hook_event_name":"Stop","stop_hook_active":false,"session_id":"s","cwd":"/x"}'
+STOP_ACTIVO='{"hook_event_name":"Stop","stop_hook_active":true}'
+MERGE='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git merge feature/x"}}'
+MERGE_PS='{"hook_event_name":"PreToolUse","tool_name":"PowerShell","tool_input":{"command":"git merge --no-ff feature/x"}}'
+STATUS='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git status"}}'
+
+caso "inerte sin modo (Stop)"            0 ""          "$STOP"
+caso "inerte sin modo (merge)"           0 ""          "$MERGE"
+[ -e "$LOG" ] && { echo "FALLO inerte: escribio registro sin modo"; fallos=$((fallos+1)); } || echo "ok   inerte no escribe registro"
+caso "stop2 bloquea Stop"                2 stop2       "$STOP" "Stop bloqueado"
+caso "stop2 respeta stop_hook_active"    0 stop2       "$STOP_ACTIVO"
+caso "pre2 bloquea git merge (Bash)"     2 pre2        "$MERGE" "git merge bloqueado"
+caso "pre2 bloquea git merge (PowerShell)" 2 pre2      "$MERGE_PS" "git merge bloqueado"
+caso "pre2 deja pasar git status"        0 pre2        "$STATUS"
+caso "registrar nunca bloquea"           0 registrar   "$MERGE"
+caso "entrada no JSON no bloquea"        0 stop2       "esto no es json"
+caso "modo desconocido no bloquea"       0 raro        "$STOP"
+n=$(wc -l < "$LOG" | tr -d ' ')
+[ "$n" = "6" ] && echo "ok   registro con 6 lineas" || { echo "FALLO registro: $n lineas, esperadas 6"; fallos=$((fallos+1)); }
+rm -rf "$TMP"
+[ "$fallos" = 0 ] && echo "TODO OK" || echo "$fallos FALLO(S)"
+exit "$fallos"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/stop.json b/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/stop.json
new file mode 100644
index 0000000..d7e3c2f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/stop.json
@@ -0,0 +1 @@
+{"hook_event_name":"Stop","stop_hook_active":false}
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-069/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-069/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-069/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````
