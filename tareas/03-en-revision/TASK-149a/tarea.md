---
id: TASK-149a
titulo: "git y hooks (parte a de TASK-149)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 7620004
tokens_revision: 4986621
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-149 (Regla 4D: duplicacion en fs, hooks y cli), partes TASK-149a, TASK-149b, TASK-149c en la rama fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli.

gitTexto unico, una rama actual, un --git-path, el parser de la entrada de los hooks y hooks sin el grafo del freno (FS-05, FS-06, FS-07, FS-08, FS-17).

Objetivo de la tarea entera:

> Unificar los helpers de E/S, Git y CLI copiados en fs, hooks y cli (auditoria 4D completa, docs/auditoria-4d-completa.md, casos FS-02, FS-03 y FS-05 a FS-18).

## Criterios de aceptacion

- [x] Un solo envoltorio de git sin lanzar (gitTexto), una sola rama actual, un solo --git-path y un solo parser de la entrada de los hooks; registro-coste y guardia-merge no cargan el modulo del freno

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T10:38:51Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T10:39:05Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T10:39:06Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T10:48:23Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T11:11:41Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 1140c91: buscados gitTexto/gitCrudo, la ramaActual de guardia-heldout (con rebase), operacionEnCurso y parsearEntradaPreToolUse antes de escribir; nuevos gitLinea, gitResultado, gitOk, rutaGit y parsearEntradaHook en los modulos sin dependencias (cinco envoltorios, seis --git-path y tres parsers sustituidos); 1 fichero de test nuevo (4 tests); 5 mutaciones en rojo
- code-quality-reviewer — 1140c91
- 4D — edeabfe: correccion de la ronda 1; nuevo rutaGitObligatoria (rutaGit para quien lanza fuera de un repo); 2 tests ampliados (rebase-apply, freno con rebase); 2 mutaciones en rojo; el mutante del cierre de merge lo caza finish-reintento
- code-quality-reviewer — edeabfe

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T10:48:23Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 44 | 42057 | 7554248 | 23655 | 14 | 7620004 | - | - |
| 2026-11-23T11:02:18Z | revision | agente:a4bf2866d0f8fbbeb | 44 | 134996 | 2428622 | 15191 | 0 | 2578853 | 1 | - |
| 2026-11-23T11:21:30Z | revision | agente:a8c91d1040022f885 | 34 | 162779 | 2215900 | 29055 | 13 | 2407768 | 2 | - |

## Verificacion ligera

- 2026-11-23T11:21:32Z: ronda 2; commit revisado 7e2d3ad9a07e93978e33a2f53c40368000748ec4; commit verificado 51ecb79fb68bd94d20609d47fde1e85d71670674; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/fs/ejecucion-acotada.ts; corregidos: MEN-5; pendientes: ninguno

## Resultado

- Implementado: `fs/git-crudo.ts` es el unico envoltorio de git sin lanzar de fs y hooks (gitTexto, gitLinea, gitResultado, gitOk, rutaGit para `--git-path` y ramaActual, que durante un rebase devuelve la rama que se rebasa). Sustituye los envoltorios de verificacion, guardia-merge, guardia-heldout, sincronizacion, config-de-ref y ejecucion-acotada, y los `--git-path` de coste-pendiente, freno-ultimo-verde, registro-puertas y verificacion; `rutaGitObligatoria` (fs/git.ts) es la variante que lanza, para operacionEnCurso y cadena. Los hooks parsean su entrada con `parsearEntradaHook`. `timeoutEfectivoS` pasa a core/config.ts y `carpetaEnCurso` a fs/task-store.ts: registro-coste, coste-turno, guardia-merge y pre-tool-merge ya no cargan el freno (test del grafo de imports). pendientes usa operacionEnCurso.
- Cambio de comportamiento: el freno Stop, con un rebase a medias de la rama de la tarea, ahora verifica (antes dejaba parar con HEAD desacoplado), como el guardian de held-out. Con conflictos bloquea una vez; la segunda parada pasa por stop_hook_active. El revisor lo juzgo correcto.
- Revision: 2 rondas. Ronda 1: IMP-1 (sin test de rebase-apply) e IMP-2 (el cambio del freno sin test), y MEN-1..4 (restos de `--git-path` y de git sin lanzar, alias enganosos, comentarios), corregidos. Ronda 2: aprobada; MEN-5 (fotoDelArbol heredaba un timeout de 60 s) corregido en la verificacion ligera.
- No corregido: nada.

## Verificacion parcial

- 2026-11-23T11:21:44Z: todo el codigo que cambia la tarea (39 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
