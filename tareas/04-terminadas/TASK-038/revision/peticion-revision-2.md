# Peticion de revision — TASK-038, ronda 2

- Alcance: SOLO el delta de las correcciones de la ronda 1 (446f192..HEAD), y los hallazgos IMP-1, MEN-1, MEN-2 y MEN-4 de informe-revision-1.md.
- Carpeta de la tarea: tareas/03-en-revision/TASK-038/revision/.. (criterios, Resultado y notas de la ronda 1)

## Instrucciones

Revisor INDEPENDIENTE. Comprueba que cada correccion cierra su hallazgo sin abrir otro (las correcciones son donde se cuelan los fallos). Veredicto con `taskctl veredicto TASK-038 <valor>`.

## Commits

```
6aa07d9 fix(TASK-038): correcciones de la revision ronda 1 (IMP-1: el mirror aborta si no puede listar el destino)
```

## Diff del delta (sin tareas/ ni dist/)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index bf49392..f104d5a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -251,6 +251,11 @@ ensure_workspace_ready() {
 # PATH lo encontrara primero la consulta fallaria siempre y todo iria en modo
 # local sin decirlo. Sin coreutils (macOS), se consulta sin limite, como antes.
 GF_TIMEOUT_REMOTO="${GF_TIMEOUT_REMOTO:-5}"
+case "$GF_TIMEOUT_REMOTO" in
+    ''|*[!0-9]*|0)
+        printf "[WARN ] GF_TIMEOUT_REMOTO='%s' no es un numero de segundos mayor que 0; se usa 5.\n" "$GF_TIMEOUT_REMOTO" >&2
+        GF_TIMEOUT_REMOTO=5 ;;
+esac
 if timeout --version > /dev/null 2>&1; then
     _gf_ls_remote() { GIT_TERMINAL_PROMPT=0 timeout "$GF_TIMEOUT_REMOTO" git ls-remote "$@"; }
 else
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
index fa86268..31b6641 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-hotfix.sh
@@ -20,6 +20,8 @@ initialize_gitflow_log "create-hotfix ($NAME)"
 
 ensure_workspace_ready || exit 0
 
+# TASK-038: antes de resolve_main_branch, para que este use la cache.
+detect_origin_available
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
@@ -28,7 +30,6 @@ log_info "Rama principal detectada: $MAIN_BRANCH"
 # concreto): antes se hacia fetch/pull/push contra origin sin comprobar
 # disponibilidad primero, y fallaba duro en un repo sin origin como el
 # propio TaskCode. Mismo guard ya probado en invoke_merge_work_branch_to_develop.
-detect_origin_available
 
 if [ "$REMOTE_AVAILABLE" = true ]; then
     invoke_git "No se pudo hacer fetch de origin." fetch origin
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
index a2dabe7..35ee990 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
@@ -22,13 +22,14 @@ ensure_workspace_ready \
     "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
     "chore: commit local antes de merge hotfix->main" || exit 0
 
+# TASK-038: antes de resolve_main_branch, para que este use la cache.
+detect_origin_available
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
 # Ajuste B2 (mismo guard que introdujo TASK-008 en los merge a develop):
 # antes se hacia "fetch origin" sin comprobar disponibilidad y el script
 # fallaba duro (exit 1) en cualquier repo sin origin configurado.
-detect_origin_available
 
 # Hallazgo IMPORTANTE de revision por pares (B2): origin configurado pero
 # inaccesible NO es lo mismo que no tener origin. Con el remoto caido, la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
index f20c4f3..26ab7e9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
@@ -22,13 +22,14 @@ ensure_workspace_ready \
     "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
     "chore: commit local antes de merge release" || exit 0
 
+# TASK-038: antes de resolve_main_branch, para que este use la cache.
+detect_origin_available
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
 # Ajuste B2 (mismo guard que introdujo TASK-008 en los merge a develop):
 # antes se hacia "fetch origin" sin comprobar disponibilidad y el script
 # fallaba duro (exit 1) en cualquier repo sin origin configurado.
-detect_origin_available
 
 # Hallazgo IMPORTANTE de revision por pares (B2): origin configurado pero
 # inaccesible NO es lo mismo que no tener origin. Con el remoto caido, la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
