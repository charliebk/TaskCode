---
id: TASK-153
titulo: "Regla 4D en la creacion de codigo y tests"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
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
actualizado: 2026-11-22
dependencias: []
---
## Objetivo

Que la Regla 4D actue al crear el codigo y los tests, no solo al revisarlos, para que cada tarea hecha con el plugin deje menos hallazgos 4D (peticion de Carlos tras la auditoria de TASK-141). Hoy la regla vive sobre todo en la revision: los agentes de plan tienen prohibido pensar en pruebas (CONT-07), la linea 4D de la autorrevision se da por buena con cualquier texto (CONT-08) y nadie senala al revisor los posibles duplicados ni los tests que conviene mutar.

## Criterios de aceptacion
- [ ] plan-final.md lleva una seccion de reutilizacion (Regla 4D) con los helpers, funciones y fixtures existentes que se usaran, buscados antes de disenar; la plantilla de plan, las peticiones de los agentes de plan y el unificador la piden, y approve avisa si falta o esta vacia
- [ ] review avisa si la autorrevision no trae la linea 4D (helper buscado, criterios citados, tests mutados) del ultimo commit, y la skill start lista los patrones de disfraz en tests que encontro la auditoria (nombre que promete sin asercion, datos que no distinguen, rejects sin matcher, skip que esconde un fallo)
- [ ] La peticion de revision trae una seccion de candidatos 4D generada por el CLI desde el diff: por cada funcion o constante nueva, las existentes con nombre parecido en el repo, y los tests nuevos cuyo nombre promete algo comprobable, para que el revisor los mute
- [ ] taskctl metricas cuenta por tarea los hallazgos 4D de sus informes (por regla, desde la seccion Regla 4D) para ver si bajan con el tiempo

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-22T23:02:18Z | plan | automatico | persona | 0.16.1 |
