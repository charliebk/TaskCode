---
id: TASK-034
titulo: "F1-T1 Excluir lo generado del diff de revision"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-034-f1-t1-excluir-lo-generado-del-diff-de-re
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
- [ ] Clave opcional `excluir_de_revision` en `.taskcode/config.yml`, por defecto `[**/dist/**, *.lock, *-lock.*, tareas/**]`
- [ ] La peticion incluye `git diff --stat` de lo excluido y la orden para pedir su diff
- [ ] Regenerar la peticion de TASK-031 sobre su rama baja de 325 KB a menos de 100 KB (medido)
- [ ] Test contra un repo real: un cambio en `dist/` no aparece en el diff embebido y si en el `--stat`
