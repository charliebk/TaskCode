---
id: TASK-040
titulo: "F3-T1 taskctl review para la ronda 2 y siguientes"
tipo: feature
sprint: 4
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-040-f3-t1-taskctl-review-para-la-ronda-2-y-s
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
- [ ] Transicion `en-revision -> en-revision` permitida solo si el ultimo informe dice `cambios-solicitados` o `aprobada con correcciones`
- [ ] `review` escribe `ultimo_commit_revisado` en cada ronda y la ronda N+1 embebe `ultimo_commit_revisado..HEAD` con las exclusiones de F1-T1
- [ ] La peticion lista los hallazgos no cerrados de la tabla del informe anterior
- [ ] Los mensajes de error dejan de mandar de `start` a `plan` en circulo
- [ ] Test que encadena ronda 1, cambios y ronda 2 contra un repo real
