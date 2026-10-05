---
id: TASK-054
titulo: "Rutas no ASCII en el diff de revision fragmentado por dominio"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: fix/task-054-rutas-no-ascii-en-el-diff-de-revision-fr
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

`diffNameOnly` y `diffParaRevision` llaman a git sin `-z` ni
`core.quotePath=false`, asi que una ruta con caracteres no ASCII sale
entrecomillada y escapada en octal (`"src/acciÃ³n.ts"`). Al
fragmentar la revision por dominio, la clasificacion usa esa ruta escapada y
el diff del fichero no llega a la peticion de su dominio (MENOR-6 de
TASK-034). El objetivo es que la ruta sea la misma en la clasificacion y en
el diff, y que el fichero aparezca en la peticion que le corresponde.

## Criterios de aceptacion
- [ ] `diffNameOnly` y `diffParaRevision` usan `-z` (o `core.quotePath=false`) y una ruta con caracteres no ASCII aparece igual en la clasificacion y en el diff
- [ ] Test con un fichero `src/acción.ts` en una revision fragmentada: su diff aparece en la peticion de su dominio

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
