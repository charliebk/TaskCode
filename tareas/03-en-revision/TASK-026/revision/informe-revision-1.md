# Informe de revision — TASK-026 (ronda 1)

- Commit revisado: 1ff68e190a655c03b7e3eff6f6e068a003c25e26
  (verificado sobre la punta de la rama, `8370cd1`, cuyo unico cambio sobre
  `1ff68e1` son ficheros de `tareas/03-en-revision/TASK-026/`)
- Rama: `feature/task-026-wrappers-de-git-flow-en-taskctl-diagnose`
- Base: `develop`
- Revisor: agente independiente (no implemento el codigo)
- Entorno: Windows 11 nativo, clon temporal fuera del working tree real, en
  `%TEMP%/.../scratchpad/clon026`, con `C:\Program Files\Git\usr\bin`
  prependido al PATH, `npm install && npm run build` y `npm test`.
- Veredicto: **APROBADO CON CAMBIOS** (cambios-solicitados)

## Resumen

La tarea hace bien lo que mas facil era hacer mal: la validacion de
argumentos es solida (no se cuela `--`, ni un nombre vacio, ni dos ramas, ni
`resume --push mi-rama`), `operacionEnCurso` acierta con el rebase en
conflicto, con el rebase interactivo parado en `edit` y **dentro de un
worktree enlazado**, el codigo de salida del script se propaga tal cual, la
precondicion de repositorio Git corta antes de lanzar `bash`, ningun camino
de error acaba en el catch-all de `bin/taskctl`, y ninguno de los cinco toca
`tareas/`. La suite queda en 412 tests con solo los 3 fallos de la baseline
conocida.

Los dos hallazgos IMPORTANTES atacan la **premisa** del guard de
no-interactividad, no su implementacion:

1. El guard de `pause` decide con un `git status` **anterior** a que el
   propio script ensucie el workspace creando `logs/gitflow/`. En cualquier
   repo que no tenga `logs/` en `.gitignore` — es decir, cualquier repo que
   adopte el plugin — `taskctl pause` sin terminal acaba exactamente en el
   `Opcion no reconocida: ''` con `exit 1` que el Objetivo de la tarea dice
   eliminar.
2. `isTTY === false` **no** implica "el `read` recibira EOF". Con un stdin
   que es una tuberia abierta que nadie cierra (justamente lo que da
   `node --test`, y lo que dan los lanzadores de agentes y de CI), los
   wrappers que el guard deja pasar se **cuelgan para siempre** — el mismo
   modo de fallo que motivo el `stdin: 'ignore'` que la cabecera de
   `gitflow-runner.ts` sigue citando.

---

## Estado de la suite (contexto para todo lo demas)

```
$ cd .../clon026/taskcode-marketplace/plugins/taskcode-plugin
$ npm install && npm run build && npm test
# tests 412
# pass 408
# fail 4
not ok 30  - main: taskctl plan --asignado-a confirma la asignacion y la deja en tarea.md
not ok 42  - taskctl approve: propaga cualquier error de stat que NO sea ENOENT ...
not ok 139 - taskctl plan: propaga cualquier error de escritura que NO sea EEXIST ...
not ok 145 - taskctl plan: la rama base real tiene la tarea en un estado distinto ...
```

- `42` (`EPERM: operation not permitted, symlink`) y `139`
  (`Missing expected rejection`, el truco del symlink autorreferencial) y
  `145` (`'...\r\n'` vs `'...\n'`, CRLF) son los **3 fallos de la baseline
  conocida**, no regresiones.
- `30` es un flake de entorno bajo carga
  (`EBUSY: resource busy or locked, rmdir ...`), no una regresion. Vuelto a
  correr aislado:

```
$ node --test dist/test/cli/main.test.js
# tests 9
# pass 9
# fail 0
```

Conclusion: **suite verde** segun la definicion local, y los 412 tests que
anuncia la tarea.

---

# Hallazgos

