# Plan — TASK-029: Bug de origin sin guard y deuda de los scripts de Git-Flow

Item **C6** del checklist de terminacion. La estimacion que arrastra el
checklist (~1h) es de cuando C6 era solo el bug de `origin`; C1 (TASK-026) le
anadio tres frentes mas al envolver los scripts con `taskctl`. Los cuatro
estan documentados en `HALLAZGOS.md`, seccion "Git-Flow: deuda conocida".
Estimacion realista: **~5h**.

## Enfoque propuesto

Cuatro frentes independientes por fichero, uno por agente, todos dentro de la
misma rama (norma del proyecto: paralelizar el trabajo transversal de un
sprint sin abrir ramas nuevas).

### S1 — Guard de `origin` en 3 scripts *(agente A)*

`create-develop.sh`, `recover-branch.sh` y `resume-work.sh` hacen `fetch
origin` / `pull origin` / `push -u origin` sin comprobar antes si hay remoto.
En un repo sin `origin` —como este mismo— mueren con el error crudo de Git.

No hay que inventar nada: `_gitflow-common.sh` ya expone
`detect_origin_available` (introducida en B2), que deja `REMOTE_AVAILABLE` y
`REMOTE_CONFIGURED` y distingue "sin origin configurado" de "origin
configurado que no responde". Se aplica el mismo patron que ya usan
`create-hotfix.sh` y `create-release.sh`.

Comportamiento sin remoto, por script:

- **`create-develop.sh`** — crea `develop` desde la rama principal en local,
  omite el `push` con un `log_warn` explicito y sale 0. Es el caso de uso
  legitimo: arrancar Git-Flow en un repo que todavia no tiene remoto.
- **`recover-branch.sh`** — su proposito *entero* es traerse una rama de
  `origin`. Sin remoto no hay nada que recuperar: `log_error` diciendolo con
  esas palabras y exit 1. Aqui el fix no es seguir en modo local, es fallar
  con un mensaje que se entienda en vez de con un `fatal:` de Git.
- **`resume-work.sh`** — omite `fetch` y las dos consultas `ls-remote`,
  resuelve la rama solo en local y avisa de que no se ha sincronizado. Si la
  rama no existe en local y no hay remoto, error explicito.

Test nuevo `test/gitflow/origin-guard.test.ts`, calcado de
`test/gitflow/merge-to-main.test.ts` (que cubre exactamente este mismo bug en
los `merge-*-to-main`): repos Git temporales de verdad, y un repo bare
haciendo de `origin` cuando el escenario lo pida.

### S2 — El registro deja de escribirse en el workspace del usuario *(agente B)*

`initialize_gitflow_log` crea `<repo>/logs/gitflow/` nada mas arrancar, en los
24 scripts. En un repo que no ignore `logs/`, **el script ensucia el workspace
antes de mirarlo**: por eso `pause-work.sh` pregunta que hacer con un
directorio que acaba de crear el, y por eso `taskctl resume` es inservible ahi
(aborta con "El workspace no esta limpio" y remite a un `pause` que tambien
abortaria).

Arreglo de raiz: el registro pasa a
`$(git rev-parse --git-path taskcode/gitflow)/gitflow-YYYY-MM-DD.log`, es
decir dentro de `.git/`. Razones para esa ruta y no otra:

- `.git/` no forma parte del arbol de trabajo, asi que `git status` no lo ve
  **nunca**, con `.gitignore` o sin el. La clase entera de problema
  desaparece en vez de taparse.
- `--git-path` (y no concatenar sobre `--git-dir`) sigue valiendo dentro de un
  worktree enlazado. Es el mismo criterio que ya usa `operacionEnCurso` en
  `src/fs/git.ts`, por el mismo motivo.
- El registro sigue siendo por repo y auditable, que era lo que se buscaba al
  meterlo dentro del repo.

Se conserva la salvaguarda de TASK-008: sin repo Git en el cwd no se escribe
fichero (`GF_LOG_FILE` vacio), para no dejar basura fuera de ningun repo.

Arrastra tres consecuencias, que son parte del trabajo:

1. **El segundo guard de `taskctl pause` se queda sin motivo.**
   `wrappers.ts` aborta si el repo no ignora `logs/gitflow/...`; ese guard
   existe *solo* por la suciedad autoinfligida. Se elimina, con su constante
   `REGISTRO_DE_LOS_SCRIPTS` y sus tests. El primer guard (no hay terminal
   interactiva) se queda: ese si es real. Efecto colateral bueno: `taskctl
   pause` no interactivo pasa a funcionar en repos que no ignoren `logs/`.
2. `scripts/gitflow/test/smoke-test.sh:65` asevera sobre la ruta vieja.
3. Documentacion: `HALLAZGOS.md`, `SKILL.md` y `scripts/gitflow/README.md` si
   la mencionan.

No se toca el `.gitignore` de este repo: que siga ignorando `logs/` es
inofensivo y no queremos mezclar la limpieza del historico con el fix.

