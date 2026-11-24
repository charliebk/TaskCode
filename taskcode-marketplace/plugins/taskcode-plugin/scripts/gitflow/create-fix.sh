#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
parse_gitflow_args "$@"

normalize_branch_name fix "2001-error-bbox" "Nombre de fix"

initialize_gitflow_log "create-fix ($NAME)"

ensure_workspace_ready || exit 0

invoke_create_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH"

log_summary "COMPLETADO" "rama $NAME creada desde $DEVELOP_BRANCH"