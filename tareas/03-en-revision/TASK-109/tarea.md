---
id: TASK-109
titulo: "Verificacion proporcional B6: documentacion y limpieza del nivel 2"
tipo: feature
sprint: 0
etiquetas: [verificacion, agilidad]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-109-verificacion-proporcional-b6-documentaci
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2619616
tokens_implementacion: 17040744
tokens_revision: 20489569
creado: 2026-11-11
actualizado: 2026-11-12
dependencias: [TASK-107, TASK-108]
---
## Objetivo

Sexta y ultima parte de TASK-096; hasta cerrarla no se publica version. skills/task-workflow/verificacion-selectiva.md, README y CHANGELOG explican el principio de coste proporcional al cambio y como lo declara un proyecto (rutas_verificacion_parcial leida de la base, lista de permitidas, timeout de la selectiva, cobertura omitida, release y hotfix a la completa, el guardian sigue exigiendo la completa para codigo y por que un merge a mano tras un fallo queda bloqueado). La decision sobre TASK-091 queda escrita. Aviso de doctor si procede, el Ejemplo del error de forma de rutas_verificacion_parcial en validarPatronesExclusion (hoy sale el de excluir_de_revision; nota de la revision 2 de TASK-096), codigo sin uso borrado y motivo de cada test que cambio de expectativa en las partes B1..B5. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).

## Criterios de aceptacion
- [ ] verificacion-selectiva.md, README y CHANGELOG explican el principio y la clave, sin marcas de este repo; la prueba de la guia asevera el contrato literal y se pone roja si se borra la seccion
- [ ] La decision sobre TASK-091 y lo que se retira quedan escritos; el codigo que quede sin uso se borra
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T01:00:33Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T01:07:27Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T01:07:29Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T08:38:03Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T01:07:18Z | diseno | agente:ab9dce27ad2cc99c6 | 66 | 112841 | 2487864 | 18845 | 49 | 2619616 | - | - |
| 2026-11-12T08:38:03Z | implementacion | sesion:b4e87bc9-9df0-4298-9beb-5107e454beff | 118 | 392329 | 15880033 | 34141 | 13 | 16306621 | - | - |
| 2026-11-12T08:38:03Z | implementacion | agente:a4ba4897b4f6e1923 | 16 | 105039 | 622112 | 6956 | 0 | 734123 | - | - |
| 2026-11-12T09:09:34Z | revision | agente:a0fc40ccd12fd6280 | 240 | 228563 | 20207547 | 53219 | 25 | 20489569 | 1 | - |

## Autorrevision

- code-quality-reviewer — adc87aa
- code-quality-reviewer — 5ee2706
