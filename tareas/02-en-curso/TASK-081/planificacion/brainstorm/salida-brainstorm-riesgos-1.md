# Brainstorm — TASK-081, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: brainstorm-riesgos

Fuentes que he leído: `src/core/coste-transcripcion.ts`, `src/fs/transcripciones.ts`, `src/core/coste-registro.ts`, `src/commands/registrar-coste.ts`, `src/commands/review.ts` (líneas 125-304 y las coincidencias de grep), `src/core/informe-revision.ts` (líneas 225-266) y `src/hooks/pre-tool-lectura.ts`. Lo que no he leído lo marco como supuesto.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **La revisión pierde calidad sin que nada lo avise.** Este es el riesgo de más daño.
   - Escenario: la petición limita el contexto permitido al diff, la tarea y el plan. Una ronda 1 que antes habría encontrado un CRÍTICO, leyendo el llamador de una función cambiada fuera de la lista, ahora no lo ve y el veredicto sale «aprobado».
   - Las métricas lo registran como éxito, porque bajan tokens y lecturas. Hoy ningún indicador de la tarea mide hallazgos por cada millón de tokens.
   - Mitigación: la lista orienta, no prohíbe. Además, `metricas` debería poner los hallazgos CRÍTICO e IMPORTANTE por ronda al lado de las lecturas, para que se vea si la bajada de coste va con bajada de hallazgos.

2. **El modelo barato en ronda 2 aprueba una corrección que abre otro fallo.**
   - La propia petición incremental dice que es «justo donde se cuelan» (`review.ts:288-289`).
   - Escenario: en ronda 1 salen solo IMPORTANTES. El implementador los corrige con un cambio que toca el estado en disco. En ronda 2 la sugerencia es el modelo barato y no ve el nuevo CRÍTICO.
   - Mitigación: sugerir el modelo barato solo si el diff incremental es pequeño y no añade ficheros nuevos al alcance. Si el modelo barato da veredicto «cambios-solicitados» con un hallazgo nuevo (no heredado), la ronda siguiente vuelve al modelo de la tarea.

3. **La condición «sin CRÍTICOS abiertos» puede leerse al revés o dar falso negativo.**
   - Verificado en `informe-revision.ts:257-265`: cualquier estado que no sea `corregido` o `aceptado` cuenta como abierto, también el vacío. Y en el informe de la ronda 1 lo normal es que el revisor haya escrito sus hallazgos como `abierto`: nadie los cambia a `corregido` en ese fichero.
   - Si «abierto» se toma literalmente, nunca se sugiere el modelo barato después de un CRÍTICO, que es lo correcto. Pero si alguien implementa «CRÍTICOS con estado distinto de abierto», el caso se invierte.
   - Hay más casos sin regla:
     - Severidad no reconocida: hay un contador `desconocida` en la línea 351.
     - Tabla ausente: `leerHallazgos` devuelve `tabla: false`.
     - Ronda fragmentada en la que uno de los informes no tiene tabla.
   - Mitigación: sugerir el modelo barato solo si todos los informes de la ronda tienen tabla legible, 0 CRÍTICOS en cualquier estado y 0 severidades desconocidas. Cualquier otra cosa mantiene el modelo de la tarea.

4. **Los tokens se cuentan dos veces si cambia el formato de `## Coste`.**
   - Verificado: `leerCostes` exige exactamente `COLUMNAS = 9` y descarta en silencio la fila que no cuadra (`coste-registro.ts:129`).
   - Escenario: para atribuir revisor y ronda se añade una 10.ª columna o se cambia `fuente`. Una instalación con el plugin viejo (ToolsaWeb antes de actualizar, o un clon de otra persona) lee la tarea, no ve las filas nuevas y `sinDesglose` se dispara.
   - Peor: `yaAnotado` (`registrar-coste.ts:183`) no encuentra al agente ya anotado y `registrar-coste` vuelve a sumar su transcripción entera a `tokens_revision`. Es una duplicación silenciosa, commiteada y sin vuelta atrás automática.
   - Mitigación: preferir ampliar el valor de `fuente` sin cambiar el número de columnas. Si se añade columna, el parser nuevo acepta 9 y 10 columnas, y hay que asumir y documentar que el viejo ignora las de 10.

