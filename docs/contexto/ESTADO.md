# Estado del proyecto — handoff

> Última actualización: **2026-10-04** (fase 4 de la auditoría cerrada, v0.3.0).
> Este documento se actualiza al cerrar cada fase. Si lo que dice no cuadra
> con el repo, gana el repo — y hay que corregir esto.

## Auditoría del 2026-10-03 — en curso (fase F)

Plan: `docs/auditoria/PLAN-SOLUCION-2026-10-03.md`. Se ejecuta en continuo,
una tarea tras otra, con release y aviso a OpenGisViewer al cerrar cada fase.

- **v0.1.1** — TASK-033: comando de sincronización tras cada transición.
- **v0.1.2** — fase 1 (TASK-034, 035, 036): revisión más barata (excluir lo
  generado del diff, una suite por ronda, `taskctl veredicto`).
- **v0.1.3** — fase 2 (TASK-037, 038, 039): Git-Flow con menos procesos y una
  sola detección de origin.
- **v0.2.0** — fase 3 (TASK-040): ronda 2 de revisión incremental.
- **v0.3.0** — fase 4 (TASK-041, 042, 043, 044, más TASK-046 y TASK-053):
  tareas concretas y acotadas. Métrica: contra las 27 tareas cerradas, la
  puerta de `plan` habría bloqueado solo TASK-029, 030 y 032 (las de
  peticiones de 110-160 KB), y la partición propuesta de las tres coincide
  con la que se hizo a mano. Una tarea `simple` lanza 1 agente en vez de 3.
- **Pendiente**: fase 5 (TASK-045, 047, 054) y fase 6 (TASK-048 a 052).
  Las tareas planificadas no tienen Objetivo: hay que redactarlo antes de su
  `plan`.

## Dónde estamos

**41 de 42 items del plan de terminación (98%).** Sprint 0 y Sprint 1
completos (TASK-001 a TASK-012), **las Fases A, B, C y D cerradas enteras**,
y la Fase E a un solo item de cerrarse del todo: E1, E3, E4, E5 y E6 hechos;
solo queda **E2 (TASK-023, sin empezar)**.

El total ha bailado dos veces: subió de 42 a 43 cuando la revisión de C5 abrió
**E6** (la distribución del CLI del plugin, ya cerrada en TASK-031), y ha
vuelto a 42 al descartarse **D4** con datos delante.

La Fase D se cerró con D1 (TASK-016, brainstorm paralelo por roles),
D2 (TASK-017, catálogo de skills determinista), D3 (TASK-018, enrutado de
revisor por diff real fragmentado por dominio) y D5 (TASK-020, `taskctl
codex-review`) — cada una con su propio ciclo completo de revisión por
pares (D3 y D5 con hallazgos reales de plataforma corregidos en el propio
ciclo, no solo de diseño). Detalle línea a línea de cada una en
`docs/contexto/CHECKLIST_TERMINACION.md`, que es donde de verdad se
mantiene al día — este documento resume, no repite.

**El ciclo de vida está completo y con reglas de proceso encima que de
verdad se aplican**: `import → plan → approve → start → review → finish`
funciona de punta a punta contra un repo Git real, y TASK-013, 014, 015,
024, 025, 026, 027 y 028 se gestionaron enteras con la propia herramienta.
`asignado_a` se rellena solo con `git config user.email` (C7), el límite de
una rama de trabajo por persona funciona mirando las ramas reales (C8), los
cinco wrappers de Git-Flow ya existen (C1), la carpeta de tarea tiene ya
la forma que describe la sección 2 de la metodología: `tarea.md` +
`planificacion/` + `revision/` (C3), y **el plugin por fin expone algo a
Claude Code**: la skill `task-workflow` (C5). Y los scripts de Git-Flow han
dejado de arrastrar su deuda: guard de `origin` en los tres que faltaban, el
registro fuera del workspace del usuario, los mensajes citando `taskctl` en
vez de menus de IntelliJ, y `abort-merge` viendo cherry-picks y reverts a
medias (C6). **472 tests** (469 verdes; los 3 rojos son los conocidos de
este entorno Windows).

Lo que queda es un solo item: las métricas de coste en tokens por fase (E2).
**El corte mínimo
defendible —Fases A + B + C— está alcanzado desde hace tiempo**, y ahora
también la Fase D entera: el sistema es completo, usable y con toda la
inteligencia de proceso opcional que se planteó, encima.

