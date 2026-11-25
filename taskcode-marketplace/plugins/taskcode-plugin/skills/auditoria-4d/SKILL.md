---
name: auditoria-4d
description: Auditoría 4D (duplicación, desviación, diluvio, disfraz) de todo el proyecto con agentes de solo lectura por zona. Deja los hallazgos por D y severidad y un plan por olas en docs/auditoria-4d-FECHA.md y, si se pide, una tarea por ola. Se invoca como /taskcode-plugin:auditoria-4d.
allowed-tools: Bash(taskctl:*) Bash(git rev-parse:*) Bash(git ls-files:*) Bash(git status:*) Bash(git add:*) Bash(git commit:*) Read Grep Glob Write Agent AskUserQuestion
---

# Auditoría 4D del proyecto

La Regla 4D se aplica en cada tarea al código que esa tarea toca. Esta
auditoría mira **todo el proyecto** y busca lo que se acumuló entre tareas:
helpers copiados, el mismo hecho decidido en varios sitios, tests que no
prueban lo que dicen. Deja un informe y un plan de corrección por olas; no
corrige nada.

## Pasos

1. Sitúate en la raíz del repo: `cd "$(git rev-parse --show-toplevel)"`, y
   anota el commit (`git rev-parse HEAD`) y la fecha de hoy (AAAA-MM-DD). Lo
   normal es auditar la rama base (la de desarrollo) con el árbol limpio
   (`git status --porcelain` vacío): si no, dilo antes de empezar, porque el
   informe describe ese commit y las tareas por ola se crean en la rama base.
2. **Zonas.** Con `git ls-files`, reparte el código en zonas por carpeta
   (de 3 a 8; una zona grande se parte, varias pequeñas se juntan). Fuera:
   dependencias, código generado, compilados y la carpeta de tareas. Los tests
   van con la zona del código que prueban.
3. **Un agente de solo lectura por zona**, en paralelo y en un solo mensaje
   (herramienta Agent; `Explore` si existe, si no `general-purpose` con la
   orden de no escribir ni ejecutar nada que cambie el repo). A cada uno le
   das: su zona, el commit, la Regla 4D de `task-workflow/revision.md` y los
   patrones de `task-workflow/duplicacion.md` (léelos y pásale la ruta: no los
   copies en la petición), y este formato de respuesta, una fila por hallazgo:

   `| D | Severidad | Fichero | Hallazgo |`

   con D en Duplicacion, Desviacion, Diluvio o Disfraz; Severidad en CRITICO,
   IMPORTANTE o MENOR (la escala de `task-workflow/revision.md`), y Fichero
   como `ruta:línea`. Para la duplicación, **todos los usos**: el agente
   busca también fuera de su zona la otra copia y cita las dos. Sin cita de
   fichero y línea, el hallazgo no entra.
4. **Consolida.** Junta las respuestas, quita los hallazgos repetidos entre
   zonas (la misma duplicación vista desde las dos copias es uno) y numéralos
   (`4D-01`, `4D-02`...). Agrupa en **olas**: cada ola, cambios que se hacen
   juntos y caben en menos de una hora de punta a punta
   (`task-workflow/duracion.md`); primero los CRITICO, luego lo que más
   repite.
5. **Escribe el informe** en `docs/auditoria-4d-<AAAA-MM-DD>.md` (si ya
   existe uno de hoy, añade `-2`, `-3`...) con este formato exacto, que
   `taskctl metricas` lee para la tendencia entre auditorías:

   ```markdown
   # Auditoría 4D — <AAAA-MM-DD>

   - Commit: <sha completo>
   - Zonas: <zona>, <zona>, ...

   ## Resumen

   | D | CRITICO | IMPORTANTE | MENOR |
   |---|---|---|---|
   | Duplicacion | n | n | n |
   | Desviacion | n | n | n |
   | Diluvio | n | n | n |
   | Disfraz | n | n | n |
   | Total | n | n | n |

   ## Hallazgos

   | ID | D | Severidad | Fichero | Hallazgo | Ola |
   |---|---|---|---|---|---|
   | 4D-01 | Duplicacion | IMPORTANTE | ruta:línea | qué y dónde está la otra copia | 1 |

   ## Plan por olas

   ### Ola 1: <título corto>

   - Hallazgos: 4D-01, 4D-03
   - Qué se cambia: <una o dos frases>
   - Duración estimada: N min
   ```

   Las cifras del resumen salen de la tabla de hallazgos: cuéntalas, no las
   estimes. Una D sin hallazgos va con ceros, no se quita.
6. Muestra el resumen y las olas, y **pregunta a la persona** (AskUserQuestion)
   si quiere una tarea por ola. Solo si dice que sí: primero commitea el
   informe (`git add docs/auditoria-4d-<fecha>.md` y `git commit -m "docs:
   auditoria 4D <fecha>"`), porque `taskctl new` aborta con cambios sin
   commitear; después, por cada ola:

   ```bash
   taskctl new --titulo "Regla 4D: <título de la ola>" --tipo fix --etiquetas regla-4d \
     --objetivo "<qué se cambia> (docs/auditoria-4d-<fecha>.md, ola N)" \
     --criterio "<cada hallazgo de la ola, corregido y comprobable>" --criterio "..."
   ```

   Un `--criterio` por hallazgo o grupo de hallazgos, comprobable (como en
   `/taskcode-plugin:new`). Si `taskctl new` aborta, muestra el error tal cual
   y sigue con la siguiente ola.
7. Sin tareas, el informe queda sin commitear para que la persona lo revise.
   Dile dónde está el informe y qué tareas se crearon (cada `taskctl new`
   hace su propio commit).
