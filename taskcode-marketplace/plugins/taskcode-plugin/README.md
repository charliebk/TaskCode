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

## Revisores por pares que trae el plugin

`taskctl review` reparte el diff de la tarea entre las skills revisoras según
los `patrones_archivo` que declara cada una en su `SKILL.md` (si el diff toca
más de tres dominios, va entero al genérico):

| Skill | Dominio | Entra si el diff toca |
|---|---|---|
| `angular-vue-reviewer` | Angular y Vue | `.vue`, `.component.ts`, plantillas y rutas bajo `src/app`, composables |
| `csharp-autocad-ifc-reviewer` | C# sobre AutoCAD o IFC | `.cs`, `.csproj`, `.sln`, `.ifc` |
| `java-spring-reviewer` | Java y Spring Boot | `.java`, `pom.xml`, `build.gradle`, `application*.yml` |
| `rust-wasm-reviewer` | Rust y WebAssembly | `.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/config.toml`, toolchain/rustfmt/clippy |
| `code-quality-reviewer` | Genérico | Lo que no casa con ningún dominio, o más de tres dominios a la vez |

Cada petición de revisión trae una sección `## Contexto permitido` con lo que
el revisor puede leer:
- el `tarea.md` y `planificacion/` de la tarea;
- los ficheros de su parte del diff, sin lo excluido ni los tests reservados;
- las rutas que el proyecto añada con la clave `contexto_revision` de
  `.taskcode/config.yml`, que es una lista de rutas, como `CLAUDE.md` o una
  carpeta de documentación.

La skill común de los revisores (sección «Lo que lees») manda no leer fuera de
esa lista. Lo que se lea de más se justifica en `## Lecturas fuera del contexto
permitido` del informe.

En una ronda de verificación (la 2 o posterior), la petición añade la línea
`- Modelo sugerido para esta ronda:` con un modelo un escalón más barato
(opus→sonnet→haiku). Solo aparece si la ronda anterior cumple todo esto:
- ningún CRÍTICO, en cualquier estado;
- todas las tablas de hallazgos son legibles;
- no hay ninguna severidad desconocida;
- ningún informe sigue siendo la plantilla.

En cualquier otro caso, el revisor usa el modelo de la tarea.

**La revisión converge.** El coste de revisar crece con el tamaño de la
corrección, no con el del proyecto. Desde la ronda 2, la ronda es una
verificación **acotada** (la línea `- Alcance:` de la petición y la salida
de `taskctl review` lo dicen, con su motivo), también si la ronda anterior
dejó CRÍTICOS o IMPORTANTES:
- revisan los revisores que tienen hallazgos pendientes (todo lo que no está
  `aceptado`; lo `corregido` también se verifica), cada uno los suyos, y los
  de dominio cuyos ficheros toca la corrección; todos reciben el diff entero
  de la corrección;
- cada revisor comprueba sus hallazgos, ejecuta la suite y busca el fallo
  que abre la corrección, y solo abre un hallazgo nuevo si es CRÍTICO o lo
  introduce la propia corrección;
- un merge de la base entre rondas no la cambia: se nombra en el motivo y lo
  que entra con él va en el diff.

Es completa solo con `taskctl review TASK-NNN --completa` (desde la rama
base), sin commit revisado fiable, o si un informe de la ronda anterior no se
puede leer (sin tabla, plantilla sin rellenar, severidad desconocida o
cambios pedidos sin ningún hallazgo). Una completa que sigue a una acotada
revisa desde la rama base.

Entre una ronda y otra se corrige **todo** lo de la ronda: los CRÍTICO e
IMPORTANTE siempre; el MENOR que no compense se marca `aceptado` con su
motivo o pasa a una tarea nueva. `taskctl review` avisa si se abre una ronda
con hallazgos de la anterior sin marcar. Tras la ronda 3 con cambios,
`taskctl siguiente` pregunta en cualquier modo y `taskctl review` no abre la
ronda 4 sin `--ronda-extra`, que se pasa solo cuando lo decide una persona.

El motivo, medido: con la regla anterior (0.12), un IMPORTANTE en cualquier
estado, también corregido, obligaba a una ronda completa; los revisores
vuelven a listar los corregidos, así que cada ronda relanzaba una revisión
entera que encontraba otra tanda (hasta 14 rondas en una tarea).

## Regla de una hora

Una tarea prevista de más de **una hora de punta a punta** (de la rama abierta
al cierre con merge) se parte en varias.

- **Plan:** `plan-final.md` lleva `Duracion estimada: N min` bajo «Enfoque
  propuesto», con sus señales: ficheros de código previstos (la mejor señal
  medida), capas y criterios.
- **Approve:** con más de 60 min, o con una cifra que no se entiende,
  `taskctl siguiente` pregunta en cualquier modo y `taskctl approve
  --decidido-por automatico` se rechaza: decide una persona (trocear o aprobar
  entera con el motivo). Sin la línea, `approve` solo avisa.
- **Finish:** `tarea.md` gana `## Duracion` con la estimada y la real de punta
  a punta (sin pausas), y `taskctl metricas` las muestra en las columnas
  `estimada` y `punta_a_punta`, para calibrar. La fila `finish` de
  `## Transiciones` marca el **fin** del cierre (tras la verificación completa
  y el merge), no el instante en que arrancó el comando, así que `punta_a_punta`
  incluye lo que tarda la verificación. `## Duracion` añade la línea
  `- Cierre (finish): <s> s, de <inicio> a <fin>` y `metricas` la columna
  `finish` (justo antes de `punta_a_punta`; `—` sin dato). Las tareas cerradas
  antes no se migran: su fila `finish` sigue marcando el arranque.

Cómo trocear (porción vertical pequeña frente a capas) y las señales, en la
skill `task-workflow`, `duracion.md`.

## Roles del brainstorm de diseño

`taskctl plan` lanza roles de `agents/` según la complejidad, por este orden de
prioridad: `brainstorm-arquitectura`, `brainstorm-riesgos`,
`brainstorm-testing` y `brainstorm-dominio`. Con dos o más, el
`brainstorm-unificador` consolida sus salidas en el plan.

`brainstorm-rendimiento` es un rol **condicional**: no ocupa sitio en esa
escalera. Se suma cuando la tarea lleva una de las etiquetas `rendimiento`,
`wasm`, `workers` o `3d` (sin distinguir mayúsculas) y la complejidad ya
lanza dos roles o más. Mira el coste algorítmico con el volumen real, las
asignaciones en bucles calientes, las copias entre JS y WASM, los Web Workers,
las mallas y teselas grandes, y qué medir antes de optimizar. Con cero o un rol,
`plan` avisa de que no entra y por qué: sin unificador, rendimiento quedaría
como autor único de un plan cuya forma no le toca proponer.

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

Hoy no bloquea nada: la distribución es un marketplace público por Git. Queda
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
taskctl 0.13.0 — TaskCode
[...]

$ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
taskctl 0.13.0 — TaskCode
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

## Sincronización de ficheros derivados

Un proyecto puede regenerar en cada transición los ficheros que derivan del
estado de las tareas (un plan, un tablero, un roadmap) con
`comando_sincronizacion` y `rutas_sincronizacion` en `.taskcode/config.yml`;
lo que el comando reescribe entra en el mismo commit de la transición. La guía
completa (claves, salvaguardas, conflictos de merge) está en la skill
`task-workflow`, en `sincronizacion.md`.

Las rutas son ficheros relativos a la raíz del repo, fuera de `.taskcode/` y
`.git/`. De `tareas/` solo se admite un fichero suelto en su raíz:

```yaml
comando_sincronizacion: "node scripts/roadmap.mjs"
rutas_sincronizacion: [tareas/ROADMAP.md, docs/PLAN.md]
```

El motivo: fuera de las carpetas de estado (`tareas/00-planificadas/` …
`tareas/04-terminadas/`) `taskctl` solo escribe `tareas/ROADMAP.md`, y nunca si
está declarado aquí (ver «ROADMAP de tareas» abajo), así que un fichero suelto
en la raíz de `tareas/` no choca con lo que escribe la herramienta, y sin esa
excepción un roadmap propio que vive ahí se quedaba atrasado tras cada transición.
`tareas/01-en-diseno/x.md`, `tareas/otra/x.md` y `tareas` (la carpeta) se
siguen rechazando, sin distinguir mayúsculas. `informe_cobertura` no tiene esta
excepción.

## ROADMAP de tareas (`tareas/ROADMAP.md`)

`taskctl` mantiene en cada proyecto un `tareas/ROADMAP.md`: una tabla por hito
(el campo `sprint`), con las columnas Paso, Tarea, Título, Complejidad, Depende
de y Estado, en orden de dependencias (ninguna tarea antes que sus predecesoras;
a igualdad, la del hito anterior y luego la de número menor), y un resumen de
lo que está en marcha y lo que está listo para empezar. Un ciclo de
dependencias no aborta nada: sale en una sección «Dependencias circulares» y
como aviso. No lleva fecha, así que una transición que no cambia nada no lo
toca.

**Cuándo.** `new`, `plan`, `approve` y `finish` (tras el merge) lo regeneran
dentro de su propio commit, solo cuando ese commit cae en la rama de
integración (`rama_base`). `start`, `review` y el resto commitean en la rama de
la tarea y no lo tocan: por eso dos ramas en paralelo nunca chocan en él. Si
añadirlo al commit falla, se avisa y la transición sigue sin él.

**La marca.** Su tercera línea es exactamente
`<!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->`
(se compara la línea entera, ignorando CRLF; nunca por subcadena).

**La regla de no pisar.** Las transiciones solo escriben el fichero si lleva
la marca o si no existe y nunca ha existido (`git log --all` no sabe nada de
él). Nunca si no lleva la marca (es del proyecto, aunque lo genere otro
script), si está en `rutas_sincronizacion`, si tiene cambios sin commitear
(avisan), ni si en disco se llama con otras mayúsculas. Cualquier fallo al
generarlo (una `tarea.md` ilegible, una zona manual sin cerrar) deja el
fichero como estaba y solo avisa.

