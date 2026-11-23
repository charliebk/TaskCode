---
id: TASK-147a
titulo: "secciones con un solo lector y un solo «crear al final» (parte a de TASK-147)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-147-regla-4d-lectores-de-secciones-e-ids-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
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
