# Informe de revision — TASK-111 (ronda 1)

- Commit revisado: d2615c58a89baa43223bebdb47ae6bd93b53772d
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts:282 | plan |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts:504-511 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-registro.test.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Verificacion hecha

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-111-r1`, rama de la tarea, `npm install` y `npm run build` sin errores. (El clon quedo en el commit de la peticion, 13c9d37, que solo anade la peticion sobre d2615c5.)
- La peticion trae la verificacion de la ronda en verde para d2615c5 (selectiva, 868 tests, 0 fallos): se cita y no se repite. Corri solo los afectados: `freno-registro`, `registro-puertas`, `metricas`, `metricas-finish` = 51 tests, 51 en verde.
- Mutantes sobre `dist/` (restaurado tras cada uno). Con la suite afectada:

| Mutante | Resultado |
|---|---|
| M1 no guardar el ultimo verde | ROJO (`freno-registro`: sin cambios no ejecuta ni escribe) |
| M2 no anotar el omitido temprano | ROJO (el mismo test) |
| M3 contar los omitidos como ejecuciones en `resumirFreno` | ROJO (`registro-puertas`) |
| M7 no anotar el rojo | ROJO (3 tests de `freno-registro`) |
| M9 `esUltimoVerde` siempre false | ROJO |
| M10 duracion del omitido distinta de 0 | ROJO |
| M4 guardar el ultimo verde aunque la verificacion cambie el arbol | VERDE (sin test) |
| M5 un verde del memo compartido anotado como `verde` en vez de `omitido` | VERDE (sin test) |
| M6 `leerRepoMetricas` sin pasar `freno` a `calcularFila` | VERDE (sin test) |
| M8 `esUltimoVerde` sin comparar `tipo` | VERDE (sin test; la huella ya distingue tipos por comando y contexto, es una defensa redundante) |

  M1 y M2 se corrieron ademas con la suite afectada completa (incluidos `freno-stop*`, `metricas-finish`, los tres de `commands/metricas*`), con el mismo resultado.
- Criterios de aceptacion: 1 (linea con instante, modo, duracion y resultado bajo `.git/taskcode`), 3 (huella igual al ultimo verde no ejecuta ni escribe salida, tambien con arbol sucio) y 4 (puerta `freno`, resultados verde/rojo/omitido/excedido reservado) cubiertos y discriminan. El 2 solo a nivel de columna (ver IMP-2).
- No he medido el coste de calcular la huella del arbol una vez mas en cada turno que si ejecuta (`huellaDelArbol` en el paso 8a y otra vez dentro de `verificarConMemo`): no es hallazgo, solo queda dicho.

## Reproduccion de los hallazgos

### IMP-1 — un rojo servido del memo compartido se anota como `rojo` y cuenta como ejecucion

`freno-stop.ts` anota `omitido` solo para el verde de memo (`anotar(deMemo ? 'omitido' : 'verde', ...)`). Un rojo que sale del memo compartido de la completa (que se guarda aunque el arbol este sucio) no ejecuta nada, pero cae en `anotar('rojo', duracionS)` y `resumirFreno` lo cuenta en `freno_n`, cuya definicion en el codigo y en `docs/registro-puertas.md` es «veces que el freno ejecuto de verdad la verificacion».

Reproduccion (test temporal en el clon, adaptado de `freno-registro.test.ts`: completa, desenlace `ko`, un cambio en `src/app.ts`, dos llamadas seguidas a `decidirStop` sin tocar nada):

```
PROBE ejecuciones reales: 1 lineas: [["rojo",1],["rojo",0.3]]
```

El comando corrio una vez; el registro tiene dos `rojo` y `taskctl metricas` mostraria `freno_n = 2`. Es el caso normal de un agente que para dos veces seguidas sin arreglar el rojo. Ningun test lo cubre: el test «tras un rojo...» usa la selectiva, donde no hay memo con el arbol sucio. Correccion posible: anotar `omitido` siempre que `deMemo` sea true (tambien en rojo, el bloqueo no cambia) o documentar y probar que el rojo de memo cuenta. Origen `plan`: el plan solo hablaba del verde de memo.

### IMP-2 — el cableado de `taskctl metricas` hacia el registro real no tiene ningun test

Criterio 2: «taskctl metricas muestra por tarea cuantas veces corrio el freno y su tiempo total, con — sin dato (test)». Los tests nuevos prueban `resumirFreno` y las columnas con un `calcularFila({ freno })` construido a mano, y las demas con el caso sin dato. Nada ejecuta `leerRepoMetricas` / el comando con lineas `freno` en `puertas.log`. Mutante M6 (`freno: null` en lugar de `frenoPorTarea.get(...)`): los 4 ficheros afectados siguen en verde, de modo que `freno_n` y `freno` podrian salir siempre `—` sin que ningun test lo note. La sincronizacion si tiene su equivalente en `test/commands/sincronizacion-fases.test.ts`. Correccion: un test por CLI (o `leerRepoMetricas`) que anote lineas `freno` en el repo temporal y compruebe la fila de la tarea.

### MEN-1 — dos protecciones nuevas sin test que se ponga rojo al quitarlas

- M4: guardar el ultimo verde aunque la propia verificacion haya cambiado el arbol (`!cambioElArbol`). Quitar la condicion deja todo en verde; el efecto real seria omitir el turno siguiente con una huella tomada antes de que la verificacion ensuciara el arbol.
- M5: que el verde servido del memo compartido se anote `omitido` y no `verde` (lo documenta `registro-puertas.md`). Sin test.

(M8, la comparacion de `tipo`, es redundante con la huella y no se reporta.)

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts` (`huellaDelArbol`, `contextoSelectiva`, `verificarConMemo`, `leerMemo`, `guardarMemo`): hace falta para saber cuando el memo compartido se guarda con el arbol sucio y que devuelve `verificarConMemo` (base de IMP-1 y M4/M5).
- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts`: para comprobar que `anotarPuerta` nunca lanza (el freno no se rompe si no se puede escribir el registro).
- `taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts` (solo localizado por grep): para confirmar que la sincronizacion si tiene test de cableado (IMP-2).