**La zona manual.** Lo que va entre una línea que empieza por
`<!-- manual:inicio` y la línea `<!-- manual:fin -->` se conserva byte a byte.
Ahí van el motivo de cada hito y un `### Hn — título` por hito, que da el
título y el orden de su tabla.

**Comando.** `taskctl roadmap` muestra el que se generaría, sin escribir.
`taskctl roadmap --comparar` lista, sin escribir nada, lo que difiere del
actual (tareas con su título, complejidad, dependencias y estado, hitos, filas
duplicadas, zona manual y el texto propio fuera de ella que se perdería) y sale con 1 si hay
diferencias. `taskctl roadmap --escribir` lo regenera sin commitear, aunque no
exista o tenga historia; sobre uno sin la marca, solo si `--comparar` saldría
limpio.

**Migrar un proyecto que ya tiene el suyo.** Mientras no lleve la marca,
`taskctl` lo deja en paz. Para pasarlo: `taskctl roadmap --comparar`, corregir
lo que salga (normalmente, llevar a una zona manual los textos y los títulos
de los hitos), repetir hasta que salga limpio, `taskctl roadmap --escribir`,
revisar el diff, commitear y retirar el script propio. La guía está en la skill
`task-workflow`, en `roadmap.md`. Con una versión vieja del plugin, un ROADMAP
con la marca se queda desactualizado sin aviso.

## Problemas conocidos

### Un subagente se deniega con «Auto-Mode Bypass»

**Síntoma.** Con Claude Code en modo de permisos automático (*auto mode*; no
confundir con `modo_flujo: automatico` del plugin), las fases que lanzan subagentes (`plan` con
sus roles y el unificador, `review` con los revisores) se paran porque Claude
Code deniega el lanzamiento y cita *Auto-Mode Bypass*, sin más explicación.

**Causa.** Desde Claude Code 2.1.317/2.1.318, el modo automático deniega el
lanzamiento de un subagente cuando un hook `PreToolUse` cuyo matcher alcanza
a `Agent` (o `Task`) reescribe el encargo. Es lo que hace, por ejemplo,
context-mode 1.0.169, que añade un bloque al prompt de cada subagente. El
hook puede venir de otro plugin instalado o de un `settings.json` (de
usuario, de proyecto o `settings.local.json`).

**Diagnóstico.** `taskctl doctor` (o `taskctl doctor --json`) lo detecta: da
un AVISO con id `hooks-subagente` por cada hook `PreToolUse` cuyo matcher
alcanza a `Agent` o `Task` (también `""`, `"*"` o sin matcher), con el origen
(plugin o settings), la ruta del fichero y el matcher literal. Solo mira los
plugins habilitados (`enabledPlugins`) y la versión instalada activa de cada
uno. Es un aviso y no cambia el código de salida: el hook puede ser inocuo.

**Salidas** (cualquiera de las tres):

1. **Quitar `Agent` y `Task` del matcher.** Si el hook está en tus settings,
   edítalo. Si es de un plugin, sus ficheros se sobrescriben al actualizarlo:
   la forma estable es un hook propio de `SessionStart` en tus settings que,
   al arrancar cada sesión, reescriba el `hooks.json` de ese plugin sin
   `Agent` ni `Task` en el matcher.
2. **Desactivar el plugin causante:** `"enabledPlugins": { "<plugin>@<marketplace>": false }`
   en `settings.json`, o `/plugin` en Claude Code.
3. **Aprobar a mano cada lanzamiento:** salir del modo de permisos
   automático de Claude Code (por ejemplo, al modo por defecto, que pregunta)
   mientras se lanzan los subagentes, y aprobar cada uno.

Después, `taskctl doctor` debe dar `hooks-subagente` en `ok` (salvo que
elijas la tercera salida).

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

`taskctl doctor [--json]` (solo lectura) comprueba de una vez que el proyecto
está listo para trabajar y es lo primero que conviene ejecutar al instalar el
plugin en un proyecto. Una línea por comprobación (`ok`, `aviso`, `error` u
`omitida`) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
algún error (los avisos no cuentan). Comprueba:

- **Entorno**: Node 22 o superior, `git` y un `bash` capaz de ejecutar los
  scripts de Git-Flow. Lo último se prueba ejecutando de verdad un script mínimo
  (`scripts/gitflow/_sonda-bash.sh`: `mktemp`, `dirname`, `grep`, `sed`, `tr`, `wc`,
  `git`) con el mismo lanzamiento que usan los scripts, no mirando una ruta ni
  `bash --version`: en Windows detecta el bash de WSL (System32) y el de Git sin
  `usr\bin` en el PATH, y el arreglo dice qué poner al principio del PATH.
- **Repositorio**: que es un repo Git (un worktree también), que tiene commits,
  las cinco carpetas de `tareas/`, la rama base (`develop`, o `rama_base`) y la
  principal (`main` o `master`), `origin` y el workspace. Sin `origin` es un aviso
  (un proyecto solo local es legítimo) y pasa a error con `cierre_por_defecto:
  merge-request`; un workspace sucio es un aviso. El workspace se mira con
  `GIT_OPTIONAL_LOCKS=0`, así que no toma `index.lock`; un fallo por bloqueo es aviso.
- **Config**: `.taskcode/config.yml` con el mismo validador que el resto de comandos
  (un valor inválido es error con su mensaje; una clave desconocida, aviso).
- **Verificación selectiva** (`verificacion-selectiva`): con `comando_verificacion`
  y sin `comando_verificacion_selectiva`, `aviso` con el arreglo en la misma
  línea; con las dos, `ok` (con `rutas_verificacion_parcial`, dice que `finish`
  puede integrar con la selectiva y un merge a mano no). Con
  `rutas_verificacion_parcial` y sin `rutas_documentacion`, `aviso`: la clave no
  tendría efecto. Sin completa no dice nada.
- **Verificación**: si la config declara `comando_verificacion` (ver abajo), `ok`
  con el comando y su timeout. Sin él, depende de si el proyecto tiene tests en
  su raíz:
  - **Con tests detectables**: `aviso`, con el comando propuesto listo para pegar
    en la config. Los frenos no actúan aunque haya con qué verificar. Detecta
    `package.json` con script `test` propio (`pnpm`, `yarn` o `npm` según el
    fichero de bloqueo; el `test` que deja `npm init` no cuenta), `Cargo.toml`,
    `pom.xml` y `build.gradle(.kts)` (con `mvnw`/`gradlew` si existen),
    `*.csproj`/`*.sln`, `go.mod` y `pyproject.toml` que mencione pytest. Si hay
    varios, propone sus comandos encadenados con `&&`.
  - **Sin tests detectables**: `omitida`, con el arreglo en la misma línea. Un
    proyecto sin tests no está mal configurado.

  Solo mira la raíz (desde ahí se ejecuta el comando): un manifiesto en una
  subcarpeta no cuenta. `doctor` no ejecuta el comando ni escribe la config.
- **Tareas**: cada `tarea.md` se lee y valida, y su `estado` tiene que ser el de
  su carpeta. Son errores, con el ID: un ID en dos carpetas, un `tarea.md` ilegible
  (con la ruta y la causa), una carpeta de tarea sin `tarea.md`, un estado distinto
  de la carpeta.
- **Plataforma**: solo si la config pide merge request por defecto o declara
  `plataforma_remota`: `gh`/`glab` instalado y con sesión (sin subir nada; espera
  como máximo 10 s). CLI no instalado o sesión rechazada es error; no poder
  verificarlo (timeout, sin red) es aviso; si no aplica, `omitida`. Nunca imprime
  la URL de `origin` con credenciales.
- **Hooks** (`hooks-subagente`): los hooks `PreToolUse` que alcanzan a los
  subagentes (ver «Problemas conocidos»). Como mucho, aviso.
- **Versión del plugin** (`version-plugin`): compara la versión del plugin que
  tiene instalada Claude Code (`installed_plugins.json`) con la de la copia local
  de su marketplace. Si la del marketplace es mayor, aviso con las dos versiones,
  la fecha de esa copia y los comandos para actualizar (`claude plugin marketplace
  update <marketplace>`, `claude plugin update taskcode-plugin@<marketplace>` y
  reiniciar Claude Code). No sale a la red: si la copia local no se ha refrescado,
  no ve versiones más nuevas. Si no puede comprobarlo (plugin no instalado por
  Claude Code, sin copia del marketplace, un JSON roto), `omitida` con el motivo.
  Nunca es error: no cambia el código de salida.
- **Status line** (`status-line`): si Claude Code tiene instalada la status line
  que muestra `taskctl estado` (ver «Progreso visible» abajo). Instalada, `ok`; si
  no, `omitida` con el comando que la instala. Sin flags nunca es aviso ni error.

