# Informe de revision — TASK-112 (ronda 2)

- Commit revisado: 89aaec7f34145aa583ec3ba94a0cdfa9d5011581
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md:26 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:304 | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/core/informe-verificacion-commit.test.ts:33 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:651 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Ningun hallazgo nuevo abierto. La correccion no abre CRITICO ni IMPORTANTE: el delta
(89aaec7 contra 96b3085) no rompe nada de lo verificado. Las dos observaciones de abajo
(N-1, N-2) no entran en la tabla: son anteriores a esta correccion o no cumplen el criterio.

## Reproduccion y verificacion de cada hallazgo

### IMP-1 — corregido
- `skills/task-workflow/revision.md:26-30`: añade la excepcion («si la peticion ya trae la
  verificacion de la ronda en verde con un `Commit verificado` igual al `Commit revisado`,
  el revisor la cita y no la vuelve a correr»). Los lineas 96-110 describen la ronda acotada:
  solo CRITICO e IMPORTANTE pendientes, MENORES no reverificados, `## Revisores no relanzados`.
- Las cinco skills revisoras tienen la misma excepcion: `angular-vue-reviewer/SKILL.md:158-160`,
  `java-spring-reviewer/SKILL.md:62-66`, `rust-wasm-reviewer/SKILL.md:165-169`,
  `code-quality-reviewer/SKILL.md:78-82` y `csharp-autocad-ifc-reviewer/SKILL.md:102-106`.
- Verificado por lectura y `grep` sobre `skills/`: ya no hay ninguna instruccion sin excepcion
  que mande repetir la suite antes de la linea base.

### MEN-1 — corregido
- `src/commands/review.ts:304-305` y `:333-334`: las dos cadenas que recibe el revisor ya no
  llevan el prefijo «TASK-112:». Las menciones que quedan en `review.ts` (lineas 411, 439, 494,
  638, 647, 652, 922) son comentarios de codigo; no llegan a la peticion. Verificado por lectura.

### MEN-2 — corregido
- `test/core/informe-verificacion-commit.test.ts:33-39`: caso en `roja`, `cortada` y
  `no-lanzable`, que afirma que `NO_REPITAS` no aparece.
- `test/core/informe-verificacion-commit.test.ts:41-48`: caso con `commit` nulo y con la clave
  ausente, que afirma que no aparece ni la linea de commit ni la regla.
- Por lectura: si se quitara `&& r.estado === 'verde'` de `src/core/informe-verificacion.ts:207`,
  el caso de `roja` fallaria, porque `NO_REPITAS` saldria. No se ha mutado el codigo
  (el revisor no toca el repo): la comprobacion por mutacion queda sin ejecutar.
- Los cuatro ficheros de test compilados pasan (ver abajo).

### MEN-3 — corregido
- `src/commands/review.ts:651-665` (`seccionSinPendientes(ronda, menores)`): cuando el revisor
  tiene MENORES, el texto dice «Tus N hallazgo(s) MENOR ... no se reverifican (los comprueba
  quien coordina)» en lugar de «No tienes hallazgos pendientes propios».
- Cableado en `src/commands/review.ts:481-497` (cuenta por revisor), `:516` (se expone en
  `leerRondaPrevia`) y `:1066-1070` (se pasa al crear la peticion). Verificado por lectura.

## Notas (no abren ronda ni van en la tabla)

- **N-1 (MENOR)** — `skills/task-workflow/revision.md:93-94`: sigue la frase «El revisor corre
  la suite completa una vez por ronda» sin la excepcion. No es contradictoria con la de las
  lineas 26-30 (sigue siendo una pasada por ronda), pero es el texto que IMP-1 señalaba y esta
  correccion no lo toco. Origen: texto anterior a TASK-112. Opcional en la siguiente que toque la guia.
- **N-2 (MENOR)** — `src/core/informe-verificacion.ts:204-207` y `src/commands/review.ts:1177-1186`:
  en una verificacion de tipo `documentacion` la seccion dice «no se ha corrido ningun test» y
  a la vez `NO_REPITAS` dice «su resultado vale para tu revision». Un revisor podria dar por
  buena la suite con solo una comprobacion de documentacion. Origen: `96b3085` (ronda 1), no esta
  correccion. Sugerencia: no añadir `NO_REPITAS` cuando el tipo es `documentacion`.
- **N-3 (nota)** — La excepcion habla de «la pasada de la ronda» y de «la suite». Cuando la
  verificacion es `selectiva` (como en esta ronda), el revisor cita una selectiva como si fuera
  la suite. Es coherente con la decision de cierre (no exige la suite completa), pero la guia
  deberia decirlo con esas palabras.

## Verificacion y tests ejecutados

- Verificacion de ronda: no repetida. La peticion trae `Commit verificado` = 89aaec7 = `Commit
  revisado`: `verificar-impacto` en verde, 881 tests, 0 fallos, codigo 0. Su resultado vale para esta revision.
- `npm run build` (en `taskcode-marketplace/plugins/taskcode-plugin`): codigo 0, `tsc` sin errores.
- `node --test dist/test/core/informe-verificacion-commit.test.js dist/test/commands/review-alcance.test.js dist/test/commands/review-incremental.test.js dist/test/skills/revisores.test.js`:
  52 tests, 52 pasan, 0 fallan.
- No se ha ejecutado la suite completa, `npm test` ni `scripts/verificar-impacto.mjs` (lo pide la peticion).
- Tras el build, `git status` queda limpio: no hay ficheros del repo modificados.
- No se han creado temporales (ni en `%LOCALAPPDATA%\pruebas-claude` ni en otro sitio) y no se ha ejecutado `taskctl`.
- Mutacion: no ejecutada. La comprobacion de MEN-2 es por lectura.

## Lecturas fuera del contexto permitido

- `src/core/informe-verificacion.ts` (lineas 120-220): para el origen de `NO_REPITAS` y la condicion del `commit`.
- `src/commands/review.ts` (lineas 296-330, 625-665, 1170-1200): ya estaba en la lista; se leyeron los rangos de la correccion y de la verificacion.
