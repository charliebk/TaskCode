# Peticion de revision — TASK-031 (ronda 1)

- Tarea: TASK-031 — Distribucion del CLI: un clon debe traer un taskctl que arranque
- Rama revisada: fix/task-031-distribucion-del-cli-un-clon-debe-traer
- Rama base: develop
- Commit revisado (HEAD): 4ba8bba2c2c35a2448598c7f463b7e730846ed5a
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
4ba8bba docs(TASK-031): AC7 ejecutado de verdad y criterios transcritos
5108899 docs(TASK-031): el README ya no pide compilar, y la skill dice como llega taskctl
08d379f test(TASK-031): arranque en frio verificado y guard contra desincronizacion
e2c5251 fix(TASK-031): versionar dist/src y hacer el build reproducible
822b5cd chore(TASK-031): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
index f1a785a..025ce14 100644
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -23,6 +23,28 @@ jobs:
       - run: npm ci
       - run: npm test
 
+      # Guard de E6 (TASK-031). dist/src se versiona para que un clon
+      # traiga un taskctl que arranque, y el precio de eso es que se
+      # puede desincronizar de src/. Este step lo impide.
+      #
+      # Corre en los DOS jobs a proposito: el modo de fallo es
+      # cross-plataforma (tsc emite CRLF en Windows y las plantillas
+      # multilinea de src/ viajan tal cual al build), asi que un guard
+      # que solo corriera en Linux no discriminaria justo el caso que
+      # motivo el .gitattributes.
+      - name: "Guard E6: dist/src commiteado == dist/src recompilado"
+        shell: bash
+        run: |
+          npm run build
+          sucio="$(git status --porcelain -- dist/src)"
+          if [ -n "$sucio" ]; then
+            echo "::error::dist/src no coincide con lo que produce src/. Ejecuta 'npm run build' y commitea dist/src."
+            echo "$sucio"
+            git --no-pager diff -- dist/src | head -50
+            exit 1
+          fi
+          echo "dist/src esta al dia."
+
   test-windows:
     name: Tests + validacion nativa (Windows)
     runs-on: windows-latest
@@ -34,6 +56,21 @@ jobs:
       - run: npm ci
       - run: npm run build
 
+      # Mismo guard que en Linux. Aqui es donde de verdad se juega: si el
+      # .gitattributes no fijara el eol, este step se pondria rojo con un
+      # diff de todo dist/src aunque nadie hubiera tocado src/.
+      - name: "Guard E6: dist/src commiteado == dist/src recompilado"
+        shell: bash
+        run: |
+          sucio="$(git status --porcelain -- dist/src)"
+          if [ -n "$sucio" ]; then
+            echo "::error::dist/src no coincide con lo que produce src/. Ejecuta 'npm run build' y commitea dist/src."
+            echo "$sucio"
+            git --no-pager diff -- dist/src | head -50
+            exit 1
+          fi
+          echo "dist/src esta al dia."
+
       # Cada pregunta abierta es un step que ASEVERA su hipotesis: el
       # verde/rojo del step ES la respuesta, legible por la API sin
       # necesidad de bajar los logs. Todos van con continue-on-error para
diff --git a/.gitignore b/.gitignore
index e5597a2..7ecfefa 100644
--- a/.gitignore
+++ b/.gitignore
@@ -1,6 +1,10 @@
 # Artefactos de build / dependencias — nunca se versionan
 node_modules/
 dist/
+# ...salvo el build de produccion del plugin, que SI se versiona: sin el, un
+# clon recien hecho no trae un taskctl que arranque (item E6 / TASK-031). Los
+# tests compilados siguen fuera, via el .gitignore del propio plugin.
+!taskcode-marketplace/plugins/taskcode-plugin/dist/
 
 # Ficheros de IDE
 .idea/
