# Informe de revision — TASK-167b (ronda 1)

- Commit revisado: e3f53d539da82c9cb5217bc7878aee9b609fca8e
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:217 | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts:41 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:1409 | plan |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:233 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:1403 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Puerta determinista: la peticion trae la verificacion de la ronda en verde (`node scripts/verificar-impacto.mjs`, 1604 tests, 0 fallos, 2 omitidos) con `Commit verificado` = `Commit revisado` (e3f53d5); la cito y no la repito. Por mi cuenta: clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-167b-r1`, `npm install`, `npx tsc -p .` (sin errores) y `node --test` de los dos ficheros de la tarea: 8/8 en verde. No hay linter propio del proyecto mas alla de `tsc` (no lo he buscado fuera de esa puerta).

### Respuesta a la sospecha del coordinador (`misma` ~ `comparables`, 93 %)

CONFIRMADA. `misma` (duplicados-cuerpo.ts:123) y `comparables` (:125) son dos flechas de una linea sin llaves y su "cuerpo" no es suyo: `cuerpoDesde` ejecutado sobre el fichero real da 25 lineas / 304 tokens para `misma`, 23 lineas / 267 tokens para `comparables` y 16 lineas / 230 para `duplicadosPorCuerpo`. Como la primera linea no tiene `{` ni termina en `:`, entra en la rama de llaves, no cierra nunca en esa linea y sigue leyendo (flecha siguiente, comentario JSDoc y toda la funcion `duplicadosPorCuerpo` hasta su `}`). Las dos "copias" son el resto del fichero solapado (por eso 93 % y 87 %), no logica duplicada. Es falso positivo del propio detector sobre el propio diff.

### IMPORTANTE-1 (IMP-1) — `cuerpoDesde` desborda el cuerpo cuando la definicion no abre llave en su primera linea: falsos positivos reales
- Donde: taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:217 (rama de Python) y :227-243 (rama de llaves)
- Que pasa: el cuerpo solo se acota bien si la primera linea trae `{` o termina en `:`. Cuatro casos de uso normal quedan sin acotar y leen hasta 200 lineas o hasta el primer bloque `{...}` que aparezca despues:
  1. Flecha de una linea sin llaves (`const f = (x) => x + 1;`), muy comun en TS y ademas patron que `candidatos-4d` extrae como definicion.
  2. Flecha de dos lineas sin llaves (`=>` al final de la primera).
  3. `def` de Python con firma en varias lineas (la primera linea acaba en `,` o `(`, no en `:`).
  4. `def f(a): return a` de una linea (no acaba en `:`).
- Reproduccion: en el clon, sobre `dist/src/core/duplicados-cuerpo.js` (`cuerpoDesde` + `tokensNormalizados`):
  - Fichero real `src/core/duplicados-cuerpo.ts`: `misma` -> 25 lineas / 304 tokens; `comparables` -> 23 / 267.
  - `duplicadosDeRonda` (export de `review.ts`) sobre el diff real `origin/develop..HEAD` (solo `.ts`, excluyendo `dist` y `tareas`) devuelve exactamente esos 2 pares: `misma ~ comparables 93 %` y `comparables ~ duplicadosPorCuerpo 87 %`. Cero pares verdaderos.
  - Sintetico: una flecha de 1 linea seguida de una funcion de 15 lineas -> 19 lineas / 323 tokens; `def f(a,\n b):` seguido de otras funciones -> el cuerpo incluye las demas; `const h = (x: number) =>\n x + 1;` -> 6 lineas / 28 tokens (arrastra la funcion siguiente).
- Impacto: cada `taskctl review` de una tarea que anada dos helpers de una linea en el mismo fichero (patron habitual) publica un aviso falso ("N definicion(es) nueva(s) casi identica(s)") y lo copia a `## Candidatos 4D`: ruido que el revisor tiene que descartar y que erosiona la fiabilidad del aviso. Es la forma mas probable de falso positivo del detector y el criterio 2 pide justo que no de por duplicadas funciones distintas. Efecto contrario posible: dos copias reales de una funcion de una linea seguida de codigo distinto se diluyen y no pasan el umbral.
- Sugerencia: acotar el cuerpo por la propia definicion, no por "la proxima llave": si la primera linea (sin comentarios ni cadenas) cierra su sentencia (parentesis equilibrados y termina en `;` o sin `{` ni `=>` pendiente), el cuerpo es esa linea; para `=>` sin llave, hasta la linea que cierra la sentencia; para Python, seguir leyendo mientras los parentesis de la firma no esten cerrados y despues aplicar la regla de sangria (la rama de `:`). Cortar tambien en la siguiente definicion (`PATRONES_DEFINICION`). Anadir tests con una flecha de una linea seguida de una funcion grande y con un `def` de firma multilinea.

### IMPORTANTE-2 (IMP-2) — el umbral y el tamano de teja no estan protegidos por ningun test (disfraz de test)
- Donde: taskcode-marketplace/plugins/taskcode-plugin/test/core/duplicados-cuerpo.test.ts:41-56 (contra src/core/duplicados-cuerpo.ts:187 y :193)
- Que pasa: el criterio 2 exige "un test falla si ... da por duplicadas dos funciones distintas". El unico par "distinto" (`DISTINTA` frente a `ORIGINAL`/`COPIA`) esta tan lejos que sale por debajo de 0.3, asi que el test no discrimina el umbral. Con `UMBRAL_PARECIDO` en 0.3, 0.6 o 0.05 los tests siguen en verde; con `TEJA = 1` tambien.
- Reproduccion (mutacion en el clon, `tsc` + `node --test` de los dos ficheros de test, restaurando con `git checkout -- <fichero>` tras cada una):
  - `UMBRAL_PARECIDO = 0.85 -> 0.3`: 8 pass / 0 fail (sobrevive).
  - `UMBRAL_PARECIDO -> 0.6` y `-> 0.05` (solo `duplicados-cuerpo.test.js`): 2 pass / 0 fail (sobreviven).
  - `TEJA = 4 -> 1`: 8 pass / 0 fail (sobrevive).
  - `comparables` anulado (`|| !comparables(...)` fuera): 8 pass / 0 fail (sobrevive; es una poda de coste, pero tampoco hay test que lo fije).
- Impacto: el parametro que decide cuantos falsos positivos habra en produccion puede cambiar de 0.85 a 0.05 sin que ningun test lo note; el criterio 2 queda cubierto solo por el caso trivial (copia exacta si / funcion totalmente distinta no).
- Sugerencia: un par "mismo esqueleto, logica distinta" (mismo numero de lineas y mismos operadores pero otra secuencia de tokens, con Jaccard medido, p. ej. entre 0.4 y 0.7) que debe NO salir, y un par copia con 1-2 lineas cambiadas que debe salir con parecido entre 0.85 y 0.95; asi quedan acotados umbral y teja por ambos lados.

### MENOR-1 (MEN-1) — coste de `taskctl review` y tope de ficheros que corta en silencio
- Donde: taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:1409 y :1431-1441
- Que pasa: el lector hace un `git show <base>:<fichero>` (un proceso) por cada fichero con definiciones de las extensiones del diff, hasta `MAX_FICHEROS_CUERPO = 400`. En Windows cada `git show` cuesta ~94 ms (10 en 0.94 s). Ademas, al pasar de 400 ficheros el resto se descarta sin avisar y por orden de `git grep` (alfabetico), no por relevancia.
- Reproduccion: `duplicadosDeRonda('origin/develop', <diff real>, <clon>, ['**/dist/**','tareas/**'])`: 19.4 s para un diff de dos ficheros (con `excluir = []`: 37.0 s). El propio repo tiene 416 ficheros `.ts` con definiciones en `origin/develop` (sin `dist`): 16 nunca se comparan. Con un diff enorme (cuatro MB, todo el historico) 46 s y 3763 pares (ruido).
- Impacto: ~20 s mas en cada `taskctl review` con diff de codigo en este repo, que es lo que la ley de agilidad del proyecto penaliza; y en repos mayores, una cobertura parcial que nadie ve. El plan lo acepto como riesgo ("tope de ficheros e indice"), por eso MENOR; pero el aviso no dice que fue parcial.
- Sugerencia: leer los ficheros en una sola llamada (`git cat-file --batch`) o comparar solo los ficheros de la base que tengan una definicion con tamano parecido; si se aplica el tope, decir en el aviso "N ficheros no comparados". Si se decide aceptar el coste, anotarlo con el motivo.

### MENOR-2 (MEN-2) — `sinCadenas` no conoce los literales de expresion regular
- Donde: taskcode-marketplace/plugins/taskcode-plugin/src/core/duplicados-cuerpo.ts:233 y :247-249
- Que pasa: una llave dentro de una regex (`/\{/.test(x)`) desequilibra el contador y el cuerpo se pasa de su `}` real.
- Reproduccion: `cuerpoDesde(['function t() {','  return /\\{/.test(x);','}','const z=1;','const y=2;','function u(){','}'], 1)` devuelve 7 lineas (esperadas 3) y 32 tokens.
- Impacto: mismo efecto que IMP-1 pero en codigo con regex con llaves; poco frecuente. Si se corrige IMP-1 con un corte por "siguiente definicion", queda acotado.
- Sugerencia: aceptar con motivo (heuristica sin parser, decision del plan) o cortar el cuerpo tambien en la siguiente definicion.

### MENOR-3 (MEN-3) — dos helpers copiados que ya existian
- Donde: taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:1403 y src/core/duplicados-cuerpo.ts:321
- Que pasa: `extension` en `duplicadosDeRonda` reimplementa `extension` de `src/core/cobertura-cambios.ts:44` (exportada); `loc` de `seccionDuplicadosPorCuerpo` es copia literal de `loc` de `src/core/candidatos-4d.ts:276` (no exportada). Son los candidatos "por nombre" que el propio `review` listo en la peticion.
- Reproduccion: lectura de las tres definiciones; `extension` da el mismo resultado en `x.ts`, `.bashrc` y `a.`; `loc` produce el mismo texto.
- Impacto: el dia que cambie el formato de una localizacion (`nombre (fichero:linea)`) habra dos listas dentro del mismo `## Candidatos 4D` con formatos distintos; con `extension`, hoy no hay diferencia observable.
- Sugerencia: exportar `loc` desde `candidatos-4d.ts` y reutilizarla; importar `extension` de `cobertura-cambios.ts`.

## Regla 4D

- Duplicacion: MEN-3 (helpers `extension` y `loc` copiados; los demas candidatos por nombre `Huella`/`huella` son un tipo y su funcion dentro del mismo modulo, y las `huella` de los tests de `finish` no tienen relacion)
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: IMP-2

## Lo que se ejecuto para llegar a estas conclusiones

- Verificacion de la ronda citada (verde, mismo commit que el revisado). Por mi cuenta: clon, `npm install`, `npx tsc -p .` (sin errores), `node --test dist/test/core/duplicados-cuerpo.test.js dist/test/commands/review-candidatos-4d.test.js`: 8 pass / 0 fail.
- Mutantes en el codigo nuevo (cada uno compilado y con los dos ficheros de test; restaurado despues):
  - Muertos: `MIN_TOKENS 30 -> 1` (1 fallo), quitar el guard `misma` (1 fallo), identificadores sin normalizar (2 fallos), cadenas sin sustituir (1 fallo), rama de Python anulada (1 fallo), `candidatos += seccionDuplicadosPorCuerpo(porCuerpo)` quitado (1 fallo), condicion `porCuerpo.length > 0` forzada a falsa (1 fallo), lector de `HEAD` cambiado por la rama base (1 fallo).
  - Supervivientes: umbral 0.3 / 0.6 / 0.05, `TEJA = 1`, quitar `comparables` (IMP-2).
- Detector con casos reales: flechas de una y dos lineas, `def` de Python de una linea y de firma multilinea, clase Python, funcion Rust, flecha con llave en la misma linea, template literal con llave, regex con llave (IMP-1, MEN-2). Coste en el propio repo (MEN-1).
- Pendiente de decision para quien corrija: la peticion dice que lo nuevo se lee "del arbol" y el codigo lee `HEAD` (`lector('HEAD')`): equivalente cuando el trabajo esta commiteado, que es el caso de `review`; no lo reporto como hallazgo.

## Lecturas fuera del contexto permitido

- src/core/candidatos-4d.ts (patrones de definicion y `loc`): para razonar que definiciones llegan al detector y confirmar MEN-3.
- src/core/cobertura-cambios.ts (`extension`): para confirmar la duplicacion de MEN-3.
- src/fs/git.ts (`definicionesEnRef`): para entender el coste de MEN-1.
