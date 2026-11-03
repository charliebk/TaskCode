#!/usr/bin/env bash
# Pruebas deterministas de la sonda (TASK-069). Ejecutan el script por forma
# exec (node + ruta, sin shell intermedio en la llamada) y aseveran codigo de
# salida, stderr y registro. Las usa el CI en Linux y en Windows (Git Bash
# solo como orquestador de la prueba; la sonda en si corre con node).
set -u
DIR="$(cd "$(dirname "$0")/.." && pwd)"
SONDA="$DIR/sonda-hooks.mjs"
TMP="$(mktemp -d)"
LOG="$TMP/sonda.jsonl"
fallos=0
caso() { # nombre esperado_codigo modo json [grep_stderr]
  local nombre="$1" esperado="$2" modo="$3" json="$4" patron="${5:-}"
  local err rc
  if [ -n "$modo" ]; then
    err=$(printf '%s' "$json" | TASKCODE_SONDA_MODO="$modo" TASKCODE_SONDA_LOG="$LOG" node "$SONDA" 2>&1 >/dev/null); rc=$?
  else
    err=$(printf '%s' "$json" | env -u TASKCODE_SONDA_MODO TASKCODE_SONDA_LOG="$LOG" node "$SONDA" 2>&1 >/dev/null); rc=$?
  fi
  if [ "$rc" != "$esperado" ]; then echo "FALLO $nombre: salida $rc, esperada $esperado"; fallos=$((fallos+1)); return; fi
  if [ -n "$patron" ] && ! printf '%s' "$err" | grep -q "$patron"; then echo "FALLO $nombre: stderr sin '$patron': $err"; fallos=$((fallos+1)); return; fi
  echo "ok   $nombre"
}
STOP='{"hook_event_name":"Stop","stop_hook_active":false,"session_id":"s","cwd":"/x"}'
STOP_ACTIVO='{"hook_event_name":"Stop","stop_hook_active":true}'
MERGE='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git merge feature/x"}}'
MERGE_PS='{"hook_event_name":"PreToolUse","tool_name":"PowerShell","tool_input":{"command":"git merge --no-ff feature/x"}}'
STATUS='{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git status"}}'

caso "inerte sin modo (Stop)"            0 ""          "$STOP"
caso "inerte sin modo (merge)"           0 ""          "$MERGE"
[ -e "$LOG" ] && { echo "FALLO inerte: escribio registro sin modo"; fallos=$((fallos+1)); } || echo "ok   inerte no escribe registro"
caso "stop2 bloquea Stop"                2 stop2       "$STOP" "Stop bloqueado"
caso "stop2 respeta stop_hook_active"    0 stop2       "$STOP_ACTIVO"
caso "pre2 bloquea git merge (Bash)"     2 pre2        "$MERGE" "git merge bloqueado"
caso "pre2 bloquea git merge (PowerShell)" 2 pre2      "$MERGE_PS" "git merge bloqueado"
caso "pre2 deja pasar git status"        0 pre2        "$STATUS"
caso "registrar nunca bloquea"           0 registrar   "$MERGE"
caso "entrada no JSON no bloquea"        0 stop2       "esto no es json"
caso "modo desconocido no bloquea"       0 raro        "$STOP"
n=$(wc -l < "$LOG" | tr -d ' ')
[ "$n" = "6" ] && echo "ok   registro con 6 lineas" || { echo "FALLO registro: $n lineas, esperadas 6"; fallos=$((fallos+1)); }
rm -rf "$TMP"
[ "$fallos" = 0 ] && echo "TODO OK" || echo "$fallos FALLO(S)"
exit "$fallos"
