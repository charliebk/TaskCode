#!/usr/bin/env bash
# Funciones compartidas de Git-Flow

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GF_LOG_FILE=""
GF_START=""
GF_OPERATION=""

# ── Colores ANSI ──────────────────────────────────────────────────────────────
C_GREEN="\033[32m"; C_YELLOW="\033[33m"; C_RED="\033[31m"
C_CYAN="\033[36m";  C_WHITE="\033[97m";  C_DGRAY="\033[90m"; C_RESET="\033[0m"

# ── Hora sin lanzar procesos (TASK-037) ──────────────────────────────────────
# Cada `$(date ...)` es un proceso: en Windows ~0,1-0,15 s, y el log lanzaba
# uno por linea (mas un subshell). Con bash >= 4.2, `printf -v` con el
# formato `%(...)T` da la hora sin salir del shell. Con bash anterior (el
# /bin/bash 3.2 de macOS) se cae a `date`, que es lo de siempre.
# GF_FORZAR_DATE=1 fuerza la caida (solo para probarla).
if [ -z "${GF_FORZAR_DATE:-}" ] && { [ "${BASH_VERSINFO[0]:-0}" -gt 4 ] || \
     { [ "${BASH_VERSINFO[0]:-0}" -eq 4 ] && [ "${BASH_VERSINFO[1]:-0}" -ge 2 ]; }; }; then
    _gf_hora()  { printf -v "$1" "%($2)T" -1; }
    _gf_epoch() { if [ -n "${EPOCHSECONDS:-}" ]; then printf -v "$1" '%s' "$EPOCHSECONDS"; else printf -v "$1" '%(%s)T' -1; fi; }
else
    _gf_hora()  { printf -v "$1" '%s' "$(date +"$2")"; }
    _gf_epoch() { printf -v "$1" '%s' "$(date +%s)"; }
fi

# ── Logging ───────────────────────────────────────────────────────────────────
initialize_gitflow_log() {
    GF_OPERATION="$1"
    _gf_epoch GF_START
    # Ajuste TASK-008 (hallazgo 1 de TASK-007): antes la ruta se calculaba
    # contando niveles de carpeta desde el script (valido solo en la
    # ubicacion original .idea/runConfigurations/local_git-flow-actions/).
    # Al vivir ahora dentro del plugin instalado, se le pregunta a Git por
    # el repo del USUARIO en vez de deducirlo de la ruta del script.
    # Hallazgo menor de revision por pares (TASK-008): si no hay repo Git
    # en absoluto en el cwd, no se escribe log a fichero (GF_LOG_FILE
    # vacio) en vez de crear el directorio del registro como basura fuera
    # de cualquier repo — el resto de funciones de log ya toleran
    # GF_LOG_FILE vacio. Esa salvaguarda se conserva: aqui la da el
    # propio `git rev-parse`, que sale 128 y deja log_dir vacio.
    #
    # Ajuste TASK-029 (item C6): el registro deja de escribirse en
    # <repo>/logs/gitflow/ y pasa a vivir dentro de .git/. El sitio
    # anterior ensuciaba el arbol de trabajo del usuario nada mas
    # arrancar cualquiera de los 24 scripts, ANTES de que el script
    # mirase el workspace: por eso pause-work.sh acababa preguntando
    # que hacer con un directorio que acababa de crear el mismo, y por
    # eso `taskctl resume` era inservible en un repo que no ignorase
    # logs/ (abortaba con "El workspace no esta limpio" y remitia a un
    # `pause` que tambien habria abortado). Razones de ESTA ruta:
    #
    #   - .git/ no forma parte del arbol de trabajo, asi que
    #     `git status` no lo ve NUNCA, con .gitignore o sin el. La
    #     clase entera de problema desaparece en vez de taparse con un
    #     patron en el .gitignore de cada repo del usuario.
    #   - Se usa `--git-path` y NO se concatena sobre `--git-dir`: asi
    #     sigue valiendo dentro de un worktree enlazado, donde el
    #     directorio propio del worktree cuelga de
    #     .git/worktrees/<nombre>/ y no del .git principal. Es el mismo
    #     criterio que usa `operacionEnCurso` en src/fs/git.ts, por el
    #     mismo motivo.
    #   - El registro sigue siendo por repo y auditable, que era lo que
    #     se buscaba al meterlo dentro del repo.
    #
    # `--git-path` devuelve una ruta relativa al cwd (p. ej.
    # ".git/taskcode/gitflow" desde la raiz), asi que se absolutiza tras
    # crearla para que GF_LOG_FILE siga siendo valido pase lo que pase.
    local log_dir=""
    log_dir="$(git rev-parse --git-path taskcode/gitflow 2>/dev/null)" || log_dir=""
    if [ -n "$log_dir" ] && mkdir -p "$log_dir" 2>/dev/null; then
        log_dir="$(cd "$log_dir" && pwd)"
    else
        log_dir=""
    fi
    if [ -n "$log_dir" ]; then
        local hoy
        _gf_hora hoy '%Y-%m-%d'
        GF_LOG_FILE="$log_dir/gitflow-$hoy.log"
        local sep
        sep=$(printf '=%.0s' {1..60})
        { printf "\n"; printf "%s\n" "$sep"; } >> "$GF_LOG_FILE"
    fi
    _do_log "INFO " "INICIO: $GF_OPERATION"
}

