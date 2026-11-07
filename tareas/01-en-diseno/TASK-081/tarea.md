---
id: TASK-081
titulo: "Revision mas barata: medir y acotar las lecturas de los revisores"
tipo: feature
sprint: 0
etiquetas: [revision, coste, metricas]
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-081-revision-mas-barata-medir-y-acotar-las-l
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

Con la 0.8 los tokens de revision de una tarea media pasaron de 3.3 M a 6.8 M de mediana en ToolsaWeb mientras los KB por ronda de la peticion bajaban de 100 a 77: el exceso esta en lo que los revisores leen por su cuenta. Medir esas lecturas por revisor y ronda, acotarlas y usar un modelo mas barato en la ronda 2 cuando solo verifica correcciones.

## Criterios de aceptacion
- [ ] taskctl metricas --tokens muestra por tarea las lecturas de cada revisor y ronda, sacadas de la transcripcion del subagente, y lo cubren tests con repos Git temporales
- [ ] La peticion de revision declara una lista de ficheros de contexto permitidos y la skill revisora comun manda no leer fuera de ella salvo justificandolo en el informe
- [ ] taskctl review en ronda 2 sugiere un modelo mas barato cuando la ronda 1 no dejo CRITICOS abiertos, y la sugerencia queda en la peticion
- [ ] docs/METRICAS.md documenta las lecturas por revisor y el objetivo de volver a 3-4 M de tokens de revision en tareas medias
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T01:11:38Z | plan | automatico | persona |
