---
id: TASK-104
titulo: "Verificacion proporcional A3b: las rondas de review no corren la suite si solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-104-verificacion-proporcional-a3b-las-rondas
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-11
actualizado: 2026-11-11
dependencias: []
---
## Objetivo

Segunda mitad de TASK-102 (troceada por la regla de una hora, decision de Carlos 2026-11-11). taskctl review usa la misma decision comun que el freno Stop (peticionDeTrabajo de TASK-102) sobre base...HEAD, nunca sobre el diff de la ronda: si solo cambia documentacion no corre la verificacion selectiva; con comando_verificacion_selectiva y comando de documentacion declarados corre el de documentacion; sin selectiva no corre nada (decision de Carlos: no aparece una ejecucion donde la 0.14.0 no la tenia). La comprobacion se ejecuta antes de escribir la peticion, con el mismo patron que verificacionSelectivaDeRonda. Plan de partida: tareas/01-en-diseno/TASK-102/planificacion/plan-final.md (paso 5).

## Criterios de aceptacion
- [ ] Una ronda de review de solo documentacion con comando_verificacion_selectiva y comando de documentacion declarados corre el de documentacion y no la selectiva; sin selectiva declarada no corre nada (test por cada uno, repo temporal)
- [ ] Un fichero de codigo en base...HEAD hace que review aplique la verificacion de siempre, tambien en una ronda incremental cuyo delta solo toca documentacion (test)
- [ ] Stop y review dan la misma decision para el mismo diff (test)
- [ ] Sin la configuracion nueva review se comporta exactamente como en la 0.14.0 (test de regresion)
- [ ] verificacion-selectiva.md, README y CHANGELOG explican el comportamiento de Stop y review, como cambio de comportamiento para quien ya declaro rutas_documentacion
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test
