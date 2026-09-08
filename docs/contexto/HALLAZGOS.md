# Hallazgos acumulados

Trampas que ya costaron tiempo y patrones que merece la pena repetir. Ordenado
por lo que más probablemente te muerda hoy.

## Patrones a reutilizar

### El auto-commit solo toca lo que escribe (TASK-030)

`taskctl` commitea **una a una** las rutas que acaba de escribir, y en
ningún sitio hay un `git add -A` sin pathspec. La primera justificación que
escribimos era medio falsa y conviene no repetirla: se dijo que `start`,
`review` y `finish` no comprueban el workspace porque no aplican
`ensureBaseBranchReady`. Sí lo comprueban — llaman a `isWorkspaceClean` por
su cuenta y abortan con el árbol sucio.

La razón verdadera es la **ventana entre esa comprobación y el commit**: ahí
corren scripts de Git-Flow que pueden disparar hooks del repo, y sobre todo
puede haber **otro proceso escribiendo**. En este proyecto eso no es un caso
exótico sino el normal: varios agentes en paralelo sobre la misma copia de
trabajo. Un `git add -A` dentro de esa ventana se lleva trabajo ajeno a un
commit que la persona no ha escrito.

La contraprueba que vale no es "los tests pasan": es sustituir el pathspec
por un `add -A` global y comprobar que **caen exactamente los tests que
aseveran la regla**. Eso prueba el diseño, no solo el cableado.

### Medir no basta si mides lo que no discrimina (TASK-029)

Al corregir un hallazgo de la revisión —`abort-merge.sh` decía *"workspace
restaurado al estado previo"* en un caso donde Git no rebobina nada— se
eligió como discriminante **comparar HEAD antes y después** del `--abort`.
Suena empírico: se mide el estado real en vez de suponerlo. Y estaba mal.

En un cherry-pick **de un solo commit** en conflicto, HEAD tampoco se mueve
al abortar: la operación nunca llegó a commitear. Así que la comparación
daba el mensaje del caso raro en el caso normal — precisamente el tipo de
mentira que la corrección venía a quitar. El discriminante correcto era otro:
la **ausencia del testigo** `CHERRY_PICK_HEAD`, que es lo que distingue "esto
lo confirmaste tú a mano" de "esto no llegó a aplicarse".

Lo destapó probar **el caso que se daba por bueno**, no el que se estaba
arreglando. Corolario para este proyecto: cuando un arreglo mete una
bifurcación nueva, hay que ejecutar las dos ramas. Verificar solo la que
motivó el cambio deja la otra sin mirar, y es donde cae la regresión.

### Sin terminal, stdin se ignora; con terminal, se hereda (TASK-026)

Regla del proyecto para cualquier comando que invoque un script que pueda
preguntar: `stdin: 'inherit'` **solo** si `process.stdin.isTTY`, y
`'ignore'` en cualquier otro caso. Heredar siempre parece lo natural y es
un error: quien lanza `taskctl` puede dejarle una tubería abierta que nadie
cierra —lo hace cualquier arnés de agente, y también `node --test`— y
entonces el `read -rp` del script espera **para siempre**. Con EOF el
comportamiento es determinista, y es el que documentan los avisos.

Corolario para los tests: el stdin del proceso de test **no está bajo
control**, así que un test hecho en ese mismo proceso no distingue las dos
opciones (y con `'inherit'` puede colgar la suite entera). Para
distinguirlas hay que lanzar un **proceso hijo con stdin controlado** — el
patrón está en `test/fs/gitflow-runner.test.ts`.

### Una prueba que solo puede pasar cuando algo está roto no es una prueba (TASK-028)

Al validar la primera skill del plugin, la especificación del test decía:
*"comprobar que `claude plugin validate` imprime `Validating skill:`"*. Suena
razonable y está exactamente al revés: **el validador solo nombra las skills
que fallan**. Con la skill correcta no la menciona, así que ese test habría
pasado únicamente con el fichero roto.

El error no fue de implementación, fue **de especificación**, que es más
difícil de ver: el test estaba bien escrito respecto a lo que pedía.

Lo que lo destapó fue no aceptar un verde sin entenderlo. El validador pasó
**sin mencionar la skill**, y esa ausencia se convirtió en la pregunta en vez
de ignorarse. El silencio de una herramienta es ambiguo entre *"lo revisó y
está bien"* y *"nunca lo miró"*, y esa ambigüedad hay que resolverla, no
asumirla a favor.

La forma correcta de probar un descubrimiento es la **contraprueba**: romper a
propósito una *copia* y comprobar que entonces sí se detecta. Si el veredicto
cambia solo por la ruta o el nombre del fichero, lo que se está midiendo es
que la herramienta mira ahí. Con el mismo frontmatter roto,
`skills/x/SKILL.md` da error y `skills/x/SKILL.markdown` sale 0 en silencio.

Corolario para las skills de plugin: `claude plugin validate` **no** prueba
descubrimiento —solo mira el manifiesto y saldría 0 sin ninguna skill—. Quien
sí lo prueba es `claude --plugin-dir <ruta> plugin details <plugin>`, que
imprime el inventario de componentes.

### Un fix de errno validado en una sola plataforma no está validado (TASK-027)

`ENOENT` y `ENOTDIR` describen el mismo hecho para la pregunta *"¿existe
este fichero?"*, y el reparto entre uno y otro **depende del sistema
operativo**: con `planificacion` ocupado por un fichero,
`stat("planificacion/plan-final.md")` devuelve `ENOENT` en Windows y
`ENOTDIR` en POSIX. Un helper que absorbe solo `ENOENT` se comporta bien en
Windows y revienta con un error crudo en Linux.

