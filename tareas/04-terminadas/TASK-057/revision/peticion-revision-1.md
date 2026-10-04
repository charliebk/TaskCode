# Peticion de revision — TASK-057 (ronda 1)

- Tarea: TASK-057 — Flujo C: fases como skills invocables en modo manual
- Rama revisada: feature/task-057-flujo-c-fases-como-skills-invocables-en
- Rama base: develop
- Commit revisado (HEAD): 2d6af8dabef1677385dc571fe9535b6b0ca08a5d
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-057 (criterios de aceptacion y plan)

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
2d6af8d feat(TASK-057): fases como skills invocables en modo manual
d5ff775 chore(TASK-057): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
new file mode 100644
index 0000000..cb9c4a1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/approve/SKILL.md
@@ -0,0 +1,26 @@
+---
+name: approve
+description: Fase de aprobacion del flujo de tareas con taskctl. Muestra el plan-final de una tarea TASK-NNN y la marca como aprobada solo si la persona lo aprueba. Se invoca como /taskcode-plugin:approve TASK-NNN.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Read AskUserQuestion Skill
+---
+
+# Fase: aprobar el plan
+
+Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.
+
+## Pasos
+
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+2. Lee `planificacion/plan-final.md` de la tarea (el ID viene en
+   `$ARGUMENTS`) y presentalo resumido: enfoque, riesgos, plan de pruebas y
+   lo que pida decision de una persona.
+3. Pregunta a la persona si lo aprueba.
+   - **Si**: ejecuta `taskctl approve TASK-NNN`.
+   - **No**: ejecuta `taskctl pausa TASK-NNN`, que deja constancia del «no»
+     en el registro de la tarea sin cambiar su estado. Recoge que habria que
+     cambiar y dile que lo reanuda `/taskcode-plugin:plan TASK-NNN` (si hay
+     que rehacer el plan) o `/taskcode-plugin:approve TASK-NNN`.
+4. Si `taskctl approve` falla (por ejemplo, el plan es la plantilla sin
+   rellenar), muestra el error tal cual.
+5. Sigue la seccion de avance (`task-workflow/avance.md`):
+   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md
new file mode 100644
index 0000000..7bc4571
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/board/SKILL.md
@@ -0,0 +1,20 @@
+---
+name: board
+description: Tablero del flujo de tareas con taskctl. Muestra las tareas TASK-NNN por estado y, para una tarea concreta, que fase toca y con que skill seguir. Se invoca como /taskcode-plugin:board.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Read
+---
+
+# Tablero de tareas
+
+Solo lee: no mueve ninguna tarea ni commitea nada.
+
+## Pasos
+
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+2. Ejecuta `taskctl board` (acepta `--sprint N` y `--asignado-a <persona>`
+   si vienen en `$ARGUMENTS`) y muestra su salida tal cual.
+3. Si `$ARGUMENTS` trae un ID `TASK-NNN`, ejecuta tambien
+   `taskctl siguiente TASK-NNN --json` y di, en una linea, en que fase esta y
+   que skill toca despues, segun la tabla de `task-workflow/avance.md`.
+4. No escribas el tablero a fichero salvo que la persona lo pida: eso es
+   `taskctl board --escribir`, y no se combina con los filtros.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
new file mode 100644
index 0000000..4790724
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/finish/SKILL.md
@@ -0,0 +1,25 @@
+---
+name: finish
+description: Fase de cierre del flujo de tareas con taskctl. Integra la rama de una tarea TASK-NNN con la revision aprobada, la mueve a terminadas y actualiza los artefactos de cierre. Se invoca como /taskcode-plugin:finish TASK-NNN.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Read Skill
+---
+
+# Fase: cerrar la tarea
+
+Mergea la rama de la tarea (sin borrarla) y la deja en `terminada`.
+
+## Pasos
+
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+2. Comprueba que el `tarea.md` tiene los criterios de aceptacion marcados y
+   una seccion `## Resultado` con lo implementado, lo que encontro la
+   revision y lo que se decidio no corregir. Si falta, completalo y
+   commitealo antes.
+3. Ejecuta `taskctl finish TASK-NNN` (el ID viene en `$ARGUMENTS`). Solo
+   cierra si el ultimo informe aprueba; si no, muestra el error tal cual.
+   No uses `--push` salvo que la persona lo pida: subir es un acto aparte.
+4. Si la tarea tiene criterios bajo `### Tras el cierre`, verificalos ahora en
+   la rama base y anota la evidencia en el `## Resultado` con un commit
+   posterior.
+5. Sigue la seccion de avance (`task-workflow/avance.md`):
+   `taskctl siguiente TASK-NNN --json`; debe decir `terminada`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
new file mode 100644
index 0000000..6f3fd19
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
@@ -0,0 +1,35 @@
+---
+name: new
+description: Fase de alta del flujo de tareas con taskctl. Crea una tarea TASK-NNN con titulo, tipo, objetivo y criterios de aceptacion comprobables. Se invoca como /taskcode-plugin:new.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Read AskUserQuestion Skill
+---
+
+# Fase: crear una tarea
+
+Da de alta una tarea nueva con su enunciado completo, para que `plan` pueda
+arrancar sin volver a preguntar.
+
+## Pasos
+
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+2. Reune lo que falte de `$ARGUMENTS` preguntando a la persona (una sola
+   pregunta con varias partes, mejor que cuatro seguidas):
+   - **titulo** corto;
+   - **tipo**: `feature`, `fix`, `hotfix` o `release`;
+   - **objetivo**: que problema resuelve y para quien;
+   - **criterios de aceptacion**: entre 1 y 8, cada uno comprobable (un
+     comando, una ruta, un numero o un test). Si alguno es vago («que sea
+     robusto»), pide que lo concrete.
+3. Ejecuta:
+
+   ```bash
+   taskctl new --titulo "<titulo>" --tipo <tipo> --objetivo "<objetivo>" \
+     --criterio "<criterio 1>" --criterio "<criterio 2>"
+   ```
+
+   Opcionales si la persona los da: `--sprint N`, `--etiquetas a,b`,
+   `--complejidad trivial|simple|media|alta|critica`.
+4. Si falla, muestra el error tal cual: dice que corregir.
+5. Con el ID que imprime, sigue la seccion de avance de la skill de flujo
+   (`task-workflow/avance.md`): `taskctl siguiente TASK-NNN --json` y lo que
+   indique su `accion`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
new file mode 100644
index 0000000..f40f9fc
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/plan/SKILL.md
@@ -0,0 +1,39 @@
+---
+name: plan
+description: Fase de diseno del flujo de tareas con taskctl. Pasa una tarea TASK-NNN a en-diseno, lanza el brainstorm de roles y el unificador, y deja redactado su plan-final.md. Se invoca como /taskcode-plugin:plan TASK-NNN.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Write Edit Agent AskUserQuestion Skill
+---
+
+# Fase: disenar la tarea
+
+Deja la tarea en `en-diseno` con un `plan-final.md` redactado. Es la fase en
+la que se pregunta a la persona todo lo que haga falta: las fases siguientes
+no deberian necesitar volver a preguntar.
+
+## Pasos
+
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+2. Ejecuta `taskctl plan TASK-NNN` (el ID viene en `$ARGUMENTS`). Si aborta
+   porque el enunciado no esta listo (Objetivo vacio, criterios vagos, mas de
+   12), muestra el error: dice que corregir y, si propone una particion,
+   donde esta.
+3. Lee la salida: dice cuantos roles entran y que ficheros dejo en
+   `planificacion/brainstorm/`.
+   - **Varios roles**: lanza, en paralelo y en un solo mensaje, un agente por
+     cada `peticion-brainstorm-<rol>-N.md`, con el agente que nombra la
+     propia peticion. Vuelca cada respuesta en su `salida-brainstorm-<rol>-N.md`.
+     Despues lanza el unificador con `peticion-unificador-N.md`: el escribe
+     `plan-final.md`.
+   - **Un rol**: lanza ese agente con `peticion-plan-N.md`; su respuesta es el
+     plan: vuelcala en `planificacion/plan-final.md`.
+   - **Cero roles**: redacta tu el plan a partir del enunciado, sobre la
+     plantilla de `plan-final.md`.
+4. Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
+   anota las respuestas en el propio plan.
+5. Si la salida de `taskctl plan` nombra `skills_recomendados`, dejalos
+   anotados en el plan para la implementacion.
+6. Commitea lo escrito en la carpeta de la tarea
+   (`git add <carpeta de la tarea> && git commit -m "docs(TASK-NNN): plan final"`).
+   Los comandos siguientes exigen el workspace limpio.
+7. Sigue la seccion de avance (`task-workflow/avance.md`):
+   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
new file mode 100644
index 0000000..dfd9332
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -0,0 +1,37 @@
+---
+name: review
+description: Fase de revision del flujo de tareas con taskctl. Pide la revision por pares de una tarea TASK-NNN, lanza revisores independientes por dominio, registra sus veredictos y la segunda opinion si toca. Se invoca como /taskcode-plugin:review TASK-NNN.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Write Edit Agent AskUserQuestion Skill
+---
+
+# Fase: revision por pares
+
+La revisa un agente que **no** implemento la tarea. La independencia es el
+punto, no un formalismo.
+
+## Pasos
+
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+2. Con el ID de `$ARGUMENTS`, mira donde esta: `taskctl siguiente TASK-NNN --json`.
+   - `fase: review`: la implementacion tiene que estar commiteada y la suite
+     en verde. Si no lo esta, para y dilo. Si lo esta, ejecuta
+     `taskctl review TASK-NNN` (tambien abre la ronda 2 y siguientes tras un
+     `cambios-solicitados`).
+   - `fase: veredicto`: ya hay peticion de revision; sigue en el paso 3.
+   - `fase: codex-review` o `veredicto-codex`: salta al paso 5.
+3. Por cada `revision/peticion-revision-N*.md` de la ronda (una por dominio si
+   esta fragmentada), lanza un agente revisor independiente, en paralelo y en
+   un solo mensaje, con la skill revisora que nombra la peticion. Que
+   reproduzca empiricamente (clon temporal, suite una vez, mutantes) y
+   devuelva el informe con su tabla de hallazgos. Vuelca cada respuesta en su
+   `informe-revision-N*.md` y commitealo.
+4. Escribe cada veredicto con el comando, no a mano:
+   `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`
+   (con `--informe <nombre>` si la ronda esta fragmentada). Con CRITICO o
+   IMPORTANTE abiertos, `cambios-solicitados`: se corrigen y se vuelve a esta
+   skill.
+5. Si la tarea tiene `revision_codex: true` y la primaria esta aprobada,
+   `taskctl codex-review TASK-NNN`. Su informe lo lee una persona y escribe su
+   linea `- Veredicto:`; no la escribas tu.
+6. Sigue la seccion de avance (`task-workflow/avance.md`):
+   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
new file mode 100644
index 0000000..8dca609
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md
@@ -0,0 +1,23 @@
+---
+name: start
+description: Fase de arranque del flujo de tareas con taskctl. Abre la rama de una tarea TASK-NNN con el plan aprobado y la deja lista para implementar. Se invoca como /taskcode-plugin:start TASK-NNN.
+allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Read Skill
+---
+
+# Fase: arrancar la tarea
+
+Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.
+
+## Pasos
+
+1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
+2. Ejecuta `taskctl start TASK-NNN` (el ID viene en `$ARGUMENTS`). Si aborta
+   por el limite de trabajo en curso, muestra el error tal cual: dice que
+   tarea hay que cerrar primero. No lo rodees.
+3. Lee `planificacion/plan-final.md` y, si lo hay, `skills_recomendados` del
+   `tarea.md`: es lo que guia la implementacion.
+4. Sigue la seccion de avance (`task-workflow/avance.md`):
+   `taskctl siguiente TASK-NNN --json`. Tras `start` la fase es `review`,
+   que significa: primero implementar el plan en esta rama, con tests,
+   commitearlo y dejar la suite en verde; despues,
+   `/taskcode-plugin:review TASK-NNN`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 995f6f0..a3b45d7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -102,13 +102,16 @@ taskctl import <fichero.md> [--tipo ...] [--sprint N] [--complejidad ...]   # `>
 taskctl board [--sprint N] [--asignado-a <persona>]
 taskctl board --escribir          # no se combina con los filtros de arriba
 taskctl plan    TASK-NNN [--asignado-a <persona>]
