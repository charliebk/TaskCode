# Brainstorm — TASK-073, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: taskcode-plugin:brainstorm-testing (a31c511c3d2e10ad4)

## Comprobabilidad del enfoque

Tres de los criterios se demuestran desde fuera y sin agente: la clave en config, finish rojo y verde, y que la skill lo menciona. El «deny efectivo» solo se puede afirmar desde fuera si lo aplica algo ejecutable: un hook PreToolUse con stdin y codigo de salida. Si se queda en una regla declarativa de Claude Code, la unica prueba es el smoke manual con `claude -p`.

## Pruebas que hacen falta

- Hook de deny: `{tool_name: Read|Edit|Write|Grep|Glob, tool_input:{file_path:".../TASK-NNN/aceptacion/x"}}` sale 2; ruta hermana (`.../TASK-NNN/tarea.md`, `aceptacionX/`) sale 0. `spawnSync` contra el `dist` real y un repo temporal (como `guardia-merge.test.ts:328`). Mutacion: quitar `Edit` del matcher, o `startsWith` sin separador.
- Si el deny distingue implementador y revisor: la misma entrada con la identidad del revisor (`agent_type` o lo que se use) sale 0. Mutacion: ignorar el campo de identidad.
- finish rojo: `comando_heldout` que sale 1 con `comando_verificacion` verde o ausente; el mensaje es el del held-out, no hay merge en develop y la tarea no se mueve (repo temporal, como `finish-verificacion.test.ts:68`). Mutacion: quitar el `throw`.
- finish verde: el held-out deja un testigo en una ruta ignorada; se asevera el testigo y el merge `--no-ff`. Mutacion: no llamar a la puerta (sin testigo, el verde seguiria verde: el testigo es obligatorio).
- Solo cuentan los held-out de esta tarea: otra tarea con `aceptacion/` que falla no bloquea. Mutacion: glob sobre todas las `aceptacion/`.
- Config: `comando_heldout` en `CLAVES_CONFIG`, por defecto null, invalido aborta. Mutacion: no meterla en `CLAVES_CONFIG` (tambien pone rojo `integracion/config.test.ts:394`).

## Lo que se rompe de lo existente

- `guardia-merge.test.ts:352` (`PreToolUse.length === 1`) y `:355` (`matcher === 'Bash|PowerShell'`): con una segunda entrada PreToolUse, buscar la del merge por `args` y aseverar la nueva aparte (no relajar a `>= 1`).
- `freno-stop.test.ts:326` y `guardia-merge.test.ts:364` (la descripcion no nombra el producto): misma expectativa, el texto nuevo tiene que pasarla.
- `finish-verificacion.test.ts` (8 pruebas): sin `comando_heldout` no deben cambiar; son red de regresion.

## No cubierto a proposito

- Que el deny se cumpla en una sesion real de Claude Code (subagente, `--plugin-dir`, version): smoke manual con evidencia en el `Resultado`, como TASK-071/072.
- Saltarse el deny con `Bash cat`, `git show`, `node -e`: una prueba solo cubre la heuristica, nunca lo cierra.
- El contenido pedagogico de la skill: basta aseverar que aparecen `aceptacion/` y `comando_heldout` y que no nombra el producto.

## Coste de mantenimiento

La lista de herramientas del matcher: cada herramienta nueva de lectura (o MCP) abre un hueco que ninguna prueba ve. Si la puerta held-out se copia de `puertaVerificacion` en vez de compartir el ejecutor, cada cambio de timeout, memo o arbol sucio se hace dos veces.

## Desacuerdos previstos

- Con arquitectura, si el deny es `permissions.deny` declarativo o `disallowedTools` sin hook: «deny efectivo» no tendria prueba automatica. Posicion: el criterio 5 exige algo ejecutable en la suite, o reescribir el criterio explicitamente.
- Con arquitectura, sobre la identidad del «agente implementador» (normalmente la sesion principal): si el hook no la distingue, la prueba del revisor no se puede escribir, y hay que decirlo.
- Con riesgos: un smoke que solo compruebe que «el canario no sale en la respuesta» es una asercion trampa (el modelo puede negarse solo); debe aseverar que el hook se disparo (stderr con exit 2 visible en la transcripcion).

## Suposiciones no verificadas

- Que un plugin no puede aportar `permissions.deny` (documentacion de plugins o `HALLAZGOS.md`).
- Que la entrada de PreToolUse trae `agent_type`/`agent_id` desde un subagente (documentacion de hooks y `hooks/sonda-hooks.mjs`).
- Que el held-out corre con cwd en la raiz y puede escribir el testigo sin ensuciar el arbol (`ejecutarVerificacion`).

Rutas consultadas: src/commands/finish-verificacion.ts, hooks/hooks.json, test/hooks/guardia-merge.test.ts, test/hooks/freno-stop.test.ts, test/commands/finish-verificacion.test.ts, test/integracion/config.test.ts.
