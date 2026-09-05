---
id: TASK-014
titulo: "Comando taskctl finish (merge, cierre y actualización del tablero)"
tipo: feature
sprint: 2
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-014-comando-taskctl-finish-merge-cierre-y-ac
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-013]
---
## Objetivo

Cerrar el ciclo de vida de una tarea: `taskctl finish TASK-NNN` exige la
revisión aprobada (leyendo el veredicto del informe de revisión, fuente
determinista), mergea la rama con el script Git-Flow del tipo (con tag y
backmerge para hotfix/release), verifica con evidencia Git que los merges
ocurrieron, detecta la colisión de IDs entre `main` y `develop` antes de
mergear, mueve la carpeta a `04-terminadas/` y renderiza `CHANGELOG.md`,
`docs/INDEX.md` y `docs/BOARD.md` desde el frontmatter (cero LLM).

## Criterios de aceptacion
- [ ] Valida la transición `en-revision` → `terminada`, exigiendo revisión aprobada y, si `revision_codex` es true, también la de Codex.
- [ ] Invoca el `merge-<tipo>-to-develop.sh` o `merge-<tipo>-to-main.sh` que corresponda, con el guard de `origin` ya corregido en esos scripts.
- [ ] Mueve la tarea a `04-terminadas/` y actualiza `CHANGELOG.md`, `docs/INDEX.md` y `docs/BOARD.md`.
- [ ] Para `hotfix` y `release` hace el backmerge a `develop` y resuelve el riesgo ya documentado de colisión de IDs de tarea entre `main` y `develop`.
- [ ] Tests contra repo Git temporal real para los cuatro tipos de tarea, incluido el backmerge.
