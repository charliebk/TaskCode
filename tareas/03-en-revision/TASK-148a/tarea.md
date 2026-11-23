---
id: TASK-148a
titulo: "raiz del plugin y lector de catalogos (parte a de TASK-148)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 15908296
tokens_revision: 972936
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
| 2026-11-23T13:17:10Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T13:26:55Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — b42169a: buscadas las cinco copias de packageRoot y los tres juegos de validadores; nuevos raiz-plugin.ts y campos-catalogo.ts (la regla comun no existia); deploy conserva adaptadores finos de Valor; 1 fichero de test nuevo (3 tests) y 1 test anadido en deploy; 3 mutaciones en rojo
- code-quality-reviewer — b42169a
- 4D — 1abf3a4: correccion de la ronda 1 sin helper nuevo (config importa describirValor de campos-catalogo); 1 test nuevo (recorte de enum y texto); 2 mutaciones en rojo
- code-quality-reviewer — 1abf3a4

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T13:17:10Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 58 | 44276 | 15840843 | 23119 | 18 | 15908296 | - | - |
| 2026-11-23T13:26:10Z | revision | agente:a8837df2048ffa364 | 20 | 104723 | 862243 | 5950 | 0 | 972936 | 1 | - |
