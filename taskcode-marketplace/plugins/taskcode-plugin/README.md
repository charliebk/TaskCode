# taskcode-plugin

Plugin de Claude Code que implementa la metodología de tareas por sprints,
revisión por pares de agentes y Git-Flow determinista descrita en
`docs/PROPUESTA_METODOLOGIA.md` (raíz del repo `TaskCode`). Expone el CLI
`taskctl`.

Para instalarlo y actualizarlo desde el marketplace, ver el README de la raíz
del repo («Instalar el plugin» y «Actualizar»). Licencia: MIT.

## Modelo de los agentes

Los agentes de brainstorm (`agents/brainstorm-*.md`) **no declaran `model:`**
en su frontmatter. Es una decisión, no un olvido (TASK-049, comprobado el
2026-10-05 con Claude Code 2.1.288 en
<https://code.claude.com/docs/en/sub-agents>):

- El campo admite `sonnet`, `opus`, `haiku`, `fable`, un ID completo (por
  ejemplo `claude-opus-5-5`) o `inherit`. Sin él, Claude Code resuelve el
  modelo así: el parámetro `model` de cada invocación, después
  `CLAUDE_CODE_SUBAGENT_MODEL` y por último el de la conversación. Ese orden
  rige desde Claude Code 2.1.251; antes, la variable iba la primera. Y con
  `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (2.1.257 o posterior) la variable manda
  sobre todo, también sobre el `model` de cada invocación.
- Un alias fijo y barato iría contra la metodología: el modelo depende de la
  complejidad de cada tarea (`modelo_sugerido` en `tarea.md`), y cambiarlo
  obligaría a publicar una versión del plugin.
- `inherit` explícito anularía `CLAUDE_CODE_SUBAGENT_MODEL`, que es la palanca
  de coste de quien instala el plugin.

Quien orquesta pasa `modelo_sugerido` como `model` al lanzar cada agente (la
salida de `taskctl review` ya lo nombra).

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

Esa misma página avisa de que **un plugin con `bin/` de nivel superior no se
puede distribuir por organization settings de claude.ai** (*"You can't include
this directory in a plugin you distribute through claude.ai organization
settings"*), y enlaza a `plugin-marketplaces`, que es donde está el detalle: el
sync del marketplace y la subida directa lo rechazan con
`Plugin contains a top-level bin/ directory`, y la alternativa que prescribe
es mover los ejecutables a `scripts/` e invocarlos por
`${CLAUDE_PLUGIN_ROOT}/scripts/<nombre>`.

Hoy no bloquea nada: la distribución es un marketplace privado por Git. Queda
anotado porque condiciona **E1** (invitar colaboradores) y cualquier intento
futuro de distribuir por esa vía, que obligaría a renunciar a `taskctl` como
comando suelto o a reestructurar el plugin.

## Usar `taskctl` fuera de Claude Code (PowerShell, cmd, Git Bash)

Dentro de Claude Code no hay que hacer nada: `bin/` entra en el PATH del
Bash tool mientras el plugin esta habilitado. **Fuera** (tu propia terminal)
no: ni esta en el PATH ni, en Windows, PowerShell y cmd saben ejecutar
`bin/taskctl`, que es un script de node sin extension.

El plugin instalado vive en
`~/.claude/plugins/cache/<marketplace>/taskcode-plugin/<version>/` (en
Windows, `%USERPROFILE%\.claude\plugins\cache\...`). Hace falta `node` en
el PATH. Una forma por shell:

**PowerShell**: anade esto a tu perfil (`notepad $PROFILE`). Llama a `node`
directamente y elige la version instalada mas alta, asi que sobrevive a las
actualizaciones del plugin:

```powershell
$taskcodeBase = Join-Path $env:USERPROFILE '.claude\plugins\cache\taskcode-marketplace\taskcode-plugin'
function taskctl {
  $bin = Get-ChildItem $taskcodeBase -Directory |
    Where-Object { $_.Name -as [version] } |
    Sort-Object { $_.Name -as [version] } | Select-Object -Last 1
  if (-not $bin) { throw "taskcode-plugin no esta instalado en $taskcodeBase (instalalo con /plugin)" }
  node (Join-Path $bin.FullName 'bin\taskctl') @args
}
```

En Windows PowerShell 5.1, evita las comillas dobles dentro de un argumento
(`--titulo 'Soporte "modo oscuro"'`): PowerShell 5.1 no las escapa al llamar
a `node`, y el titulo llega sin ellas o partido en dos argumentos. Usa
comillas simples dentro del texto, o PowerShell 7.3 o posterior, que las pasa
bien.

**No pongas `bin` en el PATH para usarlo desde PowerShell.** Ahi `taskctl`
resolveria a `bin\taskctl.cmd`, y PowerShell le pasa sin comillas los
argumentos que no llevan espacios: un titulo como `Q&A` o `foo->notas.txt`
lo interpreta cmd.exe, que ejecuta `A` o vacia `notas.txt`. La funcion de
arriba no pasa por cmd y no tiene ese problema.

**cmd**: `bin\taskctl.cmd` (desde la 0.4.0). Anade la
carpeta `bin` de la version instalada al PATH y escribe `taskctl`. Pon
**siempre entre comillas dobles** los argumentos con `& | < > ^`
(`taskctl new --titulo "Q&A"`): cmd.exe interpreta esos caracteres antes
que nada, y el escape con `^` no sobrevive al reenvio a node. Ojo con
`%NOMBRE%`: cmd lo sustituye por la variable de entorno aunque vaya entre
comillas. Hay que actualizar la ruta cuando cambie la version del plugin.

**Git Bash**: `alias taskctl='node "$(ls -d ~/.claude/plugins/cache/taskcode-marketplace/taskcode-plugin/*/ | sort -V | tail -1)bin/taskctl"'`
en `~/.bashrc`.

Los comandos que invocan Git-Flow (`start`, `review`, `finish`...) ejecutan
`bash` por debajo: necesitan Git for Windows instalado, desde cualquier
shell.

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
taskctl 0.6.0 — TaskCode
[...]

$ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
taskctl 0.6.0 — TaskCode
[...]                            # salida idéntica

$ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
0.5.0

$ PATH="$(pwd)/bin:$PATH" which taskctl
.../taskcode-plugin/bin/taskctl
```

Las cuatro formas de invocación funcionan de forma idéntica una vez el bit
de ejecución está bien trackeado: el mecanismo de `bin/` en PATH que usa
Claude Code depende exactamente de esto.

### Smoke test en un clon aislado

Se repitió el patrón de smoke test de TASK-004/TASK-005: `git clone` a un
directorio temporal separado, checkout de esta rama, `npm install && npm
run build` en el clon (entonces `dist/` estaba entero en `.gitignore`, así
que no se heredaba entre clones — **desde TASK-031 `dist/src` sí se hereda**;
`node_modules/` sigue sin heredarse), y ejecución real:

```
$ ls -la bin/taskctl          # tras un clon limpio, sin tocar permisos a mano
-rwxr-xr-x 1 ... bin/taskctl

$ node bin/taskctl --help     # OK
$ ./bin/taskctl --version     # OK — 0.5.0
$ PATH="$(pwd)/bin:$PATH" taskctl --version   # OK — 0.5.0, resuelto como comando suelto
```

El bit de ejecución sobrevive un `git clone` normal en un filesystem POSIX
estándar (confirma que el fix de `git update-index --chmod=+x` es
correcto y suficiente ahí). Además se corrió `taskctl import` y
`taskctl board` de punta a punta en ese mismo clon para confirmar que el
empaquetado no rompió nada del resto del CLI — ambos funcionaron igual
que en TASK-004/TASK-005.

### Lo que NO se ha podido verificar en esta sesión (limitación de entorno)

> **Histórico (TASK-006, 2026-09-05).** Se conserva por trazabilidad, pero
> está superado dos veces: por la sección *RESUELTO (2026-09-05)* y por
> *RESUELTO (2026-09-07, TASK-031)*, más abajo. Ya hay un CLI real de Claude
> Code y la instalación se ejecutó de verdad. La receta de `npm install &&
> npm run build` que aparece aquí tampoco hace ya falta para arrancar.

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

### RESUELTO (2026-09-07, TASK-031): el `/plugin install` real, por fin ejecutado

TASK-006 y TASK-021 dejaron pendiente comprobar la instalación de verdad por
no haber un CLI de Claude Code disponible. Ya lo hay (2.1.226), y esto es lo
que se ejecutó:

```
$ claude plugin validate .                      # marketplace  -> ✔ passed
$ claude plugin validate ./taskcode-marketplace/plugins/taskcode-plugin
                                                # plugin       -> ✔ passed
$ claude plugin marketplace add "C:\...\TaskCode"
✔ Successfully added marketplace: taskcode-marketplace
$ claude plugin install taskcode-plugin@taskcode-marketplace
✔ Successfully installed plugin: taskcode-plugin@taskcode-marketplace (scope: user)
```

| Pregunta | Respuesta |
|---|---|
| ¿El plugin se instala desde el marketplace? | **Sí**, `enabled`, scope `user` |
| ¿`taskctl` arranca desde la caché, sin compilar? | **Sí**: `node <cache>/bin/taskctl --version` → `0.5.0` |
| ¿La copia cacheada trae `dist/`? | Sí, **pero esta instalación no lo demuestra** — ver abajo |
| ¿Claude Code instala las deps npm en la copia? | Sí, **pero no por la razón que parece** — ver abajo |
| ¿Existe de verdad el mecanismo de `bin/` en PATH? | **Sí** — confirmado abajo |

**Las dos filas del medio necesitan una advertencia, y la revisión por pares
la encontró.** Este marketplace se añadió como fuente `directory` apuntando al
propio working tree, y esa clase de caché es **una copia del árbol de trabajo,
ficheros ignorados por Git incluidos**. Prueba: en la caché hay 34 ficheros de
`dist/test/`, que Git no versiona (`git ls-files dist/test` → 0). Es decir,
**esa tabla habría contestado "sí" también antes de esta tarea**, con `dist/`
entero ignorado, porque lo que se copió fue un árbol ya compilado. La
conclusión de fondo sigue siendo correcta —en un marketplace por Git, quien
hace que la copia arranque es `dist/src` versionado— pero quien la demuestra
es el test de AC1 de `test/empaquetado/distribucion.test.ts`, que exporta HEAD
y por tanto solo ve lo commiteado. No esta instalación.

Lo mismo con `node_modules/`: también viaja en la copia, así que su presencia
no prueba nada. Lo que sí lo prueba es que el `.package-lock.json` de la caché
tiene el `mtime` del instante del install y no el del working tree — ahí sí
corrió un `npm ci` de verdad, el que documenta `plugins-reference`.

Lo último merece detalle, porque hasta ahora era una cita de la documentación
que este proyecto nunca había visto ocurrir (el CI la *simula* metiendo `bin/`
en el `PATH` a mano, que no prueba lo mismo). En el `PATH` de una sesión real
aparecen entradas como:

```
.../.claude/plugins/cache/claude-plugins-official/figma/2.2.90/bin
.../.claude/plugins/cache/karpathy-skills/andrej-karpathy-skills/1.0.0/bin
```

es decir, el mecanismo existe y opera sobre plugins instalados.

**Lo que queda sin confirmar, y no se da por bueno**: en la sesión donde se
hizo la instalación, `taskctl` como comando suelto seguía dando
`command not found`, y el `bin/` de este plugin no estaba en el `PATH`. La
explicación coherente con la evidencia es que el `PATH` se compone al arrancar
la sesión y el plugin se instaló después — pero *eso no se ha comprobado*.
Confirmarlo cuesta un comando en la siguiente sesión:

```bash
taskctl --version   # deberia imprimir 0.5.0 sin ruta ni node delante
```

Mientras tanto, lo que sí está probado es que el ejecutable de la caché es
válido: con su directorio en el `PATH`, `taskctl --version` responde `0.5.0`.

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

`taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
con la duración de calendario de cada fase (diseño = plan→start, curso =
start→primer review, revisión = primer review→finish), las rondas de
revisión, el día de cierre y el origen del dato: la tabla `## Transiciones`
del `tarea.md` (cuya columna `fecha` lleva el instante UTC al segundo desde
la 0.5.0; las filas antiguas, solo el día, dan la duración en días), o, si
la tarea no la tiene, los commits automáticos `chore(TASK-NNN): ...` con un
único `git log`; si tampoco, «—». Las pausas no se descuentan.
`--heuristica` añade a las tareas terminadas con informes de revisión la
puntuación y el nivel de la heurística de complejidad vigente, más un
resumen de rondas medias por nivel declarado y heurístico: es la tabla con
la que se calibra `scripts/heuristica-complejidad.yml`.

`taskctl metricas --tokens` añade las columnas de coste en tokens por fase
(`tok_diseno`, `tok_curso` = implementación, `tok_revision`, `tok_total`; «—»
si no hay dato, que no es 0) y, debajo, un resumen por sprint y por
complejidad declarada: tareas con dato / total, suma y media por fase y el %
de cada fase sobre el total. Las tareas sin ningún dato salen en la tabla y no
entran en el resumen. Se combina con `--heuristica` (el resumen es entonces
sobre la muestra). `taskctl metricas --tokens --escribir` regenera en
`docs/METRICAS.md` solo el bloque entre `<!-- taskctl metricas --tokens: inicio -->`
y `<!-- taskctl metricas --tokens: fin -->` (si no están, los añade al final;
el resto del fichero, CRLF incluido, no cambia ni un byte) y no lo commitea,
como `board --escribir`. No se combina con `--heuristica`.

`taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision
(--agente <id>... | --tokens N) [--push]` **suma** al coste de esa fase
(`tokens_diseno`, `tokens_implementacion`, `tokens_revision` del `tarea.md`;
`null` = sin registrar y solo cuenta como 0 al sumar). `taskctl` no ve el
consumo del agente, así que lo registra quien lo ve. **La cifra que Claude Code
muestra al terminar un subagente no es lo que ha gastado: es el tamaño de su
contexto final.** Con `--agente <id>` (repetible; el `agentId` que devuelve la
herramienta Agent) `taskctl` lee la transcripción del subagente en
`<config>/projects/*/*/subagents/agent-<id>.jsonl` (`<config>` = `CLAUDE_CONFIG_DIR`
o `~/.claude`) y suma, por `message.id` único (la última aparición), entrada +
escritura y lectura de caché + salida de cada llamada. Varios `--agente` van en
un solo registro y un solo commit. `--tokens N` da una cifra a mano (la parte del
orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
(`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
avisa, sin bloquear, si falta el coste de diseño o de revisión.

`taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--push]` cierra la
tarea. Sin los flags nuevos hace lo de siempre: merge `--no-ff` con el script de
Git-Flow del tipo y tarea a `terminada`.

- `--tag <nombre>` pone un tag **anotado** (mensaje = título de la tarea) sobre
  el commit de merge, que se calcula de forma explícita y no es `HEAD` (tras el
  merge hay un commit de cierre encima). El nombre se valida **antes** de
  mergear: `git check-ref-format "refs/tags/<nombre>"`, sin `-` inicial, y que no
  exista en local ni en `origin` (con origin caído y `--push`, aborta; sin
  `--push`, avisa). En un reintento (el merge ya está hecho) un tag que apunta
  al merge de esa tarea se salta y uno ajeno aborta. **Solo se sube con
  `--push`**, y solo si la rama destino ya está en origin con ese commit; sin
  `--push` la salida dice que el tag quedó solo en local. En hotfix y release
  `--tag` pasa a `merge-hotfix-to-main.sh` / `merge-release-to-main.sh`, que
  aceptan `--tag <nombre>` y lo usan en lugar del calculado: sigue habiendo un
  solo tag. `finish --push` no sube `main` (se avisa), así que en un hotfix el
  tag solo se sube si `main` ya estaba en origin con el merge.
- `--merge-request` (solo feature y fix) **no mergea**: sube la rama (siempre,
  aunque no pases `--push`: sin ella no hay merge request, y la salida lo dice),
  abre un pull request (`origin` en `github.com`, con `gh`) o un merge request
  (host que contiene «gitlab», con `glab`, también autoalojado) contra la rama
  base, anota su URL en una sección `## Merge request` de `tarea.md`, la
  commitea en la rama de la tarea y la deja en `en-revision`. Un host de origin
  desconocido **aborta** nombrando qué configurar: no se supone GitLab. Antes
  de subir nada se comprueba que hay `origin`, que el CLI está instalado y que
  tiene sesión (`gh auth status` / `glab auth status`); cada fallo dice qué
  instalar o configurar. Antes de crear se busca un PR/MR abierto de esa rama
  para no duplicarlo. La URL de `origin` (puede llevar credenciales) no se
  imprime ni se escribe en ningún sitio.
- **Segundo `finish`** (`taskctl finish TASK-NNN --merge-request [--tag <n>]`;
  el flag es opcional si `tarea.md` ya tiene la sección `## Merge request`):
  pregunta a la plataforma por el estado del PR/MR **por nombre de rama**. Si
  está `merged` (con merge, squash o rebase: no se exige ancestría) hace
  `fetch`, comprueba que el commit resultante está en `origin/<base>`, avanza la
  base local con fast-forward, mueve la tarea a `terminada` y regenera
  CHANGELOG, INDEX y BOARD; con `--tag`, el tag va sobre el commit que la
  plataforma da como resultado del merge. Si sigue abierto, o se cerró sin
  mergear, o no se puede saber (red, error del CLI), aborta sin tocar nada.
- `.taskcode/config.yml` admite `cierre_por_defecto: merge | merge-request`
  (por defecto `merge`). `taskctl finish` **no** la lee: la usa la skill
  `finish` en modo automático, que no pregunta, a través de `taskctl siguiente
  --json` (campo `cierre`). En manual y semiautomático la skill pregunta.
  Como cualquier clave del config, un valor mal escrito aborta, y una versión
  anterior del plugin rechazaría la clave: todo el equipo actualiza a la vez.
