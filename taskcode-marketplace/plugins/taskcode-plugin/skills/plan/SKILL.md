---
name: plan
description: Fase de diseno del flujo de tareas con taskctl. Pasa una tarea TASK-NNN a en-diseno, lanza el brainstorm de roles y el unificador, y deja redactado su plan-final.md. Se invoca como /taskcode-plugin:plan TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Write Edit Agent AskUserQuestion Skill
---

# Fase: disenar la tarea

Deja la tarea en `en-diseno` con un `plan-final.md` redactado. Es la fase en
la que se pregunta a la persona todo lo que haga falta: las fases siguientes
no deberian necesitar volver a preguntar.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
2. Mira donde esta la tarea (el ID viene en `$ARGUMENTS`):
   `taskctl siguiente TASK-NNN --json`.
   - **`estado: planificada`**: ejecuta `taskctl plan TASK-NNN` y sigue en el
     paso 3. Si aborta porque el enunciado no esta listo (Objetivo vacio,
     criterios vagos, mas de 12), muestra el error: dice que corregir y, si
     propone una particion, donde esta.
   - **`estado: en-diseno` con `fase: plan`**: la ronda de diseno ya esta
     abierta y falta el plan. **No ejecutes `taskctl plan`**: abriria otra
     ronda que no relanza los roles. Retoma la ronda abierta (paso 3).
   - **Re-planificar** (el plan ya estaba redactado y la persona pidio
     cambiarlo, normalmente tras un «no» en approve): solo entonces ejecuta
     `taskctl plan TASK-NNN` con la tarea en diseno; abre la ronda N+1 y dice
     que se lanza solo el unificador. Ve al paso 4.
   - Cualquier otra fase: no es trabajo de esta skill; sigue el paso 7.
3. **Ronda de diseno** (la de mayor N en `planificacion/brainstorm/`):
   - **Varios roles**: por cada `peticion-brainstorm-<rol>-N.md` cuya
     `salida-brainstorm-<rol>-N.md` siga vacia, lanza un agente con el que
     nombra la propia peticion, en paralelo y en un solo mensaje. Vuelca cada
     respuesta en su salida. Despues lanza el unificador con
     `peticion-unificador-N.md`: el escribe `plan-final.md`.
   - **Un rol**: lanza ese agente con `peticion-plan-N.md`; su respuesta es el
     plan: vuelcala en `planificacion/plan-final.md`.
   - **Cero roles**: redacta tu el plan a partir del enunciado, sobre la
     plantilla de `plan-final.md`.
   Sigue en el paso 5.
4. **Re-planificacion**: lee la seccion `## Cambios pedidos por la persona`
   de `plan-final.md` (la deja approve al decir que no). Lanza solo el
   unificador con `peticion-unificador-N.md` (la ronda nueva) y esos cambios;
   el reescribe `plan-final.md` sobre las salidas de la ronda anterior.
5. Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
   anota las respuestas en el propio plan. Si la salida de `taskctl plan`
   nombro `skills_recomendados`, dejalos anotados para la implementacion.
6. Commitea lo escrito en la carpeta de la tarea
   (`git add <carpeta de la tarea> && git commit -m "docs(TASK-NNN): plan final"`).
   Los comandos siguientes exigen el workspace limpio.
7. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
