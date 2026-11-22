---
id: TASK-142
titulo: "Regla 4D: disfraz en los scripts de Git-Flow"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-142-regla-4d-disfraz-en-los-scripts-de-git-f
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 4193779
tokens_revision: 1657861
creado: 2026-11-22
actualizado: 2026-11-22
dependencias: []
---
## Objetivo

Corregir los scripts de Git-Flow que aparentan hacer algo que no hacen (auditoria 4D completa, docs/auditoria-4d-completa.md, casos SCR-01, SCR-09, SCR-10, SCR-11 y SCR-14). SCR-01 es CRITICO: resume-work aplica el stash equivocado.

## Criterios de aceptacion
- [x] resume-work.sh aplica el stash de la rama exacta (stash_ref, sin casar prefijos); un test con dos stashes pause: feature/a y pause: feature/ab falla con el codigo actual y pasa con el arreglo
- [x] pause-work.sh --push sin origin no aborta: usa detect_origin_available y _gf_hora como el resto de scripts, con test
- [x] push-back-to-remote.sh y mirror-to-remote.sh no dan por COMPLETADO un push rechazado (exit distinto de 0 o resumen con lo fallido) y su cabecera y avisos dicen lo que de verdad copian
- [x] El README de gitflow y los textos que hablan de 19 scripts reflejan los 24 scripts actuales y los cambios hechos sobre el zip original

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-22T21:43:24Z | plan | automatico | persona | 0.16.1 |
| 2026-11-22T21:45:04Z | approve | automatico | persona | 0.16.1 |
| 2026-11-22T21:45:06Z | start | automatico | persona | 0.16.1 |
| 2026-11-22T21:53:56Z | review | automatico | persona | 0.16.1 |
| 2026-11-22T23:01:08Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 1a8bf25: helper buscado (detect_origin_available, _gf_hora, log_summary reutilizados), criterios citados en cada cambio, 6 tests nuevos en rojo antes del arreglo y 1 mutacion extra (stash pop sin ref) en rojo.
- code-quality-reviewer — 1a8bf25

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-22T21:53:56Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 22 | 21568 | 4157209 | 14980 | 0 | 4193779 | - | - |
| 2026-11-22T22:04:28Z | revision | agente:a1069811c0a5cc298 | 30 | 128429 | 1517468 | 11934 | 2 | 1657861 | 1 | - |

## Verificacion ligera

- 2026-11-22T22:04:31Z: ronda 1; commit revisado 4ef84e1f9f88285a1a9517efdcd949171784463f; commit verificado 6d95405923459cde3114fa82031a2d65cc241631; ficheros: taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh, taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/pause-work.sh, taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh; corregidos: MENOR-1, MENOR-2; pendientes: ninguno

## Resultado

- resume-work.sh busca el stash por asunto exacto `pause: <rama> AAAA-MM-DD` (patron literal) y aplica ese con `stash pop <ref>` (SCR-01, CRITICO). pause-work.sh --push pasa por detect_origin_available: sin origin o caido avisa «push omitido», sale 0 y el resumen lo dice; fechas con _gf_hora (SCR-09). push-back aditivo termina FALLIDO con exit 1 y sin promover a origin si el destino rechaza algo (SCR-10). mirror-to-remote y ensure_remote_empty dicen lo que de verdad hacen: ramas locales y tags, sin sobreescribir (SCR-11). Sin «19 scripts» ni «copia literal»; README con los ajustes por tarea (SCR-14).
- test/gitflow/disfraz-gitflow.test.ts: 6 tests, los 6 en rojo con el codigo anterior; mutacion extra (stash pop sin ref) en rojo. test/gitflow + wrappers: 88/88.
- Revision ronda 1 (code-quality-reviewer): aprobada con correcciones; 6 mutaciones en rojo y sondas con remotos reales. MENOR-1 (aviso de LFS que nombraba --mirror) y MENOR-2 (resumen sin el push omitido, concordancia del DETALLE) corregidos y verificados con verificar-menores.
- Sin probar: el camino de tags rechazados en push-back (el fetch --tags previo aborta antes); su logica es simetrica a la de ramas.
- Cierre con --sin-verificacion, autorizado por Carlos (2026-11-22): la completa (2106 tests) dio 3 rojos, ninguno de esta tarea: los 2 conocidos de plan.test.ts en Windows nativo y el tope de tamano de docs/contexto/CHECKLIST_TERMINACION.md (20727 B > 20480 B), que paso el limite con la entrada de TASK-141 en develop y se archiva justo despues de este cierre.

## Verificacion omitida

- 2026-11-22T23:00:59Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: — (no se entiende: 75 min (de la rama abierta al cierre con merge; senales:)
- Real (de la rama abierta al cierre con merge, sin pausas): 76 min
- Cierre (finish): 9 s, de 2026-11-22T23:00:59Z a 2026-11-22T23:01:08Z
