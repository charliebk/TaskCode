---
id: TASK-101
titulo: "Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-101-verificacion-proporcional-a2-el-guardian
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

Segunda parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). Con la decision unica de TASK-100 (decidirVerificacion, rutas_documentacion leidas de la base, memo 'documentacion'), el guardian de merges recalcula el diff con merge-base(destino, fuente), sin depender de la tarea ni del memo de finish: deja pasar un merge de solo documentacion con el verde del memo de documentacion (o sin el si no hay comando de documentacion) y sigue bloqueando uno con codigo sin verde de la completa. Si no puede calcular el diff con el destino ya protegido, bloquea. Un valor invalido de la clave nueva no desactiva el guardian. Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A2).

## Criterios de aceptacion
- [ ] Con rutas_documentacion declaradas, el guardian deja pasar el merge de una tarea de solo documentacion sin verde de la completa y bloquea el de una con codigo (un test por caso, repo temporal)
- [ ] Lanzado el merge a mano sin pasar por finish, el guardian llega a la misma decision que finish para el mismo par fuente-destino (test)
- [ ] Si no puede calcular el diff con el destino protegido, o la clave nueva tiene un valor invalido, el guardian bloquea igual que hoy (un test por caso)
- [ ] Sin la configuracion nueva el guardian se comporta exactamente como en la 0.14.0 (test de regresion)
- [ ] verificacion-selectiva.md, README y CHANGELOG explican el comportamiento del guardian
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test
