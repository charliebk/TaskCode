# Brainstorm — TASK-084, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: brainstorm-riesgos

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- **Un plugin anterior deja de ver las filas nuevas y pierde el modo congelado.** Lo he leído en `src/core/transiciones.ts:214`: `leerTransiciones` descarta toda fila con `celdas.length !== 4`. Cualquier forma de meter la versión en la fila (5.ª columna, sufijo en `decidido_por`, texto detrás del último `|`) la vuelve invisible para la 0.11.0. **Escenario:** la persona A planifica con 0.12 en modo `manual`. La persona B, o una vuelta atrás, sigue con 0.11. Para la 0.11, `modoCongelado` da `null`, y `siguiente.ts:216` (`modoDeTarea`) cae al modo del config, que puede ser `automatico`. `approve --decidido-por automatico` sigue bloqueado (`approve.ts:182`, compara `!== 'automatico'`), pero `siguiente` propone pasos con un modo que no se congeló, y `metricas` (`commands/metricas.ts:449`) cae en silencio al origen `git`. **Mitigación:** declarar que la ruptura es deliberada (igual que TASK-052, comentario de `transiciones.ts:15-17`) y que la lectura nueva acepte 4 o 5 celdas.
- **Se atribuye a la versión equivocada, que es justo el error que la tarea quiere evitar.** La versión es la constante `VERSION = '0.11.0'` de `src/cli.ts:62`, y `dist/src/` se versiona (CHECKLIST, TASK-031). Las tareas que construyen la 0.12 se cierran con un binario que ya trae su código pero aún dice 0.11.0, hasta que una tarea sube el número (pasó así: «Version 0.10.0, sin publicar», CHECKLIST:992). `--por-version` mezclaría en «0.11.0» tareas de dos comportamientos distintos, y además con aspecto de dato fiable. **Mitigación:** que el plan fije cuándo se sube `VERSION` respecto a las tareas del ciclo (decisión de dominio). Yo solo señalo el disparador.
- **La versión de una fila contradice la de las otras dos fuentes.** La versión vive en tres sitios: `cli.ts:62`, `package.json:3` y `.claude-plugin/plugin.json:4`. En `test/empaquetado/metadatos.test.ts` solo he visto el test que alinea `plugin.json` con `marketplace.json`. Si se sube una y se olvida `cli.ts`, todas las filas desde ese día llevan la versión vieja, y no se puede corregir sin reescribir historia. **Mitigación:** una sola fuente de verdad, o un test de alineación.
- **Orden de los grupos lexicográfico en vez de semver.** Ya existen 0.9.x, 0.10.0 y 0.11.0, y como texto `"0.10.0" < "0.9.0"`. La tabla y el `--json` saldrían desordenados, y una comparación «la anterior frente a la actual» tomaría la pareja equivocada. **Mitigación:** comparar por componentes numéricos, y decidir qué hacer con un sufijo `-dev`/`-rc`.
- **Una tarea con varias filas `finish` de versiones distintas.** Escenario: `finish` escribe su fila en el mismo commit que la transición, aborta después (conflicto de merge, verificación roja), se actualiza el plugin y se reintenta. Quedan dos `finish` con versiones distintas. **Mitigación:** regla explícita y documentada, «la del último `finish`», igual que `revision` ya usa el último `finish` (`core/metricas.ts:24`).
- **Inventar una versión para las tareas sin anotar.** Si la fila `finish` no lleva versión (todas las anteriores a TASK-084, las del origen `git` y las editadas a mano), la tentación es deducirla por la fecha o por el tag, que es lo que «casi lleva a error». **Mitigación:** grupo explícito «sin versión», contado aparte, nunca repartido.

## Estados intermedios y fallos parciales
- La escritura de la fila es atómica respecto al commit (comentario de `transiciones.ts:19-21`: la fila viaja en el commit de la transición), así que el cambio no crea una ventana nueva de transición sin fila.
- Una tarea en curso al actualizar el plugin queda con filas mezcladas: `plan` sin versión y `finish` con versión. Es legítimo y debe agruparse por la de cierre. El riesgo es que alguien agrupe por la de `plan`.
- Fila nueva bajo una cabecera vieja de 4 columnas: en GFM las celdas que sobran respecto a la cabecera no se muestran, así que en GitHub/GitLab la versión de las tareas existentes es invisible aunque esté escrita. Cambiar la cabecera sería reescribir la sección, cosa que hoy está prohibida («nunca reescribe filas», `transiciones.ts:30`).
- `--por-version` es de solo lectura: si muere a mitad no deja nada a medias. Repetirla es seguro.

## Compatibilidad hacia atras
- **Datos viejos con el lector nuevo:** las filas de 4 celdas, con fecha de día o de segundo, tienen que seguir dando el mismo modo congelado y las mismas métricas. Si la lectura pasa a exigir 5 celdas, toda tarea anterior pierde registro y modo. Es el mismo riesgo que TASK-052 fijó con un test.
- **Datos nuevos con el lector viejo:** se rompen (primer modo de fallo). §7.3 asume una sola versión del plugin por repo (`core/config.ts:84`). Hay que escribirlo en el plan y en el README, no dejarlo implícito.
- **Consumidores en prosa:** `skills/task-workflow/avance.md:31` describe la fila como «fecha, fase, modo y quien decidio», y se instala en proyectos ajenos. Si no se actualiza, miente.
- **El `--json` de `metricas` que ya existe:** si se añade `version` a cada fila del JSON actual, quien compare la salida completa ve un cambio. `--por-version` debería ser una forma nueva, no una mutación de la de siempre.

## Vuelta atras
- El código se revierte. Los datos no: las filas con versión ya están commiteadas en `tarea.md` y mergeadas en `develop`, y las ramas no se borran. Quitarlas exige reescribir los `tarea.md` de cada tarea afectada.
- Tras volver a la 0.11, las tareas en vuelo planificadas con 0.12 quedan **sin modo congelado** y con métricas por origen `git`, sin ningún aviso. Las terminadas solo pierden la telemetría fina.
- Las tareas terminadas son inofensivas tras la vuelta atrás. Las peligrosas son las que estén entre `plan` y `finish` en el momento del revert.

## El riesgo que mas te preocupa (UNO solo)
- La atribución errónea por el momento en que se sube `VERSION` en `src/cli.ts:62`. El resto rompe de forma visible o queda acotado. Este produce un `--por-version` que parece exacto y agrupa bajo «0.11.0» tareas cerradas con el código de la 0.12: es el mismo «casi lleva a error» del objetivo, ahora con apariencia de dato fiable y sin vuelta atrás, porque la versión queda grabada en filas commiteadas.

**Lo que mi rol no cubre:** dónde encaja el cambio (arquitectura), qué aserciones escribir (testing) y la regla de qué versión «cuenta» o cuándo se sube (dominio). No he verificado si existe otro test que alinee `cli.ts` con `package.json` más allá de lo que vi en `metadatos.test.ts`.
