# Changelog

## Sin publicar

- TASK-100 (feature) — Verificacion proporcional A1: finish no corre la suite si la tarea solo cambia documentacion (2026-11-10)

## Siguiente version — sin publicar

Verificacion proporcional, parte A1 (TASK-100, primera de las tres en que se
trocea TASK-096). Claves nuevas opcionales `rutas_documentacion` (patrones
`git :(glob)`, sin anclar) y `comando_verificacion_documentacion`: si todo lo
que cambia la tarea frente a la base cae en esas rutas, `finish` no corre
`comando_verificacion`; solo la comprobacion de documentacion si se declara,
con su propio memo. Las rutas se leen de la config de la rama base, `tareas/`
cuenta siempre como documentacion, y ante la duda se corre la completa (diff
no calculable o vacio, mixto, renombre de codigo a documentacion con
`--no-renames`, cambio en `.taskcode/config.yml`, release). `finish` dice que
corrio y por que y lo anota en la seccion `## Verificacion de documentacion`
de la tarea; la puerta de cobertura no mide una tarea de solo documentacion.
Sin las claves, todo como en la 0.14.0. El guardian de merges (TASK-101) y el
freno Stop y `review` (TASK-102) siguen exigiendo o corriendo la completa.

## 0.14.0 — 2026-11-10

ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
`new`, `plan`, `approve` y `finish` (tras el merge) regeneran
`tareas/ROADMAP.md` dentro de su propio commit cuando este cae en la rama de
integracion: una tabla por hito (`sprint`) en orden de dependencias, con
complejidad y estado, y un resumen de lo que esta en marcha y lo listo para
empezar. En la rama de una tarea no se toca, asi que dos ramas en paralelo no
chocan en el. Sin fecha (regenerar sin cambios no da diff). Regla numero uno:
no pisa un ROADMAP ajeno. Solo escribe el fichero si lleva la marca de taskctl
en su tercera linea (`<!-- generado por taskctl; formato 1; no editar fuera de
la zona manual -->`, comparada entera) o si nunca ha existido en git; nunca si
esta en `rutas_sincronizacion`, si tiene cambios sin commitear (avisa) o si en
disco se llama con otras mayusculas. La zona manual (entre `<!--
manual:inicio ... -->` y `<!-- manual:fin -->`) se conserva byte a byte y sus
`### Hn — titulo` dan el titulo y el orden de los hitos. Generacion tolerante:
un ciclo de dependencias sale en su propia seccion y como aviso, y una
`tarea.md` ilegible deja el fichero como estaba; nada tumba una transicion.
Comando nuevo `taskctl roadmap [--comparar | --escribir]`: sin flags lo
muestra; `--comparar` lista sin escribir lo que difiere del actual (tareas
con titulo, complejidad, dependencias y estado, hitos, filas duplicadas, zona
manual y el texto propio fuera de ella que se perderia) y sale con 1 si hay diferencias, que
es la comprobacion previa a migrar un proyecto con ROADMAP propio;
`--escribir` lo regenera sin commitear y sobre uno ajeno solo si `--comparar`
saldria limpio. Guia en la skill `task-workflow` (`roadmap.md`) y en el
README.

Cambio de comportamiento: en un proyecto sin `tareas/ROADMAP.md` (ni historia
de el), el primer commit de `new`, `plan`, `approve` o `finish` en la rama de
integracion lo crea, y desde entonces entra en los commits de esas
transiciones cuando cambia.

Regla de una hora (TASK-097). Una tarea prevista de mas de una hora de punta a
punta (de la rama abierta al cierre con merge) se trocea. La plantilla de
`plan-final.md` gana la linea `Duracion estimada: N min` con sus senales
(ficheros de codigo previstos, capas, criterios; los ficheros de codigo son la
mejor senal medida en 147 tareas de dos proyectos). Con mas de 60 min, o con una
cifra que no se entiende, `taskctl siguiente` devuelve `preguntar` en cualquier
modo y `taskctl approve --decidido-por automatico` se rechaza: decide una
persona. Sin la linea, `approve` solo avisa (los planes anteriores no se
atascan). `taskctl finish` anota en `tarea.md` la seccion `## Duracion` con la
estimada y la real de punta a punta (sin pausas), sin lanzar nunca tras el
merge, y `taskctl metricas` gana las columnas `estimada` y `punta_a_punta`.
Guia en la skill `task-workflow` (`duracion.md`): senales y como trocear
(porcion vertical frente a capas).

