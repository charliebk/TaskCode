---
id: TASK-151b
titulo: "commands, hooks y cli (parte b de TASK-151)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-151-regla-4d-disfraz-en-tests
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 13334640
tokens_revision: 5420980
creado: 2026-11-23
actualizado: 2026-11-24
dependencias: [TASK-151a]
---
## Objetivo

Parte b del troceo de TASK-151 (Regla 4D: disfraz en tests), partes TASK-151a, TASK-151b en la rama fix/task-151-regla-4d-disfraz-en-tests.

doctor-deploy, review-incremental, salida-temprana, cli/estado, doctor-correcciones, approve, plan, start y guardia-documentacion fallan con su mutante (M6 a M10, TCMD-01 a TCMD-05, TRES-07).

## Criterios de aceptacion
- [x] Las mutaciones M6, M7, M8, M9 y M10 ponen su test en rojo (doctor-deploy DIRS_EXCLUIDOS, review-incremental, salida-temprana, cli/estado); review-incremental corre en Linux; doctor-correcciones no convierte un timeout ausente en skip
- [x] Los tests que prometen sin efectos secundarios o workspace limpio lo comprueban con git status, los que prometen error claro miran el mensaje, y guardia-documentacion comprueba cuenta-sel

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T23:49:31Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T23:50:19Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T23:50:25Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T00:17:02Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — d5d4029: reutilizados porcelain (roadmap-fixtures) y git (finish-fixtures) en approve, plan y start; idPedido en el TransitionContext existente en vez de un parametro nuevo; mutaciones en rojo: M6 (y quitar solo build), M7 sin unlink, M8 sin el error propio, M9 integra = true, M10 sin rechazarFlagsDesconocidos, TCMD-01 sin timeout en git status, TRES-07 guardian que lanza la selectiva, «(desconocida)» en vez del ID; el endurecimiento de TCMD-03 destapo que el mensaje de tarea inexistente no nombraba el ID y se corrige aqui
- code-quality-reviewer — d5d4029

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T00:17:02Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 146 | 75931 | 13221491 | 37072 | 52 | 13334640 | - | - |
| 2026-11-24T00:36:50Z | revision | agente:adac97c3f4d5e96fa | 90 | 139670 | 5265734 | 15486 | 9 | 5420980 | 1 | - |

## Verificacion ligera

- 2026-11-24T00:37:29Z: ronda 1; commit revisado e6a09c1411fe4da225c614227893187ec3bb2ef4; commit verificado b21c9096cb791d7f716f377350461486d3ffe134; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts; corregidos: ninguno; pendientes: ninguno

## Resultado

- Cada caso de la parte b caza su mutante: M6 (doctor-deploy, marcadores versionados en cada carpeta excluida), M7 y M8 (review-incremental; el EEXIST se provoca con un mock de writeFile, así que corre en Linux, y el rejects mira el ReviewCommandError), M9 (salida-temprana con NODE_DEBUG=esm y control positivo), M10 (cli/estado: un flag desconocido sale con 1 y lo dice), TCMD-01 (doctor-correcciones: el skip lo decide una sonda de Git aparte, no la duración del doctor), TCMD-03 y TCMD-05 (approve, plan y start miran el mensaje, git status y HEAD) y TRES-07 (guardia-documentacion cuenta cualquier cuenta-*).
- El endurecimiento de TCMD-03 destapó un fallo real: el error de una tarea inexistente decía «(desconocida)» en vez del ID. Se corrige con `idPedido` en el TransitionContext.
- Revisión ronda 1: aprobada con correcciones. MEN-1 corregido (assert trivial). MEN-2..5 aceptados con su motivo en el informe.

## Verificacion parcial

- 2026-11-24T00:37:52Z: todo el codigo que cambia la tarea (27 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
