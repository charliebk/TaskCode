#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "abort-merge"

git_dir=$(git rev-parse --git-dir 2>/dev/null) || { log_error "No estás en un repositorio git."; exit 1; }
current=$(git branch --show-current 2>/dev/null || echo "(detached HEAD)")

# ── Detectar operación en curso ───────────────────────────────────────────────
merge_in_progress=false
rebase_in_progress=false
cherry_pick_in_progress=false
revert_in_progress=false
[ -f "$git_dir/MERGE_HEAD" ]                                            && merge_in_progress=true
{ [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; } && rebase_in_progress=true
[ -f "$git_dir/CHERRY_PICK_HEAD" ]                                      && cherry_pick_in_progress=true
[ -f "$git_dir/REVERT_HEAD" ]                                           && revert_in_progress=true

# Una secuencia multi-commit puede quedar a medias SIN ninguno de los dos
# testigos de arriba: si se resuelve el conflicto y se hace "git commit" a
# mano en vez de "--continue", Git borra CHERRY_PICK_HEAD pero deja
# .git/sequencer con los commits que faltan, y "--abort" sigue funcionando
# (medido en git 2.55). El testigo ahí es el directorio; la primera línea
# de su "todo" ("pick ..." / "revert ...") dice cuál de las dos es.
if ! $cherry_pick_in_progress && ! $revert_in_progress && [ -d "$git_dir/sequencer" ]; then
    if grep -qE '^revert ' "$git_dir/sequencer/todo" 2>/dev/null; then
        revert_in_progress=true
    else
        cherry_pick_in_progress=true
    fi
fi

if ! $merge_in_progress && ! $rebase_in_progress \
   && ! $cherry_pick_in_progress && ! $revert_in_progress; then
    log_info "No hay ningún merge, rebase, cherry-pick ni revert en curso en la rama '$current'."
    printf "${C_DGRAY}  El workspace está en estado normal.${C_RESET}\n\n"
    log_summary "INFO" "Sin operaciones que abortar"
    exit 0
fi

# ── Merge en curso ────────────────────────────────────────────────────────────
if $merge_in_progress; then
    merge_head=$(cat "$git_dir/MERGE_HEAD" 2>/dev/null || echo "desconocido")
    merge_head_short="${merge_head:0:8}"

    printf "\n${C_YELLOW}  Merge en curso detectado:${C_RESET}\n"
    printf "${C_DGRAY}    Rama actual     : %s${C_RESET}\n" "$current"
    printf "${C_DGRAY}    Commit entrante : %s${C_RESET}\n" "$merge_head_short"

    conflicts=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
    if [ -n "$conflicts" ]; then
        printf "\n${C_RED}  Archivos en conflicto:${C_RESET}\n"
        while IFS= read -r line; do
            printf "${C_RED}    ✗ %s${C_RESET}\n" "$line"
        done <<< "$conflicts"
    fi

    printf "\n"
    read -rp "  ¿Abortar el merge y restaurar el estado anterior? [s/N]: " answer
    if ! [[ "${answer,,}" =~ ^s ]]; then
        log_info "Operación cancelada. El merge sigue en curso."
        exit 0
    fi

    invoke_git "No se pudo abortar el merge." merge --abort
    log_ok "Merge abortado. Workspace restaurado al estado previo al merge."
    log_summary "COMPLETADO" "Merge abortado en rama $current"
    exit 0
fi

# ── Rebase en curso ───────────────────────────────────────────────────────────
if $rebase_in_progress; then
    printf "\n${C_YELLOW}  Rebase en curso detectado en rama: %s${C_RESET}\n\n" "$current"
    read -rp "  ¿Abortar el rebase y restaurar el estado anterior? [s/N]: " answer
    if ! [[ "${answer,,}" =~ ^s ]]; then
        log_info "Operación cancelada. El rebase sigue en curso."
        exit 0
    fi

    invoke_git "No se pudo abortar el rebase." rebase --abort
    log_ok "Rebase abortado. Workspace restaurado al estado previo al rebase."
    log_summary "COMPLETADO" "Rebase abortado en rama $current"
    exit 0
fi

# ── Cherry-pick o revert en curso ─────────────────────────────────────────────
# Los dos son la misma maquinaria de Git (el sequencer): se detectan igual, se
# abortan igual y de hecho "git revert --abort" aborta un cherry-pick y
# viceversa. De ahí que compartan bloque en vez de duplicarlo.
if $cherry_pick_in_progress || $revert_in_progress; then
    if $cherry_pick_in_progress; then
        operacion="cherry-pick"
        head_file="$git_dir/CHERRY_PICK_HEAD"
    else
        operacion="revert"
        head_file="$git_dir/REVERT_HEAD"
    fi

    printf "\n${C_YELLOW}  ${operacion^} en curso detectado:${C_RESET}\n"
    printf "${C_DGRAY}    Rama actual     : %s${C_RESET}\n" "$current"
    if [ -f "$head_file" ]; then
        seq_head=$(cat "$head_file" 2>/dev/null || echo "desconocido")
        printf "${C_DGRAY}    Commit entrante : %s${C_RESET}\n" "${seq_head:0:8}"
    else
        # Detectado solo por el sequencer: no hay un commit "en curso",
        # quedan commits sin aplicar en la cola.
        pendientes=$(grep -cE '^(pick|revert) ' "$git_dir/sequencer/todo" 2>/dev/null || true)
        printf "${C_DGRAY}    Commits pendientes en la secuencia : %s${C_RESET}\n" "${pendientes:-0}"
    fi

    conflicts=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
    if [ -n "$conflicts" ]; then
        printf "\n${C_RED}  Archivos en conflicto:${C_RESET}\n"
        while IFS= read -r line; do
            printf "${C_RED}    ✗ %s${C_RESET}\n" "$line"
        done <<< "$conflicts"
    fi

    printf "\n"
    read -rp "  ¿Abortar el $operacion y restaurar el estado anterior? [s/N]: " answer
    if ! [[ "${answer,,}" =~ ^s ]]; then
        log_info "Operación cancelada. El $operacion sigue en curso."
        exit 0
    fi

    invoke_git "No se pudo abortar el $operacion." "$operacion" --abort
    log_ok "${operacion^} abortado. Workspace restaurado al estado previo al $operacion."
    log_summary "COMPLETADO" "${operacion^} abortado en rama $current"
    exit 0
fi