Cambios de comportamiento: dos columnas nuevas al final de la tabla de
`taskctl metricas` (antes de las de `--tokens` y `--heuristica`); el resultado
de `approve` gana `avisos`.

Revision que converge (TASK-095). Corrige la regla de alcance de la 0.12
(TASK-083), que exigia que la ronda anterior dejara solo MENORES: un CRITICO o
IMPORTANTE en cualquier estado, tambien `corregido`, obligaba a una ronda
completa desde la base, y como los revisores vuelven a listar lo ya
corregido, cada ronda relanzaba una revision entera que encontraba otra tanda
(medido en 147 tareas de dos proyectos: hasta 14 rondas en una tarea;
`docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md`). Principio: el coste de
revisar crece con la correccion, no con el proyecto. Desde la ronda 2 la ronda
es una verificacion acotada aunque queden CRITICOS o IMPORTANTES: revisan los
revisores con hallazgos pendientes (todo lo que no esta `aceptado`, tambien lo
`corregido`), cada uno los suyos, y los de dominio cuyos ficheros toca la
correccion, todos con el diff entero de la correccion; solo se abre un
hallazgo nuevo si es CRITICO o lo introduce la correccion. Un merge de la base
entre rondas ya no la hace completa: se nombra y su codigo va en el diff.
Sigue siendo completa con `--completa` (ahora siempre desde la base), sin
commit revisado fiable, o si un informe anterior no se puede leer. Entre
rondas se corrige todo (el MENOR que no compense se acepta con motivo o pasa a
otra tarea) y `review` avisa de lo que quede sin marcar. Tope: tras la ronda 3
con cambios, `siguiente` pregunta en cualquier modo (antes manual y
semiautomatico se detenian) y `review` no abre la ronda 4 sin el flag nuevo
`--ronda-extra`, que solo se pasa si lo decide una persona. Se quita el aviso
de `veredicto` con solo MENORES. No se retira ningun revisor.

Cambios de comportamiento: una ronda acotada puede llevar varias peticiones
con sufijo de revisor (antes una sola, del generico); la ronda siguiente lista
tambien los hallazgos `corregido` para verificarlos; `siguiente --json` en el
tope da `preguntar` y el comando lleva `--ronda-extra`.

Sincronizacion de un fichero suelto en la raiz de `tareas/` (TASK-092).
`rutas_sincronizacion` admite ahora un fichero directamente en `tareas/` (p. ej.
`tareas/ROADMAP.md`), que se regenera en cada transicion dentro del mismo commit
como cualquier otra ruta sincronizada. Antes se rechazaba todo lo que colgaba de
`tareas/`, y un roadmap que vivia ahi se quedaba atrasado tras `plan`, `start`,
`review` o `finish`. `taskctl` solo escribe dentro de las carpetas de estado
(`tareas/0N-*/`), asi que un fichero suelto no choca con lo que escribe el CLI.
Se siguen rechazando las rutas dentro de una carpeta de estado o de cualquier
otra subcarpeta de `tareas/`, la propia carpeta `tareas`, `.taskcode/` y `.git/`.
Las tres salvaguardas (ruta con cambios previos, comando que falla, fichero no
declarado) funcionan igual con estas rutas. `informe_cobertura` no cambia.

Cambio de comportamiento: la comparacion de las carpetas prohibidas ya no
distingue mayusculas. `Tareas/01-en-diseno/x.md`, `.GIT/HEAD` o
`.TaskCode/config.yml` pasaban antes la validacion (en Windows y macOS son las
mismas carpetas) y ahora abortan al leer la config, en `rutas_sincronizacion` y
en `informe_cobertura`.

