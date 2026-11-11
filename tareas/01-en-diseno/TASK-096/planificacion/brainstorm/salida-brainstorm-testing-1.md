# Salida de brainstorm — TASK-096, rol testing (ronda 1)

Agente: brainstorm-testing

## Qué es observable sin llamar a ningún agente
- No había enfoque previo. Respondo sobre lo que piden los criterios. Todo se puede afirmar desde fuera con el patrón de `test/commands/verificacion-selectiva.test.ts`: los scripts de verificación viven fuera del repo y cuentan sus ejecuciones (`cuenta-<nombre>`), apuntan la `RAMA_BASE` que reciben y leen de un fichero cuál es su desenlace. Se lanzan contra repos Git reales y con los scripts de Git-Flow tal cual.
- Hay cuatro cosas observables: (a) cuántas veces corrió cada comando (completa, selectiva/afectado, documentación); (b) si `develop` avanzó (`git rev-parse develop`); (c) qué ficheros de memo hay en `.git/` (`freno-verificacion.json` es el de la completa, `-selectiva`, `-documentacion`), que es lo que lee el guardián; (d) el texto de `onAviso`/`FinishCommandError` y la anotación commiteada en `tarea.md`.
- Para que «el proyecto clasifica» sea comprobable, el script de prueba tiene que escribir **qué decidió correr** (afectado o completa) en un fichero fuera del repo. Hay que aseverar sobre ese fichero, no solo sobre el mensaje de finish.
- El criterio 2 ya está cubierto en su parte de documentación (TASK-102/104: `review-documentacion.test.ts:195` «Stop y review: la misma decisión para el mismo diff»). Lo nuevo es fijar que el nivel 2 se decide igual en los tres momentos.

## Plan de pruebas, cada una con su mutación (agrupado por porciones de menos de 1 h)
**P1. Decisión pura de nivel 2 y clave de config (en core, entra en `test:rapido`)**
- Tabla de `decidirVerificacion` ampliada: documentación → nivel 1; código que el proyecto clasifica → afectado; config cambiada, diff null, diff vacío o sin clasificar → completa. Mutación: invertir el orden y comprobar «afectado» antes que `RUTA_CONFIG` o `diff===null` → se pone rojo el caso «cambia `.taskcode/config.yml` con código parcial».
- Config: la clave nueva es conocida; sin `comando_verificacion` aborta (fallo cerrado, como `config (TASK-091): fallo cerrado`). Mutación: quitar la validación cruzada en `core/config.ts`.

**P2. finish ejecuta solo lo afectado (`test/commands/finish-afectado.test.ts`, nuevo)**
- Diff parcial clasificado: `ejecuciones('afectado')===1`, `ejecuciones('completa')===0`, integra y la salida dice «solo lo afectado». Mutación: forzar `tipo:'completa'` en `puertaVerificacion` → completa=1.
- Diff transversal o sin clasificar: completa=1 y afectado=0, con el motivo en la salida. Mutación: que el clasificador devuelva siempre «parcial», o tratar «sin clasificar» como parcial.
- Afectado en rojo: no integra, `develop` no se mueve y la tarea sigue en `en-revision`. Mutación: ignorar `r.estado` en la rama nueva.
- El verde del afectado **no** escribe `freno-verificacion.json`. Mutación: `guardarMemo(...)` sin el tipo → el guardián dejaría pasar un merge manual.

**P3. Guardián (`test/hooks/guardia-afectado.test.ts`)**
- Sin código y con verde de documentación pasa; con código y sin verde de la completa bloquea (código 2). Mutación: aceptar el memo `-selectiva` como si fuera el de la completa.
- `decidirPreToolUse` y finish deciden lo mismo sobre el mismo repo y el mismo sha (una sola prueba sobre la misma tabla de diffs). Mutación: que el guardián decida con la config del árbol y no con la del destino.

**P4. Misma decisión en Stop, review y finish, y regresión sin la config nueva**
- Una sola prueba que recorre la tabla (docs, parcial, transversal) y llama a `decidirStop`, `runReviewCommand` y `runFinishCommand`. Para cada diff, los tres corren el mismo comando. Mutación: duplicar la lógica en `peticionDeTrabajo` y desviarla en un caso.
- Regresión: un proyecto con `comando_verificacion` **y** `comando_verificacion_selectiva` pero sin la clave nueva hace que finish corra la completa y el guardián bloquee igual que hoy. Mutación: activar el nivel 2 con la mera presencia de `comando_verificacion_selectiva`.

