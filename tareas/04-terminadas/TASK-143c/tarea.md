---
id: TASK-143c
titulo: "paridad bash y TS, ls-remote y perfil-tests (parte c de TASK-143)"
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
tokens_implementacion: 10060379
tokens_revision: 10967497
creado: 2026-11-24
actualizado: 2026-11-25
dependencias: [TASK-143b]
---
## Objetivo

Parte c del troceo de TASK-143 (Regla 4D: duplicacion en Git-Flow (bash y TS)), partes TASK-143a, TASK-143b, TASK-143c en la rama fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y.

detect_operation_in_progress comun con test de paridad frente a git.ts, ls-remote de git.ts con entorno y limite, finish con --main, y perfil-tests con la compilacion protegida.

## Criterios de aceptacion
- [x] La deteccion de operacion en curso (abort-merge, diagnose-repo, git.ts) tiene test de paridad, y los ls-remote de git.ts llevan GIT_TERMINAL_PROMPT=0 y limite de tiempo; finish pasa --main al script
- [x] perfil-tests.mjs reutiliza la compilacion protegida de verificar-impacto (copia de dist/src y cerrojo) o lo documenta

## Resultado

- detect_operation_in_progress en _gitflow-common.sh (cuatro booleanos y la operacion por la que manda, en el orden de git.ts) sustituye las copias de abort-merge y diagnose-repo; test de paridad bash/TS en doce estados, incluida la prioridad entre cada par.
- git.ts: lsRemoto sobre gitCrudo (GIT_TERMINAL_PROMPT=0) con el limite GF_TIMEOUT_REMOTO de _gf_ls_remote (timeoutRemotoMs); lo usan isRemoteAvailable, tagRemoto, ramaRemotaContiene y resolveMainBranch, que ahora hace una sola consulta y cae a las ramas locales si origin no responde (como resolve_main_branch); remoteBranchExists desaparece.
- finish pasa --main al script de hotfix y release con la principal ya resuelta (argumentosScriptMerge, funcion pura, y test que observa los argumentos reales del script).
- conDistProtegido (verificar-impacto.mjs) agrupa la copia de dist/src y el cerrojo de TASK-136; la usan verificar-impacto y perfil-tests al compilar. Devuelve dist/src y suelta el cerrojo tambien si fn lanza, rechaza o es un thenable.
- Revision: ronda 1 cambios-solicitados (HAL-1 IMPORTANTE: --main de finish sin test; HAL-2 a HAL-5 MENORES), todo corregido; ronda 2 aprobada. Nota de la ronda 2 sin abrir: el test de resolveMainBranch con limite de 2,8 s depende del tiempo.
- Durante la implementacion, flags-paridad detecto que `argsScript.includes('--tag')` parecia la lectura de un booleano: tagLoPusoElScript se calcula con la condicion explicita.
- Cierre con --sin-verificacion, autorizado por Carlos el 2026-11-24: la suite completa de finish dio un solo rojo, freno-stop.test.js («decisiones de parar, bloquear...»), cuyo comando de prueba se corto por su limite de 2 s bajo la carga de la suite; aislado pasa 3/3, y el freno no usa nada de lo que cambia esta tarea.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T22:03:08Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T22:03:40Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T22:03:43Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T22:27:19Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T23:21:31Z | review | automatico | persona | 0.16.1 |
| 2026-11-25T00:41:27Z | finish | automatico | persona | 0.16.1 |

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
| 2026-11-24T23:40:04Z | revision | agente:a1acb3af8513d216f | 36 | 128155 | 1932172 | 15824 | 3 | 2076187 | 2 | - |

## Verificacion omitida

- 2026-11-25T00:41:13Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 55 min
- Real (de la rama abierta al cierre con merge, sin pausas): 158 min
- Paso de la hora: 158 min reales frente a 55 estimados
- Cierre (finish): 14 s, de 2026-11-25T00:41:13Z a 2026-11-25T00:41:27Z
