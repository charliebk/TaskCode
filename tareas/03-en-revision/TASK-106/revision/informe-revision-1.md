# Informe de revision — TASK-106 (ronda 1)

- Commit revisado: 3c2c50c00aeb0dfc9b48288b37045af942a70650
- Revisor: general-purpose (sonnet) con code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts (guarda `isWorkspaceClean` de `puertaSelectiva`, ~l. 359-365) / test/commands/finish-parcial.test.ts | implementacion |
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts (`anotarLineaUnica` + `anotarCompletaTrasParcial`) | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts (`motivoDeLaCompleta` local) y src/fs/decision-documentacion.ts (`motivoDeLaCompleta` exportada) | implementacion |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts (mensaje rojo de la completa, ~l. 197-203) | implementacion |

## Puerta determinista

- Clon temporal de la rama en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-106-r1` (HEAD 34f2091, el commit de la peticion, que solo añade ese fichero sobre 3c2c50c).
- `npm install` y `tsc`: sin errores.
- `npm test` (una vez): 2207 tests, 2203 pasan, 3 fallan, los tres conocidos de Windows (symlink `EPERM` en approve; chmod en NTFS en plan; CRLF en plan). Ningun cuarto rojo ni EBUSY.
- Sin linter configurado en el plugin; la puerta fue compilacion mas suite.
- `finish-parcial.test.js` solo: 14/14 en verde.

## Mutantes sobre las guardas nuevas

Contra `finish-parcial.test.js` y `verificacion-proporcional.test.js`.

| Mutante | Resultado |
|---|---|
| A. Quitar el `if (!isWorkspaceClean)` de `puertaSelectiva` | **SOBREVIVE: 0 tests rojos** (IMP-1) |
| B. `verificarConMemo` sin el filtro `memoSoloVerde` | Muerto ("un rojo o un corte guardados no se reutilizan") |
| H. `puertaSelectiva` sin `memoSoloVerde: true` | Muerto (mismo test) |
| D. Hotfix con `permitirSelectiva: true` | Muerto ("un hotfix con codigo en rutas parciales corre la completa") |
| E. `anotarCompletaTrasParcial` siempre devuelve el cuerpo | Muerto ("un reintento que acaba en la completa lo anota...") |
| G. No bloquear con la selectiva en rojo | Muerto ("con la selectiva en rojo no integra...") |
| I. `textoDeLaCompleta` sin la rama del nivel 2 | Muerto ("el rojo de la completa dice por que no basto la selectiva") |
| J. No anotar tras el verde | Muerto (primer test) |
| K. `RAMA_BASE` equivocada | Muerto (primer test) |
| C. Quitar el caso `selectiva` de `puertaCobertura` | No compila (TS2339: `inicioMs`); ademas test dedicado de cobertura omitida |

## Reproduccion de cada hallazgo

### IMP-1 — La guarda «la selectiva dejo el arbol sucio» no tiene ningun test

`puertaSelectiva` lanza `FinishCommandError` si `isWorkspaceClean` es falso tras un verde. Sustituir `if (!isWorkspaceClean(o.cwd)) {` por `if (false) {` y recompilar: 0 fallos. Sin la guarda, si la selectiva escribe un fichero versionado o no ignorado, finish anotaria, commitearia solo `tareas/<id>` y llamaria al script de Git-Flow con el arbol sucio, que aborta con un error menos claro. Correccion pedida: un test en que la selectiva sale 0 pero deja un fichero sin ignorar, esperando `FinishCommandError` con /ha dejado cambios en el arbol de trabajo/, develop sin moverse y sin seccion `## Verificacion parcial`. Origen `implementacion`: el plan decia «el arbol limpio despues, como en :185-191» pero su plan de pruebas no lo lista.

### MEN-1 — La constancia de un reintento puede quedar mintiendo (selectiva, completa, selectiva)

Con `dist/src/core/transiciones.js`: `anotarVerificacionParcial(b, '2026-11-10', 'npm test', 'todo en src', 'node sel.js')`, luego `anotarCompletaTrasParcial(b, '2026-11-11', 'npm test', '... lib/u.ts')`, luego otra vez `anotarVerificacionParcial` con los mismos argumentos de la primera y fecha 2026-11-12. La seccion queda con dos lineas y la ultima dice «este intento exige la completa»: el tercer intento, que cerro con la selectiva en verde, no deja linea porque `anotarLineaUnica` ve la primera con el mismo texto. Caso estrecho, pero es lo que el modo 6 de riesgos queria evitar. Sugerencia: comparar solo con la ultima linea de la seccion, o aceptarlo y documentarlo.

### MEN-2 — Dos `motivoDeLaCompleta` distintas para el mismo hecho

`finish-verificacion.ts` define una `motivoDeLaCompleta` local («un hotfix integra...» para `selectiva`) y `fs/decision-documentacion.ts` mantiene la exportada con el mismo nombre y otra semantica, que usa el guardian. No falla hoy (el guardian aun no acepta la selectiva, B5), pero quien importe una por otra cambia el mensaje sin que nada falle. Sugerencia: renombrar la local.

### MEN-3 — «No se ha tocado nada» tras un commit de anotacion

En el reintento que acaba en la completa se commitea `reintento con verificacion completa` antes de ejecutarla; si sale en rojo, el mensaje sigue diciendo «No se ha tocado nada», pero la rama ya lleva ese commit. Misma imprecision que la via de documentacion (TASK-100); no es regresion nueva.

## Comprobaciones sin hallazgo

- Criterios 1-6: cada uno con su test; los mutantes B, D, E, G, H, I, J y K los ponen en rojo.
- El verde selectivo no escribe el memo de la completa (test con `git rev-parse --git-path`).
- Memo del Stop reutilizado sin reejecutar; filtro de rojo/cortado cubierto (mutante B).
- Expectativa cambiada en `finish-documentacion.test.ts` (TASK-105: de completa a selectiva): es el cambio que pide la tarea, sigue aseverando contadores reales e integracion. No se debilito ningun test.
- Hotfix a la completa conservando su camino de documentacion; release sin `ramaBase`, a la completa.
- Seguridad: `decision.comando` sale de la config de la base; `RAMA_BASE` lo impone `verificarConMemo`. Sin entrada externa nueva sin filtrar.

## Lecturas fuera del contexto permitido

- `src/core/verificacion-proporcional.ts` — `decidirVerificacion` y los tipos que consumen las guardas.
- `src/fs/verificacion.ts` — `verificarConMemo` y el memo; el diff solo mostraba la linea tocada.
- `skills/task-workflow/revision.md` (plugin 0.14.0 en la cache) — lo pide la skill revisora.
- `src/commands/finish-cobertura.ts` y `src/commands/finish.ts` — comprobar que ningun otro consumidor de `ResultadoPuerta` necesitaba el caso `selectiva`.

La carpeta de pruebas, la copia para mutantes y el log se borraron al terminar, tras comprobar que no habia nada que conservar.
