# Changelog

## Sin publicar

Metricas v2, parte C (TASK-065): agregados de la fila de metricas para elegir
mejoras por cifras, sobre uno o varios proyectos.

- `taskctl metricas --repo <ruta>` (repetible; por defecto el repo actual)
  junta varios repos con la clave (proyecto, id): un mismo TASK-NNN en dos
  repos no mezcla datos, y avisos y listas los nombran `proyecto/TASK-NNN`. Las
  rutas se validan antes de leer (inexistente, sin `tareas/`, sin valor, dos
  carpetas con el mismo nombre abortan; la misma carpeta repetida se lee una
  vez). Con un solo repo stdout no cambia. `--repo` con `--escribir` aborta.
- `--evolucion [--tramo N]`: las terminadas por dia de cierre (desempate por
  proyecto y numero de ID) en tramos de N (20 por defecto), con la mediana de
  minutos de plan a finish, rondas medias, IMPORTANTE por tarea, tokens de
  revision y KB de peticion de revision por ronda, cada cifra con su n. Dice
  cuantas quedan fuera sin fecha de cierre.
- `--grupos`: por tipo, complejidad, criterios (0-4, 5-6, 7+), terciles de KB
  de peticion por ronda (con todos los proyectos juntos) y proyecto, con %
  aprobado a la primera (una ronda, `aprobada` o `aprobada-con-correcciones`),
  rondas medias y CRITICO+IMPORTANTE por tarea; las tareas sin revision o sin
  tabla de hallazgos se cuentan aparte. Un grupo vacio sale con 0.
- `--json`: un unico objeto `{proyectos, sinCoste, evolucion?, grupos?}`, tambien
  sin tareas, sin NaN y con cada null junto a un n 0; solo se combina con
  `--repo`, `--evolucion`, `--tramo` y `--grupos` (con otro flag aborta sin
  leer ni escribir nada).
- La lista de terminadas sin coste da el recuento por fase y las 10 primeras
  («y N mas»; completa en `--json`) (MEN-4 de TASK-064). El README del plugin
  documenta columnas, avisos y flags de `metricas`.
- Un flag repetido que no admite repeticion aborta con error en cualquier
  comando (antes se quedaba el ultimo valor); `--repo` y `--agente` usan el
  mismo lector de flags repetibles.
- `registrar-coste --agente <id>` con un id ya anotado en `## Coste` de esa
  fase (un agente reanudado, cuya transcripcion acumula los dos trabajos)
  registra solo la diferencia entre la transcripcion y lo ya anotado para ese
  id, campo a campo, en una fila con fuente `agente:dif:<id>`; `metricas` no
  la avisa como repetida. Sin crecimiento, o con el id anotado junto a otros en
  una misma fila, aborta sin tocar nada. Ajusta la regla de MEN-2 de TASK-063.

- TASK-064 (feature) — Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas (2026-10-25)

Metricas v2, parte B (TASK-064): `taskctl metricas` lee lo que capturo
TASK-063 y enriquece la fila de cada tarea. La evolucion por tramos, los
grupos, `--repo`, `--json` y la linea base quedan para TASK-065.

- Columnas nuevas `crit`, `imp`, `men` y `hall_origen`
  (implementacion/plan/especificacion/sin clasificar): los hallazgos de todos
  los informes de revision, `informe-revision-N.md` e
  `informe-revision-N-<revisor>.md`, contados una vez por tarea con clave
  revisor + ID. La severidad y el origen se fusionan campo a campo: cada uno
  es el de la ultima ronda en que esta reconocido, asi que una ronda que
  relista un hallazgo sin Origen no borra el de la anterior. El mismo ID en un
  informe sin sufijo y en otro con sufijo de revisor cuenta como dos (no se
  sabe que sea el mismo revisor). La fila-marcador «sin hallazgos» (ID
  `(ninguno)`, Estado `sin hallazgos`, o ID y severidad en blanco o «—») no
  es un hallazgo. Un informe sin tabla de hallazgos deja la tarea en «—» (sin
  dato, no cero); la salida dice cuantos hay y lo avisa.
