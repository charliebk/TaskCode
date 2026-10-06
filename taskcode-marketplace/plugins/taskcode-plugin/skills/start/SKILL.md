---
name: start
description: Fase de arranque del flujo de tareas con taskctl. Abre la rama de una tarea TASK-NNN con el plan aprobado y la deja lista para implementar. Se invoca como /taskcode-plugin:start TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Read Skill
---

# Fase: arrancar la tarea

Abre la rama de la tarea con Git-Flow y la pasa a `en-curso`.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
2. Ejecuta `taskctl start TASK-NNN` (el ID viene en `$ARGUMENTS`). Si aborta
   por el limite de trabajo en curso, muestra el error tal cual: dice que
   tarea hay que cerrar primero. No lo rodees.
3. Lee `planificacion/plan-final.md` y, si lo hay, `skills_recomendados` del
   `tarea.md`: es lo que guia la implementacion.
4. Ejecuta `taskctl siguiente TASK-NNN --json`. **Modo automatico** (da
   `fase: review` con `accion: continuar`):
   implementa el plan en esta rama, con sus tests y con los skills
   recomendados; commitea; ejecuta la suite del proyecto y no sigas hasta que
   este en verde. Registra el coste (paso 5) y despues encadena `/taskcode-plugin:review` (seccion de
   avance). Si no consigues dejar la suite en verde, para y dilo: no se revisa
   codigo roto.
5. Al terminar la implementacion (con o sin subagentes) y antes de la revision, registra su coste
   (`task-workflow/coste.md`): con el id que devolvio la herramienta Agent de
   cada subagente, `taskctl registrar-coste TASK-NNN --fase implementacion
   --agente <id> [--agente <id2>...]`. La cifra que muestra Claude Code al
   terminar un agente NO es su coste (es su contexto final). Tu parte, si
   quieres, estimada y aparte con `--tokens N`. Sin subagentes, no registres nada.
6. En el resto de casos, sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json`. Tras `start` la fase es `review`,
   que significa: primero implementar el plan en esta rama, con tests,
   commitearlo y dejar la suite en verde; despues,
   `/taskcode-plugin:review TASK-NNN`.
