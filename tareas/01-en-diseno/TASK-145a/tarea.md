---
id: TASK-145a
titulo: "puertas, git y textos de error (parte a de TASK-145)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f
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
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-145 (Regla 4D: duplicacion en las puertas de finish), partes TASK-145a, TASK-145b en la rama fix/task-145-regla-4d-duplicacion-en-las-puertas-de-f.

gitTexto en finish-verificacion, finish-heldout, verificacion y doctor; configBase y configDe unidas; puerta comun; textos y regex de [ERROR] de una sola fuente.

Objetivo de la tarea entera:

> Unificar lo copiado dentro de finish y sus puertas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-02 a CMD1-07, CMD1-12 a CMD1-15 y FS-09).

## Criterios de aceptacion

- [ ] finish-verificacion, finish-heldout, fs/verificacion y doctor usan gitTexto (con timeout y entorno) en vez de sus copias, y configBase y configDe son una sola funcion
- [ ] Las puertas pesada, completa y de documentacion comparten el bloque ejecutar-anotar-arbol limpio-memo, puertaReintento usa opcionesEjecucion, y los textos repetidos y la regex que quita [ERROR] salen de una sola fuente

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T09:37:04Z | plan | automatico | persona | 0.16.1 |
