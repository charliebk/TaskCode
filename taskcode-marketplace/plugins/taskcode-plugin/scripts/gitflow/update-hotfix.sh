#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
parse_gitflow_args "$@"

normalize_branch_name hotfix "3001-crash-startup" "Nombre de hotfix a actualizar desde la rama principal"

initialize_gitflow_log "update-hotfix ($NAME)"

ensure_workspace_ready \
    "Workspace no limpio antes de update. Hacer commit local en la rama actual? Si/No" \
    "chore: commit local antes de update hotfix" || exit 0

# TASK-038: antes de resolve_main_branch, para que este use la cache.
detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
log_info "Rama principal detectada: $MAIN_BRANCH"

# TASK-143a (SCR-02): el cuerpo, comun a los cuatro update.
invoke_update_work_branch "$NAME" "$PUSH" "$MAIN_BRANCH" hotfix