diff --git a/tareas/01-en-diseno/TASK-031/tarea.md b/tareas/01-en-diseno/TASK-031/tarea.md
deleted file mode 100644
index 7e66e31..0000000
--- a/tareas/01-en-diseno/TASK-031/tarea.md
+++ /dev/null
@@ -1,25 +0,0 @@
----
-id: TASK-031
-titulo: "Distribucion del CLI: un clon debe traer un taskctl que arranque"
-tipo: fix
-sprint: 0
-etiquetas: [empaquetado, distribucion, cli]
-complejidad: media
-modelo_sugerido: sonnet
-estado: en-diseno
-plan_aprobado: true
-rama: fix/task-031-distribucion-del-cli-un-clon-debe-traer
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
diff --git a/tareas/01-en-diseno/TASK-031/planificacion/plan-final.md b/tareas/02-en-curso/TASK-031/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-031/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-031/planificacion/plan-final.md
diff --git a/tareas/02-en-curso/TASK-031/tarea.md b/tareas/02-en-curso/TASK-031/tarea.md
new file mode 100644
index 0000000..81b2251
--- /dev/null
+++ b/tareas/02-en-curso/TASK-031/tarea.md
@@ -0,0 +1,60 @@
+---
+id: TASK-031
+titulo: "Distribucion del CLI: un clon debe traer un taskctl que arranque"
+tipo: fix
+sprint: 0
+etiquetas: [empaquetado, distribucion, cli]
+complejidad: media
+modelo_sugerido: sonnet
+estado: en-curso
+plan_aprobado: true
+rama: fix/task-031-distribucion-del-cli-un-clon-debe-traer
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
+Item **E6** del checklist de terminacion. En un clon recien hecho el plugin
+no traia un `taskctl` que arrancase: `dist/` estaba en `.gitignore` y
+`bin/taskctl` importa `../dist/src/cli.js`, asi que el CLI moria con
+`Cannot find module ...dist/src/cli.js` y codigo 1. Va antes que toda la
+Fase D porque esa fase construye encima de una herramienta que hoy, quien
+clone el repo, no puede ejecutar.
+
+## Criterios de aceptacion
+
+Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
+`taskctl new` deja esta seccion vacia.
+
+- [ ] **AC1** — En un clon recien hecho, **sin `npm install` ni `npm run
+      build`**, `node bin/taskctl --version` imprime la version y sale con 0.
+      Hoy sale 1.
+- [ ] **AC2** — Existe un test automatizado que reproduce AC1 contra un clon
+      real (no un mock) y se pone rojo si `dist/src/` deja de estar versionado.
+- [ ] **AC3** — El build es reproducible entre plataformas: recompilar no
+      produce diff, aseverado por un step de CI que corre **en Linux y en
+      Windows**.
+- [ ] **AC4** — Se versiona `dist/src/` y **solo** eso: `dist/test/` sigue
+      ignorado y no entra ni un fichero de test compilado.
+- [ ] **AC5** — `npm test` sigue en verde: los tests actuales mas los nuevos,
+      con los 3 rojos conocidos de este entorno Windows y ningun cuarto.
+- [ ] **AC6** — El README del plugin describe el arranque real tras el cambio,
+      y `skills/task-workflow/SKILL.md` dice en una linea como se pone
+      `taskctl` disponible.
+- [ ] **AC7** — Verificado a mano en esta sesion nativa: `/plugin marketplace
+      add` y `/plugin install` reales, con `taskctl` resolviendo como comando
+      suelto dentro de la sesion. Se documenta la salida real, sea cual sea el
+      resultado.
+- [ ] **AC8** — Documentada la restriccion de `bin/` de nivel superior para
+      distribucion por organization settings de claude.ai, con su consecuencia
+      para E1.
+
+## Resultado
+
+(pendiente de la revision por pares)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes b/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
new file mode 100644
index 0000000..f977133
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
@@ -0,0 +1,10 @@
+# Los fuentes TypeScript se materializan con LF en toda plataforma. No es
+# cosmetico: las plantillas multilinea de src/ viajan tal cual al build, asi
+# que con CRLF en el checkout de Windows el mismo src/ compila distinto que
+# en Linux y dist/src deja de ser reproducible (item E6 / TASK-031).
+*.ts text eol=lf
+
+# El build de produccion (dist/src) se versiona: sin el, un clon recien
+# hecho no trae un taskctl que arranque. Mismo motivo para fijar su eol:
+# tsc emite LF (newLine: lf en tsconfig) y aqui se fija que asi se quede.
+dist/** text eol=lf
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.gitignore b/taskcode-marketplace/plugins/taskcode-plugin/.gitignore
index 03b361f..e110045 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.gitignore
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.gitignore
@@ -1,3 +1,3 @@
 node_modules/
-dist/
+dist/test/
 tareas/
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index c010391..95af3d4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -17,14 +17,21 @@ documentación oficial (`https://code.claude.com/docs/en/plugins`,
 sección "Test your plugins locally"):
 
 ```bash
-npm install
-npm run build
 claude --plugin-dir /ruta/absoluta/a/TaskCode/taskcode-marketplace/plugins/taskcode-plugin
 ```
 
-Hay que compilar (`npm run build`) antes: `dist/` está en `.gitignore` y
-`bin/taskctl` importa `../dist/src/cli.js`, así que un checkout limpio sin
-build previo falla al arrancar.
+**No hay que compilar nada primero.** Desde TASK-031 (item E6) el build de
+producción, `dist/src/`, se versiona: un clon recién hecho ya trae un
+`taskctl` que arranca. `npm install && npm run build` sigue haciendo falta
+para *desarrollar* el plugin y para correr la suite, que compila también
+`dist/test/` — ese sí queda fuera del repo.
+
+Hasta esa tarea era al revés, y el texto de este README lo decía: `dist/`
+entero estaba en `.gitignore` y `bin/taskctl` importa `../dist/src/cli.js`,
+así que cualquiera que clonara el repo —o instalara el plugin desde el
+marketplace, que es una copia, no un checkout donde uno pueda compilar—
+recibía un CLI que moría con `Cannot find module ...dist/src/cli.js` y
+código 1.
 
 Con el plugin cargado, dentro de la sesión de Claude Code:
 
@@ -32,12 +39,58 @@ Con el plugin cargado, dentro de la sesión de Claude Code:
   siguiente sección).
 - `/reload-plugins` recarga el plugin tras cambios sin reiniciar la sesión.
 
-Si en el futuro se quiere una instalación persistente vía
-`/plugin install <nombre>@<marketplace>` (no solo para la sesión actual),
-hace falta además un `.claude-plugin/marketplace.json` en la raíz de
-`taskcode-marketplace/` que hoy no existe. Se ha dejado fuera del alcance
-de TASK-006 a propósito: el objetivo literal de la tarea es la carga local
-y el PATH del Bash tool, que no requieren marketplace.
+Para una instalación persistente vía `/plugin install <nombre>@<marketplace>`
+(no solo para la sesión actual) hace falta además un
+`.claude-plugin/marketplace.json` en la raíz del marketplace. **Ya existe**,
+en la raíz del repo, desde TASK-021 (item A1) — este README afirmó durante un
+tiempo que no, y era falso.
+
+## Cómo se distribuye: por qué `dist/src/` está versionado
+
+Instalar un plugin **no es un checkout donde el usuario pueda compilar**.
+Según la referencia oficial (`plugin-marketplaces`), Claude Code *copia* el
+plugin a su caché (`~/.claude/plugins/cache`). Sobre esa copia sí instala las
+dependencias npm —`npm ci --ignore-scripts`, porque el plugin trae
+`package.json` y `package-lock.json`—, pero ese `--ignore-scripts` es
+literal: **`postinstall` y `prepare` no se ejecutan nunca**. Compilar al
+instalar no es una opción que se descartara por criterio; la plataforma no la
+ofrece.
+
+De ahí que el build viaje ya hecho. Dos piezas lo sostienen, y conviene no
+tocarlas por separado:
+
+- `tsconfig.json` fija `"newLine": "lf"`, y `.gitattributes` fija
+  `*.ts text eol=lf` **además de** `dist/** text eol=lf`. Lo segundo no es
+  redundante: las plantillas multilínea de `src/` viajan tal cual al build,
+  así que con `core.autocrlf=true` el checkout de Windows mete CRLF dentro de
+  un literal y el mismo `src/` compila distinto que en Linux. Medido en su
+  día: 34 CRLF en `dist/src/cli.js`, todos dentro del literal `HELP`.
+- El CI recompila y falla si `dist/src` no coincide con lo commiteado, **en
+  Linux y en Windows**. Un guard en una sola plataforma no vería justo el
+  fallo que motiva lo anterior.
+
+Si cambias algo de `src/`, recompila y commitea `dist/src` en el mismo
+commit. El guard existe precisamente porque es fácil olvidarlo.
+
+### Limitación conocida: `bin/` y las organization settings de claude.ai
+
+El mecanismo por el que `taskctl` se invoca como comando suelto es tener el
+ejecutable en `bin/`, en la raíz del plugin (referencia oficial,
+`plugins-reference`: *"Executables added to the Bash tool's PATH and invokable
+as bare commands while the plugin is enabled"*). No pasa por ningún campo de
+`plugin.json`.
+
+Pero esa misma referencia avisa de que **un plugin con `bin/` de nivel
+superior no se puede distribuir por organization settings de claude.ai**: el
+sync del marketplace y la subida directa lo rechazan con
+`Plugin contains a top-level bin/ directory`, y la alternativa que prescribe
+es mover los ejecutables a `scripts/` e invocarlos por
+`${CLAUDE_PLUGIN_ROOT}/scripts/<nombre>`.
+
+Hoy no bloquea nada: la distribución es un marketplace privado por Git. Queda
+anotado porque condiciona **E1** (invitar colaboradores) y cualquier intento
+futuro de distribuir por esa vía, que obligaría a renunciar a `taskctl` como
+comando suelto o a reestructurar el plugin.
 
 ## `taskctl` en el PATH del Bash tool
 
@@ -217,8 +270,55 @@ script `test` de `package.json` expandía los globs en el shell, y `cmd.exe`
 no expande globs, así que la suite entera fallaba en Windows. Con el glob
 entrecomillado lo expande Node y funciona en ambos sistemas.
 
-Lo que **sigue** sin poder comprobarse desde una sesión no interactiva:
-`claude --plugin-dir` en modo interactivo y el `/plugin install` real.
+### RESUELTO (2026-09-07, TASK-031): el `/plugin install` real, por fin ejecutado
+
+TASK-006 y TASK-021 dejaron pendiente comprobar la instalación de verdad por
+no haber un CLI de Claude Code disponible. Ya lo hay (2.1.226), y esto es lo
+que se ejecutó:
+
+```
+$ claude plugin validate .                      # marketplace  -> ✔ passed
+$ claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin
+                                                # plugin       -> ✔ passed
+$ claude plugin marketplace add "C:\...\TaskCode"
+✔ Successfully added marketplace: taskcode-marketplace
+$ claude plugin install taskcode-plugin@taskcode-marketplace
+✔ Successfully installed plugin: taskcode-plugin@taskcode-marketplace (scope: user)
+```
+
+| Pregunta | Respuesta |
+|---|---|
+| ¿El plugin se instala desde el marketplace? | **Sí**, `enabled`, scope `user` |
+| ¿La copia cacheada trae `dist/`? | **Sí** — es lo que arregla E6 |
+| ¿`taskctl` arranca desde la caché, sin compilar? | **Sí**: `node <cache>/bin/taskctl --version` → `0.1.0` |
+| ¿Claude Code instala las deps npm en la copia? | **Sí**, hay `node_modules/` en la caché |
+| ¿Existe de verdad el mecanismo de `bin/` en PATH? | **Sí** — confirmado abajo |
+
+Lo último merece detalle, porque hasta ahora era una cita de la documentación
+que este proyecto nunca había visto ocurrir (el CI la *simula* metiendo `bin/`
+en el `PATH` a mano, que no prueba lo mismo). En el `PATH` de una sesión real
+aparecen entradas como:
+
+```
+.../.claude/plugins/cache/claude-plugins-official/figma/2.2.90/bin
+.../.claude/plugins/cache/karpathy-skills/andrej-karpathy-skills/1.0.0/bin
+```
+
+es decir, el mecanismo existe y opera sobre plugins instalados.
+
+**Lo que queda sin confirmar, y no se da por bueno**: en la sesión donde se
+hizo la instalación, `taskctl` como comando suelto seguía dando
+`command not found`, y el `bin/` de este plugin no estaba en el `PATH`. La
+explicación coherente con la evidencia es que el `PATH` se compone al arrancar
+la sesión y el plugin se instaló después — pero *eso no se ha comprobado*.
+Confirmarlo cuesta un comando en la siguiente sesión:
+
+```bash
+taskctl --version   # deberia imprimir 0.1.0 sin ruta ni node delante
+```
+
+Mientras tanto, lo que sí está probado es que el ejecutable de la caché es
+válido: con su directorio en el `PATH`, `taskctl --version` responde `0.1.0`.
 
 ### Segunda limitación, específica de este repo: `core.fileMode=false`
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
new file mode 100644
index 0000000..2d15c01
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js
@@ -0,0 +1,454 @@
+/**
+ * Punto de entrada del CLI. Sprint 0: --help/--version, "new" (TASK-003),
+ * "import" (TASK-004) y "board" (TASK-005).
+ */
+import path from 'node:path';
+import { runNewCommand, NewTaskArgError } from './commands/new.js';
+import { runImportCommand, ImportCommandError } from './commands/import.js';
+import { runBoardCommand, BoardCommandError } from './commands/board.js';
+import { runStartCommand, StartCommandError } from './commands/start.js';
+import { runPlanCommand, PlanCommandError } from './commands/plan.js';
+import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
+import { runReviewCommand, ReviewCommandError } from './commands/review.js';
+import { runFinishCommand, FinishCommandError } from './commands/finish.js';
+import { isWrapperCommand, runWrapperCommand, WrapperCommandError, } from './commands/wrappers.js';
+import { resolveGitflowScriptsDir, GitflowScriptLaunchError } from './fs/gitflow-runner.js';
+import { StateMachineError } from './core/state-machine.js';
+import { TaskFolderConflictError } from './fs/task-store.js';
+import { BaseBranchGuardError, GitCommandError, GitLaunchError, } from './fs/git.js';
+import { AutoCommitError } from './fs/git-commit.js';
+// ConfigError se captura en los mismos catch que AutoCommitError
+// (integracion TASK-030): sin esto cae al catch-all de bin/taskctl y
+// sale como "[ERROR] taskctl no pudo arrancar: ...", que miente —
+// taskctl arranco bien, lo que esta mal es el .taskcode/config.yml
+// del repo.
+import { ConfigError } from './core/config.js';
+const VERSION = '0.1.0';
+const HELP = `taskctl ${VERSION} — TaskCode
+
+Uso:
+  taskctl --help
+  taskctl --version
+  taskctl new --titulo "<texto>" --tipo <feature|fix|hotfix|release> \\
+              [--sprint N] [--etiquetas a,b,c] [--complejidad ...] \\
+              [--modelo-sugerido ...] [--agente-revisor ...]
+  taskctl import <fichero.md> [--tipo <feature|fix|hotfix|release>] \\
+                 [--sprint N] [--complejidad ...] [--modelo-sugerido ...] \\
+                 [--agente-revisor ...]
+  taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
+  taskctl start TASK-NNN [--asignado-a <persona>] [--push]
+  taskctl plan TASK-NNN [--asignado-a <persona>] [--push]
+  taskctl approve TASK-NNN [--push]
+  taskctl review TASK-NNN [--push]
+  taskctl finish TASK-NNN [--push]
+  taskctl diagnose
+  taskctl pause [--push]
+  taskctl resume [<rama>]
+  taskctl recover [<rama>]
+  taskctl abort-merge
+
+Comandos: new, import, board, start, plan, approve, review, finish.
+Wrappers de Git-Flow: diagnose, pause, resume, recover, abort-merge.
+--asignado-a se acepta tambien escrito --asignado_a, en los tres comandos.
+taskctl commitea SOLO los ficheros que el mismo escribe (nunca "git add -A"):
+lo que tengas a medias en el arbol se queda como esta. --push sube ademas la
+rama actual a origin; sin origin alcanzable avisa y sigue.
+Los wrappers preguntan (guardar como commit o stash, confirmar un abort...):
+ejecutalos desde una terminal. Sin ella toman el valor por defecto de cada
+pregunta, avisando de cual; y cuando ese valor haria lo contrario de lo que
+dice el comando, taskctl aborta antes con instrucciones.
+Ver docs/PLAN_SPRINTS.md en el repo del proyecto.
+`;
+function today() {
+    return new Date().toISOString().slice(0, 10);
+}
+/**
+ * Algunos errores del CLI ya se construyen con el prefijo "[ERROR]"
+ * (StartCommandError, PlanCommandError, StateMachineError...), otros
+ * no (TaskFolderConflictError, NewTaskArgError...). Evita duplicar el
+ * prefijo en vez de tener que acordarse caso por caso (hallazgo de
+ * revision por pares, TASK-010: TaskFolderConflictError no se
+ * capturaba en absoluto antes de este ajuste).
+ */
+function printCliError(e) {
+    const msg = e.message.startsWith('[ERROR]') ? e.message : `[ERROR] ${e.message}`;
+    process.stderr.write(`${msg}\n`);
+}
+/**
+ * Aviso informativo del paso 3 de la seccion 8.3 (TASK-012): cuando
+ * ensureBaseBranchReady tuvo que cambiar de rama por la persona, se lo
+ * dice antes de mostrar el resultado del comando — mismo formato que
+ * el ejemplo de la metodologia ("Workspace limpio -> cambiando
+ * automaticamente a develop..."), en pasado porque para cuando se
+ * imprime ya ha terminado.
+ */
+function printBaseBranchSwitchNotice(guard) {
+    if (!guard.switched)
+        return;
+    process.stdout.write(`Workspace limpio -> cambiado automaticamente de "${guard.branchAntes}" a ` +
+        `"${guard.baseBranch}".\n`);
+}
+/**
+ * Resultado del auto-commit (TASK-030, item C2). Se dice SIEMPRE, en
+ * los dos desenlaces: "no habia nada que commitear" no es silencio,
+ * porque la diferencia entre "taskctl lo registro" y "esto sigue sin
+ * registrar" es justo lo que la persona necesita saber para decidir si
+ * tiene que hacer algo. Los avisos (sin origin, HEAD desacoplado) van
+ * por stderr, como el resto de avisos del CLI.
+ */
+function printAutoCommit(r) {
+    printAvisos(...r.avisos);
+    if (r.commiteado) {
+        const n = r.ficheros.length;
+        process.stdout.write(`Commiteado ${r.commit} en "${r.rama}" (${n} fichero${n === 1 ? '' : 's'}).\n`);
+    }
+    else {
+        process.stdout.write('Sin cambios que commitear (nada nuevo en disco).\n');
+    }
+    if (r.push === 'empujado') {
+        process.stdout.write(`Push completado: ${r.rama} -> origin/${r.rama}.\n`);
+    }
+}
+/**
+ * Confirmacion de --asignado-a (item B6). Solo se imprime cuando el
+ * flag CAMBIO algo: si la tarea ya venia asignada a esa misma persona,
+ * repetirlo seria ruido. Y se imprime siempre que cambie, tambien
+ * cuando "plan" ya la habia asignado y "start" la reasigna — ahi es
+ * justo donde interesa que se vea.
+ */
+function asignacionNotice(result) {
+    if (!result.asignadoCambiado || result.asignadoA === null)
+        return '';
+    return `Asignada a "${result.asignadoA}".\n`;
+}
+/**
+ * Avisos de asignacion (TASK-024) por stderr: no son errores, el
+ * comando ha hecho su trabajo, pero la persona necesita enterarse.
+ * Uno se emite cuando su "git config user.email" no sirve como
+ * asignado_a; el otro, cuando arranca una tarea que esta a nombre de
+ * otra persona.
+ */
+function printAvisos(...avisos) {
+    for (const aviso of avisos) {
+        if (aviso)
+            process.stderr.write(`[AVISO] ${aviso}\n`);
+    }
+}
+export async function main(argv) {
+    const cmd = argv[0];
+    if (cmd === undefined || cmd === '--help' || cmd === '-h') {
+        process.stdout.write(HELP);
+        return 0;
+    }
+    if (cmd === '--version' || cmd === '-v') {
+        process.stdout.write(`${VERSION}\n`);
+        return 0;
+    }
+    if (cmd === 'new') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runNewCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+            printBaseBranchSwitchNotice(result.baseBranchGuard);
+            process.stdout.write(`Tarea ${result.id} creada: ${result.filePath}\n`);
+            printAutoCommit(result.autoCommit);
+            return 0;
+        }
+        catch (e) {
+            if (e instanceof AutoCommitError ||
+                e instanceof ConfigError ||
+                e instanceof NewTaskArgError ||
+                e instanceof BaseBranchGuardError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    if (cmd === 'import') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runImportCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+            printBaseBranchSwitchNotice(result.baseBranchGuard);
+            for (const aviso of result.advertencias) {
+                process.stderr.write(`[AVISO] ${aviso}\n`);
+            }
+            for (const error of result.errores) {
+                process.stderr.write(`[ERROR] Linea ${error.lineNumber} ("${error.tituloRaw}"): ${error.motivo}\n`);
+            }
+            for (const omitida of result.omitidas) {
+                process.stdout.write(`Omitida "${omitida.titulo}": ${omitida.motivo}\n`);
+            }
+            for (const creada of result.creadas) {
+                process.stdout.write(`Tarea ${creada.id} creada: ${creada.filePath}\n`);
+            }
+            process.stdout.write(`Import completado: ${result.creadas.length} creada(s), ` +
+                `${result.omitidas.length} omitida(s), ${result.errores.length} con error.\n`);
+            // Hallazgo IMPORTANTE de revision por pares (TASK-004): antes
+            // siempre devolvia 0, incluso si TODAS las entradas fallaban —
+            // un "taskctl import x.md && siguiente_paso" en un script nunca
+            // se enteraba de que el import no creo nada.
+            printAutoCommit(result.autoCommit);
+            return result.errores.length > 0 ? 1 : 0;
+        }
+        catch (e) {
+            if (e instanceof AutoCommitError ||
+                e instanceof ConfigError ||
+                e instanceof ImportCommandError ||
+                e instanceof BaseBranchGuardError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    if (cmd === 'board') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runBoardCommand(tareasRoot, argv.slice(1), {
+                repoCwd,
+                today: today(),
+            });
+            for (const aviso of result.advertencias) {
+                process.stderr.write(`[AVISO] ${aviso}\n`);
+            }
+            if (result.totalTareas === 0) {
+                process.stdout.write('No hay tareas que coincidan (o no hay ninguna tarea todavia).\n');
+            }
+            else {
+                process.stdout.write(`${result.output}\n`);
+            }
+            if (result.boardPath !== null) {
+                process.stdout.write(`\nRegenerado ${result.boardPath} (recuerda commitearlo).\n`);
+            }
+            return 0;
+        }
+        catch (e) {
+            if (e instanceof BoardCommandError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    if (cmd === 'start') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runStartCommand(tareasRoot, argv.slice(1), today(), {
+                repoCwd,
+                scriptsDir: resolveGitflowScriptsDir(),
+            });
+            printAvisos(result.avisoIdentidad, result.avisoAtribucion, ...result.avisosWip);
+            process.stdout.write(`Tarea ${result.id} en curso: rama ${result.rama} creada y confirmada, ` +
+                `tarea movida a ${result.filePath}\n${asignacionNotice(result)}`);
+            printAutoCommit(result.autoCommit);
+            return 0;
+        }
+        catch (e) {
+            // GitflowScriptLaunchError incluido (hallazgo menor de revision
+            // por pares, TASK-014, preexistente desde TASK-009): sin esto un
+            // bash ilanzable caia al catch-all con "taskctl no pudo arrancar".
+            if (e instanceof AutoCommitError ||
+                e instanceof ConfigError ||
+                e instanceof StartCommandError ||
+                e instanceof StateMachineError ||
+                e instanceof TaskFolderConflictError ||
+                e instanceof GitflowScriptLaunchError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    if (cmd === 'plan') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runPlanCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+            printBaseBranchSwitchNotice(result.baseBranchGuard);
+            printAvisos(result.avisoIdentidad);
+            // Tres desenlaces posibles desde TASK-027 (item C3): scaffold
+            // nuevo, plan que ya estaba en planificacion/, o plan legado
+            // suelto en la raiz que esta invocacion acaba de mover ahi.
+            let scaffoldMsg;
+            if (result.planMigrado) {
+                scaffoldMsg =
+                    `El plan estaba suelto en la raiz de la carpeta (formato anterior) y se ha movido ` +
+                        `intacto a ${result.planPath}.`;
+            }
+            else if (result.planCreated) {
+                scaffoldMsg = `Scaffold creado en ${result.planPath} — redactalo antes de "taskctl approve".`;
+            }
+            else {
+                scaffoldMsg = `${result.planPath} ya existia (re-planificacion) — se dejo intacto.`;
+            }
+            process.stdout.write(`Tarea ${result.id} en diseno: movida a ${result.filePath}. ${scaffoldMsg}\n` +
+                asignacionNotice(result));
+            printAutoCommit(result.autoCommit);
+            return 0;
+        }
+        catch (e) {
+            if (e instanceof AutoCommitError ||
+                e instanceof ConfigError ||
+                e instanceof PlanCommandError ||
+                e instanceof StateMachineError ||
+                e instanceof TaskFolderConflictError ||
+                e instanceof BaseBranchGuardError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    if (cmd === 'approve') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runApproveCommand(tareasRoot, argv.slice(1), today(), { repoCwd });
+            printBaseBranchSwitchNotice(result.baseBranchGuard);
+            // Nota (hallazgo menor de revision por pares): para complejidad
+            // trivial/simple, "taskctl start" nunca exigio plan_aprobado
+            // (ver TRIVIAL_SIN_APROBACION en state-machine.ts) — el mensaje
+            // no sobrevende que approve fuera un requisito, solo confirma el
+            // resultado del propio comando.
+            process.stdout.write(`Tarea ${result.id} aprobada (plan_aprobado: true): ${result.filePath}.\n`);
+            printAutoCommit(result.autoCommit);
+            return 0;
+        }
+        catch (e) {
+            if (e instanceof AutoCommitError ||
+                e instanceof ConfigError ||
+                e instanceof ApproveCommandError ||
+                e instanceof StateMachineError ||
+                e instanceof TaskFolderConflictError ||
+                e instanceof BaseBranchGuardError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    if (cmd === 'review') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runReviewCommand(tareasRoot, argv.slice(1), today(), {
+                repoCwd,
+                scriptsDir: resolveGitflowScriptsDir(),
+            });
+            process.stdout.write(`Tarea ${result.id} en revision: "${result.baseBranch}" integrada en ` +
+                `"${result.rama}" (merge verificado), tarea movida a ${result.filePath}.\n` +
+                `Peticion de revision (ronda ${result.ronda}): ${result.peticionPath}\n` +
+                `Lanza el agente revisor con esa peticion y vuelca su salida en ` +
+                `${result.informePath}.\n`);
+            printAutoCommit(result.autoCommit);
+            return 0;
+        }
+        catch (e) {
+            // GitLaunchError/GitCommandError tambien se capturan aqui
+            // (hallazgo MENOR de revision por pares, TASK-013): sin esto
+            // caian al catch-all de bin/taskctl con el prefijo enganoso
+            // "taskctl no pudo arrancar".
+            if (e instanceof AutoCommitError ||
+                e instanceof ConfigError ||
+                e instanceof ReviewCommandError ||
+                e instanceof StateMachineError ||
+                e instanceof TaskFolderConflictError ||
+                e instanceof GitLaunchError ||
+                e instanceof GitCommandError ||
+                e instanceof GitflowScriptLaunchError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    if (cmd === 'finish') {
+        const repoCwd = process.cwd();
+        const tareasRoot = path.join(repoCwd, 'tareas');
+        try {
+            const result = await runFinishCommand(tareasRoot, argv.slice(1), today(), {
+                repoCwd,
+                scriptsDir: resolveGitflowScriptsDir(),
+            });
+            const mainInfo = result.mainBranch === null ? '' : ` y en "${result.mainBranch}" (con tag)`;
+            process.stdout.write(`Tarea ${result.id} terminada: "${result.rama}" integrada en ` +
+                `"${result.baseBranch}"${mainInfo}, tarea movida a ${result.filePath}.\n` +
+                `Actualizados: ${result.changelogPath}, ${result.indexPath} y ${result.boardPath}.\n`);
+            printAutoCommit(result.autoCommit);
+            // --push empuja LA RAMA ACTUAL, que tras "finish" es develop
+            // (misma doctrina que "taskctl pause --push"). En hotfix/release
+            // hay ademas un merge a main y un tag que NO se suben: callarlo
+            // dejaria creer que la publicacion esta completa.
+            if (result.mainBranch !== null && result.autoCommit.push === 'empujado') {
+                printAvisos(`--push ha subido "${result.autoCommit.rama}", pero NO "${result.mainBranch}" ni el ` +
+                    `tag de esta ${result.rama.split('/')[0]}: subelos tu ` +
+                    `("git push origin ${result.mainBranch} --follow-tags").`);
+            }
+            return 0;
+        }
+        catch (e) {
+            if (e instanceof AutoCommitError ||
+                e instanceof ConfigError ||
+                e instanceof FinishCommandError ||
+                e instanceof StateMachineError ||
+                e instanceof TaskFolderConflictError ||
+                e instanceof GitLaunchError ||
+                e instanceof GitCommandError ||
+                e instanceof GitflowScriptLaunchError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    // Los cinco wrappers de Git-Flow (TASK-026). Van al final a
+    // proposito: son los unicos comandos que no tocan "tareas/", asi
+    // que ninguna de las precondiciones de arriba (maquina de estados,
+    // rama base de la 8.3) les aplica.
+    if (isWrapperCommand(cmd)) {
+        const repoCwd = process.cwd();
+        try {
+            const result = runWrapperCommand(cmd, argv.slice(1), {
+                repoCwd,
+                scriptsDir: resolveGitflowScriptsDir(),
+                // Sin TTY no hay a quien preguntar. Es mas estricto que la
+                // realidad (una tuberia con las respuestas escritas tambien
+                // valdria), y es deliberado: distinguir "tuberia con
+                // respuestas" de "tuberia vacia" solo se puede hacer leyendo,
+                // y leer stdin aqui le robaria al script su respuesta. Con
+                // una tuberia abierta y vacia, ademas, heredarla colgaria el
+                // comando para siempre.
+                interactivo: process.stdin.isTTY === true,
+                onAviso: (aviso) => printAvisos(aviso),
+            });
+            // Una senal (un Ctrl-C sobre el script, por ejemplo) no deja
+            // codigo de salida util: se dice y se sale con 1, igual que
+            // hacen start/review/finish (hallazgo MENOR de revision por
+            // pares).
+            if (result.signal !== null) {
+                process.stderr.write(`[ERROR] ${result.script} termino por senal ${result.signal}. Revisa el estado del ` +
+                    'repo con "taskctl diagnose" antes de reintentar.\n');
+                return 1;
+            }
+            // El codigo del script se propaga tal cual: un "pause"
+            // cancelado sale 0 y uno con opcion no reconocida sale 1.
+            return result.code;
+        }
+        catch (e) {
+            if (e instanceof WrapperCommandError ||
+                e instanceof GitflowScriptLaunchError ||
+                e instanceof GitLaunchError ||
+                e instanceof GitCommandError) {
+                printCliError(e);
+                return 1;
+            }
+            throw e;
+        }
+    }
+    process.stderr.write(`[ERROR] Comando desconocido: "${cmd}"\n\n${HELP}`);
+    return 1;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js
new file mode 100644
index 0000000..3335534
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js
@@ -0,0 +1,31 @@
+export function parseArgs(argv) {
+    const positional = [];
+    const flags = {};
+    for (let i = 0; i < argv.length; i++) {
+        const arg = argv[i];
+        if (arg === undefined)
+            continue;
+        if (arg.startsWith('--')) {
+            const withoutPrefix = arg.slice(2);
+            const eqIdx = withoutPrefix.indexOf('=');
+            if (eqIdx !== -1) {
+                const key = withoutPrefix.slice(0, eqIdx);
+                flags[key] = withoutPrefix.slice(eqIdx + 1);
+                continue;
+            }
+            const key = withoutPrefix;
+            const next = argv[i + 1];
+            if (next !== undefined && !next.startsWith('--')) {
+                flags[key] = next;
+                i++;
+            }
+            else {
+                flags[key] = true;
+            }
+        }
+        else {
+            positional.push(arg);
+        }
+    }
+    return { positional, flags };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/asignado.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/asignado.js
new file mode 100644
index 0000000..6af6112
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/asignado.js
@@ -0,0 +1,144 @@
+/**
+ * Parseo del flag --asignado-a, compartido por "plan" y "start"
+ * (item B6 del checklist de terminacion). Vive aparte porque los dos
+ * comandos lo necesitan identico y con los mismos mensajes de error, y
+ * duplicarlo garantizaria que a la primera correccion divergieran.
+ *
+ * Por que un modulo y no un campo mas de parseNewTaskArgs: "new" y
+ * "import" construyen una tarea NUEVA (asignado_a nace a null, seccion
+ * 4 de la metodologia), mientras que aqui se MUTA una tarea existente
+ * — y "no se paso el flag" tiene que poder distinguirse de "se paso
+ * vacio", cosa que un valor por defecto no permite.
+ *
+ * DOS NOMBRES A PROPOSITO. El canonico es "--asignado-a", que es el
+ * que usa la seccion 8.2 de la metodologia (congelada) al describir
+ * este mismo flag sobre "plan". Pero "taskctl board" ya expone el
+ * filtro equivalente como "--asignado_a", con guion bajo, porque asi
+ * lo especifico el Objetivo de TASK-005 (igual al nombre del campo del
+ * frontmatter). Esa inconsistencia es previa a B6 y no se puede
+ * resolver sin romper una de las dos: se acepta el alias con guion
+ * bajo tambien aqui, porque parseArgs IGNORA EN SILENCIO los flags
+ * desconocidos (divergencia ya documentada en HALLAZGOS.md), asi que
+ * un "taskctl plan TASK-001 --asignado_a carlos" sin el alias saldria
+ * con codigo 0 sin haber asignado a nadie.
+ */
+import { parseArgs } from './args.js';
+/** Nombre canonico del flag (seccion 8.2 de la metodologia). */
+export const ASIGNADO_FLAG = 'asignado-a';
+/** Alias aceptado, por coherencia con "taskctl board --asignado_a". */
+export const ASIGNADO_FLAG_ALIAS = 'asignado_a';
+/**
+ * Coletilla para "plan" y "start" cuando el valor viene vacio: ahi el
+ * flag ESCRIBE, asi que tiene sentido explicar como dejar una tarea sin
+ * asignar. En "board", que solo filtra, sobraria.
+ */
+export const PISTA_VACIO_ESCRITURA = ' Omitir el flag NO desasigna: conserva a quien estuviera y, si no habia nadie, pone la ' +
+    'identidad de "git config user.email" (TASK-024). Hoy no hay forma de dejar una tarea sin ' +
+    'asignar desde el CLI: editar "asignado_a: null" a mano tampoco basta, porque el siguiente ' +
+    'plan o start volveria a rellenarlo con tu identidad.';
+/**
+ * Devuelve el valor de --asignado-a (o de su alias --asignado_a) ya
+ * recortado, o undefined si no se paso ninguno de los dos — que NO es
+ * lo mismo que asignarlo a null: sin flag, el comando conserva el
+ * asignado_a que la tarea ya tuviera.
+ *
+ * `fail` construye el error a lanzar para que cada comando lance el
+ * suyo (PlanCommandError / StartCommandError) y el despacho de errores
+ * de cli.ts siga funcionando sin tocarlo.
+ */
+/**
+ * Tope de longitud del valor. No es una regla de negocio sobre nombres
+ * de persona: es que "asignado_a" se pinta como columna en el listado
+ * de "taskctl board" y acaba dentro de docs/BOARD.md, que es un fichero
+ * versionado. Un valor de 500 caracteres estira la fila a 500 columnas
+ * y deja el tablero ilegible para todo el mundo (hallazgo MENOR de
+ * revision por pares, B6). Antes de B6 hacia falta editar el
+ * frontmatter a mano para conseguirlo; ahora seria un flag.
+ */
+export const ASIGNADO_MAX_LONGITUD = 64;
+/**
+ * Reglas que debe cumplir CUALQUIER valor que acabe en el campo
+ * "asignado_a", venga del flag o de la identidad Git. Devuelve el
+ * motivo por el que no vale, o null si vale.
+ *
+ * Extraida de parseAsignadoAFlag por un hallazgo CRITICO de revision
+ * por pares (TASK-024): la identidad Git entraba por otra puerta y no
+ * pasaba por ninguna de estas comprobaciones. Un
+ * "git config user.email" con un salto de linea dentro producia un
+ * tarea.md con una clave INYECTADA que pisaba "estado", dejando la
+ * tarea fisicamente en 01-en-diseno pero declarandose "terminada" — y
+ * ladrillada, porque ningun comando aceptaba ya ese estado. Exit 0 y
+ * sin un solo aviso.
+ */
+export function motivoValorInvalido(bruto) {
+    const valor = bruto.trim();
+    if (valor === '')
+        return 'no puede estar vacio';
+    if (valor.length > ASIGNADO_MAX_LONGITUD) {
+        return (`no puede pasar de ${ASIGNADO_MAX_LONGITUD} caracteres (recibidos ${valor.length}): ` +
+            'el valor se pinta como columna en "taskctl board" y acaba dentro de docs/BOARD.md, ' +
+            'que es un fichero versionado');
+    }
+    // Un salto de linea romperia el frontmatter YAML al escribirlo (una
+    // linea "asignado_a: a\nb" deja de ser un mapa valido) y, peor,
+    // permite inyectar claves nuevas que pisan las de verdad.
+    if (/[\r\n]/.test(valor)) {
+        return 'no puede contener saltos de linea: romperia el frontmatter de tarea.md';
+    }
+    return null;
+}
+/**
+ * Filtra la identidad Git antes de usarla como asignado_a (TASK-024).
+ * A diferencia del flag, una identidad invalida NO aborta el comando:
+ * quien ejecuta no ha pedido nada raro, es su configuracion de Git la
+ * que no sirve para esto. Se ignora (la tarea queda como estuviera) y
+ * se devuelve un aviso para que el CLI lo saque por stderr, en vez de
+ * corromper el fichero o de plantarle un error en la cara por algo que
+ * no ha hecho en este comando.
+ */
+export function identidadUsable(bruto) {
+    if (bruto === null)
+        return { identidad: null, aviso: null };
+    const problema = motivoValorInvalido(bruto);
+    if (problema === null)
+        return { identidad: bruto.trim(), aviso: null };
+    return {
+        identidad: null,
+        aviso: `tu "git config user.email" ${problema}, asi que no se usa para asignar la tarea. ` +
+            `Corrigelo, o asigna a mano con --${ASIGNADO_FLAG}.`,
+    };
+}
+export function parseAsignadoAFlag(argv, fail, 
+/**
+ * Coletilla opcional para el error de valor vacio. La usan "plan" y
+ * "start", donde tiene sentido explicar como dejar una tarea sin
+ * asignar; "board", que solo filtra, no la pasa.
+ */
+pistaVacio = '') {
+    const { flags } = parseArgs(argv);
+    const canonico = flags[ASIGNADO_FLAG];
+    const alias = flags[ASIGNADO_FLAG_ALIAS];
+    if (canonico !== undefined && alias !== undefined) {
+        throw fail(`[ERROR] --${ASIGNADO_FLAG} y --${ASIGNADO_FLAG_ALIAS} son el mismo flag: pasa solo uno ` +
+            `(el nombre canonico es --${ASIGNADO_FLAG}).`);
+    }
+    const raw = canonico !== undefined ? canonico : alias;
+    if (raw === undefined)
+        return undefined;
+    // Un booleano significa "--asignado-a" suelto, sin valor detras. Sin
+    // este rechazo, parseArgs lo devuelve como booleano y acabaria
+    // escrito en el frontmatter como el string "true": una persona
+    // llamada "true" asignada en silencio.
+    if (typeof raw !== 'string') {
+        throw fail(`[ERROR] --${ASIGNADO_FLAG} necesita un valor: --${ASIGNADO_FLAG} <persona> ` +
+            `(o --${ASIGNADO_FLAG}=<persona> si el nombre empieza por "--").`);
+    }
+    const problema = motivoValorInvalido(raw);
+    if (problema !== null) {
+        // pistaVacio solo tiene sentido en el caso del valor vacio: en los
+        // demas, "omite el flag" no es la salida.
+        const pista = raw.trim() === '' ? pistaVacio : '';
+        throw fail(`[ERROR] --${ASIGNADO_FLAG} ${problema}.${pista}`);
+    }
+    return raw.trim();
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js
new file mode 100644
index 0000000..24e0a4d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js
@@ -0,0 +1,113 @@
+/**
+ * taskctl approve — TASK-011 de PLAN_SPRINTS.md. Checkpoint humano de
+ * la fase de diseno (seccion 6 de la metodologia): marca
+ * plan_aprobado: true una vez que plan-final.md existe, este en
+ * `planificacion/` (ubicacion canonica desde TASK-027) o suelto en la
+ * raiz de la carpeta (legado).
+ *
+ * NO evalua la CALIDAD del plan (sigue siendo scaffold vacio vs.
+ * redactado de verdad) — ese juicio lo hace la persona antes de
+ * ejecutar el comando. La unica comprobacion automatica es la misma
+ * que la maquina de estados de TASK-002 ya modela como
+ * ctx.planFinalExiste: que el fichero exista.
+ *
+ * A diferencia de "plan"/"start", este comando no mueve la tarea de
+ * carpeta (resultingState('approve', task) sigue siendo 'en-diseno').
+ *
+ * Desde TASK-012 tambien aplica la precondicion de rama base de la
+ * seccion 8.3 (ensureBaseBranchReady) antes de escribir nada.
+ */
+import path from 'node:path';
+import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import { resolverPlanFinal } from './plan.js';
+import { ensureBaseBranchReady } from '../fs/git.js';
+import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
+export class ApproveCommandError extends Error {
+}
+/**
+ * Acepta el plan en CUALQUIERA de sus dos ubicaciones (TASK-027, item
+ * C3): `planificacion/plan-final.md` (canonica) o suelto en la raiz de
+ * la carpeta (legado del CLI anterior). Mirar solo la canonica dejaria
+ * sin poder aprobarse a toda tarea planificada antes del cambio, que
+ * es justo el caso que tiene el plan ya redactado.
+ *
+ * Con los DOS a la vez rechaza, en lugar de aprobar el primero que
+ * encuentra (hallazgo MENOR de revision por pares, TASK-027): "plan" ya
+ * trata ese estado como irresoluble y aborta, y dos merges --no-ff sin
+ * conflicto bastan para producirlo. Aprobar a ciegas un estado con dos
+ * planes divergentes es marcar como revisado un plan que quiza nadie
+ * ha leido.
+ */
+/** true si hay un plan que aprobar en cualquiera de las dos ubicaciones. */
+function planFinalExisteEn(u) {
+    return u !== null && (u.canonicaExiste || u.legadaExiste);
+}
+/**
+ * Se llama DESPUES de assertTransitionAllowed, no antes (hallazgo MENOR
+ * de revision por pares ronda 2, TASK-027): con la tarea en un estado
+ * que no se puede aprobar, quejarse primero de la ambiguedad tapaba el
+ * motivo real y mandaba a la persona a comparar dos planes que no
+ * desbloquean nada. El estado manda; la ambiguedad es el siguiente
+ * obstaculo, no el primero.
+ */
+function assertPlanNoAmbiguo(id, u) {
+    if (u.canonicaExiste && u.legadaExiste) {
+        throw new ApproveCommandError(`[ERROR] ${id}: hay un plan-final.md en la raiz de la carpeta y otro en ` +
+            `planificacion/. No se puede aprobar sin saber cual es el plan bueno. Compara ` +
+            `"${u.legada}" con "${u.canonica}", deja solo el de planificacion/ ` +
+            'y reintenta. No se ha tocado nada.');
+    }
+}
+export async function runApproveCommand(tareasRoot, argv, today, deps) {
+    // --push se saca ANTES de leer el ID: es booleano puro y va delante
+    // o detras indistintamente ("taskctl approve --push TASK-030").
+    const { push, resto } = extraerPushFlag(argv);
+    const id = resto[0];
+    if (id === undefined || id.trim() === '') {
+        throw new ApproveCommandError('[ERROR] Falta el ID de la tarea: taskctl approve TASK-NNN.');
+    }
+    // Lectura PRELIMINAR, contra la rama activa en este momento (puede
+    // no ser la rama base real). Solo para rechazar rapido, sin tocar
+    // Git, un caso ya claramente invalido aqui, y para conocer
+    // initial.task.tipo (metadata estable) y resolver la rama base. NO
+    // se usa para escribir nada — ver el comentario equivalente y mas
+    // detallado en plan.ts (hallazgo CRITICO de revision por pares,
+    // TASK-012: antes de este fix, approve podia sobrescribir en
+    // silencio el contenido real de la rama base con los datos de una
+    // lectura hecha en una rama vieja, tras el cambio automatico).
+    const initial = await readTareaFile(tareasRoot, id);
+    const ubicacionInicial = initial ? await resolverPlanFinal(path.dirname(initial.filePath)) : null;
+    assertTransitionAllowed('approve', initial ? initial.task : null, {
+        planFinalExiste: planFinalExisteEn(ubicacionInicial),
+    });
+    assertPlanNoAmbiguo(id, ubicacionInicial);
+    // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
+    // tiene cambios sin commitear, o si no puede cambiar de forma
+    // automatica a la rama base esperada segun initial.task.tipo.
+    const baseBranchGuard = ensureBaseBranchReady(initial.task.tipo, deps.repoCwd);
+    // Lectura FRESCA, ya en la rama base real — la unica que decide si
+    // se marca plan_aprobado y con que contenido de partida (etiquetas,
+    // asignado_a, etc. se preservan tal cual esten en la rama base, no
+    // como estuvieran en la rama vieja de la lectura preliminar).
+    const existing = await readTareaFile(tareasRoot, id);
+    const ubicacion = existing ? await resolverPlanFinal(path.dirname(existing.filePath)) : null;
+    assertTransitionAllowed('approve', existing ? existing.task : null, {
+        planFinalExiste: planFinalExisteEn(ubicacion),
+    });
+    assertPlanNoAmbiguo(id, ubicacion);
+    const { task, body, filePath } = existing;
+    const updated = { ...task, plan_aprobado: true, actualizado: today };
+    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+    // Paso 5 de la 8.3 (TASK-030, item C2). "approve" no cambia el
+    // estado de la tarea, asi que origen y destino son la MISMA carpeta;
+    // se pasan las dos igualmente porque autoCommit deduplica y asi el
+    // dia que approve mueva algo esto no se queda corto en silencio.
+    const commitResult = autoCommit({
+        cwd: deps.repoCwd,
+        rutas: [path.dirname(filePath), path.dirname(newFilePath)],
+        mensaje: mensajeChore(task.id, 'plan aprobado'),
+        push,
+    });
+    return { id: task.id, filePath: newFilePath, baseBranchGuard, autoCommit: commitResult };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/board.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/board.js
new file mode 100644
index 0000000..0e39025
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/board.js
@@ -0,0 +1,180 @@
+/**
+ * taskctl board — listado de tareas por estado (TASK-005 de
+ * PLAN_SPRINTS.md). A diferencia de "new"/"import"/"plan"/"approve",
+ * board es de SOLO LECTURA: no crea ni modifica ningun fichero de
+ * tareas/ ni toca Git, asi que no aplica la precondicion de rama base
+ * de la seccion 8.3 (esa precondicion es para comandos que escriben
+ * en la rama activa — TASK-012 ya lo dice explicitamente para "start",
+ * y por el mismo motivo tampoco aplica aqui).
+ *
+ * Lee CADA tarea existente (no solo los nombres de carpeta) para poder
+ * filtrar y mostrar titulo/asignado — a diferencia de "import", que
+ * solo necesitaba el titulo de las tareas ya existentes para detectar
+ * duplicados, board los necesita todos para el listado en si. Aplica
+ * el mismo tratamiento que TASK-004 establecio para una tarea.md
+ * invalida ajena (FrontmatterParseError/TaskValidationError): se
+ * reporta como advertencia y esa tarea concreta no aparece en el
+ * board, en vez de romper el comando entero.
+ */
+import path from 'node:path';
+import { mkdir, writeFile, stat } from 'node:fs/promises';
+import { parseArgs } from '../cli/args.js';
+import { parseAsignadoAFlag } from '../cli/asignado.js';
+import { FrontmatterParseError } from '../core/frontmatter.js';
+import { TaskValidationError } from '../core/task.js';
+import { filterTasks, formatBoard, renderBoardMarkdown, } from '../core/board-format.js';
+import { listExistingTaskIds, readTareaFile, isEnoent } from '../fs/task-store.js';
+export class BoardCommandError extends Error {
+}
+/** Ruta de docs/BOARD.md dentro del repo del usuario. */
+export function boardFilePath(repoCwd) {
+    return path.join(repoCwd, 'docs', 'BOARD.md');
+}
+/**
+ * true si se pidio "--escribir" (item B5): regenerar docs/BOARD.md
+ * ademas de listar por pantalla. No se escribe por defecto a
+ * proposito: "board" es hoy el unico comando de solo lectura del CLI, y
+ * escribir en cada invocacion ensuciaria el workspace, disparando el
+ * guard de la seccion 8.3 en el siguiente plan/start/review/finish —
+ * exactamente la trampa que "taskctl import" ya documenta en
+ * HALLAZGOS.md (genera la suciedad que bloquea su propio siguiente uso).
+ */
+function parseEscribirFlag(argv) {
+    const { flags } = parseArgs(argv);
+    const raw = flags['escribir'];
+    if (raw === undefined)
+        return false;
+    if (raw !== true) {
+        throw new BoardCommandError('--escribir no lleva valor: usalo suelto (taskctl board --escribir).');
+    }
+    return true;
+}
+export function parseBoardArgs(argv) {
+    const { flags } = parseArgs(argv);
+    const filters = {};
+    const sprintRaw = flags['sprint'];
+    if (sprintRaw !== undefined) {
+        if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
+            throw new BoardCommandError('--sprint debe ser un numero entero no negativo.');
+        }
+        filters.sprint = parseInt(sprintRaw, 10);
+    }
+    // Historicamente este filtro solo aceptaba "--asignado_a", con guion
+    // bajo: asi lo especifico el Objetivo de TASK-005, a proposito igual
+    // al nombre del campo en el frontmatter aunque rompiera la convencion
+    // de guiones del resto de flags del CLI.
+    //
+    // Desde B6 acepta TAMBIEN "--asignado-a", que es el nombre que la
+    // seccion 8.2 de la metodologia da al flag de "plan"/"start" y el que
+    // sale en la ayuda. Sin esto (hallazgo IMPORTANTE de revision por
+    // pares, B6), quien acababa de asignar con "plan --asignado-a carlos"
+    // y reutilizaba esa grafia aqui recibia EL TABLERO ENTERO con codigo
+    // 0 — parseArgs ignora los flags que no conoce — y concluia que
+    // carlos tenia todas las tareas del repo. Mismo modulo y mismas
+    // reglas que plan/start, para que las tres no puedan divergir.
+    const asignadoA = parseAsignadoAFlag(argv, (m) => new BoardCommandError(m));
+    if (asignadoA !== undefined) {
+        filters.asignadoA = asignadoA;
+    }
+    return filters;
+}
+export async function runBoardCommand(tareasRoot, argv, deps = {}) {
+    const filters = parseBoardArgs(argv);
+    const escribir = parseEscribirFlag(argv);
+    // docs/BOARD.md es el tablero COMPLETO del repo (es lo que regenera
+    // taskctl finish). Escribirlo con filtros dejaria un fichero parcial
+    // que parece el tablero entero: se rechaza en vez de generar algo
+    // enganoso.
+    if (escribir && (filters.sprint !== undefined || filters.asignadoA !== undefined)) {
+        throw new BoardCommandError('--escribir no se puede combinar con --sprint ni --asignado-a: docs/BOARD.md es el ' +
+            'tablero completo del repo. Ejecuta "taskctl board --escribir" sin filtros, o quita ' +
+            '--escribir para ver el listado filtrado por pantalla.'
+        // (--asignado_a, con guion bajo, es el mismo filtro: ver
+        // parseBoardArgs.)
+        );
+    }
+    if (escribir && (deps.repoCwd === undefined || deps.today === undefined)) {
+        throw new BoardCommandError('--escribir necesita saber la raiz del repo y la fecha; invocalo desde el CLI.');
+    }
+    // Sin esto (hallazgo IMPORTANTE de revision por pares, B5), ejecutar
+    // "board --escribir" desde una subcarpeta o desde un directorio que
+    // no es un repo de TaskCode creaba un docs/BOARD.md fantasma con solo
+    // la cabecera — un tablero aparentemente vacio pero legitimo, y
+    // basura que luego dispara el guard de la seccion 8.3.
+    if (escribir) {
+        try {
+            await stat(tareasRoot);
+        }
+        catch (e) {
+            if (!isEnoent(e))
+                throw e;
+            throw new BoardCommandError(`No existe "${tareasRoot}", asi que esto no parece la raiz de un repo con tareas. ` +
+                'Ejecuta "taskctl board --escribir" desde la raiz del repo (donde esta la carpeta ' +
+                '"tareas"), no desde una subcarpeta.');
+        }
+    }
+    const rawIds = await listExistingTaskIds(tareasRoot);
+    const tasks = [];
+    const advertencias = [];
+    // listExistingTaskIds devuelve un ID una vez POR CARPETA de estado
+    // en la que aparece: si el mismo ID existe a la vez en dos carpetas
+    // (inconsistencia de datos -- p. ej. un merge de Git-Flow que dejo
+    // la carpeta vieja sin borrar), el ID sale repetido en rawIds.
+    // Hallazgo IMPORTANTE de revision por pares: iterar rawIds tal cual
+    // mostraba esa tarea DOS VECES (siempre con el mismo contenido,
+    // porque readTareaFile ya devuelve solo la primera coincidencia
+    // segun el orden del ciclo de vida) y escondia en silencio la copia
+    // real mas avanzada, sin ningun aviso. Deduplicado aqui, con una
+    // advertencia explicita cuando se detecta la inconsistencia -- mismo
+    // tratamiento que una tarea.md invalida.
+    const idCounts = new Map();
+    for (const id of rawIds)
+        idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
+    await Promise.all([...idCounts.keys()].map(async (id) => {
+        const count = idCounts.get(id) ?? 1;
+        if (count > 1) {
+            advertencias.push(`${id} existe en ${count} carpetas de estado distintas a la vez (inconsistencia de ` +
+                'datos); se muestra la copia de la carpeta mas temprana del ciclo de vida -- revisa ' +
+                'el repo a mano.');
+        }
+        try {
+            const read = await readTareaFile(tareasRoot, id);
+            if (read)
+                tasks.push(read.task);
+        }
+        catch (e) {
+            if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
+                const msg = e instanceof Error ? e.message : String(e);
+                advertencias.push(`${id} tiene un tarea.md invalido y no aparece en el board: ${msg}`);
+                return;
+            }
+            throw e;
+        }
+    }));
+    // Orden estable de los avisos (hallazgo IMPORTANTE de revision por
+    // pares, B5): se acumulan dentro del Promise.all, asi que su orden
+    // dependia de cuando terminaba cada lectura de disco. Mientras solo
+    // salian por pantalla era cosmetico; desde que acaban DENTRO de
+    // docs/BOARD.md, un fichero versionado, hacian que dos ejecuciones
+    // seguidas con la misma entrada produjeran ficheros distintos.
+    advertencias.sort();
+    const filtered = filterTasks(tasks, filters);
+    const output = formatBoard(filtered);
+    let boardPath = null;
+    if (escribir) {
+        boardPath = boardFilePath(deps.repoCwd);
+        try {
+            await mkdir(path.dirname(boardPath), { recursive: true });
+            await writeFile(boardPath, renderBoardMarkdown(output, advertencias, deps.today, 'taskctl board --escribir'), 'utf8');
+        }
+        catch (e) {
+            // Sin esto, un EPERM/EEXIST de disco escapaba del catch del CLI y
+            // salia como "taskctl no pudo arrancar" (hallazgo MENOR de
+            // revision por pares, B5), que es falso y despista.
+            const msg = e instanceof Error ? e.message : String(e);
+            throw new BoardCommandError(`No se pudo escribir ${boardPath}: ${msg}. Comprueba permisos y que "docs" sea una ` +
+                'carpeta; el listado por pantalla de arriba si es correcto.');
+        }
+    }
+    return { output, totalTareas: filtered.length, advertencias, boardPath };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js
new file mode 100644
index 0000000..3ef45d8
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js
@@ -0,0 +1,370 @@
+/**
+ * taskctl finish — TASK-014 de PLAN_SPRINTS.md. Cierra el ciclo de
+ * vida de una tarea: exige revision aprobada (fuente determinista: la
+ * linea "Veredicto:" del ultimo informe de revision), mergea la rama
+ * con el script Git-Flow del tipo (tag + backmerge para
+ * hotfix/release), verifica con evidencia Git que los merges
+ * ocurrieron, detecta la colision de IDs entre main y develop ANTES de
+ * mergear (riesgo documentado en TASK-012), mueve la carpeta a
+ * 04-terminadas/ y renderiza CHANGELOG.md, docs/INDEX.md y
+ * docs/BOARD.md desde el frontmatter — plantillas deterministas, cero
+ * LLM (correccion de la seccion 16 de la metodologia).
+ *
+ * Desde TASK-030 (item C2) tambien cumple el paso 5 de la seccion 8.3:
+ * commitea lo que acaba de escribir — la carpeta de la tarea y los tres
+ * artefactos de cierre, y nada mas — sobre develop, que es donde
+ * termina el comando. Con --push sube ademas la rama.
+ *
+ */
+import path from 'node:path';
+import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
+import { parseTareaFile } from '../core/tarea-file.js';
+import { FrontmatterParseError } from '../core/frontmatter.js';
+import { TaskValidationError } from '../core/task.js';
+import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import { isWorkspaceClean, currentBranch, isAncestor, resolveMainBranch, lsTreeNames, showFileAtRef, mergeBase, checkoutBranch, } from '../fs/git.js';
+import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
+import { runGitflowScript } from '../fs/gitflow-runner.js';
+import { runBoardCommand, boardFilePath } from './board.js';
+import { renderBoardMarkdown } from '../core/board-format.js';
+import { REVISION_DIRNAME } from './review.js';
+export class FinishCommandError extends Error {
+}
+const SCRIPT_BY_TYPE = {
+    feature: 'merge-feature-to-develop.sh',
+    fix: 'merge-fix-to-develop.sh',
+    hotfix: 'merge-hotfix-to-main.sh',
+    release: 'merge-release-to-main.sh',
+};
+/** hotfix/release mergean a main (con tag) y backmergean a develop. */
+const MERGEA_A_MAIN = {
+    feature: false,
+    fix: false,
+    hotfix: true,
+    release: true,
+};
+const DEVELOP_BRANCH = 'develop';
+const INFORME_REVISION_RE = /^informe-revision-(\d+)\.md$/;
+const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
+/**
+ * true solo si TODAS las lineas "- Veredicto:" del informe aprueban.
+ * Fail-closed de verdad (hallazgo CRITICO de revision por pares,
+ * TASK-014: la version anterior buscaba la palabra "aprobada" en
+ * cualquier parte y aprobaba literalmente "no aprobada"):
+ * - el VALOR del veredicto debe EMPEZAR por "aprobada" — una negacion
+ *   delante ("no aprobada", "rechazada: aprobada seria...") no pasa;
+ * - "pendiente" (con limites de palabra: "independiente" no cuenta) o
+ *   "cambios-solicitados" en el valor lo tumban;
+ * - si hay varias lineas Veredicto (p. ej. el placeholder de la
+ *   plantilla sin borrar), TODAS deben aprobar;
+ * - sin linea de veredicto (o sin informe), NO esta aprobada.
+ */
+export function veredictoAprobado(informe) {
+    const prefijo = '- veredicto:';
+    const lineas = informe
+        .split('\n')
+        .filter((l) => l.trim().toLowerCase().startsWith(prefijo));
+    if (lineas.length === 0)
+        return false;
+    return lineas.every((linea) => {
+        const valor = linea.trim().slice(prefijo.length).trim().toLowerCase();
+        if (/\bpendiente\b/.test(valor) || valor.includes('cambios-solicitados'))
+            return false;
+        return /^aprobada\b/.test(valor);
+    });
+}
+/** Contenido del informe con mayor N segun `re`, o null si no hay. */
+async function ultimoInforme(revisionDir, re) {
+    let entries;
+    try {
+        entries = await readdir(revisionDir);
+    }
+    catch (e) {
+        if (isEnoent(e))
+            return null;
+        throw e;
+    }
+    let max = 0;
+    let elegido = null;
+    for (const entry of entries) {
+        const m = re.exec(entry);
+        if (m !== null && Number(m[1]) > max) {
+            max = Number(m[1]);
+            elegido = entry;
+        }
+    }
+    if (elegido === null)
+        return null;
+    return readFile(path.join(revisionDir, elegido), 'utf8');
+}
+/**
+ * Contexto de aprobacion para la maquina de estados, derivado de los
+ * informes de revision/ de la carpeta de la tarea. La convencion del
+ * informe de Codex (informe-codex-<n>.md) la producira TASK-020; leerla
+ * ya aqui deja a finish preparado sin acoplarse a ese comando.
+ */
+async function buildTransitionContext(taskDir) {
+    const revisionDir = path.join(taskDir, REVISION_DIRNAME);
+    const informe = await ultimoInforme(revisionDir, INFORME_REVISION_RE);
+    const informeCodex = await ultimoInforme(revisionDir, INFORME_CODEX_RE);
+    return {
+        revisionPrimariaAprobada: informe !== null && veredictoAprobado(informe),
+        revisionCodexAprobada: informeCodex !== null && veredictoAprobado(informeCodex),
+    };
+}
+/**
+ * Colision de IDs (riesgo documentado en TASK-012): el mismo TASK-NNN
+ * puede existir en `ref` con dos formas de romper el merge:
+ *
+ * - OTRA tarea (titulo distinto) numerada igual en un linaje que no
+ *   comparte tareas/ (un hotfix numerado sobre main mientras develop ya
+ *   usaba ese ID): mergear mezclaria dos tareas bajo un numero.
+ * - La MISMA tarea (mismo titulo) pero anadida en `ref` por un commit
+ *   que NO es ancestro comun con la rama (hallazgo IMPORTANTE de
+ *   revision por pares, TASK-014): sin historia compartida el merge es
+ *   add+add, no un rename — las dos carpetas sobreviven y develop queda
+ *   con el ID duplicado en dos carpetas de estado a la vez.
+ *
+ * El caso normal (feature/fix cuya carpeta vive en `ref` en una carpeta
+ * de estado anterior) no dispara nada: ahi la copia de `ref` SI esta en
+ * el ancestro comun y Git resuelve el movimiento como rename.
+ */
+function detectarColisionId(id, titulo, rama, ref, cwd) {
+    const names = lsTreeNames(ref, 'tareas', cwd);
+    const match = names.find((n) => n.endsWith(`/${id}/tarea.md`));
+    if (match === undefined)
+        return null;
+    let tituloEnRef;
+    try {
+        tituloEnRef = parseTareaFile(showFileAtRef(ref, match, cwd)).task.titulo;
+    }
+    catch (e) {
+        if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
+            // Fail-closed: si el tarea.md de la otra rama ni se puede
+            // parsear, no se puede descartar la colision.
+            return { path: match, motivo: 'ilegible' };
+        }
+        throw e;
+    }
+    if (tituloEnRef !== titulo) {
+        return { path: match, motivo: 'titulo-distinto' };
+    }
+    const base = mergeBase(rama, ref, cwd);
+    const enBase = lsTreeNames(base, 'tareas', cwd).some((n) => n.endsWith(`/${id}/tarea.md`));
+    if (!enBase) {
+        return { path: match, motivo: 'linaje-divergente' };
+    }
+    return null;
+}
+function insertAfterHeader(content, header, entry) {
+    const idx = content.indexOf(header);
+    if (idx === -1) {
+        // Fichero preexistente sin la seccion: se inserta ARRIBA (tras la
+        // primera linea, normalmente el titulo), no al final — lo mas nuevo
+        // encabeza el documento (hallazgo MENOR de revision por pares,
+        // TASK-014: antes quedaba "Sin publicar" debajo de versiones viejas).
+        const nl = content.indexOf('\n');
+        if (nl === -1) {
+            return `${content}\n\n${header}\n\n${entry}\n`;
+        }
+        return `${content.slice(0, nl + 1)}\n${header}\n\n${entry}\n${content.slice(nl + 1)}`;
+    }
+    let pos = content.indexOf('\n', idx + header.length);
+    if (pos === -1)
+        return `${content}\n\n${entry}\n`;
+    pos += 1;
+    if (content[pos] === '\n')
+        pos += 1;
+    return `${content.slice(0, pos)}${entry}\n${content.slice(pos)}`;
+}
+export function changelogEntry(task, fecha) {
+    return `- ${task.id} (${task.tipo}) — ${task.titulo} (${fecha})`;
+}
+export function indexEntry(task, fecha) {
+    const etiquetas = task.etiquetas.length > 0 ? task.etiquetas.join(', ') : '(sin etiquetas)';
+    return (`- ${task.id} — ${task.titulo} · etiquetas: ${etiquetas} · rama ${task.rama} · ` +
+        `terminada ${fecha} · tareas/04-terminadas/${task.id}/`);
+}
+const CHANGELOG_HEADER = '## Sin publicar';
+const CHANGELOG_INICIAL = '# Changelog\n\n' +
+    'Registro de tareas terminadas. Lo actualiza taskctl finish; una linea\n' +
+    'por tarea, renderizada desde su frontmatter.\n\n' +
+    `${CHANGELOG_HEADER}\n\n`;
+const INDEX_HEADER = '## Tareas terminadas';
+const INDEX_INICIAL = '# Indice de tareas terminadas\n\n' +
+    'Indice determinista para la recuperacion de contexto por etiquetas\n' +
+    '(seccion 6.1 de la metodologia). Lo actualiza taskctl finish.\n\n' +
+    `${INDEX_HEADER}\n\n`;
+async function appendEntry(filePath, inicial, header, entry) {
+    let content;
+    try {
+        content = await readFile(filePath, 'utf8');
+    }
+    catch (e) {
+        if (!isEnoent(e))
+            throw e;
+        content = inicial;
+    }
+    await writeFile(filePath, insertAfterHeader(content, header, entry), 'utf8');
+}
+export async function runFinishCommand(tareasRoot, argv, today, deps) {
+    const { push, resto } = extraerPushFlag(argv);
+    const id = resto[0];
+    if (id === undefined || id.trim() === '') {
+        throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
+    }
+    // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): rechazo
+    // rapido sin tocar Git + metadata estable (tipo/rama/titulo). La
+    // lectura que decide la escritura va DESPUES de los merges.
+    const initial = await readTareaFile(tareasRoot, id);
+    // Mensaje propio para "no esta en este working tree" (hallazgo MENOR
+    // de revision por pares, TASK-014): el generico de la maquina de
+    // estados aconseja crear la tarea con import/new, que aqui es lo
+    // contrario de lo util — lo normal es estar en develop y que la
+    // tarea viva en su rama.
+    if (initial === null) {
+        throw new FinishCommandError(`[ERROR] ${id}: no se encuentra en el working tree de la rama actual. ` +
+            'Si la tarea existe en su propia rama, cambiate a esa rama antes de "taskctl finish".');
+    }
+    const ctxInicial = await buildTransitionContext(path.dirname(initial.filePath));
+    assertTransitionAllowed('finish', initial.task, ctxInicial);
+    const tipo = initial.task.tipo;
+    const rama = initial.task.rama;
+    const titulo = initial.task.titulo;
+    if (!isWorkspaceClean(deps.repoCwd)) {
+        throw new FinishCommandError(`[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
+            'Haz commit o stash antes de "taskctl finish" — los merges de Git-Flow necesitan el ' +
+            'workspace limpio y su prompt interactivo cancela en silencio sin terminal.');
+    }
+    // Colision de IDs ANTES de mergear (criterio 4): se comprueba contra
+    // cada rama destino del merge. Para feature/fix solo develop; para
+    // hotfix/release tambien la principal.
+    const mainBranch = MERGEA_A_MAIN[tipo] ? resolveMainBranch(deps.repoCwd) : null;
+    const destinos = mainBranch === null ? [DEVELOP_BRANCH] : [mainBranch, DEVELOP_BRANCH];
+    for (const destino of destinos) {
+        const colision = detectarColisionId(id, titulo, rama, destino, deps.repoCwd);
+        if (colision !== null) {
+            const detalle = colision.motivo === 'titulo-distinto'
+                ? `con OTRO titulo distinto de "${titulo}": mergear mezclaria dos tareas bajo el mismo numero. ` +
+                    'Renumera una de las dos (carpeta, frontmatter y rama)'
+                : colision.motivo === 'linaje-divergente'
+                    ? 'anadido por un linaje SIN ancestro comun con la rama de la tarea: el merge seria ' +
+                        'add+add (no un rename) y dejaria el ID duplicado en dos carpetas de estado a la vez. ' +
+                        'Elimina o sincroniza a mano una de las dos copias'
+                    : 'con un tarea.md que no se puede parsear, asi que la colision no se puede descartar. ' +
+                        'Arregla ese fichero';
+            throw new FinishCommandError(`[ERROR] ${id}: colision de IDs — "${destino}" ya contiene ${colision.path} ${detalle} ` +
+                'antes de reintentar; no se ha tocado nada.');
+        }
+    }
+    const scriptName = SCRIPT_BY_TYPE[tipo];
+    const integradaEnDevelop = isAncestor(rama, DEVELOP_BRANCH, deps.repoCwd);
+    const integradaEnMain = mainBranch === null || isAncestor(rama, mainBranch, deps.repoCwd);
+    if (integradaEnDevelop && integradaEnMain) {
+        // Camino idempotente (hallazgo IMPORTANTE de revision por pares,
+        // TASK-014): los merges ya estan consumados — p. ej. un reintento
+        // tras resolver a mano un conflicto de backmerge. Reejecutar el
+        // script moriria en el tag ya creado (hotfix/release); aqui solo
+        // queda cerrar: ponerse en develop y mover/renderizar.
+        if (currentBranch(deps.repoCwd) !== DEVELOP_BRANCH) {
+            checkoutBranch(DEVELOP_BRANCH, deps.repoCwd);
+        }
+    }
+    else if (mainBranch !== null && integradaEnMain && !integradaEnDevelop) {
+        // Estado a medias: merge a main (y su tag) consumados, backmerge
+        // pendiente. Reejecutar el script chocaria con el tag duplicado.
+        throw new FinishCommandError(`[ERROR] ${id}: el merge a "${mainBranch}" (con su tag) ya esta consumado pero falta ` +
+            `el backmerge a "${DEVELOP_BRANCH}". No se reejecuta ${scriptName} (moriria en el tag ` +
+            `duplicado): completa el backmerge a mano — git checkout ${DEVELOP_BRANCH} && ` +
+            `git merge --no-ff ${rama} — y reintenta taskctl finish.`);
+    }
+    else {
+        const { code, signal } = runGitflowScript(scriptName, [rama], {
+            scriptsDir: deps.scriptsDir,
+            cwd: deps.repoCwd,
+        });
+        if (code !== 0) {
+            const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
+            throw new FinishCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
+                'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo antes de ' +
+                'reintentar); la tarea no se ha movido de carpeta.');
+        }
+        // Evidencia, no suposicion (TASK-007/009): los cuatro scripts
+        // terminan en develop, con la rama de la tarea integrada; para
+        // hotfix/release ademas integrada en la principal. Un backmerge
+        // cancelado sale del script con exit 0 ("PARCIAL") — lo detecta la
+        // ancestria, no el exit code.
+        const branchNow = currentBranch(deps.repoCwd);
+        if (branchNow !== DEVELOP_BRANCH) {
+            throw new FinishCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
+                `"${branchNow}", no "${DEVELOP_BRANCH}". No se actualiza la tarea; revisa el repo a mano.`);
+        }
+        if (!isAncestor(rama, 'HEAD', deps.repoCwd)) {
+            throw new FinishCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
+                `en "${DEVELOP_BRANCH}" (merge-base --is-ancestor lo niega). ¿Backmerge cancelado o ` +
+                'merge a medias? No se actualiza la tarea; revisa el repo a mano.');
+        }
+        if (mainBranch !== null && !isAncestor(rama, mainBranch, deps.repoCwd)) {
+            throw new FinishCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
+                `en "${mainBranch}" (merge-base --is-ancestor lo niega). No se actualiza la tarea; ` +
+                'revisa el repo a mano.');
+        }
+    }
+    // Lectura FRESCA, ya en develop con el merge consumado: la unica que
+    // decide la escritura. El contexto de aprobacion se recalcula sobre
+    // la carpeta que el merge dejo en develop.
+    const existing = await readTareaFile(tareasRoot, id);
+    const ctx = existing === null ? {} : await buildTransitionContext(path.dirname(existing.filePath));
+    assertTransitionAllowed('finish', existing ? existing.task : null, ctx);
+    const { task, body, filePath } = existing;
+    const updated = { ...task, estado: 'terminada', actualizado: today };
+    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+    // Renderizado de cierre (criterio 3): plantillas desde el
+    // frontmatter. BOARD.md se regenera entero reutilizando el mismo
+    // render de "taskctl board" — la direccion que la tabla de la
+    // seccion 8 da por hecha; B5 decidira si el comando board tambien
+    // lo escribe.
+    const changelogPath = path.join(deps.repoCwd, 'CHANGELOG.md');
+    const docsDir = path.join(deps.repoCwd, 'docs');
+    await mkdir(docsDir, { recursive: true });
+    const indexPath = path.join(docsDir, 'INDEX.md');
+    // Misma ruta que usa "taskctl board --escribir" (item B5).
+    const boardPath = boardFilePath(deps.repoCwd);
+    await appendEntry(changelogPath, CHANGELOG_INICIAL, CHANGELOG_HEADER, changelogEntry(updated, today));
+    await appendEntry(indexPath, INDEX_INICIAL, INDEX_HEADER, indexEntry(updated, today));
+    const board = await runBoardCommand(tareasRoot, []);
+    await writeFile(boardPath, renderBoardMarkdown(board.output, board.advertencias, today, 'taskctl finish'), 'utf8');
+    // Paso 5 de la 8.3 (TASK-030, item C2). "finish" commitea sobre
+    // DEVELOP, no sobre la rama de la tarea: cuando llega aqui el merge
+    // ya esta consumado y el comando termina siempre en develop (se
+    // comprueba mas arriba). Es lo que se venia haciendo a mano; queda
+    // fijado con un test para que nadie lo "arregle" mas adelante.
+    // Ademas de las dos carpetas de la tarea entran los tres artefactos
+    // de cierre — y NADA mas: "finish" tampoco aplica
+    // ensureBaseBranchReady, asi que el resto del arbol puede tener
+    // trabajo de la persona.
+    const commitResult = autoCommit({
+        cwd: deps.repoCwd,
+        rutas: [
+            path.dirname(filePath),
+            path.dirname(newFilePath),
+            changelogPath,
+            indexPath,
+            boardPath,
+        ],
+        mensaje: mensajeChore(task.id, 'tarea terminada y artefactos de cierre'),
+        push,
+    });
+    return {
+        id: task.id,
+        rama,
+        baseBranch: DEVELOP_BRANCH,
+        mainBranch,
+        filePath: newFilePath,
+        changelogPath,
+        indexPath,
+        boardPath,
+        autoCommit: commitResult,
+    };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js
new file mode 100644
index 0000000..f306e0a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js
@@ -0,0 +1,243 @@
+/**
+ * taskctl import — alta masiva de tareas desde un fichero Markdown
+ * (TASK-004 de PLAN_SPRINTS.md). Reutiliza el parser puro de
+ * src/core/import-parser.ts y, por cada entrada valida, construye la
+ * tarea con `buildNewTask` (el mismo constructor que usa `taskctl
+ * new`, TASK-003/TASK-012) para no duplicar la logica de slug/rama.
+ *
+ * Aplica la precondicion de la seccion 8.3 (TASK-012) igual que
+ * `taskctl new`: import solo CREA tareas, nunca las modifica, asi que
+ * — igual que new.ts documenta — no hace falta el patron de "doble
+ * lectura" de plan.ts/approve.ts: toda lectura de tareas/ existentes
+ * ocurre DESPUES de ensureBaseBranchReady, ya en la rama base real.
+ *
+ * Nota (hallazgo IMPORTANTE de revision por pares): el fichero a
+ * importar se lee ANTES de ensureBaseBranchReady, no despues. A
+ * diferencia de "new" (que no depende de ningun fichero externo que
+ * pueda no existir), "import" si tiene un argumento que puede fallar
+ * — y si esa comprobacion corriera despues de la precondicion, un
+ * "taskctl import fichero-que-no-existe.md" desde una rama de feature
+ * limpia cambiaria de rama igualmente (porque el workspace SI esta
+ * limpio) y luego fallaria, dejando a la persona en la rama base sin
+ * avisarle del cambio (el aviso solo se imprime en el camino de
+ * exito). Leer el fichero primero no incumple "no toca nada antes de
+ * la precondicion" — esa garantia es sobre tareas/ y Git, no sobre
+ * validar los argumentos de entrada.
+ */
+import { readFile } from 'node:fs/promises';
+import path from 'node:path';
+import { parseArgs } from '../cli/args.js';
+import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
+import { ensureBaseBranchReady } from '../fs/git.js';
+import { TASK_TYPES, TASK_COMPLEXITIES, TaskValidationError } from '../core/task.js';
+import { FrontmatterParseError } from '../core/frontmatter.js';
+import { nextTaskId } from '../core/task-id.js';
+import { listExistingTaskIds, readTareaFile, writeTareaFile, TaskAlreadyExistsError, } from '../fs/task-store.js';
+import { parseImportMarkdown } from '../core/import-parser.js';
+import { slugify, buildNewTask, SLUG_FALLBACK } from './new.js';
+import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
+export class ImportCommandError extends Error {
+}
+const DEFAULT_SPRINT = 0;
+const DEFAULT_COMPLEJIDAD = 'media';
+const DEFAULT_MODELO = 'sonnet';
+/**
+ * Un unico --tipo/--sprint/--complejidad para todo el fichero (no hay
+ * sintaxis por entrada): mismo enfoque deliberadamente simple que el
+ * resto de Sprint 0 — "taskctl import docs/sprint-N-propuesta.md"
+ * importa un lote homogeneo (un sprint, un tipo de trabajo).
+ *
+ * `agenteRevisorPorDefecto` (TASK-030, item C4): hasta C4 este fichero
+ * tenia su propia constante DEFAULT_AGENTE_REVISOR = 'general-purpose',
+ * copia literal de la de new.ts. Dos copias del mismo default en dos
+ * comandos que crean la misma clase de tarea es precisamente lo que la
+ * decision #9 mandaba eliminar. La unica fuente es ahora
+ * CONFIG_DEFAULTS, y el valor efectivo lo decide
+ * `.taskcode/config.yml`.
+ */
+export function parseImportArgs(argv, agenteRevisorPorDefecto = CONFIG_DEFAULTS.agente_revisor_por_defecto) {
+    const { positional, flags } = parseArgs(argv);
+    const filePath = positional[0];
+    if (!filePath || filePath.trim() === '') {
+        throw new ImportCommandError('Falta la ruta del fichero Markdown a importar (primer argumento posicional).');
+    }
+    let tipo = 'feature';
+    const tipoRaw = flags['tipo'];
+    if (tipoRaw !== undefined) {
+        if (typeof tipoRaw !== 'string' || !TASK_TYPES.includes(tipoRaw)) {
+            throw new ImportCommandError(`--tipo "${String(tipoRaw)}" invalido. Debe ser uno de: ${TASK_TYPES.join(', ')}.`);
+        }
+        tipo = tipoRaw;
+    }
+    let complejidad = DEFAULT_COMPLEJIDAD;
+    const complejidadRaw = flags['complejidad'];
+    if (complejidadRaw !== undefined) {
+        if (typeof complejidadRaw !== 'string' ||
+            !TASK_COMPLEXITIES.includes(complejidadRaw)) {
+            throw new ImportCommandError(`--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`);
+        }
+        complejidad = complejidadRaw;
+    }
+    let sprint = DEFAULT_SPRINT;
+    const sprintRaw = flags['sprint'];
+    if (sprintRaw !== undefined) {
+        if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
+            throw new ImportCommandError('--sprint debe ser un numero entero no negativo.');
+        }
+        sprint = parseInt(sprintRaw, 10);
+    }
+    const modeloSugerido = typeof flags['modelo-sugerido'] === 'string' ? flags['modelo-sugerido'] : DEFAULT_MODELO;
+    const agenteRevisor = typeof flags['agente-revisor'] === 'string'
+        ? flags['agente-revisor']
+        : agenteRevisorPorDefecto;
+    return { filePath, tipo, sprint, complejidad, modeloSugerido, agenteRevisor };
+}
+/**
+ * Clave de idempotencia por "titulo normalizado" (hallazgo CRITICO de
+ * revision por pares): slugify() colapsa CUALQUIER titulo sin ningun
+ * caracter ASCII alfanumerico al mismo literal SLUG_FALLBACK
+ * ("tarea") — pensado para nombrar la rama de una tarea aislada
+ * (taskctl new), donde es inofensivo. Reutilizado tal cual como clave
+ * de deteccion de duplicados en un import de VARIAS tareas, dos
+ * titulos completamente distintos que caen en el fallback (p. ej.
+ * "日本語のタスク" y "!!!???") colisionaban en silencio: la segunda
+ * se descartaba como si ya existiera, sin ningun aviso real, violando
+ * el criterio de aceptacion "5 tareas bien formadas -> 5 ficheros".
+ * Fuera del caso fallback, el comportamiento no cambia: sigue usando
+ * el slug tal cual (misma insensibilidad a mayusculas/acentos que ya
+ * prueban los tests de idempotencia).
+ */
+export function normalizedTitleKey(titulo) {
+    const slug = slugify(titulo);
+    if (slug !== SLUG_FALLBACK)
+        return slug;
+    return `${SLUG_FALLBACK}:${titulo.trim().toLowerCase()}`;
+}
+export async function runImportCommand(tareasRoot, argv, today, deps) {
+    // Igual que en new.ts (TASK-030, item C4): el config se resuelve lo
+    // primero, para que un `.taskcode/config.yml` roto aborte antes de
+    // leer el fichero a importar y antes de cualquier cambio de rama.
+    const config = resolverConfig(deps.repoCwd);
+    // --push fuera de parseArgs, mismo motivo que en new.ts: ese parser
+    // trata "--flag valor" como par y se comeria la ruta del fichero.
+    const { push, resto } = extraerPushFlag(argv);
+    const opts = parseImportArgs(resto, config.agente_revisor_por_defecto);
+    let content;
+    try {
+        content = await readFile(opts.filePath, 'utf8');
+    }
+    catch (e) {
+        const msg = e instanceof Error ? e.message : String(e);
+        throw new ImportCommandError(`No se pudo leer "${opts.filePath}": ${msg}`);
+    }
+    // Solo AHORA, con el fichero ya leido con exito, se aplica la
+    // precondicion de rama base — ver nota de cabecera del fichero.
+    const baseBranchGuard = ensureBaseBranchReady(opts.tipo, deps.repoCwd);
+    const parsed = parseImportMarkdown(content);
+    const errores = [];
+    const omitidas = [];
+    const creadas = [];
+    const advertencias = [];
+    let existingIds = await listExistingTaskIds(tareasRoot);
+    const usedSlugs = new Set();
+    // Lectura en paralelo (hallazgo MENOR de revision por pares,
+    // corregido de paso): cada tarea existente se lee de forma
+    // independiente, sin esperar a la anterior. Una tarea.md corrupta
+    // (hallazgo IMPORTANTE de revision por pares) ya NO bloquea el
+    // import entero: se reporta como advertencia y esa tarea
+    // simplemente no participa en la deteccion de duplicados.
+    await Promise.all(existingIds.map(async (id) => {
+        try {
+            const existing = await readTareaFile(tareasRoot, id);
+            if (existing)
+                usedSlugs.add(normalizedTitleKey(existing.task.titulo));
+        }
+        catch (e) {
+            if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
+                const msg = e instanceof Error ? e.message : String(e);
+                advertencias.push(`${id} tiene un tarea.md invalido y no se pudo leer (no participa en la deteccion ` +
+                    `de duplicados de este import): ${msg}`);
+                return;
+            }
+            throw e;
+        }
+    }));
+    for (const entry of parsed) {
+        if (!entry.ok) {
+            errores.push({ tituloRaw: entry.tituloRaw, motivo: entry.motivo, lineNumber: entry.lineNumber });
+            continue;
+        }
+        const key = normalizedTitleKey(entry.titulo);
+        if (usedSlugs.has(key)) {
+            omitidas.push({
+                titulo: entry.titulo,
+                motivo: `ya existe una tarea con el titulo normalizado "${slugify(entry.titulo)}"; no se sobreescribe.`,
+            });
+            continue;
+        }
+        const id = nextTaskId(existingIds);
+        const body = `## Objetivo\n\n\n## Criterios de aceptacion\n${entry.criterios
+            .map((c) => `- [ ] ${c}`)
+            .join('\n')}\n`;
+        const task = buildNewTask(id, {
+            titulo: entry.titulo,
+            tipo: opts.tipo,
+            sprint: opts.sprint,
+            etiquetas: [],
+            complejidad: opts.complejidad,
+            modeloSugerido: opts.modeloSugerido,
+            agenteRevisor: opts.agenteRevisor,
+        }, today);
+        let filePath;
+        try {
+            filePath = await writeTareaFile(tareasRoot, task, body, { failIfExists: true });
+        }
+        catch (e) {
+            // Hallazgo IMPORTANTE de revision por pares: si otra ejecucion
+            // concurrente ("taskctl new"/"taskctl import" en paralelo) crea
+            // ese mismo ID entre listExistingTaskIds() y este write, antes
+            // esto escapaba sin capturar y perdia el resumen entero de la
+            // pasada (incluidas las tareas ya escritas con exito antes en
+            // el mismo bucle). Ahora se reporta como error de ESTA entrada
+            // y el import sigue con las demas — igual que una entrada
+            // malformada — resincronizando el listado de IDs para no volver
+            // a calcular el mismo ID ya ocupado en la siguiente vuelta.
+            if (e instanceof TaskAlreadyExistsError) {
+                errores.push({
+                    tituloRaw: entry.titulo,
+                    lineNumber: entry.lineNumber,
+                    motivo: `no se pudo crear como ${id}: ${e.message} Puede haberse creado por otra ejecucion ` +
+                        'concurrente de "taskctl new"/"taskctl import"; las tareas ya creadas en esta misma ' +
+                        'pasada se conservan. Vuelve a intentar el import para esta entrada.',
+                });
+                existingIds = await listExistingTaskIds(tareasRoot);
+                continue;
+            }
+            throw e;
+        }
+        creadas.push({ id, titulo: entry.titulo, filePath });
+        existingIds = [...existingIds, id];
+        usedSlugs.add(key);
+    }
+    // Auto-commit (TASK-030, item C2). Aqui esta la razon original del
+    // item: sin commitear, "import" no se podia ejecutar dos veces
+    // seguidas — las carpetas que creaba la primera vez dejaban el
+    // workspace sucio y el guard de la §8.3 abortaba la segunda
+    // (HALLAZGOS.md). Se commitean solo las carpetas creadas en ESTA
+    // pasada; si no se creo ninguna (todo omitido o con error), no hay
+    // nada que commitear y no se crea un commit vacio.
+    const autoCommitResult = autoCommit({
+        cwd: deps.repoCwd,
+        rutas: creadas.map((c) => path.dirname(c.filePath)),
+        mensaje: mensajeChore('taskctl', `import de ${creadas.length} tarea(s): ${creadas.map((c) => c.id).join(', ')}`),
+        push,
+    });
+    return {
+        baseBranchGuard,
+        autoCommit: autoCommitResult,
+        creadas,
+        omitidas,
+        errores,
+        advertencias,
+    };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js
new file mode 100644
index 0000000..f7ff617
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js
@@ -0,0 +1,160 @@
+/**
+ * taskctl new — alta individual de una tarea (TASK-003 de
+ * PLAN_SPRINTS.md). Separa a proposito el parseo/validacion de
+ * argumentos (puro, testeable sin disco) de la escritura real
+ * (src/fs/task-store.ts).
+ *
+ * Desde TASK-012 aplica la precondicion de la seccion 8.3 antes de
+ * tocar cualquier fichero (ni siquiera antes de calcular el siguiente
+ * ID): ensureBaseBranchReady aborta si el workspace tiene cambios sin
+ * commitear, o cambia automaticamente a la rama base esperada segun
+ * --tipo si el workspace esta limpio pero no esta ya ahi.
+ */
+import path from 'node:path';
+import { parseArgs } from '../cli/args.js';
+import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
+import { ensureBaseBranchReady } from '../fs/git.js';
+import { TASK_TYPES, TASK_COMPLEXITIES, } from '../core/task.js';
+import { nextTaskId } from '../core/task-id.js';
+import { listExistingTaskIds, writeTareaFile } from '../fs/task-store.js';
+import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
+export class NewTaskArgError extends Error {
+}
+const DEFAULT_SPRINT = 0;
+const DEFAULT_COMPLEJIDAD = 'media';
+const DEFAULT_MODELO = 'sonnet';
+export const DEFAULT_BODY = '## Objetivo\n\n\n## Criterios de aceptacion\n- [ ] \n';
+/**
+ * `agenteRevisorPorDefecto` (TASK-030, item C4) es lo que se usa
+ * cuando no se pasa --agente-revisor. Antes de C4 era una constante
+ * DUPLICADA aqui y en import.ts; ahora la unica fuente es
+ * CONFIG_DEFAULTS y el valor efectivo lo decide
+ * `.taskcode/config.yml` (clave `agente_revisor_por_defecto`).
+ *
+ * Es un parametro y no una lectura del fichero aqui dentro porque esta
+ * funcion es pura y testeable sin disco (esa separacion es el motivo
+ * de que exista). Quien resuelve el config es runNewCommand, que ya
+ * tiene el cwd del repo. El default del parametro conserva el
+ * comportamiento de las llamadas de un solo argumento.
+ */
+export function parseNewTaskArgs(argv, agenteRevisorPorDefecto = CONFIG_DEFAULTS.agente_revisor_por_defecto) {
+    const { positional, flags } = parseArgs(argv);
+    const tituloFlag = flags['titulo'];
+    const titulo = typeof tituloFlag === 'string' ? tituloFlag : positional[0];
+    if (!titulo || titulo.trim() === '') {
+        throw new NewTaskArgError('Falta el titulo: usa --titulo "<texto>" o pasalo como primer argumento.');
+    }
+    const tipoRaw = flags['tipo'];
+    if (typeof tipoRaw !== 'string') {
+        throw new NewTaskArgError(`Falta --tipo (uno de: ${TASK_TYPES.join(', ')}).`);
+    }
+    if (!TASK_TYPES.includes(tipoRaw)) {
+        throw new NewTaskArgError(`--tipo "${tipoRaw}" invalido. Debe ser uno de: ${TASK_TYPES.join(', ')}.`);
+    }
+    let complejidad = DEFAULT_COMPLEJIDAD;
+    const complejidadRaw = flags['complejidad'];
+    if (complejidadRaw !== undefined) {
+        if (typeof complejidadRaw !== 'string' ||
+            !TASK_COMPLEXITIES.includes(complejidadRaw)) {
+            throw new NewTaskArgError(`--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`);
+        }
+        complejidad = complejidadRaw;
+    }
+    let sprint = DEFAULT_SPRINT;
+    const sprintRaw = flags['sprint'];
+    if (sprintRaw !== undefined) {
+        if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
+            throw new NewTaskArgError('--sprint debe ser un numero entero no negativo.');
+        }
+        sprint = parseInt(sprintRaw, 10);
+    }
+    const etiquetasRaw = flags['etiquetas'];
+    const etiquetas = typeof etiquetasRaw === 'string' && etiquetasRaw.trim() !== ''
+        ? etiquetasRaw
+            .split(',')
+            .map((s) => s.trim())
+            .filter((s) => s.length > 0)
+        : [];
+    const modeloSugerido = typeof flags['modelo-sugerido'] === 'string'
+        ? flags['modelo-sugerido']
+        : DEFAULT_MODELO;
+    const agenteRevisor = typeof flags['agente-revisor'] === 'string'
+        ? flags['agente-revisor']
+        : agenteRevisorPorDefecto;
+    return { titulo, tipo: tipoRaw, sprint, etiquetas, complejidad, modeloSugerido, agenteRevisor };
+}
+/**
+ * Exportado (hallazgo CRITICO de revision por pares, TASK-004): "import"
+ * reutiliza slugify() para su clave de idempotencia y necesita saber
+ * cuando el resultado es este fallback generico, para no tratar dos
+ * titulos MUY distintos que colisionan en el (p. ej. "日本語のタスク" y
+ * "!!!???", ninguno con ASCII alfanumerico) como si fueran el mismo
+ * titulo. Ver normalizedTitleKey en src/commands/import.ts.
+ */
+export const SLUG_FALLBACK = 'tarea';
+export function slugify(titulo) {
+    const base = titulo
+        .toLowerCase()
+        .normalize('NFD')
+        .replace(/[\u0300-\u036f]/g, '')
+        .replace(/[^a-z0-9]+/g, '-')
+        .replace(/^-+|-+$/g, '');
+    const sliced = base.slice(0, 40).replace(/^-+|-+$/g, '');
+    return sliced.length > 0 ? sliced : SLUG_FALLBACK;
+}
+export function buildNewTask(id, opts, today) {
+    const slug = slugify(opts.titulo);
+    return {
+        id,
+        titulo: opts.titulo,
+        tipo: opts.tipo,
+        sprint: opts.sprint,
+        etiquetas: opts.etiquetas,
+        complejidad: opts.complejidad,
+        modelo_sugerido: opts.modeloSugerido,
+        estado: 'planificada',
+        plan_aprobado: false,
+        rama: `${opts.tipo}/${id.toLowerCase()}-${slug}`,
+        asignado_a: null,
+        agente_revisor: opts.agenteRevisor,
+        skills_recomendados: [],
+        ultimo_commit_revisado: null,
+        revision_codex: false,
+        creado: today,
+        actualizado: today,
+        dependencias: [],
+    };
+}
+export async function runNewCommand(tareasRoot, argv, today, deps) {
+    // El config se resuelve ANTES de parsear los argumentos (TASK-030,
+    // item C4): si esta roto, se aborta sin haber tocado nada y sin
+    // haber cambiado de rama. Un `.taskcode/config.yml` invalido es un
+    // fallo del repo, no del comando, y enterarse de el despues de que
+    // ensureBaseBranchReady te haya movido de rama seria peor.
+    const config = resolverConfig(deps.repoCwd);
+    // --push se saca ANTES de parseArgs a proposito (hallazgo del frente
+    // C2): ese parser trata "--flag valor" como par, asi que
+    // "taskctl new --push \"Titulo\"" habria leido push="Titulo" y el
+    // titulo habria desaparecido.
+    const { push, resto } = extraerPushFlag(argv);
+    const opts = parseNewTaskArgs(resto, config.agente_revisor_por_defecto);
+    // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
+    // tiene cambios sin commitear, o si no puede cambiar de forma
+    // automatica a la rama base esperada segun opts.tipo — en ambos
+    // casos no se llega a leer ni escribir nada de tareas/.
+    const baseBranchGuard = ensureBaseBranchReady(opts.tipo, deps.repoCwd);
+    const existingIds = await listExistingTaskIds(tareasRoot);
+    const id = nextTaskId(existingIds);
+    const task = buildNewTask(id, opts, today);
+    const filePath = await writeTareaFile(tareasRoot, task, DEFAULT_BODY, { failIfExists: true });
+    // Auto-commit (TASK-030, item C2): se commitea la CARPETA de la tarea
+    // recien creada, no el arbol. La decision #14 fijo commitear si y
+    // subir solo con --push.
+    const autoCommitResult = autoCommit({
+        cwd: deps.repoCwd,
+        rutas: [path.dirname(filePath)],
+        mensaje: mensajeChore(id, 'tarea creada'),
+        push,
+    });
+    return { id, filePath, baseBranchGuard, autoCommit: autoCommitResult };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js
new file mode 100644
index 0000000..f2db3a6
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js
@@ -0,0 +1,285 @@
+/**
+ * taskctl plan — TASK-010 de PLAN_SPRINTS.md. Version MINIMA de la
+ * fase de diseno (seccion 6 de la metodologia): sin contexto
+ * determinista desde docs/INDEX.md, sin gatekeeper barato (Haiku), sin
+ * seleccion de skill (6.6), sin brainstorm multi-agente en paralelo —
+ * todo eso es Sprint 3 (TASK-016/017). Tampoco implementa la
+ * precondicion completa de rama base (seccion 8.3) SI la aplica desde
+ * TASK-012 (ensureBaseBranchReady, antes de mover nada) — lo que
+ * quedo pendiente para "taskctl start" en TASK-009 (seccion 8.3 no
+ * aplica a start, que ya cambia de rama como parte de su propio
+ * trabajo).
+ *
+ * Lo que SI hace: validar la transicion, mover la tarea a
+ * 01-en-diseno/, y dejar un scaffold de planificacion/plan-final.md
+ * (la subcarpeta es de TASK-027, item C3) listo para que
+ * un agente (o una persona, en uso interactivo real de Claude Code) lo
+ * redacte — el mismo patron que "taskctl new" ya usa con el cuerpo de
+ * tarea.md (Objetivo/Criterios en blanco para rellenar despues). El
+ * contenido real del plan NO lo genera este CLI: no hay orquestacion
+ * de agentes aqui todavia.
+ */
+import path from 'node:path';
+import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
+import { parseArgs } from '../cli/args.js';
+import { parseAsignadoAFlag, identidadUsable, PISTA_VACIO_ESCRITURA, } from '../cli/asignado.js';
+import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import { ensureBaseBranchReady, gitUserEmail } from '../fs/git.js';
+import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
+import { resolverAsignado } from '../core/wip.js';
+export class PlanCommandError extends Error {
+}
+export const PLAN_FINAL_FILENAME = 'plan-final.md';
+/**
+ * Subcarpeta de artefactos de diseno dentro de la carpeta de la tarea
+ * (TASK-027, item C3). La seccion 2 de la metodologia describe cada
+ * carpeta de tarea como `tarea.md` + `planificacion/` + `revision/`;
+ * `revision/` ya la crea "taskctl review" (REVISION_DIRNAME en
+ * review.ts) y esta es la otra mitad.
+ *
+ * Se crea BAJO DEMANDA, cuando hay algo que escribir dentro, no en
+ * "new"/"import": Git no versiona directorios vacios, asi que crearla
+ * al dar de alta la tarea no llegaria al repo sin un .gitkeep que
+ * nadie ha pedido, y de paso ensuciaria el workspace de quien solo
+ * queria dar de alta una tarea. Mismo criterio que ya sigue
+ * `revision/`.
+ */
+export const PLANIFICACION_DIRNAME = 'planificacion';
+/**
+ * isFile(), no "existe" a secas (hallazgo MENOR de revision por pares,
+ * TASK-027): un DIRECTORIO llamado plan-final.md no es un plan. Con un
+ * stat pelado, "plan" anunciaba "el plan se ha movido intacto" tras
+ * renombrar un directorio, y "approve" lo daba por bueno.
+ */
+async function existeFichero(p) {
+    try {
+        return (await stat(p)).isFile();
+    }
+    catch (e) {
+        // ENOTDIR ademas de ENOENT (hallazgo IMPORTANTE de revision por
+        // pares ronda 2, TASK-027): si "planificacion" lo ocupa un FICHERO,
+        // stat("planificacion/plan-final.md") contesta ENOTDIR en POSIX y
+        // ENOENT en Windows. Absorber solo ENOENT hacia que el fix del
+        // mkdir de la ronda 1 fuese un fix solo de Windows: en Linux el
+        // fallo ocurre ANTES, aqui, y salia crudo por "plan" y tambien por
+        // "approve" (que ni siquiera hace mkdir). Semanticamente ENOTDIR es
+        // lo mismo que ENOENT para esta pregunta: ahi no hay ningun
+        // fichero. Quien tenga que quejarse de la ruta ocupada es el mkdir
+        // de "plan", que ya lo hace con un mensaje accionable.
+        if (isEnoent(e) || isEnotdir(e))
+            return false;
+        throw e;
+    }
+}
+/**
+ * Dice donde esta el plan de una tarea, mirando las DOS ubicaciones
+ * posibles. Existe porque toda tarea planificada antes de TASK-027
+ * tiene su `plan-final.md` suelto en la raiz de la carpeta: si el
+ * codigo nuevo mirase solo la ruta canonica, "taskctl approve" diria
+ * "todavia no hay plan que aprobar" sobre una tarea que si lo tiene, y
+ * la dejaria bloqueada en la maquina de estados.
+ *
+ * Lo comparten "plan" (que migra el legado) y "approve" (que acepta
+ * cualquiera de las dos), para que no puedan divergir.
+ */
+export async function resolverPlanFinal(taskDir) {
+    const canonica = path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
+    const legada = path.join(taskDir, PLAN_FINAL_FILENAME);
+    return {
+        canonica,
+        legada,
+        canonicaExiste: await existeFichero(canonica),
+        legadaExiste: await existeFichero(legada),
+    };
+}
+export function planTemplate(task) {
+    return (`# Plan — ${task.id}: ${task.titulo}\n\n` +
+        '## Enfoque propuesto\n\n\n' +
+        '## Alternativas consideradas\n\n' +
+        '(Version minima de "taskctl plan", TASK-010: sin brainstorm multi-agente\n' +
+        'todavia. Un solo agente redacta este plan. TASK-016 anadira brainstorm\n' +
+        'en paralelo con roles distintos y un agente unificador para tareas de\n' +
+        'complejidad media o mayor.)\n\n' +
+        '## Riesgos o preguntas abiertas\n\n');
+}
+export async function runPlanCommand(tareasRoot, argv, today, deps) {
+    // El ID sale de los POSICIONALES, no de argv[0] a secas (item B6):
+    // con "--asignado-a" en juego, "taskctl plan --asignado-a carlos
+    // TASK-001" tiene que funcionar igual que con el flag detras. De
+    // paso, un "taskctl plan --loquesea" ya no se cuela como ID para
+    // morir mas abajo con un InvalidTaskIdError que cli.ts no captura.
+    // --push se saca del argv ANTES de parsear nada mas: es booleano
+    // puro y parseArgs, que trata "--flag valor" como par, se habria
+    // comido el ID en "taskctl plan --push TASK-030".
+    const { push, resto } = extraerPushFlag(argv);
+    const { positional } = parseArgs(resto);
+    const id = positional[0];
+    if (id === undefined || id.trim() === '') {
+        throw new PlanCommandError('[ERROR] Falta el ID de la tarea: taskctl plan TASK-NNN.');
+    }
+    // Se parsea ANTES de tocar Git: un flag mal escrito no debe llegar a
+    // cambiar de rama ni a mover carpetas antes de fallar.
+    const asignadoA = parseAsignadoAFlag(resto, (m) => new PlanCommandError(m), PISTA_VACIO_ESCRITURA);
+    // Lectura PRELIMINAR, contra la rama activa en este momento — que
+    // puede no ser la rama base real si alguien invoca "plan" desde una
+    // rama de feature vieja. Sirve solo para (a) rechazar rapido, sin
+    // tocar Git, un caso ya claramente invalido en esta rama, y (b)
+    // conocer task.tipo para poder resolver la rama base. NO se usa para
+    // nada mas: ni su "body"/"filePath" ni un "aprobado en esta lectura"
+    // se llevan a la escritura de mas abajo (hallazgo CRITICO de
+    // revision por pares, TASK-012 — antes de este fix, una lectura
+    // hecha en una rama vieja podia acabar escribiendose encima del
+    // contenido real de la rama base tras el cambio automatico, o
+    // disparar un TaskFolderConflictError falso comparando la carpeta
+    // vieja con la carpeta real de la rama base).
+    const initial = await readTareaFile(tareasRoot, id);
+    assertTransitionAllowed('plan', initial ? initial.task : null);
+    // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
+    // tiene cambios sin commitear, o si no puede cambiar de forma
+    // automatica a la rama base esperada segun task.tipo. task.tipo es
+    // metadata estable que ningun comando de taskctl reescribe, asi que
+    // usar la lectura preliminar para esto es seguro aunque sea de antes
+    // del cambio de rama.
+    const baseBranchGuard = ensureBaseBranchReady(initial.task.tipo, deps.repoCwd);
+    // Lectura FRESCA, ya en la rama base real (si hubo cambio, aqui es
+    // donde se nota) — esta es la unica que decide si se muta algo y con
+    // que contenido. Puede rechazar aunque la preliminar de arriba haya
+    // pasado (p. ej. otra persona ya avanzo la tarea en la rama base
+    // mientras tanto) o aceptar como re-planificacion legitima un caso
+    // que en la rama vieja parecia otra cosa.
+    const existing = await readTareaFile(tareasRoot, id);
+    assertTransitionAllowed('plan', existing ? existing.task : null);
+    const { task, body, filePath } = existing;
+    // asignado_a se resuelve contra la lectura FRESCA (la de justo
+    // arriba), no contra la preliminar: otra persona pudo cambiarlo en la
+    // rama base mientras tanto, y decidir "cambio o no" con la lectura
+    // vieja daria un asignadoCambiado mentiroso — la misma regla de doble
+    // lectura que obliga TASK-012.
+    // Precedencia (TASK-024): flag > asignado_a previo > identidad Git >
+    // null. Sin flag se CONSERVA lo que hubiera ("no lo has mencionado"
+    // no es "quitalo"), y solo si no habia nada entra la identidad de
+    // quien ejecuta.
+    // identidadUsable filtra la identidad Git con las MISMAS reglas que
+    // el flag (hallazgo CRITICO de revision por pares, TASK-024): un
+    // user.email con un salto de linea dentro inyectaba claves en el
+    // frontmatter y llegaba a pisar 'estado'. Una identidad invalida no
+    // aborta el comando — quien ejecuta no ha pedido nada raro — pero se
+    // ignora y se avisa.
+    const { identidad, aviso: avisoIdentidad } = identidadUsable(gitUserEmail(deps.repoCwd));
+    const asignadoFinal = resolverAsignado(asignadoA, task.asignado_a, identidad);
+    const asignadoCambiado = asignadoFinal !== task.asignado_a;
+    const updated = {
+        ...task,
+        estado: 'en-diseno',
+        asignado_a: asignadoFinal,
+        actualizado: today,
+    };
+    // El plan se escribe/migra en la carpeta ACTUAL, ANTES de mover la
+    // tarea de estado — mismo orden y mismo motivo que "review" con
+    // revision/ (TASK-013): si una escritura falla, la tarea no se ha
+    // movido todavia y reintentar es posible, en vez de dejarla en
+    // en-diseno sin plan. El rename de moveTareaFile se lleva despues
+    // la subcarpeta entera.
+    const taskDir = path.dirname(filePath);
+    const ubicacion = await resolverPlanFinal(taskDir);
+    // Fail-closed (TASK-027): con los dos ficheros a la vez no hay forma
+    // de saber cual es el plan bueno, y elegir por nuestra cuenta puede
+    // tirar el que la persona redacto. Se aborta ANTES de tocar nada.
+    if (ubicacion.canonicaExiste && ubicacion.legadaExiste) {
+        throw new PlanCommandError(`[ERROR] ${task.id}: hay un ${PLAN_FINAL_FILENAME} en la raiz de la carpeta y otro ` +
+            `en ${PLANIFICACION_DIRNAME}/. No se puede saber cual es el plan bueno. Compara ` +
+            `"${ubicacion.legada}" con "${ubicacion.canonica}", deja solo el de ` +
+            `${PLANIFICACION_DIRNAME}/ y reintenta. La tarea no se ha movido.`);
+    }
+    // plan-final.md no tiene frontmatter y no encaja en el modelo Task,
+    // asi que no pasa por writeTareaFile/moveTareaFile (que son
+    // especificas de tarea.md) — pero SI reusa isEexist de task-store.ts
+    // en vez de duplicar la comprobacion (hallazgo de revision por
+    // pares, TASK-010).
+    // Si "planificacion" existe pero como FICHERO, mkdir falla con un
+    // EEXIST/ENOTDIR crudo que el CLI presentaba como "taskctl no pudo
+    // arrancar" — ni cierto ni accionable (hallazgo MENOR de revision por
+    // pares, TASK-027; CONVENCIONES: los errores dicen que hacer).
+    const planificacionDir = path.join(taskDir, PLANIFICACION_DIRNAME);
+    try {
+        await mkdir(planificacionDir, { recursive: true });
+    }
+    catch (e) {
+        throw new PlanCommandError(`[ERROR] ${task.id}: no se pudo crear "${planificacionDir}" (${e.code ?? 'error desconocido'}). Si ahi hay un fichero llamado "${PLANIFICACION_DIRNAME}", renombralo o borralo: ` +
+            'esa ruta tiene que ser la carpeta de artefactos de diseno de la tarea. ' +
+            'La tarea no se ha movido.');
+    }
+    let planCreated = false;
+    let planMigrado = false;
+    if (ubicacion.legadaExiste) {
+        // Tarea planificada con el CLI anterior a TASK-027: el plan real
+        // (redactado o no) esta suelto en la raiz. Se MUEVE, no se copia
+        // ni se pisa con el scaffold — perder un plan redactado seria
+        // exactamente el fallo que este item viene a evitar.
+        await rename(ubicacion.legada, ubicacion.canonica);
+        planMigrado = true;
+    }
+    else {
+        // Sin un "else if (!canonicaExiste)" delante A PROPOSITO (hallazgo
+        // IMPORTANTE de revision por pares, TASK-027): esa condicion hacia
+        // inalcanzable el flag 'wx', que es justo el guardian contra pisar
+        // un plan ya redactado, y con el se perdia la unica red de
+        // regresion sobre un camino de perdida de datos. El 'wx' hace las
+        // dos cosas — decide y protege — y ademas cierra la ventana entre
+        // el stat de resolverPlanFinal y esta escritura.
+        try {
+            await writeFile(ubicacion.canonica, planTemplate(task), { encoding: 'utf8', flag: 'wx' });
+            planCreated = true;
+        }
+        catch (e) {
+            if (!isEexist(e))
+                throw e;
+            // EEXIST con "wx" NO siempre es una re-planificacion: open() con
+            // O_CREAT|O_EXCL contesta EEXIST tambien cuando la ruta la ocupa
+            // un DIRECTORIO (comprobado en Windows, y es lo que manda POSIX).
+            // Y aqui sabemos que canonicaExiste era false, o sea que el stat
+            // no vio un fichero regular. Tragarse ese EEXIST dejaba a la
+            // persona en un callejon sin salida: "plan" decia "ya existia --
+            // se dejo intacto" con exit 0 sin haber plan ninguno, y "approve"
+            // contestaba "todavia no tiene un plan-final.md que aprobar.
+            // Ejecuta taskctl plan primero" -- un consejo que no lleva a
+            // ningun sitio, porque "plan" vuelve a decir que todo esta bien
+            // (hallazgo MENOR del smoke test manual, TASK-027).
+            // Se distingue re-stateando: fichero regular = la carrera contra
+            // la ventana entre resolverPlanFinal y esta escritura, que es
+            // justo lo que el "wx" protege, y se deja intacto; cualquier otra
+            // cosa = ruta ocupada, y se dice que hacer.
+            if (!(await existeFichero(ubicacion.canonica))) {
+                throw new PlanCommandError(`[ERROR] ${task.id}: "${ubicacion.canonica}" existe pero no es un fichero ` +
+                    '(¿una carpeta con ese nombre?), asi que ahi no hay ningun plan que redactar ' +
+                    'ni que aprobar. Renombra o borra esa ruta y reintenta. La tarea no se ha movido.');
+            }
+        }
+    }
+    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+    const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
+    // Paso 5 de la 8.3 (TASK-030, item C2): la carpeta de ORIGEN entra
+    // tambien, para que el commit registre el movimiento (y el borrado
+    // de 00-planificadas/) en vez de una copia con la carpeta vieja
+    // huerfana. planificacion/plan-final.md ya cae dentro de la carpeta
+    // de destino, no hace falta nombrarlo aparte.
+    const commitResult = autoCommit({
+        cwd: deps.repoCwd,
+        rutas: [path.dirname(filePath), path.dirname(newFilePath)],
+        mensaje: mensajeChore(task.id, 'tarea en diseno'),
+        push,
+    });
+    return {
+        autoCommit: commitResult,
+        id: task.id,
+        filePath: newFilePath,
+        planPath,
+        planCreated,
+        planMigrado,
+        asignadoA: asignadoFinal,
+        asignadoCambiado,
+        avisoIdentidad,
+        baseBranchGuard,
+    };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js
new file mode 100644
index 0000000..9dc39d2
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js
@@ -0,0 +1,224 @@
+/**
+ * taskctl review — TASK-013 de PLAN_SPRINTS.md. Cierra la fase de
+ * ejecucion y abre la de revision: trae los cambios de la rama base
+ * con el script Git-Flow del tipo, verifica con evidencia Git que el
+ * merge ocurrio (no lo supone), mueve la tarea a 03-en-revision/ y
+ * deja en revision/ la peticion para el agente revisor generico (con
+ * el diff real embebido) mas el scaffold de su informe.
+ *
+ * El CLI hace SOLO lo determinista: no invoca ningun LLM (decision
+ * con Carlos, 2026-09-05 — mismo patron que el plan minimo de
+ * TASK-010, donde el contenido lo redacta el agente que orquesta
+ * Claude Code). La fragmentacion de revisores por dominio es TASK-018
+ * y la puerta determinista build/lint/tests de la seccion 16
+ * (correccion 5) queda para TASK-018/019.
+ *
+ * `ultimo_commit_revisado` NO se actualiza aqui a proposito: segun la
+ * seccion 16.3 se actualiza cuando una revision TERMINA (informe
+ * aprobado), no cuando se genera la peticion.
+ */
+import path from 'node:path';
+import { mkdir, readdir, writeFile } from 'node:fs/promises';
+import { readTareaFile, moveTareaFile, isEnoent, isEexist } from '../fs/task-store.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import { isWorkspaceClean, currentBranch, resolveBaseBranchForTipo, isAncestor, headCommit, logOneline, diffRange, } from '../fs/git.js';
+import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
+import { runGitflowScript } from '../fs/gitflow-runner.js';
+export class ReviewCommandError extends Error {
+}
+const SCRIPT_BY_TYPE = {
+    feature: 'update-feature.sh',
+    fix: 'update-fix.sh',
+    hotfix: 'update-hotfix.sh',
+    release: 'update-release.sh',
+};
+export const REVISION_DIRNAME = 'revision';
+const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)\.md$/;
+/**
+ * Valla de backticks mas larga que cualquier apertura/cierre de valla
+ * presente en el contenido embebido (CommonMark tolera hasta 3
+ * espacios de sangria, que es justo lo que produce una linea de
+ * contexto de diff con backticks a columna 0 — hallazgo MENOR de
+ * revision por pares, TASK-013: con valla fija de 4, un diff cuyo
+ * contexto contenga ```` cerraba el bloque antes de tiempo).
+ */
+export function fenceFor(...contents) {
+    let max = 3;
+    for (const content of contents) {
+        for (const m of content.matchAll(/^ {0,3}(`{3,})/gm)) {
+            max = Math.max(max, m[1].length);
+        }
+    }
+    return '`'.repeat(max + 1);
+}
+export function peticionTemplate(task, baseBranch, commitRevisado, ronda, fecha, commits, diff) {
+    const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
+    const diffBlock = diff === '' ? '(sin diferencias respecto a la base)' : diff;
+    const fence = fenceFor(commitsBlock, diffBlock);
+    return (`# Peticion de revision — ${task.id} (ronda ${ronda})\n\n` +
+        `- Tarea: ${task.id} — ${task.titulo}\n` +
+        `- Rama revisada: ${task.rama}\n` +
+        `- Rama base: ${baseBranch}\n` +
+        `- Commit revisado (HEAD): ${commitRevisado}\n` +
+        `- Fecha: ${fecha}\n` +
+        `- Agente revisor sugerido: ${task.agente_revisor}\n\n` +
+        '## Instrucciones para el agente revisor\n\n' +
+        'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
+        'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
+        'directorio temporal, corre la suite tu mismo y construye el caso que\n' +
+        'rompe el codigo antes de reportarlo. Clasifica cada hallazgo como\n' +
+        'CRITICO (perdida de datos, corrupcion de estado, el comando hace lo\n' +
+        'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
+        'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
+        'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
+        `informe de esta ronda (informe-revision-${ronda}.md), sin borrar la\n` +
+        'peticion.\n\n' +
+        `## Commits a revisar (git log ${baseBranch}..HEAD)\n\n` +
+        `${fence}\n` +
+        `${commitsBlock}\n` +
+        `${fence}\n\n` +
+        `## Diff completo (git diff ${baseBranch}..HEAD)\n\n` +
+        `${fence}diff\n` +
+        `${diffBlock}\n` +
+        `${fence}\n`);
+}
+export function informeTemplate(task, commitRevisado, ronda) {
+    return (`# Informe de revision — ${task.id} (ronda ${ronda})\n\n` +
+        `- Commit revisado: ${commitRevisado}\n` +
+        '- Revisor: (rellenar por el agente)\n' +
+        // taskctl finish exige que TODAS las lineas "- Veredicto:" del
+        // informe aprueben: hay que SUSTITUIR esta linea, no anadir otra.
+        '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados")\n\n' +
+        '## Hallazgos\n\n' +
+        '(CRITICO / IMPORTANTE / MENOR con reproduccion, o "sin hallazgos" explicito.)\n');
+}
+/**
+ * Primera ronda libre: 1 + el mayor N entre los
+ * peticion-revision-N.md / informe-revision-N.md ya presentes.
+ */
+async function siguienteRonda(revisionDir) {
+    let entries;
+    try {
+        entries = await readdir(revisionDir);
+    }
+    catch (e) {
+        if (isEnoent(e))
+            return 1;
+        throw e;
+    }
+    let max = 0;
+    for (const entry of entries) {
+        const m = RONDA_FILE_RE.exec(entry);
+        if (m !== null)
+            max = Math.max(max, Number(m[1]));
+    }
+    return max + 1;
+}
+export async function runReviewCommand(tareasRoot, argv, today, deps) {
+    const { push, resto } = extraerPushFlag(argv);
+    const id = resto[0];
+    if (id === undefined || id.trim() === '') {
+        throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
+    }
+    // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): sirve
+    // para rechazo rapido sin tocar Git y para extraer tipo/rama —
+    // metadata estable que ningun comando reescribe. La lectura que
+    // decide la escritura va DESPUES del script, que cambia de rama.
+    const initial = await readTareaFile(tareasRoot, id);
+    assertTransitionAllowed('review', initial ? initial.task : null);
+    const tipo = initial.task.tipo;
+    const rama = initial.task.rama;
+    // Mismo motivo que en start: el prompt interactivo de Git-Flow con
+    // stdin no interactivo cancela en silencio (EOF => "No" => exit 0).
+    if (!isWorkspaceClean(deps.repoCwd)) {
+        throw new ReviewCommandError(`[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
+            'Haz commit o stash antes de "taskctl review" — el update de Git-Flow necesita el ' +
+            'workspace limpio y su prompt interactivo cancela en silencio sin terminal.');
+    }
+    const scriptName = SCRIPT_BY_TYPE[tipo];
+    const { code, signal } = runGitflowScript(scriptName, [rama], {
+        scriptsDir: deps.scriptsDir,
+        cwd: deps.repoCwd,
+    });
+    if (code !== 0) {
+        const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
+        throw new ReviewCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
+            'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo y haz commit ' +
+            'antes de reintentar); la tarea no se ha movido de carpeta.');
+    }
+    // Evidencia, no suposicion (TASK-007/009): rama activa correcta y
+    // merge de la base ocurrido de verdad (la base es antepasada de
+    // HEAD), no solo un exit 0 del script.
+    const branchNow = currentBranch(deps.repoCwd);
+    if (branchNow !== rama) {
+        throw new ReviewCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
+            `"${branchNow}", no "${rama}". No se actualiza la tarea; revisa el repo a mano.`);
+    }
+    const baseBranch = resolveBaseBranchForTipo(tipo, deps.repoCwd);
+    if (!isAncestor(baseBranch, 'HEAD', deps.repoCwd)) {
+        throw new ReviewCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${baseBranch}" NO esta ` +
+            `integrada en "${rama}" (merge-base --is-ancestor lo niega). No se actualiza la ` +
+            'tarea; revisa el repo a mano.');
+    }
+    // Lectura FRESCA, ya con la rama de la tarea activa: la unica que
+    // decide si se muta algo y con que contenido (regla de la doble
+    // lectura — el update pudo traer de la base un tarea.md mas nuevo).
+    const existing = await readTareaFile(tareasRoot, id);
+    assertTransitionAllowed('review', existing ? existing.task : null);
+    const { task, body, filePath } = existing;
+    const commitRevisado = headCommit(deps.repoCwd);
+    const commits = logOneline(baseBranch, 'HEAD', deps.repoCwd);
+    const diff = diffRange(baseBranch, 'HEAD', deps.repoCwd);
+    const updated = { ...task, estado: 'en-revision', actualizado: today };
+    // Peticion + scaffold de informe ANTES de mover la tarea (hallazgo
+    // IMPORTANTE de revision por pares, TASK-013): si una escritura
+    // falla (EEXIST por colision case-insensitive en NTFS, permisos,
+    // disco), la tarea sigue en-curso y reintentar es posible — el orden
+    // inverso dejaba estado en-revision sin peticion ni salida, un
+    // callejon de la maquina de estados. Se escriben en la carpeta
+    // ACTUAL: el rename de moveTareaFile se lleva revision/ entera.
+    // Flag 'wx' en ambos: la numeracion garantiza un hueco libre, y si
+    // aun asi el fichero existiera, fallar ruidosamente es mejor que
+    // pisar una revision anterior — mismo principio que plan-final.md.
+    const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
+    await mkdir(revisionDir, { recursive: true });
+    const ronda = await siguienteRonda(revisionDir);
+    try {
+        await writeFile(path.join(revisionDir, `peticion-revision-${ronda}.md`), peticionTemplate(updated, baseBranch, commitRevisado, ronda, today, commits, diff), { encoding: 'utf8', flag: 'wx' });
+        await writeFile(path.join(revisionDir, `informe-revision-${ronda}.md`), informeTemplate(updated, commitRevisado, ronda), { encoding: 'utf8', flag: 'wx' });
+    }
+    catch (e) {
+        if (!isEexist(e))
+            throw e;
+        throw new ReviewCommandError(`[ERROR] ${id}: ya existe un fichero de la ronda ${ronda} en ${revisionDir} ` +
+            '(¿restos con otro case en un filesystem case-insensitive?). La tarea NO se ha ' +
+            'movido; limpia o renombra esos ficheros y reintenta.');
+    }
+    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
+    const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
+    const peticionPath = path.join(newRevisionDir, `peticion-revision-${ronda}.md`);
+    const informePath = path.join(newRevisionDir, `informe-revision-${ronda}.md`);
+    // Paso 5 de la 8.3 (TASK-030, item C2). "review" NO aplica
+    // ensureBaseBranchReady, asi que en el arbol puede haber trabajo de
+    // la persona junto al de taskctl: solo entran las dos carpetas de la
+    // tarea (la de origen para que el movimiento se registre como tal, y
+    // la de destino, que ya contiene revision/ con la peticion y el
+    // scaffold del informe).
+    const commitResult = autoCommit({
+        cwd: deps.repoCwd,
+        rutas: [path.dirname(filePath), path.dirname(newFilePath)],
+        mensaje: mensajeChore(task.id, `peticion de revision ronda ${ronda}`),
+        push,
+    });
+    return {
+        autoCommit: commitResult,
+        id: task.id,
+        rama,
+        baseBranch,
+        commitRevisado,
+        ronda,
+        filePath: newFilePath,
+        peticionPath,
+        informePath,
+    };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js
new file mode 100644
index 0000000..62735b0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js
@@ -0,0 +1,222 @@
+/**
+ * taskctl start — TASK-009 de PLAN_SPRINTS.md. Primer comando que
+ * toca Git de verdad: crea la rama de la tarea invocando el script
+ * de Git-Flow correspondiente a su tipo y mueve la carpeta de la
+ * tarea a 02-en-curso/.
+ *
+ * Deliberadamente NO implementa aqui la precondicion completa de la
+ * seccion 8.3 (auto-switch a la rama base correcta si el workspace
+ * esta limpio) — eso es TASK-012. Este comando solo anade la guarda
+ * minima necesaria para invocar el script de forma segura y
+ * deterministica: comprobar que el workspace esta limpio ANTES de
+ * llamar al script, en vez de delegar en su prompt interactivo.
+ */
+import path from 'node:path';
+import { parseArgs } from '../cli/args.js';
+import { parseAsignadoAFlag, identidadUsable, PISTA_VACIO_ESCRITURA, } from '../cli/asignado.js';
+import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
+import { escanearWip } from '../fs/wip-scan.js';
+import { ESTADOS_QUE_OCUPAN_WIP, tareasQueBloquean, resolverAsignado, mensajeWipExcedido, mensajeWipIndeterminado, personaDeTarea, } from '../core/wip.js';
+import { resolverConfig } from '../core/config.js';
+import { assertTransitionAllowed } from '../core/state-machine.js';
+import { isWorkspaceClean, currentBranch, isValidBranchName, gitUserEmail, resolveBaseBranchForTipo, } from '../fs/git.js';
+import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
+import { runGitflowScript } from '../fs/gitflow-runner.js';
+export class StartCommandError extends Error {
+}
+const SCRIPT_BY_TYPE = {
+    feature: 'create-feature.sh',
+    fix: 'create-fix.sh',
+    hotfix: 'create-hotfix.sh',
+    release: 'create-release.sh',
+};
+export async function runStartCommand(tareasRoot, argv, today, deps) {
+    // --push fuera antes de nada (TASK-030): parseArgs trata
+    // "--flag valor" como par y se habria comido el ID.
+    const { push, resto } = extraerPushFlag(argv);
+    // El ID sale de los POSICIONALES, no de argv[0] a secas (item B6):
+    // ver el comentario equivalente en plan.ts.
+    const { positional } = parseArgs(resto);
+    const id = positional[0];
+    if (id === undefined || id.trim() === '') {
+        throw new StartCommandError('[ERROR] Falta el ID de la tarea: taskctl start TASK-NNN.');
+    }
+    // Se parsea antes de leer nada y, sobre todo, antes de invocar el
+    // script de Git-Flow: un --asignado-a mal escrito no debe dejar una
+    // rama creada a medias.
+    const asignadoA = parseAsignadoAFlag(resto, (m) => new StartCommandError(m), PISTA_VACIO_ESCRITURA);
+    const existing = await readTareaFile(tareasRoot, id);
+    // assertTransitionAllowed lanza StateMachineError si existing es null
+    // (tarea no encontrada) o si el estado/campos actuales no permiten
+    // "start" todavia — en ambos casos no se llega a tocar Git ni mover
+    // nada.
+    assertTransitionAllowed('start', existing ? existing.task : null);
+    const { task, body, filePath } = existing;
+    // Precondicion minima (ver cabecera del fichero): workspace limpio
+    // ANTES de invocar el script, para no depender de su prompt
+    // interactivo (TASK-007, hallazgo 3: EOF => "No" => exit 0, lo que
+    // desde un caller programatico es indistinguible de un exito real
+    // si no se comprueba antes).
+    if (!isWorkspaceClean(deps.repoCwd)) {
+        throw new StartCommandError(`[ERROR] ${task.id}: el workspace tiene cambios sin commitear. ` +
+            'Haz commit o stash antes de "taskctl start" — esta comprobacion evita depender ' +
+            'del prompt interactivo de Git-Flow, que con stdin no interactivo cancela en silencio.');
+    }
+    // Limite de trabajo en curso (TASK-015, item B7). Va aqui, ANTES de
+    // tocar Git, por lo mismo que el resto de guardas de este comando:
+    // rechazar sin haber creado una rama que luego habria que borrar a
+    // mano.
+    //
+    // asignadoFinal se resuelve una sola vez y se usa para dos cosas: la
+    // comprobacion de aqui y el frontmatter que se escribe al final. Sin
+    // esto, un start --asignado-a otra-persona comprobaria el limite
+    // contra quien la tenia asignada antes y luego escribiria a otra: se
+    // comprobaria a la persona equivocada.
+    // Precedencia (TASK-024): flag > asignado_a previo > identidad Git >
+    // null. Que el previo gane a la identidad es lo que evita que
+    // ejecutar start sobre la tarea de otra persona se la quede: el
+    // limite de WIP se sigue comprobando contra quien tiene la rama.
+    // identidadUsable aplica a la identidad Git las mismas reglas que al
+    // flag (hallazgo CRITICO de revision por pares, TASK-024). Ver el
+    // comentario equivalente en plan.ts.
+    const { identidad, aviso: avisoIdentidad } = identidadUsable(gitUserEmail(deps.repoCwd));
+    const asignadoFinal = resolverAsignado(asignadoA, task.asignado_a, identidad);
+    // Aviso de atribucion (hallazgo IMPORTANTE de revision por pares,
+    // TASK-024): quien abre la rama puede no ser quien planifico la
+    // tarea, y como el asignado previo gana a la identidad, el trabajo
+    // queda registrado a nombre de otra persona sin que nadie lo note —
+    // y el limite de WIP se comprueba contra esa otra persona. No se
+    // cambia la semantica (quedarse una tarea ajena debe ser explicito),
+    // pero se dice en voz alta.
+    const avisoAtribucion = asignadoA === undefined && identidad !== null && asignadoFinal !== identidad
+        ? `${task.id} esta asignada a "${asignadoFinal}", no a ti (${identidad}). ` +
+            `La rama la abres tu; si te la quedas, usa --asignado-a ${identidad}.`
+        : null;
+    // Una tarea sin asignar no tiene a quien aplicarle un limite. Es el
+    // caso de todo lo anterior a B6 (asignado_a nace a null), asi que
+    // bloquearlo aqui romperia el flujo de quien no use el flag.
+    // personaDeTarea recorta y trata la cadena vacia como sin asignar:
+    // el flag recorta su valor, pero un asignado_a editado a mano en el
+    // frontmatter puede llegar con espacios o vacio (dos hallazgos MENOR
+    // de revision por pares). Se usa tanto para comparar como para
+    // escribir: resolverAsignado devuelve el valor ya recortado, asi que
+    // un asignado_a escrito a mano con espacios queda normalizado al
+    // pasar por aqui. Efecto secundario deseable (cierra el hallazgo de
+    // espacios de B7) pero real: plan y start tocan ese campo aunque
+    // nadie se lo haya pedido (hallazgo MENOR de revision, TASK-024).
+    const personaParaWip = personaDeTarea(asignadoFinal);
+    // Ilegibles dentro de OTRAS ramas: avisan, no bloquean (hallazgo
+    // IMPORTANTE de revision por pares). Se acumulan aqui para que el CLI
+    // los saque por stderr.
+    const avisosWip = [];
+    if (personaParaWip !== null) {
+        let wip;
+        try {
+            // escanearWip (TASK-025) mira el arbol activo Y las ramas de
+            // trabajo abiertas. Sin lo segundo el limite no protegia nada: el
+            // paso a 02-en-curso se commitea en la rama de la tarea, y start
+            // se ejecuta desde la rama base, donde ninguna tarea esta nunca
+            // en curso.
+            wip = await escanearWip(tareasRoot, deps.repoCwd, resolveBaseBranchForTipo(task.tipo, deps.repoCwd), ESTADOS_QUE_OCUPAN_WIP);
+        }
+        catch (e) {
+            // Sin esto, un ENOTDIR/EACCES al escanear tareas/ escapaba como
+            // Error crudo y el usuario lo veia como "taskctl no pudo
+            // arrancar", que es falso: taskctl arranco bien, lo que fallo fue
+            // leer las tareas. Misma clase de bug que ya se corrigio en
+            // TASK-010 y TASK-014 (hallazgo MENOR de revision, TASK-015).
+            const msg = e instanceof Error ? e.message : String(e);
+            throw new StartCommandError(`[ERROR] ${task.id}: no se pudieron leer las tareas para comprobar el limite de ` +
+                `trabajo en curso: ${msg}. Revisa que "${tareasRoot}" sea una carpeta legible.`);
+        }
+        const { tareas, ilegibles, avisos } = wip;
+        avisosWip.push(...avisos);
+        // Fail-closed acotado: un tarea.md ilegible en las carpetas de
+        // ejecucion podria ser justo el que bloquea, y no hay forma de
+        // saberlo. Solo esas dos carpetas: una tarea rota en
+        // 00-planificadas no ocupa hueco, asi que no debe bloquear a nadie.
+        // Solo los del ARBOL ACTIVO bloquean: estan delante de quien
+        // ejecuta y se arreglan editando el fichero. Los de otras ramas van
+        // a avisosWip.
+        if (ilegibles.length > 0) {
+            throw new StartCommandError(mensajeWipIndeterminado(task.id, ilegibles));
+        }
+        // El limite sale de .taskcode/config.yml (item C4). Se resuelve aqui
+        // y no dentro de wip.ts a proposito: ese modulo es puro — recibe el
+        // limite, no lee disco — y esa pureza es lo que deja probarlo sin
+        // montar un repo. Este es el UNICO punto donde el limite se aplica
+        // de verdad; sin esta linea el mecanismo funciona en sus tests y no
+        // hace nada en el CLI, que es justo como llego de los dos frentes.
+        const limiteWip = resolverConfig(deps.repoCwd).limite_wip;
+        const bloqueantes = tareasQueBloquean(tareas, personaParaWip, task.id, limiteWip);
+        if (bloqueantes.length > 0) {
+            throw new StartCommandError(mensajeWipExcedido(task.id, personaParaWip, bloqueantes, limiteWip));
+        }
+    }
+    // Defensa en profundidad (hallazgo menor de revision por pares): sin
+    // esto, un task.rama invalido solo se detecta varios procesos mas
+    // abajo, dentro del propio script de Git-Flow.
+    if (!isValidBranchName(task.rama, deps.repoCwd)) {
+        throw new StartCommandError(`[ERROR] ${task.id}: "${task.rama}" no es un nombre de rama valido para Git. ` +
+            'Corrige el campo "rama" en tarea.md antes de reintentar.');
+    }
+    const scriptName = SCRIPT_BY_TYPE[task.tipo];
+    const { code, signal } = runGitflowScript(scriptName, [task.rama], {
+        scriptsDir: deps.scriptsDir,
+        cwd: deps.repoCwd,
+    });
+    if (code !== 0) {
+        const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
+        throw new StartCommandError(`[ERROR] ${task.id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
+            'Revisa la salida de arriba; la tarea no se ha movido de carpeta.');
+    }
+    // Evidencia, no suposicion (principio de TASK-007): un exit code 0
+    // del script no basta por si solo, se confirma la rama activa real.
+    const branchNow = currentBranch(deps.repoCwd);
+    if (branchNow !== task.rama) {
+        throw new StartCommandError(`[ERROR] ${task.id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
+            `"${branchNow}", no "${task.rama}". No se actualiza la tarea; revisa el repo a mano.`);
+    }
+    // asignadoFinal ya se resolvio arriba, junto a la comprobacion del
+    // limite de WIP, para no calcularlo dos veces ni arriesgarse a que
+    // las dos copias diverjan: se comprueba el limite de la MISMA
+    // persona que se acaba escribiendo en el frontmatter.
+    const asignadoCambiado = asignadoFinal !== task.asignado_a;
+    const updated = {
+        ...task,
+        estado: 'en-curso',
+        asignado_a: asignadoFinal,
+        actualizado: today,
+    };
+    // tolerateMissingSource: un hotfix/release creado desde una base
+    // (main) que no incluye tareas/ hace que Git borre la carpeta vieja
+    // del working tree al hacer checkout, ANTES de que lleguemos aqui —
+    // ver comentario de MoveTareaFileOptions en task-store.ts. task/body
+    // ya se leyeron en memoria antes de invocar el script, asi que no se
+    // pierde nada.
+    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body, {
+        tolerateMissingSource: true,
+    });
+    // Paso 5 de la 8.3 (TASK-030, item C2). Se commitea sobre la rama de
+    // la tarea, que el script de Git-Flow acaba de crear y ya esta
+    // confirmada arriba. "start" NO aplica ensureBaseBranchReady: aqui
+    // puede haber trabajo de la persona en el arbol, y por eso el commit
+    // se limita a las dos carpetas de la tarea y a nada mas.
+    const commitResult = autoCommit({
+        cwd: deps.repoCwd,
+        rutas: [path.dirname(filePath), path.dirname(newFilePath)],
+        mensaje: mensajeChore(task.id, 'tarea en curso'),
+        push,
+    });
+    return {
+        id: task.id,
+        rama: task.rama,
+        filePath: newFilePath,
+        asignadoA: asignadoFinal,
+        asignadoCambiado,
+        avisoIdentidad,
+        avisoAtribucion,
+        avisosWip,
+        autoCommit: commitResult,
+    };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/wrappers.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/wrappers.js
new file mode 100644
index 0000000..3be3ed5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/wrappers.js
@@ -0,0 +1,183 @@
+/**
+ * Los cinco "wrappers directos" de la tabla de la seccion 8 de la
+ * metodologia (item C1, TASK-026): taskctl diagnose / pause / resume /
+ * recover / abort-merge sobre los scripts que ya existen en
+ * scripts/gitflow/. La seccion 8.3 ya remitia a `taskctl pause` en su
+ * mensaje de workspace sucio, asi que el comando le hacia falta al
+ * sistema desde antes de existir.
+ *
+ * Envolverlos NO es solo enrutar a bash. Cuatro de los cinco scripts
+ * preguntan con `read -rp`, y con EOF inmediato contestan asi:
+ *
+ *   - pause-work.sh    -> respuesta vacia, "Opcion no reconocida", exit 1
+ *   - abort-merge.sh   -> no confirma: NO aborta nada, y sale 0
+ *   - resume-work.sh   -> aplica el stash de la rama sin preguntar (default si)
+ *   - recover-branch.sh-> cancela sin sobreescribir (default no)
+ *   - diagnose-repo.sh -> no pregunta nada
+ *
+ * De ahi las dos reglas de este modulo:
+ *
+ * 1. **Con terminal, stdin heredado; sin terminal, stdin ignorado.**
+ *    Heredar siempre parecia lo natural, pero reintroduce justo el
+ *    modo de fallo que motivo el `stdin: 'ignore'` de TASK-007: si
+ *    quien lanza taskctl le deja una tuberia abierta que nadie cierra
+ *    (lo hace cualquier arnes de agente, y tambien `node --test`), el
+ *    script se queda esperando una respuesta que no va a llegar y el
+ *    comando cuelga indefinidamente. Sin terminal el script recibe
+ *    EOF, que es determinista, y taskctl avisa antes de que valor por
+ *    defecto va a tomar (hallazgo IMPORTANTE de revision por pares).
+ * 2. **Sin terminal se corta antes de invocar** en los casos en que
+ *    ese valor por defecto haria lo contrario de lo que anuncia el
+ *    comando.
+ *
+ * Lo que estos comandos NO hacen, a proposito: no leen ni escriben
+ * `tareas/`, no pasan por la maquina de estados y no aplican la
+ * precondicion de rama base de la 8.3 — seria contradictorio, porque
+ * `pause` existe justamente para el workspace sucio que esa
+ * precondicion rechaza, y `resume`/`recover` cambian de rama por
+ * definicion.
+ */
+import { isInsideWorkTree, isValidBranchName, isWorkspaceClean, operacionEnCurso, } from '../fs/git.js';
+import { runGitflowScript } from '../fs/gitflow-runner.js';
+export class WrapperCommandError extends Error {
+}
+const WRAPPERS = {
+    diagnose: { script: 'diagnose-repo.sh', aceptaRama: false, opciones: [] },
+    pause: { script: 'pause-work.sh', aceptaRama: false, opciones: ['--push', '-p'] },
+    resume: { script: 'resume-work.sh', aceptaRama: true, opciones: [] },
+    recover: { script: 'recover-branch.sh', aceptaRama: true, opciones: [] },
+    'abort-merge': { script: 'abort-merge.sh', aceptaRama: false, opciones: [] },
+};
+export const WRAPPER_NAMES = Object.keys(WRAPPERS);
+export function isWrapperCommand(cmd) {
+    return Object.prototype.hasOwnProperty.call(WRAPPERS, cmd);
+}
+/**
+ * Los scripts se tragan cualquier cosa: sus bucles `while` toman el
+ * primer argumento no reconocido como nombre de rama, asi que
+ * `taskctl resume --push mi-rama` intentaria retomar una rama llamada
+ * "--push". Y parseArgs (cli/args.ts) ignora en silencio los flags
+ * que no conoce, el mismo fallo que la revision de B6 encontro ya
+ * materializado en `board`. Se validan aqui, antes de invocar nada.
+ */
+function parseWrapperArgs(nombre, spec, argv) {
+    const opciones = [];
+    let rama = null;
+    for (const arg of argv) {
+        if (arg.startsWith('-')) {
+            if (!spec.opciones.includes(arg)) {
+                const admite = spec.opciones.length === 0
+                    ? 'no admite ninguna opcion'
+                    : `solo admite ${spec.opciones.join(' y ')}`;
+                throw new WrapperCommandError(`[ERROR] taskctl ${nombre} ${admite}, y recibio "${arg}".`);
+            }
+            if (!opciones.includes(arg))
+                opciones.push(arg);
+            continue;
+        }
+        if (!spec.aceptaRama) {
+            throw new WrapperCommandError(`[ERROR] taskctl ${nombre} no acepta argumentos, y recibio "${arg}". ` +
+                `Ejecuta: taskctl ${nombre}`);
+        }
+        if (arg.trim() === '') {
+            throw new WrapperCommandError(`[ERROR] taskctl ${nombre} recibio un nombre de rama vacio. ` +
+                `Ejecuta: taskctl ${nombre} <rama>`);
+        }
+        if (rama !== null) {
+            throw new WrapperCommandError(`[ERROR] taskctl ${nombre} acepta un solo nombre de rama, y recibio "${rama}" y ` +
+                `"${arg}".`);
+        }
+        rama = arg;
+    }
+    return { rama, opciones };
+}
+/**
+ * Guarda de no-interactividad: solo corta cuando el script iba a
+ * preguntar algo Y su respuesta por defecto es inaceptable. Si no hay
+ * nada que preguntar (diagnose, o pause con el workspace limpio), el
+ * comando sigue igual de bien sin terminal.
+ */
+function assertPuedeSeguirSinTerminal(nombre, rama, repoCwd) {
+    if (nombre === 'pause') {
+        if (!isWorkspaceClean(repoCwd)) {
+            throw new WrapperCommandError('[ERROR] taskctl pause tiene que preguntarte si guardar los cambios como commit o ' +
+                'como stash, y no hay terminal interactiva. Ejecutalo desde una terminal, o ' +
+                'guardalos tu: "git stash push -u" para apartarlos, "git add -A && git commit" ' +
+                'para dejarlos en la rama.');
+        }
+        // Aqui habia un segundo guard (TASK-026): con el workspace limpio,
+        // `pause` abortaba igualmente si el repo no ignoraba el registro
+        // que los scripts de Git-Flow escribian en "logs/gitflow/", porque
+        // `initialize_gitflow_log` lo creaba nada mas arrancar y
+        // pause-work.sh acababa viendo sucio un workspace que habia
+        // ensuciado el mismo. Ese guard tapaba una suciedad autoinfligida,
+        // no un problema del repo del usuario. TASK-029 movio el registro
+        // a `.git/taskcode/gitflow/` (git rev-parse --git-path), que
+        // `git status` no ve nunca, asi que el guard se ha quedado sin
+        // motivo y se elimina con su constante. Comprobado empiricamente:
+        // repo sin ".gitignore", workspace limpio y stdin cerrado ->
+        // pause-work.sh informa "Workspace limpio", sale 0 y no pregunta.
+    }
+    if (nombre === 'abort-merge') {
+        const operacion = operacionEnCurso(repoCwd);
+        if (operacion !== null) {
+            throw new WrapperCommandError(`[ERROR] taskctl abort-merge tiene que confirmar contigo antes de abortar el ` +
+                `${operacion} en curso, y no hay terminal interactiva. Ejecutalo desde una terminal, ` +
+                `o abortalo tu: "git ${operacion} --abort".`);
+        }
+    }
+    if ((nombre === 'resume' || nombre === 'recover') && rama === null) {
+        throw new WrapperCommandError(`[ERROR] taskctl ${nombre} pregunta por la rama cuando no se le pasa, y no hay terminal ` +
+            `interactiva. Ejecuta: taskctl ${nombre} <rama>`);
+    }
+}
+/** Avisos de "sin terminal, el script tomara este valor por defecto". */
+function avisosSinTerminal(nombre, rama) {
+    if (nombre === 'resume' && rama !== null) {
+        return [
+            `Sin terminal interactiva: si "${rama}" tiene un stash de "taskctl pause", resume-work.sh ` +
+                'lo aplicara sin preguntar (es su valor por defecto).',
+        ];
+    }
+    if (nombre === 'recover' && rama !== null) {
+        return [
+            `Sin terminal interactiva: si "${rama}" ya existe en local, recover-branch.sh cancelara ` +
+                'sin sobreescribirla (es su valor por defecto).',
+        ];
+    }
+    return [];
+}
+export function runWrapperCommand(nombre, argv, opts) {
+    const spec = WRAPPERS[nombre];
+    const { rama, opciones } = parseWrapperArgs(nombre, spec, argv);
+    // --is-inside-work-tree y no --git-dir: los cinco scripts trabajan
+    // sobre ficheros del arbol de trabajo, asi que un repo bare o un
+    // cwd dentro de .git/ no valen aunque Git los reconozca como repo
+    // (hallazgo MENOR de revision por pares: alli "pause" moria con el
+    // fatal crudo de git y "diagnose" declaraba el workspace limpio).
+    if (!isInsideWorkTree(opts.repoCwd)) {
+        throw new WrapperCommandError(`[ERROR] taskctl ${nombre} solo funciona dentro del arbol de trabajo de un repositorio ` +
+            `Git, y "${opts.repoCwd}" no lo es. Ejecutalo desde la carpeta del repo.`);
+    }
+    // Defensa en profundidad, mismo motivo que en start (TASK-009): sin
+    // esto, un nombre invalido solo se detecta dos procesos mas abajo,
+    // dentro del script, con un mensaje de Git que no menciona taskctl.
+    if (rama !== null && !isValidBranchName(rama, opts.repoCwd)) {
+        throw new WrapperCommandError(`[ERROR] "${rama}" no es un nombre de rama valido para Git. Revisa el nombre y reintenta.`);
+    }
+    const avisos = [];
+    if (!opts.interactivo) {
+        assertPuedeSeguirSinTerminal(nombre, rama, opts.repoCwd);
+        avisos.push(...avisosSinTerminal(nombre, rama));
+    }
+    for (const aviso of avisos) {
+        opts.onAviso?.(aviso);
+    }
+    const args = rama === null ? opciones : [...opciones, rama];
+    const { code, signal } = runGitflowScript(spec.script, args, {
+        scriptsDir: opts.scriptsDir,
+        cwd: opts.repoCwd,
+        stdin: opts.interactivo ? 'inherit' : 'ignore',
+    });
+    return { nombre, script: spec.script, code, signal, avisos };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/board-format.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/board-format.js
new file mode 100644
index 0000000..2743215
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/board-format.js
@@ -0,0 +1,176 @@
+/**
+ * Filtrado y formateo en texto plano de "taskctl board" (TASK-005 de
+ * PLAN_SPRINTS.md). Modulo puro: no toca disco. Recibe la lista de
+ * tareas ya leida (src/commands/board.ts se encarga de leerlas) y
+ * decide que se filtra y como se ve la tabla.
+ */
+import { TASK_STATES, STATE_FOLDER } from './task.js';
+export function filterTasks(tasks, filters) {
+    return tasks.filter((t) => {
+        if (filters.sprint !== undefined && t.sprint !== filters.sprint)
+            return false;
+        if (filters.asignadoA !== undefined && t.asignado_a !== filters.asignadoA)
+            return false;
+        return true;
+    });
+}
+const STATE_LABEL = {
+    planificada: 'Planificadas',
+    'en-diseno': 'En diseno',
+    'en-curso': 'En curso',
+    'en-revision': 'En revision',
+    terminada: 'Terminadas',
+};
+const TASK_ID_NUM_RE = /^TASK-(\d+)$/;
+/**
+ * Orden numerico por ID, no alfabetico (un ID de 4+ digitos, p. ej.
+ * "TASK-1000", ordenaria mal por delante de "TASK-999" con un
+ * `localeCompare`/`<` puramente lexicografico: '1' < '9' como primer
+ * caracter que difiere). Con los IDs de 3 digitos de hoy no se nota,
+ * pero es gratis evitarlo ahora.
+ */
+function taskIdSortKey(id) {
+    const m = TASK_ID_NUM_RE.exec(id);
+    return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
+}
+/**
+ * Rangos aproximados de caracteres de ancho visual doble (East Asian
+ * Wide/Fullwidth + emoji comunes). Hallazgo IMPORTANTE de revision
+ * por pares: calcular el ancho de columna con `.length` (unidades
+ * UTF-16) desalineaba la tabla con un titulo en CJK (1 unidad de
+ * longitud, 2 columnas visuales en cualquier terminal real) —
+ * reproducido y confirmado por el revisor con "cat -A" sobre la
+ * salida real. No es una tabla Unicode completa (no existe una en la
+ * biblioteca estandar de Node sin depender de un paquete externo,
+ * fuera del alcance de "cero dependencias" del proyecto), pero cubre
+ * los bloques CJK/Hangul/Fullwidth/emoji mas comunes, que es lo que
+ * de verdad aparece en un titulo de tarea.
+ */
+function isWideCodePoint(cp) {
+    return ((cp >= 0x1100 && cp <= 0x115f) || // Jamo de Hangul
+        cp === 0x2329 ||
+        cp === 0x232a ||
+        (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) || // Radicales CJK .. Yi
+        (cp >= 0xac00 && cp <= 0xd7a3) || // Silabas de Hangul
+        (cp >= 0xf900 && cp <= 0xfaff) || // Ideogramas de compatibilidad CJK
+        (cp >= 0xfe30 && cp <= 0xfe6f) || // Formas de compatibilidad CJK
+        (cp >= 0xff00 && cp <= 0xff60) || // Formas de ancho completo
+        (cp >= 0xffe0 && cp <= 0xffe6) ||
+        (cp >= 0x1f300 && cp <= 0x1fadf) || // Emoji (rango comun)
+        (cp >= 0x20000 && cp <= 0x3fffd) // Extensiones CJK (planos suplementarios)
+    );
+}
+/** Ancho visual aproximado en columnas de terminal, no numero de unidades UTF-16. */
+function visualWidth(s) {
+    let width = 0;
+    for (const ch of s) {
+        width += isWideCodePoint(ch.codePointAt(0) ?? 0) ? 2 : 1;
+    }
+    return width;
+}
+/**
+ * Sustituye caracteres de control (tabuladores, saltos de linea
+ * embebidos, etc.) por un espacio antes de calcular anchos o
+ * renderizar (hallazgo IMPORTANTE de revision por pares: un titulo
+ * con un tabulador colado se expande de forma impredecible en una
+ * terminal real y rompe la alineacion, sin que `visualWidth` pueda
+ * preverlo). Defensa en el propio formateador, independiente de si
+ * `task.ts` llega a validar esto en el futuro.
+ */
+function sanitizeCell(s) {
+    // eslint-disable-next-line no-control-regex
+    return s.replace(/[\x00-\x1f\x7f]/g, ' ');
+}
+function padEndVisible(s, width) {
+    const vw = visualWidth(s);
+    return vw >= width ? s : s + ' '.repeat(width - vw);
+}
+function formatTable(tasks) {
+    const header = ['ID', 'Titulo', 'Asignado'];
+    const rows = tasks.map((t) => [t.id, t.titulo, t.asignado_a ?? '(sin asignar)'].map(sanitizeCell));
+    const allRows = [header, ...rows];
+    const widths = header.map((_, col) => Math.max(...allRows.map((r) => visualWidth(r[col] ?? ''))));
+    const formatRow = (r) => r.map((cell, i) => padEndVisible(cell, widths[i] ?? 0)).join('  ').trimEnd();
+    const separator = widths.map((w) => '-'.repeat(w)).join('  ');
+    return [formatRow(header), separator, ...rows.map(formatRow)];
+}
+/**
+ * Agrupa por estado, en el orden del ciclo de vida (seccion 5 de la
+ * metodologia: 00-planificadas -> ... -> 04-terminadas). Un estado sin
+ * tareas (tras aplicar los filtros) NO imprime cabecera (criterio de
+ * aceptacion de TASK-005). Dentro de cada grupo, orden numerico por ID
+ * (deterministico, no depende del orden de lectura del filesystem).
+ */
+export function formatBoard(tasks) {
+    const blocks = [];
+    for (const estado of TASK_STATES) {
+        const grupo = tasks
+            .filter((t) => t.estado === estado)
+            .sort((a, b) => taskIdSortKey(a.id) - taskIdSortKey(b.id));
+        if (grupo.length === 0)
+            continue;
+        const header = `## ${STATE_LABEL[estado]} (${STATE_FOLDER[estado]}) — ${grupo.length}`;
+        blocks.push([header, ...formatTable(grupo)].join('\n'));
+    }
+    return blocks.join('\n\n');
+}
+/**
+ * Documento completo de `docs/BOARD.md`. Unica fuente del formato del
+ * fichero: la comparten "taskctl finish" (que lo regenera al cerrar una
+ * tarea) y "taskctl board --escribir" (item B5 del plan de terminacion,
+ * que resuelve la divergencia con la tabla de la seccion 8 de la
+ * metodologia: alli el comando "regenera docs/BOARD.md").
+ *
+ * Las tablas van dentro de vallas de codigo a proposito: son texto
+ * alineado con espacios, y sin valla cualquier visor de Markdown junta
+ * sus lineas en un parrafo y destruye la alineacion. Las cabeceras de
+ * estado ("## Planificadas...") se dejan fuera para que sigan siendo
+ * navegables como secciones.
+ *
+ * La valla es FIJA (tres backticks), a diferencia de la dinamica de
+ * review.ts, y es seguro porque ninguna linea embebida puede cerrarla:
+ * dentro de la valla solo van filas de tabla, que empiezan siempre por
+ * la columna ID ("TASK-NNN", "ID" o los guiones del separador), y
+ * CommonMark exige que el cierre sean solo backticks en toda la linea.
+ * Un titulo con backticks queda a partir de la segunda columna, nunca
+ * al principio. Si alguna vez se reordenan las columnas y el titulo
+ * pasa a ir primero, esto deja de ser cierto y habria que calcular la
+ * valla como en review.ts (comprobado por revision por pares, B5).
+ */
+export function renderBoardMarkdown(boardOutput, advertencias, fecha, generadoPor) {
+    const partes = [
+        '# Tablero de tareas',
+        '',
+        `> Generado automaticamente por ${generadoPor} el ${fecha}. No editar a mano.`,
+    ];
+    if (advertencias.length > 0) {
+        partes.push('>', '> Avisos del render:', ...advertencias.map((a) => `> - ${a}`));
+    }
+    partes.push('');
+    let enTabla = false;
+    for (const linea of boardOutput.split('\n')) {
+        if (linea.startsWith('## ')) {
+            if (enTabla) {
+                partes.push('```', '');
+                enTabla = false;
+            }
+            partes.push(linea, '');
+            continue;
+        }
+        if (linea.trim() === '') {
+            if (enTabla) {
+                partes.push('```', '');
+                enTabla = false;
+            }
+            continue;
+        }
+        if (!enTabla) {
+            partes.push('```text');
+            enTabla = true;
+        }
+        partes.push(linea);
+    }
+    if (enTabla)
+        partes.push('```');
+    return `${partes.join('\n').trimEnd()}\n`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js
new file mode 100644
index 0000000..dcc395c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js
@@ -0,0 +1,298 @@
+/**
+ * `.taskcode/config.yml` — TASK-030, item C4 del checklist de
+ * terminacion. Decision #9, resuelta el 2026-09-07: TRES claves, todas
+ * opcionales, y ninguna mas.
+ *
+ * | clave                        | defecto           | quien la lee            |
+ * |------------------------------|-------------------|-------------------------|
+ * | rama_base                    | develop           | git.ts (feature/fix/release) |
+ * | agente_revisor_por_defecto   | general-purpose   | new.ts, import.ts       |
+ * | limite_wip                   | 1                 | wip.ts                  |
+ *
+ * Lo que importa aqui no es el fichero, es la forma del mecanismo —
+ * es lo que decide si anadir la cuarta clave cuesta una linea o una
+ * arqueologia:
+ *
+ * 1. SIN FICHERO, COMPORTAMIENTO IDENTICO AL DE HOY. CONFIG_DEFAULTS
+ *    es literalmente lo que el codigo hacia antes de C4, asi que el
+ *    cambio es no-breaking y los tests que ya existian siguen valiendo
+ *    de red de regresion sin tocar ninguno.
+ * 2. FALLO CERRADO. Un valor invalido o una clave desconocida ABORTAN.
+ *    Nunca caida al default en silencio: con default silencioso el
+ *    repo dice 2, el plugin usa 1 y no se entera nadie. Misma doctrina
+ *    que el flag 'wx' de plan.ts y que el parser de veredictos de
+ *    finish.ts.
+ * 3. UN SOLO PARSER. El bucle `clave: valor` es el de frontmatter.ts,
+ *    extraido a parseBloqueClaveValor(). Aqui no hay ni una linea de
+ *    parseo de YAML.
+ * 4. UN SOLO PUNTO DE RESOLUCION. resolverConfig(cwd) devuelve el
+ *    objeto con los defaults ya aplicados. Ningun comando lee el
+ *    fichero por su cuenta.
+ * 5. NINGUNA CLAVE QUE NADIE LEA. `remoto`, `rama_principal`,
+ *    `politica_no_borrar_ramas` y las palabras clave de la heuristica
+ *    de complejidad estan DESCARTADAS en la decision #9 y no se
+ *    declaran. Una clave escribible que no hace nada es peor que no
+ *    tenerla: este proyecto ya se quemo con `codex-review`,
+ *    documentado en la maquina de estados e inexistente.
+ *
+ * La estrictez con las claves desconocidas es segura porque la §7.3 de
+ * la metodologia garantiza que todo el equipo corre la misma version
+ * del plugin: no hay un escenario de "clave nueva leida por un plugin
+ * viejo" que justifique tragarsela.
+ */
+import { existsSync, readFileSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { parseBloqueClaveValor } from './frontmatter.js';
+export class ConfigError extends Error {
+    constructor(message) {
+        super(message);
+        this.name = 'ConfigError';
+    }
+}
+/**
+ * El comportamiento de hoy, escrito una sola vez. Antes de C4 estos
+ * tres valores vivian: 'develop' literal en git.ts, 'general-purpose'
+ * DUPLICADO en new.ts e import.ts, y el 1 implicito en el
+ * `bloqueantes.length > 0` de start.ts. Ahora esta es su unica fuente.
+ */
+export const CONFIG_DEFAULTS = Object.freeze({
+    rama_base: 'develop',
+    agente_revisor_por_defecto: 'general-purpose',
+    limite_wip: 1,
+});
+/** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
+export const CLAVES_CONFIG = [
+    'rama_base',
+    'agente_revisor_por_defecto',
+    'limite_wip',
+];
+export const CONFIG_DIR = '.taskcode';
+export const CONFIG_FILE = 'config.yml';
+/**
+ * Raiz del repo: se sube desde `cwd` hasta encontrar un `.git`
+ * (directorio en un clon normal, fichero en un worktree o submodulo).
+ * Si no hay ninguno, se usa `cwd` tal cual.
+ *
+ * Por que la raiz y no el cwd a secas: la configuracion es DEL REPO, y
+ * "taskctl board" ejecutado desde `docs/` tiene que ver la misma que
+ * ejecutado desde la raiz. Lo contrario haria que el limite de WIP o
+ * la rama base cambiaran segun desde donde escribes, que es justo la
+ * clase de comportamiento que nadie diagnostica.
+ *
+ * Por que se PARA en el `.git` y no se sigue subiendo: si se siguiera,
+ * un `.taskcode/config.yml` olvidado en el home configuraria en
+ * silencio todos los repos de la maquina. Una sola ubicacion canonica
+ * por repo, o ninguna.
+ *
+ * No se usa `git rev-parse --show-toplevel` a proposito: obligaria a
+ * config.ts a importar fs/git.ts, que a su vez importa este modulo
+ * (ciclo), y a pagar un spawn de git por resolucion.
+ */
+export function raizDelRepo(cwd) {
+    let dir = path.resolve(cwd);
+    for (;;) {
+        if (existsSync(path.join(dir, '.git')))
+            return dir;
+        const padre = path.dirname(dir);
+        if (padre === dir)
+            return path.resolve(cwd);
+        dir = padre;
+    }
+}
+/** Ruta canonica del fichero de configuracion para ese cwd. */
+export function rutaConfig(cwd) {
+    return path.join(raizDelRepo(cwd), CONFIG_DIR, CONFIG_FILE);
+}
+/**
+ * EL punto de resolucion (regla 4). Devuelve la configuracion con los
+ * defaults ya aplicados, o lanza ConfigError.
+ *
+ * Casos de "no hay configuracion", que devuelven los defaults sin
+ * quejarse: no existe `.taskcode/`, existe `.taskcode/` pero sin
+ * `config.yml` (ENOENT en ambos), y `config.yml` vacio o con solo
+ * comentarios (ninguna clave = todas por defecto). Un fichero vacio es
+ * una forma legitima de decir "todo por defecto"; tratarlo como error
+ * castigaria a quien deja el fichero preparado para llenarlo luego.
+ *
+ * CUALQUIER otro fallo de lectura (permisos, `.taskcode` que resulta
+ * ser un fichero, `config.yml` que resulta ser un directorio) SI
+ * aborta: son configuraciones rotas, no configuraciones ausentes, y
+ * tragarselas seria exactamente la caida al default en silencio que la
+ * regla 2 prohibe.
+ *
+ * Es sincrona porque resolveBaseBranchForTipo lo es, y ese es su
+ * consumidor principal. No cachea: el coste es un readFileSync por
+ * comando y una cache introduciria estado global compartido entre
+ * tests.
+ */
+export function resolverConfig(cwd) {
+    const ruta = rutaConfig(cwd);
+    let contenido;
+    try {
+        contenido = readFileSync(ruta, 'utf8');
+    }
+    catch (e) {
+        if (e.code === 'ENOENT') {
+            // ENOENT no basta para concluir "no hay configuracion": si
+            // `.taskcode` resulta ser un FICHERO, leer `.taskcode/config.yml`
+            // falla con ENOTDIR en POSIX pero con ENOENT en Windows, y ahi
+            // caiamos al default en silencio contradiciendo lo que dice el
+            // comentario de arriba (hallazgo MENOR de la revision por pares,
+            // TASK-030). Es la misma trampa que costo una ronda entera en
+            // TASK-027: un fix de errno validado en una sola plataforma no
+            // esta validado. Por eso se le pregunta al sistema de ficheros,
+            // que contesta igual en las dos.
+            const dir = path.dirname(ruta);
+            let esDirectorio;
+            try {
+                esDirectorio = statSync(dir).isDirectory();
+            }
+            catch {
+                // `.taskcode` no existe: no hay configuracion, que es legitimo.
+                return { ...CONFIG_DEFAULTS };
+            }
+            if (!esDirectorio) {
+                throw new ConfigError(`[ERROR] "${dir}" existe pero no es una carpeta, asi que ahi no puede haber ` +
+                    'ninguna configuracion.\n' +
+                    '        Renombralo o borralo: taskctl no sigue con una configuracion que no ' +
+                    'puede leer.');
+            }
+            // `.taskcode/` existe y no tiene config.yml: todo por defecto.
+            return { ...CONFIG_DEFAULTS };
+        }
+        const msg = e instanceof Error ? e.message : String(e);
+        throw new ConfigError(`[ERROR] No se pudo leer la configuracion "${ruta}": ${msg}\n` +
+            '        Borrala o arregla sus permisos: taskctl no sigue sin saber que dice.');
+    }
+    return parsearConfig(contenido, ruta);
+}
+/**
+ * Separada de resolverConfig para poder probar el parseo y la
+ * validacion sin disco, y para que el mensaje de error siempre pueda
+ * nombrar el fichero de donde salio el problema.
+ */
+export function parsearConfig(contenido, ruta) {
+    const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
+        etiqueta: 'config',
+        crearError: (mensaje) => new ConfigError(`[ERROR] ${ruta}: ${mensaje}`),
+        permitirComentariosDeLinea: true,
+    });
+    const config = { ...CONFIG_DEFAULTS };
+    const vistas = new Set();
+    for (const par of pares) {
+        const donde = `${ruta}:${par.numeroLinea}`;
+        if (!CLAVES_CONFIG.includes(par.clave)) {
+            throw new ConfigError(mensajeClaveDesconocida(donde, par.clave));
+        }
+        // Una clave repetida se pisaria en silencio (el ultimo gana) y el
+        // fichero diria una cosa mientras el plugin usa otra: mismo dano
+        // que un default silencioso, misma respuesta.
+        if (vistas.has(par.clave)) {
+            throw new ConfigError(`[ERROR] ${donde}: la clave "${par.clave}" esta repetida.\n` +
+                '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.');
+        }
+        vistas.add(par.clave);
+        switch (par.clave) {
+            case 'rama_base':
+                config.rama_base = validarTextoNoVacio(donde, par.clave, par.valor);
+                break;
+            case 'agente_revisor_por_defecto':
+                config.agente_revisor_por_defecto = validarTextoNoVacio(donde, par.clave, par.valor);
+                break;
+            case 'limite_wip':
+                config.limite_wip = validarEnteroPositivo(donde, par.clave, par.valor);
+                break;
+        }
+    }
+    return config;
+}
+/**
+ * Enumera SIEMPRE las claves validas (criterio de la decision #9: el
+ * mensaje dice que esta mal y cuales son las validas) y, si la escrita
+ * se parece mucho a una de ellas, la propone. El caso motivador es
+ * literal: `limite_wp`.
+ */
+function mensajeClaveDesconocida(donde, clave) {
+    const sugerida = claveMasParecida(clave);
+    const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
+    if (sugerida !== null)
+        lineas.push(`        Quiza quisiste decir "${sugerida}".`);
+    lineas.push(`        Claves validas: ${CLAVES_CONFIG.join(', ')}.`);
+    return lineas.join('\n');
+}
+/** Distancia de edicion (Levenshtein) a mano — cero dependencias, como el resto. */
+function distanciaEdicion(a, b) {
+    let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
+    for (let i = 1; i <= a.length; i++) {
+        const actual = [i];
+        for (let j = 1; j <= b.length; j++) {
+            const coste = a[i - 1] === b[j - 1] ? 0 : 1;
+            actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
+        }
+        previa = actual;
+    }
+    return previa[b.length];
+}
+/** La clave valida mas cercana, si esta lo bastante cerca como para ser una errata. */
+function claveMasParecida(clave) {
+    let mejor = null;
+    let mejorDistancia = Number.POSITIVE_INFINITY;
+    for (const valida of CLAVES_CONFIG) {
+        const d = distanciaEdicion(clave.toLowerCase(), valida);
+        if (d < mejorDistancia) {
+            mejorDistancia = d;
+            mejor = valida;
+        }
+    }
+    // Umbral: hasta un tercio de la clave. Sin el, "foo" propondria
+    // "rama_base" y el consejo dejaria de valer nada.
+    return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
+}
+/**
+ * Texto no vacio. Se guarda RECORTADO: `rama_base: " develop "` es
+ * develop, no " develop " — misma doctrina que personaDeTarea en
+ * wip.ts, donde un valor entrecomillado con espacios ya provoco un
+ * hallazgo de revision por pares.
+ *
+ * No se valida que `rama_base` sea un nombre de rama legal: esa regla
+ * la tiene Git (y isValidBranchName la consulta preguntandoselo a el).
+ * Reimplementarla aqui crearia una segunda fuente de verdad que
+ * podria rechazar ramas que Git acepta.
+ */
+function validarTextoNoVacio(donde, clave, valor) {
+    if (valor === null) {
+        throw new ConfigError(`[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
+            `        O le das un valor, o borras la linea (por defecto: ` +
+            `"${CONFIG_DEFAULTS[clave]}").`);
+    }
+    if (typeof valor !== 'string') {
+        throw new ConfigError(`[ERROR] ${donde}: "${clave}" debe ser texto, y es ${describirValor(valor)}.`);
+    }
+    const recortado = valor.trim();
+    if (recortado === '') {
+        throw new ConfigError(`[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
+            `        O le das un valor, o borras la linea (por defecto: ` +
+            `"${CONFIG_DEFAULTS[clave]}").`);
+    }
+    return recortado;
+}
+/** Entero >= 1. Un limite de 0 no es "sin limite": es "no se puede trabajar". */
+function validarEnteroPositivo(donde, clave, valor) {
+    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
+        throw new ConfigError(`[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 1, ` +
+            `y es ${describirValor(valor)}.\n` +
+            `        Por defecto es ${CONFIG_DEFAULTS.limite_wip}. Un 0 o un negativo no ` +
+            'significan "sin limite": impedirian arrancar cualquier tarea.');
+    }
+    return valor;
+}
+/** Como se nombra un valor rechazado en un mensaje de error. */
+function describirValor(valor) {
+    if (valor === null)
+        return 'un valor vacio';
+    if (Array.isArray(valor))
+        return `una lista (${JSON.stringify(valor)})`;
+    if (typeof valor === 'string')
+        return `el texto "${valor}"`;
+    return `${String(valor)} (${typeof valor})`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/frontmatter.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/frontmatter.js
new file mode 100644
index 0000000..1bc4580
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/frontmatter.js
@@ -0,0 +1,207 @@
+/**
+ * Parser y serializador minimo de YAML-frontmatter, escrito a mano
+ * (sin dependencias externas). Soporta el subconjunto de YAML que usa
+ * `tarea.md`: escalares, cadenas entre comillas dobles, listas en
+ * estilo flow ([a, b, c]), null, booleanos, numeros enteros y
+ * comentarios de linea (`# ...`) tras el valor.
+ *
+ * No es un parser YAML general: no soporta anidamiento, listas en
+ * bloque (con "-"), ni multilinea. Eso es deliberado: es mas barato
+ * de escribir, de revisar y de mantener que tirar de una libreria
+ * completa para un formato que nosotros mismos controlamos.
+ *
+ * Desde TASK-030 (item C4) el bucle `clave: valor` vive extraido en
+ * parseBloqueClaveValor() y lo comparten este modulo y
+ * src/core/config.ts (`.taskcode/config.yml`), que usa exactamente el
+ * mismo subconjunto. Es un unico parser a proposito: dos parsers YAML
+ * escritos a mano del mismo subconjunto acaban discrepando.
+ *
+ * Nota de robustez (hallazgo de revision por pares, Sprint 0):
+ * cualquier string que se serializa se cita SIEMPRE que, sin comillas,
+ * se re-parsearia como otra cosa (numero, boolean, null, o un
+ * elemento de lista con coma) — no solo cuando "contiene caracteres
+ * raros". Esto evita que un titulo como "2026" o "true" se convierta
+ * en un numero/boolean al releerlo y rompa la validacion de Task.
+ */
+const FRONTMATTER_DELIM = '---';
+export class FrontmatterParseError extends Error {
+    constructor(message) {
+        super(message);
+        this.name = 'FrontmatterParseError';
+    }
+}
+/**
+ * El bucle `clave: valor` compartido — extraido de parseFrontmatter en
+ * TASK-030 (item C4) para que `.taskcode/config.yml` NO tenga un
+ * segundo parser de YAML. Dos parsers a mano del mismo subconjunto
+ * divergen; este es el unico sitio donde se decide que es una linea
+ * valida, que es un comentario y como se tipa un escalar.
+ *
+ * No conoce ni frontmatter ni config: recibe por donde empezar, como
+ * saber que el bloque termino y como construir sus errores.
+ */
+export function parseBloqueClaveValor(lineas, desde, opciones) {
+    const data = {};
+    const pares = [];
+    let i = desde;
+    let cerrado = false;
+    for (; i < lineas.length; i++) {
+        const line = lineas[i] ?? '';
+        if (opciones.esFin !== undefined && opciones.esFin(line)) {
+            cerrado = true;
+            i++;
+            break;
+        }
+        const trimmed = line.trim();
+        if (trimmed === '')
+            continue;
+        if (opciones.permitirComentariosDeLinea === true && trimmed.startsWith('#'))
+            continue;
+        const colonIdx = line.indexOf(':');
+        if (colonIdx === -1) {
+            throw opciones.crearError(`Linea de ${opciones.etiqueta} invalida (falta ":"): "${line}"`);
+        }
+        const clave = line.slice(0, colonIdx).trim();
+        if (clave === '') {
+            throw opciones.crearError(`Linea de ${opciones.etiqueta} con clave vacia: "${line}"`);
+        }
+        const rawValue = stripInlineComment(line.slice(colonIdx + 1).trim());
+        const valor = parseScalarOrArray(rawValue);
+        data[clave] = valor;
+        pares.push({ clave, valor, numeroLinea: i + 1 });
+    }
+    return { data, pares, siguiente: i, cerrado };
+}
+export function parseFrontmatter(content) {
+    const lines = content.split(/\r?\n/);
+    if ((lines[0] ?? '').trim() !== FRONTMATTER_DELIM) {
+        throw new FrontmatterParseError('El documento no empieza con un bloque frontmatter "---".');
+    }
+    const { data, siguiente, cerrado } = parseBloqueClaveValor(lines, 1, {
+        etiqueta: 'frontmatter',
+        crearError: (mensaje) => new FrontmatterParseError(mensaje),
+        esFin: (linea) => linea.trim() === FRONTMATTER_DELIM,
+    });
+    if (!cerrado) {
+        throw new FrontmatterParseError('El bloque frontmatter no se cierra con "---".');
+    }
+    const body = lines.slice(siguiente).join('\n').replace(/^\n+/, '');
+    return { data, body };
+}
+export function serializeFrontmatter(data, body, order) {
+    const lines = [FRONTMATTER_DELIM];
+    for (const key of order) {
+        if (!(key in data))
+            continue;
+        lines.push(`${key}: ${serializeValue(data[key])}`);
+    }
+    lines.push(FRONTMATTER_DELIM);
+    const bodyTrimmed = body.replace(/^\n+/, '');
+    const bodyPart = bodyTrimmed.length > 0 ? `\n${bodyTrimmed}` : '\n';
+    return lines.join('\n') + bodyPart;
+}
+function stripInlineComment(raw) {
+    if (raw.startsWith('"')) {
+        const closeIdx = findClosingQuote(raw);
+        if (closeIdx !== -1)
+            return raw.slice(0, closeIdx + 1);
+        return raw;
+    }
+    const hashIdx = raw.indexOf(' #');
+    if (hashIdx !== -1)
+        return raw.slice(0, hashIdx).trim();
+    return raw;
+}
+/** Indice de la comilla de cierre real, ignorando comillas escapadas (\"). */
+function findClosingQuote(raw) {
+    for (let j = 1; j < raw.length; j++) {
+        if (raw[j] === '"' && raw[j - 1] !== '\\')
+            return j;
+    }
+    return -1;
+}
+function parseScalarOrArray(raw) {
+    const trimmed = raw.trim();
+    if (trimmed === '' || trimmed === 'null' || trimmed === '~')
+        return null;
+    if (trimmed === 'true')
+        return true;
+    if (trimmed === 'false')
+        return false;
+    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
+        const inner = trimmed.slice(1, -1).trim();
+        if (inner === '')
+            return [];
+        return splitTopLevelCommas(inner).map((s) => unquote(s.trim()));
+    }
+    if (/^-?\d+$/.test(trimmed))
+        return parseInt(trimmed, 10);
+    return unquote(trimmed);
+}
+/**
+ * Divide el interior de una lista flow ([a, "b, c", d]) por comas que
+ * no esten dentro de comillas, para que un elemento citado con coma
+ * dentro no se parta en dos.
+ */
+function splitTopLevelCommas(s) {
+    const parts = [];
+    let current = '';
+    let inQuotes = false;
+    for (let i = 0; i < s.length; i++) {
+        const c = s[i];
+        if (c === '"' && s[i - 1] !== '\\') {
+            inQuotes = !inQuotes;
+            current += c;
+            continue;
+        }
+        if (c === ',' && !inQuotes) {
+            parts.push(current);
+            current = '';
+            continue;
+        }
+        current += c;
+    }
+    parts.push(current);
+    return parts;
+}
+function unquote(s) {
+    if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
+        return s.slice(1, -1).replace(/\\"/g, '"');
+    }
+    return s;
+}
+function serializeValue(v) {
+    if (v === null || v === undefined)
+        return 'null';
+    if (typeof v === 'boolean')
+        return v ? 'true' : 'false';
+    if (typeof v === 'number')
+        return String(v);
+    if (Array.isArray(v)) {
+        return `[${v.map((x) => serializeScalarString(String(x))).join(', ')}]`;
+    }
+    return serializeScalarString(String(v));
+}
+/**
+ * Cita un string si, sin comillas, se re-parsearia como otra cosa
+ * (numero, boolean, null) o rompe el formato (contiene ":", "#",
+ * "[", "]", ",", '"', o un espacio). Es intencionalmente conservador:
+ * mejor citar de mas que perder el tipo en el roundtrip.
+ */
+function serializeScalarString(s) {
+    return needsQuoting(s) ? quoteString(s) : s;
+}
+function needsQuoting(s) {
+    if (s === '')
+        return true;
+    if (s === 'null' || s === '~' || s === 'true' || s === 'false')
+        return true;
+    if (/^-?\d+$/.test(s))
+        return true;
+    if (/[:#[\],"]/.test(s) || s.includes(' '))
+        return true;
+    return false;
+}
+function quoteString(s) {
+    return `"${s.replace(/"/g, '\\"')}"`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/import-parser.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/import-parser.js
new file mode 100644
index 0000000..fc64c0d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/import-parser.js
@@ -0,0 +1,105 @@
+/**
+ * Parser determinista (sin LLM) de un fichero Markdown con varias
+ * tareas para `taskctl import` (TASK-004 de PLAN_SPRINTS.md). Formato
+ * esperado, por entrada:
+ *
+ *   ### <Titulo de la tarea>
+ *   - <criterio de aceptacion 1>
+ *   - <criterio de aceptacion 2>
+ *
+ * Solo los encabezados de nivel 3 ("###") delimitan una tarea; un
+ * encabezado de cualquier otro nivel (#, ##, ####...) cierra la
+ * entrada en curso (si la hay) sin consumirse como criterio, y
+ * cualquier contenido antes del primer "###" se ignora (preambulo del
+ * documento, p. ej. un titulo de nivel 1 para el fichero entero).
+ *
+ * Este modulo es puro: no toca disco ni conoce `Task`. Una entrada
+ * "malformada" no lanza excepcion — se devuelve como dato (ok: false)
+ * para que el llamador decida que hacer con las demas entradas del
+ * mismo fichero (criterio de aceptacion de TASK-004: una entrada mala
+ * no debe impedir que las demas se importen).
+ *
+ * Punto de extension documentado, sin implementar en Sprint 0
+ * (seccion 16.2 de la metodologia): una entrada que no encaja en este
+ * formato podria repararse en el futuro con una llamada a un LLM antes
+ * de darla por invalida. Hoy `runImportCommand` (src/commands/import.ts)
+ * simplemente reporta el motivo exacto por stderr y sigue con las
+ * demas.
+ */
+const HEADING_LEVEL_3_RE = /^###\s+(.*)$/;
+const ANY_HEADING_RE = /^#{1,6}\s/;
+// Tolera indentacion inicial (hallazgo IMPORTANTE de revision por
+// pares, TASK-004): una lista indentada con espacios es Markdown
+// valido y visualmente identica a una sin indentar en cualquier
+// renderizador — anclarla a la columna 0 rechazaba la tarea ENTERA
+// con un mensaje que no explicaba la causa real.
+const LIST_ITEM_RE = /^\s*[-*]\s+(.+)$/;
+export function parseImportMarkdown(content) {
+    const lines = content.split(/\r?\n/);
+    const entries = [];
+    let current = null;
+    const flush = () => {
+        if (current === null)
+            return;
+        const titulo = current.tituloRaw.trim();
+        if (titulo === '') {
+            entries.push({
+                ok: false,
+                tituloRaw: current.tituloRaw,
+                lineNumber: current.lineNumber,
+                motivo: `El encabezado "###" de la linea ${current.lineNumber} no tiene titulo.`,
+            });
+        }
+        else if (current.strayLine !== null) {
+            entries.push({
+                ok: false,
+                tituloRaw: titulo,
+                lineNumber: current.lineNumber,
+                motivo: `La linea ${current.strayLine.lineNumber} no es un criterio de lista ("- ..." o ` +
+                    `"* ...") ni una linea en blanco: "${current.strayLine.text}"`,
+            });
+        }
+        else if (current.criterios.length === 0) {
+            entries.push({
+                ok: false,
+                tituloRaw: titulo,
+                lineNumber: current.lineNumber,
+                motivo: `"${titulo}" no tiene ningun criterio de aceptacion (una lista "- ...") antes del ` +
+                    'siguiente encabezado.',
+            });
+        }
+        else {
+            entries.push({ ok: true, titulo, lineNumber: current.lineNumber, criterios: current.criterios });
+        }
+        current = null;
+    };
+    for (let i = 0; i < lines.length; i++) {
+        const line = lines[i] ?? '';
+        const h3 = HEADING_LEVEL_3_RE.exec(line);
+        if (h3) {
+            flush();
+            current = { tituloRaw: h3[1] ?? '', lineNumber: i + 1, criterios: [], strayLine: null };
+            continue;
+        }
+        if (current === null)
+            continue; // preambulo antes del primer "###": se ignora.
+        if (ANY_HEADING_RE.test(line)) {
+            // Encabezado de otro nivel (no "###"): cierra la entrada actual
+            // sin consumir esta linea como criterio ni como parte de ella.
+            flush();
+            continue;
+        }
+        if (line.trim() === '')
+            continue;
+        const li = LIST_ITEM_RE.exec(line);
+        if (li) {
+            current.criterios.push((li[1] ?? '').trim());
+            continue;
+        }
+        if (current.strayLine === null) {
+            current.strayLine = { text: line, lineNumber: i + 1 };
+        }
+    }
+    flush();
+    return entries;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js
new file mode 100644
index 0000000..4410a44
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/state-machine.js
@@ -0,0 +1,133 @@
+export class StateMachineError extends Error {
+    taskId;
+    command;
+    estadoActual;
+    comandoRequerido;
+    constructor(taskId, command, estadoActual, 
+    /** Comando exacto que hay que ejecutar antes, si aplica. */
+    comandoRequerido, message) {
+        super(message);
+        this.taskId = taskId;
+        this.command = command;
+        this.estadoActual = estadoActual;
+        this.comandoRequerido = comandoRequerido;
+        this.name = 'StateMachineError';
+    }
+}
+const TRIVIAL_SIN_APROBACION = ['trivial', 'simple'];
+function err(taskId, command, estadoActual, comandoRequerido, reason) {
+    const lines = [`[ERROR] ${taskId} ${reason}`];
+    if (comandoRequerido) {
+        lines.push(`        Ejecuta: ${comandoRequerido} ${taskId}`);
+    }
+    return new StateMachineError(taskId, command, estadoActual, comandoRequerido, lines.join('\n'));
+}
+/**
+ * Valida si `command` puede ejecutarse sobre `task` en este momento.
+ * Lanza StateMachineError si no; no devuelve nada si es valido.
+ * `existe` distingue "import"/"new" (la tarea no debe existir aun)
+ * del resto de comandos (la tarea debe existir).
+ */
+export function assertTransitionAllowed(command, task, ctx = {}) {
+    if (command === 'import' || command === 'new') {
+        if (task !== null) {
+            throw err(task.id, command, task.estado, null, `ya existe (estado actual: "${task.estado}"). taskctl ${command} no puede reutilizar un ID existente.`);
+        }
+        return;
+    }
+    if (task === null) {
+        throw err('(desconocida)', command, 'no-existe', null, 'no existe todavia. Usa taskctl import o taskctl new primero.');
+    }
+    switch (command) {
+        case 'plan': {
+            const primeraVez = task.estado === 'planificada';
+            const rePlanificar = task.estado === 'en-diseno' && task.plan_aprobado === false;
+            if (!primeraVez && !rePlanificar) {
+                if (task.estado === 'en-diseno' && task.plan_aprobado) {
+                    throw err(task.id, command, task.estado, 'taskctl start', 'ya tiene un plan aprobado. Usa taskctl start para arrancar la ejecucion.');
+                }
+                throw err(task.id, command, task.estado, null, `esta en estado "${task.estado}", no en "planificada" ni en "en-diseno" pendiente de re-planificar.`);
+            }
+            return;
+        }
+        case 'approve': {
+            if (task.estado !== 'en-diseno') {
+                throw err(task.id, command, task.estado, 'taskctl plan', `esta en estado "${task.estado}", no en "en-diseno". taskctl approve requiere haber ejecutado taskctl plan primero.`);
+            }
+            // Fail-closed a proposito (hallazgo de revision por pares,
+            // Sprint 0): si el llamador no pasa planFinalExiste, no se
+            // asume que existe. Antes solo se bloqueaba con `=== false`
+            // explicito, lo que dejaba pasar approve sin haber comprobado
+            // nada cuando el contexto venia vacio.
+            if (ctx.planFinalExiste !== true) {
+                throw err(task.id, command, task.estado, 'taskctl plan', 'todavia no tiene un plan-final.md que aprobar. Ejecuta taskctl plan primero.');
+            }
+            return;
+        }
+        case 'start': {
+            if (task.estado !== 'en-diseno') {
+                throw err(task.id, command, task.estado, 'taskctl plan', `esta en estado "${task.estado}", no en "en-diseno". taskctl start requiere haber ejecutado taskctl plan primero.`);
+            }
+            const exigeAprobacion = !TRIVIAL_SIN_APROBACION.includes(task.complejidad);
+            if (exigeAprobacion && !task.plan_aprobado) {
+                throw err(task.id, command, task.estado, 'taskctl approve', 'no ha pasado por taskctl approve (complejidad no trivial/simple exige aprobacion humana).');
+            }
+            return;
+        }
+        case 'review': {
+            if (task.estado !== 'en-curso') {
+                throw err(task.id, command, task.estado, 'taskctl start', `esta en estado "${task.estado}", no en "en-curso". taskctl review requiere haber ejecutado taskctl start primero.`);
+            }
+            return;
+        }
+        case 'codex-review': {
+            if (task.estado !== 'en-revision') {
+                throw err(task.id, command, task.estado, 'taskctl review', `esta en estado "${task.estado}", no en "en-revision". taskctl codex-review requiere haber ejecutado taskctl review primero.`);
+            }
+            if (!task.revision_codex) {
+                throw err(task.id, command, task.estado, null, 'no tiene revision_codex activada en su tarea.md.');
+            }
+            if (ctx.revisionPrimariaAprobada !== true) {
+                throw err(task.id, command, task.estado, null, 'todavia no tiene una revision primaria aprobada.');
+            }
+            return;
+        }
+        case 'finish': {
+            if (task.estado !== 'en-revision') {
+                // Una tarea ya terminada no necesita "ejecuta taskctl review"
+                // (hallazgo menor de revision por pares, TASK-014).
+                if (task.estado === 'terminada') {
+                    throw err(task.id, command, task.estado, null, 'ya esta terminada.');
+                }
+                throw err(task.id, command, task.estado, 'taskctl review', `esta en estado "${task.estado}", no en "en-revision". taskctl finish requiere que la tarea haya pasado por revision.`);
+            }
+            if (ctx.revisionPrimariaAprobada !== true) {
+                throw err(task.id, command, task.estado, null, 'no ha pasado revision todavia (revision primaria no aprobada).');
+            }
+            if (task.revision_codex && ctx.revisionCodexAprobada !== true) {
+                throw err(task.id, command, task.estado, 'taskctl codex-review', 'tiene revision_codex activada pero esa revision independiente no esta aprobada.');
+            }
+            return;
+        }
+    }
+}
+/** Estado resultante esperado tras ejecutar `command` con exito. */
+export function resultingState(command, task) {
+    switch (command) {
+        case 'import':
+        case 'new':
+            return 'planificada';
+        case 'plan':
+        case 'approve':
+            return 'en-diseno';
+        case 'start':
+            return 'en-curso';
+        case 'review':
+        case 'codex-review':
+            return 'en-revision';
+        case 'finish':
+            return 'terminada';
+        default:
+            return task.estado;
+    }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-file.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-file.js
new file mode 100644
index 0000000..d4d9da3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/tarea-file.js
@@ -0,0 +1,17 @@
+/**
+ * Combina el parser generico de frontmatter con la validacion de
+ * Task para leer/escribir ficheros `tarea.md` completos.
+ */
+import { parseFrontmatter, serializeFrontmatter } from './frontmatter.js';
+import { validateTask, TASK_FIELD_ORDER } from './task.js';
+export function parseTareaFile(content) {
+    const { data, body } = parseFrontmatter(content);
+    const task = validateTask(data);
+    return { task, body };
+}
+export function serializeTareaFile(task, body) {
+    // Revalida antes de escribir: nunca se serializa un Task que no
+    // pasaria su propio parser (evita escribir ficheros corruptos).
+    const validated = validateTask(task);
+    return serializeFrontmatter(validated, body, TASK_FIELD_ORDER);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task-id.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task-id.js
new file mode 100644
index 0000000..9ec1120
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task-id.js
@@ -0,0 +1,19 @@
+/**
+ * Generacion determinista del siguiente ID de tarea (TASK-003 de
+ * PLAN_SPRINTS.md): maximo ID existente + 1, sin colisiones, sin
+ * tocar el sistema de archivos (eso lo hace src/fs/task-store.ts).
+ */
+const TASK_ID_RE = /^TASK-(\d{3,})$/;
+export function nextTaskId(existingIds) {
+    let max = 0;
+    for (const id of existingIds) {
+        const m = TASK_ID_RE.exec(id);
+        if (!m)
+            continue;
+        const n = parseInt(m[1], 10);
+        if (n > max)
+            max = n;
+    }
+    const next = max + 1;
+    return `TASK-${String(next).padStart(3, '0')}`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js
new file mode 100644
index 0000000..99918ca
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/task.js
@@ -0,0 +1,162 @@
+/**
+ * Modelo de datos de una tarea (`tarea.md`) y su validacion. Ver
+ * seccion 4 de docs/PROPUESTA_METODOLOGIA.md para la plantilla de
+ * referencia.
+ */
+export const TASK_TYPES = ['feature', 'fix', 'hotfix', 'release'];
+export const TASK_COMPLEXITIES = [
+    'trivial',
+    'simple',
+    'media',
+    'alta',
+    'critica',
+];
+export const TASK_STATES = [
+    'planificada',
+    'en-diseno',
+    'en-curso',
+    'en-revision',
+    'terminada',
+];
+/** Carpeta numerada del ciclo de vida (seccion 5 de la metodologia). */
+export const STATE_FOLDER = {
+    planificada: '00-planificadas',
+    'en-diseno': '01-en-diseno',
+    'en-curso': '02-en-curso',
+    'en-revision': '03-en-revision',
+    terminada: '04-terminadas',
+};
+/** Orden de campos tal y como aparecen en la plantilla (seccion 4). */
+export const TASK_FIELD_ORDER = [
+    'id',
+    'titulo',
+    'tipo',
+    'sprint',
+    'etiquetas',
+    'complejidad',
+    'modelo_sugerido',
+    'estado',
+    'plan_aprobado',
+    'rama',
+    'asignado_a',
+    'agente_revisor',
+    'skills_recomendados',
+    'ultimo_commit_revisado',
+    'revision_codex',
+    'creado',
+    'actualizado',
+    'dependencias',
+];
+const TASK_ID_RE = /^TASK-\d{3,}$/;
+/** Valida el formato de un ID de tarea sin construir un Task completo.
+ *  Se usa como guarda de seguridad ANTES de construir rutas de archivo
+ *  a partir de un ID que puede venir de fuera (CLI), para evitar path
+ *  traversal (hallazgo de revision por pares, Sprint 0). */
+export function isValidTaskId(id) {
+    return TASK_ID_RE.test(id);
+}
+export class InvalidTaskIdError extends Error {
+    id;
+    constructor(id) {
+        super(`"${id}" no es un ID de tarea valido (se espera el formato TASK-NNN).`);
+        this.id = id;
+        this.name = 'InvalidTaskIdError';
+    }
+}
+/** Lanza InvalidTaskIdError si `id` no tiene el formato TASK-NNN.
+ *  Debe llamarse ANTES de usar el id en cualquier ruta de archivo. */
+export function assertValidTaskId(id) {
+    if (!isValidTaskId(id)) {
+        throw new InvalidTaskIdError(id);
+    }
+}
+export class TaskValidationError extends Error {
+    field;
+    constructor(field, message) {
+        super(message);
+        this.field = field;
+        this.name = 'TaskValidationError';
+    }
+}
+function fail(field, message) {
+    throw new TaskValidationError(field, message);
+}
+function requireString(data, field) {
+    const v = data[field];
+    if (typeof v !== 'string' || v.trim() === '') {
+        fail(field, `El campo "${field}" es obligatorio y debe ser una cadena no vacia.`);
+    }
+    return v;
+}
+function requireNullableString(data, field) {
+    const v = data[field];
+    if (v === null || v === undefined)
+        return null;
+    if (typeof v !== 'string') {
+        fail(field, `El campo "${field}" debe ser una cadena o null.`);
+    }
+    return v;
+}
+function requireNumber(data, field) {
+    const v = data[field];
+    if (typeof v !== 'number' || !Number.isInteger(v)) {
+        fail(field, `El campo "${field}" debe ser un numero entero.`);
+    }
+    return v;
+}
+function requireBoolean(data, field) {
+    const v = data[field];
+    if (typeof v !== 'boolean') {
+        fail(field, `El campo "${field}" debe ser true o false.`);
+    }
+    return v;
+}
+function requireStringArray(data, field) {
+    const v = data[field];
+    if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
+        fail(field, `El campo "${field}" debe ser una lista de cadenas (p. ej. [a, b]).`);
+    }
+    return v;
+}
+function requireEnum(data, field, allowed) {
+    const v = requireString(data, field);
+    if (!allowed.includes(v)) {
+        fail(field, `El campo "${field}" tiene el valor "${v}", pero debe ser uno de: ${allowed.join(', ')}.`);
+    }
+    return v;
+}
+/**
+ * Valida y convierte un objeto generico (tal como lo devuelve
+ * parseFrontmatter) en un Task tipado. Lanza TaskValidationError con
+ * el primer campo invalido que encuentra.
+ */
+export function validateTask(data) {
+    const id = requireString(data, 'id');
+    if (!TASK_ID_RE.test(id)) {
+        fail('id', `El campo "id" ("${id}") debe tener el formato TASK-NNN (al menos 3 digitos).`);
+    }
+    const task = {
+        id,
+        titulo: requireString(data, 'titulo'),
+        tipo: requireEnum(data, 'tipo', TASK_TYPES),
+        sprint: requireNumber(data, 'sprint'),
+        etiquetas: requireStringArray(data, 'etiquetas'),
+        complejidad: requireEnum(data, 'complejidad', TASK_COMPLEXITIES),
+        modelo_sugerido: requireString(data, 'modelo_sugerido'),
+        estado: requireEnum(data, 'estado', TASK_STATES),
+        plan_aprobado: requireBoolean(data, 'plan_aprobado'),
+        rama: requireString(data, 'rama'),
+        asignado_a: requireNullableString(data, 'asignado_a'),
+        agente_revisor: requireString(data, 'agente_revisor'),
+        skills_recomendados: requireStringArray(data, 'skills_recomendados'),
+        ultimo_commit_revisado: requireNullableString(data, 'ultimo_commit_revisado'),
+        revision_codex: requireBoolean(data, 'revision_codex'),
+        creado: requireString(data, 'creado'),
+        actualizado: requireString(data, 'actualizado'),
+        dependencias: requireStringArray(data, 'dependencias'),
+    };
+    if (task.sprint < 0) {
+        fail('sprint', 'El campo "sprint" no puede ser negativo.');
+    }
+    return task;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/wip.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/wip.js
new file mode 100644
index 0000000..f261262
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/wip.js
@@ -0,0 +1,207 @@
+/**
+ * Limite de trabajo en curso (WIP) por persona — TASK-015, item B7 del
+ * checklist de terminacion. Modulo puro: recibe las tareas ya leidas y
+ * decide; no toca disco ni Git.
+ *
+ * ALCANCE, que lo fija la decision #13 y NO coincide con la seccion
+ * 8.2 de la metodologia: un UNICO limite, y solo sobre la ejecucion.
+ *
+ * - "taskctl plan" no comprueba nada. En diseno no hay tope: se pueden
+ *   tener varias tareas en 01-en-diseno a la vez.
+ * - "taskctl start" aborta si la persona asignada ya tiene otra tarea
+ *   en 02-en-curso o en 03-en-revision.
+ *
+ * La 8.2 describe dos limites independientes, uno de ellos sobre el
+ * diseno ("carlos ya tiene TASK-009 en diseno"). La metodologia esta
+ * congelada, asi que la divergencia se documenta en HALLAZGOS.md en
+ * vez de reescribirla.
+ *
+ * Por que 03-en-revision ocupa hueco: la rama de una tarea en revision
+ * sigue viva y sin mergear hasta "taskctl finish", y es ahi donde se
+ * commitean las correcciones de los hallazgos. Si el hueco se liberara
+ * al pasar a revision, quedarian dos ramas abiertas y los commits de
+ * correccion de la primera acabarian en la segunda — exactamente el
+ * fallo que este limite existe para evitar ("evitar que se programe
+ * codigo de una tarea en la rama Git de otra tarea", Carlos, #13).
+ */
+import { STATE_FOLDER } from './task.js';
+import { CONFIG_DEFAULTS } from './config.js';
+/**
+ * Estados cuya carpeta ocupa el hueco de ejecucion.
+ */
+export const ESTADOS_QUE_OCUPAN_WIP = ['en-curso', 'en-revision'];
+/**
+ * Cuantas tareas ocupadas admite una persona antes de que la siguiente
+ * quede bloqueada. Desde TASK-030 (item C4) es configurable con
+ * `limite_wip` en `.taskcode/config.yml`; el valor por defecto vive en
+ * CONFIG_DEFAULTS y es 1, que es lo que este modulo hacia siempre.
+ *
+ * Este modulo SIGUE siendo puro: recibe el limite ya resuelto, no lee
+ * el fichero. Solo importa la constante del default para no reescribir
+ * el 1 aqui y que puedan divergir.
+ */
+export const LIMITE_WIP_POR_DEFECTO = CONFIG_DEFAULTS.limite_wip;
+/**
+ * Normaliza un "asignado_a" para COMPARAR (nunca para escribir): lo
+ * recorta y trata la cadena vacia como "sin asignar".
+ *
+ * Dos hallazgos MENOR de revision por pares, TASK-015, salian de no
+ * hacerlo:
+ *
+ * - El flag --asignado-a recorta su valor (B6), pero el frontmatter no:
+ *   parseScalarOrArray solo recorta lo NO entrecomillado, asi que un
+ *   `asignado_a: "carlos "` escrito a mano no era igual a `carlos` y
+ *   dejaba abrir una segunda rama a la misma persona.
+ * - `asignado_a: ""` pasaba la validacion como si fuera una persona, de
+ *   modo que dos tareas "sin asignar en vacio" se bloqueaban entre si
+ *   (y el mensaje salia sin nombre), mientras que dos con null no. Dos
+ *   representaciones de lo mismo con semantica opuesta.
+ *
+ * No normaliza mayusculas: eso si seria inventar una equivalencia que
+ * no existe en el resto del sistema (ver tareasQueBloquean).
+ */
+export function personaDeTarea(asignado) {
+    if (asignado === null)
+        return null;
+    const v = asignado.trim();
+    return v === '' ? null : v;
+}
+/**
+ * Decide quien queda asignado a una tarea (TASK-024, item C7). Un
+ * unico sitio con la regla de precedencia, compartido por "plan" y
+ * "start" para que no puedan divergir:
+ *
+ * 1. `flag` — lo que se paso en --asignado-a. Manda siempre: es la via
+ *    para asignar a otra persona, y la salida que ofrece el error de
+ *    WIP de B7 ("reasigna con --asignado-a").
+ * 2. `previo` — el asignado_a que ya tuviera la tarea. Ejecutar un
+ *    comando sobre la tarea de otra persona NO se la queda.
+ * 3. `identidad` — git config user.email, la novedad de TASK-024.
+ * 4. null.
+ *
+ * Que el paso 2 vaya antes que el 3 es lo que evita el robo
+ * silencioso: si Ana planifico TASK-030 y Carlos ejecuta "start"
+ * sin flag, la tarea sigue siendo de Ana — y el limite de WIP se
+ * comprueba contra Ana, que es quien tiene la rama abierta. Para
+ * quedarsela, Carlos tiene que decirlo.
+ *
+ * Los tres valores pasan por personaDeTarea, asi que un "  " o un ""
+ * cuentan como ausentes en cualquiera de los escalones.
+ */
+export function resolverAsignado(flag, previo, identidad) {
+    if (flag !== undefined) {
+        const delFlag = personaDeTarea(flag);
+        if (delFlag !== null)
+            return delFlag;
+    }
+    const delPrevio = personaDeTarea(previo);
+    if (delPrevio !== null)
+        return delPrevio;
+    return personaDeTarea(identidad);
+}
+/**
+ * Tareas de `persona` que ocupan el hueco, excluida la que se intenta
+ * arrancar. Devuelve la lista ordenada por ID para que el mensaje de
+ * error sea reproducible: las tareas llegan aqui en el orden en que el
+ * disco las entrego, que no es estable.
+ *
+ * `tareas` deben venir ya filtradas a ESTADOS_QUE_OCUPAN_WIP (es lo
+ * que hace listTareasEnEstados); esta funcion no vuelve a mirar el
+ * estado, solo la persona.
+ *
+ * La comparacion de persona es EXACTA y sensible a mayusculas, sobre
+ * el valor ya recortado que escribe parseAsignadoAFlag (B6).
+ * "asignado_a" es texto libre y ningun otro punto del sistema trata
+ * "Carlos" y "carlos" como la misma persona — inventar aqui una
+ * equivalencia que "taskctl board" no tiene crearia una incoherencia
+ * nueva.
+ *
+ * `limite` (TASK-030, item C4) es cuantas tareas ocupadas se toleran.
+ * Devolver [] cuando todavia caben es lo que permite que el limite sea
+ * configurable sin que el llamante cambie su forma de preguntar: sigue
+ * siendo "si esta lista no esta vacia, no puedes arrancar". Con el
+ * valor por defecto (1) el resultado es identico al de antes de C4:
+ * cualquier otra tarea ocupada bloquea.
+ */
+export function tareasQueBloquean(tareas, persona, idQueArranca, limite = LIMITE_WIP_POR_DEFECTO) {
+    const buscada = personaDeTarea(persona);
+    if (buscada === null)
+        return [];
+    const ocupadas = tareas
+        .filter((t) => t.task.id !== idQueArranca && personaDeTarea(t.task.asignado_a) === buscada)
+        .sort((a, b) => a.task.id.localeCompare(b.task.id));
+    // Se devuelven TODAS las ocupadas, no solo las que sobran: el
+    // mensaje de error tiene que poder nombrar cual hay que cerrar, y
+    // con un limite de 3 y 3 abiertas no hay ninguna "sobrante" — hay
+    // tres candidatas.
+    return ocupadas.length >= limite ? ocupadas : [];
+}
+/** Una linea por tarea bloqueante: ID, titulo, carpeta REAL y rama. */
+function describirBloqueante(t) {
+    return (`          - ${t.task.id} "${t.task.titulo}" ` +
+        `(${STATE_FOLDER[t.estadoCarpeta]}, rama ${t.task.rama})`);
+}
+/**
+ * Mensaje de "no puedes arrancar esta". Nombra explicitamente la tarea
+ * que bloquea (criterio de aceptacion de TASK-015) y dice QUE HACER,
+ * no solo que ha fallado — mismo estilo que log_error de los scripts
+ * de Git-Flow y que el resto de errores de taskctl.
+ */
+export function mensajeWipExcedido(idQueArranca, persona, bloqueantes, limite = LIMITE_WIP_POR_DEFECTO) {
+    const primera = bloqueantes[0];
+    const lineas = [];
+    if (bloqueantes.length === 1) {
+        lineas.push(`[ERROR] ${idQueArranca}: ${persona} ya tiene ${primera.task.id} sin cerrar ` +
+            `(${STATE_FOLDER[primera.estadoCarpeta]}, rama ${primera.task.rama}).`);
+    }
+    else {
+        // Con el limite por defecto (1), mas de una solo puede pasar si el
+        // repo ya estaba en un estado inconsistente. Con un limite mayor es
+        // el caso normal. En los dos se listan todas en vez de enganar
+        // nombrando solo la primera.
+        lineas.push(`[ERROR] ${idQueArranca}: ${persona} ya tiene ${bloqueantes.length} tareas sin cerrar:`);
+        for (const t of bloqueantes)
+            lineas.push(describirBloqueante(t));
+    }
+    // El texto para limite 1 se conserva literal: es el que prueban los
+    // tests de B7 y el que la gente reconoce. Con un limite configurado
+    // mayor, decir "una sola tarea por persona" seria sencillamente
+    // mentira, asi que se dice el numero real y de donde sale.
+    if (limite === 1) {
+        lineas.push('        Una sola tarea en curso por persona: esa rama sigue abierta y sin mergear,');
+    }
+    else {
+        lineas.push(`        El limite es de ${limite} tareas por persona (limite_wip en ` +
+            '.taskcode/config.yml): esa rama sigue abierta y sin mergear,');
+    }
+    lineas.push('        y ahi es donde se commitean las correcciones de su revision.');
+    // El consejo NO dice "ejecuta taskctl finish" a secas (hallazgo MENOR
+    // de revision por pares, TASK-015): si la bloqueante esta en
+    // 02-en-curso, "finish" todavia falla porque le falta pasar por
+    // "review", y si esta en 03-en-revision falla mientras el informe no
+    // este aprobado — justo el caso mas doloroso, el de una revision que
+    // se alarga. Prometer un comando que no funciona es peor que no
+    // proponer ninguno.
+    lineas.push(`        Para desbloquearte: termina ${primera.task.id} (su revision y despues ` +
+        `"taskctl finish ${primera.task.id}"),`);
+    lineas.push('        o reasigna con --asignado-a la tarea que quieras dejar para luego.');
+    return lineas.join('\n');
+}
+/**
+ * Mensaje de "no puedo saberlo": hay un tarea.md ilegible en una de
+ * las carpetas que ocupan hueco, asi que no se puede descartar que sea
+ * de esta persona. Fail-closed a proposito — la duda aqui autorizaria
+ * abrir una segunda rama.
+ */
+export function mensajeWipIndeterminado(idQueArranca, ilegibles) {
+    const lineas = [
+        `[ERROR] ${idQueArranca}: no se puede comprobar el limite de trabajo en curso porque ` +
+            `${ilegibles.length === 1 ? 'hay una tarea ilegible' : 'hay tareas ilegibles'} en las ` +
+            'carpetas de ejecucion:',
+    ];
+    for (const ruta of ilegibles)
+        lineas.push(`          - ${ruta}`);
+    lineas.push('        No se sabe de quien son, asi que podrian ser justo las que bloquean.');
+    lineas.push('        Arregla su frontmatter y reintenta.');
+    return lineas.join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js
new file mode 100644
index 0000000..25b8b97
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js
@@ -0,0 +1,256 @@
+/**
+ * Auto-commit de taskctl — paso 5 de la seccion 8.3 (TASK-030, item
+ * C2, decision #14: "commitea si, sube solo con --push").
+ *
+ * Existe porque hoy `taskctl` escribe ficheros que luego nadie
+ * commitea: de los 9 commits que costo TASK-029, 4 existian solo para
+ * registrar lo que el propio CLI acababa de escribir. Ademas, dejar el
+ * workspace sucio es lo que hace que `taskctl import` no se pueda
+ * ejecutar dos veces seguidas (el guard de la 8.3 aborta la segunda),
+ * un fallo documentado en HALLAZGOS.md.
+ *
+ * Las cuatro reglas de diseno, por orden de importancia:
+ *
+ * 1. **Se commitean SOLO las rutas que taskctl acaba de escribir.**
+ *    Nunca un `git add -A` a secas. El guard de la 8.3
+ *    (`ensureBaseBranchReady`) exige workspace limpio, pero solo lo
+ *    aplican 4 de los 8 comandos: en `start`, `review` y `finish`
+ *    puede haber trabajo de la persona en el arbol, y barrerlo dentro
+ *    de un commit automatico seria exactamente el dano que esta
+ *    herramienta existe para evitar. Dos mecanismos independientes lo
+ *    garantizan aqui:
+ *      - cada ruta se prepara con su propio `git add -A -- <ruta>`
+ *        (el `-A` va ACOTADO por el pathspec: prepara altas, bajas y
+ *        modificaciones bajo esa ruta y nada mas — hace falta para que
+ *        el borrado de la carpeta de origen de un `moveTareaFile`
+ *        entre en el mismo commit que el alta de la de destino, si no
+ *        el commit registraria una copia y no un movimiento);
+ *      - el commit se hace con `git commit -m <msg> -- <rutas>`, que
+ *        es pathspec-limitado (modo `--only`): aunque la persona
+ *        tuviera OTROS ficheros ya preparados con `git add`, no entran
+ *        en el commit y siguen preparados despues. Comprobado, no
+ *        supuesto: con `src/algo.ts` en estado `MM` antes del commit,
+ *        sigue en `MM` despues y el commit solo contiene las rutas de
+ *        taskctl.
+ * 2. **Nada que commitear, ningun commit.** Si tras preparar las rutas
+ *    el indice no difiere de HEAD, no se crea un commit vacio.
+ * 3. **Si el commit falla, se falla ruidosamente.** Un hook de
+ *    pre-commit, una firma GPG rechazada o una identidad de Git sin
+ *    configurar no se tragan: el mensaje dice que la tarea esta
+ *    ESCRITA pero NO registrada, y en que estado queda el arbol.
+ * 4. **`--push` empuja la rama actual**, y sin remoto avisa y sigue —
+ *    misma doctrina que `detect_origin_available` en
+ *    `_gitflow-common.sh` y que el `--push` que `taskctl pause` ya
+ *    tiene (que hace literalmente `git push origin <rama actual>`).
+ *    No se inventa vocabulario nuevo.
+ */
+import { existsSync } from 'node:fs';
+import path from 'node:path';
+import { GitCommandError, currentBranch, isRemoteAvailable, runGit } from './git.js';
+export class AutoCommitError extends Error {
+}
+/**
+ * Los scripts de Git-Flow procesan los mensajes de commit, asi que
+ * este repo los escribe sin tildes (CLAUDE.md). Aqui se comprueba
+ * mecanicamente en vez de confiar en que cada generador se acuerde: es
+ * la clase de regla que se cumple durante tres meses y luego no.
+ *
+ * Ojo al cablear comandos nuevos: por eso ninguno de los mensajes
+ * incluye el TITULO de la tarea, que es texto libre de la persona y
+ * puede llevar tildes con todo el derecho.
+ */
+function assertMensajeAscii(mensaje) {
+    if (mensaje.trim() === '') {
+        throw new AutoCommitError('[ERROR] El mensaje de commit automatico no puede estar vacio.');
+    }
+    const malo = /[^\x20-\x7E\n]/.exec(mensaje);
+    if (malo !== null) {
+        throw new AutoCommitError(`[ERROR] El mensaje de commit automatico contiene un caracter no ASCII ` +
+            `(${JSON.stringify(malo[0])}): "${mensaje}". Los scripts de Git-Flow procesan estos ` +
+            'mensajes y este repo los escribe sin tildes.');
+    }
+}
+/**
+ * Mensaje de commit determinista en el estilo del repo:
+ * `chore(TASK-030): tarea en curso`. Un solo sitio donde vive el
+ * formato, y de paso donde se valida que no lleve tildes.
+ */
+export function mensajeChore(scope, resumen) {
+    // Comprobados por separado: `chore(TASK-030): ` con el resumen vacio
+    // no es una cadena vacia, asi que la comprobacion del mensaje
+    // completo no lo veria pasar — y un commit sin asunto es
+    // exactamente lo que un `${}` mal cableado produce.
+    if (scope.trim() === '' || resumen.trim() === '') {
+        throw new AutoCommitError(`[ERROR] Mensaje de commit automatico incompleto: scope="${scope}", resumen="${resumen}".`);
+    }
+    const mensaje = `chore(${scope}): ${resumen}`;
+    assertMensajeAscii(mensaje);
+    return mensaje;
+}
+/**
+ * Pasa una ruta a pathspec relativo al cwd de Git, con separadores
+ * POSIX (Git los acepta en las dos plataformas; los `\` de Windows,
+ * no siempre).
+ *
+ * Rechaza cualquier cosa que se salga de `cwd`, incluida la propia
+ * raiz: un pathspec vacio o "." convertiria `git add -A -- <ruta>` en
+ * el `git add -A` global que la regla 1 prohibe, y seria un fallo
+ * silencioso — el commit saldria bien y se llevaria por delante el
+ * trabajo de la persona.
+ */
+function normalizarRuta(cwd, ruta) {
+    const rel = path.relative(cwd, path.resolve(cwd, ruta));
+    if (rel === '' || rel === '.' || rel.startsWith('..') || path.isAbsolute(rel)) {
+        throw new AutoCommitError(`[ERROR] Ruta invalida para el commit automatico: "${ruta}" no esta dentro de ` +
+            `"${cwd}". taskctl solo commitea lo que el mismo acaba de escribir.`);
+    }
+    return rel.split(path.sep).join('/');
+}
+/**
+ * true si esa ruta tiene algo que Git pueda preparar: existe en disco
+ * (alta o modificacion) o tiene entradas en el indice (baja, p. ej. la
+ * carpeta de origen de un movimiento de tarea). Sin esta comprobacion,
+ * `git add` muere con `fatal: pathspec ... did not match any files`
+ * (exit 128) y tumbaria el comando por una ruta que sencillamente no
+ * tiene nada que aportar.
+ */
+function tieneAlgoQuePreparar(cwd, rutaRel) {
+    if (existsSync(path.resolve(cwd, rutaRel)))
+        return true;
+    return runGit(['ls-files', '--', rutaRel], cwd) !== '';
+}
+/**
+ * Commitea (y opcionalmente sube) EXCLUSIVAMENTE las rutas indicadas.
+ * Ver la cabecera del fichero para las cuatro reglas que cumple.
+ */
+export function autoCommit(opts) {
+    assertMensajeAscii(opts.mensaje);
+    const { cwd } = opts;
+    const avisos = [];
+    const rama = currentBranch(cwd);
+    // Deduplicadas y ordenadas para que el commando de Git sea
+    // determinista (y los tests puedan aseverar sobre el).
+    const rutasRel = [...new Set(opts.rutas.map((r) => normalizarRuta(cwd, r)))].sort();
+    const presentes = rutasRel.filter((r) => tieneAlgoQuePreparar(cwd, r));
+    let commiteado = false;
+    let commit = null;
+    let ficheros = [];
+    if (presentes.length > 0) {
+        // Una a una, a proposito: un pathspec por invocacion deja claro en
+        // el log de Git (y en un strace, si hiciera falta) que no hay
+        // ningun `git add` sin acotar por ahi.
+        for (const rutaRel of presentes) {
+            try {
+                runGit(['add', '-A', '--', rutaRel], cwd);
+            }
+            catch (e) {
+                throw new AutoCommitError(`[ERROR] taskctl escribio los ficheros de la tarea pero no pudo preparar ` +
+                    `"${rutaRel}" para el commit: ${detalleDeError(e)}. Los cambios estan en el ` +
+                    'arbol de trabajo; revisa el motivo y commitealos a mano.');
+            }
+        }
+        // Regla 2: si el indice no difiere de HEAD bajo estas rutas, no
+        // hay commit que hacer (p. ej. "taskctl approve" sobre una tarea
+        // que ya estaba aprobada y con la misma fecha).
+        ficheros = runGit(['diff', '--cached', '--name-only', '--', ...presentes], cwd)
+            .split('\n')
+            .map((l) => l.trim())
+            .filter((l) => l !== '');
+        if (ficheros.length > 0) {
+            try {
+                runGit(['commit', '-m', opts.mensaje, '--', ...presentes], cwd);
+            }
+            catch (e) {
+                throw new AutoCommitError(`[ERROR] taskctl escribio los ficheros de la tarea pero NO pudo commitearlos: ` +
+                    `${detalleDeError(e)}. Estan preparados (git add) en la rama "${rama}": revisa el ` +
+                    'motivo (un hook de pre-commit, una firma GPG, o "git config user.email" sin ' +
+                    'configurar) y haz el commit a mano. La tarea esta escrita pero no registrada.');
+            }
+            commiteado = true;
+            commit = runGit(['rev-parse', '--short', 'HEAD'], cwd);
+            // Hallazgo IMPORTANTE de la revision por pares (TASK-030): la
+            // lista de arriba es lo que taskctl PIDIO commitear, no lo que
+            // Git registro. Un hook de pre-commit que haga "git add" por su
+            // cuenta (lint-staged, prettier) mete ficheros ajenos en el
+            // commit — eso es semantica de Git en modo --only y se reproduce
+            // con "git commit -- ruta" a pelo, sin taskctl de por medio. Lo
+            // que si era nuestro es que el CLI dijera "1 fichero" cuando Git
+            // habia registrado 2: en el unico escenario donde la regla se
+            // rompe, la herramienta afirmaba lo contrario. Asi que la lista
+            // se relee del commit y, si no coincide, se avisa.
+            const pedidos = ficheros;
+            ficheros = runGit(['show', '--name-only', '--format=', 'HEAD'], cwd)
+                .split('\n')
+                .map((l) => l.trim())
+                .filter((l) => l !== '');
+            const intrusos = ficheros.filter((f) => !pedidos.includes(f));
+            if (intrusos.length > 0) {
+                avisos.push(`El commit ${commit} incluye ${intrusos.length} fichero(s) que taskctl no pidio ` +
+                    `commitear: ${intrusos.join(', ')}. Casi seguro los ha anadido un hook de ` +
+                    'pre-commit de este repo (lint-staged, prettier o similar). Revisa el commit: ' +
+                    'taskctl solo pidio registrar lo que escribio el mismo.');
+            }
+        }
+    }
+    return { commiteado, commit, ficheros, rama, push: empujar(opts, rama, avisos), avisos };
+}
+/**
+ * `--push` empuja la RAMA ACTUAL, se haya commiteado algo en esta
+ * invocacion o no — exactamente lo que hace `pause-work.sh --push`,
+ * que tambien empuja cuando el workspace ya estaba limpio. Sin origin
+ * alcanzable avisa y sigue (exit 0); si el push se intenta y falla, se
+ * falla ruidosamente diciendo que el commit SI se creo.
+ */
+function empujar(opts, rama, avisos) {
+    if (opts.push !== true)
+        return 'no-solicitado';
+    if (rama === '') {
+        avisos.push('Se pidio --push pero HEAD esta desacoplado (no hay rama activa): no se ha subido nada.');
+        return 'sin-rama';
+    }
+    if (!isRemoteAvailable(opts.cwd)) {
+        avisos.push(`Se pidio --push pero no hay conexion con origin (sin remoto configurado, o VPN/red ` +
+            `caida): "${rama}" no se ha subido. Se continua en modo local.`);
+        return 'sin-remoto';
+    }
+    try {
+        runGit(['push', 'origin', rama], opts.cwd);
+    }
+    catch (e) {
+        throw new AutoCommitError(`[ERROR] El trabajo quedo commiteado en "${rama}", pero el push a origin fallo: ` +
+            `${detalleDeError(e)}. Sube la rama a mano ("git push origin ${rama}") cuando ` +
+            'resuelvas el motivo.');
+    }
+    return 'empujado';
+}
+function detalleDeError(e) {
+    if (e instanceof GitCommandError) {
+        return e.stderr.trim() === '' ? e.message : e.stderr.trim();
+    }
+    return e instanceof Error ? e.message : String(e);
+}
+/**
+ * Saca `--push` / `-p` de argv y devuelve el resto.
+ *
+ * No se delega en `parseArgs` a proposito: ese parser trata
+ * `--flag valor` como par, asi que `taskctl plan --push TASK-030` se
+ * habria leido como `push="TASK-030"` y la tarea habria desaparecido
+ * de los posicionales. Como `--push` es booleano puro, quitarlo antes
+ * de parsear es mas simple que ensenarle al parser que hay flags sin
+ * valor.
+ *
+ * `-p` se acepta ademas de `--push` porque `pause-work.sh` ya acepta
+ * las dos formas: mismo flag, mismo significado, mismo vocabulario.
+ */
+export function extraerPushFlag(argv) {
+    const resto = [];
+    let push = false;
+    for (const arg of argv) {
+        if (arg === '--push' || arg === '-p') {
+            push = true;
+            continue;
+        }
+        resto.push(arg);
+    }
+    return { push, resto };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js
new file mode 100644
index 0000000..713c8db
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js
@@ -0,0 +1,442 @@
+/**
+ * Wrapper minimo sobre comandos Git puntuales que taskctl necesita
+ * ejecutar el mismo (no via los scripts de Git-Flow): comprobar si el
+ * workspace esta limpio y confirmar la rama activa. Deliberadamente
+ * pequeno — la logica de Git-Flow en si (crear/mergear ramas) vive en
+ * scripts/gitflow/, no aqui (ver seccion 7.1 de la metodologia: los
+ * scripts .sh siguen siendo la unica fuente de verdad para eso).
+ */
+import { spawnSync } from 'node:child_process';
+import { existsSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+import { resolverConfig } from '../core/config.js';
+export class GitCommandError extends Error {
+    args;
+    stderr;
+    constructor(args, stderr) {
+        super(`git ${args.join(' ')} fallo: ${stderr.trim() || '(sin salida de error)'}`);
+        this.args = args;
+        this.stderr = stderr;
+        this.name = 'GitCommandError';
+    }
+}
+/**
+ * "git" no se pudo ni siquiera lanzar (no esta en el PATH, etc.) —
+ * distinto de GitCommandError (git se ejecuto pero devolvio un error).
+ * Sin esto, un ENOENT de spawnSync se propagaba como Error generico y
+ * terminaba en el catch-all de bin/taskctl con un mensaje enganoso
+ * ("taskctl no pudo arrancar"), como si el propio CLI hubiera fallado
+ * al arrancar en vez de faltarle una dependencia externa en tiempo de
+ * ejecucion (hallazgo de revision por pares, TASK-009).
+ */
+export class GitLaunchError extends Error {
+    originalError;
+    constructor(originalError) {
+        super(`No se pudo ejecutar "git": ${originalError.message}`);
+        this.originalError = originalError;
+        this.name = 'GitLaunchError';
+    }
+}
+// El default de spawnSync (1 MB) mata a git con ENOBUFS en cuanto un
+// diff real supera ese tamano — lockfiles o codigo generado lo hacen
+// sin esfuerzo (hallazgo IMPORTANTE de revision por pares, TASK-013:
+// dejaba "taskctl review" inutilizable para esa tarea, con el merge de
+// update ya consumado). 64 MB cubre cualquier diff razonable.
+const GIT_MAX_BUFFER = 64 * 1024 * 1024;
+/**
+ * Exportada en TASK-030 (integracion): git-commit.ts la necesitaba y,
+ * al no poder tocar este fichero durante el trabajo en paralelo, llevo
+ * un clon de estas mismas diez lineas. Dos copias de la traduccion de
+ * errores de Git a excepciones es justo lo que acaba divergiendo.
+ */
+export function runGit(args, cwd) {
+    const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER });
+    if (result.error) {
+        throw new GitLaunchError(result.error);
+    }
+    if (result.status !== 0) {
+        throw new GitCommandError(args, result.stderr ?? '');
+    }
+    return (result.stdout ?? '').trim();
+}
+/** true si `git status --porcelain` no devuelve nada (workspace limpio). */
+export function isWorkspaceClean(cwd) {
+    return runGit(['status', '--porcelain'], cwd) === '';
+}
+/**
+ * true si `cwd` esta dentro del ARBOL DE TRABAJO de un repositorio
+ * Git (TASK-026). No pasa por runGit a proposito, igual que
+ * gitUserEmail: "esto no es un repo" es una respuesta valida, no un
+ * error que deba propagarse como GitCommandError.
+ *
+ * Es `--is-inside-work-tree` y no `--git-dir` porque los cinco
+ * wrappers de Git-Flow trabajan sobre ficheros del arbol: en un repo
+ * bare, o con el cwd dentro de `.git/`, `--git-dir` habria dicho que
+ * si y el comando habria muerto un proceso mas abajo con el "fatal"
+ * crudo de Git, o peor, diagnose-repo.sh habria declarado limpio un
+ * workspace que no existe (hallazgo MENOR de revision por pares).
+ */
+export function isInsideWorkTree(cwd) {
+    const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
+        cwd,
+        encoding: 'utf8',
+    });
+    if (result.error) {
+        throw new GitLaunchError(result.error);
+    }
+    return result.status === 0 && (result.stdout ?? '').trim() === 'true';
+}
+/**
+ * Que operacion multi-paso hay a medias en el repo, si es que hay
+ * alguna (TASK-026, ampliada en TASK-029). Mira exactamente los mismos
+ * testigos que `abort-merge.sh` — y eso es deliberado: si taskctl
+ * detectara mas que el script habria dos comportamientos distintos
+ * segun haya terminal o no.
+ *
+ * Cada ruta se resuelve con `git rev-parse --git-path` en vez de
+ * concatenar sobre --git-dir: asi sigue valiendo dentro de un
+ * worktree enlazado, donde estos ficheros no viven en el .git
+ * principal (comprobado: en un worktree enlazado con un cherry-pick a
+ * medias, --git-path devuelve .git/worktrees/<nombre>/CHERRY_PICK_HEAD
+ * y el fichero esta ahi).
+ *
+ * `--git-path` devuelve una ruta relativa al cwd de Git, no al
+ * proceso: se resuelve contra `cwd` antes de mirar el disco.
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
+ */
+export function operacionEnCurso(cwd) {
+    const gitPath = (nombre) => path.resolve(cwd, runGit(['rev-parse', '--git-path', nombre], cwd));
+    if (existsSync(gitPath('MERGE_HEAD')))
+        return 'merge';
+    if (existsSync(gitPath('rebase-merge')) || existsSync(gitPath('rebase-apply')))
+        return 'rebase';
+    if (existsSync(gitPath('CHERRY_PICK_HEAD')))
+        return 'cherry-pick';
+    if (existsSync(gitPath('REVERT_HEAD')))
+        return 'revert';
+    const sequencer = gitPath('sequencer');
+    if (existsSync(sequencer)) {
+        // El "todo" distingue las dos: sus entradas son "pick <sha>" para
+        // cherry-pick y "revert <sha>" para revert. Se mira el fichero
+        // entero, no solo su primera linea: Git no mezcla los dos verbos en
+        // una misma secuencia, asi que basta con encontrar uno. Si no se
+        // puede leer se asume cherry-pick, que es inofensivo: `git revert
+        // --abort` aborta un cherry-pick y viceversa (misma maquinaria).
+        let todo = '';
+        try {
+            todo = readFileSync(path.join(sequencer, 'todo'), 'utf8');
+        }
+        catch {
+            todo = '';
+        }
+        return /^revert /m.test(todo) ? 'revert' : 'cherry-pick';
+    }
+    return null;
+}
+/** Nombre de la rama activa (equivalente a `git branch --show-current`). */
+export function currentBranch(cwd) {
+    return runGit(['branch', '--show-current'], cwd);
+}
+/**
+ * true si `name` es un nombre de rama valido para Git (delega en
+ * `git check-ref-format`, la misma comprobacion que ya hace
+ * `assert_valid_branch_name` en _gitflow-common.sh). Defensa en
+ * profundidad (hallazgo menor de revision por pares, TASK-009): sin
+ * esto, un `task.rama` invalido solo se detecta varios procesos mas
+ * abajo, dentro del script de Git-Flow.
+ */
+export function isValidBranchName(name, cwd) {
+    const result = spawnSync('git', ['check-ref-format', '--branch', name], {
+        cwd,
+        encoding: 'utf8',
+    });
+    if (result.error) {
+        throw new GitLaunchError(result.error);
+    }
+    return result.status === 0;
+}
+/**
+ * true si "git ls-remote --heads origin" responde sin error: hay un
+ * remoto "origin" configurado y alcanzable. No distingue "no hay
+ * origin" de "hay origin pero no hay red" — ninguno de los dos casos
+ * cambia lo que taskctl debe hacer (seguir en modo local), igual que
+ * ya asume _gitflow-common.sh.
+ */
+export function isRemoteAvailable(cwd) {
+    const result = spawnSync('git', ['ls-remote', '--heads', 'origin'], { cwd, encoding: 'utf8' });
+    if (result.error) {
+        throw new GitLaunchError(result.error);
+    }
+    return result.status === 0;
+}
+/**
+ * Identidad Git de quien ejecuta el comando: el valor de
+ * `git config user.email`, o null si no hay ninguno configurado
+ * (TASK-024, item C7). Es lo que "plan" y "start" usan como
+ * asignado_a por defecto.
+ *
+ * Unica funcion de este modulo que NO pasa por runGit, a proposito:
+ * runGit convierte cualquier exit != 0 en GitCommandError, y
+ * `git config <clave>` sale con codigo 1 exactamente cuando la clave
+ * no existe. "Esta maquina no tiene identidad configurada" es un
+ * estado legitimo — la tarea se queda sin asignar, como antes de
+ * TASK-024 — y no un error que deba abortar el comando.
+ *
+ * Un fallo de lanzamiento de spawnSync SI se propaga como
+ * GitLaunchError. Ojo con su mensaje, que es el generico del modulo y
+ * culpa a Git: la causa habitual no es que falte el binario, sino que
+ * el cwd no exista (hallazgo MENOR de revision por pares, TASK-024).
+ */
+export function gitUserEmail(cwd) {
+    const result = spawnSync('git', ['config', 'user.email'], { cwd, encoding: 'utf8' });
+    if (result.error) {
+        throw new GitLaunchError(result.error);
+    }
+    if (result.status !== 0)
+        return null;
+    const email = (result.stdout ?? '').trim();
+    return email === '' ? null : email;
+}
+/**
+ * Nombres de todas las ramas LOCALES (TASK-025). Solo locales a
+ * proposito: mirar las remotas obligaria a un "fetch" — red, lentitud
+ * y un modo de fallo nuevo en un comando que hoy funciona sin
+ * conexion — y convertiria el limite de WIP, que es personal, en uno
+ * de equipo que nadie ha decidido.
+ */
+export function localBranches(cwd) {
+    return runGit(['for-each-ref', '--format=%(refname:short)', 'refs/heads'], cwd)
+        .split('\n')
+        .map((s) => s.trim())
+        .filter((s) => s.length > 0);
+}
+/** SHA completo del commit en HEAD. */
+export function headCommit(cwd) {
+    return runGit(['rev-parse', 'HEAD'], cwd);
+}
+/**
+ * true si `ancestor` es antepasado de `descendant` (via
+ * `git merge-base --is-ancestor`). Es la evidencia que usa
+ * "taskctl review" (TASK-013) para confirmar que el update desde la
+ * rama base ocurrio de verdad, en vez de fiarse del exit 0 del script
+ * — mismo principio "evidencia, no suposicion" de TASK-007/009.
+ */
+export function isAncestor(ancestor, descendant, cwd) {
+    // --end-of-options: sin el, una rama llamada -x (Git la permite via
+    // update-ref aunque git branch la rechace) se parsea como opcion y el
+    // comando muere con un error enganoso que ademas culpa a tareasRoot
+    // (hallazgo MENOR de revision por pares, TASK-025).
+    const args = ['merge-base', '--is-ancestor', '--end-of-options', ancestor, descendant];
+    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+    if (result.error) {
+        throw new GitLaunchError(result.error);
+    }
+    if (result.status === 0)
+        return true;
+    // Codigo 1 = "no es antepasado" (respuesta valida). Cualquier otro
+    // codigo es un error real (ref inexistente, repo corrupto...).
+    if (result.status === 1)
+        return false;
+    throw new GitCommandError(args, result.stderr ?? '');
+}
+/** `git log --oneline <desde>..<hasta>` (vacio si no hay commits). */
+export function logOneline(desde, hasta, cwd) {
+    return runGit(['log', '--oneline', `${desde}..${hasta}`], cwd);
+}
+/** `git diff <desde>..<hasta>` (vacio si no hay diferencias). */
+export function diffRange(desde, hasta, cwd) {
+    return runGit(['diff', `${desde}..${hasta}`], cwd);
+}
+/**
+ * Rutas (con "/" de Git, no separador del SO) de los ficheros bajo
+ * `prefix` en el arbol de `ref`, sin tocar el working tree. Lo usa
+ * "taskctl finish" (TASK-014) para detectar colisiones de IDs contra
+ * develop/main antes de mergear.
+ */
+export function lsTreeNames(ref, prefix, cwd) {
+    return runGit(['ls-tree', '-r', '--name-only', '--end-of-options', ref, '--', prefix], cwd)
+        .split('\n')
+        .filter((line) => line !== '');
+}
+/** Contenido de `filePath` (ruta con "/" de Git) en el arbol de `ref`. */
+export function showFileAtRef(ref, filePath, cwd) {
+    return runGit(['show', `${ref}:${filePath}`], cwd);
+}
+/** SHA del ancestro comun de `a` y `b` (git merge-base). */
+export function mergeBase(a, b, cwd) {
+    return runGit(['merge-base', a, b], cwd);
+}
+/** Cambia a una rama local existente (checkout -q). */
+export function checkoutBranch(name, cwd) {
+    runGit(['checkout', '-q', name], cwd);
+}
+/** true si existe una referencia LOCAL para esa rama. */
+export function localBranchExists(name, cwd) {
+    const result = spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${name}`], { cwd, encoding: 'utf8' });
+    if (result.error) {
+        throw new GitLaunchError(result.error);
+    }
+    return result.status === 0;
+}
+/** true si esa rama existe en "origin". Asume que ya se llamo isRemoteAvailable. */
+function remoteBranchExists(name, cwd) {
+    const output = runGit(['ls-remote', '--heads', 'origin', name], cwd);
+    return output
+        .split('\n')
+        .some((line) => line.trim().endsWith(`refs/heads/${name}`));
+}
+/**
+ * Reimplementacion en TypeScript de resolve_main_branch()
+ * (_gitflow-common.sh): que rama usar como base "principal" cuando no
+ * hay una preferencia explicita (orden: origin/main, origin/master,
+ * main local, master local, "master" por defecto). No se invoca la
+ * funcion Bash porque vive pensada para ser sourceada desde los
+ * scripts create-*.sh, no como script independiente invocable — mismo
+ * motivo por el que isValidBranchName (TASK-009) ya reimplemento
+ * assert_valid_branch_name en vez de intentar invocar la funcion sola.
+ */
+export function resolveMainBranch(cwd) {
+    if (isRemoteAvailable(cwd)) {
+        if (remoteBranchExists('main', cwd))
+            return 'main';
+        if (remoteBranchExists('master', cwd))
+            return 'master';
+    }
+    if (localBranchExists('main', cwd))
+        return 'main';
+    if (localBranchExists('master', cwd))
+        return 'master';
+    return 'master';
+}
+const RAMA_BASE_ES_DEVELOP = {
+    feature: true,
+    fix: true,
+    release: true,
+    hotfix: false,
+};
+/**
+ * Rama base esperada para un tipo de tarea (seccion 8.3): la rama base
+ * configurada para feature/fix/release, resolveMainBranch() para
+ * hotfix.
+ *
+ * Hasta TASK-030 (item C4) "develop" era un literal aqui — el unico
+ * hardcode de los tres de la decision #9 que no se podia detectar
+ * solo. Ahora sale de `.taskcode/config.yml` (clave `rama_base`), y
+ * sin fichero resolverConfig devuelve exactamente "develop": el
+ * comportamiento no cambia.
+ *
+ * El config se lee AQUI y no se pasa por parametro a proposito: este
+ * es el unico punto por el que pasan los 8 comandos para saber su rama
+ * base (via ensureBaseBranchReady, start y review), asi que cablearlo
+ * aqui garantiza que ninguno se quede fuera. Un parametro opcional
+ * dejaria que un comando futuro se olvidara de pasarlo y volviera al
+ * default en silencio, que es justo lo que la regla 2 de C4 prohibe.
+ *
+ * Los hotfix NO usan `rama_base`: cuelgan de la rama principal, que
+ * resolveMainBranch detecta sola. La decision #9 descarta
+ * `rama_principal` como clave precisamente porque esa deteccion ya
+ * funciona.
+ */
+export function resolveBaseBranchForTipo(tipo, cwd) {
+    if (!RAMA_BASE_ES_DEVELOP[tipo])
+        return resolveMainBranch(cwd);
+    return resolverConfig(cwd).rama_base;
+}
+export class BaseBranchGuardError extends Error {
+}
+/**
+ * Precondicion de la seccion 8.3, pasos 1 a 3 (TASK-012): resuelve la
+ * rama base esperada segun el tipo de tarea, aborta sin tocar nada si
+ * el workspace tiene cambios sin commitear, y si esta limpio pero no
+ * esta ya en la base, cambia automaticamente (creando tracking local a
+ * origin/<base> si hace falta y hay remoto) y hace "pull --ff-only"
+ * cuando hay remoto disponible. El paso 4 (logica propia de cada
+ * comando) lo hace el caller despues de que esto no lance. El paso 5
+ * (comitear y subir lo que el comando genere) queda fuera de alcance a
+ * proposito — ver el Objetivo de TASK-012 en su tarea.md.
+ */
+export function ensureBaseBranchReady(tipo, cwd) {
+    const branchAntes = currentBranch(cwd);
+    // Comprobacion sin red ANTES de resolver la rama base (que para
+    // "hotfix" puede necesitar hasta 3 "git ls-remote"): el caso mas
+    // comun de todos — workspace sucio — no deberia pagar ese coste
+    // (hallazgo menor de revision por pares, TASK-012). El mensaje no
+    // menciona la rama base esperada a proposito: es literalmente el
+    // ejemplo de la seccion 8.3 de la metodologia, que tampoco la
+    // menciona. Desde TASK-026 tambien nombra "taskctl pause", como el
+    // ejemplo de la 8.3 — hasta entonces se omitia porque ese comando
+    // no existia (hallazgo MENOR de revision por pares, TASK-026).
+    if (!isWorkspaceClean(cwd)) {
+        throw new BaseBranchGuardError(`[ERROR] Hay cambios sin guardar en "${branchAntes}". Guardalos ("taskctl pause") o ` +
+            'comitealos antes de continuar.');
+    }
+    const baseBranch = resolveBaseBranchForTipo(tipo, cwd);
+    if (branchAntes === baseBranch) {
+        return { baseBranch, switched: false, branchAntes };
+    }
+    const remoteAvailable = isRemoteAvailable(cwd);
+    const existeLocal = localBranchExists(baseBranch, cwd);
+    if (!existeLocal && !remoteAvailable) {
+        throw new BaseBranchGuardError(`[ERROR] La rama base "${baseBranch}" no existe en local y no hay conexion con origin ` +
+            'para crearla. Revisa el repo antes de continuar.');
+    }
+    try {
+        if (existeLocal) {
+            runGit(['checkout', '-q', baseBranch], cwd);
+        }
+        else {
+            runGit(['checkout', '-q', '-b', baseBranch, `origin/${baseBranch}`], cwd);
+        }
+    }
+    catch (e) {
+        const msg = e instanceof Error ? e.message : String(e);
+        throw new BaseBranchGuardError(`[ERROR] No se pudo cambiar a la rama base "${baseBranch}": ${msg}`);
+    }
+    // El pull va en su propio try/catch (hallazgo importante de revision
+    // por pares, TASK-012): si el checkout de arriba tuvo exito, la rama
+    // activa YA cambio de verdad, aunque el pull falle despues (por
+    // ejemplo, develop local diverge de origin/develop). Envolver ambos
+    // en un unico catch daba un mensaje que sonaba a "no se cambio de
+    // rama" cuando en realidad si se habia cambiado y se quedaba asi, sin
+    // deshacerse — el mensaje de aqui deja claro que el cambio de rama
+    // ya es un hecho consumado y hay que resolver el pull a mano.
+    if (remoteAvailable) {
+        try {
+            runGit(['pull', '--ff-only', 'origin', baseBranch], cwd);
+        }
+        catch (e) {
+            const msg = e instanceof Error ? e.message : String(e);
+            throw new BaseBranchGuardError(`[ERROR] Se cambio a la rama base "${baseBranch}" pero no se pudo actualizar con ` +
+                `"pull --ff-only": ${msg} La rama activa AHORA es "${baseBranch}" (el cambio de rama ` +
+                'no se deshizo); resuelve el pull a mano antes de reintentar.');
+        }
+    }
+    // Evidencia, no suposicion (mismo principio que TASK-007/009): un
+    // "git checkout" sin error no basta por si solo, se confirma la
+    // rama activa real antes de dejar seguir al comando.
+    const branchDespues = currentBranch(cwd);
+    if (branchDespues !== baseBranch) {
+        throw new BaseBranchGuardError(`[ERROR] Se intento cambiar a "${baseBranch}" pero la rama activa es "${branchDespues}". ` +
+            'No se ha tocado ningun fichero de la tarea; revisa el repo a mano.');
+    }
+    return { baseBranch, switched: true, branchAntes };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/gitflow-runner.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/gitflow-runner.js
new file mode 100644
index 0000000..4317a5b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/gitflow-runner.js
@@ -0,0 +1,79 @@
+/**
+ * Invocacion de los scripts de scripts/gitflow/ desde taskctl.
+ *
+ * Dos decisiones deliberadas, ambas motivadas por hallazgos de
+ * TASK-007/TASK-008:
+ *
+ * 1. Siempre `bash "<ruta>/script.sh"`, nunca ejecucion directa del
+ *    fichero: el bit +x no sobrevive en este repo (`core.fileMode`
+ *    en false — ver scripts/gitflow/README.md), y es mas robusto en
+ *    general (NTFS tampoco preserva permisos Unix).
+ * 2. `stdin: 'ignore'` POR DEFECTO, nunca `'inherit'` por descuido: si
+ *    por lo que sea un script del ciclo de vida SI llega a un
+ *    `read -rp` (no deberia, taskctl comprueba workspace limpio antes
+ *    de invocar), TASK-007 establecio que `read` con stdin no
+ *    interactivo recibe EOF de inmediato (no bloquea el proceso) —
+ *    ignorar stdin explicitamente hace ese comportamiento
+ *    determinista en vez de heredar lo que sea que tenga el proceso
+ *    padre, y evita que un `taskctl finish` se quede colgado
+ *    esperando en una tuberia que nadie va a cerrar.
+ *
+ * Los cinco wrappers de TASK-026 (`diagnose`, `pause`, `resume`,
+ * `recover`, `abort-merge`) son la excepcion, y por eso la opcion
+ * existe: sus scripts SI preguntan, y preguntar es justamente lo que
+ * se espera de ellos. Pasan `stdin: 'inherit'` de forma explicita;
+ * `start`, `review` y `finish` no la pasan y se quedan con 'ignore'.
+ */
+import { spawnSync } from 'node:child_process';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+function packageRoot() {
+    // dist/src/fs/gitflow-runner.js -> dist/src/fs -> dist/src -> dist -> raiz del paquete
+    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+    return path.join(moduleDir, '..', '..', '..');
+}
+/**
+ * Resuelve el directorio de scripts/gitflow/. Respeta
+ * CLAUDE_PLUGIN_ROOT (convencion documentada para cuando Claude Code
+ * lanza taskctl como comando de plugin) si esta definida; si no,
+ * calcula la ruta relativa al propio modulo compilado — necesario
+ * para el dogfooding directo (taskctl invocado a mano, como en este
+ * mismo repo) donde esa variable no esta puesta.
+ */
+export function resolveGitflowScriptsDir() {
+    const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+    if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
+        return path.join(pluginRoot, 'scripts', 'gitflow');
+    }
+    return path.join(packageRoot(), 'scripts', 'gitflow');
+}
+/**
+ * "bash" no se pudo ni siquiera lanzar (no esta en el PATH, etc.).
+ * Distinto de un exit code != 0 (el script SI corrio). Sin esto, el
+ * ENOENT de spawnSync se propagaba como Error generico y terminaba en
+ * el catch-all de bin/taskctl con un mensaje enganoso, como si taskctl
+ * mismo hubiera fallado al arrancar (hallazgo de revision por pares,
+ * TASK-009) — relevante porque en Windows "bash" solo esta en el PATH
+ * si Git for Windows lo expone.
+ */
+export class GitflowScriptLaunchError extends Error {
+    scriptName;
+    originalError;
+    constructor(scriptName, originalError) {
+        super(`No se pudo ejecutar "bash" para lanzar ${scriptName}: ${originalError.message}`);
+        this.scriptName = scriptName;
+        this.originalError = originalError;
+        this.name = 'GitflowScriptLaunchError';
+    }
+}
+export function runGitflowScript(scriptName, args, opts) {
+    const scriptPath = path.join(opts.scriptsDir, scriptName);
+    const result = spawnSync('bash', [scriptPath, ...args], {
+        cwd: opts.cwd,
+        stdio: [opts.stdin ?? 'ignore', 'inherit', 'inherit'],
+    });
+    if (result.error) {
+        throw new GitflowScriptLaunchError(scriptName, result.error);
+    }
+    return { code: result.status ?? 1, signal: result.signal ?? null };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/task-store.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/task-store.js
new file mode 100644
index 0000000..a738a38
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/task-store.js
@@ -0,0 +1,233 @@
+/**
+ * Unica capa que toca el sistema de archivos para leer/escribir
+ * tareas. Deliberadamente delgada: toda la logica de negocio
+ * (validacion, maquina de estados, generacion de ID) vive en
+ * src/core/, que es puro y se prueba sin tocar disco. Aqui solo se
+ * prueba el cableado (con directorios temporales).
+ *
+ * Seguridad (hallazgo de revision por pares, Sprint 0): todo ID que
+ * llega aqui se valida con assertValidTaskId ANTES de construir
+ * cualquier ruta, porque en cuanto existan comandos que reciban el ID
+ * como argumento de CLI (plan, approve, start...) un id sin sanear
+ * como "../../etc" podria escapar de tareasRoot.
+ */
+import { readdir, readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
+import path from 'node:path';
+import { STATE_FOLDER, assertValidTaskId, } from '../core/task.js';
+import { parseTareaFile, serializeTareaFile } from '../core/tarea-file.js';
+const ALL_STATE_FOLDERS = Object.values(STATE_FOLDER);
+const TASK_ID_RE = /^TASK-\d{3,}$/;
+export async function listExistingTaskIds(tareasRoot) {
+    const ids = [];
+    for (const folder of ALL_STATE_FOLDERS) {
+        const dir = path.join(tareasRoot, folder);
+        let entries;
+        try {
+            entries = await readdir(dir);
+        }
+        catch (e) {
+            if (isEnoent(e))
+                continue;
+            throw e;
+        }
+        for (const entry of entries) {
+            if (TASK_ID_RE.test(entry))
+                ids.push(entry);
+        }
+    }
+    return ids;
+}
+/**
+ * Lee las tareas que viven en las carpetas de `estados`, y solo esas
+ * (TASK-015). A diferencia de listExistingTaskIds + readTareaFile, no
+ * recorre el ciclo de vida entero: el limite de WIP solo mira dos
+ * carpetas, y readTareaFile busca por ID en todas, asi que usarlo aqui
+ * leeria de mas y ademas no diria en qué carpeta encontro cada tarea.
+ *
+ * Deduplica por ID: si el mismo ID aparece en dos carpetas de estado a
+ * la vez (inconsistencia de datos que "taskctl board" ya reporta como
+ * advertencia), ocupa un hueco, no dos. Gana la primera segun el orden
+ * de `estados`.
+ *
+ * Las rutas se construyen solo con nombres de directorio que ya
+ * pasaron TASK_ID_RE, asi que no hay ID de fuera que llegue a
+ * componer una ruta (misma precaucion que assertValidTaskId en el
+ * resto del modulo).
+ */
+export async function listTareasEnEstados(tareasRoot, estados) {
+    const porId = new Map();
+    const ilegibles = [];
+    for (const estado of estados) {
+        const dir = path.join(tareasRoot, STATE_FOLDER[estado]);
+        let entries;
+        try {
+            entries = await readdir(dir);
+        }
+        catch (e) {
+            if (isEnoent(e))
+                continue;
+            throw e;
+        }
+        for (const entry of entries) {
+            if (!TASK_ID_RE.test(entry))
+                continue;
+            if (porId.has(entry))
+                continue;
+            const filePath = path.join(dir, entry, 'tarea.md');
+            let content;
+            try {
+                content = await readFile(filePath, 'utf8');
+            }
+            catch (e) {
+                // Una carpeta de tarea sin tarea.md dentro no es una tarea:
+                // no ocupa hueco ni impide comprobarlo.
+                if (isEnoent(e))
+                    continue;
+                throw e;
+            }
+            try {
+                porId.set(entry, { task: parseTareaFile(content).task, estadoCarpeta: estado });
+            }
+            catch {
+                // Frontmatter roto o Task invalido. No se propaga: el llamador
+                // decide (ver TareasEnEstadosResult.ilegibles). Cualquier otro
+                // error de I/O si se propaga, arriba.
+                ilegibles.push(filePath);
+            }
+        }
+    }
+    // Orden estable: el orden de readdir depende del filesystem, y estas
+    // tareas acaban en un mensaje de error que los tests aseveran.
+    ilegibles.sort();
+    return { tareas: [...porId.values()], ilegibles };
+}
+export class TaskAlreadyExistsError extends Error {
+    id;
+    filePath;
+    constructor(id, filePath) {
+        super(`Ya existe un tarea.md para ${id} en ${filePath}.`);
+        this.id = id;
+        this.filePath = filePath;
+        this.name = 'TaskAlreadyExistsError';
+    }
+}
+export async function writeTareaFile(tareasRoot, task, body, options = {}) {
+    assertValidTaskId(task.id);
+    // Serializa (y por tanto revalida el Task completo con validateTask)
+    // ANTES de tocar el filesystem, para no dejar directorios a medio
+    // crear si el Task es invalido por otro motivo.
+    const content = serializeTareaFile(task, body);
+    const folder = STATE_FOLDER[task.estado];
+    const dir = path.join(tareasRoot, folder, task.id);
+    const filePath = path.join(dir, 'tarea.md');
+    await mkdir(dir, { recursive: true });
+    try {
+        await writeFile(filePath, content, { encoding: 'utf8', flag: options.failIfExists ? 'wx' : 'w' });
+    }
+    catch (e) {
+        if (options.failIfExists && isEexist(e)) {
+            throw new TaskAlreadyExistsError(task.id, filePath);
+        }
+        throw e;
+    }
+    return filePath;
+}
+export class TaskFolderConflictError extends Error {
+    id;
+    targetDir;
+    constructor(id, targetDir) {
+        super(`No se puede mover ${id} a ${targetDir}: la carpeta de destino ya existe. Revisalo a mano.`);
+        this.id = id;
+        this.targetDir = targetDir;
+        this.name = 'TaskFolderConflictError';
+    }
+}
+/**
+ * Actualiza una tarea que puede haber cambiado de estado (y por tanto
+ * de carpeta): mueve el directorio completo de la tarea (no solo
+ * tarea.md, por si en el futuro guarda mas ficheros) con un unico
+ * rename atomico si la carpeta de destino difiere, y despues
+ * reescribe tarea.md con el frontmatter/cuerpo actualizados. Si la
+ * carpeta de destino ya existiera (no deberia pasar nunca en uso
+ * normal), falla en vez de arriesgarse a mezclar dos tareas — mismo
+ * principio "fail closed" que TaskAlreadyExistsError en writeTareaFile.
+ */
+export async function moveTareaFile(tareasRoot, previousFilePath, task, body, options = {}) {
+    assertValidTaskId(task.id);
+    // Revalida (via serializeTareaFile) ANTES de tocar el filesystem.
+    const content = serializeTareaFile(task, body);
+    const newDir = path.join(tareasRoot, STATE_FOLDER[task.estado], task.id);
+    const oldDir = path.dirname(previousFilePath);
+    if (path.resolve(oldDir) !== path.resolve(newDir)) {
+        let destinoOcupado = false;
+        try {
+            await stat(newDir);
+            destinoOcupado = true;
+        }
+        catch (e) {
+            if (!isEnoent(e))
+                throw e;
+        }
+        if (destinoOcupado) {
+            throw new TaskFolderConflictError(task.id, newDir);
+        }
+        await mkdir(path.dirname(newDir), { recursive: true });
+        try {
+            await rename(oldDir, newDir);
+        }
+        catch (e) {
+            if (!isEnoent(e) || !options.tolerateMissingSource)
+                throw e;
+            // La carpeta vieja no existe en el working tree actual y el
+            // caller declaro explicitamente (tolerateMissingSource) que ese
+            // escenario es esperado. No hay nada que mover: se recrea la
+            // carpeta y se escribe la tarea con el contenido ya leido en
+            // memoria antes de invocar el script. La copia vieja sigue intacta
+            // en el historial de la rama de origen, no se pierde.
+            await mkdir(newDir, { recursive: true });
+        }
+    }
+    const filePath = path.join(newDir, 'tarea.md');
+    await writeFile(filePath, content, 'utf8');
+    return filePath;
+}
+export async function readTareaFile(tareasRoot, id) {
+    assertValidTaskId(id);
+    for (const folder of ALL_STATE_FOLDERS) {
+        const filePath = path.join(tareasRoot, folder, id, 'tarea.md');
+        try {
+            const content = await readFile(filePath, 'utf8');
+            const { task, body } = parseTareaFile(content);
+            return { task, body, filePath };
+        }
+        catch (e) {
+            if (isEnoent(e))
+                continue;
+            throw e;
+        }
+    }
+    return null;
+}
+/**
+ * Exportadas (hallazgo de revision por pares, TASK-010): otros modulos
+ * que escriben ficheros auxiliares de una tarea (p. ej. plan.ts con
+ * plan-final.md) necesitan la misma comprobacion de codigo de error
+ * que esta capa ya resolvia solo para uso interno.
+ */
+export function isEnoent(e) {
+    return typeof e === 'object' && e !== null && e.code === 'ENOENT';
+}
+export function isEexist(e) {
+    return typeof e === 'object' && e !== null && e.code === 'EEXIST';
+}
+/**
+ * ENOTDIR: un componente intermedio de la ruta existe pero no es un
+ * directorio (p. ej. stat("planificacion/plan-final.md") cuando
+ * "planificacion" es un fichero). POSIX lo devuelve aqui; Windows
+ * contesta ENOENT al mismo caso. Quien pregunte "existe este fichero?"
+ * tiene que tratar los dos igual si quiere comportarse igual en las dos
+ * plataformas (hallazgo IMPORTANTE de revision por pares, TASK-027).
+ */
+export function isEnotdir(e) {
+    return typeof e === 'object' && e !== null && e.code === 'ENOTDIR';
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/wip-scan.js b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/wip-scan.js
new file mode 100644
index 0000000..3ffcfd5
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/wip-scan.js
@@ -0,0 +1,148 @@
+/**
+ * Escaneo del trabajo en curso para el limite de WIP (TASK-025, item
+ * C8). Vive en un modulo propio porque cruza las dos capas — necesita
+ * Git y el parser de tareas —, y task-store.ts nunca ha importado
+ * git.ts.
+ *
+ * POR QUE EXISTE ESTE MODULO. B7 comprobaba el limite leyendo
+ * "tareas/02-en-curso" del working tree. Esa pregunta es la correcta
+ * pero el sitio es el equivocado: "taskctl start" mueve la tarea a
+ * 02-en-curso y ese movimiento se commitea EN LA RAMA DE LA TAREA,
+ * mientras que "plan"/"new"/"import" devuelven el repo a la rama base
+ * (ensureBaseBranchReady) y "create-<tipo>.sh" tambien parte de ahi.
+ * En develop NINGUNA tarea esta nunca en curso, asi que la
+ * comprobacion no encontraba nada y el limite no protegia nada.
+ *
+ * El smoke test de B7 no lo detecto porque encadenaba dos "start"
+ * seguidos: el unico orden en el que el limite si funcionaba.
+ *
+ * La pregunta que hace este modulo es la util y ademas la mas directa:
+ * "¿tiene esta persona alguna RAMA DE TRABAJO abierta?". Una rama de
+ * tarea que existe y no esta mergeada ES, literalmente, trabajo en
+ * curso — y, a diferencia del working tree, se ve desde cualquier
+ * sitio.
+ */
+import path from 'node:path';
+import { STATE_FOLDER } from '../core/task.js';
+import { parseTareaFile } from '../core/tarea-file.js';
+import { listTareasEnEstados } from './task-store.js';
+import { isAncestor, localBranchExists, localBranches, lsTreeNames, showFileAtRef, } from './git.js';
+const TASK_ID_RE = /^TASK-\d{3,}$/;
+/**
+ * Ramas locales que cuentan como trabajo abierto: ni la base ni la
+ * principal, y no mergeadas en ninguna de las dos.
+ *
+ * El filtro de mergeadas no es cosmetico en este repo: la politica
+ * IECA dice que las ramas NO se borran tras el merge, asi que hay
+ * decenas vivas y casi todas cerradas. Sin el, cualquiera de ellas
+ * bloquearia a todo el mundo para siempre.
+ *
+ * Se comprueba contra la base Y la principal porque un hotfix mergeado
+ * a main esta cerrado aunque no haya llegado a develop (p. ej. si el
+ * backmerge fallo): bloquear por eso seria un falso positivo con una
+ * causa dificilisima de adivinar desde el mensaje de error.
+ */
+/**
+ * Ramas que, si contienen una rama de trabajo, significan que esa rama
+ * ya esta cerrada. Es SIEMPRE el mismo conjunto, no depende del tipo de
+ * la tarea que arranca.
+ *
+ * Que dependiera del tipo era un hallazgo CRITICO de revision por
+ * pares: para un hotfix la base es "main" y la principal tambien, asi
+ * que develop desaparecia del conjunto. Como entre release y release
+ * ninguna rama de tarea es antepasado de main, TODAS pasaban por
+ * abiertas: en el repo real eran 18, y "taskctl start" de un hotfix
+ * quedaba bloqueado acusando a tareas ya terminadas de seguir en curso,
+ * con un remedio ("taskctl finish") que respondia "ya esta terminada".
+ * El camino urgente, inutilizable.
+ *
+ * Solo refs LOCALES, y sin preguntar al remoto: resolveMainBranch hace
+ * hasta dos "git ls-remote", ~2,3 s por invocacion (medido en la
+ * revision), para un valor que ademas se descartaba si main no era
+ * local. Y contradecia la razon por la que este modulo no mira ramas
+ * remotas: no meter la red en un comando que funciona sin conexion.
+ */
+export function referenciasDeCierre(repoCwd, baseBranch) {
+    return [baseBranch, 'develop', 'main', 'master'].filter((ref, i, todas) => todas.indexOf(ref) === i && localBranchExists(ref, repoCwd));
+}
+export function ramasDeTrabajoAbiertas(repoCwd, baseBranch) {
+    const referencias = referenciasDeCierre(repoCwd, baseBranch);
+    // Sin ninguna referencia local no se puede saber que esta mergeado, y
+    // entonces TODA rama pareceria abierta: en vez de bloquear a todo el
+    // mundo por no poder mirar, no se escanea ninguna. Es un falso
+    // negativo en un caso rarisimo (un checkout sin develop, main ni
+    // master en local), preferible a falsos positivos en masa que ademas
+    // no se podrian arreglar cerrando nada.
+    if (referencias.length === 0)
+        return [];
+    return localBranches(repoCwd).filter((rama) => {
+        if (referencias.includes(rama))
+            return false;
+        return !referencias.some((ref) => isAncestor(rama, ref, repoCwd));
+    });
+}
+/** Extrae el ID de tarea de una ruta "tareas/<carpeta>/TASK-NNN/tarea.md". */
+function idDesdeRuta(ruta) {
+    const partes = ruta.split('/');
+    const id = partes[partes.length - 2];
+    return id !== undefined && TASK_ID_RE.test(id) ? id : null;
+}
+/**
+ * Tareas en `estados` que viven dentro de las ramas de trabajo
+ * abiertas, leidas de cada rama con "git show" (nunca del working
+ * tree).
+ *
+ * Las rutas ilegibles se devuelven como "rama:ruta" para que el
+ * mensaje de error diga DONDE mirar: sin la rama, la ruta sola manda a
+ * la persona a un fichero que en su checkout no existe.
+ */
+export function tareasEnRamasAbiertas(repoCwd, ramas, estados) {
+    const tareas = [];
+    const ilegibles = [];
+    for (const rama of ramas) {
+        for (const estado of estados) {
+            const prefijo = `tareas/${STATE_FOLDER[estado]}`;
+            for (const ruta of lsTreeNames(rama, prefijo, repoCwd)) {
+                if (path.basename(ruta) !== 'tarea.md')
+                    continue;
+                if (idDesdeRuta(ruta) === null)
+                    continue;
+                // El "show" va FUERA del try de parseo: si falla Git (una ref
+                // corrupta, un fichero que revienta el maxBuffer) eso no es una
+                // tarea dudosa, es un problema de Git, y su error debe salir
+                // con su mensaje en vez de disfrazarse de "arregla el
+                // frontmatter" (hallazgo MENOR de revision por pares).
+                const contenido = showFileAtRef(rama, ruta, repoCwd);
+                try {
+                    tareas.push({ task: parseTareaFile(contenido).task, estadoCarpeta: estado });
+                }
+                catch {
+                    // Frontmatter roto o Task invalido dentro de esa rama. No se
+                    // propaga: el llamador decide.
+                    ilegibles.push(`${rama}:${ruta}`);
+                }
+            }
+        }
+    }
+    return { tareas, ilegibles };
+}
+export async function escanearWip(tareasRoot, repoCwd, baseBranch, estados) {
+    const enArbol = await listTareasEnEstados(tareasRoot, estados);
+    const ramas = ramasDeTrabajoAbiertas(repoCwd, baseBranch);
+    const enRamas = tareasEnRamasAbiertas(repoCwd, ramas, estados);
+    const porId = new Map();
+    // Las ramas van PRIMERO y ganan: su copia es la fresca. La del arbol
+    // de la rama base puede estar desactualizada, y decide de QUIEN es la
+    // tarea — hallazgo MENOR de revision por pares, que reprodujo una
+    // tarea reasignada dentro de su rama y bloqueando a la persona
+    // equivocada.
+    for (const t of [...enRamas.tareas, ...enArbol.tareas]) {
+        if (!porId.has(t.task.id))
+            porId.set(t.task.id, t);
+    }
+    return {
+        tareas: [...porId.values()],
+        ilegibles: [...enArbol.ilegibles].sort(),
+        avisos: [...enRamas.ilegibles].sort(),
+    };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index ec589f0..8bc83c0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -18,7 +18,13 @@ aplica.
 
 Comprobar el estado real antes de nada: `taskctl board`.
 
-**Prerrequisito**: el repo necesita una rama `develop`. Los comandos la
+**Prerrequisito 1 — `taskctl` disponible**: lo aporta este mismo plugin. Su
+ejecutable vive en `bin/`, y Claude Code lo anade al PATH del Bash tool
+mientras el plugin este habilitado, asi que se invoca como comando suelto sin
+compilar ni instalar nada aparte. Comprobarlo con `taskctl --version`: si no
+responde, el plugin no esta activo y ningun paso de esta skill va a funcionar.
+
+**Prerrequisito 2**: el repo necesita una rama `develop`. Los comandos la
 esperan por nombre para las tareas de tipo `feature`, `fix` y `release`; las
 de tipo `hotfix` van contra la principal (`main` o `master`, lo que exista).
 Sin `develop`, el primer comando que escriba en `tareas/` ya falla.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
index 9b99871..0e24f10 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/wrappers.test.ts
@@ -1,523 +1,523 @@
-/**
- * Test de integracion real (no mocks) de los cinco wrappers de
- * Git-Flow (TASK-026, item C1): repos Git temporales de verdad, los
- * scripts de scripts/gitflow/ tal cual estan en el repo, y un merge
- * en conflicto y un stash de verdad donde hacen falta.
- *
- * Que 'inherit' deja llegar una respuesta al ead -rp del script,
- * y que el default 'ignore' no, se distingue en
- * test/fs/gitflow-runner.test.ts, con un proceso hijo de stdin
- * controlado. Lo que se comprueba aqui es el contrato del wrapper:
- * sin terminal se toma el valor por defecto de cada pregunta,
- * avisando de cual, y se corta antes de invocar cuando ese valor
- * haria lo contrario de lo que anuncia el comando.
- */
-import { test } from 'node:test';
-import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
-import { existsSync } from 'node:fs';
-import { tmpdir } from 'node:os';
-import path from 'node:path';
-import { fileURLToPath } from 'node:url';
-import { spawnSync } from 'node:child_process';
-import {
-  runWrapperCommand,
-  isWrapperCommand,
-  WrapperCommandError,
-  WRAPPER_NAMES,
-  type WrapperName,
-} from '../../src/commands/wrappers.js';
-import { operacionEnCurso } from '../../src/fs/git.js';
-
-const HERE = path.dirname(fileURLToPath(import.meta.url));
-const PLUGIN_ROOT = path.join(HERE, '..', '..', '..');
-const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'gitflow');
-const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
-
-/** Directorio que no existe: si el wrapper llegase a lanzar el script,
- *  devolveria un codigo de salida en vez de lanzar WrapperCommandError.
- *  Es la forma de aseverar "aborto ANTES de invocar bash". */
-const SCRIPTS_DIR_INEXISTENTE = path.join(tmpdir(), 'taskctl-scripts-que-no-existen');
-
-/** Doble mudo: un script que no pregunta nada y contesta 21. Es lo que
- *  permite recorrer la rama interactiva (interactivo: true, sin
- *  guards) en un test, donde no hay terminal de verdad: con el script
- *  real, su `read -rp` se quedaria esperando una respuesta que no
- *  llega nunca y colgaria la suite. */
-const DOBLE_MUDO_21 = `#!/usr/bin/env bash
-exit 21
-`;
-
-function git(args: string[], cwd: string): string {
-  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
-  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
-  return result.stdout;
-}
-
-interface RunOpts {
-  interactivo?: boolean;
-  scriptsDir?: string;
-}
-
-function run(
-  nombre: WrapperName,
-  argv: readonly string[],
-  repoCwd: string,
-  opts: RunOpts = {}
-): { code: number; avisos: string[]; emitidos: string[] } {
-  const emitidos: string[] = [];
-  const result = runWrapperCommand(nombre, argv, {
-    repoCwd,
-    scriptsDir: opts.scriptsDir ?? SCRIPTS_DIR,
-    interactivo: opts.interactivo ?? false,
-    onAviso: (aviso) => emitidos.push(aviso),
-  });
-  return { code: result.code, avisos: result.avisos, emitidos };
-}
-
-function capturaError(fn: () => unknown): unknown {
-  try {
-    fn();
-    return null;
-  } catch (e) {
-    return e;
-  }
-}
-
-/**
- * Repo temporal deliberadamente SIN `.gitignore`. Hasta TASK-029 hacia
- * falta uno con `logs/`, porque `initialize_gitflow_log` creaba
- * `logs/gitflow/` dentro del repo nada mas arrancar cualquier script y
- * el propio script se ensuciaba el workspace antes de mirarlo. Desde
- * que el registro vive en `.git/taskcode/gitflow/` no hace falta nada:
- * que estos repos no ignoren absolutamente nada es la red de
- * regresion de ese cambio.
- */
-async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-'));
-  try {
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'inicial'], repoRoot);
-    await fn(repoRoot);
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
-  }
-}
-
-async function withTempDirSinRepo(fn: (dir: string) => Promise<void>): Promise<void> {
-  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-sin-repo-'));
-  try {
-    await fn(dir);
-  } finally {
-    await rm(dir, { recursive: true, force: true });
-  }
-}
-
-// ── Tabla de comandos ───────────────────────────────────────────────
-
-test('isWrapperCommand: reconoce los cinco y nada mas', () => {
-  assert.deepEqual([...WRAPPER_NAMES], [
-    'diagnose',
-    'pause',
-    'resume',
-    'recover',
-    'abort-merge',
-  ]);
-  for (const nombre of WRAPPER_NAMES) {
-    assert.equal(isWrapperCommand(nombre), true, nombre);
-  }
-  for (const otro of ['start', 'finish', 'board', 'diagnose-repo', '', 'constructor']) {
-    assert.equal(isWrapperCommand(otro), false, otro);
-  }
-});
-
-// ── Precondicion: estar en un repositorio Git ───────────────────────
-
-test('los cinco abortan fuera de un repositorio Git, sin llegar a lanzar bash', async () => {
-  await withTempDirSinRepo(async (dir) => {
-    for (const nombre of WRAPPER_NAMES) {
-      const argv = nombre === 'resume' || nombre === 'recover' ? ['alguna-rama'] : [];
-      const error = capturaError(() =>
-        run(nombre, argv, dir, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
-      );
-      assert.ok(error instanceof WrapperCommandError, `${nombre}: ${String(error)}`);
-      assert.match((error as Error).message, /dentro del arbol de trabajo de un repositorio Git/);
-      assert.match((error as Error).message, new RegExp(`taskctl ${nombre}`));
-    }
-  });
-});
-
-// ── Validacion de argumentos ────────────────────────────────────────
-
-test('diagnose y abort-merge no aceptan argumentos', async () => {
-  await withTempRepo(async (repoRoot) => {
-    for (const nombre of ['diagnose', 'abort-merge'] as const) {
-      const error = capturaError(() =>
-        run(nombre, ['algo'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
-      );
-      assert.ok(error instanceof WrapperCommandError, nombre);
-      assert.match((error as Error).message, /no acepta argumentos/);
-    }
-  });
-});
-
-test('pause solo admite --push y -p, y se los pasa al script', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const error = capturaError(() =>
-      run('pause', ['--forzar'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
-    );
-    assert.ok(error instanceof WrapperCommandError);
-    assert.match((error as Error).message, /solo admite --push y -p/);
-
-    // Las dos grafias validas llegan al script, tal cual y sin
-    // duplicar: se comprueba con un doble del script que escribe sus
-    // argumentos, no con el pause-work.sh real (que haria un push).
-    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
-    try {
-      await writeFile(
-        path.join(scriptsDir, 'pause-work.sh'),
-        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > args.txt\n',
-        'utf8'
-      );
-      for (const opcion of ['--push', '-p']) {
-        assert.equal(run('pause', [opcion, opcion], repoRoot, { scriptsDir }).code, 0);
-        const argsPath = path.join(repoRoot, 'args.txt');
-        assert.equal(
-          await readFile(argsPath, 'utf8'),
-          `${opcion}\n`,
-          `${opcion} deberia llegar una sola vez`
-        );
-        await rm(argsPath);
-      }
-    } finally {
-      await rm(scriptsDir, { recursive: true, force: true });
-    }
-  });
-});
-
-test('resume pasa el nombre de rama al script como argumento posicional', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
-    try {
-      await writeFile(
-        path.join(scriptsDir, 'resume-work.sh'),
-        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > args.txt\n',
-        'utf8'
-      );
-      assert.equal(run('resume', ['feature/algo'], repoRoot, { scriptsDir }).code, 0);
-      assert.equal(await readFile(path.join(repoRoot, 'args.txt'), 'utf8'), 'feature/algo\n');
-    } finally {
-      await rm(scriptsDir, { recursive: true, force: true });
-    }
-  });
-});
-
-test('resume --push mi-rama no se lleva "--push" como nombre de rama', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const error = capturaError(() =>
-      run('resume', ['--push', 'mi-rama'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
-    );
-    assert.ok(error instanceof WrapperCommandError);
-    assert.match((error as Error).message, /no admite ninguna opcion/);
-    assert.match((error as Error).message, /--push/);
-  });
-});
-
-test('resume y recover aceptan un solo nombre de rama', async () => {
-  await withTempRepo(async (repoRoot) => {
-    for (const nombre of ['resume', 'recover'] as const) {
-      const error = capturaError(() =>
-        run(nombre, ['una', 'otra'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
-      );
-      assert.ok(error instanceof WrapperCommandError, nombre);
-      assert.match((error as Error).message, /un solo nombre de rama/);
-    }
-  });
-});
-
-test('un nombre de rama con formato invalido se rechaza antes de invocar el script', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const error = capturaError(() =>
-      run('resume', ['rama con espacios'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
-    );
-    assert.ok(error instanceof WrapperCommandError);
-    assert.match((error as Error).message, /no es un nombre de rama valido/);
-  });
-});
-
-// ── Sin terminal: cuando corta y cuando no ──────────────────────────
-
-test('diagnose funciona sin terminal y sin avisos: no pregunta nada', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const result = run('diagnose', [], repoRoot);
-    assert.equal(result.code, 0);
-    assert.deepEqual(result.avisos, []);
-  });
-});
-
-test('pause sin terminal y con el workspace limpio sigue adelante', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const result = run('pause', [], repoRoot);
-    assert.equal(result.code, 0);
-    assert.deepEqual(result.avisos, []);
-  });
-});
-
-test('pause sin terminal y con el workspace sucio aborta y no toca nada', async () => {
-  await withTempRepo(async (repoRoot) => {
-    await writeFile(path.join(repoRoot, 'sin-guardar.txt'), 'trabajo a medias\n', 'utf8');
-    const estadoAntes = git(['status', '--porcelain'], repoRoot);
-    const headAntes = git(['rev-parse', 'HEAD'], repoRoot);
-
-    const error = capturaError(() => run('pause', [], repoRoot));
-
-    assert.ok(error instanceof WrapperCommandError);
-    assert.match((error as Error).message, /commit o como stash/);
-    assert.match((error as Error).message, /no hay terminal interactiva/);
-    // Y sobre todo: el trabajo sin guardar sigue exactamente donde
-    // estaba, sin stash nuevo ni commit nuevo.
-    assert.equal(git(['status', '--porcelain'], repoRoot), estadoAntes);
-    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), headAntes);
-    assert.equal(git(['stash', 'list'], repoRoot), '');
-  });
-});
-
-test('pause sin terminal sigue adelante en un repo SIN .gitignore, y no ensucia nada', async () => {
-  // Regresion de TASK-029, y la razon de que aqui ya no haya un guard
-  // de "el repo no ignora logs/". Hasta TASK-029,
-  // `initialize_gitflow_log` creaba <repo>/logs/gitflow/ nada mas
-  // arrancar: en un repo sin ese patron en el .gitignore, pause-work.sh
-  // veia el workspace sucio POR SU PROPIA CULPA, preguntaba, y con EOF
-  // por respuesta moria con "Opcion no reconocida" y exit 1 — el fallo
-  // que este comando venia a quitar de en medio. El wrapper lo tapaba
-  // abortando antes con un mensaje que pedia tocar el .gitignore.
-  //
-  // Ahora el registro vive en `.git/taskcode/gitflow/`, que `git status`
-  // no mira nunca, asi que el caso deja de existir: el repo de este test
-  // no tiene .gitignore en absoluto.
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sinignore-'));
-  try {
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    await writeFile(path.join(repoRoot, 'README.md'), '# sin gitignore\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'inicial'], repoRoot);
-    assert.equal(git(['status', '--porcelain'], repoRoot), '', 'el workspace parte limpio');
-
-    const result = run('pause', [], repoRoot);
-
-    assert.equal(result.code, 0, 'pause-work.sh no pregunta ni muere con exit 1');
-    assert.deepEqual(result.avisos, []);
-    assert.equal(
-      git(['status', '--porcelain'], repoRoot),
-      '',
-      'el script no dejo nada en el arbol de trabajo'
-    );
-    // Y el registro se escribio de verdad, solo que fuera del arbol.
-    const dirRegistro = path.join(
-      repoRoot,
-      git(['rev-parse', '--git-path', 'taskcode/gitflow'], repoRoot).trim()
-    );
-    assert.ok(existsSync(dirRegistro), `el registro deberia estar en ${dirRegistro}`);
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
-  }
-});
-
-test('abort-merge sin terminal y sin nada en curso informa y sale 0', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const result = run('abort-merge', [], repoRoot);
-    assert.equal(result.code, 0);
-  });
-});
-
-test('abort-merge sin terminal y con un merge en conflicto aborta el comando, no el merge', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const fichero = path.join(repoRoot, 'a.txt');
-    await writeFile(fichero, 'base\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'base'], repoRoot);
-
-    git(['checkout', '-q', '-b', 'otra'], repoRoot);
-    await writeFile(fichero, 'version de otra\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'cambio en otra'], repoRoot);
-
-    git(['checkout', '-q', 'main'], repoRoot);
-    await writeFile(fichero, 'version de main\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'cambio en main'], repoRoot);
-
-    const merge = spawnSync('git', ['merge', 'otra'], { cwd: repoRoot, encoding: 'utf8' });
-    assert.notEqual(merge.status, 0, 'el merge deberia haber conflictado');
-    assert.equal(operacionEnCurso(repoRoot), 'merge');
-
-    const error = capturaError(() => run('abort-merge', [], repoRoot));
-
-    assert.ok(error instanceof WrapperCommandError);
-    assert.match((error as Error).message, /confirmar contigo/);
-    assert.match((error as Error).message, /git merge --abort/);
-    // Lo importante: el merge SIGUE en curso. Sin este guard, el
-    // script habria contestado que no y habria salido con codigo 0,
-    // como si hubiera terminado su trabajo.
-    assert.equal(operacionEnCurso(repoRoot), 'merge');
-  });
-});
-
-test('resume y recover sin rama y sin terminal dicen como invocarlos', async () => {
-  await withTempRepo(async (repoRoot) => {
-    for (const nombre of ['resume', 'recover'] as const) {
-      const error = capturaError(() =>
-        run(nombre, [], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
-      );
-      assert.ok(error instanceof WrapperCommandError, nombre);
-      assert.match((error as Error).message, /no hay terminal interactiva/);
-      assert.match((error as Error).message, new RegExp(`taskctl ${nombre} <rama>`));
-    }
-  });
-});
-
-test('resume y recover con rama y sin terminal avisan del valor por defecto ANTES de lanzar', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const resume = run('resume', ['main'], repoRoot);
-    assert.equal(resume.avisos.length, 1);
-    assert.deepEqual(resume.emitidos, resume.avisos);
-    assert.match(resume.avisos[0] as string, /aplicara sin preguntar/);
-    // Aqui habia un `assert.notEqual(resume.code, 0)`: sin "origin"
-    // configurado, resume-work.sh moria en su "fetch origin" sin guard,
-    // el bug conocido que TASK-026 NO tapaba a proposito. TASK-029 (S1)
-    // lo corrige, asi que el codigo de salida de resume-work.sh sin
-    // remoto ya no es este el sitio donde se fija: lo cubre
-    // test/gitflow/origin-guard.test.ts. Lo que este test comprueba es
-    // el contrato del WRAPPER — que el aviso del valor por defecto se
-    // emite ANTES de lanzar el script —, y eso no depende del codigo
-    // de salida.
-
-    const recover = run('recover', ['main'], repoRoot);
-    assert.equal(recover.avisos.length, 1);
-    assert.match(recover.avisos[0] as string, /cancelara/);
-  });
-});
-
-// ── Propagacion del codigo de salida ────────────────────────────────
-
-test('el codigo de salida del script se propaga tal cual, sin colapsarlo a 0 o 1', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
-    try {
-      await writeFile(
-        path.join(scriptsDir, 'diagnose-repo.sh'),
-        '#!/usr/bin/env bash\nexit 42\n',
-        'utf8'
-      );
-      assert.equal(run('diagnose', [], repoRoot, { scriptsDir }).code, 42);
-    } finally {
-      await rm(scriptsDir, { recursive: true, force: true });
-    }
-  });
-});
-
-// ── Herencia de stdin de punta a punta ──────────────────────────────
-
-/**
- * Repo con un "origin" real (segundo repo temporal, bare) y una rama
- * con un stash de los que crea "taskctl pause". Es el escenario
- * minimo en el que resume-work.sh llega de verdad a su `read -rp`.
- */
-async function withRepoConStash(
-  fn: (repoRoot: string, rama: string) => Promise<void>
-): Promise<void> {
-  const originRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-origin-'));
-  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-stash-'));
-  const rama = 'feature/con-stash';
-  try {
-    git(['init', '-q', '--bare', '-b', 'main'], originRoot);
-
-    git(['init', '-q', '-b', 'main'], repoRoot);
-    git(['config', 'user.email', 'test@example.com'], repoRoot);
-    git(['config', 'user.name', 'Test'], repoRoot);
-    git(['remote', 'add', 'origin', originRoot], repoRoot);
-    // Sin .gitignore, igual que withTempRepo y por el mismo motivo
-    // (TASK-029): el registro de los scripts ya no toca el arbol.
-    await writeFile(path.join(repoRoot, 'README.md'), '# repo con stash\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'inicial'], repoRoot);
-    git(['push', '-q', '-u', 'origin', 'main'], repoRoot);
-
-    git(['checkout', '-q', '-b', rama], repoRoot);
-    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'primera version\n', 'utf8');
-    git(['add', '-A'], repoRoot);
-    git(['commit', '-q', '-m', 'trabajo de la rama'], repoRoot);
-    git(['push', '-q', '-u', 'origin', rama], repoRoot);
-
-    // El stash tal y como lo deja pause-work.sh: "pause: <rama> <fecha>".
-    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'cambios a medias\n', 'utf8');
-    git(['stash', 'push', '-u', '-m', `pause: ${rama} 2026-09-06`], repoRoot);
-    git(['checkout', '-q', 'main'], repoRoot);
-
-    await fn(repoRoot, rama);
-  } finally {
-    await rm(repoRoot, { recursive: true, force: true });
-    await rm(originRoot, { recursive: true, force: true });
-  }
-}
-
-function taskctl(argv: string[], cwd: string, input: string): { status: number; salida: string } {
-  const result = spawnSync(process.execPath, [TASKCTL, ...argv], {
-    cwd,
-    input,
-    encoding: 'utf8',
-  });
-  assert.equal(result.error, undefined, `no se pudo lanzar taskctl: ${String(result.error)}`);
-  return { status: result.status ?? -1, salida: `${result.stdout ?? ''}${result.stderr ?? ''}` };
-}
-
-test('taskctl resume sin terminal: NO usa lo que venga por la tuberia, toma el default y no se cuelga', async () => {
-  await withRepoConStash(async (repoRoot, rama) => {
-    // Se le escribe "n" (no apliques el stash) por stdin. Sin
-    // terminal, taskctl invoca con stdin ignorado a proposito: si lo
-    // heredara, una tuberia abierta que nadie cierra colgaria el
-    // comando para siempre (hallazgo IMPORTANTE de revision por
-    // pares). Asi que la respuesta se descarta y manda el valor por
-    // defecto del script, que es justo el que anuncia el aviso.
-    const { status, salida } = taskctl(['resume', rama], repoRoot, 'n\n');
-    assert.equal(status, 0);
-    assert.match(salida, /\[AVISO\].*aplicara sin preguntar/s);
-    assert.equal(git(['stash', 'list'], repoRoot), '', 'el default aplica el stash');
-    assert.notEqual(git(['status', '--porcelain'], repoRoot), '');
-  });
-});
-
-test('con terminal los guards no se aplican: pause con el workspace sucio llega al script', async () => {
-  await withTempRepo(async (repoRoot) => {
-    await writeFile(path.join(repoRoot, 'sin-guardar.txt'), 'a medias', 'utf8');
-    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
-    try {
-      await writeFile(path.join(scriptsDir, 'pause-work.sh'), DOBLE_MUDO_21, 'utf8');
-      const result = run('pause', [], repoRoot, { scriptsDir, interactivo: true });
-      assert.equal(result.code, 21);
-      assert.deepEqual(result.avisos, [], 'con terminal no hay nada de que avisar');
-    } finally {
-      await rm(scriptsDir, { recursive: true, force: true });
-    }
-  });
-});
-
-test('con terminal resume sin rama tampoco corta: es el script quien pregunta', async () => {
-  await withTempRepo(async (repoRoot) => {
-    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
-    try {
-      await writeFile(path.join(scriptsDir, 'resume-work.sh'), DOBLE_MUDO_21, 'utf8');
-      const result = run('resume', [], repoRoot, { scriptsDir, interactivo: true });
-      assert.equal(result.code, 21);
-      assert.deepEqual(result.avisos, []);
-    } finally {
-      await rm(scriptsDir, { recursive: true, force: true });
-    }
-  });
-});
+/**
+ * Test de integracion real (no mocks) de los cinco wrappers de
+ * Git-Flow (TASK-026, item C1): repos Git temporales de verdad, los
+ * scripts de scripts/gitflow/ tal cual estan en el repo, y un merge
+ * en conflicto y un stash de verdad donde hacen falta.
+ *
+ * Que 'inherit' deja llegar una respuesta al ead -rp del script,
+ * y que el default 'ignore' no, se distingue en
+ * test/fs/gitflow-runner.test.ts, con un proceso hijo de stdin
+ * controlado. Lo que se comprueba aqui es el contrato del wrapper:
+ * sin terminal se toma el valor por defecto de cada pregunta,
+ * avisando de cual, y se corta antes de invocar cuando ese valor
+ * haria lo contrario de lo que anuncia el comando.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import {
+  runWrapperCommand,
+  isWrapperCommand,
+  WrapperCommandError,
+  WRAPPER_NAMES,
+  type WrapperName,
+} from '../../src/commands/wrappers.js';
+import { operacionEnCurso } from '../../src/fs/git.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.join(HERE, '..', '..', '..');
+const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'gitflow');
+const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
+
+/** Directorio que no existe: si el wrapper llegase a lanzar el script,
+ *  devolveria un codigo de salida en vez de lanzar WrapperCommandError.
+ *  Es la forma de aseverar "aborto ANTES de invocar bash". */
+const SCRIPTS_DIR_INEXISTENTE = path.join(tmpdir(), 'taskctl-scripts-que-no-existen');
+
+/** Doble mudo: un script que no pregunta nada y contesta 21. Es lo que
+ *  permite recorrer la rama interactiva (interactivo: true, sin
+ *  guards) en un test, donde no hay terminal de verdad: con el script
+ *  real, su `read -rp` se quedaria esperando una respuesta que no
+ *  llega nunca y colgaria la suite. */
+const DOBLE_MUDO_21 = `#!/usr/bin/env bash
+exit 21
+`;
+
+function git(args: string[], cwd: string): string {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
+  return result.stdout;
+}
+
+interface RunOpts {
+  interactivo?: boolean;
+  scriptsDir?: string;
+}
+
+function run(
+  nombre: WrapperName,
+  argv: readonly string[],
+  repoCwd: string,
+  opts: RunOpts = {}
+): { code: number; avisos: string[]; emitidos: string[] } {
+  const emitidos: string[] = [];
+  const result = runWrapperCommand(nombre, argv, {
+    repoCwd,
+    scriptsDir: opts.scriptsDir ?? SCRIPTS_DIR,
+    interactivo: opts.interactivo ?? false,
+    onAviso: (aviso) => emitidos.push(aviso),
+  });
+  return { code: result.code, avisos: result.avisos, emitidos };
+}
+
+function capturaError(fn: () => unknown): unknown {
+  try {
+    fn();
+    return null;
+  } catch (e) {
+    return e;
+  }
+}
+
+/**
+ * Repo temporal deliberadamente SIN `.gitignore`. Hasta TASK-029 hacia
+ * falta uno con `logs/`, porque `initialize_gitflow_log` creaba
+ * `logs/gitflow/` dentro del repo nada mas arrancar cualquier script y
+ * el propio script se ensuciaba el workspace antes de mirarlo. Desde
+ * que el registro vive en `.git/taskcode/gitflow/` no hace falta nada:
+ * que estos repos no ignoren absolutamente nada es la red de
+ * regresion de ese cambio.
+ */
+async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    await fn(repoRoot);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+async function withTempDirSinRepo(fn: (dir: string) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-sin-repo-'));
+  try {
+    await fn(dir);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+}
+
+// ── Tabla de comandos ───────────────────────────────────────────────
+
+test('isWrapperCommand: reconoce los cinco y nada mas', () => {
+  assert.deepEqual([...WRAPPER_NAMES], [
+    'diagnose',
+    'pause',
+    'resume',
+    'recover',
+    'abort-merge',
+  ]);
+  for (const nombre of WRAPPER_NAMES) {
+    assert.equal(isWrapperCommand(nombre), true, nombre);
+  }
+  for (const otro of ['start', 'finish', 'board', 'diagnose-repo', '', 'constructor']) {
+    assert.equal(isWrapperCommand(otro), false, otro);
+  }
+});
+
+// ── Precondicion: estar en un repositorio Git ───────────────────────
+
+test('los cinco abortan fuera de un repositorio Git, sin llegar a lanzar bash', async () => {
+  await withTempDirSinRepo(async (dir) => {
+    for (const nombre of WRAPPER_NAMES) {
+      const argv = nombre === 'resume' || nombre === 'recover' ? ['alguna-rama'] : [];
+      const error = capturaError(() =>
+        run(nombre, argv, dir, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+      );
+      assert.ok(error instanceof WrapperCommandError, `${nombre}: ${String(error)}`);
+      assert.match((error as Error).message, /dentro del arbol de trabajo de un repositorio Git/);
+      assert.match((error as Error).message, new RegExp(`taskctl ${nombre}`));
+    }
+  });
+});
+
+// ── Validacion de argumentos ────────────────────────────────────────
+
+test('diagnose y abort-merge no aceptan argumentos', async () => {
+  await withTempRepo(async (repoRoot) => {
+    for (const nombre of ['diagnose', 'abort-merge'] as const) {
+      const error = capturaError(() =>
+        run(nombre, ['algo'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+      );
+      assert.ok(error instanceof WrapperCommandError, nombre);
+      assert.match((error as Error).message, /no acepta argumentos/);
+    }
+  });
+});
+
+test('pause solo admite --push y -p, y se los pasa al script', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const error = capturaError(() =>
+      run('pause', ['--forzar'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+    );
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /solo admite --push y -p/);
+
+    // Las dos grafias validas llegan al script, tal cual y sin
+    // duplicar: se comprueba con un doble del script que escribe sus
+    // argumentos, no con el pause-work.sh real (que haria un push).
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(
+        path.join(scriptsDir, 'pause-work.sh'),
+        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > args.txt\n',
+        'utf8'
+      );
+      for (const opcion of ['--push', '-p']) {
+        assert.equal(run('pause', [opcion, opcion], repoRoot, { scriptsDir }).code, 0);
+        const argsPath = path.join(repoRoot, 'args.txt');
+        assert.equal(
+          await readFile(argsPath, 'utf8'),
+          `${opcion}\n`,
+          `${opcion} deberia llegar una sola vez`
+        );
+        await rm(argsPath);
+      }
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
+
+test('resume pasa el nombre de rama al script como argumento posicional', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(
+        path.join(scriptsDir, 'resume-work.sh'),
+        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > args.txt\n',
+        'utf8'
+      );
+      assert.equal(run('resume', ['feature/algo'], repoRoot, { scriptsDir }).code, 0);
+      assert.equal(await readFile(path.join(repoRoot, 'args.txt'), 'utf8'), 'feature/algo\n');
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
+
+test('resume --push mi-rama no se lleva "--push" como nombre de rama', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const error = capturaError(() =>
+      run('resume', ['--push', 'mi-rama'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+    );
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /no admite ninguna opcion/);
+    assert.match((error as Error).message, /--push/);
+  });
+});
+
+test('resume y recover aceptan un solo nombre de rama', async () => {
+  await withTempRepo(async (repoRoot) => {
+    for (const nombre of ['resume', 'recover'] as const) {
+      const error = capturaError(() =>
+        run(nombre, ['una', 'otra'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+      );
+      assert.ok(error instanceof WrapperCommandError, nombre);
+      assert.match((error as Error).message, /un solo nombre de rama/);
+    }
+  });
+});
+
+test('un nombre de rama con formato invalido se rechaza antes de invocar el script', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const error = capturaError(() =>
+      run('resume', ['rama con espacios'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+    );
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /no es un nombre de rama valido/);
+  });
+});
+
+// ── Sin terminal: cuando corta y cuando no ──────────────────────────
+
+test('diagnose funciona sin terminal y sin avisos: no pregunta nada', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const result = run('diagnose', [], repoRoot);
+    assert.equal(result.code, 0);
+    assert.deepEqual(result.avisos, []);
+  });
+});
+
+test('pause sin terminal y con el workspace limpio sigue adelante', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const result = run('pause', [], repoRoot);
+    assert.equal(result.code, 0);
+    assert.deepEqual(result.avisos, []);
+  });
+});
+
+test('pause sin terminal y con el workspace sucio aborta y no toca nada', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await writeFile(path.join(repoRoot, 'sin-guardar.txt'), 'trabajo a medias\n', 'utf8');
+    const estadoAntes = git(['status', '--porcelain'], repoRoot);
+    const headAntes = git(['rev-parse', 'HEAD'], repoRoot);
+
+    const error = capturaError(() => run('pause', [], repoRoot));
+
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /commit o como stash/);
+    assert.match((error as Error).message, /no hay terminal interactiva/);
+    // Y sobre todo: el trabajo sin guardar sigue exactamente donde
+    // estaba, sin stash nuevo ni commit nuevo.
+    assert.equal(git(['status', '--porcelain'], repoRoot), estadoAntes);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), headAntes);
+    assert.equal(git(['stash', 'list'], repoRoot), '');
+  });
+});
+
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
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), '# sin gitignore\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    assert.equal(git(['status', '--porcelain'], repoRoot), '', 'el workspace parte limpio');
+
+    const result = run('pause', [], repoRoot);
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
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+});
+
+test('abort-merge sin terminal y sin nada en curso informa y sale 0', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const result = run('abort-merge', [], repoRoot);
+    assert.equal(result.code, 0);
+  });
+});
+
+test('abort-merge sin terminal y con un merge en conflicto aborta el comando, no el merge', async () => {
+  await withTempRepo(async (repoRoot) => {
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
+    const merge = spawnSync('git', ['merge', 'otra'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.notEqual(merge.status, 0, 'el merge deberia haber conflictado');
+    assert.equal(operacionEnCurso(repoRoot), 'merge');
+
+    const error = capturaError(() => run('abort-merge', [], repoRoot));
+
+    assert.ok(error instanceof WrapperCommandError);
+    assert.match((error as Error).message, /confirmar contigo/);
+    assert.match((error as Error).message, /git merge --abort/);
+    // Lo importante: el merge SIGUE en curso. Sin este guard, el
+    // script habria contestado que no y habria salido con codigo 0,
+    // como si hubiera terminado su trabajo.
+    assert.equal(operacionEnCurso(repoRoot), 'merge');
+  });
+});
+
+test('resume y recover sin rama y sin terminal dicen como invocarlos', async () => {
+  await withTempRepo(async (repoRoot) => {
+    for (const nombre of ['resume', 'recover'] as const) {
+      const error = capturaError(() =>
+        run(nombre, [], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
+      );
+      assert.ok(error instanceof WrapperCommandError, nombre);
+      assert.match((error as Error).message, /no hay terminal interactiva/);
+      assert.match((error as Error).message, new RegExp(`taskctl ${nombre} <rama>`));
+    }
+  });
+});
+
+test('resume y recover con rama y sin terminal avisan del valor por defecto ANTES de lanzar', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const resume = run('resume', ['main'], repoRoot);
+    assert.equal(resume.avisos.length, 1);
+    assert.deepEqual(resume.emitidos, resume.avisos);
+    assert.match(resume.avisos[0] as string, /aplicara sin preguntar/);
+    // Aqui habia un `assert.notEqual(resume.code, 0)`: sin "origin"
+    // configurado, resume-work.sh moria en su "fetch origin" sin guard,
+    // el bug conocido que TASK-026 NO tapaba a proposito. TASK-029 (S1)
+    // lo corrige, asi que el codigo de salida de resume-work.sh sin
+    // remoto ya no es este el sitio donde se fija: lo cubre
+    // test/gitflow/origin-guard.test.ts. Lo que este test comprueba es
+    // el contrato del WRAPPER — que el aviso del valor por defecto se
+    // emite ANTES de lanzar el script —, y eso no depende del codigo
+    // de salida.
+
+    const recover = run('recover', ['main'], repoRoot);
+    assert.equal(recover.avisos.length, 1);
+    assert.match(recover.avisos[0] as string, /cancelara/);
+  });
+});
+
+// ── Propagacion del codigo de salida ────────────────────────────────
+
+test('el codigo de salida del script se propaga tal cual, sin colapsarlo a 0 o 1', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(
+        path.join(scriptsDir, 'diagnose-repo.sh'),
+        '#!/usr/bin/env bash\nexit 42\n',
+        'utf8'
+      );
+      assert.equal(run('diagnose', [], repoRoot, { scriptsDir }).code, 42);
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
+
+// ── Herencia de stdin de punta a punta ──────────────────────────────
+
+/**
+ * Repo con un "origin" real (segundo repo temporal, bare) y una rama
+ * con un stash de los que crea "taskctl pause". Es el escenario
+ * minimo en el que resume-work.sh llega de verdad a su `read -rp`.
+ */
+async function withRepoConStash(
+  fn: (repoRoot: string, rama: string) => Promise<void>
+): Promise<void> {
+  const originRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-origin-'));
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-stash-'));
+  const rama = 'feature/con-stash';
+  try {
+    git(['init', '-q', '--bare', '-b', 'main'], originRoot);
+
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    git(['remote', 'add', 'origin', originRoot], repoRoot);
+    // Sin .gitignore, igual que withTempRepo y por el mismo motivo
+    // (TASK-029): el registro de los scripts ya no toca el arbol.
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo con stash\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['push', '-q', '-u', 'origin', 'main'], repoRoot);
+
+    git(['checkout', '-q', '-b', rama], repoRoot);
+    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'primera version\n', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'trabajo de la rama'], repoRoot);
+    git(['push', '-q', '-u', 'origin', rama], repoRoot);
+
+    // El stash tal y como lo deja pause-work.sh: "pause: <rama> <fecha>".
+    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'cambios a medias\n', 'utf8');
+    git(['stash', 'push', '-u', '-m', `pause: ${rama} 2026-09-06`], repoRoot);
+    git(['checkout', '-q', 'main'], repoRoot);
+
+    await fn(repoRoot, rama);
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+    await rm(originRoot, { recursive: true, force: true });
+  }
+}
+
+function taskctl(argv: string[], cwd: string, input: string): { status: number; salida: string } {
+  const result = spawnSync(process.execPath, [TASKCTL, ...argv], {
+    cwd,
+    input,
+    encoding: 'utf8',
+  });
+  assert.equal(result.error, undefined, `no se pudo lanzar taskctl: ${String(result.error)}`);
+  return { status: result.status ?? -1, salida: `${result.stdout ?? ''}${result.stderr ?? ''}` };
+}
+
+test('taskctl resume sin terminal: NO usa lo que venga por la tuberia, toma el default y no se cuelga', async () => {
+  await withRepoConStash(async (repoRoot, rama) => {
+    // Se le escribe "n" (no apliques el stash) por stdin. Sin
+    // terminal, taskctl invoca con stdin ignorado a proposito: si lo
+    // heredara, una tuberia abierta que nadie cierra colgaria el
+    // comando para siempre (hallazgo IMPORTANTE de revision por
+    // pares). Asi que la respuesta se descarta y manda el valor por
+    // defecto del script, que es justo el que anuncia el aviso.
+    const { status, salida } = taskctl(['resume', rama], repoRoot, 'n\n');
+    assert.equal(status, 0);
+    assert.match(salida, /\[AVISO\].*aplicara sin preguntar/s);
+    assert.equal(git(['stash', 'list'], repoRoot), '', 'el default aplica el stash');
+    assert.notEqual(git(['status', '--porcelain'], repoRoot), '');
+  });
+});
+
+test('con terminal los guards no se aplican: pause con el workspace sucio llega al script', async () => {
+  await withTempRepo(async (repoRoot) => {
+    await writeFile(path.join(repoRoot, 'sin-guardar.txt'), 'a medias', 'utf8');
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(path.join(scriptsDir, 'pause-work.sh'), DOBLE_MUDO_21, 'utf8');
+      const result = run('pause', [], repoRoot, { scriptsDir, interactivo: true });
+      assert.equal(result.code, 21);
+      assert.deepEqual(result.avisos, [], 'con terminal no hay nada de que avisar');
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
+
+test('con terminal resume sin rama tampoco corta: es el script quien pregunta', async () => {
+  await withTempRepo(async (repoRoot) => {
+    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
+    try {
+      await writeFile(path.join(scriptsDir, 'resume-work.sh'), DOBLE_MUDO_21, 'utf8');
+      const result = run('resume', [], repoRoot, { scriptsDir, interactivo: true });
+      assert.equal(result.code, 21);
+      assert.deepEqual(result.avisos, []);
+    } finally {
+      await rm(scriptsDir, { recursive: true, force: true });
+    }
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
new file mode 100644
index 0000000..5955f20
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/distribucion.test.ts
@@ -0,0 +1,201 @@
+/**
+ * Tests del empaquetado del plugin (item E6 / TASK-031).
+ *
+ * El defecto que motiva estos tests: en un clon recien hecho `taskctl` no
+ * arrancaba. `dist/` estaba en `.gitignore` y `bin/taskctl` importa
+ * `../dist/src/cli.js`, asi que quien clonaba el repo —o instalaba el
+ * plugin desde el marketplace— recibia un CLI que moria con
+ * `Cannot find module ...dist/src/cli.js` y codigo 1.
+ *
+ * Dos bloques, con motivos distintos:
+ *
+ * 1. DE INTEGRACION. El unico que prueba de verdad lo que importa: se
+ *    exporta el arbol de HEAD a un directorio temporal —lo mismo que
+ *    recibe quien clona— y se ejecuta `node bin/taskctl --version` SIN
+ *    `npm install` ni `npm run build`. Y con su CONTRAPRUEBA: borrar
+ *    `dist/src/` del arbol exportado tiene que volver a producir el
+ *    fallo original. Sin ella, un test verde no distingue entre "el
+ *    build viaja" y "el test nunca miro esa ruta".
+ *
+ * 2. ESTRUCTURALES. Baratos y de diagnostico claro: fijan las tres
+ *    piezas que sostienen lo anterior (dist/src trackeado, dist/test
+ *    fuera, y el eol fijado en .gitattributes + tsconfig). Cuando el
+ *    bloque 1 se pone rojo, estos dicen cual de las tres se movio.
+ *
+ * LO QUE ESTOS TESTS NO CUBREN, a proposito: la desincronizacion entre
+ * `src/` y `dist/src/`. El bloque 1 exporta HEAD, que es coherente
+ * consigo mismo, asi que sigue verde aunque alguien cambie `src/` y
+ * commitee sin recompilar. Detectarlo pide recompilar y comparar, y eso
+ * vive en el guard de CI (`npm run build` + `git diff --exit-code`), que
+ * ademas tiene que correr en Linux y en Windows porque el modo de fallo
+ * real es cross-plataforma. Los dos mecanismos son complementarios: este
+ * prueba que el build viaja, aquel que el build esta al dia.
+ *
+ * Cero dependencias: node:test, node:assert y git.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { spawnSync } from 'node:child_process';
+import { mkdtemp, readFile, rm } from 'node:fs/promises';
+import { existsSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+
+// --- Localizacion --------------------------------------------------------
+//
+// Compilado, este fichero vive en dist/test/empaquetado/. Tres niveles
+// arriba esta la raiz del plugin, y tres mas la del repo. Mismo truco que
+// test/skills/task-workflow.test.ts, en vez de depender del cwd de npm.
+
+const moduleDir = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(moduleDir, '..', '..', '..');
+const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..', '..');
+
+/** Ruta del plugin relativa a la raiz del repo, en formato POSIX (git). */
+const PLUGIN_REL = 'taskcode-marketplace/plugins/taskcode-plugin';
+
+/** El fichero cuya ausencia era exactamente el defecto de E6. */
+const ENTRYPOINT_REL = `${PLUGIN_REL}/dist/src/cli.js`;
+
+function git(args: string[], cwd: string) {
+  return spawnSync('git', args, { cwd, encoding: 'utf8' });
+}
+
+/** true si REPO_ROOT es un repo git utilizable. */
+function hayRepo(): boolean {
+  const r = git(['rev-parse', '--git-dir'], REPO_ROOT);
+  return r.status === 0;
+}
+
+/**
+ * Materializa el arbol de HEAD en un directorio nuevo, igual que lo
+ * recibiria quien clona: solo lo commiteado, con los filtros de
+ * `.gitattributes` aplicados. Nunca ve el working tree, que es
+ * justamente lo que se quiere — un `dist/src` sin commitear no debe
+ * poder hacer pasar este test.
+ */
+async function exportarHead(): Promise<string> {
+  const destino = await mkdtemp(path.join(tmpdir(), 'e6-dist-'));
+  const sha = git(['rev-parse', 'HEAD'], REPO_ROOT).stdout.trim();
+
+  const clone = git(['clone', '--quiet', '--no-checkout', REPO_ROOT, destino], REPO_ROOT);
+  assert.equal(clone.status, 0, `no se pudo clonar el repo: ${clone.stderr}`);
+
+  const checkout = git(['checkout', '--quiet', sha], destino);
+  assert.equal(checkout.status, 0, `no se pudo hacer checkout de ${sha}: ${checkout.stderr}`);
+
+  return destino;
+}
+
+/** Ejecuta `node bin/taskctl <args>` dentro de un arbol exportado. */
+function taskctlEn(arbol: string, args: string[]) {
+  const bin = path.join(arbol, ...PLUGIN_REL.split('/'), 'bin', 'taskctl');
+  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
+}
+
+// --- 1. Integracion: el arranque en frio ---------------------------------
+
+test('un arbol recien clonado arranca taskctl sin npm install ni npm run build (AC1)', async (t) => {
+  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
+
+  const arbol = await exportarHead();
+  try {
+    // Precondicion explicita: nadie ha compilado nada aqui.
+    assert.equal(
+      existsSync(path.join(arbol, ...PLUGIN_REL.split('/'), 'node_modules')),
+      false,
+      'el arbol exportado no deberia traer node_modules',
+    );
+
+    const r = taskctlEn(arbol, ['--version']);
+
+    assert.equal(
+      r.status,
+      0,
+      `taskctl no arranco en un clon limpio. Es el defecto de E6: comprobar ` +
+        `que dist/src/ sigue versionado.\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
+    );
+    assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/, 'deberia imprimir la version');
+  } finally {
+    await rm(arbol, { recursive: true, force: true });
+  }
+});
+
+test('CONTRAPRUEBA: sin dist/src el mismo arbol vuelve a fallar como antes de E6', async (t) => {
+  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
+
+  const arbol = await exportarHead();
+  try {
+    // Se reproduce el estado anterior a la tarea: build ausente.
+    await rm(path.join(arbol, ...PLUGIN_REL.split('/'), 'dist'), {
+      recursive: true,
+      force: true,
+    });
+
+    const r = taskctlEn(arbol, ['--version']);
+
+    assert.equal(r.status, 1, 'sin dist/src, taskctl tiene que salir con 1');
+    assert.match(
+      r.stderr,
+      /no pudo arrancar/,
+      'y decirlo por stderr, no morir en silencio',
+    );
+  } finally {
+    await rm(arbol, { recursive: true, force: true });
+  }
+});
+
+// --- 2. Estructurales: las piezas que lo sostienen -----------------------
+
+test('dist/src esta trackeado por git y dist/test no (AC4)', (t) => {
+  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
+
+  const trackeados = git(['ls-files', '--', `${PLUGIN_REL}/dist`], REPO_ROOT)
+    .stdout.split('\n')
+    .map((l) => l.trim())
+    .filter(Boolean);
+
+  assert.ok(
+    trackeados.includes(ENTRYPOINT_REL),
+    `${ENTRYPOINT_REL} tiene que estar versionado: es lo que importa bin/taskctl`,
+  );
+
+  const deTest = trackeados.filter((f) => f.startsWith(`${PLUGIN_REL}/dist/test/`));
+  assert.deepEqual(deTest, [], 'los tests compilados no se versionan');
+});
+
+test('el eol de fuentes y build esta fijado, o dist/src no seria reproducible (AC3)', async () => {
+  // No es cosmetico: las plantillas multilinea de src/ viajan tal cual al
+  // build. Con CRLF en el checkout de Windows, el mismo src/ compila
+  // distinto que en Linux y el guard de CI daria falsos positivos.
+  const attrs = await readFile(path.join(PLUGIN_ROOT, '.gitattributes'), 'utf8');
+  assert.match(attrs, /^\*\.ts\s+text\s+eol=lf$/m, 'los fuentes .ts, con eol=lf');
+  assert.match(attrs, /^dist\/\*\*\s+text\s+eol=lf$/m, 'y el build generado tambien');
+
+  const tsconfig = await readFile(path.join(PLUGIN_ROOT, 'tsconfig.json'), 'utf8');
+  assert.match(tsconfig, /"newLine"\s*:\s*"lf"/, 'tsc tiene que emitir LF en toda plataforma');
+});
+
+test('ningun fichero de dist/src commiteado lleva CR', (t) => {
+  if (!hayRepo()) return t.skip('REPO_ROOT no es un repo git');
+
+  // Se lee del INDICE (git show), no del disco: es lo que viaja al clon.
+  const ficheros = git(['ls-files', '--', `${PLUGIN_REL}/dist/src`], REPO_ROOT)
+    .stdout.split('\n')
+    .map((l) => l.trim())
+    .filter(Boolean);
+
+  assert.ok(ficheros.length > 0, 'deberia haber ficheros de dist/src versionados');
+
+  const conCR = ficheros.filter((f) => {
+    const contenido = spawnSync('git', ['show', `HEAD:${f}`], {
+      cwd: REPO_ROOT,
+      encoding: 'utf8',
+      maxBuffer: 20 * 1024 * 1024,
+    }).stdout;
+    return contenido.includes('\r');
+  });
+
+  assert.deepEqual(conCR, [], 'un CR en el build delata que el eol no se fijo');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/tsconfig.json b/taskcode-marketplace/plugins/taskcode-plugin/tsconfig.json
index 88d308f..db76d5c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/tsconfig.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/tsconfig.json
@@ -11,6 +11,7 @@
     "noImplicitOverride": true,
     "esModuleInterop": true,
     "skipLibCheck": true,
+    "newLine": "lf",
     "declaration": false,
     "sourceMap": false
   },
````
