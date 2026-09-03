---
id: TASK-009
titulo: "taskctl start: crea rama via create-tipo.sh y mueve tarea a en-curso"
tipo: feature
sprint: 1
etiquetas: [gitflow, cli, taskctl]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-009-taskctl-start-crea-rama-via-create-tipo
asignado_a: charlie.bk
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-002, TASK-008]
---
## Objetivo

Implementar `taskctl start <TASK-ID>`: primer comando de taskctl que toca
Git de verdad. Dada una tarea en estado `en-diseno` (la maquina de estados
de TASK-002 ya exige plan aprobado salvo `trivial`/`simple`), el comando
debe:

1. Validar la transicion con `assertTransitionAllowed('start', ...)`
   (TASK-002) antes de tocar nada.
2. Comprobar que el workspace esta limpio (`git status --porcelain`)
   ANTES de invocar el script — precondicion minima, no la version
   completa de la seccion 8.3 (auto-switch de rama base), que es
   TASK-012. Sin esta comprobacion, un workspace sucio delega en el
   prompt interactivo `ensure_workspace_ready` de
   `_gitflow-common.sh`, cuyo comportamiento con stdin no interactivo
   ya establecio TASK-007 (hallazgo 3): EOF => "No" => `exit 0`,
   indistinguible de un exito real para un caller programatico.
3. Invocar `bash "<scripts/gitflow>/create-<tipo>.sh" "<rama>"` con
   `stdin: ignore` (nunca `inherit`) para que, si por lo que sea SI se
   alcanza un prompt interactivo, `read -rp` reciba EOF de forma
   determinista en vez de bloquear el proceso — nunca por ruta
   directa, siguiendo la convencion ya documentada en
   `scripts/gitflow/README.md` (TASK-008, hallazgo del bit ejecutable).
4. Verificar con evidencia, no suposicion (principio de TASK-007): tras
   un exit code 0, confirmar con `git branch --show-current` que la
   rama activa es de verdad `task.rama` antes de dar la tarea por
   iniciada.
5. Mover la carpeta de la tarea a `02-en-curso/` y actualizar
   `estado`/`actualizado` en el frontmatter.

**Precondicion descubierta al implementar**: `create-hotfix.sh` y
`create-release.sh` hacen `fetch`/`pull`/`push` contra `origin` sin
comprobar disponibilidad primero — el mismo bug que TASK-008 corrigio en
`invoke_merge_work_branch_to_develop` y dejo documentado como hallazgo
abierto para estos dos scripts en concreto (`scripts/gitflow/README.md`).
A diferencia de TASK-008, aqui SI esta en alcance corregirlo: sin ese
ajuste, `taskctl start` fallaria siempre para tareas `tipo: hotfix` o
`tipo: release` en un repo sin origin (como el propio TaskCode). Se aplica
el mismo guard ya probado (`git ls-remote --heads origin` ->
`REMOTE_AVAILABLE`), sin tocar el resto de su logica.

## Criterios de aceptacion

- [ ] `taskctl start TASK-NNN` crea la rama de verdad (`create-<tipo>.sh`
      via `bash`, nunca ejecucion directa), la confirma con
      `git branch --show-current` y mueve `tarea.md` a `02-en-curso/`
      con `estado: en-curso` actualizado — probado end-to-end contra un
      repo Git temporal para los 4 tipos (`feature`, `fix`, `hotfix`,
      `release`).
- [ ] Rechaza la transicion (sin tocar Git ni mover nada) si la tarea no
      esta en `en-diseno` o si `complejidad` no trivial/simple no tiene
      `plan_aprobado: true` — reusa `assertTransitionAllowed` de TASK-002,
      con test que confirma que no hay efectos secundarios.
- [ ] Rechaza el comando (sin invocar el script) si el workspace tiene
      cambios sin commitear, con mensaje claro — no delega en el prompt
      interactivo del script.
- [ ] `create-hotfix.sh` y `create-release.sh` toleran un repo sin
      `origin` (mismo guard que TASK-008), con test de regresion que lo
      confirma contra un repo temporal sin remoto.
- [ ] Revision por pares de un agente independiente sobre el diff
      completo (TypeScript + los dos scripts), sin hallazgos criticos
      sin resolver.
