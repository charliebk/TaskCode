# Informe de revision — TASK-102 (ronda 2)

- Commit revisado: 9547bd0d833f67330dfee801e73b4beba90ade30
- Revisor: code-quality-reviewer (verificacion acotada, agente independiente, general-purpose, haiku)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop-documentacion.test.ts (sin caso de tarea sin tipo; guarda `tipoTarea !== null` en src/hooks/freno-stop.ts:189) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRITICO ni IMPORTANTE nuevos. Ningun hallazgo de la ronda 1 queda como CRITICO o IMPORTANTE abierto.

### Verificacion de los hallazgos de la ronda 1

**MEN-1 (hotfix con clave declarada hace `ls-remote` en cada turno): corregido, verificado.**
- `baseDeTipoSinRed` devuelve `RAMA_BASE_ES_DEVELOP[tipo]` (`src/fs/git.ts:706`): `feature`, `fix`, `release` son true; `hotfix` es false.
- En `src/hooks/freno-stop.ts:189`, `baseFiable` vale false para hotfix, asi que `peticionDeTrabajo` no llama a `base()` y no resuelve la rama principal. Con `comando_verificacion_selectiva` no declarada, el hotfix cae a la completa sin red.
- Mutante B (`baseFiable: true`) y mutante C (vuelta al estado de la ronda 1, `baseFiable: tipoTarea !== null`): en ambos, el test nuevo del hotfix queda en rojo (`pass 11, fail 1`).
- Nota (no es hallazgo): si ademas se declara `comando_verificacion_selectiva`, un hotfix sigue resolviendo su base por red en cada turno (rama selectiva de `peticionDeTrabajo`). Es el mismo comportamiento que la 0.14.0; la correccion no lo empeora.

**MEN-2 (ninguna prueba cubre «tarea sin tipo: no se exime nada»): parcialmente corregido.**
- El test nuevo cubre el camino de hotfix (mutante D, `if (e.baseFiable)` -> `if (true)`, lo pone en rojo).
- El caso sin tipo no esta cubierto. Mutante A (`baseFiable: baseDeTipoSinRed(tipoTarea ?? 'feature')`): `pass 12, fail 0`, sobrevive.

**MEN-3**: aceptado en la ronda 1. No se reabre.

### Puerta determinista

- Build: `npm install` (0 vulnerabilidades) y `npm run build` limpios.
- Suite: `npm test` una vez sobre 9547bd0: 2160 tests, 1830 pasan, 327 fallan, 3 saltados. 199 fallos son `EBUSY ... rmdir` en el teardown, varios bloques fallan con `execvpe(/bin/bash) failed` o scripts de Git-Flow con codigo 1 (bash no disponible en el entorno del revisor), 1 `EPERM` de symlink. Ningun fallo cae en freno-stop, decision-documentacion ni en la funcion nueva; todos los tests de `freno-stop-documentacion.test.ts` pasan. No se verifico que esos fallos existan en la base.

### Mutantes (`dist/test/hooks/freno-stop-documentacion.test.js`)

| Mutante | Resultado |
|---|---|
| A: tarea sin tipo exenta (`?? 'feature'`) | pass 12, fail 0: sobrevive (MEN-2) |
| B: `baseFiable: true` | pass 11, fail 1: detectado |
| C: estado de la ronda 1 (`tipoTarea !== null`) | pass 11, fail 1: detectado |
| D: `if (e.baseFiable)` -> `if (true)` | pass 11, fail 1: detectado |

## Decision sobre lo abierto (quien orquesta)

- **MEN-2 aceptado**: el camino `tipo === null` no es alcanzable desde `decidirStop`. El freno solo llega a la decision con una tarea en curso LEGIBLE cuya `rama` es la actual (`deEstaRama` nunca esta vacio ahi), y `tipo` es obligatorio en el frontmatter: una tarea con el tipo ilegible cae en `ilegibles` y el freno no la ve. La guarda `tipoTarea !== null` se mantiene como defensa de tipos; no hay entrada real que la ejercite, asi que no se puede escribir el test por el punto de entrada. La proteccion que si es alcanzable (hotfix) esta cubierta.
- **Los 327 rojos de la suite del revisor**: son de su entorno (sin bash: `execvpe(/bin/bash)`; `EBUSY` en limpieza). La suite completa de quien implemento, sobre la misma rama (abee9b6, mismo codigo salvo las cuatro lineas de `baseFiable` y el test nuevo), dio 2155 pasan y solo los 3 conocidos de Windows. Se vuelve a ejecutar la suite antes del merge.

## Lecturas fuera del contexto permitido

- `skills/task-workflow/revision.md` de la skill instalada en la cache del plugin: plantilla y reglas de veredicto.
- `src/fs/git.ts` lineas 684 a 760: para confirmar que `feature`/`fix`/`release` no hacen red al resolver su base y que `hotfix` si.
- `src/hooks/freno-stop.ts` lineas 120 a 230: de donde sale `tipo` y el flujo de `decidirStop`.
- `src/fs/decision-documentacion.ts` lineas 60 a 170: que `base()` solo se llama en la rama de documentacion y en la selectiva.
- `test/hooks/freno-stop-documentacion.test.ts` lineas 1 a 45 y 286 a 310: helpers y el test del hotfix.
