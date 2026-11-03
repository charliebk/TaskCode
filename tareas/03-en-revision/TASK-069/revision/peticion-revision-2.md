# Peticion de revision — TASK-069 (ronda 2)

- Tarea: TASK-069 — Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ
- Rama revisada: feature/task-069-spike-hooks-stop-y-pretooluse-de-claude
- Rama base: develop
- Commit revisado (HEAD): 382a03f03703f405c18eded3bc0383bd113bb539
- Fecha: 2026-11-03
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-069 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 89199592963425c367025184138bda648f32e9ae (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la
peticion.

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs (regex `\bgit\s+merge\b` de `decidir`) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs (`decidir` con entrada JSON `null`) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh (mutantes que sobreviven) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | .github/workflows/ci.yml, step H2b | informe-revision-1.md |
| MEN-4 | MENOR | abierto | docs/spikes/TASK-069-resultado.md (hipotesis y matcher) | informe-revision-1.md |

## Commits a revisar (git log 89199592963425c367025184138bda648f32e9ae..HEAD)

````
382a03f fix(TASK-069): la sonda no bloquea git merge-base y no falla con entrada null (revision ronda 1)
e6961d9 chore(TASK-069): veredicto ronda 1 (cambios-solicitados)
a1601ff chore(TASK-069): coste revision +2076406 tokens (1 agente)
5920afc docs(TASK-069): informe de revision ronda 1
9b09304 chore(TASK-069): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 89199592963425c367025184138bda648f32e9ae..HEAD)

````diff
diff --git a/docs/spikes/TASK-069-resultado.md b/docs/spikes/TASK-069-resultado.md
index 943b75c..0330ec4 100644
--- a/docs/spikes/TASK-069-resultado.md
+++ b/docs/spikes/TASK-069-resultado.md
@@ -35,8 +35,8 @@ Inspirado en gemba-app/brakes (Apache-2.0): se toman ideas, no codigo.
 
 | # | Hipotesis | Estado | Evidencia |
 |---|---|---|---|
-| H1 | `hooks/hooks.json` del plugin es aceptado | PENDIENTE CI | step "H1 (TASK-069)" del job `claude plugin validate` |
-| H2 | La sonda corre por forma exec en Linux | **CONFIRMADA** | `sonda-hooks.test.sh` 12/12 en la VM Linux del bridge (node v22.23.4), 2026-11-03; step "H2" Linux en CI |
+| H1 | `hooks/hooks.json` del plugin es aceptado | **CONFIRMADA en local (Windows)**, pendiente CI Linux | `claude plugin validate` da «Validation passed» en Windows nativo (revision ronda 1, 2026-11-03); step "H1 (TASK-069)" del job `claude plugin validate` |
+| H2 | La sonda corre por forma exec en Linux | **CONFIRMADA** | `sonda-hooks.test.sh` 12/12 en la VM Linux del bridge (node v22.23.4), 2026-11-03, antes de la ronda 2 (ahora son 16 casos); step "H2" Linux en CI |
 | H2 | La sonda corre por forma exec en Windows nativo | PENDIENTE CI | steps "H2" y "H2b" (cmd.exe, sin Git Bash) del job Windows |
 | H3 | Exit 2 en Stop hace que el agente siga trabajando | PENDIENTE manual | guion, paso 2 |
 | H4 | PreToolUse bloquea `git merge` y Claude recibe el motivo (Bash y PowerShell) | PENDIENTE manual | guion, paso 3 |
@@ -100,3 +100,14 @@ $env:TASKCODE_SONDA_LOG = "$env:TEMP\sonda.jsonl"
   `stop_hook_active` (si H5 se confirma).
 - El merge guard debe declarar `onFailure: "block"` y comprobar la version minima de Claude Code.
 - La sonda se sustituye; `hooks/test/` se reutiliza como patron de prueba.
