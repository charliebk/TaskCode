---
id: TASK-158a
titulo: "los textos de cada camino exigen 4D y buscar todos los usos (parte a de TASK-158)"
tipo: feature
sprint: 0
etiquetas: [regla-4d]
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-24
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-158 (Regla 4D preventiva en todos los procesos que crean o actualizan codigo), partes TASK-158a, TASK-158b, TASK-158c en la rama feature/task-158-regla-4d-preventiva-en-todos-los-proceso.

revision.md (Regla 4D: todos los usos antes de dar una duplicacion por
resuelta; correcciones y MENORES pasan la misma autorrevision), start,
review (paso 4: autorrevision por ronda y antes de verificar-menores), los
cinco roles del brainstorm y el unificador, y el inventario en la tarea.

Objetivo de la tarea entera:

> Que la Regla 4D (sin duplicacion, desviacion, diluvio ni disfraz) se aplique al escribir codigo y no solo al auditarlo: cada camino del plugin que crea o modifica codigo (plan, implementacion tras start, correcciones de cada ronda, verificar-menores, hotfix y release, agentes del brainstorm, doctor-deploy y skills revisoras) la exige y la comprueba. Decision de Carlos: requisito para publicar la 0.19.0.

## Criterios de aceptacion

- [ ] Hay un inventario en la tarea de cada camino que crea o actualiza codigo, con que exige hoy de 4D y que le falta
- [ ] La skill o el agente de cada camino del inventario exige 4D al escribir, incluido buscar todos los usos antes de dar una duplicacion por resuelta
- [ ] Un test por camino (skills y agentes) falla si ese camino deja de exigir 4D

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T02:09:52Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T02:11:48Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T02:11:53Z | start | automatico | persona | 0.18.0 |
