# Informe de revision — TASK-111 (ronda 2)

- Commit revisado: 0f490498db5d4b8ffb9754a0402fb10f11ab22cb
- Revisor: code-quality-reviewer (revisor independiente, verificacion acotada a las correcciones de la ronda 1)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts:285 | plan |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts (test nuevo de cableado de `metricas`; `src/commands/metricas.ts:507-511`) | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-registro.test.ts (dos tests nuevos; `src/hooks/freno-stop.ts:243`) | implementacion |

No hay hallazgos nuevos. La correccion no abre ningun fallo en el diff de la ronda.

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Verificacion hecha

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-111-r2`, rama de la tarea. La punta del clon es 000629b (el commit de la peticion de la ronda 2), que solo anade ficheros de `tareas/` sobre 0f49049: el codigo es identico al de 0f49049. `npm install` y `npm run build` sin errores.
- Tests dirigidos sobre el codigo corregido, con los cuatro ficheros pedidos (`freno-registro`, `sincronizacion-fases`, `registro-puertas`, `freno-stop`): 39 tests, 39 en verde, 0 fallos.
- La suite de verificacion del commit 0f49049 la cita la peticion (`verificar-impacto`, 870 tests, 0 fallos, codigo 0). No la repito; corri solo los tests que verifico.
- Mutantes sobre `dist/` del clon, cada uno con la suite dirigida completa. Tras cada uno se restauro el fichero y se comprobo que volvia al original:

| Mutante | Fichero | Resultado |
|---|---|---|
| Anotar `rojo` en el rojo de memo (quitar el `deMemo` del rojo) | `dist/src/hooks/freno-stop.js` | ROJO: `freno (TASK-111, IMP-1)` |
| Quitar `&& !cambioElArbol` del guardado del ultimo verde | `dist/src/hooks/freno-stop.js` | ROJO: `freno (TASK-111, MEN-1): un verde que cambia el arbol...` |
| Anotar `verde` en el verde de memo | `dist/src/hooks/freno-stop.js` | ROJO: `freno (TASK-111, MEN-1): un verde servido del memo...` |
| `freno: null` en la fila de `metricas` | `dist/src/commands/metricas.js` | ROJO: `metricas (TASK-111, criterio 2; IMP-2)` |

- Limpieza: el clon y los ficheros temporales de la revision se han borrado. En el repo real no se ha escrito nada salvo este informe; no se ha ejecutado `taskctl` ni ningun git que escriba.

## Reproduccion de los hallazgos

### IMP-1 — corregido

La correccion anota `omitido` cuando `deMemo` es true, tambien en rojo (`freno-stop.ts:285`). El bloqueo no cambia: el `return bloquear(...)` sigue tras la anotacion, y el aviso de memo se mantiene. Ademas, `resumirFreno` (`core/registro-puertas.ts`) excluye `omitido` del recuento de ejecuciones, asi que `freno_n` ya no cuenta el rojo servido del memo.

Verificado: el test nuevo `freno (TASK-111, IMP-1)` pasa. Comprueba que la segunda llamada sigue dando codigo 2, que el comando corre una sola vez y que el registro queda `['rojo', 'omitido']`. El mutante que vuelve a anotar `rojo` lo pone en rojo.

No hay otros consumidores de `PUERTA_FRENO` ni de `omitido` que cambien de comportamiento con esto (`roadmap.ts` filtra avisos de `omitido` de otra puerta, no del freno).

### IMP-2 — corregido

El test nuevo `metricas (TASK-111, criterio 2; IMP-2)` escribe lineas `freno` en el registro real del repo temporal y ejecuta el CLI `taskctl metricas` (en el mismo test, `spawnSync`). Comprueba que la fila de TASK-920 muestra `freno_n` = 2 (el `omitido` no cuenta) y `freno` = `2m` (60 + 65 s). El test sin datos comprueba que, sin lineas, las dos columnas salen con `—`.

Verificado: el mutante `freno: null` en `metricas.js` deja la suite en rojo. Antes de la correccion no lo estaba.

### MEN-1 — corregido

- M4 (`!cambioElArbol`): el test `freno (TASK-111, MEN-1): un verde que cambia el arbol no se guarda como ultimo verde` comprueba que, si la verificacion ensucia el arbol, no se escribe `freno-ultimo-verde.json`; y, en el mismo test, que un verde normal si lo escribe. Quitar la condicion lo pone en rojo.
- M5 (verde de memo anotado como `verde`): el test `freno (TASK-111, MEN-1): un verde servido del memo compartido se anota omitido` lo pone en rojo.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts` (lineas 495-520, para ver el cableado de `frenoPorTarea` en `calcularFila`): hace falta para verificar IMP-2.
- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts` (solo grep de `deMemo`, lineas 239, 295 y 310): para confirmar que `deMemo` es true solo cuando la verificacion sale del memo compartido, y que ese memo devuelve `cambioElArbol: false`.
- `taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts`, linea 37 (formato de la duracion): solo para la nota de abajo.

## Nota (no es hallazgo)

- `docs/registro-puertas.md` dice que `duracion_s` vale `0.0` cuando se omite. Un `omitido` servido del memo (verde o rojo) registra el tiempo medido de esa consulta, redondeado a un decimal (`core/registro-puertas.ts:37`). En la practica sale `0.0`, pero no esta garantizado si la lectura del memo tarda mas de 50 ms. Ya pasaba con el verde de memo antes de esta ronda; la correccion solo extiende el mismo patron al rojo. Es cosmetico y no afecta a `freno_n`; queda dicho para quien mantenga la doc.