**Todo subido** (2026-09-07): `develop` está a la par con `origin/develop` y
las 24 ramas locales existen en el remoto. El repo tiene `origin`
(`github.com/charliebk/TaskCode.git`) y responde — durante un tiempo estos
documentos afirmaron que no lo tenía, y era falso.

Hasta hoy el desfase llegó a **41 commits y 4 ramas** sin subir, acumulados en
una sola sesión de trabajo. Es la tensión que trae la decisión #14, tomada a
conciencia: `taskctl` commitea pero **no sube** sin `--push`, así que publicar
depende de que alguien se acuerde. Con la política IECA de no borrar ramas,
lo que se olvida no se reabsorbe: crece. Conviene subir al cerrar cada item,
no al cerrar el sprint.


## Qué acaba de pasar (sesión del 2026-09-05, segunda parte)

Se cerró el hito real de usabilidad: **la Fase B está a dos items** y el
ciclo de vida completo ya funciona.

1. **B2** — guard de `origin` en `merge-hotfix-to-main.sh` y
   `merge-release-to-main.sh`, extraído a `detect_origin_available`. La
   revisión añadió un matiz importante: "origin configurado pero caído" NO
   es lo mismo que "sin origin" y aborta, porque el tag se crearía sobre
   una `main` posiblemente obsoleta.
2. **B1** — TASK-013, `taskctl review`. El CLI hace lo determinista (update
   verificado con `merge-base`, mover a `03-en-revision/`, petición con el
   diff real + scaffold del informe) y el agente lo dispara el orquestador.
3. **B3** — TASK-014, `taskctl finish`. Cerró su propia tarea: primer
   cierre de punta a punta. Resuelve la colisión de IDs con dos
   discriminadores (título distinto y linaje sin ancestro común) y tiene
   camino idempotente de reintento tras un conflicto de backmerge.
4. **B4** — histórico de Sprint 0 y 1 en `CHANGELOG.md` y `docs/INDEX.md`
   (los tres artefactos ya los había creado `finish`).
5. **B5** — divergencia de `board` resuelta: `taskctl board --escribir`
   regenera `docs/BOARD.md`; sin el flag sigue siendo de solo lectura.

**Dogfooding real**: TASK-013 y TASK-014 recorrieron `plan → approve →
start → review → finish` con la propia herramienta. 275 tests, ~95% de
cobertura.

**Pendiente operativo**: nada. Todo está subido a `origin` — `develop` y las
cinco ramas de tarea de estas sesiones.

## Qué acaba de pasar (sesión del 2026-09-05, tercera parte): B6 y B7

**B6** — `--asignado-a` en `plan` y `start`, la precondición de B7. El flag
vive en un módulo compartido (`src/cli/asignado.ts`) que usan los tres
comandos que lo tocan, `plan`, `start` y `board`. Sin flag se **conserva** el
`asignado_a` que hubiera, así que `start` hereda lo que dejó `plan`, que es
lo que describe la §8.2. La revisión por pares encontró un IMPORTANTE real:
`board --asignado-a` (el nombre canónico que B6 acababa de introducir y que
sale en la ayuda) se ignoraba en silencio y devolvía **el tablero entero** con
código 0 — el mismo fallo que el propio commit usaba para justificar el
alias, sin cerrar el otro lado. 307 tests.

**B7** — TASK-015, límite de WIP, cerrado. Es el primer item que impone
una regla de proceso, no una capacidad: `taskctl start` aborta si la
persona asignada ya tiene otra tarea en `02-en-curso` o en
`03-en-revision`. En diseño no hay tope. Diverge de la §8.2 (que pide dos
límites, uno sobre el diseño) y esa es hoy la mayor divergencia del
proyecto: documentada en HALLAZGOS, no reescrita.

La revisión por pares fue la más dura hasta ahora — 16 casos de ataque y
8 mutaciones del código fuente — y su hallazgo IMPORTANTE fue justamente
que la divergencia no estaba documentada. 345 tests.

## Qué acaba de pasar (sesión del 2026-09-06): C7 y C8

Los dos items cierran el bloque que arrancó con B6, y se sostenían unos a
otros: `--asignado-a` → identidad Git → límite de WIP funcionando.

