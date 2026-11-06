---
id: TASK-076
titulo: "Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico"
tipo: fix
sprint: 0
etiquetas: [doctor, hooks, plugin]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-076-doctor-avisa-de-hooks-pretooluse-sobre-a
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 842644
tokens_implementacion: null
tokens_revision: 6339404
creado: 2026-11-04
actualizado: 2026-11-06
dependencias: []
---
## Objetivo

Desde Claude Code 2.1.317/2.1.318, el modo automatico puede denegar el lanzamiento de un subagente (Auto-Mode Bypass) cuando otro plugin o la configuracion del usuario tiene un hook PreToolUse sobre Agent (o Task) que reescribe el encargo; p. ej. context-mode 1.0.169 anade un bloque al prompt de cada subagente. El flujo de tareas depende de subagentes (roles del brainstorm, unificador, revisores), asi que en los proyectos que usan el plugin las fases plan y review fallan sin explicacion. Hay que avisar a todos los proyectos con una version nueva del plugin: deteccion en taskctl doctor, documentacion del problema y de como resolverlo, y aviso en la skill de flujo cuando un lanzamiento se deniega. Detectado el 2026-11-03 durante TASK-068.

## Criterios de aceptacion
- [x] taskctl doctor detecta un hook PreToolUse cuyo matcher incluye Agent o Task en los hooks.json de los plugins instalados (plugins/cache de CLAUDE_CONFIG_DIR o ~/.claude) y en settings.json de usuario y de proyecto, nombra el origen y la ruta, y lo muestra como AVISO (no ERROR) con como resolverlo; con test sobre un directorio de configuracion temporal, y test de que sin ese hook no avisa
- [x] doctor --json incluye el aviso con un id estable; test
- [x] El README del plugin tiene una seccion de problemas conocidos con el sintoma (subagente denegado con Auto-Mode Bypass), la causa y las salidas: quitar Agent del matcher con un hook propio de SessionStart, desactivar el plugin causante o aprobar a mano los lanzamientos
- [x] La skill task-workflow (avance) indica que hacer si un lanzamiento de subagente se deniega: ejecutar taskctl doctor y no rodear la denegacion; los tests de neutralidad de skills siguen en verde (ningun fichero instalable menciona TaskCode)
- [x] Version del plugin incrementada en plugin.json y marketplace, CHANGELOG con la entrada que explica el aviso; suite completa con solo los rojos conocidos de Windows

## Resultado

`taskctl doctor` avisa de los hooks PreToolUse que alcanzan a Agent/Task y pueden hacer que el modo de
permisos automatico de Claude Code 2.1.317+ deniegue los subagentes (Auto-Mode Bypass).

- Piezas: `core/hooks-subagente.ts` (puro: semantica del matcher, forma del JSON, `enabledPlugins`),
  `fs/sondas-hooks-claude.ts` (lee settings de usuario, proyecto y local, `installed_plugins.json` y,
  de cada plugin habilitado, su version activa: `hooks/hooks.json` y los `hooks` de `plugin.json`, en
  linea o por ruta; nunca lanza) y `comprobarHooksSubagente` en `commands/doctor.ts` (AVISO con id fijo
  `hooks-subagente`, origen, ruta y matcher literal; no cambia el codigo de salida). `directorioConfigClaude`
  pasa a `fs/config-claude.ts` (transcripciones la reexporta).
- Decisiones de Carlos: regex anclada contra `Agent`/`Task` (si no compila, lista literal), y `""`, `"*"` o
  sin matcher cuentan; id fijo `hooks-subagente`; incluye `.claude/settings.local.json`; version **0.9.0**
  (primero 0.8.1, cambiada al ver 7+ features acumuladas en «Sin publicar»). Del orquestador: solo
  versiones activas de `installed_plugins.json`, no toda la cache.
- Hallazgos de entorno: en esta maquina context-mode esta instalado pero desactivado en `enabledPlugins`,
  y su `hooks.json` 1.0.169 activo ya no tiene `Agent`: sin respetar `enabledPlugins` el aviso habria sido
  falso. El «modo automatico» que deniega es el modo de permisos de Claude Code, no `modo_flujo`: se
  aclara en README, skill y arreglo de doctor. Una instalacion con `projectPath` de otro proyecto no cuenta.
- README: seccion «Problemas conocidos» (sintoma, causa, diagnostico, tres salidas). `avance.md`: ante un
  subagente denegado, `taskctl doctor`, mostrar el aviso y parar sin rodear la denegacion.
- Tests de `doctor.test.ts` y `doctor-correcciones.test.ts` aislados del `~/.claude` real (`configClaudeDir`
  / `CLAUDE_CONFIG_DIR` inexistente): antes contaban avisos que dependen de la maquina.
- Suite completa ronda 1: 1856/1859 (los 3 rojos conocidos de Windows). Ronda 2: 1858/1862, los 3 conocidos
  y un intermitente bajo carga en `gitflow/origin-deteccion` (timeout; aislado 5/5, la rama no toca Git-Flow).
- No publicada: por decision de Carlos, la 0.9.0 sale junto con TASK-079 y TASK-080 (merge local, sin push).

Revision por pares, 2 rondas (code-quality-reviewer, sonnet):
- Ronda 1 (revisor: `aprobada-con-correcciones`; registrada `cambios-solicitados` para corregir en
  automatico): MEN-1 (espacios alrededor de `|` daban falso negativo), MEN-2 (`trim` muerto), MEN-3
  (`disableAllHooks`), MEN-4 (ilegibles ocultos con avisos), MEN-5 (test leyendo el `~/.claude` real).
  Corregidos. Aceptado de MEN-1: `"Ag"` no avisa (regex anclada, decision de la persona; sin contrastar con
  Claude Code real). Aceptado de MEN-3: managed settings y hooks en frontmatter quedan fuera.
- Ronda 2 (`aprobada-con-correcciones`): los cinco confirmados con mutantes. Aceptados sin corregir:
  MEN-6 (la `omitida` dice «sin leer» dos veces, estetico) y MEN-7 (`disableAllHooks` solo probado en
  `settings.local.json`; el mutante que quita el de usuario sobrevive).

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-06T17:59:51Z | plan | automatico | persona |
| 2026-11-06T18:10:02Z | approve | automatico | automatico |
| 2026-11-06T18:10:17Z | start | automatico | persona |
| 2026-11-06T18:40:12Z | review | automatico | persona |
| 2026-11-06T19:22:35Z | review | automatico | persona |
| 2026-11-06T19:34:46Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-06T18:09:51Z | diseno | agente:a1998e76cc4b8e3dd | 44 | 53619 | 776948 | 12033 | 34 | 842644 |
| 2026-11-06T18:57:10Z | revision | agente:a76f5dc734c22f4da | 38 | 127876 | 2099965 | 11130 | 3 | 2239009 |
| 2026-11-06T19:33:18Z | revision | agente:a256a3e60bfd74d6d | 78 | 130451 | 3951779 | 18087 | 11 | 4100395 |
