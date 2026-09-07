# Peticion de revision — TASK-029 (ronda 1)

- Tarea: TASK-029 — Bug de origin sin guard y deuda de los scripts de Git-Flow
- Rama revisada: fix/task-029-bug-de-origin-sin-guard-y-deuda-de-los-s
- Rama base: develop
- Commit revisado (HEAD): 0e5c155d913e0ef91767bb521cfa543b81d58fba
- Fecha: 2026-09-07
- Agente revisor sugerido: general-purpose

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
0e5c155 fix(TASK-029): cierra los cuatro frentes de deuda de los scripts de Git-Flow (item C6)
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/contexto/HALLAZGOS.md b/docs/contexto/HALLAZGOS.md
index 8250105..baa77c6 100644
--- a/docs/contexto/HALLAZGOS.md
+++ b/docs/contexto/HALLAZGOS.md
@@ -136,45 +136,86 @@ repo.** Dentro, ensucian el workspace y abortan el propio import.
 
 ## Git-Flow: deuda conocida
 
-- **Los scripts se escriben su propio registro dentro del repo del
-  usuario** (`initialize_gitflow_log` crea `logs/gitflow/` nada más
-  arrancar, en cualquiera de ellos). En un repo que no ignore `logs/`, el
-  script **ensucia el workspace por su cuenta antes de mirarlo**: es por eso
-  que `pause-work.sh` acaba preguntando qué hacer con un directorio que
-  acaba de crear él. Está documentado desde TASK-007 y lo destapó otra vez
-  la revisión de TASK-026. El repo TaskCode lo ignora (`.gitignore`, línea
-  14) y los tests de comandos replican ese `.gitignore` en sus repos
-  temporales **a propósito**, no por adorno. `taskctl pause` sin terminal lo
-  comprueba con `git check-ignore` y aborta explicándolo — preguntando por el
-  fichero que se escribe y con `--no-index`, que si no un `.gitignore` con
-  `logs/gitflow/` o con `*.log`, o un `logs/.gitkeep` trackeado, dan la
-  respuesta contraria a la verdadera.
-
-  La misma trampa deja **`taskctl resume` inservible** en un repo que no
-  ignore el registro: aborta con *"El workspace no está limpio"* cuando la
-  única suciedad es la que acaba de crear el propio script, y remite a un
-  `pause` que también abortaría. Ahí no hay guard, a propósito: el arreglo
-  de raíz es del lado de los scripts (C6), y taparlo desde el wrapper
-  extendería su guard a un caso que no tiene que ver con la interactividad.
-- **Los mensajes de los scripts siguen remitiendo a los menús de IntelliJ**
-  (*"usa GitFlow 16 Pause Work"*, *"GitFlow 17 Resume Work"*, *"GitFlow 18
-  Recover Branch"*, *"GitFlow 19 Abort Merge"*) aunque desde TASK-026 esos
-  cuatro comandos existan ya como `taskctl pause` / `resume` / `recover` /
-  `abort-merge`. Sin corregir: envolver y reescribir los scripts son dos
-  trabajos distintos, y el segundo es del item C6.
-- **`abort-merge.sh` solo conoce merge y rebase.** Con un `cherry-pick` o un
-  `revert` a medias dice *"El workspace está en estado normal"* y sale 0 —
-  mensaje falso. `operacionEnCurso` (TASK-026) mira exactamente los mismos
-  tres testigos que el script, a propósito: hacer que taskctl detectara más
-  que él daría dos comportamientos distintos según haya terminal o no. Para
-  C6.
-- **Bug de `origin` sin guard** en 3 scripts que siguen sin corregir:
-  `create-develop.sh`, `recover-branch.sh`, `resume-work.sh` (item C6). Los
-  dos `merge-*-to-main` se corrigieron en B2 (2026-09-05) con un matiz que
-  añadió la revisión por pares: distinguen "sin origin configurado" (modo
-  local, como los merge a develop) de "origin configurado que no responde"
-  (abortan con instrucción, porque el tag de release se crearía sobre una
-  `main` posiblemente obsoleta respecto al remoto).
+**Los cuatro primeros puntos de esta sección se cerraron en TASK-029 (item
+C6, 2026-09-07).** Se dejan escritos porque el *porqué* de cada decisión
+sigue valiendo, y porque dos de ellos cambiaron la solución al medirla.
+
+- **El registro ya no se escribe en el workspace del usuario.**
+  `initialize_gitflow_log` creaba `logs/gitflow/` en el repo del usuario nada
+  más arrancar, en los 24 scripts: **ensuciaba el workspace antes de
+  mirarlo**, por eso `pause-work.sh` acababa preguntando qué hacer con un
+  directorio que acababa de crear él, y por eso `taskctl resume` era
+  inservible ahí (abortaba con *"El workspace no está limpio"* y remitía a un
+  `pause` que también abortaría). Documentado desde TASK-007, redestapado por
+  la revisión de TASK-026.
+
+  Ahora va a `.git/taskcode/gitflow/`, resuelto con `git rev-parse
+  --git-path` — no concatenando sobre `--git-dir`, para que siga valiendo en
+  un worktree enlazado. `.git/` no forma parte del árbol de trabajo, así que
+  `git status` no lo ve **nunca**, con `.gitignore` o sin él: la clase entera
+  de problema desaparece en vez de taparse. Detalle que costó un `mkdir`:
+  `--git-path` devuelve la ruta **relativa al cwd**, hay que absolutizarla.
+
+  Consecuencia: **el segundo guard de `taskctl pause` se quitó**, con sus
+  tests y con `isIgnored` entera (`src/fs/git.ts`), que se quedó sin ningún
+  consumidor. Existía solo por la suciedad autoinfligida. Se recupera con
+  `git show` si vuelve a hacer falta; llevaba dentro dos detalles que
+  costaron una ronda de revisión en TASK-026: `--no-index` (sin él, algo ya
+  en el índice hace que `check-ignore` conteste lo contrario de lo que dice
+  el `.gitignore`) y preguntar por el fichero y no por su carpeta (`*.log`
+  ignora el registro sin ignorar `logs/`). El primer guard —no hay terminal
+  interactiva— sigue en pie: ese sí es real.
+- **Los mensajes ya no remiten a los menús de IntelliJ.** Decían *"usa
+  GitFlow 16 Pause Work"* y compañía, herencia de las run configurations de
+  las que salieron los scripts. Los cuatro con equivalente real ahora citan
+  `taskctl pause` / `resume` / `recover` / `abort-merge`.
+
+  Los de "GitFlow 20/21" (mirror y switch) **no se tradujeron a un comando**:
+  no existen en `taskctl`, y los cinco wrappers son exactamente `diagnose`,
+  `pause`, `resume`, `recover` y `abort-merge`. Ahí se nombra el script. Es
+  la misma disciplina que la sección "Lo que NO existe" de la skill:
+  documentar un comando inexistente ya nos ha costado tiempo.
+- **`abort-merge.sh` ya conoce cherry-pick y revert — y un tercer testigo que
+  el plan no había previsto.** Antes decía *"El workspace está en estado
+  normal"* y salía 0 con cualquiera de los dos a medias.
+
+  Al medirlo (no al razonarlo) apareció que `CHERRY_PICK_HEAD` y
+  `REVERT_HEAD` **no bastan**: si resuelves el conflicto y haces `git commit`
+  en vez de `--continue`, Git borra el testigo, la secuencia sigue viva,
+  `--abort` sigue funcionando y lo único que queda es el directorio
+  `.git/sequencer/`. Se añadió como tercer testigo; la primera línea de su
+  `todo` (`pick` / `revert`) distingue cuál es. En sentido contrario,
+  `cherry-pick -n` no deja **ningún** rastro y el propio Git se niega a
+  abortar: ahí decir "estado normal" es correcto, y hay un test que lo fija.
+
+  `operacionEnCurso` mira los mismos testigos que el script, en el mismo
+  orden, y eso sigue siendo deliberado desde TASK-026: si taskctl detectara
+  más que él, habría dos comportamientos según haya terminal o no.
+- **El bug de `origin` sin guard está cerrado en los tres scripts que
+  quedaban**: `create-develop.sh`, `recover-branch.sh` y `resume-work.sh`,
+  con `detect_origin_available` y cubiertos por
+  `test/gitflow/origin-guard.test.ts`. La respuesta correcta resultó ser
+  distinta por script, y no "modo local" en los tres:
+
+  - `create-develop` **aborta** con origin caído: no se puede saber si
+    `develop` ya existe en el remoto, y crearla desde una principal
+    posiblemente obsoleta dejaría una divergencia que el push haría
+    permanente. Misma clase de daño que el tag de B2.
+  - `recover-branch` **falla siempre** sin remoto: su propósito entero es
+    traerse una rama de `origin`, así que no hay modo local posible. El
+    arreglo aquí es fallar con un mensaje que se entienda, no fingir éxito.
+  - `resume-work` **no aborta** nunca: retomar una rama local no publica
+    nada, y abortar rompería el caso central de volver a tu rama con la VPN
+    caída. Solo avisa.
+
+  **Lo que queda vivo**: `create-hotfix.sh` y `create-release.sh` llevan su
+  copia inline de TASK-009, anterior a la extracción de B2, así que detectan
+  si hay remoto pero **no distinguen "sin origin" de "origin caído"**. No es
+  el bug original —no mueren con el `fatal:` de Git— pero es la misma lógica
+  duplicada en dos sitios y con menos criterio que la compartida. Y
+  `detect_origin_available` imprime *"Se continuara en modo local"* también
+  cuando quien la llama aborta acto seguido, así que en `recover-branch` y en
+  `create-develop` sale una línea que contradice a la siguiente.
 - **Confirmado por la revisión de B2 (preexistente, sin corregir)**: ejecutar
   dos veces un `merge-*-to-main` con el mismo nombre muere en el tag
   duplicado (`exit 1`, sin mensaje de guía), y un conflicto en el backmerge
diff --git a/tareas/01-en-diseno/TASK-029/tarea.md b/tareas/01-en-diseno/TASK-029/tarea.md
deleted file mode 100644
index e8ead52..0000000
--- a/tareas/01-en-diseno/TASK-029/tarea.md
+++ /dev/null
@@ -1,25 +0,0 @@
----
-id: TASK-029
-titulo: "Bug de origin sin guard y deuda de los scripts de Git-Flow"
-tipo: fix
-sprint: 0
-etiquetas: []
-complejidad: media
-modelo_sugerido: sonnet
-estado: en-diseno
-plan_aprobado: true
-rama: fix/task-029-bug-de-origin-sin-guard-y-deuda-de-los-s
-asignado_a: charlie.bk@gmail.com
-agente_revisor: general-purpose
-skills_recomendados: []
-ultimo_commit_revisado: null
-revision_codex: false
-creado: 2026-09-07
-actualizado: 2026-09-07
-dependencias: []
----
-## Objetivo
-
-
-## Criterios de aceptacion
-- [ ] 
diff --git a/tareas/01-en-diseno/TASK-029/planificacion/plan-final.md b/tareas/02-en-curso/TASK-029/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-029/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-029/planificacion/plan-final.md
diff --git a/tareas/02-en-curso/TASK-029/tarea.md b/tareas/02-en-curso/TASK-029/tarea.md
new file mode 100644
index 0000000..843e4c7
--- /dev/null
+++ b/tareas/02-en-curso/TASK-029/tarea.md
@@ -0,0 +1,61 @@
+---
+id: TASK-029
+titulo: "Bug de origin sin guard y deuda de los scripts de Git-Flow"
+tipo: fix
+sprint: 0
+etiquetas: []
+complejidad: media
+modelo_sugerido: sonnet
+estado: en-curso
+plan_aprobado: true
+rama: fix/task-029-bug-de-origin-sin-guard-y-deuda-de-los-s
+asignado_a: charlie.bk@gmail.com
+agente_revisor: general-purpose
+skills_recomendados: []
+ultimo_commit_revisado: null
+revision_codex: false
+creado: 2026-09-07
+actualizado: 2026-09-07
+dependencias: []
+---
+## Objetivo
+
+Item **C6** del checklist de terminacion: cerrar los cuatro frentes de deuda
+que arrastran los scripts de Git-Flow, todos documentados en
+`HALLAZGOS.md` (seccion "Git-Flow: deuda conocida"). El item nacio siendo
+solo el bug de `origin`; C1 (TASK-026) le anadio los otros tres al envolver
+los scripts con `taskctl`, y la estimacion de ~1h del checklist se quedo
+obsoleta.
+
+## Criterios de aceptacion
+
+Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
+`taskctl new` deja esta seccion vacia — a diferencia de `import`, que los
+extrae del fichero de entrada.
+
+**S1 — guard de `origin`**
+- [ ] `create-develop.sh` sin remoto crea `develop` en local, omite el push con aviso explicito y sale 0.
+- [ ] `recover-branch.sh` sin remoto falla con un mensaje que se entiende (exit 1), en vez de con el error crudo de Git. No finge exito.
+- [ ] `resume-work.sh` sin remoto resuelve la rama en local, omite `fetch` y `ls-remote`, y avisa de que no ha sincronizado.
+- [ ] Test nuevo `test/gitflow/origin-guard.test.ts` con repos Git temporales reales; falla si se revierte el arreglo.
+
+**S2 — el registro sale del workspace del usuario**
+- [ ] `initialize_gitflow_log` escribe en `.git/` resuelto con `git rev-parse --git-path`, no en `<repo>/logs/gitflow/`.
+- [ ] Tras ejecutar cualquier script en un repo temporal sin `.gitignore`, `git status --porcelain` sale vacio.
+- [ ] Se conserva la salvaguarda de TASK-008: sin repo Git no se escribe fichero.
+- [ ] El segundo guard de `taskctl pause` (el de `isIgnored`) se elimina con sus tests, **o** se conserva documentando por que si la demostracion empirica no lo respalda.
+- [ ] `smoke-test.sh` deja de aseverar sobre la ruta vieja.
+
+**S3 — los mensajes dejan de remitir a menus de IntelliJ**
+- [ ] Los cuatro mensajes con equivalente real citan `taskctl pause | resume | recover | abort-merge`.
+- [ ] Los de "GitFlow 20/21" nombran el script: no se inventa un comando que no existe.
+
+**S4 — `abort-merge` conoce cherry-pick y revert**
+- [ ] Con un cherry-pick o un revert a medias, el script deja de decir "estado normal" y ofrece abortarlo.
+- [ ] `operacionEnCurso` mira **los mismos testigos** que el script, para que `taskctl` no detecte ni mas ni menos que el.
+- [ ] Tests nuevos que fallan si se revierte el arreglo.
+
+**Transversal**
+- [ ] Suite en verde: los 3 rojos conocidos de Windows y ninguno mas.
+- [ ] Revision por pares independiente, con hallazgos clasificados y documentados incluidos los no corregidos.
+- [ ] Checklist, contadores y estimacion del item C6 actualizados.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
index 3a60fc9..3cb7269 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
@@ -16,9 +16,18 @@ sino dentro del plugin instalado:
 
 1. **`log_dir`** (usado por `initialize_gitflow_log`): antes calculaba la
    raíz del proyecto contando 3 niveles de carpeta hacia arriba desde el
-   propio script. Ahora usa `git rev-parse --show-toplevel`, así que
-   `logs/gitflow/` siempre se escribe dentro del repo del usuario, sin
-   importar desde qué profundidad se invoque el script.
+   propio script. Ahora se lo pregunta a Git, así que el registro siempre
+   se escribe dentro del repo del usuario, sin importar desde qué
+   profundidad se invoque el script. **Desde TASK-029** esa ruta es
+   `$(git rev-parse --git-path taskcode/gitflow)/gitflow-YYYY-MM-DD.log`,
+   es decir dentro de `.git/`, y ya no `<repo>/logs/gitflow/`: el sitio
+   anterior estaba en el árbol de trabajo, así que el script ensuciaba el
+   workspace del usuario nada más arrancar y antes de mirarlo — por eso
+   `pause-work.sh` acababa preguntando qué hacer con un directorio que
+   acababa de crear él mismo. `.git/` no lo ve `git status` nunca, con
+   `.gitignore` o sin él, así que el repo del usuario no necesita ignorar
+   nada. Se usa `--git-path` y no se concatena sobre `--git-dir` para que
+   siga valiendo dentro de un *worktree* enlazado.
 2. **`invoke_merge_work_branch_to_develop`**: antes hacía `fetch origin`
    sin comprobar si el remoto existía, y fallaba duro (`exit 1`) en
    cualquier repo sin `origin` configurado — como el propio `TaskCode`
@@ -45,24 +54,30 @@ IntelliJ en Windows. Se recomienda una prueba rápida (`bash --version`, o
 `taskctl new` de verdad) la próxima vez que alguien del equipo tenga esa
 sesión abierta — ver `docs/spikes/TASK-007-resultado.md`.
 
-## Hallazgo abierto (parcialmente corregido en TASK-009): el mismo bug de `origin` existia en mas scripts
+## Hallazgo cerrado en TASK-029: el mismo bug de `origin` existia en mas scripts
 
 Al migrar (TASK-008) se encontro que el patron de "`fetch origin` sin
 comprobar disponibilidad" del hallazgo 4 **no estaba solo en
 `invoke_merge_work_branch_to_develop`**. Aparecia, con su propia copia de
-logica (no comparten la funcion corregida), en:
-
-- ~~`create-hotfix.sh`, `create-release.sh`~~ — **corregidos en TASK-009**
-  (mismo guard `REMOTE_AVAILABLE`), porque sin ellos `taskctl start`
-  fallaria siempre para tareas `hotfix`/`release` en un repo sin origin
-  como el propio TaskCode.
-- `create-develop.sh` — sin corregir. No lo toca ningun comando de
-  `taskctl` (no es un tipo de tarea; es un script de inicializacion de
-  repo, fuera del flujo por-tarea).
-- `merge-hotfix-to-main.sh`, `merge-release-to-main.sh` — sin corregir,
-  precondicion explicita de TASK-014 (`taskctl finish`).
-- `recover-branch.sh`, `resume-work.sh` — sin corregir, no forman parte
-  todavia del flujo de ningun comando de `taskctl`.
+logica, en seis scripts mas. Historia de como se cerro:
+
+- ~~`create-hotfix.sh`, `create-release.sh`~~ — **corregidos en TASK-009**,
+  porque sin ellos `taskctl start` fallaria siempre para tareas
+  `hotfix`/`release` en un repo sin origin como el propio TaskCode.
+- ~~`merge-hotfix-to-main.sh`, `merge-release-to-main.sh`~~ — **corregidos
+  en el item B2** (2026-09-05), que ademas extrajo la logica a
+  `detect_origin_available` en `_gitflow-common.sh` y le anadio la
+  distincion entre "sin origin configurado" y "origin configurado que no
+  responde".
+- ~~`create-develop.sh`, `recover-branch.sh`, `resume-work.sh`~~ —
+  **corregidos en TASK-029** (item C6), ya con la funcion compartida.
+  Cubiertos por `test/gitflow/origin-guard.test.ts`.
+
+**Lo que queda**: `create-hotfix.sh` y `create-release.sh` siguen llevando
+su copia inline de TASK-009, anterior a la extraccion de B2, asi que
+detectan si hay remoto pero **no distinguen "sin origin" de "origin caido"**.
+No es el bug original —no mueren con el `fatal:` de Git— pero es la misma
+logica duplicada en dos sitios y con menos criterio que la compartida.
 
 ## Hallazgo real de TASK-009: `moveTareaFile` y el checkout de hotfix/release
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
index 21a7161..6a7c134 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh
@@ -14,20 +14,52 @@ C_CYAN="\033[36m";  C_WHITE="\033[97m";  C_DGRAY="\033[90m"; C_RESET="\033[0m"
 initialize_gitflow_log() {
     GF_OPERATION="$1"
     GF_START=$(date +%s)
-    # Ajuste TASK-008 (hallazgo 1 de TASK-007): antes se calculaba contando
-    # niveles de carpeta desde el script (valido solo en la ubicacion
-    # original .idea/runConfigurations/local_git-flow-actions/). Al vivir
-    # ahora dentro del plugin instalado, se usa la raiz real del repo del
-    # USUARIO, no la del script.
+    # Ajuste TASK-008 (hallazgo 1 de TASK-007): antes la ruta se calculaba
+    # contando niveles de carpeta desde el script (valido solo en la
+    # ubicacion original .idea/runConfigurations/local_git-flow-actions/).
+    # Al vivir ahora dentro del plugin instalado, se le pregunta a Git por
+    # el repo del USUARIO en vez de deducirlo de la ruta del script.
     # Hallazgo menor de revision por pares (TASK-008): si no hay repo Git
     # en absoluto en el cwd, no se escribe log a fichero (GF_LOG_FILE
-    # vacio) en vez de crear logs/gitflow/ como basura fuera de cualquier
-    # repo — el resto de funciones de log ya toleran GF_LOG_FILE vacio.
-    local log_dir repo_root
-    repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || repo_root=""
-    if [ -n "$repo_root" ]; then
-        log_dir="$repo_root/logs/gitflow"
-        mkdir -p "$log_dir"
+    # vacio) en vez de crear el directorio del registro como basura fuera
+    # de cualquier repo — el resto de funciones de log ya toleran
+    # GF_LOG_FILE vacio. Esa salvaguarda se conserva: aqui la da el
+    # propio `git rev-parse`, que sale 128 y deja log_dir vacio.
+    #
+    # Ajuste TASK-029 (item C6): el registro deja de escribirse en
+    # <repo>/logs/gitflow/ y pasa a vivir dentro de .git/. El sitio
+    # anterior ensuciaba el arbol de trabajo del usuario nada mas
+    # arrancar cualquiera de los 24 scripts, ANTES de que el script
+    # mirase el workspace: por eso pause-work.sh acababa preguntando
+    # que hacer con un directorio que acababa de crear el mismo, y por
+    # eso `taskctl resume` era inservible en un repo que no ignorase
+    # logs/ (abortaba con "El workspace no esta limpio" y remitia a un
+    # `pause` que tambien habria abortado). Razones de ESTA ruta:
+    #
+    #   - .git/ no forma parte del arbol de trabajo, asi que
+    #     `git status` no lo ve NUNCA, con .gitignore o sin el. La
+    #     clase entera de problema desaparece en vez de taparse con un
+    #     patron en el .gitignore de cada repo del usuario.
+    #   - Se usa `--git-path` y NO se concatena sobre `--git-dir`: asi
+    #     sigue valiendo dentro de un worktree enlazado, donde el
+    #     directorio propio del worktree cuelga de
+    #     .git/worktrees/<nombre>/ y no del .git principal. Es el mismo
+    #     criterio que usa `operacionEnCurso` en src/fs/git.ts, por el
+    #     mismo motivo.
+    #   - El registro sigue siendo por repo y auditable, que era lo que
+    #     se buscaba al meterlo dentro del repo.
+    #
+    # `--git-path` devuelve una ruta relativa al cwd (p. ej.
+    # ".git/taskcode/gitflow" desde la raiz), asi que se absolutiza tras
+    # crearla para que GF_LOG_FILE siga siendo valido pase lo que pase.
+    local log_dir=""
+    log_dir="$(git rev-parse --git-path taskcode/gitflow 2>/dev/null)" || log_dir=""
+    if [ -n "$log_dir" ] && mkdir -p "$log_dir" 2>/dev/null; then
+        log_dir="$(cd "$log_dir" && pwd)"
+    else
+        log_dir=""
+    fi
+    if [ -n "$log_dir" ]; then
         GF_LOG_FILE="$log_dir/gitflow-$(date +%Y-%m-%d).log"
         local sep
         sep=$(printf '=%.0s' {1..60})
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh
index 01c7b84..a78f607 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/abort-merge.sh
@@ -8,11 +8,30 @@ current=$(git branch --show-current 2>/dev/null || echo "(detached HEAD)")
 # ── Detectar operación en curso ───────────────────────────────────────────────
 merge_in_progress=false
 rebase_in_progress=false
+cherry_pick_in_progress=false
+revert_in_progress=false
 [ -f "$git_dir/MERGE_HEAD" ]                                            && merge_in_progress=true
 { [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; } && rebase_in_progress=true
+[ -f "$git_dir/CHERRY_PICK_HEAD" ]                                      && cherry_pick_in_progress=true
+[ -f "$git_dir/REVERT_HEAD" ]                                           && revert_in_progress=true
 
-if ! $merge_in_progress && ! $rebase_in_progress; then
-    log_info "No hay ningún merge ni rebase en curso en la rama '$current'."
+# Una secuencia multi-commit puede quedar a medias SIN ninguno de los dos
+# testigos de arriba: si se resuelve el conflicto y se hace "git commit" a
+# mano en vez de "--continue", Git borra CHERRY_PICK_HEAD pero deja
+# .git/sequencer con los commits que faltan, y "--abort" sigue funcionando
+# (medido en git 2.55). El testigo ahí es el directorio; la primera línea
+# de su "todo" ("pick ..." / "revert ...") dice cuál de las dos es.
+if ! $cherry_pick_in_progress && ! $revert_in_progress && [ -d "$git_dir/sequencer" ]; then
+    if grep -qE '^revert ' "$git_dir/sequencer/todo" 2>/dev/null; then
+        revert_in_progress=true
+    else
+        cherry_pick_in_progress=true
+    fi
+fi
+
+if ! $merge_in_progress && ! $rebase_in_progress \
+   && ! $cherry_pick_in_progress && ! $revert_in_progress; then
+    log_info "No hay ningún merge, rebase, cherry-pick ni revert en curso en la rama '$current'."
     printf "${C_DGRAY}  El workspace está en estado normal.${C_RESET}\n\n"
     log_summary "INFO" "Sin operaciones que abortar"
     exit 0
@@ -60,4 +79,51 @@ if $rebase_in_progress; then
     invoke_git "No se pudo abortar el rebase." rebase --abort
     log_ok "Rebase abortado. Workspace restaurado al estado previo al rebase."
     log_summary "COMPLETADO" "Rebase abortado en rama $current"
+    exit 0
+fi
+
+# ── Cherry-pick o revert en curso ─────────────────────────────────────────────
+# Los dos son la misma maquinaria de Git (el sequencer): se detectan igual, se
+# abortan igual y de hecho "git revert --abort" aborta un cherry-pick y
+# viceversa. De ahí que compartan bloque en vez de duplicarlo.
+if $cherry_pick_in_progress || $revert_in_progress; then
+    if $cherry_pick_in_progress; then
+        operacion="cherry-pick"
+        head_file="$git_dir/CHERRY_PICK_HEAD"
+    else
+        operacion="revert"
+        head_file="$git_dir/REVERT_HEAD"
+    fi
+
+    printf "\n${C_YELLOW}  ${operacion^} en curso detectado:${C_RESET}\n"
+    printf "${C_DGRAY}    Rama actual     : %s${C_RESET}\n" "$current"
+    if [ -f "$head_file" ]; then
+        seq_head=$(cat "$head_file" 2>/dev/null || echo "desconocido")
+        printf "${C_DGRAY}    Commit entrante : %s${C_RESET}\n" "${seq_head:0:8}"
+    else
+        # Detectado solo por el sequencer: no hay un commit "en curso",
+        # quedan commits sin aplicar en la cola.
+        pendientes=$(grep -cE '^(pick|revert) ' "$git_dir/sequencer/todo" 2>/dev/null || true)
+        printf "${C_DGRAY}    Commits pendientes en la secuencia : %s${C_RESET}\n" "${pendientes:-0}"
+    fi
+
+    conflicts=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
+    if [ -n "$conflicts" ]; then
+        printf "\n${C_RED}  Archivos en conflicto:${C_RESET}\n"
+        while IFS= read -r line; do
+            printf "${C_RED}    ✗ %s${C_RESET}\n" "$line"
+        done <<< "$conflicts"
+    fi
+
+    printf "\n"
+    read -rp "  ¿Abortar el $operacion y restaurar el estado anterior? [s/N]: " answer
+    if ! [[ "${answer,,}" =~ ^s ]]; then
+        log_info "Operación cancelada. El $operacion sigue en curso."
+        exit 0
+    fi
+
+    invoke_git "No se pudo abortar el $operacion." "$operacion" --abort
+    log_ok "${operacion^} abortado. Workspace restaurado al estado previo al $operacion."
+    log_summary "COMPLETADO" "${operacion^} abortado en rama $current"
+    exit 0
 fi
\ No newline at end of file
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
index ec4e241..a7b32ac 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/create-develop.sh
@@ -15,13 +15,35 @@ initialize_gitflow_log "create-develop ($DEVELOP_BRANCH)"
 
 ensure_workspace_ready || exit 0
 
+# Ajuste TASK-029 (item C6, frente S1): antes se hacia "fetch origin",
+# "pull --ff-only origin" y "push -u origin" sin comprobar disponibilidad,
+# y el script moria con el "fatal: 'origin' does not appear to be a git
+# repository" crudo de Git en cualquier repo sin remoto. Mismo guard ya
+# probado en merge-hotfix-to-main.sh / merge-release-to-main.sh (B2).
+detect_origin_available
+
+# Decision sobre REMOTE_CONFIGURED vs REMOTE_AVAILABLE (matiz que introdujo
+# la revision por pares de B2): aqui SI hay que distinguirlos. Sin origin
+# configurado, arrancar Git-Flow en local es el caso de uso legitimo de este
+# script. Pero con origin configurado y caido no se puede saber si
+# $DEVELOP_BRANCH ya existe en el remoto: crearla desde una rama principal
+# posiblemente obsoleta dejaria una develop local divergente de la de origin,
+# que es justo el estropicio que el push posterior haria permanente. Se
+# aborta y decide la persona, igual que en los merge a main.
+if [ "$REMOTE_CONFIGURED" = true ] && [ "$REMOTE_AVAILABLE" = false ]; then
+    log_error "origin esta configurado pero no responde. No se puede comprobar si $DEVELOP_BRANCH ya existe en el remoto, y crearla en local podria dejarla divergente. Revisa conexion/credenciales; si de verdad quieres operar sin remoto, ejecuta git remote remove origin y reintenta."
+    exit 1
+fi
+
 MAIN_BRANCH=$(resolve_main_branch "$MAIN_BRANCH")
 log_info "Rama principal detectada: $MAIN_BRANCH"
 
 DEV_LOCAL=false; DEV_REMOTE=false
 git show-ref --verify --quiet "refs/heads/$DEVELOP_BRANCH" 2>/dev/null && DEV_LOCAL=true || true
-git ls-remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH" \
-    && DEV_REMOTE=true || true
+if [ "$REMOTE_AVAILABLE" = true ]; then
+    git ls-remote --heads origin "$DEVELOP_BRANCH" 2>/dev/null | grep -q "refs/heads/$DEVELOP_BRANCH" \
+        && DEV_REMOTE=true || true
+fi
 
 if [ "$DEV_LOCAL" = true ] && [ "$DEV_REMOTE" = true ]; then
     log_ok "$DEVELOP_BRANCH ya existe localmente y en remoto."
@@ -32,15 +54,24 @@ if [ "$DEV_LOCAL" = true ] && [ "$DEV_REMOTE" = true ]; then
 fi
 
 if [ "$DEV_LOCAL" = true ] && [ "$DEV_REMOTE" = false ]; then
-    log_warn "$DEVELOP_BRANCH existe local pero no en remoto. Subiendo..."
-    invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
-    invoke_git "No se pudo subir $DEVELOP_BRANCH." push -u origin "$DEVELOP_BRANCH"
-    log_ok "$DEVELOP_BRANCH subido"
-    log_summary "COMPLETADO" "$DEVELOP_BRANCH subido a origin"
+    if [ "$REMOTE_AVAILABLE" = true ]; then
+        log_warn "$DEVELOP_BRANCH existe local pero no en remoto. Subiendo..."
+        invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
+        invoke_git "No se pudo subir $DEVELOP_BRANCH." push -u origin "$DEVELOP_BRANCH"
+        log_ok "$DEVELOP_BRANCH subido"
+        log_summary "COMPLETADO" "$DEVELOP_BRANCH subido a origin"
+    else
+        log_ok "$DEVELOP_BRANCH ya existe localmente."
+        invoke_git "No se pudo cambiar a $DEVELOP_BRANCH." checkout "$DEVELOP_BRANCH"
+        log_warn "Push omitido: no hay conexion con origin. $DEVELOP_BRANCH queda solo en local."
+        log_summary "COMPLETADO" "$DEVELOP_BRANCH ya existia en local, sin push"
+    fi
     exit 0
 fi
 
-invoke_git "No se pudo hacer fetch de origin." fetch origin
+if [ "$REMOTE_AVAILABLE" = true ]; then
+    invoke_git "No se pudo hacer fetch de origin." fetch origin
+fi
 
 if [ "$DEV_LOCAL" = false ] && [ "$DEV_REMOTE" = true ]; then
     log_info "$DEVELOP_BRANCH existe en remoto pero no localmente. Creando tracking local..."
@@ -52,18 +83,38 @@ if [ "$DEV_LOCAL" = false ] && [ "$DEV_REMOTE" = true ]; then
 fi
 
 if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH" 2>/dev/null; then
-    invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH." \
-        checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
+    if [ "$REMOTE_AVAILABLE" = true ]; then
+        invoke_git "No se pudo crear/cambiar a $MAIN_BRANCH." \
+            checkout -b "$MAIN_BRANCH" "origin/$MAIN_BRANCH"
+    else
+        log_error "$MAIN_BRANCH no existe localmente y no hay conexion remota para crearla."
+        exit 1
+    fi
 else
     invoke_git "No se pudo cambiar a $MAIN_BRANCH." checkout "$MAIN_BRANCH"
 fi
-invoke_git "No se pudo actualizar $MAIN_BRANCH." pull --ff-only origin "$MAIN_BRANCH"
+
+if [ "$REMOTE_AVAILABLE" = true ]; then
+    invoke_git "No se pudo actualizar $MAIN_BRANCH." pull --ff-only origin "$MAIN_BRANCH"
+else
+    log_warn "Sincronizacion omitida: no hay conexion con origin."
+fi
 
 log_info "Creando $DEVELOP_BRANCH desde $MAIN_BRANCH..."
 invoke_git "No se pudo crear $DEVELOP_BRANCH." checkout -b "$DEVELOP_BRANCH" "$MAIN_BRANCH"
-invoke_git "No se pudo subir $DEVELOP_BRANCH." push -u origin "$DEVELOP_BRANCH"
-log_ok "$DEVELOP_BRANCH creada y subida"
+
+if [ "$REMOTE_AVAILABLE" = true ]; then
+    invoke_git "No se pudo subir $DEVELOP_BRANCH." push -u origin "$DEVELOP_BRANCH"
+    log_ok "$DEVELOP_BRANCH creada y subida"
+else
+    log_warn "Push omitido: no hay conexion con origin. $DEVELOP_BRANCH queda solo en local."
+fi
+
 invoke_git "No se pudo cambiar a $DEVELOP_BRANCH al finalizar." checkout "$DEVELOP_BRANCH"
 log_ok "Rama activa final: $DEVELOP_BRANCH"
 
-log_summary "COMPLETADO" "$DEVELOP_BRANCH creado desde $MAIN_BRANCH y subido a origin"
\ No newline at end of file
+if [ "$REMOTE_AVAILABLE" = true ]; then
+    log_summary "COMPLETADO" "$DEVELOP_BRANCH creado desde $MAIN_BRANCH y subido a origin"
+else
+    log_summary "COMPLETADO" "$DEVELOP_BRANCH creado desde $MAIN_BRANCH solo en local"
+fi
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
index b9fa894..cb4a12f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh
@@ -84,7 +84,7 @@ fi
 printf "${C_CYAN}  %s${C_RESET}\n" "$bar"
 printf "  %-20s %s\n" "Stashes guardados:" "$stash_count"
 if $merge_in_progress; then
-    printf "${C_RED}  ⚠  MERGE EN CURSO — usa GitFlow 19 Abort Merge para cancelar${C_RESET}\n"
+    printf "${C_RED}  ⚠  MERGE EN CURSO — para cancelarlo: 'taskctl abort-merge', o 'bash abort-merge.sh' desde scripts/gitflow/${C_RESET}\n"
 fi
 if $rebase_in_progress; then
     printf "${C_RED}  ⚠  REBASE EN CURSO — usa: git rebase --abort${C_RESET}\n"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
index b42af2e..3e9c231 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/mirror-to-remote.sh
@@ -94,7 +94,8 @@ printf "${C_GREEN}    $REMOTE_NAME -> $DEST_URL${C_RESET}\n"
 printf "${C_GREEN}    $BRANCH_COUNT rama(s) + $TAG_COUNT tag(s) enviadas${C_RESET}\n\n"
 
 printf "${C_CYAN}  Siguiente paso opcional:${C_RESET}\n"
-printf "${C_DGRAY}    Ejecuta 'GitFlow 21 Switch Working Remote' si quieres que los 19${C_RESET}\n"
-printf "${C_DGRAY}    scripts existentes trabajen contra '$REMOTE_NAME' a partir de ahora.${C_RESET}\n\n"
+printf "${C_DGRAY}    Ejecuta 'bash switch-working-remote.sh' (en esta misma carpeta) si${C_RESET}\n"
+printf "${C_DGRAY}    quieres que los demas scripts de Git-Flow trabajen contra${C_RESET}\n"
+printf "${C_DGRAY}    '$REMOTE_NAME' a partir de ahora. No hay comando de taskctl para esto.${C_RESET}\n\n"
 
 log_summary "COMPLETADO" "mirror $REMOTE_NAME ($BRANCH_COUNT ramas, $TAG_COUNT tags)"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh
index ac3b959..dc98869 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh
@@ -46,14 +46,14 @@ case "${answer,,}" in
             invoke_git "No se pudo hacer push de $current." push origin "$current"
             log_ok "Push completado: $current → origin/$current"
         fi
-        log_info "Para retomar: usa GitFlow 17 Resume Work en la rama $current"
+        log_info "Para retomar: ejecuta 'taskctl resume $current' (o, sin el CLI a mano, 'bash resume-work.sh $current' desde esta misma carpeta)."
         log_summary "COMPLETADO" "Trabajo guardado como commit en $current"
         ;;
     stash|s)
         stash_msg="pause: $current $(date +%Y-%m-%d)"
         invoke_git "No se pudo crear el stash." stash push -u -m "$stash_msg"
         log_ok "Stash creado: $stash_msg"
-        log_info "Para retomar: usa GitFlow 17 Resume Work en la rama $current"
+        log_info "Para retomar: ejecuta 'taskctl resume $current' (o, sin el CLI a mano, 'bash resume-work.sh $current' desde esta misma carpeta)."
         log_summary "COMPLETADO" "Trabajo guardado como stash en $current"
         ;;
     cancelar|cancel|n|no)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/recover-branch.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/recover-branch.sh
index e556c0d..8c261c1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/recover-branch.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/recover-branch.sh
@@ -10,6 +10,29 @@ while [[ $# -gt 0 ]]; do
     shift
 done
 
+# Ajuste TASK-029 (item C6, frente S1): antes se hacia "fetch origin" y
+# "ls-remote origin" sin comprobar disponibilidad, y el script moria con el
+# "fatal: 'origin' does not appear to be a git repository" crudo de Git.
+detect_origin_available
+
+# Decision sobre REMOTE_CONFIGURED vs REMOTE_AVAILABLE: aqui la distincion
+# NO cambia el comportamiento (ambos casos son exit 1) pero SI el mensaje,
+# que es todo el arreglo que cabe en este script. El proposito entero de
+# recover-branch es traerse una rama de origin: no existe modo local
+# posible, asi que fingir exito seria peor que el bug. Lo que si cambia es
+# que hacer despues: sin origin configurado hay que anadir el remoto; con
+# origin caido hay que arreglar la conexion y reintentar.
+if [ "$REMOTE_CONFIGURED" = false ]; then
+    log_error "Este repo no tiene un remoto 'origin' configurado y recover-branch solo sabe recuperar ramas DESDE origin. No hay nada que recuperar. Si la rama existe en algun repositorio remoto, anadelo primero con: git remote add origin <url>"
+    log_summary "FALLIDO" "sin remoto origin configurado"
+    exit 1
+fi
+if [ "$REMOTE_AVAILABLE" = false ]; then
+    log_error "origin esta configurado pero no responde, y recover-branch necesita leer la rama DESDE origin. Revisa conexion/credenciales (VPN, token, acceso al repositorio) y reintenta."
+    log_summary "FALLIDO" "origin configurado pero inaccesible"
+    exit 1
+fi
+
 invoke_git "No se pudo hacer fetch de origin." fetch origin
 
 if [ -z "$NAME" ]; then
@@ -58,4 +81,4 @@ git log --oneline -5 | while IFS= read -r line; do
 done
 printf "\n"
 
-log_summary "COMPLETADO" "Rama $NAME recuperada desde origin"
\ No newline at end of file
+log_summary "COMPLETADO" "Rama $NAME recuperada desde origin"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
index 84e2625..82ad249 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/resume-work.sh
@@ -24,32 +24,65 @@ fi
 status_raw=$(git status --porcelain 2>/dev/null)
 if [ -n "$status_raw" ]; then
     log_error "El workspace no está limpio. Guarda o descarta los cambios primero."
-    log_info  "Usa GitFlow 16 Pause Work para guardar tu trabajo actual."
+    log_info  "Usa taskctl pause para guardar tu trabajo actual."
     exit 1
 fi
 
 log_info "Retomando trabajo en rama: $NAME"
 
-invoke_git "No se pudo hacer fetch de origin." fetch origin
+# Ajuste TASK-029 (item C6, frente S1): antes se hacia "fetch origin" y dos
+# "ls-remote origin" sin comprobar disponibilidad, y el script moria con el
+# "fatal: 'origin' does not appear to be a git repository" crudo de Git.
+detect_origin_available
+
+# Decision sobre REMOTE_CONFIGURED vs REMOTE_AVAILABLE: aqui NO se
+# distinguen para decidir el comportamiento, y es deliberado. A diferencia
+# de los merge a main (donde un origin caido puede dejar un tag sobre
+# historia divergente) o de create-develop (donde se crearia una rama
+# divergente), retomar una rama que YA existe en local no escribe historia
+# ni publica nada: en el peor caso se trabaja sobre una copia desactualizada,
+# que es exactamente lo que avisa el log_warn. Abortar aqui romperia el caso
+# de uso central de resume-work: volver a tu rama con la VPN caida o sin
+# red. La distincion si se usa para el TEXTO de los avisos, porque lo que
+# hay que hacer despues no es lo mismo.
+if [ "$REMOTE_AVAILABLE" = true ]; then
+    invoke_git "No se pudo hacer fetch de origin." fetch origin
+elif [ "$REMOTE_CONFIGURED" = true ]; then
+    log_warn "Sincronizacion omitida: origin esta configurado pero no responde. Se trabaja con la copia local, que puede estar desactualizada."
+else
+    log_warn "Sincronizacion omitida: este repo no tiene remoto 'origin'. Se trabaja solo en local."
+fi
 
 # Cambiar a la rama (local o desde origin)
+NAME_REMOTE=false
+if [ "$REMOTE_AVAILABLE" = true ]; then
+    git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME" \
+        && NAME_REMOTE=true || true
+fi
+
 if git show-ref --verify --quiet "refs/heads/$NAME" 2>/dev/null; then
     invoke_git "No se pudo cambiar a $NAME." checkout "$NAME"
-elif git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME"; then
+elif [ "$NAME_REMOTE" = true ]; then
     log_info "Rama $NAME solo existe en origin. Creando copia local..."
     invoke_git "No se pudo crear $NAME desde origin/$NAME." checkout -b "$NAME" "origin/$NAME"
-else
+elif [ "$REMOTE_AVAILABLE" = true ]; then
     log_error "La rama '$NAME' no existe ni localmente ni en origin."
-    log_info  "Si la rama se perdió, usa GitFlow 18 Recover Branch from Origin."
+    log_info  "Si la rama se perdió, usa taskctl recover."
+    exit 1
+else
+    log_error "La rama '$NAME' no existe localmente y no hay conexion con origin para buscarla."
+    log_info  "Comprueba el nombre con git branch, o recupera la conexion y usa taskctl recover."
     exit 1
 fi
 
 # Actualizar desde origin si tiene tracking remoto
-if git ls-remote --heads origin "$NAME" 2>/dev/null | grep -q "refs/heads/$NAME"; then
+if [ "$NAME_REMOTE" = true ]; then
     invoke_git "No se pudo actualizar $NAME desde origin." pull --ff-only origin "$NAME"
     log_ok "Rama $NAME actualizada desde origin."
-else
+elif [ "$REMOTE_AVAILABLE" = true ]; then
     log_warn "La rama $NAME no tiene copia en origin. Trabajando solo en local."
+else
+    log_warn "Rama $NAME retomada sin sincronizar con origin."
 fi
 
 # Buscar stash relacionado con esta rama
@@ -76,4 +109,4 @@ else
 fi
 printf "\n"
 
-log_summary "COMPLETADO" "Trabajo retomado en $NAME"
\ No newline at end of file
+log_summary "COMPLETADO" "Trabajo retomado en $NAME"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
index dec2aa7..81bcb1c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/switch-working-remote.sh
@@ -38,7 +38,7 @@ if [ -z "$NEW_ORIGIN" ]; then
     printf "${C_CYAN}  Remotos disponibles (excepto 'origin'):${C_RESET}\n"
     AVAILABLE=$(git remote | grep -v '^origin$' || true)
     if [ -z "$AVAILABLE" ]; then
-        log_error "No hay otros remotos configurados. Ejecuta antes 'GitFlow 20 Mirror to Remote'."
+        log_error "No hay otros remotos configurados. Ejecuta antes 'bash mirror-to-remote.sh', en esta misma carpeta."
         exit 1
     fi
     printf "%s\n" "$AVAILABLE" | while IFS= read -r line; do
@@ -56,7 +56,7 @@ if [ "$NEW_ORIGIN" = "origin" ]; then
 fi
 
 if ! git remote get-url "$NEW_ORIGIN" > /dev/null 2>&1; then
-    log_error "El remoto '$NEW_ORIGIN' no existe. Crealo primero con 'GitFlow 20 Mirror to Remote'."
+    log_error "El remoto '$NEW_ORIGIN' no existe. Crealo primero con 'bash mirror-to-remote.sh', en esta misma carpeta."
     exit 1
 fi
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/test/smoke-test.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/test/smoke-test.sh
index 7c2d6c6..0bb2064 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/test/smoke-test.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/test/smoke-test.sh
@@ -37,15 +37,18 @@ cd "$TMP_REPO" || exit 1
 git init -q -b main
 git config user.name "smoke-test"
 git config user.email "smoke-test@example.invalid"
-# logs/ debe estar gitignorado ANTES de tocar cualquier script de
-# Git-Flow: el propio script escribe su log ahi al arrancar
-# (initialize_gitflow_log corre antes que ensure_workspace_ready), y
-# sin esto el primer uso en un repo nuevo se autobloquea con
-# "workspace no limpio" (hallazgo 2 de TASK-007, reproducido tambien
-# al escribir este mismo smoke test).
-printf 'logs/\n' > .gitignore
+# Repo temporal deliberadamente SIN .gitignore. Hasta TASK-029 hacia
+# falta uno con "logs/" antes de tocar ningun script de Git-Flow: el
+# propio script escribia su registro en <repo>/logs/gitflow/ al arrancar
+# (initialize_gitflow_log corre antes que ensure_workspace_ready) y sin
+# ignorarlo el primer uso en un repo nuevo se autobloqueaba con
+# "workspace no limpio" (hallazgo 2 de TASK-007, reproducido tambien al
+# escribir este mismo smoke test). Desde TASK-029 el registro vive en
+# .git/, que no forma parte del arbol de trabajo, asi que el repo no
+# necesita ignorar nada — y que aqui no haya .gitignore es justamente la
+# comprobacion (ver cheque 2).
 echo "init" > README.md
-git add README.md .gitignore
+git add README.md
 git commit -q -m "init"
 git checkout -q -b develop main
 
@@ -61,11 +64,17 @@ CURRENT_BRANCH="$(git branch --show-current)"
 assert "la rama activa es feature/smoke-test-feature" "$?"
 
 echo
-echo "== 2) el log interno se escribe DENTRO del repo temporal, no dentro de scripts/gitflow/ (hallazgo 1) =="
-[ -f "$TMP_REPO/logs/gitflow/gitflow-$(date +%Y-%m-%d).log" ]
-assert "logs/gitflow/*.log existe dentro del repo temporal" "$?"
+echo "== 2) el log interno se escribe en .git/ del repo temporal, fuera del arbol de trabajo (hallazgo 1 + TASK-029) =="
+[ -f "$TMP_REPO/.git/taskcode/gitflow/gitflow-$(date +%Y-%m-%d).log" ]
+assert ".git/taskcode/gitflow/*.log existe dentro del repo temporal" "$?"
 [ ! -d "$SCRIPT_DIR/logs" ]
 assert "NO se creo logs/ dentro de scripts/gitflow/ (log_dir ya no cuenta niveles de carpeta)" "$?"
+[ ! -d "$TMP_REPO/logs" ]
+assert "NO se creo logs/ en el arbol de trabajo del repo (TASK-029)" "$?"
+# Lo que define el frente S2 de TASK-029: el script no deja NADA en el
+# arbol de trabajo, en un repo que no ignora nada.
+[ -z "$(git status --porcelain)" ]
+assert "git status --porcelain queda vacio tras ejecutar el script" "$?"
 
 echo
 echo "== 3) merge-feature-to-develop.sh integra sin origin (hallazgo 4 - antes fallaba con exit 1) =="
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 6d327f8..60aebad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -217,12 +217,13 @@ En Windows hay una segunda capa: `bash` desde PowerShell puede resolver al de
 WSL y reventar; hace falta el `bash` de Git con su directorio de utilidades en
 el PATH, o se queda sin las herramientas que los scripts usan.
 
-**Los scripts escriben su registro dentro de tu repo.** Lo crean nada mas
-arrancar, antes de mirar si el workspace esta limpio: **se ensucian el
-workspace ellos mismos**. En un repo que no ignore esa ruta, el comando de
-guardar trabajo acaba preguntando por un directorio que acaba de crear el, y
-el de reanudar queda inservible. Anadir `logs/gitflow/` al `.gitignore` antes
-de nada.
+**Los scripts escriben un registro de cada ejecucion**, dentro de `.git/`
+(`.git/taskcode/gitflow/gitflow-FECHA.log`), que es donde hay que buscarlo
+cuando algo falla. Va ahi y no en el arbol de trabajo a proposito: durante
+mucho tiempo lo escribian dentro del repo, nada mas arrancar y antes de mirar
+si el workspace estaba limpio, asi que **se ensuciaban el workspace ellos
+mismos** y el comando de reanudar quedaba inservible en cualquier repo que no
+ignorara esa ruta. No hace falta anadir nada al `.gitignore`.
 
 **La herramienta no commitea lo que genera.** Consecuencia directa: `import`
 no se puede ejecutar dos veces seguidas sin commitear en medio, porque lo que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts
index 9e3c679..bad56c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/wrappers.ts
@@ -38,7 +38,6 @@
  * definicion.
  */
 import {
-  isIgnored,
   isInsideWorkTree,
   isValidBranchName,
   isWorkspaceClean,
@@ -68,18 +67,6 @@ const WRAPPERS: Record<WrapperName, WrapperSpec> = {
 
 export const WRAPPER_NAMES = Object.keys(WRAPPERS) as readonly WrapperName[];
 
-/**
- * El registro que `initialize_gitflow_log` escribe dentro del repo del
- * usuario, en todos los scripts. El nombre real lleva la fecha; para
- * preguntarle a Git si esta ignorado basta uno representativo.
- *
- * Se pregunta por el FICHERO y no por `logs/` (hallazgo MENOR de
- * revision por pares, ronda 2): un `.gitignore` con `logs/gitflow/` o
- * con `*.log` ignora el registro sin ignorar `logs/`, y el guard
- * abortaba de mas acusando al repo de algo que no era verdad.
- */
-const REGISTRO_DE_LOS_SCRIPTS = 'logs/gitflow/gitflow-2026-01-01.log';
-
 export function isWrapperCommand(cmd: string): cmd is WrapperName {
   return Object.prototype.hasOwnProperty.call(WRAPPERS, cmd);
 }
@@ -176,8 +163,8 @@ function parseWrapperArgs(
 /**
  * Guarda de no-interactividad: solo corta cuando el script iba a
  * preguntar algo Y su respuesta por defecto es inaceptable. Si no hay
- * nada que preguntar (diagnose, pause con el workspace limpio en un
- * repo que ignora logs/), el comando sigue igual de bien sin terminal.
+ * nada que preguntar (diagnose, o pause con el workspace limpio), el
+ * comando sigue igual de bien sin terminal.
  */
 function assertPuedeSeguirSinTerminal(
   nombre: WrapperName,
@@ -193,23 +180,18 @@ function assertPuedeSeguirSinTerminal(
           'para dejarlos en la rama.'
       );
     }
-    // El workspace esta limpio AHORA, pero todos los scripts de
-    // Git-Flow crean logs/gitflow/ dentro del repo nada mas arrancar
-    // (initialize_gitflow_log). Si el repo no ignora logs/, para
-    // cuando pause-work.sh mire el workspace lo vera sucio por su
-    // propia culpa y preguntara igual, con EOF por respuesta:
-    // "Opcion no reconocida" y exit 1, exactamente el fallo que este
-    // comando venia a quitar de en medio (hallazgo IMPORTANTE de
-    // revision por pares). Mejor decirlo antes, y decir como
-    // arreglarlo de raiz.
-    if (!isIgnored(REGISTRO_DE_LOS_SCRIPTS, repoCwd)) {
-      throw new WrapperCommandError(
-        '[ERROR] taskctl pause preguntaria igualmente aunque el workspace este limpio: los ' +
-          'scripts de Git-Flow escriben su registro en "logs/gitflow/" nada mas arrancar, y ' +
-          'este repo no lo ignora. Anade "logs/" al .gitignore del repo (es lo que espera el ' +
-          'plugin), o ejecuta el comando desde una terminal.'
-      );
-    }
+    // Aqui habia un segundo guard (TASK-026): con el workspace limpio,
+    // `pause` abortaba igualmente si el repo no ignoraba el registro
+    // que los scripts de Git-Flow escribian en "logs/gitflow/", porque
+    // `initialize_gitflow_log` lo creaba nada mas arrancar y
+    // pause-work.sh acababa viendo sucio un workspace que habia
+    // ensuciado el mismo. Ese guard tapaba una suciedad autoinfligida,
+    // no un problema del repo del usuario. TASK-029 movio el registro
+    // a `.git/taskcode/gitflow/` (git rev-parse --git-path), que
+    // `git status` no ve nunca, asi que el guard se ha quedado sin
+    // motivo y se elimina con su constante. Comprobado empiricamente:
+    // repo sin ".gitignore", workspace limpio y stdin cerrado ->
+    // pause-work.sh informa "Workspace limpio", sale 0 y no pregunta.
   }
 
   if (nombre === 'abort-merge') {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 0c312e1..100bb12 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -7,7 +7,7 @@
  * scripts .sh siguen siendo la unica fuente de verdad para eso).
  */
 import { spawnSync } from 'node:child_process';
-import { existsSync } from 'node:fs';
+import { existsSync, readFileSync } from 'node:fs';
 import path from 'node:path';
 import type { Task } from '../core/task.js';
 
@@ -84,60 +84,66 @@ export function isInsideWorkTree(cwd: string): boolean {
   return result.status === 0 && (result.stdout ?? '').trim() === 'true';
 }
 
-/**
- * true si `relPath` (relativo a la raiz del repo) caeria bajo las
- * reglas de gitignore vigentes. Lo usa el wrapper de `pause` para
- * saber si el propio script va a ensuciar el workspace al escribir su
- * registro.
- *
- * Dos detalles que no son opcionales (hallazgos MENOR de revision por
- * pares, TASK-026, rondas 1 y 2):
- *
- * - Se resuelve la raiz primero: `git check-ignore` interpreta las
- *   rutas relativas contra el cwd, y taskctl puede estar invocado
- *   desde un subdirectorio.
- * - `--no-index`: sin el, si algo bajo esa ruta esta ya en el indice
- *   (un `logs/.gitkeep` trackeado, por ejemplo) check-ignore se salta
- *   la consulta y contesta "no ignorado" aunque el .gitignore diga lo
- *   contrario. Aqui la pregunta es por las REGLAS, no por el estado
- *   del indice.
- *
- * Y hay que preguntar por el fichero concreto que se va a escribir, no
- * por el directorio de mas arriba: `.gitignore` con `logs/gitflow/` o
- * con `*.log` ignora el registro y no ignora `logs/`.
- */
-export function isIgnored(relPath: string, cwd: string): boolean {
-  const toplevel = runGit(['rev-parse', '--show-toplevel'], cwd);
-  const args = ['check-ignore', '-q', '--no-index', '--', relPath] as const;
-  const result = spawnSync('git', args, { cwd: toplevel, encoding: 'utf8' });
-  if (result.error) {
-    throw new GitLaunchError(result.error);
-  }
-  if (result.status === 0) return true;
-  // 1 = no esta ignorado (respuesta valida). Cualquier otro codigo es
-  // un error real, mismo criterio que isAncestor.
-  if (result.status === 1) return false;
-  throw new GitCommandError(args, result.stderr ?? '');
-}
-
-export type OperacionGitEnCurso = 'merge' | 'rebase';
+export type OperacionGitEnCurso = 'merge' | 'rebase' | 'cherry-pick' | 'revert';
 
 /**
  * Que operacion multi-paso hay a medias en el repo, si es que hay
- * alguna (TASK-026). Mira exactamente los mismos tres testigos que
- * `abort-merge.sh` (MERGE_HEAD, rebase-merge, rebase-apply), pero
- * resolviendo cada ruta con `git rev-parse --git-path` en vez de
+ * alguna (TASK-026, ampliada en TASK-029). Mira exactamente los mismos
+ * testigos que `abort-merge.sh` — y eso es deliberado: si taskctl
+ * detectara mas que el script habria dos comportamientos distintos
+ * segun haya terminal o no.
+ *
+ * Cada ruta se resuelve con `git rev-parse --git-path` en vez de
  * concatenar sobre --git-dir: asi sigue valiendo dentro de un
- * worktree enlazado, donde MERGE_HEAD no vive en el .git principal.
+ * worktree enlazado, donde estos ficheros no viven en el .git
+ * principal (comprobado: en un worktree enlazado con un cherry-pick a
+ * medias, --git-path devuelve .git/worktrees/<nombre>/CHERRY_PICK_HEAD
+ * y el fichero esta ahi).
  *
  * `--git-path` devuelve una ruta relativa al cwd de Git, no al
  * proceso: se resuelve contra `cwd` antes de mirar el disco.
+ *
+ * Sobre los dos testigos de TASK-029, medidos en git 2.55 y no
+ * supuestos:
+ *
+ * - Un cherry-pick en conflicto deja `CHERRY_PICK_HEAD`; un revert en
+ *   conflicto deja `REVERT_HEAD`. Ninguno de los dos deja `MERGE_HEAD`,
+ *   ni siquiera al revertir un commit de merge con `-m 1`.
+ * - Una secuencia multi-commit deja ademas `.git/sequencer/`, y puede
+ *   quedar viva SIN ninguno de los dos ficheros anteriores: si se
+ *   resuelve el conflicto y se hace `git commit` a mano en vez de
+ *   `--continue`, Git borra CHERRY_PICK_HEAD pero deja el sequencer con
+ *   los commits pendientes, y `--abort` sigue funcionando. Sin mirar el
+ *   directorio, ese estado se reportaria como "normal", que es
+ *   justamente el mensaje falso que TASK-029 viene a quitar.
+ * - Un rebase (interactivo o no) NO deja CHERRY_PICK_HEAD ni sequencer:
+ *   usa `rebase-merge` y `REBASE_HEAD`. No hay colision entre los dos
+ *   grupos de testigos.
+ * - `git cherry-pick -n` en conflicto no deja NINGUN testigo, y Git
+ *   mismo responde "no cherry-pick or revert in progress" a `--abort`.
+ *   No hay nada que abortar y aqui se devuelve null, igual que Git.
  */
 export function operacionEnCurso(cwd: string): OperacionGitEnCurso | null {
   const gitPath = (nombre: string): string =>
     path.resolve(cwd, runGit(['rev-parse', '--git-path', nombre], cwd));
   if (existsSync(gitPath('MERGE_HEAD'))) return 'merge';
   if (existsSync(gitPath('rebase-merge')) || existsSync(gitPath('rebase-apply'))) return 'rebase';
+  if (existsSync(gitPath('CHERRY_PICK_HEAD'))) return 'cherry-pick';
+  if (existsSync(gitPath('REVERT_HEAD'))) return 'revert';
+  const sequencer = gitPath('sequencer');
+  if (existsSync(sequencer)) {
+    // La primera linea del "todo" distingue las dos: "pick <sha>" para
+    // cherry-pick, "revert <sha>" para revert. Si no se puede leer se
+    // asume cherry-pick, que es inofensivo: `git revert --abort` aborta
+    // un cherry-pick y viceversa (misma maquinaria del sequencer).
+    let todo = '';
+    try {
+      todo = readFileSync(path.join(sequencer, 'todo'), 'utf8');
+    } catch {
+      todo = '';
+    }
+    return /^revert /m.test(todo) ? 'revert' : 'cherry-pick';
+  }
   return null;
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
index f70f589..9b99871 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
@@ -15,6 +15,7 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
@@ -84,13 +85,13 @@ function capturaError(fn: () => unknown): unknown {
 }
 
 /**
- * El `.gitignore` con `logs/` NO es decorado: todos los scripts de
- * Git-Flow llaman a `initialize_gitflow_log`, que crea `logs/gitflow/`
- * dentro del repo. Sin ignorarlo, el propio script deja el workspace
- * sucio y `pause-work.sh` acaba preguntando que hacer con un
- * directorio que acaba de crear el. El repo TaskCode ya lo ignora
- * (.gitignore, linea 14) y el resto de tests de comandos hacen lo
- * mismo.
+ * Repo temporal deliberadamente SIN `.gitignore`. Hasta TASK-029 hacia
+ * falta uno con `logs/`, porque `initialize_gitflow_log` creaba
+ * `logs/gitflow/` dentro del repo nada mas arrancar cualquier script y
+ * el propio script se ensuciaba el workspace antes de mirarlo. Desde
+ * que el registro vive en `.git/taskcode/gitflow/` no hace falta nada:
+ * que estos repos no ignoren absolutamente nada es la red de
+ * regresion de ese cambio.
  */
 async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
   const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-'));
@@ -98,7 +99,6 @@ async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<vo
     git(['init', '-q', '-b', 'main'], repoRoot);
     git(['config', 'user.email', 'test@example.com'], repoRoot);
     git(['config', 'user.name', 'Test'], repoRoot);
-    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
     await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
     git(['add', '-A'], repoRoot);
     git(['commit', '-q', '-m', 'inicial'], repoRoot);
@@ -286,52 +286,44 @@ test('pause sin terminal y con el workspace sucio aborta y no toca nada', async
   });
 });
 
-test('pause sin terminal aborta si el repo no ignora logs/, aunque el workspace este limpio', async () => {
-  // Repo SIN "logs/" en .gitignore: el propio pause-work.sh crea
-  // logs/gitflow/ al arrancar y despues ve el workspace sucio por su
-  // culpa, pregunta, y con EOF por respuesta muere con "Opcion no
-  // reconocida" y exit 1 — el fallo que este comando venia a quitar
-  // de en medio (hallazgo IMPORTANTE de revision por pares).
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sinlogs-'));
+test('pause sin terminal sigue adelante en un repo SIN .gitignore, y no ensucia nada', async () => {
+  // Regresion de TASK-029, y la razon de que aqui ya no haya un guard
+  // de "el repo no ignora logs/". Hasta TASK-029,
+  // `initialize_gitflow_log` creaba <repo>/logs/gitflow/ nada mas
+  // arrancar: en un repo sin ese patron en el .gitignore, pause-work.sh
+  // veia el workspace sucio POR SU PROPIA CULPA, preguntaba, y con EOF
+  // por respuesta moria con "Opcion no reconocida" y exit 1 — el fallo
+  // que este comando venia a quitar de en medio. El wrapper lo tapaba
+  // abortando antes con un mensaje que pedia tocar el .gitignore.
+  //
+  // Ahora el registro vive en `.git/taskcode/gitflow/`, que `git status`
+  // no mira nunca, asi que el caso deja de existir: el repo de este test
+  // no tiene .gitignore en absoluto.
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sinignore-'));
   try {
     git(['init', '-q', '-b', 'main'], repoRoot);
     git(['config', 'user.email', 'test@example.com'], repoRoot);
     git(['config', 'user.name', 'Test'], repoRoot);
-    await writeFile(path.join(repoRoot, 'README.md'), '# sin ignorar logs\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# sin gitignore\n', 'utf8');
     git(['add', '-A'], repoRoot);
     git(['commit', '-q', '-m', 'inicial'], repoRoot);
     assert.equal(git(['status', '--porcelain'], repoRoot), '', 'el workspace parte limpio');
 
-    const error = capturaError(() => run('pause', [], repoRoot));
-
-    assert.ok(error instanceof WrapperCommandError);
-    assert.match((error as Error).message, /este repo no lo ignora/);
-    assert.match((error as Error).message, /\.gitignore/);
-    // Y no se llego a invocar el script: el repo sigue sin logs/.
-    assert.equal(git(['status', '--porcelain'], repoRoot), '');
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
-  }
-});
-
-test('pause sin terminal NO aborta si el registro esta ignorado por un patron que no es "logs/"', async () => {
-  // El guard pregunta por el fichero que escriben los scripts, no por
-  // la carpeta: un .gitignore con "logs/gitflow/" ignora el registro
-  // igual de bien, y abortar ahi seria un falso positivo (hallazgo
-  // MENOR de revision por pares, ronda 2).
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-otroignore-'));
-  try {
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/gitflow/\n', 'utf8');
-    await writeFile(path.join(repoRoot, 'README.md'), '# otro patron\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'inicial'], repoRoot);
-
     const result = run('pause', [], repoRoot);
-    assert.equal(result.code, 0);
-    assert.equal(git(['status', '--porcelain'], repoRoot), '', 'el registro quedo ignorado');
+
+    assert.equal(result.code, 0, 'pause-work.sh no pregunta ni muere con exit 1');
+    assert.deepEqual(result.avisos, []);
+    assert.equal(
+      git(['status', '--porcelain'], repoRoot),
+      '',
+      'el script no dejo nada en el arbol de trabajo'
+    );
+    // Y el registro se escribio de verdad, solo que fuera del arbol.
+    const dirRegistro = path.join(
+      repoRoot,
+      git(['rev-parse', '--git-path', 'taskcode/gitflow'], repoRoot).trim()
+    );
+    assert.ok(existsSync(dirRegistro), `el registro deberia estar en ${dirRegistro}`);
   } finally {
     await rm(repoRoot, { recursive: true, force: true });
   }
@@ -396,10 +388,15 @@ test('resume y recover con rama y sin terminal avisan del valor por defecto ANTE
     assert.equal(resume.avisos.length, 1);
     assert.deepEqual(resume.emitidos, resume.avisos);
     assert.match(resume.avisos[0] as string, /aplicara sin preguntar/);
-    // Sin "origin" configurado, resume-work.sh muere en su "fetch
-    // origin" sin guard: es el bug conocido del item C6, que esta
-    // tarea NO tapa a proposito.
-    assert.notEqual(resume.code, 0);
+    // Aqui habia un `assert.notEqual(resume.code, 0)`: sin "origin"
+    // configurado, resume-work.sh moria en su "fetch origin" sin guard,
+    // el bug conocido que TASK-026 NO tapaba a proposito. TASK-029 (S1)
+    // lo corrige, asi que el codigo de salida de resume-work.sh sin
+    // remoto ya no es este el sitio donde se fija: lo cubre
+    // test/gitflow/origin-guard.test.ts. Lo que este test comprueba es
+    // el contrato del WRAPPER — que el aviso del valor por defecto se
+    // emite ANTES de lanzar el script —, y eso no depende del codigo
+    // de salida.
 
     const recover = run('recover', ['main'], repoRoot);
     assert.equal(recover.avisos.length, 1);
@@ -445,7 +442,8 @@ async function withRepoConStash(
     git(['config', 'user.email', 'test@example.com'], repoRoot);
     git(['config', 'user.name', 'Test'], repoRoot);
     git(['remote', 'add', 'origin', originRoot], repoRoot);
-    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    // Sin .gitignore, igual que withTempRepo y por el mismo motivo
+    // (TASK-029): el registro de los scripts ya no toca el arbol.
     await writeFile(path.join(repoRoot, 'README.md'), '# repo con stash\n', 'utf8');
     git(['add', '-A'], repoRoot);
     git(['commit', '-q', '-m', 'inicial'], repoRoot);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
index f3c2fdb..1f3ea76 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/git.test.ts
@@ -1,6 +1,7 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { mkdtemp, rm } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
@@ -10,7 +11,6 @@ import {
   isValidBranchName,
   isRemoteAvailable,
   isInsideWorkTree,
-  isIgnored,
   operacionEnCurso,
   localBranchExists,
   resolveMainBranch,
@@ -361,7 +361,14 @@ test('ensureBaseBranchReady: si el checkout tiene exito pero el pull --ff-only f
   });
 });
 
-// ── isInsideWorkTree / isIgnored / operacionEnCurso (TASK-026) ──────
+// ── isInsideWorkTree / operacionEnCurso (TASK-026) ──────────────────
+// isIgnored vivia aqui y se fue en TASK-029: su unico consumidor era el
+// guard de `taskctl pause` que comprobaba si el repo ignoraba el
+// registro de los scripts, y ese guard dejo de tener sentido cuando el
+// registro se mudo dentro de `.git/`. Se recupera con `git show` si
+// alguna vez hace falta: llevaba dentro dos detalles que costaron una
+// ronda de revision (`--no-index`, y preguntar por el fichero y no por
+// su carpeta), documentados en HALLAZGOS.md.
 
 test('isInsideWorkTree: true dentro de un repo y en un subdirectorio suyo', async () => {
   await withTempRepo(async (repoRoot) => {
@@ -397,52 +404,6 @@ test('isInsideWorkTree: false dentro de .git y false en un repo bare', async ()
   }
 });
 
-const REGISTRO = 'logs/gitflow/gitflow-2026-01-01.log';
-
-test('isIgnored: distingue una ruta ignorada de una que no lo esta', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const { writeFile, mkdir } = await import('node:fs/promises');
-    assert.equal(isIgnored(REGISTRO, repoRoot), false);
-    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
-    assert.equal(isIgnored(REGISTRO, repoRoot), true);
-    assert.equal(isIgnored('src/main.ts', repoRoot), false);
-    // Y desde un subdirectorio la respuesta no cambia: la ruta se
-    // resuelve contra la raiz del repo, no contra el cwd.
-    const sub = path.join(repoRoot, 'a', 'b');
-    await mkdir(sub, { recursive: true });
-    assert.equal(isIgnored(REGISTRO, sub), true);
-  });
-});
-
-test('isIgnored: acierta con los patrones que ignoran el fichero sin ignorar su carpeta', async () => {
-  // Los tres los encontro la revision por pares (ronda 2) como falsos
-  // positivos del guard de "pause", que preguntaba por "logs/".
-  for (const patron of ['logs/gitflow/', '*.log', 'logs/**']) {
-    await withTempRepo(async (repoRoot) => {
-      const { writeFile } = await import('node:fs/promises');
-      await writeFile(path.join(repoRoot, '.gitignore'), `${patron}\n`, 'utf8');
-      assert.equal(isIgnored(REGISTRO, repoRoot), true, patron);
-    });
-  }
-});
-
-test('isIgnored: un fichero trackeado bajo la ruta no cambia la respuesta (--no-index)', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const { writeFile, mkdir } = await import('node:fs/promises');
-    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
-    await mkdir(path.join(repoRoot, 'logs'), { recursive: true });
-    await writeFile(path.join(repoRoot, 'logs', '.gitkeep'), '', 'utf8');
-    // Trackeado a la fuerza, que es como se conserva una carpeta
-    // ignorada en el repo.
-    git(['add', '-f', 'logs/.gitkeep'], repoRoot);
-    git(['commit', '-q', '-m', 'conserva la carpeta de logs'], repoRoot);
-    // Sin --no-index, check-ignore se salta la consulta por estar la
-    // ruta en el indice y contesta "no ignorado", con el .gitignore
-    // diciendo justo lo contrario.
-    assert.equal(isIgnored(REGISTRO, repoRoot), true);
-  });
-});
-
 test('operacionEnCurso: null cuando no hay nada a medias', async () => {
   await withTempRepo(async (repoRoot) => {
     const { writeFile } = await import('node:fs/promises');
@@ -482,3 +443,183 @@ test('operacionEnCurso: "merge" con un merge en conflicto de verdad, y null tras
     assert.equal(operacionEnCurso(repoRoot), null);
   });
 });
+
+// ── operacionEnCurso: cherry-pick y revert (TASK-029) ───────────────
+//
+// Los testigos que deja Git NO son simetricos entre las dos
+// operaciones, asi que estos tests provocan cada estado de verdad
+// (repo temporal, conflicto real) en vez de fabricar ficheros a mano
+// dentro de .git/: lo que se afirma es lo que hace Git, no lo que
+// suponemos que hace.
+
+test('operacionEnCurso: "cherry-pick" con un cherry-pick en conflicto de verdad, y null tras abortarlo', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { writeFile } = await import('node:fs/promises');
+    const fichero = path.join(repoRoot, 'a.txt');
+    await writeFile(fichero, 'base\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'base'], repoRoot);
+
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(fichero, 'version de otra\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'cambio en otra'], repoRoot);
+
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(fichero, 'version de main\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'cambio en main'], repoRoot);
+
+    // Conflicta a proposito: git sale != 0, por eso no se usa el helper
+    // git() de este fichero, que asevera status 0.
+    const cp = spawnSync('git', ['cherry-pick', 'otra'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.notEqual(cp.status, 0, 'el cherry-pick deberia haber conflictado');
+
+    assert.equal(operacionEnCurso(repoRoot), 'cherry-pick');
+
+    git(['cherry-pick', '--abort'], repoRoot);
+    assert.equal(operacionEnCurso(repoRoot), null);
+  });
+});
+
+test('operacionEnCurso: "revert" con un revert en conflicto de verdad, y null tras abortarlo', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { writeFile } = await import('node:fs/promises');
+    const fichero = path.join(repoRoot, 'a.txt');
+    await writeFile(fichero, 'l1\nl2\nl3\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'base'], repoRoot);
+    await writeFile(fichero, 'l1\nDOS\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'segundo'], repoRoot);
+    await writeFile(fichero, 'l1\nTRES\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'tercero'], repoRoot);
+
+    // Revertir "segundo" choca con lo que hizo "tercero" en esa linea.
+    const rv = spawnSync('git', ['revert', '--no-edit', 'HEAD~1'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.notEqual(rv.status, 0, 'el revert deberia haber conflictado');
+
+    // El testigo es REVERT_HEAD, no MERGE_HEAD (comprobado: un revert
+    // en conflicto no deja MERGE_HEAD ni siquiera al revertir un merge
+    // con -m 1). Si se confundieran, el wrapper propondria el --abort
+    // equivocado.
+    assert.equal(operacionEnCurso(repoRoot), 'revert');
+
+    git(['revert', '--abort'], repoRoot);
+    assert.equal(operacionEnCurso(repoRoot), null);
+  });
+});
+
+test('operacionEnCurso: "cherry-pick" cuando solo queda .git/sequencer (resuelto con "git commit" a mano)', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { writeFile } = await import('node:fs/promises');
+    const fichero = path.join(repoRoot, 'a.txt');
+    await writeFile(fichero, 'base\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'base'], repoRoot);
+
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(path.join(repoRoot, 'b.txt'), 'b\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'limpio'], repoRoot);
+    await writeFile(fichero, 'version de otra\n', 'utf8');
+    git(['commit', '-q', '-am', 'conflictivo'], repoRoot);
+    await writeFile(path.join(repoRoot, 'c.txt'), 'c\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'pendiente'], repoRoot);
+
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(fichero, 'version de main\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
+
+    const cp = spawnSync('git', ['cherry-pick', 'main..otra'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.notEqual(cp.status, 0, 'el cherry-pick deberia conflictar en el segundo commit');
+    assert.equal(operacionEnCurso(repoRoot), 'cherry-pick');
+
+    // Resolver y comitear A MANO en vez de "cherry-pick --continue":
+    // Git borra CHERRY_PICK_HEAD pero deja .git/sequencer con el commit
+    // que falta, y "--abort" sigue funcionando. Sin mirar el sequencer,
+    // este repo se reportaria como "normal" estando a medias.
+    await writeFile(fichero, 'resuelto\n', 'utf8');
+    git(['add', 'a.txt'], repoRoot);
+    git(['commit', '-q', '-m', 'resuelto a mano'], repoRoot);
+    assert.equal(
+      existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')),
+      false,
+      'el commit a mano deberia haber borrado CHERRY_PICK_HEAD'
+    );
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'sequencer')), true);
+
+    assert.equal(operacionEnCurso(repoRoot), 'cherry-pick');
+
+    const abort = spawnSync('git', ['cherry-pick', '--abort'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(abort.status, 0, `--abort deberia seguir funcionando aqui: ${abort.stderr}`);
+    assert.equal(operacionEnCurso(repoRoot), null);
+  });
+});
+
+test('operacionEnCurso: "revert" cuando solo queda .git/sequencer (lo distingue por su "todo")', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { writeFile } = await import('node:fs/promises');
+    const fichero = path.join(repoRoot, 'a.txt');
+    await writeFile(fichero, 'l1\nl2\nl3\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'base'], repoRoot);
+    await writeFile(path.join(repoRoot, 'b.txt'), 'b\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'c1'], repoRoot);
+    await writeFile(fichero, 'l1\nDOS\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'c2'], repoRoot);
+    await writeFile(fichero, 'l1\nDOS\nTRES\n', 'utf8');
+    git(['commit', '-q', '-am', 'c3'], repoRoot);
+    await writeFile(fichero, 'l1\nDOS\nCUATRO\n', 'utf8');
+    git(['commit', '-q', '-am', 'c4'], repoRoot);
+
+    const rv = spawnSync('git', ['revert', '--no-edit', 'HEAD~3..HEAD~1'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.notEqual(rv.status, 0, 'revertir c3 deberia chocar con c4');
+    assert.equal(operacionEnCurso(repoRoot), 'revert');
+
+    await writeFile(fichero, 'l1\nDOS\nZ\n', 'utf8');
+    git(['add', 'a.txt'], repoRoot);
+    git(['commit', '-q', '-m', 'resuelto a mano'], repoRoot);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'REVERT_HEAD')), false);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'sequencer')), true);
+
+    // El directorio por si solo no dice si la secuencia es de
+    // cherry-pick o de revert: lo dice su "todo".
+    assert.equal(operacionEnCurso(repoRoot), 'revert');
+  });
+});
+
+test('operacionEnCurso: null tras un "cherry-pick -n" en conflicto (Git tampoco reconoce nada que abortar)', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { writeFile } = await import('node:fs/promises');
+    const fichero = path.join(repoRoot, 'a.txt');
+    await writeFile(fichero, 'base\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'base'], repoRoot);
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(fichero, 'version de otra\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(fichero, 'version de main\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
+
+    const cp = spawnSync('git', ['cherry-pick', '-n', 'otra'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.notEqual(cp.status, 0);
+
+    // Con -n Git no escribe CHERRY_PICK_HEAD ni sequencer, y contesta
+    // "no cherry-pick or revert in progress" a --abort: no hay
+    // secuencia que abortar, solo un indice en conflicto. taskctl dice
+    // lo mismo que Git a proposito. (Asimetria real y medida: un
+    // "revert -n" en conflicto SI deja REVERT_HEAD.)
+    const abort = spawnSync('git', ['cherry-pick', '--abort'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.notEqual(abort.status, 0, 'Git deberia negarse a abortar aqui');
+    assert.equal(operacionEnCurso(repoRoot), null);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/abort-merge.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/abort-merge.test.ts
new file mode 100644
index 0000000..c9e2379
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/abort-merge.test.ts
@@ -0,0 +1,281 @@
+/**
+ * Test de regresion real (no mocks) para el frente S4 de TASK-029:
+ * abort-merge.sh solo conocia MERGE_HEAD y los directorios de rebase,
+ * asi que con un cherry-pick o un revert a medias decia "El workspace
+ * esta en estado normal" y salia 0 — un mensaje falso sobre un repo
+ * que esta a medias.
+ *
+ * Mismo espiritu que test/gitflow/merge-to-main.test.ts: repos Git
+ * temporales de verdad y conflictos provocados de verdad
+ * (CONVENCIONES.md, seccion Tests). Los testigos que Git deja en .git/
+ * son justo lo que este test fija, porque no son simetricos entre
+ * cherry-pick y revert y no se pueden dar por supuestos.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/gitflow -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+const SCRIPT = 'abort-merge.sh';
+
+/** git que asevera exito. Para los comandos que conflictan a proposito se usa gitRaw. */
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+function gitRaw(args: string[], cwd: string): { status: number | null; output: string } {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
+}
+
+/**
+ * Ejecuta el script como lo haria una persona: "bash script.sh"
+ * (core.fileMode=false en este repo, ver HALLAZGOS.md). `respuesta`
+ * es lo que recibe el `read -rp` de confirmacion: "" es EOF (no hay
+ * terminal) y equivale a no confirmar; "s\n" confirma.
+ */
+function runScript(cwd: string, respuesta = ''): { status: number | null; output: string } {
+  const result = spawnSync('bash', [path.join(SCRIPTS_DIR, SCRIPT)], {
+    cwd,
+    encoding: 'utf8',
+    input: respuesta,
+  });
+  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
+}
+
+/**
+ * Repo temporal con un commit inicial en main. logs/ va en .gitignore
+ * ANTES del primer commit (hallazgo 2 de TASK-007: el propio registro
+ * de Git-Flow ensuciaria el workspace).
+ */
+async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-abort-merge-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nl2\nl3\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'base'], repoRoot);
+    await fn(repoRoot);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+/** Deja el repo con un cherry-pick en conflicto de verdad. */
+async function provocarCherryPick(repoRoot: string): Promise<void> {
+  git(['checkout', '-q', '-b', 'otra'], repoRoot);
+  await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
+  git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
+  git(['checkout', '-q', 'main'], repoRoot);
+  await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
+  git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
+  const cp = gitRaw(['cherry-pick', 'otra'], repoRoot);
+  assert.notEqual(cp.status, 0, `el cherry-pick deberia conflictar:\n${cp.output}`);
+  assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), true);
+}
+
+/** Deja el repo con un revert en conflicto de verdad. */
+async function provocarRevert(repoRoot: string): Promise<void> {
+  await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nDOS\nl3\n', 'utf8');
+  git(['commit', '-q', '-am', 'segundo'], repoRoot);
+  await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nTRES\nl3\n', 'utf8');
+  git(['commit', '-q', '-am', 'tercero'], repoRoot);
+  const rv = gitRaw(['revert', '--no-edit', 'HEAD~1'], repoRoot);
+  assert.notEqual(rv.status, 0, `el revert deberia conflictar:\n${rv.output}`);
+  assert.equal(existsSync(path.join(repoRoot, '.git', 'REVERT_HEAD')), true);
+}
+
+// ── Cherry-pick ─────────────────────────────────────────────────────
+
+test(`${SCRIPT}: detecta un cherry-pick en conflicto (antes: "estado normal" y exit 0)`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    await provocarCherryPick(repoRoot);
+
+    const { status, output } = runScript(repoRoot);
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    // Lo que fallaba: el script afirmaba que no habia nada a medias.
+    assert.doesNotMatch(output, /estado normal/, `salida:\n${output}`);
+    assert.match(output, /Cherry-pick en curso detectado/);
+    assert.match(output, /Archivos en conflicto/);
+    assert.match(output, /a\.txt/);
+    // Sin confirmar (EOF) NO aborta nada: el estado sigue igual.
+    assert.match(output, /El cherry-pick sigue en curso/);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), true);
+  });
+});
+
+test(`${SCRIPT}: confirmando, aborta el cherry-pick de verdad y deja el workspace limpio`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    await provocarCherryPick(repoRoot);
+
+    const { status, output } = runScript(repoRoot, 's\n');
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    assert.match(output, /Cherry-pick abortado/);
+    assert.match(output, /COMPLETADO/);
+    // Evidencia de Git, no solo el mensaje del script.
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), false);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'main');
+  });
+});
+
+// ── Revert ──────────────────────────────────────────────────────────
+
+test(`${SCRIPT}: detecta un revert en conflicto (antes: "estado normal" y exit 0)`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    await provocarRevert(repoRoot);
+
+    const { status, output } = runScript(repoRoot);
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    assert.doesNotMatch(output, /estado normal/, `salida:\n${output}`);
+    assert.match(output, /Revert en curso detectado/);
+    assert.match(output, /El revert sigue en curso/);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'REVERT_HEAD')), true);
+  });
+});
+
+test(`${SCRIPT}: confirmando, aborta el revert de verdad y deja el workspace limpio`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    await provocarRevert(repoRoot);
+
+    const { status, output } = runScript(repoRoot, 's\n');
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    assert.match(output, /Revert abortado/);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'REVERT_HEAD')), false);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+// ── Secuencia a medias sin CHERRY_PICK_HEAD / REVERT_HEAD ───────────
+
+test(`${SCRIPT}: detecta una secuencia a medias cuando el unico testigo es .git/sequencer`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(path.join(repoRoot, 'b.txt'), 'b\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'limpio'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'conflictivo'], repoRoot);
+    await writeFile(path.join(repoRoot, 'c.txt'), 'c\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'pendiente'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
+
+    const cp = gitRaw(['cherry-pick', 'main..otra'], repoRoot);
+    assert.notEqual(cp.status, 0, `deberia conflictar en el segundo commit:\n${cp.output}`);
+
+    // Resolver y comitear a mano en vez de "cherry-pick --continue":
+    // Git borra CHERRY_PICK_HEAD y deja .git/sequencer con lo que falta.
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nRESUELTO\nl3\n', 'utf8');
+    git(['add', 'a.txt'], repoRoot);
+    git(['commit', '-q', '-m', 'resuelto a mano'], repoRoot);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), false);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'sequencer')), true);
+
+    const { status, output } = runScript(repoRoot);
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    assert.doesNotMatch(output, /estado normal/, `salida:\n${output}`);
+    assert.match(output, /Cherry-pick en curso detectado/);
+    assert.match(output, /Commits pendientes en la secuencia/);
+  });
+});
+
+// ── No regresion: lo que ya funcionaba sigue funcionando ────────────
+
+test(`${SCRIPT}: sigue abortando un merge en conflicto (no regresion)`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
+    const mg = gitRaw(['merge', 'otra'], repoRoot);
+    assert.notEqual(mg.status, 0, `el merge deberia conflictar:\n${mg.output}`);
+
+    const { status, output } = runScript(repoRoot, 's\n');
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    assert.match(output, /Merge en curso detectado/);
+    assert.match(output, /Merge abortado/);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'MERGE_HEAD')), false);
+    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
+  });
+});
+
+test(`${SCRIPT}: sigue abortando un rebase en conflicto (no regresion)`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
+    git(['checkout', '-q', 'otra'], repoRoot);
+    const rb = gitRaw(['rebase', 'main'], repoRoot);
+    assert.notEqual(rb.status, 0, `el rebase deberia conflictar:\n${rb.output}`);
+
+    const { status, output } = runScript(repoRoot, 's\n');
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    assert.match(output, /Rebase en curso detectado/);
+    assert.match(output, /Rebase abortado/);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'rebase-merge')), false);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'otra');
+  });
+});
+
+test(`${SCRIPT}: en un repo sin nada a medias sigue diciendo que el estado es normal`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    const { status, output } = runScript(repoRoot);
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    assert.match(output, /estado normal/);
+    // El mensaje nombra ya las cuatro operaciones que sabe detectar.
+    assert.match(output, /merge, rebase, cherry-pick ni revert/);
+  });
+});
+
+test(`${SCRIPT}: un "cherry-pick -n" en conflicto no se reporta como secuencia (Git tampoco lo aborta)`, async () => {
+  await withTempRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'otra'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
+    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
+    const cp = gitRaw(['cherry-pick', '-n', 'otra'], repoRoot);
+    assert.notEqual(cp.status, 0);
+
+    // Con -n Git no escribe CHERRY_PICK_HEAD ni sequencer: no hay
+    // secuencia que abortar, solo un indice en conflicto.
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), false);
+    assert.equal(existsSync(path.join(repoRoot, '.git', 'sequencer')), false);
+    const abort = gitRaw(['cherry-pick', '--abort'], repoRoot);
+    assert.notEqual(abort.status, 0, 'Git deberia negarse a abortar aqui');
+
+    const { status, output } = runScript(repoRoot);
+
+    assert.equal(status, 0, `salida:\n${output}`);
+    assert.match(output, /estado normal/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-guard.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-guard.test.ts
new file mode 100644
index 0000000..283656d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/origin-guard.test.ts
@@ -0,0 +1,306 @@
+/**
+ * Test de regresion real (no mocks) para el frente S1 del item C6
+ * (TASK-029): create-develop.sh, recover-branch.sh y resume-work.sh hacian
+ * "fetch origin" / "pull --ff-only origin" / "push -u origin" /
+ * "ls-remote origin" sin el guard de disponibilidad que B2 ya habia
+ * introducido en los merge-*-to-main. En un repo sin origin morian con el
+ * "fatal: 'origin' does not appear to be a git repository" crudo de Git.
+ *
+ * Mismo espiritu que test/gitflow/merge-to-main.test.ts: repos Git
+ * temporales de verdad, y un segundo repo bare haciendo de origin cuando el
+ * escenario lo pide (CONVENCIONES.md, seccion Tests).
+ *
+ * Cubre ademas la parte de S3 que vive en resume-work.sh: los dos mensajes
+ * que remitian a menus de IntelliJ ("GitFlow 16 Pause Work" y "GitFlow 18
+ * Recover Branch from Origin") ahora nombran comandos que existen de verdad
+ * en el CLI desde TASK-026.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/gitflow -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+/**
+ * Ejecuta un script de Git-Flow como lo haria una persona: "bash script.sh"
+ * (core.fileMode=false en este repo, ver HALLAZGOS.md) y con stdin en EOF,
+ * que es lo que reciben los prompts interactivos cuando no hay terminal.
+ */
+function runScript(script: string, args: string[], cwd: string): { status: number | null; output: string } {
+  const result = spawnSync('bash', [path.join(SCRIPTS_DIR, script), ...args], {
+    cwd,
+    encoding: 'utf8',
+    input: '',
+  });
+  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
+}
+
+/** Repo Git temporal vacio, sin remoto, con la rama inicial pedida. */
+async function nuevoRepo(prefijo: string, ramaInicial: string): Promise<string> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), prefijo));
+  git(['init', '-q', '-b', ramaInicial], repoRoot);
+  git(['config', 'user.email', 'test@example.com'], repoRoot);
+  git(['config', 'user.name', 'Test'], repoRoot);
+  // logs/ ignorado ANTES del primer commit (hallazgo 2 de TASK-007: el
+  // propio log de Git-Flow ensuciaria el workspace y autobloquearia el
+  // script). Inofensivo aunque el registro ya no viva ahi.
+  await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+  await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', 'inicial'], repoRoot);
+  return repoRoot;
+}
+
+/** Repo con rama principal `main` y sin remoto. */
+async function conRepo(prefijo: string, fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await nuevoRepo(prefijo, 'main');
+  try {
+    await fn(repoRoot);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+/** Repo con rama principal `main` y un origin bare real ya emparejado. */
+async function conRepoYOrigin(
+  prefijo: string,
+  fn: (repoRoot: string, origin: string) => Promise<void>,
+): Promise<void> {
+  const repoRoot = await nuevoRepo(prefijo, 'main');
+  const origin = await mkdtemp(path.join(tmpdir(), `${prefijo}origin-`));
+  try {
+    git(['init', '-q', '--bare', origin], origin);
+    git(['remote', 'add', 'origin', origin], repoRoot);
+    git(['push', '-q', 'origin', 'main'], repoRoot);
+    await fn(repoRoot, origin);
+  } finally {
+    await rm(origin, { recursive: true, force: true });
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+/**
+ * Remoto configurado apuntando a una ruta inexistente: simula la VPN/red
+ * caida, que NO es lo mismo que no tener remoto (hallazgo IMPORTANTE de la
+ * revision por pares de B2).
+ */
+function romperOrigin(repoRoot: string): void {
+  git(['remote', 'add', 'origin', path.join(repoRoot, 'no-existe.git')], repoRoot);
+}
+
+// ── create-develop.sh ────────────────────────────────────────────────────────
+
+test('create-develop.sh: sin origin crea develop en local y omite el push (antes: exit 1)', async () => {
+  await conRepo('taskctl-og-cd-local-', async (repoRoot) => {
+    const { status, output } = runScript('create-develop.sh', [], repoRoot);
+
+    assert.equal(status, 0, `deberia terminar en 0 sin origin. Salida:\n${output}`);
+    assert.match(output, /Push omitido: no hay conexion con origin/);
+    // Evidencia real de Git: develop existe y sale exactamente de main.
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    assert.equal(
+      git(['rev-parse', 'develop'], repoRoot).trim(),
+      git(['rev-parse', 'main'], repoRoot).trim(),
+    );
+  });
+});
+
+test('create-develop.sh: sin origin y con develop ya en local no intenta subirla', async () => {
+  await conRepo('taskctl-og-cd-existe-', async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+
+    const { status, output } = runScript('create-develop.sh', [], repoRoot);
+
+    assert.equal(status, 0, `deberia terminar en 0 sin origin. Salida:\n${output}`);
+    assert.match(output, /Push omitido: no hay conexion con origin/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+  });
+});
+
+test('create-develop.sh: sin origin y sin rama principal local falla con error claro', async () => {
+  // Unica rama "trabajo": resolve_main_branch cae al fallback "master", que
+  // no existe ni local ni remotamente.
+  const repoRoot = await nuevoRepo('taskctl-og-cd-sinmain-', 'trabajo');
+  try {
+    const { status, output } = runScript('create-develop.sh', [], repoRoot);
+
+    assert.notEqual(status, 0);
+    assert.match(output, /no existe localmente y no hay conexion remota para crearla/);
+    assert.doesNotMatch(output, /does not appear to be a git repository/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'trabajo');
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+});
+
+test('create-develop.sh: con origin (repo bare real) sigue creando y subiendo develop', async () => {
+  await conRepoYOrigin('taskctl-og-cd-origin-', async (repoRoot, origin) => {
+    const { status, output } = runScript('create-develop.sh', [], repoRoot);
+
+    assert.equal(status, 0, `deberia terminar en 0 con origin. Salida:\n${output}`);
+    assert.match(output, /Conexion remota disponible/);
+    // La evidencia se lee en el ORIGIN bare: lo que importa es que el push llego.
+    assert.match(git(['branch', '--list', 'develop'], origin), /develop/);
+  });
+});
+
+test('create-develop.sh: origin configurado pero inaccesible aborta sin crear develop', async () => {
+  await conRepo('taskctl-og-cd-roto-', async (repoRoot) => {
+    romperOrigin(repoRoot);
+
+    const { status, output } = runScript('create-develop.sh', [], repoRoot);
+
+    assert.notEqual(status, 0);
+    assert.match(output, /origin esta configurado pero no responde/);
+    // No se crea una develop que podria quedar divergente de la de origin.
+    assert.equal(git(['branch', '--list', 'develop'], repoRoot).trim(), '');
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'main');
+  });
+});
+
+// ── recover-branch.sh ────────────────────────────────────────────────────────
+
+test('recover-branch.sh: sin origin falla explicando que no hay remoto (antes: fatal de Git)', async () => {
+  await conRepo('taskctl-og-rb-local-', async (repoRoot) => {
+    const { status, output } = runScript('recover-branch.sh', ['feature/1-x'], repoRoot);
+
+    assert.notEqual(status, 0);
+    assert.match(output, /no tiene un remoto 'origin' configurado/);
+    assert.match(output, /git remote add origin/);
+    // El fix es fallar con un mensaje que se entienda, no con el de Git.
+    assert.doesNotMatch(output, /does not appear to be a git repository/);
+  });
+});
+
+test('recover-branch.sh: origin configurado pero inaccesible falla distinguiendolo de "sin remoto"', async () => {
+  await conRepo('taskctl-og-rb-roto-', async (repoRoot) => {
+    romperOrigin(repoRoot);
+
+    const { status, output } = runScript('recover-branch.sh', ['feature/1-x'], repoRoot);
+
+    assert.notEqual(status, 0);
+    assert.match(output, /origin esta configurado pero no responde/);
+    assert.doesNotMatch(output, /no tiene un remoto 'origin' configurado/);
+  });
+});
+
+test('recover-branch.sh: con origin (repo bare real) recupera la rama borrada en local', async () => {
+  await conRepoYOrigin('taskctl-og-rb-origin-', async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/7-perdida'], repoRoot);
+    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'trabajo en feature'], repoRoot);
+    git(['push', '-q', '-u', 'origin', 'feature/7-perdida'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+    git(['branch', '-q', '-D', 'feature/7-perdida'], repoRoot);
+
+    const { status, output } = runScript('recover-branch.sh', ['feature/7-perdida'], repoRoot);
+
+    assert.equal(status, 0, `deberia recuperar la rama con origin. Salida:\n${output}`);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/7-perdida');
+    assert.match(git(['log', '--oneline', 'feature/7-perdida'], repoRoot), /trabajo en feature/);
+  });
+});
+
+// ── resume-work.sh ───────────────────────────────────────────────────────────
+
+test('resume-work.sh: sin origin retoma la rama local y avisa de que no ha sincronizado (antes: exit 1)', async () => {
+  await conRepo('taskctl-og-rw-local-', async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/1-algo'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+
+    const { status, output } = runScript('resume-work.sh', ['feature/1-algo'], repoRoot);
+
+    assert.equal(status, 0, `deberia terminar en 0 sin origin. Salida:\n${output}`);
+    assert.match(output, /este repo no tiene remoto 'origin'/);
+    assert.match(output, /retomada sin sincronizar con origin/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/1-algo');
+  });
+});
+
+test('resume-work.sh: sin origin y con rama inexistente falla dejando a la persona en su rama', async () => {
+  await conRepo('taskctl-og-rw-fantasma-', async (repoRoot) => {
+    const { status, output } = runScript('resume-work.sh', ['feature/9-fantasma'], repoRoot);
+
+    assert.notEqual(status, 0);
+    assert.match(output, /no existe localmente y no hay conexion con origin para buscarla/);
+    assert.doesNotMatch(output, /does not appear to be a git repository/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'main');
+  });
+});
+
+test('resume-work.sh: origin configurado pero inaccesible NO aborta, sigue en local avisando', async () => {
+  // A diferencia de create-develop y de los merge a main, retomar una rama
+  // que ya existe en local no escribe historia ni publica nada: abortar
+  // romperia el caso de uso central (volver a tu rama con la VPN caida).
+  await conRepo('taskctl-og-rw-roto-', async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/1-algo'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+    romperOrigin(repoRoot);
+
+    const { status, output } = runScript('resume-work.sh', ['feature/1-algo'], repoRoot);
+
+    assert.equal(status, 0, `no deberia abortar con origin caido. Salida:\n${output}`);
+    assert.match(output, /origin esta configurado pero no responde/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/1-algo');
+  });
+});
+
+test('resume-work.sh: con origin (repo bare real) sigue creando la copia local de una rama remota', async () => {
+  await conRepoYOrigin('taskctl-og-rw-origin-', async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/5-remota'], repoRoot);
+    await writeFile(path.join(repoRoot, 'remoto.txt'), 'remoto\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'commit remoto'], repoRoot);
+    git(['push', '-q', '-u', 'origin', 'feature/5-remota'], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+    git(['branch', '-q', '-D', 'feature/5-remota'], repoRoot);
+
+    const { status, output } = runScript('resume-work.sh', ['feature/5-remota'], repoRoot);
+
+    assert.equal(status, 0, `deberia terminar en 0 con origin. Salida:\n${output}`);
+    assert.match(output, /solo existe en origin/);
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/5-remota');
+    assert.match(git(['log', '--oneline'], repoRoot), /commit remoto/);
+  });
+});
+
+// ── S3: los mensajes de resume-work.sh dejan de remitir a IntelliJ ───────────
+
+test('resume-work.sh: con el workspace sucio remite a taskctl pause, no a "GitFlow 16"', async () => {
+  await conRepo('taskctl-og-rw-sucio-', async (repoRoot) => {
+    await writeFile(path.join(repoRoot, 'sucio.txt'), 'cambio sin commitear\n', 'utf8');
+
+    const { status, output } = runScript('resume-work.sh', ['main'], repoRoot);
+
+    assert.notEqual(status, 0);
+    assert.match(output, /Usa taskctl pause para guardar tu trabajo actual/);
+    assert.doesNotMatch(output, /GitFlow 16/);
+    assert.doesNotMatch(output, /Pause Work/);
+  });
+});
+
+test('resume-work.sh: con origin y rama inexistente remite a taskctl recover, no a "GitFlow 18"', async () => {
+  await conRepoYOrigin('taskctl-og-rw-recover-', async (repoRoot) => {
+    const { status, output } = runScript('resume-work.sh', ['feature/9-fantasma'], repoRoot);
+
+    assert.notEqual(status, 0);
+    assert.match(output, /no existe ni localmente ni en origin/);
+    assert.match(output, /usa taskctl recover/);
+    assert.doesNotMatch(output, /GitFlow 18/);
+    assert.doesNotMatch(output, /Recover Branch from Origin/);
+  });
+});
````
