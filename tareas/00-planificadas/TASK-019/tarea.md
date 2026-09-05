---
id: TASK-019
titulo: "Revisión ligera sin agente para tareas triviales"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-019-revision-ligera-sin-agente-para-tareas-t
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-013]
---
## Objetivo


## Criterios de aceptacion
- [ ] Aplica una checklist determinista en vez de lanzar un agente, con el alcance que fije el punto 17 de la sección 14 (solo `trivial`, o también `simple`).
- [ ] La checklist deja constancia escrita en la carpeta de la tarea: es una revisión de verdad, no un trámite vacío.
- [ ] Cualquier item de la checklist que falle bloquea el paso a `terminada` igual que lo haría un revisor.
- [ ] Tests que cubren checklist completa, checklist con fallos y el escalado a revisión normal.
