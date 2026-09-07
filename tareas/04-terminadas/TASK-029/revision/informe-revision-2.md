# Informe de revision — TASK-029 (ronda 2)

- Commit revisado: 6460711b45ebddf204afaf64617b17e6964c2131
- Commit de la ronda 1: 0e5c155d913e0ef91767bb521cfa543b81d58fba
- Rama: fix/task-029-bug-de-origin-sin-guard-y-deuda-de-los-s
- Revisor: agente independiente (general-purpose). No he implementado nada.
- Fecha: 2026-09-07
- Entorno: Windows 11, git 2.55.0.windows.5, bash 5.3.15, Node v22.23.2

Todo lo que sigue esta reproducido en repos Git temporales reales fuera del
repo (`/tmp/t029r2/...`), invocando los scripts siempre como `bash script.sh`.
No se ha commiteado nada ni se ha cambiado de rama. Las versiones anteriores de
`abort-merge.sh`, `diagnose-repo.sh` y `create-develop.sh` se recuperaron con
`git show 0e5c155:<ruta>` sobre copias temporales; el repo nunca se toco.

---

## 1. Suite completa

`npm test` en la rama: **472 tests, 468 verdes, 4 rojos**.

Tres son los conocidos de este entorno Windows (`CLAUDE.md`): #44
(`approve ... error de stat`, `EPERM ... symlink`), #150 (`plan ... error de
escritura`, `chmod` sobre directorio no hace nada en NTFS) y #156 (`plan: rama
base real ...`, CRLF).

El cuarto, #161 (`plan: el ID se lee de los posicionales`), fallo con
`EBUSY: resource busy or locked, rmdir` — el flake de *teardown* que
`CLAUDE.md` describe y que yo mismo provoque corriendo repos temporales en
paralelo con la suite. Comprobado: `node --test dist/test/commands/plan.test.js`
en aislado da **2 rojos (los conocidos #12 y #18 del fichero) y ninguno mas**;
en otra pasada del mismo fichero salieron ademas los numeros 21 y 23, tambien
`EBUSY`, y en distinto sitio cada vez. No es una regresion.

`bash scripts/gitflow/test/smoke-test.sh`: **TODOS LOS CHEQUES PASARON**
(incluido el cheque 2, que fija que el registro sale en `.git/` y que
`git status --porcelain` queda vacio).

Los 13 tests de `test/gitflow/abort-merge.test.ts` pasan (numeros 421–433 de la
suite), incluidos los dos nuevos de `diagnose-repo.sh`.

## 2. IMPORTANTE 1 — `diagnose-repo.sh` ya no se contradice con `abort-merge.sh`

Matriz medida en siete repos temporales, uno por escenario, comparando en el
**mismo repo** los testigos reales de `.git/`, el `diagnose-repo.sh` nuevo, el
viejo (`0e5c155`) y `abort-merge.sh` respondiendo `n`:

| Escenario | Testigos en `.git/` | diagnose NUEVO | diagnose VIEJO | `abort-merge.sh` |
|---|---|---|---|---|
| limpio | (ninguno) | Sin operaciones en curso | Sin operaciones en curso | estado normal |
| merge en conflicto | `MERGE_HEAD` | MERGE EN CURSO | MERGE EN CURSO | Merge en curso detectado |
| rebase en conflicto | `rebase-merge/` | REBASE EN CURSO | REBASE EN CURSO | Rebase en curso detectado |
| cherry-pick en conflicto | `CHERRY_PICK_HEAD` | CHERRY-PICK EN CURSO | **Sin operaciones en curso** | Cherry-pick en curso detectado |
| revert en conflicto | `REVERT_HEAD` | REVERT EN CURSO | **Sin operaciones en curso** | Revert en curso detectado |
| sequencer huerfano (cherry-pick) | `sequencer/` | CHERRY-PICK EN CURSO | **Sin operaciones en curso** | Cherry-pick en curso detectado |
| revert multi en conflicto | `REVERT_HEAD` + `sequencer/` | REVERT EN CURSO | **Sin operaciones en curso** | Revert en curso detectado |

Las cuatro contradicciones de la ronda 1 estan cerradas y ninguna aparece en
un escenario nuevo. El caso limpio sigue dando el mensaje verde.

**Extremo a extremo por el CLI**, que es donde se veia la contradiccion:

```
# repo con cherry-pick en conflicto
$ taskctl diagnose      -> ⚠  CHERRY-PICK EN CURSO — para cancelarlo: 'taskctl abort-merge', ...
$ taskctl abort-merge   -> [ERROR] ... tiene que confirmar contigo antes de abortar el cherry-pick en curso ...

