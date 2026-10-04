# Peticion de revision — TASK-038 (ronda 1)

- Tarea: TASK-038 — F2-T2 Una sola deteccion de origin por invocacion, con timeout
- Rama revisada: feature/task-038-f2-t2-una-sola-deteccion-de-origin-por-i
- Rama base: develop
- Commit revisado (HEAD): 3bca7ef59111f62f400a6b66470690bbdeed3fe8
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-038 (criterios de aceptacion y plan)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
3bca7ef perf(TASK-038): una sola deteccion de origin por invocacion, con timeout
dab92c6 chore(TASK-038): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index b20f38c..bf49392 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -240,16 +240,35 @@ ensure_workspace_ready() {
     return 0
 }
 
+# ── _gf_ls_remote ─────────────────────────────────────────────────────────────
+# TASK-038: `git ls-remote` con dos protecciones que antes no tenia.
+#   - GIT_TERMINAL_PROMPT=0: nunca se queda esperando credenciales (sin
+#     terminal, o bajo taskctl con stdin ignorado, esperaria para siempre).
+#   - Limite de GF_TIMEOUT_REMOTO segundos (5 por defecto): con la VPN caida
+#     la consulta tardaba lo que tardase la red, del orden de 30 s.
+# El limite usa el `timeout` de coreutils SOLO si responde a --version: en
+# Windows tambien existe el timeout.exe de cmd, con otra sintaxis, y si el
+# PATH lo encontrara primero la consulta fallaria siempre y todo iria en modo
+# local sin decirlo. Sin coreutils (macOS), se consulta sin limite, como antes.
+GF_TIMEOUT_REMOTO="${GF_TIMEOUT_REMOTO:-5}"
+if timeout --version > /dev/null 2>&1; then
+    _gf_ls_remote() { GIT_TERMINAL_PROMPT=0 timeout "$GF_TIMEOUT_REMOTO" git ls-remote "$@"; }
+else
+    _gf_ls_remote() { GIT_TERMINAL_PROMPT=0 git ls-remote "$@"; }
+fi
+
 # ── resolve_main_branch ───────────────────────────────────────────────────────
 resolve_main_branch() {
     local preferred="$1"
     [ -n "$preferred" ] && { printf "%s" "$preferred"; return 0; }
 
-    if git ls-remote --heads origin main 2>/dev/null | grep -q "refs/heads/main"; then
-        printf "main"; return 0
-    fi
-    if git ls-remote --heads origin master 2>/dev/null | grep -q "refs/heads/master"; then
-        printf "master"; return 0
+    # TASK-038: una sola consulta para main y master, y ninguna si ya se sabe
+    # que origin no responde (o no esta configurado).
+    if [ "$GF_ORIGIN_DETECTADO" != true ] || [ "$REMOTE_AVAILABLE" = true ]; then
+        local heads
+        heads=$(_gf_ls_remote --heads origin main master 2>/dev/null) || heads=""
+        case "$heads" in *refs/heads/main*) printf "main"; return 0 ;; esac
+        case "$heads" in *refs/heads/master*) printf "master"; return 0 ;; esac
     fi
     if git show-ref --verify --quiet "refs/heads/main" 2>/dev/null; then
         printf "main"; return 0