`--json` escribe en stdout **solo** una línea de JSON
(`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
una skill la lea. `taskctl doctor` no commitea ni cambia de rama, y sin flags no
escribe nada. La única escritura es la de la status line, con su flag:

- `--instalar-status-line` la escribe en el `settings.json` **de usuario**
  (`~/.claude/settings.json`, o el de `CLAUDE_CONFIG_DIR`): una vez, para todos
  los proyectos. Conserva el resto de claves, deja una copia
  (`settings.json.<fecha>.bak`) y escribe con fichero temporal y renombrado. Es
  idempotente. El comando es `taskctl estado --stdin` si `taskctl` está en el
  PATH del sistema. Si solo está en la carpeta del plugin (la que Claude Code
  añade al PATH de su herramienta Bash), usa esa copia con `node` y su ruta
  absoluta: como la ruta lleva la versión del plugin, tras actualizarlo hay que
  repetir `--instalar-status-line`, que la reescribe con la ruta nueva (para no
  depender de eso, pon `taskctl` en el PATH; ver «Usar `taskctl` fuera de
  Claude Code»). Si ya hay otra status line, no la toca.
- `--reemplazar-status-line` (junto al anterior) sustituye una status line
  ajena; la anterior se guarda en `statusline-previa-taskctl.json`.
- `--desinstalar-status-line` quita la de `taskctl` (una ajena no se toca) y
  devuelve la que hubiera antes.

Con cualquiera de ellos, si lo pedido no se puede hacer la comprobación sale como
`error` y el código de salida es 1.

#### Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`

Mientras `plan`, `approve`, `start`, `review`, `finish` o el freno de fin de turno
trabajan, cada uno deja en `.git/taskcode/progreso.json` (fuera del árbol de
trabajo: no cambia la huella de la verificación) la tarea, la fase, sus pasos
declarados de antemano, el paso en marcha y el instante de inicio, y lo marca
terminado al acabar, también si aborta. Escribirlo no añade ninguna salida a
ningún comando ni hook (lo que se imprime lo lee el agente y cuesta tokens) y
nunca hace fallar el comando: si no se puede escribir, se pierde ese tic.

`taskctl estado` lo muestra en una línea, leyendo solo esos ficheros, sin lanzar
`git` ni leer `tareas/`:

```
TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min
```

La fase con su posición en el ciclo (plan, approve, start, review, finish), la
ronda si es una revisión, el paso con su posición dentro de la fase, el `x/N`
del comando de verificación si lo escribe, y los minutos desde que empezó la
fase. Los pasos: `plan` guardas, brainstorm, commit; `approve` guardas, plan,
commit; `start` guardas, rama, commit; `review` guardas, integracion,
verificacion, peticiones, commit; `finish` puertas, verificacion, cobertura,
held-out, merge, artefactos; el freno de fin de turno no es una fase del ciclo y
va sin posición, con un único paso (`verificacion`, o `verificacion selectiva` /
`verificacion documentacion`): `TASK-110 · freno · verificacion (1/1) · 0 min`.
Sin nada en marcha dice `Nada en marcha.` (o la última fase y si terminó, abortó
o, en el freno, terminó `en rojo` porque la verificación falló); fuera de
un repo con `tareas/` o `.taskcode/` no imprime nada. Sale siempre con 0.
`--stdin` toma el directorio del JSON que Claude Code pasa a la status line.
`--seguir` refresca cada segundo hasta que la fase termina; sin terminal imprime
una sola línea y sale, para que un agente que lo lance no se quede esperando.

La status line de Claude Code (`taskctl doctor --instalar-status-line`) ejecuta
`taskctl estado` en cada refresco: el estado se ve sin preguntar al agente, y no
entra en su contexto. Se ve también en la app de escritorio y por Remote Control.

`TASKCTL_PROGRESO`: el comando de verificación (`comando_verificacion`, la
selectiva y la de documentación, en `finish`, en las rondas de `review` y en el
freno) recibe en esta variable la ruta de un fichero bajo `.git/`. Si escribe en
él una línea `x/N` (la última con texto cuenta), `taskctl estado` la muestra en
el paso de verificación. Es opcional: sin escribir nada, la línea muestra el
paso sin `x/N`. Solo lo recibe ese comando: no lo heredan los scripts de
Git-Flow ni el de held-out, y un `TASKCTL_PROGRESO` que ya estuviera en el
entorno se sustituye. De lo que se escriba solo se muestran los números.

#### Cómo se verifica el proyecto: `comando_verificacion`

Los frenos de verificación (que una tarea no se dé por hecha ni se mergee con
los tests en rojo) ejecutan **el comando que declara el proyecto**, nunca uno
deducido. Se declara en `.taskcode/config.yml`:

```yaml
comando_verificacion: "npm test"   # entrecomillado si lleva "#"
timeout_verificacion: 900          # opcional, en segundos (por defecto 600)
```

- `comando_verificacion`: texto no vacío; lo ejecuta el shell del sistema tal
  cual. Sin la clave no hay freno y todo funciona como antes.
- `timeout_verificacion`: entero mayor o igual que 1, en segundos. Solo tiene
  sentido con el comando: sin él, aborta.
- Un valor inválido (comando vacío, timeout `0`, decimal o texto) aborta todos
  los comandos con un mensaje que nombra la clave y la línea; nunca se cae al
  valor por defecto en silencio.
- La ejecutan el **freno de fin de turno** (hook `Stop`), la **puerta de
  `finish`** y la consulta el **guardián de merges** (hook `PreToolUse`), abajo.

#### Verificación selectiva por impacto: `comando_verificacion_selectiva`

Cuando la completa tarda mucho, el proyecto puede declarar además una
verificación **selectiva**, que corre solo lo afectado por los cambios. La usan
el freno de fin de turno y las rondas de `taskctl review`; por defecto la
completa sigue siendo la puerta de `finish` y del guardián de merges (la
excepción, más abajo: `rutas_verificacion_parcial`).

```yaml
comando_verificacion: "npm test"                                    # la completa
comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
timeout_verificacion_selectiva: 600                                 # opcional (por defecto 600)
```

- Recibe la rama base de la tarea en la variable de entorno `RAMA_BASE` (la de
  integración, o la principal en un hotfix); no se añade nada al comando. El
  mapa de capas es del proyecto: el script decide qué correr.
- Exige `comando_verificacion`: la selectiva sin la completa aborta, porque
  dejaría `finish` sin puerta. El timeout sin su comando también aborta.
- **Hook `Stop`**: con la clave corre la selectiva en vez de la completa, con su
  propio memo (`.git/freno-verificacion-selectiva.json`, con la base y su commit
  en la huella). El guardián solo lee el memo de la completa: un verde de la
  selectiva nunca deja pasar un merge, aunque los dos comandos sean iguales.
- **`taskctl review`**: la corre antes de escribir la ronda (en la primera,
  después de integrar la base en la rama; las incrementales no la integran). En
  rojo, o si deja el árbol sucio, aborta: no abre ronda y la tarea sigue en
  curso; el mensaje dice si la base quedó integrada. En verde, la
  petición lleva la sección «Verificación de esta ronda» (tipo, comando,
  resultado y final de la salida) y omite la de cobertura, porque el informe
  podría ser parcial.
- **`taskctl finish`**: ejecuta la completa como siempre (salvo con
  `rutas_verificacion_parcial`, abajo); en rojo, el mensaje recuerda que se
  exige aunque las rondas usaran la selectiva; con `rutas_verificacion_parcial`,
  en su lugar dice por qué tocó la completa y no la selectiva.
- **Sin la clave**, todo funciona como antes: el `Stop` corre la completa y
  `review` no verifica.
- **Ejemplo real**: el repo de TaskCode declara como selectiva
  `node scripts/verificar-impacto.mjs` (fuera del plugin). Elige los tests de
  lo que cambia por el grafo de imports, se para en el enrutador `src/cli.ts`
  (y lo dice), suma los de `test:rapido` y, si lo elegido pasa de
  `VERIFICAR_IMPACTO_TOPE` ficheros (10 por defecto), corre los tests directos
  o, si tampoco caben, los más próximos al módulo cambiado, y dice cuántos deja
  fuera. Con una rama base inexistente sale con error.
- Cómo escribir el clasificador y qué cambios obligan a correr todo: guía
  instalada con el plugin, `skills/task-workflow/verificacion-selectiva.md`.

#### Tareas de solo documentación: `rutas_documentacion`

El coste de verificar debe crecer con lo que cambia la tarea, no con el tamaño
del proyecto. Si todo lo que cambia la tarea frente a la base cae en rutas de
documentación declaradas, `finish` no corre `comando_verificacion`:

```yaml
comando_verificacion: "npm test"
rutas_documentacion: [docs/**, README.md, CHANGELOG.md]          # patrones git :(glob), sin anclar
comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opcional
```

- Las rutas se leen de la config de la **rama base**: la tarea no puede
  ampliarlas para eximirse, y si cambia `.taskcode/config.yml` corre la
  completa. `tareas/` cuenta siempre como documentación (la cambia toda tarea;
  sus held-out los sigue corriendo su puerta).
- **Ante la duda, la completa**: diff que no se puede calcular o vacío, mezcla
  de documentación y código, o un renombre de código a una ruta de
  documentación (cuentan las dos rutas). Un `release`
  corre siempre la completa.
- Con `comando_verificacion_documentacion` se ejecuta ese (con
  `timeout_verificacion`); su rojo bloquea y su verde va a su propio memo
  (`.git/freno-verificacion-documentacion.json`), nunca al de la completa. La
  puerta de cobertura no mide nada en una tarea de solo documentación.
- `finish` dice qué corrió y por qué, y lo anota en `tarea.md` (sección
  «Verificacion de documentacion»), commiteado antes del merge.
- No declares `**/*.md`: skills, agentes, `CLAUDE.md` o comandos son Markdown
  que se ejecuta. La guía `verificacion-selectiva.md` trae la lista.
- Exige `comando_verificacion`; el comando de documentación exige las rutas.
  Sin `rutas_documentacion`, todo funciona como antes.
- El **fin de turno** (`Stop`) y **`review`** aplican la misma decisión sobre
  todo lo que cambia la tarea frente a la base (nunca sobre el último turno ni
  el delta de la ronda). El fin de turno cuenta además lo no commiteado (un
  `.ts` sin `git add` saca el turno de «solo documentación») y, en un turno de
  solo documentación, corre la comprobación de documentación o nada. `review`
  solo verifica si declaras `comando_verificacion_selectiva`: con ella, una
  ronda de solo documentación corre la comprobación de documentación en su
  lugar (o nada) y la petición lo dice; sin ella no corre nada, como antes.
  **Cambio de comportamiento** si ya declarabas `rutas_documentacion`: esos
  turnos y rondas dejan de correr la completa o la selectiva.
- Lo aplican `finish` y el **guardián de merges**, con la misma decisión (la
  config de la rama destino): un merge a mano de una tarea de solo
  documentación pasa sin el verde de la completa, o con el verde de su
  comprobación de documentación si la hay. El guardián no aplica la exención si
  el comando hace algo más que un merge, cambiar de carpeta o de rama y
  consultar (un `git commit`, otro merge, `>`, `$(...)` o un script podrían
  cambiar lo que entra),
  en un release, ni si cambian los held-out (`tareas/.../aceptacion/`), y la
  calcula solo cuando ya iba a bloquear, con un presupuesto de 20 s.

#### Código parcial: `rutas_verificacion_parcial`

El mismo principio un paso más allá: si todo el código que cambia la tarea cae
en unas rutas acotadas, a `finish` le basta la verificación de lo afectado. Por
defecto la completa es la puerta de integración; declarar esta clave es
aceptar, para este proyecto, que en esas rutas baste la selectiva.

```yaml
comando_verificacion: "npm test"
comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
rutas_documentacion: [docs/**, README.md]
rutas_verificacion_parcial: [src/web/**]          # lista de rutas permitidas
```

- Lista de rutas **permitidas**, leída de la config de la **rama base**: si todo
  lo que la tarea cambia frente a la base, salvo la documentación, cae en ellas,
  `finish` corre `comando_verificacion_selectiva` (con `RAMA_BASE` y
  `timeout_verificacion_selectiva`) en vez de la completa. Un fichero fuera, un
  cambio de `.taskcode/config.yml` o un diff vacío van a la completa.
- Exige `comando_verificacion_selectiva` (la config aborta sin ella) y
  `rutas_documentacion` (sin ellas no tiene efecto: `taskctl doctor` avisa).
- `finish` dice que corrió la selectiva y por qué, y tras el verde lo anota en
  `tarea.md` («Verificacion parcial») antes del merge. Reutiliza un verde de la
  selectiva del mismo commit y la misma base si lo hay (fin de turno o `review`,
  con el árbol limpio).
- `finish` no evalúa la puerta de cobertura (el informe sería parcial), y
  ninguna puerta posterior mide esas líneas: el release corre la completa, pero
  su cobertura solo mide lo que añade la propia rama release. Con
  `umbral_cobertura`, las tareas integradas con la selectiva no se comparan con él.
- El release va siempre a la completa. Un hotfix nunca usa la selectiva (con
  código, la completa; de solo documentación, su camino de documentación).
- El **guardián de merges sigue exigiendo la completa para el código**: un merge
  a mano de una tarea con código queda bloqueado sin su verde, aunque a `finish`
  le bastara la selectiva. Si `finish` choca en un conflicto, no repitas el
  merge a mano ni lo cierres en la rama de integración (el guardián bloquea el
  commit que lo cerraría, y un `finish` relanzado sobre ese merge verifica la
  rama de integración y en rojo no cierra): abórtalo con
  `taskctl abort-merge`, integra la base en la rama de la tarea, resuelve allí y
  vuelve a lanzar `taskctl finish` desde ella.
- Sin la clave, todo funciona como antes.

#### Freno de fin de turno (hook `Stop`)

El plugin declara en `hooks/hooks.json` un hook `Stop` que Claude Code ejecuta
cada vez que el agente principal termina un turno, en todas las sesiones del
proyecto. Solo actúa si **hay una tarea en `tareas/02-en-curso/` cuya `rama` es
la rama actual** y el proyecto declara `comando_verificacion`; en cualquier otro
caso sale 0 sin lanzar ningún proceso (ni `git`). Cuando actúa:

- Ejecuta el comando con el mismo envoltorio que la sincronización (shell del
  sistema, stdin cerrado, el árbol entero se mata al cortarlo) y la salida a un
  fichero temporal, del que solo se lee el final.
- **Verde** (código 0): deja terminar el turno, sin escribir nada.
- **Rojo, cortado o no ejecutable**: sale con 2, así que Claude Code devuelve el
  turno al agente con este informe por stderr: el comando, el código de salida
  (o el corte), la duración y el final de la salida (stdout y stderr
  intercalados), acotado a 40 líneas y 4 KiB, sin colores ANSI, sin credenciales
  en URLs y sin partir caracteres. El informe pide no borrar ni saltar tests
  para pasar el freno.
- **Config inválida** con una tarea en curso en la rama: también sale con 2,
  con el error de la config.
- **Un solo disparo por turno**: si Claude Code ya está continuando por un
  bloqueo del freno (`stop_hook_active`), deja terminar. Es a propósito: un test
  intermitente no puede dejar al agente en un bucle.
- **Memo por huella**: guarda el último resultado junto a una huella del árbol
  (HEAD, comando, timeout y contenido de lo que no está limpio) en
  `.git/freno-verificacion.json`. Con la misma huella no se vuelve a ejecutar:
  un verde deja terminar y un rojo repite el informe, diciendo que es el
  guardado. Cualquier cambio en el árbol lo invalida, salvo en ficheros
  ignorados por `.gitignore` (la huella sale de `git status`): si lo único que
  cambia es un ignorado (`.env.local`), cambia algo versionado o ejecuta el
  comando a mano.
- Una tarea de `02-en-curso` con el `tarea.md` ilegible no frena (no se sabe si
  es la de esta rama), pero el hook la nombra en un aviso.
- **Tope**: el `timeout` del hook es 3600 s, y Claude Code descarta la salida
  de un hook que lo agota (el freno no frenaría). Por eso la verificación se
  corta a `min(timeout_verificacion, 3540)` s, avisando si se recorta.
- Si la verificación cambia ficheros del árbol (compilados, cobertura), el
  informe lo avisa: el siguiente comando de `taskctl` puede abortar por
  workspace sucio.
- **Apagarlo**: `FRENO_VERIFICACION=0` en el entorno de Claude Code, o quitar
  `comando_verificacion` de la config.
- Los subagentes no disparan `Stop` (disparan `SubagentStop`), así que el freno
  no los frena; y no actúa si la persona interrumpe el turno (Esc).

#### Coste de implementación automático (hooks `Stop` y `SubagentStop`)

Con una tarea en curso en la rama actual, el plugin anota al terminar cada
turno y cada subagente qué transcripción ha trabajado en ella. Solo guarda
rutas, en `.git/coste-pendiente.jsonl` (`git rev-parse --git-path`): no lee
transcripciones, no toca `tarea.md`, no cambia la huella del freno de arriba
y sale siempre con 0. Sin tarea en curso en la rama sale antes de lanzar
ningún proceso (las mismas guardas baratas que el freno).

`taskctl review` suma ese coste a `tokens_implementacion` en su propio commit,
con una fila en `## Coste` por fuente: `sesion:<id>` (el hilo principal) y
`agente:<id>` (cada subagente; también los de la sesión aunque el hook no los
viera). Cuenta solo las llamadas cuyo `timestamp` cae entre el `start` y el
`review` de `## Transiciones`, cuyo `gitBranch` es la rama de la tarea y cuyo
`cwd` está dentro del repo: el diseño, otras tareas de la misma sesión y la
revisión no entran. Lo ya anotado para un id se descuenta (de uno anotado en
implementación solo se suma lo que creció, `dif:`; uno anotado en otra fase o
junto a otros no se toca), así que un `registrar-coste --fase implementacion`
hecho antes no se duplica. `taskctl finish` repite el volcado como red. Si
todo el ciclo cabe en un turno, el hook aún no ha corrido al llegar a
`review`: entonces se usa la sesión que nombra `CLAUDE_CODE_SESSION_ID`, si
Claude Code la define. Un fallo del volcado nunca rompe `review` ni `finish`:
deja la tarea como estaba y avisa.

Lo que se acepta: el fichero de `.git/` no viaja con el clon (una tarea
trabajada en otro clon se registra a mano) y las correcciones de la ronda 2,
que se hacen con la tarea en revisión, no cuentan como implementación.
`COSTE_AUTOMATICO=0` en el entorno lo apaga todo.

#### Puerta de verificación en `finish`

Con `comando_verificacion` declarado, `taskctl finish` lo ejecuta **siempre**
antes del primer efecto (merge, o subir la rama y abrir el merge request): no
reutiliza un verde guardado, porque la huella no ve los ficheros ignorados.

- **No verde**: aborta con el mismo informe que el freno y sin tocar nada.
- **Verde que ensucia el árbol** (compilados, cobertura no ignorados): aborta con
  un mensaje propio antes de que el script de Git-Flow lo haga por workspace sucio.
- Hay que lanzarlo **desde la rama de la tarea**: es el árbol que se verifica.
- **No corre** en el segundo `finish --merge-request` (la plataforma ya mergeó).
- **En el camino idempotente** (la rama ya integrada: un merge a mano, o el
  commit que cerró un conflicto en la rama de integración) verifica el árbol de
  la rama de integración antes de cerrar (TASK-123), con la misma decisión
  proporcional (documentación, selectiva o completa, sobre lo que entró con la
  tarea) y reutilizando un verde del mismo árbol. En rojo aborta sin mover la
  tarea, vuelve a la rama de partida y dice cómo arreglarlo; `--sin-verificacion`
  la salta y lo anota en `## Verificacion omitida`.
- `--sin-verificacion` la salta y lo deja escrito en `tarea.md`, sección
  `## Verificacion omitida`, con un commit en la rama de la tarea **antes** del
  merge: el rastro sobrevive aunque el proceso muera después.
- Tras un verde guarda el memo con la huella del commit, que es lo que consulta
  el guardián de merges.
- `finish` tarda lo que tarde la suite: si lo lanza un agente, que su
  herramienta de shell no lo corte antes.

#### Tests held-out (`aceptacion/`)

Tests de aceptación que escribe la **persona** a partir de los criterios y que
el agente que implementa no debe ver. Van en la carpeta `aceptacion/` de la
tarea, se commitean **en la rama base durante el diseño, antes de `start`** (la
rama nace con ellos y no aparecen en su diff), y se ejecutan con:

```yaml
comando_heldout: "npm run aceptacion"   # recibe la carpeta en HELDOUT_DIR
```

`taskctl finish` los ejecuta justo después de la puerta de verificación, en
los mismos caminos (no en el segundo `finish --merge-request` ni en el camino
idempotente), con el cwd en la raíz del repo, `HELDOUT_DIR` = ruta absoluta de
la carpeta y `timeout_verificacion` como tope. Aborta, sin mergear:

- si no salen en verde, mostrando **solo** comando, código y duración: la salida
  de un test suele llevar sus aserciones, y la lee el agente;
- si la rama los ha **editado, añadido o borrado** respecto a la rama base (se
  compara el árbol de Git de `aceptacion/`, esté en el estado que esté), o los
  trae sin estar en la base; el mensaje da las órdenes para restaurarlos en su
  ruta. Si quien los cambió fue la base (la persona los corrigió después de
  `start`), pide integrarla en la rama (`git merge <base>`);
- si hay una carpeta `Aceptacion/` con otras mayúsculas;
- si la tarea tiene `aceptacion/` y la config no declara `comando_heldout`;
- si en verde dejan el árbol sucio.

La rama base es la de integración, salvo en un hotfix, que nace de la principal. Si los held-out de un hotfix
están en la rama de integración y no en la principal, aborta en vez de cerrar sin ejecutarlos.
`comando_heldout` y su timeout se leen de la config **de la rama base**: la rama de
la tarea no puede cambiar cómo se ejecutan. `--sin-verificacion` no los salta. Sin `aceptacion/` (ni en la rama ni en la
base) no hay puerta. La petición de revisión excluye siempre
`tareas/*/TASK-*/aceptacion/**`, aunque se cambie `excluir_de_revision`: el
revisor no los lee. Que queden fuera de `comando_verificacion`, o el freno de
fin de turno mostraría su salida. En la rama de la tarea, un hook `PreToolUse`
impide al agente leerlos, buscarlos o editarlos (ver `skills/task-workflow/heldout.md`).

#### Cobertura de las líneas cambiadas

Una línea cambiada que ningún test ejecuta es un hallazgo. Se mide sobre las
líneas añadidas o cambiadas desde la **merge base** de la rama con su base (no
sobre todo el repo), sin lo que excluye `excluir_de_revision` ni los held-out, y
con el informe **lcov** que genera el propio `comando_verificacion`: taskctl
nunca ejecuta tests para obtenerlo.

```yaml
comando_verificacion: "npm test"           # tiene que escribir el lcov
informe_cobertura: coverage/lcov.info      # relativa a la raiz del repo; ignorala en .gitignore
umbral_cobertura: 80                       # opcional: % minimo cubierto para que finish cierre
```

- **`taskctl review`** añade a la petición la sección «Cobertura de las líneas
  cambiadas»: las líneas sin cubrir por fichero (`src/a.ts: 4-6, 9`), el
  porcentaje y los ficheros que cambian pero el informe no lista. Solo informa:
  si el informe no existe, está cortado, es anterior al último commit de la
  rama o ninguna de sus rutas es un fichero del repo fuera de lo excluido, lo
  dice como aviso y no lista líneas. Sin `informe_cobertura` no hay sección.
- **`taskctl finish`**, solo con `umbral_cobertura`: justo después de la
  verificación (que acaba de regenerar el informe) y antes de los held-out,
  aborta sin mergear si el porcentaje cubierto no llega al umbral (el valor
  exacto pasa), y también si no hay datos fiables: el informe no existe, está
  cortado, es anterior a la verificación de ese mismo `finish`, o ninguna ruta
  del informe es del fuente del repo. Sin datos nunca cuenta como aprobado.
- Cuenta una línea cambiada (no en blanco) con `DA` en el informe (`DA:n,0` =
  sin cubrir); sin `DA` no es ejecutable. Un fichero cambiado que el informe no
  lista cuenta con todas sus líneas sin cubrir si el informe **sí** mide su
  extensión y alguna de sus carpetas tiene un fichero medido, sin contar la
  raíz del repo ni la del proyecto que generó el informe (la carpeta contra la
  que se resuelven sus rutas relativas, como `pkg/`, y sus padres): un `.mjs`
  nuevo en `src/` que ningún test carga (`node --test` y c8
  sin `--all` solo listan lo cargado). No cuentan un `.md` o un `.yml`, los
  tests si el proyecto los excluye de la cobertura (`test/` sin nada medido) ni
  los `*.d.ts`: una tarea de solo documentación, o de solo tests, no se frena.
  Un `.ts` solo de tipos en una carpeta medida sí cuenta; para evitarlo, genera
  la cobertura con `--all`/`include`, y saldrá en el informe sin líneas
  ejecutables.
- Las rutas `SF:` pueden ser absolutas o relativas, con `\` o `/`. Una relativa
  se resuelve contra la carpeta del informe y cada una de sus padres hasta la
  raíz, la más cercana primero: un proyecto en `pkg/` con el informe en
  `pkg/coverage/lcov.info` funciona.
- `umbral_cobertura` e `informe_cobertura` se leen, en `finish`, de la config
  **de la rama base**: la rama no puede rebajar su propio freno. El umbral exige
  `informe_cobertura` y `comando_verificacion`.
- `--sin-verificacion` no regenera el informe, así que tampoco mide el umbral:
  lo avisa, y el salto queda anotado en la tarea.
- Si la cobertura mide el código compilado (por ejemplo `dist/`, excluido) y no
  el fuente, el informe no sirve: con umbral, `finish` no cierra.

#### Guardián de merges (hook `PreToolUse`)

Antes de cada comando Bash o PowerShell del agente (sin filtro `if`: el de
prefijo no ve `cd x && git merge`), el hook mira si el texto integra algo en la
rama de integración (`rama_base`) o en la principal:

- `git [-C dir] merge … <ref>`, con destino la última rama de un `git
  checkout|switch` del mismo texto o, si no hay, la rama actual; y los scripts
  `merge-<tipo>-to-<destino>.sh <rama>`. Un `git checkout <x>` con un único
  argumento solo cambia el destino si `x` es una revisión: una rama (en
  `refs/heads/` o en `refs/remotes/origin/`), un tag o un commit (estos dos
  desacoplan HEAD, así que el merge no entra en ninguna rama). `HEAD` y `@` no
  cambian el destino: te dejan en la misma rama. `git checkout README.md && git
  merge x` restaura un fichero y el destino sigue siendo la rama actual.
- El texto de `bash|sh|zsh|dash [opciones] -c "…"`, `pwsh|powershell -Command …`,
  `cmd /c|/k …` y `eval …` se analiza igual que si se hubiera escrito
  directamente (también con opciones con valor delante, como `bash -o pipefail
  -c`), y también tras `time [-p] [--]`, `nohup`, `!`, dentro de un grupo
  `{ …; }` y en la condición o el cuerpo de `if`, `elif`, `else`, `while` y
  `until`.
- **Bloquea** (exit 2, el motivo le llega al agente) si no hay un **verde
  guardado para el commit que entra** —sin verde cuenta como no verde— y remite
  a `taskctl finish` (o a `--sin-verificacion`, si lo decide la persona).
- **Bloquea el commit que cierra un merge en curso** (TASK-123): un `git commit`
  (también `git commit -am`, `git add … && git commit`) o `git merge --continue`
  con `MERGE_HEAD` presente en la rama de integración o la principal es el merge
  hacia ella, y lo que se commitea es la resolución, no lo verificado en la rama
  de la tarea. Pasa solo con un verde guardado de ese mismo árbol (el del freno
  `Stop`) o si lo que entra ya está integrado (ancestro de `HEAD`, de la
  principal o de `origin/<rama>`: cerrar un `git pull` o un
  `git merge origin/develop` con conflicto no se bloquea). Propone `taskctl abort-merge`,
  integrar la base en la rama de la tarea, resolver allí y relanzar `finish`
  desde ella. Sin `MERGE_HEAD`, o en una rama de tarea (que es justo el
  remedio), no se toca.
- **Bloquea siempre si `.taskcode/config.yml` existe pero no se puede leer**
  (un valor inválido de cualquier clave) y el destino es `develop`, `main` o
  `master` —lista fija, porque sin config no se sabe `rama_base`—, aunque lo
  que entra ya esté integrado. El mensaje cita el error; se arregla el fichero
  (`taskctl doctor` lo valida) y se repite el merge. Una config mal escrita no
  desactiva el guardián. *Cambia el comportamiento de la 0.14.0*, que dejaba
  pasar.
- **Deja pasar** si el texto no contiene `merge` ni `commit` (sale sin cargar nada),
  `merge --abort|--continue|--quit|--skip` como opción (no como el valor de
  otra: `git merge -m --abort x` o `--message --abort x` sí mergean `x` y se
  evalúan), `merge-base`,
  `git config merge.*`, `echo "git merge …"`, merges hacia ramas de trabajo, lo
  que ya está integrado (ancestro del destino, de la principal —el backmerge de
  recuperación de un hotfix— o de `origin/<destino>`), proyectos sin fichero de
  config o sin `comando_verificacion` y cualquier otro fallo antes de saber que
  el destino es protegido.
- `eval`, `time`, `nohup`, `{ …; }` y las estructuras de control nunca reciben
  la exención de solo documentación: el merge se evalúa completo.
- Nunca ejecuta la suite (su `timeout` es de 30 s): solo lee el memo.
- Es una defensa contra despistes, no contra un agente hostil: no ve alias de
  git, `git pull`, `git push . x:develop` ni lo que se calcula en una subshell.
  Tampoco ve el cierre de un merge con `cd <otro repo> && git commit`, con
  `--git-dir`/`--work-tree` ni con un alias de git (`git ci`): solo respeta
  `-C <dir>`. Es el hueco inherente al análisis sintáctico del texto.
  La red de verdad es la puerta de `finish`.

`taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]`
es otro comando, distinto de `doctor`: aquel comprueba que el proyecto está listo
para trabajar con el flujo de tareas; este, que **la aplicación está lista para
publicarse** sin agujeros conocidos (claves expuestas, secretos en git, RLS,
cookies, HTTPS, dependencias vulnerables...). Sin `--crear-tareas` solo lee. La
skill `/taskcode-plugin:doctor-deploy` lo encadena con un agente revisor para los
puntos de juicio (ver «Puntos de juicio» más abajo).

- **Tipo de aplicación**: lo detecta por ficheros marcadores (Node con npm,
  pnpm o yarn, Rust, Python, Java con Maven o Gradle, .NET, Go, PHP, Ruby, Docker
  y frontend web), hasta tres carpetas de profundidad y sin mirar `node_modules`,
  `vendor`, `target`, `dist` ni `build`, y lo muestra. Los tipos y sus marcadores
  son datos del catálogo (`tipo_N_*`): añadir uno no toca código. Si no detecta
  ninguno, lo dice (los puntos que dependen de un tipo salen NO APLICA).
- **Clase de aplicación** (segundo eje, independiente del lenguaje): web, api,
  android, ios, flutter, react-native, cli o libreria, con los marcadores de la
  familia `aplicacion_N_*` del catálogo (`id`, `nombre`, `marcadores` y,
  opcional, `contiene`: textos que debe contener el fichero marcador; un
  `package.json` es `cli` si contiene `"bin"`). Sale como «Aplicacion
  detectada», con el fichero que la decidió. Además de los frameworks, cuentan
  como api las señales de servicio que no dependen de él: `EXPOSE` en un
  Dockerfile, `ports:` en un compose o `web:` en un Procfile; una CLI que además
  sirve HTTP sale cli y api, y los puntos aplican. Un punto puede declarar
  `punto_N_aplicaciones: [web, api, ...]`: se combina con `punto_N_tipos` con
  Y, y dentro de cada lista basta con uno. **Si no se detecta ninguna clase, el
  punto aplica**; solo sale NO APLICA si se detecta alguna y ninguna está en la
  lista, con el tipo y el marcador en el motivo. Hoy eso apaga los puntos de
  servicio desplegado (https-obligatorio, cookies-seguras, security-headers,
  rate-limits, backups-y-migraciones, health-check, proteccion-de-bots,
  limitar-respuestas-api, cors-restringido y proteccion-csrf) en una CLI o una
  librería sin marcadores de web ni de api. Un id desconocido o del eje
  equivocado aborta, también en `.taskcode/doctor-deploy.yml`.
- **Catálogo**: `scripts/doctor-deploy.yml` (formato plano `punto_N_*`, con
  `total_puntos`). 43 puntos: los 20 pedidos, los medibles que faltaban y los de
  dominio. Cada uno tiene `id`, `severidad`, `tipos`, `metodo` (`determinista` o
  `juicio`), `sonda` (solo los deterministas), `arreglo`, `descripcion` y
  `referencia` opcional, con la categoría del OWASP Top 10 2025 y el capítulo
  del ASVS 5.0 que lo cubren (`OWASP Top 10 2025 Axx; ASVS 5.0 Vnn`);
  licencias-de-dependencias no la lleva porque ninguno de los dos trata
  licencias.
- **Cuatro estados**: `OK` (con evidencia: nunca OK sin ella), `FALLA` (con
  evidencia —fichero y línea, o commit— y el arreglo del catálogo), `NO VERIFICADO`
  (diciendo qué falta: una herramienta, o la revisión con juicio) y `NO APLICA`
  (con el motivo). Sale con **0 sin FALLA y 1 con alguna**. Un NO VERIFICADO no
  cambia el código de salida, pero el resumen dice «N de M sin verificar»: salir
  con 0 no significa «listo para publicar».
- **Qué comprueba de forma determinista** (trece sondas; todo lo demás
  es de juicio y sale NO VERIFICADO hasta que se revise con criterio):
  secretos en el árbol; secretos en **todo el historial** de git (todas las
  ramas, etiquetas y refs; un clon superficial, un desbordamiento de límites o un
  corte dan NO VERIFICADO, nunca OK); ficheros de secretos versionados (`.env`,
  claves privadas, credenciales; `.env.example` y `.env.sample` no cuentan); que
  el `.gitignore` cubre `.env` (en **cada** carpeta de proyecto: en un monorepo
  con más de 10 se comprueban todas, hasta un tope de 200; pasado el tope el
  punto sale NO VERIFICADO diciendo cuántas faltan, nunca OK); lockfile versionado; y la auditoría de
  dependencias con la herramienta del ecosistema **si está instalada**
  (`npm`/`pnpm`/`yarn audit`, `cargo audit`, `pip-audit`, `dotnet list package
  --vulnerable`, `govulncheck`; `gitleaks` opcional para el historial). Solo
  dependencias de runtime donde la herramienta lo permite; FALLA desde severidad
  alta o crítica y el resto se lista sin fallar; una herramienta que no publica
  severidad se trata como alta. Sin la herramienta, con timeout, con un código de
  salida inesperado o con una salida que no se entiende: NO VERIFICADO.
- **Sondas de configuración** (puntos 37–43, sobre los ficheros versionados):
  reglas de Firebase abiertas (`allow ... : if true`, `allow` sin condición,
  modo de prueba por fecha, `".read": true`); tablas de `supabase/migrations/`
  sin `enable row level security` en ninguna migración del conjunto;
  credenciales literales en `.npmrc`, `.pypirc` y `settings.xml` de Maven
  (`${NPM_TOKEN}`, `${env.X}` y las cifradas no cuentan); contraseñas y tokens
  literales en `docker-compose*.yml`/`compose*.yaml` (`${X}` y `*_FILE` sí
  valen); flujos con `pull_request_target` que traen el código del PR; acciones
  de terceros sin fijar a un SHA de 40 caracteres (las de `actions/`, `github/`,
  las locales y `docker://` no cuentan); y Dockerfile cuya etapa final corre
  como root o con `ADD <url>` sin `--checksum`. Sin ficheros que revisar, el
  punto sale NO APLICA con el motivo; un fichero ilegible o mayor que el límite
  lo deja en NO VERIFICADO. Un token que ya da FALLA en `secretos-en-arbol` no
  se cuenta otra vez en `tokens-en-ficheros-de-gestor`. Cada hallazgo se
  silencia con `patron` + `fichero` + `huella` (en `pr-target-checkout`, una por
  paso del flujo); `dockerfile-sin-user` es del fichero entero y se silencia sin
  huella. Estas sondas miran cualquier `Dockerfile*`, `Containerfile` o
  `compose*.yaml` versionado, aunque el tipo Docker no se detecte.
