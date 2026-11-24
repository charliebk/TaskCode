---
id: TASK-139b
titulo: "la selectiva no recorta en silencio (parte b de TASK-139)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 14359061
tokens_revision: 4050718
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
| 2026-11-24T03:46:13Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — b481b52: TASKCODE_VERIFICACION en el mismo env que RAMA_BASE; el freno usa comando_verificacion_freno (TASK-125, tipo y memo propios) en vez de cambiar su tipo: probado primero y deshecho, rompia 6 tests de memo y mensajes del freno; topeEfectivo reutiliza leerTope y seleccionar acepta Infinity; mutaciones en rojo: sin la variable, sin el Infinity de selectiva, sin la suite entera
- code-quality-reviewer — b481b52

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T03:46:13Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 78 | 46637 | 14288540 | 23806 | 18 | 14359061 | - | - |
| 2026-11-24T04:17:07Z | revision | agente:a438b8cf3678b833a | 66 | 149176 | 3883294 | 18182 | 9 | 4050718 | 1 | - |

## Verificacion ligera

- 2026-11-24T04:17:42Z: ronda 1; commit revisado 99a5aa4e26d6e2474b3e60491d8206d8de59feab; commit verificado b2b9db03badecdca18441dda451ec15d5c86d043; ficheros: scripts/verificar-impacto.mjs, taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md, taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts; corregidos: MEN-1, MEN-2, MEN-3, MEN-4; pendientes: ninguno
