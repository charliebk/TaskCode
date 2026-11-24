# Peticion de revision — TASK-143b (ronda 1)

- Tarea: TASK-143b — argumentos, diagnose y push-back (parte b de TASK-143)
- Rama revisada: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
- Rama base: develop
- Commit revisado (HEAD): f06802ca957056764c0804a643304f1a76f39972
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-143b (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-143b/tarea.md
- tareas/03-en-revision/TASK-143b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-feature.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-fix.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-feature-to-develop.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-fix-to-develop.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
- taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/argumentos-comunes.test.ts

## Commits a revisar (git log develop..HEAD)

````
f06802c docs(TASK-143b): autorrevision
1b668da fix(TASK-143b): argumentos comunes en Git-Flow, diagnose con detect_origin_available y mirror solo de ramas y tags
f3b4219 chore(TASK-143b): tarea en curso
55a8049 merge(TASK-143b): develop en fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index 304d66e..2b1c579 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -325,6 +325,38 @@ assert_valid_branch_name() {
     fi
 }
 
+# ── parse_gitflow_args ────────────────────────────────────────────────────────
+# TASK-143b (SCR-06): la lectura de argumentos, antes copiada en catorce
+# scripts. Deja en globales PUSH, MAIN_BRANCH, DEVELOP_BRANCH (por defecto
+# "develop"), TAG_SEEN, TAG_OVERRIDE y NAME (el primer argumento suelto).
+# Cada script usa las que le tocan.
+PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""; TAG_SEEN=false
+parse_gitflow_args() {
+    while [[ $# -gt 0 ]]; do
+        case "$1" in
+            --push|-p) PUSH=true ;;
+            --main)    MAIN_BRANCH="${2:-}";    shift ;;
+            --develop) DEVELOP_BRANCH="${2:-}"; shift ;;
+            --tag)     TAG_SEEN=true; TAG_OVERRIDE="${2:-}"; shift ;;
+            *)         [ -z "$NAME" ] && NAME="$1" ;;
+        esac
+        [[ $# -gt 0 ]] && shift
+    done
+}
+
+# ── normalize_branch_name ─────────────────────────────────────────────────────
+# TASK-143b (SCR-06): pide NAME si falta, le quita los espacios de los
+# extremos, le pone el prefijo <tipo>/ y lo valida (assert_valid_branch_name).
+# Antes los merge-* no validaban el nombre.
+# Uso: normalize_branch_name <tipo> <ejemplo sin prefijo> <pregunta>
+normalize_branch_name() {
+    local type="$1" example="$2" question="$3"
+    [ -z "$NAME" ] && read -rp "$question (ej: $example): " NAME
+    NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
+    [[ "$NAME" != "$type"/* ]] && NAME="$type/$NAME"
+    assert_valid_branch_name "$NAME" "$type/$example"
+}
+
 # ── detect_origin_available ───────────────────────────────────────────────────
 # Ajuste B2 (mismo guard que introdujo TASK-008 en
 # invoke_merge_work_branch_to_develop): la deteccion de origin estaba
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
index 9bdc0e1..4c45812 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
@@ -1,15 +1,8 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; PUSH=false
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --main)    MAIN_BRANCH="$2";    shift ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
 initialize_gitflow_log "create-develop ($DEVELOP_BRANCH)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-feature.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-feature.sh
index c35f2fc..c3f5d84 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-feature.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-feature.sh
@@ -1,20 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de feature (ej: 1001-login): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != feature/* ]] && NAME="feature/$NAME"
-assert_valid_branch_name "$NAME" "feature/1001-login"
+normalize_branch_name feature "1001-login" "Nombre de feature"
 
 initialize_gitflow_log "create-feature ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-fix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-fix.sh
index 2f41293..370f4b1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-fix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-fix.sh
@@ -1,20 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de fix (ej: 2001-error-bbox): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != fix/* ]] && NAME="fix/$NAME"
-assert_valid_branch_name "$NAME" "fix/2001-error-bbox"
+normalize_branch_name fix "2001-error-bbox" "Nombre de fix"
 
 initialize_gitflow_log "create-fix ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
index 06b6a2a..e5bd902 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
@@ -1,20 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; MAIN_BRANCH=""
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --main)    MAIN_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de hotfix (ej: 3001-crash-startup): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != hotfix/* ]] && NAME="hotfix/$NAME"
-assert_valid_branch_name "$NAME" "hotfix/3001-crash-startup"
+normalize_branch_name hotfix "3001-crash-startup" "Nombre de hotfix"
 
 initialize_gitflow_log "create-hotfix ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
index 09f2b10..8317e85 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
@@ -1,20 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de release (ej: 4001-cierre-q2): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != release/* ]] && NAME="release/$NAME"
-assert_valid_branch_name "$NAME" "release/4001-cierre-q2"
+normalize_branch_name release "4001-cierre-q2" "Nombre de release"
 
 initialize_gitflow_log "create-release ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
index 0eb7989..80fb8ea 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
@@ -1,12 +1,17 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
+# TASK-143b (SCR-06, SCR-12): --main y --develop, como el resto de scripts.
+parse_gitflow_args "$@"
 initialize_gitflow_log "diagnose-repo"
 
 log_info "Analizando estado del repositorio..."
 
 # ── Datos ─────────────────────────────────────────────────────────────────────
 current=$(git branch --show-current 2>/dev/null || echo "(detached HEAD)")
-main_branch=$(resolve_main_branch "")
+# TASK-143b (SCR-12): la deteccion comun, con su cache, y antes de
+# resolve_main_branch para que este no repita la consulta.
+detect_origin_available "Sin conexion con origin."
+main_branch=$(resolve_main_branch "$MAIN_BRANCH")
 
 status_raw=$(git status --porcelain 2>/dev/null)
 if [ -z "$status_raw" ]; then
@@ -18,16 +23,15 @@ else
     workspace_color="$C_YELLOW"
 fi
 
-remote_ok=false
-_gf_ls_remote --heads origin > /dev/null 2>&1 && remote_ok=true
+remote_ok=$REMOTE_AVAILABLE
 remote_label="✓ origin disponible"
 remote_color="$C_GREEN"
 $remote_ok || { remote_label="✗ sin conexión con origin"; remote_color="$C_YELLOW"; }
 
 develop_local=false; develop_remote=false
-git show-ref --verify --quiet "refs/heads/develop" 2>/dev/null && develop_local=true || true
+git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null && develop_local=true || true
 if $remote_ok; then
-    _gf_ls_remote --heads origin develop 2>/dev/null | grep -q "refs/heads/develop" \
+    _gf_ls_remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH" \
         && develop_remote=true || true
 fi
 if $develop_local && $develop_remote; then
@@ -79,7 +83,7 @@ printf "  %-20s %s\n"     "Rama actual:"    "$current"
 printf "  %-20s ${workspace_color}%s${C_RESET}\n" "Workspace:"   "$workspace_label"
 printf "  %-20s ${remote_color}%s${C_RESET}\n"    "Remoto:"      "$remote_label"
 printf "  %-20s %s\n"     "Rama principal:" "$main_branch"
-printf "  %-20s %s\n"     "Develop:"        "$develop_info"
+printf "  %-20s %s\n"     "Develop:"        "$DEVELOP_BRANCH: $develop_info"
 printf "${C_CYAN}  %s${C_RESET}\n" "$bar"
 printf "  Estado vs origin/%s:\n" "$current"
 if $remote_ok && git show-ref --verify --quiet "refs/remotes/origin/$current" 2>/dev/null; then
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-feature-to-develop.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-feature-to-develop.sh
index 71e7fea..40e1e48 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-feature-to-develop.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-feature-to-develop.sh
@@ -1,19 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de feature a unir (ej: 1001-login): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != feature/* ]] && NAME="feature/$NAME"
+normalize_branch_name feature "1001-login" "Nombre de feature a unir"
 
 initialize_gitflow_log "merge-feature -> $DEVELOP_BRANCH ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-fix-to-develop.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-fix-to-develop.sh
index 4e37e60..70dfa01 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-fix-to-develop.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-fix-to-develop.sh
@@ -1,19 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de fix a unir (ej: 2001-error-bbox): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != fix/* ]] && NAME="fix/$NAME"
+normalize_branch_name fix "2001-error-bbox" "Nombre de fix a unir"
 
 initialize_gitflow_log "merge-fix -> $DEVELOP_BRANCH ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
index 8e63e3b..b478b67 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
@@ -1,21 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""; TAG_SEEN=false
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --main)    MAIN_BRANCH="$2";    shift ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        --tag)     TAG_SEEN=true; TAG_OVERRIDE="${2:-}"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Hotfix a unir a main (ej: 3001-crash-startup): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != hotfix/* ]] && NAME="hotfix/$NAME"
+normalize_branch_name hotfix "3001-crash-startup" "Hotfix a unir a main"
 
 initialize_gitflow_log "merge-hotfix -> main ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
index 4a5c522..07e26c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
@@ -1,21 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""; TAG_SEEN=false
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --main)    MAIN_BRANCH="$2";    shift ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        --tag)     TAG_SEEN=true; TAG_OVERRIDE="${2:-}"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Release a unir a main (ej: 4001-cierre-q2): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != release/* ]] && NAME="release/$NAME"
+normalize_branch_name release "4001-cierre-q2" "Release a unir a main"
 
 initialize_gitflow_log "merge-release -> main ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
index 58a4f13..31649e9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
@@ -198,7 +198,7 @@ else
         log_summary "CANCELADO" "frase de confirmacion no coincide"
         exit 0
     fi
-    log_warn "Confirmacion mirror aceptada. Procediendo con push --mirror..."
+    log_warn "Confirmacion mirror aceptada. Procediendo con el mirror de ramas y tags..."
 fi
 
 # ── 7-8. Push segun modo ──────────────────────────────────────────────────────
@@ -240,20 +240,25 @@ if [ "$MODE" = "additive" ]; then
         exit 1
     fi
 else
-    log_warn "Ejecutando push --mirror a '$TARGET_REMOTE'..."
-    log_warn "Esto sobreescribe el destino con espejo exacto de local."
-    MIRROR_OUTPUT=$(git push "$TARGET_REMOTE" --mirror 2>&1) || {
-        log_error "Fallo el push --mirror a '$TARGET_REMOTE'. Detalle:"
+    log_warn "Ejecutando el mirror de ramas y tags a '$TARGET_REMOTE'..."
+    log_warn "Esto sobreescribe las ramas y tags del destino con espejo exacto de local."
+    # TASK-143b (SCR-15): antes `push --mirror`, que sube TODAS las referencias
+    # (refs/remotes de otros remotos, refs/notes, refs/stash...) y borra las
+    # del destino que no esten en local, mientras la vista previa solo ensena
+    # ramas y tags. Ahora se suben y podan solo ramas y tags: lo que se ensena.
+    MIRROR_OUTPUT=$(git push --force --prune "$TARGET_REMOTE" \
+        'refs/heads/*:refs/heads/*' 'refs/tags/*:refs/tags/*' 2>&1) || {
+        log_error "Fallo el mirror a '$TARGET_REMOTE'. Detalle:"
         printf "%s\n" "$MIRROR_OUTPUT" | while IFS= read -r line; do
             [ -n "$line" ] && printf "[ERROR] %s\n" "$line"
         done
-        log_summary "FALLIDO" "push --mirror rechazado por el servidor"
+        log_summary "FALLIDO" "mirror rechazado por el servidor"
         exit 1
     }
     printf "%s\n" "$MIRROR_OUTPUT" | while IFS= read -r line; do
         [ -n "$line" ] && printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
     done
-    log_ok "Mirror completado: '$TARGET_REMOTE' es ahora espejo exacto de local."
+    log_ok "Mirror completado: '$TARGET_REMOTE' tiene ahora las ramas y tags exactos de local."
 fi
 
 # ── 9. Restaurar como origin si el usuario lo pidio ───────────────────────────
@@ -265,10 +270,12 @@ if [ "$RESTORE_AS_ORIGIN" = true ]; then
         if [ -n "$CURRENT_ORIGIN_URL" ]; then
             log_info "Renombrando origin actual..."
             # Buscar un nombre libre para el origin actual
-            BACKUP_NAME="gitlab-personal-bak"
+            # TASK-143b (SCR-15): el nombre base, una vez.
+            BACKUP_BASE="gitlab-personal-bak"
+            BACKUP_NAME="$BACKUP_BASE"
             i=2
             while git remote get-url "$BACKUP_NAME" > /dev/null 2>&1; do
-                BACKUP_NAME="gitlab-personal-bak-$i"
+                BACKUP_NAME="$BACKUP_BASE-$i"
                 i=$((i+1))
             done
             invoke_git "No se pudo renombrar origin a $BACKUP_NAME." remote rename origin "$BACKUP_NAME"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
index 0753e6c..04d6dfe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
@@ -1,14 +1,8 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-MAIN_BRANCH=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --main)    MAIN_BRANCH="$2";    shift ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
 initialize_gitflow_log "start-work (main + $DEVELOP_BRANCH)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
index 4ec4b29..5cea751 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
@@ -1,20 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de feature a actualizar desde develop (ej: 1001-login): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != feature/* ]] && NAME="feature/$NAME"
-assert_valid_branch_name "$NAME" "feature/1001-login"
+normalize_branch_name feature "1001-login" "Nombre de feature a actualizar desde develop"
 
 initialize_gitflow_log "update-feature ($NAME desde $DEVELOP_BRANCH)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
index fe9c9cb..dd362c8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
@@ -1,20 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de fix a actualizar desde develop (ej: 2001-error-bbox): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != fix/* ]] && NAME="fix/$NAME"
-assert_valid_branch_name "$NAME" "fix/2001-error-bbox"
+normalize_branch_name fix "2001-error-bbox" "Nombre de fix a actualizar desde develop"
 
 initialize_gitflow_log "update-fix ($NAME desde $DEVELOP_BRANCH)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
index a284548..27634af 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
@@ -1,20 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; MAIN_BRANCH=""
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --main)    MAIN_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de hotfix a actualizar desde la rama principal (ej: 3001-crash-startup): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != hotfix/* ]] && NAME="hotfix/$NAME"
-assert_valid_branch_name "$NAME" "hotfix/3001-crash-startup"
+normalize_branch_name hotfix "3001-crash-startup" "Nombre de hotfix a actualizar desde la rama principal"
 
 initialize_gitflow_log "update-hotfix ($NAME)"
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
index be2eea1..074ee88 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
@@ -1,20 +1,10 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; DEVELOP_BRANCH="develop"
-while [[ $# -gt 0 ]]; do
-    case "$1" in
-        --push|-p) PUSH=true ;;
-        --develop) DEVELOP_BRANCH="$2"; shift ;;
-        *)         [ -z "$NAME" ] && NAME="$1" ;;
-    esac
-    shift
-done
+# TASK-143b (SCR-06): argumentos y nombre, de _gitflow-common.sh.
+parse_gitflow_args "$@"
 
-[ -z "$NAME" ] && read -rp "Nombre de release a actualizar desde develop (ej: 4001-cierre-q2): " NAME
-NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
-[[ "$NAME" != release/* ]] && NAME="release/$NAME"
-assert_valid_branch_name "$NAME" "release/4001-cierre-q2"
+normalize_branch_name release "4001-cierre-q2" "Nombre de release a actualizar desde develop"
 
 initialize_gitflow_log "update-release ($NAME desde $DEVELOP_BRANCH)"
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-143b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143b/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143b/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143b/tarea.md                                                       | 10 ++++++++--
 9 files changed, 8 insertions(+), 2 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/argumentos-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/argumentos-comunes.test.ts | 97 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 97 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 113.9 s
- Commit verificado: f06802ca957056764c0804a643304f1a76f39972
- Huella: 7f11818f01ea18d68321059ae8cc467b174ef21b
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 81267 bytes en total):

````
✔ merge-release-to-main.sh --tag SIN valor aborta con mensaje y sin tocar nada (no se ignora en silencio) (2753.5245ms)
✔ merge-release-to-main.sh sin --tag sigue poniendo el tag calculado (el flag es opcional) (5743.873ms)
✔ merge-hotfix-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (9639.1531ms)
✔ merge-hotfix-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (3848.4948ms)
✔ merge-hotfix-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (17688.4212ms)
✔ merge-hotfix-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (4305.2682ms)
✔ merge-hotfix-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (2336.8391ms)
✔ merge-release-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (6505.8374ms)
✔ merge-release-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (2452.7139ms)
✔ merge-release-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (11726.4438ms)
✔ merge-release-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (2255.4031ms)
✔ merge-release-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (1438.2575ms)
✔ origin (TASK-038): con origin inalcanzable el script responde en segundos y avisa, en vez de esperar a la red (8554.4497ms)
✔ origin (TASK-038): detect_origin_available consulta la red una sola vez por invocacion (4341.3772ms)
✔ origin (TASK-038): sin origin configurado no se consulta la red (2680.4968ms)
✔ origin (TASK-038, IMPORTANTE de su revision): si la lista de ramas del destino expira, el mirror aborta y no borra nada (10607.7478ms)
✔ origin (TASK-038): el merge a develop con origin configurado pero caido se hace y avisa de que develop puede estar desfasada (8267.0672ms)
✔ create-develop.sh: sin origin crea develop en local y omite el push (antes: exit 1) (5375.7024ms)
✔ create-develop.sh: sin origin y con develop ya en local no intenta subirla (3697.3831ms)
✔ create-develop.sh: sin origin y sin rama principal local falla con error claro (3220.9938ms)
✔ create-develop.sh: con origin (repo bare real) sigue creando y subiendo develop (10381.103ms)
✔ create-develop.sh: origin configurado pero inaccesible aborta sin crear develop (2574.0303ms)
✔ recover-branch.sh: sin origin falla explicando que no hay remoto (antes: fatal de Git) (1868.0132ms)
✔ recover-branch.sh: origin configurado pero inaccesible falla distinguiendolo de "sin remoto" (2623.9964ms)
✔ recover-branch.sh: con origin (repo bare real) recupera la rama borrada en local (7704.2184ms)
✔ resume-work.sh: sin origin retoma la rama local y avisa de que no ha sincronizado (antes: exit 1) (2640.3245ms)
✔ resume-work.sh: sin origin y con rama inexistente falla dejando a la persona en su rama (1942.1336ms)
✔ resume-work.sh: origin configurado pero inaccesible NO aborta, sigue en local avisando (3361.0619ms)
✔ resume-work.sh: con origin (repo bare real) sigue creando la copia local de una rama remota (7048.8934ms)
✔ resume-work.sh: con el workspace sucio remite a taskctl pause, no a "GitFlow 16" (1382.8057ms)
✔ resume-work.sh: con origin y rama inexistente remite a taskctl recover, no a "GitFlow 18" (3530.524ms)
ℹ tests 797
ℹ suites 0
ℹ pass 797
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 99251.3274
[verificar-impacto] node --test termino con 0 en 99.4 s.
````
