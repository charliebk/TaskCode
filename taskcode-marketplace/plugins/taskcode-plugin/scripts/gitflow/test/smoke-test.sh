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

if [ -z "$TMP_REPO" ] || [ ! -d "$TMP_REPO" ]; then
    echo "ERROR: mktemp no pudo crear el repo temporal. Ejecuta este script desde Git Bash."
    exit 1
fi

echo "== smoke-test: repo temporal en $TMP_REPO (fuera de cualquier repo real) =="
cd "$TMP_REPO" || exit 1
git init -q -b main
git config user.name "smoke-test"
git config user.email "smoke-test@example.invalid"
# Repo temporal deliberadamente SIN .gitignore. Hasta TASK-029 hacia
# falta uno con "logs/" antes de tocar ningun script de Git-Flow: el
# propio script escribia su registro en <repo>/logs/gitflow/ al arrancar
# (initialize_gitflow_log corre antes que ensure_workspace_ready) y sin
# ignorarlo el primer uso en un repo nuevo se autobloqueaba con
# "workspace no limpio" (hallazgo 2 de TASK-007, reproducido tambien al
# escribir este mismo smoke test). Desde TASK-029 el registro vive en
# .git/, que no forma parte del arbol de trabajo, asi que el repo no
# necesita ignorar nada — y que aqui no haya .gitignore es justamente la
# comprobacion (ver cheque 2).
echo "init" > README.md
git add README.md
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
echo "== 2) el log interno se escribe en .git/ del repo temporal, fuera del arbol de trabajo (hallazgo 1 + TASK-029) =="
[ -f "$TMP_REPO/.git/taskcode/gitflow/gitflow-$(date +%Y-%m-%d).log" ]
assert ".git/taskcode/gitflow/*.log existe dentro del repo temporal" "$?"
[ ! -d "$SCRIPT_DIR/logs" ]
assert "NO se creo logs/ dentro de scripts/gitflow/ (log_dir ya no cuenta niveles de carpeta)" "$?"
[ ! -d "$TMP_REPO/logs" ]
assert "NO se creo logs/ en el arbol de trabajo del repo (TASK-029)" "$?"
# Lo que define el frente S2 de TASK-029: el script no deja NADA en el
# arbol de trabajo, en un repo que no ignora nada.
[ -z "$(git status --porcelain)" ]
assert "git status --porcelain queda vacio tras ejecutar el script" "$?"

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