- La severidad se reconoce por su primera palabra, sin distinguir
  mayusculas, tildes ni enfasis (`Importante`, `Crítico`, `menor`,
  `IMPORTANTE (no verificado)`); una fuera de vocabulario (`Alta`,
  `Major`, vacia) sale como aviso con la tarea y el fichero y no cuenta en
  `crit/imp/men`. `leerHallazgos` expone `severidadReconocida`.
- Bajo la tabla: la mediana de lecturas por fase de las tareas cuya tabla
  `## Coste` las mide, y la lista de tareas terminadas sin coste (vacio o 0)
  en alguna fase.
- `--tokens` anade `tok_nuevos` (entrada + escritura de cache + salida),
  `tok_cache_lect` y `tok_sin_desglose` (`tokens_<fase>` menos lo desglosado).
  Un negativo en una fase no se recorta a 0: sale con aviso y la celda lleva
  `*` aunque la suma sea positiva. Con solo filas `manual`, `tok_nuevos` y
  `tok_cache_lect` salen «—» (no medido), no 0. Un agente repetido en la
  misma fase (MEN-2 de TASK-063) se avisa y no se deduplica; las filas
  `manual` no cuentan como repetidas. El bloque de `docs/METRICAS.md` no
  cambia de forma, y los avisos no impiden `--escribir`.
- Test de una fila valida dentro de un bloque de codigo en una seccion
  `## Coste` real, que `leerCostes` no cuenta (MEN-1 de TASK-063).

- TASK-063 (feature) — Metricas v2 (A): capturar desglose de coste, lecturas y origen de hallazgos (2026-10-25)

Metricas v2, parte A (TASK-063): se capturan los datos que faltaban para
decidir mejoras con cifras. Solo captura y cambia formatos; `taskctl metricas`
los leera en TASK-064.

- `taskctl registrar-coste` deja ademas una fila en una tabla nueva `## Coste`
  del cuerpo de `tarea.md` (`fecha | fase | fuente | entrada | cache_escritura |
  cache_lectura | salida | lecturas | total`), en el mismo commit que suma el
  total a `tokens_<fase>`. Con `--agente`, el desglose sumado de sus
  transcripciones (`fuente` = `agente:<id>[,<id>...]`); con `--tokens N`, una
  fila `manual` con solo el total y `-` en el resto. Las tareas sin tabla
  siguen siendo validas.
- `lecturas`: cuantos `tool_use` de lectura hizo el agente, sin repetir id. Son
  lectura Read, Grep, Glob y una lista cerrada de herramientas MCP de lectura o
  busqueda (`HERRAMIENTAS_LECTURA` en `src/core/coste-transcripcion.ts`), y Bash
  con un comando que empieza por `cat`, `head`, `tail`, `grep`, `rg`, `find`,
  `ls` o `sed -n`. Es heuristico a sabiendas.
- La plantilla del informe de `taskctl review` y las skills de revision llevan
  una columna `Origen` por hallazgo (`implementacion`, `plan` o
  `especificacion`) con la instruccion de rellenarla. `leerHallazgos` la lee,
  normalizada (minusculas, sin tildes); un valor fuera del vocabulario, la
  celda vacia o un informe antiguo sin la columna cuentan como `sin
  clasificar`.
- `taskctl finish` avisa tambien, sin bloquear, si la tarea se cierra con
  `tokens_implementacion` vacio o a 0.

## 0.7.0 — 2026-10-08

