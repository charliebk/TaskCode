---
id: TASK-039
titulo: "F2-T3 Menos llamadas git en los comandos"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-039-f2-t3-menos-llamadas-git-en-los-comandos
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

Quitar las llamadas `git` sobrantes de los comandos de `taskctl` sin cambiar su
comportamiento (auditoria del 2026-10-03, B6). Medido con `GIT_TRACE2_EVENT`
en un ciclo completo: `review` lanza 27 procesos `git` y `finish` 33. La mayor
parte de los que se repiten no estan duplicados dentro del CLI: los hace una
vez el comando y otra el script de Git-Flow, que es la fuente de verdad y no
se toca aqui. Lo que si sobra esta en `autoCommit`: un `git add` por ruta (5
en `finish`), `rev-parse --short` mas `show --name-only` para lo mismo, y el
`maintenance run --auto` que Git lanza tras cada commit automatico.

## Criterios de aceptacion
- [ ] `finish` baja de 35 a 20 o menos procesos `git` y `review` de 26 a 15 o menos, medido con `GIT_TRACE2_EVENT`
- [ ] Suite en verde sin tocar expectativas
