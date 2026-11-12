# Comandos: `doctor`, `estado`, `metricas` y `registrar-coste`

Volver al [README del plugin](../README.md).

## Comandos disponibles

Ver `taskctl --help` (arriba) para la lista completa y actualizada. Guía
extendida de la metodología: `docs/PROPUESTA_METODOLOGIA.md` y
`docs/PLAN_SPRINTS.md` en la raíz del repo `TaskCode`.

`taskctl doctor [--json]` (solo lectura) comprueba de una vez que el proyecto
está listo para trabajar y es lo primero que conviene ejecutar al instalar el
plugin en un proyecto. Una línea por comprobación (`ok`, `aviso`, `error` u
`omitida`) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
algún error (los avisos no cuentan). Comprueba:

- **Entorno**: Node 22 o superior, `git` y un `bash` capaz de ejecutar los
  scripts de Git-Flow. Lo último se prueba ejecutando de verdad un script mínimo
  (`scripts/gitflow/_sonda-bash.sh`: `mktemp`, `dirname`, `grep`, `sed`, `tr`, `wc`,
  `git`) con el mismo lanzamiento que usan los scripts, no mirando una ruta ni
  `bash --version`: en Windows detecta el bash de WSL (System32) y el de Git sin
  `usr\bin` en el PATH, y el arreglo dice qué poner al principio del PATH.
- **Repositorio**: que es un repo Git (un worktree también), que tiene commits,
  las cinco carpetas de `tareas/`, la rama base (`develop`, o `rama_base`) y la
  principal (`main` o `master`), `origin` y el workspace. Sin `origin` es un aviso
  (un proyecto solo local es legítimo) y pasa a error con `cierre_por_defecto:
  merge-request`; un workspace sucio es un aviso. El workspace se mira con
  `GIT_OPTIONAL_LOCKS=0`, así que no toma `index.lock`; un fallo por bloqueo es aviso.
- **Config**: `.taskcode/config.yml` con el mismo validador que el resto de comandos
  (un valor inválido es error con su mensaje; una clave desconocida, aviso).
- **Verificación selectiva** (`verificacion-selectiva`): con `comando_verificacion`
  y sin `comando_verificacion_selectiva`, `aviso` con el arreglo en la misma
  línea; con las dos, `ok` (con `rutas_verificacion_parcial`, dice que `finish`
  puede integrar con la selectiva y un merge a mano no). Con
  `rutas_verificacion_parcial` y sin `rutas_documentacion`, `aviso`: la clave no
  tendría efecto. Sin completa no dice nada.
- **Verificación**: si la config declara `comando_verificacion` (ver abajo), `ok`
  con el comando y su timeout. Sin él, depende de si el proyecto tiene tests en
  su raíz:
  - **Con tests detectables**: `aviso`, con el comando propuesto listo para pegar
    en la config. Los frenos no actúan aunque haya con qué verificar. Detecta
    `package.json` con script `test` propio (`pnpm`, `yarn` o `npm` según el
    fichero de bloqueo; el `test` que deja `npm init` no cuenta), `Cargo.toml`,
    `pom.xml` y `build.gradle(.kts)` (con `mvnw`/`gradlew` si existen),
    `*.csproj`/`*.sln`, `go.mod` y `pyproject.toml` que mencione pytest. Si hay
    varios, propone sus comandos encadenados con `&&`.
  - **Sin tests detectables**: `omitida`, con el arreglo en la misma línea. Un
    proyecto sin tests no está mal configurado.

  Solo mira la raíz (desde ahí se ejecuta el comando): un manifiesto en una
  subcarpeta no cuenta. `doctor` no ejecuta el comando ni escribe la config.
- **Tareas**: cada `tarea.md` se lee y valida, y su `estado` tiene que ser el de
  su carpeta. Son errores, con el ID: un ID en dos carpetas, un `tarea.md` ilegible
  (con la ruta y la causa), una carpeta de tarea sin `tarea.md`, un estado distinto
  de la carpeta.
- **Plataforma**: solo si la config pide merge request por defecto o declara
  `plataforma_remota`: `gh`/`glab` instalado y con sesión (sin subir nada; espera
  como máximo 10 s). CLI no instalado o sesión rechazada es error; no poder
  verificarlo (timeout, sin red) es aviso; si no aplica, `omitida`. Nunca imprime
  la URL de `origin` con credenciales.
- **Hooks** (`hooks-subagente`): los hooks `PreToolUse` que alcanzan a los
  subagentes (ver «Problemas conocidos»). Como mucho, aviso.
