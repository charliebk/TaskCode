---
id: TASK-052
titulo: "F6-T5 Telemetria de fases y heuristica recalibrada"
tipo: feature
sprint: 7
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-052-f6-t5-telemetria-de-fases-y-heuristica-r
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo


## Criterios de aceptacion
- [ ] Cada transicion escribe su marca de tiempo en el frontmatter y `taskctl metricas` saca la tabla de fases por tarea
- [ ] Heuristica recalibrada con las tareas cerradas usando las rondas como coste real; se quitan `tolerancia_*` y `modelo_consulta_discrepancia`
