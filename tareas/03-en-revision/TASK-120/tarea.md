---
id: TASK-120
titulo: "P-12: sincronizacion con su duracion registrada y limitada a las fases que se declaren"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-120-p-12-sincronizacion-con-su-duracion-regi
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 23258728
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

comando_sincronizacion (en ToolsaWeb, el grafo de tareas) corre en cada transicion, unas 8-10 veces por tarea, y no queda registro de cuanto tarda. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-12)

## Criterios de aceptacion
- [x] La duracion de cada ejecucion de comando_sincronizacion queda registrada bajo .git/taskcode/ y taskctl metricas la suma por tarea (test)
- [x] Una clave nueva lista las fases en las que corre la sincronizacion; sin ella corre en todas, como hoy (test)
- [x] El registro usa un formato de linea comun para todas las puertas de verificacion (puerta, tarea, instante, modo, duracion en segundos, resultado), aqui con puerta sincronizacion, documentado para que lo reutilicen el freno Stop (TASK-111) y review y finish (TASK-128); metricas ignora las lineas de puertas que no conoce y sin registro muestra — (test)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

Registro comun de puertas en `.git/taskcode/puertas.log` (seis campos con tabulador:
puerta, tarea, instante, modo, duracion_s, resultado), documentado en
docs/registro-puertas.md del plugin para TASK-111 y TASK-128. Cada ejecucion de
`comando_sincronizacion` anota una linea (modo = la fase que commitea); los 16
llamadores de `autoCommit` pasan su fase. Clave nueva `fases_sincronizacion` (sin
ella, en todas, como antes). `taskctl metricas` suma la sincronizacion por tarea en la
columna `sinc` (al final de la tabla), ignora otras puertas y muestra `—` sin registro.

De paso: el test del symlink de approve.test.ts se omite con `t.skip` ante EPERM (sin
privilegio de symlink en Windows); bloqueaba la verificacion por impacto de cualquier
tarea que tocara approve.ts. CLAUDE.md actualizado: en Windows fallan 2, no 3.

Revision por pares, ronda 1 (general-purpose + code-quality-reviewer, sonnet):
aprobada, sin CRITICOS ni IMPORTANTES.

- MEN-1 (MENOR, aceptado): el registro es por worktree (`--git-path`); lo anotado en
  un worktree no lo ve `metricas` desde el principal. Coherente con los demas ficheros
  de estado bajo `.git/` y documentado.
- MEN-2 (MENOR, aceptado): solo `approve` tiene test de su `fase`; un cambio de fase en
  otro llamador no pondria nada en rojo.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T04:17:20Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T04:18:26Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T04:18:28Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T04:47:54Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T04:47:54Z | implementacion | sesion:1fb23e40-df0f-4598-9be1-751ce6506e3c | 102 | 69261 | 23151919 | 37446 | 5 | 23258728 | - | - |
