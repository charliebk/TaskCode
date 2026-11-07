# Plan — TASK-086: Descontar las pausas de las duraciones de las metricas

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

El cambio va **entero en el cálculo puro** `src/core/metricas.ts`, más los textos. No cambia ningún formato de fichero:
- `## Transiciones` sigue igual.
- Los asuntos de los commits siguen igual.
- No se toca `transiciones.ts` ni `pausa.ts`.

El precedente es TASK-065, que añadió `total` a la fila reutilizando `marcasDe` y `duracionEntre`. Aquí se hace lo mismo: se extiende lo que ya hay y no se crea ningún módulo nuevo.

Piezas (lo comprobado está en `src/core/metricas.ts`, líneas 254-340):

1. **`Marcas` se extiende** con `intervalosPausa: { desde: Marca; hasta: Marca }[]`, que calcula `marcasDe` sobre la lista ya ordenada. Cada racha de filas `pausa` seguidas da un intervalo: empieza en la primera `pausa` de la racha y acaba en la siguiente fila que no sea `pausa`. Una racha sin fila posterior (tarea abierta) no tiene cierre y no da intervalo. Al pasar por `marcasDe`, origen `registro` y origen `git` comparten la regla sin código duplicado: hoy los dos ya convergen ahí (líneas 296-303). El recuento `pausas` sigue como está.
2. **Función nueva exportada, al lado de `duracionEntre`**:
   `export function duracionSinPausas(desde: Marca|null, hasta: Marca|null, pausas: readonly IntervaloPausa[]): Duracion | null`
   - Primero llama a `duracionEntre`.
   - Si el resultado es `null` o de precisión `dia`, lo devuelve sin tocar.
   - Si es de segundo, le resta la suma de las intersecciones de cada intervalo con `[desde, hasta]`, es decir, recortado a los límites de la fase.
   - Un intervalo cuya marca de inicio o de cierre sea de día no se descuenta.
   - Sin intervalos, el resultado es idéntico byte a byte al de hoy (criterio 2).
3. **`calcularFila`** sustituye `duracionEntre` por `duracionSinPausas` en `diseno`, `curso` y `revision`. En `total` también, pendiente de decisión (ver abajo).
4. **Campo nuevo `enPausa: Duracion | null` en `FilaMetricas`**: los milisegundos descontados en la fila, o `null` si no se aplicó (precisión de día o sin marcas). Va siempre presente, siguiendo la convención de TASK-064 de que un campo ausente nunca es un 0. Se ve en `--json` y permite comprobar el descuento sin recalcularlo. No se añade columna a la tabla.
5. **Textos**:
   - `NOTA_CALENDARIO` en `src/commands/metricas.ts:176-179`: explicar el descuento, que con precisión de día no se descuenta y que una pausa abierta no cuenta.
   - Comentario de cabecera de `core/metricas.ts`, líneas 20-30.
   - `README.md` del plugin, línea 1150: hoy dice «Las pausas no se descuentan».
   - `docs/METRICAS.md`: hoy no tiene ninguna sección de duraciones. Se añade una sección nueva (14, «Duraciones de fase y pausas») **antes** del marcador `<!-- taskctl metricas --tokens: inicio -->` (línea ~676). Lo que va dentro de los marcadores se sobrescribe al regenerar.

**Precisión de día: no se descuenta.** La duración ya va en días enteros con medianoche implícita (`duracionEntre`, líneas 279-283). Restarle horas de pausa le daría una precisión que no tiene. Restar días enteros de pausa casi siempre restaría 0, y cuando no, podría dar negativos o falsos por la medianoche implícita. Tampoco hay casos reales que lo pidan: las filas `pausa` existen desde TASK-056, que es posterior a las marcas de segundo de TASK-052. La única fuente de una pausa de día es `pausa.ts:90` cuando falta `deps.ahora`.

**Orden de construcción** (cada paso se puede entregar por sí solo):
1. `intervalosPausa` en `Marcas` y `duracionSinPausas`, exportada pero sin usar todavía: la salida no cambia.
2. Conectarla en `calcularFila` y añadir `enPausa`.
3. Leyenda, cabecera, README y `docs/METRICAS.md`.
4. Actualizar los tests que hoy fijan el comportamiento contrario (ver el plan de pruebas).

**Coste**: igual que hoy, una pasada sobre una lista de transiciones que ya está ordenada. Las rachas se agrupan en la misma pasada, sin E/S nueva y sin ningún `git log` extra.

