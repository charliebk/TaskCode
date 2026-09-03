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
asignado_a: null
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

- [ ] Al menos un script de creación de rama (`create-feature.sh` o
      equivalente) ejecutado con éxito desde el Bash tool, con log adjunto.
- [ ] Si falla, causa raíz identificada (PATH, intérprete, rutas) y
      documentada en `docs/PROPUESTA_METODOLOGIA.md` sección 14 como
      decisión ya resuelta, con la solución aplicada.
- [ ] Resultado (éxito o el workaround necesario) incorporado a TASK-008
      como precondición antes de migrar los scripts al plugin.
