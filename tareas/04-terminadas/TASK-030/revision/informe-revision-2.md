# Informe de revision — TASK-030 (ronda 2)

- Commit revisado: 8195541e259e8c7f653ccd6fe3be017e77e059cc
- Delta de la ronda: `bc88c04..HEAD`
- Revisor: general-purpose (independiente; no implemente nada de C2 ni C4)
- Fecha: 2026-09-07
- Plataforma de reproduccion: Windows 11, Node v22.23.2, git bash

Todo lo destructivo se hizo en repos Git temporales fuera del repo
(`$TMP/rev2-*`). Al terminar: `git status --porcelain` vacio salvo este
mismo informe, misma rama, sin commits nuevos.

## 0. Linea base

```
node --test "dist/test/**/*.test.js"
# tests 532 / # pass 529 / # fail 3
not ok 44  - taskctl approve: propaga cualquier error de stat que NO sea ENOENT
not ok 160 - taskctl plan: propaga cualquier error de escritura que NO sea EEXIST
not ok 166 - taskctl plan: la rama base real tiene la tarea en un estado distinto...
```

Los tres rojos conocidos de Windows de CLAUDE.md. **Ningun cuarto rojo.**
La suite crecio de 528 a 532 (los 4 tests nuevos del commit de correccion).

Para las contrapruebas monte una copia del plugin fuera del repo
(`$TMP/rev2-copy`). **Su linea base es identica a la del repo: 529/3**
(mejor aislamiento que la copia de la ronda 1, que arrastraba 17 rojos
por la ruta: al copiar tambien `skills/` y `scripts/` no falla ninguno).
Eso hace que las contrapruebas de abajo se lean sin ruido.

## 1. IMPORTANTE 1 — cableado de `limite_wip`: **corregido**

Deshice en la copia exactamente la linea senalada en la ronda 1
(`src/commands/start.ts:225-230`), dejando `tareasQueBloquean` y
`mensajeWipExcedido` con su limite por defecto:

```ts
- const limiteWip = resolverConfig(deps.repoCwd).limite_wip;
- const bloqueantes = tareasQueBloquean(tareas, personaParaWip, task.id, limiteWip);
+ const bloqueantes = tareasQueBloquean(tareas, personaParaWip, task.id);
```

(`tsc` limpio; verificado que `limiteWip` ya no aparece en
`dist/src/commands/start.js`.) Resultado:

```
# tests 532 / # pass 528 / # fail 4
not ok 200 - taskctl start: limite_wip de .taskcode/config.yml manda de verdad (no solo en wip.ts)
```

Cae, y cae **por el motivo correcto**, no por un fallo de compilacion:

```
error: [ERROR] TASK-512: carlos ya tiene TASK-511 sin cerrar (02-en-curso, ...)
stack:  runStartCommand (dist/src/commands/start.js:151:19)
```

Es decir: con `limite_wip: 2` en `.taskcode/config.yml` el guard de WIP
salta cuando no debe. El test pasa por `runStartCommand` de verdad. Lo
que la ronda 1 pedia —que des-cablear esa linea rompa algo— ahora ocurre.

**El segundo test nuevo (`limite_wip: 1` explicito) SI sobrevive al
arreglo deshecho**, y era inevitable: es una asercion de equivalencia
("con 1 explicito bloquea igual que sin fichero"), asi que por
construccion pasa tambien cuando el limite esta clavado a 1. No es un
hallazgo — es el analogo exacto del `ok 391` que la ronda 1 ya declaro
inevitable. Aun asi vale la pena tenerlo: fija que un `1` explicito no
se interprete como "sin limite", que es la otra forma de romperlo.

## 2. IMPORTANTE 2 — el resultado ya no miente: **corregido**

### (a) Con un hook `pre-commit` que hace `git add`, el resultado refleja lo que Git registro

Repo temporal, `.git/hooks/pre-commit` = `#!/bin/sh` + `git add intruso.txt`,
con `intruso.txt` sin trackear en el arbol. Llamando a `autoCommit` con la
carpeta de la tarea:

```
RESULT ficheros= ["intruso.txt","tareas/00-planificadas/TASK-901/tarea.md"]
RESULT commiteado= true commit= 02cbb66
AVISOS= ["El commit 02cbb66 incluye 1 fichero(s) que taskctl no pidio commitear:
          intruso.txt. Casi seguro los ha anadido un hook de pre-commit ..."]

=== GIT REGISTRO (git show --name-only --format= HEAD) ===
intruso.txt
tareas/00-planificadas/TASK-901/tarea.md
```

Coinciden. En la ronda 1 aqui salia `ficheros = ["...tarea.md"]` (uno)
contra dos registrados. Corregido.

### (b) El aviso llega **hasta el usuario por el CLI**, no solo al objeto