Merge request en cualquier GitLab y `taskctl doctor`. Requiere Node 22 o
superior. Actualizar con `claude plugin marketplace update
taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code (o
`/reload-plugins`). Despues, `taskctl doctor` en cada proyecto.

- TASK-062 (feature) — taskctl doctor: comprobar que un proyecto esta listo antes de trabajar (2026-10-08)
- TASK-062 (feature) — taskctl doctor: comprobar que un proyecto esta listo antes de trabajar (2026-10-08)

Nuevo `taskctl doctor [--json]` (TASK-062). Solo lee: no escribe, no commitea, no
cambia de rama; lo unico que sale a la red es la comprobacion de sesion de
`gh`/`glab`, con un timeout propio de 10 s.

- Una linea por comprobacion con su nivel (`ok`, `aviso`, `error` u `omitida`) y,
  en cada aviso o error, el comando o paso que lo arregla. Sale con 1 si hay
  algun error (los avisos no cuentan). `--json` da una sola linea de JSON
  (`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`) y
  nada mas en stdout, para que una skill la lea.
- Entorno: Node 22 o superior (tambien declarado en `engines` de package.json), `git` y un `bash` que ejecuta de verdad un script
  minimo con el mismo lanzamiento que los de Git-Flow (`mktemp`, `dirname`,
  `grep`...): en Windows detecta el bash de WSL (System32) y el de Git sin su
  `usr\bin` en el PATH, y dice como arreglarlo.
- Repo: repo Git (tambien un worktree), repo sin commits (mensaje propio), las
  cinco carpetas de `tareas/`, la rama base (`develop` o `rama_base`) y la principal
  (`main` o `master`), `origin` (aviso; error solo con `cierre_por_defecto:
  merge-request`) y workspace limpio (aviso; `git status` con
  `GIT_OPTIONAL_LOCKS=0`, que no toma `index.lock`).
- Config con el mismo validador de siempre (un valor invalido es error, una
  clave desconocida es aviso). Tareas con recorrido propio: un ID en dos
  carpetas, un `tarea.md` ilegible (con la ruta y la causa), una carpeta de tarea
  sin `tarea.md` o un `estado` distinto de su carpeta son errores con el ID.
- Plataforma: con `cierre_por_defecto: merge-request` o `plataforma_remota`
  declarada, `gh`/`glab` instalado y con sesion. CLI no instalado o sesion
  rechazada es error; no poder verificarlo (timeout, sin red) es aviso. Si no
  aplica, `omitida`. Nunca imprime la URL de origin con credenciales.
- La skill `task-workflow` manda ejecutarlo al empezar en un proyecto. Nuevo
  script `scripts/gitflow/_sonda-bash.sh` (la sonda). Sin cambios de comportamiento
  en `finish`: la comprobacion de sesion y la resolucion de la plataforma de
  origin se separaron en funciones que devuelven resultado, para reutilizarlas.

- TASK-061 (feature) — Merge request en cualquier GitLab, tambien autoalojado (2026-10-08)

Merge request en cualquier GitLab, tambien autoalojado (TASK-061).

- Dos claves nuevas en `.taskcode/config.yml`, que se leen desde la 0.7.0
  (una version anterior las trata como desconocidas):
  `plataforma_remota` (`github` | `gitlab`) y `url_base_remoto` (opcional,
  solo con `gitlab`: la URL https de la instancia, con su ruta si cuelga de
  una). Se validan juntas: la URL sin plataforma, con `github`, con usuario o
  contrasena (`@`) o sin https aborta, igual que una base que no sea prefijo
  exacto de la URL de `origin` si es https (host, puerto y ruta); con ssh o scp
  basta el mismo host y la ruta de la instancia se quita si esta (GitLab sirve
  ssh sin ella). Con
  solo `plataforma_remota: gitlab`, la base es `https://<host de origin>`.
- `taskctl finish --merge-request` con la plataforma declarada ya no adivina
  por el host: fija `GITLAB_HOST=<base>` en cada llamada a `glab` (sin heredar
  `GITLAB_HOST`, `GL_HOST`, `GITLAB_URI` ni `GITLAB_API_HOST` del entorno),
  deduce el proyecto (`grupo/subgrupo/repo`) quitando la base a la URL de
  origin y lo pasa con `-R`. Comprueba la sesion con `glab api user` (acepta
  `glab auth login --hostname <host/ruta>` o `GITLAB_TOKEN`; `auth status` no
  vale: ignora el token). Sin sesion, sin CLI o con la instancia inalcanzable
  aborta antes de subir nada. El token nunca se imprime ni se escribe. El MR
  se crea por la API (`glab api projects/<proyecto>/merge_requests`, campos
  `--raw-field`) y no con `glab mr create`, que aborta siempre con una
  instancia bajo una ruta (comprueba que un remoto de Git corresponda a
  `GITLAB_HOST` y solo compara el host). Con origin `http://host:puerto` y solo
  la plataforma declarada, aborta pidiendo `url_base_remoto`.
  Sin declarar nada rige la deteccion por host de la 0.6.0, sin cambios.
