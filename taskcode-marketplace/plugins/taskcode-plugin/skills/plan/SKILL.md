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
2. Ejecuta `taskctl plan TASK-NNN` (el ID viene en `$ARGUMENTS`). Si aborta
   porque el enunciado no esta listo (Objetivo vacio, criterios vagos, mas de
   12), muestra el error: dice que corregir y, si propone una particion,
   donde esta.
3. Lee la salida: dice cuantos roles entran y que ficheros dejo en
   `planificacion/brainstorm/`.
   - **Varios roles**: lanza, en paralelo y en un solo mensaje, un agente por
     cada `peticion-brainstorm-<rol>-N.md`, con el agente que nombra la
     propia peticion. Vuelca cada respuesta en su `salida-brainstorm-<rol>-N.md`.
     Despues lanza el unificador con `peticion-unificador-N.md`: el escribe
     `plan-final.md`.
   - **Un rol**: lanza ese agente con `peticion-plan-N.md`; su respuesta es el
     plan: vuelcala en `planificacion/plan-final.md`.
   - **Cero roles**: redacta tu el plan a partir del enunciado, sobre la
     plantilla de `plan-final.md`.
4. Si el plan deja decisiones abiertas para una persona, preguntalas ahora y
   anota las respuestas en el propio plan.
5. Si la salida de `taskctl plan` nombra `skills_recomendados`, dejalos
   anotados en el plan para la implementacion.
6. Commitea lo escrito en la carpeta de la tarea
   (`git add <carpeta de la tarea> && git commit -m "docs(TASK-NNN): plan final"`).
   Los comandos siguientes exigen el workspace limpio.
7. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
