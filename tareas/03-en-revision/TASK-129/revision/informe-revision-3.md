# Informe de revision — TASK-129 (ronda 3)

- Commit revisado: fc817709d4cc9c6332fdaad50b959cae0fab4d32
- Revisor: code-quality-reviewer (revision independiente, ronda 3, verificacion acotada a las correcciones de la ronda 2)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | implementacion |
| IMP-3 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | implementacion |

Sin hallazgos nuevos: la correccion de IMP-3 no abre ningun fallo CRITICO ni introduce regresion en los runners comprobados.

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

**IMP-3 — corregido.** Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-129-r3` sobre fc81770, compilado con `npm run build`. Casos con `contarTests` de `dist/` (salida de Maven monomodulo de 200 clases, 25483 bytes, total final `Tests run: 2000`; cola de 16 KiB):
- Maven monomodulo con `recortada: true`: `2000` (antes de la correccion daba `null`).
- Maven monomodulo sin opcion: `2000`.
- Maven multimodulo (con `Reactor Summary` al final) con `recortada: true`: `null`.
- Cargo con 5 crates y `recortada: true`: `null`.
- Cargo de 1 crate con `recortada: true`: `null` (conservador; ver Notas).

**IMP-2 — corregido, cableado cubierto.** `anotarSuite` (`src/commands/finish-verificacion.ts`) pasa `recortada: r.bytesTotales > Buffer.byteLength(r.cola, 'utf8')`. El test `anotarSuite (TASK-129, ronda 2)` de `test/core/crecimiento-suite.test.ts` anota `400` con la salida entera y `-` con la salida recortada, por el camino real de `anotarSuite` sobre un repo git temporal.
- Mutante M5 (quitar el paso de `recortada` en `anotarSuite`, `dist/src/commands/finish-verificacion.js`): 1 fallo, `anotarSuite (TASK-129, ronda 2) ...`. Rojo. En la ronda 2 este mutante sobrevivia; ahora lo caza el test.
- Mutante M6 (quitar la condicion `Reactor Summary` en `contarTests`, `dist/src/core/crecimiento-suite.js`, dejando `return opciones.recortada === true ? null : maven;`): 1 fallo, `contarTests (TASK-129, IMP-2): con la salida recortada, cargo y Maven no dan cifra ...` (la aserción de Maven monomodulo `15` da `null`). Rojo.
- Los dos ficheros restaurados tras cada mutante y comprobados con `cmp`.

**IMP-1 — corregido (sin cambios en esta ronda).** `anotarSuite` se llama en `finish-verificacion.ts` (lineas 354 y 645) y en `verificar-lote.ts` (linea 147). El diff de la ronda no toca estos ficheros; el resultado de la ronda 2 (M1 a M3) sigue valiendo.

**Comprobacion de regresion del reordenado.** En `contarTests` el chequeo `recortada && pytestFinal === null` pasa despues del bloque de Maven. Se comprobo que cargo (sin `Tests run:`) sigue cayendo en ese chequeo, y que node, Jest, dotnet y pytest no cambian: sus ramas van antes del bloque de Maven.

## Verificacion hecha

- Clon fresco en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-129-r3`, rama `revision-r3` fijada en fc817709. `npm install` y `npm run build` sin errores.
- Tests pedidos: `node --test dist/test/core/crecimiento-suite.test.js dist/test/commands/finish-verificacion.test.js`: 18 tests, 18 pases, 0 fallos, salida 0.
- Verificacion de la ronda: la de la peticion (`node scripts/verificar-impacto.mjs`, 967 tests, 0 fallos, sobre fc817709). Citada, no repetida.
- Mutantes M5 y M6 sobre `dist/`: ambos en rojo, detallados arriba.
- Casos de Maven y cargo con `contarTests` sobre `dist/`: ver Reproduccion.
- No se ha ejecutado `taskctl` ni ningun git que escriba en el repo real. El clon se ha borrado al terminar.

## Notas (fuera de la tabla)

- MENOR: `docs/configuracion.md` y el comentario de `contarTests` dicen que cargo no da cifra "con varios crates". Un cargo de un solo crate recortado tambien da `null`, que es el comportamiento conservador ya conocido de la ronda 2. Es coherente con la regla, solo que la documentacion no lo dice; no bloquea.
- Limitacion de la verificacion: la deteccion de Maven multimodulo se apoya en que Maven imprime `Reactor Summary` al final de un build multimodulo. No se ha ejecutado Maven real; los casos son salidas de muestra escritas a mano con ese formato.
- Edge de diseno, no nuevo: si un Maven monomodulo recortado no llegara a imprimir su `Results:` final (por ejemplo, un crash del fork de surefire), el ultimo `Tests run:` visible seria una cifra parcial. Con la salida entera ya pasa lo mismo; la correccion no lo agrava.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts`: solo con grep, para localizar las llamadas a `anotarSuite` y la linea del cableado de `recortada` (IMP-1 e IMP-2).
- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts`: solo con grep, para la llamada a `anotarSuite` (IMP-1, tercer camino).
