---
id: TASK-149a
titulo: "git y hooks (parte a de TASK-149)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
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
