---
id: TASK-143a
titulo: "create, update y merge a main (parte a de TASK-143)"
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
tokens_implementacion: 5711080
tokens_revision: 5656079
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

- [x] update-feature/fix/release/hotfix y create-release/create-hotfix usan una funcion comun de _gitflow-common.sh, con el mismo fetch previo; merge-hotfix-to-main y merge-release-to-main comparten el cuerpo
- [x] El backmerge a develop de los merge a main hace pull --ff-only antes de mergear, como invoke_merge_work_branch_to_develop, con test que lo distingue

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T17:35:54Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T17:37:18Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T17:37:22Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T17:58:47Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T20:11:40Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — aefe5a7: tres helpers nuevos en _gitflow-common.sh (_gf_fetch_origin, _gf_sync_branch, _gf_locate_branch) que sustituyen el bloque copiado en create, update, merge a develop, merge a main y backmerge; invoke_create_work_branch reutilizada por create-release y create-hotfix; invoke_update_work_branch e invoke_merge_to_main nuevas porque eran cuatro y dos copias en linea; el log de _gf_sync_branch ya no dice «Switched» si no cambia de rama; los tres tests nuevos fallan con los scripts anteriores
- code-quality-reviewer — aefe5a7

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T17:58:47Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 58 | 44930 | 5641305 | 24787 | 8 | 5711080 | - | - |
| 2026-11-24T18:27:11Z | revision | agente:af429e5ea85a59ee4 | 78 | 167083 | 5466153 | 22765 | 19 | 5656079 | 1 | - |

## Verificacion ligera

- 2026-11-24T18:41:33Z: ronda 1; commit revisado 84d3207ea756aee0bbd0c5ab15b3ab4943f1bf4c; commit verificado 26a49352af6abb2f7d4aa9185994ea17a05212b8; ficheros: taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh, taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/flujo-comun.test.ts; corregidos: H-1, H-2, H-3; pendientes: ninguno

## Resultado

- _gitflow-common.sh gana _gf_fetch_origin (fetch una vez por invocacion), _gf_sync_branch (checkout o creacion desde origin y pull --ff-only) y _gf_locate_branch, que sustituyen el bloque copiado en create, update, merge a develop, merge a main y backmerge.
- create-release y create-hotfix usan invoke_create_work_branch; los cuatro update, invoke_update_work_branch; merge-hotfix-to-main y merge-release-to-main, invoke_merge_to_main (eran identicos salvo ocho lineas). Todos hacen el fetch previo.
- El backmerge pone develop al dia con pull --ff-only; y si develop local y origin/develop han divergido, el merge a main aborta antes de tocar nada (MEN H-1).
- Tests nuevos en test/gitflow/flujo-comun.test.ts (10): fetch de una rama subida tras el clon (update y create), backmerge con develop atrasada para release y hotfix (mensajes y etiqueta del tag), develop divergida, update(<tipo>) por tipo, y create-release desde la punta de origin. Todos fallan con los scripts anteriores o con su mutante.
- Revision ronda 1 (code-quality-reviewer): aprobada con correcciones, tres MENORES (H-1 a H-3), corregidos y registrados con verificar-menores.
- Verificacion: verificar-impacto en verde; gitflow + start + rama-base + guardia-merge 137/138, el rojo fue el test de mirror con timeout de ls-remote (origin-deteccion), intermitente bajo carga: pasa aislado y no toca estos scripts.
- Cambio de texto aceptado: los logs de create-release y create-hotfix pasan a los de invoke_create_work_branch; ningun test los compara.
- Cierre con --sin-verificacion, autorizado por Carlos el 2026-11-24: la suite completa de finish (unos 38 min) salio dos veces en rojo, cada vez con un test distinto de tiempos bajo carga. La primera, doctor-deploy.test.js:452: git rev-list cortado por ETIMEDOUT de spawnSync en vez del limite propio; pasa aislado 28/28. La segunda, origin-deteccion «con origin inalcanzable responde en segundos»: 12,2 s frente a un margen de 12 s; aislado tarda unos 4,4 s con estos scripts y unos 4,1 s con los de develop, y con origin caido las funciones nuevas no hacen consultas de red.

## Verificacion omitida

- 2026-11-24T20:11:24Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 60 min
- Real (de la rama abierta al cierre con merge, sin pausas): 154 min
- Paso de la hora: 154 min reales frente a 60 estimados
- Cierre (finish): 16 s, de 2026-11-24T20:11:24Z a 2026-11-24T20:11:40Z