**C7 (TASK-024)** — `asignado_a` sale de `git config user.email`, con la
precedencia `--asignado-a` > asignado previo > identidad Git > `null`. Que
el previo gane a la identidad es lo que impide quedarse la tarea de otra
persona sin decirlo. Migradas 12 tareas a `charlie.bk@gmail.com` (antes
convivían `charlie.bk` y `carlos` para la misma persona).

**C8 (TASK-025)** — el límite de WIP de B7 **no protegía nada** y nadie lo
había notado. Leía el árbol de la rama activa, y el paso a `02-en-curso` se
commitea en la rama de la tarea. Ahora mira las ramas locales sin mergear.

**Las dos revisiones por pares fueron las más duras hasta ahora**, y las dos
encontraron cosas de peso: un CRÍTICO en C7 (un `user.email` con un salto
de línea inyectaba una clave en el frontmatter que pisaba `estado` y dejaba
la tarea ladrillada) y un **RECHAZO** en C8 (para un `hotfix`, 18 ramas ya
cerradas contaban como abiertas y el camino urgente quedaba inutilizable).
Ambos corregidos y verificados en el repo real.

Lo que hay que llevarse de aquí está en `HALLAZGOS.md`: **un smoke test que
ejecuta los comandos en el orden más cómodo confirma lo que ya creías.** El
de B7 encadenaba dos `start` seguidos, el único orden en el que su límite
funcionaba, y por eso el fallo pasó su revisión.

## Qué acaba de pasar (sesión del 2026-09-06, segunda parte): C1

**C1 (TASK-026)** — los cinco wrappers de Git-Flow: `taskctl diagnose`,
`pause`, `resume`, `recover` y `abort-merge`. La §8.3 llevaba desde el
diseño remitiendo a `taskctl pause` en su mensaje de workspace sucio; ahora
ese comando existe, y el mensaje lo nombra.

**Parecía enrutar a `bash` y no lo era: el nudo estaba en el stdin.** Cuatro
de los cinco scripts preguntan con `read -rp`, y `runGitflowScript` invocaba
con la entrada ignorada desde TASK-007. Con EOF, `pause` sobre un workspace
sucio moría con `Opcion no reconocida` y `abort-merge` con un merge en curso
**no abortaba nada y salía con 0**: los dos comandos que más falta hacen
harían lo contrario de lo que dicen.

La regla que queda para cualquier invocación futura, en `HALLAZGOS.md`:
**stdin heredado solo cuando hay terminal, ignorado cuando no la hay**, más
un guard que corta antes de invocar si el valor por defecto del script sería
inaceptable.

**Dos rondas de revisión por pares.** La primera, APROBADO CON CAMBIOS: 2
importantes y 7 menores. Los dos importantes fueron de fondo — (a) `pause`
preguntaba igual con el workspace limpio, porque **todos los scripts se
escriben el registro en `logs/gitflow/` dentro del repo** y se ensucian el
workspace ellos mismos; (b) heredar stdin siempre **reintroducía el cuelgue
indefinido** que motivó el `'ignore'` de TASK-007 — con una tubería abierta
que nadie cierra (cualquier arnés de agente, y también `node --test`) el
comando esperaba para siempre, reproducido con el proceso vivo a los 15 s y
el repo a medias. La segunda ronda, APROBADO: 3 menores, uno corregido (el
guard nuevo daba falsos positivos porque preguntaba por `logs/` en vez de
por el fichero que se escribe).

**Lo que C1 le descubrió a C6** —registro dentro del repo, mensajes que
remiten a los menús de IntelliJ, `abort-merge.sh` ciego a los cherry-picks—
se cerró el 2026-09-07 con TASK-029, junto al bug de `origin` que era el
enunciado original del item. Ver más abajo.

**Limitación que queda a propósito**: `taskctl pause` sigue sin servirle a un
agente sin terminal, que es quien más lo necesitaría. Resolverlo pide un
`pause --stash` / `--commit`, o sea tocar los scripts, que es la capa que la
§7.1 declara única fuente de verdad. No se hizo por cuenta propia.

## Qué acaba de pasar (sesión del 2026-09-06, tercera parte): C3

