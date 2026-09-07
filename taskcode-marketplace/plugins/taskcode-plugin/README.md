# taskcode-plugin

Plugin de Claude Code que implementa la metodología de tareas por sprints,
revisión por pares de agentes y Git-Flow determinista descrita en
`docs/PROPUESTA_METODOLOGIA.md` (raíz del repo `TaskCode`). Expone el CLI
`taskctl`.

## Instalación local (para desarrollo y pruebas)

**Corrección respecto al texto original de TASK-006:** la tarea describía
este paso como `/plugin install <ruta-local>`. Esa slash-command no acepta
una ruta de filesystem directamente — sirve para instalar un plugin de un
*marketplace* ya añadido (`/plugin marketplace add ...`). El mecanismo
real y soportado para cargar un plugin en local sin publicarlo en ningún
marketplace es el flag de CLI `--plugin-dir`, confirmado contra la
documentación oficial (`https://code.claude.com/docs/en/plugins`,
sección "Test your plugins locally"):

```bash
claude --plugin-dir /ruta/absoluta/a/TaskCode/taskcode-marketplace/plugins/taskcode-plugin
```

**No hay que compilar nada primero.** Desde TASK-031 (item E6) el build de
producción, `dist/src/`, se versiona: un clon recién hecho ya trae un
`taskctl` que arranca. `npm install && npm run build` sigue haciendo falta
para *desarrollar* el plugin y para correr la suite, que compila también
`dist/test/` — ese sí queda fuera del repo.

Hasta esa tarea era al revés, y el texto de este README lo decía: `dist/`
entero estaba en `.gitignore` y `bin/taskctl` importa `../dist/src/cli.js`,
así que cualquiera que clonara el repo —o instalara el plugin desde el
marketplace, que es una copia, no un checkout donde uno pueda compilar—
recibía un CLI que moría con `Cannot find module ...dist/src/cli.js` y
código 1.

Con el plugin cargado, dentro de la sesión de Claude Code:

- `taskctl --help` debería resolverse como comando de shell suelto (ver
  siguiente sección).
- `/reload-plugins` recarga el plugin tras cambios sin reiniciar la sesión.

Para una instalación persistente vía `/plugin install <nombre>@<marketplace>`
(no solo para la sesión actual) hace falta además un
`.claude-plugin/marketplace.json` en la raíz del marketplace. **Ya existe**,
en la raíz del repo, desde TASK-021 (item A1) — este README afirmó durante un
tiempo que no, y era falso.

## Cómo se distribuye: por qué `dist/src/` está versionado

Instalar un plugin **no es un checkout donde el usuario pueda compilar**.
Según la referencia oficial (`plugin-marketplaces`), Claude Code *copia* el
plugin a su caché (`~/.claude/plugins/cache`). Sobre esa copia sí instala las
dependencias npm —`npm ci --ignore-scripts`, porque el plugin trae
`package.json` y `package-lock.json`—, pero ese `--ignore-scripts` es
literal: **`postinstall` y `prepare` no se ejecutan nunca**. Compilar al
instalar no es una opción que se descartara por criterio; la plataforma no la
ofrece.

De ahí que el build viaje ya hecho. Dos piezas lo sostienen, y conviene no
tocarlas por separado:

- `tsconfig.json` fija `"newLine": "lf"`, y `.gitattributes` fija
  `*.ts text eol=lf` **además de** `dist/** text eol=lf`. Lo segundo no es
  redundante: las plantillas multilínea de `src/` viajan tal cual al build,
  así que con `core.autocrlf=true` el checkout de Windows mete CRLF dentro de
  un literal y el mismo `src/` compila distinto que en Linux. Medido en su
  día: 34 CRLF en `dist/src/cli.js`, todos dentro del literal `HELP`.
- El CI recompila y falla si `dist/src` no coincide con lo commiteado, **en
  Linux y en Windows**. Un guard en una sola plataforma no vería justo el
  fallo que motiva lo anterior.

Si cambias algo de `src/`, recompila y commitea `dist/src` en el mismo
commit. El guard existe precisamente porque es fácil olvidarlo.

### Limitación conocida: `bin/` y las organization settings de claude.ai

