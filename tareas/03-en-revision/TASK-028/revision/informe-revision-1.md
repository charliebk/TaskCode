# Informe de revision — TASK-028 (ronda 1)

- Commit revisado: e2db7aaf5b380cf3ba58dcd7a890d0864892a4ff
- Revisor: agente general-purpose independiente (no implemento TASK-028)
- Veredicto: cambios-solicitados

## Como se ha revisado

Todo fuera del arbol de trabajo. Clon nuevo en `C:\temp\tc028\clon`
(rama de la tarea) y otro en `C:\temp\tc028\dev` (develop), ambos con
`npm install && npm run build`. Repos Git temporales desechables en
`C:\temp\tc028\{smoke,wip,repocodex,repocodex2,nodev}` para ejercitar el
CLI real. Copia mutable en `C:\temp\tc028\mut` para las mutaciones. El
repo original no se ha tocado salvo este fichero.

1. **Auditoria frase por frase del SKILL.md contra `src/`**. Cada
   afirmacion factual (comandos, flags, defaults, estados, carpetas,
   precondiciones, guard, WIP, veredicto) contrastada contra
   `cli.ts`, `commands/*.ts`, `core/state-machine.ts`, `core/task.ts`,
   `core/wip.ts`, `cli/args.ts`, `fs/git.ts`, `fs/gitflow-runner.ts`, y
   despues **reproducida ejecutando el CLI**.
2. **Tabla del veredicto**: las 7 filas pasadas por `veredictoAprobado`
   real, importada de `dist/src/commands/finish.js`.
3. **`codex-review` y `revision_codex`**: repos temporales completos,
   `taskctl finish` real.
4. **Mutacion propia de los 15 tests** (19 mutantes construidos por mi,
   sin mirar la tabla del implementador), mas contraprueba de la
   contraprueba (test 14) y del guard de no-vacuidad.
5. **Linea base**: suite completa en los dos clones.
6. `claude plugin validate` y simulacion de ausencia de `claude`.

### Linea base (no hay regresiones)

| Rama | tests | pass | fail |
|---|---|---|---|
| `develop` (clon limpio) | 429 | 426 | 3 |
| `feature/task-028-...` (clon limpio) | 444 | 441 | 3 |

Los 3 rojos son **los mismos tres** en ambas ramas y son los conocidos
del entorno Windows:

```
not ok 44  - taskctl approve: propaga cualquier error de stat que NO sea ENOENT
             EPERM: operation not permitted, symlink 'plan-final.md' -> ...
not ok 150 - taskctl plan: propaga cualquier error de escritura que NO sea EEXIST
             'Missing expected rejection.'  (chmod 0o555 sobre un directorio
             no tiene efecto en NTFS: el writeFile funciona y no hay EACCES)
not ok 156 - taskctl plan: la rama base real tiene la tarea en un estado distinto...
             + '# Plan real en develop\r\n'   - '# Plan real en develop\n'
```

Delta exacto: **+15 tests, los 15 en verde. Ningun rojo nuevo.**

> **Aviso sobre el arbol de trabajo.** Cuando empece la revision el
> workspace estaba limpio en `e2db7aa`. A mitad de la revision
> `CLAUDE.md` aparecio **modificado sin commitear** por algo ajeno a mi
> (yo solo he escrito este informe). Ese cambio no commiteado reescribe
> justamente la linea del hallazgo MENOR 6 y **lo corrige**. Mi revision
> es del commit `e2db7aa`, asi que el hallazgo 6 se reporta contra lo
> que hay commiteado; si ese edit se commitea, el 6 queda resuelto de
> oficio. El resto de hallazgos no le afectan.

## Lo que se ha verificado y esta bien

**La tabla del veredicto: 7/7 filas correctas.** Ejecutada contra el
parser real:

```
OK | "- Veredicto: aprobada"                  | skill: pasa  | real: pasa
OK | "- Veredicto: aprobada con correcciones" | skill: pasa  | real: pasa
OK | "- Veredicto: **APROBADO**"              | skill: falla | real: falla
OK | "- Veredicto: APROBADO CON CAMBIOS"      | skill: falla | real: falla
OK | "- Veredicto: cambios-solicitados"       | skill: falla | real: falla
OK | "- Veredicto: PENDIENTE (...)"           | skill: falla | real: falla
OK | "Veredicto: aprobada" (sin guion)        | skill: falla | real: falla
Filas incorrectas: 0
```

