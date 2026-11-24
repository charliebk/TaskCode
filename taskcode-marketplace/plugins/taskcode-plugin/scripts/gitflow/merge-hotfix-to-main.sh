#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"

PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""; TAG_SEEN=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        --push|-p) PUSH=true ;;
        --main)    MAIN_BRANCH="$2";    shift ;;
        --develop) DEVELOP_BRANCH="$2"; shift ;;
        --tag)     TAG_SEEN=true; TAG_OVERRIDE="${2:-}"; shift ;;
        *)         [ -z "$NAME" ] && NAME="$1" ;;
    esac
    shift
done

[ -z "$NAME" ] && read -rp "Hotfix a unir a main (ej: 3001-crash-startup): " NAME
NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
[[ "$NAME" != hotfix/* ]] && NAME="hotfix/$NAME"

initialize_gitflow_log "merge-hotfix -> main ($NAME)"

# TASK-143a (SCR-04): el cuerpo, comun con merge-release-to-main.
invoke_merge_to_main "$NAME" hotfix Hotfix "$PUSH" "$MAIN_BRANCH" "$DEVELOP_BRANCH" "$TAG_SEEN" "$TAG_OVERRIDE"
