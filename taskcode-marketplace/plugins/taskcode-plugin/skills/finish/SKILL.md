---
name: finish
description: Fase de cierre del flujo de tareas con taskctl. Integra la rama de una tarea TASK-NNN con la revision aprobada (merge normal o merge request, con tag opcional), la mueve a terminadas y actualiza los artefactos de cierre. Se invoca como /taskcode-plugin:finish TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Edit AskUserQuestion Skill
---

# Fase: cerrar la tarea

Integra la rama de la tarea (sin borrarla) y la deja en `terminada`. Hay tres
formas de cerrar, todas opcionales salvo la primera, que es la de siempre:

- **Merge normal** (por defecto): `taskctl finish TASK-NNN`.
- **Merge request**: `taskctl finish TASK-NNN --merge-request` sube la rama y
  abre un pull request (GitHub) o merge request (GitLab) contra la rama base;
  la tarea sigue en `en-revision` hasta que se mergee en la plataforma.
- **Tag**: `--tag <nombre>` pone un tag anotado sobre el commit de merge.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
2. Comprueba que el `tarea.md` tiene los criterios de aceptacion marcados y
   una seccion `## Resultado` con lo implementado, lo que encontro la
   revision y lo que se decidio no corregir. Si falta, completalo y
   commitealo antes.
3. Si en el `tarea.md` falta el coste de diseno o de revision
   (`tokens_diseno` o `tokens_revision` a `null`) y lo tienes (los ids de los
   subagentes de esa fase), registralo **antes** de `taskctl finish` con
   `taskctl registrar-coste TASK-NNN --fase diseno|revision --agente <id>`
   (`task-workflow/coste.md`; la cifra que muestra Claude Code al terminar un
   agente no es su coste). Si no, `finish` avisa sin bloquear y se puede
   registrar despues del cierre, ya en la rama base. **Con merge request, no
   commitees nada en la rama de la tarea entre el primer `finish` y el
   segundo**: ese commit no esta en el merge request, el segundo `finish` lo
   detecta y aborta. Lo que falte, despues del cierre.
4. **Decide como cerrar** (ver «Como cerrar» abajo) y ejecuta `taskctl finish`
   con lo decidido desde la rama de la tarea (si estas en otra:
   `git checkout <rama>` del `tarea.md`; desde la rama base `finish` lee la
   copia vieja y aborta). El ID viene en `$ARGUMENTS`. Solo cierra si el
   ultimo informe aprueba; si no, muestra el error tal cual.
   No uses `--push` salvo que la persona lo pida: subir es un acto aparte. El
   tag nunca se sube sin `--push`, y la salida dice que quedo solo en local.
5. Si la tarea tiene criterios bajo `### Tras el cierre`, verificalos ahora en
   la rama base y anota la evidencia en el `## Resultado` con un commit
   posterior.
6. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json`; debe decir `terminada`. Si acabas de
   abrir un merge request, la tarea NO esta terminada: no sigas con el
   avance; dile a la persona la URL y que, cuando se mergee, vuelva a lanzar
   `/taskcode-plugin:finish TASK-NNN` (cierra la cadena si habia una).

## Como cerrar

Lee `modo` y `cierre` de `taskctl siguiente TASK-NNN --json`: `modo` es el de
la tarea y `cierre` la clave `cierre_por_defecto` de la configuracion
(`merge` o `merge-request`).

- **Segundo cierre.** Si el `tarea.md` ya tiene una seccion `## Merge request`,
  el merge request ya esta abierto: no preguntes el modo de cierre. Ejecuta
  `taskctl finish TASK-NNN --merge-request` (con `--tag <nombre>` si la
  persona pidio tag). El estado lo consulta el CLI a la plataforma: si sigue
  abierto o esta cerrado sin mergear, aborta y lo dice; muestra su mensaje y
  para, no es un fallo que arreglar.
- **Modo `manual` o `semiautomatico`**: pregunta con AskUserQuestion, en este
  orden, y pasa lo elegido como flags:
  1. Como cerrar: **merge normal** (opcion por defecto y primera) o **merge
     request** (`--merge-request`). Si el CLI avisa de que falta el CLI de la
     plataforma (`gh` o `glab`) o la sesion, muestra el mensaje: dice que
     instalar o configurar.
  2. Si quiere un **tag**: sin tag (por defecto) o con tag, y en ese caso el
     nombre (`--tag <nombre>`). Con merge request el tag se pone en el
     segundo cierre, al lanzar `finish` otra vez.
- **Modo `automatico`**: no preguntes. Usa `cierre`: con `merge`, merge normal
  sin tag (`taskctl finish TASK-NNN`); con `merge-request`, `taskctl finish
  TASK-NNN --merge-request`. Nunca pases `--tag` por tu cuenta: el nombre del
  tag lo decide una persona.
- **Hotfix y release** no tienen merge request (se mergean a la rama principal
  con tag y backmerge) y se cierran siempre con pregunta, en cualquier modo.
  Solo pregunta el tag: el nombre sustituye al que el script habria puesto,
  siempre queda un unico tag.

Un nombre de tag que ya existe o no vale para Git aborta antes de mergear sin
tocar nada: muestra el error y pregunta otro nombre.
