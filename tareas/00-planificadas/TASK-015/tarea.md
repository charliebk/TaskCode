---
id: TASK-015
titulo: "Límite de trabajo en curso por persona"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-015-limite-de-trabajo-en-curso-por-persona
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-009]
---
## Objetivo


## Criterios de aceptacion
- [ ] Comprueba el límite en el momento en que se fija `asignado_a`, con el alcance que decida el punto 13 de la sección 14 de la metodología (límite único o dos límites independientes).
- [ ] El mensaje de error nombra explícitamente la tarea que está bloqueando, igual que el resto de errores de taskctl.
- [ ] Depende de que `plan` y `start` acepten el flag `--asignado-a`, que hoy no existe.
- [ ] Tests que cubren el límite alcanzado, el límite libre y la reasignación.
