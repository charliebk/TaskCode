# Informe de revision — TASK-029 (ronda 1)

- Commit revisado: 0e5c155d913e0ef91767bb521cfa543b81d58fba
- Rama: fix/task-029-bug-de-origin-sin-guard-y-deuda-de-los-s
- Revisor: agente independiente (general-purpose)
- Fecha: 2026-09-07
- Entorno: Windows 11, git 2.55.0.windows.5, bash 5.3.15, Node v22.23.2

Todo lo que sigue esta reproducido en repos Git temporales reales fuera del
repo (`/tmp/t029rev/...`), invocando los scripts siempre como `bash script.sh`.
No se ha commiteado nada ni se ha cambiado de rama. Los reverts se probaron
sobre una copia del arbol (`dist/` + `scripts/`) en un directorio temporal,
nunca sobre el repo.

---

## 1. Suite completa

`npm test` en la rama: **468 tests, 465 verdes, 3 rojos**, y los tres rojos
son exactamente los conocidos de este entorno Windows (`CLAUDE.md`):

| # | Test | Causa |
|---|---|---|
| 44 | `approve: propaga cualquier error de stat que NO sea ENOENT` | `EPERM: operation not permitted, symlink` |
| 150 | `plan: propaga cualquier error de escritura que NO sea EEXIST` | `Missing expected rejection` (chmod sobre directorio no hace nada en NTFS) |
| 156 | `plan: la rama base real tiene la tarea en un estado distinto...` | CRLF: `'# Plan real en develop\r\n'` vs `'...\n'` |

No aparecio ningun cuarto rojo, ni los `EBUSY ... rmdir` intermitentes.

`bash scripts/gitflow/test/smoke-test.sh`: **TODOS LOS CHEQUES PASARON**.

## 2. Contraprueba: ¿fallan los tests si se revierte el arreglo?

Esto es lo que fallo en TASK-028, asi que se comprobo pieza a pieza revirtiendo
solo un fichero cada vez sobre la copia temporal.

| Revertido | Test | Resultado |
|---|---|---|
| `abort-merge.sh` (version de `develop`) | `gitflow/abort-merge.test.js` | 6/9 fallan (los 5 del arreglo + el del mensaje nuevo) |
| Solo el bloque del `sequencer` de `abort-merge.sh` | idem | falla **exactamente 1**: el test del tercer testigo. Aisla bien |
| `operacionEnCurso` a `merge\|rebase` | `fs/git.test.js` | fallan los **4** tests nuevos |
| `create-develop.sh` + `recover-branch.sh` + `resume-work.sh` | `gitflow/origin-guard.test.js` | 12/14 fallan |
| `_gitflow-common.sh` (registro en `logs/gitflow/`) | `commands/wrappers.test.js` | fallan 3, incluido `pause sin terminal sigue adelante en un repo SIN .gitignore` |
| `_gitflow-common.sh` | `smoke-test.sh` | **7 cheques fallan** |

Las etiquetas son **honestas**: los dos tests marcados "no regresion" de
`abort-merge.test.ts` (merge y rebase) pasan igual con el script viejo, que es
justo lo que dicen ser; y los dos que fijan un limite (`cherry-pick -n` →
"estado normal" / `null`) tambien pasan con el codigo viejo, pero estan
etiquetados como limite, no como prueba del arreglo. Los dos que pasan con el
codigo viejo en `origin-guard.test.ts` (8 y 12) son los caminos felices con
origin real. **No he encontrado ningun test vendido como prueba del arreglo que
pase tambien con el codigo revertido.**

## 3. S1 — guard de `origin`: la asimetria esta justificada

Reproducidos los tres comportamientos, y ademas el caso "origin configurado
pero caido" (`git remote add origin <ruta inexistente>`):