- TASK-098 (feature) — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes (2026-11-10)
- TASK-097 (feature) — Regla de una hora: plan estima la duracion de punta a punta y propone trocear (2026-11-10)
- TASK-095 (feature) — Revision que converge: desde la ronda 2 solo se verifican las correcciones (2026-11-10)
- TASK-092 (feature) — Sincronización de ficheros sueltos de la raíz de tareas/ (2026-11-10)

## 0.13.0 — 2026-11-09

Verificacion selectiva por impacto (TASK-091). Clave nueva opcional
`comando_verificacion_selectiva` (con `timeout_verificacion_selectiva`, 600 s
por defecto): una verificacion rapida que corre solo lo afectado por los
cambios y recibe la rama base de la tarea en la variable `RAMA_BASE`. La usan el
hook `Stop` (en vez de la completa) y `taskctl review`, que la corre antes de
escribir la ronda (en la primera, despues de integrar la base; las rondas
incrementales no la integran): en rojo, o si deja el arbol sucio, aborta sin
abrir ronda, la tarea sigue en curso y el mensaje dice si la base quedo
integrada; en verde, la peticion lleva la seccion «Verificacion de
esta ronda» con el tipo, el comando, el resultado y su salida, y omite la de
cobertura (el informe podria ser parcial). `comando_verificacion` sigue siendo
la puerta de `finish` y del guardian de merges: la selectiva sin la completa
aborta al leer la config, y su resultado se guarda aparte
(`.git/freno-verificacion-selectiva.json`, con la base y su commit en la
huella), asi que un verde de la selectiva nunca abre un merge aunque los dos
comandos tengan el mismo texto. `taskctl doctor` gana la comprobacion
`verificacion-selectiva`, que avisa si hay completa sin selectiva. Guia para
los proyectos en la skill `task-workflow` (`verificacion-selectiva.md`): como
escribir el clasificador, que incluya el arbol de trabajo y que cambios obligan
a correr todo.

Cambio de comportamiento con la clave: el `Stop` deja de escribir el memo de la
completa, asi que un `git merge` manual ya no se apoya en el verde de un fin de
turno; cierra con `taskctl finish`, que corre la completa. Sin la clave, nada
cambia.

Actualizar como en 0.9.0; despues, en cada proyecto con verificaciones largas,
escribir el clasificador y declarar la clave (`taskctl doctor` lo recuerda).

- TASK-091 (feature) — Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar (2026-11-09)

## 0.12.0 — 2026-11-07

Version del plugin en cada tarea (TASK-084). Cada fila de `## Transiciones`
lleva como quinta columna la version de `taskctl` que la escribio; las filas
anteriores, de 4 columnas, se siguen leyendo igual y siguen congelando el modo.
La primera fila con version bajo una cabecera de 4 columnas amplia solo la
cabecera y su separador, para que se vea en GitHub y GitLab. `taskctl metricas
--por-version [--json]` agrupa las terminadas por la version de su ultimo
`finish`, en orden semver: rondas, aprobadas a la primera, hallazgos por
severidad y origen y tokens por fase; las que no la llevan anotada van aparte,
nunca deducidas por fecha. La version vive en `src/core/version.ts` y un test
exige que coincida con `package.json` y `plugin.json`. Regla nueva: la version
se sube al abrir el ciclo, no al publicar. Un taskctl anterior no lee las filas
nuevas: una version del plugin por repo.

Revision mas barata (TASK-081). `## Coste` gana las columnas `ronda` y
`revisor`; en revision, `registrar-coste` escribe una fila por revisor con la
ronda y el revisor deducidos de su transcripcion (`--ronda`/`--revisor` como
sustitutos) y `metricas --tokens` muestra, por ronda y revisor, lecturas, cache
y CRITICO/IMPORTANTE. La peticion de revision trae `## Contexto permitido`
(clave nueva `contexto_revision`), la skill comun de los revisores manda no
leer fuera de ella salvo justificandolo, y en la ronda 2 o posterior se sugiere
un modelo un escalon mas barato si la ronda anterior no dejo ningun CRITICO.
Las filas de `## Coste` de 11 columnas no las lee un taskctl anterior.

