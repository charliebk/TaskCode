---
id: TASK-144b
titulo: "flags con y sin valor (parte b de TASK-144)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 1610487
tokens_revision: 4186809
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-144a]
---
## Objetivo

Parte b del troceo de TASK-144 (Regla 4D: ciclo de vida, cadena y flags en commands), partes TASK-144a, TASK-144b, TASK-144c en la rama fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en.

Todos los flags con valor se leen con el mismo lector y todos los booleanos estan en FLAGS_SIN_VALOR (CMD1-09, CMD2-05, CMD2-14, FS-01).

## Criterios de aceptacion
- [ ] veredicto, verificar-menores, approve, cadena, finish-opciones, doctor-deploy y new leen sus flags con valor con un helper basado en extraerRepetible: --flag=valor y --flag valor dan lo mismo en todos, con test
- [ ] Un test de paridad falla si un comando lee un booleano por token que no esta en FLAGS_SIN_VALOR; review --completa=1 aborta en vez de ignorarse
- [ ] verificar-lote: sin «taskctl taskctl», admite -p y su autoCommit lleva fase

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T03:55:21Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T03:55:23Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T03:55:25Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T03:57:21Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T04:55:39Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — 565e603: helper buscado (extraerRepetible y extraerPushFlag reutilizados; extraerUnico sustituye 7 copias y se borro el lector viejo de cadena); criterios citados; 3 tests nuevos, 3 mutaciones en rojo (booleano quitado de la lista, repeticion admitida; el test de paridad encontro 3 booleanos de doctor que faltaban).
- code-quality-reviewer — 565e603

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T03:57:21Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 4 | 2058 | 1607163 | 1262 | 0 | 1610487 | - | - |
| 2026-11-23T04:14:06Z | revision | agente:a78aca5658b9ea867 | 68 | 146674 | 4022415 | 17652 | 4 | 4186809 | 1 | - |
- 4D — 70243c6 (ronda 2): helper buscado (flagSuelto de metricas ya valida --tokens; contenidoDeSeccion/valoresRegla4D); criterios citados; 5 tests nuevos, 5 mutaciones de IMP-1/IMP-2 en rojo; suite completa corrida (destapo 3 rojos heredados de TASK-153c, corregidos).
- code-quality-reviewer — 70243c6
