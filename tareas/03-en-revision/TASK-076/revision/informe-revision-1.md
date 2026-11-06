# Informe de revision — TASK-076 (ronda 1)

- Commit revisado: c85d64106bf9e8619a3af3b7e44e6721f5913120
- Revisor: code-quality-reviewer (agente revisor independiente, general-purpose, sonnet)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-076 aprobada | aprobada-con-correcciones | cambios-solicitados)

Veredicto propuesto por el revisor: aprobada-con-correcciones. En modo automatico lo
mergeado tiene que ser lo revisado, asi que quien orquesta lo registra como
cambios-solicitados para corregir los MENOR baratos (MEN-1 en su parte de espacios,
MEN-2, MEN-3 disableAllHooks, MEN-4, MEN-5) y abrir la ronda 2.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/hooks-subagente.ts (regex anclada; matcher con espacios alrededor de `\|`) | plan |
| MEN-2 | MENOR | abierto | src/core/hooks-subagente.ts (`.trim()` interno de `porNombres` inalcanzable) | implementacion |
| MEN-3 | MENOR | abierto | src/fs/sondas-hooks-claude.ts (sin `disableAllHooks`, sin managed settings) | plan |
| MEN-4 | MENOR | abierto | src/commands/doctor.ts (`sin leer` solo en el `ok`) | implementacion |
| MEN-5 | MENOR | abierto | test/commands/doctor-correcciones.test.ts (lee el `~/.claude` real) | implementacion |

No hay hallazgos CRITICOS ni IMPORTANTES.

## Reproduccion y evidencia

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-076-r1` (borrado al terminar), `npm install` y `tsc` limpios. Suite completa no repetida (ya corrida: 1856/1859, los 3 rojos conocidos de Windows).

**Tests relevantes**: `hooks-subagente`, `doctor-hooks-subagente`, `doctor`, `skills/*`, `empaquetado/*`: 159/159 en verde, neutralidad incluida.

**CLI real** con `CLAUDE_CONFIG_DIR` temporal y tres plugins: `ctx@mkt` con matcher `"Agent"` da `[AVISO] hooks-subagente: plugin ctx@mkt tiene un hook PreToolUse que alcanza a Agent/Task (matcher "Agent") en <ruta>`, codigo de salida sin cambios, `--json` con id `hooks-subagente`. `b@mkt` (`"Bash | Agent"`) y `c@mkt` (`"Ag"`) no avisan (MEN-1).

**Mutantes** (compilar + los dos ficheros de test nuevos):

| Mutante | Resultado |
|---|---|
| quitar `'*'` | mata (2 rojos) |
| quitar `'Task'` | mata (3) |
| quitar el ancla de la regex | mata (1) |
| `pluginHabilitado` siempre `true` | mata (2) |
| matcher ausente -> `false` | mata (2) |
| ignorar `projectPath` | mata (1) |
| invertir el orden de settings en `enabledPlugins` | mata (1) |
| no examinar `hooks` en linea de `plugin.json` | mata (1) |
| no examinar `hooks` por ruta de `plugin.json` | mata (1) |
| no examinar `settings.local.json` | mata (1) |
| quitar `.trim()` de `porNombres` | **sobrevive** (MEN-2) |

El mutante del `catch` de regex invalida no se aplico (patron multilinea con CRLF); el camino lo cubren `'Agent|(roto'` y `'Read|(roto'`.

**Verificaciones pedidas**: `enabledPlugins` (local > proyecto > usuario; sin entrada, habilitado) y `projectPath` respetados y probados con mutante; neutralidad de `skills/` y `agents/` correcta; version 0.9.0 coherente en plugin.json, marketplace.json, package.json, package-lock.json (2 entradas), src/cli.ts, dist/src/cli.js y README; el README distingue el *auto mode* de Claude Code de `modo_flujo: automatico` y sus tres salidas coinciden con el arreglo de doctor.

### MEN-1 — Semantica del matcher no contrastada con Claude Code (plan; no verificado)
El plan fija regex anclada. Segun la documentacion de hooks (citada de memoria, sin contrastar con el ejecutable), un matcher con otros caracteres es una regex JS, y sus ejemplos (`^Notebook`) sugieren busqueda sin anclar. Falsos negativos hoy: `"Ag"` y `"Bash | Agent"` (espacios: va por la rama regex anclada y nunca casa con `Agent`; confirmado en el CLI). Raros en la practica; lo prudente es preferir el falso positivo o al menos recortar espacios alrededor de `|`.

### MEN-2 — `.trim()` interno inalcanzable en `porNombres` (implementacion)
Solo se llama con matchers sin espacios o desde el `catch`; el mutante que lo quita sobrevive. Se resuelve con MEN-1.

### MEN-3 — Alcance (plan)
Con `"disableAllHooks": true` los hooks no corren y doctor avisa igual. No se miran managed settings ni hooks en frontmatter de skills/agentes. El README ya acota lo que se mira.

### MEN-4 — Ilegibles ocultos si hay hallazgos (implementacion)
La nota `sin leer: ...` solo va en el `ok`; un settings roto junto a un hallazgo queda sin mencionar.

### MEN-5 — Tests que dependen de la maquina (implementacion)
`doctor-correcciones.test.ts` llama a `runDoctorCommand` sin `configClaudeDir` y lee el `~/.claude` real; hoy no afecta a sus aserciones, pero es inconsistente con el aislamiento de `doctor.test.ts`.

## Conclusion del revisor
Cumple los criterios de aceptacion; bien cubierta por mutacion (solo sobrevive el trim muerto). La sonda solo lee y nunca lanza. Lo unico con algo de sustancia es MEN-1, que conviene contrastar con Claude Code real.