**C3 (TASK-027)** — la carpeta de tarea tiene ya la forma que describe la
sección 2 de la metodología: `tarea.md` + `planificacion/` + `revision/`.
`taskctl plan` crea `planificacion/` y escribe ahí el `plan-final.md`;
`revision/` la creaba `review` desde B1.

**El nudo no era la ruta nueva, era el legado.** Toda tarea planificada con
la versión anterior del CLI tiene su `plan-final.md` suelto en la raíz de la
carpeta, y mirar solo la ruta nueva habría dejado a `approve` diciendo "no
hay plan que aprobar" sobre una tarea que sí lo tiene. Así que `approve`
acepta las dos ubicaciones, y una re-planificación **migra** el fichero
legado a `planificacion/` con `rename`, conservando el contenido en vez de
pisarlo con el scaffold. Si aparecen los dos a la vez, `plan` y `approve`
**fallan cerrado** sin tocar nada: no eligen por su cuenta cuál gana.

Las 6 tareas ya cerradas en `04-terminadas/` (TASK-013, 014, 015, 024, 025 y
026) se migraron con `git mv` — rename puro, 0 líneas cambiadas —, así que
**ya no queda ningún `plan-final.md` suelto en el repo**.

**Revisión por pares ronda 1: APROBADO CON CAMBIOS** (1 importante, 4
menores), reproducida sobre un clon con smoke test propio y 7 mutantes. El
importante es la lección que queda: **una reestructuración puede quitar
cobertura sin quitar comportamiento**. La escritura del scaffold iba con el
flag `'wx'`, que protege contra pisar un plan existente; el camino nuevo de
migración pasa por `rename`, y el revisor lo demostró ejecutando el mismo
mutante en las dos ramas — en `develop` un test se ponía rojo, en la rama
nueva no. Aplicados todos los hallazgos salvo la parte (a) del #4 (el
`rename` no tiene un equivalente exclusivo del `'wx'` porque POSIX no lo
ofrece), documentada sin corregir. 12 tests nuevos, **429 en total**.

La **ronda 2** pidió cambios y, tras corregirlos, aprobó. Su hallazgo importante es el que deja poso: el fix de la ronda 1 estaba validado solo en Windows. En POSIX `stat("planificacion/plan-final.md")` devuelve `ENOTDIR` cuando `planificacion` es un fichero, no `ENOENT`, así que en Linux morían con un error crudo tanto `plan` como `approve` — y **el propio test escrito para certificar ese fix habría fallado en el job `ubuntu-latest`**. El revisor lo confirmó corriendo el código en Linux de verdad. Está en `HALLAZGOS.md`: un fix de errno validado en una sola plataforma no está validado.

## Qué acaba de pasar (sesión del 2026-09-07): C5

**C5 (TASK-028)** — `skills/task-workflow/SKILL.md`, la primera skill del
plugin. Hasta ahora el plugin era, en la práctica, un CLI y unos scripts
Bash: **no exponía ni un solo artefacto a Claude Code**, así que todo el
discurso de la metodología sobre "el agente sabe qué hacer" no estaba
respaldado por nada. Ahora hay una skill, `taskcode-plugin:task-workflow`,
de 272 líneas: cuándo aplica y su prerrequisito, el ciclo de vida con sus
precondiciones, los comandos reales con su firma exacta, la lista de lo que
**no** existe, 9 reglas de proceso con su motivo, la revisión por pares, la
tabla literal de qué líneas de veredicto acepta `finish`, y las trampas.

**El fichero es corto; el riesgo estaba entero en el contenido.** Un agente
se cree lo que lee en una skill, así que un flag inventado o un estado mal
ordenado no es una errata: es una fuente de errores *con autoridad*. Por eso
la superficie del CLI se extrajo del **código** —`cli.ts`,
`state-machine.ts`, `wip.ts`, `git.ts`—, no del README ni de la metodología,
que en tres puntos ya no la describen. Las tres divergencias, detectadas y
**no** heredadas: (a) `taskctl codex-review` no existe pese a estar modelado
en la máquina de estados y en la tabla de la §8 —y `revision_codex: true`
deja la tarea **imposible de cerrar**, porque `finish` la rechaza y remite a
un comando inexistente—; (b) el guard de la §8.3 solo lo aplican 4 de los 8
comandos; (c) `plan` no es multi-agente.

