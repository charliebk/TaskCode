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

El plugin pasa TIPO_VERIFICACION al comando; verificar-impacto corre todos los afectados en review y finish.

## Criterios de aceptacion
- [x] El comando de verificacion recibe TIPO_VERIFICACION con su tipo (selectiva en review y finish, freno en el Stop), con test, y el README del plugin lo documenta
- [x] Con TIPO_VERIFICACION=selectiva, scripts/verificar-impacto.mjs no recorta: corre todos los afectados, y la suite completa si no sabe que afecta; con freno o a mano mantiene el tope, con test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T03:25:39Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T03:25:57Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T03:25:59Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T03:46:13Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — b481b52: TIPO_VERIFICACION en el mismo env que RAMA_BASE; el freno usa comando_verificacion_freno (TASK-125, tipo y memo propios) en vez de cambiar su tipo: probado primero y deshecho, rompia 6 tests de memo y mensajes del freno; topeEfectivo reutiliza leerTope y seleccionar acepta Infinity; mutaciones en rojo: sin la variable, sin el Infinity de selectiva, sin la suite entera
- code-quality-reviewer — b481b52

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T03:46:13Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 78 | 46637 | 14288540 | 23806 | 18 | 14359061 | - | - |
| 2026-11-24T04:17:07Z | revision | agente:a438b8cf3678b833a | 66 | 149176 | 3883294 | 18182 | 9 | 4050718 | 1 | - |

## Verificacion ligera

- 2026-11-24T04:17:42Z: ronda 1; commit revisado 99a5aa4e26d6e2474b3e60491d8206d8de59feab; commit verificado b2b9db03badecdca18441dda451ec15d5c86d043; ficheros: scripts/verificar-impacto.mjs, taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md, taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts; corregidos: MEN-1, MEN-2, MEN-3, MEN-4; pendientes: ninguno

## Resultado

- El plugin pasa `TIPO_VERIFICACION` al comando de verificación con su tipo: `selectiva` en review y en finish con código parcial, `freno` con `comando_verificacion_freno`.
- `scripts/verificar-impacto.mjs`:
  - Con `selectiva` no aplica el tope: corre todos los afectados y, si no sabe qué afecta, la suite entera (la ejecuta de verdad, con test).
  - Con `freno` o a mano conserva el tope de 10.
  - No pasa la variable a los tests hijos.
- Config del repo: el freno corre el script como comando propio (tipo y memo aparte, presupuesto 600 s), así que su verde recortado no lo reutilizan finish ni el guardián. `timeout_verificacion_selectiva` sube a 3600.
- Desviación del plan: se probó a cambiar el tipo del freno en el plugin, pero rompía 6 tests de memo y mensajes. Se deshizo y se usó `comando_verificacion_freno` (TASK-125), que ya separa tipo y memo. La función pura `topeEfectivo` se prueba por `--listar` en vez de con un test aparte.
- Documentación: docs/configuracion.md y task-workflow/verificacion-selectiva.md. El README del plugin enlaza a la primera.
- Revisión, ronda 1: aprobada con correcciones. MEN-1 a MEN-4 corregidos: test de la suite entera, test de que la variable no se hereda, mensaje sin «queda para antes de publicar» y documentación del caso sin comando del freno.
- Tras aprobar, la suite completa del finish falló en skills/task-workflow.test.js: el nombre `TASKCODE_VERIFICACION` metía una marca del repo en verificacion-selectiva.md, que se instala en otros proyectos. La variable pasa a `TIPO_VERIFICACION` (2e46542, renombrado mecánico). Carlos autorizó cerrar con `--aceptar-sin-revisar` solo por ese cambio.
- Hueco detectado: la selectiva de review no lo vio porque verificar-impacto trata los .md de las skills como documentación y no corre nada, aunque haya tests que los leen. Queda como tarea aparte.
