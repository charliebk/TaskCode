---
id: TASK-013
titulo: "Comando taskctl review (revisión por pares de un solo agente)"
tipo: feature
sprint: 2
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
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

Cerrar la fase de ejecución de una tarea y abrir la de revisión: `taskctl
review TASK-NNN` trae los cambios de la rama base con el script Git-Flow del
tipo, verifica con evidencia Git que el merge ocurrió, mueve la tarea a
`03-en-revision/` y deja en `revision/` la petición para el agente revisor
genérico (con el diff real) más el scaffold de su informe. El CLI hace lo
determinista; el disparo del agente lo hace el orquestador (patrón del plan
mínimo de TASK-010, decisión con Carlos 2026-09-05).

## Criterios de aceptacion
- [ ] Valida la transición `en-curso` → `en-revision` y aborta con mensaje accionable si la tarea no está en `02-en-curso/`, sin tocar Git ni carpetas.
- [ ] Invoca `scripts/gitflow/update-<tipo>.sh` vía `bash` para traer los cambios de la rama base, y verifica con Git que el merge ocurrió de verdad en vez de suponerlo.
- [ ] Mueve la carpeta de la tarea a `03-en-revision/` reutilizando `moveTareaFile` sin modificarla.
- [ ] Dispara un único agente revisor genérico (la fragmentación por dominio es TASK-018) y deja su salida dentro de la carpeta de la tarea.
- [ ] Tests contra un repo Git temporal real que cubren el camino feliz, el rechazo por estado incorrecto y el caso sin `origin`.
