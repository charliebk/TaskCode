---
id: TASK-147b
titulo: "criterios, normalizacion, citar e IDs (parte b de TASK-147)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 5785814
tokens_revision: 7948871
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-147a]
---
## Objetivo

Parte b del troceo de TASK-147 (Regla 4D: lectores de secciones e IDs en core), partes TASK-147a, TASK-147b, TASK-147c en la rama fix/task-147-regla-4d-lectores-de-secciones-e-ids-en.

casillasSinMarcar, normalizar, citar y el ID de tarea con un solo lector (CORE2-04, CORE2-05, CORE2-07, CORE2-01, CORE2-14, FS-04, CMD2-08).

## Criterios de aceptacion
- [ ] casillasSinMarcar usa extraerSecciones (Tras el cierre en negrita y ### Criterios) y validacion-tarea usa normalizarTexto; citar() existe una vez
- [ ] El ID de tarea se valida y se ordena con una sola regex y un solo lector de numero con letra (task-store, wip-scan, roadmap, trocear, evolucion, flujo); un test con TASK-121a y TASK-1000 ordena igual en roadmap, evolucion, board y wip

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T09:23:14Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T09:23:24Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T09:23:26Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T09:39:11Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 21e802d: buscados extraerSecciones, normalizarTexto, isValidTaskId, taskIdSortKey y citar antes de escribir; nuevos quitarDiacriticos (normalizarTexto sin minusculas, para celdas) y compararIds (sustituye cinco lectores del numero); 1 fichero de test nuevo (3 tests); 9 mutaciones en rojo
- code-quality-reviewer — 21e802d

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T09:39:11Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 50 | 38463 | 5723849 | 23452 | 10 | 5785814 | - | - |
| 2026-11-23T10:17:50Z | revision | agente:a2ca1003205a4ff1f | 110 | 169187 | 7754364 | 25210 | 10 | 7948871 | 1 | - |

## Verificacion ligera

- 2026-11-23T10:19:18Z: ronda 1; commit revisado bc04b10ebf2db9a8fc0aefa394eab12ee2c2b9c6; commit verificado a8767b7adb7d8f398e7cae0f402029e064d04c20; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/task.ts, taskcode-marketplace/plugins/taskcode-plugin/test/core/ids-y-criterios.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/fs/ids-filtro.test.ts; corregidos: MEN-2, MEN-3, MEN-4; pendientes: ninguno
