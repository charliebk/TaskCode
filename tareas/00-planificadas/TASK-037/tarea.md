---
id: TASK-037
titulo: "F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-037-f2-t1-logging-de-los-scripts-de-git-flow
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
- [ ] `_gitflow-common.sh` usa `printf -v` en lugar de `$(date)` y `$(_do_log)`
- [ ] Tiempo de `update-feature.sh` en un repo temporal medido antes y despues y anotado en el Resultado
- [ ] Salida y fichero de log identicos (salvo la hora) en un caso de prueba
- [ ] Tests de `test/gitflow/` en verde