- **Cambio de comportamiento**: una clave desconocida en `.taskcode/config.yml`
  ya no aborta, avisa por stderr (`[AVISO] ... clave desconocida "x"; se
  ignora`, con la clave parecida si la hay) y se ignora. Un valor invalido en
  una clave conocida sigue abortando. Asi, una clave que anade una version
  nueva no deja sin `taskctl` a quien tenga una anterior desde esta version en
  adelante; las versiones anteriores a esta siguen abortando ante las claves
  nuevas.
- El segundo `finish` lee la config del arbol en el que se ejecuta: la config
  tiene que estar commiteada en la rama de la tarea y en la rama base.

## 0.6.0 — 2026-10-06

Coste en tokens por fase y opciones de cierre en `finish`. Actualizar con
`claude plugin marketplace update taskcode-marketplace`, `claude plugin
update taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code (o
`/reload-plugins`).

- TASK-060 (feature) — Opciones de cierre en finish: merge normal, merge request y tag (2026-10-06)
- TASK-023 (feature) — Métricas de coste en tokens por fase (2026-10-06)

Coste en tokens por fase (TASK-023).

- Nuevo `taskctl registrar-coste TASK-NNN --fase diseno|implementacion|revision (--agente <id>... | --tokens N)`: suma el coste de una fase en `tokens_diseno`, `tokens_implementacion` o `tokens_revision` del `tarea.md` (campos nuevos, `null` = sin registrar; las tareas anteriores siguen validando) y lo commitea. `--agente` lee la transcripcion de cada subagente (`projects/*/*/subagents/agent-<id>.jsonl` bajo `CLAUDE_CONFIG_DIR` o `~/.claude`) y suma lo gastado de verdad (entrada + cache + salida por llamada, ultima aparicion de cada `message.id`): la cifra que Claude Code muestra al terminar un subagente es su contexto final, no su coste. Funciona en cualquier estado; rechaza 0.
- `taskctl metricas --tokens`: columnas de tokens por fase y resumen por sprint y por complejidad declarada (tareas con dato / total, suma, media y % por fase). `--tokens --escribir` regenera el bloque delimitado por marcadores HTML de `docs/METRICAS.md` sin tocar el resto del fichero.
- `taskctl finish` avisa, sin bloquear, si falta el coste de diseno o de revision. `taskctl new` escribe los tres campos a `null`.
- La skill `task-workflow` (referencia `coste.md`) y las de fase `plan`, `start`, `review` y `finish` piden registrar cada subagente de la fase con `--agente <id>`.

Opciones de cierre en `taskctl finish` (TASK-060).

- **Aviso de compatibilidad**: `.taskcode/config.yml` admite una clave nueva,
  `cierre_por_defecto` (`merge` | `merge-request`, opcional, por defecto
  `merge`). Una version anterior del plugin aborta ante una clave que no
  conoce, en TODOS los comandos, asi que quien la escriba obliga a que todo el
  equipo actualice a la vez (mismo caso que la 0.5.0). Sin la clave no cambia
  nada.
- `taskctl finish TASK-NNN --tag <nombre>`: tag anotado (mensaje = titulo de la
  tarea) sobre el commit de merge. Se valida antes de mergear (nombre valido,
  sin existir en local ni en origin); solo se sube con `--push`. En hotfix y
  release `--tag` da el nombre al tag que ya ponia el script
  (`merge-hotfix-to-main.sh` y `merge-release-to-main.sh` aceptan `--tag`):
  sigue habiendo uno solo.
- `taskctl finish TASK-NNN --merge-request` (feature y fix): sube la rama, abre
  un PR (`gh`, origin en github.com) o MR (`glab`, host con "gitlab") contra la
  rama base y deja la tarea en `en-revision` con su URL anotada. Un segundo
  `finish` consulta el estado a la plataforma por nombre de rama y, si esta
  mergeado (merge, squash o rebase), cierra la tarea; si no, aborta sin tocar
  nada. Host desconocido, CLI sin instalar o sin sesion abortan antes de subir
  nada.
- `taskctl siguiente --json` incluye `cierre`; la skill `finish` pregunta en
  manual y semiautomatico y en automatico usa `cierre_por_defecto`.

## 0.5.0 — 2026-10-05

Fase 6 del plan de la auditoria: suite, skill y telemetria. Actualizar con
`claude plugin marketplace update taskcode-marketplace`, `claude plugin
update taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code (o
`/reload-plugins`).

