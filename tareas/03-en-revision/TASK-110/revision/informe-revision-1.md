# Informe de revision — TASK-110 (ronda 1)

- Commit revisado: 4cb0f1a295713dc33b4d707670d7a2a209d7a8c5
- Revisor: code-quality-reviewer (agente revisor independiente, general-purpose, modelo sonnet)
- Veredicto: aprobada con correcciones

Veredicto propuesto por el revisor: aprobada-con-correcciones. Con un IMPORTANTE abierto (IMP-1) se escribe cambios-solicitados.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/cli.ts:412 (`delete process.env[VARIABLE_PROGRESO]`); test/commands/progreso-verificacion.test.ts | implementacion |
| MEN-1 | MENOR | corregido | src/commands/finish-verificacion.ts:253 y :363; src/commands/review.ts:640; test/commands/progreso-verificacion.test.ts, progreso-comandos.test.ts | implementacion |
| MEN-2 | MENOR | corregido | src/fs/status-line.ts (`instalarStatusLine` / `desinstalarStatusLine`, fichero `statusline-previa-taskctl.json`) | implementacion |
| MEN-3 | MENOR | corregido | src/fs/status-line.ts (`obj['statusLine'] = { type: 'command', command: comando }`) | implementacion |
| MEN-4 | MENOR | corregido | README.md (§ Progreso visible) y src/hooks/freno-stop.ts (`terminar('abortada')`) | implementacion |
| MEN-5 | MENOR | aceptado | src/fs/progreso.ts `escribirAtomico`, usado por src/fs/status-line.ts sobre settings.json | implementacion |
| MEN-6 | MENOR | corregido | src/cli.ts (uso de `estado` y de `doctor`), src/commands/doctor.ts (mensaje de `sobra`) | implementacion |
| MEN-7 | MENOR | aceptado | src/fs/status-line.ts `buscarTaskctl` / `dentroDe` | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Aceptado por el plan, no es hallazgo: un proceso muerto (Ctrl+C, kill, timeout del hook) deja el progreso «en marcha» para siempre; la Decision (f) de plan-final.md lo dejo fuera a proposito. Con `--seguir` en una terminal real, esa fase colgada no termina nunca (solo con Ctrl+C).