Autorrevision del implementador (TASK-082). Antes de `taskctl review`, la skill
`review` manda pasar la seccion `## Que se revisa` de cada revisora que toca,
corregir lo evidente y anotar en `tarea.md` `## Autorrevision`, una linea
`- <revisora> — <commit>` por revisora. `taskctl review` avisa, sin bloquear,
si falta esa seccion con contenido. `taskctl siguiente --json` devuelve en la
fase review el campo `revisores`, con el mismo clasificador que `review`. La
lista vive solo en cada revisora; `csharp-autocad-ifc-reviewer` unifica el
titulo de esa seccion.

Verificacion acotada de la ronda siguiente (TASK-083). Medido primero: de 138
rondas 2 de dos proyectos, el 23,9 % partia de una ronda 1 sin CRITICO ni
IMPORTANTE y ninguna encontro uno nuevo (`docs/METRICAS.md` §13). Si la ronda
anterior pidio cambios y en todos sus informes solo hay MENOR, `taskctl review`
genera la siguiente como verificacion acotada: un solo revisor (el generico),
sin fragmentar, con instrucciones de verificacion (cada hallazgo, la suite, el
fallo que abre la correccion). Es completa si hay un CRITICO o IMPORTANTE en
cualquier estado, un informe ilegible, no hay diff de correcciones, el delta
trae un merge o toca un fichero que ningun hallazgo nombraba; tras una acotada,
la completa revisa desde la base. Cada peticion lleva `- Alcance:` con su
motivo, `--completa` la fuerza y `taskctl veredicto` avisa si se piden cambios
con solo MENORES.

Coste de implementacion registrado automaticamente (TASK-085). Con una tarea
en curso en la rama, un hook en `Stop` y `SubagentStop` anota en
`.git/coste-pendiente.jsonl` que transcripciones trabajan en ella (solo rutas:
no lee transcripciones, no toca `tarea.md`, sale siempre con 0). `taskctl
review` suma a `tokens_implementacion` y a `## Coste` (`sesion:<id>` y
`agente:<id>`) lo gastado entre el `start` y el `review`, en la rama de la
tarea y dentro del repo, descontando lo ya anotado; `finish` lo repite como
red. Si todo cabe en un turno usa la sesion de `CLAUDE_CODE_SESSION_ID`.
`registrar-coste --fase implementacion` queda como respaldo y
`COSTE_AUTOMATICO=0` lo apaga.

Pausas fuera de las duraciones (TASK-086). `taskctl metricas` descuenta de
`diseno`, `curso`, `revision` y `total` el tiempo entre una fila `pausa` y la
siguiente transicion; con precision de dia no descuenta nada. `--json` gana la
clave `pausas` (con `enPausa` por tarea).

Doctor mas util. `version-plugin` (TASK-087) avisa si el plugin instalado es mas
viejo que el de la copia local del marketplace, con los comandos para
actualizar; sin red y nunca error. `verificacion` (TASK-088) pasa a AVISO sin
`comando_verificacion` cuando la raiz tiene tests detectables (npm/pnpm/yarn,
Cargo, Maven, Gradle, .NET, Go, pytest) y propone el comando.

Sin literales con forma de secreto (TASK-089 y TASK-090). Las claves falsas de
los tests se arman troceadas en un solo helper y un test recorre `git ls-files`
con los patrones de la proteccion de push de GitHub; las excepciones son
parejas exactas fichero+valor de informes historicos, y una pareja que sobra
tambien es rojo. Ademas, los tags v0.9.0 y v0.10.0 que faltaban.

Actualizar como en 0.9.0, y despues `taskctl doctor` en cada proyecto (desde
esta version avisa si el plugin instalado se queda atras).

