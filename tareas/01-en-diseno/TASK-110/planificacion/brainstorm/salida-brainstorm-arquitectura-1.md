# Brainstorm — TASK-110, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

- Una sola fuente de verdad, `.git/taskcode/progreso.json`, con su propio par de módulos según la costumbre del repo: `src/core/progreso.ts` es puro (tipo `EstadoProgreso`, validar, `formatearEstado(estado, ahora): string` → `TASK-NNN · <fase> · <paso> x/N · <mm> min`) y `src/fs/progreso.ts` lee y escribe (`rutaProgreso(cwd)`, `escribirProgreso`, `leerProgreso`, `leerContador`).
- `rutaProgreso` **no lanza git**: sube desde el cwd hasta encontrar `.git`. Si es un directorio, usa `<.git>/taskcode/progreso.json`. Si es un fichero (worktree), sigue su línea `gitdir:`. La usan el que escribe **y** el que lee. Si el que escribe usara `rev-parse --git-path` como `verificacion.ts:177` y el que lee la ruta a mano, en un worktree podrían acabar en sitios distintos.
- Los comandos reciben `deps.progreso?: Progreso`, igual que P-1 metió `deps.reloj` en `finish` (`finish.ts:275`, `cli.ts:1011`). La interfaz tiene tres métodos: `fase(id, fase)`, `paso(nombre, x?, n?)` y `terminar()`. `cli.ts` construye la real con `ahora`. Sin ella, no hace nada: los tests actuales no cambian.
- `TASKCTL_PROGRESO` va por entorno, igual que `RAMA_BASE` (`verificacion.ts:54`), por el `opciones.env` que ya aceptan `ejecutarVerificacion` y `verificarConMemo`. La variable apunta a un fichero hermano, `.git/taskcode/progreso-contador`, escrito por el hijo y con `x/N` en la última línea. `progreso.json` guarda su ruta en el campo `contador`.
- `taskctl estado [--seguir]`, en `src/commands/estado.ts`, sale **por la vía rápida de `bin/taskctl`** cuando `argv[2] === 'estado'` y entonces importa solo `dist/src/commands/estado.js`. Hoy `cli.ts` importa estáticamente todo el grafo de comandos (unos 120 módulos): ese es el coste de arranque que pagaría la status line en cada refresco.
- Reporter de `npm test`: `test/reporter/progreso.ts`, compilado a `dist/test/reporter/progreso.js`. Es un generador asíncrono sobre los eventos de `node:test`, sin dependencias. Va junto a `spec` (`--test-reporter=spec --test-reporter-destination=stdout --test-reporter=./dist/test/reporter/progreso.js --test-reporter-destination=stderr`). Guarda el total de la ejecución en `.git/taskcode/suite-total.json` y, **si existe `TASKCTL_PROGRESO`, escribe también allí su `x/N`**. Así la suite de TaskCode lanzada desde `finish` sirve de primer cliente real del contrato del criterio 4.
- La status line la instala `taskctl doctor --instalar-status-line`. Se añade a `FLAGS_DOCTOR` (`doctor.ts:65`, hoy solo `--json`) con el precedente de escritura de `doctor-deploy --escribir`. Hace falta un escritor nuevo junto a `src/fs/json-claude.ts`, que hoy solo lee (`leerJson`).
- **Sobre la status line**: un plugin **no puede declararla**; solo se configura con la clave `statusLine` de un `settings.json`. Fuentes:
  - El README de context-mode dice literalmente "Claude Code's plugin manifest cannot declare a status line, so this is a one-time manual edit to `~/.claude/settings.json`" (`C:\Users\nullcad2025\.claude\plugins\marketplaces\context-mode\README.md:100`).
  - La referencia oficial del manifiesto de plugin-dev solo lista `commands`, `agents`, `hooks` y `mcpServers` como componentes, sin `statusLine` (`C:\Users\nullcad2025\.claude\plugins\marketplaces\claude-plugins-official\plugins\plugin-dev\skills\plugin-structure\references\manifest-reference.md`, sección «Component Path Fields»).
  - Estas fuentes son locales, no la documentación web en vivo. Por eso el criterio 5 (doctor que ofrece y escribe con un flag) es la forma correcta.

