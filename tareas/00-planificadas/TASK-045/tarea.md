---
id: TASK-045
titulo: "F5-T1 rama_base de punta a punta"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-045-f5-t1-rama-base-de-punta-a-punta
asignado_a: null
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


## Criterios de aceptacion
- [ ] Los scripts de Git-Flow reciben la rama base y `finish.ts` deja de fijar `develop`
- [ ] Test: con `rama_base: dev`, `new -> plan -> approve -> start -> review -> finish` termina
