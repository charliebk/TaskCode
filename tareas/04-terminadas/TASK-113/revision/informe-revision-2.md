# Informe de revision — TASK-113 (ronda 2)

- Commit revisado: 63f06cadd3a999416ee01f41fbbc5328ee0e1cfa (HEAD de la peticion; el commit posterior aa35285 solo toca `tareas/`, asi que el codigo verificado es el mismo)
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:659-675 (`statDeFicheros`, `LOTE_RUTAS_STAT`); src/commands/review.ts:494-508 (`seccionTests`, `MAX_RUTAS_ORDEN_TESTS`) | plan |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:305-313 (`PATRONES_TEST`, comentario) | plan |
| NUEVO-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts:83-94 (`fueraDeTareas`), con el patron `**/*-lock.*` de src/core/config.ts:278-279 | implementacion |

### NUEVO-1 — la exclusion por defecto `**/*-lock.*` deja pasar codigo real a la puerta de `finish`

La ampliacion (c) introduce el fallo: `fueraDeTareas` ahora resta `excluir_de_revision`, y la
configuracion por defecto incluye `**/*-lock.*`, que tambien casa con codigo fuente cuyo nombre
contiene `-lock.` (p. ej. `src/services/redis-lock.ts`, `src/x/file-lock.service.ts`).

Reproduccion en un repo Git temporal con la configuracion por defecto (`excluir_de_revision` =
`["**/dist/**","**/*.lock","**/*-lock.*","tareas/**"]`):

- Base: `src/a.ts`. Commit posterior: cambia `src/a.ts` y anade `src/services/redis-lock.ts`.
- `git diff --name-only base HEAD -- ':(top)' ':(top,exclude)tareas/'` (lo que filtraba la version anterior): `src/a.ts` y `src/services/redis-lock.ts`.
- `codigoCambiado(base, 'HEAD')` (version actual): solo `["src/a.ts"]`. El fichero desaparece.
- `ficherosParaRevision` con `excluirDeRevision(...)`: tambien lo excluye, asi que `review` nunca lo leyo. Eso ya pasaba desde TASK-034; la correccion lo extiende a la puerta.

Como `codigoCambiado` es la unica entrada de `estadoCorreccionPosterior` (que usan `finish` en
`codigoSinVerificar`, `siguiente` y `verificar-menores`), un MENOR que cambie `redis-lock.ts` pasa
`verificar-menores` y `finish` sin revision. Antes de la correccion, `finish` lo bloqueaba y pedia
otra ronda.

Severidad IMPORTANTE, no CRITICO: comportamiento incorrecto en un caso real (nombre de fichero
plausible), no perdida de datos. Por eso exige `cambios-solicitados` (regla de
`verificar-menores`: un IMPORTANTE abierto no cabe en la verificacion ligera).

Propuesta de correccion: acotar el patron por defecto a los lockfiles reales, p. ej.
`**/*-lock.json`, `**/*-lock.yaml`, `**/*-lock.yml`, `**/*-lock.toml` (Git no admite llaves en
pathspec). Y un test de `verificar-menores` con `src/x-lock.ts` cambiado tras un MENOR que espere
bloqueo. El cambio del default toca `config.ts` y puede afectar a los tests de `review-exclusion`:
decidirlo con la persona.

### MEN-1 — verificado por test y por lectura

El `ENAMETOOLONG` de la ronda 1 no se volvio a reproducir con 3000 rutas (no se repitio ese
caso). Verificado: `statDeFicheros` trocea en lotes de 100 (test "por lotes ... sin perder ninguna",
en verde, con tres resumenes para 203 rutas), y `seccionTests` pasa a patrones `:(glob)` con mas de
20 tests (test "con mas de MAX_RUTAS_ORDEN_TESTS tests", en verde). El `diffParaRevision` completo
usa pathspecs de patron, no una lista por fichero, asi que no tiene el mismo riesgo.

### MEN-2 — corregido en el comentario

El comentario de `PATRONES_TEST` ya describe los dos bordes conocidos (`x.test.y/` y `Test/` con
`core.ignorecase`) y dice que el peor caso es embeber de mas o listar de menos. Basta para el
MENOR, como decidio la ronda 1. Comprobado por lectura del comentario, no por ejecucion.

### (c) Ampliacion de `fueraDeTareas` — coherente, con el agujero de NUEVO-1

- Coherente: `excluirDeRevision` es el mismo conjunto que usa `review` (review.ts:787) y
  `siguiente` (`revisoresDelRango`). `finish`, `siguiente` y `verificar-menores` leen `codigoCambiado`.
- Held-out: `EXCLUIR_HELDOUT` es `tareas/*/TASK-*/aceptacion/**`, siempre bajo `tareas/`, que ya
  estaba excluido. No anade superficie.
- `dist/` y lockfiles por defecto: no son codigo fuente que la revision lea. Lo que abre hueco es
  el patron `**/*-lock.*` (NUEVO-1) y cualquier `excluir_de_revision` que una persona configure
  sobre codigo real: en ese caso ese codigo ya quedaba fuera de la revision desde el principio.

## Verificacion ejecutada

- `npm run build` (tsc) en `taskcode-marketplace/plugins/taskcode-plugin`: sin errores; `git status` limpio despues (el build no cambia `dist/` respecto al commit).
- `node --test dist/test/commands/review-tests-stat.test.js dist/test/commands/verificar-menores.test.js dist/test/commands/siguiente.test.js`: 27 tests, 27 pass, 0 fail, 0 cancelled, 0 skipped.
- Reproduccion de NUEVO-1 con un repo Git temporal y `codigoCambiado` / `ficherosParaRevision` de `dist/` (salida arriba). Temporales borrados al terminar.
- No ejecutada, por encargo: la suite completa, `npm test` y `verificar-impacto`.

## Notas fuera de la tabla (no abren ronda)

1. MENOR, no verificado: `statDeFicheros` trocea por numero de rutas (100), no por longitud. Con rutas de unos 300 caracteres, 100 rutas se acercan al limite de 32.767 caracteres de la linea de comandos de Windows. Calculo, no ejecutado. Trocear tambien por bytes acumulados lo cerraria.
2. Fuera del delta, no verificado: `diffRangeForPaths` (git.ts, TASK-018) pasa una ruta por argumento en la fragmentacion por dominio. Con miles de ficheros de un mismo dominio, el mismo riesgo de `ENAMETOOLONG`.
3. Fuera del delta, no verificado: `review` aplica la exclusion relativa al cwd (`-- .`), mientras `verificar-menores` usa `:(top,...)`. Coinciden desde la raiz del repo; desde un subdirectorio podrian diferir.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts` (lineas 276-281, defaults de `excluir_de_revision`): hace falta para evaluar NUEVO-1.
- `src/fs/revisores-rango.ts`, `src/core/heldout.ts` (`EXCLUIR_HELDOUT`), `src/fs/git.ts` (`ficherosParaRevision`, `pathspecSinExcluidos`) y `src/commands/review.ts` (uso de `excluirDeRevision`, linea 787): para comprobar la coherencia de (c).
- `src/commands/siguiente.ts` (uso de `estadoCorreccionPosterior` y `revisoresDelRango`): mismo motivo.
