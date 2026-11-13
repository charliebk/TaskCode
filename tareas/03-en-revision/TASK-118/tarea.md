---
id: TASK-118
titulo: "P-10: linea FIN con la duracion en todos los scripts de Git-Flow"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-118-p-10-linea-fin-con-la-duracion-en-todos
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 3049754
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

Los logs de Git-Flow no cierran siempre con una linea reconocible (los de create no se pueden medir), asi que la duracion de start, review y finish no se puede sacar de ellos. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-10)

## Criterios de aceptacion
- [x] Todos los scripts de scripts/gitflow terminan su registro con una linea FIN con la operacion, el resultado y la duracion en segundos, tambien cuando abortan (test por script)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

`initialize_gitflow_log` instala un `trap EXIT` que cierra el registro con
`FIN: <operacion> | resultado: <R> | duracion: <N>s`: el resultado de `log_summary`,
`ABORTADO` si sale 0 sin resumen o `ERROR (codigo N)`. Los 22 scripts que registran
lo dejan (test por script en test/gitflow/linea-fin.test.ts; mutante sin el trap: 23
rojos). Documentado en skills/task-workflow/trampas.md.

Revision por pares, ronda 1 (general-purpose + code-quality-reviewer, sonnet):
aprobada, sin CRITICOS ni IMPORTANTES.

- MEN-1 (MENOR, aceptado): con SIGTERM el proceso sale con 143 pero la linea dice
  `ABORTADO` (dentro del trap de EXIT `$?` vale 0 tras una senal). La FIN se escribe y
  la etiqueta describe lo ocurrido; con SIGKILL no hay FIN, inevitable.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T02:49:42Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T02:50:17Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T02:50:18Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T02:59:11Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T02:59:11Z | implementacion | sesion:1fb23e40-df0f-4598-9be1-751ce6506e3c | 18 | 12554 | 3030451 | 6731 | 0 | 3049754 | - | - |
