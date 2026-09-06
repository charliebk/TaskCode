---
id: TASK-025
titulo: "El limite de WIP mira las ramas de trabajo, no el arbol activo"
tipo: fix
sprint: 2
etiquetas: [cli, wip, git]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-025-el-limite-de-wip-mira-las-ramas-de-traba
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-06
actualizado: 2026-09-06
dependencias: []
---
## Objetivo

Que el límite de WIP de B7 **funcione**. Hoy no protege nada en el flujo
real, y lo hace en silencio.

`taskctl start` mueve la tarea a `02-en-curso` y ese movimiento se commitea
**en la rama de la tarea**. Pero `plan`, `new` e `import` devuelven el repo
a la rama base con `ensureBaseBranchReady`, y `create-<tipo>.sh` también
parte de ahí. En `develop` **ninguna tarea está nunca en `02-en-curso`**,
así que la comprobación no encuentra nada y deja abrir tantas ramas como
quieras.

El smoke test de B7 no lo detectó porque encadenaba dos `start` seguidos:
el único orden en el que el límite sí funciona.

La corrección: dejar de mirar solo el árbol de la rama activa y mirar
también **las ramas de trabajo locales sin mergear**, leyendo el `tarea.md`
de cada una en su propia rama con `git show`. Una rama de tarea viva y sin
mergear ES, literalmente, trabajo en curso.

## Criterios de aceptacion
- [ ] `start` bloquea aunque la tarea que ocupa el hueco solo esté en curso en su propia rama, no en la rama activa. Reproducido con el flujo real (`plan` de por medio), no encadenando dos `start`.
- [ ] Una rama ya mergeada en la rama base NO cuenta: su tarea está cerrada aunque la rama siga viva (política IECA: las ramas no se borran).
- [ ] Una rama sin `tareas/` en su árbol, o con tareas de otra persona, no bloquea.
- [ ] La tarea que se está arrancando nunca se bloquea a sí misma, ni siquiera al reintentar un `start` que dejó la rama creada.
- [ ] El mensaje sigue nombrando la tarea que bloquea y dice en qué rama vive.
- [ ] Un `tarea.md` ilegible dentro de una rama no tumba el comando entero de forma opaca.
- [ ] Tests reales contra repos Git con varias ramas de verdad, incluida una mergeada y otra no.
