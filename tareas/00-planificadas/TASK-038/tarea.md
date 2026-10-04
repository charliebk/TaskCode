---
id: TASK-038
titulo: "F2-T2 Una sola deteccion de origin por invocacion, con timeout"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-038-f2-t2-una-sola-deteccion-de-origin-por-i
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
- [ ] `detect_origin_available` cachea su resultado por invocacion; `update-feature.sh` deja de reimplementarla
- [ ] `git ls-remote` con limite de 5 s, portatil en Git Bash y Linux
- [ ] `merge-feature-to-develop.sh` aplica la guarda de origin configurado pero caido
- [ ] Test con un origin inalcanzable: el comando responde en menos de 10 s
