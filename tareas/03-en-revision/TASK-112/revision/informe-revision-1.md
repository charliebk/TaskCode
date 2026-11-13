# Informe de revision — TASK-112 (ronda 1)

- Commit revisado: 96b3085e279665d8b519d63955b455d8d5f63bc8
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md:26 | implementacion |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:304 | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts:206 | implementacion |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:648 | implementacion |

Origen: ver plantilla de la peticion.

## Verificacion y tests ejecutados

- Verificacion de ronda: no repetida; vale la de la peticion (Commit verificado = Commit revisado = 96b3085, `verificar-impacto` 878 tests, 0 fallos).
- `npm run build` sin errores. `node --test` sobre verificacion-selectiva, review-alcance, review-incremental y review-dominios (dist): 52 tests, 52 pasan, 0 fallan.
- Casos borde construidos en un repo temporal (copia en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-112-r1`, borrada al terminar) con la API de `runReviewCommand`:
  - A: java y generico solo con MENORES, la correccion toca un fichero Angular. Solo se genera la peticion de angular-vue-reviewer; `tarea.md` recibe `## Revisores no relanzados` con una linea por cada revisor omitido. Correcto.
  - B: todos con solo MENORES y la correccion toca solo `scripts/` (dominio del generico): vuelve el generico, java consta como no relanzado. Correcto.
  - C: MENOR + IMPORTANTE aceptado en el mismo revisor: cuenta como solo-MENORES y no se relanza si no se toca su dominio. Correcto. Una severidad fuera de vocabulario (`BAJO`) fuerza ronda completa (comportamiento previo, fail-closed): no se descarta nada.
  - La seccion nueva se anade al final de `tarea.md` como encabezado propio y no pisa `## Coste` ni `## Transiciones`.
- Mutacion: sustituir `severidadDe(h.severidad) === 'MENOR'` por `false` pone 7 tests en rojo (red de regresion real). Quitar `&& r.estado === 'verde'` de la regla de no repetir deja los 25 tests de verificacion-selectiva en verde (ver MEN-2).
- Los cambios de expectativa en los tests existentes (review-alcance, review-incremental) responden al cambio pedido: pasan de exigir el MENOR en la tabla a exigir su ausencia mas la nota de MENORES omitidos, y el caso nuevo cubre los criterios 2 y 4. No debilitan nada.

## Detalle

### IMP-1 — La guia compartida y tres skills revisoras siguen mandando correr la suite completa y reverificar todo
`skills/task-workflow/revision.md` (lineas 26-29 «Una sola ejecucion de la suite por ronda», 49 «El revisor corre la suite completa una vez por ronda», 96-104 «Se verifica cada hallazgo... se ejecuta la suite» y «todo lo que no esta aceptado») no se toco. El criterio 1 pide que *la guia de revision* diga que no se repite la suite si casa con el commit revisado, y el 3 que no se reverifiquen los MENORES. Ahora la guia dice lo contrario que la peticion. Ademas `angular-vue-reviewer` (l.158-159), `java-spring-reviewer` (l.62-64) y `rust-wasm-reviewer` (l.165-168) siguen con «Correr la suite entera antes de tocar nada», sin la excepcion que si recibieron `code-quality-reviewer` y `csharp-autocad-ifc-reviewer`. Un revisor de Java, Angular o Rust recibe dos instrucciones contradictorias y, lo mas probable, repite la suite: justo el coste que la tarea quiere quitar. Reproduccion: `grep -n "Una sola vez por ronda\|suite completa una vez" skills/` y comparar con la peticion generada. Correccion: una frase en revision.md y la misma excepcion en las tres skills (y los MENORES fuera de la tabla en la descripcion de la ronda acotada de revision.md).

### MEN-1 — Identificador interno de tarea en el texto que reciben proyectos ajenos
`review.ts:304` y `review.ts:333` generan en cada peticion «(TASK-112: salvo que...)» y «(TASK-112: tu tabla solo trae...)». Esa peticion la lee un revisor de un proyecto cualquiera; `TASK-112` no significa nada alli (o apunta a una tarea que no es suya). Es contenido que el plugin expone, y las convenciones piden que no cite lo interno. Quitar el prefijo `TASK-112:` de las dos cadenas.

### MEN-2 — Sin test de que la regla de no repetir no sale en rojo
`informe-verificacion.ts:206` solo emite `NO_REPITAS` si `r.estado === 'verde'`. Mutado a siempre, ningun test se pone rojo (verificacion-selectiva: 25/25). Falta un caso con verificacion roja que aseveren que no aparece `NO_REPITAS`, y otro con `commit` nulo.

### MEN-3 — Mensaje de «sin pendientes propios» inexacto para el revisor que solo tenia MENORES
`review.ts:648` (`seccionSinPendientes`): cuando vuelve por tocar la correccion sus ficheros un revisor que tenia MENORES (casos A y B), el texto dice «No tienes hallazgos pendientes propios», pero si los tiene (se han dejado fuera a proposito). Deberia decir que sus MENORES los comprueba quien coordina, como hace la nota de la ronda con tabla.

## Lecturas fuera del contexto permitido

- `src/core/informe-revision.ts` (`severidadDe`), `src/core/transiciones.ts` (`anotarLineaEnSeccion`), `test/helpers/review-fixtures.ts` y `skills/{angular-vue,java-spring,rust-wasm}-reviewer/SKILL.md`: para construir los casos borde y comprobar la coherencia de las skills.
- `skills/task-workflow/revision.md`: la guia compartida que citan todas las skills revisoras.
