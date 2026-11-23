---
id: TASK-147a
titulo: "secciones con un solo lector y un solo «crear al final» (parte a de TASK-147)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 21581176
tokens_revision: 1091797
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-147 (Regla 4D: lectores de secciones e IDs en core), partes TASK-147a, TASK-147b, TASK-147c en la rama fix/task-147-regla-4d-lectores-de-secciones-e-ids-en.

Duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen con rangoDeSeccion y crean la seccion con un helper comun (CORE1-01, CORE1-02, CORE2-02, CORE2-06).

Objetivo de la tarea entera:

> Que cada seccion de tarea.md y cada ID se lean con un solo lector (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CORE1-01, CORE1-02, CORE2-01, CORE2-02, CORE2-04 a CORE2-07, CORE2-12 a CORE2-14, FS-04 y CMD2-08).

## Criterios de aceptacion

- [ ] duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen y escriben secciones con rangoDeSeccion y un helper comun para crear la seccion al final; un test con el encabezado dentro de un bloque de codigo lo distingue

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T06:28:28Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T06:28:53Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T06:28:54Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T06:53:34Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 3aeb6c2: buscados anadirSeccionAlFinal, contenidoDeSeccion, rangoDeSeccion y dentroDeBloque antes de escribir; un helper nuevo (anadirSeccionAlFinal) que sustituye cinco copias; 1 fichero de test nuevo (5 tests); 4 mutaciones en rojo (menores, troceo, duracion, rondas-extra)
- code-quality-reviewer — 3aeb6c2
- 4D — 85c111f: correccion de la ronda 1 sin helper nuevo (parametro en rangoPorCabecera); 3 tests nuevos en secciones-comunes; 3 mutaciones en rojo
- code-quality-reviewer — 85c111f

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T06:53:34Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 54 | 119932 | 21436173 | 25017 | 6 | 21581176 | - | - |
| 2026-11-23T07:02:14Z | revision | agente:a759d6c42cb6051a9 | 20 | 116738 | 967049 | 7990 | 1 | 1091797 | 1 | - |
