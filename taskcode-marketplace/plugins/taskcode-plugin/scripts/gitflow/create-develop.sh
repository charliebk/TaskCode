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

# Ajuste TASK-029 (item C6, frente S1): antes se hacia "fetch origin",
# "pull --ff-only origin" y "push -u origin" sin comprobar disponibilidad,
# y el script moria con el "fatal: 'origin' does not appear to be a git
# repository" crudo de Git en cualquier repo sin remoto. Mismo guard ya
# probado en merge-hotfix-to-main.sh / merge-release-to-main.sh (B2).
detect_origin_available

# Decision sobre REMOTE_CONFIGURED vs REMOTE_AVAILABLE (matiz que introdujo
# la revision por pares de B2): aqui SI hay que distinguirlos. Sin origin
# configurado, arrancar Git-Flow en local es el caso de uso legitimo de este
# script. Pero con origin configurado y caido no se puede saber si
# $DEVELOP_BRANCH ya existe en el remoto: crearla desde una rama principal
# posiblemente obsoleta dejaria una develop local divergente de la de origin,
# que es justo el estropicio que el push posterior haria permanente. Se
# aborta y decide la persona, igual que en los merge a main.
if [ "$REMOTE_CONFIGURED" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
    log_error "origin esta configurado pero no responde. No se puede comprobar si $DEVELOP_BRANCH ya existe en el remoto, y crearla en local podria dejarla divergente. Revisa conexion/credenciales; si de verdad quieres operar sin remoto, ejecuta git remote remove origin y reintenta."
    exit 1
fi

MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
log_info "Rama principal detectada: $MAIN_BRANCH"

DEV_LOCAL=false; DEV_REMOTE=false
git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null && DEV_LOCAL=true || true
if [ "$REMOTE_AVAILABLE" = true ]; then
    git ls-remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH" \
        && DEV_REMOTE=true || true
fi

if [ "$DEV_LOCAL" = true ] && [ "$DEV_REMOTE" = true ]; then
    log_ok "$DEVELOP_BRANCH ya existe localmente y en remoto."
    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
    log_ok "Rama activa final: $DEVELOP_BRANCH"
    log_summary "COMPLETADO" "$DEVELOP_BRANCH ya existia, sin cambios"
    exit 0
fi

if [ "$DEV_LOCAL" = true ] && [ "$DEV_REMOTE" = false ]; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        log_warn "$DEVELOP_BRANCH existe local pero no en remoto. Subiendo..."
        invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
        invoke_git "No se pudo subir $DEVELOP_BRANCH." push -u origin "$DEVELOP_BRANCH"
        log_ok "$DEVELOP_BRANCH subido"
        log_summary "COMPLETADO" "$DEVELOP_BRANCH subido a origin"
    else
        log_ok "$DEVELOP_BRANCH ya existe localmente."
        invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
        log_warn "Push omitido: no hay conexion con origin. $DEVELOP_BRANCH queda solo en local."
        log_summary "COMPLETADO" "$DEVELOP_BRANCH ya existia en local, sin push"
    fi
    exit 0
fi

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo hacer fetch de origin." fetch origin
fi

if [ "$DEV_LOCAL" = false ] && [ "$DEV_REMOTE" = true ]; then
    log_info "$DEVELOP_BRANCH existe en remoto pero no localmente. Creando tracking local..."
    invoke_git "No se pudo crear tracking local de $DEVELOP_BRANCH desde origin." \
        checkout -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
    log_ok "$DEVELOP_BRANCH creada en local desde origin/$DEVELOP_BRANCH"
    log_summary "COMPLETADO" "$DEVELOP_BRANCH creado en local desde origin"
    exit 0
fi

if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH." \
            checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
    else
        log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota para crearla."
        exit 1
    fi
else
    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout "$MAIN_BRANCH"
fi

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo actualizar $MAIN_BRANCH." pull --ff-only origin "$MAIN_BRANCH"
else
    log_warn "Sincronizacion omitida: no hay conexion con origin."
fi

log_info "Creando $DEVELOP_BRANCH desde $MAIN_BRANCH..."
invoke_git "No se pudo crear $DEVELOP_BRANCH." checkout -b "$DEVELOP_BRANCH" "$MAIN_BRANCH"

if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo subir $DEVELOP_BRANCH." push -u origin "$DEVELOP_BRANCH"
    log_ok "$DEVELOP_BRANCH creada y subida"
else
    log_warn "Push omitido: no hay conexion con origin. $DEVELOP_BRANCH queda solo en local."
fi

invoke_git "No se pudo cambiar a $DEVELOP_BRANCH al finalizar." checkout "$DEVELOP_BRANCH"
log_ok "Rama activa final: $DEVELOP_BRANCH"

if [ "$REMOTE_AVAILABLE" = true ]; then
    log_summary "COMPLETADO" "$DEVELOP_BRANCH creado desde $MAIN_BRANCH y subido a origin"
else
    log_summary "COMPLETADO" "$DEVELOP_BRANCH creado desde $MAIN_BRANCH solo en local"
fi
