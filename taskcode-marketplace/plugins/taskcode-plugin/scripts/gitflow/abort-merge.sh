#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "abort-merge"

git_dir=$(git rev-parse --git-dir 2>/dev/null) || { log_error "No estás en un repositorio git."; exit 1; }
current=$(git branch --show-current 2>/dev/null || echo "(detached HEAD)")

# ── Detectar operación en curso ───────────────────────────────────────────────
merge_in_progress=false
rebase_in_progress=false
[ -f "$git_dir/MERGE_HEAD" ]                                            && merge_in_progress=true
{ [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; } && rebase_in_progress=true

if ! $merge_in_progress && ! $rebase_in_progress; then
    log_info "No hay ningún merge ni rebase en curso en la rama '$current'."
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
fi