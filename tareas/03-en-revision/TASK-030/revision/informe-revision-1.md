# Informe de revision — TASK-030 (ronda 1)

- Commit revisado: bc88c0470dbcbb7748a2b16372680e7e0ad0954a
- Revisor: general-purpose (independiente; no implemento nada de C2 ni C4)
- Fecha: 2026-09-07
- Plataforma de reproduccion: Windows 11, Node v22.23.2, git bash

## Que se reprodujo, y con que salida

Todo lo destructivo se hizo en repos Git temporales fuera del repo
(`$TMP/rev*`, `$TMP/e2e*`, `$TMP/tc-copy`). El repo de trabajo no se
toco: `git status --porcelain` vacio al terminar, misma rama, sin
commits nuevos. Lo unico que se escribio dentro fue `dist/` (ignorado).

### 0. Linea base de la suite

```
node --test "dist/test/**/*.test.js"
# tests 528 / # pass 525 / # fail 3
not ok 44  - taskctl approve: propaga cualquier error de stat que NO sea ENOENT
not ok 159 - taskctl plan: propaga cualquier error de escritura que NO sea EEXIST
not ok 165 - taskctl plan: la rama base real tiene la tarea en un estado distinto...
```

Son los tres rojos conocidos de Windows de CLAUDE.md (chmod sobre
directorio x2, symlink). Ningun cuarto rojo.

### 1. Regla n1 de C2 — "nunca `git add -A` sin pathspec"

Se ataco con siete vectores contra `autoCommit` y contra
`runStartCommand` completo. En **ninguno** entro trabajo ajeno:

| vector | resultado |
|---|---|
| fichero sin trackear en la raiz | no entra; sigue `?? ajeno.txt` |
| fichero ajeno ya PREPARADO con `git add` (tracked y untracked) | no entra; sigue `A  nuevo.txt` / `M  src/algo.ts` (modo `--only` respetado) |
| hook `post-checkout` que, **durante** el comando, crea untracked, modifica un tracked y ademas hace `git add` de uno | commit = solo `tareas/02-en-curso/TASK-910/tarea.md`; arbol despues: `A  nuevo.txt`, ` M src/algo.ts`, `?? "otro dir/"` |
| nombres con espacios, `ñ` y guion inicial (`-ajeno raro ñ.txt`) | no entran |
| ruta de la carpeta de tarea con espacios y `ñ` | commitea bien, no arrastra nada |
| submodulo con cambios | no entra (`M vendor/sub` intacto) |
| fichero ignorado por `.gitignore` | no entra |

Ademas, `normalizarRuta` rechaza `.` y `../fuera` (comprobado: lanza
`AutoCommitError`), asi que no hay puerta de atras al `add -A` global.

**Contraprueba del diseno** (no solo del cableado). En una copia del
plugin en `$TMP/tc-copy` se sustituyo el pathspec por un `git add -A`
global (y el `commit -- rutas` por `commit` a secas). Caen **exactamente**
los tests que aseveran la regla, y solo esos:

```
not ok 57  - taskctl start: commitea SOLO la tarea; el trabajo ajeno del arbol no entra y sigue sucio
not ok 58  - taskctl review: commitea revision/ sin arrastrar el trabajo ajeno que dejo el merge
not ok 388 - autoCommit NO se lleva el trabajo de la persona: su fichero sucio no entra y sigue sucio
not ok 389 - autoCommit respeta lo que la persona ya tenia PREPARADO con git add (modo --only)
```

(El resto de rojos de la copia son los 3 de Windows mas 14 de
`skills/task-workflow` que fallan por la ruta de la copia, no por el
codigo. Linea base de la copia: 17.)

### 2. La ventana entre `isWorkspaceClean` y el commit — ¿existe o es teatro?