- **Claves de ejemplo y públicas**: `AKIAIOSFODNN7EXAMPLE` y `sk_test_` no cuentan,
  ni la clave `anon`/`publishable` de Supabase ni la `apiKey` `AIza...` de la
  config web de Firebase; `service_role`, `sk_live_` y una clave privada sí. El
  arreglo de un secreto que llegó a git es **rotar la clave primero** y reescribir
  el historial después.
- **El valor de un secreto nunca se muestra**: la evidencia lleva solo los 4
  primeros caracteres y la longitud (`sk_l**** (32 caracteres)`), y todo lo que
  sale (texto, JSON, informe) pasa además por una segunda red que enmascara
  cualquier clave que se cuele.
- **`--json`**: una sola línea de JSON, **versión 3** (`version`, `commit`,
  `rama`, `arbolSucio`, `tipos`, `aplicaciones`, `avisos`, `puntos`, `veredictos`, `tareas`,
  `resumen`, `codigo`). Cada punto lleva `origen`: `sonda` (lo decidió el
  comando) o `agente` (un veredicto con juicio incorporado con `--resultado`).
  `veredictos` y `tareas` son `null` si no se pidieron `--resultado` ni
  `--crear-tareas`.
- **`--escribir`**: guarda el informe en `docs/doctor-deploy/<fecha>.md` y, al
  lado, el mismo informe en `<fecha>.json` (si ya hay uno de ese día,
  `<fecha>-2`...; escritura atómica) con el commit, la rama, si el árbol estaba
  sucio, los tipos detectados y la tabla de puntos. No commitea: lo commitea la
  persona. Es un informe de uso interno sobre un commit concreto, no una
  certificación. El `.json` es lo que lee `finish` de una release.

