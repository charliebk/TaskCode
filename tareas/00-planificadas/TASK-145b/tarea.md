---
id: TASK-145b
titulo: "finish.ts y comentarios (parte b de TASK-145)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: [TASK-145a]
---
## Objetivo

Parte b del troceo de TASK-145 (Regla 4D: duplicacion en las puertas de finish), partes TASK-145a, TASK-145b en la rama fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f.

La base de la rama decidida una vez, comprobarTagDeReintento sin copia, spreads simplificados y comentarios huerfanos u obsoletos fuera.

## Criterios de aceptacion
- [ ] La base de la rama de la tarea se decide una vez en finish, comprobarTagDeReintento esta una sola vez y sin rama inalcanzable, y los spreads repetidos se simplifican
- [ ] Sin comentarios huerfanos ni obsoletos en approve, finish, finish-verificacion y codex-review, y sin el parametro _today sin uso