**Existe y es determinista.** Confirmado que los tres comandos que el
plan citaba (`start`, `review`, `finish`) **si** llaman a
`isWorkspaceClean` y abortan con el arbol sucio — la correccion del
agente es correcta, y esta escrita en la cabecera de
`auto-commit.test.ts`. La ventana real es la de despues: los hooks
`post-checkout` / `post-merge` que los scripts de Git-Flow disparan a
mitad de comando. Reproducido en el experimento 3 de la tabla de
arriba: el hook escribe con la tarea ya en disco y el commit todavia por
hacer, y el commit sale limpio igualmente. Los tests lo reproducen por
esa misma via (`hookQueEnsucia`), que es determinista, no una carrera.

### 3. Lo cableado en la integracion

- **`new.ts` / `import.ts`**: extremo a extremo con el binario real.
  Tres `taskctl new` seguidos sin commit manual: `rc=0`, tres commits
  `chore(TASK-00N): tarea creada`, arbol limpio. Dos `taskctl import`
  seguidos: idem.
- **`start.ts` + `limite_wip`**: con config por defecto, el segundo
  `start` aborta (`rc=1`, mensaje de WIP); con `limite_wip: 2`
  commiteado en `.taskcode/config.yml`, el segundo `start` **pasa**
  (`rc=0`, rama creada). El mecanismo esta vivo en el CLI. `limite_wip: 1`
  se comporta exactamente como antes.
- **`cli.ts` / `ConfigError`**: `limite_wp: 2` sale como
  `[ERROR] ...: clave desconocida "limite_wp". Quiza quisiste decir
  "limite_wip". Claves validas: ...` con `rc=1`, sin caer al catch-all
  `"taskctl no pudo arrancar"`.
- **Unificacion de `runGit`**: el `runGit` que sobrevive en `git.ts` es
  **byte-identico** al de `develop`; el unico cambio es la palabra
  `export` (verificado con `diff` del bloque de funcion contra
  `git show develop:.../git.ts`). No hay cambio de comportamiento. Aviso
  honesto: la copia que vivia en `git-commit.ts` **no es verificable**
  desde esta rama — el frente C2 llego en un solo commit aplastado, asi
  que "las dos copias eran identicas" no lo puedo confirmar ni desmentir
  con evidencia.

### 4. Los cuatro tests modificados — ¿siguen probando algo?

**Si, y prueban mas que antes.** Contraprueba: se neutralizo `autoCommit`
por completo (retorno temprano con `commiteado: false`) y se corrio la
suite. Caen 23 tests no-artefacto, entre ellos los cuatro en cuestion:

```
not ok 115 - runImportCommand: idempotente por titulo normalizado — reimportar el mismo fichero no duplica
not ok 142 - runNewCommand: IDs consecutivos sin colision al crear varias tareas seguidas
not ok 143 - runNewCommand: hallazgo real (...) — un tipo hotfix cambia a "main"...
not ok 60  - taskctl import dos veces seguidas SIN commitear en medio
```

El motivo es solido: `ensureBaseBranchReady` aborta *incondicionalmente*
con el arbol sucio (leido en `git.ts`), asi que quitar el commit manual
no los hace tolerantes — los hace **depender** del auto-commit. Ademas
`new.test.ts` gano una asercion de `git status --porcelain` vacio.

### 5. Ningun test nuevo pasa con el cableado deshecho

Con `autoCommit` neutralizado caen los 9 tests de `auto-commit.test.ts`
y 10 de `git-commit.test.ts`. El unico superviviente es
`ok 391 - autoCommit no crea commits vacios cuando el fichero ya estaba
identico`, y es inevitable (asercion negativa); su equivalente a nivel de
comando, `not ok 56 - taskctl approve dos veces seguidas: la segunda no
crea un commit vacio`, si cae. No es un hallazgo.

### 6. Fallo cerrado de la config

23 casos por `resolverConfig` sobre repos temporales. Abortan como debe:
`limite_wip` a `0`, `-1`, `dos`, `1.5`, vacio, `true`, lista, `"2"`
entrecomillado; clave desconocida; clave repetida; `rama_base` vacia;
`config.yml` que es un directorio (`EISDIR`); documento con `---`.
Devuelven defaults sin quejarse: sin `.taskcode/`, fichero vacio, solo
comentarios. Toleran BOM, CRLF, tabs e indentacion. `rama_base: "  x  "`
se recorta. Desde un subdirectorio profundo lee la del repo
(`limite_wip: 7`). Un `.taskcode/config.yml` en el **padre** del repo
**no** se lee (devuelve defaults; `rutaConfig` apunta dentro del repo).
`rama_base: integration` cambia de verdad feature/fix/release y **no**
toca hotfix (`main`).

