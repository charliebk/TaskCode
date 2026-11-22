# Informe de revision — TASK-137 (ronda 1)

- Commit revisado: a6b1aafb788eabf63bd9bde05c040039710210cd
- Revisor: code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-137 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/informe-revision.ts:417 | implementacion |
| MEN-2 | MENOR | abierto | src/core/autorrevision.ts:34 | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Reproduccion (la verificacion por impacto de la peticion, 729/729, es del commit a6b1aaf; el HEAD actual abf4fdd solo anade la peticion; no la repeti):

- Compilacion `npm run build`: limpia.
- `node --test` de los 6 ficheros afectados (regla-4d core, finish-regla-4d, skills/regla-4d, revisores, tamanos, autorrevision): 51 tests, 51 pass, 0 fail.
- Mutacion 1 (en `dist`, restaurado con `git checkout`): quitar `|| v === VALOR_PLANTILLA_4D` de `faltasRegla4D` pone en rojo 2 de 4 tests de `regla-4d.test.js`. La red discrimina.
- Mutacion 2: neutralizar `deps.onAviso?.(aviso4D)` en `finish.js` pone en rojo 1 de 2 tests de `finish-regla-4d.test.js` (el de "sin la seccion: avisa").
- Auditoria: comprobado en el codigo que existen y dicen lo que dice `docs/auditoria-4d.md` los casos A1 (`metricas.ts:513-518` guarda la ultima linea suite verde por tarea; `crecimiento-suite.ts:78-98` usa todas), A2 (`versiones-metricas.ts:104-114` repite mediana y maximo de `crecimiento-suite.ts:71`), A3 (`crecimiento-suite.ts:52` y `:58`, misma regex de pytest), A4 (`review.ts:1308-1316`), A5 (`PUERTAS_VERIFICACION` solo se usa en su definicion y en `metricas-puertas.test.ts:42`, que asevera su propio valor). Las tareas de seguimiento TASK-138, 139 y 140 existen en `00-planificadas`.

### MEN-1 — `faltasRegla4D` acepta cualquier texto como valor de una D

`faltasRegla4D` solo rechaza la D ausente, vacia o con el valor literal de la plantilla. Reproducido:
`faltasRegla4D('## Regla 4D\n\n- Duplicacion: xyz\n- Desviacion: n/a\n- Diluvio: -\n- Disfraz: TODO\n')` devuelve `[]` (sin aviso). El mensaje y revision.md dicen "cumple o el ID del hallazgo", pero un valor como `TODO` pasa por completo. El aviso no bloquea y el revisor es una persona o agente, asi que es de bajo impacto; se podria exigir `cumple` o un ID `[A-Z]+-\d+` (el ID del hallazgo) con un test que lo discrimine. Es la propia Regla 4D de disfraz aplicada al control nuevo, pero el aviso cubre el caso real (esqueleto sin tocar), por eso MENOR.

### MEN-2 — la anotacion `- 4D — <commit>` de la autorrevision no se comprueba

El criterio 3 pide que la exigencia de `start` "quede anotada en `## Autorrevision`". `avisoAutorrevision` solo mira que la seccion tenga contenido (su texto ahora menciona la linea 4D); si falta la linea `- 4D — ...` y existe cualquier otra, no hay aviso. `test/skills/regla-4d.test.ts` solo comprueba que el texto de la skill diga lo exigido. Es el mismo patron de disfraz que la auditoria senala en B1 (criterio que no pone rojo nada si se quita). Decision razonable de alcance (el plan no pedia verificarla y finish ya avisa de la seccion vacia), por eso MENOR y origen `plan`; se deja anotado, no hace falta corregirlo en esta tarea.

## Regla 4D

- Duplicacion: cumple (reutiliza `rangoDeSeccion` y `normalizarCelda`; la definicion vive solo en revision.md y las revisoras remiten a ella; sin helper duplicado encontrado)
- Desviacion: cumple (todo el diff pertenece a los cuatro criterios; el cambio de `revisores.test.ts` es de una linea y acompana a la nueva seccion; la auditoria es solo lectura)
- Diluvio: cumple (unas 55 lineas de logica y 4 tests; los ejemplos por revisora son unas diez lineas cada una, proporcionados)
- Disfraz: MEN-1, MEN-2

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts` (`rangoDeSeccion`): para comprobar como delimita la seccion (bloques de codigo, encabezados) la funcion que usa `faltasRegla4D`.
- `taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts`, `src/core/versiones-metricas.ts`, `src/commands/metricas.ts`, `src/core/registro-puertas.ts`, `test/core/metricas-puertas.test.ts`: para comprobar la muestra de fichero:linea citada en `docs/auditoria-4d.md` (lo pedia el encargo).
- `taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js` y `dist/src/commands/finish.js`: solo para mutar y restaurar (`git checkout`); el arbol quedo limpio.
- `tareas/00-planificadas/TASK-138..140`: solo comprobar que existen.