## IMPORTANTE 1 — El guard de `pause` se decide antes de que el propio script ensucie el workspace: en un repo sin `logs/` ignorado, `taskctl pause` sin terminal muere con el mismo `Opcion no reconocida: ''` que la tarea existe para evitar

### Que falla

`assertPuedeSeguirSinTerminal` (src/commands/wrappers.ts) pregunta
`isWorkspaceClean(repoCwd)` **antes** de invocar el script. Pero todos los
scripts de Git-Flow llaman a `initialize_gitflow_log`, que hace
`mkdir -p "$repo_root/logs/gitflow"` y escribe su log **dentro del repo del
usuario** (`_gitflow-common.sh:26-35`). Si `logs/` no esta en `.gitignore`,
el workspace pasa de limpio a sucio *entre* la comprobacion de taskctl y el
`git status --porcelain` que hace `pause-work.sh` en su linea 18 — y el
script pregunta.

No es un caso teorico ni nuevo: es el **hallazgo 2 de TASK-007**, documentado
en `docs/spikes/TASK-007-resultado.md:133`, con esta frase textual:

> *"un repo recien inicializado sin `.gitignore` para `logs/` se autobloquea
> en el primer uso [...] el propio script, al arrancar
> (`initialize_gitflow_log`, que corre antes de `ensure_workspace_ready`),
> crea `logs/gitflow/` y escribe ahi su log."*

Ese mismo documento dice que *"el `.gitignore` de cualquier proyecto que
adopte el plugin debe traer `logs/` desde el primer scaffold"*, y ese
scaffold **no existe todavia**. El repo TaskCode si lo ignora
(`.gitignore:14`), y por eso el dogfooding no lo ve.

