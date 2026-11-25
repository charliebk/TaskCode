# Informe de revision — TASK-168 (ronda 2)

- Commit revisado: c879a368c2e0b4c30a383aaeceeb2ebc3ddee689
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:318 | plan |
| MEN-1 | MENOR | corregido | scripts/verificar-impacto.mjs:321 | implementacion |
| MEN-2 | MENOR | corregido | test/scripts/verificar-impacto.test.ts:202 | implementacion |
| MEN-3 | MENOR | corregido | scripts/verificar-impacto.mjs:102 | implementacion |
| IMP-2 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:335 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Alcance y metodo. Puerta: la peticion trae la verificacion selectiva en verde para el commit revisado
(c879a36: `node scripts/verificar-impacto.mjs`, 732 tests, 0 fallos), asi que no repeti la suite
entera ni la seleccion completa. En un clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-168-r2`
(checkout de c879a36) hice `npm install`, `npx tsc -p .` (sin errores) y
`node --test dist/test/scripts/verificar-impacto.test.js`: 29 tests, 29 ok. Despues ejecute las mutaciones
y los casos de abajo, todo sobre el mismo clon. El clon se ha borrado al terminar.

Nota sobre la peticion: el comando de clonado indicado terminaba en ` .`, que git rechaza
(`fatal: Too many arguments`). Clone sin ese argumento; el resultado es el mismo.

### Verificacion de las correcciones de la ronda 1

- **IMP-1 (corregido, verificado).** Reproduccion: con la condicion nueva, la seleccion de
  `skills/plan/SKILL.md` y `skills/review/SKILL.md` pasa a 20 tests cada una (antes 116). El
  barrido de todos los `.ts`, `.mjs`, `.js` y `.md` del plugin, para las 13 carpetas de skill, compara
  la condicion anterior (texto crudo) con la nueva (`sinComentarios`): el unico fichero que pierde la
  mencion es `src/commands/review.ts` (solo la tenia en comentarios); ninguno la gana. No hay ningun
  test que deje de elegirse por la correccion.
- **MEN-1 (corregido, verificado).** Fixture nuevo `test/ruta-flujo.test.ts` con la forma
  `` `${process.cwd()}/flujo/SKILL.md` ``. Mutante: quitar `codigo.includes(\`${carpetaSkill}/${nombre}\`) ||`
  → `node --test --test-name-pattern "TASK-156|TASK-168"` pasa a 0 ok y 2 rojos (TASK-156 y TASK-168).
  La alternativa queda protegida.
- **MEN-2 (corregido).** El comentario del test de TASK-156 ahora dice «Los lectores de la carpeta, y
  quien nombra esta skill (su carpeta y SKILL.md)», que es cierto con el fixture `nombra-flujo.test.ts`.
- **MEN-3 (corregido).** La nota de TASK-168 entra en el JSDoc de TASK-156 de `CARPETAS_LEIDAS`; el
  `//` suelto desaparece y la constante vuelve a quedar documentada por su JSDoc.

Mutacion de la linea que el diff dice proteger (`const codigo = sinComentarios(texto);` → `const codigo = texto;`):
`node --test dist/test/scripts/verificar-impacto.test.js` → 27 ok, 2 rojos (TASK-156 y TASK-168). La
red de regresion existe. Script restaurado y verificado (linea 335 de nuevo intacta).

## IMP-2 — `sinComentarios` pierde menciones que estan dentro de cadenas (`/*` y `//`), y ya existe un helper que no las pierde

- Donde: scripts/verificar-impacto.mjs:335 (`loNombra`) y la funcion `sinComentarios` (linea ~119).
- Que pasa: la correccion introduce `sinComentarios`, que quita comentarios con dos expresiones
  regulares que no respetan cadenas. Dos formas de romperlo:
  1. Un `/*` dentro de una cadena (un glob como `'**/*.ts'`) abre un «comentario de bloque» que se cierra
     en el primer `*/` que aparezca despues en el fichero, aunque sea en otra linea o en otro bloque. Lo
     que queda dentro se borra, incluida una mencion real de la skill.
  2. Un `//` dentro de una cadena (`"x//y"`) recorta el resto de la linea, y con el la mencion.
  En ambos casos la mencion desaparece, `loNombra` devuelve falso y los tests que la leen no se eligen.
  Es la direccion peligrosa: un cambio en `skills/plan/SKILL.md` deja de ejecutar un test que deberia
  correr.
- Reproduccion (funcion extraida del fichero real, `sinComentarios` tal como esta en c879a36):
  - `const g = '**/*.ts';\nconst r = path.join(P, 'plan', 'SKILL.md');\n/** doc */\n` → la mencion
    `'plan'` + `SKILL.md` **no** se conserva (falso).
  - `const g = 'lib/*';\nconst r = path.join(P, 'plan', 'SKILL.md');\nconst z = 1; /* x */\n` → no se conserva (falso).
  - `const u = 'a' + "x//y"; const r = path.join(P, 'plan', 'SKILL.md');` → no se conserva (falso).
  - Con el helper que ya existe, `sinComentariosC` (`taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts:85`,
    compilado en `dist/src/core/doctor-deploy-reglas.js`), los tres casos **si** conservan la mencion, y
    el comentario real (`// SKILL.md de 'plan'`) se quita igualmente.
- Alcance real hoy: ninguno de los ficheros del plugin se ve afectado por la correccion salvo el
  esperado (`src/commands/review.ts`, IMP-1). Hay al menos 11 ficheros de test con `/*` dentro de
  cadenas, pero ninguno nombra hoy una carpeta de skill. Es un fallo latente que la correccion introduce
  y que el test nuevo no cubre: el fixture actual no tiene ni globs ni `//` en cadenas. Por eso sigue
  siendo IMPORTANTE (comportamiento incorrecto en un caso real, no de borde) y no CRITICO.
- Duplicacion (Regla 4D, candidato de la peticion): `sinComentarios` (scripts/verificar-impacto.mjs)
  reimplementa la misma decision que `sinComentariosC` (src/core/doctor-deploy-reglas.ts): «quitar
  comentarios de codigo JS/TS». Cuando las dos difieran, la del script es la que pierde. La copia nueva
  ademas es la peor de las dos (no respeta cadenas), que es exactamente el fallo de arriba.
- Sugerencia: reutilizar `sinComentariosC` si `scripts/verificar-impacto.mjs` puede importar el modulo
  compilado del plugin (el script ya compila el plugin antes de testear); si no es posible, llevar a
  `sinComentarios` la misma logica de cadenas. En ambos casos, anadir al fixture de
  `test/scripts/verificar-impacto.test.ts` un fichero con `'**/*.ts'` seguido de una mencion de
  `plan/SKILL.md`, y otro con `"x//y"` en la misma linea que la mencion, y comprobar que el test los elige.
- Clase de cambio: la correccion, no la rama base. No es un MENOR de estilo: abre ronda 3.

## Sin hallazgos en lo siguiente (que se ejecuto)

- Los 29 tests del fichero `verificar-impacto.test.js` pasan en el clon (incluidos TASK-156 y TASK-168).
- Ningun fichero del plugin pierde la mencion de una skill tras la correccion, salvo `src/commands/review.ts`
  (IMP-1, esperado). Comprobado por fichero, no por conteo de tests de cada skill.
- `taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts` no cambia su
  expectativa de «elegidos» de forma que oculte una regresion: `nombra-flujo.test.ts` y
  `ruta-flujo.test.ts` siguen eligiendose por SKILL.md de `flujo`.

## Regla 4D

- Duplicacion: incumple (IMP-2): `sinComentarios` reimplementa `sinComentariosC` con menos garantias.
- Desviacion: cumple (el diff toca solo la seleccion, sus fixtures y el comentario del test).
- Diluvio: cumple (dos expresiones regulares y una funcion; la correccion no anade capas).
- Disfraz: cumple con IMP-2 abierto: el test de la forma `carpeta/SKILL.md` discrimina (mutante caido),
  pero el de cadenas con `/*` o `//` no existe, y el test de la linea 335 solo protege la mutacion
  total de `sinComentarios`, no sus fallos de cadena.

## Lecturas fuera del contexto permitido

- taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts (lineas 78-100, funcion `sinComentariosC`):
  para contrastar el candidato 4D de la peticion (`sinComentarios` ~ `sinComentariosC`) y comprobar
  si el helper existente resuelve los casos de IMP-2.
- Barrido de los `.ts`, `.mjs`, `.js` y `.md` del plugin (lectura, no edicion): para medir qué ficheros
  cambian de seleccion en las 13 carpetas de skill. Solo lectura de ficheros del clon, no del repo de trabajo.
