---
id: TASK-082
titulo: "Autorrevision del implementador antes de pedir revision"
tipo: feature
sprint: 0
etiquetas: [revision, skills, flujo]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-082-autorrevision-del-implementador-antes-de
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

Con la 0.8 ninguna tarea de ToolsaWeb salio en una sola ronda y el 86% de los hallazgos son de implementacion (8 MENORES por tarea media). Antes de taskctl review, el implementador pasa la lista de comprobacion de la skill revisora que toca y corrige lo evidente, sin lanzar un agente nuevo.

## Criterios de aceptacion
- [ ] La skill de la fase review manda pasar la lista de comprobacion de la skill revisora del dominio antes de taskctl review y dejar constancia en tarea.md
- [ ] taskctl review avisa, sin bloquear, si tarea.md no tiene la constancia de la autorrevision, y lo cubren tests con repos Git temporales
- [ ] Las listas de comprobacion de las revisoras viven en un solo sitio que leen tanto la autorrevision como el revisor, sin duplicarlas
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T03:03:48Z | plan | automatico | persona |
