# Brainstorm — TASK-096, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos
- **Ya existe (y no hay que tocarlo) para Stop y review:** `peticionDeTrabajo` (`src/fs/decision-documentacion.ts:131`) ya elige «documentacion → selectiva → la de siempre» y pasa `RAMA_BASE`. El criterio 2 ya lo cumple TASK-102: no requiere código, solo la confirmación de testing. Lo que de verdad falta del nivel 2 está en `finish` y en el guardián, que siguen exigiendo `comando_verificacion` por la decisión de TASK-091 (`plan-final.md:7`, y la guía `verificacion-selectiva.md:12`).
- **Forma:** un tercer resultado en la decisión pura que ya comparten finish y el guardián. `DecisionVerificacion` (`src/core/verificacion-proporcional.ts:43`) pasa a tener tres variantes: `completa | documentacion | selectiva`. Qué tests corren lo sigue decidiendo el proyecto con su `comando_verificacion_selectiva`, que ya recibe `RAMA_BASE`; TaskCode no duplica el mapa de capas.
- **Clave nueva (opt-in), leída de la config de la base (`configDeRef`) como `rutas_documentacion`:** `rutas_verificacion_parcial: [src/web/**, ...]`, en formato `git :(glob)`. Es una lista de rutas permitidas, no de prohibidas: la selectiva basta para integrar solo si TODO lo que no es documentación cae dentro. Cualquier otra ruta (sin clasificar, transversal, el propio clasificador, lockfiles) va a la completa sin que el proyecto tenga que acordarse de nada. Exige `comando_verificacion_selectiva`, con la misma validación cruzada que `config.ts:787`.
- **Lo que se decide sobre TASK-091:** la completa sigue siendo obligatoria por defecto. Declarar la clave es la revisión explícita de TASK-091 para ese proyecto. Sin la clave, el comportamiento es byte a byte el de 0.13 (`decidirVerificacionEntre` no lanza ni un git de más).
- **Orden de construcción (cada porción, < 1 h y verificable por separado):**
  1. **Core puro.** Clave en `config.ts` (parseo, validación cruzada, tabla de cabecera) y rama `selectiva` en `decidirVerificacion`. Entra con `diff.fueraDeParcial` y se respetan los mismos «ante la duda»: diff nulo o vacío, cambio de `.taskcode/config.yml`. Todavía no hay consumidores: `finish` y el guardián tratan `selectiva` como `completa`, así que no cambia nada observable.
  2. **Fs.** `decidirVerificacionEntre` hace una segunda llamada a `rutasDeTarea`, con los patrones `docs ∪ parcial`, y solo si la base declara la clave y la primera llamada dice «no es solo documentación». `huellaDeCommit` (`src/fs/verificacion.ts:144`) recibe un `contexto?` opcional, igual que `huellaDelArbol`, para casar con la huella de la selectiva. `verificarConMemo` (línea 273) deja de guardar el memo `selectiva` con el árbol sucio, igual que ya hace con `documentacion`. Sigue sin cambiar nada observable.
  3. **finish.** `puertaSoloDocumentacion` (`src/commands/finish-verificacion.ts:201`) pasa a ser `puertaProporcional(decision)`. En el caso `selectiva` llama a `verificarConMemo({tipo:'selectiva', base: ramaBase})`, que reutiliza el verde del Stop o de review si coincide la huella. La salida dice qué corrió y por qué, y queda anotado en `tarea.md` (sección `## Verificacion selectiva`, junto a la de documentación).
  4. **Guardián.** `exencionDocumentacion` (`src/hooks/guardia-merge.ts:251`) pasa a ser `exencionProporcional`. Acepta el memo `selectiva` de `huellaDeCommit(sha, selectiva, timeout_verificacion_selectiva, contextoSelectiva(destino))` con las mismas restricciones que ya existen: release, `soloIntegra`, held-out como código y presupuesto de tiempo.
  5. **Documentación y limpieza.** `skills/task-workflow/verificacion-selectiva.md` (reescribir la tabla de la línea 7 y el párrafo de la 12), README, CHANGELOG, el aviso de `doctor` y borrar lo que quede muerto (por ejemplo, el texto «aunque las rondas usaran la selectiva» de `finish-verificacion.ts:175` cuando aplique la clave).