# repo con el sequencer huerfano
$ taskctl diagnose      -> ⚠  CHERRY-PICK EN CURSO ...
$ taskctl abort-merge   -> [ERROR] ... antes de abortar el cherry-pick en curso ...

# repo con revert en conflicto
$ taskctl diagnose      -> ⚠  REVERT EN CURSO ...
$ taskctl abort-merge   -> [ERROR] ... "git revert --abort".
```

Los dos comandos dicen lo mismo sobre el mismo repo en los tres casos.

### Los dos puntos de sospecha del encargo, medidos

- **`grep` sobre un `todo` que no existe.** Con `.git/sequencer/` creado a mano
  y vacio, `grep` falla y cae en la rama `else`: los dos scripts reportan
  "CHERRY-PICK EN CURSO", y `abort-merge.sh` intenta el abort, Git responde
  `error: no cherry-pick or revert in progress` / `fatal: cherry-pick failed`,
  `invoke_git` lo vuelca entero y el script sale **rc=1**. Igual con
  `todo` presente pero vacio. Los dos lados coinciden (que era el objetivo) y
  no se finge exito. Ese estado no lo produce Git — tras `--quit`, `--abort` o
  una secuencia terminada, `.git/sequencer` desaparece (verificado en la ronda
  1). Lo dejo documentado en "no corregidos", no como hallazgo.
- **Worktree enlazado y `--git-dir`.** Medido en un worktree enlazado real:
  `$(git rev-parse --git-dir)/CHERRY_PICK_HEAD` y
  `$(git rev-parse --git-path CHERRY_PICK_HEAD)` resuelven al **mismo fichero
  existente**, e igual para `sequencer/`. `diagnose-repo.sh` ve el cherry-pick
  y el sequencer huerfano dentro del worktree, y el registro se escribe en
  `<main>/.git/worktrees/<n>/taskcode/gitflow/gitflow-2026-09-07.log`. Sin
  defecto, con la misma reserva que anoto la ronda 1: la equivalencia depende
  de que los cinco testigos sean per-worktree.

## 3. IMPORTANTE 2 — el mensaje de cierre de `abort-merge.sh`

Verificadas **las dos ramas** y, en cada una, si la afirmacion es cierta contra
lo que Git hizo de verdad (HEAD, `git status --porcelain` y testigos antes y
despues, no el mensaje):

| Caso | Testigos | Mensaje | HEAD antes → despues | status despues | testigos despues | ¿cierto? |
|---|---|---|---|---|---|---|
| cherry-pick en conflicto | `CHERRY_PICK_HEAD` | "restaurado al estado previo" | `53a3854` → `53a3854` | vacio (antes `UU a.txt`) | ninguno | **si** (deshace el conflicto) |
| revert en conflicto | `REVERT_HEAD` | "restaurado al estado previo" | `3419804` → `3419804` | vacio (antes `UU a.txt`) | ninguno | **si** |
| sequencer huerfano (cherry-pick) | `sequencer/` | "descartada la cola / nada que rebobinar" | `0985cd4` → `0985cd4` | vacio | ninguno | **si** |
| sequencer huerfano (**revert**) | `sequencer/` | "descartada la cola / nada que rebobinar" | `90cf7cd` → `90cf7cd` | vacio | ninguno | **si** |
| merge en conflicto | `MERGE_HEAD` | "restaurado al estado previo al merge" | `3f4ec31` → `3f4ec31` | vacio (antes `UU a.txt`) | ninguno | **si** |
| rebase en conflicto | `rebase-merge/` | "restaurado al estado previo al rebase" | `69fa698` (detached) → `709a920` "otra" | vacio | ninguno | **si** (vuelve al tip de la rama original) |

El discriminante es el correcto y esta tomado **antes** del `--abort`
(`solo_sequencer=false; [ -f "$head_file" ] || solo_sequencer=true`, lineas
104-105), con el testigo todavia presente.

### El tercer caso que buscaba el encargo

Construi el **revert huerfano de sequencer**, que no existia en la ronda 1:
tres commits, `git revert --no-edit HEAD~2 HEAD~1` (el revert de `c2` conflicta
con `c4`, el de `c3` queda en cola), conflicto resuelto con `git commit` a
mano. Estado resultante: solo `sequencer/` con dos entradas `revert`, sin
`REVERT_HEAD`. El script lo clasifica como revert, entra por la rama
`solo_sequencer` y dice *"Revert cancelado: se ha descartado la cola…"* /
*"aqui no hay nada que rebobinar"*, con `DETALLE: Cola de revert descartada en
rama main (sin rebobinar)`. HEAD no se mueve. **Cierto.**

Tambien busque el caso inverso —un `solo_sequencer=false` donde `--abort`
tampoco rebobine— y no lo hay por este camino: con `CHERRY_PICK_HEAD` +
`sequencer` y HEAD ya movido por un commit manual anterior (secuencia de tres,
resuelta a mano, `--continue`, segundo conflicto), `git cherry-pick --abort`
**si** rebobina, y hasta el commit anterior al cherry-pick entero
(`b256fdd` → `e540af4`, borrando el commit manual). El mensaje "restaurado al
estado previo al cherry-pick" describe exactamente eso. Que Git se lleve por
delante el commit manual es comportamiento de Git, no una mentira del script.

Nota sobre el aviso de Git: `git cherry-pick --abort` en el caso huerfano sigue
imprimiendo `warning: You seem to have moved HEAD. Not rewinding, check your
HEAD!` y saliendo 0, y `invoke_git` **sigue sin volcarlo** (solo vuelca
`GIT_OUTPUT` cuando el comando falla). Lo compruebo: no aparece en la salida
del script. Ya no importa para la veracidad del cierre —el mensaje nuevo dice
lo mismo con mejores palabras— pero lo dejo anotado abajo.

## 4. Los 5 MENORES de la ronda 1

| # | Hallazgo | Estado | Como lo comprobe |
|---|---|---|---|
| M-1 | `log_summary` ausente en `create-develop.sh` al abortar por origin inaccesible | **corregido** | Repo temporal con `origin` apuntando a una ruta inexistente. NUEVO: `RESULTADO : FALLIDO` / `DETALLE : develop no creado: origin configurado pero inaccesible`, y esas dos lineas estan **en el fichero de log**; rc=1 y ninguna rama `develop`. VIEJO (`0e5c155`): rc=1, log sin ninguna linea `RESULTADO` (`grep -c` = 0) |
| M-2 | Doc/comentarios dicen "la primera linea del `todo`", el codigo mira todas | **corregido a medias** | Ver hallazgo m-1 mas abajo |
| M-3 | `.gitignore` obsoleto en el test nuevo | **corregido** | `withTempRepo` ya no escribe `.gitignore` y el comentario explica que ahora es la red que detectaria una regresion del registro. Medido: tras cada ejecucion en esos repos sin `.gitignore`, `git status --porcelain` sale vacio |
| M-4 | Ruta literal de `SKILL.md`, que en worktree es otra | **corregido** | `SKILL.md` remite a `git rev-parse --git-path taskcode/gitflow` y avisa del worktree. Concuerda con `_gitflow-common.sh:56`, que usa exactamente esa llamada. Verificado en worktree enlazado real |
| M-5 | "Commits pendientes" → "Entradas pendientes" | **corregido** | NUEVO: `Entradas pendientes en la secuencia : 2`. VIEJO: `Commits pendientes en la secuencia : 2`. El comentario nuevo explica que una entrada puede quedarse en nada — que es justo lo que pasa en el escenario del sequencer huerfano, donde una de las 2 entradas ya esta aplicada a mano |

## 5. Los 4 tests nuevos contra el codigo anterior

Sandbox fuera del repo con el `dist/` compilado de la rama y `scripts/gitflow/`
sustituido por las versiones de `0e5c155`:

```
$ node --test dist/test/gitflow/abort-merge.test.js      # scripts de 0e5c155
not ok 5  - detecta una secuencia a medias cuando el unico testigo es .git/sequencer
not ok 6  - confirmando en el caso del sequencer, descarta la cola y NO dice que haya restaurado nada
not ok 12 - diagnose-repo.sh: ve el cherry-pick a medias
not ok 13 - diagnose-repo.sh: ve el revert a medias, y sigue diciendo "sin operaciones"
# tests 13 / pass 9 / fail 4
```

Desglose honesto de esos cuatro:

- **#6, #12 y #13 son tests nuevos y fallan de verdad contra el codigo viejo.**
  #6 porque el viejo imprime "Workspace restaurado al estado previo al
  cherry-pick"; #12 y #13 porque el `diagnose-repo.sh` viejo dice "Sin
  operaciones en curso".
- **#5 no es nuevo** (existia en `0e5c155`) y falla solo por el relabel de M-5
  (`Commits` → `Entradas`). No es una regresion del helper: el estado que
  provoca es identico.
- **El cuarto test nuevo, #7** (`un cherry-pick normal en conflicto SI dice que
  ha restaurado (el discriminante no es HEAD)`), **pasa contra `0e5c155`**.
  Reconstrui el primer intento descartado —sustituir el testigo por
  `head_antes=$(git rev-parse HEAD)` antes del abort y compararlo despues— y
  lo medi: contra esa variante **#7 falla** (y tambien #2 y #4). O sea que el
  test si gana su sitio: es la red contra el arreglo falso, exactamente lo que
  dice su nombre. Lo que no es exacto es la afirmacion del mensaje de commit
  ("4 tests nuevos, verificados fallando contra el codigo anterior"), si por
  "codigo anterior" se entiende `0e5c155`. Ver m-2.

### El helper `provocarSequencerHuerfano` (punto 1 de sospecha)

Comparado linea a linea con el bloque inline de `0e5c155`: es una extraccion
literal (mismos commits, mismo `cherry-pick main..otra`, misma resolucion
manual, mismas dos aserciones de testigos). Lo unico que se movio fue el
comentario, al docblock. El test original conserva sus cuatro aserciones y
gana la del relabel. Empiricamente, el estado que produce es el mismo:
`sequencer/` con `abort-safety head todo` y dos entradas `pick`, sin
`CHERRY_PICK_HEAD`.

## 6. La documentacion nueva de `HALLAZGOS.md` (punto 3 de sospecha)

- Seccion **"Medir no basta si mides lo que no discrimina"**: afirma que en un
  cherry-pick de un solo commit en conflicto HEAD tampoco se mueve al abortar.
  **Cierto y medido** (`53a3854` antes y despues). Y que el discriminante
  correcto es la ausencia de `CHERRY_PICK_HEAD`: es literalmente lo que hace
  el codigo (`[ -f "$head_file" ] || solo_sequencer=true`). Nada que objetar.
- Anadido sobre `diagnose-repo.sh`: "Corregido con los mismos cinco testigos".
  **Cierto**: los cinco bloques de deteccion son los mismos que en
  `abort-merge.sh`, incluida la desambiguacion del `todo`. Y la escena que
  describe ("cantaba *Sin operaciones en curso* tres lineas encima de su
  propio `UU a.txt`") la reproduje con el script viejo.
- `HALLAZGOS.md:171` menciona la ruta literal `.git/taskcode/gitflow/`, pero
  inmediatamente aclara que se resuelve con `--git-path` "para que siga
  valiendo en un worktree enlazado". No es el defecto que marcaba M-4.

---

## Hallazgos

### CRITICO

Ninguno.

### IMPORTANTE

Ninguno. Los dos IMPORTANTES de la ronda 1 estan corregidos y verificados
empiricamente, incluida la rama que el primer intento de arreglo rompia.

### MENOR

**m-1 · El MENOR M-2 de la ronda 1 se declara corregido en el mensaje de
commit y solo lo esta en 1 de los 3 sitios que el propio hallazgo nombraba.**

M-2 decia textualmente: *"`abort-merge.sh` hace `grep -qE '^revert '` sobre el
fichero entero y `git.ts` hace `/^revert /m.test(todo)`; ambos comentarios (y
`HALLAZGOS.md`) dicen 'la primera linea'"*. Solo se toco `abort-merge.sh`.
Siguen diciendolo:

- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:135` —
  `// La primera linea del "todo" distingue las dos: "pick <sha>" para` …
  tres lineas encima de `return /^revert /m.test(todo) ? 'revert' : 'cherry-pick';`
