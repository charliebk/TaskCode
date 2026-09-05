# Estado del proyecto — handoff

> Última actualización: **2026-09-05**. Este documento se actualiza al cerrar
> cada fase. Si lo que dice no cuadra con el repo, gana el repo — y hay que
> corregir esto.

## Dónde estamos

**21 de 40 items del plan de terminación (53%).** Sprint 0 y Sprint 1
completos (TASK-001 a TASK-012), la Fase A cerrada, y de la Fase B ya están
B1, B2, B3, B4 y B5.

**El ciclo de vida está completo**: `import → plan → approve → start →
review → finish` funciona de punta a punta contra un repo Git real, y no de
forma teórica — TASK-013 y TASK-014 se gestionaron enteras con la propia
herramienta, incluido el cierre (`taskctl finish` mergeó su propia tarea).
275 tests, ~95% de cobertura de líneas.

Quedan **B6** (`--asignado-a` en `plan` y `start`) y **B7** (límite de WIP,
bloqueado por la decisión #13) para cerrar la fase.

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

**Pendiente operativo**: `develop` acumula cinco merges **sin subir a
`origin`**. Hay que hacer `git push origin develop` (y las ramas nuevas)
cuando se decida.

## Qué sigue: Fase B (quedan 2 de 7)

1. **B6** — añadir `--asignado-a` a `plan` y `start`. Sin esto nadie rellena
   `asignado_a`, y B7 no tiene sobre qué operar (`board --asignado_a` filtra
   hoy por un campo siempre vacío). ~2h.
2. **B7** — TASK-015, límite de WIP. **Bloqueado por la decisión #13**: ¿un
   único límite (una sola tarea activa de punta a punta) o dos independientes,
   diseño y ejecución por separado? Hay que preguntárselo a Carlos antes de
   implementar.
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
