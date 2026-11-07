# Informe de revision — TASK-086 (ronda 2)

- Commit revisado: 4c1e0e70e3ab325eb38a06a1342c1247942ba1e7
- Revisor: revisor independiente (general-purpose, sonnet) con la skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-086 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | src/core/metricas.ts (calcularFila, rama origen git) | implementacion |
| MEN-2 | MENOR | corregido | docs/METRICAS.md §14 y comentario de FilaMetricas.enPausa | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.

Sin hallazgos nuevos en el delta.

### Reproducción

- **Clon temporal.** Clon de la rama en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-086-r2`, con install y build limpios. El clon se borró al terminar.
- **Tests de métricas.** `node --test dist/test/core/metricas.test.js dist/test/commands/metricas*.test.js` da 69 de 69 en verde. Uno más que en la ronda 1: el test nuevo de MEN-1. No se ejecutó la suite completa: el delta solo toca la rama de origen git de `calcularFila`, la documentación y un comentario.
- **MEN-1, corregido.** `calcularFila` invierte el log (`[...e.eventosGit].reverse()`) antes del sort estable. Con la pausa y el review en el mismo segundo, ahora da `enPausa` = 0 y `revision` = 60 min.
- **Mutante de MEN-1.** Sin el `.reverse()`, el test de MEN-1 se pone rojo (34 de 35). Al restaurarlo vuelve a 35 de 35.
- **Varias tareas y `--repo` repetido.** Hay un único `git log` por repo. `porId` agrupa los eventos por tarea respetando el orden del log, así que invertir la lista de cada tarea equivale a invertir el log entero. Cada repo tiene su propio `porId`, y la copia con spread no muta la entrada.
- **MEN-2, corregido.** La §14 y el comentario de `FilaMetricas.enPausa` dicen que `valor: 0` significa que ninguna pausa cerrada cae dentro de lo medido, que es lo que hace el código.
- **Observación sin hallazgo.** Una línea del comentario de `enPausa` quedó más larga de lo habitual.
- **Pendiente heredado, ajeno a esta tarea.** `git log --all` ordena por fecha de commit y `%at` es la fecha de autor. Ya era así antes de TASK-086.
