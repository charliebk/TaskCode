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

- [x] `taskctl approve TASK-NNN` marca `plan_aprobado: true` (y
      actualiza `actualizado`) cuando la tarea esta en `en-diseno` y
      `plan-final.md` existe en su carpeta.
      → confirmado con test y con ejecucion manual real del CLI contra
      un repo temporal (incluye el caso de re-aprobacion/idempotencia).
- [x] Rechaza el comando (sin tocar nada) si la tarea no existe, si no
      esta en `en-diseno`, o si `plan-final.md` todavia no existe —
      reusa `assertTransitionAllowed` de TASK-002 con
      `ctx.planFinalExiste` calculado de verdad contra el filesystem,
      con tests que confirman que no hay efectos secundarios en cada
      caso de rechazo.
      → 5 tests de rechazo distintos (sin tarea, sin plan-final.md,
      estado incorrecto en dos variantes, y la rama de error de stat
      que no es ENOENT).
- [x] Revision por pares de un agente independiente sobre el diff
      completo, sin hallazgos criticos sin resolver.
      → 0 criticos, 0 importantes, 2 menores (ambos cosmeticos): el
      mensaje de exito del CLI sobrevendia la causalidad para tareas
      trivial/simple (que nunca exigieron `plan_aprobado` para poder
      arrancar) — corregido; y la captura de `TaskFolderConflictError`
      en `cli.ts` para este comando es defensiva pero inalcanzable en
      la practica (approve nunca cambia de carpeta) — se dejo tal cual,
      consistente con el mismo patron ya usado en `start`/`plan`.

## Resultado

`taskctl approve TASK-NNN` implementado en
`taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts`:
calcula `ctx.planFinalExiste` contra el filesystem de verdad (`stat` sobre
`plan-final.md` dentro de la carpeta actual de la tarea, tratando `ENOENT`
como "no existe" y propagando cualquier otro error), delega toda la
decision de aceptar o rechazar en `assertTransitionAllowed` (TASK-002, sin
tocar) y reusa `moveTareaFile` (TASK-009) por tercera vez sin modificarla:
como `resultingState('approve', task)` sigue siendo `'en-diseno'`, la
funcion detecta que `oldDir === newDir` y hace un `writeFile` simple en vez
de mover carpeta — confirma que la funcion es reusable mas alla de su caso
de uso original.

Revision por pares (agente independiente): 0 criticos, 0 importantes,
2 menores, ambos resueltos — ver el detalle en los criterios de arriba.

Hallazgo propio durante la escritura de tests (no de revision por pares):
forzar un error de `stat` que no sea `ENOENT` con `chmod` sobre el
directorio de la tarea no sirve para probar la rama `if (!isEnoent(e)) throw
e;` de `planFinalFileExists`, porque ese mismo directorio tambien contiene
`tarea.md` — quitarle el bit de ejecucion hace que `readTareaFile` falle
primero con `EACCES`, antes de llegar siquiera al codigo bajo prueba. El
test pasaba igual (el matcher del `assert` coincidia por casualidad con el
codigo de error equivocado), pero la cobertura seguia marcando la linea
como no probada. Solucionado con un symlink autorreferencial sobre
`plan-final.md` (`fs.symlink('plan-final.md', linkPath)`), que produce
`ELOOP` especificamente en esa ruta sin tocar permisos de directorio ni
afectar a `tarea.md`. Patron reutilizable para futuras tareas que necesiten
forzar un error de filesystem "no-ENOENT" sin efectos secundarios en
ficheros hermanos.

131 tests en total (9 nuevos desde TASK-010), 0 fallos. Cobertura de
`approve.js`: 100% lineas / 100% ramas / 100% funciones. Cobertura global
del proyecto: 98.76% lineas / 95.31% ramas / 100% funciones.

**No verificado todavia (bootstrapping):** esta misma tarea, TASK-011,
sigue en `estado: planificada` en su propio frontmatter — no puede pasar
por su propio ciclo de vida (`plan → approve → start`) porque ese ciclo
todavia no esta completo (falta TASK-012). Se retomara cuando el propio
proyecto empiece a dogfoodearse con el ciclo completo.

Trabajo commiteado en la rama
`feature/task-011-taskctl-approve-checkpoint-humano-marca` y mergeado a
`develop`.
