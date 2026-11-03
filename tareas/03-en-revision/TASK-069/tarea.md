---
id: TASK-069
titulo: "Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ"
tipo: feature
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-069-spike-hooks-stop-y-pretooluse-de-claude
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: 2076406
creado: 2026-11-03
actualizado: 2026-11-03
dependencias: []
---
## Objetivo

Antes de construir frenos sobre hooks hay que saber como se comportan de verdad en la plataforma de Carlos. Inspirado en gemba-app/brakes (Apache-2.0): se toman ideas, no codigo.

## Criterios de aceptacion
- [ ] Documentado contra la documentacion oficial vigente: entrada JSON de Stop y PreToolUse, efecto de exit code 2, uso de stderr como respuesta al agente, campo stop_hook_active y forma de declarar hooks dentro de un plugin (hooks/hooks.json)
- [ ] Un hook de plugin escrito en Node sin dependencias se ejecuta en Windows nativo (PowerShell tool y Git Bash) y en Linux; verificado en el CI de Windows con un step que asevera cada hipotesis
- [ ] Comprobado que un Stop hook que devuelve exit 2 hace que el agente siga trabajando y que stop_hook_active evita el bucle infinito
- [ ] Comprobado que un PreToolUse sobre Bash puede bloquear un comando concreto (git merge) y que el agente recibe el motivo
- [ ] Resultado en docs/spikes/ con cada hipotesis marcada como confirmada o refutada y la evidencia

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-03T10:04:15Z | plan | automatico | persona |
| 2026-11-03T10:54:57Z | approve | automatico | persona |
| 2026-11-03T11:14:07Z | start | automatico | persona |
| 2026-11-03T12:48:47Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-03T13:05:10Z | revision | agente:afd2b476e340883e0 | 42 | 112542 | 1952147 | 11675 | 3 | 2076406 |
