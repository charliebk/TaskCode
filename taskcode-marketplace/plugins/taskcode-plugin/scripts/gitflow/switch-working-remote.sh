#!/usr/bin/env bash
# GitFlow 21 — Switch Working Remote
# Renombra el origin actual a un alias (backup) y promueve otro remoto a 'origin'.
# Asi los 19 scripts existentes (que hablan con 'origin') trabajan contra el nuevo GitLab
# sin tocar ningun script. Reversible volviendo a ejecutar el comando con los nombres cambiados.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "switch-working-remote"

NEW_ORIGIN=""
BACKUP_NAME=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --new-origin) NEW_ORIGIN="$2"; shift ;;
        --backup-as)  BACKUP_NAME="$2"; shift ;;
        *) ;;
    esac
    shift
done

# ── 1. Listar remotos actuales ────────────────────────────────────────────────
printf "\n${C_CYAN}  Remotos configurados actualmente:${C_RESET}\n"
git remote -v | while IFS= read -r line; do
    printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
done
printf "\n"

# ── 2. Verificar que existe origin ────────────────────────────────────────────
if ! git remote get-url origin > /dev/null 2>&1; then
    log_error "No existe el remoto 'origin'. No hay nada que conmutar."
    exit 1
fi

CURRENT_ORIGIN_URL=$(git remote get-url origin)

# ── 3. Pedir nombre del remoto que se promovera a origin ──────────────────────
if [ -z "$NEW_ORIGIN" ]; then
    printf "${C_CYAN}  Remotos disponibles (excepto 'origin'):${C_RESET}\n"
    AVAILABLE=$(git remote | grep -v '^origin$' || true)
    if [ -z "$AVAILABLE" ]; then
        log_error "No hay otros remotos configurados. Ejecuta antes 'bash mirror-to-remote.sh', en esta misma carpeta."
        exit 1
    fi
    printf "%s\n" "$AVAILABLE" | while IFS= read -r line; do
        url=$(git remote get-url "$line" 2>/dev/null)
        printf "${C_DGRAY}    %-25s %s${C_RESET}\n" "$line" "$url"
    done
    printf "\n"
    read -rp "  Que remoto promover a 'origin'? : " NEW_ORIGIN
fi
[ -z "$NEW_ORIGIN" ] && { log_error "Debes indicar el remoto a promover."; exit 1; }

if [ "$NEW_ORIGIN" = "origin" ]; then
    log_error "No tiene sentido promover 'origin' a 'origin'. Ya es el activo."
    exit 1
fi

if ! git remote get-url "$NEW_ORIGIN" > /dev/null 2>&1; then
    log_error "El remoto '$NEW_ORIGIN' no existe. Crealo primero con 'bash mirror-to-remote.sh', en esta misma carpeta."
    exit 1
fi

NEW_ORIGIN_URL=$(git remote get-url "$NEW_ORIGIN")

# ── 4. Pedir nombre del alias de backup para el origin actual ─────────────────
if [ -z "$BACKUP_NAME" ]; then
    DEFAULT_BACKUP="gitlab-empresa"
    git remote get-url "$DEFAULT_BACKUP" > /dev/null 2>&1 && DEFAULT_BACKUP="gitlab-empresa-bak"
    printf "\n"
    read -rp "  Nombre para conservar el origin actual como backup (Enter para '$DEFAULT_BACKUP'): " BACKUP_NAME
    [ -z "$BACKUP_NAME" ] && BACKUP_NAME="$DEFAULT_BACKUP"
fi

if [ "$BACKUP_NAME" = "origin" ] || [ "$BACKUP_NAME" = "$NEW_ORIGIN" ]; then
    log_error "El nombre de backup no puede ser 'origin' ni '$NEW_ORIGIN'."
    exit 1
fi

if git remote get-url "$BACKUP_NAME" > /dev/null 2>&1; then
    log_warn "Ya existe un remoto llamado '$BACKUP_NAME'. Se sobreescribira con la URL actual de origin."
    printf "\n"
    read -rp "  Continuar? [s/N]: " confirm
    if ! [[ "${confirm,,}" =~ ^(s|si|y|yes)$ ]]; then
        log_summary "CANCELADO" "usuario cancelo"
        exit 0
    fi