- TASK-090 (fix) — El guardian de secretos tolera excepciones solo en su fichero historico (2026-11-07)
- TASK-089 (feature) — Evitar literales con forma de secreto en el repo y tags de version que faltan (2026-11-07)
- TASK-088 (feature) — taskctl doctor avisa si falta comando_verificacion con tests detectables (2026-11-07)
- TASK-087 (feature) — taskctl doctor avisa si el plugin instalado esta desactualizado (2026-11-07)
- TASK-086 (feature) — Descontar las pausas de las duraciones de las metricas (2026-11-07)
- TASK-085 (feature) — Coste de implementacion registrado automaticamente (2026-11-07)
- TASK-084 (feature) — Version del plugin en cada tarea y metricas por version (2026-11-07)
- TASK-083 (feature) — Cierre sin ronda 2 completa cuando solo quedan MENORES (2026-11-07)
- TASK-082 (feature) — Autorrevision del implementador antes de pedir revision (2026-11-07)
- TASK-081 (feature) — Revision mas barata: medir y acotar las lecturas de los revisores (2026-11-07)

## 0.11.0 — 2026-11-06

Accesibilidad y roles del brainstorm (TASK-080). `angular-vue-reviewer` revisa la
accesibilidad por criterio de WCAG 2.2: contraste (un contraste que el diff no deja
verificar nunca es CRITICO), orden, visibilidad y foco no oculto, trampas de
teclado, etiquetas y ARIA, nombre accesible de iconos y botones, y dialogos
modales; sus `patrones_archivo` no cambian. `brainstorm-arquitectura` mira
ademas limites entre modulos, direccion de las dependencias, acoplamiento y
coherencia con los ADR. Rol nuevo y condicional, `brainstorm-rendimiento`: lo
suman las etiquetas `rendimiento`, `wasm`, `workers` o `3d` (sin distinguir
mayusculas) cuando la tarea ya lanza 2 roles o mas, sin gastar presupuesto de la
escalera; con 0 o 1, `plan` avisa de que no entra. `approve` y `taskctl
siguiente` reconocen la plantilla vacia de un plan con rendimiento leyendo los
roles de las peticiones en disco (antes la daban por redactada).
Actualizar como en 0.9.0, y despues `taskctl doctor` en cada proyecto.

- TASK-080 (feature) — Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan (2026-11-06)

## 0.10.0 — 2026-11-06

Revisor por pares de dominio para Rust y WebAssembly (TASK-079): la skill
`rust-wasm-reviewer` reclama `.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`,
`.cargo/config.toml` y la configuracion de toolchain, rustfmt y clippy, y revisa
ownership, errores sin `unwrap` ni `panic`, el limite JS-WASM con `wasm-bindgen`
(si cambia una firma exportada pide siempre el llamador TS/JS y el `.d.ts`),
numerica en `f64`, `unsafe` y rendimiento. Antes todo el Rust iba al generico.
Registrada en el catalogo de skills (prioridad 10, etiquetas de Rust y WASM). Con
cuatro revisores de dominio, un diff de Rust, Vue, Java y C# a la vez supera el
umbral de 3 y va entero al generico, y `code-quality-reviewer` ya lo contempla.
Actualizar como en 0.9.0, y despues `taskctl doctor` en cada proyecto.

- TASK-079 (feature) — Revisor por pares de dominio para Rust y WASM (2026-11-06)
## 0.9.0 — 2026-11-06

Doctor avisa de los hooks que bloquean los subagentes (TASK-076): con el modo de
permisos automatico, Claude Code 2.1.317+ deniega el lanzamiento de un subagente
(Auto-Mode Bypass) si un hook PreToolUse sobre Agent/Task reescribe el encargo, y
plan y review se paraban sin explicacion. `taskctl doctor` da ahora un AVISO
`hooks-subagente` por cada hook PreToolUse cuyo matcher alcanza a Agent o Task
(tambien `""`, `"*"` o sin matcher) en los plugins habilitados (version activa de
`installed_plugins.json`: su `hooks/hooks.json` y los `hooks` de su `plugin.json`)
y en los settings de usuario, de proyecto y locales, con origen, ruta y matcher; no
cambia el codigo de salida. El README trae "Problemas conocidos" con las salidas, y
la skill de flujo manda ejecutar `taskctl doctor` y parar ante una denegacion.
Esta version incluye ademas todo lo acumulado desde 0.8.0 (TASK-066 a 078:
held-out, puerta de verificacion, hooks Stop y de merges, doctor-deploy, cobertura).
Actualizar con `claude plugin marketplace update taskcode-marketplace`,
`claude plugin update taskcode-plugin@taskcode-marketplace` y reiniciar
Claude Code (o `/reload-plugins`). Despues, `taskctl doctor` en cada proyecto.

