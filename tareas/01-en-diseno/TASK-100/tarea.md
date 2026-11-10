---
id: TASK-100
titulo: "Verificacion proporcional A: una tarea que solo cambia documentacion no corre la suite de tests"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-100-verificacion-proporcional-a-una-tarea-qu
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 735317
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Primera parte de TASK-096 (decision de Carlos, 2026-11-10: trocearla y empezar por la de mas valor y menos riesgo). Hoy finish, el freno Stop, las rondas de revision y el guardian de merges pagan la verificacion completa aunque la tarea solo cambie documentacion (ToolsaWeb: unos 28 min por finish, tambien en tareas de solo .md; la mayoria de las tareas recientes de ToolsaWeb y OpenDockTrading son documentos o estudios). Un proyecto declara que rutas son documentacion; si el diff de la tarea frente a la base solo toca esas rutas, no se corre la suite de tests, solo la comprobacion de documentacion si el proyecto la declara, y la salida dice que verificacion corrio y por que. Fail-closed: un diff mixto, una ruta no clasificada o un error al calcular el diff van a la verificacion de siempre. Opt-in: sin la configuracion nueva todo se comporta exactamente como en la 0.14.0. No se retira ningun freno. La verificacion de solo lo afectado en codigo parcial queda para TASK-096.

## Criterios de aceptacion
- [ ] Con la configuracion nueva, en un repo temporal cuya tarea solo cambia rutas de documentacion, taskctl finish integra sin ejecutar comando_verificacion y su salida dice que verificacion corrio y por que; si el proyecto declara una comprobacion de documentacion, se ejecuta y su fallo bloquea igual que hoy (test de integracion por caso)
- [ ] Un diff mixto (documentacion y codigo), con una ruta no clasificada o sin poder calcular el diff ejecuta la verificacion de siempre (un test por caso)
- [ ] El freno Stop y taskctl review aplican la misma decision al mismo diff: un turno o una ronda de solo documentacion no corren la suite de tests (test por cada uno)
- [ ] El guardian de merges aplica la misma decision que finish: no bloquea el merge de una tarea de solo documentacion sin verde de la completa y si bloquea el de una con codigo (un test por caso)
- [ ] Un proyecto sin la configuracion nueva se comporta exactamente como en la 0.14.0 (tests de regresion de finish, Stop, review y guardian)
- [ ] skills/task-workflow (verificacion-selectiva.md), README y CHANGELOG explican el principio y como declara un proyecto sus rutas de documentacion
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T19:57:48Z | plan | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T20:03:45Z | diseno | agente:a4ddfe25c518261e6,a118359c7e0d14283,ae7f7a5f26750c1c5 | 50 | 117216 | 591360 | 26691 | 31 | 735317 | - | - |