Comprobado con el binario real (`node bin/taskctl new`), no con el objeto.
Escenario realista tipo prettier/lint-staged: el hook reformatea un
fichero **trackeado** y lo anade (asi no ensucia el arbol antes y pasa el
guard de rama base):

```
--- STDOUT ---
Tarea TASK-001 creada: ...\tareas\00-planificadas\TASK-001\tarea.md
Commiteado 254a1dd en "develop" (2 ficheros).
--- STDERR ---
[AVISO] El commit 254a1dd incluye 1 fichero(s) que taskctl no pidio commitear:
        README.md. Casi seguro los ha anadido un hook de pre-commit de este repo
        (lint-staged, prettier o similar). Revisa el commit: taskctl solo pidio
        registrar lo que escribio el mismo.
--- git show --name-only HEAD ---
README.md
tareas/00-planificadas/TASK-001/tarea.md
```

Dos cosas, las dos importantes: el aviso sale por stderr (`printAutoCommit`
llama a `printAvisos(...r.avisos)` antes de nada, `src/cli.ts:116`, y ese
metodo lo usan los ocho comandos), y **stdout ya no miente**: dice "2
ficheros", que es lo que Git registro. Antes hubiera dicho "1 fichero".

### (c) Sin hook no aparece ningun aviso espurio

Ciclo de vida completo con el CLI real, sin hooks:
`new -> plan -> approve -> start -> review` (feature) y
`new -> plan -> approve -> start -> review -> finish --push` (hotfix,
contra un `origin` bare local). **Cero avisos de intrusos** en los once
comandos, incluidos los que mueven la carpeta de tarea de un estado a
otro. El commit de `finish` (7 ficheros: `CHANGELOG.md`, `docs/BOARD.md`,
`docs/INDEX.md` y los 4 de `04-terminadas/`) tampoco dispara nada.

### (d) Primer commit del repo y commit durante un merge

**Commit raiz** (repo recien `git init`, HEAD sin padre): es el caso donde
`git show ... HEAD` podia romperse. No rompe.

```
== repo SIN NINGUN COMMIT ==
fatal: your current branch 'main' does not have any commits yet
ficheros= ["tareas/00-planificadas/TASK-902/tarea.md"]
commiteado= true commit= 40b5c26 rama= "main"
avisos= []
```

`git show --name-only --format= HEAD` sobre un commit raiz lista los
ficheros contra el arbol vacio. Correcto y sin aviso espurio.

**Durante un merge** (con `MERGE_HEAD` presente y un conflicto vivo):

```
THREW: [ERROR] taskctl escribio los ficheros de la tarea pero NO pudo commitearlos:
fatal: cannot do a partial commit during a merge.. Estan preparados (git add) en la
rama "main": revisa el motivo (un hook de pre-commit, una firma GPG, o
"git config user.email" sin configurar) y haz el commit a mano.
```

Es decir: **no se llega nunca a `git show`** en ese camino, porque
`git commit -- <rutas>` aborta antes. Y por construccion HEAD tras un
`autoCommit` no puede ser un merge (el commit se crea con pathspec), asi
que el caso "`git show` sobre un merge, que por defecto no imprime diff"
no es alcanzable. La lectura nueva no anade ningun riesgo aqui.

## 3. MENOR — `.taskcode` que es un fichero: **corregido**

```
.taskcode ES FICHERO         => ABORTA ConfigError :: [ERROR] "...\.taskcode" existe
                                pero no es una carpeta, asi que ahi no puede haber
                                ninguna configuracion.
config.yml ES DIRECTORIO     => ABORTA ConfigError :: ... EISDIR
.taskcode vacio (sin config) => DEVUELVE defaults
sin .taskcode                => DEVUELVE defaults
config.yml vacio             => DEVUELVE defaults
config.yml valida            => DEVUELVE {... "limite_wip":3}
```

Las dos rutas que la ronda 1 comparaba se comportan igual, y las tres
legitimas siguen devolviendo defaults sin quejarse. El comentario del
fichero ya no miente.

**Rutas adyacentes con el mismo errno**, que era la otra mitad del
encargo. Lo que pude probar:

- `.taskcode` = junction a un directorio real con `config.yml`: se lee
  bien (`limite_wip: 5`). No hay regresion por meter `statSync`, que
  sigue enlaces.
- `.taskcode` = **enlace colgante** (junction a un destino inexistente):
  `statSync` lanza `ENOENT` y se cae al default **en silencio**. Ver
  MENOR 1 de abajo.

Lo que **no pude probar en esta plataforma** (lo digo en vez de callarlo):
`.taskcode` como symlink **a un fichero** y `config.yml` como symlink
colgante fallan al crearse con `EPERM` en Windows sin modo desarrollador
— la misma limitacion que ya cuesta un rojo conocido en la suite. Quedan
sin verificar; por lectura del codigo, el primero deberia abortar (el
`statSync` sigue el enlace y ve un fichero) y el segundo caer en el mismo
MENOR 1.

