---
id: TASK-041
titulo: "F4-T1 taskctl new con objetivo y criterios"
tipo: feature
sprint: 5
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-041-f4-t1-taskctl-new-con-objetivo-y-criteri
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

Que una tarea nazca con su objetivo y sus criterios, sin editar `tarea.md`
despues (auditoria del 2026-10-03, C1). Hoy `taskctl new` deja el Objetivo
vacio y un criterio `- [ ] ` vacio a proposito, y cada tarea de este backlog ha
necesitado un commit aparte solo para escribirlos. Con `--objetivo` y
`--criterio` (repetible), o con `--desde <fichero>` que ya tenga esas dos
secciones, la tarea queda definida en el mismo commit en que se crea.

Fuera de alcance: validar que los criterios sean verificables (TASK-043).

## Criterios de aceptacion
- [ ] `taskctl new --objetivo "<texto>" --criterio "<texto>"` (repetible) escribe ambas secciones
- [ ] `taskctl new --desde <fichero fuera del repo>` toma objetivo y criterios de un markdown
- [ ] Sin esos flags el comportamiento es el de hoy
