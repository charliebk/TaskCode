# Brainstorm — TASK-108, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

D1 ya está cableado en el código: desde TASK-105, en `exencionDocumentacion` (`src/hooks/guardia-merge.ts:270`), una decisión `selectiva` bloquea. Además, el guardián solo lee los memos `completa` y `documentacion`, nunca el de `selectiva`. B5 no toca la lógica de decisión. Hace tres cosas: fija ese comportamiento con tests, añade al bloqueo una línea propia para el caso `selectiva` y retira los comentarios que todavía dicen «hasta que el guardián la acepte (B5)».

Orden de construcción:
1. Tests de los criterios 1, 2 y 4 contra el código actual. Si salen en verde sin tocar producción, eso prueba que TASK-105 ya cumple D1. Si alguno sale en rojo, es una divergencia real y se para.
2. Mover el texto de `motivoDeLaCompleta` a `guardia-merge.ts` y borrar el export de `fs`. Es un refactor sin cambio observable.
3. Añadir la línea del caso `selectiva` y el test sobre ese texto (criterio 3).
4. Comentarios: la cabecera del guardián y el bloque `finish-verificacion.ts:280`, que nombra `motivoDeLaCompleta`.
5. `npm run test:rapido` mientras se itera; `npm test` una sola vez antes de la revisión.

## Que se extiende y que se crea

- `exencionDocumentacion` (`guardia-merge.ts:251`) — se extiende — la rama `d.tipo !== 'documentacion'` se divide en dos. Si la decisión es `selectiva`, se mantiene la frase actual («No es solo documentación: la tarea cambia rutas que no son documentación.») y se le añade una línea: «un merge a mano exige la completa (`comando_verificacion`) en verde de ese commit, aunque a `taskctl finish` le baste lo afectado; cómo obtenerla: …». Como el cambio solo añade, el test TASK-105 (`guardia-documentacion.test.ts:284`) sigue en verde sin tocarlo.
- `motivoDeLaCompleta` (`src/fs/decision-documentacion.ts:153`) — se quita de `fs` y su texto pasa a `guardia-merge.ts` — es texto de un mensaje del guardián y el guardián es su único consumidor (comprobado con grep). Su comentario «hasta que el guardián la acepte (B5)» queda falso con D1.
- Paso 6 (memo de la completa, `guardia-merge.ts:223-231`) — no se toca — la huella sale de `huellaDeCommit` sin contexto y no depende de la base. El caso «develop avanzó» solo invalida el memo de la selectiva (`contextoSelectiva` mete el SHA de la base, `fs/verificacion.ts:251`), que el guardián ya ignora. El mensaje de ese caso es el mismo que el de la selectiva.
- Config del destino — no se toca — 6b ya decide con `configDeRef(destino)` a través de `decidirVerificacionEntre`. El criterio 2 se cubre con un test, sin código nuevo.
- Cabecera de `guardia-merge.ts` (puntos 6b y 7) — se extiende — se documenta que, con `rutas_verificacion_parcial`, el código exige siempre la completa (D1, 2026-11-11).
- Tests de los criterios 1, 2 y 4 — se crean, en `test/hooks/guardia-documentacion.test.ts`, reutilizando su `conEntorno` y su `RUTAS`.

Alternativas descartadas:
- Que el guardián lea el memo `selectiva` para avisar con «finish verificó lo afectado» — no: añade una huella con contexto y otra lectura dentro del presupuesto de 30 s, acopla el guardián a un memo que según D1 no cuenta y no detecta «develop avanzó».
- Pasar también los pasos 3 y 6 a la config del destino — no: `finish` calcula la huella de la completa con la config del árbol (`finish-verificacion.ts:135`); si solo cambia el guardián, deja de casar el verde que guarda `finish`. Sería una tarea aparte que toque los dos.

## Limites que cruza

- `fs` → `hooks`: el texto de `motivoDeLaCompleta` sale de `fs` y vive en el hook.
- Desacuerdo previsto con riesgos: una rama que quita `comando_verificacion` de su propio árbol desactiva el guardián (paso 3, `guardia-merge.ts:141-146`, lee la config del árbol). Posición: es anterior a esta tarea; el criterio 2 se refiere a la decisión 6b, que ya usa el destino. Arreglarlo aquí rompe el emparejamiento de la huella con `finish`.

Suposiciones no verificadas:
- El merge del script de Git-Flow lanzado por `taskctl finish` no pasa por el hook `PreToolUse` (salvo `--merge-request`): confirmar en `comandoCandidato`.
- Tras un conflicto en un `finish` de nivel 2 (`finish.ts:569-575`), lo natural es resolver en la rama de la tarea y repetir `finish`: confirmar con el texto de error y `scripts/merge-feature-to-develop.sh`.
- Ningún otro consumidor (skills, docs) cita el texto exacto «la tarea cambia rutas que no son documentación»: buscar con grep.
- Sin `rutas_verificacion_parcial` nunca sale `selectiva` en 6b (criterio 4): confirmar en `decidirVerificacion`.

## La decision de diseño que mas te preocupa (UNA sola)

«Cómo obtener la completa». Con el nivel 2 y todo el código dentro de las rutas declaradas, nada escribe hoy el memo de la completa para ese commit: `finish` corre la selectiva, el freno Stop también, y `finish` no tiene un flag para forzar la completa (`FLAGS_FINISH`, `finish-opciones.ts:41`). Posición: el mensaje dice la verdad y no inventa un camino. Integrar se hace con `taskctl finish TASK-NNN` (su merge no pasa por el guardián); si hay conflicto, se resuelve en la rama de la tarea y se repite `finish`. `--sin-verificacion` lo decide la persona. Un camino real a la completa (`finish --completa`) sería una tarea aparte que cambia el contrato del CLI.
