---
id: TASK-085
titulo: "Coste de implementacion registrado automaticamente"
tipo: feature
sprint: 0
etiquetas: [metricas, coste, hooks]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-085-coste-de-implementacion-registrado-autom
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 1444672
tokens_implementacion: 14336319
tokens_revision: 1838682
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

En ToolsaWeb falta el coste de implementacion en 97 de 119 tareas, asi que el coste total esta infravalorado. Registrarlo sin depender de que alguien ejecute registrar-coste.

## Criterios de aceptacion
- [ ] Un hook registra los tokens de implementacion de la tarea en curso de la rama actual al terminar cada turno o subagente, sin duplicar lo ya registrado
- [ ] Sin tarea en curso en la rama el hook sale sin hacer nada y sin lanzar procesos pesados
- [ ] taskctl metricas deja de listar como sin coste de implementacion las tareas registradas asi; lo cubren tests con repos Git temporales
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-07T11:58:23Z | plan | automatico | persona |
| 2026-11-07T12:34:16Z | approve | automatico | persona |
| 2026-11-07T12:34:25Z | start | automatico | persona |
| 2026-11-07T13:03:17Z | review | automatico | persona | 0.12.0 |
| 2026-11-07T13:36:18Z | review | automatico | persona | 0.12.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T12:05:43Z | diseno | agente:a65224b999240bfbb,aa5ddc57d52c649a3,a199d2b1441f10c5d | 62 | 161568 | 1252929 | 30113 | 44 | 1444672 |
| 2026-11-07T13:03:17Z | implementacion | sesion:aa9a2319-7c42-41b4-86ee-0101f7ccd03a | 126 | 154281 | 14114110 | 67802 | 26 | 14336319 | - | - |
| 2026-11-07T13:16:30Z | revision | agente:a960f1bdda2957fdf | 32 | 126378 | 1701668 | 10604 | 2 | 1838682 | 1 | - |
