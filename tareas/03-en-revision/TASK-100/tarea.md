---
id: TASK-100
titulo: "Verificacion proporcional A1: finish no corre la suite si la tarea solo cambia documentacion"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-100-verificacion-proporcional-a-una-tarea-qu
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 735317
tokens_implementacion: 14841125
tokens_revision: 6097400
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Troceada en el plan por la regla de una hora (165 min estimados; decision de Carlos, 2026-11-10): esta tarea hace A1 (configuracion, decision unica, finish y sus puertas de cobertura y held-out); el guardian de merges es TASK-101 y el freno Stop y review son TASK-102. Sin A2 y A3 nada se vuelve mas laxo: el guardian, Stop y review siguen como en la 0.14.0. El enunciado original sigue debajo.

Primera parte de TASK-096 (decision de Carlos, 2026-11-10: trocearla y empezar por la de mas valor y menos riesgo). Hoy finish, el freno Stop, las rondas de revision y el guardian de merges pagan la verificacion completa aunque la tarea solo cambie documentacion (ToolsaWeb: unos 28 min por finish, tambien en tareas de solo .md; la mayoria de las tareas recientes de ToolsaWeb y OpenDockTrading son documentos o estudios). Un proyecto declara que rutas son documentacion; si el diff de la tarea frente a la base solo toca esas rutas, no se corre la suite de tests, solo la comprobacion de documentacion si el proyecto la declara, y la salida dice que verificacion corrio y por que. Fail-closed: un diff mixto, una ruta no clasificada o un error al calcular el diff van a la verificacion de siempre. Opt-in: sin la configuracion nueva todo se comporta exactamente como en la 0.14.0. No se retira ningun freno. La verificacion de solo lo afectado en codigo parcial queda para TASK-096.

## Criterios de aceptacion
- [x] Con la configuracion nueva, en un repo temporal cuya tarea solo cambia rutas de documentacion, taskctl finish integra sin ejecutar comando_verificacion y su salida dice que verificacion corrio y por que; si el proyecto declara una comprobacion de documentacion, se ejecuta y su fallo bloquea igual que hoy (test de integracion por caso)
- [x] Un diff mixto (documentacion y codigo), con una ruta no clasificada o sin poder calcular el diff ejecuta la verificacion de siempre (un test por caso)
- [x] Un proyecto sin la configuracion nueva se comporta exactamente como en la 0.14.0 (tests de regresion de finish y de sus puertas de cobertura y held-out)
- [x] skills/task-workflow (verificacion-selectiva.md), README y CHANGELOG explican el principio, como declara un proyecto sus rutas de documentacion (con ejemplos de .md que NO son documentacion: skills, agentes, CLAUDE.md, comandos) y que de momento solo finish lo aplica
- [x] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Resultado

**Implementado (A1 de TASK-096, troceada en el plan por la regla de una hora: 165 min estimados, decision de Carlos).** Claves nuevas opcionales `rutas_documentacion` (patrones `git :(glob)` sin anclar; se rechazan los que casan con todo) y `comando_verificacion_documentacion`. Decision unica y pura en `core/verificacion-proporcional.ts` (`decidirVerificacion`), que reutilizaran TASK-101 (guardian) y TASK-102 (Stop y review). `fs/git.ts` gana `rutasDeTarea` (merge-base, `--no-renames`, `-z`, pathspecs `:(top)`). `finish`: si todo lo que cambia la tarea cae en las rutas de documentacion de la RAMA BASE, no corre `comando_verificacion`; anota y commitea en `## Verificacion de documentacion` antes del merge (idempotente en un reintento) y, si hay comando de documentacion, lo corre con su propio memo (`documentacion`, nunca el de la completa). La puerta de cobertura trata la tarea como `omitida`; la de held-out no cambia (no lee el resultado de la verificacion).

**Ante la duda, la completa:** sin rutas, diff no calculable o vacio, cambio en `.taskcode/config.yml`, ruta fuera de documentacion (renombres por sus dos lados), config de la base invalida, y siempre en un `release`.

**Decisiones del implementador** (no estaban en el plan): `tareas/**` cuenta siempre como documentacion (toda tarea cambia su carpeta; sin ello la funcion no actuaria nunca; los held-out los sigue corriendo su puerta) y un `release` corre siempre la completa (lleva a la principal todo lo acumulado).

**Revision por pares.** Ronda 1 (completa): cambios solicitados con IMP-1 (con el proyecto en una subcarpeta del repo, el codigo de fuera se colaba como documentacion; reproducido de punta a punta) y MEN-1 a MEN-5. Corregidos IMP-1 (`:(top)`), MEN-1 (anotacion sin duplicar), MEN-2 (texto de mayusculas) y MEN-4 (patrones totales rechazados). Aceptados MEN-3 (`tareas/**` siempre documentacion, decision documentada) y MEN-5 (una clave nueva mal formada desactiva el guardian: lo cubre el criterio 3 de TASK-101). Ronda 2 (verificacion acotada y modelo barato, la regla de la 0.14.0 funcionando aqui): aprobada con correcciones. Quedan MEN-6 (el mensaje de error dice «casa con cualquier fichero» tambien para `*` y `*/**`, que no lo hacen; rechazarlos es seguro) y MEN-7 (la frase sobre `core.ignorecase` de verificacion-selectiva.md es inexacta: el pathspec distingue mayusculas siempre, el lado seguro), ambos de texto: pasan a TASK-101, que toca esos ficheros, en vez de abrir otra ronda por dos frases.

**Tests:** 17 nuevos (9 de integracion con `finish` real y 8 unitarios) mas el reintento. Mutantes de la revision (sin `-z`, sin la comprobacion de config, sin la de diff vacio, contra HEAD, sin excluir `tareas/**`) muertos; sin `--no-renames` sobrevive pero es equivalente. No cambia de expectativa ningun test existente.

**Suite completa:** 2134 tests, 2128 en verde antes de la revision: los 3 rojos conocidos de Windows y 2 de doctor intermitentes por carga (66 s), que pasan aislados (75/75). Tras las correcciones, suite rapida 707/707 y los 26 tests de la tarea en verde.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T19:57:48Z | plan | automatico | persona | 0.14.0 |
| 2026-11-10T20:07:36Z | approve | automatico | persona | 0.14.0 |
| 2026-11-10T20:07:38Z | start | automatico | persona | 0.14.0 |
| 2026-11-10T20:48:00Z | review | automatico | persona | 0.14.0 |
| 2026-11-10T21:06:21Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T20:03:45Z | diseno | agente:a4ddfe25c518261e6,a118359c7e0d14283,ae7f7a5f26750c1c5 | 50 | 117216 | 591360 | 26691 | 31 | 735317 | - | - |
| 2026-11-10T20:48:00Z | implementacion | sesion:f5a75e93-b137-4945-9f2a-de03fa092974 | 86 | 87960 | 14707516 | 45563 | 18 | 14841125 | - | - |
| 2026-11-10T21:02:13Z | revision | agente:a51a94ac1094ed618 | 68 | 173435 | 4499621 | 37223 | 2 | 4710347 | 1 | - |
| 2026-11-10T21:11:27Z | revision | agente:ad08c61db4f501bc6 | 26 | 122467 | 1236945 | 27615 | 0 | 1387053 | 2 | - |

## Autorrevision

- code-quality-reviewer — 1996a91
- code-quality-reviewer — 4140aef
