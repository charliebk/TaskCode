# Informe de revision — TASK-156 (ronda 2)

- Commit revisado: f2cc1aa109e6f813637617fa47253df5a79ffee6
- Revisor: code-quality-reviewer (general-purpose, haiku)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:375 (`proximidad`) y :309-311 (`lectores`) | implementacion |

Sin hallazgos nuevos.

### Verificacion de IMP-1

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-156-r2` (commit f2cc1aa, cambio sin commitear en `skills/finish/SKILL.md`), con `VERIFICAR_IMPACTO_TOPE=10 RAMA_BASE=HEAD node scripts/verificar-impacto.mjs --listar`:

- `107 ficheros por impacto pasan del tope de 10; se corren los 10 tests directos mas proximos de 19 (9 se dejan fuera)`.
- Entran los cuatro que en la ronda 1 se perdian: `test/commands/verificacion-pesada.test.ts`, `finish-heldout`, `verificacion-selectiva` y `doctor-correcciones`.
- Test compilado (`npm install`, `npm run build`, `--test-name-pattern=TASK-156`): 1 pass, 0 fail.
- No se repite la suite: la verificacion de la ronda cita f2cc1aa en verde (720/720).

### Revision del diff de la correccion (`git diff d4c51c4..HEAD -- scripts test`)

Sin hallazgo:
- `soloCarpeta` solo se marca para origenes del plugin (`lectores` solo se calcula con `enPlugin`): el `slice` de `proximidad` no recibe rutas ajenas.
- `nombran` sale de `porNombre` (incluidos los `MARCADORES`): un test lector y nombrado a la vez no queda como solo-carpeta.
- Con varios origenes, `proximidad` toma el minimo: un test nombrado por un origen conserva su prioridad.
- El camino sin tope (`TIPO_VERIFICACION=selectiva`) no cambia.

## Regla 4D

- Duplicacion: cumple (`carpetaLeida` se reutiliza en `seleccionar` y en `proximidad`).
- Desviacion: cumple (la correccion toca solo el script y su test).
- Diluvio: cumple (un cambio de prioridad y un `Set`).
- Disfraz: cumple (sin candidatos en el diff; ronda acotada).

## Lecturas fuera del contexto permitido

- `scripts/verificar-impacto.mjs` (lineas 85-110 y 290-330 del clon): para comprobar el alcance de `porNombre`, `lectores` y `carpetaLeida`, de los que depende la correccion.
