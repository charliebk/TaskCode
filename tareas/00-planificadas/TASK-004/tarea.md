---
id: TASK-004
titulo: "Comando taskctl import (alta masiva desde Markdown)"
tipo: feature
sprint: 0
etiquetas: [cli, ingesta]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-004-taskctl-import
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-002, TASK-003]
---
## Objetivo

`taskctl import docs/sprint-N-propuesta.md` parsea una lista de tareas en
Markdown (formato: encabezado `### Título` seguido de una lista de
criterios) de forma determinista con un parser propio (sin LLM). Si una
entrada no encaja en el formato esperado, se reporta como error de esa
entrada concreta (no aborta el resto del import) y se deja constancia del
punto de extensión para una futura reparación por LLM (§16.2 de la
metodología) — sin implementarlo todavía en Sprint 0.

## Criterios de aceptación

- [ ] Un Markdown con 5 tareas bien formadas produce 5 ficheros `tarea.md`
      válidos, con IDs consecutivos sin colisión.
- [ ] Una entrada malformada dentro de un import de varias tareas no impide
      que las demás se creen; se reporta por stderr con el motivo exacto.
- [ ] `taskctl import` es idempotente respecto a título: reimportar el mismo
      fichero no duplica tareas ya creadas con el mismo título normalizado
      (se avisa y se salta, no se sobreescribe).