## 4. Contrapruebas, pieza a pieza

Cada arreglo deshecho por separado en la copia, recompilando y corriendo
solo el fichero de tests afectado:

| arreglo deshecho | resultado |
|---|---|
| linea de `limite_wip` en `start.ts` | `# fail 4` — cae `not ok 200 - taskctl start: limite_wip ... manda de verdad` |
| bloque de intrusos en `git-commit.ts` | `auto-commit.test.js: 10/9/1` — cae `not ok 10 - autoCommit: si un hook pre-commit mete ficheros ajenos, el resultado NO miente y avisa` |
| bloque `statSync` en `config.ts` | `config.test.js: 35/34/1` — cae `not ok 35 - resolverConfig: un .taskcode que es un FICHERO aborta` |

**Tres de los cuatro tests nuevos caen con su arreglo deshecho, y cae
exactamente uno por arreglo — ni uno mas.** El cuarto es el de
`limite_wip: 1`, inevitable por lo explicado en el punto 1.

## 5. ¿Puede el aviso de intrusos dispararse en falso?

Le tire los vectores que me parecieron capaces de descuadrar las dos
listas (la de `git diff --cached --name-only -- <rutas>` antes del commit
y la de `git show --name-only --format= HEAD` despues). **Ninguno produjo
un aviso falso:**

| vector | resultado |
|---|---|
| renombrado de carpeta (`01-listas` -> `02-en-curso`, el movimiento real de `start`) | sin aviso; las dos listas dan solo el destino (`R100` en `--name-status`) |
| lo mismo con `diff.renames=false` | sin aviso; las dos listas dan origen y destino |
| `core.autocrlf=true` con contenido CRLF | sin aviso |
| nombres no-ASCII (`informe-revisión-ñ.md`) con `core.quotepath` por defecto | sin aviso; las dos listas citan identico (`"...revisi\303\263n-\303\261.md"`) |
| commit raiz (HEAD sin padre) | sin aviso |
| ciclo de vida feature completo por CLI | sin aviso |
| ciclo de vida hotfix completo con remoto + `finish --push` | sin aviso |

Razon de fondo, y es la que da confianza mas alla de los vectores: la
lista "pedida" se filtra por el mismo pathspec con el que se hace el
commit `--only`, asi que un renombrado cuyo origen quede fuera del
pathspec no puede entrar en el commit. Los dos lados son salidas de
`diff` del mismo Git con la misma config, asi que el comillado y la
deteccion de renombrados se aplican igual en ambos.

## Hallazgos de esta ronda

### MENOR 1 (nuevo) — un `.taskcode` que es un **enlace colgante** sigue cayendo al default en silencio

El arreglo pregunta al sistema de ficheros con `statSync`, que sigue
enlaces; si `.taskcode` es un enlace a un destino que no existe, `statSync`
lanza `ENOENT` y el `catch` devuelve defaults:

```
s3 => DEVUELVE {"rama_base":"develop","agente_revisor_por_defecto":"general-purpose","limite_wip":1}

$ ls -la s3/
.taskcode -> .../s3/no-existe     (lstat isSymlink= true, stat err ENOENT)
```

Es el mismo patron que se acaba de corregir —una entrada de directorio que
existe pero no sirve, tratada como "no hay configuracion"— en su version
mas exotica. Un `lstatSync` antes del `statSync` lo cerraria. **No pido
corregirlo**: un enlace roto es un repo roto, la probabilidad es
despreciable y el arreglo actual cubre el caso que si aparece en la vida
real (un `.taskcode` que alguien creo como fichero). Lo dejo escrito para
que no se descubra de cero dentro de un ano.

### MENOR 2 (heredado, sin cerrar) — el aviso de `finish --push` sobre `mainBranch` y el tag sigue sin test

Lo **verifique empiricamente** en esta ronda, que es mas de lo que se hizo
en la ronda 1: hotfix completo contra un `origin` bare local.

```
[AVISO] --push ha subido "develop", pero NO "main" ni el tag de esta hotfix:
        subelos tu ("git push origin main --follow-tags").
```

Y el aviso **dice la verdad**: `git ls-remote` confirma que `refs/heads/main`
sigue en el commit base y que el tag `task-001-hotfix-de-prueba` no esta en
origin. El `result.rama.split('/')[0]` produce "hotfix", que es lo que se
queria. Pero sigue sin cubrirlo ningun test: `finish.test.ts` solo asevera
sobre `result.mainBranch`, y la rama del aviso en `cli.ts:429` exige ademas
`push === 'empujado'`, que ningun test provoca. Una regresion ahi seria
silenciosa. **No bloquea** (queda verificado a mano), pero conviene un test
cuando haya un fixture con remoto.

