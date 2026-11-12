# Informe de revision — TASK-109 (ronda 2)

- Commit revisado: b11131115669ca04fc45757cb4f930a4f42ddb40
- Revisor: code-quality-reviewer (agente general-purpose, modelo haiku)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-109 aprobada | aprobada-con-correcciones | cambios-solicitados)

Veredicto propuesto por el revisor: aprobada. El HEAD que clono (8b3069e) solo anade la peticion, este informe y una linea de tarea.md sobre b111311: mismo codigo y texto.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | verificacion-selectiva.md (§ «Cobertura omitida»), README.md (vineta de cobertura), CHANGELOG.md (parrafo del nivel 2) | especificacion |
| IMP-2 | IMPORTANTE | corregido | verificacion-selectiva.md y README.md (vineta del guardian), SKILL.md, hooks/guardia-merge.ts (`LINEA_SELECTIVA`) | implementacion |
| MEN-1 | MENOR | corregido | verificacion-selectiva.md (§ «El release va siempre a la completa»), CHANGELOG.md, README.md | implementacion |
| MEN-2 | MENOR | corregido | README.md (vineta de `taskctl finish`), CHANGELOG.md («deciden igual») | implementacion |
| MEN-3 | MENOR | aceptado | core/verificacion-proporcional.ts `decidirVerificacion` | plan |
| MEN-4 | MENOR | aceptado | SKILL.md (tamano), README/CHANGELOG sin prueba | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos nuevos. No hay CRITICO ni IMPORTANTE abierto introducido por la correccion.

## Reproduccion y verificacion

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-109-r2` (borrado). `npm install` y `npm run build` sin errores. Tests afectados (`verificacion-selectiva`, `guardia-documentacion`, `skills/*`): 137 pasan, 0 fallan. Sin suite completa, como pidio la peticion.

- IMP-1 (corregido): `finish.ts` ~l.474-476, `puertaCobertura` recibe `ramaBase = ramaIntegracion` tambien en un release y mide solo lo que anade la rama release; `finish-cobertura.ts` l.93, con la selectiva la puerta no mide. La frase nueva es correcta.
- IMP-2 (corregido, por lectura y mutante): `finish.ts` ~l.536-547, el camino idempotente no ejecuta `puerta()`; el remedio nuevo (abortar, integrar la base en la rama de la tarea, resolver alli, relanzar `finish` desde ella) evita ese camino. `taskctl abort-merge` sin terminal sale con error (`wrappers.ts` l.208): no falla en silencio. Mutante del mensaje del guardian («abortalo con taskctl abort-merge» por «resuelvelo y reintenta»): muere `guardian (TASK-108)`. Escenario de conflicto no ejecutado de punta a punta.
- MEN-1 (corregido): `finish.ts` l.470 `permitirSelectiva: tipo !== 'hotfix'` y l.468 solo excluye el release de `ramaBase`. Mutante de la frase del hotfix en la guia: muere `guia (TASK-109)`. Tests de hotfix de `finish-parcial`: 2 pasan.
- MEN-2 (corregido): `textoDeLaCompleta` (l.293-306) con `rutas_verificacion_parcial` y motivo dice «no la selectiva, porque <motivo>»; el motivo solo es nulo sin `rutas_documentacion`. El CHANGELOG describe bien que Stop y review corren la selectiva con codigo y `finish` la completa si algo sale de las rutas parciales.
- SKILL.md: 15349 bytes, el test del limite (15360) pasa.

Nota de cierre (no es hallazgo): tras «abortalo» la persona queda en la rama de integracion; la frase se entiende porque dice «desde la rama de la tarea».

## Lecturas fuera del contexto permitido

- `src/commands/finish.ts` (l.455-495 y l.530-560), `finish-cobertura.ts` (l.85-100), `finish-verificacion.ts` (l.170-300): contrastar las frases corregidas.
- `src/commands/wrappers.ts` (l.1-30, l.200-210) y `scripts/gitflow/abort-merge.sh`: comportamiento de `taskctl abort-merge` sin terminal.
- `test/commands/finish-parcial.test.ts` y su `dist` (filtrado por hotfix); `test/skills/task-workflow.test.ts` (l.509-545).
