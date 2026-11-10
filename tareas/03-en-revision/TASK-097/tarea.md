---
id: TASK-097
titulo: "Regla de una hora: plan estima la duracion de punta a punta y propone trocear"
tipo: feature
sprint: 0
etiquetas: [plan, agilidad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-097-regla-de-una-hora-plan-estima-la-duracio
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 627661
tokens_implementacion: 44150681
tokens_revision: 7707966
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Ley de agilidad (decision de Carlos, 2026-11-10): una tarea prevista de mas de 1 hora de punta a punta (de la rama abierta al cierre con merge) se parte en varias. Medido en 147 tareas: el mejor predictor de la duracion son los ficheros de codigo (correlacion 0,40; capas 0,28; criterios 0,23); con 1-10 ficheros de codigo la mitad cierra en una hora, con 11 o mas solo el 16 %. Se estima al planificar, el plan lo deja escrito, la persona decide en approve y finish mide el tiempo real para calibrar. Partir por capas solo si cada parte se verifica sola; si no, una porcion vertical pequena.

## Criterios de aceptacion
- [x] plan-final.md lleva la linea 'Duracion estimada: N min' con sus senales (ficheros de codigo previstos, capas, criterios); taskctl approve avisa si falta (test)
- [x] Si la estimacion supera 60 min, taskctl siguiente en la fase approve devuelve preguntar en cualquier modo y su motivo propone trocear; con 60 o menos, nada cambia (test por cada caso)
- [x] taskctl finish anota en tarea.md los minutos reales de punta a punta (de start a finish, sin pausas) junto a la estimacion, y taskctl metricas los muestra (test en un repo temporal)
- [x] skills/plan y skills/task-workflow explican la regla, las senales y como trocear (porcion vertical frente a capas); README y CHANGELOG la anotan
- [x] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Resultado

**Implementado.** Regla de una hora (decision de Carlos, 2026-11-10): una tarea prevista de mas de una hora de punta a punta se trocea. Modulo puro `core/duracion-estimada.ts`: lee `Duracion estimada: N min` del plan (ignora bloques de codigo; admite viñeta, cita, encabezado, enfasis y acentos graves; la linea de plantilla sin cifra no cuenta; solo vale un entero de minutos seguido del fin, un parentesis con las senales o un punto), `UMBRAL_MINUTOS = 60` y la seccion `## Duracion` de tarea.md. La plantilla de plan-final.md gana la linea (solo se anade: el detector de plantilla sigue igual). `approve` avisa si falta la linea y rechaza `--decidido-por automatico` con mas de 60 o una cifra ilegible. `siguiente` pregunta en approve en cualquier modo, manual incluido, en esos casos. `finish` anota estimada y real de punta a punta (de start a finish sin pausas, `minutosPuntaAPunta` sobre el calculo de metricas) sin lanzar nunca tras el merge y reemplazando la seccion en un reintento. `metricas` gana las columnas `estimada` y `punta_a_punta`. Guia `skills/task-workflow/duracion.md` (senales, como trocear, limites), paso 5 de la skill plan, README y CHANGELOG.

**Decisiones de la persona** (plan-final.md): las cuatro aplicadas (preguntar tambien en manual; rechazo de la aprobacion automatica; cifra declarada con sus senales a la vista; linea ausente avisa y linea no entendida pregunta).

**Tests que cambian de expectativa:** los de metricas que fijan la lista de columnas (`metricas.test.ts`, `metricas-tokens.test.ts`, `core/metricas.test.ts`) ganan las dos columnas nuevas o desplazan sus indices; no se debilita ninguna asercion.

**Revision por pares.** Ronda 1 (completa): cambios solicitados con 3 IMPORTANTE y 2 MENOR, todos corregidos: H1 «2 horas», «1 h 30» o «90 - 120» se leian como minutos y saltaban la regla; H2 la skill task-workflow pasaba de 15 KB con CRLF (un cuarto rojo en Windows que el implementador atribuyo a los conocidos; ahora mide 15355 bytes, como en develop); H3 faltaba el test en los tres modos; H4 formatos de la linea no reconocidos; H5 limites sin documentar. 16 de 17 mutantes muertos en la ronda 1; el superviviente (H3) muere en la 2. Ronda 2 (verificacion de correcciones por protocolo de arranque, aunque el taskctl 0.13 la genero completa por «un IMPORTANTE corregido»): aprobada sin hallazgos nuevos.

**Suite completa:** 2094 tests, 2090 en verde antes de la ronda 1 (los 3 conocidos de Windows y, segun la revision, el limite de 15 KB con CRLF, ya corregido). Tras las correcciones: suite rapida 687/687 y los tests afectados en verde salvo el conocido de chmod.

**Limites aceptados:** la estimacion la escribe el agente (se contiene con las senales a la vista en approve y la medicion de finish); las pausas hechas con los wrappers pause/resume no se descuentan (documentado).

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T15:13:25Z | plan | automatico | persona | 0.13.0 |
| 2026-11-10T15:21:51Z | approve | automatico | persona | 0.13.0 |
| 2026-11-10T16:07:35Z | start | automatico | persona | 0.13.0 |
| 2026-11-10T16:47:24Z | review | automatico | persona | 0.13.0 |
| 2026-11-10T17:37:46Z | review | automatico | persona | 0.13.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-10T15:21:47Z | diseno | agente:a7ec5d299fd738624,a4a66dc6a31e2733d,a6e41e0bc628e5ef4 | 42 | 111372 | 499644 | 16603 | 35 | 627661 | - | - |
| 2026-11-10T16:47:24Z | implementacion | sesion:f5a75e93-b137-4945-9f2a-de03fa092974 | 102 | 76006 | 34815391 | 39149 | 26 | 34930648 | - | - |
| 2026-11-10T16:47:24Z | implementacion | agente:a2b502fc133f8002f | 108 | 222902 | 8663058 | 54762 | 0 | 8940830 | - | - |
| 2026-11-10T16:47:24Z | implementacion | agente:a40be68dbd3be50f9 | 6 | 138187 | 137925 | 3085 | 0 | 279203 | - | - |
| 2026-11-10T17:31:32Z | revision | agente:a5131d3f6446b9844 | 100 | 158596 | 6469983 | 28500 | 8 | 6657179 | 1 | - |
| 2026-11-10T17:42:49Z | revision | agente:a348b6af9ce799239 | 24 | 93133 | 951455 | 6175 | 1 | 1050787 | 2 | - |

## Autorrevision

- code-quality-reviewer — 48fba41
