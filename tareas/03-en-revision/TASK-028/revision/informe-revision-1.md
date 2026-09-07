# Informe de revision — TASK-028 (ronda 1)

- Commit revisado: 517ddb8f1f95dec25a26ddf4bc11f1cd4550f083
- Revisor: agente general-purpose independiente (no implemento TASK-028)
- Veredicto: aprobada

Informe definitivo. Cubre las dos pasadas: la auditoria original sobre
`e2db7aa` (6 hallazgos) y la verificacion del delta `e2db7aa..517ddb8`
que los corrige. El registro de los 6 hallazgos se conserva integro mas
abajo, cada uno con como quedo.

## Como se ha revisado

Todo fuera del arbol de trabajo. El repo original no se ha tocado salvo
este fichero.

**Pasada 1 (`e2db7aa`)** — clon limpio + `npm install && npm run build`;
auditoria frase por frase del SKILL.md contra `src/`, reproduciendo cada
afirmacion con el CLI real en repos Git temporales; las 7 filas de la
tabla del veredicto pasadas por `veredictoAprobado` importada de
`dist/`; `codex-review` y `revision_codex` ejercitados de punta a punta;
19 mutantes propios sobre los 15 tests; contraprueba de la contraprueba
(test 14) y del guard de no-vacuidad; simulacion de ausencia de
`claude`; linea base en dos clones.

**Pasada 2 (`517ddb8`)** — **clon nuevo** en `C:\temp\tc028\r2`, con
`npm install && npm run build` desde cero (rebuild obligatorio; no
reutilice el clon anterior). Sobre el: suite completa, los 15 tests de
la skill, `claude plugin validate`, 7 clases de mutantes rehechas sobre
el SKILL.md **modificado**, y verificacion contra `src/` de cada frase
nueva mas su reproduccion empirica en repos temporales.

### Linea base — sin regresiones

| Rama / commit | tests | pass | fail |
|---|---|---|---|
| `develop` (clon limpio) | 429 | 426 | 3 |
| `e2db7aa` (clon limpio) | 444 | 441 | 3 |
| **`517ddb8` (clon limpio)** | **444** | **441** | **3** |

Los 3 rojos son **los mismos tres** en las tres filas, y son los
deterministas del entorno Windows:

```
not ok 44  - taskctl approve: propaga cualquier error de stat que NO sea ENOENT
             EPERM: operation not permitted, symlink 'plan-final.md' -> ...
not ok 150 - taskctl plan: propaga cualquier error de escritura que NO sea EEXIST
             'Missing expected rejection.'  (chmod 0o555 sobre un directorio no
             tiene efecto en NTFS: el writeFile funciona y no llega el EACCES)
not ok 156 - taskctl plan: la rama base real tiene la tarea en un estado distinto...
             finales de linea: se esperaba \n y llega \r\n
```

El delta `517ddb8` no cambia el conteo (444) ni introduce ningun rojo
nuevo.

## Verificacion del delta e2db7aa..517ddb8

El delta toca 3 ficheros: `CLAUDE.md` (+8/−5), el `SKILL.md` (+14/−5) y
este informe. Nada de `src/` ni de `test/`.

### El SKILL.md sigue sano tras el cambio

| Comprobacion | Resultado |
|---|---|
| Los 15 tests de la skill | `# tests 15  # pass 15  # fail 0` |
| Lineas de cuerpo | **268** (limite 500) — 272 el fichero entero |
| `description` | 427 caracteres, **sin cambios** respecto a `e2db7aa` |
| Palabras | ~2.096 |
| `claude plugin validate .` | `✔ Validation passed` |

Mutacion rehecha **sobre el fichero nuevo** (7 clases, todas muertas por
el test que dicen cubrir; control sin mutar = `fail=0`):