### 7. `--push`

Con un `origin` bare real: `taskctl plan TASK-001 --push` y
`taskctl approve --push TASK-001` — las dos posiciones del flag —
commitean y suben (`git ls-remote` confirma el sha en el bare). Con
`origin` inalcanzable: `[AVISO] ... no se ha subido. Se continua en modo
local.` y `rc=0`. Sin nada que commitear: `Sin cambios que commitear` +
`Push completado`, `rc=0`. HEAD desacoplado: aviso `sin-rama`, no
intenta subir. Mensaje con tilde: `AutoCommitError`.

---

## Hallazgos

### IMPORTANTE 1 — `limite_wip` es la unica clave sin prueba de cableado; deshacerlo no rompe nada

**Reproduccion.** En `$TMP/tc-copy`, revertir la linea que la integracion
anadio en `start.ts`:

```ts
-    const limiteWip = resolverConfig(deps.repoCwd).limite_wip;
-    const bloqueantes = tareasQueBloquean(tareas, personaParaWip, task.id, limiteWip);
+    const limiteWip = 1;
+    const bloqueantes = tareasQueBloquean(tareas, personaParaWip, task.id);
```

(y el `mensajeWipExcedido` correspondiente). Resultado:

```
# tests 528 / # pass 511 / # fail 17     <- linea base exacta de la copia
```

**Cero tests caen.** Por contraste, deshacer las otras dos claves
(`resolverConfig(cwd).rama_base` -> `'develop'` en `git.ts`, y quitar el
argumento de `parseNewTaskArgs`/`parseImportArgs`) tumba cinco:

```
not ok 261 - rama_base: cambia la rama que resolveBaseBranchForTipo devuelve para feature/fix/release
not ok 263 - rama_base: taskctl new CAMBIA de verdad a la rama configurada, no solo la calcula
not ok 264 - agente_revisor_por_defecto: taskctl new lo escribe en el tarea.md
not ok 266 - agente_revisor_por_defecto: taskctl import usa el MISMO valor que new
not ok 279 - fallo cerrado real: resolveBaseBranchForTipo NO cae a "develop" con un config roto
```

Los tests de `limite_wip` (`config.test.ts:243` y `:279`) son puros
sobre `tareasQueBloquean(...)` y `mensajeWipExcedido(...)`: nunca pasan
por `runStartCommand`. Es decir, el mecanismo esta probado y el cableado
no.

**Por que importa.** Es literalmente la regresion que ya ocurrio una vez
en esta tarea — la linea llego sin cablear de los dos frentes y solo la
salvo que el integrador se diera cuenta a mano. El criterio de
aceptacion "cada clave surte efecto de verdad (no solo se lee)" esta
cumplido *hoy* (verificado a mano en la seccion 3), pero no esta fijado:
manana lo rompe cualquiera en silencio. La forma de cerrarlo es un test
de `runStartCommand` sobre un repo temporal con `limite_wip: 2` que
compruebe que el segundo `start` pasa, y con `limite_wip: 1` que aborta —
que es exactamente lo que hice a mano y funciona.

### IMPORTANTE 2 — con un hook `pre-commit` que hace `git add`, el commit si se lleva trabajo ajeno, y el informe que imprime `taskctl` es falso

**Reproduccion.** Repo temporal con
`.git/hooks/pre-commit` = `#!/bin/sh\ngit add -A` (el patron de
lint-staged / prettier / `git add -u`, comun en repos reales, y el plugin
se distribuye a repos ajenos). Fichero sin trackear
`ajeno-sin-trackear.txt` de la persona en el arbol. Se llama a
`autoCommit` con la carpeta de la tarea:

