---
id: TASK-035
titulo: "F1-T2 Politica de rondas y una sola suite por ronda en las skills"
tipo: feature
sprint: 2
etiquetas: []
complejidad: trivial
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

Llevar a las skills la politica de rondas A3 y la regla A4 de la auditoria
del 2026-10-03, aprobadas por Carlos: sin CRITICO ni IMPORTANTE abiertos una
ronda cierra la tarea, los MENOR corregidos no abren ronda 2, y el revisor
corre la suite completa una sola vez por ronda (los mutantes, con el fichero
de test concreto). Hoy la skill de flujo y dos revisoras dicen «dos rondas es
lo normal», y las revisoras piden la suite entera dos veces.

Solo documentacion: no toca `src/`. Complejidad `trivial` (no `simple`, como
se importo): el contenido ya esta decidido y no hay diseno que explorar.

## Criterios de aceptacion
- [ ] `task-workflow/SKILL.md` recoge la politica A3: sin CRITICO ni IMPORTANTE abiertos una ronda cierra; si solo se corrigen MENOR no hay ronda 2; la ronda 2 solo revisa el delta
- [ ] Las 4 skills revisoras piden la suite completa una vez por ronda y los mutantes con `node --test <fichero>`
- [ ] Con varios revisores en paralelo, instruccion de concurrencia reducida
- [ ] Tests de `test/skills/` en verde, incluido el de no mencionar el proyecto
