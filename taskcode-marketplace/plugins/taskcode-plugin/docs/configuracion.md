# Configuración: `.taskcode/config.yml`, verificación y hooks

Las claves de `.taskcode/config.yml` que gobiernan la verificación, los frenos y
los ficheros derivados, y los hooks del plugin. Volver al [README del plugin](../README.md).

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

#### Documento de estado vigilado por `doctor`: `documento_estado`

```yaml
documento_estado: docs/ESTADO.md   # opcional: sin ella no se vigila ningun documento
```

- **`documento_estado`** (opcional; sin ella no se vigila ningún documento): ruta, relativa a la raíz del repo, del documento que resume el estado del proyecto. Solo la lee `taskctl doctor`, en la comprobación `documento-estado`. La fecha del documento es la de su último commit (`git log -1 -- <ruta>`), no la de modificación del fichero. Da aviso, con el arreglo, si el fichero no existe o no tiene commits; si ese commit tiene 15 días o más (14 aún es `ok`), y si alguna tarea de `04-terminadas` tiene `actualizado` posterior al día de ese commit, diciendo cuántas y cuál es la más reciente. Nunca es error, así que no cambia el código de salida. Un valor inválido aborta: vacío, ruta absoluta, que salga del repo, una carpeta, o bajo `.git/`, `.taskcode/` o una carpeta de estado de `tareas/`.

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

**En qué fases corre: `fases_sincronizacion`** (opcional). Sin la clave, el
comando corre en cada commit automático, como siempre (unas 8-10 veces por
tarea). Con ella, solo en las fases listadas; las válidas son `new`, `import`,
`plan`, `approve`, `start`, `review`, `veredicto`, `verificar-menores`,
`finish`, `pausa`, `trocear`, `registrar-coste`, `codex-review` y
`doctor-deploy`. Una fase desconocida o una lista vacía abortan como cualquier
valor inválido:

```yaml
fases_sincronizacion: [plan, finish]
```

**Cuánto tarda.** Cada ejecución deja una línea en el registro de puertas
(`.git/taskcode/puertas.log`, formato en
[registro-puertas.md](registro-puertas.md)) con la tarea, la fase, la duración
y el resultado; `taskctl metricas` lo suma por tarea en la columna `sinc`.

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
