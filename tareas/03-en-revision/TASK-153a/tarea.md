---
id: TASK-153a
titulo: "plan con reutilizacion y autorrevision 4D exigida (parte a de TASK-153)"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 21596277
tokens_revision: 2804513
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
| 2026-11-22T23:03:02Z | approve | automatico | persona | 0.16.1 |
| 2026-11-22T23:03:03Z | start | automatico | persona | 0.16.1 |
| 2026-11-22T23:31:53Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 7b1114d: helper buscado (rangoDeSeccion, patron de aviso de duracion en approve, constante unica de la vineta en lugar de dos copias); criterios citados; 4 tests nuevos, 3 mutaciones en rojo (faltaReutilizacion, vineta de la peticion, tieneLinea4D).
- code-quality-reviewer — 7b1114d

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-22T23:31:53Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 90 | 56028 | 21510799 | 29360 | 28 | 21596277 | - | - |
| 2026-11-22T23:48:47Z | revision | agente:a66303f84849cb3c4 | 50 | 91375 | 2700256 | 12832 | 5 | 2804513 | 1 | - |

## Verificacion ligera

- 2026-11-22T23:48:51Z: ronda 1; commit revisado 4e6ff7fb803c1140a5dbd26eda008730c4c63bdb; commit verificado b1d4c27ce0b71b0fc716538df81815d01b6f30c4; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-autorrevision.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/validacion-tarea.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/skills/regla-4d.test.ts; corregidos: MENOR-1, MENOR-2, MENOR-3, MENOR-5, MENOR-6; pendientes: MENOR-4
