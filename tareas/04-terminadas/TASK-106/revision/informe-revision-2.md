# Informe de revision — TASK-106 (ronda 2)

- Commit revisado: e7515d1c6d79b7cad4d2e5a89f81f6926f1f2afa
- Revisor: general-purpose (haiku) con code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts:367 (guarda `isWorkspaceClean` de `puertaSelectiva`) / test/commands/finish-parcial.test.ts (test "IMP-1") | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts:424-433 (`anotarLineaUnica`, compara solo la ultima linea) | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts:283 (`motivoCompletaEnFinish`); src/fs/decision-documentacion.ts:153 sin cambios | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts:201-206 (mensaje rojo de la completa) | implementacion |

Sin hallazgos nuevos. La correccion no abre ningun CRITICO ni IMPORTANTE, y no se ha encontrado ningun fallo introducido por el diff de esta ronda.

### Verificacion de cada hallazgo de la ronda 1

- **IMP-1 — corregido.** Con la guarda, el test "IMP-1" pasa. Mutante A (`if (false)` en vez de `if (!isWorkspaceClean(o.cwd))` en `puertaSelectiva`): el test "IMP-1" se pone rojo (15 pasan, 1 falla); en la ronda 1 sobrevivia.
- **MEN-1 — corregido.** El caso selectiva, completa, selectiva ya no pierde la ultima linea. Mutante B (`anotarLineaUnica` vuelve a comparar con `some` sobre toda la seccion): rojo el test `anotarCompletaTrasParcial (TASK-106, MEN-1)`.
- **MEN-2 — corregido.** La local se llama `motivoCompletaEnFinish`; ninguna referencia a la antigua en `finish-verificacion.ts` (grep). La exportada de `decision-documentacion.ts` sigue siendo la del guardian, sin cambio de semantica. Verificado por lectura y grep (no es comprobable por mutacion).
- **MEN-3 — corregido.** Reintento tras parcial con la completa en rojo: el mensaje dice "No se ha mergeado nada; solo se ha commiteado en la rama la anotacion del intento (sha)". Mutantes C (`commitAnotacion === null` → `true`) y F (no asignar `commitAnotacion`): rojo el test "MEN-3" en ambos.

## Puerta determinista

- Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-106-r2` (HEAD e7515d1), `npm ci` y `tsc --noEmit` sin errores. Sin linter configurado.
- `npm test` (una pasada): 2210 tests, 2205 pasan, 4 fallan:
  - Los tres conocidos de Windows (symlink `EPERM` en approve; chmod en NTFS en plan; CRLF en plan).
  - Un cuarto: `origin (TASK-038): si la lista de ramas del destino expira, el mirror aborta y no borra nada` (`test/gitflow/origin-deteccion`). Sin relacion con el diff (no toca origin). El fichero solo: 5/5 en verde; intermitente por carga (15 s). Registrado para que el orquestador lo confirme; no es hallazgo de esta ronda.
- `finish-parcial.test.js` y `verificacion-proporcional.test.js` en el clon: 29/29.

## Mutantes

| Mutante | Resultado |
|---|---|
| A. Guarda IMP-1 anulada (`if (false)`) | Muerto: falla "IMP-1" |
| B. `anotarLineaUnica` compara con toda la seccion | Muerto: falla "MEN-1" |
| C. `commitAnotacion === null` forzado a `true` | Muerto: falla "MEN-3" |
| F. `commitAnotacion = a.commit` eliminado | Muerto: falla "MEN-3" |

## Busqueda del fallo que abre la correccion

- **Guarda IMP-1**: va tras el verde y antes de anotar; con el arbol sucio no hay commit ni cambio en `develop`. `finish` ya exige el arbol limpio antes de la puerta (`finish.ts:380`), asi que solo salta por lo que deja la selectiva; el memo solo se guarda con el arbol limpio.
- **Ultima linea de `anotarLineaUnica`**: la usa tambien la seccion de documentacion (`transiciones.ts:376`). Cambio intencionado: "documentacion A, B, A" ahora anota la tercera vez. Ningun test lo contradice.
- **Mensaje MEN-3**: solo cambia con `commitAnotacion` no nulo, y ese commit existe en la rama.
- **Renombrado MEN-2**: sin uso residual.

## Notas (no son hallazgos de la tabla)

- La rama `commitAnotacion === null` dice "No se ha tocado nada" tambien si `anotarYCommitear` escribio `tarea.md` y `autoCommit` no devolvio commit (`finish-verificacion.ts:318-326`). Misma imprecision que la via de documentacion; no reproducido (no hay caso real conocido). MENOR, pre-existente, no abre ronda.
- Node reporta los temporales del clon bajo `AppData\Local\Packages\Claude_...\LocalCache`; no afecta al resultado.

## Lecturas fuera del contexto permitido

- `src/fs/verificacion.ts` — cuando se guarda el memo selectivo.
- `src/fs/git.ts` — `isWorkspaceClean`.
- `src/fs/git-commit.ts` — `autoCommit`, para la nota de MEN-3.
- `src/commands/finish.ts` — guarda de arbol limpio previa (linea 380).
- `src/fs/decision-documentacion.ts` y `src/hooks/guardia-merge.ts` — solo grep, uso de `motivoDeLaCompleta` tras el renombrado.
- `test/commands/finish-parcial.test.ts` lineas 1-110 — el arnes, para comprobar que el test IMP-1 no es vacuo.

No se leyo `tarea.md` ni `planificacion/`. El clon, la carpeta de mutantes y el log se borraron tras comprobar que no habia nada que conservar.