```
REPORTA ficheros = ["tareas/02-en-curso/TASK-901/tarea.md"]  commiteado= true
GIT REGISTRO     = ["ajeno-sin-trackear.txt","tareas/02-en-curso/TASK-901/tarea.md"]
status despues   = "D  ajeno-sin-trackear.txt\n?? ajeno-sin-trackear.txt"
```

El fichero de la persona acaba **dentro de un commit `chore(TASK-901)`**
y el indice queda en un estado raro (borrado preparado + untracked). Con
un hook `git add -u` pasa lo mismo con `src/algo.ts` modificado a medias.

**Atribucion honesta:** la primera mitad **no es un fallo del codigo de
la tarea**. Es la semantica de git para commits con pathspec: en modo
`--only` git construye un indice temporal y se lo pasa al hook, asi que
un hook que hace `git add` mete lo que quiera. Lo comprobe con un control
sin `taskctl` — `git add -A -- <ruta> && git commit -m manual -- <ruta>`
a pelo produce exactamente el mismo commit de 2 ficheros. No hay forma de
cumplir la regla n1 y respetar los hooks del repo a la vez.

**La segunda mitad si es de `taskctl` y si es barata:** `ficheros` se
calcula con `git diff --cached --name-only` **antes** del commit, asi que
`printAutoCommit` dice *"Commiteado abc1234 en X (1 fichero)"* cuando git
ha registrado 2. En el unico escenario en que la regla n1 se rompe, el
CLI afirma justo lo contrario de lo que ha pasado. Sugerencia: recalcular
`ficheros` con `git show --name-only --format= HEAD` despues de commitear
y, si aparece algo fuera de `presentes`, avisar por stderr (o abortar).
Cuesta tres lineas y convierte un fallo silencioso en uno visible.

### MENOR 3 — `.taskcode` que es un FICHERO cae al default en silencio (y el codigo documenta lo contrario)

`config.ts` afirma en su cabecera: *"CUALQUIER otro fallo de lectura
(permisos, `.taskcode` que resulta ser un fichero, `config.yml` que
resulta ser un directorio) SI aborta"*. Empiricamente, en Windows, no:

```
.taskcode es fichero      {"rama_base":"develop","agente_revisor_por_defecto":"general-purpose","limite_wip":1}
config.yml es directorio  ABORTA: ConfigError :: ... EISDIR
```

Causa: `readFileSync('<repo>/.taskcode/config.yml')` con `.taskcode`
fichero devuelve **`ENOENT`** en Windows (comprobado leyendo `e.code`),
no `ENOTDIR`, y el `if (code === 'ENOENT') return defaults` se lo traga.
En Linux daria `ENOTDIR` y abortaria — o sea, comportamiento distinto por
plataforma en un mecanismo cuyo lema es "fallo cerrado". Es un estado
raro del disco y por eso lo dejo en MENOR, pero o se arregla (comprobar
con `statSync` que `.taskcode` es directorio antes de leer) o se corrige
el comentario, que hoy miente.

### MENOR 4 — `HALLAZGOS.md` se contradice a si mismo en el mismo commit

La rama anade a `HALLAZGOS.md` la seccion "El auto-commit solo toca lo
que escribe (TASK-030)" y actualiza la trampa del doble `import`, pero
deja intacto, ~400 lineas mas abajo **del mismo fichero**:

```
- **Paso 5 de §8.3** (que `taskctl` commitee y suba lo que genera): sin
  implementar y sin decidir. Mientras no exista, una tarea nueva no llega al
  resto del equipo sola.
```

