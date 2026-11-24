#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
parse_gitflow_args "$@"

normalize_branch_name release "4001-cierre-q2" "Nombre de release"

initialize_gitflow_log "create-release ($NAME)"

ensure_workspace_ready || exit 0

# TASK-143a (SCR-03): invoke_create_work_branch en vez de su copia en linea
# (con el fetch previo y el guard sin origin de TASK-009).
invoke_create_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH"

log_summary "COMPLETADO" "rama $NAME creada desde $DEVELOP_BRANCH"
