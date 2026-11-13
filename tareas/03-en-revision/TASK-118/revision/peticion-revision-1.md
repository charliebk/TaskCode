# Peticion de revision — TASK-118 (ronda 1)

- Tarea: TASK-118 — P-10: linea FIN con la duracion en todos los scripts de Git-Flow
- Rama revisada: feature/task-118-p-10-linea-fin-con-la-duracion-en-todos
- Rama base: develop
- Commit revisado (HEAD): 946b85a5f07392b5d0a87c1ac4bb92929b0e6593
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-118 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-118/tarea.md
- tareas/03-en-revision/TASK-118/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/trampas.md
- taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/linea-fin.test.ts

## Commits a revisar (git log develop..HEAD)

````
946b85a feat(TASK-118): los scripts de Git-Flow cierran su registro con una linea FIN
f5c8049 chore(TASK-118): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index f104d5a..2f44107 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -83,6 +83,33 @@ initialize_gitflow_log() {
         { printf "\n"; printf "%s\n" "$sep"; } >> "$GF_LOG_FILE"
     fi
     _do_log "INFO " "INICIO: $GF_OPERATION"
+    # TASK-118: el registro termina SIEMPRE con una linea FIN, tambien cuando
+    # el script aborta con un exit intermedio. Ningun script que registra
+    # pone su propio trap de EXIT.
+    GF_RESULTADO=""
+    trap '_gf_fin $?' EXIT
+}
+
+# _gf_fin: la linea FIN del registro (solo en el fichero, no en pantalla):
+#   [fecha hora] [FIN  ] FIN: <operacion> | resultado: <R> | duracion: <N>s
+# R es el de log_summary si el script salio 0 tras el resumen, ABORTADO si
+# salio 0 sin resumen y "ERROR (codigo N)" si salio con otro codigo.
+GF_RESULTADO=""
+_gf_fin() {
+    local codigo="$1" resultado fin duracion="?"
+    if [ "$codigo" != "0" ]; then
+        resultado="ERROR (codigo $codigo)"
+    elif [ -n "$GF_RESULTADO" ]; then
+        resultado="$GF_RESULTADO"
+    else
+        resultado="ABORTADO"
+    fi
+    if [ -n "$GF_START" ]; then
+        _gf_epoch fin
+        duracion="$((fin - GF_START))"
+    fi
+    _do_log "FIN  " "FIN: ${GF_OPERATION:-operacion} | resultado: $resultado | duracion: ${duracion}s"
+    return 0
 }
 
 # _do_log: escribe la linea en el fichero de log y la deja en GF_LINE.