**P5. Documentación y limpieza**
- La guía `verificacion-selectiva.md` explica el principio y la clave, y no lleva marcas de este repo. Ampliar `guia (TASK-091)` (`verificacion-selectiva.test.ts:528`). Mutación: borrar la sección y comprobar que se pone rojo.
- Cada porción se verifica sola con `npm run build` y `node --test dist/test/<fichero>.test.js`. `test:rapido` solo cubre P1: P2–P4 lanzan procesos.

## Aserciones trampa que hay que evitar en esta tarea concreta
- Aseverar solo el mensaje «solo lo afectado»: pasa aunque se corra la completa. Hay que exigir siempre los contadores de ejecución de **los dos** comandos.
- Usar el mismo texto para el comando de la completa y el del afectado sin comprobar qué memo se escribió (es la trampa que ya cubre `guardian (TASK-091)` en la línea 226).
- Una regresión «sin config» que no declare la selectiva pasa por el `return null` temprano y no prueba nada. El proyecto de 0.14 que importa es el que **ya tiene** la selectiva.
- Regex que casen a la vez con «verificación completa» y con «sin la completa». Hay que anclar a frases distintas de cada camino (`/no se ejecuta la verificacion completa/` frente a `/se ejecuta la verificacion completa:/`).
- Un clasificador de prueba que devuelva una constante: el caso transversal pasaría igual. Tiene que decidir por la ruta.

## Qué pruebas existentes cambian de expectativa
- `finish (TASK-091): exige la completa aunque la selectiva este en verde` (`verificacion-selectiva.test.ts:459`) y `finish (TASK-091): con la completa en rojo no integra` (:478). **Solo** cambian si la decisión sobre TASK-091 se reutiliza sin una clave nueva. Si el nivel 2 es opt-in, siguen igual y pasan a ser la red de regresión del criterio 4. Si cambian, su motivo va en Resultado.
- `guardian (TASK-091): un verde de la selectiva no abre la puerta` (:226) y `guardian (TASK-101): con codigo sigue bloqueando` (`guardia-documentacion.test.ts:84`). Siguen valiendo tal como está escrito el criterio 3 (con código exige la completa). Cambiarían si el guardián aceptara el verde del afectado.
- Las pruebas con nombre «como en la 0.14.0» (`finish-documentacion.test.ts:231`, `guardia-documentacion.test.ts:188`, `freno-stop-documentacion.test.ts:233`, `review-documentacion.test.ts:223`) no cambian: son la red. Ojo: el criterio 4 dice «0.13», pero la referencia verificable hoy es la 0.14.0.
- El texto del error de finish «aunque las rondas usaran la selectiva» (`finish-verificacion.ts:176-180`) queda obsoleto en el nivel 2. Si se reescribe, la regex de :489 cambia y hay que explicarlo.

## Cómo envejece
- `DecisionVerificacion` y `PlanVerificacion` pasan de dos o tres variantes a cuatro. Cada `switch` en finish, guardián, Stop, review, `informe-revision` y métricas es un punto donde un quinto nivel se olvida. Solo la prueba tabular de P4 lo detecta.
- El contrato con el comando del proyecto (cómo dice «parcial» o «completa») es un protocolo de texto o de código de salida. Si cambia sin que cambie la guía, nada se pone rojo, salvo que la prueba de la guía asevere el contrato literal.
- Los nombres de los memos (`freno-verificacion*.json`) ya son tres. Un cuarto tipo que reutilice la huella de la completa abre el guardián sin que nadie lo note: la prueba de P2 sobre «no escribe el memo de la completa» es la que lo frena.

**Desacuerdo previsto con arquitectura y dominio:** los criterios 1 y 3 tiran en sentidos opuestos. finish integraría con el verde del afectado, pero el guardián seguiría exigiendo la completa para el mismo diff. Eso contradice «aplica la misma decisión que finish». El plan tiene que elegir, y la prueba de P3 fija lo que se elija. No veo cómo probar las dos cosas a la vez.
