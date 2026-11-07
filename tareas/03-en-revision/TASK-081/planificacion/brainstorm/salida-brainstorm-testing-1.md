# Brainstorm — TASK-081, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: brainstorm-testing

Sin enfoque previo: razono sobre lo que piden los criterios. Las rutas son relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Que es observable sin llamar a ningun agente

- **Hoy no se puede saber de qué revisor ni de qué ronda es cada lectura.** Una fila de `## Coste` (`src/core/coste-registro.ts`) tiene `fecha | fase | fuente | … | lecturas | total`. `fuente` es `agente:<id>[,<id>…]`, sin revisor ni ronda. Varios `--agente` se suman en UNA fila (test `registrar-coste-agente.test.ts:200`). Para que el criterio 1 se pueda comprobar desde fuera, la atribución revisor+ronda tiene que quedar escrita en algún sitio legible: en `tarea.md` o en la salida de `metricas`. Cómo se consigue lo decide arquitectura. Lo que sí afirmo: sin eso no hay prueba posible del criterio 1.
- **Lo que ya existe y se puede reutilizar:**
  - `sumarUsoTranscripcion` ya cuenta `lecturas`, deduplicadas por el `id` del `tool_use` (`src/core/coste-transcripcion.ts`, TASK-063).
  - Los tests ya fabrican `agent-<id>.jsonl` bajo un `CLAUDE_CONFIG_DIR` temporal (`registrar-coste-agente.test.ts:26-50`). Las transcripciones reales viven fuera del repo y sin doble; el patrón sirve tal cual.
- **Qué se puede comprobar en la petición y en la skill:**
  - **Lista de contexto permitido:** es texto de `peticion-revision-N[-revisor].md`, que genera `peticionTemplate` (`src/commands/review.ts:167`). Se comprueba leyendo el fichero generado por el CLI, igual que ya hace `review-dominios.test.ts:81`.
  - **Sugerencia de modelo en ronda 2:** también es texto de la petición. Su entrada son las tablas de hallazgos de la ronda 1, que ya leen `hallazgosNoCerrados` y `leerRondaPrevia` (`review.ts:262`). Se puede probar por la CLI con `veredicto` + `review`, como hace `review-incremental.test.ts:117`.
  - **Mandato de la skill:** es texto de `skills/task-workflow/revision.md`, que es la referencia común de las cuatro revisoras (test `revisores.test.ts` 10d/10e).
- **Lo que no se puede comprobar con una prueba:**
  - **Que el revisor obedezca la lista.** Es comportamiento del modelo. Lo único medible es *a posteriori*: contar en la transcripción las lecturas cuya ruta queda fuera de la lista. Si la tarea no mide «lecturas fuera de lista», el criterio 2 se queda en «el texto existe» y nadie sabrá si sirvió. Lo dejo dicho como límite, no como requisito nuevo.
  - **Que se usó de verdad el modelo más barato.** Desde la CLI solo se ve que se sugirió. Supongo, sin haberlo verificado, que las líneas de asistente de la transcripción llevan `message.model`. Si es así, es la única forma de comprobar que la sugerencia se siguió.
- **El criterio 4 (`docs/METRICAS.md` del repo) no tiene prueba automática** ni compensa hacerla: es documentación y la verifica el revisor leyéndola.

## Plan de pruebas, cada una con su mutacion

Todas contra repos Git temporales (`withRepo`, `automatico-fixtures`) y un `CLAUDE_CONFIG_DIR` temporal con `.jsonl` escritos a mano, sin mocks.

