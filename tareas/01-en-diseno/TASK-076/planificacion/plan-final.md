# Plan — TASK-076: Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Una comprobacion nueva de `taskctl doctor`, de solo lectura de ficheros JSON, con el patron de las existentes. Tres capas: funcion pura que decide si un matcher alcanza a `Agent`/`Task`, sonda de disco que reune las fuentes, y la comprobacion en `commands/doctor.ts`. El plugin no instala ningun hook. Despues documentacion (README y skill) y salto de version.

- **`src/core/hooks-subagente.ts` (nuevo, puro):**
  - `matcherAlcanzaSubagente(matcher: string | undefined): boolean`
  - `hooksQueAlcanzanSubagente(json: unknown, origen: string, ruta: string): Hallazgo[]`, que recorre `hooks.PreToolUse[].matcher`. Formato real comprobado en context-mode 1.0.169 (`{hooks:{PreToolUse:[{matcher:"Bash"},...]}}`, con alternancias `A|B|mcp__`).
- **`src/fs/sondas-hooks-claude.ts` (nuevo):** lista las fuentes `{origen, ruta}` y lee cada JSON.
  - Plugins: `<config>/plugins/installed_plugins.json` (formato v2, `installPath` por entrada) → `<installPath>/hooks/hooks.json`.
  - Usuario: `<config>/settings.json`.
  - Proyecto: `<repo>/.claude/settings.json` y `<repo>/.claude/settings.local.json`.
  - `<config>` con `directorioConfigClaude()` (hoy en `src/fs/transcripciones.ts:12`).
- **`src/commands/doctor.ts` (se extiende):** `comprobarHooksSubagente(deps)`, dep opcional `configClaudeDir?: string` en `DoctorCommandDeps` (precedente `registrar-coste.ts:79`); se llama al final de `runDoctorCommand`. Un `aviso('hooks-subagente', <origen + ruta + matcher>, <arreglo>)` por hallazgo; sin hallazgos, `ok('hooks-subagente', '... (N fuentes leidas)')`. `core/doctor.ts` no se toca.
- **Documentacion:** README del plugin, seccion `## Problemas conocidos` (sintoma Auto-Mode Bypass, causa, tres salidas). `skills/task-workflow/avance.md`: vineta en «Reglas que no cambian con el modo» — si se deniega un subagente, `taskctl doctor`, mostrar el aviso y parar, sin rodear la denegacion. Nada nombra TaskCode.
- **Version:** `.claude-plugin/plugin.json`, `marketplace.json` (raiz), `package.json`, `package-lock.json`, `VERSION` en `src/cli.ts:62`, menciones del README, `CHANGELOG.md`, y recompilar `dist/`.

Orden: 1) nucleo puro; 2) sonda; 3) comprobacion en doctor; 4) README y avance.md; 5) version, CHANGELOG y dist.

Coste: unos pocos `readFileSync`, sin subprocesos ni red.

Alternativas descartadas:
- Recorrer `plugins/cache/*/*/*/hooks/hooks.json` a ciegas: versiones antiguas inactivas darian falsos avisos.
- `claude plugin list --json`: subproceso y no da la ruta del `hooks.json`.
- Que el plugin instale su propio SessionStart que reescriba matchers ajenos: tocaria ficheros de terceros. Se documenta como salida para el usuario.

## Lo que el rol no cubrio

Solo arquitectura; sin roles de riesgos, testing ni dominio.
- Semantica exacta del matcher (regex vs lista `|`, `""`/`*`/ausente): resuelto en decisiones.
- Ficheros ajenos ilegibles o con JSON roto: la comprobacion **no delega en la excepcion de `envolver`** (daria `error`); como maximo AVISO u omitida.
- Exactitud de las tres salidas del README contra Claude Code 2.1.317/318: sin verificar.
- Hooks declarados en linea en `plugin.json` y settings gestionados por empresa: no mirados.

## Riesgos aceptados y que los contiene

- Falsos avisos o huecos por la semantica del matcher: nivel siempre `aviso` (no cambia el codigo de salida, `core/doctor.ts:45`) y el mensaje muestra el matcher literal.
- `installed_plugins.json` es formato interno de Claude Code: si no se reconoce, `omitida` con motivo; doctor no falla.
- Rutas absolutas del usuario en el mensaje, como el resto de doctor; pasa por `ocultarCredenciales`.

## Plan de pruebas

- Unitarias de `core/hooks-subagente.ts`: `Agent`, `Task`, `Bash|Agent`, `Read`, `mcp__`, `AgentX`, `""`, `*`, ausente; JSON sin `hooks`, sin `PreToolUse` o con forma inesperada.
- `runDoctorCommand` con `configClaudeDir` temporal y repo Git temporal: plugin instalado con PreToolUse `Agent` → AVISO con origen y ruta; idem en settings de usuario y `.claude/settings.json`; sin hook → `ok`; codigo de salida 0; `--json` con `id: "hooks-subagente"`, `nivel: "aviso"`; JSON roto ajeno no da `error`.
- Contenido: README con «Problemas conocidos» y «Auto-Mode Bypass»; `avance.md` menciona `taskctl doctor` ante una denegacion; neutralidad de `test/skills/` y `test/empaquetado/metadatos.test.ts` en verde.
- Cierre: `npm test` con solo los 3 rojos conocidos de Windows.

## Lo que necesita decision de una persona

Checkpoint humano obligatorio: este plan no vale hasta `taskctl approve`.

Decisiones de Carlos (2026-11-06):
1. **Matcher**: regex anclada contra `Agent` y `Task`; si no compila, partir por `|` y comparar literal. `""`, `"*"` y la ausencia de matcher **cuentan** como hallazgo (alcanzan a todas las herramientas).
2. **Id del aviso**: `hooks-subagente`, fijo y repetido en cada hallazgo, con el origen en el mensaje (como `config-claves`).
3. **Fuentes de plugins**: solo las versiones activas de `installed_plugins.json`, sin recorrer la cache entera (decision por defecto del orquestador).
4. **`.claude/settings.local.json` del proyecto**: se incluye.
5. **Version**: **0.9.0**. Primero se eligio 0.8.1, pero en «Sin publicar» del CHANGELOG hay 7+ features acumuladas desde 0.8.0 (TASK-068, 070-074, 078) que salen en la misma release; se cambia a menor.
6. **`directorioConfigClaude`**: se mueve a `src/fs/config-claude.ts` y `fs/transcripciones.ts` la reexporta (decision por defecto del orquestador; sin cambio de comportamiento).