# _do_log: escribe la linea en el fichero de log y la deja en GF_LINE.
# TASK-037: antes la devolvia por stdout y cada log_* la recogia con un
# `$(_do_log ...)`, es decir, un subshell por linea. Ningun otro script la
# llama: la interfaz publica son los log_* de abajo, que no cambian.
GF_LINE=""
_do_log() {
    local level="$1" message="$2" ts
    _gf_hora ts '%Y-%m-%d %H:%M:%S'
    GF_LINE="[$ts] [$level] $message"
    [ -n "$GF_LOG_FILE" ] && printf "%s\n" "$GF_LINE" >> "$GF_LOG_FILE"
    return 0
}

log_info()  { _do_log "INFO " "$1"; printf "%s\n"                     "$GF_LINE"; }
log_ok()    { _do_log "OK   " "$1"; printf "${C_GREEN}%s${C_RESET}\n"  "$GF_LINE"; }
log_warn()  { _do_log "WARN " "$1"; printf "${C_YELLOW}%s${C_RESET}\n" "$GF_LINE"; }
log_error() { _do_log "ERROR" "$1"; printf "${C_RED}%s${C_RESET}\n"    "$GF_LINE"; }

log_summary() {
    local result="${1:-COMPLETADO}" extra="${2:-}" elapsed="?" icon="[OK]"
    if [ -n "$GF_START" ]; then
        local end
        _gf_epoch end
        elapsed="$((end - GF_START))s"
    fi
    local op="${GF_OPERATION:-operacion}"
    [ "$result" != "COMPLETADO" ] && icon="[!!]"
    local bar
    bar=$(printf '=%.0s' {1..52})
    local color="$C_CYAN"
    [ "$result" != "COMPLETADO" ] && color="$C_YELLOW"

    printf "\n"
    printf "${color}%s${C_RESET}\n"                              "$bar"
    printf "${color}  %s  OPERACION : %s${C_RESET}\n"           "$icon" "$op"
    printf "${color}       RESULTADO : %s${C_RESET}\n"           "$result"
    printf "${color}       DURACION  : %s${C_RESET}\n"           "$elapsed"
    [ -n "$extra" ] && printf "${color}       DETALLE   : %s${C_RESET}\n" "$extra"
    printf "${color}%s${C_RESET}\n"                              "$bar"
    printf "\n"

    if [ -n "$GF_LOG_FILE" ]; then
        {
            printf "%s\n" "$bar"
            printf "  %s  OPERACION : %s\n" "$icon" "$op"
            printf "       RESULTADO : %s\n" "$result"
            printf "       DURACION  : %s\n" "$elapsed"
            [ -n "$extra" ] && printf "       DETALLE   : %s\n" "$extra"
            printf "%s\n\n" "$bar"
        } >> "$GF_LOG_FILE"
    fi
}

