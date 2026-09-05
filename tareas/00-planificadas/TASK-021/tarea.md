---
id: TASK-021
titulo: "Publicar el marketplace y la versión v0.1.0 del plugin"
tipo: feature
sprint: 4
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-021-publicar-el-marketplace-y-la-version-v0
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: []
---
## Objetivo


## Criterios de aceptacion
- [ ] Repo privado en GitHub con el layout monorepo de la sección 7.10, y `marketplace.json` validado contra el schema oficial.
- [ ] Tag `v0.1.0` publicado y el campo `version` del marketplace y del plugin alineados con él.
- [ ] Probado de verdad, no supuesto: `/plugin marketplace add` seguido de `/plugin install` desde una sesión de Claude Code real.
- [ ] Deja registrado el comportamiento real de `/plugin marketplace update`, que es el punto 10 de la sección 14.
