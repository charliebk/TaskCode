---
id: TASK-023
titulo: "Métricas de coste en tokens por fase"
tipo: feature
sprint: 4
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-023-metricas-de-coste-en-tokens-por-fase
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 3445774
tokens_implementacion: 18803413
tokens_revision: 5375382
creado: 2026-09-05
actualizado: 2026-10-06
dependencias: [TASK-014]
---
## Objetivo

La sección 16 de `docs/PROPUESTA_METODOLOGIA.md` diseñó dónde el proceso
necesita un LLM y dónde no, pero se quedó en estimación: nunca se
contrastó con coste real medido. La decisión #15 de la sección 14 (`docs/
contexto/CHECKLIST_TERMINACION.md`) ya lo dejó dicho al aceptar los pesos
de la heurística de complejidad (§16.1) "tal cual, y se ajustan cuando
haya datos" — hoy no hay datos.

Restricción de partida, importante para el diseño: `taskctl` es un CLI
determinista que no llama a ningún LLM por sí mismo (sección 16, tabla) —
quien sí gasta tokens es el agente de Claude Code que orquesta `plan`,
`review`, etc., desde fuera del CLI. `taskctl` no tiene visibilidad directa
de ese consumo; cualquier medición depende de que se registre desde donde
sí se ve (la sesión del agente), no de instrumentar el propio binario.

Esta tarea busca cerrar ese hueco: dejar un mecanismo para registrar el
coste real en tokens de las fases que sí usan LLM (brainstorm, revisión
por pares, Codex) tarea a tarea, agregarlo por sprint en `docs/METRICAS.md`
contrastándolo contra lo estimado en la sección 16, y usar esos datos
reales para revisar si los pesos de `scripts/heuristica-complejidad.yml`
siguen siendo razonables o hace falta ajustarlos.

## Criterios de aceptacion
- [ ] Cada tarea registra en su `tarea.md` el coste en tokens de sus fases de diseño, implementación y revisión.
- [ ] `docs/METRICAS.md` agrega esos datos por sprint y los contrasta con las estimaciones de la sección 16.
- [ ] Con esos datos reales se revisan los pesos de la heurística de complejidad, que es el punto 15 de la sección 14.
- [ ] Tests del cálculo de agregados con datos de ejemplo.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-06T11:08:43Z | start | manual | persona |
| 2026-10-06T13:13:14Z | review | manual | persona |
