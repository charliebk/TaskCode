# Brainstorm — TASK-110, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: brainstorm-riesgos

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **Una función cosmética tumba la puerta de verdad.** Es el minuto 28 de la verificación de `finish` en ToolsaWeb. `renameSync(tmp, progreso.json)` devuelve `EPERM`/`EBUSY` porque en ese instante la status line o `estado --seguir` tienen el fichero abierto, o porque el antivirus lo está escaneando. Si esa excepción sube, `finish` aborta con la verificación ya en verde, o el freno Stop se cae con un error. Hoy el patrón tmp+rename existe en `src/fs/coste-pendiente.ts:110-112`, pero va dentro de un `catch` que se lo traga todo. Mitigación: ninguna escritura de progreso puede lanzar ni reintentar en bucle; si falla, se pierde ese tic y nada más.
- **El fichero `TASKCTL_PROGRESO` cae dentro del árbol y `review` aborta.** `verificarConMemo` calcula la huella antes y después de ejecutar, y esa huella incluye los no trackeados (`src/fs/verificacion.ts:287,301-303`). `review.ts:1124` lanza `ReviewCommandError` cuando `cambioElArbol` es true, y `freno-stop.ts:232` avisa. Una ruta temporal relativa a la raíz, o un fichero de «total anterior» del reporter guardado en el repo, cambia la huella e invalida la ronda. La ruta tiene que vivir bajo `git rev-parse --git-path` o fuera del repo.
- **«En curso» para siempre.** Claude Code mata el hook Stop al llegar a su `timeout: 3600` (`hooks/hooks.json:13`) o con Esc; también un Ctrl+C sobre `finish`, o un cierre de la consola. En todos esos casos nadie marca «terminado». La status line sigue diciendo «verificando · 340 min» y `estado --seguir` no sale nunca. Mitigación: guardar pid e instante, y que el lector lo declare «interrumpido» si el pid no está vivo o se pasa del timeout. En Windows los pid se reutilizan, así que el pid solo no basta (supuesto, sin medir).
- **`estado --seguir` invocado por el agente.** El agente lo lanza desde Bash, sin TTY: bloquea la herramienta hasta 28 min y vuelca unas 1 700 líneas al contexto. Es justo el gasto de tokens que la tarea quiere quitar. Mitigación: sin TTY, `--seguir` imprime una sola línea, o se niega a correr.
- **doctor pisa la status line que el usuario ya tenía.** Hoy doctor solo lee `settings.json` (`src/fs/sondas-hooks-claude.ts:12-14`, «sin escribir nada»), así que esto sería su primera escritura en ficheros de terceros. Claude Code puede estar reescribiendo el mismo fichero a la vez (`/permissions`, por ejemplo) y se perdería esa actualización. Mitigación: no sustituir nunca un `statusLine` que ya existe sin un flag aparte, guardar copia y escribir con tmp+rename.
- **La status line apunta a una ruta que deja de existir.** Si el comando instalado lleva la ruta del `dist/` del plugin, al actualizar el plugin esa carpeta cambia (`verificacion.ts:17` lo dice expresamente) y la barra se queda vacía o con error sin avisar. Si se instala en el `settings.json` de usuario, corre en todos los repos, sean TaskCode o no.
- **Un tercero escribe en `TASKCTL_PROGRESO` lo que quiere.** El script de verificación del proyecto escribe sin atomicidad: el lector ve JSON a medias o texto con secuencias ANSI o `\r` que acaban pintadas en la barra de Claude Code. Además, los procesos hijos heredan la variable: los tests que lanzan `taskctl` en repos temporales podrían escribir en el fichero de la sesión real. Mitigación: leer de forma tolerante, filtrar caracteres de control, recortar la longitud y no exportar la variable más allá del comando de verificación.

## Estados intermedios y fallos parciales

- Dos escritores a la vez con último-gana: el Stop de una sesión y un `review` lanzado a mano desde una terminal en el mismo árbol, o dos sesiones (lo que `cadena.lock` en `src/commands/cadena.ts` intenta evitar, aunque solo dentro de una cadena). Sin un identificador de ejecución, el «terminado» de uno borra el «en curso» del otro.
- Verificación servida desde el memo (`deMemo: true`, `verificacion.ts:289-290`): «inicio» y «terminado» llegan con milisegundos de diferencia. El fichero tiene que acabar en «terminado», no en un «verificando 0/N» huérfano.
- Worktree enlazado: el criterio fija `.git/taskcode/progreso.json`, pero los demás ficheros de estado se resuelven con `--git-path`, que es propio de cada worktree (`git.ts:104-112`). Además, `estado` «sin lanzar git» tiene que interpretar el fichero `.git` (`gitdir: ...`) y subir desde un subdirectorio. Si escritor y lector resuelven rutas distintas, el resultado es «nada en marcha» con la verificación corriendo.
- Fase B (`npm test`): si el reporter falla, puede ocultar el detalle de los fallos. Y si pinta `[x/N]` con `\r` también cuando la salida no es un TTY, llena de ruido la cola de 16 KB que lee el informe de verificación (`verificacion.ts:36`).

## Compatibilidad hacia atras

- `.git/taskcode/` ya contiene memos, `cadena.lock`, el libro de costes y `gitflow/`. Un fichero nuevo no choca con ninguno, pero ninguna limpieza existente debe borrarlo, ni este cambio puede borrar los otros.
- Una tarea abierta antes de actualizar no tiene `progreso.json`, así que `estado` dirá «no hay nada en marcha» aunque haya una tarea en curso. Puede pasar si se acepta y se dice; no puede pasar sin que se sepa.
- Una sesión de Claude Code abierta con la versión anterior sigue ejecutando los hooks viejos, que no escriben progreso (supuesto, no comprobado cómo recarga Claude Code los hooks de un plugin actualizado).
- El reporter va dentro del `dist/` que se publica: no puede mencionar TaskCode (hay tests que lo comprueban) y no debe cambiar el código de salida de `npm test`.

## Vuelta atras

- Revertir el código deja un `progreso.json` huérfano bajo `.git/`. No hace daño: no se versiona y no entra en la huella.
- Lo que no se deshace solo es la status line ya instalada en `settings.json`: después de revertir apunta a un `taskctl estado` que ya no existe y muestra el error en cada refresco. Hace falta una desinstalación en doctor desde el primer día.
- Si doctor sustituyó una status line anterior sin guardar copia, esa configuración del usuario no se recupera. Es el único punto sin retorno del cambio.

## El riesgo que mas te preocupa (UNO solo)

- Que escribir el progreso quede dentro del camino crítico de `finish`, `review` y el freno Stop, y que un fallo propio de Windows (un `EPERM` en el rename mientras otro lo lee, o el antivirus) o una ruta dentro del árbol (`cambioElArbol` lleva a la excepción de `review.ts:1124`) aborte o invalide una verificación de 28 min por una función que solo sirve para mirar. Todo lo que escribe progreso tiene que fallar en silencio y fuera del árbol.

Supuestos sin verificar: que `node --test` decide el código de salida sin depender del reporter; que Claude Code no recarga los hooks de un plugin actualizado en una sesión ya abierta; que el pid basta para detectar un proceso muerto en Windows.

Ficheros consultados: `src/fs/verificacion.ts`, `src/commands/review.ts`, `src/hooks/freno-stop.ts`, `src/fs/coste-pendiente.ts`, `src/commands/cadena.ts`, `src/fs/git.ts`, `src/fs/sondas-hooks-claude.ts`, `hooks/hooks.json`, `package.json`.
