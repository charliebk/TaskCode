#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
parse_gitflow_args "$@"

normalize_branch_name feature "1001-login" "Nombre de feature"

initialize_gitflow_log "create-feature ($NAME)"

ensure_workspace_ready || exit 0

invoke_create_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH"

log_summary "COMPLETADO" "rama $NAME creada desde $DEVELOP_BRANCH"