# Informe de revision — TASK-026 (ronda 2)

- Commit revisado: 9266966 ("fix(TASK-026): aplica los hallazgos de la revision
  por pares"), sobre 8370cd1 / 1ff68e1
- Rama: `feature/task-026-wrappers-de-git-flow-en-taskctl-diagnose`
- Base: `develop`
- Revisor: agente independiente (no implemento el codigo; mismo revisor de la
  ronda 1)
- Entorno: Windows 11 nativo, **clon nuevo** en
  `%TEMP%/.../scratchpad/clon026r2`, con `C:\Program Files\Git\usr\bin`
  prependido al PATH, `npm install && npm run build && npm test`.
- Veredicto: aprobada

> Nota de cierre (la escribe quien implementa, no el revisor): el revisor
> lo redacto como **APROBADO**; se normaliza a "aprobada" porque es la
> palabra que lee `taskctl finish`, misma convencion que en TASK-025. De
> los tres MENOR de esta ronda, el 1 (falsos positivos del guard del
> registro) quedo corregido despues de este informe, en el commit e1f62fe;
> los otros dos se documentan sin corregir en el Resultado de la tarea.

## Resumen

Los dos hallazgos IMPORTANTES de la ronda 1 estan corregidos y verificados
empiricamente, no por lectura del diff:

- **El cuelgue ya no se reproduce.** El mismo experimento de la tuberia
  abierta que en la ronda 1 dejaba a `taskctl resume` vivo indefinidamente
  ahora termina solo, con codigo 0 y **haciendo exactamente lo que anuncia el
  aviso**.
- **`pause` sin terminal ya no muere con `Opcion no reconocida: ''`** en un
  repo que no ignora `logs/`: corta antes, sin invocar el script y sin dejar
  rastro.

Y ninguno de los arreglos ha roto lo que ya funcionaba: la rama interactiva
sigue llevando la respuesta al `read -rp` del script, `isInsideWorkTree` no
rechaza nada legitimo (subdirectorio, worktree enlazado, submodulo, repo sin
commits), la validacion de argumentos esta intacta y el test nuevo del runner
discrimina de verdad sin poder colgar la suite.

Quedan tres apuntes MENOR, ninguno bloqueante. El unico que recomiendo tocar
antes de cerrar es el primero, y es de una linea: el guard de `logs/` tiene
falsos positivos, y en uno de ellos **el mensaje que imprime es falso**.

---

## Estado de la suite

```
$ cd .../clon026r2/taskcode-marketplace/plugins/taskcode-plugin
$ npm install && npm run build && npm test
# tests 414
# pass 410
# fail 4
not ok 31  - main: sin --asignado-a y sin identidad Git no se imprime linea de asignacion
not ok 42  - taskctl approve: propaga cualquier error de stat que NO sea ENOENT ...
not ok 139 - taskctl plan: propaga cualquier error de escritura que NO sea EEXIST ...
not ok 145 - taskctl plan: la rama base real tiene la tarea en un estado distinto ...
```

- `42`, `139` y `145` son los **3 de la baseline conocida** (dos symlink
  `EPERM` / `Missing expected rejection`, uno de CRLF).
- `31` es otra vez el flake de `EBUSY: resource busy or locked, rmdir` de
  `main.test`, el mismo de la ronda 1 (alli cayo en el subtest 30). Re-corrido
  aislado:

```
$ node --test dist/test/cli/main.test.js
# tests 9
# pass 9
# fail 0
```

**414 tests y solo los 3 fallos de la baseline.** Coincide con lo que declara
el coordinador. Cero regresiones en el resto del CLI.

---

# Verificacion de los arreglos

## 1. IMPORTANTE 2 (cuelgue) — CORREGIDO

Mismo lanzador que la ronda 1 (`hang.mjs`, `stdio: ['pipe','inherit','inherit']`,
sin escribir ni cerrar nunca la tuberia, margen de 15 s). Los tres escenarios:

**(a) `pause` en un repo sin `logs/` ignorado** — antes: colgado.

```
[ERROR] taskctl pause preguntaria igualmente aunque el workspace este limpio: este repo
no ignora "logs/", y los scripts de Git-Flow escriben ahi su registro nada mas arrancar.
Anade "logs/" al .gitignore del repo (es lo que espera el plugin), o ejecuta el comando
desde una terminal.

>>> TERMINO solo: code=1 signal=null
-- estado del repo despues --
(vacio: ni logs/, ni commit, ni stash)
```

**(b) `resume <rama>` con stash real y origin real** — antes: colgado tras el
checkout y el pull, con el aviso ya impreso y sin cumplirlo.

```
[AVISO] Sin terminal interactiva: si "feature/con-stash" tiene un stash de
"taskctl pause", resume-work.sh lo aplicara sin preguntar (es su valor por defecto).
...
[OK   ] Stash aplicado correctamente.
       RESULTADO : COMPLETADO
>>> TERMINO solo: code=0 signal=null
-- stash list despues --
(vacio)
-- rama actual --
feature/con-stash
```

El aviso ahora es una afirmacion **cierta**: dijo que aplicaria el stash y lo
aplico.

**(c) `recover <rama>` con la rama existiendo en local y en origin**:

```
[AVISO] Sin terminal interactiva: si "feature/con-stash" ya existe en local,
recover-branch.sh cancelara sin sobreescribirla (es su valor por defecto).
[WARN ] La rama 'feature/con-stash' ya existe localmente.
[INFO ] Operación cancelada. La rama local no fue modificada.
>>> TERMINO solo: code=0 signal=null
```

Tambien cumple lo anunciado. **Sin hallazgos.**

## 2. No se ha roto el caso con terminal

`stdin: 'inherit'` solo cuando `interactivo` es true, asi que hay que recorrer
esa rama a proposito. Sonda que llama a `runWrapperCommand(..., interactivo: true)`
desde un proceso hijo con stdin controlado, contra `pause-work.sh` **real** y
un workspace sucio de verdad:

```
== interactivo=true, respuesta 'cancelar' por stdin ==
  Cambios sin guardar en main:
     M README.md
[WARN ] Operación cancelada. No se guardó nada.
       RESULTADO : CANCELADO
>>> code= 0 signal= null avisos= 0
  status (debe seguir sucio, nada guardado):
 M README.md
  stash list: (vacio)

== interactivo=true, respuesta 'stash' por stdin ==
[OK   ] Stash creado: pause: main 2026-09-06
       RESULTADO : COMPLETADO
>>> code= 0 signal= null avisos= 0
  status (debe estar limpio): (vacio)
  stash list: stash@{0}: On main: pause: main 2026-09-06
```

Dos respuestas distintas, dos resultados distintos, y los guards no se aplican
con terminal. La herencia de stdin sigue viva donde tiene que estarlo.
**Sin hallazgos.**

## 3. `isInsideWorkTree` — corrige lo de la ronda 1 y no rechaza nada legitimo

Corregido (antes eran mensajes crudos de Git o un informe sobre un workspace
inexistente):

```
-- pause dentro de .git --
 [ERROR] taskctl pause solo funciona dentro del arbol de trabajo de un repositorio Git,
 y "...\r2_args\.git" no lo es. Ejecutalo desde la carpeta del repo.
-- diagnose dentro de .git --
 [ERROR] taskctl diagnose solo funciona dentro del arbol de trabajo ...
-- diagnose en repo bare --
 [ERROR] taskctl diagnose solo funciona dentro del arbol de trabajo ...
```

Y no rechaza de mas. Probado uno a uno, todos siguen funcionando:

| Contexto | Resultado |
|---|---|
| Raiz del repo | OK |
| Subdirectorio hondo (`sub/mas/hondo`) | OK, y `logs/` se crea en la raiz, no en el subdir |
| Worktree enlazado (`git worktree add`) | `is-inside-work-tree` = true, `pause` OK en la rama `wt` |
| Submodulo (`vendor/sub`) | `is-inside-work-tree` = true, `diagnose` exit 0 y `pause` OK |
| Repo recien inicializado sin commits | OK (el `.gitignore` sin commitear lo caza antes el guard de workspace sucio, correctamente) |
| Fuera de un repo | Mensaje unico de taskctl, sin lanzar `bash` |

**Sin hallazgos.**

## 4. El test nuevo del runner discrimina y no puede colgar la suite

`test/fs/gitflow-runner.test.ts` lanza ahora un proceso hijo `hijo.mjs` con
`spawnSync(..., { input: 'una respuesta\n' })` y compara `inherit` (exit 21,
leyo la linea) contra el default (exit 22, EOF). Es exactamente lo que le
faltaba al de la ronda 1, que devolvia 0 en las dos opciones.

No puede colgar: `spawnSync` con `input` escribe y **cierra** la tuberia, asi
que las dos ramas llegan a EOF o a la linea; ninguna se queda esperando. El
comentario del test explica ademas por que hacia falta el hijo (bajo
`node --test` el stdin del fichero de test es una tuberia que nadie cierra),
que es justo lo que yo habia medido en la ronda 1. La suite completa termino
en los dos clones sin colgarse. **Sin hallazgos.**

## 5. Regresiones por el mensaje de la §8.3 y por la senal

Mensaje nuevo, en vivo:

```
$ node bin/taskctl new --titulo "x" --tipo feature      # workspace sucio
[ERROR] Hay cambios sin guardar en "develop". Guardalos ("taskctl pause") o comitealos
antes de continuar.
```

Coherente con el ejemplo de la §8.3 de la metodologia congelada. Ningun test
del resto del CLI se rompio por el cambio de texto (414/410, solo baseline).

Bateria de argumentos de la ronda 1 repetida entera sobre el nuevo commit
(`diagnose --foo`, `diagnose extra`, `abort-merge rama`, `pause --bar`,
`resume a b`, `resume --push mi-rama`, `resume --`, `resume ""`,
`resume "rama con espacios"`): **identica, todos exit 1 con mensaje propio**.
Los cinco wrappers sobre el clon real siguen saliendo 0 y dejan el workspace
limpio. **Sin hallazgos** (ver MENOR 3 para un matiz sobre la senal).

---

# Hallazgos

## MENOR 1 — El guard de `logs/` tiene falsos positivos, y en uno de ellos el mensaje que imprime es falso

### Que falla

`isIgnored('logs/', repoCwd)` pregunta por el **nombre del directorio**, no
por lo que el script escribe realmente (`logs/gitflow/gitflow-<fecha>.log`).
Es una aproximacion, y falla en tres configuraciones legitimas. En las tres,
la **verdad de campo** (ejecutar un script de Git-Flow de verdad y mirar
`git status` despues) es que el workspace se queda limpio y `pause` habria
funcionado.

Bateria completa, con `git check-ignore -q -- logs/` y con `taskctl pause`
sin terminal:

| `.gitignore` | `check-ignore logs/` | `taskctl pause` | Verdad de campo |
|---|---|---|---|
| `logs/` | 0 | OK | limpio |
| `logs` | 0 | OK | limpio |
| `/logs/` | 0 | OK | limpio |
| `logs/*` | 0 | OK | limpio |
| **`logs/gitflow/`** | **1** | **ABORTA** | **limpio → falso positivo** |
| **`*.log`** | **1** | **ABORTA** | **limpio → falso positivo** |
| (ninguno) | 1 | ABORTA | `?? logs/` → correcto |

Y el caso que mas me preocupa, un repo que **si** tiene `logs/` en su
`.gitignore` pero conserva algun fichero bajo `logs/` trackeado (el clasico
`logs/.gitkeep` para que la carpeta exista en el clon):

```bash
mkdir -p r2_track/logs && cd r2_track
git init -q -b main . && git config user.email t@e.com && git config user.name T
echo hola > README.md && echo marca > logs/.gitkeep
git add -A -f && git commit -q -m inicial
printf 'logs/\n' > .gitignore && git add -A && git commit -q -m ignore
```

```
  cat .gitignore:
logs/
  check-ignore -q -- logs/            rc: 1
  check-ignore --no-index -q -- logs/ rc: 0
  check-ignore -q -- logs/gitflow/gitflow-2026-09-06.log rc: 0

  taskctl pause (sin terminal):
[ERROR] taskctl pause preguntaria igualmente aunque el workspace este limpio: este repo
no ignora "logs/", y los scripts de Git-Flow escriben ahi su registro nada mas arrancar.
Anade "logs/" al .gitignore del repo (es lo que espera el plugin), o ejecuta el comando
desde una terminal.

  -- ejecuto un script de verdad y miro el status --
  ficheros creados: gitflow-2026-09-06.log
  git status --porcelain:
    (LIMPIO -> pause habria funcionado; el guard es un FALSO POSITIVO)
```

La causa es documentada de `git check-ignore`: **por defecto no considera
ignoradas las rutas que estan en el indice** (para eso existe `--no-index`).
Con `logs/.gitkeep` trackeado, `check-ignore -- logs/` devuelve 1 aunque la
regla exista.

### Impacto

- **El mensaje miente**: dice *"este repo no ignora `logs/`"* de un repo cuyo
  `.gitignore` contiene literalmente `logs/`, y pide *"Anade `logs/` al
  .gitignore"* — una accion que no cambia nada, asi que quien la siga vuelve
  a chocar con el mismo error. La salida sigue existiendo ("o ejecuta el
  comando desde una terminal"), pero es la que el usuario descartara ultima.
- En los otros dos casos (`logs/gitflow/`, `*.log`) el mensaje es tecnicamente
  cierto y la instruccion funciona; el coste es solo un `pause` no interactivo
  rechazado sin necesidad.
- Falla **cerrado** en todos los casos: nunca invoca el script ni deja el repo
  a medias. Por eso es MENOR y no bloquea.

Lo que **si** acierta, comprobado: `.git/info/exclude` con `logs/` y un
`core.excludesFile` con `logs/` los reconoce sin problema (el guard deja
pasar), y desde un subdirectorio hondo tambien, porque `isIgnored` resuelve
`--show-toplevel` antes de invocar `check-ignore`. Cero falsos negativos
encontrados.

### Sugerencia (una linea, verificada)

Preguntar por el fichero que el script escribe de verdad en vez de por el
directorio. Probado sobre los siete patrones de la tabla:

```
  patron='logs/'         -> check-ignore(logs/gitflow/gitflow-2026-09-06.log) rc=0
  patron='logs'          -> rc=0
  patron='/logs/'        -> rc=0
  patron='logs/*'        -> rc=0
  patron='logs/gitflow/' -> rc=0
  patron='*.log'         -> rc=0
  patron=''              -> rc=1
```

Exacto en los siete, incluido el caso del `.gitkeep` trackeado (la ruta
consultada no esta en el indice, asi que el salto por indice no aplica).
Alternativa equivalente para el caso del indice: `check-ignore --no-index`.
Si se cambia, el mensaje deberia dejar de afirmar que el repo "no ignora
logs/" y hablar del registro de Git-Flow.

---

## MENOR 2 — La misma trampa de `logs/` deja `taskctl resume` inservible, y ahi no hay guard

La ronda 2 tapo `pause`, que era el hallazgo. Pero `resume-work.sh` exige un
workspace limpio (`El workspace no está limpio. Guarda o descarta los cambios
primero.`) **despues** de que `initialize_gitflow_log` haya creado
`logs/gitflow/`. En un repo que no ignora `logs/`, `resume` falla siempre:

```bash
# repo sin logs/ en .gitignore, con origin real, workspace limpio
node bin/taskctl resume main < /dev/null
```

```
[AVISO] Sin terminal interactiva: si "main" tiene un stash de "taskctl pause",
resume-work.sh lo aplicara sin preguntar (es su valor por defecto).
[ERROR] El workspace no está limpio. Guarda o descarta los cambios primero.
[INFO ] Usa GitFlow 16 Pause Work para guardar tu trabajo actual.
EXIT: 1
-- status --
?? logs/
```

El unico "cambio sin guardar" es el `logs/` que acaba de crear el propio
script, y el consejo que da (`Pause Work`) llevaria al usuario justo al guard
de MENOR 1, que abortaria tambien.

Impacto: bajo y **preexistente** — es el hallazgo 2 de TASK-007
(`docs/spikes/TASK-007-resultado.md:133`) manifestandose en otro script, y los
`.sh` estan fuera de alcance a proposito. Lo anoto por la asimetria: ahora que
`isIgnored` existe, avisar tambien desde `resume` (o desde los cinco) cuesta
lo mismo que ya cuesta en `pause`, y evita que el sistema mande al usuario a
un comando que tampoco va a funcionar. Alternativa razonable: dejarlo escrito
en `HALLAZGOS.md` y resolverlo de raiz cuando exista el scaffold que TASK-007
pedia ("el `.gitignore` de cualquier proyecto que adopte el plugin debe traer
`logs/` desde el primer scaffold").

---

## MENOR 3 — La rama nueva de `signal` no se puede alcanzar en Windows, y no tiene test

`cli.ts` reporta ahora la senal y sale 1, como `start`/`review`/`finish`. El
cambio es correcto y coherente, pero conviene saber que en el entorno de
trabajo del proyecto **no se ejecuta nunca**. Sonda con un script que se
auto-mata:

```bash
printf '#!/usr/bin/env bash\nkill -TERM $$\nsleep 5\n' > diagnose-repo.sh
node -e "...spawnSync('bash',[script])..."
```

```
status= 3840 signal= null
```

Bash bajo MSYS traduce la senal a un codigo de salida, asi que `signal` sigue
siendo `null` y lo que se propaga es el `3840` tal cual. En Linux/macOS si
llegara como senal y el mensaje nuevo apareceria.

Impacto: ninguno funcional. Lo anoto porque (a) no hay ningun test que cubra
esa rama —ni podria haberlo en esta plataforma— y (b) el comportamiento real
en Windows para un script interrumpido es un codigo de salida raro sin
explicacion, no el mensaje nuevo. Si interesa cubrirlo, el sitio es CI sobre
`ubuntu-latest`, con el patron de "pregunta abierta como step de CI que
asevera" que ya usa el proyecto.

---

## Sobre lo que se decidio NO corregir

De acuerdo con las dos decisiones, y las suscribo:

- **MENOR 4 de la ronda 1 (cherry-pick / revert no detectados).** El
  razonamiento es correcto: si `operacionEnCurso` los detectara, el guard
  cortaria sin terminal mientras que con terminal el script diria "sin
  operaciones que abortar" y saldria 0 — dos comportamientos distintos segun
  haya terminal, que es peor que la incoherencia actual. Pertenece a C6, junto
  con los textos que todavia citan los menus de IntelliJ.
- **MENOR 7 de la ronda 1 (detached HEAD).** El mensaje del guard sigue siendo
  cierto (`pause` *tendria* que preguntar), y la ramificacion extra no
  compensa. Ambos casos salen con codigo 1 igualmente.

Ambos deberian quedar por escrito en el `Resultado` de la tarea, como ya
anuncia el coordinador, y los tres MENOR de esta ronda con ellos.

---

# Criterios de aceptacion

Repasados uno a uno sobre este commit:

| Criterio | Estado |
|---|---|
| Los cinco existen, salen en `--help` y ejecutan su script | Cumplido |
| Codigo de salida propagado tal cual | Cumplido (42 -> 42; `pause` cancelado 0; `Opcion no reconocida` 1) |
| Heredan stdin; `start`/`review`/`finish` siguen con `'ignore'` | Cumplido, ahora con matiz: heredan **solo con terminal**, que es lo correcto y esta documentado en la cabecera del modulo |
| Sin terminal, aborta antes de invocar cuando la respuesta importa | Cumplido (workspace sucio, `logs/` no ignorado, merge/rebase en curso, `resume`/`recover` sin rama) |
| Sin terminal pero pudiendo seguir, funciona y avisa del default | Cumplido y **verificado que el aviso se cumple** |
| Argumentos validados en taskctl | Cumplido |
| Fuera del arbol de trabajo, mensaje unico de taskctl | Cumplido, y ahora tambien en repo bare y dentro de `.git/` |
| No leen ni escriben `tareas/` | Cumplido |
| Tests contra repos Git reales, con merge en conflicto y stash de verdad | Cumplido |
| Smoke test manual en un clon del repo real | Hecho en esta revision, sobre `clon026r2` |

---

# Recomendacion

**APROBADO.** Los dos IMPORTANTES estan cerrados con evidencia, y no hay
regresiones. Antes de dar la tarea por terminada yo haria solo una cosa, que
es de una linea y tengo la comprobacion hecha:

1. **MENOR 1** — cambiar la consulta de `isIgnored` al fichero real
   (`logs/gitflow/...`) o anadir `--no-index`, y ajustar el mensaje para que
   no afirme que un repo no ignora `logs/` cuando si lo hace. Un test con el
   fixture del `logs/.gitkeep` trackeado lo dejaria clavado.

Los MENOR 2 y 3 valen como anotacion en `HALLAZGOS.md` y en el `Resultado`;
no bloquean.
