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

if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
    [ "$REMOTE_AVAILABLE" = false ] && { log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
    invoke_git "No se pudo crear/cambiar a $DEVELOP_BRANCH desde origin." \
        checkout -q -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
else
    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout -q "$DEVELOP_BRANCH"
fi
log_ok "Switched to branch $DEVELOP_BRANCH"

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo actualizar $DEVELOP_BRANCH desde origin." \
        pull --ff-only --quiet origin "$DEVELOP_BRANCH"
    log_ok "Actualizamos $DEVELOP_BRANCH"
else
    log_warn "Sincronizacion omitida para $DEVELOP_BRANCH por falta de conexion remota."
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

invoke_git "No se pudo actualizar $NAME con cambios de $DEVELOP_BRANCH." \
    merge --no-ff "$DEVELOP_BRANCH" -m "update(feature): $DEVELOP_BRANCH -> $NAME"
log_ok "Update completado: $DEVELOP_BRANCH -> $NAME"

if [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo subir $NAME a origin." push origin "$NAME"
    log_ok "Push completado: $NAME"
elif [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
    log_warn "Push omitido para $NAME por falta de conexion remota."
fi

log_summary "COMPLETADO" "$DEVELOP_BRANCH integrado en $NAME"