**Lo que viaja y lo que no.** La skill se distribuye a proyectos que no son
este, así que se quedó fuera todo lo de TaskCode: el checklist,
`docs/contexto/`, los nombres de helpers internos. Viaja la regla, no la
instancia — el revisor lo comprobó buscando 20 marcas del repo, con cero
coincidencias. El frontmatter lleva solo `name` y `description`: la
intersección entre lo que acepta Claude Code y lo que admite el spec
portable.

**La lección, ya en `HALLAZGOS.md`: una prueba que solo puede pasar cuando
algo está roto no es una prueba.** La especificación inicial decía
"comprobar que `claude plugin validate` imprime `Validating skill:`", y está
invertida: el validador solo nombra las skills que **fallan**, así que ese
test habría pasado únicamente con la skill rota. Se detectó porque el
validador pasó limpio sin mencionarla y esa ausencia, en vez de darse por
buena, se convirtió en la pregunta. La prueba correcta es la contraprueba:
romper el frontmatter de una *copia*.

**Dos rondas de revisión por pares**: la primera pidió cambios (1
importante, 5 menores) y la segunda aprobó. El importante era de los que
duelen: `CLAUDE.md` decía 429 tests y en esta rama son 444 — la cifra se
midió en `develop`, antes de que existieran los 15 tests de la propia tarea,
y mergearla así **habría reproducido el defecto que la corrección venía a
arreglar**. De paso se corrigió que `review` y `finish` "no existen" (se
cerraron en B1 y B3) y se anotó la trampa de los 3 rojos de Windows.
**15 tests nuevos, 444 en total.**

**Item nuevo que deja abierto**: en un clon recién hecho el plugin no trae
un `taskctl` que funcione (`dist/` ignorado, sin `bin` declarado). Es un
problema de empaquetado, no del ciclo de vida, y va a la Fase E como **E6**.

## Qué acaba de pasar (sesión del 2026-09-07, resto): C6, C2 y C4

Tres items más en la misma sesión, todos con **agentes en paralelo dentro de
una sola rama** (norma del proyecto) e integración en serie.

**C6 (TASK-029)** cerró los cuatro frentes de deuda de los scripts de
Git-Flow: guard de `origin` en los tres que faltaban, el registro fuera del
workspace del usuario (`.git/taskcode/gitflow/`, resuelto con `--git-path`
para que valga en worktrees), los mensajes citando `taskctl` en vez de menús
de IntelliJ, y `abort-merge` viendo cherry-picks y reverts. Al medirlo
apareció un **tercer testigo que el plan no preveía**: `.git/sequencer/`.

**C2 + C4 (TASK-030)**, dos items en una rama porque el límite de WIP es 1.
`taskctl` ya commitea lo que escribe —una ruta a una, nunca `add -A`— y
`.taskcode/config.yml` existe con tres claves opcionales.

**El patrón que más se repitió no fue un bug, fue una forma de equivocarse**:
afirmar sin medir. Ocurrió cinco veces y las cinco lo cazó quien lo tocó
después —

- el plan decía que dos scripts usaban una función compartida, y no la usaban;
- decía que dos testigos bastaban para detectar un cherry-pick, y faltaba uno;
- decía que el parser soportaba comentarios `#`, y solo los inline;
- decía que `start`/`review`/`finish` no comprueban el workspace, y sí lo hacen;
- y `limite_wip` se dio por bueno tras probarlo a mano con el CLI, sin test:
  deshacer la línea que lo cablaba no rompía nada.

El último es el más incómodo y el más útil: **verificado a mano no es
verificado**. Está en `HALLAZGOS.md` junto al patrón hermano de C6 (medir lo
que no discrimina: comparar HEAD antes/después parecía empírico y daba el
mensaje del caso raro en el caso normal).

## Qué acaba de pasar (sesión del 2026-09-07, final): D6 y D7

**TASK-032** cerró de una vez los dos items de la Fase D que no dependían de
nada: las cuatro skills revisoras (D6) y los roles de brainstorm más la
heurística de complejidad (D7). Van juntos porque ninguno depende del otro y
el límite de WIP es 1 — mismo precedente que TASK-030 (C2+C4).

**El plugin pasa de exponer una skill a exponer cinco skills y cuatro
agentes.** Nueve artefactos de contenido, **cero líneas en `src/`**, 93 tests
nuevos: la suite va de 537 a **630** (627 verdes; los 3 rojos son los
conocidos de Windows).

