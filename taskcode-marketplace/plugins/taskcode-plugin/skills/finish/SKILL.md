---
name: finish
description: Fase de cierre del flujo de tareas con taskctl. Integra la rama de una tarea TASK-NNN con la revision aprobada, la mueve a terminadas y actualiza los artefactos de cierre. Se invoca como /taskcode-plugin:finish TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Edit Skill
---

# Fase: cerrar la tarea

Mergea la rama de la tarea (sin borrarla) y la deja en `terminada`.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
2. Comprueba que el `tarea.md` tiene los criterios de aceptacion marcados y
   una seccion `## Resultado` con lo implementado, lo que encontro la
   revision y lo que se decidio no corregir. Si falta, completalo y
   commitealo antes.
3. Si `taskctl finish` avisa de que falta el coste de diseno o de revision y lo
   tienes (la suma del uso de cada subagente mas tu estimacion), registralo con
   `taskctl registrar-coste TASK-NNN --fase diseno|revision --tokens N`
   (`task-workflow/coste.md`); el aviso no bloquea y tambien se puede registrar
   despues del cierre.
   Desde la rama de la tarea (si estas en otra: `git checkout <rama>` del
   `tarea.md`; desde la rama base `finish` lee la copia vieja y aborta),
   ejecuta `taskctl finish TASK-NNN` (el ID viene en `$ARGUMENTS`). Solo
   cierra si el ultimo informe aprueba; si no, muestra el error tal cual.
   No uses `--push` salvo que la persona lo pida: subir es un acto aparte.
4. Si la tarea tiene criterios bajo `### Tras el cierre`, verificalos ahora en
   la rama base y anota la evidencia en el `## Resultado` con un commit
   posterior.
5. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json`; debe decir `terminada`.