- **Versión del plugin** (`version-plugin`): compara la versión del plugin que
  tiene instalada Claude Code (`installed_plugins.json`) con la de la copia local
  de su marketplace. Si la del marketplace es mayor, aviso con las dos versiones,
  la fecha de esa copia y los comandos para actualizar (`claude plugin marketplace
  update <marketplace>`, `claude plugin update taskcode-plugin@<marketplace>` y
  reiniciar Claude Code). No sale a la red: si la copia local no se ha refrescado,
  no ve versiones más nuevas. Si no puede comprobarlo (plugin no instalado por
  Claude Code, sin copia del marketplace, un JSON roto), `omitida` con el motivo.
  Nunca es error: no cambia el código de salida.
- **Status line** (`status-line`): si Claude Code tiene instalada la status line
  que muestra `taskctl estado` (ver «Progreso visible» abajo). Instalada, `ok`; si
  no, `omitida` con el comando que la instala. Sin flags nunca es aviso ni error.

`--json` escribe en stdout **solo** una línea de JSON
(`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
una skill la lea. `taskctl doctor` no commitea ni cambia de rama, y sin flags no
escribe nada. La única escritura es la de la status line, con su flag:

- `--instalar-status-line` la escribe en el `settings.json` **de usuario**
  (`~/.claude/settings.json`, o el de `CLAUDE_CONFIG_DIR`): una vez, para todos
  los proyectos. Conserva el resto de claves, deja una copia
  (`settings.json.<fecha>.bak`) y escribe con fichero temporal y renombrado. Es
  idempotente. El comando es `taskctl estado --stdin` si `taskctl` está en el
  PATH del sistema. Si solo está en la carpeta del plugin (la que Claude Code
  añade al PATH de su herramienta Bash), usa esa copia con `node` y su ruta
  absoluta: como la ruta lleva la versión del plugin, tras actualizarlo hay que
  repetir `--instalar-status-line`, que la reescribe con la ruta nueva (para no
  depender de eso, pon `taskctl` en el PATH; ver «Usar `taskctl` fuera de
  Claude Code»). Si ya hay otra status line, no la toca.
- `--reemplazar-status-line` (junto al anterior) sustituye una status line
  ajena; la anterior se guarda en `statusline-previa-taskctl.json`.
- `--desinstalar-status-line` quita la de `taskctl` (una ajena no se toca) y
  devuelve la que hubiera antes.

Con cualquiera de ellos, si lo pedido no se puede hacer la comprobación sale como
`error` y el código de salida es 1.

#### Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`

Mientras `plan`, `approve`, `start`, `review`, `finish` o el freno de fin de turno
trabajan, cada uno deja en `.git/taskcode/progreso.json` (fuera del árbol de
trabajo: no cambia la huella de la verificación) la tarea, la fase, sus pasos
declarados de antemano, el paso en marcha y el instante de inicio, y lo marca
terminado al acabar, también si aborta. Escribirlo no añade ninguna salida a
ningún comando ni hook (lo que se imprime lo lee el agente y cuesta tokens) y
nunca hace fallar el comando: si no se puede escribir, se pierde ese tic.

`taskctl estado` lo muestra en una línea, leyendo solo esos ficheros, sin lanzar
`git` ni leer `tareas/`:

```
TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min
```

La fase con su posición en el ciclo (plan, approve, start, review, finish), la
ronda si es una revisión, el paso con su posición dentro de la fase, el `x/N`
del comando de verificación si lo escribe, y los minutos desde que empezó la
fase. Los pasos: `plan` guardas, brainstorm, commit; `approve` guardas, plan,
commit; `start` guardas, rama, commit; `review` guardas, integracion,
verificacion, peticiones, commit; `finish` puertas, verificacion, cobertura,
held-out, merge, artefactos; el freno de fin de turno no es una fase del ciclo y
va sin posición, con un único paso (`verificacion`, o `verificacion selectiva` /
`verificacion documentacion`): `TASK-110 · freno · verificacion (1/1) · 0 min`.
Sin nada en marcha dice `Nada en marcha.` (o la última fase y si terminó, abortó
o, en el freno, terminó `en rojo` porque la verificación falló); fuera de
un repo con `tareas/` o `.taskcode/` no imprime nada. Sale siempre con 0.
`--stdin` toma el directorio del JSON que Claude Code pasa a la status line.
`--seguir` refresca cada segundo hasta que la fase termina; sin terminal imprime
una sola línea y sale, para que un agente que lo lance no se quede esperando.

La status line de Claude Code (`taskctl doctor --instalar-status-line`) ejecuta
`taskctl estado` en cada refresco: el estado se ve sin preguntar al agente, y no
entra en su contexto. Se ve también en la app de escritorio y por Remote Control.

`TASKCTL_PROGRESO`: el comando de verificación (`comando_verificacion`, la
selectiva y la de documentación, en `finish`, en las rondas de `review` y en el
freno) recibe en esta variable la ruta de un fichero bajo `.git/`. Si escribe en
él una línea `x/N` (la última con texto cuenta), `taskctl estado` la muestra en
el paso de verificación. Es opcional: sin escribir nada, la línea muestra el
paso sin `x/N`. Solo lo recibe ese comando: no lo heredan los scripts de
Git-Flow ni el de held-out, y un `TASKCTL_PROGRESO` que ya estuviera en el
entorno se sustituye. De lo que se escriba solo se muestran los números.

## `taskctl metricas`

`taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
con la duración de calendario de cada fase (diseño = plan→start, curso =
start→primer review, revisión = primer review→finish), las rondas de
revisión, el día de cierre y el origen del dato: la tabla `## Transiciones`
del `tarea.md` (cuya columna `fecha` lleva el instante UTC al segundo desde
la 0.5.0; las filas antiguas, solo el día, dan la duración en días), o, si
la tarea no la tiene, los commits automáticos `chore(TASK-NNN): ...` con un
único `git log`; si tampoco, «—». Las pausas se descuentan: cada `taskctl
pausa` cuenta desde su fila hasta la siguiente transición que no sea otra
pausa, y se resta de la fase (y del total) en la que cae. Una pausa sin
transición detrás (tarea abierta) no descuenta, y con duraciones en días
tampoco. Lo descontado sale, por tarea, en la lista `pausas` de `--json`
(`enPausa`).
`--heuristica` añade a las tareas terminadas con informes de revisión la
puntuación y el nivel de la heurística de complejidad vigente, más un
resumen de rondas medias por nivel declarado y heurístico: es la tabla con
la que se calibra `scripts/heuristica-complejidad.yml`.

`taskctl metricas --tokens` añade las columnas de coste en tokens por fase
(`tok_diseno`, `tok_curso` = implementación, `tok_revision`, `tok_total`; «—»
si no hay dato, que no es 0) y, debajo, un resumen por sprint y por
complejidad declarada: tareas con dato / total, suma y media por fase y el %
de cada fase sobre el total. Las tareas sin ningún dato salen en la tabla y no
entran en el resumen. Se combina con `--heuristica` (el resumen es entonces
sobre la muestra). `taskctl metricas --tokens --escribir` regenera en
`docs/METRICAS.md` solo el bloque entre `<!-- taskctl metricas --tokens: inicio -->`
y `<!-- taskctl metricas --tokens: fin -->` (si no están, los añade al final;
el resto del fichero, CRLF incluido, no cambia ni un byte) y no lo commitea,
como `board --escribir`. No se combina con `--heuristica`.

**Columnas de la tabla por tarea.** `id`, `complejidad`, `diseno`, `curso`,
`revision` (duraciones), `rondas` (número de la última ronda con informe; «—»
sin revisión), `crit`, `imp`, `men` (hallazgos CRÍTICO, IMPORTANTE y MENOR de
todos los informes `informe-revision-N[-<revisor>].md`, cada uno **una vez por
tarea** con clave revisor + ID), `hall_origen` (implementación/plan/
especificación/sin clasificar, de la columna `Origen`), `cierre` (día del último
`finish`) y `origen` (`registro`, `git` o «—»). Un informe sin tabla de hallazgos
deja `crit`/`imp`/`men`/`hall_origen` en «—»: sin dato, no cero. Con `--tokens`,
además `tok_diseno`, `tok_curso`, `tok_revision`, `tok_total` y el desglose de
`## Coste`: `tok_nuevos` (entrada + escritura de caché + salida),
`tok_cache_lect` (lectura de caché, aparte) y `tok_sin_desglose`
(`tokens_<fase>` menos lo desglosado; un negativo no se recorta a 0 y la celda
lleva `*`). Con varios `--repo`, la tabla abre con la columna `proyecto`.

Bajo la tabla: cuántos informes no tienen tabla de hallazgos, la mediana de
lecturas por fase y las **terminadas sin coste** en alguna fase, con el recuento
por fase y las 10 primeras («y N más»; la lista completa sale en `--json`).

**Avisos** (por stderr, con `[AVISO]`; ninguno cambia el código de salida ni
impide `--escribir`, salvo un `tarea.md` inválido): `tarea.md` inválido (la
tarea no aparece), `git log` que no se pudo consultar, `tokens_<fase>` vacío con
filas en `## Coste`, desglose mayor que el total, un agente repetido en una
fase de `## Coste` (salvo las filas de diferencia de un agente reanudado, ver
`registrar-coste`), una severidad fuera de vocabulario (con la tarea y el
fichero) e informes sin tabla de hallazgos. Con varios repos, cada tarea se
nombra `proyecto/TASK-NNN`.

**Varios proyectos: `--repo <ruta>`** (repetible; relativa al directorio actual;
por defecto, el repo actual). Junta varios repos con la clave (proyecto, id): un
mismo `TASK-NNN` en dos repos no mezcla datos. El proyecto es el nombre de la
carpeta. Antes de leer nada aborta si una ruta no existe, no tiene `tareas/`,
`--repo` va sin valor o dos carpetas distintas se llaman igual; la misma carpeta
escrita dos veces (otra grafía, otras mayúsculas en Windows) se lee una vez, con
aviso. Por stderr sale `Repos leidos: <proyecto> (N tareas, <ruta>); ...`. Con un
solo repo, stdout es el de siempre. `--repo` con `--escribir` aborta sin tocar
nada.

**`--evolucion [--tramo N]`** sustituye la tabla por la evolución de las tareas
terminadas: ordenadas por día de cierre (solo el día; desempate por proyecto y
por número de ID, `TASK-99` antes que `TASK-100`) y en tramos de N (20 por
defecto; `--tramo` exige un entero de 1 o más). Por tramo: tareas, días de
cierre, mediana de minutos de plan a finish (de las que tienen hora en las dos
marcas; las de solo día se cuentan en «solo dia»), rondas medias, hallazgos
IMPORTANTE por tarea, tokens de revisión medios y KB medios de la petición de
revisión por ronda. Cada cifra lleva su `n` (las tareas que tienen ese dato);
«— (n=0)» es que ninguna lo tiene. Dice cuántas terminadas quedan fuera por no
tener fecha de cierre (por proyecto con varios repos). Al final de cada fila,
el coste fijo por tarea frente al tamaño del proyecto: `cerradas` (tareas
cerradas con fecha de cierre al acabar el tramo) y las medianas de minutos de punta a punta, de la
fase de revisión y del propio `finish` (de las tareas con hora). Una línea
final compara el primer tramo con el último (el último completo, si hay dos o
más) y dice si ese coste **crece**, **baja** o **se mantiene** (cambio de
menos del 15 %): si crece con las tareas cerradas, algún paso de cada tarea
está pagando el tamaño del proyecto.

**`--grupos`** sustituye la tabla por grupos de tareas terminadas: por tipo, por
complejidad declarada, por número de criterios (0-4, 5-6, 7 o más), por KB de
petición de revisión por ronda (terciles calculados con todos los proyectos
juntos, cortados por valor; las tareas sin petición quedan fuera y se cuentan) y
por proyecto. Por grupo: tareas, con revisión, % aprobado a la primera (una sola
ronda con veredicto `aprobada` o `aprobada-con-correcciones`, sobre las que
tienen revisión), rondas medias, CRÍTICO+IMPORTANTE por tarea (de las que tienen
tabla de hallazgos) y, aparte, las tareas sin revisión y las revisadas sin tabla
de hallazgos. Los grupos son fijos: uno sin tareas sale con 0 y «—».
`--evolucion` y `--grupos` se combinan entre sí y con `--repo`, no con
`--heuristica`, `--tokens` ni `--escribir`.

**`--por-version`** (desde la 0.12.0) agrupa las tareas terminadas por la
versión de `taskctl` con la que se cerraron: la de la columna `version` de la
última fila `finish` de `## Transiciones` (un `finish` abortado y reintentado
con otro plugin deja dos; cuenta el último). Por versión, en orden semver
(0.9 antes que 0.10; una pre-release como `0.12.0-dev` antes de su release):
tareas, con revisión, % aprobado a la primera, rondas medias, tokens medios por
fase (con su `n`) y una segunda tabla con los hallazgos por severidad y por
origen (de las tareas con tabla de hallazgos). Las tareas sin versión anotada
(cerradas antes de la 0.12.0, medidas con los commits o con la celda editada a
mano) van a un grupo «sin version» aparte: la versión **nunca se deduce por la
fecha de cierre**. Se combina como `--evolucion` y `--grupos`.

**La columna `version` de `## Transiciones`.** Desde la 0.12.0 cada transición
anota la versión de `taskctl` que la escribió, como quinta columna. Las filas
anteriores, de cuatro columnas, se siguen leyendo igual (y siguen congelando el
modo). La primera fila con versión que se añade bajo una cabecera de cuatro
columnas cambia **solo la cabecera y su separador** a cinco, para que la
versión se vea en GitHub y GitLab; las filas viejas no se tocan. Un `taskctl`
anterior a la 0.12.0 no reconoce las filas de cinco columnas y deja de ver el
modo congelado de esa tarea: **usa la misma versión del plugin en todo el
repo**. Para que la versión anotada sea útil, se sube al **abrir** el ciclo de
una versión nueva (la primera tarea que la construye), no al publicarla.

**`--json`** escribe en stdout un único objeto JSON
(`{proyectos: [{proyecto, ruta, tareas}], sinCoste: {terminadas, total, porFase,
tareas}, evolucion?, grupos?, porVersion?}`), también sin tareas; los avisos y la lista de
repos van por stderr. Cada `null` va junto a un `n: 0` en el mismo objeto; nunca
`NaN`. `porVersion` es `{terminadas, versiones: [...], sinVersion}`, con cada grupo
en la forma `{version, n, conRevision, aprobadasPrimera, pctAprobadaPrimera,
rondasMedia, sinRevision, conHallazgos, sinTablaHallazgos, hallazgosPorSeveridad,
hallazgosPorOrigen, tokens: {diseno, implementacion, revision}}` (cada fase
`{suma, conDato, media}`). Solo se combina con `--repo`, `--evolucion`, `--tramo`,
`--grupos` y `--por-version`: con
cualquier otro flag aborta sin leer ni escribir nada.

En cualquier comando de `taskctl`, un flag repetido que no admite repetición
(todos salvo `--repo`, `--agente` y `--criterio`) aborta con error en vez de
quedarse con el último valor.

## `taskctl registrar-coste`

`taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision
(--agente <id>... | --tokens N) [--push]` **suma** al coste de esa fase
(`tokens_diseno`, `tokens_implementacion`, `tokens_revision` del `tarea.md`;
`null` = sin registrar y solo cuenta como 0 al sumar). `taskctl` no ve el
consumo del agente, así que lo registra quien lo ve. **La cifra que Claude Code
muestra al terminar un subagente no es lo que ha gastado: es el tamaño de su
contexto final.** Con `--agente <id>` (repetible; el `agentId` que devuelve la
herramienta Agent) `taskctl` lee la transcripción del subagente en
`<config>/projects/*/*/subagents/agent-<id>.jsonl` (`<config>` = `CLAUDE_CONFIG_DIR`
o `~/.claude`) y suma, por `message.id` único (la última aparición), entrada +
escritura y lectura de caché + salida de cada llamada. Varios `--agente` van en
un solo registro y un solo commit. Un `--agente` ya anotado en `## Coste` de esa
fase es un agente reanudado (su transcripción acumula los dos trabajos): se suma
solo lo que creció su transcripción desde lo ya anotado para ese id, y la fila lo
marca en su fuente (`agente:dif:<id>`), que `metricas` no avisa como repetida; si
no ha crecido, o el id está anotado junto a otros en una misma fila, aborta.
En `--fase revision` cada `--agente` va en **su propia fila** (en el mismo
commit), con las columnas `ronda` y `revisor` que se deducen de su
transcripción. Se sacan del nombre `peticion-revision-N[-skill].md` que lleva
el prompt del revisor. Lo que no se puede deducir queda como `-` («sin
atribuir»). Con un único `--agente`, `--ronda N [--revisor <skill>]` los
declara a mano; el revisor se valida contra las peticiones de `revision/`.
Las filas antiguas de 9 columnas se siguen leyendo. `metricas --tokens` las
resume, por ronda y revisor, en un bloque aparte, también en `--json`: las
lecturas, los tokens de entrada y caché, y los CRÍTICO e IMPORTANTE de su informe.
`--tokens N` da una cifra a mano (la parte del
orquestador, estimada) y se excluye con `--agente`. Si el id no se encuentra, está
en más de una sesión o la transcripción no trae `usage`, aborta diciendo qué hacer
(`--tokens N` como salida). Funciona en cualquier estado, también `terminada`;
escribe y commitea solo ese `tarea.md` (aborta si tiene cambios sin commitear o si
la copia al día de la tarea está en su rama) y rechaza cifras de 0. `taskctl finish`
avisa, sin bloquear, si falta el coste de diseño o de revisión. El de
implementación ya no hace falta registrarlo a mano: lo suma `review` (ver
«Coste de implementación automático»); `registrar-coste --fase implementacion`
queda como respaldo.
