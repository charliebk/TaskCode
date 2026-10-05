---
id: TASK-047
titulo: "F5-T3 Flags desconocidos y mensajes de review"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-047-f5-t3-flags-desconocidos-y-mensajes-de-r
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

Tres MENOR de la auditoria (D4, D6, D10) que confunden a quien usa el CLI.
Un flag mal escrito (`--complejida trivial`) se ignora en silencio y la tarea
sale con otra complejidad: debe abortar diciendo cuales son los flags validos
y cual se parece al escrito, como ya hace el parser de config. La salida de
`review` dice «lanza ese agente» nombrando una skill revisora: debe separar
el agente que se lanza (`agente_revisor`) de la skill que carga, y usar
`modelo_sugerido`, que hoy no lee nadie. Y `codex-review.ts` duplica helpers
de `finish.ts`: debe reutilizarlos.

## Criterios de aceptacion
- [ ] Un flag desconocido aborta con la lista de flags validos y una sugerencia
- [ ] La salida de `review` nombra agente y skill por separado y usa `modelo_sugerido`
- [ ] `codex-review.ts` reutiliza los helpers de `finish.ts` en lugar de duplicarlos

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
| 2026-10-05 | review | manual | persona |
