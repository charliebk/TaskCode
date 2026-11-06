---
id: TASK-076
titulo: "Doctor avisa de hooks PreToolUse sobre Agent que bloquean los subagentes en modo automatico"
tipo: fix
sprint: 0
etiquetas: [doctor, hooks, plugin]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
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
tokens_revision: null
creado: 2026-11-04
actualizado: 2026-11-06
dependencias: []
---
## Objetivo

Desde Claude Code 2.1.317/2.1.318, el modo automatico puede denegar el lanzamiento de un subagente (Auto-Mode Bypass) cuando otro plugin o la configuracion del usuario tiene un hook PreToolUse sobre Agent (o Task) que reescribe el encargo; p. ej. context-mode 1.0.169 anade un bloque al prompt de cada subagente. El flujo de tareas depende de subagentes (roles del brainstorm, unificador, revisores), asi que en los proyectos que usan el plugin las fases plan y review fallan sin explicacion. Hay que avisar a todos los proyectos con una version nueva del plugin: deteccion en taskctl doctor, documentacion del problema y de como resolverlo, y aviso en la skill de flujo cuando un lanzamiento se deniega. Detectado el 2026-11-03 durante TASK-068.

## Criterios de aceptacion
- [ ] taskctl doctor detecta un hook PreToolUse cuyo matcher incluye Agent o Task en los hooks.json de los plugins instalados (plugins/cache de CLAUDE_CONFIG_DIR o ~/.claude) y en settings.json de usuario y de proyecto, nombra el origen y la ruta, y lo muestra como AVISO (no ERROR) con como resolverlo; con test sobre un directorio de configuracion temporal, y test de que sin ese hook no avisa
- [ ] doctor --json incluye el aviso con un id estable; test
- [ ] El README del plugin tiene una seccion de problemas conocidos con el sintoma (subagente denegado con Auto-Mode Bypass), la causa y las salidas: quitar Agent del matcher con un hook propio de SessionStart, desactivar el plugin causante o aprobar a mano los lanzamientos
- [ ] La skill task-workflow (avance) indica que hacer si un lanzamiento de subagente se deniega: ejecutar taskctl doctor y no rodear la denegacion; los tests de neutralidad de skills siguen en verde (ningun fichero instalable menciona TaskCode)
- [ ] Version del plugin incrementada en plugin.json y marketplace, CHANGELOG con la entrada que explica el aviso; suite completa con solo los rojos conocidos de Windows

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-06T17:59:51Z | plan | automatico | persona |
| 2026-11-06T18:10:02Z | approve | automatico | automatico |
| 2026-11-06T18:10:17Z | start | automatico | persona |
| 2026-11-06T18:40:12Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-06T18:09:51Z | diseno | agente:a1998e76cc4b8e3dd | 44 | 53619 | 776948 | 12033 | 34 | 842644 |
