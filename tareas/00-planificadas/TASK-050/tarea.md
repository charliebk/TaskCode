---
id: TASK-050
titulo: "F6-T1 Suite rapida y repo plantilla en los tests"
tipo: feature
sprint: 7
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-050-f6-t1-suite-rapida-y-repo-plantilla-en-l
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
- [ ] `npm run test:rapido` (core y cli, sin procesos) en menos de 1 min; `npm test` sigue siendo la suite completa
- [ ] Helper que crea el repo base una vez por fichero y lo copia con `fs.cp`, adoptado en los 5 ficheros mas lentos
- [ ] Medicion con y sin `--experimental-test-coverage` anotada; si compensa, `test:cov` aparte
