---
id: TASK-084
titulo: "Version del plugin en cada tarea y metricas por version"
tipo: feature
sprint: 0
etiquetas: [metricas, transiciones]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-084-version-del-plugin-en-cada-tarea-y-metri
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Para comparar versiones del plugin hubo que deducir la version por la fecha de cierre, y casi lleva a error. Anotar la version del plugin en cada transicion y agregar las metricas por version.

## Criterios de aceptacion
- [ ] Cada linea nueva de ## Transiciones lleva la version de taskctl que la escribio; las lineas antiguas sin version se siguen leyendo
- [ ] taskctl metricas --por-version agrupa las tareas terminadas por la version de su cierre con rondas, aprobadas a la primera, hallazgos por severidad y origen y tokens por fase, y acepta --json
- [ ] Tests con repos Git temporales cubren tareas con y sin version anotada
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T00:17:31Z | plan | automatico | persona |
