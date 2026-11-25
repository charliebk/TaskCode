# Informe de revision — TASK-167b (ronda 2)

- Commit revisado: 09ddcf327b6311781c53b6aa2682907c993d9387 (HEAD del clon: d9d8383, que solo anade ficheros de `tareas/`; el codigo es identico)
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:51 | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts:41 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts:294 | plan |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:67 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:14 | implementacion |
| MEN-4 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts:92 | implementacion |
| MEN-5 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts:94 | implementacion |

MEN-4 y MEN-5 son las notas M8 (rama de Python por cabecera sin test) y M9 (corte por `;` sin llave sin test) de esta ronda, pasadas a la tabla por el coordinador para que `verificar-menores` cubra su correccion (9c9b7d3: dos asserts; las dos mutaciones en rojo). El revisor las veia IMPORTANTE por la skill; quedan como MENOR porque son protecciones de borde sin efecto medido en el diff real y la correccion es solo de tests.

No hay hallazgos nuevos CRITICO ni IMPORTANTE que el diff de esta ronda rompa. Las notas de abajo no van en la tabla (regla de la ronda).

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Verificacion de cada hallazgo (reproduccion)

Puerta: la verificacion de la ronda (`node scripts/verificar-impacto.mjs` sobre 09ddcf3) sale con codigo 0: 1919 tests, 1916 pass, 0 fail, 3 skipped. La cito, no la repito. Por mi cuenta, en un clon nuevo en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-167b-r2`: `npm install`, `npx tsc -p .` sin errores, y `node --test` de los tres ficheros afectados: 14 pass, 0 fail.

### IMP-1 — corte del cuerpo: CORREGIDO
- Los cuatro casos de la ronda 1 dan ahora el cuerpo esperado (script sobre `dist/src/core/duplicados-cuerpo.js`): flecha de una linea seguida de una funcion de 15 lineas -> 1 linea (antes 19); flecha de dos lineas sin llave -> 2; `def` de Python con firma multilinea -> 4 (cabecera incluida); `def g(a): return a` seguido de `def h` -> 1.
- Caso real: `duplicadosDeRonda('origin/develop', <diff de la rama, .ts sin dist ni tareas>, clon, ['**/dist/**','tareas/**'])` devuelve **0 pares**. En la ronda 1 devolvia dos falsos pares (`misma ~ comparables` 93 %, `comparables ~ duplicadosPorCuerpo` 87 %).
- Los tests de `cuerpoDesde` cubren estos casos (test "el cuerpo se corta..."), y la mutacion M6 (quitar el corte por sangria sin llave) pone un test en rojo.

### IMP-2 — umbral y teja sin test: CORREGIDO
Mutaciones sobre `dist/src/core/duplicados-cuerpo.js`, restauradas tras cada una (`restaurado: true`), con `node --test dist/test/core/duplicados-cuerpo.test.js`:
- M1 `UMBRAL_PARECIDO 0.85 -> 0.3`: 1 pass / **1 fail**.
- M2 `UMBRAL_PARECIDO 0.85 -> 0.6`: 1 pass / **1 fail**.
- M3 `UMBRAL_PARECIDO 0.85 -> 0.05`: 1 pass / **1 fail**.
- M4 `TEJA 4 -> 1`: 1 pass / **1 fail**.
Las cuatro ya no sobreviven; el par "mismo esqueleto, logica distinta" (ESQUELETO) es el que las delata.

### MEN-1 — un `git show` por fichero: CORREGIDO
- `ficherosEnRef` lee todos los ficheros de un ref con un solo `git cat-file --batch`; `duplicadosDeRonda` llama dos veces (HEAD y base), no una por fichero.
- Tiempo sobre el diff real de la rama (7 ficheros): 2.1 s (la ronda 1 medio 19.4 s para un diff de dos ficheros). Ver nota N-3 sobre el tope de tamano que se quito.
- Tests de `ficherosEnRef` (git-crudo-comun.test.ts): mutaciones M10 (salto tras el contenido sin el LF final `tam + 1 -> tam`), M11 (los `missing` no se saltan) y M12 (los arboles se aceptan como ficheros): en las tres, 5 pass / **1 fail**.

### MEN-2 — llaves escapadas en regex: CORREGIDO
- `.replace(/\\[{}()[\]]/g, '')` antes de contar llaves y parentesis. Con el caso de la ronda 1 (`/\{/` dentro de una funcion) el cuerpo sale en 3 lineas.
- Mutacion M7 (quitar ese replace): 1 pass / **1 fail**.

### MEN-3 — helpers duplicados: CORREGIDO
- `loc` se define una sola vez (`src/core/candidatos-4d.ts:277`, exportada) y `duplicados-cuerpo.ts` la importa. `extension` se importa de `src/core/cobertura-cambios.ts:44`; ya no hay copia local en `review.ts`.

## Notas (fuera de la tabla, por la regla de la ronda; para quien decide)

- N-1 (test gap, criterio IMPORTANTE de la skill, impacto real acotado): dos protecciones nuevas no tienen test que las ponga en rojo.
  - M8: quitar la rama de Python por cabecera `:` (`if (/:\s*(#.*)?$/.test(l))`) deja los 2 tests en verde. Ese test de Python (`sumar`) tambien lo resuelve la regla de sangria generica. Sin la rama, un cuerpo de Python con una linea que acaba en `,` (p. ej. `return x,` seguido de mas lineas de la funcion) se corta ahi (razonado sobre el codigo, no ejecutado sobre la mutacion).
  - M9: quitar el corte por `;` o `,` al final de linea sin llave (`if (/[;,]\s*$/.test(limpia)) break;`) deja los tests en verde: los casos de flecha de los tests terminan igual por la regla de sangria. Solo decide cuando la linea siguiente va mas indentada.
  - Sugerencia: un test de Python con `return x,` seguido de `y = 2` en la misma funcion (debe dar 4 lineas) y un test de flecha `=> a + 1;` seguida de una linea mas indentada (debe dar 1). Es un cambio de dos asserts.
- N-2 (edge no regresion, no reproducido en el diff): una definicion sin llave cuya linea contiene una clase de caracteres con parentesis, p. ej. `const p = (s) => /[(]/.test(s);` seguida de una funcion, no corta: `[` y `(` suman parentesis y el corte por sangria no se aplica. Obtenido 4 lineas, esperado 1. La ronda 1 leia aun mas lineas en este caso, asi que no es regresion; es el caso que queda fuera de la correccion.
- N-3 (cambio de comportamiento, no reproducido): al quitar el tope `MAX_FICHEROS_CUERPO = 400`, todos los ficheros de las extensiones del diff van en un solo `cat-file`. `gitCrudo` aplica un `maxBuffer` de 512 MB; si la salida lo supera, `ficherosEnRef` devuelve null y `duplicadosDeRonda` devuelve `[]` sin avisar (el catch lo traga). Antes la cobertura era parcial pero visible como tope. Solo afecta a bases de miles de ficheros grandes; no lo he forzado.

## Regla 4D

- Duplicacion: cumple (MEN-3 corregido; no aparecen helpers nuevos copiados).
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: cumple con la nota N-1: IMP-2 corregido; quedan dos protecciones sin test que las mutaciones M8 y M9 dejan pasar.

## Lecturas fuera del contexto permitido

- `src/core/candidatos-4d.ts` y `src/core/cobertura-cambios.ts` (solo las lineas de `export const loc` y `export function extension`): para confirmar MEN-3.
- `src/fs/git-crudo.ts` (firma de `gitCrudo`, `maxBuffer`): para la nota N-3.
- Informe previo ya presente en esta carpeta (plantilla vacia): se sobrescribe con este informe.
