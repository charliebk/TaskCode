---
id: TASK-080
titulo: "Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan"
tipo: feature
sprint: 0
etiquetas: [skills, revisores, brainstorm, accesibilidad, rendimiento]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-080-accesibilidad-en-angular-vue-reviewer-y
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: [angular-vue-reviewer]
regla_seleccion_skill: solape
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 3070861
tokens_implementacion: null
tokens_revision: 9942791
creado: 2026-11-06
actualizado: 2026-11-06
dependencias: []
---
## Objetivo

Tres refuerzos pedidos por la persona. Primero, la accesibilidad WCAG 2.2 dentro de angular-vue-reviewer y no como revisor aparte: un revisor propio sobre .vue solaparia patrones y clasificarPorDominio mandaria esos ficheros al generico. Segundo, criterios de arquitectura mas exigentes en el rol brainstorm-arquitectura de la fase plan. Tercero, un rol nuevo, brainstorm-rendimiento, para las tareas con WASM, Web Workers, 3D o carga pesada.

## Criterios de aceptacion
- [ ] skills/angular-vue-reviewer/SKILL.md revisa contraste, orden y visibilidad del foco, trampas de teclado, etiquetas y aria en controles, nombre accesible de iconos y botones y dialogos modales, citando WCAG 2.2; test/skills/revisores.test.ts sigue en verde y sus patrones_archivo no cambian
- [ ] agents/brainstorm-arquitectura.md incluye limites entre modulos, direccion de las dependencias, acoplamiento y coherencia con los ADR del proyecto, y test/agents/brainstorm-roles.test.ts lo comprueba
- [ ] Existe agents/brainstorm-rendimiento.md con el mismo formato que los demas roles brainstorm-*: coste algoritmico, asignaciones en bucles calientes, copias JS-WASM, Web Workers, mallas y teselas grandes, y medir con datos reales antes de optimizar
- [ ] taskctl plan lanza brainstorm-rendimiento cuando la tarea tiene etiquetas de rendimiento, wasm, workers o 3d, y no lo lanza sin ellas; lo cubren tests en test/commands/plan-brainstorm.test.ts
- [ ] brainstorm-unificador integra la salida de rendimiento; README del plugin, documentacion de roles y CHANGELOG lo recogen, y catalogo-skills.yml queda con total_skills cuadrado si cambia
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows) en la rama de la tarea

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-06T20:50:55Z | plan | automatico | persona |
| 2026-11-06T21:31:57Z | approve | automatico | persona |
| 2026-11-06T21:32:17Z | start | automatico | persona |
| 2026-11-06T22:05:59Z | review | automatico | persona |
| 2026-11-06T22:59:55Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-06T21:13:18Z | diseno | agente:ae91fdc05286e3c5d,a2d673ab9621e7d07,a6241d7727e43c650,ad36fb944f6fa6717 | 112 | 275361 | 2751344 | 44044 | 83 | 3070861 |
| 2026-11-06T22:38:43Z | revision | agente:a997ec01fea174e67 | 100 | 185300 | 7630902 | 29360 | 4 | 7845662 |
| 2026-11-06T23:15:53Z | revision | agente:a504d99e341f74e57 | 40 | 112236 | 1976671 | 8182 | 2 | 2097129 |