- `docs/contexto/HALLAZGOS.md:205` — *"Se añadió como tercer testigo; la
  primera línea de su `todo` (`pick` / `revert`) distingue cuál es."*

Sin impacto de comportamiento (Git no mezcla los dos verbos en una secuencia,
verificado tambien esta ronda: los `todo` de mis escenarios son homogeneos).
Es doc que no describe el codigo, en el fichero que la propia tarea usa como
memoria del proyecto, y en el gemelo TypeScript del script que si se arreglo —
justo la asimetria entre los dos lados que S4 se propuso evitar.

**m-2 · El mensaje de commit afirma que los 4 tests nuevos se verificaron
fallando contra el codigo anterior; uno de los cuatro pasa contra `0e5c155`.**

Medido en §5: `#427` (`un cherry-pick normal en conflicto SI dice que ha
restaurado (el discriminante no es HEAD)`) pasa con los scripts de `0e5c155` y
falla con la variante "comparar HEAD" que se descarto. El test es correcto y
util —es la red contra el arreglo falso, y su nombre lo dice— asi que no hay
nada que cambiar en el test. Lo impreciso es la frase del commit, que da a
entender que los cuatro discriminan lo mismo. Se corrige, si acaso, en el
`Resultado` de la tarea al cerrar.

---

## Lo que NO propongo corregir (documentado, no arreglado)

