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

[ -z "$NAME" ] && read -rp "Nombre de release (ej: 4001-cierre-q2): " NAME
NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
[[ "$NAME" != release/* ]] && NAME="release/$NAME"
assert_valid_branch_name "$NAME" "release/4001-cierre-q2"

initialize_gitflow_log "create-release ($NAME)"

ensure_workspace_ready || exit 0

# Ajuste TASK-009 (mismo hallazgo que el ajuste 2 de TASK-008, dejado como
# "hallazgo abierto" en scripts/gitflow/README.md para este script en
# concreto): antes se hacia fetch/pull/push contra origin sin comprobar
# disponibilidad primero, y fallaba duro en un repo sin origin como el
# propio TaskCode. Mismo guard ya probado en invoke_merge_work_branch_to_develop.
REMOTE_AVAILABLE=false
if git ls-remote --heads origin > /dev/null 2>&1; then
    REMOTE_AVAILABLE=true
    log_ok "Conexion remota disponible (origin)."
else
    log_warn "No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local."
fi

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo hacer fetch de origin." fetch origin
fi

if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo crear/cambiar a $DEVELOP_BRANCH desde origin." \
            checkout -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
    else
        log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota para crearla."
        exit 1
    fi
else
    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
fi

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo actualizar $DEVELOP_BRANCH desde origin." \
        pull --ff-only origin "$DEVELOP_BRANCH"
else
    log_warn "Sincronizacion omitida: no hay conexion con origin."
fi

TARGET_LOCAL=false; TARGET_REMOTE=false
git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
if [ "$REMOTE_AVAILABLE" = true ]; then
    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
        && TARGET_REMOTE=true || true
fi

if [ "$TARGET_LOCAL" = true ]; then
    invoke_git "No se pudo cambiar a $NAME." checkout "$NAME"
    log_ok "Switched to branch $NAME (ya existia)"
elif [ "$TARGET_REMOTE" = true ]; then
    invoke_git "No se pudo crear tracking local de $NAME desde origin/$NAME." \
        checkout -b "$NAME" "origin/$NAME"
    log_ok "Switched to branch $NAME (desde origin/$NAME)"
else
    invoke_git "No se pudo crear $NAME desde $DEVELOP_BRANCH." checkout -b "$NAME" "$DEVELOP_BRANCH"
    log_ok "Rama $NAME creada desde $DEVELOP_BRANCH"
fi

if [ "$PUSH" = true ] && [ "$TARGET_REMOTE" = false ]; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo subir $NAME a origin." push -u origin "$NAME"
        log_ok "Push completado: $NAME"
    else
        log_warn "Push omitido: no hay conexion con origin."
    fi
elif [ "$PUSH" = true ] && [ "$TARGET_REMOTE" = true ]; then
    log_ok "La rama $NAME ya existe en origin. No se vuelve a subir."
fi

invoke_git "No se pudo cambiar a $NAME al finalizar." checkout "$NAME"
log_ok "Rama activa final: $NAME"

log_summary "COMPLETADO" "rama $NAME creada desde $DEVELOP_BRANCH"