1. **Prueba pura de lecturas por ruta.** De una transcripción con `Read{file_path}`, `Grep{path}`, `Glob{path}` y `Bash cat x`, la función devuelve las rutas leídas y cuántas caen fuera de una lista dada (si se mide).
   - Fixture con rutas **absolutas y con `\`**, dentro de un clon en `%TEMP%`, porque así las escribe Claude Code y la revisión clona a un directorio temporal.
   - *Mutación:* comparar la ruta sin normalizar (sin quitar la raíz del clon ni convertir `\`→`/`) → todas salen «fuera» → rojo. Otra: ignorar `path` de Grep/Glob → el recuento baja → rojo.
2. **CLI `metricas --tokens` con dos revisores en ronda 1 y uno en ronda 2.** Las lecturas registradas son 3, 5 y 2, a propósito distintas. Se asevera la tripleta exacta (revisor, ronda, lecturas) en la salida.
   - *Mutación:* agrupar solo por revisor → sale 5 donde iba 3+2 → rojo. Atribuir todo a la ronda 1 → falta la fila de ronda 2 → rojo. Intercambiar revisores → con cifras distintas, rojo.
3. **Persistencia: borrar el `CLAUDE_CONFIG_DIR` después de `registrar-coste` y antes de `metricas`.** Las lecturas siguen saliendo si se guardaron en `tarea.md`. Si se decide leerlas en el momento, la celda dice `—`, nunca `0`.
   - *Mutación:* leer la transcripción al ejecutar `metricas`, o convertir «ausente» en `0` → rojo.
4. **Compatibilidad hacia atrás de `## Coste`.** Una `tarea.md` con filas de 9 columnas, anteriores a la tarea, se sigue leyendo con sus totales y sin revisor (`—`). `doctor` la sigue dando por válida.
   - *Mutación:* exigir el nuevo número de columnas en `leerCostes` (hoy `COLUMNAS = 9`, `coste-registro.ts:129`) → las filas viejas desaparecen → rojo.
5. **Lista de contexto permitido en la petición (CLI `review`).** Se asevera por los dos lados:
   - **Positiva:** la carpeta de la tarea y los ficheros del diff están en la lista.
   - **Negativa:** un fichero versionado que no está en el diff NO aparece.
   - **Fragmentada (`review-dominios`):** cada petición lista solo los ficheros de su dominio.
   - *Mutación:* construir la lista con `git ls-files` → la negativa se pone roja. Usar el diff completo en vez del fragmento → la fragmentada se pone roja.
6. **Matriz de la sugerencia de modelo en ronda 2 (CLI `veredicto` + `review`).** Casos:
   - (a) solo IMPORTANTE abiertos → sugiere el barato;
   - (b) un CRITICO `abierto` → mantiene `modelo_sugerido`;
   - (c) la ronda 1 fragmentada, con el CRITICO solo en el SEGUNDO informe → mantiene;
   - (d) informe sin tabla de hallazgos → mantiene, porque desconocido no es 0 (`review.ts:296-300` ya distingue el caso);
   - (e) la ronda 1 nunca sugiere el barato.
   - *Mutaciones:* invertir la condición (a/b); leer solo `nombres[0]` (c); tratar `sinTabla` como 0 abiertos (d); quitar la guarda `ronda > 1` (e).
   - Que un CRITICO `corregido` cuente o no como abierto es regla de dominio. La prueba toma lo que dominio decida, pero el caso tiene que estar.
7. **Skill común: `revision.md` contiene el mandato en una sección propia.** Se comprueba al estilo de 10/10bis: estructura, no una palabra suelta. Además, la frase solo vive ahí (10e) y no menciona marcas del repo (test 11, que ya existe).
   - *Mutación:* borrar el párrafo, o dejar solo la palabra «permitidos» en prosa → rojo. Para que esa segunda mutación se ponga roja hace falta una contraprueba como 9b/10bis.

## Aserciones trampa que hay que evitar en esta tarea concreta

- **`match(/modelo sugerido/)`:** la petición YA lleva `(modelo sugerido: ${task.modelo_sugerido})` en todas las rondas (`review.ts:200`). Pasa con la sugerencia sin implementar. Hay que aseverar el valor concreto y la diferencia entre ronda 1 y ronda 2.
- **`lecturas > 0` o `match(/lecturas/)`:** pasan con la atribución rota. Las cifras exactas tienen que ser distintas por revisor y ronda; un fixture con el mismo número en todos tapa los intercambios.
- **Reutilizar `TRANSCRIPCION_EJEMPLO`** (`test/helpers/transcripcion-ejemplo.ts`) para probar rutas: usa rutas relativas (`a.ts`), irreales, y cambiarla rompe `USO_EJEMPLO` («EXACTAMENTE 9 lecturas», `coste-transcripcion.test.ts:106`) y los tests de TASK-063. Hay que crear un fixture nuevo con rutas absolutas de Windows y de POSIX.
- **Solo la aserción positiva de la lista** (`includes(fichero)`): una lista con todo el repo la pasa.
- **Una matriz de modelo con un solo informe por ronda:** no detecta que se lea únicamente el primero de una ronda fragmentada.
- **Copiar literales de modelo (`'haiku'`, `'sonnet'`) en varios tests:** la tabla de «más barato» tiene que salir de una constante exportada que el test importe, como hace 10c con `informeTemplate`. Si no, la primera renovación de modelos obliga a tocar N tests.
- **Dar por buena la prueba sin comprobar el `git status` limpio** tras `metricas` sin `--escribir`: hoy es una invariante (`metricas-tokens.test.ts:87`) y hay que conservarla.

