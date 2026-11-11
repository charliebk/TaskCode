# Informe de revision — TASK-108 (ronda 1)

- Commit revisado: aeb40d9b77fd3075072e0ee7dabc83bd78eca304
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet)
- Veredicto: cambios-solicitados

Veredicto propuesto por el revisor: aprobada-con-correcciones. En modo automatico el codigo que se mergea tiene que ser el revisado, asi que MEN-1 y MEN-2 se piden como cambios-solicitados; MEN-3 se acepta.

(Pase generico: el diff es TypeScript de un solo plugin sin revisor de dominio. Profundidad: completa sobre los 4 ficheros del contexto permitido.)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-plugin/src/hooks/guardia-merge.ts:289-291 (rama `selectiva` de `exencionDocumentacion`) | implementacion |
| MEN-2 | MENOR | abierto | taskcode-plugin/test/hooks/guardia-documentacion.test.ts (tests TASK-108) | implementacion |
| MEN-3 | MENOR | aceptado | taskcode-plugin/src/hooks/guardia-merge.ts:258-261 (`LINEA_SELECTIVA`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos CRITICOS ni IMPORTANTES.

## Reproduccion y resultados

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-108-r1` (borrado al terminar). `npm install` y `tsc -p .` limpios.

**Tests del guardian**: `node --test dist/test/hooks/guardia-documentacion.test.js guardia-merge.test.js guardia-heldout.test.js` -> 52 tests, 52 pass, 0 fail. Los 5 tests TASK-108 pasan.

**Suite completa (`npm test`, una vez)**: 2218 tests, 2214 pass, 3 fail, 1 skipped. Los 3 rojos son los conocidos de Windows (symlink EPERM en approve, chmod en plan, CRLF en plan rama base). Sin EBUSY. Ninguna regresion.

**Mutantes** (sobre `src/hooks/guardia-merge.ts`, recompilado, tests TASK-108):
- M1: quitar `\n${LINEA_SELECTIVA}` del detalle -> 3 tests rojos. Muerto.
- M2: que el guardian acepte el memo `selectiva` en verde (huella con `contextoSelectiva`) -> rojo «con nivel 2, una tarea con codigo se bloquea aunque conste en verde el memo de la selectiva». Muerto.
- M3: desactivar la rama `d.tipo === 'selectiva'` -> 3 tests rojos. Muerto.

Correccion por lectura y ejecucion: la rama `selectiva` devuelve siempre `pasa: false` y nunca lee `leerMemo(..., 'selectiva')`; el resto de la logica no cambia. Eliminar `motivoDeLaCompleta` no deja referencias. Sin `rutas_verificacion_parcial` el texto sale de 5 lineas, igual que en la 0.14.0.

## Detalle de los hallazgos

**MEN-1 — Un release con codigo y nivel 2 pierde su detalle propio y recibe una linea que habla de «tarea» y de `finish TASK-NNN`.**
La rama `selectiva` se evalua antes que `if (integ.release)`. Reproducido con un test temporal en el clon: `release/1.0` con commit de `src/ui/boton.ts`, config con `rutas_verificacion_parcial: [src/**]`, merge a develop -> exit 2, y el mensaje trae «la tarea cambia rutas que no son documentacion» + `LINEA_SELECTIVA`, no «Un release lleva a la principal todo lo acumulado: siempre exige la verificacion completa». El bloqueo es correcto (lado seguro); falla la explicacion. Ya existia desde TASK-105, no es regresion, pero la tarea declaraba cubrirlo. Correccion sugerida: comprobar `integ.release` antes de la rama `selectiva`.

**MEN-2 — Falta el test de hotfix/release que el plan listaba.**
El «Plan de pruebas» del plan-final lo incluye y la implementacion no lo trae. Los 5 criterios de aceptacion si estan cubiertos.

**MEN-3 — `LINEA_SELECTIVA` duplica en parte el pie comun de `mensaje()` y es larga.**
El bloqueo dice dos veces «integra con `taskctl finish TASK-NNN`». Ninguna contradice a la otra y el test exige ambas: solo ruido. No bloquea.
Aceptado (implementador): la linea nueva aporta lo que el pie no dice (por que un merge a mano no basta con nivel 2 y que hacer tras un conflicto); fundirla con el pie cambiaria el texto de 0.14.0 que el criterio 4 congela.

## Notas de revision (sin hallazgo)

- La acotacion del criterio 2 a la decision 6b esta confirmada por la persona en el plan, y los tests la ejercitan en los dos sentidos. El comentario de cabecera de `guardia-merge.ts` lo documenta con exactitud.
- El comentario de `finish-verificacion.ts` ya no afirma que el guardian «aun no acepta la selectiva»; coherente con D1.

## Lecturas fuera del contexto permitido

- `taskcode-plugin/src/fs/decision-documentacion.ts` (completo) y `taskcode-plugin/src/commands/finish-verificacion.ts` (grep por `selectiva`/`release`/`hotfix`): para comprobar el orden de decision selectiva/release. Motivo: determinar MEN-1.
- `taskcode-plugin/src/hooks/guardia-merge.ts` completo, `package.json` (scripts), `test/hooks/guardia-documentacion.test.ts` (fixtures): para escribir los mutantes y el test temporal de release.
- grep de `motivoDeLaCompleta` y `(B5)` en `src`, `test`, `skills` y `docs/contexto`: para confirmar que no quedan referencias al helper eliminado.