@@ -105,6 +132,7 @@ log_error() { _do_log "ERROR" "$1"; printf "${C_RED}%s${C_RESET}\n"    "$GF_LINE
 
 log_summary() {
     local result="${1:-COMPLETADO}" extra="${2:-}" elapsed="?" icon="[OK]"
+    GF_RESULTADO="$result"
     if [ -n "$GF_START" ]; then
         local end
         _gf_epoch end
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/trampas.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/trampas.md
index f460614..e196112 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/trampas.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/trampas.md
@@ -19,7 +19,10 @@ arbol de trabajo a proposito: durante
 mucho tiempo lo escribian dentro del repo, nada mas arrancar y antes de mirar
 si el workspace estaba limpio, asi que **se ensuciaban el workspace ellos
 mismos** y el comando de reanudar quedaba inservible en cualquier repo que no
-ignorara esa ruta. No hace falta anadir nada al `.gitignore`.
+ignorara esa ruta. No hace falta anadir nada al `.gitignore`. Cada ejecucion
+termina su registro con una linea
+`FIN: <operacion> | resultado: <R> | duracion: <N>s`, tambien cuando aborta
+(`ABORTADO`, o `ERROR (codigo N)`): es la que dice como acabo y cuanto tardo.
 
 **La herramienta commitea solo lo que escribe** (mas las rutas de
 sincronizacion, si las hay): nunca un `git add` global. Los ficheros que se le
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-118/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-118/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-118/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/linea-fin.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/linea-fin.test.ts | 88 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 88 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 115.1 s

Final de la salida (truncada: 102692 bytes en total):

````
✔ merge-release-to-main.sh --tag SIN valor aborta con mensaje y sin tocar nada (no se ignora en silencio) (2702.081ms)
✔ merge-release-to-main.sh sin --tag sigue poniendo el tag calculado (el flag es opcional) (6373.519ms)
✔ merge-hotfix-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (8653.7063ms)
✔ merge-hotfix-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (4359.0398ms)
✔ merge-hotfix-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (24170.9641ms)
✔ merge-hotfix-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (6255.7031ms)
✔ merge-hotfix-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (4565.8488ms)
✔ merge-release-to-main.sh: sin origin hace merge + tag + backmerge en modo local (antes: exit 1) (7569.3038ms)
✔ merge-release-to-main.sh: sin origin y sin rama principal local falla con error claro, no con un fetch roto (2470.3111ms)
✔ merge-release-to-main.sh: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge (21357.8103ms)
✔ merge-release-to-main.sh: origin configurado pero inaccesible aborta sin merge ni tag (hallazgo IMPORTANTE de revision) (3243.0083ms)
✔ merge-release-to-main.sh: sin origin y con rama de trabajo inexistente falla dejando a la persona en su rama (hallazgo MENOR de revision) (1587.2951ms)
✔ origin (TASK-038): con origin inalcanzable el script responde en segundos y avisa, en vez de esperar a la red (7393.2966ms)
✔ origin (TASK-038): detect_origin_available consulta la red una sola vez por invocacion (4977.6018ms)
✔ origin (TASK-038): sin origin configurado no se consulta la red (6394.0165ms)
✔ origin (TASK-038, IMPORTANTE de su revision): si la lista de ramas del destino expira, el mirror aborta y no borra nada (11152.3927ms)
✔ origin (TASK-038): el merge a develop con origin configurado pero caido se hace y avisa de que develop puede estar desfasada (12446.7627ms)
✔ create-develop.sh: sin origin crea develop en local y omite el push (antes: exit 1) (4183.2069ms)
✔ create-develop.sh: sin origin y con develop ya en local no intenta subirla (3877.8281ms)
✔ create-develop.sh: sin origin y sin rama principal local falla con error claro (3511.0008ms)
✔ create-develop.sh: con origin (repo bare real) sigue creando y subiendo develop (14720.5336ms)
✔ create-develop.sh: origin configurado pero inaccesible aborta sin crear develop (3192.3444ms)
✔ recover-branch.sh: sin origin falla explicando que no hay remoto (antes: fatal de Git) (2199.5895ms)
✔ recover-branch.sh: origin configurado pero inaccesible falla distinguiendolo de "sin remoto" (6974.3612ms)
✔ recover-branch.sh: con origin (repo bare real) recupera la rama borrada en local (11385.8797ms)
✔ resume-work.sh: sin origin retoma la rama local y avisa de que no ha sincronizado (antes: exit 1) (3271.5195ms)
✔ resume-work.sh: sin origin y con rama inexistente falla dejando a la persona en su rama (2026.8647ms)
✔ resume-work.sh: origin configurado pero inaccesible NO aborta, sigue en local avisando (3445.4962ms)
✔ resume-work.sh: con origin (repo bare real) sigue creando la copia local de una rama remota (11309.3274ms)
✔ resume-work.sh: con el workspace sucio remite a taskctl pause, no a "GitFlow 16" (3266.0947ms)
✔ resume-work.sh: con origin y rama inexistente remite a taskctl recover, no a "GitFlow 18" (7892.0756ms)
ℹ tests 874
ℹ suites 0
ℹ pass 874
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 90472.4816
[verificar-impacto] node --test termino con 0 en 90.6 s.
````
