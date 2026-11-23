---
id: TASK-148d
titulo: "comentarios, diluvio y E/S en core (parte d de TASK-148)"
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
dependencias: [TASK-148c]
---
## Objetivo

Parte d del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

Comentarios ciertos, heuristica sin repeticion, TRIVIAL_SIN_APROBACION, formateadores de «—» y la E/S de core (CORE1-14, CORE2-18 a CORE2-21).

## Criterios de aceptacion
- [ ] Comentarios de config y dondeFalla ciertos; la E/S de plugin-instalado, heuristica y revisores se documenta o se mueve a fs; TRIVIAL_SIN_APROBACION se elimina o se justifica en una linea

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T23:00:11Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T23:00:13Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T23:00:14Z | start | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 311df9b: buscados CLAVES_NUMERICAS, CLAVES_CONFIG y los formateadores de guion; nuevo celdaNumero (cuatro copias); se borra TRIVIAL_SIN_APROBACION (lista vacia, mecanismo que no hacia nada); 1 test nuevo; 1 mutacion en rojo; el resto lo fijan los tests de state-machine, approve, start, metricas y heuristica
- code-quality-reviewer — 311df9b
