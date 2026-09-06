# Estado del proyecto — handoff

> Última actualización: **2026-09-06** (tras cerrar C1). Este documento se
> actualiza al cerrar cada fase. Si lo que dice no cuadra con el repo, gana
> el repo — y hay que corregir esto.

## Dónde estamos

**26 de 42 items del plan de terminación (62%).** Sprint 0 y Sprint 1
completos (TASK-001 a TASK-012), **las Fases A y B cerradas enteras**, y la
Fase C empezada (3 de 8).

**El ciclo de vida está completo y con reglas de proceso encima que de
verdad se aplican**: `import → plan → approve → start → review → finish`
funciona de punta a punta contra un repo Git real, y TASK-013, 014, 015,
024, 025 y 026 se gestionaron enteras con la propia herramienta.
`asignado_a` se rellena solo con `git config user.email` (C7), el límite de
una rama de trabajo por persona funciona mirando las ramas reales (C8), y
los cinco wrappers de Git-Flow ya existen (C1). **417 tests.**

Lo que queda son las Fases C (tapar huecos, 5 items), D (la cara y
opcional) y E (cierre). **El corte mínimo defendible ya solo depende de la
Fase C.**

**Nada pendiente de subir**: `develop` está a la par con `origin/develop` y
las ramas de tarea de esta sesión también.


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

**Lo que C1 le descubrió a C6**, ya anotado en su entrada del checklist: el
registro dentro del repo deja `taskctl resume` inservible en repos que no lo
ignoren; los mensajes de los scripts siguen remitiendo a los menús de
IntelliJ ("usa GitFlow 16 Pause Work") ahora que esos comandos existen; y
`abort-merge.sh` dice "estado normal" con un cherry-pick o un revert a
medias.

**Limitación que queda a propósito**: `taskctl pause` sigue sin servirle a un
agente sin terminal, que es quien más lo necesitaría. Resolverlo pide un
`pause --stash` / `--commit`, o sea tocar los scripts, que es la capa que la
§7.1 declara única fuente de verdad. No se hizo por cuenta propia.

## Qué sigue: Fase C (3 de 8), ~8h

Con A y B cerradas, **el corte mínimo defendible ya solo depende de la
Fase C**: lo que la metodología da por hecho y no existe.

El siguiente item libre es **C3**. C2 y C4 siguen bloqueados.

1. ~~**C1**~~ — hecho el 2026-09-06 (TASK-026), ver arriba.
2. **C2** — el paso 5 de la §8.3 (¿`taskctl` commitea y sube por la
   persona?). **Bloqueado por la decisión #14.** La evidencia a favor no
   para de crecer: sin él, `import` no se puede ejecutar dos veces
   seguidas, cada tarea necesita cuatro o cinco commits manuales, y una
   rama cuyo movimiento de tarea no esté commiteado es invisible para el
   límite de WIP (C8).
3. **C3** — subcarpetas de planificación y revisión (~1h). `review` ya crea
   la de revisión; falta la de planificación y mover ahí `plan-final.md`.
4. **C4** — `.taskcode` con su `config.yml`. **Bloqueado por la decisión
   #9**, que ya tiene dos candidatos claros a contenido salidos de B7 y C7:
   el tamaño del límite de WIP y qué cuenta como una misma persona.
5. **C5** — la primera skill del plugin (~1h).
6. **C6** — bug de `origin` en los 3 scripts que siguen sin guard, **más
   las tres cosas que le dejó C1** (registro dentro del repo, mensajes que
   remiten a los menús de IntelliJ, cherry-pick que `abort-merge.sh` no ve).
   Ha crecido: cuenta ~2h, no 1h.

## Decisiones abiertas que dependen de Carlos

Están listadas con su bloqueo al final de `CHECKLIST_TERMINACION.md`. Van dos
resueltas de once: la #12 y la #13 (límite de WIP, que cerró la Fase B). De
las que quedan, **#14 y #9 bloquean la Fase C** (items C2 y C4); el resto
bloquea la Fase D.

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
