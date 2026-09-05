---
id: TASK-018
titulo: "Enrutado de revisor por diff real, fragmentado por dominio"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: planificada
plan_aprobado: false
rama: feature/task-018-enrutado-de-revisor-por-diff-real-fragme
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-013]
---
## Objetivo


## Criterios de aceptacion
- [ ] Clasifica el diff real de la rama por dominio en vez de por el tipo declarado de la tarea.
- [ ] Fragmenta la revisión en un agente por dominio hasta el umbral que fije el punto 16 de la sección 14, y por encima de ese umbral cae a un único revisor genérico.
- [ ] Cada revisor recibe solo el subconjunto del diff de su dominio.
- [ ] Tests con diffs sintéticos que cubren un dominio, varios por debajo del umbral y varios por encima.
