# Peticion de revision — TASK-060 (ronda 1)

- Tarea: TASK-060 — Opciones de cierre en finish: merge normal, merge request y tag
- Rama revisada: feature/task-060-opciones-de-cierre-en-finish-merge-norma
- Rama base: develop
- Commit revisado (HEAD): cf84a14030c019e830aba6c77fd7f67cac749785
- Fecha: 2026-10-06
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-060 (criterios de aceptacion y plan)

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
cf84a14 chore(TASK-060): coste implementacion +25505353 tokens (1 agente)
e28b999 feat(TASK-060): finish con --tag, --merge-request (GitHub/GitLab) y cierre_por_defecto
2c6661f chore(TASK-060): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 9d373af..efda561 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -10,6 +10,30 @@ Coste en tokens por fase (TASK-023).
 - `taskctl finish` avisa, sin bloquear, si falta el coste de diseno o de revision. `taskctl new` escribe los tres campos a `null`.
 - La skill `task-workflow` (referencia `coste.md`) y las de fase `plan`, `start`, `review` y `finish` piden registrar cada subagente de la fase con `--agente <id>`.
 
+Opciones de cierre en `taskctl finish` (TASK-060).
+
+- **Aviso de compatibilidad**: `.taskcode/config.yml` admite una clave nueva,
+  `cierre_por_defecto` (`merge` | `merge-request`, opcional, por defecto
+  `merge`). Una version anterior del plugin aborta ante una clave que no
+  conoce, en TODOS los comandos, asi que quien la escriba obliga a que todo el
+  equipo actualice a la vez (mismo caso que la 0.5.0). Sin la clave no cambia
+  nada.
+- `taskctl finish TASK-NNN --tag <nombre>`: tag anotado (mensaje = titulo de la
+  tarea) sobre el commit de merge. Se valida antes de mergear (nombre valido,
+  sin existir en local ni en origin); solo se sube con `--push`. En hotfix y
+  release `--tag` da el nombre al tag que ya ponia el script
+  (`merge-hotfix-to-main.sh` y `merge-release-to-main.sh` aceptan `--tag`):
+  sigue habiendo uno solo.
+- `taskctl finish TASK-NNN --merge-request` (feature y fix): sube la rama, abre
+  un PR (`gh`, origin en github.com) o MR (`glab`, host con "gitlab") contra la
+  rama base y deja la tarea en `en-revision` con su URL anotada. Un segundo
+  `finish` consulta el estado a la plataforma por nombre de rama y, si esta
+  mergeado (merge, squash o rebase), cierra la tarea; si no, aborta sin tocar
+  nada. Host desconocido, CLI sin instalar o sin sesion abortan antes de subir
+  nada.
+- `taskctl siguiente --json` incluye `cierre`; la skill `finish` pregunta en
+  manual y semiautomatico y en automatico usa `cierre_por_defecto`.
+
 ## 0.5.0 — 2026-10-05
 
 Fase 6 del plan de la auditoria: suite, skill y telemetria. Actualizar con
diff --git a/CLAUDE.md b/CLAUDE.md
index ca0debc..346c3b0 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -44,7 +44,7 @@ npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar,
 ```
 
 El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | plan |
-approve | start | review | finish | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
+approve | start | review | finish [--tag <nombre>] [--merge-request] [--push] | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
 recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
 cerradas.
 
@@ -63,6 +63,12 @@ que lo comprueban.
   si no, ensucian el workspace y el guard de §8.3 aborta el propio import.
 - `taskctl import` no se puede ejecutar dos veces seguidas sin commitear en
   medio, por lo mismo.
+- Los tests de `finish --merge-request` no tienen GitHub ni GitLab: usan un
+  `gh`/`glab` de prueba en el PATH (`test/helpers/plataforma-doble.ts`) que lee y
+  escribe un fichero de estado; es el único doble de la suite. En Windows es un
+  `.exe` (enlace a `node.exe` + `--require` en `NODE_OPTIONS`) porque
+  `spawnSync` sin shell no ejecuta un `.cmd`. Una máquina con `gh`/`glab`
+  reales instalados no los usa: el doble va delante en el PATH.
 - El glob de `npm test` va entrecomillado a propósito: lo expande Node, no el
   shell. Sin comillas, la suite entera falla en `cmd.exe`.
 - En Windows nativo **fallan 3 tests y no son regresiones**: uno por el truco
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 2e574ad..9372337 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -564,3 +564,48 @@ en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué
 escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
 la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
 avisa, sin bloquear, si falta el coste de diseño o de revisión.
+
+`taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--push]` cierra la
+tarea. Sin los flags nuevos hace lo de siempre: merge `--no-ff` con el script de
+Git-Flow del tipo y tarea a `terminada`.
+
+- `--tag <nombre>` pone un tag **anotado** (mensaje = título de la tarea) sobre
+  el commit de merge, que se calcula de forma explícita y no es `HEAD` (tras el
+  merge hay un commit de cierre encima). El nombre se valida **antes** de
+  mergear: `git check-ref-format "refs/tags/<nombre>"`, sin `-` inicial, y que no
+  exista en local ni en `origin` (con origin caído y `--push`, aborta; sin
+  `--push`, avisa). En un reintento (el merge ya está hecho) un tag que apunta
+  al merge de esa tarea se salta y uno ajeno aborta. **Solo se sube con
+  `--push`**, y solo si la rama destino ya está en origin con ese commit; sin
+  `--push` la salida dice que el tag quedó solo en local. En hotfix y release
+  `--tag` pasa a `merge-hotfix-to-main.sh` / `merge-release-to-main.sh`, que
+  aceptan `--tag <nombre>` y lo usan en lugar del calculado: sigue habiendo un
+  solo tag. `finish --push` no sube `main` (se avisa), así que en un hotfix el
+  tag solo se sube si `main` ya estaba en origin con el merge.
+- `--merge-request` (solo feature y fix) **no mergea**: sube la rama (siempre,
+  aunque no pases `--push`: sin ella no hay merge request, y la salida lo dice),
+  abre un pull request (`origin` en `github.com`, con `gh`) o un merge request
+  (host que contiene «gitlab», con `glab`, también autoalojado) contra la rama
+  base, anota su URL en una sección `## Merge request` de `tarea.md`, la
+  commitea en la rama de la tarea y la deja en `en-revision`. Un host de origin
+  desconocido **aborta** nombrando qué configurar: no se supone GitLab. Antes
+  de subir nada se comprueba que hay `origin`, que el CLI está instalado y que
+  tiene sesión (`gh auth status` / `glab auth status`); cada fallo dice qué
+  instalar o configurar. Antes de crear se busca un PR/MR abierto de esa rama
+  para no duplicarlo. La URL de `origin` (puede llevar credenciales) no se
+  imprime ni se escribe en ningún sitio.
+- **Segundo `finish`** (`taskctl finish TASK-NNN --merge-request [--tag <n>]`;
+  el flag es opcional si `tarea.md` ya tiene la sección `## Merge request`):
+  pregunta a la plataforma por el estado del PR/MR **por nombre de rama**. Si
+  está `merged` (con merge, squash o rebase: no se exige ancestría) hace
+  `fetch`, comprueba que el commit resultante está en `origin/<base>`, avanza la
+  base local con fast-forward, mueve la tarea a `terminada` y regenera
+  CHANGELOG, INDEX y BOARD; con `--tag`, el tag va sobre el commit que la
+  plataforma da como resultado del merge. Si sigue abierto, o se cerró sin
+  mergear, o no se puede saber (red, error del CLI), aborta sin tocar nada.
+- `.taskcode/config.yml` admite `cierre_por_defecto: merge | merge-request`
+  (por defecto `merge`). `taskctl finish` **no** la lee: la usa la skill
+  `finish` en modo automático, que no pregunta, a través de `taskctl siguiente
+  --json` (campo `cierre`). En manual y semiautomático la skill pregunta.
+  Como cualquier clave del config, un valor mal escrito aborta, y una versión
+  anterior del plugin rechazaría la clave: todo el equipo actualiza a la vez.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
index 11c4c4c..8c27294 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/README.md
@@ -122,3 +122,14 @@ repo temporal y no dentro de `scripts/gitflow/`. Se ejecuta con:
 ```bash
 bash scripts/gitflow/test/smoke-test.sh
 ```
+
+## `--tag <nombre>` en los merge a main (TASK-060)
+
+`merge-hotfix-to-main.sh` y `merge-release-to-main.sh` aceptan `--tag
+<nombre>` y lo usan **en lugar** del nombre que calculan (`v<nombre>` o el
+nombre de la rama sin su prefijo): sigue habiendo un solo tag, el del merge a
+`main`. Lo pasa `taskctl finish --tag`. El script valida el nombre antes de
+tocar ninguna rama (`git check-ref-format "refs/tags/<nombre>"`, sin `-`
+inicial, y que no exista) y aborta sin cambiar nada si no vale. Sin `--tag` el
+comportamiento es el de siempre. Los scripts se siguen invocando como `bash
+script.sh`. Cubierto por `test/gitflow/merge-to-main-tag.test.ts`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
index 35ee990..3e8c406 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-hotfix-to-main.sh
@@ -1,12 +1,13 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"
+PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""
 while [[ $# -gt 0 ]]; do
     case "$1" in
         --push|-p) PUSH=true ;;
         --main)    MAIN_BRANCH="$2";    shift ;;
         --develop) DEVELOP_BRANCH="$2"; shift ;;
+        --tag)     TAG_OVERRIDE="$2"; shift ;;
         *)         [ -z "$NAME" ] && NAME="$1" ;;
     esac
     shift
@@ -18,6 +19,21 @@ NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
 
 initialize_gitflow_log "merge-hotfix -> main ($NAME)"
 
+# TASK-060: --tag sustituye el nombre que el script calcula (sigue habiendo UN
+# solo tag, el del merge a main). Se valida ANTES de tocar ninguna rama: un
+# nombre invalido, con "-" inicial (se leeria como opcion de git) o ya usado
+# abortaria despues del merge, con main ya movida.
+if [ -n "$TAG_OVERRIDE" ]; then
+    if [[ "$TAG_OVERRIDE" == -* ]] || ! git check-ref-format "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
+        log_error "El nombre de tag '$TAG_OVERRIDE' no es valido (git check-ref-format, y sin '-' inicial). No se ha tocado nada."
+        exit 1
+    fi
+    if git show-ref --verify --quiet "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
+        log_error "El tag '$TAG_OVERRIDE' ya existe. Elige otro nombre con --tag. No se ha tocado nada."
+        exit 1
+    fi
+fi
+
 ensure_workspace_ready \
     "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
     "chore: commit local antes de merge hotfix->main" || exit 0
@@ -85,6 +101,7 @@ invoke_git "No se pudo hacer merge de $NAME en $MAIN_BRANCH." \
 
 TAG_NAME="${NAME#hotfix/}"
 [[ "$TAG_NAME" =~ ^[0-9] ]] && TAG_NAME="v$TAG_NAME"
+[ -n "$TAG_OVERRIDE" ] && TAG_NAME="$TAG_OVERRIDE"
 invoke_git "No se pudo crear tag $TAG_NAME en $MAIN_BRANCH." \
     tag -a "$TAG_NAME" -m "Hotfix $TAG_NAME"
 log_ok "Tag creado: $TAG_NAME"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
index 26ab7e9..33cae66 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/merge-release-to-main.sh
@@ -1,12 +1,13 @@
 #!/usr/bin/env bash
 source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gitflow-common.sh"
 
-PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"
+PUSH=false; NAME=""; MAIN_BRANCH=""; DEVELOP_BRANCH="develop"; TAG_OVERRIDE=""
 while [[ $# -gt 0 ]]; do
     case "$1" in
         --push|-p) PUSH=true ;;
         --main)    MAIN_BRANCH="$2";    shift ;;
         --develop) DEVELOP_BRANCH="$2"; shift ;;
+        --tag)     TAG_OVERRIDE="$2"; shift ;;
         *)         [ -z "$NAME" ] && NAME="$1" ;;
     esac
     shift
@@ -18,6 +19,21 @@ NAME="${NAME#"${NAME%%[![:space:]]*}"}"; NAME="${NAME%"${NAME##*[![:space:]]}"}"
 
 initialize_gitflow_log "merge-release -> main ($NAME)"
 
+# TASK-060: --tag sustituye el nombre que el script calcula (sigue habiendo UN
+# solo tag, el del merge a main). Se valida ANTES de tocar ninguna rama: un
+# nombre invalido, con "-" inicial (se leeria como opcion de git) o ya usado
+# abortaria despues del merge, con main ya movida.
+if [ -n "$TAG_OVERRIDE" ]; then
+    if [[ "$TAG_OVERRIDE" == -* ]] || ! git check-ref-format "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
+        log_error "El nombre de tag '$TAG_OVERRIDE' no es valido (git check-ref-format, y sin '-' inicial). No se ha tocado nada."
+        exit 1
+    fi
+    if git show-ref --verify --quiet "refs/tags/$TAG_OVERRIDE" 2>/dev/null; then
+        log_error "El tag '$TAG_OVERRIDE' ya existe. Elige otro nombre con --tag. No se ha tocado nada."
+        exit 1
+    fi
+fi
+
 ensure_workspace_ready \
     "Workspace no limpio antes de merge. Hacer commit local en la rama actual? Si/No" \
     "chore: commit local antes de merge release" || exit 0
@@ -85,6 +101,7 @@ invoke_git "No se pudo hacer merge de $NAME en $MAIN_BRANCH." \
 
 TAG_NAME="${NAME#release/}"
 [[ "$TAG_NAME" =~ ^[0-9] ]] && TAG_NAME="v$TAG_NAME"
+[ -n "$TAG_OVERRIDE" ] && TAG_NAME="$TAG_OVERRIDE"
 invoke_git "No se pudo crear tag $TAG_NAME en $MAIN_BRANCH." \
     tag -a "$TAG_NAME" -m "Release $TAG_NAME"
 log_ok "Tag creado: $TAG_NAME"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
index 68e99b9..2779b0c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -1,12 +1,19 @@
 ---
 name: finish
-description: Fase de cierre del flujo de tareas con taskctl. Integra la rama de una tarea TASK-NNN con la revision aprobada, la mueve a terminadas y actualiza los artefactos de cierre. Se invoca como /taskcode-plugin:finish TASK-NNN.
-allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Edit Skill
+description: Fase de cierre del flujo de tareas con taskctl. Integra la rama de una tarea TASK-NNN con la revision aprobada (merge normal o merge request, con tag opcional), la mueve a terminadas y actualiza los artefactos de cierre. Se invoca como /taskcode-plugin:finish TASK-NNN.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Edit AskUserQuestion Skill
 ---
 
 # Fase: cerrar la tarea
 
-Mergea la rama de la tarea (sin borrarla) y la deja en `terminada`.
+Integra la rama de la tarea (sin borrarla) y la deja en `terminada`. Hay tres
+formas de cerrar, todas opcionales salvo la primera, que es la de siempre:
+
+- **Merge normal** (por defecto): `taskctl finish TASK-NNN`.
+- **Merge request**: `taskctl finish TASK-NNN --merge-request` sube la rama y
+  abre un pull request (GitHub) o merge request (GitLab) contra la rama base;
+  la tarea sigue en `en-revision` hasta que se mergee en la plataforma.
+- **Tag**: `--tag <nombre>` pone un tag anotado sobre el commit de merge.
 
 ## Pasos
 
@@ -24,13 +31,51 @@ Mergea la rama de la tarea (sin borrarla) y la deja en `terminada`.
    (`task-workflow/coste.md`; la cifra que muestra Claude Code al terminar un
    agente no es su coste); el aviso no bloquea y tambien se puede registrar
    despues del cierre.
-   Desde la rama de la tarea (si estas en otra: `git checkout <rama>` del
-   `tarea.md`; desde la rama base `finish` lee la copia vieja y aborta),
-   ejecuta `taskctl finish TASK-NNN` (el ID viene en `$ARGUMENTS`). Solo
-   cierra si el ultimo informe aprueba; si no, muestra el error tal cual.
-   No uses `--push` salvo que la persona lo pida: subir es un acto aparte.
-4. Si la tarea tiene criterios bajo `### Tras el cierre`, verificalos ahora en
+4. **Decide como cerrar** (ver «Como cerrar» abajo) y ejecuta `taskctl finish`
+   con lo decidido desde la rama de la tarea (si estas en otra:
+   `git checkout <rama>` del `tarea.md`; desde la rama base `finish` lee la
+   copia vieja y aborta). El ID viene en `$ARGUMENTS`. Solo cierra si el
+   ultimo informe aprueba; si no, muestra el error tal cual.
+   No uses `--push` salvo que la persona lo pida: subir es un acto aparte. El
+   tag nunca se sube sin `--push`, y la salida dice que quedo solo en local.
+5. Si la tarea tiene criterios bajo `### Tras el cierre`, verificalos ahora en
    la rama base y anota la evidencia en el `## Resultado` con un commit
    posterior.
-5. Sigue la seccion de avance (`task-workflow/avance.md`):
-   `taskctl siguiente TASK-NNN --json`; debe decir `terminada`.
+6. Sigue la seccion de avance (`task-workflow/avance.md`):
+   `taskctl siguiente TASK-NNN --json`; debe decir `terminada`. Si acabas de
+   abrir un merge request, la tarea NO esta terminada: no sigas con el
+   avance; dile a la persona la URL y que, cuando se mergee, vuelva a lanzar
+   `/taskcode-plugin:finish TASK-NNN` (cierra la cadena si habia una).
+
+## Como cerrar
+
+Lee `modo` y `cierre` de `taskctl siguiente TASK-NNN --json`: `modo` es el de
+la tarea y `cierre` la clave `cierre_por_defecto` de la configuracion
+(`merge` o `merge-request`).
+
+- **Segundo cierre.** Si el `tarea.md` ya tiene una seccion `## Merge request`,
+  el merge request ya esta abierto: no preguntes el modo de cierre. Ejecuta
+  `taskctl finish TASK-NNN --merge-request` (con `--tag <nombre>` si la
+  persona pidio tag). El estado lo consulta el CLI a la plataforma: si sigue
+  abierto o esta cerrado sin mergear, aborta y lo dice; muestra su mensaje y
+  para, no es un fallo que arreglar.
+- **Modo `manual` o `semiautomatico`**: pregunta con AskUserQuestion, en este
+  orden, y pasa lo elegido como flags:
+  1. Como cerrar: **merge normal** (opcion por defecto y primera) o **merge
+     request** (`--merge-request`). Si el CLI avisa de que falta el CLI de la
+     plataforma (`gh` o `glab`) o la sesion, muestra el mensaje: dice que
+     instalar o configurar.
+  2. Si quiere un **tag**: sin tag (por defecto) o con tag, y en ese caso el
+     nombre (`--tag <nombre>`). Con merge request el tag se pone en el
+     segundo cierre, al lanzar `finish` otra vez.
+- **Modo `automatico`**: no preguntes. Usa `cierre`: con `merge`, merge normal
+  sin tag (`taskctl finish TASK-NNN`); con `merge-request`, `taskctl finish
+  TASK-NNN --merge-request`. Nunca pases `--tag` por tu cuenta: el nombre del
+  tag lo decide una persona.
+- **Hotfix y release** no tienen merge request (se mergean a la rama principal
+  con tag y backmerge) y se cierran siempre con pregunta, en cualquier modo.
+  Solo pregunta el tag: el nombre sustituye al que el script habria puesto,
+  siempre queda un unico tag.
+
+Un nombre de tag que ya existe o no vale para Git aborta antes de mergear sin
+tocar nada: muestra el error y pregunta otro nombre.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
index 07bbfde..3dde8f5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -27,6 +27,13 @@ sube nada con `--push` sin que la persona lo pida, y cada transicion deja
 una fila en la seccion `## Transiciones` de `tarea.md` (fecha, fase, modo y
 quien decidio) en el mismo commit que la transicion.
 
+Al cerrar, la skill `finish` pregunta en `manual` y `semiautomatico` (merge
+normal, merge request, tag opcional); en `automatico` no pregunta y usa el
+campo `cierre` de `siguiente --json` (clave `cierre_por_defecto` de la
+configuracion: `merge` por defecto, o `merge-request`). Un merge request deja
+la tarea en `en-revision` hasta que se mergee: el avance se detiene ahi y un
+segundo `finish` la cierra.
+
 ## Que skill corresponde a cada fase
 
 | `fase` de `siguiente` | Skill |
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 040f3f5..149db24 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -77,7 +77,7 @@ Uso:
   taskctl codex-review TASK-NNN [--push]
   taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
                     [--informe <nombre>] [--push]
-  taskctl finish TASK-NNN [--push]
+  taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--push]
   taskctl siguiente TASK-NNN [--json]
   taskctl pausa TASK-NNN [--push]
   taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> \\
@@ -100,6 +100,13 @@ regenera en el bloque delimitado de docs/METRICAS.md (sin commitear). Sin
 registrar-coste SUMA al coste de una fase de la tarea (en cualquier estado) y lo commitea:
 --agente <id> lee lo gastado de la transcripcion de cada subagente (el id lo devuelve la
 herramienta Agent); --tokens N da una cifra a mano. Se excluyen, y 0 se rechaza.
+finish cierra con merge normal (lo de siempre). --tag <nombre> pone un tag anotado (titulo de
+la tarea) sobre el commit de merge; solo se sube con --push. --merge-request sube la rama
+y abre un PR (github.com, gh) o un MR (host con "gitlab", glab) contra la rama base en lugar
+de mergear: la tarea sigue en en-revision y, cuando la plataforma lo da por mergeado,
+taskctl finish TASK-NNN [--tag <nombre>] la cierra (el estado lo da la plataforma). Con
+--merge-request el tag va en ese segundo finish. En hotfix/release --tag da el nombre al
+tag que ya ponia el script.
 siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
 manual, semiautomatico o automatico); solo lee. pausa registra que la persona
 no quiere pasar todavia a la siguiente fase. cadena bloquea el arbol mientras
@@ -844,10 +851,27 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         scriptsDir: resolveGitflowScriptsDir(),
         onAviso: (aviso) => printAvisos(aviso),
       });
