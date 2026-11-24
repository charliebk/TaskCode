---
id: TASK-143b
titulo: "argumentos, diagnose y push-back (parte b de TASK-143)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
asignado_a: claude
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
dependencias: [TASK-143a]
---
## Objetivo

Parte b del troceo de TASK-143 (Regla 4D: duplicacion en Git-Flow (bash y TS)), partes TASK-143a, TASK-143b, TASK-143c en la rama fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y.

parse_gitflow_args y normalize_branch_name en los 13 scripts, diagnose-repo con detect_origin_available y develop configurable, y push-back-to-remote sin referencias ocultas.

## Criterios de aceptacion
- [ ] La lectura de argumentos y assert_valid_branch_name vienen de un helper comun en los 13 scripts; diagnose-repo usa detect_origin_available
- [ ] push-back-to-remote ensena en la vista previa todo lo que sube y el nombre del backup sale de una sola variable

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T20:12:10Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T20:12:50Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T20:12:52Z | start | automatico | persona | 0.16.1 |