- TASK-076 (fix) — Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico (2026-11-06)
- TASK-074 (feature) — Cobertura sobre las lineas cambiadas (2026-11-05)
- TASK-078 (feature) — Hook que impide leer y editar los held-out de la tarea en curso (2026-11-05)
- TASK-075 (fix) — Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+ (2026-11-05)
- TASK-073 (feature) — Tests held-out por tarea (2026-11-05)
- TASK-077 (fix) — Guardian de merges: opciones con valor antes de -c y doc de bash -c (2026-11-04)
- TASK-072 (feature) — Puerta de verificacion en finish y merge guard (2026-11-04)
- TASK-071 (feature) — Hook Stop: una tarea no se da por hecha con la verificacion en rojo (2026-11-04)
- TASK-070 (feature) — Clave comando_verificacion en .taskcode/config.yml (2026-11-04)
- TASK-068 (feature) — Doctor-deploy C: tipo de aplicacion y sondas deterministas extra (2026-11-04)
- TASK-069 (feature) — Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ (2026-11-03)
- TASK-067 (feature) — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release (2026-10-28)

- TASK-066 (feature) — Doctor-deploy A: catalogo generico y comprobaciones deterministas (2026-10-27)
- TASK-067 (feature) — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release (2026-10-27)

Tests held-out por tarea (TASK-073, primera parte).

- Clave nueva `comando_heldout` en `.taskcode/config.yml`. Los held-out los escribe la persona
  en `aceptacion/` de la tarea y los commitea en la rama base durante el diseno.
- **`taskctl finish`** los ejecuta tras la verificacion (`HELDOUT_DIR` = la carpeta) y aborta
  si fallan, mostrando solo comando, codigo y duracion; si la rama los cambio respecto a la base;
  o si hay held-out y no `comando_heldout`. `--sin-verificacion` no los salta.
- La peticion de revision excluye siempre `aceptacion/`. El hook que impide leerlos llega con
  TASK-078.

Puerta de verificacion en finish y guardian de merges (TASK-072).

- **Cambio de comportamiento**: con `comando_verificacion` declarado, `taskctl finish` lo
  EJECUTA siempre antes de mergear o de abrir el merge request (no reutiliza el memo) y aborta
  con el informe si no sale en verde, o si en verde deja el arbol sucio. Hay que lanzarlo desde
  la rama de la tarea. No corre en el segundo `finish --merge-request` ni en el camino
  idempotente (los merges ya estan hechos). Puede tardar lo que tarde la suite.
- `--sin-verificacion` la salta y lo anota en `tarea.md` (seccion `## Verificacion omitida`)
  con un commit en la rama de la tarea ANTES del merge. Sin `comando_verificacion` solo avisa.
- **Hook `PreToolUse`** (sustituye a la sonda de TASK-069, ya sin filtro `if`): bloquea un
  `git merge` o un script `merge-*-to-*.sh` hacia la rama de integracion (`rama_base`) o la
  principal si no consta un verde guardado del commit que entra, y remite a `taskctl finish`.
  El destino sale del texto (`git checkout develop && git merge x`) o de la rama actual. El
  texto de `bash -c`, `pwsh -Command` y `cmd /c` se analiza igual (TASK-077: tambien con
  opciones con valor delante, como `bash -o pipefail -c`). Deja
  pasar lecturas, `merge --abort|--continue|--quit`, `merge-base`, merges hacia ramas de
  trabajo y lo ya integrado (el backmerge de un hotfix que ya esta en main). Corre antes de cada
  comando Bash/PowerShell, pero sin `merge` en el texto sale sin cargar nada; nunca ejecuta la
  suite. Limites aceptados: alias de git, `git pull`, `git push . x:develop`, subshells.

