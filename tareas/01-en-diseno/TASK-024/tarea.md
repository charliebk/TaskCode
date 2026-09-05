---
id: TASK-024
titulo: "asignado_a por defecto desde la identidad Git"
tipo: feature
sprint: 2
etiquetas: [cli, identidad]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-024-asignado-a-por-defecto-desde-la-identida
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: []
---
## Objetivo

Que `asignado_a` salga de la identidad Git de quien ejecuta el comando, en
vez de quedarse en `null` salvo que alguien se acuerde de pasar
`--asignado-a`.

El motivo es concreto: **el límite de WIP de B7 es hoy opt-in**. Solo actúa
sobre tareas con `asignado_a` no vacío, y `new` e `import` las crean con
`null`, así que más de la mitad de las tareas de este repo caen en el
camino que no comprueba nada. Y la identidad es la cadena exacta: hoy
conviven `charlie.bk` y `carlos` para la misma persona.

Decisión de Carlos (2026-09-05): la identidad es **`git config user.email`**.

## Criterios de aceptacion
- [ ] Sin `--asignado-a` y sin `asignado_a` previo, `plan` y `start` asignan la tarea a `git config user.email`.
- [ ] Sin `--asignado-a` pero con `asignado_a` ya puesto, se **conserva**: ejecutar un comando sobre la tarea de otra persona no se la queda.
- [ ] `--asignado-a` sigue mandando sobre la identidad Git: es la vía para asignar a otra persona y la salida que ofrece el error de WIP.
- [ ] Sin identidad Git configurada, el comportamiento es el de hoy (`null`), sin romper nada.
- [ ] Las 10 tareas existentes con `charlie.bk` o `carlos` migradas a `charlie.bk@gmail.com`.
- [ ] `taskctl board` sigue legible con la columna `Asignado` llena de correos.
- [ ] Tests reales: identidad presente, ausente, flag que gana, y asignado previo que se respeta.
