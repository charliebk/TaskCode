# Peticion de revision — TASK-142 (ronda 1)

- Tarea: TASK-142 — Regla 4D: disfraz en los scripts de Git-Flow
- Rama revisada: fix/task-142-regla-4d-disfraz-en-los-scripts-de-git-f
- Rama base: develop
- Commit revisado (HEAD): 4ef84e1f9f88285a1a9517efdcd949171784463f
- Fecha: 2026-11-22
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-142 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-142/tarea.md
- tareas/03-en-revision/TASK-142/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
- taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/disfraz-gitflow.test.ts

## Commits a revisar (git log develop..HEAD)

````
4ef84e1 docs(TASK-142): autorrevision
1a8bf25 fix(TASK-142): disfraz en los scripts de Git-Flow
0a3b415 chore(TASK-142): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
index 9a94b4f..c44050e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
@@ -17,11 +17,16 @@ comprobar que el `bash` del entorno puede correr estos scripts de verdad
 
 ## Qué cambió respecto al original
 
-Los 22 scripts de acción y `_gitflow-common.sh` son una copia literal del
-`.zip` **salvo dos ajustes en `_gitflow-common.sh`**, ambos identificados
-en `docs/spikes/TASK-007-resultado.md` y necesarios porque los scripts ya
-no viven en `.idea/runConfigurations/local_git-flow-actions/` del proyecto,
-sino dentro del plugin instalado:
+Los 22 scripts de acción y `_gitflow-common.sh` partieron del `.zip`
+original. Desde entonces han recibido ajustes, cada uno documentado en el
+propio script con un comentario `Ajuste TASK-NNN` o `TASK-NNN`: detección de
+origin caído (TASK-029, TASK-038), registro dentro de `.git/` (TASK-029),
+hora sin procesos externos (TASK-037), línea FIN del registro (TASK-118),
+stash exacto en `resume-work.sh` y push sin origin en `pause-work.sh`
+(TASK-142), entre otros. Los dos primeros ajustes, en `_gitflow-common.sh`,
+fueron necesarios porque los scripts ya no viven en
+`.idea/runConfigurations/local_git-flow-actions/` del proyecto, sino dentro
+del plugin instalado:
 
 1. **`log_dir`** (usado por `initialize_gitflow_log`): antes calculaba la
    raíz del proyecto contando 3 niveles de carpeta hacia arriba desde el
@@ -52,8 +57,8 @@ fallback a `$(pwd)` dejaba un `logs/gitflow/` huérfano antes de que el
 script abortara un instante después. Ahora, si no hay repo Git, simplemente
 no se escribe log a fichero (se sigue mostrando por stdout).
 
