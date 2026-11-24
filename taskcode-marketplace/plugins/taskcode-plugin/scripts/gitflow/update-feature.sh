#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --push|-p) PUSH=true ;;
        --develop) DEVELOP_BRANCH="$2"; shift ;;
        *)         [ -z "$NAME" ] && NAME="$1" ;;
    esac
    shift
done

[ -z "$NAME" ] && read -rp "Nombre de feature a actualizar desde develop (ej: 1001-login): " NAME
NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
[[ "$NAME" != feature/* ]] && NAME="feature/$NAME"
assert_valid_branch_name "$NAME" "feature/1001-login"

initialize_gitflow_log "update-feature ($NAME desde $DEVELOP_BRANCH)"

ensure_workspace_ready \
    "Workspace no limpio antes de update. Hacer commit local en la rama actual? Si/No" \
    "chore: commit local antes de update feature" || exit 0

detect_origin_available "No hay conexion con origin. Se intentara update en modo local."

# TASK-143a (SCR-02): el cuerpo, comun a los cuatro update.
invoke_update_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH" feature
