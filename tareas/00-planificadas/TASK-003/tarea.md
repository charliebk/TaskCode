---
id: TASK-003
titulo: "Comando taskctl new (alta individual de tarea)"
tipo: feature
sprint: 0
etiquetas: [cli, ingesta]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-003-taskctl-new
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-002]
---
## Objetivo

`taskctl new --titulo "..." --tipo feature [--sprint N] [--etiquetas a,b]`
crea un fichero `TASK-XXX/tarea.md` en `tareas/00-planificadas/`, calculando
el siguiente ID libre de forma determinista (máximo ID existente + 1,
recorriendo las 5 carpetas de estado).

## Criterios de aceptación

- [ ] ID autogenerado nunca colisiona con uno existente en ninguna de las
      5 carpetas de estado (test con IDs ya usados en varias carpetas).
- [ ] Campos obligatorios ausentes (`--titulo`, `--tipo`) producen error
      claro y código de salida distinto de 0, sin crear ningún fichero.
- [ ] `tipo` fuera de {feature, fix, hotfix, release} rechazado antes de
      escribir nada.
