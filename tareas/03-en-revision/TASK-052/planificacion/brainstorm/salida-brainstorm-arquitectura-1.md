# Brainstorm — TASK-052, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

- **Marca de tiempo**: la celda `fecha` de `## Transiciones` pasa a guardar un
  instante ISO (`2026-10-05T14:03:22Z`). Es la tabla que ya escriben
  `plan|approve|start|review|finish|pausa` (`src/core/transiciones.ts`): no se
  crean claves `ts_*` en el frontmatter. `leerTransiciones` acepta las dos
  formas (`YYYY-MM-DD` y el ISO completo).
- **`taskctl metricas`**: comando nuevo de solo lectura con el patron de
  `board`: `src/commands/metricas.ts` exporta `FLAGS_METRICAS` y
  `runMetricasCommand`, valida con `rechazarFlagsDesconocidos`
  (`src/cli/args.ts`) y se cablea en `src/cli.ts`.
- **Calculo en un modulo puro**, `src/core/metricas.ts`: recibe la tarea, el
  cuerpo, los nombres de `revision/` y, si las hay, fechas de git; devuelve una
  fila (id, complejidad, diseno, curso, revision, rondas, cierre). Rondas con
  `nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).ronda` (`src/fs/rondas.ts`),
  el mismo criterio que `finish` y `veredicto`.
- **Tareas antiguas**: primero la tabla de Transiciones (aunque solo tenga
  fecha); si no hay, las fechas de los commits `chore(TASK-NNN): tarea en
  diseno|...|terminada` con **una sola** llamada a `git log`; si tampoco, `?`.
  Cada fila dice su origen (`registro|git|?`); con precision de dia, la
  duracion se da en dias.
- **Recalibracion**: `taskctl metricas --heuristica` anade a cada tarea
  terminada `puntuarTarea` y `nivelHeuristico` (`src/core/heuristica.ts`)
  recalculados con el YML vigente; con esa tabla se ajustan pesos y umbrales de
  `scripts/heuristica-complejidad.yml`, dejando en el YML como comentario la
  salida que los justifica. Reproducible sin script de usar y tirar.
- **Limpieza**: fuera `tolerancia_niveles`, `tolerancia_extra_si_heuristica_menor`
  y `modelo_consulta_discrepancia` de `CLAVES_NUMERICAS`, `CLAVE_MODELO`, la
  interfaz `Heuristica` y la seccion 5 del YML; y el parrafo «CONSECUENCIA QUE
  HAY QUE DECIR EN VOZ ALTA» de `heuristica.ts`, que deja de ser verdad.

## Que se extiende y que se crea

- `src/core/transiciones.ts`: se extiende (la `fecha` es un instante,
  `instanteDe(fila)`). No se toca el parser de frontmatter ni `TASK_FIELD_ORDER`.
- Los seis llamadores de `registrarTransicion` (`plan.ts:1007`,
  `approve.ts:182`, `start.ts:294`, `review.ts:584`, `finish.ts:410`,
  `pausa.ts:88`) reciben `ahora` (ISO); `ahora()` junto a `today()` en
  `cli.ts:105` (`today` lo siguen usando `actualizado` y `board`).
- Se crean `src/core/metricas.ts` (puro) y `src/commands/metricas.ts` (E/S).
- `heuristica.ts` y el YML: se ajustan valores y se recortan claves muertas;
  `puntuarTarea` se reutiliza tal cual.
- Fuera de alcance: `docs/METRICAS.md` (informe a mano de los Sprints 0-1) y
  TASK-023, que encaja como columnas adicionales de la misma fila (la fila debe
  ser un registro con columnas declaradas en una lista).

## Limites que cruza

- Formato de `tarea.md`: cambia el contenido de la celda `fecha` (mas
  precision, mismo dato).
- YML instalado en proyectos ajenos: `parsearHeuristica` aborta ante claves
  desconocidas; un YML de usuario con `tolerancia_*` fallaria.
- CLI publica: `metricas` en el `HELP` de `cli.ts`, en `CLAUDE.md` y en la
  skill `task-workflow` (sin mencionar el proyecto).
- `metricas` es el primer comando de lectura que consulta `git log`: una
  llamada fija por ejecucion.
- Coste lineal en numero de tareas, sin cache.

Alternativas descartadas: claves `ts_*` en el frontmatter (duplican la tabla
que `transiciones.ts` y `rondas.ts` ya rechazaron como segundo sitio; el parser
no tiene listas de mapas y dos `review` se pisarian; obligan a tocar `Task`,
`validateTask`, `TASK_FIELD_ORDER`); un script o test que lea
`tareas/04-terminadas` de este repo (segundo lector con sus reglas; acopla la
suite a datos que no viajan con el plugin).

Desacuerdos previstos: con dominio sobre «en el frontmatter» (lo leo como «en
`tarea.md`, junto a la transicion»; reabrir la decision de TASK-056 lo decide
el unificador explicitamente); con riesgos sobre compatibilidad entre
versiones (un plugin anterior no reconoce filas con hora, pierde el modo
congelado y duplica filas; aceptable con una version por repo, pero explicito).

## La decision de diseño que mas te preocupa (UNA sola)

Guardar el instante en la celda `fecha` en vez de una quinta columna `hora`:
una columna mas rompe `celdas.length !== 4` en todas las filas; cambiar la
celda solo afecta a las nuevas. A cambio, la celda deja de ser homogenea y
`core/metricas.ts` tiene que llevar la precision (dia o segundo) por dato.

Sin verificar: que todo cambio de fase antiguo deja un commit `chore(TASK-NNN)`
reconocible; que ~50 tareas basten para umbrales con sentido (solo ~5 tienen
registro de Transiciones; las rondas salen de todas); que no haya copias de
usuario del YML (`resolverRutaHeuristica`, `heuristica.ts` 215-255); y que
intervalo cuenta como diseno/curso/revision y como tratar `pausa` (dominio).
