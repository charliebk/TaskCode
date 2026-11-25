---
id: TASK-150c
titulo: "formatos del brainstorm y secciones del plan con una fuente (parte c de TASK-150)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
asignado_a: charlie.bk@gmail.com
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
dependencias: [TASK-150b]
---
## Objetivo

Parte c del troceo de TASK-150 (Regla 4D: skills y agentes con una sola fuente por regla), partes TASK-150a, TASK-150b, TASK-150c, TASK-150d en la rama fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f.

CONT-06, CONT-07 y CORE2-03.

## Criterios de aceptacion
- [ ] Los formatos de salida de los agentes brainstorm coinciden con roles-brainstorm.ts y las secciones del plan (Duracion estimada y presupuesto de tests incluidos) salen de una sola fuente que usan plan.ts, plan-brainstorm.ts y el unificador
- [ ] Un test falla si un agente y roles-brainstorm.ts divergen

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T12:52:14Z | plan | automatico | persona | 0.18.0 |
