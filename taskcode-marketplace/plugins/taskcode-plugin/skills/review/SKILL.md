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
     dilo. Si lo esta, haz la **autorrevision** (abajo), ejecuta
     `taskctl review TASK-NNN` y sigue en el paso 3.
   - `veredicto`: ya hay peticion de revision; sigue en el paso 3.
   - `codex-review`: paso 5.
   - `veredicto-codex`: paso 6. **No ejecutes `codex-review`**.
   - `verificar-menores`: ultimo bloque del paso 4 (MENORES tras aprobar).

   **Autorrevision**, antes de cada `taskctl review` y sin lanzar ningun
   agente: la haces tu, en tu contexto. El campo `revisores` del JSON de
   `siguiente` dice que skills revisoras le tocan a la tarea (lo calcula el
   mismo clasificador que reparte la revision: no lo deduzcas tu de los
   patrones). De cada una lee **solo** su seccion `## Que se revisa`, en
   `../<revisora>/SKILL.md`, sin copiarla a ningun sitio, y repasa con ella
   tu diff; corrige lo evidente y commitea. Despues anota la constancia al
   final de `tarea.md`, bajo `## Autorrevision` (creala si no existe), una
   linea por revisora: `- <revisora> — <commit>`, con el commit corto que
   repasaste, y nada mas. Sin juicios ni «sin hallazgos»: el revisor lee
   `tarea.md` y no debe anclarse. Commitea antes de `taskctl review` (con el
   workspace sucio aborta). En cada ronda siguiente, anade otra linea. Si el
   JSON no trae `revisores`, usa las revisoras cuya `description` encaje
   con los ficheros del diff, y `code-quality-reviewer` para el resto.
   `taskctl review` avisa, sin bloquear, si falta la constancia.
3. Por cada `revision/peticion-revision-N*.md` de la ronda que no tenga ya su
   informe con veredicto (una por dominio si esta fragmentada), lanza un
   agente revisor independiente, en paralelo y en un solo mensaje, con la
   skill revisora que nombra la peticion. **El prompt de cada revisor lleva
   la ruta de SU peticion** (`revision/peticion-revision-N[-skill].md`): de
   ahi deducen las metricas la ronda y el revisor de cada agente, y ahi esta
   su `## Contexto permitido`. Si la peticion trae la linea
   `- Modelo sugerido para esta ronda: <modelo> (...)`, lanza el revisor con
   ESE modelo; si no, con el `modelo sugerido` de la linea `Agente a lanzar`.
   Si la peticion dice `- Alcance: verificacion acotada ...`, el revisor
   sigue SUS instrucciones (verificar cada hallazgo, ejecutar la suite y
   buscar el fallo que abre la correccion), no las de una revision completa.
   Que reproduzca empiricamente (clon
   temporal, suite una vez, mutantes) y devuelva su informe con la tabla de
   hallazgos, con la columna `Origen` rellena en cada fila
   (`implementacion`, `plan` o `especificacion`: si el fallo es del codigo,
   de un plan ambiguo que el codigo siguio, o del enunciado de la tarea).
   Vuelca cada respuesta en su `informe-revision-N*.md`
   **conservando la cabecera de la plantilla** con la linea `- Revisor:`
   rellenada, su linea `- Veredicto:`, y la fila de ejemplo de la tabla
   borrada (tambien sin hallazgos); un informe que conserve la plantilla sin
   rellenar no cuenta como revisado,
   y dejalo sin commitear: lo incluye el commit del siguiente `taskctl review`
   o `taskctl finish`. Nunca lo mezcles en un commit con codigo: en modo
   automatico, `finish` no sigue solo si un informe va mezclado con codigo.