### S3 — Los mensajes dejan de remitir a menus de IntelliJ *(agente C)*

Once mensajes dicen cosas como *"usa GitFlow 16 Pause Work"*, herencia de las
run configurations de IntelliJ de las que salieron estos scripts. Desde
TASK-026 cuatro de esos comandos existen en el CLI.

Se traducen **solo los que tienen equivalente real**:

| Donde | Dice | Pasa a decir |
|---|---|---|
| `resume-work.sh:27` | GitFlow 16 Pause Work | `taskctl pause` |
| `resume-work.sh:43` | GitFlow 18 Recover Branch | `taskctl recover` |
| `pause-work.sh:49,56` | GitFlow 17 Resume Work | `taskctl resume` |
| `diagnose-repo.sh:87` | GitFlow 19 Abort Merge | `taskctl abort-merge` |

`mirror-to-remote.sh:97`, `switch-working-remote.sh:41` y `:59` remiten a
"GitFlow 20/21", que **no tienen comando en `taskctl`**. Ahi se nombra el
script (`bash mirror-to-remote.sh`) y no se inventa un comando: la seccion
"Lo que NO existe" de la skill se escribio precisamente porque documentar
comandos inexistentes ya nos ha costado tiempo. Las cabeceras `# GitFlow 20 —`
son comentarios y se quedan.

Las dos lineas de `resume-work.sh` las hace el **agente A**, que ya es dueno
de ese fichero. El agente C no lo toca.

### S4 — `abort-merge` conoce cherry-pick y revert *(agente D)*

Con un `cherry-pick` o un `revert` a medias, `abort-merge.sh` dice *"El
workspace esta en estado normal"* y sale 0. Es un mensaje falso sobre un repo
que esta a medias.

- **Script**: se anaden `CHERRY_PICK_HEAD` y `REVERT_HEAD` como testigos, y
  las ramas `cherry-pick --abort` / `revert --abort`.
- **`src/fs/git.ts`**: `OperacionGitEnCurso` pasa de `'merge' | 'rebase'` a
  incluir `'cherry-pick'` y `'revert'`, mirando los mismos testigos con
  `--git-path`. El mensaje del wrapper ya interpola `git ${operacion}
  --abort`, que es valido para los cuatro.

Los dos lados se mueven **a la vez y con los mismos testigos**, que es
deliberado desde TASK-026: si `taskctl` detectara mas que el script, habria
dos comportamientos distintos segun haya terminal o no.

### Integracion

Los cuatro frentes tienen ficheros disjuntos salvo un roce: B edita
`wrappers.ts` (borra un guard) y D edita `src/fs/git.ts` (amplia un tipo que
`wrappers.ts` consume). Son zonas distintas de cada fichero y ninguno toca el
bloque `abort-merge` del wrapper. La integracion y la suite completa las
ejecuto yo en serie despues, no los agentes.

## Alternativas consideradas

**Para S2 — donde va el registro.** Se descarto (a) dejarlo en `logs/gitflow/`
y retrasar su creacion hasta despues de que el script inspeccione el
workspace: son 24 scripts y el arreglo dependeria del orden de las lineas de
cada uno, o sea que volveria a romperse sin que nadie se entere. Y (b)
mandarlo a un directorio temporal del sistema: se pierde la trazabilidad por
repo, que es lo que hacia util el registro.

**Para S1 — `recover-branch.sh` sin remoto.** Se descarto seguir en modo local
"por coherencia" con los demas scripts: no hay modo local posible cuando la
operacion consiste en traerse algo de `origin`. Fallar claro es la respuesta
correcta; hacerlo pasar por exito seria peor que el bug actual.

(Version minima de "taskctl plan", TASK-010: sin brainstorm multi-agente
todavia. Un solo agente redacta este plan. TASK-016 anadira brainstorm
en paralelo con roles distintos y un agente unificador para tareas de
complejidad media o mayor.)

## Riesgos o preguntas abiertas

- **Quitar el guard de `pause` es un cambio de comportamiento del CLI, no solo
  de los scripts.** Va con demostracion empirica, no con razonamiento: repo
  temporal sin `logs/` en el `.gitignore`, workspace limpio, `taskctl pause`
  no interactivo, y se comprueba que ya no aborta. Si no se reproduce, el
  guard se queda y se documenta por que.
- **El historico `logs/gitflow/` de este repo queda huerfano** tras el cambio.
  No se borra en esta tarea: es un fichero ignorado, y mezclar limpieza de
  historico con un fix de comportamiento hace la revision mas dificil.
- **Los 3 rojos conocidos de Windows** siguen ahi y no son regresiones
  (`CLAUDE.md`). Suite en verde aqui significa exactamente esos tres.
- El item C6 del checklist tiene estimacion **~1h**, que ya no describe el
  alcance. Se corrige a ~5h al cerrar.