Lo caro no fue el bug, fue que **el test escrito para cerrar el hueco heredó
el mismo punto ciego**: se validó en Windows, pasó, y habría fallado en el
job `ubuntu-latest` del CI. Un fix de errno se comprueba en las dos
plataformas o no está comprobado. Si no hay Linux a mano, se inyecta la
semántica POSIX (envolviendo el `stat` para convertir el errno) y se verifica
por contraprueba que sin el fix el test cae — pero eso es una **simulación**,
y hay que decirlo como tal: la palabra final la tiene el CI.

Corolario: cualquier helper del estilo `existeFichero` que se pregunte por
una ruta con directorios intermedios tiene que tratar `ENOTDIR` igual que
`ENOENT`. Están `isEnoent`, `isEexist` e `isEnotdir` en `fs/task-store.ts`
justamente para no repetir la comprobación a mano.

### Doble lectura cuando un comando cambia de rama a mitad (TASK-012)

Los dos únicos CRÍTICOS de Sprint 1 salieron de aquí, y uno era **pérdida de
datos real**: `approve` leía la tarea una vez, antes de que
`ensureBaseBranchReady` pudiera cambiar de rama, y luego escribía con esa
lectura ya obsoleta — sobrescribiendo en silencio el contenido real de la rama
base.

La regla: **la lectura que decide qué se escribe SIEMPRE va después del posible
cambio de rama.** Una lectura anterior solo sirve para rechazo rápido sin tocar
Git, o para extraer metadata estable (el `tipo` de la tarea, que hace falta
para resolver la rama). Aplica a cualquier comando futuro que toque Git a mitad
de su lógica.

### Preguntas abiertas como steps de CI que aseveran

Cuando hay una hipótesis que no se puede comprobar desde el entorno de
trabajo, se convierte en **un step de CI propio que la asevera**, con
`continue-on-error: true`. El verde/rojo del step *es* la respuesta, y se lee
por la API de jobs sin necesidad de bajar logs. Así se cerraron de golpe cinco
preguntas que llevaban abiertas desde TASK-006/007.

## Empaquetado y finales de línea (TASK-031 / item E6)

### Una prueba de reproducibilidad hecha en una sola plataforma no prueba nada

Al planificar E6 se comparó el hash agregado de `dist/src` del repo con el de
un clon limpio recién compilado: **idénticos**, y se dio por buena la
reproducibilidad. Estaban los dos en Windows. El fallo real solo aparece
comparando Windows contra Linux, así que la medición confirmó exactamente lo
que ya se creía y no podía haber salido de otra manera.

Es la versión de empaquetado del hallazgo de C3 (un fix de errno validado en
una sola plataforma no está validado) y del de B7 (un smoke test que ejecuta
los comandos en el orden más cómodo confirma lo que ya creías).

### `newLine: "lf"` no controla lo que parece, y hoy además es inerte

Controla los saltos que **emite** `tsc`, no el contenido de las plantillas
multilínea, que viaja tal cual desde el fuente. Con `core.autocrlf=true` el
checkout de Windows mete CRLF dentro de un literal y el mismo `src/` compila
distinto que en Linux: medido, 34 CRLF en `dist/src/cli.js`, **los 34 dentro
del literal `HELP`**, mientras los 454 saltos del emisor ya salían en LF.

Quien fija el eol de verdad es el `.gitattributes`. Y la revisión midió algo
más incómodo: con TypeScript 5.9.3 la opción `newLine` es **inerte** — quitarla
produce salida byte a byte idéntica. Se mantiene como red ante un cambio de
versión de `tsc`, pero no se le puede atribuir un efecto que hoy no tiene.

### Una conversión de EOL hecha a mano no equivale a la de git

Git convierte CRLF→LF y **deja los CR sueltos**. Una regex ingenua
(`replace(/\r/g, '\n')`) los destruye. Convirtiendo los `.ts` a LF a mano se
partió en dos un comentario de `wrappers.test.ts` que llevaba un CR suelto
dentro. Era un comentario; podría haber sido un literal de un test.

Si hay que renormalizar, lo hace git: `git add --renormalize`, y el working
tree se materializa con un checkout, no con un script.

### `git status` y `git diff` no contestan lo mismo sobre ficheros con filtro de eol

En un worktree heredado, `git status` puede marcar ` M` un fichero cuyo blob
normalizado es **idéntico** (mismo hash, `git diff` vacío). Sobrevive a
`git update-index --really-refresh`. Consecuencias, las dos reales:

- Un guard de CI escrito con `git status --porcelain` da **falso positivo**.
- Y en local es peor: el workspace queda permanentemente sucio, el guard de
  §8.3 aborta todo `taskctl`, y **no se puede limpiar commiteando** porque no
  hay nada que commitear. Mismo síntoma que motivó ignorar `.topoplanet/`.

**Sí tiene salida, y hay que decirla porque no es evidente**: un solo
`git add --renormalize .` deja el árbol limpio, sin commitear nada — aunque
**prepara de paso todo lo tracked**, así que conviene mirar el índice después.
`git update-index --really-refresh` **no** vale: se comprobó, y el fantasma
sobrevive.

**Con qué precondición aparece, no está cerrado.** La ronda 3 de la revisión
intentó reconstruirlo por dos caminos —clon de `develop` con `autocrlf=true` y
después checkout de la rama; y worktree preexistente con `merge`— y en los dos
`git status` salió limpio y `taskctl` funcionó, pese a que los 59 ficheros
estaban efectivamente en `w/crlf`. O sea: el diagnóstico de por qué los
ficheros se quedan en CRLF es correcto y está verificado, pero **el salto de
ahí al workspace sucio necesita algo más que ninguna de las tres rondas supo
enunciar**. Queda escrito así, a medias, en vez de como una certeza que no lo
es.

