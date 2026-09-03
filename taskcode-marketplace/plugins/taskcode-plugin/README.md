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
npm install
npm run build
claude --plugin-dir /ruta/absoluta/a/TaskCode/taskcode-marketplace/plugins/taskcode-plugin
```

Hay que compilar (`npm run build`) antes: `dist/` está en `.gitignore` y
`bin/taskctl` importa `../dist/src/cli.js`, así que un checkout limpio sin
build previo falla al arrancar.

Con el plugin cargado, dentro de la sesión de Claude Code:

- `taskctl --help` debería resolverse como comando de shell suelto (ver
  siguiente sección).
- `/reload-plugins` recarga el plugin tras cambios sin reiniciar la sesión.

Si en el futuro se quiere una instalación persistente vía
`/plugin install <nombre>@<marketplace>` (no solo para la sesión actual),
hace falta además un `.claude-plugin/marketplace.json` en la raíz de
`taskcode-marketplace/` que hoy no existe. Se ha dejado fuera del alcance
de TASK-006 a propósito: el objetivo literal de la tarea es la carga local
y el PATH del Bash tool, que no requieren marketplace.

## `taskctl` en el PATH del Bash tool

Según la referencia oficial (`https://code.claude.com/docs/en/plugins`,
tabla "Plugin structure overview"): *"`bin/`: Executables added to the
Bash tool's `PATH` while the plugin is enabled"*. Es decir, el mecanismo
no pasa por el campo `commands` de `plugin.json` (ese campo es para un
array de rutas a skills en Markdown, no un mapa nombre→ejecutable) — pasa
simplemente por tener el ejecutable dentro de `bin/` en la raíz del
plugin, con el bit de ejecución puesto.

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

### `commands` en `plugin.json`: campo inválido, eliminado

`plugin.json` tenía `"commands": {"taskctl": "bin/taskctl"}`. Ese campo no
existe en el schema real (que solo documenta `name`, `description`,
`version`, `author`, y opcionalmente `homepage`/`repository`/`license`);
no hacía nada. Se eliminó, y de paso se corrigió `author` al formato de
objeto (`{"name": "charlie.bk"}`) que usa el propio ejemplo oficial de la
guía de creación de plugins, en vez de un string suelto.

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
aplicable a `bin/taskctl`. Se recomienda comprobarlo la próxima vez que
alguien del equipo tenga una sesión nativa abierta:

```bash
git clone <repo> /tmp/check && cd /tmp/check
ls -la taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
# ¿aparece la "x" en los permisos tras un checkout limpio?
```

## Comandos disponibles

Ver `taskctl --help` (arriba) para la lista completa y actualizada. Guía
extendida de la metodología: `docs/PROPUESTA_METODOLOGIA.md` y
`docs/PLAN_SPRINTS.md` en la raíz del repo `TaskCode`.
