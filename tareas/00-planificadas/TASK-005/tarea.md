---
id: TASK-005
titulo: "Comando taskctl board (listado por estado)"
tipo: feature
sprint: 0
etiquetas: [cli, visualizacion]
complejidad: trivial
modelo_sugerido: haiku
estado: planificada
plan_aprobado: false
rama: feature/task-005-taskctl-board
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

`taskctl board [--sprint N] [--asignado_a persona]` recorre las 5 carpetas
de estado y muestra una tabla en texto plano (ID, título, estado, asignado)
en la terminal, sin dependencias de librerías de tablas.

## Criterios de aceptación

- [ ] Salida agrupada por carpeta de estado, en el orden del ciclo de vida.
- [ ] Filtros `--sprint` y `--asignado_a` funcionan combinados.
- [ ] Carpeta de estado vacía se omite de la salida (no imprime cabecera
      vacía).
