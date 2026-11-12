# Brainstorm — TASK-110, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: brainstorm-testing

## Que es observable sin llamar a ningun agente

No hay enfoque previo, así que respondo sobre lo que piden los criterios de aceptación. Casi todo se puede comprobar desde fuera contra recursos reales: el fichero `.git/taskcode/progreso.json` de un repo temporal, la salida y el código de salida de `taskctl estado`, un `settings.json` dentro de un `configDir` temporal (`doctor` ya acepta `configDir`, en `src/commands/doctor.ts:80`) y la salida de un `node --test` real. Lo que no se puede comprobar sin abrir el código es el estado «en curso» de `plan`, `approve`, `start` y `review`: estos comandos solo dejan rastro al terminar. Hay una excepción, que lo hace observable a mitad de ejecución: el comando de verificación de `finish` y del freno es un script nuestro, así que ese script puede llamar él mismo a `taskctl estado` y guardar lo que ve. Hay que guardarlo fuera del árbol de trabajo (en tmp o en `.git/`), porque si no salta la guarda de «la verificación ensucia el árbol» (`finish-verificacion.test.ts:159`, `freno-stop.test.ts:364`).

Hallazgo que condiciona el diseño (comprobado): `ejecutarAcotado` lanza el comando con `spawnSync` (`src/fs/ejecucion-acotada.ts:132`), así que taskctl queda bloqueado mientras corre la verificación y no puede ir copiando el x/N de `TASKCTL_PROGRESO` a `progreso.json`. O `estado` lee también el fichero de `TASKCTL_PROGRESO`, o hay que cambiar a una ejecución asíncrona. La prueba 4 de abajo detecta esto sea cual sea la opción que se elija.

## Plan de pruebas, cada una con su mutacion

1. Una prueba por comando (`plan`, `approve`, `start`, `review`, `finish`), aprovechando los fixtures que ya existen (`start-fixtures`, `review-fixtures`, `finish-fixtures`). Tras ejecutar el comando, `progreso.json` tiene la tarea, la fase, `terminado: true` y un `inicio` entre t0 y t1, y `taskctl estado` ya no muestra nada en marcha. Mutación: quitar la escritura en uno de los comandos (falta el fichero) o no marcar el final (sigue «en curso»).
2. Un comando que aborta (por ejemplo, una guarda de `start` o una verificación en rojo en `finish`) no deja `progreso.json` «en curso». Mutación: escribir `terminado` solo en el camino feliz, sin `finally`.
3. Un `finish` con un script de verificación que llama a `taskctl estado` y guarda su salida en tmp. Esa salida dice `TASK-NNN · finish · <paso>`, y `inicio` es anterior al instante en que se tomó la instantánea. Mutación: escribir el progreso solo al final; la instantánea saldría vacía.
4. Un script de verificación que escribe `3/10` en `$TASKCTL_PROGRESO` y después ejecuta `taskctl estado`: la salida contiene `3/10`. En el entorno exterior del test hay un `TASKCTL_PROGRESO` falso, puesto a propósito. Mutación: no inyectar la variable, heredar la del entorno, o que `estado` dependa de una copia que el padre bloqueado nunca llega a hacer.
5. `estado` lee solo el fichero. Tras escribir `progreso.json`, se borran `tareas/` y `.taskcode/` y se ejecuta `estado` como subproceso con un `PATH` sin git: la salida tiene que ser idéntica a la de antes. Mutación: leer el título de `tarea.md`, o llamar a `git rev-parse` para encontrar `.git`.
6. El formato de `estado` con `inicio` puesto a hace 125 s da `2 min`. Sin fichero, o con la fase terminada, dice que no hay nada en marcha y sale con 0. Mutación: dividir mal los ms, o salir con 1. El tiempo se mide dentro del proceso, como el mínimo de 5 ejecuciones, por debajo de 200 ms. Ojo: esta medición solo detecta regresiones groseras, como meter un `sleep` o recorrer `tareas/`.
7. `estado --seguir` como subproceso asíncrono: a ~1,5 s se reescribe el fichero con otro paso y a ~3 s se marca como terminado. La salida contiene los dos pasos y el proceso sale solo, con un timeout de 10 s y kill. Mutación: leer el fichero una sola vez (el segundo paso no aparece) o no comprobar `terminado` (se agota el timeout).
8. La status line en `doctor`. Sin el flag, el hash de `settings.json` no cambia y la salida ofrece instalarla. Con el flag, añade `statusLine` con `taskctl estado`, conserva las demás claves y es idempotente al repetirlo. Mutación: no comprobar el flag (cambia el hash) o sobrescribir el JSON entero (se pierde una clave centinela).
9. El reporter de la suite se prueba contra un `node --test` real, sobre 3 ficheros mínimos en tmp, uno de ellos con un `describe` de 2 `it` y otro que falla. La salida va de `[1/N]` a `[N/N]` y nunca supera N; la segunda ejecución muestra el total de la primera; el nombre del test que falla aparece y el código de salida no es 0. Mutaciones: contar suites o tests anidados (sale `[5/4]`), no guardar el total, o tragarse `test:fail`.

