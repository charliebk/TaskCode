---
name: finish
description: Fase de cierre del flujo de tareas con taskctl. Integra la rama de una tarea TASK-NNN con la revision aprobada, la mueve a terminadas y actualiza los artefactos de cierre. Se invoca como /taskcode-plugin:finish TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Read Skill
---

# Fase: cerrar la tarea

Mergea la rama de la tarea (sin borrarla) y la deja en `terminada`.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
2. Comprueba que el `tarea.md` tiene los criterios de aceptacion marcados y
   una seccion `## Resultado` con lo implementado, lo que encontro la
   revision y lo que se decidio no corregir. Si falta, completalo y
   commitealo antes.
3. Ejecuta `taskctl finish TASK-NNN` (el ID viene en `$ARGUMENTS`). Solo
   cierra si el ultimo informe aprueba; si no, muestra el error tal cual.
   No uses `--push` salvo que la persona lo pida: subir es un acto aparte.
4. Si la tarea tiene criterios bajo `### Tras el cierre`, verificalos ahora en
   la rama base y anota la evidencia en el `## Resultado` con un commit
   posterior.
5. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json`; debe decir `terminada`.
