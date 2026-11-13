---
id: TASK-115
titulo: "P-7: verificacion completa por lote de cierres en modo automatico"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-115-p-7-verificacion-completa-por-lote-de-ci
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
dependencias: []
---
## Objetivo

En ToolsaWeb cada finish corre la verificacion completa (28 min de mediana) aunque se cierren varias tareas seguidas en automatico. Una completa por lote, con vuelta atras si sale en rojo, cuesta 28 min por lote en vez de por tarea. Relaja cada integracion en verde: la forma concreta la decide Carlos en el plan. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-7)

## Criterios de aceptacion
- [ ] Con la clave verificacion_por_lote activada, finish de una tarea con codigo integra sin la completa y anota la verificacion como pendiente de lote (test en repo temporal)
- [ ] Un comando de taskctl corre una completa sobre la rama de integracion y la anota en todas las tareas pendientes de ese lote (test)
- [ ] Si la completa del lote sale en rojo, el comando dice que tareas entraron desde la ultima completa en verde (test)
- [ ] Sin la clave, finish y el guardian de merges se comportan como hoy (test de regresion)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T13:54:02Z | plan | automatico | persona | 0.14.0 |
