---
id: TASK-012
titulo: "Precondicion de rama base + workspace limpio (seccion 8.3), con auto-switch si esta limpio"
tipo: feature
sprint: 1
etiquetas: [cli, taskctl, gitflow, precondicion]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-012-precondicion-de-rama-base-workspace-limp
asignado_a: charlie.bk
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-009, TASK-010, TASK-011]
---
## Objetivo

Implementar la seccion 8.3 de la metodologia para los tres comandos que
ya existen y escriben directamente en la rama activa sin abrir la suya
propia: `taskctl new`, `taskctl plan` y `taskctl approve` (`taskctl
import`, TASK-004, todavia no existe — la funcion que se construya aqui
queda lista para que la reuse cuando llegue, igual que `moveTareaFile` se
reutilizo sin tocar en TASK-010 y TASK-011).

Alcance exacto (los 4 primeros pasos de la seccion 8.3, que es
literalmente lo que dice el titulo de esta tarea en PLAN_SPRINTS.md —
"con auto-switch si esta limpio"):

1. Resolver la rama base esperada segun el `tipo` de la tarea: `develop`
   para feature/fix/release, `main`/`master` para hotfix (mismo algoritmo
   que ya usa `resolve_main_branch` en `_gitflow-common.sh`: preferencia
   por `origin/main`, luego `origin/master`, luego ref local `main`,
   luego ref local `master`, `master` por defecto si nada de eso
   resuelve). Reimplementado en TypeScript (no invocado via Bash) porque
   `resolve_main_branch` es una funcion interna de `_gitflow-common.sh`
   pensada para ser *sourceada* por los scripts `create-*.sh`, no un
   script independiente invocable — mismo motivo por el que TASK-009 ya
   reimplemento `assert_valid_branch_name` en TS (`isValidBranchName`)
   en vez de intentar invocar la funcion Bash sola.
2. Si el workspace tiene cambios sin commitear: aborta sin tocar nada,
   con el mismo mensaje de la metodologia (adaptado): *"Hay cambios sin
   guardar en '<rama>'. Guardalos o comitealos antes de continuar."*
3. Si el workspace esta limpio pero la rama actual no es la base
   esperada: cambia automaticamente a la rama base (creandola desde
   `origin/<base>` si no existe localmente y hay remoto disponible) y
   hace `pull --ff-only` si hay remoto — sin pedir confirmacion, tal
   como especifica el punto 14 de la seccion 14 (decision ya tomada por
   el propio texto de 8.3, no solo propuesta).
4. Solo entonces sigue la logica propia de cada comando (crear la tarea,
   generar el scaffold del plan, marcar `plan_aprobado`).

Fuera de alcance a proposito (no es lo que pide el titulo de la tarea en
PLAN_SPRINTS.md, y cambiaria el comportamiento de todo el flujo de
dogfooding usado hasta ahora en TASK-009/010/011): el paso 5 de la
seccion 8.3 ("al terminar, comitea y sube los archivos que haya
generado"). Hoy nada en `taskctl` hace commit ni push por la persona —
eso lo sigue haciendo la persona (o esta sesion) a mano despues de cada
comando, igual que en todas las tareas anteriores. Automatizarlo es un
cambio de comportamiento mayor, no una precondicion, y coincide con una
decision explicitamente pendiente en la seccion 14 del documento de
metodologia (punto 14). Queda documentado como hallazgo abierto para que
el equipo lo decida, no asumido en silencio.

`taskctl start` no necesita este cambio (ya lo dice la seccion 8.3: crea
su propia rama como parte de su propio trabajo).

## Criterios de aceptacion

- [ ] Existe una funcion reutilizable (no duplicada por comando) que
      resuelve la rama base esperada segun el tipo de tarea y aplica los
      pasos 2 y 3 de la seccion 8.3 contra un repo Git real (segundo
      repo temporal actuando de `origin`, no un mock), con tests que
      cubren: ya en la rama base (no hace nada de mas, no pull
      forzado); rama base local existente pero distinta a la activa
      (cambia y hace pull --ff-only porque hay remoto); rama base que
      no existe en local pero si en origin (la crea con tracking); y el
      caso sin remoto disponible (cambia si la rama base ya existe en
      local, sin intentar pull).
- [ ] `taskctl new`, `taskctl plan` y `taskctl approve` aplican la
      precondicion antes de tocar cualquier fichero (ni siquiera antes
      de calcular el siguiente ID en el caso de `new`), y siguen
      funcionando exactamente igual que antes cuando ya se esta en la
      rama base correcta (no rompe ningun test existente de
      new/plan/approve mas alla de anadir el setup de repo Git que
      ahora hace falta).
- [ ] Workspace sucio: los tres comandos abortan sin tocar nada (ni
      archivos de `tareas/`, ni la rama activa), con un mensaje que dice
      que hay cambios sin guardar y en que rama estan.
- [ ] Revision por pares de un agente independiente sobre el diff
      completo, sin hallazgos criticos sin resolver.
