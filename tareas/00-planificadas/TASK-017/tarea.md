---
id: TASK-017
titulo: "Catálogo de skills determinista con selección en dos pasos"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: planificada
plan_aprobado: false
rama: feature/task-017-catalogo-de-skills-determinista-con-sele
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-010]
---
## Objetivo


## Criterios de aceptacion
- [ ] Crea `scripts/catalogo-skills.yml` con los skills propios y externos que el equipo ya usa.
- [ ] La selección es determinista primero (heurística por etiquetas, tipo y ficheros tocados) y solo recurre a un LLM para desempatar.
- [ ] Registra en la tarea qué skills se seleccionaron y por qué regla, para poder auditarlo después.
- [ ] Tests de la heurística con casos de empate y de no coincidencia.