**Cuatro agentes en paralelo dentro de la misma rama** para implementar, y
tres rondas de revisión con **tres revisores independientes cada una**. 31
hallazgos, **cero críticos**, todos aplicados.

**Lo que deja para el futuro está en `HALLAZGOS.md`, y es lo mejor de la
tarea**: el patrón de que *la corrección de un hallazgo llega sin la red que
impide deshacerla* se repitió las tres rondas, y de ahí salieron **siete
aserciones que no podían fallar**. La peor: el test que exigía «reproducir
empíricamente» se satisfacía con una etiqueta que **otro test obliga a que
esté presente**, así que borrar la sección entera de método de una skill
—2399 bytes— dejaba la suite verde.

Dos hallazgos fueron defectos **de las propias correcciones**, no del trabajo
original: el recorte de patrones que dejó ciega a la skill de Angular ante la
convención de Angular ≥20, y la excepción de `hotfix` que, escrita como
sustitución, **subía** de 0 a 1 los agentes de un hotfix trivial — la clave
que existe para abreviar el brainstorm añadiendo uno.

**Divergencia nueva y documentada**: el YML dice `alta` donde la §16.1 y la
decisión #2 dicen `compleja`, porque `validateTask` rechaza `compleja` y tres
tareas reales (TASK-016, 017 y 018) declaran `alta`.

**D4 descartado** por Carlos antes de empezar, con el dato delante: no existe
ni una tarea `trivial` en el historial, así que la regla casi nunca se
activaría. La Fase D baja de 7 a 6 items.

## Qué sigue: el resto de la Fase D

Quedan **D1, D2, D3 y D5**, en ese orden. D1 y D2 ya tienen debajo lo que
necesitaban (`agents/`, la tabla de agentes por nivel y los
`patrones_archivo` de los cuatro revisores), así que arrancan sin trabajo
previo. **D5** sigue siendo el que cierra un agujero real: hoy
`revision_codex: true` deja la tarea imposible de cerrar, porque `finish` la
rechaza y remite a un comando que no existe.

## Qué se hizo antes: E6 primero, luego la Fase D

**Decidido con Carlos el 2026-09-07, al cerrar la Fase C.** El orden no es
negociable por dos motivos, uno de criterio y otro mecanico:

1. **E6 va antes que toda la Fase D.** En un clon recien hecho el plugin no
   trae un `taskctl` que arranque: `dist/` esta ignorado y nadie declara
   `bin`. Toda la Fase D construye encima de una herramienta que, hoy, quien
   clone el repo no puede ejecutar. Arreglar el escaparate antes de seguir
   llenandolo.
2. **El limite de WIP es 1**, asi que E6 tiene que estar cerrada (mergeada
   con `taskctl finish`) antes de arrancar cualquier tarea de D. No es una
   preferencia: `taskctl start` aborta si hay otra tarea abierta.

E6 lleva **rama propia**, como cualquier tarea: la crea `taskctl start` y la
mergea `finish` con `--no-ff`, sin borrarla (politica IECA).

Orden sugerido dentro de la Fase D, una vez cerrada E6:

- **D7 primero** (`heuristica-complejidad.yml` + los roles de `agents/`):
  alimenta a D1 y D2, asi que hacerlo despues obligaria a rehacer trabajo.
- **D6 en paralelo** (las 4 skills revisoras): no depende de nada.
- **D4 al final, o no hacerlo.** La decision #17 lo dejo aplicando **solo a
  `trivial`**, y en todo el historial no hay ni una tarea `trivial`: son ~3h
  para un camino que en la practica no se recorre. Conviene decidir si vale
  la pena antes de gastarlas.

**La Fase C se cerró entera el 2026-09-07** con TASK-030 (items C2 y C4), que
fue lo último que le faltaba. Las decisiones #14 y #9 se resolvieron ese mismo
día: la #14 con *commitea sí, sube solo con `--push`*; la #9 con tres claves
opcionales (`rama_base`, `agente_revisor_por_defecto`, `limite_wip`) y, sobre
todo, con la forma del mecanismo. Ver sus entradas en
`CHECKLIST_TERMINACION.md`.