### MENOR 3 (heredado, sin cerrar) — el mensaje al commitear durante un merge sigue despistando

Reproducido igual que en la ronda 1: las tres causas que sugiere el
mensaje (hook, firma GPG, `user.email`) no son la real
(`cannot do a partial commit during a merge`). Cumple la regla 3 —falla
ruidosamente y el stderr de git aparece literal—, y no encontre camino
realista que llegue ahi. Cosmetico, ya declarado "no pido corregir" en la
ronda 1; lo confirmo.

### MENOR 4 (heredado) — el borrador de la persona dentro de la carpeta de tarea: **no es alcanzable por el CLI**

Aqui traigo evidencia nueva, porque la ronda 1 lo reprodujo a nivel de
`autoCommit` (unidad) y quedaba la duda de si el CLI lo dejaba pasar.
**No lo deja.** Intentado con `approve`, que es de los que **no** llaman
`isWorkspaceClean` (solo lo hacen `start`, `review`, `finish` y los
wrappers):

```
== status ==
?? tareas/01-en-diseno/TASK-001/borrador-personal.md
approve rc=1
[ERROR] Hay cambios sin guardar en "develop". Guardalos ("taskctl pause") o
        comitealos antes de continuar.
```

Y con `finish`, por la otra puerta:

```
[ERROR] TASK-001: el workspace tiene cambios sin commitear. Haz commit o stash
        antes de "taskctl finish" ...
```

En los dos casos el borrador **no llega a ningun commit**
(`git log --all --name-only | grep -c borrador-personal` = 0). Entre el
guard de rama base (`new`, `plan`, `approve`) y el de la 8.3
(`start`, `review`, `finish`), los ocho comandos abortan antes de
commitear si hay algo suelto en el arbol. Asi que la granularidad de
carpeta del pathspec **no puede** arrastrar un borrador ajeno por el
camino del CLI: para que entre, la persona tiene que haberlo commiteado
ella misma antes. **Mi decision: es aceptable y no hace falta tocar
nada.** La carpeta es territorio de `taskctl` y, aun asi, el guard la
protege.

### Nota (no es hallazgo) — `ficheros` con nombres no-ASCII

`r.ficheros` arrastra el comillado octal de Git
(`"tareas/.../informe-revisi\303\263n-\303\261.md"`), asi que un aviso de
intrusos con un nombre acentuado lo imprimiria escapado. Es preexistente
—la lista anterior salia del mismo `git diff --name-only`— y solo afecta
al texto, no al recuento, que es correcto. Lo anoto para que conste que
se probo.

## Hallazgos que decido NO pedir corregir

- **MENOR 1** (enlace colgante): probabilidad despreciable, y el arreglo
  actual cubre el caso realista.
- **MENOR 2** (aviso de `--push` sin test): verificado a mano en esta
  ronda y correcto; el test es deuda, no defecto.
- **MENOR 3** (mensaje durante el merge): cosmetico, confirmado como en
  la ronda 1.
- **MENOR 4** (borrador en la carpeta): decidido; no es alcanzable por el
  CLI.
- **No verificado, y lo digo:** `.taskcode` como symlink a fichero y
  `config.yml` como symlink colgante — `EPERM` al crearlos en Windows.

## Resumen

Los dos IMPORTANTES estan corregidos, y no de palabra: cada arreglo tiene
su contraprueba y cae exactamente un test por arreglo deshecho. El de
`limite_wip` ahora pasa por `runStartCommand` y falla por el motivo
correcto cuando se des-cabla, que era justo el agujero de la ronda 1. El
resultado del auto-commit se relee del commit real, coincide con
`git show` en el escenario del hook, y el aviso llega hasta stderr del
CLI —comprobado con el binario, no con el objeto—, con stdout diciendo ya
"2 ficheros" donde antes decia uno. El MENOR de `.taskcode` se cerro
preguntando al sistema de ficheros en vez de al errno, que es la leccion
de TASK-027 bien aplicada.

Busque falsos positivos del aviso nuevo con siete vectores (renombrados
con y sin deteccion, `autocrlf`, no-ASCII, commit raiz y dos ciclos de
vida completos por CLI) y no salio ninguno. La suite queda en 532 tests
con los tres rojos conocidos de Windows y ningun cuarto.

Lo que queda son cuatro MENORES, todos documentados arriba y ninguno
bloqueante: dos heredados de la ronda 1 que ya se habian declarado
cosmeticos, uno nuevo y exotico (el enlace colgante) y uno que esta ronda
cierra a favor del codigo (el borrador de la persona no es alcanzable por
el CLI). Nada de eso justifica una tercera ronda.

- Veredicto: aprobada
