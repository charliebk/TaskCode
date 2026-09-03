---
id: TASK-008
titulo: "Migrar scripts Git-Flow a scripts/gitflow/ del plugin"
tipo: feature
sprint: 1
etiquetas: [gitflow, plugin, migracion]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-008-migrar-scripts-git-flow-a-scripts-gitflo
asignado_a: charlie.bk
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-006, TASK-007]
---
## Objetivo

Mover los 23 ficheros de `runConfigurations.zip`
(`_gitflow-common.sh` + 22 scripts `create-*`/`update-*`/`merge-*`/etc.) a
`taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/`, sin tocar
su lógica interna, **salvo los dos ajustes que TASK-007 ya identificó como
precondición** (`docs/spikes/TASK-007-resultado.md`, hallazgos 1 y 4):

1. `log_dir` en `_gitflow-common.sh` (usado por `initialize_gitflow_log`)
   asume que el script vive 3 niveles bajo la raíz del proyecto
   (`.idea/runConfigurations/local_git-flow-actions/`). En la nueva
   ubicación (`scripts/gitflow/`, dentro del plugin instalado) ese cálculo
   aterrizaría fuera del repo del usuario. Cambiar a
   `git rev-parse --show-toplevel`, igual que ya hace
   `warn_lfs_and_submodules` en el mismo fichero.
2. `invoke_merge_work_branch_to_develop` falla duro (`exit 1`) si no hay
   `origin` configurado, a diferencia de `invoke_create_work_branch`, que sí
   comprueba disponibilidad del remoto antes de tocarlo. Llevar el mismo
   guard (`git ls-remote --heads origin` → `remote_available`) a la función
   de merge, para que `taskctl finish` (TASK-014) no falle en un repo sin
   remoto — como el propio TaskCode hasta que exista TASK-021.

## Criterios de aceptación

- [ ] Los 23 ficheros están en `scripts/gitflow/`, con permisos de
      ejecución conservados.
- [ ] `_gitflow-common.sh` tiene los dos ajustes de arriba y ningún otro
      cambio de lógica (diff mínimo, revisable línea a línea).
- [ ] Prueba de regresión automatizada que reproduce, contra un repo Git
      temporal sin `origin`: crear una rama con `create-feature.sh` (debe
      seguir funcionando como en TASK-007) y luego mergearla con
      `merge-feature-to-develop.sh` (debía fallar antes del ajuste 2, debe
      funcionar después).
- [ ] Prueba de que `log_dir` resuelve dentro del repo del usuario y no
      dentro de la instalación del plugin, invocando el script desde una
      profundidad de carpetas distinta a la original de `.idea/`.
- [ ] Revisión por pares de un agente independiente sobre el diff de
      `_gitflow-common.sh`, sin hallazgos críticos sin resolver.
