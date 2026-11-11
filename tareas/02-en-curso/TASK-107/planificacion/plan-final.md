# Plan — TASK-107: Verificacion proporcional B4: Stop, review y finish deciden igual el mismo diff

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Duracion estimada: 55 min (de la rama abierta al cierre con merge; senales: 1 fichero de test nuevo, 0 de produccion previstos, una capa —tests de integracion con repos Git reales—, 3 criterios, 2-3 pasadas de mutacion y una suite completa de ~10 min)

Un unico fichero de test tabular nuevo; produccion no se toca. Stop y review ya
deciden con la misma funcion, `peticionDeTrabajo` (`src/fs/decision-documentacion.ts:190`),
y finish con `decidirVerificacionEntre` (`src/commands/finish-verificacion.ts:114`),
que es la que `peticionDeTrabajo` usa por dentro.

- Filas: documentacion, parcial, transversal. Columnas: Stop, review, finish.
  Celdas: el vector esperado de ejecuciones `{completa, sel, docs}`.
- La tabla comprueba valores absolutos, no solo «A == B»: como Stop y review
  comparten funcion, una mutacion dentro de `peticionDeTrabajo` los moveria a
  la vez y una igualdad seguiria en verde.

Piezas:
- `test/commands/verificacion-tres-puertas.test.ts` — nuevo. Ningun fichero
  cruza hoy los tres actores con el nivel 2 (`review-documentacion.test.ts:195`
  cruza Stop y review sin `rutas_verificacion_parcial`; `finish-parcial.test.ts`
  solo finish).
- Script contador fuera del repo copiando el patron de
  `review-documentacion.test.ts:33` / `finish-parcial.test.ts:22`; sin helper
  compartido nuevo.
- Fixtures existentes: `review-fixtures.setupTaskEnCursoSoloTarea` (Stop y
  review, tarea en `02-en-curso`) y `finish-fixtures.setupTaskEnRevision`
  (finish, `03-en-revision`), como en `verificacion-selectiva.test.ts:24-30`.
- Config comun: `rutas_documentacion: [docs/**, trabajo-*.txt]`,
  `rutas_verificacion_parcial: [src/**]`, `comando_verificacion_selectiva` y
  `comando_verificacion_documentacion`. `trabajo-*.txt` es lo que deja
  `setupTaskEnRevision`; sin declararlo, finish nunca veria «solo documentacion».
- `aplicarCaso(fila, repo)` escribe y commitea los mismos ficheros fuera de
  `tareas/`: documentacion `docs/x.md`; parcial `src/a.ts`; transversal
  `lib/b.ts` (fuera de las rutas parciales).
- Un repo nuevo por cada par (fila, actor): 9. El memo es compartido (review
  reutiliza el verde del Stop, `review-documentacion.test.ts:205-206`; finish
  el de la selectiva, `deMemo` en `finish-verificacion.ts:102`), asi que en un
  repo compartido los contadores no dirian que eligio cada actor.

Orden de construccion:
1. Entorno (contador, config de nivel 2) y `aplicarCaso`. Fila documentacion
   para Stop y review: `{0,0,1}` (un turno o ronda que solo toca documentacion
   no corre la suite).
2. Filas parcial `{0,1,0}` y transversal `{0,1,0}` para Stop y review (puertas
   de iteracion: no corren la completa).
3. Columna finish: documentacion `{0,0,1}`, parcial `{0,1,0}`, transversal
   `{1,0,0}`. Comprobar que `RAMA_BASE` llega igual (`develop`) a la selectiva
   de los tres en la fila parcial.
4. Mutaciones a mano, revertidas y documentadas en `Resultado`.
5. `npm run test:rapido` al iterar; `npm test` una vez antes de la revision.

Alternativas descartadas:
- Un repo por fila con los tres actores en secuencia (3 repos): el memo confunde
  los contadores; separarlo exige borrar `freno-verificacion.json` y acopla el
  test a `fs/verificacion.ts`; finish ademas exige otro estado y mergea.
- Test unitario de `peticionDeTrabajo` / `decidirVerificacionEntre`: no ve el
  cableado de cada actor (`baseFiable`, `sinSelectiva`, `permitirSelectiva`),
  que es donde puede aparecer la divergencia.

## Lo que el rol no cubrio

- Criterio 1: casos limite (hotfix, base no fiable, config invalida, arbol
  sucio) no revisados; algunos ya en `review-documentacion.test.ts:253` y `:303`.
- Criterio 2: mutaciones propuestas, no medido si la tabla las mata todas.
- Criterio 3: coste en la suite estimado (9 repos de plantilla, segundos), no
  medido. No entra en `test:rapido` (lanza procesos).
- Da por buena la decision «Stop y review no corren la completa ante lo
  transversal» de `tareas/04-terminadas/TASK-096/planificacion/plan-final.md:33`.

Suposiciones a comprobar al implementar:
- `runFinishCommand` con una feature pasa `permitirSelectiva: true` y `ramaBase`
  a `puertaVerificacion` (`src/commands/finish.ts`).
- Cada copia de la plantilla (`test/helpers/repo-plantilla.ts`) tiene su propio
  memo.
- La selectiva de finish recibe `RAMA_BASE` igual que review y Stop
  (`puertaSelectiva` en `finish-verificacion.ts`).

## Riesgos aceptados y que los contiene

- Sin selectiva declarada, Stop corre la completa y review nada (`sinSelectiva`):
  fuera de la tabla (el nivel 2 exige selectiva); lo cubre
  `review-documentacion.test.ts:161`.
- Stop y review leen el comando selectivo de la config del arbol y finish de la
  base: iguales en la tabla porque ninguna fila toca `.taskcode/config.yml`; una
  rama que cambie la config va siempre a la completa
  (`verificacion-proporcional.ts:122`).
- `EBUSY` en el teardown con 9 repos: ruido conocido, no regresion.

## Plan de pruebas

- Tabla 3 filas x 3 actores con aserciones sobre los tres contadores, nunca solo
  sobre el mensaje.
- Mutaciones que deben ponerla en rojo:
  - M1: review pasa `baseFiable: false` (`review.ts:1075`) -> en documentacion
    review corre `sel`.
  - M2: finish con `permitirSelectiva` falso para una feature -> en parcial
    finish corre la completa.
  - M3: Stop con `baseFiable: false` (`freno-stop.ts:189`) -> roja la celda
    documentacion de Stop y no la de review (la tabla distingue actores).
- Si una fila sale roja sin mutar nada, es divergencia real: ver decisiones.

## Lo que necesita decision de una persona

Respondidas por Carlos el 2026-11-11:
- Divergencia real destapada: se corrige aqui si es una linea de cableado; si toca `decision-documentacion.ts`, tarea aparte.
- La fila transversal de finish (`{1,0,0}`) entra en la tabla.
- 9 repos, uno por cada par (fila, actor).
