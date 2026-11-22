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
    log_info  "Usa taskctl pause para guardar tu trabajo actual."
    exit 1
fi

log_info "Retomando trabajo en rama: $NAME"

# Ajuste TASK-029 (item C6, frente S1): antes se hacia "fetch origin" y dos
# "ls-remote origin" sin comprobar disponibilidad, y el script moria con el
# "fatal: 'origin' does not appear to be a git repository" crudo de Git.
detect_origin_available

# Decision sobre REMOTE_CONFIGURED vs REMOTE_AVAILABLE: aqui NO se
# distinguen para decidir el comportamiento, y es deliberado. A diferencia
# de los merge a main (donde un origin caido puede dejar un tag sobre
# historia divergente) o de create-develop (donde se crearia una rama
# divergente), retomar una rama que YA existe en local no escribe historia
# ni publica nada: en el peor caso se trabaja sobre una copia desactualizada,
# que es exactamente lo que avisa el log_warn. Abortar aqui romperia el caso
# de uso central de resume-work: volver a tu rama con la VPN caida o sin
# red. La distincion si se usa para el TEXTO de los avisos, porque lo que
# hay que hacer despues no es lo mismo.
if [ "$REMOTE_AVAILABLE" = true ]; then
    invoke_git "No se pudo hacer fetch de origin." fetch origin
elif [ "$REMOTE_CONFIGURED" = true ]; then
    log_warn "Sincronizacion omitida: origin esta configurado pero no responde. Se trabaja con la copia local, que puede estar desactualizada."
else
    log_warn "Sincronizacion omitida: este repo no tiene remoto 'origin'. Se trabaja solo en local."
fi

# Cambiar a la rama (local o desde origin)
NAME_REMOTE=false
if [ "$REMOTE_AVAILABLE" = true ]; then
    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
        && NAME_REMOTE=true || true
fi

if git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null; then
    invoke_git "No se pudo cambiar a $NAME." checkout "$NAME"
elif [ "$NAME_REMOTE" = true ]; then
    log_info "Rama $NAME solo existe en origin. Creando copia local..."
    invoke_git "No se pudo crear $NAME desde origin/$NAME." checkout -b "$NAME" "origin/$NAME"
elif [ "$REMOTE_AVAILABLE" = true ]; then
    log_error "La rama '$NAME' no existe ni localmente ni en origin."
    log_info  "Si la rama se perdió, usa taskctl recover."
    exit 1
else
    log_error "La rama '$NAME' no existe localmente y no hay conexion con origin para buscarla."
    log_info  "Comprueba el nombre con git branch, o recupera la conexion y usa taskctl recover."
    exit 1
fi

# Actualizar desde origin si tiene tracking remoto
if [ "$NAME_REMOTE" = true ]; then
    invoke_git "No se pudo actualizar $NAME desde origin." pull --ff-only origin "$NAME"
    log_ok "Rama $NAME actualizada desde origin."
elif [ "$REMOTE_AVAILABLE" = true ]; then
    log_warn "La rama $NAME no tiene copia en origin. Trabajando solo en local."
else
    log_warn "Rama $NAME retomada sin sincronizar con origin."
fi

# Buscar el stash que dejo pause-work.sh para ESTA rama.
# TASK-142 (SCR-01): antes se hacia `grep "pause: $NAME"`, que tambien casaba
# con ramas que empiezan igual (feature/a con feature/ab) y con metacaracteres
# del nombre, y despues `stash pop` a secas, que aplica stash@{0} y no el
# encontrado. Ahora el asunto tiene que terminar EXACTAMENTE en
# "pause: <rama> AAAA-MM-DD" (el nombre entre comillas es literal en el
# patron) y se aplica ese stash por su referencia.
stash_ref=""
stash_line=""
while IFS=$'\t' read -r ref asunto; do
    if [[ "$asunto" == *"pause: $NAME "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] ]]; then
        stash_ref="$ref"
        stash_line="$ref: $asunto"
        break
    fi
done < <(git stash list --format='%gd%x09%gs' 2>/dev/null)
if [ -n "$stash_ref" ]; then
    printf "\n${C_YELLOW}  Stash encontrado para esta rama:${C_RESET}\n"
    printf "${C_DGRAY}    %s${C_RESET}\n\n" "$stash_line"
    read -rp "  ¿Aplicar el stash guardado? [S/n]: " apply_stash
    if ! [[ "${apply_stash,,}" =~ ^n ]]; then
        invoke_git "No se pudo aplicar el stash." stash pop "$stash_ref"
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
