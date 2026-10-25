# Plan — TASK-063: Metricas v2: medir el comportamiento del plugin para decidir mejoras con datos

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Persistir lo nuevo en una tabla `## Coste` en el cuerpo de `tarea.md` (como `## Transiciones`), dejar los `tokens_<fase>` del frontmatter como el total que ya son, y concentrar toda la lectura en `core/` puro siguiendo el patron de `core/metricas.ts` + una sola pasada de E/S por tarea en `commands/metricas.ts`.

**Piezas (extiende / crea):**

- **`core/coste-transcripcion.ts` — extiende.** `sumarUsoTranscripcion` devuelve ademas `{entrada, cacheEscritura, cacheLectura, salida, lecturas}`; `tokens` (suma) se conserva para no romper llamantes. `lecturas` = bloques `tool_use` cuyo `name` esta en una constante `HERRAMIENTAS_LECTURA` (Read, Grep, Glob, ...), deduplicados por `tool_use.id` igual que hoy se deduplica por `message.id`.
- **`core/coste-registro.ts` — crea.** Parse/append puro de la tabla `## Coste` (`| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas |`), calcado de `core/transiciones.ts`. Es el precedente directo: TASK-056 eligio tabla en el cuerpo frente a campos de frontmatter para no tocar el parser ni `TASK_FIELD_ORDER`. El frontmatter descarta el anidamiento (cabecera de `core/frontmatter.ts`), asi que el desglose en frontmatter serian 15 claves planas nuevas en cada tarea. Las tareas antiguas no tienen tabla: lo no cubierto por el desglose sale como «sin desglose» = `tokens_<fase>` − suma de filas. `--tokens N` deja una fila con solo total.
- **`commands/registrar-coste.ts` — extiende.** Con `--agente` escribe una fila por invocacion con el desglose sumado de sus agentes, ademas de sumar el total al frontmatter como hoy; ambas cosas en el mismo commit y el mismo fichero.
- **`core/informe-revision.ts` — extiende.** `hallazgosNoCerrados` pasa a ser un filtro sobre una nueva `leerHallazgos(informe)` que devuelve todas las filas con `severidad` y `origen`: un solo parser de la tabla, como en TASK-040. Columna `Origen` ausente ⇒ «sin clasificar».
- **`commands/review.ts` (`informeTemplate`) + skills `task-workflow/revision.md` y `review/SKILL.md` — extiende.** Columna `Origen (implementacion / plan / especificacion)` e instruccion de rellenarla; texto generico, sin mencionar TaskCode.
- **`core/metricas.ts` — extiende.** `FilaMetricas` gana `total` (plan→finish), `hallazgos` por severidad y por origen, `kbPeticiones` y el desglose de coste; columnas nuevas en las listas `COLUMNAS_*` existentes (estan para eso, lo dice su comentario). Mas `tareasSinCoste(filas)`.
- **`core/evolucion.ts` — crea.** Puro: filas terminadas + tramo N → `TramoEvolucion[]`; formateador de texto y `JSON.stringify`. Aparte de `metricas.ts` (540 lineas).
- **`commands/metricas.ts` — extiende.** Flags `--evolucion`, `--tramo N`, `--json`. Para `revision/` pasa de leer solo nombres a leer el contenido de los informes y el `stat` de las peticiones: coste lineal en ficheros (~165 informes en ToolsaWeb), sigue habiendo un solo `git log` para todo el repo. Se lee siempre, no solo con `--evolucion`, para que tabla y evolucion salgan de la misma fila.
- **`commands/finish.ts` — extiende.** El bucle `sinCoste` (l. 339) anade `implementacion` y se borra el comentario que la excluia; sigue siendo aviso.
- **`cli.ts`, README, CHANGELOG** — uso y documentacion.

**Orden (cada paso entregable solo):**

1. Desglose + lecturas en `coste-transcripcion`, `coste-registro`, `registrar-coste` (criterios 1 y 5, captura).
2. `leerHallazgos` + columna `Origen` en plantilla y skills (criterios 3 y 4, formato).
3. Columnas nuevas de `metricas` + `tareasSinCoste` + aviso de `finish` (criterios 1, 2, 4 y 5, lectura).
4. `core/evolucion.ts` + `--evolucion/--tramo/--json` (criterio 6).
5. README/CHANGELOG + linea base sobre ToolsaWeb (criterios 7 y 8).

**Tamano.** La heuristica da «simple» (1 punto, solo por numero de criterios). A juicio del rol se queda corta: toca 3 comandos, 2 formatos de fichero (`tarea.md` e informe) y 2 skills instaladas. Propuso partir en dos ramas: **063-A «captura»** (pasos 1-2 + la parte de `finish`, cambia formatos) y **063-B «lectura»** (pasos 3-5, solo lee). Ver la decision tomada abajo.

**Alternativas descartadas:**

- 15 claves planas en el frontmatter (`tokens_diseno_cache_lectura`...): engorda cada `tarea.md`, obliga a tocar `TASK_FIELD_ORDER` y `validateTask`, y aun asi no dice que agente aporto que cifra.
- Fichero `coste.json` aparte por tarea: primera excepcion a «todo en Markdown legible», y `registrar-coste` tendria que commitear dos rutas.
- Sacar la evolucion de `docs/METRICAS.md`: ese bloque solo tiene tokens y no duraciones, a proposito, para ser determinista.

