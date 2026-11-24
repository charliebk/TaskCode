---
id: TASK-139b
titulo: "la selectiva no recorta en silencio (parte b de TASK-139)"
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
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: [TASK-139a]
---
## Objetivo

Parte b del troceo de TASK-139 (Regla 4D: tests que no protegen lo que dicen), partes TASK-139a, TASK-139b en la rama fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di.

El plugin pasa TASKCODE_VERIFICACION al comando; verificar-impacto corre todos los afectados en review y finish.

## Criterios de aceptacion
- [ ] El comando de verificacion recibe TASKCODE_VERIFICACION con su tipo (selectiva en review y finish, freno en el Stop), con test, y el README del plugin lo documenta
- [ ] Con TASKCODE_VERIFICACION=selectiva, scripts/verificar-impacto.mjs no recorta: corre todos los afectados, y la suite completa si no sabe que afecta; con freno o a mano mantiene el tope, con test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T03:25:39Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T03:25:57Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T03:25:59Z | start | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — b481b52: TASKCODE_VERIFICACION en el mismo env que RAMA_BASE; el freno usa comando_verificacion_freno (TASK-125, tipo y memo propios) en vez de cambiar su tipo: probado primero y deshecho, rompia 6 tests de memo y mensajes del freno; topeEfectivo reutiliza leerTope y seleccionar acepta Infinity; mutaciones en rojo: sin la variable, sin el Infinity de selectiva, sin la suite entera
- code-quality-reviewer — b481b52
