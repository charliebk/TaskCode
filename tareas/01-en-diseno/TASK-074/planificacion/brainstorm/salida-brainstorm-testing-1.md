# Brainstorm — TASK-074, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: `taskcode-plugin:brainstorm-testing`

## Que es observable sin llamar a ningun agente

- Todo se puede afirmar desde fuera: el texto de `peticion-*.md` que escribe
  `taskctl review` (sección de líneas no cubiertas), el código de salida y el
  stderr de `finish`, y si `develop` avanzó o no, contra un repo Git temporal
  real (`test/helpers/review-fixtures.ts`, `finish-fixtures.ts`).
- El lcov puede ser real y barato: en el repo temporal, un `.mjs` con dos ramas
  y un test que solo recorre una, con `node --test --experimental-test-coverage
  --test-reporter=lcov --test-reporter-destination=lcov.info`. Lo genera el
  fixture, no producción, así que no choca con «sin ejecutar tests por su
  cuenta». ~1 s por test. Un lcov a mano solo como complemento para formas raras.

## Plan de pruebas, cada una con su mutacion

- Merge base, no punta de la base: la rama cambia `a.mjs` y después `develop`
  cambia `b.mjs`; en la petición no sale ninguna línea de `b.mjs`. Mutación: el
  rango `${base}..HEAD` que usa hoy `diffParaRevision` (`src/fs/git.ts:309`) en
  vez de la merge base / `base...HEAD`.
- `excluir_de_revision`: un `dist/x.js` cambiado y sin cubrir no aparece; con
  `excluir_de_revision: []` sí. Mutación: no pasar los pathspecs
  `:(exclude,glob)` al diff de líneas.
- Números de línea exactos: el lcov real marca la rama no recorrida con
  `DA:n,0`; la petición nombra `a.mjs:n` exacto (y su rango) y NO la línea
  cubierta vecina. Mutación: desplazar ±1 al parsear `@@ -a,b +c,d @@`, o leer
  el lado `-`.
- No ejecuta tests: con `comando_verificacion` apuntando a un script que crea un
  fichero testigo, `review` termina sin que el testigo exista. Mutación: invocar
  el comando para regenerar el lcov.
- Puerta de `finish` con umbral: por encima, código ≠ 0, `develop` no avanza y
  la tarea no se mueve (patrón de `finish-verificacion.test.ts:68`); en el valor
  EXACTO del umbral, lo que se decida; sin la clave, cierra igual que hoy.
  Mutación: `>` por `>=`, o ignorar la clave.
- Config: la clave nueva es conocida, `null`/ausente por defecto, y un valor
  inválido aborta (patrón de `finish-heldout.test.ts:123`). Mutación: quitarla
  de las claves conocidas (pasaría a «avisa y se ignora»).

## Aserciones trampa que hay que evitar en esta tarea concreta

- «La petición contiene `a.mjs`»: pasa también si se listan TODAS las líneas o
  las cubiertas. Aseverar la línea exacta y la ausencia de la vecina cubierta.
- Lcov a mano con `SF:` relativo y `/`: un `SF:` absoluto con `\` de Windows
  (el formato real del reporter) nunca casaría con la ruta del diff y el test
  seguiría verde. Por eso el lcov tiene que ser real.
- Probar la merge base sin que la base avance tras crear la rama: `base..HEAD`
  y la merge base dan lo mismo y la prueba no discrimina.
- En `finish`, aseverar solo el código de salida: comprobar además que
  `develop` no se movió.

## Que pruebas existentes cambian de expectativa

- Con la clave ausente, ninguna. `review-exclusion.test.ts` (110-177) y
  `finish-verificacion.test.ts` quedan de red de regresión. Si la sección nueva
  aparece SIEMPRE (p. ej. «sin informe de cobertura»), revisar las aserciones de
  ausencia de secciones de `review-exclusion.test.ts:132` (no verificado línea a
  línea).
- Riesgo de relajar sin decirlo: añadir `--sin-verificacion` o apagar la puerta
  en los fixtures para que pasen los tests de `finish` es una regresión con
  permiso.

## Como envejece

- Duplicación del cálculo del rango: `review` usa `base..HEAD` (y en la ronda
  incremental `commit..HEAD`, `review.ts:463-480`) y esto necesita la merge
  base; si cada uno calcula el suyo, divergen como ya pasó con los globs
  (comentario en `git.ts:296`). Un test que compare los ficheros del diff con
  los de las líneas cambiadas fija la coherencia.
- El formato del reporter lcov de Node puede cambiar (DA para líneas no
  ejecutables, rutas): un test con lcov generado en vivo lo detecta en CI; uno a
  mano, nunca.

Desacuerdos previstos:
- Con arquitectura: si la puerta de `finish` lee el lcov ANTES de ejecutar
  `comando_verificacion`, compara contra un informe viejo. Hace falta un test
  donde la verificación reescriba el lcov y la puerta use el nuevo.
- Con riesgos: un lcov desfasado respecto a HEAD no se cubre de forma fiable sin
  una huella (mtime, sha); o se diseña la huella o se acepta como no cubierto.

Suposiciones no verificadas:
- Que el reporter `lcov` de Node 22 escribe `SF:` absoluto y, en Windows, con
  `\`: generar uno y mirarlo.
- La semántica de un fichero cambiado que no está en el lcov, o de una línea sin
  `DA` (comentario, blanco): es de dominio; los tests aseveran la que se fije.
- Dogfooding: `tsconfig.json` tiene `sourceMap: false` y los tests corren sobre
  `dist/`, que está excluido: contra este repo el freno no vería las líneas de
  `src/*.ts`. Confirmar si entra en el alcance.
