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
    # TASK-118: el registro termina SIEMPRE con una linea FIN, tambien cuando
    # el script aborta con un exit intermedio. Ningun script que registra
    # pone su propio trap de EXIT.
    GF_RESULTADO=""
    trap '_gf_fin $?' EXIT
}

# _gf_fin: la linea FIN del registro (solo en el fichero, no en pantalla):
#   [fecha hora] [FIN  ] FIN: <operacion> | resultado: <R> | duracion: <N>s
# R es el de log_summary si el script salio 0 tras el resumen, ABORTADO si
# salio 0 sin resumen y "ERROR (codigo N)" si salio con otro codigo.
GF_RESULTADO=""
_gf_fin() {
    local codigo="$1" resultado fin duracion="?"
    if [ "$codigo" != "0" ]; then
        resultado="ERROR (codigo $codigo)"
    elif [ -n "$GF_RESULTADO" ]; then
        resultado="$GF_RESULTADO"
    else
        resultado="ABORTADO"
    fi
    if [ -n "$GF_START" ]; then
        _gf_epoch fin
        duracion="$((fin - GF_START))"
    fi
    _do_log "FIN  " "FIN: ${GF_OPERATION:-operacion} | resultado: $resultado | duracion: ${duracion}s"
    return 0
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
    GF_RESULTADO="$result"
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

# ── _gf_ls_remote ─────────────────────────────────────────────────────────────
# TASK-038: `git ls-remote` con dos protecciones que antes no tenia.
#   - GIT_TERMINAL_PROMPT=0: nunca se queda esperando credenciales (sin
#     terminal, o bajo taskctl con stdin ignorado, esperaria para siempre).
#   - Limite de GF_TIMEOUT_REMOTO segundos (5 por defecto): con la VPN caida
#     la consulta tardaba lo que tardase la red, del orden de 30 s.
# El limite usa el `timeout` de coreutils SOLO si responde a --version: en
# Windows tambien existe el timeout.exe de cmd, con otra sintaxis, y si el
# PATH lo encontrara primero la consulta fallaria siempre y todo iria en modo
# local sin decirlo. Sin coreutils (macOS), se consulta sin limite, como antes.
GF_TIMEOUT_REMOTO="${GF_TIMEOUT_REMOTO:-5}"
case "$GF_TIMEOUT_REMOTO" in
    ''|*[!0-9]*|0)
        printf "[WARN ] GF_TIMEOUT_REMOTO='%s' no es un numero de segundos mayor que 0; se usa 5.\n" "$GF_TIMEOUT_REMOTO" >&2
        GF_TIMEOUT_REMOTO=5 ;;
esac
if timeout --version > /dev/null 2>&1; then
    _gf_ls_remote() { GIT_TERMINAL_PROMPT=0 timeout "$GF_TIMEOUT_REMOTO" git ls-remote "$@"; }
else
    _gf_ls_remote() { GIT_TERMINAL_PROMPT=0 git ls-remote "$@"; }
fi

# ── resolve_main_branch ───────────────────────────────────────────────────────
resolve_main_branch() {
    local preferred="$1"
    [ -n "$preferred" ] && { printf "%s" "$preferred"; return 0; }

    # TASK-038: una sola consulta para main y master, y ninguna si ya se sabe
    # que origin no responde (o no esta configurado).
    if [ "$GF_ORIGIN_DETECTADO" != true ] || [ "$REMOTE_AVAILABLE" = true ]; then
        local heads
        heads=$(_gf_ls_remote --heads origin main master 2>/dev/null) || heads=""
        case "$heads" in *refs/heads/main*) printf "main"; return 0 ;; esac
        case "$heads" in *refs/heads/master*) printf "master"; return 0 ;; esac
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
#
# TASK-038: una sola consulta por invocacion (GF_ORIGIN_DETECTADO); sin
# origin configurado ni se consulta la red; y el aviso de "sin conexion" es
# parametrizable para que cada script conserve su texto. Antes habia 7 copias
# en linea de esta funcion.
REMOTE_AVAILABLE=false
REMOTE_CONFIGURED=false
GF_ORIGIN_DETECTADO=false
detect_origin_available() {
    local aviso="${1:-No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local.}"
    [ "$GF_ORIGIN_DETECTADO" = true ] && return 0
    GF_ORIGIN_DETECTADO=true
    if git remote get-url origin > /dev/null 2>&1; then
        REMOTE_CONFIGURED=true
    else
        REMOTE_CONFIGURED=false
    fi
    if [ "$REMOTE_CONFIGURED" = true ] && _gf_ls_remote --heads origin > /dev/null 2>&1; then
        REMOTE_AVAILABLE=true
        log_ok "Conexion remota disponible (origin)."
    else
        REMOTE_AVAILABLE=false
        log_warn "$aviso"
    fi
}

