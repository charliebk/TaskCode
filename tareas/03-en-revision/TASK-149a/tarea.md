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
tokens_revision: 2578853
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

- [ ] Un solo envoltorio de git sin lanzar (gitTexto), una sola rama actual, un solo --git-path y un solo parser de la entrada de los hooks; registro-coste y guardia-merge no cargan el modulo del freno

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T10:38:51Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T10:39:05Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T10:39:06Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T10:48:23Z | review | automatico | persona | 0.16.1 |

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
