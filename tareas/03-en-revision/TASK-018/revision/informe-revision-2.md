# Informe de revision — TASK-018 (ronda 2)

- Commit revisado: 2bc13dc0b2777cf4842b87a088830deca592ac93 (HEAD de
  `feature/task-018-enrutado-de-revisor-por-diff-real-fragme`)
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Metodologia seguida

Clon nuevo del repo (no el working tree de nadie) en un directorio temporal
propio (`C:\temp_review\t018_r2`), `git checkout 2bc13dc` (HEAD), `npm
install` + `npm run build` + `npm test` desde cero en
`taskcode-marketplace/plugins/taskcode-plugin`. Soy independiente de la
implementacion y de la ronda 1: no he leido ningun working tree previo, solo
el repo tal y como esta commiteado.

Nota sobre el commit: `2bc13dc` (`chore(TASK-018): peticion de revision
ronda 2`) solo anade `revision/peticion-revision-2.md` y el scaffold de este
informe — verificado con `git show --stat 2bc13dc` (2 ficheros, ambos bajo
`tareas/.../revision/`, 0 cambios en `src/`/`test/`). El codigo y los tests
bajo revision son exactamente los de `375a929`, el commit que cerro la
ronda 1. Todo lo que sigue se ejecuto sobre ese estado de codigo.

### Puerta determinista

- **Build**: `npx tsc -p tsconfig.json` — limpio, sin errores, en el clon
  nuevo y de nuevo tras cada mutacion (recompilando antes de cada `node
  --test` sobre `dist/`).
- **Linter**: no hay script `lint` en `package.json` de este proyecto (igual
  que confirmo la ronda 1) — no aplica.
- **Suite completa**: `npm test` → **855 tests, 852 pass, 3 fail**. Confirme
  el detalle de los 3 rojos, no solo el recuento, y son exactamente los tres
  conocidos de Windows documentados en `CLAUDE.md` del repo:
  - `not ok 119` — `taskctl approve: propaga cualquier error de stat que NO
    sea ENOENT...` → `EPERM: operation not permitted, symlink` (el truco del
    symlink en Windows).
  - `not ok 270` — `taskctl plan: propaga cualquier error de escritura que
    NO sea EEXIST...` → `Missing expected rejection` (un `chmod`/permiso que
    en NTFS no restringe nada).
  - `not ok 276` — `taskctl plan: la rama base real tiene la tarea en un
    estado distinto...` → diferencia `\r\n` vs `\n` (CRLF).

  Ningun otro rojo. La puerta pasa.

## Confirmacion de los 4 hallazgos de la ronda 1 (no doy nada por bueno sin reproducirlo)

### IMPORTANTE-1 (numeracion de ronda fragmentada) — corregido, confirmado con contraprueba

- Revert en mi clon: sustitui `RONDA_FILE_RE` en `src/commands/review.ts`
  (linea 69) por `/^(?:peticion|informe)-revision-(\d+)\.md$/` (sin el
  grupo opcional de sufijo) y `INFORME_REVISION_RE` en
  `src/commands/finish.ts` (linea 75) por
  `/^informe-revision-(\d+)\.md$/`, mismo patron.
- `npx tsc -p tsconfig.json` compila limpio (ningun tipo lo detecta, como ya
  senalaba la ronda 1).
- `node --test dist/test/commands/review.test.js`: **16 pass, 1 fail**. El
  unico rojo es exactamente el nuevo test de esta ronda,
  `"taskctl review: una segunda ronda numera -2 CON sufijo de dominio tras
  una ronda 1 fragmentada (hallazgo IMPORTANTE-1 de revision, TASK-018)"`.
  El fallo real no es un simple `assert.equal(result.ronda, 2)` fallido con
  `1` — es una excepcion de `runReviewCommand` (`[ERROR] TASK-625: ya existe
  un fichero de la ronda 1 en .../revision (¿restos con otro case en un
  filesystem case-insensitive?)`), porque al no reconocer los ficheros con
  sufijo de la ronda 1 como "ronda 1", `siguienteRonda` intenta escribir de
  nuevo en la ronda 1 y choca con los que ya existen. Confirma lo mismo que
  pedia la ronda 1 por otra via: sin el reconocimiento del sufijo, el
  esquema se rompe de forma visible (aqui como excepcion; en el peor caso
  descrito por la ronda 1, como numeracion incorrecta silenciosa).
