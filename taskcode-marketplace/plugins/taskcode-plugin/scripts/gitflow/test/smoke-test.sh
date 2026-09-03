#!/usr/bin/env bash
# Prueba de regresion para los ajustes de TASK-008 (hallazgos 1 y 4 de
# TASK-007, ver docs/spikes/TASK-007-resultado.md). No es un test
# unitario de bash (no hay framework instalado a proposito, ver
# principio de "cero dependencias" en docs/PLAN_SPRINTS.md) sino un
# smoke test funcional: monta un repo Git temporal SIN origin, y
# reproduce exactamente la secuencia que fallaba antes del ajuste.
#
# Uso: bash scripts/gitflow/test/smoke-test.sh
# Exit 0 = todo OK. Exit != 0 = alguna asercion fallo (mensaje en stderr).

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"  # scripts/gitflow/
FAILURES=0

assert() {
    local desc="$1" cond="$2"
    if [ "$cond" = "0" ]; then
        printf "  [OK]   %s\n" "$desc"
    else
        printf "  [FAIL] %s\n" "$desc"
        FAILURES=$((FAILURES + 1))
    fi
}

TMP_REPO="$(mktemp -d -t taskctl-gitflow-smoke-XXXXXX)"
cleanup() { rm -rf "$TMP_REPO"; }
trap cleanup EXIT

echo "== smoke-test: repo temporal en $TMP_REPO (fuera de cualquier repo real) =="
cd "$TMP_REPO"
git init -q -b main
git config user.name "smoke-test"
git config user.email "smoke-test@example.invalid"
# logs/ debe estar gitignorado ANTES de tocar cualquier script de
# Git-Flow: el propio script escribe su log ahi al arrancar
# (initialize_gitflow_log corre antes que ensure_workspace_ready), y
# sin esto el primer uso en un repo nuevo se autobloquea con
# "workspace no limpio" (hallazgo 2 de TASK-007, reproducido tambien
# al escribir este mismo smoke test).
printf 'logs/\n' > .gitignore
echo "init" > README.md
git add README.md .gitignore
git commit -q -m "init"
git checkout -q -b develop main

echo
echo "== 1) create-feature.sh crea rama sin origin (regresion del comportamiento ya validado en TASK-007) =="
OUT1="$(bash "$SCRIPT_DIR/create-feature.sh" smoke-test-feature 2>&1)"
CODE1=$?
assert "create-feature.sh termina con exit 0" "$([ $CODE1 -eq 0 ]; echo $?)"
printf "%s\n" "$OUT1" | grep -q "No hay conexion con origin" 
assert "avisa (WARN) que no hay origin, no crashea" "$?"
CURRENT_BRANCH="$(git branch --show-current)"
[ "$CURRENT_BRANCH" = "feature/smoke-test-feature" ]
assert "la rama activa es feature/smoke-test-feature" "$?"

echo
echo "== 2) el log interno se escribe DENTRO del repo temporal, no dentro de scripts/gitflow/ (hallazgo 1) =="
[ -f "$TMP_REPO/logs/gitflow/gitflow-$(date +%Y-%m-%d).log" ]
assert "logs/gitflow/*.log existe dentro del repo temporal" "$?"
[ ! -d "$SCRIPT_DIR/logs" ]
assert "NO se creo logs/ dentro de scripts/gitflow/ (log_dir ya no cuenta niveles de carpeta)" "$?"

echo
echo "== 3) merge-feature-to-develop.sh integra sin origin (hallazgo 4 - antes fallaba con exit 1) =="
echo "cambio" >> README.md
git add README.md
git commit -q -m "cambio en la feature"
OUT2="$(bash "$SCRIPT_DIR/merge-feature-to-develop.sh" smoke-test-feature 2>&1)"
CODE2=$?
assert "merge-feature-to-develop.sh termina con exit 0 (antes del ajuste: 1)" "$([ $CODE2 -eq 0 ]; echo $?)"
printf "%s\n" "$OUT2" | grep -q "No hay conexion con origin"
assert "avisa (WARN) que no hay origin, no crashea" "$?"
git log --oneline develop | grep -q "merge(feature): feature/smoke-test-feature -> develop"
assert "develop tiene el commit de merge" "$?"

echo
if [ "$FAILURES" -eq 0 ]; then
    printf "\n== TODOS LOS CHEQUES PASARON ==\n"
    exit 0
else
    printf "\n== %d CHEQUE(S) FALLARON ==\n" "$FAILURES"
    exit 1
fi
