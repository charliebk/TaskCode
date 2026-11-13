---
id: TASK-120
titulo: "P-12: sincronizacion con su duracion registrada y limitada a las fases que se declaren"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-120-p-12-sincronizacion-con-su-duracion-regi
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

comando_sincronizacion (en ToolsaWeb, el grafo de tareas) corre en cada transicion, unas 8-10 veces por tarea, y no queda registro de cuanto tarda. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-12)

## Criterios de aceptacion
- [ ] La duracion de cada ejecucion de comando_sincronizacion queda registrada bajo .git/taskcode/ y taskctl metricas la suma por tarea (test)
- [ ] Una clave nueva lista las fases en las que corre la sincronizacion; sin ella corre en todas, como hoy (test)
- [ ] El registro usa un formato de linea comun para todas las puertas de verificacion (puerta, tarea, instante, modo, duracion en segundos, resultado), aqui con puerta sincronizacion, documentado para que lo reutilicen el freno Stop (TASK-111) y review y finish (TASK-128); metricas ignora las lineas de puertas que no conoce y sin registro muestra — (test)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T04:17:20Z | plan | automatico | persona | 0.14.0 |