fi

# ── 5. Resumen del cambio y confirmacion ──────────────────────────────────────
sep=$(printf -- '-%.0s' {1..56})
printf "\n${C_CYAN}  Cambio que se va a aplicar:${C_RESET}\n"
printf "${C_CYAN}  %s${C_RESET}\n" "$sep"
printf "  ${C_YELLOW}ANTES:${C_RESET}\n"
printf "    origin           -> $CURRENT_ORIGIN_URL\n"
printf "    $NEW_ORIGIN -> $NEW_ORIGIN_URL\n"
printf "  ${C_GREEN}DESPUES:${C_RESET}\n"
printf "    origin           -> $NEW_ORIGIN_URL\n"
printf "    $BACKUP_NAME -> $CURRENT_ORIGIN_URL\n"
printf "    ($NEW_ORIGIN se elimina como alias duplicado)\n"
printf "${C_CYAN}  %s${C_RESET}\n\n" "$sep"

printf "${C_WHITE}  Tras este cambio los 19 scripts GitFlow trabajaran contra:${C_RESET}\n"
printf "${C_WHITE}    $NEW_ORIGIN_URL${C_RESET}\n\n"

read -rp "  Confirmar la conmutacion? [s/N]: " confirm
if ! [[ "${confirm,,}" =~ ^(s|si|y|yes)$ ]]; then
    log_summary "CANCELADO" "usuario cancelo"
    exit 0
fi

# ── 6. Ejecutar la conmutacion ────────────────────────────────────────────────
# 6a. Renombrar origin actual a BACKUP_NAME (si ya existe BACKUP_NAME lo borramos antes)
if git remote get-url "$BACKUP_NAME" > /dev/null 2>&1; then
    invoke_git "No se pudo eliminar el backup previo '$BACKUP_NAME'." remote remove "$BACKUP_NAME"
fi
invoke_git "No se pudo renombrar origin -> $BACKUP_NAME." remote rename origin "$BACKUP_NAME"
log_ok "origin actual conservado como '$BACKUP_NAME'."

# 6b. Renombrar NEW_ORIGIN -> origin
invoke_git "No se pudo renombrar $NEW_ORIGIN -> origin." remote rename "$NEW_ORIGIN" origin
log_ok "'$NEW_ORIGIN' promovido a 'origin'."

# 6c. Fetch del nuevo origin para refrescar tracking refs
log_info "Refrescando refs del nuevo origin..."
if git ls-remote --heads origin > /dev/null 2>&1; then
    invoke_git "No se pudo hacer fetch del nuevo origin." fetch --prune --tags origin
    log_ok "Refs del nuevo origin sincronizadas."
else
    log_warn "El nuevo origin no respondio al fetch. Verifica credenciales/conectividad."
fi

# ── 7. Reconfigurar upstream de la rama actual si procede ─────────────────────
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ -n "$CURRENT_BRANCH" ] && git ls-remote --heads origin "$CURRENT_BRANCH" 2>/dev/null | grep -q "refs/heads/$CURRENT_BRANCH"; then
    invoke_git "No se pudo reconfigurar upstream de $CURRENT_BRANCH." \
        branch --set-upstream-to="origin/$CURRENT_BRANCH" "$CURRENT_BRANCH"
    log_ok "Upstream de '$CURRENT_BRANCH' actualizado a origin/$CURRENT_BRANCH."
fi

# ── 8. Resumen final ──────────────────────────────────────────────────────────
printf "\n${C_GREEN}  Conmutacion completada:${C_RESET}\n"
git remote -v | while IFS= read -r line; do
    printf "${C_GREEN}    %s${C_RESET}\n" "$line"
done
printf "\n${C_CYAN}  Para volver atras:${C_RESET}\n"
printf "${C_DGRAY}    Reejecuta este script con --new-origin $BACKUP_NAME${C_RESET}\n\n"

log_summary "COMPLETADO" "origin ahora apunta a $NEW_ORIGIN_URL"