### Puntos de juicio: `--resultado`

Los puntos de juicio (RLS, autenticación en servidor, restringir accesos, mass
assignment, consultas parametrizadas, validación de entradas, subidas de
ficheros, cookies...) no se pueden medir con certeza. Los revisa un agente
(`agents/revisor-seguridad-deploy.md`, solo lectura) lanzado por la skill
`/taskcode-plugin:doctor-deploy`, que **cita fichero y línea o deja el punto
NO VERIFICADO**. Los tipos de aplicación sin sondas propias (API, móvil, CLI,
librería) los cubre el agente como juicio.

`taskctl doctor-deploy --resultado <fichero.json>` **repite el análisis sobre
HEAD** y mezcla los veredictos con una función pura. Formato del fichero, que
vive **fuera del repositorio** (la carpeta temporal del sistema; dentro ensucia el
árbol y el comando lo avisa):

```json
{ "commit": "<sha completo>",
  "veredictos": [ { "punto": "auth-en-servidor", "estado": "ok", "fichero": "src/auth.ts", "linea": 42, "motivo": "Una frase." } ] }
```

Cada veredicto se **rechaza con su motivo** (sale en el informe y en los avisos) y
el punto se queda como estaba, NO VERIFICADO, si:

- su `commit` no es HEAD (cada veredicto lleva el commit sobre el que se juzgó;
  vale el de la raíz si el veredicto no trae el suyo, y un prefijo de 7 o más
  caracteres);