- **Aviso de compatibilidad**: la tabla `## Transiciones` de cada tarea
  guarda ahora el instante UTC (`2026-10-05T14:03:22Z`) en la columna
  `fecha`. Una version anterior del plugin no reconoce esas filas: no veria
  el modo de flujo congelado y caeria al de la config. Todo el equipo debe
  pasar a la 0.5.0 a la vez.
- `taskctl metricas [--heuristica]`: duracion de diseno, curso y revision,
  rondas y cierre por tarea, desde `## Transiciones` o, en tareas antiguas,
  desde los commits del ciclo.
- Heuristica de complejidad recalibrada con las tareas cerradas
  (`nivel_trivial_hasta` 1 → 0) y sin las claves que nada leia
  (`tolerancia_*`, `modelo_consulta_discrepancia`). Un YML de heuristica
  editado a mano con esas claves aborta: reinstala el plugin.
- Skill `task-workflow` de 22 a 13 KB (referencias que se leen bajo demanda);
  lo comun de las cuatro revisoras vive en un solo sitio, con la tabla del
  veredicto corregida; descripciones de 300 caracteres o menos.
- `plugin.json` con `displayName`, `repository`, `license` (MIT) y
  `keywords`; LICENSE MIT. Los agentes de brainstorm no fijan `model:`.
- Desarrollo: `npm run test:rapido` (core y cli, segundos) y la suite
  completa un 31 % mas rapida.

- TASK-052 (feature) — F6-T5 Telemetria de fases y heuristica recalibrada (2026-10-05)
- TASK-049 (feature) — F6-T4 Metadatos del plugin y modelo de los agentes (2026-10-05)
- TASK-048 (feature) — F6-T3 Skill de flujo mas ligera (2026-10-05)
- TASK-051 (feature) — F6-T2 Partir los ficheros de test mas largos (2026-10-05)
- TASK-050 (feature) — F6-T1 Suite rapida y repo plantilla en los tests (2026-10-05)

## 0.4.0 — 2026-10-05

Fase G (el plugin conduce el ciclo) y fase 5 del plan de la auditoria. Sube
la version menor por las fases invocables y porque **un flag desconocido
ahora aborta**. Actualizar con `claude plugin marketplace update
taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code.

- Fases como skills (`/taskcode-plugin:<fase>`) y `taskctl siguiente`, que
  decide el paso. `modo_flujo` manual / semiautomatico / automatico, congelado
  en la tarea; registro `## Transiciones`, `taskctl pausa` y cadena con
  bloqueo por arbol. El automatico para en hotfix/release antes de `finish`,
  al tope de 3 rondas y en sus guardas.
- `taskctl` desde cmd (`bin\taskctl.cmd`) y desde PowerShell (funcion de
  perfil del README).
- `rama_base` de punta a punta.
- **Un flag mal escrito aborta** con la lista de flags validos y el mas
  parecido (`--complejida` → `--complejidad`), en todos los comandos. Los
  booleanos (`--push`, `--json`, `--forzar`, `--escribir`) no aceptan
  `=valor`.
