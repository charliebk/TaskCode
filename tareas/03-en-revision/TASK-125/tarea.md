---
id: TASK-125
titulo: "Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea"
tipo: feature
sprint: 0
etiquetas: [agilidad, verificacion, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-125-freno-stop-con-presupuesto-de-tiempo-y-c
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 8674062
tokens_revision: null
creado: 2026-11-12
actualizado: 2026-11-13
dependencias: [TASK-111]
---
## Objetivo

Medido en ToolsaWeb (153 tareas terminadas, taskctl metricas, 2026-11-12): la revision ha pasado del 51 % al 59-65 % del tiempo de cada tarea y el freno Stop ejecuta la selectiva al final de cada turno, hasta 26 min por turno en tareas del nucleo. Hoy el freno, las rondas de review y finish comparten comando_verificacion_selectiva y timeout_verificacion_selectiva (src/hooks/freno-stop.ts, src/commands/review.ts, src/commands/finish-verificacion.ts), asi que no se puede dar al freno un comando mas rapido sin abaratar tambien la verificacion de la ronda. Se busca que el freno tenga su propio comando rapido y un presupuesto de tiempo (por ejemplo 3 min): si lo supera, anota el exceso en el registro del freno y deja parar el turno en vez de bloquearlo; la seguridad la siguen dando review y finish. Toca freno-stop.ts y usa el registro de ejecuciones del freno: va despues de TASK-111. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [ ] Una clave nueva comando_verificacion_freno en .taskcode/config.yml la usa solo el freno Stop; review sigue con comando_verificacion_selectiva y finish con sus comandos, y sin la clave nueva el freno se comporta como hoy (test con repo temporal y test de regresion)
- [ ] Una clave presupuesto_freno_s (180 por defecto cuando se declara comando_verificacion_freno; sin ninguna de las dos, sin tope propio como hoy) corta la verificacion que corra el freno al agotarse: el freno no bloquea, deja parar el turno con un aviso de una linea y anota resultado excedido en el registro de TASK-111 (test con un comando que tarda mas que el presupuesto)
- [ ] Un rojo dentro del presupuesto sigue bloqueando el turno como hoy (test)
- [ ] config.ts valida las dos claves (presupuesto entero positivo y no mayor que el timeout del hook Stop) y taskctl doctor muestra que comando corre cada puerta: freno, review y finish (test)
- [ ] README, CHANGELOG y la skill task-workflow explican el reparto de claves por puerta
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-13T12:36:53Z | plan | automatico | persona | 0.14.0 |
| 2026-11-13T12:38:08Z | approve | automatico | persona | 0.14.0 |
| 2026-11-13T12:38:12Z | start | automatico | persona | 0.14.0 |
| 2026-11-13T12:51:18Z | review | automatico | persona | 0.14.0 |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-13T12:51:18Z | implementacion | sesion:bdb2d869-6133-422f-8b3d-f1c76840a4dc | 56 | 49546 | 8596010 | 28450 | 2 | 8674062 | - | - |