## Reproduccion del entorno

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-110-r1`, rama `feature/task-110-progreso-visible-sin-tokens-estado-de-ca`, `npm install` y `npm run build` limpios. Node 22.23.4, Windows.
- `npm run test:rapido`: 745 tests, 745 pass, 0 fail; el reporter dijo `[progreso] 745 tests`, coincide con el `spec`. Segunda ejecucion: `[1/745] ... [745/745]`, 21 lineas (cada 5 %); `suite-total.json` queda bajo `.git/taskcode/`.
- Ficheros afectados (progreso, estado, estado-seguir, doctor-status-line, freno-stop, progreso-comandos, progreso-verificacion, reporter-progreso, los dos de core, cli/estado): 64 tests, 64 pass.
- El `dist/` versionado coincide con el que genera `tsc`.
- No se toco `C:\Users\nullcad2025\.claude\settings.json`: todas las pruebas de status line usaron un `CLAUDE_CONFIG_DIR` temporal.

### Lo que se comprobo y esta bien

- **Cero salida y arbol limpio.** El progreso vive en `.git/taskcode/`; los tests de los cinco comandos comparan la salida con y sin progreso. El mutante que lo mueve dentro del arbol pone en rojo 8 de 15 tests.
- **Via rapida de `bin/taskctl estado`.** 143 ms de pared (incluye arrancar node). Sin repo no imprime nada; con `tareas/` y sin progreso dice «Nada en marcha.». Flag desconocido sale con 1 y mensaje. `--stdin` usa el directorio del JSON; con un stdin que nunca se cierra, termina a los ~500 ms.
- **`--seguir` sin TTY.** Imprime una linea y sale; el mutante que quita la condicion de TTY lo caza `estado-seguir.test`.
- **settings.json de usuario** (sobre `CLAUDE_CONFIG_DIR` temporal): sin flag no escribe (mutante cae en 2 tests); instalar conserva `permissions`, `hooks`, `env` y `theme` y deja `.bak`; repetir no escribe ni copia; una ajena se rechaza con exit 1 e intacta; `--reemplazar-status-line` guarda la previa y desinstalar la devuelve con su `padding`; un `settings.json` con BOM se lee y se escribe sin BOM; la cache vieja que no entiende `estado` se rechaza antes de escribir; con cache buena instala `node "<ruta con />" estado --stdin`, que con `sh -c` imprime la linea.
- **`TASKCTL_PROGRESO`.** Un script que escribe `7/22` se ve como `review (4/5) · ronda 2 · verificacion (3/5) 7/22`; `7/0` se ignora; texto con ANSI muestra solo los numeros.
- **Reporter.** Con un fallo y subtests cuenta 4 hojas (el `spec` 5, incluye el padre); primera ejecucion `[x/?]`, segunda `[x/4]`; el codigo de salida sigue siendo 1; con `TASKCTL_PROGRESO` escribe `4/4`.

## Detalle

### IMP-1 — «Nadie mas hereda `TASKCTL_PROGRESO`» no tiene ningun test que se ponga rojo al quitar la proteccion

README y CHANGELOG prometen que no lo heredan los scripts de Git-Flow ni el de held-out y que uno que ya estuviera en el entorno se sustituye. Esa garantia la da una sola linea, `delete process.env[VARIABLE_PROGRESO]` al empezar `main()` (src/cli.ts). Los tests solo cubren el entorno del comando de verificacion, donde `entornoConContador` lo pisa de todos modos.

Reproduccion (mutantes): (1) quitar esa linea de `main()` y correr `progreso-verificacion.test.js`, `progreso-comandos.test.js` y `cli/estado.test.js`: 16/16 verdes. (2) Quitar `delete env[VARIABLE_PROGRESO]` de `entornoConContador` y correr `core/progreso.test.js` y `progreso-verificacion.test.js`: 9/9 verdes. Tampoco hay test del caso `rutaCont === null` con la variable ya puesta.

El comportamiento actual es correcto; el hallazgo es la falta de red de regresion. Correccion sugerida: un test con una variable falsa fuera que compruebe que no llega a los hijos, y un test unitario de `entornoConContador(env_con_falso, null)`.

### MEN-1 — Tres puntos de comportamiento declarados sin test

- El contador de `finish` para la verificacion selectiva y para la de documentacion no esta cubierto. Mutante: pasar `{}` en vez de `opcionesEjecucion(o)` en `puertaSoloDocumentacion` (finish-verificacion.ts:253) y en `puertaSelectiva` (:363): 8/8 verdes. Solo la ruta completa tiene test.
- La ronda que muestra `review` antes de escribir las peticiones. Mutante: `previa.ronda + 1` por `previa.ronda` en review.ts:640: 5/5 verdes.

### MEN-2 — La status line «previa» obsoleta puede resucitar al desinstalar

`statusline-previa-taskctl.json` solo se escribe al reemplazar una ajena y solo se borra al desinstalar. Reproduccion: reemplazar `mi-barra.sh`; la persona borra a mano `statusLine`; `doctor --instalar-status-line`; `doctor --desinstalar-status-line` devuelve `mi-barra.sh` aunque la persona la habia quitado. Arreglo: borrar la previa al instalar sobre `ausente`.

### MEN-3 — Actualizar una status line propia descarta el resto de sus claves

Con `padding` y `refreshInterval`, `--instalar-status-line` responde «actualizada» y deja solo `type` y `command`. Es el camino normal tras actualizar el plugin con la ruta de la cache. Arreglo: `{ ...statusLineActual, type, command }`.

### MEN-4 — Documentacion del freno y su etiqueta

README dice «el freno, `freno · verificacion`»; lo real es `TASK-9 · freno · verificacion (1/1) · 0 min`. Un freno con verificacion roja se marca `abortada`, que lee como interrupcion cuando termino en rojo.

### MEN-5 — settings.json que es un enlace simbolico (no verificado)

`rename` sobre un enlace simbolico lo reemplaza por un fichero normal en POSIX (stow, chezmoi). No reproducido: en Windows `symlinkSync` da `EPERM`. Ademas cada escritura deja un `settings.json.<fecha>.bak` sin limite, que puede contener tokens de `env`.

Aceptado: no reproducido en Windows (symlinkSync da EPERM) y no hay usuarios conocidos con dotfiles enlazados.

### MEN-6 — Ayuda y mensajes de uso desactualizados

`taskctl estado [--seguir]` no menciona `--stdin`; el error de `doctor` sigue diciendo `Uso: taskctl doctor [--json].`

### MEN-7 — `buscarTaskctl` solo reconoce la cache bajo `<config>/plugins` (no verificado)

Un plugin cargado desde otro sitio (`--plugin-dir`, cache movida) se tomaria por taskctl del sistema y se escribiria `taskctl estado --stdin`, que la status line no encontraria. Visto relacionado: con `CLAUDE_CONFIG_DIR` distinto del de la cache real, `doctor` tomo la copia de `~/.claude/plugins/...` por taskctl del sistema. La deteccion es heuristica.

Aceptado: heuristica documentada; el caso `--plugin-dir` no es el uso de Carlos.

## Lecturas fuera del contexto permitido

- `.github/workflows/ci.yml` y el `.gitignore` del plugin: para comprobar la version de Node del CI frente a `engines` y que los ficheros nuevos de `dist/` estan versionados (lo estan y coinciden con el build).