4. Registra el coste de la revision (`task-workflow/coste.md`) con el id que
   devolvio la herramienta Agent de cada revisor:
   `taskctl registrar-coste TASK-NNN --fase revision --agente <id>
   [--agente <id2>...]` (una vez por ronda; suma). La cifra que muestra Claude
   Code al terminar un agente NO es su coste (es su contexto final). Tu parte,
   si quieres, estimada y aparte con `--tokens N`. No crea commit: queda
   pendiente con los informes.
   Escribe cada veredicto con el comando, no a mano:
   `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`.
   Si la ronda esta fragmentada, uno por informe, con el nombre de fichero
   completo: `--informe informe-revision-N-<revisor>.md`. Con CRITICO o
   IMPORTANTE abiertos, `cambios-solicitados`: se corrigen, se commitea, y se
   vuelve a esta skill (abre la ronda siguiente).
   **Antes de abrir la ronda siguiente se corrige TODO lo de la ronda**, en
   cualquier modo: los CRITICO e IMPORTANTE siempre; un MENOR que no compense
   corregir se marca `aceptado` con su motivo en su informe o se pasa a una
   tarea nueva. Nunca se deja nada para la ronda siguiente: corregir de uno en
   uno es lo que convierte trece hallazgos en trece rondas. Lo corregido se
   marca `corregido` en la columna Estado de su informe (sin mezclarlo en un
   commit de codigo). `taskctl review` avisa si queda alguno sin marcar. En modo
   automatico, si `siguiente` da `fase: review` con `accion: continuar`, haz tu
   todo eso, commitea, deja la suite en verde y vuelve al paso 2. Desde la
   ronda 2 la ronda es una verificacion acotada: cada revisor comprueba sus
   hallazgos CRITICO e IMPORTANTE pendientes y el diff de la correccion, y solo
   abre uno nuevo si es CRITICO o lo introduce la correccion. Los MENORES no se
   reverifican (los compruebas tu), y un revisor que solo tenia MENORES y cuyos
   ficheros no toca la correccion no recibe peticion: `taskctl review` lo anota
   en `## Revisores no relanzados` de `tarea.md`.
   **Tope** (`tope_rondas` de la config de la rama base, 2 por defecto): si
   la ultima ronda permitida pide cambios, `siguiente` pregunta en cualquier
   modo, tambien en automatico, y trae tres `salidas`. Pregunta a la persona
   y no elijas tu: **cerrar** con lo que hay (lo abierto, `aceptado` con sus
   IDs y el motivo en el `## Resultado`); **una ronda mas** (corregir,
   commitear, anotar en `tarea.md` bajo `## Rondas extra` la linea
   `- Ronda N: <quien lo decide y por que>` y
   `taskctl review TASK-NNN --ronda-extra`); o **volver a diseno** (lo abierto, en una tarea nueva con
   `taskctl new`, enlazada desde el Resultado). Sin esa linea `review` no abre
   la ronda, y cada ronda extra vuelve a preguntar y pide la suya.
   **MENORES tras aprobar** (`aprobada-con-correcciones` sin CRITICO ni
   IMPORTANTE abiertos): **nunca** se piden como `cambios-solicitados` ni
   abren otra ronda, en ningun modo. Corrige los baratos tocando solo los
   ficheros que cita cada MENOR (y sus tests), commitea y ejecuta
   `taskctl verificar-menores TASK-NNN [--motivo "<por que no se corrigen
   los demas>"]`: comprueba que lo cambiado desde el `Commit revisado` se
   limita a eso, lo registra en `tarea.md` y deja los MENORES no corregidos
   en `revision/menores-pendientes.md` (backlog: no bloquean `finish`).
   Si aborta porque hay un fichero ajeno, no lo fuerces: o se deshace ese
   cambio, o hace falta otra ronda, o una persona decide
   `taskctl finish TASK-NNN --aceptar-sin-revisar`. `finish` no integra
   codigo posterior al revisado sin una de las dos cosas. Un CRITICO o
   IMPORTANTE abierto sigue siendo `cambios-solicitados` y otra ronda.
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
