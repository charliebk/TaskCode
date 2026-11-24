---
id: TASK-145
titulo: "Regla 4D: duplicacion en las puertas de finish"
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

Unificar lo copiado dentro de finish y sus puertas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-02 a CMD1-07, CMD1-12 a CMD1-15 y FS-09).

## Criterios de aceptacion
- [ ] finish-verificacion, finish-heldout y doctor usan gitTexto (con timeout y entorno) en vez de sus copias; configBase y configDe son una sola funcion
- [ ] Las puertas pesada, completa y de documentacion comparten el bloque ejecutar-anotar-arbol limpio-memo, y puertaReintento usa opcionesEjecucion
- [ ] La base de la rama de la tarea se decide una vez en finish, comprobarTagDeReintento sin copia, y los textos repetidos y la regex que quita [ERROR] salen de una sola fuente
- [ ] Sin comentarios huerfanos ni obsoletos en approve, finish, finish-verificacion y codex-review

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T09:37:04Z | plan | automatico | persona | 0.16.1 |