## Que se extiende y que se crea

- Se crean `src/core/progreso.ts` y `src/fs/progreso.ts`, que son el contrato del fichero y la ruta sin git. No se reutiliza `rutaMemo`, `cadena.ts:52` ni `coste-pendiente.ts:41`, porque los tres lanzan `git rev-parse`.
- Se crea `src/commands/estado.ts` y se añade su vía rápida en `bin/taskctl`. En `cli.ts` solo entran el `HELP` y una entrada de respaldo.
- Se extienden `plan.ts`, `approve.ts`, `start.ts`, `review.ts` y `finish.ts` con `deps.progreso`, y también `finish-verificacion.ts`, que en su línea 193 llama a `ejecutarVerificacion` sin `env` y tendría que recibirlo.
- Se extiende `src/hooks/freno-stop.ts`: `paso('verificacion <tipo>')` antes de `verificarConMemo` (línea 212), con el `env` de `TASKCTL_PROGRESO` en `deOpciones`.
- Se extienden `src/commands/doctor.ts` (flag nuevo y comprobación) y `src/fs/json-claude.ts` (escritor), y se crea `test/reporter/progreso.ts`. En `package.json` cambian los scripts `test` y `test:rapido`.
- No se tocan `verificacion.ts` (ya acepta `env`) ni `ejecucion-acotada.ts`.

## Limites que cruza

- Hay un formato de fichero nuevo y estable, `progreso.json`, con `version`. Lo leen tres clientes: `estado`, la status line y quizá otros scripts. Su versionado se diseña igual que `VERSION_MEMO`.
- `TASKCTL_PROGRESO` pasa a ser contrato público con los scripts de proyectos ajenos. Nombre neutro y documentado en el README del plugin, como `RAMA_BASE`. El texto del plugin no puede mencionar TaskCode.
- La dependencia va de `commands`/`hooks` a `fs/progreso` y de ahí a `core/progreso`, en el mismo sentido que el resto. `estado.ts` no puede importar nada que arrastre `fs/git.ts`, o la vía rápida se pierde.
- El fichero vive fuera del árbol a propósito: dentro del workspace cambiaría la huella de `huellaDelArbol` y anularía el memo de la verificación en cada paso.
- `settings.json` de Claude Code: es la primera vez que taskctl escribe configuración de Claude Code (hasta ahora solo la sondeaba, en `sondas-hooks-claude.ts`).

## La decision de diseño que mas te preocupa (UNA sola)

- **El canal de `x/N` (dos ficheros frente a uno).** `ejecutarAcotado` usa `spawnSync` (`ejecucion-acotada.ts:132`) y así se queda a propósito. Por tanto taskctl está bloqueado mientras corre la verificación y no puede volcar al JSON lo que el hijo escribe. Las opciones son dos:
  - Que el hijo reescriba el propio `progreso.json`. Obliga a cada proyecto ajeno a escribir JSON y a no pisar el resto de campos.
  - Que escriba un fichero de contador aparte, que `estado` lee junto al JSON.
- Propongo el contador aparte. Eso contradice la lectura literal del criterio 2 («leyendo solo ese fichero»): el unificador debe decidir si el criterio quiere decir «solo ficheros de progreso y sin git» o si hay que reabrirlo.
- Descarto pasar a un `spawn` asíncrono con taskctl sondeando y fusionando, porque rehace `ejecucion-acotada`, cuyo diseño síncrono se apoya en un hallazgo documentado.
- Descarto también un envoltorio genérico en `cli.ts` alrededor de cada comando: solo sabe cuándo empieza y cuándo acaba, y no ve pasos ni `x/N`.
- Sin verificar: si el `command` de `statusLine` corre con el cwd del proyecto de la sesión y si `taskctl` está en el PATH de ese shell. Si no lo está, doctor tendría que escribir una ruta absoluta a la caché del plugin, que cambia con cada actualización (ver el comentario de `verificacion.ts:17`).
