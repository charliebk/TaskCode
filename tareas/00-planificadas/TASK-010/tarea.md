---
id: TASK-010
titulo: "taskctl plan: version minima, un solo agente redacta plan-final.md"
tipo: feature
sprint: 1
etiquetas: [cli, taskctl, diseno]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-010-taskctl-plan-version-minima-un-solo-agen
asignado_a: charlie.bk
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-002]
---
## Objetivo

Implementar `taskctl plan <TASK-ID>`: version MINIMA de la fase de
diseno (seccion 6 de la metodologia). La version completa (contexto
determinista desde `docs/INDEX.md`, gatekeeper barato con Haiku,
seleccion de skill 6.6, brainstorm multi-agente en paralelo por rol,
agente unificador) es Sprint 3 (TASK-016/017) — fuera de alcance aqui a
proposito, igual que TASK-009 dejo la precondicion completa de rama
base (8.3) para TASK-012.

Lo que SI hace esta version, con el mismo espiritu que ya establecio
`taskctl new` con el cuerpo de `tarea.md` (Objetivo/Criterios en blanco
para rellenar despues):

1. Validar la transicion con `assertTransitionAllowed('plan', ...)`
   (TASK-002): primera vez desde `planificada`, o re-planificacion desde
   `en-diseno` con `plan_aprobado: false`.
2. Mover la tarea a `01-en-diseno/` (reusa `moveTareaFile` de TASK-009 —
   sirve tal cual, sin necesidad de tocar Git; validacion extra de que
   esa funcion es reutilizable mas alla de su caso original).
3. Dejar un scaffold de `plan-final.md` listo para que un agente (o una
   persona, en uso interactivo real de Claude Code) lo redacte
   despues — el contenido real del plan NO lo genera el CLI (no hay
   orquestacion de agentes en este Node CLI todavia; eso llega con
   TASK-016). Si `plan-final.md` ya existe (caso de re-planificacion),
   se deja intacto, no se pisa.

`taskctl approve` (TASK-011) ya comprueba en TASK-002 que exista
`plan-final.md` (`ctx.planFinalExiste`) antes de dejar aprobar — este
comando es lo que lo deja listo para esa comprobacion.

## Criterios de aceptacion

- [x] `taskctl plan TASK-NNN` mueve la tarea de `00-planificadas/` a
      `01-en-diseno/` y crea `plan-final.md` con un scaffold, cuando la
      tarea esta en `planificada`.
      → confirmado con test y con ejecucion manual real del CLI contra
      un repo temporal.
- [x] Re-planificacion: si la tarea ya esta en `en-diseno` con
      `plan_aprobado: false`, vuelve a ejecutar sin fallar, NO pisa un
      `plan-final.md` ya existente, y sigue actualizando `actualizado`.
      → confirmado con test (contenido custom del plan intacto tras la
      segunda invocacion) y manualmente por CLI.
- [x] Rechaza el comando (sin tocar nada) si la tarea no existe, si esta
      en un estado que no admite `plan` (p. ej. `en-curso`), o si ya
      tiene `plan_aprobado: true` — reusa `assertTransitionAllowed` de
      TASK-002, con test que confirma que no hay efectos secundarios.
      → 4 tests distintos cubren estos casos.
- [x] Revision por pares de un agente independiente sobre el diff
      completo, sin hallazgos criticos sin resolver.
      → 0 criticos, 0 importantes, 4 menores (todos corregidos):
      `TaskFolderConflictError` no se capturaba en `cli.ts` (aplica
      tambien al comando `start`, ya existente); `isEexist` estaba
      duplicada respecto a `task-store.ts` (ahora exportada y
      reutilizada); comentario aclarando por que `plan-final.md` no
      pasa por `writeTareaFile` (no tiene frontmatter); faltaba test
      para la rama de error de escritura que no es `EEXIST`.

## Resultado

`taskctl plan TASK-NNN` implementado (version minima, sin gatekeeper ni
brainstorm multi-agente, esos llegan con TASK-016/017 de Sprint 3).
Valida la transicion con la maquina de estados de TASK-002, mueve la
tarea a `01-en-diseno/` reutilizando `moveTareaFile` de TASK-009 sin
modificarla (confirma que la abstraccion es genuinamente reusable mas
alla de su caso original de Git-Flow), y deja un scaffold de
`plan-final.md` para que un agente o una persona lo redacte despues —
mismo patron que `taskctl new` ya usa con el cuerpo de `tarea.md`.

Revision por pares (agente independiente, `general-purpose`): 0
criticos, 0 importantes, 4 menores, todos corregidos: `cli.ts` no
capturaba `TaskFolderConflictError` en ningun comando (afectaba tambien
a `start`, ya en produccion — corregido con un helper `printCliError`
que evita ademas duplicar el prefijo `[ERROR]` cuando el error ya lo
trae); `isEexist` estaba duplicada respecto a la misma funcion privada
de `task-store.ts` (ahora exportada y compartida); se documento por que
`plan-final.md` se escribe directo con `fs/promises` en vez de pasar
por `writeTareaFile` (no tiene frontmatter, no encaja en el modelo
`Task`); y se anadio el test que faltaba para la rama de error que no
es `EEXIST` (forzado con un directorio sin permiso de escritura,
`EACCES` — el primer intento con un `plan-final.md` como directorio no
sirvio: `writeFile` con flag `wx` devuelve `EEXIST` incluso si el path
es un directorio, no `EISDIR`, hallazgo propio durante la correccion).

122/122 tests, `plan.js` al 100% de lineas/ramas/funciones. Probado
tambien manualmente con el CLI real contra un repo temporal (primera
vez y re-planificacion).

**No verificado todavia** (bootstrapping, mismo motivo que
TASK-001/002/003/007/009): TASK-010 se queda en `estado: planificada`
en su propio frontmatter — no puede pasar por su propio `taskctl plan`
hasta que este commit este mergeado y probado, y de todas formas mover
tareas de metodologia a mano contradice el principio del sistema.

Trabajo commiteado en la rama
`feature/task-010-taskctl-plan-version-minima-un-solo-agen` y mergeado
a `develop`.
