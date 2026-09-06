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
asignado_a: charlie.bk@gmail.com
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

- [x] `taskctl start TASK-NNN` crea la rama de verdad (`create-<tipo>.sh`
      via `bash`, nunca ejecucion directa), la confirma con
      `git branch --show-current` y mueve `tarea.md` a `02-en-curso/`
      con `estado: en-curso` actualizado — probado end-to-end contra un
      repo Git temporal para los 4 tipos (`feature`, `fix`, `hotfix`,
      `release`).
      → 8 tests de integracion en `test/commands/start.test.ts`, todos
      contra repos Git reales (sin mocks).
- [x] Rechaza la transicion (sin tocar Git ni mover nada) si la tarea no
      esta en `en-diseno` o si `complejidad` no trivial/simple no tiene
      `plan_aprobado: true` — reusa `assertTransitionAllowed` de TASK-002,
      con test que confirma que no hay efectos secundarios.
      → confirmado (rama sigue en `develop`, tarea sigue en su carpeta
      original tras el rechazo).
- [x] Rechaza el comando (sin invocar el script) si el workspace tiene
      cambios sin commitear, con mensaje claro — no delega en el prompt
      interactivo del script.
      → comprobado con un test que ensucia el repo despues de dejar la
      tarea commiteada, aislando ese caso del de "la propia tarea.md
      esta sin commitear".
- [x] `create-hotfix.sh` y `create-release.sh` toleran un repo sin
      `origin` (mismo guard que TASK-008), con test de regresion que lo
      confirma contra un repo temporal sin remoto.
      → mismo guard `REMOTE_AVAILABLE` que `invoke_merge_work_branch_to_develop`;
      cubierto por los tests de integracion (los 3 repos temporales de
      `fix`/`hotfix`/`release` no configuran `origin`).
- [x] Revision por pares de un agente independiente sobre el diff
      completo (TypeScript + los dos scripts), sin hallazgos criticos
      sin resolver.
      → 0 criticos, 3 importantes (todos corregidos: cobertura de los
      dos guardrails "de evidencia", aserciones completas en los tests
      de fix/hotfix/release, y acotar `tolerateMissingSource` a opt-in
      explicito en vez de tolerancia implicita) y 6 menores (5
      corregidos: `GitLaunchError`/`GitflowScriptLaunchError` tipados,
      `isValidBranchName` como defensa en profundidad, propagacion de
      `signal`, tests de cobertura para `git.ts`/`resolveGitflowScriptsDir`;
      1 no aplicable — nota de entorno sobre Windows nativo, ver
      `docs/spikes/TASK-007-resultado.md`, sigue pendiente igual que en
      TASK-007/TASK-008).

## Resultado

`taskctl start TASK-NNN` implementado y probado end-to-end (115/115 tests
en `npm test`, 15 nuevos: 3 de `moveTareaFile`, 4 unitarios de `git.ts`,
4 unitarios de `gitflow-runner.ts`, 9 de integracion en `start.test.ts`
contra repos Git temporales reales — sin mocks). Ficheros nuevos:
`src/commands/start.ts`, `src/fs/git.ts`, `src/fs/gitflow-runner.ts`;
modificados: `src/fs/task-store.ts` (`moveTareaFile`), `src/cli.ts`
(wiring), `scripts/gitflow/create-hotfix.sh` y `create-release.sh`
(guard de `origin`, precondicion real descubierta al implementar, no
solo documentada).

Revision por pares (agente independiente, `general-purpose`): sin
hallazgos criticos. 3 importantes corregidos (cobertura de los
guardrails de "evidencia, no suposicion"; aserciones completas de
fix/hotfix/release; `tolerateMissingSource` como opt-in explicito en
`moveTareaFile` en vez de tolerancia implicita a cualquier ENOENT). 5
de 6 menores corregidos (errores tipados si `git`/`bash` no estan en el
PATH; validacion de `task.rama` con `git check-ref-format` antes de
invocar el script; propagacion de la senal si el proceso murio por
señal; tests de cobertura para las rutas de `resolveGitflowScriptsDir`
y los errores de `git.ts`). El sexto (matices de Windows nativo con
`bash.exe` de Git for Windows) queda igual que en TASK-007/TASK-008:
sin confirmar desde este bridge de dispositivo (VM Linux), pendiente de
una sesion de Claude Code real en Windows.

**Hallazgo real, no anticipado en el objetivo original**: para tareas
`hotfix` (rama creada desde `main`), Git-Flow cambia de rama antes de
que `taskctl` mueva la carpeta de la tarea, y si `main` no tiene el
historial de `tareas/` (el caso normal), el checkout borra `tarea.md`
del working tree. `moveTareaFile` ahora tolera esto explicitamente
(opcion `tolerateMissingSource`, acotada a esta llamada) y recrea el
fichero con el contenido ya leido en memoria — no se pierde nada, pero
la tarea llega a la rama `hotfix/...` como fichero nuevo sin commitear,
no como un "rename" trackeado por Git. Documentado en
`scripts/gitflow/README.md`.

**No verificado todavia** (bootstrapping): al no existir aun
`taskctl plan`/`taskctl approve` (TASK-010/011), esta misma tarea
(TASK-009) no puede pasar por `taskctl start` de verdad — se queda en
`estado: planificada` en su frontmatter aunque el trabajo este hecho,
igual que TASK-001/002/003/007. El comando SI se probo de punta a
punta, pero contra repos Git temporales de test, no contra el propio
TaskCode.

Trabajo commiteado en la rama
`feature/task-009-taskctl-start-crea-rama-via-create-tipo` y mergeado a
`develop`.
