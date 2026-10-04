# Informe de revision — TASK-039 (ronda 1)

- Commit revisado: d8a82893eff45be97ecae1178fea7a8e4482a128
- Revisor: code-quality-reviewer (agente independiente, clon temporal de la rama)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/fs/git-commit.test.ts (falta asercion sobre `r.commit`; codigo en src/fs/git-commit.ts:291) |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts:245 |
| MEN-3 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts:218 |

Sin CRITICO ni IMPORTANTE.

## Entorno y suite

- Clon de `feature/task-039-f2-t3-menos-llamadas-git-en-los-comandos` a un
  temporal, `npm install && npm run build`. Git 2.55.0.windows.5.
- `npm test` completo, una vez: **913 tests, 910 pass, 3 fail**. Los tres
  rojos son los conocidos de Windows: `approve` (stat no-ENOENT), `plan`
  (escritura no-EEXIST) y `plan` (rama base con estado distinto, CRLF). Sin
  EBUSY. Ningun cuarto rojo.

## Verificaciones empiricas (repos Git temporales)

1. **Un solo `git add -A -- r1 r2 ...` con movimiento de carpeta.** Repo con
   `tareas/02-en-curso/T1/{tarea.md,plan.md}`, `board.md` y un `ajeno.txt`
   commiteados. Se mueve la carpeta en disco a `03-en-revision/T1`, se
   modifica `tarea.md`, `board.md` y `ajeno.txt`, y se ejecuta exactamente
   `git add -A -- board.md tareas/02-en-curso/T1 tareas/03-en-revision/T1`
   + `git -c maintenance.auto=false commit -m mv -- <mismas rutas>`.
   `git show --stat -M` registra `tareas/{02-en-curso => 03-en-revision}/T1/plan.md`
   como rename, el borrado del origen y el alta del destino; `git status`
   deja solo ` M ajeno.txt`. Mismo resultado que el bucle anterior: el
   pathspec con la carpeta borrada sigue casando con sus entradas del indice.
2. **`-c maintenance.auto=false` y versiones antiguas.** `git -c foo.bar=baz
   status` sale con rc=0: Git acepta cualquier clave en `-c` (solo la pone en
   `GIT_CONFIG_PARAMETERS`) y la ignora si nadie la lee; eso es asi desde que
   existe `-c`. En Git < 2.29 el commit lanza `gc --auto` directamente, que
   esta clave no toca: no hay error ni cambio, solo no hay ahorro. Con
   `GIT_TRACE2_EVENT`, un commit normal emite 5 eventos `"maintenance"` y con
   la clave 0: la clave hace lo que dice en el Git actual.
3. **`show --name-only --format=%h` frente a `rev-parse --short`.** Mismo SHA
   corto con el abbrev por defecto y con `-c core.abbrev=12`
   (`b814fe485fd2` en ambos). Con `color.ui=always` la salida de `show`
   (volcada con `od -c`) no lleva secuencias de color. En un commit de merge,
   `show --name-only` sin `-m` da el SHA y ninguna linea de fichero, pero ese
   caso no puede darse aqui: `git commit -- <rutas>` con `MERGE_HEAD` muere
   con `fatal: cannot do a partial commit during a merge.` (rc=128,
   reproducido), asi que el HEAD que se relee tras un commit de `autoCommit`
   nunca es un merge. `runGit` hace `trim()` de stdout, de modo que la
   primera linea es siempre el SHA y la linea en blanco intermedia se filtra.
4. **Aviso de ficheros intrusos de hooks.** El test
   `autoCommit: si un hook pre-commit mete ficheros ajenos, el resultado NO
   miente y avisa` pasa en la suite; y los mutantes M2 y M4 (abajo) lo tumban,
   asi que sigue vigilando la relectura de ficheros.
5. **Otras llamadas sobrantes en el CLI.** No he encontrado ninguna barata y
   segura mas alla de MEN-3. `tieneAlgoQuePreparar` solo lanza `ls-files`
   cuando la ruta no existe en disco (origen de un movimiento), que es el caso
   en que hace falta. Lo que se repite entre comando y script de Git-Flow esta
   fuera del alcance, como documenta el `Resultado`.

## Mutantes (sobre dist/src/fs/git-commit.js del clon, restaurado al acabar)

Ejecutados con `timeout 600 node --test dist/test/fs/git-commit.test.js` y
`dist/test/commands/auto-commit.test.js`:

| Mutante | git-commit.test | auto-commit.test | Resultado |
|---|---|---|---|
| M1: `commit = 'deadbee'` (SHA fijo) | 13/13 pass | 1 fail (`import dos veces seguidas`, solo por `notEqual` entre los dos SHA) | muerto por los pelos — ver MEN-1 |
| M2: `--format=` en vez de `--format=%h` | 1 fail | 2 fail (incluido el de hooks) | muerto |
| M3: `git add` solo de `presentes[0]` | 1 fail (`registra el MOVIMIENTO de carpeta`) | 6 fail | muerto |
| M4: no descartar la primera linea (SHA tratado como fichero) | 4 fail | 3 fail (incluido el de hooks) | muerto |

## Reproduccion de cada hallazgo

### MEN-1 — ningun test asevera el VALOR del SHA corto

El cambio fusiona en una sola llamada el SHA y la lista de ficheros, pero
ningun test compara `r.commit` con `git rev-parse --short HEAD`. El mutante
M1 (SHA constante) sobrevive entero a `git-commit.test.js` y solo lo mata en
`auto-commit.test.ts:343` un `assert.notEqual(r1.autoCommit.commit,
r2.autoCommit.commit)` que existe para otra cosa. Un mutante que devuelva un
valor distinto pero erroneo en cada commit (p. ej. `sha.slice(1)`)
sobreviviria. No es un fallo del codigo (verificacion 3 lo confirma a mano):
falta una asercion de una linea, `assert.equal(r.commit, git(['rev-parse',
'--short', 'HEAD'], repoRoot).trim())`, en el test basico de `autoCommit`.
No bloquea.

### MEN-2 — el mensaje de error del `git add` nombra todas las rutas

Antes, si fallaba el `add` de una ruta, el error nombraba esa ruta. Ahora
lista todas las de `presentes`. Reproducido con una ruta ignorada por
`.gitignore` junto a una valida: `git add -A -- board.md ign` sale con rc=1
pero deja `board.md` preparado, y el stderr de Git (que va en
`detalleDeError`) nombra la culpable (`ign`). El estado final es el mismo que
con el bucle (que tambien dejaba preparadas las rutas anteriores a la que
fallaba) y el diagnostico sigue estando en el detalle. Aceptado.

### MEN-3 — las rutas de sincronizacion se preparan dos veces

Con un comando de sincronizacion configurado, cada ruta suya pasa por su
propio `git add` (linea 218, aislado a proposito desde TASK-033 para que un
fallo no tumbe el commit de la tarea) y vuelve a entrar en el `git add` unico
de la linea 245, porque `presentes` incluye `rutasSync`. El segundo es un
no-op: un proceso de mas solo cuando hay sincronizacion. Quitarlo exigiria
separar las rutas del `add` de las del `commit`; no compensa en esta tarea.
Aceptado (no afecta a la medicion del `Resultado`, que es sin sincronizacion).