## Lo que el rol no cubrio

- Criterio 1: que es exactamente «tokens nuevos» (resuelto abajo), y que hacer si la tabla suma mas que `tokens_<fase>` por edicion a mano.
- Criterio 4: si `origen` es por hallazgo o por informe; vocabulario exacto y normalizacion (tildes, mayusculas).
- Criterio 5: la lista de «equivalentes» de Read/Grep/Glob, incluidos MCP de lectura y Bash.
- Criterio 6: orden de los tramos, el ultimo tramo incompleto, y que hacer con marcas de precision de dia (propuesta: fuera de la mediana, diciendo cuantas son). Las «rondas medias» salen del numero de la ultima ronda, como hoy.
- Criterio 3: no comprobo como cuenta el script ad hoc los informes antiguos sin tabla; las cifras de la linea base pueden no coincidir con la medicion a mano.
- Riesgos y testing: no los miro ningun rol especializado; lo de abajo es minimo.

## Riesgos aceptados y que los contiene

- **Dos sitios para el coste** (total en frontmatter, desglose en tabla): los escribe siempre `registrar-coste` en el mismo commit; `metricas` muestra la diferencia como «sin desglose» en vez de esconderla.
- **Formato de transcripcion no documentado** (`tool_use` en `message.content`): sin `usage` se aborta como hoy; sin `tool_use`, `lecturas` queda en 0 y la tabla lo dice. No verificado contra fuente oficial.
- **Un plugin anterior no ve `## Coste` ni `Origen`**: no rompe (no la lee; el parser de hallazgos busca columnas por nombre: `col('id')`, `col('estado')`). Se acepta, como en TASK-052.
- **Leer el contenido de `revision/` hace `metricas` mas lento**: lineal y ficheros pequenos; no medido.

## Plan de pruebas

(Esbozo, no revisado por el rol de testing.)

- Unitarias puras: `sumarUsoTranscripcion` (desglose, `tool_use` repetidos por streaming, nombres fuera de la lista); `coste-registro` (anade sin reescribir, cuerpo antiguo intacto); `leerHallazgos` (con y sin `Origen`, tabla dentro de un bloque de codigo); `evolucion` (tramos de N, ultimo incompleto, precision de dia).
- Repos Git temporales reales: `registrar-coste --agente` con `.jsonl` de ejemplo en un `CLAUDE_CONFIG_DIR` temporal; `metricas` con tareas en formato antiguo (solo total, informes sin `Origen`, `informe-revision-N-<revisor>.md`) y nuevo; `--evolucion --json` validado con `JSON.parse`; `finish` sin `tokens_implementacion` avisa y cierra.
- Instalables: el test existente de que las skills tocadas no mencionan TaskCode.
- Linea base: `node dist/src/cli.js metricas --evolucion` con cwd en ToolsaWeb; `git status` alli sin cambios.

## Lo que necesita decision de una persona

Resuelto en la fase de diseno (Carlos, 2026-10-25):

1. **Particion: si.** Esta tarea queda como **063-A «captura»** (pasos 1 y 2 del orden, mas el aviso de `finish`): sus criterios se reescribieron en `tarea.md`. Los pasos 3 a 5 (lectura en `metricas`, `tareasSinCoste`, `core/evolucion.ts`, `--evolucion/--tramo/--json`, README y linea base de ToolsaWeb) pasan a **TASK-064**, que depende de esta.
2. **Desglose en tabla `## Coste`** en el cuerpo de `tarea.md`, como propone el plan. El frontmatter conserva el total.
3. **Lecturas**: Read, Grep, Glob, los MCP de lectura o busqueda (lista cerrada en la constante `HERRAMIENTAS_LECTURA`) **y Bash de lectura**: un `tool_use` de Bash cuenta si su comando, tras quitar espacios iniciales, empieza por `cat`, `head`, `tail`, `grep`, `rg`, `find`, `ls` o `sed -n`. Es heuristico a sabiendas; la lista vive en una constante y se documenta.
4. **Origen por hallazgo** (columna `Origen` en cada fila). Vocabulario cerrado: `implementacion`, `plan`, `especificacion`; se normaliza a minusculas y sin tildes; cualquier otro valor o celda vacia cuenta como `sin clasificar`. Los **tramos de `--evolucion` se ordenan por fecha de cierre** (eso es de TASK-064).
5. **«Tokens nuevos»** = entrada + escritura de cache + salida; la lectura de cache va aparte. Si la tabla suma mas que `tokens_<fase>` (edicion a mano), no se corrige nada en esta tarea: TASK-064 lo mostrara como diferencia negativa.
6. **`docs/METRICAS.md`** no gana columnas en esta tarea.

## Alcance de esta tarea tras la particion

Pasos 1 y 2 del orden de construccion y la parte de `finish` del paso 3. No toca `core/metricas.ts` ni `commands/metricas.ts` salvo lo minimo para que compilen con las firmas nuevas.
