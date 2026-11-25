# Informe de revision — TASK-150b (ronda 1)

- Commit revisado: 2aab1621747686dbd34a08f0596801914eb5d885
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts:35 | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts:583 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### MENOR-1 — comentarios del test que describen lo que ya no hace
- Donde: test/skills/revisores.test.ts:35-39 (punto 3 de la cabecera del fichero) y 808-814 (comentario de la seccion 3bis)
- Que pasa: el punto 3 dice que "la linea que cada skill prescribe se pasa por `veredictoAprobado`", y el de 3bis habla de skills que "prescriben una estructura de informe" y "reproducen el esqueleto". Tras el diff ninguna revisora prescribe la linea ni reproduce el esqueleto: el test 7 solo comprueba que no la copian, y lo de `veredictoAprobado` lo hace el 10f contra la tabla de revision.md.
- Reproduccion: lectura del fichero en el commit revisado; `git diff` del commit 97f9ff3 no toca esos comentarios.
- Impacto: ninguno en ejecucion; el siguiente lector busca un contraste skill-contra-finish que ya no existe (el 10f lo hace con la tabla).
- Sugerencia: reescribir ambos comentarios en una linea cada uno ("las revisoras no copian el esqueleto; la fuente es informeTemplate y revision.md").

### MENOR-2 — el test 7 queda subsumido por el 10c
- Donde: test/skills/revisores.test.ts:583-590 y 861-876
- Que pasa: el 10c recorre `CAMPOS_CABECERA` (que incluye `- Veredicto:`) con `trim().startsWith(campo)`; el 7 busca `/^-\s*veredicto:/i`, que es un subconjunto de lo anterior. Las dos mutaciones de linea de veredicto que probe hacen caer los dos, asi que el 7 no discrimina nada que el 10c no discrimine.
- Reproduccion: anadir `- Veredicto: aprobada` al final de code-quality-reviewer/SKILL.md: caen el 7 y el 10c. Con el 7 borrado seguiria cayendo el 10c.
- Impacto: mantenimiento; dos tests para una misma comprobacion. Compensa solo por la mayuscula/minuscula (`/i`).
- Sugerencia: dejarlo (cuesta poco) o fundir el 7 en el 10c. No bloquea.

## Regla 4D

- Duplicacion: cumple (la cabecera ya no esta en ninguna revisora ni en otro fichero instalable; MEN-2 es solapamiento entre dos tests, sin consecuencia)
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: cumple (los dos tests reescritos caen por mutacion; ver abajo)

## Reproduccion

- Clon: C:/Users/nullcad2025/AppData/Local/pruebas-claude/taskcode/task-150b-r1, checkout de 2aab162 (borrado al terminar).
- Instalacion y build: `npm install` y `npx tsc -p .` en taskcode-marketplace/plugins/taskcode-plugin: sin errores.
- Suite: la peticion trae la verificacion selectiva en verde (codigo 0, 2064 tests, 0 fallos) para el mismo commit revisado: se cita y no se repite. Corri solo `node --test "dist/test/skills/**/*.test.js"`: 115 pasan, 0 fallan.
- Busqueda de copias: title (`Informe de revision —`), `Commit revisado:` y `Contexto adicional` en skills/, agents/, docs/, scripts/ y README del plugin (sin dist, node_modules ni test): solo aparecen en src/commands/review.ts (fuente), src/commands/codex-review.ts (informe distinto, el de la segunda opinion de Codex, con su propio titulo y salida cruda; no es copia de la plantilla de las revisoras) y la mencion de revision.md:163. Ningun .md instalable copia la cabecera. skills/review/SKILL.md:64 solo dice "conservando la cabecera de la plantilla", coherente. Nota: el plan afirma "ninguna otra copia en src/"; codex-review.ts tiene otra, pero de otro informe, y queda fuera del criterio.
- Mutaciones (cada una sobre una copia, restaurada con `git checkout -- <fichero>`), tests `revisores.test.js` y `fuente-unica.test.js`:
  - Titulo del informe pegado en rust-wasm-reviewer: cae el 10c (y el 11 por la marca TASK-001, previsto).
  - `- Commit revisado:` pegado en code-quality-reviewer: cae el 10c.
  - `- Veredicto: aprobada` pegado en code-quality-reviewer: caen el 7 y el 10c.
  - `- Contexto adicional pedido:` pegado en java-spring-reviewer y en code-quality-reviewer: cae el de fuente-unica (CONT-03/04).
  - Quitar la remision `como dice "El informe" de` en java-spring-reviewer: cae el 10c.
  Todas en rojo; restauradas sin restos (`git status` solo con package-lock.json tocado por `npm install`, ajeno al diff).
- Que pasa con lo que cada revisora anadia: comparado linea a linea el antes y el despues.
  - rust-wasm: `Limite JS-WASM` (en Alcance), `Formato y lints`, `Mutacion`, `Medidas`, `Casos construidos` y la linea base de la suite siguen todos en la prosa de Alcance y Reproduccion; la reproduccion de rust-wasm no se pierde.
  - angular-vue: `Vista ejercitada` (ruta, navegador, volumen de datos, recorrido de teclado) y los casos construidos, conservados.
  - java-spring: clon, build, suite con linea base y casos, conservados.
  - code-quality y csharp: solo tenian la cabecera; la sustituye la remision.
  - Lo unico que desaparece: `Contexto adicional pedido` (intencion del plan; ahora va a `## Lecturas fuera del contexto permitido`, que el esqueleto de informeTemplate trae) y la frase "si no hay nada que reportar, ... sin hallazgos explicito", que ya dicen el esqueleto ("o 'sin hallazgos' explicito") y revision.md ("El informe", con la lista de lo ejecutado). Nada que el revisor necesitara.
  - Encaje con informeTemplate: la tabla `ID | Severidad | Estado | Fichero | Origen`, la Regla 4D y las Lecturas son del esqueleto; las secciones extra de las tres revisoras van despues de `## Hallazgos` y no chocan con ninguna.
- Tests reescritos: el 7 antes aceptaba por `finish.ts` la linea de ejemplo de cada skill; ahora que no hay linea, lo que protegia (que lo que se escribe lo acepte finish) lo cubre el 10f contra la tabla de revision.md y `veredictoAprobado`; el 7 y el 10c nuevos cubren lo nuevo (que nadie vuelva a copiar). Con el 10c anterior se perdian tambien "una sola linea de veredicto" y "en la cabecera": ya no tienen objeto, porque no hay bloque que las contenga. Sin cobertura perdida.
- Frases rotas: leidas las cinco secciones nuevas; sin frases cortadas. El ajuste de lineas es irregular (algunas muy cortas) pero el texto lee bien.
- Casos que no ejecute: ninguno.

## Revisado sin hallazgos

- Las cinco SKILL.md revisoras y revision.md:162-166 (la frase nueva es coherente con lo que dice revision.md sobre la cabecera: "no la copian: solo anaden sus secciones propias despues de `## Hallazgos`").
- fuente-unica.test.ts: la alternativa nueva de la regex no deja pasar nada que antes se vetara, y detecta las dos mutaciones de "Contexto adicional pedido".

## Lecturas fuera del contexto permitido

- src/commands/review.ts (informeTemplate), para confirmar que el esqueleto trae la tabla, la Regla 4D y las lecturas, que es lo que remiten las skills.
- src/commands/codex-review.ts, para comprobar si era una segunda copia de la plantilla (no lo es: es el informe de Codex).
- skills/review/SKILL.md, para ver si repetia la cabecera (solo la nombra).
- test/skills/revisores.test.ts completo, para ver las constantes que usan el 10b y el 10f.
