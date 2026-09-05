---
id: TASK-007
titulo: "Spike: validar scripts Git-Flow (.sh) vía Bash tool en Windows/IntelliJ"
tipo: fix
sprint: 0
etiquetas: [spike, gitflow, windows]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-007-spike-gitflow-windows
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: []
---
## Objetivo

Confirmar con evidencia (no supuesto) si los scripts `.sh` de
`runConfigurations.zip` corren sin modificar cuando se invocan desde el
Bash tool de Claude Code en la terminal de IntelliJ en Windows, incluyendo
el caso de rutas largas / el workaround de nombre corto 8.3 mencionado en
la metodología.

## Criterios de aceptación

- [x] Al menos un script de creación de rama (`create-feature.sh` o
      equivalente) ejecutado con éxito desde el Bash tool, con log adjunto.
      → `create-fix.sh` y `diagnose-repo.sh` ejecutados sin modificación
      contra el repo real, con log completo en
      `docs/spikes/TASK-007-resultado.md`.
- [x] Si falla, causa raíz identificada (PATH, intérprete, rutas) y
      documentada en `docs/PROPUESTA_METODOLOGIA.md` sección 14 como
      decisión ya resuelta, con la solución aplicada.
      → sección 14, punto 7: marcada "parcialmente resuelta" (ver más abajo
      por qué no es un "resuelta" sin reservas).
- [ ] Resultado (éxito o el workaround necesario) incorporado a TASK-008
      como precondición antes de migrar los scripts al plugin.
      → hallazgos 1 y 3 de `docs/spikes/TASK-007-resultado.md` quedan como
      precondición concreta para TASK-008/009; no marcado como hecho del
      todo porque TASK-008 en sí no se ha ejecutado todavía.

## Resultado

Ver `docs/spikes/TASK-007-resultado.md` para el detalle completo, logs y
hallazgos. Resumen: los scripts funcionan sin modificación en un Bash real
contra un repo real (incluido el modo offline sin `origin`), pero la
prueba se hizo desde el bridge de dispositivo de esta sesión (una VM
Linux), no desde una sesión de Claude Code nativa dentro de IntelliJ en
Windows — esa validación más estricta sigue pendiente. Se encontraron y
documentaron 3 hallazgos con impacto directo en TASK-008/009 (Sprint 1):
el cálculo de `log_dir` en `_gitflow-common.sh` debe cambiar a
`git rev-parse --show-toplevel` antes de migrar los scripts, el scaffold
de cualquier proyecto nuevo debe traer `logs/` en `.gitignore` desde el
principio, y los comandos `merge`/`update` con confirmación interactiva
necesitarán un mecanismo no interactivo (`--yes`) para que `taskctl` pueda
invocarlos.

Esta tarea permanece en `planificada` en vez de moverse a `terminada`
porque `taskctl` todavía no tiene los comandos de ciclo de vida
(`start`/`review`/`finish`, Sprint 1-2) — mover la carpeta a mano
contradiría el propio principio del sistema de no depender de que alguien
se acuerde de hacerlo manualmente. El trabajo real está commiteado en la
rama `fix/task-007-spike-gitflow-windows`.
