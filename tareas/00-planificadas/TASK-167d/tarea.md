---
id: TASK-167d
titulo: "tendencia de hallazgos 4D en las metricas (parte d de TASK-167)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
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
dependencias: [TASK-167c]
---
## Objetivo

Parte d del troceo de TASK-167 (Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)), partes TASK-167a, TASK-167b, TASK-167c, TASK-167d en la rama feature/task-167-regla-4d-preventiva-en-los-proyectos-que.

`taskctl metricas` lee los informes de auditoria (`docs/auditoria-4d-*.md`)
y muestra la serie por D entre auditorias, ademas de lo que ya da por tarea.

Troceo sin preguntar: autorizado por Carlos (2026-11-22 y 2026-11-25).

## Criterios de aceptacion
- [ ] taskctl metricas muestra la tendencia de hallazgos 4D por proyecto entre auditorias y por tarea
- [ ] Un test por pieza falla si deja de instalarse o de comprobar lo suyo
