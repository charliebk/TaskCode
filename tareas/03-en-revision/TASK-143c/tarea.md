---
id: TASK-143c
titulo: "paridad bash y TS, ls-remote y perfil-tests (parte c de TASK-143)"
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
tokens_implementacion: 10060379
tokens_revision: 8891310
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: [TASK-143b]
---
## Objetivo

Parte c del troceo de TASK-143 (Regla 4D: duplicacion en Git-Flow (bash y TS)), partes TASK-143a, TASK-143b, TASK-143c en la rama fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y.

detect_operation_in_progress comun con test de paridad frente a git.ts, ls-remote de git.ts con entorno y limite, finish con --main, y perfil-tests con la compilacion protegida.

## Criterios de aceptacion
- [ ] La deteccion de operacion en curso (abort-merge, diagnose-repo, git.ts) tiene test de paridad, y los ls-remote de git.ts llevan GIT_TERMINAL_PROMPT=0 y limite de tiempo; finish pasa --main al script
- [ ] perfil-tests.mjs reutiliza la compilacion protegida de verificar-impacto (copia de dist/src y cerrojo) o lo documenta

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T22:03:08Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T22:03:40Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T22:03:43Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T22:27:19Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T23:21:31Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 6b91fad: detect_operation_in_progress en _gitflow-common.sh sustituye las dos copias bash (abort-merge y diagnose-repo), con test de paridad frente a operacionEnCurso de git.ts en nueve estados; lsRemoto en git.ts reutiliza gitCrudo (GIT_TERMINAL_PROMPT=0) y el limite GF_TIMEOUT_REMOTO de _gf_ls_remote en vez de cuatro spawnSync; argumentosScriptMerge, funcion pura, pasa --main; conDistProtegido extrae de verificar-impacto la copia y el cerrojo de TASK-136 y la usa perfil-tests; mutantes en rojo: ls-remote sin limite, finish sin --main, bash sin sequencer y perfil-tests sin proteccion
- code-quality-reviewer — 6b91fad
- 4D — e8650f7: ronda 1; resolveMainBranch reutiliza lsRemoto con una consulta y quita remoteBranchExists (una funcion menos); Promise.resolve en conDistProtegido; tests nuevos que matan los seis mutantes supervivientes
- code-quality-reviewer — e8650f7

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T22:27:19Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 54 | 39462 | 9995264 | 25599 | 10 | 10060379 | - | - |
| 2026-11-24T23:21:20Z | revision | agente:ab042205cf55d8c0f | 130 | 168114 | 8693825 | 29241 | 7 | 8891310 | 1 | - |
