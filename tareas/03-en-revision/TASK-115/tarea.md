---
id: TASK-115
titulo: "P-7: verificacion completa por lote de cierres en modo automatico"
tipo: feature
sprint: 0
etiquetas: [arreglo, urgente, v0.16]
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-115-p-7-verificacion-completa-por-lote-de-ci
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 9169464
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: []
---
## Objetivo

En ToolsaWeb cada finish corre la verificacion completa (28 min de mediana) aunque se cierren varias tareas seguidas en automatico. Una completa por lote, con vuelta atras si sale en rojo, cuesta 28 min por lote en vez de por tarea. Relaja cada integracion en verde: la forma concreta la decide Carlos en el plan. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): lo mas rapido posible, sin trocear salvo que haga falta; el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Origen: docs/auditoria/PASOS-PLUGIN-2026-11-12.md (P-7)

## Criterios de aceptacion
- [x] Con la clave verificacion_por_lote activada, finish de una tarea con codigo integra sin la completa y anota la verificacion como pendiente de lote (test en repo temporal)
- [x] Un comando de taskctl corre una completa sobre la rama de integracion y la anota en todas las tareas pendientes de ese lote (test)
- [x] Si la completa del lote sale en rojo, el comando dice que tareas entraron desde la ultima completa en verde (test)
- [x] Sin la clave, finish y el guardian de merges se comportan como hoy (test de regresion)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Forma decidida** (la tarea la dejaba a Carlos; por su regla del 2026-11-13
de aceptar las recomendaciones, se tomo la recomendada en el plan): la clave
`verificacion_por_lote`, leida de la config de la RAMA BASE, relaja solo la
completa de `finish` de feature y fix con codigo. Documentacion, selectiva
del nivel 2, release y hotfix (van a la principal) y el guardian de merges no
cambian. La vuelta atras ante un rojo la decide una persona. Se puede revisar.

**Implementado.** `finish` anota `## Verificacion por lote` con «pendiente de
lote» (commiteada en la rama antes del merge, sin duplicar en un reintento) e
integra sin la completa. `taskctl verificar-lote [--push]`, en la rama de
integracion con el arbol limpio, corre la completa una vez sobre HEAD (memo de
la completa, puerta `finish` modo `lote`, progreso con contador), anota «lote
en verde en <commit>» en todas las pendientes y lo commitea; en rojo no anota
nada y lista las tareas que entraron desde la ultima completa en verde.
Documentado en docs/configuracion.md, README (tabla de comandos e indice) y
CHANGELOG.

**Evidencia.** `verificar-impacto`: 919/919. `verificar-lote.test.ts`: 9/9;
el mutante de IMP-1 muere con el test de hotfix.

**Revision por pares.** Ronda 1 (code-quality-reviewer, sonnet): aprobada con
correcciones, cambiada a cambios-solicitados por un IMPORTANTE.
- IMP-1 (corregido): nada protegia que release y hotfix quedaran fuera del
  lote; tests de hotfix (con la clave en la principal) y de release.
- MEN-1 (corregido): un reintento duplicaba la linea pendiente.
- MEN-2 (corregido): `pendienteDeLote` no respetaba bloques de codigo y una
  nota a mano tras la pendiente la sacaba del lote; ahora solo «lote en verde»
  la resuelve.
- MEN-3 (corregido): la completa del lote corria sin contador de progreso.
No cubierto por tests: `finish --merge-request` con la clave (pasa por la
misma puerta).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T13:54:02Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T13:54:27Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T13:54:29Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T14:02:29Z | review | automatico | persona | 0.14.0 |
| 2026-11-13T14:32:21Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T14:02:29Z | implementacion | sesion:bdb2d869-6133-422f-8b3d-f1c76840a4dc | 40 | 32341 | 9117383 | 19700 | 1 | 9169464 | - | - |

## Verificacion ligera

- 2026-11-13T14:47:54Z: ronda 2; commit revisado 3026b9aa6a4609a4400d350785f0cd977e7be37f; commit verificado 7b55d99eb5810cc1c7da0f27f849645395cb30f7; ficheros: taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts, taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts, taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts; corregidos: MEN-2, MEN-4; pendientes: ninguno
