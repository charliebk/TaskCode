---
id: TASK-121
titulo: "Troceo de tareas de mas de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama"
tipo: feature
sprint: 0
etiquetas: [flujo, agilidad, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-121-troceo-de-tareas-de-mas-de-60-min-como-p
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
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Por que importa (Carlos, 2026-11-12): trocear ha dado problemas en otros proyectos y ha complicado el repo. Evidencia en los repos: en TaskCode, TASK-096 se partio en 10 tareas con rama, diseno, revision y cierre propios (TASK-100 a TASK-109; unas 25 h y unos 230 M tokens); en ToolsaWeb hay 83 tareas que citan una particion, con tandas de numeros dispersos como TASK-307 a TASK-320 aun planificadas; en OpenDockTrading, 16. El plan debe partir de esos casos reales (ramas, carpetas, ROADMAP e IDs que quedaron) y no solo del enunciado.

Hoy la regla de una hora para el flujo cuando el plan estima mas de 60 min, y trocear crea tareas nuevas con su propia rama, diseno y cierre. Decision de Carlos (2026-11-12): trocear es condicional y solo una persona puede aceptarlo; si lo acepta, las partes se numeran con el mismo numero seguido de letras (TASK-NNNa, TASK-NNNb...), se trabajan sin salir de la rama de la tarea, se crean primero en 00-planificadas y se actualiza el ROADMAP antes de empezar TASK-NNNa, que es la tarea iniciada como principal. Como y cuando se integra en develop (al cerrar cada parte o al cerrar la ultima) lo decide el plan con la persona. Urgente para la version 0.16.0: lo mas rapido posible; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] Con un plan de mas de 60 min, taskctl siguiente devuelve accion preguntar con dos salidas, trocear o aprobar entera, y en ningun modo (tampoco automatico) se trocea sin la respuesta de una persona (test con repo temporal)
- [ ] Si la persona acepta, la tarea pasa a TASK-NNNa y se crean TASK-NNNb, TASK-NNNc... en 00-planificadas con el objetivo y los criterios de cada parte del plan, y tareas/ROADMAP.md se regenera antes de empezar TASK-NNNa (test)
- [ ] Las partes comparten la rama de la tarea: start de TASK-NNNa la abre y las partes siguientes trabajan en ella sin crear otra (test)
- [ ] Los IDs con letra funcionan en todo el CLI (new, plan, approve, start, review, finish, siguiente, board, metricas, roadmap) y no chocan con la numeracion siguiente (test)
- [ ] Si la persona rechaza el troceo, la tarea sigue entera con el motivo escrito en el plan, como hoy (test de regresion)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T17:48:41Z | plan | automatico | persona | 0.14.0 |
