---
id: TASK-164
titulo: "Regla 4D (2a auditoria): skills que contradicen al CLI"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-164-regla-4d-2a-auditoria-skills-que-contrad
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Alinear las skills y agentes con lo que hace el CLI en los casos nuevos de la segunda auditoria 4D (docs/auditoria-4d-segunda.md); los CONT-* siguen en TASK-150.

## Criterios de aceptacion
- [ ] La skill new pide los criterios con los limites del CLI (CT-1)
- [ ] trampas.md lista todos los comandos que exigen rama base (CT-2)
- [ ] review/SKILL.md describe la linea 4D de la autorrevision (CT-4)
- [ ] revisor-seguridad-deploy no promete comprobaciones que el codigo no hace (CT-3)
