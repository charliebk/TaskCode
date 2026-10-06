# Brainstorm arquitectura — TASK-023 (ronda 1)

## Enfoque propuesto, con rutas y nombres concretos

Extender `Task` en `src/core/task.ts` con 3 campos nuevos, nullable, enteros —
`tokens_diseno`, `tokens_implementacion`, `tokens_revision` (uno por fase de
la CA1) — validados con un `requireNullableNumber()` nuevo, espejo exacto de
`requireNullableString` (ya usado por `asignado_a`, líneas 161-168). Se
añaden al final de `TASK_FIELD_ORDER`. No toca `frontmatter.ts`: son
escalares planos, el bucle `clave: valor` ya los soporta sin cambios (nada
de listas en bloque, la trampa de D7).

Nuevo comando `taskctl registrar-coste <id> --fase <diseno|implementacion|revision> --tokens <N>`
(`src/commands/registrar-coste.ts`, cableado en `src/cli.ts`) que sigue el
mismo patrón lectura-completa→mutación→`writeTareaFile` que usan
`plan.ts`/`approve.ts`/`start.ts` — **verificado**: no existe hoy ningún
"patch" parcial de un campo, cada comando reescribe el `Task` entero
(`task-store.ts` solo expone `writeTareaFile`/`moveTareaFile`, ninguno
parcial). El comando **suma** en vez de sobrescribir, porque brainstorm y
revisión tienen varias rondas/agentes que reportan por separado. Lo dispara
el agente orquestador de Claude Code, no `taskctl`: el objetivo ya deja
escrito que el CLI no ve tokens.

Para la agregación por sprint, extender `taskctl board` con un modo
`--tokens` (alternativa: `taskctl metricas` nuevo) que recorre
`listTareasEnEstados`, suma por sprint y por fase, y con `--escribir`
regenera una sección de `docs/METRICAS.md` — mismo patrón que
`renderBoardMarkdown` comparten `board.ts` y `finish.ts` para `BOARD.md`.
"Contrastar contra lo estimado en la sección 16" no compara contra una
cifra de tokens (la sección 16 no fija ninguna): agrupa por `complejidad`
declarada y compara el total real contra el nivel que asignaría
`scripts/heuristica-complejidad.yml` — es el dato que la decisión #15 del
`CHECKLIST_TERMINACION.md` dejó pendiente por falta de datos reales.

## Qué se extiende y qué se crea

- `src/core/task.ts` (`Task`, `TASK_FIELD_ORDER`, `requireNullableNumber`) — se extiende.
- `src/core/frontmatter.ts` — no se toca.
- `src/commands/registrar-coste.ts` + entrada en `src/cli.ts` — se crea.
- `src/commands/board.ts` (o `src/commands/metricas.ts`) — se extiende/crea para la agregación por sprint.
- `docs/METRICAS.md` — pasa de redactado a mano (como hasta TASK-022, ver su cabecera: "se redactó en modo solo-lectura... sin lanzar `npm test`") a tener una zona generada, como ya pasó con `BOARD.md` en B5.
- `scripts/heuristica-complejidad.yml` — se **lee**, no se escribe: ajustar sus pesos (CA3) es una decisión humana informada por el contraste, no una reescritura automática.

## Límites que cruza

- **Esquema de `tarea.md`**: 3 claves nuevas que las tareas existentes no
  tienen. Verificado que no rompe nada: `requireNullableString` (y el
  `requireNullableNumber` que se le calca) trata clave-ausente igual que
  `null` — mismo comportamiento ya en producción para `asignado_a` y
  `ultimo_commit_revisado` — así que ninguna de las 41 tareas ya cerradas
  falla al releerse; se rellenan en `null` la próxima vez que ese fichero se
  reescriba.
- **Contrato CLI↔agente**: superficie nueva que un agente debe invocar
  explícitamente tras cada fase; es dato autorreportado, no medido por el
  CLI.
- **Formato de fichero**: `docs/METRICAS.md` deja de ser 100% prosa manual y
  gana una zona regenerable — decidir si es un fichero separado
  (`docs/METRICAS-tokens.md`) o una sección delimitada dentro del mismo,
  para no pisar la narrativa manual de las secciones 1-10 actuales.

## La decisión de diseño que más te preocupa (UNA sola)

Que el dato dependa de que el agente orquestador se acuerde de llamar a
`registrar-coste` en cada fase, en vez de venir de algo que `taskctl` pueda
verificar por sí solo. Ya hay un precedente exacto de este riesgo
materializado: `ultimo_commit_revisado` existe en el esquema desde hace
tareas (`task.ts:70`, inicializado a `null` en `new.ts:169`) pero
**verificado por grep**: ningún comando (`review.ts`, `finish.ts`) lo
actualiza nunca — el comentario en `review.ts:16-18` explica cuándo
*debería* escribirse, pero nadie lo hizo. Si `registrar-coste` sufre el
mismo destino, el agregado por sprint queda con `null` silencioso sin que
nada lo señale, y no hay heurística determinista posible para detectarlo
porque, por diseño, `taskctl` no tiene visibilidad de tokens.