- La salida de `review` separa el agente que se lanza y su modelo
  (`agente_revisor`, `modelo_sugerido`) de la skill revisora que carga.
- Las rutas no ASCII (y las de glob, como `pages/[id].vue`) llegan con su
  diff a la peticion de revision de su dominio.

- TASK-054 (fix) — Rutas no ASCII en el diff de revision fragmentado por dominio (2026-10-05)
- TASK-047 (fix) — F5-T3 Flags desconocidos y mensajes de review (2026-10-05)
- TASK-059 (feature) — Flujo E: modo automatico (2026-10-05)
- TASK-058 (feature) — Flujo D: modo semiautomatico (2026-10-04)
- TASK-057 (feature) — Flujo C: fases como skills invocables en modo manual (2026-10-04)
- TASK-056 (feature) — Flujo B: nucleo determinista del siguiente paso y registro de transiciones (2026-10-04)
- TASK-055 (feature) — Flujo A: taskctl desde PowerShell y cmd (2026-10-04)
- TASK-045 (fix) — F5-T1 rama_base de punta a punta (2026-10-04)
## 0.3.0 — 2026-10-04

Fase 4 del plan de la auditoria: **tareas mas concretas y acotadas**. Sube la
version menor porque cambia la complejidad por defecto y lo que `plan`
acepta. Actualizar con `claude plugin marketplace update
taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code.

- `taskctl new` acepta `--objetivo`, `--criterio` (repetible) y `--desde`.
- `taskctl plan` valida el enunciado antes de mover nada: bloquea objetivo
  vacio, sin criterios, un criterio vacio, mas de 12 criterios o criterios
  hechos solo de palabras vagas; avisa con 9 a 12 y con criterios sin nada
  comprobable. **Las tareas ya creadas sin Objetivo tienen que redactarlo
  antes de su `plan`.**
- Con mas de 12 criterios agrupados por frente, `plan` deja fuera del repo
  una particion lista para `taskctl import` (una tarea por frente, con los
  criterios comunes copiados) y da el comando exacto.
- `taskctl import`: las lineas `> texto` bajo el `###` y antes de los
  criterios son el Objetivo de la tarea.
- `approve` rechaza el `plan-final.md` sin rellenar; `finish` avisa antes del
  merge de los criterios sin marcar.
- Sin `--complejidad`, la tarea nace con `complejidad: null` y el numero de
  roles lo decide la heuristica (antes, `media` por defecto: 2 roles casi
  siempre). Con 1 rol no hay unificador: una sola `peticion-plan-N.md` cuya
  respuesta es el plan.
- Subtitulos `###` dentro del Objetivo y de los criterios ya no cortan la
  seccion; criterios en varias lineas en `import`.
- `finish` reintenta el rename ante un `EPERM`/`EBUSY` transitorio de Windows.

- TASK-044 (feature) — F4-T3 Particion propuesta de las tareas grandes (2026-10-04)
- TASK-042 (feature) — F4-T4 Complejidad por defecto por heuristica y un rol sin unificador (2026-10-04)
- TASK-043 (feature) — F4-T2 Validacion antes de plan y puertas de cierre (2026-10-04)
- TASK-046 (fix) — F5-T2 Secciones con subtitulos y criterios multilinea (2026-10-04)
- TASK-041 (feature) — F4-T1 taskctl new con objetivo y criterios (2026-10-04)
- TASK-053 (fix) — moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows (2026-10-04)

## 0.2.0 — 2026-10-04