Freno de fin de turno (TASK-071): hook `Stop` que no deja dar el turno por terminado con la
verificacion en rojo.

- **Cambio de comportamiento**: un proyecto que declare `comando_verificacion` pasa a
  EJECUTARLO al final de cada turno del agente mientras haya una tarea en
  `tareas/02-en-curso/` en la rama actual. Sin la clave, o sin tarea en curso en la rama, el
  hook sale 0 sin lanzar ningun proceso. Se apaga con `FRENO_VERIFICACION=0`.
- En rojo (o cortada, o config invalida) sale con 2 y le devuelve el turno al agente con el
  comando, el codigo, la duracion y el final de la salida (40 lineas / 4 KiB, sin ANSI ni
  credenciales en URLs; otros secretos que imprima el comando no se filtran). Un solo disparo
  por turno (`stop_hook_active`).
- Memo por huella del arbol en `.git/freno-verificacion.json`: sin cambios, no se vuelve a
  ejecutar la suite. Tope de 3540 s por debajo del `timeout` de 3600 s del hook.
- El envoltorio que ejecuta comandos con tope y mata el arbol pasa a
  `fs/ejecucion-acotada.ts`, compartido con la sincronizacion. Unico cambio: al cortar por
  timeout deja de reenviar la salida del comando, para que la marca del corte sea lo ultimo.
- El `PreToolUse` sigue siendo la sonda inerte de TASK-069 hasta TASK-072.

Comando de verificacion declarado (TASK-070), primer paso de los frenos de verificacion.

- **`comando_verificacion` y `timeout_verificacion`** en `.taskcode/config.yml`:
  el comando de tests del proyecto y sus segundos (por defecto 600). Opcionales;
  sin ellas todo funciona como antes. Un valor invalido aborta (fallo cerrado) y
  el timeout sin comando tambien.
- **`taskctl doctor`** informa de la verificacion: `ok` con el comando, u
  `omitida` con el arreglo en la misma linea si falta.
- Todavia no hay freno que la ejecute: el hook `Stop` y la puerta de `finish`
  llegan con TASK-071 y TASK-072. No se publica version hasta entonces.

Doctor-deploy C (TASK-068): clase de aplicacion, sondas de configuracion y OWASP 2025.

- **Clase de aplicacion**: doctor-deploy detecta web, api, Android, iOS, Flutter,
  React Native, CLI o libreria como segundo eje, independiente del lenguaje
  (familia `aplicacion_N_*` del catalogo). Los puntos pueden declarar
  `punto_N_aplicaciones`. En una CLI o una libreria sin marcadores de web ni de
  api, los puntos de servicio desplegado (HTTPS, cookies, cabeceras, rate limits,
  backups, health check, bots, respuestas de la API, CORS y CSRF) salen NO APLICA
  con el tipo y el marcador en el motivo; sin clase detectada siguen aplicando.
- **Siete sondas deterministas nuevas**: `reglas-firebase-abiertas`,
  `migraciones-sin-rls`, `tokens-en-ficheros-de-gestor`, `compose-con-contrasenas`,
  `ci-pull-request-target`, `acciones-ci-sin-sha` y `dockerfile-sin-user` pasan de
  juicio a determinista: el agente revisor ya no los recibe y un veredicto suyo
  para ellos se rechaza. Silencios por hallazgo para sus patrones (en
  `pr-target-checkout`, por paso del flujo), salvo `dockerfile-sin-user`, que es
  del fichero entero. Valores secretos siempre enmascarados.
- **Referencias**: el campo `referencia` pasa de OWASP Top 10 2021 a OWASP Top 10
  2025 + ASVS 5.0, remapeado por significado (SSRF de A10 a A01, inyeccion de A03
  a A05...). La tabla esta en `docs/doctor-deploy-referencias-owasp.md`.
