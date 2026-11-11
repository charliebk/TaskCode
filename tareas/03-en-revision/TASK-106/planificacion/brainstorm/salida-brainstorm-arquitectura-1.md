# Brainstorm — TASK-106, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

En `commands/finish-verificacion.ts`, `puertaSoloDocumentacion` pasa a `puertaProporcional` y se ramifica por `decision.tipo`. La decision sigue saliendo de `decidirVerificacionEntre(ramaBase,'HEAD')`, que TASK-105 ya devuelve `selectiva`. El caso `selectiva` llama a `verificarConMemo` (`fs/verificacion.ts:273`) con `{tipo:'selectiva', comando: decision.comando, timeoutS: r.timeoutSelectivaS, base: ramaBase}`: memo, `RAMA_BASE` y escritura en `freno-verificacion-selectiva.json` (nunca `freno-verificacion.json`, `verificacion.ts:41-45`) salen hechos.

## Que se extiende y que se crea

- `finish-verificacion.ts` `puertaProporcional`: se extiende (renombra). Precedente: TASK-100. El patron «escribir tarea.md, `autoCommit`, releer» ya esta dos veces (lineas 135-152 y 207-223): se extrae a un `anotarYCommitear(o, body, mensaje)` privado y la selectiva es su tercer uso.
- `ResultadoPuerta`: se extiende con `{tipo:'selectiva'; comando; motivo; deMemo}`. Contrato publico: lo leen `finish-cobertura.ts:75-90` y `finish.ts:472`. Cobertura anade `selectiva` → `omitida` (D4), mismo patron que `documentacion`.
- `core/transiciones.ts`: se crea `SECCION_VERIFICACION_PARCIAL` («## Verificacion parcial») y `anotarVerificacionParcial(body, instante, comando, motivo, selectiva)`. La idempotencia de `:376-380` se saca a un helper privado compartido. Seccion propia: la de documentacion afirma «solo documentacion» y mezclarlas confunde la auditoria.
- `PuertaVerificacionOpts`: se extiende con `permitirSelectiva?: boolean`, que pone `finish.ts` (falso en hotfix). Hoy el hotfix SI recibe `ramaBase` (`finish.ts:468`) y sin la opcion bajaria al nivel 2. El release no recibe `ramaBase`. La puerta no conoce el tipo de tarea: con la opcion a falso, una decision `selectiva` se ejecuta como completa.
- Texto TASK-091 (`finish-verificacion.ts:175-180`): se condiciona. Si la base tiene `parcialDeclarada` y aun asi toca la completa, el rojo da el motivo de la decision; sin la clave, el texto no cambia (criterio 5).
- No se tocan `core/verificacion-proporcional.ts`, `fs/decision-documentacion.ts` (finish deja de usar `motivoDeLaCompleta`; el guardian lo sigue usando hasta B5), `peticionDeTrabajo`, `guardia-merge.ts`, el freno Stop ni review.

Orden de construccion:
1. `transiciones.ts`: helper de linea idempotente + `anotarVerificacionParcial` (core puro, entra en `test:rapido`).
2. `ResultadoPuerta` con `selectiva` y su caso en `puertaCobertura` → `omitida`.
3. `puertaProporcional` con el caso `selectiva` sobre `verificarConMemo` y la comprobacion de arbol limpio despues, como en `:185-191`.
4. `finish.ts` pasa `permitirSelectiva` (hotfix falso). Texto TASK-091 condicionado y aviso de salida con motivo y si vino del memo.

Alternativas descartadas:
- `ejecutarVerificacion` + `guardarMemo` copiando el caso de documentacion: duplica env `RAMA_BASE`, `contextoSelectiva` y la regla del arbol limpio; dos formulas de huella; no reutiliza memo.
- Que `finish` use `peticionDeTrabajo`: lee la config del arbol y elige la selectiva solo porque el comando existe. Rompe el criterio 5 y la regla de que manda la config de la base (TASK-101).

## Limites que cruza

- core (`transiciones.ts`) ↔ commands (`finish-verificacion.ts`, `finish-cobertura.ts`, `finish.ts`) ↔ fs (`verificacion.ts`, memo).
- Contrato `ResultadoPuerta` entre puerta, cobertura y finish.

Desacuerdos previstos con riesgos:
- Que `finish` reutilice el memo (TASK-072 decidio que no, porque no ve los ignorados). Posicion: lo pide el objetivo y se limita a la selectiva; la completa sigue sin memo.
- Anotar despues del verde y no antes. Posicion: sin el commit de la anotacion no hay merge; lo integrado es lo verificado mas un cambio en `tareas/**`, que el guardian no juzga por el memo selectivo.
- Memo del Stop de un HEAD anterior al merge de `develop`: el contexto de la huella incluye el SHA de la base (`verificacion.ts:246-248`); si `develop` avanzo, no casa y se reejecuta.

Suposiciones no verificadas:
- Que el memo del Stop/review casa con el de `finish`: ellos usan comando y timeout del ARBOL (`decision-documentacion.ts:218`), `finish` los de la BASE. Solo difieren si la rama cambia la config, y eso va a la completa. Leido, no ejecutado.
- Que el merge interno de `finish` no dispara `guardia-merge` (hook PreToolUse).
- Que sin `rutas_documentacion` no hay nivel 2 (`decidirVerificacionEntre:96` devuelve null; D-B de TASK-105).
- Que `anotarLineaEnSeccion` (`transiciones.ts:384`) sirve tal cual para la seccion nueva.

## La decision de diseño que mas te preocupa (UNA sola)

El orden entre verificar y anotar. Con documentacion la anotacion se commitea ANTES de correr (`finish-verificacion.ts:207-218`). Si la selectiva hiciera lo mismo, nunca reutilizaria el memo del Stop o de review, porque la huella incluye HEAD (`verificacion.ts:164`). Propuesta: verificar sobre el HEAD sin anotar, y anotar y commitear solo tras el verde (posible porque, segun D1, el guardian no busca el memo selectivo).