## Que pruebas existentes cambian de expectativa

- **Si las lecturas por revisor entran como columnas de la tabla principal:**
  - `metricas-tokens.test.ts:71` (cabecera anclada con `$`) y `:75/:77` (`.slice(-7)`) cambian.
  - Prefiero una sección aparte: así esas dos siguen sirviendo de red de regresión sin tocarse.
  - Si se tocan, solo se acepta añadir columnas; nunca relajar el ancla.
- **Si cambia la forma del bloque de `docs/METRICAS.md`:**
  - Cambian `metricas-tokens.test.ts:136-138` (forma de fila, «ninguna fecha») y `metricas-fila.test.ts:188` («el bloque no cambia de forma»).
  - La propiedad de que el bloque no lleve fechas y sea idempotente debe sobrevivir sin cambios.
- **`review-dominios.test.ts:81/85`:** exige la línea exacta `Agente a lanzar: X (modelo sugerido: Y)` y `result.modelo === task.modelo_sugerido`.
  - En ronda 1 debe seguir pasando tal cual: es la red de que la ronda 1 no cambia.
  - Si `result.modelo` pasa a reflejar la sugerencia, solo puede cambiar en ronda 2, y con un test nuevo.
- **Si el informe gana un campo de cabecera** (p. ej. «lecturas fuera de lista justificadas» en `informeTemplate`): 10b/10c de `revisores.test.ts` obligan a actualizar el esqueleto de las cuatro skills revisoras.
  - Es legítimo; el test existe justo para eso.
  - Y `review-incremental.test.ts:117`, si asevera secciones de la petición de ronda 2: no lo he leído entero, confirmarlo.

Siguen valiendo sin cambios como red: `coste-transcripcion.test.ts` entero, los tests TASK-063/065 de `registrar-coste-agente.test.ts`, `revisores.test.ts` 10e/11, y los rechazos de flags (`metricas-tokens.test.ts:106`).

## Como envejece

- **Formato de transcripción de Claude Code** (ruta `projects/<p>/<sesion>/subagents/agent-<id>.jsonl`, campos `file_path`/`path`/`model`):
  - Los fixtures fabricados reproducen el formato como lo creemos hoy. Si Claude Code lo cambia, la suite sigue verde y en producción sale todo `0`/`—`.
  - Mitigación barata: un `.jsonl` real saneado, capturado de una revisión de verdad y versionado como fixture, más un aviso cuando una transcripción con `tool_use` da 0 lecturas.
- **Dos listas cerradas que mantener a mano:** `HERRAMIENTAS_LECTURA` y, a partir de ahora, qué campo de cada herramienta lleva la ruta.
  - Una herramienta nueva (otro MCP) cuenta 0 lecturas en silencio.
  - Tiene que haber una única tabla herramienta→campo, no una lista de nombres más un `switch` aparte.
- **Tabla de «modelo más barato»:** los nombres de modelo caducan.
  - Si vive en más de un sitio (CLI, skill, tests), divergirá.
  - Un solo export, importado por los tests y referenciado sin literal por la skill.
- **La lista de contexto permitido crecerá** con cada artefacto nuevo de la metodología (plan, brainstorm, cobertura). Cada uno obliga a tocar el generador y la aserción negativa.
  - Si la regla «qué entra en la lista» no está en un único sitio, la negativa se acabará relajando para que pase.
- **La ronda y el revisor ya se deducen del nombre de fichero** (`RONDA_FILE_RE` en `review.ts:92`, `rondaYRevisorDeInforme` en métricas). Una tercera regex nueva para atribuir lecturas acabará divergiendo: hay que reutilizar la existente.
- **«3-4 M de tokens de revisión»** en `docs/METRICAS.md` es una cifra de hoy sin prueba. Envejece sola; se revisa al regenerar el bloque, no en la suite.

Suposiciones no verificadas:
- que las líneas de asistente del `.jsonl` llevan `message.model`: confirmarlo en una transcripción real de `~/.claude/projects/*/subagents/`;
- que `Grep`/`Glob` guardan la ruta en `input.path`;
- qué asevera exactamente `review-incremental.test.ts:117` sobre la petición de ronda 2.
