---
id: TASK-046
titulo: "F5-T2 Secciones con subtitulos y criterios multilinea"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-046-f5-t2-secciones-con-subtitulos-y-criteri
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
- [ ] `extraerSecciones` no corta el Objetivo ni los criterios en un `###`; `### Tras el cierre` se reconoce como subseccion
- [ ] `import` acepta la continuacion sangrada de un criterio, igual que `tarea-body.ts`
- [ ] Tests con criterios agrupados en `### Parser` y `### CLI`
