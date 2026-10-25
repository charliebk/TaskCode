# Brainstorm — TASK-065, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

Toda la lectura de un repo sale de `runMetricasCommand` a `leerRepoMetricas(repoCwd)` en `src/commands/metricas.ts` (E/S, un `git log` por repo); los agregados son funciones puras sobre `FilaMetricas[]` en dos modulos nuevos de `src/core/`, con formateador de texto y de JSON. `FilaMetricas` solo gana `total` y `veredictoRonda1`; el resto ya lo dejo TASK-064.

Orden de construccion:
1. `extraerRepetible`, `leerRepoMetricas` y `--repo` con `etiquetaTarea`, mas el aborto de `--repo` con `--escribir`. Refactor que con un solo repo no cambia un byte de la salida actual.
2. `total` y `veredictoRonda1` en `calcularFila`. La tabla por defecto no cambia.
3. `evolucion.ts` y `--evolucion [--tramo N]` en texto.
4. `grupos-metricas.ts` y `--grupos` en texto.
5. `--json` sobre 3 y 4; MEN-4; README y CHANGELOG; linea base de los tres repos.

MEN-4 (de TASK-064): `notasFilaEnriquecida` da un recuento por fase y los 10 primeros IDs seguidos de «y N mas» (en OpenGisViewer son 76 de 76); la lista entera solo en `--json`.

## Que se extiende y que se crea

- `src/cli/args.ts` — extiende — `parseArgs` se queda con el ultimo valor (l. 32-41, comprobado). Subir `extraerAgentes` de `registrar-coste.ts` (l. 97) y generalizarlo como `extraerRepetible(argv, '--repo')`; registrar-coste pasa a usarlo: un solo parser de flags repetibles.
- `src/commands/metricas.ts` — extiende — el bucle de l. 221-287 pasa a `leerRepoMetricas(repoCwd): Promise<{leidas, filas, advertencias, invalidas}>`, una llamada por `--repo`. El `cuerpoPorId` de `--heuristica` (l. 366) usa hoy un unico `proyecto` y pasa a montarse con lo que devuelve cada repo. `--repo` + `--escribir` se rechaza en `parseFlagsMetricas`, como `--heuristica` (l. 147), antes de leer nada.
- `src/core/metricas.ts` — extiende — `FilaMetricas` gana `total: Duracion | null` (plan a finish, en `calcularFila`; sumar diseno+curso+revision falla si se mezclan precisiones) y `veredictoRonda1` (con `veredictoDeRonda`, que ya existe). `etiquetaTarea(f, varios)` da `proyecto/ID` solo con mas de un repo; la usan los avisos y `tareasSinCoste`.
- `src/core/evolucion.ts` — crea — `tramosEvolucion(filas, n): {tramos: Tramo[], sinCierre: number}`. Orden `(cierre, proyecto, n.º de ID)`; por tramo, mediana de `total`, rondas, IMP por tarea, `tokens.revision` y KB.
- `src/core/grupos-metricas.ts` — crea — `agruparFilas(filas, claveDe, orden)`, las cuatro clasificaciones, `cortesTerciles(valores)` (una vez sobre todas las filas mezcladas) y recuentos aparte de tareas sin revision y sin tabla. `resumirPorNivel` no sirve (clave `TaskComplexity`, solo `rondasMedia`); no se toca.

Alternativas descartadas:
- Lanzar `metricas` una vez por repo y unir las salidas (texto o JSON): no da terciles globales ni orden de cierre comun, y repite la union en un segundo sitio.
- Medir el coste de un agente reanudado en esta tarea: va a una tarea aparte. El cambio esta en `registrar-coste` y `coste-registro.ts` (escriben), no en `metricas` (lee). Forma propuesta: al registrar un `--agente <id>` que ya aparece en el `## Coste` de la tarea, registrar la diferencia entre la transcripcion acumulada y lo ya anotado con ese id. Cambia el contrato de `fuente` y la regla de MEN-2, y ningun criterio de TASK-065 lo pide.

## Limites que cruza

- El contrato de `--json`, nuevo y publico: objeto `{proyectos, evolucion?, grupos?}` armado por la parte pura de core; stdout solo para JSON.
- La linea de uso de `cli.ts` (l. 73 y l. 490 y siguientes): `repoCwd` deja de ser solo `process.cwd()`.
- Repos ajenos, en solo lectura.
- El README del plugin (MEN-4).

Desacuerdos previstos:
- con riesgos, `null` en `--json`: permitido solo junto a `n: 0` en el mismo objeto, que lo explica; no un `{valor, motivo}` por metrica.
- con riesgos, dos `--repo` con el mismo basename: se aborta pidiendo otra ruta; sin `--repo nombre=ruta` en esta tarea.
- con dominio, «aprobada a la primera»: `rondas === 1 && veredictoRonda1 ∈ {aprobada, aprobada-con-correcciones}`.

Suposiciones no verificadas:
- `veredictoDeRonda` devuelve `aprobada-con-correcciones` como valor distinto (ver `VeredictoInforme`, `informe-revision.ts` l. 64-81).
- `rechazarFlagsDesconocidos` acepta un flag repetido (`src/cli/args.ts`).
- El finish esta en las marcas de `calcularFila` para calcular `total` (`metricas.ts` l. 230-280).
- Coste: una pasada por tarea y un `git log` por repo; ordenar y terciles O(n log n) sobre cientos de filas. No medido con los tres repos.

## La decision de diseño que mas te preocupa (UNA sola)

La identidad `(proyecto, id)` vive en la fila pero no en las salidas: `tareasSinCoste`, `avisosDeFila` y `avisoInformesSinTabla` devuelven `f.id` a secas. Con `--repo` hay que cambiarlas todas en el mismo paso.
