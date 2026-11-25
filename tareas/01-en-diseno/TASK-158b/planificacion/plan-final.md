# Plan — TASK-158b: taskctl comprueba la autorrevision 4D por ronda y en los MENORES

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador sin lanzar los tres roles ni el unificador. Las salidas de rol
quedan sin rellenar a proposito.)

## Enfoque propuesto

Duracion estimada: 55 min (de la rama abierta al cierre con merge; senales: 3 ficheros de codigo —`src/core/autorrevision.ts`, `src/commands/review.ts`, `src/commands/verificar-menores.ts`— mas `src/cli.ts` para imprimir los avisos de verificar-menores; 2 capas, core puro y comandos; 2 criterios)

1. `core/autorrevision.ts`: `tieneLinea4D(body, etiqueta = '')` acepta la
   etiqueta de la linea (`''` la de la implementacion, `ronda K`, `menores`),
   con el mismo separador que hoy (guion largo, corto o dos puntos). Dos
   avisos puros nuevos sobre ella: `avisoAutorrevisionRonda(body, id, k)` y
   `avisoAutorrevisionMenores(body, id)`, redactados como estado (que falta,
   que la revision o la verificacion sigue, y la linea exacta a anotar con el
   formato de revision.md: `<commit>: usos buscados, N tests mutados`). El
   mensaje de la linea base pasa a decir tambien «usos buscados», como start.
2. `review.ts`: en una ronda incremental (`previa !== null`), aviso si falta
   `- 4D ronda K — ` con K = `previa.ronda`. Sin bloquear (como TASK-153).
3. `verificar-menores.ts`: si hay codigo cambiado desde el `Commit revisado`
   (`cambiados` no vacio), aviso si falta `- 4D menores — `; el resultado
   gana `avisos: string[]` y `cli.ts` los imprime con `printAvisos`, como el
   resto de comandos.

## Reutilizacion (Regla 4D)

- `tieneLinea4D` — `src/core/autorrevision.ts` — se parametriza con la etiqueta; no se crea un segundo detector. Usos buscados: solo su test (`test/core/autorrevision.test.ts`); `avisoAutorrevision` solo lo usa `review.ts:843`.
- `contenidoDeSeccion` — `src/core/transiciones.ts` — lectura de `## Autorrevision`.
- `printAvisos` — `src/cli.ts:413` — salida de los avisos de verificar-menores.
- Fixtures de `test/commands/review-autorrevision.test.ts` y `test/commands/verificar-menores.test.ts` — los tests nuevos van en esos ficheros, con sus repos temporales.
- Nuevo: nada fuera de los dos avisos.

## Desacuerdos entre roles, y como se resuelven

Sin roles (modo rapido). Avisos y no bloqueos: coherente con TASK-153 y no
atasca tareas en curso sin la linea.

## Riesgos aceptados y que los contiene

- Una tarea vieja en ronda 2 recibe el aviso — es un aviso, no aborta.
- verificar-menores sin codigo cambiado (solo backlog) no debe avisar — test propio.
- La linea base `- 4D — ` no debe contar como `- 4D ronda K — ` ni al reves — test en core.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1 (exigencia por ronda y en MENORES): 2 tests en `test/core/autorrevision.test.ts` (etiquetas que se distinguen; avisos con la linea exacta).
- Criterio 2 (un test por comando): 1 en `review-autorrevision.test.ts` (ronda 2 sin la linea avisa; con ella, no) y 1 en `verificar-menores.test.ts` (con codigo corregido y sin linea avisa; con linea, no). Sin pesados.

## Lo que necesita decision de una persona

Nada abierto.
