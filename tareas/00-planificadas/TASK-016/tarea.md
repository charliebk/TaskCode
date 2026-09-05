---
id: TASK-016
titulo: "Brainstorm paralelo por roles con agente unificador"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: planificada
plan_aprobado: false
rama: feature/task-016-brainstorm-paralelo-por-roles-con-agente
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-010]
---
## Objetivo


## Criterios de aceptacion
- [ ] Lanza N agentes en paralelo, uno por rol (arquitectura, riesgos, testing, dominio), con el contexto acotado por rol de la sección 16.2 en vez de pasarles el repo entero.
- [ ] Un agente unificador consolida las salidas en un único `plan-final.md`, señalando los desacuerdos entre roles en vez de promediarlos.
- [ ] Sustituye al `plan` mínimo de TASK-010 sin romper su interfaz de línea de comandos ni la máquina de estados.
- [ ] El número de agentes y la obligatoriedad del checkpoint humano salen de los puntos 1 y 2 de la sección 14.
- [ ] Tests que no dependen de llamadas reales a agentes para el camino determinista (validación de estado, escritura de ficheros, límite de roles).
