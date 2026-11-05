# Brainstorm — TASK-078, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: `taskcode-plugin:brainstorm-riesgos`

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **Fuga sin mala intención por Grep/Glob o MCP.** El agente busca
  `function calcularX` con Grep y `path` = raíz del repo: ripgrep entra en
  `aceptacion/` (commiteada, no ignorada) y devuelve el contenido sin que la
  entrada nombre la ruta. Igual con MCP de índice de código (tokensave), fuera
  del matcher. Consecuencia: held-out contaminado y un hook que parece un
  cierre que no es. Mitigación: no se puede cerrar sin dejar Grep inservible en
  la raíz; declararlo en la skill como riesgo aceptado. El cierre real de la
  edición sigue siendo la huella de TASK-073.
- **Esquiva por diseño al cambiar de rama.** Con «en otra rama no bloquea»,
  basta `git switch develop`, leer con Read y volver; ninguno nombra la ruta.
  Mitigación: decidir «tarea protegida» por el estado de la tarea (en curso o
  en revisión, leído de `rama_base`) y no por la rama actual.
- **Desactivación editando `tarea.md`.** Si se copia `freno-stop.ts`
  (`listTareasEnEstados(..., ['en-curso'])` sobre el árbol de trabajo y
  `t.task.rama === rama`), el agente edita `rama:` o mueve la carpeta y el hook
  se apaga; `tarea.md` es justo la hermana que hay que permitir. Mitigación:
  sacar el ID del nombre de la rama, o leer `tarea.md` con
  `git show <rama_base>:`, nunca del árbol de trabajo.
- **Bloqueo mutuo con los remedios de `finish`.** `src/commands/finish-heldout.ts:86-93`:
  `remedio()` imprime `git rm -r -q tareas/…/TASK-NNN/aceptacion && git read-tree --prefix=… && git checkout -- …`;
  176-177 pide resolver el conflicto «quedándote con la versión de la base». El
  guardián de Bash bloquea las tres. En automático: `finish` aborta, remedio
  bloqueado, bucle. Mitigación: que `finish` diga que el remedio lo ejecuta la
  persona fuera de Claude, o una excepción documentada.
- **Ningún Read funciona en ningún proyecto.** Un fallo de normalización o un
  `catch` que bloquea antes de saber si la ruta es held-out deja sin
  Read/Edit/Grep a todos los proyectos con el plugin, y Claude no puede
  arreglarlo (Edit bloqueado). Mitigación: la regla de `guardia-merge.ts`
  (deja pasar ante fallo hasta saber que aplica), con primer filtro barato
  `/aceptacion/i` en la entrada antes de cargar nada.
- **Coladeros de forma de la ruta.** Windows: 8.3 (`ACEPTA~1`), `\\?\C:\…`,
  `/c/Users/…` de git-bash, junctions/symlinks; PowerShell: acento grave
  (`` acep`tacion ``), `'acep'+'tacion'`; además `cd …/TASK-078 && cat
  aceptacion/x` y `git cat-file -p <sha>`. Mitigación: comparar por secuencia de
  segmentos en cualquier punto de la ruta absoluta, sin mayúsculas; para el
  resto, el texto de Bash es un badén, no un cierre, y se escribe así.
- **Exit 0 silencioso por campos o herramientas equivocados.** NotebookEdit usa
  `notebook_path`; Grep/Glob `path`/`glob`/`pattern`; `MultiEdit` puede no
  existir en la versión del usuario. Los tests por stdin solo prueban el JSON
  que escribe el test. Mitigación: smoke con `claude -p --plugin-dir` por cada
  herramienta (TASK-071/072 lo hicieron en real, CHECKLIST K).

## Estados intermedios y fallos parciales

- **HEAD desacoplado** (rebase, conflicto, bisect): `git branch --show-current`
  vacío (freno-stop.ts:89-92), el hook deja pasar justo al resolver conflictos.
  Mitigación: leer `.git/rebase-merge/head-name`, o tratar el desacoplado como
  desconocido (bloquear si es held-out de tarea no terminada).
- **La carpeta cambia de estado**: `git show develop:tareas/01-en-diseno/TASK-078/aceptacion/x`
  nombra una carpeta de estado que ya no existe en disco. El patrón cubre
  `tareas/*/TASK-NNN` en cualquier carpeta de estado.
- **Carrera durante `taskctl start`/`finish`**: ventana corta entre checkout y
  commit de movimiento en la que el hook deja pasar. Daño bajo.
- **Escritura de un fichero que no existe** en `aceptacion/`: `realpath` falla.
  Normalizar sin exigir existencia y bloquear igual; la huella de `finish` lo
  atrapa después.

## Compatibilidad hacia atras

- `hooks.json` ya tiene un PreToolUse `Bash|PowerShell` con filtro `/merge/i`
  (`pre-tool-merge.ts:17`). Si se toca esa condición, el guardián de merges
  puede dejar de ejecutarse sin que nadie lo note: comprobar que `git merge`
  sigue saliendo 2.
- Proyectos que no son TaskCode lanzan `node` en cada Read/Grep/Glob; sin
  `node` en el PATH del IDE, error no bloqueante en cada herramienta.
- Ramas antiguas conservadas (política IECA): al hacer checkout el hook vuelve
  a bloquear sus held-out sin salida dentro de Claude. Un interruptor no puede
  ser una clave editable con Write; una variable de entorno del proceso de
  Claude sí (un `export` en Bash no llega al hook).
- Hoy no hay ninguna carpeta `aceptacion/` en el repo: nada que migrar.

## Vuelta atras

- Aditivo y sin estado: quitar la entrada de `hooks.json` y publicar versión.
  Si deja sin Read a todos, `/plugin disable` hasta actualizar.
- **No se puede deshacer**: un held-out leído queda en contexto y transcript y
  esa tarea queda gastada; solo lo arregla que la persona los reescriba.

## El riesgo que mas te preocupa (UNO solo)

El cierre falso por Grep sobre la raíz: la fuga más probable, sin intención e
invisible. Ningún criterio la cubre, y un hook que pasa sus tests dará la
confianza de que el agente no vio los held-out cuando sí. Pido que el plan la
declare como riesgo aceptado con esas palabras, no como resuelta.

Supuesto sin verificar: que `realpathSync.native` expande los 8.3; que `start`
deja la tarea «en curso» también en `develop` (condición de la mitigación por
estado); el nombre de la carpeta de revisión.
