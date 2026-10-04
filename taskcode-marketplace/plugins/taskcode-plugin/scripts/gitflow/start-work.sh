#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

MAIN_BRANCH=""; DEVELOP_BRANCH="develop"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --main)    MAIN_BRANCH="$2";    shift ;;
        --develop) DEVELOP_BRANCH="$2"; shift ;;
    esac
    shift
done

initialize_gitflow_log "start-work (main + $DEVELOP_BRANCH)"

ensure_workspace_ready || exit 0

MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
log_info "Rama principal detectada: $MAIN_BRANCH"

detect_origin_available

if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH desde remoto." \
            checkout -q -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
        log_ok "Switched to branch $MAIN_BRANCH"
    else
        log_error "No existe la rama local $MAIN_BRANCH y no hay acceso remoto para crearla."
        exit 1
    fi
else
    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout -q "$MAIN_BRANCH"
    log_ok "Switched to branch $MAIN_BRANCH"
fi

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo actualizar $MAIN_BRANCH desde origin." \
        pull --ff-only --quiet origin "$MAIN_BRANCH"
    log_ok "Actualizamos $MAIN_BRANCH"
else
    log_warn "Sincronizacion remota omitida para $MAIN_BRANCH."
fi

if [ "$REMOTE_AVAILABLE" = true ]; then
    if _gf_ls_remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH"; then
        if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
            invoke_git "No se pudo crear/cambiar a $DEVELOP_BRANCH desde remoto." \
                checkout -q -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
        else
            invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout -q "$DEVELOP_BRANCH"
        fi
        log_ok "Switched to branch $DEVELOP_BRANCH"
        invoke_git "No se pudo actualizar $DEVELOP_BRANCH desde origin." \
            pull --ff-only --quiet origin "$DEVELOP_BRANCH"
        log_ok "Actualizamos $DEVELOP_BRANCH"
    else
        log_warn "$DEVELOP_BRANCH no existe en remoto."
    fi
else
    if git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
        invoke_git "No se pudo cambiar a $DEVELOP_BRANCH en modo local." checkout -q "$DEVELOP_BRANCH"
        log_ok "Switched to branch $DEVELOP_BRANCH"
        log_warn "Modo local: no se actualiza $DEVELOP_BRANCH por falta de conexion remota."
    else
        log_warn "Modo local y $DEVELOP_BRANCH no existe localmente."
    fi
fi

log_summary "COMPLETADO" "workspace listo en $DEVELOP_BRANCH"