> **Nota de migración, y precisión sobre a quién culpar.** Esto le pasa a
> quien traiga a un worktree **preexistente** una rama que estrena
> `.gitattributes` con `eol=lf`: sus ficheros siguen en CRLF en disco porque
> git no rematerializa lo que, normalizado, no ha cambiado. Lo provoca el
> `.gitattributes`, **no el guard** — el guard es un step de CI y no toca la
> máquina de nadie. La ronda 1 de la revisión de TASK-031 usó este efecto
> local para justificar la gravedad del fallo del guard, y la ronda 2 demostró
> que son dos cosas distintas: corregir el guard estaba bien, pero no hacía
> desaparecer esto. Tras un `git pull` de una rama así: `git add --renormalize .`,
> una vez.

Para comparar «generado == commiteado», lo que desambigua es pasar por el
índice: `git add -A -- <ruta>` y luego `git diff --cached`. Aplica el filtro
`clean` y, a diferencia de `git diff --exit-code` a secas, **ve los ficheros
nuevos y los borrados**.

### `tsc` no purga `outDir`: todo guard de «generado == commiteado» es ciego a los huérfanos

Un módulo borrado de `src/` deja su `.js` commiteado para siempre y el guard
sigue en verde, que es lo contrario de lo que promete. Hay que `rm -rf` el
directorio de salida **antes** de compilar.

### Un guard que se apoya en un step anterior puede degradarse a vacuo

El guard de Windows no compilaba: se apoyaba en el `npm run build` que lo
precedía. Reordenar o condicionar aquel step lo habría dejado pasando en verde
sin hacer nada, porque sobre un checkout limpio la comparación es trivialmente
vacía. Cada guard compila lo suyo.

### La caché de un marketplace `directory` copia el árbol de trabajo, ignorados incluidos

Instalar el plugin desde una ruta local **no demuestra** que lo versionado
baste: esa caché es una copia del directorio, no un export de Git. Se comprobó
contando 34 ficheros de `dist/test/` en la caché cuando `git ls-files dist/test`
devuelve 0. Es decir, la tabla de evidencia que se escribió habría contestado
«sí» igual **antes** de versionar nada.

Lo que sí discrimina es exportar HEAD (`git clone --no-checkout` + `checkout
<sha>`), que solo ve lo commiteado. Es lo que hace el test de AC1.

### Revisores en paralelo sobre el mismo working tree se contaminan

Los tres revisores de la ronda 1 compartieron árbol. Uno mutaba ficheros para
comprobar que los tests discriminaban mientras otro corría la suite, y este
reportó una anomalía irreproducible: un cuarto rojo y un fichero fantasma en el
índice. Los tres dejaron el repo limpio y ninguno hizo nada mal.

La norma del proyecto es paralelizar agentes en tareas transversales, y sigue
valiendo — pero **cada revisor con su propio clon**.

### La instalación real del plugin: lo que quedó confirmado y lo que no

Confirmado ejecutándolo (CLI 2.1.226): `plugin marketplace add` + `plugin
install` funcionan, la copia cacheada arranca sin compilar, Claude Code
instala las deps con `npm ci --ignore-scripts` — lo que **cierra la vía** de
compilar en `postinstall` o `prepare`, verificado también con un paquete de
prueba— y el mecanismo de `bin/` en PATH existe de verdad: en el PATH de una
sesión aparecen los `bin/` de otros plugins cacheados.

Sin confirmar: en la sesión donde se instaló, `taskctl` como comando suelto
seguía dando `command not found`. La hipótesis es que el PATH se compone al
arrancar la sesión. **No está comprobado**, y cuesta un comando en la siguiente:
`taskctl --version`.

### Limitación que condiciona E1: `bin/` de nivel superior y claude.ai

Un plugin con `bin/` en la raíz **no se puede distribuir por organization
settings de claude.ai** (`Plugin contains a top-level bin/ directory`). No
afecta al marketplace privado por Git de hoy. El día que haga falta esa vía,
habrá que renunciar a `taskctl` como comando suelto y pasar a
`${CLAUDE_PLUGIN_ROOT}/scripts/<nombre>`.

## Windows: resuelto por CI el 2026-09-05

Cinco preguntas que arrastraban TASK-006/007/008/009/010/011, todas
contestadas **que sí** sobre un checkout nativo de Windows:

| Pregunta | Respuesta |
|---|---|
| ¿`bin/taskctl` conserva el bit `+x` tras un checkout nativo? | Sí |
| ¿`taskctl` resuelve como comando suelto vía PATH? | Sí |
| ¿Los `.sh` de Git-Flow corren bajo Git Bash nativo? | Sí (smoke test completo) |
| ¿`node bin/taskctl` funciona desde `cmd.exe`, sin Git Bash? | Sí |
| ¿Pasa la suite completa en Windows? | Sí, tras corregir el glob |

`claude plugin validate` también pasó en CI, para el manifiesto del plugin y
para el del marketplace.

**Lo único que salió mal, ya corregido**: el script `test` de `package.json`
expandía los globs en el shell, y `cmd.exe` no expande globs, así que la suite
entera fallaba en Windows. Con el glob **entrecomillado** lo expande Node.
Ojo también: `node --test <directorio>` NO escanea recursivamente en Node 22 —
trata el argumento como un fichero y falla con `MODULE_NOT_FOUND`.

## `taskctl import`: tres limitaciones reales

Descubiertas usándolo de verdad para crear TASK-013…TASK-023:

1. **Aplica los mismos flags a todas las entradas del fichero.** Si las tareas
   tienen distinto sprint o complejidad, hacen falta varias pasadas.
2. **No sabe expresar `dependencias` en absoluto.** Hay que editar el
   frontmatter a mano después.
3. ~~**No se puede ejecutar dos veces seguidas.**~~ **Cerrado en TASK-030
   (item C2, 2026-09-07.)** Las carpetas que creaba dejaban el workspace
   sucio y el guard de §8.3 abortaba la siguiente invocación: la herramienta
   generaba justo la suciedad que bloqueaba su próximo uso. Ahora `import`
   commitea lo que crea, así que dos pasadas seguidas funcionan sin tocar
   nada a mano. Fijado por test en `test/commands/auto-commit.test.ts`.

