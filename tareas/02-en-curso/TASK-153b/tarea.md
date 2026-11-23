---
id: TASK-153b
titulo: "candidatos 4D en la peticion de revision (parte b de TASK-153)"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: [TASK-153a]
---
## Objetivo

Parte b del troceo de TASK-153 (Regla 4D en la creacion de codigo y tests), partes TASK-153a, TASK-153b, TASK-153c en la rama feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test.

El CLI genera desde el diff una seccion con los posibles duplicados y los tests a mutar.

## Criterios de aceptacion
- [ ] La peticion de revision trae una seccion de candidatos 4D generada desde el diff: por cada funcion o constante nueva, las existentes con nombre igual o parecido en el repo, con test contra un repo temporal real
- [ ] La misma seccion lista los tests nuevos cuyo nombre promete algo comprobable; con diff sin candidatos lo dice en una linea; las revisoras y revision.md piden mutar esos tests

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T00:15:36Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T00:15:56Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T00:15:58Z | start | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — ddcdf62: helper buscado (distanciaEdicion, diffRangeForPaths, runGit, patron extras.seccionCobertura; ningun lector de definiciones previo); criterios citados; 5 tests nuevos, 5 mutaciones en rojo (seccion no anadida, nombres parecidos, promesas, fallo de git tragado, revision.md).
- code-quality-reviewer — ddcdf62
