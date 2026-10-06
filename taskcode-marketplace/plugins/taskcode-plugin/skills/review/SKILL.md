---
name: review
description: Fase de revision del flujo de tareas con taskctl. Pide la revision por pares de una tarea TASK-NNN, lanza revisores independientes por dominio, registra sus veredictos y la segunda opinion si toca. Se invoca como /taskcode-plugin:review TASK-NNN.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Write Edit Agent AskUserQuestion Skill
---

# Fase: revision por pares

La revisa un agente que **no** implemento la tarea. La independencia es el
punto, no un formalismo.

## Pasos

1. Situate en la raiz del repo: `cd "$(git rev-parse --show-toplevel)"`. Si
   `$ARGUMENTS` trae `--cadena <testigo>`, ejecuta `taskctl cadena comprobar <testigo>`
   y para si falla; anade `--cadena <testigo>` a cada `taskctl` de esta skill que
   escriba o cambie de rama (ver la cadena en `task-workflow/avance.md`).
2. Con el ID de `$ARGUMENTS`, mira donde esta: `taskctl siguiente TASK-NNN --json`,
   y haz SOLO lo que corresponde a su `fase`:
   - `review`: la implementacion (o las correcciones de la ronda anterior)
     tiene que estar commiteada y la suite en verde. Si no lo esta, para y
     dilo. Si lo esta, ejecuta `taskctl review TASK-NNN` y sigue en el paso 3.
   - `veredicto`: ya hay peticion de revision; sigue en el paso 3.
   - `codex-review`: paso 5.
   - `veredicto-codex`: paso 6. **No ejecutes `codex-review`**.
3. Por cada `revision/peticion-revision-N*.md` de la ronda que no tenga ya su
   informe con veredicto (una por dominio si esta fragmentada), lanza un
   agente revisor independiente, en paralelo y en un solo mensaje, con la
   skill revisora que nombra la peticion. Que reproduzca empiricamente (clon
   temporal, suite una vez, mutantes) y devuelva su informe con la tabla de
   hallazgos. Vuelca cada respuesta en su `informe-revision-N*.md`
   **conservando la cabecera de la plantilla** con la linea `- Revisor:`
   rellenada, su linea `- Veredicto:`, y la fila de ejemplo de la tabla
   borrada (tambien sin hallazgos); un informe que conserve la plantilla sin
   rellenar no cuenta como revisado,
   y commitealo **solo, en un commit que no toque nada mas**: en modo
   automatico, `finish` no sigue solo si un informe va mezclado con codigo.
4. Registra el coste de la revision (`task-workflow/coste.md`): suma el total de
   tokens: con el id que devolvio la herramienta Agent de cada revisor,
   `taskctl registrar-coste TASK-NNN --fase revision --agente <id>
   [--agente <id2>...]` (una vez por ronda; suma). La cifra que muestra Claude
   Code al terminar un agente NO es su coste (es su contexto final). Tu parte,
   si quieres, estimada y aparte con `--tokens N`. Es un commit propio: hazlo
   despues de commitear los informes.
   Escribe cada veredicto con el comando, no a mano:
   `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`.
   Si la ronda esta fragmentada, uno por informe, con el nombre de fichero
   completo: `--informe informe-revision-N-<revisor>.md`. Con CRITICO o
   IMPORTANTE abiertos, `cambios-solicitados`: se corrigen, se commitea, y se
   vuelve a esta skill (abre la ronda siguiente). En modo automatico, si
   `siguiente` da `fase: review` con `accion: continuar` tras los cambios,
   corrige tu los CRITICO e IMPORTANTE del informe (y los MENOR baratos),
   commitea, deja la suite en verde y vuelve al paso 2. Desde la ronda 3,
   `siguiente` pregunta: otra ronda la decide una persona, y un «si» quiere
   decir corregir primero y despues abrir la ronda, nunca relanzarla sobre el
   mismo codigo.
   En automatico, `aprobada-con-correcciones` no se corrige despues: el codigo
   que se mergea tiene que ser el revisado (`finish` pregunta si cambia). Los
   MENOR que merezca la pena corregir se piden como `cambios-solicitados`; el
   resto se documentan como aceptados en el `## Resultado`.
5. **Segunda opinion** (`revision_codex: true` y primaria aprobada):
   ejecuta `taskctl codex-review TASK-NNN` una vez.
   - Si avisa de que Codex no respondio y no escribio informe, muestra el
     aviso y no reintentes: arreglar Codex o quitar `revision_codex` lo
     decide la persona.
   - Si el ultimo informe de Codex pidio cambios, primero se corrigen y se
     commitean; solo despues se vuelve a lanzar.
6. **Veredicto de la segunda opinion** (`veredicto-codex`): lo decide una
   persona. Muestra el `motivo` y la ruta del ultimo `informe-codex-N.md`, y
   pide a la persona que lo lea y diga su veredicto. Escribe su linea
   `- Veredicto:` en ese informe solo con lo que ella diga, y commitealo.
   Nunca lo decidas tu ni lances otra ronda de Codex para salir de aqui.
7. Sigue la seccion de avance (`task-workflow/avance.md`):
   `taskctl siguiente TASK-NNN --json` y lo que indique su `accion`.
