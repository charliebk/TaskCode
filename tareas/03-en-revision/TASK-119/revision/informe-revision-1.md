# Informe de revision — TASK-119 (ronda 1)

- Commit revisado: e9d49dcdee5fe1e024825e90d0717035ed01d936
- Revisor: code-quality-reviewer (revisor independiente, agente general-purpose, sonnet)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | src/fs/pendientes.ts:119; src/commands/review.ts:757 | implementacion |
| MEN-2 | MENOR | corregido | src/fs/pendientes.ts:169; src/commands/finish.ts:333 | implementacion |
| IMP-1 | IMPORTANTE | corregido | test/commands/pendientes-fase.test.ts | implementacion |
| MEN-3 | MENOR | aceptado | src/commands/finish.ts:1025 | plan |
| MEN-4 | MENOR | corregido | src/fs/pendientes.ts:49 | implementacion |

Correcciones (coordinador): MEN-1, el fallo del script de `review` lanza dentro de la ventana
del stash (pasa por `devolverSiSePuede`, que respeta `MERGE_HEAD`). MEN-2, `devolverSiSePuede`
solo devuelve en la rama donde se aparto. MEN-4, `recuperarApartado` exige estar en la rama del
stash (el aviso en `siguiente`/`board` no se hace: el error de `review`/`finish` ya lo nombra).
`PendientesError` se trata en el CLI como error de comando. IMP-1: tests de conflicto en el
update de `review`, de anotacion de verificacion en `finish` y de cambio de rama; merge request,
reintento idempotente y hotfix/release siguen sin test propio (se aceptan: el stash los atraviesa
igual que el camino feliz, ya probado). MEN-3 aceptado: es el mismo comportamiento que ya tenia la
anotacion de la URL del merge request (commit local posterior a la subida, que sube `--push`).

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

No hay perdida de datos en ningun camino probado: el stash vuelve al arbol o se conserva con su
nombre. No se repitio la suite (verificacion selectiva de la peticion en verde sobre el commit
revisado); `pendientes-fase.test.js` 3/3 en verde. Reproducciones con `dist/src/fs/pendientes.js`
en repos temporales bajo `%LOCALAPPDATA%/pruebas-claude/taskcode/task-119-r1/` (ya borrados).

**MEN-1 — review: tras un conflicto del update, el error visible no es el del script.**
`runGitflowScript` devuelve `{code, signal}` y no lanza, asi que `conPendientesApartados` hace
`devolver()` siempre, tambien con merge a medias. Reproducido: merge con conflicto y `fn` que
devuelve 1 → `PendientesError ... could not write index`, `UU f.txt`, `MERGE_HEAD` presente y el
stash intacto. No se pierde nada, pero el `ReviewCommandError` del conflicto nunca se emite.
Correccion: que el fallo del script lance dentro de la ventana (o un predicado de exito) para
pasar por `devolverSiSePuede`.

**MEN-2 — `devolverSiSePuede` devuelve lo pendiente en la rama equivocada sin avisar.** Solo
comprueba `MERGE_HEAD`. Reproducido: `fn` hace `git checkout develop` y lanza → pop sobre
`develop` (`M tareas/02-en-curso/.../tarea.md` y `?? tareas/03-en-revision/`), devuelve `null`.
Un commit manual en `develop` lo barreria. Correccion: guardar la rama al apartar y devolver solo
en esa rama; si no, la nota de recuperacion.

**IMP-1 — caminos de `finish` y de error sin test.** Ningun test usa `antesDeAnotar`,
`conPendientesApartados`, `apartarPendientes` ni `devolverSiSePuede`; el test nuevo cubre el ciclo
feliz, las guardas y un stash hecho a mano. Faltan: review con conflicto de update, finish con
script fallido, anotacion de verificacion, merge request, reintento idempotente, hotfix/release,
review incremental, plan con pendientes. Minimo pedido: conflicto de review, finish fallido y
anotacion de verificacion.

**MEN-3 — `finish --merge-request`: la rama subida al MR no lleva informe ni veredicto.** Por
lectura: `pushRama` va antes del commit de «merge request abierto», que solo se sube con
`--push`. No verificado empiricamente. Aceptable con su motivo.

**MEN-4 — la recuperacion del stash no mira la rama y no se avisa fuera de review/finish.** Por
lectura: `refApartado` casa por el sufijo del asunto en cualquier rama; un review o finish desde
otra rama volcaria lo pendiente alli. `siguiente`, `board` y `approve` no avisan de un stash
huerfano. Correccion: comprobar la rama del stash; el aviso, opcional.

Lo comprobado sin hallazgo: las guardas abortan con cualquier cambio ajeno sin apartar nada; el
glob no captura `TASK-NNNa` ni prefijos; la anotacion de verificacion commitea la carpeta entera;
MR abierto/cerrado abortan antes de apartar; la tarea terminada sigue commiteando con su guarda;
el stash evita que el auto-commit de `ensure_workspace_ready` de Git-Flow arrastre lo pendiente;
`siguiente` conserva la deteccion de informe mezclado con codigo. Ningun test se debilito.

## Lecturas fuera del contexto permitido

ninguna (para reproducir se leyeron los tramos de finish.ts y review.ts que rodean al diff y los
scripts update-feature.sh y merge-feature-to-develop.sh)
