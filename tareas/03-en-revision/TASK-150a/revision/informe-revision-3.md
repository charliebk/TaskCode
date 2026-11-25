# Informe de revision — TASK-150a (ronda 3)

- Commit revisado: bac365c7a2d1b889d4d175f5ac9b9018bb15fcdd
- Revisor: code-quality-reviewer (general-purpose, verificacion acotada)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md:36 (y :102) | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts:43-50 | implementacion |
| MEN-4 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/fuente-unica.test.ts:58-65 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Verificacion de los hallazgos de la ronda 2

- **IMP-1 (corregido).** `rust-wasm-reviewer/SKILL.md:36` dice «**lee siempre** el limite» y la linea 102 dice «este revisor lo lee como contexto». Sin cambios respecto a la ronda 2, que ya lo verifico. La regla nueva de `fuente-unica` cubre la variante sin negrita (ver IMP-2).
- **IMP-2 (corregido).** La regex de `test/skills/fuente-unica.test.ts:46-50` es ahora `/pedirlo explicitamente|pide siempre|pidelo si un|lo pide (para un hallazgo|como contexto)/`, sin `\*\*`. Reproduccion en el clon `bac365c`:
  1. Base: `node --test dist/test/skills/fuente-unica.test.js` → 3 tests, 3 pasan, 0 fallos.
  2. Mutacion: en `skills/rust-wasm-reviewer/SKILL.md:36` se cambia `**lee siempre** el` por `pide siempre el` (sin negrita). Resultado: `not ok 2 - ... ninguna skill rebaja el test duplicado a MENOR ni manda pedir contexto`, con `error: 'rust-wasm-reviewer/SKILL.md: pide contexto'`. `# pass 2`, `# fail 1`. El test cae, que es lo que pedia la ronda 2.
  3. Restaurado con `git checkout -- skills/rust-wasm-reviewer/SKILL.md`. En el clon no quedan cambios de codigo.
- **MEN-4 (corregido).** La llave de cierre del bucle de `fuente-unica.test.ts` vuelve a su linea (linea 65), con la indentacion del bloque. Compila y el test pasa. Sin impacto funcional.
- **MEN-1, MEN-2, MEN-3 (ronda 2).** No revisados en esta ronda, como indica la peticion.

### Verificacion de la ronda y ejecucion en esta revision

- La verificacion selectiva de la ronda (`node scripts/verificar-impacto.mjs`) sobre `bac365c`, citada en la peticion, dio 2064 tests, 2062 pasan, 0 fallos, 2 saltados, codigo 0. Su `Commit verificado` es igual al `Commit revisado`, asi que no se repitio la suite completa.
- En esta revision: `npx tsc -p .` sin errores; `node --test dist/test/skills/fuente-unica.test.js` → 3/3 pasan. Mas la mutacion descrita arriba.

### Comprobacion del fallo que la correccion podria abrir

- El diff de la ronda (`be1b22b..bac365c` y el de `ceb7d1d`) solo toca `test/skills/fuente-unica.test.ts`. No cambia ningun SKILL.md.
- La regex sin negrita no da falsos positivos: el test pasa sobre el arbol limpio de `bac365c`.
- Busqueda de variantes residuales en `skills/` y `agents/` (`pide`, `pidelo`, `pedir`, `pedirlo`, con «contexto», «llamador», «fichero» o «siempre» cerca): solo aparecen usos legitimos (`skills/start/SKILL.md:29`, «antes de pedir revision» para la persona, y `skills/task-workflow/SKILL.md:242`, «lo que se le pide a ese rol» en la peticion de brainstorm). Ninguno es una frase que mande al subagente revisor a pedir contexto.

### Notas (no abren ronda)

- NOTA-1: la regex de `fuente-unica` busca las variantes concretas ya vistas, no toda la familia («pidelo», «pedirlo» solo). Hoy no hay ninguna frase de ese tipo en el repo; si reaparece una variante nueva, el test no la caza. Es una limitacion conocida de una lista de frases, no un fallo de esta correccion.

## Regla 4D

- Duplicacion: cumple. La correccion cambia la expresion del test, no duplica ninguna decision: cada frase de la lista es una variante distinta a vigilar.
- Desviacion: cumple. El diff de la ronda toca solo el test; no hay cambios ajenos a los hallazgos.
- Diluvio: cumple. No se anade ningun test nuevo; solo se ajusta la regex de uno existente.
- Disfraz: cumple. La mutacion de la frase sin negrita hace caer el test (`not ok 2`), asi que la aseveracion discrimina de verdad.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md` (lineas 36 y 102 y el fichero completo para la mutacion): la peticion ordena reproducir el fallo de IMP-1 en ese fichero.
- `tareas/03-en-revision/TASK-150a/revision/informe-revision-2.md`: lo indica la peticion como base de la verificacion.
- `grep` sobre `skills/` y `agents/`: busqueda de variantes residuales de IMP-2, para que la nota NOTA-1 no sea una suposicion.
- El clon de `npm install` cambio `package-lock.json` dentro del clon; no afecta al repo real y el clon se borra al terminar.
