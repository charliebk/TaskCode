---
id: TASK-101
titulo: "Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-101-verificacion-proporcional-a2-el-guardian
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 837575
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: [TASK-100]
---
## Objetivo

Troceada en el plan por la regla de una hora (120 min estimados; decision de Carlos, 2026-11-10): el tratamiento de una config invalida en el arbol (MEN-5, bloquear siempre hacia develop, main o master) pasa a TASK-103. Decisiones de Carlos que aplica esta tarea: los held-out de tareas/**/aceptacion/ cuentan como codigo en el guardian (mas estricto que finish, solo en el merge a mano). El enunciado original sigue debajo.

Segunda parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). Con la decision unica de TASK-100 (decidirVerificacion, rutas_documentacion leidas de la base, memo 'documentacion'), el guardian de merges recalcula el diff con merge-base(destino, fuente), sin depender de la tarea ni del memo de finish: deja pasar un merge de solo documentacion con el verde del memo de documentacion (o sin el si no hay comando de documentacion) y sigue bloqueando uno con codigo sin verde de la completa. Si no puede calcular el diff con el destino ya protegido, bloquea. Un valor invalido de la clave nueva no desactiva el guardian. Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A2).

## Criterios de aceptacion
- [ ] Con rutas_documentacion declaradas, el guardian deja pasar el merge de una tarea de solo documentacion sin verde de la completa y bloquea el de una con codigo (un test por caso, repo temporal)
- [ ] Lanzado el merge a mano sin pasar por finish, el guardian llega a la misma decision que finish para el mismo par fuente-destino (test)
- [ ] Si no puede calcular el diff con el destino protegido, el guardian bloquea igual que hoy; una config del destino invalida lleva a la decision completa (un test por caso). La config invalida del arbol (MEN-5) es TASK-103
- [ ] Sin la configuracion nueva el guardian se comporta exactamente como en la 0.14.0 (test de regresion)
- [ ] De la revision de TASK-100 (ronda 2): el mensaje de error de rutas_documentacion deja de decir «casa con cualquier fichero» para `*` y `*/**` (MEN-6), y verificacion-selectiva.md corrige la frase sobre core.ignorecase: el pathspec distingue mayusculas siempre salvo con :(icase) (MEN-7)
- [ ] verificacion-selectiva.md, README y CHANGELOG explican el comportamiento del guardian
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T21:54:14Z | plan | automatico | persona | 0.14.0 |
| 2026-11-10T22:17:55Z | approve | automatico | persona | 0.14.0 |
| 2026-11-10T22:17:58Z | start | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T22:02:02Z | diseno | agente:a0b810a87912b0a9b,a1a7fbbc155e22f2a,ac832177fd6d296a1 | 50 | 125707 | 677240 | 34578 | 34 | 837575 | - | - |

## Autorrevision

- code-quality-reviewer — 8277541
