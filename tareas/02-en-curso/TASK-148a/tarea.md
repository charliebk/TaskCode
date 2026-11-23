---
id: TASK-148a
titulo: "raiz del plugin y lector de catalogos (parte a de TASK-148)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-23
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

packageRoot en un modulo, un lector de bloques prefijo_N_campo con describirValor, SKILL_KEY_RE derivada (CORE1-03, CORE1-04, CORE1-05, CORE2-08).

Objetivo de la tarea entera:

> Unificar los lectores de catalogos planos, la validacion de config y las utilidades repetidas de core (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CORE1-03 a CORE1-14, CORE2-08 a CORE2-10, CORE2-15 a CORE2-21).

## Criterios de aceptacion

- [ ] packageRoot y CLAUDE_PLUGIN_ROOT se resuelven en un solo modulo; catalogo-skills, heuristica y doctor-deploy-catalogo comparten el lector de bloques prefijo_N_campo y describirValor

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T12:58:44Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T12:58:56Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T12:58:57Z | start | automatico | persona | 0.16.1 |