**Alternativa descartada**: añadir una transición «reanudar» (en `transiciones.ts` y como comando o fila al volver de la pausa). Cambiaría el formato de `## Transiciones` y la `FaseRegistrada`, obligaría a tocar los comandos y no arreglaría el histórico, cuyas pausas ya escritas seguirían sin cierre. La fila que viene después de la pausa ya hace de «reanudar».

## Lo que el rol no cubrio

Se ha mirado solo la arquitectura. Contrastado con los criterios:
- **Criterio 1** (descontar las pausas): el **significado de dominio** de la regla está sin verificar. `pausa` es el «no» a pasar de fase (`pausa.ts:4-7`). Entre esa fila y la siguiente transición la persona puede haber estado trabajando, por ejemplo rehaciendo el plan antes de aprobarlo. Si es así, la regla descuenta trabajo como si fuera pausa. Esto le tocaría al rol de dominio, que no se ha lanzado.
- **Criterio 2** (tareas sin pausas iguales que hoy): la forma lo garantiza (sin intervalos, el resultado es el mismo valor de `duracionEntre`), pero los casos límite no se han enumerado: empates del mismo segundo, el orden inverso de `git log` con empates, una pausa antes del primer `plan`. Sería trabajo del rol de riesgos.
- **Criterios 3 y 4**: no se ha diseñado una estrategia de pruebas propia; abajo va solo la lista mínima.

## Riesgos aceptados y que los contiene

- **Cambia el significado de columnas que ya existen** (`diseno`, `curso`, `revision` y quizá `total`), sin nombre nuevo. Lo contienen la leyenda, el campo `enPausa` en el JSON y el README.
- **Empates de instante**: `marcasDe` ordena con un `sort` estable. En el registro se respeta el orden del fichero, pero en `git` se parte del orden inverso de `git log`, así que una pausa y la transición siguiente en el mismo segundo podrían intercambiarse. El efecto queda acotado a 0-1 s. Se acepta.
- **Tareas con origen `git`**: dependen de que el asunto `pausa registrada` no cambie. Ya lo cubre `ASUNTO_CHORE_RE` y el test del ciclo real.
- **Pausa abierta**: la tarea sigue midiéndose como calendario hasta su siguiente transición. Se dice en la leyenda.

## Plan de pruebas

Contra los tests que ya existen, sin mocks:
- `test/core/metricas.test.ts:156`: hoy afirma «pausa se cuenta pero no se descuenta» (diseño `8h 00m`). Pasa a esperar `0s` en ese caso, porque la pausa de 10:05 se cierra con el `start` de 18:00. Hay que añadir un caso con trabajo después de la pausa para que el descuento no se confunda con el total.
- Casos nuevos en el mismo fichero:
  - una racha de dos pausas seguidas;
  - una pausa en curso y otra en revisión, cerradas por un segundo `review`;
  - una pausa final abierta (no descuenta);
  - una tarea sin pausas igual que antes (criterio 2);
  - precisión de día (no descuenta, `enPausa` null);
  - origen `git` con `parsearLogGit` y el commit `pausa registrada` (ya hay datos en la línea 196).
- `test/commands/metricas.test.ts:90` y `test/commands/metricas-tokens.test.ts:85` comprueban la frase literal «Las pausas no se descuentan»: hay que cambiarla por la frase nueva de la leyenda.
- Un test de comando de punta a punta: repo temporal, `taskctl pausa` real y después `metricas --json`, comprobando `enPausa`.
- `npm test`: en verde salvo los tres rojos conocidos de Windows.

## Lo que necesita decision de una persona

**Respuestas de Carlos (2026-11-07)**: 1 sí, la pausa dura hasta la siguiente
fila que no sea pausa y se resta; 2 sí, `total` también descuenta; 3 sí, con
precisión de día no se descuenta y basta la leyenda; 4 sí, se añade `enPausa`
al JSON; 5 se mantiene «simple».

1. **¿Es «pausa → siguiente transición» tiempo sin trabajo?** Si la persona suele trabajar después de decir «no» (rehacer el plan, corregir antes de revisión), la regla resta trabajo real.
2. **¿Se descuenta también en `total`?** Propuesta: sí, para que siga siendo «lo que suman diseño, curso y revisión». Coste: cambia `minutosPlanAFinish` de `--evolucion` (`core/evolucion.ts:97`) sin cambiarle el nombre.
3. **Precisión de día: no descontar.** Confirmar que basta con decirlo en la leyenda, sin aviso por tarea.
4. **¿Se añade `enPausa` al JSON?** Contrato público nuevo de `--json`. Propuesta: sí.
5. **Complejidad**: declarada simple, heurística trivial. «Simple» parece correcto.