Las (1) y (2) siguen abiertas. La (3) fue la evidencia que empujó el paso 5
de §8.3.

Corolario operativo que **sigue en pie**: los ficheros que le pases a
`import` van fuera del repo. Dentro son un fichero sin trackear que el guard
de §8.3 ve como workspace sucio, y eso el auto-commit no lo arregla — no es
suciedad que genere `taskctl`, es un fichero tuyo.

## Git-Flow: deuda conocida

**Los cuatro primeros puntos de esta sección se cerraron en TASK-029 (item
C6, 2026-09-07).** Se dejan escritos porque el *porqué* de cada decisión
sigue valiendo, y porque dos de ellos cambiaron la solución al medirla.

- **El registro ya no se escribe en el workspace del usuario.**
  `initialize_gitflow_log` creaba `logs/gitflow/` en el repo del usuario nada
  más arrancar, en los 24 scripts: **ensuciaba el workspace antes de
  mirarlo**, por eso `pause-work.sh` acababa preguntando qué hacer con un
  directorio que acababa de crear él, y por eso `taskctl resume` era
  inservible ahí (abortaba con *"El workspace no está limpio"* y remitía a un
  `pause` que también abortaría). Documentado desde TASK-007, redestapado por
  la revisión de TASK-026.

  Ahora va a `.git/taskcode/gitflow/`, resuelto con `git rev-parse
  --git-path` — no concatenando sobre `--git-dir`, para que siga valiendo en
  un worktree enlazado. `.git/` no forma parte del árbol de trabajo, así que
  `git status` no lo ve **nunca**, con `.gitignore` o sin él: la clase entera
  de problema desaparece en vez de taparse. Detalle que costó un `mkdir`:
  `--git-path` devuelve la ruta **relativa al cwd**, hay que absolutizarla.

  Consecuencia: **el segundo guard de `taskctl pause` se quitó**, con sus
  tests y con `isIgnored` entera (`src/fs/git.ts`), que se quedó sin ningún
  consumidor. Existía solo por la suciedad autoinfligida. Se recupera con
  `git show` si vuelve a hacer falta; llevaba dentro dos detalles que
  costaron una ronda de revisión en TASK-026: `--no-index` (sin él, algo ya
  en el índice hace que `check-ignore` conteste lo contrario de lo que dice
  el `.gitignore`) y preguntar por el fichero y no por su carpeta (`*.log`
  ignora el registro sin ignorar `logs/`). El primer guard —no hay terminal
  interactiva— sigue en pie: ese sí es real.
- **Los mensajes ya no remiten a los menús de IntelliJ.** Decían *"usa
  GitFlow 16 Pause Work"* y compañía, herencia de las run configurations de
  las que salieron los scripts. Los cuatro con equivalente real ahora citan
  `taskctl pause` / `resume` / `recover` / `abort-merge`.

  Los de "GitFlow 20/21" (mirror y switch) **no se tradujeron a un comando**:
  no existen en `taskctl`, y los cinco wrappers son exactamente `diagnose`,
  `pause`, `resume`, `recover` y `abort-merge`. Ahí se nombra el script. Es
  la misma disciplina que la sección "Lo que NO existe" de la skill:
  documentar un comando inexistente ya nos ha costado tiempo.
- **`abort-merge.sh` ya conoce cherry-pick y revert — y un tercer testigo que
  el plan no había previsto.** Antes decía *"El workspace está en estado
  normal"* y salía 0 con cualquiera de los dos a medias.

  Al medirlo (no al razonarlo) apareció que `CHERRY_PICK_HEAD` y
  `REVERT_HEAD` **no bastan**: si resuelves el conflicto y haces `git commit`
  en vez de `--continue`, Git borra el testigo, la secuencia sigue viva,
  `--abort` sigue funcionando y lo único que queda es el directorio
  `.git/sequencer/`. Se añadió como tercer testigo; las entradas de su `todo`
  (`pick` / `revert`) distinguen cuál es — se mira el fichero entero, porque
  Git no mezcla los dos verbos en una misma secuencia. En sentido contrario,
  `cherry-pick -n` no deja **ningún** rastro y el propio Git se niega a
  abortar: ahí decir "estado normal" es correcto, y hay un test que lo fija.

  `operacionEnCurso` mira los mismos testigos que el script, en el mismo
  orden, y eso sigue siendo deliberado desde TASK-026: si taskctl detectara
  más que él, habría dos comportamientos según haya terminal o no.

  La revisión por pares encontró que **el punto ciego estaba también en
  `diagnose-repo.sh`**, que se había quedado con merge y rebase: cantaba
  *"Sin operaciones en curso"* tres líneas encima de su propio `UU a.txt` y
  contradecía a `abort-merge` sobre el mismo repo. Corregido con los mismos
  cinco testigos. La lección general: cuando dos comandos leen el mismo
  estado, arreglar uno **obliga** a mirar el otro, o la herramienta empieza a
  contradecirse a sí misma.
