#!/usr/bin/env bash
# GitFlow 20 — Mirror to Remote
# Copia TODO el historico (ramas, tags) del origin actual a un remoto destino vacio.
# Util para migrar el repo a otro GitLab/GitHub manteniendo la historia intacta.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "mirror-to-remote"

REMOTE_NAME=""
DEST_URL_ARG=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --name)   REMOTE_NAME="$2"; shift ;;
        --url)    DEST_URL_ARG="$2"; shift ;;
        *) ;;
    esac
    shift
done

# ── 1. Verificar que origin esta accesible ────────────────────────────────────
if ! git remote get-url origin > /dev/null 2>&1; then
    log_error "No existe el remoto 'origin'. Este script asume que el repo ya tiene origin configurado."
    exit 1
fi

ORIGIN_URL=$(git remote get-url origin)
log_info "origin actual: $ORIGIN_URL"

if ! git ls-remote --heads origin > /dev/null 2>&1; then
    log_error "No hay conexion con origin. Necesitas VPN/credenciales para hacer mirror."
    exit 1
fi

# ── 2. Pedir nombre del nuevo remoto si no se paso ────────────────────────────
if [ -z "$REMOTE_NAME" ]; then
    printf "\n"
    read -rp "  Nombre para el remoto destino (sugerido: gitlab-personal): " REMOTE_NAME
    [ -z "$REMOTE_NAME" ] && REMOTE_NAME="gitlab-personal"
fi

if [ "$REMOTE_NAME" = "origin" ]; then
    log_error "No uses 'origin' como nombre del remoto destino. Conservalo para el GitLab actual."
    exit 1
fi

# ── 3. Pedir URL destino (o tomarla del argumento / del remoto si ya existe) ──
if [ -n "$DEST_URL_ARG" ]; then
    DEST_URL="$DEST_URL_ARG"
elif git remote get-url "$REMOTE_NAME" > /dev/null 2>&1; then
    DEST_URL=$(git remote get-url "$REMOTE_NAME")
    log_info "Remoto '$REMOTE_NAME' ya existe. URL: $DEST_URL"
    printf "\n"
    read -rp "  Usar esta URL? [S/n] (n para cambiarla): " keep
    if [[ "${keep,,}" =~ ^n(o)?$ ]]; then
        prompt_destination_url "Nueva URL del repositorio destino"
    fi
else
    prompt_destination_url "URL del repositorio destino (https://... o git@...)"
fi

# ── 4. Registrar/actualizar el remoto ─────────────────────────────────────────
ensure_remote_exists "$REMOTE_NAME" "$DEST_URL" || exit 1

# ── 5. Avisos LFS y submodules ────────────────────────────────────────────────
warn_lfs_and_submodules

# ── 6. Fetch completo de origin para asegurar historia local actualizada ──────
log_info "Refrescando todas las refs de origin (fetch --prune --tags)..."
invoke_git "No se pudo refrescar origin." fetch --prune --tags origin
log_ok "Refs de origin actualizadas."

# ── 7. Verificar que el destino esta vacio (o pedir confirmacion) ─────────────
ensure_remote_empty "$REMOTE_NAME" || { log_summary "CANCELADO" "destino no vacio"; exit 0; }

# ── 8. Resumen y confirmacion ─────────────────────────────────────────────────
show_remote_summary "$REMOTE_NAME" || { log_summary "CANCELADO" "usuario cancelo el envio"; exit 0; }

# ── 9. Push --mirror al destino ───────────────────────────────────────────────
log_info "Enviando todas las ramas a '$REMOTE_NAME'..."
invoke_git "Fallo el push de ramas a $REMOTE_NAME." push "$REMOTE_NAME" --all
log_ok "Ramas enviadas."

log_info "Enviando todos los tags a '$REMOTE_NAME'..."
invoke_git "Fallo el push de tags a $REMOTE_NAME." push "$REMOTE_NAME" --tags
log_ok "Tags enviados."

# ── 10. Resumen final ─────────────────────────────────────────────────────────
BRANCH_COUNT=$(git for-each-ref --format='%(refname:short)' refs/heads | wc -l | tr -d ' ')
TAG_COUNT=$(git tag --list | wc -l | tr -d ' ')

printf "\n${C_GREEN}  Repositorio espejado correctamente:${C_RESET}\n"
printf "${C_GREEN}    origin           -> $ORIGIN_URL${C_RESET}\n"
printf "${C_GREEN}    $REMOTE_NAME -> $DEST_URL${C_RESET}\n"
printf "${C_GREEN}    $BRANCH_COUNT rama(s) + $TAG_COUNT tag(s) enviadas${C_RESET}\n\n"

printf "${C_CYAN}  Siguiente paso opcional:${C_RESET}\n"
printf "${C_DGRAY}    Ejecuta 'GitFlow 21 Switch Working Remote' si quieres que los 19${C_RESET}\n"
printf "${C_DGRAY}    scripts existentes trabajen contra '$REMOTE_NAME' a partir de ahora.${C_RESET}\n\n"

log_summary "COMPLETADO" "mirror $REMOTE_NAME ($BRANCH_COUNT ramas, $TAG_COUNT tags)"
