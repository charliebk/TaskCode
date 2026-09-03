#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; PUSH=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        --push|-p) PUSH=true ;;
        --main)    MAIN_BRANCH="$2";    shift ;;
        --develop) DEVELOP_BRANCH="$2"; shift ;;
    esac
    shift
done

initialize_gitflow_log "create-develop ($DEVELOP_BRANCH)"

ensure_workspace_ready || exit 0

MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
log_info "Rama principal detectada: $MAIN_BRANCH"

DEV_LOCAL=false; DEV_REMOTE=false
git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null && DEV_LOCAL=true || true
git ls-remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH" \
    && DEV_REMOTE=true || true

if [ "$DEV_LOCAL" = true ] && [ "$DEV_REMOTE" = true ]; then
    log_ok "$DEVELOP_BRANCH ya existe localmente y en remoto."
    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
    log_ok "Rama activa final: $DEVELOP_BRANCH"
    log_summary "COMPLETADO" "$DEVELOP_BRANCH ya existia, sin cambios"
    exit 0
fi

if [ "$DEV_LOCAL" = true ] && [ "$DEV_REMOTE" = false ]; then
    log_warn "$DEVELOP_BRANCH existe local pero no en remoto. Subiendo..."
    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
    invoke_git "No se pudo subir $DEVELOP_BRANCH." push -u origin "$DEVELOP_BRANCH"
    log_ok "$DEVELOP_BRANCH subido"
    log_summary "COMPLETADO" "$DEVELOP_BRANCH subido a origin"
    exit 0
fi

invoke_git "No se pudo hacer fetch de origin." fetch origin

if [ "$DEV_LOCAL" = false ] && [ "$DEV_REMOTE" = true ]; then
    log_info "$DEVELOP_BRANCH existe en remoto pero no localmente. Creando tracking local..."
    invoke_git "No se pudo crear tracking local de $DEVELOP_BRANCH desde origin." \
        checkout -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
    log_ok "$DEVELOP_BRANCH creada en local desde origin/$DEVELOP_BRANCH"
    log_summary "COMPLETADO" "$DEVELOP_BRANCH creado en local desde origin"
    exit 0
fi

if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
    invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH." \
        checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
else
    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout "$MAIN_BRANCH"
fi
invoke_git "No se pudo actualizar $MAIN_BRANCH." pull --ff-only origin "$MAIN_BRANCH"

log_info "Creando $DEVELOP_BRANCH desde $MAIN_BRANCH..."
invoke_git "No se pudo crear $DEVELOP_BRANCH." checkout -b "$DEVELOP_BRANCH" "$MAIN_BRANCH"
invoke_git "No se pudo subir $DEVELOP_BRANCH." push -u origin "$DEVELOP_BRANCH"
log_ok "$DEVELOP_BRANCH creada y subida"
invoke_git "No se pudo cambiar a $DEVELOP_BRANCH al finalizar." checkout "$DEVELOP_BRANCH"
log_ok "Rama activa final: $DEVELOP_BRANCH"

log_summary "COMPLETADO" "$DEVELOP_BRANCH creado desde $MAIN_BRANCH y subido a origin"