+- **Deteccion del merge en el comando** (revision ronda 1, IMP-1): `\bgit\s+merge\b` casaba con
+  `git merge-base`, que usa el limite de WIP de `taskctl start`. La sonda usa ya
+  `\bgit(?:\s+-C\s+\S+)*\s+merge(?![\w-])`, con test para `merge-base` y para `git -C dir merge`.
+  Limitaciones que el freno real debe resolver o aceptar por escrito: el filtro `if: "Bash(git *)"`
+  no ve comandos compuestos (`cd x && git merge`), y la regex no cubre otras opciones globales
+  antes del subcomando (`git -c k=v merge`, `git --git-dir=... merge`) ni alias de git.
+- **Entrada por pipe en PowerShell 5.1** (revision ronda 1, MEN-3): `Get-Content x | node sonda`
+  antepone un BOM y la entrada deja de ser JSON; con redireccion `<` funciona. Claude Code usa su
+  propio pipe, pero las pruebas manuales en PowerShell deben usar `<` o `-Encoding`.
+- El step H2b (cmd.exe) va con `continue-on-error: true`: su resultado hay que mirarlo a mano en el
+  CI de Windows, porque un rojo no rompe el pipeline.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs b/taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs
index bc5ece8..ded8947 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/sonda-hooks.mjs
@@ -20,7 +20,8 @@
  * Registro: una linea JSON por invocacion en TASKCODE_SONDA_LOG, o en
  * <tmpdir>/taskcode-sonda.jsonl si no esta definida.
  *
- * Cualquier fallo propio (stdin no JSON, log no escribible) sale 0: una
+ * Cualquier fallo propio (stdin no JSON o que no es un objeto, log no
+ * escribible) sale 0: una
  * sonda nunca debe bloquear por un error suyo. Los frenos reales de
  * TASK-071/072 decidiran su propia politica de fallo.
  */
@@ -54,7 +55,9 @@ function decidir(modoActual, entrada) {
   }
   if (modoActual === 'pre2' && evento === 'PreToolUse') {
     const comando = String(entrada.tool_input?.command ?? '');
-    if (/\bgit\s+merge\b/.test(comando)) {
+    // `merge` como subcomando entero: no casa con `merge-base` ni `merge-tree`
+    // (\b si casaria: hay frontera entre `e` y `-`). Admite `git -C <dir> merge`.
+    if (/\bgit(?:\s+-C\s+\S+)*\s+merge(?![\w-])/.test(comando)) {
       return { codigo: 2, motivo: `sonda TASK-069: git merge bloqueado a proposito (pre2). Comando: ${comando}` };
     }
   }
@@ -69,6 +72,11 @@ try {
   process.stderr.write('sonda-hooks: la entrada no es JSON; se ignora.\n');
   process.exit(0);
 }
+// `null`, un numero o una cadena son JSON valido pero no una entrada de hook.
+if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
+  process.stderr.write('sonda-hooks: la entrada no es un objeto JSON; se ignora.\n');
+  process.exit(0);
+}
 
 const decision = decidir(modo, entrada);
 const destino = process.env.TASKCODE_SONDA_LOG || path.join(tmpdir(), 'taskcode-sonda.jsonl');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh b/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh
index face8b5..345b003 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/hooks/test/sonda-hooks.test.sh
@@ -18,7 +18,9 @@ caso() { # nombre esperado_codigo modo json [grep_stderr]
     err=$(printf '%s' "$json" | env -u TASKCODE_SONDA_MODO TASKCODE_SONDA_LOG="$LOG" node "$SONDA" 2>&1 >/dev/null); rc=$?
   fi
   if [ "$rc" != "$esperado" ]; then echo "FALLO $nombre: salida $rc, esperada $esperado"; fallos=$((fallos+1)); return; fi
-  if [ -n "$patron" ] && ! printf '%s' "$err" | grep -q "$patron"; then echo "FALLO $nombre: stderr sin '$patron': $err"; fallos=$((fallos+1)); return; fi
+  if [ "$patron" = "VACIO" ]; then
+    if [ -n "$err" ]; then echo "FALLO $nombre: stderr deberia estar vacio: $err"; fallos=$((fallos+1)); return; fi
+  elif [ -n "$patron" ] && ! printf '%s' "$err" | grep -q "$patron"; then echo "FALLO $nombre: stderr sin '$patron': $err"; fallos=$((fallos+1)); return; fi
   echo "ok   $nombre"
 }
 STOP='{"hook_event_name":"Stop","stop_hook_active":false,"session_id":"s","cwd":"/x"}'
