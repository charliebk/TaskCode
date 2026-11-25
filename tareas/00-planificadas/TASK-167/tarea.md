---
id: TASK-167
titulo: "Regla 4D preventiva en los proyectos que usan el plugin (0.19.0)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-167-regla-4d-preventiva-en-los-proyectos-que
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-25
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Que los proyectos que instalan el plugin no cometan los fallos 4D que las auditorias encontraron en TaskCode: lo aprendido en las dos auditorias pasa a guia y a comprobaciones automaticas que el plugin instala y ejecuta al escribir codigo, no solo al revisarlo. Decision de Carlos (2026-11-25): va antes que las correcciones pendientes y se publica en la 0.19.0; TASK-150c (aparcada en diseno), 150d, 159..166, 152 y 140 pasan a la 0.20.0.

## Criterios de aceptacion
- [ ] Hay una guia instalable de duplicacion de grano fino (helpers copiados, lectores de secciones repetidos, envoltorios de git o fs duplicados, catalogos escritos dos veces) sacada de las auditorias 4D, y start, review y las revisoras remiten a ella
- [ ] Al escribir codigo, taskctl detecta en el diff funciones casi identicas a otras ya existentes del proyecto y lo avisa antes de pedir revision, no solo como candidato para el revisor
- [ ] Hay una auditoria 4D invocable para el proyecto que produce hallazgos clasificados por D y un plan de correccion por olas
- [ ] taskctl metricas muestra la tendencia de hallazgos 4D por proyecto entre auditorias y por tarea
- [ ] Un test por pieza falla si deja de instalarse o de comprobar lo suyo