5. **No hay de dónde sacar «por revisor y ronda».**
   - Verificado: la fila guarda `agente:<id>[,<id>...]` sin ronda ni revisor, y varios `--agente` en una llamada se suman en una sola fila (`registrar-coste.ts:355-368`). Las filas ya escritas no se pueden repartir.
   - Escenario: el orquestador registra los dos revisores de una ronda fragmentada en una llamada, o las rondas 1 y 2 en otra. La métrica los atribuye mal o los junta en un «sin revisor».
   - Si la atribución se deduce por fecha o por orden, sale mal sin avisar.
   - Mitigación: la atribución la declara quien registra (o el informe lleva el agentId). Lo que no esté declarado se muestra como «sin atribuir», nunca se adivina.

6. **Leer la transcripción al ejecutar `metricas` da cifras que no se pueden reproducir.**
   - Verificado: las transcripciones viven en `<CLAUDE_CONFIG_DIR o ~/.claude>/projects/*/*/subagents/` (`transcripciones.ts`), fuera del repo y en la máquina local.
   - Escenario: `metricas --tokens` en otra máquina, en CI o pasado un tiempo (supuesto: Claude Code purga transcripciones antiguas) da cifras distintas de las de ayer para la misma tarea.
   - Mitigación: extraer de la transcripción una vez, en `registrar-coste`, y persistirlo en `tarea.md`. `metricas` lee solo el repo.

7. **La heurística de lecturas no cuenta justo lo que hacen los revisores.**
   - Verificado: `cd x && cat y` no cuenta (cabecera de `coste-transcripcion.ts:29`), y la lista cerrada `HERRAMIENTAS_LECTURA` no incluye PowerShell.
   - La petición manda al revisor clonar a un directorio temporal (`review.ts:211`), así que sus lecturas típicas son `cd <clon> && cat ...` o `Get-Content` en Windows, y quedan fuera.
   - Además, `lecturas` es un número de llamadas, no de bytes. La cifra puede bajar mientras los tokens suben, que es lo contrario de lo que hay que vigilar.
   - Mitigación: no presentar `lecturas` como la causa de los tokens. Mostrar al lado `cache_lectura` y `entrada` de la misma fila.

## Estados intermedios y fallos parciales

- **`review` muere tras escribir la petición.** La petición ya lleva la sugerencia de modelo y la lista de contexto. Verificado que existe limpieza de los ficheros `wx` de la invocación (`review.ts:565-571`). Si la sugerencia o la lista se calculan después de escribir, una petición sin ellas parecería válida. Todo debe calcularse antes del primer `writeFile`.
- **Cálculo de la sugerencia sobre una ronda 1 a medias.** Por ejemplo, un informe de dos sigue con la plantilla. Los marcadores `(ej.` se saltan (`informe-revision.ts:237`), y una tabla solo con el ejemplo se lee como «0 hallazgos». Así se sugeriría el modelo barato sobre una ronda que nadie ha revisado. Un informe sin filas reales y sin el marcador explícito de «sin hallazgos» no debe contar como limpio.
- **`registrar-coste` muere entre `writeFile` y `autoCommit`** (`registrar-coste.ts:369-372`). Queda un `tarea.md` sucio con total y fila nuevos, y el siguiente `registrar-coste` aborta por cambios sin commitear. Esto ya pasa hoy. El cambio no debe añadir un segundo fichero (por ejemplo un sidecar de lecturas) que haga el estado a medias más probable o más difícil de detectar.
- **Dos `registrar-coste` en paralelo** para los dos revisores de una ronda fragmentada, lanzados a la vez por el orquestador. Los dos leen el `tarea.md` limpio y el segundo `writeFile` pisa la fila del primero. El commit pathspec-limitado no lo detecta. Si la tarea fomenta registrar por revisor, aumenta esta concurrencia.
- **Transcripción todavía en escritura** (revisor reanudado o sin terminar). Se suma menos de lo real. TASK-065 lo cubre con la diferencia al reanudar, pero solo si la fila es de un solo agente: con varios aborta (`registrar-coste.ts:195`).

