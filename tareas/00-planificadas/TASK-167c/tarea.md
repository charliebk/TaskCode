---
id: TASK-167c
titulo: "auditoria 4D invocable (parte c de TASK-167)"
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
dependencias: [TASK-167b]
---
## Objetivo

Parte c del troceo de TASK-167 (Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)), partes TASK-167a, TASK-167b, TASK-167c, TASK-167d en la rama feature/task-167-regla-4d-preventiva-en-los-proyectos-que.

Skill `auditoria-4d` (y su paso en task-workflow) que lanza agentes de
solo lectura por zona del proyecto, consolida los hallazgos por D y
severidad en `docs/auditoria-4d-<fecha>.md` con plan por olas, y, si la
persona lo pide, crea una tarea por ola con `taskctl new`.

## Criterios de aceptacion
- [ ] Hay una auditoria 4D invocable para el proyecto que produce hallazgos clasificados por D y un plan de correccion por olas
- [ ] Un test falla si la skill pierde el formato del informe o la creacion de tareas por ola