- `create-develop.sh` sin origin: crea `develop` desde `main` en local,
  `Push omitido: no hay conexion con origin`, exit 0. Con origin caido:
  `exit 1`, `origin esta configurado pero no responde...`, y **no queda ninguna
  rama `develop`** (`git branch --list develop` vacio, rama activa `main`).
- `recover-branch.sh` sin origin: exit 1 con el mensaje propio; con origin
  caido: exit 1 con otro mensaje distinto. Ningun `fatal:` crudo de Git.
- `resume-work.sh`: nunca aborta por el remoto; retoma la rama local y avisa.

Revisados los caminos de escritura uno a uno: `resume-work.sh` solo hace
`checkout` de una rama que ya existe, `checkout -b` **desde `origin/` y solo si
`REMOTE_AVAILABLE=true`**, o error explicito; el `pull --ff-only` posterior esta
tambien tras `NAME_REMOTE=true`. **No hay ningun camino en el que se cree una
rama divergente en silencio ni se pierda trabajo**: la divergencia solo la puede
producir `create-develop`, y ese es precisamente el que aborta.

## 4. S2 — el registro se mudo a `.git/taskcode/gitflow/`

Todo comprobado ejecutando `bash diagnose-repo.sh` (o el script que tocara) en
repos temporales:

| Escenario | `git status --porcelain` | Donde queda el log |
|---|---|---|
| Repo **sin `.gitignore`** | vacio | `.git/taskcode/gitflow/gitflow-2026-09-07.log` |
| Desde `a/b/c/d` (subdirectorio profundo) | vacio | idem; `--git-path` devolvio `../../../../.git/taskcode/gitflow` y se absolutizo bien; el subdir queda vacio |
| **Worktree enlazado** | vacio | `<main>/.git/worktrees/<n>/taskcode/gitflow/...`, dentro del worktree no queda nada |
| Ruta con **espacios y `ñ`** | vacio | log escrito y con contenido (11 lineas) |
| **Fuera de cualquier repo** | n/a | no se escribe nada; el directorio queda literalmente vacio (salvaguarda de TASK-008 intacta) |

Y el `.git/` es invisible a todas las superficies que importan, medido en el
mismo repo tras escribir el log: `git status --porcelain -uall --ignored` vacio,
`git add -A` no indexa nada, `git clean -xfdn` no lista nada.

**¿Se perdio alguna proteccion al quitar el guard y `isIgnored`?** No, y lo
intente. El unico consumidor de `isIgnored` era ese guard (grep en `src/` y
`test/`: cero referencias vivas). El unico modo en que `pause-work.sh` se
ensuciaba el workspace era `initialize_gitflow_log`; el primer guard
(`isWorkspaceClean`) sigue cubriendo la suciedad de verdad. End-to-end con el
CLI real, repo sin `.gitignore`, stdin cerrado:

```
$ node bin/taskctl pause < /dev/null
  [OK]  OPERACION : pause-work   RESULTADO : COMPLETADO
        DETALLE   : Rama main ya estaba limpia
exit=0    # y git status --porcelain sigue vacio
```

Sin imports huerfanos ni variables muertas: `git.ts` sigue usando todo lo que
importa (`readFileSync` entro con el `sequencer`), `wrappers.ts` usa sus cuatro
imports, y no queda ningun `repo_root`/`--show-toplevel` huerfano en
`_gitflow-common.sh` (los que quedan son de otra funcion y son legitimos).

## 5. S3 — mensajes

Verificado uno a uno. Todos los `taskctl X` que nombran los scripts existen de
verdad (`WrapperName = diagnose | pause | resume | recover | abort-merge`):

```
scripts/gitflow/diagnose-repo.sh:87   'taskctl abort-merge'
scripts/gitflow/pause-work.sh:49,56   'taskctl resume $current'
scripts/gitflow/resume-work.sh:27     taskctl pause
scripts/gitflow/resume-work.sh:70,74  taskctl recover
scripts/gitflow/mirror-to-remote.sh:99  "No hay comando de taskctl para esto."
```

