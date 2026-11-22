---
id: TASK-153b
titulo: "candidatos 4D en la peticion de revision (parte b de TASK-153)"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-22
dependencias: [TASK-153a]
---
## Objetivo

Parte b del troceo de TASK-153 (Regla 4D en la creacion de codigo y tests), partes TASK-153a, TASK-153b, TASK-153c en la rama feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test.

El CLI genera desde el diff una seccion con los posibles duplicados y los tests a mutar.

## Criterios de aceptacion
- [ ] La peticion de revision trae una seccion de candidatos 4D generada desde el diff: por cada funcion o constante nueva, las existentes con nombre igual o parecido en el repo, con test contra un repo temporal real
- [ ] La misma seccion lista los tests nuevos cuyo nombre promete algo comprobable; con diff sin candidatos lo dice en una linea; las revisoras y revision.md piden mutar esos tests
