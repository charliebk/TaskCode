# Informe de revision — TASK-073 (ronda 2)

- Commit revisado: 477269866fc8a21d2b8574fec2c8b3fa3105ccfa
- Revisor: general-purpose (opus) con la skill code-quality-reviewer, independiente de la implementacion
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/commands/finish-heldout.ts (huella, merge-base y remedio) | implementacion |
| IMP-2 | IMPORTANTE | corregido | src/commands/finish-heldout.ts (guardas de arbol sucio y rama activa) | implementacion |
| MEN-1 | MENOR | abierto | test/commands/finish-heldout.test.ts (el test del hotfix no discrimina) | implementacion |
| MEN-2 | MENOR | corregido | src/commands/finish-heldout.ts (`configDe(o.ramaBase)`) | plan |
| MEN-3 | MENOR | corregido | src/core/heldout.ts (`variantesHeldout`) | implementacion |
| MEN-4 | MENOR | corregido | src/core/config.ts (regla de `timeout_verificacion`) | implementacion |
| IMP-3 | IMPORTANTE | abierto | src/commands/finish.ts (`ramaBase` de un hotfix) + finish-heldout.ts (`sin-heldout`) | implementacion |
| MEN-5 | MENOR | abierto | src/commands/finish-heldout.ts (remedio con base y rama cambiadas) | implementacion |
| MEN-6 | MENOR | abierto | src/commands/finish-heldout.ts (mensaje de `Aceptacion/` en la rama) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

Clon en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-073-r2` (borrado), HEAD 78b73b7 (codigo en
4772698), build sin errores. `finish-*.test.js` (10), `review-exclusion.test.js` y
`core/config-verificacion.test.js`: 154/154. Escenarios propios con repos reales y scripts de
Git-Flow de verdad (borrados).

Mutantes en rojo: `ramaSinTocar = false`; remedio sobre la ruta de la base; quitar las guardas de
arbol sucio y de rama activa; `configDe('HEAD')`; quitar la guarda de `raras`; quitar
`&& !vistas.has('comando_heldout')`. **Sobrevive** `ramaBase: ramaIntegracion` en hotfix (MEN-1).

IMP-1 corregido: base cambia tras `start` con carpeta movida -> «integra develop» (si develop añade
un fichero nuevo, el merge da `CONFLICT (file location)` y tras `add`/`commit` queda una sola
carpeta y cierra); develop reescribe el held-out -> merge limpio y cierra; la rama añade un fichero
en 03 -> el remedio literal (rc=0) lo borra y cierra; la rama borra la carpeta -> mensaje «ninguno»
y remedio que funciona. Logica del merge-base revisada: `ramaSinTocar` no deja saltarse la huella;
sin merge-base comun, caso exotico; dos carpetas tras un merge a mano -> «editado» y remedio que
deja una. IMP-2, MEN-2, MEN-3, MEN-4 corregidos (mutantes en rojo; MEN-2 con config invalida en la
base da un mensaje claro).

### MEN-1 — el test del hotfix no discrimina

Commitea los held-out en main y despues mergea main en develop: comparar con develop o con main da
lo mismo y el mutante `ramaBase: ramaIntegracion` sobrevive. Que develop no los tenga (o tenga otros).

### IMP-3 — hotfix con los held-out en develop: la puerta se salta sin avisar

D1 manda commitearlos en develop durante el diseño, y un hotfix tambien se diseña en develop
(`start` recrea solo `tarea.md` en la rama, nacida de main). Con la base del hotfix en main, que no
los tiene, y la rama tampoco: `sin-heldout` y se mergea sin ejecutar nada. Escenario A: held-out con
`process.exit(1)` en develop, hotfix desde main: `finish` cierra, mergea a main con tag y backmerge,
0 ejecuciones. Arreglo: en un hotfix, si main no tiene `aceptacion/` para la tarea y la de
integracion si, abortar explicando donde deben ir (o tomarlos de develop), con test.

### MEN-5 — con base y rama cambiadas, el remedio lleva a un conflicto en el merge final

La rama rebaja el held-out en 03 (o borra la carpeta) y la persona lo cambia en develop: el mensaje
(«la rama ha editado») es correcto y el remedio restaura el contenido de develop en la ruta de la
rama; la huella pasa y se ejecutan, pero el merge del script da `CONFLICT (modify/delete)` sobre
`tareas/01-en-diseno/.../prueba.cjs` y develop queda a medio merge. Raro (falla la deteccion de
renombrado). Arreglo: si el merge-base difiere de la base, pedir primero `git merge <base>` y luego
el remedio.

### MEN-6 — el mensaje de `Aceptacion/` dice «en develop» cuando la carpeta esta en la rama

El implementador crea `tareas/03-en-revision/TASK-N/Aceptacion/`: aborta (bien), pero pide
renombrarla en develop. Distinguir si la variante esta en la rama o en la base.

### Comprobado y correcto

La salida roja no filtra; `HELDOUT_DIR` apunta al estado actual (03); `--sin-verificacion` no la
salta; la exclusion del diff sigue en verde; el remedio funciona en bash y en `cmd.exe`.
