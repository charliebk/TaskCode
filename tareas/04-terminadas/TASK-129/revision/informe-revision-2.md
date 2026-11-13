# Informe de revision — TASK-129 (ronda 2)

- Commit revisado: 856f3a0e847f3580de54efa4057bc81bd2d439dd
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | implementacion |
| IMP-3 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

**IMP-1 — corregido.** Mutantes sobre `dist/` del clon (commit 856f3a0), con los cuatro ficheros de test pedidos:
- M1, quitar `anotarSuite` en `puertaVerificacion` (finish, verificacion completa): 1 fallo, `finish (puerta): en verde ejecuta la verificacion SIEMPRE ...`.
- M2, quitar `anotarSuite` en `puertaReintento`: 1 fallo, `finish (puerta, TASK-123): en el camino idempotente ...`.
- M3, quitar `anotarSuite` en `verificar-lote`: 1 fallo, `verificar-lote (TASK-115): una completa en develop anota en verde ...`.

Los tres caminos quedan ahora protegidos. El caso de la ronda 1 (salida con `# tests 7` deja una linea `suite` con modo `7`) esta aseverado en los tests de finish y de verificar-lote.

**IMP-2 — corregido.** Reproduccion de extremo a extremo con `ejecutarVerificacion` y `anotarSuite` reales de `dist/`, sobre un repo git temporal:
- Comando cargo de 5 crates x 400 tests (`bytesTotales` 87755, cola 16384): el registro anota `-`. En la ronda 1 la misma situacion anotaba 800 en lugar de 2000.
- Comando node con `# tests 868` al final (`bytesTotales` 160902, cola 16384): anota `868`, correcto.
- Mutante M4 (quitar el `return null` de la salida recortada en `crecimiento-suite.js`): 1 fallo, el test `contarTests (TASK-129, IMP-2)`. Rojo.
- Mutante M5 (`recortada: false` fijo en `anotarSuite`): 0 fallos. El cableado que hace la correccion no tiene test; ver Notas.

**IMP-3 — abierto (introducido por la correccion de IMP-2).** La regla `recortada` + sin resumen de pytest devuelve `null` para todo Maven, no solo para Maven multimodulo. El comentario de `contarTests` y `docs/configuracion.md` la limitan a los runners que suman por modulos. Reproducido con `contarTests` de `dist/` sobre una salida de Maven monomodulo de 200 clases (23586 bytes, total final `Results: Tests run: 2000`):
- Sin opcion (comportamiento previo a la ronda 2): `2000`.
- Con `recortada: true` y cola de 16 KiB: `null`, es decir `-` en el registro.

No inventa cifras, pero pierde la senal del aviso de crecimiento en un caso real (Maven monomodulo con salida larga, que es lo normal), no en un caso de borde. Propuesta: limitar el `null` a Maven multimodulo (distinguir si la salida reune varios modulos) o, si no se distingue, aceptar el `-` y corregir comentario y documentacion para que digan que cualquier Maven recortado no da cifra.

## Verificacion hecha

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-129-r2`, rama de trabajo sobre 856f3a0. `npm install` y `npm run build` sin errores; tras compilar `dist/` coincide con el commit.
- Tests pedidos (`node --test` sobre `crecimiento-suite`, `versiones-metricas`, `finish-verificacion` y `verificar-lote`): 32 tests, 32 pases, 0 fallos (36.6 s).
- Verificacion de la ronda: la de la peticion (`verificar-impacto`, 966 tests, 0 fallos, sobre el mismo commit 856f3a0). Citada, no repetida.
- Mutantes M1 a M5 sobre `dist/`, restaurando `dist/` tras cada uno. Resultados arriba.
- Reproducciones de IMP-2 e IMP-3 con scripts en el scratchpad de la sesion.
- No se ha ejecutado `taskctl` ni ningun git que escriba en el repo real. El veredicto se ha escrito a mano en este informe; registrarlo en la tarea (`taskctl veredicto`) corresponde a quien coordina.

## Notas (fuera de la tabla)

- MENOR: el cableado de IMP-2 (`recortada: r.bytesTotales > Buffer.byteLength(r.cola, 'utf8')` en `anotarSuite`, `src/commands/finish-verificacion.ts`) no lo prueba ningun test (M5 sobrevive). Hoy es correcto, pero una regresion volveria en silencio. Sugerencia: un test de `anotarSuite` con una salida mayor que la cola.
- Diseno, no hallazgo: cargo con un solo crate truncado tambien da `null`. Es conservador y coherente con la regla de sumar por crates.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts`: para comprobar la llamada a `anotarSuite` y el orden de la verificacion del lote (IMP-1, tercer camino).
- `taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts` y `src/fs/ejecucion-acotada.ts`: para comprobar cuando `bytesTotales` es mayor que la cola (`ejecutarVerificacion`, `leerCola`), necesario para IMP-2.
