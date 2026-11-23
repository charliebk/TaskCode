# Informe de revision — TASK-147a (ronda 2)

- Commit revisado: 48712c17bafc5bd3f827a9988b9132adb2fd6964
- Revisor: code-quality-reviewer (haiku, independiente)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/troceo.ts (rangoPorCabecera en lineasDeTroceo) | implementacion |
| IMP-2 | IMPORTANTE | corregido | src/core/troceo.ts (lineasDeTroceo, cortaEnObjetivoOCriterios: false) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- IMP-1 corregido: el plan con `### Criterios de aceptacion` dentro de la parte a da dos partes (a1, b1); con 13fa845, «declara 1 parte(s)». Mutantes M1 (flag a true), M2 (ignorar el flag a true) y M3 (a false) cazados. secciones-comunes 8/8, troceo 7/7, commands 25/25; selectiva de la peticion 705/0.
- IMP-2: un `### Criterios de aceptacion` despues de la ultima parte, dentro de `## Troceo`, ya no corta la seccion: sus criterios pasan a la ultima parte (b: [b1, global1]); con 13fa845, b: [b1]. Sin aviso. Sentido: cortar en `### Criterios`/`### Objetivo` solo cuando no hay un `### Parte` que lo contenga.
- Nota del coordinador: en develop (antes de TASK-147a) el mismo plan da b: [b1, global1]; IMP-2 es una regresion respecto a 13fa845, no respecto a develop.

## Regla 4D

- Duplicacion: cumple
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: cumple

## Lecturas fuera del contexto permitido

- skills/task-workflow/duracion.md (plantilla de ## Troceo), dist/src/core/troceo.js de 13fa845 con git show, y busqueda de texto en skills/task-workflow/cierre.md, skills/approve/SKILL.md y skills/plan/SKILL.md.