- el punto es desconocido, no aplica o está desactivado, o es **determinista**:
  el agente nunca pisa a una sonda;
- `ok` o `falla` no traen `fichero` y `linea`: la evidencia es solo eso, sin
  fragmentos de código (cualquier campo que no sea `punto`, `estado`, `commit`,
  `fichero`, `linea` o `motivo` rechaza el veredicto);
- el `fichero` es absoluto, lleva `..`, no está versionado en ese commit, es
  binario, o la `linea` no existe (se comprueba contra el commit, no contra el
  árbol de trabajo);
- hay dos veredictos para el mismo punto (los dos se rechazan).

El `motivo` se acota a 300 caracteres, sin saltos de línea y pasado por el
enmascarado de secretos antes de guardarse (lo que se escribe en
`docs/doctor-deploy/` no se puede des-subir). Un `no-verificado` del agente se
acepta sin evidencia. El código de salida cuenta las FALLA que aporta el agente.

### Una tarea por FALLA: `--crear-tareas`

Crea una tarea por cada punto en FALLA (de una sonda o del agente), con ID del
**rango reservado**: `TASK-9999`, `TASK-9998`... hacia abajo, para no chocar con
las tareas normales. El objetivo es el arreglo del catálogo (más dónde falla,
solo `fichero:linea`; el texto libre de un agente nunca se copia a una tarea) y
el criterio, que `doctor-deploy` dé OK en ese punto. Usa las piezas de `new`: un
solo `ensureBaseBranchReady` (exige el árbol limpio y **puede cambiar a la rama
base**, como `new`; lo dice) y un solo commit para todas las tareas.

