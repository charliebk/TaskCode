# Informe de revision — TASK-128 (ronda 1)

- Commit revisado: b057c57d625465ec13e9dde707a32b27236e5c21
- Revisor: agente revisor independiente (general-purpose, skill code-quality-reviewer)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | src/commands/finish-verificacion.ts:287 (selectiva), :199 (documentacion), :379 (reintento con la rama ya integrada) | implementacion |
| MEN-2 | MENOR | corregido | src/commands/review.ts:1307 (campo `modo` de la puerta review) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### MEN-1 — tres de las cuatro anotaciones de `finish` no las protege ningun test

El codigo anota correctamente las cuatro verificaciones (leido y razonado: la
anotacion va justo despues de ejecutar y antes del `throw` en rojo, y `deMemo`
da `omitido`). Pero solo la verificacion `completa` tiene test (verde y rojo en
`finish-verificacion.test.ts`). Mutantes aplicados sobre `dist/` con los 8
ficheros de tests afectados en verde antes de mutar:

- quitar `anotarFinish(... 'documentacion' ...)` -> 99 pass, 0 fail (sobrevive)
- quitar `anotarFinish(... 'selectiva' ...)` -> 99 pass, 0 fail (sobrevive)
- quitar `anotarFinish(... peticion.tipo ...)` del reintento con la rama ya integrada -> 99 pass, 0 fail (sobrevive)
- quitar la de `completa` -> 2 rojos (muere, bien)

Importa porque es el criterio de la tarea (las cuatro verificaciones de finish)
y una regresion futura dejaria las metricas de `finish` con huecos sin aviso.
Correccion: un test por camino que lea `leerRegistroPuertas` tras
`finish` (selectiva verde y en rojo -que es la que anota antes del abort-,
documentacion, y reintento sobre rama ya integrada), como ya se hizo con review.

### MEN-2 — el `modo: 'documentacion'` de la puerta review no tiene test

Mutante: `modo` siempre `'selectiva'` en `review.ts` -> `verificacion-selectiva.test.js` 25 pass, 0 fail (sobrevive). Los tests de review solo comprueban la rama selectiva. Correccion: una asercion en el test de review por documentacion con `modo = documentacion`.

## Verificacion hecha

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-128-r1`, rama de la tarea, `npm install` y `npm run build` limpios.
- Tests afectados (10 ficheros del encargo): 112 pass, 0 fail, 0 skipped.
- Mutantes sobre `dist/` (cada uno aplicado, probado y revertido):
  - review sin anotar -> muere (2 rojos).
  - finish completa sin anotar -> muere (2 rojos). finish documentacion / selectiva / reintento sin anotar -> SOBREVIVEN (MEN-1).
  - contar `omitido` como ejecucion -> muere (4 rojos).
  - `rondasSoloMenores` sin contar IMPORTANTE como bloqueante -> muere (1 rojo).
  - quitar la fila de totales del comando `metricas` -> muere (2 rojos).
  - `modo` de review fijo a selectiva -> sobrevive (MEN-2).
- Lectura de comportamiento: la anotacion de `finish` completa y selectiva queda antes del `throw`, asi que el rojo se registra; `--sin-verificacion` no pasa por esas rutas y no anota (coincide con `docs/registro-puertas.md`); `resumirFreno` sigue dando el mismo resultado que antes (delegado en `resumirPuerta`); las columnas anteriores no cambian de posicion (las nuevas van al final).
- Sin hallazgos CRITICO ni IMPORTANTE.

## Reproduccion

Desde `taskcode-marketplace/plugins/taskcode-plugin` del clon, tras el build, editar `dist/src/commands/finish-verificacion.js` quitando la linea `anotarFinish(o.cwd, o.id, 'selectiva', inicioSel, v.resultado.estado, v.deMemo);` (o la de `'documentacion'`, o la de `peticion.tipo`) y correr `node --test dist/test/commands/finish-verificacion.test.js dist/test/commands/verificacion-selectiva.test.js dist/test/commands/sincronizacion-fases.test.js dist/test/core/metricas-puertas.test.js`: 0 fallos. Para MEN-2, en `dist/src/commands/review.js` sustituir `modo: motivo !== null ? 'documentacion' : 'selectiva'` por `modo: 'selectiva'` y correr `dist/test/commands/verificacion-selectiva.test.js`: 0 fallos.

## Lecturas fuera del contexto permitido

- `src/commands/finish-heldout.ts` y `dist/src/commands/finish.js` (solo grep): para comprobar que no hay otra verificacion de `finish` sin anotar. `finish-heldout` ejecuta los tests held-out, que no es una de las verificaciones de las que habla la tarea; no se reporta como hallazgo.
- `dist/` del clon y los `.test.ts` de los ficheros de tests listados: necesarios para aplicar los mutantes.
