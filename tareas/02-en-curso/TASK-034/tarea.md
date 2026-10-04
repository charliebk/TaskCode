---
id: TASK-034
titulo: "F1-T1 Excluir lo generado del diff de revision"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-034-f1-t1-excluir-lo-generado-del-diff-de-re
asignado_a: charlie.bk@gmail.com
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

Que la peticion de `taskctl review` deje de embeber lo que el revisor no
necesita leer: el JS compilado (`dist/`), los lockfiles y la propia carpeta
`tareas/`. Hoy son el 27 % de los bytes de todas las peticiones (auditoria
del 2026-10-03, A1) y el 78 % en el peor caso (TASK-031, 325 KB). Lo excluido
sigue visible como `git diff --stat`, con la orden exacta para pedir su diff,
y la peticion nombra la carpeta de la tarea para que los criterios y el plan
se lean del fichero en lugar del diff.

Fuera de alcance: la ronda 2 incremental (TASK-040) y el contenido de las
instrucciones al revisor (TASK-035).

## Criterios de aceptacion
- [ ] Clave opcional `excluir_de_revision` en `.taskcode/config.yml`, por defecto `[**/dist/**, *.lock, *-lock.*, tareas/**]`
- [ ] La peticion incluye `git diff --stat` de lo excluido y la orden para pedir su diff
- [ ] Regenerar la peticion de TASK-031 sobre su rama baja de 325 KB a menos de 100 KB (medido)
- [ ] Test contra un repo real: un cambio en `dist/` no aparece en el diff embebido y si en el `--stat`
