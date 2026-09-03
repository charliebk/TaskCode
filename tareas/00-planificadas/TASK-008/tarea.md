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

- [x] Los 23 ficheros están en `scripts/gitflow/`. **El bit de ejecución NO
      se conserva en este repo** — hallazgo nuevo, no un incumplimiento del
      criterio: `core.fileMode=false` (Git lo puso así solo, el filesystem
      del bridge de dispositivo no preserva `+x` de forma fiable), así que
      cualquier commit deja los `.sh` en `100644`. Se resuelve documentando
      que `taskctl` debe invocar siempre `bash "$CLAUDE_PLUGIN_ROOT/scripts/gitflow/...sh"`,
      nunca por ruta directa — ver `scripts/gitflow/README.md` y sección
      7.1 de la metodología, ya actualizadas.
- [x] `_gitflow-common.sh` tiene los dos ajustes de arriba y ningún otro
      cambio de lógica (diff mínimo, revisable línea a línea).
      → confirmado por el agente revisor: diff exacto a los dos hunks
      descritos, los otros 23 ficheros son copia byte a byte del zip.
      Se añadió un tercer micro-ajuste tras la revisión (ver Resultado).
- [x] Prueba de regresión automatizada que reproduce, contra un repo Git
      temporal sin `origin`: crear una rama con `create-feature.sh` (debe
      seguir funcionando como en TASK-007) y luego mergearla con
      `merge-feature-to-develop.sh` (debía fallar antes del ajuste 2, debe
      funcionar después).
      → `scripts/gitflow/test/smoke-test.sh`, 6/6 comprobaciones en verde.
- [x] Prueba de que `log_dir` resuelve dentro del repo del usuario y no
      dentro de la instalación del plugin, invocando el script desde una
      profundidad de carpetas distinta a la original de `.idea/`.
      → cubierto por el mismo smoke test (comprueba explícitamente que no
      se crea `logs/` dentro de `scripts/gitflow/`).
- [x] Revisión por pares de un agente independiente sobre el diff de
      `_gitflow-common.sh`, sin hallazgos críticos sin resolver.
      → 0 críticos, 0 importantes, 1 menor (corregido: log huérfano si se
      invoca fuera de cualquier repo Git).

## Resultado

Los 23 scripts viven en
`taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/`, con
`README.md` propio documentando los ajustes y lo que queda pendiente.
Tres cambios de lógica en `_gitflow-common.sh` en total (los dos previstos
+ uno menor que salió de la revisión por pares), todos con comentario
`# Ajuste TASK-008` en el código y cubiertos por
`scripts/gitflow/test/smoke-test.sh`.

**Hallazgo nuevo, documentado pero NO corregido en esta tarea** (para
mantener el diff acotado y revisable): el mismo bug de "`fetch origin` sin
comprobar disponibilidad" del ajuste 2 aparece también, con su propia copia
de lógica, en `create-develop.sh`, `create-hotfix.sh`, `create-release.sh`,
`merge-hotfix-to-main.sh`, `merge-release-to-main.sh`, `recover-branch.sh`
y `resume-work.sh`. Hoy, en un repo sin `origin` (como `TaskCode` mismo),
`taskctl start`/`finish` fallarían para tareas `hotfix`/`release`. Queda
como precondición explícita de TASK-009 y TASK-014 — ver
`scripts/gitflow/README.md`.

Trabajo commiteado en la rama `feature/task-008-migrar-scripts-git-flow-a-scripts-gitflo`
y mergeado a `develop`.
