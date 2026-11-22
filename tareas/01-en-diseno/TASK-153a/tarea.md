---
id: TASK-153a
titulo: "plan con reutilizacion y autorrevision 4D exigida (parte a de TASK-153)"
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

Parte a del troceo de TASK-153 (Regla 4D en la creacion de codigo y tests), partes TASK-153a, TASK-153b, TASK-153c en la rama feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test.

La plantilla del plan y las peticiones de los agentes piden la seccion de reutilizacion, approve avisa si falta o esta vacia, review avisa si la autorrevision no trae la linea 4D, y start lista los patrones de disfraz en tests.

Objetivo de la tarea entera:

> Que la Regla 4D actue al crear el codigo y los tests, no solo al revisarlos, para que cada tarea hecha con el plugin deje menos hallazgos 4D (peticion de Carlos tras la auditoria de TASK-141). Hoy la regla vive sobre todo en la revision: los agentes de plan tienen prohibido pensar en pruebas (CONT-07), la linea 4D de la autorrevision se da por buena con cualquier texto (CONT-08) y nadie senala al revisor los posibles duplicados ni los tests que conviene mutar.

## Criterios de aceptacion

- [ ] plan-final.md lleva una seccion de reutilizacion (Regla 4D) con los helpers, funciones y fixtures existentes que se usaran; la plantilla de plan, las peticiones de redaccion y del unificador y los agentes que escriben el plan la piden, y approve avisa si falta o esta vacia, con test
- [ ] review avisa si la autorrevision no trae la linea 4D (helper buscado, criterios citados, tests mutados), con test; la skill start lista los patrones de disfraz en tests (nombre que promete sin asercion, datos que no distinguen, rejects sin matcher, skip que esconde un fallo)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-22T23:02:18Z | plan | automatico | persona | 0.16.1 |