- **Repetir no duplica**: cada tarea lleva la etiqueta `doctor-deploy:<id-punto>`;
  un punto con una tarea **abierta** con esa etiqueta reutiliza la existente y lo
  dice. Si ya estaba terminada y el punto vuelve a fallar, se crea otra. **Borrar
  la etiqueta a mano rompe la deduplicación** de ese punto.
- **Avisa, sin cerrar nada**, de las tareas abiertas cuyo punto ya da OK, ya no
  aplica o ya no existe.
- Con `--escribir`, las tareas se crean **antes** de escribir el informe (el
  guard de rama base aborta con ficheros sin trackear).
- Si no hay FALLA no toca la rama ni exige el árbol limpio.

El siguiente ID reservado es el menor ocupado menos uno, mirando **tareas y
ramas** (`feature/task-9999-*`): las ramas no se borran, así que un ID cuya
carpeta se borró sigue ocupado. La numeración normal (`taskctl new`/`import`)
ignora todo ID desde `TASK-9000` y aborta si llegara hasta ahí. Un compañero con
una versión anterior del plugin crearía `TASK-10000` tras un `TASK-9999`:
actualizad el plugin a la vez.

### Aviso al cerrar una release

`taskctl finish` de una tarea `release` **avisa, sin bloquear** (y nunca ejecuta
las sondas; solo lee `docs/doctor-deploy/*.json`), si:

- no hay un informe que valga: el informe más reciente cuyo `commit` es la punta
  que se cierra, o un **ancestro** con solo `docs/doctor-deploy/` o `tareas/`
  cambiados entre ambos (el informe se commitea después de generarse, así que su
  commit nunca es la punta, y la revisión, los veredictos y los costes commitean en
  `tareas/` sin tocar el código); o
- ese informe tiene alguna FALLA de un punto de severidad `critica`.

Cualquier fallo al leer (un informe ilegible, Git que no responde) se convierte en
aviso. Como `finish` exige el árbol limpio, hay que commitear el informe antes de
cerrar.

`.taskcode/doctor-deploy.yml` (opcional) ajusta el catálogo del proyecto, con el
mismo formato plano:

```yaml
# Desactivar un punto exige motivo (es una aceptación de riesgo). Sale NO APLICA.
desactivar_1_id: lockfile-versionado
desactivar_1_motivo: Es una librería: el lockfile no se versiona por convención

# Añadir un punto propio: solo de juicio, o con una sonda ya registrada.
punto_1_id: revisar-datos-personales
punto_1_severidad: alta
punto_1_tipos: [todos]
punto_1_metodo: juicio
punto_1_arreglo: Quita los datos personales de los logs
punto_1_descripcion: Los logs no llevan datos personales de clientes

# Silenciar UN hallazgo concreto (un secreto ya rotado, un falso positivo).
# patron: el que informa el punto (stripe-live, aws-access-key, fichero-secreto...).
# Un silencio es POR HALLAZGO: un hallazgo del historial se silencia con su commit
# (silenciar_N_commit); uno del árbol, con la huella de su valor (silenciar_N_huella),
# que sale en la evidencia ("huella ab12cd34ef56"). La huella es un SHA-256 sin sal: solo
# es segura para claves de alta entropia (no permite recuperarlas). Para
# url-con-credenciales no se muestra (usuario y host son conocidos y la contrasena puede ser
# debil): esa se silencia solo en el historial, con commit; en el arbol hay que quitar la
# credencial. Sin commit ni
# huella aborta (taparía también claves nuevas del mismo fichero); la huella es opcional
# con commit. Si commit o huella son solo dígitos, ponlos entre comillas.
silenciar_1_patron: stripe-live
silenciar_1_fichero: config/prod.env
silenciar_1_commit: "ab12cd34"
silenciar_1_huella: "ab12cd34ef56"
silenciar_1_motivo: Clave rotada el 2026-10-01
silenciar_1_quien: carlos
silenciar_1_fecha: 2026-10-27
```

Un `id` desconocido en `desactivar_N_id` avisa y se ignora; un `id` repetido (con
el catálogo del plugin o consigo mismo) aborta, igual que desactivar sin motivo.
Un silencio que no coincide con ningún hallazgo avisa, y el hallazgo silenciado
sigue apareciendo en la evidencia con su motivo, quién y cuándo, y cada punto de
secretos dice «N hallazgos silenciados».

Cobertura de los escaneos de claves: se leen todos los ficheros versionados (también
los que están en `build`, `dist`, `vendor`, `target` o `node_modules`) y los sin
versionar que no están ignorados fuera de esas carpetas; en el historial, todos los
blobs, sea cual sea su ruta. Un fichero UTF-16 con BOM se decodifica; los binarios
saltados se cuentan siempre. Un fichero de texto mayor de 1 MiB no se lee y deja el
punto en NO VERIFICADO (un binario grande, no). Un `requirements.txt` solo cuenta
como lockfile si fija todo con `==`, y una regla negada (`!.env`) en el `.gitignore`
es FALLA. `.env` tiene que quedar ignorado en la raíz de cada proyecto detectado (en un
monorepo, un `.gitignore` en el subdirectorio vale para su propio `.env`), y un módulo
Go sin bloque `require` no necesita `go.sum`.

Límites conocidos: si `git cat-file --batch` devolviera una salida truncada, el historial
sale NO VERIFICADO (no se pudo provocar con Git real, así que esa rama no tiene test); un
silencio solo con huella no tapa nunca un hallazgo del historial, y si el patrón y el
fichero tienen uno el comando avisa de que exige `silenciar_N_commit`.

`taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
con la duración de calendario de cada fase (diseño = plan→start, curso =
start→primer review, revisión = primer review→finish), las rondas de
revisión, el día de cierre y el origen del dato: la tabla `## Transiciones`
del `tarea.md` (cuya columna `fecha` lleva el instante UTC al segundo desde
la 0.5.0; las filas antiguas, solo el día, dan la duración en días), o, si
la tarea no la tiene, los commits automáticos `chore(TASK-NNN): ...` con un
único `git log`; si tampoco, «—». Las pausas se descuentan: cada `taskctl
pausa` cuenta desde su fila hasta la siguiente transición que no sea otra
pausa, y se resta de la fase (y del total) en la que cae. Una pausa sin
transición detrás (tarea abierta) no descuenta, y con duraciones en días
tampoco. Lo descontado sale, por tarea, en la lista `pausas` de `--json`
(`enPausa`).
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

**Columnas de la tabla por tarea.** `id`, `complejidad`, `diseno`, `curso`,
`revision` (duraciones), `rondas` (número de la última ronda con informe; «—»
sin revisión), `crit`, `imp`, `men` (hallazgos CRÍTICO, IMPORTANTE y MENOR de
todos los informes `informe-revision-N[-<revisor>].md`, cada uno **una vez por
tarea** con clave revisor + ID), `hall_origen` (implementación/plan/
especificación/sin clasificar, de la columna `Origen`), `cierre` (día del último
`finish`) y `origen` (`registro`, `git` o «—»). Un informe sin tabla de hallazgos
deja `crit`/`imp`/`men`/`hall_origen` en «—»: sin dato, no cero. Con `--tokens`,
además `tok_diseno`, `tok_curso`, `tok_revision`, `tok_total` y el desglose de
`## Coste`: `tok_nuevos` (entrada + escritura de caché + salida),
`tok_cache_lect` (lectura de caché, aparte) y `tok_sin_desglose`
(`tokens_<fase>` menos lo desglosado; un negativo no se recorta a 0 y la celda
lleva `*`). Con varios `--repo`, la tabla abre con la columna `proyecto`.

Bajo la tabla: cuántos informes no tienen tabla de hallazgos, la mediana de
lecturas por fase y las **terminadas sin coste** en alguna fase, con el recuento
por fase y las 10 primeras («y N más»; la lista completa sale en `--json`).

**Avisos** (por stderr, con `[AVISO]`; ninguno cambia el código de salida ni
impide `--escribir`, salvo un `tarea.md` inválido): `tarea.md` inválido (la
tarea no aparece), `git log` que no se pudo consultar, `tokens_<fase>` vacío con
filas en `## Coste`, desglose mayor que el total, un agente repetido en una
fase de `## Coste` (salvo las filas de diferencia de un agente reanudado, ver
`registrar-coste`), una severidad fuera de vocabulario (con la tarea y el
fichero) e informes sin tabla de hallazgos. Con varios repos, cada tarea se
nombra `proyecto/TASK-NNN`.

**Varios proyectos: `--repo <ruta>`** (repetible; relativa al directorio actual;
por defecto, el repo actual). Junta varios repos con la clave (proyecto, id): un
mismo `TASK-NNN` en dos repos no mezcla datos. El proyecto es el nombre de la
carpeta. Antes de leer nada aborta si una ruta no existe, no tiene `tareas/`,
`--repo` va sin valor o dos carpetas distintas se llaman igual; la misma carpeta
escrita dos veces (otra grafía, otras mayúsculas en Windows) se lee una vez, con
aviso. Por stderr sale `Repos leidos: <proyecto> (N tareas, <ruta>); ...`. Con un
solo repo, stdout es el de siempre. `--repo` con `--escribir` aborta sin tocar
nada.

