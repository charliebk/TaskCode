---
id: TASK-117
titulo: "P-9: new propone la complejidad a partir de tareas parecidas ya cerradas"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-117-p-9-new-propone-la-complejidad-a-partir
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

La complejidad declarada no predice el coste (en ToolsaWeb alta gasta menos tokens que media) y OpenDockTrading no la declara nunca, pero decide cuantos roles de diseno se lanzan. Que new proponga la de las tareas cerradas mas parecidas. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-9)

## Criterios de aceptacion
- [ ] taskctl new sin --complejidad propone la mediana de las tareas terminadas con mas etiquetas en comun, la escribe y dice de que tareas sale (test con repo temporal)
- [ ] Con --complejidad explicita gana la declarada y sin tareas parecidas se queda como hoy (test)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T03:32:33Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T03:33:05Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T03:33:06Z | start | automatico | persona | 0.14.0 |