Ese ultimo es una afirmacion **negativa** y correcta. `mirror-to-remote.sh` y
`switch-working-remote.sh` nombran el script (`bash mirror-to-remote.sh`). Los
`GitFlow NN` que quedan estan solo en las cabeceras `#` de tres ficheros, como
decia el plan. **No se documenta ningun comando inexistente.**

## 6. S4 — paridad de testigos entre `git.ts` y el script

Matriz medida provocando cada estado de verdad y comparando las dos
implementaciones en el mismo repo:

| Estado | Testigos en `.git/` | `operacionEnCurso` | `abort-merge.sh` |
|---|---|---|---|
| limpio | (ninguno) | `null` | estado normal |
| merge en conflicto | `MERGE_HEAD` | `merge` | Merge en curso |
| rebase en conflicto | `rebase-merge` | `rebase` | Rebase en curso |
| `rebase -i` parado en `edit` | `rebase-merge` | `rebase` | Rebase en curso |
| cherry-pick en conflicto | `CHERRY_PICK_HEAD` | `cherry-pick` | Cherry-pick en curso |
| revert en conflicto | `REVERT_HEAD` | `revert` | Revert en curso |
| cherry-pick multi + `git commit` a mano | `sequencer` | `cherry-pick` | Cherry-pick en curso |
| revert multi + `git commit` a mano | `sequencer` (todo: `revert ...`) | `revert` | Revert en curso |
| `cherry-pick -n` en conflicto | (ninguno) | `null` | estado normal |
| `revert -n` en conflicto | `REVERT_HEAD` | `revert` | Revert en curso |
| `merge --squash` en conflicto | (ninguno) | `null` | estado normal |
| cherry-pick en **worktree enlazado** | `CHERRY_PICK_HEAD` (del worktree) | `cherry-pick` | Cherry-pick en curso |

**Paridad total en los doce estados.** Las afirmaciones de los comentarios se
confirman al medirlas: `cherry-pick -n` no deja rastro y Git se niega a abortar
(`--abort` rc≠0), pero `revert -n` **si** deja `REVERT_HEAD`; `rebase -i` no usa
`sequencer`. Tambien busque **falsos positivos** del testigo nuevo y no hay: tras
un cherry-pick multi completo, tras `--continue` hasta el final y tras `--quit`,
`.git/sequencer` desaparece y las dos implementaciones devuelven `null`.

Nota sobre el `--git-dir` de `abort-merge.sh` (frente al `--git-path` de
`git.ts`): comprobado en un worktree enlazado que para estos testigos —que son
per-worktree— `$(git rev-parse --git-dir)/CHERRY_PICK_HEAD` y
`$(git rev-parse --git-path CHERRY_PICK_HEAD)` apuntan al mismo fichero
existente. No es un defecto, pero conviene saber que la equivalencia depende de
que los cinco testigos sean per-worktree.

---

## Hallazgos

### CRITICO

Ninguno.

### IMPORTANTE

**I-1 · `taskctl diagnose` sigue diciendo "Sin operaciones en curso" con un
cherry-pick o un revert a medias, y contradice a `taskctl abort-merge` sobre el
mismo repo.**

`diagnose-repo.sh:52-54` solo conoce `MERGE_HEAD` y los directorios de rebase.
Es el mismo mensaje falso que S4 acaba de quitar de `abort-merge.sh`, en el otro
script que **si** tiene wrapper (`diagnose` es uno de los cinco). Reproducido:

```
$ git cherry-pick o   # conflicta
$ bash diagnose-repo.sh
  Workspace:           ⚠  1 archivo(s) modificado(s)
  Stashes guardados:   0
  ✓  Sin operaciones en curso        <-- falso
  Archivos modificados:
    UU a.txt                          <-- se contradice tres lineas mas abajo

$ node bin/taskctl abort-merge < /dev/null
[ERROR] ... antes de abortar el cherry-pick en curso ...
```