# ── show_merge_diff ───────────────────────────────────────────────────────────
show_merge_diff() {
    local source="$1" target="$2"
    local sep
    sep=$(printf -- '-%.0s' {1..50})

    printf "\n"
    printf "${C_CYAN}  Vista previa de cambios a mergear:${C_RESET}\n"
    printf "${C_CYAN}  %s${C_RESET}\n" "$sep"
    printf "${C_CYAN}  %s  -->  %s${C_RESET}\n" "$source" "$target"
    printf "${C_CYAN}  %s${C_RESET}\n" "$sep"

    local commits
    commits=$(git log --oneline "$target..$source" 2>/dev/null || true)
    if [ -n "$commits" ]; then
        printf "\n${C_WHITE}  Commits que se van a integrar:${C_RESET}\n"
        while IFS= read -r line; do
            printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
        done <<< "$commits"
        [ -n "$GF_LOG_FILE" ] && printf "  Commits: %s\n" "$commits" >> "$GF_LOG_FILE"
    else
        printf "${C_DGRAY}  (no hay commits nuevos en %s respecto a %s)${C_RESET}\n" "$source" "$target"
    fi

    local stat
    stat=$(git diff --stat "$target..$source" 2>/dev/null || true)
    printf "\n${C_WHITE}  Ficheros afectados:${C_RESET}\n"
    if [ -n "$stat" ]; then
        while IFS= read -r line; do
            printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
        done <<< "$stat"
        [ -n "$GF_LOG_FILE" ] && printf "%s\n" "$stat" >> "$GF_LOG_FILE"
    else
        printf "${C_DGRAY}  (sin diferencias de ficheros)${C_RESET}\n"
    fi

    printf "\n"
    local answer
    read -rp "  Continuar con el merge? [S/n]: " answer
    if [[ "${answer,,}" =~ ^n(o)?$ ]]; then
        printf "${C_YELLOW}[END] Merge cancelado por usuario.${C_RESET}\n"
        [ -n "$GF_LOG_FILE" ] && printf "  >> Merge cancelado por usuario.\n" >> "$GF_LOG_FILE"
        return 1
    fi
    return 0
}

# ── invoke_git ────────────────────────────────────────────────────────────────
# Uso: invoke_git "mensaje de error" git-args...
GIT_OUTPUT=""
invoke_git() {
    local step="$1"
    shift
    GIT_OUTPUT=$(git "$@" 2>&1) || {
        local exit_code=$?
        [ -n "$step" ] && log_error "$step"
        while IFS= read -r line; do
            [ -n "$line" ] && printf "[ERROR] %s\n" "$line"
        done <<< "$GIT_OUTPUT"
        if printf "%s" "$GIT_OUTPUT" | grep -q "would be overwritten by checkout" 2>/dev/null; then
            log_error "No se pudo cambiar de rama: hay cambios locales en conflicto. Haz commit o stash."
        fi
        if printf "%s" "$GIT_OUTPUT" | grep -q "would be overwritten by merge" 2>/dev/null; then
            log_error "No se pudo actualizar la rama: hay cambios locales en conflicto. Haz commit o stash."
        fi
        exit 1
    }
}

