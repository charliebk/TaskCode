#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --push|-p) PUSH=true ;;
        --main)    MAIN_BRANCH="$2";    shift ;;
        --develop) DEVELOP_BRANCH="$2"; shift ;;
        *)         [ -z "$NAME" ] && NAME="$1" ;;
    esac
    shift
done

[ -z "$NAME" ] && read -rp "Hotfix a unir a main (ej: 3001-crash-startup): " NAME
NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
[[ "$NAME" != hotfix/* ]] && NAME="hotfix/$NAME"

initialize_gitflow_log "merge-hotfix -> main ($NAME)"

ensure_workspace_ready \
    "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
    "chore: commit local antes de merge hotfix->main" || exit 0

MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
log_info "Rama principal detectada: $MAIN_BRANCH"

# Ajuste B2 (mismo guard que introdujo TASK-008 en los merge a develop):
# antes se hacia "fetch origin" sin comprobar disponibilidad y el script
# fallaba duro (exit 1) en cualquier repo sin origin configurado.
detect_origin_available

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo hacer fetch de origin." fetch origin
fi

if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH desde origin." \
            checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
    else
        log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota para crearla."
        exit 1
    fi
else
    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout "$MAIN_BRANCH"
fi

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo actualizar $MAIN_BRANCH desde origin." pull --ff-only origin "$MAIN_BRANCH"
else
    log_warn "Sincronizacion omitida: no hay conexion con origin."
fi

if ! git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo crear/cambiar a $NAME desde origin." checkout -b "$NAME" "origin/$NAME"
    else
        log_error "$NAME no existe localmente y no hay conexion remota para recuperarla."
        exit 1
    fi
fi

invoke_git "No se pudo volver a $MAIN_BRANCH para merge." checkout "$MAIN_BRANCH"

show_merge_diff "$NAME" "$MAIN_BRANCH" || exit 0

COMMIT_COUNT=$(git rev-list --count "$MAIN_BRANCH..$NAME" 2>/dev/null || echo "?")

invoke_git "No se pudo hacer merge de $NAME en $MAIN_BRANCH." \
    merge --no-ff "$NAME" -m "merge(hotfix): $NAME -> $MAIN_BRANCH"

TAG_NAME="${NAME#hotfix/}"
[[ "$TAG_NAME" =~ ^[0-9] ]] && TAG_NAME="v$TAG_NAME"
invoke_git "No se pudo crear tag $TAG_NAME en $MAIN_BRANCH." \
    tag -a "$TAG_NAME" -m "Hotfix $TAG_NAME"
log_ok "Tag creado: $TAG_NAME"

if [ "$PUSH" = true ]; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo subir $MAIN_BRANCH a origin." push origin "$MAIN_BRANCH"
        invoke_git "No se pudo subir tag $TAG_NAME a origin." push origin "$TAG_NAME"
        log_ok "Push completado: $MAIN_BRANCH y tag $TAG_NAME"
    else
        log_warn "Push omitido: no hay conexion con origin."
    fi
fi

log_info "Preparando backmerge: $NAME -> $DEVELOP_BRANCH..."
invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"

if ! show_merge_diff "$NAME" "$DEVELOP_BRANCH"; then
    log_warn "Backmerge cancelado. $MAIN_BRANCH y tag $TAG_NAME ya estan actualizados."
    log_summary "PARCIAL" "merge a $MAIN_BRANCH OK | backmerge a $DEVELOP_BRANCH cancelado"
    exit 0
fi

invoke_git "No se pudo hacer merge de $NAME en $DEVELOP_BRANCH." \
    merge --no-ff "$NAME" -m "merge(hotfix): $NAME -> $DEVELOP_BRANCH (backmerge)"
log_ok "Merge back completado: $NAME -> $DEVELOP_BRANCH"

if [ "$PUSH" = true ]; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo subir $DEVELOP_BRANCH a origin." push origin "$DEVELOP_BRANCH"
        log_ok "Push completado: $DEVELOP_BRANCH"
    else
        log_warn "Push omitido: no hay conexion con origin."
    fi
fi

log_summary "COMPLETADO" "${COMMIT_COUNT} commit(s) | tag $TAG_NAME | backmerge a $DEVELOP_BRANCH"