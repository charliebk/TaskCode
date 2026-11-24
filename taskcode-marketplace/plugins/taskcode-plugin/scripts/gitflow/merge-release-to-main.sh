#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
parse_gitflow_args "$@"

normalize_branch_name release "4001-cierre-q2" "Release a unir a main"

initialize_gitflow_log "merge-release -> main ($NAME)"

# TASK-143a (SCR-04): el cuerpo, comun con merge-hotfix-to-main.
invoke_merge_to_main "$NAME" release Release "$PUSH" "$MAIN_BRANCH" "$DEVELOP_BRANCH" "$TAG_SEEN" "$TAG_OVERRIDE"