# ── ensure_workspace_ready ────────────────────────────────────────────────────
# Devuelve 1 (false) si el usuario cancela, para que el caller haga: ensure_workspace_ready || exit 0
ensure_workspace_ready() {
    local commit_question="${1:-Workspace no limpio. Hacer commit local en la rama actual? Si/No}"
    local default_message="${2:-chore: commit local antes de ejecutar GitFlow}"

    local status
    status=$(git status --porcelain 2>&1) || { log_error "No se pudo leer git status"; exit 1; }
    [ -z "$status" ] && return 0

    local answer
    read -rp "$commit_question: " answer
    if ! [[ "${answer,,}" =~ ^(s|si|y|yes)$ ]]; then
        printf "[END] Operacion cancelada por usuario.\n"
        return 1
    fi

    local message
    read -rp "Mensaje de commit local (Enter para usar default): " message
    [ -z "$message" ] && message="$default_message"

    git add -A || { log_error "No se pudieron preparar los cambios para commit local."; exit 1; }

    GIT_OUTPUT=$(git commit -m "$message" 2>&1) || {
        while IFS= read -r line; do [ -n "$line" ] && printf "[ERROR] %s\n" "$line"; done <<< "$GIT_OUTPUT"
        log_error "No se pudo crear el commit local en la rama actual."
        exit 1
    }

    log_ok "Commit local creado en la rama actual."
    return 0
}

# ── resolve_main_branch ───────────────────────────────────────────────────────
resolve_main_branch() {
    local preferred="$1"
    [ -n "$preferred" ] && { printf "%s" "$preferred"; return 0; }

    if git ls-remote --heads origin main 2>/dev/null | grep -q "refs/heads/main"; then
        printf "main"; return 0
    fi
    if git ls-remote --heads origin master 2>/dev/null | grep -q "refs/heads/master"; then
        printf "master"; return 0
    fi
    if git show-ref --verify --quiet "refs/heads/main" 2>/dev/null; then
        printf "main"; return 0
    fi
    if git show-ref --verify --quiet "refs/heads/master" 2>/dev/null; then
        printf "master"; return 0
    fi
    printf "master"
}

# ── assert_valid_branch_name ──────────────────────────────────────────────────
assert_valid_branch_name() {
    local branch_name="$1" example_name="$2"
    if [ -z "$branch_name" ]; then
        log_error "El nombre de la rama no puede estar vacio. Ejemplo valido: $example_name"
        exit 1
    fi
    if ! git check-ref-format --branch "$branch_name" > /dev/null 2>&1; then
        log_error "Nombre de rama invalido: '$branch_name'. No uses espacios ni caracteres especiales. Ejemplo: $example_name"
        exit 1
    fi
}

# ── detect_origin_available ───────────────────────────────────────────────────
# Ajuste B2 (mismo guard que introdujo TASK-008 en
# invoke_merge_work_branch_to_develop): la deteccion de origin estaba
# duplicada inline en dos funciones y faltaba en los scripts
# merge-*-to-main.sh, que fallaban duro (exit 1) en un repo sin origin.
# Resultado en las variables globales REMOTE_AVAILABLE y REMOTE_CONFIGURED
# ("true"/"false"). La distincion importa (hallazgo IMPORTANTE de la
# revision por pares de B2): "sin origin configurado" habilita el modo
# local con seguridad, pero "origin configurado e inaccesible" puede ser
# una VPN/red caida con la main local obsoleta respecto al remoto.
REMOTE_AVAILABLE=false
REMOTE_CONFIGURED=false
detect_origin_available() {
    if git remote get-url origin > /dev/null 2>&1; then
        REMOTE_CONFIGURED=true
    else
        REMOTE_CONFIGURED=false
    fi
    if git ls-remote --heads origin > /dev/null 2>&1; then
        REMOTE_AVAILABLE=true
        log_ok "Conexion remota disponible (origin)."
    else
        REMOTE_AVAILABLE=false
        log_warn "No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local."
    fi
}

