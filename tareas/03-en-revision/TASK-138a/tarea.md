---
id: TASK-138a
titulo: "agregador de la suite, mediana y pytest (parte a de TASK-138)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-138-regla-4d-duplicacion-en-metricas-suite-y
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 10500803
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-138 (Regla 4D: duplicacion en metricas, suite y registro de puertas), partes TASK-138a, TASK-138b en la rama fix/task-138-regla-4d-duplicacion-en-metricas-suite-y.

Un solo agregador de la suite por version para metricas y doctor, una sola mediana (versiones-metricas, crecimiento-suite, metricas, evolucion) y la regex de pytest evaluada una vez.

Objetivo de la tarea entera:

> Corregir las duplicaciones que encontro la auditoria 4D de TASK-137 (docs/auditoria-4d.md, casos A1-A6): un solo agregador de la suite por version, una sola mediana, una sola decision verde/rojo/omitido por puerta, sin regex ni constantes duplicadas o muertas.

## Criterios de aceptacion

- [ ] metricas --por-version y el aviso de crecimiento de doctor usan el mismo agregador de suite por version, con un test de una tarea que corre la completa dos veces que da la misma cifra en las dos vistas
- [ ] Una sola funcion mediana (versiones-metricas, crecimiento-suite, metricas y tramoDe de evolucion) y la regex de pytest se evalua una vez en contarTests

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T16:18:49Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T16:19:17Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T16:19:19Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T16:24:48Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — c62c44e: la regla de metricas (ultima completa por tarea) se lleva a crecimiento-suite y la usan las dos vistas; core/estadistica.ts nuevo y sin dependencias para la unica mediana (metricas la reexporta para no tocar a sus consumidores; evolucion la importa directa); resumirSuites sustituye las dos IIFE de versiones-metricas; pytest con una sola regex; mutacion en rojo: suitePorVersion promediando las completas de una tarea
- code-quality-reviewer — c62c44e

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T16:24:48Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 28 | 22314 | 10466774 | 11687 | 9 | 10500803 | - | - |
