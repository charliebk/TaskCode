---
name: approve
description: Fase de aprobacion del flujo de tareas con taskctl. Muestra el plan-final de una tarea TASK-NNN y la marca como aprobada solo si la persona lo aprueba. Se invoca como /taskcode-plugin:approve TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Read AskUserQuestion Skill
---

# Fase: aprobar el plan

Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
2. Lee `planificacion/plan-final.md` de la tarea (el ID viene en
   `$ARGUMENTS`) y presentalo resumido: enfoque, riesgos, plan de pruebas y
   lo que pida decision de una persona.
3. Pregunta a la persona si lo aprueba.
   - **Si**: ejecuta `taskctl approve TASK-NNN`.
   - **No**: ejecuta `taskctl pausa TASK-NNN`, que deja constancia del «no»
     en el registro de la tarea sin cambiar su estado. Recoge que habria que
     cambiar y dile que lo reanuda `/taskcode-plugin:plan TASK-NNN` (si hay
     que rehacer el plan) o `/taskcode-plugin:approve TASK-NNN`.
4. Si `taskctl approve` falla (por ejemplo, el plan es la plantilla sin
   rellenar), muestra el error tal cual.
5. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
