#!/usr/bin/env bash
# GitFlow 22 — Push Back to Remote
# Devuelve todas las ramas y tags del repo actual al remoto original (GitLab corporativo)
# cuando se quiera retomar el trabajo en el. Como los SHAs son identicos, el destino
# reconoce la historia previa y solo anade los commits nuevos. Sin reescritura forzada.

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "push-back-to-remote"

TARGET_REMOTE=""
RESTORE_AS_ORIGIN=false
MODE=""   # "additive" o "mirror" (se pregunta interactivo si no se pasa)
while [[ $# -gt 0 ]]; do
    case "$1" in
        --target)             TARGET_REMOTE="$2"; shift ;;
        --restore-as-origin)  RESTORE_AS_ORIGIN=true ;;
        --mode)               MODE="$2"; shift ;;
        --additive)           MODE="additive" ;;
        --mirror)             MODE="mirror" ;;
        *) ;;
    esac
    shift
done

# ── 1. Listar remotos para que el usuario sepa con que trabaja ────────────────
printf "\n${C_CYAN}  Remotos configurados:${C_RESET}\n"
git remote -v | while IFS= read -r line; do
    printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
done
printf "\n"

# ── 2. Seleccionar remoto destino ─────────────────────────────────────────────
if [ -z "$TARGET_REMOTE" ]; then
    # Sugerencias razonables si existen
    DEFAULT_TARGET=""
    for candidate in gitlab-empresa gitlab-empresa-bak gitlab-corporativo origin-old; do
        if git remote get-url "$candidate" > /dev/null 2>&1; then
            DEFAULT_TARGET="$candidate"
            break
        fi
    done

    if [ -n "$DEFAULT_TARGET" ]; then
        read -rp "  Remoto destino (Enter para '$DEFAULT_TARGET'): " TARGET_REMOTE
        [ -z "$TARGET_REMOTE" ] && TARGET_REMOTE="$DEFAULT_TARGET"
    else
        read -rp "  Nombre del remoto destino (al que devolver el trabajo): " TARGET_REMOTE
    fi
fi
[ -z "$TARGET_REMOTE" ] && { log_error "Debes indicar un remoto destino."; exit 1; }

if ! git remote get-url "$TARGET_REMOTE" > /dev/null 2>&1; then
    log_error "El remoto '$TARGET_REMOTE' no existe."
    log_info "Si lo borraste, recrealo con: git remote add $TARGET_REMOTE <url>"
    exit 1
fi

TARGET_URL=$(git remote get-url "$TARGET_REMOTE")
log_info "Destino seleccionado: $TARGET_REMOTE -> $TARGET_URL"

# ── 3. Verificar conectividad ─────────────────────────────────────────────────
if ! _gf_ls_remote --heads "$TARGET_REMOTE" > /dev/null 2>&1; then
    log_error "No hay conexion con '$TARGET_REMOTE'. Necesitas VPN/credenciales."
    exit 1
fi
log_ok "Conexion con '$TARGET_REMOTE' verificada."

# ── 3b. Seleccionar modo (additive o mirror) ──────────────────────────────────
if [ -z "$MODE" ]; then
    printf "\n${C_CYAN}  Modos disponibles para devolver el trabajo:${C_RESET}\n"
    printf "    ${C_GREEN}1) ADITIVO${C_RESET}  Envia ramas+tags locales. NO borra nada del destino.\n"
    printf "    ${C_RED}2) MIRROR${C_RESET}   Sobreescribe el destino con espejo exacto de local.\n"
    printf "              ${C_RED}BORRA del destino lo que no exista en local (incluso tags).${C_RESET}\n"
    printf "\n"
    read -rp "  Elige modo [1=aditivo / 2=mirror]: " MODE_NUM
    case "$MODE_NUM" in
        1|a|A) MODE="additive" ;;
        2|m|M) MODE="mirror" ;;
        *)     log_error "Modo invalido. Aborto por seguridad."; exit 1 ;;
    esac
fi

if [ "$MODE" != "additive" ] && [ "$MODE" != "mirror" ]; then
    log_error "Modo invalido: '$MODE'. Valores aceptados: additive | mirror."
    exit 1
fi
log_info "Modo seleccionado: $MODE"

