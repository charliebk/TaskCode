#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
parse_gitflow_args "$@"

normalize_branch_name fix "2001-error-bbox" "Nombre de fix a actualizar desde develop"

initialize_gitflow_log "update-fix ($NAME desde $DEVELOP_BRANCH)"

ensure_workspace_ready \
    "Workspace no limpio antes de update. Hacer commit local en la rama actual? Si/No" \
    "chore: commit local antes de update fix" || exit 0

detect_origin_available "No hay conexion con origin. Se intentara update en modo local."

# TASK-143a (SCR-02): el cuerpo, comun a los cuatro update.
invoke_update_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH" fix