-taskctl approve TASK-NNN
+taskctl approve TASK-NNN [--decidido-por persona|automatico]
 taskctl start   TASK-NNN [--asignado-a <persona>]
 taskctl review  TASK-NNN
 taskctl codex-review TASK-NNN
 taskctl veredicto TASK-NNN <valor> [--informe <nombre>]
 taskctl finish  TASK-NNN
 
+taskctl siguiente TASK-NNN [--json]   # que fase toca y si preguntar; solo lee
+taskctl pausa     TASK-NNN            # registra un «no seguir todavia», sin cambiar el estado
+
 taskctl diagnose | pause [--push] | resume [<rama>] | recover [<rama>] | abort-merge
 ```
 
@@ -140,6 +143,15 @@ de Codex y escribe `informe-codex-N.md`, que es lo que `finish` exige cuando la
 tarea tiene `revision_codex: true`. Sin el CLI de Codex instalado, dejar
 `revision_codex` en `false`.
 
+## Las fases como skills y los modos de flujo
+
+Cada fase tiene su skill (`/taskcode-plugin:new`, `board`, `plan`, `approve`,
+`start`, `review`, `finish`, con el ID) para lanzarla o reanudarla en cualquier
+sesion. Ejecuta su `taskctl`, hace el trabajo de agentes de la fase y termina con
+`taskctl siguiente TASK-NNN --json`. Que hacer con esa salida segun el modo
+(`modo_flujo` en `.taskcode/config.yml`: manual, semiautomatico o automatico,
+congelado en la tarea al hacer `plan`) esta en [avance.md](avance.md).
+
 ## Reglas que no se negocian
 
 **1. Evidencia, no suposicion.** Si no lo has ejecutado, no lo afirmes: ni que
@@ -183,102 +195,13 @@ hecho.
 error que no propone el siguiente paso deja al lector adivinando. Y un mensaje
 que ha dejado de ser cierto es peor que no tenerlo.
 
-## Configuracion de sincronizacion (`.taskcode/config.yml`)
-
-Los artefactos derivados del estado de las tareas (un plan generado, un
-tablero sintetizado) se pueden regenerar automaticamente despues de cada
-transicion de tarea. Para eso, el proyecto declara en `.taskcode/config.yml`
-un comando que reescribe esos ficheros y la lista de rutas que modifica.
-
-**Tres claves opcionales, en `.taskcode/config.yml`:**
-
-- **`comando_sincronizacion`**: el comando que el proyecto ejecuta para
-  regenerar sus ficheros derivados. Ejemplo: `"node scripts/sincronizar-plan.mjs"`.
-- **`rutas_sincronizacion`**: lista de ficheros que ese comando reescribe,
-  en sintaxis flow (entre corchetes): `[docs/PLAN.md, docs/BOARD.md]`. Rutas
-  relativas a la raiz del repo, siempre ficheros, nunca carpetas ni la raiz
-  del repo. No pueden estar bajo `tareas/` ni bajo `.taskcode/`.
-- **`timeout_sincronizacion`**: numero de segundos (entero ≥ 1) para esperar
-  al comando. Opcional; por defecto, 60 segundos. Solo es valida si estan las
-  otras dos claves.
-
-**Reglas de declaracion:**
-
-- Las dos primeras claves van juntas o no van: si una existe, la otra debe
-  existir tambien. La tercera es opcional.
-- Una clave mal escrita o un valor invalido aborta **todos** los comandos de
-  `taskctl` que lean config, con un error que enumera las claves validas.
-
-**Como funciona:**
-
-Los ocho comandos que hacen un commit automatico (`new`, `import`, `plan`,
-`approve`, `start`, `review`, `finish`, `codex-review`) siguen este flujo:
-
-1. Escriben sus cambios en `tareas/`.
-2. **Ejecutan el comando de sincronizacion** (si esta declarado).
-3. Incluyen las rutas sincronizadas en el mismo commit (`git commit -m <msg> -- <rutas de tarea> <rutas sincronizadas>`).
-4. Terminan la transicion.
-
-**Ejecucion del comando:**
-
-- Se lanza con el shell del sistema (`cmd.exe` en Windows, `/bin/sh` en
-  POSIX), desde la raiz del repo, sin stdin (`'ignore'`).
-- Forma portable recomendada: `node <script>` en lugar de, por ejemplo,
-  `VAR=1 comando` o comillas simples. Los scripts con estos patrones no
-  funcionan igual en todos los shells.
-- Si el comando contiene ` #`, entrecomillarlo entero en `config.yml`: sin
-  comillas, el propio fichero de configuracion toma lo que sigue como
-  comentario y el comando llega truncado.
-
-**Cuando el comando falla o toca ficheros no declarados:**
-
-La transicion de la tarea **nunca se aborta** por la sincronizacion. Hay tres
-casos en que no se aplica:
-
-1. **Una ruta declarada ya tenia cambios sin commitear** antes del comando:
-   se salta la ejecucion para no meter trabajo ajeno en el commit. La tarea se
-   commitea igual.
-2. **El comando falla** (`exit ≠ 0`) **o supera el timeout**: las rutas
-   declaradas se dejan como en `HEAD` (sin aplicar sus cambios). La tarea se
-   commitea igual.
-3. **El comando modifico ficheros no declarados** en `rutas_sincronizacion`:
-   esos ficheros no se commitean ni se tocan, y se nombran en el aviso. Las
-   rutas declaradas si entran en el commit.
-
-En los tres casos, `taskctl` avisa por stderr y sale con **codigo 3** (no 1):
-la transicion se hizo, pero la sincronizacion no. Un 1 sigue significando que
-el comando de `taskctl` fallo. El aviso
-dice explicitamente que la transicion **ya se hizo**, que no se reintente el
-comando de `taskctl`, y qué hacer a continuacion (regenerar a mano, limpiar el
-workspace, o actualizar el config).
-
-**Tres trampas:**
-
-- **No usar un hook de pre-commit en su lugar.** Los commits automaticos son
-  de rutas concretas; en ese modo, el `git add` de un hook entra en el commit
-  pero el indice real se queda con el contenido viejo (`MM` en `git status`), y
-  el siguiente comando aborta por workspace sucio. Para eso existen estas
-  claves.
-- **Conflictos en lineas de recuento.** Si el fichero derivado tiene lineas de
-  recuento (por ejemplo, "5 tareas pendientes"), los merges de `review` o
-  `finish` pueden chocar en ellas cuando hay mas de una tarea viva. Se resuelve
-  regenerando el fichero derivado con el comando a mano, despues haciendo `git
-  add <ruta>` y continuando el merge: `git merge --continue`.
-- **Seguridad: el comando sale del config de tu repo.** Una rama que cambie
-  `.taskcode/config.yml` decide que comando se ejecuta en tu maquina cuando
-  alguien hace `finish` o `review`. Revisa los cambios a `config.yml` en la
-  revision por pares como si fueran codigo de confianza: potencialmente lo es.
-
-**Otra clave opcional, `excluir_de_revision`:** patrones (semantica de
-`git :(glob)`) cuyo diff no se embebe en la peticion de revision; aparecen en
-un `--stat` con la orden para pedirlos. Por defecto
-`[**/dist/**, **/*.lock, **/*-lock.*, tareas/**]`; definirla **sustituye** esa
-lista (incluye `tareas/**` si la quieres mantener) y `[]` no excluye nada.
-
-**Compatibilidad con versiones anteriores del plugin:**
-
-Un plugin anterior a 0.1.1 no conoce estas claves y aborta todos sus comandos
-al leerlas. **Todo el equipo actualiza el plugin ANTES de anadirlas.**
+## Configuracion (`.taskcode/config.yml`)
+
+Claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`,
+`modo_flujo`, `excluir_de_revision` y las tres de sincronizacion de ficheros
+derivados tras cada transicion. Sin fichero, todo por defecto; una clave mal
+escrita aborta todos los comandos. La sincronizacion (y sus trampas: no usar un
+hook de pre-commit, codigo de salida 3) esta en [sincronizacion.md](sincronizacion.md).
 
 ## Criterios verificables tras el cierre (post-finish)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
new file mode 100644
index 0000000..72b6190
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/avance.md
@@ -0,0 +1,65 @@
+# Avance entre fases
+
+Lo que hace cada skill de fase al terminar su trabajo. Se decide con el CLI,
+no a ojo:
+
+```bash
+taskctl siguiente TASK-NNN --json
+```
+
+Devuelve `fase`, `comando`, `accion` y `motivo`. La skill no adivina nada
+que no diga esa salida.
+
+## Los modos
+
+El modo sale de la clave `modo_flujo` de `.taskcode/config.yml` y se
+**congela en la tarea** al ejecutar `plan`: cambiar el config despues no
+cambia el modo de esa tarea.
+
+| Modo | Que pasa al cerrar una fase |
+|---|---|
+| `manual` (por defecto) | Nada se encadena: la skill termina nombrando la siguiente |
+| `semiautomatico` | Se pregunta si seguir; un no queda registrado con `taskctl pausa` |
+| `automatico` | Las preguntas se hacen en `plan`; el resto se encadena hasta `finish` |
+
+En cualquier modo, hotfix y release preguntan antes de `finish`, nunca se
+sube nada con `--push` sin que la persona lo pida, y cada transicion deja
+una fila en la seccion `## Transiciones` de `tarea.md` (fecha, fase, modo y
+quien decidio) en el mismo commit que la transicion.
+
+## Que skill corresponde a cada fase
+
+| `fase` de `siguiente` | Skill |
+|---|---|
+| `plan` | `/taskcode-plugin:plan` |
+| `approve` | `/taskcode-plugin:approve` |
+| `start` | `/taskcode-plugin:start` |
+| `review` | `/taskcode-plugin:review` |
+| `veredicto` | `/taskcode-plugin:review` |
+| `codex-review` | `/taskcode-plugin:review` |
+| `veredicto-codex` | `/taskcode-plugin:review` |
+| `finish` | `/taskcode-plugin:finish` |
+| `terminada` | ninguna: la tarea esta cerrada |
+
+`fase: review` con la tarea en curso significa: primero implementar el plan,
+commitearlo y dejar la suite en verde; despues, la revision.
+
+## Que hacer segun `accion`
+
+- **`detener`** (modo `manual`): no encadenar nada. Terminar diciendo a la
+  persona, en una linea, el `motivo` y la skill de la siguiente fase con su
+  ID, por ejemplo `/taskcode-plugin:approve TASK-NNN`. Si la tarea esta
+  terminada, decirlo y nada mas.
+- **`preguntar`** y **`continuar`**: los modos `semiautomatico` y
+  `automatico` todavia no encadenan fases desde las skills. Hasta entonces se
+  tratan exactamente igual que `detener`: es el fallo seguro, nunca se avanza
+  de mas.
+
+## Reglas que no cambian con el modo
+
+- Antes de cualquier `taskctl`, situarse en la raiz del repo:
+  `cd "$(git rev-parse --show-toplevel)"`.
+- Si un `taskctl` falla, parar y mostrar su error tal cual: dice que hacer.
+  No reintentar ni saltarse el paso editando ficheros a mano.
+- Las guardas del CLI (limite de trabajo en curso, rama base limpia, revisor
+  independiente, veredicto, segunda opinion) no se rodean en ningun modo.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
new file mode 100644
index 0000000..5023e1f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
@@ -0,0 +1,97 @@
+# Configuracion de sincronizacion (`.taskcode/config.yml`)
+
+
+Los artefactos derivados del estado de las tareas (un plan generado, un
+tablero sintetizado) se pueden regenerar automaticamente despues de cada
+transicion de tarea. Para eso, el proyecto declara en `.taskcode/config.yml`
+un comando que reescribe esos ficheros y la lista de rutas que modifica.
+
+**Tres claves opcionales, en `.taskcode/config.yml`:**
+
+- **`comando_sincronizacion`**: el comando que el proyecto ejecuta para
+  regenerar sus ficheros derivados. Ejemplo: `"node scripts/sincronizar-plan.mjs"`.
+- **`rutas_sincronizacion`**: lista de ficheros que ese comando reescribe,
+  en sintaxis flow (entre corchetes): `[docs/PLAN.md, docs/BOARD.md]`. Rutas
+  relativas a la raiz del repo, siempre ficheros, nunca carpetas ni la raiz
+  del repo. No pueden estar bajo `tareas/` ni bajo `.taskcode/`.
+- **`timeout_sincronizacion`**: numero de segundos (entero ≥ 1) para esperar
+  al comando. Opcional; por defecto, 60 segundos. Solo es valida si estan las
+  otras dos claves.
+
+**Reglas de declaracion:**
+
+- Las dos primeras claves van juntas o no van: si una existe, la otra debe
+  existir tambien. La tercera es opcional.
+- Una clave mal escrita o un valor invalido aborta **todos** los comandos de
+  `taskctl` que lean config, con un error que enumera las claves validas.
+
+**Como funciona:**
+
+Los ocho comandos que hacen un commit automatico (`new`, `import`, `plan`,
+`approve`, `start`, `review`, `finish`, `codex-review`) siguen este flujo:
+
+1. Escriben sus cambios en `tareas/`.
+2. **Ejecutan el comando de sincronizacion** (si esta declarado).
+3. Incluyen las rutas sincronizadas en el mismo commit (`git commit -m <msg> -- <rutas de tarea> <rutas sincronizadas>`).
+4. Terminan la transicion.
+
+**Ejecucion del comando:**
+
+- Se lanza con el shell del sistema (`cmd.exe` en Windows, `/bin/sh` en
+  POSIX), desde la raiz del repo, sin stdin (`'ignore'`).
+- Forma portable recomendada: `node <script>` en lugar de, por ejemplo,
+  `VAR=1 comando` o comillas simples. Los scripts con estos patrones no
+  funcionan igual en todos los shells.
+- Si el comando contiene ` #`, entrecomillarlo entero en `config.yml`: sin
+  comillas, el propio fichero de configuracion toma lo que sigue como
+  comentario y el comando llega truncado.
+
+**Cuando el comando falla o toca ficheros no declarados:**
+
+La transicion de la tarea **nunca se aborta** por la sincronizacion. Hay tres
+casos en que no se aplica:
+
+1. **Una ruta declarada ya tenia cambios sin commitear** antes del comando:
+   se salta la ejecucion para no meter trabajo ajeno en el commit. La tarea se
+   commitea igual.
+2. **El comando falla** (`exit ≠ 0`) **o supera el timeout**: las rutas
+   declaradas se dejan como en `HEAD` (sin aplicar sus cambios). La tarea se
+   commitea igual.
+3. **El comando modifico ficheros no declarados** en `rutas_sincronizacion`:
+   esos ficheros no se commitean ni se tocan, y se nombran en el aviso. Las
+   rutas declaradas si entran en el commit.
+
+En los tres casos, `taskctl` avisa por stderr y sale con **codigo 3** (no 1):
+la transicion se hizo, pero la sincronizacion no. Un 1 sigue significando que
+el comando de `taskctl` fallo. El aviso
+dice explicitamente que la transicion **ya se hizo**, que no se reintente el
+comando de `taskctl`, y qué hacer a continuacion (regenerar a mano, limpiar el
+workspace, o actualizar el config).
+
+**Tres trampas:**
+
+- **No usar un hook de pre-commit en su lugar.** Los commits automaticos son
+  de rutas concretas; en ese modo, el `git add` de un hook entra en el commit
+  pero el indice real se queda con el contenido viejo (`MM` en `git status`), y
+  el siguiente comando aborta por workspace sucio. Para eso existen estas
+  claves.
+- **Conflictos en lineas de recuento.** Si el fichero derivado tiene lineas de
+  recuento (por ejemplo, "5 tareas pendientes"), los merges de `review` o
+  `finish` pueden chocar en ellas cuando hay mas de una tarea viva. Se resuelve
+  regenerando el fichero derivado con el comando a mano, despues haciendo `git
+  add <ruta>` y continuando el merge: `git merge --continue`.
+- **Seguridad: el comando sale del config de tu repo.** Una rama que cambie
+  `.taskcode/config.yml` decide que comando se ejecuta en tu maquina cuando
+  alguien hace `finish` o `review`. Revisa los cambios a `config.yml` en la
+  revision por pares como si fueran codigo de confianza: potencialmente lo es.
+
+**Otra clave opcional, `excluir_de_revision`:** patrones (semantica de
+`git :(glob)`) cuyo diff no se embebe en la peticion de revision; aparecen en
+un `--stat` con la orden para pedirlos. Por defecto
+`[**/dist/**, **/*.lock, **/*-lock.*, tareas/**]`; definirla **sustituye** esa
+lista (incluye `tareas/**` si la quieres mantener) y `[]` no excluye nada.
+
+**Compatibilidad con versiones anteriores del plugin:**
+
+Un plugin anterior a 0.1.1 no conoce estas claves y aborta todos sus comandos
+al leerlas. **Todo el equipo actualiza el plugin ANTES de anadirlas.**
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 523154f..7033934 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -16,16 +16,24 @@ import type { Task } from './task.js';
 import type { ModoFlujo } from './config.js';
 import type { VeredictoInforme } from './informe-revision.js';
 
