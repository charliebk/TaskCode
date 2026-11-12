---
id: TASK-114
titulo: "P-6: hooks PreToolUse que salen pronto cuando no tienen nada que hacer"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-114-p-6-hooks-pretooluse-que-salen-pronto-cu
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

Los hooks PreToolUse del plugin arrancan node y su logica en cada llamada a una herramienta: el de lectura en cada Read/Edit/Grep/Glob aunque ningun proyecto declare held-out, y el de merges en cada comando de shell. Que salgan sin trabajo cuando no aplica. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-6)

## Criterios de aceptacion
- [ ] El hook de lectura sale con 0 sin leer tareas/ ni la config de held-out cuando el proyecto no declara comando_heldout (test)
- [ ] El hook de merges sale con 0 sin lanzar git cuando el comando no contiene git ni un script de cierre (test con PATH sin git)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
