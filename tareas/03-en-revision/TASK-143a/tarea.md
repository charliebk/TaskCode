---
id: TASK-143a
titulo: "create, update y merge a main (parte a de TASK-143)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 5711080
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-143 (Regla 4D: duplicacion en Git-Flow (bash y TS)), partes TASK-143a, TASK-143b, TASK-143c en la rama fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y.

invoke_update_work_branch para los cuatro update, create-release y create-hotfix sobre invoke_create_work_branch con fetch, e invoke_merge_to_main con backmerge tras pull --ff-only.

Objetivo de la tarea entera:

> Unificar la logica de Git-Flow copiada entre scripts y entre bash y TypeScript (auditoria 4D completa, docs/auditoria-4d-completa.md, casos SCR-02 a SCR-08, SCR-12, SCR-13 y SCR-15).

## Criterios de aceptacion

- [ ] update-feature/fix/release/hotfix y create-release/create-hotfix usan una funcion comun de _gitflow-common.sh, con el mismo fetch previo; merge-hotfix-to-main y merge-release-to-main comparten el cuerpo
- [ ] El backmerge a develop de los merge a main hace pull --ff-only antes de mergear, como invoke_merge_work_branch_to_develop, con test que lo distingue

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T17:35:54Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T17:37:18Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T17:37:22Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T17:58:47Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — aefe5a7: tres helpers nuevos en _gitflow-common.sh (_gf_fetch_origin, _gf_sync_branch, _gf_locate_branch) que sustituyen el bloque copiado en create, update, merge a develop, merge a main y backmerge; invoke_create_work_branch reutilizada por create-release y create-hotfix; invoke_update_work_branch e invoke_merge_to_main nuevas porque eran cuatro y dos copias en linea; el log de _gf_sync_branch ya no dice «Switched» si no cambia de rama; los tres tests nuevos fallan con los scripts anteriores
- code-quality-reviewer — aefe5a7

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T17:58:47Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 58 | 44930 | 5641305 | 24787 | 8 | 5711080 | - | - |
