---
name: approve
description: Fase de aprobacion del flujo de tareas con taskctl. Muestra el plan-final de una tarea TASK-NNN y la marca como aprobada solo si la persona lo aprueba. Se invoca como /taskcode-plugin:approve TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Edit AskUserQuestion Skill
---

# Fase: aprobar el plan

Es el checkpoint humano: el plan no se aprueba porque un agente lo diga.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
2. Lee `planificacion/plan-final.md` de la tarea (el ID viene en
   `$ARGUMENTS`) y presentalo resumido: enfoque, riesgos, plan de pruebas y
   lo que pida decision de una persona.
3. **Modo automatico**: si `taskctl siguiente TASK-NNN --json` dice
   `"modo":"automatico"` y `accion` `continuar` (las preguntas ya se hicieron
   en plan), aprueba sin preguntar con
   `taskctl approve TASK-NNN --decidido-por automatico`: queda registrado como
   aprobacion automatica. El CLI lo rechaza si la tarea no se planifico en
   automatico; entonces, y en cualquier otro modo, sigue con la pregunta.
   Pregunta a la persona si lo aprueba.
   - **Si**: ejecuta `taskctl approve TASK-NNN`.
   - **No**: pregunta que habria que cambiar y escribelo, con sus palabras, al
     final de `plan-final.md` en una seccion con este encabezado exacto (asi
     sobrevive a la sesion y la re-planificacion lo lee):

     `## Cambios pedidos por la persona`

     Commitealo y despues ejecuta `taskctl pausa TASK-NNN`, que deja constancia del
     «no» en el registro de la tarea sin cambiar su estado. Si hay que rehacer
     el plan, lo reanuda `/taskcode-plugin:plan TASK-NNN`; si basta con
     retocarlo a mano, `/taskcode-plugin:approve TASK-NNN` otra vez.
     Si habia una cadena abierta, cierrala (`taskctl cadena cerrar <testigo>`) y
     **termina aqui**, sin pasar por la seccion de avance: el «no» detiene la
     cadena.
4. Si `taskctl approve` falla (por ejemplo, el plan es la plantilla sin
   rellenar), muestra el error tal cual.
5. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
