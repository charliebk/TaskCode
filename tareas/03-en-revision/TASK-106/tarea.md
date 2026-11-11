---
id: TASK-106
titulo: "Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-106-verificacion-proporcional-b3-finish-veri
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1097656
tokens_implementacion: 13754830
tokens_revision: null
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: [TASK-105]
---
## Objetivo

Tercera parte de TASK-096. Con la decision selectiva de TASK-105, puertaSoloDocumentacion pasa a puertaProporcional: si la decision es selectiva, finish corre comando_verificacion_selectiva (con RAMA_BASE y timeout_verificacion_selectiva, reutilizando el memo del Stop o de review si casa la huella) en vez de la completa, y lo dice en su salida con el motivo; lo anota en tarea.md en una seccion idempotente. Decisiones de Carlos: la puerta de cobertura queda omitida en el nivel 2 (se mide en la completa del release); release y hotfix siempre a la completa; el verde selectivo nunca escribe el memo de la completa. Se retira el texto aunque las rondas usaran la selectiva cuando aplica la clave. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [ ] En un repo temporal cuya tarea cambia codigo dentro de rutas_verificacion_parcial, finish ejecuta solo la selectiva (contadores: selectiva 1, completa 0), integra y lo dice en su salida; con codigo fuera de esas rutas ejecuta la completa (contadores al reves) y dice por que (un test por caso)
- [ ] Con la selectiva en rojo no integra: develop no se mueve y la tarea sigue en revision (test)
- [ ] El verde de la selectiva no escribe freno-verificacion.json; la puerta de cobertura queda omitida en el nivel 2; release y hotfix ejecutan la completa (un test por caso)
- [ ] Una rama que cambia a la vez codigo y su propio clasificador (fuera de las rutas declaradas) va a la completa (test)
- [ ] Un proyecto que ya declara comando_verificacion_selectiva pero no la clave nueva se comporta como en la 0.14.0: finish corre la completa (los tests TASK-091 siguen igual)
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T18:20:10Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T18:29:20Z | approve | automatico | persona | 0.14.0 |
| 2026-11-11T18:29:22Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T19:12:13Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T18:27:40Z | diseno | agente:a1fb71a103a425a39,a80b09e5e7c94a2da,a4f5fe5bc4fa543a6 | 60 | 151053 | 916335 | 30208 | 43 | 1097656 | - | - |
| 2026-11-11T19:12:13Z | implementacion | sesion:b6475f64-094f-4992-9e7f-78692efbf074 | 132 | 111947 | 13588928 | 53823 | 32 | 13754830 | - | - |

## Autorrevision

- code-quality-reviewer — 89f9e82
