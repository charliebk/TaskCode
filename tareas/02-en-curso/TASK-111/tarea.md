---
id: TASK-111
titulo: "P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-111-p-3-registrar-cada-ejecucion-del-freno-s
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: [TASK-120]
---
## Objetivo

El freno Stop corre la verificacion al final de cada turno con tarea en curso (selectiva de 4,2 min en ToolsaWeb) y no queda registro de cuantas veces corre ni de su coste. Que cada ejecucion quede registrada, que metricas la sume y que no corra si el arbol no cambio desde el ultimo verde. Toca freno-stop.ts como TASK-110: va despues de ella. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-3)

## Criterios de aceptacion
- [ ] Cada ejecucion del freno Stop anade una linea con instante, modo, duracion y resultado a un registro bajo .git/taskcode/ (test con repo temporal)
- [ ] taskctl metricas muestra por tarea cuantas veces corrio el freno y su tiempo total, con — sin dato (test)
- [ ] Si la huella del arbol no cambio desde el ultimo verde, el freno no ejecuta la verificacion y no anade salida (test)
- [ ] La linea del freno usa el formato comun de registro de TASK-120 con puerta freno, y el resultado distingue verde, rojo, omitido (sin cambios desde el ultimo verde) y excedido, este ultimo reservado para el presupuesto de TASK-125 (test)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T11:32:04Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T11:33:31Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T11:33:48Z | start | automatico | persona | 0.14.0 |
