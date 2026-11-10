---
id: TASK-102
titulo: "Verificacion proporcional A3: el freno Stop y las rondas de review no corren la suite si solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-102-verificacion-proporcional-a3-el-freno-st
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: [TASK-100]
---
## Objetivo

Tercera parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). El freno Stop (cada fin de turno) y taskctl review usan la decision unica de TASK-100 sobre el mismo diff: si solo cambia documentacion no corren la suite de tests, solo la comprobacion de documentacion si se declara. Clasifican tambien el arbol de trabajo (lo no commiteado y lo no trackeado): un .ts sin commitear hace que el turno no sea de solo documentacion. Solo documentacion se decide antes que la verificacion selectiva de TASK-091 y de forma identica en Stop y review. Sin la clave, ni se calcula el diff (cero coste en cada turno). Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A3).

## Criterios de aceptacion
- [ ] Un turno o una ronda de solo documentacion no corren la suite de tests; con comando de documentacion declarado, corre ese (test por cada uno, repo temporal)
- [ ] Un fichero de codigo sin commitear o sin seguimiento hace que Stop y review apliquen la verificacion de siempre (test por cada uno)
- [ ] Con comando_verificacion_selectiva tambien declarado, solo documentacion se decide antes y Stop y review dan la misma decision para el mismo diff (test)
- [ ] Sin la configuracion nueva Stop y review se comportan exactamente como en la 0.14.0 y no lanzan ningun proceso git nuevo (test de regresion)
- [ ] verificacion-selectiva.md, README y CHANGELOG explican el comportamiento de Stop y review
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test