- **El bug de `origin` sin guard está cerrado en los tres scripts que
  quedaban**: `create-develop.sh`, `recover-branch.sh` y `resume-work.sh`,
  con `detect_origin_available` y cubiertos por
  `test/gitflow/origin-guard.test.ts`. La respuesta correcta resultó ser
  distinta por script, y no "modo local" en los tres:

  - `create-develop` **aborta** con origin caído: no se puede saber si
    `develop` ya existe en el remoto, y crearla desde una principal
    posiblemente obsoleta dejaría una divergencia que el push haría
    permanente. Misma clase de daño que el tag de B2.
  - `recover-branch` **falla siempre** sin remoto: su propósito entero es
    traerse una rama de `origin`, así que no hay modo local posible. El
    arreglo aquí es fallar con un mensaje que se entienda, no fingir éxito.
  - `resume-work` **no aborta** nunca: retomar una rama local no publica
    nada, y abortar rompería el caso central de volver a tu rama con la VPN
    caída. Solo avisa.

  **Lo que queda vivo**: `create-hotfix.sh` y `create-release.sh` llevan su
  copia inline de TASK-009, anterior a la extracción de B2, así que detectan
  si hay remoto pero **no distinguen "sin origin" de "origin caído"**. No es
  el bug original —no mueren con el `fatal:` de Git— pero es la misma lógica
  duplicada en dos sitios y con menos criterio que la compartida. Y
  `detect_origin_available` imprime *"Se continuara en modo local"* también
  cuando quien la llama aborta acto seguido, así que en `recover-branch` y en
  `create-develop` sale una línea que contradice a la siguiente.
- **Confirmado por la revisión de B2 (preexistente, sin corregir)**: ejecutar
  dos veces un `merge-*-to-main` con el mismo nombre muere en el tag
  duplicado (`exit 1`, sin mensaje de guía), y un conflicto en el backmerge
  dejaría `MERGE_HEAD` pendiente tras haber completado merge y tag en
  `main`. Ambos pertenecen al alcance de TASK-014 (item B3).
- **`core.fileMode` está en `false`** en este repo. Por eso los scripts se
  invocan **siempre** como `bash script.sh`, nunca por ruta directa: así el bit
  de ejecución deja de importar.
- **Riesgo de colisión de IDs entre ramas**: un `hotfix` resuelve la rama base
  a `main`, que puede no compartir el historial de `tareas/` con `develop`
  mientras no haya backmerge. Documentado vía test en TASK-012, sin corregir.
  Lo destapa TASK-014.
- **`create-hotfix.sh` borra `tarea.md` del working tree** al hacer checkout
  desde `main` si esa rama no tiene el historial de `tareas/`. No se pierde
  nada: `taskctl` ya leyó la tarea en memoria y `moveTareaFile` la recrea
  (opción `tolerateMissingSource`, acotada a este caso).

## Divergencias entre la metodología y lo implementado

- **`taskctl board`** — resuelto en B5 (2026-09-05), con **divergencia
  residual documentada**: la tabla de la sección 8 dice que "regenera
  `docs/BOARD.md`", sin mencionar ningún flag. Lo implementado es
  `taskctl board --escribir` para regenerar, y listado por pantalla por
  defecto. El motivo de no escribir siempre es concreto: `board` es el único
  comando de solo lectura del CLI, y escribir en cada invocación dejaría el
  workspace sucio, disparando el guard de §8.3 en el siguiente
  `plan`/`start`/`review`/`finish` — la misma trampa que ya documenta
  `taskctl import` más arriba. La metodología (congelada) no se reescribe.
- **`--asignado-a` en `start`, y el alias con guion bajo** (B6, 2026-09-05).
  Tres divergencias deliberadas, todas del item B6:
  1. La §8.2 describe `--asignado-a` **solo sobre `plan`**; que `start` lo
     acepte también, y reasigne, es una **extensión**. El motivo: sin ella,
     una tarea que nadie asignó en diseño llega a `02-en-curso/` con
     `asignado_a: null`, y B7 no tiene sobre quién comprobar el límite de
     WIP — que es justo lo que la §8.2 dice que `start` debe hacer.
  2. El flag se acepta con **las dos grafías**, `--asignado-a` (la de la
     §8.2, canónica) y `--asignado_a` (la que `taskctl board` usa desde
     TASK-005), en `plan`, `start` y `board`. No es gusto por los alias:
     `parseArgs` ignora en silencio los flags desconocidos, así que la
     grafía "equivocada" salía con código 0 sin hacer nada. La revisión por
     pares de B6 encontró ese fallo ya materializado en `board`
     (`board --asignado-a carlos` devolvía **el tablero entero**), y por eso
     los tres comandos comparten hoy `parseAsignadoAFlag`.
  3. **No hay forma de desasignar desde el CLI.** Sin el flag se conserva lo
     que hubiera; el mensaje de error remite a editar `asignado_a: null` a
     mano en `tarea.md`, que contradice el principio de gobernar el repo por
     comandos. Fuera del alcance de B6, sin decidir.
- **El límite de WIP no es el que describe la §8.2** (B7 / TASK-015,
  2026-09-05). La metodología (congelada) especifica **dos límites
  independientes**, uno sobre el diseño (`plan` aborta si esa persona ya
  tiene otra tarea en `01-en-diseno`) y otro sobre la ejecución. La
  decisión #13 resolvió otra cosa: **un único límite, y solo sobre la
  ejecución**.
  - `taskctl plan` **no comprueba nada**. El límite de diseño de la §8.2
    no existe: se pueden tener varias tareas en `01-en-diseno` a la vez.
  - `taskctl start` aborta si la persona asignada ya tiene otra tarea en
    `02-en-curso` **o** en `03-en-revision`. Que la carpeta de revisión
    ocupe hueco tampoco está en la §8.2: la rama sigue viva y sin mergear
    hasta `finish`, y es ahí donde se commitean las correcciones de los
    hallazgos.
  - Motivo, textual: *"evitar que se programe código de una tarea en la
    rama Git de otra tarea"*.

  Es la mayor de las divergencias que acumula el proyecto: no es una
  extensión ni un alias, es **un límite entero de la metodología que no se
  implementa**. Quien lea la §8.2 y compruebe que `plan` no corta nada
  está viendo una decisión, no un bug.
