#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "pause-work"

PUSH=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        --push|-p) PUSH=true ;;
    esac
    shift
done

current=$(git branch --show-current 2>/dev/null)
[ -z "$current" ] && { log_error "No estás en ninguna rama (detached HEAD)."; exit 1; }

log_info "Pausando trabajo en rama: $current"

status_raw=$(git status --porcelain 2>/dev/null)

if [ -z "$status_raw" ]; then
    log_info "Workspace limpio. No hay cambios locales que guardar."
    if [ "$PUSH" = true ]; then
        invoke_git "No se pudo hacer push de $current a origin." push origin "$current"
        log_ok "Push completado: $current → origin/$current"
    fi
    log_summary "COMPLETADO" "Rama $current ya estaba limpia"
    exit 0
fi

printf "\n${C_YELLOW}  Cambios sin guardar en $current:${C_RESET}\n"
while IFS= read -r line; do
    printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
done <<< "$status_raw"
printf "\n"

read -rp "  ¿Cómo guardar el trabajo? [commit/stash/cancelar]: " answer

case "${answer,,}" in
    commit|c)
        read -rp "  Mensaje (Enter = 'chore: wip $(date +%Y-%m-%d)'): " msg
        [ -z "$msg" ] && msg="chore: wip $(date +%Y-%m-%d)"
        git add -A || { log_error "No se pudieron preparar los cambios."; exit 1; }
        invoke_git "No se pudo crear el commit." commit -m "$msg"
        log_ok "Commit creado: $msg"
        if [ "$PUSH" = true ]; then
            invoke_git "No se pudo hacer push de $current." push origin "$current"
            log_ok "Push completado: $current → origin/$current"
        fi
        log_info "Para retomar: usa GitFlow 17 Resume Work en la rama $current"
        log_summary "COMPLETADO" "Trabajo guardado como commit en $current"
        ;;
    stash|s)
        stash_msg="pause: $current $(date +%Y-%m-%d)"
        invoke_git "No se pudo crear el stash." stash push -u -m "$stash_msg"
        log_ok "Stash creado: $stash_msg"
        log_info "Para retomar: usa GitFlow 17 Resume Work en la rama $current"
        log_summary "COMPLETADO" "Trabajo guardado como stash en $current"
        ;;
    cancelar|cancel|n|no)
        log_warn "Operación cancelada. No se guardó nada."
        log_summary "CANCELADO" "Sin cambios realizados"
        ;;
    *)
        log_error "Opción no reconocida: '$answer'. Usa 'commit', 'stash' o 'cancelar'."
        exit 1
        ;;
esac