- **Alternativa descartada A:** que TaskCode mapee rutas → tests (`mapa_tests`). Duplica el conocimiento que ya tiene el clasificador del proyecto, y el enunciado lo prohíbe.
- **Alternativa descartada B:** un booleano `selectiva_basta_para_integrar: true` sin lista de rutas. Confía la integración entera a un script que vive en la rama que se integra: la rama puede cambiar su propio clasificador para eximirse, y TaskCode no podría distinguir «transversal» para cumplir el criterio 1.

## Que se extiende y que se crea
- **Se extiende `src/core/verificacion-proporcional.ts`:** la variante `selectiva` y `ConfigDocumentacion` con `rutas_verificacion_parcial` y `comando_verificacion_selectiva`. Sigue siendo el único sitio que decide.
- **Se extiende `src/fs/decision-documentacion.ts`:** `decidirVerificacionEntre` (segundo pathspec, perezoso) y `ResultadoDecision` (lleva también el comando y el timeout de la selectiva de la base).
- **Se extiende `src/fs/verificacion.ts`:** `huellaDeCommit(…, contexto?)` y la protección de memo limpio para `selectiva`. No hace falta un memo nuevo: `TipoVerificacion` ya tiene `selectiva`.
- **Se extienden `finish-verificacion.ts` y `guardia-merge.ts`:** generalizan el camino de documentación que ya tienen. No se crea ninguna puerta nueva.
- **Se crea solo** la clave de config y la sección de `tarea.md`. Ningún módulo nuevo.
- **Sin tocar:** `peticionDeTrabajo`, `freno-stop.ts` y `review.ts` (ya aplican documentación → selectiva).

## Limites que cruza
- **Contrato de config** (`.taskcode/config.yml`): una clave nueva, opcional y con validación cruzada. Una clave desconocida en versiones viejas avisa y se ignora.
- **Contrato con el script del proyecto:** el mismo de hoy (`RAMA_BASE`, salida 0 = verde, no escribir en el árbol). Lo nuevo es que su verde ahora puede abrir un merge, y eso tiene que decirlo la guía.
- **Formato del memo** (`.git/…`, uno por tipo): el memo `selectiva` lo empiezan a leer `finish` y el guardián. La fórmula de la huella no cambia (contexto = base y su SHA), así que no hace falta subir `VERSION_MEMO`.
- **Dependencias:** se mantienen `core` puro ← `fs` ← `commands`/`hooks`. No aparece ningún ciclo.
- **Coste:** sin la clave, cero git nuevos. Con ella, como máximo un `git diff` más por decisión, y solo cuando no es documentación. En el guardián cuenta contra `PRESUPUESTO_EXENCION_MS`. `finish` gana además reutilizar el memo de la selectiva del último Stop limpio.

## La decision de diseño que mas te preocupa (UNA sola)
Dónde queda la frontera de confianza en la integración. El clasificador que corre en `finish` es el de la rama que se integra, no el de la base. Propongo que esa frontera la marque TaskCode con `rutas_verificacion_parcial`, leída de la base, y no el script. Así, si el script o su tabla están fuera de esas rutas, tocarlos fuerza la completa. Pero esto obliga al proyecto a declarar las rutas en dos sitios: en su tabla y en esta clave.

**Desacuerdo previsto:** con dominio o testing, si piden que el Stop o review corran la completa ante código transversal. Mi posición es que no: son puertas de iteración, y la completa toca en `finish`.

**Suposiciones no verificadas:**
- Que el Stop guarda el memo `selectiva` con el contexto de la base resuelta igual que la usará el guardián (base = destino). Habría que mirar el `base` que pasa `freno-stop.ts` frente al `destino` de `guardia-merge.ts:205`.
- Que en un hotfix `ramaBase` es fiable en `finish`. Si no lo es, el hotfix debería quedarse en la completa, como ya hace con la exención de documentación (`verificacion-selectiva.md:152`).
