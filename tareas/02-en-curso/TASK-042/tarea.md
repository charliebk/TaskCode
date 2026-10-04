---
id: TASK-042
titulo: "F4-T4 Complejidad por defecto por heuristica y un rol sin unificador"
tipo: feature
sprint: 5
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-042-f4-t4-complejidad-por-defecto-por-heuris
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Que una tarea `simple` lance un agente de brainstorm y no tres (auditoria del
2026-10-03, decision C4). Hoy `new` e `import` escriben `complejidad: media`
cuando no se declara, y ese valor por defecto domina el maximo con la
heuristica: casi todas las tareas lanzan 2 roles mas el unificador, aunque la
heuristica diga `simple`. Y con un solo rol, el unificador no consolida
nada: es un agente mas que relee lo que el rol ya escribio.

Decision C4 aprobada: la heuristica decide la complejidad cuando no se
declara; con 1 rol no hay unificador y el rol escribe `plan-final.md`.

Fuera de alcance: recalibrar la heuristica (TASK-052).

## Criterios de aceptacion
- [ ] Sin `--complejidad` declarado, el numero de roles lo decide la heuristica
- [ ] Con 1 rol, `plan` no escribe la peticion de unificador y el rol escribe `plan-final.md`
- [ ] Tests de `plan-brainstorm` actualizados con la nueva expectativa y su motivo