Fase 3 del plan de la auditoria: **revision incremental**. Sube la version
menor porque cambia la maquina de estados. Actualizar con `claude plugin
marketplace update taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code.

- `taskctl review` sobre una tarea en revision, con la ultima ronda en
  `cambios-solicitados`, genera la ronda siguiente: solo el diff desde el
  commit revisado en la ronda anterior, con los hallazgos aun abiertos de su
  tabla, y sin integrar la rama base (lo hace `finish`). Se acabaron las
  peticiones de ronda 2 escritas a mano.
- Mensajes de error que ya no dan vueltas: una ronda aprobada manda a
  `finish`, una PENDIENTE a `taskctl veredicto`, y `start` sobre una tarea en
  revision manda a `review`.
- `aprobada con correcciones` no abre otra ronda (politica: sin CRITICO ni
  IMPORTANTE, una ronda cierra).
- Nota: el tag `v0.2.0` se creo antes de este cierre por un `EPERM` transitorio
  de Windows en `finish`; el codigo del tag es el de esta version y esta
  seccion se escribio en el commit siguiente.


- TASK-040 (feature) — F3-T1 taskctl review para la ronda 2 y siguientes (2026-10-04)

## 0.1.3 — 2026-10-04

Fase 2 del plan de la auditoria: **Git-Flow mas rapido**. Actualizar con
`claude plugin marketplace update taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code.

- El log de los scripts de Git-Flow ya no lanza un `date` ni un subshell por
  linea (bash >= 4.2; en bash 3.2 se mantiene `date`): `update-feature.sh`
  ~26 % mas rapido.
- Una sola consulta a `origin` por invocacion, con limite de 5 s
  (`GF_TIMEOUT_REMOTO`) y sin esperar credenciales: con la VPN caida,
  `update-feature.sh` pasa de ~23 s a ~7 s. El merge a `develop` con origin
  configurado pero caido avisa de que `develop` puede estar desfasada.
- `push-back-to-remote.sh --mirror` aborta si no puede listar el destino, en
  vez de mostrar una vista previa vacia y borrar ramas.
- Los commits automaticos lanzan menos procesos `git` (ciclo completo: 115 → 96).


- TASK-039 (feature) — F2-T3 Menos llamadas git en los comandos (2026-10-04)
- TASK-038 (feature) — F2-T2 Una sola deteccion de origin por invocacion, con timeout (2026-10-04)
- TASK-037 (feature) — F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos (2026-10-04)

## 0.1.2 — 2026-10-03

Fase 1 del plan de la auditoria: **review mas barata**. Actualizar con
`claude plugin marketplace update taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code.

- La peticion de `taskctl review` ya no embebe el diff de `dist/`, lockfiles ni
  `tareas/` (aparecen en un `--stat` con la orden para pedirlos). Configurable
  con `excluir_de_revision` en `.taskcode/config.yml`. TASK-031 habria pasado de
  326 KB a ~72 KB, y una tarea de un solo dominio lanza un revisor, no dos.
- Nuevo `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`:
  escribe la linea canonica y la commitea. El gate de `finish` ignora el
  enfasis de markdown (`**aprobada**`), sin aflojar la regla.
- Politica de rondas en las skills: sin CRITICO ni IMPORTANTE, una ronda cierra;
  el revisor corre la suite completa una vez por ronda.
- **Compatibilidad:** un plugin anterior aborta al leer `excluir_de_revision`.
  No hace falta declararla para tener el comportamiento nuevo.


- TASK-036 (feature) — F1-T3 Veredicto con un comando e informe estructurado (2026-10-04)
- TASK-035 (feature) — F1-T2 Politica de rondas y una sola suite por ronda en las skills (2026-10-04)
- TASK-034 (feature) — F1-T1 Excluir lo generado del diff de revision (2026-10-04)

Registro de tareas terminadas. Lo actualiza taskctl finish; una linea
por tarea, renderizada desde su frontmatter.

## 0.1.1 — 2026-10-03

Version de correccion. **Para actualizar:** `claude plugin marketplace update
taskcode-marketplace`, despues `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code; `taskctl
--version` debe responder `0.1.1`.

- Nuevo: `comando_sincronizacion`, `rutas_sincronizacion` y
  `timeout_sincronizacion` en `.taskcode/config.yml`. Cada comando que commitea
  ejecuta el comando del proyecto y mete sus ficheros derivados (un plan, un
  tablero) en el mismo commit de la transicion. No usar un hook de pre-commit
  para esto: deja el indice sucio.
- Nuevo: codigo de salida **3** = la transicion se hizo pero la sincronizacion
  no se aplico (el aviso dice que lanzar a mano).
