---
id: TASK-013
titulo: "Comando taskctl review (revisión por pares de un solo agente)"
tipo: feature
sprint: 2
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-013-comando-taskctl-review-revision-por-pare
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-012]
---
## Objetivo


## Criterios de aceptacion
- [ ] Valida la transición `en-curso` → `en-revision` y aborta con mensaje accionable si la tarea no está en `02-en-curso/`, sin tocar Git ni carpetas.
- [ ] Invoca `scripts/gitflow/update-<tipo>.sh` vía `bash` para traer los cambios de la rama base, y verifica con Git que el merge ocurrió de verdad en vez de suponerlo.
- [ ] Mueve la carpeta de la tarea a `03-en-revision/` reutilizando `moveTareaFile` sin modificarla.
- [ ] Dispara un único agente revisor genérico (la fragmentación por dominio es TASK-018) y deja su salida dentro de la carpeta de la tarea.
- [ ] Tests contra un repo Git temporal real que cubren el camino feliz, el rechazo por estado incorrecto y el caso sin `origin`.