# ── 4. Fetch del destino para conocer su estado actual ────────────────────────
log_info "Refrescando estado de '$TARGET_REMOTE' (fetch --prune --tags)..."
invoke_git "No se pudo refrescar $TARGET_REMOTE." fetch --prune --tags "$TARGET_REMOTE"
log_ok "Estado de '$TARGET_REMOTE' actualizado."

# ── 5. Detectar ramas con divergencia (commits no fast-forward) ───────────────
# TASK-038 (IMPORTANTE de su revision): la lista de ramas del destino se pide
# UNA vez y con el codigo de salida comprobado. Desde que las consultas tienen
# limite de tiempo, una consulta que expiraba devolvia una lista vacia: la
# vista previa del mirror decia "nada que borrar" y despues `push --mirror`
# borraba esas ramas. Sin la lista completa no se sigue.
if ! REMOTE_HEADS_RAW=$(_gf_ls_remote --heads "$TARGET_REMOTE" 2>/dev/null); then
    log_error "No se pudo listar las ramas de '$TARGET_REMOTE' (red lenta o caida). Aborto: sin esa lista no se puede saber que ramas divergen ni cuales borraria un mirror. Reintenta, o sube el limite con GF_TIMEOUT_REMOTO."
    exit 1
fi
DIVERGED=""
while IFS= read -r local_branch; do
    [ -z "$local_branch" ] && continue
    if printf "%s\n" "$REMOTE_HEADS_RAW" | grep -q "refs/heads/$local_branch\$"; then
        ahead=$(git rev-list --count "$TARGET_REMOTE/$local_branch..$local_branch" 2>/dev/null || echo 0)
        behind=$(git rev-list --count "$local_branch..$TARGET_REMOTE/$local_branch" 2>/dev/null || echo 0)
        if [ "$behind" -gt 0 ]; then
            DIVERGED="$DIVERGED  $local_branch (local +$ahead / destino +$behind)\n"
        fi
    fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads)

# ── 5b. SOLO MIRROR: detectar ramas y tags del destino que se BORRARAN ────────
REMOTE_ONLY_BRANCHES=""
REMOTE_ONLY_TAGS=""
if [ "$MODE" = "mirror" ]; then
    # Ramas que existen en destino pero no en local
    REMOTE_BRANCHES=$(printf "%s\n" "$REMOTE_HEADS_RAW" | grep 'refs/heads/' | sed 's|.*refs/heads/||' | sort -u)
    LOCAL_BRANCHES=$(git for-each-ref --format='%(refname:short)' refs/heads | sort -u)
    REMOTE_ONLY_BRANCHES=$(comm -23 <(printf "%s\n" "$REMOTE_BRANCHES") <(printf "%s\n" "$LOCAL_BRANCHES") | grep -v '^$' || true)

    # Tags que existen en destino pero no en local
    if ! REMOTE_TAGS_RAW=$(_gf_ls_remote --tags "$TARGET_REMOTE" 2>/dev/null); then
        log_error "No se pudo listar los tags de '$TARGET_REMOTE' (red lenta o caida). Aborto el mirror: borraria tags que la vista previa no puede mostrar."
        exit 1
    fi
    REMOTE_TAGS=$(printf "%s\n" "$REMOTE_TAGS_RAW" | grep 'refs/tags/' | sed 's|.*refs/tags/||' | sed 's|\^{}$||' | sort -u)
    LOCAL_TAGS=$(git tag --list | sort -u)
    REMOTE_ONLY_TAGS=$(comm -23 <(printf "%s\n" "$REMOTE_TAGS") <(printf "%s\n" "$LOCAL_TAGS") | grep -v '^$' || true)
fi

# ── 6. Confirmacion segun modo ────────────────────────────────────────────────
if [ "$MODE" = "additive" ]; then
    if [ -n "$DIVERGED" ]; then
        log_warn "Algunas ramas tienen commits en '$TARGET_REMOTE' que NO estan en local:"
        printf "$DIVERGED"
        printf "\n${C_YELLOW}  Si haces push aditivo, el destino los rechazara (non-fast-forward).${C_RESET}\n"
        printf "${C_YELLOW}  Recomendacion: trae esos commits con 'git pull $TARGET_REMOTE <rama>',${C_RESET}\n"
        printf "${C_YELLOW}  resuelve los merges localmente, y vuelve a ejecutar este script.${C_RESET}\n\n"
        read -rp "  Continuar de todas formas (las divergentes fallaran)? [s/N]: " confirm
        if ! [[ "${confirm,,}" =~ ^(s|si|y|yes)$ ]]; then
            log_summary "CANCELADO" "divergencias detectadas"
            exit 0
        fi
    fi
    show_remote_summary "$TARGET_REMOTE" || { log_summary "CANCELADO" "usuario cancelo el envio"; exit 0; }
