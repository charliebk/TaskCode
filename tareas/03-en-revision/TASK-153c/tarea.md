---
id: TASK-153c
titulo: "metricas de hallazgos 4D (parte c de TASK-153)"
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
tokens_implementacion: 18305626
tokens_revision: 1841963
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: [TASK-153b]
---
## Objetivo

Parte c del troceo de TASK-153 (Regla 4D en la creacion de codigo y tests), partes TASK-153a, TASK-153b, TASK-153c en la rama feature/task-153-regla-4d-en-la-creacion-de-codigo-y-test.

taskctl metricas cuenta por tarea los hallazgos 4D de sus informes, para ver la tendencia.

## Criterios de aceptacion
- [x] taskctl metricas cuenta por tarea los hallazgos 4D de sus informes (por regla, desde la seccion Regla 4D: un ID suma, cumple no), con test; las tareas sin la seccion salen sin dato, no con cero

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T02:37:05Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T02:37:07Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T02:37:08Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T02:52:39Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 9f0985e: helper buscado (lector de faltasRegla4D extraido a valoresRegla4D, celdas y COLUMNAS_METRICAS); criterios citados; 2 tests nuevos, 3 mutaciones en rojo.
- code-quality-reviewer — 9f0985e

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T02:52:39Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 54 | 27671 | 18262106 | 15795 | 14 | 18305626 | - | - |
| 2026-11-23T03:02:29Z | revision | agente:a5a8df1de0febd54a | 34 | 117528 | 1714835 | 9566 | 2 | 1841963 | 1 | - |

## Verificacion ligera

- 2026-11-23T03:02:31Z: ronda 1; commit revisado 39494465e477f912b87cf8538689891f93eb2723; commit verificado fd6189b3c23d50b64469d8e5965d526639279d2a; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts; corregidos: MENOR-1, MENOR-2, MENOR-3; pendientes: ninguno

## Resultado

- idsRegla4D (core/informe-revision.ts) lee los ID de cada D de la seccion `## Regla 4D`; comparte con faltasRegla4D un unico lector (valoresRegla4D). Un `cumple` que abre la linea no suma aunque cite un ID.
- metricas: FilaMetricas.hallazgos4D cuenta los ID distintos por revisor en todos los informes de la tarea; columna `4d` al final de la tabla (dup/desv/dil/disf), «—» sin seccion. Sobre el repo: TASK-137 0/0/0/2, TASK-141 0/1/0/1, TASK-142 0/0/0/2, TASK-153a 2/1/0/2, TASK-153b 1/0/0/1, TASK-154 0/0/0/0; las anteriores a TASK-137, «—».
- Los tests que fijan la fila completa de metricas cuentan la columna nueva (cambio de expectativa buscado).
- Revision ronda 1: aprobada con correcciones. Corregidos MENOR-1 (cumple con ID citado) y MENOR-2 (formatos raros con test); aceptado MENOR-3 (Set interno redundante pero inocuo). Fuera del alcance: --json y --por-version no llevan la columna (no lo pedia el criterio).

## Verificacion parcial

- 2026-11-23T03:02:41Z: todo el codigo que cambia la tarea (9 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