El mecanismo por el que `taskctl` se invoca como comando suelto es tener el
ejecutable en `bin/`, en la raíz del plugin (referencia oficial,
`plugins-reference`: *"Executables added to the Bash tool's PATH and invokable
as bare commands while the plugin is enabled"*). No pasa por ningún campo de
`plugin.json`.

Pero esa misma referencia avisa de que **un plugin con `bin/` de nivel
superior no se puede distribuir por organization settings de claude.ai**: el
sync del marketplace y la subida directa lo rechazan con
`Plugin contains a top-level bin/ directory`, y la alternativa que prescribe
es mover los ejecutables a `scripts/` e invocarlos por
`${CLAUDE_PLUGIN_ROOT}/scripts/<nombre>`.

Hoy no bloquea nada: la distribución es un marketplace privado por Git. Queda
anotado porque condiciona **E1** (invitar colaboradores) y cualquier intento
futuro de distribuir por esa vía, que obligaría a renunciar a `taskctl` como
comando suelto o a reestructurar el plugin.

## `taskctl` en el PATH del Bash tool

Según la referencia oficial (`https://code.claude.com/docs/en/plugins`,
tabla "Plugin structure overview"): *"`bin/`: Executables added to the
Bash tool's `PATH` while the plugin is enabled"*. Es decir, el mecanismo
no pasa por el campo `commands` de `plugin.json` — pasa simplemente por
tener el ejecutable dentro de `bin/` en la raíz del plugin, con el bit de
ejecución puesto.

**Matiz encontrado en revisión por pares, sin confirmar con pruebas
propias todavía:** esa frase dice explícitamente *Bash tool*, no "shell
tool" en general. Según `https://code.claude.com/docs/en/setup`
("Set up on Windows"): en Windows nativo, **sin** Git for Windows
instalado, Claude Code usa el *PowerShell tool* en vez del Bash tool; con
Git for Windows instalado, usa Git Bash para el Bash tool (y el
PowerShell tool queda disponible en paralelo). No hay confirmación oficial
de si `bin/` también se añade al PATH cuando quien corre los comandos es
el PowerShell tool en vez del Bash tool — es una pregunta abierta, no un
hecho verificado en ningún sentido.

En la práctica esto ya condiciona a este proyecto igual: `taskctl start`,
`plan` y `approve` invocan los scripts de Git-Flow como
`bash "$CLAUDE_PLUGIN_ROOT/scripts/gitflow/<script>.sh"` (ver
`scripts/gitflow/README.md`), así que ya exigen Git for Windows / Bash
tool para funcionar, con o sin este hallazgo. Lo que sigue sin confirmar
es si `taskctl new`/`import`/`board` (que no tocan Git-Flow) podrían
seguir funcionando bajo un PowerShell-tool-only vía
`node bin/taskctl ...` explícito aunque la resolución de `taskctl` como
comando suelto por PATH no aplicara ahí.

### Bug encontrado y corregido en TASK-006

`bin/taskctl` estaba trackeado por Git en modo `100644` (no ejecutable) a
pesar de tener `chmod +x` en el working tree local. Cualquier clon limpio
del repo (exactamente lo que hace todo smoke test de este proyecto)
heredaba el fichero sin bit de ejecución, así que `taskctl` como comando
suelto nunca había funcionado realmente en un clon nuevo — solo la
invocación explícita `node bin/taskctl ...` (la que usan todos los smoke
tests de TASK-004/005) evitaba el problema. Corregido con:

```bash
git update-index --chmod=+x taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
```

Verificado tras el fix:

```
$ git ls-files -s taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
100755 79d808e6009043081c76b013a8cba1f6d3c01932 0	taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
```

### `commands` en `plugin.json`: campo con forma inválida, eliminado — corrección tras revisión por pares

`plugin.json` tenía `"commands": {"taskctl": "bin/taskctl"}`.
**Corrección respecto a la primera versión de este README:** el campo
`commands` sí existe en el schema real (referencia oficial,
`https://code.claude.com/docs/en/plugins-reference`) — apunta a ficheros
`.md` de skills "planas" (no anidadas en `<nombre>/SKILL.md`), y su tipo
es `string | array` únicamente. Nunca acepta un objeto. Nuestro uso (un
objeto `{"taskctl": "bin/taskctl"}`) no era "un campo que no hacía nada":
era un campo reconocido con un tipo incorrecto, y según la misma
referencia *"How Claude Code handles a recognized field whose value has
the wrong type... Most fields: the plugin fails to load"*. Es decir, no
se puede descartar que este `plugin.json`, tal cual estaba, impidiera que
el plugin cargara en cualquier sesión real de Claude Code hasta este fix
— no solo que el campo fuera inofensivo. Se eliminó, y de paso se corrigió
`author` al formato de objeto (`{"name": "charlie.bk"}`) que usa el propio
ejemplo oficial de la guía de creación de plugins, en vez de un string
suelto.

### Evidencia recogida en esta sesión

Todo lo siguiente se ejecutó de verdad (no es texto de relleno) contra
este repo, tras `npm install && npm run build`, ya con el fix del bit de
ejecución aplicado:

```
$ node bin/taskctl --help
taskctl 0.1.0 — TaskCode
[...]

$ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
taskctl 0.1.0 — TaskCode
[...]                            # salida idéntica

$ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
0.1.0

$ PATH="$(pwd)/bin:$PATH" which taskctl
.../taskcode-plugin/bin/taskctl
```

Las cuatro formas de invocación funcionan de forma idéntica una vez el bit
de ejecución está bien trackeado: el mecanismo de `bin/` en PATH que usa
Claude Code depende exactamente de esto.

### Smoke test en un clon aislado

Se repitió el patrón de smoke test de TASK-004/TASK-005: `git clone` a un
directorio temporal separado, checkout de esta rama, `npm install && npm
run build` en el clon (nunca se hereda `dist/`/`node_modules/` de un
`git clone`), y ejecución real:

```
$ ls -la bin/taskctl          # tras un clon limpio, sin tocar permisos a mano
-rwxr-xr-x 1 ... bin/taskctl

$ node bin/taskctl --help     # OK
$ ./bin/taskctl --version     # OK — 0.1.0
$ PATH="$(pwd)/bin:$PATH" taskctl --version   # OK — 0.1.0, resuelto como comando suelto
```

El bit de ejecución sobrevive un `git clone` normal en un filesystem POSIX
estándar (confirma que el fix de `git update-index --chmod=+x` es
correcto y suficiente ahí). Además se corrió `taskctl import` y
`taskctl board` de punta a punta en ese mismo clon para confirmar que el
empaquetado no rompió nada del resto del CLI — ambos funcionaron igual
que en TASK-004/TASK-005.

### Lo que NO se ha podido verificar en esta sesión (limitación de entorno)

Ni el contenedor cloud de esta sesión ni el bridge hacia el equipo del
usuario (`device_bash`) exponen un CLI interactivo real de Claude Code —
ambos exponen solo un stub restringido:

```
$ claude --version
claude: only `claude -p "<prompt>"` is supported in this environment

$ claude --plugin-dir ./taskcode-marketplace/plugins/taskcode-plugin --help
claude: only `claude -p "<prompt>"` is supported in this environment

$ claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin
claude: only `claude -p "<prompt>"` is supported in this environment
```

Por tanto no se ha podido ejecutar de punta a punta, dentro de esta
sesión, ni `claude --plugin-dir ...` en modo interactivo ni
`claude plugin validate`. Mismo patrón que TASK-007 (ver
`docs/spikes/TASK-007-resultado.md`): se deja documentado el procedimiento
exacto y verificado hasta donde el entorno lo permite (estructura,
permisos, schema de `plugin.json`, arranque real de `dist/src/cli.js`), y
se recomienda una pasada rápida en una sesión nativa de Claude Code —
Windows o donde sea que el equipo lo use — la próxima vez que alguien la
tenga abierta:

```bash
cd taskcode-marketplace/plugins/taskcode-plugin
npm install && npm run build
claude --plugin-dir "$(pwd)"
# dentro de la sesión: taskctl --help
```

### RESUELTO (2026-09-05): el CI de Windows nativo contestó las preguntas

Las dos limitaciones de abajo se documentaron cuando no había forma de
probar nada en Windows nativo desde esta sesión. **Ya la hay**: el job
`windows-latest` de `.github/workflows/ci.yml` corre sobre un checkout
nativo de Windows y asevera cada hipótesis como un step propio. Resultado
del primer run verde:

| Pregunta | Respuesta |
|---|---|
| ¿`bin/taskctl` conserva el bit `+x` tras un checkout nativo de Windows? | **Sí** |
| ¿`taskctl` resuelve como comando suelto vía PATH en Windows? | **Sí** |
| ¿Los `.sh` de Git-Flow corren bajo Git Bash nativo? | **Sí** (smoke test completo en verde) |
| ¿`node bin/taskctl` funciona desde `cmd.exe`, sin Git Bash? | **Sí** |
| ¿Pasa la suite completa en Windows? | **Sí**, tras corregir el glob de `npm test` |

Además, `claude plugin validate` pasó en CI tanto para el manifiesto del
plugin como para el del marketplace — la validación que esta tarea no
pudo hacer por no tener un CLI real disponible.

El único hallazgo negativo del ejercicio fue real y ya está corregido: el
script `test` de `package.json` expandía los globs en el shell, y `cmd.exe`
no expande globs, así que la suite entera fallaba en Windows. Con el glob
entrecomillado lo expande Node y funciona en ambos sistemas.

Lo que **sigue** sin poder comprobarse desde una sesión no interactiva:
`claude --plugin-dir` en modo interactivo y el `/plugin install` real.

### Segunda limitación, específica de este repo: `core.fileMode=false`

`scripts/gitflow/README.md` ya documentó que este repo tiene
`git config core.fileMode false` porque el filesystem real bajo el bridge
de dispositivo no preserva de forma fiable el bit `+x` — y que por eso los
scripts de Git-Flow se invocan siempre explícitamente vía
`bash script.sh`, nunca por ruta directa, para que el bit deje de
importar.

`bin/taskctl` no tiene ese wrapper disponible: el mecanismo de `bin/` en
PATH de Claude Code necesita ejecutar el fichero directamente (vía su
shebang), así que si el checkout real en Windows tampoco preserva el bit
de ejecución, `taskctl` como comando suelto podría seguir sin funcionar
ahí aunque Git ya lo trackee como `100755` — el fix de esta tarea corrige
lo que Git registra (correcto y necesario para clones en Linux/macOS,
donde sí se preserva) pero **no se ha podido confirmar por separado si un
checkout nativo en Windows conserva el bit**. Es la misma clase de
limitación que TASK-007 dejó abierta para los scripts `.sh`, ahora también
aplicable a `bin/taskctl`.

**Precisión encontrada en revisión por pares** (más fuerte que "no
preserva de forma fiable"): el punto de montaje del bridge de dispositivo
(`$HOME/mnt/TaskCode`, el que usa esta sesión para tocar el repo) no es
que preserve el bit de ejecución de forma poco fiable — **sintetiza
`-rwx------` para cualquier fichero por igual**, sea o no ejecutable de
verdad. Verificado a mano:

```
$ touch taskcode-marketplace/plugins/taskcode-plugin/probe-mount.txt
$ ls -la taskcode-marketplace/plugins/taskcode-plugin/probe-mount.txt
-rwx------ ... probe-mount.txt        # fichero vacio recien creado: "ejecutable"

$ ls -la taskcode-marketplace/plugins/taskcode-plugin/package.json
-rwx------ ... package.json           # JSON, nunca deberia ser "ejecutable"
```

Es decir: cualquier comprobación de permisos hecha *a través de este
mismo bridge* (incluida la que se hizo al principio de esta tarea, antes
de mirar `git ls-files -s`) es un falso positivo garantizado y no prueba
nada sobre el filesystem real de Windows. Lo único fiable que se pudo
comprobar desde esta sesión es lo que Git tiene trackeado
(`git ls-files -s`, correcto ahora) y el comportamiento en un clon nuevo
sobre un filesystem POSIX normal (`/tmp` dentro de la VM Linux del bridge,
fuera de `mnt/` — ver el smoke test más abajo, que sí es representativo
de Linux/macOS/WSL). Se recomienda comprobar el checkout nativo de
Windows en sí la próxima vez que alguien del equipo tenga una sesión
nativa abierta ahí, no a través de este bridge:

```powershell
git clone <repo> C:\temp\check
cd C:\temp\check
# ¿el checkout tiene forma de marcar/perder un "bit de ejecucion" en NTFS,
# o el concepto no aplica igual que en POSIX? Confirmar contra `bin/taskctl`
# funcionando de verdad como comando suelto dentro de una sesion real.
```

No se ha intentado usar las herramientas de control remoto de escritorio
disponibles en este bridge (`mcp__remote-devices__computer_*`, que
permiten abrir una ventana real en la máquina del usuario) para hacer esta
comprobación desde esta misma sesión. Quedó descartado por alcance/tiempo,
no porque no fuera técnicamente posible — se deja anotado como opción más
barata que esperar a una sesión nativa, por si alguien quiere intentarlo
antes.

## Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse

TASK-006 pide explícitamente (AC3) dejar constancia de que el "mecanismo
determinista para comprobar instalación" de la sección 14 de
`docs/PROPUESTA_METODOLOGIA.md` sigue sin confirmarse con documentación
oficial. Cita exacta, punto 11 de esa sección: *"confirmar a mano (no dar
por bueno sin probar) el mecanismo exacto para que `taskctl` compruebe de
forma determinista qué plugins/skills están instalados en la máquina
local (comando de CLI o archivo de configuración concreto) — sección 6.6,
paso 3."*

Es un punto distinto de todo lo demás documentado arriba: no es sobre que
una persona confirme a mano que el plugin está instalado (eso es el resto
de este README), sino sobre que **`taskctl` mismo** tenga una forma
programática y determinista de preguntarle a Claude Code qué
plugins/skills están instalados en la máquina — sin depender de un LLM
para adivinarlo. La investigación de esta tarea (centrada en
`--plugin-dir`, el schema de `plugin.json` y el mecanismo `bin/` en PATH)
no cubrió esto, y no se ha encontrado en la documentación oficial
consultada (`plugins-reference`, `plugins`, `plugin-marketplaces`,
`setup`) un comando de CLI o fichero de configuración pensado para que un
*script* (no una persona en una sesión interactiva) consulte ese estado.
Queda registrado como sigue pendiente, sin bloquear TASK-006 — tal como
pide el criterio de aceptación.

## Comandos disponibles

Ver `taskctl --help` (arriba) para la lista completa y actualizada. Guía
extendida de la metodología: `docs/PROPUESTA_METODOLOGIA.md` y
`docs/PLAN_SPRINTS.md` en la raíz del repo `TaskCode`.