# ── invoke_create_work_branch ─────────────────────────────────────────────────
invoke_create_work_branch() {
    local name="$1" push="$2" base_branch="$3"

    detect_origin_available
    local remote_available="$REMOTE_AVAILABLE"

    local current_branch
    current_branch=$(git branch --show-current 2>&1)

    if [ "$current_branch" != "$base_branch" ]; then
        log_info "Rama actual: $current_branch. Cambiando a $base_branch..."
        if ! git show-ref --verify --quiet "refs/heads/$base_branch" 2>/dev/null; then
            if [ "$remote_available" = true ]; then
                invoke_git "No se pudo crear o cambiar a $base_branch desde origin/$base_branch." \
                    checkout -q -b "$base_branch" "origin/$base_branch"
            else
                log_error "$base_branch no existe localmente y no hay conexion remota para crearla."
                exit 1
            fi
        else
            invoke_git "No se pudo cambiar a $base_branch." checkout -q "$base_branch"
        fi
        log_ok "Switched to branch $base_branch"
    else
        log_info "Ya estamos en $base_branch."
    fi

    if [ "$remote_available" = true ]; then
        invoke_git "No se pudo actualizar $base_branch desde origin." \
            pull --ff-only --quiet origin "$base_branch"
        log_ok "Actualizamos $base_branch"
    else
        log_warn "Sincronizacion omitida: no hay conexion con origin."
    fi

    local target_local=false target_remote=false
    git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null && target_local=true || true
    if [ "$remote_available" = true ]; then
        git ls-remote --heads origin "$name" 2>/dev/null | grep -q "refs/heads/$name" \
            && target_remote=true || true
    fi

    if [ "$target_local" = true ]; then
        log_info "La rama $name ya existe localmente. Cambiando a ella..."
        invoke_git "No se pudo cambiar a $name." checkout -q "$name"
        log_ok "Switched to branch $name"
        if [ "$push" = true ] && [ "$remote_available" = true ]; then
            if [ "$target_remote" = true ]; then
                log_ok "La rama $name ya existe en origin. No se vuelve a subir."
            else
                invoke_git "No se pudo subir $name a origin." push -u origin "$name"
                log_ok "Rama $name subida a origin."
            fi
        fi
    elif [ "$target_remote" = true ]; then
        log_info "La rama $name existe en origin pero no localmente. Creandola localmente..."
        invoke_git "No se pudo crear la rama local $name desde origin/$name." \
            checkout -q -b "$name" "origin/$name"
        log_ok "Switched to branch $name"
        [ "$push" = true ] && log_ok "La rama $name ya existe en origin. No se vuelve a subir."
    else
        log_info "La rama $name no existe. Creandola desde $base_branch..."
        invoke_git "No se pudo crear $name desde $base_branch." checkout -q -b "$name" "$base_branch"
        log_ok "Rama $name creada desde $base_branch"
        if [ "$push" = true ] && [ "$remote_available" = true ]; then
            invoke_git "No se pudo subir $name a origin." push -u origin "$name"
            log_ok "Rama $name subida a origin."
        elif [ "$push" = true ] && [ "$remote_available" = false ]; then
            log_warn "Rama $name creada solo localmente (sin conexion remota)."
        fi
    fi

    invoke_git "No se pudo cambiar a $name al finalizar." checkout -q "$name"
    log_ok "Rama activa final: $name"
}