Con A, B y C cerradas, **el corte mínimo defendible está alcanzado**. Lo que
queda es opcional (D, la inteligencia del proceso: brainstorm multi-agente,
heurística de complejidad, revisión ligera) y el cierre (E), donde vive el
item más urgente de los que quedan: **E6**, que el plugin no se distribuye
con un CLI que funcione.

**Decisiones abiertas que siguen bloqueando**: la Fase D depende de la #1,
#2, #11, #15, #16 y #17. Ninguna bloquea la Fase E.

1. ~~**C1**~~ — hecho el 2026-09-06 (TASK-026), ver arriba.
2. **C2** — el paso 5 de la §8.3 (¿`taskctl` commitea y sube por la
   persona?). **Bloqueado por la decisión #14.** La evidencia a favor no
   para de crecer: sin él, `import` no se puede ejecutar dos veces
   seguidas, cada tarea necesita cuatro o cinco commits manuales, y una
   rama cuyo movimiento de tarea no esté commiteado es invisible para el
   límite de WIP (C8).
3. ~~**C3**~~ — hecho el 2026-09-06 (TASK-027), ver arriba.
4. **C4** — `.taskcode` con su `config.yml`. **Bloqueado por la decisión
   #9**, que ya tiene dos candidatos claros a contenido salidos de B7 y C7:
   el tamaño del límite de WIP y qué cuenta como una misma persona.
5. ~~**C5**~~ — hecho el 2026-09-07 (TASK-028), ver arriba.
6. ~~**C6**~~ — hecho el 2026-09-07 (TASK-029). Los cuatro frentes, con
   cuatro agentes en paralelo dentro de la misma rama. Costó ~5h, no la ~1h
   que decía la estimación original (que era de cuando el item era solo el
   bug de `origin`). Dos afirmaciones del plan resultaron falsas al medirlas,
   y el primer arreglo de un hallazgo de revisión también: está en
   `HALLAZGOS.md`.

## Decisiones: ninguna abierta (2026-09-07)

**Las diez decisiones de la lista están resueltas.** Ya no queda ninguna
bloqueando trabajo. Cronología: la #12 y la #13 cerraron la Fase B; la #14 y
la #9 desbloquearon la Fase C el 2026-09-07; y ese mismo día se cerraron de
una tanda las seis que bloqueaban la Fase D — **#1, #2, #11, #15, #16 y
#17**. Están todas en `CHECKLIST_TERMINACION.md` con su razonamiento.

Cuatro de esas seis se decidieron **con datos, no con criterio**, y conviene
que eso no se pierda:

- **#17** (revisión ligera solo para `trivial`): de las 4 tareas `simple`
  cerradas, **una escondía un CRÍTICO** y las cuatro tuvieron importantes.
  Abaratar `simple` habría dejado pasar el peor bug del proyecto.
- **#15** (pesos de la heurística): no se pudieron validar con datos porque
  **no los hay** — el historial entero son 6 `media` y 4 `simple`, sin una
  sola tarea `trivial`, `compleja` ni `crítica`.
- **#11** (plugins instalados): `claude plugin list --json` verificado
  ejecutándolo. Y lo que **no** sirve: `plugin validate`, que solo nombra las
  skills que fallan.
- **#1** (checkpoint humano siempre): hoy ya es obligatorio, así que cuesta
  cero código — y en la sesión del 2026-09-07 tres planes llegaron a
  aprobación con premisas falsas.

Consecuencia para la Fase D que conviene mirar antes de empezarla: como no
existe ninguna tarea `trivial`, **la regla de la #17 casi nunca se activará**,
lo que deja a **D4 (~3h) sin apenas valor**. Merece decidirse si se implementa
antes de gastarlo.

Decidido además el 2026-09-06, fuera de la lista numerada: **la identidad de
una persona es su `git config user.email`** (implementado en C7).

## El entorno cambió

Todo el trabajo hasta el 2026-09-05 se hizo desde un bridge de dispositivo de
Cowork — una VM Linux que montaba la carpeta de Windows. A partir de ahora se
trabaja en **Claude Code nativo en la terminal de IntelliJ, en Windows**.

Consecuencias prácticas: varias limitaciones documentadas en tareas anteriores
eran del bridge, no de Windows, y **ya no aplican** (ver `HALLAZGOS.md`,
sección "Cosas del entorno anterior que ya no aplican"). Y al revés: ahora sí
hay un CLI de Claude Code de verdad, así que se puede por fin probar
`/plugin marketplace add` y `/plugin install` reales — que es lo único que le
queda pendiente a TASK-021.

