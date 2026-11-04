# Brainstorm — TASK-073, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura (a29945e03ddb57af8)

## Enfoque

El freno de lectura es un segundo hook `PreToolUse` sobre las herramientas de fichero que deniega cualquier ruta `…/TASK-NNN/aceptacion/**`. No usa reglas `permissions.deny` de un plugin ni el frontmatter de un agente "implementador": ese agente no existe y la implementacion la hace la sesion principal. La ejecucion en `finish` es una segunda puerta, hermana de `puertaVerificacion`, que corre justo despues de ella. La configuracion es una clave mas en `config.ts`.

## Piezas y limites

- `src/core/config.ts` — se extiende — `comando_heldout: string | null` (por defecto `null`) en `TaskcodeConfig`, `CONFIG_DEFAULTS` y `CLAVES_CONFIG`, validada con el `validarComando` existente. El timeout reutiliza `timeout_verificacion`.
- `src/commands/finish-heldout.ts` — nuevo — `puertaHeldout(o)` con la forma de `puertaVerificacion` (`finish-verificacion.ts:65`); reutiliza `ejecutarVerificacion` y `formatearVerificacionRoja`. Aparte para no inflar una puerta que ya maneja memo, salto y anotacion.
- `src/commands/finish.ts` — se extiende — en el cierre `puerta` (~l.443) encadenar `puertaHeldout` tras la verificacion y antes del MR o del script. La carpeta sale de `path.dirname(initial.filePath)` antes de mover la tarea.
- `src/hooks/pre-tool-lectura.ts` + `src/hooks/guardia-heldout.ts` — nuevos — patron de `pre-tool-merge.ts`: filtro barato (`/aceptacion/` sobre stdin) y carga de la logica solo si casa. Sale 2 con el motivo en stderr, nunca 1.
- `hooks/hooks.json` — se extiende — segunda entrada `PreToolUse` con matcher `Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob` y timeout corto; la de `Bash|PowerShell` intacta; actualizar `description`.
- `skills/task-workflow/SKILL.md` (y quiza `skills/finish`) — se extiende — cuando escribir la carpeta y quien la lee. Sin "TaskCode" ni rutas internas.

## Orden de construccion

1. `comando_heldout` en `config.ts` (entregable solo: `doctor` la ve).
2. `finish-heldout.ts` y el enganche en `finish.ts` (freno de ejecucion completo aunque no haya freno de lectura).
3. `guardia-heldout.ts`, punto de entrada y entrada en `hooks.json` (freno de lectura/escritura).
4. Skill de flujo: cuando escribirlos, quien los lee y como se apaga el freno cuando es la persona quien los escribe con Claude.

## Alternativa descartada

- `permissions.deny` en un `settings.json` del plugin, o `disallowedTools` con patron de ruta en el frontmatter de un agente implementador nuevo: (sin verificar) el `settings.json` de un plugin solo admitiria la clave `agent`; el frontmatter solo protegeria al subagente, no a la sesion principal que implementa; y obligaria a crear un agente implementador que el flujo no usa.
- Fusionar los held-out con `puertaVerificacion`: esa puerta tiene memo por huella, salto y anotacion propios, y el guardian de merges consulta su memo; mezclar resultados cambiaria el contrato de `freno-verificacion.json`.

## Desacuerdos previstos

- Con dominio — si el revisor puede leer `aceptacion/`. Posicion: el hook deniega a todos, tambien al revisor; el revisor ve el resultado de `finish`, nunca el contenido. Distinguir quien llama exigiria la identidad del subagente en la entrada del hook (no verificado). Es la decision que mas preocupa: fija si el hook debe saber quien llama.
- Con riesgos — `cat`/`git show` por Bash saltan el hook de ficheros. Posicion: no extender `guardia-merge` para analizar rutas en shell; el freno es de disuasion y la garantia es `finish`.
- Con riesgos — un `git merge` a mano no ejecuta los held-out. Posicion: el guardian de merges no cambia; meterlos en el memo multiplica el coste del guardian.

## Suposiciones no verificadas

- Que un plugin no puede declarar `permissions.deny` y que los agentes de plugin no admiten `permissionMode`/`hooks` (documentacion oficial de plugins y subagentes).
- Que la entrada de `PreToolUse` trae `tool_input.file_path` en Read/Edit/Write y `path`/`pattern` en Grep/Glob, y si trae `agent_type`/`agent_id` dentro de un subagente (referencia de hooks).
- Que el coste es aceptable: un `node` por cada Read/Edit aunque salga enseguida (medir en Windows).
- Que `comando_heldout` recibe la carpeta por variable de entorno (p. ej. `HELDOUT_DIR`) con cwd en la raiz, en vez de un marcador en el comando (dominio).
- Que reutilizar `timeout_verificacion` vale (dominio).

Ficheros leidos: src/commands/finish-verificacion.ts, src/commands/finish.ts (425-474), src/hooks/pre-tool-merge.ts, hooks/hooks.json, src/core/config.ts, src/fs/verificacion.ts, agents/revisor-seguridad-deploy.md.
