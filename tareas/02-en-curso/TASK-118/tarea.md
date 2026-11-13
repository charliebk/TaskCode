---
id: TASK-118
titulo: "P-10: linea FIN con la duracion en todos los scripts de Git-Flow"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-118-p-10-linea-fin-con-la-duracion-en-todos
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

Los logs de Git-Flow no cierran siempre con una linea reconocible (los de create no se pueden medir), asi que la duracion de start, review y finish no se puede sacar de ellos. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-10)

## Criterios de aceptacion
- [ ] Todos los scripts de scripts/gitflow terminan su registro con una linea FIN con la operacion, el resultado y la duracion en segundos, tambien cuando abortan (test por script)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T02:49:42Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T02:50:17Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T02:50:18Z | start | automatico | persona | 0.14.0 |
