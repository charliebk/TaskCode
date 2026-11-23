# Informe de revision — TASK-149a (ronda 2)

- Commit revisado: 7e2d3ad9a07e93978e33a2f53c40368000748ec4
- Revisor: code-quality-reviewer (haiku, independiente)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/fs/git-crudo.ts (ramaActual, rebase-apply), test/fs/git-crudo-comun.test.ts | implementacion |
| IMP-2 | IMPORTANTE | corregido | src/hooks/freno-stop.ts, src/hooks/guardia-merge.ts, test/hooks/freno-stop.test.ts | implementacion |
| MEN-5 | MENOR | abierto | src/fs/ejecucion-acotada.ts:206-214 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon con tsc limpio y dist igual al commiteado; git-crudo-comun, freno-stop, cadena y finish-reintento 26/26; selectiva de la peticion 766/0.
- IMP-1: quitar rebase-apply de ramaActual lo cazan el test de ramaActual y el del freno con rebase. IMP-2: `rama = ''` en el cierre de merge lo caza «F-16 caso B» de finish-reintento; el freno deja parar desacoplado y bloquea en rojo con rebase-apply.
- MEN-5: fotoDelArbol pasa a gitCrudo con timeout de 60 s (antes sin timeout); con timeoutMs 1 da ETIMEDOUT.
- Notas: el freno verifica una vez con un rebase en conflicto (stop_hook_active deja parar la segunda); guardia-merge sin destino durante un rebase toma la rama rebasada (Git no deja mergear en un rebase).

## Regla 4D

- Duplicacion: cumple
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: cumple

## Lecturas fuera del contexto permitido

- skills/task-workflow/revision.md, dist de git-crudo, freno-stop y guardia-merge (mutantes), test/commands/finish-reintento.test.ts (parcial) y package.json.
