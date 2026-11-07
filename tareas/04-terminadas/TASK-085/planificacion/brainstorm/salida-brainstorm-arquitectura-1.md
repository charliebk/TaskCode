# Brainstorm — TASK-085, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: a65224b999240bfbb

## Enfoque propuesto, con rutas y nombres concretos

El hook no escribe en `tarea.md` en cada turno. Anota los deltas en un libro local bajo `.git/`, en la ruta que da `git rev-parse --git-path taskcode/coste-pendiente.json`, el mismo sitio que el memo de `fs/verificacion.ts`. El paso a `tokens_implementacion` y a `## Coste` se hace en un commit que ya existe: la transición de `taskctl review` (commit de `review.ts:819`) y, como red, `finish`. Así `metricas` lo ve sin tocar `metricas.ts`.

## Que se extiende y que se crea

- `src/hooks/coste-turno.ts` + `src/hooks/registro-coste-hook.ts` — se crean nuevos. Siguen el patrón de `stop-verificacion.ts` (entrada fina) con `freno-stop.ts` (decisión pura con dependencias). Las guardas, de la más barata a la más cara, se copian de `decidirStop`: `stat` de `tareas/02-en-curso`, después `listTareasEnEstados`, y el único `git branch --show-current` al final.
- `hooks/hooks.json` — se extiende con una segunda entrada en `Stop` y una nueva en `SubagentStop`, las dos al mismo `.js`. El `timeout` es corto (≈30 s), no los 3600 del freno.
- `src/core/coste-registro.ts` — se extiende con una función pura `consolidarPendiente(body, task, pendientes) -> {task, body}`. Reutiliza `anadirCoste`, `idsDeFuente` y `PREFIJO_DIFERENCIA` (la semántica de diferencia de TASK-065). No hace falta un formato de fila nuevo: `fuente` = `agente:<id>` para los subagentes y `sesion:<id>` para el hilo principal.
- `src/fs/coste-pendiente.ts` — se crea nuevo. Lee y escribe el libro: por cada clave (tarea, sesión o agente) guarda el último uso acumulado visto y el offset en bytes de su transcripción. Es la única pieza con I/O nueva.
- `src/commands/registrar-coste.ts` — se refactoriza: se extrae de `runRegistrarCosteCommand` el núcleo "sumar uso → total + filas" para que lo usen a la vez el comando manual y la consolidación. No debe haber dos caminos que escriban `tokens_<fase>`.
- `review.ts` / `finish.ts` — se extienden. Antes de su `autoCommit`, llaman a `consolidarPendiente` y vacían del libro las entradas de esa tarea. `finish.ts:348`, el aviso de "sin coste", ya se calcula después.

### Orden de construcción

1. Extraer el núcleo de suma de `registrar-coste.ts` y añadir `consolidarPendiente` como función pura en `core/coste-registro.ts`, sin cambiar el comportamiento visible.
2. `fs/coste-pendiente.ts` con su formato versionado, como `VERSION_MEMO` en `verificacion.ts`.
3. La decisión del hook (`registro-coste-hook.ts`), su entrada (`coste-turno.ts`) y el registro en `hooks.json`. En este punto ya acumula, aunque todavía no consolida.
4. Consolidación en `review` y `finish`. Desde aquí `metricas` deja de listar estas tareas.
5. Documentación del hook en `hooks.json` (`description`), en `skills/task-workflow/coste.md` y en el README. Sin mencionar TaskCode: es contenido que se instala en otros proyectos.

## Limites que cruza

- Contrato de hooks de Claude Code (`Stop`, `SubagentStop`) y `hooks/hooks.json`.
- Formato de `tarea.md`: `tokens_implementacion` y la tabla `## Coste` (sin formato de fila nuevo).
- Nuevo fichero local versionado bajo `.git/` (`taskcode/coste-pendiente.json`).
- Contenido instalado en otros proyectos: no puede mencionar TaskCode.

### Alternativas descartadas

- Que el hook invoque `runRegistrarCosteCommand` (escribir y hacer commit de `tarea.md`) en cada turno. Se descarta porque `huellaDelArbol` incluye `rev-parse HEAD` y la foto del árbol (`fs/verificacion.ts:89-90`): cada commit o escritura del hook invalidaría el memo del freno `Stop` y forzaría la verificación completa en cada turno. A eso se suma un commit `chore` por turno en la rama, y que `tarea.md` sucio bloquearía el siguiente `taskctl` (la guarda de §8.3).
- Calcularlo en `metricas` a partir de las transcripciones. No vale: la métrica dependería de la máquina que la ejecuta y de transcripciones que se borran. Y `tokens_<fase>` en el frontmatter ya es el contrato (cabecera de `core/coste-registro.ts`).

### Desacuerdos previstos

- riesgos — que consolidar en `review`/`finish` pierda lo acumulado si la tarea se abandona, si el clon cambia o si los arreglos de la ronda 2 ocurren en `en-revision`. Posición: es preferible a un commit por turno que rompe el memo del freno. `registrar-coste --fase implementacion` sigue sirviendo para el resto.
- dominio — si el hilo principal (`sesion:<id>`) cuenta como implementación, y qué línea base toma una sesión que ya venía de diseño. Se modela como un delta desde la primera vez que el hook la ve en `en-curso`, sin contar lo anterior. La regla de negocio es del rol de dominio.

## La decision de diseño que mas te preocupa (UNA sola)

Consolidar en `review`/`finish` en vez de escribir en cada turno: protege el memo del freno y el workspace limpio, a cambio de que lo acumulado viva solo en el clon local hasta esa transición.

### Suposiciones no verificadas

- Que la entrada de `Stop` trae `transcript_path`/`session_id` y la de `SubagentStop` trae `agent_id`/`agent_transcript_path`. Hay que mirarlo en la documentación de hooks de Claude Code y en `hooks/test/stop.json`.
- Que `sumarUsoTranscripcion` (`core/coste-transcripcion.ts:134`) sirve para la transcripción principal y se puede aplicar a un trozo leído desde un offset. Su deduplicación `porId` podría partir un mensaje entre dos lecturas.
- Que `review.ts` escribe `tarea.md` antes de su `autoCommit` (línea 819) con el cuerpo disponible para insertar la consolidación. Hay que revisar las líneas 683-819.
- Coste estructural: sin offset, leer la transcripción principal entera en cada turno es O(n) por turno y O(n²) por sesión. El offset en el libro lo deja en O(Δ). Conviene confirmar el tamaño real de las transcripciones en ToolsaWeb.
- Que dos hooks `Stop` del mismo plugin se ejecutan en paralelo sin un orden garantizado. Afecta a si el libro bajo `.git/` necesita escritura atómica (renombrado) frente al memo del freno.

**Fuera de mi rol (no lo cubro):** pruebas, casos límite y reglas de negocio.

Ficheros consultados: `hooks/hooks.json`, `src/commands/registrar-coste.ts`, `src/core/coste-registro.ts`, `src/hooks/freno-stop.ts`, `src/hooks/stop-verificacion.ts`, `src/fs/transcripciones.ts`, `src/fs/verificacion.ts`.