## Qué acaba de pasar (sesión del 2026-09-16): cierre de la Fase D y de E4/E5

La Fase D se cerró entera desde la última actualización de este documento
(2026-09-08, tras D6/D7). Resumen — el detalle línea a línea de cada una
vive en `CHECKLIST_TERMINACION.md`, no aquí:

1. **D1** — TASK-016: `taskctl plan` deja de ser un scaffold y pasa a
   orquestar el brainstorm paralelo por roles. La revisión por pares más
   dura del proyecto (5 rondas, 6 revisores, 8 CRÍTICOS).
2. **D2** — TASK-017: catálogo de skills determinista con selección en dos
   pasos. 5 rondas de revisión, 35 hallazgos, cero críticos.
3. **D3** — TASK-018: `taskctl review` clasifica el diff real por dominio
   en vez de usar siempre el mismo agente. 2 rondas de revisión, ambas con
   hallazgos IMPORTANTE reales de cobertura de tests, corregidos con
   contraprueba de mutación.
4. **D5** — TASK-020: `taskctl codex-review`, envoltorio del CLI de Codex
   como segunda opinión. 3 rondas de revisión — las dos primeras
   encontraron bugs reales de plataforma en Windows (`spawnSync` sin
   `shell: true` nunca invocaba el binario real; el escapado para
   `cmd.exe` no evitaba que expandiera `%VARIABLE%`, filtrando datos del
   entorno), ambos corregidos y verificados contra el binario real de
   Codex en esta máquina.

Con la Fase D completa, se resolvieron también **E4** y **E5** con
investigación paralela (dos agentes especializados más un agente
orquestador que verificó de forma independiente ambos hallazgos antes de
llegar a Carlos): E4 se cierra documentando que las 12 tareas de Sprint
0+1 se quedan como están (forzar el ciclo real de `taskctl` sobre ellas
ahora es inviable, no solo indeseable: crashearía en 3 de las 12 por una
`rama:` fantasma, y en las otras 9 la revisión saldría sobre un diff
vacío); E5 se cierra borrando `runConfigurations.zip` (era la carpeta
`.idea/` de otro proyecto, ya migrada por completo).

Solo quedan **E1** (TASK-022, guía de incorporación — plan consolidado,
pendiente de `taskctl approve`) y **E2** (TASK-023, métricas de coste en
tokens por fase — sin empezar) para cerrar el proyecto entero.

## Qué acaba de pasar (sesión del 2026-09-16, resto): cierre de E1/TASK-022

**E1 (TASK-022)** — `docs/contexto/INCORPORACION.md`, la guía de
incorporación de colaboradores: acceso, clonar el repo e instalar el
plugin, entender el ciclo de vida (enlazando `SKILL.md` y la sección 13 de
`PROPUESTA_METODOLOGIA.md`, sin duplicarlos) y hacer la primera tarea.
Deja constancia explícita de que hoy no hay colaboradores que invitar
(decisión de Carlos, 2026-09-13) y cierra el punto 8 de la sección 14 en lo
que respecta a a quién se invita — solo en `CHECKLIST_TERMINACION.md`, sin
tocar el documento congelado, mismo patrón que las seis decisiones
anteriores de esa sección.

**Tres rondas de revisión independiente, cero críticos en ninguna,
aprobada en la tercera.** Las dos primeras rondas encontraron algo del
mismo tipo cada vez, en sentidos opuestos: la ronda 1 denunció que la guía
invertía qué tiene el proyecto confirmado sobre `taskctl` resolviendo por
PATH y qué no; la corrección de la ronda 2 arregló la inversión pero se
pasó de frenada al revés, atribuyendo a un job de CI algo que ese CI nunca
prueba (nunca instala un plugin). La ronda 3 confirmó, contrastando frase a
frase contra las cuatro fuentes citadas, que el párrafo final ya no
promete nada que el proyecto no pueda respaldar. Detalle completo con las
citas exactas en el `## Resultado` de `tareas/04-terminadas/TASK-022/tarea.md`.

Con esto, la Fase E queda a un solo item: **E2** (TASK-023, sin empezar).
Cuando se cierre, el proyecto llega al 42/42 (100%).