-No se ha "arreglado" nada más allá de estos tres puntos a propósito — ver la
-sección de hallazgos abiertos más abajo.
+Los ajustes posteriores a estos tres puntos están en los propios scripts,
+con su tarea; la sección de hallazgos abiertos más abajo dice lo que queda.
 
 ## `_gitflow-common.sh` en Windows: qué NO se ha confirmado todavía
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index 2f44107..54d27e4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -542,7 +542,9 @@ ensure_remote_exists() {
 
 # ── ensure_remote_empty ───────────────────────────────────────────────────────
 # Verifica que el remoto no tiene ramas (repo vacío en destino).
-# Si tiene ramas, pide confirmación explícita para sobreescribir.
+# Si tiene ramas, pide confirmación explícita para seguir. TASK-142 (SCR-11):
+# el aviso ya no promete sobreescribir; el envío es sin --force, así que una
+# rama que diverja se rechaza y el envío se detiene.
 # Devuelve 1 si el usuario cancela.
 ensure_remote_empty() {
     local name="$1"
@@ -555,14 +557,14 @@ ensure_remote_empty() {
         log_ok "Remoto '$name' esta vacio. Seguro para mirror inicial."
         return 0
     fi
-    log_warn "Remoto '$name' YA TIENE ramas. Un push --mirror las sobreescribira."
+    log_warn "Remoto '$name' YA TIENE ramas. El envio no las sobreescribe (no se sobreescribe nada sin --force): las que diverjan se rechazaran y el envio se detendra."
     printf "\n${C_YELLOW}  Ramas actuales en '$name':${C_RESET}\n"
     printf "%s\n" "$heads" | sed 's|.*refs/heads/||' | while IFS= read -r line; do
         printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
     done
     printf "\n"
     local answer
-    read -rp "  Sobreescribir TODAS las ramas de '$name' con las de origin? [s/N]: " answer
+    read -rp "  Continuar igualmente con el envio a '$name'? [s/N]: " answer
     if ! [[ "${answer,,}" =~ ^(s|si|y|yes)$ ]]; then
         printf "${C_YELLOW}[END] Operacion cancelada por usuario.${C_RESET}\n"
         return 1
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
index c780a17..25b1801 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
@@ -1,7 +1,10 @@
 #!/usr/bin/env bash
 # GitFlow 20 — Mirror to Remote
-# Copia TODO el historico (ramas, tags) del origin actual a un remoto destino vacio.
+# Copia las ramas LOCALES y todos los tags a un remoto destino, pensado vacio.
 # Util para migrar el repo a otro GitLab/GitHub manteniendo la historia intacta.
+# Una rama que solo exista como origin/<rama> no se copia: crea antes su rama
+# local. Sin --force no sobreescribe nada: si el destino ya tiene una rama
+# que diverge, el destino la rechaza y el envio se detiene.
 
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 initialize_gitflow_log "mirror-to-remote"
@@ -75,8 +78,8 @@ ensure_remote_empty "$REMOTE_NAME" || { log_summary "CANCELADO" "destino no vaci
 # ── 8. Resumen y confirmacion ─────────────────────────────────────────────────
 show_remote_summary "$REMOTE_NAME" || { log_summary "CANCELADO" "usuario cancelo el envio"; exit 0; }
 
-# ── 9. Push --mirror al destino ───────────────────────────────────────────────
-log_info "Enviando todas las ramas a '$REMOTE_NAME'..."
+# ── 9. Push de ramas locales y tags al destino (sin --force) ──────────────────
+log_info "Enviando las ramas locales a '$REMOTE_NAME'..."
 invoke_git "Fallo el push de ramas a $REMOTE_NAME." push "$REMOTE_NAME" --all
 log_ok "Ramas enviadas."
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh
index dc98869..fc62515 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh
@@ -15,14 +15,29 @@ current=$(git branch --show-current 2>/dev/null)
 
 log_info "Pausando trabajo en rama: $current"
 
+# TASK-142 (SCR-09): el push opcional pasa por la misma deteccion de origin
+# que el resto de scripts (TASK-029). Sin origin, o con origin caido, el
+# trabajo queda guardado en local y se avisa: pausar no debe fallar por la red.
+subir_rama() {
+    detect_origin_available
+    if [ "$REMOTE_AVAILABLE" = true ]; then
+        invoke_git "No se pudo hacer push de $current a origin." push origin "$current"
+        log_ok "Push completado: $current → origin/$current"
+    elif [ "$REMOTE_CONFIGURED" = true ]; then
+        log_warn "Push omitido: origin esta configurado pero no responde. El trabajo queda guardado en local."
+    else
+        log_warn "Push omitido: este repo no tiene remoto 'origin'. El trabajo queda guardado en local."
+    fi
+}
+
+hoy=""
+_gf_hora hoy '%Y-%m-%d'
+
 status_raw=$(git status --porcelain 2>/dev/null)
 
 if [ -z "$status_raw" ]; then
     log_info "Workspace limpio. No hay cambios locales que guardar."
-    if [ "$PUSH" = true ]; then
-        invoke_git "No se pudo hacer push de $current a origin." push origin "$current"
-        log_ok "Push completado: $current → origin/$current"
-    fi
+    [ "$PUSH" = true ] && subir_rama
     log_summary "COMPLETADO" "Rama $current ya estaba limpia"
     exit 0
 fi
@@ -37,20 +52,17 @@ read -rp "  ¿Cómo guardar el trabajo? [commit/stash/cancelar]: " answer
 
 case "${answer,,}" in
     commit|c)
-        read -rp "  Mensaje (Enter = 'chore: wip $(date +%Y-%m-%d)'): " msg
-        [ -z "$msg" ] && msg="chore: wip $(date +%Y-%m-%d)"
+        read -rp "  Mensaje (Enter = 'chore: wip $hoy'): " msg
+        [ -z "$msg" ] && msg="chore: wip $hoy"
         git add -A || { log_error "No se pudieron preparar los cambios."; exit 1; }
         invoke_git "No se pudo crear el commit." commit -m "$msg"
         log_ok "Commit creado: $msg"
-        if [ "$PUSH" = true ]; then
-            invoke_git "No se pudo hacer push de $current." push origin "$current"
-            log_ok "Push completado: $current → origin/$current"
-        fi
+        [ "$PUSH" = true ] && subir_rama
         log_info "Para retomar: ejecuta 'taskctl resume $current' (o, sin el CLI a mano, 'bash resume-work.sh $current' desde esta misma carpeta)."
         log_summary "COMPLETADO" "Trabajo guardado como commit en $current"
         ;;
     stash|s)
-        stash_msg="pause: $current $(date +%Y-%m-%d)"
+        stash_msg="pause: $current $hoy"
         invoke_git "No se pudo crear el stash." stash push -u -m "$stash_msg"
         log_ok "Stash creado: $stash_msg"
         log_info "Para retomar: ejecuta 'taskctl resume $current' (o, sin el CLI a mano, 'bash resume-work.sh $current' desde esta misma carpeta)."
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
index b1e6eb5..2e8a070 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
@@ -203,23 +203,42 @@ fi
 
 # ── 7-8. Push segun modo ──────────────────────────────────────────────────────
 if [ "$MODE" = "additive" ]; then
+    # TASK-142 (SCR-10): antes un push rechazado solo dejaba un aviso y el
+    # script seguia con "Push ... completado", el resumen y exit 0. Ahora se
+    # apunta cada fallo; si hay alguno, el script termina FALLIDO, con exit 1
+    # y sin promover el destino a origin.
+    FALLOS=""
     log_info "Enviando ramas a '$TARGET_REMOTE' (modo aditivo)..."
-    PUSH_OUTPUT=$(git push "$TARGET_REMOTE" --all 2>&1) || {
-        log_warn "Algunos pushes de ramas fallaron. Detalle:"
-    }
+    if PUSH_OUTPUT=$(git push "$TARGET_REMOTE" --all 2>&1); then
+        RAMAS_OK=true
+    else
+        RAMAS_OK=false
+        FALLOS="ramas"
+        log_error "El destino rechazo parte de las ramas. Detalle:"
+    fi
     printf "%s\n" "$PUSH_OUTPUT" | while IFS= read -r line; do
         [ -n "$line" ] && printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
     done
-    log_ok "Push de ramas completado."
+    [ "$RAMAS_OK" = true ] && log_ok "Push de ramas completado."
 
     log_info "Enviando tags a '$TARGET_REMOTE'..."
-    TAG_OUTPUT=$(git push "$TARGET_REMOTE" --tags 2>&1) || {
-        log_warn "Algunos pushes de tags fallaron. Detalle:"
-    }
+    if TAG_OUTPUT=$(git push "$TARGET_REMOTE" --tags 2>&1); then
+        TAGS_OK=true
+    else
+        TAGS_OK=false
+        FALLOS="${FALLOS:+$FALLOS y }tags"
+        log_error "El destino rechazo parte de los tags. Detalle:"
+    fi
     printf "%s\n" "$TAG_OUTPUT" | while IFS= read -r line; do
         [ -n "$line" ] && printf "${C_DGRAY}    %s${C_RESET}\n" "$line"
     done
-    log_ok "Push de tags completado."
+    [ "$TAGS_OK" = true ] && log_ok "Push de tags completado."
+
+    if [ -n "$FALLOS" ]; then
+        log_info "Lo rechazado sigue solo en local. Trae los commits del destino ('git pull $TARGET_REMOTE <rama>'), resuelve y vuelve a ejecutar este script."
+        log_summary "FALLIDO" "push aditivo a $TARGET_REMOTE con $FALLOS rechazados"
+        exit 1
+    fi
 else
     log_warn "Ejecutando push --mirror a '$TARGET_REMOTE'..."
     log_warn "Esto sobreescribe el destino con espejo exacto de local."
@@ -256,7 +275,7 @@ if [ "$RESTORE_AS_ORIGIN" = true ]; then
             log_ok "origin actual conservado como '$BACKUP_NAME'."
         fi
         invoke_git "No se pudo promover $TARGET_REMOTE a origin." remote rename "$TARGET_REMOTE" origin
-        log_ok "'$TARGET_REMOTE' promovido a 'origin'. Los 19 scripts vuelven a trabajar contra el GitLab corporativo."
+        log_ok "'$TARGET_REMOTE' promovido a 'origin'. Los scripts de Git-Flow vuelven a trabajar contra el GitLab corporativo."
     fi
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
index b280883..965bf6f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
@@ -85,15 +85,28 @@ else
     log_warn "Rama $NAME retomada sin sincronizar con origin."
 fi
 
-# Buscar stash relacionado con esta rama
-stash_line=$(git stash list 2>/dev/null | grep "pause: $NAME" | head -1)
-if [ -n "$stash_line" ]; then
-    stash_ref=$(printf "%s" "$stash_line" | cut -d: -f1)
+# Buscar el stash que dejo pause-work.sh para ESTA rama.
+# TASK-142 (SCR-01): antes se hacia `grep "pause: $NAME"`, que tambien casaba
+# con ramas que empiezan igual (feature/a con feature/ab) y con metacaracteres
+# del nombre, y despues `stash pop` a secas, que aplica stash@{0} y no el
+# encontrado. Ahora el asunto tiene que terminar EXACTAMENTE en
+# "pause: <rama> AAAA-MM-DD" (el nombre entre comillas es literal en el
+# patron) y se aplica ese stash por su referencia.
+stash_ref=""
+stash_line=""
+while IFS=$'\t' read -r ref asunto; do
+    if [[ "$asunto" == *"pause: $NAME "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] ]]; then
+        stash_ref="$ref"
+        stash_line="$ref: $asunto"
+        break
+    fi
+done < <(git stash list --format='%gd%x09%gs' 2>/dev/null)
+if [ -n "$stash_ref" ]; then
     printf "\n${C_YELLOW}  Stash encontrado para esta rama:${C_RESET}\n"
     printf "${C_DGRAY}    %s${C_RESET}\n\n" "$stash_line"
     read -rp "  ¿Aplicar el stash guardado? [S/n]: " apply_stash
     if ! [[ "${apply_stash,,}" =~ ^n ]]; then
-        invoke_git "No se pudo aplicar el stash." stash pop
+        invoke_git "No se pudo aplicar el stash." stash pop "$stash_ref"
         log_ok "Stash aplicado correctamente."
     fi
 fi
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
index 8f8fefe..14331c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
@@ -1,7 +1,7 @@
 #!/usr/bin/env bash
 # GitFlow 21 — Switch Working Remote
 # Renombra el origin actual a un alias (backup) y promueve otro remoto a 'origin'.
-# Asi los 19 scripts existentes (que hablan con 'origin') trabajan contra el nuevo GitLab
+# Asi los scripts de Git-Flow (que hablan con 'origin') trabajan contra el nuevo GitLab
 # sin tocar ningun script. Reversible volviendo a ejecutar el comando con los nombres cambiados.
 
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
@@ -99,7 +99,7 @@ printf "    $BACKUP_NAME -> $CURRENT_ORIGIN_URL\n"
 printf "    ($NEW_ORIGIN se elimina como alias duplicado)\n"
 printf "${C_CYAN}  %s${C_RESET}\n\n" "$sep"
 
-printf "${C_WHITE}  Tras este cambio los 19 scripts GitFlow trabajaran contra:${C_RESET}\n"
+printf "${C_WHITE}  Tras este cambio los scripts de Git-Flow trabajaran contra:${C_RESET}\n"
 printf "${C_WHITE}    $NEW_ORIGIN_URL${C_RESET}\n\n"
 
 read -rp "  Confirmar la conmutacion? [s/N]: " confirm
````

## Excluido del diff (7 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-142/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-142/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-142/planificacion/brainstorm/peticion-unificador-1.md              | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-142/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-142/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-142/planificacion/plan-final.md                                    | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-142/tarea.md                                                       | 8 +++++++-
 7 files changed, 7 insertions(+), 1 deletion(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/disfraz-gitflow.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/disfraz-gitflow.test.ts | 170 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 170 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 90.1 s
- Commit verificado: 4ef84e1f9f88285a1a9517efdcd949171784463f
- Huella: 8600627b2f5b1c62a11da5ab417b70ed33b7a7ae
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 89656 bytes en total):

````
✔ merge-release-to-main.sh --tag SIN valor aborta con mensaje y sin tocar nada (no se ignora en silencio) (2467.8179ms)
✔ merge-release-to-main.sh sin --tag sigue poniendo el tag calculado (el flag es opcional) (5234.8834ms)
✔ merge-hotfix-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (10271.0664ms)
✔ merge-hotfix-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (3148.3007ms)
✔ merge-hotfix-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (16064.7438ms)
✔ merge-hotfix-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (3736.505ms)
✔ merge-hotfix-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (2308.2808ms)
✔ merge-release-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (5785.564ms)
✔ merge-release-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (2351.5164ms)
✔ merge-release-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (10018.5729ms)
✔ merge-release-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (2516.943ms)
✔ merge-release-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (1359.8599ms)
✔ origin (TASK-038): con origin inalcanzable el script responde en segundos y avisa, en vez de esperar a la red (8947.818ms)
✔ origin (TASK-038): detect_origin_available consulta la red una sola vez por invocacion (3647.6009ms)
✔ origin (TASK-038): sin origin configurado no se consulta la red (3018.5721ms)
✔ origin (TASK-038, IMPORTANTE de su revision): si la lista de ramas del destino expira, el mirror aborta y no borra nada (10352.2139ms)
✔ origin (TASK-038): el merge a develop con origin configurado pero caido se hace y avisa de que develop puede estar desfasada (7571.6339ms)
✔ create-develop.sh: sin origin crea develop en local y omite el push (antes: exit 1) (5453.9988ms)
✔ create-develop.sh: sin origin y con develop ya en local no intenta subirla (3723.753ms)
✔ create-develop.sh: sin origin y sin rama principal local falla con error claro (2694.8629ms)
✔ create-develop.sh: con origin (repo bare real) sigue creando y subiendo develop (10578.8722ms)
✔ create-develop.sh: origin configurado pero inaccesible aborta sin crear develop (2470.1788ms)
✔ recover-branch.sh: sin origin falla explicando que no hay remoto (antes: fatal de Git) (1913.5237ms)
✔ recover-branch.sh: origin configurado pero inaccesible falla distinguiendolo de "sin remoto" (2174.0708ms)
✔ recover-branch.sh: con origin (repo bare real) recupera la rama borrada en local (6691.9401ms)
✔ resume-work.sh: sin origin retoma la rama local y avisa de que no ha sincronizado (antes: exit 1) (2779.1904ms)
✔ resume-work.sh: sin origin y con rama inexistente falla dejando a la persona en su rama (1775.4876ms)
✔ resume-work.sh: origin configurado pero inaccesible NO aborta, sigue en local avisando (3004.243ms)
✔ resume-work.sh: con origin (repo bare real) sigue creando la copia local de una rama remota (6446.5973ms)
✔ resume-work.sh: con el workspace sucio remite a taskctl pause, no a "GitFlow 16" (1251.6914ms)
✔ resume-work.sh: con origin y rama inexistente remite a taskctl recover, no a "GitFlow 18" (3318.9343ms)
ℹ tests 737
ℹ suites 0
ℹ pass 737
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 66182.4431
[verificar-impacto] node --test termino con 0 en 66.3 s.
````
