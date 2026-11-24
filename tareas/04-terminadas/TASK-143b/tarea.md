---
id: TASK-143b
titulo: "argumentos, diagnose y push-back (parte b de TASK-143)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 5150761
tokens_revision: 8124739
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: [TASK-143a]
---
## Objetivo

Parte b del troceo de TASK-143 (Regla 4D: duplicacion en Git-Flow (bash y TS)), partes TASK-143a, TASK-143b, TASK-143c en la rama fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y.

parse_gitflow_args y normalize_branch_name en los 13 scripts, diagnose-repo con detect_origin_available y develop configurable, y push-back-to-remote sin referencias ocultas.

## Criterios de aceptacion
- [x] La lectura de argumentos y assert_valid_branch_name vienen de un helper comun en los 13 scripts; diagnose-repo usa detect_origin_available
- [x] push-back-to-remote ensena en la vista previa todo lo que sube y el nombre del backup sale de una sola variable

## Resultado

- _gitflow-common.sh gana parse_gitflow_args (PUSH, MAIN_BRANCH, DEVELOP_BRANCH, TAG_SEEN, TAG_OVERRIDE y NAME) y normalize_branch_name (pregunta, recorte, prefijo y assert_valid_branch_name). Los usan 14 scripts: create, update y merge de feature, fix, release y hotfix, mas create-develop y start-work. Los merge-* pasan a validar el nombre de rama.
- diagnose-repo usa detect_origin_available (con su cache, y antes de resolve_main_branch) y lee --main y --develop; el nombre de develop solo se muestra si no es el de siempre, y el aviso de la deteccion no ensucia el informe.
- push-back-to-remote: el mirror sube y poda solo refs/heads y refs/tags (git push --force --prune con refspecs) en vez de push --mirror, que subia y borraba referencias que la vista previa no ensenaba; textos alineados; el nombre del backup sale de BACKUP_BASE.
- Tests: test/gitflow/argumentos-comunes.test.ts (5): nombre invalido en merge a develop y a main, diagnose con --develop, recorte y --main (tambien al final sin valor), y mirror (rama exclusiva del destino borrada, divergente sobrescrita, sin notes ni refs/remotes). Fallan con los scripts anteriores y con los mutantes de --prune, --force, recorte, shift de --main y aviso de diagnose.
- Revision: ronda 1 cambios-solicitados (IMP-1: --prune y --force sin test; MEN-1 a MEN-3), todo corregido; ronda 2 aprobada.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T20:12:10Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T20:12:50Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T20:12:52Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T20:21:02Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T21:06:57Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T22:01:46Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 1b668da: parse_gitflow_args y normalize_branch_name en _gitflow-common.sh sustituyen la lectura copiada en 14 scripts (12 de rama, create-develop y start-work) y el recorte y prefijo de 12; los scripts con opciones propias (mirror, push-back, switch, pause, resume, recover) no se tocan; diagnose-repo reutiliza detect_origin_available y resolve_main_branch con su cache; push-back sube y poda solo refs/heads y refs/tags, y el nombre del backup sale de una variable; los cuatro tests nuevos fallan con los scripts anteriores
- code-quality-reviewer — 1b668da
- 4D — afecb22: ronda 1; los tests nuevos cubren --prune y --force del mirror, el recorte de espacios y el valor de --main; textos del mirror y linea Develop de diagnose sin promesas ni ruido; sin helpers nuevos
- code-quality-reviewer — afecb22

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T20:21:02Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 36 | 24240 | 5112653 | 13832 | 7 | 5150761 | - | - |
| 2026-11-24T20:53:23Z | revision | agente:abae51c09d98654ac | 90 | 158181 | 5909768 | 25110 | 6 | 6093149 | 1 | - |
| 2026-11-24T21:20:18Z | revision | agente:a3ff93912e19ae3b9 | 36 | 124448 | 1892911 | 14195 | 4 | 2031590 | 2 | - |

## Duracion

- Estimada: 50 min
- Real (de la rama abierta al cierre con merge, sin pausas): 109 min
- Paso de la hora: 109 min reales frente a 50 estimados
- Cierre (finish): 2478 s, de 2026-11-24T21:20:28Z a 2026-11-24T22:01:46Z
