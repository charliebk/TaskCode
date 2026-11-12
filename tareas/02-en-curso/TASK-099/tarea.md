---
id: TASK-099
titulo: "Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa"
tipo: feature
sprint: 0
etiquetas: [revision, agilidad, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-099-correccion-de-menores-tras-aprobar-con-c
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

P-2 de la auditoria del 2026-11-12. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): la medicion que se esperaba ya esta hecha (criterio 1), asi que se empieza ya; lo mas rapido posible y el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Lo que sigue es el enunciado original.

En modo automatico, cuando el revisor propone aprobada-con-correcciones y solo quedan MENORES, la sesion los pide como cambios-solicitados y se abre otra ronda entera para uno o dos MENORES (OpenDockTrading TASK-067 con la 0.14.0: ronda 3 por un unico MEN-4, unos 5 min y 0,37 M tokens). Se busca que los MENORES baratos se corrijan con una verificacion ligera sin ronda nueva, manteniendo que el codigo integrado es el revisado. NO se empieza hasta tener medidas al menos 10 tareas cerradas de punta a punta con la 0.14.0 en ToolsaWeb y OpenDockTrading (taskctl metricas --por-version) que confirmen que las rondas por MENORES pesan; si no pesan, se descarta. Objetivo: version 0.15.0.

## Criterios de aceptacion
- [x] plan-final.md recoge la medicion ya hecha en docs/auditoria/PASOS-PLUGIN-2026-11-12.md (71 rondas abiertas solo por MENORES en ToolsaWeb, OpenDockTrading y TaskCode, con 2 CRITICO/IMPORTANTE nuevos y 70,2 M tokens) como motivo para seguir
- [x] Con solo MENORES abiertos tras aprobada-con-correcciones, corregirlos no abre una ronda completa ni acotada nueva: queda una verificacion ligera registrada en tarea.md (test en repo temporal)
- [x] finish sigue sin integrar codigo posterior al revisado sin esa verificacion o la decision de una persona (test)
- [x] Un CRITICO o IMPORTANTE abierto sigue exigiendo cambios-solicitados y otra ronda (test)
- [x] Solo bloquean los CRITICO e IMPORTANTE: los MENORES que no se corrigen en esa verificacion ligera pasan a un backlog de la tarea (revision/menores-pendientes.md, con id, fichero y motivo) y ni abren ronda ni impiden finish (test en repo temporal)
- [x] taskctl siguiente, con solo MENORES abiertos tras aprobada-con-correcciones, no devuelve otra ronda en ningun modo, tampoco automatico, sino la verificacion ligera o finish (test)
- [x] Las skills review y task-workflow, el README y el CHANGELOG lo explican
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test (modo rapido, como dice el objetivo)

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T20:20:20Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T21:03:22Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T21:03:24Z | start | automatico | persona | 0.14.0 |