+      if (result.cierre === 'esperando-merge-request' && result.mergeRequest !== null) {
+        const mr = result.mergeRequest;
+        const conTag = result.tagSolicitado === null ? '' : ` --tag ${result.tagSolicitado}`;
+        process.stdout.write(
+          `Tarea ${result.id}: ${mr.plataforma === 'github' ? 'pull request' : 'merge request'} abierto en ` +
+            `${mr.url} contra "${result.baseBranch}".\n` +
+            `La rama "${result.rama}" se ha subido a origin aunque no pasaras --push (sin ella no hay ` +
+            'merge request). La tarea sigue en en-revision y su URL queda anotada en tarea.md.\n' +
+            `Cuando se mergee en la plataforma, ejecuta: taskctl finish ${result.id} --merge-request${conTag}\n`
+        );
+        printAutoCommit(result.autoCommit);
+        return 0;
+      }
       const mainInfo = result.mainBranch === null ? '' : ` y en "${result.mainBranch}" (con tag)`;
+      const viaMr =
+        result.mergeRequest === null
+          ? ''
+          : ` (merge request ${result.mergeRequest.url} mergeado en la plataforma)`;
       process.stdout.write(
         `Tarea ${result.id} terminada: "${result.rama}" integrada en ` +
-          `"${result.baseBranch}"${mainInfo}, tarea movida a ${result.filePath}.\n` +
+          `"${result.baseBranch}"${mainInfo}${viaMr}, tarea movida a ${result.filePath}.\n` +
           `Actualizados: ${result.changelogPath}, ${result.indexPath} y ${result.boardPath}.\n`
       );
       printAutoCommit(result.autoCommit);
@@ -862,6 +886,35 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
             `("git push origin ${result.mainBranch} --follow-tags").`
         );
       }
