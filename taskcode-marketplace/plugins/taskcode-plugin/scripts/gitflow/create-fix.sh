#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --push|-p) PUSH=true ;;
        --develop) DEVELOP_BRANCH="$2"; shift ;;
        *)         [ -z "$NAME" ] && NAME="$1" ;;
    esac
    shift
done

[ -z "$NAME" ] && read -rp "Nombre de fix (ej: 2001-error-bbox): " NAME
NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
[[ "$NAME" != fix/* ]] && NAME="fix/$NAME"
assert_valid_branch_name "$NAME" "fix/2001-error-bbox"

initialize_gitflow_log "create-fix ($NAME)"

ensure_workspace_ready || exit 0

invoke_create_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH"

log_summary "COMPLETADO" "rama $NAME creada desde $DEVELOP_BRANCH"