**`--evolucion [--tramo N]`** sustituye la tabla por la evolución de las tareas
terminadas: ordenadas por día de cierre (solo el día; desempate por proyecto y
por número de ID, `TASK-99` antes que `TASK-100`) y en tramos de N (20 por
defecto; `--tramo` exige un entero de 1 o más). Por tramo: tareas, días de
cierre, mediana de minutos de plan a finish (de las que tienen hora en las dos
marcas; las de solo día se cuentan en «solo dia»), rondas medias, hallazgos
IMPORTANTE por tarea, tokens de revisión medios y KB medios de la petición de
revisión por ronda. Cada cifra lleva su `n` (las tareas que tienen ese dato);
«— (n=0)» es que ninguna lo tiene. Dice cuántas terminadas quedan fuera por no
tener fecha de cierre (por proyecto con varios repos). Al final de cada fila,
el coste fijo por tarea frente al tamaño del proyecto: `cerradas` (tareas
cerradas con fecha de cierre al acabar el tramo) y las medianas de minutos de punta a punta, de la
fase de revisión y del propio `finish` (de las tareas con hora). Una línea
final compara el primer tramo con el último (el último completo, si hay dos o
más) y dice si ese coste **crece**, **baja** o **se mantiene** (cambio de
menos del 15 %): si crece con las tareas cerradas, algún paso de cada tarea
está pagando el tamaño del proyecto.

**`--grupos`** sustituye la tabla por grupos de tareas terminadas: por tipo, por
complejidad declarada, por número de criterios (0-4, 5-6, 7 o más), por KB de
petición de revisión por ronda (terciles calculados con todos los proyectos
juntos, cortados por valor; las tareas sin petición quedan fuera y se cuentan) y
por proyecto. Por grupo: tareas, con revisión, % aprobado a la primera (una sola
ronda con veredicto `aprobada` o `aprobada-con-correcciones`, sobre las que
tienen revisión), rondas medias, CRÍTICO+IMPORTANTE por tarea (de las que tienen
tabla de hallazgos) y, aparte, las tareas sin revisión y las revisadas sin tabla
de hallazgos. Los grupos son fijos: uno sin tareas sale con 0 y «—».
`--evolucion` y `--grupos` se combinan entre sí y con `--repo`, no con
`--heuristica`, `--tokens` ni `--escribir`.

**`--por-version`** (desde la 0.12.0) agrupa las tareas terminadas por la
versión de `taskctl` con la que se cerraron: la de la columna `version` de la
última fila `finish` de `## Transiciones` (un `finish` abortado y reintentado
con otro plugin deja dos; cuenta el último). Por versión, en orden semver
(0.9 antes que 0.10; una pre-release como `0.12.0-dev` antes de su release):
tareas, con revisión, % aprobado a la primera, rondas medias, tokens medios por
fase (con su `n`) y una segunda tabla con los hallazgos por severidad y por
origen (de las tareas con tabla de hallazgos). Las tareas sin versión anotada
(cerradas antes de la 0.12.0, medidas con los commits o con la celda editada a
mano) van a un grupo «sin version» aparte: la versión **nunca se deduce por la
fecha de cierre**. Se combina como `--evolucion` y `--grupos`.

**La columna `version` de `## Transiciones`.** Desde la 0.12.0 cada transición
anota la versión de `taskctl` que la escribió, como quinta columna. Las filas
anteriores, de cuatro columnas, se siguen leyendo igual (y siguen congelando el
modo). La primera fila con versión que se añade bajo una cabecera de cuatro
columnas cambia **solo la cabecera y su separador** a cinco, para que la
versión se vea en GitHub y GitLab; las filas viejas no se tocan. Un `taskctl`
anterior a la 0.12.0 no reconoce las filas de cinco columnas y deja de ver el
modo congelado de esa tarea: **usa la misma versión del plugin en todo el
repo**. Para que la versión anotada sea útil, se sube al **abrir** el ciclo de
una versión nueva (la primera tarea que la construye), no al publicarla.

**`--json`** escribe en stdout un único objeto JSON
(`{proyectos: [{proyecto, ruta, tareas}], sinCoste: {terminadas, total, porFase,
tareas}, evolucion?, grupos?, porVersion?}`), también sin tareas; los avisos y la lista de
repos van por stderr. Cada `null` va junto a un `n: 0` en el mismo objeto; nunca
`NaN`. `porVersion` es `{terminadas, versiones: [...], sinVersion}`, con cada grupo
en la forma `{version, n, conRevision, aprobadasPrimera, pctAprobadaPrimera,
rondasMedia, sinRevision, conHallazgos, sinTablaHallazgos, hallazgosPorSeveridad,
hallazgosPorOrigen, tokens: {diseno, implementacion, revision}}` (cada fase
`{suma, conDato, media}`). Solo se combina con `--repo`, `--evolucion`, `--tramo`,
`--grupos` y `--por-version`: con
cualquier otro flag aborta sin leer ni escribir nada.

En cualquier comando de `taskctl`, un flag repetido que no admite repetición
(todos salvo `--repo`, `--agente` y `--criterio`) aborta con error en vez de
quedarse con el último valor.

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
un solo registro y un solo commit. Un `--agente` ya anotado en `## Coste` de esa
fase es un agente reanudado (su transcripción acumula los dos trabajos): se suma
solo lo que creció su transcripción desde lo ya anotado para ese id, y la fila lo
marca en su fuente (`agente:dif:<id>`), que `metricas` no avisa como repetida; si
no ha crecido, o el id está anotado junto a otros en una misma fila, aborta.
En `--fase revision` cada `--agente` va en **su propia fila** (en el mismo
commit), con las columnas `ronda` y `revisor` que se deducen de su
transcripción. Se sacan del nombre `peticion-revision-N[-skill].md` que lleva
el prompt del revisor. Lo que no se puede deducir queda como `-` («sin
atribuir»). Con un único `--agente`, `--ronda N [--revisor <skill>]` los
declara a mano; el revisor se valida contra las peticiones de `revision/`.
Las filas antiguas de 9 columnas se siguen leyendo. `metricas --tokens` las
resume, por ronda y revisor, en un bloque aparte, también en `--json`: las
lecturas, los tokens de entrada y caché, y los CRÍTICO e IMPORTANTE de su informe.
`--tokens N` da una cifra a mano (la parte del
orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
(`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
avisa, sin bloquear, si falta el coste de diseño o de revisión. El de
implementación ya no hace falta registrarlo a mano: lo suma `review` (ver
«Coste de implementación automático»); `registrar-coste --fase implementacion`
queda como respaldo.

`taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]` cierra la
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
  (host que contiene «gitlab», con `glab`) contra la rama
  base, anota su URL en una sección `## Merge request` de `tarea.md`, la
  commitea en la rama de la tarea y la deja en `en-revision`. Un host de origin
  desconocido **aborta** nombrando qué configurar: no se supone GitLab (un
  GitLab propio se declara en el config, ver «GitLab propio» abajo). Antes
  de subir nada se comprueba que hay `origin`, que el CLI está instalado y que
  tiene sesión (`gh auth status` / `glab auth status`; con la plataforma
  declarada en el config, `glab api user`); cada fallo dice qué
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
  Un valor mal escrito aborta. Una clave que el plugin no conoce **avisa** por
  stderr y se ignora (desde la 0.7.0; las versiones anteriores abortaban).

#### GitLab propio (autoalojado, con dominio propio o bajo una ruta)

Sin configuración, `--merge-request` reconoce `github.com` y los hosts que
contienen «gitlab». Para cualquier otra instancia de GitLab se declara en
`.taskcode/config.yml` (claves leídas desde la 0.7.0):

```yaml
plataforma_remota: gitlab
url_base_remoto: https://git.empresa.com            # opcional
# url_base_remoto: https://servidor.example/ruta/gitlab   # si la instancia cuelga de una ruta
```

- `plataforma_remota`: `github` o `gitlab`. Sola con `gitlab`, la base es
  `https://<host de origin>` (vale para un GitLab con dominio propio en la raíz
  del host).
- `url_base_remoto` (solo con `gitlab`): la URL **https** de la instancia, con su
  ruta si la tiene, sin usuario ni contraseña. Lo que queda de `origin` tras la
  base es el proyecto (`grupo/subgrupo/repo`), que se pasa a `glab` con `-R`.
  Con **https**, la base tiene que ser **prefijo exacto** de la URL de `origin`
  (host, puerto y ruta, sin barra final). Con **ssh o scp** solo se exige el
  mismo host (el puerto no se compara): GitLab con ruta de instancia sirve ssh
  sin ella (`git@servidor.example:grupo/repo.git`), así que si la ruta de
  `origin` empieza por la de la base se quita
  (`git@servidor.example:ruta/gitlab/grupo/repo.git` -> `grupo/repo`) y si no,
  la ruta entera es el proyecto. Si no encaja, o si hay `@` (credenciales), no
  es https o hay una URL sin plataforma, `taskctl` aborta antes de subir nada
  con un mensaje que nombra la clave.
- Sesión: `glab auth login --hostname git.empresa.com` (con ruta:
  `--hostname servidor.example/ruta/gitlab`), o la variable de entorno
  `GITLAB_TOKEN`. La sesión se comprueba con `glab api user`. El token no se
  imprime ni se escribe. `glab` solo habla https con la instancia; un
  certificado propio se resuelve en el sistema o en la configuración de `glab`.
- Con la plataforma declarada el merge request se crea con la API
  (`glab api projects/<proyecto>/merge_requests`), no con `glab mr create`:
  este último exige que un remoto de Git corresponda a `GITLAB_HOST` y con una
  instancia bajo una ruta falla siempre. Con origin `http://host:puerto` hay
  que declarar `url_base_remoto` (glab solo habla https).
- Con la plataforma declarada, cada llamada a `glab` lleva `GITLAB_HOST` fijado
  a la base y se ignoran los `GITLAB_HOST`, `GL_HOST`, `GITLAB_URI` y
  `GITLAB_API_HOST` del entorno, para que un host heredado no abra el merge
  request en otro servidor.
- El config se lee del árbol en el que se ejecuta `finish`: tiene que estar
  **commiteado en la rama de la tarea y en la rama base** (el segundo `finish`
  puede ejecutarse desde la base).
