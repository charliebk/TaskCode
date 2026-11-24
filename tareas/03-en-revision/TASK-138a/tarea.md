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
tokens_revision: 3158032
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

- [x] metricas --por-version y el aviso de crecimiento de doctor usan el mismo agregador de suite por version, con un test de una tarea que corre la completa dos veces que da la misma cifra en las dos vistas
- [x] Una sola funcion mediana (versiones-metricas, crecimiento-suite, metricas y tramoDe de evolucion) y la regex de pytest se evalua una vez en contarTests

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
| 2026-11-24T16:36:39Z | revision | agente:a3fbb0c1f2809e963 | 60 | 123464 | 3022617 | 11891 | 9 | 3158032 | 1 | - |

## Verificacion ligera

- 2026-11-24T16:36:44Z: ronda 1; commit revisado 2a0a6e53d9cb82919feff40a73f8580066810adf; commit verificado 1d451d20dd9724625b6ad5a68805ae3e52d104d9; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts; corregidos: MEN-2; pendientes: MEN-1

## Resultado

- A1: `ultimaSuitePorTarea` y `resumirSuites` en core/crecimiento-suite, que usan `metricas --por-version`, versiones-metricas y el aviso de crecimiento de doctor. Una tarea con la completa repetida cuenta una vez, con la última. Cambia la cifra de doctor, que antes mezclaba todas las líneas, en dos sentidos:
  - la duración pasa a ser la mediana de la última completa de cada tarea;
  - si la última completa de una tarea quedó con `-` (salida recortada), la tarea queda sin cifra de tests, aunque una completa anterior sí la contara. Así lo hacía ya métricas (MEN-1).
- A2 y CORE2-11: core/estadistica.ts tiene la única `mediana`; metricas la reexporta.
- A3: la línea final de pytest se busca una sola vez en `contarTests`. El revisor comprobó 3072 combinaciones sin ninguna diferencia.
- Revisión, ronda 1: aprobada con correcciones. MEN-2 se corrigió (aserción tautológica fuera). MEN-1 se acepta y queda documentado aquí.
