# Hallazgos acumulados

Trampas que ya costaron tiempo y patrones que merece la pena repetir. Ordenado
por lo que más probablemente te muerda hoy.

## Patrones a reutilizar

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
3. **No se puede ejecutar dos veces seguidas.** Las carpetas que crea dejan el
   workspace sucio, y el guard de §8.3 aborta la siguiente invocación — la
   herramienta genera justo la suciedad que bloquea su próximo uso. Hay que
   commitear en medio.

La (3) es evidencia directa a favor de implementar el paso 5 de §8.3
(auto-commit), que es el item **C2** del checklist.

Corolario operativo: **los ficheros que le pases a `import` van fuera del
repo.** Dentro, ensucian el workspace y abortan el propio import.

## Git-Flow: deuda conocida

- **Bug de `origin` sin guard** en 3 scripts que siguen sin corregir:
  `create-develop.sh`, `recover-branch.sh`, `resume-work.sh` (item C6). Los
  dos `merge-*-to-main` se corrigieron en B2 (2026-09-05) con un matiz que
  añadió la revisión por pares: distinguen "sin origin configurado" (modo
  local, como los merge a develop) de "origin configurado que no responde"
  (abortan con instrucción, porque el tag de release se crearía sobre una
  `main` posiblemente obsoleta respecto al remoto).
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
  cuenta — otra evidencia a favor del auto-commit del paso 5 (item C2). El
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
- **Paso 5 de §8.3** (que `taskctl` commitee y suba lo que genera): sin
  implementar y sin decidir. Mientras no exista, una tarea nueva no llega al
  resto del equipo sola.
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
