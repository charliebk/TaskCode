# Informe de revision — TASK-113 (ronda 1)

- Commit revisado: 1bb49b1d0ec8c1ff4f3321be6d5a0556de95203d
- Revisor: code-quality-reviewer
- Veredicto: aprobada-con-correcciones (los dos hallazgos son MENOR y no bloquean; se documentan como aceptados o corregibles a criterio de quien cierra)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:655 (`statDeFicheros`), tambien :346 y src/commands/review.ts:106 (`seccionTests`) | plan |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:310 (`PATRONES_TEST`) frente a src/core/menores.ts:76 (`esRutaDeTest`) | plan |

Modo rapido: no se ejecuto la suite completa ni `verificar-impacto`; solo los tests afectados.

### Verificacion ejecutada

- `npm run build` (tsc): sin errores.
- `node --test dist/test/commands/review-tests-stat.test.js dist/test/commands/review-exclusion.test.js dist/test/commands/review-dominios.test.js`: 16 tests, 16 pass, 0 fail.
- Repo Git temporal real (con espacios en la ruta, `ñ` y tildes, `test/` en la raiz, `Test/` con mayuscula): `diffParaRevision` clasifica bien los tests (`a.test.ts`, `src/mi carpeta/b test.spec.ts`, `src/ñandú.test.ts`, `test/a.ts`, `test/e.ts`), el `--stat=200` sale con rutas completas y el `diff` embebido deja solo los ficheros que no son tests. `:(literal)` resuelve bien los espacios y los caracteres no ASCII. La clasificacion por dominio no cambia: los tests siguen en `incluidos`.
- Los tests que casan con `excluir_de_revision` salen como excluidos y no entran en `tests` (`tests` se calcula sobre `incluidos`). Los held-out se excluyen antes. Coherente.

### MEN-1 — la orden de `--stat` por rutas literales revienta con muchos tests

Reproduccion: `statDeFicheros(desde, 'HEAD', <3000 rutas tipo test/dir/fichero-largo-numero-N.test.ts>, repo)` lanza
`No se pudo ejecutar "git": spawnSync git ENAMETOOLONG` (limite de linea de comandos de Windows, ~32 KB). Antes de la tarea, el camino no fragmentado solo pasaba los patrones de exclusion (longitud constante) y no podia fallar asi. Ahora `diffParaRevision` (git.ts:345) llama a `statDeFicheros` con todos los tests, por lo que un refactor masivo con unos cientos de tests de ruta larga abortaria `taskctl review` (aunque, segun el orden de calculo, antes de escribir ninguna peticion). Ademas la seccion `## Tests del diff` imprime una orden `git diff ... -- <todas las rutas>` que tambien seria inutilizable a ese tamano. El plan acepto este riesgo (mismo patron que `diffRangeForPaths`), asi que es MENOR; lo recomendable es troceado por lotes o caer a patrones `:(glob)` / al diff de los directorios si hay mas de N rutas.

### MEN-2 — `PATRONES_TEST` y `esRutaDeTest` no son equivalentes en dos bordes

El comentario de `PATRONES_TEST` dice que "reproducen" la heuristica de `esRutaDeTest`. Medido en repo temporal:

- `d.test.x/c.ts` (carpeta con `.test.` en el nombre): `esRutaDeTest` true (regex `\.(test|spec)\.` sobre toda la ruta), Git `**/*.test.*` no lo casa (solo el nombre base) y su diff se embebe. Inofensivo (el diff se ve entero, no se pierde nada).
- `Test/e.ts` con `core.ignorecase=true` (Windows/macOS): Git lo trata como test, `esRutaDeTest` no. Tambien inofensivo en la peticion, pero hay dos definiciones de "fichero de test" que pueden discrepar. Solo se manifiesta en el sentido seguro (se embebe de mas, o se lista de menos sin perder la orden de recuperacion).

Sin consecuencias demostrables para la revision; basta ajustar el comentario ("aproxima") o anadir un test de coherencia.

## Resto de la revision

- Peticion fragmentada: cada grupo lista solo sus tests y embebe el diff de sus no tests (test 16 en verde); el `diffRangeForPaths` con lista vacia de no tests no se llama con rutas vacias de forma peligrosa (comprobado por el test de solo tests).
- Cuando solo cambian tests el bloque del diff lo dice (`solo cambian tests`), y no confunde con "sin diferencias".
- Sin hallazgos CRITICO ni IMPORTANTE.

## Lecturas fuera del contexto permitido

- taskcode-marketplace/plugins/taskcode-plugin/src/core/menores.ts (`esRutaDeTest`): el plan afirma coherencia con ella y habia que compararla (MEN-2).
- Seccion de `git.ts` alrededor de `ficherosParaRevision` y `pathspecSinExcluidos`, y el bloque de `runReview` en review.ts, para entender el calculo de `tests`.