- **`.git/sequencer/` creado a mano y vacio produce un falso "CHERRY-PICK EN
  CURSO"** en los dos scripts. Los dos coinciden (que es lo que se buscaba) y
  `abort-merge.sh` no finge exito: vuelca `error: no cherry-pick or revert in
  progress` y sale rc=1. Git no deja nunca ese estado. Blindarlo obligaria a
  inventar heuristicas sobre un directorio que solo escribe Git.
- **`DETALLE : Rebase abortado en rama ` sale con la rama vacia.** Durante un
  rebase `git branch --show-current` devuelve cadena vacia con exit 0, asi que
  el fallback `|| echo "(detached HEAD)"` de `abort-merge.sh:6` nunca dispara.
  Es cosmetico, **preexistente** (identico en `0e5c155`) y afecta tambien al
  "Rebase en curso detectado en rama: ". Fuera del alcance de esta ronda.
- **`invoke_git` sigue sin volcar `GIT_OUTPUT` cuando el comando sale 0**, asi
  que el `warning: You seem to have moved HEAD. Not rewinding` de Git no llega
  al usuario. Comprobado. Ya no produce un mensaje falso —el texto nuevo lo
  cubre— pero es una perdida de informacion generica de la funcion compartida,
  igual que el `log_summary` que la ronda 1 dejo fuera de alcance: es trabajo
  de otro item.