## Compatibilidad hacia atras

- **Tareas ya terminadas sin `## Coste`, o con filas `manual`.** `lecturas` vale `-`, es decir `null` («no medido», que no es 0, `coste-registro.ts:174`). La vista por revisor y ronda debe mostrarlas como «sin dato» y no como «0 lecturas»: si no, la mediana histórica baja de forma artificial y el objetivo de 3-4 M parece cumplido.
- **Filas `agente:` de antes de esta tarea**, sin ronda ni revisor. No se pueden reatribuir. Nunca hay que reescribirlas (la cabecera de `coste-registro.ts` dice «nunca reescribe filas»), así que solo cabe mostrarlas como no atribuidas.
- **Peticiones de revisión ya escritas, sin lista de contexto ni sugerencia.** `commitRevisadoDe` y la lectura de la ronda previa no deben depender de las secciones nuevas. Una ronda 2 generada sobre una ronda 1 vieja debe funcionar sin la lista.
- **Tarea en vuelo a mitad de ronda cuando se actualiza el plugin.** Su ronda 1 se hizo con el modelo de la tarea y su ronda 2 recibe la sugerencia. Es correcto, pero la métrica «antes/después» de esa tarea mezcla los dos regímenes.
- **Las skills instaladas en otros proyectos** no pueden mencionar TaskCode (hay tests que lo comprueban). La instrucción nueva de la skill revisora común debe ser genérica.
- **`modelo_sugerido` del frontmatter.** El comentario de `review.ts:133-134` cita la §16.6: «el revisor usa el mismo modelo que la tarea». La sugerencia contradice esa regla. Si no se actualiza a la vez, un consumidor que lea `modelo` del resultado de `review` (línea 674) sigue lanzando el modelo caro.

## Vuelta atras

- **Sugerencia de modelo y lista de contexto:** se revierten sin pérdida, porque son texto nuevo en peticiones nuevas. Las peticiones ya escritas con ellas quedan como histórico inerte.
- **Formato de `## Coste`:** **no se deshace limpio.** Las filas escritas con el formato nuevo quedan en `tarea.md` de tareas cerradas y en ramas que no se borran (política de auditoría). Si se revierte el parser, esas filas se ignoran en silencio y vuelve el riesgo de doble conteo (modo 4). Es el único punto sin retorno real del cambio.
- **Totales duplicados en `tokens_revision`:** si llegan a ocurrir por el modo 4, solo se corrigen editando a mano cada `tarea.md` afectado. Ningún comando resta.
- **Calidad de revisión:** si el modelo barato o la lista acotada dejaron pasar fallos, esas tareas ya están mergeadas. Revertir la función no vuelve a revisarlas. Haría falta poder listar qué tareas se revisaron en ronda 2 con la sugerencia barata, y eso exige que la sugerencia quede registrada (el criterio 3 ya lo pide en la petición).

## El riesgo que mas te preocupa (UNO solo)

Que la tarea cumpla su objetivo numérico porque revisa peor. Lista acotada más modelo barato bajan los tokens hacia 3-4 M, y nada en `metricas` enfrenta esa bajada con los hallazgos encontrados. Un CRÍTICO que no se ve no deja rastro en ninguna métrica: se descubre en producción, meses después, en una tarea ya mergeada. Pido que el plan exija, como condición para dar por bueno el objetivo, que `metricas` muestre por ronda los hallazgos CRÍTICO e IMPORTANTE junto a los tokens y las lecturas.

Desacuerdo previsto con arquitectura: si propone que `metricas --tokens` lea las transcripciones en vivo, me opongo (modo 6). La extracción debe ocurrir en `registrar-coste` y quedar en el repo.

Lo que no cubro y queda para otros roles:
- Si el umbral de «tarea media» y el objetivo de 3-4 M son correctos (dominio).
- Dónde encaja cada pieza (arquitectura).
- Qué tests escribir (testing).