- **El límite de WIP mira las RAMAS, no el árbol** (resuelto en C8 y
  TASK-025, 2026-09-06). B7 lo comprobaba leyendo `02-en-curso` del working
  tree, y eso **no protegía nada**: el paso a `02-en-curso` se commitea en
  la rama de la tarea, mientras `plan`, `new` e `import` devuelven el repo
  a la rama base, donde ninguna tarea está nunca en curso. Ahora se
  pregunta si la persona tiene alguna **rama local sin mergear** con una
  tarea suya en curso, leyéndola con `git show`.

  **Dos lecciones que costaron dos revisiones enteras:**
  1. Un smoke test que ejecuta los comandos en el orden más cómodo
     confirma lo que ya creías. El de B7 encadenaba dos `start` seguidos —
     el único orden en el que el límite funcionaba — y por eso el fallo
     pasó la revisión. **El smoke test tiene que reproducir el flujo
     real**, con los `plan` y los cambios de rama de por medio.
  2. La pregunta puede ser la correcta y la referencia la equivocada. Pasó
     dos veces seguidas: primero mirando el árbol en vez de las ramas, y
     luego (hallazgo CRÍTICO de la revisión de C8) decidiendo "mergeada"
     contra un conjunto de referencias que **dependía del tipo de tarea**:
     para un `hotfix` la base es `main` y la principal también, así que
     `develop` desaparecía y las 18 ramas ya cerradas del repo pasaban por
     abiertas.

  **Limitaciones que quedan, a propósito**: solo ve ramas **locales** (nada
  de `fetch`, para no meter la red en un comando que hoy funciona sin
  conexión), y una rama cuyo movimiento de tarea no esté commiteado no
  cuenta — cosa que **desde TASK-030 ya no pasa en el flujo normal**, porque
  `start` commitea el movimiento antes de terminar (item C2). El
  coste crece con las ramas abiertas: 2 ramas dan un `start` de 1,6 s; 50
  abiertas con tarea en curso, 8 s. Las mergeadas se filtran antes de
  leerlas, así que la política de no borrar ramas no lo empeora.
- **La identidad de una persona es su `git config user.email`** (decisión
  de Carlos, 2026-09-05, implementada en TASK-024). Resuelve la duplicidad
  `charlie.bk` / `carlos` que dejó abierta B7: las 12 tareas que tenían
  alguna de las dos grafías están migradas. `new` e `import` siguen creando
  con `null` a propósito: quien da de alta una tarea no tiene por qué ser
  quien la haga.

  Dos consecuencias que conviene tener presentes: **no hay forma de
  desasignar desde el CLI** (editar `asignado_a: null` a mano tampoco vale,
  porque el siguiente `plan` o `start` lo vuelve a rellenar), y **`plan`
  marca al planificador, no al ejecutor** — si otra persona ejecuta `start`
  sin flag, la tarea sigue siendo de quien la planificó y el límite se
  comprueba contra esa persona. `start` avisa cuando ocurre, pero no lo
  corrige solo, a propósito: quedarse una tarea ajena debe ser explícito.
- **`taskctl start` escribe `asignado_a` desde una lectura anterior al
  checkout** (preexistente, ampliado por B6). `start` tiene que leer la
  tarea *antes* de invocar `create-<tipo>.sh` (necesita `task.rama`), así que
  reescribe el fichero entero — estado, cuerpo, `actualizado` y ahora
  `asignado_a` — con lo que leyó en la rama anterior. Si la rama base del
  script (`main`, para un `hotfix`) tiene esa tarea con otro `asignado_a`, ese
  valor se pierde sin aviso. Reproducido por la revisión de B6. **Sin
  corregir**: es la misma colisión de historiales `main`/`develop` ya
  documentada más arriba, y en el caso `tolerateMissingSource` no hay nada
  que releer. Lo que cambia con B6 es que el payload incluye ahora el campo
  con más probabilidad de divergir entre personas.
- **Un flag repetido gana el último, en silencio** (preexistente, global al
  CLI): `plan TASK-002 --asignado-a ana --asignado-a beto` asigna a `beto`
  sin avisar, mientras que mezclar las dos grafías **sí** es error. Se
  rechaza el caso ambiguo menos peligroso y se acepta el más peligroso.
  `parseArgs` colapsa los duplicados en un solo valor, así que corregirlo es
  un cambio transversal del parser, no de un comando — anotado sin corregir,
  igual que el flag desconocido ignorado.
- **Ramas fantasma en TASK-001, 002 y 003**: su frontmatter declara una
  `rama` (`feature/task-001-scaffold-taskctl` y equivalentes) que **no
  existe en Git** — esas tres tareas llegaron en el commit inicial, antes de
  que hubiera flujo de ramas. Sin corregir a propósito (tocar su frontmatter
  es parte de E4), pero anotado porque `taskctl finish` haría
  `merge-base --is-ancestor` contra una ref inexistente si algún día se
  intentan cerrar con el comando. `docs/INDEX.md` ya lo deja por escrito en
  sus tres entradas.
