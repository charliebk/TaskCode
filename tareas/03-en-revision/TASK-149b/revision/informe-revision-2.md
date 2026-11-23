# Informe de revision — TASK-149b (ronda 2)

- Commit revisado: 2baa0fbcbf9b9f9cb62848fe589070650ac8d7a7
- Revisor: code-quality-reviewer (haiku, independiente)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/cli.ts (ERRORES_COMUNES_CLI, esErrorComunCli), test/cli/errores-comunes.test.ts | implementacion |
| IMP-2 | IMPORTANTE | corregido | test/cli/errores-comunes.test.ts (lista de 9 clases) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon con tsc limpio; cli, doctor-deploy-tareas y git-commit 47/47; selectiva de la peticion 787/0.
- IMP-1: quitar cualquiera de las 9 clases de ERRORES_COMUNES_CLI pone el test en rojo; esErrorComunCli forzada a true, tambien.
- IMP-2: el test tiene su propia lista de las 9 clases y no mira la exportada: anadir ImportCommandError a ERRORES_COMUNES_CLI deja el test en verde. Una clase nueva quedaria sin comprobar.
- Nota (no la abre esta ronda): solo GitCommandError se prueba de punta a punta; si main dejara de usar esErrorComunCli, las otras ocho no tendrian test de CLI.

## Regla 4D

- Duplicacion: IMP-2
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: cumple

## Lecturas fuera del contexto permitido

- skills/task-workflow/revision.md de la cache del plugin 0.17.0.
