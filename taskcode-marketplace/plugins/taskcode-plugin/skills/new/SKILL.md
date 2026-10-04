---
name: new
description: Fase de alta del flujo de tareas con taskctl. Crea una tarea TASK-NNN con titulo, tipo, objetivo y criterios de aceptacion comprobables. Se invoca como /taskcode-plugin:new.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Read AskUserQuestion Skill
---

# Fase: crear una tarea

Da de alta una tarea nueva con su enunciado completo, para que `plan` pueda
arrancar sin volver a preguntar.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
   y para si falla (ver la cadena en `task-workflow/avance.md`).
2. Reune lo que falte de `$ARGUMENTS` preguntando a la persona (una sola
   pregunta con varias partes, mejor que cuatro seguidas):
   - **titulo** corto;
   - **tipo**: `feature`, `fix`, `hotfix` o `release`;
   - **objetivo**: que problema resuelve y para quien;
   - **criterios de aceptacion**: entre 1 y 8, cada uno comprobable (un
     comando, una ruta, un numero o un test). Si alguno es vago («que sea
     robusto»), pide que lo concrete.
3. Ejecuta:

   ```bash
   taskctl new --titulo "<titulo>" --tipo <tipo> --objetivo "<objetivo>" \
     --criterio "<criterio 1>" --criterio "<criterio 2>"
   ```

   Opcionales si la persona los da: `--sprint N`, `--etiquetas a,b`,
   `--complejidad trivial|simple|media|alta|critica`.
4. Si falla, muestra el error tal cual: dice que corregir.
5. Con el ID que imprime, sigue la seccion de avance de la skill de flujo
   (`task-workflow/avance.md`): `taskctl siguiente TASK-NNN --json` y lo que
   indique su `accion`.
