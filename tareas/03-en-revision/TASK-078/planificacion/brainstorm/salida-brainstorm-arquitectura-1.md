# Brainstorm — TASK-078, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: `taskcode-plugin:brainstorm-arquitectura`

## Enfoque propuesto, con rutas y nombres concretos

Precedente de TASK-072 (entrada mínima + guardián con la lógica): un módulo
puro resuelve «qué IDs de held-out nombra esta ruta o este texto», y un único
guardián `src/hooks/guardia-heldout.ts` decide bloquear (exit 2) o dejar pasar
(exit 0). Lo llaman dos entradas: una NUEVA para herramientas de fichero y la
EXISTENTE de Bash/PowerShell (`pre-tool-merge.js`), que se amplía en vez de
añadir una segunda entrada con el mismo matcher.

Contrato del guardián: extrae la ruta de `file_path`, `notebook_path`, `path`,
`pattern` o `glob` según `tool_name` (y `command` en Bash/PowerShell);
`path.resolve(cwd, p)` → `path.relative(raiz)` → `/` → minúsculas; solo
entonces casa. Con el ID casado, `readTareaFile` y comparación de `task.rama`
con `currentBranch`, solo si hubo casamiento.

Orden de construcción:
1. Funciones puras en `core/heldout.ts` (normalizar y casar ruta/texto → IDs).
2. `guardia-heldout.ts` con `decidirHeldout`, sin enganchar.
3. `pre-tool-lectura.ts` + su entrada en `hooks.json` (criterio 1 entregable solo).
4. Despacho `/aceptacion/i` en `pre-tool-merge.ts` (criterio 2), sin tocar la ruta del merge.
5. Smoke con `claude -p --plugin-dir` y mención en la skill de flujo de que en la rama base no bloquea.

## Que se extiende y que se crea

- `src/core/heldout.ts` — se extiende (ya tiene `CARPETA_HELDOUT`,
  `EXCLUIR_HELDOUT`, `variantesHeldout`): `idsEnRuta(relativa)` e
  `idsEnTexto(cmd)`, ambas `: string[]`. Una sola definición de «ruta held-out»,
  compartida con finish y review.
- `src/hooks/guardia-heldout.ts` — se crea — misma forma que `guardia-merge.ts`:
  `decidirHeldout(entrada: EntradaPreToolUse): DecisionPreToolUse`. Importa
  `EntradaPreToolUse`/`DecisionPreToolUse`/`parsearEntradaPreToolUse`,
  `raizDelRepo` (config.ts), `readTareaFile` (task-store.ts:302, busca en todos
  los estados) y `currentBranch` (fs/git.ts:161). No añade un tercer
  `spawnSync('git branch --show-current')` (ya hay en freno-stop.ts:89 y
  guardia-merge.ts:140).
- `src/hooks/pre-tool-lectura.ts` — se crea — entrada para
  Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob; lee stdin y, sin
  `/aceptacion/i`, sale 0 sin `import` (patrón de pre-tool-merge.ts:17); si no,
  `import()` dinámico del guardián.
- `src/hooks/pre-tool-merge.ts` — se extiende — al despacho `/merge/i` se suma
  `/aceptacion/i` hacia el mismo guardián; si cualquiera devuelve 2, sale 2. Se
  conserva el nombre (los tests buscan la entrada por `args`,
  guardia-merge.test.ts:352/355).
- `hooks/hooks.json` — se extiende — segundo objeto en `PreToolUse` con el
  matcher literal del criterio 1 (sin Agent/Task), `timeout` corto como el de
  30 s del de merge; `description` actualizada sin nombrar el producto.

## Limites que cruza

- core (`heldout.ts`) ↔ hooks (`guardia-heldout.ts`, entradas) ↔ fs (`git.ts`,
  `task-store.ts`) ↔ config del plugin (`hooks.json`) ↔ skill de flujo
  (contenido instalable: no puede nombrar el producto).

Alternativas descartadas:
- Un único hook nuevo con matcher `Read|…|Glob|Bash|PowerShell` aparte del de
  merge: cada comando de shell lanzaría dos `node`; además el criterio 2 habla
  de «el guardián de Bash/PowerShell», que ya existe.
- Detectar la tarea como el freno Stop (`listTareasEnEstados` en-curso + rama):
  lee todas las tareas en curso en cada llamada; con el ID de la ruta basta un
  `readTareaFile` (≤6 `stat`/`readFile`) y cubre también una tarea en revisión.

Desacuerdos previstos:
- Riesgos — rutas relativas al cwd del shell (`cd …/TASK-078 && cat
  aceptacion/x`) y Grep/Glob sobre `.` o `**` sin nombrar el ID: se casa por
  texto sin emular `cd`; una búsqueda que no nombra la carpeta pasa (es contra
  despistes, D2 de TASK-073).
- Riesgos — casa la ruta pero `tarea.md` no se lee o falla `git`: dejar pasar,
  como freno-stop.ts:141-144; fallo cerrado bloquearía también en develop.
- Testing — despacho doble en `pre-tool-merge.js`: un proceso con OR de
  decisiones, probado por stdin contra el dist.

Suposiciones no verificadas:
- Campos: `tool_input.file_path` (Read/Edit/Write/MultiEdit), `notebook_path`
  (NotebookEdit), `path`/`pattern`/`glob` (Grep/Glob). `hooks/sonda-hooks.mjs`
  solo registra `command`: confirmar con la referencia o ampliando la sonda.
- `currentBranch` (runGit) lanza excepción con HEAD desacoplado o fuera de repo.
- `aceptacion/` se mueve con `tarea.md` al cambiar de estado (`moveTareaFile`,
  task-store.ts:246).
- Dos objetos `PreToolUse` sin solape de matcher funcionan y basta un exit 2.
- Los tests de guardia-merge no cuentan los objetos de `PreToolUse`
  (test/hooks/guardia-merge.test.ts:352-364).

## La decision de diseño que mas te preocupa (UNA sola)

Cómo se casa el texto de un comando de shell: sobre el texto crudo normalizado
(`\`→`/`, minúsculas), NO con `segmentar()` de `core/comando-merge.ts`, porque
ese tokenizador trata `\` como escape (`ESCAPABLES`, línea 41) y destrozaría
las rutas de PowerShell.