@@ -283,20 +302,29 @@ assert_valid_branch_name() {
 # revision por pares de B2): "sin origin configurado" habilita el modo
 # local con seguridad, pero "origin configurado e inaccesible" puede ser
 # una VPN/red caida con la main local obsoleta respecto al remoto.
+#
+# TASK-038: una sola consulta por invocacion (GF_ORIGIN_DETECTADO); sin
+# origin configurado ni se consulta la red; y el aviso de "sin conexion" es
+# parametrizable para que cada script conserve su texto. Antes habia 7 copias
+# en linea de esta funcion.
 REMOTE_AVAILABLE=false
 REMOTE_CONFIGURED=false
+GF_ORIGIN_DETECTADO=false
 detect_origin_available() {
+    local aviso="${1:-No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local.}"
+    [ "$GF_ORIGIN_DETECTADO" = true ] && return 0
+    GF_ORIGIN_DETECTADO=true
     if git remote get-url origin > /dev/null 2>&1; then
         REMOTE_CONFIGURED=true
     else
         REMOTE_CONFIGURED=false
     fi
-    if git ls-remote --heads origin > /dev/null 2>&1; then
+    if [ "$REMOTE_CONFIGURED" = true ] && _gf_ls_remote --heads origin > /dev/null 2>&1; then
         REMOTE_AVAILABLE=true
         log_ok "Conexion remota disponible (origin)."
     else
         REMOTE_AVAILABLE=false
-        log_warn "No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local."
+        log_warn "$aviso"
     fi
 }
 
@@ -339,7 +367,7 @@ invoke_create_work_branch() {
     local target_local=false target_remote=false
     git show-ref --verify --quiet "refs/heads/$name" 2>/dev/null && target_local=true || true
     if [ "$remote_available" = true ]; then
-        git ls-remote --heads origin "$name" 2>/dev/null | grep -q "refs/heads/$name" \
+        _gf_ls_remote --heads origin "$name" 2>/dev/null | grep -q "refs/heads/$name" \
             && target_remote=true || true
     fi
 
@@ -389,6 +417,14 @@ invoke_merge_work_branch_to_develop() {
     detect_origin_available
     local remote_available="$REMOTE_AVAILABLE"
 
+    # TASK-038: origin configurado pero caido avisa, no aborta. En los merge a
+    # main si se aborta, porque el tag se crearia sobre una main obsoleta; en
+    # develop no hay tag, y abortar bloquearia cualquier cierre con la VPN
+    # caida. Lo que hay que decir es que develop puede estar desfasada.
+    if [ "$REMOTE_CONFIGURED" = true ] && [ "$remote_available" = false ]; then
+        log_warn "origin esta configurado pero no responde: el merge se hace sobre la $develop_branch LOCAL, que puede estar desfasada. Cuando vuelva la red, sincroniza (pull) y sube $develop_branch antes de seguir."
+    fi
+
     if [ "$remote_available" = true ]; then
         invoke_git "No se pudo hacer fetch de origin." fetch origin
     fi
@@ -478,7 +514,7 @@ ensure_remote_exists() {
 ensure_remote_empty() {
     local name="$1"
     local heads
-    heads=$(git ls-remote --heads "$name" 2>/dev/null) || {
+    heads=$(_gf_ls_remote --heads "$name" 2>/dev/null) || {
         log_error "No se pudo consultar el remoto '$name'. Verifica conexion y credenciales."
         return 1
     }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
index 1c86e75..9bdc0e1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
@@ -42,7 +42,7 @@ log_info "Rama principal detectada: $MAIN_BRANCH"
 DEV_LOCAL=false; DEV_REMOTE=false
 git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null && DEV_LOCAL=true || true
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    git ls-remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH" \
+    _gf_ls_remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH" \
         && DEV_REMOTE=true || true
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
index 5987aba..fa86268 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
@@ -28,13 +28,7 @@ log_info "Rama principal detectada: $MAIN_BRANCH"
 # concreto): antes se hacia fetch/pull/push contra origin sin comprobar
 # disponibilidad primero, y fallaba duro en un repo sin origin como el
 # propio TaskCode. Mismo guard ya probado en invoke_merge_work_branch_to_develop.
-REMOTE_AVAILABLE=false
-if git ls-remote --heads origin > /dev/null 2>&1; then
-    REMOTE_AVAILABLE=true
-    log_ok "Conexion remota disponible (origin)."
-else
-    log_warn "No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local."
-fi
+detect_origin_available
 
 if [ "$REMOTE_AVAILABLE" = true ]; then
     invoke_git "No se pudo hacer fetch de origin." fetch origin
@@ -62,7 +56,7 @@ fi
 TARGET_LOCAL=false; TARGET_REMOTE=false
 git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
+    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
         && TARGET_REMOTE=true || true
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
index 2415143..b3d1524 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-release.sh
@@ -25,13 +25,7 @@ ensure_workspace_ready || exit 0
 # concreto): antes se hacia fetch/pull/push contra origin sin comprobar
 # disponibilidad primero, y fallaba duro en un repo sin origin como el
 # propio TaskCode. Mismo guard ya probado en invoke_merge_work_branch_to_develop.
-REMOTE_AVAILABLE=false
-if git ls-remote --heads origin > /dev/null 2>&1; then
-    REMOTE_AVAILABLE=true
-    log_ok "Conexion remota disponible (origin)."
-else
-    log_warn "No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local."
-fi
+detect_origin_available
 
 if [ "$REMOTE_AVAILABLE" = true ]; then
     invoke_git "No se pudo hacer fetch de origin." fetch origin
@@ -59,7 +53,7 @@ fi
 TARGET_LOCAL=false; TARGET_REMOTE=false
 git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
+    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
         && TARGET_REMOTE=true || true
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
index c9947db..0eb7989 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
@@ -19,7 +19,7 @@ else
 fi
 
 remote_ok=false
-git ls-remote --heads origin > /dev/null 2>&1 && remote_ok=true
+_gf_ls_remote --heads origin > /dev/null 2>&1 && remote_ok=true
 remote_label="✓ origin disponible"
 remote_color="$C_GREEN"
 $remote_ok || { remote_label="✗ sin conexión con origin"; remote_color="$C_YELLOW"; }
@@ -27,7 +27,7 @@ $remote_ok || { remote_label="✗ sin conexión con origin"; remote_color="$C_YE
 develop_local=false; develop_remote=false
 git show-ref --verify --quiet "refs/heads/develop" 2>/dev/null && develop_local=true || true
 if $remote_ok; then
-    git ls-remote --heads origin develop 2>/dev/null | grep -q "refs/heads/develop" \
+    _gf_ls_remote --heads origin develop 2>/dev/null | grep -q "refs/heads/develop" \
         && develop_remote=true || true
 fi
 if $develop_local && $develop_remote; then
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
index 3e9c231..c780a17 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
@@ -26,7 +26,7 @@ fi
 ORIGIN_URL=$(git remote get-url origin)
 log_info "origin actual: $ORIGIN_URL"
 
-if ! git ls-remote --heads origin > /dev/null 2>&1; then
+if ! _gf_ls_remote --heads origin > /dev/null 2>&1; then
     log_error "No hay conexion con origin. Necesitas VPN/credenciales para hacer mirror."
     exit 1
 fi
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
index 949e065..87a8cf3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
@@ -59,7 +59,7 @@ TARGET_URL=$(git remote get-url "$TARGET_REMOTE")
 log_info "Destino seleccionado: $TARGET_REMOTE -> $TARGET_URL"
 
 # ── 3. Verificar conectividad ─────────────────────────────────────────────────
-if ! git ls-remote --heads "$TARGET_REMOTE" > /dev/null 2>&1; then
+if ! _gf_ls_remote --heads "$TARGET_REMOTE" > /dev/null 2>&1; then
     log_error "No hay conexion con '$TARGET_REMOTE'. Necesitas VPN/credenciales."
     exit 1
 fi
@@ -95,7 +95,7 @@ log_ok "Estado de '$TARGET_REMOTE' actualizado."
 DIVERGED=""
 while IFS= read -r local_branch; do
     [ -z "$local_branch" ] && continue
-    if git ls-remote --heads "$TARGET_REMOTE" "$local_branch" 2>/dev/null | grep -q "refs/heads/$local_branch"; then
+    if _gf_ls_remote --heads "$TARGET_REMOTE" "$local_branch" 2>/dev/null | grep -q "refs/heads/$local_branch"; then
         ahead=$(git rev-list --count "$TARGET_REMOTE/$local_branch..$local_branch" 2>/dev/null || echo 0)
         behind=$(git rev-list --count "$local_branch..$TARGET_REMOTE/$local_branch" 2>/dev/null || echo 0)
         if [ "$behind" -gt 0 ]; then
@@ -109,12 +109,12 @@ REMOTE_ONLY_BRANCHES=""
 REMOTE_ONLY_TAGS=""
 if [ "$MODE" = "mirror" ]; then
     # Ramas que existen en destino pero no en local
-    REMOTE_BRANCHES=$(git ls-remote --heads "$TARGET_REMOTE" 2>/dev/null | sed 's|.*refs/heads/||' | sort -u)
+    REMOTE_BRANCHES=$(_gf_ls_remote --heads "$TARGET_REMOTE" 2>/dev/null | sed 's|.*refs/heads/||' | sort -u)
     LOCAL_BRANCHES=$(git for-each-ref --format='%(refname:short)' refs/heads | sort -u)
     REMOTE_ONLY_BRANCHES=$(comm -23 <(printf "%s\n" "$REMOTE_BRANCHES") <(printf "%s\n" "$LOCAL_BRANCHES") | grep -v '^$' || true)
 
     # Tags que existen en destino pero no en local
-    REMOTE_TAGS=$(git ls-remote --tags "$TARGET_REMOTE" 2>/dev/null | sed 's|.*refs/tags/||' | sed 's|\^{}$||' | sort -u)
+    REMOTE_TAGS=$(_gf_ls_remote --tags "$TARGET_REMOTE" 2>/dev/null | sed 's|.*refs/tags/||' | sed 's|\^{}$||' | sort -u)
     LOCAL_TAGS=$(git tag --list | sort -u)
     REMOTE_ONLY_TAGS=$(comm -23 <(printf "%s\n" "$REMOTE_TAGS") <(printf "%s\n" "$LOCAL_TAGS") | grep -v '^$' || true)
 fi
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/recover-branch.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/recover-branch.sh
index 8c261c1..e2baf00 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/recover-branch.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/recover-branch.sh
@@ -37,7 +37,7 @@ invoke_git "No se pudo hacer fetch de origin." fetch origin
 
 if [ -z "$NAME" ]; then
     printf "\n${C_CYAN}  Ramas disponibles en origin:${C_RESET}\n"
-    git ls-remote --heads origin 2>/dev/null | sed 's|.*refs/heads/||' | sort \
+    _gf_ls_remote --heads origin 2>/dev/null | sed 's|.*refs/heads/||' | sort \
         | while IFS= read -r line; do
         printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
     done
@@ -49,7 +49,7 @@ fi
 log_info "Recuperando rama: $NAME"
 
 # Verificar que existe en origin
-if ! git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME"; then
+if ! _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME"; then
     log_error "La rama '$NAME' no existe en origin. No hay nada que recuperar."
     exit 1
 fi
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
index 82ad249..b280883 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
@@ -56,7 +56,7 @@ fi
 # Cambiar a la rama (local o desde origin)
 NAME_REMOTE=false
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
+    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
         && NAME_REMOTE=true || true
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
index bbae68a..616657d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
@@ -17,13 +17,7 @@ ensure_workspace_ready || exit 0
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
-if git ls-remote --heads origin > /dev/null 2>&1; then
-    REMOTE_AVAILABLE=true
-    log_ok "Conexion remota disponible (origin)."
-else
-    REMOTE_AVAILABLE=false
-    log_warn "No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local."
-fi
+detect_origin_available
 
 if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
     if [ "$REMOTE_AVAILABLE" = true ]; then
@@ -48,7 +42,7 @@ else
 fi
 
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    if git ls-remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH"; then
+    if _gf_ls_remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH"; then
         if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
             invoke_git "No se pudo crear/cambiar a $DEVELOP_BRANCH desde remoto." \
                 checkout -q -b "$DEVELOP_BRANCH" "origin/$DEVELOP_BRANCH"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
index 81bcb1c..8f8fefe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
@@ -122,7 +122,7 @@ log_ok "'$NEW_ORIGIN' promovido a 'origin'."
 
 # 6c. Fetch del nuevo origin para refrescar tracking refs
 log_info "Refrescando refs del nuevo origin..."
-if git ls-remote --heads origin > /dev/null 2>&1; then
+if _gf_ls_remote --heads origin > /dev/null 2>&1; then
     invoke_git "No se pudo hacer fetch del nuevo origin." fetch --prune --tags origin
     log_ok "Refs del nuevo origin sincronizadas."
 else
@@ -131,7 +131,7 @@ fi
 
 # ── 7. Reconfigurar upstream de la rama actual si procede ─────────────────────
 CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
-if [ -n "$CURRENT_BRANCH" ] && git ls-remote --heads origin "$CURRENT_BRANCH" 2>/dev/null | grep -q "refs/heads/$CURRENT_BRANCH"; then
+if [ -n "$CURRENT_BRANCH" ] && _gf_ls_remote --heads origin "$CURRENT_BRANCH" 2>/dev/null | grep -q "refs/heads/$CURRENT_BRANCH"; then
     invoke_git "No se pudo reconfigurar upstream de $CURRENT_BRANCH." \
         branch --set-upstream-to="origin/$CURRENT_BRANCH" "$CURRENT_BRANCH"
     log_ok "Upstream de '$CURRENT_BRANCH' actualizado a origin/$CURRENT_BRANCH."
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
index f5662c9..908f04f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-feature.sh
@@ -22,11 +22,7 @@ ensure_workspace_ready \
     "Workspace no limpio antes de update. Hacer commit local en la rama actual? Si/No" \
     "chore: commit local antes de update feature" || exit 0
 
-if git ls-remote --heads origin > /dev/null 2>&1; then
-    REMOTE_AVAILABLE=true; log_ok "Conexion remota disponible (origin)."
-else
-    REMOTE_AVAILABLE=false; log_warn "No hay conexion con origin. Se intentara update en modo local."
-fi
+detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 
 if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
     [ "$REMOTE_AVAILABLE" = false ] && { log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
@@ -48,7 +44,7 @@ fi
 TARGET_LOCAL=false; TARGET_REMOTE=false
 git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
+    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
         && TARGET_REMOTE=true || true
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
index f078cb4..bf0587a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-fix.sh
@@ -22,11 +22,7 @@ ensure_workspace_ready \
     "Workspace no limpio antes de update. Hacer commit local en la rama actual? Si/No" \
     "chore: commit local antes de update fix" || exit 0
 
-if git ls-remote --heads origin > /dev/null 2>&1; then
-    REMOTE_AVAILABLE=true; log_ok "Conexion remota disponible (origin)."
-else
-    REMOTE_AVAILABLE=false; log_warn "No hay conexion con origin. Se intentara update en modo local."
-fi
+detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 
 if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
     [ "$REMOTE_AVAILABLE" = false ] && { log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
@@ -48,7 +44,7 @@ fi
 TARGET_LOCAL=false; TARGET_REMOTE=false
 git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
+    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
         && TARGET_REMOTE=true || true
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
index 62dcda3..9dd0875 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
@@ -25,11 +25,7 @@ ensure_workspace_ready \
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
-if git ls-remote --heads origin > /dev/null 2>&1; then
-    REMOTE_AVAILABLE=true; log_ok "Conexion remota disponible (origin)."
-else
-    REMOTE_AVAILABLE=false; log_warn "No hay conexion con origin. Se intentara update en modo local."
-fi
+detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 
 if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
     [ "$REMOTE_AVAILABLE" = false ] && { log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
@@ -51,7 +47,7 @@ fi
 TARGET_LOCAL=false; TARGET_REMOTE=false
 git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
+    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
         && TARGET_REMOTE=true || true
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
index e8490d4..aa438c8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-release.sh
@@ -22,11 +22,7 @@ ensure_workspace_ready \
     "Workspace no limpio antes de update. Hacer commit local en la rama actual? Si/No" \
     "chore: commit local antes de update release" || exit 0
 
-if git ls-remote --heads origin > /dev/null 2>&1; then
-    REMOTE_AVAILABLE=true; log_ok "Conexion remota disponible (origin)."
-else
-    REMOTE_AVAILABLE=false; log_warn "No hay conexion con origin. Se intentara update en modo local."
-fi
+detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 
 if ! git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null; then
     [ "$REMOTE_AVAILABLE" = false ] && { log_error "$DEVELOP_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
@@ -48,7 +44,7 @@ fi
 TARGET_LOCAL=false; TARGET_REMOTE=false
 git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null && TARGET_LOCAL=true || true
 if [ "$REMOTE_AVAILABLE" = true ]; then
-    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
+    _gf_ls_remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
         && TARGET_REMOTE=true || true
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-deteccion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-deteccion.test.ts
new file mode 100644
index 0000000..23bb689
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-deteccion.test.ts
@@ -0,0 +1,139 @@
+/**
+ * TASK-038: una sola deteccion de origin por invocacion, con limite de
+ * tiempo. Repos Git temporales reales; las consultas a la red se cuentan
+ * con GIT_TRACE2_EVENT (cada `git ls-remote` deja su evento), no con lo
+ * que el script dice de si mismo.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SCRIPTS = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+const COMMON = path.join(SCRIPTS, '_gitflow-common.sh').split(path.sep).join('/');
+// TEST-NET-1 (RFC 5737): no responde nunca; la conexion se queda colgada
+// hasta el timeout del sistema, que es justo el caso de la VPN caida.
+const ORIGEN_MUERTO = 'http://192.0.2.1:9/repo.git';
+
+function git(args: string[], cwd: string): void {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
+}
+
+async function repoConRamas(): Promise<string> {
+  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-'));
+  git(['init', '-q', '-b', 'main'], repo);
+  git(['config', 'user.email', 't@t'], repo);
+  git(['config', 'user.name', 't'], repo);
+  await writeFile(path.join(repo, 'a'), 'a\n', 'utf8');
+  git(['add', '.'], repo);
+  git(['commit', '-q', '-m', 'i'], repo);
+  git(['checkout', '-q', '-b', 'develop'], repo);
+  git(['checkout', '-q', '-b', 'feature/x'], repo);
+  await writeFile(path.join(repo, 'b'), 'b\n', 'utf8');
+  git(['add', '.'], repo);
+  git(['commit', '-q', '-m', 'f'], repo);
+  return repo;
+}
+
+async function limpiar(repo: string): Promise<void> {
+  await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
+}
+
+/** Numero de `git ls-remote` que dejaron rastro en GIT_TRACE2_EVENT. */
+async function lsRemotes(traza: string): Promise<number> {
+  let texto = '';
+  try {
+    texto = await readFile(traza, 'utf8');
+  } catch {
+    return 0;
+  }
+  return texto
+    .split('\n')
+    .filter((l) => l.includes('"event":"start"') && l.includes('ls-remote')).length;
+}
+
+test('origin (TASK-038): con origin inalcanzable el script responde en segundos y avisa, en vez de esperar a la red', async () => {
+  const repo = await repoConRamas();
+  try {
+    git(['remote', 'add', 'origin', ORIGEN_MUERTO], repo);
+    const t0 = Date.now();
+    const r = spawnSync('bash', [path.join(SCRIPTS, 'update-feature.sh'), 'x'], {
+      cwd: repo,
+      encoding: 'utf8',
+      stdio: ['ignore', 'pipe', 'pipe'],
+      env: { ...process.env, GF_TIMEOUT_REMOTO: '2' },
+    });
+    const ms = Date.now() - t0;
+    const salida = (r.stdout ?? '') + (r.stderr ?? '');
+    assert.ok(ms < 20000, `tardo ${ms} ms`);
+    assert.match(salida, /No hay conexion con origin\. Se intentara update en modo local\./);
+  } finally {
+    await limpiar(repo);
+  }
+});
+
+test('origin (TASK-038): detect_origin_available consulta la red una sola vez por invocacion', async () => {
+  const repo = await repoConRamas();
+  const traza = path.join(repo, '..', `${path.basename(repo)}-trace.json`);
+  try {
+    // Un "origin" local que si responde: otro repo en disco.
+    const remoto = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-remoto-'));
+    git(['init', '-q', '--bare'], remoto);
+    git(['remote', 'add', 'origin', remoto], repo);
+    const r = spawnSync(
+      'bash',
+      ['-c', `source "${COMMON}"\ndetect_origin_available\ndetect_origin_available\necho "R=$REMOTE_AVAILABLE"`],
+      { cwd: repo, encoding: 'utf8', env: { ...process.env, GIT_TRACE2_EVENT: traza } }
+    );
+    assert.equal(r.status, 0, r.stderr);
+    assert.match(r.stdout, /R=true/);
+    assert.equal(await lsRemotes(traza), 1, 'la segunda llamada no deberia volver a consultar');
+    await limpiar(remoto);
+  } finally {
+    await limpiar(repo);
+    await rm(traza, { force: true });
+  }
+});
+
+test('origin (TASK-038): sin origin configurado no se consulta la red', async () => {
+  const repo = await repoConRamas();
+  const traza = path.join(repo, '..', `${path.basename(repo)}-trace.json`);
+  try {
+    const r = spawnSync('bash', ['-c', `source "${COMMON}"\ndetect_origin_available\necho "R=$REMOTE_AVAILABLE C=$REMOTE_CONFIGURED"`], {
+      cwd: repo,
+      encoding: 'utf8',
+      env: { ...process.env, GIT_TRACE2_EVENT: traza },
+    });
+    assert.equal(r.status, 0, r.stderr);
+    assert.match(r.stdout, /R=false C=false/);
+    assert.equal(await lsRemotes(traza), 0);
+  } finally {
+    await limpiar(repo);
+    await rm(traza, { force: true });
+  }
+});
+
+test('origin (TASK-038): el merge a develop con origin configurado pero caido se hace y avisa de que develop puede estar desfasada', async () => {
+  const repo = await repoConRamas();
+  try {
+    git(['remote', 'add', 'origin', ORIGEN_MUERTO], repo);
+    const r = spawnSync('bash', [path.join(SCRIPTS, 'merge-feature-to-develop.sh'), 'x'], {
+      cwd: repo,
+      encoding: 'utf8',
+      stdio: ['ignore', 'pipe', 'pipe'],
+      env: { ...process.env, GF_TIMEOUT_REMOTO: '2' },
+    });
+    const salida = (r.stdout ?? '') + (r.stderr ?? '');
+    assert.equal(r.status, 0, salida);
+    assert.match(salida, /origin esta configurado pero no responde: el merge se hace sobre la develop LOCAL/);
+    const log = spawnSync('git', ['log', '-1', '--format=%s', 'develop'], { cwd: repo, encoding: 'utf8' });
+    assert.match(log.stdout, /feature\/x/);
+  } finally {
+    await limpiar(repo);
+  }
+});
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-038/tarea.md                                                                        | 36 ------------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-038/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-038/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-038/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-038/planificacion/plan-final.md                                    |  0
 tareas/02-en-curso/TASK-038/tarea.md                                                                         | 67 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 6 files changed, 67 insertions(+), 36 deletions(-)
````
