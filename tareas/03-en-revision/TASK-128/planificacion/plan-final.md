# Plan — TASK-128: Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 75 min (de la rama abierta al cierre con merge; senales: 5 ficheros de codigo, 4 de tests, README/docs y CHANGELOG, 6 criterios)

No se trocea: decision de Carlos del 2026-11-13.

1. `core/registro-puertas.ts`: `resumirPuerta(lineas, puerta)` generaliza
   `resumirFreno` (que queda como `resumirPuerta(l, 'freno')`). Constantes
   `PUERTA_REVIEW = 'review'` y `PUERTA_FINISH = 'finish'`. Resultados:
   `verde`, `rojo`, `omitido` (servido de memo, no ejecuto).
2. `commands/review.ts`: la verificacion de ronda (`verificarConMemo`) anota
   una linea `review` (modo `selectiva` o `documentacion`, duracion de reloj,
   resultado) ANTES de abortar en rojo.
3. `commands/finish-verificacion.ts`: un ayudante `anotarFinish` y una linea
   `finish` en cada verificacion: completa, documentacion, selectiva (codigo
   parcial) y la del arbol ya integrado (modo = su tipo). El modo `pesada`
   queda documentado para TASK-126. Se anota antes de lanzar el error del
   rojo. `--sin-verificacion` no anota nada (no hubo puerta).
4. `core/informe-revision.ts`: `rondasSoloMenores(informes)`: cuantas rondas
   k >= 2 se abrieron tras una ronda k-1 cuyos informes no tienen ningun
   CRITICO ni IMPORTANTE (cualquier estado). Sin informes o con un informe sin
   tabla en una ronda que cuenta: null (sin dato, no 0).
5. `core/metricas.ts` y `commands/metricas.ts`: columnas nuevas al final,
   `review_n`, `review_v`, `finish_n`, `finish_v` (veces y tiempo de cada
   puerta; `freno_n` y `freno` ya estan) y `rondas_men`; `—` sin dato. Debajo
   de la tabla, una fila de totales de las puertas: «Puertas de verificacion
   (todas las tareas): freno N (t), review N (t), finish N (t)», con `—` sin
   registro. Las columnas anteriores no cambian (regresion).
6. docs/registro-puertas.md, README del plugin (si nombra columnas) y
   CHANGELOG.

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- El registro es por worktree (como TASK-120/111): un finish desde otro
  worktree anota en el suyo.
- `rondas_men` cuenta por severidad, no por si la ronda k-1 aprobo: lo que
  pide la tarea (rondas abiertas sin CRITICO/IMPORTANTE nuevos).

## Plan de pruebas

- `test/core/registro-puertas`: `resumirPuerta` para review y finish.
- `test/core/informe-revision` (o metricas): `rondasSoloMenores` con informes
  de ejemplo: ronda 1 solo MENOR + ronda 2 -> 1; ronda 1 con IMPORTANTE -> 0;
  sin tabla -> null; sin informes -> null.
- `test/commands` con repo temporal: review con selectiva en verde anota
  `review`; finish con completa anota `finish` (verde) y en rojo anota `rojo`.
- `test/commands/metricas` y `sincronizacion-fases`: columnas nuevas por el
  CLI con lineas reales; regresion: las columnas anteriores iguales y
  `--por-version` igual sin registro; la fila de totales.
- `verificar-impacto` y `test:rapido`.

## Lo que necesita decision de una persona

Nada.
