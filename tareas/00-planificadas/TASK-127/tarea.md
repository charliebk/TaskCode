---
id: TASK-127
titulo: "Tope de rondas de revision configurable, 2 por defecto, y decision de una persona al llegar"
tipo: feature
sprint: 0
etiquetas: [agilidad, revision, verificacion, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-127-tope-de-rondas-de-revision-configurable
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

Medido en ToolsaWeb (153 tareas terminadas, taskctl metricas, 2026-11-12): las rondas por tarea han pasado de 2,2 a 3,0 y TASK-280 y TASK-282 llegaron a 6; los hallazgos suman unos 1130 MENORES, unos 350 IMPORTANTES y 3 CRITICOS. El tope esta fijo en TOPE_RONDAS = 3 (src/core/flujo.ts) y --ronda-extra lo rebasa sin limite. Se busca un tope configurable, 2 por defecto, y que al llegar a el decida una persona: cerrar con lo que hay, autorizar una ronda mas o devolver la tarea a diseno. Complementa a TASK-099 (los MENORES no abren ronda) y a TASK-112 (rondas 2+ acotadas a los bloqueantes): va despues de TASK-112. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] Una clave tope_rondas en .taskcode/config.yml (entero de 1 a 10, 2 por defecto) sustituye a la constante TOPE_RONDAS en review y en taskctl siguiente (test con repo temporal)
- [ ] Al llegar al tope con hallazgos bloqueantes abiertos, taskctl siguiente devuelve accion preguntar con tres salidas (cerrar, una ronda mas, volver a diseno) en todos los modos, tambien automatico (test)
- [ ] taskctl review --ronda-extra pasado el tope exige que conste la decision de la persona en tarea.md y cada ronda extra vuelve a preguntar (test)
- [ ] Con tope_rondas: 3 el flujo se comporta como hoy (test de regresion)
- [ ] Las skills review y task-workflow, el README y el CHANGELOG explican el tope y su valor por defecto
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
