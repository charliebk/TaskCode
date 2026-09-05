# Estado del proyecto — handoff

> Última actualización: **2026-09-05**. Este documento se actualiza al cerrar
> cada fase. Si lo que dice no cuadra con el repo, gana el repo — y hay que
> corregir esto.

## Dónde estamos

**23 de 40 items del plan de terminación (58%).** Sprint 0 y Sprint 1
completos (TASK-001 a TASK-012), y **las Fases A y B cerradas enteras**.

**El ciclo de vida está completo y ya tiene reglas de proceso encima**:
`import → plan → approve → start → review → finish` funciona de punta a
punta contra un repo Git real; TASK-013, TASK-014 y TASK-015 se
gestionaron enteras con la propia herramienta. Desde B6 el campo
`asignado_a` se rellena de verdad, y desde B7 nadie puede tener dos ramas
de trabajo abiertas a la vez. 345 tests.

Lo que queda son las Fases C (tapar huecos), D (la cara y opcional) y E
(cierre). **El corte mínimo defendible ya solo depende de la Fase C.**

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

**Pendiente operativo**: `develop` ya está en `origin` (`origin/develop` y
`develop` coincidían al empezar la sesión del 2026-09-05, tarde: la nota
anterior sobre cinco merges sin subir ya no aplica). La rama
`feature/b6-asignado-a-en-plan-y-start` y
`feature/task-015-limite-de-trabajo-en-curso-por-persona` sí están pendientes
de `git push`, igual que los merges de B6 y B7 en `develop`.

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

## Qué sigue: Fase C (0 de 6), ~10h

Con A y B cerradas, **el corte mínimo defendible ya solo depende de la
Fase C**: lo que la metodología da por hecho y no existe.

1. **C1** — wrappers `diagnose`, `pause`, `resume`, `recover` y
   `abort-merge` (~3h). La §8.3 ya le dice al usuario "guárdalos con
   `taskctl pause`", un comando que no existe.
2. **C2** — el paso 5 de la §8.3 (¿`taskctl` commitea y sube por la
   persona?). **Bloqueado por la decisión #14.** Hay evidencia acumulada
   a favor: sin él, `import` no se puede ejecutar dos veces seguidas, y
   el propio ciclo de TASK-015 necesitó cuatro commits manuales.
3. **C3** — subcarpetas de planificación y revisión (~1h). `review` ya
   crea la de revisión; falta la de planificación y mover ahí
   `plan-final.md`.
4. **C4** — `.taskcode` con su `config.yml`. **Bloqueado por la decisión
   #9.** B7 le acaba de dar dos candidatos a contenido: el tamaño del
   límite de WIP y qué cuenta como una misma persona.
5. **C5** — la primera skill del plugin (~1h).
6. **C6** — bug de `origin` en los 3 scripts que siguen sin guard.

## Decisiones abiertas que dependen de Carlos

Están listadas con su bloqueo al final de `CHECKLIST_TERMINACION.md`. Para la
Fase B solo importa la **#13**. Las demás bloquean las Fases C y D.

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