## Aserciones trampa que hay que evitar en esta tarea concreta

- Medir los 200 ms lanzando `bin/taskctl` como proceso en Windows: solo arrancar node ya se acerca a esa cifra con la máquina cargada, y el resultado será intermitente. Además, comprobar el tiempo no demuestra que no se lance git; eso lo demuestra el `PATH` sin git (prueba 5).
- Escribir `progreso.json` a mano en los tests de los comandos: si el fixture define el formato, esos tests siguen verdes aunque quien escribe y quien lee se separen. A mano solo se escribe en las pruebas 6 y 7, y siempre a través de un único helper.
- Alimentar el reporter solo con eventos sintéticos: reproducen la forma de los eventos tal como la entiende quien escribió el test. Hace falta al menos una ejecución real (prueba 9).
- Guardar la instantánea del script de verificación dentro del árbol de trabajo: el test acaba fallando por «ensucia», y no por lo que pretende comprobar.
- Usar `assert.ok(salida.includes('TASK-'))`, que pasa con cualquier tarea: hay que exigir el id, la fase y el x/N exactos.
- Usar `sleep` fijos en `--seguir` sin un timeout de kill: si el proceso no sale, el test se queda colgado en lugar de ponerse rojo.

## Que pruebas existentes cambian de expectativa

- `freno-stop.test.ts:144`, `:174` y `:187` comprueban `{ codigo: 0, stderr: '' }` en los casos sin efecto. Siguen valiendo como red de regresión si escribir el progreso no imprime nada. Hay que ampliarlas para que comprueben que, cuando no se ejecuta nada, no aparece ningún `progreso.json`; relajar el `stderr: ''` sería una regresión con permiso.
- Los tests de `doctor` (15 comprobaciones de `codigo`/avisos en `test/commands/doctor.test.ts`, más `:603`, que fija las claves de cada comprobación) se rompen en bloque si la nueva comprobación de la status line es un `aviso`. Ningún repo temporal tiene status line instalada. Para que no cambien, la comprobación tiene que dar `omitida` u `ok`.
- `flags-repetidos.test.ts:12` enumera los comandos: `estado --seguir --seguir` debería entrar en la lista.
- `package.json` `test`: con un reporter propio, el `spec` por defecto y su tabla de `--experimental-test-coverage` desaparecen salvo que se declaren los dos reporters. Ningún test lo comprueba; lo detecta a ojo quien ejecute la suite.

## Como envejece

- El que añada un comando largo no se acordará de escribir el progreso. Para obligarle a decidir, hace falta un test que enumere los comandos del despachador y los compare con una lista explícita de «con progreso» y «exentos».
- La línea de `estado` es una interfaz pública: la status line de la persona la muestra tal cual. Cambiar el separador `·` o el formato `mm min` rompe en silencio. Conviene un campo `version` en `progreso.json` y un único test de formato que sea la fuente de verdad.
- El total de la ejecución anterior no puede vivir en `dist/test`: `limpiar:test` lo borra en cada `npm test` (`package.json:17`). Si se guarda ahí, se pierde y el `/N` desaparece sin que nada se ponga rojo, salvo la segunda ejecución de la prueba 9.
- Cuando se actualice Node pueden cambiar los eventos del reporter (anidamiento, `test:enqueue`, `test:dequeue`); solo la ejecución real de la prueba 9 lo detecta.
- Coste de la suite: unos 9 a 12 tests nuevos de 1 a 4 s en Windows. Las pruebas de `--seguir` (al menos 3 s cada una) se limitan a una o dos. Las pruebas 6 y la parte sintética del reporter van en `test/core` o `test/cli` para que entren en `test:rapido`.

### Desacuerdos previstos y suposiciones

- Con arquitectura: si propone que el padre copie el x/N de `TASKCTL_PROGRESO` a `progreso.json`, choca con el `spawnSync` comprobado; la prueba 4 lo pondrá en rojo.
- Con arquitectura y rendimiento: el arranque en frío de `bin/taskctl` (si importa todos los comandos de forma estática) puede superar 200 ms por sí solo. La prueba dentro del proceso no lo mide, a propósito: si el criterio quiere medir el proceso entero, hay que pedirlo y aceptar que ese test será intermitente en Windows.
- Supuesto sin comprobar: que el código de salida de `node --test` no depende del reporter. Se confirma con la ejecución que falla en la prueba 9.
- Supuesto sin comprobar: el comportamiento en un worktree, donde `.git` es un fichero y quienes escriben usan `git rev-parse --git-path` (`src/fs/verificacion.ts:177`). Si riesgos lo considera en alcance, se prueba con un `git worktree add` real a coste bajo.
- Comprobado: el `.taskcode/config.yml` de TaskCode no declara `comando_verificacion`, así que el `finish` de TaskCode no ejercitará `TASKCTL_PROGRESO` contra su propio reporter.
