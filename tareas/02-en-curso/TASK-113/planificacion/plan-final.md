# Plan — TASK-113: P-5: peticion de revision mas ligera con los tests como --stat y ruta

(Modo rapido: tarea pequena, el plan lo redacta el coordinador sin lanzar el
rol de brainstorm ni unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 45 min (de la rama abierta al cierre con merge; senales: 2 ficheros de codigo, 1-2 de tests, 3 criterios)

Estado de partida (leido en el codigo): `diffParaRevision` (`src/fs/git.ts`)
ya separa los ficheros que casan con `excluir_de_revision` y los deja en un
`--stat` con la orden para pedirlos (TASK-034); la peticion lo pinta en
`## Excluido del diff`. Los tests, en cambio, van en el diff embebido entero.

Cambio:

1. `src/fs/git.ts`: constante `PATRONES_TEST` con los globs de Git que
   reproducen la heuristica `esRutaDeTest` (`**/test/**`, `**/tests/**`,
   `**/__tests__/**`, `**/*.test.*`, `**/*.spec.*`). `diffParaRevision`
   devuelve ademas `tests` (los incluidos que casan con esos patrones,
   calculados por Git, un solo motor de globs) y `statTests`; su `diff` ya
   no lleva los tests. Una funcion `statDeFicheros(desde, hasta, paths)`
   (`--stat=200`, `:(literal)`) da el `--stat` de una lista de rutas.
2. La clasificacion por dominio NO cambia: los tests siguen en `incluidos`,
   cuentan para repartir revisoras y entran en el contexto permitido del
   revisor (puede leerlos en su ruta).
3. `src/commands/review.ts`: cada peticion embebe el diff de sus ficheros
   que no son tests (en la fragmentada, `diffRangeForPaths` sobre los no
   tests del grupo) y una seccion nueva `## Tests del diff (N fichero(s))`
   con el `--stat` de sus tests (ruta completa) y la orden
   `git diff <desde>..HEAD -- <rutas>` para pedir su diff. Si solo cambian
   tests, el bloque del diff lo dice en vez de "sin diferencias".

## Lo que el rol no cubrio

No se lanzo rol. Fuera de alcance: hacerlo configurable (YAGNI hasta que un
proyecto lo pida) y cambiar el texto de las skills (no describen el contenido
de la peticion: tocarlas obligaria a la suite completa en finish).

## Riesgos aceptados y que los contiene

- El revisor deja de ver el diff de los tests y podria no detectar un test
  debilitado. Lo contiene: la seccion da las rutas y la orden exacta, los
  tests siguen en el contexto permitido, y el revisor reproduce ejecutando.
- Linea de comandos: el `--stat` por rutas literales crece con el numero de
  tests; es el mismo patron que ya usa `diffRangeForPaths` en la peticion
  fragmentada.
- Los tests held-out ya estan excluidos antes (`EXCLUIR_HELDOUT`): no entran
  en la seccion de tests.

## Plan de pruebas

Repos Git temporales reales (patron de `test/commands/review-exclusion.test.ts`):

- Rama con `src/a.ts` y tres tests: la peticion contiene el diff de
  `src/a.ts`, no el contenido de los tests, y la seccion de tests con las
  tres rutas y su `--stat` (criterio 1).
- Tres tests grandes + un fichero de codigo: la peticion pesa menos de la
  mitad que el diff completo embebido como antes (criterio 2).
- Solo tests cambiados: el bloque de diff lo dice.
- Peticion fragmentada: cada grupo lleva solo sus tests.
- Ajustar las expectativas de tests existentes que buscaban el diff de un
  test dentro de la peticion; `verificar-impacto` + `test:rapido` (criterio 3).

## Lo que necesita decision de una persona

Nada: aplica a todos los proyectos sin clave nueva.
