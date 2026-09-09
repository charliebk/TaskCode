# Brainstorm — TASK-017, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: (rellenar)

## Que es observable sin llamar a ningun agente

Sin enfoque previo: plan.ts (cabecera, lineas 17-19) dice explicitamente que la seleccion de skill (6.6) "sigue sin hacer"; razono sobre los criterios de aceptacion.
Es observable sin agente: que fila del catalogo gana, por que regla (solape / prioridad / LLM) y ese registro en la tarea son datos estructurados — cero texto libre salvo el desempate final.

## Plan de pruebas, cada una con su mutacion

- Solape distinto sin empate elige la fila de mayor solape sin invocar el LLM — catalogo de prueba con dos filas (solape 3 vs 1) — mutacion que la tumba: invocar el LLM aunque no haga falta, o comparar los solapes al reves.
- Empate en solape se rompe por `prioridad` declarada, sin LLM — catalogo con dos filas de igual solape y prioridad distinta — mutacion que la tumba: ignorar `prioridad` y caer directo al LLM.
- Empate en solape Y en prioridad invoca al LLM con exactamente ese top-N (2-3 candidatos, nunca el catalogo completo) — catalogo con tres filas empatadas entre si — mutacion que la tumba: pasar el catalogo entero al juez, o resolver el empate sin invocarlo.
- Ninguna fila comparte etiqueta con la tarea deja la seleccion sin skill y lo dice explicitamente — tarea con etiquetas que no casan con ninguna entrada — mutacion que la tumba: devolver la primera fila del catalogo por defecto.
- El registro final distingue las tres reglas (solape / prioridad / desempate LLM), no solo el id ganador — `taskctl plan` contra un repo git temporal real, leyendo el frontmatter resultante — mutacion que la tumba: escribir siempre "solape" como regla aunque haya ganado por prioridad o LLM.
- Candidato ganador `origen: externo` no instalado anota `/plugin install X@Y` y no instala nada — catalogo de prueba con una fila externa marcada como no instalada — mutacion que la tumba: omitir la anotacion o disparar una instalacion real.

## Aserciones trampa que hay que evitar en esta tarea concreta

- Igual que el near-miss de heuristica.test.ts (mutar para ignorar `criterios` y la suite seguia verde): un test que ponga el mismo solape Y la misma prioridad en dos filas no aisla el desempate de prioridad del de solape.
- Probar solo el caso de un unico candidato no ejercita el top-N: no demuestra que al LLM le llegan 2-3 filas y no el catalogo entero.
- Comprobar solo el id de la skill elegida sin comprobar la regla registrada deja "solape"/"prioridad"/"LLM" mal etiquetados sin que nada lo note.

## Que pruebas existentes cambian de expectativa

- test/commands/plan.test.ts (lineas 37-38): su helper de tareas fija `skills_recomendados: []`; no asevera nada sobre ese campo tras "plan" hoy, pero un test nuevo que reutilice ese helper necesita `etiquetas` reales o el catalogo nunca encontrara candidatos.

## Como envejece

Cada fila nueva en catalogo-skills.yml es una fila mas en la tabla de solape/prioridad: mismo patron que heuristica.ts (726 lineas + 768 de test), mismo riesgo si el test copia el catalogo a mano en vez de iterarlo.
Si TASK-018 conecta `patrones_archivo` al mismo catalogo, un test que asuma "solo etiquetas" para el top-N dejara de reflejar la seleccion real sin avisar.
