# Informe de revision — TASK-153a (ronda 1)

- Commit revisado: 4e6ff7fb803c1140a5dbd26eda008730c4c63bdb
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer, independiente
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MENOR-1 | MENOR | abierto | src/core/validacion-tarea.ts (faltaReutilizacion), src/core/autorrevision.ts (tieneLinea4D) | implementacion |
| MENOR-2 | MENOR | abierto | src/core/validacion-tarea.ts, src/core/autorrevision.ts, src/core/transiciones.ts | implementacion |
| MENOR-3 | MENOR | abierto | src/commands/approve.ts | implementacion |
| MENOR-4 | MENOR | abierto | skills/task-workflow/SKILL.md | implementacion |
| MENOR-5 | MENOR | abierto | skills/start/SKILL.md, test/skills/regla-4d.test.ts | implementacion |
| MENOR-6 | MENOR | abierto | test/commands/review-autorrevision.test.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### MENOR-1 — Una sola forma exacta de la cabecera y de la linea 4D
Con `## Reutilización (Regla 4D)` (tilde), `(regla 4D)` o nivel `###`, o con `- **4D** — ...`, el plan o la autorrevision reciben un aviso falso. No bloquea y la plantilla y las peticiones dictan el texto exacto.

### MENOR-2 — Dos reglas de «contenido real de una seccion»
`faltaReutilizacion` reimplementa el filtro de `tieneAutorrevision` con otra regla: solo quita comentarios HTML de una linea, asi que `<!--\nuna\n-->` cuenta como rellena para approve y como vacia para review; una subcabecera `###` vacia tambien cuenta como contenido.

### MENOR-3 — approve lee plan-final.md dos veces seguidas
### MENOR-4 — Se borro una remision de task-workflow/SKILL.md ajena al objetivo (recorte para caber en el tope), sin constar en la tarea
### MENOR-5 — start solo remite a disfraz-tests.md y ningun test comprueba los enlaces de start y revision.md
### MENOR-6 — Sin test de punta a punta de que taskctl review emite el aviso 4D

### Reproduccion empirica
- Clon temporal (borrado): npm install y tsc sin errores; tests afectados (reutilizacion-plan, autorrevision, plan, plan-brainstorm, duracion-estimada, review-autorrevision, test/skills, test/agents) en verde.
- 8 mutaciones, todas en rojo: faltaReutilizacion siempre false, vineta cambiada, tieneLinea4D siempre true, aviso de approve desactivado, linea de plantilla como contenido, falta=false sin seccion, regex 4D solo con guion largo, avisoAutorrevision ignorando tieneLinea4D.
- planEsEsqueleto sigue detectando la plantilla nueva y la vieja; sin avisos duplicados.

## Lecturas fuera del contexto permitido

- src/commands/review.ts (~835-860), src/core/transiciones.ts (rangoDeSeccion), test/commands/review-autorrevision.test.ts, package.json, test/skills/* (grep): para comprobar cableado, cabeceras y cobertura de enlaces.

## Regla 4D
- Duplicacion: MENOR-2, MENOR-3
- Desviacion: MENOR-4
- Diluvio: cumple
- Disfraz: MENOR-5, MENOR-6
