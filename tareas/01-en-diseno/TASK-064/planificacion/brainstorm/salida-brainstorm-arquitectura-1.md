# Brainstorm — TASK-064, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

Un solo contrato entre lectura y agregados: `FilaMetricas` crece con `proyecto`, `tipo`, `criterios`, `coste` (desglose + sin desglose + repetidas), `hallazgos` (severidad × origen), `kbPeticionPorRonda` y `minutosTotal`. Toda la E/S (una pasada por tarea, un `git log` por repo) sale de `runMetricasCommand` a `leerRepoMetricas(repoCwd)`; `--evolucion` y `--grupos` son funciones puras sobre `FilaMetricas[]` que devuelven datos, con dos formateadores (texto y JSON).

Particion natural en dos ramas: **064-A «fila enriquecida»** (criterios 1, 2, 3 + MEN-1 + MEN-2) y **064-B «agregados y multi-repo»** (4, 5, 6, 8); el criterio 7 se reparte. La frontera es `FilaMetricas`.

Orden de construccion:
1. (064-A) `resumirCostes` en coste-registro; `EntradaMetricas`/`FilaMetricas` enriquecidas; lectura del contenido de `revision/` y `stat` de las peticiones en el bucle existente.
2. (064-A) Columnas nuevas en la tabla por defecto, `tareasSinCoste` y aviso de filas repetidas. Entregable sin flags nuevos ni segundo repo.
3. (064-B) Extraer `leerRepoMetricas` y anadir `--repo` + columna `proyecto` (refactor sin cambio de salida con un repo).
4. (064-B) `evolucion.ts` y `grupos-metricas.ts` puros, formateadores de texto y `--json` (un objeto `{proyectos, evolucion?, grupos?}`).
5. (064-B) README/CHANGELOG y linea base sobre los tres repos.

## Que se extiende y que se crea

- `src/commands/metricas.ts` — extiende — el bucle (l. 187-230) pasa a `leerRepoMetricas(repoCwd): Promise<{filas, advertencias}>`, llamado una vez por `--repo`; cada repo con su `git log` y su `porId` (clave `(proyecto, id)`: el mismo TASK-NNN existe en varios proyectos). Flags `--evolucion`, `--tramo N`, `--grupos`, `--repo` (repetible), `--json`.
- `src/core/metricas.ts` — extiende — `EntradaMetricas` gana `informes: string[]` y `bytesPeticiones: number[]`; `calcularFila` sigue pura y llama a `leerCostes` y `leerHallazgos` (ningun parser nuevo). Columnas nuevas en listas `COLUMNAS_*` nuevas; `tareasSinCoste(filas)`.
- `src/core/coste-registro.ts` — extiende — `resumirCostes(filas, tokensFrontmatter)` → `{nuevos, cacheLectura, sinDesglose, repetidas: {fase, fuente}[]}`. Resuelve MEN-2 avisando, no deduplicando; la regla vive junto al parser.
- `src/core/evolucion.ts` — crea — `tramosEvolucion(filas, n): Tramo[]`, ordenados por cierre, puro.
- `src/core/grupos-metricas.ts` — crea — `agruparFilas<K>(filas, claveDe, orden)` generico + las cuatro claves (tipo, complejidad, criterios 0-4/5-6/7+, terciles de KB). `resumirPorNivel` no sirve (clave `TaskComplexity`, solo `rondasMedia`); no se toca, candidato a delegar mas adelante.
- `src/core/tarea-body.ts` — se usa sin cambios — criterios = `extraerSecciones(body).criterios.length`: una sola definicion de «criterio», la misma que la heuristica.

Alternativas descartadas:
- Portar el script ad hoc como comando aparte (`taskctl linea-base`): dos lectores con reglas distintas del mismo hecho; la linea base no coincidiria con `metricas`.
- Leer `revision/` solo con `--evolucion`/`--grupos`: rompe «tabla y agregados salen de la misma fila» (decision del plan de TASK-063) y deja campos que existen segun el flag. Coste lineal (~189 tareas).

## Limites que cruza

- CLI (`cli.ts`, `src/cli/args.ts`): `--repo` repetible puede exigir extender `parseArgs` (modulo compartido). `tareasRoot` hoy es `<cwd>/tareas`: hay que derivar `tareasRoot` y `repoCwd` por cada `--repo`.
- Lectura de repos ajenos (los tres de la linea base), solo lectura.
- `core/coste-registro.ts` y `core/informe-revision.ts` de TASK-063, como consumidor.

Desacuerdos previstos:
- con riesgos (rendimiento de leer `revision/` siempre en tres repos): siempre, en una pasada; si molesta, medir antes de condicionar a flags.
- con dominio (MEN-2): no deduplicar en lectura, avisar con `repetidas`.
- con dominio (terciles de KB): sobre el conjunto mezclado de todos los `--repo`, para que los grupos sean comparables; si se quieren por proyecto, cambia `agruparFilas`, no la lectura.

Suposiciones no verificadas:
- «Aprobado en la primera ronda» = `rondas === 1` con veredicto aprobado: mirar si el script ad hoc usa `veredictoDeRonda` o solo el numero de ronda.
- Hallazgos sobre todas las rondas, no solo la ultima (`nombresDeUltimaRonda` da solo la ultima; ver `fs/rondas.ts` l. 110+).
- `parseArgs` no admite flags repetidos: mirar si `--repo` necesita extenderlo.
- Nombre de proyecto = `basename(repo)`: comprobar que basta o si hace falta `--repo nombre=ruta`.

## La decision de diseño que mas te preocupa (UNA sola)

Que `FilaMetricas` sea el unico contrato: si crece con campos opcionales «solo con flag» (como hoy `heuristica?`), los agregados de 064-B no distinguen un null de «no medido» de uno de «no leido».
