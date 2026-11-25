# Informe de revision — TASK-168 (ronda 1)

- Commit revisado: 27e0f1c422216587f88a799b2182beaab3331122
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:318 | plan |
| MEN-1 | MENOR | corregido | scripts/verificar-impacto.mjs:321 | implementacion |
| MEN-2 | MENOR | corregido | test/scripts/verificar-impacto.test.ts:202 | implementacion |
| MEN-3 | MENOR | corregido | scripts/verificar-impacto.mjs:102 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Alcance y metodo. Puerta: la peticion trae la verificacion selectiva en verde para el commit revisado (27e0f1c, 732 tests, 0 fallos), asi que no repeti la suite entera. En un clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-168-r1` (en 27e0f1c) hice `npm install`, `npx tsc -p .` (sin errores) y `node --test dist/test/scripts/verificar-impacto.test.js`: 29 tests, 29 ok. No hay linter configurado que yo haya ejecutado (no lo busque: el script es `.mjs` sin paso de lint en la puerta de la peticion).

### IMPORTANTE-1 — `skills/plan` y `skills/review` siguen arrastrando ~116 tests: un comentario de `src/commands/review.ts` cuenta como «nombra la skill»
- Donde: scripts/verificar-impacto.mjs:318-322 (`loNombra`); lo dispara el comentario de src/commands/review.ts:957 (`skills/*/SKILL.md`) junto a una mencion de `"plan"` entre comillas en un comentario de la linea ~9505 de caracteres del mismo fichero y el literal `'review'` (linea 32024 de caracteres).
- Que pasa: la condicion nueva exige que aparezca `SKILL.md` y la carpeta entre comillas (`'plan'`) en el mismo fichero, pero no distingue codigo de comentario ni test de `src`. Un fichero de `src` (no de test) que tiene `SKILL.md` en un comentario y la palabra «plan» o «review» entre comillas en otro cumple `loNombra`; `testsQueDependenDe` arrastra entonces a todos los tests que lo importan (96 mas). Es exactamente la misma clase de falso positivo (mencion en comentario) que la tarea queria eliminar, y justo en las dos skills mas editadas.
- Reproduccion: en el clon, comparando `seleccionar([...skills/<x>/SKILL.md], grafoDelPlugin(...), 100000)` de `develop` (version vieja) y de 27e0f1c contra el repo real, sin tope. Resultado (ficheros de test elegidos, antes → despues): 11 skills (angular-vue-reviewer, approve, board, code-quality-reviewer, csharp-autocad-ifc-reviewer, doctor-deploy, finish, java-spring-reviewer, new, rust-wasm-reviewer, start, task-workflow): 119 → 20. `skills/plan/SKILL.md`: 119 → 116. `skills/review/SKILL.md`: 119 → 116. Diferencia entre plan y start: 96 tests, todos de `src/commands/review.ts` hacia abajo (test/cli/estado.test.ts, test/commands/approve.test.ts, auto-commit, automatico-*...). Comprobado: `n.texto` de `src/commands/review.ts` contiene `SKILL.md` y `"plan"` solo en comentarios, y `'review'` en un argumento de `validarFlagsDesconocidos` que no tiene nada que ver con la skill.
- Impacto: el objetivo de la tarea (un cambio en una skill no arrastra 1800 tests) no se cumple para 2 de las 13 skills, que ademas son las que mas se tocan; la verificacion por parte de esas skills sigue en ~25 min. El plan (Riesgos aceptados) asumio «algun test de mas» para nombres de carpeta comunes, pero no lo midio: es 5 veces mas, no «algun».
- Sugerencia: que la condicion de «nombra la skill» solo se aplique a los tests y a los ficheros con la forma de ruta (`<carpeta>/SKILL.md`, o `'skills'` junto a `'<carpeta>'`), o que el `texto` que se compara ignore comentarios; y anadir al test del repo miniatura un fichero de `src` que cite `SKILL.md` y `'otra'` en comentarios y no elija a sus importadores. Si se decide aceptarlo, anotarlo en el `Resultado` con la cifra (116) y por que.

### MENOR-1 — La rama `<carpeta>/SKILL.md` de `loNombra` no tiene ningun test que la proteja
- Donde: scripts/verificar-impacto.mjs:321
- Que pasa: el fixture `nombra-flujo.test.ts` solo usa la forma `['flujo', 'SKILL.md']`. Quitando la alternativa `texto.includes(\`${carpetaSkill}/${nombre}\`)`, los 29 tests siguen en verde.
- Reproduccion: mutante M3 (borrar esa alternativa) → `node --test dist/test/scripts/verificar-impacto.test.js`: pass 29, fail 0. Los otros mutantes caen: M1 (patron `skills` al viejo) → 2 rojos (TASK-156 y TASK-168); M1b (patron `agents` al viejo) → 2 rojos; M2 (`carpetaSkill === null || ...` sustituido por `true ||`) → 2 rojos; M4 (quitar la forma entre comillas) → 2 rojos.
- Impacto: un test que nombre la skill como `'plan/SKILL.md'` dejaria de elegirse sin que nada avise. En el repo hoy ningun test depende de esa forma (todos los que tienen `SKILL.md` o leen la carpeta, o llevan una carpeta de skill entre comillas: comprobado con un barrido de todos los test/ del plugin).
- Sugerencia: un segundo fixture `nombra-ruta.test.ts` con `'flujo/SKILL.md'`. Ademas, la carpeta se mete sin escapar en `new RegExp(...)`: hoy son nombres con guiones (inocuos), pero `re.escape` seria barato.

### MENOR-2 — Comentario del test de TASK-156 que ya no es cierto
- Donde: test/scripts/verificar-impacto.test.ts:202
- Que pasa: dice «Nadie nombra SKILL.md: sin la carpeta, seria "ningun test lo referencia"», pero tras TASK-168 el repo miniatura si tiene un test que lo nombra (`nombra-flujo.test.ts`) y la aseveracion de la linea siguiente lo espera elegido.
- Reproduccion: lectura del bloque lineas 200-209 contra el fixture de las lineas 65-68.
- Impacto: ruido para el siguiente lector.
- Sugerencia: corregir o quitar el comentario.

### MENOR-3 — El comentario nuevo se interpone entre el JSDoc y `CARPETAS_LEIDAS`
- Donde: scripts/verificar-impacto.mjs:102-105
- Que pasa: el bloque `//` de TASK-168 queda entre el `/** ... */` de TASK-156 y la constante, con lo que el JSDoc deja de documentar `CARPETAS_LEIDAS` para las herramientas que lo leen.
- Reproduccion: lectura del diff.
- Impacto: cosmetico.
- Sugerencia: poner la nota de TASK-168 dentro del JSDoc.

## Sin hallazgos en lo siguiente (que se ejecuto)

- Ningun test que de verdad lee una skill o un agente se queda fuera. Barrido de todo `test/**/*.ts` del plugin (clon en 27e0f1c): 20 ficheros casan el patron nuevo de `skills` (25 con el viejo) y 8 el de `agents` (9 con el viejo). Los que dejan de casar (test/agents/brainstorm-roles.test.ts, review-dominios, distribucion, review-fixtures, cli-main para `skills`; test/skills/validador-claude.test.ts para `agents`) solo citan `test/skills/...` en comentarios o una ruta dentro de una cadena de salida simulada; ninguno compone la ruta de skills/agents (grep de `path.join`/`readdir`/plantillas con `${...}/skills/`, comprobando tambien backticks: cero lecturas con otra forma). `brainstorm-roles.test.ts` sigue elegido para `agents/` por `path.join(PLUGIN_ROOT, 'agents')`.
- Comparacion vieja contra nueva sobre todos los `.md` reales del plugin (skills/*/SKILL.md, agents/*.md y skills/task-workflow/revision.md): lo unico que sale de la seleccion es lo anterior; no entra ningun test nuevo. De los perdidos en SKILL.md, ninguno contiene `SKILL.md` ni lee la carpeta (filtrado a los que mencionan `skills`/`SKILL`: solo comentarios). Los que dejan de elegirse en agents: validador-claude.test.ts (cadena simulada).
- `SKILL.md` nombrado «por otra forma»: barrido de todos los tests con `SKILL.md` (los 19 ficheros): todos son lectores de la carpeta (`'skills'...`) o llevan alguna carpeta de skill entre comillas o como `<carpeta>/SKILL.md`; ninguno queda sin camino de eleccion.
- Nombres de carpeta con guiones o palabras comunes: los 13 nombres reales se ejecutaron; los guiones no dan problema (el regex solo interpreta `.`, que es mas permisivo, nunca menos). Las palabras comunes (`plan`, `review`) son justo el IMP-1; `new`, `start`, `finish`, `board`, `approve` no producen falsos positivos medibles (20 tests, igual que el resto).
- Dependencia oculta por `src`: `taskctl review` lee `skills/*/SKILL.md` en tiempo de ejecucion (`rutaEnPlugin('skills')`, src/core/revisores.ts:63), asi que los tests de `review-*` que ya no se eligen por un cambio en una skill revisora podrian haber cubierto algo. Lo comprobe por mutacion: con `**/*.rs` cambiado a `**/*.zzz` en skills/rust-wasm-reviewer/SKILL.md, `review-dominios.test.js` y `cli-main.test.js` pasan igual (17 ok, 0 fallos), asi que no eran una red de seguridad real ahi; los que si vigilan el catalogo (test/core/revisores.test.ts y test/skills/revisores.test.ts) siguen elegidos por leer `'skills'`.
- Regresion del patron: una cadena como `'x/skills/foo'` (comilla sin pegar a `skills`) ya no cuenta; ningun test del repo la usa (grep). Es un riesgo ya anotado en el plan.
- Las expectativas que el diff cambio en el test de TASK-156 (listas con `nombra-flujo.test.ts` en vez de `nombra.test.ts` para SKILL.md) siguen aseverando lo mismo: la skill es nombrada por su carpeta, y los lectores de la carpeta siguen elegidos; las cuatro aseveraciones de tope se mantienen.

## Regla 4D

- Duplicacion: cumple (`loNombra` reutiliza `nombre`/`rel`; no hay otro sitio con la misma decision; buscado `porNombre` y `CARPETAS_LEIDAS`: solo el bucle de seleccion)
- Desviacion: cumple (el diff toca solo la seleccion y su test; lo del comentario es MEN-3)
- Diluvio: cumple (dos expresiones y una funcion local; nada sobra)
- Disfraz: IMP-1 (el criterio 1 se cumple en el repo miniatura pero no en el repo real para plan y review; el test del criterio 3 si discrimina: 4 de 5 mutaciones caen, la que sobrevive es MEN-1)

## Lecturas fuera del contexto permitido

- src/commands/review.ts, src/core/revisores.ts: para identificar el origen de los 96 tests extra de IMP-1 y la dependencia oculta (lectura del catalogo en tiempo de ejecucion).
- test/ completo del plugin (grep/barrido, sin leerlo entero): para comprobar que ningun test real queda fuera.
- skills/*/SKILL.md y agents/*.md (nombres y un cambio de patron en rust-wasm-reviewer, revertido): para comparar la seleccion y mutar.
