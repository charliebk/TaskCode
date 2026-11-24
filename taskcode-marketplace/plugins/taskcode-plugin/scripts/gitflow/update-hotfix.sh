#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

PUSH=false; NAME=""; MAIN_BRANCH=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --push|-p) PUSH=true ;;
        --main)    MAIN_BRANCH="$2"; shift ;;
        *)         [ -z "$NAME" ] && NAME="$1" ;;
    esac
    shift
done

[ -z "$NAME" ] && read -rp "Nombre de hotfix a actualizar desde la rama principal (ej: 3001-crash-startup): " NAME
NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
[[ "$NAME" != hotfix/* ]] && NAME="hotfix/$NAME"
assert_valid_branch_name "$NAME" "hotfix/3001-crash-startup"

initialize_gitflow_log "update-hotfix ($NAME)"

ensure_workspace_ready \
    "Workspace no limpio antes de update. Hacer commit local en la rama actual? Si/No" \
    "chore: commit local antes de update hotfix" || exit 0

# TASK-038: antes de resolve_main_branch, para que este use la cache.
detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
log_info "Rama principal detectada: $MAIN_BRANCH"

# TASK-143a (SCR-02): el cuerpo, comun a los cuatro update.
invoke_update_work_branch "$NAME" "$PUSH" "$MAIN_BRANCH" hotfix