- Skill: guia de criterios que solo se verifican tras `finish`
  (`### Tras el cierre`) y correcciones (`codex-review` si existe).
- **Compatibilidad:** un plugin 0.1.0 aborta todos sus comandos al leer las
  claves nuevas. Todo el equipo actualiza ANTES de anadirlas.
- Incluye ademas todo lo cerrado desde 0.1.0:

- TASK-033 (fix) — Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1) (2026-10-03)
- TASK-022 (feature) — Documentación de equipo e incorporación de colaboradores (2026-09-16)
- TASK-020 (feature) — Comando taskctl codex-review (segunda opinión independiente) (2026-09-13)
- TASK-018 (feature) — Enrutado de revisor por diff real, fragmentado por dominio (2026-09-12)
- TASK-017 (feature) — Catálogo de skills determinista con selección en dos pasos (2026-09-09)
- TASK-016 (feature) — Brainstorm paralelo por roles con agente unificador (2026-09-08)
- TASK-032 (feature) — Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6) (2026-09-08)
- TASK-031 (fix) — Distribucion del CLI: un clon debe traer un taskctl que arranque (2026-09-07)
- TASK-030 (feature) — Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4) (2026-09-07)
- TASK-029 (fix) — Bug de origin sin guard y deuda de los scripts de Git-Flow (2026-09-07)
- TASK-028 (feature) — Primera skill del plugin: task-workflow/SKILL.md (2026-09-07)
- TASK-027 (feature) — Subcarpetas planificacion y revision en cada carpeta de tarea (2026-09-07)
- TASK-026 (feature) — Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge (2026-09-06)
- TASK-025 (fix) — El limite de WIP mira las ramas de trabajo, no el arbol activo (2026-09-06)
- TASK-024 (feature) — asignado_a por defecto desde la identidad Git (2026-09-06)
- TASK-015 (feature) — Límite de trabajo en curso por persona (2026-09-05)

- TASK-013 (feature) — Comando taskctl review (revisión por pares de un solo agente) (2026-09-05)
- TASK-014 (feature) — Comando taskctl finish (merge, cierre y actualización del tablero) (2026-09-05)

## Historico (Sprint 0 y 1)

Las 12 tareas de Sprint 0 y Sprint 1 se completaron ANTES de que existiera
taskctl finish, asi que estas lineas se anadieron a mano (item B4 del plan
de terminacion) con el mismo formato que genera el comando. Su trabajo real
vive en las ramas y commits de Git; siguen con estado planificada por la
paradoja de bootstrapping (ver CONVENCIONES.md y el item E4).

- TASK-001 (feature) — Scaffold del proyecto taskctl (plugin.json, bin/, tsconfig, test runner) (2026-09-03)
- TASK-002 (feature) — Modelo de tarea, parser de tarea.md y máquina de estados (2026-09-03)
- TASK-003 (feature) — Comando taskctl new (alta individual de tarea) (2026-09-03)
- TASK-004 (feature) — Comando taskctl import (alta masiva desde Markdown) (2026-09-03)
- TASK-005 (feature) — Comando taskctl board (listado por estado) (2026-09-03)
- TASK-006 (feature) — Empaquetado del plugin y validación de carga local (2026-09-03)
- TASK-007 (fix) — Spike: validar scripts Git-Flow (.sh) vía Bash tool en Windows/IntelliJ (2026-09-03)
- TASK-008 (feature) — Migrar scripts Git-Flow a scripts/gitflow/ del plugin (2026-09-03)
- TASK-009 (feature) — taskctl start: crea rama via create-tipo.sh y mueve tarea a en-curso (2026-09-03)
- TASK-010 (feature) — taskctl plan: version minima, un solo agente redacta plan-final.md (2026-09-03)
- TASK-011 (feature) — taskctl approve: checkpoint humano, marca plan_aprobado (2026-09-03)
- TASK-012 (feature) — Precondicion de rama base + workspace limpio (seccion 8.3), con auto-switch si esta limpio (2026-09-03)
