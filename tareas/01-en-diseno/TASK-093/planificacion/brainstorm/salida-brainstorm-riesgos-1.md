# Brainstorm — TASK-093, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

Referencias fichero:línea relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Si una ruta declarada no existe, el guardián deja de vigilar sin decir nada.** El criterio pide que una ruta inexistente aborte la config. Pero el guardián, cuando la config lanza un error, deja pasar el merge (`src/hooks/guardia-merge.ts:88-93`, `catch { continue; }`; la cabecera lo confirma en las líneas 12-13). Escenario: un `npm ci`, un `git clean -fdx` o un clon nuevo sin `exampleData/` o sin `web/node_modules/`. Desde ese momento cualquier `git merge` a develop/main pasa sin verde. A la vez, el freno Stop bloquea todos los turnos con una tarea en curso (`src/hooks/freno-stop.ts:160-167`) y todos los `taskctl` abortan. La existencia se tiene que comprobar al calcular la huella (sin entrada → sin memo → se verifica), no al validar la config. Es un **desacuerdo con el criterio 4 tal como está escrito**.
2. **Un verde de un árbol anterior queda guardado con la huella del árbol nuevo.** `verificarConMemo` guarda el resultado bajo la huella de *después* de la ejecución (`src/fs/verificacion.ts:256-257`), y `finish` hace lo mismo (`src/commands/finish-verificacion.ts:121-123`). Escenario: la completa del Stop tarda 27 min y mientras corre la persona commitea desde otra terminal o actualiza `exampleData/`; el verde del árbol viejo queda con la huella nueva. Hoy solo se fía de él el guardián; con este cambio también `finish`. Mitigación: guardar solo si la huella de antes y la de después coinciden (ya existe `cambioElArbol`).
3. **Puede caer la puerta de cobertura, o dar un falso verde.** `puertaCobertura` exige que el informe lcov sea posterior a `inicioMs` (`src/commands/finish-cobertura.ts:101`), que es el `Date.now()` de este finish (`src/commands/finish-verificacion.ts:117`). Con `inicioMs = ahora`, todo finish con `umbral_cobertura` aborta con «no la ha regenerado»; con el inicio del verde guardado (el memo solo tiene `fecha` y `duracionMs`), se mide un informe que ha podido reescribir la selectiva, el held-out o una ejecución manual parcial (`finish-cobertura.ts:3-5`). Con umbral declarado no se debería reutilizar, o la ruta del informe tendría que entrar en la huella.
4. **Falso verde por entradas que la huella no ve**: entorno (`NODE_ENV`, `CI`, `DATABASE_URL`), versión de herramientas (Node con nvm), ignorados no declarados (`.env`, cachés, `dist/`). La huella solo lleva HEAD, comando, timeout y lo sucio (`src/fs/verificacion.ts:127-130`). Residual y sin arreglo completo: la salida y la documentación tienen que decirlo.
5. **Contenido que cambia sin cambiar tamaño ni mtime**: `tar -x`, `unzip`, `cp -p`, `robocopy /COPY:T`, OneDrive conservan el mtime; FAT/exFAT y algunos recursos de red van a 2 s; `mtimeMs` es float y un redondeo distinto en Windows y Linux cambia la huella. Documentar que (ruta, tamaño, mtime) es una heurística.
6. **Carpetas enormes y symlinks**: `node_modules/` completo son 100k+ ficheros; con Defender, el `stat` uno a uno en NTFS tarda decenas de segundos y el guardián tiene 30 s (`hooks/hooks.json:54`) [supuesto: Claude Code deja pasar el comando si el hook agota su timeout]. Con pnpm hay symlinks y junctions: con `stat`, ciclos o salida del repo; con `lstat`, cambia el destino sin que la huella lo vea. La validación de rutas es textual (`src/core/config.ts:772-774`).
7. **`finish` podría reutilizar un rojo**: `verificarConMemo` reutiliza verdes y rojos (`src/fs/verificacion.ts:245-246`). `finish` solo tiene que aceptar `estado === 'verde'`.

## Estados intermedios y fallos parciales

- JSON del memo cortado: `leerMemo` lo trata como ausente (`src/fs/verificacion.ts:177`); benigno.
- Si la verificación toca una entrada declarada (`npm install` en `pretest` escribe `node_modules/.package-lock.json`, o `coverage/` declarada), la huella se mueve en cada ejecución y el memo no casa nunca: benigno pero anula la mejora sin avisar; habría que detectarlo y avisar.
- Dos memos por diseño (`src/fs/verificacion.ts:40-43`): `finish` y el guardián leen **solo** el de la completa (TASK-091).
- Con `timeout_verificacion` > 3540 s, el Stop guarda la huella con el timeout recortado (`src/hooks/freno-stop.ts:48-49,172`); si `finish` solo prueba el suyo, no reutiliza ese verde. El guardián ya prueba los dos (`src/hooks/guardia-merge.ts:153`).
- Con selectiva declarada, el Stop nunca escribe el memo de la completa (`src/hooks/freno-stop.ts:180-188`): el único verde reutilizable es el de un finish anterior.

## Compatibilidad hacia atras

- **Sin la clave**, `huellaDelArbol` y `huellaDeCommit` (`src/fs/verificacion.ts:127,146`) tienen que quedar idénticas byte a byte, o el guardián bloquea merges que hoy pasan.
- **La tarea que introduce la clave rompe la simetría**: el guardián calcula con la config del árbol activo (develop, sin la clave, `guardia-merge.ts:89-90`) y `finish` guardó con la de la rama; falla hacia cerrado. Igual cuando una rama cambia el listado.
- **Versiones mezcladas del plugin** (hook desde `CLAUDE_PLUGIN_ROOT`, `taskctl` de otra instalación): si cambia la fórmula, subir `VERSION_MEMO` (`src/fs/verificacion.ts:44`) para que un memo v1 se ignore.
- **Mayúsculas**: `existsSync` no distingue en Windows y sí en Linux.

## Vuelta atras

- Reversible: quitar la clave o borrar `.git/freno-verificacion.json`.
- No se deshace un merge hecho con un falso verde: la tarea tiene que dejar escrito que el verde fue reutilizado.
- Falta una salida de emergencia documentada para forzar la verificación (flag o borrar el memo).
- Hoy `finish` no dice nada con un verde (`finish-verificacion.ts:145`). Debe dar una línea de estado: «no se ha ejecutado de nuevo `<comando>`: se reutiliza el verde del `<fecha>` (duró `<X>`), mismo commit `<sha>`, mismas entradas ignoradas declaradas (`<N>` rutas). La huella no cubre variables de entorno, versiones de herramientas ni ignorados sin declarar. Para forzar la verificación: `<cómo>`», y lo mismo abreviado en el guardián y el rastro de la tarea.

## El riesgo que mas te preocupa (UNO solo)

El criterio 4 (ruta inexistente → abortar la config) convierte el estado normal de un proyecto con dependencias (`node_modules` sin instalar, clon nuevo, `git clean`) en tres fallos a la vez: el guardián se abre en silencio (`src/hooks/guardia-merge.ts:91-92`), el Stop bloquea todos los turnos (`src/hooks/freno-stop.ts:160-167`) y todos los `taskctl` caen. Validar la forma en la config, sí; la existencia, al calcular la huella: si falta una entrada, no hay memo y `finish` verifica.

Nota: no se sabe qué ejecución produjo el verde de las 12:01 en ToolsaWeb TASK-295. Si fue manual, no escribió memo y esta tarea no habría evitado la segunda completa: confirmarlo antes de dar por buena la motivación.