+      if (result.tag !== null) {
+        const t = result.tag;
+        const que = `Tag anotado "${t.nombre}" ${t.creado ? 'creado' : 'ya existia'} sobre ${t.commit.slice(0, 10)}`;
+        const subir = `git push origin refs/tags/${t.nombre}`;
+        switch (t.subida) {
+          case 'subido':
+            process.stdout.write(`${que}; subido a origin.\n`);
+            break;
+          case 'ya-en-remoto':
+            process.stdout.write(`${que}; ya estaba en origin sobre ese commit.\n`);
+            break;
+          case 'no-solicitada':
+            process.stdout.write(
+              `${que}. Quedo SOLO en local (el tag no se sube sin --push); para subirlo: ${subir}\n`
+            );
+            break;
+          case 'sin-remoto':
+          case 'rama-no-publicada':
+          case 'fallida':
+            printAvisos(
+              `${que}, pero NO se ha subido: ${t.detalle ?? t.subida}. Quedo SOLO en local; ` +
+                (t.subida === 'rama-no-publicada'
+                  ? `sube antes "${t.rama}" y despues el tag: ${subir}`
+                  : `cuando puedas: ${subir}`)
+            );
+            if (t.subida === 'fallida') return 1;
+            break;
+        }
+      }
       return 0;
     } catch (e) {
       if (
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index e45519d..ec23aac 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -61,7 +61,7 @@ export function parseArgs(argv: readonly string[]): ParsedArgs {
  * `--flag=valor`. `validos` va con su prefijo (`--titulo`, `-p`).
  */
 /** Flags booleanos del CLI: los comandos solo reconocen el token suelto. */
-const FLAGS_SIN_VALOR: readonly string[] = ['--push', '--json', '--forzar', '--escribir', '--heuristica'];
+const FLAGS_SIN_VALOR: readonly string[] = ['--push', '--json', '--forzar', '--escribir', '--heuristica', '--merge-request'];
 
 export function rechazarFlagsDesconocidos(
   argv: readonly string[],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
new file mode 100644
index 0000000..53b3b67
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-opciones.ts
@@ -0,0 +1,287 @@
+/**
+ * Opciones de cierre de `taskctl finish` (TASK-060): `--tag <nombre>`,
+ * `--merge-request` y lo que cuelga de ellas. Vive aparte de finish.ts para
+ * que ese fichero siga siendo el orquestador de siempre; aqui estan las
+ * piezas, y las decisiones del plan que las gobiernan:
+ *
+ * - El tag es ANOTADO (mensaje = titulo de la tarea) y va sobre un commit
+ *   calculado de forma explicita (`commitDeIntegracion`), nunca sobre HEAD.
+ * - Un tag que ya existe BLOQUEA antes de mergear; pero en un reintento (el
+ *   merge ya esta hecho) un tag que apunta al merge de ESTA tarea se salta y
+ *   uno que apunta a otro sitio aborta.
+ * - El tag solo se sube con `--push` y solo cuando la rama destino ya esta en
+ *   origin con ese commit.
+ * - `--merge-request`: el preflight (origin, plataforma, CLI, sesion) corre
+ *   ANTES de subir nada, y nada de aqui imprime la URL de origin.
+ */
+import {
+  hasOrigin,
+  isValidTagName,
+  tagCommit,
+  tagRemoto,
+  crearTagAnotado,
+  pushTag,
+  ramaRemotaContiene,
+  urlsDeOrigin,
+} from '../fs/git.js';
+import { GitCommandError } from '../fs/git.js';
+import { comprobarCli } from '../fs/merge-request.js';
+import {
+  detectarPlataforma,
+  ocultarCredenciales,
+  type RemotoPlataforma,
+} from '../core/plataforma-remota.js';
+
+export class FinishCommandError extends Error {}
+
+/** Flags de `taskctl finish`: --push mas las dos opciones de cierre de TASK-060. */
+export const FLAGS_FINISH: readonly string[] = ['--push', '-p', '--tag', '--merge-request'];
+
+export interface FlagsCierre {
+  tag: string | null;
+  mergeRequest: boolean;
+  /** argv sin `--tag <n>` ni `--merge-request`. */
+  resto: string[];
+}
+
+/**
+ * Saca `--tag <nombre>` / `--tag=<nombre>` y `--merge-request` de argv. Se
+ * hace a mano (como `extraerPushFlag`) porque `--merge-request` es booleano
+ * y `parseArgs` lo leeria como `--merge-request TASK-NNN`. Un `--tag` sin
+ * nombre, o repetido, aborta: ignorarlo dejaria cerrar sin el tag pedido.
+ */
+export function extraerFlagsCierre(argv: readonly string[]): FlagsCierre {
+  const resto: string[] = [];
+  let tag: string | null = null;
+  let mergeRequest = false;
+  for (let i = 0; i < argv.length; i++) {
+    const arg = argv[i] as string;
+    if (arg === '--merge-request') {
+      mergeRequest = true;
+      continue;
+    }
+    if (arg === '--tag' || arg.startsWith('--tag=')) {
+      if (tag !== null) {
+        throw new FinishCommandError('[ERROR] taskctl finish: "--tag" esta repetido; un cierre lleva un solo tag.');
+      }
+      let valor: string | undefined;
+      if (arg === '--tag') {
+        valor = argv[i + 1];
+        i++;
+      } else {
+        valor = arg.slice('--tag='.length);
+      }
+      if (valor === undefined || valor.trim() === '' || (arg === '--tag' && valor.startsWith('--'))) {
+        throw new FinishCommandError(
+          '[ERROR] taskctl finish: "--tag" necesita un nombre: taskctl finish TASK-NNN --tag v1.2.0.'
+        );
+      }
+      tag = valor;
+      continue;
+    }
+    resto.push(arg);
+  }
+  return { tag, mergeRequest, resto };
+}
+
+// ---------------------------------------------------------------------
+// Tag
+// ---------------------------------------------------------------------
+
+/** Que paso con la subida del tag (solo se intenta con `--push`). */
+export type SubidaTag =
+  | 'no-solicitada'
+  | 'subido'
+  | 'ya-en-remoto'
+  | 'sin-remoto'
+  | 'rama-no-publicada'
+  | 'fallida';
+
+export interface TagResultado {
+  nombre: string;
+  /** Commit sobre el que va el tag (SHA completo). */
+  commit: string;
+  /** true si ESTA invocacion lo creo (false: ya existia sobre ese commit). */
+  creado: boolean;
+  subida: SubidaTag;
+  /** Rama que debia estar en origin para poder subirlo. */
+  rama: string;
+  /** Detalle legible de la subida cuando no fue `subido`/`no-solicitada`. */
+  detalle: string | null;
+}
+
+/** El nombre vale para Git. Aborta sin tocar nada si no. */
+export function validarNombreTag(nombre: string, id: string, cwd: string): void {
+  if (!isValidTagName(nombre, cwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: "${nombre}" no es un nombre de tag valido (git check-ref-format "refs/tags/<nombre>", ` +
+        'y sin "-" inicial: se leeria como una opcion). Elige otro con --tag; no se ha tocado nada.'
+    );
+  }
+}
+
+/**
+ * ANTES de mergear: el tag no puede existir ni en local ni en origin. Si hay
+ * origin pero no responde, con `--push` se aborta (no se puede garantizar que
+ * el nombre este libre justo antes de publicarlo) y sin el se avisa: el tag
+ * se queda en local y la comprobacion remota se repetira al subirlo.
+ */
+export function comprobarTagLibre(
+  nombre: string,
+  id: string,
+  push: boolean,
+  cwd: string,
+  onAviso: ((aviso: string) => void) | undefined
+): void {
+  if (tagCommit(nombre, cwd) !== null) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: el tag "${nombre}" ya existe en local. Elige otro nombre con --tag ` +
+        '(o borra ese tag si es tuyo: git tag -d ' +
+        `${nombre}); no se ha tocado nada.`
+    );
+  }
+  const remoto = tagRemoto(nombre, cwd);
+  if (remoto.estado === 'presente') {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: el tag "${nombre}" ya existe en origin. Elige otro nombre con --tag; ` +
+        'no se ha tocado nada.'
+    );
+  }
+  if (remoto.estado === 'inalcanzable') {
+    if (push) {
+      throw new FinishCommandError(
+        `[ERROR] ${id}: origin no responde y con --push no se puede comprobar que el tag "${nombre}" ` +
+          'este libre en el remoto. Reintenta con red, o cierra sin --push; no se ha tocado nada.'
+      );
+    }
+    onAviso?.(
+      `${id}: origin no responde; el nombre del tag "${nombre}" solo se ha comprobado en local ` +
+        '(se volvera a comprobar si lo subes).'
+    );
+  }
+}
+
+export type AccionTag = 'crear' | 'existe-local' | 'existe-remoto';
+
+/**
+ * Que hacer con el tag ya con el commit objetivo conocido (merge hecho). Un
+ * tag que apunta a `commit` es el de esta tarea (reintento): se salta. Uno
+ * que apunta a otro commit es ajeno y aborta. Lanza sin crear nada.
+ */
+export function planificarTag(nombre: string, commit: string, id: string, cwd: string): AccionTag {
+  const local = tagCommit(nombre, cwd);
+  if (local !== null) {
+    if (local === commit) return 'existe-local';
+    throw tagAjeno(nombre, id, 'en local');
+  }
+  const remoto = tagRemoto(nombre, cwd);
+  if (remoto.estado === 'presente') {
+    if (remoto.commit === commit) return 'existe-remoto';
+    throw tagAjeno(nombre, id, 'en origin');
+  }
+  return 'crear';
+}
+
+function tagAjeno(nombre: string, id: string, donde: string): FinishCommandError {
+  return new FinishCommandError(
+    `[ERROR] ${id}: el tag "${nombre}" ya existe ${donde} y NO apunta al merge de esta tarea (es de otra ` +
+      'cosa). No se toca. Elige otro nombre con --tag y reintenta taskctl finish: el merge ya hecho se reconoce ' +
+      'y solo se pone el tag.'
+  );
+}
+
+/** Crea el tag anotado si hace falta (segun `planificarTag`). */
+export function ponerTag(
+  nombre: string,
+  commit: string,
+  titulo: string,
+  id: string,
+  rama: string,
+  cwd: string
+): TagResultado {
+  const accion = planificarTag(nombre, commit, id, cwd);
+  if (accion === 'crear') crearTagAnotado(nombre, commit, titulo, cwd);
+  return { nombre, commit, creado: accion === 'crear', subida: 'no-solicitada', rama, detalle: null };
+}
+
+/**
+ * Sube el tag si hay `--push`, y solo si la rama destino YA esta en origin
+ * con el commit del tag: publicar un tag sobre un commit que el remoto no
+ * tiene en su rama es la forma de dejar un tag huerfano. Nunca lanza: un
+ * fallo de subida llega al CLI como `fallida` (el cierre ya esta hecho).
+ */
+export function subirTag(tag: TagResultado, push: boolean, cwd: string): TagResultado {
+  if (!push) return tag;
+  const nombre = tag.nombre;
+  try {
+    const remoto = tagRemoto(nombre, cwd);
+    if (remoto.estado === 'sin-origin' || remoto.estado === 'inalcanzable') {
+      return {
+        ...tag,
+        subida: 'sin-remoto',
+        detalle: 'no hay conexion con origin (sin remoto configurado, o red caida)',
+      };
+    }
+    if (remoto.estado === 'presente') {
+      if (remoto.commit === tag.commit) return { ...tag, subida: 'ya-en-remoto' };
+      return {
+        ...tag,
+        subida: 'fallida',
+        detalle: `el tag ya existe en origin sobre otro commit; no se sobrescribe`,
+      };
+    }
+    if (!ramaRemotaContiene(tag.rama, tag.commit, cwd)) {
+      return {
+        ...tag,
+        subida: 'rama-no-publicada',
+        detalle: `"${tag.rama}" no esta en origin con ese commit`,
+      };
+    }
+    pushTag(nombre, cwd);
+    return { ...tag, subida: 'subido' };
+  } catch (e: unknown) {
+    const msg = e instanceof GitCommandError ? e.stderr.trim() || e.message : String(e);
+    return { ...tag, subida: 'fallida', detalle: ocultarCredenciales(msg) };
+  }
+}
+
+// ---------------------------------------------------------------------
+// Merge request
+// ---------------------------------------------------------------------
+
+/**
+ * Preflight de `--merge-request`, ANTES de subir nada: hay origin, su host es
+ * de una plataforma conocida y el CLI de esa plataforma esta instalado y con
+ * sesion. Cada fallo dice que instalar o configurar. Ningun mensaje lleva la
+ * URL de origin, solo (como mucho) su host.
+ */
+export function preflightMergeRequest(id: string, cwd: string): RemotoPlataforma {
+  if (!hasOrigin(cwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: --merge-request necesita un remoto "origin" y este repo no tiene ninguno. ` +
+        'Configuralo (git remote add origin <url>) o cierra con merge normal; no se ha subido nada.'
+    );
+  }
+  let hostDesconocido: string | null = null;
+  for (const url of urlsDeOrigin(cwd)) {
+    const d = detectarPlataforma(url);
+    if (d.ok) {
+      const cli = comprobarCli(d.remoto, cwd);
+      if (!cli.ok) {
+        throw new FinishCommandError(`[ERROR] ${id}: --merge-request: ${cli.mensaje} No se ha subido nada.`);
+      }
+      return d.remoto;
+    }
+    if (d.host !== null && hostDesconocido === null) hostDesconocido = d.host;
+  }
+  throw new FinishCommandError(
+    hostDesconocido === null
+      ? `[ERROR] ${id}: --merge-request: "origin" no apunta a una URL de red (https o ssh) de GitHub ` +
+          'ni de GitLab, asi que no se sabe que CLI usar. Apunta origin a github.com (gh) o a un host de ' +
+          'GitLab (glab), o cierra con merge normal; no se ha subido nada.'
+      : `[ERROR] ${id}: --merge-request: el host de origin ("${hostDesconocido}") no es github.com ni un host ` +
+          'de GitLab (su nombre debe contener "gitlab"), asi que no se sabe que CLI usar. No se supone ' +
+          'GitLab. Usa un origin de github.com (gh) o de un host de GitLab (glab), o cierra con merge ' +
+          'normal; no se ha subido nada.'
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 8bbee32..15283c1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -15,9 +15,35 @@
  * artefactos de cierre, y nada mas — sobre develop, que es donde
  * termina el comando. Con --push sube ademas la rama.
  *
+ * Desde TASK-060 admite `--tag <nombre>` (tag anotado sobre el commit de
+ * merge), `--merge-request` (sube la rama y abre un PR/MR en lugar de
+ * mergear; un segundo `finish` lo cierra cuando la plataforma lo da por
+ * mergeado) y `--push` tambien para el tag. Las piezas estan en
+ * finish-opciones.ts; sin esos flags el comando es el de siempre.
  */
 import path from 'node:path';
 import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import {
+  FinishCommandError,
+  FLAGS_FINISH,
+  extraerFlagsCierre,
+  validarNombreTag,
+  comprobarTagLibre,
+  planificarTag,
+  ponerTag,
+  subirTag,
+  preflightMergeRequest,
+  type TagResultado,
+} from './finish-opciones.js';
+import {
+  anotarMergeRequest,
+  ocultarCredenciales,
+  urlMergeRequestAnotada,
+  type Plataforma,
+  type RemotoPlataforma,
+  type EstadoMergeRequest,
+} from '../core/plataforma-remota.js';
+import { abrirMergeRequest, estadoMergeRequest, MergeRequestError } from '../fs/merge-request.js';
 import { readFile, writeFile, mkdir } from 'node:fs/promises';
 import type { Task } from '../core/task.js';
 import { parseTareaFile } from '../core/tarea-file.js';
@@ -40,9 +66,17 @@ import {
   checkoutBranch,
   resolveIntegrationBranch,
   localBranchExists,
+  commitDeIntegracion,
+  numeroDePadres,
+  pushRama,
+  fetchOrigin,
+  resolverCommit,
+  fastForwardDesde,
+  GitCommandError,
 } from '../fs/git.js';
 import {
   autoCommit,
+  AutoCommitError,
   extraerPushFlag,
   mensajeChore,
   type AutoCommitResult,
@@ -52,10 +86,9 @@ import { runBoardCommand, boardFilePath } from './board.js';
 import { renderBoardMarkdown } from '../core/board-format.js';
 import { REVISION_DIRNAME } from './review.js';
 
-export class FinishCommandError extends Error {}
-
-/** Flags de `taskctl finish`: solo extraerPushFlag. */
-export const FLAGS_FINISH: readonly string[] = ['--push', '-p'];
+// Definidos en finish-opciones.ts (el error lo comparten las dos); se reexportan
+// aqui porque es de donde los importan el CLI y los tests.
+export { FinishCommandError, FLAGS_FINISH };
 
 const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
   feature: 'merge-feature-to-develop.sh',
@@ -235,6 +268,25 @@ export interface FinishCommandResult {
   boardPath: string;
   /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
   autoCommit: AutoCommitResult;
+  /**
+   * TASK-060. `terminada`: el cierre de siempre. `esperando-merge-request`: el
+   * primer `finish --merge-request` abrio el PR/MR y la tarea sigue en
+   * `en-revision`; en ese caso `changelogPath`, `indexPath` y `boardPath` son
+   * las rutas que se escribiran al cerrar, NO se han tocado.
+   */
+  cierre: 'terminada' | 'esperando-merge-request';
+  /** Tag pedido con `--tag` (null si no se pidio, o si se pone en el segundo `finish`). */
+  tag: TagResultado | null;
+  /** El nombre pasado con `--tag` (aunque el tag aun no exista: va en el segundo finish del MR). */
+  tagSolicitado: string | null;
+  /** PR/MR de `--merge-request`: abierto ahora (`abierto`) o ya mergeado en la plataforma (`integrado`). */
+  mergeRequest: { url: string; plataforma: Plataforma; accion: 'abierto' | 'integrado' } | null;
+}
+
+/** Lo que el planificador de MR necesita saber de la plataforma, ya resuelto y sin la URL de origin. */
+interface ContextoMergeRequest {
+  remoto: RemotoPlataforma;
+  estado: EstadoMergeRequest;
 }
 
 export async function runFinishCommand(
@@ -245,7 +297,8 @@ export async function runFinishCommand(
 ): Promise<FinishCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_FINISH, 'finish', (m) => new FinishCommandError(m));
-  const { push, resto } = extraerPushFlag(argv);
+  const { push, resto: sinPush } = extraerPushFlag(argv);
+  const { tag: nombreTag, mergeRequest: pideMergeRequest, resto } = extraerFlagsCierre(sinPush);
   const id = resto[0];
   if (id === undefined || id.trim() === '') {
     throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
@@ -327,12 +380,31 @@ export async function runFinishCommand(
     );
   }
 
+  // TASK-060: opciones de cierre. TODO lo que sigue hasta el primer efecto
+  // (push, merge, tag) solo lee y aborta sin tocar nada.
+  const urlMrAnotada = urlMergeRequestAnotada(initial.body);
+  // Una tarea que ya tiene su merge request anotado sigue por el camino del MR
+  // aunque no se repita el flag: mergear en local lo que otro merge request
+  // tiene abierto seria chocar con el.
+  const modoMergeRequest = pideMergeRequest || urlMrAnotada !== null;
+  if (modoMergeRequest && (tipo === 'hotfix' || tipo === 'release')) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: un ${tipo} se cierra con merge a la rama principal, tag y backmerge: no tiene ` +
+        'merge request. Cierralo sin --merge-request.' +
+        (urlMrAnotada !== null ? ' (tarea.md tiene una seccion "## Merge request": borrala si no aplica.)' : '')
+    );
+  }
+  if (nombreTag !== null) validarNombreTag(nombreTag, id, deps.repoCwd);
+  const mrCtx = modoMergeRequest ? resolverMergeRequest(id, rama, urlMrAnotada, deps.repoCwd) : null;
+  const integradaPorMergeRequest = mrCtx !== null && mrCtx.estado.tipo === 'integrado';
+
   // Colision de IDs ANTES de mergear (criterio 4): se comprueba contra
   // cada rama destino del merge. Para feature/fix solo la de integracion; para
-  // hotfix/release tambien la principal.
+  // hotfix/release tambien la principal. Un MR ya mergeado en la plataforma
+  // no mergea nada aqui: la carpeta de la tarea ya llego con su historia.
   const mainBranch = MERGEA_A_MAIN[tipo] ? resolveMainBranch(deps.repoCwd) : null;
   const destinos = mainBranch === null ? [ramaIntegracion] : [mainBranch, ramaIntegracion];
-  for (const destino of destinos) {
+  for (const destino of integradaPorMergeRequest ? [] : destinos) {
     const colision = detectarColisionId(id, titulo, rama, destino, deps.repoCwd);
     if (colision !== null) {
       const detalle =
@@ -352,16 +424,52 @@ export async function runFinishCommand(
     }
   }
 
+  if (mrCtx !== null && mrCtx.estado.tipo === 'ninguno') {
+    return abrirMergeRequestYAnotar({
+      tareasRoot,
+      id,
+      today,
+      push,
+      deps,
+      initial: initial as NonNullable<typeof initial>,
+      ramaIntegracion,
+      remoto: mrCtx.remoto,
+      nombreTag,
+    });
+  }
+
   const scriptName = SCRIPT_BY_TYPE[tipo];
   const integradaEnDevelop = isAncestor(rama, ramaIntegracion, deps.repoCwd);
   const integradaEnMain = mainBranch === null || isAncestor(rama, mainBranch, deps.repoCwd);
+  // TASK-060: el tag se valida ANTES de mergear. Si el merge ya esta hecho
+  // (reintento) no se exige "libre": un tag propio se reconoce despues.
+  if (nombreTag !== null && !integradaPorMergeRequest && !(integradaEnDevelop && integradaEnMain)) {
+    comprobarTagLibre(nombreTag, id, push, deps.repoCwd, deps.onAviso);
+  }
+  // Commit de merge sobre el que va el tag, si ya se conoce (el del MR), y si
+  // fue el script de hotfix/release quien creo el tag.
+  let commitParaTag: string | null = null;
+  let tagLoPusoElScript = false;
 
-  if (integradaEnDevelop && integradaEnMain) {
+  if (integradaPorMergeRequest) {
+    const integrado = (mrCtx as ContextoMergeRequest).estado as Extract<EstadoMergeRequest, { tipo: 'integrado' }>;
+    commitParaTag = traerIntegracionDeLaPlataforma({
+      id,
+      integrado,
+      ramaIntegracion,
+      nombreTag,
+      cwd: deps.repoCwd,
+    });
+  } else if (integradaEnDevelop && integradaEnMain) {
     // Camino idempotente (hallazgo IMPORTANTE de revision por pares,
     // TASK-014): los merges ya estan consumados — p. ej. un reintento
     // tras resolver a mano un conflicto de backmerge. Reejecutar el
     // script moriria en el tag ya creado (hotfix/release); aqui solo
     // queda cerrar: ponerse en la rama de integracion y mover/renderizar.
+    // TASK-060: un tag ajeno aborta ANTES de cambiar de rama.
+    if (nombreTag !== null) {
+      commitParaTag = comprobarTagDeReintento(id, tipo, rama, mainBranch ?? ramaIntegracion, mainBranch !== null, nombreTag, deps.repoCwd);
+    }
     if (currentBranch(deps.repoCwd) !== ramaIntegracion) {
       checkoutBranch(ramaIntegracion, deps.repoCwd);
     }
@@ -375,7 +483,13 @@ export async function runFinishCommand(
         `git merge --no-ff ${rama} — y reintenta taskctl finish.`
     );
   } else {
-    const { code, signal } = runGitflowScript(scriptName, [rama, '--develop', ramaIntegracion], {
+    const argsScript = [rama, '--develop', ramaIntegracion];
+    // hotfix/release: el script pone el tag en main; --tag le da el nombre.
+    if (nombreTag !== null && mainBranch !== null) {
+      argsScript.push('--tag', nombreTag);
+      tagLoPusoElScript = true;
+    }
+    const { code, signal } = runGitflowScript(scriptName, argsScript, {
       scriptsDir: deps.scriptsDir,
       cwd: deps.repoCwd,
     });
@@ -416,6 +530,41 @@ export async function runFinishCommand(
     }
   }
 
+  // TASK-060: el tag, ya con el merge hecho y ANTES de mover la tarea: si
+  // falla (tag ajeno, sin commit de merge) el reintento sigue siendo posible.
+  let tag: TagResultado | null = null;
+  const ramaDelTag = mainBranch ?? ramaIntegracion;
+  if (nombreTag !== null) {
+    if (commitParaTag === null) {
+      commitParaTag = commitDeMergeParaTag(id, rama, ramaDelTag, nombreTag, deps.repoCwd);
+    }
+    if (mainBranch !== null) {
+      // hotfix/release: UN solo tag por tarea, el del script. Se comprueba que
+      // existe con el nombre pedido y sobre el merge a main; crear otro con
+      // otro nombre en un reintento seria el segundo tag que se quiere evitar.
+      if (planificarTag(nombreTag, commitParaTag, id, deps.repoCwd) !== 'existe-local') {
+        throw new FinishCommandError(
+          tagLoPusoElScript
+            ? `[ERROR] ${id}: ${scriptName} termino bien pero el tag "${nombreTag}" no esta sobre el merge a ` +
+                `"${ramaDelTag}". Revisa el repo a mano.`
+            : `[ERROR] ${id}: el merge a "${mainBranch}" ya esta hecho (con el tag que puso el script) y ` +
+                `"${nombreTag}" no es ese tag. Un ${tipo} lleva un solo tag: no se crea un segundo. ` +
+                'Reintenta sin --tag, o con --tag igual al que ya existe.'
+        );
+      }
+      tag = {
+        nombre: nombreTag,
+        commit: commitParaTag,
+        creado: tagLoPusoElScript,
+        subida: 'no-solicitada',
+        rama: ramaDelTag,
+        detalle: null,
+      };
+    } else {
+      tag = ponerTag(nombreTag, commitParaTag, titulo, id, ramaDelTag, deps.repoCwd);
+    }
+  }
+
   // Lectura FRESCA, ya en la rama de integracion con el merge consumado: la unica que
   // decide la escritura. El contexto de aprobacion se recalcula sobre
   // la carpeta que el merge dejo en ella.
@@ -473,6 +622,10 @@ export async function runFinishCommand(
     push,
   });
 
+  // El tag se sube DESPUES del commit y del push de la rama: asi la rama
+  // destino ya esta en origin cuando se comprueba (subirTag lo verifica).
+  if (tag !== null) tag = subirTag(tag, push, deps.repoCwd);
+
   return {
     id: task.id,
     rama,
@@ -483,5 +636,269 @@ export async function runFinishCommand(
     indexPath,
     boardPath,
     autoCommit: commitResult,
+    cierre: 'terminada',
+    tag,
+    tagSolicitado: nombreTag,
+    mergeRequest:
+      mrCtx !== null && mrCtx.estado.tipo === 'integrado'
+        ? { url: mrCtx.estado.url, plataforma: mrCtx.remoto.plataforma, accion: 'integrado' }
+        : null,
   };
 }
+
+// ---------------------------------------------------------------------
+// TASK-060: camino del merge request.
+// ---------------------------------------------------------------------
+
+/**
+ * Preflight y estado del PR/MR de la rama (solo lectura): aborta si no hay
+ * plataforma o CLI, si el MR sigue abierto, si se cerro sin mergear o si no
+ * se puede saber. Devuelve `ninguno` (primer finish: hay que abrirlo) o
+ * `integrado` (segundo finish: hay que cerrar la tarea).
+ */
+function resolverMergeRequest(
+  id: string,
+  rama: string,
+  urlAnotada: string | null,
+  cwd: string
+): ContextoMergeRequest {
+  const remoto = preflightMergeRequest(id, cwd);
+  const estado = estadoMergeRequest(remoto, rama, cwd);
+  const nada = 'No se ha tocado nada.';
+  switch (estado.tipo) {
+    case 'desconocido':
+      throw new FinishCommandError(
+        `[ERROR] ${id}: no se pudo saber el estado del merge request de "${rama}" en ${remoto.plataforma} ` +
+          `(${estado.motivo}). Comprueba la red y la sesion del CLI y reintenta; ${nada.toLowerCase()}`
+      );
+    case 'abierto':
+      throw new FinishCommandError(
+        `[ERROR] ${id}: el merge request de "${rama}" sigue abierto (${estado.url}). Cuando se merge en la ` +
+          `plataforma, vuelve a ejecutar taskctl finish ${id}. ${nada}`
+      );
+    case 'cerrado':
+      throw new FinishCommandError(
+        `[ERROR] ${id}: el merge request de "${rama}" esta CERRADO sin mergear (${estado.url}). Reabrelo y ` +
+          'mergealo, o decide como cerrar la tarea (borra la seccion "## Merge request" de tarea.md para ' +
+          `cerrar con merge normal o abrir otro). ${nada}`
+      );
+    case 'ninguno':
+      if (urlAnotada !== null) {
+        throw new FinishCommandError(
+          `[ERROR] ${id}: tarea.md anota un merge request (${urlAnotada}) pero ${remoto.plataforma} no tiene ` +
+            `ninguno para "${rama}". Si ya no aplica, borra la seccion "## Merge request" de tarea.md. ${nada}`
+        );
+      }
+      return { remoto, estado };
+    case 'integrado':
+      return { remoto, estado };
+  }
+}
+
+/**
+ * El commit de merge de `rama` en `destino`, donde va el tag. Se calcula de
+ * forma explicita (no HEAD) y tiene que ser un commit de merge: con un
+ * fast-forward no hay un commit "de la tarea" en el que etiquetar sin
+ * adivinar, y se aborta (el merge esta hecho, la tarea sin mover).
+ */
+function commitDeMergeParaTag(id: string, rama: string, destino: string, nombreTag: string, cwd: string): string {
+  const commit = commitDeIntegracion(rama, destino, cwd);
+  if (commit === null || numeroDePadres(commit, cwd) < 2) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: "${rama}" esta integrada en "${destino}" pero no se encuentra el commit de merge ` +
+        `en el que poner el tag "${nombreTag}" (¿fast-forward o historia reescrita?). El merge esta hecho y ` +
+        'la tarea sin mover: pon el tag a mano sobre el commit correcto y reintenta sin --tag.'
+    );
+  }
+  return commit;
+}
+
+/**
+ * Reintento con el merge ya hecho: el tag, si existe, tiene que ser el de
+ * esta tarea (apuntar a su commit de merge). feature/fix: uno ajeno aborta y
+ * uno propio se salta. hotfix/release: ya lo puso el script, y un nombre
+ * distinto no crea un segundo tag. Devuelve el commit de merge.
+ */
+function comprobarTagDeReintento(
+  id: string,
+  tipo: Task['tipo'],
+  rama: string,
+  destino: string,
+  mergeaAMain: boolean,
+  nombreTag: string,
+  cwd: string
+): string {
+  const commit = commitDeMergeParaTag(id, rama, destino, nombreTag, cwd);
+  const accion = planificarTag(nombreTag, commit, id, cwd);
+  if (mergeaAMain && accion !== 'existe-local') {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: el merge a "${destino}" ya esta hecho (con el tag que puso el script) y ` +
+        `"${nombreTag}" no es ese tag. Un ${tipo} lleva un solo tag: no se crea un segundo. ` +
+        'Reintenta sin --tag, o con --tag igual al que ya existe.'
+    );
+  }
+  return commit;
+}
+
+interface AbrirMergeRequestOpts {
+  tareasRoot: string;
+  id: string;
+  today: string;
+  push: boolean;
+  deps: FinishCommandDeps;
+  initial: { task: Task; body: string; filePath: string };
+  ramaIntegracion: string;
+  remoto: RemotoPlataforma;
+  nombreTag: string | null;
+}
+
+/**
+ * Primer `finish --merge-request`: sube la rama (siempre: sin ella en el
+ * remoto no hay MR; la salida lo dice), abre el PR/MR contra la rama de
+ * integracion, anota su URL en tarea.md y lo commitea en la rama de la tarea.
+ * La tarea sigue en `en-revision`. Con `--tag` el nombre se valida ahora y el
+ * tag se pone en el segundo `finish`.
+ */
+async function abrirMergeRequestYAnotar(o: AbrirMergeRequestOpts): Promise<FinishCommandResult> {
+  const { id, deps, initial, ramaIntegracion } = o;
+  const { task } = initial;
+  const cwd = deps.repoCwd;
+  if (currentBranch(cwd) !== task.rama) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: --merge-request se ejecuta desde la rama de la tarea ("${task.rama}"), y estas en ` +
+        `"${currentBranch(cwd)}": la anotacion del merge request se commitea en ella. Cambiate con ` +
+        `git checkout ${task.rama}; no se ha subido nada.`
+    );
+  }
+  if (o.nombreTag !== null) comprobarTagLibre(o.nombreTag, id, o.push, cwd, deps.onAviso);
+
+  // Primer efecto: subir la rama.
+  try {
+    pushRama(task.rama, cwd);
+  } catch (e: unknown) {
+    const msg = e instanceof GitCommandError ? e.stderr.trim() || e.message : String(e);
+    throw new FinishCommandError(
+      `[ERROR] ${id}: no se pudo subir "${task.rama}" a origin: ${ocultarCredenciales(msg)}. ` +
+        'Sin la rama en el remoto no hay merge request; no se ha abierto nada.'
+    );
+  }
+
+  let url: string;
+  try {
+    url = abrirMergeRequest(
+      o.remoto,
+      {
+        rama: task.rama,
+        base: ramaIntegracion,
+        titulo: `${id}: ${task.titulo}`,
+        cuerpo: `Cierre de ${id} (${task.titulo}): rama ${task.rama} contra ${ramaIntegracion}. Abierto por taskctl finish.`,
+      },
+      cwd
+    );
+  } catch (e: unknown) {
+    if (e instanceof MergeRequestError) {
+      throw new FinishCommandError(
+        `[ERROR] ${id}: "${task.rama}" ya esta subida a origin, pero ${e.message}. Reintenta taskctl ` +
+          `finish ${id} --merge-request: no se duplicara (se comprueba si ya hay uno abierto).`
+      );
+    }
+    throw e;
+  }
+
+  const body = anotarMergeRequest(initial.body, url, o.remoto.plataforma);
+  const filePath = await moveTareaFile(o.tareasRoot, initial.filePath, { ...task, actualizado: o.today }, body);
+  let commit: AutoCommitResult;
+  try {
+    commit = autoCommit({
+      cwd,
+      rutas: [path.dirname(filePath)],
+      mensaje: mensajeChore(task.id, 'merge request abierto'),
+      push: o.push,
+    });
+  } catch (e: unknown) {
+    if (e instanceof AutoCommitError) {
+      throw new FinishCommandError(`${e.message}\n        El merge request SI se abrio: ${url}`);
+    }
+    throw e;
+  }
+  return {
+    id: task.id,
+    rama: task.rama,
+    baseBranch: ramaIntegracion,
+    mainBranch: null,
+    filePath,
+    changelogPath: path.join(cwd, 'CHANGELOG.md'),
+    indexPath: path.join(cwd, 'docs', 'INDEX.md'),
+    boardPath: boardFilePath(cwd),
+    autoCommit: commit,
+    cierre: 'esperando-merge-request',
+    tag: null,
+    tagSolicitado: o.nombreTag,
+    mergeRequest: { url, plataforma: o.remoto.plataforma, accion: 'abierto' },
+  };
+}
+
+interface TraerIntegracionOpts {
+  id: string;
+  integrado: Extract<EstadoMergeRequest, { tipo: 'integrado' }>;
+  ramaIntegracion: string;
+  nombreTag: string | null;
+  cwd: string;
+}
+
+/**
+ * Segundo `finish`, con el MR mergeado en la plataforma (merge, squash o
+ * rebase: el criterio es el estado `merged`, no la ancestria): trae origin,
+ * comprueba que el resultado del merge esta en la rama de integracion del
+ * remoto y deja la local al dia con un fast-forward. Todas las comprobaciones
+ * van ANTES de cambiar de rama. Devuelve el commit que la plataforma da como
+ * resultado del merge (el del tag), o null si no lo informa.
+ */
+function traerIntegracionDeLaPlataforma(o: TraerIntegracionOpts): string | null {
+  const { id, integrado, ramaIntegracion, cwd } = o;
+  if (integrado.base !== ramaIntegracion) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: el merge request (${integrado.url}) se mergeo contra "${integrado.base}", no contra la ` +
+        `rama de integracion "${ramaIntegracion}" (clave rama_base). No se cierra la tarea; no se ha tocado nada.`
+    );
+  }
+  try {
+    fetchOrigin(cwd);
+  } catch (e: unknown) {
+    const msg = e instanceof GitCommandError ? e.stderr.trim() || e.message : String(e);
+    throw new FinishCommandError(
+      `[ERROR] ${id}: no se pudo traer origin (${ocultarCredenciales(msg)}). Reintenta con red; no se ha tocado nada.`
+    );
+  }
+  const origenBase = `refs/remotes/origin/${ramaIntegracion}`;
+  if (resolverCommit(origenBase, cwd) === null) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: origin no tiene la rama "${ramaIntegracion}" tras el fetch. No se ha tocado nada.`
+    );
+  }
+  const commit = integrado.commit;
+  if (commit !== null) {
+    if (resolverCommit(commit, cwd) === null || !isAncestor(commit, origenBase, cwd)) {
+      throw new FinishCommandError(
+        `[ERROR] ${id}: la plataforma dice que el merge produjo ${commit.slice(0, 10)}, pero ese commit no esta ` +
+          `en "origin/${ramaIntegracion}" tras el fetch. No se cierra la tarea; no se ha tocado nada.`
+      );
+    }
+  } else if (o.nombreTag !== null) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: la plataforma no informa del commit que resulto del merge, y sin el no se puede poner el ` +
+        `tag "${o.nombreTag}" con seguridad. Cierra sin --tag y etiqueta a mano; no se ha tocado nada.`
+    );
+  }
+  if (!isAncestor(`refs/heads/${ramaIntegracion}`, origenBase, cwd)) {
+    throw new FinishCommandError(
+      `[ERROR] ${id}: tu "${ramaIntegracion}" local tiene commits que no estan en origin y no se puede ` +
+        'avanzar con fast-forward. Resuelvelo a mano (git pull --rebase o push) y reintenta; no se ha tocado nada.'
+    );
+  }
+  // Un tag ajeno aborta ANTES de mover nada.
+  if (o.nombreTag !== null && commit !== null) planificarTag(o.nombreTag, commit, id, cwd);
+  if (currentBranch(cwd) !== ramaIntegracion) checkoutBranch(ramaIntegracion, cwd);
+  fastForwardDesde(origenBase, cwd);
+  return commit;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index 2b1ae66..00c0248 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -17,7 +17,7 @@ import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { readFile } from 'node:fs/promises';
 import { readTareaFile } from '../fs/task-store.js';
 import { parseTareaFile } from '../core/tarea-file.js';
-import { resolverConfig, type ModoFlujo } from '../core/config.js';
+import { resolverConfig, type CierrePorDefecto, type ModoFlujo } from '../core/config.js';
 import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
 import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
 import { commitRevisadoDe, veredictoDeRonda, type VeredictoInforme } from '../core/informe-revision.js';
@@ -52,6 +52,11 @@ export interface SiguienteCommandResult extends SiguientePaso {
   id: string;
   estado: Task['estado'];
   modo: ModoFlujo;
+  /**
+   * TASK-060: `cierre_por_defecto` del config. Lo lee la skill `finish` en el
+   * modo automatico para decidir, sin preguntar, entre merge y merge request.
+   */
+  cierre: CierrePorDefecto;
   /** De donde se leyo la tarea: el working tree o la rama de la tarea. */
   leidaDe: 'working-tree' | 'rama';
   /** true si se pidio --json. */
@@ -120,7 +125,8 @@ export async function runSiguienteCommand(
     throw new SiguienteCommandError('[ERROR] Falta el ID de la tarea: taskctl siguiente TASK-NNN [--json].');
   }
   // Config roto: ConfigError, que el CLI convierte en salida != 0.
-  const modoConfig = resolverConfig(deps.repoCwd).modo_flujo;
+  const config = resolverConfig(deps.repoCwd);
+  const modoConfig = config.modo_flujo;
 
   const local = await readTareaFile(tareasRoot, id);
   if (local === null) {
@@ -211,6 +217,7 @@ export async function runSiguienteCommand(
     id: task.id,
     estado: task.estado,
     modo,
+    cierre: config.cierre_por_defecto,
     leidaDe: enOtraRama ? 'rama' : 'working-tree',
     json,
     ...siguienteFase(task, ctx, modo),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index b80ee47..93f30dd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -13,6 +13,7 @@
  * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
  * | excluir_de_revision          | dist, locks, tareas | commands/review.ts    |
  * | modo_flujo                   | manual            | core/flujo.ts, plan.ts, approve.ts |
+ * | cierre_por_defecto           | merge             | siguiente.ts -> skill finish (modo automatico) |
  *
  * `excluir_de_revision` la anadio TASK-034: la peticion de revision
  * embebia el diff entero, y el JS compilado, los lockfiles y la propia
@@ -108,11 +109,22 @@ export interface TaskcodeConfig {
    * encadena. Se congela en la tarea al cerrar `plan` (core/transiciones.ts).
    */
   modo_flujo: ModoFlujo;
+  /**
+   * TASK-060: como cierra `finish` en el modo automatico, que no pregunta:
+   * `merge` (merge local, lo de siempre) o `merge-request` (abre el PR/MR en
+   * la plataforma del remoto). En manual y semiautomatico la skill pregunta
+   * y esta clave no interviene. `taskctl finish` no la lee: solo la skill, a
+   * traves de `taskctl siguiente --json`.
+   */
+  cierre_por_defecto: CierrePorDefecto;
 }
 
 export type ModoFlujo = 'manual' | 'semiautomatico' | 'automatico';
 export const MODOS_FLUJO: readonly ModoFlujo[] = ['manual', 'semiautomatico', 'automatico'];
 
+export type CierrePorDefecto = 'merge' | 'merge-request';
+export const CIERRES_POR_DEFECTO: readonly CierrePorDefecto[] = ['merge', 'merge-request'];
+
 /**
  * El comportamiento de hoy, escrito una sola vez. Antes de C4 estos
  * tres valores vivian: 'develop' literal en git.ts, 'general-purpose'
@@ -133,6 +145,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
     'tareas/**',
   ]) as readonly string[],
   modo_flujo: 'manual',
+  cierre_por_defecto: 'merge',
 });
 
 /** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
@@ -145,6 +158,7 @@ export const CLAVES_CONFIG = [
   'timeout_sincronizacion',
   'excluir_de_revision',
   'modo_flujo',
+  'cierre_por_defecto',
 ] as const;
 
 /**
@@ -336,6 +350,9 @@ export function parsearConfig(contenido: string, ruta: string): TaskcodeConfig {
       case 'modo_flujo':
         config.modo_flujo = validarModoFlujo(donde, par.valor);
         break;
+      case 'cierre_por_defecto':
+        config.cierre_por_defecto = validarCierrePorDefecto(donde, par.valor);
+        break;
     }
   }
 
@@ -573,3 +590,23 @@ function validarModoFlujo(donde: string, valor: unknown): ModoFlujo {
       `        Valores validos: ${MODOS_FLUJO.join(', ')} (sin la clave, manual).`
   );
 }
+
+/**
+ * TASK-060: `cierre_por_defecto` es un enumerado, con la misma doctrina que
+ * `modo_flujo`: un valor mal escrito aborta nombrando los validos. Caer a
+ * `merge` en silencio mergearia en local un cierre que el equipo quiere por
+ * merge request.
+ */
+function validarCierrePorDefecto(donde: string, valor: unknown): CierrePorDefecto {
+  const cierre = validarTextoNoVacio(donde, 'cierre_por_defecto', valor);
+  if ((CIERRES_POR_DEFECTO as readonly string[]).includes(cierre)) return cierre as CierrePorDefecto;
+  const parecido = CIERRES_POR_DEFECTO.map((c) => ({ c, d: distanciaEdicion(cierre.toLowerCase(), c) }))
+    .sort((a, b) => a.d - b.d)[0];
+  const sugerencia =
+    parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.c}"?` : '';
+  throw new ConfigError(
+    `[ERROR] ${donde}: cierre_por_defecto "${cierre}" no es valido.${sugerencia}
+` +
+      `        Valores validos: ${CIERRES_POR_DEFECTO.join(', ')} (sin la clave, merge).`
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
new file mode 100644
index 0000000..55d0564
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts
@@ -0,0 +1,238 @@
+/**
+ * Plataforma del remoto `origin` y lectura de lo que contestan `gh` y
+ * `glab` (TASK-060). Puro: no lanza procesos ni toca disco; quien los
+ * lanza es fs/merge-request.ts.
+ *
+ * Reglas que salen del plan de TASK-060 y que no se negocian aqui:
+ *
+ * - La plataforma se decide por el HOST de la URL: `github.com` -> gh; un
+ *   host que contenga "gitlab" -> glab (gitlab.com y los autoalojados tipo
+ *   gitlab.empresa.es). Cualquier otro host es DESCONOCIDO y se aborta
+ *   nombrando que configurar: no se supone GitLab (decision de Carlos).
+ * - La URL de origin puede llevar credenciales (`https://usuario:token@...`).
+ *   Nada de este modulo la devuelve entera: solo el host, ya sin usuario, y
+ *   `ocultarCredenciales` limpia cualquier texto ajeno antes de mostrarlo.
+ */
+
+export type Plataforma = 'github' | 'gitlab';
+
+/** Ejecutable que gestiona cada plataforma. */
+export const CLI_PLATAFORMA: Readonly<Record<Plataforma, string>> = {
+  github: 'gh',
+  gitlab: 'glab',
+};
+
+export interface RemotoPlataforma {
+  plataforma: Plataforma;
+  /** Solo el host, en minusculas y sin usuario ni puerto. */
+  host: string;
+}
+
+/**
+ * Host de una URL de remoto Git, o null si no es una URL de red (un
+ * directorio local, una ruta de Windows, texto roto). Admite las formas
+ * https/http/ssh/git con usuario, contrasena y puerto opcionales y la forma
+ * scp (`git@host:grupo/repo.git`).
+ */
+export function hostDeRemoto(url: string): string | null {
+  const texto = url.trim();
+  const conEsquema = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/([^/?#]*)/.exec(texto);
+  let host: string;
+  if (conEsquema !== null) {
+    // Autoridad = usuario[:contrasena]@host[:puerto]. El usuario puede
+    // llevar un "@" sin codificar: manda el ULTIMO.
+    const autoridad = conEsquema[1] as string;
+    host = autoridad.slice(autoridad.lastIndexOf('@') + 1).replace(/:\d*$/, '');
+  } else {
+    // scp: [usuario@]host:ruta. Una letra de unidad (`C:\x`) o una ruta
+    // local no son hosts.
+    const scp = /^(?:[^@/\\:\s]+@)?([^@/\\:\s]+):(?!\/\/)/.exec(texto);
+    if (scp === null || (scp[1] as string).length === 1) return null;
+    host = scp[1] as string;
+  }
+  host = host.toLowerCase();
+  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(host) ? host : null;
+}
+
+export type DeteccionPlataforma =
+  | { ok: true; remoto: RemotoPlataforma }
+  | { ok: false; motivo: 'sin-host' | 'host-desconocido'; host: string | null };
+
+export function detectarPlataforma(url: string): DeteccionPlataforma {
+  const host = hostDeRemoto(url);
+  if (host === null) return { ok: false, motivo: 'sin-host', host: null };
+  if (host === 'github.com') return { ok: true, remoto: { plataforma: 'github', host } };
+  if (host.includes('gitlab')) return { ok: true, remoto: { plataforma: 'gitlab', host } };
+  return { ok: false, motivo: 'host-desconocido', host };
+}
+
+/**
+ * Sustituye `usuario:contrasena@` (o `token@`) de cualquier URL que aparezca
+ * en un texto. Se aplica a TODO lo que viene de git, gh y glab antes de
+ * mostrarlo: sus errores a veces repiten la URL del remoto.
+ */
+export function ocultarCredenciales(texto: string): string {
+  return texto.replace(/([A-Za-z][A-Za-z0-9+.-]*:\/\/)[^/\s@]*@/g, '$1***@');
+}
+
+/** Una URL web de PR/MR que se puede mostrar y guardar: http(s), sin espacios ni usuario. */
+export function esUrlPublicable(url: unknown): url is string {
+  return typeof url === 'string' && /^https?:\/\/[^\s@]+$/.test(url);
+}
+
+/**
+ * La URL que imprime `gh pr create` / `glab mr create`: la ULTIMA linea de
+ * stdout que sea una URL publicable. null si no hay ninguna.
+ */
+export function urlDeSalidaDeCreacion(stdout: string): string | null {
+  const lineas = stdout
+    .split(/\r?\n/)
+    .map((l) => l.trim())
+    .filter((l) => l !== '');
+  for (let i = lineas.length - 1; i >= 0; i--) {
+    const m = /https?:\/\/\S+/.exec(lineas[i] as string);
+    if (m !== null && esUrlPublicable(m[0])) return m[0];
+  }
+  return null;
+}
+
+export type EstadoMergeRequest =
+  /** La plataforma no conoce ningun PR/MR de esa rama. */
+  | { tipo: 'ninguno' }
+  | { tipo: 'abierto'; url: string }
+  /**
+   * Mergeado, sea con merge, squash o rebase. `commit` es el que la
+   * plataforma da como resultado (el de merge, o el squash); null si no lo
+   * informa (glab con fast-forward).
+   */
+  | { tipo: 'integrado'; url: string; base: string; commit: string | null }
+  | { tipo: 'cerrado'; url: string }
+  /** No se pudo saber (red, error del CLI, salida que no se entiende). */
+  | { tipo: 'desconocido'; motivo: string };
+
+interface Candidato {
+  estado: 'abierto' | 'integrado' | 'cerrado';
+  url: string;
+  base: string;
+  commit: string | null;
+}
+
+const SHA = /^[0-9a-f]{7,64}$/i;
+
+function texto(v: unknown): string | null {
+  return typeof v === 'string' && v !== '' ? v : null;
+}
+
+function candidatosGithub(lista: readonly unknown[], rama: string): Candidato[] | string {
+  const salida: Candidato[] = [];
+  for (const e of lista) {
+    if (typeof e !== 'object' || e === null) return 'una entrada del listado no es un objeto';
+    const o = e as Record<string, unknown>;
+    // --head filtra por nombre de rama a secas; se vuelve a comprobar por si
+    // la plataforma devolviera de mas.
+    if (texto(o['headRefName']) !== rama) continue;
+    const estado = o['state'];
+    const url = o['url'];
+    const base = texto(o['baseRefName']);
+    if (!esUrlPublicable(url) || base === null) return 'una entrada del listado no trae url o rama base';
+    const merge = o['mergeCommit'];
+    const oid =
+      typeof merge === 'object' && merge !== null ? texto((merge as Record<string, unknown>)['oid']) : null;
+    if (estado === 'OPEN') salida.push({ estado: 'abierto', url, base, commit: null });
+    else if (estado === 'MERGED') {
+      if (oid !== null && !SHA.test(oid)) return 'mergeCommit.oid no es un SHA';
+      salida.push({ estado: 'integrado', url, base, commit: oid });
+    } else if (estado === 'CLOSED') salida.push({ estado: 'cerrado', url, base, commit: null });
+    else return `estado de PR desconocido (${String(estado)})`;
+  }
+  return salida;
+}
+
+function candidatosGitlab(lista: readonly unknown[], rama: string): Candidato[] | string {
+  const salida: Candidato[] = [];
+  for (const e of lista) {
+    if (typeof e !== 'object' || e === null) return 'una entrada del listado no es un objeto';
+    const o = e as Record<string, unknown>;
+    if (texto(o['source_branch']) !== rama) continue;
+    const estado = o['state'];
+    const url = o['web_url'];
+    const base = texto(o['target_branch']);
+    if (!esUrlPublicable(url) || base === null) return 'una entrada del listado no trae web_url o target_branch';
+    if (estado === 'opened' || estado === 'locked') salida.push({ estado: 'abierto', url, base, commit: null });
+    else if (estado === 'merged') {
+      const oid = texto(o['merge_commit_sha']) ?? texto(o['squash_commit_sha']);
+      if (oid !== null && !SHA.test(oid)) return 'merge_commit_sha no es un SHA';
+      salida.push({ estado: 'integrado', url, base, commit: oid });
+    } else if (estado === 'closed') salida.push({ estado: 'cerrado', url, base, commit: null });
+    else return `estado de MR desconocido (${String(estado)})`;
+  }
+  return salida;
+}
+
+/**
+ * Lee el listado JSON de PR/MR de una rama (`gh pr list --state all --json
+ * ...` / `glab mr list --all --output json`) y decide: abierto gana a
+ * mergeado y mergeado a cerrado (una rama puede tener un PR cerrado de un
+ * intento anterior y otro abierto). Cualquier cosa que no se entienda es
+ * `desconocido`: nunca se supone "ninguno" ante una salida rara, porque
+ * "ninguno" lleva a crear un PR.
+ */
+export function interpretarListado(plataforma: Plataforma, stdout: string, rama: string): EstadoMergeRequest {
+  let datos: unknown;
+  try {
+    datos = JSON.parse(stdout.trim() === '' ? 'null' : stdout);
+  } catch {
+    return { tipo: 'desconocido', motivo: 'la salida del CLI no es JSON' };
+  }
+  // glab imprime "null" (no "[]") cuando no hay resultados en algunas versiones.
+  if (datos === null) return { tipo: 'ninguno' };
+  if (!Array.isArray(datos)) return { tipo: 'desconocido', motivo: 'la salida del CLI no es una lista' };
+  const candidatos = plataforma === 'github' ? candidatosGithub(datos, rama) : candidatosGitlab(datos, rama);
+  if (typeof candidatos === 'string') return { tipo: 'desconocido', motivo: candidatos };
+  const abierto = candidatos.find((c) => c.estado === 'abierto');
+  if (abierto !== undefined) return { tipo: 'abierto', url: abierto.url };
+  const integrado = candidatos.find((c) => c.estado === 'integrado');
+  if (integrado !== undefined) {
+    return { tipo: 'integrado', url: integrado.url, base: integrado.base, commit: integrado.commit };
+  }
+  const cerrado = candidatos.find((c) => c.estado === 'cerrado');
+  if (cerrado !== undefined) return { tipo: 'cerrado', url: cerrado.url };
+  return { tipo: 'ninguno' };
+}
+
+/**
+ * Seccion de `tarea.md` donde se anota el MR abierto. Es informativa y, a la
+ * vez, la marca con la que un segundo `finish` sabe que debe consultar a la
+ * plataforma en lugar de mergear en local; el ESTADO siempre lo da la
+ * plataforma, nunca esta seccion.
+ */
+export const SECCION_MERGE_REQUEST = '## Merge request';
+
+export function anotarMergeRequest(body: string, url: string, plataforma: Plataforma): string {
+  const eol = body.includes('\r\n') ? '\r\n' : '\n';
+  const base = body.replace(/(\r?\n)*$/, '');
+  const bloque = [
+    SECCION_MERGE_REQUEST,
+    '',
+    `- URL del merge request: ${url}`,
+    `- Plataforma: ${plataforma}`,
+  ].join(eol);
+  return `${base}${base === '' ? '' : eol + eol}${bloque}${eol}`;
+}
+
+/** La URL anotada por `anotarMergeRequest`, o null si la tarea no tiene la seccion. */
+export function urlMergeRequestAnotada(body: string): string | null {
+  const lineas = body.split(/\r?\n/);
+  let dentro = false;
+  let enBloque = false;
+  for (const l of lineas) {
+    if (/^\s*(```|~~~)/.test(l)) enBloque = !enBloque;
+    if (enBloque) continue;
+    if (/^##?\s/.test(l)) dentro = l.trimEnd() === SECCION_MERGE_REQUEST;
+    else if (dentro) {
+      const m = /^- URL del merge request: (\S+)\s*$/.exec(l);
+      if (m !== null && esUrlPublicable(m[1])) return m[1];
+    }
+  }
+  return null;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index bd947df..b7ceba3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -11,6 +11,7 @@ import { existsSync, readFileSync } from 'node:fs';
 import path from 'node:path';
 import type { Task } from '../core/task.js';
 import { resolverConfig } from '../core/config.js';
+import { ocultarCredenciales } from '../core/plataforma-remota.js';
 
 export class GitCommandError extends Error {
   constructor(
@@ -723,3 +724,193 @@ export function ensureBaseBranchReady(tipo: Task['tipo'], cwd: string): BaseBran
 
   return { baseBranch, switched: true, branchAntes };
 }
+
+/**
+ * `runGit` para operaciones que hablan con origin (fetch, push, ls-remote):
+ * el stderr de Git a veces repite la URL del remoto, que puede llevar
+ * credenciales (TASK-060), y de aqui sale a un mensaje de error.
+ */
+function runGitRemoto(args: readonly string[], cwd: string): string {
+  try {
+    return runGit(args, cwd);
+  } catch (e: unknown) {
+    if (e instanceof GitCommandError) throw new GitCommandError(args, ocultarCredenciales(e.stderr));
+    throw e;
+  }
+}
+
+// ---------------------------------------------------------------------
+// TASK-060: tags, remoto y commit de merge para `taskctl finish`.
+// ---------------------------------------------------------------------
+
+/**
+ * true si `nombre` vale como nombre de tag: `git check-ref-format` sobre
+ * `refs/tags/<nombre>` (con ese prefijo, que es como lo evalua Git al crear
+ * el tag) y, ademas, sin "-" inicial: `refs/tags/-x` es un nombre legal, pero
+ * `-x` en la linea de `git tag` o de un script se leeria como una opcion.
+ */
+export function isValidTagName(nombre: string, cwd: string): boolean {
+  if (nombre === '' || nombre.startsWith('-')) return false;
+  const result = spawnSync('git', ['check-ref-format', `refs/tags/${nombre}`], { cwd, encoding: 'utf8' });
+  if (result.error) throw new GitLaunchError(result.error);
+  return result.status === 0;
+}
+
+/** SHA del commit al que apunta el tag LOCAL (desreferenciado), o null si no existe. */
+export function tagCommit(nombre: string, cwd: string): string | null {
+  const result = spawnSync(
+    'git',
+    ['rev-parse', '--verify', '--quiet', '--end-of-options', `refs/tags/${nombre}^{commit}`],
+    { cwd, encoding: 'utf8' }
+  );
+  if (result.error) throw new GitLaunchError(result.error);
+  return result.status === 0 ? (result.stdout ?? '').trim() : null;
+}
+
+/** true si hay un remoto `origin` configurado (no dice si responde). */
+export function hasOrigin(cwd: string): boolean {
+  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd, encoding: 'utf8' });
+  if (result.error) throw new GitLaunchError(result.error);
+  return result.status === 0;
+}
+
+/**
+ * URLs de origin con las que decidir la plataforma: la efectiva (con las
+ * reglas `url.*.insteadOf` ya aplicadas) y la escrita en la config. Solo
+ * para `detectarPlataforma`: PUEDEN llevar credenciales y no se muestran ni
+ * se guardan en ningun sitio.
+ */
+export function urlsDeOrigin(cwd: string): string[] {
+  const urls: string[] = [];
+  for (const args of [
+    ['remote', 'get-url', 'origin'],
+    ['config', '--get', 'remote.origin.url'],
+  ]) {
+    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+    if (result.error) throw new GitLaunchError(result.error);
+    const url = (result.stdout ?? '').trim();
+    if (result.status === 0 && url !== '' && !urls.includes(url)) urls.push(url);
+  }
+  return urls;
+}
+
+export type TagRemoto =
+  | { estado: 'sin-origin' }
+  | { estado: 'inalcanzable' }
+  | { estado: 'ausente' }
+  | { estado: 'presente'; commit: string };
+
+/** El tag en origin (`ls-remote --tags`): ausente, o presente con el commit al que apunta. */
+export function tagRemoto(nombre: string, cwd: string): TagRemoto {
+  if (!hasOrigin(cwd)) return { estado: 'sin-origin' };
+  const ref = `refs/tags/${nombre}`;
+  const result = spawnSync('git', ['ls-remote', '--tags', 'origin', ref, `${ref}^{}`], { cwd, encoding: 'utf8' });
+  if (result.error) throw new GitLaunchError(result.error);
+  if (result.status !== 0) return { estado: 'inalcanzable' };
+  let sha: string | null = null;
+  for (const linea of (result.stdout ?? '').split(/\r?\n/)) {
+    const [oid, nombreRef] = linea.trim().split(/\s+/);
+    // El anotado lista el objeto tag y, aparte, el commit con "^{}": manda el commit.
+    if (oid !== undefined && nombreRef === `${ref}^{}`) return { estado: 'presente', commit: oid };
+    if (oid !== undefined && nombreRef === ref) sha = oid;
+  }
+  return sha === null ? { estado: 'ausente' } : { estado: 'presente', commit: sha };
+}
+
+/** Crea un tag ANOTADO sobre `commit`. El mensaje va en `--message=` (texto libre: puede empezar por "-"). */
+export function crearTagAnotado(nombre: string, commit: string, mensaje: string, cwd: string): void {
+  runGit(['tag', '--annotate', `--message=${mensaje}`, '--', nombre, commit], cwd);
+}
+
+/** Sube un tag. Refspec completo: no puede leerse como opcion ni como rama. */
+export function pushTag(nombre: string, cwd: string): void {
+  runGitRemoto(['push', 'origin', `refs/tags/${nombre}:refs/tags/${nombre}`], cwd);
+}
+
+/** Sube una rama local a la del mismo nombre en origin. */
+export function pushRama(rama: string, cwd: string): void {
+  runGitRemoto(['push', 'origin', `refs/heads/${rama}:refs/heads/${rama}`], cwd);
+}
+
+/** `git fetch origin` (ramas; los tags que apunten a lo traido van con el). */
+export function fetchOrigin(cwd: string): void {
+  runGitRemoto(['fetch', '--quiet', 'origin'], cwd);
+}
+
+/** SHA completo de un commit-ish, o null si no existe. */
+export function resolverCommit(ref: string, cwd: string): string | null {
+  const result = spawnSync('git', ['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`], {
+    cwd,
+    encoding: 'utf8',
+  });
+  if (result.error) throw new GitLaunchError(result.error);
+  return result.status === 0 ? (result.stdout ?? '').trim() : null;
+}
+
+/** `git merge --ff-only` sobre la rama actual. */
+export function fastForwardDesde(ref: string, cwd: string): void {
+  runGit(['merge', '--ff-only', '--quiet', '--end-of-options', ref], cwd);
+}
+
+/**
+ * true si la rama `rama` de ORIGIN ya contiene `commit`: se lee su punta con
+ * `ls-remote` y se comprueba la ancestria en local. Si el commit o la punta
+ * no existen en local la respuesta es false (no se puede afirmar).
+ */
+export function ramaRemotaContiene(rama: string, commit: string, cwd: string): boolean {
+  if (!hasOrigin(cwd)) return false;
+  const ls = spawnSync('git', ['ls-remote', '--heads', 'origin', `refs/heads/${rama}`], { cwd, encoding: 'utf8' });
+  if (ls.error) throw new GitLaunchError(ls.error);
+  if (ls.status !== 0) return false;
+  const punta = (ls.stdout ?? '').trim().split(/\s+/)[0];
+  if (punta === undefined || punta === '') return false;
+  const anc = spawnSync('git', ['merge-base', '--is-ancestor', '--end-of-options', commit, punta], {
+    cwd,
+    encoding: 'utf8',
+  });
+  if (anc.error) throw new GitLaunchError(anc.error);
+  return anc.status === 0;
+}
+
+/**
+ * El commit con el que `rama` entro en `destino`: el PRIMERO de la cadena
+ * first-parent de `destino` que ya contiene la punta de `rama`. Con un merge
+ * `--no-ff` es el commit de merge; se calcula asi y no con `HEAD` porque un
+ * tag es de facto irreversible una vez subido y HEAD puede ser otra cosa (un
+ * pull que trajo mas, un commit posterior). null si `rama` no esta en
+ * `destino`. Busqueda binaria: "contiene la rama" es monotono a lo largo de
+ * la cadena, asi que cuesta log(n) llamadas a Git y no n.
+ *
+ * `rama` y `destino` son nombres de rama local; para una remota, pasar
+ * `refs/remotes/...` con el prefijo `refs/` ya puesto.
+ */
+export function commitDeIntegracion(rama: string, destino: string, cwd: string): string | null {
+  const refRama = rama.startsWith('refs/') ? rama : `refs/heads/${rama}`;
+  const refDestino = destino.startsWith('refs/') ? destino : `refs/heads/${destino}`;
+  const cadena = runGit(
+    ['rev-list', '--first-parent', '--reverse', '--end-of-options', `${refRama}..${refDestino}`],
+    cwd
+  )
+    .split('\n')
+    .filter((l) => l !== '');
+  let lo = 0;
+  let hi = cadena.length - 1;
+  let hallado: string | null = null;
+  while (lo <= hi) {
+    const mid = (lo + hi) >> 1;
+    const c = cadena[mid] as string;
+    if (isAncestor(refRama, c, cwd)) {
+      hallado = c;
+      hi = mid - 1;
+    } else {
+      lo = mid + 1;
+    }
+  }
+  return hallado;
+}
+
+/** Numero de padres de un commit. */
+export function numeroDePadres(commit: string, cwd: string): number {
+  const linea = runGit(['rev-list', '--parents', '-n', '1', '--end-of-options', commit], cwd);
+  return linea.split(/\s+/).filter((t) => t !== '').length - 1;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
new file mode 100644
index 0000000..4e7fb1e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts
@@ -0,0 +1,168 @@
+/**
+ * Lanzamiento de `gh` / `glab` (TASK-060): comprobar que estan instalados y
+ * autenticados, listar el PR/MR de una rama y abrir uno. La logica de
+ * decidir (que plataforma, que significa cada estado) vive en
+ * core/plataforma-remota.ts; aqui solo se ejecuta.
+ *
+ * Como se lanzan, y por que:
+ *
+ * - `spawnSync` con ARRAY de argumentos y SIN shell, nunca `shell: true`:
+ *   titulo de la tarea, rama y host salen de ficheros y de la persona, y con
+ *   shell serian una puerta a la inyeccion de comandos. El texto libre va en
+ *   la forma `--flag=valor` (un valor que empieza por "-" no se confunde con
+ *   un flag) y la rama y la base, ya validadas por Git, van como valor de su
+ *   flag.
+ * - Esto funciona en Windows nativo porque `gh` y `glab` se instalan como
+ *   `.exe` (a diferencia de `codex`, un paquete npm que llega como
+ *   `codex.cmd` y obligo a `shell: true`, ver runCodexReview en git.ts).
+ *   Quien tenga un shim `.cmd` en su lugar recibira "no instalado": asi se
+ *   prefiere a abrir una shell con argumentos de entrada.
+ * - stdin ignorado y `GH_PROMPT_DISABLED`: nada de preguntas interactivas.
+ * - Todo lo que sale de estos programas se pasa por `ocultarCredenciales`
+ *   antes de llegar a un mensaje: a veces repiten la URL del remoto.
+ */
+import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
+import {
+  CLI_PLATAFORMA,
+  esUrlPublicable,
+  interpretarListado,
+  ocultarCredenciales,
+  urlDeSalidaDeCreacion,
+  type EstadoMergeRequest,
+  type RemotoPlataforma,
+} from '../core/plataforma-remota.js';
+
+export class MergeRequestError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'MergeRequestError';
+  }
+}
+
+const TIMEOUT_MS = 120_000;
+const MAX_BUFFER = 16 * 1024 * 1024;
+
+function lanzar(cli: string, args: readonly string[], cwd: string): SpawnSyncReturns<string> {
+  return spawnSync(cli, args, {
+    cwd,
+    encoding: 'utf8',
+    stdio: ['ignore', 'pipe', 'pipe'],
+    timeout: TIMEOUT_MS,
+    maxBuffer: MAX_BUFFER,
+    env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' },
+  });
+}
+
+/** Lo que dijo el CLI por stderr (o stdout), limpio y de una linea para un mensaje. */
+function detalle(r: SpawnSyncReturns<string>): string {
+  const t = ocultarCredenciales(`${r.stderr ?? ''}${r.stdout ?? ''}`).trim();
+  return t === '' ? '(sin salida)' : t.split(/\r?\n/).slice(0, 4).join(' | ');
+}
+
+function ayudaInstalacion(r: RemotoPlataforma): string {
+  return r.plataforma === 'github'
+    ? 'Instala GitHub CLI (https://cli.github.com) y ejecuta "gh auth login"'
+    : `Instala GitLab CLI (https://gitlab.com/gitlab-org/cli) y ejecuta "glab auth login --hostname ${r.host}"`;
+}
+
+export type ResultadoPreflightCli =
+  | { ok: true }
+  | { ok: false; motivo: 'no-instalado' | 'sin-autenticar'; mensaje: string };
+
+/**
+ * El CLI de la plataforma, instalado y autenticado en el host de origin. No
+ * hay `--version`: lanzar el CLI para `auth status` ya distingue "no existe"
+ * (error de lanzamiento) de "no hay sesion" (sale con codigo != 0).
+ */
+export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPreflightCli {
+  const cli = CLI_PLATAFORMA[remoto.plataforma];
+  const r = lanzar(cli, ['auth', 'status', '--hostname', remoto.host], cwd);
+  if (r.error) {
+    return {
+      ok: false,
+      motivo: 'no-instalado',
+      mensaje: `no se pudo ejecutar "${cli}" (${r.error.message}). ${ayudaInstalacion(remoto)}.`,
+    };
+  }
+  if (r.status !== 0) {
+    return {
+      ok: false,
+      motivo: 'sin-autenticar',
+      mensaje: `"${cli}" no esta autenticado en ${remoto.host} (${detalle(r)}). ${ayudaInstalacion(remoto)}.`,
+    };
+  }
+  return { ok: true };
+}
+
+/**
+ * Estado del PR/MR de una rama, preguntado a la plataforma por NOMBRE de rama
+ * (no por la URL anotada en tarea.md, que es solo informativa). Nunca lanza:
+ * un fallo es `desconocido`, y quien llama aborta sin tocar nada.
+ */
+export function estadoMergeRequest(remoto: RemotoPlataforma, rama: string, cwd: string): EstadoMergeRequest {
+  const cli = CLI_PLATAFORMA[remoto.plataforma];
+  const args =
+    remoto.plataforma === 'github'
+      ? [
+          'pr',
+          'list',
+          `--head=${rama}`,
+          '--state=all',
+          '--limit=100',
+          '--json=number,state,url,baseRefName,headRefName,mergeCommit',
+        ]
+      : ['mr', 'list', `--source-branch=${rama}`, '--all', '--per-page=100', '--output=json'];
+  const r = lanzar(cli, args, cwd);
+  if (r.error) return { tipo: 'desconocido', motivo: `no se pudo ejecutar "${cli}": ${r.error.message}` };
+  if (r.status !== 0) {
+    return { tipo: 'desconocido', motivo: `"${cli}" fallo al listar (${detalle(r)})` };
+  }
+  return interpretarListado(remoto.plataforma, r.stdout ?? '', rama);
+}
+
+export interface PeticionMergeRequest {
+  rama: string;
+  base: string;
+  titulo: string;
+  cuerpo: string;
+}
+
+/** Abre el PR/MR y devuelve su URL. Lanza MergeRequestError si el CLI falla. */
+export function abrirMergeRequest(
+  remoto: RemotoPlataforma,
+  peticion: PeticionMergeRequest,
+  cwd: string
+): string {
+  const cli = CLI_PLATAFORMA[remoto.plataforma];
+  const args =
+    remoto.plataforma === 'github'
+      ? [
+          'pr',
+          'create',
+          `--base=${peticion.base}`,
+          `--head=${peticion.rama}`,
+          `--title=${peticion.titulo}`,
+          `--body=${peticion.cuerpo}`,
+        ]
+      : [
+          'mr',
+          'create',
+          `--target-branch=${peticion.base}`,
+          `--source-branch=${peticion.rama}`,
+          `--title=${peticion.titulo}`,
+          `--description=${peticion.cuerpo}`,
+          '--yes',
+        ];
+  const r = lanzar(cli, args, cwd);
+  if (r.error) throw new MergeRequestError(`no se pudo ejecutar "${cli}": ${r.error.message}`);
+  if (r.status !== 0) {
+    throw new MergeRequestError(`"${cli}" no pudo crear el merge request (${detalle(r)})`);
+  }
+  const url = urlDeSalidaDeCreacion(r.stdout ?? '');
+  if (url === null || !esUrlPublicable(url)) {
+    throw new MergeRequestError(
+      `"${cli}" termino bien pero no devolvio la URL del merge request (salida: ${detalle(r)})`
+    );
+  }
+  return url;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts
new file mode 100644
index 0000000..56061f8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge-request.test.ts
@@ -0,0 +1,603 @@
+/**
+ * `taskctl finish --merge-request` (TASK-060, criterios 5 a 8 y 11): repos Git
+ * temporales de verdad con un remoto bare real (`montarOrigin`), y un
+ * ejecutable `gh` / `glab` de prueba en el PATH que lee y escribe un fichero
+ * de estado (`conDoblePlataforma`): el UNICO doble de la suite, porque
+ * GitHub y GitLab no estan en el CI. Lo que la "plataforma" hace al mergear
+ * (merge, squash) se hace de verdad en el bare con `mergearEnPlataforma`.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import { main } from '../../src/cli.js';
+import type { Task } from '../../src/core/task.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+import {
+  montarOrigin,
+  mergearEnPlataforma,
+  ramaEnBare,
+  tagsEnBare,
+  URL_GITHUB,
+  URL_GITLAB,
+  type Origin,
+} from '../helpers/finish-origin.js';
+import {
+  conDoblePlataforma,
+  sinPlataformasEnElPath,
+  type ControlDoble,
+  type EstadoDoble,
+} from '../helpers/plataforma-doble.js';
+
+const HOY = '2026-10-06';
+const ID = 'TASK-700';
+
+interface Escenario {
+  repoRoot: string;
+  tareasRoot: string;
+  origin: Origin;
+  task: Task;
+}
+
+/** Repo con origin bare bajo `url`, y la tarea en-revision en su rama (que es la rama actual). */
+async function escenario(url: string, fn: (e: Escenario) => Promise<void>, task: Task = sampleTask()): Promise<void> {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot, url);
+    try {
+      await setupTaskEnRevision(repoRoot, tareasRoot, task);
+      await fn({ repoRoot, tareasRoot, origin, task });
+    } finally {
+      await origin.limpiar();
+    }
+  });
+}
+
+function finish(e: Escenario, argv: string[], avisos: string[] = []) {
+  return runFinishCommand(e.tareasRoot, argv, HOY, {
+    repoCwd: e.repoRoot,
+    scriptsDir: SCRIPTS_DIR,
+    onAviso: (a) => avisos.push(a),
+  });
+}
+
+/** HEAD, rama actual, develop local, tags y carpeta de la tarea: lo que "no tocar nada" debe dejar igual. */
+function huella(e: Escenario): string {
+  return [
+    git(['rev-parse', 'HEAD'], e.repoRoot).trim(),
+    git(['branch', '--show-current'], e.repoRoot).trim(),
+    git(['rev-parse', 'develop'], e.repoRoot).trim(),
+    git(['tag', '-l'], e.repoRoot).trim(),
+    existsSync(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md')),
+    ramaEnBare(e.origin.bare, 'develop') ?? '-',
+  ].join('|');
+}
+
+const SIN_PRS: EstadoDoble = { prs: [] };
+
+/** Primer finish --merge-request (con el doble ya en el PATH). Devuelve la URL del PR. */
+async function abrirMr(e: Escenario, extra: string[] = []): Promise<string> {
+  const r = await finish(e, [ID, '--merge-request', ...extra]);
+  assert.equal(r.cierre, 'esperando-merge-request');
+  return (r.mergeRequest as NonNullable<typeof r.mergeRequest>).url;
+}
+
+/** La plataforma "mergea": el merge ocurre de verdad en el bare y el doble pasa a decir `integrado`. */
+async function mergearPr(e: Escenario, dbl: ControlDoble, url: string, modo: 'merge' | 'squash' | 'rebase', informar = true): Promise<string> {
+  const commit = await mergearEnPlataforma(e.origin.bare, e.task.rama, 'develop', modo);
+  const estado = dbl.leer();
+  dbl.escribir({
+    ...estado,
+    prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit: informar ? commit : null }],
+  });
+  return commit;
+}
+
+// ---------------------------------------------------------------------------
+// Criterio 6: preflight, antes de subir nada
+// ---------------------------------------------------------------------------
+
+test('--merge-request sin el CLI instalado aborta antes de subir nada, diciendo que instalar', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    const antes = huella(e);
+    await sinPlataformasEnElPath(async () => {
+      await assert.rejects(
+        () => finish(e, [ID, '--merge-request']),
+        (err: unknown) => {
+          assert.ok(err instanceof FinishCommandError);
+          assert.match((err as Error).message, /no se pudo ejecutar "gh"/);
+          assert.match((err as Error).message, /Instala GitHub CLI/);
+          assert.match((err as Error).message, /No se ha subido nada/);
+          return true;
+        }
+      );
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null, 'la rama NO se subio (ls-remote)');
+    assert.equal(huella(e), antes);
+  });
+});
+
+test('--merge-request con el CLI sin autenticar aborta antes de subir nada', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma({ ...SIN_PRS, auth: false }, async (dbl) => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /"gh" no esta autenticado en github\.com.*gh auth login/s);
+      assert.equal(dbl.llamadasDe('pr', 'create').length, 0);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+  await escenario(URL_GITLAB, async (e) => {
+    await conDoblePlataforma({ ...SIN_PRS, auth: false }, async () => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /"glab" no esta autenticado en gitlab\.example\.com.*glab auth login/s);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
+test('--merge-request con un host de origin desconocido aborta nombrando que configurar, sin suponer GitLab ni subir nada', async () => {
+  await escenario('https://git.ejemplo.org/acme/repo.git', async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      await assert.rejects(
+        () => finish(e, [ID, '--merge-request']),
+        (err: unknown) => {
+          const m = (err as Error).message;
+          assert.match(m, /el host de origin \("git\.ejemplo\.org"\) no es github\.com ni un host de GitLab/);
+          assert.match(m, /No se supone GitLab/);
+          assert.doesNotMatch(m, /acme\/repo/, 'no vuelca la URL');
+          return true;
+        }
+      );
+      assert.equal(dbl.leer().llamadas.length, 0, 'ni siquiera se lanzo un CLI');
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
+
+test('--merge-request con un origin que no es una URL de red (ruta local) o sin origin aborta antes de subir nada', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    git(['remote', 'set-url', 'origin', e.origin.bare], e.repoRoot);
+    await conDoblePlataforma(SIN_PRS, async () => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /no apunta a una URL de red/);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+  await escenario(URL_GITHUB, async (e) => {
+    git(['remote', 'remove', 'origin'], e.repoRoot);
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /este repo no tiene ninguno/);
+      assert.equal(dbl.leer().llamadas.length, 0);
+    });
+  });
+});
+
+test('--merge-request en un hotfix o release aborta: no tiene merge request', async () => {
+  const task = sampleTask({ id: 'TASK-720', tipo: 'hotfix', rama: 'hotfix/task-720-urgente' });
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot);
+    try {
+      await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+      await conDoblePlataforma(SIN_PRS, async () => {
+        await assert.rejects(
+          () => runFinishCommand(tareasRoot, ['TASK-720', '--merge-request'], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
+          /un hotfix se cierra con merge a la rama principal, tag y backmerge: no tiene merge request/
+        );
+      });
+      assert.equal(ramaEnBare(origin.bare, task.rama), null);
+    } finally {
+      await origin.limpiar();
+    }
+  });
+});
+
+// ---------------------------------------------------------------------------
+// Criterio 5: abrir el PR / MR
+// ---------------------------------------------------------------------------
+
+test('--merge-request (GitHub): sube la rama SIN --push, abre el PR contra la base, anota la URL y deja la tarea en en-revision', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    const ramaAntes = git(['rev-parse', 'HEAD'], e.repoRoot).trim();
+    const developAntes = git(['rev-parse', 'develop'], e.repoRoot).trim();
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const r = await finish(e, [ID, '--merge-request']);
+
+      assert.equal(r.cierre, 'esperando-merge-request');
+      assert.deepEqual(r.mergeRequest, { url: 'https://github.com/acme/repo/pull/1', plataforma: 'github', accion: 'abierto' });
+      // La rama esta en el remoto aunque no hubo --push (y es lo que habia al llamar: la anotacion no se sube).
+      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), ramaAntes);
+      assert.equal(r.autoCommit.push, 'no-solicitado');
+      // Se busco un PR existente ANTES de crear, y se creo uno contra develop desde la rama de la tarea.
+      const llamadas = dbl.leer().llamadas.map((l) => `${l[0]} ${l[1]} ${l[2]}`);
+      assert.deepEqual(llamadas, ['gh auth status', 'gh pr list', 'gh pr create']);
+      const [crear] = dbl.llamadasDe('pr', 'create');
+      assert.ok(crear?.includes('--base=develop'));
+      assert.ok(crear?.includes(`--head=${e.task.rama}`));
+      assert.ok(crear?.some((a) => a.startsWith('--title=') && a.includes(ID)));
+    });
+    // La tarea sigue en-revision, con la URL anotada, y la anotacion esta commiteada en SU rama.
+    const t = await readTareaFile(e.tareasRoot, ID);
+    assert.equal(t?.task.estado, 'en-revision');
+    assert.match(t?.filePath ?? '', /03-en-revision/);
+    const md = await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8');
+    assert.match(md, /## Merge request\s+- URL del merge request: https:\/\/github\.com\/acme\/repo\/pull\/1\s+- Plataforma: github/);
+    assert.match(git(['log', '-1', '--format=%s'], e.repoRoot), /chore\(TASK-700\): merge request abierto/);
+    assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), e.task.rama);
+    assert.equal(git(['rev-parse', 'develop'], e.repoRoot).trim(), developAntes, 'no se mergeo nada');
+    assert.equal(git(['status', '--porcelain'], e.repoRoot).trim(), '');
+  });
+});
+
+test('--merge-request --push sube tambien el commit de la anotacion', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async () => {
+      const r = await finish(e, [ID, '--merge-request', '--push']);
+      assert.equal(r.autoCommit.push, 'empujado');
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), git(['rev-parse', 'HEAD'], e.repoRoot).trim());
+  });
+});
+
+test('--merge-request (GitLab, incluido autoalojado): usa glab y abre el MR contra la base', async () => {
+  await escenario(URL_GITLAB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const r = await finish(e, [ID, '--merge-request']);
+      assert.deepEqual(r.mergeRequest, {
+        url: 'https://gitlab.example.com/acme/repo/-/merge_requests/1',
+        plataforma: 'gitlab',
+        accion: 'abierto',
+      });
+      const [crear] = dbl.llamadasDe('mr', 'create');
+      assert.equal(crear?.[0], 'glab');
+      assert.ok(crear?.includes('--target-branch=develop'));
+      assert.ok(crear?.includes(`--source-branch=${e.task.rama}`));
+      assert.ok(crear?.includes('--yes'));
+    });
+    assert.match(await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8'), /Plataforma: gitlab/);
+  });
+});
+
+test('--merge-request no duplica: con un PR ya abierto de esa rama no crea otro ni sube nada', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    const antes = huella(e);
+    const abierto = { estado: 'abierto' as const, url: 'https://github.com/acme/repo/pull/41', base: 'develop', head: e.task.rama };
+    await conDoblePlataforma({ prs: [abierto] }, async (dbl) => {
+      await assert.rejects(
+        () => finish(e, [ID, '--merge-request']),
+        /el merge request de "feature\/task-700-prueba-finish" sigue abierto \(https:\/\/github\.com\/acme\/repo\/pull\/41\)/
+      );
+      assert.equal(dbl.llamadasDe('pr', 'create').length, 0);
+    });
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+    assert.equal(huella(e), antes);
+  });
+});
+
+test('--merge-request: si el CLI falla al crear, la rama ya subida se dice y un reintento no duplica ni pierde nada', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma({ ...SIN_PRS, crearFalla: true }, async (dbl) => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /ya esta subida a origin, pero "gh" no pudo crear el merge request/);
+      assert.equal(existsSync(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md')), true);
+      assert.doesNotMatch(await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8'), /Merge request/);
+      dbl.escribir({ prs: [] });
+      const r = await finish(e, [ID, '--merge-request']);
+      assert.equal(r.mergeRequest?.accion, 'abierto');
+    });
+  });
+});
+
+test('--merge-request --tag: el tag NO se pone en el primer finish; un nombre invalido o repetido aborta antes de subir', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      await assert.rejects(() => finish(e, [ID, '--merge-request', '--tag=con espacio']), /no es un nombre de tag valido/);
+      git(['tag', 'ya-existe', 'main'], e.repoRoot);
+      await assert.rejects(() => finish(e, [ID, '--merge-request', '--tag', 'ya-existe']), /ya existe en local/);
+      assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null, 'ninguno de los dos subio nada');
+      assert.equal(dbl.llamadasDe('pr', 'create').length, 0);
+
+      const r = await finish(e, [ID, '--merge-request', '--tag', 'v1.0.0']);
+      assert.equal(r.tag, null);
+      assert.equal(r.tagSolicitado, 'v1.0.0');
+      assert.equal(git(['tag', '-l', 'v1.0.0'], e.repoRoot).trim(), '', 'sin tag todavia');
+    });
+  });
+});
+
+// ---------------------------------------------------------------------------
+// Criterio 7 y 8: el segundo finish
+// ---------------------------------------------------------------------------
+
+test('segundo finish con el MR ABIERTO aborta sin tocar nada (con --merge-request y sin el, por la anotacion de tarea.md)', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      await abrirMr(e);
+      const antes = huella(e);
+      const creates = dbl.llamadasDe('pr', 'create').length;
+      for (const argv of [[ID, '--merge-request'], [ID]]) {
+        await assert.rejects(() => finish(e, argv), /sigue abierto \(https:\/\/github\.com\/acme\/repo\/pull\/1\)/);
+        assert.equal(huella(e), antes);
+      }
+      assert.equal(dbl.llamadasDe('pr', 'create').length, creates, 'no se abrio otro');
+    });
+  });
+});
+
+test('segundo finish con el MR mergeado (merge commit): fetch, ff de develop, tarea a terminada y CHANGELOG/INDEX/BOARD', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      const commit = await mergearPr(e, dbl, url, 'merge');
+
+      const r = await finish(e, [ID, '--merge-request']);
+
+      assert.equal(r.cierre, 'terminada');
+      assert.equal(r.mergeRequest?.accion, 'integrado');
+      assert.equal(r.tag, null);
+      assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), 'develop');
+      // develop local avanzo hasta el merge de la plataforma (y el commit de cierre va encima).
+      assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', commit, 'develop'], { cwd: e.repoRoot }).status, 0);
+      assert.match(git(['log', '-1', '--format=%s'], e.repoRoot), /chore\(TASK-700\): tarea terminada/);
+      assert.equal((await readTareaFile(e.tareasRoot, ID))?.task.estado, 'terminada');
+      assert.match(await readFile(r.changelogPath, 'utf8'), /TASK-700 \(feature\)/);
+      assert.match(await readFile(r.indexPath, 'utf8'), /TASK-700/);
+      assert.match(await readFile(r.boardPath, 'utf8'), /TASK-700/);
+      assert.equal(existsSync(path.join(e.tareasRoot, '03-en-revision', ID)), false);
+      assert.equal(git(['status', '--porcelain'], e.repoRoot).trim(), '');
+      assert.equal(git(['tag', '-l'], e.repoRoot).trim(), '', 'sin --tag no hay tag');
+    });
+  });
+});
+
+test('segundo finish SIN repetir el flag tambien cierra (la anotacion de tarea.md lo lleva por el camino del MR)', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      await mergearPr(e, dbl, url, 'merge');
+      const r = await finish(e, [ID]);
+      assert.equal(r.cierre, 'terminada');
+      assert.equal(r.mergeRequest?.accion, 'integrado');
+    });
+  });
+});
+
+test('segundo finish con el MR mergeado por SQUASH + --tag --push: la rama no es ancestro, el tag va sobre el commit que da la plataforma y sube', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e, ['--tag', 'v1.2.0']);
+      const squash = await mergearPr(e, dbl, url, 'squash');
+
+      const r = await finish(e, [ID, '--merge-request', '--tag', 'v1.2.0', '--push']);
+
+      assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', e.task.rama, 'develop'], { cwd: e.repoRoot }).status, 1, 'squash: la rama NO es ancestro');
+      assert.equal(r.cierre, 'terminada');
+      assert.equal(git(['rev-parse', 'v1.2.0^{commit}'], e.repoRoot).trim(), squash, 'el tag va sobre el commit del merge de la plataforma, no sobre HEAD');
+      assert.notEqual(git(['rev-parse', 'HEAD'], e.repoRoot).trim(), squash);
+      assert.equal(git(['cat-file', '-t', 'refs/tags/v1.2.0'], e.repoRoot).trim(), 'tag');
+      assert.equal(git(['for-each-ref', '--format=%(contents:subject)', 'refs/tags/v1.2.0'], e.repoRoot).trim(), e.task.titulo);
+      assert.equal(r.tag?.subida, 'subido');
+      assert.deepEqual(tagsEnBare(e.origin.bare), ['v1.2.0']);
+      assert.equal(git(['--git-dir', e.origin.bare, 'rev-parse', 'v1.2.0^{commit}'], e.repoRoot).trim(), squash);
+      assert.equal(ramaEnBare(e.origin.bare, 'develop'), git(['rev-parse', 'develop'], e.repoRoot).trim());
+    });
+  });
+});
+
+test('segundo finish --tag sin --push: el tag queda en local y no sale al bare', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      await mergearPr(e, dbl, url, 'merge');
+      const r = await finish(e, [ID, '--merge-request', '--tag', 'v3']);
+      assert.equal(r.tag?.subida, 'no-solicitada');
+      assert.deepEqual(tagsEnBare(e.origin.bare), []);
+      assert.equal(git(['tag', '-l'], e.repoRoot).trim(), 'v3');
+    });
+  });
+});
+
+test('segundo finish con el MR CERRADO sin mergear aborta y lo dice, sin tocar nada', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'cerrado', url, base: 'develop', head: e.task.rama }] });
+      const antes = huella(e);
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /esta CERRADO sin mergear/);
+      assert.equal(huella(e), antes);
+    });
+  });
+});
+
+test('segundo finish sin poder saber el estado (red caida, error del CLI) aborta sin tocar nada y sin credenciales en el mensaje', async () => {
+  await escenario('https://usuario:secreto@github.com/acme/repo.git', async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      const antes = huella(e);
+      dbl.escribir({ ...dbl.leer(), listarFalla: true });
+      await assert.rejects(
+        () => finish(e, [ID, '--merge-request']),
+        (err: unknown) => {
+          const m = (err as Error).message;
+          assert.match(m, /no se pudo saber el estado del merge request/);
+          assert.doesNotMatch(m, /secreto|usuario:/, 'la URL con credenciales que repite el CLI se oculta');
+          assert.match(m, /\*\*\*@github\.com/);
+          return true;
+        }
+      );
+      assert.equal(huella(e), antes);
+      assert.match(url, /pull\/1$/);
+    });
+  });
+});
+
+test('segundo finish con un commit de merge que NO esta en origin/base, o contra otra base, aborta sin tocar nada', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      await mergearPr(e, dbl, url, 'merge');
+      const antes = huella(e);
+      const estado = dbl.leer();
+      dbl.escribir({ ...estado, prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit: 'a'.repeat(40) }] });
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /ese commit no esta en "origin\/develop"/);
+      dbl.escribir({ ...estado, prs: [{ estado: 'integrado', url, base: 'main', head: e.task.rama, commit: null }] });
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /se mergeo contra "main"/);
+      assert.equal(huella(e), antes);
+    });
+  });
+});
+
+test('segundo finish con develop local DIVERGENTE de origin aborta sin cambiar de rama', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      await mergearPr(e, dbl, url, 'merge');
+      git(['checkout', '-q', 'develop'], e.repoRoot);
+      git(['commit', '-q', '--allow-empty', '-m', 'commit local sin subir'], e.repoRoot);
+      git(['checkout', '-q', e.task.rama], e.repoRoot);
+      const antes = huella(e);
+      await assert.rejects(() => finish(e, [ID, '--merge-request']), /no se puede avanzar con fast-forward/);
+      assert.equal(huella(e), antes);
+      assert.equal(git(['branch', '--show-current'], e.repoRoot).trim(), e.task.rama);
+    });
+  });
+});
+
+test('segundo finish con un tag AJENO aborta antes de cambiar de rama; sin commit informado y con --tag tambien', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      await mergearPr(e, dbl, url, 'squash');
+      git(['tag', 'ajeno', 'main'], e.repoRoot);
+      const antes = huella(e);
+      await assert.rejects(() => finish(e, [ID, '--merge-request', '--tag', 'ajeno']), /NO apunta al merge de esta tarea/);
+      assert.equal(huella(e), antes);
+
+      dbl.escribir({ ...dbl.leer(), prs: [{ estado: 'integrado', url, base: 'develop', head: e.task.rama, commit: null }] });
+      await assert.rejects(() => finish(e, [ID, '--merge-request', '--tag', 'v5']), /no informa del commit que resulto del merge/);
+      assert.equal(huella(e), antes);
+      // Sin --tag, ese mismo estado cierra bien.
+      const r = await finish(e, [ID, '--merge-request']);
+      assert.equal(r.cierre, 'terminada');
+    });
+  });
+});
+
+test('segundo finish tras un reintento parcial (tag propio ya puesto sobre el commit de la plataforma) lo reconoce y cierra', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const url = await abrirMr(e);
+      const commit = await mergearPr(e, dbl, url, 'squash');
+      git(['fetch', '-q', 'origin'], e.repoRoot);
+      git(['tag', '-a', 'v7', '-m', 'puesto antes', commit], e.repoRoot);
+      const r = await finish(e, [ID, '--merge-request', '--tag', 'v7']);
+      assert.equal(r.tag?.creado, false);
+      assert.equal(r.cierre, 'terminada');
+    });
+  });
+});
+
+// ---------------------------------------------------------------------------
+// Credenciales en la URL de origin
+// ---------------------------------------------------------------------------
+
+const CREDENCIALES = 'https://usuario:secreto@github.com/acme/repo.git';
+
+test('una URL de origin con credenciales no aparece en el resultado, los avisos, tarea.md, el commit ni las llamadas al CLI', async () => {
+  await escenario(CREDENCIALES, async (e) => {
+    const avisos: string[] = [];
+    await conDoblePlataforma(SIN_PRS, async (dbl) => {
+      const r = await finish(e, [ID, '--merge-request'], avisos);
+      const md = await readFile(path.join(e.tareasRoot, '03-en-revision', ID, 'tarea.md'), 'utf8');
+      const todo = [JSON.stringify(r), avisos.join('\n'), md, git(['log', '-3', '--format=%B', '--name-only'], e.repoRoot), JSON.stringify(dbl.leer())].join('\n');
+      assert.doesNotMatch(todo, /secreto/);
+      assert.doesNotMatch(todo, /usuario:/);
+      assert.equal(r.mergeRequest?.plataforma, 'github');
+    });
+  });
+  // Y en los mensajes de error de cada aborto del preflight.
+  for (const [url, estado, patron] of [
+    ['https://usuario:secreto@git.ejemplo.org/acme/repo.git', SIN_PRS, /host de origin/],
+    [CREDENCIALES, { ...SIN_PRS, auth: false }, /no esta autenticado/],
+  ] as const) {
+    await escenario(url, async (e) => {
+      await conDoblePlataforma(estado, async () => {
+        await assert.rejects(
+          () => finish(e, [ID, '--merge-request']),
+          (err: unknown) => {
+            assert.match((err as Error).message, patron);
+            assert.doesNotMatch((err as Error).message, /secreto|usuario:/);
+            return true;
+          }
+        );
+      });
+    });
+  }
+});
+
+// ---------------------------------------------------------------------------
+// Por el CLI de verdad (main)
+// ---------------------------------------------------------------------------
+
+async function capturar(fn: () => Promise<number>): Promise<{ code: number; out: string; err: string }> {
+  const out: string[] = [];
+  const err: string[] = [];
+  const o = process.stdout.write.bind(process.stdout);
+  const er = process.stderr.write.bind(process.stderr);
+  // eslint-disable-next-line @typescript-eslint/no-explicit-any
+  (process.stdout as any).write = (c: string) => (out.push(String(c)), true);
+  // eslint-disable-next-line @typescript-eslint/no-explicit-any
+  (process.stderr as any).write = (c: string) => (err.push(String(c)), true);
+  try {
+    const code = await fn();
+    return { code, out: out.join(''), err: err.join('') };
+  } finally {
+    process.stdout.write = o;
+    process.stderr.write = er;
+  }
+}
+
+test('main: la salida del primer finish dice que subio la rama sin --push y como cerrar; la del segundo dice que el tag quedo local', async () => {
+  await escenario(CREDENCIALES, async (e) => {
+    const cwdAntes = process.cwd();
+    process.chdir(e.repoRoot);
+    try {
+      await conDoblePlataforma(SIN_PRS, async (dbl) => {
+        const a = await capturar(() => main(['finish', ID, '--merge-request', '--tag', 'v9']));
+        assert.equal(a.code, 0, a.err);
+        assert.match(a.out, /pull request abierto en https:\/\/github\.com\/acme\/repo\/pull\/1 contra "develop"/);
+        assert.match(a.out, /se ha subido a origin aunque no pasaras --push/);
+        assert.match(a.out, /taskctl finish TASK-700 --merge-request --tag v9/);
+        assert.doesNotMatch(a.out + a.err, /secreto/);
+
+        // taskctl ya commiteo la anotacion: el arbol esta limpio y la plataforma "mergea".
+        commitAll(e.repoRoot, 'nada que commitear');
+        const url = 'https://github.com/acme/repo/pull/1';
+        await mergearPr(e, dbl, url, 'squash');
+        const b = await capturar(() => main(['finish', ID, '--merge-request', '--tag', 'v9']));
+        assert.equal(b.code, 0, b.err);
+        assert.match(b.out, /Tarea TASK-700 terminada/);
+        assert.match(b.out, /merge request https:\/\/github\.com\/acme\/repo\/pull\/1 mergeado en la plataforma/);
+        assert.match(b.out, /Tag anotado "v9" creado sobre [0-9a-f]{10}\. Quedo SOLO en local \(el tag no se sube sin --push\)/);
+        assert.doesNotMatch(b.out + b.err, /secreto/);
+      });
+    } finally {
+      process.chdir(cwdAntes);
+    }
+  });
+});
+
+test('main: sin el CLI de la plataforma sale con codigo 1 y el mensaje dice que instalar', async () => {
+  await escenario(URL_GITHUB, async (e) => {
+    const cwdAntes = process.cwd();
+    process.chdir(e.repoRoot);
+    try {
+      await sinPlataformasEnElPath(async () => {
+        const r = await capturar(() => main(['finish', ID, '--merge-request']));
+        assert.equal(r.code, 1);
+        assert.match(r.err, /Instala GitHub CLI/);
+      });
+    } finally {
+      process.chdir(cwdAntes);
+    }
+    assert.equal(ramaEnBare(e.origin.bare, e.task.rama), null);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-tag.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-tag.test.ts
new file mode 100644
index 0000000..486b8f4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-tag.test.ts
@@ -0,0 +1,378 @@
+/**
+ * `taskctl finish --tag <nombre>` (TASK-060, criterios 2, 3, 4 y 11): repos
+ * Git temporales de verdad, los scripts merge-*.sh reales y un remoto bare
+ * local cuando el caso lo pide. La evidencia se lee de Git, no del resultado
+ * del comando.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { readTareaFile } from '../../src/fs/task-store.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import {
+  SCRIPTS_DIR,
+  sampleTask,
+  git,
+  withTempRepo,
+  setupTaskEnRevision,
+} from '../helpers/finish-fixtures.js';
+import { montarOrigin, tagsEnBare, ramaEnBare, URL_GITHUB } from '../helpers/finish-origin.js';
+
+const HOY = '2026-10-06';
+
+function finish(tareasRoot: string, repoRoot: string, argv: string[], avisos: string[] = []) {
+  return runFinishCommand(tareasRoot, argv, HOY, {
+    repoCwd: repoRoot,
+    scriptsDir: SCRIPTS_DIR,
+    onAviso: (a) => avisos.push(a),
+  });
+}
+
+/** El tag es anotado (objeto `tag`, no un commit suelto) y su mensaje es el titulo. */
+function mensajeDeTag(repoRoot: string, tag: string): string {
+  assert.equal(git(['cat-file', '-t', `refs/tags/${tag}`], repoRoot).trim(), 'tag', 'el tag debe ser anotado');
+  return git(['for-each-ref', '--format=%(contents:subject)', `refs/tags/${tag}`], repoRoot).trim();
+}
+
+/** Estado observable de "no se ha tocado nada": HEAD, develop y carpeta de la tarea. */
+function huella(repoRoot: string, tareasRoot: string, id: string): string {
+  return [
+    git(['rev-parse', 'HEAD'], repoRoot).trim(),
+    git(['rev-parse', 'develop'], repoRoot).trim(),
+    git(['branch', '--show-current'], repoRoot).trim(),
+    existsSync(path.join(tareasRoot, '03-en-revision', id, 'tarea.md')),
+    git(['tag', '-l'], repoRoot).trim(),
+  ].join('|');
+}
+
+test('finish --tag (feature): tag ANOTADO con el titulo como mensaje, sobre el commit de MERGE y no sobre HEAD', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ titulo: 'Titulo para el tag' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+
+    const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1.0.0']);
+
+    assert.equal(r.tag?.nombre, 'v1.0.0');
+    assert.equal(r.tag?.creado, true);
+    assert.equal(mensajeDeTag(repoRoot, 'v1.0.0'), 'Titulo para el tag');
+    const destino = git(['rev-parse', 'v1.0.0^{commit}'], repoRoot).trim();
+    // El merge es el padre del commit de cierre que taskctl hizo despues: HEAD NO es el objetivo.
+    const head = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    assert.notEqual(destino, head);
+    assert.equal(git(['rev-parse', 'HEAD~1'], repoRoot).trim(), destino);
+    assert.match(git(['log', '-1', '--format=%s', destino], repoRoot), /merge\(feature\): feature\/task-700-prueba-finish -> develop/);
+    assert.equal(git(['rev-list', '--parents', '-n', '1', destino], repoRoot).trim().split(' ').length, 3, 'es un commit de merge');
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-700'))?.task.estado, 'terminada');
+  });
+});
+
+test('finish --tag=v2 (forma con igual) tambien vale, y sin --tag no se crea ningun tag', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-701', rama: 'fix/task-701-a', tipo: 'fix' }));
+    const sin = await finish(tareasRoot, repoRoot, ['TASK-701']);
+    assert.equal(sin.tag, null);
+    assert.equal(git(['tag', '-l'], repoRoot).trim(), '', 'sin --tag no hay tag (comportamiento de hoy)');
+  });
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-702', rama: 'fix/task-702-b', tipo: 'fix' }));
+    await finish(tareasRoot, repoRoot, ['TASK-702', '--tag=v2']);
+    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v2');
+  });
+});
+
+test('finish --tag: un tag que YA EXISTE en local aborta ANTES de mergear, sin tocar nada', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    git(['tag', 'v1.0.0', 'main'], repoRoot);
+    const antes = huella(repoRoot, tareasRoot, 'TASK-700');
+
+    await assert.rejects(
+      () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1.0.0']),
+      (e: unknown) => {
+        assert.ok(e instanceof FinishCommandError);
+        assert.match((e as Error).message, /el tag "v1\.0\.0" ya existe en local/);
+        assert.match((e as Error).message, /no se ha tocado nada/);
+        return true;
+      }
+    );
+    assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes);
+    assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', task.rama, 'develop'], { cwd: repoRoot }).status, 1, 'no se mergeo');
+  });
+});
+
+test('finish --tag: un tag que YA EXISTE en origin (y no en local) aborta antes de mergear', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot);
+    try {
+      git(['tag', 'v9', 'main'], repoRoot);
+      git(['push', '-q', 'origin', 'refs/tags/v9'], repoRoot);
+      git(['tag', '-d', 'v9'], repoRoot);
+      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask());
+      const antes = huella(repoRoot, tareasRoot, 'TASK-700');
+
+      await assert.rejects(
+        () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v9']),
+        /el tag "v9" ya existe en origin/
+      );
+      assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes);
+    } finally {
+      await origin.limpiar();
+    }
+  });
+});
+
+test('finish --tag: nombre invalido (check-ref-format) o con "-" inicial aborta antes de mergear', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask());
+    const antes = huella(repoRoot, tareasRoot, 'TASK-700');
+    for (const malo of ['con espacio', 'a..b', 'a~b', 'termina.lock', '@{x}', '/empieza', 'v1.0/']) {
+      await assert.rejects(
+        () => finish(tareasRoot, repoRoot, ['TASK-700', `--tag=${malo}`]),
+        /no es un nombre de tag valido/,
+        malo
+      );
+    }
+    // "-x" como valor se lee como opcion de git: se rechaza aunque refs/tags/-x sea legal.
+    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag=-x']), /no es un nombre de tag valido/);
+    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag=--delete']), /no es un nombre de tag valido/);
+    // Y separado: el guard de flags desconocidos de TASK-047 lo para antes de nada.
+    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', '-x']), /flag desconocido "-x"/);
+    // --tag sin nombre, o repetido.
+    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag']), /necesita un nombre/);
+    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag=a', '--tag=b']), /repetido/);
+    assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes, 'ningun rechazo toco nada');
+  });
+});
+
+test('finish --tag: reintento con el tag PROPIO ya puesto sobre el merge de esta tarea se salta, y cierra', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    // Fallo parcial simulado: el merge y el tag estan hechos, la tarea sin mover.
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge manual'], repoRoot);
+    git(['tag', '-a', 'v3', '-m', 'puesto antes', 'HEAD'], repoRoot);
+    git(['checkout', '-q', task.rama], repoRoot);
+
+    const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v3']);
+
+    assert.equal(r.tag?.creado, false, 'no se vuelve a crear');
+    assert.equal(mensajeDeTag(repoRoot, 'v3'), 'puesto antes', 'no se reescribe');
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-700'))?.task.estado, 'terminada');
+  });
+});
+
+test('finish --tag: reintento con un tag AJENO (apunta a otro commit) aborta sin mover la tarea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge manual'], repoRoot);
+    git(['tag', 'ajeno', 'main'], repoRoot);
+    git(['checkout', '-q', task.rama], repoRoot);
+    const antes = huella(repoRoot, tareasRoot, 'TASK-700');
+
+    await assert.rejects(
+      () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'ajeno']),
+      /el tag "ajeno" ya existe en local y NO apunta al merge de esta tarea/
+    );
+    assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes);
+    // Con otro nombre el mismo reintento si cierra: el merge hecho se reconoce.
+    const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'propio']);
+    assert.equal(r.tag?.creado, true);
+    assert.equal(git(['rev-parse', 'propio^{commit}'], repoRoot).trim(), git(['rev-parse', 'develop~1'], repoRoot).trim());
+  });
+});
+
+test('finish --tag --push: el tag llega al bare y el bare ya tiene la rama destino; sin --push queda local y la salida lo dice', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot);
+    try {
+      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask());
+      const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1.0.0', '--push']);
+      assert.equal(r.tag?.subida, 'subido');
+      assert.deepEqual(tagsEnBare(origin.bare), ['v1.0.0']);
+      // El tag remoto es el mismo objeto anotado y apunta al merge, contenido en develop del bare.
+      assert.equal(
+        git(['--git-dir', origin.bare, 'rev-parse', 'v1.0.0^{commit}'], repoRoot).trim(),
+        git(['rev-parse', 'v1.0.0^{commit}'], repoRoot).trim()
+      );
+      assert.equal(ramaEnBare(origin.bare, 'develop'), git(['rev-parse', 'develop'], repoRoot).trim());
+    } finally {
+      await origin.limpiar();
+    }
+  });
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot);
+    try {
+      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-703', rama: 'feature/task-703-sin-push' }));
+      const r = await finish(tareasRoot, repoRoot, ['TASK-703', '--tag', 'v1.0.1']);
+      assert.equal(r.tag?.subida, 'no-solicitada');
+      assert.deepEqual(tagsEnBare(origin.bare), [], 'sin --push el tag no sale de local');
+      assert.equal(git(['tag', '-l', 'v1.0.1'], repoRoot).trim(), 'v1.0.1');
+    } finally {
+      await origin.limpiar();
+    }
+  });
+});
+
+test('finish --tag --push con origin caido aborta ANTES de mergear; sin --push avisa y deja el tag en local', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot);
+    try {
+      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask());
+      // Origin "cae": el bare desaparece de la regla de reescritura.
+      git(['config', `url.${path.join(origin.bare, 'no-existe').replace(/\\/g, '/')}.insteadOf`, URL_GITHUB], repoRoot);
+      git(['config', '--unset-all', `url.${origin.bare.replace(/\\/g, '/')}.insteadOf`], repoRoot);
+      const antes = huella(repoRoot, tareasRoot, 'TASK-700');
+      await assert.rejects(
+        () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1', '--push']),
+        /origin no responde y con --push no se puede comprobar/
+      );
+      assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes);
+    } finally {
+      await origin.limpiar();
+    }
+  });
+});
+
+test('finish --tag (hotfix): --tag SUSTITUYE el nombre del script, un solo tag, anotado, sobre el merge a main', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-710', tipo: 'hotfix', rama: 'hotfix/task-710-urgente' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+
+    const r = await finish(tareasRoot, repoRoot, ['TASK-710', '--tag', 'v2.0.1']);
+
+    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v2.0.1', 'UN solo tag, con el nombre dado (no task-710-urgente)');
+    assert.equal(git(['cat-file', '-t', 'refs/tags/v2.0.1'], repoRoot).trim(), 'tag');
+    assert.equal(
+      git(['rev-parse', 'v2.0.1^{commit}'], repoRoot).trim(),
+      git(['rev-parse', 'main'], repoRoot).trim(),
+      'el tag esta sobre la punta de main, el merge'
+    );
+    assert.match(git(['log', '-1', '--format=%s', 'main'], repoRoot), /merge\(hotfix\)/);
+    assert.equal(r.tag?.rama, 'main');
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-710'))?.task.estado, 'terminada');
+  });
+});
+
+test('finish --tag (release): igual que hotfix, y sin --tag el script sigue poniendo el suyo', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-711', tipo: 'release', rama: 'release/task-711-q4' }));
+    await finish(tareasRoot, repoRoot, ['TASK-711', '--tag', 'v4.0.0']);
+    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v4.0.0');
+  });
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-712', tipo: 'release', rama: 'release/task-712-q5' }));
+    await finish(tareasRoot, repoRoot, ['TASK-712']);
+    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'task-712-q5', 'sin --tag: el nombre calculado de siempre');
+  });
+});
+
+test('finish --tag (hotfix): un tag ya existente aborta antes de que el script toque main', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-713', tipo: 'hotfix', rama: 'hotfix/task-713-x' }), { base: 'main' });
+    git(['tag', 'v7', 'main'], repoRoot);
+    const mainAntes = git(['rev-parse', 'main'], repoRoot).trim();
+    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-713', '--tag', 'v7']), /el tag "v7" ya existe en local/);
+    assert.equal(git(['rev-parse', 'main'], repoRoot).trim(), mainAntes);
+  });
+});
+
+test('finish --tag (hotfix) reintento: con el merge ya hecho se reconoce SU tag; otro nombre NO crea un segundo tag', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask({ id: 'TASK-714', tipo: 'hotfix', rama: 'hotfix/task-714-y' });
+    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
+    // Merge a main y backmerge ya consumados, con un tag propio.
+    git(['checkout', '-q', 'main'], repoRoot);
+    git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge manual'], repoRoot);
+    git(['tag', '-a', 'v8', '-m', 'hotfix', 'HEAD'], repoRoot);
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '-q', '--no-ff', task.rama, '-m', 'backmerge manual'], repoRoot);
+    git(['checkout', '-q', task.rama], repoRoot);
+
+    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-714', '--tag', 'v9']), /lleva un solo tag/);
+    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v8');
+    await finish(tareasRoot, repoRoot, ['TASK-714', '--tag', 'v8']);
+    assert.equal((await readTareaFile(tareasRoot, 'TASK-714'))?.task.estado, 'terminada');
+  });
+});
+
+test('finish --tag --push (hotfix): el tag solo se sube si main ya esta en origin con ese commit; si no, queda local y se dice', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot);
+    try {
+      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-715', tipo: 'hotfix', rama: 'hotfix/task-715-z' }), { base: 'main' });
+      const r = await finish(tareasRoot, repoRoot, ['TASK-715', '--tag', 'v5', '--push']);
+      // finish --push sube develop, no main: el tag NO puede ir a un remoto que no tiene su commit en main.
+      assert.equal(r.tag?.subida, 'rama-no-publicada');
+      assert.deepEqual(tagsEnBare(origin.bare), []);
+      // Con main ya publicada, subir el tag a mano es lo que se indica; y el helper lo comprueba.
+      git(['push', '-q', 'origin', 'main'], repoRoot);
+      assert.equal(ramaEnBare(origin.bare, 'main'), git(['rev-parse', 'main'], repoRoot).trim());
+    } finally {
+      await origin.limpiar();
+    }
+  });
+});
+
+test('finish --tag --push: reintento con el tag propio ya en origin sobre ese commit no lo vuelve a subir', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const origin = await montarOrigin(repoRoot);
+    try {
+      const task = sampleTask();
+      await setupTaskEnRevision(repoRoot, tareasRoot, task);
+      git(['checkout', '-q', 'develop'], repoRoot);
+      git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge manual'], repoRoot);
+      git(['tag', '-a', 'v6', '-m', 'ya', 'HEAD'], repoRoot);
+      git(['push', '-q', 'origin', 'develop', 'refs/tags/v6'], repoRoot);
+      git(['checkout', '-q', task.rama], repoRoot);
+      const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v6', '--push']);
+      assert.equal(r.tag?.creado, false);
+      assert.equal(r.tag?.subida, 'ya-en-remoto');
+    } finally {
+      await origin.limpiar();
+    }
+  });
+});
+
+test('finish --tag (feature) sin commit de merge localizable: aborta con el merge hecho y la tarea sin mover', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    // Rama integrada por fast-forward: no existe commit de merge en el que poner el tag.
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '-q', '--ff-only', task.rama], repoRoot);
+    git(['checkout', '-q', task.rama], repoRoot);
+    await assert.rejects(
+      () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1']),
+      /no se encuentra el commit de merge/
+    );
+    assert.equal(git(['tag', '-l'], repoRoot).trim(), '');
+    assert.ok(existsSync(path.join(tareasRoot, '03-en-revision', 'TASK-700', 'tarea.md')));
+  });
+});
+
+test('finish --tag: con commits POSTERIORES al merge en develop el tag va sobre el merge de la tarea, no sobre HEAD', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    const task = sampleTask();
+    await setupTaskEnRevision(repoRoot, tareasRoot, task);
+    // Merge ya hecho (reintento) y despues alguien mas integro algo en develop.
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge de la tarea'], repoRoot);
+    const merge = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    git(['commit', '-q', '--allow-empty', '-m', 'trabajo ajeno posterior 1'], repoRoot);
+    git(['commit', '-q', '--allow-empty', '-m', 'trabajo ajeno posterior 2'], repoRoot);
+    const head = git(['rev-parse', 'HEAD'], repoRoot).trim();
+    git(['checkout', '-q', task.rama], repoRoot);
+
+    const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v10']);
+
+    assert.equal(r.tag?.commit, merge);
+    assert.equal(git(['rev-parse', 'v10^{commit}'], repoRoot).trim(), merge, 'sobre el merge de la tarea');
+    assert.notEqual(git(['rev-parse', 'v10^{commit}'], repoRoot).trim(), head, 'no sobre HEAD de develop');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
index 65bea39..c8adb86 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
@@ -458,3 +458,22 @@ test('hotfix en automatico con revision aprobada: finish sigue siendo preguntar'
     );
   });
 });
