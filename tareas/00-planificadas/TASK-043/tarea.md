---
id: TASK-043
titulo: "F4-T2 Validacion antes de plan y puertas de cierre"
tipo: feature
sprint: 5
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-043-f4-t2-validacion-antes-de-plan-y-puertas
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
- [ ] `plan` aborta sin mover la tarea si el objetivo esta vacio, hay 0 criterios o mas de 8, o alguno esta vacio
- [ ] Lint de verificabilidad: cada criterio cita un comando, una ruta, un numero, codigo o un test; `mejorar`, `robusto` o `correctamente` solos se rechazan con el motivo
- [ ] `approve` rechaza un `plan-final.md` con todas las secciones vacias
- [ ] `finish` avisa de casillas sin marcar fuera de `### Tras el cierre`
- [ ] Probado sobre las 17 tareas cerradas: se listan las que habrian sido rechazadas y por que