index 87a8cf3..b1e6eb5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
@@ -92,10 +92,19 @@ invoke_git "No se pudo refrescar $TARGET_REMOTE." fetch --prune --tags "$TARGET_
 log_ok "Estado de '$TARGET_REMOTE' actualizado."
 
 # ── 5. Detectar ramas con divergencia (commits no fast-forward) ───────────────
+# TASK-038 (IMPORTANTE de su revision): la lista de ramas del destino se pide
+# UNA vez y con el codigo de salida comprobado. Desde que las consultas tienen
+# limite de tiempo, una consulta que expiraba devolvia una lista vacia: la
+# vista previa del mirror decia "nada que borrar" y despues `push --mirror`
+# borraba esas ramas. Sin la lista completa no se sigue.
+if ! REMOTE_HEADS_RAW=$(_gf_ls_remote --heads "$TARGET_REMOTE" 2>/dev/null); then
+    log_error "No se pudo listar las ramas de '$TARGET_REMOTE' (red lenta o caida). Aborto: sin esa lista no se puede saber que ramas divergen ni cuales borraria un mirror. Reintenta, o sube el limite con GF_TIMEOUT_REMOTO."
+    exit 1
+fi
 DIVERGED=""
 while IFS= read -r local_branch; do
     [ -z "$local_branch" ] && continue
-    if _gf_ls_remote --heads "$TARGET_REMOTE" "$local_branch" 2>/dev/null | grep -q "refs/heads/$local_branch"; then
+    if printf "%s\n" "$REMOTE_HEADS_RAW" | grep -q "refs/heads/$local_branch\$"; then
         ahead=$(git rev-list --count "$TARGET_REMOTE/$local_branch..$local_branch" 2>/dev/null || echo 0)
         behind=$(git rev-list --count "$local_branch..$TARGET_REMOTE/$local_branch" 2>/dev/null || echo 0)
         if [ "$behind" -gt 0 ]; then
@@ -109,12 +118,16 @@ REMOTE_ONLY_BRANCHES=""
 REMOTE_ONLY_TAGS=""
 if [ "$MODE" = "mirror" ]; then
     # Ramas que existen en destino pero no en local
-    REMOTE_BRANCHES=$(_gf_ls_remote --heads "$TARGET_REMOTE" 2>/dev/null | sed 's|.*refs/heads/||' | sort -u)
+    REMOTE_BRANCHES=$(printf "%s\n" "$REMOTE_HEADS_RAW" | grep 'refs/heads/' | sed 's|.*refs/heads/||' | sort -u)
     LOCAL_BRANCHES=$(git for-each-ref --format='%(refname:short)' refs/heads | sort -u)
     REMOTE_ONLY_BRANCHES=$(comm -23 <(printf "%s\n" "$REMOTE_BRANCHES") <(printf "%s\n" "$LOCAL_BRANCHES") | grep -v '^$' || true)
 
     # Tags que existen en destino pero no en local
-    REMOTE_TAGS=$(_gf_ls_remote --tags "$TARGET_REMOTE" 2>/dev/null | sed 's|.*refs/tags/||' | sed 's|\^{}$||' | sort -u)
+    if ! REMOTE_TAGS_RAW=$(_gf_ls_remote --tags "$TARGET_REMOTE" 2>/dev/null); then
+        log_error "No se pudo listar los tags de '$TARGET_REMOTE' (red lenta o caida). Aborto el mirror: borraria tags que la vista previa no puede mostrar."
+        exit 1
+    fi
+    REMOTE_TAGS=$(printf "%s\n" "$REMOTE_TAGS_RAW" | grep 'refs/tags/' | sed 's|.*refs/tags/||' | sed 's|\^{}$||' | sort -u)
     LOCAL_TAGS=$(git tag --list | sort -u)
     REMOTE_ONLY_TAGS=$(comm -23 <(printf "%s\n" "$REMOTE_TAGS") <(printf "%s\n" "$LOCAL_TAGS") | grep -v '^$' || true)
 fi
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
index 616657d..0753e6c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/start-work.sh
@@ -14,10 +14,11 @@ initialize_gitflow_log "start-work (main + $DEVELOP_BRANCH)"
 
 ensure_workspace_ready || exit 0
 
+# TASK-038: antes de resolve_main_branch, para que este use la cache.
+detect_origin_available
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
-detect_origin_available
 
 if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
     if [ "$REMOTE_AVAILABLE" = true ]; then
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
index 9dd0875..b80a962 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/update-hotfix.sh
@@ -22,10 +22,11 @@ ensure_workspace_ready \
     "Workspace no limpio antes de update. Hacer commit local en la rama actual? Si/No" \
     "chore: commit local antes de update hotfix" || exit 0
 