# ── _gf_fetch_origin ──────────────────────────────────────────────────────────
# TASK-143a (SCR-02): el fetch previo, una sola vez por invocacion. Antes lo
# hacian create-release, create-hotfix y los merge, pero no los update ni
# create-feature/fix. Sin origin disponible no hace nada.
GF_FETCH_HECHO=false
_gf_fetch_origin() {
    [ "$REMOTE_AVAILABLE" = true ] || return 0
    [ "$GF_FETCH_HECHO" = true ] && return 0
    invoke_git "No se pudo hacer fetch de origin." fetch origin
    GF_FETCH_HECHO=true
}

# ── _gf_sync_branch ───────────────────────────────────────────────────────────
# TASK-143a (SCR-02..05): cambia a <rama> (creandola desde origin/<rama> si no
# existe en local) y la pone al dia con pull --ff-only si hay origin. Era el
# bloque copiado en create, update, merge a develop, merge a main y backmerge;
# el backmerge no lo hacia (SCR-05). Espera detect_origin_available ya hecho.
_gf_sync_branch() {
    local branch="$1"
    if ! git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
        if [ "$REMOTE_AVAILABLE" = true ]; then
            invoke_git "No se pudo crear o cambiar a $branch desde origin/$branch." \
                checkout -q -b "$branch" "origin/$branch"
        else
            log_error "$branch no existe localmente y no hay conexion remota para crearla."
            exit 1
        fi
        log_ok "Switched to branch $branch (creada desde origin/$branch)"
    elif [ "$(git branch --show-current 2>/dev/null)" = "$branch" ]; then
        log_info "Ya estamos en $branch."
    else
        invoke_git "No se pudo cambiar a $branch." checkout -q "$branch"
        log_ok "Switched to branch $branch"
    fi

    if [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo actualizar $branch desde origin." \
            pull --ff-only --quiet origin "$branch"
        log_ok "Actualizamos $branch"
    else
        log_warn "Sincronizacion omitida para $branch: no hay conexion con origin."
    fi
}

# ── _gf_locate_branch ─────────────────────────────────────────────────────────
# TASK-143a (SCR-02, SCR-03): si <rama> existe en local y en origin, en
# GF_TARGET_LOCAL y GF_TARGET_REMOTE ("true"/"false").
GF_TARGET_LOCAL=false
GF_TARGET_REMOTE=false
_gf_locate_branch() {
    local name="$1"
    GF_TARGET_LOCAL=false; GF_TARGET_REMOTE=false
    git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null && GF_TARGET_LOCAL=true || true
    if [ "$REMOTE_AVAILABLE" = true ]; then
        _gf_ls_remote --heads origin "$name" 2>/dev/null | grep -q "refs/heads/$name" \
            && GF_TARGET_REMOTE=true || true
    fi
}

# ── invoke_create_work_branch ─────────────────────────────────────────────────
# Crea <rama> desde <base> (o cambia a ella si ya existe). TASK-143a (SCR-03):
# create-release y create-hotfix la usan en vez de su copia en linea, y gana
# el fetch previo que solo hacian ellos.
invoke_create_work_branch() {
    local name="$1" push="$2" base_branch="$3"

    detect_origin_available
    local remote_available="$REMOTE_AVAILABLE"

    _gf_fetch_origin
    _gf_sync_branch "$base_branch"

    _gf_locate_branch "$name"
    local target_local="$GF_TARGET_LOCAL" target_remote="$GF_TARGET_REMOTE"

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

# ── invoke_update_work_branch ─────────────────────────────────────────────────
# TASK-143a (SCR-02): el cuerpo de update-feature, update-fix, update-release
# y update-hotfix, antes copiado cuatro veces y sin fetch previo. Pone <base>
# al dia, cambia a <rama> (local o desde origin) y mergea la base con
# --no-ff; con <push>=true la sube. Espera detect_origin_available ya hecho
# (cada script conserva su aviso de "sin conexion").
invoke_update_work_branch() {
    local name="$1" push="$2" base_branch="$3" type="$4"

    _gf_fetch_origin
    _gf_sync_branch "$base_branch"

    _gf_locate_branch "$name"
    if [ "$GF_TARGET_LOCAL" = true ]; then
        invoke_git "No se pudo cambiar a $name." checkout -q "$name"
    elif [ "$GF_TARGET_REMOTE" = true ]; then
        invoke_git "No se pudo crear la rama local $name desde origin/$name." \
            checkout -q -b "$name" "origin/$name"
    else
        log_error "La rama $name no existe ni localmente ni en remoto."; exit 1
    fi
    log_ok "Switched to branch $name"

    invoke_git "No se pudo actualizar $name con cambios de $base_branch." \
        merge --no-ff "$base_branch" -m "update($type): $base_branch -> $name"
    log_ok "Update completado: $base_branch -> $name"

    if [ "$push" = true ] && [ "$REMOTE_AVAILABLE" = true ]; then
        invoke_git "No se pudo subir $name a origin." push origin "$name"
        log_ok "Push completado: $name"
    elif [ "$push" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
        log_warn "Push omitido para $name por falta de conexion remota."
    fi

    log_summary "COMPLETADO" "$base_branch integrado en $name"
}

# ── invoke_merge_to_main ──────────────────────────────────────────────────────
# TASK-143a (SCR-04, SCR-05): el cuerpo de merge-hotfix-to-main y
# merge-release-to-main, que eran identicos salvo ocho lineas. Mergea <rama>
# en la principal con tag y la devuelve a develop (backmerge). El backmerge
# pone develop al dia con pull --ff-only antes de mergear, como el merge a
# develop: antes mergeaba sobre la develop local y, si estaba atrasada, el
# push se rechazaba con la principal y el tag ya subidos.
# Uso: invoke_merge_to_main <rama> <tipo> <Etiqueta> <push> <main> <develop> <tag_visto> <tag>
invoke_merge_to_main() {
    local name="$1" type="$2" label="$3" push="$4" main_branch="$5" develop_branch="$6"
    local tag_seen="$7" tag_override="$8"

    # TASK-060: --tag sustituye el nombre que el script calcula (sigue habiendo
    # UN solo tag, el del merge a main). Se valida ANTES de tocar ninguna rama:
    # un nombre invalido, con "-" inicial (se leeria como opcion de git) o ya
    # usado abortaria despues del merge, con main ya movida.
    if [ "$tag_seen" = true ] && [ -z "$tag_override" ]; then
        log_error "--tag necesita un nombre (--tag v1.2.0). No se ha tocado nada."
        exit 1
    fi
    if [ -n "$tag_override" ]; then
        if [[ "$tag_override" == -* ]] || ! git check-ref-format "refs/tags/$tag_override" 2>/dev/null; then
            log_error "El nombre de tag '$tag_override' no es valido (git check-ref-format, y sin '-' inicial). No se ha tocado nada."
            exit 1
        fi
        if git show-ref --verify --quiet "refs/tags/$tag_override" 2>/dev/null; then
            log_error "El tag '$tag_override' ya existe. Elige otro nombre con --tag. No se ha tocado nada."
            exit 1
        fi
    fi

    ensure_workspace_ready \
        "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
        "chore: commit local antes de merge $type->main" || exit 0

    # TASK-038: antes de resolve_main_branch, para que este use la cache.
    detect_origin_available
    main_branch=$(resolve_main_branch "$main_branch")
    log_info "Rama principal detectada: $main_branch"

    # Hallazgo IMPORTANTE de revision por pares (B2): origin configurado pero
    # inaccesible NO es lo mismo que no tener origin. Con el remoto caido, la
    # rama principal local puede estar obsoleta y el tag de version se crearia
    # sobre historia divergente. Mejor abortar y que la persona decida.
    if [ "$REMOTE_CONFIGURED" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
        log_error "origin esta configurado pero no responde. Mergear a $main_branch sin sincronizar puede crear el tag sobre una $main_branch obsoleta. Revisa conexion/credenciales; si de verdad quieres operar sin remoto, ejecuta git remote remove origin y reintenta."
        exit 1
    fi

    _gf_fetch_origin

    # Hallazgo MENOR de revision por pares (B2): validar/recuperar la rama de
    # trabajo ANTES de tocar la rama principal, para que un nombre inexistente
    # falle dejando a la persona en su rama de partida.
    if ! git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null; then
        if [ "$REMOTE_AVAILABLE" = true ]; then
            invoke_git "No se pudo crear/cambiar a $name desde origin." checkout -b "$name" "origin/$name"
        else
            log_error "$name no existe localmente y no hay conexion remota para recuperarla."
            exit 1
        fi
    fi

    _gf_sync_branch "$main_branch"

    show_merge_diff "$name" "$main_branch" || exit 0

    local commit_count
    commit_count=$(git rev-list --count "$main_branch..$name" 2>/dev/null || echo "?")

    invoke_git "No se pudo hacer merge de $name en $main_branch." \
        merge --no-ff "$name" -m "merge($type): $name -> $main_branch"

    local tag_name="${name#"$type"/}"
    [[ "$tag_name" =~ ^[0-9] ]] && tag_name="v$tag_name"
    [ -n "$tag_override" ] && tag_name="$tag_override"
    invoke_git "No se pudo crear tag $tag_name en $main_branch." \
        tag -a "$tag_name" -m "$label $tag_name"
    log_ok "Tag creado: $tag_name"

    if [ "$push" = true ]; then
        if [ "$REMOTE_AVAILABLE" = true ]; then
            invoke_git "No se pudo subir $main_branch a origin." push origin "$main_branch"
            invoke_git "No se pudo subir tag $tag_name a origin." push origin "$tag_name"
            log_ok "Push completado: $main_branch y tag $tag_name"
        else
            log_warn "Push omitido: no hay conexion con origin."
        fi
    fi

    log_info "Preparando backmerge: $name -> $develop_branch..."
    _gf_sync_branch "$develop_branch"

    if ! show_merge_diff "$name" "$develop_branch"; then
        log_warn "Backmerge cancelado. $main_branch y tag $tag_name ya estan actualizados."
        log_summary "PARCIAL" "merge a $main_branch OK | backmerge a $develop_branch cancelado"
        exit 0
    fi

    invoke_git "No se pudo hacer merge de $name en $develop_branch." \
        merge --no-ff "$name" -m "merge($type): $name -> $develop_branch (backmerge)"
    log_ok "Merge back completado: $name -> $develop_branch"

    if [ "$push" = true ]; then
        if [ "$REMOTE_AVAILABLE" = true ]; then
            invoke_git "No se pudo subir $develop_branch a origin." push origin "$develop_branch"
            log_ok "Push completado: $develop_branch"
        else
            log_warn "Push omitido: no hay conexion con origin."
        fi
    fi

    log_summary "COMPLETADO" "${commit_count} commit(s) | tag $tag_name | backmerge a $develop_branch"
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

    # TASK-038: origin configurado pero caido avisa, no aborta. En los merge a
    # main si se aborta, porque el tag se crearia sobre una main obsoleta; en
    # develop no hay tag, y abortar bloquearia cualquier cierre con la VPN
    # caida. Lo que hay que decir es que develop puede estar desfasada.
    if [ "$REMOTE_CONFIGURED" = true ] && [ "$remote_available" = false ]; then
        log_warn "origin esta configurado pero no responde: el merge se hace sobre la $develop_branch LOCAL, que puede estar desfasada. Cuando vuelva la red, sincroniza (pull) y sube $develop_branch antes de seguir."
    fi

    _gf_fetch_origin
    _gf_sync_branch "$develop_branch"

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
# Si tiene ramas, pide confirmación explícita para seguir. TASK-142 (SCR-11):
# el aviso ya no promete sobreescribir; el envío es sin --force, así que una
# rama que diverja se rechaza y el envío se detiene.
# Devuelve 1 si el usuario cancela.
ensure_remote_empty() {
    local name="$1"
    local heads
    heads=$(_gf_ls_remote --heads "$name" 2>/dev/null) || {
        log_error "No se pudo consultar el remoto '$name'. Verifica conexion y credenciales."
        return 1
    }
    if [ -z "$heads" ]; then
        log_ok "Remoto '$name' esta vacio. Seguro para mirror inicial."
        return 0
    fi
    log_warn "Remoto '$name' YA TIENE ramas. El envio no las sobreescribe (no se sobreescribe nada sin --force): las que diverjan se rechazaran y el envio se detendra."
    printf "\n${C_YELLOW}  Ramas actuales en '$name':${C_RESET}\n"
    printf "%s\n" "$heads" | sed 's|.*refs/heads/||' | while IFS= read -r line; do
        printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    printf "\n"
    local answer
    read -rp "  Continuar igualmente con el envio a '$name'? [s/N]: " answer
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
        log_warn "Detectado Git LFS en .gitattributes. Un push de Git (con --all o con --mirror) NO migra blobs LFS."
        log_warn "Tras migrar, ejecuta manualmente: git lfs fetch --all && git lfs push <destino> --all"
    fi

    if [ -f "$repo_root/.gitmodules" ]; then
        log_warn "Detectado .gitmodules. Los submodules apuntan a URLs del remoto actual."
        log_warn "Si migras el repo padre, revisa si los submodules siguen siendo accesibles."
    fi
}