else
    # ── Modo MIRROR: doble confirmacion con preview de lo que se BORRA ────────
    bar=$(printf '!%.0s' {1..56})
    printf "\n${C_RED}  %s${C_RESET}\n" "$bar"
    printf "${C_RED}    ATENCION: MODO MIRROR SELECCIONADO${C_RESET}\n"
    printf "${C_RED}    Se sobreescribira '$TARGET_REMOTE' con espejo EXACTO de local.${C_RESET}\n"
    printf "${C_RED}  %s${C_RESET}\n\n" "$bar"

    if [ -n "$DIVERGED" ]; then
        printf "${C_YELLOW}  Ramas con commits del destino que se PERDERAN (force-overwrite):${C_RESET}\n"
        printf "$DIVERGED\n"
    fi

    if [ -n "$REMOTE_ONLY_BRANCHES" ]; then
        ROB_COUNT=$(printf "%s\n" "$REMOTE_ONLY_BRANCHES" | wc -l | tr -d ' ')
        printf "${C_RED}  Ramas que EXISTEN solo en destino y se BORRARAN ($ROB_COUNT):${C_RESET}\n"
        printf "%s\n" "$REMOTE_ONLY_BRANCHES" | while IFS= read -r line; do
            printf "${C_RED}    - $line${C_RESET}\n"
        done
        printf "\n"
    else
        printf "${C_GREEN}  No hay ramas exclusivas en destino — nada que borrar en ese plano.${C_RESET}\n\n"
    fi

    if [ -n "$REMOTE_ONLY_TAGS" ]; then
        ROT_COUNT=$(printf "%s\n" "$REMOTE_ONLY_TAGS" | wc -l | tr -d ' ')
        printf "${C_RED}  Tags que EXISTEN solo en destino y se BORRARAN ($ROT_COUNT):${C_RESET}\n"
        printf "%s\n" "$REMOTE_ONLY_TAGS" | head -10 | while IFS= read -r line; do
            printf "${C_RED}    - $line${C_RESET}\n"
        done
        [ "$ROT_COUNT" -gt 10 ] && printf "${C_RED}    ... y $((ROT_COUNT - 10)) mas${C_RESET}\n"
        printf "\n"
    else
        printf "${C_GREEN}  No hay tags exclusivos en destino — nada que borrar en ese plano.${C_RESET}\n\n"
    fi

    printf "${C_RED}  Esta accion es IRREVERSIBLE sobre el destino '$TARGET_REMOTE'.${C_RESET}\n"
    printf "${C_RED}  Si tu equipo IECA exige conservar ramas tras merge, este modo VIOLA esa politica.${C_RESET}\n\n"

    # Confirmacion 1: resumen estandar
    show_remote_summary "$TARGET_REMOTE" || { log_summary "CANCELADO" "usuario cancelo el envio"; exit 0; }

    # Confirmacion 2: palabra exacta
    printf "\n${C_RED}  Para continuar, escribe exactamente la frase:${C_RESET}\n"
    printf "${C_RED}    BORRAR Y SUSTITUIR${C_RESET}\n\n"
    read -rp "  Confirmacion: " typed
    if [ "$typed" != "BORRAR Y SUSTITUIR" ]; then
        log_warn "Confirmacion no coincide. Operacion abortada."
        log_summary "CANCELADO" "frase de confirmacion no coincide"
        exit 0
    fi
    log_warn "Confirmacion mirror aceptada. Procediendo con push --mirror..."
fi

# ── 7-8. Push segun modo ──────────────────────────────────────────────────────
if [ "$MODE" = "additive" ]; then
    log_info "Enviando ramas a '$TARGET_REMOTE' (modo aditivo)..."
    PUSH_OUTPUT=$(git push "$TARGET_REMOTE" --all 2>&1) || {
        log_warn "Algunos pushes de ramas fallaron. Detalle:"
    }
    printf "%s\n" "$PUSH_OUTPUT" | while IFS= read -r line; do
        [ -n "$line" ] && printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    log_ok "Push de ramas completado."

    log_info "Enviando tags a '$TARGET_REMOTE'..."
    TAG_OUTPUT=$(git push "$TARGET_REMOTE" --tags 2>&1) || {
        log_warn "Algunos pushes de tags fallaron. Detalle:"
    }
    printf "%s\n" "$TAG_OUTPUT" | while IFS= read -r line; do
        [ -n "$line" ] && printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    log_ok "Push de tags completado."
