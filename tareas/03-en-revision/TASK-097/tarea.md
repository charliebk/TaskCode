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
tokens_revision: 6657179
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Ley de agilidad (decision de Carlos, 2026-11-10): una tarea prevista de mas de 1 hora de punta a punta (de la rama abierta al cierre con merge) se parte en varias. Medido en 147 tareas: el mejor predictor de la duracion son los ficheros de codigo (correlacion 0,40; capas 0,28; criterios 0,23); con 1-10 ficheros de codigo la mitad cierra en una hora, con 11 o mas solo el 16 %. Se estima al planificar, el plan lo deja escrito, la persona decide en approve y finish mide el tiempo real para calibrar. Partir por capas solo si cada parte se verifica sola; si no, una porcion vertical pequena.

## Criterios de aceptacion
- [ ] plan-final.md lleva la linea 'Duracion estimada: N min' con sus senales (ficheros de codigo previstos, capas, criterios); taskctl approve avisa si falta (test)
- [ ] Si la estimacion supera 60 min, taskctl siguiente en la fase approve devuelve preguntar en cualquier modo y su motivo propone trocear; con 60 o menos, nada cambia (test por cada caso)
- [ ] taskctl finish anota en tarea.md los minutos reales de punta a punta (de start a finish, sin pausas) junto a la estimacion, y taskctl metricas los muestra (test en un repo temporal)
- [ ] skills/plan y skills/task-workflow explican la regla, las senales y como trocear (porcion vertical frente a capas); README y CHANGELOG la anotan
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

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

## Autorrevision

- code-quality-reviewer — 48fba41
