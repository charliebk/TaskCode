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
- [x] Una clave nueva comando_verificacion_freno en .taskcode/config.yml la usa solo el freno Stop; review sigue con comando_verificacion_selectiva y finish con sus comandos, y sin la clave nueva el freno se comporta como hoy (test con repo temporal y test de regresion)
- [x] Una clave presupuesto_freno_s (180 por defecto cuando se declara comando_verificacion_freno; sin ninguna de las dos, sin tope propio como hoy) corta la verificacion que corra el freno al agotarse: el freno no bloquea, deja parar el turno con un aviso de una linea y anota resultado excedido en el registro de TASK-111 (test con un comando que tarda mas que el presupuesto)
- [x] Un rojo dentro del presupuesto sigue bloqueando el turno como hoy (test)
- [x] config.ts valida las dos claves (presupuesto entero positivo y no mayor que el timeout del hook Stop) y taskctl doctor muestra que comando corre cada puerta: freno, review y finish (test)
- [x] README, CHANGELOG y la skill task-workflow explican el reparto de claves por puerta
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

**Implementado.** Claves `comando_verificacion_freno` (solo la usa el freno
Stop; recibe `RAMA_BASE` y tiene su propio memo, `freno-verificacion-rapida.json`,
que no abre el guardian ni lo reutiliza finish) y `presupuesto_freno_s` (1 a
3600, el `timeout` del hook Stop; 180 por defecto con el comando del freno; sin
ninguna, sin tope propio). Un corte por presupuesto deja parar el turno con una
linea de aviso y anota `excedido`; un rojo dentro del presupuesto bloquea como
antes. `taskctl doctor` anade `puertas-verificacion` (comando de freno, review
y finish y presupuesto). Documentado en docs/configuracion.md (tabla por
puerta), README, la skill task-workflow y CHANGELOG. De paso, por el tope de
20 KB del checklist (ya superado tras TASK-111), TASK-092 a TASK-109 pasan a
`docs/contexto/archivo/CHECKLIST-fases-cerradas.md`.

**Evidencia.** `verificar-impacto`: 980/980. Tests del freno, config, doctor y
skills en verde; el mutante de MEN-1 muere con el test nuevo.

**Revision por pares (ronda 1, code-quality-reviewer, sonnet): aprobada**, sin
CRITICOS ni IMPORTANTES; mutantes M1 a M6 detectados.
- MEN-1 (corregido): faltaba test del memo del freno con el arbol sucio.
- MEN-2 (corregido): la doc decia que un `timeout_verificacion*` menor que el
  presupuesto es rojo tambien con comando propio; precisado.
Cerrados con `verificar-menores`, sin ronda 2 (modo rapido).

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

## Verificacion ligera

- 2026-11-13T13:06:49Z: ronda 1; commit revisado 8cde3133c9bd024e7207c690a7698d7c2e1bcda4; commit verificado 3d60a6747b2ef4b1e2d307d6136bbbaceedaff58; ficheros: taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md, taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-presupuesto.test.ts; corregidos: MEN-1, MEN-2; pendientes: ninguno

## Verificacion omitida

- 2026-11-13T13:07:28Z: taskctl finish --sin-verificacion; no se ejecuto `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