+
+test('siguiente --json expone cierre (cierre_por_defecto): merge por defecto, merge-request si el config lo dice (TASK-060)', async () => {
+  await withRepo(null, async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    assert.equal(siguiente(repoRoot, id).cierre, 'merge');
+  });
+  await withRepo('cierre_por_defecto: merge-request\n', async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    assert.equal(siguiente(repoRoot, id).cierre, 'merge-request');
+  });
+  await withRepo(null, async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'cierre_por_defecto: pr\n', 'utf8');
+    const r = cli(repoRoot, ['siguiente', id, '--json']);
+    assert.equal(r.status, 1, 'un valor mal escrito aborta como el resto de claves');
+    assert.match(r.stderr, /cierre_por_defecto "pr" no es valido/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts
new file mode 100644
index 0000000..cb547df
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/plataforma-remota.test.ts
@@ -0,0 +1,141 @@
+/**
+ * Parte pura de TASK-060: plataforma por la URL de origin, lectura de lo que
+ * contestan gh y glab, anotacion de tarea.md y la clave `cierre_por_defecto`.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  anotarMergeRequest,
+  detectarPlataforma,
+  hostDeRemoto,
+  interpretarListado,
+  ocultarCredenciales,
+  urlDeSalidaDeCreacion,
+  urlMergeRequestAnotada,
+} from '../../src/core/plataforma-remota.js';
+import { CIERRES_POR_DEFECTO, CONFIG_DEFAULTS, CLAVES_CONFIG, ConfigError, parsearConfig } from '../../src/core/config.js';
+import { extraerFlagsCierre } from '../../src/commands/finish-opciones.js';
+
+test('hostDeRemoto: https, http, ssh://, scp, con usuario, contrasena y puerto; rutas locales y letras de unidad no son host', () => {
+  assert.equal(hostDeRemoto('https://github.com/acme/repo.git'), 'github.com');
+  assert.equal(hostDeRemoto('https://usuario:secreto@GitHub.com/acme/repo.git'), 'github.com');
+  assert.equal(hostDeRemoto('https://usuario:con@arroba@gitlab.empresa.es:8443/g/r.git'), 'gitlab.empresa.es');
+  assert.equal(hostDeRemoto('ssh://git@gitlab.com:2222/g/r.git'), 'gitlab.com');
+  assert.equal(hostDeRemoto('git@github.com:acme/repo.git'), 'github.com');
+  assert.equal(hostDeRemoto('github.com:acme/repo.git'), 'github.com');
+  for (const local of ['/tmp/bare.git', 'C:\\Users\\x\\bare', 'C:/Users/x/bare', '../repo', 'file:///tmp/x.git', '', 'origin']) {
+    assert.equal(hostDeRemoto(local), null, local);
+  }
+});
+
+test('detectarPlataforma: github.com -> gh; host con "gitlab" -> glab; cualquier otro host es desconocido (no se supone GitLab)', () => {
+  assert.deepEqual(detectarPlataforma('git@github.com:a/b.git'), { ok: true, remoto: { plataforma: 'github', host: 'github.com' } });
+  assert.deepEqual(detectarPlataforma('https://gitlab.com/a/b.git'), { ok: true, remoto: { plataforma: 'gitlab', host: 'gitlab.com' } });
+  assert.deepEqual(detectarPlataforma('https://gitlab.ieca.es/a/b.git'), { ok: true, remoto: { plataforma: 'gitlab', host: 'gitlab.ieca.es' } });
+  assert.deepEqual(detectarPlataforma('https://git.empresa.es/a/b.git'), { ok: false, motivo: 'host-desconocido', host: 'git.empresa.es' });
+  // GitHub Enterprise y similares: no es github.com, no se adivina.
+  assert.deepEqual(detectarPlataforma('https://github.empresa.es/a/b.git'), { ok: false, motivo: 'host-desconocido', host: 'github.empresa.es' });
+  assert.deepEqual(detectarPlataforma('/tmp/bare.git'), { ok: false, motivo: 'sin-host', host: null });
+  // La respuesta nunca lleva la URL: solo el host.
+  assert.doesNotMatch(JSON.stringify(detectarPlataforma('https://usuario:secreto@git.empresa.es/a/b.git')), /secreto|usuario/);
+});
+
+test('ocultarCredenciales y urlDeSalidaDeCreacion', () => {
+  assert.equal(ocultarCredenciales("fatal: unable to access 'https://u:tok@github.com/a/b.git/'"), "fatal: unable to access 'https://***@github.com/a/b.git/'");
+  assert.equal(ocultarCredenciales('sin url'), 'sin url');
+  assert.equal(urlDeSalidaDeCreacion('Creating pull request...\n\nhttps://github.com/a/b/pull/7\n'), 'https://github.com/a/b/pull/7');
+  assert.equal(urlDeSalidaDeCreacion('https://u:t@github.com/x\n'), null, 'una URL con usuario no es publicable');
+  assert.equal(urlDeSalidaDeCreacion('nada\n'), null);
+});
+
+const GH = (estado: string, extra: object = {}) => ({ number: 1, state: estado, url: 'https://github.com/a/b/pull/1', baseRefName: 'develop', headRefName: 'feature/x', mergeCommit: null, ...extra });
+const GL = (estado: string, extra: object = {}) => ({ iid: 1, state: estado, web_url: 'https://gitlab.com/a/b/-/merge_requests/1', target_branch: 'develop', source_branch: 'feature/x', merge_commit_sha: null, squash_commit_sha: null, ...extra });
+
+test('interpretarListado (gh): abierto gana a mergeado y mergeado a cerrado; vacio es ninguno; merge/squash dan su commit', () => {
+  const j = (o: unknown[]) => JSON.stringify(o);
+  assert.deepEqual(interpretarListado('github', '[]', 'feature/x'), { tipo: 'ninguno' });
+  assert.deepEqual(interpretarListado('github', j([GH('CLOSED'), GH('OPEN', { url: 'https://github.com/a/b/pull/2' })]), 'feature/x'), { tipo: 'abierto', url: 'https://github.com/a/b/pull/2' });
+  const sha = 'a'.repeat(40);
+  assert.deepEqual(interpretarListado('github', j([GH('CLOSED'), GH('MERGED', { mergeCommit: { oid: sha } })]), 'feature/x'), {
+    tipo: 'integrado',
+    url: 'https://github.com/a/b/pull/1',
+    base: 'develop',
+    commit: sha,
+  });
+  assert.equal(interpretarListado('github', j([GH('CLOSED')]), 'feature/x').tipo, 'cerrado');
+  // Un PR de otra rama (la plataforma devolvio de mas) no cuenta.
+  assert.deepEqual(interpretarListado('github', j([GH('OPEN', { headRefName: 'otra' })]), 'feature/x'), { tipo: 'ninguno' });
+});
+
+test('interpretarListado (glab): opened/merged/closed, merge_commit_sha o squash_commit_sha, y "null" es ninguno', () => {
+  const j = (o: unknown[]) => JSON.stringify(o);
+  const sha = 'b'.repeat(40);
+  assert.equal(interpretarListado('gitlab', j([GL('opened')]), 'feature/x').tipo, 'abierto');
+  assert.deepEqual(interpretarListado('gitlab', j([GL('merged', { squash_commit_sha: sha })]), 'feature/x'), {
+    tipo: 'integrado',
+    url: 'https://gitlab.com/a/b/-/merge_requests/1',
+    base: 'develop',
+    commit: sha,
+  });
+  assert.equal((interpretarListado('gitlab', j([GL('merged')]), 'feature/x') as { commit: unknown }).commit, null);
+  assert.equal(interpretarListado('gitlab', j([GL('closed')]), 'feature/x').tipo, 'cerrado');
+  assert.deepEqual(interpretarListado('gitlab', 'null', 'feature/x'), { tipo: 'ninguno' });
+});
+
+test('interpretarListado: salida irreconocible es DESCONOCIDO, nunca "ninguno" (que llevaria a crear un PR)', () => {
+  for (const [p, s] of [
+    ['github', 'no es json'],
+    ['github', '{"a":1}'],
+    ['github', JSON.stringify([GH('RARO')])],
+    ['github', JSON.stringify([GH('OPEN', { url: 'javascript:alert(1)' })])],
+    ['github', JSON.stringify([GH('MERGED', { mergeCommit: { oid: 'no-sha' } })])],
+    ['gitlab', JSON.stringify([GL('desconocido')])],
+    ['gitlab', JSON.stringify([5])],
+  ] as const) {
+    assert.equal(interpretarListado(p, s, 'feature/x').tipo, 'desconocido', `${p} ${s}`);
+  }
+});
+
+test('anotarMergeRequest / urlMergeRequestAnotada: ida y vuelta, sin confundirse con un bloque de codigo', () => {
+  const body = '## Objetivo\nX\n\n## Transiciones\n\n| a |\n';
+  const anotado = anotarMergeRequest(body, 'https://github.com/a/b/pull/3', 'github');
+  assert.equal(urlMergeRequestAnotada(anotado), 'https://github.com/a/b/pull/3');
+  assert.equal(urlMergeRequestAnotada(body), null);
+  assert.equal(urlMergeRequestAnotada('```\n## Merge request\n\n- URL del merge request: https://x.com/1\n```\n'), null);
+  assert.equal(urlMergeRequestAnotada('## Merge request\n\n- URL del merge request: https://u:t@x.com/1\n'), null);
+  // CRLF se conserva.
+  assert.match(anotarMergeRequest('a\r\n', 'https://x.com/1', 'gitlab'), /\r\n- Plataforma: gitlab\r\n$/);
+});
+
+test('extraerFlagsCierre: --tag con valor separado o con "=", --merge-request suelto; errores claros', () => {
+  assert.deepEqual(extraerFlagsCierre(['TASK-1', '--tag', 'v1', '--merge-request']), { tag: 'v1', mergeRequest: true, resto: ['TASK-1'] });
+  assert.deepEqual(extraerFlagsCierre(['--tag=v2', 'TASK-1']), { tag: 'v2', mergeRequest: false, resto: ['TASK-1'] });
+  assert.deepEqual(extraerFlagsCierre(['TASK-1']), { tag: null, mergeRequest: false, resto: ['TASK-1'] });
+  assert.throws(() => extraerFlagsCierre(['TASK-1', '--tag']), /necesita un nombre/);
+  assert.throws(() => extraerFlagsCierre(['TASK-1', '--tag=']), /necesita un nombre/);
+  assert.throws(() => extraerFlagsCierre(['TASK-1', '--tag', '--push']), /necesita un nombre/);
+  assert.throws(() => extraerFlagsCierre(['--tag', 'a', '--tag', 'b']), /repetido/);
+});
+
+// cierre_por_defecto (criterio 9)
+
+const RUTA = '/x/.taskcode/config.yml';
+
+test('config: cierre_por_defecto vale merge por defecto y acepta merge y merge-request', () => {
+  assert.equal(CONFIG_DEFAULTS.cierre_por_defecto, 'merge');
+  assert.equal(parsearConfig('', RUTA).cierre_por_defecto, 'merge');
+  for (const v of CIERRES_POR_DEFECTO) assert.equal(parsearConfig(`cierre_por_defecto: ${v}\n`, RUTA).cierre_por_defecto, v);
+  assert.ok((CLAVES_CONFIG as readonly string[]).includes('cierre_por_defecto'));
+});
+
+test('config: cierre_por_defecto mal escrito, vacio o repetido aborta como el resto de claves', () => {
+  assert.throws(
+    () => parsearConfig('cierre_por_defecto: merge-requests\n', RUTA),
+    (e: Error) => e instanceof ConfigError && /merge, merge-request/.test(e.message) && /Querias decir "merge-request"/.test(e.message)
+  );
+  assert.throws(() => parsearConfig('cierre_por_defecto: pr\n', RUTA), ConfigError);
+  assert.throws(() => parsearConfig('cierre_por_defecto:\n', RUTA), ConfigError);
+  assert.throws(() => parsearConfig('cierre_por_defecto: merge\ncierre_por_defecto: merge-request\n', RUTA), /repetida/);
+  // La clave vecina mal escrita sugiere la nueva.
+  assert.throws(() => parsearConfig('cierre_por_defect: merge\n', RUTA), /Quiza quisiste decir "cierre_por_defecto"/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/merge-to-main-tag.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/merge-to-main-tag.test.ts
new file mode 100644
index 0000000..b38aaab
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/merge-to-main-tag.test.ts
@@ -0,0 +1,97 @@
+/**
+ * `--tag <nombre>` de merge-hotfix-to-main.sh y merge-release-to-main.sh
+ * (TASK-060, criterio 4): sustituye el nombre del tag que pone el script, sigue
+ * habiendo UN solo tag, y un nombre malo o repetido aborta antes de tocar
+ * ninguna rama. Repos Git reales; los scripts se invocan como `bash script.sh`.
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
+const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+function runScript(script: string, args: string[], cwd: string): { status: number | null; output: string } {
+  const r = spawnSync('bash', [path.join(SCRIPTS_DIR, script), ...args], { cwd, encoding: 'utf8', input: '' });
+  return { status: r.status, output: `${r.stdout}\n${r.stderr}` };
+}
+
+const CASOS = [
+  { script: 'merge-hotfix-to-main.sh', tipo: 'hotfix', base: 'main' },
+  { script: 'merge-release-to-main.sh', tipo: 'release', base: 'develop' },
+] as const;
+
+async function conRamaDeTrabajo(tipo: string, base: string, fn: (repoRoot: string, rama: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-merge-tag-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    const rama = `${tipo}/950-con-tag`;
+    git(['checkout', '-q', base], repoRoot);
+    git(['checkout', '-q', '-b', rama], repoRoot);
+    await writeFile(path.join(repoRoot, 'cambio.txt'), 'cambio\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', `cambio en ${rama}`], repoRoot);
+    await fn(repoRoot, rama);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+for (const { script, tipo, base } of CASOS) {
+  test(`${script} --tag: usa ese nombre en lugar del calculado, y no hay un segundo tag`, async () => {
+    await conRamaDeTrabajo(tipo, base, async (repoRoot) => {
+      const { status, output } = runScript(script, ['950-con-tag', '--tag', 'v3.1.4'], repoRoot);
+      assert.equal(status, 0, output);
+      assert.match(output, /Tag creado: v3\.1\.4/);
+      assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v3.1.4', 'un solo tag, el pedido');
+      assert.equal(git(['cat-file', '-t', 'refs/tags/v3.1.4'], repoRoot).trim(), 'tag');
+      assert.equal(git(['rev-parse', 'v3.1.4^{commit}'], repoRoot).trim(), git(['rev-parse', 'main'], repoRoot).trim());
+      assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
+    });
+  });
+
+  test(`${script} --tag: un nombre invalido, con "-" inicial o ya existente aborta ANTES de mergear`, async () => {
+    await conRamaDeTrabajo(tipo, base, async (repoRoot, rama) => {
+      git(['tag', 'ya-esta', 'main'], repoRoot);
+      const mainAntes = git(['rev-parse', 'main'], repoRoot).trim();
+      for (const [malo, patron] of [
+        ['con espacio', /no es valido/],
+        ['a..b', /no es valido/],
+        ['-x', /no es valido/],
+        ['ya-esta', /ya existe/],
+      ] as const) {
+        const { status, output } = runScript(script, ['950-con-tag', '--tag', malo], repoRoot);
+        assert.notEqual(status, 0, `${malo}: ${output}`);
+        assert.match(output, patron, malo);
+        assert.equal(git(['rev-parse', 'main'], repoRoot).trim(), mainAntes, `${malo}: main intacta`);
+        assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama, `${malo}: sigue en su rama`);
+      }
+      assert.equal(git(['tag', '-l'], repoRoot).trim(), 'ya-esta');
+    });
+  });
+
+  test(`${script} sin --tag sigue poniendo el tag calculado (el flag es opcional)`, async () => {
+    await conRamaDeTrabajo(tipo, base, async (repoRoot) => {
+      const { status, output } = runScript(script, ['950-con-tag'], repoRoot);
+      assert.equal(status, 0, output);
+      assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v950-con-tag');
+    });
+  });
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-origin.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-origin.ts
new file mode 100644
index 0000000..38cc38e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/finish-origin.ts
@@ -0,0 +1,87 @@
+// Fixtures de los tests de finish con remoto (TASK-060): un repo bare REAL
+// haciendo de origin, bajo la URL de GitHub / GitLab que se quiera.
+//
+// `origin` se configura con la URL "publica" (la que lee la deteccion de
+// plataforma) y una regla `url.<bare>.insteadOf <esa url>` hace que Git hable
+// en realidad con el bare local: push, fetch y ls-remote son reales y no hay
+// red. Funciona igual con una URL con credenciales incrustadas.
+
+import { mkdtemp, rm } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import assert from 'node:assert/strict';
+import { git } from './finish-fixtures.js';
+
+export const URL_GITHUB = 'https://github.com/acme/repo.git';
+export const URL_GITLAB = 'https://gitlab.example.com/acme/repo.git';
+
+export interface Origin {
+  /** Directorio del repo bare. */
+  bare: string;
+  limpiar(): Promise<void>;
+}
+
+/** Crea el bare, lo configura como origin de `repoRoot` y sube `main` y `develop`. */
+export async function montarOrigin(repoRoot: string, urlVisible: string = URL_GITHUB): Promise<Origin> {
+  const bare = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-'));
+  git(['init', '-q', '--bare', '-b', 'main', bare], repoRoot);
+  const ruta = bare.replace(/\\/g, '/');
+  git(['remote', 'add', 'origin', urlVisible], repoRoot);
+  git(['config', `url.${ruta}.insteadOf`, urlVisible], repoRoot);
+  git(['push', '-q', 'origin', 'main', 'develop'], repoRoot);
+  return { bare, limpiar: () => rm(bare, { recursive: true, force: true }) };
+}
+
+/** Lo que el bare tiene en `refs/heads/<rama>` (SHA) o null. */
+export function ramaEnBare(bare: string, rama: string): string | null {
+  const r = spawnSync('git', ['--git-dir', bare, 'rev-parse', '--verify', '--quiet', `refs/heads/${rama}`], {
+    encoding: 'utf8',
+  });
+  return r.status === 0 ? r.stdout.trim() : null;
+}
+
+/** Tags del bare. */
+export function tagsEnBare(bare: string): string[] {
+  return git(['--git-dir', bare, 'tag', '-l'], bare)
+    .split('\n')
+    .map((l) => l.trim())
+    .filter((l) => l !== '');
+}
+
+/**
+ * Simula lo que hace la plataforma al mergear el PR: en un clon temporal del
+ * bare integra `rama` en `base` (merge `--no-ff`, squash o rebase) y sube.
+ * Devuelve el commit resultante en `base` (el que la plataforma informaria).
+ */
+export async function mergearEnPlataforma(
+  bare: string,
+  rama: string,
+  base: string,
+  modo: 'merge' | 'squash' | 'rebase'
+): Promise<string> {
+  const clon = await mkdtemp(path.join(tmpdir(), 'taskctl-plataforma-'));
+  try {
+    git(['clone', '-q', bare, clon], tmpdir());
+    git(['config', 'user.email', 'plataforma@example.com'], clon);
+    git(['config', 'user.name', 'Plataforma'], clon);
+    git(['checkout', '-q', base], clon);
+    if (modo === 'merge') {
+      git(['merge', '-q', '--no-ff', `origin/${rama}`, '-m', `Merge pull request de ${rama}`], clon);
+    } else if (modo === 'squash') {
+      git(['merge', '-q', '--squash', `origin/${rama}`], clon);
+      git(['commit', '-q', '-m', `Squash de ${rama}`], clon);
+    } else {
+      git(['checkout', '-q', '-b', 'rebase-tmp', `origin/${rama}`], clon);
+      git(['rebase', '-q', base], clon);
+      git(['checkout', '-q', base], clon);
+      git(['merge', '-q', '--ff-only', 'rebase-tmp'], clon);
+    }
+    git(['push', '-q', 'origin', base], clon);
+    const sha = git(['rev-parse', 'HEAD'], clon).trim();
+    assert.match(sha, /^[0-9a-f]{40}$/);
+    return sha;
+  } finally {
+    await rm(clon, { recursive: true, force: true });
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
new file mode 100644
index 0000000..a50520e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/plataforma-doble.ts
@@ -0,0 +1,219 @@
+// Doble de `gh` y `glab` para los tests de `taskctl finish --merge-request`
+// (TASK-060). Es el UNICO doble admitido de la suite: GitHub y GitLab no estan
+// en el CI. Git, los repos y el remoto bare siguen siendo reales.
+//
+// Es un EJECUTABLE de verdad, resuelto por el PATH como lo resolveria el real,
+// que lee y escribe un fichero de estado JSON (el que cada test prepara) y
+// apunta en el cada llamada que recibe:
+//
+//   { auth, listarFalla, crearFalla, prs: [...], llamadas: [[cli, ...args]] }
+//
+// Como se lanza, por plataforma:
+//
+// - POSIX: un script `gh` / `glab` con shebang `/bin/sh` que ejecuta el doble
+//   con el node actual.
+// - Windows nativo: `spawnSync('gh', ...)` sin shell solo ejecuta `.exe`
+//   (un `.cmd` da ENOENT), y no se abre `shell: true` para este hueco. Asi que
+//   `gh.exe` y `glab.exe` son enlaces duros (o copias) de `node.exe`, y el
+//   doble entra por un `--require` en NODE_OPTIONS que, si el ejecutable se
+//   llama gh/glab, atiende la llamada y sale antes de que node intente
+//   cargar como script el primer argumento. Consecuencias: ninguna llamada
+//   del CLI bajo prueba puede empezar por una opcion (`--version`), que node
+//   se quedaria; y node resuelve el primer argumento a una ruta absoluta, de
+//   la que el doble recupera el nombre. Las llamadas de taskctl empiezan
+//   siempre por un subcomando (`auth`, `pr`, `mr`).
+
+import { chmodSync, copyFileSync, linkSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+
+export type EstadoPrDoble = 'abierto' | 'integrado' | 'cerrado';
+
+export interface PrDoble {
+  estado: EstadoPrDoble;
+  url: string;
+  base: string;
+  head: string;
+  /** Commit resultante del merge (merge, squash o rebase); null = la plataforma no lo informa. */
+  commit?: string | null;
+}
+
+export interface EstadoDoble {
+  /** false: `auth status` sale con 1. Por defecto true. */
+  auth?: boolean;
+  /** true: `pr list` / `mr list` salen con 1 (red caida), con una URL con credenciales en stderr. */
+  listarFalla?: boolean;
+  /** true: `pr create` / `mr create` salen con 1. */
+  crearFalla?: boolean;
+  prs: PrDoble[];
+  /** Lo apunta el doble: una entrada por llamada, `[cli, ...args]`. */
+  llamadas?: string[][];
+}
+
+const ENV_ESTADO = 'TASKCODE_DOBLE_ESTADO';
+
+// Codigo del doble (CommonJS, lo carga node tal cual). Sin plantillas con
+// comillas invertidas: va como lineas de texto.
+const CODIGO_DOBLE = [
+  "'use strict';",
+  "const fs = require('node:fs');",
+  "const path = require('node:path');",
+  'function salir(codigo, out, err) {',
+  "  if (out) fs.writeSync(1, out);",
+  "  if (err) fs.writeSync(2, err);",
+  '  process.exit(codigo);',
+  '}',
+  'function valor(args, nombre) {',
+  "  const pref = '--' + nombre + '=';",
+  '  const a = args.find((x) => x.startsWith(pref));',
+  '  return a === undefined ? null : a.slice(pref.length);',
+  '}',
+  'function run(cli, args) {',
+  '  const f = process.env.' + ENV_ESTADO + ';',
+  "  const st = JSON.parse(fs.readFileSync(f, 'utf8'));",
+  '  st.llamadas = st.llamadas || [];',
+  '  st.llamadas.push([cli].concat(args));',
+  '  const guardar = () => fs.writeFileSync(f, JSON.stringify(st));',
+  '  guardar();',
+  "  if (args[0] === 'auth' && args[1] === 'status') {",
+  "    if (st.auth === false) salir(1, '', 'You are not logged in\\n');",
+  '    salir(0, \'\', \'Logged in\\n\');',
+  '  }',
+  "  const listar = (cli === 'gh' && args[0] === 'pr' && args[1] === 'list') || (cli === 'glab' && args[0] === 'mr' && args[1] === 'list');",
+  "  const crear = (cli === 'gh' && args[0] === 'pr' && args[1] === 'create') || (cli === 'glab' && args[0] === 'mr' && args[1] === 'create');",
+  '  if (listar) {',
+  "    if (st.listarFalla) salir(1, '', 'error: Post \"https://usuario:secreto@github.com/graphql\": dial tcp: no network\\n');",
+  "    const head = cli === 'gh' ? valor(args, 'head') : valor(args, 'source-branch');",
+  '    const lista = st.prs.filter((p) => p.head === head).map((p, i) => {',
+  "      if (cli === 'gh') {",
+  "        const estado = { abierto: 'OPEN', integrado: 'MERGED', cerrado: 'CLOSED' }[p.estado];",
+  "        return { number: i + 1, state: estado, url: p.url, baseRefName: p.base, headRefName: p.head, mergeCommit: p.commit ? { oid: p.commit } : null };",
+  '      }',
+  "      const estado = { abierto: 'opened', integrado: 'merged', cerrado: 'closed' }[p.estado];",
+  "      return { iid: i + 1, state: estado, web_url: p.url, target_branch: p.base, source_branch: p.head, merge_commit_sha: p.commit || null, squash_commit_sha: null };",
+  '    });',
+  '    salir(0, JSON.stringify(lista) + "\\n", "");',
+  '  }',
+  '  if (crear) {',
+  "    if (st.crearFalla) salir(1, '', 'GraphQL: could not create the pull request\\n');",
+  "    const head = cli === 'gh' ? valor(args, 'head') : valor(args, 'source-branch');",
+  "    const base = cli === 'gh' ? valor(args, 'base') : valor(args, 'target-branch');",
+  '    const n = st.prs.length + 1;',
+  "    const url = cli === 'gh' ? 'https://github.com/acme/repo/pull/' + n : 'https://gitlab.example.com/acme/repo/-/merge_requests/' + n;",
+  "    st.prs.push({ estado: 'abierto', url: url, base: base, head: head, commit: null });",
+  '    guardar();',
+  "    salir(0, 'Creating pull request for ' + head + ' into ' + base + '\\n\\n' + url + '\\n', '');",
+  '  }',
+  "  salir(2, '', 'doble: llamada no soportada: ' + args.join(' ') + '\\n');",
+  '}',
+  'if (require.main === module) {',
+  '  run(process.argv[2], process.argv.slice(3));',
+  "} else if (/^(gh|glab)(\\.exe)?$/i.test(path.basename(process.execPath))) {",
+  "  run(path.basename(process.execPath).replace(/\\.exe$/i, '').toLowerCase(), [path.basename(process.argv[1])].concat(process.argv.slice(2)));",
+  '}',
+  '',
+].join('\n');
+
+interface Instalacion {
+  dir: string;
+  script: string;
+}
+
+let instalacion: Instalacion | null = null;
+
+/** Carpeta con `gh` y `glab` de prueba; se monta una vez por proceso y se borra al salir. */
+function instalar(): Instalacion {
+  if (instalacion !== null) return instalacion;
+  const dir = mkdtempSync(path.join(tmpdir(), 'taskctl-doble-plataforma-'));
+  const script = path.join(dir, 'doble.cjs');
+  writeFileSync(script, CODIGO_DOBLE, 'utf8');
+  for (const nombre of ['gh', 'glab']) {
+    if (process.platform === 'win32') {
+      const destino = path.join(dir, `${nombre}.exe`);
+      try {
+        linkSync(process.execPath, destino);
+      } catch {
+        copyFileSync(process.execPath, destino);
+      }
+    } else {
+      const destino = path.join(dir, nombre);
+      writeFileSync(destino, `#!/bin/sh\nexec "${process.execPath}" "${script}" ${nombre} "$@"\n`, 'utf8');
+      chmodSync(destino, 0o755);
+    }
+  }
+  process.once('exit', () => rmSync(dir, { recursive: true, force: true }));
+  instalacion = { dir, script };
+  return instalacion;
+}
+
+const EJECUTABLES = ['gh', 'glab'].flatMap((n) => [n, `${n}.exe`, `${n}.cmd`, `${n}.bat`]);
+
+/** El PATH actual sin las carpetas donde haya un gh o glab REAL (la maquina de quien corra los tests puede tenerlos). */
+function pathSinPlataformas(): string {
+  return (process.env['PATH'] ?? '')
+    .split(path.delimiter)
+    .filter((d) => d !== '' && !EJECUTABLES.some((e) => existsSync(path.join(d, e))))
+    .join(path.delimiter);
+}
+
+export interface ControlDoble {
+  /** Estado actual (lo que el doble ha escrito, incluidas las llamadas). */
+  leer(): Required<EstadoDoble>;
+  /** Reemplaza el estado (p. ej. para simular que el PR se mergeo en la plataforma). */
+  escribir(estado: EstadoDoble): void;
+  /** Llamadas recibidas de un subcomando, p. ej. `llamadasDe('pr', 'create')`. */
+  llamadasDe(sub1: string, sub2: string): string[][];
+}
+
+/**
+ * Corre `fn` con `gh` y `glab` de prueba en el PATH (por delante de cualquier
+ * real) y el estado inicial dado. Restaura PATH y NODE_OPTIONS al terminar.
+ */
+export async function conDoblePlataforma(
+  inicial: EstadoDoble,
+  fn: (c: ControlDoble) => Promise<void>
+): Promise<void> {
+  const { dir, script } = instalar();
+  const fichero = path.join(mkdtempSync(path.join(tmpdir(), 'taskctl-doble-estado-')), 'estado.json');
+  const control: ControlDoble = {
+    leer: () => {
+      const e = JSON.parse(readFileSync(fichero, 'utf8')) as EstadoDoble;
+      return { auth: e.auth ?? true, listarFalla: e.listarFalla ?? false, crearFalla: e.crearFalla ?? false, prs: e.prs, llamadas: e.llamadas ?? [] };
+    },
+    escribir: (e) => writeFileSync(fichero, JSON.stringify({ llamadas: [], ...e }), 'utf8'),
+    llamadasDe: (a, b) => (control.leer().llamadas).filter((l) => l[1] === a && l[2] === b),
+  };
+  control.escribir(inicial);
+  const guardado = { PATH: process.env['PATH'], NODE_OPTIONS: process.env['NODE_OPTIONS'], ESTADO: process.env[ENV_ESTADO] };
+  process.env['PATH'] = `${dir}${path.delimiter}${guardado.PATH ?? ''}`;
+  process.env[ENV_ESTADO] = fichero;
+  if (process.platform === 'win32') {
+    // Barras normales y entre comillas: NODE_OPTIONS trata la barra invertida como escape.
+    process.env['NODE_OPTIONS'] = `${guardado.NODE_OPTIONS ?? ''} --require "${script.replace(/\\/g, '/')}"`.trim();
+  }
+  try {
+    await fn(control);
+  } finally {
+    restaurar('PATH', guardado.PATH);
+    restaurar('NODE_OPTIONS', guardado.NODE_OPTIONS);
+    restaurar(ENV_ESTADO, guardado.ESTADO);
+    rmSync(path.dirname(fichero), { recursive: true, force: true });
+  }
+}
+
+/** Corre `fn` con un PATH sin ningun gh ni glab: el caso "CLI no instalado". */
+export async function sinPlataformasEnElPath(fn: () => Promise<void>): Promise<void> {
+  const guardado = process.env['PATH'];
+  process.env['PATH'] = pathSinPlataformas();
+  try {
+    await fn();
+  } finally {
+    restaurar('PATH', guardado);
+  }
+}
+
+function restaurar(clave: string, valor: string | undefined): void {
+  if (valor === undefined) delete process.env[clave];
+  else process.env[clave] = valor;
+}
+
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/finish-cierre.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/finish-cierre.test.ts
new file mode 100644
index 0000000..25983b1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/finish-cierre.test.ts
@@ -0,0 +1,58 @@
+/**
+ * La skill `finish` y las opciones de cierre (TASK-060, criterio 10). Es
+ * markdown que lee un modelo: lo comprobable es que nombre las tres formas de
+ * cerrar y los flags exactos del CLI, que pregunte en manual y semiautomatico,
+ * que en automatico no pregunte y use `cierre`, y que el CLI de verdad
+ * exponga ese `cierre` y esos flags (la skill y el codigo no se separan).
+ * Que no mencione el proyecto ni rutas internas lo vigila fases.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseFrontmatter } from '../../src/core/frontmatter.js';
+import { FLAGS_FINISH } from '../../src/commands/finish.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
+
+async function skill(): Promise<{ texto: string; permitidas: string }> {
+  const texto = await readFile(path.join(PLUGIN_ROOT, 'skills', 'finish', 'SKILL.md'), 'utf8');
+  const { data } = parseFrontmatter(texto);
+  return { texto, permitidas: String(data['allowed-tools']) };
+}
+
+test('skill finish: nombra el merge normal por defecto, --merge-request y --tag, y los flags existen en el CLI', async () => {
+  const { texto } = await skill();
+  assert.match(texto, /Merge normal\*\* \(por defecto\)/);
+  assert.match(texto, /taskctl finish TASK-NNN --merge-request/);
+  assert.match(texto, /--tag <nombre>/);
+  for (const flag of ['--merge-request', '--tag']) {
+    assert.ok(FLAGS_FINISH.includes(flag), `${flag} debe ser un flag valido de finish`);
+  }
+});
+
+test('skill finish: en manual y semiautomatico pregunta (AskUserQuestion permitida) merge o merge request y tag opcional', async () => {
+  const { texto, permitidas } = await skill();
+  assert.match(permitidas, /AskUserQuestion/);
+  assert.match(texto, /Modo `manual` o `semiautomatico`\*\*: pregunta con AskUserQuestion/);
+  assert.match(texto, /\*\*merge normal\*\* \(opcion por defecto y primera\) o \*\*merge\s+request\*\*/);
+  assert.match(texto, /sin tag \(por defecto\)/);
+});
+
+test('skill finish: en automatico no pregunta, usa `cierre` de siguiente --json y nunca inventa un tag', async () => {
+  const { texto } = await skill();
+  assert.match(texto, /Modo `automatico`\*\*: no preguntes/);
+  assert.match(texto, /`modo` y `cierre` de `taskctl siguiente TASK-NNN --json`/);
+  assert.match(texto, /cierre_por_defecto/);
+  assert.match(texto, /Nunca pases `--tag` por tu cuenta/);
+});
+
+test('skill finish: el segundo cierre (seccion "## Merge request" en tarea.md) no pregunta y hotfix/release no llevan merge request', async () => {
+  const { texto } = await skill();
+  assert.match(texto, /seccion `## Merge request`/);
+  assert.match(texto, /no preguntes el modo de cierre/);
+  assert.match(texto, /Hotfix y release\*\* no tienen merge request/);
+  assert.match(texto, /Si acabas de\s+abrir un merge request, la tarea NO esta terminada/);
+});
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-060/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-060/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-060/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-060/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-060/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-060/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-060/tarea.md                                                       |   5 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  51 +++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js                                            |   2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-opciones.js                            | 206 +++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     | 321 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                                  |   4 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         |  24 +++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plataforma-remota.js                              | 222 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                              | 182 +++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/merge-request.js                                    | 135 +++++++++++++++++++++++++++++++++++
 16 files changed, 1135 insertions(+), 17 deletions(-)
````