Igual de obsoletos quedan `ESTADO.md` (C2 y C4 marcados *"Bloqueado por
la decision #14 / #9"*, decisiones ya resueltas) e
`INVENTARIO_PENDIENTE.md` §2.4 (*"sigue sin decidir ni implementar"*).

### MENOR 5 — `CHECKLIST_TERMINACION.md` sin tocar

`git diff develop..HEAD --stat -- docs/` devuelve **solo**
`HALLAZGOS.md`. C2 y C4 siguen con la casilla vacia y los contadores de
la tabla de cabecera sin actualizar, y es un criterio de aceptacion
explicito de la tarea ("Checklist, contadores y estimaciones de C2 y C4
actualizados"). Lo dejo en MENOR porque puede ser deliberado hasta
`taskctl finish`, pero entonces conviene decirlo.

### MENOR 6 — el aviso de `finish --push` sobre `mainBranch` y el tag no tiene test

El bloque nuevo de `cli.ts` que avisa de que `--push` **no** ha subido
`main` ni el tag solo se activa con `result.mainBranch !== null`, es
decir en hotfix/release. `finish.test.ts` y `auto-commit.test.ts` solo
cubren el camino feature (`mainBranch === null`). Verifique que el camino
feature no rompe (test 59 en verde); el texto del aviso, que usa
`result.rama.split('/')[0]`, no lo ejerce nadie.

### MENOR 7 — `git commit -- <rutas>` falla durante un merge en curso, y el mensaje despista

Con `MERGE_HEAD` presente:

```
THREW: [ERROR] taskctl escribio los ficheros de la tarea pero NO pudo commitearlos:
fatal: cannot do a partial commit during a merge.. Estan preparados (git add) en la
rama "main": revisa el motivo (un hook de pre-commit, una firma GPG, o
"git config user.email" sin configurar) y haz el commit a mano.
```

Cumple la regla 3 (falla ruidosamente y el stderr de git aparece), pero
las tres causas que sugiere el mensaje no son la real. No encontre un
camino realista que llegue ahi (los comandos abortan antes por
`isWorkspaceClean` o por fallo del script de Git-Flow), asi que es
cosmetico.

### MENOR 8 — un borrador de la persona DENTRO de la carpeta de la tarea si entra

La granularidad del pathspec es la carpeta, no el fichero:

```
2) ficheros commiteados = ["tareas/.../TASK-901/borrador-personal.md",
                           "tareas/.../TASK-901/tarea.md"]
```

Es diseño (la carpeta de la tarea es territorio de `taskctl`, y de hecho
hace falta para que `revision/informe-revision-N.md` entre), pero el
criterio de aceptacion dice, sin acotar, *"un fichero sucio de la persona
no entra en el commit"*. Merece una frase en el criterio o en
`HALLAZGOS.md`, no un cambio de codigo.

### MENOR 9 — `extraerPushFlag` filtra `--push` en cualquier posicion, incluso como valor de otro flag

`taskctl new --titulo "--push"` deja `resto = ['--titulo']` y falla con
"falta el valor". Es intencionado y esta razonado en el codigo; sin
impacto practico. Lo anoto solo para que conste que se probo.

## Hallazgos que decido NO pedir corregir

- **IMPORTANTE 2, primera mitad** (el hook `pre-commit` que hace `git add`
  se lleva ficheros ajenos): es semantica de git, reproducida con `git`
  a pelo sin `taskctl` de por medio. Pido corregir solo el informe falso,
  que si es codigo de la tarea.
- **MENOR 7, 8 y 9**: cosmeticos o de diseño ya razonado en el codigo.
- **MENOR 5**: si el plan es marcar el checklist en `finish`, basta con
  decirlo; no bloquea.

## Resumen

C2 esta bien construido: la regla n1 aguanta los siete vectores que le
tire, y —lo que importa mas— la contraprueba del diseño funciona
(sustituir el pathspec por `add -A` tumba exactamente los cuatro tests
que aseveran la regla, ni uno mas ni uno menos). C4 falla cerrado en los
23 casos probados. Los cuatro tests que se modificaron salieron
reforzados, no debilitados: los cuatro caen si se neutraliza el
auto-commit. La ventana entre la comprobacion y el commit existe y esta
reproducida de forma determinista, no es teatro.

Lo que pido antes de aprobar es poco y concreto: un test que fije el
cableado de `limite_wip` en `runStartCommand` (hoy es la unica de las
tres claves que se puede des-cablear sin que caiga nada, y ya se
des-cablo una vez), y que `printAutoCommit` no pueda afirmar "1 fichero"
cuando git ha registrado dos. Lo demas es documentacion desincronizada.

- Veredicto: cambios-solicitados
