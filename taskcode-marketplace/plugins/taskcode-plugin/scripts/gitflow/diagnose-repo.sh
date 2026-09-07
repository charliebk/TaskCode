#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
initialize_gitflow_log "diagnose-repo"

log_info "Analizando estado del repositorio..."

# ── Datos ─────────────────────────────────────────────────────────────────────
current=$(git branch --show-current 2>/dev/null || echo "(detached HEAD)")
main_branch=$(resolve_main_branch "")

status_raw=$(git status --porcelain 2>/dev/null)
if [ -z "$status_raw" ]; then
    workspace_label="✓ LIMPIO"
    workspace_color="$C_GREEN"
else
    dirty_count=$(printf "%s\n" "$status_raw" | wc -l | tr -d ' ')
    workspace_label="⚠  ${dirty_count} archivo(s) modificado(s)"
    workspace_color="$C_YELLOW"
fi

remote_ok=false
git ls-remote --heads origin > /dev/null 2>&1 && remote_ok=true
remote_label="✓ origin disponible"
remote_color="$C_GREEN"
$remote_ok || { remote_label="✗ sin conexión con origin"; remote_color="$C_YELLOW"; }

develop_local=false; develop_remote=false
git show-ref --verify --quiet "refs/heads/develop" 2>/dev/null && develop_local=true || true
if $remote_ok; then
    git ls-remote --heads origin develop 2>/dev/null | grep -q "refs/heads/develop" \
        && develop_remote=true || true
fi
if $develop_local && $develop_remote; then
    develop_info="✓ local + remoto"
elif $develop_local; then
    develop_info="! solo local (pendiente de push)"
elif $develop_remote; then
    develop_info="! solo remoto (sin checkout local)"
else
    develop_info="✗ no existe"
fi

ahead=0; behind=0
if $remote_ok && git show-ref --verify --quiet "refs/remotes/origin/$current" 2>/dev/null; then
    ahead=$(git rev-list --count "origin/$current..$current" 2>/dev/null || echo 0)
    behind=$(git rev-list --count "$current..origin/$current" 2>/dev/null || echo 0)
fi

stash_count=$(git stash list 2>/dev/null | wc -l | tr -d ' ')

git_dir=$(git rev-parse --git-dir 2>/dev/null)
merge_in_progress=false; rebase_in_progress=false
[ -f "$git_dir/MERGE_HEAD" ]                                                && merge_in_progress=true
{ [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; }      && rebase_in_progress=true

# ── Informe ───────────────────────────────────────────────────────────────────
bar=$(printf '━%.0s' {1..54})
printf "\n"
printf "${C_CYAN}  %s${C_RESET}\n" "$bar"
printf "${C_CYAN}  DIAGNÓSTICO DEL REPOSITORIO${C_RESET}\n"
printf "${C_CYAN}  %s${C_RESET}\n" "$bar"
printf "  %-20s %s\n"     "Rama actual:"    "$current"
printf "  %-20s ${workspace_color}%s${C_RESET}\n" "Workspace:"   "$workspace_label"
printf "  %-20s ${remote_color}%s${C_RESET}\n"    "Remoto:"      "$remote_label"
printf "  %-20s %s\n"     "Rama principal:" "$main_branch"
printf "  %-20s %s\n"     "Develop:"        "$develop_info"
printf "${C_CYAN}  %s${C_RESET}\n" "$bar"
printf "  Estado vs origin/%s:\n" "$current"
if $remote_ok && git show-ref --verify --quiet "refs/remotes/origin/$current" 2>/dev/null; then
    if [ "$ahead" -gt 0 ]; then
        printf "${C_YELLOW}    ↑ %d commit(s) locales sin push${C_RESET}\n" "$ahead"
    fi
    if [ "$behind" -gt 0 ]; then
        printf "${C_YELLOW}    ↓ %d commit(s) remotos sin pull${C_RESET}\n" "$behind"
    fi
    if [ "$ahead" -eq 0 ] && [ "$behind" -eq 0 ]; then
        printf "${C_GREEN}    ✓ Sincronizado${C_RESET}\n"
    fi
elif $remote_ok; then
    printf "${C_DGRAY}    (rama sin tracking remoto configurado)${C_RESET}\n"
else
    printf "${C_DGRAY}    (sin conexión con origin)${C_RESET}\n"
fi
printf "${C_CYAN}  %s${C_RESET}\n" "$bar"
printf "  %-20s %s\n" "Stashes guardados:" "$stash_count"
if $merge_in_progress; then
    printf "${C_RED}  ⚠  MERGE EN CURSO — para cancelarlo: 'taskctl abort-merge', o 'bash abort-merge.sh' desde scripts/gitflow/${C_RESET}\n"
fi
if $rebase_in_progress; then
    printf "${C_RED}  ⚠  REBASE EN CURSO — usa: git rebase --abort${C_RESET}\n"
fi
if ! $merge_in_progress && ! $rebase_in_progress; then
    printf "${C_GREEN}  ✓  Sin operaciones en curso${C_RESET}\n"
fi
printf "${C_CYAN}  %s${C_RESET}\n\n" "$bar"

# ── Detalles opcionales ───────────────────────────────────────────────────────
if [ -n "$status_raw" ]; then
    printf "${C_YELLOW}  Archivos modificados:${C_RESET}\n"
    while IFS= read -r line; do
        printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done <<< "$status_raw"
    printf "\n"
fi

if [ "$stash_count" -gt 0 ]; then
    printf "${C_YELLOW}  Stashes:${C_RESET}\n"
    git stash list | while IFS= read -r line; do
        printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
    done
    printf "\n"
fi

log_summary "COMPLETADO" "Diagnóstico finalizado"