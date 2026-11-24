# Peticion de revision — TASK-143b (ronda 2)

- Tarea: TASK-143b — argumentos, diagnose y push-back (parte b de TASK-143)
- Rama revisada: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
- Rama base: develop
- Commit revisado (HEAD): afecb22277f0052330f37cd564781ff3084edf5e
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-143b (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde f06802ca957056764c0804a643304f1a76f39972 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu
tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion
   ya trae la verificacion de la ronda en verde para ese mismo commit, no la
   repitas: cita ese resultado y corre solo los tests de lo que verificas.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-143b/tarea.md
- tareas/03-en-revision/TASK-143b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
- taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/argumentos-comunes.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh:249 | informe-revision-1.md |

## Commits a revisar (git log f06802ca957056764c0804a643304f1a76f39972..HEAD)

````
afecb22 fix(TASK-143b): ronda 1 (tests de prune y force del mirror, recorte y --main; textos del mirror; diagnose sin ruido)
eb26467 chore(TASK-143b): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff f06802ca957056764c0804a643304f1a76f39972..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
index 80fb8ea..d23591b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
@@ -10,7 +10,9 @@ log_info "Analizando estado del repositorio..."
 current=$(git branch --show-current 2>/dev/null || echo "(detached HEAD)")
 # TASK-143b (SCR-12): la deteccion comun, con su cache, y antes de
 # resolve_main_branch para que este no repita la consulta.
-detect_origin_available "Sin conexion con origin."
+# MEN-3 de su revision: su linea de [OK]/[WARN] no se ensena; el informe ya
+# trae la del remoto. Sin subshell, asi que REMOTE_AVAILABLE queda puesta.
+detect_origin_available "Sin conexion con origin." > /dev/null
 main_branch=$(resolve_main_branch "$MAIN_BRANCH")
 
 status_raw=$(git status --porcelain 2>/dev/null)
@@ -29,6 +31,9 @@ remote_color="$C_GREEN"
 $remote_ok || { remote_label="✗ sin conexión con origin"; remote_color="$C_YELLOW"; }
 
 develop_local=false; develop_remote=false
+# El nombre de develop solo se ensena si no es el de siempre (MEN-3 de su revision).
+develop_label=""
+[ "$DEVELOP_BRANCH" != "develop" ] && develop_label="$DEVELOP_BRANCH: "
 git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null && develop_local=true || true
 if $remote_ok; then
     _gf_ls_remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH" \
@@ -83,7 +88,7 @@ printf "  %-20s %s\n"     "Rama actual:"    "$current"
 printf "  %-20s ${workspace_color}%s${C_RESET}\n" "Workspace:"   "$workspace_label"
 printf "  %-20s ${remote_color}%s${C_RESET}\n"    "Remoto:"      "$remote_label"
 printf "  %-20s %s\n"     "Rama principal:" "$main_branch"
-printf "  %-20s %s\n"     "Develop:"        "$DEVELOP_BRANCH: $develop_info"
+printf "  %-20s %s\n"     "Develop:"        "$develop_label$develop_info"
 printf "${C_CYAN}  %s${C_RESET}\n" "$bar"
 printf "  Estado vs origin/%s:\n" "$current"
 if $remote_ok && git show-ref --verify --quiet "refs/remotes/origin/$current" 2>/dev/null; then
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
index 31649e9..e665db2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh
@@ -69,7 +69,7 @@ log_ok "Conexion con '$TARGET_REMOTE' verificada."
 if [ -z "$MODE" ]; then
     printf "\n${C_CYAN}  Modos disponibles para devolver el trabajo:${C_RESET}\n"
     printf "    ${C_GREEN}1) ADITIVO${C_RESET}  Envia ramas+tags locales. NO borra nada del destino.\n"
-    printf "    ${C_RED}2) MIRROR${C_RESET}   Sobreescribe el destino con espejo exacto de local.\n"
+    printf "    ${C_RED}2) MIRROR${C_RESET}   Sobreescribe las ramas y tags del destino con las de local.\n"
     printf "              ${C_RED}BORRA del destino lo que no exista en local (incluso tags).${C_RESET}\n"
     printf "\n"
     read -rp "  Elige modo [1=aditivo / 2=mirror]: " MODE_NUM
@@ -152,7 +152,7 @@ else
     bar=$(printf '!%.0s' {1..56})
     printf "\n${C_RED}  %s${C_RESET}\n" "$bar"
     printf "${C_RED}    ATENCION: MODO MIRROR SELECCIONADO${C_RESET}\n"
-    printf "${C_RED}    Se sobreescribira '$TARGET_REMOTE' con espejo EXACTO de local.${C_RESET}\n"
+    printf "${C_RED}    Se sobreescribira '$TARGET_REMOTE' con las ramas y tags EXACTOS de local.${C_RESET}\n"
     printf "${C_RED}  %s${C_RESET}\n\n" "$bar"
 
     if [ -n "$DIVERGED" ]; then
@@ -241,7 +241,7 @@ if [ "$MODE" = "additive" ]; then
     fi
 else
     log_warn "Ejecutando el mirror de ramas y tags a '$TARGET_REMOTE'..."
-    log_warn "Esto sobreescribe las ramas y tags del destino con espejo exacto de local."
+    log_warn "Esto sobreescribe las ramas y tags del destino con las de local."
     # TASK-143b (SCR-15): antes `push --mirror`, que sube TODAS las referencias
     # (refs/remotes de otros remotos, refs/notes, refs/stash...) y borra las
     # del destino que no esten en local, mientras la vista previa solo ensena
@@ -292,7 +292,7 @@ TAG_COUNT=$(git tag --list | wc -l | tr -d ' ')
 
 if [ "$MODE" = "mirror" ]; then
     printf "\n${C_GREEN}  Mirror aplicado a '$TARGET_URL':${C_RESET}\n"
-    printf "${C_GREEN}    $BRANCH_COUNT rama(s) + $TAG_COUNT tag(s) (espejo exacto de local)${C_RESET}\n"
+    printf "${C_GREEN}    $BRANCH_COUNT rama(s) + $TAG_COUNT tag(s) (espejo de las ramas y tags de local)${C_RESET}\n"
     if [ -n "$REMOTE_ONLY_BRANCHES" ]; then
         FINAL_RB=$(printf "%s\n" "$REMOTE_ONLY_BRANCHES" | wc -l | tr -d ' ')
         printf "${C_YELLOW}    $FINAL_RB rama(s) borradas del destino${C_RESET}\n"
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff f06802ca957056764c0804a643304f1a76f39972..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-143b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143b/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-143b/revision/informe-revision-1.md                                                  |  21 +++
 tareas/03-en-revision/TASK-143b/revision/peticion-revision-1.md                                                 | 692 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-143b/tarea.md                                                       |  11 +-
 11 files changed, 722 insertions(+), 2 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff f06802ca957056764c0804a643304f1a76f39972..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/argumentos-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/argumentos-comunes.test.ts | 54 +++++++++++++++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 53 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 207.6 s
- Commit verificado: afecb22277f0052330f37cd564781ff3084edf5e
- Huella: f18af6fe8a6bb289150d50e4b7550bd1316b7d28
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 81468 bytes en total):

