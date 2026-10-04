# Brainstorm — TASK-055, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

(Respuesta volcada por quien orquesta. El agente siguio el formato fijo de su
rol; la «decision que mas preocupa» es la primera alternativa descartada:
CLI mas guion de agente frente a hooks.)

## Enfoque

El CLI decide y el agente ejecuta. Una funcion pura nueva,
`siguienteFase(task, ctx, modo)`, mas `taskctl siguiente TASK-NNN --json`,
dicen que fase toca y si hay que preguntar. Cada `commands/<fase>.md` es un
guion fino: ejecuta su `taskctl`, hace el trabajo de agentes de su fase, llama
a `siguiente` y segun la respuesta termina, pregunta con AskUserQuestion o
invoca el comando siguiente. Los hooks no mueven el ciclo.

## Piezas y limites

- `bin/taskctl.cmd` — nueva — una linea, `@node "%~dp0taskctl" %*`. Sin logica: `bin/taskctl` ya importa `dist/src/cli.js`.
- `src/core/config.ts` — se extiende — `modo_flujo` en `CLAVES_CONFIG` y `CONFIG_DEFAULTS` (`manual`) con validador de enumerado; reutiliza `parsearConfig` y su fallo cerrado.
- `src/core/flujo.ts` — nueva — `siguienteFase(task, ctx: TransitionContext, modo): {fase, comando, preguntar, motivo}`, pura, derivada de `assertTransitionAllowed`/`resultingState` de `state-machine.ts` sin copiar sus condiciones.
- `src/cli.ts` y `src/commands/siguiente.ts` — `siguiente` solo lee, no commitea; calcula el contexto (plan-final, veredicto de la ronda) con los mismos resolutores que approve y review.
- Registro de transiciones — `tarea-body.ts` y cada `run*Command` — fila `fecha | fase | modo | decidido_por` en una seccion `## Transiciones` de `tarea.md`, dentro del `autoCommit` que cada fase ya hace (sin commit extra). `approve` gana `--decidido-por automatico`, y el CLI lo rechaza si `modo_flujo` no es `automatico`: la guarda vive en el CLI, no en el texto del agente.
- `commands/{new,board,plan,approve,start,review,finish}.md` — nuevas — frontmatter (`description`, `argument-hint`, `allowed-tools`). La logica de modos va en una sola seccion compartida de `skills/task-workflow/SKILL.md`; los comandos la referencian.

## Orden de construccion

1. Tarea A (entregable ya): `bin/taskctl.cmd` y README para usar `taskctl` fuera de Claude Code. Criterio: arranca desde PowerShell y desde cmd.
2. Tarea B, nucleo determinista: `modo_flujo`, `core/flujo.ts`, `taskctl siguiente`, `## Transiciones` y `approve --decidido-por`. Criterios 3, 4 y 10, mas el rechazo de `automatico` fuera de modo automatico.
3. Tarea C, comandos de fase en modo manual: los siete `commands/*.md` y la skill. Criterios 2, 5 y 11 (parte manual).
4. Tarea D, modo semiautomatico: AskUserQuestion al cerrar plan, approve, start y review; un no nombra el comando que reanuda. Criterio 6 y el punta a punta con un no en approve.
5. Tarea E, modo automatico: preguntas solo en plan, encadenado sin preguntar, aprobacion registrada como automatica, review tras commit y suite en verde, finish cuando el informe aprueba. Criterios 7, 8 y 9 y el punta a punta en automatico.

## Alternativa descartada

- Encadenar con hooks (`Stop`/`SubagentStop`) que miran el estado y relanzan la fase siguiente: un hook se dispara en todas las sesiones y no sabe si la persona esta en un flujo de tarea; la decision quedaria repartida; en semiautomatico el hook no puede preguntar con AskUserQuestion; cada parada de cualquier sesion pagaria una lectura de estado.
- Un unico comando `/flujo` que haga todo el ciclo: rompe el criterio 2 (reanudar cada fase por su nombre) y mete toda la logica en un guion largo.

## Desacuerdos previstos

- dominio — checkpoint humano: la decision #1 y `TRIVIAL_SIN_APROBACION` en `state-machine.ts` fijan «checkpoint humano siempre». No lo resuelvo yo; si Carlos lo confirma, se reabre en un punto unico (la maquina de estados), aceptando `plan_aprobado` con `decidido_por: automatico`, nunca en el texto de los comandos.
- riesgos — quien afirma que la suite pasa: el CLI no conoce el comando de tests y no propongo una clave `comando_tests`; la suite la ejecuta el agente y el CLI comprueba workspace limpio y commiteado.
- dominio — nombre del comando: el plugin se llama `taskcode-plugin`, asi que el prefijo real seria `/taskcode-plugin:plan`. No renombrar (rompe instalaciones) y corregir el texto del criterio.

## Suposiciones no verificadas

- Que `${CLAUDE_PLUGIN_ROOT}` se sustituye dentro del cuerpo de `commands/*.md`.
- Que un comando de barra puede invocar el siguiente (herramienta SlashCommand o Skill) sin intervencion de la persona; si no, el encadenado va dentro del mismo comando.
- El test que impide mencionar TaskCode solo recorre `skills/` y `agents/`; hay que ampliarlo a `commands/`.
- Que un «no» en semiautomatico no es transicion y no deja fila.
- Que `dist/` versionado basta para que `taskctl.cmd` funcione sin `npm install` en el proyecto que instala el plugin.
