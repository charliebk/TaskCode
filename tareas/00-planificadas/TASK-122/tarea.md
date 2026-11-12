---
id: TASK-122
titulo: "Coste por tarea independiente del tamano del proyecto"
tipo: feature
sprint: 0
etiquetas: [agilidad, escala, urgente, v0.16]
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-122-coste-por-tarea-independiente-del-tamano
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Problema que plantea Carlos (2026-11-12): si cada tarea paga algo que crece con el tamano del proyecto, el coste de las tareas crece sin limite; con n tareas, la tarea n cuesta del orden de n y el proyecto del orden de n al cuadrado, hasta que una tarea pequena cuesta tanto como el proyecto. En TaskCode la suite paso de 893 a 2289 tests en cinco semanas (de ~11 a ~25 min) y una tarea de una linea paga los 25; en ToolsaWeb cada finish paga 28 min de verificacion completa. Regla buscada: cada paso de una tarea cuesta en proporcion a lo que cambia la tarea, nunca al tamano del proyecto; lo que dependa del tamano del proyecto se paga una vez por version. Hay que descubrir exactamente que pasos poner o quitar para que el crecimiento del proyecto no afecte a la agilidad, sin perder la calidad que dan los tests (los de repos reales cazaron los CRITICOS de TASK-100 a TASK-108). Primera de la cola urgente para la 0.16.0, antes de TASK-121; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Datos de partida: docs/auditoria/AUDITORIA-METODO-2026-11-12.md y PASOS-PLUGIN-2026-11-12.md.

## Criterios de aceptacion
- [ ] Un informe en docs/auditoria mide cada paso de una tarea (diseno, implementacion, verificacion, cada ronda de revision, cierre y contexto que leen los agentes) frente al tamano del proyecto (tests, ficheros, tareas cerradas) con datos de TaskCode, ToolsaWeb y OpenDockTrading, y marca cuales crecen con el proyecto (tabla con la tendencia de cada paso)
- [ ] Cada paso que crece con el proyecto queda con su arreglo decidido con Carlos en el plan: pasa a depender solo de lo que cambia la tarea, se mueve a una vez por version, o se justifica por escrito
- [ ] La verificacion de una tarea corre solo los tests de lo que cambia y la suite completa se corre una vez por version antes de publicar: en TaskCode, una tarea que toca un solo modulo verifica en menos de 2 min con mas de 2000 tests en la suite (medido)
- [ ] Un listado reproducible da por fichero de test su duracion y cuantos procesos git lanza, y los 10 mas lentos quedan clasificados en necesita Git real o se puede probar sin Git; la regla de la piramide (logica sin Git, Git real solo en la capa de integracion) queda en docs/contexto/CONVENCIONES.md
- [ ] taskctl metricas muestra el coste fijo por tarea (verificacion, revision y cierre) frente al numero de tareas cerradas del proyecto, para ver si crece (test con repo temporal)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
