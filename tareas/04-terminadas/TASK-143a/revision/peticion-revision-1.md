# Peticion de revision — TASK-143a (ronda 1)

- Tarea: TASK-143a — create, update y merge a main (parte a de TASK-143)
- Rama revisada: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
- Rama base: develop
- Commit revisado (HEAD): 84d3207ea756aee0bbd0c5ab15b3ab4943f1bf4c
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-143a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-143a/tarea.md
- tareas/03-en-revision/TASK-143a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
- taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/flujo-comun.test.ts

## Commits a revisar (git log develop..HEAD)

````
84d3207 docs(TASK-143a): autorrevision
aefe5a7 fix(TASK-143a): log de _gf_sync_branch solo cuando cambia de rama
5e39675 fix(TASK-143a): create, update y merge a main de Git-Flow con cuerpo comun
7166ed0 chore(TASK-143a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
index c44050e..1be863a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
@@ -87,11 +87,14 @@ logica, en seis scripts mas. Historia de como se cerro:
   **corregidos en TASK-029** (item C6), ya con la funcion compartida.
   Cubiertos por `test/gitflow/origin-guard.test.ts`.
 
-**Lo que queda**: `create-hotfix.sh` y `create-release.sh` siguen llevando
-su copia inline de TASK-009, anterior a la extraccion de B2, asi que
-detectan si hay remoto pero **no distinguen "sin origin" de "origin caido"**.
-No es el bug original —no mueren con el `fatal:` de Git— pero es la misma
-logica duplicada en dos sitios y con menos criterio que la compartida.
+**Cerrado en TASK-143a**: `create-hotfix.sh` y `create-release.sh` llevaban
+su copia inline de TASK-009; ahora usan `invoke_create_work_branch`. Los
+cuatro `update-*` comparten `invoke_update_work_branch`, y los dos
+`merge-*-to-main` comparten `invoke_merge_to_main`. Todos hacen el mismo
+`fetch` previo (`_gf_fetch_origin`) y ponen la rama base al dia con
+`_gf_sync_branch` (checkout, o creacion desde `origin`, y `pull --ff-only`).
+Eso incluye el backmerge a develop de los merge a main, que antes mergeaba
+sobre la develop local sin traerla de `origin`.
 
 ## Hallazgo real de TASK-009: `moveTareaFile` y el checkout de hotfix/release
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index 46b867a..0c5e857 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -361,48 +361,80 @@ detect_origin_available() {
     fi
 }
 
-# ── invoke_create_work_branch ─────────────────────────────────────────────────
-invoke_create_work_branch() {
-    local name="$1" push="$2" base_branch="$3"
-
-    detect_origin_available
-    local remote_available="$REMOTE_AVAILABLE"
-
-    local current_branch
-    current_branch=$(git branch --show-current 2>&1)
+# ── _gf_fetch_origin ──────────────────────────────────────────────────────────
+# TASK-143a (SCR-02): el fetch previo, una sola vez por invocacion. Antes lo
+# hacian create-release, create-hotfix y los merge, pero no los update ni
+# create-feature/fix. Sin origin disponible no hace nada.
+GF_FETCH_HECHO=false
+_gf_fetch_origin() {
+    [ "$REMOTE_AVAILABLE" = true ] || return 0
+    [ "$GF_FETCH_HECHO" = true ] && return 0
+    invoke_git "No se pudo hacer fetch de origin." fetch origin
+    GF_FETCH_HECHO=true
+}
 
-    if [ "$current_branch" != "$base_branch" ]; then
-        log_info "Rama actual: $current_branch. Cambiando a $base_branch..."
-        if ! git show-ref --verify --quiet "refs/heads/$base_branch" 2>/dev/null; then
-            if [ "$remote_available" = true ]; then
-                invoke_git "No se pudo crear o cambiar a $base_branch desde origin/$base_branch." \
-                    checkout -q -b "$base_branch" "origin/$base_branch"
-            else
-                log_error "$base_branch no existe localmente y no hay conexion remota para crearla."
-                exit 1
-            fi
+# ── _gf_sync_branch ───────────────────────────────────────────────────────────
+# TASK-143a (SCR-02..05): cambia a <rama> (creandola desde origin/<rama> si no
+# existe en local) y la pone al dia con pull --ff-only si hay origin. Era el
+# bloque copiado en create, update, merge a develop, merge a main y backmerge;
+# el backmerge no lo hacia (SCR-05). Espera detect_origin_available ya hecho.
+_gf_sync_branch() {
+    local branch="$1"
+    if ! git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
+        if [ "$REMOTE_AVAILABLE" = true ]; then
+            invoke_git "No se pudo crear o cambiar a $branch desde origin/$branch." \
+                checkout -q -b "$branch" "origin/$branch"
         else
-            invoke_git "No se pudo cambiar a $base_branch." checkout -q "$base_branch"
+            log_error "$branch no existe localmente y no hay conexion remota para crearla."
+            exit 1
         fi
-        log_ok "Switched to branch $base_branch"
+        log_ok "Switched to branch $branch (creada desde origin/$branch)"
+    elif [ "$(git branch --show-current 2>/dev/null)" = "$branch" ]; then
+        log_info "Ya estamos en $branch."
     else
-        log_info "Ya estamos en $base_branch."
+        invoke_git "No se pudo cambiar a $branch." checkout -q "$branch"
+        log_ok "Switched to branch $branch"
     fi
 
-    if [ "$remote_available" = true ]; then
-        invoke_git "No se pudo actualizar $base_branch desde origin." \
-            pull --ff-only --quiet origin "$base_branch"
-        log_ok "Actualizamos $base_branch"
+    if [ "$REMOTE_AVAILABLE" = true ]; then
+        invoke_git "No se pudo actualizar $branch desde origin." \
+            pull --ff-only --quiet origin "$branch"
+        log_ok "Actualizamos $branch"
     else
-        log_warn "Sincronizacion omitida: no hay conexion con origin."
+        log_warn "Sincronizacion omitida para $branch: no hay conexion con origin."
     fi
+}
 
-    local target_local=false target_remote=false
-    git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null && target_local=true || true
-    if [ "$remote_available" = true ]; then
+# ── _gf_locate_branch ─────────────────────────────────────────────────────────
+# TASK-143a (SCR-02, SCR-03): si <rama> existe en local y en origin, en
+# GF_TARGET_LOCAL y GF_TARGET_REMOTE ("true"/"false").
+GF_TARGET_LOCAL=false
+GF_TARGET_REMOTE=false
+_gf_locate_branch() {
+    local name="$1"
+    GF_TARGET_LOCAL=false; GF_TARGET_REMOTE=false
+    git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null && GF_TARGET_LOCAL=true || true
+    if [ "$REMOTE_AVAILABLE" = true ]; then
         _gf_ls_remote --heads origin "$name" 2>/dev/null | grep -q "refs/heads/$name" \
-            && target_remote=true || true
+            && GF_TARGET_REMOTE=true || true
     fi
+}
+
+# ── invoke_create_work_branch ─────────────────────────────────────────────────
+# Crea <rama> desde <base> (o cambia a ella si ya existe). TASK-143a (SCR-03):
+# create-release y create-hotfix la usan en vez de su copia en linea, y gana
+# el fetch previo que solo hacian ellos.
+invoke_create_work_branch() {
+    local name="$1" push="$2" base_branch="$3"
+
+    detect_origin_available
+    local remote_available="$REMOTE_AVAILABLE"
+
+    _gf_fetch_origin
+    _gf_sync_branch "$base_branch"
+
+    _gf_locate_branch "$name"
+    local target_local="$GF_TARGET_LOCAL" target_remote="$GF_TARGET_REMOTE"
 
     if [ "$target_local" = true ]; then
         log_info "La rama $name ya existe localmente. Cambiando a ella..."
@@ -438,6 +470,158 @@ invoke_create_work_branch() {
     log_ok "Rama activa final: $name"
 }
 
+# ── invoke_update_work_branch ─────────────────────────────────────────────────
+# TASK-143a (SCR-02): el cuerpo de update-feature, update-fix, update-release
+# y update-hotfix, antes copiado cuatro veces y sin fetch previo. Pone <base>
+# al dia, cambia a <rama> (local o desde origin) y mergea la base con
+# --no-ff; con <push>=true la sube. Espera detect_origin_available ya hecho
+# (cada script conserva su aviso de "sin conexion").
+invoke_update_work_branch() {
+    local name="$1" push="$2" base_branch="$3" type="$4"
+
+    _gf_fetch_origin
+    _gf_sync_branch "$base_branch"
+
+    _gf_locate_branch "$name"
+    if [ "$GF_TARGET_LOCAL" = true ]; then
+        invoke_git "No se pudo cambiar a $name." checkout -q "$name"
+    elif [ "$GF_TARGET_REMOTE" = true ]; then
+        invoke_git "No se pudo crear la rama local $name desde origin/$name." \
+            checkout -q -b "$name" "origin/$name"
+    else
+        log_error "La rama $name no existe ni localmente ni en remoto."; exit 1
+    fi
+    log_ok "Switched to branch $name"
+
+    invoke_git "No se pudo actualizar $name con cambios de $base_branch." \
+        merge --no-ff "$base_branch" -m "update($type): $base_branch -> $name"
+    log_ok "Update completado: $base_branch -> $name"
+
+    if [ "$push" = true ] && [ "$REMOTE_AVAILABLE" = true ]; then
+        invoke_git "No se pudo subir $name a origin." push origin "$name"
+        log_ok "Push completado: $name"
+    elif [ "$push" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
+        log_warn "Push omitido para $name por falta de conexion remota."
+    fi
+
+    log_summary "COMPLETADO" "$base_branch integrado en $name"
+}
+
+# ── invoke_merge_to_main ──────────────────────────────────────────────────────
+# TASK-143a (SCR-04, SCR-05): el cuerpo de merge-hotfix-to-main y
+# merge-release-to-main, que eran identicos salvo ocho lineas. Mergea <rama>
+# en la principal con tag y la devuelve a develop (backmerge). El backmerge
+# pone develop al dia con pull --ff-only antes de mergear, como el merge a
+# develop: antes mergeaba sobre la develop local y, si estaba atrasada, el
+# push se rechazaba con la principal y el tag ya subidos.
+# Uso: invoke_merge_to_main <rama> <tipo> <Etiqueta> <push> <main> <develop> <tag_visto> <tag>
+invoke_merge_to_main() {
+    local name="$1" type="$2" label="$3" push="$4" main_branch="$5" develop_branch="$6"
+    local tag_seen="$7" tag_override="$8"
+
+    # TASK-060: --tag sustituye el nombre que el script calcula (sigue habiendo
+    # UN solo tag, el del merge a main). Se valida ANTES de tocar ninguna rama:
+    # un nombre invalido, con "-" inicial (se leeria como opcion de git) o ya
+    # usado abortaria despues del merge, con main ya movida.
+    if [ "$tag_seen" = true ] && [ -z "$tag_override" ]; then
+        log_error "--tag necesita un nombre (--tag v1.2.0). No se ha tocado nada."
+        exit 1
+    fi
+    if [ -n "$tag_override" ]; then
+        if [[ "$tag_override" == -* ]] || ! git check-ref-format "refs/tags/$tag_override" 2>/dev/null; then
+            log_error "El nombre de tag '$tag_override' no es valido (git check-ref-format, y sin '-' inicial). No se ha tocado nada."
+            exit 1
+        fi
+        if git show-ref --verify --quiet "refs/tags/$tag_override" 2>/dev/null; then
+            log_error "El tag '$tag_override' ya existe. Elige otro nombre con --tag. No se ha tocado nada."
+            exit 1
+        fi
+    fi
+
+    ensure_workspace_ready \
+        "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
+        "chore: commit local antes de merge $type->main" || exit 0
+
+    # TASK-038: antes de resolve_main_branch, para que este use la cache.
+    detect_origin_available
+    main_branch=$(resolve_main_branch "$main_branch")
+    log_info "Rama principal detectada: $main_branch"
+
+    # Hallazgo IMPORTANTE de revision por pares (B2): origin configurado pero
+    # inaccesible NO es lo mismo que no tener origin. Con el remoto caido, la
+    # rama principal local puede estar obsoleta y el tag de version se crearia
+    # sobre historia divergente. Mejor abortar y que la persona decida.
+    if [ "$REMOTE_CONFIGURED" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
+        log_error "origin esta configurado pero no responde. Mergear a $main_branch sin sincronizar puede crear el tag sobre una $main_branch obsoleta. Revisa conexion/credenciales; si de verdad quieres operar sin remoto, ejecuta git remote remove origin y reintenta."
+        exit 1
+    fi
+
+    _gf_fetch_origin
+
+    # Hallazgo MENOR de revision por pares (B2): validar/recuperar la rama de
+    # trabajo ANTES de tocar la rama principal, para que un nombre inexistente
+    # falle dejando a la persona en su rama de partida.
+    if ! git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null; then
+        if [ "$REMOTE_AVAILABLE" = true ]; then
+            invoke_git "No se pudo crear/cambiar a $name desde origin." checkout -b "$name" "origin/$name"
+        else
+            log_error "$name no existe localmente y no hay conexion remota para recuperarla."
+            exit 1
+        fi
+    fi
+
+    _gf_sync_branch "$main_branch"
+
+    show_merge_diff "$name" "$main_branch" || exit 0
+
+    local commit_count
+    commit_count=$(git rev-list --count "$main_branch..$name" 2>/dev/null || echo "?")
+
+    invoke_git "No se pudo hacer merge de $name en $main_branch." \
+        merge --no-ff "$name" -m "merge($type): $name -> $main_branch"
+
+    local tag_name="${name#"$type"/}"
+    [[ "$tag_name" =~ ^[0-9] ]] && tag_name="v$tag_name"
+    [ -n "$tag_override" ] && tag_name="$tag_override"
+    invoke_git "No se pudo crear tag $tag_name en $main_branch." \
+        tag -a "$tag_name" -m "$label $tag_name"
+    log_ok "Tag creado: $tag_name"
+
+    if [ "$push" = true ]; then
+        if [ "$REMOTE_AVAILABLE" = true ]; then
+            invoke_git "No se pudo subir $main_branch a origin." push origin "$main_branch"
+            invoke_git "No se pudo subir tag $tag_name a origin." push origin "$tag_name"
+            log_ok "Push completado: $main_branch y tag $tag_name"
+        else
+            log_warn "Push omitido: no hay conexion con origin."
+        fi
+    fi
+
+    log_info "Preparando backmerge: $name -> $develop_branch..."
+    _gf_sync_branch "$develop_branch"
+
+    if ! show_merge_diff "$name" "$develop_branch"; then
+        log_warn "Backmerge cancelado. $main_branch y tag $tag_name ya estan actualizados."
+        log_summary "PARCIAL" "merge a $main_branch OK | backmerge a $develop_branch cancelado"
+        exit 0
+    fi
+
+    invoke_git "No se pudo hacer merge de $name en $develop_branch." \
+        merge --no-ff "$name" -m "merge($type): $name -> $develop_branch (backmerge)"
+    log_ok "Merge back completado: $name -> $develop_branch"
+
+    if [ "$push" = true ]; then
+        if [ "$REMOTE_AVAILABLE" = true ]; then
+            invoke_git "No se pudo subir $develop_branch a origin." push origin "$develop_branch"
+            log_ok "Push completado: $develop_branch"
+        else
+            log_warn "Push omitido: no hay conexion con origin."
+        fi
+    fi
+
+    log_summary "COMPLETADO" "${commit_count} commit(s) | tag $tag_name | backmerge a $develop_branch"
+}
+
 # ── invoke_merge_work_branch_to_develop ───────────────────────────────────────
 invoke_merge_work_branch_to_develop() {
     local name="$1" push="$2" develop_branch="$3" type="$4"
@@ -458,28 +642,8 @@ invoke_merge_work_branch_to_develop() {
         log_warn "origin esta configurado pero no responde: el merge se hace sobre la $develop_branch LOCAL, que puede estar desfasada. Cuando vuelva la red, sincroniza (pull) y sube $develop_branch antes de seguir."
     fi
 
-    if [ "$remote_available" = true ]; then
-        invoke_git "No se pudo hacer fetch de origin." fetch origin
-    fi
-
-    if ! git show-ref --verify --quiet "refs/heads/$develop_branch" 2>/dev/null; then
-        if [ "$remote_available" = true ]; then
-            invoke_git "No se pudo crear/cambiar a $develop_branch desde origin." \
-                checkout -b "$develop_branch" "origin/$develop_branch"
-        else
-            log_error "$develop_branch no existe localmente y no hay conexion remota para crearla."
-            exit 1
-        fi
-    else
-        invoke_git "No se pudo cambiar a $develop_branch." checkout "$develop_branch"
-    fi
-
-    if [ "$remote_available" = true ]; then
-        invoke_git "No se pudo actualizar $develop_branch desde origin." \
-            pull --ff-only origin "$develop_branch"
-    else
-        log_warn "Sincronizacion omitida: no hay conexion con origin."
-    fi
+    _gf_fetch_origin
+    _gf_sync_branch "$develop_branch"
 
     if ! git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null; then
         if [ "$remote_available" = true ]; then
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
index 31b6641..06b6a2a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
@@ -25,66 +25,8 @@ detect_origin_available
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
-# Ajuste TASK-009 (mismo hallazgo que el ajuste 2 de TASK-008, dejado como
-# "hallazgo abierto" en scripts/gitflow/README.md para este script en
-# concreto): antes se hacia fetch/pull/push contra origin sin comprobar
-# disponibilidad primero, y fallaba duro en un repo sin origin como el
-# propio TaskCode. Mismo guard ya probado en invoke_merge_work_branch_to_develop.
+# TASK-143a (SCR-03): invoke_create_work_branch en vez de su copia en linea
+# (con el fetch previo y el guard sin origin de TASK-009).
+invoke_create_work_branch "$NAME" "$PUSH" "$MAIN_BRANCH"
 
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo hacer fetch de origin." fetch origin
-fi
-
-if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH desde origin." \
-            checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
-    else
-        log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota para crearla."
-        exit 1
-    fi
-else
-    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout "$MAIN_BRANCH"
-fi
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo actualizar $MAIN_BRANCH desde origin." \
-        pull --ff-only origin "$MAIN_BRANCH"
-else
-    log_warn "Sincronizacion omitida: no hay conexion con origin."
-fi
-
-TARGET_LOCAL=false; TARGET_REMOTE=false
-git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
-        && TARGET_REMOTE=true || true
-fi
-
-if [ "$TARGET_LOCAL" = true ]; then
-    invoke_git "No se pudo cambiar a $NAME." checkout "$NAME"
-    log_ok "Switched to branch $NAME (ya existia)"
-elif [ "$TARGET_REMOTE" = true ]; then
-    invoke_git "No se pudo crear tracking local de $NAME desde origin/$NAME." \
-        checkout -b "$NAME" "origin/$NAME"
-    log_ok "Switched to branch $NAME (desde origin/$NAME)"
-else
-    invoke_git "No se pudo crear $NAME desde $MAIN_BRANCH." checkout -b "$NAME" "$MAIN_BRANCH"
-    log_ok "Rama $NAME creada desde $MAIN_BRANCH"
-fi
-
-if [ "$PUSH" = true ] && [ "$TARGET_REMOTE" = false ]; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo subir $NAME a origin." push -u origin "$NAME"
-        log_ok "Push completado: $NAME"
-    else
-        log_warn "Push omitido: no hay conexion con origin."
-    fi
-elif [ "$PUSH" = true ] && [ "$TARGET_REMOTE" = true ]; then
-    log_ok "La rama $NAME ya existe en origin. No se vuelve a subir."
-fi
-
-invoke_git "No se pudo cambiar a $NAME al finalizar." checkout "$NAME"
-log_ok "Rama activa final: $NAME"
-
-log_summary "COMPLETADO" "rama $NAME creada desde $MAIN_BRANCH"
\ No newline at end of file
+log_summary "COMPLETADO" "rama $NAME creada desde $MAIN_BRANCH"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
index b3d1524..09f2b10 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
@@ -20,67 +20,8 @@ initialize_gitflow_log "create-release ($NAME)"
 
 ensure_workspace_ready || exit 0
 
-# Ajuste TASK-009 (mismo hallazgo que el ajuste 2 de TASK-008, dejado como
-# "hallazgo abierto" en scripts/gitflow/README.md para este script en
-# concreto): antes se hacia fetch/pull/push contra origin sin comprobar
-# disponibilidad primero, y fallaba duro en un repo sin origin como el
-# propio TaskCode. Mismo guard ya probado en invoke_merge_work_branch_to_develop.
-detect_origin_available
+# TASK-143a (SCR-03): invoke_create_work_branch en vez de su copia en linea
+# (con el fetch previo y el guard sin origin de TASK-009).
+invoke_create_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH"
 
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo hacer fetch de origin." fetch origin
-fi
-
-if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo crear/cambiar a $DEVELOP_BRANCH desde origin." \
-            checkout -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
-    else
-        log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota para crearla."
-        exit 1
-    fi
-else
-    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
-fi
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo actualizar $DEVELOP_BRANCH desde origin." \
-        pull --ff-only origin "$DEVELOP_BRANCH"
-else
-    log_warn "Sincronizacion omitida: no hay conexion con origin."
-fi
-
-TARGET_LOCAL=false; TARGET_REMOTE=false
-git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
-        && TARGET_REMOTE=true || true
-fi
-
-if [ "$TARGET_LOCAL" = true ]; then
-    invoke_git "No se pudo cambiar a $NAME." checkout "$NAME"
-    log_ok "Switched to branch $NAME (ya existia)"
-elif [ "$TARGET_REMOTE" = true ]; then
-    invoke_git "No se pudo crear tracking local de $NAME desde origin/$NAME." \
-        checkout -b "$NAME" "origin/$NAME"
-    log_ok "Switched to branch $NAME (desde origin/$NAME)"
-else
-    invoke_git "No se pudo crear $NAME desde $DEVELOP_BRANCH." checkout -b "$NAME" "$DEVELOP_BRANCH"
-    log_ok "Rama $NAME creada desde $DEVELOP_BRANCH"
-fi
-
-if [ "$PUSH" = true ] && [ "$TARGET_REMOTE" = false ]; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo subir $NAME a origin." push -u origin "$NAME"
-        log_ok "Push completado: $NAME"
-    else
-        log_warn "Push omitido: no hay conexion con origin."
-    fi
-elif [ "$PUSH" = true ] && [ "$TARGET_REMOTE" = true ]; then
-    log_ok "La rama $NAME ya existe en origin. No se vuelve a subir."
-fi
-
-invoke_git "No se pudo cambiar a $NAME al finalizar." checkout "$NAME"
-log_ok "Rama activa final: $NAME"
-
-log_summary "COMPLETADO" "rama $NAME creada desde $DEVELOP_BRANCH"
\ No newline at end of file
+log_summary "COMPLETADO" "rama $NAME creada desde $DEVELOP_BRANCH"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
index ba43376..8e63e3b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
@@ -19,127 +19,5 @@ NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
 
 initialize_gitflow_log "merge-hotfix -> main ($NAME)"
 
-# TASK-060: --tag sustituye el nombre que el script calcula (sigue habiendo UN
-# solo tag, el del merge a main). Se valida ANTES de tocar ninguna rama: un
-# nombre invalido, con "-" inicial (se leeria como opcion de git) o ya usado
-# abortaria despues del merge, con main ya movida.
-if [ "$TAG_SEEN" = true ] && [ -z "$TAG_OVERRIDE" ]; then
-    log_error "--tag necesita un nombre (--tag v1.2.0). No se ha tocado nada."
-    exit 1
-fi
-if [ -n "$TAG_OVERRIDE" ]; then
-    if [[ "$TAG_OVERRIDE" == -* ]] || ! git check-ref-format "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
-        log_error "El nombre de tag '$TAG_OVERRIDE' no es valido (git check-ref-format, y sin '-' inicial). No se ha tocado nada."
-        exit 1
-    fi
-    if git show-ref --verify --quiet "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
-        log_error "El tag '$TAG_OVERRIDE' ya existe. Elige otro nombre con --tag. No se ha tocado nada."
-        exit 1
-    fi
-fi
-
-ensure_workspace_ready \
-    "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
-    "chore: commit local antes de merge hotfix->main" || exit 0
-
-# TASK-038: antes de resolve_main_branch, para que este use la cache.
-detect_origin_available
-MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
-log_info "Rama principal detectada: $MAIN_BRANCH"
-
-# Ajuste B2 (mismo guard que introdujo TASK-008 en los merge a develop):
-# antes se hacia "fetch origin" sin comprobar disponibilidad y el script
-# fallaba duro (exit 1) en cualquier repo sin origin configurado.
-
-# Hallazgo IMPORTANTE de revision por pares (B2): origin configurado pero
-# inaccesible NO es lo mismo que no tener origin. Con el remoto caido, la
-# rama principal local puede estar obsoleta y el tag de version se crearia
-# sobre historia divergente. Mejor abortar y que la persona decida.
-if [ "$REMOTE_CONFIGURED" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
-    log_error "origin esta configurado pero no responde. Mergear a $MAIN_BRANCH sin sincronizar puede crear el tag sobre una $MAIN_BRANCH obsoleta. Revisa conexion/credenciales; si de verdad quieres operar sin remoto, ejecuta git remote remove origin y reintenta."
-    exit 1
-fi
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo hacer fetch de origin." fetch origin
-fi
-
-# Hallazgo MENOR de revision por pares (B2): validar/recuperar la rama de
-# trabajo ANTES de tocar la rama principal, para que un nombre inexistente
-# falle dejando a la persona en su rama de partida.
-if ! git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo crear/cambiar a $NAME desde origin." checkout -b "$NAME" "origin/$NAME"
-    else
-        log_error "$NAME no existe localmente y no hay conexion remota para recuperarla."
-        exit 1
-    fi
-fi
-
-if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH desde origin." \
-            checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
-    else
-        log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota para crearla."
-        exit 1
-    fi
-else
-    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout "$MAIN_BRANCH"
-fi
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo actualizar $MAIN_BRANCH desde origin." pull --ff-only origin "$MAIN_BRANCH"
-else
-    log_warn "Sincronizacion omitida: no hay conexion con origin."
-fi
-
-invoke_git "No se pudo volver a $MAIN_BRANCH para merge." checkout "$MAIN_BRANCH"
-
-show_merge_diff "$NAME" "$MAIN_BRANCH" || exit 0
-
-COMMIT_COUNT=$(git rev-list --count "$MAIN_BRANCH..$NAME" 2>/dev/null || echo "?")
-
-invoke_git "No se pudo hacer merge de $NAME en $MAIN_BRANCH." \
-    merge --no-ff "$NAME" -m "merge(hotfix): $NAME -> $MAIN_BRANCH"
-
-TAG_NAME="${NAME#hotfix/}"
-[[ "$TAG_NAME" =~ ^[0-9] ]] && TAG_NAME="v$TAG_NAME"
-[ -n "$TAG_OVERRIDE" ] && TAG_NAME="$TAG_OVERRIDE"
-invoke_git "No se pudo crear tag $TAG_NAME en $MAIN_BRANCH." \
-    tag -a "$TAG_NAME" -m "Hotfix $TAG_NAME"
-log_ok "Tag creado: $TAG_NAME"
-
-if [ "$PUSH" = true ]; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo subir $MAIN_BRANCH a origin." push origin "$MAIN_BRANCH"
-        invoke_git "No se pudo subir tag $TAG_NAME a origin." push origin "$TAG_NAME"
-        log_ok "Push completado: $MAIN_BRANCH y tag $TAG_NAME"
-    else
-        log_warn "Push omitido: no hay conexion con origin."
-    fi
-fi
-
-log_info "Preparando backmerge: $NAME -> $DEVELOP_BRANCH..."
-invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
-
-if ! show_merge_diff "$NAME" "$DEVELOP_BRANCH"; then
-    log_warn "Backmerge cancelado. $MAIN_BRANCH y tag $TAG_NAME ya estan actualizados."
-    log_summary "PARCIAL" "merge a $MAIN_BRANCH OK | backmerge a $DEVELOP_BRANCH cancelado"
-    exit 0
-fi
-
-invoke_git "No se pudo hacer merge de $NAME en $DEVELOP_BRANCH." \
-    merge --no-ff "$NAME" -m "merge(hotfix): $NAME -> $DEVELOP_BRANCH (backmerge)"
-log_ok "Merge back completado: $NAME -> $DEVELOP_BRANCH"
-
-if [ "$PUSH" = true ]; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo subir $DEVELOP_BRANCH a origin." push origin "$DEVELOP_BRANCH"
-        log_ok "Push completado: $DEVELOP_BRANCH"
-    else
-        log_warn "Push omitido: no hay conexion con origin."
-    fi
-fi
-
-log_summary "COMPLETADO" "${COMMIT_COUNT} commit(s) | tag $TAG_NAME | backmerge a $DEVELOP_BRANCH"
\ No newline at end of file
+# TASK-143a (SCR-04): el cuerpo, comun con merge-release-to-main.
+invoke_merge_to_main "$NAME" hotfix Hotfix "$PUSH" "$MAIN_BRANCH" "$DEVELOP_BRANCH" "$TAG_SEEN" "$TAG_OVERRIDE"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
index 72e6900..4a5c522 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
@@ -19,127 +19,5 @@ NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
 
 initialize_gitflow_log "merge-release -> main ($NAME)"
 
-# TASK-060: --tag sustituye el nombre que el script calcula (sigue habiendo UN
-# solo tag, el del merge a main). Se valida ANTES de tocar ninguna rama: un
-# nombre invalido, con "-" inicial (se leeria como opcion de git) o ya usado
-# abortaria despues del merge, con main ya movida.
-if [ "$TAG_SEEN" = true ] && [ -z "$TAG_OVERRIDE" ]; then
-    log_error "--tag necesita un nombre (--tag v1.2.0). No se ha tocado nada."
-    exit 1
-fi
-if [ -n "$TAG_OVERRIDE" ]; then
-    if [[ "$TAG_OVERRIDE" == -* ]] || ! git check-ref-format "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
-        log_error "El nombre de tag '$TAG_OVERRIDE' no es valido (git check-ref-format, y sin '-' inicial). No se ha tocado nada."
-        exit 1
-    fi
-    if git show-ref --verify --quiet "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
-        log_error "El tag '$TAG_OVERRIDE' ya existe. Elige otro nombre con --tag. No se ha tocado nada."
-        exit 1
-    fi
-fi
-
-ensure_workspace_ready \
-    "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
-    "chore: commit local antes de merge release" || exit 0
-
-# TASK-038: antes de resolve_main_branch, para que este use la cache.
-detect_origin_available
-MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
-log_info "Rama principal detectada: $MAIN_BRANCH"
-
-# Ajuste B2 (mismo guard que introdujo TASK-008 en los merge a develop):
-# antes se hacia "fetch origin" sin comprobar disponibilidad y el script
-# fallaba duro (exit 1) en cualquier repo sin origin configurado.
-
-# Hallazgo IMPORTANTE de revision por pares (B2): origin configurado pero
-# inaccesible NO es lo mismo que no tener origin. Con el remoto caido, la
-# rama principal local puede estar obsoleta y el tag de version se crearia
-# sobre historia divergente. Mejor abortar y que la persona decida.
-if [ "$REMOTE_CONFIGURED" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
-    log_error "origin esta configurado pero no responde. Mergear a $MAIN_BRANCH sin sincronizar puede crear el tag sobre una $MAIN_BRANCH obsoleta. Revisa conexion/credenciales; si de verdad quieres operar sin remoto, ejecuta git remote remove origin y reintenta."
-    exit 1
-fi
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo hacer fetch de origin." fetch origin
-fi
-
-# Hallazgo MENOR de revision por pares (B2): validar/recuperar la rama de
-# trabajo ANTES de tocar la rama principal, para que un nombre inexistente
-# falle dejando a la persona en su rama de partida.
-if ! git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo crear/cambiar a $NAME desde origin." checkout -b "$NAME" "origin/$NAME"
-    else
-        log_error "$NAME no existe localmente y no hay conexion remota para recuperarla."
-        exit 1
-    fi
-fi
-
-if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH desde origin." \
-            checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
-    else
-        log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota para crearla."
-        exit 1
-    fi
-else
-    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout "$MAIN_BRANCH"
-fi
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo actualizar $MAIN_BRANCH desde origin." pull --ff-only origin "$MAIN_BRANCH"
-else
-    log_warn "Sincronizacion omitida: no hay conexion con origin."
-fi
-
-invoke_git "No se pudo volver a $MAIN_BRANCH para merge." checkout "$MAIN_BRANCH"
-
-show_merge_diff "$NAME" "$MAIN_BRANCH" || exit 0
-
-COMMIT_COUNT=$(git rev-list --count "$MAIN_BRANCH..$NAME" 2>/dev/null || echo "?")
-
-invoke_git "No se pudo hacer merge de $NAME en $MAIN_BRANCH." \
-    merge --no-ff "$NAME" -m "merge(release): $NAME -> $MAIN_BRANCH"
-
-TAG_NAME="${NAME#release/}"
-[[ "$TAG_NAME" =~ ^[0-9] ]] && TAG_NAME="v$TAG_NAME"
-[ -n "$TAG_OVERRIDE" ] && TAG_NAME="$TAG_OVERRIDE"
-invoke_git "No se pudo crear tag $TAG_NAME en $MAIN_BRANCH." \
-    tag -a "$TAG_NAME" -m "Release $TAG_NAME"
-log_ok "Tag creado: $TAG_NAME"
-
-if [ "$PUSH" = true ]; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo subir $MAIN_BRANCH a origin." push origin "$MAIN_BRANCH"
-        invoke_git "No se pudo subir tag $TAG_NAME a origin." push origin "$TAG_NAME"
-        log_ok "Push completado: $MAIN_BRANCH y tag $TAG_NAME"
-    else
-        log_warn "Push omitido: no hay conexion con origin."
-    fi
-fi
-
-log_info "Preparando backmerge: $NAME -> $DEVELOP_BRANCH..."
-invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
-
-if ! show_merge_diff "$NAME" "$DEVELOP_BRANCH"; then
-    log_warn "Backmerge cancelado. $MAIN_BRANCH y tag $TAG_NAME ya estan actualizados."
-    log_summary "PARCIAL" "merge a $MAIN_BRANCH OK | backmerge a $DEVELOP_BRANCH cancelado"
-    exit 0
-fi
-
-invoke_git "No se pudo hacer merge de $NAME en $DEVELOP_BRANCH." \
-    merge --no-ff "$NAME" -m "merge(release): $NAME -> $DEVELOP_BRANCH (backmerge)"
-log_ok "Merge back completado: $NAME -> $DEVELOP_BRANCH"
-
-if [ "$PUSH" = true ]; then
-    if [ "$REMOTE_AVAILABLE" = true ]; then
-        invoke_git "No se pudo subir $DEVELOP_BRANCH a origin." push origin "$DEVELOP_BRANCH"
-        log_ok "Push completado: $DEVELOP_BRANCH"
-    else
-        log_warn "Push omitido: no hay conexion con origin."
-    fi
-fi
-
-log_summary "COMPLETADO" "${COMMIT_COUNT} commit(s) | tag $TAG_NAME | backmerge a $DEVELOP_BRANCH"
+# TASK-143a (SCR-04): el cuerpo, comun con merge-hotfix-to-main.
+invoke_merge_to_main "$NAME" release Release "$PUSH" "$MAIN_BRANCH" "$DEVELOP_BRANCH" "$TAG_SEEN" "$TAG_OVERRIDE"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
index 908f04f..4ec4b29 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
@@ -24,49 +24,5 @@ ensure_workspace_ready \
 
 detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 
-if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
-    [ "$REMOTE_AVAILABLE" = false ] && { log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
-    invoke_git "No se pudo crear/cambiar a $DEVELOP_BRANCH desde origin." \
-        checkout -q -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
-else
-    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout -q "$DEVELOP_BRANCH"
-fi
-log_ok "Switched to branch $DEVELOP_BRANCH"
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo actualizar $DEVELOP_BRANCH desde origin." \
-        pull --ff-only --quiet origin "$DEVELOP_BRANCH"
-    log_ok "Actualizamos $DEVELOP_BRANCH"
-else
-    log_warn "Sincronizacion omitida para $DEVELOP_BRANCH por falta de conexion remota."
-fi
-
-TARGET_LOCAL=false; TARGET_REMOTE=false
-git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
-        && TARGET_REMOTE=true || true
-fi
-
-if [ "$TARGET_LOCAL" = true ]; then
-    invoke_git "No se pudo cambiar a $NAME." checkout -q "$NAME"
-elif [ "$TARGET_REMOTE" = true ]; then
-    invoke_git "No se pudo crear la rama local $NAME desde origin/$NAME." \
-        checkout -q -b "$NAME" "origin/$NAME"
-else
-    log_error "La rama $NAME no existe ni localmente ni en remoto."; exit 1
-fi
-log_ok "Switched to branch $NAME"
-
-invoke_git "No se pudo actualizar $NAME con cambios de $DEVELOP_BRANCH." \
-    merge --no-ff "$DEVELOP_BRANCH" -m "update(feature): $DEVELOP_BRANCH -> $NAME"
-log_ok "Update completado: $DEVELOP_BRANCH -> $NAME"
-
-if [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo subir $NAME a origin." push origin "$NAME"
-    log_ok "Push completado: $NAME"
-elif [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
-    log_warn "Push omitido para $NAME por falta de conexion remota."
-fi
-
-log_summary "COMPLETADO" "$DEVELOP_BRANCH integrado en $NAME"
\ No newline at end of file
+# TASK-143a (SCR-02): el cuerpo, comun a los cuatro update.
+invoke_update_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH" feature
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
index bf0587a..fe9c9cb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
@@ -24,49 +24,5 @@ ensure_workspace_ready \
 
 detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 
-if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
-    [ "$REMOTE_AVAILABLE" = false ] && { log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
-    invoke_git "No se pudo crear/cambiar a $DEVELOP_BRANCH desde origin." \
-        checkout -q -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
-else
-    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout -q "$DEVELOP_BRANCH"
-fi
-log_ok "Switched to branch $DEVELOP_BRANCH"
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo actualizar $DEVELOP_BRANCH desde origin." \
-        pull --ff-only --quiet origin "$DEVELOP_BRANCH"
-    log_ok "Actualizamos $DEVELOP_BRANCH"
-else
-    log_warn "Sincronizacion omitida para $DEVELOP_BRANCH por falta de conexion remota."
-fi
-
-TARGET_LOCAL=false; TARGET_REMOTE=false
-git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
-        && TARGET_REMOTE=true || true
-fi
-
-if [ "$TARGET_LOCAL" = true ]; then
-    invoke_git "No se pudo cambiar a $NAME." checkout -q "$NAME"
-elif [ "$TARGET_REMOTE" = true ]; then
-    invoke_git "No se pudo crear la rama local $NAME desde origin/$NAME." \
-        checkout -q -b "$NAME" "origin/$NAME"
-else
-    log_error "La rama $NAME no existe ni localmente ni en remoto."; exit 1
-fi
-log_ok "Switched to branch $NAME"
-
-invoke_git "No se pudo actualizar $NAME con cambios de $DEVELOP_BRANCH." \
-    merge --no-ff "$DEVELOP_BRANCH" -m "update(fix): $DEVELOP_BRANCH -> $NAME"
-log_ok "Update completado: $DEVELOP_BRANCH -> $NAME"
-
-if [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo subir $NAME a origin." push origin "$NAME"
-    log_ok "Push completado: $NAME"
-elif [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
-    log_warn "Push omitido para $NAME por falta de conexion remota."
-fi
-
-log_summary "COMPLETADO" "$DEVELOP_BRANCH integrado en $NAME"
\ No newline at end of file
+# TASK-143a (SCR-02): el cuerpo, comun a los cuatro update.
+invoke_update_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH" fix
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
index b80a962..a284548 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
@@ -27,50 +27,5 @@ detect_origin_available "No hay conexion con origin. Se intentara update en modo
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
-
-if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
-    [ "$REMOTE_AVAILABLE" = false ] && { log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
-    invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH desde origin." \
-        checkout -q -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
-else
-    invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout -q "$MAIN_BRANCH"
-fi
-log_ok "Switched to branch $MAIN_BRANCH"
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo actualizar $MAIN_BRANCH desde origin." \
-        pull --ff-only --quiet origin "$MAIN_BRANCH"
-    log_ok "Actualizamos $MAIN_BRANCH"
-else
-    log_warn "Sincronizacion omitida para $MAIN_BRANCH por falta de conexion remota."
-fi
-
-TARGET_LOCAL=false; TARGET_REMOTE=false
-git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
-        && TARGET_REMOTE=true || true
-fi
-
-if [ "$TARGET_LOCAL" = true ]; then
-    invoke_git "No se pudo cambiar a $NAME." checkout -q "$NAME"
-elif [ "$TARGET_REMOTE" = true ]; then
-    invoke_git "No se pudo crear la rama local $NAME desde origin/$NAME." \
-        checkout -q -b "$NAME" "origin/$NAME"
-else
-    log_error "La rama $NAME no existe ni localmente ni en remoto."; exit 1
-fi
-log_ok "Switched to branch $NAME"
-
-invoke_git "No se pudo actualizar $NAME con cambios de $MAIN_BRANCH." \
-    merge --no-ff "$MAIN_BRANCH" -m "update(hotfix): $MAIN_BRANCH -> $NAME"
-log_ok "Update completado: $MAIN_BRANCH -> $NAME"
-
-if [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo subir $NAME a origin." push origin "$NAME"
-    log_ok "Push completado: $NAME"
-elif [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
-    log_warn "Push omitido para $NAME por falta de conexion remota."
-fi
-
-log_summary "COMPLETADO" "$MAIN_BRANCH integrado en $NAME"
\ No newline at end of file
+# TASK-143a (SCR-02): el cuerpo, comun a los cuatro update.
+invoke_update_work_branch "$NAME" "$PUSH" "$MAIN_BRANCH" hotfix
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
index aa438c8..be2eea1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
@@ -24,49 +24,5 @@ ensure_workspace_ready \
 
 detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 
-if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
-    [ "$REMOTE_AVAILABLE" = false ] && { log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
-    invoke_git "No se pudo crear/cambiar a $DEVELOP_BRANCH desde origin." \
-        checkout -q -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
-else
-    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout -q "$DEVELOP_BRANCH"
-fi
-log_ok "Switched to branch $DEVELOP_BRANCH"
-
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo actualizar $DEVELOP_BRANCH desde origin." \
-        pull --ff-only --quiet origin "$DEVELOP_BRANCH"
-    log_ok "Actualizamos $DEVELOP_BRANCH"
-else
-    log_warn "Sincronizacion omitida para $DEVELOP_BRANCH por falta de conexion remota."
-fi
-
-TARGET_LOCAL=false; TARGET_REMOTE=false
-git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
-if [ "$REMOTE_AVAILABLE" = true ]; then
-    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
-        && TARGET_REMOTE=true || true
-fi
-
-if [ "$TARGET_LOCAL" = true ]; then
-    invoke_git "No se pudo cambiar a $NAME." checkout -q "$NAME"
-elif [ "$TARGET_REMOTE" = true ]; then
-    invoke_git "No se pudo crear la rama local $NAME desde origin/$NAME." \
-        checkout -q -b "$NAME" "origin/$NAME"
-else
-    log_error "La rama $NAME no existe ni localmente ni en remoto."; exit 1
-fi
-log_ok "Switched to branch $NAME"
-
-invoke_git "No se pudo actualizar $NAME con cambios de $DEVELOP_BRANCH." \
-    merge --no-ff "$DEVELOP_BRANCH" -m "update(release): $DEVELOP_BRANCH -> $NAME"
-log_ok "Update completado: $DEVELOP_BRANCH -> $NAME"
-
-if [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = true ]; then
-    invoke_git "No se pudo subir $NAME a origin." push origin "$NAME"
-    log_ok "Push completado: $NAME"
-elif [ "$PUSH" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
-    log_warn "Push omitido para $NAME por falta de conexion remota."
-fi
-
-log_summary "COMPLETADO" "$DEVELOP_BRANCH integrado en $NAME"
\ No newline at end of file
+# TASK-143a (SCR-02): el cuerpo, comun a los cuatro update.
+invoke_update_work_branch "$NAME" "$PUSH" "$DEVELOP_BRANCH" release
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-143a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143a/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143a/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-143a/tarea.md                                                       | 10 ++++++++--
 9 files changed, 8 insertions(+), 2 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/flujo-comun.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/flujo-comun.test.ts | 120 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 120 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 130.3 s
- Commit verificado: 84d3207ea756aee0bbd0c5ab15b3ab4943f1bf4c
- Huella: fcfc4855b49d2ff058b7370508f489fba18d5ee2
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 84133 bytes en total):

````
✔ merge-release-to-main.sh --tag SIN valor aborta con mensaje y sin tocar nada (no se ignora en silencio) (3716.9938ms)
✔ merge-release-to-main.sh sin --tag sigue poniendo el tag calculado (el flag es opcional) (7951.8981ms)
✔ merge-hotfix-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (11712.6231ms)
✔ merge-hotfix-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (4551.2081ms)
✔ merge-hotfix-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (29255.8328ms)
✔ merge-hotfix-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (5499.9746ms)
✔ merge-hotfix-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (4052.8795ms)
✔ merge-release-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (9024.6299ms)
✔ merge-release-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (3495.7147ms)
✔ merge-release-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (15114.3121ms)
✔ merge-release-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (2835.9315ms)
✔ merge-release-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (1722.7537ms)
✔ origin (TASK-038): con origin inalcanzable el script responde en segundos y avisa, en vez de esperar a la red (9544.9815ms)
✔ origin (TASK-038): detect_origin_available consulta la red una sola vez por invocacion (6016.8323ms)
✔ origin (TASK-038): sin origin configurado no se consulta la red (3750.6616ms)
✔ origin (TASK-038, IMPORTANTE de su revision): si la lista de ramas del destino expira, el mirror aborta y no borra nada (16886.2714ms)
✔ origin (TASK-038): el merge a develop con origin configurado pero caido se hace y avisa de que develop puede estar desfasada (11508.5609ms)
✔ create-develop.sh: sin origin crea develop en local y omite el push (antes: exit 1) (5392.4862ms)
✔ create-develop.sh: sin origin y con develop ya en local no intenta subirla (5775.117ms)
✔ create-develop.sh: sin origin y sin rama principal local falla con error claro (4613.5577ms)
✔ create-develop.sh: con origin (repo bare real) sigue creando y subiendo develop (18256.6977ms)
✔ create-develop.sh: origin configurado pero inaccesible aborta sin crear develop (4762.9037ms)
✔ recover-branch.sh: sin origin falla explicando que no hay remoto (antes: fatal de Git) (3616.5909ms)
✔ recover-branch.sh: origin configurado pero inaccesible falla distinguiendolo de "sin remoto" (4003.8991ms)
✔ recover-branch.sh: con origin (repo bare real) recupera la rama borrada en local (10305.9677ms)
✔ resume-work.sh: sin origin retoma la rama local y avisa de que no ha sincronizado (antes: exit 1) (3861.383ms)
✔ resume-work.sh: sin origin y con rama inexistente falla dejando a la persona en su rama (2709.0356ms)
✔ resume-work.sh: origin configurado pero inaccesible NO aborta, sigue en local avisando (4239.0824ms)
✔ resume-work.sh: con origin (repo bare real) sigue creando la copia local de una rama remota (9269.0463ms)
✔ resume-work.sh: con el workspace sucio remite a taskctl pause, no a "GitFlow 16" (1775.2803ms)
✔ resume-work.sh: con origin y rama inexistente remite a taskctl recover, no a "GitFlow 18" (4347.6332ms)
ℹ tests 797
ℹ suites 0
ℹ pass 797
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 95336.8781
[verificar-impacto] node --test termino con 0 en 96.0 s.
````