- Revert de las dos lineas (`git checkout -- src/commands/review.ts
  src/commands/finish.ts`), recompilado, `node --test
  dist/test/commands/review.test.js` → **17 pass, 0 fail**. Confirmado que
  el codigo real (sin mutar) protege el caso.

### IMPORTANTE-2 (mensaje de `taskctl review` con N peticiones) — corregido, confirmado con contraprueba

- Revert en mi clon: en `src/cli.ts`, sustitui el `.map(...).join('')` sobre
  `result.informes` por la version de un solo par
  (`const primerGrupo = result.informes[0]!;` seguido de una sola linea de
  `Peticion de revision`/`Lanza ese agente`, sin iterar el resto).
- `npx tsc -p tsconfig.json` compila limpio tras anadir el `!` que exige el
  modo estricto (el propio `result.informes[0]` sin asercion ya marca error
  de tipos — nota aparte: es una señal a favor del cambio real, que si
  itera con `.map` y no indexa a mano).
- `node --test dist/test/cli/main.test.js`: **9 pass, 1 fail**. El unico
  rojo es exactamente el nuevo test de esta ronda, `main: "taskctl review"
  con un diff de 2 dominios imprime una linea de peticion por revisor
  (hallazgo IMPORTANTE-2 de revision, TASK-018)`. Confirma que el test
  ejercita de verdad el mensaje completo del CLI (las 3 lineas de peticion,
  no solo la primera) y se pone rojo si alguien vuelve a la version
  antigua de un solo par.
- Verifique ademas que el test invoca el **CLI real**, no una funcion
  interna: `bin/taskctl` es un wrapper de una linea
  (`(await import('../dist/src/cli.js')).main(process.argv.slice(2))`), y
  `main.test.ts` llama exactamente a esa misma funcion exportada
  (`main(['review', 'TASK-001'])`) via `captureOutput`, con un repo Git
  temporal real (`new -> plan -> approve -> start -> review`) y ficheros
  Java + Angular reales en disco — el mismo codigo de parseo de argumentos
  y ensamblado de `lineasInformes` que corre `taskctl review` desde una
  terminal, sin doble de por medio.
- Revert de `cli.ts`, recompilado, `node --test dist/test/cli/main.test.js`
  → **10 pass, 0 fail**.

### MENOR-1 (comentario sobre renombrado entre ecosistemas) — documentacion suficiente

El comentario anadido en `src/core/revisores.ts` (junto a
`clasificarPorDominio`) dice, en sustancia: que el brainstorm de riesgos
propuso clasificar por ambas rutas de un rename y mandar al generico si
discrepan; que se evaluo y se descarto (citando explicitamente "hallazgo
MENOR de revision por pares, ronda 1", asi que el proximo lector lo
encuentra sin tener que releer el informe de la ronda 1); el motivo tecnico
concreto (`diffNameOnly` usa `--name-only`, que colapsa el rename a la ruta
final, y la funcion clasifica por esa unica ruta); y la justificacion (no
se pierde informacion — el fichero se revisa completo bajo el dominio de su
ruta final — y es mas simple que la propuesta original).

