---
id: TASK-021
titulo: "Publicar el marketplace y la versión v0.1.0 del plugin"
tipo: feature
sprint: 4
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-021-publicar-el-marketplace-y-la-version-v0
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-006]
---
## Objetivo


## Criterios de aceptacion
- [ ] Repo privado en GitHub con el layout monorepo de la sección 7.10, y `marketplace.json` validado contra el schema oficial.
- [ ] Tag `v0.1.0` publicado y el campo `version` del marketplace y del plugin alineados con él.
- [ ] Probado de verdad, no supuesto: `/plugin marketplace add` seguido de `/plugin install` desde una sesión de Claude Code real.
- [ ] Deja registrado el comportamiento real de `/plugin marketplace update`, que es el punto 10 de la sección 14.

## Avance parcial (2026-09-05, Fase A del plan de terminación)

Esta tarea se adelantó de Sprint 4 a la Fase A porque el repo no tenía
remoto: todo Sprint 0 y 1 vivía en un solo disco sin copia, y era el riesgo
estructural abierto más serio del proyecto.

Ya hecho:

- Repo privado `github.com/charliebk/TaskCode` creado, con las 11 ramas
  subidas (política IECA: no se borra ninguna tras el merge) y `develop`
  como rama por defecto.
- `.claude-plugin/marketplace.json` en la raíz del repo, contra el schema
  oficial verificado. El `source` apunta a `./taskcode-marketplace/plugins/taskcode-plugin`,
  así que el layout monorepo de la sección 7.10 funciona sin partir el repo.
- Decidido no declarar `relevance`: la documentación oficial dice que solo
  surte efecto en marketplaces que un administrador incluya en managed
  settings, así que en un marketplace privado personal no haría nada. Eso
  cierra el punto 12 de la sección 14.
- README.md en la raíz del repo (no existía) y CI en GitHub Actions.

Queda pendiente para cerrar la tarea:

- Publicar el tag `v0.1.0`.
- Probar de verdad `/plugin marketplace add charliebk/TaskCode` y
  `/plugin install taskcode-plugin@taskcode-marketplace` desde una sesión
  de Claude Code real — no se puede hacer desde esta sesión (ni el
  contenedor cloud ni el bridge exponen un CLI interactivo de Claude Code).
- Dejar registrado el comportamiento real de `/plugin marketplace update`
  (punto 10 de la sección 14).
