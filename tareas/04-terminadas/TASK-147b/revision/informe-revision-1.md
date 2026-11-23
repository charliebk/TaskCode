# Informe de revision — TASK-147b (ronda 1)

- Commit revisado: bc04b10ebf2db9a8fc0aefa394eab12ee2c2b9c6
- Revisor: code-quality-reviewer (sonnet, independiente)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | aceptado | src/core/validacion-tarea.ts | implementacion |
| MEN-2 | MENOR | abierto | src/core/task.ts | implementacion |
| MEN-3 | MENOR | abierto | src/core/roadmap-comparar.ts, src/core/task.ts | implementacion |
| MEN-4 | MENOR | abierto | test/core/ids-y-criterios.test.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon en bc04b10 y worktree de develop para comparar; tsc limpio; 114 tests de los modulos tocados en verde; selectiva de la peticion 763/0. finish* y doctor* no terminados (mas de 15 min), sin verificar por el revisor.
- MEN-1: casillasSinMarcar con dos secciones `## Criterios de aceptacion`: develop ["a","c"], HEAD ["a"] (extraerSecciones lee la primera). Coherente con el resto del flujo; finish solo avisa. Cambios intencionados y correctos: `### Criterios` suelto cuenta, `**Tras el cierre**` no, multilinea con el texto unido.
- MEN-2: compararIds('TASK-099','TASK-0099') da 0; el orden queda al de readdir. Antes se desempataba por cadena.
- MEN-3: quedan copias de la regex del ID: roadmap-comparar.ts:105 y :116 (laxa a proposito, acepta TASK-12), metricas.ts:296, registro-puertas.ts:73, heldout.ts:68, y dentro de task.ts TASK_ID_RE frente a ID_PARA_ORDENAR_RE.
- MEN-4: mutantes vivos: desempate de `atascadas` en roadmap, roadmap-comparar ordenando por cadena, citar sin `>` en blanco, trocear con regex laxa, filtros de ID de fs/roadmap, listExistingTaskIds y wip-scan quitados.
- Seguridad: isValidTaskId igual que en develop ante path traversal (`TASK-100/../x`, `../TASK-100`, cifras de ancho completo): false.
- Incidencia del revisor: un `npm install` corrio en el repo original y dejo una linea en package-lock.json; revertida por el coordinador con permiso de Carlos.

## Regla 4D

- Duplicacion: MEN-3
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: MEN-4

## Lecturas fuera del contexto permitido

- src/commands/finish.ts (~395-415), src/commands/start.ts, src/commands/new.ts (slugify), src/commands/doctor-deploy-tareas.ts, y la linea de la regex en metricas.ts, registro-puertas.ts y heldout.ts; dist de develop y de HEAD para comparar.
