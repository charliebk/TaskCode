---
name: board
description: Tablero del flujo de tareas con taskctl. Muestra las tareas TASK-NNN por estado y, para una tarea concreta, que fase toca y con que skill seguir. Se invoca como /taskcode-plugin:board.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Read
---

# Tablero de tareas

Solo lee: no mueve ninguna tarea ni commitea nada.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`.
2. Ejecuta `taskctl board` (acepta `--sprint N` y `--asignado-a <persona>`
   si vienen en `$ARGUMENTS`) y muestra su salida tal cual.
3. Si `$ARGUMENTS` trae un ID `TASK-NNN`, ejecuta tambien
   `taskctl siguiente TASK-NNN --json` y di, en una linea, en que fase esta y
   que skill toca despues, segun la tabla de `task-workflow/avance.md`.
4. No escribas el tablero a fichero salvo que la persona lo pida: eso es
   `taskctl board --escribir`, y no se combina con los filtros.
