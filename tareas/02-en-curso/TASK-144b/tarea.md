---
id: TASK-144b
titulo: "flags con y sin valor (parte b de TASK-144)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
asignado_a: charlie.bk@gmail.com
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
