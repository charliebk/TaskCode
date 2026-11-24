#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
parse_gitflow_args "$@"

normalize_branch_name hotfix "3001-crash-startup" "Nombre de hotfix"

initialize_gitflow_log "create-hotfix ($NAME)"

ensure_workspace_ready || exit 0

# TASK-038: antes de resolve_main_branch, para que este use la cache.
detect_origin_available
MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
log_info "Rama principal detectada: $MAIN_BRANCH"

# TASK-143a (SCR-03): invoke_create_work_branch en vez de su copia en linea
# (con el fetch previo y el guard sin origin de TASK-009).
invoke_create_work_branch "$NAME" "$PUSH" "$MAIN_BRANCH"

log_summary "COMPLETADO" "rama $NAME creada desde $MAIN_BRANCH"
