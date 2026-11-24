#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
parse_gitflow_args "$@"

normalize_branch_name feature "1001-login" "Nombre de feature a unir"

initialize_gitflow_log "merge-feature -> $DEVELOP_BRANCH ($NAME)"

ensure_workspace_ready \
    "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
    "chore: commit local antes de merge feature" || exit 0

invoke_merge_work_branch_to_develop "$NAME" "$PUSH" "$DEVELOP_BRANCH" "feature"