-export type FaseSiguiente =
-  | 'plan'
-  | 'approve'
-  | 'start'
-  | 'review'
-  | 'veredicto'
-  | 'codex-review'
-  | 'veredicto-codex'
-  | 'finish'
-  | 'terminada';
+/**
+ * Todas las fases que puede devolver siguienteFase. Lista en tiempo de
+ * ejecucion (no solo tipo) para que el test de las skills de fase compruebe
+ * que cada una tiene skill asignada: una fase nueva sin mapear lo pone rojo.
+ */
+export const FASES_SIGUIENTE = [
+  'plan',
+  'approve',
+  'start',
+  'review',
+  'veredicto',
+  'codex-review',
+  'veredicto-codex',
+  'finish',
+  'terminada',
+] as const;
+
+export type FaseSiguiente = (typeof FASES_SIGUIENTE)[number];
 
 export type AccionFlujo = 'detener' | 'preguntar' | 'continuar';
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
new file mode 100644
index 0000000..d90850a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/fases.test.ts
@@ -0,0 +1,160 @@
+/**
+ * Las skills de fase (TASK-057): una por fase del ciclo, invocables como
+ * `/taskcode-plugin:<fase> TASK-NNN`. Son markdown que lee un modelo, asi que
+ * lo que se puede probar aqui es su FORMA y que esten atadas al CLI:
+ *
+ * - frontmatter dentro del spec portable, `name` = directorio, descripcion
+ *   corta y especifica (que no se dispare con cualquier «plan» suelto);
+ * - cada skill nombra su subcomando de taskctl, `taskctl siguiente` y la
+ *   seccion compartida de avance;
+ * - la seccion de avance asigna una skill que existe a CADA fase que puede
+ *   devolver `siguiente` (la lista sale del codigo: una fase nueva sin
+ *   asignar pone esto rojo);
+ * - no mencionan rutas ni documentos internos del repo que las construye.
+ *
+ * Que Claude Code las encadene de verdad solo se ve en una sesion real.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, stat } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseFrontmatter } from '../../src/core/frontmatter.js';
+import { FASES_SIGUIENTE } from '../../src/core/flujo.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
+const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
+const AVANCE = path.join(SKILLS_DIR, 'task-workflow', 'avance.md');
+
+/** Cada skill de fase y el subcomando de taskctl que tiene que ejecutar. */
+const FASES: Record<string, string> = {
+  new: 'taskctl new',
+  board: 'taskctl board',
+  plan: 'taskctl plan',
+  approve: 'taskctl approve',
+  start: 'taskctl start',
+  review: 'taskctl review',
+  finish: 'taskctl finish',
+};
+
+/** Mismas claves que admite el spec portable (ver task-workflow.test.ts). */
+const CLAVES_PERMITIDAS = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility']);
+
+const MAX_DESCRIPTION = 300;
+const MAX_LINEAS = 200;
+
+/**
+ * Marcas de ESTE repo que no pueden viajar en una skill que se instala en
+ * otros proyectos. Es otra lista que la de los revisores y los roles, a
+ * proposito: estas skills SI nombran `taskctl`, `tareas/` y `plan-final.md`
+ * (son la interfaz y los ficheros que el plugin crea en el proyecto del
+ * usuario), y `taskcode-plugin` (el prefijo con el que se invocan).
+ */
+const MARCAS_DEL_REPO = [
+  'docs/contexto',
+  'propuesta_metodologia',
+  'checklist_terminacion',
+  'plan_sprints',
+  'hallazgos.md',
+  'task-0',
+  'ieca',
+  'movetareafile',
+  'printclierror',
+  'veredictoaprobado',
+  'src/commands/',
+  'src/core/',
+];
+const DOCUMENTO_INTERNO = /docs\/[A-Z_]+\.md/;
+const RUTAS_DE_MAQUINA = ['C:\\Users\\', '/Users/', '/home/', '~/'];
+
+async function existe(p: string): Promise<boolean> {
+  try {
+    await stat(p);
+    return true;
+  } catch {
+    return false;
+  }
+}
+
+/**
+ * Lo que SI puede nombrar "taskcode": el prefijo con que se invocan las skills
+ * y la carpeta de configuracion que el plugin lee en el proyecto del usuario.
+ */
+function sinPrefijoDelPlugin(texto: string): string {
+  return texto.toLowerCase().split('taskcode-plugin').join('').split('.taskcode/').join('');
+}
+
+test('las siete skills de fase existen, con frontmatter portable y name igual al directorio', async () => {
+  for (const fase of Object.keys(FASES)) {
+    const ruta = path.join(SKILLS_DIR, fase, 'SKILL.md');
+    assert.ok(await existe(ruta), `falta ${ruta}`);
+    const texto = await readFile(ruta, 'utf8');
+    assert.ok(texto.startsWith('---\n'), `${fase}: el frontmatter tiene que abrir en la primera linea`);
+    const { data, body } = parseFrontmatter(texto);
+    assert.equal(data.name, fase, `${fase}: name tiene que ser el nombre del directorio`);
+    const intrusas = Object.keys(data).filter((k) => !CLAVES_PERMITIDAS.has(k));
+    assert.deepEqual(intrusas, [], `${fase}: claves fuera del spec portable`);
+    assert.ok(body.trim().length > 0, `${fase}: cuerpo vacio`);
+    assert.ok(body.split('\n').length <= MAX_LINEAS, `${fase}: mas de ${MAX_LINEAS} lineas`);
+  }
+});
+
+test('la descripcion de cada fase es corta, sin < ni >, y especifica del flujo (no se dispara con un «plan» suelto)', async () => {
+  for (const fase of Object.keys(FASES)) {
+    const { data } = parseFrontmatter(await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8'));
+    const d = data.description;
+    assert.equal(typeof d, 'string', `${fase}: sin description`);
+    const desc = d as string;
+    assert.ok(desc.length <= MAX_DESCRIPTION, `${fase}: description de ${desc.length} caracteres`);
+    assert.ok(!desc.includes('<') && !desc.includes('>'), `${fase}: < o > en la description`);
+    assert.match(desc, /taskctl/, `${fase}: la description tiene que nombrar taskctl`);
+    assert.match(desc, new RegExp(`/taskcode-plugin:${fase}`), `${fase}: la description dice como se invoca`);
+  }
+});
+
+test('cada skill de fase nombra su subcomando de taskctl, taskctl siguiente y la seccion de avance', async () => {
+  for (const [fase, subcomando] of Object.entries(FASES)) {
+    const texto = await readFile(path.join(SKILLS_DIR, fase, 'SKILL.md'), 'utf8');
+    assert.ok(texto.includes(subcomando), `${fase}: no nombra "${subcomando}"`);
+    // board solo lee: consulta siguiente solo si le pasan un ID, pero lo nombra igual.
+    assert.ok(texto.includes('taskctl siguiente'), `${fase}: no termina con taskctl siguiente`);
+    assert.ok(texto.includes('task-workflow/avance.md'), `${fase}: no remite a la seccion de avance`);
+    assert.ok(texto.includes('git rev-parse --show-toplevel'), `${fase}: no se situa en la raiz del repo`);
+  }
+});
+
+test('la seccion de avance asigna una skill existente a CADA fase que puede devolver siguiente', async () => {
+  const avance = await readFile(AVANCE, 'utf8');
+  for (const fase of FASES_SIGUIENTE) {
+    const fila = avance.split('\n').find((l) => l.startsWith(`| \`${fase}\` |`));
+    assert.ok(fila, `la fase "${fase}" no tiene fila en avance.md`);
+    if (fase === 'terminada') continue;
+    const skill = /\/taskcode-plugin:([a-z-]+)/.exec(fila);
+    assert.ok(skill, `la fase "${fase}" no nombra ninguna skill`);
+    assert.ok(skill[1] !== undefined && skill[1] in FASES, `la fase "${fase}" apunta a una skill que no existe: ${skill[1]}`);
+  }
+  // Las tres acciones de siguiente tienen sus pasos.
+  for (const accion of ['detener', 'preguntar', 'continuar']) {
+    assert.ok(avance.includes(`**\`${accion}\`**`), `avance.md no dice que hacer con "${accion}"`);
+  }
+});
+
+test('las skills de fase y la seccion de avance no mencionan rutas ni documentos internos de este repo', async () => {
+  const ficheros = [...Object.keys(FASES).map((f) => path.join(SKILLS_DIR, f, 'SKILL.md')), AVANCE];
+  for (const ruta of ficheros) {
+    const texto = await readFile(ruta, 'utf8');
+    const minusculas = sinPrefijoDelPlugin(texto);
+    assert.ok(!minusculas.includes('taskcode'), `${ruta}: nombra el proyecto fuera del prefijo del plugin`);
+    const marcas = MARCAS_DEL_REPO.filter((m) => minusculas.includes(m));
+    assert.deepEqual(marcas, [], `${ruta}: marcas del repo`);
+    assert.doesNotMatch(texto, DOCUMENTO_INTERNO, `${ruta}: documento interno`);
+    for (const r of RUTAS_DE_MAQUINA) assert.ok(!texto.includes(r), `${ruta}: ruta de maquina ${r}`);
+  }
+});
+
+test('approve es el checkpoint humano: solo aprueba con el si de la persona y registra el no con pausa', async () => {
+  const texto = await readFile(path.join(SKILLS_DIR, 'approve', 'SKILL.md'), 'utf8');
+  assert.match(texto, /Pregunta a la persona/);
+  assert.match(texto, /taskctl pausa/);
+});
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/01-en-diseno/TASK-057/tarea.md                                                           | 33 ---------------------------------
 tareas/{01-en-diseno => 02-en-curso}/TASK-057/planificacion/brainstorm/peticion-unificador-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-057/planificacion/plan-final.md                       |  0
 tareas/02-en-curso/TASK-057/tarea.md                                                            | 79 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                             | 16 ++++++++++++++++
 5 files changed, 95 insertions(+), 33 deletions(-)
````