# ── invoke_merge_work_branch_to_develop ───────────────────────────────────────
invoke_merge_work_branch_to_develop() {
    local name="$1" push="$2" develop_branch="$3" type="$4"

    # Ajuste TASK-008 (hallazgo 4 de TASK-007): antes se hacia "fetch origin"
    # sin comprobar disponibilidad, y fallaba duro (exit 1) en cualquier
    # repo sin origin configurado. Mismo guard que ya usa
    # invoke_create_work_branch, para que un merge en modo local siga
    # siendo posible.
    detect_origin_available
    local remote_available="$REMOTE_AVAILABLE"

    if [ "$remote_available" = true ]; then
        invoke_git "No se pudo hacer fetch de origin." fetch origin
    fi

    if ! git show-ref --verify --quiet "refs/heads/$develop_branch" 2>/dev/null; then
        if [ "$remote_available" = true ]; then
            invoke_git "No se pudo crear/cambiar a $develop_branch desde origin." \
                checkout -b "$develop_branch" "origin/$develop_branch"
        else
            log_error "$develop_branch no existe localmente y no hay conexion remota para crearla."
            exit 1
        fi
    else
        invoke_git "No se pudo cambiar a $develop_branch." checkout "$develop_branch"
    fi

    if [ "$remote_available" = true ]; then
        invoke_git "No se pudo actualizar $develop_branch desde origin." \
            pull --ff-only origin "$develop_branch"
    else
        log_warn "Sincronizacion omitida: no hay conexion con origin."
    fi

    if ! git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null; then
        if [ "$remote_available" = true ]; then
            invoke_git "No se pudo crear/cambiar a $name desde origin." \
                checkout -b "$name" "origin/$name"
        else
            log_error "$name no existe localmente y no hay conexion remota para recuperarla."
            exit 1
        fi
    fi

    invoke_git "No se pudo volver a $develop_branch para merge." checkout "$develop_branch"

    show_merge_diff "$name" "$develop_branch" || exit 0

    local commit_count
    commit_count=$(git rev-list --count "$develop_branch..$name" 2>/dev/null || echo "?")

    invoke_git "No se pudo hacer merge de $name en $develop_branch." \
        merge --no-ff "$name" -m "merge($type): $name -> $develop_branch"

    if [ "$push" = true ]; then
        if [ "$remote_available" = true ]; then
            invoke_git "No se pudo subir $develop_branch a origin." push origin "$develop_branch"
            log_ok "Push completado: $develop_branch"
        else
            log_warn "Push omitido: no hay conexion con origin."
        fi
    fi

    log_ok "Merge completado: $name -> $develop_branch"
    log_summary "COMPLETADO" "${commit_count} commit(s) integrados en $develop_branch"
}

# ── ensure_remote_exists ──────────────────────────────────────────────────────
# Crea el remoto si no existe, o actualiza su URL si ya existe.
# Uso: ensure_remote_exists <nombre> <url>
ensure_remote_exists() {
    local name="$1" url="$2"
    if [ -z "$name" ] || [ -z "$url" ]; then
        log_error "ensure_remote_exists requiere <nombre> <url>."
        return 1
    fi
    if git remote get-url "$name" > /dev/null 2>&1; then
        local current_url
        current_url=$(git remote get-url "$name")
        if [ "$current_url" != "$url" ]; then
            invoke_git "No se pudo actualizar la URL del remoto $name." \
                remote set-url "$name" "$url"
            log_ok "Remoto '$name' actualizado: $url"
        else
            log_info "Remoto '$name' ya configurado: $url"
        fi
    else
        invoke_git "No se pudo crear el remoto $name." remote add "$name" "$url"
        log_ok "Remoto '$name' creado: $url"
    fi
    return 0
}

# ── ensure_remote_empty ───────────────────────────────────────────────────────
# Verifica que el remoto no tiene ramas (repo vacío en destino).
# Si tiene ramas, pide confirmación explícita para sobreescribir.
# Devuelve 1 si el usuario cancela.
ensure_remote_empty() {
    local name="$1"
    local heads
    heads=$(git ls-remote --heads "$name" 2>/dev/null) || {
        log_error "No se pudo consultar el remoto '$name'. Verifica conexion y credenciales."
        return 1
    }
    if [ -z "$heads" ]; then
        log_ok "Remoto '$name' esta vacio. Seguro para mirror inicial."
        return 0
    fi
    log_warn "Remoto '$name' YA TIENE ramas. Un push --mirror las sobreescribira."
    printf "\n${C_YELLOW}  Ramas actuales en '$name':${C_RESET}\n"
    printf "%s\n" "$heads" | sed 's|.*refs/heads/||' | while IFS= read -r line; do
        printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    printf "\n"
    local answer
    read -rp "  Sobreescribir TODAS las ramas de '$name' con las de origin? [s/N]: " answer
    if ! [[ "${answer,,}" =~ ^(s|si|y|yes)$ ]]; then
        printf "${C_YELLOW}[END] Operacion cancelada por usuario.${C_RESET}\n"
        return 1
    fi
    return 0
}

