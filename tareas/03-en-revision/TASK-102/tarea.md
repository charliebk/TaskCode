---
id: TASK-102
titulo: "Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-102-verificacion-proporcional-a3-el-freno-st
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 973799
tokens_implementacion: 10714434
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-11
dependencias: [TASK-100]
---
## Objetivo

Troceada en el plan por la regla de una hora (85 min estimados; decision de Carlos, 2026-11-11): esta tarea hace A3a (clasificacion del arbol de trabajo, la decision comun peticionDeTrabajo y el freno Stop); review, el test de que Stop y review deciden igual y la documentacion son TASK-104. Sin A3b, review sigue como en la 0.14.0. El enunciado original sigue debajo.

Tercera parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). El freno Stop (cada fin de turno) y taskctl review usan la decision unica de TASK-100 sobre el mismo diff: si solo cambia documentacion no corren la suite de tests, solo la comprobacion de documentacion si se declara. Clasifican tambien el arbol de trabajo (lo no commiteado y lo no trackeado): un .ts sin commitear hace que el turno no sea de solo documentacion. Solo documentacion se decide antes que la verificacion selectiva de TASK-091 y de forma identica en Stop y review. Sin la clave, ni se calcula el diff (cero coste en cada turno). Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A3).

## Criterios de aceptacion
- [ ] Un turno de solo documentacion no corre la suite de tests; con comando de documentacion declarado, el freno Stop corre ese (test por cada uno, repo temporal)
- [ ] Un fichero de codigo sin commitear o sin seguimiento hace que el freno Stop aplique la verificacion de siempre (test por cada uno)
- [ ] Con comando_verificacion_selectiva tambien declarado, el freno Stop decide solo documentacion antes que la selectiva (test)
- [ ] Sin la configuracion nueva el freno Stop se comporta exactamente como en la 0.14.0 y no lanza ningun proceso git nuevo (test de regresion)
- [ ] Con el arbol de trabajo sucio, el freno Stop corre la comprobacion de documentacion pero no escribe su memo (test)
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-11T00:08:16Z | plan | automatico | persona | 0.14.0 |
| 2026-11-11T00:21:25Z | approve | automatico | persona | 0.14.0 |
| 2026-11-11T00:21:37Z | start | automatico | persona | 0.14.0 |
| 2026-11-11T01:00:51Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-11T00:17:19Z | diseno | agente:a6510894427772cf0,ae4845017e3f37876,ad5af49c426af7f1e | 56 | 137410 | 808016 | 28317 | 44 | 973799 | - | - |
| 2026-11-11T01:00:51Z | implementacion | sesion:54b72414-a421-4c5c-a0d6-578a9eae7f01 | 102 | 87211 | 10592902 | 34219 | 14 | 10714434 | - | - |

## Autorrevision

- code-quality-reviewer — abee9b6
