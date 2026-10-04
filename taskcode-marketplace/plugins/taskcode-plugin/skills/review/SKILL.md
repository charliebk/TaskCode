---
name: review
description: Fase de revision del flujo de tareas con taskctl. Pide la revision por pares de una tarea TASK-NNN, lanza revisores independientes por dominio, registra sus veredictos y la segunda opinion si toca. Se invoca como /taskcode-plugin:review TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Write Edit Agent AskUserQuestion Skill
---

# Fase: revision por pares

La revisa un agente que **no** implemento la tarea. La independencia es el
punto, no un formalismo.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
2. Con el ID de `$ARGUMENTS`, mira donde esta: `taskctl siguiente TASK-NNN --json`.
   - `fase: review`: la implementacion tiene que estar commiteada y la suite
     en verde. Si no lo esta, para y dilo. Si lo esta, ejecuta
     `taskctl review TASK-NNN` (tambien abre la ronda 2 y siguientes tras un
     `cambios-solicitados`).
   - `fase: veredicto`: ya hay peticion de revision; sigue en el paso 3.
   - `fase: codex-review` o `veredicto-codex`: salta al paso 5.
3. Por cada `revision/peticion-revision-N*.md` de la ronda (una por dominio si
   esta fragmentada), lanza un agente revisor independiente, en paralelo y en
   un solo mensaje, con la skill revisora que nombra la peticion. Que
   reproduzca empiricamente (clon temporal, suite una vez, mutantes) y
   devuelva el informe con su tabla de hallazgos. Vuelca cada respuesta en su
   `informe-revision-N*.md` y commitealo.
4. Escribe cada veredicto con el comando, no a mano:
   `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`
   (con `--informe <nombre>` si la ronda esta fragmentada). Con CRITICO o
   IMPORTANTE abiertos, `cambios-solicitados`: se corrigen y se vuelve a esta
   skill.
5. Si la tarea tiene `revision_codex: true` y la primaria esta aprobada,
   `taskctl codex-review TASK-NNN`. Su informe lo lee una persona y escribe su
   linea `- Veredicto:`; no la escribas tu.
6. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