@@ -26,20 +28,27 @@ STOP_ACTIVO='{"hook_event_name":"Stop","stop_hook_active":true}'
 MERGE='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git merge feature/x"}}'
 MERGE_PS='{"hook_event_name":"PreToolUse","tool_name":"PowerShell","tool_input":{"command":"git merge --no-ff feature/x"}}'
 STATUS='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git status"}}'
+MERGE_BASE='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git merge-base --is-ancestor a b"}}'
+MERGE_C='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git -C repo merge feature/x"}}'
+STOP_CON_MERGE='{"hook_event_name":"Stop","stop_hook_active":false,"tool_input":{"command":"git merge feature/x"}}'
 
-caso "inerte sin modo (Stop)"            0 ""          "$STOP"
-caso "inerte sin modo (merge)"           0 ""          "$MERGE"
+caso "inerte sin modo (Stop)"            0 ""          "$STOP"  VACIO
+caso "inerte sin modo (merge)"           0 ""          "$MERGE" VACIO
 [ -e "$LOG" ] && { echo "FALLO inerte: escribio registro sin modo"; fallos=$((fallos+1)); } || echo "ok   inerte no escribe registro"
 caso "stop2 bloquea Stop"                2 stop2       "$STOP" "Stop bloqueado"
 caso "stop2 respeta stop_hook_active"    0 stop2       "$STOP_ACTIVO"
 caso "pre2 bloquea git merge (Bash)"     2 pre2        "$MERGE" "git merge bloqueado"
 caso "pre2 bloquea git merge (PowerShell)" 2 pre2      "$MERGE_PS" "git merge bloqueado"
 caso "pre2 deja pasar git status"        0 pre2        "$STATUS"
+caso "pre2 deja pasar git merge-base"    0 pre2        "$MERGE_BASE"
+caso "pre2 bloquea git -C dir merge"     2 pre2        "$MERGE_C" "git merge bloqueado"
+caso "pre2 ignora un evento Stop"        0 pre2        "$STOP_CON_MERGE"
 caso "registrar nunca bloquea"           0 registrar   "$MERGE"
 caso "entrada no JSON no bloquea"        0 stop2       "esto no es json"
+caso "entrada JSON null no bloquea"      0 pre2        "null" "no es un objeto"
 caso "modo desconocido no bloquea"       0 raro        "$STOP"
 n=$(wc -l < "$LOG" | tr -d ' ')
-[ "$n" = "6" ] && echo "ok   registro con 6 lineas" || { echo "FALLO registro: $n lineas, esperadas 6"; fallos=$((fallos+1)); }
+[ "$n" = "9" ] && echo "ok   registro con 9 lineas" || { echo "FALLO registro: $n lineas, esperadas 9"; fallos=$((fallos+1)); }
 rm -rf "$TMP"
 [ "$fallos" = 0 ] && echo "TODO OK" || echo "$fallos FALLO(S)"
 exit "$fallos"
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 89199592963425c367025184138bda648f32e9ae..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-069/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-069/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-069/revision/informe-revision-1.md                               |  80 +++++++++++++++++++
 tareas/03-en-revision/TASK-069/revision/peticion-revision-1.md                              | 425 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-069/tarea.md                                    |  11 ++-
 5 files changed, 514 insertions(+), 2 deletions(-)
````