````
✔ merge-release-to-main.sh --tag SIN valor aborta con mensaje y sin tocar nada (no se ignora en silencio) (3285.543ms)
✔ merge-release-to-main.sh sin --tag sigue poniendo el tag calculado (el flag es opcional) (7098.8207ms)
✔ merge-hotfix-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (18979.2538ms)
✔ merge-hotfix-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (4922.8124ms)
✔ merge-hotfix-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (24008.4167ms)
✔ merge-hotfix-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (5370.1711ms)
✔ merge-hotfix-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (3149.8042ms)
✔ merge-release-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (8831.4512ms)
✔ merge-release-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (2866.3957ms)
✔ merge-release-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (16345.3417ms)
✔ merge-release-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (4188.3928ms)
✔ merge-release-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (2445.6938ms)
✔ origin (TASK-038): con origin inalcanzable el script responde en segundos y avisa, en vez de esperar a la red (16472.1077ms)
✔ origin (TASK-038): detect_origin_available consulta la red una sola vez por invocacion (5237.397ms)
✔ origin (TASK-038): sin origin configurado no se consulta la red (3284.4609ms)
✔ origin (TASK-038, IMPORTANTE de su revision): si la lista de ramas del destino expira, el mirror aborta y no borra nada (13183.064ms)
✔ origin (TASK-038): el merge a develop con origin configurado pero caido se hace y avisa de que develop puede estar desfasada (9951.6597ms)
✔ create-develop.sh: sin origin crea develop en local y omite el push (antes: exit 1) (11056.1251ms)
✔ create-develop.sh: sin origin y con develop ya en local no intenta subirla (6104.7137ms)
✔ create-develop.sh: sin origin y sin rama principal local falla con error claro (4113.5016ms)
✔ create-develop.sh: con origin (repo bare real) sigue creando y subiendo develop (13779.1512ms)
✔ create-develop.sh: origin configurado pero inaccesible aborta sin crear develop (4368.0914ms)
✔ recover-branch.sh: sin origin falla explicando que no hay remoto (antes: fatal de Git) (2401.5251ms)
✔ recover-branch.sh: origin configurado pero inaccesible falla distinguiendolo de "sin remoto" (3213.3663ms)
✔ recover-branch.sh: con origin (repo bare real) recupera la rama borrada en local (10051.0141ms)
✔ resume-work.sh: sin origin retoma la rama local y avisa de que no ha sincronizado (antes: exit 1) (3774.3399ms)
✔ resume-work.sh: sin origin y con rama inexistente falla dejando a la persona en su rama (2388.1068ms)
✔ resume-work.sh: origin configurado pero inaccesible NO aborta, sigue en local avisando (3755.6574ms)
✔ resume-work.sh: con origin (repo bare real) sigue creando la copia local de una rama remota (8485.0976ms)
✔ resume-work.sh: con el workspace sucio remite a taskctl pause, no a "GitFlow 16" (2275.4174ms)
✔ resume-work.sh: con origin y rama inexistente remite a taskctl recover, no a "GitFlow 18" (5526.7959ms)
ℹ tests 798
ℹ suites 0
ℹ pass 798
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 168732.0947
[verificar-impacto] node --test termino con 0 en 169.1 s.
````