+# TASK-038: antes de resolve_main_branch, para que este use la cache.
+detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
-detect_origin_available "No hay conexion con origin. Se intentara update en modo local."
 
 if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
     [ "$REMOTE_AVAILABLE" = false ] && { log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota."; exit 1; }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-deteccion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-deteccion.test.ts
index 23bb689..0b3a9e2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-deteccion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-deteccion.test.ts
@@ -70,7 +70,10 @@ test('origin (TASK-038): con origin inalcanzable el script responde en segundos
     });
     const ms = Date.now() - t0;
     const salida = (r.stdout ?? '') + (r.stderr ?? '');
-    assert.ok(ms < 20000, `tardo ${ms} ms`);
+    // Criterio: menos de 10 s con el limite por defecto (5 s). Aqui el limite
+    // es 2 s y el script hace una sola consulta; 12 s deja margen a la carga
+    // de la suite, y sin limite la consulta sola ya tarda ~21 s.
+    assert.ok(ms < 12000, `tardo ${ms} ms`);
     assert.match(salida, /No hay conexion con origin\. Se intentara update en modo local\./);
   } finally {
     await limpiar(repo);
@@ -118,6 +121,53 @@ test('origin (TASK-038): sin origin configurado no se consulta la red', async ()
   }
 });
 
+test('origin (TASK-038, IMPORTANTE de su revision): si la lista de ramas del destino expira, el mirror aborta y no borra nada', async () => {
+  // Montaje del revisor: un destino real cuyo upload-pack se vuelve lento a
+  // partir de la 3.a llamada (1.a: comprobar conexion; 2.a: fetch; 3.a: la
+  // lista de ramas). Antes, esa lista salia vacia, la vista previa decia
+  // "nada que borrar" y push --mirror borraba la rama exclusiva del destino.
+  const repo = await repoConRamas();
+  const destino = await mkdtemp(path.join(tmpdir(), 'taskctl-destino-'));
+  const contador = path.join(destino, '..', `${path.basename(destino)}-llamadas`);
+  const lento = path.join(destino, '..', `${path.basename(destino)}-lento.sh`);
+  try {
+    git(['init', '-q', '--bare', '-b', 'main'], destino);
+    git(['push', '-q', destino, 'main', 'develop'], repo);
+    git(['push', '-q', destino, 'feature/x:refs/heads/solo-en-destino'], repo);
+    const c = contador.split(path.sep).join('/');
+    await writeFile(
+      lento,
+      `#!/bin/sh\necho x >> "${c}"\nn=$(wc -l < "${c}")\n[ "$n" -ge 3 ] && sleep 4\nexec git-upload-pack "$@"\n`,
+      'utf8'
+    );
+    git(['remote', 'add', 'destino', destino], repo);
+    git(['config', 'remote.destino.uploadpack', `sh ${lento.split(path.sep).join('/')}`], repo);
+    const r = spawnSync(
+      'bash',
+      [path.join(SCRIPTS, 'push-back-to-remote.sh'), '--target', 'destino', '--mirror'],
+      {
+        cwd: repo,
+        encoding: 'utf8',
+        input: 's\nBORRAR\nsi\n',
+        env: { ...process.env, GF_TIMEOUT_REMOTO: '2' },
+      }
+    );
+    const salida = (r.stdout ?? '') + (r.stderr ?? '');
+    assert.notEqual(r.status, 0, `el mirror no deberia seguir:\n${salida}`);
+    assert.match(salida, /No se pudo listar las ramas de 'destino'/);
+    const ramas = spawnSync('git', ['branch', '--list', 'solo-en-destino'], {
+      cwd: destino,
+      encoding: 'utf8',
+    });
+    assert.match(ramas.stdout, /solo-en-destino/, 'la rama exclusiva del destino se ha borrado');
+  } finally {
+    await limpiar(repo);
+    await limpiar(destino);
+    await rm(contador, { force: true });
+    await rm(lento, { force: true });
+  }
+});
+
 test('origin (TASK-038): el merge a develop con origin configurado pero caido se hace y avisa de que develop puede estar desfasada', async () => {
   const repo = await repoConRamas();
   try {
````