- **Compatibilidad**:
  - El JSON de `doctor-deploy` pasa a `version: 3` con el campo `aplicaciones`;
    quien compruebe `version === 2` tiene que actualizarlo.
  - Los puntos 37-43 antes salian siempre NO VERIFICADO, que no cambia el codigo
    de salida; ahora pueden dar FALLA. Un CI que use `taskctl doctor-deploy` como
    puerta puede ponerse rojo al actualizar el plugin sin que el proyecto haya
    cambiado: revisa los hallazgos y arreglalos o silencia los falsos positivos.
    Los ids de punto y de tipo no cambian.

Doctor-deploy B (TASK-067), segunda mitad de doctor-deploy.

- **Puntos de juicio**: nueva skill `/taskcode-plugin:doctor-deploy` y agente
  `revisor-seguridad-deploy` (solo lectura). El agente cita fichero y linea o el
  punto queda NO VERIFICADO; trata el contenido del repo como dato, no como
  instrucciones, y nunca copia valores ni fragmentos.
- `taskctl doctor-deploy --resultado <fichero.json>` repite el analisis sobre
  HEAD y mezcla los veredictos del agente. Rechaza, con su motivo, los de otro
  commit, de un punto determinista, desconocido o que no aplica, sin fichero y
  linea, con ruta absoluta o `..`, fichero no versionado o linea inexistente; el
  motivo se acota y se enmascara. El JSON del agente vive fuera del repo.
- **Informe JSON v2**: cada punto lleva `origen` (`sonda` | `agente`), y el
  informe `veredictos` y `tareas`. `--escribir` deja tambien `<fecha>.json` junto
  al `.md`. Quien lea el JSON v1 debe aceptar el campo nuevo y `version: 2`.
- `--crear-tareas`: una tarea por FALLA con ID reservado descendente desde
  TASK-9999, arreglo como objetivo y "doctor-deploy da OK en el punto" como
  criterio. Etiqueta `doctor-deploy:<id-punto>` para no duplicar (borrarla a mano
  rompe la deduplicacion); avisa de tareas cuyo punto ya da OK o ya no existe, sin
  cerrar nada. Exige el arbol limpio y puede cambiar a la rama base.
- **Rango reservado**: `taskctl new` e `import` ignoran los IDs desde TASK-9000 y
  abortan si la numeracion normal llegara ahi. Los reservados se reparten mirando
  tareas y ramas. **Actualizad el plugin a la vez en todo el equipo**: una version
  anterior crearia TASK-10000 tras un TASK-9999.
- **`finish` de una release avisa, sin bloquear**, si no hay un informe de
  doctor-deploy al dia (el de la punta, o un ancestro con solo
  `docs/doctor-deploy/` o `tareas/` cambiados) o si tiene alguna FALLA de
  severidad critica.
- **Cambio de comportamiento (MEN-12 de TASK-066)**: `gitignore-cubre-env` ya no
  se queda en las 10 primeras carpetas de proyecto. Revisa todas (tope de 200) o
  sale NO VERIFICADO diciendo cuantas faltan. Un monorepo con mas de 10
  carpetas que antes salia OK puede salir ahora FALLA (y el comando, con codigo 1
  en CI) o NO VERIFICADO.
- Tests que matan los mutantes N8, N9, N12, N14 y N17 de la revision de TASK-066
  (MEN-13).

## 0.8.0 — 2026-10-25

Metricas v2 (TASK-063, 064 y 065): coste desglosado por agente, origen de
cada hallazgo de revision, lecturas por fase, y `taskctl metricas` con
`--evolucion`, `--grupos`, `--repo` (varios proyectos a la vez) y `--json`.
Un flag repetido que no admite repeticion aborta ahora en cualquier comando.
Actualizar con `claude plugin marketplace update taskcode-marketplace`,
`claude plugin update taskcode-plugin@taskcode-marketplace` y reiniciar
Claude Code (o `/reload-plugins`). Despues, `taskctl doctor` en cada
proyecto.
- TASK-065 (feature) — Metricas v2 (C): evolucion, grupos y varios proyectos (2026-10-26)

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
