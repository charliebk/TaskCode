---
id: TASK-081
titulo: "Revision mas barata: medir y acotar las lecturas de los revisores"
tipo: feature
sprint: 0
etiquetas: [revision, coste, metricas]
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-081-revision-mas-barata-medir-y-acotar-las-l
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2267557
tokens_implementacion: 13328064
tokens_revision: null
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Con la 0.8 los tokens de revision de una tarea media pasaron de 3.3 M a 6.8 M de mediana en ToolsaWeb mientras los KB por ronda de la peticion bajaban de 100 a 77: el exceso esta en lo que los revisores leen por su cuenta. Medir esas lecturas por revisor y ronda, acotarlas y usar un modelo mas barato en la ronda 2 cuando solo verifica correcciones.

## Criterios de aceptacion
- [ ] taskctl metricas --tokens muestra por tarea las lecturas de cada revisor y ronda, sacadas de la transcripcion del subagente, y lo cubren tests con repos Git temporales
- [ ] `peticion-revision-N[-skill].md` trae `## Contexto permitido` (carpeta de la tarea y ficheros del diff, sin ficheros fuera del diff ni tests reservados), `skills/task-workflow/revision.md` tiene la seccion `Lo que lees` que manda no leer fuera de ella salvo justificandolo, y el informe trae `## Lecturas fuera del contexto permitido`; lo cubren tests de `review` y de las skills
- [ ] taskctl review en ronda 2 sugiere un modelo mas barato cuando la ronda 1 no dejo CRITICOS abiertos, y la sugerencia queda en la peticion
- [ ] docs/METRICAS.md documenta las lecturas por revisor y el objetivo de volver a 3-4 M de tokens de revision en tareas medias
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T01:11:38Z | plan | automatico | persona |
| 2026-11-07T01:25:45Z | approve | automatico | persona |
| 2026-11-07T01:25:58Z | start | automatico | persona |
| 2026-11-07T02:02:20Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T01:21:23Z | diseno | agente:a7026500409ebb476,a993ae855c1ae942f,a3a2a87a94737c00b,a805a8dd4beedf559 | 104 | 233859 | 1985007 | 48587 | 71 | 2267557 |
| 2026-11-07T02:02:01Z | implementacion | agente:a2f5d354f183bfce6,a5eb1fc78af12a8e6 | 254 | 324390 | 12889392 | 114028 | 16 | 13328064 |