else
    log_warn "Ejecutando push --mirror a '$TARGET_REMOTE'..."
    log_warn "Esto sobreescribe el destino con espejo exacto de local."
    MIRROR_OUTPUT=$(git push "$TARGET_REMOTE" --mirror 2>&1) || {
        log_error "Fallo el push --mirror a '$TARGET_REMOTE'. Detalle:"
        printf "%s\n" "$MIRROR_OUTPUT" | while IFS= read -r line; do
            [ -n "$line" ] && printf "[ERROR] %s\n" "$line"
        done
        log_summary "FALLIDO" "push --mirror rechazado por el servidor"
        exit 1
    }
    printf "%s\n" "$MIRROR_OUTPUT" | while IFS= read -r line; do
        [ -n "$line" ] && printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    log_ok "Mirror completado: '$TARGET_REMOTE' es ahora espejo exacto de local."
fi

# ── 9. Restaurar como origin si el usuario lo pidio ───────────────────────────
if [ "$RESTORE_AS_ORIGIN" = true ]; then
    if [ "$TARGET_REMOTE" = "origin" ]; then
        log_info "El destino ya es 'origin'. Nada que restaurar."
    else
        CURRENT_ORIGIN_URL=$(git remote get-url origin 2>/dev/null || echo "")
        if [ -n "$CURRENT_ORIGIN_URL" ]; then
            log_info "Renombrando origin actual..."
            # Buscar un nombre libre para el origin actual
            BACKUP_NAME="gitlab-personal-bak"
            i=2
            while git remote get-url "$BACKUP_NAME" > /dev/null 2>&1; do
                BACKUP_NAME="gitlab-personal-bak-$i"
                i=$((i+1))
            done
            invoke_git "No se pudo renombrar origin a $BACKUP_NAME." remote rename origin "$BACKUP_NAME"
            log_ok "origin actual conservado como '$BACKUP_NAME'."
        fi
        invoke_git "No se pudo promover $TARGET_REMOTE a origin." remote rename "$TARGET_REMOTE" origin
        log_ok "'$TARGET_REMOTE' promovido a 'origin'. Los 19 scripts vuelven a trabajar contra el GitLab corporativo."
    fi
fi

# ── 10. Resumen final ─────────────────────────────────────────────────────────
BRANCH_COUNT=$(git for-each-ref --format='%(refname:short)' refs/heads | wc -l | tr -d ' ')
TAG_COUNT=$(git tag --list | wc -l | tr -d ' ')

if [ "$MODE" = "mirror" ]; then
    printf "\n${C_GREEN}  Mirror aplicado a '$TARGET_URL':${C_RESET}\n"
    printf "${C_GREEN}    $BRANCH_COUNT rama(s) + $TAG_COUNT tag(s) (espejo exacto de local)${C_RESET}\n"
    if [ -n "$REMOTE_ONLY_BRANCHES" ]; then
        FINAL_RB=$(printf "%s\n" "$REMOTE_ONLY_BRANCHES" | wc -l | tr -d ' ')
        printf "${C_YELLOW}    $FINAL_RB rama(s) borradas del destino${C_RESET}\n"
    fi
    if [ -n "$REMOTE_ONLY_TAGS" ]; then
        FINAL_RT=$(printf "%s\n" "$REMOTE_ONLY_TAGS" | wc -l | tr -d ' ')
        printf "${C_YELLOW}    $FINAL_RT tag(s) borrados del destino${C_RESET}\n"
    fi
    printf "\n"
else
    printf "\n${C_GREEN}  Trabajo devuelto a '$TARGET_URL':${C_RESET}\n"
    printf "${C_GREEN}    $BRANCH_COUNT rama(s) + $TAG_COUNT tag(s) enviadas (aditivo)${C_RESET}\n\n"
fi

printf "${C_CYAN}  Remotos finales:${C_RESET}\n"
git remote -v | while IFS= read -r line; do
    printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
done
printf "\n"

log_summary "COMPLETADO" "push-back a $TARGET_REMOTE (modo $MODE)"