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


if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
    [ "$REMOTE_AVAILABLE" = false ] && { log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
    invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH desde origin." \
        checkout -q -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
else
    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout -q "$MAIN_BRANCH"
fi
log_ok "Switched to branch $MAIN_BRANCH"

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo actualizar $MAIN_BRANCH desde origin." \
        pull --ff-only --quiet origin "$MAIN_BRANCH"
    log_ok "Actualizamos $MAIN_BRANCH"
else
    log_warn "Sincronizacion omitida para $MAIN_BRANCH por falta de conexion remota."
fi

TARGET_LOCAL=false; TARGET_REMOTE=false
git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
if [ "$REMOTE_AVAILABLE" = true ]; then
    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
        && TARGET_REMOTE=true || true
fi

if [ "$TARGET_LOCAL" = true ]; then
    invoke_git "No se pudo cambiar a $NAME." checkout -q "$NAME"
elif [ "$TARGET_REMOTE" = true ]; then
    invoke_git "No se pudo crear la rama local $NAME desde origin/$NAME." \
        checkout -q -b "$NAME" "origin/$NAME"
else
    log_error "La rama $NAME no existe ni localmente ni en remoto."; exit 1
fi
log_ok "Switched to branch $NAME"

invoke_git "No se pudo actualizar $NAME con cambios de $MAIN_BRANCH." \
    merge --no-ff "$MAIN_BRANCH" -m "update(hotfix): $MAIN_BRANCH -> $NAME"
log_ok "Update completado: $MAIN_BRANCH -> $NAME"

if [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo subir $NAME a origin." push origin "$NAME"
    log_ok "Push completado: $NAME"
elif [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
    log_warn "Push omitido para $NAME por falta de conexion remota."
fi

log_summary "COMPLETADO" "$MAIN_BRANCH integrado en $NAME"