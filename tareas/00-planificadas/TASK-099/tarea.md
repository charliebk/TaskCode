---
id: TASK-099
titulo: "Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa"
tipo: feature
sprint: 0
etiquetas: [revision, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-099-correccion-de-menores-tras-aprobar-con-c
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

En modo automatico, cuando el revisor propone aprobada-con-correcciones y solo quedan MENORES, la sesion los pide como cambios-solicitados y se abre otra ronda entera para uno o dos MENORES (OpenDockTrading TASK-067 con la 0.14.0: ronda 3 por un unico MEN-4, unos 5 min y 0,37 M tokens). Se busca que los MENORES baratos se corrijan con una verificacion ligera sin ronda nueva, manteniendo que el codigo integrado es el revisado. NO se empieza hasta tener medidas al menos 10 tareas cerradas de punta a punta con la 0.14.0 en ToolsaWeb y OpenDockTrading (taskctl metricas --por-version) que confirmen que las rondas por MENORES pesan; si no pesan, se descarta. Objetivo: version 0.15.0.

## Criterios de aceptacion
- [ ] Antes de planificar, plan-final.md recoge la medicion de al menos 10 tareas con la 0.14.0 (rondas abiertas solo por MENORES, su tiempo y tokens) y la decision de la persona de seguir o descartar
- [ ] Con solo MENORES abiertos tras aprobada-con-correcciones, corregirlos no abre una ronda completa ni acotada nueva: queda una verificacion ligera registrada en tarea.md (test en repo temporal)
- [ ] finish sigue sin integrar codigo posterior al revisado sin esa verificacion o la decision de una persona (test)
- [ ] Un CRITICO o IMPORTANTE abierto sigue exigiendo cambios-solicitados y otra ronda (test)
- [ ] Las skills review y task-workflow, el README y el CHANGELOG lo explican
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test