- **Rojos `EBUSY ... rmdir` intermitentes.** Los vi en `plan.test.js` en tres
  numeros distintos en tres pasadas. Estan documentados en `CLAUDE.md` y fallan
  en el teardown, no en la asercion.
- **Cierre de la tarea todavia pendiente** (no lo cuento como hallazgo porque
  el item sigue abierto, igual que hizo la ronda 1): las casillas de
  aceptacion de `tarea.md` estan sin marcar, y siguen sin actualizar la casilla
  y los contadores de `CHECKLIST_TERMINACION.md`, la estimacion del item C6
  (~1h → ~5h), `ESTADO.md`, y el conteo de tests de `CLAUDE.md` (dice 444; en
  esta rama son **472**).

---

## Resumen

Los dos IMPORTANTES estan cerrados de verdad, no de palabra.
`diagnose-repo.sh` y `abort-merge.sh` dicen lo mismo sobre el mismo repo en los
siete escenarios que probe, tambien por el CLI. Y el mensaje de cierre de
`abort-merge.sh` es cierto en las **seis** combinaciones que medi contra el
estado real de Git, incluido el revert huerfano de sequencer que no existia en
la ronda 1 y el caso inverso que busque para romperlo. El discriminante nuevo
—ausencia del testigo— resiste el contraejemplo que tumbo al anterior, y hay
un test que lo fija: lo verifique reconstruyendo el arreglo falso y viendolo
fallar.

De los 5 MENORES, cuatro estan corregidos y verificados uno a uno contra el
codigo viejo. El quinto (M-2) esta corregido en el script y olvidado en
`src/fs/git.ts` y en `HALLAZGOS.md`, que es lo unico que queda vivo de la
ronda 1. Es comentario, no comportamiento, y no justifica otra ronda: se
arregla al cerrar la tarea, junto con el checklist y el conteo de tests, o se
documenta como deuda con esas mismas palabras.

- Veredicto: aprobada
