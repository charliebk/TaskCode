#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "resume-work"

NAME=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        *) [ -z "$NAME" ] && NAME="$1" ;;
    esac
    shift
done

if [ -z "$NAME" ]; then
    printf "\n${C_CYAN}  Ramas disponibles localmente:${C_RESET}\n"
    git branch | while IFS= read -r line; do
        printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    printf "\n"
    read -rp "  Nombre de la rama a retomar: " NAME
fi
[ -z "$NAME" ] && { log_error "Debes especificar una rama."; exit 1; }

# Workspace debe estar limpio para cambiar de rama
status_raw=$(git status --porcelain 2>/dev/null)
if [ -n "$status_raw" ]; then
    log_error "El workspace no está limpio. Guarda o descarta los cambios primero."
    log_info  "Usa GitFlow 16 Pause Work para guardar tu trabajo actual."
    exit 1
fi

log_info "Retomando trabajo en rama: $NAME"

invoke_git "No se pudo hacer fetch de origin." fetch origin

# Cambiar a la rama (local o desde origin)
if git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null; then
    invoke_git "No se pudo cambiar a $NAME." checkout "$NAME"
elif git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME"; then
    log_info "Rama $NAME solo existe en origin. Creando copia local..."
    invoke_git "No se pudo crear $NAME desde origin/$NAME." checkout -b "$NAME" "origin/$NAME"
else
    log_error "La rama '$NAME' no existe ni localmente ni en origin."
    log_info  "Si la rama se perdió, usa GitFlow 18 Recover Branch from Origin."
    exit 1
fi

# Actualizar desde origin si tiene tracking remoto
if git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME"; then
    invoke_git "No se pudo actualizar $NAME desde origin." pull --ff-only origin "$NAME"
    log_ok "Rama $NAME actualizada desde origin."
else
    log_warn "La rama $NAME no tiene copia en origin. Trabajando solo en local."
fi

# Buscar stash relacionado con esta rama
stash_line=$(git stash list 2>/dev/null | grep "pause: $NAME" | head -1)
if [ -n "$stash_line" ]; then
    stash_ref=$(printf "%s" "$stash_line" | cut -d: -f1)
    printf "\n${C_YELLOW}  Stash encontrado para esta rama:${C_RESET}\n"
    printf "${C_DGRAY}    %s${C_RESET}\n\n" "$stash_line"
    read -rp "  ¿Aplicar el stash guardado? [S/n]: " apply_stash
    if ! [[ "${apply_stash,,}" =~ ^n ]]; then
        invoke_git "No se pudo aplicar el stash." stash pop
        log_ok "Stash aplicado correctamente."
    fi
fi

printf "\n${C_CYAN}  Estado actual de $NAME:${C_RESET}\n"
git_status=$(git status --short 2>/dev/null)
if [ -z "$git_status" ]; then
    printf "${C_DGRAY}    (workspace limpio)${C_RESET}\n"
else
    while IFS= read -r line; do
        printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done <<< "$git_status"
fi
printf "\n"

log_summary "COMPLETADO" "Trabajo retomado en $NAME"