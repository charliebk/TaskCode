#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "recover-branch"

NAME=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        *) [ -z "$NAME" ] && NAME="$1" ;;
    esac
    shift
done

invoke_git "No se pudo hacer fetch de origin." fetch origin

if [ -z "$NAME" ]; then
    printf "\n${C_CYAN}  Ramas disponibles en origin:${C_RESET}\n"
    git ls-remote --heads origin 2>/dev/null | sed 's|.*refs/heads/||' | sort \
        | while IFS= read -r line; do
        printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    printf "\n"
    read -rp "  Nombre de la rama a recuperar: " NAME
fi
[ -z "$NAME" ] && { log_error "Debes especificar una rama."; exit 1; }

log_info "Recuperando rama: $NAME"

# Verificar que existe en origin
if ! git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME"; then
    log_error "La rama '$NAME' no existe en origin. No hay nada que recuperar."
    exit 1
fi

# Si ya existe localmente, pedir confirmación de sobreescritura
if git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null; then
    log_warn "La rama '$NAME' ya existe localmente."
    printf "\n"
    read -rp "  ¿Sobreescribir la copia local con la versión de origin? [s/N]: " overwrite
    if ! [[ "${overwrite,,}" =~ ^s ]]; then
        log_info "Operación cancelada. La rama local no fue modificada."
        exit 0
    fi
    current=$(git branch --show-current 2>/dev/null)
    if [ "$current" = "$NAME" ]; then
        log_error "No puedes sobreescribir la rama en la que estás actualmente. Cambia de rama primero."
        exit 1
    fi
    invoke_git "No se pudo eliminar la rama local $NAME." branch -D "$NAME"
    log_ok "Rama local $NAME eliminada."
fi

invoke_git "No se pudo crear $NAME desde origin/$NAME." checkout -b "$NAME" "origin/$NAME"
log_ok "Rama $NAME recuperada desde origin/$NAME y configurada con tracking."

printf "\n${C_CYAN}  Estado de la rama recuperada:${C_RESET}\n"
git log --oneline -5 | while IFS= read -r line; do
    printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
done
printf "\n"

log_summary "COMPLETADO" "Rama $NAME recuperada desde origin"