- ~~**Paso 5 de §8.3**~~ (que `taskctl` commitee y suba lo que genera):
  **decidido y a medias implementado en TASK-030** (decisión #14, item C2).
  `taskctl` **commitea** lo que escribe; **subir sigue siendo explícito**,
  con `--push`. La divergencia con la §8.3 es deliberada y está escrita: el
  paso 5 pide también subir, con el argumento de que si no, el equipo no ve
  la tarea nueva hasta que alguien la suba a mano. Se aceptó esa pérdida a
  cambio de que publicar sea un acto consciente. Así que **la mitad de este
  punto sigue siendo verdad**: una tarea nueva no llega al resto del equipo
  sola.
- **Un flag mal escrito se ignora en silencio** (preexistente, global al
  CLI): `parseArgs` no rechaza flags desconocidos, así que
  `taskctl board --escrivir` lista por pantalla y sale con 0 sin escribir
  nada ni avisar. Detectado por la revisión de B5; corregirlo es un cambio
  transversal del CLI, no de un comando — anotado sin corregir. **B6 lo tapó
  solo para `--asignado-a`**, aceptando las dos grafías en los tres comandos
  que lo usan, después de que la revisión encontrara el fallo ya
  materializado en `board`. El resto de flags sigue igual.
- **El plugin no tiene `skills/` ni `agents/`.** Hoy es un CLI y unos scripts:
  todo el discurso de agentes especializados de la metodología no tiene aún
  ningún artefacto.

## Cosas del entorno anterior que ya NO aplican

Hasta el 2026-09-05 se trabajó desde un bridge de dispositivo de Cowork (una VM
Linux montando la carpeta de Windows). Estas limitaciones eran **del bridge**,
no de Windows, y en IntelliJ nativo no deberían aparecer:

- El punto de montaje sintetizaba `-rwx------` para **cualquier** fichero, así
  que `ls -la` nunca fue evidencia válida de permisos. En nativo sí lo es.
- El bridge no podía borrar ficheros dentro de `.git`, así que un commit
  interrumpido dejaba un `.git/index.lock` huérfano que bloqueaba Git entero.
  En nativo, `rm .git/index.lock` y listo.
- No había un CLI interactivo de Claude Code disponible, así que
  `claude --plugin-dir` y `/plugin install` nunca se pudieron probar de verdad.
  **En IntelliJ sí se puede** — y es lo único que le queda pendiente a
  TASK-021.

## El entorno nativo (Windows/IntelliJ): trampas confirmadas el 2026-09-05

- **`bash` invocado desde PowerShell resuelve al de WSL** (el de System32),
  que revienta con "execvpe failed" si no hay distro instalada. Todo lo que
  spawnea `bash` (la suite entera, los scripts de Git-Flow) necesita la
  carpeta usr-bin de Git for Windows (`C:\Program Files\Git\usr\bin`) PREPENDIDA al
  PATH. Y peor: invocar el bash de Git por ruta absoluta sin ese PATH deja a
  bash sin coreutils (`mktemp`, `dirname`, `grep`...) — así llegó el smoke
  test a ejecutar `git init` dentro del working tree real del plugin (ya
  tiene guard que aborta, añadido en B2).
- **3 tests fallan en local y pasan en CI**, y no son regresiones (fallan
  idéntico en `develop`): los dos del truco del symlink (`EPERM`: sin
  privilegio de symlink en Windows no se pueden crear) y uno de `plan` que
  compara contenido esperando finales LF mientras `core.autocrlf=true`
  materializa CRLF en el checkout. Referencia local: "suite verde" = fallan
  solo esos 3.

## Detalles de testing que costaron encontrarlos

- `chmod` sobre el directorio de una tarea no sirve para forzar un `stat`
  no-ENOENT si ese directorio también contiene `tarea.md`: el `EACCES`
  enmascara el caso real. Se usa un **symlink autorreferencial** (`ELOOP`) en
  su lugar.
- Los clones de smoke test no heredan `dist/` ni `node_modules/` (están en
  `.gitignore`): hay que `npm install && npm run build` siempre, y **otra vez**
  tras cada `checkout` de rama dentro del mismo clon.
- Un clon nuevo en `/tmp` no tiene identidad de Git configurada. Sin
  `git config user.email/user.name` local, cualquier commit falla con
  `exit 128` — y si va encadenado con `&&`, el fallo aparece más tarde y
  despista.
- **`plan.test.ts` tiene tests intermitentes bajo carga** (visto dos veces
  en TASK-026, con tests distintos, y una tercera el revisor con un `EBUSY`
  en `main.test.ts`): fallan en la suite completa y pasan al correr el
  fichero aislado. Antes de acusar a un cambio, **volver a correr el fichero
  solo**.
- El stdin del proceso de test **no está bajo control**: bajo `node --test`
  es una tubería abierta que nadie cierra. Un test que llegue a un `read`
  de un script no falla — **cuelga la suite entera**. Ver el patrón del
  proceso hijo en la sección "Patrones a reutilizar".

## Contenido para agentes: lo que enseñó TASK-032 (items D6 y D7)

Nueve artefactos de contenido —cuatro skills revisoras, cuatro roles de
brainstorm y la heurística de complejidad—, cero líneas en `src/`, y aun así
tres rondas de revisión con 31 hallazgos. El riesgo de este tipo de trabajo no
está en la mecánica: **un agente se cree lo que lee, así que un dato mal
puesto no es una errata, es una fuente de errores con autoridad.**

### El patrón que se repitió las tres rondas

**La corrección de un hallazgo llega sin la red que impide deshacerla.**

Tres casos, los tres medidos:

1. Los patrones de fichero de la skill de Angular se corrigieron midiendo con
   `path.matchesGlob`, pero **la medición no quedó en la suite**. Se podía
   revertir el arreglo entero —o reducir la lista a un solo patrón— y todo
   seguía en 17/17 verde.
2. La nota del rol de testing se podía revertir **literalmente** a la
   redacción rota que un IMPORTANTE había corregido: 58/58 verde.
3. El tope del hotfix se podía **negar en su sitio**: `NO es un TOPE` contiene
   la subcadena que el `assert.match` buscaba, así que un revisor reescribió
   el bloque diciendo el defecto ya corregido, con 13/13 verde.

La regla que queda: **al corregir un hallazgo, escribe la aserción que se
pondría roja si alguien deshace la corrección.** Si no se te ocurre ninguna
que ate la regla en vez de la redacción, dilo explícitamente en el informe —
eso es una respuesta legítima; dar por hecho que el arreglo se sostiene solo,
no.

### Sondas de vacuidad: mutaciones que *deberían* poner el test rojo

Las tres rondas encontraron **siete aserciones incapaces de fallar**. La
técnica que las descubre no es revisar el test, es mutar el fichero y ver si
alguien se entera. Ejemplos reales, todos reproducidos:

- **La peor**: el test que exigía «reproducir empíricamente, no leer el diff y
  opinar» se satisfacía con la etiqueta `- Reproduccion:` del esqueleto del
  informe… que **otro test obliga a que esté presente**. Borrar la sección
  entera de método de una skill (2399 bytes: los seis pasos, las técnicas por
  área) dejaba la suite verde.
- Una lista negra de herramientas por igualdad exacta: `mcp__fs__write_file`,
  `bash` en minúsculas y `Bash(git status:*)` la sorteaban. Se invirtió a
  lista blanca, que es cerrada y no envejece.
- Una aserción que exigía «nombra los cinco niveles de complejidad» se
  cumplía con la enumeración decorativa del primer párrafo, así que la nota
  podía apuntar al tramo equivocado y contradecir la tabla sin que nada lo
  viera. Se cambió por derivar el tramo **de la propia tabla**.
- Un `includes('MENOR')` que satisfacía la prosa «aprobada con correcciones
  menores» de la tabla de veredictos: se podía borrar la severidad entera.
- Cabeceras de sección presentes pero con la lista vacía debajo.

**Un `assert` que busca una subcadena en el fichero colapsado casi nunca ata
lo que crees.** Ancla al bloque que le corresponde, y añade el `doesNotMatch`
de la negación.

### Cuatro agentes cazaron un falso verde en su propia verificación

Tres por mutar con `\n` ficheros que están en **CRLF**: la mutación no se
aplicaba, el test pasaba, y ese verde no probaba nada. El cuarto por anclar
mal un `replace`, que pilló la ocurrencia de un comentario en vez de la del
dato.

La regla: **un script de mutación tiene que abortar si el fichero no cambió.**
Comprobar el md5 antes y después cuesta una línea y convierte una verificación
decorativa en una real.

### `claude plugin validate` comprueba mucho menos de lo que parece

Medido en TASK-032, ampliando lo que ya sabíamos de C5:

| Caso | Qué hace |
|---|---|
| Frontmatter que **no parsea** | error, exit 1, **nombra** el fichero |
| Frontmatter **ausente** | warning, **exit 0** |
| Falta la línea `name:` | **nada**: ni aviso ni mención |
| Directorio de skill sin `SKILL.md` | **nada** |

Y recorre `agents/` y `skills/` por **autodescubrimiento**, sin que
`plugin.json` las declare. Consecuencia práctica: un `exit 0` no prueba nada,
y las aserciones estructurales propias son la única red real. La contraprueba
(romper una copia y ver que la nombra) sigue siendo la forma de saber si el
validador mira siquiera esa ruta.

### El dato se acomoda al lector, no al revés

El único parser del repo lee pares `clave: valor` y listas **en línea**, y
falla en seco ante una lista en bloque (`Linea de ... invalida (falta ":")`).
Ante eso había dos caminos: ampliar el parser, o escribir el fichero en la
forma que el parser ya entiende. Se eligió lo segundo: ampliar el parser es
código nuevo en una tarea de redacción y rompe la regla de cero dependencias
por comodidad de formato.

Ojo con el matiz que midió un revisor: el parser **no rechaza** el
anidamiento en todos los casos — una línea sangrada la `.trim()`ea y la
registra como clave de primer nivel, perdiendo la clave madre. Un fichero
anidado podría «parsear» y decir algo distinto de lo que pone. Por eso el test
asevera también sobre las **líneas crudas**, no solo sobre el resultado.

### Divergencia nueva: `compleja` (metodología) vs `alta` (código)

El enum del plugin es `trivial | simple | media | **alta** | critica`
(`src/core/task.ts`), y `validateTask` **rechaza** `compleja`. La §16.1 y la
decisión #2 dicen `compleja`. Nadie lo había registrado hasta que D7 convirtió
esa escalera en una tabla de lookup ejecutable, y entonces importó: **3 de las
32 tareas del repo declaran `alta`**, y son TASK-016, 017 y 018 — justo las
que más agentes de brainstorm pedirían.

Aquí manda el código: es lo único que se puede leer del frontmatter de una
tarea real. La divergencia queda documentada **dentro del propio fichero**,
sin números de sección: el plugin no distribuye la metodología, así que una
referencia a «§16.1» quedaría colgando en un proyecto instalado.

### Un patrón de más no añade un revisor: sustituye al genérico

Lo que convierte un patrón de enrutado demasiado ancho en un problema serio.
`code-quality-reviewer` se dispara cuando **ningún** patrón de dominio casa;
si uno casa de más, el genérico ya no entra, y el diff acaba revisado solo por
una skill que puede declararse incompetente para él.

Pasó en las dos direcciones, y las dos veces hubo que medirlo:

- **Por exceso**: `**/*.module.ts`, `*.guard.ts`, `*.pipe.ts` y `*.spec.ts`
  son exactamente las convenciones de **NestJS**, y `**/src/app/**` es el App
  Router de **Next.js**. Un diff de backend acababa en el revisor de frontend.
- **Por defecto**, al corregir lo anterior: la guía de estilo oficial de
  Angular ≥20 eliminó el sufijo de tipo del nombre de fichero
  (`user-profile.ts`, no `user-profile.component.ts`), así que el recorte dejó
  **0 de 9** rutas de Angular moderno capturadas.

Y al reponer, dos de los tres candidatos evidentes se cayeron **midiendo**:
`src/app/**/*.scss` y `*.css` fugan a Next.js, que deja `globals.css` justo
ahí. Solo `.html` discrimina — y ni eso del todo: captura plantillas de Flask,
FastAPI, Express y Electron servidas desde `src/app/`, cosa que la skill ahora
declara como captura aceptada a sabiendas en vez de negarla.

**La lección de método**: cuando corrijas un enrutado, mide **las dos
direcciones**. Un arreglo que deja de capturar lo ajeno a costa de no capturar
lo propio no es un arreglo.
