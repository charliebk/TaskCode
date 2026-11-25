---
id: TASK-150a
titulo: "textos que contradicen al codigo o a la Regla 4D (parte a de TASK-150)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-22
actualizado: 2026-11-25
dependencias: []
---
## Objetivo

Parte a del troceo de TASK-150 (Regla 4D: skills y agentes con una sola fuente por regla), partes TASK-150a, TASK-150b, TASK-150c, TASK-150d en la rama fix/task-150-regla-4d-skills-y-agentes-con-una-sola-f.

CONT-01, 02, 03, 04, 09, 16 y 18: sincronizacion.md, cierre.md, review y
tests-pesados, las revisoras que piden contexto y la descripcion de la de
C#, con cada sitio que repita esas frases.

Objetivo de la tarea entera:

> Que cada regla de las skills y agentes este escrita en un solo sitio y coincida con el codigo (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CONT-01 a CONT-18 y CORE2-03).

## Criterios de aceptacion

- [ ] sincronizacion.md, cierre.md, review y tests-pesados dicen lo mismo que el codigo y que revision.md (clave desconocida avisa, finish avisa de casillas, test duplicado sigue la Regla 4D); las revisoras no piden contexto explicitamente
- [ ] La descripcion de cada revisora coincide con el reparto real (solo patrones de fichero) y ningun caso sale con dos severidades
- [ ] Un test por regla falla si vuelve la frase contradictoria

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-25T07:34:54Z | plan | automatico | persona | 0.18.0 |
| 2026-11-25T07:35:40Z | approve | automatico | persona | 0.18.0 |
| 2026-11-25T07:35:42Z | start | automatico | persona | 0.18.0 |
