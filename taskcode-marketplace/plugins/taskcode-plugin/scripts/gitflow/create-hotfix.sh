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

[ -z "$NAME" ] && read -rp "Nombre de hotfix (ej: 3001-crash-startup): " NAME
NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
[[ "$NAME" != hotfix/* ]] && NAME="hotfix/$NAME"
assert_valid_branch_name "$NAME" "hotfix/3001-crash-startup"

initialize_gitflow_log "create-hotfix ($NAME)"

ensure_workspace_ready || exit 0

MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
log_info "Rama principal detectada: $MAIN_BRANCH"

invoke_git "No se pudo hacer fetch de origin." fetch origin

if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
    invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH desde origin." \
        checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
else
    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout "$MAIN_BRANCH"
fi
invoke_git "No se pudo actualizar $MAIN_BRANCH desde origin." \
    pull --ff-only origin "$MAIN_BRANCH"

TARGET_LOCAL=false; TARGET_REMOTE=false
git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
    && TARGET_REMOTE=true || true

if [ "$TARGET_LOCAL" = true ]; then
    invoke_git "No se pudo cambiar a $NAME." checkout "$NAME"
    log_ok "Switched to branch $NAME (ya existia)"
elif [ "$TARGET_REMOTE" = true ]; then
    invoke_git "No se pudo crear tracking local de $NAME desde origin/$NAME." \
        checkout -b "$NAME" "origin/$NAME"
    log_ok "Switched to branch $NAME (desde origin/$NAME)"
else
    invoke_git "No se pudo crear $NAME desde $MAIN_BRANCH." checkout -b "$NAME" "$MAIN_BRANCH"
    log_ok "Rama $NAME creada desde $MAIN_BRANCH"
fi

if [ "$PUSH" = true ] && [ "$TARGET_REMOTE" = false ]; then
    invoke_git "No se pudo subir $NAME a origin." push -u origin "$NAME"
    log_ok "Push completado: $NAME"
elif [ "$PUSH" = true ] && [ "$TARGET_REMOTE" = true ]; then
    log_ok "La rama $NAME ya existe en origin. No se vuelve a subir."
fi

invoke_git "No se pudo cambiar a $NAME al finalizar." checkout "$NAME"
log_ok "Rama activa final: $NAME"

log_summary "COMPLETADO" "rama $NAME creada desde $MAIN_BRANCH"