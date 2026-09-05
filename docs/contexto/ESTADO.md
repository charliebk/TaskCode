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

## Qué acaba de pasar (sesión del 2026-09-05)

1. **El repo tiene remoto**: `github.com/charliebk/TaskCode`, privado, con las
   11 ramas subidas y `develop` como rama por defecto. Antes todo vivía en un
   solo disco sin copia — era el riesgo estructural más serio del proyecto.
   Release `v0.1.0` publicada.
2. **CI en GitHub Actions**, y aquí está el resultado que más desbloquea: el
   job de **Windows nativo** contestó en verde las cinco preguntas que
   llevaban abiertas desde TASK-006/007 y que ninguna sesión podía responder
   (ver `HALLAZGOS.md`, sección "Windows"). También pasó `claude plugin
   validate` para el plugin y para el marketplace.
3. **El backlog es real**: TASK-013 a TASK-023 existen ya como carpetas de
   tarea, creadas con `taskctl import` (dogfooding), no como filas de una
   tabla.
4. **`docs/METRICAS.md` al día** con las 12 tareas cerradas y agregados
   nuevos: 50 hallazgos de revisión por pares en 9 rondas, 84% corregidos, y
   ni un crítico ni un importante abierto.

## Qué sigue: Fase B (7 items, ~18h)

Orden recomendado, porque cada uno desbloquea al siguiente:

1. **B2** — corregir el bug de `origin` en `merge-hotfix-to-main.sh` y
   `merge-release-to-main.sh`. Es precondición real de B3 y son ~30 min.
2. **B1** — TASK-013, `taskctl review`.
3. **B3** — TASK-014, `taskctl finish`. Aquí se destapa el riesgo ya
   documentado de colisión de IDs entre `main` y `develop` al hacer backmerge.
4. **B4** — crear `CHANGELOG.md`, `docs/INDEX.md` y `docs/BOARD.md`, que B3
   promete actualizar y hoy no existen.
5. **B5** — resolver la divergencia de `board`: la metodología dice que
   regenera `docs/BOARD.md`, lo implementado es un listado por pantalla.
6. **B6** — añadir `--asignado-a` a `plan` y `start`. Sin esto nadie rellena
   `asignado_a` y B7 no tiene sobre qué operar.
7. **B7** — TASK-015, límite de WIP. **Bloqueado por la decisión #13**: ¿un
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