# ── show_remote_summary ───────────────────────────────────────────────────────
# Muestra resumen de lo que se va a enviar: ramas, tags, último commit.
# Uso: show_remote_summary <remoto-destino>
show_remote_summary() {
    local target="$1"
    local sep
    sep=$(printf -- '-%.0s' {1..50})

    printf "\n"
    printf "${C_CYAN}  Resumen de lo que se enviara a '$target':${C_RESET}\n"
    printf "${C_CYAN}  %s${C_RESET}\n" "$sep"

    local branch_count tag_count last_commit
    branch_count=$(git for-each-ref --format='%(refname:short)' refs/heads | wc -l | tr -d ' ')
    tag_count=$(git tag --list | wc -l | tr -d ' ')
    last_commit=$(git log -1 --oneline 2>/dev/null || echo "(sin commits)")

    printf "  %-20s %s\n" "Ramas locales:"   "$branch_count"
    printf "  %-20s %s\n" "Tags:"            "$tag_count"
    printf "  %-20s %s\n" "Ultimo commit:"   "$last_commit"

    printf "\n${C_WHITE}  Ramas que se enviaran:${C_RESET}\n"
    git for-each-ref --format='    %(refname:short)' refs/heads | while IFS= read -r line; do
        printf "${C_DGRAY}%s${C_RESET}\n" "$line"
    done

    if [ "$tag_count" -gt 0 ]; then
        printf "\n${C_WHITE}  Tags (primeros 10):${C_RESET}\n"
        git tag --list | head -10 | while IFS= read -r line; do
            printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
        done
        [ "$tag_count" -gt 10 ] && printf "${C_DGRAY}    ... y %d mas${C_RESET}\n" "$((tag_count - 10))"
    fi

    printf "\n"
    local answer
    read -rp "  Continuar con el envio a '$target'? [S/n]: " answer
    if [[ "${answer,,}" =~ ^n(o)?$ ]]; then
        printf "${C_YELLOW}[END] Envio cancelado por usuario.${C_RESET}\n"
        return 1
    fi
    return 0
}

# ── prompt_destination_url ────────────────────────────────────────────────────
# Pide URL al usuario y valida formato basico HTTPS/SSH.
# Resultado en variable global DEST_URL.
DEST_URL=""
prompt_destination_url() {
    local prompt_text="${1:-URL del repositorio destino}"
    local url
    while true; do
        printf "\n"
        read -rp "  $prompt_text: " url
        if [ -z "$url" ]; then
            log_warn "URL vacia. Reintenta o pulsa Ctrl-C para abortar."
            continue
        fi
        if [[ "$url" =~ ^(https://|git@) ]]; then
            DEST_URL="$url"
            return 0
        else
            log_warn "URL invalida. Debe empezar por 'https://' o 'git@'. Reintenta."
        fi
    done
}

# ── warn_lfs_and_submodules ───────────────────────────────────────────────────
# Avisa al usuario si el repo tiene LFS o submodules antes de migrar.
warn_lfs_and_submodules() {
    local repo_root
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || return 0

    if grep -rq "filter=lfs" "$repo_root/.gitattributes" 2>/dev/null; then
        log_warn "Detectado Git LFS en .gitattributes. push --mirror NO migra blobs LFS."
        log_warn "Tras migrar, ejecuta manualmente: git lfs fetch --all && git lfs push <destino> --all"
    fi

    if [ -f "$repo_root/.gitmodules" ]; then
        log_warn "Detectado .gitmodules. Los submodules apuntan a URLs del remoto actual."
        log_warn "Si migras el repo padre, revisa si los submodules siguen siendo accesibles."
    fi
}