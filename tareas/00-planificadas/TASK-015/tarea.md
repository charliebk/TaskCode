---
id: TASK-015
titulo: "Límite de trabajo en curso por persona"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-015-limite-de-trabajo-en-curso-por-persona
asignado_a: null
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-05
dependencias: [TASK-009]
---
## Objetivo

Que una persona no pueda tener dos ramas de trabajo abiertas a la vez, para
que no acabe programando el código de una tarea dentro de la rama Git de
otra.

La decisión #13 (resuelta el 2026-09-05) fija el alcance, y no coincide con
ninguna de las dos opciones que planteaba la §8.2: **un único límite, y solo
sobre la ejecución**.

- En diseño **no hay tope**. `taskctl plan` no comprueba nada: se pueden
  tener varias tareas en `01-en-diseno/`.
- `taskctl start` aborta si la persona asignada ya tiene otra tarea en
  `02-en-curso/` **o** en `03-en-revision/`. El hueco no se libera al pasar a
  revisión: la rama sigue viva y sin mergear hasta `taskctl finish`, y es ahí
  donde se commitean las correcciones de los hallazgos.

Diverge de la §8.2, que describe dos límites independientes y uno de ellos
sobre el diseño. La metodología está congelada: se documenta la divergencia,
no se reescribe.

## Criterios de aceptacion
- [ ] Comprueba el límite en el momento en que se fija `asignado_a`, con el alcance que decida el punto 13 de la sección 14 de la metodología (límite único o dos límites independientes).
- [ ] El mensaje de error nombra explícitamente la tarea que está bloqueando, igual que el resto de errores de taskctl.
- [ ] Depende de que `plan` y `start` acepten el flag `--asignado-a`, que hoy no existe.
- [ ] Tests que cubren el límite alcanzado, el límite libre y la reasignación.
