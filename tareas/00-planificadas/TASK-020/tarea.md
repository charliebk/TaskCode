---
id: TASK-020
titulo: "Comando taskctl codex-review (segunda opinión independiente)"
tipo: feature
sprint: 3
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-020-comando-taskctl-codex-review-segunda-opi
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
- [ ] Solo se ejecuta si la revisión primaria ya está aprobada y la tarea tiene `revision_codex: true`.
- [ ] Envuelve el CLI de Codex y guarda su salida en la carpeta de la tarea, sin mezclarla con la de la revisión primaria.
- [ ] Si Codex no está instalado, avisa y degrada con elegancia en vez de romper el flujo.
- [ ] Tests que cubren la precondición de estado y la ausencia del CLI.