Lo juzgo suficiente: nombra la propuesta original, el estado (evaluado y
descartado, no pendiente), el motivo tecnico y por que se considera
aceptable, con referencia trazable a de donde viene la decision. Es
exactamente lo que la propia ronda 1 pedia ("anadir una nota... dejando
constancia de que la mitigacion se evaluo y se descarto"). No repite la
reproduccion completa del rename (crear `Bar.java`, `git mv` a `Bar.cs`,
etc.) que si hizo la ronda 1 en su informe, pero un comentario de codigo no
tiene que cargar con eso — el informe de la ronda 1 (que el comentario cita
por nombre) es donde vive esa reproduccion. No lo considero un hallazgo
nuevo.

### MENOR-2 (`peticionTemplate` con 10 parametros posicionales) — sigue documentado, no repetido

La peticion de esta ronda es explicita en que MENOR-2 se deja sin corregir
y que no hace falta repetirlo aqui porque ya queda documentado en
`informe-revision-1.md`. Confirmado: sigue en `informe-revision-1.md` con
su motivo (mantenibilidad, no comportamiento) y no hay ninguna regresion
relacionada en el diff de esta ronda (`peticionTemplate` no se toco entre
`b992da8` y `375a929`). No es un hallazgo pendiente de esta ronda.

## Que mas revise (con ojos frescos, mas alla de los 4 puntos)

- **El diff completo desde la ronda 1 es exactamente el que describe la
  peticion**: `git diff b992da8..375a929 --stat -- src test` da 3 ficheros
  (`src/core/revisores.ts`, `test/cli/main.test.ts`,
  `test/commands/review.test.ts`), 149 inserciones/1 borrado — coincide
  con el resumen y con el bloque de diff pegado en
  `peticion-revision-2.md`. No hay cambios de codigo o test fuera de lo
  mostrado.
- **El commit HEAD (`2bc13dc`) no toca codigo**: confirmado con `git show
  --stat 2bc13dc` (solo los dos ficheros de `revision/` de esta ronda).
- El nuevo test de `review.test.ts` (IMPORTANTE-1) dejaba adrede "restos"
  de una ronda 1 YA fragmentada (dos pares peticion/informe con sufijo de
  dominio) antes de invocar `runReviewCommand`; revise que el fixture usa
  `setupTaskEnCursoSoloTarea` + escritura manual de los 4 ficheros de
  revision + `advanceDevelop`, un patron ya usado en otros tests de este
  fichero — no encontre ninguna trampa en el montaje (p. ej. un directorio
  que no se llegue a crear, o una ruta que no coincida con la que
  `runReviewCommand` espera).
- El test de `main.test.ts` (IMPORTANTE-2) reusa las mismas rutas de
  fichero que `test/skills/revisores.test.ts` para Java/Angular, tal y
  como dice su propio comentario, evitando una segunda tabla
  ruta→dominio que pudiera divergir — lo confirme leyendo ambos ficheros.
- No repeti las mutaciones de `finish.ts` (`.every()`/`.some()`) ni la del
  umbral (`revisores.ts`, `>` vs `>=`) que la ronda 1 ya hizo con detalle
  (ningun cambio de esta ronda toca esas lineas), ni el recorrido completo
  del CLI real con `finish` en los tres casos borde (informe en blanco,
  uno pendiente y otro aprobado, esquema sin fragmentar) — la ronda 1 los
  cubrio con reproduccion propia y el diff de esta ronda no toca ese
  codigo.

## Hallazgos

Sin hallazgos nuevos. Los 4 de la ronda 1 quedan verificados por mi propia
reproduccion (no solo leidos en la peticion): los 2 IMPORTANTE tienen ahora
un test que se pone rojo con la contraprueba exacta que pedia la ronda 1
(confirmado mutando y revirtiendo yo mismo, no solo leyendo el test nuevo),
el MENOR-1 tiene una nota de decision que considero suficiente, y el
MENOR-2 sigue documentado sin repetirse. La puerta determinista pasa (852
pass / 3 fail conocidos de Windows, ningun otro rojo) y el diff de esta
ronda coincide exactamente con lo que describe la peticion.

## Resumen

Ronda 2 confirma, con reproduccion propia y no por lectura, que las dos
correcciones IMPORTANTE de la ronda 1 estan implementadas y protegidas por
un test que falla si se revierten — la contraprueba exacta que la ronda 1
exigia y que en la ronda 1 misma no existia todavia. El MENOR-1 quedo
documentado con una nota de decision clara y trazable a la ronda anterior.
El MENOR-2 sigue abierto como nota de mantenibilidad, sin bloquear. No
encontre perdida de datos, corrupcion de estado, ni ningun comportamiento
que contradiga lo que el comando dice hacer.
