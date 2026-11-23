---
id: TASK-148b
titulo: "validacion de config (parte b de TASK-148)"
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
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-148a]
---
## Objetivo

Parte b del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

masParecida, validadores de entero y de enumerado, CLAVES_CONFIG atada al switch, una ruta relativa (CORE1-06, CORE1-07, CORE1-08, CORE1-10).

## Criterios de aceptacion
- [ ] config usa masParecida para sugerir, un validador de entero en rango y otro de lista de enumerado; un test falla si CLAVES_CONFIG y el switch de claves no coinciden; SKILL_KEY_RE se deriva de los campos

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T13:40:55Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T13:40:57Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T13:40:58Z | start | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — d542a84: buscados masParecida, describirValor y las tres reglas de ruta; nuevos sugerenciaDeValor, validarEnteroEnRango, elementosDeEnumerado y ruta-relativa.ts (la regla comun no existia; se queda la de config, que cuatro tests fijan); 1 fichero de test nuevo (4 tests); 6 mutaciones en rojo
- code-quality-reviewer — d542a84
