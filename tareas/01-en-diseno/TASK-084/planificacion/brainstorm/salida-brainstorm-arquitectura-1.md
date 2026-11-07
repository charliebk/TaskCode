# Brainstorm — TASK-084, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

La versión se escribe en la misma tabla `## Transiciones` que ya mantiene `src/core/transiciones.ts`, como **quinta columna `version`**. Así viaja en el mismo commit que la transición, igual que la fecha desde TASK-052. Las métricas se agregan en un módulo puro nuevo que es hermano de `core/grupos-metricas.ts`. Las rutas son relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

1. **De dónde sale la versión.** Hoy es `const VERSION = '0.11.0'` en `src/cli.ts:62` y no se exporta. Propongo moverla a `src/core/version.ts` como `export const VERSION_TASKCTL`. `cli.ts` la importaría para `--version` y para la ayuda. Así el núcleo no depende de `cli.ts`.
2. **Escritura.** `FilaTransicion` gana `version: string | null`. `filaATexto` escribe 5 celdas y `CABECERA`/`SEPARADOR` pasan a 5 columnas. Para el valor, `registrarTransicion(...)` recibe un parámetro opcional `version = VERSION_TASKCTL` al final de la firma. Así los 6 llamantes (`approve.ts:197`, `finish.ts:637`, `pausa.ts:90`, `plan.ts:1027`, `review.ts:639`, `start.ts:296`) no cambian, y ninguno de sus `*Deps` gana un campo nuevo. Es el mismo patrón por defecto que ya usa `decididoPor`.
3. **Lectura.** `leerTransiciones` acepta 4 celdas (`version: null`) o 5. Hoy descarta la fila si `celdas.length !== 4` (`transiciones.ts:214`).
4. **Dato por tarea.** `FilaMetricas` gana `versionCierre: string | null` en `src/core/metricas.ts`. `calcularFila` lo toma de la versión de la última fila `finish` del registro, que es el mismo criterio con el que `marcasDe` elige `finish`. Si el origen es `git` o `—`, queda `null`: git no lleva versión y no se deduce por fecha, que es justo el error que motiva la tarea.
5. **Agregado.** Se crea `src/core/versiones-metricas.ts` con dos funciones puras: `calcularPorVersion(filas): PorVersion` y `formatearPorVersion(p)`.
   - Reutiliza `resumirGrupo` y `aprobadaALaPrimera` de `grupos-metricas.ts` para las rondas y las aprobadas a la primera.
   - Suma `hallazgos.porSeveridad` y `hallazgos.porOrigen`, y da los `tokens` por fase.
   - Hay un grupo «sin versión», que se cuenta aparte y no como cero, como `sinKb`.
   - Los grupos son dinámicos (las versiones encontradas), ordenados por semver.
6. **CLI.** En `src/commands/metricas.ts`:
   - `--por-version` entra en `FLAGS_METRICAS` y en `FLAGS_CON_JSON`.
   - Entra también en el bloque de los agregados que chocan con `--heuristica`, `--tokens` y `--escribir`, que hoy cubre solo `--evolucion` y `--grupos`.
   - `SalidaJsonMetricas` gana `porVersion?: PorVersion`.
   - Hay que añadir el flag a `HELP` en `cli.ts`.

## Que se extiende y que se crea

- **Se extiende `core/transiciones.ts`** (formato de la fila, lectura de 4 o 5 celdas, parámetro `version`). No se crea otra sección: una sección `## Version` aparte sería un segundo registro que puede discrepar del primero. El mismo módulo descartó por eso un campo en el frontmatter para el modo congelado (`transiciones.ts:23-28`).
- **Se extiende `core/metricas.ts`** con `versionCierre` en `FilaMetricas` y en `calcularFila`.
- **Se crea `core/versiones-metricas.ts`** y no se mete en `calcularGrupos`, porque `Grupos` promete grupos fijos («un grupo sin tareas sale con n 0», `grupos-metricas.ts:8-11`) y las versiones son abiertas. Además pide más cifras que `GrupoMetricas` (severidad completa, origen y tokens). Ampliar `GrupoMetricas` cambiaría la salida `--json` de `--grupos`, que es un contrato público.
- **Se crea `core/version.ts`**: una constante que sale de `cli.ts`.
- **Se extiende `commands/metricas.ts`**: un flag, una rama de salida y un campo en el JSON. Sin E/S nueva: no hace falta otro `git log` ni otra lectura, porque el dato ya está en `body`.
- **No se tocan** `coste-registro.ts` (la tabla hermana `## Coste`), el board ni el frontmatter.

## Limites que cruza

- **El formato de fichero de `tarea.md`, que es público.** Cambian la cabecera y el número de celdas de `## Transiciones`. Hay precedente directo: TASK-052 descartó una 5.ª columna `hora` porque las filas viejas no se leían (`transiciones.ts:12-17`). Aquí ese motivo no aplica, porque el lector nuevo acepta 4 y 5 celdas. Lo que sí se repite es lo que TASK-052 aceptó: un plugin anterior no ve las filas nuevas y pierde el modo congelado. Ese coste se acepta con «una versión del plugin por repo».
- **El contrato `--json` de `taskctl metricas`** (`SalidaJsonMetricas`, «cambiarla rompe a quien lo lea»). Solo se añade una clave opcional y no se cambia ninguna existente.
- **La dirección de las dependencias.** Hoy la versión vive en el punto de entrada (`cli.ts`). Si `core/transiciones.ts` la importara de ahí, el núcleo dependería del CLI. Moverla a `core/version.ts` deja la flecha `cli → core`.
- **La forma del coste se mantiene.** Sigue siendo una pasada por tarea y como mucho un `git log` por repo: la versión sale del cuerpo ya leído. El agregado es O(tareas).

## La decision de diseño que mas te preocupa (UNA sola)

**Qué hacer con la cabecera de 4 columnas de las tablas que ya existen.** Las tareas en curso tienen la tabla vieja, y `anadirTransicion` añade la fila detrás de la última fila de la tabla (`transiciones.ts:191`). Si se añade una fila de 5 celdas bajo una cabecera de 4, GFM ignora la celda que sobra: la versión estaría en el fichero, pero no se vería en GitHub ni en GitLab. Mi propuesta es reescribir **solo la cabecera y el separador** a 5 columnas la primera vez que se añade una fila con versión. Nunca se tocan las filas de datos: con GFM, a las viejas les sale una celda vacía. Esto choca con la letra del contrato del módulo («nunca reescribe filas ni toca nada fuera de su sección», `transiciones.ts:30-31`). La cabecera no es una fila de datos, pero hay que decirlo y documentarlo en el comentario, no hacerlo a escondidas. La alternativa sin reescribir cabecera es meter la versión dentro de una celda existente, por ejemplo `persona@0.12.0`. La descarto porque mezcla dos datos en una celda que valida un vocabulario cerrado (`DECIDIDO_POR`).

**Suposiciones no verificadas:**
- La versión puede estar repetida en `package.json` o `.claude-plugin/plugin.json`, con un test que las sincroniza. Si es así, `core/version.ts` debería entrar en esa comprobación. Hay que buscar `0.11.0` en todo el plugin.
- No sé si hay tests que comparan la cabecera literal `| fecha | fase | modo | decidido_por |`. Habría que buscarla en `test/`.
- Doy por hecho que la regla «versión de su cierre = la de la última fila `finish`» es la que quiere dominio. Es una regla de negocio y no la he validado.
