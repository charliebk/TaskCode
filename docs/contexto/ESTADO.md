# Estado del proyecto — handoff

> Última actualización: **2026-09-07** (tras cerrar C5). Este documento se
> actualiza al cerrar cada fase. Si lo que dice no cuadra con el repo, gana
> el repo — y hay que corregir esto.

## Dónde estamos

**31 de 43 items del plan de terminación (72%).** Sprint 0 y Sprint 1
completos (TASK-001 a TASK-012), y **las Fases A, B y C cerradas enteras**.
El total subió de 42 a 43 items: la revisión de C5 abrió uno nuevo, **E6**
(la distribución del CLI del plugin).

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

Lo que queda son las Fases D (la cara y opcional) y E (cierre). **El corte
mínimo defendible —Fases A + B + C— está alcanzado**: el sistema es completo
y usable, y lo que falta son mejoras y el empaquetado.

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

## Qué sigue: Fases D y E

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
