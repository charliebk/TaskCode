# Problemas conocidos y puntos abiertos

Volver al [README del plugin](../README.md).

## Problemas conocidos

### Un subagente se deniega con «Auto-Mode Bypass»

**Síntoma.** Con Claude Code en modo de permisos automático (*auto mode*; no
confundir con `modo_flujo: automatico` del plugin), las fases que lanzan subagentes (`plan` con
sus roles y el unificador, `review` con los revisores) se paran porque Claude
Code deniega el lanzamiento y cita *Auto-Mode Bypass*, sin más explicación.

**Causa.** Desde Claude Code 2.1.317/2.1.318, el modo automático deniega el
lanzamiento de un subagente cuando un hook `PreToolUse` cuyo matcher alcanza
a `Agent` (o `Task`) reescribe el encargo. Es lo que hace, por ejemplo,
context-mode 1.0.169, que añade un bloque al prompt de cada subagente. El
hook puede venir de otro plugin instalado o de un `settings.json` (de
usuario, de proyecto o `settings.local.json`).

**Diagnóstico.** `taskctl doctor` (o `taskctl doctor --json`) lo detecta: da
un AVISO con id `hooks-subagente` por cada hook `PreToolUse` cuyo matcher
alcanza a `Agent` o `Task` (también `""`, `"*"` o sin matcher), con el origen
(plugin o settings), la ruta del fichero y el matcher literal. Solo mira los
plugins habilitados (`enabledPlugins`) y la versión instalada activa de cada
uno. Es un aviso y no cambia el código de salida: el hook puede ser inocuo.

**Salidas** (cualquiera de las tres):

1. **Quitar `Agent` y `Task` del matcher.** Si el hook está en tus settings,
   edítalo. Si es de un plugin, sus ficheros se sobrescriben al actualizarlo:
   la forma estable es un hook propio de `SessionStart` en tus settings que,
   al arrancar cada sesión, reescriba el `hooks.json` de ese plugin sin
   `Agent` ni `Task` en el matcher.
2. **Desactivar el plugin causante:** `"enabledPlugins": { "<plugin>@<marketplace>": false }`
   en `settings.json`, o `/plugin` en Claude Code.
3. **Aprobar a mano cada lanzamiento:** salir del modo de permisos
   automático de Claude Code (por ejemplo, al modo por defecto, que pregunta)
   mientras se lanzan los subagentes, y aprobar cada uno.

Después, `taskctl doctor` debe dar `hooks-subagente` en `ok` (salvo que
elijas la tercera salida).

## Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse

TASK-006 pide explícitamente (AC3) dejar constancia de que el "mecanismo
determinista para comprobar instalación" de la sección 14 de
`docs/PROPUESTA_METODOLOGIA.md` sigue sin confirmarse con documentación
oficial. Cita exacta, punto 11 de esa sección: *"confirmar a mano (no dar
por bueno sin probar) el mecanismo exacto para que `taskctl` compruebe de
forma determinista qué plugins/skills están instalados en la máquina
local (comando de CLI o archivo de configuración concreto) — sección 6.6,
paso 3."*

Es un punto distinto de todo lo demás documentado arriba: no es sobre que
una persona confirme a mano que el plugin está instalado (eso es el resto
de este README), sino sobre que **`taskctl` mismo** tenga una forma
programática y determinista de preguntarle a Claude Code qué
plugins/skills están instalados en la máquina — sin depender de un LLM
para adivinarlo. La investigación de esta tarea (centrada en
`--plugin-dir`, el schema de `plugin.json` y el mecanismo `bin/` en PATH)
no cubrió esto, y no se ha encontrado en la documentación oficial
consultada (`plugins-reference`, `plugins`, `plugin-marketplaces`,
`setup`) un comando de CLI o fichero de configuración pensado para que un
*script* (no una persona en una sesión interactiva) consulte ese estado.
Queda registrado como sigue pendiente, sin bloquear TASK-006 — tal como
pide el criterio de aceptación.
