---
id: TASK-011
titulo: "taskctl approve: checkpoint humano, marca plan_aprobado"
tipo: feature
sprint: 1
etiquetas: [cli, taskctl, diseno]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-011-taskctl-approve-checkpoint-humano-marca
asignado_a: charlie.bk
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-03
actualizado: 2026-09-03
dependencias: [TASK-010]
---
## Objetivo

Implementar `taskctl approve <TASK-ID>`: checkpoint humano de la fase
de diseno (seccion 6). Marca `plan_aprobado: true` una vez que
`plan-final.md` existe — la maquina de estados de TASK-002 ya exige
`ctx.planFinalExiste === true` para el caso `'approve'` (ver
`state-machine.ts`), este comando es lo que calcula y pasa ese booleano
de verdad (comprobando el fichero en disco) en vez de asumirlo.

A diferencia de `plan`/`start`, `approve` NO mueve la tarea de carpeta
(se queda en `01-en-diseno/`; `resultingState('approve', ...)` en
TASK-002 ya confirma que el estado resultante sigue siendo
`en-diseno`). Reusa `moveTareaFile` de TASK-009 igualmente para
reescribir `tarea.md` (mismo directorio origen y destino → no hace
`rename`, solo reescribe el fichero) — tercer uso de esa funcion sin
tocarla, misma logica de reutilizacion que TASK-010.

Deliberadamente fuera de alcance: evaluar la CALIDAD o el contenido de
`plan-final.md` (sigue siendo scaffold vacio vs. redactado de verdad).
Ese juicio lo hace la persona antes de ejecutar el comando — `approve`
solo comprueba que el fichero exista, que es exactamente lo que
`ctx.planFinalExiste` ya modela en la maquina de estados desde TASK-002.

## Criterios de aceptacion

- [ ] `taskctl approve TASK-NNN` marca `plan_aprobado: true` (y
      actualiza `actualizado`) cuando la tarea esta en `en-diseno` y
      `plan-final.md` existe en su carpeta.
- [ ] Rechaza el comando (sin tocar nada) si la tarea no existe, si no
      esta en `en-diseno`, o si `plan-final.md` todavia no existe —
      reusa `assertTransitionAllowed` de TASK-002 con
      `ctx.planFinalExiste` calculado de verdad contra el filesystem,
      con tests que confirman que no hay efectos secundarios en cada
      caso de rechazo.
- [ ] Revision por pares de un agente independiente sobre el diff
      completo, sin hallazgos criticos sin resolver.
