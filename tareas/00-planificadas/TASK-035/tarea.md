---
id: TASK-035
titulo: "F1-T2 Politica de rondas y una sola suite por ronda en las skills"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-035-f1-t2-politica-de-rondas-y-una-sola-suit
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
- [ ] `task-workflow/SKILL.md` recoge la politica A3: sin CRITICO ni IMPORTANTE abiertos una ronda cierra; si solo se corrigen MENOR no hay ronda 2; la ronda 2 solo revisa el delta
- [ ] Las 4 skills revisoras piden la suite completa una vez por ronda y los mutantes con `node --test <fichero>`
- [ ] Con varios revisores en paralelo, instruccion de concurrencia reducida
- [ ] Tests de `test/skills/` en verde, incluido el de no mencionar el proyecto
