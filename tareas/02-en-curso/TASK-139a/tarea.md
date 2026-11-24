---
id: TASK-139a
titulo: "disfraces B1-B5 (parte a de TASK-139)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di
asignado_a: claude
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

Parte a del troceo de TASK-139 (Regla 4D: tests que no protegen lo que dicen), partes TASK-139a, TASK-139b en la rama fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di.

Enlace de poda-tests, cerrojo ilegible, mensaje bash de Git en Linux, test duplicado de review-tests-stat y criterios de TASK-133.

Objetivo de la tarea entera:

> Cerrar los disfraces que encontro la auditoria 4D de TASK-137 (docs/auditoria-4d.md, casos B1-B5): enlaces y ramas sin test, aserciones que solo corren en Windows y tests duplicados.

## Criterios de aceptacion

- [ ] Un test falla si task-workflow/SKILL.md deja de enlazar poda-tests.md, y la rama de cerrojo ilegible de scripts/verificar-impacto.mjs tiene un test que falla al romperla
- [ ] Las aserciones del mensaje bash de Git de doctor tienen equivalente que corre en Linux (o se documenta por que no), el test de 1100 ficheros de review-tests-stat se elimina o se justifica, y los criterios de TASK-133 quedan marcados segun su Resultado

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T00:44:49Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T00:45:29Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T00:45:32Z | start | automatico | persona | 0.16.1 |
