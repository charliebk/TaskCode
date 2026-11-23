---
id: TASK-149c
titulo: "utilidades de fs (parte c de TASK-149)"
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
tokens_implementacion: 13699288
tokens_revision: null
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-149b]
---
## Objetivo

Parte c del troceo de TASK-149 (Regla 4D: duplicacion en fs, hooks y cli), partes TASK-149a, TASK-149b, TASK-149c en la rama fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli.

Lockfiles, binarios, cola, PATH, JSON con BOM y nombreBase con una implementacion (FS-10 a FS-14, FS-16).

## Criterios de aceptacion
- [ ] Lockfiles, deteccion de binarios, lectura de cola, busqueda en PATH, JSON con BOM y nombreBase tienen una sola implementacion; los mensajes de evidencia nombran DIRS_EXCLUIDOS

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T12:31:38Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T12:31:40Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T12:31:41Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T12:44:03Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 30bfd1d: buscadas las copias de lockfiles, binario, cola, PATH, BOM y nombreBase; de cada una se queda la mas completa; nuevos candidatosEnPath (la busqueda que devuelve todos, para la status line), textoDirsExcluidos, quitarBom, esArchivoDeBloqueo y el modulo leer-cola.ts (sin dependencias para la via rapida de estado); 1 fichero de test nuevo (4 tests) y la lista de la via rapida actualizada; 5 mutaciones en rojo
- code-quality-reviewer — 30bfd1d

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T12:44:03Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 58 | 36697 | 13639931 | 22602 | 14 | 13699288 | - | - |
