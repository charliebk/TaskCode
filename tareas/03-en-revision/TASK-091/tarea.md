---
id: TASK-091
titulo: "Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar"
tipo: feature
sprint: 0
etiquetas: [verificacion, review, finish]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-091-verificacion-selectiva-por-impacto-en-la
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1580230
tokens_implementacion: 13329517
tokens_revision: 11766567
creado: 2026-11-09
actualizado: 2026-11-09
dependencias: []
---
## Objetivo

Urgente (pedido por Carlos el 2026-11-09, desde ToolsaWeb). La verificacion completa de un proyecto crece con cada tarea (en ToolsaWeb, `scripts\verificar.bat` ya tarda unos 40 minutos) y hoy se repite en cada ronda de revision aunque la tarea no haya tocado la capa de datos ni el frontend. TaskCode tiene que separar dos verificaciones: una **selectiva por impacto**, rapida, para la implementacion y las rondas de revision, y la **completa**, obligatoria antes de integrar, para que ninguna rama pase a otra sin comprobarlo todo. Todas las aplicaciones que usan el plugin la adoptan y sustituyen su verificador por este encaje.

Encaje propuesto (sobre TASK-070 y TASK-088):
- `comando_verificacion` sigue siendo la completa y la puerta de `finish` y del guardian de merges.
- Nueva clave opcional `comando_verificacion_selectiva`, que recibe la rama base (`develop`) para que el proyecto decida que corre segun lo cambiado. La usan el hook `Stop` y las rondas de `review`. El mapa de capas es de cada proyecto; TaskCode solo orquesta.
- Sin la clave nueva, todo se comporta como hoy.

## Criterios de aceptacion
- [ ] Nueva clave opcional `comando_verificacion_selectiva` en `resolverConfig` (con su timeout), con fallo cerrado ante valor invalido y defecto null; sin ella, el comportamiento de todos los comandos es identico al actual y los tests existentes pasan sin tocarlos
- [ ] Con la clave, el hook `Stop` y `taskctl review` ejecutan la selectiva (pasandole la rama base) y la peticion de revision dice que verificacion se corrio, con su salida y si fue selectiva o completa
- [ ] `taskctl finish` exige la completa (`comando_verificacion`) en verde sobre el commit que va a integrar, aunque las rondas usaran la selectiva; si falla o no se ha corrido, no integra y dice como correrla
- [ ] `taskctl doctor` avisa cuando un proyecto tiene `comando_verificacion` pero no `comando_verificacion_selectiva`, con el arreglo en la misma linea
- [ ] Tests contra repos Git temporales reales (sin mocks): selectiva en review, completa obligatoria en finish, sin clave igual que antes
- [ ] Guia de migracion para los proyectos que usan el plugin (como escribir el clasificador por impacto, que cambios fuerzan la completa y como declarar las dos claves), y tabla de claves de config, README, CHANGELOG y ROADMAP al dia

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-09T14:57:33Z | plan | automatico | persona | 0.12.0 |
| 2026-11-09T15:08:11Z | approve | automatico | persona | 0.12.0 |
| 2026-11-09T15:08:12Z | start | automatico | persona | 0.12.0 |
| 2026-11-09T15:44:25Z | review | automatico | persona | 0.12.0 |
| 2026-11-09T16:21:47Z | review | automatico | persona | 0.12.0 |
| 2026-11-09T16:56:40Z | review | automatico | persona | 0.12.0 |
| 2026-11-09T18:00:52Z | review | automatico | persona | 0.12.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-09T15:07:47Z | diseno | agente:a2f6ff30c44527281,a74b4eeb30e197fb6,ae0270642a1c2d5e9 | 76 | 158146 | 1389127 | 32881 | 49 | 1580230 | - | - |
| 2026-11-09T15:44:25Z | implementacion | sesion:1828033b-de70-4233-a119-a808c10ec4fe | 118 | 124552 | 13153609 | 51238 | 35 | 13329517 | - | - |
| 2026-11-09T16:00:59Z | revision | agente:a2912c053ac824e02 | 70 | 148540 | 4565908 | 14390 | 12 | 4728908 | 1 | - |
| 2026-11-09T16:30:54Z | revision | agente:a20ccb724a1b66019 | 40 | 134515 | 2051577 | 21822 | 13 | 2207954 | 2 | - |
| 2026-11-09T17:34:29Z | revision | agente:a4b6f5bf2bf5a0965 | 50 | 293603 | 2691302 | 33752 | 0 | 3018707 | 3 | - |
| 2026-11-09T18:08:43Z | revision | agente:aa50af6fe04f139cb | 32 | 130379 | 1659404 | 21183 | 5 | 1810998 | 4 | - |

## Autorrevision

- code-quality-reviewer — cc5adfa
- code-quality-reviewer — f0affb1
- code-quality-reviewer — 0546cb9
- code-quality-reviewer — 792803c
