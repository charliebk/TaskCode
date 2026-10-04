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

# Ajuste TASK-029 (item C6, frente S1): antes se hacia "fetch origin" y
# "ls-remote origin" sin comprobar disponibilidad, y el script moria con el
# "fatal: 'origin' does not appear to be a git repository" crudo de Git.
detect_origin_available

# Decision sobre REMOTE_CONFIGURED vs REMOTE_AVAILABLE: aqui la distincion
# NO cambia el comportamiento (ambos casos son exit 1) pero SI el mensaje,
# que es todo el arreglo que cabe en este script. El proposito entero de
# recover-branch es traerse una rama de origin: no existe modo local
# posible, asi que fingir exito seria peor que el bug. Lo que si cambia es
# que hacer despues: sin origin configurado hay que anadir el remoto; con
# origin caido hay que arreglar la conexion y reintentar.
if [ "$REMOTE_CONFIGURED" = false ]; then
    log_error "Este repo no tiene un remoto 'origin' configurado y recover-branch solo sabe recuperar ramas DESDE origin. No hay nada que recuperar. Si la rama existe en algun repositorio remoto, anadelo primero con: git remote add origin <url>"
    log_summary "FALLIDO" "sin remoto origin configurado"
    exit 1
fi
if [ "$REMOTE_AVAILABLE" = false ]; then
    log_error "origin esta configurado pero no responde, y recover-branch necesita leer la rama DESDE origin. Revisa conexion/credenciales (VPN, token, acceso al repositorio) y reintenta."
    log_summary "FALLIDO" "origin configurado pero inaccesible"
    exit 1
fi

invoke_git "No se pudo hacer fetch de origin." fetch origin

if [ -z "$NAME" ]; then
    printf "\n${C_CYAN}  Ramas disponibles en origin:${C_RESET}\n"
    _gf_ls_remote --heads origin 2>/dev/null | sed 's|.*refs/heads/||' | sort \
        | while IFS= read -r line; do
        printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    printf "\n"
    read -rp "  Nombre de la rama a recuperar: " NAME
fi
[ -z "$NAME" ] && { log_error "Debes especificar una rama."; exit 1; }

log_info "Recuperando rama: $NAME"

# Verificar que existe en origin
if ! _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME"; then
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