Dos comandos del mismo CLI afirman cosas incompatibles sobre el mismo repo, que
es exactamente la clase de divergencia que el plan queria evitar ("si `taskctl`
detectara mas que el script habria dos comportamientos distintos"): aqui la
divergencia no esta entre `git.ts` y `abort-merge.sh` —esa esta bien— sino entre
`abort-merge.sh` y `diagnose-repo.sh`. No es perdida de datos, pero es una
salida incorrecta en un caso real y en el comando cuyo trabajo entero es decir
en que estado esta el repo. El plan no lo tenia en alcance; si se decide no
corregirlo ahora, tiene que quedar escrito en `HALLAZGOS.md` junto al resto de
la deuda viva, no en silencio.

**I-2 · En el caso del tercer testigo, `abort-merge.sh` afirma "Workspace
restaurado al estado previo" y `COMPLETADO` sin haber restaurado nada, y se
traga el aviso de Git que lo advierte.**

Cuando el unico testigo es `.git/sequencer` (el caso que esta misma tarea
descubrio al medir), `git cherry-pick --abort` sale 0 pero **no rebobina**:
imprime `warning: You seem to have moved HEAD. Not rewinding, check your HEAD!`.
Como `invoke_git` solo vuelca `GIT_OUTPUT` cuando el comando falla, ese aviso
desaparece y el script remata con un mensaje de exito que no es cierto.
Reproducido para las dos operaciones:

```
# cherry-pick
HEAD antes:   caac36b resuelto a mano / 3128924 limpio / ba2552c cambio en main
[OK] Cherry-pick abortado. Workspace restaurado al estado previo al cherry-pick.
     RESULTADO : COMPLETADO
HEAD despues: caac36b resuelto a mano / 3128924 limpio / ba2552c cambio en main

# revert
HEAD antes:   5a66bb4 resuelto a mano / 3d02257 c4
[OK] Revert abortado. Workspace restaurado al estado previo al revert.
HEAD despues: 5a66bb4 resuelto a mano / 3d02257 c4
```

En los casos con `CHERRY_PICK_HEAD` / `REVERT_HEAD` presentes `--abort` si
rebobina y el mensaje es correcto; el defecto es especifico del camino nuevo.
No se pierde nada —al reves, los commits sobreviven— pero a quien lea
"Workspace restaurado al estado previo" le estamos diciendo que su commit hecho
a mano ya no esta, y puede rehacerlo. Es codigo escrito en esta tarea, asi que
cae de lleno en su alcance. El arreglo minimo es no afirmar la restauracion
cuando se llego por el `sequencer` (o comprobar el HEAD antes/despues), y no
tragarse el aviso de Git.

### MENOR

**M-1 · `create-develop.sh` aborta por origin caido sin dejar `log_summary`.**
`recover-branch.sh` en el mismo caso escribe su bloque `FALLIDO` en el registro;
`create-develop.sh` hace `log_error` + `exit 1` y no registra nada. Medido: el
fichero de log de `create-develop` no contiene ninguna linea de resultado. Justo
la tarea que acaba de mudar el registro deja un fallo sin constancia en el.

**M-2 · La doc y los comentarios dicen "la primera linea del `todo`", el codigo
mira todas.** `abort-merge.sh` hace `grep -qE '^revert '` sobre el fichero
entero y `git.ts` hace `/^revert /m.test(todo)`; ambos comentarios (y
`HALLAZGOS.md`) dicen "la primera linea". Sin impacto practico —Git no mezcla
`pick` y `revert` en un mismo `todo`—, pero es doc que no describe el codigo.

**M-3 · Costura entre agentes: `test/gitflow/abort-merge.test.ts` (fichero nuevo
de este mismo commit) escribe `.gitignore` con `logs/` y lo justifica con una
razon que este commit acaba de eliminar**: *"logs/ va en .gitignore ANTES del
primer commit (hallazgo 2 de TASK-007: el propio registro de Git-Flow ensuciaria
el workspace)"*. `test/gitflow/origin-guard.test.ts` hace lo mismo pero lo anota
bien ("Inofensivo aunque el registro ya no viva ahi"). Solo el comentario esta
mal; el test funciona.

**M-4 · `SKILL.md` da la ruta literal `.git/taskcode/gitflow/gitflow-FECHA.log`;
en un worktree enlazado es `.git/worktrees/<nombre>/taskcode/gitflow/...`.**
Medido. El soporte de worktrees es justamente lo que motivo usar `--git-path`,
asi que la doc se queda corta en el unico caso que ese detalle existe para
cubrir. Una frase basta.

**M-5 · "Commits pendientes en la secuencia : 2" cuenta las entradas crudas del
`todo`, incluida la que ya se aplico a mano.** En el escenario reproducido solo
quedaba 1 commit real por aplicar. Cosmetico; el numero sale del fichero de Git
tal cual.

---

## Hallazgos que decido NO corregir (politica del proyecto: se documentan igual)

- **`detect_origin_available` imprime "Se continuara en modo local" justo antes
  de que `create-develop` / `recover-branch` aborten.** Reproducido: salen dos
  lineas seguidas que se contradicen. Ya esta escrito en `HALLAZGOS.md` como
  parte de "lo que queda vivo", y arreglarlo toca una funcion compartida por
  varios scripts: es trabajo de otro item, no de este.
- **`create-hotfix.sh` y `create-release.sh` siguen con la copia inline de
  TASK-009.** Verificado: ambos declaran solo `REMOTE_AVAILABLE` y no distinguen
  "sin origin" de "origin caido". La afirmacion de `HALLAZGOS.md` sobre esto es
  exacta.
- **Un `git merge --squash` en conflicto no lo detecta ninguno de los dos
  lados** (no deja testigo alguno), y los dos dicen "estado normal". Es
  consistente con Git, que responde `fatal: There is no merge to abort
  (MERGE_HEAD missing)`. Preexistente y fuera del alcance de S4.
- **`docs/contexto/ESTADO.md` y el item C6 de `CHECKLIST_TERMINACION.md` siguen
  describiendo el comportamiento anterior a TASK-029.** No lo cuento como
  hallazgo porque el item sigue abierto (`- [ ] C6`) y ambos textos son el
  relato de C1/TASK-026; pero al cerrar hay que actualizarlos junto con la
  casilla, los contadores y el conteo de tests (`CLAUDE.md` dice 444 y en esta
  rama son 468 — el mismo defecto que la revision de C5 marco como IMPORTANTE).

---

## Resumen

Los cuatro frentes hacen lo que dicen y estan probados de verdad: la asimetria
de S1 esta justificada y no abre ningun camino a perdida de trabajo ni a una
rama divergente silenciosa; S2 deja el workspace limpio en repo sin
`.gitignore`, desde subdirectorio, en worktree enlazado y con espacios/`ñ` en la
ruta, y no deja basura fuera de un repo; S3 no documenta ningun comando
inexistente; y en S4 `operacionEnCurso` y `abort-merge.sh` coinciden en los doce
estados que he sabido provocar, sin falsos positivos. La contraprueba del
revert confirma que los tests nuevos fijan el arreglo y que las etiquetas de
"no regresion" y "limite" son honestas.

Se piden cambios por los dos IMPORTANTE: I-2 porque es codigo de esta tarea que
declara un exito que no ocurre, e I-1 porque deja el mismo mensaje falso que S4
venia a quitar en el comando que mas se usa para diagnosticar (y que se
contradice con `abort-merge` en el mismo repo); si se decide no arreglarlo
ahora, debe quedar documentado en `HALLAZGOS.md`.

- Veredicto: cambios-solicitados