| Mutante | Muere en |
|---|---|
| BOM UTF-8 | 2 (+14) |
| clave `version:` | 7 |
| rutas de maquina (`C:\Users\`, `/Users/`, `/home/`, `~/`) | 9, las cuatro |
| enlace relativo roto | 10 |
| cuerpo > 500 lineas | 8 |
| `name` distinto del directorio | 5 |

La red de regresion sigue intacta. El margen del test 8 baja de 238 a
232 lineas libres: sin acercarse al limite.

Tabla del veredicto re-ejecutada contra el `dist/` de `517ddb8`:
**7/7 filas correctas, 0 incorrectas.**

### Cada frase nueva, contrastada con `src/`

**Bloque de prerrequisito** (`git.ts:332-345`). `RAMA_BASE_ES_DEVELOP`
es `{feature:true, fix:true, release:true, hotfix:false}` y
`resolveBaseBranchForTipo` devuelve el literal `'develop'` o
`resolveMainBranch(cwd)`. Reproducido en cuatro repos temporales:

```
A) feature, repo con solo 'main'   -> [ERROR] La rama base "develop" no existe en
                                      local y no hay conexion con origin para crearla.
B) hotfix,  repo con solo 'main'   -> Tarea TASK-001 creada   (usa main)
C) hotfix,  repo con solo 'master' -> Tarea TASK-001 creada   (usa master)
D) hotfix,  con main Y master      -> "cambiado automaticamente de master a main"
```

Las cuatro frases del bloque son exactas, incluido «Sin `develop`, el
primer comando que escriba en `tareas/` ya falla» (caso A).

**Sobre la pregunta concreta de si te pasas de afirmacion en `hotfix`:
no, pero simplificas la precedencia.** `resolveMainBranch` tiene un
orden declarado — `origin/main` → `origin/master` → `main` local →
`master` local → `'master'` por defecto. Es decir: (a) `main` gana a
`master` cuando existen los dos, y el caso D lo confirma; (b) el remoto
gana al local; y (c) si **no existe ninguna de las dos** devuelve
`'master'` igualmente, que es el unico punto donde «lo que exista» se
queda corto. Nada de eso hace falsa la frase: no promete un orden, y en
el caso (c) el CLI corta con un error accionable (`rama base "master" no
existe en local...`). Para el cuerpo de una skill me parece la
simplificacion correcta; deletrear la cadena de cinco pasos costaria mas
de lo que aporta. **Observacion, no hallazgo.**

**Sinopsis y bullet de `board`** (`board.ts:119-127`). El codigo rechaza
la combinacion y su comentario dice «docs/BOARD.md es el tablero
COMPLETO del repo»; la skill dice «el fichero es la foto completa, no
una vista filtrada». Coinciden. Empirico:

```
$ taskctl board --escribir --sprint 0
[ERROR] --escribir no se puede combinar con --sprint ni --asignado-a: docs/BOARD.md
        es el tablero completo del repo. ...
