---
id: TASK-128
titulo: "Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, metricas, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-128-metricas-de-verificacion-por-puerta-tiem
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 8179698
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: [TASK-111, TASK-125]
---
## Objetivo

Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min, el freno Stop hasta 26 min por turno en tareas del nucleo y la revision ya es el 59-65 % del tiempo de cada tarea, pero metricas no ve cuanto se va en cada puerta: solo hay memos de la ultima ejecucion. TASK-111 registra el freno y TASK-120 la sincronizacion; falta registrar las verificaciones de review y de finish con el mismo formato, sumarlas por tarea y contar las rondas abiertas solo por MENORES (en los tres proyectos, 71 rondas asi con 2 CRITICO/IMPORTANTE nuevos y 70,2 M tokens, docs/auditoria/PASOS-PLUGIN-2026-11-12.md). Usa el registro de TASK-111: va despues de ella y de TASK-125 (presupuesto del freno). Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [x] Cada verificacion de ronda de review y cada verificacion de finish (completa, selectiva, documentacion, pesada) anade una linea con puerta, tarea, instante, modo, duracion y resultado al mismo registro bajo .git/taskcode/ que el freno de TASK-111 (test con repo temporal)
- [x] taskctl metricas muestra por tarea, para cada puerta (freno, review, finish), el numero de ejecuciones y el tiempo total, y una fila de totales; sin registro muestra — (test)
- [x] taskctl metricas cuenta por tarea las rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE, leyendo los informes de revision que ya existen (test con informes de ejemplo)
- [x] Con tareas cerradas antes de este cambio, sin registro, metricas y metricas --por-version siguen dando la misma salida en las columnas que ya existian (test de regresion sobre un repo con datos de la 0.14)
- [x] README y CHANGELOG describen las columnas nuevas
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Implementado.** `review` anota cada verificacion de ronda (puerta `review`,
modo `selectiva` o `documentacion`) y `finish` cada verificacion de cierre
(puerta `finish`: completa, documentacion, selectiva y la del arbol ya
integrado), tambien en rojo, en el registro de puertas de TASK-120/111.
`taskctl metricas` anade `review_n`, `review_v`, `finish_n`, `finish_v`
(ejecuciones sin omitidos y tiempo) y `rondas_men` (rondas abiertas tras una
ronda sin CRITICO ni IMPORTANTE; «—» sin dato), y debajo de la tabla la fila
de totales de las tres puertas. Las columnas anteriores no cambian. El modo
`pesada` queda documentado para TASK-126. Documentado en docs/comandos.md,
docs/registro-puertas.md y CHANGELOG (el README remite a docs/comandos.md).

**Evidencia.** `verificar-impacto`: 896/896. Tests afectados en verde; los
cuatro mutantes que sobrevivian en la revision mueren con los tests nuevos.

**Revision por pares (ronda 1, code-quality-reviewer, sonnet): aprobada con
correcciones**, sin CRITICOS ni IMPORTANTES.
- MEN-1 (corregido): faltaban tests de la anotacion de finish en selectiva
  (verde y rojo), documentacion y reintento con la rama ya integrada.
- MEN-2 (corregido): faltaba test del modo `documentacion` de review.
`verificar-menores` los dejo en el backlog porque el informe apuntaba a
ficheros de `src/` y la correccion fueron solo tests; estan corregidos
(mutantes comprobados), asi que se marcan `corregido` y se retira el backlog.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T13:08:28Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T13:09:13Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T13:09:15Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T13:18:16Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T13:18:16Z | implementacion | sesion:bdb2d869-6133-422f-8b3d-f1c76840a4dc | 42 | 38971 | 8118540 | 22145 | 2 | 8179698 | - | - |

## Verificacion ligera

- 2026-11-13T13:52:57Z: ronda 1; commit revisado b057c57d625465ec13e9dde707a32b27236e5c21; commit verificado e419377f6f5bfca86af5c193b2a6e9c31a2ec33a; ficheros: taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-documentacion.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-parcial.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-documentacion.test.ts; corregidos: ninguno; pendientes: MEN-1, MEN-2

## Verificacion omitida

- 2026-11-13T13:53:30Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