Comprobado ademas que la explicacion de cada fila es la correcta y no
una coincidencia: `- Veredicto: **aprobada**` tambien falla, asi que
"los asteriscos rompen el inicio" es exacto; y `aprobada` + `PENDIENTE`
en dos lineas da `false`, que respalda el "no anadir otra debajo".

**`codex-review` y `revision_codex`, verificado de punta a punta.** Repo
temporal con TASK-777 en `en-revision`, `revision_codex: true` e
`informe-revision-1.md` con veredicto aprobado:

```
$ taskctl finish TASK-777
[ERROR] TASK-777 tiene revision_codex activada pero esa revision independiente no esta aprobada.
        Ejecuta: taskctl codex-review TASK-777
exit=1
```

...y ese comando no existe (`[ERROR] Comando desconocido: "codex-review"`;
`cli.ts` no menciona `codex` en absoluto; el unico `informe-codex` de
`src/` es el `INFORME_CODEX_RE` que **lee** `finish.ts`, nadie lo
escribe). Con `revision_codex: false` la misma tarea cierra a la
primera. Y con el informe escrito **a mano** (TASK-778) tambien cierra
— que es justo el matiz que la skill deja dicho ("salvo que se vaya a
redactar a mano"). La afirmacion de la skill es exacta, incluida su
puerta de escape.

**Los 12 comandos de "Lo que NO existe" no existen.** Los 12
(`codex-review, status, list, show, reject, reopen, assign, delete,
edit, init, commit, push`) devuelven `[ERROR] Comando desconocido`.

**El resto de afirmaciones factuales, comprobadas ejecutando:**

- Carpetas y estados: coinciden con `STATE_FOLDER` uno a uno. Enums
  `feature|fix|hotfix|release` y `trivial|simple|media|alta|critica`
  exactos (`core/task.ts`).
- Precondiciones de `plan`/`approve`/`start`/`review`/`finish`:
  coinciden con `assertTransitionAllowed`, incluido el `salvo que la
  complejidad sea trivial o simple` (`TRIVIAL_SIN_APROBACION`).
- `approve` no mueve la tarea (sigue en `01-en-diseno/`). Verificado.
- `plan` deja `planificacion/plan-final.md` con secciones vacias;
  `review` crea `revision/` con peticion + scaffold del informe, cuya
  plantilla trae literalmente `- Veredicto: PENDIENTE (...)`. Las dos
  subcarpetas se crean bajo demanda. Verificado.
- Defaults: `sprint: 0`, `complejidad: media`, `etiquetas: []` en el
  frontmatter generado. `new` sin `--tipo` → `[ERROR] Falta --tipo`;
  `import` sin `--tipo` usa `feature`. Verificado.
- `taskctl approve --loquesea TASK-001` → `"--loquesea" no es un ID de
  tarea valido`. `approve`/`review`/`finish` leen `argv[0]` crudo;
  `plan`/`start` usan posicionales. Verificado en codigo y ejecutando.
- Flags desconocidos ignorados en silencio: `new --titulo X --tipo
  feature --inventado xyz` crea la tarea sin rechistar.
- `board` sin `--escribir` no crea `docs/BOARD.md`; con `--escribir`,
  si.
- Guard §8.3 aplicado por exactamente 4 comandos (`ensureBaseBranchReady`
  solo en `new`, `import`, `plan`, `approve`); `start`/`review`/`finish`
  solo `isWorkspaceClean`. Con workspace sucio aborta; con workspace
  limpio: `Workspace limpio -> cambiado automaticamente de "otra-rama" a
  "develop".` — "cambian de rama solos y lo dicen despues", literal.
  `isWorkspaceClean` es `git status --porcelain === ''`, asi que los
  ficheros sin trackear cuentan como sucio. Verificado.
- Limite de WIP en `start`: bloquea la segunda tarea de la misma
  persona, y usa el asignado de la TAREA, no la identidad de quien
  ejecuta. Ejecutar `start` sobre la tarea de otro **no** roba
  `asignado_a`. Verificado.
- `logs/gitflow/`: `_gitflow-common.sh` hace
  `log_dir="$repo_root/logs/gitflow"`. Exacto.
- `stdin` sin TTY: `cli.ts` pasa `interactivo: process.stdin.isTTY === true`
  y `gitflow-runner.ts` documenta el `'ignore'` por defecto. Exacto.

**Los 15 tests son tests de verdad.** 19 mutantes propios, todos
muertos por el test que dicen cubrir:

| Mutante | Muere en |
|---|---|
| BOM UTF-8 | 2 (+14) |
| linea en blanco antes de `---` | 2 (+8 mas) |
| sin `---` de cierre | 3 (+9 mas) |
| `name` != directorio | 5 |
| `name` no kebab-case | 4, 5 |
| clave `version:` | 7 |
| `description` vacia / con `<` / con `" #"` | 6 |
| cuerpo vacio | 8 |
| cuerpo > 500 lineas | 8 |
| rutas de maquina (`C:\Users\`, `/Users/`, `/home/`, `~/`) | 9 (las 4) |
| enlace relativo roto | 10 |
| `SKILL.md` → `skill.md` | 1 |
| `plugin.json` con `bin` | 11 |
| `plugin.json` con `skills` objeto | 11 (+13, +14) |
| `skills/` dentro de `.claude-plugin/` | 12 |

Aviso metodologico: mi primer mutante de rutas de maquina **sobrevivio**,
y era culpa mia — GNU sed se comio el `\U` y el `\r` de
`C:\Users\pepe\repo` y escribio `C:SERSPEPE^MEPO`. Rehecho con Node, el
test 9 mata las cuatro variantes. Merece la pena dejarlo escrito porque
es exactamente el modo en que una campana de mutacion da un falso
"test vacuo".

**El guard de no-vacuidad sirve.** Con `PLUGIN_ROOT` resuelto un nivel
de mas, no se cuela ni uno: `# tests 15 / pass 0 / fail 15`, y el guard
muere el primero con `PLUGIN_ROOT resuelto a "...", que no es el
plugin`. No hay forma de que estos tests pasen apuntando a otro sitio.

**El test 14 discrimina de verdad.** Lo verifique redirigiendo la
mutacion a un fichero que el validador no escanea
(`skills/task-workflow/OTRO.md`) dejando el `SKILL.md` de la copia
intacto. El test se pone rojo con el mensaje correcto:

```
not ok 15 - 14. contraprueba de descubrimiento...
  error: romper el frontmatter no hizo fallar al validador: no esta mirando esa ruta.
         Validating plugin manifest: ...\taskcode-skill-WNV8h0\.claude-plugin\plugin.json
```

No pasa por accidente. Y es la comprobacion de mas valor de la tarea:
confirme que `claude plugin validate` **en el caso bueno no imprime
ninguna linea `Validating skill:`** (solo `Validating plugin manifest`
+ `✔ Validation passed`), asi que romper la skill es la unica evidencia
disponible de que Claude Code descubre el fichero en esa ruta. El
diseno del test es correcto por ese motivo.

**El skip de integracion es visible, no un pase silencioso.** Con el
PATH reducido al directorio de `node`:

```
ok 14 - 13. `claude plugin validate` ... # SKIP el binario "claude" no esta en el PATH: ...
ok 15 - 14. contraprueba de descubrimiento ... # SKIP el binario "claude" no esta en el PATH: ...
# pass 13   # skipped 2
```

El motivo se imprime en la propia linea y el resumen contabiliza
`skipped`. Correcto.

**El SKILL.md como artefacto.** `claude plugin validate .` sobre el
plugin sale 0 sin errores. Frontmatter minimo (`name` + `description`),
sin `version:` — correcto para el spec portable. `name` = 13 chars,
kebab-case, coincide con el directorio. `description` = 427 chars (muy
por debajo del limite). Cuerpo 262 lineas / ~2.000 palabras, dentro de
lo recomendado. CRLF en el arbol de trabajo pero **LF en el blob de
Git** (`git show HEAD:...` sale sin `^M`), consistente con el resto del
repo (no hay `.gitattributes`, `README.md` igual): no es un problema.

**Juicio sobre la `description` como gatillo: me parece suficiente.** No
es vaga: abre con el caso de uso, y luego enumera gatillos *literales y
entrecomillados* ("crear una tarea", "planificar una tarea", "aprobar
un plan", "empezar una tarea", "revisar por pares", "cerrar una
tarea") mas tres anclas de alta especificidad y baja ambiguedad —
`taskctl`, `TASK-NNN` y la estructura `tareas/` con `00-planificadas ..
04-terminadas`. Esas tres son las que de verdad la van a disparar: son
cadenas que practicamente no aparecen en otro contexto, asi que dan
recall alto sin falsos positivos. La condicion estructural ("cuando el
proyecto tiene una carpeta tareas/ con...") es ademas justo lo que un
agente puede comprobar solo. Dos limitaciones que asumo, no hallazgos:
esta solo en espanol (coherente con un plugin cuya metodologia es en
espanol, y `taskctl`/`TASK-NNN` son neutros al idioma), y no lleva
gatillos para "board"/"tablero" en ingles ni para los nombres de estado
sueltos. No lo veo suficiente motivo para pedir cambios.

**Alcance: sin filtraciones.** Busque las 20 marcas de TaskCode que no
deberian viajar. Cero coincidencias en `docs/contexto`, `CHECKLIST`,
`CONVENCIONES`, `ESTADO.md`, `cero dependencias`, `npm test`,
`npm install`, `TaskCode`, `PLAN_SPRINTS`, `parseFrontmatter`,
`state-machine`, `IECA`, `Carlos`, `42 items`, `decision #`. Las tres
coincidencias de "hallazgos" son el sustantivo comun; la de "TASK-0" es
el ejemplo `TASK-001`. `develop` y `master` no aparecen (ver hallazgo
3). Las unicas rutas citadas — `docs/BOARD.md` y `logs/gitflow/` — son
del propio CLI y de los scripts, o sea que viajan con la herramienta:
correcto que esten. La regla 4 esta generalizada bien ("actualizar el
registro de progreso que use el proyecto") y la politica de no borrar
ramas se presenta como condicional. **Sin hallazgos de alcance.**

## Hallazgos

### IMPORTANTE 1 — `CLAUDE.md` dice 429 tests; en esta rama son 444

El cambio de `CLAUDE.md` existe precisamente para corregir una cifra
desfasada (226) y se mergea con otra cifra desfasada. 429 es el numero
de **develop**, medido antes de anadir los 15 tests de esta misma
tarea; el numero correcto al cerrarla es **444**.

Reproduccion (clones limpios, `npm test`):

```
develop:                 # tests 429  # pass 426  # fail 3
feature/task-028-...:    # tests 444  # pass 441  # fail 3
```

444 − 429 = 15, exactamente los tests que anade
`test/skills/task-workflow.test.ts`.

Es IMPORTANTE y no MENOR por tres razones: es el unico entregable
verificable de la parte de `CLAUDE.md`; es falso en el instante del
merge, no dentro de N tareas; y reproduce literalmente el defecto que
la tarea se propuso arreglar. Choca ademas con la regla 9 que la propia
skill enuncia ("un mensaje que ha dejado de ser cierto es peor que no
tenerlo").

**Correccion:** `429` → `444` en `CLAUDE.md`.

### MENOR 2 — "si aparece un cuarto, es tuyo" es demasiado absoluto

La linea nueva de `CLAUDE.md` dice: «Aqui «suite en verde» significa que
fallan solo esos tres: **si aparece un cuarto, es tuyo**».

Lo he falsificado en esta misma maquina. En una de mis cuatro pasadas de
la suite aparecieron dos rojos adicionales que no tienen nada que ver
con ningun cambio de codigo:

```
not ok 159 - taskctl plan --asignado-a: reasignar a la MISMA persona no cuenta como cambio
  error: "EBUSY: resource busy or locked, rmdir 'C:\...\taskctl-plan-hHMeUN\tareas'"
not ok 161 - taskctl plan: el ID se lee de los posicionales...
  error: "EBUSY: resource busy or locked, rmdir 'C:\...\taskctl-plan-2SYcKq\tareas\01-e...'"
```

`EBUSY ... rmdir` en la limpieza del directorio temporal es el bloqueo
de fichero clasico de Windows (indexador/antivirus). Los mismos dos
tests pasaron en las otras tres ejecuciones. Un agente que se crea la
frase tal cual gastara una tarde buscando una regresion inexistente —
que es el coste que esa nota pretendia evitar.

**Correccion sugerida:** matizar a algo como «si aparece un cuarto,
reejecuta; si persiste, es tuyo. Los `EBUSY` al borrar temporales son
flakes del sistema de ficheros de Windows, no regresiones».

### MENOR 3 — la skill nunca dice que la rama base es literalmente `develop`

La skill habla siempre de "la rama base" en abstracto y nunca dice cual
es. Pero el codigo la tiene **hardcodeada**:
`resolveBaseBranchForTipo()` devuelve el literal `'develop'` para
`feature`/`fix`/`release` (solo `hotfix` resuelve a main/master), y
`finish.ts` arranca con `const DEVELOP_BRANCH = 'develop'`.

Consecuencia en un repo sin `develop`, que es el caso de cualquier
proyecto no Git-Flow al que se distribuya la skill:

```
$ git init -b main && ... && taskctl new --titulo "Prueba" --tipo feature
[ERROR] La rama base "develop" no existe en local y no hay conexion con origin
        para crearla. Revisa el repo antes de continuar.
```

Falla el **primer** comando del ciclo de vida y la skill no da ninguna
pista de por que. Nada de lo que la skill dice es falso, y el mensaje de
error del CLI es accionable (por eso es MENOR y no IMPORTANTE), pero la
seccion "Cuando aplica" define el contrato de aplicabilidad y se queda
corta: le falta que el repo necesita una rama `develop`.

Conviene ademas dejar constancia de que la premisa del plan es
incorrecta: D5 afirma «la rama base **no se hardcodea** como `develop`
(es configurable, hay repos con `master`)». No es configurable hoy. La
decision de que no viaje `develop` en el texto es defendible, pero su
motivo declarado no se sostiene contra el codigo.

**Correccion sugerida:** una linea en "Cuando aplica" o en el bullet de
la rama base: la base es `develop` para `feature`/`fix`/`release` y
`main`/`master` para `hotfix`; sin `develop` los comandos que escriben
en `tareas/` abortan.

### MENOR 4 — la sinopsis de `board` sugiere una combinacion que el CLI rechaza

La skill escribe `taskctl board [--sprint N] [--asignado-a <persona>]
[--escribir]`, que en notacion de sinopsis significa que los tres son
opcionales e independientes. No lo son:

```
$ taskctl board --escribir --sprint 0
[ERROR] --escribir no se puede combinar con --sprint ni --asignado-a: docs/BOARD.md
        es el tablero completo del repo. ...
```

El `--help` del propio CLI arrastra la misma imprecision, asi que la
skill es fiel a la fuente; pero la skill se vende como mas exacta que la
documentacion, y este es justo un caso donde podia serlo. Impacto real
bajo: el mensaje de error es excelente y se corrige solo.

**Correccion sugerida:** partir la linea en dos, o una nota junto al
bullet de `board` que ya existe.

### MENOR 5 — "`asignado_a` se rellena solo" no dice que comandos lo hacen

El bullet dice «`asignado_a` se rellena solo con `git config user.email`
si la tarea no tenia a nadie», sin acotar. Solo lo hacen `plan` y
`start`. Comprobado:

```
$ taskctl new --titulo "Prueba" --tipo feature   →  asignado_a: null
$ taskctl plan TASK-001                          →  Asignada a "smoke@t.t"
```

Un agente que cuente con que `new`/`import` dejan la tarea asignada se
llevara una sorpresa (el tablero la muestra sin asignar). La segunda
mitad del bullet — que ejecutar un comando sobre la tarea de otra
persona no se la queda — la he verificado y es cierta.

**Correccion sugerida:** «`plan` y `start` rellenan `asignado_a` con
`git config user.email` si la tarea no tenia a nadie».

### MENOR 6 — `CLAUDE.md` atribuye mal uno de los 3 fallos de Windows

La linea nueva dice «(**dos** por el truco del symlink, uno por finales
de línea)». Solo uno es el truco del symlink. Los tres, con su causa
real:

| Test | Causa |
|---|---|
| 44 (`approve`) | `EPERM: operation not permitted, symlink ...` → **symlink** |
| 150 (`plan`) | `Missing expected rejection.` → **`chmod` sobre un directorio no hace nada en NTFS**, asi que el `writeFile` funciona y nunca llega el `EACCES` que el test espera |
| 156 (`plan`) | `+ '...\r\n'  - '...\n'` → **finales de linea** |

El test 150 (`test/commands/plan.test.ts:362`) hace
`chmod(planificacion/, 0o555)` y espera `EACCES`; no toca ningun
symlink. El unico test con `symlink()` que falla es el 44.

Impacto bajo, pero es una nota escrita para que quien vea un rojo sepa
si es suyo: si dice que hay dos symlinks y solo hay uno, quien mire el
segundo no encontrara lo que la nota le prometio.

**Ya corregido en el arbol de trabajo, sin commitear** (ver el aviso de
"Como se ha revisado"): el texto no commiteado dice «uno por el truco
del symlink (`EPERM`), uno porque `chmod` sobre directorios no hace nada
en NTFS, y uno por finales de línea (CRLF)», que es **exactamente lo que
he medido**. Basta con commitearlo.

### Observacion, sin hallazgo

- Tres de los 15 tests (10, 11 y el bucle de 12) hoy **no aseveran nada**
  porque el cuerpo no tiene enlaces relativos, `plugin.json` no declara
  `commands`/`skills` y `.claude-plugin/` solo contiene `plugin.json`.
  No los cuento como hallazgo: son guardas de regresion honestas y mis
  mutantes M10/M13/M14/M15 demuestran que disparan en cuanto la
  condicion aparece. Es exactamente lo que D4 anticipaba para el dia que
  la skill se parta en `references/`.
- El mensaje de error de `finish` con `revision_codex: true` dice
  `Ejecuta: taskctl codex-review TASK-NNN`, un comando que no existe.
  Es un defecto **preexistente** del CLI (`state-machine.ts`), fuera del
  alcance de TASK-028, y la skill lo documenta correctamente. Lo dejo
  anotado por si merece item propio.
- `claude plugin validate` sobre `taskcode-marketplace/` falla («No
  manifest found... Expected .claude-plugin/marketplace.json»): ese
  directorio solo contiene `plugins/`. Preexistente (nunca existio en
  `develop`) y ajeno a esta tarea, pero condiciona que la skill llegue a
  instalarse por esa via.

## Veredicto

El SKILL.md es solido en lo que mas importaba: **no miente**. Audite
todas sus afirmaciones factuales contra el codigo y reproduciendolas con
el CLI real, y no encontre ni un comando inventado, ni un flag
equivocado, ni un estado mal ordenado, ni una precondicion mal descrita.
La tabla del veredicto, que es lo que la gente va a copiar, es correcta
en sus 7 filas contra el parser real. El aviso sobre `codex-review` y
`revision_codex` es exacto hasta el matiz de la puerta de escape. Los 15
tests resisten la mutacion, el guard de no-vacuidad impide que pasen en
falso, el test 14 discrimina de verdad y el skip de integracion es
visible. No hay regresiones: +15 tests, todos verdes, los mismos 3
rojos de entorno que en `develop`.

Pido cambios por un solo motivo de peso: **el hallazgo IMPORTANTE 1**.
La correccion de `CLAUDE.md` se mergea con la cifra equivocada — 429
cuando son 444 —, que es literalmente el defecto que esa correccion
existia para arreglar, y es trivial de arreglar.

Los cinco MENOR son opcionales. Recomiendo cerrar tambien el **6**
(esta ya escrito sin commitear, solo hay que commitearlo), el **3** (la
rama base `develop`, porque la skill viaja a proyectos ajenos y es
donde antes se va a topar un agente) y el **2** (afirma una regla que he
falsificado empiricamente). Los tres hallazgos de `CLAUDE.md` (1, 2 y 6)
caen en la misma seccion de cuatro lineas, asi que se corrigen de una
pasada.

Ninguno de ellos toca el SKILL.md, que es el entregable central de la
tarea y que, en lo esencial —su veracidad—, ha resistido todo lo que le
he echado.
