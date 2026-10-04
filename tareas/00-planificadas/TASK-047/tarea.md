---
id: TASK-047
titulo: "F5-T3 Flags desconocidos y mensajes de review"
tipo: fix
sprint: 6
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-047-f5-t3-flags-desconocidos-y-mensajes-de-r
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo


## Criterios de aceptacion
- [ ] Un flag desconocido aborta con la lista de flags validos y una sugerencia
- [ ] La salida de `review` nombra agente y skill por separado y usa `modelo_sugerido`
- [ ] `codex-review.ts` reutiliza los helpers de `finish.ts` en lugar de duplicarlos