```

**Bullet de `asignado_a`.** Verificado que **no hay un tercer comando**
que lo toque: solo `plan.ts` y `start.ts` importan `resolverAsignado` y
`gitUserEmail` y lo escriben; `new.ts:142` fija `asignado_a: null`;
`import.ts` no lo menciona en absoluto; `approve.ts:112` lo preserva
explicitamente. Ciclo completo en un repo temporal:

```
tras new:                          asignado_a: null
tras plan:                         asignado_a: a@t.t      (auto, git config)
tras approve:                      asignado_a: a@t.t      (conservado)
tras start --asignado-a otra@t.t:  asignado_a: otra@t.t   (el flag SI reasigna)
```

La frase acota el auto-relleno («y solo si la tarea no tenia a nadie»),
que es exactamente el comportamiento; el flag explicito va documentado
aparte en la sinopsis. Precisa.

**`CLAUDE.md`.** `444` es la cifra correcta de esta rama, medida en clon
limpio. Barri el resto del fichero: la unica otra cifra es «3 tests» de
la nota de Windows, tambien correcta. **No queda ninguna cifra
desfasada.**

## Los 6 hallazgos de la primera pasada, y como quedaron

| # | Sev. | Hallazgo sobre `e2db7aa` | Estado en `517ddb8` |
|---|---|---|---|
| 1 | IMPORTANTE | `CLAUDE.md` decia 429 tests; son 444 | **Resuelto.** 444, verificado en clon limpio |
| 2 | MENOR | «si aparece un cuarto, es tuyo» era absoluto | **Resuelto.** Ver detalle abajo |
| 3 | MENOR | La skill callaba que la rama base es `develop` | **Resuelto.** Bloque de prerrequisito, verificado en 4 repos |
| 4 | MENOR | Sinopsis de `board` sugeria una combinacion invalida | **Resuelto.** Partida en dos lineas + motivo |
| 5 | MENOR | «`asignado_a` se rellena solo» no decia que comandos | **Resuelto.** Acotado a `plan` y `start`; comprobado que no hay un tercero |
| 6 | MENOR | `CLAUDE.md` decia «dos por el truco del symlink» | **Resuelto.** Uno symlink, uno `chmod`/NTFS, uno CRLF |

### Detalle del 1 — era el unico bloqueante

Medido en clones limpios: `develop` = 429, esta rama = 444, y
444 − 429 = 15, exactamente los tests que anade
`test/skills/task-workflow.test.ts`. La cifra publicada se habia medido
en `develop`, antes de que existieran los tests de la propia tarea.
Corregida a 444 y re-verificada.

### Detalle del 2 — la redaccion nueva me parece bien calibrada

El texto nuevo separa los 3 deterministas de los intermitentes de
`EBUSY ... rmdir`, dice que estos fallan en el *teardown* y no en la
asercion, y cierra con «Cualquier otro cuarto rojo si lo es».

Es exactamente la distincion que yo habia observado: en una de mis
pasadas aparecieron los tests 159 y 161 en rojo con
`EBUSY: resource busy or locked, rmdir 'C:\...\taskctl-plan-*'`, y
pasaron en las otras tres. Ni demasiado absoluto ni demasiado laxo: da
un criterio **verificable** (mirar si el fallo es de asercion o de
limpieza) en vez de una lista cerrada de numeros de test, asi que
seguira siendo util cuando el conteo cambie. Sin objeciones.

### Detalle del 6

Confirmado de forma independiente: el unico test que falla con
`symlink()` es el 44 (`EPERM`); el 150 falla con
`Missing expected rejection` porque hace `chmod(planificacion/, 0o555)`
y espera `EACCES`, que en NTFS no llega
(`test/commands/plan.test.ts:362`); el 156 es CRLF. La clasificacion
nueva es correcta.

## Hallazgos de esta pasada

### MENOR 7 — el prerrequisito que la skill sigue callando: el CLI no existe hasta compilarlo

Respuesta a la pregunta de juicio. Recorri lo que hace alguien que
instala el plugin en un proyecto desde cero, y **descarte** varios
candidatos comprobandolos:

```
tareas/ no existe        -> taskctl new la crea sola. No es prerrequisito.
sin identidad git local  -> taskctl new funciona. No bloquea.
fuera de un repo git     -> corta con mensaje claro; la premisa de la skill es un repo.
```

Queda uno de verdad, y es **anterior** a `develop`: en un clon recien
hecho del plugin **no hay CLI**. `dist/` esta en `.gitignore` (linea 2)
y no se versiona; `plugin.json` no declara `bin` —y el test 11 asevera
justamente que no lo tenga—; `package.json` tampoco. Resultado:

```
$ ls .../plugins/taskcode-plugin/
README.md bin package-lock.json package.json scripts skills src test tsconfig.json
$ ls .../taskcode-plugin/dist   ->  No such file or directory
$ node .../bin/taskctl --version
[ERROR] taskctl no pudo arrancar: Cannot find module '...\dist\src\cli.js'
exit=1
```

`bin/taskctl` hace `import('../dist/src/cli.js')`, asi que hasta un
`npm install && npm run build` dentro del plugin no hay nada que
ejecutar — y aun despues `taskctl` no queda en el PATH de ningun
proyecto.

**No bloqueo por esto, y lo documento en vez de pedir su correccion**,
por cuatro razones: (a) la skill ya condiciona su propia aplicabilidad a
«y el comando `taskctl` esta disponible», asi que **no afirma nada
falso**; (b) el arreglo no es una edicion del SKILL.md sino una decision
de empaquetado —como se distribuye un CLI compilado en un plugin sin
`bin`—, que excede el alcance del item C5; (c) el error es explicito y
sale con codigo 1, no en silencio; (d) es preexistente, no lo introduce
esta tarea.

**Recomendacion:** abrir item propio para la distribucion del CLI
(compilar en el empaquetado, versionar `dist/`, o documentar el arranque
en el README del plugin). Cuando ese item se cierre, conviene que la
skill acabe diciendo en una linea como se pone `taskctl` disponible.

### Observaciones, sin hallazgo

- La precedencia de `resolveMainBranch` (`main` gana a `master`, el
  remoto gana al local, y el fallback es `'master'` aunque no exista)
  queda simplificada en «`main` o `master`, lo que exista». Justificado
  arriba: no lo considero un hallazgo.
- Tres de los 15 tests (10, 11 y el bucle del 12) siguen sin aseverar
  nada hoy: no hay enlaces relativos, `plugin.json` no declara
  `commands`/`skills` y `.claude-plugin/` solo contiene `plugin.json`.
  Son guardas de regresion honestas; mis mutantes demuestran que
  disparan en cuanto la condicion aparece.
- El mensaje de `finish` con `revision_codex: true` sigue remitiendo a
  `taskctl codex-review`, que no existe. Defecto **preexistente** del
  CLI (`state-machine.ts`), fuera del alcance de TASK-028; la skill lo
  documenta correctamente.
- `claude plugin validate` sobre `taskcode-marketplace/` sigue fallando
  («No manifest found... Expected .claude-plugin/marketplace.json»): ese
  directorio solo contiene `plugins/`. Preexistente y ajeno a esta tarea.
- Nota metodologica: dos de mis mutantes de rutas de maquina murieron
  por culpa mia y no del codigo (GNU sed interpretando `\U` y `\r`, y el
  shell comiendose los backslashes antes de `node -e`). Rehechos desde
  un fichero de script, el test 9 mata las cuatro variantes. Lo dejo
  escrito porque es justo el modo en que una campana de mutacion produce
  un falso «test vacuo».

## Veredicto

Los 6 hallazgos estan **efectivamente corregidos**, no solo redactados:
verifique cada uno contra `src/` y reproduciendolo, en un clon nuevo
recompilado desde cero. El unico bloqueante de la pasada anterior —la
cifra de `CLAUDE.md`— es ahora correcto, y no queda ninguna otra cifra
desfasada en el fichero. La correccion del hallazgo 3, la sustancial, no
se limita a tapar el hueco: describe bien el reparto `develop` /
principal por tipo de tarea, y lo he confirmado en cuatro repos
distintos, incluido el caso con `main` y `master` a la vez.

El cambio **no ha introducido nada nuevo**: mismos 444 tests con los
mismos 3 rojos deterministas de entorno, los 15 de la skill en verde, el
validador limpio, 268 lineas de cuerpo frente al limite de 500, la
`description` intacta, la tabla del veredicto 7/7 y la red de mutacion
igual de tupida sobre el fichero modificado. Ninguna de las frases
nuevas es falsa contra el codigo: las contraste todas con el mismo
liston que el resto.

Queda abierto el **MENOR 7**, que documento sin pedir correccion y con
el motivo explicito: no es un defecto del SKILL.md ni algo que una
edicion suya pueda resolver, sino una decision de empaquetado del plugin
que merece item propio.

Apruebo.