El test tampoco lo ve, y no por casualidad: `withTempRepo`
(test/commands/wrappers.test.ts:88) escribe `logs/\n` en el `.gitignore` del
repo temporal, con un comentario que describe **exactamente este mecanismo**
("Sin ignorarlo, el propio script deja el workspace sucio y `pause-work.sh`
acaba preguntando que hacer con un directorio que acaba de crear el"). El
fixture neutraliza el escenario de fallo en vez de cubrirlo.

### Como lo reproduje

```bash
export PATH="/c/Program Files/Git/usr/bin:$PATH"
mkdir repoA && cd repoA
git init -q -b main .
git config user.email t@e.com && git config user.name T
echo hola > README.md && git add -A && git commit -q -m inicial
git status --porcelain          # -> vacio, workspace limpio
node .../bin/taskctl pause < /dev/null
```

Salida real:

```
== git status (limpio) ==
== node bin/taskctl pause  (stdin=/dev/null) ==
[2026-09-06 13:52:43] [INFO ] Pausando trabajo en rama: main

  Cambios sin guardar en main:
    ?? logs/

[2026-09-06 13:52:43] [ERROR] Opción no reconocida: ''. Usa 'commit', 'stash' o 'cancelar'.
== EXIT CODE: 1 ==
== git status despues ==
?? logs/
```

Es, palabra por palabra, el fallo que el Objetivo de `tarea.md` describe
como motivo de la tarea: *"con EOF inmediato, `pause` sobre un workspace
sucio muere con `Opcion no reconocida: ''`"*.

**Y la variante peor** — cuando si hay una respuesta disponible (una tuberia
con texto, o una persona en una terminal contestando `commit` a un prompt
que no entiende): `taskctl pause` sobre un repo **que no tenia nada que
pausar** crea un commit de basura y dice COMPLETADO.

```bash
cd repoJ1     # repo limpio, sin logs/ en .gitignore
git log --oneline -1        # 7d538ed inicial
printf 'commit\n\n' | node .../bin/taskctl pause
```

```
  Cambios sin guardar en main:
    ?? logs/
[2026-09-06 14:11:27] [OK   ] Commit creado: chore: wip 2026-09-06
       RESULTADO : COMPLETADO
       DETALLE   : Trabajo guardado como commit en main

-- que se commiteo --
ae5bc22 chore: wip 2026-09-06
 logs/gitflow/gitflow-2026-09-06.log | 4 ++++
 1 file changed, 4 insertions(+)
```

Para contraste, el mismo repo **con** `logs/` ignorado y workspace limpio
responde bien (`Rama main ya estaba limpia`, exit 0), igual que el clon real
del proyecto.

### Impacto

- Rompe el criterio de aceptacion *"Sin terminal interactiva, taskctl aborta
  antes de invocar el script en los casos en que la respuesta importa [...]
  `pause` con el workspace sucio"*: solo se cumple cuando el arbol **ya
  estaba** sucio antes de arrancar.
- Rompe tambien el criterio *"Sin terminal interactiva pero en un caso que si
  puede seguir (`pause` con workspace limpio), el comando funciona igual"*.
- Afecta a todo repo que adopte el plugin y no haya anadido `logs/` a mano,
  que es el caso por defecto: `taskctl pause`, el comando que la §8.3
  recomienda, es lo primero que se rompe.
- La segunda variante roza el CRITICO segun la vara del propio proyecto (*"un
  comando que hace lo contrario de lo que dice"*): commitea un fichero que el
  usuario no escribio, en su rama, y lo reporta como trabajo guardado.

### Sugerencia (no vinculante)

Sin tocar los `.sh`: excluir del guard lo que el propio Git-Flow va a
generar (comprobar limpieza con `git status --porcelain -- . ':(exclude)logs'`
o equivalente), o —mejor, y ya sugerido por TASK-007— que `taskctl` verifique
o anada `logs/` al `.gitignore` la primera vez que se usa un comando de
Git-Flow. Un test que **no** ponga `logs/` en el `.gitignore` del fixture
deberia formar parte del arreglo: hoy no hay ninguno.

---

## IMPORTANTE 2 — `isTTY === false` no significa "EOF": con un stdin de tuberia abierta los wrappers se cuelgan indefinidamente, y el `[AVISO]` afirma algo falso

### Que falla

`cli.ts` calcula `interactivo: process.stdin.isTTY === true` y, cuando es
falso, o corta (guard) o **avisa de que el script "tomara su valor por
defecto"** y lanza igualmente con `stdin: 'inherit'`. Ese aviso solo es
cierto si el `read -rp` recibe EOF. Un stdin no-TTY tiene dos sabores muy
distintos: `/dev/null` (EOF inmediato, el caso que se probo) y **una tuberia
abierta que nadie cierra ni escribe** (bloqueo eterno). El segundo es
justamente el que motivo el `stdin: 'ignore'` que sigue documentado en la
cabecera de `gitflow-runner.ts`:

> *"evita que un `taskctl finish` se quede colgado esperando en una tuberia
> que nadie va a cerrar"*

Los wrappers reintroducen ese riesgo, y el guard no lo cubre porque no
distingue los dos sabores.

Que este stdin es comun, y no rebuscado, lo demuestra el propio runner de
tests de Node. Sonda ejecutada bajo `node --test` (script con
`read -r -t 5`, stdio `inherit`):

```
# isTTY: undefined
# EOF-o-TIMEOUT rc=0
# code con stdin inherit: 0
  duration_ms: 5042.7181
```

Los 5 042 ms son la prueba: no hubo EOF, hubo **bloqueo hasta el timeout**.
Sin el `-t` (los scripts reales no lo tienen), el bloqueo es indefinido.

### Como lo reproduje

Lanzador que da a `taskctl` un stdin de tuberia y nunca escribe ni cierra
(`hang.mjs`, `stdio: ['pipe','inherit','inherit']`), con margen de 15 s:

**B2 — `resume <rama>` con un stash real y un `origin` real (bare local):**

```
[AVISO] Sin terminal interactiva: si "feature/con-stash" tiene un stash de "taskctl pause",
        resume-work.sh lo aplicara sin preguntar (es su valor por defecto).
[2026-09-06 13:54:08] [INFO ] Retomando trabajo en rama: feature/con-stash
[OK   ] Rama feature/con-stash actualizada desde origin.

  Stash encontrado para esta rama:
    stash@{0}: On feature/con-stash: pause: feature/con-stash 2026-09-06

>>> SIGUE VIVO tras 15s con stdin abierto: COLGADO. Lo mato.
>>> TERMINO solo: code=null signal=SIGKILL

== stash list tras el intento ==
stash@{0}: On feature/con-stash: pause: feature/con-stash 2026-09-06
```

El comando imprime el aviso que promete tomar un valor por defecto, y acto
seguido se cuelga sin tomarlo. Y no se cuelga "en el sitio": ya habia hecho
`checkout` de la rama y `pull`, asi que al matarlo el repo queda a medias.

**B1 — `pause` en el repo del hallazgo 1 (sin `logs/` ignorado), workspace
limpio:**

```
[2026-09-06 13:53:52] [INFO ] Pausando trabajo en rama: main
  Cambios sin guardar en main:
    ?? logs/
>>> SIGUE VIVO tras 15s con stdin abierto: COLGADO. Lo mato.
```

`recover <rama>` con la rama existiendo en local y en origin tiene el mismo
patron (mismo `read -rp`, mismo aviso).

### Impacto

- Un `taskctl resume <rama>` o `recover <rama>` lanzado por un agente, por un
  runner de CI o por cualquier proceso que herede/entregue una tuberia
  abierta **no termina nunca**. No hay timeout en ningun sitio del camino
  (`spawnSync` sin `timeout`).
- El `[AVISO]` que emite el propio taskctl es una afirmacion falsa en ese
  escenario, y es la unica informacion que el usuario recibe antes del
  cuelgue.
- El punto 1 de "Riesgos o preguntas abiertas" del plan analiza la
  sobre-restriccion del guard ("isTTY es mas estricto que la realidad") pero
  no el error contrario, que es el que muerde: **asumir que no-TTY implica
  EOF**.
- Nota de coherencia: el mismo mecanismo hace que el guard **si** rechace un
  caso que funcionaria — `printf 'stash\n' | taskctl pause` sobre un
  workspace sucio de verdad aborta con "no hay terminal interactiva"
  (reproducido). Eso es la decision declarada del plan y no lo cuento como
  fallo; lo anoto porque las dos caras salen de la misma senal sobrecargada.

### Sugerencia (no vinculante)

Sin volver a `'ignore'`: pasar `timeout` a `spawnSync` en el camino de los
wrappers (con mensaje propio al vencer), o cortar tambien en los casos
"avisados" cuando no hay TTY, en vez de avisar y lanzar. Cualquiera de las
dos convierte un cuelgue indefinido en un fallo determinista, que es el
principio que la cabecera del runner ya defiende.

---

## MENOR 3 — El test que protege el `stdin: 'ignore'` por defecto no discrimina: con el stdin del padre en EOF pasa igual con `'inherit'`, y bajo `node --test` colgaria en vez de fallar

`test/fs/gitflow-runner.test.ts` anade el caso *"sin opcion stdin, un script
que lee de la entrada recibe EOF (default 'ignore')"*, cuyo comentario dice
que sirve para que "el test falle si alguien revierte la opcion".

Sonda directa contra el `dist/` construido, con el stdin del proceso en
`/dev/null` (lo habitual en CI):

```
stdin del proceso es TTY? false
default (ignore) -> 0
explicito inherit -> 0
```

Las dos opciones dan el mismo resultado: la asercion no distingue nada en ese
entorno. Y en el entorno en el que si distinguiria — el de `node --test`,
donde el stdin del fichero de test es una tuberia que nunca cierra (ver la
sonda del hallazgo 2) — un cambio del default a `'inherit'` no haria fallar
el test: **colgaria la suite entera**, sin timeout.

Impacto: bajo. El default no ha cambiado y el resto de la cobertura de la
tarea es buena. Pero ese test concreto no cumple lo que su comentario
promete, y responde que **si** a la pregunta "¿alguno pasaria aunque el
comportamiento cambiara?".

Relacionado, misma raiz: los dos tests que invocan los scripts reales
`resume-work.sh` y `recover-branch.sh` (*"resume y recover con rama y sin
terminal avisan del valor por defecto"*) solo evitan el `read -rp` porque
`git fetch origin` falla antes al no haber remoto. Es un margen fino: en una
maquina donde `origin` fuese resoluble (un `url.<base>.insteadOf` global, por
ejemplo) o si algun dia el fixture gana un remoto, esos tests bloquearian la
suite indefinidamente en lugar de fallar.

---

## MENOR 4 — `abort-merge` afirma que "el workspace esta en estado normal" con un cherry-pick o un revert en conflicto a medias

`operacionEnCurso` mira los mismos tres testigos que `abort-merge.sh`
(`MERGE_HEAD`, `rebase-merge`, `rebase-apply`), asi que el wrapper es fiel al
script — no hay divergencia entre lo que taskctl cree y lo que el script
hara. Pero el resultado, ahora que es un comando de taskctl, es un mensaje
falso.

```bash
# cherry-pick en conflicto
git cherry-pick otra          # CONFLICT
ls .git | grep -iE "CHERRY|MERGE"
#   AUTO_MERGE
#   CHERRY_PICK_HEAD
#   MERGE_MSG
node .../bin/taskctl abort-merge < /dev/null
```

```
[2026-09-06 13:55:20] [INFO ] No hay ningún merge ni rebase en curso en la rama 'main'.
  El workspace está en estado normal.
       RESULTADO : INFO
       DETALLE   : Sin operaciones que abortar
EXIT: 0
-- sigue el cherry-pick? --
CHERRY_PICK_HEAD
```

Identico con `git revert` en conflicto (`REVERT_HEAD` presente, exit 0).

Impacto: bajo, y el arreglo esta en el `.sh`, que esta fuera de alcance a
proposito. Lo anoto para el item C6: cuando se toquen los scripts, los
testigos deberian incluir `CHERRY_PICK_HEAD` y `REVERT_HEAD`, y
`operacionEnCurso` con ellos. Como esta, `taskctl abort-merge` es un mal
sitio donde ir a preguntar "¿tengo algo a medias?".

Positivo del mismo bloque, para que conste: lo que **si** cubre acierta.

- rebase en conflicto -> `[ERROR] ... abortar el rebase en curso ... "git rebase --abort"`, exit 1
- rebase interactivo parado en `edit` -> igual, exit 1
- worktree enlazado con merge en conflicto -> `git rev-parse --git-path MERGE_HEAD`
  devuelve `.git/worktrees/repoD-wt/MERGE_HEAD` y el guard corta correctamente

---

## MENOR 5 — La ayuda promete un comportamiento que el diseno no tiene

`taskctl --help` dice:

> *"Los wrappers preguntan (guardar como commit o stash, confirmar un
> abort...): ejecutalos desde una terminal. Sin ella, taskctl aborta con
> instrucciones en vez de dejar que el script conteste solo."*

Pero el diseno, deliberadamente, **si** deja que el script conteste solo en
`resume <rama>` y `recover <rama>` — para eso existe `avisosSinTerminal`. Y
en el caso del hallazgo 1 tampoco aborta.

Impacto: bajo (texto). Bastaria matizarlo: "sin ella, aborta cuando la
respuesta importa, y avisa del valor por defecto cuando puede seguir".

---

## MENOR 6 — La precondicion `isGitRepo` acepta contextos sin working tree (dentro de `.git/`, repo bare)

`git rev-parse --git-dir` devuelve 0 dentro de `.git/` y en un repo bare, asi
que la precondicion los da por buenos y el mensaje unico de taskctl no
aplica.

```bash
cd repoF2/.git && node .../bin/taskctl pause < /dev/null
# [ERROR] git status --porcelain fallo: fatal: this operation must be run in a work tree
# EXIT: 1

cd repoF3 && node .../bin/taskctl pause < /dev/null      # repo bare
# [ERROR] git status --porcelain fallo: fatal: this operation must be run in a work tree
# EXIT: 1

node .../bin/taskctl diagnose < /dev/null                # en el bare
#   Workspace:           ✓ LIMPIO
#   Rama principal:      master
# EXIT: 0
```

Impacto: bajo. Nada revienta, nada se pierde, el error se captura
correctamente (`GitCommandError` -> `printCliError` -> exit 1, **sin** caer en
el catch-all de `bin/taskctl`), y no se deja basura (dentro de `.git/`,
`initialize_gitflow_log` no escribe nada porque `--show-toplevel` falla; el
`logs` que se ve ahi es el reflog de Git). Pero el criterio pedia "un mensaje
unico de taskctl" y aqui asoma un mensaje crudo de Git. `--git-dir` es una
comprobacion mas laxa que `--is-inside-work-tree`.

Comprobado ademas que el resto de caminos de error tampoco llegan al
catch-all: sin `git` en el PATH,
`[ERROR] No se pudo ejecutar "git": spawnSync git ENOENT`, exit 1.

---

## MENOR 7 — Con `HEAD` desacoplado, `pause` culpa a la falta de terminal de algo que no depende de la terminal

```bash
git checkout --detach HEAD~1 && echo sucio >> f.txt
node .../bin/taskctl pause < /dev/null
# [ERROR] taskctl pause tiene que preguntarte si guardar los cambios como commit o como
#         stash, y no hay terminal interactiva. Ejecutalo desde una terminal, o guardalos tu: ...
# EXIT: 1

bash scripts/gitflow/pause-work.sh < /dev/null
# [ERROR] No estás en ninguna rama (detached HEAD).
# EXIT script: 1
```

El guard corta antes y atribuye el fallo a la falta de terminal; la
instruccion que da ("ejecutalo desde una terminal") no arregla nada, porque
`pause-work.sh` aborta en detached HEAD antes de preguntar. Mismo codigo de
salida, diagnostico enganoso.

Impacto: bajo, caso raro.

---

## MENOR 8 — El mensaje de la §8.3 sigue sin nombrar `taskctl pause`, que era la premisa de la tarea

El Objetivo de `tarea.md` dice: *"la §8.3 ya le dice a la persona que use uno
de ellos: [...] el mensaje reza «Guardalos (`taskctl pause`) o comitealos» —
un comando que no existe"*. Y la metodologia congelada
(`docs/PROPUESTA_METODOLOGIA.md:333`) efectivamente lo dice.

Lo implementado nunca lo dijo, y esta tarea no lo alinea
(`src/fs/git.ts`, `ensureBaseBranchReady`):

```
`[ERROR] Hay cambios sin guardar en "${branchAntes}". Guardalos o comitealos antes de continuar.`
```

Impacto: bajo, y estrictamente hablando esta fuera de los criterios de
aceptacion. Lo anoto porque el comando ya existe y la razon de ser declarada
de la tarea era cerrar justamente esa referencia colgando; si no se cierra
ahora, conviene que quede escrito en HALLAZGOS como divergencia viva (y
matizando que remitir a `taskctl pause` desde ahi solo es buen consejo con
una terminal delante, por los hallazgos 1 y 2).

---

## MENOR 9 — Los wrappers descartan `signal`

`runWrapperCommand` hace `const { code } = runGitflowScript(...)` e ignora
`signal`, mientras que `start`, `review` y `finish` lo incorporan a su
mensaje de error ("terminado por senal X"). Un script matado por una senal
sale con 1 y sin explicacion. Trivial, pero es una asimetria gratuita con el
resto del CLI.

---

# Lo que se comprobo y esta bien

Para que no quede como implicito, todo esto se ejecuto y paso:

- **Validacion de argumentos** (todos exit 1, mensaje propio, sin lanzar
  `bash`): `diagnose --foo`, `diagnose extra`, `diagnose ""`,
  `abort-merge rama`, `pause --bar`, `resume a b`, `resume --push mi-rama`,
  `resume --`, `recover --`, `resume ""`, `resume "rama con espacios"`,
  `resume -x`, `resume "@{-1}"`, `resume "..raro"`. No encontre forma de
  colar un nombre de rama peligroso: `check-ref-format --branch` rechaza
  `@{-1}` y `..raro`, y `spawnSync` sin shell impide la inyeccion. Un nombre
  legal con comilla doble (`ra"ra`) llega **intacto** al script en Windows
  (`Retomando trabajo en rama: ra"ra`), sin destrozo de comillas.
- `pause --push -p` deduplica y llega una sola vez al script.
- **Fuera de un repositorio Git**, los cinco abortan con el mensaje unico de
  taskctl y sin lanzar `bash`.
- **Propagacion del codigo de salida**: verificada por el test con doble
  (`exit 42` -> `code 42`) y en vivo (`pause --push` sin origin -> exit 1;
  `pause` con `Opcion no reconocida` -> exit 1; `diagnose` -> 0).
- **Ningun camino llega al catch-all de `bin/taskctl`** ("taskctl no pudo
  arrancar"): `WrapperCommandError`, `GitflowScriptLaunchError`,
  `GitLaunchError` y `GitCommandError` estan todos en el `catch` de
  `cli.ts`. Comprobado con `git` fuera del PATH.
- **Herencia de stdin de verdad**: con una respuesta escrita (`printf 'commit\n\n' | taskctl pause`)
  el `read -rp` del script la recibe y actua en consecuencia.
- **Subdirectorio del repo**: `taskctl pause` desde `repo/sub` funciona y el
  `logs/` se crea en la raiz del repo, no en el subdirectorio.
- **Los cinco sobre un clon real del proyecto** (rama de la tarea):
  `diagnose` OK, `pause` OK ("ya estaba limpia"), `abort-merge` OK ("sin
  operaciones que abortar"), `recover develop` recupera desde origin.
  Ojo operativo, no es un fallo: `recover` **cambia la rama activa** del
  repo, asi que no es un comando de solo lectura.
- **Ninguno de los cinco lee ni escribe `tareas/`**, ni importa
  `state-machine` ni `task-store`, ni aplica la precondicion de rama base:
  verificado en los imports de `wrappers.ts` y en el despacho de `cli.ts`.
- **`start`, `review` y `finish` no pasan `stdin`** y se quedan con
  `'ignore'`: verificado en `start.ts:223`, `review.ts:192`, `finish.ts:349`.
- **Coherencia con la metodologia congelada**: la §8 solo los lista como
  "wrappers directos" sin especificar argumentos
  (`docs/PROPUESTA_METODOLOGIA.md:229,292`), asi que la interfaz elegida no
  la contradice. Los cinco salen en `--help` y en la lista de comandos.
- Los tests nuevos no dejan basura fuera de sus temporales (`mkdtemp` +
  `rm` en `finally`; el `args.txt` del doble se escribe en el repo temporal
  y se borra).

---

# Que pediria antes de dar la tarea por cerrada

1. **Hallazgo 1** — corregir el guard de `pause` para que no lo enganen los
   `logs/gitflow/` que genera el propio Git-Flow, **con un test cuyo repo
   temporal NO lleve `logs/` en el `.gitignore`**. Es el unico hallazgo que
   incumple criterios de aceptacion literales.
2. **Hallazgo 2** — que un stdin no-TTY que no da EOF no acabe en un cuelgue
   indefinido: un `timeout` en el `spawnSync` de los wrappers, o cortar
   tambien los casos hoy solo "avisados". Como minimo, si se decide asumirlo,
   que quede escrito en `HALLAZGOS.md` y que el `[AVISO]` deje de afirmar lo
   que no puede garantizar.
3. Los MENOR 3 y 5 son baratos y del mismo commit (un test que no discrimina
   y un texto de ayuda que promete de mas).
4. Los MENOR 4, 6, 7, 8 y 9 valen como anotacion en `HALLAZGOS.md` /
   `Resultado` de la tarea; no bloquean.
